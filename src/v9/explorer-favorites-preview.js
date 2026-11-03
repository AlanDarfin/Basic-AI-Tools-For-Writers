'use strict';
/* v9.2.0 native explorer enhancements, inspired by Favorite Note and File Preview.
 * Reuses Basic's homepage favorites; never changes note content to mark a favorite.
 * Folder descriptions are read from the folder note's YAML frontmatter. */
const WRITER_V92_FAVORITE_ICONS=['star','heart','bookmark','sparkles','pin','flag','award','gem','flower-2','sun'];
function writerV92ExplorerMerge(settings){
 const old=settings.v92Explorer&&typeof settings.v92Explorer==='object'?settings.v92Explorer:{};
 const cfg=settings.v92Explorer={
  favoritesEnabled:true,favoriteIcon:'star',previewMode:'folder',previewMax:135,
  folderDescriptionKey:'description',noteDescriptionKey:'description',
  ...old
 };
 cfg.favoritesEnabled=cfg.favoritesEnabled!==false;
 cfg.favoriteIcon=/^[a-z][a-z0-9-]{0,38}$/.test(cfg.favoriteIcon)?cfg.favoriteIcon:'star';
 cfg.previewMode=['off','folder','all'].includes(cfg.previewMode)?cfg.previewMode:'folder';
 cfg.previewMax=Math.max(40,Math.min(280,Math.round(Number(cfg.previewMax)||135)));
 cfg.folderDescriptionKey=/^[\w-]{1,50}$/.test(cfg.folderDescriptionKey)?cfg.folderDescriptionKey:'description';
 cfg.noteDescriptionKey=/^[\w-]{1,50}$/.test(cfg.noteDescriptionKey)?cfg.noteDescriptionKey:'description';
 return cfg;
}
function writerV92Favorite(plugin,path){
 return plugin.settings.v8Finish?.homeFavorites?.includes(path)===true;
}
async function writerV92ToggleFavorite(plugin,path){
 if(!(plugin.app.vault.getAbstractFileByPath(path) instanceof TFile))return;
 const list=plugin.settings.v8Finish.homeFavorites;
 const index=list.indexOf(path);
 if(index>=0)list.splice(index,1);else list.unshift(path);
 plugin.settings.v8Finish.homeFavorites=[...new Set(list)].slice(0,30);
 await plugin.saveSettings();
 plugin.writerV92Explorer?.schedule();
 for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[])leaf.view?.render?.();
}
function writerV92FolderNote(app,folder){
 if(!(folder instanceof TFolder))return null;
 if(typeof writerV7FolderNote==='function'){
  const note=writerV7FolderNote(app,folder);
  if(note instanceof TFile)return note;
 }
 const base=folder.path?folder.path+'/':'';
 for(const path of [base+folder.name+'.md',base+'index.md',base+'README.md']){
  const file=app.vault.getAbstractFileByPath(path);
  if(file instanceof TFile)return file;
 }
 return null;
}
function writerV92PreviewValue(plugin,file){
 const cfg=plugin.settings.v92Explorer;
 if(cfg.previewMode==='off')return '';
 const folder=file instanceof TFolder;
 if(!folder&&(!(file instanceof TFile)||cfg.previewMode!=='all'||file.extension!=='md'))return '';
 const source=folder?writerV92FolderNote(plugin.app,file):file;
 if(!(source instanceof TFile))return '';
 const front=plugin.app.metadataCache?.getFileCache?.(source)?.frontmatter||{};
 const key=folder?cfg.folderDescriptionKey:cfg.noteDescriptionKey;
 const raw=front[key]??front.summary??front.brief;
 const value=Array.isArray(raw)?raw.join(', '):typeof raw==='string'?raw:'';
 return value.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,cfg.previewMax);
}
function writerV92ExplorerRegister(plugin){
 let timer=null;
 const refresh=()=>{
  const cfg=plugin.settings.v92Explorer;
  const active=writerModuleOn(plugin,'nativeExplorer');
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;
   if(!host)continue;
   for(const node of Array.from(host.querySelectorAll('.nav-file-title, .nav-folder-title')).slice(0,6000)){
    const path=node.getAttribute('data-path')||node.closest('[data-path]')?.getAttribute('data-path');
    if(!path)continue;
    const file=plugin.app.vault.getAbstractFileByPath(path);
    if(!(file instanceof TFile||file instanceof TFolder))continue;
    const fav=active&&cfg.favoritesEnabled&&file instanceof TFile&&writerV92Favorite(plugin,path);
    const icon=node.querySelector(':scope > .writer-v92-favorite');
    if(icon?.dataset.icon!==(fav?cfg.favoriteIcon:''))icon?.remove();
    if(fav&&!node.querySelector(':scope > .writer-v92-favorite')){
     const badge=node.ownerDocument.createElement('span');
     badge.className='writer-v92-favorite';
     badge.dataset.icon=cfg.favoriteIcon;
     badge.setAttribute('aria-hidden','true');
     require('obsidian').setIcon(badge,cfg.favoriteIcon);
     node.insertBefore(badge,node.firstChild);
    }
    node.classList.toggle('writer-v92-is-favorite',!!fav);
    const description=active?writerV92PreviewValue(plugin,file):'';
    const existing=node.querySelector(':scope > .writer-v92-file-preview');
    if(existing&&existing.textContent!==description)existing.remove();
    if(description&&!node.querySelector(':scope > .writer-v92-file-preview')){
     const span=node.ownerDocument.createElement('span');
     span.className='writer-v92-file-preview';
     span.textContent=description;span.title=description;
     node.appendChild(span);
    }
    node.classList.toggle('writer-v92-has-preview',Boolean(description));
   }
  }
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,120);};
 plugin.writerV92Explorer={refresh,schedule};
 plugin.addCommand?.({id:'v92-toggle-favorite',name:writerUi('Favoritos: alternar nota ativa','Favorites: toggle active note'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile?.();if(file instanceof TFile)void writerV92ToggleFavorite(plugin,file.path);
 }});
 plugin.registerEvent(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!(file instanceof TFile)||!writerModuleOn(plugin,'nativeExplorer'))return;
  const favorite=writerV92Favorite(plugin,file.path);
  menu.addItem(item=>item.setTitle(writerUi(favorite?'Remover dos favoritos':'Adicionar aos favoritos',
    favorite?'Remove from favorites':'Add to favorites'))
   .setIcon(plugin.settings.v92Explorer.favoriteIcon)
   .onClick(()=>void writerV92ToggleFavorite(plugin,file.path)));
 }));
 for(const name of ['layout-change','file-open'])plugin.registerEvent(plugin.app.workspace.on(name,schedule));
 for(const name of ['rename','delete','create','modify'])plugin.registerEvent(plugin.app.vault.on(name,(file,old)=>{
  if(name==='rename'&&old){
   const list=plugin.settings.v8Finish.homeFavorites;
   const index=list.indexOf(old);if(index>=0){list[index]=file.path;void plugin.saveSettings();}
  }
  if(name==='delete'){
   const list=plugin.settings.v8Finish.homeFavorites;
   const index=list.indexOf(file.path);if(index>=0){list.splice(index,1);void plugin.saveSettings();}
  }
  schedule();
 }));
 if(typeof plugin.app.metadataCache?.on==='function')plugin.registerEvent(plugin.app.metadataCache.on('changed',schedule));
 const observers=new Map();
 const attach=()=>{
  if(typeof MutationObserver==='undefined')return;
  const roots=new Set((plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]).map(x=>x.view?.containerEl).filter(Boolean));
  for(const [root,observer] of observers)if(!roots.has(root)){observer.disconnect();observers.delete(root);}
  for(const root of roots){
   if(observers.has(root))continue;
   const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('.writer-v92-favorite, .writer-v92-file-preview')&&
      !n.classList?.contains('writer-v92-favorite')&&!n.classList?.contains('writer-v92-file-preview'))))schedule();
   });
   observer.observe(root,{childList:true,subtree:true});observers.set(root,observer);
  }
 };
 plugin.registerEvent(plugin.app.workspace.on('layout-change',attach));
 plugin.app.workspace.onLayoutReady?.(()=>{attach();schedule();});
 plugin.register?.(()=>{clearTimeout(timer);for(const observer of observers.values())observer.disconnect();observers.clear();plugin.writerV92Explorer=null;});
}
function writerV92ExplorerSettings(plugin,panel){
 const cfg=plugin.settings.v92Explorer;
 panel.createEl('h3',{text:writerUi('Favoritos e prévias no explorador','Explorer favorites & previews')});
 new Setting(panel).setName(writerUi('Favoritos no explorador','Explorer favorites')).addToggle(t=>t.setValue(cfg.favoritesEnabled)
  .onChange(async v=>{cfg.favoritesEnabled=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();}));
 new Setting(panel).setName(writerUi('Ícone de favorito (preenchido)','Favorite icon (filled)'))
  .setDesc(writerUi('Escolha o ícone que aparece nas notas favoritas.','Choose the icon shown on favorite notes.'))
  .addDropdown(d=>{
   for(const icon of WRITER_V92_FAVORITE_ICONS)d.addOption(icon,icon);
   if(!WRITER_V92_FAVORITE_ICONS.includes(cfg.favoriteIcon))d.addOption(cfg.favoriteIcon,cfg.favoriteIcon);
   d.setValue(cfg.favoriteIcon).onChange(async v=>{cfg.favoriteIcon=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();});
  });
 new Setting(panel).setName(writerUi('Prévia de descrição','Description preview'))
  .setDesc(writerUi('Desligado; somente folder notes; ou folder notes e todas as notas Markdown.','Off; folder notes only; or folder notes plus all Markdown notes.'))
  .addDropdown(d=>d.addOption('off',writerUi('Desativado','Off'))
   .addOption('folder',writerUi('Somente folder notes','Folder notes only'))
   .addOption('all',writerUi('Todas as notas + folder notes','All notes + folder notes'))
   .setValue(cfg.previewMode).onChange(async v=>{cfg.previewMode=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();}));
 new Setting(panel).setName(writerUi('Propriedade da descrição da pasta','Folder description property'))
  .setDesc(writerUi('Por padrão: description no YAML da folder note.','Default: description in the folder note frontmatter.'))
  .addText(t=>t.setValue(cfg.folderDescriptionKey).onChange(async v=>{
   cfg.folderDescriptionKey=/^[\w-]{1,50}$/.test(v)?v:'description';
   await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Propriedade da descrição das notas','Note description property'))
  .addText(t=>t.setValue(cfg.noteDescriptionKey).onChange(async v=>{
   cfg.noteDescriptionKey=/^[\w-]{1,50}$/.test(v)?v:'description';
   await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Limite da descrição','Preview length')).addSlider(s=>s.setLimits(40,280,10)
  .setValue(cfg.previewMax).setDynamicTooltip().onChange(async v=>{cfg.previewMax=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();}));
}
