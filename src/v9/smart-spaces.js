'use strict';
/* v9 smart spaces: original local-first implementation of Make-inspired
 * saved filtered collections. Does not create a new pane or copy Make.md code. */
const WRITER_V9_SPACE_VIEWS=['cards','list','table','board'];
const WRITER_V9_SPACE_SORTS=['name','recent','oldest'];
const WRITER_V9_SPACE_MAX=200;
const WRITER_V9_SPACE_VIEW='writer-smart-spaces';
function writerV9SpacesMerge(settings){
 const raw=settings.v9Spaces&&typeof settings.v9Spaces==='object'&&!Array.isArray(settings.v9Spaces)?settings.v9Spaces:{};
 const cfg=settings.v9Spaces={enabled:false,activeId:'',spaces:[],...raw};
 cfg.enabled=cfg.enabled===true;
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
 return {id,name,folder,tag,property,value,groupBy,view,sort,mode,includePaths,hiddenPaths};
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
async function writerV9215SelectSpace(plugin,id){
 const cfg=plugin.settings.v9Spaces;
 const next=cfg.enabled&&cfg.spaces.some(space=>space.id===id)?id:'';
 if(cfg.activeId===next)return;
 cfg.activeId=next;
 await plugin.saveSettings();
 plugin.writerV91FlexRefresh?.();
 plugin.writerV9SpacesRefresh?.();
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
  if((space.hiddenPaths||[]).some(path=>file.path===path||file.path.startsWith(path.replace(/\/$/,'')+'/')))return false;
  if(space.mode==='curated'&&!(space.includePaths||[]).some(path=>file.path===path||file.path.startsWith(path.replace(/\/$/,'')+'/')))return false;
  if(space.folder&&!(file.path===space.folder||file.path.startsWith(space.folder+'/')))return false;
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
  if(space.sort==='name')return a.basename.localeCompare(b.basename);
  if(space.sort==='oldest')return (a.stat?.mtime||0)-(b.stat?.mtime||0);
  return (b.stat?.mtime||0)-(a.stat?.mtime||0);
 }).slice(0,WRITER_V9_SPACE_MAX);
}
function writerV9SpaceEditor(plugin,initial,save){
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  modal.setTitle(initial?writerUi('Editar Space','Edit Space'):writerUi('Nova Space','New Space'));
  const draft={name:'',folder:'',tag:'',property:'',value:'',groupBy:'status',view:'cards',sort:'recent',mode:'filter',includePaths:[],hiddenPaths:[],...(initial||{})};
  const root=modal.contentEl;
  const field=(key,pt,en)=>{
   new Setting(root).setName(writerUi(pt,en)).addText(t=>t
    .setValue(draft[key]||'').onChange(value=>{draft[key]=value;}));
  };
  field('name','Nome','Name');
  new Setting(root).setName(writerUi('Tipo de Space','Space type')).addDropdown(d=>{
   for(const [id,pt,en] of [['filter','Filtros dinâmicos','Dynamic filters'],['curated','Notas escolhidas','Curated notes'],['folder','Pasta fixada','Pinned folder']])d.addOption(id,writerUi(pt,en));
   d.setValue(draft.mode||'filter').onChange(value=>{draft.mode=value;});
  });
  field('folder','Pasta (opcional)','Folder (optional)');
  new Setting(root).setName(writerUi('Notas/pastas incluídas','Included notes/folders'))
   .setDesc(writerUi('Uma rota por linha para Spaces de seleção manual.','One vault path per line for curated Spaces.'))
   .addTextArea(t=>t.setValue((draft.includePaths||[]).join('\n')).onChange(value=>{draft.includePaths=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}));

  new Setting(root).setName(writerUi('Ocultar somente neste Space','Hide only in this Space'))
   .setDesc(writerUi('Uma pasta ou nota por linha. Outros Spaces não serão afetados.','One note or folder path per line. Other Spaces are unaffected.'))
   .addTextArea(t=>t.setValue((draft.hiddenPaths||[]).join('\n')).onChange(value=>{
    draft.hiddenPaths=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   }));
  field('tag','Tag (opcional)','Tag (optional)');
  field('property','Propriedade YAML (opcional)','YAML property (optional)');
  field('value','Valor da propriedade (opcional)','Property value (optional)');
  field('groupBy','Agrupar quadro por propriedade','Board group property');
  const options=(key,pt,en,values)=>{
   new Setting(root).setName(writerUi(pt,en)).addDropdown(d=>{
    for(const [id,ptLabel,enLabel] of values)d.addOption(id,writerUi(ptLabel,enLabel));
    d.setValue(draft[key]).onChange(v=>{draft[key]=v;});
   });
  };
  options('view','Visualização','View',
   [['cards','Cartões','Cards'],['list','Lista','List'],['table','Tabela','Table'],['board','Quadro','Board']]);
  options('sort','Ordenação','Sort',
   [['recent','Mais recente','Most recent'],['name','Nome','Name'],['oldest','Mais antigo','Oldest']]);
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
 const modal=new Modal(plugin.app);
 let currentId=plugin.settings.v9Spaces.spaces[0]?.id||'';
 let filter='';
 const refresh=()=>{
  const root=modal.contentEl;root.empty();
  modal.setTitle(writerUi('Spaces · Coleções','Spaces · Collections'));
  const nav=root.createDiv({cls:'writer-v9-spaces-nav'});
  const select=nav.createEl('select',{attr:{'aria-label':writerUi('Selecionar Space','Select Space')}});
  for(const space of plugin.settings.v9Spaces.spaces){
   const option=select.createEl('option',{text:space.name});option.value=space.id;
  }
  select.value=currentId;select.addEventListener('change',()=>{currentId=select.value;filter='';refresh();});
  nav.createEl('button',{text:writerUi('Nova','New')}).addEventListener('click',()=>{
   writerV9SpaceEditor(plugin,null,async space=>{
    plugin.settings.v9Spaces.spaces.push(space);currentId=space.id;await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();refresh();
   });
  });
  const space=plugin.settings.v9Spaces.spaces.find(s=>s.id===currentId);
  if(!space){root.createEl('p',{text:writerUi('Crie uma Space para agrupar notas por pasta, tag ou propriedade.','Create a Space to collect notes by folder, tag or property.')});return;}
  nav.createEl('button',{text:writerUi('Editar','Edit')}).addEventListener('click',()=>{
   writerV9SpaceEditor(plugin,space,async updated=>{
    const idx=plugin.settings.v9Spaces.spaces.findIndex(s=>s.id===space.id);
    if(idx>=0)plugin.settings.v9Spaces.spaces[idx]=updated;
    await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();refresh();
   });
  });
  nav.createEl('button',{text:writerUi('Excluir','Delete')}).addEventListener('click',()=>{
   const confirm=new Modal(plugin.app);
   confirm.onOpen=()=>{
    confirm.setTitle(writerUi('Remover coleção?','Remove collection?'));
    confirm.contentEl.createEl('p',{text:writerUi('As notas permanecerão no cofre.','Your notes will remain in the vault.')});
    new Setting(confirm.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>confirm.close()))
     .addButton(b=>b.setButtonText(writerUi('Excluir Space','Delete Space')).setWarning().onClick(async()=>{
      plugin.settings.v9Spaces.spaces=plugin.settings.v9Spaces.spaces.filter(s=>s.id!==space.id);
      if(plugin.settings.v9Spaces.activeId===space.id)plugin.settings.v9Spaces.activeId='';
      currentId=plugin.settings.v9Spaces.spaces[0]?.id||'';
      await plugin.saveSettings();plugin.writerV9SpacesRefresh?.();confirm.close();refresh();
     }));
   };
   confirm.open();
  });
  const search=root.createEl('input',{cls:'writer-v9-spaces-search',attr:{type:'search',placeholder:writerUi('Pesquisar nesta coleção…','Search this collection…')}});
  search.value=filter;
  const content=root.createDiv({cls:'writer-v9-spaces-results is-'+space.view});
  const cached=plugin.app.metadataCache;
  const draw=()=>{
   content.empty();
   const items=writerV9SpaceItems(plugin,space).filter(file=>file.path.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
   if(!items.length){content.createEl('p',{text:writerUi('Nenhuma nota corresponde aos filtros.','No matching notes.')});return;}
   const openFile=file=>{modal.close();void plugin.app.workspace.getLeaf('tab').openFile(file);};
   const propertyOf=file=>cached.getFileCache?.(file)?.frontmatter||{};
   if(space.view==='board'){
    const groups=new Map();
    for(const file of items){
     const key=String(propertyOf(file)[space.groupBy]??writerUi('Sem grupo','Ungrouped')).slice(0,80);
     if(!groups.has(key))groups.set(key,[]);groups.get(key).push(file);
    }
    for(const [group,entries] of groups){
     const column=content.createDiv({cls:'writer-v9-spaces-column'});
     column.createEl('h4',{text:group+' · '+entries.length});
     for(const file of entries)column.createEl('button',{text:file.basename}).addEventListener('click',()=>openFile(file));
    }
   }else if(space.view==='table'){
    const table=content.createEl('table');
    const head=table.createEl('thead').createEl('tr');
    for(const label of [writerUi('Nota','Note'),writerUi('Pasta','Folder'),space.groupBy])head.createEl('th',{text:label});
    const tbody=table.createEl('tbody');
    for(const file of items){
     const row=tbody.createEl('tr');
     row.createEl('td').createEl('button',{text:file.basename}).addEventListener('click',()=>openFile(file));
     row.createEl('td',{text:file.parent?.path||'/'});
     row.createEl('td',{text:String(propertyOf(file)[space.groupBy]??'').slice(0,120)});
    }
   }else{
    for(const file of items){
     const button=content.createEl('button',{cls:'writer-v9-spaces-item'});
     const icon=button.createSpan();
     require('obsidian').setIcon(icon,plugin.settings.v9Explorer?.items?.[file.path]?.icon||'file-text');
     button.createSpan({text:file.basename});
     if(space.view==='cards')button.createSpan({cls:'writer-v9-spaces-detail',text:file.parent?.path||'/'});
     button.addEventListener('click',()=>openFile(file));
    }
   }
   root.querySelector('.writer-v9-spaces-count')?.setText(items.length+' '+writerUi('notas','notes'));
  };
  root.createEl('small',{cls:'writer-v9-spaces-count'});
  search.addEventListener('input',()=>{filter=search.value;draw();});
  draw();
 };
 modal.onOpen=refresh;
 modal.open();
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
   require('obsidian').setIcon(button,option.mode==='folder'?'folder':option.mode==='curated'?'bookmark':'layers');
   button.createSpan({text:option.name});
   button.addEventListener('click',()=>{this.currentId=option.id;this.query='';void writerV9215SelectSpace(this.plugin,option.id).then(()=>this.render());});
  }
  if(!space){root.createEl('p',{text:writerUi('Crie uma Space para começar.','Create a Space to get started.')});return;}
  const search=root.createEl('input',{cls:'writer-v9-spaces-search',attr:{type:'search',placeholder:writerUi('Pesquisar nesta Space…','Search this Space…')}});
  search.value=this.query;
  const body=root.createDiv({cls:'writer-v9-space-side-list'});
  const draw=()=>{
   body.empty();
   const files=writerV9SpaceItems(this.plugin,space).filter(file=>file.path.toLocaleLowerCase().includes(this.query.toLocaleLowerCase()));
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
 plugin.registerEvent(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!writerModuleOn(plugin,'smartSpaces')||!plugin.settings.v9Spaces.enabled)return;
  if(file instanceof TFolder){
   menu.addItem(item=>item.setTitle(writerUi('Criar Space desta pasta','Create Space from folder'))
    .setIcon('layers').onClick(()=>{
     writerV9SpaceEditor(plugin,{folder:file.path,name:file.name,view:'cards',mode:'folder'},async space=>{
      space.id='space-'+Date.now().toString(36);
      plugin.settings.v9Spaces.spaces.push(space);
      await plugin.saveSettings();
     });
    }));
  }
 }));
}
function writerV9SpacesSettings(plugin,panel){
 const cfg=plugin.settings.v9Spaces;
 panel.createEl('h3',{text:writerUi('Spaces · coleções locais','Spaces · local collections')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Coleções virtuais filtradas por pasta, tag ou propriedades das notas, sem criar novos arquivos nem um painel lateral.','Virtual note collections filtered by folder, tags or properties, without creating files or a new sidebar.')});
 new Setting(panel).setName(writerUi('Ativar Spaces (desativado inicialmente)','Enable Spaces (off by default)'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async value=>{cfg.enabled=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Space ativo','Active Space')).addDropdown(drop=>{
   drop.addOption('',writerUi('Todo o cofre','Entire vault'));
   for(const space of cfg.spaces)drop.addOption(space.id,space.name);
   drop.setValue(cfg.activeId||'').onChange(value=>void writerV9215SelectSpace(plugin,value));
  });
 new Setting(panel).setName(writerUi('Abrir Spaces na barra lateral','Open Spaces in sidebar'))
  .addButton(b=>b.setButtonText(writerUi('Abrir painel','Open sidebar')).onClick(()=>void plugin.writerV9SpacesSidebarOpen?.()));
 new Setting(panel).setName(writerUi('Abrir e organizar coleções','Open and manage collections'))
  .addButton(button=>button.setButtonText(writerUi('Abrir Spaces','Open Spaces')).onClick(()=>writerV9SpaceModal(plugin)));
}
