'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const main=fs.readFileSync('main.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const project=fs.readFileSync('projects.js','utf8');

test('settings main and secondary tabs both support vertical wheel to horizontal scroll',()=>{
 const settings=main.slice(main.indexOf('class DictionarySettings extends PluginSettingTab'),main.indexOf('module.exports=class AlansOfflineDictionary'));
 assert.match(settings,/bindHorizontalWheel\(nav\)/);
 assert.match(settings,/bindHorizontalWheel\(subnav\)/);
 assert.match(settings,/row\.scrollLeft\+=event\.deltaY/);
 assert.match(settings,/event\.preventDefault\(\)/);
 assert.match(settings,/nav\.scrollLeft=Math\.max\(0,this\.settingsTabsScrollLeft\|\|0\)/);
});
test('switching within a settings group leaves the second tab row mounted',()=>{
 const settings=main.slice(main.indexOf('class DictionarySettings extends PluginSettingTab'),main.indexOf('module.exports=class AlansOfflineDictionary'));
 assert.match(settings,/if\(subnav\.dataset\.group!==group\)/);
 assert.match(settings,/else\{\s*\/\/ Never recreate this horizontal strip/);
 assert.match(settings,/this\.settingsSubtabsScrollLeft\[group\]/);
 assert.match(settings,/this\.settingsSubtabsScrollLeft\[previousSubnav\.dataset\.group\]/);
});
test('navigation strips avoid scroll snapping and animated jumps',()=>{
 const section=css.slice(css.lastIndexOf('/* 7.0.4 — stable horizontal navigation'));
 assert.ok(section.startsWith('/* 7.0.4'),'Missing scoped navigation fix');
 for(const selector of ['.writer-project-tabs.writer-project-tabs','.dictionary-settings-tabs.dictionary-settings-tabs','.dictionary-settings-subtabs.dictionary-settings-subtabs'])
  assert.ok(section.includes(selector),selector);
 assert.match(section,/scroll-behavior:auto/);
 assert.match(section,/scroll-snap-type:none/);
 assert.doesNotMatch(section,/!important/);
});
test('Longform tab changes rerender only the selected panel, not the complete root',()=>{
 assert.match(project,/const switchTab=id=>/);
 assert.match(project,/void this\.renderProjectPanel\(panels,project,\+\+this\.renderToken,id\)/);
 assert.match(project,/async renderProjectPanel\(/);
 const body=project.slice(project.indexOf('const switchTab=id=>'),project.indexOf('const fillTabs=group=>'));
 assert.doesNotMatch(body,/this\.render\(/);
});
