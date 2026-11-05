'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/v9/context-toolbar.js','utf8');
const mode=vm.runInNewContext(src+'\nwriterV1061ToolbarEditingMode');
test('Reading view never shows formatting bar even when MarkdownView.editor exists',()=>{
 assert.equal(mode({editor:{},getMode:()=> 'preview'}),false);
 assert.equal(mode({editor:{},getMode:()=> 'reading'}),false);
 assert.equal(mode({editor:{},getState:()=>({mode:'preview'})}),false);
});
test('Live preview and source editing keep formatting bar available',()=>{
 assert.equal(mode({editor:{},getMode:()=> 'source'}),true);
 assert.equal(mode({editor:{},getState:()=>({mode:'source'})}),true);
});
test('Fallback detects preview DOM and tolerates unavailable mode API',()=>{
 assert.equal(mode({editor:{},contentEl:{querySelector:s=>s==='.markdown-preview-view'?{}:null}}),false);
 assert.equal(mode({editor:{},contentEl:{querySelector:s=>s==='.markdown-source-view'?{}:null}}),true);
 assert.equal(mode(null),false);
});
test('Runtime observes toggles and immediately removes formatting bar in Reading',()=>{
 assert.match(src,/observeMode\(view\)/);
 assert.match(src,/MutationObserver/);
 assert.match(src,/if\(!editable\)remove\(\)/);
 assert.match(src,/writerV1061ToolbarEditingMode\(view\)\|\|!writerV9ToolbarAllowed/);
 assert.match(src,/modeObserver\?\.disconnect\(\)/);
});
