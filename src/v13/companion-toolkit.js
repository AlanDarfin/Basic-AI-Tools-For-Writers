'use strict';
/* Independently implemented compatibility descriptors. No companion code is bundled.
 * Capabilities below were verified against the source revisions in each descriptor.
 * Companion settings remain owned and persisted by the companion itself.
 */
const WRITER_COMPANION_TOOLKIT_SPECS=[
 {
  id:'ahmed-toolkit',name:'Ultimate Toolkit',mobile:true,
  source:{repo:'https://github.com/ahmdmusa/obsidian-toolkit',sha:'70506a95a9059aa86da1c7688ea24f8df3dd4899',version:'2.9.17',license:'MIT'},
  description:{pt:'Leitura pelo motor do Toolkit, player flutuante e ferramentas de escrita do plugin instalado.',en:'Speech through Toolkit’s engine, its floating player and the installed plugin’s writing tools.'},
  notes:{pt:'O player é uma janela flutuante nativa, não um painel lateral. O motor online auditado envia trechos ao Google Translate e usa árabe ou inglês. Vozes e rede são controladas pelo Toolkit.',en:'The player is a native floating window, not a sidebar view. The audited online engine sends passages to Google Translate and uses Arabic or English. Toolkit controls voices and networking.'},
  commands:[
   {id:'ahmed-toolkit:flowkit-tts-show-player',pt:'Abrir player do Toolkit',en:'Open Toolkit player',kind:'panel',module:'tts',requiresSetting:'enableTTS'},
   {id:'ahmed-toolkit:flowkit-tts-play-selection',pt:'Toolkit: ler seleção',en:'Toolkit: read selection',kind:'speech',module:'tts',requiresSetting:'enableTTS'},
   {id:'ahmed-toolkit:flowkit-tts-play-note',pt:'Toolkit: ler nota atual',en:'Toolkit: read current note',kind:'speech',module:'tts',requiresSetting:'enableTTS'},
   {id:'ahmed-toolkit:flowkit-tts-play-from-cursor',pt:'Toolkit: ler a partir do cursor',en:'Toolkit: read from cursor',kind:'speech',module:'tts',requiresSetting:'enableTTS'},
   {id:'ahmed-toolkit:open-formatting-palette',pt:'Abrir paleta de formatação',en:'Open formatting palette',kind:'menu',requiresSetting:'enableFormatting'},
   {id:'ahmed-toolkit:focus-current-folder',pt:'Focar pasta atual',en:'Focus current folder',kind:'action',requiresSetting:'enableFolderFocus'},
   {id:'ahmed-toolkit:clear-folder-focus',pt:'Limpar foco da pasta',en:'Clear folder focus',kind:'action',requiresSetting:'enableFolderFocus'}
  ],
  views:[],
  saveMethod:'saveSettings',
  settings:[
   {key:'enableTTS',type:'boolean',pt:'Leitura do Toolkit',en:'Toolkit speech',requiresReload:true,description:{pt:'O motor responde imediatamente; atalhos e menus nativos exigem recarregar o Toolkit.',en:'The engine updates immediately; native commands and menus require reloading Toolkit.'}},
   {key:'ttsEngine',type:'select',pt:'Motor de voz do Toolkit',en:'Toolkit speech engine',options:[{value:'offline',pt:'Vozes do sistema',en:'System voices'},{value:'online',pt:'Motor online do Toolkit',en:'Toolkit online engine'}]},
   {key:'ttsRate',type:'number',pt:'Velocidade do Toolkit',en:'Toolkit speech rate',min:0.5,max:2,step:0.05},
   {key:'ttsPitch',type:'number',pt:'Tom do Toolkit',en:'Toolkit pitch',min:0.5,max:1.5,step:0.05},
   {key:'ttsShowFloatingPlayer',type:'boolean',pt:'Player flutuante durante a leitura',en:'Floating player during speech'},
   {key:'enableImageControl',type:'boolean',pt:'Controles de imagem do Toolkit',en:'Toolkit image controls'},
   {key:'enableFormatting',type:'boolean',pt:'Formatação do Toolkit',en:'Toolkit formatting',requiresReload:true},
   {key:'enableFolderFocus',type:'boolean',pt:'Foco de pastas do Toolkit',en:'Toolkit folder focus',requiresReload:true},
   {key:'enableFileTree',type:'boolean',pt:'Ícones de arquivos e pastas do Toolkit',en:'Toolkit file and folder icons',requiresReload:true},
   {key:'fileTreeThumbnails',type:'boolean',pt:'Miniaturas de imagens no explorador',en:'Image thumbnails in file explorer',requiresReload:true},
   {key:'fileTreeRowHeight',type:'select',pt:'Espaçamento do explorador do Toolkit',en:'Toolkit explorer spacing',requiresReload:true,options:[{value:'compact',pt:'Compacto',en:'Compact'},{value:'default',pt:'Padrão',en:'Default'},{value:'spacious',pt:'Espaçoso',en:'Spacious'}]}
  ]
 },
 {
  id:'visual-kit',name:'Visual Kit',mobile:false,
  source:{repo:'https://github.com/pedrohf-dev/visual-kit',sha:'e5766c85a36c7895bf775ae597ec05f8edb88217',version:'0.9.0',license:'MIT'},
  description:{pt:'Editor e visualizador HTML, anotações em imagens e colagem de imagens do Visual Kit instalado.',en:'HTML editor and viewer, image annotation and image pasting through the installed Visual Kit.'},
  notes:{pt:'Anotações abrem a janela nativa sobre a imagem no cursor. A visualização HTML usa o arquivo HTML atual. O plugin original é exclusivo de desktop.',en:'Annotation opens the native dialog for the image at the cursor. HTML viewing uses the current HTML file. The original plugin is desktop only.'},
  commands:[
   {id:'visual-kit:annotate-image',pt:'Anotar imagem no cursor',en:'Annotate image at cursor',kind:'editor',editor:true},
   {id:'visual-kit:normalize-image-sizes',pt:'Configurar tamanhos de imagem',en:'Configure image sizes',kind:'editor',editor:true},
   {id:'visual-kit:copy-with-images',pt:'Copiar com imagens',en:'Copy with images',kind:'clipboard',editor:true},
   {id:'visual-kit:create-html-note',pt:'Criar nota HTML',en:'Create HTML note',kind:'create',requiresSetting:'htmlNotes'},
   {id:'visual-kit:save-html-template',pt:'Salvar nota HTML como modelo',en:'Save HTML note as template',kind:'create',requiresSetting:'htmlNotes'},
   {id:'visual-kit:copy-as-rich-html',pt:'Copiar seleção HTML formatada',en:'Copy formatted HTML selection',kind:'clipboard',requiresSetting:'htmlNotes'},
   {id:'visual-kit:copy-whole-html-note',pt:'Copiar nota HTML completa',en:'Copy whole HTML note',kind:'clipboard',requiresSetting:'htmlNotes'},
   {id:'visual-kit:rebuild-image-duplicate-index',pt:'Reconstruir índice de imagens duplicadas',en:'Rebuild duplicate image index',kind:'action'}
  ],
  views:[{type:'visual-kit-html-note',id:'visual-kit-html-note',pt:'Abrir HTML no Visual Kit',en:'Open HTML in Visual Kit',file:true,extensions:['html','htm'],requiresSetting:'htmlNotes'}],
  saveMethod:'persist',
  settings:[
   {key:'htmlNotes',type:'boolean',pt:'Editor de notas HTML',en:'HTML note editor',requiresReload:true},
   {key:'htmlRegisterExtensions',type:'boolean',pt:'Abrir HTML automaticamente no Visual Kit',en:'Open HTML automatically in Visual Kit',requiresReload:true},
   {key:'htmlDefaultMode',type:'select',pt:'Modo inicial do HTML',en:'Initial HTML mode',options:[{value:'visual',pt:'Visual',en:'Visual'},{value:'source',pt:'Código',en:'Source'},{value:'preview',pt:'Prévia',en:'Preview'}]},
   {key:'htmlImportImages',type:'boolean',pt:'Importar imagens ao colar HTML',en:'Import images when pasting HTML'},
   {key:'htmlExternalImages',type:'select',pt:'Imagens externas em HTML',en:'External HTML images',options:[{value:'download',pt:'Baixar para o cofre',en:'Download into vault'},{value:'block',pt:'Bloquear',en:'Block'}]},
   {key:'multiPaste',type:'boolean',pt:'Colar várias imagens',en:'Paste multiple images'},
   {key:'pasteWidth',type:'boolean',pt:'Aplicar largura ao colar',en:'Apply width when pasting'},
   {key:'width',type:'number',pt:'Largura padrão de imagem',en:'Default image width',min:1,max:10000,step:1},
   {key:'preserveHeight',type:'boolean',pt:'Preservar altura ao normalizar',en:'Preserve height when normalizing'},
   {key:'duplicates',type:'boolean',pt:'Detectar imagens duplicadas',en:'Detect duplicate images'},
   {key:'duplicateAction',type:'select',pt:'Ao encontrar imagem duplicada',en:'When a duplicate image is found',options:[{value:'reuse',pt:'Reutilizar',en:'Reuse'},{value:'ask',pt:'Perguntar',en:'Ask'},{value:'save',pt:'Salvar outra cópia',en:'Save another copy'}]},
   {key:'quickTools',type:'boolean',pt:'Ferramentas rápidas de imagem',en:'Quick image tools'},
   {key:'autoMarkers',type:'boolean',pt:'Marcadores para reabrir anotações',en:'Markers for reopening annotations'},
   {key:'editable',type:'boolean',pt:'Manter anotações editáveis',en:'Keep annotations editable'},
   {key:'ribbon',type:'boolean',pt:'Botão de imagens na barra lateral',en:'Image button in ribbon',afterSave:'updateRibbon'}
  ]
 }
];

const WRITER_COMPANION_TOOLKIT_SESSIONS=new WeakMap();
const WRITER_COMPANION_TOOLKIT_OWNERS=new WeakMap();
function writerCompanionToolkitMessage(pt,en){return typeof writerUi==='function'?writerUi(pt,en):en;}
function writerCompanionToolkitAllowed(plugin){
 if(!plugin?.settings)return false;
 const settings=plugin.settings,cfg=settings.v12Toolkit;
 if(cfg?.enabled===false||cfg?.integrations===false)return false;
 if(typeof writerCompanionEnabled==='function'&&!writerCompanionEnabled(plugin,'ahmed-toolkit'))return false;
 if(settings.companionCompatibility?.enabledById?.['ahmed-toolkit']===false)return false;
 if(settings.visibleModules?.tts===false||settings.finalSuite?.tts?.enabled===false)return false;
 if(typeof writerModuleOn==='function'&&!writerModuleOn(plugin,'tts'))return false;
 return settings.companionCompatibility?.ttsProvider==='ahmed-toolkit';
}
function writerCompanionToolkitInstance(plugin){return plugin?.app?.plugins?.plugins?.['ahmed-toolkit']||null;}
function writerCompanionToolkitManagerReady(manager){
 return !!manager&&['playText','pause','resume','stop'].every(key=>typeof manager[key]==='function')&&Array.isArray(manager.sentences);
}
function writerCompanionToolkitOwns(plugin,handle){
 const owner=handle&&WRITER_COMPANION_TOOLKIT_OWNERS.get(handle);
 if(!owner||owner.plugin!==plugin||WRITER_COMPANION_TOOLKIT_SESSIONS.get(plugin)!==handle)return null;
 const live=writerCompanionToolkitInstance(plugin);
 // A replacement instance or a native Toolkit read must never inherit Basic controls.
 if(live!==owner.instance||live?.ttsMgr!==owner.manager||owner.manager.sentences!==owner.sentences)return null;
 return owner;
}
function writerCompanionToolkitSpeechStatus(plugin,handle){
 const instance=writerCompanionToolkitInstance(plugin),manager=instance?.ttsMgr;
 const available=!!instance&&writerCompanionToolkitManagerReady(manager),enabled=writerCompanionToolkitAllowed(plugin)&&instance?.settings?.enableTTS===true;
 const owner=writerCompanionToolkitOwns(plugin,handle||WRITER_COMPANION_TOOLKIT_SESSIONS.get(plugin));
 return {available,enabled,owned:!!owner,speaking:!!owner&&manager.isPlaying===true,paused:!!owner&&manager.isPlaying===true&&manager.isPaused===true,
  engine:instance?.settings?.ttsEngine==='offline'?'offline':'online',onlineAllowed:plugin?.settings?.companionCompatibility?.allowToolkitOnline===true};
}
function writerCompanionToolkitSpeech(plugin,text,title){
 if(!writerCompanionToolkitAllowed(plugin))throw new Error(writerCompanionToolkitMessage('Ative a integração e o módulo de leitura e escolha o Toolkit como provedor.','Enable the integration and speech module, and select Toolkit as the provider.'));
 const instance=writerCompanionToolkitInstance(plugin),manager=instance?.ttsMgr;
 if(!instance||!writerCompanionToolkitManagerReady(manager))throw new Error(writerCompanionToolkitMessage('O motor de leitura do Toolkit não está disponível nesta versão ou o plugin está desligado.','Toolkit’s speech engine is unavailable in this version or the plugin is disabled.'));
 if(instance.settings?.enableTTS!==true)throw new Error(writerCompanionToolkitMessage('Ative a leitura nas configurações do Toolkit.','Enable speech in Toolkit settings.'));
 const online=instance.settings.ttsEngine!=='offline';
 if(online&&plugin.settings.companionCompatibility?.allowToolkitOnline!==true)throw new Error(writerCompanionToolkitMessage('O motor online do Toolkit envia texto ao Google Translate. Ative a permissão específica do Toolkit nas integrações do Basic ou selecione vozes do sistema no Toolkit.','Toolkit’s online engine sends text to Google Translate. Enable Toolkit’s specific permission in Basic integrations or select system voices in Toolkit.'));
 const passage=typeof text==='string'?text.trim():'';
 if(!passage)throw new Error(writerCompanionToolkitMessage('Não há texto para ler.','There is no text to read.'));
 const max=Number(plugin.settings.finalSuite?.tts?.maxCharacters);
 if(Number.isFinite(max)&&max>0&&passage.length>max)throw new Error(writerCompanionToolkitMessage('A seleção excede o limite de leitura configurado no Basic.','The selection exceeds Basic’s configured speech limit.'));
 const previous=manager.sentences;
 manager.playText(passage,typeof title==='string'&&title.trim()?title:writerCompanionToolkitMessage('Leitura do Basic','Basic speech'));
 if(manager.sentences===previous||!Array.isArray(manager.sentences)||manager.isPlaying!==true)throw new Error(writerCompanionToolkitMessage('O Toolkit não iniciou a leitura deste texto.','Toolkit did not start reading this text.'));
 const handle=Object.freeze({provider:'ahmed-toolkit'});
 WRITER_COMPANION_TOOLKIT_OWNERS.set(handle,{plugin,instance,manager,sentences:manager.sentences});
 WRITER_COMPANION_TOOLKIT_SESSIONS.set(plugin,handle);
 return handle;
}
function writerCompanionToolkitControl(plugin,handle,action){
 if(!['pause','resume','stop'].includes(action))return false;
 const owner=writerCompanionToolkitOwns(plugin,handle);
 if(!owner)return false;
 // Stop remains available when a Basic switch is disabled, for owned-session cleanup.
 if(action!=='stop'&&(!writerCompanionToolkitAllowed(plugin)||owner.instance.settings?.enableTTS!==true))return false;
 if(action!=='stop'&&owner.manager.isPlaying!==true)return false;
 if(action==='stop'){
  WRITER_COMPANION_TOOLKIT_SESSIONS.delete(plugin);
  WRITER_COMPANION_TOOLKIT_OWNERS.delete(handle);
  // Toolkit stop() cancels global Web Speech; do not call it after native playback ended.
  if(owner.manager.isPlaying===true)owner.manager.stop(true);
 }else owner.manager[action]();
 return true;
}
