'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('src/v4/cursor-memory.js','utf8');
const {writerCursorMerge,writerCursorClamp,WriterCursorMemory}=vm.runInNewContext(src+'\n({writerCursorMerge,writerCursorClamp,WriterCursorMemory})',{
 writerModuleOn:()=>true,writerUi:(pt,en)=>en,
 MarkdownView:class{},EditorView:{},Setting:class{},Notice:class{},
 console,setTimeout,clearTimeout
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const settings={};
 writerCursorMerge(settings);
 assert.equal(settings.cursorMemory.enabled,true);
 assert.equal(settings.cursorMemory.maxEntries,500);
 let saves=0;
 const plugin={settings,saveSettings:async()=>{saves++;},app:{workspace:{getLeavesOfType:()=>[]}}};
 const memory=new WriterCursorMemory(plugin);
 const editor={
  lines:['Alpha','Bravo longer','Charlie'],
  cursor:{line:0,ch:0},anchor:{line:0,ch:0},scroll:{top:12,left:0},
  getCursor(side){return side==='anchor'?this.anchor:this.cursor;},
  getLine(n){return this.lines[n];},lineCount(){return this.lines.length;},
  getScrollInfo(){return this.scroll;},
  setSelection(anchor,head){this.anchor=anchor;this.cursor=head;},
  scrollTo(left,top){this.scroll={left,top};}
 };
 const view={file:{path:'Books/Chapter.md',extension:'md'},editor,leaf:{getViewState:()=>({state:{}})}};
 editor.cursor={line:1,ch:9};editor.anchor={line:0,ch:2};editor.scroll={left:4,top:320};
 assert.equal(memory.capture(view),true);
 assert.equal(memory.entries[view.file.path].head.ch,9);
 assert.equal(memory.entries[view.file.path].anchor.ch,2);
 editor.cursor={line:0,ch:0};editor.anchor={line:0,ch:0};editor.scroll={left:0,top:0};
 memory.restore(view);
 await sleep(200);
 assert.equal(editor.cursor.line,1);
 assert.equal(editor.cursor.ch,9);
 assert.equal(editor.anchor.ch,2);
 assert.equal(editor.scroll.top,320);
 console.log('PASS cursor, selection and scroll restored for reopened note');

 const anchorView={...view,leaf:{getViewState:()=>({state:{subpath:'#Heading'}})}};
 editor.cursor={line:0,ch:0};
 memory.restore(anchorView);
 await sleep(120);
 assert.equal(editor.cursor.line,0);
 console.log('PASS heading anchor navigation is not overwritten');

 assert.deepEqual(JSON.parse(JSON.stringify(writerCursorClamp({line:44,ch:100},editor))),{line:2,ch:7});
 assert.deepEqual(JSON.parse(JSON.stringify(writerCursorClamp({line:-9,ch:-3},editor))),{line:0,ch:0});
 console.log('PASS stale positions are clamped safely after document edits');

 settings.cursorMemory.maxEntries=50;
 for(let i=0;i<52;i++)memory.entries['Book/'+i+'.md']={head:{line:0,ch:0},updatedAt:i+1};
 memory.trim();
 assert.ok(Object.keys(memory.entries).length<=50);
 console.log('PASS bookmarks are bounded');

 const css=fs.readFileSync('styles.css','utf8'),integration=fs.readFileSync('src/v4/integrations.js','utf8'),bundle=fs.readFileSync('main.js','utf8');
 assert.ok(integration.includes("Decoration.line({class:'writer-v4-typewriter-current-line'})"));
 assert.ok(css.includes('.cm-line.writer-v4-typewriter-current-line'));
 assert.ok(css.includes('.cm-line:not(.writer-v4-typewriter-current-line)'));
 assert.ok(bundle.includes('class WriterCursorMemory'));
 assert.ok(bundle.includes('this.writerCursorMemory.register()'));
 assert.ok(bundle.includes('this.plugin.writerCursorMemory.renderSettings(panel)'));
 console.log('PASS active-line decoration and integrated settings bundled');
 await memory.stop();assert.ok(saves>0);
 console.log('PASS cursor data flushed on shutdown');
})().catch(e=>{console.error(e);process.exitCode=1;});
