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
test('AI context menu groups all actions after later subscribers add them and preserves clicks',()=>{
 const clicks=[],icons=[];
 class Menu{
  constructor(){this.items=[];}
  addItem(fn){const item=makeItem();fn(item);this.items.push(item);}
  showAtMouseEvent(){this.shown=true;}
 }
 function makeItem(title,callback){
  const item={title,callback,dom:{remove(){item.removed=true;},click(){clicks.push(title);}},
   setTitle(value){this.title=value;return this;},
   setIcon(icon){this.icon=icon;icons.push(icon);return this;},
   setSection(){return this;},onClick(fn){this.callback=fn;return this;},
   setSubmenu(){return this.submenu||(this.submenu=new Menu());}};
  return item;
 }
 const api=expose('src/v9/context-toolbar.js',
  ['writerV1044ContextMenus','writerV1044AiKey'],{
   writerModuleOn:()=>true,writerV102AlignApply:()=>{},Menu,
   writerUi:(pt,en)=>en
  });
 const plugin={app:{workspace:{on:(_,fn)=>{plugin.editorMenuHandler=fn;return fn;}}},
  settings:{v9Toolbar:{enabledDesktop:true},v102Align:{enabled:true}},
  registerEvent:()=>{},register:()=>{}};
 api.writerV1044ContextMenus(plugin);
 const menu=new Menu();
 const editor={getSelection:()=>'',replaceSelection:()=>{},focus:()=>{}};
 plugin.editorMenuHandler(menu,editor);
 // Simulates legacy Basic and other handlers, registered after the organizer.
 const format=makeItem('Format');format.submenu=new Menu();menu.items.push(format);
 const originals=['Traduzir','Significado','Sinônimos','Antônimos','Reescrever']
  .map(label=>makeItem(label));
 menu.items.push(...originals,makeItem('Custom plugin action'));
 assert.equal(menu.items.some(item=>item.title==='Traduzir'),true);
 menu.showAtMouseEvent({});
 assert.equal(menu.items.includes(format),true);
 assert.ok(menu.items.some(item=>item.title==='Custom plugin action'));
 for(const label of ['Traduzir','Significado','Sinônimos','Antônimos','Reescrever'])
  assert.equal(menu.items.some(item=>item.title===label),false,label);
 const grouped=menu.items.find(item=>item.title==='AI · Tools');
 assert.ok(grouped);
 const sections=grouped.submenu.items;
 assert.deepEqual(Array.from(sections,item=>item.title),['Lookup & translate','Writing & revision']);
 const actions=sections.flatMap(section=>section.submenu.items);
 assert.equal(actions.length,5);
 assert.ok(actions.some(x=>x.title==='Translate'&&x.icon==='languages')===false);
 assert.ok(actions.some(x=>x.title==='Traduzir'&&x.icon==='languages'));
 assert.ok(actions.some(x=>x.title==='Significado'&&x.icon==='book-open'));
 assert.ok(actions.some(x=>x.title==='Sinônimos'&&x.icon==='list-tree'));
 assert.ok(actions.some(x=>x.title==='Antônimos'&&x.icon==='arrow-left-right'));
 assert.ok(actions.some(x=>x.title==='Reescrever'&&x.icon==='pencil-line'));
 actions.find(item=>item.title==='Traduzir').callback?.();
 assert.deepEqual(clicks,['Traduzir']);
 assert.ok(format.submenu.items.some(item=>item.title==='Underline'));
 assert.ok(format.submenu.items.some(item=>item.title==='Center line/heading'));
 const count=actions.length;menu.showAtMouseEvent({});
 assert.equal(sections.flatMap(x=>x.submenu.items).length,count);
 assert.equal(api.writerV1044AiKey('Sinônimos'),'synonyms');
 assert.equal(api.writerV1044AiKey('Adicionar link'),'');
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
