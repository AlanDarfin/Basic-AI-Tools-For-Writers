'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v4/integrations.js','utf8');
const extra=vm.runInNewContext(source+'\n({writerV4ExtraMerge,WriterV4Mentions,WriterV4Extras})',{
 EditorSuggest:class{constructor(app){this.app=app;}},
 EditorView:{},ViewPlugin:null,Modal:class{},Setting:class{},TFile:class{},
 writerUi:(pt,en)=>en,writerModuleOn:()=>true,Notice:class{},console,
 document:{body:{classList:{toggle(){},remove(){}}}}
});
const {writerV4ExtraMerge,WriterV4Mentions,WriterV4Extras}=extra;
const normalize=value=>JSON.parse(JSON.stringify(value));
let total=0;function check(name,fn){fn();total++;console.log('PASS',name);}
check('merged settings preserve older data and supply independent defaults',()=>{
 const cfg={writerV4Extras:{mention:{folder:'Characters'},comments:{'Book/A.md':[{id:'a',body:'Note'}]}}};
 writerV4ExtraMerge(cfg);
 assert.equal(cfg.writerV4Extras.mention.folder,'Characters');
 assert.equal(cfg.writerV4Extras.mention.sign,'@');
 assert.equal(cfg.writerV4Extras.comments['Book/A.md'][0].body,'Note');
 assert.equal(cfg.writerV4Extras.wordwise.prompts.improve.length>0,true);
});
check('mention trigger handles typed name and ignores unrelated markup',()=>{
 const plugin={app:{},settings:{writerV4Extras:{mention:{enabled:true,sign:'@'}}}};
 const suggester=new WriterV4Mentions(plugin);
 const pos={line:0,ch:10},editor={getLine:()=> 'Text @Alan'};
 assert.equal(suggester.onTrigger(pos,editor,{extension:'md'}).query,'Alan');
 assert.equal(suggester.onTrigger({line:0,ch:8},{getLine:()=> 'abc@Abcd'},{extension:'md'}),null);
});
check('mention completion limits paths, filters names and offers opt-in new notes',()=>{
 const files=[{basename:'Alan',path:'Characters/Alan.md'},{basename:'Alana',path:'Other/Alana.md'},{basename:'Fred',path:'Characters/Fred.md'}];
 const plugin={app:{vault:{getMarkdownFiles:()=>files}},settings:{writerV4Extras:{mention:{enabled:true,sign:'@',folder:'Characters',maxResults:8}}}};
 const suggest=new WriterV4Mentions(plugin);
 const results=suggest.getSuggestions({query:'Al'});
 assert.equal(results.length,2);
 assert.equal(results[0].path,'Characters/Alan.md');
 assert.equal(results[1].createNew,true);
});
check('typewriter state can be toggled independently of comments and prompts',()=>{
 const cfg={};writerV4ExtraMerge(cfg);const instance=new WriterV4Extras({settings:cfg,app:{workspace:{getActiveFile:()=>null,getLeavesOfType:()=>[]}}});
 assert.equal(instance.getCurrentNote(),null);
 assert.equal(instance.config.typewriter.enabled,false);
 assert.ok(instance.config.wordwise.prompts.grammar);
});
const projectSource=fs.readFileSync('projects.js','utf8');
const projects=vm.runInNewContext(projectSource+'\nmodule.exports',{
 module:{exports:{}},require:()=>({ItemView:class{},TFile:class{},TFolder:class{},Notice:class{},Modal:class{},Menu:class{},Setting:class{},parseYaml:()=>({}),stringifyYaml:()=>''}),
 console,setTimeout,clearTimeout
});
async function asyncChecks(){
 const mk=(arr)=>arr.map(([title,indent])=>({title,indent}));
 const view=Object.create(projects.ProjectsView.prototype);
 view.changeScenes=async(_project,action)=>action(view.scenes);
 const project={file:{path:'Book/Index.md'}};
 view.scenes=mk([['A',0],['A1',1],['B',0],['C',0]]);
 await view.moveSceneRelative(project,'A','B',true);
 assert.deepEqual(view.scenes.map(x=>x.title),['B','A','A1','C']);
 total++;console.log('PASS Longform moves a subtree after a sibling');
 await view.moveSceneRelative(project,'A','A1',false);
 assert.deepEqual(view.scenes.map(x=>x.title),['B','A','A1','C']);
 total++;console.log('PASS Longform blocks moving a parent into its descendant');
 const longform=fs.readFileSync('projects.js','utf8');
 assert.ok(longform.includes('const previousScroll=this.root.scrollTop;'));
 assert.ok(longform.includes('this.root.scrollTop=previousScroll;'));
 assert.ok(longform.includes('writer-project-drag-handle'));
 assert.ok(longform.includes("this.activeTab==='comments'"));
 total++;console.log('PASS Longform preserves scroll and has comments/touch drag UI');
 const suite=fs.readFileSync('src/v3/final-suite.js','utf8');
 const speech={utterance:null,getVoices:()=>[],cancel(){},speak(v){this.utterance=v;}};
 const feature=vm.runInNewContext(suite+'\nWriterFinalFeatures',{
  console,require:()=>({getLanguage:()=> 'en'}),SpeechSynthesisUtterance:class{constructor(t){this.text=t;}},
  speechSynthesis:speech,writerModuleOn:()=>true,writerMaskMarkdown:text=>text,
  MarkdownView:class{},Notice:class{},WRITER_EDGE_VOICES:{},window:{},
  document:{querySelectorAll:()=>[]}
 });
 const note={path:'Book/Chapter.md',extension:'md'};
 const plugin={settings:{finalSuite:{tts:{enabled:true,engine:'system',readSelection:true,language:'en-US',maxCharacters:12000,rate:1,pitch:1,volume:1}}},
  app:{workspace:{getActiveViewOfType:()=>null,getLeavesOfType:()=>[],getActiveFile:()=>null},vault:{cachedRead:async()=> 'Chapter content on Android.'}}};
 const tts=new feature(plugin);tts.lastFile=note;
 await tts.speakActive();
 assert.equal(speech.utterance.text,'Chapter content on Android.');
 total++;console.log('PASS Android TTS falls back to last open note from vault');
 console.log(total+' integrated v4 checks passed');
}
asyncChecks().catch(error=>{console.error(error);process.exitCode=1;});
