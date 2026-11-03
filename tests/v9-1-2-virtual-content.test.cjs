'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const source=read('src/v9/virtual-content.js');
const nav=read('src/v6/longform-navigation.js');
class TFile{
 constructor(path){this.path=path;this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.extension='md';this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
const book=new TFile('Novel/Scenes/Chapter 1.md');
const side=new TFile('Novel/Scenes/Sub/Scene A.md');
const other=new TFile('Unrelated.md');
const cacheA={frontmatter:{status:'draft',genre:['fiction','fantasy'],owner:{team:'writing'},tags:['book/chapter']},tags:[{tag:'#writing/scene'}]};
const app={
 vault:{
  getAbstractFileByPath(path){return [book,side,other].find(f=>f.path===path)||null;},
  getMarkdownFiles(){return [book,side,other];}
 },
 metadataCache:{
  getFileCache(file){return file===book?cacheA:{frontmatter:{},tags:[]};}
 }
};
const context={
 console,TFile,Map,Set,URL,Date,RegExp,String,Number,Array,Object,Math,
 writerUi:(pt,en)=>en,
 writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
 ItemView:class{},
 Setting:class{},
 Modal:class{},
 MarkdownRenderer:{render:async()=>{}},
 require:()=>({Component:class{load(){}unload(){}}})
};
const api=vm.runInNewContext(nav+'\n'+source+'\n({writerV912VirtualMerge,writerV912VirtualCondition,writerV912VirtualMatch,writerV912VirtualRule,writerV912VirtualTags,writerV912VirtualResolve,writerV912VirtualSubstitute,writerV912HasBookNavRule,writerBookNavAutoAllowed,writerBookNavHasSourceBlock})',context);
const rule=(obj={})=>api.writerV912VirtualRule({name:'Example',conditions:[{type:'folder',value:'Novel/Scenes'}],...obj},0);
test('v9.1.2 manifest, lockfile, modular source, compiled bundle, CSS and documentation agree',()=>{
 const manifest=JSON.parse(read('manifest.json')),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),versions=JSON.parse(read('versions.json'));
 for(const x of [pkg.version,lock.version,lock.packages[''].version])assert.equal(x,manifest.version);
 assert.match(manifest.version,/^9\.(?:1|2)\.[0-9]+$/);
 assert.equal(versions[manifest.version],'1.11.4');
 const main=read('main.js');
 assert.match(main,/\/\/ v3 module: src\/v9\/virtual-content\.js/);
 assert.match(main,/writerV912VirtualRegister\(this\)/);
 assert.match(main,/writerV912VirtualMerge\(this\.settings\)/);
 assert.match(main,/WRITER_V912_VIRTUAL_VIEW/);
 assert.match(read('scripts/build-v3.js'),/'v9\/virtual-content'/);
 assert.match(read('styles.css'),/writer-v912-virtual-block/);
 assert.match(read('scripts/build-css.js'),/v9-1-2-virtual-content\.css/);
 for(const doc of ['README.md','docs/README.pt-BR.md']){
  const text=read(doc);
  assert.match(text,new RegExp(manifest.version.replace(/\./g,'\\.')));
  assert.match(text,/Virtual Content|Conteúdo virtual/);
  assert.match(text,/BookNav/);
  assert.doesNotMatch(text,/^## (What's new|Novidades da)/m);
 }
});
test('migration is idempotent, does not delete older BookNav settings, clamps rules',()=>{
 const settings={bookNavigation:{enabled:true,auto:false},v912Virtual:{enabled:false,rules:[
  {id:'same',name:'A',source:'booknav',location:'footer',conditions:[{type:'all'}]},
  {id:'same',name:'B',source:'file',file:'foo.md'}
 ]}};
 api.writerV912VirtualMerge(settings);api.writerV912VirtualMerge(settings);
 assert.equal(settings.v912Virtual.enabled,false);
 assert.equal(settings.v912Virtual.rules.length,1);
 assert.equal(settings.bookNavigation.auto,false);
 const defaults=api.writerV912VirtualMerge({});assert.equal(defaults.autoBookNav,true);
 assert.equal(defaults.rules.length,0);
});
test('folder matches are anchored, recursive setting excludes siblings and unrelated directories',()=>{
 const recursive=rule({conditions:[{type:'folder',value:'Novel/Scenes',recursive:true}]});
 assert.equal(api.writerV912VirtualMatch(recursive,book,cacheA),true);
 assert.equal(api.writerV912VirtualMatch(recursive,side,{}),true);
 assert.equal(api.writerV912VirtualMatch(recursive,other,{}),false);
 const exact=rule({conditions:[{type:'folder',value:'Novel/Scenes',recursive:false}]});
 assert.equal(api.writerV912VirtualMatch(exact,book,cacheA),true);
 assert.equal(api.writerV912VirtualMatch(exact,side,{}),false);
});
test('tags, property values, nested properties, negated and AND/OR conditions',()=>{
 const all=rule({conditions:[
  {type:'tag',value:'writing',recursive:true},
  {type:'property',property:'status',value:'draft',operator:'equals'},
  {type:'property',property:'owner.team',value:'writ',operator:'contains'},
  {type:'property',property:'status',value:'done',negate:true}
 ],match:'all'});
 assert.equal(api.writerV912VirtualMatch(all,book,cacheA),true);
 assert.equal(api.writerV912VirtualMatch(all,other,{}),false);
 const some=rule({conditions:[
  {type:'tag',value:'missing'}, {type:'property',property:'genre',value:'fantasy'}
 ],match:'any'});
 assert.equal(api.writerV912VirtualMatch(some,book,cacheA),true);
 const not=rule({conditions:[{type:'property',property:'missing',operator:'exists',negate:true}]});
 assert.equal(api.writerV912VirtualMatch(not,book,cacheA),true);
 const anyTag=Array.from(api.writerV912VirtualTags(cacheA));
 assert.ok(anyTag.includes('writing/scene'));
 assert.ok(anyTag.includes('book/chapter'));
});
test('virtual template expansion never modifies original Markdown, does not resolve a note as its own template',async()=>{
 const settings={v912Virtual:{rules:[]}};
 const plugin={app:{...app,vault:{...app.vault,cachedRead:async()=>'> Template {{file.name}}'}}};
 const original='**{{file.name}}** from {{file.folder}} / {{file.path}}';
 assert.equal(api.writerV912VirtualSubstitute(original,book),'**Chapter 1** from Novel/Scenes / Novel/Scenes/Chapter 1.md');
 assert.equal(original.includes('{{file.name}}'),true);
 const txt=await api.writerV912VirtualResolve(plugin,rule({source:'text',text:original}),book);
 assert.equal(txt.kind,'markdown');
 assert.equal(txt.sourcePath,book.path);
 assert.match(txt.content,/Chapter 1/);
 const own=await api.writerV912VirtualResolve(plugin,rule({source:'file',file:book.path}),book);
 assert.equal(own,null);
 const missing=await api.writerV912VirtualResolve(plugin,rule({source:'file',file:'Missing.md'}),book);
 assert.equal(missing,null);
});
test('automatic BookNav respects existing manual blocks, project override, module off and matching virtual position',()=>{
 const match={index:{file:{path:'Novel/Index.md'}}};
 const base={bookNavigation:{enabled:true,auto:false},v912Virtual:{enabled:true,autoBookNav:true,rules:[]},
  visibleModules:{virtualContent:true,bookNavigation:true},projectsData:{}};
 const plugin={app,settings:base};
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),true);
 assert.equal(api.writerBookNavHasSourceBlock('~~~longform-nav\n~~~'),true);
 assert.equal(api.writerBookNavHasSourceBlock('ordinary paragraph'),false);
 plugin.settings.projectsData['Novel/Index.md']={writingSettings:{navigation:'off'}};
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),false);
 plugin.settings.projectsData['Novel/Index.md']={writingSettings:{navigation:'on'}};
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),true);
 plugin.settings.projectsData={};
 plugin.settings.v912Virtual.rules=[rule({source:'booknav',location:'header'})];
 assert.equal(api.writerV912HasBookNavRule(plugin,book.path),true);
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),false);
 plugin.settings.v912Virtual.rules=[];
 plugin.settings.visibleModules.virtualContent=false;
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),false);
 plugin.settings.bookNavigation.auto=true;
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),true);
 plugin.settings.visibleModules.bookNavigation=false;
 assert.equal(api.writerBookNavAutoAllowed(plugin,match,book.path),false);
});
test('rule limits, location guards and sources never execute JavaScript or write to files',()=>{
 const cfg=api.writerV912VirtualMerge({v912Virtual:{rules:Array.from({length:75},(_,i)=>({id:'r'+i,conditions:[{type:'all'}]}))}});
 assert.equal(cfg.rules.length,40);
 const invalid=rule({source:'javascript',location:'other',text:'Hello'});
 assert.equal(invalid.source,'text');assert.equal(invalid.location,'footer');
 assert.doesNotMatch(source,/vault\.modify\(|vault\.process\(|vault\.create\(/);
 assert.match(source,/MarkdownRenderer\.render/);
 assert.match(source,/writerV912VirtualSectionTarget/);
 assert.match(source,/enable|enabled/);
});
