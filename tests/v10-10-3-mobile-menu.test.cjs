'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v10/sidebar-width-1010.js','utf8');
function runtime(){
 const timers=[],icons=[],items=[];
 class Menu {
  constructor(){this.items=[];items.push(this);}
  addItem(builder){
   const item={label:'',icon:'',
    setTitle(label){this.label=label;return this;},
    setIcon(icon){this.icon=icon;return this;},
    onClick(callback){this.action=callback;return this;}};
   builder(item);this.items.push(item);return this;
  }
  addSeparator(){}
  showAtMouseEvent(){this.open=true;}
  showAtPosition(){this.open=true;}
 }
 const context={
  console,
  Menu,
  writerUi:(pt,en)=>pt,
  setTimeout(callback,delay){timers.push({callback,delay});return timers.length;},
  clearTimeout(){},
  require(name){assert.equal(name,'obsidian');return {setIcon(el,name){icons.push(name);}};}
 };
 const api=vm.runInNewContext(source+'\n({writerV1013NativeActionIcon,writerV1013ForwardNativeAction,writerV1010SidebarMenu})',context);
 return {api,timers,icons,items};
}
function action(label,classes=''){
 const attrs={'aria-label':label};
 return {
  clicks:0,
  getAttribute(key){return attrs[key]||null;},
  querySelector(selector){
   return selector==='svg'?{getAttribute(key){return key==='class'?classes:'';}}:null;
  },
  closest(){return null;},
  click(){this.clicks++;}
 };
}
test('Original Lucide icon is reused for native sidebar actions',()=>{
 const {api}=runtime();
 assert.equal(api.writerV1013NativeActionIcon(action('Mudar ordenação','svg-icon lucide lucide-arrow-up-narrow-wide'),
  'Mudar ordenação'),'arrow-up-narrow-wide');
 assert.equal(api.writerV1013NativeActionIcon(action('Nova pasta'), 'Nova pasta'),'folder-plus');
 assert.equal(api.writerV1013NativeActionIcon(action('Nova nota'), 'Nova nota'),'file-pen-line');
 assert.equal(api.writerV1013NativeActionIcon(action('Gerenciar Spaces'),'Gerenciar Spaces'),'layers');
 assert.equal(api.writerV1013NativeActionIcon(action('Mostrar filtro de busca'),'Mostrar filtro de busca'),'search');
 assert.equal(api.writerV1013NativeActionIcon(action('Ação personalizada'),'Ação personalizada'),'circle-dot');
});
test('Forwarded native sorting opens only after Basic menu finishes closing',()=>{
 const {api,timers,items}=runtime();
 const sort=action('Mudar ordenação','svg-icon lucide lucide-list-filter');
 const plugin={
  app:{workspace:{},vault:{getName:()=> 'My Vault'},setting:{open(){}}},
  settings:{v9Spaces:{enabled:false}}
 };
 const container={
  querySelectorAll(){return [sort];}
 };
 const current={view:{containerEl:container}};
 api.writerV1010SidebarMenu(plugin,{clientX:21,clientY:22},'left',[],current);
 const menu=items[0];
 const native=menu.items.find(i=>i.label==='Mudar ordenação');
 assert.ok(native,'native sorting action appears in More');
 assert.equal(native.icon,'list-filter','menu item preserves sort icon');
 native.action();
 assert.equal(sort.clicks,0,'native menu must not open before More is dismissed');
 assert.equal(timers.length,1);
 assert.ok(timers[0].delay>=60);
 menu.open=false;
 timers[0].callback();
 assert.equal(sort.clicks,1,'native sorting opens after prior menu closes');
});
test('All proxied action entries have meaningful icons, including fallback',()=>{
 const {api,items}=runtime();
 const actions=[action('Nova pasta','svg-icon lucide lucide-folder-plus'),
  action('Revelar automaticamente o arquivo atual'),
  action('Expandir tudo'),action('Sem ícone')];
 const plugin={app:{workspace:{},setting:{open(){}},vault:{getName:()=> 'My Vault'}},
  settings:{v9Spaces:{enabled:false}}};
 api.writerV1010SidebarMenu(plugin,{clientX:1,clientY:1},'left',[],
  {view:{containerEl:{querySelectorAll:()=>actions}}});
 const menu=items[0];
 for(const title of actions.map(x=>x.getAttribute('aria-label'))){
  const item=menu.items.find(x=>x.label===title);
  assert.ok(item,title+' missing');
  assert.ok(item.icon,title+' missing icon');
 }
});
