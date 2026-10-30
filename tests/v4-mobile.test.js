'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('src/v3/final-suite.js','utf8');
let notice='';
const sandbox={
 console,
 writerUi:(pt,en)=>pt,
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
console.log('PASS Android WebView diagnostic does not claim to access native system voices');

(async()=>{
 await instance.speakActive();
 assert.match(notice,/WebView/);
 console.log('PASS Android absent native speech API is explained to the user');
 const src=fs.readFileSync('src/v4/integrations.js','utf8');
 const css=fs.readFileSync('styles.css','utf8');
 for(const event of ["addEventListener('touchend'","addEventListener('selectionchange'","removeEventListener('touchend'","removeEventListener('selectionchange'"]){
  assert.ok(src.includes(event),event);
 }
 assert.ok(src.includes('this.savedRange'), 'touch selection is retained');
 assert.ok(src.includes("this.dom.addClass('writer-v4-toolbar-mobile')"),'mobile toolbar has dedicated styling');
 assert.ok(css.includes('.writer-v4-floating-toolbar.writer-v4-toolbar-mobile'));
 assert.ok(css.includes('position:fixed!important'));
 assert.ok(src.includes('coordsAtPos(selection.to)'), 'mobile toolbar anchored to selection');
 assert.ok(src.includes("mobileMode==='off'"), 'mobile toolbar can be disabled');
 assert.ok(css.includes('bottom:auto!important'), 'no forced docking above keyboard');
 assert.ok(css.includes('.writer-v4-toolbar-desktop-only{display:none!important}'));
 console.log('PASS editor toolbar follows selected text and offers mobile opt-out');
 assert.ok(css.includes('grid-template-columns:36px minmax(0,1fr) max-content!important'));
 for(const item of ['>.writer-project-drag-handle','>.writer-project-scene-title','>.writer-project-scene-controls']){
  assert.ok(css.includes(item),'chapter card region '+item);
 }
 const scenes=fs.readFileSync('projects.js','utf8');
 assert.ok(scenes.includes("row.style.setProperty('--writer-scene-indent'"), 'depth controls visual indentation');
 assert.ok(scenes.includes("row.dataset.sceneDepth=String(level)"), 'scene depth is retained');
 assert.ok(scenes.includes("cls:'writer-project-scene-depth'"), 'depth label is visible');
 assert.ok(css.includes('padding-inline-start:var(--writer-scene-indent,2px)!important'), 'mobile CSS preserves scene depth');
 assert.ok(css.includes('.writer-project-scene-nested'), 'nested scene border is visible');
 console.log('PASS Longform chapter hierarchy and compact actions render separately');
 const main=fs.readFileSync('main.js','utf8');
 for(const required of ['systemSpeechStatus(){',"view.dom.addEventListener('touchend'","grid-template-columns:36px"]){
  const haystack=required.includes('grid-')?css:main;
  assert.ok(haystack.includes(required),required);
 }
 console.log('PASS standalone bundle includes mobile fixes');
})().catch(error=>{console.error(error);process.exitCode=1;});
