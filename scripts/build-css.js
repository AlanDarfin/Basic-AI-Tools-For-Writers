#!/usr/bin/env node
'use strict';
// Keep source styles modular while shipping Obsidian's single styles.css.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const cssPath=path.join(root,'styles.css');
const sections=['v8-navigation.css','v8-review-mobile.css'];
const begin='/* BEGIN V8 MODULAR STYLES */';
const end='/* END V8 MODULAR STYLES */';
const actual=fs.readFileSync(cssPath,'utf8');
const i=actual.indexOf(begin);
const original=(i>=0?actual.slice(0,i):actual).trimEnd();
const append=sections.map(name=>fs.readFileSync(path.join(root,'src/styles',name),'utf8').trimEnd()).join('\n\n');
const expected=original+'\n\n'+begin+'\n'+append+'\n'+end+'\n';
if(process.argv.includes('--check')){
 if(actual!==expected){console.error('styles.css is out of sync. Run npm run build:css');process.exitCode=1;}
 else console.log('styles.css matches its modular sources.');
}else{
 fs.writeFileSync(cssPath,expected);
 console.log('Built Obsidian styles.css from '+sections.length+' v8 style modules.');
}
