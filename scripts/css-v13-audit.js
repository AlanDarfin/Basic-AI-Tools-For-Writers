'use strict';
/**
 * V13 CSS cascade audit (read-only). Inspects shipping styles, not source snippets:
 * - every selector occurrence, its enclosing @media/@supports/@container/@layer,
 * - same-context repeated declarations vs intentional adaptive overrides,
 * - full inventory of selectors for peer review.
 *
 * Examples:
 *   node scripts/css-v13-audit.js
 *   node scripts/css-v13-audit.js --report docs/V13_CSS_SELECTORS.md
 *   node scripts/css-v13-audit.js --check
 *
 * Repeated selectors are NOT automatically dead CSS. Keep the source files
 * authoritative; this auditor NEVER removes a declaration.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

function normalized(value){return String(value||'').replace(/\s+/g,' ').trim();}
function maskComments(css){
 return css.replace(/\/\*[\s\S]*?\*\//g,match=>match.replace(/[^\n]/g,' '));
}
function collectRules(css){
 const masked=maskComments(css),stack=[],rules=[];
 let start=0,quote='',escaped=false,parentheses=0;
 for(let i=0;i<masked.length;i++){
  const ch=masked[i];
  if(quote){
   if(escaped)escaped=false;
   else if(ch==='\\')escaped=true;
   else if(ch===quote)quote='';
   continue;
  }
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(ch==='('){parentheses++;continue;}
  if(ch===')'){parentheses=Math.max(0,parentheses-1);continue;}
  if(parentheses)continue;
  if(ch==='{'){
   const header=normalized(masked.slice(start,i));
   if(stack.length)stack[stack.length-1].children++;
   stack.push({header,offset:i,children:0});start=i+1;
  }else if(ch==='}'){
   const item=stack.pop();
   if(item&&!item.children&&!item.header.startsWith('@')){
    const body=masked.slice(item.offset+1,i);
    const context=stack.filter(parent=>parent.header.startsWith('@'))
     .map(parent=>parent.header).join(' / ');
    if(item.header&&body.trim())rules.push({
     selector:item.header,context,body,
     line:1+masked.slice(0,item.offset).split('\n').length-1
    });
   }
   start=i+1;
  }else if(ch===';'&&!stack.length)start=i+1;
 }
 if(stack.length)throw Error('CSS contains '+stack.length+' unmatched opening braces');
 return rules;
}
function declarations(text){
 // Split only on top-level semicolons; CSS strings/data URLs may contain ';'.
 const entries=[];let quote='',escape=false,depth=0,start=0;
 const read=end=>{
  const item=normalized(text.slice(start,end));const i=item.indexOf(':');
  if(i<1)return;
  const property=item.slice(0,i).trim().toLowerCase();
  if(!/^--[\w-]+$|^[a-z-]+$/.test(property))return;
  entries.push({property,value:normalized(item.slice(i+1))});
 };
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quote){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch===quote)quote='';continue;}
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(ch==='('){depth++;continue;}
  if(ch===')'){depth=Math.max(0,depth-1);continue;}
  if(ch===';'&&!depth){read(i);start=i+1;}
 }
 if(text.slice(start).trim())read(text.length);
 return entries;
}
function analyze(css){
 const rules=collectRules(css),selectors=new Map();
 for(const rule of rules){
  if(!selectors.has(rule.selector))selectors.set(rule.selector,[]);
  selectors.get(rule.selector).push(rule);
 }
 const rows=[],metrics={rules:rules.length,selectors:selectors.size,repeatedSelectors:0,
  acrossContexts:0,sameContext:0,identicalDeclarationOccurrences:0,
  differingDeclarationOccurrences:0,complementaryGroups:0,
  exactSameContextBlocks:0};
 for(const [selector,items] of selectors){
  if(items.length<2)continue;metrics.repeatedSelectors++;
  const contexts=new Map();
  for(const item of items){
   if(!contexts.has(item.context))contexts.set(item.context,[]);
   contexts.get(item.context).push(item);
  }
  const across=contexts.size>1;
  const inSameContext=[...contexts.values()].some(list=>list.length>1);
  if(across)metrics.acrossContexts++;
  if(inSameContext)metrics.sameContext++;
  let identical=0,overrides=0,complementary=0,exactBlocks=0;
  for(const list of contexts.values()){
   if(list.length<2)continue;
   const prior=new Map();
   const priorBodies=new Set();
   for(const rule of list){
    const signature=normalized(rule.body);
    if(priorBodies.has(signature))exactBlocks++;
    priorBodies.add(signature);
    let matches=0;
    for(const {property,value} of declarations(rule.body)){
     const seen=prior.get(property)||new Set();
     if(seen.has(value)){identical++;matches++;}
     else if(seen.size){overrides++;matches++;}
     seen.add(value);prior.set(property,seen);
    }
    if(!matches&&prior.size&&list.indexOf(rule)>0)complementary++;
   }
  }
  metrics.identicalDeclarationOccurrences+=identical;
  metrics.differingDeclarationOccurrences+=overrides;
  metrics.complementaryGroups+=complementary;
  metrics.exactSameContextBlocks+=exactBlocks;
  let kind='Adaptive (@media/@supports/@container)';
  if(inSameContext){
   kind=identical?'Review repeated declaration':
    overrides?'Intentional cascade override':'Complementary declarations';
   if(across)kind+=' + conditional';
  }
  rows.push({selector,count:items.length,contexts:contexts.size,
   sameContext:inSameContext,identical,overrides,kind,
   lines:items.map(x=>x.line)});
 }
 rows.sort((a,b)=>b.count-a.count||a.selector.localeCompare(b.selector));
 return {metrics,rows};
}
function makeMarkdown(result){
 const {metrics,rows}=result;
 const out=[
 '# Basic v13 — Inventário dos seletores CSS reincidentes',
 '',
 'Gerado de styles.css, com contexto de regras @media/@supports/@container.',
 'Leitura: duplicidade textual de seletor não prova redundância. O resultado',
 'distingue mudanças condicionais de declarações repetidas no mesmo contexto.',
 'A lista contém seletores para REVISÃO, não autorização automática para remoção.',
 '',
 '## Métricas',
 '',
 ...Object.entries(metrics).map(([key,value])=>'- '+key+': **'+value+'**'),
 '',
 '## Inventário completo',
 '',
 '| Seletor | Repetições | Contextos | Avaliação | Linhas de styles.css |',
 '| --- | ---: | ---: | --- | --- |'
 ];
 for(const row of rows){
  const selector=row.selector.replace(/\|/g,'\\|').replace(/\n/g,' ');
  out.push('| '+'\`'+selector+'\`'+' | '+row.count+' | '+row.contexts+' | '+
   row.kind+' | '+row.lines.join(', ')+' |');
 }
 out.push('','## Regra de limpeza',
 'Só remover regras quando o estilo final for comprovadamente equivalente em todos',
 'os contextos, e quando nenhuma regra antiga tiver papel de fallback para navegadores',
 'sem suporte a valores CSS recentes. Antes de eliminar seletores sem referência textual',
 'no JavaScript, verificar classes criadas dinamicamente e markdown de usuários.',
 'Manter em camadas condicionais os tamanhos mobile, os estilos de tema da timeline',
 'e os estados do dragger; nunca alterar o HeaderBar nativo do Surfing por dentro.',
 '');
 return out.join('\n');
}
if(require.main===module){
 const result=analyze(fs.readFileSync(path.join(root,'styles.css'),'utf8'));
 const arg=process.argv.indexOf('--report');
 if(arg>=0){
  const dest=process.argv[arg+1];
  if(!dest||dest.startsWith('-'))throw Error('--report requires an output path');
  fs.writeFileSync(path.resolve(root,dest),makeMarkdown(result),'utf8');
 }
 console.log(JSON.stringify(result.metrics,null,2));
 if(process.argv.includes('--check')){
  if(result.metrics.repeatedSelectors!==result.rows.length)process.exitCode=1;
  if(result.metrics.rules<1000)process.exitCode=1;
 }
}
module.exports={collectRules,declarations,analyze,makeMarkdown};
