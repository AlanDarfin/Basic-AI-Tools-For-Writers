'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v9/spaces-dock.js','utf8');
function setup(){
 const doc={},callbacks=[],events={},observers=[],destroy=[];
 function node(tag='div'){
  const names=new Set();
  const n={
   tagName:tag.toUpperCase(),ownerDocument:doc,children:[],parentElement:null,
   dataset:{},attributes:{},style:{setProperty(){}},hidden:false,id:'',
   classList:{
    add(...values){values.forEach(v=>names.add(v));},
    remove(...values){values.forEach(v=>names.delete(v));},
    contains(value){return names.has(value);},
    toggle(value,on){const active=on===undefined?!names.has(value):on;
     if(active)names.add(value);else names.delete(value);return active;}
   },
   appendChild(child){
    child.remove();this.children.push(child);child.parentElement=this;return child;
   },
   replaceChildren(...children){
    for(const child of this.children)child.parentElement=null;
    this.children=[];children.forEach(child=>this.appendChild(child));
   },
   remove(){if(!this.parentElement)return;const p=this.parentElement;
    p.children=p.children.filter(x=>x!==this);this.parentElement=null;},
   contains(child){return child===this||this.children.some(x=>x.contains(child));},
   querySelector(selector){
    const className=String(selector).match(/\.([a-z][a-z0-9-]*)/i)?.[1];
    if(!className)return null;
    const direct=String(selector).startsWith(':scope > ');
    const find=(host,deep)=>{
     for(const child of host.children){
      if(child.classList.contains(className))return child;
      if(deep){const matched=find(child,true);if(matched)return matched;}
     }
     return null;
    };
    return find(this,!direct);
   },
   querySelectorAll(){return [];},
   setAttribute(key,value){this.attributes[key]=String(value);},
   getAttribute(key){return this.attributes[key]||null;},
   addEventListener(type,callback){(this._listeners??={})[type]=callback;},
   click(){this._listeners?.click?.({
    clientX:2,clientY:2,preventDefault(){},stopPropagation(){}});
   }
  };
  Object.defineProperty(n,'className',{
   get:()=>[...names].join(' '),
   set:value=>{names.clear();String(value).split(/\s+/).filter(Boolean).forEach(v=>names.add(v));}
  });
  return n;
 }
 doc.createElement=node;doc.body=node('body');
 const root=node(),tabs=node(),native=node();
 root.appendChild(tabs);tabs.appendChild(native);
 const drawer={
  type:'mobile-drawer',containerEl:root,tabsContainerEl:tabs,tabsListEl:native,
  currentTab:0,children:[{view:{getViewType:()=> 'file-explorer'}},
    {view:{getViewType:()=> 'global-search'}}],selectTabIndex(index){this.currentTab=index;}
 };
 const workspace={
  leftSplit:drawer,rightSplit:{},getLeavesOfType(){return [];},
  on(type,fn){(events[type]??=[]).push(fn);return {type,fn};},
  onLayoutReady(fn){events.ready=fn;}
 };
 const settings={v9Spaces:{
  enabled:true,dock:true,manageIcon:true,activeId:'',spaces:[
   {id:'work',name:'Trabalho',icon:'briefcase',iconColor:''},
   {id:'personal',name:'Pessoal',icon:'book-open',iconColor:''}
  ]},
  v1010Layout:{sidebar:{enabled:true,mobileTabs:true,integrateSpaces:true}}
 };
 const plugin={
  settings,app:{workspace},
  addCommand(){},registerEvent(){},register(fn){destroy.push(fn);},
  async saveSettings(){}
 };
 const os={
  Platform:{isMobile:true},
  setIcon(el,name){el._icon=name;},
  Menu:class{addItem(){}addSeparator(){}showAtMouseEvent(){}}
 };
 const context={
  require(name){assert.equal(name,'obsidian');return os;},
  writerUi:(pt,en)=>pt,writerModuleOn:()=>true,
  writerV9215ActiveSpace:pl=>pl.settings.v9Spaces.spaces
   .find(space=>space.id===pl.settings.v9Spaces.activeId)||null,
  async writerV9215SelectSpace(pl,id){
   pl.settings.v9Spaces.activeId=id;pl.writerV9216SpacesDockRefresh?.();
  },
  console,Promise,Set,String,JSON,
  setTimeout(fn){callbacks.push(fn);return callbacks.length;},
  clearTimeout(){},
  MutationObserver:class{
   constructor(fn){this.callback=fn;this.disconnected=false;observers.push(this);}
   observe(root,config){this.root=root;this.config=config;}
   disconnect(){this.disconnected=true;}
  }
 };
 const api=vm.runInNewContext(source+
  '\n({writerV1014MobileSpacesAnchor,writerV9216SpaceDockRegister})',context);
 const flush=()=>{let runs=0;while(callbacks.length){
  if(++runs>30)throw Error('Unexpected repeat refresh loop');
  callbacks.shift()();
 }};
 return {api,plugin,root,tabs,drawer,settings,events,observers,destroy,flush,node};
}
test('Mobile Spaces anchor follows the native sidebar tab host, independent of active tab',()=>{
 const {api,plugin,tabs,drawer,root,node}=setup();
 assert.equal(api.writerV1014MobileSpacesAnchor(plugin),tabs);
 drawer.currentTab=1;
 assert.equal(api.writerV1014MobileSpacesAnchor(plugin),tabs);
 const replacement=node();root.replaceChildren(replacement);
 drawer.tabsContainerEl=replacement;
 assert.equal(api.writerV1014MobileSpacesAnchor(plugin),replacement);
 plugin.settings.v1010Layout.sidebar.integrateSpaces=false;
 assert.equal(api.writerV1014MobileSpacesAnchor(plugin),null);
});
test('Collapsed Spaces toggle stays in native tab host through tab switches',async()=>{
 const {api,plugin,tabs,drawer,events,flush,destroy}=setup();
 api.writerV9216SpaceDockRegister(plugin);events.ready();flush();
 const dock=tabs.querySelector(':scope > .writer-v9216-spaces-dock');
 assert.ok(dock,'fixed Spaces trigger belongs to native tab bar');
 assert.equal(dock.parentElement,tabs);
 assert.equal(dock.classList.contains('writer-v1014-collapsible-spaces'),true);
 let toggle=dock.querySelector(':scope > .writer-v1014-spaces-toggle');
 assert.ok(toggle);
 assert.equal(toggle.getAttribute('aria-expanded'),'false');
 assert.equal(dock.querySelector('.writer-v1014-spaces-options').hidden,true);
 drawer.currentTab=1;events['active-leaf-change'].forEach(fn=>fn());flush();
 assert.equal(tabs.querySelector(':scope > .writer-v9216-spaces-dock'),dock);
 toggle.click();
 toggle=dock.querySelector(':scope > .writer-v1014-spaces-toggle');
 assert.equal(toggle.getAttribute('aria-expanded'),'true');
 const panel=dock.querySelector('.writer-v1014-spaces-options');
 assert.equal(panel.hidden,false);
 const rail=panel.querySelector('.writer-v9216-spaces-rail');
 const group=rail.children.find(el=>el.classList.contains('writer-v9216-space-group'));
 assert.ok(group,'the expanded menu lists saved Spaces');
 group.querySelector('.writer-v9216-space-chip').click();
 await Promise.resolve();await Promise.resolve();flush();
 assert.equal(plugin.settings.v9Spaces.activeId,'work');
 toggle=dock.querySelector(':scope > .writer-v1014-spaces-toggle');
 assert.equal(toggle.getAttribute('aria-expanded'),'false','selection collapses menu');
 assert.ok(toggle.querySelector('.writer-v1014-spaces-current').textContent.includes('Trabalho'));
 destroy.forEach(fn=>fn());
 assert.equal(tabs.querySelector(':scope > .writer-v9216-spaces-dock'),null);
});
test('Spaces selector is restored when Android recreates native tabs',()=>{
 const {api,plugin,tabs,root,node,drawer,events,observers,flush,destroy}=setup();
 api.writerV9216SpaceDockRegister(plugin);events.ready();flush();
 const oldDock=tabs.querySelector(':scope > .writer-v9216-spaces-dock');
 const newTabs=node(),newNative=node();newTabs.appendChild(newNative);
 root.replaceChildren(newTabs);drawer.tabsContainerEl=newTabs;drawer.tabsListEl=newNative;
 assert.ok(observers.length);
 observers[0].callback([{type:'childList'}]);flush();
 const newDock=newTabs.querySelector(':scope > .writer-v9216-spaces-dock');
 assert.ok(newDock,'Space trigger remounts to rebuilt native tab host');
 assert.notEqual(newDock,oldDock);
 assert.equal(oldDock.parentElement,null,'stale host dock cleaned');
 destroy.forEach(fn=>fn());
 assert.equal(observers[0].disconnected,true);
});
test('The mobile collapsing panel is positioned above tabs, not in explorer scroll',()=>{
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/\.writer-v1014-mobile-spaces-anchor/);
 assert.match(css,/inset:auto 8px calc\(100% \+ 3px\)/);
 assert.match(css,/\.writer-v1014-spaces-options\[hidden\]/);
 assert.match(css,/\.writer-v1014-spaces-toggle/);
 const source=fs.readFileSync('src/v9/spaces-dock.js','utf8');
 assert.doesNotMatch(source,/const mount=root\.querySelector\?\.\('\.workspace-drawer-inner'\)/);
});
