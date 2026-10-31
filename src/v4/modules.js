'use strict';
/* Basic AI v4 RC — opt-in module visibility, persisted independently of data. */
const WRITER_MODULES=[
 ['dictionary','Dicionário e definições','Dictionary & definitions','Consultas locais/online, sinônimos e antônimos.','Local/online lookup, synonyms and antonyms.'],
 ['translation','Tradutor','Translator','Oculta tradução do menu, da seleção e do painel.','Hides translation in sidebar and selection menus.'],
 ['chat','Assistente de escrita','Writing assistant','Oculta o chat e ações que abrem o assistente.','Hides chat and assistant shortcuts.'],
 ['review','Revisão e LanguageTool','Review & LanguageTool','Oculta revisão gramatical, estilo e leitor beta.','Hides grammar, style and beta reader.'],
 ['projects','Longform e projetos','Longform & projects','Oculta o painel e os atalhos de projetos.','Hides project pane and shortcuts.'],
 ['tools','Ferramentas de escrita','Writing tools','Oculta a barra lateral complementar.','Hides supplementary tools pane.'],
 ['complements','Autocomplete','Autocomplete','Oculta sugestões locais e busca de termos.','Hides local word suggestions and indexing controls.'],
 ['variants','Variantes','Writing variants','Oculta comparações e variantes de frases.','Hides writing variants.'],
 ['diff','Diff e perfis','Diff & profiles','Oculta revisão seletiva.','Hides selective review.'],
 ['snapshots','Histórico de versões','Version history','Oculta atalhos de snapshots; não apaga backups.','Hides snapshot shortcuts; never deletes backups.'],
 ['tts','Leitura em voz alta','Text to speech','Oculta o leitor e seus controles.','Hides speech controls.'],
 ['unicode','Unicode','Unicode','Oculta o seletor de símbolos.','Hides symbol picker.'],
 ['templates','Templates e sumário','Templates & table of contents','Oculta modelos e sumários.','Hides templates and table of contents.'],
 ['mentions','Menções','Mentions','Oculta menções de notas.','Hides note mentions.'],
 ['comments','Comentários','Comments','Oculta comentários do Longform; mantém seus dados.','Hides Longform comments; keeps existing data.'],
 ['wordwise','Ações de escrita com IA','AI writing actions','Oculta ações Wordwise e seus menus.','Hides AI writing actions.'],
 ['typewriter','Máquina de escrever','Typewriter','Oculta o modo de foco.','Hides focus mode.'],
 ['cursorMemory','Lembrar posição do cursor','Remember cursor position','Salva e restaura posição, seleção e rolagem por nota.','Saves and restores cursor, selection and scroll per note.'],
 ['keyshots','Keyshots · teclado','Keyshots · keyboard','Navegação e transformação de linhas por atalhos no PC.','Desktop keyboard navigation and line actions.'],
 ['extendedSyntax','Extended Syntax','Extended Syntax','Formatação Markdown com delimitadores estendidos.','Extra Markdown delimiters and rendering.'],
 ['pandocSyntax','Pandoc Syntax','Pandoc Syntax','Listas especiais, exemplos, definições e blocos.','Fancy lists, examples, definitions and blocks.'],
 ['easyTyping','Easy Typing','Easy Typing','Digitação e edição rápida, colagem e Backspace inteligentes.','Typing helpers, smart paste and Backspace.'],
 ['smartTypography','Smart Typography','Smart Typography','Aspas curvas, travessões, reticências e símbolos tipográficos.','Curly quotes, dashes, ellipses and smart symbols.']
];
const WRITER_MODULE_DEFAULTS=Object.fromEntries(WRITER_MODULES.map(([id])=>[id,true]));
function writerMergeModules(settings){
 const existing=settings.visibleModules;
 settings.visibleModules={...WRITER_MODULE_DEFAULTS,...(existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{})};
 for(const id of Object.keys(WRITER_MODULE_DEFAULTS))settings.visibleModules[id]=settings.visibleModules[id]!==false;
 return settings.visibleModules;
}
function writerModuleOn(plugin,id){return plugin?.settings?.visibleModules?.[id]!==false;}
function writerVisibleTabs(plugin,definitions){
 return definitions.filter(([id])=>writerModuleOn(plugin,id));
}
function writerDiagnostics(plugin){
 const app=plugin.app,settings=plugin.settings,checks=[];
 const count=app.vault.getMarkdownFiles?.().length??0;
 checks.push([writerUi('Versão do plugin','Plugin version'),String(plugin.manifest?.version||'?')]);
 checks.push([writerUi('Plataforma','Platform'),app.isMobile?writerUi('Android/iOS (móvel)','Mobile'):writerUi('Desktop','Desktop')]);
 checks.push([writerUi('Notas Markdown','Markdown notes'),String(count)]);
 checks.push([writerUi('Módulos visíveis','Visible modules'),Object.keys(WRITER_MODULE_DEFAULTS).filter(id=>writerModuleOn(plugin,id)).length+'/'+Object.keys(WRITER_MODULE_DEFAULTS).length]);
 checks.push(['LanguageTool',writerModuleOn(plugin,'review')
  ?(settings.autoGrammar?.enabled===false?writerUi('Manual','Manual'):writerUi('Automático quando Revisão está aberta','Automatic while Review is open'))
  :writerUi('Oculto','Hidden')]);
 const endpoint=String(settings.reviewEndpoint||'');
 let safeEndpoint=writerUi('Não configurado','Not configured');
 try{const url=new URL(endpoint);safeEndpoint=url.protocol==='https:'?url.origin:writerUi('URL não HTTPS','Non-HTTPS URL');}catch(_){}
 checks.push([writerUi('Servidor LanguageTool','LanguageTool server'),safeEndpoint]);
 checks.push([writerUi('Provedores de IA','AI providers'),Object.entries(settings.aiKeys||{}).filter(([_,v])=>Boolean(v)).length+writerUi(' com chave configurada',' configured keys')]);
 const nativeSpeech=typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined';
 checks.push(['TTS',!writerModuleOn(plugin,'tts')?writerUi('Oculto','Hidden'):
  nativeSpeech?writerUi('API Web Speech disponível','Web Speech API exposed'):writerUi('API Web Speech indisponível','Web Speech API unavailable')]);
 checks.push([writerUi('Snapshots','Snapshots'),settings.snapshots?.enabled===false?writerUi('Desativados','Disabled'):writerUi('Ativos','Active')]);
 return checks;
}
function writerRenderModuleSettings(plugin,panel,refresh){
 panel.createEl('h3',{text:writerUi('Módulos visíveis','Visible modules')});
 panel.createEl('p',{text:writerUi('Desative recursos que não utiliza para ocultar abas, menus e atalhos de acesso. Os dados e configurações são mantidos. Recursos podem ser reativados aqui a qualquer momento.','Hide unused features from tabs and menus. Existing settings and data are retained and can be restored any time.'),cls:'dictionary-muted'});
 for(const [id,pt,en,descPt,descEn] of WRITER_MODULES){
  new Setting(panel).setName(writerUi(pt,en)).setDesc(writerUi(descPt,descEn))
   .addToggle(t=>t.setValue(writerModuleOn(plugin,id)).onChange(async value=>{
    plugin.settings.visibleModules[id]=value;
    await plugin.saveSettings();
    plugin.refreshModuleVisibility?.();
    if(typeof refresh==='function')refresh();
   }));
 }
}
function writerRenderDiagnostics(plugin,panel){
 panel.createEl('h3',{text:writerUi('Diagnóstico','Diagnostics')});
 panel.createEl('p',{text:writerUi('Informações locais sem revelar chaves de API. O diagnóstico não envia dados para serviços externos.','Local status without revealing API keys. Diagnostics do not send requests to external services.'),cls:'dictionary-muted'});
 const table=panel.createDiv({cls:'writer-diagnostics'});
 for(const [label,value] of writerDiagnostics(plugin)){
  const row=table.createDiv({cls:'writer-diagnostic-item'});
  row.createSpan({text:label,cls:'writer-diagnostic-label'});
  row.createSpan({text:value,cls:'writer-diagnostic-value'});
 }
 new Setting(panel).setName(writerUi('Atualizar informações','Refresh information'))
  .addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(()=>{
   table.empty();
   for(const [label,value] of writerDiagnostics(plugin)){
    const row=table.createDiv({cls:'writer-diagnostic-item'});
    row.createSpan({text:label,cls:'writer-diagnostic-label'});
    row.createSpan({text:value,cls:'writer-diagnostic-value'});
   }
  }));
}
