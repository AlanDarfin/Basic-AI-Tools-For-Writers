'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vendor=path.resolve(__dirname,'../vendor/visual-kit');
const esbuild=require('../vendor/visual-kit/node_modules/esbuild');
const result=esbuild.buildSync({
 absWorkingDir:vendor,entryPoints:['src/main.ts'],
 bundle:true,external:['obsidian','electron'],platform:'browser',
 format:'cjs',target:'es2022',write:false,metafile:true,minify:true,charset:'utf8',legalComments:'inline'
});
const read=file=>fs.readFileSync(file,'utf8');
const packages=new Set();
for(const input of Object.keys(result.metafile.inputs)){
 let directory=path.dirname(path.resolve(vendor,input));
 while(directory.startsWith(vendor+path.sep+'node_modules'+path.sep)){
  if(fs.existsSync(path.join(directory,'package.json'))){packages.add(directory);break;}
  directory=path.dirname(directory);
 }
}
const licenses=['Visual Kit (embedded by Basic)',read(path.join(vendor,'LICENSE'))];
for(const directory of [...packages].sort()){
 const pkg=JSON.parse(read(path.join(directory,'package.json')));
 const license=fs.readdirSync(directory).find(name=>/^(?:license|licence|copying)(?:\.(?:txt|md|markdown))?$/i.test(name));
 if(!license)throw Error('Missing bundled license for '+pkg.name);
 licenses.push(pkg.name+' '+pkg.version,read(path.join(directory,license)));
}
const banner='/*! '+licenses.join('\n\n').replaceAll('*/','* /')+'\n*/\n';
const moduleCode=banner+'function writerVisualKitBuild(){\n const module={exports:{}};\n {\n'+
 result.outputFiles[0].text+'\n }\n return module.exports.default;\n}\n';
fs.writeFileSync(path.join(vendor,'.basic-bundle.js'),moduleCode);
