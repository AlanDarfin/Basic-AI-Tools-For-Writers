'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class TFile{constructor(path){this.path=path;this.extension='md';this.name=path.split('/').at(-1);this.basename=this.name.slice(0,-3);this.parent={path:path.split('/').slice(0,-1).join('/')};}}
class TFolder{constructor(path){this.path=path;}}
class MarkdownView{}
class ObsidianModal{}
class FuzzySuggestModal{}
const mockObsidian={getLanguage:()=> 'en'};
const root=fs;
const names=['core','editor','tts','unicode','toc','homework','settings'];
const source=names.map(n=>root.readFileSync('src/v4/'+n+'.js','utf8').replace(/^'use strict';\s*/,'')).join('\n');
const env={TFile,TFolder,MarkdownView,Modal:ObsidianModal,FuzzySuggestModal,Setting:class{},Menu:class{},
 ViewPlugin:{fromClass:Cls=>Cls},Notice:class{},requestAnimationFrame:f=>f(),require:name=>name==='obsidian'?mockObsidian:require(name),
 writerMaskMarkdown:text=>text.replace(/[_*]/g,' '),getLocale:()=> 'en',console,setTimeout,clearTimeout};
const api=vm.runInNewContext(source+'\n({W4_DEFAULTS,w4merge,w4locale,w4label,w4text,w4UnicodeFromCode,w4HomeworkNormalize,WriterV4Editor,WriterTTS,WriterUnicode,WriterInstaToc,WriterHomework})',env);
let passed=0;
function check(label,run){run();passed++;console.log('PASS',label);}
async function asyncCheck(label,run){await run();passed++;console.log('PASS',label);}
function plugin(settings,app){
 return {settings,app,saveSettings:async()=>{},addCommand:()=>{},registerEditorExtension:()=>{},registerEvent:()=>{}};
}
async function run(){
 check('Migrate v3 settings without losing existing AI/project data',()=>{
  const old={schemaVersion:3,aiKeys:{gemini:'private'},projectsData:{'Book/Index.md':{goal:12000}}};
  const merged=api.w4merge(old);
  assert.equal(merged.schemaVersion,4);
  assert.equal(merged.aiKeys.gemini,'private');
  assert.equal(merged.projectsData['Book/Index.md'].goal,12000);
  for(const k of ['abbreviations','anotherName','viewMode','homework','instaToc','unicode','noteTemplates','tts'])assert.ok(merged[k]);
 });
 check('Original abbreviation defaults and case-sensitive configuration',()=>{
  const cfg=api.w4merge({});
  assert.equal(cfg.abbreviations.entries['atm'].value,'at the moment');
  assert.equal(cfg.abbreviations.entries['eg.'].value,'for example');
  cfg.abbreviations.entries['atm'].isCaseSensitive=true;
  assert.equal(cfg.abbreviations.entries['atm'].isCaseSensitive,true);
 });
 check('Space-triggered abbreviation expansion preserves remaining sentence',()=>{
  const state={doc:{text:'I am here atm ',sliceString(from,to){return this.text.slice(from,to);}},selection:{main:{empty:true,head:14}}};
  state.selection.main.head=state.doc.text.length;
  const view={hasFocus:true,state,dispatch({changes}){state.doc.text=state.doc.text.slice(0,changes.from)+changes.insert+state.doc.text.slice(changes.to);}};
  const pl=plugin(api.w4merge({}),{});
  const C=new api.WriterV4Editor(pl).extension();
  const extension=new C(view);
  extension.update({docChanged:true,view,state,transactions:[{isUserEvent:v=>v==='input.type',changes:{iterChanges(cb){cb(0,0,0,0,{toString:()=> ' '});}}}]});
  assert.equal(state.doc.text,'I am here at the moment ');
 });
 check('Unicode search resolves arbitrary code points and rejects invalid scalars',()=>{
  assert.equal(api.w4UnicodeFromCode('U+2764').char,'❤');
  assert.equal(api.w4UnicodeFromCode('0x2192').char,'→');
  assert.equal(api.w4UnicodeFromCode('U+D800'),null);
  assert.equal(api.w4UnicodeFromCode('U+110000'),null);
  assert.ok(new api.WriterUnicode(plugin(api.w4merge({}),{})).items().some(x=>x.char==='∞'));
 });
 check('Offline TTS chunks prose and does not require an AI API',()=>{
  const pl=plugin(api.w4merge({}),{});
  const tts=new api.WriterTTS(pl);
  assert.ok(tts.split('A '.repeat(300)).length>1);
  assert.ok(tts.split('A '.repeat(300)).every(x=>x.length<=220));
  assert.ok(tts.clean('A _palavra_').includes('palavra'));
 });
 check('Longform homework data restores lists and groups independently',()=>{
  const a={goal:9000};const b={goal:3000};
  const one=api.w4HomeworkNormalize(a),two=api.w4HomeworkNormalize(b);
  one.views[0].subjects.push({name:'Capítulo 1',tasks:[]});
  one.views[0].tasks.push({name:'Revisar',done:false});
  assert.equal(two.views[0].tasks.length,0);
  assert.equal(one.views[0].subjects.length,1);
  assert.equal(a.goal,9000);
 });
 check('Insta TOC respects Markdown heading metadata and exclusion filters',()=>{
  const file=new TFile('Book.md'),settings=api.w4merge({});settings.instaToc.exclude='Omitir';
  const app={metadataCache:{getFileCache:()=>({headings:[{heading:'Início',level:1},{heading:'Omitir',level:2},{heading:'Cena',level:2},{heading:'Oculto <!-- omit -->',level:3}]})}};
  const toc=new api.WriterInstaToc(plugin(settings,app));
  assert.equal(toc.headings(file).length,2);
  assert.ok(toc.entries(file).includes('[[#Cena|Cena]]'));
 });
 check('English localization and Portuguese override both work',()=>{
  const pl=plugin(api.w4merge({}),{});
  assert.equal(api.w4label(pl,'Compilar'),'Compile');
  pl.settings.interfaceLanguage='pt';
  assert.equal(api.w4label(pl,'Compilar'),'Compilar');
  assert.equal(api.w4text(pl,'Voz','Voice'),'Voz');
 });
 await asyncCheck('Template by note name never overwrites edited notes',async()=>{
  const settings=api.w4merge({});
  const notes=new Map([['Book/Test.md','Already edited'],['Templates/Test.md','# {{title}}']]);
  const app={vault:{
   getAbstractFileByPath:p=>p==='Templates'?new TFolder('Templates'):notes.has(p)?new TFile(p):null,
   getMarkdownFiles:()=>[...notes.keys()].map(x=>new TFile(x)),
   cachedRead:async file=>notes.get(file.path),
   process:async(file,fn)=>{notes.set(file.path,fn(notes.get(file.path)));}
  }};
  const handler=new api.WriterV4Editor(plugin(settings,app));
  await handler.applyTemplate(new TFile('Book/Test.md'));
  assert.equal(notes.get('Book/Test.md'),'Already edited');
  notes.set('Book/Test.md','');
  await handler.applyTemplate(new TFile('Book/Test.md'));
  assert.equal(notes.get('Book/Test.md'),'# Test');
 });
 await asyncCheck('Per-note view mode respects prefer-view: read',async()=>{
  const file=new TFile('Book/Chapter.md');let result;
  const editor=new MarkdownView();editor.file=file;editor.getState=()=>({mode:'source',source:true});
  editor.setState=async state=>{result=state;};
  const app={metadataCache:{getFileCache:()=>({frontmatter:{'prefer-view':'read'}})},
   workspace:{getActiveViewOfType:()=>editor},vault:{adapter:{}}};
  await new api.WriterV4Editor(plugin(api.w4merge({}),app)).applyViewMode(file);
  assert.equal(result.mode,'preview');
 });
 check('Version 4 modules are assembled in the standalone plugin',()=>{
  const s=fs.readFileSync('main.js','utf8');
  assert.ok(s.includes('// BEGIN WRITER V4 MODULES'));
  assert.ok(s.includes('class WriterInstaToc'));
  assert.ok(s.includes('class WriterHomework'));
  assert.ok(s.includes('class WriterTTS'));
 });
 console.log(passed+' v4 tests passed.');
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
