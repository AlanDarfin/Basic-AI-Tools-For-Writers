'use strict';
/**
 * v13: conservative, source-order-preserving cleanup of redundant CSS declarations.
 * Only removes an earlier identical property/value for an identical selector in
 * the SAME enclosing at-rule/nesting context. Preserves all differing overrides,
 * media variants, comments, same-block fallbacks, and @keyframes.
 * Modular sources remain authoritative, with the shipping bundle deduplicated.
 */
function pruneDuplicateDeclarations(css){
 const masked=css.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g,' '));
 const stack=[],rules=[];let start=0,quote='',escape=false,parens=0,brackets=0;
 const normalize=s=>s.replace(/\s+/g,' ').trim();
 for(let i=0;i<masked.length;i++){
  const ch=masked[i];
  if(quote){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch===quote)quote='';continue;}
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(ch==='('){parens++;continue;}if(ch===')'){parens=Math.max(0,parens-1);continue;}
  if(ch==='['){brackets++;continue;}if(ch===']'){brackets=Math.max(0,brackets-1);continue;}
  if(parens||brackets)continue;
  if(ch==='{'){
   const head=normalize(masked.slice(start,i));
   if(stack.length)stack[stack.length-1].children++;
   stack.push({head,begin:start,bodyStart:i+1,children:0});start=i+1;
  }else if(ch==='}'){
   const node=stack.pop();
   if(node&&!node.children&&!node.head.startsWith('@')){
    const context=stack.map(p=>p.head).join(' / ');
    if(!/@(?:-webkit-)?keyframes\b|@starting-style\b/i.test(context))
     rules.push({selector:node.head,context,bodyStart:node.bodyStart,bodyEnd:i});
   }
   start=i+1;
  }else if(ch===';'&&!stack.length)start=i+1;
 }
 if(stack.length)throw Error('Unbalanced CSS blocks');
 function readDeclarations(rule){
  const result=[];let last=rule.bodyStart,q='',esc=false,paren=0,bracket=0;
  function add(end,withSemicolon){
   const segment=masked.slice(last,end);
   const match=segment.match(/^\s*(--[\w-]+|[a-z-]+)\s*:\s*([\s\S]*?)\s*$/i);
   if(match){
    const text=css.slice(last,end+(withSemicolon?1:0));
    if(!text.includes('/*')&&!text.includes('*/'))
     result.push({property:match[1].toLowerCase(),value:normalize(match[2]),from:last,to:end+(withSemicolon?1:0)});
   }
   last=end+(withSemicolon?1:0);
  }
  for(let i=rule.bodyStart;i<rule.bodyEnd;i++){
   const ch=masked[i];
   if(q){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch===q)q='';continue;}
   if(ch==='"'||ch==="'"){q=ch;continue;}
   if(ch==='('){paren++;continue;}if(ch===')'){paren=Math.max(0,paren-1);continue;}
   if(ch==='['){bracket++;continue;}if(ch===']'){bracket=Math.max(0,bracket-1);continue;}
   if(ch===';'&&!paren&&!bracket)add(i,true);
  }
  if(last<rule.bodyEnd)add(rule.bodyEnd,false);
  return result;
 }
 const groups=new Map();
 for(const rule of rules){
  const key=rule.selector+'\x00'+rule.context;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({...rule,decls:readDeclarations(rule)});
 }
 const edits=[],selectors=new Set();
 for(const group of groups.values()){
  if(group.length<2)continue;
  const later=new Map();
  for(let j=group.length-1;j>=0;j--){
   const rule=group[j],count=new Map();
   for(const d of rule.decls)count.set(d.property,(count.get(d.property)||0)+1);
   for(const d of rule.decls){
    if(count.get(d.property)===1&&later.get(d.property)===d.value){
     edits.push({from:d.from,to:d.to});selectors.add(rule.selector);
    }
   }
   for(const d of rule.decls){
    if(!later.has(d.property))later.set(d.property,count.get(d.property)===1?d.value:null);
   }
  }
 }
 edits.sort((a,b)=>b.from-a.from);
 for(let i=1;i<edits.length;i++)if(edits[i].to>edits[i-1].from)throw Error('Overlapping declaration edits');
 let result=css;
 for(const e of edits)result=result.slice(0,e.from)+result.slice(e.to);
 return {css:result,removed:edits.length,selectors:selectors.size};
}
module.exports={pruneDuplicateDeclarations};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path');
 const file=path.resolve(__dirname,'../styles.css');
 const result=pruneDuplicateDeclarations(fs.readFileSync(file,'utf8'));
 console.log(JSON.stringify({removableDeclarations:result.removed,affectedSelectors:result.selectors},null,2));
 if(process.argv.includes('--check')&&result.removed)process.exitCode=1;
}
