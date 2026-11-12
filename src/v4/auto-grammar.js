'use strict';
/* Opt-in-while-reviewing LanguageTool checks. Manual review remains available. */
const WRITER_AUTO_GRAMMAR_DEFAULTS={enabled:true,delayMs:3500,minIntervalMs:9000,maxWindowChars:12000};
function writerAutoGrammarSettings(settings){
 const old=settings.autoGrammar&&typeof settings.autoGrammar==='object'&&!Array.isArray(settings.autoGrammar)?settings.autoGrammar:{};
 const cfg=settings.autoGrammar=Object.assign(old,{...WRITER_AUTO_GRAMMAR_DEFAULTS,...old});
 cfg.enabled=cfg.enabled!==false;
 cfg.delayMs=Math.max(2000,Math.min(15000,Number(cfg.delayMs)||3500));
 cfg.minIntervalMs=Math.max(6000,Math.min(30000,Number(cfg.minIntervalMs)||9000));
 cfg.maxWindowChars=Math.max(4000,Math.min(16000,Number(cfg.maxWindowChars)||12000));
 return cfg;
}
const WRITER_GRAMMAR_ENDPOINT='https://api.languagetool.org/v2/check';
function writerGrammarEndpoint(value){
 try{
  const url=new URL(String(value||'').trim()||WRITER_GRAMMAR_ENDPOINT);
  if(url.protocol==='https:'&&!url.username&&!url.password)return url.toString();
 }catch(_){}
 return '';
}
function writerGrammarConnectionKey(settings){
 return [settings.reviewEngine||'basic',settings.reviewEndpoint||'',settings.reviewLanguage||'pt-BR',
  settings.reviewApiKey||'',settings.reviewUsername||''].join('\u0000');
}
function writerGrammarCancel(plugin){
 plugin._writerGrammarRequestEpoch=(plugin._writerGrammarRequestEpoch||0)+1;
}
function writerGrammarCancelled(){
 const error=new Error(writerUi('Verificação cancelada.','Grammar check cancelled.'));
 error.name='WriterGrammarCancelled';error.code='WRITER_GRAMMAR_CANCELLED';return error;
}
async function writerGrammarRequest(plugin,text){
 const settings=plugin.settings,epoch=plugin._writerGrammarRequestEpoch||0;
 const key=writerGrammarConnectionKey(settings);
 const current=()=>writerModuleOn(plugin,'review')&&plugin.settings.reviewEngine!=='external'&&
  epoch===(plugin._writerGrammarRequestEpoch||0)&&key===writerGrammarConnectionKey(plugin.settings);
 if(!current())throw writerGrammarCancelled();
 const endpoint=writerGrammarEndpoint(settings.reviewEndpoint);
 if(!endpoint)throw Error(writerUi('Use um endpoint HTTPS válido, sem usuário ou senha na URL.','Use a valid HTTPS endpoint without URL credentials.'));
 const source=String(text||'');
 if(source.length>18000)throw Error(writerUi('Limite de 18 mil caracteres por verificação. Escolha um trecho menor.','18,000-character limit per check. Select a shorter passage.'));
 const body=new URLSearchParams({text:source,language:settings.reviewLanguage||'pt-BR'});
 const apiKey=String(settings.reviewApiKey||'').trim(),username=String(settings.reviewUsername||'').trim();
 if(apiKey)body.set('apiKey',apiKey);
 if(username)body.set('username',username);
 let response;
 try{
  const send=typeof requestUrl==='function'?requestUrl:require('obsidian').requestUrl;
  response=await send({url:endpoint,method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),throw:false});
 }catch(error){
  if(!current())throw writerGrammarCancelled();
  throw Error(writerUi('Não foi possível alcançar o corretor. Confira o endereço e a conexão.','Could not reach the checker. Check the server address and connection.'));
 }
 if(!current())throw writerGrammarCancelled();
 if(response.status<200||response.status>=300){
  const messages={
   400:['O corretor rejeitou a solicitação. Confira o idioma e as opções da conta.','The checker rejected this request. Check the language and account options.'],
   401:['A conta ou a chave do corretor não foi aceita.','The checker did not accept the account or API key.'],
   403:['A conta não tem permissão para usar este corretor.','This account cannot access the checker.'],
   413:['O trecho excede o limite deste servidor. Reduza a janela de verificação.','This passage exceeds the server limit. Reduce the checking window.'],
   429:['Limite de verificações atingido. Aguarde e tente novamente.','Checking rate limit reached. Wait and try again.']
  };
  const message=messages[response.status]||['O servidor do corretor está indisponível. Tente novamente mais tarde.','The checker server is unavailable. Try again later.'];
  throw Error(writerUi(message[0],message[1])+' (HTTP '+response.status+')');
 }
 let matches;
 try{matches=response.json?.matches;}catch(_){}
 if(!Array.isArray(matches))throw Error(writerUi('Resposta inválida do corretor. Confira o endpoint configurado.','Invalid checker response. Check the configured endpoint.'));
 return matches;
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
// Recheck the smallest reliable context after accepting one LanguageTool suggestion.
// Match offsets remain based on the original (unmasked) document.
function writerGrammarParagraphBounds(source,at){
 const text=String(source||''),pos=Math.max(0,Math.min(text.length,at));
 const breaks=/\r?\n[ \t]*\r?\n/g;
 let from=0,to=text.length,m;
 while((m=breaks.exec(text))!==null){
  if(m.index+m[0].length<=pos)from=m.index+m[0].length;
  else if(m.index>=pos){to=m.index;break;}
 }
 return {from,to};
}
function writerGrammarLocalWindow(source,start,end,limit=10000){
 const text=String(source||''),max=Math.min(16000,Math.max(1000,limit));
 const pos=Math.max(0,Math.min(text.length,start)),finish=Math.max(pos,Math.min(text.length,end));
 const paragraph=writerGrammarParagraphBounds(text,pos);
 if(finish>paragraph.to){
  const next=writerGrammarParagraphBounds(text,finish);
  paragraph.to=Math.max(paragraph.to,next.to);
 }
 let from=paragraph.from,to=paragraph.to,kind='paragraph';
 // Use sentence boundaries only when their punctuation has an unambiguous
 // whitespace + uppercase successor; otherwise retain the whole paragraph.
 const split=/[.!?…][)"'”’]*\s+(?=[\p{Lu}\p{N}“"'])/gu;
 const boundaries=[from];let m;
 split.lastIndex=from;
 while((m=split.exec(text))!==null&&m.index<to){
  const boundary=split.lastIndex;
  if(boundary>from&&boundary<to)boundaries.push(boundary);
 }
 boundaries.push(to);
 for(let i=1;i<boundaries.length;i++){
  const a=boundaries[i-1],b=boundaries[i];
  if(a<=pos&&b>=finish&&b>a&&b-a<=max){
   if(boundaries.length>2){from=a;to=b;kind='sentence';}
   break;
  }
 }
 if(to-from>max){
  // Extremely long paragraphs: still never transmit a full manuscript.
  const chunk=writerAutoGrammarWindow(text,pos,Math.max(4000,max));
  from=Math.max(paragraph.from,chunk.from);
  to=Math.min(paragraph.to,chunk.to);
  kind='window';
 }
 return {from,to,text:text.slice(from,to),kind};
}
function writerGrammarLocalScopes(before,after,start,oldEnd,newEnd,preferParagraph=false){
 const oldSentence=writerGrammarLocalWindow(before,start,oldEnd);
 const newSentence=writerGrammarLocalWindow(after,start,newEnd);
 const delta=after.length-before.length;
 // If the edit changes a sentence separator, recheck the encompassing
 // paragraph so no adjacent sentence keeps an invalid cached result.
 if(!preferParagraph&&oldSentence.kind==='sentence'&&newSentence.kind==='sentence'&&
    oldSentence.from===newSentence.from&&oldSentence.to+delta===newSentence.to)
  return {old:oldSentence,next:newSentence};
 const fallback=(text,finish)=>{
  const startBounds=writerGrammarParagraphBounds(text,start);
  const endBounds=writerGrammarParagraphBounds(text,finish);
  const from=startBounds.from,to=Math.max(startBounds.to,endBounds.to);
  if(to-from<=16000)return {from,to,text:text.slice(from,to),kind:'paragraph'};
  return writerGrammarLocalWindow(text,start,finish,12000);
 };
 return {old:fallback(before,oldEnd),next:fallback(after,newEnd)};
}
function writerGrammarDiffSpan(before,after){
 const old=String(before||''),next=String(after||'');
 if(old===next)return null;
 let start=0;
 while(start<old.length&&start<next.length&&old.charCodeAt(start)===next.charCodeAt(start))start++;
 let oldEnd=old.length,newEnd=next.length;
 while(oldEnd>start&&newEnd>start&&old.charCodeAt(oldEnd-1)===next.charCodeAt(newEnd-1)){oldEnd--;newEnd--;}
 return {start,oldEnd,newEnd};
}
function writerGrammarPreserveOutside(matches,oldScope,delta){
 return (matches||[]).filter(m=>Number.isInteger(m.offset)&&Number.isInteger(m.length)&&
   m.length>0&&(m.offset+m.length<=oldScope.from||m.offset>=oldScope.to))
  .map(m=>({...m,offset:m.offset>=oldScope.to?m.offset+delta:m.offset}));
}
class WriterAutoGrammar{
 constructor(plugin){this.plugin=plugin;this.timer=null;this.lastRun=0;this.pendingPath=null;this.destroyed=false;this.revision=0;}
 get config(){return this.plugin.settings.autoGrammar;}
 reviewView(path=''){
  if(!writerModuleOn(this.plugin,'review')||this.plugin.settings.reviewEngine==='external')return null;
  return (this.plugin.app.workspace.getLeavesOfType(VIEW)||[]).map(leaf=>leaf.view)
   .find(view=>view?.reviewMode?.value==='grammar'&&view?.activeTab==='review'&&(!path||view.reviewFilePath===path))||null;
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
  // Obsidian Plugin provides register(); minimal testing hosts may not.
  this.plugin.register?.(()=>this.stop());
 }
 cancelPending(){this.revision++;clearTimeout(this.timer);this.timer=null;this.pendingPath=null;}
 stop(){this.destroyed=true;this.cancelPending();}
 schedule(file,{delay}={}){
  if(this.destroyed||!writerModuleOn(this.plugin,'review')||this.plugin.settings.reviewEngine==='external'||this.config?.enabled===false||file?.extension!=='md'||this.plugin.grammarCorrectionPaths?.has(file.path))return;
  const view=this.reviewView(file.path);
  if(!view)return;
  this.pendingPath=file.path;
  clearTimeout(this.timer);
  const cooldown=Math.max(0,this.lastRun+(this.config.minIntervalMs||9000)-Date.now());
  const ms=Math.max(delay??(this.config.delayMs||3500),cooldown);
  const revision=++this.revision;
  this.timer=setTimeout(()=>this.run(revision),ms);
  view.reviewStatus?.setText?.(writerUi('Alterações detectadas. Verificação automática em breve…','Changes detected. Automatic grammar check scheduled…'));
 }
 async run(revision=this.revision){
  if(revision!==this.revision)return;
  this.timer=null;
  if(this.destroyed||!writerModuleOn(this.plugin,'review')||this.config?.enabled===false)return;
  const path=this.pendingPath,view=this.reviewView(path);
  if(!view||!path||view.reviewFilePath!==path)return;
  const file=this.plugin.app.vault.getAbstractFileByPath(path);
  if(!file||file.extension!=='md')return;
  if(view.reviewBusy){this.schedule(file,{delay:1000});return;}
  // No redundant request if a manual check already covered this exact text.
  let source;
  try{source=await writerCurrentText(this.plugin,file);}
  catch(error){
   if(revision===this.revision&&!this.destroyed&&this.reviewView(path)===view){
    this.pendingPath=null;view.reviewStatus?.setText?.(writerUi('Não foi possível ler a nota para revisar.','Could not read the note for review.'));
   }
   return;
  }
  // A file read can finish after the user disables review, changes its mode,
  // switches notes or schedules a newer edit. It must not start a request.
  if(revision!==this.revision||this.destroyed||this.config?.enabled===false||
   this.pendingPath!==path||this.reviewView(path)!==view)return;
  if(view.grammarCheckedPath===path&&view.grammarCheckedSource===source){
   this.pendingPath=null;return;
  }
  this.pendingPath=null;this.lastRun=Date.now();
  // A known reviewed document has a trustworthy result cache. Recheck only
  // its modified paragraph, like a per-editor incremental checker.
  const before=view.grammarCheckedSource;
  const cached=this.plugin.reviewMarkedPath===path&&view.grammarCheckedPath===path&&
   typeof before==='string'&&this.plugin.reviewSource===before&&
   Array.isArray(this.plugin.reviewMatches)?this.plugin.reviewMatches.slice():null;
  const diff=cached?writerGrammarDiffSpan(before,source):null;
  try{
   if(diff){
    const scopes=writerGrammarLocalScopes(before,source,diff.start,diff.oldEnd,diff.newEnd,true);
    if(scopes.next.text.length<=this.config.maxWindowChars){
     const stale=await view.recheckGrammarCorrection(file,before,source,diff.start,diff.oldEnd,diff.newEnd,cached,{preferParagraph:true});
     if(stale&&revision===this.revision)this.schedule(file,{delay:1000});
    }else await view.reviewFile(file,{automatic:true});
   }else await view.reviewFile(file,{automatic:true});
  }catch(error){
   if(revision===this.revision&&!this.destroyed&&this.reviewView(path)===view&&error?.code!=='WRITER_GRAMMAR_CANCELLED')
    view.reviewStatus?.setText?.(writerUi('Não foi possível atualizar a revisão automática.','Could not update automatic review.'));
  }
  if(this.pendingPath&&!this.timer){
   const next=this.plugin.app.vault.getAbstractFileByPath(this.pendingPath);
   if(next)this.schedule(next);
  }
 }
}
