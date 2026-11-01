'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const css=fs.readFileSync('styles.css','utf8');
const nav=fs.readFileSync('src/v6/longform-navigation.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const layer=css.slice(css.indexOf('Basic AI v6.0.0 | One visual language'));
test('the final unified layer covers ALL plugin settings, tools, projects and dialogs',()=>{
 assert.ok(layer.length>10000,'No broad visual overhaul found');
 for(const selector of [
  '.dictionary-view-content','.writer-tool-root','.writer-tools-v3','.writer-project-root',
  '.dictionary-settings-panel','.dictionary-writer-modal','.writer-v4-diff-modal',
  '.writer-unicode-modal','.writer-v6-lint-modal','.writer-v6-smart-insert',
  '.writer-abbr-add','.writer-abbr-list','.writer-lt-explanation',
  '.writer-project-scene','.writer-project-metadata','.writer-v6-project-prefs',
  '.writer-review-card','.writer-tools-v3-actions','.writer-project-notes-toolbar'
 ])assert.ok(layer.includes(selector),'Missing final visual scope '+selector);
 assert.ok(layer.includes('setting-item.writer-setting-toggle'));
 assert.ok(layer.includes('setting-item.writer-setting-textarea'));
 assert.ok(layer.includes('setting-item.writer-setting-field'));
 assert.ok(main.includes("row.classList.toggle('writer-setting-field'"));
});
test('Longform rows do not clip titles and use container rather than viewport width',()=>{
 assert.ok(layer.includes('container:writer-booknav / inline-size'));
 assert.ok(layer.includes('@container writer-booknav (min-width:680px)'));
 assert.match(layer,/\.writer-v6-booknav \.writer-v6-booknav-list\s*\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
 assert.match(layer,/\.writer-v6-booknav \.writer-v6-booknav-title\s*\{[\s\S]*?white-space:normal;[\s\S]*?overflow:visible;[\s\S]*?overflow-wrap:anywhere;/);
 assert.ok(nav.includes("root.createDiv({cls:'writer-v6-booknav-heading'})"));
 assert.ok(nav.includes("root.createDiv({cls:'writer-v6-booknav-list'})"));
 assert.doesNotMatch(layer,/!important\b|:has\s*\(|column-gap\s*:/);
});
class Node{
 constructor(tag,options={}){
  this.tag=tag;this.cls=options.cls||'';this.text=options.text||'';
  this.children=[];this.attributes={};this.events={};
 }
 createDiv(options){const node=new Node('div',options);this.children.push(node);return node;}
 createEl(tag,options){const node=new Node(tag,options);this.children.push(node);return node;}
 createSpan(options){const node=new Node('span',options);this.children.push(node);return node;}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(name,fn){this.events[name]=fn;}
}
test('a real long chapter title remains in the DOM in both navigation directions',()=>{
 const runner=vm.runInNewContext(nav+'\n({writerBookNavRenderButtons})',{
  writerUi:(pt,en)=>pt,TFile:class TFile{},console
 });
 const root=new Node('section');
 const app={vault:{getAbstractFileByPath:()=>null},workspace:{getLeaf:()=>({openFile:()=>{}})}};
 assert.equal(runner.writerBookNavRenderButtons(root,app,[
  {kind:'main',direction:'next',target:{path:'Book/C1.md',title:'Capítulo 1 - É Assim Que Tudo Começa'}},
  {kind:'sub',direction:'next',target:{path:'Book/Sub.md',title:'Sinopse'}}
 ]),true);
 const navRoot=root.children[0];
 assert.ok(navRoot.cls.includes('writer-v6-booknav'));
 assert.equal(navRoot.attributes.role,'navigation');
 assert.equal(navRoot.children.length,2);
 const list=navRoot.children[1];
 assert.equal(list.children.length,2);
 const item=list.children[0];
 assert.equal(item.attributes['aria-label'],'Próximo capítulo: Capítulo 1 - É Assim Que Tudo Começa');
 assert.equal(item.children[1].children[1].text,'Capítulo 1 - É Assim Que Tudo Começa');
});
test('stable version, translations and built bundle stay synchronized',()=>{
 const manifest=require('../manifest.json'),pkg=require('../package.json'),versions=require('../versions.json');
 assert.equal(manifest.version,'6.0.0');assert.equal(pkg.version,manifest.version);
 assert.equal(versions[manifest.version],manifest.minAppVersion);
 assert.match(main,/function writerBookNavRenderButtons/);
 assert.match(main,/writerV6ProjectPreferencesRender/);
 assert.match(main,/WriterV6SmartInsert/);
 const en=fs.readFileSync('README.md','utf8'),pt=fs.readFileSync('docs/README.pt-BR.md','utf8');
 assert.match(en,/\*\*Latest stable:\*\* \[6\.0\.0\]/);
 assert.match(pt,/\*\*Versão atual:\*\* 6\.0\.0/);
 assert.match(en,/chapter and subchapters|chapters and subchapters|chapters\/subchapters/);
 assert.match(pt,/capítulos e subcapítulos/);
 for(const path of ['docs/V6_RELEASE.en.md','docs/V6_RELEASE.pt-BR.md'])
  assert.ok(fs.readFileSync(path,'utf8').includes('6.0.0'));
});
