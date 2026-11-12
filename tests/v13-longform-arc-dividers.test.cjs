'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/longform-dividers.js','utf8');
const json=value=>JSON.parse(JSON.stringify(value));
let lastPrompt=null;
class ProjectsView{
 constructor(){
  this.draft='Principal';
  this.scenes=[{title:'Chapter 1',indent:0},{title:'Scene 1',indent:1},
   {title:'Chapter 2',indent:0},{title:'Chapter 3',indent:0}];
  this.projectData={};
  this.saved=0;this.rendered=0;
  this.plugin={settings:{},saveSettings:async()=>{this.saved++;}};
  this.render=async()=>{this.rendered++;};
  this.app={vault:{create(){throw Error('Visual divider must not create a note');}}};
 }
 prefs(){return this.projectData;}
 activeScenes(){return this.scenes;}
 async changeScenes(_project,change){change(this.scenes);}
 drawScenes(){}
}
class TextPrompt{
 constructor(_app,title,done,initial){this.title=title;this.done=done;this.initial=initial;}
 open(){lastPrompt=this;}
}
const api=vm.runInNewContext(source+
 '\n({writerV13ArcStore,writerV13ArcLayout,writerV13ArcReanchor,writerV13ArcMove,writerV13ArcShift,writerV13ArcPrompt})',
 {ProjectsView,TextPrompt,lfMsg:(pt,en)=>en,console,Date,Math,
  Notice:class{},Menu:class{}});
const project={file:{path:'Bonfire/Index.md'},format:'scenes'};
test('Longform dividers remain only in Basic preferences, not scene notes or YAML',async()=>{
 const view=new ProjectsView();
 const original=json(view.scenes);
 api.writerV13ArcPrompt(view,project);
 assert.match(lastPrompt.title,/optional text/);
 await lastPrompt.done('');
 assert.equal(view.saved,1);
 const items=api.writerV13ArcStore(view,project);
 assert.equal(items.length,1);
 assert.equal(items[0].label,'');
 assert.equal(items[0].before,null);
 assert.deepEqual(json(view.scenes),original);
 assert.equal(view.rendered,1);
});
test('Optional captions appear before the selected chapter, even with subchapters',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Part I',before:'Chapter 2'});
 dividers.push({id:'b',label:'',before:null});
 const layout=json(api.writerV13ArcLayout(['Chapter 1','Chapter 2','Chapter 3'],dividers));
 assert.deepEqual(layout.map(item=>item.type==='divider'?item.label||'UNTITLED':item.title),
  ['Chapter 1','Part I','Chapter 2','Chapter 3','UNTITLED']);
});
test('Moving an arc divider preserves chapter order, no file operations',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:null});
 const before=json(view.scenes);
 await api.writerV13ArcMove(view,project,'a','Chapter 2');
 assert.equal(dividers[0].before,'Chapter 2');
 await api.writerV13ArcShift(view,project,'a',1);
 assert.equal(dividers[0].before,'Chapter 3');
 assert.deepEqual(json(view.scenes),before);
 assert.equal(view.saved,2);
});
test('Two separators in a row keep their relative order and support retitling',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Arc I',before:'Chapter 2'},{id:'b',label:'Arc II',before:'Chapter 2'});
 await api.writerV13ArcMove(view,project,'b','a',false);
 assert.deepEqual(json(dividers.map(item=>item.id)),['b','a']);
 assert.equal(dividers[0].before,'Chapter 2');
 api.writerV13ArcPrompt(view,project,dividers[0]);
 await lastPrompt.done('  New act title  ');
 assert.equal(dividers[0].label,'New act title');
});
test('Local draft variants inherit independent copies of arc markers',()=>{
 const view=new ProjectsView();
 api.writerV13ArcStore(view,project).push({id:'first',label:'Original',before:'Chapter 2'});
 view.draft='Alternative';
 const variant=api.writerV13ArcStore(view,project);
 assert.deepEqual(json(variant),[{id:'first',label:'Original',before:'Chapter 2'}]);
 variant[0].label='Variant only';
 view.draft='Principal';
 assert.equal(api.writerV13ArcStore(view,project)[0].label,'Original');
});
test('Renaming an anchor chapter updates the divider reference',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Beginning',before:'Chapter 2'});
 await view.changeScenes(project,scenes=>{scenes[2].title='Renamed chapter';});
 assert.equal(dividers[0].before,'Renamed chapter');
 assert.equal(view.saved,1);
});
test('Removing several chapters anchors at the next surviving chapter in original order',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:'Chapter 2'});
 await view.changeScenes(project,scenes=>{
  scenes.splice(0,3); // Chapter 1 and Chapter 2 disappear together.
 });
 assert.equal(dividers[0].before,'Chapter 3');
});
test('Failed index changes do not mutate saved divider anchors',async()=>{
 const view=new ProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:'Chapter 2'});
 // A native frontmatter write can reject after invoking its callback.
 class FailingView{async changeScenes(_project,change){change(view.scenes);throw Error('disk full');}drawScenes(){}}
 // Install independently so the production wrapper captures a rejecting native method.
 vm.runInNewContext(source,{ProjectsView:FailingView,TextPrompt,lfMsg:(_pt,en)=>en,Notice:class{},Menu:class{}});
 await assert.rejects(FailingView.prototype.changeScenes.call(view,project,scenes=>{
  scenes[2].title='Not committed';
 }),/disk full/);
 assert.equal(dividers[0].before,'Chapter 2');
 assert.equal(view.saved,0);
});
test('Open divider prompts retain their original draft after the view switches drafts',async()=>{
 const view=new ProjectsView();
 view.projectData.drafts={Alternative:json(view.scenes)};
 api.writerV13ArcPrompt(view,project);
 const originalPrompt=lastPrompt;
 view.draft='Alternative';
 await originalPrompt.done('Main only');
 assert.equal(view.projectData.arcDividers.Principal[0].label,'Main only');
 assert.equal(Object.prototype.hasOwnProperty.call(view.projectData.arcDividers,'Alternative'),false);
});
test('Divider prompts cannot recreate a deleted local draft',async()=>{
 const view=new ProjectsView();view.draft='Alternative';
 view.projectData.drafts={Alternative:json(view.scenes)};
 api.writerV13ArcPrompt(view,project);
 delete view.projectData.drafts.Alternative;
 await lastPrompt.done('Deleted draft');
 assert.equal(view.projectData.arcDividers,undefined);
 assert.equal(view.saved,0);
});
test('A local draft name is stored as data without changing the prototype',()=>{
 const view=new ProjectsView();view.draft='__proto__';view.projectData.arcDividers={};
 const items=api.writerV13ArcStore(view,project);
 items.push({id:'safe',label:'Safe',before:null});
 assert.equal(Object.prototype.hasOwnProperty.call(view.projectData.arcDividers,'__proto__'),true);
 assert.equal(view.projectData.arcDividers.__proto__[0].id,'safe');
 assert.equal(Object.getPrototypeOf(view.projectData.arcDividers),Object.prototype);
});
