'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function expose(path,names,extras={}){
 return vm.runInNewContext(fs.readFileSync(path,'utf8')+'\n({'+names.join(',')+'})',
  {console,Date,Map,Set,Math,Number,String,Boolean,Uint8Array,JSON,Promise,writerUi:(pt,en)=>en,...extras});
}
const home=expose('src/v10/startup-cleanup.js',['writerV106HomeStartupPolicy','writerV106HomeChooseLeaf','writerV106HomeCleanup'],{writerModuleOn:()=>true,WRITER_V8_HOME_VIEW:'writer-writing-home'});
const drag=expose('src/v10/block-dragger.js',['writerV106DragMerge','writerV106DragBlocks','writerV106DragBlockAt','writerV106DragMove','writerV106DragConvert','writerV106DragApply']);
const hist=expose('src/v10/historical-helpers.js',['writerV106LegacyDictionaryCandidates','writerV106JsonParse']);
test('Clean startup skips hot reload and respects disabled setting',()=>{
 assert.equal(home.writerV106HomeStartupPolicy({homeCleanStart:true},true,false),'skip');
 assert.equal(home.writerV106HomeStartupPolicy({homeCleanStart:true},false,true),'skip');
 assert.equal(home.writerV106HomeStartupPolicy({homeCleanStart:false},false,false),'skip');
 assert.equal(home.writerV106HomeStartupPolicy({homeCleanStart:true},false,false),'clean');
});
test('Fresh startup reuses one root and detaches only restored main tabs',async()=>{
 const leaves=['markdown','empty','writer-writing-home'].map((type,i)=>{
  let current=type;
  return {id:i,getViewState:()=>({type:current}),setViewState:async state=>{current=state.type;},
   detach(){this.detached=true;}};
 });
 const ws={activeLeaf:leaves[0],iterateRootLeaves(cb){leaves.forEach(cb);},setActiveLeaf(leaf){this.activeLeaf=leaf;}};
 const plugin={settings:{v8Finish:{homeCleanStart:true}},app:{workspace:ws}};
 assert.equal(await home.writerV106HomeCleanup(plugin,async()=>{throw Error('must reuse root');}),true);
 assert.equal(leaves.filter(l=>l.detached).length,2);
 assert.equal(ws.activeLeaf,leaves[2]);
 assert.equal(ws.activeLeaf.getViewState().type,'writer-writing-home');
 assert.equal(plugin._writerV106HomeClosedRestored,2);
});
test('A failed home activation never closes restored tabs',async()=>{
 const leaf={getViewState:()=>({type:'markdown'}),setViewState:async()=>{throw Error('unavailable');},detach(){this.closed=true;}};
 const plugin={settings:{v8Finish:{homeCleanStart:true}},app:{workspace:{iterateRootLeaves(cb){cb(leaf);},activeLeaf:leaf}}};
 assert.equal(await home.writerV106HomeCleanup(plugin,async()=>{}),false);
 assert.equal(leaf.closed,undefined);
});
test('Dragger recognizes headings, fenced code, tables, list descendants and quotes',()=>{
 const tick=String.fromCharCode(96).repeat(3);
 const lines=['# Title','','- Parent','  - Child','  Continued','- Next','','| A | B |','| --- | --- |','| 1 | 2 |','','> [!note] Callout','> text','',tick+'js','const n = 2;',tick,''];
 const blocks=drag.writerV106DragBlocks(lines);
 assert.deepEqual(Array.from(blocks.map(b=>b.kind)),['heading','list','list','table','quote','fence']);
 assert.equal(blocks[1].end,5);
 assert.equal(blocks[3].end,10);
});
test('Dragger moves blocks while preserving blank separators',()=>{
 const source='Alpha\n\nBeta';
 assert.equal(drag.writerV106DragMove(source,0,1,3).text,'Beta\n\nAlpha');
 assert.equal(drag.writerV106DragMove(source,2,3,0).text,'Beta\n\nAlpha');
 assert.equal(drag.writerV106DragMove(source,0,1,1),null);
});
test('Nested list block moves with descendants and optional indentation',()=>{
 const text='- Parent\n  - Child\n\n- Next';
 const b=drag.writerV106DragBlockAt(text.split('\n'),0);
 assert.equal(b.end,2);
 assert.equal(drag.writerV106DragMove(text,b.start,b.end,4,1).text,'- Next\n\n  - Parent\n    - Child');
});
test('A block move produces one editor transaction and valid cursor',()=>{
 let text='Alpha\n\nBeta';
 const editor={
  lineCount:()=>text.split('\n').length,
  getLine:n=>text.split('\n')[n],
  replaceRange:(frag,from,to)=>{
   const offsets=text.split('\n');const off=pos=>offsets.slice(0,pos.line).reduce((n,t)=>n+t.length+1,0)+pos.ch;
   text=text.slice(0,off(from))+frag+text.slice(off(to));editor.calls=(editor.calls||0)+1;
  },setCursor:pos=>{editor.cursor=pos;}
 };
 assert.equal(drag.writerV106DragApply(editor,drag.writerV106DragMove(text,0,1,3)),true);
 assert.equal(text,'Beta\n\nAlpha');assert.equal(editor.calls,1);
 assert.ok(editor.cursor.line>=0&&editor.cursor.line<editor.lineCount());
});
test('Block type commands transform only line prefixes',()=>{
 assert.equal(drag.writerV106DragConvert('- [x] Task','heading'),'## Task');
 assert.equal(drag.writerV106DragConvert('## Scene','task'),'- [ ] Scene');
 assert.equal(drag.writerV106DragConvert('Story','quote'),'> Story');
});
test('Legacy dictionary paths ignore credentials and JSON inspector is bounded',()=>{
 const paths=hist.writerV106LegacyDictionaryCandidates({settings:{dictionaryPath:'Notes/Words.md',apiKey:'SECRET'}});
 assert.deepEqual(Array.from(paths),['Notes/Words.md']);
 assert.equal(hist.writerV106JsonParse('{"a":[1,2]}').a.length,2);
 assert.throws(()=>hist.writerV106JsonParse('invalid'));
 assert.throws(()=>hist.writerV106JsonParse('x'.repeat(200001)));
});
test('Diagnostics opens the legacy dictionary recovery and preserves existing dictionary paths',async()=>{
 const rows=[],commands=[];let reads=0,saves=0;
 const panel={createEl(){},createDiv(){return this;},createSpan(){},empty(){}};
 class Setting{
  constructor(){this.row={};rows.push(this.row);}
  setName(name){this.row.name=name;return this;}
  setDesc(){return this;}
  addButton(configure){configure({setButtonText(){return this;},onClick:callback=>{this.row.click=callback;}});return this;}
 }
 class Modal{
  constructor(){this.contentEl=panel;}
  setTitle(){}
  open(){this.onOpen();}
  close(){}
 }
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 const legacy=new TFile('Notes/Old dictionary.md');
 const source=['src/v4/modules.js','src/v10/historical-helpers.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
 const api=vm.runInNewContext(source+'\n({writerRenderDiagnostics,writerV106HistoricRegister})',{
  Setting,Modal,TFile,Notice:class{},writerUi:(pt,en)=>en
 });
 const plugin={settings:{complements:{dictionaryPaths:'First.md\nSecond.md',enabled:false}},app:{vault:{
  adapter:{exists:async()=>true,read:async()=>{reads++;return JSON.stringify({dictionaryPath:legacy.path,apiKey:'PRIVATE'});}},
  getAbstractFileByPath:path=>path===legacy.path?legacy:null
 }},addCommand:command=>commands.push(command.id),saveSettings:async()=>{saves++;}};
 api.writerV106HistoricRegister(plugin);api.writerRenderDiagnostics(plugin,panel);
 assert.deepEqual(commands,['v106-json-tree-viewer']);assert.equal(reads,0);
 await rows.find(row=>row.name==='Recover v1 dictionary').click();
 assert.equal(reads,1);assert.equal(saves,0,'select a dictionary note before modifying any settings');
 await rows.find(row=>row.name===legacy.path).click();
 assert.equal(plugin.settings.complements.dictionaryPaths,'First.md,Second.md,Notes/Old dictionary.md');
 assert.equal(plugin.settings.complements.enabled,true);assert.equal(plugin.settings.complements.dictionaries,true);
 assert.equal(saves,1);assert.doesNotMatch(JSON.stringify(plugin.settings),/PRIVATE/);
});
test('Build, homepage and settings contain required v10.6 wiring',()=>{
 const read=x=>fs.readFileSync(x,'utf8');
 const homeSrc=read('src/v8/writing-home.js'),build=read('scripts/build-v3.js'),enhancements=read('src/v10/enhancements.js');
 for(const mod of ['startup-cleanup','block-dragger','historical-helpers'])assert.ok(build.includes('v10/'+mod));
 assert.ok(homeSrc.includes('writerV106HomeRegisterStartup(plugin,open)'));
 assert.ok(read('src/v8/finish-blocks.js').includes('homeCleanStart:true'));
 assert.ok(enhancements.includes('writerV106DragRegister(plugin)'));
 assert.ok(enhancements.includes('writerV106HistoricRegister(plugin)'));
});
