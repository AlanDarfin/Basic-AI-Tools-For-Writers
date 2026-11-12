'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function fixture({language='en',guard}={}){
 const source=fs.readFileSync('src/v13/companion-toolkit.js','utf8');
 const context={writerUi:(pt,en)=>language==='pt'?pt:en};
 if(guard)context.writerCompanionEnabled=guard;
 const api=vm.runInNewContext(source+'\n({specs:WRITER_COMPANION_TOOLKIT_SPECS,speak:writerCompanionToolkitSpeech,status:writerCompanionToolkitSpeechStatus,control:writerCompanionToolkitControl})',context);
 const calls=[];
 const manager={sentences:[],isPlaying:false,isPaused:false,
  playText(text,title){calls.push(['play',text,title]);this.sentences=[text];this.isPlaying=true;this.isPaused=false;},
  pause(){calls.push(['pause']);this.isPaused=true;},resume(){calls.push(['resume']);this.isPaused=false;},
  stop(hide){calls.push(['stop',hide]);this.isPlaying=false;this.isPaused=false;}};
 const companion={settings:{enableTTS:true,ttsEngine:'offline'},ttsMgr:manager};
 const plugin={settings:{visibleModules:{tts:true},v12Toolkit:{enabled:true,integrations:true},finalSuite:{tts:{enabled:true,maxCharacters:12000}},companionCompatibility:{ttsProvider:'ahmed-toolkit',enabledById:{'ahmed-toolkit':true},allowToolkitOnline:false}},app:{plugins:{plugins:{'ahmed-toolkit':companion}}}};
 return {api,calls,manager,companion,plugin};
}

test('descriptors expose audited native commands, views and safe persistence methods',()=>{
 const {api}=fixture(),toolkit=api.specs.find(item=>item.id==='ahmed-toolkit'),visual=api.specs.find(item=>item.id==='visual-kit');
 assert.equal(toolkit.source.sha,'70506a95a9059aa86da1c7688ea24f8df3dd4899');
 assert.equal(visual.source.sha,'e5766c85a36c7895bf775ae597ec05f8edb88217');
 assert.equal(toolkit.source.license,'MIT');assert.equal(visual.source.license,'MIT');
 assert.equal(toolkit.saveMethod,'saveSettings');assert.equal(visual.saveMethod,'persist');
 assert.equal(toolkit.views.length,0);assert.equal(visual.views[0].type,'visual-kit-html-note');assert.equal(visual.mobile,false);
 assert.ok(toolkit.commands.some(item=>item.id==='ahmed-toolkit:flowkit-tts-show-player'));
 assert.ok(visual.commands.some(item=>item.id==='visual-kit:annotate-image'&&item.editor));
 assert.equal(visual.settings.find(item=>item.key==='ribbon').afterSave,'updateRibbon');
 for(const spec of api.specs){
  assert.ok(spec.description.pt&&spec.description.en&&spec.notes.pt&&spec.notes.en);
  for(const action of [...spec.commands,...spec.views])assert.ok(action.pt&&action.en);
  for(const setting of spec.settings){
   assert.ok(setting.pt&&setting.en);assert.ok(!/api|secret|token|password|index/i.test(setting.key));
   assert.ok(['boolean','number','select'].includes(setting.type));
   for(const option of setting.options||[])assert.ok(option.pt&&option.en&&typeof option.value==='string');
  }
 }
});

test('speech sends only the explicit passage to the installed manager without changing settings',()=>{
 const h=fixture(),before=JSON.stringify(h.plugin.settings);
 const handle=h.api.speak(h.plugin,'  Explicit passage.  ','Current note');
 assert.deepEqual(h.calls,[['play','Explicit passage.','Current note']]);
 assert.equal(JSON.stringify(h.plugin.settings),before);assert.equal(handle.provider,'ahmed-toolkit');
 const status=h.api.status(h.plugin,handle);assert.equal(status.available,true);assert.equal(status.enabled,true);assert.equal(status.owned,true);assert.equal(status.speaking,true);
 assert.equal(h.api.control(h.plugin,handle,'pause'),true);assert.equal(h.api.status(h.plugin,handle).paused,true);
 assert.equal(h.api.control(h.plugin,handle,'resume'),true);assert.equal(h.api.status(h.plugin,handle).paused,false);
 assert.equal(h.api.control(h.plugin,handle,'stop'),true);assert.deepEqual(h.calls.at(-1),['stop',true]);
 assert.equal(h.api.control(h.plugin,handle,'stop'),false);assert.equal(h.api.status(h.plugin,handle).owned,false);
});

test('live integration, module, provider and companion switches prevent any playback',()=>{
 const changes=[
  h=>h.plugin.settings.v12Toolkit.enabled=false,
  h=>h.plugin.settings.v12Toolkit.integrations=false,
  h=>h.plugin.settings.visibleModules.tts=false,
  h=>h.plugin.settings.finalSuite.tts.enabled=false,
  h=>h.plugin.settings.companionCompatibility.enabledById['ahmed-toolkit']=false,
  h=>h.plugin.settings.companionCompatibility.ttsProvider='basic',
  h=>delete h.plugin.settings.companionCompatibility.ttsProvider,
  h=>h.companion.settings.enableTTS=false,
  h=>delete h.plugin.app.plugins.plugins['ahmed-toolkit'],
  h=>delete h.manager.stop
 ];
 for(const change of changes){const h=fixture();change(h);assert.throws(()=>h.api.speak(h.plugin,'Do not send.','Note'));assert.equal(h.calls.length,0);}
 const h=fixture({guard:()=>false});assert.throws(()=>h.api.speak(h.plugin,'Do not send.','Note'));assert.equal(h.calls.length,0);
});

test('Toolkit online speech requires its own explicit permission, including when Basic online is allowed',()=>{
 const h=fixture();h.companion.settings.ttsEngine='online';h.plugin.settings.finalSuite.tts.allowOnline=true;
 assert.throws(()=>h.api.speak(h.plugin,'Private passage.','Note'),/Google Translate/);assert.equal(h.calls.length,0);
 h.plugin.settings.companionCompatibility.allowToolkitOnline=true;
 const handle=h.api.speak(h.plugin,'Approved passage.','Note');assert.equal(h.api.status(h.plugin,handle).onlineAllowed,true);assert.equal(h.calls.length,1);
});

test('status inspection neither reads notes nor starts, pauses or stops native audio',()=>{
 const h=fixture();h.manager.isPlaying=true;
 h.plugin.app.vault={read(){throw Error('Unexpected note access');}};
 const status=h.api.status(h.plugin);assert.equal(status.available,true);assert.equal(status.owned,false);assert.equal(status.speaking,false);
 assert.equal(h.api.control(h.plugin,{provider:'ahmed-toolkit'},'stop'),false);assert.equal(h.calls.length,0);
});

test('controls cannot affect replacement plugin instances or subsequent native Toolkit sessions',()=>{
 for(const replacement of ['plugin','manager','sentences']){
  const h=fixture(),handle=h.api.speak(h.plugin,'Basic passage.','Note');
  if(replacement==='plugin')h.plugin.app.plugins.plugins['ahmed-toolkit']={settings:h.companion.settings,ttsMgr:h.manager};
  if(replacement==='manager')h.companion.ttsMgr={...h.manager};
  if(replacement==='sentences')h.manager.sentences=['Native playback'];
  assert.equal(h.api.status(h.plugin,handle).owned,false);assert.equal(h.api.control(h.plugin,handle,'stop'),false);assert.equal(h.calls.length,1);
 }
 const h=fixture(),handle=h.api.speak(h.plugin,'Basic passage.','Note');delete h.plugin.app.plugins.plugins['ahmed-toolkit'];
 assert.equal(h.api.control(h.plugin,handle,'stop'),false);assert.equal(h.calls.length,1);
});

test('new Basic sessions retire older handles and handles cannot cross Basic instances',()=>{
 const h=fixture(),old=h.api.speak(h.plugin,'First.','Note'),current=h.api.speak(h.plugin,'Second.','Note');
 assert.equal(h.api.control(h.plugin,old,'stop'),false);
 assert.equal(h.api.control({...h.plugin},current,'stop'),false);
 assert.equal(h.api.control(h.plugin,current,'stop'),true);assert.equal(h.calls.length,3);
});

test('disabling a module blocks pause and resume while allowing cleanup of its own active session',()=>{
 const h=fixture(),handle=h.api.speak(h.plugin,'Basic passage.','Note');h.plugin.settings.visibleModules.tts=false;
 assert.equal(h.api.control(h.plugin,handle,'pause'),false);assert.equal(h.api.control(h.plugin,handle,'resume'),false);
 assert.equal(h.api.control(h.plugin,handle,'stop'),true);assert.deepEqual(h.calls.at(-1),['stop',true]);
});

test('finished native playback does not cancel unrelated global speech through Toolkit stop',()=>{
 const h=fixture(),handle=h.api.speak(h.plugin,'Basic passage.','Note');h.manager.isPlaying=false;
 assert.equal(h.api.control(h.plugin,handle,'stop'),true);assert.equal(h.calls.length,1);
 assert.equal(h.api.status(h.plugin,handle).owned,false);
});

test('empty or oversized passages fail before playback and messages are bilingual',()=>{
 const h=fixture();assert.throws(()=>h.api.speak(h.plugin,'   ','Note'),/no text/);
 h.plugin.settings.finalSuite.tts.maxCharacters=4;
 assert.throws(()=>h.api.speak(h.plugin,'Too long.','Note'),/limit/);assert.equal(h.calls.length,0);
 const pt=fixture({language:'pt'});assert.throws(()=>pt.api.speak(pt.plugin,'','Nota'),/Não há texto/);
});
