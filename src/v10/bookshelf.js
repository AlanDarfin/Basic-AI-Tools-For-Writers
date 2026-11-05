'use strict';
/* v10 Longform bookshelf: local indices and covers, without a second book database. */
function writerV10BookshelfMerge(settings){
 const old=settings.v10Bookshelf&&typeof settings.v10Bookshelf==='object'?settings.v10Bookshelf:{};
 const cfg=settings.v10Bookshelf={enabled:true,showWidget:true,showProgress:true,sort:'title',density:'normal',library:{},...old};
 cfg.sort=['title','recent','chapters','progress','series'].includes(cfg.sort)?cfg.sort:'title';
 cfg.density=['compact','normal'].includes(cfg.density)?cfg.density:'normal';
 const library=cfg.library&&typeof cfg.library==='object'&&!Array.isArray(cfg.library)?cfg.library:{};
 cfg.library=Object.fromEntries(Object.entries(library).slice(0,500).filter(([path])=>typeof path==='string'&&path.length<=500)
  .map(([path,item])=>[path,writerV10BookRecord(item)]));
 return cfg;
}
function writerV10BookRecord(raw){
 const r=raw&&typeof raw==='object'?raw:{};
 return {favorite:r.favorite===true,shelf:String(r.shelf||'').trim().slice(0,60),
  status:['planned','reading','paused','finished'].includes(r.status)?r.status:'planned',
  progress:Math.max(0,Math.min(100,Math.round(Number(r.progress)||0)))};
}
function writerV10BookState(plugin,project){
 const meta=project.meta||{},existing=plugin.settings.v10Bookshelf?.library?.[project.file.path];
 const record=writerV10BookRecord(existing);
 if(!existing){
  record.shelf=String(meta.genre||meta.category||'').trim().slice(0,60);
  if(['planned','reading','paused','finished'].includes(String(meta.status||'')))record.status=meta.status;
  const fromMeta=Number(meta.readingProgress||meta.progress);
  if(Number.isFinite(fromMeta))record.progress=Math.max(0,Math.min(100,Math.round(fromMeta)));
 }
 return record;
}
async function writerV10BookSaveState(plugin,project,record){
 const cfg=plugin.settings.v10Bookshelf;
 cfg.library[project.file.path]=writerV10BookRecord(record);
 await plugin.saveSettings();
}
function writerV10BookshelfProjects(plugin){
 return (plugin.app.vault.getMarkdownFiles?.()||[])
  .map(file=>typeof longformIndex==='function'?longformIndex(file,plugin.app):null).filter(Boolean);
}
function writerV10BookCover(plugin,project){
 const m=project.meta||{};
 const value=m.cover||m.coverImage||m.image||m.banner||'';
 return typeof writerV9215PrettyImage==='function'?writerV9215PrettyImage(plugin.app,project.file,value):'';
}
function writerV10BookWordProgress(plugin,project){
 const entries=typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[];
 const completed=entries.filter(s=>/^(?:done|complete|finished)$/i.test(String(s.status||''))).length;
 return {chapters:entries.length,completed};
}
function writerV10BookshelfSort(projects,sort,plugin){
 const books=projects.slice();
 const title=(a,b)=>a.title.localeCompare(b.title,undefined,{sensitivity:'base'});
 if(sort==='recent')return books.sort((a,b)=>(b.file.stat?.mtime||0)-(a.file.stat?.mtime||0)||title(a,b));
 if(sort==='chapters')return books.sort((a,b)=>(b.scenes?.length||0)-(a.scenes?.length||0)||title(a,b));
 if(sort==='progress'&&plugin)return books.sort((a,b)=>writerV10BookState(plugin,b).progress-writerV10BookState(plugin,a).progress||title(a,b));
 if(sort==='series')return books.sort((a,b)=>String(a.meta?.series||'').localeCompare(String(b.meta?.series||''))||title(a,b));
 return books.sort(title);
}
function writerV10BookshelfCard(plugin,parent,project,compact=false,redraw=()=>{}){
 const card=parent.createDiv({cls:'writer-v10-book-card'});
 const btn=card.createEl('button',{cls:'writer-v10-book'+(compact?' is-compact':''),
  attr:{type:'button','aria-label':writerUi('Abrir livro: ','Open book: ')+project.title}});
 const cover=btn.createDiv({cls:'writer-v10-book-cover'});
 const image=writerV10BookCover(plugin,project);
 if(image)cover.createEl('img',{attr:{src:image,alt:'',loading:'lazy',decoding:'async'}});
 else {const glyph=cover.createSpan();require('obsidian').setIcon?.(glyph,'book-open');}
 const data=btn.createDiv({cls:'writer-v10-book-info'});
 data.createEl('strong',{text:project.title});
 const series=String(project.meta?.series||project.meta?.subtitle||'').slice(0,100);
 if(series&&!compact)data.createSpan({cls:'writer-v10-book-series',text:series});
 const count=writerV10BookWordProgress(plugin,project),record=writerV10BookState(plugin,project);
 if(plugin.settings.v10Bookshelf?.showProgress!==false){
  data.createSpan({cls:'writer-v10-book-count',text:count.chapters+' '+writerUi('capítulos','chapters')+' · '+record.progress+'%'});
  const bar=data.createEl('progress',{cls:'writer-v10-reading-progress',attr:{max:'100',value:String(record.progress),'aria-label':writerUi('Progresso de leitura','Reading progress')}});
 }
 btn.addEventListener('click',async()=>{
  await plugin.openProjects('project');
  const view=plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.[0]?.view;
  if(view){view.selected=project.file.path;await view.render?.();}
 });
 const actions=card.createDiv({cls:'writer-v10-book-actions'});
 const favorite=actions.createEl('button',{attr:{type:'button','aria-pressed':String(record.favorite),
  'aria-label':writerUi('Favoritar livro','Favorite book')}});
 require('obsidian').setIcon?.(favorite,record.favorite?'star':'star-off');
 favorite.addEventListener('click',async()=>{
  await writerV10BookSaveState(plugin,project,{...record,favorite:!record.favorite});
  redraw();
 });
 if(!compact){
  const stat=actions.createEl('select',{attr:{'aria-label':writerUi('Estado da leitura','Reading status')}});
  for(const [value,pt,en] of [['planned','Planejado','Planned'],['reading','Lendo','Reading'],['paused','Pausado','Paused'],['finished','Concluído','Finished']]){
   const opt=stat.createEl('option',{text:writerUi(pt,en)});opt.value=value;
  }
  stat.value=record.status;
  stat.addEventListener('change',async()=>{const progress=stat.value==='finished'?100:record.progress;
   await writerV10BookSaveState(plugin,project,{...record,status:stat.value,progress});redraw();
  });
  const percent=actions.createEl('input',{attr:{type:'number',min:'0',max:'100',step:'5',value:String(record.progress),
   'aria-label':writerUi('Progresso de leitura em porcentagem','Reading progress percent')}});
  percent.addEventListener('change',async()=>{
   await writerV10BookSaveState(plugin,project,{...record,progress:Math.max(0,Math.min(100,Number(percent.value)||0))});redraw();
  });
  const shelf=actions.createEl('input',{attr:{type:'text',value:record.shelf,placeholder:writerUi('Estante / gênero','Shelf / genre'),
   maxlength:'60','aria-label':writerUi('Estante deste livro','Book shelf')}});
  shelf.addEventListener('change',async()=>{await writerV10BookSaveState(plugin,project,{...record,shelf:shelf.value});redraw();});
 }
 return card;
}
function writerV10RenderBookshelf(plugin,target,opts={}){
 const config=plugin.settings.v10Bookshelf||{};
 const wrapper=target.createDiv({cls:'writer-v10-bookshelf'+(opts.compact?' is-widget':'')});
 const projects=writerV10BookshelfProjects(plugin);
 let sortMode=opts.sort||config.sort||'title';
 if(!projects.length){
  wrapper.createEl('p',{cls:'setting-item-description',text:writerUi('Nenhum índice Longform encontrado. Crie um livro em Projetos.','No Longform indices found. Create a book in Projects.')});return wrapper;
 }
 const toolbar=wrapper.createDiv({cls:'writer-v10-bookshelf-toolbar'});
 const count=toolbar.createSpan({text:projects.length+' '+writerUi('livros','books')});
 const search=toolbar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar livros…','Search books…'),'aria-label':writerUi('Buscar livros','Search books')}});
 search.classList.add('writer-v1042-bookshelf-search');
 let onlyFavorites=false,statusFilter='',shelfFilter='',page=0;
 const shelfNames=[...new Set(projects.map(p=>writerV10BookState(plugin,p).shelf).filter(Boolean))].sort();
 if(!opts.compact){
  const sorting=toolbar.createEl('select',{cls:'writer-v1042-bookshelf-sort',
   attr:{'aria-label':writerUi('Ordenar livros','Sort books')}});
  for(const [key,pt,en] of [
   ['title','Título','Title'],['recent','Atualização','Recently updated'],
   ['chapters','Capítulos','Chapters'],['progress','Progresso','Progress'],
   ['series','Série','Series']]){
   const option=sorting.createEl('option',{text:writerUi(pt,en)});option.value=key;
  }
  sorting.value=sortMode;
  sorting.addEventListener('change',()=>{sortMode=sorting.value;page=0;draw();});
  const favorite=toolbar.createEl('button',{text:writerUi('Favoritos','Favorites'),attr:{type:'button','aria-pressed':'false'}});
  favorite.addEventListener('click',()=>{onlyFavorites=!onlyFavorites;favorite.setAttribute('aria-pressed',String(onlyFavorites));page=0;draw();});
  const status=toolbar.createEl('select',{attr:{'aria-label':writerUi('Filtrar estado de leitura','Filter reading status')}});
  for(const [key,pt,en] of [['','Todos os estados','All statuses'],['planned','Planejados','Planned'],['reading','Lendo','Reading'],['paused','Pausados','Paused'],['finished','Concluídos','Finished']]){
   const option=status.createEl('option',{text:writerUi(pt,en)});option.value=key;
  }
  status.addEventListener('change',()=>{statusFilter=status.value;page=0;draw();});
  const shelf=toolbar.createEl('select',{attr:{'aria-label':writerUi('Filtrar estante','Filter shelf')}});
  for(const value of ['',...shelfNames]){const opt=shelf.createEl('option',{text:value||writerUi('Todas as estantes','All shelves')});opt.value=value;}
  shelf.addEventListener('change',()=>{shelfFilter=shelf.value;page=0;draw();});
 }
 const grid=wrapper.createDiv({cls:'writer-v10-bookshelf-grid'});
 const pagination=wrapper.createDiv({cls:'writer-v10-bookshelf-pages'});
 const draw=()=>{
  grid.empty();pagination.empty();
  const query=search.value.trim().toLocaleLowerCase();
  const items=writerV10BookshelfSort([...projects],sortMode,plugin).filter(p=>{
   const record=writerV10BookState(plugin,p);
   return (!onlyFavorites||record.favorite)&&(!statusFilter||record.status===statusFilter)&&
    (!shelfFilter||record.shelf===shelfFilter)&&(!query||
     (p.title+' '+String(p.meta?.series||'')+' '+record.shelf).toLocaleLowerCase().includes(query));
  });
  count.setText(items.length+' '+writerUi('livros','books'));
  const size=opts.compact?8:30,maxPage=Math.max(0,Math.ceil(items.length/size)-1);
  page=Math.min(page,maxPage);
  for(const p of items.slice(page*size,page*size+size))writerV10BookshelfCard(plugin,grid,p,opts.compact,draw);
  if(!items.length)grid.createEl('p',{text:writerUi('Nenhum livro encontrado.','No books found.')});
  if(maxPage){
   const previous=pagination.createEl('button',{text:writerUi('Anterior','Previous')});previous.disabled=page===0;
   previous.addEventListener('click',()=>{page--;draw();});
   pagination.createSpan({text:(page+1)+' / '+(maxPage+1)});
   const next=pagination.createEl('button',{text:writerUi('Próxima','Next')});next.disabled=page>=maxPage;
   next.addEventListener('click',()=>{page++;draw();});
  }
 };
 search.addEventListener('input',()=>{page=0;draw();});draw();
 return wrapper;
}
function writerV10OpenBookshelf(plugin){
 const modal=new Modal(plugin.app);
 modal.modalEl?.classList?.add('writer-v1042-bookshelf-modal');
 modal.setTitle(writerUi('Biblioteca Longform','Longform bookshelf'));
 modal.onOpen=()=>{modal.contentEl.empty();writerV10RenderBookshelf(plugin,modal.contentEl);};
 modal.open();
}
function writerV10RenderBookshelfWidget(view,parent){
 const plugin=view.plugin;
 if(!plugin.settings.v10Bookshelf?.enabled||!plugin.settings.v10Bookshelf?.showWidget){
  parent.createEl('p',{text:writerUi('Ative a biblioteca nas configurações.','Enable bookshelf in settings.')});return;
 }
 const header=parent.createDiv({cls:'writer-v10-widget-header'});
 const b=header.createEl('button',{text:writerUi('Abrir biblioteca','Open bookshelf'),attr:{type:'button'}});
 b.addEventListener('click',()=>writerV10OpenBookshelf(plugin));
 writerV10RenderBookshelf(plugin,parent,{compact:true});
}
function writerV10RegisterBookshelf(plugin){
 for(const name of ['bookshelf','writer-bookshelf']){
  plugin.registerMarkdownCodeBlockProcessor?.(name,(source,el)=>{
   if(!plugin.settings.v10Bookshelf?.enabled){el.createEl('pre',{text:source});return;}
   const compact=/^\s*(?:density|layout):\s*compact\s*$/mi.test(String(source||''));
   const sort=/^\s*sort:\s*(title|recent|chapters)\s*$/mi.exec(String(source||''))?.[1];
   writerV10RenderBookshelf(plugin,el,{compact,sort});
  });
 }
 plugin.addCommand?.({id:'v10-open-bookshelf',name:writerUi('Longform: abrir biblioteca de livros','Longform: open bookshelf'),callback:()=>writerV10OpenBookshelf(plugin)});
 plugin.addCommand?.({id:'v10-insert-bookshelf',name:writerUi('Longform: inserir bloco de livros','Longform: insert bookshelf block'),
  editorCallback:editor=>editor.replaceSelection('\n~~~bookshelf\nsort: title\nlayout: normal\n~~~\n')});
 plugin.writerV10OpenBookshelf=()=>writerV10OpenBookshelf(plugin);
 // Keep bookshelf in the home widget and command palette, not as another ribbon entry.
 plugin.addCommand?.({id:'v1042-bookshelf-search',name:writerUi('Biblioteca: buscar livros','Bookshelf: search books'),
  callback:()=>writerV10OpenBookshelf(plugin)});

}
function writerV10BookshelfSettings(plugin,panel){
 const cfg=plugin.settings.v10Bookshelf;
 panel.createEl('h3',{text:writerUi('Biblioteca Longform','Longform bookshelf')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('As capas e capítulos vêm dos índices Longform existentes. Nada é movido ou duplicado.','Covers and chapters come from existing Longform indices. No notes are moved or duplicated.')});
 const toggle=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 toggle('enabled','Ativar biblioteca de livros','Enable bookshelf');
 toggle('showWidget','Permitir widget de livros na homepage','Allow bookshelf homepage widget');
 toggle('showProgress','Mostrar contagem de capítulos','Show chapter count');
 new Setting(panel).setName(writerUi('Ordem padrão','Default order')).addDropdown(d=>{
  for(const [value,pt,en] of [['title','Título','Title'],['recent','Atualização','Recent'],['chapters','Capítulos','Chapters'],['progress','Progresso','Progress'],['series','Série','Series']])d.addOption(value,writerUi(pt,en));
  d.setValue(cfg.sort||'title').onChange(async value=>{cfg.sort=value;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Biblioteca','Bookshelf')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV10OpenBookshelf(plugin)));
}
