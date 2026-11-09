'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8')+'\n'+fs.readFileSync('src/v11/mobile-panel-actions.js','utf8');
function harness(options={}){
 const timers=new Map(),observers=[],menus=[],cleanups=[],logs=[];let serial=0;
 const doc={};
 function node(cls=''){
  const classes=new Set(cls.split(/\s+/).filter(Boolean)),attributes={},listeners={};
  const el={children:[],parentElement:null,ownerDocument:doc,dataset:{},style:{setProperty(){},removeProperty(){}},clientWidth:410,isConnected:true,
   classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains:v=>classes.has(v),
    toggle(v,on){const yes=on===undefined?!classes.has(v):on;if(yes)classes.add(v);else classes.delete(v);return yes;}},
   get className(){return [...classes].join(' ');},set className(value){classes.clear();String(value).split(/\s+/).filter(Boolean).forEach(x=>classes.add(x));},
   appendChild(child){child.remove();child.isConnected=this.isConnected;child.parentElement=this;this.children.push(child);return child;},
   remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null;},
   replaceChildren(...items){this.children.forEach(x=>{x.parentElement=null;x.isConnected=false;});this.children=[];items.forEach(x=>this.appendChild(x));},
   contains(target){return this===target||this.children.some(x=>x.contains(target));},
   setAttribute(k,v){attributes[k]=String(v);},getAttribute:k=>attributes[k]??null,
   querySelector(selector){return this.querySelectorAll(selector)[0]||null;},
   querySelectorAll(selector){
    if(selector.includes('.view-actions'))return this.actions||[];
    const found=[];const visit=current=>{for(const child of current.children){
     if(selector.includes('writer-v1010-sidebar-button')?child.classList.contains('writer-v1010-sidebar-button')&&child.getAttribute('data-view-type')!==null:
      selector.startsWith('.')&&child.classList.contains(selector.slice(1)))found.push(child);
     visit(child);
    }};visit(this);return found;
   },
   closest(){return null;},
   addEventListener(type,fn,capture){(listeners[type]??=[]).push({fn,capture:!!capture});},
   dispatch(type,props={}){let stopped=false;const event={button:0,pointerType:'touch',isPrimary:true,clientX:10,clientY:12,
    preventDefault(){},stopPropagation(){},stopImmediatePropagation(){stopped=true;},...props};
    for(const item of [...(listeners[type]||[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){if(stopped)break;item.fn(event);}},
   click(){this.dispatch('click');},getBoundingClientRect:()=>({left:0,top:0,width:40,height:40})
  };return el;
 }
 doc.createElement=()=>node();doc.body=node();
 class Menu{
  constructor(){this.items=[];menus.push(this);}
  addItem(fn){const item={setTitle(v){this.title=v;return this;},setIcon(v){this.icon=v;return this;},onClick(fn){this.run=fn;return this;}};fn(item);this.items.push(item);return this;}
  addSeparator(){}showAtPosition(){}showAtMouseEvent(){}
 }
 class MutationObserver{
  constructor(callback){this.callback=callback;observers.push(this);}
  observe(root,options){this.root=root;this.options=options;}disconnect(){this.disconnected=true;}
 }
 const context={console:{warn:(...v)=>logs.push(v),error:(...v)=>logs.push(v)},writerUi:(_pt,en)=>en,
  require:()=>({Platform:{isMobile:true,isPhone:options.phone!==false},setIcon:(host,name)=>{host.icon=name;}}),
  Menu,MutationObserver,Notice:class{},setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)};
 const api=vm.runInNewContext(source+'\n({writerV1010Register,writerV1010CollectLeaves,writerV1010SelectLeaf,writerV1010MobileDrawer,writerV133DrawerTabsHost,writerV133LeafInfo})',context);
 const root=node('workspace-drawer'),header=node('workspace-drawer-tab-options'),native=node('workspace-drawer-tab-options-list');
 root.appendChild(header);header.appendChild(native);
 const drawer={type:'mobile-drawer',children:[],containerEl:root,tabsContainerEl:header,tabsListEl:native,currentTab:0,isPinned:false,
  selectTabIndex(index){this.selected=index;this.currentTab=index;},setTabOptionsCollapsed(value){this.optionsCollapsed=value;}};
 const workspace={leftSplit:drawer,rightSplit:{},activeLeaf:null,activated:[],
  setActiveLeaf(leaf,options){this.activeLeaf=leaf;this.activated.push({leaf,options});},
  getActiveFile:()=>null,onLayoutReady(fn){this.ready=fn;},on(){return {};},
  iterateAllLeaves(fn){drawer.children.forEach(fn);(this.mainLeaves||[]).forEach(fn);}};
 const plugin={app:{workspace,vault:{}},settings:{v1010Layout:{sidebar:{enabled:true,mobileTabs:true},width:{enabled:false}}},
  addStatusBarItem:()=>null,registerEvent(){},register(fn){cleanups.push(fn);},saveSettings:async()=>{}};
 function leaf(type,title=type,icon='panels'){
  const item={id:'native-'+(++serial),getRoot:()=>drawer,
   view:{containerEl:node(),getViewType:()=>type,getDisplayText:()=>title,getIcon:()=>icon},getViewState:()=>({type}),
   detached:0,detach(){this.detached++;drawer.children=drawer.children.filter(x=>x!==this);}};
  return item;
 }
 const flush=()=>{let count=0;while(timers.size){if(++count>100)throw Error('Timer loop');const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}};
 const start=()=>{api.writerV1010Register(plugin);workspace.ready();flush();};
 const bar=()=>header.children.find(x=>x.classList.contains('writer-v1010-sidebar-toolbar'));
 return {api,node,doc,root,header,native,drawer,workspace,plugin,leaf,flush,start,bar,observers,menus,timers,logs,
  stop:()=>cleanups.forEach(fn=>fn())};
}

test('mobile inventory keeps every leaf instance including Markdown and plugin views',()=>{
 const h=harness(),a=h.leaf('outline','Outline A','apple'),b=h.leaf('outline','Outline B','banana'),md=h.leaf('markdown','Chapter.md','file-text');
 h.drawer.children=[a,b,md];
 const main=h.leaf('markdown','Main.md');main.getRoot=()=>({});h.workspace.mainLeaves=[main];
 const entries=h.api.writerV1010CollectLeaves(h.workspace,'left');
 assert.deepEqual(Array.from(entries,x=>x.leaf),[a,b,md]);
 assert.notEqual(entries[0].key,entries[1].key);
 assert.equal(h.api.writerV133LeafInfo(entries[0]).title,'Outline A');
 assert.equal(h.api.writerV133LeafInfo(entries[1]).icon,'banana');
 h.start();const buttons=h.bar().children.filter(x=>x.getAttribute('data-leaf-key'));
 assert.equal(buttons.length,3);
 assert.deepEqual(buttons.map(x=>x.getAttribute('aria-label')),['Outline A','Outline B','Chapter.md']);
 buttons[1].click();h.flush();
 assert.equal(h.drawer.selected,1);assert.equal(h.workspace.activeLeaf,b);
 assert.equal(buttons.filter(x=>x.getAttribute('aria-pressed')==='true').length,1);
 assert.equal(buttons[1].getAttribute('aria-pressed'),'true');
});

test('nested sidebar leaves select their native drawer group and reveal the requested instance',()=>{
 const h=harness(),first=h.leaf('outline','First'),second=h.leaf('outline','Second');
 h.drawer.children=[{children:[first,second]}];
 const revealed=[];h.workspace.revealLeaf=leaf=>{revealed.push(leaf);return Promise.resolve();};
 assert.equal(h.api.writerV1010CollectLeaves(h.workspace,'left').length,2);
 assert.equal(h.api.writerV1010SelectLeaf(h.plugin,'left',second),true);
 assert.equal(h.drawer.selected,0);assert.equal(h.workspace.activeLeaf,second);
 assert.deepEqual(revealed,[second]);
});

test('disabled sidebar observers do not schedule refreshes from native or cleanup mutations',()=>{
 const h=harness();h.drawer.children=[h.leaf('outline')];h.start();
 const observer=h.observers[0];h.plugin.settings.v1010Layout.sidebar.enabled=false;
 h.plugin.writerV1010Refresh();h.flush();
 observer.callback([{type:'attributes'},{type:'childList'}]);
 assert.equal(h.timers.size,0);
 h.plugin.settings.v1010Layout.sidebar.enabled=true;
 h.drawer.tabsListEl=null;h.header.replaceChildren();h.plugin.writerV1010Refresh();h.flush();
 observer.callback([{type:'attributes'}]);
 assert.equal(h.timers.size,0,'native fallback ignores its own class cleanup');
});

test('replacing a leaf with another of the same type updates both click and long-press targets',async()=>{
 const h=harness(),a=h.leaf('outline','Outline');h.drawer.children=[a];h.start();
 const first=h.bar().children[0],replacement=h.leaf('outline','Outline');h.drawer.children=[replacement];
 h.plugin.writerV1010Refresh();h.flush();const current=h.bar().children[0];
 assert.notEqual(current,first);
 current.click();h.flush();assert.equal(h.workspace.activeLeaf,replacement);
 current.dispatch('contextmenu');
 await h.menus.at(-1).items.find(x=>x.title==='Close panel').run();
 assert.equal(replacement.detached,1);assert.equal(a.detached,0);
});

test('native drawer mutations detect new, removed and renamed tabs without changing the active leaf',()=>{
 const h=harness(),a=h.leaf('outline','Outline A');h.drawer.children=[a];h.start();
 const observer=h.observers[0];assert.ok(observer.options.attributes);assert.ok(observer.options.characterData);
 const b=h.leaf('outline','Outline B');h.drawer.children.push(b);observer.callback();
 assert.ok(h.timers.size);h.flush();assert.equal(h.bar().children.filter(x=>x.getAttribute('data-leaf-key')).length,2);
 b.view.getDisplayText=()=> 'Renamed panel';b.view.getIcon=()=> 'star';observer.callback();h.flush();
 assert.equal(h.bar().children[1].getAttribute('aria-label'),'Renamed panel');assert.equal(h.bar().children[1].icon,'star');
 h.drawer.children.pop();observer.callback();h.flush();assert.equal(h.bar().children.filter(x=>x.getAttribute('data-leaf-key')).length,1);
 assert.equal(h.drawer.currentTab,0);
});

test('stable toolbar menu reads actions from the newly active view after a native tab switch',()=>{
 const h=harness(),a=h.leaf('file-explorer','Files'),b=h.leaf('global-search','Search');h.drawer.children=[a,b];
 for(const [item,label] of [[a,'Files action'],[b,'Search action']]){const action=h.node();action.setAttribute('aria-label',label);item.view.containerEl.actions=[action];}
 h.start();const bar=h.bar(),menu=bar.children.at(-1);
 h.drawer.currentTab=1;h.observers[0].callback();h.flush();
 assert.equal(h.bar(),bar);assert.equal(h.bar().children.at(-1),menu,'The anchor remains stable');
 menu.click();
 assert.ok(h.menus.at(-1).items.some(x=>x.title==='Search action'));
 assert.equal(h.menus.at(-1).items.some(x=>x.title==='Files action'),false);
});

test('overflow menus retain duplicate view instances and their own titles',()=>{
 const h=harness();h.root.clientWidth=180;
 h.drawer.children=Array.from({length:5},(_,i)=>h.leaf('outline','Outline '+i,'list-tree'));h.start();
 const menu=h.bar().children.at(-1);menu.click();
 const options=h.menus.at(-1).items.filter(x=>x.title.startsWith('Outline '));
 assert.deepEqual(options.map(x=>x.title),['Outline 2','Outline 3','Outline 4']);
 options[1].run();h.flush();assert.equal(h.workspace.activeLeaf,h.drawer.children[3]);
});

test('the action menu keeps late overflow panels accessible in large sidebars',()=>{
 const h=harness();h.drawer.children=Array.from({length:32},(_,index)=>h.leaf('outline','Panel '+index));
 h.start();h.bar().children.find(button=>button.getAttribute('data-view-type')==='__overflow').click();
 const last=h.menus.at(-1).items.find(item=>item.title==='Panel 31');
 assert.ok(last,'overflow must not silently omit panels after the first twenty');
 last.run();h.flush();assert.equal(h.drawer.selected,31);assert.equal(h.workspace.activeLeaf,h.drawer.children[31]);
});

test('pinned tablet selection preserves editor focus and missing private DOM falls back safely',()=>{
 const h=harness({phone:false}),a=h.leaf('outline');h.drawer.children=[a];h.drawer.isPinned=true;
 assert.equal(h.api.writerV1010SelectLeaf(h.plugin,'left',a),true);
 assert.equal(h.drawer.selected,0);assert.equal(h.drawer.optionsCollapsed,true);assert.equal(h.workspace.activated.length,0);
 h.drawer.tabsListEl=null;h.header.replaceChildren();h.start();
 assert.equal(h.bar(),undefined);assert.equal(h.root.classList.contains('writer-v1011-managed-mobile'),false);
 assert.equal(h.api.writerV1010CollectLeaves(h.workspace,'left').length,1,'Inventory does not depend on private selector DOM');
 h.drawer.selectTabIndex=null;assert.equal(h.api.writerV1010MobileDrawer(h.workspace,'left'),null);
 assert.equal(h.api.writerV133DrawerTabsHost(h.workspace,'left'),h.header,'Spaces can still use a native DOM anchor');
});

test('disabling and unloading restore the original native selector after a header replacement',()=>{
 const h=harness();h.drawer.children=[h.leaf('outline')];h.start();assert.ok(h.native.classList.contains('writer-v1011-native-tabs-hidden'));
 const oldNative=h.native,fresh=h.node('workspace-drawer-tab-options-list');
 h.header.replaceChildren(fresh);h.drawer.tabsListEl=fresh;h.plugin.writerV1010Refresh();h.flush();
 assert.equal(oldNative.classList.contains('writer-v1011-native-tabs-hidden'),false);assert.ok(fresh.classList.contains('writer-v1011-native-tabs-hidden'));
 h.plugin.settings.v1010Layout.sidebar.enabled=false;h.plugin.writerV1010Refresh();h.flush();
 assert.equal(fresh.classList.contains('writer-v1011-native-tabs-hidden'),false);assert.equal(h.bar(),undefined);
 h.stop();assert.ok(h.observers.every(x=>x.disconnected));assert.equal(h.logs.length,0);
});
