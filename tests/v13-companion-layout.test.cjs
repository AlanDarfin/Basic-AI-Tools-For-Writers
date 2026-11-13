'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/v13/companion-layout.js','utf8');
const load=extra=>vm.runInNewContext(source+'\n({writerCompanionRect,writerCompanionRectsOverlap,writerCompanionControlPlace,writerCompanionCompactPlace,writerCompanionRectsUnion,writerCompanionLayoutAllowed,writerCompanionLayoutRegister})',extra||{});
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
 const listeners=[],cleanup=[],observers=[],frames=new Map(),elements=[];let frameId=0;
 const classes=initial=>{const set=new Set(initial);return {contains:name=>set.has(name),add:(...names)=>names.forEach(name=>set.add(name)),remove:(...names)=>names.forEach(name=>set.delete(name)),set};};
 const style=()=>{const values=new Map();return {values,getPropertyValue:key=>values.get(key)?.value||'',getPropertyPriority:key=>values.get(key)?.priority||'',setProperty:(key,value,priority='')=>values.set(key,{value,priority}),removeProperty:key=>values.delete(key)};};
 const element=(name,bounds,parent=null)=>{
  const el={nodeType:1,name,parentElement:parent,children:[],attrs:new Map(),style:style(),classList:classes([name]),nativeVisibility:'visible',nativeDisplay:'block',bounds:{...bounds},
   getBoundingClientRect(){const raw={...this.bounds};for(const [prop,side] of [['left','left'],['top','top']]){const value=this.style.getPropertyValue(prop);if(value&&value!=='auto')raw[side]=parseFloat(value);}
    const maximum=parseFloat(this.style.getPropertyValue('max-width'));if(maximum)raw.width=Math.min(raw.width,maximum);const maxHeight=parseFloat(this.style.getPropertyValue('max-height'));if(maxHeight)raw.height=Math.min(raw.height,maxHeight);
    let node=this;while(node){raw.left+=parseFloat(node.style?.getPropertyValue('--writer-companion-x'))||0;raw.top+=parseFloat(node.style?.getPropertyValue('--writer-companion-y'))||0;node=node.parentElement;}return rect(raw.left,raw.top,raw.width,raw.height);},
   matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s==='[popover]')return this.attrs.has('popover');return s.startsWith('.')&&s.split('.').filter(Boolean).every(part=>this.classList.contains(part));});},
   closest(selector){let node=this;while(node){if(node.matches?.(selector))return node;node=node.parentElement;}return null;},
   contains(other){let node=other;while(node){if(node===this)return true;node=node.parentElement;}return false;},
   getAttribute(key){if(key==='class')return [...this.classList.set].join(' ');if(key==='style')return [...this.style.values].map(([k,v])=>k+':'+v.value+'!'+v.priority).join(';');return this.attrs.get(key)??null;},
   setAttribute(key,value){this.attrs.set(key,value);},removeAttribute(key){this.attrs.delete(key);},remove(){const index=elements.indexOf(this);if(index>=0)elements.splice(index,1);},
   querySelectorAll(selector){return elements.filter(item=>item!==this&&this.contains(item)&&item.matches(selector));},querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  };if(parent)parent.children.push(el);elements.push(el);return el;
 };
 const rail=element('sk-note-rail',rect(330,64,38,200)),button=element('fs-float-btn',rect(328,64,44,44));
 const player=element('fk-tts-player',rect(-20,500,320,160)),fab=element('sk-tasks-fab',rect(220,560,58,58));
 button.style.setProperty('--writer-companion-x','7px','important');
 const row=element('nav-file-title',rect(0,0,200,24)),basicIcon=element('writer-v9-explorer-icon',rect(0,0,16,16)),nativeIcon=element('ft-icon',rect(0,0,16,16));
 row.querySelector=selector=>selector.includes('.ft-icon')?nativeIcon:selector.includes('.writer-v9-explorer-icon')?basicIcon:null;
 const addListeners=target=>{target.addEventListener=(type,handler,options)=>listeners.push({target,type,handler,options});target.removeEventListener=(type,handler)=>{const index=listeners.findIndex(x=>x.target===target&&x.type===type&&x.handler===handler);if(index>=0)listeners.splice(index,1);};};
 const win={innerWidth:300,innerHeight:700,visualViewport:{offsetLeft:0,offsetTop:0,width:300,height:400},events:[],Event:class{constructor(type){this.type=type;}},dispatchEvent(event){this.events.push(event.type);for(const listener of [...listeners])if(listener.target===this&&listener.type===event.type)listener.handler(event);},
  getComputedStyle:el=>({display:el.nativeDisplay||'block',visibility:el.style.getPropertyValue('visibility')||el.nativeVisibility||'visible',opacity:'1',pointerEvents:el.style.getPropertyValue('pointer-events')||'auto',translate:'none',paddingTop:'0px',paddingRight:'0px',paddingBottom:'0px',paddingLeft:'0px'}),
  requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
  MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(target,options){this.active=true;this.options=options;}disconnect(){this.active=false;}}};
 addListeners(win);addListeners(win.visualViewport);
 const body=element('is-mobile',rect(0,0,300,700));body.classList=classes(['is-mobile']);body.appendChild=()=>{};
 const doc={defaultView:win,body,createElement:()=>element('probe',rect(0,0,1,1)),querySelectorAll:selector=>elements.filter(el=>el.matches(selector))};addListeners(doc);
 const plugin={settings:{companionCompatibility:{enabledById:{snailkit:true,'ahmed-toolkit':true},mobileLayout:true,explorerIcons:'companion'}},
  app:{isMobile:true,plugins:{plugins:{snailkit:{},'ahmed-toolkit':{}}},workspace:{containerEl:{ownerDocument:doc},getLeavesOfType:()=>[{view:{containerEl:{querySelectorAll:()=>[row]}}}]}},register:fn=>cleanup.push(fn)};
 const manager=load().writerCompanionLayoutRegister(plugin);
 return {plugin,manager,win,doc,button,player,rail,fab,row,basicIcon,nativeIcon,listeners,frames,observers,cleanup,element,elements};
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

test('an open native task fan preserves its own SVG anchor and hides competing players',()=>{
 const h=harness();h.manager.refresh();
 h.fab.classList.add('is-fan');const fan=h.element('sk-tasks-fan',rect(0,0,300,400));
 h.manager.refresh();const anchor=h.fab.getBoundingClientRect();
 assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');assert.equal(h.player.getAttribute('aria-hidden'),'true');
 assert.equal(h.rail.style.getPropertyValue('visibility'),'hidden');assert.ok(h.win.events.includes('resize'));
 const events=h.win.events.length;h.manager.refresh();assert.equal(h.win.events.length,events);
 assert.equal(h.fab.getBoundingClientRect().left,anchor.left);assert.equal(h.fab.getBoundingClientRect().top,anchor.top);
 assert.match(fan.style.getPropertyValue('clip-path'),/^inset\(/);
 h.plugin.settings.companionCompatibility.mobileLayout=false;h.manager.refresh();
 assert.equal(h.fab.style.getPropertyValue('--writer-companion-y'),'');assert.equal(h.player.style.getPropertyValue('visibility'),'');
 assert.equal(h.player.getAttribute('aria-hidden'),null);assert.equal(fan.style.getPropertyValue('clip-path'),'');
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

test('passive layout still protects the screen with quick actions and command integrations disabled',()=>{
 const h=harness();h.plugin.settings.v12Toolkit={enabled:false,integrations:false};h.manager.refresh();
 assert.equal(h.player.style.getPropertyValue('left'),'8px');assert.equal(h.player.style.getPropertyValue('top'),'232px');
 assert.equal(api.writerCompanionLayoutAllowed(h.plugin,'ahmed-toolkit'),true);
 h.plugin.settings.companionCompatibility.enabledById['ahmed-toolkit']=false;h.manager.refresh();
 assert.equal(h.player.style.getPropertyValue('left'),'');assert.equal(h.player.style.getPropertyValue('top'),'');
 assert.equal(api.writerCompanionLayoutAllowed(h.plugin,'ahmed-toolkit'),false);
});

test('native menus suspend even a top-layer Snailkit popover and restore original visibility and accessibility',()=>{
 const h=harness(),popup=h.element('sk-pins-popup',rect(20,40,220,130));popup.setAttribute('popover','manual');popup.setAttribute('aria-hidden','false');
 const nativeMenu=h.element('menu',rect(20,120,250,220));h.manager.refresh();
 for(const el of [h.player,h.button,h.rail,h.fab,popup]){
  assert.equal(el.style.getPropertyValue('visibility'),'hidden');assert.equal(el.style.getPropertyValue('pointer-events'),'none');assert.equal(el.getAttribute('aria-hidden'),'true');
 }
 assert.equal(popup.getAttribute('popover'),'manual');assert.equal(popup.parentElement,null);
 nativeMenu.nativeDisplay='none';h.manager.refresh();
 assert.equal(popup.style.getPropertyValue('visibility'),'');assert.equal(popup.style.getPropertyValue('pointer-events'),'');assert.equal(popup.getAttribute('aria-hidden'),'false');
 assert.equal(popup.getAttribute('popover'),'manual');
 popup.nativeDisplay='none';h.manager.refresh();assert.equal(h.player.style.getPropertyValue('visibility'),'');
});

test('a Basic modal takes priority over the Toolkit lightbox without deleting or closing either native interface',()=>{
 const h=harness(),lightbox=h.element('ic-lightbox-overlay',rect(0,0,300,700)),dialog=h.element('modal-container',rect(0,0,300,700));
 h.manager.refresh();assert.equal(lightbox.style.getPropertyValue('visibility'),'hidden');assert.equal(lightbox.getAttribute('data-basic-companion-hidden'),'dialog');
 dialog.nativeDisplay='none';h.manager.refresh();assert.equal(lightbox.style.getPropertyValue('visibility'),'');assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');
 assert.equal(h.elements.includes(lightbox),true);assert.equal(h.elements.includes(dialog),true);
 h.manager.stop();assert.equal(h.player.style.getPropertyValue('visibility'),'');assert.equal(lightbox.style.getPropertyValue('visibility'),'');
});

test('an open Snailkit panel and its rail move as one anchor-preserving group while competing floats yield',()=>{
 const h=harness(),host=h.element('sk-note-rail-host',rect(0,0,300,400));
 h.rail.parentElement=host;h.rail.bounds=rect(250,8,38,180);host.children.push(h.rail);
 const panel=h.element('sk-note-rail-panel',rect(30,8,212,230),host);panel.classList.add('is-open');
 const toolbar=h.element('writer-v9-format-toolbar',rect(0,0,300,64));
 const originalGap=h.rail.getBoundingClientRect().left-panel.getBoundingClientRect().right;
 h.manager.refresh();
 assert.equal(panel.style.getPropertyValue('visibility'),'');assert.equal(h.rail.style.getPropertyValue('visibility'),'');
 assert.equal(h.rail.getBoundingClientRect().left-panel.getBoundingClientRect().right,originalGap);
 const union=api.writerCompanionRectsUnion([panel.getBoundingClientRect(),h.rail.getBoundingClientRect()]);
 assert.equal(api.writerCompanionRectsOverlap(union,toolbar.getBoundingClientRect(),8),false);
 assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');assert.equal(h.button.style.getPropertyValue('visibility'),'hidden');
 panel.nativeVisibility='hidden';h.manager.refresh();assert.equal(h.player.style.getPropertyValue('visibility'),'');
});

test('no free region suspends the native panel instead of retrying placement over the blocking toolbar',()=>{
 const h=harness(),host=h.element('sk-note-rail-host',rect(0,0,300,400));h.rail.parentElement=host;h.rail.bounds=rect(250,8,38,180);
 const panel=h.element('sk-note-rail-panel',rect(30,8,212,230),host);panel.classList.add('is-open');
 const blocking=h.element('writer-review-floating',rect(0,0,300,400));h.manager.refresh();
 assert.equal(panel.style.getPropertyValue('visibility'),'hidden');assert.equal(panel.getAttribute('data-basic-companion-hidden'),'space');assert.equal(h.rail.style.getPropertyValue('visibility'),'hidden');
 blocking.nativeDisplay='none';h.manager.refresh();assert.equal(panel.style.getPropertyValue('visibility'),'');assert.equal(h.rail.style.getPropertyValue('visibility'),'');
});

test('Toolkit child pickers retain their toolbar anchor and clear Basic controls as a complete group',()=>{
 const h=harness(),bar=h.element('fk-selection-toolbar',rect(0,10,280,44)),picker=h.element('fk-st-ai-picker',rect(0,58,260,220),bar);
 bar.classList.add('is-visible');const toolbar=h.element('writer-v9-format-toolbar',rect(0,0,300,70));
 const before=picker.getBoundingClientRect().top-bar.getBoundingClientRect().bottom;
 h.manager.refresh();const group=api.writerCompanionRectsUnion([bar.getBoundingClientRect(),picker.getBoundingClientRect()]);
 assert.equal(bar.style.getPropertyValue('visibility'),'');assert.equal(api.writerCompanionRectsOverlap(group,toolbar.getBoundingClientRect(),8),false);
 assert.equal(picker.getBoundingClientRect().top-bar.getBoundingClientRect().bottom,before);assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');
 assert.ok(group.right<=292&&group.top>=8&&group.bottom<=392);
});

test('native open-class changes trigger layout while owned visibility writes do not create observer loops',()=>{
 const h=harness();for(const [id,run] of [...h.frames]){h.frames.delete(id);run();}
 const callback=h.observers[0].callback;assert.equal(h.observers[0].options.attributes,true);
 callback([{type:'attributes',target:h.player,attributeName:'style'}]);assert.equal(h.frames.size,0);
 const nativeMenu=h.element('menu',rect(20,120,250,220));callback([{type:'attributes',target:nativeMenu,attributeName:'class'}]);assert.equal(h.frames.size,1);
 const run=[...h.frames.values()][0];h.frames.clear();run();assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');
 callback([{type:'attributes',target:h.player,attributeName:'style'}]);assert.equal(h.frames.size,0);
 nativeMenu.nativeDisplay='none';callback([{type:'attributes',target:nativeMenu,attributeName:'style'}]);assert.equal(h.frames.size,1);
});

test('compacting a scrollable player uses an actual clear region and returns null when every region is blocked',()=>{
 const area=rect(8,8,284,384),player=rect(8,220,284,160),blocker=rect(8,120,284,272);
 const placed=api.writerCompanionCompactPlace(player,area,[blocker]);assert.ok(placed);assert.equal(placed.height,104);assert.equal(placed.top,8);
 assert.equal(api.writerCompanionRectsOverlap(placed,blocker,8),false);
 assert.equal(api.writerCompanionCompactPlace(player,area,[area]),null);
});


test('an open rail panel remains scrollable when keyboard chrome leaves a smaller usable region',()=>{
 const h=harness(),host=h.element('sk-note-rail-host',rect(0,0,300,400));h.rail.parentElement=host;h.rail.bounds=rect(250,8,38,180);
 const panel=h.element('sk-note-rail-panel',rect(30,8,212,230),host);panel.classList.add('is-open');
 const chrome=h.element('mobile-toolbar',rect(0,200,300,200));h.manager.refresh();
 assert.equal(panel.style.getPropertyValue('visibility'),'');assert.equal(panel.style.getPropertyValue('overflow-y'),'auto');
 const union=api.writerCompanionRectsUnion([panel.getBoundingClientRect(),h.rail.getBoundingClientRect()]);
 assert.ok(union.height>=80&&union.height<230);assert.equal(api.writerCompanionRectsOverlap(union,chrome.getBoundingClientRect(),8),false);
 h.manager.stop();assert.equal(h.rail.style.getPropertyValue('max-height'),'');assert.equal(panel.style.getPropertyValue('max-height'),'');
});


test('existing native popovers update layout through API lifecycle events without DOM mutations',()=>{
 const h=harness(),popup=h.element('sk-pins-popup',rect(20,40,220,130));popup.setAttribute('popover','manual');popup.nativeDisplay='none';
 const flush=()=>{for(const [id,run] of [...h.frames]){h.frames.delete(id);run();}};
 const emit=(type,target)=>{const listener=h.listeners.find(item=>item.target===h.doc&&item.type===type);assert.ok(listener);assert.equal(listener.options.capture,true);listener.handler({target});return listener.handler;};
 flush();assert.equal(h.player.style.getPropertyValue('visibility'),'');
 const originalAttribute=popup.getAttribute('popover'),originalClass=popup.getAttribute('class');
 // showPopover changes UA :popover-open/display state, not the popover attribute.
 emit('beforetoggle',popup);popup.nativeDisplay='block';emit('toggle',popup);
 assert.equal(h.frames.size,1);flush();assert.equal(h.player.style.getPropertyValue('visibility'),'hidden');
 assert.equal(popup.getAttribute('popover'),originalAttribute);assert.ok(popup.getAttribute('class').includes(originalClass));
 // hidePopover and the end of an existing fade must restore without a polling tick.
 popup.nativeDisplay='none';emit('toggle',popup);emit('animationend',popup);emit('transitionend',popup);
 assert.equal(h.frames.size,1);flush();assert.equal(h.player.style.getPropertyValue('visibility'),'');
 assert.equal(h.player.getAttribute('aria-hidden'),null);assert.equal(popup.getAttribute('popover'),originalAttribute);
 const unrelated=h.element('ordinary-detail',rect(0,0,20,20));emit('toggle',unrelated);assert.equal(h.frames.size,0);
 const lateHandler=emit('toggle',popup);h.manager.stop();assert.equal(h.frames.size,0);
 assert.equal(h.listeners.some(item=>['beforetoggle','toggle','transitionend','animationend'].includes(item.type)),false);
 lateHandler({target:popup});assert.equal(h.frames.size,0);
});
