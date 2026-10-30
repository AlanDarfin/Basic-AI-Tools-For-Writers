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
 assert.ok(projectSource.includes("row.dataset.depth=String(level)"));
 assert.ok(projectSource.includes("row.style.setProperty('--writer-scene-indent'"));
 assert.ok(projectSource.includes("writer-project-scene-depth-mark"));
 assert.ok(css.includes("var(--writer-scene-indent,0px)"));
 assert.ok(css.includes(".writer-project-scene-depth-mark"));
 console.log('PASS nested chapter depth indicators are rendered without changing control columns');
 const ui=vm.runInNewContext(fs.readFileSync('src/v4/integrations.js','utf8')+'\n({writerV4ExtraMerge,writerV4FormatText})',{
  EditorSuggest:class{},console
 });
 const legacy={writerV4Extras:{toolbar:{enabled:true}}};
 ui.writerV4ExtraMerge(legacy);
 assert.equal(legacy.writerV4Extras.toolbar.mobileMode,'native');
 assert.equal(legacy.writerV4Extras.toolbar.mobileModeConfirmed,true);
 const opting={writerV4Extras:{toolbar:{enabled:true,mobileMode:'floating'}}};
 ui.writerV4ExtraMerge(opting);
 assert.equal(opting.writerV4Extras.toolbar.mobileMode,'native');
 const native={writerV4Extras:{toolbar:{enabled:true,mobileMode:'native',mobileModeConfirmed:true}}};
 ui.writerV4ExtraMerge(native);
 assert.equal(native.writerV4Extras.toolbar.mobileMode,'native');
 assert.equal(ui.writerV4FormatText('Palavra','bold'),'**Palavra**');
 assert.equal(ui.writerV4FormatText('Um\nDois','quote'),'> Um\n> Dois');
 assert.equal(ui.writerV4FormatText('Palavra','link'),'[Palavra](https://example.com)');
 const extras=fs.readFileSync('src/v4/integrations.js','utf8');
 assert.ok(extras.includes("id:'v4-editing-toolbar'"));
 assert.ok(extras.includes("!owner.config.toolbar.enabled||this.isMobile"));
 for(const marker of ["id:'v4-format-'","id:'v4-writing-'","this.applyEditorFormat(editor,kind)","this.runEditorAIAction(editor,key)"]){
  assert.ok(extras.includes(marker),marker);
 }
 for(const marker of [".setting-item:has(.checkbox-container)","grid-template-columns:minmax(0,1fr) auto",
    ".writer-v4-toolbar-mobile.writer-v4-expanded .writer-v4-format-actions"]){
  assert.ok(css.includes(marker),marker);
 }
 assert.ok(css.includes('writer-v4-editor-command-grid')||fs.readFileSync('styles.css','utf8').includes('writer-v4-editor-command-grid'));
 console.log('PASS native Obsidian mobile toolbar commands and no duplicate floating controls');
})().catch(error=>{console.error(error);process.exitCode=1;});
