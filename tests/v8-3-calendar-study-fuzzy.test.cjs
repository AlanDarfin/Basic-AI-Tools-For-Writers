'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const fuzzy=read('src/v8/home-fuzzy.js'),calendar=read('src/v8/writing-calendar.js'),study=read('src/v8/writing-study.js');
const f=vm.runInNewContext(fuzzy+'\n({score:writerV83FuzzyScore,search:writerV83FuzzySearch})',{});
const cal=vm.runInNewContext(calendar+'\n({parse:writerV83CalParse,format:writerV83CalFormat,occur:writerV83CalOccurrence,date:writerV83Date,valid:writerV83CalValid})',
 {ItemView:class{},Modal:class{},console});
const sr=vm.runInNewContext(study+'\n({cards:writerV83StudyCards,due:writerV83StudyDue,schedule:writerV83StudySchedule,config:writerV83StudyConfig})',
 {ItemView:class{},console});
test('fuzzy search ranks titles, accents, headings, partial and one-letter typos',()=>{
 const files=[{basename:'Introdução',path:'Livro/Introdução.md'},
  {basename:'Capítulo Principal',path:'Livro/Capítulo Principal.md'},
  {basename:'Rascunho',path:'Notas/Rascunho.md'}];
 const cache={getFileCache:file=>({headings:file===files[2]?[{heading:'Escola de Escrita'}]:[]})};
 assert.equal(f.search(files,'introducao',cache)[0].path,files[0].path);
 assert.equal(f.search(files,'capitlo',cache)[0].path,files[1].path);
 assert.equal(f.search(files,'escola',cache)[0].path,files[2].path);
 assert.equal(f.search(files,'nonexistent',cache).length,0);
 assert.ok(f.score('Capítulo Principal','capitulo')>f.score('Capítulo Principal','ciprin'));
});
test('calendar validates malformed dates and times without timezone shifts',()=>{
 assert.equal(cal.date('2026-02-30'),'');
 assert.equal(cal.date('2026-02-28'),'2026-02-28');
 assert.equal(cal.valid({title:'Test',date:'2026-02-30'}),null);
 assert.equal(cal.valid({title:'Test',date:'2026-11-02',time:'22:30',endTime:'17:00'}),null);
 assert.ok(cal.valid({title:'Test',date:'2026-11-02',time:'11:00',endTime:'12:00'}));
});
test('calendar event notes store writable metadata, preserve body and parse recurrence',()=>{
 const event={title:'Aula de escrita',date:'2026-11-02',time:'10:00',endTime:'11:00',repeat:'weekly',category:'estudo'};
 const markdown=cal.format(event,'Revisar [[Caderno]]');
 assert.match(markdown,/writerCalendar: true/);assert.match(markdown,/startDate:/);
 const result=cal.parse(markdown,'Writing Calendar/2026-11-02-event.md');
 assert.equal(result.title,'Aula de escrita');
 assert.equal(result.repeat,'weekly');
 assert.equal(cal.parse('---\ntitle: unrelated\n---\n','Notes.md'),null);
});
test('recurrence correctly handles weekly / monthly / daily and stays bounded',()=>{
 const weekly=cal.occur({date:'2026-11-02',repeat:'weekly',title:'Aula'},'2026-11-01','2026-11-30');
 assert.equal(weekly.length,5);
 const monthly=cal.occur({date:'2026-01-31',repeat:'monthly',title:'Lembrete'},'2026-02-01','2026-03-31');
 assert.equal(monthly.length,1);
 assert.equal(monthly[0].occurs,'2026-03-31');
 assert.equal(cal.occur({date:'2026-11-02',repeat:'daily'},'2026-11-01','2026-11-03').length,2);
});
test('study finds tagged Q&A, reversible and cloze cards without editing files',()=>{
 const file={path:'Estudos/Geografia.md',parent:{path:'Estudos'}};
 const cards=sr.cards('#flashcards\nQual a capital?::Brasília\nA:::B\nO Brasil fala ==português==.\nUma {{c1::lacuna}} aqui.',file,'flashcards');
 assert.equal(cards.length,5);
 assert.equal(cards[0].front,'Qual a capital?');
 assert.equal(cards[1].front,'A');assert.equal(cards[2].front,'B');
 assert.ok(cards.some(x=>x.front.includes('[…]')));
 assert.ok(cards.every(x=>x.deck==='Estudos'&&x.id));
 assert.equal(sr.cards('Sem tag\nQ::A',file,'flashcards').length,0);
});
test('study schedules again, hard, good and easy with future due times',()=>{
 const time=Date.UTC(2026,10,2,12);
 const failed=sr.schedule(null,0,time);
 const good=sr.schedule(null,4,time);
 const easy=sr.schedule(null,5,time);
 assert.equal(failed.due-time,600000);
 assert.equal(good.interval,1);
 assert.ok(easy.due>time);
 const due=sr.due([{id:'a',deck:'A'},{id:'b',deck:'B'}],
   {a:{due:time-1},b:{due:time+30000}},time,10,'A');
 assert.equal(due.length,1);assert.equal(due[0].id,'a');
});
test('study settings preserve previous review records and bound session sizes',()=>{
 const state={v83Study:{dailyMax:999,newMax:-1,history:{abc:{due:123}}}};
 sr.config(state);
 assert.equal(state.v83Study.dailyMax,100);
 assert.equal(state.v83Study.newMax,1);
 assert.equal(state.v83Study.history.abc.due,123);
});
test('new modules are opt-in views and do not touch CodeMirror or delete unrelated notes',()=>{
 assert.match(calendar,/WRITER_V83_CAL_VIEW/);
 assert.match(study,/WRITER_V83_STUDY_VIEW/);
 assert.match(calendar,/writerCalendar: true/);
 assert.match(calendar,/vault\.process\(/);
 assert.match(calendar,/Confirmar exclusão/);
 for(const source of [calendar,study,fuzzy]){
  assert.doesNotMatch(source,/registerEditorExtension\(/);
  assert.doesNotMatch(source,/detachLeavesOfType\(/);
 }
 const main=read('main.js'),styles=read('styles.css');
 for(const name of ['writerV83RegisterCalendar','writerV83RegisterStudy','writerV83FuzzySearch'])assert.ok(main.includes(name),name);
 for(const style of ['writer-v83-cal-month','writer-v83-study-choices'])assert.ok(styles.includes(style),style);
});
test('release documentation preserves previous blocks, home and new study features',()=>{
 for(const name of ['README.md','docs/README.pt-BR.md']){
  const content=read(name);
  for(const key of [require('../manifest.json').version,'writer-tabs','writer-avatar','writer-wiki','writer-post',
    'writer-media-gallery','writer-chat','#flashcards','Full Calendar','fuzzy']){
   assert.ok(content.toLowerCase().includes(key.toLowerCase()),name+' missing '+key);
  }
 }
});
