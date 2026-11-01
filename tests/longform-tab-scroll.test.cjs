'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(cls='',text='',parent=null){
  this.cls=cls;this.text=text;this.parent=parent;this.children=[];
  this.listeners={};this.style={};this.scrollTop=0;this._scrollLeft=0;this.value='';
  this.removed=false;this.clientWidth=155;
 }
 get isConnected(){return !this.removed&&(!this.parent||this.parent.isConnected);}
 get scrollWidth(){return this.cls==='writer-project-tabs'?this.children.length*78:0;}
 get scrollLeft(){return this._scrollLeft;}
 set scrollLeft(value){this._scrollLeft=Math.max(0,Math.min(Number(value)||0,this.scrollWidth-this.clientWidth));}
 createDiv(options={}){return this.add(options);}
 createEl(_tag,options={}){return this.add(options);}
 add(options){const child=new Element(options.cls||'',options.text||'',this);this.children.push(child);return child;}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 click(){for(const fn of this.listeners.click||[])fn();}
 scrollTo(value){this.scrollLeft=value;for(const fn of this.listeners.scroll||[])fn();}
 empty(){for(const child of this.children)child.removed=true;this.children=[];}
 querySelector(selector){
  const cls=selector.startsWith('.')?selector.slice(1):selector;
  const visit=el=>{for(const child of el.children){if(child.cls.split(/\s+/).includes(cls))return child;const nested=visit(child);if(nested)return nested;}return null;};
  return visit(this);
 }
}
const TFile=class{};const noopClass=class{};
const obsidian={ItemView:noopClass,TFile,TFolder:noopClass,Notice:noopClass,Modal:noopClass,Menu:noopClass,Setting:noopClass,parseYaml:()=>({}),stringifyYaml:()=>'',getLanguage:()=> 'pt-BR'};
const sandbox={
 module:{exports:{}},require:id=>{if(id==='obsidian')return obsidian;throw Error('Unexpected module '+id);},
 console,setTimeout,clearTimeout,writerModuleOn:()=>true,
 writerV7StudioRenderGraph:()=>{},writerV7StudioRenderSessions:()=>{},
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
test('selecting Sessions preserves the horizontally scrolled World tab strip',async()=>{
 const view=viewFixture();
 await view.render();
 const before=view.root.querySelector('.writer-project-tabs');
 assert.ok(before.scrollWidth>before.clientWidth);
 before.scrollTo(220);
 assert.equal(before.scrollLeft,220);
 const sessions=before.children.find(x=>x.text==='Sessões');
 assert.ok(sessions,'Sessions tab should exist');
 sessions.click();
 const after=view.root.querySelector('.writer-project-tabs');
 assert.notEqual(after,before,'View is rebuilt after a tab click');
 assert.equal(view.activeTab,'sessions');
 assert.equal(after.scrollLeft,220,'Restored after creating tabs, not on an empty tab strip');
 assert.equal(view.tabScrollPositions.world,220);
 await view.render();
 assert.equal(view.root.querySelector('.writer-project-tabs').scrollLeft,220,'Background rerenders retain position');
});
test('switching between grouped areas remembers each tab strip independently',async()=>{
 const view=viewFixture();
 await view.render();
 let tabs=view.root.querySelector('.writer-project-tabs');
 tabs.scrollTo(230);
 let groups=view.root.querySelector('.writer-project-nav-groups');
 groups.children.find(x=>x.text==='Escrita').click();
 assert.equal(view.tabGroup,'writing');
 tabs=view.root.querySelector('.writer-project-tabs');
 tabs.scrollTo(100);
 groups=view.root.querySelector('.writer-project-nav-groups');
 groups.children.find(x=>x.text==='Universo').click();
 assert.equal(view.tabGroup,'world');
 assert.equal(view.root.querySelector('.writer-project-tabs').scrollLeft,230);
 assert.equal(view.tabScrollPositions.writing,100);
});
