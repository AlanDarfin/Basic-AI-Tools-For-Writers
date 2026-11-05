'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const toolbar=fs.readFileSync('src/v9/context-toolbar.js','utf8');
const search=fs.readFileSync('src/v5/workspace-ux.js','utf8');
const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
const common={console,Date,Array,Map,Set,Math,Number,String,RegExp,Intl,
 writerUi:(pt,en)=>pt,writerModuleOn:()=>true,
 writerV8HomeIsMobile:plugin=>Boolean(plugin.app.isMobile),
 writerV102AlignApply:()=>{},Notice:class{}};
function expose(src,keys,extra={}){
 return vm.runInNewContext(src+'\n({'+keys.join(',')+'})',{...common,...extra});
}
test('toolbar migrates old settings, validates command ids and preserves action order',()=>{
 const api=expose(toolbar,['writerV9ToolbarMerge','WRITER_V9_FORMAT_IDS']);
 const s={v9Toolbar:{actions:['subscript','bold','bold','invalid','custom-one'],
  customButtons:[{id:'custom-one',command:'app:open-command-palette',label:'Comandos',icon:'wand-sparkles'},
   {id:'custom-evil',command:'javascript:alert(1)',label:'Bad',icon:'evil'}],
  customizations:{'subscript':{label:'Subescrito',icon:'subscript'}},
  groups:[{name:'Texto',icon:'type',ids:['bold','subscript']},
    {name:'Repetido',icon:'type',ids:['bold','custom-one']}] }};
 api.writerV9ToolbarMerge(s);
 const cfg=s.v9Toolbar;
 assert.equal(cfg.actions.join(','),'subscript,bold,custom-one');
 assert.equal(cfg.customButtons.length,1);
 assert.equal(cfg.groups[0].ids.join(','),'bold,subscript');
 assert.equal(cfg.groups[1].ids.join(','),'custom-one');
 assert.equal(cfg.customizations.subscript.label,'Subescrito');
 assert.equal(cfg.placement,'bottom');
 assert.equal(cfg.enabledMobile,false);
 assert.ok(api.WRITER_V9_FORMAT_IDS.includes('text-color'));
 assert.ok(api.WRITER_V9_FORMAT_IDS.includes('indent'));
});
test('new text actions preserve Markdown and never insert unsanitized CSS',()=>{
 const api=expose(toolbar,['writerV9Format','writerV1048ToolbarHex']);
 let selection='word';
 const editor={getSelection:()=>selection,replaceSelection:v=>{selection=v;},
  getCursor:()=>({line:0,ch:selection.length}),setSelection(){},focus(){}};
 assert.equal(api.writerV9Format(editor,'text-color',{textColor:'#ff0000'}),true);
 assert.equal(selection,'<span style="color:#ff0000">word</span>');
 selection='word';
 assert.equal(api.writerV9Format(editor,'background-color',{backgroundColor:'red;break'}),true);
 assert.equal(selection,'<mark style="background-color:#ffd66a">word</mark>');
 selection='A\n  B';
 assert.equal(api.writerV9Format(editor,'indent'),true);
 assert.equal(selection,'    A\n      B');
 assert.equal(api.writerV9Format(editor,'outdent'),true);
 assert.equal(selection,'A\n  B');
});
test('custom toolbar commands use registered Obsidian IDs and do not open URLs',()=>{
 const api=expose(toolbar,['writerV9ToolbarMerge','writerV1048ToolbarRun']);
 const settings={v9Toolbar:{customButtons:[{id:'custom-action',label:'Minha ação',
  command:'app:open-command-palette',icon:'command'}],actions:['custom-action']}};
 api.writerV9ToolbarMerge(settings);
 const calls=[];
 const plugin={settings,app:{commands:{commands:{'app:open-command-palette':{name:'Palette'}},
  executeCommandById:id=>{calls.push(id);return true;}}}};
 assert.equal(api.writerV1048ToolbarRun(plugin,null,'custom-action'),true);
 assert.deepEqual(calls,['app:open-command-palette']);
 assert.equal(api.writerV1048ToolbarRun(plugin,null,'custom-nonexistent'),false);
});
test('option search finds subscrito from toolbar and syntax without merely showing categories',()=>{
 const toolbarInfo=expose(toolbar,['WRITER_V9_FORMAT_ACTIONS']);
 const api=expose(search,['writerV1048SearchIndex','writerV1048SearchOptions','writerV1048SearchReveal'],{
  WRITER_V9_FORMAT_ACTIONS:toolbarInfo.WRITER_V9_FORMAT_ACTIONS});
 const sections=[['formatToolbar','Barra de formatação'],['extendedSyntax','Extended Syntax'],['review','LanguageTool']];
 const panel={querySelectorAll:()=>[]};
 const index=api.writerV1048SearchIndex(sections,panel,'review',new Map());
 const found=api.writerV1048SearchOptions(index,'subescrito');
 assert.ok(found.length>=1);
 assert.ok(found.some(item=>item.id==='formatToolbar'&&item.title==='Subscrito'));
 assert.ok(found.some(item=>item.id==='extendedSyntax'&&item.title==='Subscrito'));
 assert.equal(api.writerV1048SearchOptions(index,'sublinhado')[0].title,'Sublinhado');
 assert.equal(api.writerV1048SearchOptions(index,'batata123').length,0);
});
test('search result opens details and reveals the precise Setting row',()=>{
 const api=expose(search,['writerV1048SearchReveal']);
 let scrolled=false;
 const parent={tagName:'DETAILS',open:false,parentElement:null};
 const child={
  parentElement:parent,hidden:true,
  querySelector:selector=>selector==='.setting-item-name'?{textContent:'Subscrito'}:null,
  classList:{add(){}},
  scrollIntoView:()=>{scrolled=true;}
 };
 const panel={querySelectorAll:selector=>selector==='.setting-item'?[child]:[],parentElement:null};
 parent.parentElement=panel;
 assert.equal(api.writerV1048SearchReveal(panel,'Subscrito'),true);
 assert.equal(child.hidden,false);assert.equal(parent.open,true);assert.equal(scrolled,true);
});
test('settings and toolbar CSS are scoped, accessible and do not rely on unsupported selectors',()=>{
 for(const label of ['writer-v1048-toolbar-settings','writer-v1048-toolbar-inventory',
  'writer-v1048-format-toolbar','writer-v1050-settings-search',
  'writer-v1050-result-group','dictionary-settings-subtabs'])
  assert.ok(css.includes(label),label);
 assert.doesNotMatch(css,/:has\s*\(|!important\b/);
 assert.match(toolbar,/writerV1048ToolbarCommandPicker/);
 assert.match(toolbar,/writer-v1048-toolbar-group-card/);
 assert.match(toolbar,/dragstart/);
});
