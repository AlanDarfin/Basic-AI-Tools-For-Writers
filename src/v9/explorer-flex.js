'use strict';
/* v9.1 Flexplorer-style organization atop the existing native explorer.
 * Own state; no private Obsidian patching, no duplicated file sidebar. */
const WRITER_V91_FLEX_SORTS=[
 ['native','Padrão do Obsidian','Obsidian default'],
 ['name','Nome A–Z','Name A–Z'],
 ['name-desc','Nome Z–A','Name Z–A'],
 ['modified','Modificação recente','Recently modified'],
 ['created','Criação recente','Recently created'],
 ['custom','Ordem personalizada','Custom order'],
 ['number','Número no título','Number in title'],
 ['property','Propriedade YAML','YAML property'],
 ['folders-first','Pastas primeiro','Folders first']
];
function writerV91FlexMerge(settings){
 const raw=settings.v91Flex&&typeof settings.v91Flex==='object'?settings.v91Flex:{};
 const cfg=settings.v91Flex={enabled:true,showHidden:false,dragReorder:true,mobileReorder:true,
  perSpaceSorting:true,perSpacePins:true,yamlSorting:false,defaultSortProperty:'sort_order',
  patterns:'',pinned:[],hidden:[],folders:{},...raw};
 cfg.enabled=cfg.enabled!==false;cfg.showHidden=cfg.showHidden===true;
 cfg.dragReorder=cfg.dragReorder!==false;
 for(const key of ['mobileReorder','perSpaceSorting','perSpacePins'])cfg[key]=cfg[key]!==false;
 cfg.yamlSorting=cfg.yamlSorting===true;
 cfg.defaultSortProperty=String(cfg.defaultSortProperty||'sort_order').replace(/[^\w-]/g,'').slice(0,60)||'sort_order';
 cfg.patterns=String(cfg.patterns||'').slice(0,3000);
 for(const field of ['pinned','hidden'])
  cfg[field]=Array.isArray(cfg[field])?[...new Set(cfg[field].filter(s=>typeof s==='string'&&s.length<600))].slice(0,3000):[];
 cfg.folders=cfg.folders&&typeof cfg.folders==='object'&&!Array.isArray(cfg.folders)?cfg.folders:{};
 const output={};
 for(const [path,folder] of Object.entries(cfg.folders).slice(0,3000)){
  if(typeof path!=='string'||path.length>600||!folder||typeof folder!=='object')continue;
  const sort=WRITER_V91_FLEX_SORTS.some(row=>row[0]===folder.sort)?folder.sort:'native';
  const order=Array.isArray(folder.order)?[...new Set(folder.order.filter(v=>typeof v==='string'&&v.length<300))].slice(0,3000):[];
  output[path]={sort,order,property:String(folder.property||'').replace(/[^\w-]/g,'').slice(0,60)};
 }
 cfg.folders=output;
 return cfg;
}
function writerV91FlexGlob(glob){
 let s=String(glob||'').trim(),source='';
 if(!s||s.length>250)return null;
 const anchor=s.startsWith('/');if(anchor)s=s.slice(1);
 const slash=s.includes('/');
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='*'){
   if(s[i+1]==='*'){
    i++;
    if(s[i+1]==='/'){source+='(?:[^/]+/)*';i++;}
    else source+='.*';
   }else source+='[^/]*';
  }else if(ch==='?')source+='[^/]';
  else source+='\\^$.|+()[]{}'.includes(ch)?'\\'+ch:ch;
 }
 try{return new RegExp('^'+(!anchor&&!slash?'(?:[^/]*/)*':'')+source+'$','i');}catch(_){return null;}
}
function writerV91FlexPatterns(cfg){
 return cfg.patterns.split(/\r?\n/).map(writerV91FlexGlob).filter(Boolean).slice(0,40);
}
function writerV91FlexIsHidden(cfg,path,patterns,plugin){
 return cfg.hidden.includes(path)||patterns.some(re=>re.test(path))||
  Boolean(plugin&&writerV9215SpaceHidden(plugin,path));
}
function writerV91FlexNodePath(node){
 return node.querySelector('.nav-file-title[data-path], .nav-folder-title[data-path]')?.getAttribute('data-path')||
  node.getAttribute('data-path')||node.querySelector('.nav-file-title, .nav-folder-title')?.getAttribute('data-path')||'';
}
function writerV93FlexRecord(plugin,dir){
 const cfg=plugin.settings.v91Flex;
 const space=cfg.perSpaceSorting&&typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
 if(space?.folderSorts?.[dir])return space.folderSorts[dir];
 if(cfg.folders[dir])return cfg.folders[dir];
 if(!cfg.yamlSorting)return {sort:'native',order:[],property:''};
 const folder=plugin.app.vault.getAbstractFileByPath(dir);
 const note=folder&&typeof writerV92FolderNote==='function'?writerV92FolderNote(plugin.app,folder):null;
 const fm=note&&plugin.app.metadataCache?.getFileCache?.(note)?.frontmatter||{};
 const sort=WRITER_V91_FLEX_SORTS.some(row=>row[0]===fm.basic_sort)?fm.basic_sort:'native';
 return {sort,order:Array.isArray(fm.basic_sort_order)?fm.basic_sort_order.slice(0,1000):[],
  property:String(fm.basic_sort_field||'').replace(/[^\w-]/g,'').slice(0,60)};
}
function writerV93FlexPinned(plugin,path){
 const cfg=plugin.settings.v91Flex;
 const space=cfg.perSpacePins&&typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
 return space?Boolean(space.pinnedPaths?.includes(path)):cfg.pinned.includes(path);
}
function writerV93FlexOrderIndex(name,order){
 const index=order.findIndex(p=>p===name||(/[?*]/.test(p)&&writerV91FlexGlob(p)?.test(name)));
 return index<0?Number.MAX_SAFE_INTEGER:index;
}
function writerV93FlexNumber(name){
 const match=/\d+(?:[.,]\d+)*/.exec(String(name||''));
 return match?Number(match[0].replace(',','.')):Number.POSITIVE_INFINITY;
}
function writerV93FlexMeta(plugin,row,key){
 const file=row.file?.extension==='md'?row.file:
  (typeof writerV92FolderNote==='function'?writerV92FolderNote(plugin.app,row.file):null);
 return file?plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter?.[key]??'':'';
}
function writerV93FlexCompare(plugin,a,b,record,collator){
 if(a.pinned!==b.pinned)return a.pinned?-1:1;
 const mode=record.sort;
 if(mode==='native')return a.index-b.index;
 if(mode==='custom'){
  const ia=writerV93FlexOrderIndex(a.name,record.order||[]),ib=writerV93FlexOrderIndex(b.name,record.order||[]);
  return ia!==ib?ia-ib:a.index-b.index;
 }
 if(mode==='number'){
  const na=writerV93FlexNumber(a.name),nb=writerV93FlexNumber(b.name);
  if(na!==nb)return na-nb;
 }
 if(mode==='folders-first'){
  const af=a.file?.children!==undefined,bf=b.file?.children!==undefined;
  if(af!==bf)return af?-1:1;
 }
 if(mode==='property'){
  const key=record.property||plugin.settings.v91Flex.defaultSortProperty;
  const av=writerV93FlexMeta(plugin,a,key),bv=writerV93FlexMeta(plugin,b,key);
  if(av!==''&&bv!==''&&Number.isFinite(Number(av))&&Number.isFinite(Number(bv))&&Number(av)!==Number(bv))
   return Number(av)-Number(bv);
  const delta=collator.compare(String(av),String(bv));if(delta)return delta;
 }
 if(mode==='modified'||mode==='created'){
  const prop=mode==='modified'?'mtime':'ctime';
  const delta=(b.file?.stat?.[prop]||0)-(a.file?.stat?.[prop]||0);if(delta)return delta;
 }
 const delta=collator.compare(a.name,b.name);
 return mode==='name-desc'?-delta:delta;
}

function writerV91FlexSortGroup(plugin,container,patterns){
 const cfg=plugin.settings.v91Flex,children=Array.from(container.children).filter(node=>
  node.classList?.contains('nav-file')||node.classList?.contains('nav-folder'));
 if(!children.length)return;
 const dir=container.closest('.nav-folder')?.querySelector(':scope > .nav-folder-title[data-path]')?.getAttribute('data-path')||'';
 const folder=writerV93FlexRecord(plugin,dir);
 const rows=children.map((node,index)=>{
  const path=writerV91FlexNodePath(node);
  const file=plugin.app.vault.getAbstractFileByPath(path);
  const title=node.querySelector('.nav-file-title, .nav-folder-title');
  const isHidden=path&&writerV91FlexIsHidden(cfg,path,patterns,plugin);
  node.classList.toggle('writer-v91-flex-hidden',Boolean(cfg.enabled&&isHidden&&!cfg.showHidden));
  node.classList.toggle('writer-v91-flex-revealed',Boolean(cfg.enabled&&isHidden&&cfg.showHidden));
  node.classList.toggle('writer-v91-flex-pinned',Boolean(cfg.enabled&&writerV93FlexPinned(plugin,path)));
  if(title){
   const prior=title.querySelector(':scope > .writer-v91-flex-indicator');
   const wanted=cfg.enabled&&writerV93FlexPinned(plugin,path);
   if(prior&&!wanted)prior.remove();
   if(wanted&&!prior){
    const icon=title.ownerDocument.createElement('span');icon.className='writer-v91-flex-indicator';
    icon.setAttribute('aria-hidden','true');require('obsidian').setIcon(icon,'pin');title.appendChild(icon);
   }
  }
  return {node,path,file,title,index,name:file?.name||path.split('/').pop()||'',pinned:writerV93FlexPinned(plugin,path)};
 });
 if(!cfg.enabled||(folder.sort==='native'&&!rows.some(row=>row.pinned)))return;
 const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 rows.sort((a,b)=>writerV93FlexCompare(plugin,a,b,folder,collator));
 // Change the DOM only when necessary. Repeated sorting must be idempotent
 // to avoid a MutationObserver feedback loop or jumps in editor scroll.
 const actual=Array.from(container.children).filter(node=>rows.some(r=>r.node===node));
 if(rows.some((row,index)=>actual[index]!==row.node)){
  for(const row of rows)container.appendChild(row.node);
 }
 if(folder.sort==='custom'&&cfg.dragReorder){
  for(const row of rows){
   const title=row.title;if(!title)continue;
   title.draggable=true;
   title.dataset.writerFlexPath=row.path;
  }
 }
}
function writerV91FlexFolderPath(file){
 return file?.parent?.path||'';
}
function writerV93FlexStore(plugin,dir){
 const cfg=plugin.settings.v91Flex,space=cfg.perSpaceSorting?writerV9215ActiveSpace(plugin):null;
 if(space){space.folderSorts=space.folderSorts||{};return space.folderSorts;}
 return cfg.folders;
}
function writerV91FlexReorder(plugin,path,target,direction){
 const cfg=plugin.settings.v91Flex;
 const file=plugin.app.vault.getAbstractFileByPath(path);
 const other=plugin.app.vault.getAbstractFileByPath(target);
 if(!file||!other||file.parent?.path!==other.parent?.path||path===target)return;
 const dir=writerV91FlexFolderPath(file),parent=file.parent;
 const store=writerV93FlexStore(plugin,dir);
 const record=store[dir]||{sort:'custom',order:[]};
 const original=(parent?.children||[]).map(f=>f.name);
 const order=[...new Set([...record.order.filter(n=>original.includes(n)),...original])];
 const from=order.indexOf(file.name),to=order.indexOf(other.name);
 if(from<0||to<0)return;
 order.splice(from,1);
 const targetIndex=order.indexOf(other.name);
 order.splice(targetIndex+(direction==='after'?1:0),0,file.name);
 store[dir]={...record,sort:'custom',order};
 void plugin.saveSettings();plugin.writerV91FlexRefresh?.();
}
function writerV91FlexSetSort(plugin,folder,sort){
 const key=folder?.path||'',store=writerV93FlexStore(plugin,key);
 const record={...(store[key]||writerV93FlexRecord(plugin,key))};
 record.sort=sort;
 if(sort==='custom'&&!record.order.length)
  record.order=(folder?.children||[]).map(f=>f.name);
 store[key]=record;void plugin.saveSettings();plugin.writerV91FlexRefresh?.();
}
function writerV93FlexSortModal(plugin,folder){
 const cfg=plugin.settings.v91Flex,key=folder?.path||'';
 const store=writerV93FlexStore(plugin,key),existing=writerV93FlexRecord(plugin,key);
 const model={sort:existing.sort||'native',property:existing.property||cfg.defaultSortProperty,
  order:[...(existing.order||[])]};
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  modal.setTitle(writerUi('Ordenação: ','Sorting: ')+(folder?.name||writerUi('Cofre','Vault')));
  const root=modal.contentEl;
  new Setting(root).setName(writerUi('Modo de ordenação','Sorting mode')).addDropdown(drop=>{
   for(const [id,pt,en] of WRITER_V91_FLEX_SORTS)drop.addOption(id,writerUi(pt,en));
   drop.setValue(model.sort).onChange(v=>{model.sort=v;});
  });
  new Setting(root).setName(writerUi('Propriedade YAML para ordenar','YAML property to sort'))
   .addText(text=>text.setValue(model.property).onChange(value=>{model.property=value.replace(/[^\w-]/g,'').slice(0,60);}));
  new Setting(root).setName(writerUi('Ordem manual e padrões','Manual order and patterns'))
   .setDesc(writerUi('Um nome por linha; aceita * e ?. Os demais itens ficam no fim.','One name per line; accepts * and ?. Unlisted items stay last.'))
   .addTextArea(text=>text.setValue(model.order.join('\n')).onChange(value=>{
    model.order=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,1000);
   }));
  new Setting(root).addButton(button=>button.setButtonText(writerUi('Aplicar','Apply')).setCta().onClick(async()=>{
   if(model.sort==='custom'&&!model.order.length)
    model.order=(folder?.children||plugin.app.vault.getRoot?.()?.children||[]).map(x=>x.name);
   store[key]={sort:model.sort,property:model.property,order:model.order};
   await plugin.saveSettings();plugin.writerV91FlexRefresh?.();modal.close();
  })).addButton(button=>button.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
 };
 modal.open();
}

function writerV91FlexRegister(plugin){
 const cfg=plugin.settings.v91Flex;
 let timer=null,observer=null,lastDrag='';
 const active=()=>cfg.enabled&&writerModuleOn(plugin,'nativeExplorer');
 const scan=()=>{
  const patterns=writerV91FlexPatterns(cfg);
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;if(!host)continue;
   for(const group of host.querySelectorAll('.nav-files-container, .nav-folder-children'))writerV91FlexSortGroup(plugin,group,patterns);
  }
 };
 const refresh=()=>{clearTimeout(timer);timer=setTimeout(scan,140);};
 plugin.writerV91FlexRefresh=refresh;
 const menu=(menu,file)=>{
  if(!active()||!(file instanceof TFile||file instanceof TFolder))return;
  const path=file.path;
  menu.addSeparator?.();
  const scopedPins=cfg.perSpacePins?writerV9215ActiveSpace(plugin):null;
  const pins=scopedPins?scopedPins.pinnedPaths:cfg.pinned;
  menu.addItem(item=>item.setTitle(pins.includes(path)?
   writerUi(scopedPins?'Desafixar neste Space':'Desafixar no explorador',scopedPins?'Unpin in this Space':'Unpin in explorer'):
   writerUi(scopedPins?'Fixar neste Space':'Fixar no explorador',scopedPins?'Pin in this Space':'Pin in explorer'))
   .setIcon('pin').onClick(async()=>{
    const next=pins.includes(path)?pins.filter(p=>p!==path):[...pins,path];
    if(scopedPins)scopedPins.pinnedPaths=next;else cfg.pinned=next;
    await plugin.saveSettings();refresh();plugin.writerV9SpacesRefresh?.();
   }));
  const space=writerV9215ActiveSpace(plugin);
  const hidden=space?space.hiddenPaths:cfg.hidden;
  menu.addItem(item=>item.setTitle(hidden.includes(path)?
   writerUi(space?'Reexibir neste Space':'Reexibir no explorador',space?'Unhide in this Space':'Unhide in explorer'):
   writerUi(space?'Ocultar neste Space':'Ocultar no explorador',space?'Hide in this Space':'Hide in explorer'))
   .setIcon('eye-off').onClick(async()=>{
    const next=hidden.includes(path)?hidden.filter(p=>p!==path):[...hidden,path];
    if(space)space.hiddenPaths=next;else cfg.hidden=next;
    await plugin.saveSettings();refresh();plugin.writerV9SpacesRefresh?.();
   }));
  if(file instanceof TFolder){
   menu.addItem(item=>item.setTitle(writerUi('Ordenação desta pasta','Sort this folder')).setIcon('list-ordered')
    .onClick(()=>writerV93FlexSortModal(plugin,file)));
  }
  const dir=writerV91FlexFolderPath(file);
  if(writerV93FlexRecord(plugin,dir)?.sort==='custom'&&file.parent){
   for(const [direction,pt,en] of [['before','Mover para cima','Move earlier'],['after','Mover para baixo','Move later']]){
    menu.addItem(item=>item.setTitle(writerUi(pt,en)).setIcon(direction==='before'?'arrow-up':'arrow-down').onClick(()=>{
     const list=writerV93FlexRecord(plugin,dir).order;
     const name=file.name,index=list.indexOf(name),other=list[index+(direction==='before'?-1:1)];
     if(!other)return;
     const target=file.parent.children?.find(f=>f.name===other);
     if(target)writerV91FlexReorder(plugin,file.path,target.path,direction);
    }));
   }
  }
 };
 plugin.registerEvent(plugin.app.workspace.on('file-menu',menu));
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 plugin.registerEvent(plugin.app.vault.on('create',refresh));
 plugin.registerEvent(plugin.app.vault.on('delete',file=>{
  const old=file.path;cfg.pinned=cfg.pinned.filter(path=>path!==old&&!path.startsWith(old+'/'));
  cfg.hidden=cfg.hidden.filter(path=>path!==old&&!path.startsWith(old+'/'));
  for(const space of plugin.settings.v9Spaces?.spaces||[])space.hiddenPaths=space.hiddenPaths.filter(path=>path!==old&&!path.startsWith(old+'/'));
  for(const key of Object.keys(cfg.folders))if(key===old||key.startsWith(old+'/'))delete cfg.folders[key];
  void plugin.saveSettings();refresh();
 }));
 plugin.registerEvent(plugin.app.vault.on('rename',(file,old)=>{
  const swap=p=>p===old||p.startsWith(old+'/')?file.path+p.slice(old.length):p;
  cfg.pinned=cfg.pinned.map(swap);cfg.hidden=cfg.hidden.map(swap);
  for(const space of plugin.settings.v9Spaces?.spaces||[])space.hiddenPaths=space.hiddenPaths.map(swap);
  cfg.folders=Object.fromEntries(Object.entries(cfg.folders).map(([key,v])=>[swap(key),v]));
  if(file.parent&&file.parent.path===old.split('/').slice(0,-1).join('/')){
   const record=cfg.folders[file.parent.path];
   if(record)record.order=record.order.map(name=>name===old.split('/').pop()?file.name:name);
  }
  void plugin.saveSettings();refresh();
 }));
 plugin.registerEvent(plugin.app.vault.on('modify',refresh));
 // Keep native drag-and-drop untouched except for Alt+drag between items
 // in a folder explicitly configured for custom sorting.
 const container=plugin.app.workspace.containerEl;
 const start=event=>{
  if(!active()||!cfg.dragReorder||!event.altKey)return;
  const node=event.target?.closest?.('.nav-file, .nav-folder');
  const path=node&&writerV91FlexNodePath(node);
  const file=plugin.app.vault.getAbstractFileByPath(path||'');
  if(!file||writerV93FlexRecord(plugin,writerV91FlexFolderPath(file))?.sort!=='custom')return;
  lastDrag=path;event.dataTransfer?.setData('text/x-writer-flexplorer',path);
  if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
  event.stopPropagation();
 };
 const over=event=>{
  if(!lastDrag)return;
  const node=event.target?.closest?.('.nav-file, .nav-folder');
  const target=node&&writerV91FlexNodePath(node);
  const a=plugin.app.vault.getAbstractFileByPath(lastDrag),b=plugin.app.vault.getAbstractFileByPath(target||'');
  if(a&&b&&a.parent?.path===b.parent?.path){event.preventDefault();event.stopPropagation();}
 };
 const drop=event=>{
  if(!lastDrag)return;
  const node=event.target?.closest?.('.nav-file, .nav-folder');
  const target=node&&writerV91FlexNodePath(node),source=lastDrag;lastDrag='';
  if(!target||target===source)return;
  event.preventDefault();event.stopPropagation();writerV91FlexReorder(plugin,source,target,'before');
 };
 const end=()=>{lastDrag='';};
 plugin.registerDomEvent?.(container,'dragstart',start,true);
 plugin.registerDomEvent?.(container,'dragover',over,true);
 plugin.registerDomEvent?.(container,'drop',drop,true);
 plugin.registerDomEvent?.(container,'dragend',end,true);
 const attach=()=>{
  observer?.disconnect();if(typeof MutationObserver==='undefined'){refresh();return;}
  observer=new MutationObserver(records=>{
   if(records.some(record=>record.addedNodes.length||record.removedNodes.length))refresh();
  });
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   if(leaf.view?.containerEl)observer.observe(leaf.view.containerEl,{childList:true,subtree:true});
  }
  refresh();
 };
 plugin.app.workspace.onLayoutReady?.(attach);
 plugin.registerEvent(plugin.app.workspace.on('layout-change',attach));
 plugin.addCommand({id:'v91-flex-show-hidden',name:writerUi('Explorador: mostrar ou ocultar arquivos escondidos','Explorer: toggle hidden files'),callback:async()=>{
  cfg.showHidden=!cfg.showHidden;await plugin.saveSettings();refresh();
 }});
 plugin.register?.(()=>{clearTimeout(timer);observer?.disconnect();plugin.writerV91FlexRefresh=null;});
}
function writerV91FlexSettings(plugin,panel){
 const cfg=plugin.settings.v91Flex;
 panel.createEl('h3',{text:'Flexplorer'});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Organize o explorador nativo por pasta, fixe itens, oculte arquivos e escolha uma ordem manual. Clique com o botão direito ou pressione e segure para ver as opções. Alt + arrastar reordena itens da mesma pasta em modo personalizado.',
  'Sort native Explorer folders individually, pin files, hide items and set custom order. Right-click or long-press for file actions. Alt + drag reorders items within custom-sorted folders.'
 )});
 for(const [key,pt,en] of [
  ['enabled','Ativar organização avançada','Enable enhanced organization'],
  ['showHidden','Exibir itens ocultos','Show hidden items'],
  ['dragReorder','Permitir Alt + arrastar para ordenar','Allow Alt + drag to reorder']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{
   cfg[key]=v;await plugin.saveSettings();plugin.writerV91FlexRefresh?.();
  }));
 }
 new Setting(panel).setName(writerUi('Padrões de ocultação','Hide patterns'))
  .setDesc(writerUi('Um padrão por linha; suporta * e **. Apenas oculta na interface, não exclui arquivos.','One glob per line; supports * and **. Only hides in Explorer, never deletes files.'))
  .addTextArea(t=>{t.inputEl.rows=4;t.setPlaceholder('Templates/**\n*.bak').setValue(cfg.patterns)
   .onChange(async value=>{cfg.patterns=value.slice(0,3000);await plugin.saveSettings();plugin.writerV91FlexRefresh?.();});});
}
