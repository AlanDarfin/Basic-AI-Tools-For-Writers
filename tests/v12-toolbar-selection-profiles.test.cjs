'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/v9/context-toolbar.js','utf8');
const ctx={
 writerUi:(pt,en)=>en,writerModuleOn:()=>true,
 writerV8HomeIsMobile:p=>Boolean(p.app.isMobile),console
};
const api=vm.runInNewContext(source+'\n({writerV9ToolbarMerge,writerV1048ToolbarProfile,writerV1048ToolbarHasSelection})',ctx);
const view=(selected,mode='source')=>({
 getMode:()=>mode,
 editor:{getSelection:()=>selected,cm:{state:{selection:{ranges:[{from:0,to:0}]}}}}
});
test('floating mode requires actual text, never an empty cursor or reading mode',()=>{
 assert.equal(api.writerV1048ToolbarHasSelection(view('')),false);
 assert.equal(api.writerV1048ToolbarHasSelection(view('   ')),false);
 assert.equal(api.writerV1048ToolbarHasSelection(view('word')),true);
 assert.equal(api.writerV1048ToolbarHasSelection(view('word','preview')),false);
});
test('toolbar editing profiles remain separate across desktop and mobile',()=>{
 const settings={v9Toolbar:{placement:'floating',showLabels:true,actions:['bold','italic']}};
 api.writerV9ToolbarMerge(settings);
 const plugin={settings,app:{isMobile:false}};
 const desktop=api.writerV1048ToolbarProfile(plugin,'desktop');
 const mobile=api.writerV1048ToolbarProfile(plugin,'mobile');
 assert.equal(desktop.placement,'floating');
 assert.equal(mobile.placement,'bottom');
 desktop.showLabels=false;
 mobile.placement='top';
 assert.equal(mobile.showLabels,true);
 assert.equal(desktop.placement,'floating');
 assert.equal(settings.v9Toolbar.showLabels,true,'shared legacy field remains unmodified');
});
test('settings expose per-device label toggle and selection-only floating option',()=>{
 assert.match(source,/setValue\(cfg\.showLabels===true\)/);
 assert.match(source,/cfg\.showLabels=value/);
 assert.match(source,/device==='desktop'\?\[\['floating'/);
 assert.match(source,/render\(writerV8HomeIsMobile\(plugin\)\?'mobile':'desktop'\)/);
 assert.doesNotMatch(source,/toggle\('Mostrar nomes junto aos ícones'[^\n]*'showLabels'\)/);
});
