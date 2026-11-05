'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const expose=(path,names,extras={})=>vm.runInNewContext(read(path)+'\n({'+names.join(',')+'})',
 {console,Date,Math,Map,Set,Uint8Array,ItemView:class{},writerUi:(pt,en)=>en,...extras});
test('bookshelf: prior book metadata and favorites survive sanitization',()=>{
 const a=expose('src/v10/bookshelf.js',['writerV10BookshelfMerge','writerV10BookRecord','writerV10BookshelfSort','writerV10BookState']);
 const settings={v10Bookshelf:{library:{'Books/Index.md':{favorite:true,shelf:'Sci-fi',progress:64,status:'reading'}},sort:'progress'}};
 a.writerV10BookshelfMerge(settings);
 assert.equal(settings.v10Bookshelf.sort,'progress');
 const value=settings.v10Bookshelf.library['Books/Index.md'];
 assert.equal(value.favorite,true);assert.equal(value.shelf,'Sci-fi');assert.equal(value.progress,64);
 const file={path:'Books/Index.md'},plugin={settings};
 assert.equal(a.writerV10BookState(plugin,{file,meta:{},scenes:[]}).progress,0); // live chapter status overrides stored manual percentage
 assert.equal(a.writerV10BookRecord({progress:999}).progress,100);
});
test('Spaces: versions are bounded and duplicate snapshots avoided',()=>{
 const a=expose('src/v10/space-history.js',['writerV101SpaceHistoryMerge','writerV101SpaceHistoryRemember','writerV101SpaceHistoryEntry','writerV101SpaceLayoutSummary']);
 const settings={v101SpaceHistory:{maxPerSpace:3,history:{}}},cfg=a.writerV101SpaceHistoryMerge(settings);
 const plugin={settings},space={id:'writing'};
 assert.equal(a.writerV101SpaceHistoryRemember(plugin,space,{type:'leaf',state:{type:'markdown'}},'First'),true);
 assert.equal(a.writerV101SpaceHistoryRemember(plugin,space,{type:'leaf',state:{type:'markdown'}},'Again'),false);
 for(let i=0;i<8;i++)a.writerV101SpaceHistoryRemember(plugin,space,{type:'leaf',state:{type:'markdown',page:i}},'Later');
 assert.equal(cfg.history.writing.length,3);
 assert.equal(a.writerV101SpaceHistoryEntry({layout:null}),null);
 assert.equal(a.writerV101SpaceLayoutSummary({type:'leaf'}).panes,1);
});
test('Enhancement suite: validate YAML, filter table, CSV formula injection guard',()=>{
 const a=expose('src/v10/enhancements.js',['writerV101SuiteMerge','writerV101YamlValidate','writerV101TableParse','writerV101TableCsv']);
 const good=a.writerV101YamlValidate('name: Example',x=>({name:'Example'}));
 assert.equal(good.valid,true);
 const invalid=a.writerV101YamlValidate('broken: [',()=>{throw Error('Unexpected mapping');});
 assert.equal(invalid.valid,false);
 const table=a.writerV101TableParse('| Name | Value |\n| --- | --- |\n| Ana | =HYPERLINK("x") |');
 assert.equal(table.rows[0][0],'Ana');
 const csv=a.writerV101TableCsv(table);
 assert.match(csv,/"'=HYPERLINK/);
 assert.equal(a.writerV101SuiteMerge({}).bulkProperties,false);
});
test('Timeline: dependency sort, eras and legacy defaults',()=>{
 const a=expose('src/v9/timeline-blocks.js',['writerV95TimelineParse','writerV101TimelineDependencies']);
 const data=a.writerV95TimelineParse('sort: dependencies\nmax-events: 150\npage-size: 30\n'+
  'date: 2027\ntitle: Second\nid: second\nafter: first\nera: Future\ncontent: B\n---\n'+
  'date: 2026\ntitle: First\nid: first\ncontent: A','timeline-labeled');
 assert.equal(data.events.length,2);
 assert.equal(data.events[0].title,'First');assert.equal(data.events[1].era,'Future');
 assert.equal(data.config.pageSize,30);
 assert.equal(a.writerV95TimelineParse('+ 1\n+ One\n+ Body').config.maxEvents,80);
});
test('Flow: dependency levels are finite even when links cycle',()=>{
 const a=expose('src/v9/flow-composer.js',['writerV101FlowDepths','writerV93FlowParse']);
 const depths=a.writerV101FlowDepths(['[[First]]','[[Second]] | after:[[First]]','[[Third]] | after:[[Second]]']);
 assert.deepEqual(Array.from(depths),[0,1,2]);
 const cyclic=a.writerV101FlowDepths(['[[A]] | after:[[B]]','[[B]] | after:[[A]]']);
 assert.ok(cyclic.every(n=>n>=0&&n<=5));
 assert.equal(a.writerV93FlowParse('layout: graph\n[[A]]',{maxItems:20}).layout,'graph');
});
test('Calendar: deterministic offline ICS parser, bounded events and export',()=>{
 const a=expose('src/v10/calendar-exchange.js',['writerV101IcsParse','writerV101IcsExport','writerV101CalendarExchangeMerge'],
  {writerV83Date:x=>x,writerV83DateOf:d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 const source=['BEGIN:VCALENDAR','BEGIN:VEVENT','SUMMARY:Chapter\\, one','DTSTART;VALUE=DATE:20261108','RRULE:FREQ=WEEKLY','END:VEVENT','END:VCALENDAR'].join('\r\n');
 const events=a.writerV101IcsParse(source);
 assert.equal(events.length,1);assert.equal(events[0].title,'Chapter, one');
 assert.equal(events[0].repeat,'weekly');assert.equal(events[0].date,'2026-11-08');
 const exported=a.writerV101IcsExport(events);
 assert.match(exported,/BEGIN:VEVENT/);assert.match(exported,/DTSTART;VALUE=DATE:20261108/);
 assert.equal(a.writerV101CalendarExchangeMerge({}).maxImport,150);
});
test('Spaced repetition: custom intervals preserve old schedule defaults',()=>{
 const a=expose('src/v8/writing-study.js',['writerV83StudySchedule','writerV83StudyConfig']);
 const first=a.writerV83StudySchedule(null,4,1000);
 assert.equal(first.interval,1);
 const custom=a.writerV83StudySchedule(null,4,1000,{graduatingDays:3});
 assert.equal(custom.interval,3);
 const second=a.writerV83StudySchedule(custom,5,1000,{secondIntervalDays:12});
 assert.equal(second.interval,12);
 assert.equal(a.writerV83StudyConfig({}).dailyMax,30);
});
test('Pomodoro: focus summary tracks local seven-day data',()=>{
 const a=expose('src/v9/pomodoro.js',['writerV101PomodoroSummary'],{require:()=>({ItemView:class{}})});
 const now=new Date('2026-11-04T12:00:00Z').getTime();
 const result=a.writerV101PomodoroSummary([{end:now-1000,minutes:25,task:'Chapter 1'}],now);
 assert.equal(result.total,25);assert.equal(result.tasks[0][1],1);
});
test('Source and bundle ship extension modules, visuals, and translated reference guides',()=>{
 const build=read('scripts/build-v3.js'),css=read('styles.css'),js=read('main.js');
 for(const module of ['v10/space-history','v10/enhancements','v10/calendar-exchange'])assert.ok(build.includes(module),module);
 for(const name of ['writerV101RegisterSpaceHistory(this)','writerV101RegisterEnhancements(this)','writerV101RegisterCalendarExchange(this)'])assert.ok(js.includes(name),name);
 assert.match(css,/writer-v101-focus-bars/);
 for(const file of ['README.md','docs/README.pt-BR.md']){
  assert.match(read(file),/Longform|Markdown|Projetos|Books/);
 }
});
