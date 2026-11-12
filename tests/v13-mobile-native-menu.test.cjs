'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function harness(){
 let serial=0,now=0,refreshes=0;
 const timers=new Map(),observers=[],menus=[],notices=[],cleanup=[],nodes=[];
 const notify=()=>{for(const observer of observers)if(observer.active)observer.callback([]);};
 const doc={body:{appendChild(node){node.isConnected=true;nodes.push(node);notify();return node;}}};
 const node=(kind='span')=>({kind,style:{},isConnected:false,ownerDocument:doc,
  setAttribute(){},getBoundingClientRect:()=>({left:24,top:30,bottom:54}),
  remove(){this.isConnected=false;notify();}});
 doc.createElement=()=>node();
 doc.querySelectorAll=()=>nodes.filter(el=>el.kind==='popup'&&el.isConnected);
 class MutationObserver{
  constructor(callback){this.callback=callback;observers.push(this);}
  observe(){this.active=true;}disconnect(){this.active=false;}
 }
 doc.defaultView={MutationObserver,getComputedStyle:node=>node.style};
 class Menu{
  constructor(){this.dom=node('popup');this.items=[];menus.push(this);}
  setParentElement(parent){this.parentEl=parent;return this;}
  showAtPosition(position){this.position=position;doc.body.appendChild(this.dom);return this;}
  hide(){this.hideCallback?.();this.dom.remove();}
  onHide(callback){this.hideCallback=callback;}
 }
 const baseParent=Menu.prototype.setParentElement,baseShow=Menu.prototype.showAtPosition;
 const api=vm.runInNewContext(fs.readFileSync('src/v10/sidebar-width-1010.js','utf8')+'\n'+
  fs.readFileSync('src/v12/mobile-ux-1201.js','utf8')+'\n({writerV1201NativeAction,writerV1012OpenNativeAction})',{
   console:{warn(){}},Menu,MutationObserver,writerUi:(_pt,en)=>en,
   setTimeout:(fn,delay=0)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id;},
   clearTimeout:id=>timers.delete(id),Notice:class{constructor(message){notices.push(message);}}
  });
 const plugin={app:{workspace:{containerEl:{ownerDocument:doc}}},
  register:fn=>cleanup.push(fn),writerV1010Refresh:()=>{refreshes++;}};
 const advance=(amount=0)=>{
  now+=amount;let count=0;
  while([...timers.values()].some(task=>task.at<=now)){
   assert.ok(++count<100,'Unexpected timer loop');
   const [id,task]=[...timers.entries()].find(([,task])=>task.at<=now);
   timers.delete(id);task.fn();
  }
 };
 const action=callback=>{const result=node();result.isConnected=true;result.click=callback;return result;};
 return {api,plugin,Menu,doc,menus,nodes,notices,advance,action,notify,
  baseParent,baseShow,refreshes:()=>refreshes,stop:()=>cleanup.forEach(fn=>fn())};
}

test('native relay waits for actual parent dismissal and the selecting event to finish',()=>{
 const h=harness();let clicks=0,closed;
 const parent={onHide(callback){closed=callback;}};
 h.api.writerV1201NativeAction(h.plugin,h.action(()=>clicks++),'More options',parent);
 h.advance(5000);
 assert.equal(clicks,0,'A slow parent sheet must finish closing first');
 closed();assert.equal(clicks,0,'Do not open another popup inside the selecting event');
 h.advance();assert.equal(clicks,1);
 assert.equal(h.plugin._writerV1010NativeActionPending,false);
});

test('hidden native controls receive a stable anchor until the native popup actually closes',()=>{
 const h=harness();let native,closed=0;
 const source=h.action(()=>{native=new h.Menu();native.onHide(()=>closed++);native.setParentElement(source).showAtPosition({x:0,y:0});});
 source.style.display='none';
 h.api.writerV1201NativeAction(h.plugin,source,'More options');h.advance();
 assert.notEqual(native.parentEl,source);
 assert.equal(native.parentEl.isConnected,true);
 assert.equal(native.position.x,24);
 assert.equal(h.Menu.prototype.setParentElement,h.baseParent);
 assert.equal(h.Menu.prototype.showAtPosition,h.baseShow);
 h.advance(60000);
 assert.equal(h.plugin._writerV1010NativeActionPending,true,'A long-lived popup keeps its anchor');
 assert.equal(closed,0);
 native.hide();
 assert.equal(closed,1,'The existing native onHide callback is retained');
 assert.equal(h.plugin._writerV1010NativeActionPending,false);
 assert.equal(native.parentEl.isConnected,false);
 assert.equal(h.refreshes(),1);
});

test('duplicate taps are consumed while waiting and while open instead of reaching the fallback click',()=>{
 const h=harness();let clicks=0,closed,native;
 const parent={onHide(callback){closed=callback;}};
 const source=h.action(()=>{clicks++;native=new h.Menu();native.setParentElement(source).showAtPosition({x:0,y:0});});
 h.api.writerV1012OpenNativeAction(source,true,h.plugin,'More options',parent);
 h.api.writerV1012OpenNativeAction(source,true,h.plugin,'More options',parent);
 h.advance(5000);assert.equal(clicks,0);
 closed();h.advance();assert.equal(clicks,1);
 h.api.writerV1012OpenNativeAction(source,true,h.plugin,'More options',parent);
 h.advance(5000);assert.equal(clicks,1);
 native.hide();
 h.api.writerV1012OpenNativeAction(source,true,h.plugin,'More options');h.advance();
 assert.equal(clicks,2,'The action is available again after dismissal');
});

test('pane replacement and thrown handlers release the relay and allow retry without retaining API hooks',()=>{
 const h=harness();let clicks=0;
 const detached=h.action(()=>clicks++);detached.isConnected=false;
 h.api.writerV1201NativeAction(h.plugin,detached,'More options');h.advance();
 assert.equal(clicks,0);assert.match(h.notices[0],/pane changed/i);
 assert.equal(h.plugin._writerV1010NativeActionPending,false);
 h.api.writerV1201NativeAction(h.plugin,h.action(()=>{throw Error('Failed');}),'More options');h.advance();
 assert.match(h.notices.at(-1),/Could not execute/);
 assert.equal(h.Menu.prototype.setParentElement,h.baseParent);
 assert.equal(h.Menu.prototype.showAtPosition,h.baseShow);
 h.api.writerV1201NativeAction(h.plugin,h.action(()=>clicks++),'Expand all');h.advance();
 assert.equal(clicks,1);assert.equal(h.plugin._writerV1010NativeActionPending,false);
});

test('nested popups retain the refresh lock until the final popup is dismissed',()=>{
 const h=harness();let native;
 const source=h.action(()=>{native=new h.Menu();native.setParentElement(source).showAtPosition({x:0,y:0});});
 h.api.writerV1201NativeAction(h.plugin,source,'More options');h.advance();
 const child=new h.Menu();child.showAtPosition({x:0,y:0});native.hide();
 assert.equal(h.plugin._writerV1010NativeActionPending,true);
 child.hide();assert.equal(h.plugin._writerV1010NativeActionPending,false);
});

test('replacing the native pane closes its stale popup and unavailable actions cannot execute',()=>{
 const h=harness();let native,clicks=0;
 const source=h.action(()=>{native=new h.Menu();native.setParentElement(source).showAtPosition({x:0,y:0});});
 h.api.writerV1201NativeAction(h.plugin,source,'More options');h.advance();
 source.isConnected=false;h.notify();
 assert.equal(native.dom.isConnected,false);
 assert.equal(h.plugin._writerV1010NativeActionPending,false);
 const disabled=h.action(()=>clicks++);disabled.disabled=true;
 h.api.writerV1201NativeAction(h.plugin,disabled,'More options');h.advance();
 assert.equal(clicks,0);assert.match(h.notices.at(-1),/unavailable/);
 assert.equal(h.plugin._writerV1010NativeActionPending,false);
});

test('unloading cancels deferred actions and closes active popups while releasing observers and anchors',()=>{
 const h=harness();let clicks=0,closed;
 h.api.writerV1201NativeAction(h.plugin,h.action(()=>clicks++),'More options',{onHide(callback){closed=callback;}});
 h.stop();closed();h.advance();assert.equal(clicks,0);
 const next=harness();let native;
 const source=next.action(()=>{native=new next.Menu();native.setParentElement(source).showAtPosition({x:0,y:0});});
 next.api.writerV1201NativeAction(next.plugin,source,'More options');next.advance();next.stop();
 assert.equal(native.dom.isConnected,false);
 assert.equal(native.parentEl.isConnected,false);
 assert.equal(next.plugin._writerV1010NativeActionPending,false);
 assert.equal(next.refreshes(),0,'Unloading does not queue another render');
});
