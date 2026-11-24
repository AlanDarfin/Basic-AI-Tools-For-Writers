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
  this.registerEvent(this.app.workspace.on('active-leaf-change',leaf=>{
   if(leaf!==this.leaf)this.render();
  }));
  this.registerEvent(this.app.workspace.on('file-open',()=>{
   if(this.noteFile()?.path!==this.renderedNotePath)this.render();
  }));
  this.render();
 }
 editorView(){
  const workspace=this.app.workspace,active=workspace.getActiveViewOfType(MarkdownView);
  const usable=view=>view?.file?.extension==='md'&&view.editor&&view.getMode?.()!=='preview';
  if(usable(active))return active;
  const leaves=workspace.getLeavesOfType('markdown'),recent=workspace.getMostRecentLeaf?.();
  if(recent&&leaves.includes(recent)&&usable(recent.view))return recent.view;
  const file=workspace.getActiveFile();
  const matches=leaves.filter(({view})=>usable(view)&&view.file===file);
  return matches.length===1?matches[0].view:null;
 }
 noteFile(){return this.editorView()?.file||this.app.workspace.getActiveFile();}
 addButton(container,label,fn,{primary=false,icon,refresh=false}={}){
  const button=container.createEl('button',{cls:primary?'mod-cta':'',attr:{type:'button'}});
  if(icon)writerSidebarButtonIcon(button,icon,label);
  else button.setText(label);
  button.addEventListener('click',async()=>{
   try{
    await fn();
    if(!refresh||!button.isConnected)return;
    const panel=button.closest('.writer-tools-v3-panel');
    if(!panel)return;
    const restoreFocus=button.ownerDocument.activeElement===button;
    this.renderSelectedTab(panel,this.noteFile());
    if(restoreFocus)Array.from(panel.querySelectorAll('.writer-tools-v3-actions>button'))
     .find(item=>item.textContent===label)?.focus({preventScroll:true});
   }
   catch(e){new Notice(e.message||String(e));}
  });
  return button;
 }
 render(){
  if(!this.root)return;
  const root=this.root;
  const previousTabs=root.querySelector('.writer-tools-v3-tabs');
  if(previousTabs)this.tabScrollLeft=previousTabs.scrollLeft;
  root.empty();
  const title=this.getDisplayText();
  const header=root.createDiv({cls:'writer-tools-v3-header'});
  header.createEl('h3',{text:title});
  const active=this.noteFile();
  this.renderedNotePath=active?.path;
  const note=active?.extension==='md'?active.path:'';
  header.createEl('p',{text:note||writerUi('Abra uma nota Markdown para usar as ferramentas.','Open a Markdown note to use the tools.'),cls:'writer-tools-note-path',attr:note?{title:note}:{}});
  const tabs=root.createDiv({cls:'writer-tools-v3-tabs writer-sidebar-tabs',attr:{role:'tablist','aria-label':title}});
  writerV136BindProjectTabs(tabs);
  tabs.addEventListener('scroll',()=>{
   if(tabs.isConnected)this.tabScrollLeft=tabs.scrollLeft;
  },{passive:true});
  tabs.addEventListener('wheel',event=>{
   if(tabs.scrollWidth>tabs.clientWidth&&Math.abs(event.deltaY)>Math.abs(event.deltaX)){
    tabs.scrollLeft+=event.deltaY;event.preventDefault();
   }
  },{passive:false});
  const sections=[
   ['complements',writerUi("Sugestões","Suggestions"),'complements','lightbulb'],
   ['variants',writerUi("Variantes","Variants"),'variants','git-compare'],
   ['reviewV4',writerUi('Diff e perfis','Diff & profiles'),'diff','scan-text'],
   ['snapshots',writerUi("Versões","Versions"),'snapshots','history'],
   ['extras',writerUi('Extras','Extras'),'extras','wrench']
  ].filter(([,label,feature])=>feature==='extras'
   ?['tts','unicode','projects'].some(id=>writerModuleOn(this.plugin,id))
   :writerModuleOn(this.plugin,feature));
  if(!sections.some(([id])=>id===this.tab))this.tab=sections[0]?.[0]||null;
  const prefix=this.writerTabPrefix??=('writer-tools-v3-'+(this.leaf?.id||Math.random().toString(36).slice(2)));
  const panelId=prefix+'-panel';
  const panel=root.createDiv({cls:'writer-tools-v3-panel',attr:{id:panelId,role:'tabpanel',tabindex:'0'}});
  const buttons={};
  const updateSelection=()=>{
   for(const [id,button] of Object.entries(buttons)){
    const selected=this.tab===id;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-selected',String(selected));
    button.tabIndex=selected?0:-1;
   }
   if(this.tab)panel.setAttribute('aria-labelledby',buttons[this.tab].id);
  };
  for(const [id,label,,icon] of sections){
   const btn=tabs.createEl('button',{attr:{type:'button',role:'tab',id:prefix+'-tab-'+id,
    'aria-controls':panelId,'aria-label':label,title:label}});
   writerSidebarButtonIcon(btn,icon,label,'writer-sidebar-tab-label');
   buttons[id]=btn;
   btn.addEventListener('click',()=>{
    if(this.tab===id)return;
    this.tabScrollLeft=tabs.scrollLeft;
    this.tab=id;
    updateSelection();
    this.renderSelectedTab(panel,this.noteFile());
   });
  }
  // Restore scroll after adding buttons; on an empty strip it clamps to zero.
  tabs.scrollLeft=Math.max(0,this.tabScrollLeft||0);
  panel.hidden=!this.tab;
  tabs.hidden=!this.tab;
  updateSelection();
  writerSidebarRevealSelected(tabs);
  this.renderSelectedTab(panel,active);
  const footer=root.createDiv({cls:'writer-tools-footer'});
  if(writerModuleOn(this.plugin,'review'))this.addButton(footer,writerUi("Revisão","Review"),()=>this.plugin.openReview(),{icon:'spell-check'});
  if(writerModuleOn(this.plugin,'projects'))this.addButton(footer,writerUi("Projetos","Projects"),()=>this.plugin.openProjects(),{icon:'folder-open'});
  this.addButton(footer,writerUi("Configurações","Settings"),()=>{if(this.app.setting?.open){this.app.setting.open();this.app.setting.openTabById?.(this.plugin.manifest.id);}else new Notice(writerUi("Abra as configurações do Basic pelo menu do Obsidian.","Open Basic settings through the Obsidian settings menu."));},{icon:'settings'});
 }
 renderSelectedTab(panel,active){
  panel.empty();
  panel.classList.toggle('writer-tools-extras',this.tab==='extras');
  if(this.tab==='complements')this.renderComplements(panel);
  else if(this.tab==='variants')this.renderVariants(panel);
  else if(this.tab==='reviewV4')this.renderV4(panel,active);
  else if(this.tab==='snapshots')this.renderSnapshots(panel,active);
  else if(this.tab==='extras')this.renderExtras(panel);
  writerMarkCompactSettings(panel);
 }
 renderComplements(panel){
  const opts=this.plugin.settings.complements||{};
  panel.createEl('h4',{text:writerUi('Autocomplete contextual','Contextual autocomplete')});
  panel.createEl('p',{text:writerUi("Sugestões locais do arquivo, do cofre, dos dicionários e de links internos.","Local suggestions from the current note, vault, dictionaries and internal links.")});
  new Setting(panel).setName(writerUi("Ativar sugestões","Enable suggestions")).addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi("Aparecer enquanto escreve","Suggest while typing")).addToggle(t=>t.setValue(opts.automatic!==false).onChange(async v=>{opts.automatic=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,writerUi("Mostrar sugestões","Show suggestions"),()=>this.plugin.writerComplements.manual(this.editorView()),{primary:true});
  if(writerModuleOn(this.plugin,'dictionary'))this.addButton(actions,writerUi("Abrir dicionário","Open dictionary"),async()=>{await this.plugin.activateView();this.plugin.app.workspace.getLeavesOfType(VIEW)[0]?.view?.switchTab('definition');});
 }
 renderVariants(panel){
  const opts=this.plugin.settings.variants||{};
  panel.createEl('h4',{text:writerUi("Alternativas de escrita","Writing alternatives")});
  panel.createEl('p',{text:writerUi('Experimente frases alternativas sem apagar o original. Toque numa variante destacada para editar.','Try alternative wording without deleting the original. Tap a highlighted variant to edit.')});
  new Setting(panel).setName(writerUi("Ativar variantes","Enable variants")).addToggle(t=>t.setValue(opts.enabled!==false).onChange(async v=>{opts.enabled=v;await this.plugin.saveSettings();}));
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(actions,writerUi("Criar da seleção","Create from selection"),()=>this.plugin.writerVariants.createFromSelection(this.editorView()),{primary:true});
  this.addButton(actions,writerUi("Editar no cursor","Edit at cursor"),()=>this.plugin.writerVariants.open(this.editorView()));
  this.addButton(actions,writerUi("Gerar com IA","Generate with AI"),()=>this.plugin.writerVariants.aiAlternatives(this.editorView()),{refresh:true});
  const current=this.plugin.writerVariants.atCaret(this.editorView());
  const selection=panel.createDiv({cls:'writer-tools-v3-preview'});
  if(current){
   const {active,variants}=current.found;
   selection.createEl('h5',{text:writerUi(`Variante ${active+1} de ${variants.length}`,`Variant ${active+1} of ${variants.length}`)});
   selection.createDiv({cls:'writer-variant-current',text:variants[active].slice(0,1000)});
  }
  const navigation=selection.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(navigation,writerUi("Anterior","Previous"),()=>this.plugin.writerVariants.step(-1,this.editorView()),{icon:'chevron-left',refresh:true});
  this.addButton(navigation,writerUi("Próxima","Next"),()=>this.plugin.writerVariants.step(1,this.editorView()),{icon:'chevron-right',refresh:true});
  this.addButton(navigation,writerUi("Confirmar escolhida","Commit selected"),()=>this.plugin.writerVariants.commit(this.editorView()),{refresh:true});
  this.addButton(navigation,writerUi("Confirmar todas","Commit all"),()=>this.plugin.writerVariants.commitAll(this.editorView()));
 }

 renderV4(panel,file){
  panel.createEl('h4',{text:writerUi('Revisão seletiva','Selective review')});
  panel.createEl('p',{text:writerUi('Selecione um trecho na nota, compare as propostas e aceite somente as alterações desejadas. A nota original permanece intacta até você aplicar.','Select a passage, compare the suggestions and accept only the changes you want. Your note stays unchanged until you apply.'),cls:'writer-tools-muted'});
  const profile=file?writerV4Profile(this.plugin,file):null;
  const profileInfo=panel.createDiv({cls:'writer-tools-v3-preview'});
  profileInfo.createEl('h5',{text:writerUi('Perfil ativo','Active profile')});
  profileInfo.createEl('p',{text:profile?.name||writerUi('Padrão','Default')});
  const buttons=panel.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(buttons,writerUi('Abrir revisão seletiva','Open selective review'),()=>writerV4OpenDiff(this.plugin,{view:this.editorView()}),{primary:true});
  this.addButton(buttons,writerUi('Configurar perfis','Configure profiles'),()=>{
   if(this.app.setting?.open){this.plugin.settingsTabV4Hint=true;this.app.setting.open();this.app.setting.openTabById?.(this.plugin.manifest.id);}
   else new Notice(writerUi('Abra as configurações do plugin.','Open the plugin settings.'));
  });
  panel.createEl('p',{text:writerUi('A geração de alternativas usa seu provedor de IA apenas quando você clicar em Gerar com IA no comparador.','AI generation uses your configured provider only after you choose Generate with AI in the comparator.'),cls:'writer-tools-muted'});
 }
 renderExtras(panel){
  const tools=this.plugin.writerFinalFeatures,tts=this.plugin.settings.finalSuite?.tts||{};
  const unicode=panel.createDiv({cls:'writer-extras-card'});
  const unicodeHeader=unicode.createDiv({cls:'writer-extras-card-head'});
  unicodeHeader.createEl('h4',{text:writerUi('Símbolos Unicode','Unicode symbols')});
  unicodeHeader.createEl('p',{text:writerUi('Busque por nome, categoria ou U+XXXX. Salve seus símbolos favoritos.','Search by name, category or U+XXXX and save favorite symbols.')});
  const favorites=unicode.createDiv({cls:'writer-extras-favorites'});
  for(const char of (this.plugin.settings.finalSuite?.unicode?.favorites||[]).slice(0,12)){
   favorites.createEl('button',{text:char,attr:{'aria-label':'Insert '+char}}).addEventListener('click',()=>{
    const editor=this.editorView()?.editor;
    if(editor)editor.replaceSelection(char);else tools.unicodePicker();
   });
  }
  const unicodeActions=unicode.createDiv({cls:'writer-tools-v3-actions'});
  this.addButton(unicodeActions,writerUi('Abrir pesquisa Unicode','Search Unicode'),()=>tools.unicodePicker(),{primary:true});
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
  if(tts.engine!=='edge'){
   const support=speech.createDiv({cls:'writer-tts-support'});
   support.createEl('p',{text:tools.systemSpeechStatus(),cls:'writer-tts-system-diagnostic'});
   const diagnostics=support.createDiv({cls:'writer-tools-v3-actions'});
   this.addButton(diagnostics,writerUi('Verificar vozes','Check voices'),()=>tools.refreshVoiceSelectors(),{refresh:true});
  }
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
  this.addButton(actions,writerUi('Ler','Read'),()=>tools.speakActive(),{primary:true});
  this.addButton(actions,writerUi('Pausar','Pause'),()=>tools.pause());
  this.addButton(actions,writerUi('Continuar','Resume'),()=>tools.resume());
  this.addButton(actions,writerUi('Parar','Stop'),()=>tools.stop());
  if(!writerModuleOn(this.plugin,'projects'))return;
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
   if(file!==this.noteFile()){
    this.render();
    throw Error(writerUi('A nota mudou. Confira a nota ativa e salve novamente.','The note changed. Check the active note and save again.'));
   }
   await this.plugin.writerSnapshots.create(file,writerUi('Manual','Manual'));
   new Notice(writerUi('Versão salva.','Version saved.'));
  },{primary:true,refresh:true});
  this.addButton(actions,writerUi('Nomear uma versão','Name a version'),async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
  this.addButton(actions,writerUi("Abrir histórico","Open history"),async()=>{if(!file)return;await this.plugin.writerSnapshots.showHistory(file);});
  if(file instanceof TFile&&file.extension==='md'){
   const box=panel.createDiv({cls:'writer-tools-v3-preview writer-tools-snapshot-recent'});
   box.hidden=true;
   this.plugin.writerSnapshots.list(file).then(items=>{
    if(!box.isConnected)return;
    box.createEl('h5',{text:items.length+writerUi(' versão(ões) salva(s)',' saved version(s)')});
    for(const item of items.slice(0,5))box.createEl('p',{text:item.name+' · '+new Date(item.at).toLocaleString()});
    box.hidden=false;
   }).catch(()=>{});
  }
 }
}

function writerRenderV3Settings(panel,plugin,id){
 const config=plugin.settings[id];if(!config)return;
 const title={complements:writerUi('Complementos e sugestões','Complements and suggestions'),variants:writerUi('Variações de escrita','Writing variants'),snapshots:writerUi('Versionamento e snapshots','Versioning and snapshots')}[id];
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
  toggle('enabled',writerUi("Ativar sugestões","Enable suggestions"),writerUi('Todos os complementos funcionam localmente e sem rede.','All completion sources work locally without network access.'));
  toggle('automatic',writerUi('Sugestões automáticas','Automatic suggestions'),writerUi('Mostrar ao digitar.','Show while typing.'));
  toggle('currentFile',writerUi("Palavras do arquivo atual","Words from current note"));
  toggle('vault',writerUi("Palavras de outras notas do cofre","Words from other vault notes"));
  toggle('internalLinks',writerUi("Links internos","Internal links"),writerUi('Sugere títulos como wikilinks.','Suggest note titles as wikilinks.'));
  toggle('dictionaries',writerUi("Dicionários personalizados","Custom dictionaries"));
  toggle('useLocalDictionary',writerUi('Usar Dicionario.md','Use Dicionario.md'),writerUi('Sem alterar seu formato.','Without changing its format.'));
  toggle('frontmatter',writerUi("Propriedades YAML","YAML properties"),writerUi('Sugestões de nomes de propriedades.','Suggest property names.'));
  toggle('caseSensitive',writerUi("Diferenciar maiúsculas de minúsculas","Case sensitive"));
  toggle('matchMiddle',writerUi("Corresponder dentro da palavra","Match inside words"),writerUi('Menos restritivo que prefixo.','Less restrictive than prefix matching.'));
  toggle('learnRanking',writerUi("Aprender sugestões escolhidas","Learn from selected suggestions"),writerUi('Ranking armazenado localmente.','Ranking stored locally.'));
  input('minChars',writerUi("Mínimo de caracteres","Minimum characters"),writerUi('Padrão: 3','Default: 3'),true);
  input('maxResults',writerUi("Número máximo de sugestões","Maximum suggestions"),writerUi('Padrão: 8','Default: 8'),true);
  input('fileLimit',writerUi("Máximo de texto analisado por nota (caracteres)","Maximum sampled text per note (characters)"),writerUi('Notas grandes usam início e fim; todas as notas elegíveis são incluídas.','Large notes use beginning and end; all eligible notes are covered.'),true);
  new Setting(panel).setName(writerUi("Pastas excluídas","Excluded folders")).setDesc(writerUi("Separadas por vírgula.","Comma separated.")).addTextArea(t=>t.setValue(config.excludedFolders||'').onChange(async v=>{config.excludedFolders=v;await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi("Arquivos de dicionário","Dictionary files")).setDesc(writerUi("Caminhos Markdown separados por linha; linhas podem ter palavra => inserção.","Markdown paths separated by line. Entries may use word => insertion.")).addTextArea(t=>t.setValue(config.dictionaryPaths||'').onChange(async v=>{config.dictionaryPaths=v;await plugin.saveSettings();}));
  const stats=plugin.writerComplements?.indexStats;
  const indexInfo=panel.createEl('p',{cls:'setting-item-description writer-tools-index-stats',
   text:stats
    ?writerUi('Arquivos Markdown elegíveis: ','Eligible Markdown notes: ')+stats.eligible+
      writerUi(' · indexados: ',' · indexed: ')+stats.indexed+
      writerUi(' · falhas: ',' · failures: ')+stats.failed+
      writerUi(' · parcialmente analisados: ',' · partially sampled: ')+stats.partial
    :writerUi('Índice ainda não criado.','Index not built yet.')});
  new Setting(panel).setName(writerUi("Índice do cofre","Vault index"))
   .setDesc(writerUi('Reindexe aqui; a lista de arquivos excluídos fica acima. O índice não altera notas.','Rebuild here; excluded folders are configured above. The index does not modify notes.'))
   .addButton(b=>b.setButtonText(writerUi("Atualizar índice","Update index")).setCta().onClick(async()=>{
    b.setDisabled(true);
    try{
     plugin.writerComplements.reset();
     await plugin.writerComplements.rebuild();
     const result=plugin.writerComplements.indexStats;
     indexInfo.setText(result
      ?writerUi('Arquivos elegíveis: ','Eligible notes: ')+result.eligible+
        writerUi(' · indexados: ',' · indexed: ')+result.indexed+
        writerUi(' · falhas: ',' · failures: ')+result.failed+
        writerUi(' · analisados parcialmente: ',' · partially sampled: ')+result.partial
      :writerUi('Índice indisponível.','Index unavailable.'));
     new Notice(writerUi('Índice atualizado.','Index updated.'));
    }catch(error){new Notice(error?.message||String(error));}
    finally{b.setDisabled(false);}
   }));
  new Setting(panel).setName(writerUi("Limpar aprendizado","Clear learning")).addButton(b=>b.setButtonText(writerUi("Limpar histórico","Clear history")).onClick(async()=>{config.usage={};await plugin.saveSettings();}));
 }else if(id==='variants'){
  toggle('enabled',writerUi("Ativar variantes","Enable variants"),writerUi('Usa sintaxe compatível com {{texto A|texto B}}^0.','Uses syntax compatible with {{text A|text B}}^0.'));
  toggle('decorate',writerUi('Destacar variantes no editor','Highlight variants in editor'));
  toggle('offerInReview',writerUi('Oferecer variantes na revisão gramatical','Offer variants in grammar review'));
  toggle('snapshotBeforeCommit',writerUi('Salvar versão antes de confirmar','Save version before confirming'),writerUi('Requer snapshots ativos.','Requires snapshots enabled.'));
  toggle('confirmAll',writerUi('Confirmar antes de aplicar todas','Confirm before applying all'));
  new Setting(panel).setName(writerUi("Instruções da IA para variantes","AI instructions for variants")).addTextArea(t=>{t.inputEl.rows=6;t.setValue(config.aiPrompt||'').onChange(async v=>{config.aiPrompt=v;await plugin.saveSettings();});});
  new Setting(panel).setName(writerUi("Abrir editor de variantes","Open variant editor")).addButton(b=>b.setButtonText(writerUi("Abrir ferramentas","Open tools")).setCta().onClick(()=>plugin.openWritingTools('variants')));
 }else if(id==='snapshots'){
  toggle('enabled',writerUi('Ativar histórico local','Enable local history'),writerUi('Snapshots ficam no seu cofre e não são enviados para IA.','Snapshots stay in your vault and are not sent to AI.'));
  toggle('automatic',writerUi('Snapshots automáticos','Automatic snapshots'),writerUi('Por padrão, apenas snapshots manuais.','By default, only manual snapshots.'));
  toggle('includeAttachments',writerUi('Incluir anexos nos novos snapshots','Include attachments in new snapshots'),writerUi('Pode consumir bastante espaço. Restauração não sobrescreve anexos compartilhados.','May use significant space. Restoring never overwrites shared attachments.'));
  toggle('snapshotBeforeRewrite',writerUi('Criar snapshot antes de alterações','Snapshot before edits'),writerUi('Correções, variantes e outros recursos integrados.','Corrections, variants and other integrated features.'));
  toggle('snapshotBeforeRestore',writerUi('Criar snapshot antes de restaurar','Snapshot before restoring'));
  input('store',writerUi('Pasta do histórico','History folder'),writerUi('Caminho relativo ao cofre. Alterar a pasta não migra o histórico existente.','Path relative to the vault. Changing the folder does not move existing history.'));
  input('autoDelaySeconds',writerUi('Intervalo entre snapshots automáticos (segundos)','Interval between automatic snapshots (seconds)'),writerUi('Mínimo de 60.','Minimum 60.'),true);
  input('maxPerNote',writerUi('Limite de versões por nota','Version limit per note'),writerUi('0 mantém todas. Exclusões automáticas não são reversíveis.','0 keeps all. Automatic deletions cannot be undone.'),true);
  input('retentionDays',writerUi('Retenção em dias','Retention in days'),writerUi('0 desativa limpeza por idade.','0 disables age-based cleanup.'),true);
  input('showDiffContext',writerUi('Linhas de contexto no diff','Context lines in diff'),null,true);
  new Setting(panel).setName(writerUi("Abrir histórico da nota","Open note history")).addButton(b=>b.setButtonText(writerUi("Abrir versões","Open versions")).setCta().onClick(async()=>{
   const file=plugin.app.workspace.getActiveFile();if(!file)return new Notice(writerUi("Abra uma nota.","Open a note."));
   await plugin.writerSnapshots.showHistory(file);
  }));
  panel.createEl('p',{text:writerUi("Históricos existentes do plugin Note Snapshots não são modificados. Esta integração mantém sua própria pasta .basic-ai-history e preserva dados anteriores.","Existing Note Snapshots histories are not modified. This integration uses its own .basic-ai-history folder and preserves older data."),cls:'dictionary-muted'});
 }
}
