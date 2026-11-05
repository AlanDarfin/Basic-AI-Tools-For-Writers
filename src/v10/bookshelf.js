'use strict';
/* v10 Longform bookshelf: local indices and covers, without a second book database. */
function writerV10BookshelfMerge(settings){
 const old=settings.v10Bookshelf&&typeof settings.v10Bookshelf==='object'?settings.v10Bookshelf:{};
 const cfg=settings.v10Bookshelf={enabled:true,showWidget:true,showProgress:true,sort:'title',density:'normal',library:{},singleNotes:[],readLocations:{},...old};
 cfg.sort=['title','recent','chapters','progress','series'].includes(cfg.sort)?cfg.sort:'title';
 cfg.density=['compact','normal'].includes(cfg.density)?cfg.density:'normal';
 cfg.singleNotes=Array.isArray(cfg.singleNotes)?[...new Set(cfg.singleNotes.filter(path=>typeof path==='string'&&path.endsWith('.md')&&path.length<500))].slice(0,500):[];
 cfg.readLocations=Object.fromEntries(Object.entries(cfg.readLocations&&typeof cfg.readLocations==='object'?cfg.readLocations:{})
  .slice(-3000).filter(([path])=>typeof path==='string'&&path.length<500).map(([path,value])=>[path,
   Math.max(0,Math.min(100,Math.round(Number(value)||0)))]));
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
 const vault=plugin.app.vault,cache=plugin.app.metadataCache;
 const projects=(vault.getMarkdownFiles?.()||[])
  .map(file=>typeof longformIndex==='function'?longformIndex(file,plugin.app):null).filter(Boolean);
 const indexed=new Set(projects.map(p=>p.file.path));
 // Standalone books are references to existing Markdown notes, not copied projects.
 for(const path of plugin.settings.v10Bookshelf?.singleNotes||[]){
  const file=vault.getAbstractFileByPath(path);
  if(!(file instanceof TFile)||file.extension!=='md'||indexed.has(file.path))continue;
  const front=cache?.getFileCache?.(file)?.frontmatter||{};
  const title=String(front.title||file.basename||'').trim().slice(0,160)||file.basename;
  projects.push({file,title,meta:front,scenes:[],singleNote:true});
  indexed.add(file.path);
 }
 return projects;
}
function writerV109BookMeta(plugin,project){
 const yaml=plugin.app.metadataCache?.getFileCache?.(project.file)?.frontmatter||{};
 return {...(project.meta||{}),...yaml};
}
function writerV10BookCover(plugin,project){
 const m=writerV109BookMeta(plugin,project);
 // banner has highest priority; linked local images and HTTPS work through the existing resolver.
 const raw=m.banner||m.cover||m.coverImage||m.image||'';
 const value=Array.isArray(raw)?raw[0]:raw;
 return typeof writerV9215PrettyImage==='function'?writerV9215PrettyImage(plugin.app,project.file,value):'';
}
function writerV10BookWordProgress(plugin,project){
 if(project.singleNote)return {chapters:1,completed:0};
 const entries=typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[];
 const completed=entries.filter(s=>/^(?:done|complete|completed|finished)$/i.test(String(s.status||''))).length;
 return {chapters:entries.length,completed};
}
function writerV109BookScenePath(scene){
 return String(scene?.path||scene?.file?.path||scene?.note||'');
}
function writerV109BookAutomaticProgress(plugin,project){
 const read=plugin.settings.v10Bookshelf?.readLocations||{};
 if(project.singleNote)return Math.max(0,Math.min(100,Math.round(Number(read[project.file.path])||0)));
 const scenes=typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[];
 if(!scenes.length)return 0;
 let completed=0;
 for(const scene of scenes){
  const status=String(scene.status||'').toLowerCase();
  const value=/^(done|complete|completed|finished)$/.test(status)?100:
   Math.max(0,Math.min(100,Number(read[writerV109BookScenePath(scene)])||0));
  completed+=value/100;
 }
 return Math.max(0,Math.min(100,Math.round(completed/scenes.length*100)));
}
function writerV109BookAutoStatus(progress){
 return progress>=100?'finished':progress>0?'reading':'planned';
}
function writerV109BookDescription(plugin,project){
 const meta=writerV109BookMeta(plugin,project);
 const raw=meta.description||meta.summary||meta.synopsis||'';
 return String(Array.isArray(raw)?raw.join(' '):raw).trim().slice(0,2800);
}
function writerV109BookCopyright(plugin,project){
 const meta=writerV109BookMeta(plugin,project);
 return String(meta.copyright||meta.rights||meta.license||'').trim().slice(0,420);
}
function writerV10BookshelfSort(projects,sort,plugin){
 const books=projects.slice();
 const title=(a,b)=>a.title.localeCompare(b.title,undefined,{sensitivity:'base'});
 if(sort==='recent')return books.sort((a,b)=>(b.file.stat?.mtime||0)-(a.file.stat?.mtime||0)||title(a,b));
 if(sort==='chapters')return books.sort((a,b)=>(b.scenes?.length||0)-(a.scenes?.length||0)||title(a,b));
 if(sort==='progress'&&plugin)return books.sort((a,b)=>writerV109BookAutomaticProgress(plugin,b)-writerV109BookAutomaticProgress(plugin,a)||title(a,b));
 if(sort==='series')return books.sort((a,b)=>String(a.meta?.series||'').localeCompare(String(b.meta?.series||''))||title(a,b));
 return books.sort(title);
}
function writerV10BookFavoriteIcon(plugin){
 const configured=plugin.settings?.v92Explorer?.favoriteIcon;
 return typeof configured==='string'&&/^[a-z][a-z0-9-]{0,38}$/.test(configured)?configured:'star';
}
function writerV10BookshelfCard(plugin,parent,project,compact=false,redraw=()=>{}){
 const record=writerV10BookState(plugin,project),percent=writerV109BookAutomaticProgress(plugin,project);
 const description=writerV109BookDescription(plugin,project),copyright=writerV109BookCopyright(plugin,project);
 const card=parent.createDiv({cls:'writer-v10-book-card writer-v108-book-card'+(compact?' is-compact':'')});
 card.classList.toggle('is-favorite',record.favorite);
 const button=card.createEl('button',{cls:'writer-v10-book'+(compact?' is-compact':''),attr:{
  type:'button','aria-label':writerUi('Abrir livro: ','Open book: ')+project.title
 }});
 const cover=button.createDiv({cls:'writer-v10-book-cover'}),image=writerV10BookCover(plugin,project);
 if(image)cover.createEl('img',{attr:{src:image,alt:'',loading:'lazy',decoding:'async'}});
 else{const glyph=cover.createSpan();require('obsidian').setIcon?.(glyph,'book-open');}
 const info=button.createDiv({cls:'writer-v10-book-info'});
 info.createEl('strong',{cls:'writer-v108-book-title',text:project.title});
 const meta=writerV109BookMeta(plugin,project);
 const series=String(meta.series||meta.subtitle||'').slice(0,100);
 if(series&&!compact)info.createSpan({cls:'writer-v10-book-series',text:series});
 const counts=writerV10BookWordProgress(plugin,project);
 info.createSpan({cls:'writer-v10-book-count',text:project.singleNote?writerUi('Nota única','Single note'):
  counts.chapters+' '+writerUi('capítulos','chapters')});
 if(plugin.settings.v10Bookshelf?.showProgress!==false){
  const reading=info.createDiv({cls:'writer-v108-book-progress'});
  reading.createSpan({text:writerUi('Leitura automática','Automatic reading progress')});
  reading.createEl('strong',{text:percent+'%'});
  info.createEl('progress',{cls:'writer-v10-reading-progress',attr:{max:'100',value:String(percent),
   'aria-label':writerUi('Progresso de leitura calculado','Calculated reading progress')}});
 }
 const open=async()=>{
  if(project.singleNote){
   await plugin.app.workspace.getLeaf('tab').openFile(project.file);
  }else{
   await plugin.openProjects('project');
   const view=plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.[0]?.view;
   if(view){view.selected=project.file.path;await view.render?.();}
  }
 };
 button.addEventListener('click',()=>void open());
 const favorite=card.createEl('button',{cls:'writer-v108-book-favorite',attr:{
  type:'button','aria-pressed':String(record.favorite),'aria-label':writerUi(
   record.favorite?'Remover livro dos favoritos':'Favoritar livro',
   record.favorite?'Remove book from favorites':'Favorite book')
 }});
 require('obsidian').setIcon?.(favorite,writerV10BookFavoriteIcon(plugin));
 favorite.addEventListener('click',async()=>{
  await writerV10BookSaveState(plugin,project,{...record,favorite:!record.favorite});redraw();
 });
 if(description){
  const excerpt=card.createDiv({cls:'writer-v109-book-description'});
  excerpt.createSpan({cls:'writer-v109-book-metadata-label',text:writerUi('Descrição','Description')});
  excerpt.createEl('p',{text:description});
 }
 if(copyright&&!compact){
  const rights=card.createDiv({cls:'writer-v109-book-copyright'});
  rights.createSpan({cls:'writer-v109-book-metadata-label',text:writerUi('Copyright','Copyright')});
  rights.createEl('small',{text:copyright});
 }
 if(!compact){
  const foot=card.createDiv({cls:'writer-v109-book-footer'});
  foot.createSpan({cls:'writer-v109-book-auto',text:writerUi(
   'Estado automático: ','Automatic status: ')+writerUi(
    writerV109BookAutoStatus(percent)==='finished'?'Concluído':writerV109BookAutoStatus(percent)==='reading'?'Lendo':'Planejado',
    writerV109BookAutoStatus(percent)==='finished'?'Finished':writerV109BookAutoStatus(percent)==='reading'?'Reading':'Planned')});
  if(project.singleNote){
   const remove=foot.createEl('button',{cls:'writer-v109-book-remove',attr:{
    type:'button','aria-label':writerUi('Retirar da biblioteca','Remove from bookshelf')}});
   require('obsidian').setIcon?.(remove,'book-minus');
   remove.addEventListener('click',()=>writerV109RemoveStandaloneBook(plugin,project.file.path,redraw));
  }
 }
 return card;
}
function writerV109RemoveStandaloneBook(plugin,path,redraw=()=>{}){
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Retirar livro da biblioteca?','Remove book from library?'));
 modal.onOpen=()=>{
  modal.contentEl.createEl('p',{text:writerUi(
   'Somente a referência na biblioteca será removida. A nota não será apagada.',
   'This removes only the library entry. Your note is not deleted.')});
  new Setting(modal.contentEl)
   .addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setButtonText(writerUi('Retirar','Remove')).setWarning().onClick(async()=>{
    plugin.settings.v10Bookshelf.singleNotes=plugin.settings.v10Bookshelf.singleNotes.filter(x=>x!==path);
    await plugin.saveSettings();modal.close();redraw();
   }));
 };
 modal.open();
}
function writerV109AddStandaloneBook(plugin,redraw=()=>{}){
 writerV109PickVaultPath(plugin,{kind:'note',placeholder:writerUi('Escolher nota para adicionar como livro…','Select a note as a book…'),
  onChoose:async file=>{
   const cfg=plugin.settings.v10Bookshelf;
   if(!cfg.singleNotes.includes(file.path))cfg.singleNotes.push(file.path);
   await plugin.saveSettings();redraw();
  }});
}
function writerV109BookRegisterProgress(plugin){
 const cfg=plugin.settings.v10Bookshelf;let timer=null,activePath='';
 const tracked=new Set();
 const refreshPaths=()=>{
  tracked.clear();
  for(const p of writerV10BookshelfProjects(plugin)){
   if(p.singleNote)tracked.add(p.file.path);
   else for(const scene of (typeof lfFlattenScenes==='function'?lfFlattenScenes(p.scenes):[]))
    tracked.add(writerV109BookScenePath(scene));
  }
 };
 const onScroll=event=>{
  const el=event.target;
  if(!el?.matches?.('.markdown-preview-view,.markdown-reading-view,.cm-scroller'))return;
  const file=plugin.app.workspace.getActiveFile?.();if(!(file instanceof TFile)||file.extension!=='md')return;
  if(activePath!==file.path){activePath=file.path;refreshPaths();}
  if(!tracked.has(file.path))return;
  const distance=Number(el.scrollHeight)-Number(el.clientHeight);
  if(distance<=10)return;
  const progress=Math.min(100,Math.max(0,Math.round(Number(el.scrollTop)/distance*100)));
  if(progress<1||progress<=Number(cfg.readLocations[file.path]||0))return;
  cfg.readLocations[file.path]=progress;
  clearTimeout(timer);timer=setTimeout(()=>void plugin.saveSettings().catch(error=>console.warn('[basic] reading:',error)),800);
 };
 const doc=plugin.app.workspace.containerEl?.ownerDocument||(typeof document!=='undefined'?document:null);
 if(doc)plugin.registerDomEvent?.(doc,'scroll',onScroll,true);
 plugin.registerEvent?.(plugin.app.vault.on('rename',()=>{activePath='';}));
 plugin.registerEvent?.(plugin.app.vault.on('delete',()=>{activePath='';}));
 plugin.register?.(()=>clearTimeout(timer));
}
function writerV10RenderBookshelf(plugin,target,opts={}){
 const config=plugin.settings.v10Bookshelf||{};
 const wrapper=target.createDiv({cls:'writer-v10-bookshelf'+(opts.compact?' is-widget':'')});
 const projects=writerV10BookshelfProjects(plugin);
 let sortMode=opts.sort||config.sort||'title';
 const summary=wrapper.createDiv({cls:'writer-v108-library-summary'});
 summary.createEl('p',{text:writerUi('Organize suas histórias, acompanhe o progresso e encontre o próximo capítulo.','Organize stories, track progress and find your next chapter.')});
 const toolbar=wrapper.createDiv({cls:'writer-v10-bookshelf-toolbar'});
 if(!opts.compact){
  const refresh=()=>{wrapper.remove();writerV10RenderBookshelf(plugin,target,opts);};
  toolbar.createEl('button',{cls:'writer-v109-add-book',text:writerUi('Adicionar livro','Add book'),attr:{type:'button'}})
   .addEventListener('click',()=>writerV109AddStandaloneBook(plugin,refresh));
 }
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
 const plugin=view.plugin,wrapper=parent.createDiv({cls:'writer-v108-books-widget'});
 const toolbar=wrapper.createDiv({cls:'writer-v108-books-widget-toolbar'});
 const projects=writerV10BookshelfProjects(plugin);
 toolbar.createSpan({text:projects.length+' '+writerUi('livros','books')});
 toolbar.createEl('button',{text:writerUi('Ver biblioteca','View library'),attr:{type:'button'}})
  .addEventListener('click',()=>writerV10OpenBookshelf(plugin));
 toolbar.createEl('button',{cls:'writer-v109-widget-add',text:writerUi('Adicionar','Add'),attr:{type:'button'}})
  .addEventListener('click',()=>writerV109AddStandaloneBook(plugin,()=>view.render()));
 if(!plugin.settings.v10Bookshelf?.enabled||!plugin.settings.v10Bookshelf?.showWidget){
  wrapper.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Ative a biblioteca nas configurações.','Enable bookshelf in settings.')});return;
 }
 if(!projects.length){
  wrapper.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Adicione uma nota como livro ou crie um projeto Longform.','Add a single note as a book or create a Longform project.')});return;
 }
 const grid=wrapper.createDiv({cls:'writer-v108-books-widget-grid'});
 const books=projects.slice().sort((a,b)=>{
  const af=writerV10BookState(plugin,a).favorite,bf=writerV10BookState(plugin,b).favorite;
  return Number(bf)-Number(af)||(b.file.stat?.mtime||0)-(a.file.stat?.mtime||0);
 });
 for(const project of books.slice(0,4))writerV10BookshelfCard(plugin,grid,project,true,()=>view.render());
}
function writerV10RegisterBookshelf(plugin){
 writerV109BookRegisterProgress(plugin);
 for(const name of ['bookshelf','writer-bookshelf']){
  plugin.registerMarkdownCodeBlockProcessor?.(name,(source,el)=>{
   if(!plugin.settings.v10Bookshelf?.enabled){el.createEl('pre',{text:source});return;}
   const compact=/^\s*(?:density|layout):\s*compact\s*$/mi.test(String(source||''));
   const sort=/^\s*sort:\s*(title|recent|chapters)\s*$/mi.exec(String(source||''))?.[1];
   writerV10RenderBookshelf(plugin,el,{compact,sort});
  });
 }
 plugin.addCommand?.({id:'v10-open-bookshelf',name:writerUi('Biblioteca: abrir livros','Bookshelf: open books'),callback:()=>writerV10OpenBookshelf(plugin)});
 plugin.addCommand?.({id:'v10-insert-bookshelf',name:writerUi('Longform: inserir bloco de livros','Longform: insert bookshelf block'),
  editorCallback:editor=>editor.replaceSelection('\n~~~bookshelf\nsort: title\nlayout: normal\n~~~\n')});
 plugin.writerV10OpenBookshelf=()=>writerV10OpenBookshelf(plugin);
 // Keep bookshelf in the home widget and command palette, not as another ribbon entry.
 // The library has one command; opening it already exposes the search input.

}
function writerV10BookshelfSettings(plugin,panel){
 const cfg=plugin.settings.v10Bookshelf;
 panel.createEl('h3',{text:writerUi('Biblioteca Longform','Longform bookshelf')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Projetos Longform ou notas individuais, com capa via banner e progresso automático de leitura.','Longform projects or individual notes, with banner cover and automatic reading progress.')});
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
