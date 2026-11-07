'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const ui=read('src/v13/ui-foundation.js');
const drag=read('src/v10/block-dragger.js');
const home=read('src/v8/writing-home.js');
const toolbar=read('src/v9/context-toolbar.js');
const css=read('src/styles/v13-foundation.css');
const main=read('main.js');
const functions=vm.runInNewContext(ui+'\n'+drag+'\n({writerV131MinWidgetColumns,writerV131WidgetDropAfter,writerV131RankSettings,writerV131DragPosition})',{console,writerUi:(pt,en)=>en});
test('widget width is safe in an Obsidian 720p split pane',()=>{
 assert.equal(functions.writerV131MinWidgetColumns(360,12),12);
 assert.match(home,/basicCompactLayout/);
 assert.ok(functions.writerV131MinWidgetColumns(620,12)>=4);
 assert.ok(functions.writerV131MinWidgetColumns(1100,12)<=4);
 assert.equal(functions.writerV131WidgetDropAfter({left:0,top:0,width:200,height:100},180,50),true);
 assert.equal(functions.writerV131WidgetDropAfter({left:0,top:0,width:200,height:100},20,50),false);
 assert.equal(functions.writerV131WidgetDropAfter({left:0,top:0,width:200,height:100},20,90),true);
 assert.match(home,/grid\.clientWidth<=760/);
 assert.match(home,/minColumns=writerV131MinWidgetColumns/);
});
test('settings fuzzy search tolerates Portuguese accents, typos and semantic context',()=>{
 const options=[
  {id:'v9Toolbar',title:'Sobrescrito',section:'Escrita e edição'},
  {id:'extendedSyntax',title:'Subscrito',section:'Sintaxe',keywords:'subescrito'},
  {id:'homepage',title:'Layout dos widgets',section:'Página inicial',description:'grade de colunas grid'},
  {id:'v10Tools',title:'Tamanho do painel',section:'Arquivos',description:'resize largura altura'}
 ];
 assert.equal(functions.writerV131RankSettings(options,'subescrito')[0].title,'Subscrito');
 assert.equal(functions.writerV131RankSettings(options,'SObResCritO')[0].title,'Sobrescrito');
 assert.equal(functions.writerV131RankSettings(options,'grades')[0]?.title,'Layout dos widgets');
 assert.equal(functions.writerV131RankSettings(options,'redimensionar')[0]?.title,'Tamanho do painel');
 assert.equal(functions.writerV131RankSettings(options,'sobrescrto')[0]?.title,'Sobrescrito');
 assert.equal(functions.writerV131RankSettings(options,'inexistente xyz').length,0);
 assert.ok(main.includes('writerV131RankSettings([...all,...locations],q,18)'), 'core fuzzy search is wired');
 assert.match(main,/writer-v131-settings-pickers/);
});
test('block dragging works with Editor and CodeMirror position APIs',()=>{
 const pos=functions.writerV131DragPosition({posAtCoords:({left,top})=>({line:3,ch:2})},4,6);
 assert.equal(pos.line,3);
 const fallback=functions.writerV131DragPosition({cm:{posAtCoords:()=>24,
  state:{doc:{lineAt:()=>({number:5,from:21})}}}},4,6);
 assert.equal(fallback.line,4);
 assert.equal(fallback.ch,3);
 assert.equal(functions.writerV131DragPosition({},4,6),null);
 assert.match(drag,/coexistWithNative:true/);
 assert.match(drag,/mobileLongPress:true/);
 assert.match(drag,/handle\.setPointerCapture/);
 assert.doesNotMatch(drag,/if\(platform\?\.isMobile===true\|\|plugin\.app\?\.isMobile===true\)return;/);
});
test('resize hotspots do not intercept invisible button click targets',()=>{
 assert.match(css,/\.writer-v1205-resize-handle\{\s*pointer-events:none;opacity:0/);
 assert.match(css,/\.writer-v1205-resize-right\{\s*inset:50%/);
 assert.match(css,/\.writer-v1205-resize-bottom\{\s*inset:auto auto 0 50%/);
 assert.match(css,/container-name:basic-home/);
 assert.match(css,/@container basic-home \(max-width:560px\)/);
 assert.match(css,/@media \(max-height:850px\)/);
});
test('settings and toolbar remain compact without visible accidental horizontal scrollbars',()=>{
 assert.match(css,/container-name:basic-settings/);
 assert.match(css,/writer-v131-settings-pickers/);
 assert.match(css,/dictionary-settings-subtabs::-webkit-scrollbar\{display:none/);
 assert.match(css,/writer-v1048-format-toolbar::-webkit-scrollbar\{/);
 assert.match(css,/writer-v9-toolbar-host \.writer-v9-format-toolbar/);
 assert.match(toolbar,/owner\.insertBefore\(root,owner\.firstChild\)/);
});
