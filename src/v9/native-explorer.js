'use strict';
/* v9: Make.md-inspired file organization in the native Obsidian File Explorer.
 * Original implementation; no Make.md source code or replacement sidebar. */
const WRITER_V9_EXPLORER_ICONS=['file','file-text','folder','folder-open','book-open','book','notebook-pen','library','feather','pen-line','star','heart','bookmark','pin','house','briefcase','archive','box','layers','layout-grid','list','calendar','calendar-days','clock','list-check','check-circle','graduation-cap','lightbulb','brain','sparkles','wand-sparkles','image','images','music','video','film','globe','link','code','terminal','settings','user','users','message-circle','tag','hash','flag','map','compass','leaf','sun','moon-star','cloud','rocket','palette','flower-2'];
const WRITER_V9_EXPLORER_COLORS=['','#e35d6a','#dc9b30','#60a47c','#579ec2','#9b79c5','#d378aa'];
function writerV9ExplorerMerge(settings){
 const cfg=settings.v9Explorer={...{enabled:true,showIcons:true,showTitleIcons:true,showColor:true,items:{},maxResults:100},
  ...(settings.v9Explorer&&typeof settings.v9Explorer==='object'?settings.v9Explorer:{})};
 cfg.enabled=cfg.enabled!==false;cfg.showIcons=cfg.showIcons!==false;cfg.showColor=cfg.showColor!==false;
 cfg.showTitleIcons=cfg.showTitleIcons!==false;
 cfg.maxResults=Math.max(20,Math.min(200,Number(cfg.maxResults)||100));
 cfg.items=cfg.items&&typeof cfg.items==='object'&&!Array.isArray(cfg.items)?cfg.items:{};
 const out={};
 const availableIcons=new Set(writerV9AvailableIcons());
 for(const [path,raw] of Object.entries(cfg.items).slice(0,5000)){
  if(!path||path.length>600||!raw||typeof raw!=='object')continue;
  const icon=availableIcons.has(raw.icon)?raw.icon:'';
  const color=writerV9SafeHex(raw.color);
  if(icon||color)out[path]={icon,color};
 }
 cfg.items=out;
 return cfg;
}
function writerV9SafeHex(value){
 const color=String(value||'').trim();
 return /^#[a-f0-9]{6}$/i.test(color)?color.toLowerCase():'';
}
function writerV9AvailableIcons(){
 let icons=WRITER_V9_EXPLORER_ICONS;
 try{const api=typeof require==='function'?require('obsidian'):null;
  if(typeof api?.getIconIds==='function')icons=api.getIconIds();}catch(_){}
 return [...new Set([...WRITER_V9_EXPLORER_ICONS,...(Array.isArray(icons)?icons:[])])]
  .filter(name=>/^[a-z0-9-]{1,60}$/.test(name)).sort();
}
function writerV9ColorSetting(root,pt,en,initial,onValue){
 const setting=new Setting(root).setName(writerUi(pt,en))
  .setDesc(writerUi('Padrão: cor de destaque do tema. Ou escolha uma cor personalizada.','Default: current theme accent. Or choose a custom color.'));
 const input=setting.controlEl.createEl('input',{cls:'writer-v901-color-input',attr:{type:'color','aria-label':writerUi(pt,en)}});
 const text=setting.controlEl.createEl('input',{cls:'writer-v901-color-hex',attr:{type:'text',maxlength:'7',placeholder:'#RRGGBB','aria-label':'HEX'}});
 const fallback='#888888';
 const set=color=>{const safe=writerV9SafeHex(color);input.value=safe||fallback;text.value=safe;onValue(safe);};
 const initialColor=writerV9SafeHex(initial);
 input.value=initialColor||fallback;text.value=initialColor;
 input.addEventListener('change',()=>set(input.value));
 text.addEventListener('change',()=>{if(!text.value.trim())set('');else if(writerV9SafeHex(text.value))set(text.value);else text.value=writerV9SafeHex(initial)||'';});
 setting.addButton(b=>b.setButtonText(writerUi('Padrão','Default')).onClick(()=>set('')));
 return setting;
}

/* Shared Iconic-style icon gallery used by all configurable Lucide icon settings.
 * Runs locally against Obsidian's icon registry; no external icon fetches. */
function writerV922IconLibrary(plugin){
 const available=writerV9AvailableIcons(),favorites=plugin.settings.v922IconFavorites||[],
  recent=plugin.settings.v922IconRecent||[];
 return {available,favorites:writerV922ValidIconList(favorites,available),recent:writerV922ValidIconList(recent,available)};
}
function writerV922ValidIconList(list,available){
 const valid=new Set(available);
 return Array.isArray(list)?[...new Set(list.filter(icon=>typeof icon==='string'&&valid.has(icon)))].slice(0,24):[];
}
function writerV922OpenIconPicker(plugin,options){
 const modal=new Modal(plugin.app);
 const library=writerV922IconLibrary(plugin);
 const icons=library.available;
 const previous=String(options.value||'');
 let chosen=icons.includes(previous)?previous:(options.allowNone?'':options.defaultIcon||'file-text');
 let color=writerV9SafeHex(options.color);
 let tab='all',query='';
 modal.onOpen=()=>{
  modal.setTitle(options.title||writerUi('Escolher ícone','Choose icon'));
  const content=modal.contentEl;
  content.addClass('writer-v922-iconic-modal');
  const preview=content.createDiv({cls:'writer-v922-iconic-preview'});
  const previewGlyph=preview.createSpan({cls:'writer-v922-iconic-big'});
  const details=preview.createDiv({cls:'writer-v922-iconic-details'});
  details.createEl('strong',{text:writerUi('Ícone selecionado','Selected icon')});
  const selectedName=details.createEl('code');
  const setPreview=()=>{
   previewGlyph.empty();
   require('obsidian').setIcon?.(previewGlyph,chosen||'minus');
   selectedName.setText(chosen||writerUi('Padrão do Obsidian','Obsidian default'));
   previewGlyph.style.color=color||'var(--interactive-accent)';
  };
  const toolbar=content.createDiv({cls:'writer-v922-iconic-tools'});
  const input=toolbar.createEl('input',{attr:{type:'search',placeholder:writerUi('Pesquisar entre todos os ícones…','Search all icons…'),'aria-label':writerUi('Pesquisar ícones','Search icons')}});
  const pin=toolbar.createEl('button',{cls:'writer-v922-iconic-pin',attr:{type:'button'}});
  const setPin=()=>{
   const pinned=library.favorites.includes(chosen);
   pin.empty();require('obsidian').setIcon?.(pin,pinned?'star':'star-off');
   pin.title=writerUi(pinned?'Desafixar ícone':'Fixar ícone',pinned?'Unpin icon':'Pin icon');
   pin.setAttribute('aria-label',pin.title);pin.disabled=!chosen;
  };
  const tabs=content.createDiv({cls:'writer-v922-iconic-tabs',attr:{role:'tablist'}});
  const buttons={};
  for(const [key,pt,en,icon] of [['all','Todos','All','grid-2x2'],['favorites','Favoritos','Favorites','star'],['recent','Recentes','Recent','clock']]){
   const button=tabs.createEl('button',{attr:{type:'button',role:'tab'}});
   const glyph=button.createSpan();require('obsidian').setIcon?.(glyph,icon);
   button.createSpan({text:writerUi(pt,en)});buttons[key]=button;
   button.addEventListener('click',()=>{tab=key;draw();});
  }
  const info=content.createEl('p',{cls:'writer-v922-iconic-count'});
  const grid=content.createDiv({cls:'writer-v922-iconic-grid',attr:{role:'group','aria-label':writerUi('Ícones disponíveis','Available icons')}});
  const select=name=>{chosen=name;setPreview();setPin();draw();};
  const draw=()=>{
   for(const [key,button] of Object.entries(buttons)){
    button.classList.toggle('is-active',key===tab);
    button.setAttribute('aria-selected',String(key===tab));
   }
   const pool=tab==='favorites'?library.favorites:tab==='recent'?library.recent:icons;
   const normalized=query.trim().toLocaleLowerCase();
   const matches=normalized?pool.filter(icon=>icon.includes(normalized)):pool;
   info.setText(matches.length+' '+writerUi('ícones encontrados','icons found'));
   grid.empty();
   if(options.allowNone&&tab==='all'&&!normalized){
    const none=grid.createEl('button',{cls:'writer-v922-iconic-choice'+(!chosen?' is-active':''),attr:{type:'button',title:writerUi('Ícone padrão','Default icon'),'aria-label':writerUi('Ícone padrão','Default icon'),'aria-pressed':String(!chosen)}});
    require('obsidian').setIcon?.(none,'rotate-ccw');none.addEventListener('click',()=>select(''));
   }
   for(const name of matches.slice(0,240)){
    const button=grid.createEl('button',{cls:'writer-v922-iconic-choice'+(chosen===name?' is-active':''),attr:{type:'button',title:name,'aria-label':name,'aria-pressed':String(chosen===name)}});
    require('obsidian').setIcon?.(button,name);
    button.addEventListener('click',()=>select(name));
   }
   if(!matches.length)grid.createEl('p',{cls:'writer-v922-iconic-empty',text:writerUi('Nenhum ícone encontrado.','No icons found.')});
  };
  input.addEventListener('input',()=>{query=input.value;draw();});
  pin.addEventListener('click',()=>{
   if(!chosen)return;
   const i=library.favorites.indexOf(chosen);
   if(i>=0)library.favorites.splice(i,1);else library.favorites.unshift(chosen);
   plugin.settings.v922IconFavorites=[...library.favorites].slice(0,24);
   void plugin.saveSettings();
   setPin();if(tab==='favorites')draw();
  });
  setPreview();setPin();draw();
  writerV9ColorSetting(content,'Cor do ícone','Icon color',color,value=>{color=value;setPreview();});
  const actions=content.createDiv({cls:'writer-v922-iconic-actions'});
  new Setting(actions).addButton(button=>button.setButtonText(writerUi('Aplicar','Apply')).setCta().onClick(async()=>{
   const current=chosen||'';
   if(current&&!icons.includes(current))return;
   const recents=[current,...library.recent].filter(Boolean);
   plugin.settings.v922IconRecent=[...new Set(recents)].slice(0,24);
   await options.onApply(current,color);
   await plugin.saveSettings();
   modal.close();
  })).addButton(button=>button.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
  input.focus();
 };
 modal.open();
}
function writerV922IconSetting(plugin,panel,{pt,en,value,color='',defaultIcon='star',description='',onApply}){
 const setting=new Setting(panel).setName(writerUi(pt,en));
 if(description)setting.setDesc(description);
 const preview=setting.controlEl.createEl('button',{cls:'writer-v922-iconic-setting',attr:{type:'button'}});
 const glyph=preview.createSpan({cls:'writer-v922-iconic-setting-glyph'});
 const name=preview.createSpan({cls:'writer-v922-iconic-setting-label'});
 const icon=value||defaultIcon;
 require('obsidian').setIcon?.(glyph,icon);
 glyph.style.color=writerV9SafeHex(color)||'var(--interactive-accent)';
 name.setText(icon);
 const more=preview.createSpan({cls:'writer-v922-iconic-setting-arrow'});
 require('obsidian').setIcon?.(more,'chevrons-up-down');
 preview.setAttribute('aria-label',writerUi(pt,en)+': '+icon);
 preview.addEventListener('click',()=>writerV922OpenIconPicker(plugin,{
  title:writerUi(pt,en),value:icon,color,defaultIcon,allowNone:false,
  onApply:async(newIcon,newColor)=>{
   await onApply(newIcon,newColor);
   glyph.empty();require('obsidian').setIcon?.(glyph,newIcon||defaultIcon);
   glyph.style.color=newColor||'var(--interactive-accent)';
   name.setText(newIcon||defaultIcon);
   preview.setAttribute('aria-label',writerUi(pt,en)+': '+(newIcon||defaultIcon));
   value=newIcon;color=newColor;
  }
 }));
 return setting;
}
function writerV9ExplorerPicker(plugin,file){
 const path=file.path,item=plugin.settings.v9Explorer.items[path]||{};
 writerV922OpenIconPicker(plugin,{
  title:writerUi('Personalizar: ','Customize: ')+(file.name||'/'),
  value:item.icon||'',color:item.color||'',allowNone:true,defaultIcon:'file-text',
  onApply:async(icon,color)=>{
   if(icon||color)plugin.settings.v9Explorer.items[path]={icon,color};
   else delete plugin.settings.v9Explorer.items[path];
   plugin.writerV9ExplorerRefresh?.();
  }
 });
}
function writerV9ExplorerFolderModal(plugin,folder){
 if(!(folder instanceof TFolder))return;
 const modal=new Modal(plugin.app);let query='',sort='name',style='cards';
 modal.onOpen=()=>{
  modal.setTitle((folder.name||writerUi('Cofre','Vault'))+' · '+writerUi('Visão da pasta','Folder view'));
  const container=modal.contentEl.createDiv({cls:'writer-v9-space'});
  const bar=container.createDiv({cls:'writer-v9-space-controls'});
  const input=bar.createEl('input',{attr:{type:'search',placeholder:writerUi('Filtrar notas…','Filter notes…'),'aria-label':writerUi('Filtrar notas','Filter notes')}});
  const sortSelect=bar.createEl('select',{attr:{'aria-label':writerUi('Ordenar','Sort')}});
  for(const [value,pt,en] of [['name','Nome','Name'],['recent','Recentes','Recently edited']]){
   const option=sortSelect.createEl('option',{text:writerUi(pt,en)});option.value=value;
  }
  const toggle=bar.createEl('button',{text:writerUi('Lista / cartões','List / cards')});
  const body=container.createDiv({cls:'writer-v9-space-results'});
  const redraw=()=>{
   body.empty();body.classList.toggle('is-list',style==='list');
   const files=[];
   const scan=(parent,depth)=>{
    if(depth>2||files.length>=2000)return;
    for(const child of parent.children||[]){
     if(child instanceof TFile&&child.extension==='md')files.push(child);
     if(child instanceof TFolder)scan(child,depth+1);
    }
   };
   scan(folder,0);
   const filtered=files.filter(file=>{
    const cached=plugin.app.metadataCache.getFileCache(file)?.frontmatter||{};
    return !query||file.path.toLocaleLowerCase().includes(query)||String(cached.tags||'').toLocaleLowerCase().includes(query);
   }).sort((a,b)=>sort==='recent'?(b.stat?.mtime||0)-(a.stat?.mtime||0):a.basename.localeCompare(b.basename));
   const max=plugin.settings.v9Explorer.maxResults;
   for(const file of filtered.slice(0,max)){
    const item=body.createEl('button',{cls:'writer-v9-space-item',attr:{type:'button',title:file.path}});
    const icon=item.createSpan({cls:'writer-v9-space-item-icon'});
    require('obsidian').setIcon(icon,plugin.settings.v9Explorer.items[file.path]?.icon||'file-text');
    item.createSpan({text:file.basename,cls:'writer-v9-space-item-name'});
    const relative=file.parent?.path||'';
    if(relative!==folder.path)item.createSpan({text:relative,cls:'writer-v9-space-item-sub'});
    item.addEventListener('click',()=>{modal.close();void plugin.app.workspace.getLeaf('tab').openFile(file);});
   }
   if(filtered.length>max)body.createEl('p',{text:writerUi('Exibindo os primeiros ','Showing the first ')+max+' / '+filtered.length});
   if(!filtered.length)body.createEl('p',{text:writerUi('Nenhuma nota encontrada.','No matching notes.')});
  };
  input.addEventListener('input',()=>{query=input.value.trim().toLocaleLowerCase();redraw();});
  sortSelect.addEventListener('change',()=>{sort=sortSelect.value;redraw();});
  toggle.addEventListener('click',()=>{style=style==='list'?'cards':'list';redraw();});
  redraw();
 };
 modal.open();
}
async function writerV9CreateFolderIndex(plugin,folder){
 if(!(folder instanceof TFolder))return;
 const base=folder.path?folder.path+'/':'';
 const name=folder.name||writerUi('Índice','Index');
 let path=base+name+'.md';
 if(plugin.app.vault.getAbstractFileByPath(path)){
  const file=plugin.app.vault.getAbstractFileByPath(path);
  if(file instanceof TFile){await plugin.app.workspace.getLeaf('tab').openFile(file);return;}
  let i=2;while(plugin.app.vault.getAbstractFileByPath(path))path=base+name+'-'+i+++'.md';
 }
 const title=name.replace(/[\r\n#]/g,' ').trim();
 const file=await plugin.app.vault.create(path,'# '+title+'\n\n'+String.fromCharCode(96).repeat(3)+'folder-overview\nstyle: cards\nsubfolders: false\n'+String.fromCharCode(96).repeat(3)+'\n');
 await plugin.app.workspace.getLeaf('tab').openFile(file);
}
function writerV9RegisterExplorer(plugin){
 let debounce=null;
 const active=()=>writerModuleOn(plugin,'nativeExplorer')&&plugin.settings.v9Explorer.enabled;
 const refresh=()=>{
  if(debounce)clearTimeout(debounce);
  debounce=setTimeout(()=>{
   debounce=null;
   const enabled=active();
   const roots=plugin.app.workspace.getLeavesOfType?.('file-explorer')||[];
   for(const leaf of roots){
    const host=leaf.view?.containerEl;if(!host)continue;
    const targets=host.querySelectorAll('.nav-file-title, .nav-folder-title');
    for(const node of Array.from(targets).slice(0,6000)){
     const path=node.getAttribute('data-path')||node.closest('[data-path]')?.getAttribute('data-path');
     if(!path)continue;
     const item=plugin.settings.v9Explorer.items[path],existing=node.querySelector(':scope > .writer-v9-explorer-icon');
     const desiredIcon=enabled&&plugin.settings.v9Explorer.showIcons&&item?.icon||'';
     if(existing?.dataset.icon!==desiredIcon)existing?.remove();
     if(desiredIcon&&!node.querySelector(':scope > .writer-v9-explorer-icon')){
      const symbol=node.ownerDocument.createElement('span');
      symbol.className='writer-v9-explorer-icon';
      symbol.dataset.icon=desiredIcon;
      symbol.setAttribute('aria-hidden','true');
      require('obsidian').setIcon(symbol,desiredIcon);
      node.insertBefore(symbol,node.firstChild);
     }
     const desiredColor=enabled&&plugin.settings.v9Explorer.showColor&&item?.color||'';
     node.classList.toggle('writer-v9-explorer-accent',Boolean(desiredColor));
     if(desiredColor)node.style.setProperty('--writer-v9-explorer-accent',desiredColor);
     else node.style.removeProperty('--writer-v9-explorer-accent');
    }
   }
  },120);
 };
 // Decorate the actual Obsidian inline title with the same per-file icon.
 // This is presentation only: never rewrite Markdown or frontmatter.
 const refreshInlineTitles=()=>{
  const enabled=active()&&plugin.settings.v9Explorer.showIcons&&plugin.settings.v9Explorer.showTitleIcons;
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
   const file=leaf.view?.file,host=leaf.view?.containerEl;
   if(!host)continue;
   const item=file&&plugin.settings.v9Explorer.items[file.path];
   const icon=enabled&&item?.icon||'';
   for(const title of host.querySelectorAll('.inline-title')){
    const old=title.querySelector(':scope > .writer-v9-inline-title-icon');
    if(old?.dataset.icon!==icon)old?.remove();
    if(!icon||title.querySelector(':scope > .writer-v9-inline-title-icon'))continue;
    const node=title.ownerDocument.createElement('span');
    node.className='writer-v9-inline-title-icon';
    node.dataset.icon=icon;
    node.setAttribute('aria-hidden','true');
    node.setAttribute('contenteditable','false');
    require('obsidian').setIcon(node,icon);
    title.insertBefore(node,title.firstChild);
   }
  }
 };
 plugin.writerV9InlineTitleRefresh=refreshInlineTitles;
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',()=>setTimeout(refreshInlineTitles,100)));
 plugin.registerEvent(plugin.app.workspace.on('file-open',()=>setTimeout(refreshInlineTitles,100)));
 plugin.writerV9ExplorerRefresh=refresh;
 const fileMenu=(menu,file)=>{
  if(!active()||!(file instanceof TFile||file instanceof TFolder))return;
  menu.addItem(item=>item.setTitle(writerUi('Personalizar no Basic · ícone e cor','Customize in Basic · icon and color'))
   .setIcon('palette').onClick(()=>writerV9ExplorerPicker(plugin,file)));
  if(file instanceof TFolder){
   menu.addItem(item=>item.setTitle(writerUi('Abrir visão da pasta','Open folder view'))
    .setIcon('layout-grid').onClick(()=>writerV9ExplorerFolderModal(plugin,file)));
   menu.addItem(item=>item.setTitle(writerUi('Criar/abrir índice Markdown','Create/open Markdown index'))
    .setIcon('book-open').onClick(()=>void writerV9CreateFolderIndex(plugin,file).catch(error=>new Notice(String(error.message||error)))));
  }
 };
 plugin.registerEvent(plugin.app.workspace.on('file-menu',fileMenu));
 plugin.registerEvent(plugin.app.vault.on('rename',(file,old)=>{
  if(!active())return;
  const cfg=plugin.settings.v9Explorer,affected=Object.keys(cfg.items).filter(path=>path===old||path.startsWith(old+'/'));
  for(const path of affected){
   const next=file.path+path.slice(old.length);
   cfg.items[next]=cfg.items[path];delete cfg.items[path];
  }
  if(affected.length)void plugin.saveSettings();
  refresh();
 }));
 plugin.registerEvent(plugin.app.vault.on('delete',file=>{
  if(!active())return;
  const cfg=plugin.settings.v9Explorer;
  const keys=Object.keys(cfg.items).filter(path=>path===file.path||path.startsWith(file.path+'/'));
  for(const key of keys)delete cfg.items[key];
  if(keys.length)void plugin.saveSettings();
 }));
 const explorerObservers=new Map();
 const attachObservers=()=>{
  if(typeof MutationObserver==='undefined')return;
  const leaves=plugin.app.workspace.getLeavesOfType?.('file-explorer')||[];
  const hosts=new Set(leaves.map(leaf=>leaf.view?.containerEl).filter(Boolean));
  for(const [node,watcher] of explorerObservers){
   if(!hosts.has(node)){watcher.disconnect();explorerObservers.delete(node);}
  }
  for(const host of hosts){
   if(explorerObservers.has(host))continue;
   const watcher=new MutationObserver(records=>{
    // Only react to actual File Explorer changes, never to our own SVG/icon nodes.
    if(records.some(record=>Array.from(record.addedNodes).some(node=>
       node.nodeType===1&&!node.classList?.contains('writer-v9-explorer-icon')&&
       !node.closest?.('.writer-v9-explorer-icon'))))refresh();
   });
   watcher.observe(host,{childList:true,subtree:true});
   explorerObservers.set(host,watcher);
  }
 };
 const start=()=>{attachObservers();refresh();};
 plugin.registerEvent(plugin.app.workspace.on('layout-change',start));
 plugin.app.workspace.onLayoutReady?.(start);
 plugin.register?.(()=>{
  for(const watcher of explorerObservers.values())watcher.disconnect();
  explorerObservers.clear();
  clearTimeout(debounce);
  plugin.writerV9ExplorerRefresh=null;
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])
    leaf.view?.containerEl?.querySelectorAll('.writer-v9-inline-title-icon').forEach(el=>el.remove());
   plugin.writerV9InlineTitleRefresh=null;
 });
 plugin.addCommand({id:'v9-explorer-open-folder',name:writerUi('Explorador: visualizar pasta atual','Explorer: show current folder'),callback:()=>{
  if(!active())return;
  const file=plugin.app.workspace.getActiveFile?.(),folder=file?.parent||plugin.app.vault.getRoot();
  writerV9ExplorerFolderModal(plugin,folder);
 }});
}
function writerV9ExplorerSettings(plugin,panel){
 const cfg=plugin.settings.v9Explorer;
 panel.createEl('h3',{text:writerUi('Explorador nativo · v9','Native File Explorer · v9')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Ícones e cores ficam nas configurações do Basic, sem alterar seus arquivos. Clique com o botão direito/pressione uma nota ou pasta no explorador para personalizar.','Icons and colors are stored in Basic settings, not in your files. Right-click or long-press a file or folder in the native explorer to customize.')});
 for(const [key,pt,en] of [['enabled','Ativar extensões do explorador','Enable explorer extensions'],['showIcons','Exibir ícones personalizados','Show custom icons'],['showTitleIcons','Ícones antes do título da nota','Icons before note titles'],['showColor','Exibir cores personalizadas','Show custom colors']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{
   cfg[key]=value;await plugin.saveSettings();plugin.writerV9ExplorerRefresh?.();plugin.writerV9InlineTitleRefresh?.();
  }));
 }
 new Setting(panel).setName(writerUi('Máximo de notas na visão de pasta','Maximum notes in folder view'))
  .addSlider(s=>s.setLimits(20,200,10).setValue(cfg.maxResults).setDynamicTooltip().onChange(async value=>{cfg.maxResults=value;await plugin.saveSettings();}));
}
