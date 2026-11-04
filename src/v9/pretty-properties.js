'use strict';
/* v9.2.15: independent Pretty Properties-style enhancements, built on public
 * Obsidian APIs. Visual only: frontmatter stays editable in the native UI. */
function writerV9215PrettyMerge(settings){
 const raw=settings.v9215Pretty&&typeof settings.v9215Pretty==='object'?settings.v9215Pretty:{};
 const cfg=settings.v9215Pretty={enabled:true,banner:true,cover:true,icon:true,
  hidden:[],hideEmpty:false,reveal:false,progressKeys:'progress,completion',
  dateKeys:'due,date',colors:'',templates:'',...raw};
 for(const key of ['enabled','banner','cover','icon'])cfg[key]=cfg[key]!==false;
 cfg.hidden=Array.isArray(cfg.hidden)?[...new Set(cfg.hidden.map(x=>String(x).trim().toLowerCase()).filter(Boolean))].slice(0,80):[];
 cfg.hideEmpty=cfg.hideEmpty===true;cfg.reveal=cfg.reveal===true;
 for(const key of ['progressKeys','dateKeys','colors','templates'])cfg[key]=String(cfg[key]||'').slice(0,5000);
 return cfg;
}
function writerV9215PrettyImage(app,source,raw){
 let ref=Array.isArray(raw)?raw[0]:raw;
 if(typeof ref!=='string'||!ref.trim())return '';
 ref=ref.trim().replace(/^!?\[\[|\]\]$/g,'');
 const markdown=/^!?\[[^\]]*\]\(([^)]+)\)$/.exec(ref);
 if(markdown)ref=markdown[1];
 ref=ref.split('|')[0].split('#')[0].trim();
 try{ref=decodeURIComponent(ref);}catch(_){}
 // Keep decoration offline/private; never download remote frontmatter URLs.
 if(/^(?:https?:|data:|file:)/i.test(ref))return '';
 const file=app.vault.getAbstractFileByPath(ref)||
  app.metadataCache.getFirstLinkpathDest?.(ref,source.path);
 if(!file||!file.path||file.extension==='md')return '';
 return app.vault.getResourcePath(file);
}
function writerV9215PrettyPairs(raw){
 const out={};
 for(const row of String(raw||'').split(/\r?\n/)){
  const pos=row.indexOf('=');if(pos<1)continue;
  const key=row.slice(0,pos).trim().toLowerCase(),value=row.slice(pos+1).trim();
  if(key&&value)out[key]=value.slice(0,180);
 }
 return out;
}
function writerV9215PrettyKey(row){
 const input=row.querySelector('.metadata-property-key-input');
 return String(row.getAttribute('data-property-key')||input?.value||
  input?.textContent||row.querySelector('.metadata-property-key')?.textContent||'').trim().toLowerCase();
}
function writerV9215PrettyDecorateIcon(node,name){
 const icons=require('obsidian');
 const value=String(name||'').trim();
 if(!value)return;
 if(icons.getIcon?.(value)){icons.setIcon(node,value);return;}
 node.textContent=value.slice(0,8);
}
function writerV9215PrettyRenderLeaf(plugin,leaf){
 const cfg=plugin.settings.v9215Pretty,host=leaf.view?.containerEl,file=leaf.view?.file;
 if(!host)return;
 for(const el of host.querySelectorAll('.writer-v9215-pretty-banner,.writer-v9215-pretty-cover,.writer-v9215-pretty-icon,.writer-v9215-property-progress,.writer-v9215-property-caption'))el.remove();
 for(const row of host.querySelectorAll('.metadata-property')){
  row.classList.remove('writer-v9215-property-hidden','writer-v9215-property-colored');
  row.style.removeProperty('--writer-v9215-prop-color');
 }
 if(!cfg.enabled||!(file instanceof TFile)||file.extension!=='md')return;
 const fm=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter||{};
 const colors=writerV9215PrettyPairs(cfg.colors),templates=writerV9215PrettyPairs(cfg.templates);
 const progressKeys=new Set(cfg.progressKeys.split(',').map(x=>x.trim().toLowerCase()));
 const dateKeys=new Set(cfg.dateKeys.split(',').map(x=>x.trim().toLowerCase()));
 const target=host.querySelector('.inline-title');
 if(cfg.banner&&fm.banner){
  const url=writerV9215PrettyImage(plugin.app,file,fm.banner);
  if(url){
   const banner=host.ownerDocument.createElement('img');
   banner.className='writer-v9215-pretty-banner';banner.src=url;banner.alt='';
   banner.loading='lazy';banner.decoding='async';
   const insertion=target||host.querySelector('.metadata-container');
   insertion?.parentNode?.insertBefore(banner,insertion);
  }
 }
 if(cfg.icon&&fm.icon&&target&&!target.querySelector('.writer-v9-inline-title-icon')){
  const span=host.ownerDocument.createElement('span');
  span.className='writer-v9215-pretty-icon';span.setAttribute('aria-hidden','true');
  writerV9215PrettyDecorateIcon(span,fm.icon);
  target.insertBefore(span,target.firstChild);
 }
 if(cfg.cover&&fm.cover){
  const url=writerV9215PrettyImage(plugin.app,file,fm.cover);
  const metadata=host.querySelector('.metadata-container');
  if(url&&metadata){
   const cover=host.ownerDocument.createElement('img');
   cover.className='writer-v9215-pretty-cover';cover.src=url;cover.alt='';
   cover.loading='lazy';cover.decoding='async';
   metadata.parentNode?.insertBefore(cover,metadata.nextSibling);
  }
 }
 for(const row of host.querySelectorAll('.metadata-property')){
  const key=writerV9215PrettyKey(row);if(!key)continue;
  const value=fm[key],text=Array.isArray(value)?value.join(', '):String(value??'');
  const empty=value===undefined||value===null||text.trim()==='';
  if(!cfg.reveal&&(cfg.hidden.includes(key)||(cfg.hideEmpty&&empty)))row.classList.add('writer-v9215-property-hidden');
  const color=colors[key];
  if(/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(color||'')){
   row.classList.add('writer-v9215-property-colored');
   row.style.setProperty('--writer-v9215-prop-color',color);
  }
  const surface=row.querySelector('.metadata-property-value')||row;
  if(progressKeys.has(key)&&Number.isFinite(Number(value))&&!empty){
   const amount=Math.max(0,Math.min(100,Number(value)));
   const bar=row.ownerDocument.createElement('div');bar.className='writer-v9215-property-progress';
   bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',key);
   bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
   bar.setAttribute('aria-valuenow',String(amount));
   const fill=bar.ownerDocument.createElement('span');fill.style.width=amount+'%';bar.appendChild(fill);
   surface.appendChild(bar);
  }
  let caption='';
  if(templates[key])caption=templates[key].replace(/\{value\}/gi,text).slice(0,250);
  else if(dateKeys.has(key)&&/^\d{4}-\d\d-\d\d/.test(text)){
   const stamp=Date.parse(text);
   if(Number.isFinite(stamp))caption=new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),{dateStyle:'medium',timeZone:'UTC'}).format(new Date(stamp));
  }
  if(caption&&caption!==text){
   const label=row.ownerDocument.createElement('small');
   label.className='writer-v9215-property-caption';label.textContent=caption;
   surface.appendChild(label);
  }
 }
}
function writerV9215PrettyImagePicker(plugin,key){
 const active=plugin.app.workspace.getActiveFile?.();
 if(!(active instanceof TFile)||active.extension!=='md')return;
 const Suggest=require('obsidian').FuzzySuggestModal;
 const modal=new (class extends Suggest{
  getItems(){return plugin.app.vault.getFiles().filter(f=>/^(png|jpe?g|gif|webp|svg)$/i.test(f.extension));}
  getItemText(file){return file.path;}
  async onChooseItem(file){
   try{
    await plugin.app.fileManager.processFrontMatter(active,fm=>{fm[key]='[['+file.path+']]';});
    plugin.writerV9215PrettyRefresh?.();
   }catch(error){new Notice(String(error.message||error));}
  }
 })(plugin.app);
 modal.setPlaceholder(writerUi('Escolher imagem do cofre…','Choose a vault image…'));
 modal.open();
}
function writerV9215PrettyRegister(plugin){
 let timer=null;
 const refresh=()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{
   for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])writerV9215PrettyRenderLeaf(plugin,leaf);
  },140);
 };
 plugin.writerV9215PrettyRefresh=refresh;
 for(const event of ['file-open','layout-change'])plugin.registerEvent(plugin.app.workspace.on(event,refresh));
 plugin.registerEvent(plugin.app.metadataCache.on('changed',refresh));
 plugin.app.workspace.onLayoutReady?.(refresh);
 for(const [id,key,pt,en] of [
  ['cover','cover','Propriedades: escolher capa da nota','Properties: choose note cover'],
  ['banner','banner','Propriedades: escolher banner','Properties: choose banner']]){
  plugin.addCommand({id:'v9215-pretty-'+id,name:writerUi(pt,en),callback:()=>writerV9215PrettyImagePicker(plugin,key)});
 }
 plugin.addCommand({id:'v9215-pretty-icon',name:writerUi('Propriedades: escolher ícone','Properties: choose icon'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile?.();
  if(!(file instanceof TFile))return;
  writerV922OpenIconPicker(plugin,{title:writerUi('Ícone da nota','Note icon'),value:'',allowNone:true,
   onApply:async icon=>{
    await plugin.app.fileManager.processFrontMatter(file,fm=>{if(icon)fm.icon=icon;else delete fm.icon;});
    refresh();
   }});
 }});
 plugin.addCommand({id:'v9215-pretty-toggle-hidden',name:writerUi('Propriedades: mostrar/ocultar campos escondidos','Properties: reveal/hide hidden fields'),callback:async()=>{
  plugin.settings.v9215Pretty.reveal=!plugin.settings.v9215Pretty.reveal;
  await plugin.saveSettings();refresh();
 }});
 plugin.register?.(()=>{clearTimeout(timer);plugin.writerV9215PrettyRefresh=null;});
}
function writerV9215PrettySettings(plugin,panel){
 const cfg=plugin.settings.v9215Pretty;
 panel.createEl('h3',{text:writerUi('Propriedades visuais','Visual properties')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Capas, banners, ícones, cores, progresso e propriedades ocultas. Usa o YAML normal, sem alterar o editor nativo.','Covers, banners, icons, colors, progress and hidden properties. Uses normal YAML without replacing the native editor.')});
 const toggle=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();}));
 toggle('enabled','Ativar propriedades visuais','Enable visual properties');
 toggle('banner','Mostrar banner YAML','Show YAML banner');
 toggle('cover','Mostrar capa YAML','Show YAML cover');
 toggle('icon','Mostrar ícone do YAML','Show YAML note icon');
 toggle('hideEmpty','Ocultar campos vazios','Hide empty fields');
 toggle('reveal','Revelar campos escondidos','Reveal hidden fields');
 const list=(key,pt,en,desc)=>new Setting(panel).setName(writerUi(pt,en)).setDesc(desc).addTextArea(t=>t.setValue(Array.isArray(cfg[key])?cfg[key].join('\n'):cfg[key]).onChange(async value=>{
  cfg[key]=key==='hidden'?value.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean):value;
  await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();
 }));
 list('hidden','Campos ocultos','Hidden properties',writerUi('Uma chave YAML por linha','One YAML key per line'));
 list('colors','Cores por propriedade','Property colors','status=#70a783');
 list('progressKeys','Propriedades de progresso','Progress properties','progress,completion');
 list('dateKeys','Datas formatadas','Formatted dates','due,date');
 list('templates','Modelos de exibição','Display templates','status=Status: {value}');
}
