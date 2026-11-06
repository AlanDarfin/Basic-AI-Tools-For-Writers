'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('src/v11/database-builder.js','utf8');
const prev=fs.readFileSync('src/v11/database-workflow.js','utf8');
const load=keys=>vm.runInNewContext(prev+'\n'+code+'\n({'+keys.join(',')+'})',{String,Number,Math,Set,Array,Object,
 writerV1011NotionSpec:text=>{
  const o={folder:'',columns:['file','status'],view:'table'};
  for(const line of text.split('\n')){const m=/^(\w+): (.+)$/.exec(line);if(m)o[m[1]]=m[1]==='columns'?m[2].split(', '):m[2];}
  return o;
 }});
test('Notion visual builder validates folder paths and filter syntax',()=>{
 const f=load(['writerV111DbFolder','writerV111DbBuilderNormalize']);
 assert.equal(f.writerV111DbFolder('../Secrets'),'');
 assert.equal(f.writerV111DbFolder('.hidden'),'');
 assert.equal(f.writerV111DbFolder('Histórias/Capítulos'),'Histórias/Capítulos');
 const spec=f.writerV111DbBuilderNormalize({folder:'Notes',filter:'status contains Doing',view:'board',columns:'file,status,status,bad name'});
 assert.equal(spec.filter,'status contains Doing');
 assert.deepEqual(Array.from(spec.columns),['file','status']);
 const bad=f.writerV111DbBuilderNormalize({folder:'Notes',filter:'x: y\nview: unsafe'});
 assert.equal(bad.filter,'');
});
test('Notion builder produces a complete readable Markdown view and supports round trip',()=>{
 const f=load(['writerV111DbBuilderBlock','writerV111DbBuilderFromSelection']);
 const block=f.writerV111DbBuilderBlock({folder:'Databases/Tasks',view:'calendar',columns:'file, due',date:'due',order:'desc'});
 assert.match(block,/^~~~basic-suite-db\nfolder: Databases\/Tasks/);
 assert.match(block,/date: due/);
 assert.match(block,/order: desc/);
 const re=f.writerV111DbBuilderFromSelection(block);
 assert.equal(re.folder,'Databases/Tasks');
 assert.equal(re.date,'due');
 assert.equal(re.view,'calendar');
});
test('Visual builder is explicitly user-triggered and never writes vault directly',()=>{
 assert.doesNotMatch(code,/vault\.(?:modify|create|process)\s*\(/);
 assert.match(code,/editor\.replaceSelection/);
});
