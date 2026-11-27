'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {analyzeSource,getSources,buildRegions}=require('../scripts/js-v16-audit.js');
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
test('source regions verify exact build order and exclude the vendor bundle',()=>{
 const src={'src/v3/core.js':"'use strict';\nfunction core(){setTimeout(cb,1);}\n",'src/v4/editor.js':"function editor(){clearTimeout(1);}\n"};
 const names=getSources("const sources=['core','v4/editor'];");
 const vendor='function writerVisualKitBuild(){setInterval(cb,1);}';
 const main='const prefix=1;\n// BEGIN WRITER V3 MODULES\n'+names.map(n=>'// v3 module: '+n+'\n'+src[n].replace(/^'use strict';\s*/,'')+'\n').join('')+vendor+'\n// END WRITER V3 MODULES\n';
 const regions=buildRegions(main,names,n=>src[n],vendor);
 const r=analyzeSource(main,regions);
 assert.equal(r.errors.length,0);
 assert.equal(r.lifecycleCounts['interval-create'],undefined);
 assert.equal(r.registrations[0].file,'src/v3/core.js');
 assert.equal(r.registrations[0].line,2);
 assert.equal(r.registrations[1].file,'src/v4/editor.js');
 assert.throws(()=>buildRegions(main,names.slice().reverse(),n=>src[n],vendor),/out of sync/);
 assert.throws(()=>getSources("const sources=['core','core'];"),/Invalid JS source inventory/);
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
