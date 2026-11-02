'use strict';
/* v9: Make.md-inspired file organization in the native Obsidian File Explorer.
 * Original implementation; no Make.md source code or replacement sidebar. */
const WRITER_V9_EXPLORER_ICONS=['file','file-text','folder','folder-open','book-open','book','notebook-pen','library','feather','pen-line','star','heart','bookmark','pin','house','briefcase','archive','box','layers','layout-grid','list','calendar','calendar-days','clock','list-check','check-circle','graduation-cap','lightbulb','brain','sparkles','wand-sparkles','image','images','music','video','film','globe','link','code','terminal','settings','user','users','message-circle','tag','hash','flag','map','compass','leaf','sun','moon-star','cloud','rocket','palette','flower-2'];
const WRITER_V9_EXPLORER_COLORS=['','#e35d6a','#dc9b30','#60a47c','#579ec2','#9b79c5','#d378aa'];
function writerV9ExplorerMerge(settings){
 const cfg=settings.v9Explorer={...{enabled:true,showIcons:true,showColor:true,items:{},maxResults:100},
  ...(settings.v9Explorer&&typeof settings.v9Explorer==='object'?settings.v9Explorer:{})};
 cfg.enabled=cfg.enabled!==false;cfg.showIcons=cfg.showIcons!==false;cfg.showColor=cfg.showColor!==false;
 cfg.maxResults=Math.max(20,Math.min(200,Number(cfg.maxResults)||100));
 cfg.items=cfg.items&&typeof cfg.items==='object'&&!Array.isArray(cfg.items)?cfg.items:{};
 const out={};
 for(const [path,raw] of Object.entries(cfg.items).slice(0,5000)){
  if(!path||path.length>600||!raw||typeof raw!=='object')continue;
  const icon=WRITER_V9_EXPLORER_ICONS.includes(raw.icon)?raw.icon:'';
  const color=WRITER_V9_EXPLORER_COLORS.includes(raw.color)?raw.color:'';
  if(icon||color)out[path]={icon,color};
 }
 cfg.items=out;
 return cfg;
}
function writerV9ExplorerPicker(plugin,file){
 const modal=new Modal(plugin.app),path=file.path;
 modal.onOpen=()=>{
  modal.setTitle(writerUi('Personalizar: ','Customize: ')+(file.name||'/'));
  const content=modal.contentEl;
  const item=plugin.settings.v9Explorer.items[path]||{};
  let icon=item.icon||'',color=item.color||'';
  new Setting(content).setName(writerUi('Ícone Lucide','Lucide icon'))
   .addDropdown(drop=>{
    drop.addOption('',writerUi('Padrão','Default'));
    for(const name of WRITER_V9_EXPLORER_ICONS)drop.addOption(name,name);
    drop.setValue(icon).onChange(value=>{icon=value;});
   });
  new Setting(content).setName(writerUi('Cor de destaque','Accent color'))
   .addDropdown(drop=>{
    drop.addOption('',writerUi('Padrão','Default'));
    for(const value of WRITER_V9_EXPLORER_COLORS.filter(Boolean))drop.addOption(value,value);
    drop.setValue(color).onChange(value=>{color=value;});
   });
  new Setting(content).addButton(button=>button.setButtonText(writerUi('Aplicar','Apply')).setCta().onClick(async()=>{
   if(icon||color)plugin.settings.v9Explorer.items[path]={icon,color};
   else delete plugin.settings.v9Explorer.items[path];
   await plugin.saveSettings();plugin.writerV9ExplorerRefresh?.();modal.close();
  })).addButton(button=>button.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
 };
 modal.open();
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
 const file=await plugin.app.vault.create(path,'# '+title+'\n\n'+String.fromCharCode(96).repeat(3)+'writer-folder-overview\nstyle: cards\nsubfolders: false\n'+String.fromCharCode(96).repeat(3)+'\n');
 await plugin.app.workspace.getLeaf('tab').openFile(file);
}
function writerV9RegisterExplorer(plugin){
 let observer=null,debounce=null;
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
     if(existing)existing.remove();
     node.classList.remove('writer-v9-explorer-accent');
     node.style.removeProperty('--writer-v9-explorer-accent');
     if(!enabled||!item)continue;
     if(plugin.settings.v9Explorer.showIcons&&item.icon){
      const symbol=node.ownerDocument.createElement('span');
      symbol.className='writer-v9-explorer-icon';
      symbol.setAttribute('aria-hidden','true');
      require('obsidian').setIcon(symbol,item.icon);
      node.insertBefore(symbol,node.firstChild);
     }
     if(plugin.settings.v9Explorer.showColor&&item.color){
      node.classList.add('writer-v9-explorer-accent');
      node.style.setProperty('--writer-v9-explorer-accent',item.color);
     }
    }
   }
  },120);
 };
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
 const start=()=>{
  const documentRoot=plugin.app.workspace.containerEl;
  if(typeof MutationObserver==='undefined'||!documentRoot)return;
  observer?.disconnect();
  observer=new MutationObserver(records=>{
   // Avoid observing the icon nodes we add ourselves (endless update loops).
   if(records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&
    !node.classList?.contains('writer-v9-explorer-icon')&&!node.closest?.('.writer-v9-explorer-icon'))))refresh();
  });
  observer.observe(documentRoot,{childList:true,subtree:true});
  refresh();
 };
 plugin.app.workspace.onLayoutReady?.(start);
 plugin.register(()=>{observer?.disconnect();clearTimeout(debounce);plugin.writerV9ExplorerRefresh=null;});
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
 for(const [key,pt,en] of [['enabled','Ativar extensões do explorador','Enable explorer extensions'],['showIcons','Exibir ícones personalizados','Show custom icons'],['showColor','Exibir cores personalizadas','Show custom colors']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{
   cfg[key]=value;await plugin.saveSettings();plugin.writerV9ExplorerRefresh?.();
  }));
 }
 new Setting(panel).setName(writerUi('Máximo de notas na visão de pasta','Maximum notes in folder view'))
  .addSlider(s=>s.setLimits(20,200,10).setValue(cfg.maxResults).setDynamicTooltip().onChange(async value=>{cfg.maxResults=value;await plugin.saveSettings();}));
}
