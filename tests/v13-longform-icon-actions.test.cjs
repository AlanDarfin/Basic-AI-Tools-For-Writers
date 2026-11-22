'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const projectsSource=fs.readFileSync('projects.js','utf8');
const dividersSource=fs.readFileSync('src/v13/longform-dividers.js','utf8');

class Element{
 constructor(tag='div',options={}){this.tag=tag;this.options=options;this.children=[];this.listeners={};this.dataset={};}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createSpan(options){return this.createEl('span',options);}
 createDiv(options){return this.createEl('div',options);}
 addEventListener(name,fn){this.listeners[name]=fn;}
 addClass(name){this.options.cls=[this.options.cls,name].filter(Boolean).join(' ');}
 click(){return this.listeners.click?.();}
 insertBefore(child,before){
  this.children.splice(this.children.indexOf(child),1);
  this.children.splice(before?this.children.indexOf(before):this.children.length,0,child);
 }
 querySelector(selector){return this.children.find(el=>el.options.cls?.split(' ').includes(selector.slice(1)))||null;}
 querySelectorAll(){return [];}
}
function fixture(language='pt-BR',draft='Principal',comments=true){
 const calls=[],prompts=[],notices=[];
 const obsidian={ItemView:class{},Modal:class{open(){prompts.push(this);}},
  Notice:class{constructor(message){notices.push(message);}},
  getLanguage:()=>language,setIcon:(element,icon)=>{element.icon=icon;}};
 const context=vm.createContext({module:{exports:{}},require:()=>obsidian,
  writerModuleOn:(_plugin,id)=>id!=='comments'||comments,writerEditorialError:error=>{throw error;}});
 vm.runInContext(projectsSource,context);
 vm.runInContext(dividersSource,context);
 const view=Object.create(context.module.exports.ProjectsView.prototype);
 const project={format:'scenes',title:'Bonfire',file:{path:'Bonfire/Index.md'}};
 const prefs={drafts:{Alternativa:[]}};
 Object.assign(view,{draft,selected:project.file.path,app:{},prefs:()=>prefs,indexes:()=>[],activeScenes:()=>[],resolveScene:()=>null,
  addScene:current=>calls.push(['scene',current]),createLinkedDraft:current=>calls.push(['draft',current]),openSceneSearch:current=>calls.push(['search',current]),
  plugin:{saveSettings:async()=>{calls.push('save');},openProjects:async tab=>{calls.push(['tab',tab]);}},render:async()=>{calls.push('render');},
  savePrefs:async()=>{calls.push('prefs');},openFile:file=>calls.push(['open',file])});
 const panel=new Element();
 return {panel,project,view,prefs,calls,prompts,notices};
}
function buttons(bar){return bar.children.filter(el=>el.tag==='button');}
function checkButtons(bar,expected){
 const controls=buttons(bar);
 assert.equal(controls.length,expected.length);
 controls.forEach((button,index)=>{
  const [icon,label]=expected[index];
  assert.equal(button.options.text,undefined);
  assert.equal(button.options.attr.type,'button');
  assert.equal(button.options.attr['aria-label'],label);
  assert.equal(button.options.attr.title,label);
  assert.equal(button.children[0].options.attr['aria-hidden'],'true');
  assert.equal(button.children[0].icon,icon);
 });
 return controls;
}
test('scenes have six ordered icon buttons with localized names and actions',()=>{
 const {panel,project,view,calls,prompts}=fixture();
 view.drawScenes(panel,project);
 const bar=panel.querySelector('.writer-project-scene-actions-bar');
 const [scene,divider,search,draft,review,toggle]=checkButtons(bar,[
  ['file-plus','Adicionar cena'],['separator-horizontal','Adicionar separador de arco'],['search','Buscar cena'],
  ['notebook-pen','Novo rascunho Longform'],['message-square-text','Fila de revisão'],['chevrons-down-up','Recolher tudo']]);
 scene.click();draft.click();divider.click();review.click();search.click();
 assert.match(prompts[0].titleText,/Novo separador de arco/);
 assert.deepEqual(calls,[['scene',project],['draft',project],['tab','comments'],['search',project]]);
 assert.equal(toggle.disabled,true);
});
const renderTree=({project,view})=>{
 view.activeScenes=()=>[{title:'A',indent:0},{title:'A.1',indent:1},{title:'A.1.a',indent:2},
  {title:'B',indent:0},{title:'B.1',indent:1},{title:'Leaf',indent:0}];
 const panel=new Element();
 view.drawScenes(panel,project);
 return {rows:panel.children.map(el=>el.dataset.sceneTitle).filter(Boolean),
  toggle:panel.querySelector('.writer-project-scene-actions-bar').querySelector('.writer-project-toggle-scenes')};
};
test('one scene toggle folds all branches in a mixed tree and restores nested scenes on the next press',async()=>{
 const h=fixture('en');
 h.prefs.v7CollapsedScenes={B:true,OtherDraft:true};
 const open=renderTree(h);
 assert.deepEqual(open.rows,['A','A.1','A.1.a','B','Leaf']);
 assert.equal(open.toggle.options.attr['aria-label'],'Collapse all');
 assert.equal(open.toggle.children[0].icon,'chevrons-down-up');
 await open.toggle.click();
 assert.deepEqual({...h.prefs.v7CollapsedScenes},{A:true,'A.1':true,B:true,OtherDraft:true});
 const closed=renderTree(h);
 assert.deepEqual(closed.rows,['A','B','Leaf']);
 assert.equal(closed.toggle.options.attr['aria-label'],'Expand all');
 assert.equal(closed.toggle.children[0].icon,'chevrons-up-down');
 await closed.toggle.click();
 assert.deepEqual({...h.prefs.v7CollapsedScenes},{OtherDraft:true});
 assert.deepEqual(renderTree(h).rows,['A','A.1','A.1.a','B','B.1','Leaf']);
 assert.deepEqual(h.calls,['save','render','save','render']);
});
test('the scene toggle ignores repeat clicks while saving and keeps the previous state on failure',async()=>{
 const h=fixture();
 const previous=h.prefs.v7CollapsedScenes={B:true};
 let reject,attempts=0;
 h.view.plugin.saveSettings=()=>{attempts++;return new Promise((_,fail)=>{reject=fail;});};
 const {toggle}=renderTree(h);
 const first=toggle.click();await toggle.click();
 assert.equal(attempts,1);
 reject(Error('Disk offline'));await first;
 assert.equal(h.prefs.v7CollapsedScenes,previous);
 assert.equal(toggle.disabled,false);
 assert.equal(h.notices.length,1);
 assert.deepEqual(h.calls,[]);
});
test('variants keep the selector and translated actions, with delete only off the main draft',async()=>{
 const {panel,project,view,prefs,calls,prompts}=fixture('en','Alternativa');
 view.indexes=()=>[{title:project.title,file:{path:'Bonfire/Draft.md'}}];
 view.drawScenes(panel,project);
 const bar=panel.querySelector('.writer-project-draft-actions');
 assert.equal(bar.children[0].options.cls,'writer-project-linked-draft-select');
 assert.equal(bar.children[1].value,'Alternativa');
 const [add,remove]=checkButtons(bar,[['git-branch-plus','Add variant'],['trash-2','Delete variant']]);
 add.click();
 assert.equal(prompts[0].titleText,'Variant name');
 remove.click();
 assert.equal(view.draft,'Alternativa','Opening the dialog does not delete the draft');
 assert.ok(prefs.drafts.Alternativa);
 assert.equal(prompts[1].label,'Delete variant');
 await prompts[1].done();
 assert.equal(view.draft,'Principal');
 assert.equal(prefs.drafts.Alternativa,undefined);
 assert.deepEqual(calls,['prefs']);
 const nextPanel=new Element();
 view.drawScenes(nextPanel,project);
 checkButtons(nextPanel.querySelector('.writer-project-draft-actions'),[['git-branch-plus','Add variant']]);
});
test('single-note projects retain their open-text action without scene controls',()=>{
 const {panel,project,view,calls}=fixture('en');
 project.format='single';
 view.drawScenes(panel,project);
 assert.equal(panel.querySelector('.writer-project-scene-actions-bar'),null);
 const [open]=buttons(panel);
 assert.equal(open.options.text,'Open text');
 open.click();
 assert.deepEqual(calls,[['open',project.file]]);
});

test('review shortcut follows the existing comments module switch',()=>{
 const {panel,project,view}=fixture('en','Principal',false);
 view.drawScenes(panel,project);
 const bar=panel.querySelector('.writer-project-scene-actions-bar');
 assert.equal(buttons(bar).length,5);
 assert.equal(buttons(bar).some(button=>button.options.attr['aria-label']==='Review queue'),false);
});
