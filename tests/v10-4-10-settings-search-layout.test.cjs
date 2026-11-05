'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const search=fs.readFileSync('src/v5/workspace-ux.js','utf8');
const css=fs.readFileSync('src/styles/v10-2-workflow.css','utf8');
const data=[
 ['underline','underline','Sublinhado','Underline'],
 ['subscript','subscript','Subscrito','Subscript'],
 ['superscript','superscript','Sobrescrito','Superscript']
];
class FakeNode{
 constructor(tag,options={}){
  this.tag=tag;this.className=options.cls||'';this.attributes=options.attr||{};
  this.textContent=options.text||'';this.children=[];this.listeners={};
  this.hidden=false;this.value='';this.parentElement=null;
 }
 child(tag,opts){
  const node=new FakeNode(tag,opts);
  node.parentElement=this;this.children.push(node);return node;
 }
 createDiv(opts){return this.child('div',opts);}
 createSpan(opts){return this.child('span',opts);}
 createEl(tag,opts){return this.child(tag,opts);}
 addEventListener(type,handler){this.listeners[type]=handler;}
 setText(value){this.textContent=String(value);}
 empty(){this.children=[];}
 querySelectorAll(){return [];}
}
const api=vm.runInNewContext(search+
 '\n({writerWorkspaceBindSearch,writerV1050SearchGroups,writerV1050SearchTarget})',{
 console,Date,Math,Array,Map,Set,String,RegExp,
 WRITER_V9_FORMAT_ACTIONS:data,
 writerUi:(pt,en)=>pt,
 require:()=>({setIcon:()=>{}}),
 setTimeout:()=>0
});
function allNodes(node){
 return [node,...node.children.flatMap(allNodes)];
}
function cls(root,name){
 return allNodes(root).filter(node=>node.className.split(' ').includes(name));
}
test('duplicate options appear once with independent destination choices',()=>{
 const entries=[
  {id:'toolbar',title:'Subscrito',section:'Barra de formatação'},
  {id:'syntax',title:'Subscrito',section:'Extended Syntax'},
  {id:'toolbar',title:'Subscrito',section:'Barra de formatação'},
  {id:'syntax',title:'Sobrescrito',section:'Extended Syntax'}
 ];
 const groups=api.writerV1050SearchGroups(entries);
 assert.equal(groups.length,2);
 assert.equal(groups[0].entries.length,2);
 assert.equal(groups[1].entries.length,1);
});
test('mobile query renders three groups, six destinations, no black buttons',()=>{
 const root=new FakeNode('div'),panel=new FakeNode('div');
 const sections=[['general','Geral'],['formatToolbar','Barra de formatação'],
  ['extendedSyntax','Extended Syntax']];
 const opened=[];
 const result=api.writerWorkspaceBindSearch(root,sections,
  id=>opened.push(id),()=>panel,()=>'general');
 const input=cls(root,'writer-v901-search-field')[0].children.find(n=>n.tag==='input');
 assert.ok(input);
 input.value='Su';result.update();
 const feedback=cls(root,'writer-v1050-results')[0];
 assert.equal(feedback.hidden,false);
 assert.equal(cls(feedback,'writer-v1050-result-group').length,3);
 assert.equal(cls(feedback,'writer-v1050-result-target').length,6);
 assert.match(cls(feedback,'writer-v1050-result-count')[0].textContent,/Configurações: 3 · locais: 6/);
 assert.equal(allNodes(feedback).filter(n=>n.tag==='button').length,0);
 const first=cls(feedback,'writer-v1050-result-group')[0];
 assert.equal(cls(first,'writer-v1050-result-title')[0].textContent,'Sublinhado');
 const targets=cls(first,'writer-v1050-result-target');
 assert.equal(targets.length,2);
 assert.deepEqual(targets.map(n=>n.children[0].textContent),['Barra de formatação','Extended Syntax']);
 assert.equal(targets[0].attributes.role,'button');
 assert.equal(targets[0].attributes.tabindex,'0');
 let prevented=false;
 targets[0].listeners.keydown({key:'Enter',preventDefault:()=>{prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(opened[0],'formatToolbar');
 targets[1].listeners.click();
 assert.equal(opened[1],'extendedSyntax');
});
test('empty query hides results and keeps settings untouched',()=>{
 const root=new FakeNode('div'),panel=new FakeNode('div');
 const result=api.writerWorkspaceBindSearch(root,[['general','Geral']],
  ()=>{},()=>panel,()=>'general');
 const input=cls(root,'writer-v901-search-field')[0].children.find(n=>n.tag==='input');
 input.value='xyz';result.update();
 assert.equal(cls(root,'writer-v1050-results')[0].hidden,false);
 input.value='';result.update();
 const panelResult=cls(root,'writer-v1050-results')[0];
 assert.equal(panelResult.hidden,true);
 assert.equal(panelResult.children.length,0);
});
test('results have self-contained layouts, independent of legacy button and panel selectors',()=>{
 const start=css.indexOf('/* 10.4.10: self-contained settings search results.');
 assert.ok(start>=0);
 const styles=css.slice(start);
 assert.match(styles,/\.writer-v1050-settings-search \.writer-v1050-result-group/);
 assert.match(styles,/display:flex;flex-direction:column/);
 assert.match(styles,/\.writer-v1050-result-target:focus-visible/);
 assert.match(styles,/\.writer-v1050-results\[hidden\]\{display:none/);
 assert.doesNotMatch(styles,/\.dictionary-settings-panel|button\.writer-v1048/);
 assert.doesNotMatch(search,/createEl\('button',\{cls:'writer-v1048-search-result'/);
 assert.doesNotMatch(styles,/:has\s*\(|!important\b/);
 assert.doesNotMatch(css,/\/\* A search result is a full-width list row/);
});
