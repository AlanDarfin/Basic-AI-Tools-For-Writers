'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const css=fs.readFileSync('src/styles/v13-foundation.css','utf8');
const bundle=fs.readFileSync('styles.css','utf8');
const projects=fs.readFileSync('projects.js','utf8');
const reading=fs.readFileSync('src/v6/reading.js','utf8');
const status=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
const sound=fs.readFileSync('src/v9/soundscapes.js','utf8');

test('project category tabs wrap to legible rows by panel width rather than break each letter',()=>{
 assert.match(css,/\.writer-project-root\{\s*container-name:basic-project;/);
 assert.match(css,/grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,96px\),1fr\)\)/);
 assert.match(css,/@container basic-project \(max-width:540px\)/);
 assert.match(css,/@container basic-project \(max-width:250px\)/);
 assert.match(css,/writer-project-nav-groups>button\{[\s\S]*?white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
 assert.match(projects,/title:lfMsg\(group\.pt,group\.en\)/);
});

test('narrow scene controls use a second row instead of squeezing title to a few pixels',()=>{
 assert.match(css,/grid-template-columns:30px minmax\(0,1fr\)/);
 assert.match(css,/writer-project-scene-actions>.writer-v7-scene-title-wrap\{\s*grid-column:2;grid-row:1/);
 assert.match(css,/writer-project-scene-actions>.writer-project-scene-controls\{\s*grid-column:2;grid-row:2/);
 assert.match(css,/writer-project-scene-title-text\{[\s\S]*?white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
 assert.match(projects,/'aria-label':\(level\?lfMsg\('Subcapítulo nível '/);
 assert.match(projects,/title:name/);
 assert.match(bundle,/v13\.0\.2 — project chapters/);
});

test('reading time avoids repeating word counts in native status bar',()=>{
 const api=vm.runInNewContext(reading+'\n({writerV6ReadingTextStatus})',{
  writerUi:(pt,en)=>pt,writerV6Allowed:()=>true,MarkdownView:class{},
  Math,Date,Intl,Set,Map,console
 });
 const plugin={
  settings:{v6:{readingTime:{status:true,wpm:230}}},
  app:{workspace:{
   getActiveFile:()=>({path:'Book.md',extension:'md'}),
   getActiveViewOfType:()=>({editor:{getValue:()=>'Capítulo de teste com poucas palavras'}})
  }}
 };
 const node={textContent:'',style:{display:'none'},title:''};
 api.writerV6ReadingTextStatus(plugin,node);
 assert.match(node.textContent,/^\d+ min leitura$/);
 assert.doesNotMatch(node.textContent,/palavras/);
 assert.match(node.title,/6 palavras/);
 assert.equal(node.style.display,'');
});

test('Soundscapes and editor width retain separate actions but identical slim slider geometry',()=>{
 assert.match(css,/shared slim range control for Basic Soundscapes and Editor Width/);
 assert.match(css,/\.status-bar :is\(\.writer-v91-sound-status,\.writer-v1010-width-status\) input\[type="range"\]\{/);
 assert.match(css,/input\[type="range"\]::-webkit-slider-thumb\{/);
 assert.match(css,/input\[type="range"\]::-moz-range-thumb\{/);
 assert.match(css,/@media \(max-width:920px\)/);
 assert.match(css,/\.status-bar \.status-bar-item\.writer-v1010-width-status\{display:none;/);
 assert.match(css,/\.status-bar \.status-bar-item\.writer-v91-sound-status\{max-width:155px;/);
 assert.match(status,/writerUi\('Largura do editor','Editor width'\)/);
 assert.match(sound,/title:writerUi\('Volume do Soundscapes','Soundscapes volume'\)/);
});
