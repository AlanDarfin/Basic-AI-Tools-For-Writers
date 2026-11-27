'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v13/ui-foundation.js','utf8');
const {writerV132ProtectStatusBar:protect}=vm.runInNewContext(source+'\n({writerV132ProtectStatusBar})');
test('status protection is scoped, shared by widgets and restored on unload',()=>{
 const names=new Set(['status-bar']),callbacks=[];
 const bar={classList:{contains:n=>names.has(n),add:n=>names.add(n),remove:n=>names.delete(n)}};
 const plugin={register:fn=>callbacks.push(fn)};
 protect(plugin,{parentElement:bar});protect(plugin,{parentElement:bar});
 assert.ok(names.has('writer-v132-status-host'));assert.equal(callbacks.length,1);
 callbacks[0]();assert.deepEqual([...names],['status-bar']);
 protect(plugin,{});protect(plugin,{parentElement:{}});
 assert.equal(callbacks.length,1);
});
test('project titles retain a full row in narrow panes and status sliders use one track style',()=>{
 const css=fs.readFileSync('src/styles/v13-foundation.css','utf8');
 assert.match(css,/writer-v7-scene-title-wrap\{[\s\S]*?grid-column:2;grid-row:1/);
 assert.match(css,/writer-project-scene-title-text\{[\s\S]*?text-overflow:ellipsis/);
 assert.match(css,/writer-project-tabs\.writer-project-tabs>button[\s\S]*?white-space:nowrap/);
 assert.match(css,/\.status-bar\.writer-v132-status-host\{[\s\S]*?max-width:calc\(100% - 64px\)/);
 assert.doesNotMatch(css,/\.status-bar\s*\{/);
 assert.match(css,/:is\(\.writer-v91-sound-status,\.writer-v1010-width-status\) input\[type="range"\]::-webkit-slider-runnable-track\{\s*height:3px/);
});

test('narrow project panes wrap navigation groups and keep scene actions inline',()=>{
 const css=fs.readFileSync('src/styles/v13-6-projects.css','utf8');
 const narrow=css.slice(css.indexOf('@container basic-project (max-width:540px)'),css.indexOf('@container basic-project (max-width:250px)'));
 assert.match(narrow,/writer-project-nav-groups\{[^}]*grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,96px\),1fr\)\)/);
 assert.match(narrow,/writer-project-nav-label\{display:block/);
 assert.match(narrow,/writer-project-scene-actions\{grid-template-columns:28px minmax\(0,1fr\) max-content;/);
 assert.match(narrow,/body\.is-mobile .*writer-project-scene-actions\{grid-template-columns:44px minmax\(0,1fr\) 44px\}/);
 assert.match(narrow,/writer-v7-scene-title-wrap\{grid-column:2;grid-row:1/);
 assert.match(narrow,/writer-project-scene-controls\{grid-column:3;grid-row:1/);
 assert.match(css,/@container basic-project \(max-width:250px\)\{\s*[^{}]+writer-project-scene-title-text\{\s*display:block;white-space:nowrap;overflow-wrap:normal;text-overflow:ellipsis/);
 assert.match(css,/writer-project-scene-rails\{max-width:15px;overflow:hidden\}/);
 assert.match(css,/@container basic-project \(max-width:220px\)\{\s*[^{}]+button\.writer-project-small-button:not\(\.writer-project-scene-more\)\{display:none\}/);
});

test('reading status shows duration and exposes the complete estimate in both languages',()=>{
 const source=fs.readFileSync('src/v6/reading.js','utf8');
 for(const [lang,visible,detail] of [['pt','1 min leitura','1 minuto de leitura · 6 palavras'],['en','1 min read','1 minute of reading · 6 words']]){
  const {writerV6ReadingTextStatus:update}=vm.runInNewContext(source+'\n({writerV6ReadingTextStatus})',{
   writerUi:(pt,en)=>lang==='pt'?pt:en,writerV6Allowed:()=>true,MarkdownView:class{}
  });
  const config={status:true,wpm:230};
  const plugin={settings:{v6:{readingTime:config}},app:{workspace:{
   getActiveFile:()=>({path:'Novel.md',extension:'md'}),
   getActiveViewOfType:()=>({editor:{getValue:()=>'A chapter with six words here'}})
  }}};
  const labels=new Map();
  const element={style:{},setAttribute:(key,value)=>labels.set(key,value),removeAttribute:key=>labels.delete(key)};
  update(plugin,element);
  assert.equal(element.textContent,visible);
  assert.equal(element.title,detail);
  assert.equal(labels.get('aria-label'),detail);
  config.status=false;update(plugin,element);
  assert.equal(element.style.display,'none');
  assert.equal(element.textContent,'');
  assert.equal(element.title,'');
  assert.equal(labels.has('aria-label'),false);
 }
});

test('Longform scene rows are compact and inline on desktop, with hover and keyboard-revealed actions',()=>{
 const css=fs.readFileSync('src/styles/v13-6-projects.css','utf8');
 const shipped=fs.readFileSync('styles.css','utf8');
 const start=css.indexOf('/* Desktop Longform: compact single-line scenes');
 const end=css.indexOf('/* Visual-only Longform story arc dividers',start);
 assert.ok(start>=0&&end>start,'Missing desktop-only Longform override');
 const desktop=css.slice(start,end);
 assert.ok(shipped.includes(desktop),'Published styles.css must include the desktop layout');
 assert.match(desktop,/body:not\(\.is-mobile\) .*writer-project-scene-actions\{[\s\S]*?grid-template-columns:24px minmax\(0,1fr\) max-content/);
 assert.match(desktop,/writer-project-scene-controls\{[\s\S]*?grid-column:3;grid-row:1/);
 assert.match(desktop,/writer-project-scene-title-text\{[\s\S]*?white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
 assert.match(desktop,/@media \(hover:hover\) and \(pointer:fine\)/);
 assert.match(desktop,/:is\(:hover,:focus-within\)>\.writer-project-scene-controls\{[\s\S]*?opacity:1;pointer-events:auto/);
 assert.match(desktop,/\.writer-project-scene-controls\{\s*opacity:0;pointer-events:none/);
 assert.match(css,/body\.is-mobile \.writer-project-root \.writer-project-panel \.writer-project-scene\.writer-project-scene-actions\{grid-template-columns:44px/);
});
