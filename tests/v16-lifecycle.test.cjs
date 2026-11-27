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
