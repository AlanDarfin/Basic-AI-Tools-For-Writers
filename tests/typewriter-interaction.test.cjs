'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const extensions=[],commands=[],handlers={};
const classes=new Set();
const body={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name),remove:(...names)=>names.forEach(n=>classes.delete(n))}};
const effects={define(){const def={of:()=>({is:x=>x===def})};return def;}};
const Decoration={
 set:items=>items,
 line:({class:cls})=>({range:from=>({class:cls,from})})
};
const EditorView={
 updateListener:{of:listener=>({listener})},
 scrollIntoView:(pos,options)=>({type:'scrollIntoView',pos,options})
};
const ViewPlugin={fromClass:(cls,spec)=>({cls,spec})};
const sandbox={
 module:{exports:{}},EditorSuggest:class{constructor(app){this.app=app;}},
 EditorView,ViewPlugin,Decoration,StateEffect:effects,
 writerModuleOn:()=>true,writerUi:(pt,en)=>en,Notice:class{},TFile:class{},MarkdownView:class{},
 console,document:{body},setTimeout,clearTimeout
};
const src=fs.readFileSync('src/v4/integrations.js','utf8');
const {WriterV4Extras,writerV4ExtraMerge}=vm.runInNewContext(
 src+'\n({WriterV4Extras,writerV4ExtraMerge})',sandbox);
const settings={};writerV4ExtraMerge(settings);settings.writerV4Extras.typewriter.enabled=true;
let pendingCancels=0;
const plugin={
 settings,app:{
  workspace:{on:(name,fn)=>{handlers[name]=fn;return{};},getActiveFile:()=>null,getLeavesOfType:()=>[],getActiveViewOfType:()=>null},
  vault:{on:()=>({})}
 },
 writerCursorMemory:{cancelPendingForEditor:()=>{pendingCancels++;}},
 saveSettings:async()=>{},register:()=>{},
 registerEvent:()=>{},registerEditorSuggest:()=>{},registerEditorExtension:extension=>extensions.push(extension),
 addCommand:command=>commands.push(command)
};
const extras=new WriterV4Extras(plugin);extras.register();
const pluginExtension=extensions.find(x=>x.cls),updateExtension=extensions.find(x=>x.listener);
assert.ok(pluginExtension&&updateExtension);
function editor(){
 const listeners=new Map(),marked=new Set();
 const dom={
  classList:{toggle:(name,yes)=>yes?marked.add(name):marked.delete(name),remove:name=>marked.delete(name)},
  addEventListener:(name,fn)=>listeners.set(name,fn),
  removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);},
  emit:(name,evt={})=>listeners.get(name)?.(evt)
 };
 const cm={
  dom,hasFocus:true,state:{doc:{lineAt:()=>({from:0})},selection:{main:{head:2}}},
  transactions:[],scrollCalls:0,
  dispatch(tx){
   this.transactions.push(tx);
   const update={view:this,state:this.state,docChanged:false,selectionSet:!!tx.selection,
    viewportChanged:false,focusChanged:false,transactions:[{effects:tx.effects?[tx.effects]:[]}]};
   updateExtension.listener(update);
   this.pluginInstance.update(update);
   if(tx.effects?.type==='scrollIntoView')this.scrollCalls++;
  }
 };
 const widget=new pluginExtension.cls(cm);cm.pluginInstance=widget;
 return {cm,dom,widget,marked,listeners};
}
test('opening and restoring selection cannot enable the highlight or recenter editor',()=>{
 const {cm,widget,marked}=editor();
 assert.equal(widget.decorations.length,0);
 cm.dispatch({selection:{anchor:9}});
 assert.equal(widget.decorations.length,0);
 assert.equal(cm.scrollCalls,0);
 assert.equal(marked.has('writer-v4-typewriter-engaged'),false);
 widget.destroy();
});
test('keyboard and pointer actions enable highlight, wheel disables it until next interaction',()=>{
 const {cm,dom,widget,marked,listeners}=editor();
 dom.emit('keydown',{key:'Shift'});
 assert.equal(widget.decorations.length,0);
 dom.emit('pointerdown',{target:{closest:()=>null}});
 assert.equal(widget.decorations.length,0);
 dom.emit('pointerdown',{target:{closest:selector=>selector==='.cm-scroller'?{}:null}});
 assert.equal(widget.decorations.length,1);
 assert.equal(marked.has('writer-v4-typewriter-engaged'),true);
 assert.equal(extras.typewriterActiveViews.has(cm),true);
 cm.dispatch({selection:{anchor:11}});
 assert.equal(cm.scrollCalls,1,'Recenter only after deliberate editor interaction');
 dom.emit('wheel',{deltaY:100});
 assert.equal(widget.decorations.length,0);
 assert.equal(marked.has('writer-v4-typewriter-engaged'),false);
 assert.equal(extras.typewriterActiveViews.has(cm),false);
 const prev=cm.scrollCalls;
 cm.dispatch({selection:{anchor:22}});
 assert.equal(cm.scrollCalls,prev,'No recenter after a wheel gesture');
 assert.equal(widget.decorations.length,0);
 dom.emit('keydown',{key:'a'});
 assert.equal(widget.decorations.length,1,'Re-enable only on a subsequent real edit');
 assert.ok(pendingCancels>=3,'Real pointer, keyboard and wheel events cancel pending cursor restores');
 widget.destroy();
 assert.equal(listeners.size,0,'Unregister event listeners when the editor closes');
});
test('multiple editor views are independent and disabling mode clears activation',()=>{
 const a=editor(),b=editor();
 a.dom.emit('keydown',{key:'a'});
 assert.equal(a.widget.decorations.length,1);
 assert.equal(b.widget.decorations.length,0);
 b.dom.emit('keydown',{key:'b'});
 a.dom.emit('wheel',{deltaY:-80});
 assert.equal(a.widget.decorations.length,0);
 assert.equal(b.widget.decorations.length,1);
 settings.writerV4Extras.typewriter.enabled=false;
 extras.resetTypewriterHighlights();
 extras.updateTypewriterClass();
 assert.equal(a.widget.decorations.length,0);
 assert.equal(b.widget.decorations.length,0);
 settings.writerV4Extras.typewriter.enabled=true;
 extras.updateTypewriterClass();
 assert.equal(b.widget.decorations.length,0,'Enabling mode again must not restore stale highlight');
 a.widget.destroy();b.widget.destroy();
});
test('CSS gates highlight and focus dimming by an explicitly engaged editor',()=>{
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/body\.writer-v4-typewriter \.cm-editor\.writer-v4-typewriter-engaged \.cm-line\.writer-v4-typewriter-current-line/);
 assert.match(css,/body\.writer-v4-typewriter-focus \.cm-editor\.writer-v4-typewriter-engaged \.cm-line:not/);
 assert.ok(fs.readFileSync('main.js','utf8').includes('cancelPendingForEditor'));
});

test('Android tap and virtual keyboard enable the highlight without programmatic focus',()=>{
 const a=editor();
 assert.equal(a.widget.decorations.length,0);
 a.dom.emit('touchstart',{target:{closest:selector=>selector==='.cm-scroller'?{}:null}});
 assert.equal(a.widget.decorations.length,1,'A touch activates the current editor line');
 a.dom.emit('touchmove',{});
 assert.equal(a.widget.decorations.length,0,'Scrolling by touch suspends Typewriter mode');
 a.dom.emit('beforeinput',{inputType:'insertText',data:'á'});
 assert.equal(a.widget.decorations.length,1,'Virtual keyboard input re-enables it');
 a.dom.emit('touchmove',{});
 a.dom.emit('compositionstart',{data:''});
 assert.equal(a.widget.decorations.length,1,'IME composition also counts as user input');
 a.widget.destroy();
 assert.equal(a.listeners.size,0,'Mobile gesture listeners are cleaned up');
});
