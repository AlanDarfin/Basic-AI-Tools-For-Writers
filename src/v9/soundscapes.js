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
  this.plugin=plugin;this.audio=null;this.dock=null;this.frameHost=null;this.guest=null;this.webUrl='';this.dockOpen=false;this.radioGeneration=0;this.playing=false;this.trackIndex=0;
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
  if(this.status){this.status.addClass('writer-v91-sound-status');this.renderStatus();}
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
  this.frameHost.empty();this.guest=null;this.webUrl='';
  if(this.dockSwitch)this.dockSwitch.disabled=false;
  const watchUrl='https://m.youtube.com/watch?v='+id+'&autoplay=1&playsinline=1';
  const useFallback=()=>{
   if(seq!==this.radioGeneration||!this.frameHost?.isConnected)return;
   this.frameHost.empty();
   const frame=this.frameHost.createEl('iframe',{cls:'writer-v91-mini-iframe',attr:{
    src:'https://www.youtube.com/embed/'+id+'?autoplay=1&controls=1&playsinline=1&rel=0',
    title:this.label,referrerpolicy:'strict-origin-when-cross-origin',
    allow:'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowfullscreen:'',loading:'eager'
   }});
   this.guest=frame;this.webUrl=frame.getAttribute('src');
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
  this.emit();
  return true;
 }
 async openRadio(){
  const id=writerV91VideoId(this.videoId);
  if(!id){new Notice(writerUi('Rádio sem vídeo válido.','Radio has no valid video.'));return;}
  this.showMiniPlayer();
  if(!this.dock)return;
  if(!this.mountRadio(id))return;
  // Opening an embedded video is not proof of real playback.
  this.playing=false;this.emit();
 }
 closeRadio(){
  ++this.radioGeneration;
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
   if(this.webOpen){this.showMiniPlayer();return;}
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
 async setVolume(value){
  this.cfg.volume=Math.max(0,Math.min(100,Number(value)||0));
  if(this.audio)this.audio.volume=this.cfg.volume/100;
  this.emit();
  await this.plugin.saveSettings();
 }
 renderStatus(){
  if(!this.status)return;
  const root=this.status;root.empty();
  const select=root.createEl('select',{cls:'writer-v91-sound-select',attr:{'aria-label':writerUi('Escolher rádio','Choose radio')}});
  const play=root.createEl('button',{attr:{type:'button','aria-label':writerUi('Reproduzir ou pausar','Play or pause')}});
  const next=root.createEl('button',{attr:{type:'button','aria-label':writerUi('Próxima faixa','Next track')}});
  const volume=root.createEl('input',{attr:{type:'range',min:'0',max:'100',step:'5','aria-label':writerUi('Volume','Volume')}});
  for(const [id,label] of writerV91SoundStationOptions(this.plugin)){
   const option=select.createEl('option',{text:label});option.value=id;
  }
  select.value=this.cfg.station;
  const update=()=>{
   select.value=this.cfg.station;volume.value=String(this.cfg.volume);
   const local=this.cfg.station==='my-music',active=local?this.playing:this.webOpen;
   play.empty();require('obsidian').setIcon(play,local?(active?'pause':'play'):(active?'x':'external-link'));
   play.setAttribute('aria-label',local?writerUi('Reproduzir ou pausar','Play or pause'):
    active?writerUi('Fechar aba do YouTube','Close YouTube tab'):writerUi('Abrir rádio no Visualizador Web','Open radio in Web Viewer'));
   volume.disabled=!local;
   volume.title=local?'':writerUi('Controle o volume na aba do YouTube','Adjust volume in the YouTube tab');
   next.disabled=this.tracks.length<2;root.classList.toggle('is-playing',active);
   select.title=this.label;
   root.toggleClass?.('is-disabled',!this.cfg.enabled);
  };
  select.addEventListener('change',()=>void this.changeStation(select.value));
  play.addEventListener('click',()=>this.toggle());
  next.addEventListener('click',()=>this.next());
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
 if(view.plugin.app.isMobile)return;
 const player=view.plugin.writerV91Sound;if(!player)return;
 const card=view.card(parent,'soundscape','Soundscapes · rádio','Soundscapes · radio');
 card.addClass('writer-v91-sound-widget');
 const preview=card.createDiv({cls:'writer-v91-sound-preview'});
 const thumbnail=preview.createEl('img',{attr:{alt:'',loading:'lazy'}});
 const description=preview.createDiv();
 const heading=description.createEl('strong');const detail=description.createEl('small');
 const controls=card.createDiv({cls:'writer-v91-sound-controls'});
 const select=controls.createEl('select',{attr:{'aria-label':writerUi('Escolher rádio','Choose radio')}});
 const back=controls.createEl('button',{attr:{type:'button','aria-label':writerUi('Anterior','Previous')}});
 const toggle=controls.createEl('button',{cls:'writer-v91-sound-toggle',attr:{type:'button','aria-label':writerUi('Reproduzir ou pausar','Play or pause')}});
 const forward=controls.createEl('button',{attr:{type:'button','aria-label':writerUi('Próximo','Next')}});
 const slider=controls.createEl('input',{attr:{type:'range',min:'0',max:'100',step:'5','aria-label':writerUi('Volume','Volume')}});
 for(const [id,name] of writerV91SoundStationOptions(view.plugin)){
  const option=select.createEl('option',{text:name});option.value=id;
 }
 require('obsidian').setIcon(back,'skip-back');require('obsidian').setIcon(forward,'skip-forward');
 const update=()=>{
  if(!card.isConnected)return;
  select.value=player.cfg.station;
  const local=player.cfg.station==='my-music',active=local?player.playing:player.webOpen;
  toggle.empty();require('obsidian').setIcon(toggle,local?(active?'pause':'play'):(active?'x':'external-link'));
  toggle.setAttribute('aria-label',local?writerUi('Reproduzir ou pausar','Play or pause'):
   active?writerUi('Fechar aba do YouTube','Close YouTube tab'):writerUi('Abrir rádio no Visualizador Web','Open radio in Web Viewer'));
  const multi=player.tracks.length>1;back.disabled=!multi;forward.disabled=!multi;
  slider.value=String(player.cfg.volume);slider.disabled=!local;
  slider.title=local?'':writerUi('Volume disponível na aba do YouTube','Volume available in the YouTube tab');
  heading.textContent=player.label;
  detail.textContent=local?writerUi('Arquivos de áudio do cofre','Vault audio files'):writerUi('Use os controles na aba do YouTube','Use controls in the YouTube tab');
  const id=player.videoId;
  thumbnail.style.display=id?'':'none';
  if(id)thumbnail.src='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';
  card.classList.toggle('is-playing',active);
 };
 select.addEventListener('change',()=>void player.changeStation(select.value));
 back.addEventListener('click',()=>player.prev());
 toggle.addEventListener('click',()=>player.toggle());
 forward.addEventListener('click',()=>player.next());
 slider.addEventListener('input',()=>void player.setVolume(slider.value));
 player.subscribe(card,update);
 if(player.cfg.station==='my-music')card.createEl('button',{text:writerUi('Abrir biblioteca','Open library'),cls:'writer-v91-library-link'}).addEventListener('click',()=>player.libraryModal());
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
  'As rádios abrem vídeos no Visualizador Web nativo. Controle reprodução e volume na aba do YouTube; o botão fecha a aba para interromper. Minha Música usa o player local.',
  'Radio stations open in the native Web Viewer. Control playback and volume in the YouTube tab; the button closes the tab to stop. My Music uses the local player.'
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
