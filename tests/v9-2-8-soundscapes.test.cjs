'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v9/soundscapes.js','utf8');
class FakeEl{
 constructor(tag,doc){
  this.tagName=tag.toUpperCase();this.ownerDocument=doc;
  this.children=[];this.parentNode=null;this.attributes={};this.events={};
  this.classes=new Set();this.style={};this.dataset={};this.textContent='';
  this.classList={add:(...names)=>names.forEach(name=>this.classes.add(name)),
   remove:(...names)=>names.forEach(name=>this.classes.delete(name)),
   contains:name=>this.classes.has(name),
   toggle:(name,enabled)=>{if(enabled)this.classes.add(name);else this.classes.delete(name);}};
 }
 get isConnected(){return this===this.ownerDocument.body||Boolean(this.parentNode?.isConnected);}
 setText(value){this.textContent=String(value);}
 setAttribute(key,value){this.attributes[key]=String(value);}
 getAttribute(key){return this.attributes[key]||null;}
 addEventListener(name,cb){this.events[name]=cb;}
 appendChild(child){child.parentNode=this;this.children.push(child);return child;}
 createEl(tag,props={}){
  const child=this.ownerDocument.createElement(tag);
  if(props.cls)for(const cls of props.cls.split(' '))child.classes.add(cls);
  if(props.text!==undefined)child.setText(props.text);
  for(const [key,value] of Object.entries(props.attr||{}))child.setAttribute(key,value);
  return this.appendChild(child);
 }
 createDiv(props={}){return this.createEl('div',props);}
 createSpan(props={}){return this.createEl('span',props);}
 empty(){for(const child of this.children)child.parentNode=null;this.children=[];}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}}
}
class FakeAudio{
 constructor(){this.src='';this.volume=0;this.events={};this.paused=true;}
 addEventListener(name,cb){this.events[name]=cb;}
 async play(){this.paused=false;this.events.play?.();}
 pause(){this.paused=true;this.events.pause?.();}
 removeAttribute(attr){if(attr==='src')this.src='';}
 load(){}
}
function mock(station='lofi',{webview=true,files=[]}={}){
 const executed=[],messages=[];
 const doc={createElement(tag){
  const element=new FakeEl(tag,this);
  if(tag==='webview'&&webview){
   element.loadURL=async()=>{};
   element.getURL=()=>element.getAttribute('src');
   element.executeJavaScript=async code=>{executed.push(code);return true;};
  }
  if(tag==='iframe')element.contentWindow={
   postMessage:(data,origin)=>messages.push({data:JSON.parse(data),origin})
  };
  return element;
 }};
 doc.body=doc.createElement('body');
 const opened=[];
 const workspace={containerEl:{ownerDocument:doc},
  getLeaf(){opened.push('getLeaf');throw Error('Must not open workspace tabs');},
  revealLeaf(){opened.push('revealLeaf');throw Error('Must not reveal tabs');}};
 const plugin={app:{workspace,isMobile:false,vault:{getFiles:()=>files,getResourcePath:file=>'app://vault/'+file.path}},
  settings:{v91Sound:{enabled:true,station,volume:35,customPlaylists:[],shuffle:false,musicFolder:''}},
  async saveSettings(){}};
 const globals={console,URL,Audio:FakeAudio,document:doc,setTimeout,clearTimeout,require:()=>({setIcon:()=>{}}),
  writerUi:(_pt,en)=>en,Notice:class {},Modal:class {},Setting:class {}};
 const Player=vm.runInNewContext(source+'\nWriterV91SoundPlayer',globals);
 return {player:new Player(plugin),doc,opened,plugin,executed,messages};
}
test('radio opens a persistent inline Chromium mini player; no workspace tabs',async()=>{
 const {player,opened}=mock();
 await player.play();
 assert.equal(player.webOpen,true);
 assert.equal(player.miniVisible,true);
 assert.equal(player.playing,false,'Webview page load is not confirmed audio playback');
 assert.equal(player.guest.tagName,'WEBVIEW');
 assert.match(player.webUrl,/^https:\/\/m\.youtube\.com\/watch\?v=jfKfPfyJRdk/);
 const guest=player.guest;
 player.hideMiniPlayer();
 assert.equal(player.miniVisible,false);
 assert.equal(player.webOpen,true,'minimization must not detach playback guest');
 await player.play();
 assert.equal(player.miniVisible,true);
 assert.equal(player.guest,guest,'reopen without restarting radio');
 player.pause();
 assert.equal(player.webOpen,false);
 assert.equal(player.miniVisible,false);
 assert.equal(opened.length,0);
});
test('when Electron webview unavailable, show visible iframe inside the same mini player',async()=>{
 const {player,opened}=mock('lofi',{webview:false});
 await player.play();
 assert.equal(player.guest.tagName,'IFRAME');
 assert.match(player.webUrl,/^https:\/\/www\.youtube\.com\/embed\/jfKfPfyJRdk/);
 assert.equal(player.guest.attributes.allow.includes('autoplay'),true);
 assert.equal(player.guest.attributes.referrerpolicy,'strict-origin-when-cross-origin');
 assert.equal(player.miniVisible,true);
 assert.equal(opened.length,0);
 player.toggle();assert.equal(player.webOpen,false);
});
test('failed Chromium guest falls back to iframe, never a tab',async()=>{
 const {player,opened}=mock();
 await player.play();
 const guest=player.guest;
 guest.events['did-fail-load']?.({errorCode:-105,errorDescription:'Network error'});
 assert.equal(player.guest.tagName,'IFRAME');
 assert.equal(player.webOpen,true);
 assert.equal(opened.length,0);
});
test('playlist station next updates mini player and preserves controls',async()=>{
 const {player,plugin}=mock();
 plugin.settings.v91Sound.customPlaylists=[{id:'radio',name:'My Radio',tracks:[
  {id:'jfKfPfyJRdk',name:'One'},{id:'FbxLnvWVSrk',name:'Two'}]}];
 plugin.settings.v91Sound.station='custom:radio';
 await player.play();assert.equal(player.label,'One');
 player.next();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(player.label,'Two');
 assert.match(player.webUrl,/FbxLnvWVSrk/);
 assert.equal(player.miniVisible,true);
});
test('local files still play and pause with HTMLAudioElement without embedded web guest',async()=>{
 const file={path:'Music/track.mp3',extension:'mp3',basename:'track'};
 const {player}=mock('my-music',{files:[file]});
 await player.play();
 assert.equal(player.playing,true);
 assert.equal(player.audio.src,'app://vault/Music/track.mp3');
 assert.equal(player.webOpen,false);
 player.pause();assert.equal(player.playing,false);
});
test('inline-only UI, no fallback to opening browser or Obsidian workspace tabs',()=>{
 assert.doesNotMatch(source,/getLeaf\(['"]tab['"]\)|window\.open\(|revealLeaf\(|setViewState\(\{type:['"]webviewer/);
 assert.match(source,/function writerV91HomeSoundscape/);
 assert.match(source,/v91-sound-mini-player/);
 assert.match(source,/is-collapsed/);
});

test('a nonresponsive Webview automatically falls back to the inline iframe',async()=>{
 const {player}=mock();
 await player.play();
 const guest=player.guest;
 assert.equal(guest.tagName,'WEBVIEW');
 // The live 9-second watchdog handles unavailable Electron Chromium guests.
 assert.match(source,/webview-timeout/);
 assert.match(source,/9000/);
 assert.equal(typeof guest.events['dom-ready'],'function');
 guest.events['dom-ready']();
 assert.equal(player.guest.tagName,'WEBVIEW','ready guests remain active');
 player.pause();
});

test('desktop Chromium guest receives volume updates and applies saved volume on dom-ready',async()=>{
 const {player,executed}=mock();
 await player.play();
 const web=player.guest;
 await player.setVolume(68);
 assert.equal(player.cfg.volume,68);
 assert.ok(executed.some(code=>code.includes('const volume=0.68;')));
 assert.ok(executed.some(code=>code.includes('video.volume=volume;')));
 assert.ok(executed.some(code=>code.includes('video.muted=volume===0;')));
 const count=executed.length;
 web.events['dom-ready']();
 assert.ok(executed.length>count,'dom-ready must restore chosen volume');
 const second=executed.length;
 web.events['did-navigate-in-page']();
 assert.ok(executed.length>second,'video navigation must restore volume');
 const last=executed.length;
 player.hideMiniPlayer();
 assert.equal(player.webOpen,true);
 await player.setVolume(22);
 assert.ok(executed.length>last,'volume works while mini player is minimized');
 assert.ok(executed.at(-1).includes('const volume=0.22;'));
 player.pause();
});
test('iframe YouTube JS API receives setVolume and mute/unMute commands on change and load',async()=>{
 const {player,messages}=mock('lofi',{webview:false});
 await player.play();
 const frame=player.guest;
 assert.match(frame.getAttribute('src'),/enablejsapi=1/);
 assert.ok(messages.some(entry=>entry.data.func==='setVolume'&&entry.data.args[0]===35));
 assert.ok(messages.every(entry=>entry.origin==='https://www.youtube.com'));
 await player.setVolume(0);
 assert.ok(messages.some(entry=>entry.data.func==='mute'));
 assert.equal(messages.at(-1).data.args[0],0);
 await player.setVolume(78);
 assert.ok(messages.some(entry=>entry.data.func==='unMute'));
 assert.equal(messages.at(-1).data.args[0],78);
 const count=messages.length;
 frame.events.load();
 assert.ok(messages.length>count,'iframe load must restore the chosen volume');
 player.pause();
});
test('new stations retain configured volume on a freshly loaded web guest',async()=>{
 const {player,plugin,executed}=mock();
 await player.setVolume(53);
 await player.play();
 const previous=player.guest;
 previous.events['dom-ready']();
 assert.ok(executed.some(x=>x.includes('const volume=0.53;')));
 await player.changeStation('jazz');
 const current=player.guest;
 assert.notEqual(previous,current);
 current.events['dom-ready']();
 assert.ok(executed.at(-1).includes('const volume=0.53;'));
 assert.equal(plugin.settings.v91Sound.volume,53);
 player.pause();
});
test('volume is enabled in both status bar and homepage and has mini player slider',()=>{
 assert.doesNotMatch(source,/volume\.disabled=!local|slider\.disabled=!local/);
 assert.match(source,/volume\.disabled=!this\.cfg\.enabled/);
 assert.match(source,/slider\.disabled=!player\.cfg\.enabled/);
 assert.match(source,/writer-v91-mini-volume/);
 assert.match(source,/writerV91SoundWebVolumeScript/);
 assert.match(source,/this\.syncRadioVolume\(\)/);
});
