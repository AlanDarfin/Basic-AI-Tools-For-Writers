'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const old=read('src/v8/writing-calendar.js'),core=read('src/v9/calendar-core.js'),studio=read('src/v9/calendar-studio.js');
class TFile{constructor(path='Writing Calendar/sample.md'){this.path=path;this.extension='md';}}
class TFolder{}
const sandbox={ItemView:class{},Modal:class{},Setting:class{},TFile,TFolder,
 writerUi:(pt,en)=>en,console,Date,Set,Map,Intl};
const api=vm.runInNewContext(old+'\n'+core+'\n'+studio+
 '\n({format:writerV83CalFormat,parse:writerV83CalParse,occur:writerV83CalOccurrence,valid:writerV83CalValid,'+
 'config:writerV9CalendarMerge,week:writerV9CalendarWeek,period:writerV9CalendarPeriod,weekdays:writerV9CalWeekdays,'+
 'same:writerV9CalSame,exclude:writerV9CalExclude,write:writerV9CalUpdateSeries,create:writerV9CalCreate})',sandbox);
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
 assert.equal(setting.v9Calendar.showSidebarMobile,false);
 assert.equal(setting.v9Calendar.showSidebar,true);
 assert.equal(setting.v9Calendar.compactMonth,true);
 const oldSettings={v9Calendar:{defaultView:'three',showSidebar:false,startHour:9,endHour:20}};
 api.config(oldSettings);
 assert.equal(oldSettings.v9Calendar.defaultView,'three');
 assert.equal(oldSettings.v9Calendar.showSidebar,false);
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
 assert.doesNotMatch(studio,/registerView\(|getLeftLeaf\(|getRightLeaf\(|detachLeavesOfType\(/);
 assert.doesNotMatch(core,/requestUrl|fetch\(|CalDAV|OAuth/);
});
