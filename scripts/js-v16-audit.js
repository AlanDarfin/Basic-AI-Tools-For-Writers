'use strict';
// Read-only V16 audit. Syntax-aware candidates, not proof of bugs or dead code.
// Reuse the pinned development parser installed by the existing Visual Kit build.
const fs=require('node:fs'),path=require('node:path');
const ts=require('../vendor/visual-kit/node_modules/typescript');
const root=path.resolve(__dirname,'..');
const {entries,sourceIds,legacyDictionary}=require('./js-manifest.js');
const {locateBundle,readLegacyDictionary,readModule}=require('./js-bundle.js');
const lifecycle=new Map([
 ['register','managed-registration'],['registerEvent','managed-event'],['registerDomEvent','managed-dom-event'],
 ['registerInterval','managed-interval'],['registerEditorExtension','editor-extension'],
 ['registerMarkdownCodeBlockProcessor','block-processor'],['registerMarkdownPostProcessor','post-processor'],
 ['registerView','view-registration'],['addRibbonIcon','ribbon'],['addStatusBarItem','status'],
 ['addEventListener','listener-add'],['removeEventListener','listener-remove'],
 ['setTimeout','timeout-create'],['clearTimeout','timeout-clear'],['setInterval','interval-create'],['clearInterval','interval-clear'],
 ['requestAnimationFrame','frame-create'],['cancelAnimationFrame','frame-cancel'],
 ['MutationObserver','mutation-observer'],['ResizeObserver','resize-observer'],['IntersectionObserver','intersection-observer'],
 ['observe','observer-candidate'],['disconnect','disconnect-candidate'],['on','event-subscribe-candidate'],['off','event-unsubscribe-candidate'],
 ['addCommand','command'],['removeCommand','command-remove'],['loadData','data-load'],['saveData','data-save'],['saveSettings','settings-save'],
 ['AbortController','abort-controller'],['abort','abort-candidate'],['onLayoutReady','layout-ready']
]);
// Static review candidates: these calls may be cheap or necessary in context.
// Counts are call sites, not measured runtime costs or proof of a leak.
const performanceCalls=new Map([
 ['getMarkdownFiles','vault-markdown-scan'],['getFiles','vault-file-scan'],['getAllLoadedFiles','vault-tree-scan'],
 ['cachedRead','vault-cached-read'],['getFileCache','metadata-cache-read'],['getLeavesOfType','workspace-leaf-query'],
 ['querySelectorAll','dom-query-all'],['querySelector','dom-query'],['getBoundingClientRect','layout-geometry-read'],
 ['getComputedStyle','layout-style-read'],['requestAnimationFrame','frame-schedule'],
 ['requestUrl','network-request'],['fetch','network-request']
]);
function performanceKind(target){
 const name=target?.split('.').pop();
 // Ignore unqualified generic names except browser/Obsidian global APIs.
 if(!target||(!target.includes('.')&&!['getComputedStyle','requestAnimationFrame','requestUrl','fetch'].includes(name)))return null;
 return performanceCalls.get(name)||null;
}
function member(node){
 if(!node)return null;
 if(ts.isIdentifier(node))return node.text;
 if(node.kind===ts.SyntaxKind.ThisKeyword)return 'this';
 if(ts.isPropertyAccessExpression(node)){
  const left=member(node.expression);return left?left+'.'+node.name.text:null;
 }
 if(ts.isElementAccessExpression(node)&&node.argumentExpression&&ts.isStringLiteralLike(node.argumentExpression)){
  const left=member(node.expression);return left?left+'.'+node.argumentExpression.text:null;
 }
 return null;
}
function literalCommandId(node){
 const obj=node.arguments?.[0];if(!obj||!ts.isObjectLiteralExpression(obj))return null;
 const id=obj.properties.find(p=>ts.isPropertyAssignment(p)&&(ts.isIdentifier(p.name)||ts.isStringLiteralLike(p.name))&&p.name.text==='id');
 return id&&ts.isStringLiteralLike(id.initializer)?id.initializer.text:null;
}
function group(rows,key){
 const groups=new Map();for(const r of rows){const k=r[key];if(k==null)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 return [...groups].filter(([,items])=>items.length>1).map(([name,sites])=>({name,sites}));
}
// Conservative function-scope inventory: records possible aliases, not data-flow proof.
// Multiple bindings/assignments or shadowing may make a candidate ambiguous.
function prototypeOrigin(node){
 if(!node)return null;
 const direct=member(node);
 if(direct?.endsWith('.prototype'))return direct;
 if(ts.isConditionalExpression(node)){
  const a=prototypeOrigin(node.whenTrue),b=prototypeOrigin(node.whenFalse);
  return a&&b&&a!==b?null:a||b;
 }
 if(ts.isParenthesizedExpression(node))return prototypeOrigin(node.expression);
 if(ts.isCallExpression(node)&&member(node.expression)==='Object.getPrototypeOf')return 'Object.getPrototypeOf(?)';
 return null;
}
function functionScope(node,sf){
 for(let p=node.parent;p;p=p.parent)if(ts.isFunctionLike(p))return p;
 return sf;
}
function aliasWriteInventory(sf,source,regions,loc){
 const scopes=new Map(),writes=[];
 const included=node=>{const p=node.getStart(sf),r=regions.find(r=>p>=r.start&&p<r.end);return r&&!r.exclude;};
 function scopeMap(scope){if(!scopes.has(scope))scopes.set(scope,new Map());return scopes.get(scope);}
 function binding(scope,name,origin,node){
  const m=scopeMap(scope);if(!m.has(name))m.set(name,[]);
  m.get(name).push({origin,node});
 }
 function walk(node){
  if(!included(node)&&regions.some(r=>r.exclude&&node.getStart(sf)>=r.start&&node.end<=r.end))return;
  if(included(node)){
   const scope=functionScope(node,sf);
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name))
    binding(scope,node.name.text,prototypeOrigin(node.initializer),node);
   if(ts.isParameter(node)&&ts.isIdentifier(node.name))binding(scope,node.name.text,null,node);
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment){
    if(ts.isIdentifier(node.left))binding(scope,node.left.text,prototypeOrigin(node.right),node);
    else if(ts.isPropertyAccessExpression(node.left)||ts.isElementAccessExpression(node.left))writes.push(node);
   }
  }
  ts.forEachChild(node,walk);
 }
 ts.forEachChild(sf,walk);
 const aliases=[],candidates=[];
 for(const [scope,m] of scopes)for(const [name,records] of m)for(const r of records)if(r.origin){
  const site=loc(r.node,scope===sf?null:scope.name?.getText(sf)||'(anonymous)');
  if(site)aliases.push({alias:name,origin:r.origin,...site});
 }
 for(const node of writes){
  const lhs=node.left,base=lhs.expression;if(!ts.isIdentifier(base))continue;
  let scope=functionScope(node,sf),records;
  for(;;){records=scopes.get(scope)?.get(base.text);if(records||scope===sf)break;scope=functionScope(scope,sf);}
  if(!records)continue;
  const origins=[...new Set(records.map(r=>r.origin).filter(Boolean))];
  if(!origins.length)continue;
  const prop=ts.isPropertyAccessExpression(lhs)?lhs.name.text:ts.isStringLiteralLike(lhs.argumentExpression)?lhs.argumentExpression.text:null;
  const owner=functionScope(node,sf),site=loc(node,owner===sf?null:owner.name?.getText(sf)||'(anonymous)');
  if(site)candidates.push({alias:base.text,origins,property:prop,expression:lhs.getText(sf),target:origins.length===1&&prop?origins[0]+'.'+prop:null,confidence:'candidate',...site});
 }
 return {aliases,candidates};
}
function analyzeSource(source,regions=[{start:0,end:source.length,file:'main.js',lineOffset:0}]){
 const sf=ts.createSourceFile('main.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const declarations=[],prototypeWrites=[],registrations=[],commands=[],modules=new Map();
 const performanceSites=[],functionBodies=new Map();
 const errors=sf.parseDiagnostics.map(d=>({line:sf.getLineAndCharacterOfPosition(d.start||0).line+1,message:ts.flattenDiagnosticMessageText(d.messageText,' ')}));
 const findRegion=pos=>regions.find(r=>pos>=r.start&&pos<r.end);
 function loc(node,owner){
  const pos=node.getStart(sf),r=findRegion(pos);if(!r||r.exclude)return null;
  const line=sf.getLineAndCharacterOfPosition(pos).line+1;
  return {file:r.file,line:line-sf.getLineAndCharacterOfPosition(r.start).line+(r.lineOffset||0),bundleLine:line,owner:owner||null};
 }
 function visit(node,owner=null,depth=0){
  const pos=node.getStart(sf),region=findRegion(pos);
  if(region?.exclude&&node.end<=region.end)return;
  const site=loc(node,owner);
  if(site){
   if(!modules.has(site.file))modules.set(site.file,{file:site.file,topLevelDeclarations:0,prototypeWrites:0,lifecycleSites:0,commandSites:0});
   const stats=modules.get(site.file);
   if(node.parent===sf&&(ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name){
    declarations.push({name:node.name.text,kind:ts.isFunctionDeclaration(node)?'function':'class',...site});stats.topLevelDeclarations++;
    if(ts.isFunctionDeclaration(node)&&node.body){
     // Exact source-body comparison deliberately avoids claiming semantic equivalence.
     const body=node.body.getText(sf);
     if(body.length>=120){
      if(!functionBodies.has(body))functionBodies.set(body,[]);
      functionBodies.get(body).push({name:node.name.text,...site});
     }
    }
   }
   if(ts.isVariableDeclaration(node)&&node.parent?.parent?.parent===sf&&ts.isIdentifier(node.name)){
    declarations.push({name:node.name.text,kind:'variable',...site});stats.topLevelDeclarations++;
   }
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment){
    const target=member(node.left);if(target?.includes('.prototype.')){
     prototypeWrites.push({target,operator:node.operatorToken.getText(sf),...site});stats.prototypeWrites++;
    }
   }
   if(ts.isCallExpression(node)||ts.isNewExpression(node)){
    const target=member(node.expression),name=target?.split('.').pop(),kind=lifecycle.get(name);
    if(ts.isCallExpression(node)){
     const candidate=performanceKind(target);
     if(candidate)performanceSites.push({kind:candidate,target,...site});
    }
    if(kind){
     registrations.push({kind,target,topLevel:depth===0,...site});stats.lifecycleSites++;
     if(kind==='command'){commands.push({id:literalCommandId(node),target,...site});stats.commandSites++;}
    }
   }
  }
  let nextOwner=owner,nextDepth=depth;
  if(ts.isFunctionLike(node)){
   nextDepth++;nextOwner=node.name?.getText(sf)|| (ts.isVariableDeclaration(node.parent)&&ts.isIdentifier(node.parent.name)?node.parent.name.text:ts.isBinaryExpression(node.parent)?member(node.parent.left):null)||owner||'(anonymous)';
  }
  ts.forEachChild(node,child=>visit(child,nextOwner,nextDepth));
 }
 ts.forEachChild(sf,node=>visit(node));
 const aliasInventory=aliasWriteInventory(sf,source,regions,loc);
 const lifecycleCounts={};for(const row of registrations)lifecycleCounts[row.kind]=(lifecycleCounts[row.kind]||0)+1;
 const performanceCounts={},performanceModules=new Map();
 for(const row of performanceSites){
  performanceCounts[row.kind]=(performanceCounts[row.kind]||0)+1;
  if(!performanceModules.has(row.file))performanceModules.set(row.file,{file:row.file,total:0,kinds:{}});
  const item=performanceModules.get(row.file);item.total++;item.kinds[row.kind]=(item.kinds[row.kind]||0)+1;
 }
 const duplicateFunctionBodies=[...functionBodies].filter(([,sites])=>sites.length>1)
  .map(([body,sites])=>({bodyLength:body.length,sites}));
 return {errors,performanceSites,performanceCounts,performanceModules:[...performanceModules.values()],duplicateFunctionBodies,modules:[...modules.values()],declarations,prototypeWrites,registrations,commands,
  prototypeAliasSites:aliasInventory.aliases,prototypeAliasWriteCandidates:aliasInventory.candidates,
  repeatedAliasTargets:group(aliasInventory.candidates,'target'),
  repeatedTopLevelNames:group(declarations,'name'),repeatedPrototypeTargets:group(prototypeWrites,'target'),
  repeatedLiteralCommandIds:group(commands,'id'),lifecycleCounts};
}
function buildRegions(main,orderedEntries,read,vendor){
 const {legacyStart,moduleStart,bodyStart,moduleEnd}=locateBundle(main);
 if(main.slice(legacyStart,moduleStart)!==readLegacyDictionary(read))
  throw Error('JS source out of sync: '+legacyDictionary.path);
 const regions=[
  {start:0,end:legacyStart,file:'main.js (legacy prefix)',lineOffset:0},
  {start:legacyStart,end:moduleStart,file:legacyDictionary.path,lineOffset:0}
 ];
 let cursor=bodyStart;
 for(const entry of orderedEntries){
  const {body,header,lineOffset,content}=readModule(entry,read);
  if(!main.startsWith(content,cursor))throw Error('JS source out of sync: '+entry.path);
  const start=cursor+header.length;
  regions.push({start,end:start+body.length,file:entry.path,lineOffset});
  cursor+=content.length;
 }
 const compiled=vendor.trimEnd()+'\n';
 if(cursor+compiled.length!==moduleEnd||!main.startsWith(compiled,cursor))throw Error('Visual Kit bundle out of sync');
 regions.push({start:cursor,end:moduleEnd,file:'vendor/visual-kit/.basic-bundle.js',exclude:true});
 regions.push({start:moduleEnd,end:main.length,file:'main.js (legacy suffix)',lineOffset:0});
 return regions;
}
function auditRepository(){
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const main=read('main.js');
 const regions=buildRegions(main,entries,read,read('vendor/visual-kit/.basic-bundle.js'));
 const result=analyzeSource(main,regions);
 const sources=entries.map(entry=>entry.path);
 return {...result,sourceModules:entries.length,sourceBytes:sources.reduce((n,file)=>n+Buffer.byteLength(read(file)),0),bundleBytes:Buffer.byteLength(main),
  sourceOrder:sourceIds,sourceEntries:entries,extractedLegacySources:[legacyDictionary.path],
  generatedSources:[entries.find(entry=>entry.id==='src/v13/settings-search-index.js').path,'vendor/visual-kit/.basic-bundle.js']};
}
function summarize(r){
 return {sourceModules:r.sourceModules,sourceBytes:r.sourceBytes,bundleBytes:r.bundleBytes,syntaxErrors:r.errors,
  topLevelDeclarations:r.declarations.length,repeatedTopLevelNames:r.repeatedTopLevelNames.length,
  prototypeWrites:r.prototypeWrites.length,repeatedPrototypeTargets:r.repeatedPrototypeTargets.length,
  commandSites:r.commands.length,dynamicCommandIds:r.commands.filter(c=>c.id===null).length,repeatedLiteralCommandIds:r.repeatedLiteralCommandIds.length,
  lifecycleSites:r.registrations.length,lifecycleCounts:r.lifecycleCounts,
  prototypeAliasSites:r.prototypeAliasSites.length,prototypeAliasWriteCandidates:r.prototypeAliasWriteCandidates.length,
  repeatedAliasTargets:r.repeatedAliasTargets.length,
  topAliasCandidates:r.prototypeAliasWriteCandidates.filter(s=>s.origins.some(o=>o==='Menu.prototype')).slice(0,20),
  layoutReadySites:r.registrations.filter(s=>s.kind==='layout-ready'),
  topLifecycleModules:r.modules.slice().sort((a,b)=>b.lifecycleSites-a.lifecycleSites).slice(0,12),
  topPrototypeCandidates:r.repeatedPrototypeTargets.slice().sort((a,b)=>b.sites.length-a.sites.length).slice(0,10),
  topCommandCandidates:r.repeatedLiteralCommandIds.slice(0,10),
  performanceSites:r.performanceSites.length,performanceCounts:r.performanceCounts,
  topPerformanceModules:r.performanceModules.slice().sort((a,b)=>b.total-a.total||a.file.localeCompare(b.file)).slice(0,15),
  duplicateFunctionBodyGroups:r.duplicateFunctionBodies.length,
  duplicateFunctionBodyCandidates:r.duplicateFunctionBodies.slice(0,15)};
}
if(require.main===module){
 try{const r=auditRepository();console.log(JSON.stringify(process.argv.includes('--json')?r:summarize(r),null,2));if(r.errors.length)process.exitCode=1;}
 catch(error){console.error('V16 JS audit: '+error.message);process.exitCode=1;}
}
module.exports={analyzeSource,buildRegions,auditRepository,summarize};
