'use strict';
/**
 * Basic v13 cascade-aware CSS inventory. READ-ONLY.
 * Usage: node scripts/audit-v13-css.js [--details]
 * Repeated selectors are not proof of obsolete functionality.
 */
const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
const normalize=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
function find(css,start,end,stops){
 let quote=null,comment=false,paren=0,bracket=0;
 for(let i=start;i<end;i++){
  const c=css[i],n=css[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
  if(c==='/'&&n==='*'){comment=true;i++;continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='('){paren++;continue;}
  if(c===')'){paren=Math.max(0,paren-1);continue;}
  if(c==='['){bracket++;continue;}
  if(c===']'){bracket=Math.max(0,bracket-1);continue;}
  if(!paren&&!bracket&&stops.includes(c))return {i,c};
 }
 return {i:end,c:null};
}
function matchBrace(css,open,end){
 let depth=1;
 for(let i=open+1;i<end;){
  const t=find(css,i,end,'{}');if(!t.c)return end;
  depth+=t.c==='{'?1:-1;if(depth===0)return t.i;
  i=t.i+1;
 }
 return end;
}
function decls(body,offset){
 const list=[];let i=0;
 while(i<body.length){
  const t=find(body,i,body.length,';'),raw=body.slice(i,t.i),colon=find(raw,0,raw.length,':');
  if(colon.c===':'){
   const property=normalize(raw.slice(0,colon.i)).toLowerCase(),value=normalize(raw.slice(colon.i+1));
   if(/^(?:--[\w-]+|[-a-z][-\w]*)$/i.test(property)&&value)
    list.push({property,value,important:/!important$/i.test(value),start:offset+i,end:offset+t.i+(t.c?1:0)});
  }
  i=t.i+(t.c?1:0);if(!t.c)break;
 }
 return list;
}
function scanCss(css,file='styles.css'){
 const rules=[];
 function parse(a,b,scope){
  let i=a;
  while(i<b){
   const t=find(css,i,b,'{};');
   if(!t.c||t.c==='}')break;
   if(t.c===';'){i=t.i+1;continue;}
   const head=normalize(css.slice(i,t.i)),end=matchBrace(css,t.i,b);
   if(end===b)break;
   if(head.startsWith('@')){
    const at=(head.match(/^@([\w-]+)/)||[])[1];
    if(['media','supports','container','layer','scope','document','starting-style','keyframes','-webkit-keyframes'].includes(at))
     parse(t.i+1,end,scope.concat(head));
   }else if(head&&!css.slice(t.i+1,end).includes('{')){
    rules.push({selector:head,context:scope.join(' > ')||'root',file,line:css.slice(0,i).split('\n').length,
     body:normalize(css.slice(t.i+1,end)),start:i,end:end+1,decls:decls(css.slice(t.i+1,end),t.i+1)});
   }
   i=end+1;
  }
 }
 parse(0,css.length,[]);return rules;
}
function analyze(rules){
 const repeated=new Map(),last=new Map(),blocks=new Set(),collisions=[];
 let overlaps=0,same=0,different=0,sameFile=0,identicalBlocks=0;
 for(const rule of rules){
  const site=repeated.get(rule.selector)||[];site.push({file:rule.file,line:rule.line,context:rule.context});repeated.set(rule.selector,site);
  const blockKey=[rule.context,rule.selector,rule.body].join('\x00');
  if(blocks.has(blockKey))identicalBlocks++;
  blocks.add(blockKey);
  for(const dec of rule.decls){
   const k=[rule.context,rule.selector,dec.property].join('\x00'),old=last.get(k);
   if(old){
    overlaps++;
    const identical=dec.value===old.dec.value&&dec.important===old.dec.important;
    if(identical){same++;if(rule.file===old.rule.file)sameFile++;}else different++;
    collisions.push({selector:rule.selector,context:rule.context,property:dec.property,identical,
     before:{file:old.rule.file,line:old.rule.line,value:old.dec.value},
     after:{file:rule.file,line:rule.line,value:dec.value}});
   }
   last.set(k,{rule,dec});
  }
 }
 const dup=[...repeated].filter(([,v])=>v.length>1);
 return {ruleCount:rules.length,uniqueSelectors:repeated.size,repeatedSelectorKeys:dup.length,
  extraSelectorOccurrences:dup.reduce((n,[,v])=>n+v.length-1,0),
  overlappingProperties:overlaps,identicalDeclarations:same,changedValues:different,
  identicalDeclarationsSameFile:sameFile,identicalRuleBlocks:identicalBlocks,
  duplicates:dup.map(([selector,sites])=>({selector,sites})),collisions};
}
function auditWorkingTree(){
 const build=fs.readFileSync(path.join(root,'scripts/build-css.js'),'utf8');
 const match=build.match(/const sections=\[([\s\S]*?)\];/);if(!match)throw Error('No CSS inventory');
 const modules=[...match[1].matchAll(/'([^']+)'/g)].map(m=>'src/styles/'+m[1]);
 const compiled=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 const boundary=compiled.indexOf('/* BEGIN V8 MODULAR STYLES */');if(boundary<0)throw Error('No CSS marker');
 const rules=scanCss(compiled.slice(0,boundary),'styles.css:legacy');
 for(const file of modules)rules.push(...scanCss(fs.readFileSync(path.join(root,file),'utf8'),file));
 return {files:modules.length+1,legacyBytes:boundary,...analyze(rules)};
}
if(require.main===module){
 const report=auditWorkingTree();
 if(!process.argv.includes('--details')){delete report.collisions;delete report.duplicates;}
 console.log(JSON.stringify(report,null,2));
}
module.exports={scanCss,analyze,auditWorkingTree};
