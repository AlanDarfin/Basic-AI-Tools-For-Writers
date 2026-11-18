'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const main=fs.readFileSync('main.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const project=fs.readFileSync('projects.js','utf8');
const vm=require('node:vm');

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
test('settings use named icon tabs on both rows and reveal an offscreen active tab locally',()=>{
 const settings=main.slice(main.indexOf('class DictionarySettings extends PluginSettingTab'),main.indexOf('module.exports=class AlansOfflineDictionary'));
 assert.match(settings,/dictionary-settings-tabs writer-sidebar-tabs/);
 assert.match(settings,/dictionary-settings-subtabs writer-sidebar-tabs/);
 assert.match(settings,/writerSidebarButtonIcon\(b,sectionIcons\[key\]/);
 assert.match(settings,/writerSidebarButtonIcon\(b,groupIcons\[id\]/);
 assert.doesNotMatch(settings,/groupPicker|sectionPicker/);
 const reveal=vm.runInNewContext(fs.readFileSync('src/v13/ui-foundation.js','utf8')+'\nwriterSidebarRevealSelected');
 let tab={left:230,right:295},scrolls=0;
 const row={scrollWidth:600,clientWidth:260,scrollLeft:100,getBoundingClientRect:()=>({left:0,right:260}),
  querySelector:()=>({getBoundingClientRect:()=>tab,scrollIntoView(){scrolls++;}})};
 reveal(row);assert.equal(row.scrollLeft,135);
 tab={left:-20,right:45};reveal(row);assert.equal(row.scrollLeft,115);
 assert.equal(scrolls,0,'Revealing a tab must not scroll the settings modal');
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
 assert.match(project,/void this\.renderProjectPanel\(panels,project,isPanelCurrent,id\)/);
 assert.match(project,/async renderProjectPanel\(/);
 const body=project.slice(project.indexOf('const switchTab=id=>'),project.indexOf('const fillTabs=group=>'));
 assert.doesNotMatch(body,/this\.render\(/);
});
