'use strict';
/* Lightweight local-first writing dashboard, inspired by Harbor Tab + Genkan. */
const WRITER_V8_HOME_VIEW='writer-writing-home';
const WRITER_V8_HOME_SECTIONS=['calendar','soundscape','continue','recent','favorites','quick','stats','activity','random','tags','goal','gallery','quotes','today'];
const WRITER_V8_HOME_ORIGINAL_QUOTES=[
 ['Cada parágrafo é uma porta para uma história que ainda não existe.',''],
 ['Uma boa ideia cresce quando ganha espaço na página.',''],
 ['Escreva primeiro. Descubra o caminho durante a revisão.',''],
 ['Histórias se constroem uma palavra de cada vez.',''],
 ['Às vezes uma cena pequena muda o rumo de um livro inteiro.',''],
 ['O próximo capítulo começa com uma única linha.','']
];
function writerV8HomeQuoteChoices(value){
 const lines=String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,80);
 const choices=lines.map(line=>{
  const parts=line.split(/\s+\|\s+/);
  return [String(parts[0]||'').slice(0,440),String(parts.slice(1).join(' | ')||'').slice(0,80)];
 }).filter(row=>row[0]);
 return choices.length?choices:WRITER_V8_HOME_ORIGINAL_QUOTES;
}
function writerV8HomePick(items,previous=''){
 if(!Array.isArray(items)||!items.length)return null;
 if(items.length===1)return items[0];
 const others=items.filter(item=>(typeof item==='string'?item:item?.path||item?.[0])!==previous);
 return (others.length?others:items)[Math.floor(Math.random()*(others.length?others:items).length)];
}
const WRITER_V8_HOME_CATALOG={
 calendar:['calendar-days','Relógio e calendário','Clock and calendar','Mês atual e acesso à agenda','Current month and calendar'],
 soundscape:['headphones','Rádio de escrita','Writing radio','Rádios e música local no computador','Desktop radio and local music'],
 continue:['book-open','Continuar escrevendo','Continue writing','Retome seu projeto','Resume your project'],
 recent:['history','Notas recentes','Recent notes','Últimas notas editadas','Recently edited notes'],
 favorites:['star','Favoritos','Favorites','Notas fixadas por você','Your starred notes'],
 quick:['notebook-pen','Rascunhos rápidos','Quick drafts','Três rascunhos locais','Three local draft pads'],
 stats:['chart-no-axes-column','Resumo do cofre','Vault summary','Quantidade de notas e atividade','Note counts and activity'],
 activity:['chart-column','Atividade semanal','Weekly activity','Notas modificadas nos últimos sete dias','Notes modified in the last seven days'],
 random:['shuffle','Nota surpresa','Surprise note','Descubra uma nota aleatória do cofre','Discover a random vault note'],
 tags:['tags','Tags frequentes','Popular tags','Tags mais usadas nas notas','Most-used note tags'],
 goal:['target','Meta de palavras','Word target','Progresso de uma nota recente','Progress for a recent note'],
 gallery:['images','Galeria do cofre','Vault gallery','Foto aleatória dos arquivos locais','A random image from your local vault'],
 quotes:['quote','Citação do dia','Random quote','Citação diferente ao abrir a homepage','A fresh quote every time you open home'],
 today:['calendar-check','Editadas hoje','Edited today','Notas modificadas durante o dia','Notes modified today']
};
function writerV8HomeSearch(files,query,cache,max=12){
 if(typeof writerV83FuzzySearch==='function')return writerV83FuzzySearch(files,query,cache,max);
 const q=String(query||'').trim().toLocaleLowerCase();
 if(!q)return [];
 return files.filter(file=>String(file.basename||'').toLocaleLowerCase().includes(q)||
  String(file.path||'').toLocaleLowerCase().includes(q)||
  (cache?.getFileCache?.(file)?.headings||[]).some(h=>String(h.heading||'').toLocaleLowerCase().includes(q))).slice(0,max);
}
function writerV8HomeTopFiles(plugin,count=12){
 const recent=plugin.settings.v8Finish?.homeRecent||[];
 const used=new Set();
 const paths=recent.map(path=>plugin.app.vault.getAbstractFileByPath(path))
  .filter(f=>{if(!(f instanceof TFile)||f.extension!=='md'||used.has(f.path))return false;used.add(f.path);return true;});
 const seen=new Set(paths.map(f=>f.path));
 const last=plugin.app.vault.getMarkdownFiles?.().slice().sort((a,b)=>(b.stat?.mtime||0)-(a.stat?.mtime||0))||[];
 for(const file of last){if(paths.length>=count)break;if(!seen.has(file.path)){paths.push(file);seen.add(file.path);}}
 return paths.slice(0,count);
}
function writerV8HomeStats(plugin){
 const files=plugin.app.vault.getMarkdownFiles?.()||[];
 const since=Date.now()-7*86400000;
 return {notes:files.length,recent:files.filter(f=>(f.stat?.mtime||0)>=since).length,
  projects:plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.length||0};
}
class WriterV8HomeView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.disposed=false;this.saveTimer=null;}
 getViewType(){return WRITER_V8_HOME_VIEW;}
 getDisplayText(){return String(this.plugin.settings?.v8Finish?.homeTitle||'').trim()||writerUi('Início · Escrita','Home · Writing');}
 getIcon(){return writerV8HomeIconName(this.plugin.settings?.v8Finish?.homeIcon);}
 async onOpen(){this.disposed=false;this.homeQuote=null;this.homeQuotePrevious='';this.homeGalleryImage=null;this.render();this.writerV8ClockTimer=setInterval(()=>{if(!this.disposed)this.writerV8ClockRefresh?.();},1000);}
 async onClose(){this.disposed=true;clearInterval(this.writerV8ClockTimer);this.writerV8ClockTimer=null;this.writerV8ClockRefresh=null;const unsaved=!!this.saveTimer;clearTimeout(this.saveTimer);this.saveTimer=null;if(unsaved)await this.plugin.saveSettings();}
 saveSoon(){
  clearTimeout(this.saveTimer);
  this.saveTimer=setTimeout(()=>{this.saveTimer=null;void this.plugin.saveSettings().catch(e=>console.warn('[Basic AI] homepage settings:',e));},600);
 }
 openFile(file){
  if(!(file instanceof TFile))return;
  const leaf=this.app.workspace.getLeaf?.('tab')||this.app.workspace.getLeaf?.(true);
  if(leaf)void leaf.openFile(file);
 }
 render(){
  if(this.disposed)return;
  const scroll=this.contentEl.scrollTop||0;
  this.writerV8ClockRefresh=null;
  this.contentEl.empty();this.contentEl.addClass('writer-v8-home');
  const cfg=this.plugin.settings.v8Finish;
  // Heading first, followed by a full-width search and evenly spaced actions.
  const hero=this.contentEl.createDiv({cls:'writer-v8-home-hero'});
  const heading=hero.createDiv({cls:'writer-v8-home-heading'});
  heading.style.setProperty('--writer-v8-home-title-color',writerV9SafeHex(cfg.homeTitleColor)||'var(--interactive-accent)');
  heading.style.setProperty('--writer-v8-home-icon-color',writerV9SafeHex(cfg.homeIconColor)||'var(--interactive-accent)');
  const icon=heading.createSpan({cls:'writer-v8-home-title-icon'});
  const setIcon=require('obsidian').setIcon;
  const image=writerV8HomeImageURL(this.plugin,cfg.homeIconImage);
  if(image)icon.createEl('img',{attr:{src:image,alt:'',loading:'lazy'}});
  else if(typeof setIcon==='function')setIcon(icon,writerV8HomeIconName(cfg.homeIcon));
  heading.createEl('h2',{text:String(cfg.homeTitle||'').trim()||writerUi('Seu espaço de escrita','Your writing space')});
  const top=this.contentEl.createDiv({cls:'writer-v8-home-search-region'});
  this.renderSearch(top);
  const commands=this.contentEl.createDiv({cls:'writer-v8-home-quick-actions',
   attr:{role:'group','aria-label':writerUi('Ações rápidas','Quick actions')}});
  const action=(pt,en,icon,run)=>{
   const b=commands.createEl('button',{cls:'writer-v8-home-action',attr:{type:'button'}});
   const label=b.createSpan({cls:'writer-v8-home-action-icon'});
   const setIcon=require('obsidian').setIcon;
   if(typeof setIcon==='function')setIcon(label,icon);
   b.createSpan({text:writerUi(pt,en)});
   b.addEventListener('click',run);
  };
  action('Projetos','Projects','notebook-pen',()=>this.plugin.openProjects());
  action('Continuar livro','Continue book','book-open',()=>this.plugin.openProjects('structure'));
  action('Nova cena','New scene','file-plus',async()=>{
   await this.plugin.openProjects('scenes');
   const v=this.app.workspace.getLeavesOfType(PROJECT_VIEW)[0]?.view;
   if(v?.currentProject)v.addScene(v.currentProject);
  });
  action('Revisão','Review','spell-check',()=>this.plugin.openReview());
  action('Calendário','Calendar','calendar-days',()=>void this.plugin.writerCalendarOpen?.());
  action('Estudos','Study','graduation-cap',()=>void this.plugin.writerStudyOpen?.());
  const toolbar=this.contentEl.createDiv({cls:'writer-v903-widgets-toolbar'});
  toolbar.createEl('strong',{text:writerUi('Meu painel','My dashboard')});
  const add=toolbar.createEl('button',{cls:'writer-v903-widget-add',attr:{type:'button'}});
  require('obsidian').setIcon?.(add.createSpan({cls:'writer-v903-button-icon'}),'plus');
  add.createSpan({text:writerUi('Adicionar widgets','Add widgets')});
  add.addEventListener('click',()=>this.manageWidgets());
  const grid=this.contentEl.createDiv({cls:'writer-v8-home-grid'});
  const cards={
   calendar:()=>this.renderCalendarWidget(grid),
   soundscape:()=>writerV91HomeSoundscape(this,grid),
   continue:()=>this.renderContinue(grid),
   recent:()=>this.renderFiles(grid,'recent'),
   favorites:()=>this.renderFiles(grid,'favorites'),
   quick:()=>this.renderQuick(grid),
   stats:()=>this.renderStats(grid),
   activity:()=>this.renderActivity(grid),
   random:()=>this.renderRandom(grid),
   tags:()=>this.renderTags(grid),
   goal:()=>this.renderGoal(grid),
   gallery:()=>this.renderGallery(grid),
   quotes:()=>this.renderQuotes(grid),
   today:()=>this.renderToday(grid)
  };
  for(const key of cfg.homeOrder){
   if(WRITER_V8_HOME_SECTIONS.includes(key)&&!cfg.homeHidden.includes(key))cards[key]?.();
  }
  if(!grid.children.length){
   const empty=grid.createDiv({cls:'writer-v903-widgets-empty'});
   empty.createEl('p',{text:writerUi('Sua homepage está vazia. Adicione widgets para começar.','Your dashboard is empty. Add some widgets to get started.')});
   const restore=empty.createEl('button',{text:writerUi('Adicionar widgets','Add widgets')});
   restore.addEventListener('click',()=>this.manageWidgets());
  }
  this.contentEl.scrollTop=scroll;
 }
 setWidgetVisible(key,visible){
  const cfg=this.plugin.settings.v8Finish;
  if(!WRITER_V8_HOME_SECTIONS.includes(key))return;
  cfg.homeHidden=cfg.homeHidden.filter(id=>id!==key);
  if(!visible)cfg.homeHidden.push(key);
  this.saveSoon();this.render();
 }
 moveWidget(key,direction){
  const cfg=this.plugin.settings.v8Finish,order=cfg.homeOrder;
  const visible=order.filter(id=>WRITER_V8_HOME_SECTIONS.includes(id)&&!cfg.homeHidden.includes(id));
  const index=visible.indexOf(key),other=visible[index+direction];
  if(index<0||!other)return;
  const a=order.indexOf(key),b=order.indexOf(other);
  [order[a],order[b]]=[order[b],order[a]];
  this.saveSoon();this.render();
 }
 widgetControls(parent,key){
  const actions=parent.createDiv({cls:'writer-v8-home-card-order writer-v903-widget-controls'});
  const visible=this.plugin.settings.v8Finish.homeOrder.filter(id=>!this.plugin.settings.v8Finish.homeHidden.includes(id));
  for(const [direction,icon,pt,en] of [[-1,'arrow-up','Mover para cima','Move earlier'],[1,'arrow-down','Mover para baixo','Move later']]){
   const button=actions.createEl('button',{attr:{type:'button',title:writerUi(pt,en),'aria-label':writerUi(pt,en)}});
   button.disabled=visible.indexOf(key)+direction<0||visible.indexOf(key)+direction>=visible.length;
   require('obsidian').setIcon?.(button,icon);
   button.addEventListener('click',()=>this.moveWidget(key,direction));
  }
  const remove=actions.createEl('button',{cls:'writer-v903-widget-remove',attr:{type:'button',title:writerUi('Remover widget','Remove widget'),'aria-label':writerUi('Remover widget: ','Remove widget: ')+writerUi(WRITER_V8_HOME_CATALOG[key][1],WRITER_V8_HOME_CATALOG[key][2])}});
  require('obsidian').setIcon?.(remove,'x');
  remove.addEventListener('click',()=>this.setWidgetVisible(key,false));
  return actions;
 }
 manageWidgets(){
  const view=this,plugin=this.plugin,ModalClass=require('obsidian').Modal;
  const modal=new ModalClass(this.app);
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Widgets da homepage','Homepage widgets'));
   const root=modal.contentEl;
   root.empty();root.addClass('writer-v903-widget-gallery');
   root.createEl('p',{cls:'setting-item-description',text:writerUi('Ative ou oculte painéis. Os que estiverem ativos podem ser reorganizados pelos botões de seta.','Show or hide panels. Reorder visible widgets with their arrow controls.')});
   for(const key of WRITER_V8_HOME_SECTIONS){
    const meta=WRITER_V8_HOME_CATALOG[key],item=root.createDiv({cls:'writer-v903-gallery-item'});
    const glyph=item.createSpan({cls:'writer-v903-gallery-icon'});
    require('obsidian').setIcon?.(glyph,meta[0]);
    const summary=item.createDiv({cls:'writer-v903-gallery-description'});
    summary.createEl('strong',{text:writerUi(meta[1],meta[2])});
    summary.createEl('small',{text:writerUi(meta[3],meta[4])});
    const hidden=plugin.settings.v8Finish.homeHidden.includes(key);
    const button=item.createEl('button',{cls:'writer-v903-gallery-toggle',text:hidden?writerUi('Adicionar','Add'):writerUi('Remover','Remove'),attr:{type:'button','aria-pressed':String(!hidden)}});
    button.addEventListener('click',()=>{
     const visible=plugin.settings.v8Finish.homeHidden.includes(key);
     view.setWidgetVisible(key,visible);
     button.setText(visible?writerUi('Remover','Remove'):writerUi('Adicionar','Add'));
     button.setAttribute('aria-pressed',String(visible));
    });
   }
  };
  modal.open();
 }
 card(parent,key,pt,en){
  const section=parent.createDiv({cls:'writer-v8-home-card writer-v903-widget',attr:{'data-section':key,role:'region','aria-label':writerUi(pt,en)}});
  const top=section.createDiv({cls:'writer-v8-home-card-header'});
  if(key==='search'){top.createEl('h3',{text:writerUi(pt,en)});return section;}
  const heading=top.createDiv({cls:'writer-v903-widget-heading'});
  const symbol=heading.createSpan({cls:'writer-v903-widget-icon'});
  require('obsidian').setIcon?.(symbol,WRITER_V8_HOME_CATALOG[key]?.[0]||'layout-dashboard');
  heading.createEl('h3',{text:writerUi(pt,en)});
  this.widgetControls(top,key);
  return section;
 }
 renderCalendarWidget(parent){
  const shell=parent.createDiv({cls:'writer-v903-calendar-widget',attr:{'data-section':'calendar',role:'region','aria-label':writerUi('Relógio e calendário','Clock and calendar')}});
  const hover=shell.createDiv({cls:'writer-v903-calendar-controls'});
  const heading=hover.createDiv({cls:'writer-v903-widget-heading'});
  const icon=heading.createSpan({cls:'writer-v903-widget-icon'});
  require('obsidian').setIcon?.(icon,'calendar-days');
  heading.createEl('h3',{text:writerUi('Relógio e calendário','Clock and calendar')});
  this.widgetControls(hover,'calendar');
  const schedule=shell.createDiv({cls:'writer-v8-home-clock-card'});
  writerV8HomeRenderCalendar(this,schedule);
 }
 renderContinue(parent){
  const box=this.card(parent,'continue','Continuar escrevendo','Continue writing');
  const path=this.plugin.settings.lastLongformProject||'';
  if(path)box.createEl('p',{text:String(path).split('/').pop().replace(/\.md$/,'').slice(0,100),cls:'writer-v8-home-muted'});
  box.createEl('button',{text:writerUi('Abrir estrutura do livro','Open book structure')})
   .addEventListener('click',()=>this.plugin.openProjects('structure'));
  box.createEl('button',{text:writerUi('Abrir quadro de cenas','Open scene board')})
   .addEventListener('click',()=>this.plugin.openProjects('board'));
 }
 renderSearch(parent){
  const box=this.card(parent,'search','Buscar no cofre','Search vault');
  box.addClass('writer-v901-home-search-card');
  const input=box.createEl('input',{cls:'writer-v8-home-search',attr:{type:'search',placeholder:writerUi('Pesquisar notas por nome, caminho ou conteúdo indexado…','Find notes by name, path or indexed content…'),'aria-label':writerUi('Buscar notas','Search notes'),autocomplete:'off'}});
  const results=box.createDiv({cls:'writer-v8-home-file-list writer-v901-home-search-results',attr:{role:'list','aria-label':writerUi('Notas encontradas','Matching notes')}});
  const status=box.createDiv({cls:'writer-v901-home-search-status',attr:{role:'status','aria-live':'polite','aria-atomic':'true'}});
  const files=this.app.vault.getMarkdownFiles?.()||[];
  let matches=[],selected=0;
  const select=(index,scroll=false)=>{
   if(!matches.length)return;
   selected=(index+matches.length)%matches.length;
   for(const [i,row] of [...results.children].entries()){
    row.classList.toggle('is-selected',i===selected);
    row.setAttribute('aria-current',String(i===selected));
   }
   const target=results.children[selected];
   if(scroll)target?.scrollIntoView?.({block:'nearest'});
   const file=matches[selected];
   status.setText(writerUi('Selecionada ','Selected ')+(selected+1)+' / '+matches.length+' · '+file.path+' · '+writerUi('Enter para abrir','Enter to open'));
  };
  const draw=(preserve=false)=>{
   const previous=preserve?matches[selected]?.path:'';
   results.empty();results.hidden=true;status.hidden=true;
   const q=input.value.trim();
   if(!q){matches=[];selected=0;return;}
   matches=writerV8HomeSearch(files,q,this.app.metadataCache,12);
   if(previous)selected=Math.max(0,matches.findIndex(file=>file.path===previous));
   else selected=0;
   results.hidden=false;status.hidden=false;
   if(!matches.length){
    results.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Nenhuma nota encontrada.','No matching notes.')});
    status.setText(writerUi('Tente outro termo.','Try another search term.'));
    return;
   }
   for(const [index,file] of matches.entries()){
    const row=results.createDiv({cls:'writer-v8-home-file-row writer-v901-home-result',attr:{role:'listitem',title:file.path}});
    const open=row.createEl('button',{cls:'writer-v8-home-file-link writer-v901-home-result-open',attr:{type:'button',title:file.path,'aria-label':writerUi('Abrir nota: ','Open note: ')+file.path}});
    const glyph=open.createSpan({cls:'writer-v901-home-result-icon',attr:{'aria-hidden':'true'}});
    require('obsidian').setIcon?.(glyph,'file-text');
    const meta=open.createSpan({cls:'writer-v901-home-result-text'});
    meta.createSpan({cls:'writer-v901-home-result-title',text:file.basename||file.name||writerUi('Sem título','Untitled')});
    meta.createSpan({cls:'writer-v901-home-result-path',text:file.path});
    const openHint=open.createSpan({cls:'writer-v901-home-result-arrow',attr:{'aria-hidden':'true'}});
    require('obsidian').setIcon?.(openHint,'arrow-up-right');
    open.addEventListener('click',()=>this.openFile(file));
    row.addEventListener('pointerenter',()=>select(index,false));
    const favorite=cfgStar(this.plugin.settings.v8Finish.homeFavorites,file.path);
    row.createEl('button',{text:favorite?'★':'☆',cls:'writer-v8-home-star writer-v901-home-result-star',attr:{type:'button',title:writerUi(favorite?'Remover dos favoritos':'Adicionar aos favoritos',favorite?'Remove from favorites':'Add to favorites'),'aria-label':writerUi('Favoritar nota: ','Toggle favorite for: ')+file.path,'aria-pressed':String(favorite)}})
     .addEventListener('click',()=>{writerV8HomeToggleFavorite(this.plugin,file.path);this.saveSoon();draw(true);});
   }
   select(selected,false);
  };
  const web=box.createDiv({cls:'writer-v8-home-web-links'});
  web.hidden=true;
  const link=web.createEl('button',{text:writerUi('Abrir endereço web','Open web address'),attr:{type:'button'}});
  link.hidden=true;
  const open=async()=>{
   link.disabled=true;
   try{await writerV8HomeOpenURL(this.plugin,input.value);}
   catch(error){new Notice(writerUi('Não foi possível abrir: ','Unable to open: ')+String(error.message||error).slice(0,160));}
   finally{link.disabled=false;}
  };
  link.addEventListener('click',()=>void open());
  input.addEventListener('keydown',event=>{
   if(event.key==='ArrowDown'&&matches.length){event.preventDefault();select(selected+1,true);return;}
   if(event.key==='ArrowUp'&&matches.length){event.preventDefault();select(selected-1,true);return;}
   if(event.key==='Enter'){
    const url=writerV8HomeValidURL(input.value);
    if(url){event.preventDefault();void open();return;}
    if(matches.length){event.preventDefault();this.openFile(matches[selected]);return;}
   }
   if(event.key==='Escape'&&input.value){
    event.preventDefault();input.value='';link.hidden=true;web.hidden=true;draw();
   }
  });
  input.addEventListener('input',()=>{
   const url=writerV8HomeValidURL(input.value);
   link.hidden=!url;web.hidden=!url;
   if(url)link.setText(writerUi('Abrir site no navegador','Open website'));
   draw();
  });
  const focus=event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&
    !/INPUT|TEXTAREA/.test(event.target?.tagName||'')){event.preventDefault();input.focus();}};
  box.addEventListener('keydown',focus);
  draw();
 }
 renderFiles(parent,kind){
  const recent=kind==='recent',box=this.card(parent,kind,recent?'Notas recentes':'Favoritos',recent?'Recent notes':'Favorites');
  const files=recent?writerV8HomeTopFiles(this.plugin,12):
   this.plugin.settings.v8Finish.homeFavorites.map(path=>this.app.vault.getAbstractFileByPath(path)).filter(file=>file instanceof TFile);
  this.renderNoteRows(box,files,kind);
 }
 renderToday(parent){
  const box=this.card(parent,'today','Editadas hoje','Edited today'),midnight=new Date();
  midnight.setHours(0,0,0,0);
  const files=(this.app.vault.getMarkdownFiles?.()||[])
   .filter(file=>(file.stat?.mtime||0)>=midnight.getTime())
   .sort((a,b)=>(b.stat?.mtime||0)-(a.stat?.mtime||0)).slice(0,24);
  this.renderNoteRows(box,files,'today');
 }
 renderNoteRows(box,files,kind){
  const wrap=box.createDiv({cls:'writer-v905-note-widget'});
  const search=wrap.createEl('input',{cls:'writer-v905-note-filter',attr:{
   type:'search',autocomplete:'off',placeholder:writerUi('Filtrar notas deste painel…','Filter notes in this widget…'),
   'aria-label':writerUi('Filtrar notas','Filter notes')}});
  if(files.length<5)search.hidden=true;
  const list=wrap.createDiv({cls:'writer-v8-home-file-list writer-v905-note-list',
   attr:{role:'list','aria-label':writerUi('Notas para abrir','Notes to open')}});
  const status=wrap.createDiv({cls:'writer-v905-note-status',
   attr:{role:'status','aria-live':'polite','aria-atomic':'true'}});
  let visible=[],selected=0;
  const select=(index,moveFocus=false)=>{
   if(!visible.length)return;
   selected=(index+visible.length)%visible.length;
   const rows=[...list.children];
   rows.forEach((row,i)=>{row.classList.toggle('is-selected',i===selected);row.setAttribute('aria-current',String(i===selected));});
   status.setText(writerUi('Selecionada: ','Selected: ')+visible[selected].path+' · '+writerUi('Enter para abrir','Enter to open'));
   if(moveFocus){rows[selected]?.querySelector?.('.writer-v905-note-open')?.focus?.();
    rows[selected]?.scrollIntoView?.({block:'nearest'});}
  };
  const draw=()=>{
   const previous=visible[selected]?.path,query=search.value.trim().toLocaleLowerCase();
   visible=files.filter(file=>!query||(file.basename||'').toLocaleLowerCase().includes(query)||
    file.path.toLocaleLowerCase().includes(query));
   selected=Math.max(0,visible.findIndex(f=>f.path===previous));
   list.empty();status.empty();
   if(!visible.length){
    list.createEl('p',{cls:'writer-v8-home-muted',text:files.length?
     writerUi('Nenhuma nota corresponde ao filtro.','No notes match your filter.'):
     kind==='today'?writerUi('Nenhuma nota editada hoje.','No notes edited today.'):
     writerUi('Nenhuma nota para mostrar.','No notes to show.')});
    return;
   }
   for(const [index,file] of visible.entries()){
    const row=list.createDiv({cls:'writer-v8-home-file-row writer-v905-note-row',attr:{role:'listitem',title:file.path}});
    const open=row.createEl('button',{cls:'writer-v8-home-file-link writer-v905-note-open',
     attr:{type:'button','aria-label':writerUi('Abrir nota: ','Open note: ')+file.path,title:file.path}});
    const icon=open.createSpan({cls:'writer-v905-note-icon',attr:{'aria-hidden':'true'}});
    require('obsidian').setIcon?.(icon,'file-text');
    const labels=open.createSpan({cls:'writer-v905-note-labels'});
    labels.createSpan({cls:'writer-v905-note-title',text:file.basename||file.name||writerUi('Sem título','Untitled')});
    const sub=labels.createSpan({cls:'writer-v905-note-path',text:file.path});
    if(file.stat?.mtime){
     const date=new Date(file.stat.mtime);
     if(Number.isFinite(date.getTime()))sub.setAttribute('title',writerUi('Editada: ','Edited: ')+date.toLocaleString(writerUi('pt-BR','en-US')));
    }
    const arrow=open.createSpan({cls:'writer-v905-note-arrow',attr:{'aria-hidden':'true'}});
    require('obsidian').setIcon?.(arrow,'arrow-up-right');
    open.addEventListener('pointerenter',()=>select(index));
    open.addEventListener('focus',()=>select(index));
    open.addEventListener('click',()=>this.openFile(file));
    open.addEventListener('keydown',event=>{
     if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();select(selected+(event.key==='ArrowDown'?1:-1),true);
     }
    });
    if(kind==='favorites'){
     const remove=row.createEl('button',{cls:'writer-v905-note-favorite',
      attr:{type:'button','aria-label':writerUi('Remover favorito: ','Remove favorite: ')+file.path}});
     require('obsidian').setIcon?.(remove,'star-off');
     remove.addEventListener('click',()=>{writerV8HomeToggleFavorite(this.plugin,file.path);this.saveSoon();this.render();});
    }
   }
   select(selected);
  };
  search.addEventListener('input',draw);
  search.addEventListener('keydown',event=>{
   if((event.key==='ArrowDown'||event.key==='ArrowUp')&&visible.length){
    event.preventDefault();select(selected+(event.key==='ArrowDown'?1:-1),true);
   }else if(event.key==='Enter'&&visible.length){
    event.preventDefault();this.openFile(visible[selected]);
   }else if(event.key==='Escape'&&search.value){search.value='';draw();}
  });
  draw();
 }
 renderQuick(parent){
  const box=this.card(parent,'quick','Rascunhos rápidos','Quick drafts');
  const tabs=box.createDiv({cls:'writer-v8-home-draft-tabs'});
  const editor=box.createEl('textarea',{cls:'writer-v8-home-draft',attr:{'aria-label':writerUi('Rascunho temporário','Quick draft'),placeholder:writerUi('Anote uma ideia, uma frase ou uma cena…','Jot down an idea, a line or a scene…')}});
  const statuses=box.createDiv({cls:'writer-v8-home-draft-actions'});
  const save=statuses.createEl('button',{text:writerUi('Exportar para nota Markdown','Export to Markdown note')});
  const message=statuses.createSpan({cls:'writer-v8-home-muted'});
  let index=-1;
  const pick=next=>{
   if(index>=0)this.plugin.settings.v8Finish.homeQuick[index]=editor.value.slice(0,12000);
   index=next;editor.value=this.plugin.settings.v8Finish.homeQuick[index]||'';
   [...tabs.children].forEach((node,i)=>node.classList.toggle('is-active',i===index));
  };
  for(let i=0;i<3;i++){
   const button=tabs.createEl('button',{text:String(i+1),attr:{type:'button','aria-label':writerUi('Rascunho ','Draft ')+(i+1)}});
   button.addEventListener('click',()=>pick(i));
  }
  pick(0);
  editor.addEventListener('input',()=>{this.plugin.settings.v8Finish.homeQuick[index]=editor.value.slice(0,12000);this.saveSoon();});
  save.addEventListener('click',async()=>{
   save.disabled=true;message.setText('');
   try{
    const body=editor.value.trim();
    if(!body){message.setText(writerUi('Escreva algo antes de exportar.','Write something before exporting.'));return;}
    const folder='Quick Notes';
    if(!this.app.vault.getAbstractFileByPath(folder))await this.app.vault.createFolder(folder);
    const label=new Date().toISOString().slice(0,10);
    let path=folder+'/'+label+'-writing.md',n=2;
    while(this.app.vault.getAbstractFileByPath(path))path=folder+'/'+label+'-writing-'+n+++'.md';
    const file=await this.app.vault.create(path,body+'\n');
    this.plugin.settings.v8Finish.homeQuick[index]='';editor.value='';
    await this.plugin.saveSettings();
    message.setText(writerUi('Nota criada.','Note created.'));
    this.openFile(file);
   }catch(error){message.setText(writerUi('Erro ao criar nota: ','Unable to create note: ')+String(error.message||error));}
   finally{save.disabled=false;}
  });
 }
 renderStats(parent){
  const box=this.card(parent,'stats','Resumo do cofre','Vault summary'),stats=writerV8HomeStats(this.plugin);
  const items=box.createDiv({cls:'writer-v8-home-stats'});
  for(const [value,pt,en] of [[stats.notes,'Notas Markdown','Markdown notes'],[stats.recent,'Editadas em 7 dias','Edited in 7 days']]){
   const item=items.createDiv({cls:'writer-v8-home-stat'});
   item.createEl('strong',{text:String(value)});
   item.createEl('span',{text:writerUi(pt,en)});
  }
 }

 renderGallery(parent){
  const box=this.card(parent,'gallery','Galeria do cofre','Vault gallery');
  const images=(this.app.vault.getFiles?.()||[])
   .filter(file=>/^(png|jpe?g|webp|gif|avif)$/i.test(file.extension||'')).slice(0,5000);
  if(!images.length){
   box.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Adicione imagens ao cofre para usar a galeria.','Add images to your vault to populate the gallery.')});
   return;
  }
  const previous=this.homeGalleryImage?.path;
  let file=images.find(item=>item.path===previous)||writerV8HomePick(images);
  this.homeGalleryImage=file;
  const picture=box.createDiv({cls:'writer-v905-gallery-frame'});
  const img=picture.createEl('img',{attr:{src:this.app.vault.getResourcePath(file),
   alt:file.basename||file.name||writerUi('Imagem do cofre','Vault image'),loading:'lazy',decoding:'async'}});
  const name=box.createDiv({cls:'writer-v905-gallery-name',text:file.basename||file.name});
  const path=box.createDiv({cls:'writer-v905-gallery-path',text:file.path});
  const actions=box.createDiv({cls:'writer-v903-widget-actions'});
  const open=actions.createEl('button',{text:writerUi('Abrir imagem','Open image')});
  open.addEventListener('click',()=>this.openFile(file));
  const shuffle=actions.createEl('button',{text:writerUi('Outra imagem','Shuffle image')});
  shuffle.addEventListener('click',()=>{
   const picked=writerV8HomePick(images,file.path);
   if(!picked)return;
   file=picked;this.homeGalleryImage=file;
   img.src=this.app.vault.getResourcePath(file);
   img.alt=file.basename||file.name||'';
   name.setText(file.basename||file.name);path.setText(file.path);
  });
 }
 renderQuotes(parent){
  const box=this.card(parent,'quotes','Citação aleatória','Random quote');
  const options=writerV8HomeQuoteChoices(this.plugin.settings.v8Finish.homeQuotes);
  if(!this.homeQuote)this.homeQuote=writerV8HomePick(options,this.homeQuotePrevious);
  let current=this.homeQuote||options[0];
  const body=box.createEl('blockquote',{cls:'writer-v905-quote-text'});
  const quote=body.createEl('p',{text:current[0]});
  const author=box.createDiv({cls:'writer-v905-quote-author'});
  const update=()=>{
   quote.setText(current[0]);
   author.setText(current[1]?'— '+current[1]:writerUi('Inspiração para escrever','Writing inspiration'));
  };
  update();
  const actions=box.createDiv({cls:'writer-v903-widget-actions'});
  const zoteroSource=actions.createEl('button',{text:writerUi('Abrir fonte Zotero','Open Zotero source')});
  zoteroSource.hidden=true;
  const syncZotero=async()=>{
   if(!this.plugin.writerV92Research?.quotes)return;
   const entries=await this.plugin.writerV92Research.quotes();
   if(!box.isConnected||!entries.length)return;
   const list=entries.map(([text,by,path,title])=>[text,by,path,title]);
   let selected=writerV8HomePick(list,current[0])||list[0];
   const set=entry=>{
    current=entry;this.homeQuote=entry;
    update();zoteroSource.hidden=false;
    zoteroSource.onclick=()=>{
     const file=this.app.vault.getAbstractFileByPath(entry[2]);
     if(file instanceof TFile)this.openFile(file);
    };
   };
   set(selected);
   next.onclick=()=>set(writerV8HomePick(list,current[0])||list[0]);
  };
  void syncZotero().catch(error=>console.warn('[Basic AI] Zotero quote widget:',error));
  const next=actions.createEl('button',{text:writerUi('Outra citação','Another quote')});
  next.addEventListener('click',()=>{
   this.homeQuotePrevious=current[0];
   current=writerV8HomePick(options,current[0])||current;
   this.homeQuote=current;
   update();
  });
 }
 renderActivity(parent){
  const box=this.card(parent,'activity','Atividade da semana','Weekly activity');
  const files=this.app.vault.getMarkdownFiles?.()||[];
  const now=new Date(),labels=[],counts=[];
  for(let i=6;i>=0;i--){
   const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);
   const begin=d.getTime(),end=begin+86400000;
   labels.push(new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),{weekday:'short'}).format(d));
   counts.push(files.filter(f=>(f.stat?.mtime||0)>=begin&&(f.stat?.mtime||0)<end).length);
  }
  const high=Math.max(1,...counts),chart=box.createDiv({cls:'writer-v903-activity'});
  for(let i=0;i<7;i++){
   const column=chart.createDiv({cls:'writer-v903-activity-day',attr:{title:labels[i]+': '+counts[i]}});
   const bar=column.createDiv({cls:'writer-v903-activity-track'});
   bar.createDiv({cls:'writer-v903-activity-fill'}).style.height=(counts[i]/high*100)+'%';
   column.createEl('strong',{text:String(counts[i])});
   column.createSpan({text:labels[i]});
  }
  box.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Notas modificadas a cada dia.','Notes modified each day.')});
 }
 renderRandom(parent){
  const box=this.card(parent,'random','Nota surpresa','Surprise note');
  const files=this.app.vault.getMarkdownFiles?.()||[];
  if(!files.length){box.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Nenhuma nota encontrada.','No notes found.')});return;}
  let file=files[Math.floor(Math.random()*files.length)];
  const label=box.createDiv({cls:'writer-v903-random-note'});
  const name=label.createEl('strong',{text:file.basename});
  const path=label.createSpan({cls:'writer-v8-home-muted',text:file.path});
  const actions=box.createDiv({cls:'writer-v903-widget-actions'});
  const open=actions.createEl('button',{text:writerUi('Abrir nota','Open note')});
  open.addEventListener('click',()=>this.openFile(file));
  const next=actions.createEl('button',{text:writerUi('Outra nota','Another note')});
  next.addEventListener('click',()=>{
   if(files.length>1){
    let chosen=file;for(let attempt=0;attempt<5&&chosen.path===file.path;attempt++)chosen=files[Math.floor(Math.random()*files.length)];
    if(chosen.path===file.path)chosen=files[(files.indexOf(file)+1)%files.length];
    file=chosen;
   }
   name.setText(file.basename);path.setText(file.path);
  });
 }
 renderTags(parent){
  const box=this.card(parent,'tags','Tags frequentes','Popular tags');
  const cache=this.app.metadataCache,counts=new Map(),files=this.app.vault.getMarkdownFiles?.()||[];
  const obsidian=require('obsidian');
  for(const file of files.slice(0,3000)){
   const meta=cache?.getFileCache?.(file);
   const tags=meta&&typeof obsidian.getAllTags==='function'?obsidian.getAllTags(meta)||[]:
    (meta?.tags||[]).map(item=>item.tag).concat(meta?.frontmatter?.tags||[]);
   for(const item of new Set(tags.map(tag=>String(tag||'').trim().replace(/^#/,'').toLowerCase()).filter(Boolean))){
    counts.set(item,(counts.get(item)||0)+1);
   }
  }
  const list=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(!list.length){box.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Adicione tags às notas para ver as mais usadas.','Add tags to notes to see your top topics.')});return;}
  const chips=box.createDiv({cls:'writer-v903-tags'});
  for(const [tag,count] of list){
   const item=chips.createDiv({cls:'writer-v903-tag'});
   item.createSpan({text:'#'+tag});item.createEl('small',{text:String(count)});
  }
 }
 renderGoal(parent){
  const box=this.card(parent,'goal','Meta de palavras','Word target');
  const cfg=this.plugin.settings.v8Finish;
  const path=cfg.homeRecent?.[0];
  const file=path?this.app.vault.getAbstractFileByPath(path):null;
  const summary=box.createDiv({cls:'writer-v903-goal-summary'});
  const count=summary.createEl('strong',{text:'—'});
  const target=summary.createSpan({text:'/ '+cfg.homeWordGoal+' '+writerUi('palavras','words')});
  const track=box.createDiv({cls:'writer-v903-goal-track',attr:{role:'progressbar','aria-label':writerUi('Progresso da meta','Target progress'),'aria-valuemin':'0','aria-valuemax':String(cfg.homeWordGoal),'aria-valuenow':'0'}});
  const fill=track.createDiv({cls:'writer-v903-goal-fill'});
  const foot=box.createEl('p',{cls:'writer-v8-home-muted',text:file?.path||writerUi('Abra uma nota Markdown para acompanhar.','Open a Markdown note to begin tracking.')});
  if(!(file instanceof TFile)||file.extension!=='md')return;
  Promise.resolve(this.app.vault.cachedRead(file)).then(content=>{
   if(this.disposed||!box.isConnected)return;
   const words=(String(content||'').match(/[^\s]+/g)||[]).length;
   count.setText(String(words));target.setText('/ '+cfg.homeWordGoal+' '+writerUi('palavras','words'));
   fill.style.width=Math.min(100,words/cfg.homeWordGoal*100)+'%';
   track.setAttribute('aria-valuenow',String(Math.min(words,cfg.homeWordGoal)));
   foot.setText(file.path);
  }).catch(()=>{foot.setText(writerUi('Não foi possível ler a nota.','Could not read note.'));});
 }

}
function cfgStar(list,path){return list.includes(path);}
function writerV8HomeToggleFavorite(plugin,path){
 const list=plugin.settings.v8Finish.homeFavorites;
 const i=list.indexOf(path);
 if(i>=0)list.splice(i,1);
 else list.unshift(path);
 plugin.settings.v8Finish.homeFavorites=list.slice(0,30);
 plugin.writerV92Explorer?.schedule?.();
}
function writerV8RegisterHome(plugin){
 plugin.registerView?.(WRITER_V8_HOME_VIEW,leaf=>new WriterV8HomeView(leaf,plugin));
 const open=async()=>{
  const workspace=plugin.app.workspace,existing=workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)?.[0];
  if(existing){
   // Opening an already present Home tab is a new visit, not an incidental rerender.
   if(existing.view){existing.view.homeQuote=null;existing.view.homeGalleryImage=null;existing.view.render?.();}
   workspace.setActiveLeaf?.(existing,{focus:true});return;
  }
  const leaf=workspace.getLeaf?.('tab')||workspace.getLeaf?.(true);
  if(leaf)await leaf.setViewState({type:WRITER_V8_HOME_VIEW,active:true});
 };
 plugin.writerV8HomeOpen=open;
 plugin.addCommand({id:'v8-open-writing-home',name:writerUi('Início: abrir painel de escrita','Home: open writing dashboard'),callback:()=>void open()});
 plugin.addCommand({id:'v8-toggle-current-favorite',name:writerUi('Início: favoritar nota atual','Home: toggle current note favorite'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile?.();
  if(!(file instanceof TFile))return new Notice(writerUi('Abra uma nota primeiro.','Open a note first.'));
  writerV8HomeToggleFavorite(plugin,file.path);
  void plugin.saveSettings();
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[])leaf.view?.render?.();
 }});
 let timer=null;
 plugin.registerEvent(plugin.app.workspace.on('file-open',file=>{
  if(!(file instanceof TFile)||file.extension!=='md')return;
  const recents=plugin.settings?.v8Finish?.homeRecent;
  if(!recents)return;
  plugin.settings.v8Finish.homeRecent=[file.path,...recents.filter(p=>p!==file.path)].slice(0,16);
  clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;void plugin.saveSettings().catch(console.warn);},1400);
 }));
 plugin.registerEvent(plugin.app.vault.on('rename',(file,old)=>{
  const cfg=plugin.settings.v8Finish;
  if(!(file instanceof TFile))return;
  cfg.homeFavorites=cfg.homeFavorites.map(p=>p===old?file.path:p);
  cfg.homeRecent=cfg.homeRecent.map(p=>p===old?file.path:p);
 }));
 plugin.register?.(()=>clearTimeout(timer));
 // Reconcile only ATTACHED, empty root tabs; never touch existing notes,
 // settings, sidebars, restored sessions or the native Web Viewer.
 let tabTimer=null,tabBusy=false;
 const populateEmptyTabs=()=>{
  if(tabBusy||!plugin.settings?.v8Finish?.homeOnNewTab||!writerModuleOn(plugin,'writingHome'))return;
  tabBusy=true;
  try{
   for(const leaf of writerV8HomeAttachedEmpty(plugin.app.workspace)){
    // Convert exactly one empty leaf, and never open another new tab here.
    if(leaf.__writerV8HomeConverting)continue;
    leaf.__writerV8HomeConverting=true;
    Promise.resolve(leaf.setViewState({type:WRITER_V8_HOME_VIEW,active:false}))
     .catch(error=>console.warn('[Basic AI] New-tab homepage:',error))
     .finally(()=>{leaf.__writerV8HomeConverting=false;});
   }
  }finally{tabBusy=false;}
 };
 const schedule=()=>{
  if(!plugin.settings?.v8Finish?.homeOnNewTab)return;
  clearTimeout(tabTimer);
  tabTimer=setTimeout(()=>{tabTimer=null;populateEmptyTabs();},85);
 };
 if(typeof plugin.app.workspace.on==='function'){
  plugin.registerEvent(plugin.app.workspace.on('layout-change',schedule));
  plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',leaf=>{
   if(writerV8HomeIsRootEmpty(leaf))schedule();
  }));
 }
 plugin.register?.(()=>clearTimeout(tabTimer));
 if(plugin.settings.v8Finish.homeAtStartup&&typeof plugin.app.workspace.onLayoutReady==='function')
  plugin.app.workspace.onLayoutReady(()=>{if(writerModuleOn(plugin,'writingHome'))void open();});
 if(typeof plugin.app.workspace.onLayoutReady==='function')
  plugin.app.workspace.onLayoutReady(()=>{if(plugin.settings.v8Finish.homeOnNewTab)schedule();});
}
function writerV8FinishSettings(plugin,panel){
 const cfg=plugin.settings.v8Finish;
 panel.createEl('h3',{text:writerUi('Legendas, conversas e página inicial','Image captions, fictional chats and writing homepage')});
 panel.createEl('p',{text:writerUi('Recursos locais para notas do seu cofre. A página inicial não substitui a aba padrão sem autorização.','Local features for your vault. The homepage does not replace the default tab without permission.'),cls:'dictionary-muted'});
 new Setting(panel).setName(writerUi('Legendas automáticas em imagens Markdown','Show captions from Markdown image alt text'))
  .setDesc(writerUi('Ex.: ![[foto.jpg|Legenda curta]]. Se Image Captions estiver ativo, este módulo deixa a renderização com ele.','Example: ![[photo.jpg|Short caption]]. When Image Captions is enabled, that plugin handles captions.'))
  .addToggle(x=>x.setValue(cfg.captions).onChange(async value=>{cfg.captions=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Tamanho máximo da legenda','Maximum caption characters'))
  .addText(x=>x.setValue(String(cfg.captionMax)).onChange(async value=>{cfg.captionMax=Math.max(32,Math.min(240,Number(value)||180));await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Abrir a homepage de escrita ao iniciar','Open writing homepage on startup'))
  .setDesc(writerUi('Desativado por padrão; não altera a página inicial de outros plugins.','Off by default; does not alter other plugins’ home views.'))
  .addToggle(x=>x.setValue(cfg.homeAtStartup).onChange(async value=>{cfg.homeAtStartup=value;await plugin.saveSettings();}));
 const refreshHome=()=>{
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[]){
   leaf.view?.render?.();
   leaf.updateHeader?.();
  }
 };
 new Setting(panel).setName(writerUi('Título da homepage','Homepage title'))
  .setDesc(writerUi('Em branco para usar o título padrão.','Leave blank to use the default title.'))
  .addText(input=>input.setPlaceholder(writerUi('Meu espaço de escrita','My writing space'))
   .setValue(cfg.homeTitle||'').onChange(async value=>{
    cfg.homeTitle=String(value||'').replace(/[\\r\\n]/g,' ').slice(0,80);
    await plugin.saveSettings();refreshHome();
   }));
 writerV922IconSetting(plugin,panel,{
  pt:'Ícone da homepage',en:'Homepage icon',
  value:writerV8HomeIconName(cfg.homeIcon),color:cfg.homeIconColor,defaultIcon:'book-open',
  description:writerUi('Pesquise todos os ícones Lucide, favorite opções e personalize a cor.',
   'Search all Lucide icons, pin favorite choices and customize the color.'),
  onApply:async(icon,color)=>{
   cfg.homeIcon=writerV8HomeIconName(icon);
   cfg.homeIconColor=color;
   await plugin.saveSettings();refreshHome();
  }
 });
 writerV9ColorSetting(panel,'Cor do título da homepage','Homepage title color',cfg.homeTitleColor,value=>{
  cfg.homeTitleColor=value;void plugin.saveSettings().then(refreshHome);
 });
 new Setting(panel).setName(writerUi('Imagem do ícone (cofre ou HTTPS)','Icon image (vault or HTTPS)'))
  .setDesc(writerUi('Caminho de uma imagem no cofre ou URL HTTPS. Deixe em branco para usar o ícone Lucide escolhido. Links remotos fazem uma requisição ao site da imagem.','Vault image path or HTTPS URL. Leave empty to use the selected Lucide icon. Remote images contact the image host.'))
  .addText(input=>input.setPlaceholder('Assets/icon.png ou https://…').setValue(cfg.homeIconImage||'')
   .onChange(async value=>{cfg.homeIconImage=String(value||'').trim().slice(0,600);await plugin.saveSettings();refreshHome();}));
 new Setting(panel).setName(writerUi('Abrir homepage em toda nova aba vazia','Open homepage in every new empty tab'))
  .setDesc(writerUi('Ativado por padrão. Apenas abas vazias: nunca substitui arquivos ou outras visualizações.','Enabled by default. Empty tabs only: never replaces notes or other views.'))
  .addToggle(toggle=>toggle.setValue(cfg.homeOnNewTab).onChange(async value=>{
   cfg.homeOnNewTab=value;await plugin.saveSettings();
  }));
 writerV83StudySettings(plugin,panel);
 new Setting(panel).setName(writerUi('Personalizar widgets da homepage','Customize homepage widgets'))
  .setDesc(writerUi('Adicione, remova e reorganize cartões sem apagar suas notas.','Add, remove and reorder cards without deleting notes.'))
  .addButton(button=>button.setButtonText(writerUi('Gerenciar widgets','Manage widgets')).onClick(async()=>{
   await plugin.writerV8HomeOpen?.();
   plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)?.[0]?.view?.manageWidgets?.();
  }));
 new Setting(panel).setName(writerUi('Citações da homepage','Homepage quotes'))
  .setDesc(writerUi('Uma citação por linha. Opcional: frase | autor. Em branco usa frases originais do Basic. O sorteio muda ao abrir a homepage.','One quote per line. Optional: quote | author. Empty uses original Basic quotes. A new quote is chosen when opening the homepage.'))
  .addTextArea(input=>input.setValue(cfg.homeQuotes||'').onChange(async value=>{
   cfg.homeQuotes=String(value||'').slice(0,12000);
   await plugin.saveSettings();
   for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[]){
    if(leaf.view){leaf.view.homeQuote=null;leaf.view.render?.();}
   }
  }));
 new Setting(panel).setName(writerUi('Meta de palavras do widget','Widget word target'))
  .setDesc(writerUi('Progresso calculado sobre a última nota Markdown aberta.','Progress measured against the latest opened Markdown note.'))
  .addText(input=>input.setValue(String(cfg.homeWordGoal)).onChange(async value=>{
   const number=Math.round(Number(value));
   if(!Number.isFinite(number)||number<50)return;
   cfg.homeWordGoal=Math.min(20000,number);await plugin.saveSettings();refreshHome();
  }));
 new Setting(panel).setName(writerUi('Abrir calendário completo','Open full calendar'))
  .addButton(btn=>btn.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerCalendarOpen?.()));
 new Setting(panel).setName(writerUi('Abrir homepage agora','Open homepage now'))
  .addButton(x=>x.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerV8HomeOpen?.()));
}
