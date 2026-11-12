'use strict';
/* Independent bridge to the installed plugin. No LanguageTool source is bundled. */
const WRITER_COMPANION_GRAMMAR=[{
 id:'languagetool',name:'LanguageTool',repository:'https://github.com/wrenger/obsidian-languagetool',
 revision:'0d663b6c713ee88eeee35cc128a23c0277c72a69',version:'1.6.0',minAppVersion:'1.13.6',
 license:'AGPL-3.0',mobile:true,settingsTabId:'languagetool',
 actions:[
  {id:'check',pt:'Verificar nota ou seleção',en:'Check note or selection',command:'languagetool:check',requiresEditor:true,effect:'network',module:'review'},
  {id:'clear',pt:'Limpar sugestões',en:'Clear suggestions',command:'languagetool:clear',requiresEditor:true,effect:'inspect',module:'review'},
  {id:'next',pt:'Próxima sugestão',en:'Next suggestion',command:'languagetool:next',requiresEditor:true,effect:'inspect',module:'review'},
  {id:'toggle-auto-check',pt:'Alternar verificação automática',en:'Toggle automatic checking',command:'languagetool:toggle-auto-check',effect:'setting',module:'review'}
 ]
}];
function writerLanguageToolInstalled(plugin){return plugin.app?.plugins?.plugins?.languagetool||null;}
function writerLanguageToolEnabled(plugin){
 if(!writerModuleOn(plugin,'review'))return false;
 if(typeof writerCompanionEnabled==='function')return writerCompanionEnabled(plugin,'languagetool');
 return plugin.settings?.v12Toolkit?.enabled!==false&&plugin.settings?.v12Toolkit?.integrations!==false&&
  plugin.settings?.companionCompatibility?.enabledById?.languagetool!==false&&!!writerLanguageToolInstalled(plugin);
}
function writerLanguageToolState(plugin){
 const instance=writerLanguageToolInstalled(plugin),enabled=!!instance&&writerLanguageToolEnabled(plugin);
 const options=instance?.settings?.options,commands=plugin.app?.commands?.commands||{};
 return {installed:!!instance,enabled,canCheck:enabled&&typeof instance.runDetection==='function',
  canConfigure:enabled&&!!options&&typeof instance.settings?.update==='function',
  automatic:typeof options?.shouldAutoCheck==='boolean'?options.shouldAutoCheck:null,
  language:typeof options?.staticLanguage==='string'?options.staticLanguage:null,
  version:String(instance?.manifest?.version||''),
  commands:Object.fromEntries(WRITER_COMPANION_GRAMMAR[0].actions.map(action=>[action.id,enabled&&!!commands[action.command]]))};
}
function writerLanguageToolEditor(plugin,file){
 if(!file?.path)return null;
 const workspace=plugin.app.workspace,leaves=workspace.getLeavesOfType?.('markdown')||[];
 const recent=workspace.getMostRecentLeaf?.(),active=workspace.activeLeaf;
 const leaf=[active,recent,...leaves].find(item=>item?.view?.file?.path===file.path&&item.view.editor?.cm);
 if(!leaf)return null;
 // runDetection reads the active note's frontmatter; commands also use its editor.
 // Restore the chosen note before either call, including when Basic has focus.
 workspace.setActiveLeaf?.(leaf,{focus:true});
 if(workspace.getActiveFile?.()?.path!==file.path)return null;
 return {leaf,editor:leaf.view.editor,cm:leaf.view.editor.cm};
}
function writerLanguageToolCommand(plugin,command,file){
 const state=writerLanguageToolState(plugin),action=WRITER_COMPANION_GRAMMAR[0].actions.find(item=>item.id===command);
 if(!action||!state.commands[command])return false;
 if(action.requiresEditor&&!writerLanguageToolEditor(plugin,file||plugin.app.workspace.getActiveFile?.())){
  new Notice(writerUi('Abra a nota no editor para usar esta ação do LanguageTool.','Open the note in an editor to use this LanguageTool action.'));return false;
 }
 return !!plugin.app.commands.executeCommandById(action.command);
}
async function writerLanguageToolReview(plugin,file,view){
 if(!writerLanguageToolEnabled(plugin)||plugin.settings.reviewEngine!=='external'||view?.activeTab!=='review'||
  view.reviewMode?.value!=='grammar'||view.reviewFilePath!==file?.path)return false;
 const instance=writerLanguageToolInstalled(plugin);
 if(typeof instance?.runDetection!=='function'){view.updateReviewEngineUI?.();return false;}
 const context=writerLanguageToolEditor(plugin,file);
 if(!context){view.reviewStatus?.setText(writerUi('Abra esta nota no editor para usar o corretor externo.','Open the note in an editor to use the external checker.'));return false;}
 if(view.reviewBusy)return false;
 const token=view.reviewToken=(view.reviewToken||0)+1;
 const document=context.cm.state?.doc;
 const current=()=>view.reviewToken===token&&writerLanguageToolEnabled(plugin)&&
  writerLanguageToolInstalled(plugin)===instance&&plugin.settings.reviewEngine==='external'&&
  view.reviewMode?.value==='grammar'&&view.activeTab==='review'&&view.reviewFilePath===file.path&&
  context.leaf.view?.file?.path===file.path&&context.leaf.view?.editor?.cm===context.cm&&
  context.cm.state?.doc===document;
 view.reviewBusy=true;
 view.reviewStatus?.setText(writerUi('Verificando pelo LanguageTool externo…','Checking with external LanguageTool…'));
 try{
  await instance.runDetection(context.cm);
  if(!current())return false;
  // Upstream returns true for some handled failures as well as findings.
  // Completion cannot certify successful transport; its own notices explain errors.
  view.reviewStatus?.setText(writerUi('Solicitação encerrada. Confira os sublinhados e os avisos do LanguageTool no editor.',
   'Request finished. Check the editor underlines and LanguageTool notices.'));
  return true;
 }catch(_){
  if(current())view.reviewStatus?.setText(writerUi('O LanguageTool externo não concluiu a verificação. Confira as configurações e os avisos dele.',
   'External LanguageTool could not finish the check. Review its settings and notices.'));
  return false;
 }finally{if(view.reviewToken===token)view.reviewBusy=false;}
}
async function writerLanguageToolUpdate(plugin,key,value){
 if(!writerLanguageToolState(plugin).canConfigure)throw Error(writerUi('Configuração externa indisponível.','External settings unavailable.'));
 const options=writerLanguageToolInstalled(plugin).settings.options;
 const booleans=['shouldAutoCheck','pickyMode','longCheckNotification'];
 if(booleans.includes(key)){if(typeof value!=='boolean'||typeof options[key]!=='boolean')throw Error('Invalid LanguageTool option');}
 else if(key==='staticLanguage'){
  if(typeof options.staticLanguage!=='string'||typeof value!=='string'||(value!==''&&!/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(value)))throw Error('Invalid LanguageTool language');
 }else throw Error('Unsupported LanguageTool option');
 // Its updater serializes writes and preserves dictionaries, secret references
 // and plugin-owned metadata. Never replace or save its settings object.
 await writerLanguageToolInstalled(plugin).settings.update({[key]:value});
}
function writerLanguageToolSettings(plugin,panel){
 const root=panel.createDiv({cls:'writer-grammar-external-settings'}),state=writerLanguageToolState(plugin);
 root.createEl('h4',{text:writerUi('Plugin LanguageTool externo','External LanguageTool plugin')});
 root.createEl('p',{cls:'setting-item-description',attr:{role:'status'},text:!state.installed?
  writerUi('Não instalado ou desativado. O corretor integrado funciona sem este plugin.','Not installed or disabled. The built-in checker works without this plugin.'):
  !state.enabled?writerUi('A integração está desativada em Recursos ou Integrações. O plugin externo mantém seu próprio funcionamento.',
   'The bridge is disabled in Features or Integrations. The external plugin keeps its own behavior.'):
  writerUi('Plugin ativo','Plugin active')+(state.version?' · '+state.version:'')});
 root.createEl('p',{cls:'setting-item-description',text:writerUi(
  'O idioma, a conta, o dicionário e a verificação automática do plugin externo são independentes dos do Basic. Propriedades lt-language, lt-autoCheck e lt-picky da nota podem substituir as preferências dele.',
  'The external plugin’s language, account, dictionary and automatic checking are independent of Basic. Note properties lt-language, lt-autoCheck and lt-picky can override its preferences.')});
 new Setting(root).setName(writerUi('Configuração completa do plugin','Full plugin settings'))
  .addButton(button=>button.setButtonText(writerUi('Abrir configurações','Open settings')).setDisabled(!state.installed).onClick(()=>{
   if(!writerLanguageToolInstalled(plugin))return;
   plugin.app.setting?.open?.();plugin.app.setting?.openTabById?.('languagetool');
  }));
 if(!state.canConfigure)return root;
 const feedback=root.createEl('p',{cls:'writer-grammar-feedback',attr:{role:'status','aria-live':'polite'}});
 const persist=async(control,key,value)=>{
  control.setDisabled(true);
  try{await writerLanguageToolUpdate(plugin,key,value);feedback.setText(writerUi('Preferência salva no LanguageTool.','Preference saved in LanguageTool.'));}
  catch(_){feedback.setText(writerUi('Não foi possível salvar. Reabra esta seção para conferir a preferência atual.',
   'Could not save. Reopen this section to check the current preference.'));}
  finally{control.setDisabled(!writerLanguageToolState(plugin).canConfigure);}
 };
 for(const [key,pt,en,descPt,descEn] of [
  ['shouldAutoCheck','Verificação automática externa','External automatic checking',
   'Este plugin pode verificar mesmo com o painel do Basic fechado. Desligar a integração não desliga essa preferência.',
   'This plugin can check while the Basic pane is closed. Disabling the bridge does not turn off this preference.'],
  ['pickyMode','Revisão rigorosa externa','External picky mode','Inclui sugestões adicionais de estilo.','Include additional style suggestions.'],
  ['longCheckNotification','Avisar sobre verificações longas','Notify about long checks',
   'Útil no celular, onde o indicador da barra de status não aparece.','Useful on mobile, where the status bar indicator is unavailable.']
 ]){
  if(typeof writerLanguageToolInstalled(plugin).settings.options[key]!=='boolean')continue;
  new Setting(root).setName(writerUi(pt,en)).setDesc(writerUi(descPt,descEn))
   .addToggle(control=>control.setValue(writerLanguageToolInstalled(plugin).settings.options[key])
    .onChange(value=>persist(control,key,value)));
 }
 if(typeof writerLanguageToolInstalled(plugin).settings.options.staticLanguage==='string')new Setting(root).setName(writerUi('Idioma do plugin externo','External plugin language'))
  .addDropdown(control=>{
   const languages=[['',writerUi('Detecção automática','Automatic detection')],['pt-BR','Português (Brasil)'],['pt-PT','Português (Portugal)'],
    ['en-US','English (US)'],['en-GB','English (UK)'],['es','Español'],['fr','Français'],['de-DE','Deutsch']];
   const current=writerLanguageToolInstalled(plugin).settings.options.staticLanguage||'';
   for(const [value,label] of languages)control.addOption(value,label);
   if(!languages.some(([value])=>value===current))control.addOption(current,current);
   control.setValue(current).onChange(value=>persist(control,'staticLanguage',value));
  });
 return root;
}
function writerLanguageToolPanel(view){
 const plugin=view.plugin,state=writerLanguageToolState(plugin);
 const info=view.reviewResults.createDiv({cls:'writer-review-external'});
 info.createEl('h4',{text:writerUi('LanguageTool externo','External LanguageTool')});
 info.createEl('p',{text:state.enabled?writerUi(
  'O plugin externo controla os sublinhados e as sugestões no editor. O Basic usa o idioma e a conta dele neste modo.',
  'The external plugin controls editor underlines and suggestions. Basic uses its language and account in this mode.'):
  writerUi('Ative o LanguageTool e sua integração. O Basic não envia verificações enquanto o corretor externo estiver selecionado.',
   'Enable LanguageTool and its bridge. Basic does not send checks while the external checker is selected.')});
 const actions=info.createDiv({cls:'writer-tools-v3-actions'});
 const button=(pt,en,enabled,callback)=>{
  const element=actions.createEl('button',{text:writerUi(pt,en)});element.disabled=!enabled;
  element.addEventListener('click',callback);return element;
 };
 button('Verificar nota/seleção','Check note/selection',state.canCheck,()=>view.reviewActiveFile());
 for(const action of WRITER_COMPANION_GRAMMAR[0].actions.filter(item=>item.id!=='check')){
  let pt=action.pt,en=action.en;
  if(action.id==='toggle-auto-check'&&state.automatic!==null){
   pt=state.automatic?'Desativar verificação automática externa':'Ativar verificação automática externa';
   en=state.automatic?'Turn off external automatic checking':'Turn on external automatic checking';
  }
  const element=button(pt,en,state.commands[action.id],()=>{
   const file=plugin.app.vault.getAbstractFileByPath?.(view.reviewFilePath)||plugin.app.workspace.getActiveFile?.();
   if(!writerLanguageToolCommand(plugin,action.id,file))view.reviewStatus.setText(writerUi(
    'Ação indisponível para a nota atual.','Action unavailable for the current note.'));
   if(action.id==='toggle-auto-check')element.textContent=writerUi('Preferência enviada; reabra o painel para atualizar.','Preference sent; reopen the pane to refresh.');
  });
 }
 button('Configurar LanguageTool','LanguageTool settings',state.installed,()=>{
  plugin.app.setting?.open?.();plugin.app.setting?.openTabById?.('languagetool');
 });
 view.reviewStatus.setText(state.canCheck?writerUi('Controles do LanguageTool externo disponíveis.','External LanguageTool controls are ready.'):
  writerUi('LanguageTool externo indisponível ou integração desativada.','External LanguageTool unavailable or bridge disabled.'));
}
function writerLanguageToolRegister(plugin){
 if(typeof document==='undefined')return;
 const bodies=new Set();let previous='',pendingRefresh=false,stopped=false;
 const refresh=()=>{
  if(stopped)return;
  const enabled=writerLanguageToolEnabled(plugin),state=writerLanguageToolState(plugin);
  const body=document.body;if(body){body.classList.toggle('writer-grammar-external-compat',enabled);bodies.add(body);}
  const fingerprint=JSON.stringify([state.enabled,state.canCheck,state.version,state.automatic,state.commands]);
  if(fingerprint===previous&&!pendingRefresh)return;previous=fingerprint;pendingRefresh=false;
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(typeof VIEW==='string'?VIEW:'offline-dictionary-view')||[]){
   const view=leaf.view;
   if(view?.activeTab==='review'&&view.reviewMode?.value==='grammar'&&plugin.settings.reviewEngine==='external'){
    if(view.reviewBusy&&state.enabled){pendingRefresh=true;continue;}
    if(view.reviewBusy)view.cancelReview?.();
    view.updateReviewEngineUI?.();
   }
  }
 };
 refresh();const timer=setInterval(refresh,1500);plugin.registerInterval?.(timer);
 const stop=()=>{stopped=true;clearInterval(timer);for(const body of bodies)body.classList.remove('writer-grammar-external-compat');bodies.clear();};
 plugin.register?.(stop);return {refresh,stop};
}
