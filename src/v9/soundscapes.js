'use strict';
/* v9.1: Desktop Soundscapes integration inspired by MIT-licensed
 * andrewmcgivery/obsidian-soundscapes. Network radio uses YouTube embeds;
 * vault audio stays local. No media, video, or audio is bundled. */
const WRITER_V91_RADIOS=[
 ['lofi','Lofi beats','jfKfPfyJRdk'],['spa','Spa atmosphere','FbxLnvWVSrk'],
 ['sims','The Sims soundtrack','wKnkQdsITUE'],['thunder','Thunderstorm','nDq6TstdEi8'],
 ['fire','Cozy fireplace','rCYzRXLWcIg'],['birds','Birds chirping','mFjU4JuJgnM'],
 ['ocean','Ocean waves','bn9F19Hi1Lk'],['jazz','Relaxing jazz','0u34Pb25BNg'],
 ['coffeeshop','Coffee shop ambience','uiMXGIG_DQo'],
 ['animalcrossing','Animal Crossing','eKEAmOUFYJg'],
 ['yakuzabar','Yakuza bar ambience','Q0GtyZbHJDM'],
 ['nintendo','Calm Nintendo music','sA0qrPOMy2Y'],
 ['skycotl','Sky: Children of the Light','87etrUp83Yc'],
 ['vtmbloodlines','VTM Bloodlines ambience','pCZxb43L_Ag'],
 ['chillsynth','ChillSynth FM','UedTcufyrHc'],
 ['peacefulpiano','Peaceful piano','TtkFsfOP9QI'],
 ['synthwave','Synthwave radio','4xDzrJKXOOY']
];
function writerV91VideoId(input){
 const text=String(input||'').trim();
 if(/^[a-zA-Z0-9_-]{11}$/.test(text))return text;
 try{
  const url=new URL(text);
  const hostname=url.hostname.toLowerCase();
  if(hostname==='youtu.be')return writerV91VideoId(url.pathname.slice(1).split('/')[0]);
  if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com'].includes(hostname)){
   if(url.pathname==='/watch')return writerV91VideoId(url.searchParams.get('v')||'');
   if(/^\/(embed|live|shorts)\//.test(url.pathname))return writerV91VideoId(url.pathname.split('/')[2]||'');
  }
 }catch(_){}
 return '';
}
function writerV91SoundVolume(value){
 const number=Number(value);
 return Number.isFinite(number)?Math.round(Math.max(0,Math.min(100,number))):25;
}
// The Webview executes this fixed, narrowly scoped code only on our YouTube guest.
// The numeric volume is sanitized before being embedded in the script.
function writerV91SoundWebVolumeScript(level){
 const volume=writerV91SoundVolume(level)/100;
 return '(()=>{'+
  'const volume='+JSON.stringify(volume)+';'+
  'const apply=()=>{const video=document.querySelector("video");'+
  'if(!video)return false;video.volume=volume;video.muted=volume===0;return true;};'+
  'const key="__basicWriterSoundVolume";'+
  'try{window[key]?.disconnect?.();}catch(_){}'+
  'if(apply())return true;'+
  'const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});'+
  'observer.observe(document.documentElement||document,{subtree:true,childList:true});'+
  'window[key]=observer;return false;'+
 '})()';
}
function writerV91SoundMerge(settings){
 const raw=settings.v91Sound&&typeof settings.v91Sound==='object'?settings.v91Sound:{};
 const cfg=settings.v91Sound={
  enabled:true,station:'lofi',volume:25,autoplay:false,musicFolder:'',shuffle:false,customPlaylists:[],...raw
 };
 cfg.enabled=cfg.enabled!==false;cfg.autoplay=cfg.autoplay===true;cfg.shuffle=cfg.shuffle===true;
 cfg.volume=Math.max(0,Math.min(100,Math.round(Number(cfg.volume)||0)));
 cfg.musicFolder=String(cfg.musicFolder||'').replace(/^\/+|\/+$/g,'').slice(0,500);
 cfg.customPlaylists=Array.isArray(cfg.customPlaylists)?cfg.customPlaylists.slice(0,30).map((entry,i)=>({
  id:String(entry?.id||('playlist-'+i)).replace(/[^a-z0-9_-]/gi,'').slice(0,60),
  name:String(entry?.name||'Playlist').trim().slice(0,90),
  tracks:(Array.isArray(entry?.tracks)?entry.tracks:[]).slice(0,120).map(track=>({
   name:String(track?.name||'YouTube').trim().slice(0,120),id:writerV91VideoId(track?.id)
  })).filter(track=>track.id)
 })).filter(entry=>entry.id&&entry.tracks.length):[];
 const choices=new Set([...WRITER_V91_RADIOS.map(r=>r[0]),'my-music',...cfg.customPlaylists.map(p=>'custom:'+p.id)]);
 if(!choices.has(cfg.station))cfg.station='lofi';
 return cfg;
}
function writerV91SoundStationOptions(plugin){
 return [...WRITER_V91_RADIOS.map(([id,name])=>[id,name]),...plugin.settings.v91Sound.customPlaylists.map(p=>['custom:'+p.id,p.name]),['my-music',writerUi('Minha música','My Music')]];
}
function writerV91SoundAudioFiles(plugin){
 const folder=plugin.settings.v91Sound.musicFolder;
 const prefix=folder?folder+'/':'';
 return (plugin.app.vault.getFiles?.()||[]).filter(file=>
  ['mp3','wav','ogg','m4a','flac'].includes(String(file.extension||'').toLowerCase())&&
  (!folder||file.path.startsWith(prefix))).sort((a,b)=>a.path.localeCompare(b.path));
}
class WriterV91SoundPlayer{
 constructor(plugin){
  this.plugin=plugin;this.audio=null;this.dock=null;this.frameHost=null;this.guest=null;this.webUrl='';this.dockOpen=false;this.radioGeneration=0;this.webTimer=null;this.playing=false;this.trackIndex=0;
  this.shuffleOrder=[];this.subscribers=new Set();this.status=null;this.host=null;
 }
 get cfg(){return this.plugin.settings.v91Sound;}
 get station(){return writerV91SoundStationOptions(this.plugin).find(x=>x[0]===this.cfg.station);}
 get playlist(){return this.cfg.customPlaylists.find(p=>'custom:'+p.id===this.cfg.station);}
 get tracks(){
  if(this.cfg.station==='my-music')return writerV91SoundAudioFiles(this.plugin);
  if(this.playlist)return this.playlist.tracks;
  const preset=WRITER_V91_RADIOS.find(x=>x[0]===this.cfg.station)||WRITER_V91_RADIOS[0];
  return [{name:preset[1],id:preset[2]}];
 }
 get track(){const tracks=this.tracks;return tracks[Math.min(Math.max(0,this.trackIndex),tracks.length-1)]||null;}
 get label(){return this.track?.basename||this.track?.name||this.station?.[1]||'Soundscapes';}
 get videoId(){return this.cfg.station==='my-music'?'':this.track?.id||'';}
 get webOpen(){return Boolean(this.guest?.isConnected&&this.webUrl);}
 get miniVisible(){return Boolean(this.dock?.isConnected&&this.dockOpen);}
 subscribe(node,callback){this.subscribers.add({node,callback});callback();return()=>{for(const s of this.subscribers)if(s.node===node&&s.callback===callback)this.subscribers.delete(s);};}
 emit(){
  for(const entry of this.subscribers){
   if(!entry.node.isConnected){this.subscribers.delete(entry);continue;}
   try{entry.callback();}catch(error){console.warn('[Basic AI] Soundscapes UI:',error);}
  }
 }
 init(){
  if(this.plugin.app.isMobile)return;
  this.status=this.plugin.addStatusBarItem?.();
  if(this.status){this.status.addClass('writer-v91-sound-status');
   if(typeof writerV132ProtectStatusBar==='function')writerV132ProtectStatusBar(this.plugin,this.status);
   this.renderStatus();}
  this.plugin.addCommand({id:'v91-sound-play-pause',name:writerUi('Soundscapes: reproduzir ou pausar','Soundscapes: play or pause'),callback:()=>this.toggle()});
  this.plugin.addCommand({id:'v91-sound-mini-player',name:writerUi('Soundscapes: mostrar mini player','Soundscapes: show mini player'),callback:()=>this.showMiniPlayer()});
  this.plugin.addCommand({id:'v91-sound-next',name:writerUi('Soundscapes: próxima faixa','Soundscapes: next track'),callback:()=>this.next()});
  this.plugin.addCommand({id:'v91-sound-library',name:writerUi('Soundscapes: abrir Minha Música','Soundscapes: open My Music'),callback:()=>this.libraryModal()});
  this.plugin.register?.(()=>this.destroy());
  if(this.cfg.autoplay&&this.cfg.enabled)this.plugin.app.workspace.onLayoutReady?.(()=>this.play());
 }
 ensureAudio(){
  if(this.audio)return;
  this.audio=new Audio();this.audio.preload='metadata';this.audio.volume=this.cfg.volume/100;
  this.audio.addEventListener('play',()=>{this.playing=true;this.emit();});
  this.audio.addEventListener('pause',()=>{this.playing=false;this.emit();});
  this.audio.addEventListener('ended',()=>this.next());
  this.audio.addEventListener('error',()=>{this.playing=false;this.emit();new Notice(writerUi('Não foi possível reproduzir o arquivo de áudio.','Could not play this audio file.'));});
 }
 // Desktop-only in-app mini player. Never create or reveal a workspace leaf.
 ensureDock(){
  if(this.dock?.isConnected)return this.dock;
  const doc=this.plugin.app.workspace.containerEl?.ownerDocument||document;
  if(!doc?.body)throw new Error('Document body unavailable');
  const panel=doc.body.createDiv({cls:'writer-v91-mini-player is-collapsed'});
  panel.setAttribute('role','region');
  panel.setAttribute('aria-label',writerUi('Mini player Soundscapes','Soundscapes mini player'));
  const head=panel.createDiv({cls:'writer-v91-mini-head'});
  const title=head.createSpan({cls:'writer-v91-mini-title',text:this.label});
  const hide=head.createEl('button',{attr:{type:'button','aria-label':writerUi('Recolher sem parar','Hide without stopping')}});
  const stop=head.createEl('button',{attr:{type:'button','aria-label':writerUi('Parar reprodução','Stop playback')}});
  require('obsidian').setIcon(hide,'minus');
  require('obsidian').setIcon(stop,'square');
  hide.addEventListener('click',()=>this.hideMiniPlayer());
  stop.addEventListener('click',()=>this.pause());
  const body=panel.createDiv({cls:'writer-v91-mini-video'});
  const miniVolume=panel.createDiv({cls:'writer-v91-mini-volume'});
  miniVolume.createSpan({text:writerUi('Volume','Volume')});
  const slider=miniVolume.createEl('input',{attr:{type:'range',min:'0',max:'100',step:'1',
   'aria-label':writerUi('Volume do mini player','Mini player volume')}});
  slider.value=String(this.cfg.volume);
  slider.addEventListener('input',()=>void this.setVolume(slider.value));
  this.miniVolume=slider;
  const helper=panel.createDiv({cls:'writer-v91-mini-help'});
  const switchMode=panel.createEl('button',{cls:'writer-v91-mini-switch',text:writerUi('Alternar player','Switch player'),attr:{type:'button'}});
  switchMode.addEventListener('click',()=>{
   if(!this.webOpen)return;
   const next=this.guest?.tagName?.toLowerCase()==='webview'?'iframe':'webview';
   this.mountRadio(this.videoId,next);
  });
  this.dock=panel;this.frameHost=body;this.dockTitle=title;
  this.dockHelp=helper;this.dockSwitch=switchMode;
  return panel;
 }
 showMiniPlayer(){
  if(this.plugin.app.isMobile||!this.cfg.enabled)return;
  try{
   this.ensureDock();this.dockOpen=true;
   this.dock.classList.remove('is-collapsed');
   this.dockTitle.setText(this.label);
   if(this.miniVolume)this.miniVolume.value=String(this.cfg.volume);
   this.emit();
  }catch(error){
   console.warn('[Basic AI] Soundscapes mini player:',error);
   new Notice(writerUi('Não foi possível criar o mini player.','Could not create mini player.'));
  }
 }
 hideMiniPlayer(){
  this.dockOpen=false;
  this.dock?.classList.add('is-collapsed');
  // Keep the guest in the DOM to preserve playback while the panel is hidden.
  this.emit();
 }
 mountRadio(rawId,preferred='auto'){
  const id=writerV91VideoId(rawId);
  if(!id||!this.frameHost)return false;
  const seq=++this.radioGeneration,doc=this.frameHost.ownerDocument;
  if(this.webTimer){clearTimeout(this.webTimer);this.webTimer=null;}
  this.frameHost.empty();this.guest=null;this.webUrl='';
  if(this.dockSwitch)this.dockSwitch.disabled=false;
  const watchUrl='https://m.youtube.com/watch?v='+id+'&autoplay=1&playsinline=1';
  const useFallback=()=>{
   if(seq!==this.radioGeneration||!this.frameHost?.isConnected)return;
   if(this.webTimer){clearTimeout(this.webTimer);this.webTimer=null;}
   this.frameHost.empty();
   const frame=this.frameHost.createEl('iframe',{cls:'writer-v91-mini-iframe',attr:{
    src:'https://www.youtube.com/embed/'+id+'?autoplay=1&controls=1&playsinline=1&rel=0&enablejsapi=1',
    title:this.label,referrerpolicy:'strict-origin-when-cross-origin',
    allow:'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowfullscreen:'',loading:'eager'
   }});
   this.guest=frame;this.webUrl=frame.getAttribute('src');
   frame.addEventListener('load',()=>{
    if(seq===this.radioGeneration&&this.guest===frame)this.syncRadioVolume();
   });
   this.syncRadioVolume();
   this.dockHelp.setText(writerUi(
    'Player incorporado. Se o YouTube bloquear este vídeo (erro 153), alterne o player ou escolha outra estação.',
    'Embedded player. If YouTube blocks the video (error 153), switch player or choose another station.'
   ));
   this.emit();
  };
  if(preferred==='iframe'){useFallback();return true;}
  let web;
  try{web=doc.createElement('webview');}catch(error){console.warn('[Basic AI] Webview element:',error);}
  // Webviews are not exposed on all desktop builds; do not change Electron security settings.
  if(!web||typeof web.loadURL!=='function'){useFallback();return true;}
  web.className='writer-v91-mini-webview';
  web.setAttribute('src',watchUrl);
  this.frameHost.appendChild(web);
  this.guest=web;this.webUrl=watchUrl;
  this.dockHelp.setText(writerUi(
   'YouTube dentro do mini player. Use os controles do vídeo. Recolher mantém a rádio ativa.',
   'YouTube inside the mini player. Use video controls. Hiding keeps the radio active.'
  ));
  const fallback=event=>{
   if(seq!==this.radioGeneration||this.guest!==web)return;
   console.warn('[Basic AI] Soundscapes webview:',event?.errorDescription||event?.type||event);
   useFallback();
  };
  web.addEventListener('did-fail-load',event=>{
   if(event.errorCode!==-3)fallback(event);
  });
  web.addEventListener('render-process-gone',fallback);
  web.addEventListener('dom-ready',()=>{
   if(seq!==this.radioGeneration||this.guest!==web)return;
   if(this.webTimer){clearTimeout(this.webTimer);this.webTimer=null;}
   this.syncRadioVolume();
  });
  web.addEventListener('did-finish-load',()=>{
   if(seq===this.radioGeneration&&this.guest===web)this.syncRadioVolume();
  });
  web.addEventListener('did-navigate-in-page',()=>{
   if(seq===this.radioGeneration&&this.guest===web)this.syncRadioVolume();
  });
  // On some Electron builds the tag exists but never initializes.
  this.webTimer=setTimeout(()=>{
   this.webTimer=null;
   if(seq===this.radioGeneration&&this.guest===web)fallback({type:'webview-timeout'});
  },9000);
  this.webTimer?.unref?.();
  this.emit();
  return true;
 }
 async openRadio(){
  const id=writerV91VideoId(this.videoId);
  if(!id){new Notice(writerUi('Rádio sem vídeo válido.','Radio has no valid video.'));return;}
  // Playback and the video popup are independent: only the explicit
  // "Show mini player" action may open the video UI.
  try{
   this.ensureDock();
   this.hideMiniPlayer();
  }catch(error){
   console.warn('[Basic AI] Soundscapes background player:',error);
   new Notice(writerUi('Não foi possível iniciar o player em segundo plano.','Could not start the background player.'));
   return;
  }
  if(!this.mountRadio(id))return;
  // Opening an embedded video is not proof of real playback.
  this.playing=false;this.emit();
 }
 closeRadio(){
  ++this.radioGeneration;
  if(this.webTimer){clearTimeout(this.webTimer);this.webTimer=null;}
  this.frameHost?.empty();
  this.guest=null;this.webUrl='';
  if(this.dockSwitch)this.dockSwitch.disabled=true;
  this.hideMiniPlayer();
 }
 releaseMedia(){
  if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load();}
  this.closeRadio();
 }
 async loadCurrent(){
  const local=this.cfg.station==='my-music';
  this.releaseMedia();
  const item=this.track;
  if(!item){
   this.playing=false;this.emit();
   new Notice(local?writerUi('Nenhum áudio encontrado na pasta configurada.','No audio found in the configured folder.'):
    writerUi('Nenhuma faixa disponível.','No track available.'));
   return;
  }
  if(local){
   this.ensureAudio();this.audio.src=this.plugin.app.vault.getResourcePath(item);
   this.audio.volume=this.cfg.volume/100;
   try{await this.audio.play();this.playing=true;}
   catch(error){
    this.playing=false;console.warn('[Basic AI] Local audio:',error);
    new Notice(writerUi('Não foi possível iniciar este áudio.','Could not start this audio.'));
   }
  }else await this.openRadio();
  this.emit();
 }
 async play(){
  if(this.plugin.app.isMobile||!this.cfg.enabled)return;
  if(this.cfg.station!=='my-music'){
   // Play never opens a popup or forces a hidden guest into view.
   if(this.webOpen)return;
   await this.loadCurrent();return;
  }
  if(this.playing)return;
  this.ensureAudio();
  if(this.audio.src){
   try{await this.audio.play();this.playing=true;}
   catch(error){
    this.playing=false;console.warn('[Basic AI] Local audio:',error);
    new Notice(writerUi('Não foi possível iniciar este áudio.','Could not start this audio.'));
   }
  }else await this.loadCurrent();
  this.emit();
 }
 pause(){
  if(this.audio)this.audio.pause();
  this.closeRadio();
  this.playing=false;this.emit();
 }
 toggle(){
  if(this.cfg.station==='my-music'){
   if(this.playing)this.pause();else void this.play();
  }else if(this.webOpen)this.pause();
  else void this.play();
 }
 async changeStation(id){
  if(!writerV91SoundStationOptions(this.plugin).some(x=>x[0]===id))return;
  const resume=this.playing||this.webOpen;this.cfg.station=id;this.trackIndex=0;this.releaseMedia();
  this.playing=false;await this.plugin.saveSettings();this.emit();
  if(resume)await this.play();
 }
 next(delta=1){
  const len=this.tracks.length;if(!len){this.pause();return;}
  if(len===1){if(this.cfg.station==='my-music')void this.loadCurrent();return;}
  if(this.cfg.shuffle&&delta>0&&this.cfg.station==='my-music')
   this.trackIndex=(this.trackIndex+1+Math.floor(Math.random()*(len-1)))%len;
  else this.trackIndex=(this.trackIndex+delta+len)%len;
  if(this.playing||this.webOpen)void this.loadCurrent();else{this.releaseMedia();this.emit();}
 }
 prev(){this.next(-1);}
 // The radio is remote media: updating the local Audio element alone cannot change it.
 // Use Electron's guest JavaScript for Webview and YouTube's iframe commands otherwise.
 syncRadioVolume(){
  const guest=this.guest,level=writerV91SoundVolume(this.cfg.volume);
  if(!guest?.isConnected||!this.webUrl)return;
  if(guest.tagName?.toLowerCase()==='webview'){
   if(typeof guest.executeJavaScript!=='function')return;
   // Restrict interaction to the station's original YouTube guest.
   if(typeof guest.getURL==='function'){
    try{
     const host=new URL(guest.getURL()).hostname.toLowerCase();
     if(!['m.youtube.com','www.youtube.com','youtube.com','music.youtube.com'].includes(host))return;
    }catch(_){return;}
   }
   try{
    const task=guest.executeJavaScript(writerV91SoundWebVolumeScript(level));
    Promise.resolve(task).catch(error=>{
     if(this.guest===guest)console.warn('[Basic AI] Soundscapes Webview volume:',error);
    });
   }catch(error){console.warn('[Basic AI] Soundscapes Webview volume:',error);}
  }else if(guest.tagName?.toLowerCase()==='iframe'){
   const destination='https://www.youtube.com',receiver=guest.contentWindow;
   if(typeof receiver?.postMessage!=='function')return;
   const send=(func,args=[])=>receiver.postMessage(JSON.stringify({event:'command',func,args}),destination);
   try{
    send(level===0?'mute':'unMute');
    send('setVolume',[level]);
   }catch(error){console.warn('[Basic AI] Soundscapes iframe volume:',error);}
  }
 }
 async setVolume(value){
  this.cfg.volume=writerV91SoundVolume(value);
  if(this.audio)this.audio.volume=this.cfg.volume/100;
  if(this.miniVolume)this.miniVolume.value=String(this.cfg.volume);
  this.syncRadioVolume();
  this.emit();
  await this.plugin.saveSettings();
 }
 renderStatus(){
  if(!this.status)return;
  const root=this.status;root.empty();
  const select=root.createEl('select',{cls:'writer-v91-sound-select',attr:{'aria-label':writerUi('Escolher rádio','Choose radio')}});
  const play=root.createEl('button',{attr:{type:'button','aria-label':writerUi('Reproduzir ou pausar','Play or pause')}});
  const next=root.createEl('button',{attr:{type:'button','aria-label':writerUi('Próxima faixa','Next track')}});
  const mini=root.createEl('button',{attr:{type:'button','aria-label':writerUi('Exibir mini player','Show mini player')}});
  const volume=root.createEl('input',{attr:{type:'range',min:'0',max:'100',step:'5','aria-label':writerUi('Volume','Volume')}});
  for(const [id,label] of writerV91SoundStationOptions(this.plugin)){
   const option=select.createEl('option',{text:label});option.value=id;
  }
  select.value=this.cfg.station;
  const update=()=>{
   select.value=this.cfg.station;volume.value=String(this.cfg.volume);
   const local=this.cfg.station==='my-music',active=local?this.playing:this.webOpen;
   play.empty();require('obsidian').setIcon(play,local?(active?'pause':'play'):(active?'square':'play'));
   mini.empty();require('obsidian').setIcon(mini,'picture-in-picture-2');
   mini.disabled=local||!active;
   mini.title=writerUi('Exibir mini player sem reiniciar a rádio','Show mini player without restarting radio');
   play.setAttribute('aria-label',local?writerUi('Reproduzir ou pausar','Play or pause'):
    active?writerUi('Parar rádio','Stop radio'):writerUi('Iniciar no mini player','Start in mini player'));
   volume.disabled=!this.cfg.enabled;
   volume.title=writerUi('Volume do Soundscapes','Soundscapes volume');
   next.disabled=this.tracks.length<2;root.classList.toggle('is-playing',active);
   select.title=this.label;
   root.toggleClass?.('is-disabled',!this.cfg.enabled);
  };
  select.addEventListener('change',()=>void this.changeStation(select.value));
  play.addEventListener('click',()=>this.toggle());
  next.addEventListener('click',()=>this.next());
  mini.addEventListener('click',()=>this.showMiniPlayer());
  volume.addEventListener('input',()=>void this.setVolume(volume.value));
  this.subscribe(root,update);
 }
 libraryModal(){
  if(this.plugin.app.isMobile)return;
  const modal=new Modal(this.plugin.app);
  let query='';
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Minha música','My Music'));
   const root=modal.contentEl.createDiv({cls:'writer-v91-music-library'});
   const search=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Pesquisar MP3 e outros áudios…','Search MP3 and other audio…')}});
   const list=root.createDiv({cls:'writer-v91-music-results'});
   const render=()=>{
    list.empty();const tracks=writerV91SoundAudioFiles(this.plugin);
    const matches=tracks.filter(t=>t.path.toLowerCase().includes(query.toLowerCase())).slice(0,400);
    if(!matches.length)list.createEl('p',{text:writerUi('Nenhuma música encontrada na pasta configurada.','No audio files found in the configured folder.')});
    for(const file of matches){
     const item=list.createEl('button',{cls:'writer-v91-music-item',attr:{type:'button'}});
     require('obsidian').setIcon(item.createSpan(),'music');
     item.createSpan({text:file.basename});item.createEl('small',{text:file.path});
     item.addEventListener('click',async()=>{
      await this.changeStation('my-music');
      this.trackIndex=tracks.findIndex(x=>x.path===file.path);
      await this.loadCurrent();modal.close();
     });
    }
   };
   search.addEventListener('input',()=>{query=search.value;render();});render();
  };
  modal.open();
 }
 destroy(){this.pause();this.dock?.remove();this.dock=null;this.subscribers.clear();this.status?.remove();}
}
function writerV91HomeSoundscape(view,parent){
 // All home widgets exist independent of playback and platform. In particular,
 // mobile retains the same configurable/reorderable card instead of omitting it.
 const card=view.card(parent,'soundscape','Soundscapes · rádio','Soundscapes · radio');
 card.addClass('writer-v91-sound-widget');
 if(view.plugin.app.isMobile){
  card.createEl('p',{cls:'writer-v8-home-muted writer-v91-sound-unavailable',
   text:writerUi('A reprodução do Soundscapes não está disponível no celular devido às limitações de áudio e Webview do Obsidian mobile.',
    'Soundscapes playback is unavailable on mobile due to Obsidian mobile audio and Webview limitations.')});
  return card;
 }
 const player=view.plugin.writerV91Sound;
 if(!player){
  card.createEl('p',{cls:'writer-v8-home-muted writer-v91-sound-unavailable',
   text:writerUi('O player Soundscapes não está disponível nesta sessão.','Soundscapes player is unavailable in this session.')});
  return card;
 }
 const preview=card.createDiv({cls:'writer-v91-sound-preview'});
 const thumbnail=preview.createEl('img',{attr:{alt:'',loading:'lazy'}});
 const description=preview.createDiv();
 const heading=description.createEl('strong');const detail=description.createEl('small');
 const controls=card.createDiv({cls:'writer-v91-sound-controls'});
 const select=controls.createEl('select',{attr:{'aria-label':writerUi('Escolher rádio','Choose radio')}});
 const back=controls.createEl('button',{attr:{type:'button','aria-label':writerUi('Anterior','Previous')}});
 const toggle=controls.createEl('button',{cls:'writer-v91-sound-toggle',attr:{type:'button','aria-label':writerUi('Reproduzir ou pausar','Play or pause')}});
 const forward=controls.createEl('button',{attr:{type:'button','aria-label':writerUi('Próximo','Next')}});
 const mini=controls.createEl('button',{attr:{type:'button','aria-label':writerUi('Exibir mini player','Show mini player')}});
 const slider=controls.createEl('input',{attr:{type:'range',min:'0',max:'100',step:'5','aria-label':writerUi('Volume','Volume')}});
 for(const [id,name] of writerV91SoundStationOptions(view.plugin)){
  const option=select.createEl('option',{text:name});option.value=id;
 }
 require('obsidian').setIcon(back,'skip-back');require('obsidian').setIcon(forward,'skip-forward');require('obsidian').setIcon(mini,'picture-in-picture-2');
 const update=()=>{
  if(!card.isConnected)return;
  select.value=player.cfg.station;
  const local=player.cfg.station==='my-music',active=local?player.playing:player.webOpen;
  const icon=local?(active?'pause':'play'):(active?'square':'play');
  if(toggle.dataset.soundIcon!==icon){
   require('obsidian').setIcon(toggle,icon);
   toggle.dataset.soundIcon=icon;
  }
  mini.disabled=local||!active;
  toggle.setAttribute('aria-label',local?writerUi('Reproduzir ou pausar','Play or pause'):
   active?writerUi('Parar rádio','Stop radio'):writerUi('Iniciar no mini player','Start in mini player'));
  const multi=player.tracks.length>1;back.disabled=!multi;forward.disabled=!multi;
  slider.value=String(player.cfg.volume);slider.disabled=!player.cfg.enabled;
  slider.title=writerUi('Volume do Soundscapes','Soundscapes volume');
  heading.textContent=player.label;
  detail.textContent=local?writerUi('Arquivos de áudio do cofre','Vault audio files'):writerUi('YouTube no mini player integrado','YouTube in integrated mini player');
  const id=player.videoId;
  thumbnail.style.display=id?'':'none';
  if(id&&thumbnail.dataset.soundVideo!==id){
   thumbnail.dataset.soundVideo=id;
   thumbnail.src='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';
  }
  card.classList.toggle('is-playing',active);
 };
 select.addEventListener('change',()=>void player.changeStation(select.value));
 back.addEventListener('click',()=>player.prev());
 toggle.addEventListener('click',()=>player.toggle());
 forward.addEventListener('click',()=>player.next());
 mini.addEventListener('click',()=>player.showMiniPlayer());
 slider.addEventListener('input',()=>void player.setVolume(slider.value));
 const library=card.createEl('button',{text:writerUi('Abrir biblioteca','Open library'),cls:'writer-v91-library-link'});
 library.addEventListener('click',()=>player.libraryModal());
 player.subscribe(card,()=>{
  update();
  library.style.display=player.cfg.station==='my-music'?'':'none';
 });
 return card;
}
function writerV91SoundPlaylistEditor(plugin,initial,done){
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  modal.setTitle(writerUi('Playlist personalizada','Custom soundscape'));
  const content=modal.contentEl;
  const name=content.createEl('input',{attr:{type:'text',placeholder:writerUi('Nome da playlist','Playlist name'),maxlength:'90'}});
  name.value=initial?.name||'';
  content.createEl('p',{text:writerUi('Uma faixa por linha: Nome | link do YouTube','One track per line: Title | YouTube URL')});
  const textarea=content.createEl('textarea',{attr:{rows:'9',placeholder:'Lofi | https://www.youtube.com/watch?v=jfKfPfyJRdk'}});
  textarea.value=(initial?.tracks||[]).map(t=>t.name+' | https://www.youtube.com/watch?v='+t.id).join('\n');
  const error=content.createEl('small');
  new Setting(content).addButton(b=>b.setButtonText(writerUi('Salvar playlist','Save playlist')).setCta().onClick(()=>{
   const tracks=textarea.value.split(/\r?\n/).map(line=>{
    const chunks=line.split(/\s+\|\s+/),id=writerV91VideoId(chunks.pop());
    return {name:(chunks.join(' | ')||'YouTube').trim().slice(0,120),id};
   }).filter(t=>t.id).slice(0,120);
   if(!name.value.trim()||!tracks.length){error.setText(writerUi('Informe um nome e ao menos um link válido.','Add a name and at least one valid URL.'));return;}
   done({id:initial?.id||'p'+Date.now().toString(36),name:name.value.trim().slice(0,90),tracks});
   modal.close();
  }));
 };
 modal.open();
}
function writerV91SoundSettings(plugin,panel){
 const cfg=plugin.settings.v91Sound;
 panel.createEl('h3',{text:'Soundscapes'});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'As rádios abrem um mini player dentro do Obsidian, sem criar abas. O volume é controlado pelo mesmo slider na Homepage, na barra de status e no mini player. Recolher preserva a reprodução; Parar encerra a rádio. Alguns vídeos podem bloquear incorporação (erro 153). Minha Música continua local.',
  'Radio stations open an in-app mini player without tabs. The same volume setting is shared by the Homepage, status bar and mini player sliders. Hiding keeps playback running; Stop ends the radio. Some videos block embedding (error 153). My Music stays local.'
 )});
 if(plugin.app.isMobile){
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Rádios e reprodução estão disponíveis apenas no computador.','Radio playback is desktop-only.')});return;
 }
 new Setting(panel).setName(writerUi('Ativar Soundscapes','Enable Soundscapes')).addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{
  cfg.enabled=v;if(!v)plugin.writerV91Sound.pause();await plugin.saveSettings();plugin.writerV91Sound.emit();
 }));
 new Setting(panel).setName(writerUi('Rádio selecionada','Selected radio')).addDropdown(d=>{
  for(const [id,label] of writerV91SoundStationOptions(plugin))d.addOption(id,label);
  d.setValue(cfg.station).onChange(v=>void plugin.writerV91Sound.changeStation(v));
 });
 new Setting(panel).setName(writerUi('Volume','Volume')).addSlider(s=>s.setLimits(0,100,5).setDynamicTooltip().setValue(cfg.volume).onChange(v=>void plugin.writerV91Sound.setVolume(v)));
 new Setting(panel).setName(writerUi('Reproduzir ao iniciar','Play on startup')).addToggle(t=>t.setValue(cfg.autoplay).onChange(async v=>{cfg.autoplay=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Pasta de músicas do cofre','Vault music folder'))
  .setDesc(writerUi('Deixe vazio para pesquisar áudios em todo o cofre.','Leave blank to search audio throughout the vault.'))
  .addText(t=>t.setPlaceholder('Music').setValue(cfg.musicFolder).onChange(async v=>{cfg.musicFolder=v.trim();await plugin.saveSettings();plugin.writerV91Sound.emit();}));
 new Setting(panel).setName(writerUi('Reprodução aleatória','Shuffle My Music')).addToggle(t=>t.setValue(cfg.shuffle).onChange(async v=>{cfg.shuffle=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Biblioteca de músicas','Music library')).addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>plugin.writerV91Sound.libraryModal()));
 panel.createEl('h4',{text:writerUi('Playlists personalizadas','Custom playlists')});
 for(const list of cfg.customPlaylists){
  const row=new Setting(panel).setName(list.name).setDesc(list.tracks.length+' '+writerUi('faixas','tracks'));
  row.addButton(b=>b.setButtonText(writerUi('Editar','Edit')).onClick(()=>writerV91SoundPlaylistEditor(plugin,list,async next=>{
   cfg.customPlaylists[cfg.customPlaylists.indexOf(list)]=next;await plugin.saveSettings();plugin.writerSettingsTab?.display();
  })));
  row.addButton(b=>b.setButtonText(writerUi('Remover','Remove')).onClick(async()=>{
   cfg.customPlaylists=cfg.customPlaylists.filter(x=>x!==list);
   if(cfg.station==='custom:'+list.id)await plugin.writerV91Sound.changeStation('lofi');
   await plugin.saveSettings();plugin.writerSettingsTab?.display();
  }));
 }
 new Setting(panel).setName(writerUi('Adicionar playlist','Add playlist')).addButton(b=>b.setButtonText(writerUi('Criar','Create')).onClick(()=>writerV91SoundPlaylistEditor(plugin,null,async item=>{
  cfg.customPlaylists.push(item);await plugin.saveSettings();plugin.writerSettingsTab?.display();
 })));
}
function writerV91RegisterSound(plugin){
 if(plugin.app.isMobile)return;
 plugin.writerV91Sound=new WriterV91SoundPlayer(plugin);
 plugin.writerV91Sound.init();
}
