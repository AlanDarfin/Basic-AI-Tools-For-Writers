'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/format-blocks.js','utf8')+'\n'+fs.readFileSync('src/v8/block-edit.js','utf8');
class TFile{
 constructor(path){this.path=path;this.extension='md';this.stat={mtime:1,size:0};}
}
const api=vm.runInNewContext(source+'\n({writerV8FenceReplace,writerV8FenceCandidate,writerV8CaptureFenced,writerV8CommitFenced,writerV8ReplaceCardBody,writerV8ReadCard,writerV131WritingAnalysis,writerV131BeatLines})',{
 TFile,writerUi:(pt,en)=>en
});
const section=(lineStart,lineEnd)=>({getSectionInfo:()=>({lineStart,lineEnd})});
test('editing the second adjacent identical block leaves the first block unchanged',()=>{
 for(const type of ['editor-note','scene-card','character-voice','beat-sheet','tabs','writer-tabs']){
  const block='```'+type+'\nsame\n```',original=block+'\n'+block+'\n';
  const updated=api.writerV8FenceReplace(original,type,section(3,5),null,'same','UPDATED');
  assert.equal(updated,block+'\n```'+type+'\nUPDATED\n```\n');
 }
});
test('stale or invalid section coordinates never fall back to a neighbouring matching block',()=>{
 const original='```editor-note\nCHANGED\n```\n```editor-note\nsame\n```';
 for(const ctx of [section(0,2),section(1,3),section(-1,2),section(0,99),section(3,6),{}]){
  assert.throws(()=>api.writerV8FenceReplace(original,'editor-note',ctx,null,'same','oops'),/changed|not found/);
 }
 assert.throws(()=>api.writerV8FenceReplace('```editor-note\nsame\n```\nrest', 'editor-note',section(0,3),null,'same','oops'),/changed|not found/);
});
test('edited nested Markdown cannot close the outer backtick or tilde fence',()=>{
 for(const marker of ['`','~']){
  const original='Before\n'+marker.repeat(3)+'editor-note title\nold\n'+marker.repeat(3)+'\nAfter\n';
  const body='before\n'+marker.repeat(3)+'js\ninner\n'+marker.repeat(5)+'\nafter';
  const result=api.writerV8FenceReplace(original,'editor-note',section(1,3),null,'old',body);
  assert.equal(result,'Before\n'+marker.repeat(6)+'editor-note title\n'+body+'\n'+marker.repeat(6)+'\nAfter\n');
  const found=api.writerV8FenceCandidate(result,'editor-note',{lineStart:1,lineEnd:7},body);
  assert.ok(found,'The complete new body stays inside one outer fenced block');
 }
});
test('fenced saves preserve indentation, CRLF and all content outside the block',()=>{
 const original='Before\r\n  ~~~editor-note extra\r\n  old\r\n  ~~~  \r\nAfter\r\n';
 const result=api.writerV8FenceReplace(original,'editor-note',section(1,3),null,'old','new\n  indented\n~~~');
 assert.equal(result,'Before\r\n  ~~~~editor-note extra\r\n  new\r\n    indented\r\n  ~~~\r\n  ~~~~  \r\nAfter\r\n');
 assert.ok(api.writerV8FenceCandidate(result,'editor-note',{lineStart:1,lineEnd:5},'new\n  indented\n~~~'));
});
test('bounded blocks with more than 1200 short lines remain editable',()=>{
 const body=Array(1500).fill('x').join('\n');
 const original='```editor-note\n'+body+'\n```';
 assert.equal(api.writerV8FenceReplace(original,'editor-note',section(0,1501),null,body,'new'),'```editor-note\nnew\n```');
 assert.throws(()=>api.writerV8FenceReplace(original,'editor-note',section(0,1501),null,body,'x'.repeat(32001)),/32K/);
});
function vaultFixture(initial){
 const file=new TFile('Book.md');file.stat.size=initial.length;let text=initial;
 const vault={getAbstractFileByPath:path=>path===file.path?file:null,
  read:async()=>text,process:async(note,change)=>{assert.equal(note,file);text=change(text);}};
 return {plugin:{app:{vault}},file,get text(){return text;},set text(value){text=value;}};
}
test('an editor-open snapshot rejects an identical block inserted at the old coordinates',async()=>{
 const block='```editor-note\nsame\n```',fixture=vaultFixture(block),ctx={...section(0,2),sourcePath:'Book.md'};
 const baseline=api.writerV8CaptureFenced(fixture.plugin,ctx);await baseline;
 fixture.text=block+'\n'+block;
 await assert.rejects(api.writerV8CommitFenced(fixture.plugin,ctx,null,'editor-note','same','UPDATED',baseline),/Note changed/);
 assert.equal(fixture.text,block+'\n'+block);
});
test('snapshot validation is atomic and detects same-size concurrent edits elsewhere in the note',async()=>{
 const original='Old\n```editor-note\nsame\n```',fixture=vaultFixture(original),ctx={...section(1,3),sourcePath:'Book.md'};
 const baseline=api.writerV8CaptureFenced(fixture.plugin,ctx);await baseline;
 const process=fixture.plugin.app.vault.process;
 fixture.plugin.app.vault.process=async(file,change)=>{fixture.text=original.replace('Old','New');return process(file,change);};
 await assert.rejects(api.writerV8CommitFenced(fixture.plugin,ctx,null,'editor-note','same','UPDATED',baseline),/Note changed/);
 assert.equal(fixture.text,original.replace('Old','New'));
});
test('unchanged snapshot saves successfully, but a file renamed during the read is rejected',async()=>{
 const original='```editor-note\nsame\n```',fixture=vaultFixture(original),ctx={...section(0,2),sourcePath:'Book.md'};
 const baseline=api.writerV8CaptureFenced(fixture.plugin,ctx);await baseline;
 assert.equal(await api.writerV8CommitFenced(fixture.plugin,ctx,null,'editor-note','same','UPDATED',baseline),'UPDATED');
 assert.equal(fixture.text,'```editor-note\nUPDATED\n```');
 fixture.plugin.app.vault.read=async()=>{fixture.file.path='Other.md';return fixture.text;};
 const renamed=await api.writerV8CaptureFenced(fixture.plugin,ctx);
 assert.match(renamed.error.message,/Note changed/);
});
test('card edits replace the original body exactly once with or without a metadata separator',()=>{
 for(const eol of ['\n','\r\n']){
  for(const original of ['title: Ana\n---\nOld body','title: Ana\nOld body','Old body']){
   const result=api.writerV8ReplaceCardBody(original.replace(/\n/g,eol),'New body');
   const parsed=api.writerV8ReadCard(result);
   assert.equal(parsed.body,'New body');
   assert.equal(parsed.fields.title,original.startsWith('title:')?'Ana':undefined);
   assert.equal(result.includes('Old body'),false);
   assert.equal(result.split('---').length-1,1);
   if(eol==='\r\n'&&original.includes('\n'))assert.equal(/(^|[^\r])\n/.test(result),false);
  }
 }
});
test('repetition review counts composed and decomposed accents as the same original words',()=>{
 const decomposed='CORAÇÃO'.normalize('NFD'),text='coração '+decomposed;
 const result=api.writerV131WritingAnalysis(text);
 assert.equal(result.wordCount,2);assert.equal(result.repeated[0].count,2);assert.equal(result.repeated[0].word,'coração');
 assert.equal(result.near[0].word,decomposed);assert.ok(result.near[0].excerpt.includes(decomposed));
 assert.equal(api.writerV131WritingAnalysis('guarda-chuva '+ 'guarda-chuva'.normalize('NFD')).repeated[0].count,2);
});
test('beat separators preserve spaced wiki aliases, inline code and escaped pipes',()=>{
 const cases=[
  ['[[A note | An alias]]','1','[[A note | An alias]]'],
  ['Opening | [[A note | An alias]]','Opening','[[A note | An alias]]'],
  ['[[A note | An alias]] | Details','[[A note | An alias]]','Details'],
  ['`one | two` | Details','`one | two`','Details'],
  ['``one ` | two`` | Details','``one ` | two``','Details'],
  ['Opening `draft | Details','Opening `draft','Details'],
  ['Opening \\| setup | Details','Opening \\| setup','Details']
 ];
 for(const [input,title,body] of cases){const beat=api.writerV131BeatLines(input)[0];assert.equal(beat.title,title);assert.equal(beat.body,body);}
});
