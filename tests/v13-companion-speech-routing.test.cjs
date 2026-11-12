'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sources=['src/v3/final-suite.js','src/v10/speech-accessibility.js','src/v13/companion-toolkit.js','src/v13/companion-bridge.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.children=[];this.events={};}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 addEventListener(name,callback){this.events[name]=callback;}
}
function harness(){
 const browserCalls=[],utterances=[],toolkitCalls=[],notices=[],modals=[],commands=new Map(),cleanups=[],domEvents=[];
 const speech={cancel:()=>browserCalls.push('cancel'),pause:()=>browserCalls.push('pause'),resume:()=>browserCalls.push('resume'),
  speak:utterance=>{browserCalls.push('speak');utterances.push(utterance);},getVoices:()=>[{voiceURI:'device-en',name:'Device voice',lang:'en-US'}]};
 class Utterance{constructor(text){this.text=text;}}
 class TFile{}
 class Setting{
  setName(){return this;}setDesc(){return this;}
  add(register){const control={addOption(){return this;},setValue(){return this;},setDisabled(){return this;},setButtonText(){return this;},setLimits(){return this;},setDynamicTooltip(){return this;},onChange(){return this;},onClick(){return this;}};register(control);return this;}
  addDropdown(fn){return this.add(fn);}addToggle(fn){return this.add(fn);}addButton(fn){return this.add(fn);}addText(fn){return this.add(fn);}addSlider(fn){return this.add(fn);}
 }
 const sandbox={console:{warn(){},error(){}},speechSynthesis:speech,SpeechSynthesisUtterance:Utterance,Setting,TFile,MarkdownView:class{},
  Notice:class{constructor(value){notices.push(value);}},Modal:class{constructor(){this.contentEl=new Element();modals.push(this);}setTitle(value){this.title=value;}open(){this.onOpen?.();}},
  document:{querySelectorAll:()=>[]},navigator:{language:'en-US'},writerUi:(pt,en)=>en,
  writerMaskMarkdown:value=>value,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
  writerV12On:(plugin,id)=>plugin.settings.v12Toolkit?.enabled!==false&&plugin.settings.v12Toolkit?.[id]!==false,
  writerV12Config:plugin=>plugin.settings.v12Toolkit,Platform:{isMobile:false},
  WebSocket:class{constructor(){throw Error('Unexpected network transport');}}};
 const api=vm.runInNewContext(sources+'\n({WriterFinalFeatures,writerFinalMerge,writerV107SpeechConfig,writerV107SpeechStart,writerV107SpeechPanel,writerV107SpeechRegister,writerCompanionConfig,writerCompanionSpeechStart,writerCompanionSpeechControl})',sandbox);
 const file=Object.assign(new TFile(),{path:'Book/Chapter.md',basename:'Chapter',extension:'md'});
 const editor={getSelection:()=> 'Selected writing.',getValue:()=> 'Complete chapter.'},note={view:{file,editor}};
 const manager={sentences:[],isPlaying:false,isPaused:false,
  playText(text,title){this.sentences=[text];this.isPlaying=true;toolkitCalls.push(['play',text,title]);},
  pause(){this.isPaused=true;toolkitCalls.push(['pause']);},resume(){this.isPaused=false;toolkitCalls.push(['resume']);},
  stop(){this.isPlaying=false;toolkitCalls.push(['stop']);speech.cancel();}};
 const plugin={settings:{visibleModules:{},v12Toolkit:{enabled:true,integrations:true},companionCompatibility:{},finalSuite:{}},
  _writerV107SpeechId:0,
  app:{workspace:{activeLeaf:note,getActiveFile:()=>file,getActiveViewOfType:()=>note.view,getLeavesOfType:type=>type==='markdown'?[note]:[],
   containerEl:{ownerDocument:{defaultView:{speechSynthesis:speech,SpeechSynthesisUtterance:Utterance}}}},
   vault:{cachedRead:async()=> 'Chapter on disk.'},plugins:{plugins:{'ahmed-toolkit':{settings:{enableTTS:true,ttsEngine:'offline'},ttsMgr:manager}}}},
  addCommand:command=>commands.set(command.id,command),register:callback=>cleanups.push(callback),
  registerDomEvent:(element,name,callback)=>domEvents.push({element,name,callback}),saveSettings:async()=>{}};
 api.writerFinalMerge(plugin);api.writerV107SpeechConfig(plugin.settings);api.writerCompanionConfig(plugin);
 const final=new api.WriterFinalFeatures(plugin);plugin.writerFinalFeatures=final;
 return {api,plugin,final,speech,browserCalls,utterances,toolkitCalls,notices,modals,commands,cleanups,domEvents,manager,
  selectToolkit:()=>{api.writerCompanionConfig(plugin).ttsProvider='ahmed-toolkit';},
  replaceWithNative:()=>{manager.sentences=['An independent native reading'];manager.isPlaying=true;},
  button:text=>{const find=el=>el.tag==='button'&&el.text===text?el:el.children.map(find).find(Boolean);return find(modals.at(-1).contentEl);}};
}

test('final speech stop/pause/resume never control a native Toolkit reading that replaced its owned session',async()=>{
 const h=harness();h.selectToolkit();await h.final.speakActive();
 assert.deepEqual(h.toolkitCalls,[['play','Selected writing.','Chapter']]);assert.equal(h.browserCalls.length,0);
 h.replaceWithNative();h.final.stop();h.final.pause();h.final.resume();
 assert.equal(h.plugin._writerCompanionSpeechHandle,null);
 assert.deepEqual(h.toolkitCalls,[['play','Selected writing.','Chapter']]);assert.equal(h.browserCalls.length,0);
});

test('final speech stops its own Toolkit session once without an extra global cancellation',async()=>{
 const h=harness();h.selectToolkit();await h.final.speakActive();h.final.stop();h.final.stop();
 assert.deepEqual(h.toolkitCalls,[['play','Selected writing.','Chapter'],['stop']]);assert.deepEqual(h.browserCalls,['cancel']);
});

test('local panel and command leave independent native playback alone when no local session is active',()=>{
 for(const control of ['panel','command']){
  const h=harness();h.api.writerV107SpeechRegister(h.plugin);h.replaceWithNative();
  if(control==='panel'){
   h.api.writerV107SpeechPanel(h.plugin);for(const text of ['Stop','Pause','Resume'])h.button(text).events.click();
  }else h.commands.get('v107-tts-stop').callback();
  assert.equal(h.browserCalls.length,0,control);assert.equal(h.toolkitCalls.length,0,control);
 }
});

test('local plugin unload does not cancel independent native Toolkit playback',()=>{
 const h=harness();h.api.writerV107SpeechRegister(h.plugin);h.replaceWithNative();
 for(const cleanup of h.cleanups)cleanup();
 assert.equal(h.browserCalls.length,0);assert.equal(h.toolkitCalls.length,0);
});

test('local controls and unload cancel an active Basic local session and invalidate queued chunks',()=>{
 for(const control of ['panel','command','unload']){
  const h=harness();h.api.writerV107SpeechRegister(h.plugin);
  assert.equal(h.api.writerV107SpeechStart(h.plugin,'Local writing.'),true);assert.equal(h.plugin._writerV107SpeechActive,true);
  h.browserCalls.length=0;const pending=h.utterances[0];
  if(control==='panel'){h.api.writerV107SpeechPanel(h.plugin);h.button('Stop').events.click();}
  if(control==='command')h.commands.get('v107-tts-stop').callback();
  if(control==='unload')for(const cleanup of h.cleanups)cleanup();
  assert.deepEqual(h.browserCalls,['cancel'],control);assert.equal(h.plugin._writerV107SpeechActive,false,control);
  pending.onend();assert.deepEqual(h.browserCalls,['cancel'],control+' cannot revive a cancelled queue');
 }
});

test('local end/error releases ownership before later native playback and unload',()=>{
 for(const event of ['end','error']){
  const h=harness();h.api.writerV107SpeechRegister(h.plugin);h.api.writerV107SpeechStart(h.plugin,'Local writing.');
  if(event==='end')h.utterances[0].onend();else h.utterances[0].onerror({error:'interrupted'});
  assert.equal(h.plugin._writerV107SpeechActive,false,event);h.browserCalls.length=0;h.replaceWithNative();
  for(const cleanup of h.cleanups)cleanup();h.final.stop();
  assert.equal(h.browserCalls.length,0,event);assert.equal(h.toolkitCalls.length,0,event);
 }
});

test('final system reader stops its own Web Speech session and ignores repeated stop after completion',async()=>{
 const h=harness();await h.final.speakActive();assert.equal(h.final.speaking,true);assert.equal(h.utterances.length,1);
 h.browserCalls.length=0;h.final.stop();assert.deepEqual(h.browserCalls,['cancel']);assert.equal(h.final.speaking,false);
 h.final.stop();assert.deepEqual(h.browserCalls,['cancel']);
 const completed=harness();await completed.final.speakActive();completed.utterances[0].onend();assert.equal(completed.final.speaking,false);
 completed.browserCalls.length=0;completed.replaceWithNative();completed.final.stop();assert.equal(completed.browserCalls.length,0);
});

test('local and final launchers route the chosen provider without falling back around module or online permission gates',async()=>{
 for(const launcher of ['local','final'])for(const gate of ['module','suite','integration','online']){
  const h=harness();h.selectToolkit();
  if(gate==='module')h.plugin.settings.visibleModules.tts=false;
  if(gate==='suite')h.plugin.settings.finalSuite.tts.enabled=false;
  if(gate==='integration')h.plugin.settings.v12Toolkit.integrations=false;
  if(gate==='online')h.plugin.app.plugins.plugins['ahmed-toolkit'].settings.ttsEngine='online';
  if(launcher==='local')h.api.writerV107SpeechStart(h.plugin,'Private writing.');else await h.final.speakActive();
  assert.equal(h.toolkitCalls.length,0,launcher+' '+gate);assert.equal(h.browserCalls.length,0,launcher+' '+gate);
 }
 const basic=harness();assert.equal(basic.api.writerV107SpeechStart(basic.plugin,'Local writing.'),true);
 assert.equal(basic.toolkitCalls.length,0);assert.deepEqual(basic.browserCalls,['cancel','speak']);
 const toolkit=harness();toolkit.selectToolkit();assert.equal(toolkit.api.writerV107SpeechStart(toolkit.plugin,'Toolkit writing.'),true);
 assert.deepEqual(toolkit.toolkitCalls,[['play','Toolkit writing.','Basic speech']]);assert.equal(toolkit.browserCalls.length,0);
});

test('review interaction guard remains active without starting or controlling speech',()=>{
 const h=harness(),guard=[];h.plugin.writerReviewInteractionGuard={captureScroll:()=>guard.push('capture'),pause:duration=>guard.push(duration)};
 h.api.writerV107SpeechRegister(h.plugin);
 const pointer=h.domEvents.find(item=>item.name==='pointerdown');assert.ok(pointer);
 pointer.callback({target:{closest:()=>true}});assert.deepEqual(guard,['capture',1200]);
 assert.equal(h.browserCalls.length,0);assert.equal(h.toolkitCalls.length,0);
});
