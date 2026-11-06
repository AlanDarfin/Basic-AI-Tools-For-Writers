'use strict';
/* Basic 12.0.1: feature-centered settings. The existing Basic settings tab
 * owns navigation; these renderers never create a second settings panel. */
function writerV1201SettingToggle(plugin,panel,key,pt,en,description){
 const cfg=writerV12Config(plugin);
 return new Setting(panel).setName(writerUi(pt,en))
  .setDesc(writerUi(description?.[0]||'',description?.[1]||''))
  .addToggle(toggle=>toggle.setValue(cfg[key]!==false)
   .onChange(async value=>{
    cfg[key]=value;await plugin.saveSettings();
    if(key==='folderFocus')writerV12FocusRefresh(plugin);
   }));
}
function writerV1201SettingsOverview(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Toolkit e suítes','Toolkit and suites')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Cada recurso está organizado em uma categoria própria. As configurações antigas foram preservadas, sem recriar dados ou perfis.',
  'Each feature has its own category. Previous settings and data are preserved.')});
 new Setting(panel).setName(writerUi('Ativar Toolkit v12','Enable v12 toolkit'))
  .setDesc(writerUi('Controle geral para os recursos da v12.','Global switch for v12 features.'))
  .addToggle(t=>t.setValue(cfg.enabled!==false).onChange(async v=>{
   cfg.enabled=v;await plugin.saveSettings();writerV12FocusRefresh(plugin);
  }));
 const pages=[
  ['v12Writing','pen-line','Escrita e ações rápidas','Writing and quick actions'],
  ['v12Images','image','Imagens e anotações','Images and annotations'],
  ['v12Tasks','list-checks','Tarefas e captura','Tasks and capture'],
  ['v12Privacy','lock-keyhole','Notas protegidas','Protected notes'],
  ['v12Reader','volume-2','Leitura e TTS','Reading and TTS'],
  ['v12Connections','git-branch','Integrações e sincronização','Integrations and synchronization'],
  ['suiteEducation','graduation-cap','Unique Suite · estudos','Unique Suite · studies'],
  ['suiteDatabase','table','Notion Suite · bases','Notion Suite · databases'],
  ['suiteNumbering','list-ordered','Number Suite · numeração','Number Suite · numbering'],
  ['suiteLongform','book-open','Longform Studio','Longform Studio']
 ];
 for(const [id,icon,pt,en] of pages){
  new Setting(panel).setName(writerUi(pt,en)).addButton(b=>b
   .setIcon('chevron-right').setTooltip(writerUi('Abrir configurações','Open settings'))
   .onClick(()=>{
    const tab=plugin.writerSettingsTab;
    if(!tab)return;
    tab.activeSettingsTab=id;tab.display();
   }));
 }
}
function writerV1201SettingsWriting(plugin,panel){
 panel.createEl('h3',{text:writerUi('Escrita e ações rápidas','Writing and quick actions')});
 writerV1201SettingToggle(plugin,panel,'palette','Paleta de formatação','Formatting palette',
  ['65 ações de Markdown, callouts e inserções.','65 Markdown, callout and insertion actions.']);
 writerV1201SettingToggle(plugin,panel,'localInbox','Captura e brainstorm local','Local capture and brainstorm',
  ['Novas notas Markdown, sem serviço externo.','New Markdown notes, without external services.']);
 writerV1201SettingToggle(plugin,panel,'folderFocus','Foco na pasta do explorador','Explorer folder focus',
  ['Apenas visual; não bloqueia o acesso aos arquivos.','Visual only; does not restrict file access.']);
 new Setting(panel).setName(writerUi('Atalhos do ribbon do Basic','Basic ribbon shortcuts'))
  .setDesc(writerUi('Menu próprio: leitura, formatação, foco e integrações, sem depender do Ultimate Toolkit.',
   'Basic-owned menu for reading, formatting, focus and integrations.'))
  .addButton(b=>b.setButtonText(writerUi('Abrir menu','Open menu'))
   .onClick(()=>writerV1201QuickMenu(plugin)));
}
function writerV1201SettingsImages(plugin,panel){
 panel.createEl('h3',{text:writerUi('Imagens e anotações','Images and annotations')});
 writerV1201SettingToggle(plugin,panel,'imageTools','Visualizador e tamanhos de imagens','Image viewer and resizing',
  ['Inclui visualização ampliada e normalização confirmada de largura.','Includes zoom preview and confirmed width normalization.']);
 if(typeof writerV12AnnotationSettings==='function')writerV12AnnotationSettings(plugin,panel);
 new Setting(panel).setName(writerUi('Anotar imagem local','Annotate local image'))
  .setDesc(writerUi('Salva um novo PNG e preserva o arquivo original.','Saves a new PNG, keeping the original file.'))
  .addButton(b=>b.setButtonText(writerUi('Escolher imagem','Choose image'))
   .onClick(()=>writerV12AnnotatePick(plugin)));
}
function writerV1201SettingsTasks(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Tarefas, Inbox e brainstorm','Tasks, Inbox and brainstorm')});
 writerV1201SettingToggle(plugin,panel,'taskNavigator','Navegador de tarefas','Task navigator',
  ['Leitura e edição com verificação de alterações concorrentes.','Read and edit with concurrent-change checks.']);
 new Setting(panel).setName(writerUi('Máximo de notas pesquisadas','Maximum notes to scan'))
  .addSlider(s=>s.setLimits(25,1000,25).setDynamicTooltip().setValue(cfg.maxTaskFiles)
   .onChange(async v=>{cfg.maxTaskFiles=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Workbench de tarefas','Task workbench'))
  .setDesc(writerUi('Agrupa por etiqueta, filtra e permite marcar tarefas.','Group by tag, filter and toggle tasks.'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open'))
   .onClick(()=>writerV12TaskWorkbench(plugin)));
 new Setting(panel).setName(writerUi('Nova captura rápida','New quick capture'))
  .addButton(b=>b.setButtonText(writerUi('Criar','Create'))
   .onClick(()=>writerV12Capture(plugin,false)));
 new Setting(panel).setName(writerUi('Nova sessão de ideias','New brainstorm'))
  .addButton(b=>b.setButtonText(writerUi('Criar','Create'))
   .onClick(()=>writerV12Capture(plugin,true)));
}
function writerV1201SettingsPrivacy(plugin,panel){
 const cfg=writerV12Config(plugin);
 if(typeof writerV12SecureSettings==='function')writerV12SecureSettings(plugin,panel);
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Criptografia somente do conteúdo de novos arquivos. Títulos, nomes e pastas continuam visíveis.',
  'Content-only encryption of new files. Titles, filenames and folders stay visible.')});
 new Setting(panel).setName(writerUi('Criar nota protegida','Create protected note'))
  .addButton(b=>b.setButtonText(writerUi('Criar','Create'))
   .setDisabled(cfg.secureNotes!==true).onClick(()=>writerV12SecureCreate(plugin)));
 new Setting(panel).setName(writerUi('Abrir nota protegida','Open protected note'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open'))
   .setDisabled(cfg.secureNotes!==true).onClick(()=>writerV12SecureRead(plugin)));
}
function writerV1201SettingsReader(plugin,panel){
 panel.createEl('h3',{text:writerUi('Leitura e voz','Reading and voice')});
 if(typeof writerV12ReaderSettings==='function')writerV12ReaderSettings(plugin,panel);
 if(typeof writerV107SpeechSettings==='function')writerV107SpeechSettings(plugin,panel);
 new Setting(panel).setName(writerUi('Controles de voz local','Local speech controls'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open'))
   .onClick(()=>typeof writerV107SpeechPanel==='function'&&writerV107SpeechPanel(plugin)));
}
function writerV1201SettingsConnections(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Integrações e sincronização','Integrations and synchronization')});
 writerV1201SettingToggle(plugin,panel,'integrations','Central de integrações','Integration center',
  ['Comandos dos plugins externos exigem instalação separada.','External plugin commands require separate installation.']);
 new Setting(panel).setName(writerUi('Provedor manual de sincronização','Manual synchronization provider'))
  .setDesc(writerUi('Selecionar aqui não desativa sincronizadores externos automáticos.',
   'Selecting a provider does not disable external automatic sync jobs.'))
  .addDropdown(d=>{
   for(const id of WRITER_V12_SYNC){
    const label=id==='none'?writerUi('Nenhum','None'):WRITER_V12_COMPANIONS.find(x=>x.id===id)?.name||id;
    d.addOption(id,label);
   }
   d.setValue(cfg.syncProvider).onChange(async value=>{cfg.syncProvider=value;await plugin.saveSettings();});
  });
 for(const item of WRITER_V12_COMPANIONS){
  const installed=writerV12CompanionInstalled(plugin,item.id);
  new Setting(panel).setName(item.name).setDesc(installed?
   writerUi('Plugin externo instalado e ativo.','External plugin installed and active.'):
   writerUi('Exige instalar e ativar o plugin original.','Requires installing and enabling the original plugin.'));
 }
 new Setting(panel).setName(writerUi('Central de integrações','Integration center'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open'))
   .onClick(()=>writerV12OpenIntegrationHub(plugin)));
 new Setting(panel).setName(writerUi('Inspecionar conflitos','Inspect conflicts'))
  .addButton(b=>b.setButtonText(writerUi('Inspecionar','Inspect'))
   .onClick(()=>writerV12ConflictViewer(plugin)));
}
function writerV1201SettingsSuite(plugin,panel,id){
 const functions={
  suiteEducation:['Unique Suite · estudos e horários','Unique Suite · study tools',
   ['writerV1011StudySettings']],
  suiteDatabase:['Notion Suite · bancos e visualizações','Notion Suite · databases and views',
   ['writerV1011NotionSettings','writerV111DbBuilderSettings']],
  suiteNumbering:['Number Suite · numeração','Number Suite · numbering',
   ['writerV1011NumberSettings','writerV111NumberSettings']],
  suiteLongform:['Longform Studio · escrita e projetos','Longform Studio · writing and projects',
   ['writerV11StudioSettings']]
 };
 const row=functions[id];
 if(!row)return;
 panel.createEl('h3',{text:writerUi(row[0],row[1])});
 for(const name of row[2]){
  // Names are mapped explicitly; never resolve arbitrary setting callbacks.
  const render={
   writerV1011StudySettings:()=>writerV1011StudySettings(plugin,panel),
   writerV1011NotionSettings:()=>writerV1011NotionSettings(plugin,panel),
   writerV111DbBuilderSettings:()=>writerV111DbBuilderSettings(plugin,panel),
   writerV1011NumberSettings:()=>writerV1011NumberSettings(plugin,panel),
   writerV111NumberSettings:()=>writerV111NumberSettings(plugin,panel),
   writerV11StudioSettings:()=>writerV11StudioSettings(plugin,panel)
  }[name];
  try{render?.();}
  catch(error){console.error('[Basic] Suite settings:',name,error);}
 }
}
