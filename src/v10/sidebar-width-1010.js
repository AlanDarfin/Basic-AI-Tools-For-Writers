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
  sharedFilter:false,order:{left:[],right:[]},...sidebar});
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
function writerV1010SideForLeaf(workspace,leaf){
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
 const leaves=[],seen=new Set();
 const visit=leaf=>{
  const type=leaf?.view?.getViewType?.()||leaf?.getViewState?.()?.type;
  if(!type||type==='empty'||type==='markdown'||seen.has(type))return;
  if(writerV1010SideForLeaf(workspace,leaf)!==side)return;
  seen.add(type);leaves.push({type,leaf});
 };
 if(typeof workspace.iterateAllLeaves==='function')workspace.iterateAllLeaves(visit);
 else for(const type of Object.keys(WRITER_V1010_VIEWS)){
  for(const leaf of workspace.getLeavesOfType?.(type)||[])visit(leaf);
 }
 return leaves;
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
function writerV1010ActiveLeaf(workspace,leaves){
 return leaves.find(entry=>entry.leaf===workspace.activeLeaf)?.leaf||
  leaves.find(entry=>entry.leaf?.view?.containerEl?.closest?.('.mod-active'))?.leaf||leaves[0]?.leaf;
}
function writerV1010SidebarMenu(plugin,event,side,leaves,active){
 const menu=new Menu(plugin.app),current=active?.view?.containerEl;
 const actions=[...(current?.querySelectorAll?.('.view-actions .clickable-icon,.nav-header .nav-action-button')||[])];
 let count=0;
 for(const action of actions.slice(0,14)){
  const label=String(action.getAttribute('aria-label')||action.getAttribute('title')||'').trim();
  if(!label||action.closest('.writer-v1010-sidebar-toolbar'))continue;
  count++;
  menu.addItem(item=>item.setTitle(label).onClick(()=>action.click?.()));
 }
 if(count)menu.addSeparator?.();
 menu.addItem(item=>item.setTitle(writerUi('Configurações do Obsidian','Obsidian settings'))
  .setIcon('settings').onClick(()=>plugin.app.setting?.open?.()));
 const openVault=plugin.app.openVaultSwitcher;
 if(typeof openVault==='function')menu.addItem(item=>item.setTitle(writerUi('Trocar de cofre','Switch vault'))
  .setIcon('folder-open').onClick(()=>openVault.call(plugin.app)));
 if(leaves?.length)menu.addSeparator?.();
 for(const entry of leaves.slice(0,20)){
  const info=WRITER_V1010_VIEWS[entry.type]||['panels',entry.type,entry.type];
  menu.addItem(item=>item.setTitle(writerUi(info[1],info[2])).setIcon(info[0])
   .onClick(()=>void plugin.app.workspace.revealLeaf?.(entry.leaf)));
 }
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
 let queued=null,unloaded=false,status=null,range=null,value=null;
 const make=(tag,cls,doc)=>{const node=doc.createElement(tag);if(cls)node.className=cls;return node;};
 const renderSide=side=>{
  const split=side==='left'?workspace.leftSplit:workspace.rightSplit;
  const root=split?.containerEl,old=hosts.get(side);
  if(!showSidebar(side)||!root){
   if(old){old.remove();hosts.delete(side);}return;
  }
  const header=root.querySelector?.('.workspace-tab-header-container,.workspace-drawer-header');
  if(!header){if(old){old.remove();hosts.delete(side);}return;}
  const doc=header.ownerDocument,leaves=writerV1010SortLeaves(plugin,side,writerV1010CollectLeaves(workspace,side));
  if(!leaves.length){if(old){old.remove();hosts.delete(side);}return;}
  let bar=old;
  if(!bar||bar.parentElement!==header.parentElement){
   bar?.remove();bar=make('div','writer-v1010-sidebar-toolbar',doc);
   header.insertAdjacentElement?.('afterend',bar);
   hosts.set(side,bar);
  }
  bar.replaceChildren();
  const active=writerV1010ActiveLeaf(workspace,leaves);
  const max=cfg.sidebar.overflow!==false&&root.clientWidth&&root.clientWidth<330?3:6;
  const visible=leaves.slice(0,max),hidden=leaves.slice(max);
  const addIcon=(type,title,callback,isActive=false)=>{
   const btn=make('button','writer-v1010-sidebar-button'+(isActive?' is-active':''),doc);
   btn.type='button';btn.setAttribute('aria-label',title);btn.setAttribute('title',title);
   writerV1010Icon(btn,WRITER_V1010_VIEWS[type]?.[0]||'panel-left');
   btn.addEventListener('click',callback);bar.appendChild(btn);return btn;
  };
  for(const entry of visible){
   const info=WRITER_V1010_VIEWS[entry.type]||['panels',entry.type,entry.type];
   addIcon(entry.type,writerUi(info[1],info[2]),()=>void workspace.revealLeaf?.(entry.leaf),active===entry.leaf);
  }
  if(hidden.length){
   const overflow=addIcon('',writerUi('Mais painéis','More panels'),e=>{
    const menu=new Menu(plugin.app);
    for(const entry of hidden){
     const info=WRITER_V1010_VIEWS[entry.type]||['panels',entry.type,entry.type];
     menu.addItem(item=>item.setTitle(writerUi(info[1],info[2])).setIcon(info[0])
      .onClick(()=>void workspace.revealLeaf?.(entry.leaf)));
    }
    menu.showAtMouseEvent?.(e);
   });
   writerV1010Icon(overflow,'chevron-down');
  }
  if(cfg.sidebar.actionMenu!==false){
   const menu=addIcon('',writerUi('Ações do painel','Sidebar actions'),e=>writerV1010SidebarMenu(plugin,e,side,leaves,active));
   writerV1010Icon(menu,'ellipsis');
  }
  if(cfg.sidebar.fileFilter===true&&side==='left'){
   const box=make('input','writer-v1010-sidebar-filter',doc);
   box.type='search';box.placeholder=writerUi('Filtrar arquivos…','Filter files…');
   box.setAttribute('aria-label',box.placeholder);
   box.value=plugin._writerV1010Filter||'';
   box.addEventListener('input',()=>{plugin._writerV1010Filter=box.value;writerV1010FilterFiles(workspace,box.value);});
   bar.appendChild(box);
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
  for(const bar of hosts.values())bar.remove();
  hosts.clear();
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
  .addToggle(t=>t.setValue(target[key]===true).onChange(async v=>{target[key]=v;await plugin.saveSettings();plugin.writerV1010Refresh?.();}));
 for(const [key,pt,en] of [
  ['enabled','Ativar gerenciador de painéis','Enable sidebar manager'],
  ['mobileTabs','Abas em ícones no celular','Icon tabs on mobile'],
  ['desktopTabs','Abas extras no computador','Extra tabs on desktop'],
  ['overflow','Agrupar abas excedentes','Overflow for extra tabs'],
  ['actionMenu','Menu de ações do painel','Sidebar action menu'],
  ['fileFilter','Filtro local do explorador','Local Explorer filter']
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
