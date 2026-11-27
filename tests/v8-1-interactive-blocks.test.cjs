'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const editable=read('src/v8/block-edit.js'),blocks=read('src/v8/format-blocks.js');
const posts=read('src/v8/social-post.js'),media=read('src/v8/media-gallery.js');
const vmHelpers=vm.runInNewContext(editable+'\n'+blocks+'\n({writerV8FenceReplace,writerV8TabLayout,writerV8ReplaceTab,writerV8SplitTabs,writerV8ReadCard,writerV8ReplaceCardBody})',
 {writerUi:(pt,en)=>en});
const {writerV8FenceReplace,writerV8TabLayout,writerV8ReplaceTab,writerV8SplitTabs,writerV8ReadCard,writerV8ReplaceCardBody}=vmHelpers;
test('side tabs accept both left and right placements and preserve other tabs',()=>{
 assert.equal(writerV8TabLayout('layout: side\n=== A\nHello'), 'side');
 assert.equal(writerV8TabLayout('layout: right\n=== A\nHello'), 'right');
 assert.equal(writerV8TabLayout('=== A\nHello'), 'top');
 const orig='layout: left\n=== Synopsis\nOld text\n=== Notes\n- keep';
 const out=writerV8ReplaceTab(orig,0,'Updated **Markdown**');
 assert.ok(out.includes('layout: left\n=== Synopsis\nUpdated **Markdown**'));
 assert.ok(out.includes('=== Notes\n- keep'));
 assert.equal(writerV8ReplaceTab(orig,100,'unwanted'),null);
});
test('tab parsing and editing agree on nested fences, indentation and CRLF',()=>{
 const source=['layout: right','=== Notes','\x60\x60\x60\x60md','=== Not a tab','\x60\x60\x60','=== Still code','\x60\x60\x60\x60','=== Chapter','    indented code',''].join('\r\n');
 const tabs=writerV8SplitTabs(source);
 assert.equal(tabs.length,2);
 assert.equal(tabs[0].content,'\x60\x60\x60\x60md\n=== Not a tab\n\x60\x60\x60\n=== Still code\n\x60\x60\x60\x60');
 assert.equal(tabs[1].content,'    indented code');
 assert.equal(writerV8ReplaceTab(source,1,'new chapter'),source.replace('    indented code\r\n','new chapter'));
 assert.equal(writerV8TabLayout('~~~md\nlayout: left\n~~~\n=== Notes'),'top');
});
test('side tabs keep vertical keyboard navigation and leave child controls usable',()=>{
 const edits=[],focussed=[];
 const {writerV8RenderTabs}=vm.runInNewContext(blocks+'\n({writerV8RenderTabs})',{
  writerUi:(_pt,en)=>en,writerV8InlineEditor:(...args)=>edits.push(args)
 });
 function element(options={}){
  return {attr:options.attr||{},cls:options.cls,children:[],events:{},dataset:{},classList:{toggle(){}},
   createEl(_tag,childOptions){const child=element(childOptions);this.children.push(child);return child;},
   createDiv(childOptions){return this.createEl('div',childOptions);},
   setAttribute(name,value){this.attr[name]=value;},
   addEventListener(name,fn){this.events[name]=fn;},focus(){focussed.push(this);},
   querySelector(){return null;}
  };
 }
 const host=element();writerV8RenderTabs({},'layout: right\n=== A\n=== B',host,{});
 const [nav,panels]=host.children[0].children;
 const [first,second]=nav.children;
 assert.equal(nav.attr['aria-orientation'],'vertical');
 let prevented=0;
 const key=(target,key)=>target.events.keydown({key,target,preventDefault(){prevented++;}});
 key(first,'ArrowRight');assert.equal(prevented,0);
 key(first,'ArrowDown');assert.equal(second.attr['aria-selected'],'true');assert.equal(focussed[0],second);
 const editor=panels.children[1].children[0];
 editor.events.keydown({target:{},key:'Enter',preventDefault(){prevented++;}});
 assert.equal(prevented,1);assert.equal(edits.length,0);
 key(editor,'Enter');assert.equal(edits.length,1);
});
test('wiki properties accept accented and decomposed keys without changing the raw header on edit',()=>{
 const decomposed='região'.normalize('NFD');
 const source=['title: Arquivo',decomposed+': Norte','responsável: Ângela','---','    Código de inventário'].join('\r\n');
 const card=writerV8ReadCard(source);
 assert.equal(card.fields['região'],'Norte');
 assert.equal(card.fields['responsável'],'Ângela');
 assert.equal(card.body,'    Código de inventário');
 assert.equal(writerV8ReplaceCardBody(source,'Novo corpo'),source.replace('    Código de inventário','Novo corpo'));
});
test('one fenced block updates without touching unrelated notes or identical source elsewhere',()=>{
 const original='# Heading\n\n~~~writer-tabs\n=== A\nold\n~~~\n\n~~~writer-tabs\n=== A\nold\n~~~\n';
 const section={lineStart:2,lineEnd:5},ctx={getSectionInfo:()=>section};
 const updated=writerV8FenceReplace(original,'writer-tabs',ctx,null,'=== A\nold','=== A\nnew');
 assert.equal(updated.split('=== A\nold').length-1,1);
 assert.equal(updated.split('=== A\nnew').length-1,1);
 assert.throws(()=>writerV8FenceReplace(original,'writer-tabs',ctx,null,'changed by someone else','overwrite'),/changed|not found/);
 assert.throws(()=>writerV8FenceReplace(original,'writer-tabs',{},null,'=== A\nold','oops'),/changed|not found/);
});
test('click-to-edit uses safe fenced note processing rather than mutating content DOM',()=>{
 assert.match(editable,/plugin\.app\.vault\.process\(file,text=>/);
 assert.match(editable,/getSectionInfo/);
 assert.match(editable,/writerV8FenceCandidate/);
 assert.match(editable,/save\.disabled=(?:cancel\.disabled=)?true/);
 assert.match(blocks,/writerV8InlineEditor\(/);
 assert.match(blocks,/writerV8ReplaceTab/);
 assert.match(blocks,/writer-v8-tab-add/);
 assert.match(blocks,/writer-v8-avatar-side/);
 assert.doesNotMatch(editable,/editor\.setValue\(/);
});
test('fictional posts parse replies and bound author-input metrics',()=>{
 const fn=vm.runInNewContext(blocks+'\n'+posts+'\n({writerV8SplitPost,writerV8PostCount})');
 const result=fn.writerV8SplitPost('author: Maria\nlikes: 8\n---\nFirst post\n=== reply\nauthor: Joao\ndepth: 2\n---\nResponse');
 assert.equal(result.main.fields.author,'Maria');
 assert.equal(result.replies.length,1);
 assert.equal(result.replies[0].depth,2);
 assert.equal(fn.writerV8PostCount(-12),0);
 assert.equal(fn.writerV8PostCount('33'),33);
 assert.ok(!fn.writerV8SplitPost('a'.repeat(33000)));
 assert.match(posts,/writer-v8-social-replies/);
 const inCode='~~~text\n=== reply\n~~~';
 const withCode=fn.writerV8SplitPost('author: Mira\n---\n'+inCode+'\n=== REPLY\n\nAuthor: Jonas\n---\nReply');
 assert.equal(withCode.main.body,inCode);
 assert.equal(withCode.replies.length,1);
 assert.equal(withCode.replies[0].fields.author,'Jonas');
 assert.equal(fn.writerV8SplitPost('First\n'+'=== reply\nReply\n'.repeat(41)),null);
});
test('both column formats render nested code and retain all content at the column limit',()=>{
 const widgets=read('src/v9/interactive-widgets.js'),legacyColumns=read('src/v10/media-drag-extension.js');
 const rendered=[];
 const MarkdownRenderer={render:async(_app,markdown)=>{rendered.push(markdown);}};
 const {writerV92RenderColumns,writerV107ColumnsRender}=vm.runInNewContext(
  blocks+'\n'+widgets+'\n'+legacyColumns+'\n({writerV92RenderColumns,writerV107ColumnsRender})',{MarkdownRenderer}
 );
 const el={createDiv(){return {createDiv(){return {};},style:{setProperty(){}}};}};
 const plugin={app:{}},ctx={sourcePath:'Book.md'};
 for(const [render,separator,header] of [
  [writerV92RenderColumns,'--- end-column ---','columns: 4\n'],
  [writerV107ColumnsRender,'---column---','']
 ]){
  rendered.length=0;
  const code='~~~text\n'+separator+'\ncolumns: 3\n~~~',tail='x'.repeat(15100);
  render(plugin,header+[code,'    indented block','three',tail,'five'].join('\n'+separator+'\n'),el,ctx);
  assert.deepEqual(rendered,[code,'    indented block','three',tail+'\n'+separator+'\nfive']);
 }
});
test('media scan stays in the vault, filters types and imposes limits',()=>{
 class TFile{constructor(path,extension){this.path=path;this.basename=path.split('/').pop();this.name=this.basename;this.extension=extension;this.stat={mtime:2,size:10};}}
 class TFolder{constructor(path,children=[]){this.path=path;this.name=path.split('/').pop();this.children=children;}}
 const d=new TFolder('Photos',[new TFile('Photos/a.png','png'),new TFile('Photos/m.mp4','mp4'),new TFile('Photos/n.pdf','pdf')]);
 const g=vm.runInNewContext(media.split('function writerV8MediaOpen(')[0]+'\n({writerV8MediaConfig,writerV8MediaFiles,writerV8MediaKind})',{TFile,TFolder});
 const cfg=g.writerV8MediaConfig('type: all\nlayout: ratio\nlimit: 3\nsubfolders: false');
 assert.equal(cfg.layout,'ratio');
 assert.equal(g.writerV8MediaFiles(null,d,cfg).length,3);
 assert.equal(g.writerV8MediaFiles(null,d,{...cfg,type:'image'}).length,1);
 assert.equal(g.writerV8MediaKind(d.children[2]),'pdf');
 assert.equal(g.writerV8MediaConfig('limit: 999').limit,500);
 const recent=new TFile('Photos/Trips/New.png','png');recent.stat.mtime=500;
 d.children.push(new TFolder('Photos/Trips',[recent]));
 assert.equal(g.writerV8MediaFiles(null,d,{...cfg,subfolders:true,sort:'mtime-desc',limit:1})[0].file,recent);
 assert.equal(g.writerV8MediaFiles(null,d,{...cfg,sort:'mtime-desc',limit:1})[0].file,d.children[0]);
 assert.equal(g.writerV8MediaConfig('pagesize: 12.8').pageSize,12);
 assert.match(media,/loading:'lazy'/);
 assert.match(media,/type: all/);
});
test('media lightbox skips documents and PDFs and pauses playback when navigating',()=>{
 class Element{
  constructor(tag,props){this.tag=tag;this.props=props;this.children=[];this.events={};}
  empty(){this.children=[];}
  createEl(tag,props){const child=new Element(tag,props);this.children.push(child);return child;}
  createDiv(props){return this.createEl('div',props);}
  querySelector(){return this.children.find(child=>['video','audio'].includes(child.tag));}
  querySelectorAll(){return this.children.flatMap(child=>[...(['video','audio'].includes(child.tag)?[child]:[]),...child.querySelectorAll()]);}
  addEventListener(event,handler){this.events[event]=handler;}
  pause(){this.paused=true;}
 }
 let dialog;
 class Modal{constructor(){this.contentEl=new Element('root');dialog=this;}open(){this.onOpen();}}
 const {writerV8MediaOpen}=vm.runInNewContext(media+'\n({writerV8MediaOpen})',{Modal,writerUi:(_pt,en)=>en});
 const entries=['image','document','pdf','video','audio'].map(kind=>({kind,file:{path:kind,basename:kind}}));
 const plugin={app:{vault:{getResourcePath:file=>file.path}}};
 writerV8MediaOpen(plugin,entries,0);
 const current=()=>dialog.contentEl.children[0];
 const next=()=>current().children[0].children[2];
 assert.equal(current().children[1].tag,'img');
 next().events.click();
 const video=current().children[1];
 assert.equal(video.tag,'video');
 next().events.click();
 assert.equal(video.paused,true);
 const audio=current().children[1];
 assert.equal(audio.tag,'audio');assert.equal(next().disabled,true);
 dialog.onClose();assert.equal(audio.paused,true);
});
test('read-only formatting modules do not add CodeMirror extensions',()=>{
 for(const input of [editable,posts,media])assert.doesNotMatch(input,/registerEditorExtension\(/);
 const build=read('scripts/build-v3.js'),css=read('src/styles/blocks/v8-interactive-media.css');
 for(const name of ['v8/block-edit','v8/social-post','v8/media-gallery'])assert.ok(build.includes(name),name);
 assert.match(css,/writer-v8-tabs-side/);
 assert.match(css,/writer-v8-avatar-right/);
 assert.match(css,/\.writer-v8-tabs-right\{grid-template-columns:minmax\(0,1fr\) minmax\(90px,31%\)/);
 assert.match(css,/\.writer-v8-avatar-right\{grid-template-columns:minmax\(0,1fr\) minmax\(96px,34%\)/);
 assert.match(css,/writer-v8-social-post\.is-depth-2/);
 assert.doesNotMatch(css,/!important|(?:^|[;{])\s*columns\s*:/m);
 for(const filename of ['README.md','docs/README.pt-BR.md']){
  const docs=read(filename);
  for(const name of ['writer-tabs','writer-avatar','writer-wiki','writer-post','writer-media-gallery'])assert.ok(docs.includes(name),filename+': '+name);
 }
});
