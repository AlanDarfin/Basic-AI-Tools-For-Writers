'use strict';
/* Basic 10.10 — original opt-in sidebar organizer and editor width controller.
 * Use the public workspace/events API where possible; no source copied from plugins.
 * All DOM changes are owned by Basic and removed when disabled/unloaded. */
const WRITER_V1010_VIEWS={
 'file-explorer':['folder-open','Arquivos','Files'],
 'global-search':['search','Pesquisar','Search'],
 search:['search','Pesquisar','Search'],
 bookmarks:['bookmark','Favoritos','Bookmarks'],
 tag:['tags','Tags','Tags'],
 'all-properties':['list-filter','Propriedades','Properties'],
 backlink:['links','Links de entrada','Backlinks'],
 'outgoing-link':['link','Links de saída','Outgoing links'],
 outline:['list-tree','Estrutura','Outline']
};
function writerV1010Clamp(value,fallback=80){
 const n=Number(value);return Number.isFinite(n)?Math.max(20,Math.min(100,Math.round(n))):fallback;
}
function writerV1010Merge(settings){
 const previous=settings.v1010Layout&&typeof settings.v1010Layout==='object'?settings.v1010Layout:{};
 const sidebar=previous.sidebar&&typeof previous.sidebar==='object'?previous.sidebar:{};
 const width=previous.width&&typeof previous.width==='object'?previous.width:{};
 // Keep object identity stable: settings panels and live handlers share this object.
 Object.assign(sidebar,{enabled:false,mobileTabs:true,desktopTabs:false,overflow:true,actionMenu:true,fileFilter:false,
  sharedFilter:false,integrateSpaces:true,compactFooter:true,order:{left:[],right:[]},...sidebar});
 Object.assign(width,{enabled:true,current:80,defaultPercent:80,showStatus:true,frontmatter:true,...width});
 const cfg=Object.assign(previous,{sidebar,width});
 settings.v1010Layout=cfg;
 cfg.width.current=writerV1010Clamp(cfg.width.current);
 cfg.width.defaultPercent=writerV1010Clamp(cfg.width.defaultPercent);
 for(const side of ['left','right']){
  const values=cfg.sidebar.order?.[side];
  cfg.sidebar.order[side]=Array.isArray(values)?[...new Set(values.filter(v=>typeof v==='string'&&v.length<100))].slice(0,40):[];
 }
 return cfg;
}
function writerV1010YamlWidth(plugin,file){
 if(!file||file.extension!=='md')return null;
 const meta=plugin.app?.metadataCache?.getFileCache?.(file)?.frontmatter;
 const raw=meta?.['editor-width'];
 if(raw===undefined||raw===null||raw==='')return null;
 const n=Number(raw);return Number.isFinite(n)?writerV1010Clamp(n):null;
}
function writerV1010WidthForFile(plugin,file){
 const cfg=writerV1010Merge(plugin.settings).width;
 if(file?.path&&plugin._writerV1010TemporaryWidths?.has(file.path))
  return plugin._writerV1010TemporaryWidths.get(file.path);
 if(cfg.frontmatter!==false){
  const value=writerV1010YamlWidth(plugin,file);
  if(value!==null)return value;
 }
 return cfg.current;
}
/* Obsidian mobile uses a MobileDrawer, not a desktop TabGroup.
 * Inspect its shape before using undocumented methods, then fall back to native UI. */
function writerV1010MobileDrawer(workspace,side){
 const split=side==='right'?workspace?.rightSplit:workspace?.leftSplit;
 if(split?.type!=='mobile-drawer'||!Array.isArray(split.children)||
  typeof split.selectTabIndex!=='function'||!split.tabsContainerEl||!split.tabsListEl)return null;
 return split;
}
function writerV1010SideForLeaf(workspace,leaf){
 for(const side of ['left','right']){
  const drawer=writerV1010MobileDrawer(workspace,side);
  if(drawer?.children.includes(leaf))return side;
 }
 try{
  const root=leaf?.getRoot?.();
  if(root&&root===workspace.leftSplit)return 'left';
  if(root&&root===workspace.rightSplit)return 'right';
  const host=leaf?.view?.containerEl;
  if(host?.closest?.('.mod-left-split,.workspace-drawer.mod-left'))return 'left';
  if(host?.closest?.('.mod-right-split,.workspace-drawer.mod-right'))return 'right';
 }catch(error){console.warn('[Basic] Could not identify sidebar:',error);}
 return '';
}
function writerV1010CollectLeaves(workspace,side){
 const leaves=[],seen=new Set(),drawer=writerV1010MobileDrawer(workspace,side);
 const visit=leaf=>{
  const type=leaf?.view?.getViewType?.()||leaf?.getViewState?.()?.type;
  if(!type||type==='empty'||type==='markdown'||seen.has(type))return;
  if(writerV1010SideForLeaf(workspace,leaf)!==side)return;
  seen.add(type);leaves.push({type,leaf});
 };
 if(drawer)for(const leaf of drawer.children)visit(leaf);
 else if(typeof workspace.iterateAllLeaves==='function')workspace.iterateAllLeaves(visit);
 else for(const type of Object.keys(WRITER_V1010_VIEWS))
  for(const leaf of workspace.getLeavesOfType?.(type)||[])visit(leaf);
 return leaves;
}
function writerV1010SelectLeaf(plugin,side,leaf){
 const workspace=plugin.app.workspace,drawer=writerV1010MobileDrawer(workspace,side);
 if(drawer){
  const index=drawer.children.indexOf(leaf);
  if(index<0)return false;
  try{
   drawer.selectTabIndex(index);
   // Mobile drawer selection and activeLeaf are separate. Keep both in sync;
   // revealLeaf() alone can select the wrong pane on phones.
   if(typeof workspace.setActiveLeaf==='function')
    workspace.setActiveLeaf(leaf,{focus:!drawer.isPinned});
   plugin.writerV1010Refresh?.();
   return true;
  }catch(error){console.error('[Basic] Mobile sidebar tab selection:',error);return false;}
 }
 try{void workspace.revealLeaf?.(leaf);return true;}
 catch(error){console.warn('[Basic] Could not reveal sidebar tab:',error);return false;}
}
function writerV1010SortLeaves(plugin,side,leaves){
 const order=writerV1010Merge(plugin.settings).sidebar.order[side];
 return leaves.slice().sort((a,b)=>{
  const ai=order.indexOf(a.type),bi=order.indexOf(b.type);
  return (ai<0?999:ai)-(bi<0?999:bi);
 });
}
function writerV1010Icon(host,name){
 const setIcon=require('obsidian').setIcon;
 if(typeof setIcon==='function')setIcon(host,name||'panel-left');
 else host.textContent='⋯';
}
function writerV1010ActiveLeaf(workspace,leaves,side){
 const drawer=writerV1010MobileDrawer(workspace,side);
 if(drawer){
  const active=drawer.children[drawer.currentTab];
  if(leaves.some(entry=>entry.leaf===active))return active;
 }
 return leaves.find(entry=>entry.leaf===workspace.activeLeaf)?.leaf||
  leaves.find(entry=>entry.leaf?.view?.containerEl?.closest?.('.mod-active'))?.leaf||leaves[0]?.leaf;
}
function writerV1010ActionIcon(action,label){
 const svg=action?.querySelector?.('svg');
 const explicit=svg?.getAttribute?.('data-lucide')||action?.getAttribute?.('data-icon');
 if(explicit&&/^[a-z][a-z0-9-]{1,50}$/.test(explicit))return explicit;
 const classes=svg?.classList;
 const iconClass=classes&&typeof classes[Symbol.iterator]==='function'?
  [...classes].find(cls=>cls.startsWith('lucide-')&&cls!=='lucide'):null;
 if(iconClass)return iconClass.slice(7);
 const text=String(label||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 for(const [rx,icon] of [
  [/nova nota|new note/,'square-pen'],[/nova pasta|new folder/,'folder-plus'],
  [/orden|ordem|sort/,'arrow-up-narrow-wide'],[/revelar|reveal/,'gallery-vertical'],
  [/expand|expand/,'chevrons-up-down'],[/recolher|collapse/,'chevrons-down-up'],
  [/filtro|filter|busca|search/,'search'],[/space/,'layers'],
  [/previa|preview/,'panel-bottom'],[/configur|setting/,'settings'],
  [/cofre|vault/,'folder-open'],[/favorit|bookmark/,'bookmark']
 ])if(rx.test(text))return icon;
 return 'circle-dot';
}
function writerV1010IsSortingAction(action,label){
 const text=String(label||'').toLocaleLowerCase();
 if(/orden|ordem|sort|sortier|排序/.test(text))return true;
 const svg=action?.querySelector?.('svg');
 return Boolean(svg?.classList?.contains?.('lucide-arrow-up-narrow-wide')||
  svg?.classList?.contains?.('lucide-arrow-down-wide-narrow'));
}
function writerV1010FillSortMenu(plugin,menu,view){
 for(const [mode,pt,en,icon] of [
  ['alphabetical','Nome (A–Z)','Name (A–Z)','arrow-down-a-z'],
  ['alphabeticalReverse','Nome (Z–A)','Name (Z–A)','arrow-up-z-a'],
  ['byModifiedTime','Modificados recentemente','Recently modified','clock'],
  ['byModifiedTimeReverse','Modificados há mais tempo','Oldest modified','history'],
  ['byCreatedTime','Criados recentemente','Recently created','calendar-plus'],
  ['byCreatedTimeReverse','Criados há mais tempo','Oldest created','calendar-days']
 ]){
  menu.addItem(item=>{
   item.setTitle(writerUi(pt,en)).setIcon(icon);
   item.setChecked?.(view?.sortOrder===mode);
   item.onClick(()=>{
    if(typeof view?.setSortOrder==='function')view.setSortOrder(mode);
    else if(typeof writerV93FlexSortModal==='function')writerV93FlexSortModal(plugin,null);
   });
  });
 }
 if(typeof writerV1043GlobalSortingMenu==='function'&&plugin.settings?.v91Flex)
  writerV1043GlobalSortingMenu(plugin,menu);
}
function writerV1010SidebarMenu(plugin,event,side,leaves,active){
 const menu=new Menu(plugin.app),current=active?.view?.containerEl;
 const actions=[...new Set([...(current?.querySelectorAll?.('.view-actions .clickable-icon,.nav-header .nav-action-button,.nav-header .nav-buttons-container .clickable-icon')||[])])];
 let count=0;
 for(const action of actions.slice(0,14)){
  const label=String(action.getAttribute('aria-label')||action.getAttribute('title')||'').trim();
  if(!label||action.closest('.writer-v1010-sidebar-toolbar'))continue;
  count++;
  const icon=writerV1010ActionIcon(action,label);
  if(writerV1010IsSortingAction(action,label)){
   menu.addItem(item=>{
    item.setTitle(label).setIcon(icon);
    if(typeof item.setSubmenu==='function')
     writerV1010FillSortMenu(plugin,item.setSubmenu(),active?.view);
    else item.onClick(()=>typeof writerV93FlexSortModal==='function'&&writerV93FlexSortModal(plugin,null));
   });
  }else menu.addItem(item=>item.setTitle(label).setIcon(icon).onClick(()=>action.click?.()));
 }
 if(count)menu.addSeparator?.();
 menu.addItem(item=>item.setTitle(writerUi('Configurações do Obsidian','Obsidian settings'))
  .setIcon('settings').onClick(()=>plugin.app.setting?.open?.()));
 // Prefer Obsidian's own chooser, then the existing native vault switcher.
 const chooser=plugin.app.openVaultChooser||plugin.app.openVaultSwitcher;
 const vaultName=plugin.app.vault?.getName?.()||writerUi('cofre atual','current vault');
 const switcher=plugin.app.workspace?.leftSplit?.headerEl?.querySelector?.('.workspace-drawer-header-switcher');
 if(typeof chooser==='function'||switcher)menu.addItem(item=>item.setTitle(writerUi('Cofre: ','Vault: ')+vaultName)
  .setIcon('folder-open').onClick(()=>{
   if(typeof chooser==='function')chooser.call(plugin.app);
   else switcher?.click?.();
  }));
 if(side==='left'&&plugin.settings.v9Spaces?.enabled){
  menu.addItem(item=>item.setTitle(writerUi('Gerenciar Spaces','Manage Spaces'))
   .setIcon('layers').onClick(()=>typeof writerV9SpaceModal==='function'&&writerV9SpaceModal(plugin)));
 }
 if(leaves?.length)menu.addSeparator?.();
 for(const entry of leaves.slice(0,20)){
  const info=WRITER_V1010_VIEWS[entry.type]||['panels',entry.type,entry.type];
  menu.addItem(item=>item.setTitle(writerUi(info[1],info[2])).setIcon(info[0])
   .onClick(()=>writerV1010SelectLeaf(plugin,side,entry.leaf)));
 }
 event?.stopPropagation?.();
 if(event?.clientX!==undefined)menu.showAtMouseEvent(event);
 else menu.showAtPosition({x:90,y:110});
}
function writerV1010FilterFiles(workspace,query){
 const text=String(query||'').toLocaleLowerCase();
 for(const leaf of workspace.getLeavesOfType?.('file-explorer')||[]){
  const nodes=leaf.view?.containerEl?.querySelectorAll?.('.nav-file,.nav-folder')||[];
  for(const node of nodes){
   if(!text){node.classList.remove('writer-v1010-filter-hidden');continue;}
   const title=node.querySelector?.(':scope > .nav-file-title,:scope > .nav-folder-title')?.textContent||'';
   const children=node.querySelectorAll?.('.nav-file-title,.nav-folder-title')||[];
   const match=String(title).toLocaleLowerCase().includes(text)||
    [...children].some(child=>String(child.textContent||'').toLocaleLowerCase().includes(text));
   node.classList.toggle('writer-v1010-filter-hidden',!match);
  }
 }
}
function writerV1010Register(plugin){
 const cfg=writerV1010Merge(plugin.settings);
 if(plugin._writerV1010Registered)return;
 plugin._writerV1010Registered=true;
 const cleanup=new Set(),workspace=plugin.app.workspace;
 const showSidebar=side=>{
  const sidebar=cfg.sidebar;
  if(!sidebar.enabled)return false;
  const mobile=Boolean(require('obsidian').Platform?.isMobile);
  return mobile?sidebar.mobileTabs!==false:sidebar.desktopTabs===true;
 };
 const hosts=new Map();
 const groupedViews=new Map();
 const groupNativeActions=(side,leaves,enabled)=>{
  const previous=groupedViews.get(side)||new Set(),next=new Set();
  for(const entry of leaves){
   // Third-party sidebar views may use the same HTML as toolbar content.
   if(!Object.hasOwn(WRITER_V1010_VIEWS,entry.type))continue;
   const el=entry.leaf?.view?.containerEl;
   const header=el?.querySelector?.('.nav-header');
   const actions=header?.querySelector?.(':scope > .nav-buttons-container');
   if(!enabled||!actions||!el?.classList)continue;
   el.classList.add('writer-v1011-grouped-native-actions');next.add(el);
   const empty=[...header.children].every(child=>
    child===actions||child.style?.display==='none');
   header.classList.toggle('writer-v1011-empty-native-header',empty);
  }
  for(const el of previous)if(!next.has(el)){
   el.classList?.remove('writer-v1011-grouped-native-actions');
   el.querySelector?.('.nav-header')?.classList?.remove('writer-v1011-empty-native-header');
  }
  groupedViews.set(side,next);
 };

 let queued=null,unloaded=false,status=null,range=null,value=null;
 const make=(tag,cls,doc)=>{const node=doc.createElement(tag);if(cls)node.className=cls;return node;};
 const restoreSidebar=side=>{
  groupNativeActions(side,[],false);
  const bar=hosts.get(side),split=side==='right'?workspace.rightSplit:workspace.leftSplit;
  bar?.remove?.();hosts.delete(side);
  split?.tabsListEl?.classList?.remove('writer-v1011-native-tabs-hidden');
  split?.containerEl?.classList?.remove('writer-v1011-managed-mobile','writer-v1011-compact-footer');
 };
 const renderSide=side=>{
  const split=side==='left'?workspace.leftSplit:workspace.rightSplit;
  const drawer=writerV1010MobileDrawer(workspace,side),root=split?.containerEl;
  const mobile=Boolean(require('obsidian').Platform?.isMobile);
  if(!showSidebar(side)||!root||
     (mobile&&!drawer)||
     (mobile&&(root.classList?.contains('osm-sidebar')||
       root.ownerDocument?.body?.classList?.contains('osm-mobile-tabs')))){
   restoreSidebar(side);return;
  }
  // Mobile: draw inside the native tab selector, never below it as a duplicate row.
  // If private drawer internals change, use the unmodified native selector.
  const header=drawer?drawer.tabsContainerEl:
   root.querySelector?.('.workspace-tab-header-container');
  if(!header){restoreSidebar(side);return;}
  const doc=header.ownerDocument;
  const leaves=writerV1010SortLeaves(plugin,side,writerV1010CollectLeaves(workspace,side));
  if(!leaves.length){restoreSidebar(side);return;}
  groupNativeActions(side,leaves,Boolean(drawer)&&cfg.sidebar.actionMenu!==false);
  let bar=hosts.get(side);
  if(!bar||bar.parentElement!==header){
   bar?.remove?.();
   bar=make('div','writer-v1010-sidebar-toolbar'+(drawer?' writer-v1011-native-row':''),doc);
   bar.addEventListener('click',event=>event?.stopPropagation?.());
   header.appendChild(bar);hosts.set(side,bar);
  }
  if(drawer){
   drawer.tabsListEl.classList.add('writer-v1011-native-tabs-hidden');
   root.classList.add('writer-v1011-managed-mobile');
   // Only compact the vault footer when the user can still open the vault chooser.
   const switcher=drawer.headerEl?.querySelector?.('.workspace-drawer-header-switcher');
   const canSwitch=typeof plugin.app.openVaultChooser==='function'||
    typeof plugin.app.openVaultSwitcher==='function';
   // A hidden DOM switcher alone is not a reliable replacement for a native vault picker.
   root.classList.toggle('writer-v1011-compact-footer',
    side==='left'&&cfg.sidebar.compactFooter!==false&&canSwitch);
  }
  const active=writerV1010ActiveLeaf(workspace,leaves,side);
  const max=drawer?Math.max(2,Math.min(6,Math.floor(((root.clientWidth||380)-55)/48))):
   Math.max(2,Math.min(8,Math.floor(((root.clientWidth||400)-55)/40)));
  const visible=leaves.slice(0,max),hidden=leaves.slice(max);
  const oldState=bar._writerV1010Render;
  const same=oldState&&oldState.visible.length===visible.length&&
   oldState.hidden.length===hidden.length&&
   oldState.actions===(cfg.sidebar.actionMenu!==false)&&
   oldState.filter===(cfg.sidebar.fileFilter===true&&side==='left')&&
   oldState.visible.every((leaf,i)=>leaf===visible[i].leaf)&&
   oldState.hidden.every((leaf,i)=>leaf===hidden[i].leaf);
  if(same){
   for(let i=0;i<visible.length;i++){
    const selected=visible[i].leaf===active,button=oldState.buttons[i];
    button?.classList?.toggle('is-active',selected);
    button?.setAttribute?.('aria-pressed',String(selected));
   }
   if(oldState.more){
    const selected=hidden.some(entry=>entry.leaf===active);
    oldState.more.classList.toggle('is-active',selected);
    oldState.more.setAttribute('aria-pressed',String(selected));
   }
   return;
  }
  bar.replaceChildren();
  const toolbarButtons=[],toolbarState={
   visible:visible.map(entry=>entry.leaf),hidden:hidden.map(entry=>entry.leaf),
   actions:cfg.sidebar.actionMenu!==false,
   filter:cfg.sidebar.fileFilter===true&&side==='left',
   buttons:toolbarButtons,more:null
  };
  bar._writerV1010Render=toolbarState;
  const addIcon=(type,title,callback,isActive=false)=>{
   const btn=make('button','writer-v1010-sidebar-button'+(isActive?' is-active':''),doc);
   btn.type='button';btn.setAttribute('aria-label',title);
   btn.setAttribute('title',title);btn.setAttribute('aria-pressed',String(isActive));
   writerV1010Icon(btn,WRITER_V1010_VIEWS[type]?.[0]||'panel-left');
   btn.addEventListener('click',event=>{event?.stopPropagation?.();callback(event);});bar.appendChild(btn);
   return btn;
  };
  for(const entry of visible){
   const info=WRITER_V1010_VIEWS[entry.type]||['panel-left',entry.type,entry.type];
   toolbarButtons.push(addIcon(entry.type,writerUi(info[1],info[2]),
    ()=>writerV1010SelectLeaf(plugin,side,entry.leaf),active===entry.leaf));
  }
  if(hidden.length&&cfg.sidebar.actionMenu===false){
   const overflow=addIcon('',writerUi('Mais painéis','More panels'),event=>{
    const menu=new Menu(plugin.app);
    for(const entry of hidden){
     const info=WRITER_V1010_VIEWS[entry.type]||['panel-left',entry.type,entry.type];
     menu.addItem(item=>item.setTitle(writerUi(info[1],info[2])).setIcon(info[0])
      .onClick(()=>writerV1010SelectLeaf(plugin,side,entry.leaf)));
    }
    menu.showAtMouseEvent?.(event);
   });writerV1010Icon(overflow,'ellipsis');toolbarState.more=overflow;
  }
  if(cfg.sidebar.actionMenu!==false){
   const menu=addIcon('',writerUi('Ações e mais painéis','Actions and more views'),
    event=>writerV1010SidebarMenu(plugin,event,side,hidden,active),hidden.some(item=>item.leaf===active));
   writerV1010Icon(menu,'ellipsis');toolbarState.more=menu;
  }
  if(cfg.sidebar.fileFilter===true&&side==='left'){
   // The filter is opt-in; it never appears as a second full-width header.
   const box=make('input','writer-v1010-sidebar-filter',doc);
   box.type='search';box.placeholder=writerUi('Filtrar…','Filter…');
   box.setAttribute('aria-label',box.placeholder);
   box.value=plugin._writerV1010Filter||'';
   box.addEventListener('input',()=>{
    plugin._writerV1010Filter=box.value;
    writerV1010FilterFiles(workspace,box.value);
   });bar.appendChild(box);
  }
 };
 const allMarkdown=()=>{
  const leaves=[];workspace.iterateAllLeaves?.(leaf=>{
   if(leaf?.view?.getViewType?.()==='markdown')leaves.push(leaf);
  });
  if(!leaves.length)leaves.push(...(workspace.getLeavesOfType?.('markdown')||[]));
  return leaves;
 };
 const paintWidth=()=>{
  for(const leaf of allMarkdown()){
   const el=leaf?.view?.containerEl;
   if(!el?.style)continue;
   if(cfg.width.enabled!==true){el.classList.remove('writer-v1010-editor-width');el.style.removeProperty('--basic-editor-width');continue;}
   const width=writerV1010WidthForFile(plugin,leaf.view?.file);
   el.classList.add('writer-v1010-editor-width');
   el.style.setProperty('--basic-editor-width',String(width)+'%');
  }
  const file=workspace.getActiveFile?.();
  const current=writerV1010WidthForFile(plugin,file),yaml=cfg.width.frontmatter!==false&&writerV1010YamlWidth(plugin,file)!==null;
  if(range){range.value=String(current);range.title=yaml?writerUi('Nota usa editor-width no YAML. Alteração temporária nesta sessão.','This note has YAML editor-width; slider changes are session-only.'):'';}
  if(value)value.textContent=current+'%';
  if(status)status.style.display=cfg.width.enabled&&cfg.width.showStatus&&!require('obsidian').Platform?.isMobile?'':'none';
 };
 const refresh=()=>{
  if(unloaded)return;
  try{renderSide('left');renderSide('right');paintWidth();}
  catch(error){console.error('[Basic] Sidebar / width refresh failed:',error);}
 };
 const queue=()=>{
  if(unloaded)return;
  if(queued!==null)clearTimeout(queued);
  queued=setTimeout(()=>{queued=null;refresh();},90);
 };
 plugin.writerV1010Refresh=queue;
 const item=plugin.addStatusBarItem?.();
 if(item){
  status=item;
  item.addClass?.('writer-v1010-width-status');
  const doc=item.ownerDocument;
  const title=make('span','writer-v1010-width-name',doc);title.textContent=writerUi('Largura','Width');item.appendChild(title);
  range=make('input','writer-v1010-width-range',doc);
  range.type='range';range.min='20';range.max='100';range.step='1';
  range.setAttribute('aria-label',writerUi('Largura do editor','Editor width'));
  item.appendChild(range);
  value=make('button','writer-v1010-width-value',doc);value.type='button';
  value.title=writerUi('Restaurar largura padrão','Reset default width');item.appendChild(value);
  range.addEventListener('input',()=>{
   const amount=writerV1010Clamp(range.value);
   const file=workspace.getActiveFile?.();
   if(cfg.width.frontmatter!==false&&writerV1010YamlWidth(plugin,file)!==null&&file?.path){
    plugin._writerV1010TemporaryWidths??=new Map();plugin._writerV1010TemporaryWidths.set(file.path,amount);
   }else cfg.width.current=amount;
   paintWidth();
  });
  range.addEventListener('change',()=>{void plugin.saveSettings();});
  value.addEventListener('click',()=>{
   const file=workspace.getActiveFile?.();
   if(file?.path)plugin._writerV1010TemporaryWidths?.delete(file.path);
   cfg.width.current=cfg.width.defaultPercent;
   void plugin.saveSettings().then(paintWidth);
  });
 }
 for(const name of ['layout-change','active-leaf-change','file-open']){
  if(typeof workspace.on==='function')plugin.registerEvent?.(workspace.on(name,queue));
 }
 if(typeof plugin.app.metadataCache?.on==='function')
  plugin.registerEvent?.(plugin.app.metadataCache.on('changed',queue));
 if(typeof window!=='undefined'&&typeof plugin.registerDomEvent==='function')
  plugin.registerDomEvent(window,'resize',queue);
 const startup=()=>{if(unloaded)return;queue();};
 if(typeof workspace.onLayoutReady==='function')workspace.onLayoutReady(startup);
 else queue();
 plugin.register?.(()=>{
  unloaded=true;clearTimeout(queued);
  restoreSidebar('left');restoreSidebar('right');
  for(const leaf of allMarkdown()){
   const el=leaf?.view?.containerEl;
   el?.classList?.remove('writer-v1010-editor-width');
   el?.style?.removeProperty('--basic-editor-width');
  }
  writerV1010FilterFiles(workspace,'');
  status?.remove?.();
  plugin.writerV1010Refresh=null;
 });
}
function writerV1010Settings(plugin,panel){
 const cfg=writerV1010Merge(plugin.settings);
 panel.createEl('h3',{text:writerUi('Painéis laterais','Sidebars')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Gerencie abas laterais sem substituir o explorador ou as Spaces. O recurso fica desligado por padrão; layouts anteriores são preservados.',
  'Manage sidebar tabs without replacing File Explorer or Spaces. Off by default; prior layouts remain untouched.')});
 const toggle=(target,key,pt,en)=>new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(target[key]===true).onChange(async v=>{target[key]=v;await plugin.saveSettings();plugin.writerV1010Refresh?.();plugin.writerV1011SpacesDockRefresh?.();}));
 for(const [key,pt,en] of [
  ['enabled','Ativar gerenciador de painéis','Enable sidebar manager'],
  ['mobileTabs','Abas em ícones no celular','Icon tabs on mobile'],
  ['desktopTabs','Abas extras no computador','Extra tabs on desktop'],
  ['overflow','Agrupar abas excedentes','Overflow for extra tabs'],
  ['actionMenu','Menu de ações do painel','Sidebar action menu'],
  ['fileFilter','Filtro local do explorador','Local Explorer filter'],
  ['integrateSpaces','Integrar Spaces ao rodapé móvel','Integrate Spaces into mobile footer'],
  ['compactFooter','Compactar rodapé nativo no celular','Compact native footer on mobile']
 ])toggle(cfg.sidebar,key,pt,en);
 new Setting(panel).setName(writerUi('Organizar abas laterais','Reorder sidebar tabs'))
  .setDesc(writerUi('A ordem será usada no PC e no celular, sem alterar o workspace nativo.','The same order applies on desktop and mobile without rewriting the native workspace.'))
  .addButton(button=>button.setButtonText(writerUi('Organizar…','Organize…')).onClick(()=>{
   const modal=new Modal(plugin.app);
   modal.onOpen=()=>{
    modal.setTitle(writerUi('Organizar painéis','Arrange panels'));
    const draw=()=>{
     modal.contentEl.empty();
     for(const side of ['left','right']){
      modal.contentEl.createEl('h4',{text:side==='left'?writerUi('Esquerda','Left'):writerUi('Direita','Right')});
      const leaves=writerV1010SortLeaves(plugin,side,writerV1010CollectLeaves(plugin.app.workspace,side));
      const order=cfg.sidebar.order[side];
      for(const [index,entry] of leaves.entries()){
       const row=new Setting(modal.contentEl).setName(writerUi(
        WRITER_V1010_VIEWS[entry.type]?.[1]||entry.type,WRITER_V1010_VIEWS[entry.type]?.[2]||entry.type));
       for(const [offset,label] of [[-1,'↑'],[1,'↓']])row.addButton(button=>button.setButtonText(label).onClick(async()=>{
        const types=leaves.map(item=>item.type);
        const target=index+offset;
        if(target<0||target>=types.length)return;
        [types[index],types[target]]=[types[target],types[index]];
        cfg.sidebar.order[side]=types;
        await plugin.saveSettings();plugin.writerV1010Refresh?.();draw();
       }));
      }
     }
    };draw();
   };
   modal.open();
  }));
 panel.createEl('h3',{text:writerUi('Largura do editor','Editor width')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Largura por nota: use editor-width: 75 no YAML (20–100%). O slider nunca reescreve suas notas; alterações em notas com YAML são temporárias.',
  'Per-note width: use editor-width: 75 in YAML (20–100%). The slider never rewrites notes; changes to YAML-controlled notes are session-only.')});
 toggle(cfg.width,'enabled','Ativar largura personalizada','Enable custom editor width');
 toggle(cfg.width,'showStatus','Mostrar slider na barra de status (PC)','Show status bar slider (desktop)');
 toggle(cfg.width,'frontmatter','Reconhecer editor-width das notas','Read per-note editor-width property');
 const slider=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en))
  .addSlider(s=>s.setLimits(20,100,1).setDynamicTooltip().setValue(cfg.width[key]).onChange(async v=>{
   cfg.width[key]=writerV1010Clamp(v);await plugin.saveSettings();plugin.writerV1010Refresh?.();
  }));
 slider('current','Largura atual (%)','Current width (%)');
 slider('defaultPercent','Largura padrão para restaurar (%)','Default reset width (%)');
}
