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
 assert.ok(src.includes("this.dom.addClass('writer-v4-toolbar-mobile')"),'mobile toolbar has docked styling');
 assert.ok(css.includes('.writer-v4-floating-toolbar.writer-v4-toolbar-mobile'));
 assert.ok(css.includes('position:fixed!important'));
 console.log('PASS editor toolbar supports touch and mobile bottom docking');
 assert.ok(css.includes('grid-template-columns:36px minmax(0,1fr) max-content!important'));
 for(const item of ['>.writer-project-drag-handle','>.writer-project-scene-title','>.writer-project-scene-controls']){
  assert.ok(css.includes(item),'chapter card region '+item);
 }
 console.log('PASS Longform chapter row uses three explicit regions');
 const main=fs.readFileSync('main.js','utf8');
 for(const required of ['systemSpeechStatus(){',"view.dom.addEventListener('touchend'","grid-template-columns:36px"]){
  const haystack=required.includes('grid-')?css:main;
  assert.ok(haystack.includes(required),required);
 }
 console.log('PASS standalone bundle includes mobile fixes');
 const projectSource=fs.readFileSync('projects.js','utf8');
 assert.ok(projectSource.includes("row.style.setProperty('--writer-scene-depth'"));
 assert.ok(projectSource.includes("row.addClass('writer-project-scene-nested')"));
 assert.ok(projectSource.includes("cls:'writer-project-scene-branch',text:'↳'"));
 assert.ok(projectSource.includes("cls:'writer-project-scene-label',text:name"));
 assert.ok(css.includes('var(--writer-scene-depth,0) * 9px'));
 assert.ok(css.includes('.writer-project-scene-nested>.writer-project-scene-title'));
 console.log('PASS nested chapter depth is visible without shifting action controls');
 for(const expected of ["writer-v4-mobile-actions","writer-v4-format-actions",
  "text:writerUi('Aa Formatar'","text:'✦ IA'",
  "this.dom.toggleClass('writer-v4-expanded'","this.positionMobile()",
  "const viewportBottom=viewportTop+","this.dom.style.setProperty('top'"]){
  assert.ok(src.includes(expected),expected);
 }
 assert.ok(css.includes('.writer-v4-toolbar-mobile.writer-v4-expanded .writer-v4-format-actions'));
 assert.ok(css.includes('.writer-v4-toolbar-mobile .writer-v4-format-actions'));
 assert.ok(css.includes('display:none!important'));
 console.log('PASS mobile toolbar starts compact, expands formatting and follows selection');
})().catch(error=>{console.error(error);process.exitCode=1;});
