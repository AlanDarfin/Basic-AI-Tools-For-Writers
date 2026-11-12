'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Panel{
 constructor(){this.controls=new Map();}
 createEl(){return {setText(){}};}
}
class Setting{
 constructor(panel){this.panel=panel;this.name='';}
 setName(value){this.name=value;return this;}
 setDesc(){return this;}
 component(register){
  const field={value:null,change:null,
   setValue(value){this.value=value;return this;},setLimits(){return this;},
   setDynamicTooltip(){return this;},addOption(){return this;},
   setButtonText(){return this;},setCta(){return this;},
   onChange(callback){this.change=callback;return this;},onClick(){return this;}};
  register(field);this.panel.controls.set(this.name,field);return this;
 }
 addToggle(register){return this.component(register);}
 addSlider(register){return this.component(register);}
 addDropdown(register){return this.component(register);}
 addButton(register){return this.component(register);}
}
function runtime(initial={}){
 const sources=[
  'src/v10/suite-notion-1011.js','src/v10/suite-numbering-1011.js',
  'src/v11/numbering-extensions.js','src/v11/longform-studio.js',
  'src/v12/image-annotations.js'
 ].map(file=>fs.readFileSync(file,'utf8')).join('\n');
 const names=['writerV1011NotionCfg','writerV1011NotionSettings','writerV1011NotionRender',
  'writerV1011NumberCfg','writerV1011NumberSettings','writerV111NumberCfg',
  'writerV111NumberSettings','writerV111NumberLineSpecs','writerV111NumberRefresh',
  'writerV11Cfg','writerV11StudioSettings','writerV11ReviewList','writerV11AddReview',
  'writerV12AnnotationConfig','writerV12AnnotationSettings','writerV12AnnotatePick'];
 const notices=[];
 const api=vm.runInNewContext(sources+'\n({'+names.join(',')+'})',{
  Setting,console,writerUi:(_pt,en)=>en,writerV12On:()=>true,
  Notice:class{constructor(message){notices.push(message);}}
 });
 const snapshots=[],captions=[];
 const plugin={settings:structuredClone(initial),
  saveSettings:async()=>{snapshots.push(structuredClone(plugin.settings));},
  app:{isMobile:false,metadataCache:{getFileCache:()=>({})},workspace:{getLeavesOfType:()=>[
   {view:{file:{path:'Book/Chapter.md',extension:'md'},containerEl:{querySelector:()=>({classList:{toggle:(_cls,on)=>captions.push(on)}})}}}
  ]}}};
 return {api,plugin,snapshots,notices,captions};
}

test('database setting callbacks keep saving after a database block reads its configuration',async()=>{
 const h=runtime({v1011Notion:{enabled:true,maxShown:180,allowNew:true,futureOption:'kept'},v107AdvancedEnabled:false});
 const panel=new Panel();h.api.writerV1011NotionSettings(h.plugin,panel);
 const original=h.plugin.settings.v1011Notion;
 h.api.writerV1011NotionRender(h.plugin,'',{
  createDiv:()=>({setText:()=>{}})
 },{});
 await panel.controls.get('Allow creating notes from a view').change(false);
 h.api.writerV1011NotionCfg(h.plugin.settings);
 await panel.controls.get('Maximum visible items').change(260);
 await panel.controls.get('Enable additional views').change(false);
 assert.equal(h.plugin.settings.v1011Notion,original);
 assert.deepEqual(h.snapshots.at(-1).v1011Notion,{enabled:false,maxShown:260,allowNew:false,futureOption:'kept'});
});

test('heading-number settings survive editor lookups and changes on the same page',async()=>{
 const h=runtime({v1011Number:{enabled:true,virtual:false,captions:true,outline:true,scheme:'flat'}});
 const panel=new Panel();h.api.writerV1011NumberSettings(h.plugin,panel);
 h.api.writerV111NumberLineSpecs(h.plugin,null);
 await panel.controls.get('Virtual numbers in Reading View').change(true);
 h.api.writerV111NumberRefresh(h.plugin);
 await panel.controls.get('Highlight captions').change(false);
 await panel.controls.get('Number scheme').change('hierarchical');
 const cfg=h.snapshots.at(-1).v1011Number;
 assert.equal(cfg.virtual,true);assert.equal(cfg.captions,false);assert.equal(cfg.scheme,'hierarchical');
});

test('changing Live Preview numbering does not detach the caption-number control',async()=>{
 const h=runtime({v1011Number:{enabled:true,captions:true},v111Number:{livePreview:false,captionNumbers:false}});
 const panel=new Panel();h.api.writerV111NumberSettings(h.plugin,panel);
 await panel.controls.get('Heading numbers in Live Preview').change(true);
 await panel.controls.get('Number captions in Reading View').change(true);
 assert.equal(h.plugin.settings.v111Number.livePreview,true);
 assert.equal(h.plugin.settings.v111Number.captionNumbers,true);
 assert.equal(h.captions.at(-1),true);
 await panel.controls.get('Heading numbers in Live Preview').change(false);
 assert.equal(h.plugin.settings.v111Number.livePreview,false);
 assert.equal(h.plugin.settings.v111Number.captionNumbers,true);
});

test('book-writing fields keep saving after editorial notes and chapter lookups',async()=>{
 const h=runtime({v11Studio:{enabled:true,recoveryEnabled:false,chapterLimit:80,searchLimit:200,
  reviewNotes:{'Book/Chapter.md':[{text:'Existing note',at:'2026-01-01T00:00:00Z'}]},futureOption:'kept'}});
 const panel=new Panel();h.api.writerV11StudioSettings(h.plugin,panel);
 const reviewNotes=h.plugin.settings.v11Studio.reviewNotes;
 await h.api.writerV11AddReview(h.plugin,'Book/Chapter.md','New note');
 await panel.controls.get('Chapter editors per session').change(140);
 h.api.writerV11ReviewList(h.plugin,'Book/Chapter.md');
 await panel.controls.get('Maximum searched notes').change(500);
 await panel.controls.get('Enable continuous chapter writing').change(false);
 assert.equal(h.plugin.settings.v11Studio.reviewNotes,reviewNotes);
 const cfg=h.snapshots.at(-1).v11Studio;
 assert.equal(cfg.chapterLimit,140);assert.equal(cfg.searchLimit,500);assert.equal(cfg.enabled,false);
 assert.equal(cfg.recoveryEnabled,false);assert.equal(cfg.futureOption,'kept');
 assert.deepEqual(cfg.reviewNotes['Book/Chapter.md'].map(x=>x.text),['Existing note','New note']);
});

test('annotation controls keep saving after a mobile annotation availability check',async()=>{
 const h=runtime({v12Annotations:{maxDimension:1200,desktopOnly:true,futureOption:'kept'}});
 h.plugin.app.isMobile=true;
 const panel=new Panel();h.api.writerV12AnnotationSettings(h.plugin,panel);
 await panel.controls.get('Maximum PNG output dimension').change(1600);
 h.api.writerV12AnnotatePick(h.plugin);
 assert.equal(h.notices.at(-1),'Annotation disabled on mobile.');
 await panel.controls.get('Disable annotation on Android').change(false);
 assert.deepEqual(h.snapshots.at(-1).v12Annotations,{maxDimension:1600,desktopOnly:false,futureOption:'kept'});
});

test('normalizers retain existing limits and defaults when recovering malformed configurations',()=>{
 const h=runtime({v1011Notion:{maxShown:900},v1011Number:{scheme:'unknown'},
  v11Studio:{chapterLimit:900,searchLimit:4,reviewNotes:[]}});
 assert.equal(h.api.writerV1011NotionCfg(h.plugin.settings).maxShown,500);
 assert.equal(h.api.writerV1011NumberCfg(h.plugin.settings).scheme,'hierarchical');
 const cfg=h.api.writerV11Cfg(h.plugin.settings);
 assert.equal(cfg.chapterLimit,200);assert.equal(cfg.searchLimit,25);
 assert.equal(Array.isArray(cfg.reviewNotes),false);assert.equal(cfg.recoveryEnabled,true);
 for(const [key,getter] of [
  ['v1011Notion',()=>h.api.writerV1011NotionCfg(h.plugin.settings)],
  ['v1011Number',()=>h.api.writerV1011NumberCfg(h.plugin.settings)],
  ['v111Number',()=>h.api.writerV111NumberCfg(h.plugin.settings)],
  ['v11Studio',()=>h.api.writerV11Cfg(h.plugin.settings)],
  ['v12Annotations',()=>h.api.writerV12AnnotationConfig(h.plugin)]
 ]){
  h.plugin.settings[key]=[];
  const normalized=getter();assert.equal(Array.isArray(normalized),false,key);
  assert.equal(normalized,h.plugin.settings[key],key);
 }
});
