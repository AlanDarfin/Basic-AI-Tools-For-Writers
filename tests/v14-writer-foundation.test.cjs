'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

class TFolder{constructor(path){this.path=path;this.children=[];}}
class TFile{
 constructor(path){this.path=path;this.name=path.split('/').pop();this.extension=path.split('.').pop();this.basename=this.name.slice(0,-this.extension.length-1);this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
function setup({obsidian={},globals={}}={}){
 const notices=[],jobs=new Map();let timer=0;
 const sandbox={console,module:{exports:{}},EditorSuggest:class{},writerModuleOn:()=>true,
  setTimeout:(fn,delay)=>{const id=++timer;jobs.set(id,{fn,delay});return id;},clearTimeout:id=>jobs.delete(id),
  require:()=>({TFile,TFolder,Notice:class{constructor(message){notices.push(message);}},
   ItemView:class{},Modal:class{},...obsidian}),...globals};
 const code=['projects.js','src/v3/core.js','src/writing/complements.js','src/writing/variants.js'].map(read).join('\n');
 const api=vm.runInNewContext(code+'\n({getLocale,lfMsg,writerUi,clean,lfProjectSceneFolder,ProjectsView,lfFlattenScenes,lfNestScenes,lfNumberScenes,lfIgnoredScene,lfSessionElapsed,lfMigrateProjectPaths,writerMaskMarkdown,writerGrammarMatchIsSafe,writerSafeReplace,writerParseVariants,writerEncodeVariant,writerVariantAt,WriterComplements,WriterVariants})',sandbox);
 const flush=async delay=>{
  for(const [id,job] of [...jobs])if(job.delay===delay&&jobs.delete(id))await job.fn();
 };
 return {api,notices,jobs,flush};
}
function projectHarness(options){
 const h=setup(options),files=new Map(),contents=new Map(),opens=[];
 const insert=(path,text)=>{
  const file=new TFile(path);files.set(path,file);contents.set(path,text);files.get(file.parent.path)?.children?.push(file);return file;
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

test('pausing flushes saved scene edits, excludes paused time and words, and resumes at the new baseline',async()=>{
 let now=Date.UTC(2026,10,18,18);
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const h=projectHarness({globals:{Date:Clock}}),{view,project,chapter,contents}=h;
 await view.startWritingSession(project);
 const session=view.prefs(project).session;
 now+=6000;contents.set(chapter.path,'The chapter. Four words here now.');
 view.recordSessionChange(chapter);
 await view.pauseWritingSession(project);
 assert.equal(session.words,4);assert.equal(h.api.lfSessionElapsed(session),6000);
 assert.equal(view.sessionUpdateJobs.size,0);
 now+=15000;contents.set(chapter.path,'The chapter. Four words here now. Not tracked.');
 view.recordSessionChange(chapter);
 assert.equal(view.sessionUpdateJobs.size,0);
 assert.equal(h.api.lfSessionElapsed(session),6000);
 await view.resumeWritingSession(project);
 now+=2000;contents.set(chapter.path,'The chapter. Four words here now. Not tracked. Resume.');
 view.recordSessionChange(chapter);
 await view.stopWritingSession(project);
 assert.equal(session.words,5);assert.equal(h.api.lfSessionElapsed(session),8000);
 now+=7000;await view.startWritingSession(project);
 now+=3000;assert.equal(h.api.lfSessionElapsed(view.prefs(project).session),11000);
 assert.equal(view.prefs(project).session.words,5);
});

test('a blocked resume cannot reactivate an ended session',async()=>{
 const h=projectHarness(),{view,project}=h;
 await view.startWritingSession(project);await view.pauseWritingSession(project);
 let release;
 h.app.vault.cachedRead=()=>new Promise(resolve=>{release=resolve;});
 const pending=view.resumeWritingSession(project);
 await view.stopWritingSession(project);
 release('New baseline');await pending;
 assert.equal(view.prefs(project).session.active,false);
 assert.equal(view.prefs(project).session.runningSince,null);
});

test('project and chapter renames migrate settings and session baselines without losing drafts',()=>{
 const {api}=setup();
 const old='Books/Old/Index.md',next='Books/New/Index.md',scene='Books/Old/Cena.md',newScene='Books/New/Cena.md';
 const source={drafts:{Mine:[]},session:{projectPath:old,baseline:{[scene]:42,'Other.md':3}}};
 const other={session:{projectPath:'Other.md',baseline:{[scene]:9}}};
 const settings={projectsData:{[old]:source,[next]:{goal:150,drafts:{Existing:[]}},'Other.md':other}};
 assert.equal(api.lfMigrateProjectPaths(settings,'Books/Old','Books/New'),true);
 assert.ok(!settings.projectsData[old]);assert.equal(settings.projectsData[next],source);
 assert.equal(source.goal,150);assert.deepEqual(Object.keys(source.drafts).sort(),['Existing','Mine']);
 assert.equal(source.session.projectPath,next);
 assert.deepEqual(plain(source.session.baseline),{[newScene]:42,'Other.md':3});
 assert.deepEqual(plain(other.session.baseline),{[newScene]:9});
 assert.equal(api.lfMigrateProjectPaths(settings,'Else','Different'),false);
});

test('workflow JSON round-trips options and colliding imports never replace a saved workflow',async()=>{
 const h=projectHarness(),{view,project}=h;
 const cuts=h.workflow('draft.md');cuts.description='Draft workflow';
 assert.equal(view.importWorkflowEntries(project,{Cuts:cuts}),1);
 let workflows=view.workflowsFor(project);
 assert.ok(workflows.Cuts);
 const renamed=await view.renameWorkflow(project,'Cuts','Final draft');
 assert.equal(renamed,'Final draft');assert.ok(!workflows.Cuts);
 assert.deepEqual(plain(workflows[renamed].steps),cuts.steps);
 const json=JSON.parse(view.workflowJSON(renamed,workflows[renamed]));
 assert.deepEqual(json.workflows[renamed].steps,cuts.steps);
 view.importWorkflowEntries(project,json.workflows);view.importWorkflowEntries(project,json.workflows);
 assert.deepEqual(Object.keys(workflows),['Padrão','Final draft','Final draft 2','Final draft 3']);
 await assert.rejects(view.renameWorkflow(project,'Final draft','FINAL DRAFT 2'),/already exists/);
 await assert.rejects(view.renameWorkflow(project,'Padrão','Backup draft'),/default workflow/);
 await assert.rejects(view.renameWorkflow(project,'Final draft','__proto__'),/Invalid workflow name/);
 assert.throws(()=>view.validateWorkflow(project,{steps:[{id:'constructor'},{id:'concatenate-text'}]}),/Unsupported step/);
 h.plugin.saveSettings=async()=>{throw Error('disk full');};
 await assert.rejects(view.renameWorkflow(project,'Final draft','Revised'),/disk full/);
 assert.ok(workflows[renamed]);assert.ok(!workflows.Revised);
});

test('restoring an index finds only that index’s backups, saves the current text, and rejects intervening changes',async()=>{
 const h=projectHarness(),{view,project,contents,insert,app}=h;
 const [backup,duplicate]=await Promise.all([view.backupIndex(project),view.backupIndex(project)]);
 assert.equal(backup,duplicate);
 insert('Book/_Backups/Index-Other - 2099-01-01T00-00-00-000Z.txt','another index');
 insert('Book/_Backups/Index - pre-restore - 2099-01-01T00-00-00-000Z.txt','another safeguard');
 assert.equal(view.latestIndexBackup(project),backup);
 const index=project.file;
 contents.set(index.path,'new index');
 const protectedCopy=await view.restoreIndexBackup(project,backup,index.path,'new index','index content');
 assert.match(protectedCopy.name,/pre-restore/);
 assert.equal(contents.get(protectedCopy.path),'new index');
 assert.equal(contents.get(index.path),'index content');
 assert.equal(contents.get(h.chapter.path),'The chapter.');
 contents.set(index.path,'later index');
 const process=app.vault.process;
 app.vault.process=async (file,change)=>{contents.set(file.path,'concurrent index');return process(file,change);};
 await assert.rejects(view.restoreIndexBackup(project,backup,index.path,'later index','index content'),/changed/);
 assert.equal(contents.get(index.path),'concurrent index');
 app.workspace.getLeavesOfType=()=>[{view:{file:index,editor:{getValue:()=> 'Unsaved'}}}];
 await assert.rejects(view.restoreIndexBackup(project,backup,index.path,'concurrent index','index content'),/Close the index/);
 app.workspace.getLeavesOfType=()=>[];
 contents.set(backup.path,'changed backup');
 await assert.rejects(view.restoreIndexBackup(project,backup,index.path,'concurrent index','index content'),/changed/);
 assert.equal(contents.get(index.path),'concurrent index');
});

test('scene search uses only the selected draft and rejects stale selection or file changes',()=>{
 let picker;
 class FuzzySuggestModal{setPlaceholder(){}open(){picker=this;}}
 const h=projectHarness({obsidian:{FuzzySuggestModal}}),{view,project,chapter,insert,files,opens}=h;
 const second=insert('Book/Outro capítulo.md','other scene');
 view.prefs(project).drafts.Alt=[{title:second.basename,indent:0}];
 view.selected=project.file.path;view.draft='Alt';view.openSceneSearch(project);
 const [item]=picker.getItems();assert.equal(item.file,second);assert.equal(picker.getItems().length,1);
 assert.match(picker.getItemText(item),/Outro capítulo/);
 view.draft='Principal';picker.onChooseItem(item);assert.deepEqual(opens,[]);
 view.openSceneSearch(project);const [main]=picker.getItems();picker.onChooseItem(main);assert.deepEqual(opens,[chapter]);
 files.delete(chapter.path);picker.onChooseItem(main);assert.deepEqual(opens,[chapter]);
});

test('ignored scene matching supports legacy names, paths and relative filenames',()=>{
 const {api}=setup();
 const file=new TFile('Book/Scenes/Chapter.md');
 for(const name of ['Chapter','Chapter.md','Book/Scenes/Chapter.md'])assert.equal(api.lfIgnoredScene([name],file,'Book/Scenes'),true);
 assert.equal(api.lfIgnoredScene(['Book/Other/Chapter.md'],file,'Book/Scenes'),false);
 assert.equal(api.lfIgnoredScene('Chapter',file,'Book/Scenes'),false);
});

class SceneElement{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text;this.attrs=options.attr||{};this.cls=options.cls;this.children=[];this.events={};this.dataset={projectPath:this.attrs['data-project-path']};this.isConnected=true;}
 createEl(tag,options){const element=new SceneElement(tag,options);this.children.push(element);return element;}
 createDiv(options){return this.createEl('div',options);}
 setText(text){this.text=text;}
 empty(){this.children=[];}
 addEventListener(name,fn){this.events[name]=fn;}
}
test('the project panel updates a scene’s saved count and target without rebuilding its list',async()=>{
 const h=projectHarness(),{view,chapter,project,app,contents}=h;
 let target=1200;
 app.metadataCache.getFileCache=()=>({frontmatter:{target_wordcount:target}});
 const panel=new SceneElement();
 await view.drawStats(panel,project,()=>true);
 const [box]=panel.children,state=view.projectProgress.get(box),scene=state.sceneLabels.get(chapter.path);
 assert.equal(scene.label.text,' · 2 / 1,200 words');
 view.root={querySelector:()=>box};view.activeTab='project';view.selected=project.file.path;
 contents.set(chapter.path,'The chapter now has five.');target=1500;
 await view.refreshProjectStats(chapter);
 assert.equal(scene.label.text,' · 5 / 1,500 words');assert.equal(state.label.text,'Total: 5 words');
});

test('the persistent pickup notice cancels without moving a scene and is hidden when Projects closes',async()=>{
 const notices=[];
 class Notice{constructor(fragment,timeout){Object.assign(this,{fragment,timeout});notices.push(this);}hide(){this.hidden=true;}}
 const h=projectHarness({obsidian:{Notice}}),{view,project}=h;
 const picked=new Set();
 const row={addClass:value=>picked.add(value),removeClass:value=>picked.delete(value),ownerDocument:{
  createDocumentFragment:()=>({children:[],append(node){this.children.push(node);}}),
  createTextNode:text=>({text}),createElement:tag=>new SceneElement(tag)
 }};
 view.root={querySelectorAll:()=>[row]};
 view.pickUpScene(project,'Principal','Chapter',row);
 assert.equal(notices[0].timeout,0);assert.equal(view.scenePickup.source,'Chapter');
 assert.ok(picked.has('writer-project-pickup'));
 const cancel=notices[0].fragment.children[1];
 assert.equal(cancel.textContent,'Cancel');cancel.events.click({stopPropagation(){}});
 assert.equal(view.scenePickup,null);assert.equal(notices[0].hidden,true);assert.equal(picked.size,0);
 view.pickUpScene(project,'Principal','Chapter',row);await view.onClose();
 assert.equal(notices[1].hidden,true);
});

test('deleting an inline alternative asks first and preserves the selected text when an earlier option is removed',async()=>{
 const modals=[];
 class Modal{constructor(){this.contentEl=new SceneElement();modals.push(this);}setTitle(){}open(){this.onOpen?.();}close(){this.onClose?.();}}
 class Setting{
  addButton(setup){const button={setButtonText(){return this;},setWarning(){return this;},onClick(fn){this.click=fn;return this;}};(this.buttons??=[]).push(button);setup(button);return this;}
  constructor(){Setting.last=this;}
 }
 const h=setup({obsidian:{Modal,Setting}}),plugin={settings:{variants:{enabled:true}},app:{}};
 const variants=new h.api.WriterVariants(plugin);
 const file=new TFile('Scene.md');
 variants.atCaret=()=>({found:{variants:['First','Second','Selected','Fourth'],active:2},file});
 let saved;variants.replace=async (_found,items,active)=>{saved=[...items,active];};
 await variants.open();
 const edit=modals[0];
 const removeFirst=()=>edit.contentEl.children[1].children[0].children.at(-1).events.click();
 removeFirst();assert.equal(modals.length,2);assert.equal(saved,undefined);
 await Setting.last.buttons[0].click();assert.equal(edit.contentEl.children.length,6);
 removeFirst();await Setting.last.buttons[1].click();
 const actions=edit.contentEl.children.at(-1);
 await actions.children[1].events.click();
 assert.deepEqual(saved,['Second','Selected','Fourth',1]);
});
