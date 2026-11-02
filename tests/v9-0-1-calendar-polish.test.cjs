'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const js=read('src/v9/calendar-studio.js'),placement=read('src/v9/calendar-placement.js');
const css=read('src/styles/v9-calendar-901.css');
test('month day labels are plain, readable and distinguish current/selected dates',()=>{
 assert.match(js,/day===view\.anchor\?' is-selected'/);
 assert.match(css,/writer-v9-calendar-month-dayhead.*writer-v9-calendar-button/);
 assert.match(css,/background:transparent;color:var\(--text-normal\)/);
 assert.match(css,/is-today[\s\S]*?color:var\(--text-accent\)/);
 assert.match(css,/is-selected[\s\S]*?border-color:var\(--interactive-accent\)/);
 assert.doesNotMatch(css,/border-radius:50%|border-radius:9999px/);
});
test('timed and all-day slots are accessible tap targets without repeated plus icons',()=>{
 assert.match(js,/writer-v901-slot-hit/);
 assert.match(js,/aria-label.*Novo evento em/);
 assert.match(js,/Criar evento para o dia inteiro/);
 assert.doesNotMatch(js,/writer-v9-calendar-hour-add/);
 assert.doesNotMatch(js,/writerV9CalButton\(all,'','plus'/);
 assert.match(css,/\.writer-v901-slot-hit::after/);
 assert.match(css,/@media\(hover:none\)/);
 assert.match(css,/\.writer-v901-slot-hit::after\{content:none;\}/);
});
test('calendar native sidebar placement reuses existing docked leaf',async()=>{
 class CalendarView{constructor(){this.anchor='2026-11-02';this.mode='month';this.renderCount=0;}
  render(){this.renderCount++;}}
 const left={side:'left'},right={side:'right'},root={side:'main'},leaves=[];
 let created=0,revealed=null;
 function makeLeaf(where){
  const leaf={view:null,getRoot:()=>where,async setViewState(){this.view=new CalendarView();leaves.push(this);}};
  created++;return leaf;
 }
 const workspace={leftSplit:left,rightSplit:right,getLeavesOfType:()=>leaves,
  getLeftLeaf:()=>makeLeaf(left),getRightLeaf:()=>makeLeaf(right),getLeaf:()=>makeLeaf(root),
  revealLeaf:async leaf=>{revealed=leaf;}};
 const sandbox={writerModuleOn:()=>true,writerUi:pt=>pt,
  WRITER_V83_CAL_VIEW:'writer-v83-calendar',WriterV83CalendarView:CalendarView,
  writerV83Date:v=>/^\d{4}-\d\d-\d\d$/.test(v)?v:'',Notice:class{},console};
 const api=vm.runInNewContext(placement+
  '\n({open:writerV901CalendarOpen,which:writerV901CalendarLeafLocation})',sandbox);
 const plugin={app:{workspace},settings:{v9Calendar:{openLocation:'left'}}};
 const a=await api.open(plugin,'right','2026-11-04');
 assert.equal(a.view.anchor,'2026-11-04');
 assert.equal(a.view.mode,'agenda');
 assert.equal(a.view.writerV9SidebarOpen,false);
 assert.equal(api.which(workspace,a),'right');
 const b=await api.open(plugin,'right');
 assert.equal(a,b);
 assert.equal(created,1);
 assert.equal(revealed,b);
 const c=await api.open(plugin,'left');
 assert.equal(api.which(workspace,c),'left');
 assert.equal(created,2);
});
test('registers left/right/main commands and makes default opener use saved preference',()=>{
 assert.match(placement,/v901-calendar-open-left/);
 assert.match(placement,/v901-calendar-open-right/);
 assert.match(placement,/v901-calendar-open-tab/);
 assert.match(placement,/plugin\.writerCalendarOpen=date=>safeOpen\(plugin\.settings\.v9Calendar\?\.openLocation/);
 assert.match(read('main.js'),/writerV901RegisterCalendar\(this\)/);
 assert.match(read('src/v8/writing-calendar.js'),/callback:\(\)=>void plugin\.writerCalendarOpen\?\.\(\)/);
 assert.match(js,/Abrir o calendário em/);
 assert.match(js,/panel-right-open/);
 assert.match(read('styles.css'),/writer-v901-slot-hit/);
 assert.match(read('scripts/build-v3.js'),/v9\/calendar-placement/);
 assert.match(read('scripts/build-css.js'),/v9-calendar-901\.css/);
});
