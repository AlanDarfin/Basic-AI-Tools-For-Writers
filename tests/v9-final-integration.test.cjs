'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const format=read('src/v9/context-toolbar.js');
const explorer=read('src/v9/native-explorer.js');
const home=read('src/v8/home-utilities.js');
const TFile=class TFile{};
const TFolder=class TFolder{};
const common={writerUi:(pt,en)=>en,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
 writerV8HomeIsMobile:plugin=>Boolean(plugin.app.isMobile),TFile,TFolder,console,URL};
const tb=vm.runInNewContext(format+'\n({merge:writerV9ToolbarMerge,format:writerV9Format,allowed:writerV9ToolbarAllowed,ids:WRITER_V9_FORMAT_IDS})',common);
const ex=vm.runInNewContext(explorer+'\n({merge:writerV9ExplorerMerge,folderIndex:writerV9CreateFolderIndex,icons:WRITER_V9_EXPLORER_ICONS})',common);
const hu=vm.runInNewContext(home+'\n({image:writerV8HomeImageURL,icon:writerV8HomeIconName})',
 {...common,require:()=>({Platform:{isMobile:false}})});
test('v9 defaults show desktop toolbar but never mobile without explicit opt-in',()=>{
 const settings={};tb.merge(settings);
 assert.equal(settings.v9Toolbar.enabledDesktop,true);
 assert.equal(settings.v9Toolbar.enabledMobile,false);
 const plugin={settings,app:{isMobile:false}};
 assert.equal(tb.allowed(plugin),true);
 plugin.app.isMobile=true;
 assert.equal(tb.allowed(plugin),false);
 settings.v9Toolbar.enabledMobile=true;
 assert.equal(tb.allowed(plugin),true);
 settings.visibleModules={formatToolbar:false};
 assert.equal(tb.allowed(plugin),false);
});
test('format menu uses only recognized actions and retains custom ordering',()=>{
 const settings={v9Toolbar:{actions:['bold','table','bold','unknown','link']}};
 tb.merge(settings);
 assert.equal(settings.v9Toolbar.actions.join(','),'bold,table,link');
 assert.ok(tb.ids.includes('highlight'));
 assert.ok(tb.ids.includes('codeblock'));
 assert.ok(tb.ids.includes('wikilink'));
});
test('format operations produce editable markdown with original selection',()=>{
 let output='',focused=false;
 const editor={getSelection:()=>'Chapter title',replaceSelection:next=>{output=next;},
  focus:()=>{focused=true;}};
 assert.equal(tb.format(editor,'bold'),true);assert.equal(output,'**Chapter title**');
 assert.equal(tb.format(editor,'highlight'),true);assert.equal(output,'==Chapter title==');
 assert.equal(tb.format(editor,'h2'),true);assert.equal(output,'## Chapter title');
 assert.equal(tb.format(editor,'wikilink'),true);assert.equal(output,'[[Chapter title]]');
 assert.equal(tb.format(editor,'nonsense'),false);assert.equal(focused,true);
});
test('native explorer icon/color settings are sanitized and preserve valid mappings',()=>{
 const settings={v9Explorer:{items:{
  'Writing/Book.md':{icon:'book-open',color:'#e35d6a'},
  'Writing/Test.md':{icon:'<svg onload=alert(1)>',color:'red'}
 }}};
 ex.merge(settings);
 assert.equal(settings.v9Explorer.items['Writing/Book.md'].icon,'book-open');
 assert.equal(settings.v9Explorer.items['Writing/Book.md'].color,'#e35d6a');
 assert.equal(settings.v9Explorer.items['Writing/Test.md'],undefined);
 assert.ok(ex.icons.includes('folder'));
 assert.equal(settings.v9Explorer.enabled,true);
});
test('folder index creates ordinary Markdown only after explicit command',async()=>{
 const writes=[];const folder=Object.assign(new TFolder(),{path:'Stories/Book',name:'Book'});
 const plugin={app:{vault:{getAbstractFileByPath:()=>null,create:async(p,content)=>{writes.push([p,content]);return new TFile();}},
  workspace:{getLeaf:()=>({openFile:async()=>{}})}}};
 await ex.folderIndex(plugin,folder);
 assert.equal(writes[0][0],'Stories/Book/Book.md');
 assert.match(writes[0][1],/writer-folder-overview/);
});
test('homepage icon accepts trusted vault images and HTTPS but rejects protocols',()=>{
 const file=Object.assign(new TFile(),{extension:'png'});
 const plugin={app:{vault:{getAbstractFileByPath:path=>path==='Assets/book.png'?file:null,
  getResourcePath:()=> 'app://local-book'},metadataCache:{getFirstLinkpathDest:()=>null}}};
 assert.equal(hu.image(plugin,'Assets/book.png'),'app://local-book');
 assert.equal(hu.image(plugin,'https://example.org/icon.png'),'https://example.org/icon.png');
 for(const bad of ['javascript:alert(1)','data:image/svg+xml,foo','http://example.org/a','https://u:p@host/a','../secret.png']){
  assert.equal(hu.image(plugin,bad),'',bad);
 }
 assert.equal(hu.icon('graduation-cap'),'graduation-cap');
 assert.equal(hu.icon('<img>'),'book-open');
});
test('v9 is registered without adding another sidebar or replacing the mobile editor',()=>{
 const main=read('main.js'),css=read('styles.css'),bundler=read('scripts/build-v3.js');
 for(const name of ['writerV9RegisterToolbar(this)','writerV9RegisterExplorer(this)',
  'writerV9ToolbarSettings(this.plugin,panel)','writerV9ExplorerSettings(this.plugin,panel)']){
  assert.ok(main.includes(name),name);
 }
 assert.match(bundler,/v9\/context-toolbar/);
 assert.match(bundler,/v9\/native-explorer/);
 assert.match(css,/writer-v9-format-toolbar/);
 assert.match(css,/writer-v9-explorer-icon/);
 for(const src of [format,explorer]){
  assert.doesNotMatch(src,/detachLeavesOfType/);
  assert.doesNotMatch(src,/registerView\(/);
 }
 assert.doesNotMatch(read('src/styles/v9-final.css'),/!important/);
});

test('cMenu-inspired formatting includes underline, super/subscript and headings 1–6',()=>{
 const settings={};tb.merge(settings);
 for(const name of ['underline','superscript','subscript','h4','h5','h6'])assert.ok(tb.ids.includes(name));
 const editor={getSelection:()=>'word',replaceSelection:next=>{editor.value=next;},focus:()=>{}};
 assert.equal(tb.format(editor,'underline'),true);assert.equal(editor.value,'<u>word</u>');
 assert.equal(tb.format(editor,'superscript'),true);assert.equal(editor.value,'<sup>word</sup>');
 assert.equal(tb.format(editor,'subscript'),true);assert.equal(editor.value,'<sub>word</sub>');
 assert.equal(tb.format(editor,'h6'),true);assert.equal(editor.value,'###### word');
 assert.equal(settings.v9Toolbar.placement,'bottom');
 assert.match(format,/Choose and reorder buttons/);
});
