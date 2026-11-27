'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/v3/core.js','src/writing/final-suite.js','src/integrations/speech-accessibility.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function fixture(provider='system'){
 const utterances=[],edge=[],toolkit=[],states=[],commands=new Map(),cleanups=[];let reads=0,read=async()=> 'Current note.',active,leaves=[];
 class TFile{constructor(path){this.path=path;this.basename=path.replace(/.*\//,'').replace(/\.md$/,'');this.extension='md';this.stat={mtime:1,size:20};}}
 const file=active=new TFile('Chapter.md'),files=new Map([[file.path,file]]);
 const speech={speak:item=>utterances.push(item),cancel(){},pause(){},resume(){},getVoices:()=>[]};
 const sandbox={console,Date,MarkdownView:class{},TFile,EditorView:{},writerUi:(_pt,en)=>en,lfMsg:(_pt,en)=>en,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
  speechSynthesis:speech,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},WebSocket:class{},WRITER_EDGE_VOICES:{'en-US':'Test voice'},
  document:{querySelectorAll:()=>[]},navigator:{language:'en-US'},Notice:class{},
  writerCompanionConfig:plugin=>plugin.settings.companionCompatibility,
  writerCompanionSpeechStart:(_plugin,text)=>{toolkit.push(text);return true;},writerCompanionSpeechControl:()=>false};
 const api=vm.runInNewContext(source+'\n({WriterFinalFeatures,writerFinalMerge,writerV107SpeechConfig,writerV107SpeechStart,writerV107SpeechRegister,writerV107SpeechReadNote})',sandbox);
 const workspace={getActiveFile:()=>active,getActiveViewOfType:()=>workspace.activeLeaf?.view||null,getLeavesOfType:type=>type==='markdown'?leaves:[],getMostRecentLeaf:()=>workspace.activeLeaf,on:()=>({}),containerEl:{ownerDocument:{defaultView:{speechSynthesis:speech,SpeechSynthesisUtterance:sandbox.SpeechSynthesisUtterance}}}};
 const plugin={settings:{visibleModules:{},finalSuite:{},companionCompatibility:{ttsProvider:provider==='toolkit'?'ahmed-toolkit':'basic'}},
  app:{workspace,vault:{cachedRead:file=>{reads++;return read(file);},getAbstractFileByPath:path=>files.get(path)||null,on:()=>({})},plugins:{plugins:{'ahmed-toolkit':{}}}},
  addCommand:command=>commands.set(command.id,command),registerEvent(){},register:callback=>cleanups.push(callback),registerDomEvent(){},saveSettings:async()=>{}};
 api.writerFinalMerge(plugin);api.writerV107SpeechConfig(plugin.settings);
 plugin.settings.finalSuite.tts.engine=provider==='edge'?'edge':'system';plugin.settings.finalSuite.tts.allowOnline=provider==='edge';
 const reader=plugin.writerFinalFeatures=new api.WriterFinalFeatures(plugin);
 reader.onTtsState=(...args)=>states.push(args);
 reader.edgePlayer={start:async text=>edge.push(text),stop(){},pause(){},resume(){}};
 return {api,plugin,reader,workspace,file,files,utterances,edge,toolkit,states,commands,cleanups,
  reads:()=>reads,read:fn=>{read=fn;},active:file=>{active=file;},newFile:path=>new TFile(path),
  editor(text){const view={file,editor:{getValue:()=>text,getSelection:()=>''}};const leaf={view};leaves=[leaf];workspace.activeLeaf=leaf;return view;},
  audio:()=>[...utterances.map(item=>item.text),...edge,...toolkit]};
}

test('late disk reads cannot start any provider after Stop or disabling speech',async()=>{
 for(const provider of ['system','edge','toolkit'])for(const cancel of [h=>h.reader.stop(),h=>{h.plugin.settings.visibleModules.tts=false;},h=>{h.plugin.settings.finalSuite.tts.enabled=false;}]){
  const h=fixture(provider),pending=deferred();h.read(()=>pending.promise);
  const reading=h.reader.speakActive();assert.equal(h.reads(),1);cancel(h);pending.resolve('Cancelled content.');
  await reading;assert.deepEqual(h.audio(),[],provider);
 }
});

test('a changed note, file identity or file content invalidates the pending read',async()=>{
 for(const change of [h=>h.active(h.newFile('Other.md')),h=>{h.file.path='Moved.md';},h=>h.files.delete(h.file.path),
  h=>h.files.set(h.file.path,h.newFile(h.file.path)),h=>{h.file.stat.mtime++;}]){
  const h=fixture(),pending=deferred();h.read(()=>pending.promise);const reading=h.reader.speakActive();change(h);pending.resolve('Old note.');
  await reading;assert.deepEqual(h.audio(),[]);
 }
});

test('provider, permission and voice changes cannot reuse an earlier read request',async()=>{
 for(const change of [h=>{h.plugin.settings.companionCompatibility.ttsProvider='ahmed-toolkit';},
  h=>{h.plugin.settings.finalSuite.tts.voice='new voice';},h=>{h.plugin.settings.finalSuite.tts.allowOnline=false;},
  h=>{h.plugin.settings.finalSuite.tts={...h.plugin.settings.finalSuite.tts};}]){
  const h=fixture('edge'),pending=deferred();h.read(()=>pending.promise);const reading=h.reader.speakActive();change(h);pending.resolve('Earlier choice.');
  await reading;assert.deepEqual(h.audio(),[]);
 }
});

test('a replacement Toolkit instance cannot inherit a pending speech request',async()=>{
 const h=fixture('toolkit'),pending=deferred();h.read(()=>pending.promise);const reading=h.reader.speakActive();
 h.plugin.app.plugins.plugins['ahmed-toolkit']={};pending.resolve('Old instance.');await reading;assert.deepEqual(h.audio(),[]);
});

test('the newest Read wins regardless of the order disk reads complete',async()=>{
 for(const newestFirst of [false,true]){
  const h=fixture(),a=deferred(),b=deferred();let count=0;h.read(()=>++count===1?a.promise:b.promise);
  const first=h.reader.speakActive(),second=h.reader.speakActive();
  if(newestFirst){b.resolve('Newest note.');await second;a.resolve('Obsolete note.');await first;}
  else {a.resolve('Obsolete note.');await first;assert.deepEqual(h.audio(),[]);b.resolve('Newest note.');await second;}
  assert.deepEqual(h.audio(),['Newest note.']);
 }
});

test('late failures after cancellation are ignored while a current read failure is still reported',async()=>{
 const h=fixture(),pending=deferred();h.read(()=>pending.promise);const reading=h.reader.speakActive();h.reader.stop();pending.reject(Error('Old failure'));
 assert.equal(await reading,false);assert.deepEqual(h.audio(),[]);
 const current=fixture();current.read(async()=>{throw Error('Current failure');});await assert.rejects(current.reader.speakActive(),/Current failure/);
});

test('unload cancels pending reads and captured commands cannot restart the disposed reader',async()=>{
 const h=fixture(),pending=deferred();h.reader.register();h.read(()=>pending.promise);const reading=h.reader.speakActive();
 for(const cleanup of h.cleanups)cleanup();pending.resolve('Unloaded note.');await reading;
 await h.commands.get('writer-tts-read').callback();assert.equal(h.reads(),1);assert.deepEqual(h.audio(),[]);
});

test('a module disabled by audio focus is rechecked immediately before transport',async()=>{
 const h=fixture('edge');h.reader.prepareAudioFocus=()=>{h.plugin.settings.visibleModules.tts=false;};
 await h.reader.speakActive();assert.deepEqual(h.audio(),[]);
});

test('disabling speech between chunks prevents the next chunk from being queued',async()=>{
 const h=fixture();h.plugin.settings.finalSuite.tts.chunkSize=100;h.read(async()=> 'A sentence. '.repeat(50));
 await h.reader.speakActive();assert.equal(h.utterances.length,1);h.plugin.settings.visibleModules.tts=false;h.utterances[0].onend();
 assert.equal(h.utterances.length,1);assert.equal(h.reader.speaking,false);
});

test('an obsolete online failure does not overwrite a newer reading state',async()=>{
 const h=fixture('edge'),pending=deferred(),started=deferred();let count=0;
 h.reader.edgePlayer.start=text=>{h.edge.push(text);if(++count===1){started.resolve();return pending.promise;}return Promise.resolve();};
 const first=h.reader.speakActive();await started.promise;h.read(async()=> 'New online text.');await h.reader.speakActive();
 pending.reject(Error('Old online failure'));await first;
 assert.equal(h.states.some(([state])=>state==='error'),false);
});

test('local note commands respect Stop, note changes, preferences and unload after disk reads',async()=>{
 for(const cancel of [h=>h.commands.get('v107-tts-stop').callback(),h=>h.reader.stop(),h=>h.active(h.newFile('Other.md')),
  h=>{h.plugin.settings.v107Speech.enabled=false;},h=>{h.plugin.settings.companionCompatibility.ttsProvider='ahmed-toolkit';},h=>{for(const cleanup of h.cleanups)cleanup();}]){
  const h=fixture(),pending=deferred();h.api.writerV107SpeechRegister(h.plugin);h.read(()=>pending.promise);
  const reading=h.commands.get('v107-local-tts-note').callback();cancel(h);pending.resolve('Stale local note.');await reading;
  assert.deepEqual(h.audio(),[]);
 }
});

test('local note speech uses an existing unsaved editor buffer rather than its disk cache',async()=>{
 const h=fixture();h.editor('Unsaved prose.');await h.api.writerV107SpeechReadNote(h.plugin);
 assert.equal(h.reads(),0);assert.deepEqual(h.audio(),['Unsaved prose.']);
});

test('a selection read supersedes a pending final note read',async()=>{
 const h=fixture(),pending=deferred();h.read(()=>pending.promise);const reading=h.reader.speakActive();
 h.api.writerV107SpeechStart(h.plugin,'Selected passage.');pending.resolve('Stale final note.');await reading;
 assert.deepEqual(h.audio(),['Selected passage.']);
});

test('two local reads cannot queue obsolete disk content after the newest one',async()=>{
 const h=fixture(),a=deferred(),b=deferred();let count=0;h.read(()=>++count===1?a.promise:b.promise);
 const first=h.api.writerV107SpeechReadNote(h.plugin),second=h.api.writerV107SpeechReadNote(h.plugin);
 b.resolve('Latest local note.');await second;a.resolve('Old local note.');await first;
 assert.deepEqual(h.audio(),['Latest local note.']);
});


test('the local Stop command also cancels a pending read from the final reader',async()=>{
 const h=fixture(),pending=deferred();h.api.writerV107SpeechRegister(h.plugin);h.read(()=>pending.promise);
 const reading=h.reader.speakActive();h.commands.get('v107-tts-stop').callback();pending.resolve('Cancelled final note.');await reading;
 assert.deepEqual(h.audio(),[]);
});

test('a local pending read cannot inherit a replacement Toolkit instance',async()=>{
 const h=fixture('toolkit'),pending=deferred();h.read(()=>pending.promise);const reading=h.api.writerV107SpeechReadNote(h.plugin);
 h.plugin.app.plugins.plugins['ahmed-toolkit']={};pending.resolve('Old local instance.');await reading;assert.deepEqual(h.audio(),[]);
});
