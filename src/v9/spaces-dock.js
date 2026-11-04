'use strict';
/* A compact, persistent Make-inspired Space switcher in Obsidian's native explorer.
 * It does not replace or fork the explorer. All note visibility stays local to settings. */
function writerV9216SpaceDockRegister(plugin){
 let timer=null;
 const cfg=plugin.settings.v9Spaces;
 const hosts=new Set();
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
 const menu=(event,space)=>{
  event.preventDefault();event.stopPropagation();
  if(!space)return;
  const menu=new (require('obsidian').Menu)();
  menu.addItem(item=>item.setTitle(writerUi('Usar Space','Use Space')).setIcon('check').onClick(()=>void writerV9215SelectSpace(plugin,space.id)));
  menu.addItem(item=>item.setTitle(writerUi('Renomear e configurar','Rename and configure')).setIcon('settings-2').onClick(()=>edit(space)));
  menu.addItem(item=>item.setTitle(writerUi('Escolher ícone e cor','Choose icon and color')).setIcon('palette').onClick(()=>icon(space)));
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
  button(tools,writerUi('Gerenciar Spaces','Manage Spaces'),'settings-2','writer-v9216-space-manage',()=>{
   if(!cfg.enabled){cfg.enabled=true;void persist();}
   writerV9SpaceModal(plugin);
  });
 };
 const attach=()=>{
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
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 plugin.app.workspace.onLayoutReady?.(refresh);
 plugin.register?.(()=>{
  clearTimeout(timer);for(const parent of hosts){
   parent.querySelector(':scope > .writer-v9216-spaces-dock')?.remove();
   parent.classList.remove('writer-v9216-spaces-host');
  }
  hosts.clear();plugin.writerV9216SpacesDockRefresh=null;
 });
}
