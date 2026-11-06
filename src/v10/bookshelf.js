'use strict';
/* v10 Longform bookshelf: local indices and covers, without a second book database. */
function writerV10BookshelfMerge(settings){
 const old=settings.v10Bookshelf&&typeof settings.v10Bookshelf==='object'?settings.v10Bookshelf:{};
 const cfg=settings.v10Bookshelf={enabled:true,showWidget:true,showProgress:true,sort:'title',density:'normal',library:{},standalone:[],...old};
 cfg.standalone=[...new Set((Array.isArray(cfg.standalone)?cfg.standalone:[]).filter(p=>typeof p==='string'&&p.endsWith('.md')).slice(0,500))];
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
function writerV109BookProgress(plugin,project,record){
 if(project.standalone)return record.status==='finished'?100:Math.max(0,Math.min(100,Number(project.meta?.readingProgress)||0));
 const scenes=typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[];
 if(!scenes.length)return record.status==='finished'?100:0;
 return Math.round(100*scenes.filter(scene=>/^(done|complete|completed|finished|conclu[ií]do)$/i.test(String(scene.status||scene.meta?.status||''))).length/scenes.length);
}
function writerV109StandaloneProject(plugin,file){
 const meta=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter||{};
 return {file,title:String(meta.title||file.basename),meta,scenes:[],standalone:true};
}
function writerV109BookDescription(project){return String(project.meta?.description||project.meta?.summary||project.meta?.sinopse||'').trim().slice(0,1400);}
function writerV109BookCopyright(project){return String(project.meta?.copyright||project.meta?.rights||'').trim().slice(0,400);}
function writerV10BookState(plugin,project){
 const meta=project.meta||{},existing=plugin.settings.v10Bookshelf?.library?.[project.file.path];
 const record=writerV10BookRecord(existing);
 if(!existing){
  record.shelf=String(meta.genre||meta.category||'').trim().slice(0,60);
  if(['planned','reading','paused','finished'].includes(String(meta.status||'')))record.status=meta.status;
  const fromMeta=Number(meta.readingProgress||meta.progress);
  if(Number.isFinite(fromMeta))record.progress=Math.max(0,Math.min(100,Math.round(fromMeta)));
 }
 record.progress=writerV109BookProgress(plugin,project,record);
 return record;
}
async function writerV10BookSaveState(plugin,project,record){
 const cfg=plugin.settings.v10Bookshelf;
 cfg.library[project.file.path]=writerV10BookRecord(record);
 await plugin.saveSettings();
}
function writerV10BookshelfProjects(plugin){
 const files=plugin.app.vault.getMarkdownFiles?.()||[];
 const longform=files.map(file=>typeof longformIndex==='function'?longformIndex(file,plugin.app):null).filter(Boolean);
 const indexed=new Set(longform.map(p=>p.file.path));
 const standalone=(plugin.settings.v10Bookshelf?.standalone||[])
  .filter(path=>!indexed.has(path)).map(path=>plugin.app.vault.getAbstractFileByPath(path))
  .filter(file=>file?.extension==='md').map(file=>writerV109StandaloneProject(plugin,file));
 return [...longform,...standalone];
}
function writerV10BookCover(plugin,project){
 const m=project.meta||{};
 const value=m.banner||m.cover||m.coverImage||m.image||'';
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
function writerV10BookFavoriteIcon(plugin){
 const configured=plugin.settings?.v92Explorer?.favoriteIcon;
 return typeof configured==='string'&&/^[a-z][a-z0-9-]{0,38}$/.test(configured)?configured:'star';
}
function writerV10BookshelfCard(plugin,parent,project,compact=false,redraw=()=>{}){
 const record=writerV10BookState(plugin,project);
 const card=parent.createDiv({cls:'writer-v10-book-card writer-v108-book-card'+(compact?' is-compact':'')});
 card.classList.toggle('is-favorite',record.favorite);
 const btn=card.createEl('button',{cls:'writer-v10-book'+(compact?' is-compact':''),attr:{
  type:'button','aria-label':writerUi('Abrir livro: ','Open book: ')+project.title
 }});
 const cover=btn.createDiv({cls:'writer-v10-book-cover'});
 const image=writerV10BookCover(plugin,project);
 if(image)cover.createEl('img',{attr:{src:image,alt:'',loading:'lazy',decoding:'async'}});
 else {const glyph=cover.createSpan();require('obsidian').setIcon?.(glyph,'book-open');}
 const data=btn.createDiv({cls:'writer-v10-book-info'});
 const title=data.createEl('strong',{cls:'writer-v108-book-title',text:project.title});
 const series=String(project.meta?.series||project.meta?.subtitle||'').slice(0,100);
 if(series&&!compact)data.createSpan({cls:'writer-v10-book-series',text:series});
 const counts=writerV10BookWordProgress(plugin,project);
 data.createSpan({cls:'writer-v10-book-count',text:project.standalone?writerUi('Nota única','Single note'):counts.chapters+' '+writerUi('capítulos','chapters')});
 if(plugin.settings.v10Bookshelf?.showProgress!==false){
  const reading=data.createDiv({cls:'writer-v108-book-progress'});
  reading.createSpan({text:writerUi('Leitura','Reading')});
  reading.createEl('strong',{text:record.progress+'%'});
  data.createEl('progress',{cls:'writer-v10-reading-progress',attr:{max:'100',value:String(record.progress),'aria-label':writerUi('Progresso de leitura','Reading progress')}});
 }
 btn.addEventListener('click',async()=>{
  if(project.standalone){await plugin.app.workspace.getLeaf('tab').openFile(project.file);return;}
  await plugin.openProjects('project');
  const view=plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.[0]?.view;
  if(view){view.selected=project.file.path;await view.render?.();}
 });
 if(!compact){
  const description=writerV109BookDescription(project),copyright=writerV109BookCopyright(project);
  if(description)card.createEl('p',{cls:'writer-v109-book-description',text:description});
  if(copyright)card.createEl('small',{cls:'writer-v109-book-copyright',text:copyright});
 }
 const favorite=card.createEl('button',{cls:'writer-v108-book-favorite',attr:{
  type:'button','aria-pressed':String(record.favorite),
  'aria-label':writerUi(record.favorite?'Remover livro dos favoritos':'Favoritar livro',
   record.favorite?'Remove book from favorites':'Favorite book'),
  title:writerUi(record.favorite?'Desfavoritar':'Favoritar',record.favorite?'Unfavorite':'Favorite')
 }});
 require('obsidian').setIcon?.(favorite,writerV10BookFavoriteIcon(plugin));
 favorite.addEventListener('click',async()=>{
  await writerV10BookSaveState(plugin,project,{...record,favorite:!record.favorite});
  redraw();
 });
 if(!compact){
  if(project.standalone){
   const remove=card.createEl('button',{cls:'writer-v109-book-remove',text:writerUi('Remover da biblioteca','Remove from library'),attr:{type:'button'}});
   remove.addEventListener('click',async()=>{
    plugin.settings.v10Bookshelf.standalone=plugin.settings.v10Bookshelf.standalone.filter(path=>path!==project.file.path);
    await plugin.saveSettings();redraw();
   });
  }
  const actions=card.createDiv({cls:'writer-v10-book-actions writer-v108-book-fields'});
  const field=(pt,en,kind)=>{const root=actions.createDiv({cls:'writer-v108-book-field writer-v108-book-field-'+kind});
   root.createSpan({text:writerUi(pt,en)});return root;};
  const statusField=field('Estado','Status','status');
  const stat=statusField.createEl('select',{attr:{'aria-label':writerUi('Estado da leitura','Reading status')}});
  for(const [value,pt,en] of [['planned','Planejado','Planned'],['reading','Lendo','Reading'],['paused','Pausado','Paused'],['finished','Concluído','Finished']]){
   const opt=stat.createEl('option',{text:writerUi(pt,en)});opt.value=value;
  }
  stat.value=record.status;
  stat.addEventListener('change',async()=>{
   await writerV10BookSaveState(plugin,project,{...record,status:stat.value});redraw();
  });
  const shelfField=field('Estante','Shelf','shelf');
  const shelf=shelfField.createEl('input',{attr:{type:'text',value:record.shelf,placeholder:writerUi('Gênero ou coleção','Genre or collection'),
   maxlength:'60','aria-label':writerUi('Estante deste livro','Book shelf')}});
  shelf.addEventListener('change',async()=>{
   await writerV10BookSaveState(plugin,project,{...record,shelf:shelf.value});redraw();
  });
 }
 return card;
}
function writerV10RenderBookshelf(plugin,target,opts={}){
 const config=plugin.settings.v10Bookshelf||{};
 const wrapper=target.createDiv({cls:'writer-v10-bookshelf'+(opts.compact?' is-widget':'')});
 const projects=writerV10BookshelfProjects(plugin);
 let sortMode=opts.sort||config.sort||'title';
 const summary=wrapper.createDiv({cls:'writer-v108-library-summary'});
 summary.createEl('p',{text:writerUi('Organize suas histórias, acompanhe o progresso e encontre o próximo capítulo.','Organize stories, track progress and find your next chapter.')});
 const toolbar=wrapper.createDiv({cls:'writer-v10-bookshelf-toolbar'});
 const count=toolbar.createSpan({text:projects.length+' '+writerUi('livros','books')});
 if(typeof writerV11OpenProject==='function')toolbar.createEl('button',{text:writerUi('Escrita contínua','Continuous writing'),attr:{type:'button'}})
  .addEventListener('click',()=>writerV11PickProject(plugin,p=>writerV11OpenProject(plugin,p)));
 toolbar.createEl('button',{text:writerUi('+ Adicionar livro','+ Add book'),attr:{type:'button'}})
  .addEventListener('click',()=>writerV109AddStandaloneBook(plugin,()=>{target.empty();writerV10RenderBookshelf(plugin,target,opts);}));

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
 modal.setTitle(writerUi('Biblioteca','Library'));
 modal.onOpen=()=>{modal.contentEl.empty();writerV10RenderBookshelf(plugin,modal.contentEl);};
 modal.open();
}
function writerV10RenderBookshelfWidget(view,parent){
 const plugin=view.plugin,wrapper=parent.createDiv({cls:'writer-v108-books-widget'});
 const toolbar=wrapper.createDiv({cls:'writer-v108-books-widget-toolbar'});
 const projects=writerV10BookshelfProjects(plugin);
 toolbar.createSpan({text:projects.length+' '+writerUi('livros','books')});
 toolbar.createEl('button',{text:writerUi('Ver biblioteca','View library'),attr:{type:'button'}})
  .addEventListener('click',()=>writerV10OpenBookshelf(plugin));
 if(!plugin.settings.v10Bookshelf?.enabled||!plugin.settings.v10Bookshelf?.showWidget){
  wrapper.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Ative a biblioteca nas configurações.','Enable bookshelf in settings.')});return;
 }
 if(!projects.length){
  wrapper.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Seus livros Longform aparecerão aqui.','Your Longform books will appear here.')});return;
 }
 const grid=wrapper.createDiv({cls:'writer-v108-books-widget-grid'});
 const books=projects.slice().sort((a,b)=>{
  const af=writerV10BookState(plugin,a).favorite,bf=writerV10BookState(plugin,b).favorite;
  return Number(bf)-Number(af)||(b.file.stat?.mtime||0)-(a.file.stat?.mtime||0);
 });
 for(const project of books.slice(0,4))writerV10BookshelfCard(plugin,grid,project,true,()=>view.render());
}
function writerV109AddStandaloneBook(plugin,done){
 const existing=new Set(plugin.settings.v10Bookshelf.standalone||[]);
 const indexed=new Set((plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>typeof longformIndex==='function'&&longformIndex(file,plugin.app)).map(f=>f.path));
 class BookNotePicker extends require('obsidian').FuzzySuggestModal{
  getItems(){return (plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>!indexed.has(file.path)&&!existing.has(file.path));}
  getItemText(file){return file.path;}
  onChooseItem(file){plugin.settings.v10Bookshelf.standalone=[...existing,file.path];void plugin.saveSettings().then(()=>done?.());}
 }
 const modal=new BookNotePicker(plugin.app);
 modal.setPlaceholder(writerUi('Buscar nota para adicionar à biblioteca…','Search a note to add to the library…'));
 modal.open();
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
 plugin.addCommand?.({id:'v109-add-book-note',name:writerUi('Biblioteca: adicionar nota como livro','Library: add note as book'),callback:()=>writerV109AddStandaloneBook(plugin,()=>writerV10OpenBookshelf(plugin))});
 // Keep bookshelf in the home widget and command palette, not as another ribbon entry.

}
function writerV10BookshelfSettings(plugin,panel){
 const cfg=plugin.settings.v10Bookshelf;
 panel.createEl('h3',{text:writerUi('Biblioteca','Library')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Projetos Longform e notas avulsas. Banner, descrição e copyright vêm do frontmatter; progresso automático.','Longform projects and standalone notes. Banner, description and copyright come from frontmatter; automatic progress.')});
 const toggle=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 toggle('enabled','Ativar biblioteca de livros','Enable bookshelf');
 toggle('showWidget','Permitir widget de livros na homepage','Allow bookshelf homepage widget');
 toggle('showProgress','Mostrar progresso automático','Show automatic progress');
 new Setting(panel).setName(writerUi('Ordem padrão','Default order')).addDropdown(d=>{
  for(const [value,pt,en] of [['title','Título','Title'],['recent','Atualização','Recent'],['chapters','Capítulos','Chapters'],['progress','Progresso','Progress'],['series','Série','Series']])d.addOption(value,writerUi(pt,en));
  d.setValue(cfg.sort||'title').onChange(async value=>{cfg.sort=value;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Biblioteca','Bookshelf')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV10OpenBookshelf(plugin)));
}
