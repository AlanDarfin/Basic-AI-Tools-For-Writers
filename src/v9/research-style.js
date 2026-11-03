'use strict';
/* 9.2.0 research + style + scratch sessions.
 * Zotero: optional local imported annotations, no remote credentials, no fabricated quotes.
 * Session notes: safe opt-in ephemeral Markdown, no automatic destructive deletion.
 * Style controls: scoped CSS variables, no global theme modifications. */
function writerV92ResearchMerge(settings){
 const old=settings.v92Research&&typeof settings.v92Research==='object'?settings.v92Research:{};
 const cfg=settings.v92Research={
  enabled:true,zoteroQuotes:false,zoteroFolder:'Zotero',zoteroTag:'zotero',
  styleEnabled:false,fontSize:16,lineHeight:1.6,contentWidth:850,headingAccent:'',
  ...old
 };
 cfg.enabled=cfg.enabled!==false;
 cfg.zoteroQuotes=cfg.zoteroQuotes===true;
 cfg.zoteroFolder=String(cfg.zoteroFolder||'Zotero').replace(/^\/|\/$/g,'').slice(0,180);
 cfg.zoteroTag=String(cfg.zoteroTag||'zotero').replace(/^#/,'').slice(0,70);
 cfg.styleEnabled=cfg.styleEnabled===true;
 cfg.fontSize=Math.max(12,Math.min(24,Number(cfg.fontSize)||16));
 cfg.lineHeight=Math.max(1.2,Math.min(2.3,Number(cfg.lineHeight)||1.6));
 cfg.contentWidth=Math.max(480,Math.min(1400,Number(cfg.contentWidth)||850));
 cfg.headingAccent=/^#[0-9a-f]{6}$/i.test(cfg.headingAccent)?cfg.headingAccent:'';
 return cfg;
}
function writerV92ZoteroIsSource(plugin,file){
 if(!(file instanceof TFile)||file.extension!=='md')return false;
 const cfg=plugin.settings.v92Research;
 const path=file.path.toLocaleLowerCase(),folder=cfg.zoteroFolder.toLocaleLowerCase();
 const cache=plugin.app.metadataCache?.getFileCache?.(file);
 const tags=[...(cache?.tags||[]).map(x=>x.tag),...(Array.isArray(cache?.frontmatter?.tags)?cache.frontmatter.tags:[cache?.frontmatter?.tags])]
  .filter(Boolean).map(x=>String(x).replace(/^#/,'').toLocaleLowerCase());
 return (folder&&(path.startsWith(folder+'/')||path===folder+'.md'))||
  tags.some(tag=>tag===cfg.zoteroTag.toLocaleLowerCase()||tag.startsWith(cfg.zoteroTag.toLocaleLowerCase()+'/'));
}
function writerV92ZoteroExtract(plugin,file,text){
 const cache=plugin.app.metadataCache?.getFileCache?.(file);
 const meta=cache?.frontmatter||{};
 const author=String(meta.author||meta.creators||meta.citation||meta.title||file.basename).replace(/\s+/g,' ').slice(0,160);
 const source=String(meta.title||file.basename).slice(0,180);
 const entries=[];
 const push=raw=>{
  const quote=String(raw||'').replace(/\s+/g,' ').trim().slice(0,1000);
  if(quote.length>=12&&!entries.some(x=>x[0]===quote))entries.push([quote,author,file.path,source]);
 };
 // Only explicitly marked highlights/quotes: no inference from ordinary text or abstracts.
 for(const key of ['highlights','quotes','annotations']){
  const value=meta[key];
  if(Array.isArray(value))for(const item of value)push(typeof item==='string'?item:item?.text||item?.quote||'');
  else if(typeof value==='string')push(value);
 }
 const lines=String(text||'').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  if(/^\s*(?:>\s*)?(?:\*\*)?(?:highlight|quote|citação|destaque)(?:\*\*)?\s*:/i.test(lines[i])){
   push(lines[i].replace(/^\s*(?:>\s*)?(?:\*\*)?(?:highlight|quote|citação|destaque)(?:\*\*)?\s*:\s*/i,''));
  }
  // Zotero integration highlight templates often use Markdown blockquotes under a highlight heading.
  if(/^\s*#{1,5}\s*(?:highlights?|destaques?|annotations?)\b/i.test(lines[i])){
   for(let j=i+1;j<Math.min(lines.length,i+100);j++){
    if(/^\s*#{1,5}\s/.test(lines[j]))break;
    const match=lines[j].match(/^\s*>\s*(.+)/);
    if(match&&!/^\[!/.test(match[1]))push(match[1]);
   }
  }
 }
 return entries.slice(0,100);
}
async function writerV92ZoteroQuotes(plugin,limit=180){
 const cfg=plugin.settings.v92Research;
 if(!cfg.enabled||!cfg.zoteroQuotes||!writerModuleOn(plugin,'zoteroIntegration'))return [];
 const files=(plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>writerV92ZoteroIsSource(plugin,file)).slice(0,100);
 const quotes=[];
 for(const file of files){
  try{
   const text=await plugin.app.vault.cachedRead(file);
   if(typeof text==='string'&&text.length<200000)quotes.push(...writerV92ZoteroExtract(plugin,file,text));
  }catch(error){console.warn('[Basic AI] Zotero note:',file.path,error);}
  if(quotes.length>=limit)break;
 }
 return quotes.slice(0,limit);
}
function writerV92ResearchStyle(plugin){
 const cfg=plugin.settings.v92Research;
 const roots=plugin.app.workspace.getLeavesOfType?.('markdown')||[];
 for(const leaf of roots){
  const root=leaf.view?.containerEl;
  if(!root)continue;
  const on=cfg.styleEnabled&&writerModuleOn(plugin,'styleMate');
  root.classList.toggle('writer-v92-style',on);
  if(on){
   root.style.setProperty('--writer-v92-font-size',cfg.fontSize+'px');
   root.style.setProperty('--writer-v92-line-height',String(cfg.lineHeight));
   root.style.setProperty('--writer-v92-width',cfg.contentWidth+'px');
   if(cfg.headingAccent)root.style.setProperty('--writer-v92-heading-color',cfg.headingAccent);
   else root.style.removeProperty('--writer-v92-heading-color');
  }else for(const key of ['--writer-v92-font-size','--writer-v92-line-height','--writer-v92-width','--writer-v92-heading-color'])
   root.style.removeProperty(key);
 }
}
function writerV92ResearchRegister(plugin){
 plugin.writerV92Research={quotes:()=>writerV92ZoteroQuotes(plugin),refreshStyle:()=>writerV92ResearchStyle(plugin)};
 plugin.registerEvent(plugin.app.workspace.on('layout-change',()=>writerV92ResearchStyle(plugin)));
 plugin.app.workspace.onLayoutReady?.(()=>writerV92ResearchStyle(plugin));
 plugin.register?.(()=>{for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
  const root=leaf.view?.containerEl;
  root?.classList?.remove('writer-v92-style');
  for(const key of ['--writer-v92-font-size','--writer-v92-line-height','--writer-v92-width','--writer-v92-heading-color'])
   root?.style?.removeProperty(key);
 }});
 plugin.addCommand?.({id:'v92-refresh-zotero-quotes',name:writerUi('Zotero: atualizar widget de citações','Zotero: refresh quote widget'),callback:()=>{
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[]){
   leaf.view.homeQuote=null;leaf.view.render?.();
  }
 }});
 plugin.addCommand?.({id:'v92-toggle-reading-style',name:writerUi('Estilo de leitura: ativar/desativar','Reading style: toggle'),callback:async()=>{
  const cfg=plugin.settings.v92Research;cfg.styleEnabled=!cfg.styleEnabled;
  await plugin.saveSettings();writerV92ResearchStyle(plugin);
 }});
}
function writerV92ResearchSettings(plugin,panel){
 const cfg=plugin.settings.v92Research;
 panel.createEl('h3',{text:writerUi('Zotero e citações','Zotero & quotes')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Lê destaques de notas Markdown já importadas pelo Zotero Integration. Sem conexão direta à biblioteca Zotero e sem inventar citações.',
  'Reads highlights from Markdown notes previously imported using Zotero Integration. No direct Zotero library connection and no invented quotations.'
 )});
 new Setting(panel).setName(writerUi('Ativar fontes de pesquisa','Enable research sources')).addToggle(t=>t.setValue(cfg.enabled)
  .onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Usar destaques Zotero no widget de citações','Use Zotero highlights in quote widget'))
  .addToggle(t=>t.setValue(cfg.zoteroQuotes).onChange(async v=>{cfg.zoteroQuotes=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Pasta das notas importadas','Imported notes folder'))
  .addText(t=>t.setValue(cfg.zoteroFolder).onChange(async v=>{cfg.zoteroFolder=v.slice(0,180);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Tag das notas Zotero','Zotero note tag'))
  .addText(t=>t.setValue(cfg.zoteroTag).onChange(async v=>{cfg.zoteroTag=v.slice(0,70);await plugin.saveSettings();}));
 panel.createEl('h3',{text:writerUi('Estilo de leitura','Reading style')});
 new Setting(panel).setName(writerUi('Ativar estilo por nota','Enable note styling'))
  .addToggle(t=>t.setValue(cfg.styleEnabled).onChange(async v=>{cfg.styleEnabled=v;await plugin.saveSettings();writerV92ResearchStyle(plugin);}));
 for(const [key,pt,en,min,max,step] of [
  ['fontSize','Tamanho da fonte','Font size',12,24,1],
  ['lineHeight','Altura de linha','Line height',1.2,2.3,.1],
  ['contentWidth','Largura da leitura','Reading width',480,1400,20]
 ])new Setting(panel).setName(writerUi(pt,en)).addSlider(s=>s.setLimits(min,max,step).setValue(cfg[key])
  .setDynamicTooltip().onChange(async v=>{cfg[key]=v;await plugin.saveSettings();writerV92ResearchStyle(plugin);}));
 new Setting(panel).setName(writerUi('Cor dos títulos (#RRGGBB)','Heading color (#RRGGBB)'))
  .addText(t=>t.setValue(cfg.headingAccent).setPlaceholder('#ffaa33').onChange(async v=>{
   cfg.headingAccent=/^#[0-9a-f]{6}$/i.test(v)?v:'';
   await plugin.saveSettings();writerV92ResearchStyle(plugin);
  }));
}
