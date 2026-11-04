'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('src/styles/v9-2-2-iconic-fixes.css','utf8');
const compiled=fs.readFileSync('styles.css','utf8');
const patch=source.slice(source.indexOf('/* 9.4.1 —'));
test('pre-v10 icon alignment is bundled and remains in normal text flow',()=>{
 assert.ok(patch.startsWith('/* 9.4.1 —'));
 assert.match(patch,/writer-v93-title-icon-host/);
 assert.match(patch,/writer-v9-explorer-icon/);
 assert.match(patch,/transform:translateY\(-\.10em\)/);
 assert.doesNotMatch(patch,/position:absolute/);
 assert.ok(compiled.includes(patch.trimEnd()),'modular alignment CSS must be bundled');
});
test('truncated description renders its marker inline, not at the far edge',()=>{
 const last=patch.slice(patch.indexOf('.writer-v92-preview-shell:not(.is-expanded)'));
 assert.match(last,/\.writer-v931-truncated::after/);
 assert.match(last,/display:inline;/);
 assert.match(last,/position:static;/);
 assert.match(last,/background:none;/);
 assert.doesNotMatch(last,/position:absolute/);
});
