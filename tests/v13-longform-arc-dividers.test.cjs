'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const projectsSource=fs.readFileSync('projects.js','utf8');
const dividersSource=fs.readFileSync('src/v13/longform-dividers.js','utf8');
const json=value=>JSON.parse(JSON.stringify(value));
let lastPrompt=null;
const context=vm.createContext({module:{exports:{}},require:()=>({
 ItemView:class{},Modal:class{open(){lastPrompt=this;}},Notice:class{},Menu:class{},getLanguage:()=>'en'
})});
vm.runInContext(projectsSource,context);
const api=vm.runInContext(dividersSource+
 '\n({writerV13ArcStore,writerV13ArcLayout,writerV13ArcMove,writerV13ArcShift,writerV13ArcPrompt})',context);
const {ProjectsView,lfFlattenScenes}=context.module.exports;
class TestProjectsView extends ProjectsView{
 constructor(){
  super({}, {settings:{},saveSettings:async()=>{this.saved++;}});
  this.frontmatter={longform:{scenes:['Chapter 1',['Scene 1'],'Chapter 2','Chapter 3']}};
  this.projectData={drafts:{}};
  this.saved=0;
  this.rendered=0;
  this.render=async()=>{this.rendered++;};
  this.app={
   vault:{create(){throw Error('Visual divider must not create a note');}},
   fileManager:{processFrontMatter:async(_file,mutate)=>{
    const next=json(this.frontmatter);
    mutate(next);
    this.frontmatter=next;
   }}
  };
 }
 prefs(){return this.projectData;}
 get scenes(){return lfFlattenScenes(this.frontmatter.longform.scenes);}
 sceneList(){return this.scenes;}
 async backupIndex(){}
}
const project={file:{path:'Bonfire/Index.md'},format:'scenes'};
test('Longform dividers remain only in Basic preferences, not scene notes or YAML',async()=>{
 const view=new TestProjectsView();
 const original=json(view.scenes);
 api.writerV13ArcPrompt(view,project);
 assert.match(lastPrompt.titleText,/optional text/);
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
 const view=new TestProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Part I',before:'Chapter 2'});
 dividers.push({id:'b',label:'',before:null});
 const layout=json(api.writerV13ArcLayout(['Chapter 1','Chapter 2','Chapter 3'],dividers));
 assert.deepEqual(layout.map(item=>item.type==='divider'?item.label||'UNTITLED':item.title),
  ['Chapter 1','Part I','Chapter 2','Chapter 3','UNTITLED']);
});
test('Moving an arc divider preserves chapter order, no file operations',async()=>{
 const view=new TestProjectsView();
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
 const view=new TestProjectsView();
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
 const view=new TestProjectsView();
 api.writerV13ArcStore(view,project).push({id:'first',label:'Original',before:'Chapter 2'});
 view.draft='Alternative';
 const variant=api.writerV13ArcStore(view,project);
 assert.deepEqual(json(variant),[{id:'first',label:'Original',before:'Chapter 2'}]);
 variant[0].label='Variant only';
 view.draft='Principal';
 assert.equal(api.writerV13ArcStore(view,project)[0].label,'Original');
});
test('Renaming an anchor chapter renders once after the index and divider are saved',async()=>{
 const view=new TestProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Beginning',before:'Chapter 2'});
 const calls=[];
 view.plugin.saveSettings=async()=>{
  assert.equal(view.scenes[2].title,'Renamed chapter');
  assert.equal(dividers[0].before,'Renamed chapter');
  calls.push('save');
 };
 view.render=async()=>calls.push('render');
 await view.changeScenes(project,scenes=>{scenes[2].title='Renamed chapter';});
 assert.deepEqual(calls,['save','render']);
});
test('Removing several chapters anchors at the next surviving chapter in original order',async()=>{
 const view=new TestProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:'Chapter 2'});
 await view.changeScenes(project,scenes=>{
  scenes.splice(0,3); // Chapter 1 and Chapter 2 disappear together.
 });
 assert.equal(dividers[0].before,'Chapter 3');
});
test('Failed index changes do not mutate saved divider anchors',async()=>{
 const view=new TestProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:'Chapter 2'});
 // A native frontmatter write can reject after invoking its callback.
 view.app.fileManager.processFrontMatter=async(_file,mutate)=>{
  mutate(json(view.frontmatter));
  throw Error('disk full');
 };
 await assert.rejects(view.changeScenes(project,scenes=>{
  scenes[2].title='Not committed';
 }),/disk full/);
 assert.equal(dividers[0].before,'Chapter 2');
 assert.equal(view.saved,0);
 assert.equal(view.rendered,0);
});
test('Local draft edits save scene and divider changes together before one render',async()=>{
 const view=new TestProjectsView();
 view.draft='Alternative';
 view.projectData.drafts.Alternative=json(view.scenes);
 const dividers=api.writerV13ArcStore(view,project);
 dividers.push({id:'a',label:'Act II',before:'Chapter 2'});
 const calls=[];
 view.app.fileManager.processFrontMatter=async()=>{throw Error('Local drafts do not modify the index');};
 view.plugin.saveSettings=async()=>{
  assert.equal(view.projectData.drafts.Alternative[2].title,'Local name');
  assert.equal(dividers[0].before,'Local name');
  assert.equal(view.scenes[2].title,'Chapter 2');
  calls.push('save');
 };
 view.render=async()=>calls.push('render');
 await view.changeScenes(project,scenes=>{scenes[2].title='Local name';});
 assert.deepEqual(calls,['save','render']);
});
test('An index write cannot replace a newer divider placement',async()=>{
 const view=new TestProjectsView();
 const dividers=api.writerV13ArcStore(view,project);
 const divider={id:'a',label:'Act II',before:'Chapter 2'};
 dividers.push(divider);
 view.app.fileManager.processFrontMatter=async(_file,mutate)=>{
  const next=json(view.frontmatter);
  mutate(next);
  divider.before='Chapter 1';
  view.frontmatter=next;
 };
 await view.changeScenes(project,scenes=>{scenes[2].title='Renamed chapter';});
 assert.equal(divider.before,'Chapter 1');
 assert.equal(view.saved,0);
 assert.equal(view.rendered,1);
});
test('Open divider prompts retain their original draft after the view switches drafts',async()=>{
 const view=new TestProjectsView();
 view.projectData.drafts={Alternative:json(view.scenes)};
 api.writerV13ArcPrompt(view,project);
 const originalPrompt=lastPrompt;
 view.draft='Alternative';
 await originalPrompt.done('Main only');
 assert.equal(view.projectData.arcDividers.Principal[0].label,'Main only');
 assert.equal(Object.prototype.hasOwnProperty.call(view.projectData.arcDividers,'Alternative'),false);
});
test('Divider prompts cannot recreate a deleted local draft',async()=>{
 const view=new TestProjectsView();view.draft='Alternative';
 view.projectData.drafts={Alternative:json(view.scenes)};
 api.writerV13ArcPrompt(view,project);
 delete view.projectData.drafts.Alternative;
 await lastPrompt.done('Deleted draft');
 assert.equal(view.projectData.arcDividers,undefined);
 assert.equal(view.saved,0);
});
test('A local draft name is stored as data without changing the prototype',()=>{
 const view=new TestProjectsView();view.draft='__proto__';view.projectData.arcDividers={};
 const items=api.writerV13ArcStore(view,project);
 items.push({id:'safe',label:'Safe',before:null});
 assert.equal(Object.prototype.hasOwnProperty.call(view.projectData.arcDividers,'__proto__'),true);
 assert.equal(view.projectData.arcDividers.__proto__[0].id,'safe');
 assert.equal(Object.getPrototypeOf(view.projectData.arcDividers),Object.prototype);
});
