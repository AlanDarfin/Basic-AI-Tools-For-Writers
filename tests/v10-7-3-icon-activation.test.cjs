'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function makeElement(tag){
 const attributes={};
 return {
  tagName:tag,type:'',className:'',textContent:'',style:{},
  children:[],classList:{add(){},remove(){}},
  setAttribute(name,value){attributes[name]=value;},
  appendChild(child){this.children.push(child);return child;},
  replaceChildren(){this.children=[];},
  remove(){},contains(){return false;},
  querySelector(){return null;}
 };
}
function makeRuntime(iconFunction){
 const icons=[],listeners=[],commands=[],cleanup=[];
 const doc={
  body:makeElement('body'),
  createElement(tag){return makeElement(tag);}
 };
 const workspace={
  containerEl:{ownerDocument:doc,classList:{add(){},remove(){}}},
  on(name,callback){listeners.push(name);return {name,callback};},
  getActiveViewOfType(){return null;}
 };
 const obsidian={
  Platform:{isMobile:false},
  MarkdownView:class{},
  setIcon:iconFunction===false?undefined:(element,name)=>{
   icons.push(name);
   if(typeof iconFunction==='function')iconFunction(element,name);
  }
 };
 const plugin={
  app:{workspace},settings:{},
  registerDomEvent(el,type,callback){listeners.push(type);},
  registerEvent(event){},
  addCommand(command){commands.push(command.id);},
  register(callback){cleanup.push(callback);}
 };
 return {icons,listeners,commands,cleanup,doc,plugin,obsidian};
}
function loadModule(path,globals={}){
 const source=fs.readFileSync(path,'utf8');
 const context={
  require(name){if(name==='obsidian')return globals.obsidian;throw Error('Unexpected dependency: '+name);},
  console,Math,Number,Set,Map,JSON,Promise,
  setTimeout(fn){return 1;},clearTimeout(){},
  writerUi:(pt,en)=>en,
  ItemView:class{},TFile:class{},
  ...globals
 };
 return vm.runInNewContext(source+'\n({'+(
  path.includes('block-dragger')?'writerV106DragRegister,writerV106DragMerge':
  path.includes('discovery')?'writerV10DiscoverySetIcon':
  'writerV101RegisterEnhancements'
 )+'})',context);
}

test('Dragger startup renders its first icon through the Obsidian API, not a global',()=>{
 const env=makeRuntime();
 const api=loadModule('src/v10/block-dragger.js',{obsidian:env.obsidian});
 assert.doesNotThrow(()=>api.writerV106DragRegister(env.plugin));
 assert.deepEqual(env.icons,['grip']);
 assert.ok(env.commands.includes('v106-drag-move-block-up'));
 assert.ok(env.commands.includes('v106-drag-move-block-down'));
 assert.ok(env.listeners.includes('pointerdown'));
 assert.equal(typeof env.plugin.writerV106DragApplyStyles,'function');
 env.plugin.settings.v106Dragger.icon='grip-lines';
 env.plugin.writerV106DragApplyStyles();
 assert.deepEqual(env.icons,['grip','menu']);
 env.cleanup.forEach(fn=>fn());
});

test('Dragger falls back gracefully if setIcon is not available in older Obsidian',()=>{
 const env=makeRuntime(false);
 const api=loadModule('src/v10/block-dragger.js',{obsidian:env.obsidian});
 assert.doesNotThrow(()=>api.writerV106DragRegister(env.plugin));
 assert.deepEqual(env.icons,[]);
 assert.equal(env.doc.body.children[0].textContent,'⋮⋮');
 env.cleanup.forEach(fn=>fn());
});

test('Dragger does not create a handle, commands or listeners on Obsidian mobile',()=>{
 const env=makeRuntime();
 env.obsidian.Platform.isMobile=true;
 const api=loadModule('src/v10/block-dragger.js',{obsidian:env.obsidian});
 assert.doesNotThrow(()=>api.writerV106DragRegister(env.plugin));
 assert.equal(env.doc.body.children.length,0,'no overlay controls on mobile');
 assert.deepEqual(env.icons,[]);
 assert.deepEqual(env.listeners,[],'no editor pointer, long-press or touch listeners');
 assert.deepEqual(env.commands,[],'no unused Dragger commands in mobile palette');
 assert.equal(typeof env.plugin.writerV106DragApplyStyles,'undefined');
 assert.deepEqual(env.cleanup,[]);
 assert.equal(env.plugin.settings.v106Dragger.enabled,true,'desktop preferences are preserved');
});

test('Dragger also skips mobile if app.isMobile is true without Platform.isMobile',()=>{
 const env=makeRuntime();
 env.plugin.app.isMobile=true;
 const api=loadModule('src/v10/block-dragger.js',{obsidian:env.obsidian});
 assert.doesNotThrow(()=>api.writerV106DragRegister(env.plugin));
 assert.equal(env.doc.body.children.length,0);
 assert.deepEqual(env.listeners,[]);
 assert.deepEqual(env.commands,[]);
});

test('Related-notes/trash icon buttons also resolve setIcon explicitly',()=>{
 const env=makeRuntime();
 const api=loadModule('src/v10/discovery.js',{obsidian:env.obsidian});
 for(const name of ['link-2','refresh-cw','undo-2','trash-2','refresh-cw']){
  api.writerV10DiscoverySetIcon(makeElement('button'),name);
 }
 assert.deepEqual(env.icons,['link-2','refresh-cw','undo-2','trash-2','refresh-cw']);
 const source=fs.readFileSync('src/v10/discovery.js','utf8');
 assert.equal((source.match(/\bwriterV10DiscoverySetIcon\(/g)||[]).length,7);
 assert.equal((source.match(/(?<![\w.])setIcon\(/g)||[]).length,0);
});

test('Supplemental UI module crash does not abort core feature registration',()=>{
 const caught=[],registered=[],failing=()=>{throw Error('An optional UI failed');};
 const code=fs.readFileSync('src/v10/enhancements.js','utf8');
 const api=vm.runInNewContext(code+'\n({writerV101RegisterEnhancements})',{
  console:{error(...args){caught.push(args);}},
  writerUi:(pt,en)=>en,
  writerV101ReadingProgressRegister:failing,
  writerV106DragRegister:failing,
  writerV106HistoricRegister:failing,
  writerV10DiscoveryRegister:failing,
  writerV107RegisterAfterStartup:failing
 });
 const plugin={settings:{v101Suite:{enabled:true}},addCommand(command){registered.push(command.id);}};
 assert.doesNotThrow(()=>api.writerV101RegisterEnhancements(plugin));
 assert.equal(caught.length,5);
 for(const name of ['v101-validate-yaml','v101-preview-table-filter','v101-export-table-csv','v101-insert-footnote']){
  assert.ok(registered.includes(name),name+' must still register after addon failure');
 }
});

test('All active 10.6/10.7 UI icon calls are API-backed',()=>{
 const drag=fs.readFileSync('src/v10/block-dragger.js','utf8');
 const discovery=fs.readFileSync('src/v10/discovery.js','utf8');
 assert.match(drag,/setIcon:obsidianSetIcon/);
 assert.match(drag,/obsidianSetIcon\(handle/);
 assert.match(discovery,/require\('obsidian'\)\.setIcon/);
 assert.equal((drag.match(/(?<![\w.])setIcon\(/g)||[]).length,0);
 assert.equal((discovery.match(/(?<![\w.])setIcon\(/g)||[]).length,0);
});
