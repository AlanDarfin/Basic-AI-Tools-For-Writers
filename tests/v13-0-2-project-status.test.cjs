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
 assert.match(css,/writer-project-scene-title\{[\s\S]*?grid-column:1\/-1/);
 assert.match(css,/writer-project-tabs\.writer-project-tabs>button[\s\S]*?white-space:nowrap/);
 assert.match(css,/\.status-bar\.writer-v132-status-host\{[\s\S]*?max-width:calc\(100% - 64px\)/);
 assert.doesNotMatch(css,/\.status-bar\s*\{/);
 assert.match(css,/:is\(\.writer-v91-sound-status,\.writer-v1010-width-status\) input\[type="range"\]::-webkit-slider-runnable-track\{\s*height:3px/);
});
