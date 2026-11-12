'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/v13/companion-layout.js','utf8');
const load=extra=>vm.runInNewContext(source+'\n({writerCompanionRect,writerCompanionRectsOverlap,writerCompanionControlPlace,writerCompanionLayoutRegister})',extra||{});
const api=load();
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});

test('mobile controls clear the Basic toolbar and remain in their owning pane',()=>{
 const area=rect(8,48,374,600),button=rect(320,570,44,44),toolbar=rect(8,560,374,88);
 const result=api.writerCompanionControlPlace(button,area,[toolbar]);
 assert.ok(result);assert.equal(result.left,button.left);assert.equal(result.bottom,toolbar.top-8);
 assert.equal(api.writerCompanionRectsOverlap(result,toolbar,8),false);
 assert.ok(result.left>=area.left&&result.right<=area.right&&result.top>=area.top&&result.bottom<=area.bottom);
});
test('visual viewport and safe area bounds keep a player above the keyboard',()=>{
 const result=api.writerCompanionControlPlace(rect(46,570,320,160),rect(8,56,374,312),[]);
 assert.ok(result);assert.equal(result.bottom,368);assert.equal(result.left,46);
});
test('narrow panes never relocate a large control into another editor',()=>{
 assert.equal(api.writerCompanionControlPlace(rect(20,20,320,160),rect(8,8,280,200),[]),null);
 assert.equal(api.writerCompanionControlPlace(rect(20,20,44,44),rect(8,8,100,100),[rect(8,8,100,100)]),null);
 assert.equal(api.writerCompanionRect({left:NaN,top:0,width:44,height:44}),null);
});
test('right Snailkit rail reserves its space before the Toolkit fullscreen control',()=>{
 const rail=rect(330,64,38,200),button=rect(328,64,44,44),area=rect(8,48,374,600);
 const result=api.writerCompanionControlPlace(button,area,[rail]);
 assert.ok(result);assert.equal(api.writerCompanionRectsOverlap(result,rail,8),false);
 assert.ok(result.right<=rail.left-8||result.top>=rail.bottom+8);
});
function harness(){
 const listeners=[],cleanup=[],observers=[],frames=new Map();let frameId=0;
 const classes=initial=>{const set=new Set(initial);return {contains:name=>set.has(name),add:(...names)=>names.forEach(name=>set.add(name)),remove:(...names)=>names.forEach(name=>set.delete(name)),set};};
 const style=()=>{const values=new Map();return {getPropertyValue:key=>values.get(key)?.value||'',getPropertyPriority:key=>values.get(key)?.priority||'',setProperty:(key,value,priority='')=>values.set(key,{value,priority}),removeProperty:key=>values.delete(key)};};
 const element=(name,bounds)=>({nodeType:1,name,style:style(),classList:classes([name]),
  getBoundingClientRect(){const raw={...bounds};const maximum=parseFloat(this.style.getPropertyValue('max-width'));if(maximum)raw.width=Math.min(raw.width,maximum);const maxHeight=parseFloat(this.style.getPropertyValue('max-height'));if(maxHeight)raw.height=Math.min(raw.height,maxHeight);return rect(raw.left,raw.top,raw.width,raw.height);},
  matches(selector){return selector.split(',').some(s=>s.trim().split('.').filter(Boolean).every(part=>this.classList.contains(part)));},closest(){return null;},remove(){},querySelector(){return null;}});
 const rail=element('sk-note-rail',rect(330,64,38,200)),button=element('fs-float-btn',rect(328,64,44,44));
 const player=element('fk-tts-player',rect(-20,500,320,160)),fab=element('sk-tasks-fab',rect(220,560,58,58));
 button.style.setProperty('--writer-companion-x','7px','important');
 const row=element('nav-file-title',rect(0,0,200,24)),basicIcon=element('writer-v9-explorer-icon',rect(0,0,16,16)),nativeIcon=element('ft-icon',rect(0,0,16,16));
 row.querySelector=selector=>selector.includes('.ft-icon')?nativeIcon:selector.includes('.writer-v9-explorer-icon')?basicIcon:null;
 const addListeners=target=>{target.addEventListener=(type,handler,options)=>listeners.push({target,type,handler,options});target.removeEventListener=(type,handler)=>{const index=listeners.findIndex(x=>x.target===target&&x.type===type&&x.handler===handler);if(index>=0)listeners.splice(index,1);};};
 const win={innerWidth:300,innerHeight:700,visualViewport:{offsetLeft:0,offsetTop:0,width:300,height:400},
  getComputedStyle:el=>({display:'block',visibility:'visible',opacity:'1',translate:'none',paddingTop:'0px',paddingRight:'0px',paddingBottom:'0px',paddingLeft:'0px'}),
  requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
  MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}}};
 addListeners(win);addListeners(win.visualViewport);
 const doc={defaultView:win,body:{classList:classes(['is-mobile']),appendChild(){}},createElement:()=>element('probe',rect(0,0,1,1)),
  querySelectorAll:selector=>[button,player,rail,fab].filter(el=>el.matches(selector))};addListeners(doc);
 const plugin={settings:{companionCompatibility:{enabledById:{snailkit:true,'ahmed-toolkit':true},mobileLayout:true,explorerIcons:'companion'}},
  app:{isMobile:true,plugins:{plugins:{snailkit:{},'ahmed-toolkit':{}}},workspace:{containerEl:{ownerDocument:doc},getLeavesOfType:()=>[{view:{containerEl:{querySelectorAll:()=>[row]}}}]}},register:fn=>cleanup.push(fn)};
 const gate=(p,id)=>Boolean(p.settings.companionCompatibility.enabledById[id]&&p.app.plugins.plugins[id]);
 const manager=load({writerCompanionEnabled:gate}).writerCompanionLayoutRegister(plugin);
 return {plugin,manager,win,doc,button,player,rail,fab,row,basicIcon,nativeIcon,listeners,frames,observers,cleanup};
}
test('layout resize is reversible and duplicate explorer icons preserve both owners',()=>{
 const h=harness();h.manager.refresh();
 assert.ok(h.row.classList.contains('writer-companion-icon-toolkit'));
 assert.ok(h.player.classList.contains('writer-companion-managed'));
 assert.equal(h.player.style.getPropertyValue('max-width'),'284px');
 assert.equal(h.player.style.getPropertyValue('top'),'232px');
 assert.equal(h.player.style.getPropertyValue('left'),'8px');
 assert.equal(h.player.style.getPropertyValue('--writer-companion-y'),'');
 assert.ok(h.button.classList.contains('writer-companion-managed'));
 h.plugin.settings.companionCompatibility.explorerIcons='basic';h.manager.refresh();
 assert.ok(h.row.classList.contains('writer-companion-icon-basic'));
 assert.equal(h.row.classList.contains('writer-companion-icon-toolkit'),false);
 assert.equal(h.row.querySelector(':scope > .ft-icon'),h.nativeIcon);
 assert.equal(h.row.querySelector(':scope > .writer-v9-explorer-icon'),h.basicIcon);
 h.plugin.settings.companionCompatibility.enabledById['ahmed-toolkit']=false;h.manager.refresh();
 assert.equal(h.row.classList.contains('writer-companion-icon-basic'),false);
 assert.equal(h.player.style.getPropertyValue('max-width'),'');
 assert.equal(h.player.classList.contains('writer-companion-managed'),false);
 assert.equal(h.button.style.getPropertyValue('--writer-companion-x'),'7px');
 assert.equal(h.button.style.getPropertyPriority('--writer-companion-x'),'important');
});
test('disable/unload removes observers, pending animation and every owned adjustment',()=>{
 const h=harness();h.manager.refresh();
 h.plugin.settings.companionCompatibility.mobileLayout=false;h.manager.refresh();
 assert.equal(h.rail.classList.contains('writer-companion-managed'),false);
 assert.equal(h.player.style.getPropertyValue('max-width'),'');
 h.manager.stop();h.manager.stop();
 assert.equal(h.listeners.length,0);assert.equal(h.frames.size,0);assert.equal(h.observers[0].active,false);
 assert.equal(h.row.classList.contains('writer-companion-icon-toolkit'),false);
});
test('layout does not overwrite a styling change made by a native owner',()=>{
 const h=harness();h.manager.refresh();h.button.style.setProperty('--writer-companion-x','23px');h.manager.stop();
 assert.equal(h.button.style.getPropertyValue('--writer-companion-x'),'23px');
});

test('Snailkit rail keeps its native panel anchor and task fan stays pinned while open',()=>{
 const h=harness();h.manager.refresh();
 assert.equal(h.rail.classList.contains('writer-companion-managed'),false);
 const offset=h.fab.style.getPropertyValue('--writer-companion-y');
 assert.notEqual(offset,'');
 h.fab.classList.add('is-fan');h.win.visualViewport.height=360;h.manager.refresh();
 assert.equal(h.fab.style.getPropertyValue('--writer-companion-y'),offset);
 h.plugin.settings.companionCompatibility.mobileLayout=false;h.manager.refresh();
 assert.equal(h.fab.style.getPropertyValue('--writer-companion-y'),'');
 assert.equal(h.fab.classList.contains('writer-companion-managed'),false);
});
test('a native player drag owns its chosen coordinates after compatibility is disabled',()=>{
 const h=harness();h.manager.refresh();
 const header={closest:selector=>selector==='.fk-tts-player'?h.player:selector.includes('.fk-tts-header')?header:null};
 h.listeners.find(x=>x.type==='pointerdown').handler({target:header});
 h.player.style.setProperty('left','18px');h.player.style.setProperty('top','120px');
 h.plugin.settings.companionCompatibility.mobileLayout=false;
 h.listeners.find(x=>x.type==='pointerup').handler();h.manager.refresh();
 assert.equal(h.player.style.getPropertyValue('left'),'18px');
 assert.equal(h.player.style.getPropertyValue('top'),'120px');
 assert.equal(h.player.style.getPropertyValue('max-width'),'');
});

test('a short keyboard viewport keeps native playback controls scrollable',()=>{
 const h=harness();h.win.visualViewport.height=140;h.manager.refresh();
 assert.equal(h.player.style.getPropertyValue('max-height'),'124px');
 assert.equal(h.player.style.getPropertyValue('overflow-y'),'auto');
 assert.equal(h.player.style.getPropertyValue('top'),'8px');
 h.manager.stop();
 assert.equal(h.player.style.getPropertyValue('max-height'),'');
 assert.equal(h.player.style.getPropertyValue('overflow-y'),'');
});
