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
 const api=vm.runInNewContext(read('src/v9/flow-composer.js')+'\n'+read('src/v8/block-edit.js')+
  '\n({writerV93FlowParse,writerV93FlowPersist})',
  {TFile,WRITER_V8_BLOCK_MAX:32000,writerUi:(_pt,en)=>en,Notice:class{}});
 const block='[[A.md]]\n[[B.md]]';
 const note=new TFile('Board.md');
 const written=block.replaceAll('\n','\r\n');
 let markdown='Intro\n~~~flow\r\n'+written+'\r\n~~~\n~~~ writer-flow\r\n'+written+'\r\n~~~\nOutro conteúdo importante';
 const plugin={app:{vault:{
  getAbstractFileByPath:path=>path===note.path?note:null,
  async read(){return markdown;},
  async process(_file,change){markdown=change(markdown);}
 }}};
 const parsed=api.writerV93FlowParse(block,{maxItems:30,defaultLayout:'cards'});
 const next={...parsed,items:['[[B.md]]','[[A.md]]']};
 const ctx={sourcePath:note.path,getSectionInfo:()=>({lineStart:5,lineEnd:8})};
 assert.equal(await api.writerV93FlowPersist(plugin,ctx,{},block,next,'writer-flow'),true);
 assert.equal(markdown,'Intro\n~~~flow\r\n'+written+'\r\n~~~\n~~~ writer-flow\r\n[[B.md]]\r\n[[A.md]]\r\n~~~\nOutro conteúdo importante');
 const updated=markdown;
 assert.equal(await api.writerV93FlowPersist(plugin,ctx,{},block,next,'writer-flow'),false);
 assert.equal(await api.writerV93FlowPersist(plugin,{sourcePath:note.path},{},block,next,'flow'),false);
 assert.equal(markdown,updated,'a single identical older block is never used as a fallback');
});
test('Flow edits preserve notes beyond the display limit and Markdown reference syntax',()=>{
 const api=vm.runInNewContext(read('src/v9/flow-composer.js')+
  '\n({writerV93FlowParse,writerV93FlowSerialize,writerV93FlowRow,writerV93FlowLink,writerV101FlowLinkDependency})',{});
 const first='  ![[A.md#Opening | after: the intro]]';
 const second='[[B.md]] | after:[[A.md]]';
 const hidden='[[Preserved when maxItems is smaller.md]]';
 const source=['# Board comment','  layout: cards ',first,'',second,hidden].join('\n');
 const model=api.writerV93FlowParse(source,{maxItems:2});
 assert.deepEqual([...model.items],[first,second]);
 assert.equal(api.writerV93FlowSerialize({...model,layout:'graph'}),source.replace('cards','graph'));
 assert.equal(api.writerV93FlowSerialize({...model,items:[second,first]}),
  ['# Board comment','  layout: cards ',second,'',first,hidden].join('\n'));
 assert.equal(api.writerV93FlowSerialize({...model,items:[first]}),
  ['# Board comment','  layout: cards ',first,'',hidden].join('\n'));
 assert.equal(api.writerV93FlowLink(first),'A.md');
 assert.equal(api.writerV101FlowLinkDependency(first),'');
 assert.equal(api.writerV93FlowRow(first+' | after: [[B.md]]').link,first);
 assert.equal(api.writerV101FlowLinkDependency(first+' | after: [[B.md]]'),'B.md');
});
test('Flow text cards save column assignments in settings, scoped to the board and note',async()=>{
 class Element{
  constructor(props={}){this.props=props;this.children=[];this.events={};this.classList={add(){}};}
  empty(){this.children=[];}
  createEl(_tag,props){const child=new Element(props);this.children.push(child);return child;}
  createDiv(props){return this.createEl('div',props);}
  createSpan(props){return this.createEl('span',props);}
  addEventListener(type,callback){this.events[type]=callback;}
  focus(){this.focused=true;}
 }
 const api=vm.runInNewContext(read('src/v9/flow-composer.js')+
  '\n({writerV93TextBoardParse,writerV93FlowComposer})',{
  writerUi:(_pt,en)=>en,writerV83StudyHash:text=>String(text.length),Notice:class{},require:()=>({setIcon(){}})
 });
 const source='id: ideas\n=== Draft\n- First card\n- Second card\n=== Done\n- First card';
 let saves=0;
 const plugin={settings:{v9215Flow:{enabled:true,flowBlocks:true,flowArrange:true,maxItems:30}},
  async saveSettings(){saves++;}};
 const render=(sourcePath,block=source)=>{
  const root=new Element();api.writerV93FlowComposer(plugin,block,root,{sourcePath});return root.children[0];
 };
 const text=lane=>lane.children.slice(1).map(row=>row.children[0].props.text);
 const lanes=render('Ideas.md');
 assert.deepEqual(text(lanes.children[0]),['First card','Second card']);
 assert.deepEqual(text(lanes.children[1]),['First card']);
 await lanes.children[0].children[2].children[1].children[1].events.click();
 assert.deepEqual(text(lanes.children[0]),['First card']);
 assert.deepEqual(text(lanes.children[1]),['Second card','First card']);
 assert.equal(lanes.children[1].children[1].children[1].children[0].focused,true);
 assert.deepEqual(text(render('Ideas.md').children[1]),['Second card','First card']);
 assert.deepEqual(text(render('Other.md').children[1]),['First card']);
 assert.deepEqual(text(render('Ideas.md',source+'\n- Third card').children[1]),['First card','Third card']);
 assert.equal(saves,1);
 assert.equal(api.writerV93TextBoardParse('[[Chapter 1]]\n[[Chapter 2]]',30).columns.length,0);

 let failFirst;
 plugin.saveSettings=async()=>{
  if(++saves===2)await new Promise((_resolve,reject)=>{failFirst=reject;});
 };
 const moveToDone=board=>board.children[0].children[2].children[1].children[1].events.click();
 const failing=moveToDone(render('Failed.md'));
 const successful=moveToDone(render('Continued.md'));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saves,2,'the second save waits for the first result');
 failFirst(Error('Write failed'));
 await Promise.all([failing,successful]);
 assert.equal(saves,3);
 assert.deepEqual(text(render('Failed.md').children[1]),['First card']);
 assert.deepEqual(text(render('Continued.md').children[1]),['Second card','First card']);
});
test('Explorer can opt into a 16:9 preview while existing settings stay square',()=>{
 const src=read('src/v9/explorer-favorites-preview.js');
 const {writerV92ExplorerMerge}=vm.runInNewContext(src+'\n({writerV92ExplorerMerge})',{});
 assert.equal(writerV92ExplorerMerge({}).previewImageShape,'square');
 assert.equal(writerV92ExplorerMerge({v92Explorer:{previewImageShape:'wide'}}).previewImageShape,'wide');
 assert.match(src,/classList\.toggle\('is-wide-thumbnail'/);
 assert.match(read('src/styles/v9-2-2-iconic-fixes.css'),/\.is-wide-thumbnail > img[^\{]+\{[^}]+aspect-ratio:16\/9/);
});
test('insert catalog works with slash suggestions turned off and rejects stale edits',()=>{
 let picker,notice;
 class FuzzySuggestModal{setPlaceholder(){}open(){picker=this;}}
 const {writerV9215FlowRegister}=vm.runInNewContext(read('src/v9/flow-slash.js')+'\n({writerV9215FlowRegister})',{
  require:()=>({EditorSuggest:class{},FuzzySuggestModal}),writerUi:pt=>pt,Notice:class{constructor(text){notice=text;}}
 });
 const commands=new Map();
 const plugin={settings:{v9215Flow:{enabled:true,slash:false}},addCommand:command=>commands.set(command.id,command)};
 writerV9215FlowRegister(plugin);
 let content='Original';const offset={line:0,ch:0};
 const editor={getValue:()=>content,getLine:line=>content.split('\n')[line],getCursor:()=>offset,focus(){},replaceRange(text,start,end){
  assert.equal(start,offset);assert.equal(end,offset);content=text+content;
 }};
 const context={file:{path:'Story.md'}};
 const run=commands.get('v93-insert-block').editorCheckCallback;
 assert.equal(run(true,editor,context),true);
 assert.equal(run(false,editor,context),true);
 picker.onChooseItem(picker.getItems().find(action=>action.id==='flowcards'));
 assert.match(content,/=== Ideias/);
 assert.match(content,/~~~\nOriginal$/);
 run(false,editor,context);content='Edited';
 picker.onChooseItem(picker.getItems()[0]);
 assert.match(notice,/mudou/);assert.equal(content,'Edited');
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
