'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const alignment=read('src/v10/inline-alignment.js');
const toolbar=read('src/v9/context-toolbar.js');
const settings=read('src/v5/workspace-ux.js');
const css=read('src/styles/v10-2-workflow.css');
const context={console,Date,Map,Set,Array,Math,Number,String,RegExp,
 writerUi:(pt,en)=>pt,writerModuleOn:()=>true};
function expose(source,names,extra={}){
 return vm.runInNewContext(source+'\n({'+names.join(',')+'})',{...context,...extra});
}
function editor(initial){
 const model={value:initial};
 return Object.assign(model,{
  getCursor:()=>({line:0,ch:model.value.length}),
  getLine:n=>n===0?model.value:'',
  getSelection:()=>model.value,
  replaceRange:(text)=>{model.value=text;},
  replaceSelection:(text)=>{model.value=text;},
  focus:()=>{}
 });
}
test('Justify uses {j} for ordinary paragraphs and Markdown headings',()=>{
 const api=expose(alignment,['writerV102AlignSide','writerV102AlignToken',
  'writerV102AlignApply','writerV102AlignNormalizeLine']);
 assert.equal(api.writerV102AlignSide('j'),'justify');
 assert.equal(api.writerV102AlignSide('justify'),'justify');
 assert.equal(api.writerV102AlignToken('Um parágrafo longo {j}').side,'justify');
 assert.equal(api.writerV102AlignToken('## Capítulo {j}').side,'justify');
 assert.equal(api.writerV102AlignToken('## Capítulo {j}').heading,true);
 assert.equal(api.writerV102AlignToken('## Capítulo {c}').side,'center');
 assert.equal(api.writerV102AlignToken('## Capítulo {r}').side,'right');
 const p=editor('Esse texto será justificado');
 assert.equal(api.writerV102AlignApply(p,'j'),true);
 assert.equal(p.value,'Esse texto será justificado {j}');
 const h=editor('### Introdução {c}');
 assert.equal(api.writerV102AlignApply(h,'j'),true);
 assert.equal(h.value,'### Introdução {j}');
 assert.equal(api.writerV102AlignNormalizeLine('### Introdução {j}').text,'Introdução');
 assert.match(alignment,/Justificar texto/);
 assert.match(alignment,/writer-v102-align-/);
 assert.match(css,/\.cm-line\.writer-v102-align-justify/);
 assert.match(css,/text-align:justify/);
});
test('toolbar and native Format menu call the shared alignment implementation',()=>{
 const api=expose(alignment,['writerV102AlignApply']);
 const tb=expose(toolbar,['writerV9Format'],{writerV102AlignApply:api.writerV102AlignApply});
 const p=editor('Linha do livro');
 assert.equal(tb.writerV9Format(p,'justify'),true);
 assert.equal(p.value,'Linha do livro {j}');
 assert.doesNotMatch(p.value,/<div|style=/);
 assert.match(toolbar,/\['j','align-justify','Justificar','Justify'\]/);
});
test('mobile settings use layout-independent controls with bounded heights',()=>{
 assert.match(toolbar,/writer-v1049-compact-field/);
 assert.match(toolbar,/writer-v1049-toolbar-style/);
 assert.match(toolbar,/writer-v1049-toolbar-size/);
 assert.match(toolbar,/writer-v1049-toolbar-position/);
 const block=toolbar.slice(toolbar.indexOf('const compactField='),toolbar.indexOf('const inventory='));
 assert.doesNotMatch(block,/new Setting\(root\)/);
 assert.match(css,/writer-v1049-compact-field/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/max-height:38px/);
 assert.match(css,/min-height:0/);
});
test('settings search displays full-width flat option rows instead of centered black cards',()=>{
 assert.match(settings,/writer-v1049-result-content/);
 assert.match(settings,/writer-v1049-result-icon/);
 assert.match(settings,/aria-live':'polite'/);
 assert.match(css,/writer-v1048-search-list > button\.writer-v1048-search-result/);
 assert.match(css,/background:transparent/);
 assert.match(css,/width:100%;min-width:0;max-width:100%/);
 assert.match(css,/max-height:min\(33vh,260px\)/);
 assert.doesNotMatch(css.slice(css.indexOf('10.4.9 —')),/!important|:has\s*\(/);
});
