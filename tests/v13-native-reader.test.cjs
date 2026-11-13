'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/v3/core.js','src/v3/final-suite.js','src/v13/companion-toolkit.js','src/v13/companion-bridge.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
class Element{
 constructor(){this.children=[];}
 createEl(){const child=new Element();this.children.push(child);return child;}
 createDiv(){return this.createEl();}
 addClass(){}
}
function harness(language='en'){
 const utterances=[],notices=[],commands=new Map(),rows=[],edgeCalls=[],toolkitCalls=[];
 const speech={speak:utterance=>utterances.push(utterance),cancel(){},pause(){},resume(){},getVoices:()=>[]};
 class Setting{
  constructor(){this.row={buttons:[]};rows.push(this.row);}
  setName(value){this.row.name=value;return this;}setDesc(value){this.row.description=value;return this;}
  control(callback){const item={selectEl:new Element(),inputEl:new Element(),
   addOption(){return this;},setValue(){return this;},setDisabled(){return this;},setLimits(){return this;},setDynamicTooltip(){return this;},
   setButtonText(value){this.text=value;return this;},onClick(fn){this.click=fn;return this;},onChange(){return this;}};
   callback(item);return item;}
  addButton(callback){this.row.buttons.push(this.control(callback));return this;}
  addToggle(callback){this.control(callback);return this;}addDropdown(callback){this.control(callback);return this;}
  addSlider(callback){this.control(callback);return this;}addText(callback){this.control(callback);return this;}
 }
 const sandbox={console,Setting,EditorView:{},MarkdownView:class{},TFile:class{},
  speechSynthesis:speech,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
  Notice:class{constructor(value){notices.push(value);}},document:{querySelectorAll:()=>[]},navigator:{language:'en-US'},
  require:()=>({getLanguage:()=>language}),writerModuleOn:(plugin,key)=>plugin.settings.visibleModules?.[key]!==false,
  writerV12On:(plugin,key)=>plugin.settings.v12Toolkit.enabled!==false&&plugin.settings.v12Toolkit[key]!==false,
  writerV12Config:plugin=>plugin.settings.v12Toolkit,Platform:{isMobile:false},
  WebSocket:class{constructor(){throw Error('Unexpected transport');}},WRITER_EDGE_VOICES:{'en-US':'en-US-Test'}};
 const api=vm.runInNewContext(source+'\n({WriterFinalFeatures,writerFinalMerge,writerRenderFinalSettings})',sandbox);
 let buffer='Before the cursor. Read the unsaved ending.',offset=19,selection='Selected text is deliberately ignored.',diskReads=0,editorReads=0,mode='source';
 const editor={getValue:()=>{editorReads++;return buffer;},getSelection:()=>selection,
  getCursor:which=>{assert.equal(which,'head');return {line:0,ch:offset};},posToOffset:position=>position.ch};
 const view={editor,file:{extension:'md',path:'Book/Chapter.md',basename:'Chapter'},getMode:()=>mode},leaf={view},leaves=[leaf];
 const workspace={activeLeaf:leaf,getActiveViewOfType:()=>view,getActiveFile:()=>view.file,getMostRecentLeaf:()=>leaf,
  getLeavesOfType:type=>type==='markdown'?leaves:[],on:()=>({})};
 const manager={sentences:[],isPlaying:false,isPaused:false,
  playText(text,title){this.sentences=[text];this.isPlaying=true;toolkitCalls.push({text,title});},
  pause(){this.isPaused=true;},resume(){this.isPaused=false;},stop(){this.isPlaying=false;}};
 const plugin={settings:{visibleModules:{},finalSuite:{},v12Toolkit:{enabled:true,integrations:true},companionCompatibility:{ttsProvider:'basic'}},
  app:{workspace,vault:{cachedRead:async()=>{diskReads++;return 'Old text on disk.';},on:()=>({})},plugins:{plugins:{'ahmed-toolkit':{settings:{enableTTS:true,ttsEngine:'offline'},ttsMgr:manager}}}},
  addCommand:command=>commands.set(command.id,command),registerEvent(){},register(){},saveSettings:async()=>{}};
 api.writerFinalMerge(plugin);const reader=new api.WriterFinalFeatures(plugin);plugin.writerFinalFeatures=reader;
 reader.edgePlayer={start:async(text,voice,rate)=>edgeCalls.push({text,voice,rate}),stop(){},pause(){},resume(){}};
 return {api,plugin,reader,workspace,editor,view,leaf,leaves,commands,rows,utterances,notices,edgeCalls,toolkitCalls,
  reads:()=>({disk:diskReads,editor:editorReads}),text:value=>{buffer=value;},cursor:value=>{offset=value;},
  mode:value=>{mode=value;},selected:value=>{selection=value;}};
}

test('native cursor reading uses the exact UTF-16/CRLF editor offset and unsaved text, ignoring selection',async()=>{
 const h=harness(),source='Antes 😃\r\nTexto novo ainda não salvo.';
 h.plugin.app.plugins.plugins={}; // The feature works without either companion installed.
 h.text(source);h.cursor(source.indexOf('novo'));await h.reader.speakActive({fromCursor:true});
 assert.equal(h.utterances.length,1);assert.equal(h.utterances[0].text,'novo ainda não salvo.');
 assert.deepEqual(h.reads(),{disk:0,editor:1});assert.equal(h.toolkitCalls.length,0);
});

test('masking before the cursor slice preserves hidden frontmatter, fenced code and comment boundaries',async()=>{
 for(const source of ['---\nprivate: secret\n---\nReadable prose.',
  '```js\nprivate secret\n```\nReadable prose.',
  '<!-- private secret -->\nReadable prose.',
  '%% private secret %%\nReadable prose.']){
  const h=harness();h.text(source);h.cursor(source.indexOf('secret'));await h.reader.speakActive({fromCursor:true});
  assert.equal(h.utterances.length,1);assert.equal(h.utterances[0].text,'Readable prose.');
  assert.equal(h.reads().disk,0);
 }
});

test('cursor reading retains the existing character limit and does not start at an empty ending',async()=>{
 const h=harness();h.text('Ignored. '+'x'.repeat(200));h.cursor(9);h.plugin.settings.finalSuite.tts.maxCharacters=100;
 await h.reader.speakActive({fromCursor:true});assert.equal(h.utterances[0].text,'x'.repeat(100));
 const end=harness();end.text('The end.');end.cursor(8);await end.reader.speakActive({fromCursor:true});
 assert.equal(end.utterances.length,0);assert.match(end.notices[0],/No readable text/);
});

test('disabled speech never reads the buffer or starts a chosen provider',async()=>{
 for(const disable of [h=>{h.plugin.settings.visibleModules.tts=false;},h=>{h.plugin.settings.finalSuite.tts.enabled=false;}]){
  const h=harness();disable(h);await h.reader.speakActive({fromCursor:true});
  assert.deepEqual(h.reads(),{disk:0,editor:0});assert.equal(h.utterances.length,0);assert.equal(h.toolkitCalls.length,0);
 }
});

test('preview, closed or replaced editors never fall back to another note or to disk',async()=>{
 for(const change of [h=>h.mode('preview'),h=>h.leaves.splice(0),h=>{h.view.editor={...h.editor};}]){
  const h=harness(),original=h.editor;change(h);
  await h.reader.speakActive({fromCursor:true,editor:original,view:h.view});
  assert.equal(h.utterances.length,0);assert.deepEqual(h.reads(),{disk:0,editor:0});assert.equal(h.notices.length,1);
 }
});

test('invalid native offsets never read an unintended prefix or start playback',async()=>{
 for(const offset of [-1,NaN,Infinity,1.5,5000]){
  const h=harness();h.cursor(offset);await h.reader.speakActive({fromCursor:true});
  assert.equal(h.utterances.length,0);assert.equal(h.reads().disk,0);assert.match(h.notices[0],/cursor position/);
 }
});

test('the settings button resolves the most recent live Markdown editor without moving focus',async()=>{
 const h=harness(),otherEditor={getValue:()=> 'Wrong note',getCursor:()=>({line:0,ch:0}),posToOffset:()=>0},
  other={view:{file:{path:'Other.md',extension:'md'},editor:otherEditor,getMode:()=> 'source'}};
 h.leaves.unshift(other);h.workspace.activeLeaf={view:{}};h.workspace.getActiveViewOfType=()=>null;h.workspace.getActiveFile=()=>null;
 h.reader.lastFile=null;await h.reader.speakActive({fromCursor:true});
 assert.equal(h.utterances[0].text,'Read the unsaved ending.');assert.equal(h.workspace.activeLeaf.view.editor,undefined);
});

test('online Basic speech retains explicit consent and sends only the cursor passage when allowed',async()=>{
 const h=harness();h.plugin.settings.finalSuite.tts.engine='edge';
 await h.reader.speakActive({fromCursor:true});assert.equal(h.edgeCalls.length,0);assert.equal(h.utterances.length,0);
 assert.match(h.notices[0],/Allow text to be sent to Microsoft/);
 h.plugin.settings.finalSuite.tts.allowOnline=true;await h.reader.speakActive({fromCursor:true});
 assert.equal(h.edgeCalls.length,1);assert.equal(h.edgeCalls[0].text,'Read the unsaved ending.');
});

test('an explicitly chosen Toolkit provider retains the same permission and session wrapper without fallback',async()=>{
 const h=harness();h.plugin.settings.companionCompatibility.ttsProvider='ahmed-toolkit';
 await h.reader.speakActive({fromCursor:true});assert.deepEqual(h.toolkitCalls,[{text:'Read the unsaved ending.',title:'Chapter'}]);
 assert.equal(h.utterances.length,0);assert.ok(h.plugin._writerCompanionSpeechHandle);
 const denied=harness();denied.plugin.settings.companionCompatibility.ttsProvider='ahmed-toolkit';
 denied.plugin.app.plugins.plugins['ahmed-toolkit'].settings.ttsEngine='online';
 await denied.reader.speakActive({fromCursor:true});assert.equal(denied.toolkitCalls.length,0);assert.equal(denied.utterances.length,0);
 assert.match(denied.notices[0],/Google Translate/);
});

test('the editor command is bilingual, checks availability without reading and starts only its matching editor',async()=>{
 for(const language of ['en','pt-BR']){
  const h=harness(language);h.reader.register();const command=h.commands.get('writer-tts-from-cursor');
  assert.ok(command);assert.equal(command.name,language==='en'?'Read from cursor':'Ler a partir do cursor');
  assert.equal(command.editorCheckCallback(true,h.editor,h.view),true);assert.deepEqual(h.reads(),{disk:0,editor:0});
  h.mode('preview');assert.equal(command.editorCheckCallback(false,h.editor,h.view),false);assert.equal(h.utterances.length,0);
  h.mode('source');assert.equal(command.editorCheckCallback(false,h.editor,h.view),true);await Promise.resolve();
  assert.equal(h.utterances[0].text,'Read the unsaved ending.');
 }
});

test('the normal speech settings offer the native cursor action in English and Portuguese',async()=>{
 for(const language of ['en','pt-BR']){
  const h=harness(language);h.api.writerRenderFinalSettings(new Element(),h.plugin,'tts');
  const button=h.rows.flatMap(row=>row.buttons).find(button=>button.text===(language==='en'?'Read from cursor':'Ler a partir do cursor'));
  assert.ok(button);await button.click();assert.equal(h.utterances[0].text,'Read the unsaved ending.');
 }
});
