'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v8/format-blocks.js','utf8');
const extension=fs.readFileSync('src/v5/extended-syntax.js','utf8');
const studio=fs.readFileSync('src/v7/story-studio.js','utf8');
const css=fs.readFileSync('src/styles/v8-format-blocks.css','utf8');
const {writerV8SplitTabs,writerV8ReadCard,writerV8ImagePath}=vm.runInNewContext(source+'\n({writerV8SplitTabs,writerV8ReadCard,writerV8ImagePath})',{TFile:class TFile{}});
test('tabs respect Markdown separators, max tab count and input size',()=>{
 const tabs=writerV8SplitTabs('=== Resumo\n**texto**\n=== Pessoas\n- [[Joana]]');
 assert.equal(tabs.length,2);
 assert.equal(tabs[0].title,'Resumo');
 assert.equal(tabs[0].content,'**texto**');
 assert.equal(tabs[1].content,'- [[Joana]]');
 assert.equal(writerV8SplitTabs('texto sem aba').length,0);
 assert.equal(writerV8SplitTabs(Array.from({length:13},(_,i)=>'=== Aba '+i).join('\n')).length,0);
 assert.equal(writerV8SplitTabs('x'.repeat(33000)).length,0);
});
test('avatar/wiki cards parse bounded properties without changing the body',()=>{
 const card=writerV8ReadCard('name: Maria\nimage: [[Images/m.webp]]\nrole: Protagonista\n---\n**Biography**\n[[Link]]');
 assert.equal(card.fields.name,'Maria');
 assert.equal(card.fields.image,'[[Images/m.webp]]');
 assert.equal(card.body,'**Biography**\n[[Link]]');
 assert.equal(writerV8ReadCard('x'.repeat(33000)),null);
});
test('header images are local and restricted to supported vault extensions',()=>{
 class File{constructor(extension){this.extension=extension;}}
 const vmTools=vm.runInNewContext(source+'\n({writerV8ImagePath})',{TFile:File});
 const app={metadataCache:{getFirstLinkpathDest:(path)=>path==='Images/m.webp'?new File('webp'):new File('md')},vault:{getResourcePath:()=> 'app://local-image'}};
 assert.equal(vmTools.writerV8ImagePath(app,'[[Images/m.webp]]','note.md'),'app://local-image');
 assert.equal(vmTools.writerV8ImagePath(app,'https://example.org/avatar.png','note.md'),'');
 assert.equal(vmTools.writerV8ImagePath(app,'[[notes.md]]','note.md'),'');
});
test('formatting blocks are registered behind the existing module settings',()=>{
 assert.match(extension,/interactiveBlocks:true/);
 assert.match(extension,/writerV8RegisterBlocks\(this\.plugin/);
 assert.match(source,/writer-tabs.*writer-avatar.*writer-wiki/);
 assert.match(source,/role:'tablist'/);
 assert.match(source,/role:'tabpanel'/);
 assert.match(source,/ArrowRight:1,ArrowLeft:-1/);
 assert.match(source,/MarkdownRenderer\.render/);
});
test('world graph uses adjacency and avoids note-by-note lookups for each search',()=>{
 const a=studio.indexOf('function writerV7StudioRenderGraph(');
 const b=studio.indexOf('function writerV7StudioScenes(',a);
 const graph=studio.slice(a,b);
 assert.match(graph,/const byPath=new Map/);
 assert.match(graph,/const adjacency=new Map/);
 assert.match(graph,/const searchable=all\.map/);
 assert.doesNotMatch(graph,/all\.find\(/);
 assert.doesNotMatch(graph,/for\(const other of all\)/);
});
test('styles are scoped and docs demonstrate all three block types',()=>{
 assert.match(css,/\.writer-v8-tabs/);
 assert.match(css,/\.writer-v8-wiki-meta/);
 assert.match(css,/body\.is-mobile \.writer-v8-tab-list/);
 assert.doesNotMatch(css,/!important/);
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const readme=fs.readFileSync(path,'utf8');
  for(const language of ['writer-tabs','writer-avatar','writer-wiki'])assert.ok(readme.includes(language),path+' '+language);
  assert.ok(!/^## \d+\.\d+\.\d+/m.test(readme),'README should describe features, not releases');
 }
});
