'use strict';
/* Basic v12: context-aware reader for DOM text selections and safe extraction
 * of selected prose into a linked Markdown note. No new TTS network service. */
function writerV12SelectedText(plugin){
 const root=plugin.app.workspace.containerEl,win=root?.ownerDocument?.defaultView;
 const selection=win?.getSelection?.();
 if(!selection||!selection.rangeCount||selection.isCollapsed)return '';
 const node=selection.anchorNode||selection.getRangeAt(0).commonAncestorContainer;
 if(!node||!root.contains(node))return '';
 const text=selection.toString().replace(/\s+/g,' ').trim();
 return text.length>1?text.slice(0,20000):'';
}
function writerV12ReadSelection(plugin,text){
 if(!writerV12On(plugin,'selectionTools'))return;
 const selected=text||writerV12SelectedText(plugin);
 if(!selected){new Notice(writerUi('Selecione texto em uma nota ou documento.','Select text in a note or document.'));return;}
 if(typeof writerV107SpeechStart==='function'){
  writerV107SpeechConfig?.(plugin.settings);
  writerV107SpeechStart(plugin,selected);
 }else new Notice(writerUi('Ative o módulo de voz do Basic.','Enable Basic local speech tools.'));
}
function writerV12SelectionMenu(plugin,event){
 if(!writerV12On(plugin,'selectionTools'))return;
 const root=plugin.app.workspace.containerEl;
 const node=event.target;
 if(!node?.closest||!root.contains(node))return;
 const container=node.closest('.markdown-preview-view, .pdf-viewer, .pdf-container, .markdown-rendered');
 if(!container||node.closest('input,textarea,[contenteditable="true"],.cm-editor,.modal-container'))return;
 const selected=writerV12SelectedText(plugin);
 if(!selected||selected.length>5000)return;
 const menu=new Menu(plugin.app);
 menu.addItem(i=>i.setTitle(writerUi('Ler texto selecionado','Read selected text'))
  .setIcon('volume-2').onClick(()=>writerV12ReadSelection(plugin,selected)));
 menu.addItem(i=>i.setTitle(writerUi('Copiar texto','Copy text'))
  .setIcon('copy').onClick(async()=>{
   try{await root.ownerDocument.defaultView.navigator.clipboard.writeText(selected);}
   catch(err){new Notice(writerUi('Permissão de área de transferência indisponível.','Clipboard permission unavailable.'));}
  }));
 menu.addItem(i=>i.setTitle(writerUi('Configurar voz','Voice settings')).setIcon('settings')
  .onClick(()=>{if(typeof writerV107SpeechPanel==='function')writerV107SpeechPanel(plugin);}));
 menu.showAtPosition({x:event.clientX,y:event.clientY});
}
function writerV12MoveSelection(plugin,editor){
 if(!writerV12On(plugin,'localInbox')||!editor)return;
 const selected=editor.getSelection()||'';
 if(!selected.trim()){new Notice(writerUi('Selecione o trecho que deseja separar.','Select the passage to extract.'));return;}
 const snapshot=editor.getValue();
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Separar trecho em nova nota','Extract passage into a note'));
 modal.contentEl.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Primeiro cria a nova nota. Depois substitui a seleção original por um link. Se a nota mudar, nenhuma substituição será feita.',
  'Creates the new note first, then replaces the original selection with a link. If content changes, no replacement occurs.')});
 const input=modal.contentEl.createEl('input',{attr:{type:'text',placeholder:writerUi('Nome da nova nota','New note title'),style:'width:100%'}});
 const feedback=modal.contentEl.createEl('p',{cls:'setting-item-description'});
 new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Criar nota vinculada','Create linked note')).setCta().onClick(async()=>{
  if(!selected.trim()||!input.value.trim()){feedback.setText(writerUi('Informe um nome.','Enter a title.'));return;}
  b.setDisabled(true);
  try{
   const file=await writerV12CreateNote(plugin,'Basic Extracts',input.value,selected);
   // The original selected text is safe in the new note before touching the editor.
   if(editor.getValue()!==snapshot||editor.getSelection()!==selected){
    feedback.setText(writerUi('A nota original mudou; o trecho foi copiado, sem substituir a seleção.',
      'The original changed; passage was copied without replacing the selection.'));
    return;
   }
   editor.replaceSelection('[['+file.path.replace(/\.md$/,'')+']]');
   modal.close();
  }catch(err){feedback.setText(String(err.message||err));}
  finally{b.setDisabled(false);}
 }));
 modal.open();
}
function writerV12ReaderRegister(plugin){
 plugin.addCommand({id:'v12-reader-selected-dom',name:writerUi('TTS: ler seleção em documentos','TTS: read selection from document'),
  callback:()=>writerV12ReadSelection(plugin)});
 plugin.addCommand({id:'v12-extract-selected',name:writerUi('Notas: separar trecho em nova nota','Notes: extract selection to a linked note'),
  editorCallback:editor=>writerV12MoveSelection(plugin,editor)});
 const root=plugin.app.workspace.containerEl;
 if(root)plugin.registerDomEvent(root,'pointerup',event=>{
  // Optional; default false to avoid competing with Android text-selection HUDs.
  if(!writerV12On(plugin,'selectionTools'))return;
  if(event.pointerType==='touch')return;
  setTimeout(()=>{if(root.isConnected)writerV12SelectionMenu(plugin,event);},75);
 });
}
function writerV12ReaderSettings(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Leitor contextual · v12','Context reader · v12')});
 new Setting(panel).setName(writerUi('Habilitar leitura de seleção em documentos','Enable document selection reader'))
  .setDesc(writerUi('Usa voz local do Basic. Depende de seleção de texto acessível (inclusive a camada de texto de alguns PDFs).',
   'Uses the existing Basic local voice. Requires selectable document text, including supported PDF text layers.'))
  .addToggle(t=>t.setValue(cfg.selectionTools===true).onChange(async v=>{
   cfg.selectionTools=v;await plugin.saveSettings();
  }));
}
