'use strict';
/* v9 smart spaces: original local-first implementation of Make-inspired
 * saved filtered collections. Does not create a new pane or copy Make.md code. */
const WRITER_V9_SPACE_VIEWS=['cards','list','table','board'];
const WRITER_V9_SPACE_SORTS=['name','recent','oldest'];
const WRITER_V9_SPACE_MAX=200;
function writerV9SpacesMerge(settings){
 const raw=settings.v9Spaces&&typeof settings.v9Spaces==='object'&&!Array.isArray(settings.v9Spaces)?settings.v9Spaces:{};
 const cfg=settings.v9Spaces={enabled:false,spaces:[],...raw};
 cfg.enabled=cfg.enabled===true;
 cfg.spaces=Array.isArray(cfg.spaces)?cfg.spaces.map(writerV9SpaceSanitize).filter(Boolean).slice(0,40):[];
 const seen=new Set();
 cfg.spaces=cfg.spaces.filter(space=>{if(seen.has(space.id))return false;seen.add(space.id);return true;});
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
 return {id,name,folder,tag,property,value,groupBy,view,sort};
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
  if(space.folder&&!(file.path===space.folder||file.path.startsWith(space.folder+'/')))return false;
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
  const draft={name:'',folder:'',tag:'',property:'',value:'',groupBy:'status',view:'cards',sort:'recent',...(initial||{})};
  const root=modal.contentEl;
  const field=(key,pt,en)=>{
   new Setting(root).setName(writerUi(pt,en)).addText(t=>t
    .setValue(draft[key]||'').onChange(value=>{draft[key]=value;}));
  };
  field('name','Nome','Name');field('folder','Pasta (opcional)','Folder (optional)');
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
    plugin.settings.v9Spaces.spaces.push(space);currentId=space.id;await plugin.saveSettings();refresh();
   });
  });
  const space=plugin.settings.v9Spaces.spaces.find(s=>s.id===currentId);
  if(!space){root.createEl('p',{text:writerUi('Crie uma Space para agrupar notas por pasta, tag ou propriedade.','Create a Space to collect notes by folder, tag or property.')});return;}
  nav.createEl('button',{text:writerUi('Editar','Edit')}).addEventListener('click',()=>{
   writerV9SpaceEditor(plugin,space,async updated=>{
    const idx=plugin.settings.v9Spaces.spaces.findIndex(s=>s.id===space.id);
    if(idx>=0)plugin.settings.v9Spaces.spaces[idx]=updated;
    await plugin.saveSettings();refresh();
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
      currentId=plugin.settings.v9Spaces.spaces[0]?.id||'';
      await plugin.saveSettings();confirm.close();refresh();
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
function writerV9RegisterSpaces(plugin){
 plugin.writerV9SpaceOpen=()=>writerV9SpaceModal(plugin);
 plugin.addCommand({id:'v9-spaces-open',name:writerUi('Spaces: abrir coleções','Spaces: open collections'),
  callback:()=>writerV9SpaceModal(plugin)});
 plugin.registerEvent(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!writerModuleOn(plugin,'smartSpaces')||!plugin.settings.v9Spaces.enabled)return;
  if(file instanceof TFolder){
   menu.addItem(item=>item.setTitle(writerUi('Criar Space desta pasta','Create Space from folder'))
    .setIcon('layers').onClick(()=>{
     writerV9SpaceEditor(plugin,{folder:file.path,name:file.name,view:'cards'},async space=>{
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
 new Setting(panel).setName(writerUi('Abrir e organizar coleções','Open and manage collections'))
  .addButton(button=>button.setButtonText(writerUi('Abrir Spaces','Open Spaces')).onClick(()=>writerV9SpaceModal(plugin)));
}
