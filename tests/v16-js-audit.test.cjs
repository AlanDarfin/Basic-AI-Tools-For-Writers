'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {analyzeSource,buildRegions}=require('../scripts/js-v16-audit.js');
const {entries,sourceIds,legacyDictionary,validateEntries,resolveSourcePath}=require('../scripts/js-manifest.js');
const {locateBundle}=require('../scripts/js-bundle.js');
test('AST inventory separates lexical duplicates from nested functions and ignores strings/comments',()=>{
 const source="function same(){} function same(){} function outer(){function same(){}} const s='fake.addCommand({id:\"ghost\"})'; // setTimeout()\n";
 const r=analyzeSource(source);
 assert.equal(r.errors.length,0);
 assert.equal(r.repeatedTopLevelNames.length,1);
 assert.equal(r.repeatedTopLevelNames[0].name,'same');
 assert.equal(r.repeatedTopLevelNames[0].sites.length,2);
 assert.equal(r.commands.length,0);
 assert.equal(r.registrations.length,0);
});
test('prototype writes and literal command candidates have locations; dynamic IDs stay distinct',()=>{
 const r=analyzeSource("P.prototype.run=function(){};\nP.prototype['run']=function(){};\nfunction init(p){p.addCommand({id:'same'}); p.addCommand({id:'same'}); p.addCommand({id:dynamic}); const o=new MutationObserver(cb); p.registerDomEvent(document,'click',cb); setInterval(cb,1); clearInterval(1);}");
 assert.equal(r.repeatedPrototypeTargets[0].name,'P.prototype.run');
 assert.equal(r.repeatedPrototypeTargets[0].sites[1].line,2);
 assert.equal(r.repeatedLiteralCommandIds[0].name,'same');
 assert.equal(r.commands.filter(c=>c.id===null).length,1);
 assert.equal(r.lifecycleCounts['mutation-observer'],1);
 assert.equal(r.lifecycleCounts['managed-dom-event'],1);
 assert.equal(r.lifecycleCounts['interval-create'],1);
 assert.equal(r.lifecycleCounts['interval-clear'],1);
 assert.ok(r.registrations.every(s=>s.owner==='init'&&!s.topLevel));
});
test('source regions verify stable marker order after relocation and map extracted sources',()=>{
 const fixtures=[
  {id:'src/v3/core.js',path:'src/v3/core.js'},
  {id:'src/v4/editor.js',path:'src/editor/editor.js'}
 ];
 const src={
  'src/v3/core.js':"'use strict';\nfunction core(){setTimeout(cb,1);}\n",
  'src/editor/editor.js':"function editor(){clearTimeout(1);}\n",
  [legacyDictionary.path]:"function parseDictionary(text){return text;}\n"
 };
 const vendor='function writerVisualKitBuild(){setInterval(cb,1);}';
 const main='const prefix=1;\n'+src[legacyDictionary.path]+'// BEGIN WRITER V3 MODULES\n'+
  fixtures.map(({id,path})=>'// v3 module: '+id+'\n'+src[path].replace(/^'use strict';\s*/,'')+'\n').join('')+
  vendor+'\n// END WRITER V3 MODULES\n';
 const regions=buildRegions(main,fixtures,file=>src[file],vendor);
 const r=analyzeSource(main,regions);
 assert.equal(r.errors.length,0);
 assert.equal(r.lifecycleCounts['interval-create'],undefined);
 const dictionary=r.declarations.find(row=>row.name==='parseDictionary');
 assert.equal(dictionary.file,legacyDictionary.path);
 assert.equal(dictionary.line,1);
 assert.equal(dictionary.bundleLine,2);
 assert.equal(r.registrations[0].file,'src/v3/core.js');
 assert.equal(r.registrations[0].line,2);
 assert.equal(r.registrations[1].file,'src/editor/editor.js');
 assert.throws(()=>buildRegions(main,fixtures.slice().reverse(),file=>src[file],vendor),/out of sync/);
 assert.throws(()=>buildRegions(main.replace('return text','return null'),fixtures,file=>src[file],vendor),/legacy-dictionary/);
});

test('manifest rejects duplicated markers or locations and covers every bundled source',()=>{
 const core=['src/v3/core.js','core'];
 assert.throws(()=>validateEntries([core,[...core,'src/core/core.js']]),/Duplicate JS source ID/);
 assert.throws(()=>validateEntries([core,['src/v3/alternate.js','core',core[0]]]),/Duplicate JS source path/);
 assert.throws(()=>validateEntries([['src/../module.js','core']]),/Invalid JS module/);
 assert.throws(()=>validateEntries([['src/v3/core.js','unknown']]),/Invalid JS domain/);
 const main=fs.readFileSync('main.js','utf8');
 const {bodyStart,moduleEnd,legacyStart,moduleStart}=locateBundle(main);
 const markerOrder=[...main.slice(bodyStart,moduleEnd).matchAll(/^\/\/ v3 module: (src\/[^\n]+)\n/gm)].map(match=>match[1]);
 assert.deepEqual(markerOrder,sourceIds);
 assert.equal(main.slice(legacyStart,moduleStart),fs.readFileSync(legacyDictionary.path,'utf8'));
 const sourcePaths=fs.readdirSync('src',{recursive:true}).filter(file=>file.endsWith('.js'))
  .map(file=>'src/'+file.split(path.sep).join('/')).sort();
 assert.deepEqual([...entries.map(entry=>entry.path),legacyDictionary.path].sort(),sourcePaths);
});

test('prototype aliases, computed keys and deferred layout callbacks stay review candidates',()=>{
 const src="function init(p){const prototype=Menu.prototype; for(const key of ['show']){prototype[key]=wrap;} prototype.show=wrap; p.app.workspace.onLayoutReady(()=>{}); function nested(){prototype.show=restore;} function unrelated(prototype){prototype.show=other;}} function mobile(){const parent=typeof Menu!=='undefined'?Menu.prototype:null;parent.show=wrap;} function explorer(){let owner=view;owner=Object.getPrototypeOf(owner);owner.sort=adapter;}";
 const r=analyzeSource(src);
 assert.equal(r.errors.length,0);
 assert.equal(r.prototypeWrites.length,0);
 assert.equal(r.prototypeAliasSites.length,3);
 assert.equal(r.prototypeAliasWriteCandidates.length,5);
 assert.equal(r.prototypeAliasWriteCandidates[0].property,null);
 assert.ok(r.prototypeAliasWriteCandidates.some(x=>x.target==='Menu.prototype.show'));
 assert.ok(r.prototypeAliasWriteCandidates.some(x=>x.target==='Object.getPrototypeOf(?).sort'));
 assert.ok(r.prototypeAliasWriteCandidates.every(x=>x.confidence==='candidate'));
 assert.equal(r.lifecycleCounts['layout-ready'],1);
 assert.equal(r.repeatedAliasTargets.find(x=>x.name==='Menu.prototype.show').sites.length,3);
});

test('stable source IDs resolve relocated modules without changing bundle markers',()=>{
 assert.equal(resolveSourcePath('src/v10/historical-helpers.js'),'src/compat/historical-helpers.js');
 assert.ok(!fs.existsSync('src/v10/historical-helpers.js'));
 assert.ok(fs.existsSync('src/compat/historical-helpers.js'));
 assert.equal(resolveSourcePath('src/v10/zotero-web.js'),'src/integrations/zotero-web.js');
 assert.ok(!fs.existsSync('src/v10/zotero-web.js'));
 assert.ok(fs.existsSync('src/integrations/zotero-web.js'));
 assert.equal(resolveSourcePath('src/v10/calendar-feeds.js'),'src/integrations/calendar-feeds.js');
 assert.ok(!fs.existsSync('src/v10/calendar-feeds.js'));
 assert.ok(fs.existsSync('src/integrations/calendar-feeds.js'));
 for(const entry of entries)assert.equal(resolveSourcePath(entry.id),entry.path);
 assert.throws(()=>resolveSourcePath('src/unknown.js'),/Unknown JS source ID/);
});
