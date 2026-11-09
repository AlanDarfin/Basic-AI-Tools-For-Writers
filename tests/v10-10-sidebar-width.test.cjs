'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
function run(globals={}){
 const waits=[],logs=[];
 const ctx={
  console:{warn:(...a)=>logs.push(['warn',...a]),error:(...a)=>logs.push(['error',...a])},
  Set,Map,Number,Math,Object,String,
  require:()=>({Platform:{isMobile:false},setIcon:()=>{}}),
  writerUi:(pt,en)=>pt,
  setTimeout:fn=>{waits.push(fn);return waits.length;},
  clearTimeout:()=>{},
  ...globals
 };
 return {api:vm.runInNewContext(source+'\n({writerV1010Merge,writerV1010Clamp,writerV1010YamlWidth,writerV1010WidthForFile,writerV1010CollectLeaves,writerV1010SortLeaves,writerV1010Register,writerV1010Settings})',ctx),waits,logs};
}
test('10.10 defaults keep sidebar manager off, width on, and preserve live settings references',()=>{
 const {api}=run(),settings={},cfg=api.writerV1010Merge(settings);
 assert.equal(cfg.sidebar.enabled,false);
 assert.equal(cfg.sidebar.mobileTabs,true);
 assert.equal(cfg.sidebar.desktopTabs,false);
 assert.equal(cfg.width.enabled,true);
 assert.equal(cfg.width.current,80);
 assert.equal(cfg.width.showStatus,true);
 cfg.sidebar.enabled=true;cfg.width.current=55;
 assert.equal(api.writerV1010Merge(settings),cfg);
 assert.equal(settings.v1010Layout.sidebar,cfg.sidebar);
 assert.equal(settings.v1010Layout.width,cfg.width);
 assert.equal(settings.v1010Layout.sidebar.enabled,true);
 assert.equal(settings.v1010Layout.width.current,55);
});
test('10.10 editor width supports per-note editor-width metadata and temporary override',()=>{
 const {api}=run(),file={path:'Novel/Chapter.md',extension:'md'};
 const plugin={settings:{},app:{metadataCache:{getFileCache:()=>({frontmatter:{'editor-width':74}})}}};
 api.writerV1010Merge(plugin.settings);
 assert.equal(api.writerV1010YamlWidth(plugin,file),74);
 assert.equal(api.writerV1010WidthForFile(plugin,file),74);
 plugin._writerV1010TemporaryWidths=new Map([[file.path,63]]);
 assert.equal(api.writerV1010WidthForFile(plugin,file),63);
 plugin._writerV1010TemporaryWidths.clear();
 plugin.settings.v1010Layout.width.frontmatter=false;
 assert.equal(api.writerV1010WidthForFile(plugin,file),80);
 assert.equal(api.writerV1010Clamp(150),100);
 assert.equal(api.writerV1010Clamp(-10),20);
 assert.equal(api.writerV1010Clamp('NaN'),80);
});
test('10.10 shared sidebar ordering preserves native leaves and does not reparent them',()=>{
 const {api}=run(),settings={};
 api.writerV1010Merge(settings);
 settings.v1010Layout.sidebar.order.left=['global-search','file-explorer'];
 const split={};
 const make=(type)=>({getRoot:()=>split,view:{getViewType:()=>type}});
 const explorer=make('file-explorer'),search=make('global-search'),markdown=make('markdown');
 const workspace={leftSplit:split,rightSplit:{},iterateAllLeaves(callback){[explorer,search,markdown].forEach(callback);}};
 const leaves=api.writerV1010CollectLeaves(workspace,'left');
 assert.equal(leaves.length,3);
 assert.deepEqual(Array.from(api.writerV1010SortLeaves({settings},'left',leaves),entry=>entry.type),['global-search','file-explorer','markdown']);
 assert.equal(explorer.getRoot(),split);
});
test('10.10 startup does not break Obsidian on missing sidebar DOM or mobile status bar',()=>{
 const {api,waits,logs}=run();
 let ready,dispose;
 const plugin={
  settings:{},addCommand:()=>{},
  app:{workspace:{
   leftSplit:{},rightSplit:{},getActiveFile:()=>null,
   onLayoutReady:fn=>{ready=fn;},on:()=>({}),
   iterateAllLeaves:fn=>{}
  }},
  registerEvent:()=>{},
  register:fn=>{dispose=fn;},
  saveSettings:async()=>{}
 };
 assert.doesNotThrow(()=>api.writerV1010Register(plugin));
 assert.equal(typeof ready,'function');
 ready();waits.splice(0).forEach(fn=>fn());
 assert.equal(logs.length,0);
 assert.doesNotThrow(()=>dispose());
 assert.equal(plugin.writerV1010Refresh,null);
});
test('10.10 integration does not take over ribbon, workspace layouts, files or vault APIs',()=>{
 const s=source,enhancements=fs.readFileSync('src/v10/enhancements.js','utf8');
 assert.match(enhancements,/safeRegister\('sidebar-and-width',\(\)=>writerV1010Register\(plugin\)\)/);
 assert.match(enhancements,/writerV1010Settings\(plugin,panel\)/);
 assert.doesNotMatch(s,/addRibbonIcon|setViewState\(|replaceState\(|processFrontMatter|vault\.modify\(|vault\.delete\(/);
 assert.match(s,/writerV1010SidebarMenu/);
 assert.match(s,/getLeavesOfType\?\.\('file-explorer'\)/);
 assert.match(s,/current\+\x27%\x27/);
});
