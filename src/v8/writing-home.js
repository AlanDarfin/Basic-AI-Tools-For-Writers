'use strict';
/* Lightweight local-first writing dashboard, inspired by Harbor Tab + Genkan. */
const WRITER_V8_HOME_VIEW='writer-writing-home';
const WRITER_V8_HOME_SECTIONS=['continue','search','recent','favorites','quick','stats'];
function writerV8HomeSearch(files,query,cache,max=12){
 const q=String(query||'').trim().toLocaleLowerCase();
 if(!q)return [];
 return files.filter(file=>{
  if((file.basename||'').toLocaleLowerCase().includes(q)||file.path.toLocaleLowerCase().includes(q))return true;
  const headings=cache?.getFileCache?.(file)?.headings||[];
  return headings.some(h=>String(h.heading||'').toLocaleLowerCase().includes(q));
 }).slice(0,max);
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
 getDisplayText(){return writerUi('Início · Escrita','Home · Writing');}
 getIcon(){return 'house';}
 async onOpen(){this.disposed=false;this.render();}
 async onClose(){this.disposed=true;const unsaved=!!this.saveTimer;clearTimeout(this.saveTimer);this.saveTimer=null;if(unsaved)await this.plugin.saveSettings();}
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
  const hero=this.contentEl.createDiv({cls:'writer-v8-home-hero'});
  hero.createEl('h2',{text:writerUi('Seu espaço de escrita','Your writing space')});
  hero.createEl('p',{text:new Date().toLocaleDateString(writerUi('pt-BR','en-US'),{weekday:'long',day:'numeric',month:'long'}),cls:'writer-v8-home-date'});
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
  const grid=this.contentEl.createDiv({cls:'writer-v8-home-grid'});
  const cards={
   continue:()=>this.renderContinue(grid),
   search:()=>this.renderSearch(grid),
   recent:()=>this.renderFiles(grid,'recent'),
   favorites:()=>this.renderFiles(grid,'favorites'),
   quick:()=>this.renderQuick(grid),
   stats:()=>this.renderStats(grid)
  };
  for(const key of cfg.homeOrder){if(WRITER_V8_HOME_SECTIONS.includes(key))cards[key]();}
  this.contentEl.scrollTop=scroll;
 }
 card(parent,key,pt,en){
  const section=parent.createDiv({cls:'writer-v8-home-card',attr:{'data-section':key,role:'region','aria-label':writerUi(pt,en)}});
  const top=section.createDiv({cls:'writer-v8-home-card-header'});
  top.createEl('h3',{text:writerUi(pt,en)});
  const order=this.plugin.settings.v8Finish.homeOrder,idx=order.indexOf(key);
  const controls=top.createDiv({cls:'writer-v8-home-card-order'});
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
  const input=box.createEl('input',{cls:'writer-v8-home-search',attr:{type:'search',placeholder:writerUi('Buscar notas e títulos…','Find notes and headings…'),'aria-label':writerUi('Buscar notas','Search notes')}});
  const results=box.createDiv({cls:'writer-v8-home-file-list',attr:{'aria-live':'polite'}});
  const files=this.app.vault.getMarkdownFiles?.()||[];
  const draw=()=>{
   results.empty();
   const q=input.value.trim();
   if(!q)return;
   const matches=writerV8HomeSearch(files,q,this.app.metadataCache,12);
   if(!matches.length)results.createEl('p',{text:writerUi('Nenhuma nota encontrada.','No matching notes.')});
   for(const file of matches){
    const row=results.createDiv({cls:'writer-v8-home-file-row'});
    row.createEl('button',{text:file.basename,cls:'writer-v8-home-file-link'}).addEventListener('click',()=>this.openFile(file));
    row.createEl('button',{text:cfgStar(this.plugin.settings.v8Finish.homeFavorites,file.path)?'★':'☆',
     cls:'writer-v8-home-star',attr:{title:writerUi('Alternar favorito','Toggle favorite'),'aria-label':writerUi('Alternar favorito','Toggle favorite')}})
     .addEventListener('click',()=>{writerV8HomeToggleFavorite(this.plugin,file.path);this.saveSoon();draw();});
   }
  };
  input.addEventListener('input',draw);
  const focus=event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&
    !/INPUT|TEXTAREA/.test(event.target?.tagName||'')){event.preventDefault();input.focus();}};
  box.addEventListener('keydown',focus);
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
 if(plugin.settings.v8Finish.homeAtStartup&&typeof plugin.app.workspace.onLayoutReady==='function')
  plugin.app.workspace.onLayoutReady(()=>{if(writerModuleOn(plugin,'writingHome'))void open();});
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
 new Setting(panel).setName(writerUi('Abrir homepage agora','Open homepage now'))
  .addButton(x=>x.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerV8HomeOpen?.()));
}
