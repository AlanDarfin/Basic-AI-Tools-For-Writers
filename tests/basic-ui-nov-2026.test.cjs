'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
const css=fs.readFileSync('styles.css','utf8');

test('homepage slash searches use native Web Viewer and never match vault notes',()=>{
 const home=fs.readFileSync('src/workspace/writing-home.js','utf8');
 const utils=fs.readFileSync('src/workspace/home-utilities.js','utf8');
 assert.match(home,/const slashSearch=\(\)=>input\.value\.trimStart\(\)\.startsWith\('\/'\)/);
 assert.match(home,/if\(slashSearch\(\)\)\{[\s\S]*?matches=\[\];selected=0;status\.hidden=false;[\s\S]*?return; \/\/ Never search/);
 assert.match(home,/if\(slashSearch\(\)\)await writerV8HomeOpenNativeSearch\(this\.plugin,slashTerm\(\),current\)/);
 assert.match(home,/if\(event\.key==='Enter'\)\{\s*if\(slashSearch\(\)\)/);
 assert.match(utils,/async function writerV8HomeOpenNativeSearch\(plugin,input,current=\(\)=>true\)/);
 assert.match(utils,/if\(!writerV8HomeWebViewerEnabled\(plugin\)\)/);
 assert.match(utils,/await leaf\.setViewState\(\{type:'webviewer'/);
 assert.doesNotMatch(utils.slice(utils.indexOf('async function writerV8HomeOpenNativeSearch'),utils.indexOf('async function writerV8HomeOpenURL')),
  /scope\.open\(|type:'surfing-view'/);
 assert.ok(main.includes('async function writerV8HomeOpenNativeSearch'),'Rebuilt main.js must include updated handler');
});

test('narrative indent and hyphenation are opt-out and respect explicit Basic alignment',()=>{
 const align=fs.readFileSync('src/editor/inline-alignment.js','utf8');
 const foundation=fs.readFileSync('src/styles/features/v13-6-tools.css','utf8');
 assert.match(align,/hideDelimiters:true,proseLayout:true/);
 assert.match(align,/function writerV102SyncProseLayout/);
 assert.match(align,/cfg\.proseLayout=value;\s*writerV102SyncProseLayout\(plugin\)/);
 assert.match(foundation,/body\.writer-v102-prose-layout \.markdown-preview-view \.markdown-preview-sizer>\.el-p>p:not\(\[align\]\):not\(\.writer-v102-align-processed\)/);
 assert.match(foundation,/text-indent:5%;text-align:justify;text-justify:auto;hyphens:auto/);
 assert.ok(css.includes('/* Basic prose typography'),'Shipped CSS must include prose typography');
 assert.ok(main.includes('function writerV102SyncProseLayout'),'Bundled JS must include its settings toggle');
});

test('status bar is fixed to the lower edge without covering left-pane controls',()=>{
 const source=fs.readFileSync('src/styles/features/v13-6-projects.css','utf8');
 const start=source.indexOf('/* Fixed bottom dock rather than a centered floating status bar.');
 const block=source.slice(start);
 assert.ok(start>0);
 assert.match(block,/position:fixed;inset:auto 0 0 auto/);
 assert.match(block,/left:auto;right:0;bottom:0/);
 assert.match(block,/transform:none/);
 assert.match(block,/max-width:calc\(100vw - 268px\)/);
 assert.ok(css.includes(block.trimEnd()),'Shipped CSS must include the dock rules');
});

test('LanguageTool popup and sidebar results stay compact, with touch-sized actions',()=>{
 const source=fs.readFileSync('src/styles/features/v13-7-review.css','utf8');
 assert.match(source,/menu\.writer-v406-lt-compact\{[\s\S]*?max-height:min\(285px,52dvh\)/);
 assert.match(source,/writer-review-results\{\s*display:flex;flex-direction:column;gap:5px/);
 assert.match(source,/writer-review-results \.writer-lt-result\{[\s\S]*?padding:7px 8px/);
 assert.match(source,/body\.is-mobile \.dictionary-view-content\.writer-tool-root \.writer-lt-choices>\.writer-lt-choice,[\s\S]*?min-height:40px/);
 assert.ok(css.includes('/* Compact LanguageTool popups'));
});

test('jump to LanguageTool passage reveals the editor before scrolling',async()=>{
 const start=main.indexOf(' async jumpToReviewError(file,start,end,source){');
 const end=main.indexOf('  closeReviewPopup(){',start);
 assert.ok(start>0&&end>start,'Cannot find jump-to-text method');
 const method=main.slice(start,end);
 const messages=[];
 const {jumpToReviewError}=vm.runInNewContext('({'+method+'})',{
  msg:(pt,en)=>en,Notice:class{constructor(message){messages.push(message);}},
  Promise,setTimeout
 });
 const file={path:'Book.md'},events=[],source='A test scene here.';
 const editor={
  getValue:()=>source,offsetToPos:offset=>({line:0,ch:offset}),
  setSelection:()=>events.push('selection'),
  focus:()=>events.push('focus'),
  scrollIntoView:()=>events.push('scroll')
 };
 const leaf={view:{file,editor}};
 const workspace={
  getLeavesOfType:()=>[leaf],
  setActiveLeaf:()=>events.push('activate'),
  revealLeaf:async()=>events.push('reveal')
 };
 await jumpToReviewError.call({app:{workspace,isMobile:false}},file,2,6,source);
 assert.deepEqual(events,['activate','reveal','selection','focus','scroll']);
 assert.deepEqual(messages,[]);
});
