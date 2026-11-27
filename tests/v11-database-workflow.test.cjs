'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v11/database-workflow.js','utf8');
const load=(names,extra={})=>vm.runInNewContext(source+'\n({'+names.join(',')+'})',
 {writerUi:(pt,en)=>pt,Number,String,Array,Set,Object,...extra});
test('v11 safely parses typed properties and forbids prototype or file keys',()=>{
 const f=load(['writerV11DbPropertyKey','writerV11DbValue'],{writerV1011NotionDate:x=>/^\d{4}-\d{2}-\d{2}$/.test(x)?x:''});
 assert.equal(f.writerV11DbPropertyKey('__proto__'),'');
 assert.equal(f.writerV11DbPropertyKey('status'),'status');
 assert.equal(f.writerV11DbPropertyKey('file'),'');
 assert.equal(f.writerV11DbValue('number','3.5'),3.5);
 assert.throws(()=>f.writerV11DbValue('number','NaN'));
 assert.equal(f.writerV11DbValue('checkbox','true'),true);
 assert.deepEqual(Array.from(f.writerV11DbValue('tags','fiction, fiction,characters')),['fiction','characters']);
 assert.throws(()=>f.writerV11DbValue('date','invalid'));
});
test('v11 board movement snapshots before changing frontmatter',async()=>{
 let props={status:'Backlog'},saved=false;
 const f=load(['writerV11DbChangeGroup','writerV11DbPropertyKey']);
 const plugin={
  settings:{v107Db:{editable:true}},
  app:{metadataCache:{getFileCache:()=>({frontmatter:{status:'Backlog'}})},fileManager:{
   processFrontMatter:async(file,fn)=>{fn(props);}
  }},
  writerSnapshots:{config:{enabled:true},create:async()=>{saved=true;}}
 };
 const ok=await f.writerV11DbChangeGroup(plugin,{file:{},data:{status:'Backlog'}},'status','Done');
 assert.equal(ok,true);assert.equal(saved,true);assert.equal(props.status,'Done');
});
test('v11 board movement refuses concurrent modifications',async()=>{
 const f=load(['writerV11DbChangeGroup','writerV11DbPropertyKey']);
 const plugin={settings:{v107Db:{editable:true}},app:{
  metadataCache:{getFileCache:()=>({frontmatter:{status:'Changed'}})},
  fileManager:{processFrontMatter:async()=>{throw Error('must not run')}}
 }};
 await assert.rejects(f.writerV11DbChangeGroup(plugin,{file:{},data:{status:'Backlog'}},'status','Done'),/mudou/);
});
test('database board movements retain the active view and query and refresh the moved card',async()=>{
 class Element{
  constructor(tag,opts={}){this.tag=tag;this.opts=opts;this.children=[];this.events={};this.value='';}
  createEl(tag,opts){const child=new Element(tag,opts);this.children.push(child);return child;}
  createDiv(opts){return this.createEl('div',opts);}
  setText(text){this.opts.text=text;}
  addEventListener(name,callback){this.events[name]=callback;}
  empty(){this.children=[];}
  descendants(){return this.children.flatMap(node=>[node,...node.descendants()]);}
 }
 const render=vm.runInNewContext(['src/blocks/data-tables.js','src/v10/suite-notion-1011.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n')+
  '\n'+source+'\nwriterV1011NotionRender',{writerUi:(_pt,en)=>en,Notice:class{constructor(message){assert.fail(message);}}});
 const files=['Alpha','Atlas','Amber'].map(basename=>({basename,path:'Deck/'+basename+'.md'}));
 const props=new Map([[files[0],{status:'Draft'}],[files[1],{status:'Done'}],[files[2],{}]]);
 const root=new Element('div'),plugin={settings:{v107Db:{editable:true},v1011Notion:{allowNew:false}},app:{
  vault:{getMarkdownFiles:()=>files},metadataCache:{getFileCache:file=>({frontmatter:props.get(file)})},
  fileManager:{processFrontMatter:async(file,update)=>update(props.get(file))}
 }};
 render(plugin,'folder: /Deck/\ncolumns: file, status',root,{});
 const view=root.descendants().find(el=>el.tag==='select'),query=root.descendants().find(el=>el.tag==='input');
 view.value='board';view.events.change();
 query.value='a';query.events.input();
 const findControl=name=>root.descendants().find(el=>el.opts.attr?.['aria-label']==='Move card: '+name);
 const control=findControl('Alpha');
 control.value='Done';await control.events.change();
 assert.equal(props.get(files[0]).status,'Done');
 assert.equal(findControl('Alpha').value,'Done');
 assert.equal(view.value,'board');assert.equal(query.value,'a');
 const ungrouped=root.descendants().find(el=>el.opts.cls==='writer-v1011-notion-lane'&&el.children[0].opts.text.startsWith('Ungrouped'));
 ungrouped.events.drop({dataTransfer:{getData:()=>`basic-v11:${files[0].path}`},preventDefault(){}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(props.get(files[0]).status,'');
 assert.equal(findControl('Alpha').value,'');
 assert.equal(view.value,'board');assert.equal(query.value,'a');
});
test('v11 database helpers do not fetch content from network',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|\brequestUrl\s*\(/);
});
