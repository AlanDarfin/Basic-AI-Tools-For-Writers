'use strict';
/* v10 Longform bookshelf: local indices and covers, without a second book database. */
function writerV10BookshelfMerge(settings){
 const old=settings.v10Bookshelf&&typeof settings.v10Bookshelf==='object'?settings.v10Bookshelf:{};
 const cfg=settings.v10Bookshelf={enabled:true,showWidget:true,showProgress:true,sort:'title',density:'normal',...old};
 cfg.sort=['title','recent','chapters'].includes(cfg.sort)?cfg.sort:'title';
 cfg.density=['compact','normal'].includes(cfg.density)?cfg.density:'normal';
 return cfg;
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
function writerV10BookshelfSort(projects,sort){
 const books=projects.slice();
 const title=(a,b)=>a.title.localeCompare(b.title,undefined,{sensitivity:'base'});
 if(sort==='recent')return books.sort((a,b)=>(b.file.stat?.mtime||0)-(a.file.stat?.mtime||0)||title(a,b));
 if(sort==='chapters')return books.sort((a,b)=>(b.scenes?.length||0)-(a.scenes?.length||0)||title(a,b));
 return books.sort(title);
}
function writerV10BookshelfCard(plugin,parent,project,compact=false){
 const btn=parent.createEl('button',{cls:'writer-v10-book'+(compact?' is-compact':''),
  attr:{type:'button','aria-label':writerUi('Abrir livro: ','Open book: ')+project.title}});
 const cover=btn.createDiv({cls:'writer-v10-book-cover'});
 const image=writerV10BookCover(plugin,project);
 if(image)cover.createEl('img',{attr:{src:image,alt:'',loading:'lazy',decoding:'async'}});
 else {const glyph=cover.createSpan();require('obsidian').setIcon?.(glyph,'book-open');}
 const data=btn.createDiv({cls:'writer-v10-book-info'});
 data.createEl('strong',{text:project.title});
 const series=String(project.meta?.series||project.meta?.subtitle||'').slice(0,100);
 if(series&&!compact)data.createSpan({cls:'writer-v10-book-series',text:series});
 const progress=writerV10BookWordProgress(plugin,project);
 if(plugin.settings.v10Bookshelf?.showProgress!==false)
  data.createSpan({cls:'writer-v10-book-count',text:progress.chapters+' '+writerUi('capítulos','chapters')});
 btn.addEventListener('click',async()=>{
  await plugin.openProjects('project');
  const view=plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.[0]?.view;
  if(view){view.selected=project.file.path;await view.render?.();}
 });
 return btn;
}
function writerV10RenderBookshelf(plugin,target,opts={}){
 const config=plugin.settings.v10Bookshelf||{};
 const wrapper=target.createDiv({cls:'writer-v10-bookshelf'+(opts.compact?' is-widget':'')});
 const projects=writerV10BookshelfSort(writerV10BookshelfProjects(plugin),opts.sort||config.sort);
 if(!projects.length){
  wrapper.createEl('p',{cls:'setting-item-description',text:writerUi('Nenhum índice Longform encontrado. Crie um livro em Projetos.','No Longform indices found. Create a book in Projects.')});
  return wrapper;
 }
 const toolbar=wrapper.createDiv({cls:'writer-v10-bookshelf-toolbar'});
 const count=toolbar.createSpan({text:projects.length+' '+writerUi('livros','books')});
 const search=toolbar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar livros…','Search books…'),'aria-label':writerUi('Buscar livros','Search books')}});
 if(opts.compact)search.setAttribute('aria-label',writerUi('Filtrar livros do widget','Filter widget books'));
 const grid=wrapper.createDiv({cls:'writer-v10-bookshelf-grid'});
 const draw=()=>{
  grid.empty();
  const q=search.value.trim().toLocaleLowerCase();
  const list=projects.filter(p=>p.title.toLocaleLowerCase().includes(q)||
   String(p.meta?.series||'').toLocaleLowerCase().includes(q)).slice(0,opts.compact?8:120);
  count.setText(list.length+' '+writerUi('livros','books'));
  for(const p of list)writerV10BookshelfCard(plugin,grid,p,opts.compact);
  if(!list.length)grid.createEl('p',{text:writerUi('Nenhum livro encontrado.','No books found.')});
 };
 search.addEventListener('input',draw);draw();
 return wrapper;
}
function writerV10OpenBookshelf(plugin){
 const modal=new Modal(plugin.app);
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
  for(const [value,pt,en] of [['title','Título','Title'],['recent','Atualização','Recent'],['chapters','Capítulos','Chapters']])d.addOption(value,writerUi(pt,en));
  d.setValue(cfg.sort||'title').onChange(async value=>{cfg.sort=value;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Biblioteca','Bookshelf')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV10OpenBookshelf(plugin)));
}
