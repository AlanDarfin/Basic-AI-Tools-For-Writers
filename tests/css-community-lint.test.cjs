'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const main=fs.readFileSync('main.js','utf8');
test('Obsidian community CSS warnings are absent',()=>{
 assert.doesNotMatch(css,/:has\s*\(/);
 assert.doesNotMatch(css,/!important\b/);
 assert.doesNotMatch(css,/text-decoration-(?:line|style|color|thickness)\s*:/);
 assert.doesNotMatch(css,/text-decoration\s*:\s*underline\s+dotted/);
 assert.doesNotMatch(css,/column-gap\s*:/);
});
test('compact mobile layout uses runtime classes',()=>{
 assert.match(css,/\.setting-item\.writer-setting-toggle/);
 assert.match(css,/\.setting-item\.writer-setting-textarea/);
 assert.match(main,/function writerMarkCompactSettings\(/);
 assert.match(main,/writerMarkCompactSettings\(panel\)/);
});
test('4.1.1 release metadata matches without v prefix',()=>{
 const m=require('../manifest.json'),p=require('../package.json'),v=require('../versions.json');
 assert.equal(m.version,'4.1.1');
 assert.equal(p.version,m.version);
 assert.equal(v[m.version],m.minAppVersion);
});
