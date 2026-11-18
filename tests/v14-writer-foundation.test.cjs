'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

class TFolder{constructor(path){this.path=path;}}
class TFile{
 constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension=path.split('.').pop();this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
function setup({obsidian={},globals={}}={}){
 const notices=[],jobs=new Map();let timer=0;
 const sandbox={console,module:{exports:{}},EditorSuggest:class{},writerModuleOn:()=>true,
  setTimeout:(fn,delay)=>{const id=++timer;jobs.set(id,{fn,delay});return id;},clearTimeout:id=>jobs.delete(id),
  require:()=>({TFile,TFolder,Notice:class{constructor(message){notices.push(message);}},
   ItemView:class{},Modal:class{},...obsidian}),...globals};
 const code=['projects.js','src/v3/core.js','src/v3/complements.js'].map(read).join('\n');
 const api=vm.runInNewContext(code+'\n({getLocale,lfMsg,writerUi,clean,lfProjectSceneFolder,ProjectsView,lfFlattenScenes,lfNestScenes,lfNumberScenes,writerMaskMarkdown,writerGrammarMatchIsSafe,writerSafeReplace,writerParseVariants,writerEncodeVariant,writerVariantAt,WriterComplements})',sandbox);
 const flush=async delay=>{
  for(const [id,job] of [...jobs])if(job.delay===delay&&jobs.delete(id))await job.fn();
 };
 return {api,notices,jobs,flush};
}
function projectHarness(){
 const h=setup(),files=new Map(),contents=new Map(),opens=[];
 const insert=(path,text)=>{
  const file=new TFile(path);files.set(path,file);contents.set(path,text);return file;
 };
 const index=insert('Book/Index.md','index content'),chapter=insert('Book/Chapter.md','The chapter.');
 const project={file:index,title:'Book',format:'scenes',scenes:['Chapter'],meta:{}};
 const app={workspace:{getLeavesOfType:()=>[]},vault:{
  getAbstractFileByPath:path=>files.get(path),getMarkdownFiles:()=>[...files.values()].filter(x=>x.extension==='md'),
  cachedRead:async file=>contents.get(file.path),read:async file=>contents.get(file.path),
  create:async(path,text)=>{assert.ok(!files.has(path));return insert(path,text);},
  createFolder:async path=>{files.set(path,new TFolder(path));},
  process:async(file,fn)=>{contents.set(file.path,fn(contents.get(file.path)));}
 },metadataCache:{getFileCache:()=>null}};
 let saves=0;
 const plugin={app,settings:{},saveSettings:async()=>{saves++;}};
 const view=Object.assign(new h.api.ProjectsView({},plugin),{app,render:async()=>{},openFile:file=>opens.push(file),indexes:()=>[project]});
 const workflow=target=>({steps:[{id:'concatenate-text'},{id:'write-to-note',optionValues:{target,'open-after':false}}]});
 return {...h,app,view,project,plugin,chapter,insert,contents,files,opens,workflow,saves:()=>saves};
}
test('language APIs share priority and handle unavailable or denied locale sources',()=>{
 for(const [obsidian,globals,locale] of [
  [{getLanguage:()=> 'pt_BR'},{window:{localStorage:{getItem:()=> 'en'}}},'pt'],
  [{getLanguage:()=> 'fr'},{window:{localStorage:{getItem:()=> 'pt'}}},'en'],
  [{getLanguage:()=>{throw Error('unavailable');}},{window:{localStorage:{getItem:()=> 'pt-BR'}}},'pt'],
  [{},{window:{get localStorage(){throw Error('denied');}},navigator:{language:'pt-PT'}},'pt'],
  [{},{},'en']
 ]){
  const {api}=setup({obsidian,globals});
  assert.equal(api.getLocale(),locale);
  assert.equal(api.lfMsg('Salvar','Save'),api.writerUi('Salvar','Save'));
  assert.equal(api.writerUi('Salvar','Save'),locale==='pt'?'Salvar':'Save');
 }
});
test('new paths reject reserved names and scene folders cannot climb above the project',()=>{
 const {api}=setup();
 for(const value of ['.','..','   ... ','CON','con.txt','nul .txt','LPT3.md','CoM¹.fragment','__proto__','constructor','prototype'])assert.equal(api.clean(value),'',value);
 assert.equal(api.clean(' Chapter: 1 .. '),'Chapter- 1');
 assert.equal(api.clean('Arc\x00One'),'Arc-One');
 const project={file:{parent:{path:'Projects/Book'}},meta:{}};
 assert.equal(api.lfProjectSceneFolder(project,'/'), 'Projects/Book');
 assert.equal(api.lfProjectSceneFolder(project,'Scenes/../Manuscript/'), 'Projects/Book/Manuscript');
 for(const path of ['../Book 2','Scenes/../../Book 2','../Book/Scenes','..\\Outside','C:/Novel','CON/Scenes']){
  assert.equal(api.lfProjectSceneFolder(project,path),null,path);
 }
 assert.equal(api.lfProjectSceneFolder({file:{parent:{path:'/'}},meta:{}},'Scenes'),'Scenes');
});
test('scene hierarchy round-trips and numbers siblings and descendants',()=>{
 const {api}=setup();
 const value=['A',['B',['C'],'D'],'E',['F'],'G'];
 const flat=api.lfFlattenScenes(value);
 assert.deepEqual(plain(api.lfNestScenes(flat)),value);
 assert.deepEqual(plain(api.lfNumberScenes(flat).map(item=>item.numbering)),['1','1.1','1.1.1','1.2','2','2.1','3']);
});
test('Markdown masking preserves UTF-16 and filters YAML, nested fences, links, raw HTML and variants',()=>{
 const {api}=setup();
 const variant=api.writerEncodeVariant(['um | dois','três } com \\'],1);
 const source=[
  '---','title: yamlpalavra','---','🍂 Prosa livre.',
  '````js','```markdown','codigopalavra','```','````',
  '<script>scriptpalavra</script>','<em>visível</em>','[[wikialvo]]','[rótulo](https://example.com)',variant,'Último.'
 ].join('\r\n');
 const masked=api.writerMaskMarkdown(source);
 assert.equal(masked.length,source.length);
 assert.equal(masked.match(/\r\n/g).length,source.match(/\r\n/g).length);
 for(const word of ['yamlpalavra','codigopalavra','scriptpalavra','wikialvo','rótulo','três']){
  assert.equal(api.writerGrammarMatchIsSafe(source,masked,{offset:source.indexOf(word),length:word.length}),false,word);
 }
 for(const word of ['Prosa','visível','Último']){
  assert.equal(api.writerGrammarMatchIsSafe(source,masked,{offset:source.indexOf(word),length:word.length}),true,word);
 }
 const [found]=api.writerParseVariants(source);
 assert.equal(found.raw,variant);
 assert.deepEqual(plain(api.writerVariantAt(source,found.from+3).variants),['um | dois','três } com \\']);
 assert.equal(api.writerVariantAt(source,0),null);
});
test('snapshot choice uses the operation, never the translated reason',async()=>{
 const {api}=setup();
 const file=new TFile('Scene.md'),snapshots=[];
 let text='old';
 const plugin={settings:{snapshots:{enabled:true,snapshotBeforeRewrite:false},variants:{snapshotBeforeCommit:true}},
  app:{workspace:{getLeavesOfType:()=>[]},vault:{read:async()=>text,process:async(_file,update)=>{text=update(text);}}},
  writerSnapshots:{create:async(_file,reason,data)=>{snapshots.push([reason,data.content]);}}};
 await api.writerSafeReplace(plugin,file,0,3,'old','one',{reason:'confirmar variante',snapshot:'rewrite'});
 assert.deepEqual(snapshots,[]);
 await api.writerSafeReplace(plugin,file,0,3,'one','two',{reason:'confirm all variants',snapshot:'commit'});
 assert.deepEqual(snapshots,[['Before confirm all variants','one']]);
 assert.equal(text,'two');
});
test('switching views does not move a running session to the other project, and stop flushes pending saves',async()=>{
 const h=projectHarness(),other={...h.project,file:h.insert('Else/Index.md','Other book')};
 await h.view.startWritingSession(h.project);
 await h.view.startWritingSession(other); // Both reference the same scene in this fixture, but only one baseline below.
 const first=h.view.prefs(h.project).session,second=h.view.prefs(other).session;
 delete second.baseline[h.chapter.path];
 h.view.currentProject=other;h.view.selected=other.file.path;
 h.contents.set(h.chapter.path,'The chapter. Extra words.');
 h.view.recordSessionChange(h.chapter);
 await h.flush(500);
 assert.equal(first.projectPath,h.project.file.path);
 assert.equal(first.words,2);
 assert.equal(second.words,0);
 h.contents.set(h.chapter.path,'The chapter. Extra words. One more.');
 h.view.recordSessionChange(h.chapter);
 await h.view.stopWritingSession(h.project);
 assert.equal(first.active,false);
 assert.equal(first.words,4);
 assert.equal(h.view.sessionUpdateJobs.size,0);
 h.view.recordSessionChange(h.chapter);
 assert.equal(h.view.sessionUpdateJobs.size,0);
});
test('closing Longform prevents an already reading session job from updating counts',async()=>{
 const h=projectHarness();
 await h.view.startWritingSession(h.project);
 const session=h.view.prefs(h.project).session;
 let release;
 h.app.vault.cachedRead=()=>new Promise(resolve=>{release=resolve;});
 h.view.recordSessionChange(h.chapter);
 const pending=h.flush(500);
 await h.view.onClose();
 assert.equal(h.view.sessionUpdateJobs.size,0);
 release('More words than before.');await pending;
 assert.equal(session.words,0);
 assert.equal(h.jobs.size,0);
});
test('autocomplete fast path retains full-note protection for distant block syntax and reuses terms',async()=>{
 const h=setup();
 const {WriterComplements}=h.api;
 const plugin={settings:{complements:{enabled:true,minChars:1,currentFile:true}},app:{}};
 const index=new WriterComplements(plugin);index.ready=true;index.dirty=false;
 const file=new TFile('Text.md');
 let text='Ordinary writing.\nWelcome';
 const atEnd=()=>({line:text.split('\n').length-1,ch:text.split('\n').at(-1).length});
 const editor={getValue:()=>text,getLine:n=>text.split('\n')[n],posToOffset:pos=>text.split('\n').slice(0,pos.line).reduce((n,l)=>n+l.length+1,0)+pos.ch};
 assert.equal(index.onTrigger(atEnd(),editor,file)?.query,'Welcome');
 assert.equal(index.editorRecord(editor).masked,undefined,'fast trigger did not mask the full note');
 for(const opener of ['````js','~~~~js','<script>']){
  text=opener+'\n'+('distant content\n'.repeat(950))+'Secret';
  assert.equal(index.onTrigger(atEnd(),editor,file),null,opener);
 }
 text='%%\n'+('hidden\n'.repeat(950))+'Secret\n%%';
 assert.equal(index.onTrigger({line:951,ch:6},editor,file),null);
 text='---\n'+('name: absent\n'.repeat(950))+'Secret\n---';
 assert.equal(index.onTrigger({line:951,ch:6},editor,file),null);
 text='Ordinary completion. ordinary';
 let calls=0;const tokenize=index.tokenize.bind(index);
 index.tokenize=text=>{calls++;return tokenize(text);};
 const context={file,editor,query:'ord'};
 await index.getSuggestions(context);await index.getSuggestions({...context,query:'ordi'});
 assert.equal(calls,1);
 text+=' new';
 await index.getSuggestions(context);assert.equal(calls,2);
});
test('prefix index preserves rank and exclusion of the current file, and middle matching is opt-in',async()=>{
 const h=setup(),index=new h.api.WriterComplements({settings:{complements:{enabled:true,vault:true}},app:{}});
 index.ready=true;index.dirty=false;
 index.setVaultVocabulary(new Map([
  ['A.md',new Map([['chapter',{word:'CHAPTER',count:30}],['charm',{word:'Charm',count:1}]])],
  ['B.md',new Map([['chapter',{word:'Chapter',count:3}],['unchained',{word:'Unchained',count:9}]])],
  ['C.md',new Map([['chapter',{word:'chapter',count:6}]])]
 ]));
 const input={file:new TFile('A.md'),query:'cha'};
 assert.deepEqual(plain((await index.getSuggestions(input)).map(x=>x.word)),['chapter']);
 index.options.matchMiddle=true;
 assert.deepEqual(plain((await index.getSuggestions(input)).map(x=>x.word)),['chapter','Unchained']);
});
test('completion ranking saves are batched and flush on unload',async()=>{
 const h=setup();let saves=0,edits=0;
 const index=new h.api.WriterComplements({settings:{complements:{enabled:true,learnRanking:true}},app:{},saveSettings:async()=>{saves++;}});
 index.context={editor:{replaceRange(){edits++;}}};
 index.selectSuggestion({word:'Story',insert:'Story'});index.selectSuggestion({word:'Story',insert:'Story'});
 assert.equal(saves,0);assert.equal(h.jobs.size,1);
 await index.flushSave();
 assert.equal(h.jobs.size,0);assert.equal(saves,1);assert.equal(edits,2);assert.equal(index.options.usage.story,2);
});
test('compilation creates a new note by default and replaces a confirmed manuscript only after backup',async()=>{
 const h=projectHarness(),output=h.insert('Book/manuscript.md','Version one\r\n');
 const copy=await h.view.compileProject(h.project,h.workflow('manuscript.md'));
 assert.equal(copy.file.path,'Book/manuscript 2.md');assert.equal(h.contents.get(output.path),'Version one\r\n');
 const result=await h.view.compileProject(h.project,h.workflow('manuscript.md'),false,{replacement:{file:output,text:'Version one\r\n'}});
 assert.equal(result.file,output);
 assert.match(result.backup.path,/^Book\/_Backups\/Manuscripts\/manuscript - .*\.txt$/);
 assert.equal(h.contents.get(result.backup.path),'Version one\r\n');
 assert.equal(h.contents.get(output.path),'The chapter.\n');
});
test('compile refuses unsafe paths, invalid workflows, tracked scenes, drafts, open files and concurrent changes',async()=>{
 const h=projectHarness(),{view,project,workflow}=h;
 for(const target of ['../outside.md','sub/../outside.md','/outside.md','CON.md','safe//file.md']){
  await assert.rejects(view.compileProject(project,workflow(target)),/Invalid output path/);
 }
 for(const steps of [[],[{id:'unknown'}],[{id:'write-to-note'},{id:'concatenate-text'}],[{id:'concatenate-text'},{id:'concatenate-text'}]]){
  await assert.rejects(view.compileProject(project,{steps},true),/Workflow has no steps|Unsupported step|Join|Join scenes/);
 }
 await assert.rejects(view.compileProject(project,workflow('Chapter.md')),/cannot overwrite/);
 const original=h.insert('Book/Alternate.md','Draft scene');
 view.prefs(project).drafts.Alt=[{title:'Alternate',indent:0}];
 await assert.rejects(view.compileProject(project,workflow('Alternate.md'),false,{replacement:{file:original,text:'Draft scene'}}),/cannot overwrite/);
 const outgoing=h.insert('Book/output.md','Initial');
 const replace=()=>view.compileProject(project,workflow('output.md'),false,{replacement:{file:outgoing,text:'Initial'}});
 h.app.workspace.getLeavesOfType=()=>[{view:{file:outgoing,editor:{getValue:()=> 'Unsaved'}}}];
 await assert.rejects(replace(),/Close the manuscript/);
 h.app.workspace.getLeavesOfType=()=>[];
 h.app.vault.process=async(file,fn)=>{h.contents.set(file.path,'Newer version');fn(h.contents.get(file.path));};
 await assert.rejects(replace(),/destination changed/);
 assert.equal(h.contents.get(outgoing.path),'Newer version');
 const backups=[...h.contents].filter(([path])=>path.endsWith('.txt'));
 assert.equal(backups.length,1);assert.equal(backups[0][1],'Initial');
});
