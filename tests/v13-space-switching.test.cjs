'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v9/smart-spaces.js','utf8');
class Element{
 constructor(tag='div',options={}){
  this.tag=tag;this.children=[];this.events={};this.text=options.text||'';
  this.cls=options.cls||'';this.attributes=options.attr||{};this.value='';
  this.style={setProperty(){}};
 }
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 addEventListener(type,handler){this.events[type]=handler;}
 empty(){this.children=[];}
 addClass(name){this.cls+=' '+name;}
 setText(text){this.text=String(text);}
 find(predicate){if(predicate(this))return this;for(const child of this.children){const result=child.find(predicate);if(result)return result;}}
 all(predicate){return [...(predicate(this)?[this]:[]),...this.children.flatMap(child=>child.all(predicate))];}
}
const notices=[];
const api=vm.runInNewContext(source+'\n({writerV9215SelectSpace,writerV10SpaceRestoreLayout,writerV10SpaceSaveLayout,WriterV9SpacesSideView,writerV9RegisterSpaces})',{
 console:{warn(){}},writerUi:(_pt,en)=>en,ItemView:class{constructor(leaf){this.contentEl=leaf.contentEl;}},
 Notice:class{constructor(text){notices.push(text);}},require:()=>({setIcon(){}}),
 writerModuleOn:()=>true
});
function gate(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const clone=value=>JSON.parse(JSON.stringify(value));
function setup(){
 let layout={name:'Origin current layout'};
 const actions=[],refreshes=[];
 const spaces=[
  {id:'origin',name:'Origin',folder:'Origin',layoutSnapshot:{name:'Origin saved layout'}},
  {id:'a',name:'Writing',folder:'Writing',layoutSnapshot:{name:'A saved layout'}},
  {id:'b',name:'Research',folder:'Research',layoutSnapshot:{name:'B saved layout'}}
 ].map(space=>({...space,mode:'filter',view:'list',sort:'name',hiddenPaths:[],pinnedPaths:[]}));
 const files=['Writing/One.md','Research/Two.md','Other/Three.md'].map(path=>({path,basename:path.split('/').pop(),stat:{mtime:1}}));
 const plugin={settings:{v9Spaces:{enabled:true,sidebar:true,activeId:'origin',spaces,autoSaveLayouts:true,restoreLayoutsOnSwitch:true}},
  app:{workspace:{getLayout:()=>clone(layout),changeLayout:async next=>{
   actions.push('restore '+next.name);layout=clone(next);
  },getLeavesOfType:()=>[]},vault:{getMarkdownFiles:()=>files},metadataCache:{getFileCache:()=>({})}},
  saveSettings:async()=>{actions.push('save '+plugin.settings.v9Spaces.activeId);},
  writerV91FlexRefresh:()=>refreshes.push(plugin.settings.v9Spaces.activeId)
 };
 return {plugin,spaces,actions,refreshes,get layout(){return layout;}};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}

test('rapid Space selection serializes persistence and layout restoration in request order',async()=>{
 const state=setup(),firstSave=gate();let saves=0;
 state.plugin.saveSettings=async()=>{
  state.actions.push('save '+state.plugin.settings.v9Spaces.activeId);
  if(++saves===1)await firstSave.promise;
 };
 const a=api.writerV9215SelectSpace(state.plugin,'a');
 const b=api.writerV9215SelectSpace(state.plugin,'b');
 await flush();
 assert.equal(state.plugin.settings.v9Spaces.activeId,'a');
 assert.deepEqual(state.actions,['save a']);
 firstSave.resolve();await Promise.all([a,b]);
 assert.deepEqual(state.actions,['save a','restore A saved layout','save b','restore B saved layout']);
 assert.equal(state.plugin.settings.v9Spaces.activeId,'b');
 assert.equal(state.layout.name,'B saved layout');
 assert.equal(state.spaces[0].layoutSnapshot.name,'Origin current layout');
 assert.equal(state.spaces[1].layoutSnapshot.name,'A saved layout','Auto-save observes the restored source Space, not the prior layout');
 assert.equal(state.plugin._writerV133SpaceSwitch,null);
});
test('a later selection waits for an in-flight layout restore before saving the source Space',async()=>{
 const state=setup(),started=gate(),release=gate();
 const restore=state.plugin.app.workspace.changeLayout;
 state.plugin.app.workspace.changeLayout=async layout=>{
  if(layout.name==='A saved layout'){started.resolve();await release.promise;}
  await restore(layout);
 };
 const a=api.writerV9215SelectSpace(state.plugin,'a');await started.promise;
 const b=api.writerV9215SelectSpace(state.plugin,'b');
 await flush();assert.deepEqual(state.actions,['save a']);
 release.resolve();await Promise.all([a,b]);
 assert.equal(state.layout.name,'B saved layout');
 assert.equal(state.spaces[1].layoutSnapshot.name,'A saved layout');
});
test('failed persistence restores the prior selection and does not block a queued switch',async()=>{
 const state=setup(),release=gate();let saves=0;
 state.plugin.saveSettings=async()=>{if(++saves===1)await release.promise;};
 const a=api.writerV9215SelectSpace(state.plugin,'a');
 const rejected=assert.rejects(a,/disk unavailable/);
 const b=api.writerV9215SelectSpace(state.plugin,'b');
 release.reject(Error('disk unavailable'));await rejected;await b;
 assert.equal(state.plugin.settings.v9Spaces.activeId,'b');
 assert.equal(state.layout.name,'B saved layout');
 assert.deepEqual(state.actions,['restore B saved layout']);
 assert.equal(state.spaces[1].layoutSnapshot.name,'A saved layout');
 assert.ok(state.refreshes.includes('origin'),'Views return to the prior selection after failure');
});
test('repeated queued selections avoid duplicate restores and Entire vault remains the final scope',async()=>{
 const state=setup();
 await Promise.all([
  api.writerV9215SelectSpace(state.plugin,'a'),
  api.writerV9215SelectSpace(state.plugin,'a'),
  api.writerV9215SelectSpace(state.plugin,'')
 ]);
 assert.deepEqual(state.actions,['save a','restore A saved layout','save ']);
 assert.equal(state.plugin.settings.v9Spaces.activeId,'');
 assert.equal(state.layout.name,'A saved layout','Entire vault does not implicitly load a saved Space layout');
});
test('disabling Spaces during persistence cancels the obsolete restore and queued scope changes',async()=>{
 const state=setup(),release=gate();state.plugin.saveSettings=()=>release.promise;
 const a=api.writerV9215SelectSpace(state.plugin,'a');
 const b=api.writerV9215SelectSpace(state.plugin,'b');
 state.plugin.settings.v9Spaces.enabled=false;state.plugin.settings.v9Spaces.activeId='';
 release.resolve();await Promise.all([a,b]);
 assert.equal(state.plugin.settings.v9Spaces.activeId,'');
 assert.equal(state.layout.name,'Origin current layout');
 assert.deepEqual(state.actions,[]);
});
test('a failed restore preserves the destination snapshot during the next automatic save',async()=>{
 const state=setup(),restore=state.plugin.app.workspace.changeLayout;
 state.plugin.app.workspace.changeLayout=async layout=>{
  if(layout.name==='A saved layout')throw Error('View unavailable');
  await restore(layout);
 };
 await Promise.all([
  api.writerV9215SelectSpace(state.plugin,'a'),api.writerV9215SelectSpace(state.plugin,'b')
 ]);
 assert.equal(state.plugin.settings.v9Spaces.activeId,'b');
 assert.equal(state.layout.name,'B saved layout');
 assert.equal(state.spaces[1].layoutSnapshot.name,'A saved layout','The source layout is never captured as the failed destination');
 assert.equal(state.plugin._writerV133FailedSpaceLayout,'a');
 state.plugin.app.workspace.changeLayout=restore;
 await api.writerV9215SelectSpace(state.plugin,'a');
 assert.equal(state.plugin._writerV133FailedSpaceLayout,null);
 assert.equal(state.layout.name,'A saved layout');
});
test('an explicit manual layout save can replace a guarded destination snapshot',async()=>{
 const state=setup();state.plugin.app.workspace.changeLayout=async()=>{throw Error('View unavailable');};
 await api.writerV9215SelectSpace(state.plugin,'a');
 assert.equal(state.plugin._writerV133FailedSpaceLayout,'a');
 assert.equal(api.writerV10SpaceSaveLayout(state.plugin,state.spaces[1]),true);
 assert.equal(state.spaces[1].layoutSnapshot.name,'Origin current layout');
 assert.equal(state.plugin._writerV133FailedSpaceLayout,null);
});
function sidebar(state){
 const root=new Element(),view=new api.WriterV9SpacesSideView({contentEl:root},state.plugin);
 state.plugin.app.workspace.getLeavesOfType=type=>type==='writer-smart-spaces'?[{view}]:[];
 state.plugin.writerV9SpacesRefresh=()=>view.render();
 return {root,view};
}
const tabs=root=>root.all(element=>element.tag==='button'&&element.cls.includes('writer-v9-space-side-tab'));
test('the Spaces sidebar reflects Entire vault and lists unfiltered notes instead of a stale Space',async()=>{
 const state=setup();state.plugin.settings.v9Spaces.activeId='';
 const {root,view}=sidebar(state);view.currentId='a';view.render();
 assert.equal(view.currentId,'');
 assert.equal(tabs(root)[0].attributes.title,'Entire vault');
 assert.equal(tabs(root)[0].attributes['aria-pressed'],'true');
 assert.equal(tabs(root).filter(element=>element.cls.includes('is-active')).length,1);
 assert.equal(root.all(element=>element.cls==='writer-v9-space-side-item').length,3);
 assert.equal(root.find(element=>element.tag==='input').attributes.placeholder,'Search the vault…');
 tabs(root).find(element=>element.attributes.title==='Writing').events.click();
 await state.plugin._writerV133SpaceSwitch;await flush();
 assert.equal(state.plugin.settings.v9Spaces.activeId,'a');
 assert.equal(root.all(element=>element.cls==='writer-v9-space-side-item').length,1);
 tabs(root)[0].events.click();await state.plugin._writerV133SpaceSwitch;await flush();
 assert.equal(state.plugin.settings.v9Spaces.activeId,'');
 assert.equal(tabs(root)[0].attributes['aria-pressed'],'true');
 assert.equal(root.all(element=>element.cls==='writer-v9-space-side-item').length,3);
});
test('opening a new Spaces sidebar never changes an Entire vault selection',async()=>{
 const state=setup();state.plugin.settings.v9Spaces.activeId='';
 const changes=[],leaf={setViewState:async value=>changes.push(value.type)};
 state.plugin.registerView=()=>{};state.plugin.addCommand=()=>{};state.plugin.registerEvent=()=>{};
 state.plugin.app.workspace.on=()=>({});
 state.plugin.app.workspace.getLeftLeaf=()=>leaf;
 state.plugin.app.workspace.revealLeaf=opened=>{assert.equal(opened,leaf);changes.push('reveal');};
 api.writerV9RegisterSpaces(state.plugin);
 await state.plugin.writerV9SpacesSidebarOpen();
 assert.equal(state.plugin.settings.v9Spaces.activeId,'');
 assert.deepEqual(state.actions,[]);
 assert.deepEqual(changes,['writer-smart-spaces','reveal']);
});
test('an empty Space list still offers the Entire vault view and an explicit create action',()=>{
 const state=setup();state.plugin.settings.v9Spaces.activeId='';state.plugin.settings.v9Spaces.spaces=[];
 const {root,view}=sidebar(state);view.render();
 assert.equal(tabs(root).length,1);
 assert.equal(tabs(root)[0].attributes['aria-pressed'],'true');
 assert.equal(root.all(element=>element.cls==='writer-v9-space-side-item').length,3);
 assert.ok(root.find(element=>element.tag==='button'&&element.attributes.title==='New Space'));
});
