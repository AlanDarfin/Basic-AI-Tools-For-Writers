'use strict';
/* Basic 12.0.1: Android quick actions without depending on other plugins'
 * ribbon listeners; defer nested native actions until the first menu closes. */
function writerV1201Editor(plugin){
 const workspace=plugin.app.workspace,file=workspace.getActiveFile?.();
 if(file&&file.extension!=='md')return null;
 const active=typeof MarkdownView!=='undefined'?workspace.getActiveViewOfType?.(MarkdownView):null;
 for(const view of [active,workspace.activeLeaf?.view,workspace.activeEditor]){
  if(!view?.editor||(view.file&&file&&view.file.path!==file.path))continue;
  if(typeof view.getViewType==='function'&&view.getViewType()!=='markdown')continue;
  return view.editor;
 }
 return null;
}
function writerV1201Read(plugin){
 if(!writerModuleOn(plugin,'tts')){new Notice(writerUi('Ative TTS em Módulos.','Enable TTS in Modules.'));return;}
 const editor=writerV1201Editor(plugin),selected=editor?.getSelection?.()||'';
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
 if(file?.extension==='md'){
  if(typeof editor?.getValue==='function'){play(editor.getValue());return;}
  const path=file.path;
  return plugin.app.vault.cachedRead(file).then(text=>{
   if(file.path===path&&plugin.app.workspace.getActiveFile?.()?.path===path)play(text);
  }).catch(e=>new Notice(String(e.message||e)));
 }
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
 if(typeof plugin.writerV133SpacesChoose==='function')menu.addItem(item=>item
  .setTitle(writerUi('Escolher Space','Choose Space')).setIcon('layers')
  .onClick(()=>plugin.writerV133SpacesChoose()));
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
function writerV1201NativeAction(plugin,action,label,parentMenu,trigger){
 if(!action||!plugin)return false;
 // A repeated tap is already handled; falling through would click the native
 // toggle a second time and close the popup that the first tap just opened.
 if(plugin._writerV1201NativeRelay)return true;
 const name=String(label||action.getAttribute?.('aria-label')||'');
 const isBookmark=/^(?:marcador|bookmark|adicionar marcador|adicionar aos favoritos)$/i.test(name.trim());
 const command=isBookmark?writerV1201BookmarkCommand(plugin):null;
 const doc=action.ownerDocument||trigger?.ownerDocument||plugin.app.workspace?.containerEl?.ownerDocument;
 const win=doc?.defaultView;
 const popupSelector='.menu,.popover,.suggestion-container,.modal-container,.bases-toolbar-menu';
 const shown=node=>{
  if(!node||node.isConnected===false||node.hidden)return false;
  const style=win?.getComputedStyle?.(node)||node.style;
  return style?.display!=='none'&&style?.visibility!=='hidden';
 };
 const popups=()=>Array.from(doc?.querySelectorAll?.(popupSelector)||[]).filter(shown);
 const nativeMenus=new Set();
 let stopped=false,observer=null,anchor=null,opened=false,checkTimer=null,openTimer=null;
 const finish=(refresh=true)=>{
  if(stopped)return;
  stopped=true;observer?.disconnect?.();
  if(checkTimer!==null)clearTimeout(checkTimer);
  if(openTimer!==null)clearTimeout(openTimer);
  anchor?.remove?.();
  plugin._writerV1201NativeRelay=false;
  plugin._writerV1010NativeActionPending=false;
  plugin._writerV1201NativeRelayState=null;
  if(refresh)plugin.writerV1010Refresh?.();
 };
 const cancel=()=>{
  finish(false);
  for(const menu of nativeMenus)menu.hide?.();
 };
 plugin._writerV1201NativeRelayState={cancel};
 plugin._writerV1201NativeRelay=true;
 plugin._writerV1010NativeActionPending=true;
 if(!plugin._writerV1201NativeRelayCleanup){
  plugin._writerV1201NativeRelayCleanup=true;
  plugin.register?.(()=>plugin._writerV1201NativeRelayState?.cancel());
 }
 const open=()=>{
  if(stopped||opened)return;
  opened=true;
  const before=new Set(popups()),tracked=new Set();
  const update=()=>{
   if(stopped)return;
   if(action.isConnected===false){cancel();plugin.writerV1010Refresh?.();return;}
   for(const popup of popups())if(!before.has(popup))tracked.add(popup);
   if(tracked.size&&![...tracked].some(shown))finish();
  };
  const Observer=win?.MutationObserver||(typeof MutationObserver==='function'?MutationObserver:null);
  if(Observer&&doc?.body){
   observer=new Observer(update);
   observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  }
  // Obsidian dismisses menus when their parent element is hidden. Native view
  // actions are often hidden on mobile. Give only menus opened by this click a
  // stable, laid-out anchor; leave the native button and its listeners in place.
  const parent=typeof Menu!=='undefined'?Menu.prototype:null;
  const oldParent=parent?.setParentElement,oldShow=parent?.showAtPosition;
  const reanchored=new Set();
  const stableAnchor=()=>{
   if(anchor||!doc?.body||!doc.createElement)return anchor;
   const point=(trigger||action).getBoundingClientRect?.()||{};
   anchor=doc.createElement('span');
   anchor.className='writer-v137-native-menu-anchor';
   anchor.setAttribute('aria-hidden','true');
   Object.assign(anchor.style,{position:'absolute',left:(Number(point.left)||0)+'px',
    top:(Number(point.bottom)||Number(point.top)||0)+'px',width:'1px',height:'1px',opacity:'0',pointerEvents:'none'});
   doc.body.appendChild(anchor);return anchor;
  };
  const setParent=function(element){
   const target=element===action?stableAnchor():null;
   if(target)reanchored.add(this);
   return oldParent.call(this,target||element);
  };
  const show=function(...args){
   nativeMenus.add(this);
   if(reanchored.has(this)&&anchor){
    const point=anchor.getBoundingClientRect();
    args[0]={...args[0],x:point.left,y:point.bottom};
   }
   return oldShow.apply(this,args);
  };
  try{
   // These public API wrappers exist only during synchronous event dispatch.
   // No global hook remains installed while the popup is open.
   if(typeof oldParent==='function')parent.setParentElement=setParent;
   if(typeof oldShow==='function')parent.showAtPosition=show;
   if(command&&plugin.app.commands?.executeCommandById){
    plugin.app.commands.executeCommandById(command.id);
   }else if(action.disabled===true||action.getAttribute?.('aria-disabled')==='true'){
    new Notice(writerUi('Esta ação não está disponível agora.','This action is currently unavailable.'));
   }else if(action.isConnected!==false){
    action.click();
   }else new Notice(writerUi('O painel mudou. Reabra o menu e tente novamente.',
      'The pane changed. Reopen its menu and try again.'));
  }catch(error){
   console.warn('[Basic] Native sidebar action:',error);
   new Notice(writerUi('Não foi possível executar esta ação.','Could not execute this action.'));
  }finally{
   if(parent?.setParentElement===setParent)parent.setParentElement=oldParent;
   if(parent?.showAtPosition===show)parent.showAtPosition=oldShow;
   update();
   // Ordinary actions finish after their event. Popups hold their anchor until
   // actual removal/closing, including long-lived sheets and nested menus.
   if(!stopped)checkTimer=setTimeout(()=>{update();if(!tracked.size)finish();},0);
  }
 };
 const ready=()=>{if(!stopped&&openTimer===null)openTimer=setTimeout(open,0);};
 if(typeof parentMenu?.onHide==='function')parentMenu.onHide(ready);
 else ready();
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
