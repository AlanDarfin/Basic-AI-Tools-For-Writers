'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');this.parent={path:path.split('/').slice(0,-1).join('/')};}}
const source=fs.readFileSync('src/v6/longform-navigation.js','utf8');
const index=new TFile('Book/Index.md');
const ordered=[
 {title:'A',indent:0},{title:'A.1',indent:1},{title:'A.2',indent:1},
 {title:'B',indent:0},{title:'B.1',indent:1},
 {title:'C',indent:0},{title:'C.1',indent:1},{title:'C.1a',indent:2},{title:'C.2',indent:1}
];
const files=[index,...ordered.map(x=>new TFile('Book/Chapters/'+x.title+'.md'))];
const app={vault:{
 getMarkdownFiles:()=>files,
 getAbstractFileByPath:path=>files.find(f=>f.path===path)||null
}};
const pluginProject={file:index,title:'Book',format:'scenes',meta:{sceneFolder:'Chapters'},scenes:ordered};
const ui=vm.runInNewContext(source+'\n({writerBookNavMerge,writerBookNavFindSceneFile,writerBookNavFlatten,writerBookNavTargets,writerBookNavFindProject,writerBookNavButtons,writerBookNavRender})',{
 TFile,
 lfPath:(...segments)=>segments.filter(Boolean).join('/').replace(/\/+/g,'/'),
 lfFlattenScenes:scenes=>scenes,
 longformIndex:file=>file.path===index.path?pluginProject:null,
 writerModuleOn:()=>true,
 writerUi:(pt,en)=>en||pt,
 Notice:class{},Setting:class{},console
});
let passed=0;function test(label,fn){fn();passed++;console.log('PASS',label);}
const scenes=ui.writerBookNavFlatten(pluginProject,app);
const path=t=>'Book/Chapters/'+t+'.md';
test('index order, nested depths and paths match Longform rather than lexical sort',()=>{
 assert.deepEqual(Array.from(scenes,x=>x.title),ordered.map(x=>x.title));
 assert.equal(scenes[7].indent,2);
 assert.equal(scenes[7].path,path('C.1a'));
});
test('main chapter offers next ordinary chapter and first subchapter separately',()=>{
 const targets=ui.writerBookNavTargets(scenes,path('A'));
 assert.equal(targets.nextMain.path,path('B'));
 assert.equal(targets.nextSub.path,path('A.1'));
 assert.equal(targets.previousMain,null);
});
test('subchapter offers parent, previous sibling and next main chapter',()=>{
 const targets=ui.writerBookNavTargets(scenes,path('A.2'));
 assert.equal(targets.previousMain.path,path('A'));
 assert.equal(targets.previousSub.path,path('A.1'));
 assert.equal(targets.nextMain.path,path('B'));
 assert.equal(targets.nextSub,null);
});
test('later ordinary chapter links to previous subchapter and next chapter',()=>{
 const targets=ui.writerBookNavTargets(scenes,path('B'));
 assert.equal(targets.previousMain.path,path('A'));
 assert.equal(targets.previousSub.path,path('A.2'));
 assert.equal(targets.nextSub.path,path('B.1'));
 assert.equal(targets.nextMain.path,path('C'));
});
test('two-level subchapter navigation supports previous/next at same depth',()=>{
 const c=ui.writerBookNavTargets(scenes,path('C.1'));
 assert.equal(c.nextSub.path,path('C.2'));
 const deepest=ui.writerBookNavTargets(scenes,path('C.1a'));
 assert.equal(deepest.previousMain.path,path('C.1'));
 assert.equal(deepest.nextMain,null);
});
test('only existing chapter files are rendered; no fabricated links',()=>{
 const filtered=files.filter(f=>f.path!==path('A.2'));
 const vault={...app.vault,getAbstractFileByPath:p=>filtered.find(x=>x.path===p)||null};
 const list=ui.writerBookNavFlatten(pluginProject,{vault});
 assert.equal(list[2].path,null);
 const targets=ui.writerBookNavTargets(list,path('A.1'));
 assert.equal(targets.nextSub,null);
 assert.equal(ui.writerBookNavTargets(list,'Other/note.md'),null);
});
test('project discovery only matches Longform scene path, not unrelated Markdown',()=>{
 const found=ui.writerBookNavFindProject(app,path('B.1'),index.path);
 assert.equal(found.index.file.path,index.path);
 assert.equal(ui.writerBookNavFindProject(app,'Other.md',index.path),null);
});
test('navigation toggle and main/sub filtering keep distinct targets',()=>{
 const settings={bookNavigation:{enabled:true,showMain:false,showSub:true}};
 ui.writerBookNavMerge(settings);
 const targets=ui.writerBookNavTargets(scenes,path('A'));
 const buttons=ui.writerBookNavButtons(targets,settings.bookNavigation);
 assert.deepEqual(Array.from(buttons,x=>x.kind),['sub']);
 assert.equal(buttons[0].target.title,'A.1');
});
(async()=>{
 const cursor=fs.readFileSync('src/v4/cursor-memory.js','utf8');
 const effects=[],scrollCalls=[];
 const EditorView={scrollIntoView:(at,opt)=>({at,opt})};
 const memoryAPI=vm.runInNewContext(cursor+'\n({WriterCursorMemory,writerCursorMerge})',{writerModuleOn:()=>true,writerUi:(a,b)=>b||a,MarkdownView:class{},EditorView,console,setTimeout,clearTimeout,Setting:class{},Notice:class{}});
 const settings={cursorPositions:{'Book/Chapters/A.md':{head:{line:2,ch:2},anchor:{line:2,ch:2},left:0,top:420}}};
 memoryAPI.writerCursorMerge(settings);
 const editor={
  lines:['first','second','third'],
  cursor:{line:0,ch:0},
  getCursor(){return this.cursor;},getLine(n){return this.lines[n];},lineCount(){return this.lines.length;},
  setSelection(_anchor,head){this.cursor=head;},scrollTo(x,y){scrollCalls.push({x,y});},
  cm:{state:{doc:{lines:3,line:n=>({from:(n-1)*10})}},dispatch:payload=>effects.push(payload)}
 };
 const view={file:{path:'Book/Chapters/A.md'},editor,leaf:{getViewState:()=>({state:{}})}};
 const plugin={settings,app:{isMobile:true,workspace:{getLeavesOfType:()=>[]}},saveSettings:async()=>{}};
 const memory=new memoryAPI.WriterCursorMemory(plugin);memory.pendingTimers=new Set();
 memory.restore(view);
 await new Promise(resolve=>setTimeout(resolve,240));
 assert.equal(editor.cursor.line,2);
 assert.equal(memory.capture(view),false,'do not clobber bookmark while restoration is pending');
 await new Promise(resolve=>setTimeout(resolve,390));
 assert.ok(scrollCalls.length>=1);
 assert.ok(effects.some(e=>e.effects.at===22),'CM6 should receive scrollIntoView for selected line');
 await memory.stop();
 console.log('PASS mobile cursor scroll effect retries after viewport settles');
 const main=fs.readFileSync('main.js','utf8'),build=fs.readFileSync('scripts/build-v3.js','utf8');
 assert.ok(main.includes('// v3 module: src/v6/longform-navigation.js'));
 assert.ok(main.includes('new WriterBookNavigation(this)'));
 assert.ok(build.includes("'v6/longform-navigation'"));
 console.log('PASS v6 beta2 code is included in Obsidian build');
 console.log(passed+2+' v6 navigation and mobile cursor regressions passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
