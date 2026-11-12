'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const features=[
 {file:'data-tables',key:'v107Db',name:'Db',field:'maxFiles',label:'Maximum notes per database',value:750},
 {file:'editor-pro',key:'v107Editor',name:'Editor',field:'maxFiles',label:'Max files for batch replace',value:125},
 {file:'calendar-feeds',key:'v107Feeds',name:'Calendar',field:'intervalHours',label:'Refresh interval (hours)',value:12},
 {file:'media-drag-extension',key:'v107Media',name:'Media',field:'maxPage',label:'Maximum PDF preview page',value:42},
 {file:'story-graph',key:'v107Graph',name:'Graph',field:'maxNodes',label:'Maximum graph nodes',value:140},
 {file:'speech-accessibility',key:'v107Speech',name:'Speech',field:'enabled',label:'Enable local speech',value:false},
 {file:'study-fsrs',key:'v107Study',name:'Study',field:'desiredRetention',label:'Desired retention (FSRS)',value:.94},
 {file:'zotero-web',key:'v107Zotero',name:'Zotero',field:'libraryId',label:'Numeric library ID',value:'1234567'}
];

function runtime(feature,initial={}){
 const rows=[],saves=[];
 class Setting{
  constructor(){this.row={};rows.push(this.row);}
  setName(name){this.row.name=name;return this;}
  setDesc(){return this;}
  control(register){
   const input={inputEl:{},setValue(){return this;},setPlaceholder(){return this;},
    setLimits(){return this;},setDynamicTooltip(){return this;},addOption(){return this;},
    setButtonText(){return this;},onChange:callback=>{this.row.change=callback;return input;},
    onClick:()=>input};
   register(input);return this;
  }
  addToggle(register){return this.control(register);}
  addSlider(register){return this.control(register);}
  addText(register){return this.control(register);}
  addDropdown(register){return this.control(register);}
  addButton(register){return this.control(register);}
 }
 const config='writerV107'+feature.name+'Config';
 const render='writerV107'+feature.name+'Settings';
 const extras={
  'data-tables':['writerV107DbRows','writerV107DbSpec'],
  'calendar-feeds':['writerV107CalendarSynchronize'],
  'story-graph':['writerV107GraphBuild'],
  'speech-accessibility':['writerV107SpeechStart'],
  'study-fsrs':['writerV107StudySchedule']
 }[feature.file]||[];
 const api=vm.runInNewContext(fs.readFileSync('src/v10/'+feature.file+'.js','utf8')+
  '\n({'+[config,render,...extras].join(',')+'})',{
   Setting,ItemView:class{},TFile:class{},URL,writerUi:(_pt,en)=>en,console
  });
 const settings={[feature.key]:initial};
 const plugin={settings,app:{vault:{getMarkdownFiles:()=>[]},metadataCache:{}},
  saveSettings:async()=>{saves.push(JSON.parse(JSON.stringify(settings)));}};
 const panel={createEl:()=>({})};
 const read=()=>{
  if(feature.file==='data-tables')return api.writerV107DbRows(plugin,api.writerV107DbSpec(''));
  if(feature.file==='story-graph')return api.writerV107GraphBuild(plugin);
  if(feature.file==='study-fsrs')return api.writerV107StudySchedule(null,4,Date.UTC(2026,10,11),settings);
  return api[config](settings);
 };
 return {api,config,render,settings,plugin,panel,read,saves,rows};
}

for(const feature of features)test(feature.file+' settings continue saving after configuration reads and re-render',async()=>{
 const legacy={keep:true};
 const h=runtime(feature,{legacy});
 h.api[h.config](h.settings);
 h.api[h.render](h.plugin,h.panel);
 const original=h.rows.find(row=>row.name===feature.label);
 assert.ok(original?.change,'Control '+feature.label+' must be available');
 h.read();
 h.api[h.render](h.plugin,h.panel);
 h.read();
 await original.change(feature.value);
 assert.equal(h.settings[feature.key][feature.field],feature.value,'original control updates current settings');
 assert.equal(h.saves.at(-1)[feature.key][feature.field],feature.value,'saved snapshot includes the change');
 const current=h.api[h.config](h.settings);
 assert.equal(current[feature.field],feature.value,'runtime normalization retains the selected value');
 assert.equal(current.legacy,legacy,'unrelated saved values survive normalization');
});

test('advanced normalizers retain writable objects and existing limits while replacing malformed containers',()=>{
 const bounds={
  'data-tables':{maxFiles:9000,expect:{maxFiles:2000}},
  'editor-pro':{maxFiles:-1,expect:{maxFiles:5}},
  'calendar-feeds':{intervalHours:99,maxEvents:9000,urls:['https://example.org/a.ics',7],expect:{intervalHours:24,maxEvents:300}},
  'media-drag-extension':{maxPage:9000,expect:{maxPage:80}},
  'story-graph':{maxNodes:9000,positions:{'Note.md':{x:10,y:20}},expect:{maxNodes:180}},
  'speech-accessibility':{rate:8,pitch:-2,expect:{rate:2,pitch:.5}},
  'study-fsrs':{scheduler:'unknown',desiredRetention:1,expect:{scheduler:'sm2',desiredRetention:.97}},
  'zotero-web':{libraryType:'invalid',libraryId:'../secret',folder:'<invalid>',maxItems:9000,
   expect:{libraryType:'users',libraryId:'',folder:'Zotero',maxItems:300}}
 };
 for(const feature of features){
  const {expect,...saved}=bounds[feature.file];
  const h=runtime(feature,saved);
  assert.equal(h.api[h.config](h.settings),saved,feature.file+' retains the current object');
  for(const [key,value] of Object.entries(expect))assert.equal(saved[key],value,feature.file+' '+key);
  if(feature.file==='calendar-feeds')assert.deepEqual(Array.from(saved.urls),['https://example.org/a.ics','']);
  if(feature.file==='story-graph')assert.equal(saved.positions['Note.md'].x,10);
  for(const malformed of [null,[],false,'invalid']){
   h.settings[feature.key]=malformed;
   const normalized=h.api[h.config](h.settings);
   assert.equal(typeof normalized,'object',feature.file);
   assert.equal(Array.isArray(normalized),false,feature.file+' malformed array must not become a config');
   assert.equal(h.api[h.config](h.settings),normalized,feature.file+' repaired container remains stable');
  }
 }
});

test('clearing one calendar feed keeps the other visible fields attached to their own slots',async()=>{
 const feature=features.find(item=>item.file==='calendar-feeds');
 const one='https://example.org/one.ics',two='https://example.org/two.ics',edited='https://example.org/edited.ics';
 const h=runtime(feature,{urls:[one,two]});
 h.api[h.config](h.settings);
 h.api[h.render](h.plugin,h.panel);
 const first=h.rows.find(row=>row.name==='HTTPS ICS feed 1');
 const second=h.rows.find(row=>row.name==='HTTPS ICS feed 2');
 await first.change('');
 h.api[h.config](h.settings);
 await second.change(edited);
 assert.deepEqual(Array.from(h.settings.v107Feeds.urls),['',edited]);
 assert.deepEqual(h.saves.at(-1).v107Feeds.urls,['',edited]);
 await first.change(one);
 assert.deepEqual(Array.from(h.settings.v107Feeds.urls),[one,edited]);
});

test('empty calendar feed fields do not produce synchronization errors or requests',async()=>{
 const feature=features.find(item=>item.file==='calendar-feeds');
 const h=runtime(feature,{enabled:true,urls:['','','']});
 h.plugin.app.vault.getAbstractFileByPath=()=>({path:'Calendar'});
 const source=fs.readFileSync('src/v10/calendar-feeds.js','utf8');
 const run=vm.runInNewContext(source+'\nwriterV107CalendarSynchronize',{
  WRITER_V83_CAL_FOLDER:'Calendar',writerUi:(_pt,en)=>en,
  require:()=>{throw Error('No network request should be sent for an empty field');},console
 });
 const result=await run(h.plugin,true);
 assert.deepEqual({...result},{imported:0,skipped:0,errors:0});
});

test('adding a later calendar feed preserves empty preceding fields through reads and saves',async()=>{
 const feature=features.find(item=>item.file==='calendar-feeds');
 const h=runtime(feature,{urls:[]});
 h.api[h.config](h.settings);
 h.api[h.render](h.plugin,h.panel);
 const fifth=h.rows.find(row=>row.name==='HTTPS ICS feed 5');
 await fifth.change('https://example.org/five.ics');
 assert.deepEqual(h.saves.at(-1).v107Feeds.urls,['','','','','https://example.org/five.ics']);
 h.api[h.config](h.settings);
 await fifth.change('https://example.org/updated.ics');
 assert.deepEqual(Array.from(h.settings.v107Feeds.urls),['','','','','https://example.org/updated.ics']);
});

test('turning off local speech prevents the note reader from starting the device voice engine',async()=>{
 const feature=features.find(item=>item.file==='speech-accessibility');
 const h=runtime(feature,{enabled:true});
 h.api[h.config](h.settings);
 h.api[h.render](h.plugin,h.panel);
 const engineCalls=[];
 const browser={speechSynthesis:{
  cancel:()=>engineCalls.push('cancel'),getVoices:()=>{engineCalls.push('voices');return [];},
  speak:()=>engineCalls.push('speak')
 },SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
 h.plugin.app.workspace={containerEl:{ownerDocument:{defaultView:browser}}};
 assert.equal(h.api.writerV107SpeechStart(h.plugin,'A short sentence.'),true);
 assert.deepEqual(engineCalls,['cancel','voices','speak']);
 await h.rows.find(row=>row.name==='Enable local speech').change(false);
 h.api[h.config](h.settings);
 assert.equal(h.api.writerV107SpeechStart(h.plugin,'Do not read this sentence.'),false);
 assert.deepEqual(engineCalls,['cancel','voices','speak']);
});
