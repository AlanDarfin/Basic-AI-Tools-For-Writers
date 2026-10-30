'use strict';
/* Local device voices via Web Speech API; no model or network calls in this code. */
class WriterTTS{
 constructor(plugin){this.plugin=plugin;this.current=null;this.parts=[];this.index=0;this.paused=false;this.stopping=false;}
 get engine(){return typeof window!=='undefined'?window.speechSynthesis:null;}
 get available(){return typeof window!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined'&&!!this.engine;}
 voices(){try{return this.engine?.getVoices()||[];}catch{return [];}}
 chooseVoice(){
  const cfg=this.plugin.settings.tts;
  const voices=this.voices();
  const wanted=String(cfg.voice||'');
  if(wanted){const exact=voices.find(v=>v.voiceURI===wanted||v.name===wanted);if(exact)return exact;}
  const locale=cfg.language==='auto'?(this.plugin.settings.targetLanguage||'pt-BR'):cfg.language;
  const matching=voices.filter(v=>v.lang.toLowerCase().startsWith(locale.split('-')[0].toLowerCase()));
  if(cfg.preferGoogle!==false){
   const google=matching.find(v=>/google/i.test(v.name));if(google)return google;
  }
  return matching.find(v=>v.lang.toLowerCase()===locale.toLowerCase())||matching[0]||null;
 }
 textFromEditor(selectionOnly=false){
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  const editor=view?.editor;
  if(!editor)return '';
  const selected=editor.getSelection();
  return selected||(!selectionOnly?editor.getValue():'');
 }
 clean(source){
  const text=String(source||'');
  const withoutMarkup=this.plugin.settings.tts.stripMarkdown!==false?writerMaskMarkdown(text):text;
  return withoutMarkup.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
 }
 split(text){
  const limit=220,parts=[];
  for(const para of text.split(/\n+/)){
   let remaining=para.trim();
   while(remaining.length){
    if(remaining.length<=limit){parts.push(remaining);break;}
    let cut=Math.max(1,remaining.lastIndexOf(' ',limit));
    if(cut<80)cut=limit;
    parts.push(remaining.slice(0,cut).trim());
    remaining=remaining.slice(cut).trim();
   }
  }
  return parts.filter(Boolean);
 }
 speak(source){
  if(!this.plugin.settings.tts.enabled)return new Notice(w4text(this.plugin,'Leitor de voz desativado.','Text-to-speech disabled.'));
  if(!this.available)return new Notice(w4text(this.plugin,'Este dispositivo não oferece leitura de voz do sistema.','System speech synthesis is unavailable on this device.'));
  const text=this.clean(source).slice(0,Math.max(500,Number(this.plugin.settings.tts.maxChars)||120000));
  if(!text)return new Notice(w4text(this.plugin,'Não há texto para ler.','No text to read.'));
  this.stop();this.stopping=false;this.parts=this.split(text);this.index=0;this.paused=false;this.next();
 }
 next(){
  if(this.stopping||this.index>=this.parts.length){this.current=null;return;}
  const utterance=new window.SpeechSynthesisUtterance(this.parts[this.index++]);
  const cfg=this.plugin.settings.tts,voice=this.chooseVoice();
  if(voice)utterance.voice=voice;
  utterance.lang=cfg.language==='auto'?(voice?.lang||this.plugin.settings.targetLanguage||'pt-BR'):cfg.language;
  utterance.rate=Math.min(2,Math.max(0.5,Number(cfg.rate)||1));
  utterance.pitch=Math.min(2,Math.max(0.5,Number(cfg.pitch)||1));
  utterance.volume=Math.max(0,Math.min(1,Number(cfg.volume)??1));
  utterance.onend=()=>{if(this.current===utterance&&!this.stopping)this.next();};
  utterance.onerror=event=>{
   if(this.stopping||event.error==='interrupted'||event.error==='canceled')return;
   new Notice(w4text(this.plugin,'Erro no leitor de voz: ','Speech error: ')+event.error);
   this.stop();
  };
  this.current=utterance;this.engine.speak(utterance);
 }
 pause(){if(this.engine?.speaking){this.engine.pause();this.paused=true;}}
 resume(){if(this.engine?.paused){this.engine.resume();this.paused=false;}}
 stop(){this.stopping=true;this.parts=[];this.current=null;this.paused=false;this.engine?.cancel();}
 register(){
  const plugin=this.plugin;
  const add=(id,pt,en,callback)=>plugin.addCommand({id,name:w4text(plugin,pt,en),callback});
  add('v4-tts-read-selection','Ler seleção em voz alta','Read selection aloud',()=>this.speak(this.textFromEditor(true)));
  add('v4-tts-read-note','Ler nota em voz alta','Read current note aloud',()=>this.speak(this.textFromEditor(false)));
  add('v4-tts-pause','Pausar leitura','Pause reading',()=>this.pause());
  add('v4-tts-resume','Continuar leitura','Resume reading',()=>this.resume());
  add('v4-tts-stop','Parar leitura','Stop reading',()=>this.stop());
  add('v4-tts-panel','Abrir leitor de voz','Open speech reader',()=>plugin.openWritingTools('tts'));
 }
 renderPanel(panel){
  const cfg=this.plugin.settings.tts,txt=(pt,en)=>w4text(this.plugin,pt,en);
  panel.createEl('h4',{text:txt('Leitor de voz','Text-to-speech')});
  panel.createEl('p',{text:txt('Vozes do aparelho (sem IA). A disponibilidade das vozes Google depende do sistema.','Device voices (no AI). Google voice availability depends on your system.')});
  if(!this.available)panel.createEl('p',{text:txt('Síntese de voz indisponível nesta instalação.','Speech synthesis unavailable in this installation.')});
  const actions=panel.createDiv({cls:'writer-tools-v3-actions'});
  for(const [label,fn] of [[txt('Ler seleção','Read selection'),()=>this.speak(this.textFromEditor(true))],
   [txt('Ler nota','Read note'),()=>this.speak(this.textFromEditor(false))],
   [txt('Pausar','Pause'),()=>this.pause()],[txt('Continuar','Resume'),()=>this.resume()],[txt('Parar','Stop'),()=>this.stop()]]){
   const btn=actions.createEl('button',{text:label});btn.addEventListener('click',fn);
  }
  const info=panel.createEl('p',{cls:'writer-tools-muted',text:txt('Idioma: ','Language: ')+(cfg.language||'auto')+' · '+this.voices().length+' '+txt('vozes disponíveis','voices available')});
  info.setAttribute('aria-live','polite');
 }
}
