'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
const style=fs.readFileSync('src/styles/v8-polish.css','utf8');
const rc=fs.readFileSync('src/v7/longform-rc.js','utf8');
function methods(){
 const from=main.indexOf('  hotReloadStorageKey(){');
 const end=main.indexOf('  async onunload(){',from);
 assert.ok(from>0&&end>from);
 return main.slice(from,end);
}
function fixture(){
 const storage=new Map();
 const leftContainer={contains:(el)=>el.side==='left'};
 const rightContainer={contains:(el)=>el.side==='right'};
 const open=[];
 const views={
  basic:[{containerEl:{side:'right'},view:{activeTab:'definition'}}],
  project:[{containerEl:{side:'left'},view:{activeTab:'structure',selected:'Books/Bonfire.md',writerV7RCSubtab:'beats'}}],
  tools:[{containerEl:{side:'right'},view:{tab:'complements'}}]
 };
 const workspace={
  leftSplit:{containerEl:leftContainer,collapsed:false},
  rightSplit:{containerEl:rightContainer,collapsed:true},
  getLeavesOfType:type=>views[type]||[],
  getLeftLeaf:()=>create('left'),
  getRightLeaf:()=>create('right'),
  async revealLeaf(leaf){this.revealed??=[];this.revealed.push(leaf.side);}
 };
 function create(side){
  const leaf={side,async setViewState({type}){
   this.type=type;
   this.view=type==='basic'?{switchTab(tab){this.activeTab=tab;}}:
    type==='tools'?{render(){this.rendered=true;}}:
    {async render(){this.rendered=true;}};
   open.push(this);
  }};
  return leaf;
 }
 const host={manifest:{id:'basic-ai-tool-for-writers'},app:{vault:{getName:()=> 'TestVault'},workspace}};
 const context={window:{sessionStorage:{
  setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null,removeItem:k=>storage.delete(k)
 }},VIEW:'basic',PROJECT_VIEW:'project',WRITER_TOOLS_VIEW:'tools',console,Date};
 const {rememberHotReloadSidebars,restoreHotReloadSidebars,hotReloadStorageKey}=
  vm.runInNewContext('(class HotReloadHarness {'+methods()+'}).prototype',context);
 Object.assign(host,{rememberHotReloadSidebars,restoreHotReloadSidebars,hotReloadStorageKey});
 return {host,workspace,views,open,storage};
}
test('captures only currently open Basic AI plugin panes and their tabs',()=>{
 const {host,storage}=fixture();
 host.rememberHotReloadSidebars();
 const item=JSON.parse([...storage.values()][0]);
 assert.equal(item.leaves.length,3);
 assert.equal(item.leaves.find(x=>x.type==='project').structureTab,'beats');
 assert.equal(item.leaves.find(x=>x.type==='project').visible,true);
 assert.equal(item.leaves.find(x=>x.type==='basic').visible,false);
});
test('hot reload recreates only the panes previously open and reveals expanded side only',async()=>{
 const {host,views,open,storage,workspace}=fixture();
 host.rememberHotReloadSidebars();
 views.basic=[];views.project=[];views.tools=[];
 await host.restoreHotReloadSidebars();
 assert.deepEqual(open.map(x=>x.type),['project','basic','tools']);
 assert.equal(open[0].view.selected,'Books/Bonfire.md');
 assert.equal(open[0].view.activeTab,'structure');
 assert.equal(open[0].view.writerV7RCSubtab,'beats');
 assert.equal(open[1].view.activeTab,'definition');
 assert.equal(open[2].view.tab,'complements');
 assert.deepEqual(workspace.revealed,['left']);
 assert.equal(storage.size,0,'The snapshot must be used only once');
 await host.restoreHotReloadSidebars();
 assert.equal(open.length,3,'A normal startup or later call must not reopen panes');
});
test('manual closed panels are not recreated and stale snapshots are not used',async()=>{
 const {host,views,open,storage}=fixture();
 views.tools=[];
 host.rememberHotReloadSidebars();
 views.basic=[];views.project=[];
 await host.restoreHotReloadSidebars();
 assert.deepEqual(open.map(x=>x.type),['project','basic']);
 const key=host.hotReloadStorageKey();
 storage.set(key,JSON.stringify({timestamp:Date.now()-360000,
  leaves:[{type:'basic',side:'right',visible:true}]}));
 await host.restoreHotReloadSidebars();
 assert.equal(open.length,2);
});
test('reload persists state before explicit Obsidian plugin view detach',()=>{
 const end=main.slice(main.lastIndexOf('  async onunload(){'));
 assert.ok(end.indexOf('this.rememberHotReloadSidebars();')<end.indexOf('detachLeavesOfType('));
 assert.match(main,/onLayoutReady\(\(\)=>\{void this\.restoreHotReloadSidebars\(\);\}\)/);
});
test('structure tabs do not split words and are horizontally scrollable',()=>{
 assert.match(rc,/tabs\.addEventListener\('wheel'/);
 assert.match(rc,/tabs\.setAttribute\('role','tablist'\)/);
 assert.match(style,/\.writer-v7-rc-structure-tabs\.writer-v7-rc-structure-tabs>button/);
 assert.match(style,/white-space:nowrap/);
 assert.match(style,/min-width:max-content/);
 assert.match(style,/overflow-x:auto/);
 assert.doesNotMatch(style,/!important/);
});
test('optional definition context is bounded and secondary controls are transparent',()=>{
 assert.match(main,/cls:'dictionary-context-optional'/);
 assert.match(main,/rows:'2'/);
 assert.match(style,/textarea\.dictionary-context-optional\.dictionary-context-optional/);
 assert.match(style,/height:70px/);
 assert.match(style,/flex:0 0 auto/);
 assert.match(style,/\.dictionary-lexical-actions>button/);
 assert.match(style,/background:transparent/);
});
