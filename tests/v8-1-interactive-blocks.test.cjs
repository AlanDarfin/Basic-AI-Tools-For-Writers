'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const editable=read('src/v8/block-edit.js'),blocks=read('src/v8/format-blocks.js');
const posts=read('src/v8/social-post.js'),media=read('src/v8/media-gallery.js');
const vmHelpers=vm.runInNewContext(editable+'\n({writerV8FenceReplace,writerV8TabLayout,writerV8ReplaceTab})',
 {WRITER_V8_BLOCK_MAX:32000,writerUi:(pt,en)=>en});
const {writerV8FenceReplace,writerV8TabLayout,writerV8ReplaceTab}=vmHelpers;
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
 assert.match(editable,/save\.disabled=true/);
 assert.match(blocks,/writerV8InlineEditor\(/);
 assert.match(blocks,/writerV8ReplaceTab/);
 assert.match(blocks,/writer-v8-tab-add/);
 assert.match(blocks,/writer-v8-avatar-side/);
 assert.doesNotMatch(editable,/editor\.setValue\(/);
});
test('fictional posts parse replies and bound author-input metrics',()=>{
 const fn=vm.runInNewContext(posts+'\n({writerV8SplitPost,writerV8PostCount})',{
  writerV8ReadCard:raw=>{
   const [header,...rest]=raw.trim().split('\n---\n');
   const fields=Object.fromEntries(header.split('\n').map(line=>{const n=line.indexOf(':');return n<0?[]:[line.slice(0,n).trim(),line.slice(n+1).trim()]}).filter(x=>x.length===2));
   return {fields,body:rest.join('\n---\n')};
  },
  WRITER_V8_BLOCK_MAX:32000
 });
 const result=fn.writerV8SplitPost('author: Maria\nlikes: 8\n---\nFirst post\n=== reply\nauthor: Joao\ndepth: 2\n---\nResponse');
 assert.equal(result.main.fields.author,'Maria');
 assert.equal(result.replies.length,1);
 assert.equal(result.replies[0].depth,2);
 assert.equal(fn.writerV8PostCount(-12),0);
 assert.equal(fn.writerV8PostCount('33'),33);
 assert.ok(!fn.writerV8SplitPost('a'.repeat(33000)));
 assert.match(posts,/writer-v8-social-replies/);
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
 assert.match(media,/loading:'lazy'/);
 assert.match(media,/type: all/);
});
test('read-only formatting modules do not add CodeMirror extensions',()=>{
 for(const input of [editable,posts,media])assert.doesNotMatch(input,/registerEditorExtension\(/);
 const build=read('scripts/build-v3.js'),css=read('src/styles/v8-interactive-media.css');
 for(const name of ['v8/block-edit','v8/social-post','v8/media-gallery'])assert.ok(build.includes(name),name);
 assert.match(css,/writer-v8-tabs-side/);
 assert.match(css,/writer-v8-avatar-right/);
 assert.match(css,/writer-v8-social-post\.is-depth-2/);
 assert.doesNotMatch(css,/!important|(?:^|[;{])\s*columns\s*:/m);
 for(const filename of ['README.md','docs/README.pt-BR.md']){
  const docs=read(filename);
  for(const name of ['writer-tabs','writer-avatar','writer-wiki','writer-post','writer-media-gallery'])assert.ok(docs.includes(name),filename+': '+name);
 }
});
