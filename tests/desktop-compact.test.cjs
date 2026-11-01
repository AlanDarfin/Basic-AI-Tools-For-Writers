'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const start=css.indexOf('/* 7.0.2 — desktop sidebar density');
const fix=start<0?'':css.slice(start);

test('desktop compactness fix is scoped away from Android and other Obsidian panes',()=>{
 assert.ok(start>=0,'Missing compact desktop CSS section');
 const rules=fix.split('body:not(.is-mobile)').length-1;
 assert.ok(rules>=10,'Desktop selectors must remain explicitly scoped');
 assert.doesNotMatch(fix,/\b(?:zoom|transform)\s*:/,'Avoid global scaling of UI');
 assert.doesNotMatch(fix,/!important/,'Do not override themes with !important');
});
test('direct vertical definition inputs have a fixed flex basis and sane heights',()=>{
 for(const selector of [
  '.writer-tool-root>.writer-tool-panel.writer-tool-panel>input[type="search"]',
  '.writer-tool-root>.writer-tool-panel.writer-tool-panel>textarea'
 ]){
  const pos=fix.indexOf(selector);
  assert.ok(pos>=0,'Missing field correction '+selector);
  const rule=fix.slice(pos,fix.indexOf('}',pos));
  assert.match(rule,/flex:0 0 auto/,'Prevent oversized flex basis in vertical panel');
  assert.match(rule,/min-height:\d+px/);
 }
});
test('desktop retains a horizontally scrolling project tab strip',()=>{
 assert.match(css,/\.writer-project-tabs\.writer-project-tabs\s*\{[\s\S]*?overflow-x:auto/);
 assert.match(fix,/writer-project-tabs\.writer-project-tabs>button/);
 assert.match(fix,/writer-project-nav-groups>button/);
});
