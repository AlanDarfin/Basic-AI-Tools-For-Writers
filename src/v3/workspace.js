'use strict';
/* v3 sidebar for local writing tools; complements the existing AI and project panes. */
const WRITER_TOOLS_VIEW='basic-ai-writing-tools';
class WriterToolsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.tab='complements';}
 getViewType(){return WRITER_TOOLS_VIEW;}
 getDisplayText(){return writerUi("Ferramentas de escrita","Writing tools");}
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
  root.createEl('h3',{text:writerUi("Ferramentas de escrita","Writing tools")});
  const active=this.app.workspace.getActiveFile();
  root.createEl('p',{text:active?.extension==='md'?active.path:'Abra uma nota Markdown para usar as ferramentas.',cls:'writer-tools-note-path'});
  const tabs=root.createDiv({cls:'writer-tools-v3-tabs'});
  for(const [id,label] of [['complements',writerUi("Sugestões","Suggestions")],['variants',writerUi("Variantes","Variants")],['snapshots',writerUi("Versões","Versions")],['extras',writerUi('Extras','Extras')]]){
   const btn=tabs.createEl('button',{text:label,cls:this.tab===id?'is-active':''});
   btn.addEventListener('click',()=>{this.tab=id;this.render();});
  }
  const panel=root.createDiv({cls:'writer-tools-v3-panel'});
  if(this.tab==='complements')this.renderComplements(panel);
  if(this.tab==='variants')this.renderVariants(panel);
  if(this.tab==='snapshots')this.renderSnapshots(panel,active);
  if(this.tab==='extras')this.renderExtras(panel);
  const footer=root.createDiv({cls:'writer-tools-footer'});
  this.addButton(footer,writerUi("Revisão","Review"),()=>this.plugin.openReview());
  this.addButton(footer,writerUi("Projetos","Projects"),()=>this.plugin.openProjects());
  this.addButton(footer,writerUi("Configurações","Settings"),()=>{if(this.app.setting?.open){this.app.setting.open();this.app.setting.openTabById?.(this.plugin.manifest.id);}else new Notice(writerUi("Abra as configurações do Basic AI pelo menu do Obsidian.","Open Basic AI settings through Obsidian's settings menu."));});
 }
 renderComplements(panel){
  const opts=this.plugin.settings.complements||{};
  panel.createEl('h4',{text:'Autocomplete contextual'});
  panel.createEl('p',{text:writerUi("Sugestões locais do arquivo, do cofre, dos dicionários e de links internos.","Local suggestions from the current note, vault, dictionaries and internal links.")});
  new Setting(panel).setName(writerUi("Ativar sugestões","Enable suggestions")).addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi("Aparecer enquanto escreve","Suggest while typing")).addToggle(t=>t.setValue(opts.automatic!==false).onChange(async v=>{opts.automatic=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,writerUi("Mostrar sugestões","Show suggestions"),()=>this.plugin.writerComplements.manual(),true);
  this.addButton(actions,writerUi("Reindexar cofre","Reindex vault"),async()=>{this.plugin.writerComplements.reset();await this.plugin.writerComplements.rebuild();new Notice(writerUi("Índice de sugestões atualizado.","Suggestion index updated."));});
  this.addButton(actions,writerUi("Abrir dicionário","Open dictionary"),async()=>{await this.plugin.activateView();this.plugin.app.workspace.getLeavesOfType(VIEW)[0]?.view?.switchTab('definition');});
  const tracked=this.plugin.writerComplements?.cache?.size||0;
  panel.createEl('p',{text:tracked+' arquivo(s) no índice atual.',cls:'writer-tools-muted'});
 }
 renderVariants(panel){
  const opts=this.plugin.settings.variants||{};
  panel.createEl('h4',{text:writerUi("Alternativas de escrita","Writing alternatives")});
  panel.createEl('p',{text:'Experimente frases alternativas sem apagar o original. Toque numa variante destacada para editar.'});
  new Setting(panel).setName(writerUi("Ativar variantes","Enable variants")).addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,writerUi("Criar da seleção","Create from selection"),()=>this.plugin.writerVariants.createFromSelection(),true);
  this.addButton(actions,writerUi("Editar no cursor","Edit at cursor"),()=>this.plugin.writerVariants.open());
  this.addButton(actions,writerUi("Anterior","Previous"),()=>this.plugin.writerVariants.step(-1));
  this.addButton(actions,writerUi("Próxima","Next"),()=>this.plugin.writerVariants.step(1));
  this.addButton(actions,writerUi("Confirmar escolhida","Commit selected"),()=>this.plugin.writerVariants.commit());
  this.addButton(actions,writerUi("Confirmar todas","Commit all"),()=>this.plugin.writerVariants.commitAll());
  this.addButton(actions,writerUi("Gerar com IA","Generate with AI"),()=>this.plugin.writerVariants.aiAlternatives());
  const current=this.plugin.writerVariants.atCaret();
  if(current){
   panel.createEl('strong',{text:'Variante '+(current.found.active+1)+' de '+current.found.variants.length});
   const sample=panel.createDiv({cls:'writer-variant-current'});
   sample.setText(current.found.variants[current.found.active].slice(0,1000));
  }
 }

 renderExtras(panel){
  panel.addClass('writer-tools-extras');
  const tools=this.plugin.writerFinalFeatures,tts=this.plugin.settings.finalSuite?.tts||{};
  const unicode=panel.createDiv({cls:'writer-extras-card'});
  const unicodeHeader=unicode.createDiv({cls:'writer-extras-card-head'});
  unicodeHeader.createEl('h4',{text:writerUi('Símbolos Unicode','Unicode symbols')});
  unicodeHeader.createEl('p',{text:writerUi('Busque por nome, categoria ou U+XXXX. Salve seus símbolos favoritos.','Search by name, category or U+XXXX and save favorite symbols.')});
  const favorites=unicode.createDiv({cls:'writer-extras-favorites'});
  for(const char of (this.plugin.settings.finalSuite?.unicode?.favorites||[]).slice(0,12)){
   favorites.createEl('button',{text:char,attr:{'aria-label':'Insert '+char}}).addEventListener('click',()=>{
    const editor=this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if(editor)editor.replaceSelection(char);else tools.unicodePicker();
   });
  }
  const unicodeActions=unicode.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(unicodeActions,writerUi('Abrir pesquisa Unicode','Search Unicode'),()=>tools.unicodePicker(),true);
  const speech=panel.createDiv({cls:'writer-extras-card'});
  const speechHead=speech.createDiv({cls:'writer-extras-card-head'});
  speechHead.createEl('h4',{text:writerUi('Leitura em voz alta','Text-to-speech')});
  speechHead.createEl('p',{text:writerUi('Escolha a voz local ou uma voz neural online.','Use a local voice or a neural online voice.')});
  new Setting(speech).setName(writerUi('Mecanismo','Engine')).addDropdown(d=>{
   d.addOption('system',writerUi('Voz do sistema','System voice'));
   d.addOption('edge',writerUi('Microsoft Edge (online)','Microsoft Edge (online)'));
   d.setValue(tts.engine||'system').onChange(async value=>{
    tools.stop();tts.engine=value;await this.plugin.saveSettings();this.render();
   });
  });
  if(tts.engine==='edge'){
   const privacy=speech.createDiv({cls:'writer-tts-privacy'});
   privacy.createEl('p',{text:writerUi('Online: o texto selecionado ou a nota é enviado à Microsoft. Requer internet e pode ficar indisponível.','Online: selected text or the note is sent to Microsoft. Requires internet and may become unavailable.')});
   new Setting(privacy).setName(writerUi('Permitir processamento online','Allow online processing')).addToggle(t=>t.setValue(!!tts.allowOnline).onChange(async value=>{
    tts.allowOnline=value;if(!value)tools.stop();await this.plugin.saveSettings();
   }));
  }
  new Setting(speech).setName(writerUi('Idioma','Language')).addDropdown(d=>{
   for(const [key,label] of [['auto',writerUi('Automático','Auto')],['pt-BR','Português (Brasil)'],['pt-PT','Português (Portugal)'],['en-US','English (US)'],['en-GB','English (UK)'],['es-ES','Español'],['fr-FR','Français'],['de-DE','Deutsch'],['it-IT','Italiano'],['ja-JP','日本語'],['zh-CN','中文']])d.addOption(key,label);
   d.setValue(tts.language||'auto').onChange(async value=>{tts.language=value;await this.plugin.saveSettings();});
  });
  const status=speech.createDiv({cls:'writer-tts-current-status',text:writerUi('Pronto para ler','Ready to read')});
  const actions=speech.createDiv({cls:'writer-tools-v3-actions writer-tts-actions'});
  this.addButton(actions,writerUi('Ler','Read'),()=>tools.speakActive(),true);
  this.addButton(actions,writerUi('Pausar','Pause'),()=>tools.pause());
  this.addButton(actions,writerUi('Continuar','Resume'),()=>tools.resume());
  this.addButton(actions,writerUi('Parar','Stop'),()=>tools.stop());
  const nav=panel.createDiv({cls:'writer-extras-card writer-extras-navigation'});
  nav.createEl('h4',{text:writerUi('Projetos e organização','Projects & organization')});
  nav.createEl('p',{text:writerUi('Acesse rapidamente as tarefas do Longform.','Quick access to Longform project tasks.')});
  const links=nav.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(links,writerUi('Tarefas do projeto','Project tasks'),()=>this.plugin.openProjects('tasks'));
 }
 renderSnapshots(panel,file){
  const opts=this.plugin.settings.snapshots||{};
  panel.createEl('h4',{text:writerUi("Histórico e recuperação","History and recovery")});
  panel.createEl('p',{text:writerUi("Guarde versões da nota antes de revisões ou mudanças importantes. Os arquivos ficam no próprio cofre.","Keep note versions before revisions or important changes. They remain in your vault.")});
  new Setting(panel).setName(writerUi("Ativar snapshots","Enable snapshots")).addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,writerUi("Salvar versão agora","Save version now"),async()=>{
   if(!(file instanceof TFile)||file.extension!=='md')throw Error(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
   await this.plugin.writerSnapshots.create(file,'Manual');new Notice(writerUi("Versão salva.","Version saved."));
  },true);
  this.addButton(actions,'Nomear uma versão',async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
  this.addButton(actions,writerUi("Abrir histórico","Open history"),async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
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
  toggle('enabled',writerUi("Ativar sugestões","Enable suggestions"),'Todos os complementos funcionam localmente e sem rede.');
  toggle('automatic','Sugestões automáticas','Mostrar ao digitar.');
  toggle('currentFile',writerUi("Palavras do arquivo atual","Words from current note"));
  toggle('vault',writerUi("Palavras de outras notas do cofre","Words from other vault notes"));
  toggle('internalLinks',writerUi("Links internos","Internal links"),'Sugere títulos como wikilinks.');
  toggle('dictionaries',writerUi("Dicionários personalizados","Custom dictionaries"));
  toggle('useLocalDictionary','Usar Dicionario.md','Sem alterar seu formato.');
  toggle('frontmatter',writerUi("Propriedades YAML","YAML properties"),'Sugestões de nomes de propriedades.');
  toggle('caseSensitive',writerUi("Diferenciar maiúsculas de minúsculas","Case sensitive"));
  toggle('matchMiddle',writerUi("Corresponder dentro da palavra","Match inside words"),'Menos restritivo que prefixo.');
  toggle('learnRanking',writerUi("Aprender sugestões escolhidas","Learn from selected suggestions"),'Ranking armazenado localmente.');
  input('minChars',writerUi("Mínimo de caracteres","Minimum characters"),'Padrão: 3',true);
  input('maxResults',writerUi("Número máximo de sugestões","Maximum suggestions"),'Padrão: 8',true);
  input('maxFiles',writerUi("Máximo de arquivos no índice","Maximum indexed files"),'Limita uso de memória.',true);
  input('fileLimit',writerUi("Tamanho máximo por arquivo (bytes)","Maximum file size (bytes)"),'Padrão: 120000',true);
  new Setting(panel).setName(writerUi("Pastas excluídas","Excluded folders")).setDesc(writerUi("Separadas por vírgula.","Comma separated.")).addTextArea(t=>t.setValue(config.excludedFolders||'').onChange(async v=>{config.excludedFolders=v;await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi("Arquivos de dicionário","Dictionary files")).setDesc(writerUi("Caminhos Markdown separados por linha; linhas podem ter palavra => inserção.","Markdown paths separated by line. Entries may use word => insertion.")).addTextArea(t=>t.setValue(config.dictionaryPaths||'').onChange(async v=>{config.dictionaryPaths=v;await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi("Reindexar","Reindex")).addButton(b=>b.setButtonText(writerUi("Atualizar índice","Update index")).setCta().onClick(async()=>{plugin.writerComplements.reset();await plugin.writerComplements.rebuild();new Notice(writerUi("Índice atualizado.","Index updated."));}));
  new Setting(panel).setName(writerUi("Limpar aprendizado","Clear learning")).addButton(b=>b.setButtonText(writerUi("Limpar histórico","Clear history")).onClick(async()=>{config.usage={};await plugin.saveSettings();}));
 }else if(id==='variants'){
  toggle('enabled',writerUi("Ativar variantes","Enable variants"),'Usa sintaxe compatível com {{texto A|texto B}}^0.');
  toggle('decorate','Destacar variantes no editor');
  toggle('offerInReview','Oferecer variantes na revisão gramatical');
  toggle('snapshotBeforeCommit','Salvar versão antes de confirmar','Requer snapshots ativos.');
  toggle('confirmAll','Confirmar antes de aplicar todas');
  new Setting(panel).setName(writerUi("Instruções da IA para variantes","AI instructions for variants")).addTextArea(t=>{t.inputEl.rows=6;t.setValue(config.aiPrompt||'').onChange(async v=>{config.aiPrompt=v;await plugin.saveSettings();});});
  new Setting(panel).setName(writerUi("Abrir editor de variantes","Open variant editor")).addButton(b=>b.setButtonText(writerUi("Abrir ferramentas","Open tools")).setCta().onClick(()=>plugin.openWritingTools('variants')));
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
  new Setting(panel).setName(writerUi("Abrir histórico da nota","Open note history")).addButton(b=>b.setButtonText(writerUi("Abrir versões","Open versions")).setCta().onClick(async()=>{
   const file=plugin.app.workspace.getActiveFile();if(!file)return new Notice(writerUi("Abra uma nota.","Open a note."));
   await plugin.writerSnapshots.showHistory(file);
  }));
  panel.createEl('p',{text:writerUi("Históricos existentes do plugin Note Snapshots não são modificados. Esta integração mantém sua própria pasta .basic-ai-history e preserva dados anteriores.","Existing Note Snapshots histories are not modified. This integration uses its own .basic-ai-history folder and preserves older data."),cls:'dictionary-muted'});
 }
}
