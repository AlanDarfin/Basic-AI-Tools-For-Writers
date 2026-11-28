'use strict';
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {entries,legacyDictionary}=require('./js-manifest.js');
const root=path.resolve(__dirname,'..');
const files=[...entries.map(entry=>entry.path),legacyDictionary.path];
for(const file of files){
 const result=spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0){console.error('Syntax check failed: '+file);process.exit(result.status||1);}
}
console.log('Syntax checked '+files.length+' authored JavaScript sources.');
