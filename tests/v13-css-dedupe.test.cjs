'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pruneDuplicateDeclarations:prune}=require('../scripts/css-v13-dedupe.js');

test('removes only the older identical declaration from the same selector and context',()=>{
 const css='.card{color:var(--text-normal);padding:4px} .card{color:var(--text-normal);gap:8px}';
 const result=prune(css);
 assert.equal(result.removed,1);
 assert.equal(result.selectors,1);
 assert.match(result.css,/\.card\{padding:4px\}/);
 assert.match(result.css,/\.card\{color:var\(--text-normal\);gap:8px\}/);
 assert.equal(prune(result.css).removed,0);
});
test('protects media-specific overrides, nested conditional rules and keyframes',()=>{
 const css=[
  '.card{color:red}',
  '@media(max-width:720px){.card{color:red}}',
  '@media(min-width:721px){.card{color:red}}',
  '@supports(display:grid){.card{color:blue}}',
  '@supports(display:flex){.card{color:blue}}',
  '@keyframes pulse{from{opacity:0}to{opacity:0}}',
 ].join('\n');
 assert.equal(prune(css).removed,0);
 assert.equal(prune(css).css,css);
});
test('preserves differing cascade overrides, fallbacks and same-block declarations',()=>{
 const css='.card{background:#fff;background:var(--background-primary)}'+
  '.card{background:var(--background-secondary)}'+
  '.card{color:red}.card{color:blue}';
 const result=prune(css);
 assert.equal(result.removed,0);
 assert.equal(result.css,css);
});
test('preserves comments, complex CSS strings, and intentional themes',()=>{
 const css='.card{content:"a;b";color:red}'+
  '/* this comment must survive */'+
  '.card{color:red}'+
  '@media(prefers-color-scheme:dark){.card{color:red}}';
 const result=prune(css);
 assert.equal(result.removed,1);
 assert.ok(result.css.includes('/* this comment must survive */'));
 assert.ok(result.css.includes('content:"a;b"'));
 assert.ok(result.css.includes('@media(prefers-color-scheme:dark){.card{color:red}}'));
});
test('shipping stylesheet has no further automatically provable redundancies',()=>{
 const css=fs.readFileSync('styles.css','utf8');
 assert.equal(prune(css).removed,0);
 assert.match(css,/Basic v13 — foundation overrides/);
 assert.match(css,/writer-v95-timeline/);
 assert.match(css,/writer-v1205-native-surfing-host/);
 assert.match(css,/body\.is-mobile/);
});
