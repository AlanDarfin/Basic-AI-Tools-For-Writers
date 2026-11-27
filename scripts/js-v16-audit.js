'use strict';
// Read-only V16 audit. Syntax-aware candidates, not proof of bugs or dead code.
// Reuse the pinned development parser installed by the existing Visual Kit build.
const fs=require('node:fs'),path=require('node:path');
const ts=require('../vendor/visual-kit/node_modules/typescript');
const root=path.resolve(__dirname,'..');
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
 ['AbortController','abort-controller'],['abort','abort-candidate']
]);
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
function analyzeSource(source,regions=[{start:0,end:source.length,file:'main.js',lineOffset:0}]){
 const sf=ts.createSourceFile('main.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const declarations=[],prototypeWrites=[],registrations=[],commands=[],modules=new Map();
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
 const lifecycleCounts={};for(const row of registrations)lifecycleCounts[row.kind]=(lifecycleCounts[row.kind]||0)+1;
 return {errors,modules:[...modules.values()],declarations,prototypeWrites,registrations,commands,
  repeatedTopLevelNames:group(declarations,'name'),repeatedPrototypeTargets:group(prototypeWrites,'target'),
  repeatedLiteralCommandIds:group(commands,'id'),lifecycleCounts};
}
function getSources(builder){
 const list=builder.match(/const sources=\[([\s\S]*?)\];/);
 if(!list)throw Error('Cannot locate ordered JS source list');
 const names=[...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 if(!names.length||new Set(names).size!==names.length||names.some(n=>! /^(?:v\d+\/)?[a-z0-9-]+$/.test(n)))throw Error('Invalid JS source inventory');
 return names.map(n=>'src/'+(n.includes('/')?n:'v3/'+n)+'.js');
}
function buildRegions(main,sources,read,vendor){
 const begin='// BEGIN WRITER V3 MODULES\n',end='// END WRITER V3 MODULES';
 const start=main.indexOf(begin),stop=main.indexOf(end,start+begin.length);
 if(start<0||stop<0)throw Error('Missing JS bundle markers');
 const regions=[{start:0,end:start+begin.length,file:'main.js (legacy prefix)',lineOffset:0}];
 let cursor=start+begin.length;
 for(const file of sources){
  const raw=read(file),body=raw.replace(/^'use strict';\s*/,''),header='// v3 module: '+file+'\n';
  const expected=header+body+'\n';
  if(!main.startsWith(expected,cursor))throw Error('JS source out of sync: '+file);
  const bodyStart=cursor+header.length;
  regions.push({start:bodyStart,end:bodyStart+body.length,file,lineOffset:(raw.slice(0,raw.length-body.length).match(/\n/g)||[]).length});
  cursor+=expected.length;
 }
 const compiled=vendor.trimEnd()+'\n';
 if(cursor+compiled.length!==stop||!main.startsWith(compiled,cursor))throw Error('Visual Kit bundle out of sync');
 regions.push({start:cursor,end:stop,file:'vendor/visual-kit/.basic-bundle.js',exclude:true});
 regions.push({start:stop,end:main.length,file:'main.js (legacy suffix)',lineOffset:0});
 return regions;
}
function auditRepository(){
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const sources=getSources(read('scripts/build-v3.js')),main=read('main.js');
 const regions=buildRegions(main,sources,read,read('vendor/visual-kit/.basic-bundle.js'));
 const result=analyzeSource(main,regions);
 return {...result,sourceModules:sources.length,sourceBytes:sources.reduce((n,file)=>n+Buffer.byteLength(read(file)),0),bundleBytes:Buffer.byteLength(main),sourceOrder:sources,
  generatedSources:['src/v13/settings-search-index.js','vendor/visual-kit/.basic-bundle.js']};
}
function summarize(r){
 return {sourceModules:r.sourceModules,sourceBytes:r.sourceBytes,bundleBytes:r.bundleBytes,syntaxErrors:r.errors,
  topLevelDeclarations:r.declarations.length,repeatedTopLevelNames:r.repeatedTopLevelNames.length,
  prototypeWrites:r.prototypeWrites.length,repeatedPrototypeTargets:r.repeatedPrototypeTargets.length,
  commandSites:r.commands.length,dynamicCommandIds:r.commands.filter(c=>c.id===null).length,repeatedLiteralCommandIds:r.repeatedLiteralCommandIds.length,
  lifecycleSites:r.registrations.length,lifecycleCounts:r.lifecycleCounts,
  topPrototypeCandidates:r.repeatedPrototypeTargets.slice().sort((a,b)=>b.sites.length-a.sites.length).slice(0,10),
  topCommandCandidates:r.repeatedLiteralCommandIds.slice(0,10)};
}
if(require.main===module){
 try{const r=auditRepository();console.log(JSON.stringify(process.argv.includes('--json')?r:summarize(r),null,2));if(r.errors.length)process.exitCode=1;}
 catch(error){console.error('V16 JS audit: '+error.message);process.exitCode=1;}
}
module.exports={analyzeSource,getSources,buildRegions,auditRepository,summarize};
