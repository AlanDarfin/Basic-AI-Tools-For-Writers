'use strict';
/* v9 smart spaces: original local-first implementation of Make-inspired
 * saved filtered collections. Does not create a new pane or copy Make.md code. */
const WRITER_V9_SPACE_VIEWS=['cards','list','table','board'];
const WRITER_V9_SPACE_SORTS=['name','recent','oldest','manual'];
const WRITER_V9_SPACE_MAX=5000; // Paginated results; search no longer silently omits notes after 200.
const WRITER_V9_SPACE_VIEW='writer-smart-spaces';
function writerV9SpacesMerge(settings){
 const raw=settings.v9Spaces&&typeof settings.v9Spaces==='object'&&!Array.isArray(settings.v9Spaces)?settings.v9Spaces:{};
 const cfg=settings.v9Spaces={enabled:false,dock:true,manageIcon:true,sidebar:true,autoSaveLayouts:false,restoreLayoutsOnSwitch:false,activeId:'',spaces:[],...raw};
 cfg.enabled=cfg.enabled===true;
 cfg.dock=cfg.dock!==false;
 cfg.manageIcon=cfg.manageIcon!==false;cfg.sidebar=cfg.sidebar!==false;
 cfg.spaces=Array.isArray(cfg.spaces)?cfg.spaces.map(writerV9SpaceSanitize).filter(Boolean).slice(0,40):[];
 const seen=new Set();
 cfg.spaces=cfg.spaces.filter(space=>{if(seen.has(space.id))return false;seen.add(space.id);return true;});
 cfg.activeId=cfg.spaces.some(space=>space.id===cfg.activeId)?cfg.activeId:'';
 return cfg;
}
function writerV9SpaceSanitize(raw){
 if(!raw||typeof raw!=='object')return null;
 const name=String(raw.name||'').replace(/[\r\n]/g,' ').trim().slice(0,70);
 if(!name)return null;
 const id=String(raw.id||'').replace(/[^a-z0-9_-]/gi,'').slice(0,72)||('space-'+name.toLowerCase().replace(/[^a-z0-9]/g,'-'));
 const folder=String(raw.folder||'').replace(/^\/+|\/+$/g,'').slice(0,400);
 const tag=String(raw.tag||'').replace(/^#/,'').trim().slice(0,80);
 const property=String(raw.property||'').trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
 const value=String(raw.value||'').trim().slice(0,160);
 const groupBy=String(raw.groupBy||'status').trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'status';
 const view=WRITER_V9_SPACE_VIEWS.includes(raw.view)?raw.view:'cards';
 const sort=WRITER_V9_SPACE_SORTS.includes(raw.sort)?raw.sort:'recent';
 const mode=['filter','curated','folder'].includes(raw.mode)?raw.mode:'filter';
 const includePaths=Array.isArray(raw.includePaths)?[...new Set(raw.includePaths.map(p=>String(p||'').trim().slice(0,500)).filter(Boolean))].slice(0,150):[];
 const hiddenPaths=Array.isArray(raw.hiddenPaths)?[...new Set(raw.hiddenPaths.map(p=>String(p||'').trim().slice(0,500)).filter(Boolean))].slice(0,300):[];
 const pinnedPaths=Array.isArray(raw.pinnedPaths)?[...new Set(raw.pinnedPaths.filter(x=>typeof x==='string'&&x.length<500))].slice(0,300):[];
 const sourceSort=raw.folderSorts&&typeof raw.folderSorts==='object'&&!Array.isArray(raw.folderSorts)?raw.folderSorts:{};
 const folderSorts={};
 for(const [path,record] of Object.entries(sourceSort).slice(0,250)){
  if(typeof path!=='string'||path.length>500||!record||typeof record!=='object')continue;
  const sort=typeof record.sort==='string'?record.sort:'native';
  const order=Array.isArray(record.order)?[...new Set(record.order.filter(n=>typeof n==='string'&&n.length<300))].slice(0,1000):[];
  folderSorts[path]={sort,order,property:String(record.property||'').slice(0,60),foldersFirst:record.foldersFirst===true};
 }
 const widgetKeys=['continue','calendar','soundscape','recent','favorites','quick','stats','activity','random','tags','goal','gallery','quotes','today','books','webBookmarks'];
 const homeWidgetsEnabled=raw.homeWidgetsEnabled===true;
 const homeOrder=Array.isArray(raw.homeOrder)?[...new Set(raw.homeOrder.filter(key=>widgetKeys.includes(key)))]:[];
 const homeHidden=Array.isArray(raw.homeHidden)?[...new Set(raw.homeHidden.filter(key=>widgetKeys.includes(key)))]:[];
 const homeWidgetSizes=Object.fromEntries(Object.entries(raw.homeWidgetSizes&&typeof raw.homeWidgetSizes==='object'?raw.homeWidgetSizes:{})
  .filter(([key,value])=>widgetKeys.includes(key)&&['compact','normal','wide'].includes(value)));
 // Keep the Spaces sanitizer self-contained: tests and standalone consumers
 // evaluate this module without loading the homepage module first.
 const homeWidgetFrames={};
 const rawFrames=raw.homeWidgetFrames;
 if(rawFrames&&typeof rawFrames==='object'&&!Array.isArray(rawFrames)){
  for(const [key,frame] of Object.entries(rawFrames).slice(0,80)){
   if(!widgetKeys.includes(key)||!frame||typeof frame!=='object'||Array.isArray(frame))continue;
   const columns=Number(frame.columns),height=Number(frame.height),width=Number(frame.width);
   homeWidgetFrames[key]={
    columns:Math.max(3,Math.min(12,Number.isFinite(columns)?Math.round(columns):6)),
    height:Number.isFinite(height)?Math.max(92,Math.min(1100,Math.round(height))):0,
    width:Number.isFinite(width)?Math.max(160,Math.min(1800,Math.round(width))):0
   };
  }
 }
 const homeWidgetAlignment=raw.homeWidgetAlignment==='free'?'free':'grid';
 const icon=/^[a-z][a-z0-9-]{0,60}$/.test(raw.icon||'')?raw.icon:'layers';
 const iconColor=/^#[\da-f]{6}$/i.test(raw.iconColor||'')?raw.iconColor:'';
 let layoutSnapshot=null;
 try{
  if(raw.layoutSnapshot&&typeof raw.layoutSnapshot==='object'&&!Array.isArray(raw.layoutSnapshot)){
   const json=JSON.stringify(raw.layoutSnapshot);
   if(json.length<=120000)layoutSnapshot=JSON.parse(json);
  }
 }catch(_){}
 return {id,name,icon,iconColor,folder,tag,property,value,groupBy,view,sort,mode,includePaths,hiddenPaths,pinnedPaths,folderSorts,homeWidgetsEnabled,homeOrder,homeHidden,homeWidgetSizes,homeWidgetFrames,homeWidgetAlignment,layoutSnapshot};
}
/* Space state changes only affect views, never the vault contents. */
function writerV9215ActiveSpace(plugin){
 const cfg=plugin.settings.v9Spaces;
 return cfg?.enabled&&cfg.activeId?cfg.spaces.find(space=>space.id===cfg.activeId)||null:null;
}


function writerV9215SpaceHidden(plugin,path){
 const space=writerV9215ActiveSpace(plugin);
 return Boolean(space&&(space.hiddenPaths||[]).some(p=>path===p||path.startsWith(p.replace(/\/$/,'')+'/')));
}
function writerV10SpaceSaveLayout(plugin,space){
 const layout=plugin.app.workspace.getLayout?.();
 if(!space||!layout||typeof layout!=='object')return false;
 try{
  const snapshot=JSON.stringify(layout);
  if(snapshot.length>120000)return false;
  if(typeof writerV101SpaceBeforeOverwrite==='function' &&
   space.layoutSnapshot && JSON.stringify(space.layoutSnapshot)!==snapshot)writerV101SpaceBeforeOverwrite(plugin,space);
  space.layoutSnapshot=JSON.parse(snapshot);return true;
 }catch(_){return false;}
}
async function writerV10SpaceRestoreLayout(plugin,space){
 if(!space?.layoutSnapshot||typeof plugin.app.workspace.changeLayout!=='function')return false;
 try{
  await plugin.app.workspace.changeLayout(space.layoutSnapshot);
  return true;
 }catch(error){
  console.warn('[Basic AI] Space layout could not be restored',error);return false;
 }
}
async function writerV9215SelectSpace(plugin,id){
 const cfg=plugin.settings.v9Spaces;
 const next=cfg.enabled&&cfg.spaces.some(space=>space.id===id)?id:'';
 if(cfg.activeId===next)return;
 const previous=cfg.spaces.find(space=>space.id===cfg.activeId);
 if(cfg.autoSaveLayouts&&previous)writerV10SpaceSaveLayout(plugin,previous);
 cfg.activeId=next;
 await plugin.saveSettings();
 if(cfg.restoreLayoutsOnSwitch&&next){
  await writerV10SpaceRestoreLayout(plugin,cfg.spaces.find(space=>space.id===next));
 }
 plugin.writerV91FlexRefresh?.();
 plugin.writerV9SpacesRefresh?.();
 plugin.writerV9216SpacesDockRefresh?.();
 if(typeof WRITER_V8_HOME_VIEW!=='undefined')
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[])leaf.view?.render?.();
}
function writerV9SpaceTags(file,cache){
 const fm=cache?.frontmatter||{};
 const tags=Array.isArray(fm.tags)?fm.tags:(typeof fm.tags==='string'?fm.tags.split(/[,\s]+/):[]);
 const normalized=tags.map(tag=>String(tag||'').replace(/^#/,'').toLocaleLowerCase());
 for(const tag of cache?.tags||[])normalized.push(String(tag.tag||'').replace(/^#/,'').toLocaleLowerCase());
 return normalized;
}
function writerV9SpaceItems(plugin,space){
 const files=plugin.app.vault.getMarkdownFiles?.()||[];
 const cache=plugin.app.metadataCache;
 return files.filter(file=>{
  if(space.mode==='curated'&&!(space.includePaths||[]).some(path=>file.path===path||file.path.startsWith(path.replace(/\/$/,'')+'/')))return false;
  if(space.folder&&!(file.path===space.folder||file.path.startsWith(space.folder+'/')))return false;
  if((space.hiddenPaths||[]).some(path=>file.path===path||file.path.startsWith(path.replace(/\/$/,'')+'/')))return false;
  if(space.mode==='folder')return Boolean(space.folder);
  const data=cache.getFileCache?.(file)||{};
  if(space.tag&&!writerV9SpaceTags(file,data).some(tag=>tag===space.tag.toLocaleLowerCase()||tag.startsWith(space.tag.toLocaleLowerCase()+'/')))return false;
  if(space.property){
   const value=data.frontmatter?.[space.property];
   if(value===undefined||value===null)return false;
   if(space.value&&!String(value).toLocaleLowerCase().includes(space.value.toLocaleLowerCase()))return false;
  }
  return true;
 }).sort((a,b)=>{
  const pin=(file)=>(space.pinnedPaths||[]).some(p=>p===file.path||file.path.startsWith(p.replace(/\/$/,'')+'/'));
  const pinA=pin(a),pinB=pin(b);
  if(Boolean(pinA)!==Boolean(pinB))return pinA?-1:1;
  if(space.sort==='manual'){
   const order=space.includePaths||[];
   const rank=file=>{
    const n=order.findIndex(path=>file.path===path||file.path.startsWith(path.replace(/\/$/,'')+'/'));
    return n<0?Number.MAX_SAFE_INTEGER:n;
   };
   const ar=rank(a),br=rank(b);
   if(ar!==br)return ar-br;
   return a.basename.localeCompare(b.basename,undefined,{numeric:true});
  }
  if(space.sort==='name')return a.basename.localeCompare(b.basename,undefined,{numeric:true});
  if(space.sort==='oldest')return (a.stat?.mtime||0)-(b.stat?.mtime||0);
  return (b.stat?.mtime||0)-(a.stat?.mtime||0);
 }).slice(0,WRITER_V9_SPACE_MAX);
}
function writerV9SpaceEditor(plugin,initial,save){
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  modal.setTitle(initial?writerUi('Editar Space','Edit Space'):writerUi('Nova Space','New Space'));
  const draft={name:'',icon:'layers',iconColor:'',folder:'',tag:'',property:'',value:'',groupBy:'status',view:'cards',sort:'recent',mode:'filter',includePaths:[],hiddenPaths:[],pinnedPaths:[],folderSorts:{},homeWidgetsEnabled:false,homeOrder:[],homeHidden:[],homeWidgetSizes:{},homeWidgetFrames:{},homeWidgetAlignment:'grid',...(initial||{})};
  const root=modal.contentEl;
  const field=(key,pt,en)=>{
   new Setting(root).setName(writerUi(pt,en)).addText(t=>t
    .setValue(draft[key]||'').onChange(value=>{draft[key]=value;}));
  };
  field('name','Nome','Name');
  writerV922IconSetting(plugin,root,{pt:'Ícone do Space',en:'Space icon',value:draft.icon,color:draft.iconColor,defaultIcon:'layers',onApply:async(icon,color)=>{draft.icon=icon||'layers';draft.iconColor=color;}});
  new Setting(root).setName(writerUi('Tipo de Space','Space type')).addDropdown(d=>{
   for(const [id,pt,en] of [['filter','Filtros dinâmicos','Dynamic filters'],['curated','Notas escolhidas','Curated notes'],['folder','Pasta fixada','Pinned folder']])d.addOption(id,writerUi(pt,en));
   d.setValue(draft.mode||'filter').onChange(value=>{draft.mode=value;});
  });
  field('folder','Pasta raiz do Space (opcional)','Space root folder (optional)');
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Ao selecionar uma pasta, o explorador mostrará somente essa pasta como raiz, sem exibir as pastas superiores.','When a folder is selected, Explorer shows it as the visual root without its parent folder names.')});
   const pickPath=(foldersOnly,onSelect)=>{
    class SpacePathPicker extends require('obsidian').FuzzySuggestModal{
     getItems(){return (plugin.app.vault.getAllLoadedFiles?.()||[]).filter(item=>foldersOnly?Boolean(item.children):item.extension==='md'||Boolean(item.children));}
     getItemText(item){return item.path;}
     onChooseItem(item){onSelect(item.path);modal.close();writerV9SpaceEditor(plugin,draft,save);}
    }
    const picker=new SpacePathPicker(plugin.app);
    picker.setPlaceholder(writerUi('Pesquisar arquivos e pastas…','Search files and folders…'));
    picker.open();
   };
   new Setting(root).setName(writerUi('Pesquisar pasta','Find folder'))
    .addButton(button=>button.setButtonText(writerUi('Selecionar…','Select…')).onClick(()=>pickPath(true,path=>{draft.folder=path;})));

  new Setting(root).setName(writerUi('Usar pasta da nota aberta','Use the current note folder'))
   .setDesc(writerUi('Preenche a pasta sem mover arquivos.','Sets the folder path without moving files.'))
   .addButton(b=>b.setButtonText(writerUi('Selecionar pasta atual','Use current folder')).onClick(()=>{
    const current=plugin.app.workspace.getActiveFile?.();
    if(!current?.parent){new Notice(writerUi('Abra uma nota primeiro.','Open a note first.'));return;}
    draft.folder=current.parent.path||'';
    modal.close();writerV9SpaceEditor(plugin,draft,save);
   }));

  new Setting(root).setName(writerUi('Notas/pastas incluídas','Included notes/folders'))
   .setDesc(writerUi('Uma rota por linha para Spaces de seleção manual.','One vault path per line for curated Spaces.'))
   .addTextArea(t=>t.setValue((draft.includePaths||[]).join('\n')).onChange(value=>{draft.includePaths=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}));

  new Setting(root).setName(writerUi('Fixar somente neste Space','Pin only in this Space'))
   .setDesc(writerUi('Uma nota ou pasta por linha. Cada Space mantém seus itens fixados.','One file or folder path per line. Each Space has independent pinned items.'))
   .addTextArea(t=>t.setValue((draft.pinnedPaths||[]).join('\n')).onChange(value=>{
    draft.pinnedPaths=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   }));
  new Setting(root).setName(writerUi('Ocultar apenas neste Space','Hide only in this Space'))
   .setDesc(writerUi('Uma pasta ou nota por linha. Oculta também todo o conteúdo de pastas listadas, sem modificar o cofre.','One file or folder per line. Also hides descendants without changing vault files.'))
   .addTextArea(t=>t.setValue((draft.hiddenPaths||[]).join('\n')).onChange(value=>{
    draft.hiddenPaths=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   }));
  new Setting(root).setName(writerUi('Pesquisar nota ou pasta para incluir','Find note or folder to include'))
    .addButton(button=>button.setButtonText(writerUi('Selecionar…','Select…')).onClick(()=>pickPath(false,path=>{
     draft.includePaths=[...new Set([...(draft.includePaths||[]),path])];
    })));
   field('tag','Tag (opcional)','Tag (optional)');
  field('property','Propriedade YAML (opcional)','YAML property (optional)');
  field('value','Valor da propriedade (opcional)','Property value (optional)');
  field('groupBy','Agrupar quadro por propriedade','Board group property');
  new Setting(root).setName(writerUi('Widgets próprios na homepage','Independent homepage widgets'))
   .setDesc(writerUi('Ordem, visibilidade e tamanho dos widgets serão salvos somente neste Space.','Widget order, visibility and sizes will be saved only in this Space.'))
   .addToggle(toggle=>toggle.setValue(Boolean(draft.homeWidgetsEnabled)).onChange(value=>{
    draft.homeWidgetsEnabled=value;
    if(value&&!draft.homeOrder?.length){
     const global=plugin.settings.v8Finish;
     draft.homeOrder=[...(global?.homeOrder||[])];
     draft.homeHidden=[...(global?.homeHidden||[])];
     draft.homeWidgetSizes={...(global?.homeWidgetSizes||{})};
    }
   }));
  new Setting(root).setName(writerUi('Incluir nota aberta','Include currently open note'))
   .setDesc(writerUi('Adiciona a rota à seleção manual sem mover a nota.','Adds its path to the curated selection without moving the note.'))
   .addButton(b=>b.setButtonText(writerUi('Adicionar nota','Add note')).onClick(()=>{
    const file=plugin.app.workspace.getActiveFile?.();
    if(!file){new Notice(writerUi('Abra uma nota primeiro.','Open a note first.'));return;}
    draft.includePaths=[...new Set([...(draft.includePaths||[]),file.path])];
    modal.close();writerV9SpaceEditor(plugin,draft,save);
   }));
  const options=(key,pt,en,values)=>{
   new Setting(root).setName(writerUi(pt,en)).addDropdown(d=>{
    for(const [id,ptLabel,enLabel] of values)d.addOption(id,writerUi(ptLabel,enLabel));
    d.setValue(draft[key]).onChange(v=>{draft[key]=v;});
   });
  };
  options('view','Visualização','View',
   [['cards','Cartões','Cards'],['list','Lista','List'],['table','Tabela','Table'],['board','Quadro','Board']]);
  options('sort','Ordenação','Sort',
   [['recent','Mais recente','Most recent'],['name','Nome','Name'],['oldest','Mais antigo','Oldest'],['manual','Ordem de inclusão','Included path order']]);
  const status=root.createEl('p',{cls:'writer-v9-space-message'});
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Salvar','Save')).setCta().onClick(async()=>{
   const item=writerV9SpaceSanitize({...draft,id:initial?.id||'space-'+Date.now().toString(36)});
   if(!item){status.setText(writerUi('Informe um nome válido.','Enter a valid name.'));return;}
   if(item.mode==='folder'&&!item.folder){status.setText(writerUi('Selecione uma pasta.','Select a folder.'));return;}
   try{await save(item);modal.close();}catch(e){status.setText(String(e.message||e));}
  })).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
 };
 modal.open();
}
function writerV9SpaceModal(plugin){
 if(!plugin.settings.v9Spaces.enabled||!writerModuleOn(plugin,'smartSpaces'))return;
 const modal=new Modal(plugin.app),cfg=plugin.settings.v9Spaces;
 modal.modalEl?.addClass('writer-v102-spaces-modal');
 let currentId=cfg.activeId||cfg.spaces[0]?.id||'',query='',page=0;
 const icon=(target,name)=>{
  const targetIcon=target.createSpan({cls:'writer-v102-space-icon'});
  try{require('obsidian').setIcon(targetIcon,name||'file-text');}catch(_){targetIcon.setText('•');}
  return targetIcon;
 };
 const openFile=file=>{modal.close();void plugin.app.workspace.getLeaf('tab').openFile(file);};
 const refresh=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v102-spaces-manager');
  modal.setTitle(writerUi('Spaces · Coleções','Spaces · Collections'));
  const header=root.createDiv({cls:'writer-v102-spaces-header'});
  const picker=header.createDiv({cls:'writer-v102-space-picker'});
  icon(picker,'layers');
  const select=picker.createEl('select',{attr:{'aria-label':writerUi('Coleção atual','Current collection')}});
  for(const option of cfg.spaces){const el=select.createEl('option',{text:option.name});el.value=option.id;}
  if(!cfg.spaces.some(x=>x.id===currentId))currentId=cfg.spaces[0]?.id||'';
  select.value=currentId;
  select.addEventListener('change',async()=>{
   currentId=select.value;query='';page=0;
   // Selecting a Space now actually activates its own sorting, pins and widgets.
   await writerV9215SelectSpace(plugin,currentId);refresh();
  });
  const action=(target,label,symbol,callback)=>{
   const button=target.createEl('button',{cls:'writer-v102-spaces-action',
    attr:{type:'button',title:label,'aria-label':label}});
   try{require('obsidian').setIcon(button,symbol);}catch(_){button.setText(label);}
   button.addEventListener('click',callback);return button;
  };
  const actions=header.createDiv({cls:'writer-v102-spaces-actions'});
  action(actions,writerUi('Criar Space','Create Space'),'plus',()=>writerV9SpaceEditor(plugin,null,async space=>{
   cfg.spaces.push(space);currentId=space.id;query='';page=0;
   await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();plugin.writerV9216SpacesDockRefresh?.();plugin.writerV91FlexRefresh?.();refresh();
  }));
  const space=cfg.spaces.find(x=>x.id===currentId);
  if(!space){
   root.createEl('p',{cls:'setting-item-description',text:writerUi('Crie uma Space para reunir suas notas.','Create a Space to organize your notes.')});return;
  }
  action(actions,writerUi('Editar Space','Edit Space'),'settings-2',()=>writerV9SpaceEditor(plugin,space,async updated=>{
   const i=cfg.spaces.findIndex(x=>x.id===space.id);
   if(i>=0)cfg.spaces[i]=updated;
   await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();plugin.writerV9216SpacesDockRefresh?.();plugin.writerV91FlexRefresh?.();refresh();
  }));
  action(actions,writerUi('Mais opções','More options'),'ellipsis',event=>{
   const menu=new Menu(plugin.app);
   menu.addItem(item=>item.setTitle(writerUi('Ativar esta Space','Activate this Space')).setIcon('check')
    .onClick(()=>void writerV9215SelectSpace(plugin,space.id)));
   menu.addItem(item=>item.setTitle(writerUi('Ícone e cor','Icon and color')).setIcon('palette').onClick(()=>
    writerV922OpenIconPicker(plugin,{title:space.name,value:space.icon||'layers',color:space.iconColor||'',defaultIcon:'layers',
     onApply:async(name,color)=>{space.icon=name||'layers';space.iconColor=color;await plugin.saveSettings();refresh();plugin.writerV9216SpacesDockRefresh?.();}})));
   menu.addSeparator();
   menu.addItem(item=>item.setTitle(writerUi('Excluir coleção','Delete collection')).setIcon('trash-2').onClick(()=>{
    const confirm=new Modal(plugin.app);
    confirm.onOpen=()=>{
     confirm.setTitle(writerUi('Excluir a Space?','Delete this Space?'));
     confirm.contentEl.createEl('p',{text:writerUi('Suas notas não serão excluídas.','Your notes will not be deleted.')});
     new Setting(confirm.contentEl).addButton(btn=>btn.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>confirm.close()))
      .addButton(btn=>btn.setButtonText(writerUi('Excluir','Delete')).setWarning().onClick(async()=>{
       cfg.spaces=cfg.spaces.filter(x=>x.id!==space.id);
       if(cfg.activeId===space.id)cfg.activeId='';
       currentId=cfg.spaces[0]?.id||'';page=0;query='';
       await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();plugin.writerV9216SpacesDockRefresh?.();plugin.writerV91FlexRefresh?.();
       confirm.close();refresh();
      }));
    };confirm.open();
   }));
   menu.showAtMouseEvent(event);
  });
  const intro=root.createDiv({cls:'writer-v102-spaces-intro'});
  const name=intro.createDiv({cls:'writer-v102-spaces-intro-name'});
  const symbol=icon(name,space.icon||'layers');
  if(space.iconColor)symbol.style.color=space.iconColor;
  name.createEl('strong',{text:space.name});
  const activated=cfg.activeId===space.id;
  if(activated)intro.createSpan({cls:'writer-v104-space-active',text:writerUi('Ativo','Active')});
  const source=space.mode==='folder'?writerUi('Pasta','Folder'):
   space.mode==='curated'?writerUi('Selecionadas','Curated'):writerUi('Filtros','Filters');
  intro.createSpan({cls:'writer-v102-spaces-source',text:source+(space.folder?' · '+space.folder:'')});
  const controls=root.createDiv({cls:'writer-v102-spaces-controls'});
  const searchWrap=controls.createDiv({cls:'writer-v102-spaces-search-wrap'});
  icon(searchWrap,'search');
  const search=searchWrap.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar notas nesta Space…','Search notes in this Space…'),
   'aria-label':writerUi('Buscar notas','Search notes')}});
  search.value=query;search.addEventListener('input',()=>{query=search.value;page=0;draw();});
  const layouts=controls.createDiv({cls:'writer-v102-spaces-layouts',attr:{role:'group','aria-label':writerUi('Modo de visualização','View mode')}});
  const modes=[['cards','layout-grid','Cartões','Cards'],['list','list','Lista','List'],['table','table','Tabela','Table'],['board','columns-3','Quadro','Board']];
  const buttons=new Map();
  for(const [id,ico,pt,en] of modes){
   buttons.set(id,action(layouts,writerUi(pt,en),ico,async()=>{
    space.view=id;page=0;await plugin.saveSettings();draw();
   }));
  }
  const count=root.createDiv({cls:'writer-v102-spaces-count'});
  const results=root.createDiv({cls:'writer-v9-spaces-results writer-v102-spaces-results'});
  const pagination=root.createDiv({cls:'writer-v102-spaces-pagination'});
  const draw=()=>{
   results.empty();pagination.empty();
   for(const [id,button] of buttons){
    button.classList.toggle('is-active',space.view===id);
    button.setAttribute('aria-pressed',String(space.view===id));
   }
   results.className='writer-v9-spaces-results writer-v102-spaces-results is-'+space.view;
   const all=writerV9SpaceItems(plugin,space);
   const norm=query.trim().toLocaleLowerCase();
   const items=all.filter(file=>!norm||file.basename.toLocaleLowerCase().includes(norm)||file.path.toLocaleLowerCase().includes(norm));
   count.setText(items.length+' '+writerUi('notas','notes')+(items.length!==all.length?' / '+all.length:''));
   if(!items.length){results.createEl('p',{cls:'writer-v102-spaces-empty',text:writerUi('Nenhuma nota encontrada.','No matching notes.')});return;}
   const pageSize=space.view==='table'?30:24,max=Math.max(0,Math.ceil(items.length/pageSize)-1);
   page=Math.max(0,Math.min(max,page));
   const visible=items.slice(page*pageSize,page*pageSize+pageSize);
   const metadata=plugin.app.metadataCache;
   if(space.view==='board'){
    const groups=new Map();
    for(const file of visible){
     const key=String(metadata.getFileCache?.(file)?.frontmatter?.[space.groupBy]??writerUi('Sem grupo','Ungrouped')).slice(0,80);
     if(!groups.has(key))groups.set(key,[]);groups.get(key).push(file);
    }
    for(const [name,files] of groups){
     const column=results.createDiv({cls:'writer-v9-spaces-column'});
     column.createEl('h4',{text:name+' · '+files.length});
     for(const file of files){
      const item=column.createEl('button',{cls:'writer-v102-space-board-card',attr:{type:'button',title:file.path}});
      icon(item,plugin.settings.v9Explorer?.items?.[file.path]?.icon||'file-text');
      item.createSpan({text:file.basename});
      item.addEventListener('click',()=>openFile(file));
     }
    }
   }else if(space.view==='table'){
    const table=results.createEl('table');
    const head=table.createEl('thead').createEl('tr');
    for(const label of [writerUi('Nota','Note'),writerUi('Pasta','Folder'),space.groupBy||writerUi('Grupo','Group')])head.createEl('th',{text:label});
    const body=table.createEl('tbody');
    for(const file of visible){
     const tr=body.createEl('tr'),cell=tr.createEl('td');
     cell.createEl('button',{text:file.basename,attr:{type:'button'}}).addEventListener('click',()=>openFile(file));
     tr.createEl('td',{text:file.parent?.path||'/'});
     tr.createEl('td',{text:String(metadata.getFileCache?.(file)?.frontmatter?.[space.groupBy]??'').slice(0,100)});
    }
   }else{
    for(const file of visible){
     const item=results.createEl('button',{cls:'writer-v9-spaces-item writer-v102-space-entry',
      attr:{type:'button',title:file.path,'aria-label':file.basename}});
     const symbol=icon(item,plugin.settings.v9Explorer?.items?.[file.path]?.icon||'file-text');
     symbol.classList.add('writer-v102-space-entry-icon');
     const info=item.createDiv({cls:'writer-v102-space-entry-info'});
     info.createEl('strong',{text:file.basename});
     info.createSpan({cls:'writer-v9-spaces-detail',text:file.parent?.path||'/'});
     const arrow=icon(item,'chevron-right');arrow.classList.add('writer-v102-space-entry-arrow');
     item.addEventListener('click',()=>openFile(file));
    }
   }
   if(max>0){
    const prev=pagination.createEl('button',{text:writerUi('Anterior','Previous'),attr:{type:'button'}});prev.disabled=page===0;
    prev.addEventListener('click',()=>{page--;draw();results.scrollTop=0;});
    pagination.createSpan({text:(page+1)+' / '+(max+1)});
    const next=pagination.createEl('button',{text:writerUi('Próxima','Next'),attr:{type:'button'}});next.disabled=page===max;
    next.addEventListener('click',()=>{page++;draw();results.scrollTop=0;});
   }
  };
  draw();
 };
 modal.onOpen=refresh;modal.open();
}
class WriterV9SpacesSideView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.currentId='';this.query='';}
 getViewType(){return WRITER_V9_SPACE_VIEW;}
 getDisplayText(){return writerUi('Spaces · Coleções','Spaces · Collections');}
 getIcon(){return 'layers';}
 async onOpen(){this.render();}
 render(){
  const root=this.contentEl;root.empty();root.addClass('writer-v9-space-sidebar');
  const cfg=this.plugin.settings.v9Spaces;
  const heading=root.createDiv({cls:'writer-v9-space-side-head'});
  require('obsidian').setIcon(heading.createSpan(),'layers');
  heading.createEl('strong',{text:'Spaces'});
  const manage=heading.createEl('button',{attr:{title:writerUi('Gerenciar Spaces','Manage Spaces'),'aria-label':writerUi('Gerenciar Spaces','Manage Spaces')}});
  require('obsidian').setIcon(manage,'settings-2');
  manage.addEventListener('click',()=>writerV9SpaceModal(this.plugin));
  if(!cfg.enabled){root.createEl('p',{text:writerUi('Ative Spaces nas configurações.','Enable Spaces in settings.')});return;}
  const nav=root.createDiv({cls:'writer-v9-space-side-nav'});
  const space=cfg.spaces.find(x=>x.id===cfg.activeId)||cfg.spaces.find(x=>x.id===this.currentId)||cfg.spaces[0];
  if(space)this.currentId=space.id;
  for(const option of cfg.spaces){
   const button=nav.createEl('button',{cls:'writer-v9-space-side-tab'+(option.id===this.currentId?' is-active':''),attr:{type:'button',title:option.name}});
   require('obsidian').setIcon(button,option.icon||'layers');
   if(option.iconColor)button.style.setProperty('--writer-v9216-space-color',option.iconColor);
   button.createSpan({text:option.name});
   button.addEventListener('click',()=>{this.currentId=option.id;this.query='';void writerV9215SelectSpace(this.plugin,option.id).then(()=>this.render());});
  }
  if(!space){root.createEl('p',{text:writerUi('Crie uma Space para começar.','Create a Space to get started.')});return;}
  const search=root.createEl('input',{cls:'writer-v9-spaces-search',attr:{type:'search',placeholder:writerUi('Pesquisar nesta Space…','Search this Space…')}});
  search.value=this.query;
  const sidebarTools=root.createDiv({cls:'writer-v1042-space-side-tools'});
  const quick=(pt,en,icon,handler)=>{
   const button=sidebarTools.createEl('button',{attr:{type:'button','aria-label':writerUi(pt,en),title:writerUi(pt,en)}});
   require('obsidian').setIcon(button,icon);button.addEventListener('click',handler);
   return button;
  };
  quick('Nova Space','New Space','plus',()=>writerV9SpaceEditor(this.plugin,null,async created=>{
   cfg.spaces.push(created);await this.plugin.saveSettings();
   await writerV9215SelectSpace(this.plugin,created.id);this.currentId=created.id;this.render();
  }));
  quick('Biblioteca Longform','Longform bookshelf','library',()=>this.plugin.writerV10OpenBookshelf?.());
  quick('Ordenação global','Global sorting','list-ordered',()=>writerV1043OpenNativeSortMenu(this.plugin));
  const summary=sidebarTools.createSpan({cls:'writer-v1042-space-count'});
  const body=root.createDiv({cls:'writer-v9-space-side-list'});
  const draw=()=>{
   body.empty();
   const files=writerV9SpaceItems(this.plugin,space).filter(file=>file.path.toLocaleLowerCase().includes(this.query.toLocaleLowerCase()));
   summary.setText(files.length+' '+writerUi('notas','notes'));
   for(const file of files){
    const button=body.createEl('button',{cls:'writer-v9-space-side-item',attr:{type:'button',title:file.path}});
    require('obsidian').setIcon(button.createSpan(),this.plugin.settings.v9Explorer?.items?.[file.path]?.icon||'file-text');
    button.createSpan({text:file.basename});
    button.addEventListener('click',()=>void this.plugin.app.workspace.getLeaf('tab').openFile(file));
   }
   if(!files.length)body.createEl('p',{text:writerUi('Nenhuma nota encontrada.','No matching notes.')});
  };
  search.addEventListener('input',()=>{this.query=search.value;draw();});draw();
  if(space.mode==='curated'){
   const add=root.createEl('button',{cls:'writer-v9-space-side-add',text:writerUi('Adicionar nota atual','Add active note')});
   add.addEventListener('click',async()=>{
    const file=this.plugin.app.workspace.getActiveFile?.();
    if(!(file instanceof TFile)){new Notice(writerUi('Abra uma nota primeiro.','Open a note first.'));return;}
    if(!space.includePaths.includes(file.path))space.includePaths.push(file.path);
    await this.plugin.saveSettings();this.render();
   });
  }
 }
}
function writerV9RegisterSpaces(plugin){
 plugin.registerView(WRITER_V9_SPACE_VIEW,leaf=>new WriterV9SpacesSideView(leaf,plugin));
 plugin.writerV9SpacesRefresh=()=>{for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V9_SPACE_VIEW)||[])leaf.view?.render?.();};
 plugin.addCommand({id:'v9215-spaces-all',name:writerUi('Spaces: mostrar todo o cofre','Spaces: show entire vault'),callback:()=>void writerV9215SelectSpace(plugin,'')});
 const openSidebar=async()=>{
  if(plugin.settings.v9Spaces.sidebar===false)return;
  const existing=plugin.app.workspace.getLeavesOfType?.(WRITER_V9_SPACE_VIEW)?.[0];
  const leaf=existing||plugin.app.workspace.getLeftLeaf?.(false)||plugin.app.workspace.getLeaf('tab');
  if(!leaf)return;
  if(!existing)await leaf.setViewState({type:WRITER_V9_SPACE_VIEW,active:true});
 if(!plugin.settings.v9Spaces.activeId&&plugin.settings.v9Spaces.spaces.length)await writerV9215SelectSpace(plugin,plugin.settings.v9Spaces.spaces[0].id);
  plugin.app.workspace.revealLeaf?.(leaf);
 };
 plugin.writerV9SpacesSidebarOpen=openSidebar;
 plugin.addCommand({id:'v9-spaces-sidebar',name:writerUi('Spaces: abrir barra lateral','Spaces: open sidebar'),callback:()=>void openSidebar()});
 plugin.writerV9SpaceOpen=()=>writerV9SpaceModal(plugin);
 plugin.addCommand({id:'v9-spaces-open',name:writerUi('Spaces: abrir coleções','Spaces: open collections'),
  callback:()=>writerV9SpaceModal(plugin)});

 plugin.addCommand({id:'v1042-spaces-next',
  name:writerUi('Spaces: próxima coleção','Spaces: next collection'),
  callback:()=>{
   const spaces=plugin.settings.v9Spaces?.spaces||[];
   if(!spaces.length)return;
   const index=spaces.findIndex(s=>s.id===plugin.settings.v9Spaces.activeId);
   void writerV9215SelectSpace(plugin,spaces[(index+1)%spaces.length].id);
  }});
 plugin.addCommand({id:'v1042-spaces-previous',
  name:writerUi('Spaces: coleção anterior','Spaces: previous collection'),
  callback:()=>{
   const spaces=plugin.settings.v9Spaces?.spaces||[];
   if(!spaces.length)return;
   const index=spaces.findIndex(s=>s.id===plugin.settings.v9Spaces.activeId);
   void writerV9215SelectSpace(plugin,spaces[(index<0?0:index+spaces.length-1)%spaces.length].id);
  }});
 plugin.addCommand({id:'v1042-spaces-quick-pin',
  name:writerUi('Spaces: fixar ou desafixar nota atual','Spaces: pin or unpin current note'),
  callback:async()=>{
   const file=plugin.app.workspace.getActiveFile?.();
   const space=writerV9215ActiveSpace(plugin);
   if(!file||!space){new Notice(writerUi('Abra uma nota e ative uma Space.','Open a note and activate a Space.'));return;}
   const pinned=new Set(space.pinnedPaths||[]);
   if(pinned.has(file.path))pinned.delete(file.path);else pinned.add(file.path);
   space.pinnedPaths=[...pinned];
   await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();plugin.writerV91FlexRefresh?.();
  }});
 // Quick actions remain available through commands, not the ribbon.
 plugin.registerEvent(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!writerModuleOn(plugin,'smartSpaces')||!plugin.settings.v9Spaces.enabled)return;
  if(file instanceof TFile&&file.extension==='md'&&plugin.settings.v9Spaces.spaces.length){
   menu.addItem(item=>item.setTitle(writerUi('Adicionar nota a uma Space','Add note to a Space'))
    .setIcon('layers').onClick(()=>{
     const picker=new Modal(plugin.app);
     picker.onOpen=()=>{
      picker.setTitle(writerUi('Adicionar à Space','Add to Space'));
      for(const space of plugin.settings.v9Spaces.spaces){
       new Setting(picker.contentEl).setName(space.name)
        .addButton(button=>button.setButtonText(writerUi('Adicionar','Add')).onClick(async()=>{
         space.includePaths=[...new Set([...(space.includePaths||[]),file.path])];
         // A dynamic Space keeps its filters; only curated Spaces use explicit inclusion.
         if(space.mode!=='curated'){
          new Notice(writerUi('A nota foi guardada na seleção, mas a Space usa filtros.','Note saved to the selection, but the Space uses filters.'));
         }
         await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();plugin.writerV9216SpacesDockRefresh?.();picker.close();
        }));
      }
     };picker.open();
    }));
  }
  if(file instanceof TFolder){
   menu.addItem(item=>item.setTitle(writerUi('Criar Space desta pasta','Create Space from folder'))
    .setIcon('layers').onClick(()=>{
     writerV9SpaceEditor(plugin,{folder:file.path,name:file.name,view:'cards',mode:'folder'},async space=>{
      space.id='space-'+Date.now().toString(36);
      plugin.settings.v9Spaces.spaces.push(space);
      await writerV9215SelectSpace(plugin,space.id);
      plugin.writerV91FlexRefresh?.();plugin.writerV9SpacesRefresh?.();plugin.writerV9216SpacesDockRefresh?.();
     });
    }));
  }
 }));
}
function writerV9SpacesSettings(plugin,panel){
 const cfg=plugin.settings.v9Spaces;
 panel.createEl('h3',{text:writerUi('Spaces · coleções locais','Spaces · local collections')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Coleções por pasta, tag ou propriedades, com ícones e barra inferior no explorador. Os filtros do Space são independentes. A ocultação do explorador é global.','Collections by folder, tag or properties, with icons and a bottom explorer switcher. Space filters are independent; Explorer hiding is global.')});
 new Setting(panel).setName(writerUi('Ativar Spaces (desativado inicialmente)','Enable Spaces (off by default)'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async value=>{
    cfg.enabled=value;if(!value)cfg.activeId='';
    await plugin.saveSettings();
    plugin.writerV9216SpacesDockRefresh?.();plugin.writerV91FlexRefresh?.();plugin.writerV9SpacesRefresh?.();
   }));
 new Setting(panel).setName(writerUi('Barra de Spaces no rodapé do explorador','Space switcher at the bottom of File Explorer'))
  .addToggle(t=>t.setValue(cfg.dock).onChange(async value=>{
   cfg.dock=value;await plugin.saveSettings();plugin.writerV9216SpacesDockRefresh?.();
  }));
 new Setting(panel).setName(writerUi('Salvar layouts ao trocar de Space','Save layouts when switching Spaces'))
  .setDesc(writerUi('Mantém a posição de painéis por Space, sem mover arquivos do cofre.','Keeps a pane layout per Space, without moving vault files.'))
  .addToggle(t=>t.setValue(cfg.autoSaveLayouts===true).onChange(async value=>{cfg.autoSaveLayouts=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Restaurar layouts ao trocar de Space','Restore layout on Space switch'))
  .setDesc(writerUi('Opcional: pode reorganizar abas e painéis abertos.','Optional: may rearrange open tabs and panes.'))
  .addToggle(t=>t.setValue(cfg.restoreLayoutsOnSwitch===true).onChange(async value=>{cfg.restoreLayoutsOnSwitch=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Layout do Space ativo','Active Space layout'))
  .setDesc(writerUi('Salve ou restaure manualmente a disposição atual.','Manually save or restore the current arrangement.'))
  .addButton(b=>b.setButtonText(writerUi('Salvar layout','Save layout')).onClick(async()=>{
   const space=cfg.spaces.find(s=>s.id===cfg.activeId);
   if(!writerV10SpaceSaveLayout(plugin,space)){new Notice(writerUi('Escolha um Space ou simplifique o layout.','Select a Space or simplify the layout.'));return;}
   await plugin.saveSettings();new Notice(writerUi('Layout salvo neste Space.','Layout saved for this Space.'));
  }))
  .addButton(b=>b.setButtonText(writerUi('Restaurar','Restore')).onClick(async()=>{
   const space=cfg.spaces.find(s=>s.id===cfg.activeId);
   if(!await writerV10SpaceRestoreLayout(plugin,space))new Notice(writerUi('Nenhum layout salvo ou restauração indisponível.','No saved layout or restore unavailable.'));
  }));
 new Setting(panel).setName(writerUi('Space ativo','Active Space')).addDropdown(drop=>{
   drop.addOption('',writerUi('Todo o cofre','Entire vault'));
   for(const space of cfg.spaces)drop.addOption(space.id,space.name);
   drop.setValue(cfg.activeId||'').onChange(value=>void writerV9215SelectSpace(plugin,value));
  });
 new Setting(panel).setName(writerUi('Ícone de gerenciamento no explorador','Explorer management icon'))
  .addToggle(t=>t.setValue(cfg.manageIcon).onChange(async value=>{
   cfg.manageIcon=value;await plugin.saveSettings();plugin.writerV9216SpacesDockRefresh?.();
  }));
 new Setting(panel).setName(writerUi('Ativar painel lateral de Spaces','Enable Spaces sidebar'))
  .addToggle(t=>t.setValue(cfg.sidebar).onChange(async value=>{
   cfg.sidebar=value;await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Abrir Spaces na barra lateral','Open Spaces in sidebar'))
  .addButton(b=>b.setButtonText(writerUi('Abrir painel','Open sidebar')).onClick(()=>void plugin.writerV9SpacesSidebarOpen?.()));
 new Setting(panel).setName(writerUi('Abrir e organizar coleções','Open and manage collections'))
  .addButton(button=>button.setButtonText(writerUi('Abrir Spaces','Open Spaces')).onClick(()=>writerV9SpaceModal(plugin)));
}
