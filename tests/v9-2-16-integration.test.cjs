'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('Folder Note descriptions survive metadata cache delay',()=>{
 const src=read('src/v9/explorer-favorites-preview.js');
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 class TFolder{constructor(path){this.path=path;this.name='Escrita';}}
 const note=new TFile('Trabalho/Escrita/Escrita.md');
 const plugin={settings:{v92Explorer:{previewMode:'all',folderDescriptionKey:'description',previewMax:135}},
  app:{vault:{getAbstractFileByPath:path=>path===note.path?note:null},metadataCache:{getFileCache:()=>({frontmatter:{}})}}};
 const env={TFile,TFolder,require:()=>({parseYaml:()=>({description:'Uma pasta de escrita'})})};
 const api=vm.runInNewContext(src+'\n({writerV9216FolderDescription,writerV921PreviewBody})',env);
 const folder=new TFolder('Trabalho/Escrita');
 assert.equal(api.writerV9216FolderDescription(plugin,folder,'---\ndescription: Uma pasta de escrita\n---\n# Notas'), 'Uma pasta de escrita');
 assert.equal(api.writerV921PreviewBody('---\ndescription: Não mostrar isso\n---\n# Título\nPrimeiro parágrafo escrito.',135),'Primeiro parágrafo escrito.');
 assert.match(src,/const description=folder\?/);
 assert.match(src,/writerV9216FolderDescription\(plugin,item,body,false\)/);
 assert.match(src,/writerV921PreviewBody\(body,cfg.previewMax\)/);
});
test('native Spaces use their own name, icon and color, without mutating vault contents',()=>{
 const source=read('src/v9/smart-spaces.js');
 const scope=vm.runInNewContext(source+'\n({writerV9SpaceSanitize,writerV9215SpaceHidden})',{ItemView:class{}});
 const a=scope.writerV9SpaceSanitize({name:'Escrita',id:'w',icon:'notebook-pen',iconColor:'#336699',hiddenPaths:['Private']});
 const b=scope.writerV9SpaceSanitize({name:'Estudos',id:'s',hiddenPaths:[]});
 assert.equal(a.icon,'notebook-pen');
 assert.equal(a.iconColor,'#336699');
 const plugin={settings:{v9Spaces:{enabled:true,activeId:'w',spaces:[a,b]}}};
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Private/chapter.md'),true);
 plugin.settings.v9Spaces.activeId='s';
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Private/chapter.md'),false);
 const dock=read('src/v9/spaces-dock.js');
 for(const term of ['writerV9SpaceEditor','writerV922OpenIconPicker','writerV9215SelectSpace','writer-v9216-spaces-dock'])
  assert.ok(dock.includes(term),term);
 assert.match(dock,/Nenhum arquivo será excluído/);
});
test('Pretty settings cover extended visual features',()=>{
 const src=read('src/editor/pretty-properties.js');
 const api=vm.runInNewContext(src+'\n({writerV9215PrettyMerge})',{});
 const cfg={v9215Pretty:{coverShape:'weird',bannerPosition:'top',dueSoonDays:400}};
 api.writerV9215PrettyMerge(cfg);
 assert.equal(cfg.v9215Pretty.coverShape,'rounded');
 assert.equal(cfg.v9215Pretty.bannerPosition,'top');
 assert.equal(cfg.v9215Pretty.dueSoonDays,30);
 for(const term of ['writer-v9216-pretty-search','writer-v9216-tag-colored','writer-v9216-date-soon','coverPosition'])
  assert.ok(src.includes(term),term);
});
test('Flow and slash actions are registered and use conflict-safe writes',()=>{
 const src=read('src/editor/flow-slash.js');
 const api=vm.runInNewContext(src+'\n({writerV9215SlashActions,writerV9215FlowMerge})',{require:()=>({EditorSuggest:class{}})});
 const a=Array.from(api.writerV9215SlashActions(),x=>x.id);
 for(const id of ['tip','warning','important','flow','flowboard','highlight'])assert.ok(a.includes(id),id);
 assert.match(src,/registerMarkdownCodeBlockProcessor/);
 assert.match(src,/fresh!==original/);
 assert.match(src,/vault\.process\(file,fresh=>/);
 assert.doesNotMatch(src,/innerHTML\s*=/);
});
test('Flow inline editing rejects concurrent writes and saves against the current vault contents',async()=>{
 class Element{
  constructor(){this.children=[];this.events={};this.isConnected=true;}
  querySelector(){return null;}
  append(...children){this.children.push(...children);}
  appendChild(child){this.append(child);}
  setAttribute(){}
  addEventListener(event,handler){this.events[event]=handler;}
  focus(){}
  remove(){this.removed=true;}
 }
 let notice='',content='Original',commitBeforeSave=false;
 const {writerV9216FlowOpenEditor}=vm.runInNewContext(read('src/editor/flow-slash.js')+'\n({writerV9216FlowOpenEditor})',{
  require:()=>({EditorSuggest:class{}}),writerUi:(_pt,en)=>en,Notice:class{constructor(text){notice=text;}}
 });
 const file={path:'Story.md',basename:'Story',stat:{mtime:1}};
 const plugin={app:{vault:{
  cachedRead:async()=>content,
  process:async(_file,change)=>{
   if(commitBeforeSave)content='Changed concurrently';
   content=change(content);
  }
 }}};
 const mount=new Element(),toggle=new Element();
 mount.ownerDocument={createElement:()=>new Element()};
 await writerV9216FlowOpenEditor(plugin,file,mount,toggle);
 const [edit]=mount.children,[input,actions]=edit.children,[save]=actions.children;
 input.value='My changes';commitBeforeSave=true;await save.events.click();
 assert.equal(content,'Changed concurrently');assert.match(notice,/changed elsewhere/);assert.equal(edit.removed,undefined);
 commitBeforeSave=false;content='Original';await save.events.click();
 assert.equal(content,'My changes');assert.equal(edit.removed,true);
});
test('slash embed picker keeps the slash text on cancel and rejects stale insertion',()=>{
 let picker,notice,content='Intro /flow';
 class Search{setPlaceholder(){}open(){picker=this;}}
 const {WriterV9215SlashSuggest}=vm.runInNewContext(read('src/editor/flow-slash.js')+'\n({WriterV9215SlashSuggest})',{
  require:()=>({EditorSuggest:class{},FuzzySuggestModal:Search}),writerUi:(_pt,en)=>en,Notice:class{constructor(text){notice=text;}}
 });
 const editor={getValue:()=>content,focus(){},replaceRange(value,start,end){content=content.slice(0,start.ch)+value+content.slice(end.ch);}};
 const suggest=new WriterV9215SlashSuggest({},{});
 suggest.context={editor,start:{ch:6},end:{ch:11},file:{path:'Story.md'}};
 suggest.selectSuggestion({id:'flow'});
 assert.equal(content,'Intro /flow');
 content+=' edited';picker.onChooseItem({path:'Chapter.md'});
 assert.equal(content,'Intro /flow edited');assert.match(notice,/note changed/i);
 content='Intro /flow';suggest.selectSuggestion({id:'flow'});picker.onChooseItem({path:'Chapter.md'});
 assert.equal(content,'Intro ![[Chapter.md]]');
});
test('source and CSS provide a compact dock on mobile, not a second explorer',()=>{
 const css=read('src/styles/native/v9-2-2-iconic-fixes.css');
 assert.match(css,/writer-v9216-spaces-host/);
 assert.match(css,/writer-v9216-spaces-rail/);
 assert.match(css,/body\.is-mobile \.writer-v9216-spaces-dock/);
 assert.match(css,/writer-v9216-flow-board/);
 assert.doesNotMatch(css,/!important/);
});
