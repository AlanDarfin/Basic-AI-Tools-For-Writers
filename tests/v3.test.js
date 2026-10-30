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
class FakePlugin{
 constructor(){this.app=makeApp();this.manifest={id:'basic-ai-tool-for-writers',dir:'.obsidian/plugins/basic-ai-tool-for-writers'};this.registrations=[];}
 registerEditorExtension(){this.registrations.push('editor');}
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
 metadataCache:{getFileCache:()=>({frontmatter:{}}),getFirstLinkpathDest:()=>null}};
 return app;
}
const O={Plugin:FakePlugin,ItemView:Empty,PluginSettingTab:Empty,Setting:Empty,Notice:Empty,MarkdownRenderer:Empty,MarkdownView:Empty,TFile,TFolder,Modal:Empty,FuzzySuggestModal:Empty,EditorSuggest,requestUrl:async()=>{},parseYaml:()=>({}),stringifyYaml:()=>''};
const S={StateField:{define:()=>({})},StateEffect:{define:()=>({of:x=>x})}};
const V={Decoration:{none:{map:()=>({})},set:()=>({}),mark:()=>({range:()=>({})})},EditorView:{decorations:{from:()=>({})}},ViewPlugin:{fromClass:()=>({})}};
const getRequire=name=>name==='obsidian'?O:name==='@codemirror/state'?S:name==='@codemirror/view'?V:(()=>{throw Error('unknown import: '+name)})();
const mods=['core','complements','variants','snapshots','workspace'].map(name=>fs.readFileSync('src/v3/'+name+'.js','utf8').replace(/^'use strict';\s*/,'')).join('\n');
const api=vm.runInNewContext(mods+'\n({writerMergeV3,writerMaskMarkdown,writerParseVariants,writerEncodeVariant,writerDiffLines,WriterComplements,WriterSnapshots,WriterVariants})',{require:getRequire,console,setTimeout,clearTimeout,crypto:crypto.webcrypto});
const {writerMergeV3,writerMaskMarkdown,writerParseVariants,writerEncodeVariant,writerDiffLines,WriterComplements,WriterSnapshots}=api;
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
 vm.runInNewContext(fs.readFileSync('main.js','utf8'),{require:getRequire,module,console,setTimeout,clearTimeout,crypto:crypto.webcrypto});
 const entry=new module.exports();
 await entry.onload();
 assert.equal(entry.settings.schemaVersion,3);
 assert.ok(entry.registrations.includes('view:basic-ai-writing-tools'));
 assert.ok(entry.registrations.includes('suggest'));
 assert.ok(entry.registrations.includes('command:open-note-snapshots'));
 console.log('PASS','real bundle registers all modules and commands without missing globals');tests++;
 console.log(tests+' v3 tests passed.');
}
run().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
