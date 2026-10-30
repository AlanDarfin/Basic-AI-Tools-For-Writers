'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const base=fs.readFileSync('src/v3/core.js','utf8')+'\n'+fs.readFileSync('src/v3/snapshots.js','utf8');
const code=base+'\n'+fs.readFileSync('src/v4/editor.js','utf8');
const api=vm.runInNewContext(code+'\n({writerV4Merge,writerV4Profile,writerV4ProfilePrompt,writerV4ProtectedTokens,writerV4AssertProtected,writerV4Hunks,writerV4MergeHunks,writerV4StripFence,writerSafeReplace})',{console,require:()=>({getLanguage:()=> 'pt'}),Uint8Array,Uint16Array});
const {writerV4Merge,writerV4Profile,writerV4ProfilePrompt,writerV4ProtectedTokens,writerV4AssertProtected,writerV4Hunks,writerV4MergeHunks,writerV4StripFence,writerSafeReplace}=api;
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
test('v4 settings migrate without deleting legacy keys',()=>{
  const settings={schemaVersion:3,projectsData:{book:{goal:12000}},aiKeys:{openai:'secret'}};
  writerV4Merge(settings);
  assert.equal(settings.schemaVersion,4);assert.equal(settings.projectsData.book.goal,12000);assert.equal(settings.aiKeys.openai,'secret');
  assert.equal(settings.writerV4.protectMarkdown,true);assert.ok(Array.isArray(settings.writerV4.profiles));
});
test('invalid profiles and too-long settings are sanitized',()=>{
  const s={writerV4:{profiles:[null,1,{name:'Book',folder:'Novels',instructions:'voice'}],maxSelectedChars:100000}};
  writerV4Merge(s);assert.equal(s.writerV4.profiles.length,1);assert.equal(s.writerV4.maxSelectedChars,8000);
});
test('frontmatter overrides directory and folder matching respects slash boundaries',()=>{
  const settings={writerV4:{profiles:[{name:'Fantasy',folder:'Books',instructions:'Mythic voice'},{name:'Diary',folder:'Books/Diary',instructions:'Personal voice'},{name:'Secret',folder:'',instructions:'Private voice'}]}};
  const plugin={settings,app:{metadataCache:{getFileCache:()=>({frontmatter:{}})}}};
  const file={path:'Books/Diary/2026.md',extension:'md'};
  assert.equal(writerV4Profile(plugin,file).name,'Diary');
  plugin.app.metadataCache.getFileCache=()=>({frontmatter:{'basic-ai-profile':'Secret'}});
  assert.equal(writerV4Profile(plugin,file).name,'Secret');
  assert.ok(writerV4ProfilePrompt(plugin,file).includes('Private voice'));
  plugin.app.metadataCache.getFileCache=()=>({frontmatter:{}});
  assert.equal(writerV4Profile(plugin,{path:'Bookshelf/Diary.md',extension:'md'}),null);
});
test('hunks apply only accepted changes in the right order',()=>{
  const before='One\nTwo\nThree\nFour\nFive';
  const after='One\nDeux\nThree\nCuatro\nFive';
  const groups=writerV4Hunks(before,after);
  assert.equal(groups.filter(g=>!g.same).length,2);
  assert.equal(writerV4MergeHunks(groups,new Set([0])),'One\nDeux\nThree\nFour\nFive');
  assert.equal(writerV4MergeHunks(groups,new Set([1])),'One\nTwo\nThree\nCuatro\nFive');
  assert.equal(writerV4MergeHunks(groups,new Set([0,1])),after);
  assert.equal(writerV4MergeHunks(groups,new Set()),before);
});
test('protect Markdown while allowing plain prose revisions',()=>{
  const original='---\ntitle: Hero\n---\nHe walks. [[Place]]\n```js\nconst value = 1;\n```\nRead [a link](https://example.com).';
  writerV4AssertProtected(original,original.replace('He walks.','He runs.'));
  assert.throws(()=>writerV4AssertProtected(original,original.replace('Hero','Villain')));
  assert.throws(()=>writerV4AssertProtected(original,original.replace('[[Place]]','[[Other]]')));
  assert.throws(()=>writerV4AssertProtected(original,original.replace('value = 1','value = 2')));
  assert.throws(()=>writerV4AssertProtected(original,original.replace('example.com','example.net')));
  assert.ok(writerV4ProtectedTokens(original).length>=4);
});
test('too many lines fail gracefully rather than allocate unbounded diff',()=>{
  assert.throws(()=>writerV4Hunks(('line\n').repeat(400),'short'));
});
test('AI fence cleaning strips only full Markdown wrappers',()=>{
  assert.equal(writerV4StripFence('```md\nHello\n```'),'Hello');
  assert.equal(writerV4StripFence('This has `code`'), 'This has `code`');
});
test('standalone bundle includes v4 module, hook and profile settings',()=>{
  const bundled=fs.readFileSync('main.js','utf8');
  for(const expected of ['// v3 module: src/v4/editor.js','writerV4Merge(this.settings);','writerV4RenderSettings(this.plugin,panel);','writerV4ProfilePrompt(this','writerV4AssertProtected(content,translatedText)'])assert.ok(bundled.includes(expected),expected);
});
async function concurrencyTests(){
  const file={path:'Story.md',extension:'md'};
  let current='Hello world',calls=0;
  const editor={getValue:()=>current,replaceRange:()=>{calls++;},offsetToPos:offset=>({line:0,ch:offset})};
  const plugin={
    settings:{snapshots:{enabled:true,snapshotBeforeRewrite:true}},
    writerSnapshots:{create:async()=>{current='Edited elsewhere';}},
    app:{workspace:{getLeavesOfType:()=>[{view:{file,editor}}]}}
  };
  await assert.rejects(writerSafeReplace(plugin,file,0,5,'Hello','Hi','v4 revision'),/mudou durante o snapshot/);
  assert.equal(calls,0);
  count++;console.log('PASS concurrent editor edit is blocked after async snapshot');
  let stored='Hello world';
  const vaultPlugin={
    settings:{snapshots:{enabled:false,snapshotBeforeRewrite:false}},
    app:{
      workspace:{getLeavesOfType:()=>[]},
      vault:{read:async()=>stored,process:async(_file,fn)=>{stored='Other world';stored=fn(stored);}}
    }
  };
  await assert.rejects(writerSafeReplace(vaultPlugin,file,0,5,'Hello','Hi','v4 revision'),/simultaneamente/);
  assert.equal(stored,'Other world');
  count++;console.log('PASS concurrent vault edit cannot be overwritten');
  console.log(count+' v4 tests passed.');
}
concurrencyTests().catch(err=>{console.error(err);process.exitCode=1;});
