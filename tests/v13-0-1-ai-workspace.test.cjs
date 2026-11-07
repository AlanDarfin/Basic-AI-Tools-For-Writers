'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const main=fs.readFileSync('main.js','utf8');
const css=fs.readFileSync('src/styles/v13-foundation.css','utf8');
const from=main.indexOf('function writerV131RenderAISettings(');
const to=main.indexOf('class DictionarySettings extends PluginSettingTab',from);
const source=main.slice(from,to);

test('models and provider routes are preserved and share a compact workspace',()=>{
 assert.ok(from>0&&to>from,'AI settings renderer is registered');
 assert.match(main,/else if\(id==='providers'\)\{\s*writerV131RenderAISettings\(this\.plugin,panel,'providers'\)/);
 assert.match(main,/else if\(id==='models'\)\{\s*writerV131RenderAISettings\(this\.plugin,panel,'models'\)/);
 assert.match(source,/writer-v131-ai-workspace/);
 assert.match(css,/writer-v131-ai-catalog/);
 assert.match(css,/@container basic-settings \(max-width:540px\)/);
});
test('saved keys and models are never removed during settings display',()=>{
 assert.match(source,/cfg\.aiKeys\|\|typeof cfg\.aiKeys/);
 assert.match(source,/cfg\.aiModels\|\|typeof cfg\.aiModels/);
 assert.match(source,/entry\.type='password'/);
 assert.match(source,/entry\.autocomplete='off'/);
 assert.match(source,/entry\.addEventListener\('change'/);
 assert.match(source,/window\.confirm/);
 assert.doesNotMatch(source,/localStorage|sessionStorage|clipboard\.writeText/);
});
test('network testing and model discovery require explicit user clicks',()=>{
 assert.match(source,/connect\.addEventListener\('click',async\(\)=>\{/);
 assert.match(source,/fetch\.addEventListener\('click',async\(\)=>\{/);
 assert.match(source,/await plugin\.testProvider\(id\)/);
 assert.match(source,/await plugin\.fetchModels\(id\)/);
 assert.match(source,/new Set\(result\.filter/);
 assert.match(source,/search\.addEventListener\('input',refreshModels\)/);
 assert.match(source,/selection\.addEventListener\('change',async\(\)=>\{/);
 assert.match(source,/role:'status','aria-live':'polite'/);
});
test('provider use-case shortcuts never replace key or model maps',()=>{
 assert.match(source,/\['provider',label\(/);
 assert.match(source,/\['translationProvider',label\(/);
 assert.match(source,/\['assistantProvider',label\(/);
 assert.match(source,/cfg\[field\]=id;await save\(\);render\(\)/);
});
