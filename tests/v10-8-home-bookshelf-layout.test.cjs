'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
function load(path,globals,names){
 return vm.runInNewContext(read(path)+'\n({'+names.join(',')+'})',{
  console,Math,Date,JSON,Number,String,Set,Map,Uint8Array,
  writerUi:(pt,en)=>pt,...globals
 });
}
test('Homepage widget catalog includes Books and Trash, never Related Notes',()=>{
 const home=read('src/v8/writing-home.js'),books=read('src/v10/bookshelf.js');
 assert.match(home,/books:p=>\{/);
 assert.match(home,/writerV10RenderBookshelfWidget\(this,card\)/);
 assert.match(home,/trash:p=>writerV10RenderTrashWidget\(this,p\)/);
 assert.doesNotMatch(home,/related:p=>/);
 assert.doesNotMatch(home,/related:\['link-2'/);
 assert.match(books,/function writerV10RenderBookshelfWidget\(view,parent\)/);
 assert.match(books,/for\(const project of books\.slice\(0,4\)\)writerV10BookshelfCard/);
});
test('Old widget settings migrate Books into visible Home without losing user layout',()=>{
 const api=load('src/v8/finish-blocks.js',{},['writerV8FinishMerge']);
 const settings={v8Finish:{
  homeOrder:['continue','calendar','books','related','trash'],homeHidden:['books','related','trash'],
  homeWidgetSizes:{books:'wide',trash:'compact'},homeFavorites:['Books/Book.md'],
  homeQuick:['a','b','c']
 }};
 api.writerV8FinishMerge(settings);
 const cfg=settings.v8Finish;
 assert.ok(cfg.homeOrder.includes('books'));
 assert.ok(cfg.homeOrder.includes('trash'));
 assert.ok(cfg.homeOrder.includes('reading'));
 assert.ok(cfg.homeOrder.includes('zotero'));
 assert.ok(!cfg.homeOrder.includes('related'));
 assert.ok(!cfg.homeHidden.includes('books'));
 assert.ok(!cfg.homeHidden.includes('related'));
 assert.ok(cfg.homeHidden.includes('trash'));
 assert.equal(cfg.homeWidgetSizes.books,'wide');
 assert.equal(cfg.homeWidgetSizes.trash,'compact');
 assert.deepEqual(Array.from(cfg.homeFavorites),['Books/Book.md']);
 // Future settings loads must not override a deliberately hidden widget.
 cfg.homeHidden.push('books');
 api.writerV8FinishMerge(settings);
 assert.ok(cfg.homeHidden.includes('books'));
});
test('Longform book favorite style matches explorer icon and renders filled selected state',()=>{
 const api=load('src/v10/bookshelf.js',{},['writerV10BookFavoriteIcon','writerV10BookRecord']);
 assert.equal(api.writerV10BookFavoriteIcon({settings:{v92Explorer:{favoriteIcon:'star'}}}),'star');
 assert.equal(api.writerV10BookFavoriteIcon({settings:{v92Explorer:{favoriteIcon:'bookmark'}}}),'bookmark');
 assert.equal(api.writerV10BookFavoriteIcon({settings:{}}),'star');
 assert.equal(api.writerV10BookRecord({favorite:true,progress:100,status:'finished'}).favorite,true);
 const source=read('src/v10/bookshelf.js'),css=read('src/styles/v10-2-workflow.css');
 assert.match(source,/classList\.toggle\('is-favorite',record\.favorite\)/);
 assert.match(source,/aria-pressed':String\(record\.favorite\)/);
 assert.match(css,/\.writer-v108-book-card\.is-favorite > \.writer-v108-book-favorite svg\{/);
 assert.match(css,/fill:currentColor/);
});
test('Related Notes is a panel with bounded self-sizing rows and no Home widget',()=>{
 const src=read('src/v10/discovery.js'),css=read('src/styles/v10-2-workflow.css');
 assert.match(src,/class WriterV10RelatedView extends ItemView/);
 assert.match(src,/writer-v10-related-card/);
 assert.match(src,/writer-v10-related-title/);
 assert.match(src,/writer-v10-related-path/);
 assert.match(src,/writer-v10-related-score/);
 assert.doesNotMatch(src,/function writerV10RenderRelatedWidget/);
 assert.match(css,/\.writer-v10-discovery-pane \.writer-v10-related-card\{/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto/);
 assert.match(css,/height:auto/);
 assert.match(css,/text-overflow:ellipsis/);
});
test('Trash actions live only in Home; restored old trash view is closed',()=>{
 const src=read('src/v10/discovery.js'),home=read('src/v8/writing-home.js');
 assert.match(src,/function writerV10RenderTrashWidget/);
 assert.match(src,/writerV10TrashRows\(plugin,content,limit\)/);
 assert.match(src,/writerV10TrashRestore\(plugin,entry\)/);
 assert.match(src,/writerV10Confirm\(plugin/);
 assert.match(src,/getLeavesOfType\?\.\(WRITER_V10_TRASH_VIEW\)/);
 assert.match(src,/leaf\.detach\(\)/);
 assert.doesNotMatch(src,/id:'v10-trash-explorer'/);
 assert.doesNotMatch(src,/writerV10OpenTrash=/);
 assert.match(home,/trash:p=>writerV10RenderTrashWidget/);
});
test('No ribbon shortcut popup or redundant Spaces/Books ribbon icons',()=>{
 for(const name of ['src/v9/smart-spaces.js','src/v9/spaces-dock.js','src/v10/bookshelf.js']){
  const source=read(name);
  assert.doesNotMatch(source,/addRibbonIcon\s*\?\./,name);
 }
 assert.doesNotMatch(read('src/v9/smart-spaces.js'),/id:'v1042-open-quick-actions'/);
 assert.match(read('src/v9/spaces-dock.js'),/id:'v93-spaces-manage'/);
 assert.match(read('src/v10/bookshelf.js'),/id:'v10-open-bookshelf'/);
});
test('All formerly quarantined 10.7 integrations are restored after the core load',()=>{
 const build=read('scripts/build-v3.js'),enhancements=read('src/v10/enhancements.js');
 const list=(build.match(/const sources=(\[[^;]+\]);/)||[])[1]||'';
 for(const name of ['data-tables','zotero-web','study-fsrs','calendar-feeds','story-graph','editor-pro','speech-accessibility','media-drag-extension','integrations-107']){
  assert.ok(list.includes("'v10/"+name+"'"),name+' missing from active bundle');
 }
 assert.match(enhancements,/writerV107RegisterAfterStartup\(plugin\)/);
 assert.match(read('src/v10/integrations-107.js'),/if\(plugin\.settings\?\.v107AdvancedEnabled===false\)/);
 assert.match(read('src/v10/integrations-107.js'),/const ready=plugin\.app\?\.workspace\?\.onLayoutReady/);
});

test('10.9 supports standalone books, automatic progress, metadata, and fuzzy picker',()=>{
 const src=read('src/v10/bookshelf.js');
 const api=load('src/v10/bookshelf.js',{lfFlattenScenes:scenes=>scenes},['writerV10BookshelfMerge','writerV10BookshelfProjects','writerV109BookProgress','writerV109BookDescription','writerV109BookCopyright']);
 const file={path:'Books/Novel.md',basename:'Novel',extension:'md',stat:{mtime:10}};
 const settings={};
 api.writerV10BookshelfMerge(settings);
 settings.v10Bookshelf.standalone=['Books/Novel.md'];
 const plugin={settings,app:{vault:{getMarkdownFiles:()=>[file],getAbstractFileByPath:()=>file},metadataCache:{getFileCache:()=>({frontmatter:{title:'Novel',banner:'Cover.png',description:'Synopsis',copyright:'Copyright 2026'}})}}};
 const projects=api.writerV10BookshelfProjects(plugin);
 assert.equal(projects.length,1);
 assert.equal(projects[0].standalone,true);
 assert.equal(api.writerV109BookDescription(projects[0]),'Synopsis');
 assert.equal(api.writerV109BookCopyright(projects[0]),'Copyright 2026');
 assert.equal(api.writerV109BookProgress(plugin,{scenes:[{status:'done'},{status:'draft'}]},{}),50);
 assert.match(src,/class BookNotePicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.doesNotMatch(src,/const progressField=field\('Leitura \(%\)'/);
});
test('10.9 keeps changelogs out of both READMEs and supports fuzzy path settings',()=>{
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const text=read(path);
  assert.doesNotMatch(text,/^## (?:Version|Versão) 10\./m);
  assert.match(text,/Longform|Markdown/);
 }
 assert.match(read('src/v9/virtual-content.js'),/class TemplatePicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/v9/smart-spaces.js'),/class SpacePathPicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/v4/integrations.js'),/class FolderPicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/v9/explorer-flex.js'),/Revelar arquivos ocultos/);
 assert.match(read('CHANGELOG.md'),/10\.9\.0/);
});
