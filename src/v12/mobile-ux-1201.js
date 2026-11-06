'use strict';
/* Basic 12.0.1: Android quick actions without depending on other plugins'
 * ribbon listeners; defer nested native actions until the first menu closes. */
function writerV1201Editor(plugin){
 return plugin.app.workspace.activeEditor?.editor||
  plugin.app.workspace.getActiveViewOfType?.(MarkdownView)?.editor||
  plugin.app.workspace.getLeavesOfType?.('markdown')?.find(l=>l===plugin.app.workspace.activeLeaf)?.view?.editor||null;
}
function writerV1201Read(plugin){
 if(!writerModuleOn(plugin,'tts')){new Notice(writerUi('Ative TTS em Módulos.','Enable TTS in Modules.'));return;}
 const selected=writerV1201Editor(plugin)?.getSelection?.()||'';
 const domText=typeof writerV12SelectedText==='function'?writerV12SelectedText(plugin):'';
 const play=source=>{
  const content=String(source||'').replace(/^---\r?\n[\s\S]*?\r?\n---\s*/,'')
   .replace(/(?:^|\n)#{1,6}\s+/g,' ').replace(/!\[\[[^\]]+\]\]/g,'')
   .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,path,alias)=>alias||path)
   .replace(/[\x60*_~]/g,' ').trim();
  if(!content){new Notice(writerUi('Nenhum texto disponível.','No readable text available.'));return;}
  if(typeof writerV107SpeechStart!=='function'){
   new Notice(writerUi('O leitor de voz local não está disponível.','Local speech is unavailable.'));return;
  }
  writerV107SpeechConfig(plugin.settings);
  writerV107SpeechStart(plugin,content.slice(0,30000));
 };
 if(selected.trim()||domText.trim()){play(selected.trim()||domText.trim());return;}
 const file=plugin.app.workspace.getActiveFile?.();
 if(file?.extension==='md'){void plugin.app.vault.cachedRead(file).then(play).catch(e=>new Notice(String(e.message||e)));return;}
 new Notice(writerUi('Abra uma nota Markdown ou selecione texto no documento.','Open a Markdown note or select document text.'));
}
function writerV1201Format(plugin){
 if(!writerModuleOn(plugin,'formatToolbar')){new Notice(writerUi('Ative a formatação em Módulos.','Enable formatting in Modules.'));return;}
 const editor=writerV1201Editor(plugin);
 if(!editor){new Notice(writerUi('Abra uma nota no modo de edição para formatar.','Open a note in editing mode to format.'));return;}
 if(typeof writerV12OpenPalette==='function')writerV12OpenPalette(plugin,editor);
 else new Notice(writerUi('Paleta indisponível.','Formatting palette unavailable.'));
}
function writerV1201Folder(plugin){
 if(typeof writerV12FolderFocus!=='function')return new Notice(writerUi('Foco por pasta indisponível.','Folder focus is unavailable.'));
 writerV12FolderFocus(plugin,!!plugin._writerV12FolderFocus);
}
function writerV1201Zen(plugin){
 const doc=plugin.app.workspace.containerEl?.ownerDocument;
 if(!doc)return;
 const body=doc.body,enable=!body.classList.contains('writer-v1201-zen');
 body.classList.toggle('writer-v1201-zen',enable);
 plugin._writerV1201Zen=enable;
 plugin._writerV1201ZenExit?.remove?.();plugin._writerV1201ZenExit=null;
 if(enable){
  const exit=doc.createElement('button');
  exit.type='button';exit.className='writer-v1201-zen-exit';
  exit.setAttribute('aria-label',writerUi('Sair do modo de foco','Exit focus mode'));
  exit.textContent=writerUi('Sair do foco','Exit focus');
  exit.addEventListener('click',()=>writerV1201Zen(plugin));
  body.appendChild(exit);plugin._writerV1201ZenExit=exit;
 }
}
function writerV1201QuickMenu(plugin,event){
 const menu=new Menu(plugin.app);
 for(const [title,icon,callback] of [
  [writerUi('Ler seleção ou nota','Read selection or note'),'volume-2',()=>writerV1201Read(plugin)],
  [writerUi('Abrir paleta de formatação','Open formatting palette'),'wand-sparkles',()=>writerV1201Format(plugin)],
  [writerUi('Alternar tela de foco','Toggle focus screen'),'maximize-2',()=>writerV1201Zen(plugin)],
  [writerUi('Alternar foco na pasta','Toggle folder focus'),'target',()=>writerV1201Folder(plugin)],
  [writerUi('Central de integrações','Integration center'),'blocks',()=>writerV12OpenIntegrationHub(plugin)]
 ])menu.addItem(i=>i.setTitle(title).setIcon(icon).onClick(callback));
 if(event?.clientX!==undefined)menu.showAtMouseEvent(event);
 else menu.showAtPosition({x:80,y:150});
}
function writerV1201BookmarkCommand(plugin){
 const commands=plugin.app.commands?.listCommands?.()||Object.values(plugin.app.commands?.commands||{});
 return commands.find(command=>/^bookmarks?:/i.test(command.id||'')&&
  /(?:bookmark|marcar|marcador|adicionar.*favorito)/i.test(command.name||'')&&
  !/(?:remove|delete|remover|apagar|unbookmark)/i.test(command.id+' '+command.name))||null;
}
function writerV1201NativeAction(plugin,action,label){
 if(!action||!plugin)return false;
 if(plugin._writerV1201NativeRelay)return false;
 const name=String(label||action.getAttribute?.('aria-label')||'');
 const isBookmark=/^(?:marcador|bookmark|adicionar marcador|adicionar aos favoritos)$/i.test(name.trim());
 const command=isBookmark?writerV1201BookmarkCommand(plugin):null;
 plugin._writerV1201NativeRelay=true;
 plugin._writerV1010NativeActionPending=true;
 setTimeout(()=>{
  try{
   if(command&&plugin.app.commands?.executeCommandById){
    plugin.app.commands.executeCommandById(command.id);
   }else if(action.isConnected){
    action.click();
   }else new Notice(writerUi('O painel mudou. Reabra o menu e tente novamente.',
      'The pane changed. Reopen its menu and try again.'));
  }catch(error){
   console.warn('[Basic] Native sidebar action:',error);
   new Notice(writerUi('Não foi possível executar esta ação.','Could not execute this action.'));
  }finally{
   setTimeout(()=>{
    plugin._writerV1201NativeRelay=false;
    plugin._writerV1010NativeActionPending=false;
    plugin.writerV1010Refresh?.();
   },1100);
  }
 },380);
 return true;
}
function writerV1201RibbonRegister(plugin){
 if(plugin._writerV1201Ribbon)return;
 const ribbon=plugin.addRibbonIcon?.('panel-top',writerUi('Basic: ações rápidas','Basic: quick actions'),
  event=>writerV1201QuickMenu(plugin,event));
 if(ribbon){ribbon.addClass?.('writer-v1201-ribbon');plugin._writerV1201Ribbon=ribbon;}
 for(const [id,pt,en,callback] of [
  ['v1201-read','Leitura: ler texto ou nota atual','Reading: read current selection or note',()=>writerV1201Read(plugin)],
  ['v1201-format','Formatação: abrir paleta','Formatting: open palette',()=>writerV1201Format(plugin)],
  ['v1201-focus-screen','Foco: alternar tela limpa','Focus: toggle clean screen',()=>writerV1201Zen(plugin)],
  ['v1201-folder-focus','Explorador: alternar foco na pasta','Explorer: toggle folder focus',()=>writerV1201Folder(plugin)],
  ['v1201-quick-actions','Basic: abrir ações rápidas','Basic: open quick actions',()=>writerV1201QuickMenu(plugin)]
 ])plugin.addCommand({id,name:writerUi(pt,en),callback});
 plugin.register?.(()=>{
  plugin._writerV1201ZenExit?.remove?.();
  plugin._writerV1201ZenExit=null;
  plugin.app.workspace.containerEl?.ownerDocument?.body?.classList.remove('writer-v1201-zen');
 });
}
