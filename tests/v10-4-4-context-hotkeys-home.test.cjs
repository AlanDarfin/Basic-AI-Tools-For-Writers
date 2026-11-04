'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function source(path){return fs.readFileSync(path,'utf8');}
function expose(path,keys,extra={}){
 const names=keys.join(',');
 return vm.runInNewContext(source(path)+'\n({'+names+'})', {
  console,Date,Set,Array,Map,Math,Number,String,RegExp,
  writerUi:(pt,en)=>en,...extra
 });
}
test('Double-key settings migrate old Shift and support multiple mapped keys',()=>{
 const api=expose('src/v10/toolbox.js',[
  'writerV10ToolboxMerge','writerV1044DoubleKeyCode',
  'writerV1044DoubleKeyMatch','writerV1044DoubleKeyIsText']);
 const prior={v10Tools:{doubleShift:true,doubleShiftDelay:325,doubleShiftCode:'left'}};
 const cfg=api.writerV10ToolboxMerge(prior);
 assert.equal(cfg.doublePressEnabled,true);
 assert.equal(cfg.doublePressBindings[0].key,'ShiftLeft');
 assert.equal(cfg.doublePressBindings[0].command,'app:open-command-palette');
 assert.equal(api.writerV1044DoubleKeyMatch({key:'Shift'},'ShiftRight'),true);
 assert.equal(api.writerV1044DoubleKeyMatch({key:'ShiftLeft'},'ShiftRight'),false);
 assert.equal(api.writerV1044DoubleKeyCode({code:'KeyA',key:'a'}),'KeyA');
 assert.equal(api.writerV1044DoubleKeyIsText('KeyA'),true);
 assert.equal(api.writerV1044DoubleKeyIsText('F5'),false);
 const more={v10Tools:{doublePressEnabled:true,doublePressBindings:[
  {key:'F5',command:'workspace:open-command-palette',context:'all'},
  {key:'KeyB',command:'app:open-command-palette',context:'nonText'},
  {key:'Invalid',command:'does-not-matter'}
 ]}};
 const next=api.writerV10ToolboxMerge(more);
 assert.equal(next.doublePressBindings.length,2);
 assert.equal(next.doublePressBindings[0].key,'F5');
 assert.equal(next.doublePressBindings[1].context,'nonText');
 assert.equal(api.writerV10ToolboxMerge(more).doublePressBindings.length,2);
});
test('Context action grouping preserves callbacks and extends native Format submenu',()=>{
 const callbacks=[];
 const formatMenu={items:[],addItem(fn){const item=makeItem();fn(item);this.items.push(item);}};
 function makeItem(title){
  return {title,callback:()=>{callbacks.push(title);},
   setTitle(value){this.title=value;return this;},setIcon(){return this;},
   setSection(){return this;},onClick(fn){this.callback=fn;return this;},
   setSubmenu(){return this.submenu||(this.submenu={items:[],addItem(fn){const it=makeItem();fn(it);this.items.push(it);}});}
  };
 }
 const format=makeItem('Format');format.submenu=formatMenu;
 const lookup=makeItem('Significado'),translate=makeItem('Tradução'),rewrite=makeItem('Reescrever');
 const foreign=makeItem('Custom plugin action');
 const main={items:[format,lookup,translate,rewrite,foreign],addItem(fn){
  const item=makeItem();fn(item);this.items.push(item);
 }};
 const api=expose('src/v9/context-toolbar.js',[
  'writerV1044ContextMenus','writerV1044AiKey'],{
  writerModuleOn:()=>true,writerV102AlignApply:()=>{},Menu:function(){}
 });
 assert.equal(api.writerV1044AiKey('Sinônimos'),'synonyms');
 assert.equal(api.writerV1044AiKey('Adicionar link'),'');
 let callback;
 const plugin={app:{workspace:{on:(name,fn)=>{assert.equal(name,'editor-menu');callback=fn;return fn;}}},
  settings:{v9Toolbar:{enabledDesktop:true},v102Align:{enabled:true}},
  registerEvent:()=>{}};
 api.writerV1044ContextMenus(plugin);
 callback(main,{getSelection:()=>'',replaceSelection:()=>{},focus:()=>{}});
 assert.equal(main.items.includes(format),true);
 assert.equal(main.items.includes(foreign),true);
 assert.equal(main.items.includes(lookup),false);
 assert.equal(main.items.includes(translate),false);
 assert.ok(formatMenu.items.some(item=>item.title==='Underline'));
 assert.ok(formatMenu.items.some(item=>item.title==='Center line/heading'));
 const ai=main.items.find(item=>item.title==='AI · Tools');
 assert.ok(ai);
 const sections=ai.submenu.items;
 assert.equal(sections.length,2);
 const actions=sections.flatMap(section=>section.submenu.items);
 assert.equal(actions.length,3);
 actions.find(x=>x.title==='Significado').callback?.();
 assert.deepEqual(callbacks,['Significado']);
});
test('Homepage focuses search on desktop and replaces its own leaf',()=>{
 const code=source('src/v8/writing-home.js');
 assert.match(code,/this\.homeSearchInput=input/);
 assert.match(code,/if\(!writerV8HomeIsMobile\(this\.plugin\)\)/);
 assert.match(code,/activeLeaf===this\.leaf/);
 assert.match(code,/this\.homeSearchInput\.focus\(\{preventScroll:true\}\)/);
 assert.match(code,/const leaf=this\.leaf\|\|this\.app\.workspace\.activeLeaf/);
 assert.doesNotMatch(code,/getLeaf\?\.\('tab'\)/);
});
