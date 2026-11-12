'use strict';
/* Explicit adapters for audited companion plugins. Never install, sync or send on load. */
const WRITER_COMPANION_VIEW='basic-connected-plugins';
function writerCompanionCatalog(){
 const groups=[typeof WRITER_COMPANION_TOOLKIT_SPECS!=='undefined'?WRITER_COMPANION_TOOLKIT_SPECS:[],
  typeof WRITER_COMPANION_NOTES!=='undefined'?WRITER_COMPANION_NOTES:[],
  typeof WRITER_COMPANION_SYNC!=='undefined'?WRITER_COMPANION_SYNC:[],
  typeof WRITER_COMPANION_GRAMMAR!=='undefined'?WRITER_COMPANION_GRAMMAR:[]];
 return groups.flat().map(item=>({...item,repository:item.repository||item.repo||item.source?.repo,
  revision:item.revision||item.source?.sha,version:item.version||item.source?.version,
  settingsTabId:item.settingsTabId||item.id,actions:(item.actions||item.commands||[]).map(action=>({...action,
   command:action.command||(action.id?.includes(':')?action.id:item.id+':'+action.id),requiresEditor:action.requiresEditor||action.editor||action.kind==='speech',requiresSelection:action.requiresSelection||action.id==='ahmed-toolkit:flowkit-tts-play-selection',effect:action.effect||action.kind||'panel'}))}));
}
function writerCompanionConfig(plugin){
 const old=plugin.settings.companionCompatibility;
 const cfg=plugin.settings.companionCompatibility=old&&typeof old==='object'&&!Array.isArray(old)?old:{};
 if(!cfg.enabledById||typeof cfg.enabledById!=='object'||Array.isArray(cfg.enabledById))cfg.enabledById={};
 for(const item of writerCompanionCatalog())if(typeof cfg.enabledById[item.id]!=='boolean')cfg.enabledById[item.id]=true;
 if(!['basic','ahmed-toolkit'].includes(cfg.ttsProvider))cfg.ttsProvider='basic';
 if(!['right','left','tab'].includes(cfg.panelPlacement))cfg.panelPlacement='right';
 if(!['companion','basic','both'].includes(cfg.explorerIcons))cfg.explorerIcons='companion';
 if(typeof cfg.mobileLayout!=='boolean')cfg.mobileLayout=true;
 if(typeof cfg.showLaunchers!=='boolean')cfg.showLaunchers=true;
 if(typeof cfg.allowToolkitOnline!=='boolean')cfg.allowToolkitOnline=false;
 return cfg;
}
function writerCompanionMobile(plugin){return plugin.app?.isMobile===true||(typeof Platform!=='undefined'&&Platform.isMobile===true);}
function writerCompanionEnabled(plugin,id){
 const item=writerCompanionCatalog().find(item=>item.id===id);
 return !!item&&writerV12On(plugin,'integrations')&&writerCompanionConfig(plugin).enabledById[id]!==false&&
  !!plugin.app.plugins?.plugins?.[id]&&!(item.mobile===false&&writerCompanionMobile(plugin));
}
function writerCompanionCommands(plugin){return plugin.app.commands?.commands||{};}
function writerCompanionViewAvailable(plugin,type){
 const registry=plugin.app.viewRegistry||plugin.app.workspace.viewRegistry;
 const views=registry?.viewByType;
 return views instanceof Map?views.has(type):!!views?.[type];
}
function writerCompanionActionAvailable(plugin,item,action){
 if(!writerCompanionEnabled(plugin,item.id)||!writerCompanionCommands(plugin)[action.command])return false;
 if(action.desktopOnly&&writerCompanionMobile(plugin))return false;
 if(item.id==='languagetool'&&typeof writerLanguageToolEnabled==='function'&&!writerLanguageToolEnabled(plugin))return false;
 if(action.requiresSetting&&plugin.app.plugins.plugins[item.id]?.settings?.[action.requiresSetting]!==true)return false;
 if(action.module&&typeof writerModuleOn==='function'&&!writerModuleOn(plugin,action.module))return false;
 if(item.role==='sync'&&typeof writerCompanionSyncActionAvailable==='function'&&
  !writerCompanionSyncActionAvailable(plugin,item.id,action.id))return false;
 return true;
}
function writerCompanionEditorContext(plugin){
 const ws=plugin.app.workspace,active=ws.activeLeaf;
 const leaves=ws.getLeavesOfType?.('markdown')||[],recent=ws.getMostRecentLeaf?.(),last=plugin._writerCompanionEditorContext;
 const leaf=active?.view?.editor&&active.view.file?active:
  recent?.view?.editor&&recent.view.file&&leaves.includes(recent)?recent:
  last&&leaves.includes(last.leaf)&&last.leaf.view?.editor===last.editor&&last.leaf.view.file?.path===last.path?last.leaf:
  leaves.find(leaf=>leaf.view?.file?.path===ws.getActiveFile?.()?.path&&leaf.view?.editor);
 return leaf?{leaf,editor:leaf.view.editor,path:leaf.view.file.path}:null;
}
async function writerCompanionRun(plugin,id,actionId,context){
 const item=writerCompanionCatalog().find(item=>item.id===id),action=item?.actions.find(action=>action.id===actionId);
 if(!action||!writerCompanionActionAvailable(plugin,item,action))return false;
 if(item.role==='sync'&&['sync','network'].includes(action.effect)&&writerV12Config(plugin).syncProvider!==id){
  new Notice(writerUi('Selecione este provedor de sincronização primeiro.','Select this synchronization provider first.'));return false;
 }
 if(action.requiresEditor){
  const saved=context||writerCompanionEditorContext(plugin),live=plugin.app.workspace.getLeavesOfType?.('markdown')||[];
  if(!saved||!live.includes(saved.leaf)||saved.leaf.view?.editor!==saved.editor||saved.leaf.view.file?.path!==saved.path){
   new Notice(writerUi('Abra a nota no editor e tente novamente.','Open the note in the editor and try again.'));return false;
  }
  if(action.requiresSelection&&!saved.editor.getSelection?.().trim()){
   new Notice(writerUi('Selecione o texto na nota primeiro.','Select text in the note first.'));return false;
  }
  if(item.id==='ahmed-toolkit'&&action.kind==='speech'){
   const raw=action.command.endsWith('play-selection')?saved.editor.getSelection?.():
    action.command.endsWith('play-from-cursor')?saved.editor.getValue?.().slice(saved.editor.posToOffset(saved.editor.getCursor())):saved.editor.getValue?.();
   return writerCompanionSpeechStart(plugin,raw||'',saved.leaf.view.file.basename);
  }
  try{await plugin.app.workspace.setActiveLeaf(saved.leaf,{focus:true});}catch(_){return false;}
  if(!writerCompanionActionAvailable(plugin,item,action)||plugin.app.workspace.activeLeaf!==saved.leaf||
   !(plugin.app.workspace.getLeavesOfType?.('markdown')||[]).includes(saved.leaf)||saved.leaf.view?.editor!==saved.editor||
   saved.leaf.view.file?.path!==saved.path||action.requiresSelection&&!saved.editor.getSelection?.().trim())return false;
 }
 if(item.role==='sync'&&['sync','network'].includes(action.effect)&&writerV12Config(plugin).syncProvider!==id)return false;
 try{
  // Obsidian returns dispatch success, not a promise for the companion's transport.
  return plugin.app.commands.executeCommandById(action.command)!==false;
 }catch(_){new Notice(writerUi('O plugin externo não conseguiu abrir esta ação. Confira suas configurações.','The companion could not open this action. Check its settings.'));return false;}
}
function writerCompanionOpenSettings(plugin,id,section){
 if(!plugin.app.plugins?.plugins?.[id])return false;
 if(writerCompanionCatalog().find(item=>item.id===id)?.mobile===false&&writerCompanionMobile(plugin))return false;
 if(typeof writerCompanionNotesOpenSettings==='function'&&['snailkit','dropit'].includes(id))return writerCompanionNotesOpenSettings(plugin,id,section);
 try{plugin.app.setting.open();plugin.app.setting.openTabById(id);return true;}catch(_){return false;}
}
async function writerCompanionOpenPanel(plugin,id,viewType){
 const item=writerCompanionCatalog().find(item=>item.id===id);
 const allowed=[...(item?.viewTypes||[]),...(item?.views||[]).map(view=>typeof view==='string'?view:view.viewType||view.id),
  ...(item?.panels||[]).map(view=>view.viewType)].filter(Boolean);
 if(!writerCompanionEnabled(plugin,id)||!allowed.includes(viewType))return false;
 const descriptor=item.views?.find(view=>(view.type||view.viewType||view.id)===viewType);
 if(descriptor?.requiresSetting&&plugin.app.plugins.plugins[id]?.settings?.[descriptor.requiresSetting]!==true)return false;
 const ws=plugin.app.workspace,existing=ws.getLeavesOfType(viewType)?.[0];
 if(existing){try{await existing.loadIfDeferred?.();if(!writerCompanionEnabled(plugin,id))return false;await ws.revealLeaf(existing);return writerCompanionEnabled(plugin,id);}catch(_){return false;}}
 // Do not manufacture views when a module did not register its factory.
 if(!writerCompanionViewAvailable(plugin,viewType))return false;
 const file=descriptor?.file?ws.getActiveFile?.():null;
 if(descriptor?.file&&(!file||!descriptor.extensions?.includes(file.extension))){new Notice(writerUi('Abra um arquivo HTML primeiro.','Open an HTML file first.'));return false;}
 const place=writerCompanionConfig(plugin).panelPlacement;
 const leaf=place==='tab'?ws.getLeaf('tab'):place==='left'?ws.getLeftLeaf(false):ws.getRightLeaf(false);
 if(!leaf)return false;
 try{await leaf.setViewState({type:viewType,active:true,...(file?{state:{file:file.path}}:{})});if(!writerCompanionEnabled(plugin,id))return false;await ws.revealLeaf(leaf);return writerCompanionEnabled(plugin,id);}catch(_){return false;}
}
function writerCompanionSpeechControl(plugin,action){
 const handle=plugin._writerCompanionSpeechHandle;
 if(!handle||typeof writerCompanionToolkitControl!=='function')return false;
 const result=writerCompanionToolkitControl(plugin,handle,action);
 if(action==='stop')plugin._writerCompanionSpeechHandle=null;
 return result;
}
function writerCompanionSpeechStart(plugin,text,title){
 if(writerCompanionConfig(plugin).ttsProvider!=='ahmed-toolkit')return false;
 writerCompanionSpeechControl(plugin,'stop');
 if(typeof writerCompanionToolkitSpeech!=='function')return false;
 let handle;
 try{handle=writerCompanionToolkitSpeech(plugin,text,title);}catch(error){new Notice(error.message);return false;}
 if(!handle){new Notice(writerUi('Ative a compatibilidade e a leitura do Ultimate Toolkit. Confira também a permissão de voz online.','Enable Ultimate Toolkit compatibility and speech. Also check the online speech permission.'));return false;}
 plugin._writerCompanionSpeechHandle=handle;return true;
}
async function writerCompanionToolkitSet(plugin,id,key,value){
 const spec=typeof WRITER_COMPANION_TOOLKIT_SPECS!=='undefined'?WRITER_COMPANION_TOOLKIT_SPECS.find(item=>item.id===id):null;
 const field=spec?.settings.find(field=>field.key===key),instance=plugin.app.plugins?.plugins?.[id];
 if(!field||!writerCompanionEnabled(plugin,id)||!instance?.settings||typeof instance[spec.saveMethod]!=='function')return false;
 if(field.type==='boolean'&&typeof value!=='boolean'||field.type==='select'&&!field.options.some(option=>option.value===value)||
  field.type==='number'&&(!Number.isFinite(value)||value<field.min||value>field.max))return false;
 const settings=instance.settings,previous=settings[key];settings[key]=value;
 try{await instance[spec.saveMethod]();
  if(field.afterSave==='updateRibbon'&&typeof instance.updateRibbon==='function')instance.updateRibbon();
  return true;
 }catch(_){if(settings[key]===value)settings[key]=previous;new Notice(writerUi('Não foi possível salvar no plugin externo.','Could not save in the companion plugin.'));return false;}
}
function writerCompanionToolkitSettings(plugin,panel,id){
 const spec=typeof WRITER_COMPANION_TOOLKIT_SPECS!=='undefined'?WRITER_COMPANION_TOOLKIT_SPECS.find(item=>item.id===id):null;
 const instance=plugin.app.plugins?.plugins?.[id];
 if(!spec||!writerCompanionEnabled(plugin,id)||typeof instance?.[spec.saveMethod]!=='function')return;
 const details=panel.createEl('details',{cls:'writer-companion-options'});details.createEl('summary',{text:writerUi('Opções de ','Options for ')+spec.name});
 for(const field of spec.settings){
  if(!Object.prototype.hasOwnProperty.call(instance.settings||{},field.key))continue;
  const row=new Setting(details).setName(writerUi(field.pt,field.en));
  const note=field.description?writerUi(field.description.pt,field.description.en):'';
  row.setDesc(note+(field.requiresReload?' '+writerUi('Recarregue o plugin externo para aplicar todos os atalhos e painéis.','Reload the companion to apply all commands and panels.') :''));
  const change=async value=>{await writerCompanionToolkitSet(plugin,id,field.key,value);plugin._writerCompanionManager?.refresh();};
  if(field.type==='boolean')row.addToggle(t=>t.setValue(instance.settings[field.key]===true).onChange(change));
  else if(field.type==='select')row.addDropdown(d=>{for(const option of field.options)d.addOption(option.value,writerUi(option.pt,option.en));d.setValue(instance.settings[field.key]).onChange(change);});
  else if(field.type==='number')row.addSlider(s=>s.setLimits(field.min,field.max,field.step||1).setValue(Number(instance.settings[field.key])).setDynamicTooltip().onChange(change));
 }
}
function writerCompanionSpeechSettings(plugin,panel){
 const cfg=writerCompanionConfig(plugin);
 new Setting(panel).setName(writerUi('Provedor de leitura','Speech provider'))
  .setDesc(writerUi('Basic mantém suas vozes. Ultimate Toolkit usa suas próprias vozes e seu próprio player; exige instalação e ativação separadas.','Basic keeps its voices. Ultimate Toolkit uses its own voices and player; install and enable it separately.'))
  .addDropdown(d=>d.addOption('basic','Basic').addOption('ahmed-toolkit','Ultimate Toolkit').setValue(cfg.ttsProvider).onChange(async value=>{
   if(!['basic','ahmed-toolkit'].includes(value))return;
   writerCompanionSpeechControl(plugin,'stop');plugin.writerFinalFeatures?.stop();
   plugin._writerV107SpeechId=(plugin._writerV107SpeechId||0)+1;
   cfg.ttsProvider=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();
  }));
 new Setting(panel).setName(writerUi('Permitir voz online do Toolkit','Allow Toolkit online speech'))
  .setDesc(writerUi('Desativado por padrão. A versão auditada envia o texto ao Google Translate quando seu motor online está selecionado. Idiomas e vozes dependem do Toolkit.','Off by default. The audited version sends text to Google Translate when its online engine is selected. Languages and voices depend on Toolkit.'))
  .addToggle(t=>t.setValue(cfg.allowToolkitOnline).onChange(async value=>{if(!value)writerCompanionSpeechControl(plugin,'stop');cfg.allowToolkitOnline=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Vozes e player do Toolkit','Toolkit voices and player')).addButton(b=>b.setButtonText(writerUi('Configurar','Configure')).setDisabled(!plugin.app.plugins?.plugins?.['ahmed-toolkit']).onClick(()=>writerCompanionOpenSettings(plugin,'ahmed-toolkit')));
}
function writerCompanionStatus(plugin,item){
 const instance=plugin.app.plugins?.plugins?.[item.id];
 if(item.mobile===false&&writerCompanionMobile(plugin))return writerUi('Disponível apenas no desktop','Desktop only');
 if(!instance)return writerUi('Instale e ative o plugin original','Install and enable the original plugin');
 if(!writerCompanionEnabled(plugin,item.id))return writerUi('Compatibilidade desligada no Basic','Compatibility disabled in Basic');
 const version=instance.manifest?.version||'?';
 if(item.role==='sync'&&typeof writerCompanionSyncStatus==='function'){
   const status=writerCompanionSyncStatus(plugin,item.id);
   const labels={setup:['Configure o provedor','Set up provider'],offline:['Sem conexão','Offline'],syncing:['Sincronizando','Syncing'],synced:['Sincronizado','Synced'],idle:['Pronto','Ready'],paused:['Pausado','Paused'],'remote-paused':['Pausado em outro dispositivo','Paused on another device'],conflict:['Conflito','Conflict'],error:['Erro de conexão','Connection error'],waiting:['Aguardando dispositivos','Waiting for devices'],listening:['Aguardando alterações','Listening for changes']};
   if(labels[status?.status])return version+' · '+writerUi(...labels[status.status]);
 }
 return version+' · '+writerUi('Ativo','Active');
}
function writerCompanionButton(root,text,callback,disabled=false){
 const button=root.createEl('button',{text,attr:{type:'button'}});button.disabled=disabled;
 button.addEventListener('click',()=>{if(!button.disabled)Promise.resolve(callback()).catch(()=>{});});return button;
}
function writerCompanionRender(plugin,root,role,context){
 root.empty();root.addClass('writer-companion-center');
 root.createEl('h2',{text:writerUi('Plugins conectados','Connected plugins')});
 root.createEl('p',{cls:'setting-item-description',text:writerUi('Abra os painéis originais e configure cada conexão. O Basic usa somente os recursos disponíveis na versão ativa.','Open native panels and configure each connection. Basic uses only capabilities available in the running version.')});
 if(!writerV12On(plugin,'integrations')){root.createEl('p',{text:writerUi('As integrações estão desligadas nas configurações do Basic.','Integrations are disabled in Basic settings.')});return;}
 if(role==='sync')writerCompanionSyncSelector(plugin,root);
 for(const item of writerCompanionCatalog().filter(item=>role!=='sync'||item.role==='sync')){
  const card=root.createDiv({cls:'writer-companion-card'});card.dataset.companion=item.id;
  card.createEl('h3',{text:item.name});card.createEl('p',{cls:'writer-companion-status',text:writerCompanionStatus(plugin,item),attr:{role:'status'}});
  const description=item.description?writerUi(item.description.pt,item.description.en):writerUi(item.descriptionPt||'',item.descriptionEn||'');
  if(description)card.createEl('p',{cls:'setting-item-description',text:description});
  if(item.notes)card.createEl('p',{cls:'setting-item-description',text:writerUi(item.notes.pt,item.notes.en)});
  const actions=card.createDiv({cls:'writer-companion-actions'});
  if(plugin.app.plugins?.plugins?.[item.id])writerCompanionButton(actions,writerUi('Configurações originais','Native settings'),()=>writerCompanionOpenSettings(plugin,item.id),item.mobile===false&&writerCompanionMobile(plugin));
  for(const action of item.actions){
   if(!writerCompanionCommands(plugin)[action.command]||item.mobile===false&&writerCompanionMobile(plugin))continue;
   if(action.desktopOnly&&writerCompanionMobile(plugin))continue;
   const available=writerCompanionActionAvailable(plugin,item,action);
   const selected=item.role!=='sync'||!['sync','network'].includes(action.effect)||writerV12Config(plugin).syncProvider===item.id;
   const button=writerCompanionButton(actions,writerUi(action.pt||action.id,action.en||action.id),()=>writerCompanionRun(plugin,item.id,action.id,context),!available||!selected);
   if(!available)button.title=writerUi('O plugin ou módulo não disponibilizou este comando.','The plugin or module has not made this command available.');
   else if(!selected)button.title=writerUi('Selecione este sincronizador primeiro.','Select this sync provider first.');
  }
  const panels=[...(item.panels||[]).map(view=>view.viewType),...(item.views||[]).map(view=>typeof view==='string'?view:view.type||view.viewType||view.id)].filter(Boolean);
  for(const type of [...new Set(panels)]){
   const view=item.views?.find(view=>(view.type||view.viewType||view.id)===type)||item.panels?.find(view=>view.viewType===type);
   const available=writerCompanionViewAvailable(plugin,type)&&writerCompanionEnabled(plugin,item.id)&&(!view?.requiresSetting||plugin.app.plugins.plugins[item.id]?.settings?.[view.requiresSetting]===true);
   if(writerCompanionViewAvailable(plugin,type))writerCompanionButton(actions,(view?writerUi(view.pt,view.en):writerUi('Abrir painel','Open panel')+' · '+item.name)+' · '+writerUi({left:'à esquerda',right:'à direita',tab:'em aba'}[writerCompanionConfig(plugin).panelPlacement],{left:'left',right:'right',tab:'tab'}[writerCompanionConfig(plugin).panelPlacement]),()=>writerCompanionOpenPanel(plugin,item.id,type),!available);
  }
  if(item.id==='snailkit'&&writerCompanionEnabled(plugin,item.id)){
   const tasks=writerCompanionSnailkitTasks(plugin).slice(0,8);
   if(tasks.length){const list=card.createEl('ul',{cls:'writer-companion-tasks'});
    for(const task of tasks){const row=list.createEl('li');const check=row.createEl('input',{attr:{type:'checkbox','aria-label':writerUi('Concluir tarefa','Complete task')}});check.checked=task.done;
     row.createSpan({text:task.plainTitle||task.text||task.title||task.raw});
     check.addEventListener('change',async()=>{check.disabled=true;const result=await writerCompanionSnailkitSetDone(plugin,task,check.checked);if(!result){check.checked=task.done;new Notice(writerUi('A tarefa mudou. Atualize o painel.','The task changed. Refresh the panel.'));}check.disabled=false;});
    }
   }
  }
 }
 const footer=root.createDiv({cls:'writer-companion-actions'});
 writerCompanionButton(footer,writerUi('Atualizar recursos','Refresh capabilities'),()=>writerCompanionRender(plugin,root,role,context));
 writerCompanionButton(footer,writerUi('Configurar integrações','Configure integrations'),()=>plugin.openCoreSettings('integrationsV4'));
}
function writerCompanionSyncSelector(plugin,panel){
 new Setting(panel).setName(writerUi('Provedor manual de sincronização','Manual synchronization provider'))
  .setDesc(writerUi('Selecionar aqui habilita ações manuais. As rotinas automáticas continuam nas configurações do plugin original.','This selection enables manual actions. Automatic schedules remain in the original plugin settings.'))
  .addDropdown(d=>{d.addOption('none',writerUi('Nenhum','None'));for(const item of writerCompanionCatalog().filter(item=>item.role==='sync'))d.addOption(item.id,item.name);
   d.setValue(writerV12Config(plugin).syncProvider).onChange(async value=>{if(!WRITER_V12_SYNC.includes(value))return;writerV12Config(plugin).syncProvider=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();});});
}
function writerCompanionSettings(plugin,panel){
 const cfg=writerCompanionConfig(plugin);
 panel.createEl('h3',{text:writerUi('Compatibilidade entre plugins','Plugin compatibility')});
 new Setting(panel).setName(writerUi('Ativar integrações','Enable integrations')).setDesc(writerUi('Desligar remove as conexões do Basic. Cada plugin continua com seus próprios módulos.','Turning this off removes Basic connections. Each plugin retains its own modules.'))
  .addToggle(t=>t.setValue(writerV12On(plugin,'integrations')).onChange(async value=>{writerV12Config(plugin).integrations=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();}));
 new Setting(panel).setName(writerUi('Abrir central de plugins','Open plugin center')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerCompanionOpen(plugin)));
 new Setting(panel).setName(writerUi('Local dos painéis','Panel placement')).addDropdown(d=>{
  for(const [key,pt,en] of [['right','Lateral direita','Right sidebar'],['left','Lateral esquerda','Left sidebar'],['tab','Nova aba','New tab']])d.addOption(key,writerUi(pt,en));
  d.setValue(cfg.panelPlacement).onChange(async value=>{if(['right','left','tab'].includes(value)){cfg.panelPlacement=value;await plugin.saveSettings();}});
 });
 for(const [key,pt,en] of [['showLaunchers','Atalho nos painéis do Basic','Shortcut in Basic panels'],['mobileLayout','Organizar botões no mobile','Arrange mobile buttons']])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();}));
 new Setting(panel).setName(writerUi('Ícones do explorador quando há duplicação','Explorer icons when both plugins add one')).addDropdown(d=>d.addOption('companion','Ultimate Toolkit').addOption('basic',writerUi('Basic personalizado','Custom Basic')).addOption('both',writerUi('Ambos','Both')).setValue(cfg.explorerIcons).onChange(async value=>{if(['companion','basic','both'].includes(value)){cfg.explorerIcons=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();}}));
 writerCompanionSyncSelector(plugin,panel);
 for(const item of writerCompanionCatalog()){
  new Setting(panel).setName(item.name).setDesc(writerCompanionStatus(plugin,item))
   .addToggle(t=>t.setValue(cfg.enabledById[item.id]!==false).onChange(async value=>{cfg.enabledById[item.id]=value;if(!value&&item.id==='ahmed-toolkit')writerCompanionSpeechControl(plugin,'stop');await plugin.saveSettings();plugin._writerCompanionManager?.refresh();}))
   .addButton(b=>b.setButtonText(writerUi('Configurar','Configure')).setDisabled(!plugin.app.plugins?.plugins?.[item.id]||item.mobile===false&&writerCompanionMobile(plugin)).onClick(()=>writerCompanionOpenSettings(plugin,item.id)));
  if(typeof writerCompanionToolkitSettings==='function')writerCompanionToolkitSettings(plugin,panel,item.id);
  if(item.settingsSections&&writerCompanionEnabled(plugin,item.id)){
   const actions=panel.createDiv({cls:'writer-companion-actions'});
   for(const section of item.settingsSections)writerCompanionButton(actions,writerUi(section.pt,section.en),()=>writerCompanionOpenSettings(plugin,item.id,section.id));
  }
 }
 writerCompanionSpeechSettings(plugin,panel);
 new Setting(panel).setName(writerUi('Conflitos locais','Local conflicts')).addButton(b=>b.setButtonText(writerUi('Inspecionar','Inspect')).onClick(()=>writerV12ConflictViewer(plugin)));
}
async function writerCompanionOpen(plugin,role){
 if(!writerV12On(plugin,'integrations'))return;
 const context=writerCompanionEditorContext(plugin),ws=plugin.app.workspace;
 let leaf=ws.getLeavesOfType(WRITER_COMPANION_VIEW)?.[0];
 if(leaf){
  try{await leaf.loadIfDeferred?.();}catch(_){return false;}
  if(typeof leaf.view?.render!=='function'){
   if((ws.getLeavesOfType(WRITER_COMPANION_VIEW)||[]).includes(leaf))leaf.detach?.();
   leaf=null;
  }
 }
 if(!leaf){const place=writerCompanionConfig(plugin).panelPlacement;leaf=place==='tab'?ws.getLeaf('tab'):place==='left'?ws.getLeftLeaf(false):ws.getRightLeaf(false);if(!leaf)return;await leaf.setViewState({type:WRITER_COMPANION_VIEW,active:true});}
 await leaf.loadIfDeferred?.();
 if(!writerV12On(plugin,'integrations')||typeof leaf.view?.render!=='function')return false;
 leaf.view.role=role;leaf.view.editorContext=context;leaf.view.render();await ws.revealLeaf(leaf);return true;
}
function writerCompanionRegister(plugin){
 if(plugin._writerCompanionManager)return;
 writerCompanionConfig(plugin);
 if(typeof writerLanguageToolRegister==='function')writerLanguageToolRegister(plugin);
 class CompanionView extends ItemView{
  getViewType(){return WRITER_COMPANION_VIEW;}
  getDisplayText(){return writerUi('Plugins conectados','Connected plugins');}
  getIcon(){return 'plug';}
  async onOpen(){this.render();}
  render(){writerCompanionRender(plugin,this.contentEl,this.role,this.editorContext);}
 }
 plugin.registerView(WRITER_COMPANION_VIEW,leaf=>new CompanionView(leaf));
 const snail=typeof writerCompanionSnailkitRegister==='function'?writerCompanionSnailkitRegister(plugin,()=>writerCompanionEnabled(plugin,'snailkit')):null;
 const layout=typeof writerCompanionLayoutRegister==='function'?writerCompanionLayoutRegister(plugin):null;
 let stopped=false,fingerprint='';
 const refresh=()=>{
  if(stopped)return;
  snail?.refresh();layout?.refresh();
  if(plugin._writerCompanionSpeechHandle&&(typeof writerCompanionToolkitAllowed!=='function'||!writerCompanionToolkitAllowed(plugin)||plugin.app.plugins.plugins['ahmed-toolkit']?.settings?.enableTTS!==true))writerCompanionSpeechControl(plugin,'stop');
  const next=JSON.stringify([writerV12On(plugin,'integrations'),writerCompanionConfig(plugin),writerCompanionCatalog().map(item=>[item.id,writerCompanionStatus(plugin,item),item.actions.map(action=>writerCompanionActionAvailable(plugin,item,action))])]);
  const doc=plugin.app.workspace.containerEl?.ownerDocument;
  for(const header of doc?.querySelectorAll('.writer-sidebar-header')||[]){
   const old=header.querySelector('.writer-companion-launcher');
   const show=writerCompanionConfig(plugin).showLaunchers&&writerV12On(plugin,'integrations')&&writerCompanionCatalog().some(item=>writerCompanionEnabled(plugin,item.id));
   if(!show)old?.remove();
   if(show&&!old){
    const button=writerCompanionButton(header,writerUi('Plugins','Plugins'),()=>writerCompanionOpen(plugin));button.addClass('writer-companion-launcher');
   }
  }
  if(next===fingerprint)return;fingerprint=next;
  for(const leaf of plugin.app.workspace.getLeavesOfType(WRITER_COMPANION_VIEW)||[])leaf.view.render?.();
 };
 const stop=()=>{if(stopped)return;stopped=true;snail?.stop();layout?.stop();writerCompanionSpeechControl(plugin,'stop');
  const doc=plugin.app.workspace.containerEl?.ownerDocument;for(const el of doc?.querySelectorAll('.writer-companion-launcher')||[])el.remove();
  for(const leaf of plugin.app.workspace.getLeavesOfType(WRITER_COMPANION_VIEW)||[])leaf.detach?.();
 };
 plugin._writerCompanionManager={refresh,stop};plugin.register(stop);
 if(typeof plugin.app.workspace.on==='function'){
  const ref=plugin.app.workspace.on('active-leaf-change',leaf=>{
   if(!leaf?.view?.editor||leaf.view.file?.extension!=='md')return;
   const context={leaf,editor:leaf.view.editor,path:leaf.view.file.path};plugin._writerCompanionEditorContext=context;
   for(const panel of plugin.app.workspace.getLeavesOfType(WRITER_COMPANION_VIEW)||[]){panel.view.editorContext=context;panel.view.render?.();}
  });
  if(typeof plugin.registerEvent==='function')plugin.registerEvent(ref);else plugin.register(()=>plugin.app.workspace.offref?.(ref));
 }
 plugin.registerInterval(setInterval(refresh,2000));plugin.app.workspace.onLayoutReady(refresh);
}
