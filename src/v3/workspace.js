'use strict';
/* v3 sidebar for local writing tools; complements the existing AI and project panes. */
const WRITER_TOOLS_VIEW='basic-ai-writing-tools';
class WriterToolsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.tab='complements';}
 getViewType(){return WRITER_TOOLS_VIEW;}
 getDisplayText(){return 'Ferramentas de escrita';}
 getIcon(){return 'wand-sparkles';}
 async onOpen(){
  this.root=this.contentEl.createDiv({cls:'writer-tools-v3'});
  this.registerEvent(this.app.workspace.on('active-leaf-change',()=>this.render()));
  this.render();
 }
 addButton(container,label,fn,primary=false){
  const button=container.createEl('button',{text:label,cls:primary?'mod-cta':''});
  button.addEventListener('click',async()=>{try{await fn();this.render();}catch(e){new Notice(e.message||String(e));}});
  return button;
 }
 render(){
  if(!this.root)return;
  const root=this.root;root.empty();
  root.createEl('h3',{text:'Ferramentas de escrita'});
  const active=this.app.workspace.getActiveFile();
  root.createEl('p',{text:active?.extension==='md'?active.path:'Abra uma nota Markdown para usar as ferramentas.',cls:'writer-tools-note-path'});
  const tabs=root.createDiv({cls:'writer-tools-v3-tabs'});
  for(const [id,label] of [['complements','Sugestões'],['variants','Variantes'],['snapshots','Versões']]){
   const btn=tabs.createEl('button',{text:label,cls:this.tab===id?'is-active':''});
   btn.addEventListener('click',()=>{this.tab=id;this.render();});
  }
  const panel=root.createDiv({cls:'writer-tools-v3-panel'});
  if(this.tab==='complements')this.renderComplements(panel);
  if(this.tab==='variants')this.renderVariants(panel);
  if(this.tab==='snapshots')this.renderSnapshots(panel,active);
  const footer=root.createDiv({cls:'writer-tools-footer'});
  this.addButton(footer,'Revisão',()=>this.plugin.openReview());
  this.addButton(footer,'Projetos',()=>this.plugin.openProjects());
  this.addButton(footer,'Configurações',()=>{this.app.setting.open();this.app.setting.openTabById(this.plugin.manifest.id);});
 }
 renderComplements(panel){
  const opts=this.plugin.settings.complements||{};
  panel.createEl('h4',{text:'Autocomplete contextual'});
  panel.createEl('p',{text:'Sugestões locais do arquivo, do cofre, dos dicionários e de links internos.'});
  new Setting(panel).setName('Ativar sugestões').addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName('Aparecer enquanto escreve').addToggle(t=>t.setValue(opts.automatic!==false).onChange(async v=>{opts.automatic=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,'Mostrar sugestões',()=>this.plugin.writerComplements.manual(),true);
  this.addButton(actions,'Reindexar cofre',async()=>{this.plugin.writerComplements.reset();await this.plugin.writerComplements.rebuild();new Notice('Índice de sugestões atualizado.');});
  this.addButton(actions,'Abrir dicionário',async()=>{await this.plugin.activateView();this.plugin.app.workspace.getLeavesOfType(VIEW)[0]?.view?.switchTab('definition');});
  const tracked=this.plugin.writerComplements?.cache?.size||0;
  panel.createEl('p',{text:tracked+' arquivo(s) no índice atual.',cls:'writer-tools-muted'});
 }
 renderVariants(panel){
  const opts=this.plugin.settings.variants||{};
  panel.createEl('h4',{text:'Alternativas de escrita'});
  panel.createEl('p',{text:'Experimente frases alternativas sem apagar o original. Toque numa variante destacada para editar.'});
  new Setting(panel).setName('Ativar variantes').addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,'Criar da seleção',()=>this.plugin.writerVariants.createFromSelection(),true);
  this.addButton(actions,'Editar no cursor',()=>this.plugin.writerVariants.open());
  this.addButton(actions,'Anterior',()=>this.plugin.writerVariants.step(-1));
  this.addButton(actions,'Próxima',()=>this.plugin.writerVariants.step(1));
  this.addButton(actions,'Confirmar escolhida',()=>this.plugin.writerVariants.commit());
  this.addButton(actions,'Confirmar todas',()=>this.plugin.writerVariants.commitAll());
  this.addButton(actions,'Gerar com IA',()=>this.plugin.writerVariants.aiAlternatives());
  const current=this.plugin.writerVariants.atCaret();
  if(current){
   panel.createEl('strong',{text:'Variante '+(current.found.active+1)+' de '+current.found.variants.length});
   const sample=panel.createDiv({cls:'writer-variant-current'});
   sample.setText(current.found.variants[current.found.active].slice(0,1000));
  }
 }
 renderSnapshots(panel,file){
  const opts=this.plugin.settings.snapshots||{};
  panel.createEl('h4',{text:'Histórico e recuperação'});
  panel.createEl('p',{text:'Guarde versões da nota antes de revisões ou mudanças importantes. Os arquivos ficam no próprio cofre.'});
  new Setting(panel).setName('Ativar snapshots').addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,'Salvar versão agora',async()=>{
   if(!(file instanceof TFile)||file.extension!=='md')throw Error('Abra uma nota Markdown.');
   await this.plugin.writerSnapshots.create(file,'Manual');new Notice('Versão salva.');
  },true);
  this.addButton(actions,'Nomear uma versão',async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
  this.addButton(actions,'Abrir histórico',async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
  if(file instanceof TFile&&file.extension==='md'){
   this.plugin.writerSnapshots.list(file).then(items=>{
    if(this.tab==='snapshots'&&panel.isConnected){
     const box=panel.createDiv({cls:'writer-tools-snapshot-recent'});
     box.createEl('strong',{text:items.length+' versão(ões) salva(s)'});
     for(const item of items.slice(0,5))box.createEl('p',{text:item.name+' · '+new Date(item.at).toLocaleString()});
    }
   }).catch(()=>{});
  }
 }
}
