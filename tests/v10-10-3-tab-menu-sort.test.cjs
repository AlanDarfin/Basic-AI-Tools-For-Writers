'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
function mockMenu(){
 const menus=[];
 class Menu{
  constructor(){this.items=[];this.shown=false;menus.push(this);}
  addItem(callback){
   const item={
    title:'',icon:null,submenu:null,checked:false,callback:null,
    setTitle(value){this.title=value;return this;},
    setIcon(value){this.icon=value;return this;},
    setChecked(value){this.checked=value;return this;},
    onClick(fn){this.callback=fn;return this;},
    setSubmenu(){this.submenu=new Menu();return this.submenu;}
   };
   callback(item);this.items.push(item);return this;
  }
  addSeparator(){return this;}
  showAtMouseEvent(){this.shown=true;return this;}
  showAtPosition(){this.shown=true;return this;}
 }
 return {Menu,menus};
}
function load(){
 const {Menu,menus}=mockMenu(),ctx={
  Menu,console,writerUi:(pt,en)=>pt,
  require:()=>({Platform:{isMobile:true},setIcon(){}}),
  Set,Map,Math,Number,String,Object
 };
 const api=vm.runInNewContext(source+
  '\n({writerV1010ActionIcon,writerV1010IsSortingAction,writerV1010FillSortMenu,writerV1010SidebarMenu})',ctx);
 return {api,menus};
}
function nativeAction(label,icon=''){
 let clicked=0;
 return {
  getAttribute(prop){return prop==='aria-label'?label:null;},
  closest(){return null;},
  querySelector(selector){
   return selector==='svg'&&icon?{
    classList:new Set(['lucide','lucide-'+icon]),getAttribute(){return null;}
   }:null;
  },
  click(){clicked++;},
  count(){return clicked;}
 };
}
test('Sidebar menu gives an icon to each native Explorer action',()=>{
 const {api,menus}=load();
 const native=[
  nativeAction('Nova nota','square-pen'),
  nativeAction('Nova pasta','folder-plus'),
  nativeAction('Mudar ordenação','arrow-up-narrow-wide'),
  nativeAction('Revelar automaticamente arquivo atual','gallery-vertical'),
  nativeAction('Expandir tudo'),
  nativeAction('Mostrar filtro de busca'),
  nativeAction('Gerenciar Spaces')
 ];
 const leaf={view:{
  sortOrder:'alphabetical',
  setSortOrder(value){this.sortOrder=value;},
  containerEl:{querySelectorAll(){return native;}}
 }};
 const plugin={
  app:{workspace:{leftSplit:{}},setting:{open(){}},vault:{getName(){return 'Library';}}},
  settings:{v9Spaces:{enabled:false}}
 };
 api.writerV1010SidebarMenu(plugin,{clientX:50,clientY:100,stopPropagation(){}},'left',[],leaf);
 const menu=menus[0];
 assert.equal(menu.shown,true);
 for(let i=0;i<native.length;i++)assert.ok(menu.items[i].icon,'No icon for '+menu.items[i].title);
 assert.equal(menu.items[0].icon,'square-pen');
 assert.equal(menu.items[1].icon,'folder-plus');
 assert.equal(menu.items[2].icon,'arrow-up-narrow-wide');
 assert.equal(menu.items[4].icon,'chevrons-up-down');
 assert.equal(menu.items[5].icon,'search');
 assert.equal(menu.items[6].icon,'layers');
});
test('Sorting is an in-place submenu: no synthetic native click and no instant closing',()=>{
 const {api,menus}=load();
 const sort=nativeAction('Mudar ordenação','arrow-up-narrow-wide');
 const view={sortOrder:'byModifiedTime',setSortOrder(value){this.sortOrder=value;},
  containerEl:{querySelectorAll(){return [sort];}}};
 const plugin={
  app:{workspace:{leftSplit:{}},setting:{open(){}},vault:{getName(){return 'Obsidian';}}},
  settings:{v9Spaces:{enabled:false}}
 };
 const event={clientX:24,clientY:42,stopPropagation(){}};
 api.writerV1010SidebarMenu(plugin,event,'left',[],{view});
 const root=menus[0],item=root.items[0];
 assert.ok(item.submenu,'Sorting menu must not call hidden native button');
 assert.equal(item.submenu.items.length,6);
 assert.equal(sort.count(),0);
 item.submenu.items[1].callback();
 assert.equal(view.sortOrder,'alphabeticalReverse');
 assert.equal(sort.count(),0,'No programmatic native sort click is allowed');
 assert.equal(root.shown,true);
 assert.equal(item.submenu.items[1].icon,'arrow-up-z-a');
});
test('Selected indicator uses accent CSS and switching updates actual buttons without teardown',()=>{
 const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
 assert.match(css,/\.writer-v1010-sidebar-button\.is-active::after/);
 assert.match(css,/background:var\(--interactive-accent\)/);
 assert.match(source,/oldState\.visible\.every\(\(leaf,i\)=>leaf===visible\[i\]\.leaf\)/);
 assert.match(source,/button\?\.classList\?\.toggle\('is-active',selected\)/);
 assert.match(source,/event\?\.stopPropagation\?\.\(\)/);
});
