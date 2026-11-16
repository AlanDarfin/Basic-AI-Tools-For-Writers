'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/mobile-status.js','utf8');
class Node{
 constructor(cls=''){this.className=cls;this.children=[];this.attrs={};this.parentNode=null;this.ownText='';this.events={};
  const props=new Map();
  this.style={setProperty:(key,value)=>props.set(key,value),removeProperty:key=>props.delete(key),getPropertyValue:key=>props.get(key)||''};
 }
 get classList(){
  const read=()=>new Set(this.className.split(' ').filter(Boolean));
  const edit=(names,add)=>{const set=read();for(const name of names)add?set.add(name):set.delete(name);this.className=[...set].join(' ');};
  return {add:(...names)=>edit(names,true),remove:(...names)=>edit(names,false),contains:name=>read().has(name),
   toggle:(name,on)=>edit([name],on)};
 }
 get parentElement(){return this.parentNode;}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
 get textContent(){return this.ownText+this.children.map(child=>child.textContent).join('');}
 set textContent(value){this.ownText=String(value);}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(name,fn){this.events[name]=fn;}
 removeEventListener(name){delete this.events[name];}
 getBoundingClientRect(){const inset=parseFloat(this.style.getPropertyValue('--writer-mobile-nav-bottom'));
  const difference=Number.isFinite(inset)?inset-(this.bottom||0):0;
  return this.rect?{...this.rect,top:this.rect.top-difference,bottom:this.rect.bottom-difference}:{bottom:0,height:0};}
 appendChild(node){this.insertBefore(node,null);return node;}
 insertBefore(node,before){node.remove();node.parentNode=this;this.children.splice(before?this.children.indexOf(before):this.children.length,0,node);}
 before(node){this.parentNode.insertBefore(node,this);}
 after(node){this.parentNode.insertBefore(node,this.nextSibling);}
 replaceWith(node){this.before(node);this.remove();}
 remove(){if(this.parentNode){const all=this.parentNode.children;all.splice(all.indexOf(this),1);this.parentNode=null;}}
 matches(selector){return selector.split(',').some(s=>{const parts=s.trim().split(/\s*>\s*/);return parts.at(-1).slice(1).split('.').every(x=>this.classList.contains(x))&&
  (parts.length===1||this.parentNode?.matches(parts[0]));});}
 querySelectorAll(selector){return this.children.flatMap(n=>[...(n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)]);}
 querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;
  const nested=child.querySelector(selector);if(nested)return nested;}return null;}
 contains(node){return node===this||this.children.some(child=>child.contains(node));}
 closest(selector){return this.matches(selector)?this:this.parentNode?.closest(selector);}
}
function fixture({mobile=true,withNav=true,withNative=false}={}){
 const cleanup=[],tasks=new Map(),events={},vaultEvents={},viewportEvents={},windowEvents=[];
 let sequence=0,keyboard=0,safeTop=0,safeBottom=0,observed,allowed=true,opened=0,reads=0,sourceText='Two words',seconds=1500;
 let file={path:'Bonfire/Scene.md',extension:'md'},view={file,editor:{getValue:()=>sourceText},getMode:()=> 'source'};
 let read=async()=>sourceText;
 const body=new Node('is-mobile'),app=body.appendChild(new Node('app-container'));
 const workspace=app.appendChild(new Node('workspace'));
 const createNav=()=>{const nav=app.appendChild(new Node('mobile-navbar'));nav.position='fixed';nav.bottom=12;
  nav.rect={left:30,right:330,width:300,top:738,bottom:788,height:50};nav.appendChild(new Node('mobile-navbar-actions'));return nav;};
 const nav=withNav?createNav():null;
 const native=withNative?app.appendChild(new Node('status-bar')):null;
 const other=app.appendChild(new Node('another-native-element'));
 const win={innerHeight:800,innerWidth:360,setTimeout(fn){tasks.set(++sequence,fn);return sequence;},
  clearTimeout:id=>tasks.delete(id),getComputedStyle:el=>({position:el.position||'static',display:el.display||'flex',
   bottom:el.style.getPropertyValue('--writer-mobile-nav-bottom')||el.bottom+'px',
   getPropertyValue:key=>(key==='--keyboard-height'?keyboard:key==='--safe-area-inset-top'?safeTop:key==='--safe-area-inset-bottom'?safeBottom:0)+'px'}),
  addEventListener(name,fn){windowEvents.push([name,fn]);},removeEventListener(name,fn){windowEvents.splice(windowEvents.findIndex(e=>e[0]===name&&e[1]===fn),1);},
  visualViewport:{height:800,width:360,scale:1,addEventListener:(name,fn)=>{viewportEvents[name]=fn;},removeEventListener:name=>delete viewportEvents[name]},
  MutationObserver:class{constructor(fn){observed=fn;}observe(){}disconnect(){observed=null;}}};
 const doc=app.ownerDocument={body,defaultView:win,createElement:()=>new Node(),createComment:()=>new Node()};
 const plugin={app:{isMobile:mobile,workspace:{containerEl:workspace,onLayoutReady(fn){fn();},
  getActiveFile:()=>file,getActiveViewOfType:()=>view,on(name,fn){events[name]=fn;return name;}},
  vault:{on(name,fn){vaultEvents[name]=fn;return name;},cachedRead(f){reads++;return read(f);}}},
  settings:{v6:{readingTime:{enabled:true,status:true}},v931Pomodoro:{enabled:true,statusBar:true}},
  writerV931Pomodoro:{remaining:()=>seconds,open:async()=>{opened++;}},
  registerEvent(){},register:fn=>cleanup.push(fn),saveSettings:async()=>{}};
 let toggle;
 class Setting{
  setName(label){this.label=label;return this;}
  setDesc(){return this;}
  addToggle(init){toggle={label:this.label,setValue(value){this.value=value;return this;},onChange(fn){this.change=fn;return this;}};init(toggle);return this;}
 }
 const api=vm.runInNewContext(source+'\n({writerMobileStatusRegister,writerMobileStatusSettings})',{
  require:()=>({Platform:{isMobile:false},setIcon(el,icon){el.icon=icon;}}),Setting,
  writerUi:(_pt,en)=>en,writerV6Allowed:p=>p.settings.v6.readingTime.enabled,
  writerV6ProjectToolAllowed:()=>allowed,writerV6ReadingEstimate:text=>({words:text.trim().split(/\s+/).length,minutes:1}),
  writerV931PomodoroClock:n=>String(n/60)+':00'});
 api.writerMobileStatusRegister(plugin);
 const flush=async()=>{const pending=[...tasks.values()];tasks.clear();for(const fn of pending)fn();await Promise.resolve();};
 return {app,doc,workspace,plugin,api,nav,native,other,events,vaultEvents,viewportEvents,createNav,win,flush,
  node:cls=>app.querySelector('.'+cls),
  observe(nodes=[]){observed?.([{addedNodes:nodes}]);},
  disable:()=>cleanup.forEach(fn=>fn()),
  keyboard(height){keyboard=height;viewportEvents.resize?.();},
  safe(top,bottom){safeTop=top;safeBottom=bottom;viewportEvents.resize?.();},
  setSource(text){sourceText=text;},setSeconds:n=>{seconds=n;},setAllowed:on=>{allowed=on;},
  setFile(f,v){file=f;view=v;},setRead:fn=>{read=fn;},
  get opened(){return opened;},get reads(){return reads;},get toggle(){return toggle;}};
}
test('mobile status sits below the native actions and keeps native nodes live and restorable',async()=>{
 const h=fixture({withNative:true});
 const words=h.native.appendChild(new Node('plugin-word-count'));words.textContent='Native word count';
 const sync=h.native.appendChild(new Node('plugin-sync'));sync.addEventListener('click',()=>true);
 await h.flush();
 const bar=h.node('writer-mobile-status');
 assert.equal(bar.parentNode,h.app);assert.equal(h.nav.children.length,1);assert.equal(bar.children[0],h.native);
 assert.equal(sync.events.click(),true);
 assert.equal(h.node('writer-mobile-status-words').hidden,true);
 assert.equal(h.node('writer-mobile-status-reading').textContent,'1 min read');
 assert.equal(h.nav.classList.contains('writer-mobile-nav-lifted'),true);
 h.api.writerMobileStatusSettings(h.plugin,new Node());
 assert.equal(h.toggle.value,true);
 await h.toggle.change(false);
 assert.equal(h.node('writer-mobile-status'),null);
 assert.equal(h.native.parentNode,h.app);
 assert.equal(h.app.children.indexOf(h.native)+1,h.app.children.indexOf(h.other));
 assert.equal(h.nav.classList.contains('writer-mobile-nav-lifted'),false);
 await h.toggle.change(true);
 assert.equal(h.node('writer-mobile-status').children[0],h.native);
 h.disable();
 assert.equal(h.native.parentNode,h.app);
 assert.equal(h.nav.children.length,1);
 assert.equal(h.viewportEvents.resize,undefined);
});
test('fallback stays current in the editor, hides with keyboard and keeps Pomodoro usable',async()=>{
 const h=fixture();await h.flush();
 const bar=h.node('writer-mobile-status');
 assert.equal(h.node('writer-mobile-status-words').textContent,'2 words');
 assert.equal(h.node('writer-mobile-status-mode').textContent,'Editing');
 assert.equal(h.reads,0);
 h.setSource('One two three');h.events['editor-change']();await h.flush();
 assert.equal(h.node('writer-mobile-status-words').textContent,'3 words');
 h.keyboard(300);
 assert.equal(bar.hidden,true);assert.equal(h.nav.classList.contains('writer-mobile-nav-lifted'),false);
 h.keyboard(0);await h.flush();assert.equal(bar.hidden,false);
 h.win.visualViewport.height=480;h.viewportEvents.resize();assert.equal(bar.hidden,true);
 h.win.visualViewport.height=800;h.viewportEvents.resize();await h.flush();assert.equal(bar.hidden,false);
 h.setSeconds(60);h.plugin.writerMobileStatus.renderTimer();
 const timer=h.node('writer-mobile-status-timer');
 assert.equal(timer.textContent,'1:00');timer.events.click();assert.equal(h.opened,1);
 h.setAllowed(false);h.events['editor-change']();await h.flush();
 assert.equal(h.node('writer-mobile-status-reading').hidden,true);
});
test('floating status fits below the pill above the safe area without widening or resizing the pill',()=>{
 const h=fixture(),bar=h.node('writer-mobile-status');
 h.safe(26,24);
 assert.equal(h.nav.style.getPropertyValue('--writer-mobile-nav-bottom'),'58px');
 assert.equal(bar.style.getPropertyValue('--writer-mobile-status-top'),'746px');
 assert.equal(bar.style.getPropertyValue('--writer-mobile-status-left'),'30px');
 assert.equal(bar.style.getPropertyValue('--writer-mobile-status-width'),'300px');
 h.plugin.writerMobileStatus.refresh();
 assert.equal(h.nav.style.getPropertyValue('--writer-mobile-nav-bottom'),'58px','offset must not accumulate');
 h.keyboard(250);
 assert.equal(h.nav.style.getPropertyValue('--writer-mobile-nav-bottom'),'');
 assert.equal(h.nav.classList.contains('writer-mobile-nav-lifted'),false);
 h.disable();
 assert.equal(h.node('writer-mobile-safe-insets'),null);
});
test('homepage keeps enough scroll room for the last widget with status on or off',async()=>{
 const h=fixture();
 const home=h.workspace.appendChild(new Node('writer-v8-home'));
 home.rect={left:0,right:360,width:360,top:35,bottom:800,height:765};
 h.safe(26,24);
 assert.equal(home.style.getPropertyValue('--writer-mobile-home-clearance'),'116px');
 h.api.writerMobileStatusSettings(h.plugin,new Node());
 await h.toggle.change(false);
 assert.equal(home.style.getPropertyValue('--writer-mobile-home-clearance'),'70px');
 const nativeToolbar=h.app.appendChild(new Node('mobile-toolbar'));
 nativeToolbar.rect={left:0,right:360,width:360,top:680,bottom:724,height:44};
 h.plugin.writerMobileStatus.refresh();
 assert.equal(home.style.getPropertyValue('--writer-mobile-home-clearance'),'128px');
 nativeToolbar.remove();
 h.doc.body.classList.add('is-hidden-nav');h.plugin.writerMobileStatus.refresh();
 assert.equal(home.style.getPropertyValue('--writer-mobile-home-clearance'),'');
 h.doc.body.classList.remove('is-hidden-nav');h.nav.position='relative';await h.toggle.change(true);
 assert.equal(h.nav.nextSibling,h.node('writer-mobile-status'));
 assert.equal(home.style.getPropertyValue('--writer-mobile-home-clearance'),'');
 h.disable();
});
test('docked top formatting uses the system inset and visible floating header',()=>{
 const h=fixture();
 const pane=h.workspace.appendChild(new Node('workspace-leaf-content'));
 const header=pane.appendChild(new Node('view-header'));
 header.rect={left:0,right:360,width:360,top:30,bottom:76,height:46};
 const host=pane.appendChild(new Node('writer-v9-toolbar-docked'));
 host.rect={left:0,right:360,width:360,top:0,bottom:720,height:720};
 host.appendChild(new Node('writer-v9-format-toolbar is-top'));
 h.safe(26,24);
 assert.equal(host.style.getPropertyValue('--writer-mobile-editor-top-clearance'),'76px');
 header.hidden=true;h.plugin.writerMobileStatus.refresh();
 assert.equal(host.style.getPropertyValue('--writer-mobile-editor-top-clearance'),'26px');
 h.disable();
 assert.equal(host.style.getPropertyValue('--writer-mobile-editor-top-clearance'),'');
});
test('late/rebuilt navbar is supported and delayed reads never overwrite the current file',async()=>{
 const h=fixture({withNav:false,withNative:true});
 assert.equal(h.node('writer-mobile-status'),null);
 const oldNav=h.createNav();h.observe([oldNav]);await h.flush();
 assert.equal(oldNav.children.length,1);assert.equal(h.node('writer-mobile-status').parentNode,h.app);
 let finish;
 h.setRead(()=>new Promise(resolve=>{finish=resolve;}));
 const previous={path:'Previous.md',extension:'md'};
 h.setFile(previous,{file:previous,getMode:()=> 'preview'});h.events['file-open']();await h.flush();
 oldNav.remove();
 const currentNav=h.createNav();h.observe([currentNav]);
 const file={path:'Another.md',extension:'md'};
 h.setFile(file,{file,editor:{getValue:()=> 'New text here'},getMode:()=> 'source'});
 h.events['file-open']();await h.flush();finish('Stale');await Promise.resolve();
 assert.equal(currentNav.children.length,1);assert.equal(h.node('writer-mobile-status').parentNode,h.app);
 assert.equal(h.native.parentNode,h.node('writer-mobile-status'));
 assert.equal(h.node('writer-mobile-status-words').textContent,'3 words');
 assert.equal(oldNav.children.length,1);
});
test('desktop leaves its existing status bar and settings untouched',()=>{
 const h=fixture({mobile:false,withNative:true});
 h.api.writerMobileStatusSettings(h.plugin,new Node());
 assert.equal(h.toggle,undefined);assert.equal(h.plugin.writerMobileStatus,undefined);
 assert.equal(h.node('writer-mobile-status'),null);assert.equal(h.native.parentNode,h.app);
});
