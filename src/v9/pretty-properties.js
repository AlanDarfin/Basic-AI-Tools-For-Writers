'use strict';
/* v9.3.0: original Pretty Properties-inspired visual metadata layer.
 * Uses public vault/frontmatter APIs, never patches Obsidian internals.
 * No third-party CSS/JS copied from Pretty Properties. */
function writerV93PrettyMerge(settings){
 const previous=settings.v93Pretty&&typeof settings.v93Pretty==='object'&&!Array.isArray(settings.v93Pretty)?settings.v93Pretty:{};
 const cfg=settings.v93Pretty={
  enabled:true,titleIcons:true,covers:true,banners:true,hideEmpty:false,
  showHidden:false,hiddenProperties:[],colorRules:{},progressRules:{},selectOptions:{},
  coverProperty:'cover',bannerProperty:'banner',...previous
 };
 const booleanFields=['enabled','titleIcons','covers','banners','hideEmpty','showHidden'];
 for(const key of booleanFields)cfg[key]=key==='showHidden'||key==='hideEmpty'?cfg[key]===true:cfg[key]!==false;
 for(const key of ['coverProperty','bannerProperty'])
  cfg[key]=/^[\w-]{1,50}$/.test(cfg[key])?cfg[key]:key==='coverProperty'?'cover':'banner';
 cfg.hiddenProperties=Array.isArray(cfg.hiddenProperties)?[...new Set(cfg.hiddenProperties.filter(s=>typeof s==='string'&&/^[\w-]{1,60}$/.test(s)))].slice(0,100):[];
 const colors={},progress={},selects={};
 const oldColors=cfg.colorRules&&typeof cfg.colorRules==='object'&&!Array.isArray(cfg.colorRules)?cfg.colorRules:{};
 for(const [property,values] of Object.entries(oldColors).slice(0,60)){
  if(!/^[\w-]{1,60}$/.test(property)||!values||typeof values!=='object'||Array.isArray(values))continue;
  const clean={};
  for(const [value,color] of Object.entries(values).slice(0,80))
   if(value.length<=120&&/^#[\da-f]{6}$/i.test(color))clean[value]=color;
  if(Object.keys(clean).length)colors[property]=clean;
 }
 const oldProgress=cfg.progressRules&&typeof cfg.progressRules==='object'&&!Array.isArray(cfg.progressRules)?cfg.progressRules:{};
 for(const [key,value] of Object.entries(oldProgress).slice(0,60)){
  if(!/^[\w-]{1,60}$/.test(key))continue;
  const maximum=typeof value==='number'?value:typeof value==='string'&&/^[\w-]{1,60}$/.test(value)?value:Number(value);
  if(typeof maximum==='string'||Number.isFinite(maximum)&&maximum>0&&maximum<=10000000)
   progress[key]=maximum;
 }
 const oldSelects=cfg.selectOptions&&typeof cfg.selectOptions==='object'&&!Array.isArray(cfg.selectOptions)?cfg.selectOptions:{};
 for(const [key,values] of Object.entries(oldSelects).slice(0,60))
  if(/^[\w-]{1,60}$/.test(key)&&Array.isArray(values)){
   const options=[...new Set(values.filter(value=>typeof value==='string'&&value.trim().length<=90).map(value=>value.trim()).filter(Boolean))].slice(0,30);
   if(options.length)selects[key]=options;
  }
 cfg.colorRules=colors;cfg.progressRules=progress;cfg.selectOptions=selects;
 return cfg;
}
function writerV93PrettyRulesParse(text){
 const out={};
 for(const line of String(text||'').split(/\r?\n/).slice(0,150)){
  const match=/^\s*([\w-]+)\s*:\s*([^=]+?)\s*=\s*(#[\da-f]{6})\s*$/i.exec(line);
  if(!match)continue;
  const value=match[2].trim().slice(0,120);
  if(!value)continue;
  (out[match[1]]||(out[match[1]]={}))[value]=match[3];
 }
 return out;
}
function writerV93PrettyProgressParse(text){
 const result={};
 for(const line of String(text||'').split(/\r?\n/).slice(0,100)){
  const match=/^\s*([\w-]+)\s*:\s*([\w.-]+)\s*$/.exec(line);
  if(!match)continue;
  const value=Number(match[2]);
  if(Number.isFinite(value)&&value>0&&value<=10000000)result[match[1]]=value;
  else if(/^[\w-]+$/.test(match[2]))result[match[1]]=match[2];
 }
 return result;
}
function writerV93PrettySelectParse(text){
 const out={};
 for(const line of String(text||'').split(/\r?\n/).slice(0,100)){
  const match=/^\s*([\w-]+)\s*:\s*(.*)$/.exec(line);
  if(!match)continue;
  const values=[...new Set(match[2].split('|').map(s=>s.trim()).filter(s=>s&&s.length<=90))].slice(0,30);
  if(values.length)out[match[1]]=values;
 }
 return out;
}
function writerV93PrettyValue(value){
 if(Array.isArray(value))return value.join(', ');
 return value===null||value===undefined?'':String(value);
}
function writerV93PrettyPropertyName(node){
 return node.getAttribute('data-property-key')||node.dataset?.propertyKey||
  node.querySelector('.metadata-property-key-input')?.value||'';
}
function writerV93PrettyUpdateIcon(plugin,view,file){
 const title=view.containerEl?.querySelector('.inline-title');
 if(!title)return;
 let glyph=title.querySelector(':scope > .writer-v93-title-icon');
 const record=plugin.settings.v9Explorer?.items?.[file.path]||{};
 const front=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 const cfg=plugin.settings.v93Pretty;
 const custom=String(record.icon||cfg.titleIcons&&front.icon||'');
 const valid=/^[a-z][a-z0-9-]{0,60}$/.test(custom) &&
  (typeof writerV9AvailableIcons!=='function'||writerV9AvailableIcons().includes(custom));
 const name=cfg.enabled&&cfg.titleIcons&&valid?custom:'';
 if(!name){glyph?.remove();title.classList.remove('writer-v93-has-title-icon');return;}
 if(!glyph){
  glyph=title.ownerDocument.createElement('span');
  glyph.className='writer-v93-title-icon';
  glyph.setAttribute('aria-hidden','true');
  title.prepend(glyph);
 }
 if(glyph.dataset.icon!==name){
  glyph.replaceChildren();
  require('obsidian').setIcon(glyph,name);
  glyph.dataset.icon=name;
 }
 const color=/^#[\da-f]{6}$/i.test(record.color||'')?record.color:'';
 if(color)glyph.style.color=color;else glyph.style.removeProperty('color');
 title.classList.add('writer-v93-has-title-icon');
}
function writerV93PrettyImage(plugin,file,value){
 if(!value||typeof writerV921ResolveImage!=='function')return '';
 const source=writerV921ResolveImage(plugin,file,Array.isArray(value)?value[0]:value);
 return source?.path?plugin.app.vault.getResourcePath(source):'';
}
function writerV93PrettyUpdateView(plugin,view){
 if(!view?.containerEl||!(view.file instanceof TFile))return;
 const root=view.containerEl,file=view.file,cfg=plugin.settings.v93Pretty;
 const front=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 if(!cfg.enabled){
  root.querySelectorAll('.writer-v93-pretty-cover,.writer-v93-pretty-banner,.writer-v93-title-icon,.writer-v93-meta-progress,.writer-v93-meta-select').forEach(el=>el.remove());
  root.querySelectorAll('.writer-v93-property-hidden,.writer-v93-property-colored').forEach(el=>{
   el.classList.remove('writer-v93-property-hidden','writer-v93-property-colored');
   el.style.removeProperty('--writer-v93-property-bg');
  });
  root.querySelector('.inline-title')?.classList.remove('writer-v93-has-title-icon');
  return;
 }
 writerV93PrettyUpdateIcon(plugin,view,file);
 const panes=Array.from(root.querySelectorAll('.metadata-container'));
 for(const metadata of panes){
  const placement=(name,key,enabled)=>{
   let wrap=metadata.parentElement?.querySelector(':scope > .writer-v93-pretty-'+name);
   const url=enabled?writerV93PrettyImage(plugin,file,front[key]):'';
   if(!url){wrap?.remove();return;}
   if(!wrap){
    wrap=metadata.ownerDocument.createElement('div');
    wrap.className='writer-v93-pretty-'+name;
    metadata.insertAdjacentElement('beforebegin',wrap);
    const image=metadata.ownerDocument.createElement('img');
    image.alt=writerUi(name==='banner'?'Banner da nota':'Capa da nota',name==='banner'?'Note banner':'Note cover');
    image.loading='lazy';wrap.appendChild(image);
   }
   const image=wrap.querySelector('img');
   if(image&&image.src!==url)image.src=url;
  };
  placement('banner',cfg.bannerProperty,cfg.banners);
  placement('cover',cfg.coverProperty,cfg.covers);
  for(const row of metadata.querySelectorAll('.metadata-property')){
   const key=writerV93PrettyPropertyName(row);
   if(!key)continue;
   const raw=front[key],value=writerV93PrettyValue(raw);
   const hidden=!cfg.showHidden&&(cfg.hiddenProperties.includes(key)||(cfg.hideEmpty&&value.trim()===''));
   row.classList.toggle('writer-v93-property-hidden',hidden);
   const color=cfg.colorRules[key]?.[value];
   row.classList.toggle('writer-v93-property-colored',Boolean(color));
   if(color)row.style.setProperty('--writer-v93-property-bg',color);
   else row.style.removeProperty('--writer-v93-property-bg');
   const number=Number(raw),limit=cfg.progressRules[key];
   let bar=row.querySelector(':scope > .writer-v93-meta-progress');
   const max=typeof limit==='string'?Number(front[limit]):Number(limit);
   if(!Number.isFinite(number)||!Number.isFinite(max)||max<=0||!cfg.progressRules[key]){
    bar?.remove();
   }else{
    if(!bar){
     bar=row.ownerDocument.createElement('progress');bar.className='writer-v93-meta-progress';
     row.appendChild(bar);
    }
    bar.max=max;bar.value=Math.max(0,Math.min(max,number));
    bar.setAttribute('aria-label',key+': '+number+' / '+max);
   }
   let picker=row.querySelector(':scope > .writer-v93-meta-select');
   const options=cfg.selectOptions[key];
   if(!options?.length){picker?.remove();continue;}
   if(!picker){
    picker=row.ownerDocument.createElement('button');picker.type='button';
    picker.className='writer-v93-meta-select clickable-icon';
    picker.setAttribute('aria-label',writerUi('Selecionar propriedade: ','Select property: ')+key);
    require('obsidian').setIcon(picker,'chevron-down');
    picker.addEventListener('click',event=>{
     event.preventDefault();event.stopPropagation();
     const menu=new (require('obsidian').Menu)();
     for(const option of plugin.settings.v93Pretty.selectOptions[key]||[]){
      menu.addItem(item=>item.setTitle(option).onClick(async()=>{
       if(!plugin.app.fileManager?.processFrontMatter)return;
       await plugin.app.fileManager.processFrontMatter(file,frontmatter=>{frontmatter[key]=option;});
      }));
     }
     menu.showAtMouseEvent(event);
    });
    row.appendChild(picker);
   }
  }
 }
}
function writerV93PrettyRegister(plugin){
 const cfg=plugin.settings.v93Pretty;
 let timer=null;
 const refresh=()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>{
   for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])
    writerV93PrettyUpdateView(plugin,leaf.view);
  },90);
 };
 plugin.writerV93PrettyRefresh=refresh;
 for(const key of ['file-open','layout-change','active-leaf-change'])
  plugin.registerEvent(plugin.app.workspace.on(key,refresh));
 if(plugin.app.metadataCache?.on)
  plugin.registerEvent(plugin.app.metadataCache.on('changed',refresh));
 const observers=new Map();
 const attach=()=>{
  if(typeof MutationObserver==='undefined'){refresh();return;}
  const roots=new Set((plugin.app.workspace.getLeavesOfType?.('markdown')||[])
   .map(leaf=>leaf.view?.containerEl).filter(Boolean));
  for(const [root,obs] of observers){
   if(!roots.has(root)){obs.disconnect();observers.delete(root);}
  }
  for(const root of roots){
   if(observers.has(root))continue;
   const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&!node.closest?.('.writer-v93-pretty-cover,.writer-v93-pretty-banner,.writer-v93-title-icon,.writer-v93-meta-progress,.writer-v93-meta-select'))))
     refresh();
   });
   observer.observe(root,{childList:true,subtree:true});
   observers.set(root,observer);
  }
  refresh();
 };
 plugin.app.workspace.onLayoutReady?.(attach);
 plugin.registerEvent(plugin.app.workspace.on('layout-change',attach));
 plugin.addCommand({id:'v93-pretty-toggle-hidden',name:writerUi('Propriedades: mostrar/ocultar campos escondidos','Properties: show/hide hidden fields'),callback:async()=>{
  cfg.showHidden=!cfg.showHidden;await plugin.saveSettings();refresh();
 }});
 plugin.register?.(()=>{clearTimeout(timer);for(const observer of observers.values())observer.disconnect();observers.clear();plugin.writerV93PrettyRefresh=null;});
}
function writerV93PrettySettings(plugin,panel){
 const cfg=plugin.settings.v93Pretty;
 panel.createEl('h3',{text:writerUi('Propriedades visuais','Visual properties')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Primeira integração inspirada no Pretty Properties: capas e banners locais, ícone da nota, cores, campos ocultos, progresso numérico e botões de seleção. Alterações visuais não editam YAML; o seletor só altera a propriedade quando clicado. Recursos avançados de templates Handlebars ainda não foram portados.',
  'Initial Pretty Properties-inspired integration: vault-local covers and banners, note icon, value colors, hidden fields, numeric progress and select buttons. Visual styling never edits YAML; only explicit selection updates a property. Advanced Handlebars templates are not implemented yet.'
 )});
 for(const [key,pt,en] of [
  ['enabled','Ativar propriedades visuais','Enable visual properties'],
  ['titleIcons','Mostrar ícone personalizado ao lado do título','Show custom icon beside note title'],
  ['covers','Mostrar capa junto às propriedades','Show cover near properties'],
  ['banners','Mostrar banner junto às propriedades','Show banner near properties'],
  ['hideEmpty','Ocultar propriedades vazias','Hide empty properties'],
  ['showHidden','Revelar campos ocultos','Reveal hidden fields']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(toggle=>toggle.setValue(cfg[key]).onChange(async value=>{
   cfg[key]=value;await plugin.saveSettings();plugin.writerV93PrettyRefresh?.();
  }));
 }
 for(const [key,pt,en] of [['coverProperty','Chave YAML da capa','Cover YAML key'],['bannerProperty','Chave YAML do banner','Banner YAML key']])
  new Setting(panel).setName(writerUi(pt,en)).addText(input=>input.setValue(cfg[key])
   .onChange(async value=>{if(!/^[\w-]{1,50}$/.test(value))return;cfg[key]=value;await plugin.saveSettings();plugin.writerV93PrettyRefresh?.();}));
 const area=(pt,en,value,save,example)=>{
  new Setting(panel).setName(writerUi(pt,en)).setDesc(example).addTextArea(text=>{
   text.inputEl.rows=4;text.setValue(value).onChange(async input=>{
    save(input);await plugin.saveSettings();plugin.writerV93PrettyRefresh?.();
   });
  });
 };
 area('Ocultar campos (uma chave por linha)','Hide fields (one key per line)',
  cfg.hiddenProperties.join('\n'),text=>{cfg.hiddenProperties=[...new Set(text.split(/\r?\n/).map(s=>s.trim()).filter(s=>/^[\w-]{1,60}$/.test(s)))].slice(0,100);},
  'id\nfolderPath');
 area('Cores por valor','Value colors',
  Object.entries(cfg.colorRules).flatMap(([key,values])=>Object.entries(values).map(([value,color])=>key+': '+value+' = '+color)).join('\n'),
  text=>{cfg.colorRules=writerV93PrettyRulesParse(text);},'status: done = #60a47c');
 area('Progresso numérico','Numeric progress',
  Object.entries(cfg.progressRules).map(([key,max])=>key+': '+max).join('\n'),
  text=>{cfg.progressRules=writerV93PrettyProgressParse(text);},'progress: 100\nwords: goal');
 area('Opções de seleção','Selection options',
  Object.entries(cfg.selectOptions).map(([key,values])=>key+': '+values.join(' | ')).join('\n'),
  text=>{cfg.selectOptions=writerV93PrettySelectParse(text);},'status: Draft | Revising | Complete');
}
