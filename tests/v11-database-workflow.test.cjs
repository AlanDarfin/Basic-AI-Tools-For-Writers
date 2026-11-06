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
test('v11 database helpers do not fetch content from network',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|\brequestUrl\s*\(/);
});
