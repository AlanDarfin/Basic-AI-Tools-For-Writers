'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v4/integrations.js','utf8');
class Element{
 constructor(options={}){
  this.children=[];this.rows=[];this.attrs=options.attr||{};this.text=options.text||'';
  const classes=new Set((options.cls||'').split(' ').filter(Boolean)),styles=new Map();
  this.classList={add:key=>classes.add(key),remove:(...keys)=>keys.forEach(key=>classes.delete(key)),contains:key=>classes.has(key),toggle:(key,on)=>on?classes.add(key):classes.delete(key)};
  this.style={setProperty:(key,value)=>styles.set(key,value),removeProperty:key=>styles.delete(key),getPropertyValue:key=>styles.get(key)||''};
 }
 createDiv(options){const el=new Element(options);this.children.push(el);return el;}
 createEl(_tag,options){return this.createDiv(options);}
}
class Control{
 setValue(value){this.value=value;return this;}
 setLimits(...values){this.limits=values;return this;}
 setDynamicTooltip(){return this;}
 setDisabled(value){this.disabled=value;return this;}
 setButtonText(value){this.text=value;return this;}
 onChange(fn){this.change=fn;return this;}
 onClick(fn){this.click=fn;return this;}
}
class Setting{
 constructor(parent){parent.rows.push(this);this.controls=[];}
 setName(name){this.name=name;return this;}
 setDesc(desc){this.description=desc;return this;}
 addToggle(fn){return this.add(fn,'toggle');}
 addSlider(fn){return this.add(fn,'slider');}
 addButton(fn){return this.add(fn,'button');}
 add(fn,type){const control=new Control();control.type=type;this.controls.push(control);fn(control);return this;}
}
function setup({enabled=true,visible=true,options={},deferredScroll=false}={}){
 const body=new Element(),extensions=[],commands=[],cleanups=[],saved=[],signals={typing:0,pause:0,cancel:0};
 const sandbox={EditorSuggest:class{},TFile:class{},MarkdownView:class{},Notice:class{},Setting,console,
  document:{body},writerUi:(_pt,en)=>en,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules[id]!==false,
  EditorView:{updateListener:{of:listener=>({listener})},scrollIntoView:(position,options)=>({scroll:true,position,options})},
  ViewPlugin:{fromClass:(cls,spec)=>({cls,spec})},
  Decoration:{set:items=>items,line:options=>({range:from=>({from,...options})})},
  StateEffect:{define(){const type={of:()=>({is:other=>other===type})};return type;}},setTimeout,clearTimeout};
 const frames=[];if(deferredScroll)sandbox.requestAnimationFrame=callback=>frames.push(callback);
 const api=vm.runInNewContext(source+'\n({WriterV4Extras,writerV4ExtraMerge,writerV137TypewriterConfig,writerV137TypewriterSettings,writerV137TypewriterScrollOptions})',sandbox);
 const settings={visibleModules:{typewriter:visible},writerV4Extras:{comments:{'Book.md':[{body:'Keep'}]},typewriter:{enabled,...options}},aiKeys:{keep:'private'}};
 api.writerV4ExtraMerge(settings);
 const plugin={settings,app:{workspace:{on:()=>({}),getActiveFile:()=>null,getLeavesOfType:()=>[],getActiveViewOfType:()=>null},vault:{on:()=>({})}},
  writerReviewInteractionGuard:{isSuspended:()=>false,typing:()=>{signals.typing++;},pause:()=>{signals.pause++;}},
  writerCursorMemory:{cancelPendingForEditor:()=>{signals.cancel++;}},
  register:fn=>cleanups.push(fn),registerEvent:()=>{},registerEditorSuggest:()=>{},registerEditorExtension:extension=>extensions.push(extension),
  addCommand:command=>commands.push(command),saveSettings:async()=>{saved.push(JSON.parse(JSON.stringify(settings)));}};
 const extras=new api.WriterV4Extras(plugin);extras.register();
 const extension=extensions.find(e=>e.cls),listener=extensions.find(e=>e.listener).listener;
 function editor({height=400,lineHeight=20,ownBody=body}={}){
  const events=new Map(),dom=new Element();dom.ownerDocument={body:ownBody};
  dom.addEventListener=(name,fn)=>events.set(name,fn);dom.removeEventListener=(name,fn)=>{if(events.get(name)===fn)events.delete(name);};
  const selection=(anchor=2,head=anchor)=>{const main={anchor,head,empty:anchor===head};return {main,ranges:[main]};};
  const cm={dom,scrollDOM:{clientHeight:height},defaultLineHeight:lineHeight,hasFocus:true,
   state:{doc:{lineAt:position=>({from:position})},selection:selection()},scrolls:[],
   dispatch(tx){
    if(tx.selection)this.state.selection=selection(tx.selection.anchor,tx.selection.head??tx.selection.anchor);
    if(tx.effects?.scroll)this.scrolls.push(tx.effects);
    const update={view:this,state:this.state,docChanged:tx.docChanged===true,selectionSet:!!tx.selection,viewportChanged:false,focusChanged:!!tx.focusChanged,transactions:[{effects:tx.effects?[tx.effects]:[]}]};
    listener(update);this.instance?.update(update);
   }};
  const instance=new extension.cls(cm);cm.instance=instance;
  return {cm,instance,events,emit:(name,event={})=>events.get(name)?.(event),select:(anchor,head=anchor)=>cm.dispatch({selection:{anchor,head}})};
 }
 function settingsPanel(){const panel=new Element();api.writerV137TypewriterSettings(plugin,panel);return {panel,preview:panel.children.find(el=>el.classList.contains('writer-v137-typewriter-preview')),control:name=>panel.rows.find(row=>row.name===name)?.controls[0]};}
 return {api,plugin,extras,body,signals,commands,cleanups,saved,editor,settingsPanel,flushFrames:()=>frames.splice(0).forEach(callback=>callback())};
}
test('deferred follow waits for layout and discards stale selections or disabled features',()=>{
 const h=setup({deferredScroll:true}),e=h.editor();
 e.emit('keydown',{key:'a'});e.select(3);assert.equal(e.cm.scrolls.length,0);
 e.select(20);h.flushFrames();assert.equal(e.cm.scrolls.length,0);
 e.emit('beforeinput');e.cm.dispatch({docChanged:true});h.plugin.settings.visibleModules.typewriter=false;
 h.flushFrames();assert.equal(e.cm.scrolls.length,0);
 h.plugin.settings.visibleModules.typewriter=true;e.emit('keydown',{key:'b'});e.select(21);
 h.flushFrames();assert.equal(e.cm.scrolls.length,1);e.instance.destroy();
});
test('legacy typewriter options retain their values and gain bounded independent preferences',()=>{
 const h=setup({options:{centerPercent:.61,focusMode:true,custom:'keep',focusOpacity:7}});
 const cfg=h.api.writerV137TypewriterConfig(h.plugin);
 assert.equal(cfg.centerPercent,.61);assert.equal(cfg.focusMode,true);assert.equal(cfg.focusOpacity,.95);
 assert.equal(cfg.followCursor,true);assert.equal(cfg.highlightLine,true);assert.equal(cfg.custom,'keep');
 assert.equal(h.api.writerV137TypewriterConfig(h.plugin),cfg,'reading settings preserves callbacks’ references');
 cfg.centerPercent=NaN;cfg.focusOpacity=null;
 h.api.writerV137TypewriterConfig(h.plugin);assert.equal(cfg.centerPercent,.43);assert.equal(cfg.focusOpacity,.7);
 assert.equal(h.plugin.settings.writerV4Extras.comments['Book.md'][0].body,'Keep');
});
test('vertical position uses the actual editor viewport rather than the application height',()=>{
 const h=setup();
 const opts=(height,centerPercent)=>h.api.writerV137TypewriterScrollOptions({scrollDOM:{clientHeight:height},defaultLineHeight:20},{centerPercent});
 assert.equal(opts(400,.25).yMargin,90);assert.equal(opts(400,.75).yMargin,290);
 assert.equal(opts(200,.75).yMargin,140);assert.equal(opts(400,.25).y,'start');
 assert.equal(opts(0,.75).y,'center');
});
test('hidden or disabled typewriter leaves keyboard, pointer, composition and cursor restoration alone',()=>{
 for(const options of [{visible:false},{enabled:false}]){
  const h=setup(options),e=h.editor();
  e.emit('keydown',{key:'a'});e.emit('beforeinput');e.emit('compositionstart');
  e.emit('pointerdown',{target:{closest:()=>({})}});e.emit('touchstart',{target:{closest:()=>({})}});e.emit('wheel');
  e.select(20);e.cm.dispatch({docChanged:true});
  assert.deepEqual(h.signals,{typing:0,pause:0,cancel:0});assert.equal(e.cm.scrolls.length,0);
  assert.equal(e.instance.decorations.length,0);assert.equal(h.body.classList.contains('writer-v4-typewriter'),false);
  e.instance.destroy();
 }
});
test('following applies the configured position once per direct input, not later programmatic changes',()=>{
 const h=setup({options:{centerPercent:.25}}),e=h.editor();
 e.emit('keydown',{key:'a'});e.select(3);
 assert.equal(e.cm.scrolls.length,1);assert.equal(e.cm.scrolls[0].options.yMargin,90);
 e.select(50);e.cm.dispatch({docChanged:true});
 assert.equal(e.cm.scrolls.length,1,'restores and background editor changes cannot reuse a previous keyboard event');
 e.emit('beforeinput');e.cm.dispatch({docChanged:true});assert.equal(e.cm.scrolls.length,2);
 e.instance.destroy();
});
test('visual focus works independently when automatic following is turned off',()=>{
 const h=setup({options:{followCursor:false,focusMode:true,highlightLine:false}}),e=h.editor();
 e.emit('keydown',{key:'a'});e.select(7);
 assert.equal(e.cm.scrolls.length,0);assert.equal(e.instance.decorations.length,1);
 assert.equal(h.body.classList.contains('writer-v4-typewriter-focus'),true);
 assert.equal(h.body.classList.contains('writer-v137-typewriter-highlight'),false);
 h.plugin.settings.writerV4Extras.typewriter.followCursor=true;h.extras.updateTypewriterClass();e.select(10);
 assert.equal(e.cm.scrolls.length,0,'enabling follow cannot revive an earlier keystroke');
 e.instance.destroy();
});
test('text selections, multiple cursors and loss of focus suspend highlighting and recentering',()=>{
 const h=setup(),e=h.editor();
 e.emit('keydown',{key:'ArrowDown'});e.select(4);
 e.emit('keydown',{key:'ArrowRight',shiftKey:true});e.select(4,12);
 assert.equal(e.instance.decorations.length,0);assert.equal(e.cm.scrolls.length,1);
 e.select(15);e.emit('keydown',{key:'a'});e.cm.state.selection.ranges.push({anchor:20,head:20,empty:true});e.cm.dispatch({docChanged:true});
 assert.equal(e.instance.decorations.length,0);assert.equal(e.cm.scrolls.length,1);
 e.select(25);e.emit('keydown',{key:'a'});e.select(26);assert.equal(e.instance.decorations.length,1);
 e.cm.hasFocus=false;e.cm.dispatch({focusChanged:true});
 assert.equal(e.instance.decorations.length,0);assert.equal(e.cm.dom.classList.contains('writer-v4-typewriter-engaged'),false);
 e.instance.destroy();
});
test('disabling a visible module clears all editor markers and popout styles without changing preferences',()=>{
 const h=setup({options:{focusMode:true,focusOpacity:.8}}),popout=new Element(),a=h.editor(),b=h.editor({ownBody:popout});
 popout.style.setProperty('--unrelated','keep');a.emit('keydown',{key:'a'});b.emit('keydown',{key:'b'});
 assert.equal(popout.style.getPropertyValue('--writer-typewriter-focus-opacity'),'0.8');
 h.plugin.settings.visibleModules.typewriter=false;h.extras.updateTypewriterClass();
 for(const e of [a,b]){assert.equal(e.instance.decorations.length,0);assert.equal(e.cm.dom.classList.contains('writer-v4-typewriter-engaged'),false);}
 for(const body of [h.body,popout]){assert.equal(body.classList.contains('writer-v4-typewriter'),false);assert.equal(body.style.getPropertyValue('--writer-typewriter-focus-opacity'),'');}
 assert.equal(popout.style.getPropertyValue('--unrelated'),'keep');assert.equal(h.plugin.settings.writerV4Extras.typewriter.enabled,true);
 a.instance.destroy();b.instance.destroy();
});
test('settings callbacks edit the current preferences even if another normalizer replaced an old object',async()=>{
 const h=setup(),ui=h.settingsPanel();
 h.plugin.settings.writerV4Extras.typewriter={enabled:true,centerPercent:.4,focusMode:false};
 await ui.control('Writing line height').change(65);
 await ui.control('Dim other lines').change(true);await ui.control('Visibility of other lines').change(85);
 const cfg=h.plugin.settings.writerV4Extras.typewriter;
 assert.equal(cfg.centerPercent,.65);assert.equal(cfg.focusMode,true);assert.equal(cfg.focusOpacity,.85);
 assert.equal(ui.preview.classList.contains('is-focused'),true);assert.equal(ui.preview.style.getPropertyValue('--writer-typewriter-focus-opacity'),'0.85');
 assert.equal(h.saved.at(-1).writerV4Extras.typewriter.focusOpacity,.85);
});
test('restoring appearance keeps the enabled state, unrelated data and saved text intact',async()=>{
 const h=setup({enabled:false,options:{centerPercent:.7,focusMode:true,focusOpacity:.45,highlightLine:false,followCursor:false}}),ui=h.settingsPanel();
 await ui.control('Restore appearance and position').click();
 const cfg=h.plugin.settings.writerV4Extras.typewriter;
 assert.equal(cfg.enabled,false);assert.equal(cfg.centerPercent,.43);assert.equal(cfg.focusOpacity,.7);
 assert.equal(cfg.highlightLine,true);assert.equal(cfg.followCursor,true);assert.equal(cfg.focusMode,false);
 assert.equal(h.plugin.settings.aiKeys.keep,'private');assert.equal(h.plugin.settings.writerV4Extras.comments['Book.md'][0].body,'Keep');
 assert.equal(h.saved.length,1);assert.equal(ui.control('Writing line height').disabled,false);assert.equal(ui.control('Visibility of other lines').disabled,true);
});
test('typewriter commands respect module visibility and visual focus requires an enabled mode',()=>{
 const h=setup({visible:false}),toggle=h.commands.find(c=>c.id==='v4-toggle-typewriter'),focus=h.commands.find(c=>c.id==='v137-typewriter-focus');
 assert.equal(toggle.checkCallback(true),false);assert.equal(toggle.checkCallback(false),false);assert.equal(focus.checkCallback(true),false);
 assert.equal(h.saved.length,0);h.plugin.settings.visibleModules.typewriter=true;
 assert.equal(toggle.checkCallback(true),true);assert.equal(toggle.checkCallback(false),true);
 assert.equal(h.plugin.settings.writerV4Extras.typewriter.enabled,false);assert.equal(focus.checkCallback(true),false);
 toggle.checkCallback(false);focus.checkCallback(false);assert.equal(h.plugin.settings.writerV4Extras.typewriter.focusMode,true);
});
