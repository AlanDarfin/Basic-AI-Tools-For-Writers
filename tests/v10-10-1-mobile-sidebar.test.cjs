'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function html(){
 const doc={};
 const node=(tag='div')=>{
  const classes=new Set(),el={
   tagName:tag.toUpperCase(),children:[],ownerDocument:doc,parentElement:null,dataset:{},
   style:{setProperty(){},removeProperty(){}},attributes:{},textContent:'',clientWidth:410,
   classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},
    contains(name){return classes.has(name);},toggle(name,force){const on=force===undefined?!classes.has(name):force;
     if(on)classes.add(name);else classes.delete(name);return on;}},
   appendChild(child){child.remove?.();child.parentElement=this;this.children.push(child);return child;},
   replaceChildren(...items){this.children.forEach(c=>{c.parentElement=null;});this.children=[];
    for(const item of items)this.appendChild(item);},
   insertAdjacentElement(where,child){
    if(where==='beforebegin'&&this.parentElement){
     child.remove?.();const p=this.parentElement,at=p.children.indexOf(this);p.children.splice(at,0,child);child.parentElement=p;
    }else this.appendChild(child);
   },
   remove(){const p=this.parentElement;if(p){p.children=p.children.filter(x=>x!==this);this.parentElement=null;}},
   querySelector(selector){
    if(selector==='.workspace-drawer-inner')return this._inner||null;
    if(selector.includes('workspace-drawer-header'))return this.children.find(e=>e.classList.contains('workspace-drawer-header'))||null;
    if(selector.includes('writer-v9216-spaces-dock'))return this.children.find(e=>e.classList.contains('writer-v9216-spaces-dock'))||null;
    return null;
   },
   querySelectorAll(){return [];},setAttribute(name,value){this.attributes[name]=String(value);},
   getAttribute(name){return this.attributes[name];},
   addEventListener(name,callback){this._listeners??={};this._listeners[name]=callback;},
   click(){this._listeners?.click?.({clientX:10,clientY:12,stopPropagation(){},preventDefault(){}});}
  };
  Object.defineProperty(el,'className',{get:()=>[...classes].join(' '),set:v=>{classes.clear();String(v).split(/\s+/).filter(Boolean).forEach(n=>classes.add(n));}});
  return el;
 };
 doc.createElement=node;doc.body=node('body');
 return {doc,node};
}
const source=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
function loadMobile(globals={}){
 const callbacks=[],logs=[],ctx={
  console:{warn:(...a)=>logs.push(['warn',...a]),error:(...a)=>logs.push(['error',...a])},
  writerUi:(pt,en)=>pt,
  require:()=>({Platform:{isMobile:true},setIcon:()=>{}}),
  setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout:()=>{},
  Set,Map,Object,Math,Number,String,
  ...globals
 };
 const api=vm.runInNewContext(source+'\n({writerV1010Merge,writerV1010MobileDrawer,writerV1010CollectLeaves,writerV1010ActiveLeaf,writerV1010SelectLeaf,writerV1010Register})',ctx);
 return {api,callbacks,logs};
}
test('MobileDrawer tabs use native child positions, not generic revealLeaf',()=>{
 const {api}=loadMobile(),{node}=html();
 const A={view:{getViewType:()=> 'file-explorer'}},B={view:{getViewType:()=> 'global-search'}};
 let selected=-1,focused=null,revealed=0;
 const drawer={type:'mobile-drawer',children:[A,B],currentTab:0,
  tabsContainerEl:node(),tabsListEl:node(),containerEl:node(),isPinned:false,
  selectTabIndex(index){selected=index;this.currentTab=index;}};
 const workspace={leftSplit:drawer,rightSplit:{},activeLeaf:A,
  setActiveLeaf(leaf,options){focused={leaf,options};},
  revealLeaf(){revealed++;},iterateAllLeaves(callback){[A,B].forEach(callback);}};
 const plugin={app:{workspace},settings:{},writerV1010Refresh(){}};
 const leaves=api.writerV1010CollectLeaves(workspace,'left');
 assert.deepEqual(Array.from(leaves,entry=>entry.type),['file-explorer','global-search']);
 assert.equal(api.writerV1010ActiveLeaf(workspace,leaves,'left'),A);
 assert.equal(api.writerV1010SelectLeaf(plugin,'left',B),true);
 assert.equal(selected,1);
 assert.equal(focused.leaf,B);
 assert.equal(api.writerV1010ActiveLeaf(workspace,leaves,'left'),B);
 assert.equal(revealed,0,'revealLeaf is not used for mobile drawer tabs');
});
test('Mobile toolbar mounts INSIDE native selector, replaces only the old selector, then cleans up',()=>{
 const {doc,node}=html(),{api,callbacks,logs}=loadMobile();
 const root=node(),native=node(),tabs=node();root.ownerDocument=doc;tabs.appendChild(native);
 const file={view:{getViewType:()=> 'file-explorer'}},search={view:{getViewType:()=> 'global-search'}};
 let ready,unload;
 const drawer={type:'mobile-drawer',containerEl:root,headerEl:node(),
  tabsContainerEl:tabs,tabsListEl:native,children:[file,search],currentTab:0,isPinned:false,
  selectTabIndex(index){this.currentTab=index;}};
 const workspace={leftSplit:drawer,rightSplit:{},activeLeaf:file,iterateAllLeaves(fn){[file,search].forEach(fn);},
  getActiveFile:()=>null,onLayoutReady(fn){ready=fn;},on(){return {};},
  setActiveLeaf(leaf){this.activeLeaf=leaf;}};
 const plugin={app:{workspace},settings:{v1010Layout:{sidebar:{enabled:true,mobileTabs:true},width:{enabled:false}}},
  addStatusBarItem:()=>null,registerEvent:()=>{},register(fn){unload=fn;},saveSettings:async()=>{}};
 api.writerV1010Register(plugin);ready();
 while(callbacks.length)callbacks.shift()();
 const bar=tabs.children.find(n=>n.classList.contains('writer-v1010-sidebar-toolbar'));
 assert.ok(bar,'toolbar must be part of the native tab selector');
 assert.ok(native.classList.contains('writer-v1011-native-tabs-hidden'));
 assert.equal(tabs.parentElement,null,'no duplicate header inserted below selector');
 assert.ok(root.classList.contains('writer-v1011-managed-mobile'));
 assert.equal(logs.length,0);
 const firstButton=bar.children[0],secondButton=bar.children[1];
 secondButton.click();
 while(callbacks.length)callbacks.shift()();
 assert.equal(drawer.currentTab,1,'second icon selects correct native tab');
 assert.equal(tabs.children.find(n=>n.classList.contains('writer-v1010-sidebar-toolbar')),bar,'tab row is not destroyed when switching');
 assert.equal(bar.children[1],secondButton,'existing icon remains mounted');
 assert.ok(secondButton.classList.contains('is-active'));
 firstButton.click();
 while(callbacks.length)callbacks.shift()();
 assert.equal(drawer.currentTab,0,'returning to explorer selects first tab');
 assert.equal(bar.children[0],firstButton,'explorer icon remains mounted');
 assert.ok(firstButton.classList.contains('is-active'),'top indicator stays visible when returning');
 assert.equal(firstButton.attributes['aria-pressed'],'true');
 unload();
 assert.ok(!native.classList.contains('writer-v1011-native-tabs-hidden'));
 assert.ok(!root.classList.contains('writer-v1011-managed-mobile'));
 assert.ok(!tabs.children.some(n=>n.classList.contains('writer-v1010-sidebar-toolbar')));
});
test('Existing mobile Spaces dock is relocated to the drawer footer, not duplicated in explorer',()=>{
 const text=fs.readFileSync('src/v9/spaces-dock.js','utf8');
 assert.match(text,/const mobileIntegrated=\(\)=>/);
 assert.match(text,/drawer\.containerEl/);
 assert.match(text,/const mount=root\.querySelector\?\.\('\.workspace-drawer-inner'\)\|\|root/);
 assert.match(text,/writer-v1011-integrated-spaces/);
 assert.match(text,/nativeFooter\.insertAdjacentElement\('beforebegin',dock\)/);
 assert.match(text,/if\(mobileIntegrated\(\)\)\{/);
 assert.match(text,/writer-v1011-mobile-spaces-host/);
 assert.match(text,/writerV9215SelectSpace\(plugin,space\.id\)/);
});
test('More menu combines overflowing tabs and native actions, with Spaces access',()=>{
 assert.match(source,/writerV1010SidebarMenu\(plugin,event,side,hidden,/);
 assert.match(source,/writerV1010ActiveLeaf\(workspace,leaves,side\)/);
 assert.match(source,/writerV1010SelectLeaf\(plugin,side,entry\.leaf\)/);
 assert.match(source,/Gerenciar Spaces/);
 assert.match(source,/Cofre: /);
 assert.match(source,/writer-v1011-compact-footer/);
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/\.writer-v1011-native-tabs-hidden/);
 assert.match(css,/\.writer-v1011-integrated-spaces/);
 assert.match(css,/writer-v1011-managed-mobile\.writer-v1011-compact-footer/);
});

test('Mobile tab header can be recreated without losing Basic controls',()=>{
 const {doc,node}=html();
 let notify=null,disconnects=0;
 class Observer {
  constructor(callback){notify=callback;}
  observe(target,options){assert.equal(options.subtree,true);assert.equal(options.childList,true);}
  disconnect(){disconnects++;}
 }
 const {api,callbacks}=loadMobile({MutationObserver:Observer});
 const root=node(),native=node(),tabs=node();
 root.ownerDocument=doc;tabs.appendChild(native);
 const explorer={view:{getViewType:()=> 'file-explorer'}};
 const search={view:{getViewType:()=> 'global-search'}};
 const drawer={type:'mobile-drawer',containerEl:root,tabsContainerEl:tabs,
  tabsListEl:native,headerEl:node(),children:[explorer,search],
  currentTab:0,isPinned:false,selectTabIndex(i){this.currentTab=i;}};
 let ready,dispose;
 const workspace={containerEl:root,leftSplit:drawer,rightSplit:{},activeLeaf:explorer,
  iterateAllLeaves(fn){[explorer,search].forEach(fn);},getActiveFile(){return null;},
  onLayoutReady(fn){ready=fn;},on(){return {};},setActiveLeaf(leaf){this.activeLeaf=leaf;}};
 const plugin={settings:{v1010Layout:{sidebar:{enabled:true,mobileTabs:true},width:{enabled:false}}},
  app:{workspace},addStatusBarItem:()=>null,registerEvent(){},registerDomEvent(){},
  register(fn){dispose=fn;},saveSettings:async()=>{}};
 api.writerV1010Register(plugin);ready();
 while(callbacks.length)callbacks.shift()();
 assert.equal(typeof notify,'function');
 const initial=tabs.children.find(x=>x.classList.contains('writer-v1010-sidebar-toolbar'));
 assert.ok(initial);
 const nextTabs=node(),nextNative=node();nextTabs.appendChild(nextNative);
 drawer.tabsContainerEl=nextTabs;drawer.tabsListEl=nextNative;
 notify([{type:'childList'}]);
 while(callbacks.length)callbacks.shift()();
 const restored=nextTabs.children.find(x=>x.classList.contains('writer-v1010-sidebar-toolbar'));
 assert.ok(restored,'toolbar returns after Obsidian rebuilds tab header');
 assert.notEqual(restored,initial,'stale detached toolbar is not reused');
 assert.ok(nextNative.classList.contains('writer-v1011-native-tabs-hidden'));
 dispose();
 assert.ok(disconnects>0,'observer is disconnected on unload');
});
