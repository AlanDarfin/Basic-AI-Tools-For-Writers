'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/story-planning.js','utf8');
const json=x=>JSON.parse(JSON.stringify(x));
const workspace=()=>{
 const files=new Map(),writes=[],saves=[];
 const app={vault:{getAbstractFileByPath:path=>files.get(path)||null,create:async(path,content)=>{
  if(files.has(path))throw Error('Already exists');
  const file={path,content};files.set(path,file);writes.push(path);return file;
 }}};
 const plugin={app,settings:{},async saveSettings(){saves.push(json(this.settings));}};
 const file={path:'Bonfire/Index.md',basename:'Index',parent:{path:'Bonfire'}};
 files.set(file.path,file);
 const api=vm.runInNewContext(source+'\n({writerStorySetStage,writerStoryPlan,writerStoryFindIssues,writerStoryCleanThread,writerStoryWrite,writerStoryRebase,writerStoryExport,writerStoryPlanUI})',{
  writerUi:(_pt,en)=>en,clean:t=>t,writerV7RCSceneView:()=>[],require:()=>({setIcon(el,icon){el.icon=icon;}}),
  Notice:class{},writerProjectRenamedPath:(path,oldPath,newPath)=>path===oldPath?newPath:path.startsWith(oldPath+'/')?newPath+path.slice(oldPath.length):path
 });
 return {plugin,api,file,writes,saves,files,app};
};
test('editing an early stage flags later work without erasing it or making stages mandatory',()=>{
 const {api}=workspace();
 let plan={stages:{},threads:[]};
 plan=api.writerStorySetStage(plan,'treatment','End at dusk',true);
 plan=api.writerStorySetStage(plan,'premise','First premise',true);
 assert.equal(plan.stages.treatment.status,'review');
 assert.equal(plan.stages.treatment.text,'End at dusk');
 plan=api.writerStorySetStage(plan,'treatment','End at dusk',true);
 plan=api.writerStorySetStage(plan,'premise','First premise');
 assert.equal(plan.stages.treatment.status,'ready');
 assert.equal(plan.stages.premise.status,'ready');
 assert.throws(()=>api.writerStorySetStage(plan,'premise','a'.repeat(281)),/limit/);
 assert.equal(api.writerStorySetStage(plan,'premise','').stages.premise,undefined);
});
test('foreshadowing follows current scene order, reports missing files and leaves planned and abandoned threads alone',()=>{
 const {api}=workspace();
 const a={title:'A',position:1,path:'A.md'},b={title:'B',position:2,path:'B.md'},c={title:'C',position:3,path:'C.md'};
 const thread={id:'clue',title:'Key',status:'active',points:[{role:'plant',path:'B.md'},{role:'echo',path:'A.md'},{role:'payoff',path:'C.md'}]};
 const plan={stages:{synopsis:{text:'story',status:'review'}},threads:[thread,
  {id:'sketch',status:'planned',points:[]},{id:'discarded',status:'abandoned',points:[]},
  {id:'open',status:'active',points:[]}]};
 let issues=api.writerStoryFindIssues(plan,[a,b,c,{title:'A',position:4,path:''}]);
 assert.deepEqual(json(issues.map(x=>x.kind)),['duplicate','missing-scene','review-stage','echo-order','no-plant','no-payoff']);
 issues=api.writerStoryFindIssues(plan,[{...b,position:3},{...c,position:1}]);
 assert.ok(issues.some(x=>x.kind==='order'));
 assert.ok(issues.some(x=>x.kind==='outside-draft'&&x.point.path==='A.md'));
 assert.equal(thread.points[0].path,'B.md');
});
test('thread editing rejects unlisted or ambiguous placements and retains an existing orphan',()=>{
 const {api}=workspace(),allowed=new Set(['A.md','B.md']);
 const raw={title:'Clue',note:'Promise',status:'active',points:[{role:'plant',path:'A.md'},{role:'echo',path:'A.md'},{role:'echo',path:'A.md'},{role:'payoff',path:'B.md'}]};
 assert.equal(api.writerStoryCleanThread(raw,'k',allowed).points.length,3);
 assert.throws(()=>api.writerStoryCleanThread({...raw,points:[{role:'plant',path:'Elsewhere.md'}]},'k',allowed),/draft/);
 const orphan={role:'echo',path:'Missing.md'};
 assert.equal(api.writerStoryCleanThread({...raw,points:[orphan]},'k',allowed,{points:[orphan]}).points[0].path,'Missing.md');
 assert.throws(()=>api.writerStoryCleanThread({...raw,points:[{role:'plant',path:'A.md'},{role:'plant',path:'B.md'}]},'k',allowed),/one setup/);
});
test('project-only saves serialize, restore failed writes and follow note and folder renames',async()=>{
 const h=workspace(),{plugin,file,api}=h;
 await Promise.all([api.writerStoryWrite(plugin,file,plan=>api.writerStorySetStage(plan,'premise','A premise')),
  api.writerStoryWrite(plugin,file,plan=>({...plan,threads:[{id:'clue',points:[{role:'plant',path:'Bonfire/A.md'}]}]}))]);
 assert.equal(h.saves.length,2);
 assert.equal(api.writerStoryPlan(plugin,file.path).stages.premise.text,'A premise');
 plugin.saveSettings=async()=>{throw Error('Disk full');};
 await assert.rejects(api.writerStoryWrite(plugin,file,plan=>api.writerStorySetStage(plan,'premise','New')),/Disk full/);
 assert.equal(api.writerStoryPlan(plugin,file.path).stages.premise.text,'A premise');
 assert.equal(api.writerStoryRebase(plugin,'Bonfire/A.md','Bonfire/B.md'),true);
 assert.equal(api.writerStoryRebase(plugin,'Bonfire','Saga/Book'),true);
 assert.equal(api.writerStoryPlan(plugin,'Saga/Book/Index.md').threads[0].points[0].path,'Saga/Book/B.md');
 assert.equal(api.writerStoryPlan(plugin,file.path).threads.length,0);
 h.files.delete(file.path);
 await assert.rejects(api.writerStoryWrite(plugin,file,plan=>plan),/no longer available/);
 assert.deepEqual(h.writes,[]);
});
test('Markdown export creates a separate file using the next free name',async()=>{
 const h=workspace(),{plugin,file,api}=h;
 await api.writerStoryWrite(plugin,file,plan=>api.writerStorySetStage(plan,'premise','A stolen key.'));
 const existing={content:'Keep me'};h.files.set('Bonfire/Index - Story plan.md',existing);
 const exported=await api.writerStoryExport({app:h.app,plugin,draft:'Principal'},{format:'single',title:'Bonfire',file});
 assert.equal(exported.path,'Bonfire/Index - Story plan 2.md');
 assert.match(exported.content,/## Premise\n\nA stolen key/);
 assert.match(exported.content,/Draft scenes — Main\n- Bonfire/);
 assert.equal(h.files.get('Bonfire/Index - Story plan.md'),existing);
 assert.deepEqual(h.writes,[exported.path]);
});
test('a save queued under an old project path cannot overwrite the renamed plan',async()=>{
 const h=workspace(),{plugin,file,api}=h;
 const save=api.writerStoryWrite(plugin,file,plan=>api.writerStorySetStage(plan,'premise','Pending'));
 h.files.delete(file.path);file.path='Renamed/Index.md';h.files.set(file.path,file);
 await assert.rejects(save,/path changed/);
 assert.equal(h.saves.length,0);
});
class Element{
 constructor(options={}){this.options=options;this.children=[];this.events={};this.isConnected=true;this.classList={toggle(){}};}
 createEl(_tag,options){const child=new Element(options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 empty(){this.children=[];}
 setAttribute(){}
 addEventListener(name,callback){this.events[name]=callback;}
 setText(text){this.text=text;}
 all(){return this.children.flatMap(child=>[child,...child.all()]);}
 label(text){return this.all().find(child=>child.options.attr?.['aria-label']===text);}
}
test('stage edits survive switching and refreshing Structure until the writer saves',async()=>{
 const h=workspace(),root=new Element(),project={format:'single',title:'Bonfire',file:h.file};
 const view={plugin:h.plugin,draft:'Principal'};
 h.api.writerStoryPlanUI(view,root,project);
 let stage=root.label('Premise');
 assert.equal(stage.children[0].icon,'lightbulb');
 let input=root.all().find(child=>child.options.attr?.maxlength==='280');
 input.value='A first line';input.events.input();
 root.label('One-paragraph outline').events.click();
 root.label('Premise').events.click();
 root.empty();h.api.writerStoryPlanUI(view,root,project);
 input=root.all().find(child=>child.options.attr?.maxlength==='280');
 assert.equal(input.value,'A first line');
 await root.label('Mark ready').events.click();
 assert.equal(h.api.writerStoryPlan(h.plugin,h.file.path).stages.premise.status,'ready');
 assert.equal(h.api.writerStoryPlan(h.plugin,h.file.path).stages.premise.text,'A first line');
 assert.equal(h.saves.length,1);
});
