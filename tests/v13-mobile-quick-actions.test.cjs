'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function harness(){
 const spoken=[],notices=[],menus=[];
 class MarkdownView{}
 const api=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/v12/mobile-ux-1201.js'),'utf8')+
  '\n({writerV1201Editor,writerV1201Read,writerV1201Format,writerV1201QuickMenu})',{
  MarkdownView,writerUi:(_pt,en)=>en,writerModuleOn:()=>true,
  writerV12SelectedText:()=>'',writerV107SpeechConfig:()=>{},
  writerV107SpeechStart:(_plugin,text)=>spoken.push(text),Notice:class{constructor(text){notices.push(text);}},
  Menu:class{
   constructor(){this.items=[];menus.push(this);}
   addItem(configure){const item={setTitle(title){this.title=title;return this;},setIcon(){return this;},onClick(callback){this.callback=callback;return this;}};configure(item);this.items.push(item);}
   showAtPosition(){}
  }
 });
 const file={path:'Chapter.md',extension:'md'};
 const workspace={getActiveFile:()=>file,getActiveViewOfType:()=>null};
 const plugin={settings:{},app:{workspace,vault:{cachedRead:()=>{throw Error('Unexpected disk read');}}}};
 return {api,plugin,workspace,file,spoken,notices,menus};
}
function pendingSpeech(provider='basic'){
 const spoken=[],notices=[],requests=[],cleanups=[];
 class TFile{constructor(path){this.path=path;this.basename=path.replace(/\.md$/,'');this.extension='md';this.stat={mtime:1,size:20};}}
 const file=new TFile('Chapter.md'),files=new Map([[file.path,file]]);let active=file;
 const speech={speak:utterance=>spoken.push(utterance.text),cancel(){},getVoices:()=>[]};
 const Utterance=class{constructor(text){this.text=text;}};
 const workspace={getActiveFile:()=>active,getActiveViewOfType:()=>null,getLeavesOfType:()=>[],on:()=>({}),
  containerEl:{ownerDocument:{defaultView:{speechSynthesis:speech,SpeechSynthesisUtterance:Utterance}}}};
 const plugin={settings:{visibleModules:{tts:true},companionCompatibility:{ttsProvider:provider}},
  app:{workspace,plugins:{plugins:{'ahmed-toolkit':{}}},vault:{on:()=>({}),getAbstractFileByPath:path=>files.get(path),cachedRead:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}},
  addCommand(){},registerEvent(){},registerDomEvent(){},register:fn=>cleanups.push(fn)};
 const source=['v3/core','v3/final-suite','v10/speech-accessibility','v12/mobile-ux-1201'].map(name=>fs.readFileSync(path.join(__dirname,'../src/'+name+'.js'),'utf8')).join('\n');
 const api=vm.runInNewContext(source+'\n({WriterFinalFeatures,writerFinalMerge,writerV107SpeechConfig,writerV107SpeechStop,writerV107SpeechStart,writerV107SpeechRegister,writerV1201Read})',{
  console,TFile,MarkdownView:class{},EditorView:{},writerUi:(_pt,en)=>en,
  writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
  writerV12SelectedText:()=>'',speechSynthesis:speech,SpeechSynthesisUtterance:Utterance,
  navigator:{language:'en-US'},Notice:class{constructor(message){notices.push(message);}},
  writerCompanionConfig:plugin=>plugin.settings.companionCompatibility,
  writerCompanionSpeechControl:()=>false,writerCompanionSpeechStart:(_plugin,text)=>{spoken.push(text);return true;}
 });
 api.writerFinalMerge(plugin);api.writerV107SpeechConfig(plugin.settings);
 const reader=plugin.writerFinalFeatures=new api.WriterFinalFeatures(plugin);
 return {api,plugin,workspace,file,files,reader,spoken,notices,requests,newFile:path=>new TFile(path),
  active:next=>{active=next;},stop:()=>api.writerV107SpeechStop(plugin),
  unload(){api.writerV107SpeechRegister(plugin);for(const cleanup of cleanups)cleanup();}};
}
test('mobile read-aloud uses the current unsaved editor buffer',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'',getValue:()=>'# New draft\nUnsaved words'}};
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['New draft\nUnsaved words']);
});
test('mobile selection takes precedence over the whole editor buffer',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'Selected passage',getValue:()=>{throw Error('Unexpected whole-note read');}}};
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Selected passage']);
});
test('switching between Markdown panes cannot reuse the previous pane editor',()=>{
 const h=harness(),old={path:'Old.md',extension:'md'};
 const current={getSelection:()=>'',getValue:()=>'Current draft'};
 h.workspace.activeEditor={file:old,editor:{getSelection:()=>'Stale selection'}};
 h.workspace.activeLeaf={view:{file:h.file,editor:current,getViewType:()=>'markdown'}};
 assert.equal(h.api.writerV1201Editor(h.plugin),current);
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Current draft']);
});
test('formatting a PDF tab does not change a stale Markdown editor',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'Stale selection'}};
 h.workspace.getActiveFile=()=>({path:'Reference.pdf',extension:'pdf'});
 assert.equal(h.api.writerV1201Editor(h.plugin),null);
 h.api.writerV1201Format(h.plugin);
 assert.deepEqual(h.notices,['Open a note in editing mode to format.']);
});
test('a delayed preview read is discarded when the current note changes',async()=>{
 const h=harness();let finish;
 h.plugin.app.vault.cachedRead=()=>new Promise(resolve=>{finish=resolve;});
 const reading=h.api.writerV1201Read(h.plugin);
 h.workspace.getActiveFile=()=>({path:'Other.md',extension:'md'});
 finish('Old preview');await reading;
 assert.deepEqual(h.spoken,[]);
});
test('reading view still reads the selected note and reports disk errors',async()=>{
 const h=harness();
 h.plugin.app.vault.cachedRead=async()=> 'Preview text';
 await h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Preview text']);
 h.plugin.app.vault.cachedRead=async()=>{throw Error('Read failed');};
 await h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.notices,['Read failed']);
});
test('mobile preview reads cannot start speech after Stop, disable, unload or changed choices',async()=>{
 const changes=[h=>h.stop(),h=>{h.plugin.settings.visibleModules.tts=false;},
  h=>{h.plugin.settings.finalSuite.tts.enabled=false;},h=>{h.plugin.settings.v107Speech.enabled=false;},
  h=>h.unload(),h=>{h.plugin.settings.companionCompatibility.ttsProvider='other-provider';},
  h=>{h.plugin.settings.v107Speech.voice='Another voice';}];
 for(const provider of ['basic','ahmed-toolkit'])for(const change of changes){
  const h=pendingSpeech(provider),reading=h.api.writerV1201Read(h.plugin);
  assert.equal(h.requests.length,1);change(h);h.requests[0].resolve('Obsolete preview.');await reading;
  assert.deepEqual(h.spoken,[],provider);assert.deepEqual(h.notices,[],provider);
 }
});
test('mobile preview reads reject changed files, new editor buffers and replaced Toolkit instances',async()=>{
 for(const change of [h=>h.active(h.newFile('Other.md')),h=>{h.file.path='Renamed.md';},
  h=>{h.file.stat.mtime++;},h=>{h.files.set(h.file.path,h.newFile(h.file.path));},
  h=>{h.workspace.activeEditor={file:h.file,editor:{getValue:()=> 'New unsaved buffer'}};},
  h=>{h.plugin.app.plugins.plugins['ahmed-toolkit']={};}]){
  const h=pendingSpeech('ahmed-toolkit'),reading=h.api.writerV1201Read(h.plugin);
  change(h);h.requests[0].resolve('Old file content.');await reading;
  assert.deepEqual(h.spoken,[]);
 }
});
test('the latest mobile read wins and selection speech supersedes a pending mobile read',async()=>{
 const h=pendingSpeech(),first=h.api.writerV1201Read(h.plugin),second=h.api.writerV1201Read(h.plugin);
 h.requests[1].resolve('Newest mobile reading.');await second;
 h.requests[0].resolve('Older mobile reading.');await first;
 assert.deepEqual(h.spoken,['Newest mobile reading.']);
 const pending=h.api.writerV1201Read(h.plugin);
 h.api.writerV107SpeechStart(h.plugin,'Selected passage.');h.requests[2].resolve('Earlier note.');await pending;
 assert.deepEqual(h.spoken,['Newest mobile reading.','Selected passage.']);
});
test('mobile quick read supersedes a pending main-reader request and stale failures stay silent',async()=>{
 const h=pendingSpeech(),main=h.reader.speakActive();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=> 'Mobile selection.'}};
 h.api.writerV1201Read(h.plugin);h.requests[0].resolve('Old main reading.');await main;
 assert.deepEqual(h.spoken,['Mobile selection.']);
 h.workspace.activeEditor=null;
 const old=h.api.writerV1201Read(h.plugin);h.stop();h.requests[1].reject(Error('Obsolete read failure'));await old;
 assert.deepEqual(h.notices,[]);
});
test('Basic quick actions expose the existing Space chooser when registered',()=>{
 const h=harness();let opened=0;
 h.plugin.writerV133SpacesChoose=()=>{opened++;};
 h.api.writerV1201QuickMenu(h.plugin);
 const action=h.menus[0].items.find(item=>item.title==='Choose Space');
 assert.ok(action);action.callback();assert.equal(opened,1);
 delete h.plugin.writerV133SpacesChoose;
 h.api.writerV1201QuickMenu(h.plugin);
 assert.equal(h.menus[1].items.some(item=>item.title==='Choose Space'),false);
});
