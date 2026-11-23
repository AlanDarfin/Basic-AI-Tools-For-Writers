'use strict';
/* 9.2.0 research + style + scratch sessions.
 * Zotero: optional local imported annotations, no remote credentials, no fabricated quotes.
 * Session notes: safe opt-in ephemeral Markdown, no automatic destructive deletion.
 * Style controls: scoped CSS variables, no global theme modifications. */
function writerV92ResearchMerge(settings){
 const old=settings.v92Research&&typeof settings.v92Research==='object'?settings.v92Research:{};
 const cfg=settings.v92Research={
  enabled:true,zoteroQuotes:false,zoteroFolder:'Zotero',zoteroTag:'zotero',zoteroBibFile:'',zoteroQuoteMode:'both',
  styleEnabled:false,stylePrint:false,stylePresets:[],
  ...old
 };
 cfg.enabled=cfg.enabled!==false;
 cfg.zoteroQuotes=cfg.zoteroQuotes===true;
 cfg.zoteroFolder=String(cfg.zoteroFolder||'Zotero').replace(/^\/|\/$/g,'').slice(0,180);
 cfg.zoteroTag=String(cfg.zoteroTag||'zotero').replace(/^#/,'').slice(0,70);
 cfg.zoteroBibFile=String(cfg.zoteroBibFile||'').trim().slice(0,500);
 cfg.zoteroQuoteMode=['both','prefer','only'].includes(cfg.zoteroQuoteMode)?cfg.zoteroQuoteMode:'both';
 cfg.styleEnabled=cfg.styleEnabled===true;
 cfg.stylePrint=cfg.stylePrint===true;
 Object.assign(cfg,writerV92ReadingStyleValues(cfg));
 const names=new Set();
 cfg.stylePresets=(Array.isArray(cfg.stylePresets)?cfg.stylePresets:[]).filter(preset=>{
  const name=typeof preset?.name==='string'?preset.name.trim().slice(0,45):'';
  if(!name||names.has(name)||!preset.values||typeof preset.values!=='object')return false;
  names.add(name);return true;
 }).slice(0,25).map(preset=>({name:preset.name.trim().slice(0,45),values:writerV92ReadingStyleValues(preset.values)}));
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
 const creators=meta.author||meta.creators||meta.creator||meta.citation||meta.title||file.basename;
 const author=(Array.isArray(creators)?creators.map(value=>typeof value==='string'?value:[value?.lastName,value?.firstName].filter(Boolean).join(', ')).join('; '):String(creators)).replace(/\s+/g,' ').slice(0,160);
 const source=String(meta.title||file.basename).slice(0,180);
 const entries=[];
 const push=raw=>{
  const quote=String(raw||'').replace(/\s+/g,' ').trim().slice(0,1000);
  if(quote.length>=12&&!entries.some(x=>x[0]===quote))entries.push([quote,author,file.path,source]);
 };
 // Only explicitly marked highlights/quotes: no inference from ordinary text or abstracts.
 for(const key of ['highlights','quotes','annotations','zoteroAnnotations','annotation']){
  const value=meta[key];
  if(Array.isArray(value))for(const item of value)push(typeof item==='string'?item:item?.text||item?.quote||item?.annotationText||item?.highlightText||'');
  else if(typeof value==='string')push(value);
 }
 const lines=String(text||'').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  if(/^\s*(?:>\s*)?(?:\*\*)?(?:highlight|quote|citação|destaque)(?:\*\*)?\s*:/i.test(lines[i])){
   push(lines[i].replace(/^\s*(?:>\s*)?(?:\*\*)?(?:highlight|quote|citação|destaque)(?:\*\*)?\s*:\s*/i,''));
  }
  // Zotero integration highlight templates often use Markdown blockquotes under a highlight heading.
  if(/^\s*#{1,5}\s*(?:highlights?|destaques?|annotations?|anotações)\b/i.test(lines[i])){
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
 const files=(plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>writerV92ZoteroIsSource(plugin,file)).slice(0,240);
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
function writerV92ZoteroQuoteMode(plugin){
 const cfg=plugin.settings.v92Research;
 return cfg?.enabled&&cfg.zoteroQuotes&&writerModuleOn(plugin,'zoteroIntegration')?cfg.zoteroQuoteMode||'both':'manual';
}
function writerV92RefreshZoteroQuotes(plugin){
 for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[]){
  leaf.view.homeQuote=null;leaf.view.render?.();
 }
}
const WRITER_ZOTERO_BIB_SIZE=3*1024*1024;
const WRITER_ZOTERO_BIB_CACHE=new WeakMap();
const WRITER_ZOTERO_CITEKEY=/^[\p{L}\p{N}_][\p{L}\p{N}_:.+/?-]{0,119}$/u;
function writerV92BibTerm(text,start,limit,budget){
 const opener=text[start];
 if(opener!=='{'&&opener!=='"'){
  const bare=/[^\s,#})]+/y;bare.lastIndex=start;
  const match=bare.exec(text);
  return match&&bare.lastIndex<=limit?{value:match[0],end:bare.lastIndex}:null;
 }
 let depth=opener==='{'?1:0;
 for(let cursor=start+1;cursor<limit&&budget.remaining>0;cursor++){
  budget.remaining--;
  const char=text[cursor];
  if(char==='\\'){cursor++;continue;}
  if(char==='"'&&opener==='"'&&depth===0)return {value:text.slice(start+1,cursor),end:cursor+1};
  if(char==='{')depth++;
  if(char==='}'&&depth>0&&--depth===0&&opener==='{')return {value:text.slice(start+1,cursor),end:cursor+1};
 }
 return null;
}
function writerV92BibEntries(source){
 const text=String(source||'').slice(0,WRITER_ZOTERO_BIB_SIZE),entries=[];
 // Failed entries can revisit earlier content during recovery. Bound total scanning as well.
 const budget={remaining:text.length*2};
 const header=/%[^\r\n]*|@([a-z]+)\s*([({])\s*([^,=\s{}()]+)\s*,/gi;
 const field=/([a-z][\w-]*)\s*=\s*/iy,space=/(?:\s|%[^\r\n]*)*/y;
 const skip=start=>{space.lastIndex=start;space.exec(text);return space.lastIndex;};
 const clean=(value,max)=>String(value||'').replace(/[{}]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
 let head;
 while(entries.length<1500&&budget.remaining>0&&(head=header.exec(text))){
  const key=head[3];
  if(!key||!WRITER_ZOTERO_CITEKEY.test(key)||/^(comment|string|preamble)$/i.test(head[1]))continue;
  const close=head[2]==='{'?'}':')',fields=new Map(),limit=Math.min(text.length,header.lastIndex+100000);
  let cursor=skip(header.lastIndex);
  while(cursor<limit&&text[cursor]!==close){
   field.lastIndex=cursor;
   const name=field.exec(text)?.[1];
   if(!name)break;
   let term=writerV92BibTerm(text,field.lastIndex,limit,budget),value='';
   while(term){
    value+=term.value;cursor=skip(term.end);
    if(text[cursor]!=='#')break;
    term=writerV92BibTerm(text,skip(cursor+1),limit,budget);
   }
   if(!term)break;
   fields.set(name.toLowerCase(),value);
   if(text[cursor]!==',')break;
   cursor=skip(cursor+1);
  }
  if(text[cursor]!==close)continue;
  header.lastIndex=cursor+1;
  entries.push({key,title:clean(fields.get('title'),250)||key,author:clean(fields.get('author'),180),
   year:clean(fields.get('year')||fields.get('date'),30),doi:clean(fields.get('doi'),120)});
 }
 return entries;
}
async function writerV92ZoteroBibReferences(plugin){
 const cfg=plugin.settings.v92Research,path=cfg?.zoteroBibFile;
 if(!path||!cfg.enabled||!writerModuleOn(plugin,'zoteroIntegration'))return [];
 if(!/\.bib$/i.test(path)||/[\\:\x00-\x1f]/.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..'))
  throw Error('Invalid vault bibliography path');
 // Access the explicitly selected path even when Obsidian hides .bib files from its file index.
 const adapter=plugin.app.vault.adapter;
 const stat=await adapter.stat(path);
 if(stat?.type!=='file'||!Number.isFinite(stat.size)||stat.size>WRITER_ZOTERO_BIB_SIZE)throw Error('Unavailable vault bibliography');
 const cached=WRITER_ZOTERO_BIB_CACHE.get(plugin);
 if(cached?.path===path&&cached.mtime===stat.mtime&&cached.size===stat.size)return cached.entries;
 const entries=adapter.read(path).then(writerV92BibEntries),record={path,mtime:stat.mtime,size:stat.size,entries};
 WRITER_ZOTERO_BIB_CACHE.set(plugin,record);
 try{return await entries;}
 catch(error){
  if(WRITER_ZOTERO_BIB_CACHE.get(plugin)===record)WRITER_ZOTERO_BIB_CACHE.delete(plugin);
  throw error;
 }
}
const WRITER_V92_STYLE_RANGES=[
 ['fontSize','Tamanho da fonte','Font size',12,24,1,16,'px','font-size'],
 ['lineHeight','Altura de linha','Line height',1.2,2.3,.1,1.6,'','line-height'],
 ['contentWidth','Largura da leitura','Reading width',480,1400,20,850,'px','width'],
 ['paragraphSpacing','Espaçamento entre parágrafos','Paragraph spacing',0,36,2,0,'px','paragraph-spacing'],
 ['listIndent','Recuo das listas','List indentation',0,72,2,0,'px','list-indent'],
 ['quoteRadius','Arredondamento de citações','Quote corner radius',0,28,1,0,'px','quote-radius']
];
const WRITER_V92_STYLE_COLORS=[
 ['headingAccent','Cor dos títulos','Heading color','heading-color'],
 ['bodyColor','Cor do texto','Text color','body-color'],
 ['linkColor','Cor dos links','Link color','link-color'],
 ['quoteColor','Cor das citações','Quote color','quote-color'],
 ['quoteBorder','Cor da borda das citações','Quote border color','quote-border'],
 ['bulletColor','Cor dos marcadores de lista','List marker color','bullet-color']
];
function writerV92ReadingStyleValues(input){
 const readNumber=(value,min,max,fallback)=>value==null||value===''||!Number.isFinite(Number(value))?fallback:
  Math.min(max,Math.max(min,Number(value)));
 const color=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:'';
 const values={};
 for(const [field,,,min,max,,fallback] of WRITER_V92_STYLE_RANGES)
  values[field]=readNumber(input[field],min,max,fallback);
 for(const [field] of WRITER_V92_STYLE_COLORS)values[field]=color(input[field]);
 values.headingSizes=Array.from({length:6},(_,i)=>readNumber(input.headingSizes?.[i],0,3,0));
 values.headingColors=Array.from({length:6},(_,i)=>color(input.headingColors?.[i]));
 return values;
}
function writerV92ResearchStyleApply(root,cfg,on){
 root.classList.toggle('writer-v92-style',on);
 root.classList.toggle('writer-v92-style-print',on&&cfg.stylePrint);
 const set=(key,value)=>{
  if(on&&value)root.style.setProperty('--writer-v92-'+key,value);
  else root.style.removeProperty('--writer-v92-'+key);
 };
 for(const [field,,,,,,,unit,css] of WRITER_V92_STYLE_RANGES)set(css,cfg[field]?cfg[field]+unit:'');
 for(const [field,,,css] of WRITER_V92_STYLE_COLORS)set(css,cfg[field]);
 for(let i=0;i<6;i++){
  set('h'+(i+1)+'-size',cfg.headingSizes?.[i]?cfg.headingSizes[i]+'em':'');
  set('h'+(i+1)+'-color',cfg.headingColors?.[i]);
 }
}
function writerV92ResearchStyle(plugin){
 const cfg=plugin.settings.v92Research;
 const roots=plugin.app.workspace.getLeavesOfType?.('markdown')||[];
 for(const leaf of roots){
  const root=leaf.view?.containerEl;
  if(!root)continue;
  writerV92ResearchStyleApply(root,cfg,cfg.styleEnabled&&writerModuleOn(plugin,'styleMate'));
 }
}
function writerV92ResearchRegister(plugin){
 plugin.writerV92Research={quotes:()=>writerV92ZoteroQuotes(plugin),refreshStyle:()=>writerV92ResearchStyle(plugin)};
 for(const type of ['zotero','bibliography'])plugin.registerMarkdownCodeBlockProcessor?.(type,
  (source,el,ctx)=>writerV10ZoteroBibliography(plugin,source,el,ctx));
 plugin.registerEvent(plugin.app.workspace.on('layout-change',()=>writerV92ResearchStyle(plugin)));
 plugin.app.workspace.onLayoutReady?.(()=>writerV92ResearchStyle(plugin));
 plugin.register?.(()=>{for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
  const root=leaf.view?.containerEl;
  if(root)writerV92ResearchStyleApply(root,plugin.settings.v92Research,false);
 }});
 plugin.addCommand?.({id:'v92-refresh-zotero-quotes',name:writerUi('Zotero: atualizar widget de citações','Zotero: refresh quote widget'),callback:()=>writerV92RefreshZoteroQuotes(plugin)});
 plugin.addCommand?.({id:'v92-toggle-reading-style',name:writerUi('Estilo de leitura: ativar/desativar','Reading style: toggle'),callback:async()=>{
  const cfg=plugin.settings.v92Research;cfg.styleEnabled=!cfg.styleEnabled;
  await plugin.saveSettings();writerV92ResearchStyle(plugin);
 }});
}
function writerV92ResearchSettings(plugin,panel){
 const cfg=plugin.settings.v92Research;
 panel.createEl('h3',{text:writerUi('Zotero e citações','Zotero & quotes')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Use referências de notas Markdown importadas e de um arquivo BibTeX no cofre. O widget usa os destaques das notas importadas.',
  'Use references from imported Markdown notes and a BibTeX file in the vault. The widget uses highlights from imported notes.'
 )});
 const saveQuoteSettings=async()=>{await plugin.saveSettings();writerV92RefreshZoteroQuotes(plugin);};
 new Setting(panel).setName(writerUi('Ativar fontes de pesquisa','Enable research sources')).addToggle(t=>t.setValue(cfg.enabled)
  .onChange(async v=>{cfg.enabled=v;await saveQuoteSettings();}));
 new Setting(panel).setName(writerUi('Usar destaques Zotero no widget de citações','Use Zotero highlights in quote widget'))
  .addToggle(t=>t.setValue(cfg.zoteroQuotes).onChange(async v=>{cfg.zoteroQuotes=v;await saveQuoteSettings();}));
 new Setting(panel).setName(writerUi('Pasta das notas importadas','Imported notes folder'))
  .addText(t=>t.setValue(cfg.zoteroFolder).onChange(async v=>{cfg.zoteroFolder=v.slice(0,180);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Tag das notas Zotero','Zotero note tag'))
  .addText(t=>t.setValue(cfg.zoteroTag).onChange(async v=>{cfg.zoteroTag=v.slice(0,70);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Arquivo BibTeX opcional','Optional BibTeX file'))
  .setDesc(writerUi('Caminho relativo ao cofre para um arquivo .bib. Deixe em branco para usar as notas importadas.',
   'Vault-relative path to a .bib file. Leave blank to use imported notes.'))
  .addText(t=>t.setPlaceholder('References/library.bib').setValue(cfg.zoteroBibFile)
   .onChange(async v=>{cfg.zoteroBibFile=v.trim().slice(0,500);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Origem das citações da página inicial','Homepage quote source'))
  .addDropdown(d=>d.addOption('both',writerUi('Misturar destaques Zotero e citações manuais','Mix Zotero highlights and manual quotes'))
   .addOption('prefer',writerUi('Preferir destaques Zotero','Prefer Zotero highlights'))
   .addOption('only',writerUi('Somente destaques Zotero','Zotero highlights only'))
   .setValue(cfg.zoteroQuoteMode).onChange(async v=>{cfg.zoteroQuoteMode=v;await saveQuoteSettings();}));
 panel.createEl('h3',{text:writerUi('Estilo de leitura','Reading style')});
 const saveStyle=async()=>{await plugin.saveSettings();writerV92ResearchStyle(plugin);};
 new Setting(panel).setName(writerUi('Ativar estilo por nota','Enable note styling'))
  .addToggle(t=>t.setValue(cfg.styleEnabled).onChange(async v=>{cfg.styleEnabled=v;await saveStyle();}));
 new Setting(panel).setName(writerUi('Impressão em preto e branco','Black-and-white printing'))
  .setDesc(writerUi('Usa tons de cinza na impressão e na exportação PDF com o estilo de leitura ativo.',
   'Use grayscale when printing or exporting PDF while reading style is active.'))
  .addToggle(t=>t.setValue(cfg.stylePrint).onChange(async v=>{cfg.stylePrint=v;await saveStyle();}));
 for(const [key,pt,en,min,max,step] of WRITER_V92_STYLE_RANGES)
  new Setting(panel).setName(writerUi(pt,en)).addSlider(s=>s.setLimits(min,max,step).setValue(cfg[key])
   .setDynamicTooltip().onChange(async v=>{cfg[key]=v;await saveStyle();}));
 new Setting(panel).setName(writerUi('Cor dos títulos (#RRGGBB)','Heading color (#RRGGBB)'))
  .addText(t=>t.setValue(cfg.headingAccent).setPlaceholder('#ffaa33').onChange(async v=>{
   cfg.headingAccent=/^#[0-9a-f]{6}$/i.test(v)?v:'';
   await saveStyle();
  }));
 const advanced=panel.createEl('details');
 advanced.createEl('summary',{text:writerUi('Cores de texto e títulos H1–H6','Text and H1–H6 heading styles')});
 const colorControl=(parent,name,value,set)=>new Setting(parent).setName(name).addText(t=>t.setValue(value)
  .setPlaceholder('#RRGGBB').onChange(async v=>{set(/^#[0-9a-f]{6}$/i.test(v)?v:'');await saveStyle();}));
 for(const [key,pt,en] of WRITER_V92_STYLE_COLORS.slice(1))
  colorControl(advanced,writerUi(pt,en),cfg[key],value=>{cfg[key]=value;});
 for(let i=0;i<6;i++){
  const heading='H'+(i+1)+' · ';
  new Setting(advanced).setName(heading+writerUi('Tamanho relativo','Relative size'))
   .setDesc(writerUi('Use 0 para manter o tamanho do tema.','Use 0 for the theme size.'))
   .addSlider(s=>s.setLimits(0,3,.05).setValue(cfg.headingSizes[i]).setDynamicTooltip()
    .onChange(async value=>{cfg.headingSizes[i]=value;await saveStyle();}));
  colorControl(advanced,heading+writerUi('Cor','Color'),cfg.headingColors[i],value=>{cfg.headingColors[i]=value;});
 }
 let presetName='';
 const presets=new Setting(panel).setName(writerUi('Perfis de estilo de leitura','Reading style presets'))
  .addText(t=>t.setPlaceholder(writerUi('Nome do perfil','Preset name')).onChange(value=>{presetName=value.trim().slice(0,45);}));
 presets.addButton(b=>b.setButtonText(writerUi('Salvar perfil','Save preset')).onClick(async()=>{
  if(!presetName)return;
  const index=cfg.stylePresets.findIndex(preset=>preset.name===presetName);
  const entry={name:presetName,values:writerV92ReadingStyleValues(cfg)};
  if(index<0&&cfg.stylePresets.length>=25){
   new Notice(writerUi('Remova um perfil antes de salvar outro.','Remove a preset before saving another.'));return;
  }
  if(index<0)cfg.stylePresets.push(entry);else cfg.stylePresets[index]=entry;
  await saveStyle();plugin.writerSettingsTab?.display?.();
 }));
 if(cfg.stylePresets.length){
  let selected='';
  const saved=new Setting(panel).setName(writerUi('Perfis de estilo salvos','Saved style presets'))
   .addDropdown(d=>{
    d.addOption('',writerUi('Escolher perfil','Choose preset'));
    for(const preset of cfg.stylePresets)d.addOption(preset.name,preset.name);
    d.onChange(value=>{selected=value;});
   });
  saved.addButton(b=>b.setButtonText(writerUi('Aplicar','Apply')).onClick(async()=>{
   const preset=cfg.stylePresets.find(item=>item.name===selected);if(!preset)return;
   Object.assign(cfg,writerV92ReadingStyleValues(preset.values));
   await saveStyle();plugin.writerSettingsTab?.display?.();
  }));
  saved.addButton(b=>b.setButtonText(writerUi('Remover','Remove')).onClick(async()=>{
   if(!selected)return;
   cfg.stylePresets=cfg.stylePresets.filter(item=>item.name!==selected);
   await saveStyle();plugin.writerSettingsTab?.display?.();
  }));
 }
}
