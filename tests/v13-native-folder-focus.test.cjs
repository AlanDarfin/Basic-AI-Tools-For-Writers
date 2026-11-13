'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class TFolder{constructor(path){this.path=path;}}
class TFile{constructor(path,parent){this.path=path;this.parent=parent;this.extension='md';}}
class Emitter{
 constructor(){this.refs=new Set();}
 on(event,callback){const ref={event,callback};this.refs.add(ref);return ref;}
 offref(ref){this.refs.delete(ref);}
 emit(event,...args){for(const ref of [...this.refs])if(ref.event===event)ref.callback(...args);}
}
function styles(){
 const map=new Map();return {getPropertyValue:key=>map.get(key)?.value||'',getPropertyPriority:key=>map.get(key)?.priority||'',
  setProperty:(key,value,priority='')=>map.set(key,{value:String(value),priority}),removeProperty:key=>map.delete(key)};
}
class Element{
 constructor(cls='',text=''){this.classes=new Set(cls.split(' ').filter(Boolean));this.children=[];this.dataset={};this.attrs={};this.style=styles();this.textContent=text;this.events={};}
 appendChild(el){el.remove();this.children.push(el);el.parentElement=this;return el;}
 insertBefore(el,before){el.remove();const index=this.children.indexOf(before);this.children.splice(index<0?this.children.length:index,0,el);el.parentElement=this;return el;}
 createEl(tag,options={}){const el=new Element(options.cls||'',options.text||'');el.tag=tag;for(const [name,value] of Object.entries(options.attr||{}))el.setAttribute(name,value);return this.appendChild(el);}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 setAttribute(name,value){this.attrs[name]=String(value);}
 getAttribute(name){return this.attrs[name]??null;}
 setText(value){this.textContent=String(value);}
 remove(){if(this.parentElement){const items=this.parentElement.children;items.splice(items.indexOf(this),1);this.parentElement=null;}}
 addEventListener(event,callback){this.events[event]=callback;}
 closest(selector){for(let el=this;el;el=el.parentElement)if(el.classes.has(selector.slice(1)))return el;return null;}
 querySelectorAll(selector){
  const classes=selector.split(',').map(part=>part.trim().replace(/^:scope > /,'').slice(1));
  const items=[];for(const child of this.children){if(classes.some(cls=>child.classes.has(cls)))items.push(child);items.push(...child.querySelectorAll(selector));}return items;
 }
 querySelector(selector){
  if(selector.startsWith(':scope > ')){const classes=selector.split(',').map(part=>part.trim().replace(/^:scope > /,'').slice(1));return this.children.find(child=>classes.some(cls=>child.classes.has(cls)))||null;}
  return this.querySelectorAll(selector)[0]||null;
 }
}
function harness(language='en'){
 const observers=[],cleanups=[],registered=[],notices=[],ready=[],workspace=new Emitter(),vault=new Emitter(),folders=new Map();
 class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(root,options){this.root=root;this.options=options;this.active=true;}disconnect(){this.active=false;}}
 const api=vm.runInNewContext(fs.readFileSync('src/v12/unified-toolkit.js','utf8')+'\n({writerV12RegisterFocus,writerV12FocusRefresh,writerV12FolderFocus})',{
  TFolder,TFile,Set,Map,console,MutationObserver:Observer,writerUi:(pt,en)=>language==='pt'?pt:en,
  Notice:class{constructor(text){notices.push(text);}}
 });
 const addFolder=path=>{const folder=new TFolder(path);folders.set(path,folder);return folder;};
 const books=addFolder('Books'),drafts=addFolder('Books/Drafts'),other=addFolder('Books2'),reference=addFolder('Reference');
 const file=new TFile('Books/Drafts/Chapter.md',drafts);
 vault.getAbstractFileByPath=path=>folders.get(path)||null;
 const explorers=[];
 const explorer=()=>{
  const root=new Element('workspace-leaf-content');root.ownerDocument={defaultView:{MutationObserver:Observer}};
  const header=root.createDiv({cls:'nav-header'}),files=root.createDiv({cls:'nav-files-container'}),rows=new Map();
  for(const path of ['/','Books','Books/Drafts','Books/Drafts/Chapter.md','Books/Archive.md','Books2','Reference','']){
   const row=files.createDiv({cls:path.endsWith('.md')?'nav-file':'nav-folder'});row.setAttribute('data-path',path);
   const title=row.createDiv({cls:path.endsWith('.md')?'nav-file-title':'nav-folder-title'});title.setAttribute('data-path',path);
   title.createSpan({cls:'ft-icon'});title.createSpan({cls:'writer-v9-explorer-icon'});rows.set(path,row);
  }
  const leaf={view:{containerEl:root}};explorers.push(leaf);return {leaf,root,header,files,rows};
 };
 workspace.getLeavesOfType=type=>type==='file-explorer'?explorers:[];workspace.getActiveFile=()=>file;workspace.onLayoutReady=callback=>ready.push(callback);
 const plugin={settings:{v12Toolkit:{enabled:true,folderFocus:true}},app:{workspace,vault},register:fn=>cleanups.push(fn),registerEvent:ref=>registered.push(ref)};
 api.writerV12RegisterFocus(plugin);ready.forEach(callback=>callback());
 const menu=()=>{const actions=[];return {actions,addItem(callback){const item={setTitle(value){this.title=value;return this;},setIcon(value){this.icon=value;return this;},onClick(fn){this.click=fn;return this;}};callback(item);actions.push(item);}};};
 return {api,plugin,workspace,vault,folders,books,drafts,other,reference,file,explorers,explorer,observers,cleanups,registered,notices,ready,menu};
}

test('native folder context menu accepts only live vault folders and follows the module switch',()=>{
 const h=harness('pt'),menu=h.menu();h.workspace.emit('file-menu',menu,h.drafts);
 assert.equal(menu.actions.length,1);assert.equal(menu.actions[0].title,'Focar nesta pasta');menu.actions[0].click();
 assert.equal(h.plugin._writerV12FolderFocus,'Books/Drafts');
 for(const candidate of [h.file,new TFolder('Books/Drafts'),new TFolder('/'),null]){const invalid=h.menu();h.workspace.emit('file-menu',invalid,candidate);assert.equal(invalid.actions.length,0);}
 h.plugin.settings.v12Toolkit.folderFocus=false;const disabled=h.menu();h.workspace.emit('file-menu',disabled,h.books);assert.equal(disabled.actions.length,0);
 assert.equal(h.api.writerV12FolderFocus(h.plugin,false,h.books),false);
});

test('focusing an arbitrary folder filters every explorer by path boundary without editing files or icons',()=>{
 const h=harness(),a=h.explorer(),b=h.explorer();h.workspace.emit('layout-change');
 const originalIcons=a.rows.get('Books/Drafts/Chapter.md').querySelectorAll('.ft-icon, .writer-v9-explorer-icon');
 assert.equal(h.api.writerV12FolderFocus(h.plugin,false,h.drafts),true);
 for(const x of [a,b]){
  for(const path of ['/','Books','Books/Drafts','Books/Drafts/Chapter.md',''])assert.equal(x.rows.get(path).style.getPropertyValue('display'),'');
  for(const path of ['Books/Archive.md','Books2','Reference'])assert.equal(x.rows.get(path).style.getPropertyValue('display'),'none');
  const bar=x.root.querySelector('.writer-folder-focus-bar');assert.ok(bar);assert.equal(bar.querySelector('.writer-folder-focus-path').textContent,'Books/Drafts');
  assert.ok(x.root.children.indexOf(bar)<x.root.children.indexOf(x.files));
 }
 assert.deepEqual(a.rows.get('Books/Drafts/Chapter.md').querySelectorAll('.ft-icon, .writer-v9-explorer-icon'),originalIcons);
 assert.equal(h.file.path,'Books/Drafts/Chapter.md');assert.equal(h.plugin.settings.v12Toolkit.folderFocus,true);
});

test('the inline show-all action restores original display priorities and removes only its own breadcrumb',()=>{
 const h=harness(),x=h.explorer(),row=x.rows.get('Reference');row.style.setProperty('display','grid','important');
 h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 assert.equal(row.style.getPropertyValue('display'),'none');assert.equal(row.style.getPropertyPriority('display'),'important');
 const bar=x.root.querySelector('.writer-folder-focus-bar'),button=bar.querySelector('.writer-folder-focus-reset');assert.equal(button.textContent,'Show all');
 button.events.click();
 assert.equal(h.plugin._writerV12FolderFocus,'');assert.equal(x.root.querySelector('.writer-folder-focus-bar'),null);
 assert.equal(row.style.getPropertyValue('display'),'grid');assert.equal(row.style.getPropertyPriority('display'),'important');assert.equal(row.dataset.writerV12Hidden,undefined);
 assert.ok(x.root.children.includes(x.header));assert.ok(x.root.children.includes(x.files));
});

test('renaming a focused folder or its parent follows identity, and deleting its ancestor restores the explorer',()=>{
 const h=harness(),x=h.explorer();h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 h.folders.delete('Books');h.folders.delete('Books/Drafts');h.books.path='Novels';h.drafts.path='Novels/Drafts';h.folders.set(h.books.path,h.books);h.folders.set(h.drafts.path,h.drafts);
 h.vault.emit('rename',h.books,'Books');
 assert.equal(h.plugin._writerV12FolderFocus,'Novels/Drafts');assert.equal(x.root.querySelector('.writer-folder-focus-path').textContent,'Novels/Drafts');
 h.folders.delete('Novels');h.folders.delete('Novels/Drafts');h.vault.emit('delete',h.books);
 assert.equal(h.plugin._writerV12FolderFocus,'');assert.equal(x.root.querySelector('.writer-folder-focus-bar'),null);
 assert.equal(x.rows.get('Reference').style.getPropertyValue('display'),'');
});

test('removed or replaced folders cannot leave stale focus or target another vault object',()=>{
 const h=harness(),x=h.explorer();h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 h.folders.set('Books/Drafts',new TFolder('Books/Drafts'));h.api.writerV12FocusRefresh(h.plugin);
 assert.equal(h.plugin._writerV12FolderFocus,'');assert.equal(x.rows.get('Reference').style.getPropertyValue('display'),'');
 assert.equal(h.api.writerV12FolderFocus(h.plugin,false,h.drafts),false);assert.ok(h.notices.some(text=>text.includes('existing explorer folder')));
});

test('switching folder focus off restores rows and does not resurrect a temporary session when enabled again',()=>{
 const h=harness(),x=h.explorer();h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 h.plugin.settings.v12Toolkit.folderFocus=false;h.api.writerV12FocusRefresh(h.plugin);
 assert.equal(h.plugin._writerV12FolderFocus,'');assert.equal(x.root.querySelector('.writer-folder-focus-bar'),null);assert.equal(x.rows.get('Reference').style.getPropertyValue('display'),'');
 h.plugin.settings.v12Toolkit.folderFocus=true;h.api.writerV12FocusRefresh(h.plugin);assert.equal(x.root.querySelector('.writer-folder-focus-bar'),null);
});

test('clearing focus preserves a later display change made by a native owner',()=>{
 const h=harness(),x=h.explorer(),row=x.rows.get('Reference');h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 row.style.setProperty('display','flex','important');h.api.writerV12FolderFocus(h.plugin,true);
 assert.equal(row.style.getPropertyValue('display'),'flex');assert.equal(row.style.getPropertyPriority('display'),'important');assert.equal(row.dataset.writerV12Hidden,undefined);
});

test('file-list observers handle multiple explorers, row recycling and late layout without observing the editor',async()=>{
 const h=harness(),a=h.explorer();h.workspace.emit('layout-change');h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 const observer=h.observers.find(item=>item.root===a.files);assert.ok(observer);assert.deepEqual(Array.from(observer.options.attributeFilter),['data-path']);
 const recycled=a.rows.get('Reference');recycled.setAttribute('data-path','Books/Drafts/New.md');observer.callback([{type:'attributes',target:recycled}]);await Promise.resolve();
 assert.equal(recycled.style.getPropertyValue('display'),'');
 const b=h.explorer();h.workspace.emit('layout-change');assert.ok(b.root.querySelector('.writer-folder-focus-bar'));
 h.explorers.splice(h.explorers.indexOf(a.leaf),1);h.workspace.emit('layout-change');assert.equal(observer.active,false);assert.equal(a.root.querySelector('.writer-folder-focus-bar'),null);assert.equal(a.rows.get('Books2').style.getPropertyValue('display'),'');
});

test('unload disconnects observers/events, clears inline focus and ignores pending callbacks',async()=>{
 const h=harness(),x=h.explorer();h.workspace.emit('layout-change');h.api.writerV12FolderFocus(h.plugin,false,h.drafts);
 const observer=h.observers[0];observer.callback([{type:'childList',target:x.files}]);
 h.cleanups.forEach(fn=>fn());h.cleanups.forEach(fn=>fn());await Promise.resolve();h.ready.forEach(fn=>fn());
 assert.equal(observer.active,false);assert.equal(h.workspace.refs.size,0);assert.equal(h.vault.refs.size,0);
 assert.equal(x.root.querySelector('.writer-folder-focus-bar'),null);assert.equal(x.rows.get('Reference').style.getPropertyValue('display'),'');assert.equal(h.plugin._writerV12FolderFocus,'');
});
