'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/v10/integrations-107.js','utf8');
function boot(globals={}){
 const calls=[],timeouts=[],logs=[];
 const env={
  console:{warn:(...a)=>logs.push(['warn',...a]),error:(...a)=>logs.push(['error',...a])},
  setTimeout:fn=>{timeouts.push(fn);return timeouts.length;},
  ...globals
 };
 const api=vm.runInNewContext(source+'\n({writerV107Register,writerV107RegisterAfterStartup,writerV107Settings})',env);
 return {api,calls,timeouts,logs};
}
test('Optional module absence does not fail plugin registration (partial update recovery)',()=>{
 const {api,logs}=boot();
 const plugin={register:()=>{},settings:{legacy:{favorites:['A']}}};
 assert.doesNotThrow(()=>api.writerV107Register(plugin));
 assert.doesNotThrow(()=>api.writerV107Settings(plugin,{}));
 assert.equal(plugin._writerV107Registered,true);
 assert.deepEqual(JSON.parse(JSON.stringify(plugin.settings)),{legacy:{favorites:['A']}});
 assert.equal(logs.filter(x=>x[0]==='warn').length,8);
});
test('One failing module cannot prevent the remaining modules from registering',()=>{
 const called=[],{api,logs}=boot({
  writerV107DbRegister:()=>{called.push('database');throw Error('bad database plugin');},
  writerV107ZoteroRegister:()=>called.push('zotero'),
  writerV107StudyRegister:()=>called.push('study'),
  writerV107GraphRegister:()=>called.push('graph')
 });
 const plugin={register:()=>{},settings:{}};
 assert.doesNotThrow(()=>api.writerV107Register(plugin));
 assert.deepEqual(called,['database','zotero','study','graph']);
 assert.deepEqual(Array.from(plugin._writerV107Failures),['databases']);
 assert.equal(logs.filter(x=>x[0]==='error').length,1);
 api.writerV107Register(plugin);
 assert.equal(called.length,4,'No duplicate commands or views after repeated startup');
});
test('Explicit compatibility mode keeps previous features while disabling optional 10.7 registration',()=>{
 let calls=0;
 const {api}=boot({writerV107DbRegister:()=>calls++});
 const plugin={settings:{v107AdvancedEnabled:false,existingCustomSetting:42},register:()=>{}};
 api.writerV107Register(plugin);
 assert.equal(calls,0);
 assert.equal(plugin._writerV107Registered,undefined);
 assert.equal(plugin.settings.existingCustomSetting,42);
});
test('Settings render can survive missing module functions and a broken panel',()=>{
 const called=[],{api}=boot({
  writerV107DbSettings:()=>{called.push('db');throw Error('bad panel');},
  writerV107ZoteroSettings:()=>called.push('zotero'),
  writerV107StudySettings:()=>called.push('study')
 });
 assert.doesNotThrow(()=>api.writerV107Settings({settings:{}},{}));
 assert.deepEqual(called,['db','zotero','study']);
});
test('New modules are loaded after core onLayoutReady and not during onload',()=>{
 let onReady=null,registered=0;
 const {api,timeouts}=boot({writerV107DbRegister:()=>registered++});
 const plugin={
  app:{workspace:{onLayoutReady(fn){onReady=fn;}}},
  register:()=>{},
  settings:{}
 };
 api.writerV107RegisterAfterStartup(plugin);
 assert.equal(registered,0);
 assert.equal(typeof onReady,'function');
 onReady();
 assert.equal(registered,0,'No synchronous initialization during layout restore');
 assert.equal(timeouts.length,1);
 timeouts.shift()();
 assert.equal(registered,1);
 api.writerV107RegisterAfterStartup(plugin);
 assert.equal(registered,1,'Schedule only once');
});
test('Plugin unload cancels delayed initialization instead of reopening inactive extensions',()=>{
 let onReady=null,cleanup=null,calls=0;
 const {api,timeouts}=boot({writerV107DbRegister:()=>calls++});
 const plugin={app:{workspace:{onLayoutReady(fn){onReady=fn;}}},register:fn=>{cleanup=fn;},settings:{}};
 api.writerV107RegisterAfterStartup(plugin);onReady();cleanup();
 timeouts.shift()();
 assert.equal(calls,0);
});
test('Core features and previous bundle modules are not deleted',()=>{
 const src=fs.readFileSync('scripts/build-v3.js','utf8');
 const old=['core','complements','variants','snapshots','workspace','final-suite','tts-online',
 'v4/editor','v4/cursor-memory','v6/longform-navigation','v7/story-studio','v8/writing-home',
 'v8/writing-study','v9/context-toolbar','v9/smart-spaces','v9/research-style',
 'v10/enhancements','v10/calendar-exchange','v10/discovery','v10/startup-cleanup',
 'v10/block-dragger','v10/historical-helpers'];
 for(const sourceName of old)assert.ok(src.includes("'"+sourceName+"'"),sourceName+' missing from bundle');
 const enhancements=fs.readFileSync('src/v10/enhancements.js','utf8');
 assert.match(enhancements,/writerV101ReadingProgressRegister\(plugin\)/);
 assert.match(enhancements,/writerV107RegisterAfterStartup\(plugin\)/);
 assert.ok(!enhancements.includes("if(typeof writerV107Register==='function')writerV107Register(plugin)"));
});
