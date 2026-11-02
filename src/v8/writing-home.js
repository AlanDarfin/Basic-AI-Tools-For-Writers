'use strict';
/* Lightweight local-first writing dashboard, inspired by Harbor Tab + Genkan. */
const WRITER_V8_HOME_VIEW='writer-writing-home';
const WRITER_V8_HOME_SECTIONS=['continue','recent','favorites','quick','stats'];
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
 async onOpen(){this.disposed=false;this.render();this.writerV8ClockTimer=setInterval(()=>{if(!this.disposed)this.writerV8ClockRefresh?.();},1000);}
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
  this.contentEl.empty();this.contentEl.addClass('writer-v8-home');
  const cfg=this.plugin.settings.v8Finish;
  // The vault search is a full-width first-class section, before the hero and calendar.
  const top=this.contentEl.createDiv({cls:'writer-v8-home-search-region'});
  this.renderSearch(top);
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
  const commands=hero.createDiv({cls:'writer-v8-home-quick-actions'});
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
  // The calendar participates in the dashboard grid; search never shares its row.
  const grid=this.contentEl.createDiv({cls:'writer-v8-home-grid'});
  const schedule=grid.createDiv({cls:'writer-v8-home-clock-card',attr:{role:'region','aria-label':writerUi('Relógio e calendário','Clock and calendar')}});
  writerV8HomeRenderCalendar(this,schedule);
  const cards={
   continue:()=>this.renderContinue(grid),
    recent:()=>this.renderFiles(grid,'recent'),
   favorites:()=>this.renderFiles(grid,'favorites'),
   quick:()=>this.renderQuick(grid),
   stats:()=>this.renderStats(grid)
  };
  for(const key of cfg.homeOrder){if(WRITER_V8_HOME_SECTIONS.includes(key))cards[key]?.();}
  this.contentEl.scrollTop=scroll;
 }
 card(parent,key,pt,en){
  const section=parent.createDiv({cls:'writer-v8-home-card',attr:{'data-section':key,role:'region','aria-label':writerUi(pt,en)}});
  const top=section.createDiv({cls:'writer-v8-home-card-header'});
  top.createEl('h3',{text:writerUi(pt,en)});
  const order=this.plugin.settings.v8Finish.homeOrder,idx=order.indexOf(key);
  const controls=top.createDiv({cls:'writer-v8-home-card-order'});
  if(key!=='search')
  for(const [direction,symbol,ptText,enText] of [[-1,'↑','Mover para cima','Move up'],[1,'↓','Mover para baixo','Move down']]){
   const btn=controls.createEl('button',{text:symbol,attr:{type:'button',title:writerUi(ptText,enText),'aria-label':writerUi(ptText,enText)}});
   btn.disabled=idx+direction<0||idx+direction>=order.length;
   btn.addEventListener('click',()=>{
    const other=idx+direction;
    [order[idx],order[other]]=[order[other],order[idx]];
    this.saveSoon();this.render();
   });
  }
  return section;
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
    event.preventDefault();input.value='';link.hidden=true;draw();
   }
  });
  input.addEventListener('input',()=>{
   const url=writerV8HomeValidURL(input.value);
   link.hidden=!url;
   if(url)link.setText(writerUi('Abrir site no navegador','Open website'));
   draw();
  });
  const focus=event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&
    !/INPUT|TEXTAREA/.test(event.target?.tagName||'')){event.preventDefault();input.focus();}};
  box.addEventListener('keydown',focus);
  draw();
 }
 renderFiles(parent,kind){
  const box=this.card(parent,kind,kind==='recent'?'Notas recentes':'Favoritos',kind==='recent'?'Recent notes':'Favorites');
  const paths=kind==='recent'?writerV8HomeTopFiles(this.plugin,9):
   this.plugin.settings.v8Finish.homeFavorites.map(path=>this.app.vault.getAbstractFileByPath(path)).filter(file=>file instanceof TFile);
  const list=box.createDiv({cls:'writer-v8-home-file-list'});
  if(!paths.length)list.createEl('p',{text:writerUi('Use a estrela da pesquisa ou o comando de favoritar nota.','Use the star in search or the favorite-note command.'),cls:'writer-v8-home-muted'});
  for(const file of paths){
   const row=list.createDiv({cls:'writer-v8-home-file-row'});
   row.createEl('button',{cls:'writer-v8-home-file-link',text:file.basename}).addEventListener('click',()=>this.openFile(file));
   if(kind==='favorites')row.createEl('button',{text:'★',cls:'writer-v8-home-star',attr:{'aria-label':writerUi('Remover favorito','Remove favorite')}})
    .addEventListener('click',()=>{writerV8HomeToggleFavorite(this.plugin,file.path);this.saveSoon();this.render();});
  }
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
}
function cfgStar(list,path){return list.includes(path);}
function writerV8HomeToggleFavorite(plugin,path){
 const list=plugin.settings.v8Finish.homeFavorites;
 const i=list.indexOf(path);
 if(i>=0)list.splice(i,1);
 else list.unshift(path);
 plugin.settings.v8Finish.homeFavorites=list.slice(0,30);
}
function writerV8RegisterHome(plugin){
 plugin.registerView?.(WRITER_V8_HOME_VIEW,leaf=>new WriterV8HomeView(leaf,plugin));
 const open=async()=>{
  const workspace=plugin.app.workspace,existing=workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)?.[0];
  if(existing){workspace.setActiveLeaf?.(existing,{focus:true});return;}
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
 new Setting(panel).setName(writerUi('Ícone da homepage','Homepage icon'))
  .addDropdown(drop=>{
   const labels={
    'house':'Casa','book-open':'Livro aberto','feather':'Pena','pen-line':'Escrita',
    'notebook-pen':'Caderno','library':'Biblioteca','sparkles':'Estrelas',
    'sun':'Sol','moon-star':'Lua','flower-2':'Flor','rocket':'Foguete','pencil':'Lápis',
    'book':'Livro','bookmark':'Marcador','star':'Estrela','heart':'Coração','lightbulb':'Ideia',
    'brain':'Cérebro','graduation-cap':'Estudos','file-text':'Arquivo','folder':'Pasta','archive':'Arquivo morto',
    'palette':'Paleta','wand-sparkles':'Varinha','calendar-days':'Calendário','clock':'Relógio',
    'globe':'Globo','leaf':'Folha','music':'Música','headphones':'Fone','flag':'Bandeira','compass':'Bússola',
    'map':'Mapa','gem':'Gema','trophy':'Troféu','shield':'Escudo','user':'Usuário','users':'Pessoas',
    'image':'Imagem','images':'Imagens','flame':'Chama','cloud':'Nuvem','settings':'Configurações'
   };
   for(const icon of WRITER_V8_HOME_ICONS)drop.addOption(icon,labels[icon]||icon);
   drop.setValue(writerV8HomeIconName(cfg.homeIcon));
   drop.onChange(async value=>{cfg.homeIcon=writerV8HomeIconName(value);await plugin.saveSettings();refreshHome();});
  });
 writerV9ColorSetting(panel,'Cor do título da homepage','Homepage title color',cfg.homeTitleColor,value=>{
  cfg.homeTitleColor=value;void plugin.saveSettings().then(refreshHome);
 });
 writerV9ColorSetting(panel,'Cor do ícone da homepage','Homepage icon color',cfg.homeIconColor,value=>{
  cfg.homeIconColor=value;void plugin.saveSettings().then(refreshHome);
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
 new Setting(panel).setName(writerUi('Abrir calendário completo','Open full calendar'))
  .addButton(btn=>btn.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerCalendarOpen?.()));
 new Setting(panel).setName(writerUi('Abrir homepage agora','Open homepage now'))
  .addButton(x=>x.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerV8HomeOpen?.()));
}
