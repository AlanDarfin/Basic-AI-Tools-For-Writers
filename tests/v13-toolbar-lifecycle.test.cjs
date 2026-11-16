'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v9/context-toolbar.js','utf8');

function harness(){
 const timers=new Map(),posted=[],ready=[],cleanups=[],workspaceCallbacks=[],domCallbacks=[],observers=[],commands=new Map(),writes=[];
 let timerId=0,saves=0;
 class Element{
  constructor(options={}){
   this.children=[];this.events={};this.classes=new Set((options.cls||'').split(' ').filter(Boolean));this.attrs=options.attr||{};
   this.classList={add:(...names)=>names.forEach(name=>this.classes.add(name)),remove:(...names)=>names.forEach(name=>this.classes.delete(name)),
    toggle:(name,value)=>{if(value===undefined)value=!this.classes.has(name);if(value)this.classes.add(name);else this.classes.delete(name);return value;}};
   this.style={setProperty(){}};this.ownerDocument={defaultView:{MutationObserver:Observer}};
  }
  createEl(tag,options){const child=new Element(options);child.tag=tag;child.parentElement=this;this.children.push(child);return child;}
  createDiv(options){return this.createEl('div',options);}createSpan(options){return this.createEl('span',options);}
  addEventListener(type,callback){(this.events[type]??=[]).push(callback);}
  querySelector(){return null;}
  remove(){if(this.parentElement){const children=this.parentElement.children;children.splice(children.indexOf(this),1);this.parentElement=null;}}
 }
 class Observer{
  constructor(callback){this.callback=callback;observers.push(this);}
  observe(){this.active=true;}disconnect(){this.active=false;}
 }
 class MarkdownView{}
 const host=new Element(),editor={getSelection:()=> 'Selected writing',replaceSelection:value=>writes.push(value),focus(){}};
 const view=new MarkdownView();view.contentEl=host;view.editor=editor;view.mode='source';view.getMode=()=>view.mode;
 const settings={visibleModules:{formatToolbar:true},v9Toolbar:{enabledDesktop:true,enabledMobile:false,placement:'bottom',actions:['bold']}};
 const plugin={settings,app:{workspace:{getActiveViewOfType:()=>view,on(type,callback){const ref={type,callback};workspaceCallbacks.push(ref);return ref;},onLayoutReady:callback=>ready.push(callback)}},
  registerEvent(){},registerDomEvent(target,type,callback){domCallbacks.push({target,type,callback});},register:callback=>cleanups.push(callback),
  addCommand:command=>commands.set(command.id,command),saveSettings:async()=>{saves++;}};
 const api=vm.runInNewContext(source+'\nwriterV1044ContextMenus=()=>{};\n({writerV9RegisterToolbar,writerV9ToolbarMerge})',{
  MarkdownView,document:{},writerUi:(pt,en)=>en,writerModuleOn:(p,id)=>p.settings.visibleModules[id]!==false,
  writerV8HomeIsMobile:()=>false,require:()=>({setIcon(){}}),
  setTimeout:callback=>{const id=++timerId;timers.set(id,callback);posted.push(callback);return id;},clearTimeout:id=>timers.delete(id)
 });
 api.writerV9ToolbarMerge(settings);api.writerV9RegisterToolbar(plugin);
 const flush=()=>{for(const [id,callback] of [...timers]){timers.delete(id);callback();}};
 const unload=()=>{for(const callback of [...cleanups].reverse())callback();};
 return {plugin,host,editor,view,ready,observers,commands,timers,posted,workspaceCallbacks,domCallbacks,writes,flush,unload,saves:()=>saves};
}

test('unloading before layout ready prevents a delayed toolbar from resurrecting',()=>{
 const h=harness(),capturedRefresh=h.plugin.writerV9ToolbarRefresh;
 assert.equal(h.host.children.length,0);h.unload();
 assert.equal(h.plugin.writerV9ToolbarRefresh,null);
 h.ready[0]();capturedRefresh();h.flush();
 assert.equal(h.timers.size,0);assert.equal(h.host.children.length,0);assert.equal(h.observers.length,0);
});

test('unload cancels queued painting and rejects a timer callback already captured by the host',()=>{
 const h=harness();h.ready[0]();assert.equal(h.timers.size,1);
 const latePaint=h.posted[0];h.unload();assert.equal(h.timers.size,0);
 latePaint();h.ready[0]();h.flush();
 assert.equal(h.host.children.length,0);assert.equal(h.observers.length,0);assert.equal(h.timers.size,0);
});

test('late workspace, DOM, mode and action callbacks remain inert after removing a live toolbar',async()=>{
 const h=harness();h.ready[0]();h.flush();
 assert.equal(h.host.children.length,1);assert.equal(h.host.classes.has('writer-v9-toolbar-docked'),true);
 const bar=h.host.children[0],button=bar.children[0],capturedRefresh=h.plugin.writerV9ToolbarRefresh;
 button.events.click[0]();assert.deepEqual(h.writes,['**Selected writing**']);
 const oldModeObserver=h.observers[0];assert.equal(oldModeObserver.active,true);
 const wasEnabled=h.plugin.settings.v9Toolbar.enabledDesktop;
 h.unload();h.unload();
 assert.equal(h.host.children.length,0);assert.equal(h.host.classes.has('writer-v9-toolbar-host'),false);
 assert.equal(h.host.classes.has('writer-v9-toolbar-docked'),false);assert.equal(oldModeObserver.active,false);
 for(const ref of h.workspaceCallbacks)ref.callback();
 for(const ref of h.domCallbacks)ref.callback({target:h.host});
 h.view.mode='preview';oldModeObserver.callback();h.view.mode='source';oldModeObserver.callback();
 h.ready[0]();capturedRefresh();button.events.click[0]();
 h.commands.get('v9-format-bold').editorCallback(h.editor);
 await h.commands.get('v9-toggle-format-toolbar').callback();h.flush();
 assert.equal(h.host.children.length,0);assert.equal(h.timers.size,0);assert.equal(h.observers.length,1);
 assert.deepEqual(h.writes,['**Selected writing**']);assert.equal(h.saves(),0);
 assert.equal(h.plugin.settings.v9Toolbar.enabledDesktop,wasEnabled);
});

test('an older toolbar cleanup does not clear a replacement refresh callback',()=>{
 const h=harness(),replacement=()=>{};h.plugin.writerV9ToolbarRefresh=replacement;
 h.unload();assert.equal(h.plugin.writerV9ToolbarRefresh,replacement);
});
