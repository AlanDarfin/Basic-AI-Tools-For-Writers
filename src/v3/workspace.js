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
  this.addButton(footer,'Configurações',()=>{if(this.app.setting?.open){this.app.setting.open();this.app.setting.openTabById?.(this.plugin.manifest.id);}else new Notice('Abra as configurações do Basic AI pelo menu do Obsidian.');});
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

function writerRenderV3Settings(panel,plugin,id){
 const config=plugin.settings[id];if(!config)return;
 const title={complements:'Complementos e sugestões',variants:'Variações de escrita',snapshots:'Versionamento e snapshots'}[id];
 panel.createEl('h3',{text:title});
 const toggle=(key,name,description)=>{
  new Setting(panel).setName(name).setDesc(description||'').addToggle(t=>t.setValue(config[key]!==false).onChange(async v=>{config[key]=v;await plugin.saveSettings();}));
 };
 const input=(key,name,description,numeric=false)=>{
  new Setting(panel).setName(name).setDesc(description||'').addText(t=>{
   t.setValue(String(config[key]??'')).onChange(async v=>{config[key]=numeric?Math.max(0,Number(v)||0):v;await plugin.saveSettings();});
  });
 };
 if(id==='complements'){
  toggle('enabled','Ativar sugestões','Todos os complementos funcionam localmente e sem rede.');
  toggle('automatic','Sugestões automáticas','Mostrar ao digitar.');
  toggle('currentFile','Palavras do arquivo atual');
  toggle('vault','Palavras de outras notas do cofre');
  toggle('internalLinks','Links internos','Sugere títulos como wikilinks.');
  toggle('dictionaries','Dicionários personalizados');
  toggle('useLocalDictionary','Usar Dicionario.md','Sem alterar seu formato.');
  toggle('frontmatter','Propriedades YAML','Sugestões de nomes de propriedades.');
  toggle('caseSensitive','Diferenciar maiúsculas de minúsculas');
  toggle('matchMiddle','Corresponder dentro da palavra','Menos restritivo que prefixo.');
  toggle('learnRanking','Aprender sugestões escolhidas','Ranking armazenado localmente.');
  input('minChars','Mínimo de caracteres','Padrão: 3',true);
  input('maxResults','Número máximo de sugestões','Padrão: 8',true);
  input('maxFiles','Máximo de arquivos no índice','Limita uso de memória.',true);
  input('fileLimit','Tamanho máximo por arquivo (bytes)','Padrão: 120000',true);
  new Setting(panel).setName('Pastas excluídas').setDesc('Separadas por vírgula.').addTextArea(t=>t.setValue(config.excludedFolders||'').onChange(async v=>{config.excludedFolders=v;await plugin.saveSettings();}));
  new Setting(panel).setName('Arquivos de dicionário').setDesc('Caminhos Markdown separados por linha; linhas podem ter palavra => inserção.').addTextArea(t=>t.setValue(config.dictionaryPaths||'').onChange(async v=>{config.dictionaryPaths=v;await plugin.saveSettings();}));
  new Setting(panel).setName('Reindexar').addButton(b=>b.setButtonText('Atualizar índice').setCta().onClick(async()=>{plugin.writerComplements.reset();await plugin.writerComplements.rebuild();new Notice('Índice atualizado.');}));
  new Setting(panel).setName('Limpar aprendizado').addButton(b=>b.setButtonText('Limpar histórico').onClick(async()=>{config.usage={};await plugin.saveSettings();}));
 }else if(id==='variants'){
  toggle('enabled','Ativar variantes','Usa sintaxe compatível com {{texto A|texto B}}^0.');
  toggle('decorate','Destacar variantes no editor');
  toggle('offerInReview','Oferecer variantes na revisão gramatical');
  toggle('snapshotBeforeCommit','Salvar versão antes de confirmar','Requer snapshots ativos.');
  toggle('confirmAll','Confirmar antes de aplicar todas');
  new Setting(panel).setName('Instruções da IA para variantes').addTextArea(t=>{t.inputEl.rows=6;t.setValue(config.aiPrompt||'').onChange(async v=>{config.aiPrompt=v;await plugin.saveSettings();});});
  new Setting(panel).setName('Abrir editor de variantes').addButton(b=>b.setButtonText('Abrir ferramentas').setCta().onClick(()=>plugin.openWritingTools('variants')));
 }else if(id==='snapshots'){
  toggle('enabled','Ativar histórico local','Snapshots ficam no seu cofre e não são enviados para IA.');
  toggle('automatic','Snapshots automáticos','Por padrão, apenas snapshots manuais.');
  toggle('includeAttachments','Incluir anexos nos novos snapshots','Pode consumir bastante espaço. Restauração não sobrescreve anexos compartilhados.');
  toggle('snapshotBeforeRewrite','Criar snapshot antes de alterações','Correções, variantes e outros recursos integrados.');
  toggle('snapshotBeforeRestore','Criar snapshot antes de restaurar');
  input('store','Pasta do histórico','Caminho relativo ao cofre. Alterar a pasta não migra o histórico existente.');
  input('autoDelaySeconds','Intervalo entre snapshots automáticos (segundos)','Mínimo de 60.',true);
  input('maxPerNote','Limite de versões por nota','0 mantém todas. Exclusões automáticas não são reversíveis.',true);
  input('retentionDays','Retenção em dias','0 desativa limpeza por idade.',true);
  input('showDiffContext','Linhas de contexto no diff',null,true);
  new Setting(panel).setName('Abrir histórico da nota').addButton(b=>b.setButtonText('Abrir versões').setCta().onClick(async()=>{
   const file=plugin.app.workspace.getActiveFile();if(!file)return new Notice('Abra uma nota.');
   await plugin.writerSnapshots.showHistory(file);
  }));
  panel.createEl('p',{text:'Históricos existentes do plugin Note Snapshots não são modificados. Esta integração mantém sua própria pasta .basic-ai-history e preserva dados anteriores.',cls:'dictionary-muted'});
 }
}
