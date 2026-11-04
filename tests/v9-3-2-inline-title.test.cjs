'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');

test('native icon remains part of first title line, not absolutely positioned at mobile title box top',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 const section=css.slice(css.indexOf('/* 9.3.2 — Place note icons'),css.indexOf('/* Folder Note previews are the YAML description'));
 assert.ok(section.includes('.inline-title.writer-v93-title-icon-host'));
 assert.match(section,/padding-inline-start:0/);
 assert.match(section,/position:static/);
 assert.match(section,/vertical-align:-\.13em/);
 assert.match(section,/color:inherit/);
 assert.match(section,/stroke:currentColor/);
 assert.doesNotMatch(section,/position:absolute/);
 assert.doesNotMatch(section,/padding-inline-start:1\.38em/);
});

test('explorer title glyphs take precedence over YAML glyphs and remain decorative',()=>{
 const explorer=read('src/v9/native-explorer.js');
 const pretty=read('src/v9/pretty-properties.js');
 assert.match(explorer,/if\(icon\)title\.querySelector\(':scope > \.writer-v9215-pretty-icon'\)\?\.remove\(\)/);
 assert.match(explorer,/node\.setAttribute\('contenteditable','false'\)/);
 assert.match(pretty,/span\.setAttribute\('contenteditable','false'\)/);
 assert.match(explorer,/writer-v93-title-icon-host/);
});

test('unloading iterates all markdown panes and removes only Basic decorations',()=>{
 const source=read('src/v9/native-explorer.js');
 assert.match(source,/for\(const leaf of plugin\.app\.workspace\.getLeavesOfType\?\.\('markdown'\)\|\|\[\]\)\{/);
 assert.match(source,/writer-v9-inline-title-icon'\)\.forEach\(el=>el\.remove\(\)\)/);
 assert.match(source,/if\(!title\.querySelector\(':scope > \.writer-v9215-pretty-icon'\)\)/);
 assert.doesNotMatch(source,/removeAttribute\('contenteditable'\)/);
});
