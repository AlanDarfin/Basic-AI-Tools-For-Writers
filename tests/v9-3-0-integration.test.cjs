'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const spaces=read('src/v9/smart-spaces.js'),flex=read('src/v9/explorer-flex.js');
const scope=vm.runInNewContext(spaces+'\n'+flex+
 '\n({writerV9SpaceSanitize,writerV9SpacesMerge,writerV91FlexMerge,writerV93FlexCompare,writerV93FlexRecord,writerV93FlexPinned})',
 {ItemView:class {}});
test('a Space keeps its own manual orders, pins and homepage widget configuration',()=>{
 const a=scope.writerV9SpaceSanitize({id:'writing',name:'Writing',pinnedPaths:['Writing/Book.md'],
  folderSorts:{Writing:{sort:'custom',order:['Book.md','Notes.md']}},
  homeWidgetsEnabled:true,homeOrder:['recent','favorites'],homeHidden:['favorites'],
  homeWidgetSizes:{recent:'wide'}});
 const b=scope.writerV9SpaceSanitize({id:'study',name:'Study'});
 assert.deepEqual([...a.pinnedPaths],['Writing/Book.md']);
 assert.equal(a.folderSorts.Writing.sort,'custom');
 assert.equal(a.homeWidgetsEnabled,true);
 assert.equal(a.homeWidgetSizes.recent,'wide');
 assert.equal(b.pinnedPaths.length,0);
 assert.equal(b.homeWidgetsEnabled,false);
 const settings={v9Spaces:{enabled:true,activeId:'writing',spaces:[a,b]},v91Flex:{enabled:true}};
 scope.writerV9SpacesMerge(settings);scope.writerV91FlexMerge(settings);
 const plugin={settings,app:{vault:{getAbstractFileByPath:()=>null}}};
 assert.equal(scope.writerV93FlexRecord(plugin,'Writing').sort,'custom');
 assert.equal(scope.writerV93FlexPinned(plugin,'Writing/Book.md'),true);
 settings.v9Spaces.activeId='study';
 assert.equal(scope.writerV93FlexRecord(plugin,'Writing').sort,'native');
 assert.equal(scope.writerV93FlexPinned(plugin,'Writing/Book.md'),false);
 assert.match(read('src/v8/writing-home.js'),/widgetPreferences\(\)/);
});
test('numeric and YAML property sorting work without touching physical files',()=>{
 const cfg={v91Flex:{enabled:true}};scope.writerV91FlexMerge(cfg);
 const files={
  'one':{name:'Chapter 10.md',stat:{mtime:1},extension:'md'},
  'two':{name:'Chapter 2.md',stat:{mtime:2},extension:'md'}};
 const noteA={file:files.one,name:files.one.name,pinned:false,index:0};
 const noteB={file:files.two,name:files.two.name,pinned:false,index:1};
 const plugin={settings:cfg,app:{metadataCache:{getFileCache:f=>({frontmatter:{sort_order:f===files.one?10:2}})}}};
 const collator=new Intl.Collator('en',{numeric:true});
 assert.ok(scope.writerV93FlexCompare(plugin,noteA,noteB,{sort:'number',order:[]},collator)>0);
 assert.ok(scope.writerV93FlexCompare(plugin,noteA,noteB,{sort:'property',property:'sort_order',order:[]},collator)>0);
});
test('Flow fenced editor updates only the selected code block and keeps note content intact',async()=>{
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 const api=vm.runInNewContext(read('src/v9/flow-composer.js')+
  '\n({writerV93FlowParse,writerV93FlowSerialize,writerV93FlowLocateBlock,writerV93FlowPersist})',
  {TFile,writerUi:pt=>pt,Notice:class{}});
 const block='[[A.md]]\n[[B.md]]';
 const note=new TFile('Board.md');
 let markdown='Intro\n~~~flow\n'+block+'\n~~~\nOutro conteúdo importante';
 const plugin={app:{vault:{
  getAbstractFileByPath:path=>path===note.path?note:null,
  async process(_file,change){markdown=change(markdown);}
 }}};
 const parsed=api.writerV93FlowParse(block,{maxItems:30,defaultLayout:'cards'});
 const next={...parsed,items:['[[B.md]]','[[A.md]]']};
 const found=api.writerV93FlowLocateBlock(markdown,block,1);
 assert.equal(found.start,1);
 assert.equal(await api.writerV93FlowPersist(plugin,{sourcePath:note.path,getSectionInfo:()=>({lineStart:1})},{},block,next),true);
 assert.match(markdown,/Intro\n~~~flow\n\[\[B\.md\]\]\n\[\[A\.md\]\]\n~~~\nOutro conteúdo importante/);
 assert.equal(api.writerV93FlowLocateBlock(markdown,block,1),null,'stale source must not match');
});
test('long pressing expands on mobile without synthetic click immediately closing',()=>{
 const src=read('src/v9/explorer-favorites-preview.js');
 assert.match(src,/touchstart/);assert.match(src,/touchmove/);
 assert.match(src,/skipClick/);assert.match(src,/previewTouchExpand/);
 assert.match(src,/previewHoldMs/);
});
test('responsive toolbar, note title icon and Flow/Space controls remain configurable',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 for(const name of ['writer-v93-space-manage-action','writer-v93-reorder-actions',
  'writer-v93-flow-toolbar','writer-v9-inline-title-icon'])assert.ok(css.includes(name));
 assert.match(read('src/v9/native-explorer.js'),/showTitleIcons/);
 assert.match(read('src/v9/spaces-dock.js'),/writer-v93-space-manage-action/);
 assert.match(read('src/v9/flow-slash.js'),/flowArrange/);
 assert.doesNotMatch(css,/!important/);
});
