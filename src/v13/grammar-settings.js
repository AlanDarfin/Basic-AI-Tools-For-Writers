'use strict';
/* Grammar setup uses the existing review preferences. No requests run on render. */
let writerV137GrammarSettingId=0;
function writerV137GrammarWords(value){
 const words=[],seen=new Set();let skipped=0;
 for(const line of String(value||'').split(/\r?\n/)){
  const word=line.trim().normalize('NFC');if(!word)continue;
  if(!/^[\p{L}][\p{L}\p{M}'’\-]{0,63}$/u.test(word)){skipped++;continue;}
  const key=word.toLocaleLowerCase();
  if(seen.has(key))continue;
  if(words.length>=2000){skipped++;continue;}
  seen.add(key);words.push(word);
 }
 return {words,skipped};
}
function writerV137GrammarRules(value){
 const rules=[],seen=new Set();let skipped=0;
 for(const token of String(value||'').split(/[\s,;]+/)){
  if(!token)continue;
  if(!/^[A-Za-z][A-Za-z0-9_:.-]{0,119}$/.test(token)){skipped++;continue;}
  const rule=token.toUpperCase();if(!seen.has(rule)){seen.add(rule);rules.push(rule);}
 }
 return {rules,skipped};
}
function writerV137GrammarInvalidate(plugin){
 plugin.autoGrammar?.cancelPending?.();writerGrammarCancel(plugin);
 plugin.clearReviewMarks?.();
 for(const leaf of plugin.app?.workspace?.getLeavesOfType?.(typeof VIEW==='string'?VIEW:'offline-dictionary-view')||[]){
  const view=leaf.view;
  if(!view)continue;
  view.grammarCheckedPath=null;view.grammarCheckedSource=null;
  if(view.reviewEngine)view.reviewEngine.value=plugin.settings.reviewEngine==='external'?'external':'basic';
  if(view.reviewMode?.value==='grammar')view.updateReviewEngineUI?.();
 }
}
function writerV137GrammarSettings(plugin,panel){
 const settings=plugin.settings,cfg=writerAutoGrammarSettings(settings);
 const root=panel.createDiv({cls:'writer-grammar-settings'});
 root.createEl('h3',{text:writerUi('Gramática e ortografia','Grammar and spelling')});
 root.createEl('p',{cls:'setting-item-description',text:writerUi(
  'O LanguageTool sugere correções. A nota só muda quando você aceita uma sugestão; o texto revisado é enviado ao servidor escolhido.',
  'LanguageTool suggests corrections. Notes change only when you accept a suggestion; reviewed text is sent to the selected server.')});
 const status=root.createDiv({cls:'writer-grammar-state',attr:{role:'status','aria-live':'polite'}});
 const builtIn=[],automatic=[];
 const savedConnection=()=>({reviewEndpoint:settings.reviewEndpoint||'',reviewUsername:settings.reviewUsername||'',reviewApiKey:settings.reviewApiKey||''});
 const connectionDraft=savedConnection(),connectionFields={};
 const connectionDirty=()=>Object.entries(savedConnection()).some(([key,value])=>connectionDraft[key]!==value);
 const connectionValid=()=>Boolean(writerGrammarEndpoint(connectionDraft.reviewEndpoint));
 let busy=false,savingConnection=false,revision=0,testButton,testStatus,saveConnection,discardConnection,connectionFeedback,endpointFeedback;
 const section=(pt,en)=>{
  const card=root.createDiv({cls:'writer-grammar-section'});
  card.createEl('h4',{text:writerUi(pt,en)});return card;
 };
 const save=()=>plugin.saveSettings();
 const resetTest=()=>{
  revision++;busy=false;
  if(testStatus){delete testStatus.dataset.state;testStatus.setText('');}
 };
 const changed=()=>{
  resetTest();writerV137GrammarInvalidate(plugin);refresh();return save();
 };
 const remember=(control,list=builtIn)=>{list.push(control);return control;};
 const refresh=()=>{
  const enabled=writerModuleOn(plugin,'review'),external=settings.reviewEngine==='external';
  const dirty=connectionDirty(),valid=connectionValid();
  status.dataset.state=!enabled?'disabled':external?'external':cfg.enabled?'automatic':'manual';
  status.setText(!enabled?writerUi('Revisão desativada em Recursos. Suas preferências podem ser preparadas aqui.',
   'Review is disabled in Features. You can prepare its preferences here.'):
   external?writerUi('Corretor externo selecionado. As opções abaixo são do corretor integrado; o Basic não enviará verificações neste modo.',
    'External checker selected. The options below belong to the built-in checker; Basic will not send checks in this mode.'):
   cfg.enabled?writerUi('Automático enquanto o painel Revisão estiver aberto em Gramática. A verificação manual continua disponível.',
    'Automatic while the Review pane is open in Grammar mode. Manual checking remains available.'):
   writerUi('Manual. O corretor só verifica quando você usa uma ação de revisão.','Manual. The checker runs only when you use a review action.'));
  for(const control of builtIn)control.setDisabled?.(external);
  for(const control of automatic)control.setDisabled?.(external||!cfg.enabled);
  for(const field of Object.values(connectionFields))field.setDisabled?.(external||savingConnection);
  connectionFields.reviewEndpoint?.inputEl.setAttribute('aria-invalid',String(!valid));
  endpointFeedback?.setText(valid?'':writerUi('Use um endereço HTTPS sem usuário ou senha na URL.','Use an HTTPS address without a username or password in the URL.'));
  saveConnection?.setDisabled?.(external||savingConnection||!dirty||!valid);
  discardConnection?.setDisabled?.(external||savingConnection||!dirty);
  testButton?.setDisabled?.(busy||savingConnection||!enabled||external||dirty||!valid);
 };
 const workflow=section('Como revisar','Checking behavior');
 new Setting(workflow).setName(writerUi('Corretor de gramática','Grammar checker'))
  .setDesc(writerUi('Use a conexão do Basic ou os controles de um plugin LanguageTool instalado separadamente.',
   'Use Basic’s connection or a separately installed LanguageTool plugin.'))
  .addDropdown(d=>d.addOption('basic',writerUi('Integrado ao Basic','Built into Basic'))
   .addOption('external',writerUi('LanguageTool externo','External LanguageTool'))
   .setValue(settings.reviewEngine==='external'?'external':'basic')
   .onChange(async value=>{settings.reviewEngine=value;await changed();}));
 new Setting(workflow).setName(writerUi('Quando verificar','When to check'))
  .addDropdown(d=>remember(d).addOption('manual',writerUi('Somente manual','Manual only'))
   .addOption('automatic',writerUi('Após digitar, com Revisão aberta','After typing, while Review is open'))
   .setValue(cfg.enabled?'automatic':'manual').onChange(async value=>{cfg.enabled=value==='automatic';await changed();}));
 new Setting(workflow).setName(writerUi('Idioma da revisão','Review language')).addDropdown(d=>{
  remember(d);
  const languages=[['pt-BR','Português (Brasil)'],['pt-PT','Português (Portugal)'],['en-US','English (US)'],['en-GB','English (UK)'],
   ['es','Español'],['fr','Français'],['de-DE','Deutsch'],['auto',writerUi('Detectar automaticamente','Detect automatically')]];
  const language=settings.reviewLanguage||'pt-BR';
  for(const [code,label] of languages)d.addOption(code,label);
  if(!languages.some(([code])=>code===language))d.addOption(language,language);
  d.setValue(language).onChange(async value=>{settings.reviewLanguage=value;await changed();});
 });
 for(const [key,pt,en,min,max,step,unit] of [
  ['delayMs','Pausa após digitar','Pause after typing',2,15,0.5,1000],
  ['minIntervalMs','Intervalo mínimo entre verificações','Minimum interval between checks',6,30,1,1000],
  ['maxWindowChars','Caracteres por verificação automática','Characters per automatic check',4000,16000,1000,1]
 ])new Setting(workflow).setName(writerUi(pt,en))
  .setDesc(key==='maxWindowChars'?writerUi('Em notas longas, revisa um trecho próximo ao cursor.',
   'Long notes are checked in a passage near the cursor.'):writerUi('Em segundos.','In seconds.'))
  .addSlider(s=>remember(s,automatic).setLimits(min,max,step).setDynamicTooltip().setValue(cfg[key]/unit)
   .onChange(async value=>{cfg[key]=value*unit;await changed();}));
 new Setting(workflow).setName(writerUi('Modo inicial do painel','Default pane mode'))
  .setDesc(writerUi('Modo usado ao abrir um novo painel de revisão.','Mode used when opening a new Review pane.'))
  .addDropdown(d=>d.addOption('grammar',writerUi('Gramática','Grammar')).addOption('style',writerUi('Estilo com IA','Style with AI'))
   .addOption('beta',writerUi('Leitura beta com IA','Beta reading with AI')).setValue(settings.reviewMode||'grammar')
   .onChange(async value=>{settings.reviewMode=value;await save();}));
 if(typeof writerLanguageToolSettings==='function')writerLanguageToolSettings(plugin,root);
 const editor=section('Sugestões no editor','Editor suggestions');
 for(const [key,pt,en,descPt,descEn] of [
  ['reviewAutoOpenNote','Abrir a nota revisada no editor','Open the reviewed note in the editor',
   'Exibe os sublinhados ao escolher uma nota que ainda não está aberta.','Show underlines when choosing a note that is not open yet.'],
  ['reviewPopupEnabled','Mostrar sugestões ao passar o mouse ou mover o cursor','Show suggestions on hover or caret',
   'No celular, toque na palavra sublinhada.','On mobile, tap an underlined word.'],
  ['reviewIgnoreWhitespace','Ocultar sugestões só de espaço e formatação','Hide spacing-only and formatting suggestions',
   'Reduz avisos causados pela estrutura Markdown.','Reduce findings caused by Markdown structure.'],
  ['reviewLiteraryMode','Revisar diálogos e contrações','Review dialogue and contractions',
   'Verbos dicendi e abreviações como ma\u0027. Correções só são aplicadas quando aceitas.',
   'Speech tags and forms such as ma\u0027. Corrections are only applied when accepted.'],
  ['reviewMixedLanguageMode','Respeitar expressões em outros idiomas','Respect phrases in other languages',
   'Evita tratar interjeições e expressões comuns em inglês e outros idiomas como erros de ortografia em português. Detecção conservadora, não uma tradução automática.',
   'Avoid treating common English and other-language interjections and phrases as Portuguese spelling mistakes. Conservative detection, not automatic translation.']
 ])new Setting(editor).setName(writerUi(pt,en)).setDesc(writerUi(descPt,descEn))
  .addToggle(t=>remember(t).setValue(settings[key]!==false).onChange(async value=>{
   settings[key]=value;
   if(key==='reviewIgnoreWhitespace'||key==='reviewLiteraryMode'||key==='reviewMixedLanguageMode')await changed();
   else{if(key==='reviewPopupEnabled'&&!value)plugin.closeReviewPopup?.();await save();}
  }));
 const connection=section('Conexão do corretor','Checker connection');
 const endpointId='writer-grammar-endpoint-'+(++writerV137GrammarSettingId);
 const editConnection=(key,value)=>{
  if(savingConnection||connectionDraft[key]===value)return;
  connectionDraft[key]=value;resetTest();
  connectionFeedback.setText(connectionDirty()?writerUi('Salve as alterações para testar a conexão.','Save your changes to test the connection.'):'');
  refresh();
 };
 new Setting(connection).setName(writerUi('Endereço do servidor','Server endpoint'))
  .setDesc(writerUi('Deixe vazio para usar o servidor gratuito. Para o Premium, use https://api.languagetoolplus.com/v2/check.',
   'Leave empty to use the free server. For Premium, use https://api.languagetoolplus.com/v2/check.'))
  .addText(field=>{
   connectionFields.reviewEndpoint=field;field.inputEl.type='url';
   field.inputEl.setAttribute('aria-describedby',endpointId);
   field.setPlaceholder(WRITER_GRAMMAR_ENDPOINT).setValue(connectionDraft.reviewEndpoint)
    .onChange(value=>editConnection('reviewEndpoint',value.trim()));
  });
 endpointFeedback=connection.createEl('p',{cls:'writer-grammar-feedback',attr:{id:endpointId,role:'status','aria-live':'polite'}});
 new Setting(connection).setName(writerUi('Conta do LanguageTool (opcional)','LanguageTool account (optional)'))
  .setDesc(writerUi('Informe o e-mail da conta Premium ou o usuário exigido pelo seu servidor.',
   'Enter your Premium account email or the username required by your server.'))
  .addText(field=>{connectionFields.reviewUsername=field;field.inputEl.autocomplete='username';
   field.inputEl.setAttribute('autocapitalize','none');
   field.setValue(connectionDraft.reviewUsername).onChange(value=>editConnection('reviewUsername',value.trim().slice(0,254)));});
 let keyInput,showKey=false;
 const keyRow=new Setting(connection).setName(writerUi('Chave da API (opcional)','API key (optional)'))
  .setDesc(writerUi('O servidor público não exige chave. A chave fica nas configurações locais do cofre.',
   'The public server does not require a key. Keys are stored in the vault’s local settings.'));
 keyRow.addText(field=>{connectionFields.reviewApiKey=field;keyInput=field.inputEl;keyInput.type='password';keyInput.autocomplete='off';
  field.setValue(connectionDraft.reviewApiKey).onChange(value=>editConnection('reviewApiKey',value.trim()));});
 keyRow.addButton(button=>{remember(button);button.setButtonText(writerUi('Mostrar','Show')).onClick(()=>{
  showKey=!showKey;keyInput.type=showKey?'text':'password';
  button.setButtonText(showKey?writerUi('Ocultar','Hide'):writerUi('Mostrar','Show'));
  button.buttonEl?.setAttribute('aria-pressed',String(showKey));
  button.buttonEl?.setAttribute('aria-label',showKey?writerUi('Ocultar chave da API','Hide API key'):writerUi('Mostrar chave da API','Show API key'));
 });button.buttonEl?.setAttribute('aria-pressed','false');
 button.buttonEl?.setAttribute('aria-label',writerUi('Mostrar chave da API','Show API key'));});
 new Setting(connection).setName(writerUi('Salvar conexão','Save connection'))
  .setDesc(writerUi('O corretor passa a usar o novo endereço e as credenciais depois de salvar.','The checker uses the new endpoint and credentials after you save.'))
  .addButton(button=>{saveConnection=button;button.setButtonText(writerUi('Salvar','Save')).onClick(async()=>{
   if(savingConnection||settings.reviewEngine==='external'||!connectionDirty()||!connectionValid())return;
   const previous=savedConnection();savingConnection=true;
   Object.assign(settings,connectionDraft);
   try{
    await changed();
    connectionFeedback.setText(writerUi('Conexão salva.','Connection saved.'));
   }catch(_){
    Object.assign(settings,previous);writerV137GrammarInvalidate(plugin);
    connectionFeedback.setText(writerUi('Não foi possível salvar a conexão. Tente novamente.','Could not save the connection. Try again.'));
   }finally{savingConnection=false;refresh();}
  });})
  .addButton(button=>{discardConnection=button;button.setButtonText(writerUi('Descartar alterações','Discard changes')).onClick(()=>{
   if(savingConnection||settings.reviewEngine==='external'||!connectionDirty())return;
   Object.assign(connectionDraft,savedConnection());
   for(const [key,field] of Object.entries(connectionFields))field.setValue(connectionDraft[key]);
   connectionFeedback.setText('');refresh();
  });});
 connectionFeedback=connection.createEl('p',{cls:'writer-grammar-feedback',attr:{role:'status','aria-live':'polite'}});
 const testText=writerUi('Este é um pequeno texto de teste.','This is a short test sentence.');
 new Setting(connection).setName(writerUi('Testar a conexão','Test connection'))
  .setDesc(writerUi('O teste envia apenas a frase ','The test sends only the sentence ')+`“${testText}”`)
  .addButton(button=>{testButton=button;button.setButtonText(writerUi('Testar agora','Test now')).onClick(async()=>{
   if(busy||savingConnection||!writerModuleOn(plugin,'review')||settings.reviewEngine==='external'||connectionDirty()||!connectionValid())return;
   const token=++revision,connectionKey=writerGrammarConnectionKey(settings);busy=true;refresh();
   testStatus.dataset.state='loading';testStatus.setText(writerUi('Verificando a conexão…','Checking the connection…'));
   const current=()=>token===revision&&root.isConnected!==false&&writerModuleOn(plugin,'review')&&
    settings.reviewEngine!=='external'&&connectionKey===writerGrammarConnectionKey(settings);
   try{
    const matches=await plugin.checkGrammar(testText);
    if(!current())return;
    testStatus.dataset.state='success';testStatus.setText(writerUi('Conexão disponível. Sugestões no texto de teste: ',
     'Connection available. Suggestions in the test sentence: ')+matches.length+'.');
   }catch(error){
    if(!current())return;
    testStatus.dataset.state='error';testStatus.setText(String(error?.message||error));
   }finally{if(token===revision){busy=false;refresh();}}
  });});
 testStatus=connection.createEl('p',{cls:'writer-grammar-test-status',attr:{role:'status','aria-live':'polite'}});
 const exceptions=section('Palavras e regras ignoradas','Words and ignored rules');
 const wordsId='writer-grammar-words-'+writerV137GrammarSettingId;
 new Setting(exceptions).setName(writerUi('Dicionário pessoal','Personal spelling dictionary'))
  .setDesc(writerUi('Uma palavra por linha, até 2.000. Nomes e termos inventados não gerarão avisos de ortografia.',
   'One word per line, up to 2,000. Names and invented terms will not produce spelling warnings.'))
  .addTextArea(field=>{remember(field);field.inputEl.rows=5;field.inputEl.setAttribute('aria-describedby',wordsId);
   const stored=settings.reviewCustomWords;
   field.setValue(Array.isArray(stored)?stored.join('\n'):typeof stored==='string'?stored:'').onChange(async value=>{
    const result=writerV137GrammarWords(value);settings.reviewCustomWords=result.words;
    wordsFeedback.setText(result.words.length+' '+writerUi('palavras aceitas','accepted words')+
     (result.skipped?' · '+result.skipped+' '+writerUi('linhas inválidas ou além do limite','invalid or over-limit lines'):''));
    await changed();
   });});
 const wordsFeedback=exceptions.createEl('p',{cls:'writer-grammar-feedback',attr:{id:wordsId,role:'status','aria-live':'polite'}});
 const rulesId='writer-grammar-rules-'+writerV137GrammarSettingId;
 new Setting(exceptions).setName(writerUi('IDs de regras ignoradas','Ignored rule IDs'))
  .setDesc(writerUi('Separe os IDs por vírgula, espaço ou linha. As outras sugestões continuam ativas.',
   'Separate IDs with commas, spaces or lines. Other suggestions remain active.'))
  .addTextArea(field=>{remember(field);field.inputEl.rows=3;field.inputEl.setAttribute('aria-describedby',rulesId);
   field.setValue(settings.reviewIgnoreRules||'').onChange(async value=>{
    const result=writerV137GrammarRules(value);settings.reviewIgnoreRules=result.rules.join(', ');
    rulesFeedback.setText(result.rules.length+' '+writerUi('regras ignoradas','ignored rules')+
     (result.skipped?' · '+result.skipped+' '+writerUi('IDs inválidos não foram salvos','invalid IDs were not saved'):''));
    await changed();
   });});
 const rulesFeedback=exceptions.createEl('p',{cls:'writer-grammar-feedback',attr:{id:rulesId,role:'status','aria-live':'polite'}});
 refresh();return root;
}
