'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('src/styles/v13-6-home.css','utf8');
const distributed=fs.readFileSync('styles.css','utf8');
const headingSelector='body .writer-v8-home .writer-v8-home-hero .writer-v8-home-heading';
const titleSelector=headingSelector+' h2';
const iconSelector='body .writer-v8-home .writer-v8-home-heading .writer-v8-home-title-icon';

function rule(css,selector){
 const token=selector+'{';
 const start=css.indexOf(token);
 assert.ok(start>=0,'CSS selector missing: '+selector);
 const end=css.indexOf('}',start);
 return css.slice(start+token.length,end);
}

test('homepage heading and title are horizontally centered, not left aligned',()=>{
 const heading=rule(source,headingSelector);
 const title=rule(source,titleSelector);
 assert.match(heading,/flex-direction:row;/);
 assert.match(heading,/align-items:center;/);
 assert.match(heading,/justify-content:center;/);
 assert.match(heading,/text-align:center;/);
 assert.doesNotMatch(heading,/justify-content:flex-start|text-align:start/);
 assert.match(title,/text-align:center;/);
 assert.match(title,/max-width:100%;/);
 assert.match(title,/overflow-wrap:break-word;/);
 assert.match(title,/word-break:normal;/);
});

test('homepage icon aligns its SVG and custom image in the same centered slot',()=>{
 const icon=rule(source,iconSelector);
 const svg=rule(source,iconSelector+' svg');
 for(const property of ['display:flex;','align-items:center;','justify-content:center;','width:42px;','height:42px;','line-height:0;'])
  assert.ok(icon.includes(property),'Icon missing '+property);
 assert.match(svg,/display:block;/);
 assert.match(svg,/flex:0 0 auto;/);
 assert.match(svg,/width:32px;/);
 // Keep image support from the original title implementation.
 assert.match(fs.readFileSync('src/v8/writing-home.js','utf8'),/icon\.createEl\('img'/);
 assert.match(fs.readFileSync('src/styles/v9-final.css','utf8'),/\.writer-v8-home-title-icon img\{/);
});

test('narrow homepage panes stack icon above the centered title',()=>{
 assert.match(source,/@container basic-home \(max-width:560px\)\{/);
 const start=source.indexOf('@container basic-home (max-width:560px){');
 const narrow=source.slice(start,source.indexOf('/* Tablets can exceed',start));
 assert.match(rule(narrow,headingSelector),/flex-direction:column;/);
 assert.match(rule(narrow,headingSelector),/align-items:center;/);
 assert.match(rule(narrow,headingSelector),/justify-content:center;/);
 assert.match(rule(narrow,titleSelector),/width:100%;/);
});

test('physical mobile layout stays stacked even on wider tablets',()=>{
 const mobile='body.is-mobile .writer-v8-home .writer-v8-home-hero .writer-v8-home-heading';
 const ruleBody=rule(source,mobile);
 assert.match(ruleBody,/flex-direction:column;/);
 assert.match(ruleBody,/align-items:center;/);
 assert.match(ruleBody,/justify-content:center;/);
});

test('the Obsidian styles.css includes the complete modular heading fix',()=>{
 assert.ok(distributed.includes(source.trimEnd()),'Rebuild CSS with npm run build:css');
});
