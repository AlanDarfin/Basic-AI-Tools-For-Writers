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
 const home=read('src/workspace/writing-home.js'),books=read('src/projects/bookshelf.js');
 assert.match(home,/books:p=>\{/);
 assert.match(home,/writerV10RenderBookshelfWidget\(this,card,markdownFiles\(\)\)/);
 assert.match(home,/trash:p=>writerV10RenderTrashWidget\(this,p\)/);
 assert.doesNotMatch(home,/related:p=>/);
 assert.doesNotMatch(home,/related:\['link-2'/);
 assert.match(books,/function writerV10RenderBookshelfWidget\(view,parent,files\)/);
 assert.match(books,/for\(const project of books\.slice\(0,4\)\)writerV10BookshelfCard/);
});
test('Old widget settings migrate Books into visible Home without losing user layout',()=>{
 const api=load('src/blocks/finish-blocks.js',{},['writerV8FinishMerge']);
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
 const api=load('src/projects/bookshelf.js',{},['writerV10BookFavoriteIcon','writerV10BookRecord']);
 assert.equal(api.writerV10BookFavoriteIcon({settings:{v92Explorer:{favoriteIcon:'star'}}}),'star');
 assert.equal(api.writerV10BookFavoriteIcon({settings:{v92Explorer:{favoriteIcon:'bookmark'}}}),'bookmark');
 assert.equal(api.writerV10BookFavoriteIcon({settings:{}}),'star');
 assert.equal(api.writerV10BookRecord({favorite:true,progress:100,status:'finished'}).favorite,true);
 const source=read('src/projects/bookshelf.js'),css=read('src/styles/features/v10-2-workflow.css');
 assert.match(source,/classList\.toggle\('is-favorite',record\.favorite\)/);
 assert.match(source,/aria-pressed':String\(record\.favorite\)/);
 assert.match(css,/\.writer-v108-book-card\.is-favorite > \.writer-v108-book-favorite svg\{/);
 assert.match(css,/fill:currentColor/);
});
test('Related Notes is a panel with bounded self-sizing rows and no Home widget',()=>{
 const src=read('src/workspace/discovery.js'),css=read('src/styles/features/v10-2-workflow.css');
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
 const src=read('src/workspace/discovery.js'),home=read('src/workspace/writing-home.js');
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
 for(const name of ['src/workspace/smart-spaces.js','src/workspace/spaces-dock.js','src/projects/bookshelf.js']){
  const source=read(name);
  assert.doesNotMatch(source,/addRibbonIcon\s*\?\./,name);
 }
 assert.doesNotMatch(read('src/workspace/smart-spaces.js'),/id:'v1042-open-quick-actions'/);
 assert.match(read('src/workspace/spaces-dock.js'),/id:'v93-spaces-manage'/);
 assert.match(read('src/projects/bookshelf.js'),/id:'v10-open-bookshelf'/);
});
test('All formerly quarantined 10.7 integrations are restored after the core load',()=>{
 const enhancements=read('src/core/enhancements.js');
 const {sourceIds}=require('../scripts/js-manifest.js');
 for(const name of ['data-tables','zotero-web','study-fsrs','calendar-feeds','story-graph','editor-pro','speech-accessibility','media-drag-extension','integrations-107']){
  assert.ok(sourceIds.includes('src/v10/'+name+'.js'),name+' missing from active bundle');
 }
 assert.match(enhancements,/writerV107RegisterAfterStartup\(plugin\)/);
 assert.match(read('src/integrations/integrations-107.js'),/if\(plugin\.settings\?\.v107AdvancedEnabled===false\)/);
 assert.match(read('src/integrations/integrations-107.js'),/const ready=plugin\.app\?\.workspace\?\.onLayoutReady/);
});

test('10.9 supports standalone books, automatic progress, metadata, and fuzzy picker',()=>{
 const src=read('src/projects/bookshelf.js');
 const api=load('src/projects/bookshelf.js',{lfFlattenScenes:scenes=>scenes},['writerV10BookshelfMerge','writerV10BookshelfProjects','writerV109BookProgress','writerV109BookDescription','writerV109BookCopyright']);
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

function scrollHarness(){
 let nextTimer=0,saves=0,cleanup,scroll,rename;
 const timers=new Map(),metadata=new Map();
 const api=load('src/projects/bookshelf.js',{
  setTimeout:callback=>{timers.set(++nextTimer,callback);return nextTimer;},
  clearTimeout:id=>timers.delete(id)
 },['writerV10BookshelfMerge','writerV10RegisterBookshelf','writerV109StandaloneProject','writerV10BookState']);
 const first={path:'Books/First.md',extension:'md'},second={path:'Books/Second.md',extension:'md'},
  unrelated={path:'Books/Other.md',extension:'md'};
 const preview='.markdown-preview-view',source='.markdown-source-view .cm-scroller';
 const label={textContent:'0%'},bar={value:0};
 const card={dataset:{writerBookPath:second.path},querySelector:selector=>selector.endsWith('strong')?label:bar};
 const ownerDocument={querySelectorAll:()=>[card]};
 const scroller=selector=>({isConnected:true,ownerDocument,scrollHeight:1000,clientHeight:500,scrollTop:0,
  matches:query=>query===selector});
 const firstScroll=scroller(preview),secondScroll=scroller('.cm-scroller'),unrelatedScroll=scroller(preview);
 const leaf=(file,selector,scroll)=>({view:{file,containerEl:{querySelector:query=>query===selector?scroll:null}}});
 const leaves=[leaf(first,preview,firstScroll),leaf(second,source,secondScroll),leaf(unrelated,preview,unrelatedScroll)];
 const settings={v10Bookshelf:{standalone:[first.path,second.path],library:{[first.path]:{favorite:true}}}};
 api.writerV10BookshelfMerge(settings);
 const workspace={containerEl:{},getActiveFile:()=>first,getLeavesOfType:()=>leaves};
 const plugin={settings,app:{workspace,metadataCache:{getFileCache:file=>({frontmatter:metadata.get(file.path)})},
  vault:{on(event,handler){assert.equal(event,'rename');return handler;}}},
  registerDomEvent(target,name,handler,capture){assert.equal(target,workspace.containerEl);assert.equal(name,'scroll');assert.equal(capture,true);scroll=handler;},
  registerEvent(handler){rename=handler;},register(handler){cleanup=handler;},async saveSettings(){saves++;}};
 api.writerV10RegisterBookshelf(plugin);
 return {plugin,first,second,metadata,firstScroll,secondScroll,unrelatedScroll,label,bar,timers,cleanup,rename,
  scroll:target=>scroll({target}),progress:file=>api.writerV10BookState(plugin,api.writerV109StandaloneProject(plugin,file)).progress,
  saves:()=>saves};
}

test('standalone progress records the furthest scroll in its own pane and updates open library cards',async()=>{
 const h=scrollHarness();
 h.unrelatedScroll.scrollTop=500;h.scroll(h.unrelatedScroll);
 const embedded={...h.secondScroll,scrollTop:500};h.scroll(embedded);
 assert.equal(h.timers.size,0,'ordinary notes and embedded scrollers are ignored');
 h.secondScroll.scrollTop=300;h.scroll(h.secondScroll);
 assert.equal(h.progress(h.first),0);assert.equal(h.progress(h.second),60);
 assert.equal(h.label.textContent,'60%');assert.equal(h.bar.value,60);
 h.secondScroll.scrollTop=150;h.scroll(h.secondScroll);
 assert.equal(h.progress(h.second),60,'scrolling back does not lose progress');
 h.firstScroll.scrollTop=250;h.scroll(h.firstScroll);
 assert.equal(h.progress(h.first),50);assert.equal(h.timers.size,1,'disk writes are debounced');
 h.cleanup();await Promise.resolve();assert.equal(h.saves(),1,'pending progress is saved on unload');
 assert.equal(h.timers.size,0);
});

test('explicit YAML including zero overrides scroll history, and tracking can be paused',()=>{
 const h=scrollHarness(),cfg=h.plugin.settings.v10Bookshelf;
 h.firstScroll.scrollTop=250;h.scroll(h.firstScroll);
 h.metadata.set(h.first.path,{readingProgress:0});
 h.firstScroll.scrollTop=500;h.scroll(h.firstScroll);
 assert.equal(h.progress(h.first),0);assert.equal(cfg.scrollProgress[h.first.path],50);
 h.metadata.set(h.first.path,{readingProgress:'72.5'});assert.equal(h.progress(h.first),72.5);
 h.metadata.delete(h.first.path);assert.equal(h.progress(h.first),50);
 cfg.trackStandaloneProgress=false;h.scroll(h.firstScroll);
 assert.equal(h.progress(h.first),50);
 cfg.library[h.first.path].status='finished';assert.equal(h.progress(h.first),100);
});

test('standalone progress and library preferences follow Markdown notes when a folder is renamed',async()=>{
 const h=scrollHarness(),cfg=h.plugin.settings.v10Bookshelf;
 h.firstScroll.scrollTop=325;h.scroll(h.firstScroll);
 h.first.path='Moved/First.md';h.second.path='Moved/Second.md';h.rename({path:'Moved'},'Books');
 assert.equal(cfg.standalone.join(','),'Moved/First.md,Moved/Second.md');
 assert.equal(cfg.scrollProgress['Books/First.md'],undefined);assert.equal(h.progress(h.first),65);
 assert.equal(cfg.library['Moved/First.md'].favorite,true);
 h.cleanup();await Promise.resolve();assert.equal(h.saves(),1);
});

test('10.9 keeps changelogs out of both READMEs and supports fuzzy path settings',()=>{
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const text=read(path);
  assert.doesNotMatch(text,/^## (?:Version|Versão) 10\./m);
  assert.match(text,/Longform|Markdown/);
 }
 assert.match(read('src/blocks/virtual-content.js'),/class TemplatePicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/workspace/smart-spaces.js'),/class SpacePathPicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/integrations/integrations.js'),/class FolderPicker extends require\('obsidian'\)\.FuzzySuggestModal/);
 assert.match(read('src/workspace/explorer-flex.js'),/Revelar arquivos ocultos/);
 assert.match(read('CHANGELOG.md'),/10\.9\.0/);
});
