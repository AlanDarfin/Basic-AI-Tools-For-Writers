'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function expose(path,names,extras={}){
 return vm.runInNewContext(read(path)+'\n({'+names.join(',')+'})',
  {console,Date,Map,Set,URL,Math,Number,String,Array,writerUi:(pt,en)=>en,...extras});
}
test('Spaces manager uses accessible actions, responsive cards and finite pagination',()=>{
 const s=read('src/v9/smart-spaces.js'),css=read('styles.css');
 assert.match(s,/writer-v102-space-entry-info/);assert.match(s,/writer-v102-space-entry-arrow/);
 assert.match(s,/writer-v102-space-picker/);assert.match(s,/pageSize=space\.view==='table'\?30:24/);
 assert.match(s,/file\.parent\?\.path/);
 assert.match(css,/writer-v102-spaces-results\.is-cards/);
});
test('Pretty Properties migrates per-file hidden keys and custom icons without rewriting frontmatter',()=>{
 const cfg=expose('src/v9/pretty-properties.js',['writerV9215PrettyMerge','writerV9215PrettyKey']);
 const settings={v9215Pretty:{hidden:['status'],hiddenPerFile:{'Novel.md':['banner','NT']},
  propertyIcons:{status:'star','banner':'image'}}};
 const result=cfg.writerV9215PrettyMerge(settings);
 assert.deepEqual(Array.from(result.hiddenPerFile['Novel.md']),['banner','nt']);
 assert.equal(result.propertyIcons.status,'star');assert.equal(result.propertyActions,true);
 assert.match(read('src/v9/pretty-properties.js'),/writerV102PropertyMenu/);
 assert.match(read('src/v9/pretty-properties.js'),/onApply:async icon/);
});
test('Chat parses speaker bubble color independently of name color and transparent background',()=>{
 const api=expose('src/v8/finish-blocks.js',['writerV8ChatParse','writerV8ChatFakeAudio']);
 const chat=api.writerV8ChatParse('title: Test\nbackground: transparent\nbubble-color: blue\n[Maria=red]\n[Maria=bubble:green]\n\n< | Maria | [audio:0:05:teste teste] | 14:34');
 assert.equal(chat.options.background,'transparent');
 assert.equal(chat.options.bubbleColor,'blue');
 assert.equal(chat.messages[0].color,'red');
 assert.equal(chat.messages[0].bubbleColor,'green');
 assert.equal(api.writerV8ChatFakeAudio('[áudio:0:02:teste]').transcript,'teste');
 const css=read('styles.css');
 assert.match(css,/writer-v8-chat-transcript-text::before/);
 assert.match(css,/is-background-transparent/);
});
test('Preview supports banner and secure direct HTTPS links with privacy switch',()=>{
 const api=expose('src/v9/explorer-favorites-preview.js',['writerV102PreviewRemoteUrl','writerV92ExplorerMerge']);
 assert.equal(api.writerV102PreviewRemoteUrl('www.example.com/photo.png'),'https://www.example.com/photo.png');
 assert.equal(api.writerV102PreviewRemoteUrl('http://example.com/a.png'),'');
 assert.equal(api.writerV102PreviewRemoteUrl('https://localhost/a.png'),'');
 assert.equal(api.writerV102PreviewRemoteUrl('https://127.0.0.1/a.png'),'');
 assert.equal(api.writerV102PreviewRemoteUrl('javascript:alert(1)'),'');
 assert.equal(api.writerV102PreviewRemoteUrl('https://example.com/file.txt'),'');
 const settings={};api.writerV92ExplorerMerge(settings);
 assert.equal(settings.v92Explorer.previewRemoteImages,true);
 assert.match(read('src/v9/explorer-favorites-preview.js'),/\['banner','cover','image','thumbnail'\]/);
});
test('Image source integration filters to safe providers, supports Wikimedia with no key',()=>{
 const api=expose('src/v10/image-inserter.js',['writerV102ImagesMerge','writerV102ImageQuery','writerV102ImageSafeUrl','writerV102ImageNormalize','writerV102ImageExtension']);
 const cfg=api.writerV102ImagesMerge({}),url=api.writerV102ImageQuery(cfg,'a cat',1).url;
 assert.match(url,/commons\.wikimedia\.org/);
 assert.equal(api.writerV102ImageSafeUrl('https://evil.example/a.jpg'),'');
 const result=api.writerV102ImageNormalize(cfg,{query:{pages:{'1':{title:'File:Example.jpg',imageinfo:[{url:'https://upload.wikimedia.org/one.jpg',
  thumburl:'https://upload.wikimedia.org/thumb.jpg',extmetadata:{LicenseShortName:{value:'CC BY'}}}]}}}});
 assert.equal(result.length,1);assert.equal(result[0].license,'CC BY');
 assert.equal(api.writerV102ImageExtension(Uint8Array.of(255,216,255,3,4).buffer),'.jpg');
 assert.equal(cfg.mode,'local');
});
test('Alignment syntax does not conflict with Markdown pipes, paths, or normal prose',()=>{
 const api=expose('src/v10/inline-alignment.js',['writerV102AlignToken','writerV102AlignMerge']);
 assert.equal(api.writerV102AlignToken('::c: hello **bold**').side,'center');
 assert.equal(api.writerV102AlignToken('::c: hello **bold**').legacy,false);
 assert.equal(api.writerV102AlignToken('::c[legacy]').legacy,true);
 assert.equal(api.writerV102AlignToken('::right: text').side,'right');
 assert.equal(api.writerV102AlignToken('::l: text').side,'left');
 for(const value of ['::c: ','a | b','/italic/','\\literal\\','this is ::c[not standalone]','\`\`\`','::c[]']){
  assert.equal(api.writerV102AlignToken(value),null,value);
 }
 const cfg=api.writerV102AlignMerge({});assert.equal(cfg.enabled,true);
});
test('Short suffixes work with native Markdown headings, normal text and legacy notation',()=>{
 const api=expose('src/v10/inline-alignment.js',['writerV102AlignToken','writerV102AlignApply']);
 for(const [line,side] of [['# Chapter {c}','center'],['## Subtitle {r}','right'],
  ['###### Notes {l}','left'],['Text **bold** {c}','center'],
  ['# ::c: Old heading','center'],['::c[old text]','center']]){
  assert.equal(api.writerV102AlignToken(line)?.side,side,line);
 }
 for(const line of ['# Normal heading','Some text {unknown}','line [link](here)','|table|',
   '\x60{c}\x60','Body with {c} not at end']){
  assert.equal(api.writerV102AlignToken(line),null,line);
 }
 const lines=['# Chapter','## Section {r}','::c: # Old heading'];
 let cursor={line:0,ch:0};
 const editor={
  getCursor:()=>cursor,getLine:n=>lines[n],
  replaceRange:(text,from)=>{lines[from.line]=text;}
 };
 api.writerV102AlignApply(editor,'c');
 assert.equal(lines[0],'# Chapter {c}');
 api.writerV102AlignApply(editor,'r');
 assert.equal(lines[0],'# Chapter {r}');
 api.writerV102AlignApply(editor,null);
 assert.equal(lines[0],'# Chapter');
 cursor={line:1,ch:0};api.writerV102AlignApply(editor,'l');
 assert.equal(lines[1],'## Section {l}');
 cursor={line:2,ch:0};api.writerV102AlignApply(editor,'r');
 assert.equal(lines[2],'# Old heading {r}');
});
test('Reading View applies heading suffix without losing semantics and overrides snippet heading CSS',()=>{
 const nodes=[{nodeValue:'Heading {l}',parentElement:{closest:()=>null}}];
 const classes=[];
 const applied=[];
 const heading={
  tagName:'H2',textContent:'Heading {l}',closest:()=>null,
  classList:{add:(...classesToAdd)=>classes.push(...classesToAdd)},
  style:{setProperty:(...args)=>applied.push(args)}
 };
 const document={createTreeWalker:()=>({
  currentNode:null,index:0,nextNode(){
   if(this.index>=nodes.length)return false;
   this.currentNode=nodes[this.index++];return true;
  }
 })};
 const api=expose('src/v10/inline-alignment.js',['writerV102AlignReading'],
  {document,NodeFilter:{SHOW_TEXT:4}});
 api.writerV102AlignReading({querySelectorAll:()=>[heading]});
 assert.equal(nodes[0].nodeValue,'Heading');
 assert.ok(classes.includes('writer-v102-align-left'));
 assert.deepEqual(Array.from(applied[0]),['text-align','left','important']);
});
test('Native Explorer and voice-note CSS corrections are present in the distributed styles',()=>{
 const css=read('styles.css'),source=read('src/v9/explorer-flex.js');
 assert.ok(css.includes('.writer-v8-chat .writer-v8-chat-voice-toggle{'));
 assert.match(css,/place-items:center/);
 assert.match(css,/writer-v91-flex-hidden/);
 assert.match(source,/getSortedFolderItems/);
 assert.match(source,/writerFlexConcealed/);
});
test('Spaces, bookshelf, command palette and fictional voice-note layout are wired',()=>{
 const spaces=read('src/v9/smart-spaces.js'),books=read('src/v10/bookshelf.js');
 const chat=read('src/v8/finish-blocks.js'),flex=read('src/v9/explorer-flex.js');
 const css=read('styles.css');
 for(const label of ['v1042-open-quick-actions','v1042-spaces-next',
  'v1042-spaces-previous','v1042-current-folder-sorting','v1042-spaces-quick-pin']){
  assert.ok(spaces.includes(label),label);
 }
 assert.match(spaces,/writer-v1042-space-side-tools/);
 assert.match(css,/writer-v9-space-side-nav/);
 assert.match(css,/writer-v1042-bookshelf-modal/);
 assert.match(books,/writer-v1042-bookshelf-sort/);
 assert.match(books,/addRibbonIcon/);
 assert.match(chat,/Math\.random\(\)/);
 assert.match(chat,/bar\.style\.height/);
 assert.match(flex,/writerFlexOrderHost/);
 assert.doesNotMatch(flex,/container\.appendChild\(row\.node\)/);
});
test('Release wiring: bundled code, bilingual docs, CSS and version synchronize',()=>{
 const main=read('main.js'),build=read('scripts/build-v3.js'),css=read('styles.css'),manifest=JSON.parse(read('manifest.json'));
 for(const p of ['v10/image-inserter','v10/inline-alignment'])assert.ok(build.includes(p));
 for(const name of ['writerV102ImagesRegister(this)','writerV102AlignRegister(this)',
  'writerV102ImagesMerge(this.settings)','writerV102AlignMerge(this.settings)'])assert.ok(main.includes(name),name);
 assert.equal(manifest.version,'10.4.1');
 assert.match(css,/writer-v102-image-grid/);assert.doesNotMatch(css,/:has\s*\(|!important/);
 for(const p of ['README.md','docs/README.pt-BR.md'])assert.ok(read(p).includes('10.2.0'));
});
