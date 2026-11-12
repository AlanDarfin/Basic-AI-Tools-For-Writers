'use strict';
/* Device/browser Web Speech and an explicit grammar/focus interaction guard. */
function writerV107SpeechConfig(settings){
 const old=settings.v107Speech&&typeof settings.v107Speech==='object'&&!Array.isArray(settings.v107Speech)?settings.v107Speech:{};
 return settings.v107Speech=Object.assign(old,{enabled:true,lang:'pt-BR',voice:'',rate:1,pitch:1,...old,rate:Math.max(.5,Math.min(2,Number(old.rate)||1)),pitch:Math.max(.5,Math.min(2,Number(old.pitch)||1))});
}
function writerV107SpeechChunks(text,max=1450){
 const src=String(text||'').replace(/\s+/g,' ').trim().slice(0,30000);
 if(!src)return [];
 const result=[];
 for(let start=0;start<src.length;){
  let end=Math.min(src.length,start+max);
  if(end<src.length){const last=Math.max(src.lastIndexOf('. ',end),src.lastIndexOf('! ',end),src.lastIndexOf('? ',end),src.lastIndexOf(' ',end));if(last>start+max/2)end=last+1;}
  result.push(src.slice(start,end));start=end;
 }
 return result;
}
function writerV107SpeechStart(plugin,text){
 if(plugin.settings.v107Speech?.enabled===false)return false;
 const speech=plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.speechSynthesis;
 const Utterance=plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.SpeechSynthesisUtterance;
 if(!speech||!Utterance){new Notice(writerUi('O Android/WebView não disponibilizou voz local. Use a opção Edge TTS do Basic.','No local speech voice in this WebView. Try Basic Edge TTS.'));return false;}
 const chunks=writerV107SpeechChunks(text),cfg=plugin.settings.v107Speech;
 if(!chunks.length)return false;
 speech.cancel();plugin._writerV107SpeechId=(plugin._writerV107SpeechId||0)+1;
 const id=plugin._writerV107SpeechId,voices=speech.getVoices?.()||[];
 const voice=voices.find(v=>v.voiceURI===cfg.voice)||voices.find(v=>v.lang===cfg.lang)||voices.find(v=>v.lang?.split('-')[0]===cfg.lang.split('-')[0]);
 let index=0;
 const speak=()=>{
  if(plugin._writerV107SpeechId!==id||index>=chunks.length)return;
  const utter=new Utterance(chunks[index++]);
  utter.lang=voice?.lang||cfg.lang;utter.rate=cfg.rate;utter.pitch=cfg.pitch;if(voice)utter.voice=voice;
  utter.onend=()=>{if(plugin._writerV107SpeechId===id)speak();};
  utter.onerror=event=>{console.warn('[Basic AI] Local TTS unavailable:',event?.error);};
  speech.speak(utter);
 };
 speak();return true;
}
function writerV107SpeechPanel(plugin){
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Leitura em voz alta · local','Local text to speech'));
 modal.onOpen=()=>{
  const root=modal.contentEl,cfg=plugin.settings.v107Speech;
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Usa vozes disponibilizadas pelo sistema ou navegador. A disponibilidade e o uso de rede dependem da voz escolhida e do dispositivo.','Uses voices provided by the system or browser. Availability and network use depend on the selected voice and device.')});
  const speech=plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.speechSynthesis;
  const list=speech?.getVoices?.()||[];
  new Setting(root).setName(writerUi('Voz do dispositivo','Device voice')).addDropdown(d=>{
   d.addOption('',writerUi('Automática','Automatic'));
   list.forEach((v,i)=>d.addOption(v.voiceURI,v.name+' ('+v.lang+')'));
   d.setValue(cfg.voice||'').onChange(async v=>{cfg.voice=v;await plugin.saveSettings();});
  });
  new Setting(root).setName(writerUi('Idioma','Language')).addText(t=>t.setValue(cfg.lang).onChange(async v=>{cfg.lang=v.slice(0,18);await plugin.saveSettings();}));
  new Setting(root).setName(writerUi('Velocidade','Rate')).addSlider(s=>s.setLimits(.5,2,.05).setValue(cfg.rate).setDynamicTooltip().onChange(async v=>{cfg.rate=v;await plugin.saveSettings();}));
  const commands=root.createDiv({cls:'writer-v10-discovery-actions'});
  commands.createEl('button',{text:writerUi('Pausar','Pause')}).addEventListener('click',()=>speech?.pause());
  commands.createEl('button',{text:writerUi('Continuar','Resume')}).addEventListener('click',()=>speech?.resume());
  commands.createEl('button',{text:writerUi('Parar','Stop')}).addEventListener('click',()=>{plugin._writerV107SpeechId++;speech?.cancel();});
 };
 modal.open();
}
function writerV107SpeechRegister(plugin){
 const cfg=writerV107SpeechConfig(plugin.settings);
 plugin.addCommand({id:'v107-local-tts-selection',name:writerUi('TTS: ler seleção com voz local','TTS: read selection with local voice'),editorCheckCallback:(checking,editor)=>{
  if(!cfg.enabled||!editor.getSelection().trim())return false;
  if(!checking)writerV107SpeechStart(plugin,editor.getSelection());
  return true;
 }});
 plugin.addCommand({id:'v107-local-tts-note',name:writerUi('TTS: ler nota atual com voz local','TTS: read note with local voice'),callback:async()=>{
  const file=plugin.app.workspace.getActiveFile();
  if(!(file instanceof TFile)||file.extension!=='md')return;
  const source=await plugin.app.vault.cachedRead(file);
  writerV107SpeechStart(plugin,source.replace(/^---\r?\n[\s\S]*?\r?\n---/,'').replace(/^\s*#{1,6}\s/gm,''));
 }});
 plugin.addCommand({id:'v107-local-tts-panel',name:writerUi('TTS: vozes e controles locais','TTS: local voice controls'),callback:()=>writerV107SpeechPanel(plugin)});
 plugin.addCommand({id:'v107-tts-stop',name:writerUi('TTS: parar reprodução','TTS: stop playback'),callback:()=>{
  plugin._writerV107SpeechId++;plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.speechSynthesis?.cancel();
 }});
 const workspace=plugin.app.workspace.containerEl;
 plugin.registerDomEvent?.(workspace,'pointerdown',event=>{
  if(event.target?.closest?.('.writer-review-floating,.writer-lt-mobile-modal,.writer-review-panel')){
   plugin.writerReviewInteractionGuard?.captureScroll?.();plugin.writerReviewInteractionGuard?.pause?.(1200);
  }
 },true);
 plugin.register?.(()=>{plugin._writerV107SpeechId++;workspace?.ownerDocument?.defaultView?.speechSynthesis?.cancel();});
}
function writerV107SpeechSettings(plugin,panel){
 const cfg=plugin.settings.v107Speech;
 panel.createEl('h3',{text:writerUi('Leitura com voz do dispositivo','Read with device voices')});
 new Setting(panel).setName(writerUi('Ativar TTS local','Enable local speech')).addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Abrir seletor de voz','Open voice settings')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV107SpeechPanel(plugin)));
}
