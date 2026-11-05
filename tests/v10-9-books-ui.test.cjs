'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
class TFile{constructor(path){this.path=path;this.name=path.split('/').pop();this.basename=this.name.replace(/\.md$/,'');this.extension='md';this.stat={size:50,mtime:1};}}
class TFolder{constructor(path){this.path=path;this.name=path.split('/').pop();}}
function expose(file,names,more={}){
 const ctx={console,TFile,TFolder,Set,Map,Number,String,Math,Date,JSON,
  writerUi:(pt,en)=>pt,lfFlattenScenes:x=>x,writerV9215PrettyImage:()=>null,
  longformIndex:()=>null,...more};
 return vm.runInNewContext(read(file)+'\n({'+names.join(',')+'})',ctx);
}
test('single-note books appear beside Longform projects without copying notes',()=>{
 const api=expose('src/v10/bookshelf.js',['writerV10BookshelfMerge','writerV10BookshelfProjects','writerV109BookMeta','writerV109BookDescription','writerV109BookCopyright','writerV109BookAutomaticProgress','writerV10BookCover']);
 const note=new TFile('Livros/Meu livro.md'),settings={v10Bookshelf:{singleNotes:[note.path],readLocations:{[note.path]:64}}};
 api.writerV10BookshelfMerge(settings);
 const plugin={settings,app:{
  vault:{getMarkdownFiles:()=>[note],getAbstractFileByPath:path=>path===note.path?note:null},
  metadataCache:{getFileCache:()=>({frontmatter:{title:'Meu livro',banner:'[[Capa.webp]]',description:'Uma história de fantasia.',copyright:'© Autor 2026'}})}
 }};
 const books=api.writerV10BookshelfProjects(plugin);
 assert.equal(books.length,1);assert.equal(books[0].title,'Meu livro');assert.equal(books[0].singleNote,true);
 assert.equal(api.writerV109BookDescription(plugin,books[0]),'Uma história de fantasia.');
 assert.equal(api.writerV109BookCopyright(plugin,books[0]),'© Autor 2026');
 assert.equal(api.writerV109BookAutomaticProgress(plugin,books[0]),64);
});
test('Longform automatic progress counts finished chapters and scroll progress',()=>{
 const api=expose('src/v10/bookshelf.js',['writerV109BookAutomaticProgress','writerV109BookAutoStatus']);
 const plugin={settings:{v10Bookshelf:{readLocations:{'Book/02.md':50}}}};
 const project={file:new TFile('Book/index.md'),scenes:[
  {path:'Book/01.md',status:'done'},
  {path:'Book/02.md',status:'draft'},
  {path:'Book/03.md',status:'draft'},
  {path:'Book/04.md',status:'draft'}
 ]};
 assert.equal(api.writerV109BookAutomaticProgress(plugin,project),38);
 assert.equal(api.writerV109BookAutoStatus(0),'planned');
 assert.equal(api.writerV109BookAutoStatus(50),'reading');
 assert.equal(api.writerV109BookAutoStatus(100),'finished');
 const source=read('src/v10/bookshelf.js');
 assert.doesNotMatch(source,/type:'number',min:'0',max:'100'/);
 assert.match(source,/writerV109BookRegisterProgress\(plugin\)/);
 assert.match(source,/readLocations\[file\.path\]=progress/);
});
test('fuzzy vault search supports notes and folders, Unicode and path ranking',()=>{
 const api=expose('src/v10/vault-picker.js',['writerV109VaultItems','writerV109FuzzyPaths','writerV109FuzzyScore']);
 const folder=new TFolder('Livros/Fantasia'),note=new TFile('Livros/Fantasia/Aurora.md'),another=new TFile('Arquivos/Outros.md');
 const plugin={app:{vault:{getAllLoadedFiles:()=>[folder,note,another]}}};
 const folders=api.writerV109VaultItems(plugin,'folder'),notes=api.writerV109VaultItems(plugin,'note');
 assert.equal(folders.length,1);assert.equal(notes.length,2);
 assert.equal(api.writerV109FuzzyPaths(notes,'aurora')[0].path,note.path);
 assert.equal(api.writerV109FuzzyPaths(folders,'fantasia')[0].path,folder.path);
 assert.ok(api.writerV109FuzzyScore('Livros/Fantasia/Aurora.md','auoa')>0);
});
test('command palette removes duplicate or obsolete aliases without removing handlers',()=>{
 const smart=read('src/v9/smart-spaces.js'),books=read('src/v10/bookshelf.js');
 const explorer=read('src/v9/explorer-favorites-preview.js');
 const recovery=read('src/v10/historical-helpers.js'),enhance=read('src/v10/enhancements.js');
 assert.doesNotMatch(smart,/id:'v1042-open-quick-actions'/);
 assert.doesNotMatch(smart,/id:'v1042-current-folder-sorting'/);
 assert.doesNotMatch(books,/id:'v1042-bookshelf-search'/);
 assert.doesNotMatch(explorer,/id:'v92-toggle-favorite'/);
 assert.doesNotMatch(recovery,/id:'v106-recover-v1-dictionary'/);
 assert.match(read('src/v8/writing-home.js'),/id:'v8-toggle-current-favorite'/);
 assert.match(enhance,/writerV106LegacyDictionaryInspector\(plugin\)/);
});
test('Explorer sorting provides a reveal-hidden-files toggle',()=>{
 const flex=read('src/v9/explorer-flex.js');
 assert.match(flex,/Revelar arquivos ocultos/);
 assert.match(flex,/cfg\.showHidden=!cfg\.showHidden/);
 assert.match(flex,/item\.setChecked\?\.\(cfg\.showHidden===true\)/);
});
test('branding is short, IDs unchanged, and README has examples but no release notes',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 assert.equal(manifest.name,'basic');assert.equal(manifest.id,'basic-ai-tool-for-writers');
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const doc=read(path);
  assert.match(doc,/~~~markdown[\s\S]+banner:/);
  assert.match(doc,/copyright:/);
  assert.doesNotMatch(doc,/^## (Version|Versão|Atualização) \d/m);
  assert.doesNotMatch(doc,/\*\*\d+\.\d+\.\d+ ·/);
  assert.ok(!doc.startsWith('# Basic AI Tool for Writers'));
 }
 assert.match(read('src/v10/vault-picker.js'),/side-dock-ribbon-action/);
 assert.ok(fs.existsSync('docs/CHANGELOG.pt-BR.md'));
 assert.ok(fs.existsSync('docs/CHANGELOG.en.md'));
});
test('horizontal nav fades based on overflow, hides scrollbars and preserves gestures',()=>{
 const ui=read('src/v10/vault-picker.js'),css=read('src/styles/v10-2-workflow.css');
 assert.match(ui,/writerV109RegisterScrollHints/);
 assert.match(ui,/writerScroll=max<=3\?'none'/);
 assert.match(css,/scrollbar-width:none/);
 assert.match(css,/mask-image:linear-gradient/);
 assert.match(css,/writer-v109-path-options/);
});
