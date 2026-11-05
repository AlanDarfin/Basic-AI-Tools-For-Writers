'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const build=fs.readFileSync('scripts/build-v3.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const parts=build.match(/const sources=(\[[^;]+\]);/);
assert.ok(parts,'Active source list must exist');
const active=parts[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1));
const quarantined=['v10/data-tables','v10/zotero-web','v10/study-fsrs','v10/calendar-feeds',
 'v10/story-graph','v10/editor-pro','v10/speech-accessibility','v10/media-drag-extension','v10/integrations-107'];
const required=['core','complements','variants','snapshots','workspace','final-suite','tts-online',
 'v4/editor','v4/auto-grammar','v4/cursor-memory','v5/keyshots','v6/longform-navigation',
 'v7/story-studio','v7/timeline-studio','v8/writing-calendar','v8/writing-study','v8/writing-home',
 'v9/context-toolbar','v9/smart-spaces','v9/research-style','v9/pomodoro',
 'v10/bookshelf','v10/enhancements','v10/calendar-exchange','v10/discovery','v10/startup-cleanup',
 'v10/block-dragger','v10/historical-helpers'];

test('Recovery bundle retains every pre-10.7 core and historical source',()=>{
 for(const name of required)assert.ok(active.includes(name),name+' missing from active bundle');
 assert.ok(main.includes('function writerV101RegisterEnhancements'));
 assert.ok(main.includes('writerV106HomeRegisterStartup'));
 assert.ok(main.includes('writerV1061ToolbarEditingMode'));
});
test('Advanced 10.7 source modules are restored, while startup remains deferred and isolated',()=>{
 for(const name of quarantined){
  assert.ok(active.includes(name),name+' restored into the 10.8 bundle');
  assert.ok(build.includes("'"+name+"'"),name+' must remain recoverable');
  assert.ok(fs.existsSync('src/'+name+'.js'),name+' must not be deleted');
  assert.ok(main.includes('// v3 module: src/'+name+'.js'),name+' must be in main.js');
 }
 assert.ok(main.includes('function writerV107Register(plugin)'), 'restored optional integration entrypoint missing');
 assert.ok(main.includes('function writerV107RegisterAfterStartup(plugin)'), 'deferred activation guard missing');
});
test('Legacy settings and user-controlled startup remain supported',()=>{
 const old=fs.readFileSync('src/v10/enhancements.js','utf8');
 assert.match(old,/writerV101ReadingProgressRegister\(plugin\)/);
 assert.match(old,/typeof writerV107RegisterAfterStartup==='function'/);
 const home=fs.readFileSync('src/v8/writing-home.js','utf8');
 assert.match(home,/homeCleanStart/);
});
