'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const block=fs.readFileSync('src/v10/block-dragger.js','utf8');
const media=fs.readFileSync('src/v10/media-drag-extension.js','utf8');
const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
function load(source,apiNames,platformMobile=false){
 const context={
  console,
  require(name){
   if(name!=='obsidian')throw Error('Unexpected require: '+name);
   return {Platform:{isMobile:platformMobile},setIcon(){}};
  },
  writerUi:(pt,en)=>pt,Map,Set,Math,Number,String,Boolean,Array,Object,JSON,
  Setting:class{setName(){return this;}addToggle(fn){fn({setValue(){return this;},onChange(){return this;}});return this;}},Menu:class{},Modal:class{},Notice:class{}
 };
 return vm.runInNewContext(source+'\n({'+apiNames.join(',')+'})',context);
}
function mockPlugin(isMobile=false){
 const operations={created:0,commands:[],events:[],settings:[],cleanups:[]};
 const doc={
  body:{appendChild(){operations.created++;}},
  createElement(){operations.created++;return {style:{},setAttribute(){},addEventListener(){},classList:{add(){},remove(){}},replaceChildren(){},remove(){}};}
 };
 const plugin={
  app:{isMobile,workspace:{containerEl:{ownerDocument:doc},on(){operations.events.push('workspace');return {};}}},
  settings:{v106Dragger:{enabled:true,mobileLongPress:true}},
  registerDomEvent(){operations.events.push('dom');},
  registerEvent(){operations.events.push('event');},
  addCommand(command){operations.commands.push(command.id);},
  register(fn){operations.cleanups.push(fn);}
 };
 return {plugin,operations};
}
test('Android creates hidden non-overlapping grip for long-press drag',()=>{
 const {writerV106DragRegister}=load(block,['writerV106DragRegister'],true);
 const {plugin,operations}=mockPlugin(false);
 assert.doesNotThrow(()=>writerV106DragRegister(plugin));
 assert.equal(operations.created,4,'hidden handle and indicator are mounted');
 assert.ok(operations.commands.includes('v106-drag-move-block-up'));
 assert.ok(operations.events.includes('dom'));
 assert.equal(typeof plugin.writerV106DragApplyStyles,'function');
});
test('App mobile fallback supports hidden long-press grip',()=>{
 const {writerV106DragRegister}=load(block,['writerV106DragRegister'],false);
 const {plugin,operations}=mockPlugin(true);
 assert.doesNotThrow(()=>writerV106DragRegister(plugin));
 assert.equal(operations.created,4);
 assert.ok(operations.commands.includes('v106-drag-move-block-up'));
 assert.ok(operations.events.includes('dom'));
});
test('Mobile settings describe hidden grip and preserve desktop preferences',()=>{
 const {writerV106DragSettings}=load(block,['writerV106DragSettings'],true);
 const panel={headings:[],descriptions:[],
  createEl(tag,options){
   (tag==='h3'?this.headings:this.descriptions).push(options?.text);
   return {};
  }
 };
 const {plugin}=mockPlugin(true);
 assert.doesNotThrow(()=>writerV106DragSettings(plugin,panel));
 assert.equal(panel.headings.length,1);
 assert.equal(panel.descriptions.length,1);
 assert.match(panel.descriptions[0],/alça não aparece/);
 assert.equal(plugin.settings.v106Dragger.mobileLongPress,true);
 assert.equal(plugin.settings.v106Dragger.enabled,true,'Do not change desktop preference');
});
test('Desktop drag mechanics remain available, and CSS hides stray mobile handles',()=>{
 const {writerV106DragRegister}=load(block,['writerV106DragRegister'],false);
 const {plugin,operations}=mockPlugin(false);
 assert.doesNotThrow(()=>writerV106DragRegister(plugin));
 assert.ok(operations.created>=2);
 assert.ok(operations.commands.includes('v106-drag-move-block-up'));
 assert.ok(operations.events.includes('dom'));
 assert.match(css,/body\.is-mobile \.writer-v106-drag-handle/);
 assert.match(css,/body\.is-mobile \.writer-v106-drag-indicator\{display:none;pointer-events:none;\}/);
});
test('Media utilities remain on mobile without registering Dragger cross-note action',()=>{
 const match=/if\(require\('obsidian'\)\.Platform\?\.isMobile!==true&&plugin\.app\?\.isMobile!==true\)\{/;
 assert.match(media,match);
 assert.match(media,/id:'v107-move-block-to-note'/);
 assert.match(media,/id:'v107-insert-columns'/);
 assert.match(media,/id:'v107-pdf-pages'/);
});
