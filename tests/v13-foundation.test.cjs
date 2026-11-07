'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'src/v13/ui-foundation.js'),'utf8')+
 '\nglobalThis.v13={writerV13SearchText,writerV13CommandCatalog,writerV13CommandScore,writerV13RankCommands,writerV13BindSettingsTabs};',context);
const v=context.v13;
test('search is accent-insensitive and command inventory retains existing command IDs',()=>{
 assert.equal(v.writerV13SearchText(' FORMATAÇÃO  '),'formatacao');
 const catalog=v.writerV13CommandCatalog({app:{commands:{
  listCommands:()=>[{id:'basic-ai-tool-for-writers:bold',name:'Negrito'}],
  commands:{'basic-ai-tool-for-writers:bold':{name:'Negrito'},'other:test':{name:'Other action'}}
 }}});
 assert.deepEqual(Array.from(catalog.map(c=>c.id)),['basic-ai-tool-for-writers:bold','other:test']);
});
test('ranked commands support partial multiword terms, stable order and no false positives',()=>{
 const commands=[
  {id:'other:thing',name:'Other action'},
  {id:'basic-ai-tool-for-writers:bold',name:'Negrito'},
  {id:'other:bold',name:'Format bold'},
  {id:'other:italic',name:'Format italic'}
 ];
 assert.equal(v.writerV13RankCommands(commands,'',70)[0].id,'basic-ai-tool-for-writers:bold');
 assert.equal(v.writerV13RankCommands(commands,'format bold')[0].id,'other:bold');
 assert.equal(v.writerV13RankCommands(commands,'not here').length,0);
 assert.equal(v.writerV13RankCommands(commands,'bold',1).length,1);
 assert.equal(v.writerV13RankCommands(commands,'FORMAT BÓLD').length,1);
});
test('settings tabs support arrows, home and end without altering absent buttons',()=>{
 const buttons=[0,1,2].map(()=>({
  focusCount:0,clickCount:0,focus(){this.focusCount++},click(){this.clickCount++},
  getAttribute(name){return name==='aria-selected'?'false':null;}
 }));
 const handlers={};
 const strip={dataset:{},setAttribute(){},addEventListener(type,fn){handlers[type]=fn;},
  querySelectorAll(){return buttons}};
 v.writerV13BindSettingsTabs(strip,null);
 let prevented=false;
 handlers.keydown({key:'End',target:{closest:()=>buttons[0]},
  preventDefault(){prevented=true}});
 assert.equal(prevented,true);
 assert.equal(buttons[2].clickCount,1);
 assert.equal(buttons[2].focusCount,1);
 handlers.keydown({key:'ArrowLeft',target:{closest:()=>buttons[0]},preventDefault(){}});
 assert.equal(buttons[2].clickCount,2);
 // Binding twice must not attach duplicate handlers.
 assert.equal(strip.dataset.basicV13Keyboard,'1');
});
test('generated outputs and build inventories both include the same v13 entry',()=>{
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 const jsBuild=fs.readFileSync(path.join(root,'scripts/build-v3.js'),'utf8');
 const cssBuild=fs.readFileSync(path.join(root,'scripts/build-css.js'),'utf8');
 const toolbar=fs.readFileSync(path.join(root,'src/v9/context-toolbar.js'),'utf8');
 assert.match(toolbar,/return writerV1044CommandPicker\(plugin/,'toolbar reuses shared picker');
 assert.match(jsBuild,/v13\/ui-foundation/);
 assert.match(cssBuild,/v13-foundation\.css/);
 assert.match(main,/v3 module: src\/v13\/ui-foundation\.js/);
 assert.match(main,/writerV13BindSettingsTabs\(nav,subnav\)/);
 assert.match(css,/Basic v13 — foundation overrides/);
});

test('v13 compatibility adapters remain scoped to Basic hosts and preserve Surfing native UI',()=>{
 const css=fs.readFileSync(path.join(root,'src/styles/v13-foundation.css'),'utf8');
 assert.match(css,/writer-v11-studio-actions/);
 assert.match(css,/writer-v102-spaces-manager/);
 assert.match(css,/writer-v95-timeline\.is-layout-horizontal/);
 assert.match(css,/writer-v106-drag-handle/);
 assert.match(css,/body\.is-mobile/);
 assert.match(css,/writer-v1205-native-surfing-host/);
 assert.match(css,/prefers-contrast:more/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/\.wb-header-bar\s*\{/,'native Surfing header remains plugin-owned');
});
