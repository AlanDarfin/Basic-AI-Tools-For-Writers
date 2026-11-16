'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const projectsSource=fs.readFileSync('projects.js','utf8');
const dividersSource=fs.readFileSync('src/v13/longform-dividers.js','utf8');

class Element{
 constructor(tag='div',options={}){this.tag=tag;this.options=options;this.children=[];this.listeners={};}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createSpan(options){return this.createEl('span',options);}
 createDiv(options){return this.createEl('div',options);}
 addEventListener(name,fn){this.listeners[name]=fn;}
 click(){return this.listeners.click?.();}
 insertBefore(child,before){
  this.children.splice(this.children.indexOf(child),1);
  this.children.splice(before?this.children.indexOf(before):this.children.length,0,child);
 }
 querySelector(selector){return this.children.find(el=>el.options.cls?.split(' ').includes(selector.slice(1)))||null;}
 querySelectorAll(){return [];}
}
function fixture(language='pt-BR',draft='Principal'){
 const calls=[],prompts=[];
 const obsidian={ItemView:class{},Modal:class{open(){prompts.push(this);}},
  getLanguage:()=>language,setIcon:(element,icon)=>{element.icon=icon;}};
 const context=vm.createContext({module:{exports:{}},require:()=>obsidian});
 vm.runInContext(projectsSource,context);
 vm.runInContext(dividersSource,context);
 const view=Object.create(context.module.exports.ProjectsView.prototype);
 const project={format:'scenes',title:'Bonfire',file:{path:'Bonfire/Index.md'}};
 const prefs={drafts:{Alternativa:[]}};
 Object.assign(view,{draft,app:{},prefs:()=>prefs,indexes:()=>[],activeScenes:()=>[],
  addScene:current=>calls.push(['scene',current]),createLinkedDraft:current=>calls.push(['draft',current]),
  plugin:{saveSettings:async()=>{calls.push('save');}},render:async()=>{calls.push('render');},
  savePrefs:async()=>{calls.push('prefs');},openFile:file=>calls.push(['open',file])});
 const panel=new Element();
 return {panel,project,view,prefs,calls,prompts};
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
test('scenes have five ordered icon buttons with localized names and existing actions',async()=>{
 const {panel,project,view,prefs,calls,prompts}=fixture();
 view.drawScenes(panel,project);
 const bar=panel.querySelector('.writer-project-scene-actions-bar');
 const [scene,divider,draft,expand,collapse]=checkButtons(bar,[
  ['file-plus','Adicionar cena'],['separator-horizontal','Adicionar separador de arco'],
  ['notebook-pen','Novo rascunho Longform'],['chevrons-up-down','Expandir tudo'],
  ['chevrons-down-up','Recolher tudo']]);
 scene.click();draft.click();divider.click();
 assert.match(prompts[0].titleText,/Novo separador de arco/);
 assert.deepEqual(calls,[['scene',project],['draft',project]]);
 view.activeScenes=()=>[{title:'A'},{title:'B'}];
 await collapse.click();
 assert.deepEqual({...prefs.v7CollapsedScenes},{A:true,B:true});
 await expand.click();
 assert.deepEqual({...prefs.v7CollapsedScenes},{});
 assert.deepEqual(calls.slice(2),['save','render','save','render']);
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
 await remove.click();
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
