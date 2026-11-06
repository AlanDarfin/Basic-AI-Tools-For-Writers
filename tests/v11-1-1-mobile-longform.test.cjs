'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const mobile=fs.readFileSync('src/v11/mobile-panel-actions.js','utf8');
const sidebar=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
const longform=fs.readFileSync('src/v11/longform-studio.js','utf8');
const home=fs.readFileSync('src/v8/writing-home.js','utf8');
const projects=fs.readFileSync('projects.js','utf8');
function load(names,extra={}){
 const ctx={console,Map,Set,Number,Math,Date,String,Object,Array,
  writerUi:(pt,en)=>pt,
  writerV1010Merge:settings=>settings.v1010Layout,
  ...extra};
 return vm.runInNewContext(mobile+'\n({'+names.join(',')+'})',ctx);
}
test('Longform Studio belongs to standard Longform writing tabs; standalone homepage widget removed',()=>{
 assert.match(projects,/\['manuscript',lfMsg\('Escrita contínua'/);
 assert.match(projects,/tabs:\['scenes','manuscript','board'/);
 assert.match(projects,/writerV11RenderLongformTab\(this,panel,project\)/);
 assert.doesNotMatch(home,/studio:p=>/);
 assert.doesNotMatch(home,/studio:\['book-text'/);
 const list=home.match(/WRITER_V8_HOME_SECTIONS=\[([^\]]+)\]/)?.[1];
 assert.ok(list&&!list.includes("'studio'"));
 assert.match(longform,/function writerV11RenderLongformTab\(/);
 assert.match(longform,/writerV11SaveChapter\(plugin,scene.file,expected,editor.value\)/);
 assert.match(longform,/plugin\.openProjects\?\.\('manuscript'\)/);
});
test('Mobile panel pins are sanitized and prioritized without disturbing ordinary tab order',()=>{
 const {writerV112PanelPrefs,writerV112SortPinned}=load(['writerV112PanelPrefs','writerV112SortPinned']);
 const plugin={settings:{v1010Layout:{sidebar:{
  pinnedViews:{left:['bookmarks','bookmarks',null,'x'.repeat(200)],right:[]},
  order:{left:[],right:[]}
 }}}};
 const prefs=writerV112PanelPrefs(plugin);
 assert.deepEqual(Array.from(prefs.pinnedViews.left),['bookmarks']);
 const items=[{type:'file-explorer'},{type:'bookmarks'},{type:'search'}];
 assert.deepEqual(Array.from(writerV112SortPinned(plugin,'left',items),x=>x.type),['bookmarks','file-explorer','search']);
 assert.deepEqual(Array.from(items,x=>x.type),['file-explorer','bookmarks','search']);
});
test('Mobile sidebar context menu can pin, close and close others while retaining pinned panels',async()=>{
 let active=null,refreshed=0,saved=0;
 class FakeMenu{
  constructor(){this.items=[];active=this;}
  addItem(fn){const item={title:'',setTitle(v){this.title=v;return this;},setIcon(){return this;},onClick(fn){this.invoke=fn;return this;}};fn(item);this.items.push(item);}
  addSeparator(){}
  showAtPosition(position){this.position=position;}
 }
 const a={type:'file-explorer',leaf:{closed:0,detach(){this.closed++;}}};
 const b={type:'bookmarks',leaf:{closed:0,detach(){this.closed++;}}};
 const c={type:'search',leaf:{closed:0,detach(){this.closed++;}}};
 const entries=[a,b,c];
 const functions=load(['writerV112ContextMenu'],{
  Menu:FakeMenu,
  writerV1010SideForLeaf:()=> 'left',
  writerV1010CollectLeaves:()=>entries,
  Notice:class{}
 });
 const plugin={settings:{v1010Layout:{sidebar:{
  pinnedViews:{left:['bookmarks'],right:[]},order:{left:[],right:[]}}}},
  app:{workspace:{}},saveSettings:async()=>{saved++;},writerV1010Refresh:()=>{refreshed++;}};
 assert.equal(functions.writerV112ContextMenu(plugin,'left',a,100,80),true);
 assert.equal(active.position.x,100);
 assert.ok(active.items.find(i=>i.title==='Fechar painel'));
 await active.items.find(i=>i.title==='Fechar outros não fixados').invoke();
 assert.equal(a.leaf.closed,0);
 assert.equal(b.leaf.closed,0);
 assert.equal(c.leaf.closed,1);
 functions.writerV112ContextMenu(plugin,'left',a,100,80);
 await active.items.find(i=>i.title==='Fixar painel').invoke();
 assert.ok(plugin.settings.v1010Layout.sidebar.pinnedViews.left.includes('file-explorer'));
 assert.equal(saved,1);assert.ok(refreshed>=2);
 functions.writerV112ContextMenu(plugin,'left',a,100,80);
 await active.items.find(i=>i.title==='Fechar painel').invoke();
 assert.equal(a.leaf.closed,1);
});
test('The long-press gesture cancels on scroll and suppresses a synthetic click',()=>{
 const scheduled=[],cleared=new Set(),events={};
 let last=null,clicks=0;
 class MenuMock{
  constructor(){this.items=[];last=this;}
  addItem(fn){const item={setTitle(){return this;},setIcon(){return this;},onClick(){return this;}};this.items.push(item);fn(item);}
  addSeparator(){}
  showAtPosition(pos){this.pos=pos;}
 }
 const {writerV112HoldControl}=load(['writerV112HoldControl'],{
  Menu:MenuMock,
  writerV1010SideForLeaf:()=> 'left',
  writerV1010CollectLeaves:()=>[{type:'bookmarks',leaf:{}}],
  setTimeout:(fn,ms)=>{scheduled.push(fn);return scheduled.length;},
  clearTimeout:id=>cleared.add(id)
 });
 const button={
  dataset:{},classList:{toggle(){}},
  addEventListener:(name,fn)=>{(events[name]??=[]).push(fn);},
  setAttribute(){},getAttribute:()=> 'Bookmarks',
  getBoundingClientRect:()=>({left:40,top:40,width:40,height:40})
 };
 const plugin={settings:{v1010Layout:{sidebar:{pinnedViews:{left:[],right:[]},order:{left:[],right:[]}}}},app:{workspace:{}}};
 const entry={type:'bookmarks',leaf:{}};
 writerV112HoldControl(plugin,button,'left',entry);
 events.pointerdown[0]({button:0,pointerType:'touch',clientX:50,clientY:50});
 events.pointermove[0]({clientX:80,clientY:55});
 for(const [i,fn] of scheduled.entries())if(!cleared.has(i+1))fn();
 assert.equal(last,null);
 events.pointerdown[0]({button:0,pointerType:'touch',clientX:55,clientY:60});
 for(const [i,fn] of scheduled.entries())if(!cleared.has(i+1))fn();
 assert.ok(last);
 events.click[0]({preventDefault(){clicks++;},stopImmediatePropagation(){}});
 assert.equal(clicks,1);
});
test('Nested native mobile action is delayed until its parent sheet closes',()=>{
 const begin=sidebar.indexOf('function writerV1012OpenNativeAction(');
 const end=sidebar.indexOf('function writerV1010SidebarMenu(',begin);
 assert.ok(begin>=0&&end>begin);
 const tasks=[],ctx={setTimeout:fn=>{tasks.push(fn);},console};
 const f=vm.runInNewContext(sidebar.slice(begin,end)+'\nwriterV1012OpenNativeAction',ctx);
 let clicked=0,refreshed=0;
 const plugin={writerV1010Refresh:()=>{refreshed++;}};
 f({click:()=>{clicked++;},isConnected:true},false,plugin);
 assert.equal(clicked,0);assert.equal(plugin._writerV1010NativeActionPending,true);
 tasks.shift()();assert.equal(clicked,1);
 tasks.shift()();assert.equal(plugin._writerV1010NativeActionPending,false);
 assert.equal(refreshed,1);
 assert.match(sidebar,/writerV112SidebarWire\(plugin,side,visible,bar\)/);
});
