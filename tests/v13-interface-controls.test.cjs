'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {writerV136BindProjectTabs:bind}=vm.runInNewContext(
 fs.readFileSync('src/v13/ui-foundation.js','utf8')+'\n({writerV136BindProjectTabs})');

function tabs(direction='ltr'){
 const handlers={},actions=[];
 const buttons=Array.from({length:4},(_,index)=>({
  index,disabled:index===1,focus(){actions.push(['focus',index]);},click(){actions.push(['click',index]);},
  scrollIntoView(options){actions.push(['scroll',index,options.inline]);}
 }));
 const strip={dataset:{},ownerDocument:{defaultView:{getComputedStyle:()=>({direction})}},
  addEventListener(name,callback){assert.equal(handlers[name],undefined);handlers[name]=callback;},
  querySelectorAll(selector){assert.equal(selector,'button[role="tab"]:not(:disabled)');return buttons.filter(button=>!button.disabled);}};
 bind(strip);bind(strip);
 const press=(key,index=0,modifiers={})=>{
  let prevented=false;
  handlers.keydown({key,target:{closest:()=>buttons[index]},preventDefault(){prevented=true;},...modifiers});
  return prevented;
 };
 return {strip,buttons,actions,press};
}
test('project keyboard navigation skips disabled tabs and keeps the activated tab visible',()=>{
 const h=tabs();assert.equal(h.press('ArrowRight'),true);
 assert.deepEqual(h.actions,[['focus',2],['click',2],['scroll',2,'nearest']]);
 h.actions.length=0;h.press('ArrowLeft');assert.deepEqual(h.actions[1],['click',3]);
 h.actions.length=0;h.press('Home',3);assert.deepEqual(h.actions[1],['click',0]);
 h.actions.length=0;h.press('End');assert.deepEqual(h.actions[1],['click',3]);
});
test('project tabs respect right-to-left order and leave modified or unrelated keys alone',()=>{
 const h=tabs('rtl');h.press('ArrowRight');assert.deepEqual(h.actions[1],['click',3]);
 for(const modifier of [{ctrlKey:true},{altKey:true},{metaKey:true}])assert.equal(h.press('ArrowLeft',0,modifier),false);
 assert.equal(h.press('Enter'),false);assert.equal(h.press('ArrowDown'),false);
 const before=h.actions.length;assert.equal(h.press('End',99),false);assert.equal(h.actions.length,before);
});

class Element{
 constructor(tag,options={}){
  this.tag=tag;this.cls=options.cls||'';this.attributes={...options.attr};this.children=[];this.events={};this.isConnected=true;
  this.classList={toggle:()=>{}};
 }
 createEl(tag,options){const element=new Element(tag,options);this.children.push(element);return element;}
 createDiv(options){return this.createEl('div',options);}
 empty(){this.children=[];}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,callback){this.events[name]=callback;}
 toggleClass(){}
}
function sound(station='lofi',count=0){
 const {WriterV91SoundPlayer}=vm.runInNewContext(fs.readFileSync('src/v9/soundscapes.js','utf8')+'\n({WriterV91SoundPlayer})',{
  writerUi:(_pt,en)=>en,require:()=>({setIcon:(element,icon)=>{element.icon=icon;}}),console
 });
 const files=Array.from({length:count},(_,index)=>({path:'Music/'+index+'.mp3',basename:'Track '+index,extension:'mp3'}));
 const plugin={settings:{v91Sound:{enabled:true,station,volume:35,musicFolder:'Music',customPlaylists:station==='custom:mix'?
  [{id:'mix',name:'Mix',tracks:[{id:'aaaaaaaaaaa',name:'One'},{id:'bbbbbbbbbbb',name:'Two'}]}]:[]}},
  app:{vault:{getFiles:()=>files}},saveSettings:async()=>{}};
 const player=new WriterV91SoundPlayer(plugin);player.status=new Element('div');player.renderStatus();
 const control=cls=>player.status.children.find(element=>element.cls===cls);
 return {plugin,player,play:control('writer-v136-sound-play'),next:control('writer-v136-sound-next'),mini:control('writer-v136-sound-mini')};
}
test('single-track radio status hides unavailable actions while retaining named playback',()=>{
 const h=sound();assert.equal(h.next.icon,'skip-forward');assert.equal(h.next.hidden,true);assert.equal(h.mini.hidden,true);
 assert.equal(h.play.attributes['aria-label'],'Start in mini player');assert.equal(h.play.title,'Start in mini player');
 h.player.guest={isConnected:true};h.player.webUrl='existing guest';h.player.emit();
 assert.equal(h.mini.hidden,false);assert.equal(h.mini.disabled,false);assert.equal(h.play.attributes['aria-label'],'Stop radio');
});
test('local music and custom radio playlists retain their visible next-track action',()=>{
 for(const h of [sound('my-music',2),sound('custom:mix')]){
  assert.equal(h.next.hidden,false);assert.equal(h.next.disabled,false);assert.equal(h.next.icon,'skip-forward');
  let advances=0;h.player.next=()=>{advances++;};h.next.events.click();assert.equal(advances,1);
  h.plugin.settings.v91Sound.enabled=false;h.player.emit();assert.equal(h.play.disabled,true);assert.equal(h.next.disabled,true);
 }
 const one=sound('my-music',1);assert.equal(one.next.hidden,true);assert.equal(one.mini.hidden,true);
});
