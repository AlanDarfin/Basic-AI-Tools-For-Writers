'use strict';
/* v9.2.0 native explorer enhancements, inspired by Favorite Note and File Preview.
 * Reuses Basic's homepage favorites; never changes note content to mark a favorite.
 * Folder descriptions are read from the folder note's YAML frontmatter. */
const WRITER_V92_FAVORITE_ICONS=['star','heart','bookmark','sparkles','pin','flag','award','gem','flower-2','sun'];
function writerV92ExplorerMerge(settings){
 const old=settings.v92Explorer&&typeof settings.v92Explorer==='object'?settings.v92Explorer:{};
 const cfg=settings.v92Explorer={
  favoritesEnabled:true,favoriteIcon:'star',previewMode:'folder',previewMax:135,
  previewVisible:true,showImage:true,previewLines:2,previewImageSize:62,
  previewTouchExpand:true,previewHoldMs:650,
  folderDescriptionKey:'description',noteDescriptionKey:'description',favoriteIconColor:'',
  ...old
 };
 cfg.favoritesEnabled=cfg.favoritesEnabled!==false;
 cfg.previewVisible=cfg.previewVisible!==false;
 cfg.showImage=cfg.showImage!==false;
 cfg.previewTouchExpand=cfg.previewTouchExpand!==false;
 cfg.previewHoldMs=Math.max(400,Math.min(1500,Number(cfg.previewHoldMs)||650));
 cfg.previewLines=Math.max(1,Math.min(4,Math.floor(Number(cfg.previewLines)||2)));
 cfg.previewImageSize=Math.max(40,Math.min(96,Math.floor(Number(cfg.previewImageSize)||62)));
 cfg.favoriteIcon=/^[a-z][a-z0-9-]{0,38}$/.test(cfg.favoriteIcon)?cfg.favoriteIcon:'star';
 cfg.favoriteIconColor=/^#[0-9a-f]{6}$/i.test(String(cfg.favoriteIconColor||''))?cfg.favoriteIconColor:'';
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
function writerV92PreviewValue(plugin,file,full=false){
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
 return value.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,full?4000:cfg.previewMax);
}

/* Folder Notes preserve YAML descriptions even while metadata cache warms up. */
function writerV9216FolderDescription(plugin,folder,body,full=false){
 const meta=writerV92PreviewValue(plugin,folder,full);
 if(meta)return meta;
 if(body){
  const front=/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(body);
  if(front){
   try{
    const obj=require('obsidian').parseYaml?.(front[1])||{};
    const key=plugin.settings.v92Explorer.folderDescriptionKey;
    const value=obj[key]??obj.summary??obj.brief;
    const text=Array.isArray(value)?value.join(', '):typeof value==='string'?value:'';
    if(text.trim())return text.replace(/\s+/g,' ').trim().slice(0,full?4000:plugin.settings.v92Explorer.previewMax);
   }catch(_){}
  }
 }
 return writerV921PreviewBody(body,full?4000:plugin.settings.v92Explorer.previewMax);
}

/* Preview images come from local vault files only; external URLs are never requested. */
function writerV921PreviewSource(plugin,item){
 if(item instanceof TFolder)return writerV92FolderNote(plugin.app,item);
 return item instanceof TFile&&item.extension==='md'?item:null;
}
function writerV921ResolveImage(plugin,source,raw){
 let link=String(raw||'').trim();
 if(!link)return null;
 link=link.replace(/^!\[\[/,'').replace(/^\[\[/,'').replace(/\]\]$/,'');
 const md=link.match(/^!?\[[^\]]*\]\(([^)]+)\)$/);
 if(md)link=md[1];
 link=link.split('|')[0].split('#')[0].trim().replace(/^<|>$/g,'');
 if(/^https?:\/\//i.test(link)||/^[a-z][\w+.-]*:/i.test(link)||link.startsWith('//'))return null;
 try{link=decodeURIComponent(link);}catch(_){}
 if(!link||link.includes('\0')||link.length>500)return null;
 const linked=plugin.app.metadataCache?.getFirstLinkpathDest?.(link,source.path);
 const direct=plugin.app.vault.getAbstractFileByPath(link.replace(/^\//,''));
 const relative=plugin.app.vault.getAbstractFileByPath((source.parent?.path?source.parent.path+'/':'')+link);
 const file=[linked,direct,relative].find(x=>x instanceof TFile&&/^(png|jpe?g|webp|gif|avif|bmp)$/i.test(x.extension||''));
 return file||null;
}
function writerV921PreviewBody(raw,max){
 const content=String(raw||'').replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/,'')
  .replace(/^\s*~~~[\s\S]*?^\s*~~~\s*$/gm,'')
  .replace(/^\s*\x60{3}[\s\S]*?^\s*\x60{3}\s*$/gm,'');
 const lines=content.split(/\r?\n/);
 const relevant=[];
 for(const line of lines){
  let clean=line.trim();
  if(!clean&&relevant.length)break;
  if(!clean||/^(?:#{1,6}\s|!?\[\[|!\[|[-*+]\s+\[[x ]\]\s*$|---+$)/.test(clean))continue;
  clean=clean.replace(/!\[\[[^\]]+\]\]/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'')
   .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_m,t,alias)=>alias||t)
   .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
   .replace(/^[>\-*+\d.\s]+/,'').replace(/[*_\x60~]/g,'').trim();
  if(clean){relevant.push(clean);if(relevant.join(' ').length>max+100)break;}
 }
 return relevant.join(' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function writerV921PreviewImage(plugin,source,content){
 const front=plugin.app.metadataCache?.getFileCache?.(source)?.frontmatter||{};
 for(const key of ['cover','image','thumbnail','banner']){
  const raw=Array.isArray(front[key])?front[key][0]:front[key];
  const file=writerV921ResolveImage(plugin,source,raw);
  if(file)return file;
 }
 const embeds=plugin.app.metadataCache?.getFileCache?.(source)?.embeds||[];
 for(const embed of embeds.slice(0,32)){
  const file=writerV921ResolveImage(plugin,source,embed.link);
  if(file)return file;
 }
 const rx=/!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
 let match,count=0;
 while((match=rx.exec(String(content||'')))&&count++<48){
  const file=writerV921ResolveImage(plugin,source,match[1]||match[2]);
  if(file)return file;
 }
 return null;
}

/* Keep previews compact. After 1.5s hover, show the full safe plain text;
 * mouseleave restores the excerpt, and keyboard focus also expands it. */
function writerV929PreviewExpand(shell,shortText,fullText){
 const label=shell.querySelector(':scope > .writer-v92-file-preview');
 if(!label)return;
 const long=String(fullText||'');
 const truncated=long.length>shortText.length||label.scrollHeight>label.clientHeight+1;
 const expanded=shell.classList.contains('is-expanded');
 shell.dataset.previewShort=shortText; shell.dataset.previewFull=long;
 shell.dataset.expandable=String(truncated);
 shell.classList.toggle('is-expandable',truncated);
 if(!truncated)shell.classList.remove('is-expanded');
 if(truncated){
  shell.setAttribute('tabindex','0');shell.setAttribute('role','button');
  shell.setAttribute('aria-label',writerUi('Expandir descrição','Expand description'));
  shell.setAttribute('aria-expanded',String(expanded));
 }else{
  shell.removeAttribute('tabindex');shell.removeAttribute('role');
  shell.removeAttribute('aria-expanded');shell.removeAttribute('aria-label');
 }
 label.textContent=truncated&&expanded?long:shortText;
 if(shell.dataset.hoverListeners==='ready')return;
 shell.dataset.hoverListeners='ready';
 let timer=null,touchLocked=false,touchStart=null,skipClick=false;
 const open=()=>{
  if(shell.dataset.expandable!=='true'||!shell.isConnected)return;
  shell.classList.add('is-expanded');shell.setAttribute('aria-expanded','true');
  const target=shell.querySelector(':scope > .writer-v92-file-preview');
  if(target)target.textContent=shell.dataset.previewFull;
 };
 const close=()=>{
  clearTimeout(timer);timer=null;touchLocked=false;
  shell.classList.remove('is-expanded');shell.setAttribute('aria-expanded','false');
  const target=shell.querySelector(':scope > .writer-v92-file-preview');
  if(target)target.textContent=shell.dataset.previewShort;
 };
 shell.addEventListener('mouseenter',()=>{
  if(shell.dataset.expandable!=='true')return;
  clearTimeout(timer);timer=setTimeout(open,1500);
 });
 shell.addEventListener('mouseleave',()=>{if(!touchLocked)close();});
 // Mobile: a long press reveals the full description. Scrolling cancels the timer;
 // we do not suppress Obsidian's native context menu or prevent touch scrolling.
 shell.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||event.isPrimary===false)return;
  if(shell.dataset.expandable!=='true'||shell.dataset.holdMs==='0')return;
  touchStart={id:event.pointerId,x:event.clientX,y:event.clientY};
  clearTimeout(timer);
  const delay=Math.max(400,Math.min(1500,Number(shell.dataset.holdMs)||650));
  timer=setTimeout(()=>{touchLocked=true;skipClick=true;open();},delay);
 },{passive:true});
 shell.addEventListener('pointermove',event=>{
  if(event.pointerId!==touchStart?.id)return;
  if(!touchStart)return;
  if(Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>12){
   clearTimeout(timer);timer=null;touchStart=null;
  }
 },{passive:true});
 const stopTouch=()=>{clearTimeout(timer);timer=null;touchStart=null;};
 shell.addEventListener('pointerup',stopTouch,{passive:true});
 shell.addEventListener('pointercancel',stopTouch,{passive:true});
 shell.addEventListener('contextmenu',event=>{
  if(!touchLocked)return;
  event.preventDefault();event.stopPropagation();
 });
 shell.addEventListener('click',event=>{
  if(shell.dataset.expandable!=='true'||!touchLocked)return;
  event.preventDefault();event.stopPropagation();
  if(skipClick){skipClick=false;return;}
  if(shell.classList.contains('is-expanded'))close();
 });
 shell.addEventListener('focus',open);
 shell.addEventListener('blur',()=>{if(!touchLocked)close();});
 shell.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){
   if(shell.dataset.expandable!=='true')return;
   event.preventDefault();event.stopPropagation();
   if(shell.classList.contains('is-expanded'))close();else open();
  }else if(event.key==='Escape')close();
 });
}
function writerV92ExplorerRegister(plugin){
 let timer=null,reading=0;
 const cached=new Map(),queued=new Set(),queue=[];
 const active=()=>writerModuleOn(plugin,'nativeExplorer')&&plugin.settings.v9Explorer?.enabled!==false;
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,120);};
 const requestRead=source=>{
  if(!source||typeof plugin.app.vault.cachedRead!=='function'||cached.has(source.path)||queued.has(source.path))return;
  queued.add(source.path);queue.push(source);pump();
 };
 const pump=()=>{
  while(reading<5&&queue.length){
   const source=queue.shift();
   if(!source||!queued.has(source.path))continue;
   ++reading;
   Promise.resolve().then(()=>plugin.app.vault.cachedRead(source)).then(text=>{
    if(typeof text==='string'){
     cached.set(source.path,{mtime:source.stat?.mtime||0,
      content:text.slice(0,30000)});
     if(cached.size>1200)cached.delete(cached.keys().next().value);
    }
   }).catch(error=>{cached.set(source.path,{mtime:source.stat?.mtime||0,content:''});console.warn('[Basic AI] File preview:',source.path,error);})
    .finally(()=>{queued.delete(source.path);--reading;schedule();pump();});
  }
 };
 const drawToggle=(host,enabled)=>{
  const bar=host.querySelector('.nav-header > .nav-buttons-container')||
    host.querySelector('.nav-buttons-container');
  if(!bar)return;
  let button=bar.querySelector('.writer-v921-preview-toggle');
  if(!button){
   button=host.ownerDocument.createElement('button');
   button.className='clickable-icon nav-action-button writer-v921-preview-toggle';
   button.type='button';
   button.addEventListener('click',async event=>{
    event.preventDefault();event.stopPropagation();
    const cfg=plugin.settings.v92Explorer;
    cfg.previewVisible=!cfg.previewVisible;
    // Update instantly: never change the underlying preview mode.
    refresh();await plugin.saveSettings();
   });
   bar.appendChild(button);
  }
  const visible=enabled&&plugin.settings.v92Explorer.previewVisible&&plugin.settings.v92Explorer.previewMode!=='off';
  const title=writerUi(visible?'Ocultar prévias de notas e pastas':'Mostrar prévias de notas e pastas',
   visible?'Hide note and folder previews':'Show note and folder previews');
  button.title=title;button.setAttribute('aria-label',title);
  button.setAttribute('aria-pressed',String(visible));
  button.classList.toggle('is-active',visible);
  button.replaceChildren();
  require('obsidian').setIcon(button,visible?'captions':'captions-off');
 };
 const drawFavorite=(node,file,enabled)=>{
  const cfg=plugin.settings.v92Explorer;
  const canUse=enabled&&cfg.favoritesEnabled&&file instanceof TFile&&file.extension==='md';
  let button=node.querySelector(':scope > .writer-v92-favorite');
  if(!canUse){button?.remove();node.classList.remove('writer-v92-has-favorite','writer-v92-is-favorite');return;}
  if(!button){
   button=node.ownerDocument.createElement('button');
   button.className='writer-v92-favorite';
   button.type='button';
   for(const name of ['pointerdown','mousedown'])button.addEventListener(name,event=>event.stopPropagation());
   button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    void writerV92ToggleFavorite(plugin,button.dataset.path);
   });
   node.appendChild(button);
  }
  button.dataset.path=file.path;
  const favorite=writerV92Favorite(plugin,file.path);
  const label=writerUi(favorite?'Remover dos favoritos: ':'Adicionar aos favoritos: ',
   favorite?'Remove favorite: ':'Add favorite: ')+file.basename;
  button.setAttribute('aria-label',label);button.title=label;
  button.setAttribute('aria-pressed',String(favorite));
  if(button.dataset.icon!==cfg.favoriteIcon){
   button.replaceChildren();require('obsidian').setIcon(button,cfg.favoriteIcon);
   button.dataset.icon=cfg.favoriteIcon;
  }
  if(cfg.favoriteIconColor)node.style.setProperty('--writer-v92-favorite-color',cfg.favoriteIconColor);
  else node.style.removeProperty('--writer-v92-favorite-color');
  node.classList.add('writer-v92-has-favorite');
  node.classList.toggle('writer-v92-is-favorite',favorite);
 };
 const drawPreview=(node,item,enabled)=>{
  const cfg=plugin.settings.v92Explorer;
  const show=enabled&&cfg.previewVisible&&cfg.previewMode!=='off';
  const source=show?writerV921PreviewSource(plugin,item):null;
  const folder=item instanceof TFolder;
  const allowed=show&&source&&(folder||cfg.previewMode==='all');
  // The title is an Obsidian flex row. Adding preview text *inside* that row
  // concatenates folder names with descriptions on mobile. Put previews beside
  // the title as a sibling, before the nested folder children.
  const oldInline=node.querySelector(':scope > .writer-v92-preview-shell');
  oldInline?.remove();
  const existing=node.nextElementSibling?.classList?.contains('writer-v92-preview-shell')
   ?node.nextElementSibling:null;
  if(!allowed){
   existing?.remove();
   node.classList.remove('writer-v92-has-preview');
   return;
  }
  const read=cached.get(source.path);
  const stable=read&&read.mtime===(source.stat?.mtime||0);
  if(read&&!stable)cached.delete(source.path);
  // Regular notes always use their opening Markdown text rather than YAML description.
  if(!stable)requestRead(source);
  const body=stable?read.content:'';
  const description=folder?
   writerV9216FolderDescription(plugin,item,body,false):
   (stable?writerV921PreviewBody(body,cfg.previewMax):'');
  const fullDescription=folder?
   writerV9216FolderDescription(plugin,item,body,true):
   (stable?writerV921PreviewBody(body,4000):'');
  const image=cfg.showImage?writerV921PreviewImage(plugin,source,stable?read.content:''):null;
  const imagePath=image?.path||'';
  if(!description&&!imagePath){existing?.remove();node.classList.remove('writer-v92-has-preview');return;}
  let shell=existing;
  if(!shell){
   shell=node.ownerDocument.createElement('div');
   shell.className='writer-v92-preview-shell';
   node.insertAdjacentElement('afterend',shell);
  }
  shell.style.setProperty('--writer-v92-preview-lines',String(cfg.previewLines));
  shell.dataset.holdMs=cfg.previewTouchExpand?String(cfg.previewHoldMs):'0';
  shell.style.setProperty('--writer-v92-preview-image-size',cfg.previewImageSize+'px');
  shell.classList.toggle('has-image',Boolean(imagePath));
  let label=shell.querySelector(':scope > .writer-v92-file-preview');
  if(description){
   if(!label){
    label=node.ownerDocument.createElement('span');label.className='writer-v92-file-preview';
    shell.appendChild(label);
   }
   if(label.textContent!==description)label.textContent=description;
   label.removeAttribute('title');
   writerV929PreviewExpand(shell,description,fullDescription);
  }else{label?.remove();shell.classList.remove('is-expanded','is-expandable');}
  let thumbnail=shell.querySelector(':scope > .writer-v92-preview-image');
  if(imagePath){
   if(!thumbnail){
    thumbnail=node.ownerDocument.createElement('img');
    thumbnail.className='writer-v92-preview-image';
    thumbnail.alt='';
    thumbnail.loading='lazy';
    thumbnail.decoding='async';
    shell.appendChild(thumbnail);
   }
   if(thumbnail.dataset.path!==imagePath){
    thumbnail.dataset.path=imagePath;
    thumbnail.src=plugin.app.vault.getResourcePath(image);
   }
  }else thumbnail?.remove();
  node.classList.add('writer-v92-has-preview');
 };
 const refresh=()=>{
  const enabled=active();
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;if(!host)continue;
   drawToggle(host,enabled);
   for(const node of Array.from(host.querySelectorAll('.nav-file-title, .nav-folder-title')).slice(0,6000)){
    const path=node.getAttribute('data-path')||node.closest('[data-path]')?.getAttribute('data-path');
    if(!path)continue;
    const item=plugin.app.vault.getAbstractFileByPath(path);
    if(!(item instanceof TFile||item instanceof TFolder))continue;
    drawFavorite(node,item,enabled);drawPreview(node,item,enabled);
   }
  }
 };
 plugin.writerV92Explorer={refresh,schedule};
 plugin.addCommand?.({id:'v92-toggle-favorite',name:writerUi('Favoritos: alternar nota ativa','Favorites: toggle active note'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile?.();if(file instanceof TFile)void writerV92ToggleFavorite(plugin,file.path);
 }});
 plugin.addCommand?.({id:'v921-toggle-previews',name:writerUi('Explorador: mostrar/ocultar prévias','Explorer: show/hide previews'),callback:async()=>{
  const cfg=plugin.settings.v92Explorer;cfg.previewVisible=!cfg.previewVisible;
  refresh();await plugin.saveSettings();
 }});
 plugin.registerEvent(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!(file instanceof TFile)||!writerModuleOn(plugin,'nativeExplorer'))return;
  const favorite=writerV92Favorite(plugin,file.path);
  menu.addItem(item=>item.setTitle(writerUi(favorite?'Remover dos favoritos':'Adicionar aos favoritos',
    favorite?'Remove from favorites':'Add to favorites'))
   .setIcon(plugin.settings.v92Explorer.favoriteIcon)
   .onClick(()=>void writerV92ToggleFavorite(plugin,file.path)));
 }));
 for(const name of ['layout-change','file-open'])plugin.registerEvent(plugin.app.workspace.on(name,()=>{
  attach();schedule();
 }));
 for(const name of ['rename','delete','create','modify'])plugin.registerEvent(plugin.app.vault.on(name,(file,old)=>{
  if(name==='rename'&&old){
   const list=plugin.settings.v8Finish.homeFavorites;
   const index=list.indexOf(old);if(index>=0){list[index]=file.path;void plugin.saveSettings();}
   cached.delete(old);
  }
  if(name==='delete'){
   const list=plugin.settings.v8Finish.homeFavorites;
   const index=list.indexOf(file.path);if(index>=0){list.splice(index,1);void plugin.saveSettings();}
  }
  if(file?.path)cached.delete(file.path);
  schedule();
 }));
 if(typeof plugin.app.metadataCache?.on==='function')plugin.registerEvent(plugin.app.metadataCache.on('changed',file=>{
  if(file?.path)cached.delete(file.path);schedule();
 }));
 const observers=new Map();
 const attach=()=>{
  if(typeof MutationObserver==='undefined')return;
  const roots=new Set((plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]).map(x=>x.view?.containerEl).filter(Boolean));
  for(const [root,observer] of observers)if(!roots.has(root)){observer.disconnect();observers.delete(root);}
  for(const root of roots){
   if(observers.has(root))continue;
   const observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(n=>n.nodeType===1&&
      !n.closest?.('.writer-v92-favorite, .writer-v92-preview-shell, .writer-v921-preview-toggle')&&
      !n.classList?.contains('writer-v92-favorite')&&!n.classList?.contains('writer-v92-preview-shell')&&
      !n.classList?.contains('writer-v921-preview-toggle'))))schedule();
   });
   observer.observe(root,{childList:true,subtree:true});observers.set(root,observer);
  }
 };
 plugin.app.workspace.onLayoutReady?.(()=>{attach();schedule();});
 plugin.register?.(()=>{
  clearTimeout(timer);queue.length=0;queued.clear();cached.clear();
  for(const observer of observers.values())observer.disconnect();
  observers.clear();
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;if(!host)continue;
   host.querySelectorAll('.writer-v92-favorite, .writer-v92-preview-shell, .writer-v921-preview-toggle').forEach(x=>x.remove());
   host.querySelectorAll('.nav-file-title,.nav-folder-title').forEach(node=>node.style.removeProperty('--writer-v92-favorite-color'));
   host.querySelectorAll('.writer-v92-has-favorite,.writer-v92-is-favorite,.writer-v92-has-preview').forEach(x=>
    x.classList.remove('writer-v92-has-favorite','writer-v92-is-favorite','writer-v92-has-preview'));
  }
  plugin.writerV92Explorer=null;
 });
}
function writerV92ExplorerSettings(plugin,panel){
 const cfg=plugin.settings.v92Explorer;
 panel.createEl('h3',{text:writerUi('Favoritos e prévias no explorador','Explorer favorites & previews')});
 new Setting(panel).setName(writerUi('Favoritos no explorador','Explorer favorites')).addToggle(t=>t.setValue(cfg.favoritesEnabled)
  .onChange(async v=>{cfg.favoritesEnabled=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();}));
 writerV922IconSetting(plugin,panel,{
  pt:'Ícone de favorito',en:'Favorite icon',value:cfg.favoriteIcon,color:cfg.favoriteIconColor,
  defaultIcon:'star',
  description:writerUi('Pesquise ícones Lucide, salve seus preferidos e escolha também uma cor personalizada.',
   'Search Lucide icons, pin favorites and select a custom accent color.'),
  onApply:async(icon,color)=>{
   cfg.favoriteIcon=icon||'star';cfg.favoriteIconColor=color;
   await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }
 });
 new Setting(panel).setName(writerUi('Conteúdo nas prévias','Preview content'))
  .setDesc(writerUi('Folder Notes mostram a descrição; notas comuns mostram o início do texto.','Folder Notes show descriptions; regular notes show opening text.'))
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
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Notas comuns mostram o começo do conteúdo Markdown, não a propriedade description. A descrição acima é exclusiva das Folder Notes.','Regular notes show the beginning of Markdown content, not the description property. The description above is exclusive to Folder Notes.')});
 new Setting(panel).setName(writerUi('Mostrar prévias agora','Show previews now'))
  .addToggle(t=>t.setValue(cfg.previewVisible).onChange(async v=>{
   cfg.previewVisible=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Miniatura da primeira imagem','Preview first image'))
  .setDesc(writerUi('Usa capa, thumbnail ou primeira imagem local incorporada à nota.','Uses the local cover, thumbnail or first embedded image from the note.'))
  .addToggle(t=>t.setValue(cfg.showImage).onChange(async v=>{
   cfg.showImage=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Expandir ao pressionar (mobile)','Long-press to expand (mobile)'))
  .addToggle(t=>t.setValue(cfg.previewTouchExpand).onChange(async value=>{
   cfg.previewTouchExpand=value;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Tempo do toque prolongado','Long-press duration'))
  .addSlider(t=>t.setLimits(400,1500,50).setValue(cfg.previewHoldMs).setDynamicTooltip().onChange(async value=>{
   cfg.previewHoldMs=value;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Linhas da descrição','Description lines'))
  .addSlider(t=>t.setLimits(1,4,1).setValue(cfg.previewLines).setDynamicTooltip().onChange(async v=>{
   cfg.previewLines=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Tamanho da miniatura','Thumbnail size'))
  .addSlider(t=>t.setLimits(40,96,4).setValue(cfg.previewImageSize).setDynamicTooltip().onChange(async v=>{
   cfg.previewImageSize=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();
  }));
 new Setting(panel).setName(writerUi('Limite da descrição','Preview length')).addSlider(s=>s.setLimits(40,280,10)
  .setValue(cfg.previewMax).setDynamicTooltip().onChange(async v=>{cfg.previewMax=v;await plugin.saveSettings();plugin.writerV92Explorer?.schedule();}));
}
