'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/v11/longform-studio.js','utf8');
function load(keys,extras={}){
 const ctx={console,Map,Set,Date,Number,Math,String,Object,Array,
  writerUi:(pt,en)=>pt,...extras};
 return vm.runInNewContext(source+'\n({'+keys.join(',')+'})',ctx);
}
test('v11 preserves Markdown structure when creating a clean compilation',()=>{
 const f=load(['writerV11Words','writerV11CleanMarkdown','writerV11SearchExcerpt']);
 assert.equal(f.writerV11Words('---\ntitle: X\n---\nOlá mundo\n\nOutro texto'),4);
 assert.equal(f.writerV11CleanMarkdown('---\ntitle: X\n---\n\n# Oi'),'# Oi');
 assert.equal(f.writerV11CleanMarkdown('---\ntitle: X\r\n---\r\nbody'),'body');
 assert.match(f.writerV11SearchExcerpt('123456789',3,2),/45/);
});
test('v11 note indexing retains Longform scene order, deduplicates and resolves files',()=>{
 const files=new Map([['Capitulo A',{extension:'md',path:'A.md',basename:'A'}],['Capitulo B',{extension:'md',path:'B.md',basename:'B'}]]);
 const f=load(['writerV11ProjectFiles'],{
  lfFlattenScenes:scenes=>scenes,
  writerBookNavFindSceneFile:(p,scene)=>files.get(scene.title)||null
 });
 const plugin={app:{}};
 const result=f.writerV11ProjectFiles(plugin,{file:{},scenes:[{title:'Capitulo B'},{title:'Capitulo A'},{title:'Capitulo B'}]},20);
 assert.deepEqual(Array.from(result,x=>x.file.path),['B.md','A.md']);
});
test('v11 fails safely on concurrent updates and does not write or snapshot',async()=>{
 let writes=0,snapshots=0;
 class FakeFile{}
 const f=load(['writerV11SaveChapter'],{TFile:FakeFile});
 const plugin={app:{vault:{read:async()=> 'another version',process:async()=>{writes++;}}},writerSnapshots:{config:{enabled:true},create:async()=>{snapshots++;}}};
 await assert.rejects(f.writerV11SaveChapter(plugin,Object.assign(new FakeFile(),{extension:'md'}),'old','new'),/mudou/);
 assert.equal(writes,0);
 assert.equal(snapshots,0);
});
test('v11 saves only exact original text, after snapshot, via vault.process',async()=>{
 class FakeFile{}
 let text='before',snapshots=0;
 const f=load(['writerV11SaveChapter'],{TFile:FakeFile});
 const plugin={app:{vault:{read:async()=>text,process:async(file,fn)=>{text=fn(text);}}},writerSnapshots:{config:{enabled:true},create:async()=>{snapshots++;}}};
 await f.writerV11SaveChapter(plugin,Object.assign(new FakeFile(),{extension:'md'}),'before','after');
 assert.equal(text,'after');assert.equal(snapshots,1);
});
test('v11 has only user-triggered creation and no remote network operations',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|\brequestUrl\s*\(/);
 assert.match(source,/process\(file,current=>/);
 assert.match(source,/writerV11OpenDiagnostics/);
 assert.match(source,/writerV11OpenSearch/);
 assert.match(source,/writerV11OpenRevision/);
});
