'use strict';
/* 9.2.0 — Favorite + File Preview, built on Basic's native explorer and Home favorites.
 * Non-destructive except for an explicitly confirmed Folder Note description edit. */
const WRITER_V92_FAVORITE_ICONS=['heart','star','bookmark','pin','flag','sparkles','flower-2','book-heart','badge-check','check-circle','diamond','sun','moon-star'];
function writerV92ExplorerMerge(settings){
 const old=settings.v92Explorer&&typeof settings.v92Explorer==='object'?settings.v92Explorer:{};
 const cfg=settings.v92Explorer={enabled:true,favoriteIcon:'heart',favoriteColor:'',previews:'folder',
  previewLength:130,preferDescription:true,...old};
 cfg.enabled=cfg.enabled!==false;
 cfg.favoriteIcon=/^[a-z0-9-]{1,60}$/.test(cfg.favoriteIcon)&&writerV9AvailableIcons().includes(cfg.favoriteIcon)?cfg.favoriteIcon:'heart';
 cfg.favoriteColor=writerV9SafeHex(cfg.favoriteColor);
 cfg.previews=['off','folder','all'].includes(cfg.previews)?cfg.previews:'folder';
 cfg.previewLength=Math.max(40,Math.min(300,Math.floor(Number(cfg.previewLength)||130)));
 cfg.preferDescription=cfg.preferDescription!==false;
 return cfg;
}
function writerV92FavoriteList(plugin){return plugin.settings.v8Finish?.homeFavorites||[];}
function writerV92FavoriteToggle(plugin,path){
 if(!path)return;
 writerV8HomeToggleFavorite(plugin,path);
 void plugin.saveSettings();
 plugin.writerV92ExplorerRefresh?.();
 for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[])
  leaf.view?.render?.();
}
function writerV92FolderNote(app,folder){
 if(!(folder instanceof TFolder))return null;
 try{
  const file=writerV7FolderNote(app,folder);
  return file instanceof TFile&&file.extension==='md'?file:null;
 }catch(_){return null;}
}
function writerV92FolderDescription(app,folder){
 const note=writerV92FolderNote(app,folder);
 if(!note)return null;
 const fm=app.metadataCache?.getFileCache?.(note)?.frontmatter||{};
 const description=[fm.description,fm.summary,fm.brief].find(v=>typeof v==='string'&&v.trim());
 return {note,description:String(description||'').replace(/\s+/g,' ').trim()};
}
function writerV92IsFolderNote(app,file){
 if(!(file instanceof TFile))return false;
 return writerV92FolderNote(app,file.parent)?.path===file.path;
}
function writerV92Excerpt(raw,max){
 const text=String(raw||'').slice(0,8000)
  .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'')
  .replace(/^\s*(?:#{1,6}\s+|>|[-*]\s+|\d+\.\s+)/gm,'')
  .replace(/^(?:\x60{3,}|~{3,})[\s\S]*?^(?:\x60{3,}|~{3,}).*$/gm,'')
  .replace(/!\[\[([^\]]+)\]\]|\!\[[^\]]*\]\([^\)]*\)/g,'')
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2')
  .replace(/\[\[([^\]]+)\]\]/g,'$1')
  .replace(/\[([^\]]+)\]\([^\)]+\)/g,'$1')
  .replace(/[*_~\x60]/g,'').replace(/\s+/g,' ').trim();
 return text.slice(0,max);
}
function writerV92PreviewInfo(plugin,resource,cache){
 const cfg=plugin.settings.v92Explorer;
 const app=plugin.app;
 const isFolder=resource instanceof TFolder,notes=isFolder?writerV92FolderDescription(app,resource):null;
 if(isFolder){
  if(!notes)return null;
  if(notes.description)return {text:notes.description,path:notes.note.path};
  return {text:'',path:notes.note.path,read:notes.note};
 }
 if(!(resource instanceof TFile)||resource.extension!=='md')return null;
 const folderNote=writerV92IsFolderNote(app,resource);
 if(cfg.previews==='folder'&&!folderNote)return null;
 const fm=app.metadataCache?.getFileCache?.(resource)?.frontmatter||{};
 const description=cfg.preferDescription?[fm.description,fm.summary,fm.brief].find(x=>typeof x==='string'&&x.trim()):'';
 if(description)return {text:String(description).replace(/\s+/g,' ').trim(),path:resource.path};
 if(cfg.previews==='folder'&&!folderNote)return null;
 const old=cache.get(resource.path);
 if(old&&old.mtime===(resource.stat?.mtime||0))return {text:old.text,path:resource.path};
 return {text:'',path:resource.path,read:resource};
}
async function writerV92EditFolderDescription(plugin,folder){
 const note=writerV92FolderNote(plugin.app,folder);
 if(!note){
  new Notice(writerUi('Crie primeiro uma Folder Note para esta pasta.','Create a Folder Note for this folder first.'));return;
 }
 const fm=plugin.app.metadataCache?.getFileCache?.(note)?.frontmatter||{};
 const modal=new Modal(plugin.app);
 let value=typeof fm.description==='string'?fm.description:'';
 modal.onOpen=()=>{
  modal.setTitle(writerUi('Descrição da Folder Note','Folder Note description'));
  modal.contentEl.createEl('p',{cls:'dictionary-muted',text:note.path});
  new Setting(modal.contentEl).setName(writerUi('Propriedade description','description property'))
   .setDesc(writerUi('O texto aparece no explorador conforme o modo de prévia selecionado.','This text appears in the explorer according to the preview mode.'))
   .addTextArea(t=>{t.inputEl.rows=4;t.setValue(value).onChange(v=>{value=v.slice(0,1000);});});
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Salvar propriedade','Save property')).setCta().onClick(async()=>{
   try{
    await plugin.app.fileManager.processFrontMatter(note,data=>{if(value.trim())data.description=value.trim();else delete data.description;});
    modal.close();plugin.writerV92ExplorerRefresh?.();new Notice(writerUi('Descrição atualizada.','Description updated.'));
   }catch(e){new Notice(String(e?.message||e));}
  })).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
 };modal.open();
}
function writerV92ExplorerRegister(plugin){
 const cfg=plugin.settings.v92Explorer,previewCache=new Map();
 let timer=null,seq=0;
 const cleanup=(root)=>{
  for(const node of root.querySelectorAll?.('.writer-v92-explorer-preview, .writer-v92-favorite-icon')||[])node.remove();
  for(const node of root.querySelectorAll?.('.writer-v92-is-favorite')||[])node.classList.remove('writer-v92-is-favorite');
 };
 const addPreview=async(title,file,host,current,scan)=>{
  const data=writerV92PreviewInfo(plugin,file,previewCache);
  const outer=title.parentElement;
  if(!data||!outer)return;
  let text=data.text;
  if(data.read){
   try{
    const raw=await plugin.app.vault.cachedRead(data.read);
    text=writerV92Excerpt(raw,cfg.previewLength);
    previewCache.set(data.read.path,{mtime:data.read.stat?.mtime||0,text});
   }catch(_){return;}
  }
  if(scan!==seq||!host.isConnected||cfg.previews==='off')return;
  text=String(text||'').slice(0,cfg.previewLength);
  if(!text)return;
  const previous=outer.querySelector(':scope > .writer-v92-explorer-preview');
  if(previous?.dataset.preview===text)return;
  previous?.remove();
  const p=title.ownerDocument.createElement('div');
  p.className='writer-v92-explorer-preview';
  p.textContent=text;p.dataset.preview=text;
  p.setAttribute('title',text);
  p.setAttribute('aria-label',writerUi('Descrição: ','Preview: ')+text);
  // Below the title, outside the native click target.
  title.after(p);
 };
 const scan=async()=>{
  const id=++seq,active=cfg.enabled&&writerModuleOn(plugin,'nativeExplorer');
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;
   if(!host)continue;
   if(!active){cleanup(host);continue;}
   const favorites=new Set(writerV92FavoriteList(plugin));
   const targets=[...host.querySelectorAll('.nav-file-title[data-path],.nav-folder-title[data-path]')].slice(0,1200);
   const reads=[];
   for(const title of targets){
    const path=title.dataset.path;
    const file=plugin.app.vault.getAbstractFileByPath(path);
    if(!file)continue;
    const fav=file instanceof TFile&&favorites.has(path);
    title.classList.toggle('writer-v92-is-favorite',Boolean(fav));
    const old=title.querySelector(':scope > .writer-v92-favorite-icon');
    if(old?.dataset.icon!==cfg.favoriteIcon)old?.remove();
    if(file instanceof TFile){
     let icon=title.querySelector(':scope > .writer-v92-favorite-icon');
     if(!icon){
      icon=title.ownerDocument.createElement('button');
      icon.type='button';icon.className='writer-v92-favorite-icon';icon.dataset.icon=cfg.favoriteIcon;
      icon.setAttribute('aria-label',writerUi('Alternar favorito','Toggle favorite'));
      icon.setAttribute('title',writerUi('Adicionar/remover dos favoritos','Add/remove favorite'));
      require('obsidian').setIcon(icon,cfg.favoriteIcon);
      icon.addEventListener('mousedown',e=>e.stopPropagation());
      icon.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();writerV92FavoriteToggle(plugin,path);});
      title.appendChild(icon);
     }
     icon.classList.toggle('is-filled',fav);
     icon.setAttribute('aria-pressed',String(fav));
     if(cfg.favoriteColor)icon.style.setProperty('--writer-v92-favorite-color',cfg.favoriteColor);
     else icon.style.removeProperty('--writer-v92-favorite-color');
    }
    const outer=title.parentElement,hasPreview=outer?.querySelector(':scope > .writer-v92-explorer-preview');
    if(cfg.previews==='off'||(cfg.previews==='folder'&&!(file instanceof TFolder)&&!writerV92IsFolderNote(plugin.app,file))){
     hasPreview?.remove();continue;
    }
    reads.push(addPreview(title,file,host,id));
   }
   await Promise.all(reads.slice(0,250));
  }
 };
 const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{void scan().catch(e=>console.warn('[Basic AI] Explorer preview:',e));},140);};
 plugin.writerV92ExplorerRefresh=refresh;
 const menu=(menu,file)=>{
  if(!cfg.enabled||!writerModuleOn(plugin,'nativeExplorer'))return;
  if(file instanceof TFile&&file.extension==='md'){
   const fav=writerV92FavoriteList(plugin).includes(file.path);
   menu.addItem(item=>item.setTitle(fav?writerUi('Remover dos favoritos','Remove favorite'):writerUi('Adicionar aos favoritos','Add favorite'))
    .setIcon(cfg.favoriteIcon).onClick(()=>writerV92FavoriteToggle(plugin,file.path)));
  }
  if(file instanceof TFolder&&writerV92FolderNote(plugin.app,file)){
   menu.addItem(item=>item.setTitle(writerUi('Editar descrição da Folder Note','Edit Folder Note description'))
    .setIcon('text').onClick(()=>{void writerV92EditFolderDescription(plugin,file);}));
  }
 };
 plugin.registerEvent(plugin.app.workspace.on('file-menu',menu));
 if(typeof plugin.app.metadataCache?.on==='function')plugin.registerEvent(plugin.app.metadataCache.on('changed',file=>{
  if(file?.extension==='md')previewCache.delete(file.path);
  refresh();
 }));
 for(const name of ['create','delete','rename']){
  plugin.registerEvent(plugin.app.vault.on(name,()=>{previewCache.clear();refresh();}));
 }
 const observers=new Map();
 const attach=()=>{
  if(typeof MutationObserver!=='undefined'){
   const leaves=plugin.app.workspace.getLeavesOfType?.('file-explorer')||[],hosts=new Set(leaves.map(l=>l.view?.containerEl).filter(Boolean));
   for(const [host,obs] of observers)if(!hosts.has(host)){obs.disconnect();observers.delete(host);}
   for(const host of hosts)if(!observers.has(host)){
    const obs=new MutationObserver(records=>{
     if(records.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('writer-v92-explorer-preview')&&!n.classList?.contains('writer-v92-favorite-icon'))))refresh();
    });
    obs.observe(host,{subtree:true,childList:true});observers.set(host,obs);
   }
  }refresh();
 };
 plugin.app.workspace.onLayoutReady?.(attach);
 plugin.registerEvent(plugin.app.workspace.on('layout-change',attach));
 plugin.register?.(()=>{clearTimeout(timer);seq++;for(const [host,obs] of observers){obs.disconnect();cleanup(host);}observers.clear();plugin.writerV92ExplorerRefresh=null;});
 plugin.addCommand({id:'v92-toggle-favorite',name:writerUi('Favoritos: alternar nota ativa','Favorites: toggle current note'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile?.();
  if(file instanceof TFile&&file.extension==='md')writerV92FavoriteToggle(plugin,file.path);
 }});
}
function writerV92ExplorerSettings(plugin,panel){
 const cfg=plugin.settings.v92Explorer;
 panel.createEl('h3',{text:writerUi('Favoritos e prévias de arquivos','Favorites & file previews')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Os favoritos são os mesmos da homepage. O ícone preenchido destaca a nota no explorador. Para Folder Notes, edite a propriedade description pela própria nota ou pelo menu da pasta.',
  'Favorites are shared with Home. A filled icon highlights favorite notes in Explorer. For Folder Notes, edit the description property in the note or from the folder menu.'
 )});
 const save=async()=>{await plugin.saveSettings();plugin.writerV92ExplorerRefresh?.();};
 new Setting(panel).setName(writerUi('Exibir favoritos e prévias','Show favorites and previews'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await save();}));
 new Setting(panel).setName(writerUi('Ícone dos favoritos','Favorite icon')).addDropdown(d=>{
  for(const icon of WRITER_V92_FAVORITE_ICONS)d.addOption(icon,icon);
  if(!WRITER_V92_FAVORITE_ICONS.includes(cfg.favoriteIcon))d.addOption(cfg.favoriteIcon,cfg.favoriteIcon);
  d.setValue(cfg.favoriteIcon).onChange(async v=>{cfg.favoriteIcon=v;await save();});
 });
 new Setting(panel).setName(writerUi('Outro ícone Lucide','Other Lucide icon'))
  .setDesc(writerUi('Identificador de ícone instalado no Obsidian; vazio mantém a seleção acima.','Lucide icon available in Obsidian; leave empty to keep the selection above.'))
  .addText(t=>t.setPlaceholder('heart').setValue(cfg.favoriteIcon).onChange(async v=>{
   if(writerV9AvailableIcons().includes(v)){cfg.favoriteIcon=v;await save();}
  }));
 writerV9ColorSetting(panel,'Cor dos favoritos','Favorite color',cfg.favoriteColor,async v=>{cfg.favoriteColor=v;await save();});
 new Setting(panel).setName(writerUi('Prévias no explorador','File previews in explorer')).addDropdown(d=>{
  d.addOption('off',writerUi('Desativadas','Off'));
  d.addOption('folder',writerUi('Somente Folder Notes','Folder Notes only'));
  d.addOption('all',writerUi('Todas as notas + Folder Notes','All notes + Folder Notes'));
  d.setValue(cfg.previews).onChange(async v=>{cfg.previews=v;await save();});
 });
 new Setting(panel).setName(writerUi('Máximo de caracteres da prévia','Maximum preview characters'))
  .addSlider(s=>s.setLimits(40,300,10).setValue(cfg.previewLength).setDynamicTooltip()
   .onChange(async v=>{cfg.previewLength=v;await save();}));
 new Setting(panel).setName(writerUi('Priorizar propriedades description / summary','Prefer description / summary properties'))
  .addToggle(t=>t.setValue(cfg.preferDescription).onChange(async v=>{cfg.preferDescription=v;await save();}));
}
