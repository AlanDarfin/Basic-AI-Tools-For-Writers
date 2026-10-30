'use strict';
function writerRenderV4Settings(panel,plugin,id){
 const tr=(p,e)=>w4text(plugin,p,e),cfg=plugin.settings[id];
 if(!cfg)return;
 const toggle=(key,pt,en,desc)=>{
  new Setting(panel).setName(tr(pt,en)).setDesc(desc||'').addToggle(t=>t.setValue(cfg[key]!==false).onChange(async value=>{
   cfg[key]=value;await plugin.saveSettings();
   if(id==='anotherName')plugin.v4Editor?.updateAnotherName();
  }));
 };
 const field=(key,pt,en,description='',numeric=false)=>{
  new Setting(panel).setName(tr(pt,en)).setDesc(description).addText(t=>t.setValue(String(cfg[key]??'')).onChange(async value=>{
   cfg[key]=numeric?Number(value)||0:value;
   await plugin.saveSettings();
  }));
 };
 const title={abbreviations:['Abreviações','Abbreviations'],anotherName:['Segundo título','Secondary note title'],
  viewMode:['Modo de visualização','View mode'],homework:['Tarefas do Longform','Longform tasks'],
  instaToc:['Índice automático','Automatic TOC'],unicode:['Busca Unicode','Unicode search'],
  noteTemplates:['Modelo pelo nome','Template by note name'],tts:['Leitor de voz','Text-to-speech']}[id];
 if(title)panel.createEl('h3',{text:tr(...title)});
 if(id==='abbreviations'){
  toggle('enabled','Ativar expansão ao digitar espaço','Expand abbreviations on space');
  panel.createEl('p',{text:tr('A abreviação é substituída imediatamente quando você digita espaço. Cada entrada pode ser ativada e distinguir maiúsculas.','An abbreviation expands when you type a space. Each entry can be enabled and case-sensitive.')});
  const list=panel.createDiv({cls:'writer-v4-abbrev-list'});
  const render=()=>{
   list.empty();
   const entries=Object.entries(cfg.entries||{}).sort((a,b)=>(a[1].position||0)-(b[1].position||0));
   for(const [key,entry] of entries){
    const row=new Setting(list).setName(key||tr('(nova)','(new)'));
    row.addToggle(t=>t.setValue(entry.isEnabled!==false).onChange(async v=>{entry.isEnabled=v;await plugin.saveSettings();}));
    row.addText(t=>t.setPlaceholder(tr('Abreviação','Abbreviation')).setValue(key).onChange(async v=>{
     const candidate=v.trim();if(!candidate||candidate===key||candidate in cfg.entries)return;
     cfg.entries[candidate]=entry;delete cfg.entries[key];await plugin.saveSettings();render();
    }));
    row.addText(t=>t.setPlaceholder(tr('Expansão','Expansion')).setValue(entry.value||'').onChange(async v=>{entry.value=v;await plugin.saveSettings();}));
    row.addExtraButton(b=>b.setIcon('case-sensitive').setTooltip(tr('Diferenciar maiúsculas','Case sensitive')).onClick(async()=>{
     entry.isCaseSensitive=!entry.isCaseSensitive;await plugin.saveSettings();render();
    }));
    row.addExtraButton(b=>b.setIcon('trash').setTooltip(tr('Remover','Remove')).onClick(async()=>{delete cfg.entries[key];await plugin.saveSettings();render();}));
   }
  };
  new Setting(panel).addButton(b=>b.setButtonText(tr('+ Abreviação','+ Abbreviation')).setCta().onClick(async()=>{
   const key='new-'+Date.now().toString(36);
   cfg.entries[key]={value:'',isEnabled:true,position:Object.keys(cfg.entries).length};
   await plugin.saveSettings();render();
  })).addButton(b=>b.setButtonText(tr('Restaurar padrão','Reset defaults')).onClick(async()=>{
   cfg.entries=structuredClone(W4_DEFAULTS.abbreviations.entries);await plugin.saveSettings();render();
  }));
  render();
 }else if(id==='anotherName'){
  toggle('enabled','Exibir segundo título','Show secondary title');
  field('property','Propriedade YAML','YAML property','e.g. another-name');
  panel.createEl('p',{text:tr('Exibido logo abaixo do título padrão da nota. Aceita somente valores textuais.','Displayed directly below the note inline title. Only text values are accepted.')});
  new Setting(panel).addButton(b=>b.setButtonText(tr('Atualizar títulos','Refresh titles')).onClick(()=>plugin.v4Editor?.updateAnotherName()));
 }else if(id==='viewMode'){
  toggle('enabled','Usar preferência da nota','Use note preference');
  field('property','Propriedade YAML','YAML property','prefer-view');
  new Setting(panel).setName(tr('Modo padrão (sem propriedade)','Default mode if missing')).addDropdown(d=>{
   for(const [k,pt,en] of [['','Não alterar','Do not change'],['read','Leitura','Reading'],['edit','Editar (preferência global)','Edit (global preference)'],['edit-source','Modo fonte','Source mode'],['edit-preview','Prévia ao vivo','Live Preview']])d.addOption(k,tr(pt,en));
   d.setValue(cfg.defaultMode||'').onChange(async v=>{cfg.defaultMode=v;await plugin.saveSettings();});
  });
  panel.createEl('p',{text:tr('Propriedade prefer-view: read, edit, edit-source, edit-preview.','Property prefer-view: read, edit, edit-source, edit-preview.')});
 }else if(id==='homework'){
  toggle('enabled','Ativar aba Tarefas','Enable Tasks tab');
  toggle('autoSort','Ordenar grupos por tarefas pendentes','Sort groups by pending tasks');
  toggle('showTooltips','Mostrar dicas dos botões','Show tooltips');
  toggle('hideCompleted','Ocultar tarefas concluídas','Hide completed tasks');
  new Setting(panel).addButton(b=>b.setButtonText(tr('Abrir tarefas do projeto','Open project tasks')).onClick(()=>plugin.openProjects('homework')));
  panel.createEl('p',{text:tr('Cada projeto mantém listas e grupos próprios. As tarefas não fazem parte do manuscrito compilado.','Each project has independent task lists and groups. Tasks are not part of the compiled manuscript.')});
 }else if(id==='instaToc'){
  toggle('enabled','Ativar Insta TOC','Enable Insta TOC');
  field('title','Título do índice','TOC title');
  field('minLevel','Nível mínimo (1–6)','Minimum level (1–6)','',true);
  field('maxLevel','Nível máximo (1–6)','Maximum level (1–6)','',true);
  field('indent','Recuo em pixels','Indent in pixels','',true);
  field('updateDelay','Atraso da atualização (ms)','Update delay (ms)','',true);
  toggle('collapsed','Iniciar recolhido','Start collapsed');
  new Setting(panel).setName(tr('Estilo de marcador','Bullet style')).addDropdown(d=>{
   for(const value of ['circle','disc','square','decimal','none'])d.addOption(value,value);
   d.setValue(cfg.listType||'circle').onChange(async v=>{cfg.listType=v;await plugin.saveSettings();});
  });
  new Setting(panel).setName(tr('Títulos excluídos','Excluded headings')).addTextArea(t=>t.setValue(cfg.exclude||'').setPlaceholder(tr('Um por linha','One per line')).onChange(async v=>{cfg.exclude=v;await plugin.saveSettings();}));
  new Setting(panel).addButton(b=>b.setButtonText(tr('Inserir índice','Insert TOC')).onClick(()=>plugin.v4Toc.insertBlock()))
   .addButton(b=>b.setButtonText(tr('Atualizar nota atual','Refresh current note')).onClick(()=>{
    const f=plugin.app.workspace.getActiveFile();if(f)plugin.v4Toc.refresh(f);
   }));
 }else if(id==='unicode'){
  toggle('enabled','Ativar busca Unicode','Enable Unicode search');
  field('maxResults','Resultados máximos','Maximum results','',true);
  toggle('searchDescriptions','Buscar nomes e descrições','Search names and descriptions');
  new Setting(panel).addButton(b=>b.setButtonText(tr('Abrir busca Unicode','Open Unicode search')).setCta().onClick(()=>plugin.v4Unicode.open()));
  const favorites=panel.createDiv({cls:'writer-v4-unicode-favorites'});
  const render=()=>{
   favorites.empty();favorites.createEl('h4',{text:tr('Favoritos','Favorites')});
   for(const ch of cfg.favorites||[]){
    favorites.createEl('button',{text:ch+' ×'}).addEventListener('click',async()=>{plugin.v4Unicode.favorite(ch);render();});
   }
  };render();
 }else if(id==='noteTemplates'){
  toggle('enabled','Ativar modelos por nome','Enable templates by note name');
  field('folder','Pasta de modelos','Template folder','Templates');
  toggle('caseSensitive','Diferenciar maiúsculas','Case-sensitive matching');
  toggle('onlyEmpty','Aplicar somente em notas vazias','Apply to empty notes only');
  toggle('includeSubfolders','Incluir subpastas','Include nested folders');
  panel.createEl('p',{text:tr('Ao criar uma nota, procura um modelo Markdown com o mesmo nome na pasta escolhida. Substitui {{title}}, {{date}} e {{time}}. Não altera notas existentes por padrão.','When a note is created, look for a Markdown template with the same name. Supports {{title}}, {{date}} and {{time}}. Existing content is protected by default.')});
 }else if(id==='tts'){
  toggle('enabled','Ativar TTS','Enable text-to-speech');
  toggle('preferGoogle','Preferir voz Google, se instalada','Prefer Google voice if installed');
  toggle('stripMarkdown','Ignorar marcação Markdown','Strip Markdown formatting');
  const voices=plugin.v4TTS?.voices()||[];
  new Setting(panel).setName(tr('Idioma da leitura','Reading language')).addDropdown(d=>{
   for(const value of ['auto','pt-BR','pt-PT','en-US','en-GB','es-ES','fr-FR','de-DE','it-IT','ja-JP','ru-RU','zh-CN','ko-KR','ar-SA','hi-IN'])d.addOption(value,value);
   d.setValue(cfg.language||'auto').onChange(async v=>{cfg.language=v;await plugin.saveSettings();});
  });
  new Setting(panel).setName(tr('Voz do sistema','System voice')).addDropdown(d=>{
   d.addOption('','Auto');
   for(const voice of voices)d.addOption(voice.voiceURI||voice.name,voice.name+' ('+voice.lang+')');
   d.setValue(cfg.voice||'').onChange(async v=>{cfg.voice=v;await plugin.saveSettings();});
  });
  for(const [key,pt,en,min,max] of [['rate','Velocidade','Rate',0.5,2],['pitch','Tom','Pitch',0.5,2],['volume','Volume','Volume',0,1]]){
   new Setting(panel).setName(tr(pt,en)).addSlider(sl=>sl.setLimits(min,max,0.05).setValue(Number(cfg[key])||1).setDynamicTooltip().onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
  }
  field('maxChars','Máximo de caracteres','Maximum characters','',true);
  new Setting(panel).addButton(b=>b.setButtonText(tr('Ler seleção','Read selection')).onClick(()=>plugin.v4TTS.speak(plugin.v4TTS.textFromEditor(true))))
   .addButton(b=>b.setButtonText(tr('Parar','Stop')).onClick(()=>plugin.v4TTS.stop()));
 }
}
function writerV4LanguageSettings(panel,plugin){
 new Setting(panel).setName(w4text(plugin,'Idioma da interface','Interface language'))
  .setDesc('Auto / Português / English').addDropdown(d=>{
   for(const [id,label] of [['auto','Auto'],['pt','Português (Brasil)'],['en','English']])d.addOption(id,label);
   d.setValue(plugin.settings.interfaceLanguage||'auto').onChange(async v=>{plugin.settings.interfaceLanguage=v;await plugin.saveSettings();new Notice(w4text(plugin,'Reabra os painéis para atualizar o idioma.','Reopen panels to update language.'));});
  });
}
