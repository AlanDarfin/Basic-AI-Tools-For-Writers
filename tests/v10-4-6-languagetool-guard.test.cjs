'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=path=>fs.readFileSync(path,'utf8');
const common={console,Date,Map,Set,Math,setTimeout,clearTimeout,
 writerModuleOn:()=>true,writerUi:(pt,en)=>en,
 MarkdownView:class{},EditorView:{},Setting:class{},Notice:class{}};
const {writerV406ReviewGuard}=vm.runInNewContext(
 src('src/v4/integrations.js')+'\n({writerV406ReviewGuard})',common);
const {WriterCursorMemory,writerCursorMerge}=vm.runInNewContext(
 src('src/v4/cursor-memory.js')+'\n({WriterCursorMemory,writerCursorMerge})',common);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('LanguageTool suggestion menu is compact and pauses cursor/typewriter tracking',()=>{
 const scrollDOM={scrollTop:780,scrollLeft:20},cm={dom:{},scrollDOM};
 let resets=0,cancels=0;
 const settings={};writerCursorMerge(settings);
 const plugin={settings,
  app:{workspace:{getActiveViewOfType:()=>({editor:{cm}}),getLeavesOfType:()=>[]}},
  writerV4Extras:{resetTypewriterHighlights:()=>{resets++;}},
  writerCursorMemory:{cancelPendingForEditor:()=>{cancels++;}},
  saveSettings:async()=>{}};
 const guard=writerV406ReviewGuard(plugin);
 plugin.writerReviewInteractionGuard=guard;
 assert.equal(guard.isSuspended(),false);
 const classes=new Set();
 const menu={
  classList:{contains:c=>classes.has(c),add:c=>classes.add(c)},
  querySelector:()=>null,
  textContent:'miséria, misérias, míssera — Adicionar ao dicionário — Ignorar ocorrência'
 };
 assert.equal(guard.markMenu(menu),true);
 assert.equal(classes.has('writer-v406-lt-compact'),true);
 assert.equal(guard.markMenu(menu),false,'class is added once');
 assert.equal(guard.isSuspended(),true);
 assert.ok(resets>=1);
 assert.ok(cancels>=1);
 const css=src('src/styles/v10-2-workflow.css');
 assert.match(css,/\.menu\.writer-v406-lt-compact/);
 assert.match(css,/\.writer-review-floating \.writer-lt-choices/);
 guard.typing();
 assert.equal(guard.isSuspended(),false,'Typing immediately re-enables tracking');
});
test('Accepting a correction by mouse preserves visible scroll rather than restoring stale cursor',async()=>{
 const scrollDOM={scrollTop:700,scrollLeft:14},cm={dom:{},scrollDOM};
 const settings={};writerCursorMerge(settings);
 const plugin={settings,
  app:{workspace:{getActiveViewOfType:()=>({editor:{cm}}),getLeavesOfType:()=>[]}},
  writerV4Extras:{resetTypewriterHighlights:()=>{}},
  writerCursorMemory:{cancelPendingForEditor:()=>{}},
  saveSettings:async()=>{}};
 const guard=writerV406ReviewGuard(plugin);
 plugin.writerReviewInteractionGuard=guard;
 guard.captureScroll();
 assert.equal(guard.isSuspended(),true);
 scrollDOM.scrollTop=0;scrollDOM.scrollLeft=0;
 assert.equal(guard.applyScroll(cm),true);
 await sleep(20);
 assert.equal(scrollDOM.scrollTop,700);
 assert.equal(scrollDOM.scrollLeft,14);
 const memory=new WriterCursorMemory(plugin);
 const file={path:'Book.md',extension:'md'};
 const editor={
  cm,lines:['Header','Text'],
  getCursor:()=>({line:0,ch:0}),lineCount:()=>2,
  getLine:index=>index===0?'Header':'Text',
  getScrollInfo:()=>({top:scrollDOM.scrollTop,left:scrollDOM.scrollLeft})
 };
 const view={file,editor,leaf:{getViewState:()=>({state:{}})}};
 assert.equal(memory.capture(view),false,'Popup does not overwrite stored position');
 memory.entries[file.path]={head:{line:0,ch:0},anchor:{line:0,ch:0},top:0,left:0};
 memory.restore(view);
 assert.equal(memory.pending.has(view),false,'Popup does not schedule delayed restoration');
 guard.typing();
 assert.equal(guard.isSuspended(),false);
 assert.equal(memory.capture(view),true,'Typing reactivates bookmark capture');
 if(memory.flushTimer)clearTimeout(memory.flushTimer);
});
test('Typewriter reacts to deliberate keyboard edits but not suggestion mouse actions',()=>{
 const code=src('src/v4/integrations.js');
 assert.match(code,/this\.onPointer=event=>\{/);
 assert.match(code,/this\.setInteracting\(false\)/);
 assert.match(code,/this\.onBeforeInput=\(\)=>\{owner\.plugin\.writerReviewInteractionGuard\?\.typing/);
 assert.match(code,/guard\?\.isSuspended\?\.\(\)/);
 assert.match(src('src/v4/cursor-memory.js'),/writerReviewInteractionGuard\?\.isSuspended/);
});
