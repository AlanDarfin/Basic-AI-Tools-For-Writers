'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('src/v3/final-suite.js','utf8');
let notice='';
const sandbox={
 console,
 writerUi:(pt,en)=>pt,
 writerModuleOn:()=>true,
 writerMaskMarkdown:value=>value,
 MarkdownView:class{},
 Notice:class{constructor(message){notice=message;}},
 navigator:{userAgent:'Android'},
 setTimeout,clearTimeout
};
const Features=vm.runInNewContext(source+'\nWriterFinalFeatures',sandbox);
const plugin={
 app:{
  workspace:{getActiveFile:()=>null,getActiveViewOfType:()=>null,getLeavesOfType:()=>[]},
  vault:{cachedRead:async()=> 'Texto de teste no Android.'}
 },
 settings:{finalSuite:{tts:{enabled:true,engine:'system',readSelection:true,maxCharacters:12000}}}
};
const instance=new Features(plugin);
instance.lastFile={path:'Livro/Capítulo.md',extension:'md'};
assert.match(instance.systemSpeechStatus(),/WebView/);
assert.deepEqual(Array.from(instance.systemVoices()),[]);
console.log('PASS Android WebView speech diagnostics remain accurate');

(async()=>{
 await instance.speakActive();
 assert.match(notice,/WebView/);
 const css=fs.readFileSync('styles.css','utf8');
 const extras=fs.readFileSync('src/v4/integrations.js','utf8');
 const main=fs.readFileSync('main.js','utf8');
 // The old formatting toolbar and commands must not return in either editor.
 for(const removed of [
  'v4-editing-toolbar','v4-format-','writerV4FormatText','openEditingToolbar',
  'applyEditorFormat','writer-v4-floating-toolbar','writer-v4-editor-command-grid',
  'writer-v4-toolbar-mobile','writer-v4-format-actions'
 ]){
  assert.ok(!extras.includes(removed),'Source contains removed feature: '+removed);
  assert.ok(!main.includes(removed),'Bundle contains removed feature: '+removed);
  assert.ok(!css.includes(removed),'CSS contains removed feature: '+removed);
 }
 assert.ok(!extras.includes("toggle('toolbar','enabled'"));
 assert.ok(!extras.includes('mobileModeConfirmed'));
 const {writerV4ExtraMerge}=vm.runInNewContext(extras+'\n({writerV4ExtraMerge})',{EditorSuggest:class{},console});
 const existing={writerV4Extras:{toolbar:{enabled:true,mobileMode:'floating'},typewriter:{enabled:true},mention:{sign:'#'}}};
 writerV4ExtraMerge(existing);
 assert.ok(!Object.hasOwn(existing.writerV4Extras,'toolbar'),'Obsolete toolbar preferences are dropped on upgrade');
 assert.equal(existing.writerV4Extras.typewriter.enabled,true,'Typewriter preference remains');
 assert.equal(existing.writerV4Extras.mention.sign,'#','Mention preference remains');
 for(const preserved of [
  "id:'v4-writing-'","id:'v4-wordwise'","id:'v4-toggle-typewriter'",
  'writer-v4-typewriter-current-line','this.runEditorAIAction(editor,key)'
 ])assert.ok(extras.includes(preserved),'Independent writer feature remains: '+preserved);
 assert.ok(css.includes('grid-template-columns:36px minmax(0,1fr) max-content'));
 assert.ok(css.includes('writer-v4-typewriter-current-line'));
 const projectSource=fs.readFileSync('projects.js','utf8');
 assert.ok(projectSource.includes('row.dataset.depth=String(level)'));
 assert.ok(projectSource.includes("cls:'writer-project-scene-rails'"));
 assert.ok(projectSource.includes("rails.createSpan({cls:'writer-project-scene-rail'})"));
 assert.ok(!projectSource.includes("writer-project-scene-depth-mark"));
 assert.ok(css.includes('.writer-project-scene-rail'));
 assert.ok(main.includes('systemSpeechStatus(){'));
 console.log('PASS 4.3.0 removes Editing Toolbar but preserves independent features');
})().catch(error=>{console.error(error);process.exitCode=1;});
