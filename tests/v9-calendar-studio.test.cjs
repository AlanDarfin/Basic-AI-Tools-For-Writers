'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const old=read('src/v8/writing-calendar.js'),core=read('src/v9/calendar-core.js'),studio=read('src/v9/calendar-studio.js');
const dock=read('src/v10/sidebar-width-1010.js');
class TFile{constructor(path='Writing Calendar/sample.md'){this.path=path;this.extension='md';}}
class TFolder{}
class ItemView{
 constructor(leaf){this.leaf=leaf;this.app=leaf.app;}
 registerEvent(){}
}
const sandbox={ItemView,Modal:class{},Setting:class{},TFile,TFolder,
 writerUi:(pt,en)=>en,writerModuleOn:plugin=>plugin.settings.visibleModules?.calendar!==false,
 writerV8HomeIsMobile:()=>false,console,Date,Set,Map,Intl};
const api=vm.runInNewContext(old+'\n'+core+'\n'+studio+'\n'+dock+
 '\n({format:writerV83CalFormat,parse:writerV83CalParse,occur:writerV83CalOccurrence,valid:writerV83CalValid,'+
 'config:writerV9CalendarMerge,week:writerV9CalendarWeek,period:writerV9CalendarPeriod,weekdays:writerV9CalWeekdays,'+
 'same:writerV9CalSame,exclude:writerV9CalExclude,write:writerV9CalUpdateSeries,create:writerV9CalCreate,'+
 'register:writerV83RegisterCalendar,month:writerV9CalendarMonth,timegrid:writerV9CalendarTimegrid})',sandbox);
const event={title:'Writing session',date:'2026-11-02',time:'09:30',endTime:'10:30',
 repeat:'weekly',repeatInterval:2,repeatDays:[1,3,5],repeatUntil:'2026-12-15',
 exceptions:['2026-11-13'],category:'Writing',color:'blue',location:'Library',details:'Bring draft'};
const plain=value=>JSON.parse(JSON.stringify(value));
test('extended calendar metadata roundtrips as Markdown and retains original note body',()=>{
 const markdown=api.format(event,'Keep **these notes**');
 assert.match(markdown,/writerCalendar: true/);
 assert.match(markdown,/repeatDays:/);
 assert.match(markdown,/exceptions:/);
 assert.match(markdown,/Keep \*\*these notes\*\*/);
 const parsed=api.parse(markdown,'Writing Calendar/sample.md');
 assert.equal(parsed.title,'Writing session');
 assert.equal(parsed.repeatInterval,2);
 assert.equal(parsed.repeatUntil,'2026-12-15');
 assert.deepEqual(plain(parsed.repeatDays),[1,3,5]);
 assert.deepEqual(plain(parsed.exceptions),['2026-11-13']);
 assert.equal(parsed.location,'Library');
 assert.equal(parsed.details,'Bring draft');
 assert.equal(parsed.color,'blue');
 assert.equal(api.parse('---\ntitle: Not a calendar\n---\n','Elsewhere.md'),null);
});
test('weekly intervals and additional weekdays remain bounded and respect excluded dates',()=>{
 const days=api.occur(event,'2026-11-01','2026-11-30').map(e=>e.occurs);
 assert.deepEqual(plain(days),['2026-11-02','2026-11-04','2026-11-06','2026-11-16','2026-11-18','2026-11-20','2026-11-30']);
 assert.equal(api.occur(event,'2027-01-01','2027-02-01').length,0);
 assert.deepEqual(plain(api.weekdays('')) , []);
 assert.deepEqual(plain(api.weekdays('1,3,3,8,-1')), [1,3]);
});
test('single instance exceptions do not delete or alter the series recurrence rule',()=>{
 const e={...event,repeatInterval:1,repeatDays:[1],exceptions:['2026-11-09']};
 const days=api.occur(e,'2026-11-01','2026-11-23').map(x=>x.occurs);
 assert.deepEqual(plain(days),['2026-11-02','2026-11-16','2026-11-23']);
 assert.equal(e.repeat,'weekly');
 assert.equal(e.repeatInterval,1);
});
test('monthly/yearly skipping respects actual month lengths and leap days',()=>{
 const month={title:'End of month',date:'2026-01-31',repeat:'monthly',repeatInterval:1};
 const dates=api.occur(month,'2026-02-01','2026-04-30').map(e=>e.occurs);
 assert.deepEqual(plain(dates),['2026-03-31']);
 const leap={title:'Leap',date:'2024-02-29',repeat:'yearly',repeatInterval:1};
 assert.deepEqual(plain(api.occur(leap,'2025-01-01','2028-12-31').map(e=>e.occurs)),['2028-02-29']);
});
test('three-day view and Monday-start week use local calendar dates',()=>{
 const v={anchor:'2026-11-02',mode:'three'};
 assert.deepEqual(plain(api.period(v)),{start:'2026-11-02',end:'2026-11-04'});
 v.mode='week';
 assert.deepEqual(plain(api.period(v)),{start:'2026-11-02',end:'2026-11-08'});
 assert.equal(api.week('2026-11-08'),'2026-11-02');
 v.mode='agenda';
 assert.equal(api.period(v).end,'2026-12-01');
});
test('mobile defaults and selection of extra views are configurable',()=>{
 const setting={};
 api.config(setting);
 assert.equal(setting.v9Calendar.defaultView,'month');
 assert.equal(setting.v9Calendar.openLocation,'tab');
 assert.equal(setting.v9Calendar.showSidebarMobile,false);
 assert.equal(setting.v9Calendar.showSidebar,true);
 assert.equal(setting.v9Calendar.compactMonth,true);
 const oldSettings={v9Calendar:{defaultView:'three',openLocation:'left',showSidebar:false,startHour:9,endHour:20}};
 api.config(oldSettings);
 assert.equal(oldSettings.v9Calendar.defaultView,'three');
 assert.equal(oldSettings.v9Calendar.openLocation,'left');
 assert.equal(oldSettings.v9Calendar.showSidebar,false);
 oldSettings.v9Calendar.openLocation='bad-value';
 assert.equal(api.config(oldSettings).openLocation,'tab');
});

test('calendar commands use the saved location and reuse the native leaf in each dock',async()=>{
 const leftSplit={children:[]},rightSplit={children:[]},rootSplit={children:[]};
 const commands=new Map(),requested=[],revealed=[];
 let factory;
 const makeLeaf=(split,location)=>{
  requested.push(location);
  const leaf={app,async setViewState(state){
   assert.equal(state.type,'writer-calendar-view');
   await Promise.resolve();
   this.view=factory(this);
   this.view.load=async()=>{};
   this.view.render=()=>{};
   await this.view.onOpen();
  }};
  split.children.push(leaf);
  return leaf;
 };
 const workspace={leftSplit,rightSplit,rootSplit,
  getLeavesOfType:()=>[...leftSplit.children,...rightSplit.children,...rootSplit.children].filter(leaf=>leaf.view),
  getLeaf:type=>{assert.equal(type,'tab');return makeLeaf(rootSplit,'tab');},
  getLeftLeaf:split=>{assert.equal(split,true);return makeLeaf(leftSplit,'left');},
  getRightLeaf:split=>{assert.equal(split,true);return makeLeaf(rightSplit,'right');},
  revealLeaf:async leaf=>{revealed.push(leaf);}
 };
 const app={workspace,vault:{on(){}}};
 const plugin={app,settings:{v9Calendar:{defaultView:'three'}},
  registerView:(_type,create)=>{factory=create;},addCommand:command=>commands.set(command.id,command)};
 api.register(plugin);
 const tab=await plugin.writerCalendarOpen('2026-11-02');
 assert.equal(tab.view.mode,'three');
 assert.equal(tab.view.writerV9SidebarOpen,true);
 assert.equal(tab.view.anchor,'2026-11-02');
 plugin.settings.v9Calendar.openLocation='right';
 commands.get('v83-calendar-open').callback();
 const right=await plugin.writerCalendarOpen('2026-11-04');
 assert.equal(right.view.mode,'agenda');
 assert.equal(right.view.writerV9SidebarOpen,false);
 assert.equal(right.view.anchor,'2026-11-04');
 assert.equal(await plugin.writerCalendarOpen('2026-02-30'),right);
 assert.equal(right.view.anchor,'2026-11-04');
 assert.deepEqual(requested,['tab','right']);
 assert.equal(revealed.at(-1),right);
 const locations=[];
 const open=plugin.writerCalendarOpenIn;
 plugin.writerCalendarOpenIn=where=>locations.push(where);
 for(const where of ['tab','left','right'])commands.get('v901-calendar-open-'+where).callback();
 assert.deepEqual(locations,['tab','left','right']);
 plugin.writerCalendarOpenIn=open;
 assert.equal(await plugin.writerCalendarOpenIn('tab'),tab);
 plugin.settings.visibleModules={calendar:false};
 assert.equal(await plugin.writerCalendarOpenIn('left'),null);
 assert.deepEqual(requested,['tab','right']);
});

class Element{
 constructor(tag='div',options={}){
  this.tag=tag;this.options=options;this.children=[];this.events={};this.style={setProperty(){}};
 }
 createEl(tag,options){const node=new Element(tag,options);this.children.push(node);return node;}
 createSpan(options){return this.createEl('span',options);}
 createDiv(options){return this.createEl('div',options);}
 setAttribute(name,value){this.options.attr[name]=value;}
 addEventListener(type,callback){this.events[type]=callback;}
}

test('time grid uses named add buttons for empty slots and keeps event chips independently actionable',()=>{
 const parent=new Element(),edited=[];
 const view={plugin:{settings:{v9Calendar:{startHour:9,endHour:10}}},edit:value=>edited.push(value)};
 const range={start:'2026-11-02',end:'2026-11-03'};
 const existing={occurs:range.start,title:'Writing',date:range.start,time:'09:30',repeat:'none'};
 api.timegrid(view,parent,range,[existing]);
 const cells=parent.children[0].children.filter(node=>node.options.cls?.includes('writer-v9-calendar-time-slot'));
 const buttons=cells.flatMap(node=>node.children.filter(child=>child.options.cls==='writer-v9-calendar-slot-add'));
 assert.equal(buttons.length,4);
 assert.ok(buttons.every(button=>button.tag==='button'&&button.options.attr.type==='button'&&!button.children.length));
 assert.match(buttons[0].options.attr['aria-label'],/all-day event.+November 2/i);
 assert.match(buttons[3].options.attr['aria-label'],/November 3.+09:00/i);
 buttons[0].events.click();buttons[3].events.click();
 cells[2].children[0].events.click();
 assert.deepEqual(plain(edited),[{date:range.start},{date:range.end,time:'09:00'},existing]);
});

test('month view marks the selected day card and a tap on its free space creates one event',()=>{
 const parent=new Element(),edited=[];
 const view={anchor:'2026-11-16',mode:'month',plugin:{settings:{v9Calendar:{}}},edit:value=>edited.push(value),render(){}};
 api.month(view,parent,{start:'2026-11-01',end:'2026-11-30'},[]);
 const selected=parent.children[0].children.filter(node=>node.options.cls?.includes('is-selected'));
 assert.equal(selected.length,1);
 const card=selected[0],dateButton=card.children[0].children[0];
 assert.equal(dateButton.options.attr['aria-current'],'date');
 card.events.click({target:dateButton,detail:1});
 card.events.click({target:card,detail:1});
 card.events.click({target:card,detail:2});
 assert.deepEqual(plain(edited),[{date:view.anchor}]);
 dateButton.events.click();
 assert.equal(view.mode,'day');
});
test('invalid dates, out-of-range until and reversed times do not pass validation',()=>{
 assert.equal(api.valid({...event,date:'2026-02-30'}),null);
 assert.equal(api.valid({...event,repeatUntil:'2026-10-02'}),null);
 assert.equal(api.valid({...event,time:'18:00',endTime:'17:00'}),null);
 assert.ok(api.valid({...event,repeatUntil:'2026-12-20'}));
});
test('editing rejects concurrent modifications instead of overwriting source Markdown',async()=>{
 const original=api.format(event,'My retained notes');
 const file=new TFile();let stored=original,changed=false;
 const app={vault:{
  getAbstractFileByPath:()=>file,
  process:async(target,fn)=>{stored=fn(stored);changed=true;}
 }};
 await api.write({app},api.parse(original,file.path),x=>({...x,title:'Revised'}));
 assert.equal(changed,true);
 assert.match(stored,/Revised/);
 assert.match(stored,/My retained notes/);
 await assert.rejects(()=>api.write({app},api.parse(original,file.path),x=>x),/changed elsewhere|alterado/);
});
test('calendar rendering adds no second global sidebar, remote APIs or external sync',()=>{
 const main=read('main.js'),css=read('styles.css');
 for(const key of ['writerV9CalendarMerge(this.settings)','writerV9CalendarSettings(this.plugin,panel)','writerV9CalEditor']){
  assert.ok(main.includes(key),key);
 }
 assert.match(studio,/three/);
 assert.match(studio,/writerV9CalendarSidebar/);
 assert.match(css,/writer-v9-calendar-month-day/);
 assert.match(css,/writer-v9-calendar-month-day\.is-selected/);
 assert.match(css,/writer-v9-calendar-slot-add:focus-visible/);
 assert.doesNotMatch(studio,/registerView\(|getLeftLeaf\(|getRightLeaf\(|detachLeavesOfType\(/);
 assert.doesNotMatch(core,/requestUrl|fetch\(|CalDAV|OAuth/);
});
