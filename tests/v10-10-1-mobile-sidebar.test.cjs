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
 const api=vm.runInNewContext(source+'\n({writerV1010Merge,writerV1010MobileDrawer,writerV1010CollectLeaves,writerV1010ActiveLeaf,writerV1010SelectLeaf,writerV1010Register,writerV1012NativeActionIcon,writerV1012IsNativeSortAction,writerV1012OpenNativeAction})',ctx);
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
 const originalButtons=[...bar.children];
 bar.children[1].click();
 while(callbacks.length)callbacks.shift()();
 assert.equal(drawer.currentTab,1,'second icon selects correct native tab');
 assert.equal(bar.children[1],originalButtons[1],'tab switching must preserve the same button DOM anchors');
 plugin.writerV1010Refresh();
 while(callbacks.length)callbacks.shift()();
 assert.equal(bar.children[1],originalButtons[1],'layout refresh must not destroy the menu anchor');
 assert.ok(tabs.children.find(n=>n.classList.contains('writer-v1010-sidebar-toolbar')).children[1].classList.contains('is-active'));
 unload();
 assert.ok(!native.classList.contains('writer-v1011-native-tabs-hidden'));
 assert.ok(!root.classList.contains('writer-v1011-managed-mobile'));
 assert.ok(!tabs.children.some(n=>n.classList.contains('writer-v1010-sidebar-toolbar')));
});
test('Mobile Spaces belongs to native tabs instead of Explorer scroll or rebuilt drawer inner',()=>{
 const source=fs.readFileSync('src/v9/spaces-dock.js','utf8');
 assert.match(source,/function writerV1014MobileSpacesAnchor\(plugin\)/);
 assert.match(source,/const mount=writerV1014MobileSpacesAnchor\(plugin\)/);
 assert.match(source,/writer-v1014-mobile-spaces-anchor/);
 assert.match(source,/writer-v1014-collapsible-spaces/);
 assert.match(source,/writer-v1014-spaces-toggle/);
 assert.match(source,/aria-expanded/);
 assert.match(source,/mobileObserver\.observe\(root,\{childList:true,subtree:true\}\)/);
 assert.match(source,/writerV9215SelectSpace\(plugin,id\)/);
 assert.doesNotMatch(source,/const mount=root\.querySelector\?\.\('\.workspace-drawer-inner'\)/);
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/\.writer-v1014-mobile-spaces-anchor/);
 assert.match(css,/inset:auto 8px calc\(100% \+ 3px\)/);
 assert.match(css,/\.writer-v1014-collapsible-spaces/);
 assert.match(css,/\.writer-v1014-spaces-options\[hidden\]/);
});
test('More menu combines overflowing tabs and native actions, with Spaces access',()=>{
 assert.match(source,/writerV1010SidebarMenu\(plugin,event,side,hidden,active\)/);
 assert.match(source,/writerV1010SelectLeaf\(plugin,side,entry\.leaf\)/);
 assert.match(source,/Gerenciar Spaces/);
 assert.match(source,/Cofre: /);
 assert.match(source,/writer-v1011-compact-footer/);
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/\.writer-v1011-native-tabs-hidden/);
 assert.match(css,/\.writer-v1011-integrated-spaces/);
 assert.match(css,/writer-v1011-managed-mobile\.writer-v1011-compact-footer/);
});

test('Native action menu retains Lucide icons and waits until parent menu closes before showing sort',()=>{
 const {api,callbacks}=loadMobile();
 const action={
  clicks:0,
  getAttribute:()=>null,
  querySelector:()=>({getAttribute:()=> 'svg-icon lucide lucide-arrow-up-narrow-wide'}),
  click(){this.clicks++;}
 };
 assert.equal(api.writerV1012NativeActionIcon(action,'Mudar ordenação'),'arrow-up-narrow-wide');
 assert.equal(api.writerV1012IsNativeSortAction(action,'Mudar ordenação'),true);
 api.writerV1012OpenNativeAction(action,true);
 assert.equal(action.clicks,0,'nested sort menu must not open during the parent click');
 callbacks.shift()();
 assert.equal(action.clicks,1,'sort opens after the old menu has closed');
 api.writerV1012OpenNativeAction(action,false);
 assert.equal(action.clicks,2,'simple actions remain immediate');
 const noIcon={getAttribute:()=>null,querySelector:()=>null};
 assert.equal(api.writerV1012NativeActionIcon(noIcon,'Nova nota'),'file-plus');
 assert.equal(api.writerV1012NativeActionIcon(noIcon,'Nova pasta'),'folder-plus');
 assert.equal(api.writerV1012NativeActionIcon(noIcon,'Expandir tudo'),'chevrons-up-down');
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/Keep Obsidian's real action buttons laid out/);
 assert.match(css,/opacity:0;pointer-events:none/);
 assert.doesNotMatch(css,/writer-v1011-empty-native-header\{\s*display:none/);
});
test('Mobile sidebar reconstructs its header if Obsidian replaces the native tab host',()=>{
 const {doc,node}=html(),root=node(),native=node(),tabs=node();
 // Simulate a changed mobile header with an attached, live host.
 root.appendChild(tabs);tabs.appendChild(native);root.contains=target=>{
  const visit=el=>el===target||el.children.some(visit);
  return visit(root);
 };
 let ready,cleanup;
 const watchers=[];
 class MutationObserver{
  constructor(cb){this.cb=cb;watchers.push(this);}
  observe(){}disconnect(){}
 }
 const {api,callbacks,logs}=loadMobile({MutationObserver});
 const a={view:{getViewType:()=> 'file-explorer'}};
 const drawer={type:'mobile-drawer',containerEl:root,tabsContainerEl:tabs,tabsListEl:native,
  children:[a],currentTab:0,headerEl:node(),isPinned:false,selectTabIndex(i){this.currentTab=i;}};
 const workspace={leftSplit:drawer,rightSplit:{},activeLeaf:a,
  iterateAllLeaves(fn){fn(a);},getActiveFile:()=>null,onLayoutReady(fn){ready=fn;},
  on(){return {};},setActiveLeaf(){}};
 const plugin={settings:{v1010Layout:{sidebar:{enabled:true,mobileTabs:true},width:{enabled:false}}},
  app:{workspace},registerEvent(){},addStatusBarItem:()=>null,register(fn){cleanup=fn;},
  saveSettings:async()=>{}};
 api.writerV1010Register(plugin);ready();
 while(callbacks.length)callbacks.shift()();
 const initial=tabs.children.find(n=>n.classList.contains('writer-v1010-sidebar-toolbar'));
 assert.ok(initial);
 const freshTabs=node(),freshNative=node();
 root.replaceChildren(freshTabs);freshTabs.appendChild(freshNative);
 drawer.tabsContainerEl=freshTabs;drawer.tabsListEl=freshNative;
 watchers.forEach(w=>w.cb());
 while(callbacks.length)callbacks.shift()();
 const replacement=freshTabs.children.find(n=>n.classList.contains('writer-v1010-sidebar-toolbar'));
 assert.ok(replacement,'Basic toolbar is remounted in replacement header after switching views');
 assert.notEqual(replacement,initial);
 assert.equal(logs.length,0);
 cleanup();
 assert.ok(!root.classList.contains('writer-v1011-managed-mobile'));
});
