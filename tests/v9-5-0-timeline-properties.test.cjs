'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v9/timeline-blocks.js','utf8');
const api=vm.runInNewContext(source+'\n({writerV95TimelineParse,writerV95TimelineSortKey})',{console});

test('George-debug legacy + triplets, bracket classes and event photo metadata',()=>{
 const input=[
  '[line-5, body-3, active-color-interactive-accent]',
  'layout: horizontal','theme: cards','',
  '+ pre</br> 17th century',
  '+ First era','+ A **markdown** paragraph.',
  'image: [[Images/era.png]]','group: Book 1','icon: history',
  '',
  '+ 2026',
  '+ Present',
  '+ Another event'
 ].join('\n');
 const data=api.writerV95TimelineParse(input);
 assert.equal(data.config.layout,'horizontal');
 assert.equal(data.config.theme,'cards');
 assert.equal(data.config.line,5);
 assert.equal(data.config.body,3);
 assert.equal(data.events.length,2);
 assert.equal(data.events[0].date,'pre\n 17th century');
 assert.equal(data.events[0].image,'[[Images/era.png]]');
 assert.equal(data.events[0].group,'Book 1');
 assert.match(data.events[0].content,/\*\*markdown\*\*/);
 assert.equal(data.events[1].title,'Present');
});
test('Original timeline-labeled syntax supports multiline and extended fields',()=>{
 const s=['[line-3, body-2]','theme: editorial','sort: asc',
  'date: 2026-02-01','title: Later','content: Later **details**',
  'A second line.','image: [[Art/later.webp]]',
  'date: 2026-01-01','title: Earlier','group: Arc','color: #ff00aa','link: [[Chapter 1]]',
  'content: An earlier story.'].join('\n');
 const data=api.writerV95TimelineParse(s,'timeline-labeled');
 assert.equal(data.events.length,2);
 assert.equal(data.events[0].title,'Earlier');
 assert.equal(data.events[1].image,'[[Art/later.webp]]');
 assert.match(data.events[1].content,/A second line/);
 assert.equal(data.events[0].color,'#ff00aa');
 assert.equal(data.events[0].link,'[[Chapter 1]]');
});
test('Invalid themes, colors and limits fail safely without code evaluation',()=>{
 const a=api.writerV95TimelineParse('theme: url(javascript)\ncolor: red\n+ 1\n+ A\n+ B');
 assert.equal(a.config.theme,'classic');assert.equal(a.config.accent,'');
 assert.equal(api.writerV95TimelineParse('x'.repeat(64001)),null);
 const many=Array.from({length:90},(_,i)=>'+ '+i+'\n+ Event '+i+'\n+ Content').join('\n');
 assert.equal(api.writerV95TimelineParse(many).events.length,80);
});
test('All original line/body presets and 11 accent colors are supported',()=>{
 const originalColors=[
  'background-modifier-success','background-modifier-error','background-modifier-error-hover',
  'text-accent','text-accent-hover','text-error','text-error-hover','text-selection',
  'interactive-accent','interactive-accent-hover','interactive-success'
 ];
 for(let line=2;line<=5;line++)for(let body=2;body<=4;body++){
  const data=api.writerV95TimelineParse(
   '[line-'+line+', body-'+body+']\n+ 2026\n+ Event\n+ Body');
  assert.equal(data.config.line,line);
  assert.equal(data.config.body,body);
 }
 for(const color of originalColors){
  const parsed=api.writerV95TimelineParse(
   '[active-color-'+color+']\n+ 2026\n+ Event\n+ Body');
  assert.equal(parsed.config.accent,'var(--'+color+')',color);
 }
 const flags=api.writerV95TimelineParse(
  '[spaced-lines, hide-titles]\n+ 2026\n+ Test\n+ Body');
 assert.equal(flags.config.spacedLines,true);
 assert.equal(flags.config.hideTitles,true);
});
test('Timeline themes have distinct CSS, in both layout orientations',()=>{
 const css=fs.readFileSync('src/styles/v9-5-timeline.css','utf8');
 const js=fs.readFileSync('src/v9/timeline-blocks.js','utf8');
 for(const theme of ['minimal','compact','poster','glass','terminal']){
  assert.match(css,new RegExp('is-theme-'+theme));
  assert.ok(api.writerV95TimelineParse('theme: '+theme+'\n+ 2026\n+ Event\n+ Body').config.theme===theme);
 }
 for(const type of [2,3,4,5])assert.ok(css.includes('.is-line-'+type));
 for(const type of [2,3,4])assert.ok(css.includes('.is-body-'+type));
 assert.match(css,/is-theme-minimal \.writer-v95-timeline-event-body/);
 assert.match(css,/is-theme-compact \.writer-v95-timeline-head/);
 assert.ok(js.includes('writer-v105-timeline-selector'));
 assert.ok(js.includes('is-layout-horizontal'));
});
test('Property search lives inside native collapsible properties and preserves the filter',()=>{
 const js=fs.readFileSync('src/v9/pretty-properties.js','utf8');
 const css=fs.readFileSync('src/styles/v9-5-timeline.css','utf8');
 assert.match(js,/firstRow\?\.closest\('\.metadata-properties'\)/);
 assert.match(js,/properties\.insertBefore\(input,properties\.firstChild\)/);
 assert.doesNotMatch(js,/metadata\.insertBefore\(input,metadata\.firstChild\)/);
 assert.match(js,/input\.value=previousSearch/);
 assert.match(css,/\.metadata-container\.is-collapsed \.writer-v9216-pretty-search/);
});
test('Markdown block is registered with bilingual UI and bundled for distribution',()=>{
 const module=fs.readFileSync('src/v8/finish-blocks.js','utf8');
 const modules=fs.readFileSync('src/v4/modules.js','utf8');
 const bundle=fs.readFileSync('main.js','utf8');
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(module,/writerV95RegisterTimelineBlocks\(plugin\)/);
 assert.match(modules,/'timelineBlocks'/);
 assert.match(source,/timeline-labeled/);
 assert.match(source,/writerV8ImagePath/);
 assert.match(source,/writerV8Markdown/);
 assert.match(bundle,/writerV95RegisterTimelineBlocks/);
 assert.match(css,/writer-v95-timeline-event/);
 for(const doc of ['docs/BLOCKS.en.md','docs/BLOCKS.pt-BR.md']){
  const contents=fs.readFileSync(doc,'utf8');
  assert.match(contents,/timeline-labeled/);
  assert.match(contents,/layout: horizontal/);
 }
});
