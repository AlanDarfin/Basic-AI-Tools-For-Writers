'use strict';
/* Close ONLY restored root tabs during a genuine new Obsidian session.
 * Preserve all sidebars, the current session, and on-plugin-reload workspace state. */
function writerV106HomeStartupPolicy(cfg,layoutAlreadyReady,sessionAlreadyHandled){
 if(!cfg?.homeCleanStart||layoutAlreadyReady||sessionAlreadyHandled)return 'skip';
 return 'clean';
}
function writerV106HomeChooseLeaf(leaves,active,type){
 const valid=Array.isArray(leaves)?leaves.filter(Boolean):[];
 if(!valid.length)return null;
 return valid.find(leaf=>leaf.getViewState?.()?.type===type)||
  (valid.includes(active)?active:null)||valid[0];
}
function writerV106HomeSessionKey(plugin){
 const vault=String(plugin.app?.appId||plugin.app?.vault?.getName?.()||'default');
 const id=String(plugin.manifest?.id||'basic-ai-tool-for-writers');
 return 'basic-ai:'+id+':fresh-home-session:'+vault;
}
function writerV106HomeSessionStore(plugin){
 try{return plugin.app.workspace?.containerEl?.ownerDocument?.defaultView?.sessionStorage||null;}
 catch(error){return null;}
}
async function writerV106HomeCleanup(plugin,open,force=false){
 const workspace=plugin.app.workspace;
 const cfg=plugin.settings?.v8Finish;
 if((!force&&!cfg?.homeCleanStart)||!writerModuleOn(plugin,'writingHome'))return false;
 if(typeof workspace.iterateRootLeaves!=='function')return false;
 const roots=[];
 workspace.iterateRootLeaves(leaf=>{
  if(leaf&&typeof leaf.setViewState==='function'&&typeof leaf.detach==='function'&&!roots.includes(leaf))roots.push(leaf);
 });
 if(!roots.length){await open();return true;}
 const keep=writerV106HomeChooseLeaf(roots,workspace.activeLeaf,WRITER_V8_HOME_VIEW);
 if(!keep)return false;
 // If activation fails, do not close ANY restored tab.
 try{
  if(keep.getViewState?.()?.type!==WRITER_V8_HOME_VIEW)
   await keep.setViewState({type:WRITER_V8_HOME_VIEW,active:true});
  if(keep.getViewState?.()?.type!==WRITER_V8_HOME_VIEW)return false;
 }catch(error){console.warn('[Basic AI] fresh homepage:',error);return false;}
 let closed=0;
 for(const leaf of roots){
  if(leaf===keep)continue;
  try{leaf.detach();closed++;}
  catch(error){console.warn('[Basic AI] restored tab cleanup:',error);}
 }
 try{workspace.setActiveLeaf?.(keep,{focus:false});}catch(error){console.warn('[Basic AI] activate homepage:',error);}
 plugin._writerV106HomeClosedRestored=closed;
 return true;
}
function writerV106HomeRegisterStartup(plugin,open){
 const workspace=plugin.app.workspace;
 const wasReady=workspace.layoutReady===true;
 const storage=writerV106HomeSessionStore(plugin);
 const key=writerV106HomeSessionKey(plugin);
 let seen=false;
 try{seen=storage?.getItem(key)==='1';}catch(_){}
 // A plugin hot-reload happens AFTER layoutReady. Never destroy the working layout then.
 const policy=writerV106HomeStartupPolicy(plugin.settings?.v8Finish,wasReady,seen);
 plugin._writerV106HomeStarting=true;
 const begin=async()=>{
  try{
   if(policy==='clean'){
    try{storage?.setItem(key,'1');}catch(_){}
    await writerV106HomeCleanup(plugin,open);
   }else if(!wasReady&&!seen&&plugin.settings?.v8Finish?.homeAtStartup&&writerModuleOn(plugin,'writingHome')){
    try{storage?.setItem(key,'1');}catch(_){}
    await open();
   }
  }finally{
   plugin._writerV106HomeStarting=false;
   plugin._writerV106HomeStarted=true;
  }
 };
 if(typeof workspace.onLayoutReady==='function')workspace.onLayoutReady(()=>void begin().catch(error=>console.warn('[Basic AI] startup homepage:',error)));
 else{plugin._writerV106HomeStarting=false;plugin._writerV106HomeStarted=true;}
 plugin.addCommand?.({id:'v106-clean-home-now',name:writerUi('Homepage: limpar abas e recomeçar','Homepage: close tabs and start fresh'),callback:()=>{
  const modal=new Modal(plugin.app);
  modal.setTitle(writerUi('Fechar todas as abas principais?','Close all main tabs?'));
  modal.onOpen=()=>{
   modal.contentEl.createEl('p',{text:writerUi('As notas não serão apagadas. Painéis laterais e configurações serão preservados.','Notes will not be deleted. Sidebars and settings will be preserved.')});
   const actions=modal.contentEl.createDiv({cls:'writer-v10-discovery-actions'});
   actions.createEl('button',{text:writerUi('Cancelar','Cancel')}).addEventListener('click',()=>modal.close());
   actions.createEl('button',{text:writerUi('Fechar abas','Close tabs'),cls:'mod-warning'}).addEventListener('click',()=>{
    modal.close();void writerV106HomeCleanup(plugin,open,true);
   });
  };modal.open();
 }});
}
