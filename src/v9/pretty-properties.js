'use strict';
/* v9.2.15: independent Pretty Properties-style enhancements, built on public
 * Obsidian APIs. Visual only: frontmatter stays editable in the native UI. */
function writerV9215PrettyMerge(settings){
 const raw=settings.v9215Pretty&&typeof settings.v9215Pretty==='object'?settings.v9215Pretty:{};
 const cfg=settings.v9215Pretty={enabled:true,banner:true,cover:true,icon:true,
  hidden:[],hiddenPerFile:{},propertyIcons:{},propertyActions:true,hideEmpty:false,reveal:false,progressKeys:'progress,completion',
  dateKeys:'due,date',colors:'',templates:'',tagColors:'',search:true,dueColors:true,dueSoonDays:3,
  coverShape:'rounded',coverPosition:'right',bannerPosition:'center',
  propertyColors:true,tagColorsEnabled:true,progressEnabled:true,dateFormatting:true,templatesEnabled:true,...raw};
 for(const key of ['enabled','banner','cover','icon','search','dueColors','propertyColors','tagColorsEnabled','progressEnabled','dateFormatting','templatesEnabled'])cfg[key]=cfg[key]!==false;
 cfg.coverShape=['rounded','square','circle'].includes(cfg.coverShape)?cfg.coverShape:'rounded';
 cfg.coverPosition=['left','right','center'].includes(cfg.coverPosition)?cfg.coverPosition:'right';
 cfg.bannerPosition=['top','center','bottom'].includes(cfg.bannerPosition)?cfg.bannerPosition:'center';
 cfg.dueSoonDays=Math.max(1,Math.min(30,Math.round(Number(cfg.dueSoonDays)||3)));
 cfg.hidden=Array.isArray(cfg.hidden)?[...new Set(cfg.hidden.map(x=>String(x).trim().toLowerCase()).filter(x=>/^[\w-]{1,100}$/.test(x)))].slice(0,80):[];
 cfg.hiddenPerFile=cfg.hiddenPerFile&&typeof cfg.hiddenPerFile==='object'&&!Array.isArray(cfg.hiddenPerFile)?Object.fromEntries(
  Object.entries(cfg.hiddenPerFile).filter(([path])=>typeof path==='string'&&path.length<=500).slice(0,400)
   .map(([path,values])=>[path,Array.isArray(values)?[...new Set(values.map(x=>String(x).toLowerCase())
    .filter(x=>/^[\w-]{1,100}$/.test(x)))].slice(0,80):[]])):{};
 cfg.propertyIcons=cfg.propertyIcons&&typeof cfg.propertyIcons==='object'&&!Array.isArray(cfg.propertyIcons)?
  Object.fromEntries(Object.entries(cfg.propertyIcons).slice(0,100).filter(([key,value])=>
   /^[\w-]{1,100}$/.test(key)&&typeof value==='string'&&value.length<=48)):{};
 cfg.propertyActions=cfg.propertyActions!==false;
 cfg.hideEmpty=cfg.hideEmpty===true;cfg.reveal=cfg.reveal===true;
 for(const key of ['progressKeys','dateKeys','colors','templates','tagColors'])cfg[key]=String(cfg[key]||'').slice(0,5000);
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
function writerV102PropertyMenu(plugin,file,key,event){
 const cfg=plugin.settings.v9215Pretty;
 const menu=new Menu(plugin.app),local=cfg.hiddenPerFile[file.path]||[];
 const save=async()=>{await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();};
 menu.addItem(item=>item.setTitle(local.includes(key)?
  writerUi('Mostrar nesta nota','Show in this note'):writerUi('Ocultar nesta nota','Hide in this note'))
  .setIcon(local.includes(key)?'eye':'eye-off').onClick(async()=>{
   const updated=local.includes(key)?local.filter(x=>x!==key):[...new Set([...local,key])];
   if(updated.length)cfg.hiddenPerFile[file.path]=updated;else delete cfg.hiddenPerFile[file.path];
   await save();
  }));
 menu.addItem(item=>item.setTitle(cfg.hidden.includes(key)?
  writerUi('Mostrar em todas as notas','Show in all notes'):writerUi('Ocultar em todas as notas','Hide in all notes'))
  .setIcon(cfg.hidden.includes(key)?'eye':'eye-off').onClick(async()=>{
   cfg.hidden=cfg.hidden.includes(key)?cfg.hidden.filter(x=>x!==key):[...cfg.hidden,key];
   await save();
  }));
 menu.addSeparator();
 menu.addItem(item=>item.setTitle(writerUi('Escolher ícone da propriedade','Choose property icon'))
  .setIcon('palette').onClick(()=>{
   writerV922OpenIconPicker(plugin,{
    title:writerUi('Ícone para ','Icon for ')+key,
    value:cfg.propertyIcons[key]||'',allowNone:true,defaultIcon:'tag',
    onApply:async icon=>{
     if(icon)cfg.propertyIcons[key]=String(icon).slice(0,48);
     else delete cfg.propertyIcons[key];
     await save();
    }
   });
  }));
 menu.addItem(item=>item.setTitle(cfg.reveal?
  writerUi('Esconder propriedades ocultas','Hide concealed properties'):
  writerUi('Revelar propriedades ocultas','Reveal hidden properties'))
  .setIcon(cfg.reveal?'eye-off':'eye').onClick(async()=>{cfg.reveal=!cfg.reveal;await save();}));
 if(event&&typeof menu.showAtMouseEvent==='function')menu.showAtMouseEvent(event);
 else menu.showAtPosition?.({x:window.innerWidth/2,y:Math.min(window.innerHeight/2,380)});
}
function writerV9215PrettyRenderLeaf(plugin,leaf){
 const cfg=plugin.settings.v9215Pretty,host=leaf.view?.containerEl,file=leaf.view?.file;
 if(!host)return;
 // Preserve the current filter when a metadata refresh redraws decorations.
 const previousSearch=host.querySelector('.writer-v9216-pretty-search')?.value||'';
 for(const el of host.querySelectorAll('.writer-v9215-pretty-banner,.writer-v9215-pretty-cover,.writer-v9215-pretty-icon,.writer-v9215-property-progress,.writer-v9215-property-caption,.writer-v9216-pretty-search,.writer-v102-property-actions,.writer-v102-property-custom-icon,.writer-v102-property-reveal'))el.remove();
 for(const title of host.querySelectorAll('.inline-title.writer-v93-title-icon-host')){
  if(!title.querySelector(':scope > .writer-v9-inline-title-icon'))title.classList.remove('writer-v93-title-icon-host');
 }
 for(const row of host.querySelectorAll('.metadata-property')){
  row.classList.remove('writer-v9215-property-hidden','writer-v9215-property-colored','writer-v9216-search-hidden','writer-v9216-date-overdue','writer-v9216-date-soon','writer-v102-property-has-icon','writer-v102-property-action-host');
  row.style.removeProperty('--writer-v9215-prop-color');
 }
 for(const tag of host.querySelectorAll('.writer-v9216-tag-colored')){
  tag.classList.remove('writer-v9216-tag-colored');tag.style.removeProperty('--writer-v9216-tag-color');
 }
 if(!cfg.enabled||!(file instanceof TFile)||file.extension!=='md')return;
 const fm=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter||{};
 const colors=writerV9215PrettyPairs(cfg.colors),templates=writerV9215PrettyPairs(cfg.templates),tagColors=writerV9215PrettyPairs(cfg.tagColors);
 const perFileHidden=new Set(cfg.hiddenPerFile?.[file.path]||[]);
 const progressKeys=new Set(cfg.progressKeys.split(',').map(x=>x.trim().toLowerCase()));
 const dateKeys=new Set(cfg.dateKeys.split(',').map(x=>x.trim().toLowerCase()));
 const target=host.querySelector('.inline-title');
 if(cfg.banner&&fm.banner){
  const url=writerV9215PrettyImage(plugin.app,file,fm.banner);
  if(url){
   const banner=host.ownerDocument.createElement('img');
   banner.className='writer-v9215-pretty-banner';banner.src=url;banner.alt='';
   banner.loading='lazy';banner.decoding='async';banner.style.objectPosition='center '+cfg.bannerPosition;
   const insertion=target||host.querySelector('.metadata-container');
   insertion?.parentNode?.insertBefore(banner,insertion);
  }
 }
 if(cfg.icon&&fm.icon&&target&&!target.querySelector('.writer-v9-inline-title-icon')){
  const span=host.ownerDocument.createElement('span');
  span.className='writer-v9215-pretty-icon';span.setAttribute('aria-hidden','true');span.setAttribute('contenteditable','false');
  writerV9215PrettyDecorateIcon(span,fm.icon);
  target.insertBefore(span,target.firstChild);
  target.classList.add('writer-v93-title-icon-host');
 }
 if(cfg.cover&&fm.cover){
  const url=writerV9215PrettyImage(plugin.app,file,fm.cover);
  const metadata=host.querySelector('.metadata-container');
  if(url&&metadata){
   const cover=host.ownerDocument.createElement('img');
   cover.className='writer-v9215-pretty-cover';cover.src=url;cover.alt='';
   cover.loading='lazy';cover.decoding='async';
   cover.classList.add('is-'+cfg.coverShape,'at-'+cfg.coverPosition);
   metadata.parentNode?.insertBefore(cover,metadata.nextSibling);
  }
 }
 for(const row of host.querySelectorAll('.metadata-property')){
  const key=writerV9215PrettyKey(row);if(!key)continue;
  const value=fm[key],text=Array.isArray(value)?value.join(', '):String(value??'');
  const empty=value===undefined||value===null||text.trim()==='';
  if(!cfg.reveal&&(cfg.hidden.includes(key)||perFileHidden.has(key)||(cfg.hideEmpty&&empty)))row.classList.add('writer-v9215-property-hidden');
   if(cfg.propertyIcons[key]){
    const keyWrap=row.querySelector('.metadata-property-key')||row;
    const glyph=keyWrap.ownerDocument.createElement('span');
    glyph.className='writer-v102-property-custom-icon';
    glyph.setAttribute('aria-label',writerUi('Ícone personalizado: ','Custom icon: ')+key);
    writerV9215PrettyDecorateIcon(glyph,cfg.propertyIcons[key]);
    keyWrap.insertBefore(glyph,keyWrap.firstChild);
    row.classList.add('writer-v102-property-has-icon');
   }
   if(cfg.propertyActions){
    row.classList.add('writer-v102-property-action-host');
    const button=row.ownerDocument.createElement('button');
    button.type='button';button.className='writer-v102-property-actions';
    button.setAttribute('title',writerUi('Opções da propriedade ','Property options ')+key);
    button.setAttribute('aria-label',writerUi('Opções da propriedade ','Property options ')+key);
    require('obsidian').setIcon?.(button,'ellipsis');
    button.addEventListener('pointerdown',event=>event.stopPropagation());
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();writerV102PropertyMenu(plugin,file,key,event);});
    row.appendChild(button);
    // Context menu also supports keyboard context key and mouse right click.
    if(!row.dataset.writerV102MenuBound){
     row.dataset.writerV102MenuBound='true';
     row.addEventListener('contextmenu',event=>{
      const current=writerV9215PrettyKey(row);if(!current)return;
      event.preventDefault();event.stopPropagation();
      writerV102PropertyMenu(plugin,leaf.view.file,current,event);
     });
    }
   }
  const color=colors[key];
  if(cfg.propertyColors&&/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(color||'')){
   row.classList.add('writer-v9215-property-colored');
   row.style.setProperty('--writer-v9215-prop-color',color);
  }
  const surface=row.querySelector('.metadata-property-value')||row;
  const number=typeof value==='string'?Number(value.trim().replace(/%$/,'')):Number(value);
  if(cfg.progressEnabled&&progressKeys.has(key)&&Number.isFinite(number)&&!empty){
   const amount=Math.max(0,Math.min(100,number));
   const bar=row.ownerDocument.createElement('div');bar.className='writer-v9215-property-progress';
   bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',key);
   bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
   bar.setAttribute('aria-valuenow',String(amount));
   const fill=bar.ownerDocument.createElement('span');fill.style.width=amount+'%';bar.appendChild(fill);
   surface.appendChild(bar);
  }
  let caption='';
  if(cfg.templatesEnabled&&templates[key])caption=templates[key].replace(/\{value\}/gi,text).slice(0,250);
  else if(cfg.dateFormatting&&dateKeys.has(key)&&/^\d{4}-\d\d-\d\d/.test(text)){
   const stamp=Date.parse(text);
   if(Number.isFinite(stamp))caption=new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),{dateStyle:'medium',timeZone:'UTC'}).format(new Date(stamp));
  }
  if(cfg.dueColors&&dateKeys.has(key)&&/^d{4}-dd-dd/.test(text)){
   const date=Date.parse(text.slice(0,10)+'T00:00:00Z');
   if(Number.isFinite(date)){
    const now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    const days=Math.round((date-today)/86400000);
    if(days<0)row.classList.add('writer-v9216-date-overdue');
    else if(days<=cfg.dueSoonDays)row.classList.add('writer-v9216-date-soon');
   }
  }
  if(cfg.tagColorsEnabled&&key==='tags'&&Object.keys(tagColors).length){
   for(const tag of row.querySelectorAll('.multi-select-pill,.tag')){
    const tagName=String(tag.textContent||'').trim().replace(/^#/,'').toLowerCase();
    const color=tagColors[tagName];
    if(/^#[da-f]{6}$/i.test(color||'')){
     tag.classList.add('writer-v9216-tag-colored');
     tag.style.setProperty('--writer-v9216-tag-color',color);
    }
   }
  }
  if(caption&&caption!==text){
   const label=row.ownerDocument.createElement('small');
   label.className='writer-v9215-property-caption';label.textContent=caption;
   surface.appendChild(label);
  }
 }
 const metadata=host.querySelector('.metadata-container');
 const firstRow=metadata?.querySelector('.metadata-property');
 // Native Obsidian collapses the .metadata-properties region, not the whole
 // metadata container. Place the filter INSIDE that region so it disappears
 // with the properties in Source/Live Preview as well as Reading mode.
 const properties=firstRow?.closest('.metadata-properties')||firstRow?.parentElement;
 if(properties&&firstRow){
   const hiddenCount=host.querySelectorAll('.writer-v9215-property-hidden').length;
   const reveal=metadata.ownerDocument.createElement('button');
   reveal.className='writer-v102-property-reveal';reveal.type='button';
   const text=cfg.reveal?writerUi('Ocultar campos escondidos','Hide concealed fields'):
    writerUi('Mostrar campos escondidos','Show concealed fields');
   reveal.setAttribute('aria-label',text);reveal.setAttribute('title',text);
   const label=metadata.ownerDocument.createElement('span');
   label.textContent=cfg.reveal?writerUi('Ocultar campos','Hide fields'):
    writerUi('Ocultos: ','Hidden: ')+hiddenCount;
   require('obsidian').setIcon?.(reveal,cfg.reveal?'eye-off':'eye');
   reveal.appendChild(label);
   reveal.addEventListener('click',async()=>{cfg.reveal=!cfg.reveal;await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();});
   properties.insertBefore(reveal,properties.firstChild);
  }
  if(cfg.search&&properties&&firstRow){
  const input=metadata.ownerDocument.createElement('input');
  input.className='writer-v9216-pretty-search';input.type='search';
  input.placeholder=writerUi('Filtrar propriedades…','Filter properties…');
  input.setAttribute('aria-label',input.placeholder);
  input.value=previousSearch;
  properties.insertBefore(input,properties.firstChild);
  const filter=()=>{
   const query=input.value.trim().toLocaleLowerCase();
   for(const row of metadata.querySelectorAll('.metadata-property')){
    const property=writerV9215PrettyKey(row);
    row.classList.toggle('writer-v9216-search-hidden',Boolean(query&&!property.includes(query)));
   }
  };
  input.addEventListener('input',filter);filter();
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
 if(typeof plugin.app.metadataCache?.on==='function')
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
 toggle('propertyColors','Colorir propriedades','Color properties');
 toggle('tagColorsEnabled','Colorir tags','Color tags');
 toggle('progressEnabled','Barras de progresso','Progress bars');
 toggle('dateFormatting','Formatação de datas','Date formatting');
 toggle('templatesEnabled','Modelos de exibição','Display templates');
 toggle('search','Pesquisa rápida nas propriedades','Property quick search');
  toggle('propertyActions','Menu de ocultar e personalizar ícones direto nas propriedades','Hide and customize icons from property rows');
 toggle('dueColors','Destacar datas próximas e vencidas','Highlight approaching and past dates');
 const dropdown=(key,pt,en,items)=>new Setting(panel).setName(writerUi(pt,en)).addDropdown(d=>{
  for(const [id,ptLabel,enLabel] of items)d.addOption(id,writerUi(ptLabel,enLabel));
  d.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();});
 });
 dropdown('coverShape','Formato da capa','Cover shape',[
  ['rounded','Arredondado','Rounded'],['square','Quadrado','Square'],['circle','Circular','Circular']]);
 dropdown('coverPosition','Posição da capa','Cover position',[
  ['left','Esquerda','Left'],['right','Direita','Right'],['center','Centro','Center']]);
 dropdown('bannerPosition','Posição da imagem do banner','Banner image position',[
  ['top','Topo','Top'],['center','Centro','Center'],['bottom','Inferior','Bottom']]);
 new Setting(panel).setName(writerUi('Avisar com antecedência (dias)','Due soon threshold (days)'))
  .addSlider(sl=>sl.setLimits(1,30,1).setValue(cfg.dueSoonDays).setDynamicTooltip().onChange(async value=>{
   cfg.dueSoonDays=value;await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();
  }));
 const list=(key,pt,en,desc)=>new Setting(panel).setName(writerUi(pt,en)).setDesc(desc).addTextArea(t=>t.setValue(Array.isArray(cfg[key])?cfg[key].join('\n'):cfg[key]).onChange(async value=>{
  cfg[key]=key==='hidden'?value.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean):value;
  await plugin.saveSettings();plugin.writerV9215PrettyRefresh?.();
 }));
 list('hidden','Campos ocultos','Hidden properties',writerUi('Uma chave YAML por linha','One YAML key per line'));
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Toque no menu ⋯ de cada propriedade para ocultá-la nesta nota ou em todas as notas, ou atribuir um ícone. O YAML permanece intacto.','Use the ⋯ menu on each property to hide it in this note or across the vault, or assign an icon. YAML stays intact.')});
  list('colors','Cores por propriedade','Property colors','status=#70a783');
 list('tagColors','Cores por tag','Tag colors','book=#70a783');
 list('progressKeys','Propriedades de progresso','Progress properties','progress,completion');
 list('dateKeys','Datas formatadas','Formatted dates','due,date');
 list('templates','Modelos de exibição','Display templates','status=Status: {value}');
}
