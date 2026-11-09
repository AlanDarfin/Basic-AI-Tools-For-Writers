'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v9/spaces-dock.js','utf8');

function setup(){
 const documentEvents=new Map(),events={},cleanup=[],observers=[],timers=new Map(),commands=[],notices=[];let serial=0,currentPicker=null;
 const doc={activeElement:null,
  addEventListener(type,fn){if(!documentEvents.has(type))documentEvents.set(type,new Set());documentEvents.get(type).add(fn);},
  removeEventListener(type,fn){documentEvents.get(type)?.delete(fn);}
 };
 function node(tag='div'){
  const classes=new Set(),listeners=new Map();
  const el={tagName:tag.toUpperCase(),ownerDocument:doc,children:[],parentElement:null,dataset:{},attributes:{},
   value:'',hidden:false,style:{setProperty(){}},
   classList:{add(...items){items.forEach(x=>classes.add(x));},remove(...items){items.forEach(x=>classes.delete(x));},
    contains:item=>classes.has(item),toggle(item,on=!classes.has(item)){if(on)classes.add(item);else classes.delete(item);return on;}},
   appendChild(child){child.remove();child.parentElement=this;this.children.push(child);return child;},
   replaceChildren(...children){for(const child of this.children)child.parentElement=null;this.children=[];children.forEach(child=>this.appendChild(child));},
   remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null;},
   contains(child){return this===child||this.children.some(x=>x.contains(child));},
   querySelector(selector){
    const name=selector.match(/\.([a-z][a-z0-9-]*)/i)?.[1];if(!name)return null;
    const direct=selector.startsWith(':scope > ');
    for(const child of this.children){if(child.classList.contains(name))return child;const nested=!direct&&child.querySelector(selector);if(nested)return nested;}
    return null;
   },
   closest(selector){for(let current=this;current;current=current.parentElement){
    if(selector.split(',').some(part=>current.classList.contains(part.trim().slice(1))))return current;
   }return null;},
   setAttribute(name,value){this.attributes[name]=String(value);},getAttribute(name){return this.attributes[name]??null;},
   addEventListener(type,fn){listeners.set(type,fn);},
   dispatch(type,extra={}){listeners.get(type)?.({target:this,preventDefault(){},stopPropagation(){},...extra});},
   click(){this.dispatch('click');},
   focus(){doc.activeElement=this;},setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}
  };
  Object.defineProperty(el,'className',{get:()=>[...classes].join(' '),set:value=>{classes.clear();String(value).split(/\s+/).filter(Boolean).forEach(x=>classes.add(x));}});
  Object.defineProperty(el,'isConnected',{get:()=>doc.body?.contains(el)||false});
  return el;
 }
 doc.createElement=node;doc.body=node('body');
 const root=node();root.className='workspace-drawer';doc.body.appendChild(root);
 const tabs=node();tabs.className='workspace-drawer-tab-options';root.appendChild(tabs);
 const drawer={type:'mobile-drawer',containerEl:root,tabsContainerEl:tabs};
 const settings={v9Spaces:{enabled:true,dock:true,manageIcon:true,activeId:'',spaces:[
  {id:'fiction',name:'Ficção',icon:'book',folder:'Livros/Contos'},
  {id:'work',name:'Trabalho',icon:'briefcase',folder:'Projetos'},
  {id:'study',name:'Estudos',icon:'graduation-cap',folder:'Universidade'}
 ]},v1010Layout:{sidebar:{enabled:false,mobileTabs:false,integrateSpaces:true}}};
 const workspace={leftSplit:drawer,getLeavesOfType:()=>[],on(type,fn){(events[type]??=[]).push(fn);return {};},onLayoutReady(fn){events.ready=fn;}};
 const plugin={settings,app:{workspace},addCommand:command=>commands.push(command),registerEvent(){},register:fn=>cleanup.push(fn),saveSettings:async()=>{}};
 const api=vm.runInNewContext(source+'\n({writerV1014MobileSpacesAnchor,writerV9216SpaceDockRegister})',{
  require:()=>({Platform:{isMobile:true},setIcon(){},Menu:class{},FuzzySuggestModal:class{
   setPlaceholder(value){this.placeholder=value;return this;}open(){currentPicker=this;}
  }}),writerUi:(pt,en)=>pt,writerModuleOn:()=>plugin._testModuleOn!==false,
  Notice:class{constructor(message){notices.push(message);}},
  writerV9215ActiveSpace:pl=>pl.settings.v9Spaces.spaces.find(x=>x.id===pl.settings.v9Spaces.activeId),
  writerV9215SelectSpace:async(pl,id)=>{if(pl._testSelectError)throw Error(pl._testSelectError);pl.settings.v9Spaces.activeId=id;pl.writerV9216SpacesDockRefresh?.();},
  setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),
  MutationObserver:class{constructor(fn){this.callback=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},console
 });
 const flush=()=>{let runs=0;while(timers.size){if(++runs>20)throw Error('Refresh loop');const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}};
 const start=()=>{api.writerV9216SpaceDockRegister(plugin);events.ready();flush();};
 const dock=()=>root.querySelector('.writer-v1014-collapsible-spaces');
 const documentEvent=(type,target,extra={})=>{const event={target,preventDefault(){this.prevented=true;},stopPropagation(){},...extra};for(const fn of documentEvents.get(type)||[])fn(event);return event;};
 return {api,plugin,settings,workspace,root,tabs,drawer,doc,node,events,observers,cleanup,documentEvents,flush,start,dock,documentEvent,commands,notices,get picker(){return currentPicker;}};
}

test('Spaces integrate with native mobile tabs without enabling Basic sidebar controls or private selection methods',()=>{
 const h=setup();assert.equal(h.api.writerV1014MobileSpacesAnchor(h.plugin),h.tabs);
 h.start();assert.equal(h.dock().parentElement,h.tabs);
 assert.equal(h.settings.v1010Layout.sidebar.enabled,false);
 assert.equal(h.settings.v1010Layout.sidebar.mobileTabs,false);
 h.settings.v1010Layout.sidebar.integrateSpaces=false;
 assert.equal(h.api.writerV1014MobileSpacesAnchor(h.plugin),null);
 h.plugin.writerV9216SpacesDockRefresh();h.flush();assert.equal(h.dock(),null);
});

test('mobile Spaces search matches accents and folders, retains focus through refresh and selects the requested Space',async()=>{
 const h=setup();h.start();h.dock().querySelector('.writer-v1014-spaces-toggle').click();
 let search=h.dock().querySelector('.writer-v133-spaces-search');search.focus();search.value='FICCAO';search.setSelectionRange(2,4);search.dispatch('input');
 const groups=h.dock().querySelector('.writer-v9216-spaces-rail').children.filter(x=>x.classList.contains('writer-v9216-space-group'));
 assert.equal(groups[0].hidden,false);assert.equal(groups[1].hidden,true);assert.equal(groups[2].hidden,true);
 h.settings.v9Spaces.spaces[0].name='Ficção revisada';h.plugin.writerV9216SpacesDockRefresh();h.flush();
 search=h.dock().querySelector('.writer-v133-spaces-search');
 assert.equal(h.doc.activeElement,search);assert.equal(search.value,'FICCAO');assert.equal(search.selectionStart,2);assert.equal(search.selectionEnd,4);
 search.value='universidade';search.dispatch('input');
 const refreshed=h.dock().querySelector('.writer-v9216-spaces-rail').children.filter(x=>x.classList.contains('writer-v9216-space-group'));
 assert.deepEqual(refreshed.map(x=>x.hidden),[true,true,false]);
 refreshed[2].querySelector('.writer-v9216-space-chip').click();await Promise.resolve();await Promise.resolve();h.flush();
 assert.equal(h.settings.v9Spaces.activeId,'study');assert.equal(h.dock().querySelector('.writer-v1014-spaces-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(h.dock().querySelector('.writer-v133-spaces-search').value,'');
});

test('editing only a Space folder refreshes the open search index without losing the query',()=>{
 const h=setup();h.start();h.dock().querySelector('.writer-v1014-spaces-toggle').click();
 let search=h.dock().querySelector('.writer-v133-spaces-search');
 search.value='universidade';search.dispatch('input');
 h.settings.v9Spaces.spaces[2].folder='Pesquisa';
 h.plugin.writerV9216SpacesDockRefresh();h.flush();
 search=h.dock().querySelector('.writer-v133-spaces-search');
 assert.equal(search.value,'universidade');
 assert.equal(h.dock().querySelector('.writer-v133-spaces-empty').hidden,false);
 search.value='pesquisa';search.dispatch('input');
 const groups=h.dock().querySelector('.writer-v9216-spaces-rail').children.filter(x=>x.classList.contains('writer-v9216-space-group'));
 assert.deepEqual(groups.map(x=>x.hidden),[true,true,false]);
});

test('search reports no matches without hiding Entire vault and closes with Escape or a tap outside',()=>{
 const h=setup();h.start();let toggle=h.dock().querySelector('.writer-v1014-spaces-toggle');toggle.click();
 const search=h.dock().querySelector('.writer-v133-spaces-search');search.value='inexistente';search.dispatch('input');
 assert.equal(h.dock().querySelector('.writer-v133-spaces-empty').hidden,false);
 assert.equal(h.dock().querySelector('.writer-v9216-space-all').hidden,false);
 const event=h.documentEvent('keydown',search,{key:'Escape'});assert.equal(event.prevented,true);
 toggle=h.dock().querySelector('.writer-v1014-spaces-toggle');assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(h.doc.activeElement,toggle);
 toggle.click();h.documentEvent('pointerdown',h.dock().querySelector('.writer-v133-spaces-search'));
 assert.equal(h.dock().querySelector('.writer-v1014-spaces-toggle').getAttribute('aria-expanded'),'true');
 const menu=h.node();menu.className='menu';h.doc.body.appendChild(menu);h.documentEvent('pointerdown',menu);
 assert.equal(h.dock().querySelector('.writer-v1014-spaces-toggle').getAttribute('aria-expanded'),'true','native options sheet keeps its anchor');
 const outside=h.node();h.doc.body.appendChild(outside);h.documentEvent('pointerdown',outside);
 assert.equal(h.dock().querySelector('.writer-v1014-spaces-toggle').getAttribute('aria-expanded'),'false');
});

test('Spaces remount on a live replacement header even when the drawer keeps a detached reference',()=>{
 const h=setup();h.start();const old=h.dock(),replacement=h.node();replacement.className='workspace-drawer-tab-options';
 h.root.replaceChildren(replacement);h.observers[0].callback([]);h.flush();
 assert.equal(h.dock().parentElement,replacement);assert.notEqual(h.dock(),old);assert.equal(old.parentElement,null);
 h.workspace.leftSplit={type:'mobile-drawer',containerEl:h.root};
 assert.equal(h.api.writerV1014MobileSpacesAnchor(h.plugin),replacement,'DOM fallback does not depend on private fields');
});

test('disabling the dock and unloading remove controls and document handlers without resurrection',()=>{
 const h=setup();h.start();h.dock().querySelector('.writer-v1014-spaces-toggle').click();
 h.settings.v9Spaces.dock=false;h.plugin.writerV9216SpacesDockRefresh();h.flush();assert.equal(h.dock(),null);
 h.settings.v9Spaces.dock=true;h.plugin.writerV9216SpacesDockRefresh();h.flush();
 assert.equal(h.dock().querySelector('.writer-v1014-spaces-toggle').getAttribute('aria-expanded'),'false');
 h.plugin.writerV9216SpacesDockRefresh();h.cleanup.forEach(fn=>fn());h.flush();
 assert.equal(h.dock(),null);assert.equal(h.documentEvents.get('pointerdown').size,0);assert.equal(h.documentEvents.get('keydown').size,0);
 h.observers[0].callback([]);h.flush();assert.equal(h.dock(),null);assert.equal(h.observers[0].disconnected,true);
});

test('searchable Space chooser works without opening Explorer and preserves the Entire vault action',async()=>{
 const h=setup();h.start();h.settings.v9Spaces.dock=false;
 h.commands.find(command=>command.id==='v133-spaces-switch').callback();
 assert.ok(h.picker);assert.equal(h.picker.placeholder,'Selecionar Space…');
 const options=h.picker.getItems();assert.deepEqual(Array.from(options,space=>space.id),['','fiction','work','study']);
 assert.equal(h.picker.getItemText(options[1]),'Ficção');
 await h.picker.onChooseItem(options[1]);h.flush();assert.equal(h.settings.v9Spaces.activeId,'fiction');
 await h.picker.onChooseItem(options[0]);h.flush();assert.equal(h.settings.v9Spaces.activeId,'');
 h.plugin._testSelectError='disk busy';await h.picker.onChooseItem(options[2]);
 assert.ok(h.notices.some(message=>message.includes('disk busy')));
 h.plugin._testSelectError=null;h.picker.onChooseItem({id:'deleted',name:'Deleted'});
 assert.equal(h.settings.v9Spaces.activeId,'');assert.ok(h.notices.some(message=>message.includes('não está mais disponível')));
 h.cleanup.forEach(fn=>fn());assert.equal(h.plugin.writerV133SpacesChoose,null);
});

test('Space chooser directs users to enable a disabled module instead of silently changing configuration',()=>{
 const h=setup();h.start();h.plugin._testModuleOn=false;
 h.plugin.writerV133SpacesChoose();assert.equal(h.picker,null);assert.equal(h.notices.length,1);
 h.plugin._testModuleOn=true;h.settings.v9Spaces.enabled=false;
 h.plugin.writerV133SpacesChoose();assert.equal(h.picker,null);assert.equal(h.notices.length,2);
 assert.equal(h.settings.v9Spaces.enabled,false);
});
