'use strict';
/* A compact Make-inspired Space switcher. Mobile uses the persistent native
 * drawer tab bar as the anchor; desktop keeps the explorer footer. */
function writerV1014MobileSpacesAnchor(plugin){
 const workspace=plugin.app?.workspace,drawer=workspace?.leftSplit;
 const ui=plugin.settings?.v1010Layout?.sidebar;
 if(require('obsidian').Platform?.isMobile!==true||
  !drawer?.containerEl||ui?.integrateSpaces===false||
  plugin.settings?.v9Spaces?.enabled!==true||plugin.settings?.v9Spaces?.dock===false||
  drawer.containerEl.classList?.contains('osm-sidebar')||
  drawer.containerEl.ownerDocument?.body?.classList?.contains('osm-mobile-tabs'))return null;
 // Spaces can use native tabs without replacing them or requiring private tab APIs.
 if(typeof writerV133DrawerTabsHost==='function'){
  const shared=writerV133DrawerTabsHost(workspace,'left');
  if(shared)return shared;
 }
 const root=drawer.containerEl;
 if(drawer.type!=='mobile-drawer'&&!root.classList?.contains('workspace-drawer')&&
  !root.querySelector?.('.workspace-drawer-tab-options'))return null;
 const candidates=[drawer.tabsContainerEl,root.querySelector?.('.workspace-drawer-tab-options'),
  drawer.tabsListEl?.parentElement];
 return candidates.find(node=>node&&node!==root&&root.contains?.(node)!==false&&node.isConnected!==false)||null;
}
function writerV9216SpaceDockRegister(plugin){
 let timer=null,mobileMenuOpen=false,mobileQuery='',mobileObserver=null,observedMobileRoot=null,unloaded=false,panelSerial=0;
 const cfg=plugin.settings.v9Spaces;
 const hosts=new Set(),actions=new Set(),documents=new Set();
 const mobileIntegrated=()=>Boolean(writerV1014MobileSpacesAnchor(plugin));
 const closeMobile=(restoreFocus=false)=>{
  if(!mobileMenuOpen)return;
  mobileMenuOpen=false;mobileQuery='';
  for(const host of hosts){
   const dock=host.querySelector(':scope > .writer-v1014-collapsible-spaces');
   if(!dock)continue;
   draw(dock);
   if(restoreFocus)dock.querySelector('.writer-v1014-spaces-toggle')?.focus?.({preventScroll:true});
  }
 };
 const onOutside=event=>{
  if(!mobileMenuOpen||event.target?.closest?.('.menu,.modal-container,.suggestion-container'))return;
  for(const host of hosts){
   const dock=host.querySelector(':scope > .writer-v1014-collapsible-spaces');
   if(dock?.contains?.(event.target))return;
  }
  closeMobile();
 };
 const onKey=event=>{
  if(event.key!=='Escape'||!mobileMenuOpen||event.target?.closest?.('.menu,.modal-container,.suggestion-container'))return;
  event.preventDefault();event.stopPropagation();closeMobile(true);
 };
 const bindDocument=doc=>{
  if(documents.has(doc))return;
  doc.addEventListener?.('pointerdown',onOutside,true);
  doc.addEventListener?.('keydown',onKey);
  documents.add(doc);
 };
 const searchText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
 const refreshAll=()=>{
  plugin.writerV91FlexRefresh?.();
  plugin.writerV9SpacesRefresh?.();
  plugin.writerV9216SpacesDockRefresh?.();
 };
 const persist=async()=>{
  await plugin.saveSettings();
  refreshAll();
 };
 const create=()=>{
  if(!writerModuleOn(plugin,'smartSpaces'))return;
  writerV9SpaceEditor(plugin,null,async space=>{
   if(cfg.spaces.some(old=>old.id===space.id))space.id+='-'+cfg.spaces.length;
   cfg.spaces.push(space);cfg.enabled=true;cfg.activeId=space.id;
   await persist();
  });
 };
 const edit=space=>writerV9SpaceEditor(plugin,space,async updated=>{
  const index=cfg.spaces.findIndex(item=>item.id===space.id);
  if(index<0)return;
  cfg.spaces[index]={...updated,id:space.id};
  await persist();
 });
 const icon=space=>writerV922OpenIconPicker(plugin,{
  title:writerUi('Ícone do Space','Space icon')+': '+space.name,
  value:space.icon||'layers',color:space.iconColor||'',defaultIcon:'layers',
  onApply:async(value,color)=>{
   space.icon=value||'layers';space.iconColor=color;
   await persist();
  }
 });
 const remove=space=>{
  const modal=new Modal(plugin.app);
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Remover Space','Remove Space')+': '+space.name);
   modal.contentEl.createEl('p',{text:writerUi('Somente a coleção e suas preferências serão removidas. Nenhum arquivo será excluído.','Only this collection and its preferences will be removed. No vault files will be deleted.')});
   new Setting(modal.contentEl)
    .addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
    .addButton(b=>b.setButtonText(writerUi('Remover','Remove')).setWarning().onClick(async()=>{
     cfg.spaces=cfg.spaces.filter(item=>item.id!==space.id);
     if(cfg.activeId===space.id)cfg.activeId='';
     modal.close();await persist();
    }));
  };
  modal.open();
 };
 const shift=async(space,direction)=>{
  const index=cfg.spaces.findIndex(item=>item.id===space.id),to=index+direction;
  if(index<0||to<0||to>=cfg.spaces.length)return;
  const copy=cfg.spaces.slice();copy.splice(index,1);copy.splice(to,0,space);
  cfg.spaces=copy;await persist();
 };
 const openManager=async()=>{
  if(!writerModuleOn(plugin,'smartSpaces')){
   new Notice(writerUi('Ative o módulo Spaces nas configurações do Basic.','Enable the Spaces module in Basic settings.'));
   return;
  }
  if(!cfg.enabled){cfg.enabled=true;await persist();}
  writerV9SpaceModal(plugin);
 };
 const chooseSpace=()=>{
  if(!writerModuleOn(plugin,'smartSpaces')||!cfg.enabled){
   new Notice(writerUi('Ative Spaces nas configurações do Basic.','Enable Spaces in Basic settings.'));return;
  }
  const {FuzzySuggestModal}=require('obsidian');
  class Picker extends FuzzySuggestModal{
   getItems(){return [{id:'',name:writerUi('Todo o cofre','Entire vault')},...cfg.spaces];}
   getItemText(space){return space.name;}
   onChooseItem(space){
    if(space.id&&!cfg.spaces.some(item=>item.id===space.id)){
     new Notice(writerUi('Este Space não está mais disponível.','This Space is no longer available.'));return;
    }
    closeMobile();
    return Promise.resolve(writerV9215SelectSpace(plugin,space.id)).catch(error=>{
     new Notice(writerUi('Não foi possível trocar Space: ','Unable to switch Space: ')+String(error.message||error).slice(0,160));
    });
   }
  }
  const picker=new Picker(plugin.app);
  picker.setPlaceholder(writerUi('Selecionar Space…','Choose Space…'));picker.open();
 };
 const menu=(event,space)=>{
  event.preventDefault();event.stopPropagation();
  if(!space)return;
  const menu=new (require('obsidian').Menu)();
  menu.addItem(item=>item.setTitle(writerUi('Usar Space','Use Space')).setIcon('check').onClick(()=>void writerV9215SelectSpace(plugin,space.id)));
  menu.addItem(item=>item.setTitle(writerUi('Renomear e configurar','Rename and configure')).setIcon('settings-2').onClick(()=>edit(space)));
  menu.addItem(item=>item.setTitle(writerUi('Escolher ícone e cor','Choose icon and color')).setIcon('palette').onClick(()=>icon(space)));
  menu.addItem(item=>item.setTitle(writerUi('Mover Space para esquerda','Move Space left')).setIcon('arrow-left').onClick(()=>void shift(space,-1)));
  menu.addItem(item=>item.setTitle(writerUi('Mover Space para direita','Move Space right')).setIcon('arrow-right').onClick(()=>void shift(space,1)));
  menu.addSeparator?.();
  menu.addItem(item=>item.setTitle(writerUi('Remover Space','Remove Space')).setIcon('trash-2').onClick(()=>remove(space)));
  menu.showAtMouseEvent(event);
 };
 const button=(parent,label,iconName,cls,fn)=>{
  const node=parent.ownerDocument.createElement('button');node.type='button';
  node.className=cls;node.title=label;node.setAttribute('aria-label',label);
  if(iconName)require('obsidian').setIcon(node,iconName);
  node.addEventListener('click',fn);parent.appendChild(node);return node;
 };
 const draw=(dock)=>{
  const active=writerV9215ActiveSpace(plugin);
  const mobile=dock.classList.contains('writer-v1014-collapsible-spaces');
  const signature=JSON.stringify({
   enabled:cfg.enabled,activeId:cfg.activeId,
   spaces:cfg.spaces.map(s=>[s.id,s.name,s.icon,s.iconColor,s.folder]),
   mobile,expanded:mobile&&mobileMenuOpen,locale:writerUi('pt','en')
  });
  if(dock.dataset.signature===signature)return;
  const doc=dock.ownerDocument;
  const focused=mobile&&doc.activeElement?.classList?.contains('writer-v133-spaces-search')&&dock.contains?.(doc.activeElement);
  const selection=focused?[doc.activeElement.selectionStart,doc.activeElement.selectionEnd]:null;
  dock.dataset.signature=signature;dock.replaceChildren();
  let content=dock,search=null;
  if(mobile){
   bindDocument(doc);
   const title=active?.name||writerUi('Todo o cofre','Entire vault');
   const toggle=button(dock,writerUi('Selecionar Space: ','Select Space: ')+title,
    active?.icon||'layers','writer-v1014-spaces-toggle',()=>{
     if(mobileMenuOpen){closeMobile();return;}
     mobileMenuOpen=true;dock.dataset.signature='';draw(dock);
    });
   if(active?.iconColor)toggle.style.setProperty('--writer-v9216-space-color',active.iconColor);
   toggle.setAttribute('aria-expanded',String(mobileMenuOpen));
   dock.dataset.optionsId||='writer-v133-spaces-options-'+(++panelSerial);
   toggle.setAttribute('aria-controls',dock.dataset.optionsId);
   const name=doc.createElement('span');name.className='writer-v1014-spaces-current';
   name.textContent=title;toggle.appendChild(name);
   const chevron=doc.createElement('span');chevron.className='writer-v1014-spaces-chevron';
   require('obsidian').setIcon(chevron,mobileMenuOpen?'chevron-down':'chevron-up');
   toggle.appendChild(chevron);
   const panel=doc.createElement('div');
   panel.className='writer-v1014-spaces-options';panel.id=dock.dataset.optionsId;
   panel.setAttribute('role','group');
   panel.setAttribute('aria-label',writerUi('Coleções Spaces','Spaces collections'));
   panel.hidden=!mobileMenuOpen;dock.classList.toggle('is-open',mobileMenuOpen);
   dock.appendChild(panel);content=panel;
   search=doc.createElement('input');search.type='search';search.className='writer-v133-spaces-search';
   search.placeholder=writerUi('Buscar Spaces…','Find Spaces…');
   search.setAttribute('aria-label',writerUi('Buscar Spaces','Find Spaces'));
   search.autocomplete='off';search.value=mobileQuery;panel.appendChild(search);
  }
  const selectSpace=id=>{
   if(mobile){
    closeMobile();
   }
   void Promise.resolve(writerV9215SelectSpace(plugin,id))
    .catch(error=>console.error('[Basic] Could not switch Space:',error))
    .finally(()=>plugin.writerV9216SpacesDockRefresh?.());
  };
  const rail=doc.createElement('div');
  rail.className='writer-v9216-spaces-rail';
  rail.setAttribute('role','group');
  rail.setAttribute('aria-label',writerUi('Selecionar Space','Choose Space'));
  content.appendChild(rail);
  const all=button(rail,writerUi('Todo o cofre','Entire vault'),
   'house','writer-v9216-space-all',()=>selectSpace(''));
  if(mobile){
   const label=doc.createElement('span');label.textContent=writerUi('Todo o cofre','Entire vault');
   all.appendChild(label);
  }
  all.classList.toggle('is-active',!active);
  all.setAttribute('aria-pressed',String(!active));
  if(cfg.enabled){
   for(const space of cfg.spaces){
    const item=doc.createElement('div');item.className='writer-v9216-space-group';
    if(mobile)item.dataset.spaceSearch=searchText(space.name+' '+(space.folder||''));
    item.classList.toggle('is-active',active?.id===space.id);rail.appendChild(item);
    const chip=button(item,space.name,space.icon||'layers','writer-v9216-space-chip',
     ()=>selectSpace(space.id));
    const name=doc.createElement('span');name.textContent=space.name;chip.appendChild(name);
    chip.setAttribute('aria-pressed',String(active?.id===space.id));
    // Android long-press should select text, not start the desktop drag gesture.
    chip.draggable=!mobile;
    if(!mobile){
     chip.addEventListener('dragstart',event=>{
      event.dataTransfer?.setData('text/x-writer-space',space.id);
      if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
     });
     chip.addEventListener('dragover',event=>{
      if(event.dataTransfer?.types?.includes('text/x-writer-space'))event.preventDefault();
     });
     chip.addEventListener('drop',event=>{
      const source=event.dataTransfer?.getData('text/x-writer-space');
      if(!source||source===space.id)return;
      event.preventDefault();event.stopPropagation();
      const from=cfg.spaces.findIndex(item=>item.id===source);
      const to=cfg.spaces.findIndex(item=>item.id===space.id);
      if(from<0||to<0)return;
      const ordered=cfg.spaces.slice(),moved=ordered.splice(from,1)[0];
      ordered.splice(to,0,moved);cfg.spaces=ordered;void persist();
     });
    }
    if(space.iconColor)chip.style.setProperty('--writer-v9216-space-color',space.iconColor);
    button(item,writerUi('Opções de ','Options for ')+space.name,'ellipsis',
     'writer-v9216-space-options',event=>menu(event,space));
   }
  }else{
   const message=doc.createElement('span');
   message.className='writer-v9216-space-inactive';
   message.textContent=writerUi('Spaces desativados','Spaces disabled');
   rail.appendChild(message);
  }
  if(mobile){
   const empty=doc.createElement('p');empty.className='writer-v133-spaces-empty';
   empty.textContent=writerUi('Nenhum Space encontrado.','No matching Spaces.');
   empty.setAttribute('role','status');empty.hidden=true;content.appendChild(empty);
   const filter=()=>{
    const query=searchText(mobileQuery),terms=query.split(/\s+/).filter(Boolean);
    let matches=0;
    for(const item of rail.children){
     if(!item.classList.contains('writer-v9216-space-group'))continue;
     item.hidden=!terms.every(term=>item.dataset.spaceSearch.includes(term));
     if(!item.hidden)matches++;
    }
    empty.hidden=!query||matches>0;
   };
   search.addEventListener('input',()=>{mobileQuery=search.value;filter();});filter();
   if(focused&&mobileMenuOpen){
    search.focus?.({preventScroll:true});
    try{if(selection&&selection.every(Number.isInteger))search.setSelectionRange?.(...selection);}catch(_){}
   }
  }
  const tools=doc.createElement('div');tools.className='writer-v9216-spaces-tools';
  content.appendChild(tools);
  const createButton=button(tools,writerUi('Criar Space','Create Space'),'plus',
   'writer-v9216-space-create',create);
  const manageButton=button(tools,writerUi('Gerenciar Spaces','Manage Spaces'),'settings-2',
   'writer-v9216-space-manage',()=>void openManager());
  if(mobile){
   const createText=doc.createElement('span');createText.textContent=writerUi('Criar','Create');
   createButton.appendChild(createText);
   const manageText=doc.createElement('span');manageText.textContent=writerUi('Gerenciar','Manage');
   manageButton.appendChild(manageText);
  }
 };
 const attachManageAction=()=>{
  const current=new Set();
  if(!writerModuleOn(plugin,'smartSpaces')||cfg.manageIcon===false||mobileIntegrated()){
   for(const bar of actions)bar.querySelector(':scope > .writer-v93-space-manage-action')?.remove();
   actions.clear();return;
  }
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;if(!host)continue;
   const bar=host.querySelector('.nav-action-buttons')||
     host.querySelector('.nav-buttons-container')||
     host.querySelector('.nav-header .nav-buttons-container')||
     host.querySelector('.nav-header');
   if(!bar)continue;
   current.add(bar);actions.add(bar);
   let control=bar.querySelector(':scope > .writer-v93-space-manage-action');
   if(!control){
    control=bar.ownerDocument.createElement('button');
    control.className='clickable-icon nav-action-button writer-v93-space-manage-action';
    control.type='button';
    control.setAttribute('aria-label',writerUi('Gerenciar Spaces','Manage Spaces'));
    control.title=writerUi('Gerenciar Spaces','Manage Spaces');
    const obs=require('obsidian');
     obs.setIcon(control,obs.getIcon?.('layers-3')?'layers-3':'layers');
    control.addEventListener('click',event=>{
     event.stopPropagation();event.preventDefault();void openManager();
    });
    bar.appendChild(control);
   }
  }
  for(const old of actions)if(!current.has(old)){
   old.querySelector(':scope > .writer-v93-space-manage-action')?.remove();actions.delete(old);
  }
 };
 const observeDrawer=()=>{
  if(require('obsidian').Platform?.isMobile!==true||typeof MutationObserver!=='function')return;
  const root=plugin.app.workspace.leftSplit?.containerEl;
  if(root===observedMobileRoot)return;
  mobileObserver?.disconnect();mobileObserver=null;observedMobileRoot=root||null;
  if(!root)return;
  mobileObserver=new MutationObserver(()=>{
   if(unloaded)return;
   const anchor=writerV1014MobileSpacesAnchor(plugin);
   if(anchor&&!anchor.querySelector?.(':scope > .writer-v1014-collapsible-spaces'))refresh();
   else if(!anchor&&[...hosts].some(host=>host.querySelector(':scope > .writer-v1014-collapsible-spaces')))refresh();
  });
  mobileObserver.observe(root,{childList:true,subtree:true});
 };
 const attach=()=>{
  observeDrawer();
  if(!mobileIntegrated()){mobileMenuOpen=false;mobileQuery='';}
  attachManageAction();
  if(!writerModuleOn(plugin,'smartSpaces')||cfg.dock===false){
   for(const parent of hosts){
    parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
    parent.classList.remove('writer-v9216-spaces-host','writer-v1011-mobile-spaces-host','writer-v1014-mobile-spaces-anchor');
   }
   hosts.clear();return;
  }
  const current=new Set();
  if(mobileIntegrated()){
   const mount=writerV1014MobileSpacesAnchor(plugin);
   current.add(mount);hosts.add(mount);
   mount.classList.add('writer-v1014-mobile-spaces-anchor');
   let dock=mount.querySelector(':scope > .writer-v9216-spaces-dock');
   if(!dock){
    dock=mount.ownerDocument.createElement('div');
    dock.className='writer-v9216-spaces-dock writer-v1011-integrated-spaces writer-v1014-collapsible-spaces';
    mount.appendChild(dock);
   }
   dock.classList.add('writer-v1011-integrated-spaces','writer-v1014-collapsible-spaces');
   draw(dock);
  }else{
   for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
    const host=leaf.view?.containerEl;
    if(!host)continue;
    const scroll=host.querySelector('.nav-files-container');
    const mount=scroll?.parentElement||host.querySelector('.view-content');
    if(!mount)continue;
    current.add(mount);hosts.add(mount);
    mount.classList.add('writer-v9216-spaces-host');
    let dock=mount.querySelector(':scope > .writer-v9216-spaces-dock');
    if(!dock){
     dock=mount.ownerDocument.createElement('div');
     dock.className='writer-v9216-spaces-dock';mount.appendChild(dock);
    }
    draw(dock);
   }
  }
  for(const parent of hosts){
   if(current.has(parent))continue;
   parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
   parent.classList.remove('writer-v9216-spaces-host','writer-v1011-mobile-spaces-host','writer-v1014-mobile-spaces-anchor');hosts.delete(parent);
  }
 };
 const refresh=()=>{if(unloaded)return;clearTimeout(timer);timer=setTimeout(attach,100);};
 plugin.writerV9216SpacesDockRefresh=refresh;
 plugin.writerV133SpacesChoose=chooseSpace;
 plugin.addCommand?.({id:'v133-spaces-switch',name:writerUi('Spaces: trocar coleção','Spaces: switch collection'),callback:chooseSpace});
 plugin.addCommand?.({id:'v93-spaces-manage',name:writerUi('Spaces: gerenciar pelo explorador','Spaces: manage from File Explorer'),callback:()=>void openManager()});
 // Spaces remain accessible through the explorer dock and command palette.
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',refresh));
 plugin.app.workspace.onLayoutReady?.(refresh);
 plugin.writerV1011SpacesDockRefresh=refresh;
 plugin.register?.(()=>{
  unloaded=true;mobileMenuOpen=false;mobileQuery='';
  clearTimeout(timer);mobileObserver?.disconnect();mobileObserver=null;observedMobileRoot=null;
  for(const doc of documents){
   doc.removeEventListener?.('pointerdown',onOutside,true);doc.removeEventListener?.('keydown',onKey);
  }
  documents.clear();
  for(const bar of actions)bar.querySelector(':scope > .writer-v93-space-manage-action')?.remove();
  actions.clear();for(const parent of hosts){
   parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
   parent.classList.remove('writer-v9216-spaces-host','writer-v1011-mobile-spaces-host','writer-v1014-mobile-spaces-anchor');
  }
  hosts.clear();plugin.writerV9216SpacesDockRefresh=null;plugin.writerV1011SpacesDockRefresh=null;plugin.writerV133SpacesChoose=null;
 });
}
