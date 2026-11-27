'use strict';
const {legacyDictionary}=require('./js-manifest.js');
const begin='// BEGIN WRITER V3 MODULES\n';
const end='// END WRITER V3 MODULES';

function locateBundle(main){
 const moduleStart=main.indexOf(begin);
 const bodyStart=moduleStart+begin.length;
 const moduleEnd=main.indexOf(end,bodyStart);
 if(moduleStart<0||moduleEnd<0)throw Error('Missing v3 bundle markers in main.js');
 const legacyStart=main.lastIndexOf('\n'+legacyDictionary.anchor,moduleStart)+1;
 if(!legacyStart)throw Error('Missing legacy dictionary boundary in main.js');
 return {legacyStart,moduleStart,bodyStart,moduleEnd};
}

function readLegacyDictionary(read){
 const source=read(legacyDictionary.path);
 if(!source.startsWith(legacyDictionary.anchor)||!source.endsWith('\n')||source.includes(begin))
  throw Error('Invalid legacy dictionary source boundary: '+legacyDictionary.path);
 return source;
}

function readModule(entry,read){
 const raw=read(entry.path);
 const body=raw.replace(/^'use strict';\s*/,'');
 const header='// v3 module: '+entry.id+'\n';
 const lineOffset=(raw.slice(0,raw.length-body.length).match(/\n/g)||[]).length;
 return {body,header,lineOffset,content:header+body+'\n'};
}
module.exports={begin,locateBundle,readLegacyDictionary,readModule};
