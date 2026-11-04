'use strict';
/* A compact, persistent Make-inspired Space switcher in Obsidian's native explorer.
 * It does not replace or fork the explorer. All note visibility stays local to settings. */
function writerV9216SpaceDockRegister(plugin){
 let timer=null;
 const cfg=plugin.settings.v9Spaces;
 const hosts=new Set(),actions=new Set();
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
  const signature=JSON.stringify({
   enabled:cfg.enabled,activeId:cfg.activeId,
   spaces:cfg.spaces.map(s=>[s.id,s.name,s.icon,s.iconColor]),
   locale:writerUi('pt','en')
  });
  if(dock.dataset.signature===signature)return;
  dock.dataset.signature=signature;dock.replaceChildren();
  const rail=dock.ownerDocument.createElement('div');
  rail.className='writer-v9216-spaces-rail';rail.setAttribute('role','group');
  rail.setAttribute('aria-label',writerUi('Selecionar Space','Choose Space'));
  dock.appendChild(rail);
  const all=button(rail,writerUi('Todo o cofre','Entire vault'),'house','writer-v9216-space-all',()=>void writerV9215SelectSpace(plugin,''));
  all.classList.toggle('is-active',!active);
  all.setAttribute('aria-pressed',String(!active));
  if(cfg.enabled){
   for(const space of cfg.spaces){
    const item=dock.ownerDocument.createElement('div');item.className='writer-v9216-space-group';
    item.classList.toggle('is-active',active?.id===space.id);
    rail.appendChild(item);
    const chip=button(item,space.name,space.icon||'layers','writer-v9216-space-chip',()=>void writerV9215SelectSpace(plugin,space.id));
    const name=chip.ownerDocument.createElement('span');name.textContent=space.name;chip.appendChild(name);
    chip.setAttribute('aria-pressed',String(active?.id===space.id));
    chip.draggable=true;
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
    if(space.iconColor)chip.style.setProperty('--writer-v9216-space-color',space.iconColor);
    button(item,writerUi('Opções de ','Options for ')+space.name,'ellipsis','writer-v9216-space-options',event=>menu(event,space));
   }
  }else{
   const message=rail.ownerDocument.createElement('span');
   message.className='writer-v9216-space-inactive';
   message.textContent=writerUi('Spaces desativados','Spaces disabled');
   rail.appendChild(message);
  }
  const tools=dock.ownerDocument.createElement('div');tools.className='writer-v9216-spaces-tools';
  dock.appendChild(tools);
  button(tools,writerUi('Criar Space','Create Space'),'plus','writer-v9216-space-create',create);
  button(tools,writerUi('Gerenciar Spaces','Manage Spaces'),'settings-2','writer-v9216-space-manage',()=>void openManager());
 };
 const attachManageAction=()=>{
  const current=new Set();
  if(cfg.manageIcon===false){
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
 const attach=()=>{
  attachManageAction();
  if(!writerModuleOn(plugin,'smartSpaces')||cfg.dock===false){
   for(const parent of hosts){
    parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
    parent.classList.remove('writer-v9216-spaces-host');
   }
   hosts.clear();return;
  }
  const current=new Set();
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
  for(const parent of hosts){
   if(current.has(parent))continue;
   parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
   parent.classList.remove('writer-v9216-spaces-host');hosts.delete(parent);
  }
 };
 const refresh=()=>{clearTimeout(timer);timer=setTimeout(attach,100);};
 plugin.writerV9216SpacesDockRefresh=refresh;
 plugin.addCommand?.({id:'v93-spaces-manage',name:writerUi('Spaces: gerenciar pelo explorador','Spaces: manage from File Explorer'),callback:()=>void openManager()});
 // Mobile exposes Spaces even when the explorer's bottom dock is off-screen.
 const mobileRibbon=plugin.addRibbonIcon?.('layers',writerUi('Abrir Spaces','Open Spaces'),()=>void openManager());
 mobileRibbon?.addClass?.('writer-v93-mobile-spaces-entry');
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 plugin.app.workspace.onLayoutReady?.(refresh);
 plugin.register?.(()=>{
  clearTimeout(timer);for(const bar of actions)bar.querySelector(':scope > .writer-v93-space-manage-action')?.remove();
  actions.clear();for(const parent of hosts){
   parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
   parent.classList.remove('writer-v9216-spaces-host');
  }
  hosts.clear();plugin.writerV9216SpacesDockRefresh=null;
 });
}
