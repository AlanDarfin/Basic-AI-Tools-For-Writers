'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
class TFile{
 constructor(path){this.path=path;this.name=path.split('/').pop();this.basename=this.name.replace(/\.md$/,'');this.extension='md';this.stat={size:100};this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
class TFolder{}
class Empty{}
class EditorSuggest{constructor(app){this.app=app;}}
class FakeMenu {
 constructor(){this.items=[];this.visible=false;}
 addItem(configure){
  const item={
   title:null,label:false,icon:null,handler:null,
   setTitle(x){this.title=x;return this;},
   setIsLabel(value){this.label=value;return this;},
   setIcon(icon){this.icon=icon;return this;},
   onClick(callback){this.handler=callback;return this;}
  };
  configure(item);this.items.push(item);return this;
 }
 addSeparator(){this.items.push({separator:true});return this;}
 showAtPosition(p){this.visible=true;this.position=p;return this;}
 showAtMouseEvent(e){this.visible=true;this.event=e;return this;}
 close(){this.visible=false;this.onHide?.();}
}
const fakeDocument={
 createDocumentFragment:()=>({children:[],appendChild(child){this.children.push(child);}}),
 createElement:tag=>({tag,className:'',textContent:'',children:[],appendChild(child){this.children.push(child);}})
};

class FakePlugin{
 constructor(){this.app=makeApp();this.manifest={id:'basic-ai-tool-for-writers',dir:'.obsidian/plugins/basic-ai-tool-for-writers'};this.registrations=[];}
 registerEditorExtension(){this.registrations.push('editor');}
 registerMarkdownCodeBlockProcessor(name,callback){this.registrations.push('codeblock:'+name);}
 registerEditorSuggest(){this.registrations.push('suggest');}
 registerView(id){this.registrations.push('view:'+id);}
 addCommand(cmd){this.registrations.push('command:'+cmd.id);}
 addRibbonIcon(){}
 addSettingTab(){}
 registerEvent(){}
 async loadData(){return {provider:'openai',aiKeys:{openai:'private-example'},projectsData:{'Book/Index.md':{goal:100}}};}
 async saveData(data){this.saved=data;}
}
function makeApp(){
 const adapterFiles=new Map();
 const adapter={
  async exists(p){return adapterFiles.has(p);},
  async mkdir(p){adapterFiles.set(p,{folder:true});},
  async write(p,contents){adapterFiles.set(p,contents);},
  async read(p){const result=adapterFiles.get(p);if(typeof result!=='string')throw Error('not found: '+p);return result;},
  async writeBinary(p,contents){adapterFiles.set(p,contents);},
  async readBinary(p){return adapterFiles.get(p);},
  async remove(p){adapterFiles.delete(p);}
 };
 const notes=new Map();
 const app={vault:{adapter,notes,on:()=>({}),getMarkdownFiles:()=>[...notes.keys()].map(x=>new TFile(x)),
  getAbstractFileByPath:p=>notes.has(p)?new TFile(p):null,
  read:async f=>notes.get(f.path),cachedRead:async f=>notes.get(f.path),
  process:async(f,fn)=>{notes.set(f.path,fn(notes.get(f.path)));},
  readBinary:async f=>adapter.readBinary(f.path),
  createBinary:async(p,bytes)=>{await adapter.writeBinary(p,bytes);return new TFile(p);}
 },workspace:{on:()=>({}),getLeavesOfType:()=>[],getActiveViewOfType:()=>null},
 metadataCache:{getFileCache:()=>({frontmatter:{}}),getFirstLinkpathDest:()=>null,on:()=>({})}};
 return app;
}
const O={Plugin:FakePlugin,ItemView:Empty,PluginSettingTab:Empty,Setting:Empty,Notice:Empty,MarkdownRenderer:Empty,MarkdownView:Empty,TFile,TFolder,Modal:Empty,FuzzySuggestModal:Empty,EditorSuggest,Menu:FakeMenu,requestUrl:async()=>{},parseYaml:()=>({}),stringifyYaml:()=>''};
const S={StateField:{define:()=>({})},StateEffect:{define:()=>({of:x=>x})}};
const V={Decoration:{none:{map:()=>({})},set:()=>({}),mark:()=>({range:()=>({})})},EditorView:{decorations:{from:()=>({})}},ViewPlugin:{fromClass:()=>({})}};
const getRequire=name=>name==='obsidian'?O:name==='@codemirror/state'?S:name==='@codemirror/view'?V:(()=>{throw Error('unknown import: '+name)})();
const mods=['core','complements','variants','snapshots','workspace'].map(name=>fs.readFileSync('src/v3/'+name+'.js','utf8').replace(/^'use strict';\s*/,'')).join('\n');
const api=vm.runInNewContext(mods+'\n({writerMergeV3,writerMaskMarkdown,writerGrammarMatchIsSafe,writerParseVariants,writerEncodeVariant,writerDiffLines,WriterComplements,WriterSnapshots,WriterVariants})',{...O,...V,require:getRequire,console,setTimeout,clearTimeout,crypto:crypto.webcrypto});
const {writerMergeV3,writerMaskMarkdown,writerGrammarMatchIsSafe,writerParseVariants,writerEncodeVariant,writerDiffLines,WriterComplements,WriterSnapshots}=api;
function j(value){return JSON.parse(JSON.stringify(value));}
async function run(){
 let tests=0;
 const t=(name,fn)=>{fn();tests++;console.log('PASS',name);};
 t('schema migration preserves old settings and sets module defaults',()=>{
  const old={provider:'gemini',aiKeys:{gemini:'secret'},projectsData:{'Book/Index.md':{goal:100}}};
  const migrated=writerMergeV3(old);
  assert.equal(migrated.schemaVersion,3);assert.equal(migrated.aiKeys.gemini,'secret');assert.equal(migrated.projectsData['Book/Index.md'].goal,100);
  assert.equal(migrated.complements.enabled,true);assert.equal(migrated.snapshots.automatic,false);
 });
 t('semantic mask preserves UTF16 offsets and ignores Markdown control regions',()=>{
  const md='---\ntitle: Personagem\n---\nOlá Mundo.\n'+String.fromCharCode(96,96,96)+'js\nconst segredo = 1;\n'+String.fromCharCode(96,96,96)+'\n[[Link]] {{abc|def}}^0';
  const masked=writerMaskMarkdown(md);
  assert.equal(masked.length,md.length);assert.ok(masked.includes('Olá Mundo'));assert.ok(!masked.includes('segredo'));assert.ok(!masked.includes('Personagem'));assert.ok(!masked.includes('[[Link]]'));
 });
 t('LanguageTool ignores Markdown emphasis markers but retains italic prose offsets',()=>{
  const raw='_Não morre... eu não quero viver nesse lugar sem você._';
  const masked=writerMaskMarkdown(raw);
  assert.equal(masked.length,raw.length);
  assert.equal(masked[0],' ');
  assert.equal(masked.at(-1),' ');
  assert.equal(masked.indexOf('Não'),raw.indexOf('Não'));
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:0,length:1}),false);
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:1,length:3}),true);
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:raw.length-1,length:1}),false);
 });
 t('Markdown bold, italics, code and ordinary identifier underscores do not interfere',()=>{
  const raw='O _beijo_ foi **rápido**; __outro__ e *curto*. foo_bar_baz';
  const masked=writerMaskMarkdown(raw);
  assert.equal(masked.length,raw.length);
  assert.ok(masked.includes('beijo'));
  assert.ok(masked.includes('rápido'));
  assert.ok(masked.includes('foo_bar_baz'));
  assert.ok(!masked.includes('**rápido**'));
  const word=raw.indexOf('rápido');
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:word,length:6}),true);
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:word-2,length:2}),false);
 });
 t('Markdown fences and inline code stay masked while words outside remain checked',()=>{
  const raw=''+String.fromCharCode(96,96,96)+'md\n_errado_\n'+String.fromCharCode(96,96,96)+'\nTexto _correto_.';
  const masked=writerMaskMarkdown(raw);
  assert.equal(masked.length,raw.length);
  assert.ok(!masked.includes('errado'));
  assert.ok(masked.includes('correto'));
  const phrase=raw.indexOf('correto');
  assert.equal(writerGrammarMatchIsSafe(raw,masked,{offset:phrase,length:7}),true);
 });
 t('variant syntax roundtrips escaped pipes and braces',()=>{
  const encoded=writerEncodeVariant(['Uma frase|alternativa','Texto } e barra \\'],1);
  const parsed=writerParseVariants(encoded);
  assert.equal(parsed.length,1);assert.deepEqual(j(parsed[0].variants),['Uma frase|alternativa','Texto } e barra \\']);assert.equal(parsed[0].active,1);
 });
 t('invalid or incomplete variant fragments are ignored',()=>{
  assert.equal(writerParseVariants('{{a|b}}^5').length,0);assert.equal(writerParseVariants('{{broken|str').length,0);
 });
 t('line diff counts additions and removals',()=>{
  const diff=writerDiffLines('first\nsecond','first\nthird');
  assert.equal(diff.added,1);assert.equal(diff.removed,1);
 });
 const app=makeApp(),file=new TFile('Book/Chapter.md');
 app.vault.notes.set(file.path,'Hello world');
 const plugin={app,settings:writerMergeV3({}),saveSettings:async()=>{}};
 const snapshots=new WriterSnapshots(plugin);plugin.writerSnapshots=snapshots;
 const first=await snapshots.create(file,'Antes de editar');
 assert.equal((await snapshots.list(file)).length,1);
 assert.equal(await snapshots.read(file,first),'Hello world');
 console.log('PASS', 'snapshot create/read/list');tests++;
 app.vault.notes.set(file.path,'Changed document');
 const restored=await snapshots.restore(file,first,false);
 assert.equal(await app.vault.read(file),'Hello world');
 assert.equal((await snapshots.list(file)).length,2);
 assert.equal(restored.restored,0);
 console.log('PASS','snapshot restores with pre-restore backup');tests++;
 snapshots.onRename(new TFile('Book/Renamed.md'),file.path);
 assert.equal(plugin.settings.snapshots.identityMap['Book/Renamed.md'],plugin.settings.snapshots.identityMap[file.path]||snapshots.identity(new TFile('Book/Renamed.md')));
 console.log('PASS','snapshot identity survives renames');tests++;
 const complements=new WriterComplements(plugin);
 const editor={getValue:()=> 'Personagem personagem personalizado',getLine:()=> 'perso',posToOffset:()=>0};
 const query={query:'perso',editor,file};
 complements.ready=true;complements.dirty=false;
 const results=await complements.getSuggestions(query);
 assert.ok(results.some(r=>r.word.toLowerCase()==='personagem'));
 console.log('PASS','autocomplete returns current-file terms');tests++;
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync('main.js','utf8')+'\nmodule.exports.__test={prepareGrammarText,writerGrammarSeverity};',{require:getRequire,module,console,setTimeout,clearTimeout,crypto:crypto.webcrypto,document:fakeDocument,window:{innerWidth:800,innerHeight:700}});
 const rawItalic='_Não morre..._';
 const checked=module.exports.__test.prepareGrammarText(rawItalic);
 assert.equal(checked.length,rawItalic.length);
 assert.equal(checked[0],' ');
 assert.equal(checked.at(-1),' ');
 console.log('PASS','Live LanguageTool preparation uses the shared Markdown mask');tests++;
 const entry=new module.exports();
 await entry.onload();
 assert.equal(entry.settings.schemaVersion,4);
 assert.ok(entry.registrations.includes('view:basic-ai-writing-tools'));
 assert.ok(entry.registrations.includes('codeblock:insta-toc'));
 assert.ok(entry.registrations.includes('command:v4-tts-read-note'));
 assert.ok(entry.registrations.includes('command:v4-search-unicode'));
 assert.ok(entry.registrations.includes('command:v4-open-project-homework'));
 assert.ok(entry.registrations.includes('suggest'));
 assert.ok(entry.registrations.includes('command:open-note-snapshots'));
 const finding={
  offset:0,length:3,message:'Possível erro de escrita',
  rule:{id:'SOME_RULE',description:'Possível erro',category:{id:'TYPOS',name:'Ortografia'}},
  replacements:[{value:'Era'},{value:'Está'}]
 };
 assert.equal(module.exports.__test.writerGrammarSeverity(finding),'major');
 const menu=entry.showReviewSuggestionMenu(new TFile('Book/Chapter.md'),'Ero',finding,{position:{x:80,y:120}});
 assert.ok(menu instanceof FakeMenu);
 assert.deepEqual(menu.position,{x:80,y:120});
 assert.ok(menu.items.some(x=>x.label));
 assert.ok(menu.items.some(x=>x.title==='Era'));
 assert.ok(menu.items.some(x=>x.title==='Está'));
 assert.ok(menu.items.some(x=>['Criar variante','Create variant'].includes(x.title)));
 assert.ok(menu.items.some(x=>['Ignorar esta regra','Ignore this rule'].includes(x.title)));
 assert.ok(menu.items.some(x=>['Explicar com IA','Explain with AI'].includes(x.title)));
 menu.close();
 assert.equal(entry.reviewPopupKey,null);
 console.log('PASS','Native LanguageTool-style menu shows actions and clears after closing');tests++;
 const css=fs.readFileSync('styles.css','utf8');
 assert.ok(css.includes('container:writer-sidebar / inline-size'));
 assert.ok(css.includes('@container writer-sidebar (max-width:360px)'));
 assert.ok(css.includes('writer-lt-result-actions'));
 assert.ok(css.includes('writer-lt-menu-info'));
 console.log('PASS','Responsive sidebar and menu styles present');tests++;
 console.log('PASS','real bundle registers all modules and commands without missing globals');tests++;
 console.log(tests+' v3 tests passed.');
}
run().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
