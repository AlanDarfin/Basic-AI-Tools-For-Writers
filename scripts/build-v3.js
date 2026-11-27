#!/usr/bin/env node
'use strict';
/* Rebuild / verify the standalone Obsidian main.js. */
const fs=require('node:fs');
const path=require('node:path');
const {entries}=require('./js-manifest.js');
const {begin,locateBundle,readLegacyDictionary,readModule}=require('./js-bundle.js');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const mainPath=path.join(root,'main.js');
const main=read('main.js');
const {legacyStart,moduleEnd}=locateBundle(main);
const dictionary=readLegacyDictionary(read);
// Advanced optional integrations stay in the same positions in the bundle.
// Their activation is deferred by the 10.7 compatibility switch.
const modules=entries.map(entry=>readModule(entry,read).content).join('');
const builtVisualKit='vendor/visual-kit/.basic-bundle.js';
if(!fs.existsSync(path.join(root,builtVisualKit)))throw Error('Visual Kit is not compiled. Run npm run build.');
const visualKit=read(builtVisualKit).trimEnd();
const expected=main.slice(0,legacyStart)+dictionary+begin+modules+visualKit+'\n'+main.slice(moduleEnd);
if(process.argv.includes('--check')){
 if(expected!==main){console.error('main.js sources are outdated. Run node scripts/build-v3.js');process.exitCode=1;}
 else console.log('Ordered sources and bundled main.js are synchronized.');
}else{
 fs.writeFileSync(mainPath,expected);
 console.log('Rebuilt '+entries.length+' ordered modules and the legacy dictionary into main.js.');
}
