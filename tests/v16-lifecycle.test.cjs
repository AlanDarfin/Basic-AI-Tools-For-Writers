'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=(path,name,context={})=>vm.runInNewContext(fs.readFileSync(path,'utf8')+'\n'+name,{console,writerUi:(_pt,en)=>en,writerModuleOn:()=>true,WRITER_V8_HOME_VIEW:'home',...context});
function readingHarness(){
 const frames=new Map(),timers=new Map(),events=new Map(),cleanups=[];let seq=0,ready,scans=0,registered=0;
 const view={requestAnimationFrame(fn){assert.equal(this,view);frames.set(++seq,fn);return seq;},cancelAnimationFrame(id){assert.equal(this,view);frames.delete(id);}};
 const root={ownerDocument:{defaultView:view},querySelectorAll:()=>[]};
 const workspace={containerEl:root,on:(event,fn)=>({event,fn}),onLayoutReady:fn=>{ready=fn;},getLeavesOfType:()=>{scans++;return [];}};
 const plugin={app:{workspace},settings:{v101Suite:{enabled:true}},register:fn=>cleanups.push(fn),registerEvent:({event,fn})=>{registered++;events.set(event,fn);},registerDomEvent:()=>{}};
 const register=load('src/core/enhancements.js','writerV101ReadingProgressRegister',{setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)});
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
 const register=load('src/core/startup-cleanup.js','writerV106HomeRegisterStartup');
 return {register,plugin,cleanups,ready:()=>ready,release:()=>release?.(),open:async()=>{opened++;},stats:()=>({opened,detached,activated,stored,commands})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function zoteroHarness({create=async()=>{},existing=[]}={}){
 const modals=[],buttons=[],requests=[],writes=[],notices=[],cleanups=[],commands=new Map(),settingsChanges=new Map();
 class Modal{
  constructor(){this.contentEl={createEl:tag=>tag==='input'?(this.input={value:''}):{}};modals.push(this);}
  setTitle(title){this.title=title;}
  open(){this.opened=true;this.onOpen();}
  close(){this.opened=false;this.onClose();}
 }
 class Setting{
  setName(name){this.name=name;return this;}
  addText(configure){
   configure({setValue(){return this;},setPlaceholder(){return this;},onChange:fn=>settingsChanges.set(this.name,fn)});
   return this;
  }
  addToggle(configure){return this.addText(configure);}
  addDropdown(configure){
   configure({addOption(){return this;},setValue(){return this;},onChange:fn=>settingsChanges.set(this.name,fn)});
   return this;
  }
  addSlider(configure){
   configure({setLimits(){return this;},setDynamicTooltip(){return this;},setValue(){return this;},onChange:fn=>settingsChanges.set(this.name,fn)});
   return this;
  }
  addButton(configure){
   const button={setButtonText(){return this;},setCta(){return this;},setDisabled(value){this.disabled=value;},onClick(fn){this.click=fn;}};
   buttons.push(button);configure(button);
  }
 }
 const vault={getAbstractFileByPath:path=>existing.includes(path),createFolder:async path=>writes.push(path),
  create:(path,data)=>{writes.push(path);return create(path,data);}};
 const plugin={app:{vault},settings:{v107Zotero:{enabled:true,libraryId:'1234',folder:'Zotero',maxItems:200}},
  register:fn=>cleanups.push(fn),addCommand:({id,callback})=>commands.set(id,callback),saveSettings:async()=>{}};
 const api=load('src/integrations/zotero-web.js','({prompt:writerV107ZoteroPrompt,register:writerV107ZoteroRegister,settings:writerV107ZoteroSettings})',
  {Modal,Setting,Notice:class{constructor(text){notices.push(text);}},
  require:()=>({requestUrl:options=>new Promise((resolve,reject)=>requests.push({options,resolve,reject}))})});
 return {...api,plugin,modals,buttons,requests,writes,notices,cleanups,commands,settingsChanges};
}
const zoteroItem=key=>({key,data:{title:`Reference ${key}`,itemType:'book'}});
const zoteroResponse=json=>({status:200,json});
test('closed Zotero prompt clears its credential and stops pagination and import handoff',async()=>{
 const h=zoteroHarness();h.prompt(h.plugin);h.modals[0].input.value='temporary-example';
 const running=h.buttons[0].click();await h.buttons[0].click();
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].options.headers['Zotero-API-Key'],'temporary-example');
 h.modals[0].close();assert.equal(h.modals[0].input.value,'');
 h.requests[0].resolve(zoteroResponse(Array.from({length:100},(_,i)=>zoteroItem(i))));await running;
 assert.equal(h.requests.length,1);assert.equal(h.modals.length,1);assert.deepEqual(h.notices,[]);
});
test('Zotero unload closes pending prompts and suppresses late export and errors',async()=>{
 const h=zoteroHarness();h.prompt(h.plugin,'csljson');h.prompt(h.plugin);
 const exportJob=h.buttons[0].click(),importJob=h.buttons[1].click();
 assert.equal(h.cleanups.length,1);h.cleanups[0]();
 h.requests[0].resolve(zoteroResponse([{id:'saved',type:'book'}]));h.requests[1].reject(Error('late'));
 await Promise.all([exportJob,importJob]);h.prompt(h.plugin);
 assert.equal(h.modals.length,2);assert.ok(h.modals.every(modal=>!modal.opened));
 assert.deepEqual(h.writes,[]);assert.deepEqual(h.notices,[]);
});
test('Zotero invalidates a pending query even if a library setting changes back',async()=>{
 const h=zoteroHarness();h.prompt(h.plugin);const fetching=h.buttons[0].click();
 h.settings(h.plugin,{createEl:()=>({})});
 const changeId=h.settingsChanges.get('Numeric library ID');await changeId('4321');await changeId('1234');
 h.requests[0].resolve(zoteroResponse(Array.from({length:100},(_,i)=>zoteroItem(i))));await fetching;
 assert.equal(h.requests.length,1);assert.equal(h.modals.length,1);assert.equal(h.buttons[0].disabled,false);
});
test('a retained Zotero command cannot open a prompt in a new registration session',()=>{
 const h=zoteroHarness(),id='v107-zotero-web-import';
 h.register(h.plugin);const previous=h.commands.get(id);previous();h.cleanups[0]();
 h.register(h.plugin);previous();assert.equal(h.modals.length,1);
 h.commands.get(id)();assert.equal(h.modals.length,2);assert.equal(h.modals[1].opened,true);
 h.cleanups[1]();assert.equal(h.modals[1].opened,false);
});
test('Zotero stops after an in-flight import write when its confirmation closes',async()=>{
 let complete;
 const h=zoteroHarness({existing:['Zotero','Zotero/SKIP.md'],create:()=>new Promise(resolve=>{complete=resolve;})});
 h.prompt(h.plugin);const fetch=h.buttons[0].click();
 h.requests[0].resolve(zoteroResponse(['SKIP','FIRST','LATER'].map(zoteroItem)));await fetch;
 assert.equal(h.modals[0].opened,false);assert.equal(h.modals[1].opened,true);
 const importing=h.buttons[1].click();await h.buttons[1].click();
 assert.deepEqual(h.writes,['Zotero/FIRST.md']);h.modals[1].close();complete();await importing;
 assert.deepEqual(h.writes,['Zotero/FIRST.md']);assert.deepEqual(h.notices,[]);
});
test('current Zotero export paginates and creates one CSL file',async()=>{
 const h=zoteroHarness();h.prompt(h.plugin,'csljson');const exporting=h.buttons[0].click();
 h.requests[0].resolve(zoteroResponse(Array.from({length:100},(_,i)=>({id:i,type:'book'}))));await flush();
 assert.equal(h.requests.length,2);assert.match(h.requests[1].options.url,/start=100$/);
 h.requests[1].resolve(zoteroResponse([{id:100,type:'book'}]));await exporting;
 assert.equal(h.modals[0].opened,false);assert.equal(h.writes.length,1);
 assert.match(h.writes[0],/^Zotero-csl-\d+\.json$/);assert.match(h.notices[0],/^CSL export created: /);
});
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
 const patch=load('src/editor/context-toolbar.js','writerV16PatchMethod');
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
 const patch=load('src/editor/context-toolbar.js','writerV16PatchMethod');
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
 const patch=load('src/editor/context-toolbar.js','writerV16PatchMethod');
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
 const register=load('src/editor/context-toolbar.js','writerV1044ContextMenus',{Menu});
 register(plugin);register(plugin);assert.equal(events.length,1);
 const editor={},menu={};events[0](menu,editor);assert.equal(menu.__writerV1045Editor,editor);
 cleanups[0]();assert.equal(Menu.prototype.showAtMouseEvent,native);
 register(plugin);assert.equal(events.length,2);
 const stale={};events[0](stale,editor);assert.equal(stale.__writerV1045Editor,undefined);
 events[1](stale,editor);assert.equal(stale.__writerV1045Editor,editor);
 cleanups[1]();assert.equal(Menu.prototype.showAtMouseEvent,native);
});

test('explorer concealment restores original inline display and respects later external changes',()=>{
 const conceal=load('src/workspace/explorer-flex.js','writerV16FlexConceal');
 let value='grid',priority='important';
 const node={dataset:{},style:{getPropertyValue:()=>value,getPropertyPriority:()=>priority,
  setProperty:(_key,v,p)=>{value=v;priority=p;},removeProperty:()=>{value='';priority='';}}};
 conceal(node,true);conceal(node,true);assert.equal(value,'none');
 conceal(node,false);assert.equal(value,'grid');assert.equal(priority,'important');
 conceal(node,true);value='block';priority='';conceal(node,false);
 assert.equal(value,'block');assert.equal(node.dataset.writerFlexConcealed,undefined);
});
test('explorer drag restoration preserves native attributes',()=>{
 const drag=load('src/workspace/explorer-flex.js','writerV16FlexDraggable');
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
 const register=load('src/workspace/explorer-flex.js','writerV91FlexRegister',{MutationObserver:Observer,
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
 const create=load('src/workspace/writing-home.js','writerV16HomeFrameQueue',{ItemView:class{}});
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
 const View=load('src/workspace/writing-home.js','WriterV8HomeView',{ItemView:class{},getComputedStyle:()=>({rowGap:'10'})});
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
 const register=load('src/workspace/writing-home.js','writerV8RegisterHome',{ItemView:class{},TFile,setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)});
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
 const exportDraft=load('src/workspace/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness(),pending=h.run(exportDraft);h.release();const result=await pending;
 assert.equal(result.file,h.file);assert.equal(result.cleared,true);assert.deepEqual(h.drafts,['','second draft','']);assert.equal(h.editor.value,'');assert.equal(h.saves(),1);
});
test('quick draft export retains both drafts if the user switches tabs while creating a note',async()=>{
 const exportDraft=load('src/workspace/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness(),pending=h.run(exportDraft);h.switchTab();h.release();const result=await pending;
 assert.equal(result.file,h.file);assert.equal(result.cleared,false);assert.deepEqual(h.drafts,['first draft','second draft','']);assert.equal(h.editor.value,'second draft');assert.equal(h.saves(),0);
});
test('quick draft export preserves newer edits and stale view state',async()=>{
 const exportDraft=load('src/workspace/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 for(const closed of [false,true]){
  const h=draftExportHarness(),pending=h.run(exportDraft);
  if(closed)h.close();else h.editor.value=h.drafts[0]='newer edit';
  h.release();const result=await pending;
  assert.equal(result.cleared,false);assert.equal(h.drafts[0],closed?'first draft':'newer edit');assert.equal(h.saves(),0);
 }
});
test('quick draft export restores the snapshot if persisting its removal fails',async()=>{
 const exportDraft=load('src/workspace/writing-home.js','writerV16HomeExportDraft',{ItemView:class{}});
 const h=draftExportHarness();h.fail();const pending=h.run(exportDraft);h.release();
 await assert.rejects(pending,/save failure/);assert.equal(h.drafts[0],'first draft');assert.equal(h.editor.value,'first draft');
});

function webNavigationHarness({surfing=true,webviewer=true}={}){
 let active=true,release,attempts=[],focus=0,external=0;
 const workspace={getLeaf:()=>({setViewState:state=>{attempts.push(state.type);return new Promise((resolve,reject)=>{release={resolve,reject};});},getViewState:()=>({type:'empty'})}),
  setActiveLeaf:()=>focus++,containerEl:{ownerDocument:{defaultView:{open:()=>external++}}}};
 const plugin={app:{workspace,internalPlugins:{getPluginById:()=>({enabled:webviewer})},plugins:{plugins:{surfing:{}},enabledPlugins:new Set(surfing?['surfing']:[])}},settings:{v8Finish:{homeWebSearchTarget:'auto'}}};
 return {plugin,current:()=>active,close:()=>{active=false;},resolve:()=>release.resolve(),reject:()=>release.reject(Error('unavailable')),attempts,focus:()=>focus,external:()=>external};
}
test('stale native slash search neither focuses nor reports an unavailable viewer',async()=>{
 const open=load('src/workspace/home-utilities.js','writerV8HomeOpenNativeSearch',{URL});
 for(const rejected of [false,true]){
  const h=webNavigationHarness(),pending=open(h.plugin,'query',h.current);h.close();rejected?h.reject():h.resolve();
  assert.equal(await pending,null);assert.equal(h.focus(),0);assert.deepEqual(h.attempts,['webviewer']);assert.equal(h.external(),0);
 }
});
test('stale Surfing navigation does not fall back to native viewer or external browser',async()=>{
 const open=load('src/workspace/home-utilities.js','writerV8HomeOpenURL',{URL,require:()=>({Platform:{isMobile:false}})});
 for(const rejected of [false,true]){
  const h=webNavigationHarness(),pending=open(h.plugin,'https://example.org',h.current);h.close();rejected?h.reject():h.resolve();
  assert.equal(await pending,null);assert.deepEqual(h.attempts,['surfing-view']);assert.equal(h.external(),0);
 }
});
test('stale native fallback does not open an external browser, but active fallback still works',async()=>{
 const open=load('src/workspace/home-utilities.js','writerV8HomeOpenURL',{URL,require:()=>({Platform:{isMobile:false}})});
 for(const stale of [false,true]){
  const h=webNavigationHarness({surfing:false}),pending=open(h.plugin,'https://example.org',h.current);
  if(stale)h.close();h.resolve();assert.equal(await pending,stale?null:'external');assert.equal(h.external(),stale?0:1);
 }
 const h=webNavigationHarness();h.close();assert.equal(await open(h.plugin,'https://example.org',h.current),null);assert.equal(h.attempts.length,0);
});

function integrationStartupHarness({throwReady=false}={}){
 const timers=new Map(),callbacks=[],cleanups=[];let seq=0,registrations=0;
 const workspace={onLayoutReady(fn){callbacks.push(fn);if(throwReady){fn();throw Error('layout unavailable');}}};
 const plugin={app:{workspace},settings:{},register:fn=>cleanups.push(fn)};
 const noop=()=>{};
 const register=load('src/integrations/integrations-107.js','writerV107RegisterAfterStartup',{
  console:{warn:noop,error:noop,info:noop},
  setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),
  writerV107DbRegister:()=>registrations++,writerV107ZoteroRegister:noop,writerV107StudyRegister:noop,
  writerV107CalendarRegister:noop,writerV107GraphRegister:noop,writerV107EditorRegister:noop,
  writerV107SpeechRegister:noop,writerV107MediaRegister:noop
 });
 const flush=()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}};
 return {plugin,register,timers,callbacks,cleanups,flush,count:()=>registrations};
}
test('optional integration startup coalesces repeated layout-ready callbacks',()=>{
 const h=integrationStartupHarness();h.register(h.plugin);h.register(h.plugin);
 assert.equal(h.callbacks.length,1);h.callbacks[0]();h.callbacks[0]();assert.equal(h.timers.size,1);
 h.flush();h.callbacks[0]();h.register(h.plugin);h.flush();assert.equal(h.count(),1);assert.equal(h.timers.size,0);
 h.cleanups[0]();
});
test('unloading pending optional integrations cancels the timer and makes old callbacks inert',()=>{
 const h=integrationStartupHarness();h.register(h.plugin);h.callbacks[0]();
 const oldTimer=[...h.timers.values()][0];h.cleanups[0]();
 assert.equal(h.timers.size,0);h.callbacks[0]();oldTimer();assert.equal(h.count(),0);
 h.register(h.plugin);h.callbacks[1]();h.cleanups[0]();h.callbacks[0]();oldTimer();
 assert.equal(h.timers.size,1);h.flush();assert.equal(h.count(),1);h.cleanups[1]();
});
test('layout-ready failure after scheduling does not queue a second registration',()=>{
 const h=integrationStartupHarness({throwReady:true});h.register(h.plugin);
 assert.equal(h.timers.size,1);h.flush();assert.equal(h.count(),1);h.cleanups[0]();
});
