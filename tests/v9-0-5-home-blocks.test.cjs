'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const home=read('src/v8/writing-home.js'),finish=read('src/v8/finish-blocks.js');
const blocks=read('src/v8/format-blocks.js'),editable=read('src/v8/block-edit.js');
const fns=vm.runInNewContext(home+'\n({quotes:writerV8HomeQuoteChoices,pick:writerV8HomePick})',{
 ItemView:class{},writerUi:pt=>pt
});
test('quote widget supports local customized quotes and original offline fallback',()=>{
 const own=fns.quotes('Uma frase | Pessoa\nOutra frase\n');
 assert.equal(own.length,2);
 assert.equal(own[0][0],'Uma frase');assert.equal(own[0][1],'Pessoa');
 assert.equal(own[1][1],'');
 assert.ok(fns.quotes('').length>=4);
 assert.equal(fns.pick([['única','']])[0],'única');
 assert.equal(fns.pick([['primeira',''],['segunda','']],'primeira')[0],'segunda');
 assert.match(home,/async onOpen\(\)\s*\{[\s\S]*?this\.homeQuote=null/);
 assert.match(home,/homeQuotePrevious/);
 assert.match(home,/renderQuotes\(parent\)/);
 assert.doesNotMatch(home,/fetch\(|requestUrl\(/);
});
test('gallery exclusively filters local vault images and uses native resource paths',()=>{
 assert.match(home,/renderGallery\(parent\)/);
 assert.match(home,/this\.app\.vault\.getFiles\?\.\(\)/);
 assert.match(home,/\^\(png\|jpe\?g\|webp\|gif\|avif\)\$/);
 assert.match(home,/this\.app\.vault\.getResourcePath\(file\)/);
 assert.match(home,/loading:'lazy'/);
 assert.match(home,/writerV8HomePick\(images,file\.path\)/);
});
test('recent and today lists contain compact rows with visible paths, filter and keyboard opening',()=>{
 for(const token of ['renderNoteRows','writer-v905-note-title','writer-v905-note-path','writer-v905-note-filter','writer-v905-note-row',
 'ArrowDown','ArrowUp','Enter','this.openFile(visible[selected])'])assert.ok(home.includes(token),token);
 assert.match(home,/\.filter\(file=>\(file\.stat\?\.mtime\|\|0\)>=midnight\.getTime\(\)\)/);
});
test('new widget catalog is opt-in, preserves previous dashboard layout and quote setting',()=>{
 const api=vm.runInNewContext(finish+'\nwriterV8FinishMerge',{writerV8HomeIconName:()=> 'book-open'});
 const settings={v8Finish:{homeOrder:['continue','recent','calendar'],homeHidden:['random']}};
 api(settings);
 for(const key of ['gallery','quotes','today','books'])assert.ok(settings.v8Finish.homeOrder.includes(key),key);
 assert.deepEqual(Array.from(settings.v8Finish.homeHidden),['random','gallery','quotes','today','books']);
 // Existing preferences remain intentional; opt-in new cards on brand-new/default configurations.
 const empty={};api(empty);
 for(const key of ['gallery','quotes','today','books'])assert.ok(empty.v8Finish.homeHidden.includes(key),key);
 assert.equal(empty.v8Finish.homeQuotes,'');
});
test('all seven presentation fences have short aliases and existing writer names still render',()=>{
 const f=read('src/v8/folder-overview.js'),post=read('src/v8/social-post.js'),media=read('src/v8/media-gallery.js');
 for(const item of ['tabs','avatar','wiki','writer-tabs','writer-avatar','writer-wiki'])
  assert.ok(blocks.includes("'"+item+"'"),item);
 for(const [source,short,legacy] of [
  [f,'folder-overview','writer-folder-overview'],[post,'post','writer-post'],
  [media,'media-gallery','writer-media-gallery'],[finish,'chat','writer-chat']
 ]){assert.ok(source.includes("'"+short+"'"),short);assert.ok(source.includes("'"+legacy+"'"),legacy);}
 assert.match(f,/editor\.replaceSelection\('/);
 assert.match(f,/folder-overview/);
 assert.match(media,/media-gallery\\ntype: all/);
});
test('inline editors preserve exactly the new or legacy fenced name when saving',()=>{
 const type=vm.runInNewContext(editable+'\nwriterV8FenceReplace',{
  WRITER_V8_BLOCK_MAX:32000,writerUi:pt=>pt
 });
 for(const name of ['tabs','writer-tabs','avatar','wiki']){
  const source='Before\n\n~~~'+name+'\n=== A\nOld\n~~~\n';
  const out=type(source,name,{getSectionInfo:()=>({lineStart:2,lineEnd:5})},null,'=== A\nOld','=== A\nNew');
  assert.ok(out.includes('~~~'+name+'\n=== A\nNew\n~~~'),name);
 }
 assert.match(blocks,/writerV8CommitFenced\(plugin,ctx,element,fenceType,source,next\)/);
 assert.match(blocks,/writerV8InlineEditor\(plugin,ctx,target,element,fenceType,source/);
});
test('home heading prominence and compact list rules are bundled',()=>{
 const css=read('src/styles/v9-design-system.css'),bundle=read('styles.css');
 for(const key of ['writer-v905-note-list','writer-v905-note-row.is-selected','writer-v905-gallery-frame',
  'writer-v905-quote-text','writer-v8-home-heading h2']){assert.ok(css.includes(key));assert.ok(bundle.includes(key));}
});
