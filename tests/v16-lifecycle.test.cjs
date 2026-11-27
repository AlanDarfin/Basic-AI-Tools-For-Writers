'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=(path,name,context={})=>vm.runInNewContext(fs.readFileSync(path,'utf8')+'\n'+name,{console,writerUi:(_pt,en)=>en,writerModuleOn:()=>true,WRITER_V8_HOME_VIEW:'home',...context});
function readingHarness(){
 const frames=new Map(),timers=new Map(),events=new Map(),cleanups=[];let seq=0,ready,scans=0,registered=0;
 const view={requestAnimationFrame(fn){assert.equal(this,view);frames.set(++seq,fn);return seq;},cancelAnimationFrame(id){assert.equal(this,view);frames.delete(id);}};
 const root={ownerDocument:{defaultView:view},querySelectorAll:()=>[]};
 const workspace={containerEl:root,on:(event,fn)=>({event,fn}),onLayoutReady:fn=>{ready=fn;},getLeavesOfType:()=>{scans++;return [];}};
 const plugin={app:{workspace},settings:{v101Suite:{enabled:true}},register:fn=>cleanups.push(fn),registerEvent:({event,fn})=>{registered++;events.set(event,fn);},registerDomEvent:()=>{}};
 const register=load('src/v10/enhancements.js','writerV101ReadingProgressRegister',{setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)});
 return {register,plugin,frames,timers,events,cleanups,ready:()=>ready,scans:()=>scans,registered:()=>registered};
}
test('reading progress coalesces file-open delay and frames and ignores callbacks after unload',()=>{
 const h=readingHarness();h.register(h.plugin);h.register(h.plugin);assert.equal(h.registered(),4);assert.equal(h.cleanups.length,1);
 h.ready()();h.events.get('file-open')();h.events.get('file-open')();
 assert.equal(h.frames.size,1);assert.equal(h.timers.size,1);
 const staleFrame=[...h.frames.values()][0],staleTimer=[...h.timers.values()][0],staleReady=h.ready(),staleRefresh=h.plugin.writerV101ReadingProgressRefresh;
 h.cleanups[0]();assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);assert.equal(h.plugin.writerV101ReadingProgressRefresh,undefined);
 staleFrame();staleTimer();staleReady();staleRefresh();assert.equal(h.scans(),0);
 h.register(h.plugin);h.ready()();assert.equal(h.frames.size,1);
 staleRefresh();h.cleanups[0]();assert.equal(h.frames.size,1);
 const [id,fn]=[...h.frames.entries()][0];h.frames.delete(id);fn();assert.equal(h.scans(),1);
 h.cleanups[1]();
});
function homeHarness({delayed=false}={}){
 let ready,release,opened=0,detached=0,activated=0,stored=0,commands=0;
 const cleanups=[];let type='markdown';
 const keep={getViewState:()=>({type}),setViewState:()=>delayed?new Promise(resolve=>{release=()=>{type='home';resolve();};}):Promise.resolve(type='home'),detach:()=>{detached++;}};
 const other={getViewState:()=>({type:'markdown'}),setViewState:()=>{},detach:()=>{detached++;}};
 const workspace={layoutReady:false,activeLeaf:keep,containerEl:{ownerDocument:{defaultView:{sessionStorage:{getItem:()=>null,setItem:()=>stored++}}}},iterateRootLeaves:fn=>[keep,other].forEach(fn),onLayoutReady:fn=>{ready=fn;},setActiveLeaf:()=>activated++};
 const plugin={app:{workspace},settings:{v8Finish:{homeCleanStart:true}},register:fn=>cleanups.push(fn),addCommand:()=>commands++};
 const register=load('src/v10/startup-cleanup.js','writerV106HomeRegisterStartup');
 return {register,plugin,cleanups,ready:()=>ready,release:()=>release?.(),open:async()=>{opened++;},stats:()=>({opened,detached,activated,stored,commands})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('startup callback is inert after unloading before layout and registration is idempotent',async()=>{
 const h=homeHarness();h.register(h.plugin,h.open);h.register(h.plugin,h.open);
 assert.equal(h.stats().commands,1);h.cleanups[0]();h.ready()();await flush();
 assert.deepEqual(h.stats(),{opened:0,detached:0,activated:0,stored:0,commands:1});
 assert.equal(h.plugin._writerV106HomeStarting,false);
});
test('startup cleanup does not detach tabs after unload during awaited activation',async()=>{
 const h=homeHarness({delayed:true});h.register(h.plugin,h.open);h.ready()();await flush();
 assert.equal(h.stats().stored,1);h.cleanups[0]();h.release();await flush();
 assert.equal(h.stats().detached,0);assert.equal(h.stats().activated,0);
 assert.equal(h.plugin._writerV106HomeStarting,false);
});
test('active startup still closes other root tabs once and preserves the selected home',async()=>{
 const h=homeHarness();h.register(h.plugin,h.open);h.ready()();h.ready()();await flush();
 assert.deepEqual(h.stats(),{opened:0,detached:1,activated:1,stored:1,commands:1});
 assert.equal(h.plugin._writerV106HomeStarted,true);
});

test('native method patches restore in either disposal order and preserve receiver and return value',()=>{
 const patch=load('src/v9/context-toolbar.js','writerV16PatchMethod');
 for(const reverse of [false,true]){
  const calls=[],native=function(value){calls.push(['native',this,value]);return value+1;};
  const target={show:native},receiver={};
  const a=patch(target,'show',(next,self,args)=>{calls.push('a');return next.apply(self,args);});
  const b=patch(target,'show',(next,self,args)=>{calls.push('b');return next.apply(self,args);});
  assert.equal(target.show.call(receiver,2),3);
  assert.deepEqual(calls,['b','a',['native',receiver,2]]);
  calls.length=0;(reverse?b:a)();target.show.call(receiver,3);
  assert.deepEqual(calls,[reverse?'a':'b',['native',receiver,3]]);
  (reverse?a:b)();a();b();assert.equal(target.show,native);
 }
});
test('disposed native menu patch is inert inside retained third-party wrapper',()=>{
 const patch=load('src/v9/context-toolbar.js','writerV16PatchMethod');
 let nativeCalls=0,basicCalls=0;
 const native=function(){nativeCalls++;return this;},target={show:native};
 const dispose=patch(target,'show',(next,self,args)=>{basicCalls++;return next.apply(self,args);});
 const captured=target.show,external=function(...args){return captured.apply(this,args);};
 target.show=external;dispose();
 assert.equal(target.show,external);assert.equal(target.show(),target);
 assert.equal(basicCalls,0);assert.equal(nativeCalls,1);
 const again=patch(target,'show',(next,self,args)=>{basicCalls++;return next.apply(self,args);});
 assert.equal(target.show(),target);assert.equal(basicCalls,1);again();
 assert.equal(target.show,external);
});
test('native method patch preserves exceptions and tolerates non-writable methods',()=>{
 const patch=load('src/v9/context-toolbar.js','writerV16PatchMethod');
 const error=new Error('native failure'),native=()=>{throw error;},target={show:native};
 const dispose=patch(target,'show',(next,self,args)=>next.apply(self,args));
 assert.throws(()=>target.show(),err=>err===error);dispose();assert.equal(target.show,native);
 Object.freeze(target);const noOp=patch(target,'show',()=>0);noOp();assert.equal(target.show,native);
});
test('editor menu registration is idempotent and old listeners cannot tag menus after unload',()=>{
 class Menu {showAtMouseEvent(){return 'native';}}
 const native=Menu.prototype.showAtMouseEvent,cleanups=[],events=[];
 const plugin={settings:{v9Toolbar:true},app:{workspace:{on:(_event,fn)=>fn}},
  register:fn=>cleanups.push(fn),registerEvent:fn=>events.push(fn)};
 const register=load('src/v9/context-toolbar.js','writerV1044ContextMenus',{Menu});
 register(plugin);register(plugin);assert.equal(events.length,1);
 const editor={},menu={};events[0](menu,editor);assert.equal(menu.__writerV1045Editor,editor);
 cleanups[0]();assert.equal(Menu.prototype.showAtMouseEvent,native);
 register(plugin);assert.equal(events.length,2);
 const stale={};events[0](stale,editor);assert.equal(stale.__writerV1045Editor,undefined);
 events[1](stale,editor);assert.equal(stale.__writerV1045Editor,editor);
 cleanups[1]();assert.equal(Menu.prototype.showAtMouseEvent,native);
});

test('explorer concealment restores original inline display and respects later external changes',()=>{
 const conceal=load('src/v9/explorer-flex.js','writerV16FlexConceal');
 let value='grid',priority='important';
 const node={dataset:{},style:{getPropertyValue:()=>value,getPropertyPriority:()=>priority,
  setProperty:(_key,v,p)=>{value=v;priority=p;},removeProperty:()=>{value='';priority='';}}};
 conceal(node,true);conceal(node,true);assert.equal(value,'none');
 conceal(node,false);assert.equal(value,'grid');assert.equal(priority,'important');
 conceal(node,true);value='block';priority='';conceal(node,false);
 assert.equal(value,'block');assert.equal(node.dataset.writerFlexConcealed,undefined);
});
test('explorer drag restoration preserves native attributes',()=>{
 const drag=load('src/v9/explorer-flex.js','writerV16FlexDraggable');
 let attr='false';const node={dataset:{},getAttribute:()=>attr,setAttribute:(_k,v)=>{attr=v;},
  removeAttribute:()=>{attr=null;},get draggable(){return attr==='true';},set draggable(v){attr=String(v);}};
 drag(node,true,'a');drag(node,true,'b');assert.equal(attr,'true');
 drag(node,false);assert.equal(attr,'false');assert.equal(node.dataset.writerFlexPath,undefined);
 attr=null;drag(node,true,'a');drag(node,false);assert.equal(attr,null);
});
test('explorer registration rejects stale layout, observer and timer callbacks',()=>{
 const timers=new Map(),cleanups=[],observers=[],ready=[],events=[];let seq=0,scans=0,commands=0;
 class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const workspace={containerEl:{},on:(_event,fn)=>fn,onLayoutReady:fn=>ready.push(fn),getLeavesOfType:()=>{scans++;return [];}};
 const plugin={settings:{v91Flex:{enabled:true}},app:{workspace,vault:{on:(_event,fn)=>fn}},
  register:fn=>cleanups.push(fn),registerEvent:fn=>events.push(fn),registerDomEvent:()=>{},addCommand:()=>commands++};
 const register=load('src/v9/explorer-flex.js','writerV91FlexRegister',{MutationObserver:Observer,
  setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)});
 register(plugin);register(plugin);assert.equal(commands,5);assert.equal(cleanups.length,1);
 ready[0]();const oldObserver=observers[0],oldRefresh=plugin.writerV91FlexRefresh;
 const oldTimer=[...timers.values()][0];oldRefresh();oldTimer();assert.equal(scans,1);
 ready[0]();assert.equal(oldObserver.disconnected,true);
 const count=timers.size;oldObserver.fn([{addedNodes:[1],removedNodes:[]}]);assert.equal(timers.size,count);
 const stale=[...timers.values()][0];cleanups[0]();const after=scans;
 stale();ready[0]();oldRefresh();oldObserver.fn([{addedNodes:[1],removedNodes:[]}]);
 assert.equal(scans,after);assert.equal(timers.size,0);
 register(plugin);ready[1]();assert.equal(commands,10);assert.equal(timers.size,1);
 cleanups[0]();assert.equal(timers.size,1);cleanups[1]();
});

test('homepage grid coalesces measurements and cancels the pending frame on disposal',()=>{
 const create=load('src/v8/writing-home.js','writerV16HomeFrameQueue',{ItemView:class{}});
 const frames=new Map();let seq=0,updates=0;
 const q=create(fn=>{frames.set(++seq,fn);return seq;},id=>frames.delete(id),()=>updates++);
 q.schedule();q.schedule();q.schedule();assert.equal(frames.size,1);
 const [id,run]=[...frames.entries()][0];frames.delete(id);run();assert.equal(updates,1);
 q.schedule();assert.equal(frames.size,1);const stale=[...frames.values()][0];
 q.dispose();q.dispose();stale();q.schedule();
 assert.equal(frames.size,0);assert.equal(updates,1);
});
test('homepage grid ignores callbacks retained by an old observer and avoids redundant style writes',()=>{
 const frames=new Map(),observers=[];let seq=0,writes=0,span='';
 const host={requestAnimationFrame(fn){assert.equal(this,host);frames.set(++seq,fn);return seq;},cancelAnimationFrame(id){assert.equal(this,host);frames.delete(id);},
 ResizeObserver:class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}};
 const card={getBoundingClientRect:()=>({height:36}),style:{get gridRowEnd(){return span;},set gridRowEnd(v){writes++;span=v;}}};
 const grid={ownerDocument:{defaultView:host},isConnected:true,clientWidth:900,dataset:{basicCompactLayout:'false'},querySelectorAll:()=>[card]};
 const View=load('src/v8/writing-home.js','WriterV8HomeView',{ItemView:class{},getComputedStyle:()=>({rowGap:'10'})});
 const view=Object.create(View.prototype);view.homeRenderGeneration=1;
 const flush=()=>{for(const [id,fn] of [...frames]){frames.delete(id);fn();}};
 view.installWidgetGrid(grid);observers[0].fn();observers[0].fn();assert.equal(frames.size,1);
 flush();assert.equal(writes,1);observers[0].fn();flush();assert.equal(writes,1);
 observers[0].fn();const stale=[...frames.values()][0];view.homeRenderGeneration++;
 view.installWidgetGrid(grid);assert.equal(observers[0].disconnected,true);assert.equal(frames.size,1);
 observers[0].fn();stale();assert.equal(frames.size,1);flush();assert.equal(writes,1);
 view.widgetFrameQueue.dispose();view.widgetResizeObserver.disconnect();
});

test('homepage registration is idempotent and old events and timers cannot mutate a new session',async()=>{
 const timers=new Map(),events=new Map(),commands=new Map(),cleanups=[];let seq=0,ready,saves=0,views=0,opens=0;
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 const on=(event,fn)=>({event,fn});
 const workspace={on,onLayoutReady:fn=>{ready=fn;},getLeavesOfType:()=>[],getLeaf:()=>{opens++;return null;}};
 const plugin={app:{workspace,vault:{on}},settings:{v8Finish:{homeRecent:[],homeFavorites:[],homeOnNewTab:true}},_writerV106HomeStarted:true,
 register:fn=>cleanups.push(fn),registerEvent:({event,fn})=>events.set(event,fn),registerView:()=>views++,addCommand:cmd=>commands.set(cmd.id,cmd.callback),saveSettings:async()=>{saves++;}};
 const register=load('src/v8/writing-home.js','writerV8RegisterHome',{ItemView:class{},TFile,setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)});
 register(plugin);register(plugin);assert.equal(views,1);assert.equal(cleanups.length,2);
 const oldOpen=plugin.writerV8HomeOpen,oldReady=ready,oldFile=events.get('file-open'),oldRename=events.get('rename'),oldLayout=events.get('layout-change');
 oldFile(new TFile('old.md'));oldReady();assert.equal(timers.size,2);const stale=[...timers.values()];
 cleanups.forEach(fn=>fn());assert.equal(timers.size,0);assert.equal(plugin.writerV8HomeOpen,undefined);
 register(plugin);events.get('file-open')(new TFile('new.md'));assert.equal(timers.size,1);
 oldFile(new TFile('stale.md'));oldRename(new TFile('renamed.md'),'new.md');oldLayout();oldReady();await oldOpen();stale.forEach(fn=>fn());
 assert.equal(timers.size,1);assert.equal(opens,0);assert.equal(saves,0);
 assert.equal(Array.from(plugin.settings.v8Finish.homeRecent).join(','),'new.md,old.md');
 for(const [id,fn] of [...timers]){timers.delete(id);fn();}assert.equal(saves,1);
 cleanups.slice(2).forEach(fn=>fn());
});

function draftExportHarness(){
 let release,active=true,index=0,fail=false,saves=0;
 const drafts=['first draft','second draft',''],editor={value:drafts[0]};
 const file={path:'Quick Notes/export.md'};
 const view={plugin:{settings:{v8Finish:{homeQuick:drafts}},saveSettings:async()=>{saves++;if(fail)throw Error('save failure');}},
  app:{vault:{getAbstractFileByPath:path=>path==='Quick Notes'?{}:null,create:()=>new Promise(resolve=>{release=()=>resolve(file);})}}};
 return {drafts,editor,view,file,release:()=>release(),close:()=>{active=false;},switchTab:()=>{index=1;editor.value=drafts[1];},fail:()=>{fail=true;},saves:()=>saves,
  run:exportDraft=>exportDraft(view,0,'first draft',()=>active,()=>index,editor)};
}
test('quick draft export clears only its unchanged selected snapshot',async()=>{
 const exportDraft=load('src/v8/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness(),pending=h.run(exportDraft);h.release();const result=await pending;
 assert.equal(result.file,h.file);assert.equal(result.cleared,true);assert.deepEqual(h.drafts,['','second draft','']);assert.equal(h.editor.value,'');assert.equal(h.saves(),1);
});
test('quick draft export retains both drafts if the user switches tabs while creating a note',async()=>{
 const exportDraft=load('src/v8/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness(),pending=h.run(exportDraft);h.switchTab();h.release();const result=await pending;
 assert.equal(result.file,h.file);assert.equal(result.cleared,false);assert.deepEqual(h.drafts,['first draft','second draft','']);assert.equal(h.editor.value,'second draft');assert.equal(h.saves(),0);
});
test('quick draft export preserves newer edits and stale view state',async()=>{
 const exportDraft=load('src/v8/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 for(const closed of [false,true]){
  const h=draftExportHarness(),pending=h.run(exportDraft);
  if(closed)h.close();else h.editor.value=h.drafts[0]='newer edit';
  h.release();const result=await pending;
  assert.equal(result.cleared,false);assert.equal(h.drafts[0],closed?'first draft':'newer edit');assert.equal(h.saves(),0);
 }
});
test('quick draft export restores the snapshot if persisting its removal fails',async()=>{
 const exportDraft=load('src/v8/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness();h.fail();const pending=h.run(exportDraft);h.release();
 await assert.rejects(pending,/save failure/);assert.equal(h.drafts[0],'first draft');assert.equal(h.editor.value,'first draft');
});
