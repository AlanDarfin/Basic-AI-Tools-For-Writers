#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'projects.js'),'utf8');
const mainFile=path.join(root,'main.js');
const main=fs.readFileSync(mainFile,'utf8');
const begin="const PROJECT_VIEW='basic-ai-projects';";
const end='class DictionaryView extends ItemView{';
const first=main.indexOf(begin),last=main.indexOf(end,first);
if(first<0||last<0)throw Error('Project manager markers not found in main.js');
const start=source.indexOf(begin),stop=source.lastIndexOf('module.exports=');
if(start<0||stop<0)throw Error('Project manager exports not found in projects.js');
const expected=main.slice(0,first)+source.slice(start,stop)+main.slice(last);
if(process.argv.includes('--check')){
 if(main!==expected){console.error('main.js project code is out of sync: run node scripts/sync-projects.js');process.exitCode=1;}
 else console.log('Project source and main.js are in sync');
}else{
 fs.writeFileSync(mainFile,expected);
 console.log('Updated inlined projects.js in main.js');
}
