'use strict';
/* v13: inventory every source, stylesheet, test, script and document.
 * Warnings are candidates for manual review, not proof that code is unused.
 * Never deletes or rewrites functionality. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),files=[],errors=[],warnings=[];
function walk(dir){
 for(const x of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','.cache'].includes(x.name))continue;
  const p=path.join(dir,x.name);
  if(x.isDirectory())walk(p);
  else if(x.isFile())files.push(path.relative(root,p).replaceAll(path.sep,'/'));
 }
}
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
walk(root);files.sort();
const ext={};let bytes=0;
for(const f of files){
 const e=path.extname(f)||'[none]';ext[e]=(ext[e]||0)+1;
 bytes+=fs.statSync(path.join(root,f)).size;
 if(/\.(?:js|cjs|css|json|ya?ml|md)$/.test(f)&&fs.statSync(path.join(root,f)).size<8000000
  &&/^(?:<<<<<<< |=======\r?$|>>>>>>> )/m.test(get(f)))
  errors.push('Unresolved merge marker: '+f);
}
const bundle=get('scripts/build-v3.js'),cssBuild=get('scripts/build-css.js'),pkg=JSON.parse(get('package.json'));
function inventory(src,re){const m=src.match(re);return m?[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]):[];}
const sources=inventory(bundle,/const sources=\[([\s\S]*?)\];/).map(s=>'src/'+(s.includes('/')?s:'v3/'+s)+'.js');
const styles=inventory(cssBuild,/const sections=\[([\s\S]*?)\];/).map(s=>'src/styles/'+s);
const tests=[...String(pkg.scripts['test:sequential']||'').matchAll(/node\s+(?:--test\s+)?(tests\/[\w.\/-]+)/g)].map(x=>x[1]);
for(const f of [...sources,...styles,...tests])if(!files.includes(f))errors.push('Missing referenced file: '+f);
for(const [label,items] of [['source',sources],['style',styles],['test',tests]]){
 const seen=new Set();for(const f of items){if(seen.has(f))errors.push('Duplicate '+label+': '+f);seen.add(f);}
}
const unbundled=files.filter(f=>/^src\/v\d+\/.*\.js$/.test(f)&&!sources.includes(f));
if(unbundled.length)warnings.push('Sources missing from build: '+unbundled.join(', '));
const unstyled=files.filter(f=>f.startsWith('src/styles/')&&f.endsWith('.css')&&!styles.includes(f));
if(unstyled.length)warnings.push('Styles missing from build: '+unstyled.join(', '));
const main=get('main.js'),css=get('styles.css');
if(!sources.includes('src/v13/ui-foundation.js')||!main.includes('// v3 module: src/v13/ui-foundation.js'))
 errors.push('UI foundation missing from generated JS');
if(!styles.includes('src/styles/v13-foundation.css')||!css.includes('Basic v13 — foundation overrides'))
 errors.push('Design tokens missing from generated CSS');
if(!main.includes('writerV13BindSettingsTabs(nav,subnav);'))
 errors.push('Settings keyboard navigation not connected');
if(!tests.includes('tests/v13-foundation.test.cjs'))errors.push('v13 tests not registered');
if(!main.includes('// BEGIN WRITER V3 MODULES')||!main.includes('// END WRITER V3 MODULES'))errors.push('JS build markers missing');
if(!css.includes('/* BEGIN V8 MODULAR STYLES */')||!css.includes('/* END V8 MODULAR STYLES */'))errors.push('CSS build markers missing');
const selectors=new Map();
for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
 const key=m[1].replace(/\/\*[\s\S]*?\*\//g,'').trim().replace(/\s+/g,' ');
 if(key&&!key.startsWith('@'))selectors.set(key,(selectors.get(key)||0)+1);
}
const repeated=[...selectors].filter(([,count])=>count>1).sort((a,b)=>b[1]-a[1]);
console.log(JSON.stringify({
 auditedFiles:files.length,bytes,fileTypes:ext,sourceModules:sources.length,
 styleModules:styles.length,registeredTests:tests.length,
 repeatedCssSelectors:repeated.length,topRepeatedSelectors:repeated.slice(0,10),
 errors,warnings
},null,2));
if(process.argv.includes('--check')&&errors.length)process.exitCode=1;
