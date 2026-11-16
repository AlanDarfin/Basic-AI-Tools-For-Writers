'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/v3/core.js','src/v8/format-blocks.js','src/v13/prose-rhythm.js'].map(name=>fs.readFileSync(name,'utf8')).join('\n');
const plain=x=>JSON.parse(JSON.stringify(x));
class Element{
 constructor(tag='div',opts={}){this.tag=tag;this.opts=opts;this.children=[];this.listeners={};}
 createEl(tag,opts){const child=new Element(tag,opts);this.children.push(child);return child;}
 addClass(cls){this.cls=cls;}
 empty(){this.children=[];}
 addEventListener(event,callback){this.listeners[event]=callback;}
 all(tag){return [...(this.tag===tag?[this]:[]),...this.children.flatMap(child=>child.all(tag))];}
}
function fixture(text,selection='',offset=0){
 const notices=[],modals=[],edits=[];
 const api=vm.runInNewContext(source+`\n({writerProseMask,writerProseAnalyze,writerProseSnapshot,writerProseJump,writerProseModal})`,{
  require:()=>({getLanguage:()=> 'pt-BR'}),
  Notice:class{constructor(text){notices.push(text);}},
  Modal:class{
   constructor(){this.contentEl=new Element();modals.push(this);}
   setTitle(title){this.title=title;}
   open(){this.onOpen();}
   close(){this.closed=true;this.onClose();}
  }
 });
 const editor={text,getValue(){return this.text;},getSelection:()=>selection,getCursor:dir=>{
  assert.equal(dir,'from');return {ch:offset};},
  posToOffset:pos=>pos.ch,offsetToPos:ch=>({ch}),setSelection:(a,b)=>edits.push([a.ch,b.ch]),
  scrollIntoView:range=>edits.push(range),focus:()=>edits.push('focus')};
 const file={path:'Livro/A.md'},view={file,editor};
 const plugin={app:{workspace:{activeLeaf:{view}},vault:{getAbstractFileByPath:path=>path===file.path?file:null}}};
 return {api,editor,file,view,plugin,notices,edits,modals};
}
const words=n=>Array.from({length:n},(_,i)=>'palavra'+(i+1)).join(' ');
test('ignores frontmatter, headings, fenced blocks, comments, embeds and URLs without shifting offsets',()=>{
 const quote='Ação e coração.';
 const text='\uFEFF---  \r\ntitle: Nunca aparece\r\n...\r\n# Cabeçalho\r\n\r\n```js\r\nconst código = 1;\r\n```\r\n'+
  '%% invisível %%\r\n<!-- invisível também -->\r\n![[image.png]]\r\nhttps://exemplo.com/abcd\r\n'+quote;
 const {api}=fixture(''),masked=api.writerProseMask(text),data=api.writerProseAnalyze(masked);
 assert.equal(masked.length,text.length);
 assert.equal(masked.indexOf(quote),text.indexOf(quote));
 assert.equal(data.words,3);
 assert.equal(data.paragraphCount,1);
 assert.equal(data.sentenceCount,1);
});
test('selection retains Markdown context, original UTF-16 positions, and a 200K analysis cap',()=>{
 const code='sem prosa nenhuma';
 const text='🪶\n~~~js\n'+code+'\n~~~\nAqui começa.';
 const h=fixture(text,code,text.indexOf(code));
 const snapshot=h.api.writerProseSnapshot(h.editor);
 assert.equal(snapshot.offset,text.indexOf(code));
 assert.equal(snapshot.selection,true);
 assert.equal(snapshot.text.trim(),'');
 const prose='Aqui começa.';
 const v=fixture(text,prose,text.indexOf(prose));
 assert.equal(v.api.writerProseSnapshot(v.editor).text,prose);
 const bad=fixture(text,'não corresponde',2);
 assert.throws(()=>bad.api.writerProseSnapshot(bad.editor),/único trecho/);
 const long=fixture('A '.repeat(100005));
 assert.equal(long.api.writerProseSnapshot(long.editor).truncated,true);
 assert.equal(long.api.writerProseSnapshot(long.editor).text.length,200000);
});
test('thresholds, dialogue boundaries, known abbreviations and punctuation produce useful approximate counts',()=>{
 const text='O Dr. Marques pagou 3.50.\n— Ela saiu… Voltou?\n— Voltei!\n\n'+words(13)+'. '+words(25)+'!\n\n'+words(81)+'.';
 const {api}=fixture(text),data=api.writerProseAnalyze(api.writerProseMask(text));
 assert.equal(data.paragraphCount,5);
 assert.equal(data.sentenceCount,7);
 assert.deepEqual(plain(data.buckets),[4,1,2]);
 assert.equal(data.longestSentences[0].words,81);
 assert.equal(data.longestSentences[1].words,25);
 assert.equal(data.longestParagraphs[0].words,81);
 assert.equal(data.longParagraphCount,1);
 assert.equal(text.slice(data.longestSentences[1].from,data.longestSentences[1].to),words(25)+'!');
});
test('findings stay bounded while counts include every eligible sentence and paragraph',()=>{
 const text=Array.from({length:18},(_,i)=>words(82+i)+'.').join('\n\n');
 const {api}=fixture(text),data=api.writerProseAnalyze(text);
 assert.equal(data.sentenceCount,18);
 assert.equal(data.longParagraphCount,18);
 assert.equal(data.longestParagraphs.length,12);
 assert.equal(data.longestSentences.length,12);
 assert.equal(data.longestSentences[0].words,99);
});
test('jump selects source offsets without writing and refuses stale editors, files or text',()=>{
 const text='🪶 prólogo\n'+words(30)+'.',start=text.indexOf('palavra1');
 const h=fixture(text,text.slice(start),start),{api,plugin,view,editor,file,edits,notices}=h;
 const snapshot={...api.writerProseSnapshot(editor),file};
 const found=api.writerProseAnalyze(snapshot.text).longestSentences[0];
 assert.equal(api.writerProseJump(plugin,view,editor,snapshot,found),true);
 assert.deepEqual(edits[0],[start,text.length]);
 editor.text+=' alterado';
 assert.equal(api.writerProseJump(plugin,view,editor,snapshot,found),false);
 editor.text=text;plugin.app.workspace.activeLeaf={view:{}};
 assert.equal(api.writerProseJump(plugin,view,editor,snapshot,found),false);
 assert.equal(edits.length,2);
 assert.equal(notices.length,2);
});
test('modal exposes the old repetition tool, exact click target and mobile-friendly no-focus navigation',()=>{
 const text='Noite quieta, noite escura. '+words(30)+'.';
 const h=fixture(text);
 h.plugin.app.isMobile=true;
 h.api.writerProseModal(h.plugin,h.editor,h.view);
 const modal=h.modals[0];
 assert.equal(modal.title,'Ritmo e repetições');
 assert.deepEqual(modal.contentEl.all('progress').map(item=>item.opts.attr.value),['1','0','1']);
 assert.ok(modal.contentEl.all('summary').some(item=>item.opts.text==='Repetições'));
 const button=modal.contentEl.all('button').find(item=>item.opts.text.startsWith('noite'));
 assert.ok(button?.listeners.click);
 button.listeners.click();
 assert.deepEqual(h.edits[0],[14,19]);
 assert.equal(h.edits.includes('focus'),false);
 assert.equal(modal.closed,true);
});
