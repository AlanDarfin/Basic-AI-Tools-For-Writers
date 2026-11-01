'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(cls='',text='',parent=null){
  this.cls=cls;this.text=text;this.parent=parent;this.children=[];
  this.listeners={};this.style={};this.scrollTop=0;this._scrollLeft=0;this.value='';
  this.removed=false;this.clientWidth=155;this.attributes={};
  this.classList={toggle:(name,enabled)=>{
   const classes=new Set(this.cls.split(/\s+/).filter(Boolean));
   if(enabled)classes.add(name);else classes.delete(name);
   this.cls=[...classes].join(' ');
  }};
 }
 get isConnected(){return !this.removed&&(!this.parent||this.parent.isConnected);}
 get scrollWidth(){return this.cls.split(' ').includes('writer-project-tabs')?this.children.length*78:0;}
 get scrollLeft(){return this._scrollLeft;}
 set scrollLeft(value){this._scrollLeft=Math.max(0,Math.min(Number(value)||0,Math.max(0,this.scrollWidth-this.clientWidth)));}
 createDiv(options={}){return this.add(options);}
 createEl(_tag,options={}){return this.add(options);}
 add(options){const child=new Element(options.cls||'',options.text||'',this);this.children.push(child);return child;}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 setAttribute(name,value){this.attributes[name]=value;}
 click(){for(const fn of this.listeners.click||[])fn();}
 scrollTo(value){this.scrollLeft=value;for(const fn of this.listeners.scroll||[])fn();}
 empty(){for(const child of this.children)child.removed=true;this.children=[];this._scrollLeft=0;}
 querySelector(selector){
  const cls=selector.startsWith('.')?selector.slice(1):selector;
  const visit=el=>{for(const child of el.children){if(child.cls.split(/\s+/).includes(cls))return child;const nested=visit(child);if(nested)return nested;}return null;};
  return visit(this);
 }
}
const TFile=class{};const noopClass=class{};
const obsidian={ItemView:noopClass,TFile,TFolder:noopClass,Notice:noopClass,Modal:noopClass,Menu:noopClass,Setting:noopClass,parseYaml:()=>({}),stringifyYaml:()=>'',getLanguage:()=> 'pt-BR'};
let relationsRenders=0,sessionsRenders=0;
const sandbox={
 module:{exports:{}},require:id=>{if(id==='obsidian')return obsidian;throw Error('Unexpected module '+id);},
 console,setTimeout,clearTimeout,writerModuleOn:()=>true,
 writerV7StudioRenderGraph:()=>{relationsRenders++;},
 writerV7StudioRenderSessions:()=>{sessionsRenders++;}
};
vm.runInNewContext(fs.readFileSync('projects.js','utf8'),sandbox,{filename:'projects.js'});
const {ProjectsView}=sandbox.module.exports;
const project={file:{path:'Books/Index.md'},format:'scenes',scenes:[{title:'Scene'}],title:'Book',meta:{}};
function viewFixture(){
 const view=Object.create(ProjectsView.prototype);
 view.root=new Element('writer-project-root');
 view.renderToken=0;view.activeTab='relations';view.selected=project.file.path;
 view.draft='Principal';view.workflow='Padrão';view.tabGroup=null;view.tabScrollPositions=Object.create(null);
 view.lastSelected=project.file.path;view.plugin={settings:{v7:{},projectsData:{}},saveSettings:async()=>{}};
 view.app={workspace:{getActiveFile:()=>null}};
 view.indexes=()=>[project];view.prefs=()=>({});
 view.drawScenes=()=>{};view.drawProject=()=>{};view.drawNotes=async()=>{};
 return view;
}
test('switching to Sessions only changes the page, not the horizontal tab DOM',async()=>{
 const view=viewFixture();
 await view.render();
 const before=view.root.querySelector('.writer-project-tabs');
 assert.ok(before.scrollWidth>before.clientWidth);
 before.scrollTo(220);
 assert.equal(before.scrollLeft,220);
 const originalChildren=before.children.slice();
 const oldRootChildren=view.root.children.slice();
 let rerenderCount=0;
 const originalRender=view.render;
 view.render=async function(){rerenderCount++;return originalRender.call(this);};
 const sessions=originalChildren.find(x=>x.text==='Sessões');
 assert.ok(sessions);
 const previousSessions=sessionsRenders;
 sessions.click();
 assert.equal(view.activeTab,'sessions');
 assert.equal(view.root.querySelector('.writer-project-tabs'),before,'Same tab strip must remain mounted');
 assert.equal(before.scrollLeft,220);
 assert.equal(rerenderCount,0,'No full view rebuild');
 assert.equal(view.root.children.length,oldRootChildren.length);
 assert.equal(sessionsRenders,previousSessions+1,'Selected page is rendered');
 assert.ok(sessions.cls.includes('is-active'));
 const prior=before.scrollLeft;
 sessions.click();
 assert.equal(before.scrollLeft,prior);
 assert.equal(rerenderCount,0);
});
test('group switches only refresh tab buttons, preserving the strip and group positions',async()=>{
 const view=viewFixture();
 await view.render();
 const tabs=view.root.querySelector('.writer-project-tabs');
 tabs.scrollTo(230);
 const groups=view.root.querySelector('.writer-project-nav-groups');
 let rerenderCount=0;
 view.render=async()=>{rerenderCount++;throw Error('Full render is forbidden for a navigation click');};
 groups.children.find(x=>x.text==='Escrita').click();
 assert.equal(view.tabGroup,'writing');
 assert.equal(view.root.querySelector('.writer-project-tabs'),tabs);
 tabs.scrollTo(100);
 groups.children.find(x=>x.text==='Universo').click();
 assert.equal(view.tabGroup,'world');
 assert.equal(tabs.scrollLeft,230);
 assert.equal(view.tabScrollPositions.writing,100);
 assert.equal(rerenderCount,0);
});
