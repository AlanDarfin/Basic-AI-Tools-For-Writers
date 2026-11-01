'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v7/worldbuilding.js','utf8');
class TFolder{
 constructor(path,parent=null){this.path=path;this.name=path.split('/').pop();this.parent=parent;this.children=[];}
}
class TFile{
 constructor(path,parent=null){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.name=path.split('/').pop();this.extension='md';this.parent=parent;}
}
const book=new TFolder('Book'),notes=new TFolder('Book/_Notas',book),characters=new TFolder('Book/_Notas/Characters',notes);
book.children=[notes];notes.children=[characters];
const folderNote=new TFile('Book/_Notas/Characters/Characters.md',characters);
const alice=new TFile('Book/_Notas/Characters/Alice.md',characters);
const place=new TFile('Book/_Notas/Place.md',notes);
const chapter0=new TFile('Book/C1.md',book),chapter1=new TFile('Book/C2.md',book),chapter2=new TFile('Book/C3.md',book);
characters.children=[folderNote,alice];notes.children.push(place);
const items=[folderNote,alice,place,chapter0,chapter1,chapter2];
const byPath=Object.fromEntries([book,notes,characters,...items].map(x=>[x.path,x]));
const cache={
 [folderNote.path]:{frontmatter:{tags:['personagem','projeto/mundo']}},
 [alice.path]:{frontmatter:{tags:['heroína']},tags:[{tag:'#protagonista'}],links:[{link:'Unknown'}]},
 [place.path]:{frontmatter:{tags:['local'],timeline:{date:'120',title:'Foundation',category:'History'}},links:[]}
};
const app={
 vault:{getAbstractFileByPath:p=>byPath[p]||null,getMarkdownFiles:()=>items,cachedRead:async file=>file.path===chapter0.path?'Past chapter':file.path===chapter1.path?'Current chapter':'Future chapter'},
 metadataCache:{getFileCache:f=>cache[f.path]||null,getFirstLinkpathDest:path=>byPath[path]||null,resolvedLinks:{
  [alice.path]:{[place.path]:1},[place.path]:{[alice.path]:2}
 }}
};
const vmContext={TFile,TFolder,console,require:name=>name==='obsidian'?{getAllTags:cache=>(cache?.tags||[]).map(x=>x.tag)}:{},
 writerUi:(pt,en)=>pt,writerBookNavFindProjectAsync:async()=>({
  items:[{file:chapter0,path:chapter0.path,title:'Before'},{file:chapter1,path:chapter1.path,title:'Now'},{file:chapter2,path:chapter2.path,title:'Future'}]
 }),setTimeout:()=>0,clearTimeout:()=>{},Modal:class{},Setting:class{},TextPrompt:class{},ConfirmProjectAction:class{},
 Notice:class{},MarkdownView:class{},TFolder,clean:x=>x,writerModuleOn:()=>true};
const api=vm.runInNewContext(source+'\n({writerV7Tag,writerV7TagList,writerV7FolderNote,writerV7NoteTags,writerV7InheritedTags,writerV7ProjectNotes,writerV7Classify,writerV7TimelineDate,writerV7TimelineEntries,writerV7ContinuityChecks,writerV7NarrativeContext,writerV7Connections,writerV7Merge})',vmContext);
const project={file:chapter1},pref={v7Timeline:[{id:'a',title:'Founding',date:'-500',category:'Era'},{id:'b',title:'Reunion',date:'400-04-11'}]};
const plugin={app,settings:{v7:{compendium:true,maxEntries:3000,narrativeMemory:true,maxContextChars:1000},lastLongformProject:'Book/C2.md'}};
const view={app,plugin,notesRoot:()=>notes.path,prefs:()=>pref};
test('Unicode tags, custom hierarchies and invalid tags are safely normalized',()=>{
 assert.equal(api.writerV7Tag('#personagem'),'#personagem');
 assert.equal(api.writerV7Tag('universo/raça-élfica'),'#universo/raça-élfica');
 assert.equal(api.writerV7Tag('#bad tag'),'');
 assert.equal(api.writerV7Tag('<script>'),'');
 assert.deepEqual(Array.from(api.writerV7TagList(['#personagem','personagem','custom/foo'])) ,['#personagem','#custom/foo']);
});
test('Folder Notes resolve by Obsidian convention and pass folder tags to child notes',()=>{
 assert.equal(api.writerV7FolderNote(app,characters),folderNote);
 assert.equal(api.writerV7FolderNote(app,notes),null);
 const tags=api.writerV7InheritedTags(app,alice);
 for(const tag of ['#personagem','#projeto/mundo','#heroína','#protagonista'])assert.ok(tags.includes(tag),tag);
 const records=api.writerV7ProjectNotes(view,project);
 assert.equal(records.length,3);
 assert.equal(api.writerV7Classify(records.find(x=>x.file===alice)),'character');
 assert.equal(api.writerV7Classify(records.find(x=>x.file===place)),'place');
});
test('Obsidian graph links are available as connected compendium records',()=>{
 const records=api.writerV7ProjectNotes(view,project);
 const found=api.writerV7Connections(app,records,records.find(x=>x.file===alice));
 assert.equal(found[0].file,place);
});
test('Timeline merges manual events and YAML note events, with fictional years sorted',()=>{
 assert.ok(api.writerV7TimelineDate('-500')<api.writerV7TimelineDate('120'));
 assert.equal(api.writerV7TimelineDate('era of fire'),null);
 const timeline=api.writerV7TimelineEntries(view,project,api.writerV7ProjectNotes(view,project));
 assert.deepEqual(Array.from(timeline,x=>x.title),['Founding','Foundation','Reunion']);
 const issues=api.writerV7ContinuityChecks(view,project,api.writerV7ProjectNotes(view,project));
 assert.ok(issues.some(i=>i.title.includes('Link não resolvido')));
});
test('AI narrative context is opt in and excludes the active and future chapters',async()=>{
 let text=await api.writerV7NarrativeContext(plugin,chapter1);
 assert.match(text,/Past chapter/);assert.doesNotMatch(text,/Current chapter|Future chapter/);
 plugin.settings.v7.narrativeMemory=false;
 text=await api.writerV7NarrativeContext(plugin,chapter1);assert.equal(text,'');
});
test('module integration, bilingual UI and release metadata stay aligned',()=>{
 const main=fs.readFileSync('main.js','utf8'),projects=fs.readFileSync('projects.js','utf8');
 const css=fs.readFileSync('styles.css','utf8'),m=require('../manifest.json'),p=require('../package.json'),v=require('../versions.json');
 assert.ok(['7.0.0-beta.1','7.0.0-beta.2','7.0.0-rc.1','7.0.0','7.0.1','7.0.2','7.0.3','7.0.4','7.0.5','7.0.6','7.1.0','7.1.1'].includes(m.version));assert.equal(p.version,m.version);assert.equal(v[m.version],m.minAppVersion);
 assert.match(main,/new WriterV7Worldbuilding\(this\)/);
 assert.match(main,/writerV7NarrativeContext\(this,targetFile\)/);
 assert.match(projects,/writerV7RenderCompendium\(this,panel,project\)/);
 assert.match(projects,/writerV7RenderTimeline\(this,panel,project\)/);
 assert.match(projects,/writerV7RenderContinuity\(this,panel,project\)/);
 assert.match(css,/\.writer-v7-timeline-list/);
 assert.match(css,/\.writer-v7-folder-open/);
 for(const name of ['docs/V7_BETA1.en.md','docs/V7_BETA1.pt-BR.md','README.md','docs/README.pt-BR.md'])
  assert.match(fs.readFileSync(name,'utf8'),/7\.0\.0-beta\.1/);
});
