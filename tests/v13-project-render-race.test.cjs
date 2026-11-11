'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('projects.js','utf8');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
class TFile{constructor(path){this.path=path;this.extension='md';this.parent={path:''};}}
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.cls=options.cls||'';this.attributes={...options.attr};this.children=[];this.events={};this.dataset={};this.style={};this.scrollTop=0;this.scrollLeft=0;this.classList={toggle:()=>{}};}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 querySelector(){return null;}
 querySelectorAll(){return [];}
 empty(){this.children=[];}
 addEventListener(name,callback){this.events[name]=callback;}
 setAttribute(name,value){this.attributes[name]=value;}
 setText(value){this.text=value;}
}
function harness(options={}){
 const timers=new Map(),warnings=[],reads=[],registered=[];let timer=0,saves=0;
 const first={file:new TFile('A.md'),format:'scenes',scenes:[],title:'Book A',meta:{}};
 const second={file:new TFile('B.md'),format:'scenes',scenes:['Chapter B'],title:'Book B',meta:{}};
 const hooks={};
 const app={workspace:{getActiveFile:()=>null},vault:{
  on:()=>({}),cachedRead:async file=>{reads.push(file.path);await hooks.beforeRead?.(file);return '---\nlongform: fallback\n---\n';}
 },metadataCache:{on:()=>({})}};
 const plugin={settings:{projectsData:{},lastLongformProject:first.file.path},saveSettings:async()=>{saves++;}};
 class ItemView{
  constructor(leaf){this.app=leaf.app;this.contentEl=new Element();}
  registerEvent(ref){registered.push(ref);}
 }
 const Empty=class{};
 const obsidian={TFile,TFolder:Empty,ItemView,Modal:Empty,Setting:Empty,Notice:Empty,
  getLanguage:()=> 'en',parseYaml:()=>({longform:{scenes:['Loaded chapter A']}}),stringifyYaml:()=>''};
 const context={module:{exports:{}},require:()=>obsidian,
  writerModuleOn:()=>options.showProjects===true,writerProjectRemember:(view,path)=>{view.selected=path;},
  writerV7SeriesForProject:()=>[],
  setTimeout:callback=>{const id=++timer;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id),
  console:{warn:(...args)=>warnings.push(args),error:(...args)=>warnings.push(args)}
 };
 vm.runInNewContext(source,context);
 const view=new context.module.exports.ProjectsView({app},plugin);
 view.root=new Element();view.indexes=()=>[first,second];
 view.prefs=project=>({book:project.title});
 const markers=()=>view.root.children.filter(node=>node.text==='Projects hidden. Enable in Settings → Modules.').length;
 return {view,first,second,hooks,reads,timers,warnings,registered,markers,get saves(){return saves;}};
}

test('a late project metadata read cannot replace the newer project preferences or append old content',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const pending=h.view.render();await started.promise;
 h.view.selected=h.second.file.path;await h.view.render();
 assert.equal(h.view.projectPrefs.book,'Book B');assert.equal(h.markers(),1);
 release.resolve();await pending;
 assert.equal(h.view.selected,h.second.file.path);assert.equal(h.view.currentProject,h.second);
 assert.equal(h.view.projectPrefs.book,'Book B');assert.equal(h.markers(),1);
 assert.deepEqual(h.first.scenes,[],'the stale fallback does not mutate its project metadata');
});

test('changing the selected project while loading invalidates that read before another render starts',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const pending=h.view.render();await started.promise;
 h.view.selected=h.second.file.path;release.resolve();await pending;
 assert.equal(h.view.projectPrefs,undefined);assert.equal(h.markers(),0);
 assert.deepEqual(h.first.scenes,[]);
 await h.view.render();assert.equal(h.view.projectPrefs.book,'Book B');assert.equal(h.markers(),1);
});

test('replacing the project root prevents pending work from writing into its replacement',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const original=h.view.root,pending=h.view.render();await started.promise;
 h.view.root=new Element();release.resolve();await pending;
 assert.notEqual(h.view.root,original);assert.equal(h.view.root.children.length,0);
 assert.equal(h.view.projectPrefs,undefined);assert.deepEqual(h.first.scenes,[]);
 h.hooks.beforeRead=null;await h.view.render();
 assert.equal(h.view.projectPrefs.book,'Book A');assert.equal(h.markers(),1);
 assert.deepEqual(Array.from(h.first.scenes),['Loaded chapter A']);
});

test('closing a project view invalidates pending reads and stops queued or direct refreshes',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const pending=h.view.render();await started.promise;h.view.queueRender();
 assert.equal(h.timers.size,1);await h.view.onClose();assert.equal(h.timers.size,0);
 const count=h.view.root.children.length;h.view.queueRender();await h.view.render();
 assert.equal(h.timers.size,0);release.resolve();await pending;
 assert.equal(h.view.projectPrefs,undefined);assert.equal(h.view.root.children.length,count);
 assert.equal(h.reads.length,1);assert.equal(h.saves,1);assert.deepEqual(h.first.scenes,[]);
});

test('opening the view again permits a legitimate render after pending work was cancelled',async()=>{
 const h=harness();await h.view.onClose();h.view.selected=h.second.file.path;
 await h.view.onOpen();
 assert.equal(h.view.writerProjectClosed,false);assert.equal(h.view.projectPrefs.book,'Book B');
 assert.equal(h.markers(),1);assert.ok(h.registered.length>0);
});

test('a note renamed during a metadata read cannot complete the old project generation',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const pending=h.view.render();await started.promise;
 h.first.file.path='Renamed.md';release.resolve();await pending;
 assert.equal(h.view.projectPrefs,undefined);assert.equal(h.markers(),0);assert.deepEqual(h.first.scenes,[]);
});

test('a rejected stale metadata read does not log or disturb the newer render',async()=>{
 const h=harness(),started=deferred(),release=deferred();
 h.hooks.beforeRead=async()=>{started.resolve();await release.promise;};
 const pending=h.view.render();await started.promise;
 h.view.selected=h.second.file.path;await h.view.render();release.reject(Error('Old read failed'));await pending;
 assert.equal(h.warnings.length,0);assert.equal(h.view.projectPrefs.book,'Book B');assert.equal(h.markers(),1);
});

test('a current metadata fallback still loads scenes, and a current failure retains its normal message',async()=>{
 const h=harness();await h.view.render();
 assert.deepEqual(Array.from(h.first.scenes),['Loaded chapter A']);assert.equal(h.view.projectPrefs.book,'Book A');
 assert.equal(h.markers(),1);assert.equal(h.reads.length,1);
 const failed=harness();failed.hooks.beforeRead=()=>{throw Error('Current read failed');};await failed.view.render();
 assert.equal(failed.warnings.length,1);assert.equal(failed.view.projectPrefs.book,'Book A');assert.equal(failed.markers(),1);
});

test('late panel completion cannot restore old scroll or consume pending focus on a newer project or root',async()=>{
 for(const change of ['selection','root']){
  const h=harness({showProjects:true}),started=deferred(),release=deferred();let held=false,focused=0;
  h.first.scenes=['Chapter A'];h.view.root.scrollTop=314;
  h.view.renderProjectPanel=async(panels,project,_token,id)=>{
   if(!held){held=true;started.resolve();await release.promise;}
   panels[id].createEl('p',{text:'Rendered '+project.title});
  };
  const previous=h.view.render();await started.promise;
  if(change==='selection')h.view.selected=h.second.file.path;
  else h.view.root=new Element();
  await h.view.render();
  const currentRoot=h.view.root,pendingFocus={path:h.first.file.path,title:'Requested chapter'};
  currentRoot.scrollTop=73;h.view.pendingSceneFocus=pendingFocus;
  currentRoot.querySelectorAll=selector=>selector==='.writer-project-scene[data-scene-title]'?
   [{dataset:{sceneTitle:pendingFocus.title},scrollIntoView(){focused++;}}]:[];
  release.resolve();await previous;
  assert.equal(h.view.root,currentRoot);assert.equal(currentRoot.scrollTop,73,change+' keeps the current scroll');
  assert.equal(h.view.pendingSceneFocus,pendingFocus,change+' keeps the newer focus request');
  assert.equal(focused,0);assert.equal(h.view.projectPrefs.book,change==='selection'?'Book B':'Book A');
 }
});
