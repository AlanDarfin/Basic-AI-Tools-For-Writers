'use strict';
/* Opt-in-while-reviewing LanguageTool checks. Manual review remains available. */
const WRITER_AUTO_GRAMMAR_DEFAULTS={enabled:true,delayMs:3500,minIntervalMs:9000,maxWindowChars:12000};
function writerAutoGrammarSettings(settings){
 const old=settings.autoGrammar&&typeof settings.autoGrammar==='object'?settings.autoGrammar:{};
 const cfg=settings.autoGrammar={...WRITER_AUTO_GRAMMAR_DEFAULTS,...old};
 cfg.delayMs=Math.max(2000,Math.min(15000,Number(cfg.delayMs)||3500));
 cfg.minIntervalMs=Math.max(6000,Math.min(30000,Number(cfg.minIntervalMs)||9000));
 cfg.maxWindowChars=Math.max(4000,Math.min(16000,Number(cfg.maxWindowChars)||12000));
 return cfg;
}
// Long manuscripts exceed LanguageTool's single-request limit. Check a bounded
// window around the cursor and translate its offsets back into full-note offsets.
function writerAutoGrammarWindow(source,position=0,limit=12000){
 const text=String(source||'');
 const max=Math.min(16000,Math.max(4000,Math.trunc(limit)||12000));
 if(text.length<=max)return {from:0,to:text.length,text,partial:false};
 const pos=Math.max(0,Math.min(text.length,Math.trunc(position)||0));
 let from=Math.max(0,Math.min(text.length-max,pos-Math.floor(max/2)));
 let to=from+max;
 // Favor paragraph boundaries only if they do not shrink the window excessively.
 const startBreak=text.indexOf('\n',from);
 if(from>0&&startBreak>from&&startBreak-from<160)from=startBreak+1;
 const endBreak=text.lastIndexOf('\n',to);
 if(to<text.length&&endBreak>from&&to-endBreak<160)to=endBreak;
 return {from,to,text:text.slice(from,to),partial:true};
}
class WriterAutoGrammar{
 constructor(plugin){this.plugin=plugin;this.timer=null;this.lastRun=0;this.pendingPath=null;this.destroyed=false;}
 get config(){return this.plugin.settings.autoGrammar;}
 reviewView(){
  const leaf=this.plugin.app.workspace.getLeavesOfType(VIEW)?.[0];
  const view=leaf?.view;
  return view?.reviewMode?.value==='grammar'&&view?.activeTab==='review'?view:null;
 }
 register(){
  this.plugin.registerEvent(this.plugin.app.workspace.on('editor-change',(editor,info)=>{
   const file=info?.file||this.plugin.app.workspace.getActiveFile?.();
   if(file?.extension!=='md')return;
   this.schedule(file);
  }));
  this.plugin.registerEvent(this.plugin.app.workspace.on('file-open',file=>{
   const view=this.reviewView();
   if(file?.extension==='md'&&view&&view.reviewFilePath){
    view.reviewFilePath=file.path;
    this.schedule(file);
   }
  }));
  this.plugin.register(()=>this.stop());
 }
 stop(){this.destroyed=true;clearTimeout(this.timer);this.timer=null;this.pendingPath=null;}
 schedule(file,{delay}={}){
  if(this.destroyed||this.config?.enabled===false||file?.extension!=='md')return;
  const view=this.reviewView();
  if(!view||view.reviewFilePath!==file.path)return;
  this.pendingPath=file.path;
  clearTimeout(this.timer);
  const cooldown=Math.max(0,this.lastRun+(this.config.minIntervalMs||9000)-Date.now());
  const ms=Math.max(delay??(this.config.delayMs||3500),cooldown);
  this.timer=setTimeout(()=>this.run(),ms);
  view.reviewStatus?.setText?.(writerUi('Alterações detectadas. Verificação automática em breve…','Changes detected. Automatic grammar check scheduled…'));
 }
 async run(){
  this.timer=null;
  if(this.destroyed||this.config?.enabled===false)return;
  const view=this.reviewView(),path=this.pendingPath;
  if(!view||!path||view.reviewFilePath!==path)return;
  const file=this.plugin.app.vault.getAbstractFileByPath(path);
  if(!file||file.extension!=='md')return;
  if(view.reviewBusy){this.schedule(file,{delay:1000});return;}
  this.pendingPath=null;this.lastRun=Date.now();
  await view.reviewFile(file,{automatic:true});
  if(this.pendingPath){
   const next=this.plugin.app.vault.getAbstractFileByPath(this.pendingPath);
   if(next)this.schedule(next);
  }
 }
}
