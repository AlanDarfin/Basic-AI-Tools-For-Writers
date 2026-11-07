'use strict';
/**
 * v13 CSS/DOM contract audit.
 * Static evidence only: classes can be composed dynamically, injected by
 * external plugins, created by Markdown or supplied by user content.
 * Therefore a missing literal is NEVER evidence for automatic removal.
 */
const fs=require('node:fs');
const path=require('node:path');
const {collectRules}=require('./css-v13-audit.js');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const required=['dictionary-settings-panel','writer-v8-home','writer-v11-studio',
 'writer-v11-studio-modal','writer-v102-spaces-manager','writer-v95-timeline',
 'writer-v95-timeline-toolbar','writer-v106-drag-handle',
 'writer-v1205-native-surfing-host','writer-v1205-bookmarks-widget'];
function auditFromStrings({foundation,surfing,main,css}){
 const errors=[],rules=collectRules(foundation),externalRules=collectRules(surfing);
 for(const rule of rules){
  const selector=rule.selector;
  if(!/\.(?:writer-|dictionary-)/.test(selector))
   errors.push('Unscoped v13 selector: '+selector);
  if(/\.(?:wb-|workspace-|cm-|markdown-|view-header)/.test(selector))
   errors.push('v13 overrides a third-party/Obsidian DOM selector: '+selector);
  if(/(?:^|,)\s*(?:html|body|:root)(?:\s*\{|\s*,|$)/.test(selector))
   errors.push('Global document selector in v13: '+selector);
 }
 const nativeSurfingRules=externalRules.filter(r=>/\.wb-[\w-]+/.test(r.selector));
 for(const rule of nativeSurfingRules){
  if(!rule.selector.trim().startsWith('.writer-v8-home .writer-v1205-native-surfing-host '))
   errors.push('Native Surfing selector outside Basic host: '+rule.selector);
 }
 for(const cls of required){
  if(!foundation.includes('.'+cls)&&cls!=='writer-v1205-native-surfing-host')
   errors.push('Missing v13 adapter: '+cls);
  if(!main.includes(cls))errors.push('Missing DOM reference to Basic class: '+cls);
 }
 if(!surfing.includes('.writer-v8-home .writer-v1205-native-surfing-host input.wb-search-bar'))
  errors.push('Surfing native search control lacks a host-scoped style');
 if(!foundation.includes('prefers-contrast:more')||
    !foundation.includes('prefers-reduced-motion:reduce')||
    !foundation.includes('body.is-mobile'))
  errors.push('Required contrast/motion/mobile guards missing');
 const probes={
  classListAdd:(main.match(/\.classList\.add\s*\(/g)||[]).length,
  classListToggle:(main.match(/\.classList\.toggle\s*\(/g)||[]).length,
  classListRemove:(main.match(/\.classList\.remove\s*\(/g)||[]).length,
  createDivWithClass:(main.match(/createDiv\s*\(\s*\{\s*cls\s*:/g)||[]).length,
  createElWithClass:(main.match(/createEl\s*\([^;]{0,220}\bcls\s*:/g)||[]).length,
  classNameAssignments:(main.match(/\.className\s*=/g)||[]).length,
  stringConcatenations:(main.match(/['"][^'"]{1,80}['"]\s*\+\s*[A-Za-z_$]/g)||[]).length,
  templateInterpolations:(main.match(/\$\{/g)||[]).length,
  inlineStyleAssignments:(main.match(/\.style\.[a-zA-Z]+\s*=/g)||[]).length,
  dynamicSetProperty:(main.match(/\.style\.setProperty\s*\(/g)||[]).length
 };
 const cssClasses=[...new Set([...css.matchAll(/\.((?:writer|dictionary|wb)-[\w-]+)/g)].map(m=>m[1]))];
 const noLiteralMatch=cssClasses.filter(cls=>!main.includes(cls));
 return {errors,metrics:{v13Rules:rules.length,surfingNativeScopedRules:nativeSurfingRules.length,
  cssClasses:cssClasses.length,cssClassLiteralsMissingInJs:noLiteralMatch.length,
  ...probes},unmatchedExamples:noLiteralMatch.slice(0,25)};
}
function markdown(result){
 const m=result.metrics;
 return [
 '# v13 — Contratos CSS/DOM e análise de classes dinâmicas','',
 'Inspeção estática no código compilado e nas fontes CSS. Não substitui testes visuais.',
 'As classes não encontradas literalmente no JavaScript **não são consideradas mortas**:',
 'podem ser originadas de templates Markdown, concatenação, APIs externas, DOM nativo',
 'do Obsidian, temas de terceiros ou regras de fallback.','',
 '## Métricas','',
 ...Object.entries(m).map(([k,v])=>'- '+k+': **'+v+'**'),
 '', '## Contratos e conclusão', '',
 '- Os adaptadores v13 permanecem restritos às raízes do Basic.',
 '- A barra nativa Surfing só é selecionada dentro do recipiente Basic na homepage.',
 '- Nenhum seletor v13 interfere diretamente nos controles globais do editor ou na HeaderBar de terceiros.',
 '- Longform, Spaces, Timeline e Dragger usam classes próprias do Basic com prefixo writer-.',
 '- Estados de dispositivos móveis, redução de movimento e contraste são tratados em regras distintas.',
 '- Ausência textual não autoriza exclusão de CSS, especialmente em classes com nomes calculados.',
 '', '## Classes não encontradas literalmente no bundle JS (amostra, preservar)', '',
 ...result.unmatchedExamples.map(x=>'- `.'+x+'`'),
 '', '## Resultado de contratos','',
 result.errors.length?result.errors.map(x=>'- ERRO: '+x).join('\n'):'Nenhum conflito estático detectado nos contratos monitorados.',
 '', '## QA obrigatório','',
 'Executar os cenários e registrar evidências conforme `docs/V13_QA_VISUAL.pt-BR.md`.',
 'Não marcar inspeção em Obsidian/Android como concluída somente com CI verde.',''
 ].join('\n');
}
if(require.main===module){
 const result=auditFromStrings({
  foundation:read('src/styles/v13-foundation.css'),
  surfing:read('src/styles/v12-0-5-home-widgets.css'),
  main:read('main.js'),
  css:read('styles.css')
 });
 const idx=process.argv.indexOf('--report');
 if(idx>=0){
  const output=process.argv[idx+1];
  if(!output||output.startsWith('-'))throw Error('--report requires path');
  fs.writeFileSync(path.resolve(root,output),markdown(result),'utf8');
 }
 console.log(JSON.stringify(result,null,2));
 if(process.argv.includes('--check')&&result.errors.length)process.exitCode=1;
}
module.exports={auditFromStrings,markdown,required};
