'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const finish=read('src/v8/finish-blocks.js');
const home=read('src/v8/writing-home.js');
const api=vm.runInNewContext(finish+'\n({merge:writerV8FinishMerge})',{
 writerV8HomeIconName:()=> 'book-open'
});
test('old home layout migrates to configurable widgets without enabling extras',()=>{
 const settings={v8Finish:{homeOrder:['continue','recent','favorites','quick','stats','search']}};
 api.merge(settings);
 const cfg=settings.v8Finish;
 assert.equal(cfg.homeOrder[0],'continue');
 assert.equal(cfg.homeOrder[1],'calendar');
 assert.ok(!cfg.homeOrder.includes('search'));
 assert.deepEqual(Array.from(cfg.homeHidden),['activity','random','tags','goal','gallery','quotes','today']);
 assert.equal(cfg.homeWordGoal,500);
});
test('visible and hidden widgets are retained on subsequent reloads',()=>{
 const settings={v8Finish:{homeOrder:['random','quick','calendar'],homeHidden:['calendar','stats','goal'],homeWordGoal:900}};
 api.merge(settings);const first=JSON.stringify(settings.v8Finish);
 api.merge(settings);assert.equal(JSON.stringify(settings.v8Finish),first);
 assert.equal(settings.v8Finish.homeOrder[0],'random');
 assert.equal(settings.v8Finish.homeWordGoal,900);
});
test('widget actions support hiding, readding, and skipping hidden panels when moving',()=>{
 class ItemView{}
 const View=vm.runInNewContext(home+'\nWriterV8HomeView',{ItemView,writerUi:x=>x});
 const view=Object.create(View.prototype);
 view.plugin={settings:{v8Finish:{homeOrder:['continue','calendar','recent','random'],homeHidden:['calendar','random']}}};
 let saves=0,renders=0;view.saveSoon=()=>saves++;view.render=()=>renders++;
 view.setWidgetVisible('recent',false);assert.ok(view.plugin.settings.v8Finish.homeHidden.includes('recent'));
 view.setWidgetVisible('recent',true);assert.ok(!view.plugin.settings.v8Finish.homeHidden.includes('recent'));
 view.moveWidget('recent',-1);
 assert.deepEqual(Array.from(view.plugin.settings.v8Finish.homeOrder),['recent','calendar','continue','random']);
 assert.equal(saves,3);assert.equal(renders,3);
});
test('home has calendar in the widget grid and keeps search outside it',()=>{
 const search=home.indexOf('this.renderSearch(top)');
 const toolbar=home.indexOf("const toolbar=this.contentEl.createDiv({cls:'writer-v903-widgets-toolbar'})");
 const grid=home.indexOf("const grid=this.contentEl.createDiv({cls:'writer-v8-home-grid writer-v925-grid'})");
 assert.ok(search>=0&&search<toolbar&&toolbar<grid);
 assert.match(home,/calendar:p=>this\.renderCalendarWidget\(p\)/);
 assert.match(home,/!cfg\.homeHidden\.includes\(key\)/);
 for(const name of ['renderActivity','renderRandom','renderTags','renderGoal','manageWidgets'])assert.ok(home.includes(name+'('),name);
});
test('hot reload snapshots all custom views and restores only what was open',async()=>{
 const main=read('main.js'),start=main.indexOf('  hotReloadStorageKey(){');
 const end=main.indexOf('  async onunload(){',start);
 assert.ok(start>=0&&end>start);
 const storage=new Map();
 const types=['dictionary','projects','tools','home','calendar','study','spaces'];
 const context={VIEW:types[0],PROJECT_VIEW:types[1],WRITER_TOOLS_VIEW:types[2],
 WRITER_V8_HOME_VIEW:types[3],WRITER_V83_CAL_VIEW:types[4],WRITER_V83_STUDY_VIEW:types[5],
 WRITER_V9_SPACE_VIEW:types[6],
 window:{sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)}},
 console,Date};
 const Hot=vm.runInNewContext('class Hot{\n'+main.slice(start,end)+'\n};Hot',context);
 const leaves=[
 {type:'home',side:'tab',active:true},
 {type:'calendar',side:'tab'},
 {type:'study',side:'tab'},
 {type:'spaces',side:'right'},
 {type:'projects',side:'left'}
 ];
 const workspace={byType:new Map(),activeLeaf:null,
  leftSplit:{collapsed:false,containerEl:{contains:el=>el.side==='left'}},
  rightSplit:{collapsed:false,containerEl:{contains:el=>el.side==='right'}},
  getLeavesOfType(type){return this.byType.get(type)||[];},
  getLeftLeaf(){return this.leaf('left');},
  getRightLeaf(){return this.leaf('right');},
  getLeaf(){return this.leaf('tab');},
  leaf(side){
   const view={contentEl:{scrollTop:0}};
   const leaf={containerEl:{side},view,async setViewState({type}){
    this.view={contentEl:{scrollTop:0},render(){}};
    workspace.byType.set(type,[...(workspace.byType.get(type)||[]),this]);
   }};
   return leaf;
  },
  revealLeaf:async()=>{},
  setActiveLeaf(leaf){this.activeLeaf=leaf;}
 };
 for(const item of leaves){
  const leaf=workspace.leaf(item.side);
  await leaf.setViewState({type:item.type});
  if(item.type==='projects')leaf.view.selected='Book/Index.md';
  if(item.type==='calendar')leaf.view.anchor='2026-11-02';
  if(item.active)workspace.activeLeaf=leaf;
 }
 const plugin=Object.create(Hot.prototype);
 plugin.manifest={id:'basic-ai-tool-for-writers'};
 plugin.app={vault:{getName:()=> 'test-vault'},workspace};
 plugin.rememberHotReloadSidebars();
 assert.equal(storage.size,1);
 workspace.byType.clear();workspace.activeLeaf=null;
 await plugin.restoreHotReloadSidebars();
 assert.equal(storage.size,0);
 for(const item of leaves)assert.equal(workspace.getLeavesOfType(item.type).length,1,item.type);
 assert.equal(workspace.activeLeaf,workspace.getLeavesOfType('home')[0]);
 assert.equal(workspace.getLeavesOfType('projects')[0].view.selected,'Book/Index.md');
 assert.equal(workspace.getLeavesOfType('calendar')[0].view.anchor,'2026-11-02');
});
