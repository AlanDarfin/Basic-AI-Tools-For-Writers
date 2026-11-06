'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
function load(path,names,extra={}){
 const sandbox={
  console,Number,Math,String,Object,Set,Map,Date,JSON,
  writerUi:(pt,en)=>pt,...extra
 };
 const value=vm.runInNewContext(read(path)+'\n({'+names.join(',')+'})',sandbox);
 return value;
}
test('Unique study configuration preserves vault paths and never creates notes at startup',()=>{
 const a=load('src/v10/suite-education-1011.js',
  ['writerV1011StudyCfg','writerV1011StudyPath','writerV1011StudyDate','writerV1011StudyTimetable','writerV1011StudyReminders']);
 const settings={v1011Study:{root:'../Secrets',daily:'Diario',classes:'Aulas',reminders:'Lembretes.md'}};
 const cfg=a.writerV1011StudyCfg(settings);
 assert.equal(cfg.root,'Estudos','path traversal is not accepted');
 assert.equal(a.writerV1011StudyPath(cfg,'reminders'),'Estudos/Lembretes.md');
 assert.equal(a.writerV1011StudyDate(new Date(2026,10,6)),'2026-11-06');
 const t='| Dia | Hora | Aula | Local |\n| --- | --- | --- | --- |\n| Seg | 09:00 | Matemática | Sala 2 |\n| Ter | 10:00 | Física | Sala 3 |';
 assert.equal(a.writerV1011StudyTimetable(t).length,2);
 const r=a.writerV1011StudyReminders('- [ ] [due:: 2026-11-09] prova\n- [x] [due:: 2026-11-01] concluído\n- [ ] [due:: 2026-11-06] ler');
 assert.deepEqual(Array.from(r,item=>item.label),['ler','prova']);
});
test('Unique daily/class notes are user-triggered, local and non-overwriting',async()=>{
 const a=load('src/v10/suite-education-1011.js',
  ['writerV1011StudyDaily','writerV1011StudyClass','writerV1011StudyReminder']);
 const folders=new Map(),created=[],read=new Map();
 const vault={
  getAbstractFileByPath(path){return folders.get(path)||read.get(path)||null;},
  async createFolder(path){folders.set(path,{children:[],path});},
  async create(path,body){const file={path,extension:'md'};created.push(path);read.set(path,file);return file;},
  async process(file,fn){file.body=fn(file.body||'');}
 };
 const plugin={settings:{},app:{vault,workspace:{getLeaf:()=>({openFile:async()=>{}})}}};
 assert.equal(created.length,0,'registering should not write');
 await a.writerV1011StudyDaily(plugin,new Date(2026,10,6));
 assert.equal(created[0],'Estudos/Diário/2026-11/2026-11-06.md');
 await a.writerV1011StudyDaily(plugin,new Date(2026,10,6));
 assert.equal(created.length,1,'daily file should be reopened, never overwritten');
 await a.writerV1011StudyClass(plugin,'Física','1º semestre',new Date(2026,10,6));
 assert.equal(created.length,2);
 await assert.rejects(a.writerV1011StudyClass(plugin,'Física','1º semestre',new Date(2026,10,6)),/existe/);
 await a.writerV1011StudyReminder(plugin,'Revisar capítulo','2026-11-20');
 assert.equal(created.length,3,'reminder note created on explicit action only');
 await assert.rejects(a.writerV1011StudyReminder(plugin,'Revisar capítulo','2026-13-30'),/Invalid/);
});
test('Notion additional Markdown views, rollup source and safe chart arithmetic',()=>{
 const a=load('src/v10/suite-notion-1011.js',
  ['writerV1011NotionSpec','writerV1011NotionChart','writerV1011NotionDate','writerV1011NotionSafeName'],
  {writerV107DbSpec:()=>({view:'table',columns:['file','status'],limit:80,formulas:[],rollups:[]})});
 const spec=a.writerV1011NotionSpec('database: Tasks\nview: gallery\ngroup: status\ncover: banner\n');
 assert.equal(spec.folder,'Databases/Tasks');
 assert.equal(spec.view,'gallery');
 assert.equal(a.writerV1011NotionSpec('folder: Vault/Notes\nview: timeline').view,'timeline');
 assert.equal(a.writerV1011NotionSpec('view: untrusted').view,'table');
 assert.equal(a.writerV1011NotionDate('2026-02-30'),'');
 assert.equal(a.writerV1011NotionSafeName('../unsafe/'),'unsafe');
 const chart=a.writerV1011NotionChart([
  {data:{status:'Done',hours:3}},{data:{status:'Done',hours:2}},
  {data:{status:'Todo',hours:1}}],'status','hours');
 assert.deepEqual(Array.from(chart,x=>[x[0],x[1]]),[['Done',5],['Todo',1]]);
});
test('Number Suite compatible safe parsing: code fences, YAML, preview and conservative cleanup',()=>{
 const a=load('src/v10/suite-numbering-1011.js',
  ['writerV1011NumberCfg','writerV1011NumberHeadings','writerV1011NumberStored','writerV1011NumberPlan']);
 const tick=String.fromCharCode(96).repeat(3);
 const source=['---','title: A','# YAML','---','# Main','## Part',tick,'## Do not number',tick,
  '## 3. Old chapter','> ## Quoted','# 1 way to write','### Appendix'].join('\n');
 const headings=a.writerV1011NumberHeadings(source);
 assert.equal(headings.length,5);
 const plan=a.writerV1011NumberPlan(source,'write');
 assert.ok(plan.changes.some(c=>c.after==='## 1.2. Old chapter'));
 assert.ok(!plan.changes.some(c=>c.before.includes('Do not number')));
 assert.ok(!plan.changes.some(c=>c.before.includes('Quoted')));
 assert.equal(a.writerV1011NumberStored('1 way to write'),null);
 assert.deepEqual(Array.from(a.writerV1011NumberPlan(plan.after,'remove').changes,x=>x.line).slice(0,4),[5,6,10,12]);
 const cfg=a.writerV1011NumberCfg({});
 assert.equal(cfg.virtual,false,'no unexpected visual numbering on upgrade');
});
test('Suites isolated by guarded registration, no extra ribbon and no external network',()=>{
 const build=read('scripts/build-v3.js'),enhance=read('src/v10/enhancements.js');
 for(const module of ['suite-education-1011','suite-notion-1011','suite-numbering-1011']){
  assert.match(build,new RegExp("'v10/"+module+"'"));
  const source=read('src/v10/'+module+'.js');
  assert.doesNotMatch(source,/addRibbonIcon|requestUrl|fetch\s*\(/,module);
 }
 for(const fn of ['writerV1011StudyRegister','writerV1011NotionRegister','writerV1011NumberRegister']){
  assert.match(enhance,new RegExp("safeRegister\\([^\\n]*"+fn+"\\(plugin\\)"));
 }
 const numbering=read('src/v10/suite-numbering-1011.js');
 assert.match(numbering,/vault\.process\(file,current=>/);
 assert.match(numbering,/current!==plan\.before/);
 assert.match(numbering,/approved/);
 assert.doesNotMatch(numbering,/vault\.modify\(/);
 const notion=read('src/v10/suite-notion-1011.js');
 assert.doesNotMatch(notion,/registerMarkdownCodeBlockProcessor\?\.\('notion-db'/);
});
