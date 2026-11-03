'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v9/soundscapes.js','utf8');
class FakeAudio{
 constructor(){this.src='';this.volume=0;this.events={};this.paused=true;}
 addEventListener(name,cb){this.events[name]=cb;}
 async play(){this.paused=false;this.events.play?.();}
 pause(){this.paused=true;this.events.pause?.();}
 removeAttribute(attr){if(attr==='src')this.src='';}
 load(){}
}
function build(station='lofi',files=[]){
 const leaves=[],urls=[],revealed=[];
 const workspace={
  getLeaf(){const leaf={state:{type:'empty',state:{}},getViewState(){return this.state;},
   async setViewState(state){this.state=state;urls.push(state.state.url);},
   detach(){const index=leaves.indexOf(this);if(index>=0)leaves.splice(index,1);this.state={type:'empty',state:{}};}};leaves.push(leaf);return leaf;},
  getLeavesOfType(type){return leaves.filter(l=>l.state.type===type);},
  async revealLeaf(leaf){revealed.push(leaf);}
 };
 const plugin={settings:{v91Sound:{station,enabled:true,volume:25,customPlaylists:[],shuffle:false,musicFolder:''}},
  app:{isMobile:false,workspace,vault:{getResourcePath:f=>'app://vault/'+f.path,getFiles:()=>files}},
  async saveSettings(){}};
 const ctx={console,URL,Audio:FakeAudio,Notice:class{},
  writerUi:(pt,en)=>en,Modal:class{},Setting:class{},window:{open:url=>revealed.push(url)}};
 const Player=vm.runInNewContext(source+'\nWriterV91SoundPlayer',ctx);
 return {player:new Player(plugin),workspace,leaves,urls,revealed,plugin};
}
test('radio opens YouTube watch page in native Web Viewer, not hidden iframe',async()=>{
 const {player,leaves,urls,revealed}=build();
 await player.play();
 assert.equal(leaves.length,1);
 assert.equal(urls[0],'https://www.youtube.com/watch?v=jfKfPfyJRdk&autoplay=1');
 assert.equal(player.webOpen,true);
 assert.equal(player.playing,false,'a tab opening is not proof of playback');
 assert.equal(revealed.length,1);
 await player.play();assert.equal(leaves.length,1);
 assert.doesNotMatch(source,/youtube-nocookie\.com\/embed|ensureFrame\(/);
 player.pause();assert.equal(leaves.length,0);
});
test('playlist next reuses tab and navigates to second video',async()=>{
 const {player,plugin,leaves,urls}=build();
 plugin.settings.v91Sound.customPlaylists=[{id:'test',name:'Test',tracks:[{id:'jfKfPfyJRdk',name:'One'},{id:'FbxLnvWVSrk',name:'Two'}]}];
 plugin.settings.v91Sound.station='custom:test';
 await player.play();player.next();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(leaves.length,1);assert.equal(urls.length,2);assert.match(urls[1],/FbxLnvWVSrk/);
});
test('vault audio uses HTMLAudioElement for play and pause',async()=>{
 const file={path:'Music/track.mp3',extension:'mp3',basename:'track'};
 const {player,leaves}=build('my-music',[file]);
 await player.play();
 assert.equal(player.playing,true);assert.equal(player.audio.src,'app://vault/Music/track.mp3');
 assert.equal(leaves.length,0);player.pause();assert.equal(player.playing,false);
});

test('unavailable native Web Viewer gracefully falls back to URL opening',async()=>{
 const {player,workspace,revealed}=build();
 workspace.getLeaf=()=>({async setViewState(){throw new Error('webviewer disabled');}});
 await player.play();
 assert.equal(player.webOpen,false);
 assert.equal(player.playing,false);
 assert.ok(revealed.some(item=>typeof item==='string'&&item.startsWith('https://www.youtube.com/watch?v=')));
});
