'use strict';
/* Built-in cursor/selection/scroll memory. Independent implementation using Obsidian's Editor API. */
const WRITER_CURSOR_DEFAULTS={enabled:true,restoreSelection:true,restoreScroll:true,maxEntries:500};
function writerCursorMerge(settings){
 const old=settings.cursorMemory&&typeof settings.cursorMemory==='object'?settings.cursorMemory:{};
 settings.cursorMemory={...WRITER_CURSOR_DEFAULTS,...old};
 settings.cursorMemory.enabled=settings.cursorMemory.enabled!==false;
 settings.cursorMemory.restoreSelection=settings.cursorMemory.restoreSelection!==false;
 settings.cursorMemory.restoreScroll=settings.cursorMemory.restoreScroll!==false;
 settings.cursorMemory.maxEntries=Math.max(50,Math.min(2000,Math.floor(Number(settings.cursorMemory.maxEntries)||500)));
 const entries=settings.cursorPositions;
 settings.cursorPositions=entries&&typeof entries==='object'&&!Array.isArray(entries)?entries:{};
 return settings.cursorMemory;
}
function writerCursorClamp(pos,editor){
 const last=Math.max(0,editor.lineCount()-1);
 const line=Math.max(0,Math.min(last,Math.floor(Number(pos?.line)||0)));
 const text=editor.getLine(line)||'';
 const ch=Math.max(0,Math.min(text.length,Math.floor(Number(pos?.ch)||0)));
 return {line,ch};
}
function writerCursorSame(a,b){return a?.line===b?.line&&a?.ch===b?.ch;}
class WriterCursorMemory{
 constructor(plugin){
  this.plugin=plugin;this.flushTimer=null;this.pending=new Map();this.lastView=null;
 }
 get cfg(){return this.plugin.settings.cursorMemory;}
 get entries(){return this.plugin.settings.cursorPositions;}
 active(){return writerModuleOn(this.plugin,'cursorMemory')&&this.cfg.enabled;}
 markdownViews(){
  return (this.plugin.app.workspace.getLeavesOfType('markdown')||[])
   .map(leaf=>leaf.view).filter(view=>view?.file?.extension==='md'&&view.editor);
 }
 matchingView(cm){
  return this.markdownViews().find(view=>view.editor?.cm===cm||view.editor?.cm?.dom===cm?.dom)||null;
 }
 capture(view){
  if(!this.active()||!view?.file||!view.editor||this.pending.has(view))return false;
  const editor=view.editor;
  if(typeof editor.getCursor!=='function'||typeof editor.lineCount!=='function')return false;
  const head=writerCursorClamp(editor.getCursor('head'),editor);
  const anchor=writerCursorClamp(editor.getCursor('anchor')||head,editor);
  const scroll=editor.getScrollInfo?.()||{};
  const old=this.entries[view.file.path];
  const x=Number.isFinite(scroll.left)?Math.max(0,scroll.left):(old?.left||0);
  const y=Number.isFinite(scroll.top)?Math.max(0,scroll.top):(old?.top||0);
  if(old&&writerCursorSame(old.head,head)&&writerCursorSame(old.anchor,anchor)&&
    Math.abs((old.left||0)-x)<1&&Math.abs((old.top||0)-y)<1)return false;
  this.entries[view.file.path]={head,anchor,left:x,top:y,updatedAt:Date.now()};
  this.trim();
  this.queueFlush();
  return true;
 }
 trim(){
  const entries=Object.entries(this.entries);
  if(entries.length<=this.cfg.maxEntries)return;
  entries.sort((a,b)=>(b[1]?.updatedAt||0)-(a[1]?.updatedAt||0));
  for(const [path] of entries.slice(this.cfg.maxEntries))delete this.entries[path];
 }
 queueFlush(){
  clearTimeout(this.flushTimer);
  this.flushTimer=setTimeout(()=>{
   this.flushTimer=null;
   Promise.resolve(this.plugin.saveSettings()).catch(e=>console.warn('[Basic AI] Cursor memory save:',e));
  },1200);
 }
 timer(callback,ms){
  const task=setTimeout(()=>{this.pendingTimers?.delete(task);callback();},ms);
  (this.pendingTimers||(this.pendingTimers=new Set())).add(task);
  return task;
 }
 isAnchored(view){
  const state=view?.leaf?.getViewState?.()?.state||view?.getState?.()||{};
  return Boolean(state.subpath||state.anchor||state.search);
 }
 restoreScrollIntoView(view,head,bookmark){
  const editor=view?.editor,cm=editor?.cm;
  if(this.cfg.restoreScroll===false||!editor)return;
  // The stored pixel offset alone is unreliable on Android: a CM6 viewport may
  // not have measured its rows when file-open fires, or the virtual keyboard
  // may resize the scroll container after the initial scrollTo().
  try{
   if(typeof editor.scrollTo==='function'&&Number.isFinite(bookmark?.top))
    editor.scrollTo(Number(bookmark.left)||0,Math.max(0,bookmark.top));
   const pos=cm?.state?.doc?.line?
    cm.state.doc.line(Math.max(1,Math.min(cm.state.doc.lines,head.line+1))).from+head.ch:null;
   if(pos!=null&&typeof EditorView?.scrollIntoView==='function'&&cm?.dispatch){
    cm.dispatch({effects:EditorView.scrollIntoView(pos,{y:'center',x:'nearest'})});
   }else if(typeof editor.scrollIntoView==='function'){
    editor.scrollIntoView({from:head,to:head},true);
   }
  }catch(error){console.warn('[Basic AI] Cursor scroll restore:',error);}
 }
 restore(view){
  if(!this.active()||!view?.file?.path||!view.editor||this.isAnchored(view))return;
  const path=view.file.path,bookmark=this.entries[path];
  if(!bookmark||this.pending.has(view))return;
  const editor=view.editor,initial=editor.getCursor?.('head');
  if(!initial||typeof editor.lineCount!=='function')return;
  this.pending.set(view,path);
  const stillValid=()=>this.pending.get(view)===path&&view.file?.path===path&&!this.isAnchored(view);
  // Allow Obsidian to attach the editor and load the document before resetting
  // selection, then recenter after the layout and mobile keyboard settle.
  this.timer(()=>{
   if(!stillValid()){this.pending.delete(view);return;}
   if(!writerCursorSame(editor.getCursor?.('head'),initial)){
    this.pending.delete(view);return; // genuine user movement wins
   }
   try{
    const head=writerCursorClamp(bookmark.head,editor);
    const anchor=this.cfg.restoreSelection?writerCursorClamp(bookmark.anchor||bookmark.head,editor):head;
    editor.setSelection(anchor,head);
    this.restoreScrollIntoView(view,head,bookmark);
    const finish=()=>{
     if(!stillValid())return;
     if(!writerCursorSame(editor.getCursor?.('head'),head)){this.pending.delete(view);return;}
     this.restoreScrollIntoView(view,head,bookmark);
     this.pending.delete(view);
    };
    this.timer(finish,this.plugin.app.isMobile?380:110);
   }catch(e){
    this.pending.delete(view);
    console.warn('[Basic AI] Restore cursor:',e);
   }
  },this.plugin.app.isMobile?180:100);
 }
 register(){
  const p=this.plugin,workspace=p.app.workspace;
  this.pendingTimers=new Set();
  this.lastView=workspace.getActiveViewOfType?.(MarkdownView)||null;
  if(EditorView.updateListener?.of){
   p.registerEditorExtension(EditorView.updateListener.of(update=>{
    if(!update.docChanged&&!update.selectionSet&&!update.viewportChanged)return;
    const view=this.matchingView(update.view);
    if(view)this.capture(view);
   }));
  }
  p.registerEvent(workspace.on('active-leaf-change',leaf=>{
   if(this.lastView&&this.lastView!==leaf?.view)this.capture(this.lastView);
   this.lastView=leaf?.view instanceof MarkdownView?leaf.view:null;
   // Mobile may create its Markdown editor after file-open. Retry once when
   // the leaf has had time to mount, without moving a caret the user touched.
   const opened=this.lastView;
   if(opened?.file?.path&&this.entries[opened.file.path])
    this.timer(()=>{if(this.lastView===opened)this.restore(opened);},this.plugin.app.isMobile?260:110);
  }));
  p.registerEvent(workspace.on('file-open',file=>{
   if(file?.extension!=='md')return;
   const view=workspace.getActiveViewOfType?.(MarkdownView);
   if(view?.file?.path===file.path)this.restore(view);
  }));
  p.registerEvent(p.app.vault.on('rename',(file,oldPath)=>{
   if(!this.entries[oldPath])return;
   this.entries[file.path]=this.entries[oldPath];delete this.entries[oldPath];this.queueFlush();
  }));
  p.registerEvent(p.app.vault.on('delete',file=>{
   if(this.entries[file.path]){delete this.entries[file.path];this.queueFlush();}
  }));
  p.addCommand({id:'v4-restore-cursor',name:writerUi('Restaurar cursor da nota','Restore remembered cursor'),
   editorCallback:(editor,view)=>this.restore(view)});
  p.addCommand({id:'v4-forget-cursor',name:writerUi('Esquecer posição da nota','Forget current note position'),
   editorCallback:(editor,view)=>{
    const path=view?.file?.path;if(path&&this.entries[path]){delete this.entries[path];this.queueFlush();}
   }});
  workspace.onLayoutReady?.(()=>{
   if(!this.active())return;
   const view=workspace.getActiveViewOfType?.(MarkdownView);
   if(view?.file)this.restore(view);
  });
 }
 renderSettings(panel){
  const cfg=this.cfg;
  panel.createEl('h3',{text:writerUi('Lembrar posição do cursor','Remember cursor position')});
  panel.createEl('p',{text:writerUi('Guarda localmente cursor, seleção e rolagem de cada nota. Ao reabrir, retorna ao trecho onde você parou. Não interfere em links com âncoras.','Remembers each note’s cursor, selection, and scroll locally. Reopening a note returns you to where you stopped, without overriding heading links.')});
  const toggle=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en))
   .addToggle(t=>t.setValue(cfg[key]!==false).onChange(async value=>{
    cfg[key]=value;await this.plugin.saveSettings();
   }));
  toggle('enabled','Ativar memória de cursor','Enable cursor memory');
  toggle('restoreSelection','Restaurar seleção de texto','Restore text selection');
  toggle('restoreScroll','Restaurar rolagem da nota','Restore note scroll');
  new Setting(panel).setName(writerUi('Máximo de notas lembradas','Maximum remembered notes'))
   .setDesc(writerUi('De 50 a 2.000 notas; remove automaticamente os registros mais antigos.','50 to 2,000 notes; oldest records are pruned.'))
   .addDropdown(drop=>{
    for(const n of [50,100,250,500,1000,2000])drop.addOption(String(n),String(n));
    drop.setValue(String(cfg.maxEntries)).onChange(async value=>{
     cfg.maxEntries=Number(value);this.trim();await this.plugin.saveSettings();
    });
   });
  new Setting(panel).setName(writerUi('Apagar posições salvas','Clear saved positions'))
   .setDesc(writerUi('Apaga só os marcadores de posição, nunca o texto das notas.','Deletes only position bookmarks, never note text.'))
   .addButton(btn=>btn.setButtonText(writerUi('Limpar','Clear')).setWarning().onClick(async()=>{
    this.plugin.settings.cursorPositions={};
    await this.plugin.saveSettings();
    new Notice(writerUi('Posições de cursor apagadas.','Saved cursor positions cleared.'));
   }));
 }
 async stop(){
  for(const task of this.pendingTimers||[])clearTimeout(task);
  this.pendingTimers?.clear();
  this.pending.clear();
  for(const view of this.markdownViews())this.capture(view);
  if(this.lastView)this.capture(this.lastView);
  if(this.flushTimer){
   clearTimeout(this.flushTimer);this.flushTimer=null;
   await this.plugin.saveSettings();
  }
 }
}
