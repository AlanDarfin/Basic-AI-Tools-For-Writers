#!/usr/bin/env node
'use strict';
/* Reproducible build/check for standalone Obsidian v4 bundle. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mainPath=path.join(root,'main.js');
const sources=['core','editor','tts','unicode','toc','homework','settings'];
const begin='// BEGIN WRITER V4 MODULES\n';
const end='// END WRITER V4 MODULES';
const main=fs.readFileSync(mainPath,'utf8');
const a=main.indexOf(begin),b=main.indexOf(end,a);
if(a<0||b<0||b<a)throw Error('Missing v4 bundle markers in main.js');
const modules=sources.map(name=>{
 const filename='src/v4/'+name+'.js';
 const src=fs.readFileSync(path.join(root,filename),'utf8').replace(/^'use strict';\s*/,'');
 return '// v4 module: '+filename+'\n'+src;
}).join('\n');
const expected=main.slice(0,a+begin.length)+modules+'\n'+main.slice(b);
if(process.argv.includes('--check')){
 if(main!==expected){console.error('main.js v4 modules out of sync. Run npm run build');process.exitCode=1;}
 else console.log('v4 source and main.js are synchronized.');
}else{
 fs.writeFileSync(mainPath,expected);
 console.log('Bundled '+sources.length+' v4 modules into main.js.');
}
