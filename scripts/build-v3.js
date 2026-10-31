#!/usr/bin/env node
'use strict';
/* Rebuild / verify the standalone Obsidian main.js from modular local v3 sources. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mainPath=path.join(root,'main.js');
const sources=['core','complements','variants','snapshots','workspace','final-suite','tts-online','v4/editor','v4/integrations','v4/auto-grammar','v4/modules','v4/cursor-memory','v5/keyshots','v5/extended-syntax','v5/pandoc-syntax','v5/pandoc-export','v5/easy-typing','v5/easy-advanced','v5/smart-typography','v5/workspace-ux','v5/project-metadata','v6/foundation','v6/reading','v6/markup','v6/linter','v6/longform-navigation'];
const begin='// BEGIN WRITER V3 MODULES\n';
const end='// END WRITER V3 MODULES';
let main=fs.readFileSync(mainPath,'utf8');
let a=main.indexOf(begin),b=main.indexOf(end,a);
if(a<0||b<0||b<a)throw Error('Missing v3 bundle markers in main.js');
const modules=sources.map(name=>{
 const filename=(name.startsWith('v4/')||name.startsWith('v5/')||name.startsWith('v6/'))?'src/'+name+'.js':'src/v3/'+name+'.js';
 const source=fs.readFileSync(path.join(root,filename),'utf8').replace(/^'use strict';\s*/,'');
 return '// v3 module: '+filename+'\n'+source;
}).join('\n');
const expected=main.slice(0,a+begin.length)+modules+'\n'+main.slice(b);
if(process.argv.includes('--check')){
 if(expected!==main){console.error('main.js v3 modules are outdated. Run node scripts/build-v3.js');process.exitCode=1;}
 else console.log('v3 source and bundled main.js are synchronized.');
}else{
 fs.writeFileSync(mainPath,expected);
 console.log('Rebuilt '+sources.length+' modules into main.js.');
}
