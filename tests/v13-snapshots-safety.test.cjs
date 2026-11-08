'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class TFile{constructor(path){this.path=path;this.extension='md';}}
class TFolder{constructor(path){this.path=path;}}
const source=fs.readFileSync('src/v3/snapshots.js','utf8');
const {WriterSnapshots}=vm.runInNewContext(source+'\n({WriterSnapshots})',{
 TFile,writerUi:(pt,en)=>en,writerCurrentText:async(plugin,file)=>plugin.notes.get(file.path),console
});
function harness(){
 const files=new Map(),folders=new Set(),notes=new Map();let saves=0;
 const adapter={
  exists:async path=>files.has(path)||folders.has(path),
  mkdir:async path=>{if(folders.has(path))throw Error('Folder already exists');folders.add(path);},
  read:async path=>{if(!files.has(path))throw Error('Missing '+path);return files.get(path);},
  write:async(path,value)=>{await adapter.beforeWrite?.(path,value);files.set(path,value);},
  remove:async path=>files.delete(path)
 };
 const plugin={notes,app:{vault:{adapter}},settings:{snapshots:{enabled:true,store:'.history',identityMap:{},maxPerNote:50,retentionDays:0,includeAttachments:false}},
  saveSettings:async()=>{saves++;}};
 return {snapshots:new WriterSnapshots(plugin),plugin,adapter,files,notes,get saves(){return saves;}};
}
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}

test('concurrent snapshots keep both index entries and their original contents',async()=>{
 const h=harness(),file=new TFile('Book/Chapter.md');
 await h.snapshots.mkdir(h.snapshots.folder(file));
 const entries=await Promise.all([
  h.snapshots.create(file,'One',{content:'first draft'}),
  h.snapshots.create(file,'Two',{content:'second draft'})
 ]);
 const listed=await h.snapshots.list(file);
 assert.deepEqual(Array.from(listed,x=>x.name),['Two','One']);
 for(let i=0;i<entries.length;i++)assert.equal(await h.snapshots.read(file,entries[i]),['first draft','second draft'][i]);
 assert.equal(h.snapshots.jobs.size,0);
});

test('snapshots of different notes safely share a newly created history root',async()=>{
 const h=harness(),one=new TFile('One.md'),two=new TFile('Two.md');
 const [first,second]=await Promise.all([
  h.snapshots.create(one,'One',{content:'one'}),h.snapshots.create(two,'Two',{content:'two'})
 ]);
 assert.equal(await h.snapshots.read(one,first),'one');
 assert.equal(await h.snapshots.read(two,second),'two');
 assert.equal((await h.snapshots.list(one)).length,1);
 assert.equal((await h.snapshots.list(two)).length,1);
});

test('a queued deletion cannot remove a concurrent addition or resurrect a deleted entry',async()=>{
 const h=harness(),file=new TFile('Chapter.md');
 const first=await h.snapshots.create(file,'One',{content:'one'});
 const [second]=await Promise.all([
  h.snapshots.create(file,'Two',{content:'two'}),h.snapshots.delete(file,first)
 ]);
 const listed=await h.snapshots.list(file);
 assert.deepEqual(Array.from(listed,x=>x.id),[second.id]);
 assert.equal(await h.snapshots.read(file,second),'two');
 await assert.rejects(h.snapshots.read(file,first),/not found/);
});

test('a failed index write does not block subsequent snapshot saves',async()=>{
 const h=harness(),file=new TFile('Chapter.md');let fail=true;
 h.adapter.beforeWrite=path=>{if(fail&&path.endsWith('/manifest.json')){fail=false;throw Error('disk busy');}};
 const failed=h.snapshots.create(file,'Failed',{content:'saved but unindexed'});
 const next=h.snapshots.create(file,'Next',{content:'indexed'});
 await assert.rejects(failed,/disk busy/);
 const entry=await next;
 assert.deepEqual(Array.from(await h.snapshots.list(file),x=>x.name),['Next']);
 assert.equal(await h.snapshots.read(file,entry),'indexed');
 assert.equal(h.snapshots.jobs.size,0);
});

test('renaming a folder preserves child history and autosnapshot cadence without matching sibling prefixes',async()=>{
 const h=harness(),one=new TFile('Book/One.md'),two=new TFile('Book/Sub/Two.md'),other=new TFile('Bookish/Other.md');
 const first=await h.snapshots.create(one,'One',{content:'chapter one'});
 const second=await h.snapshots.create(two,'Two',{content:'chapter two'});
 const unrelated=await h.snapshots.create(other,'Other',{content:'unrelated'});
 const ids={...h.plugin.settings.snapshots.identityMap};
 h.snapshots.lastAuto.set(one.path,1234);h.snapshots.lastAuto.set(other.path,5678);
 const saves=h.saves;
 await h.snapshots.onRename(new TFolder('Library/Renamed'),'Book');
 one.path='Library/Renamed/One.md';two.path='Library/Renamed/Sub/Two.md';
 assert.equal(h.snapshots.identity(one),ids['Book/One.md']);
 assert.equal(h.snapshots.identity(two),ids['Book/Sub/Two.md']);
 assert.equal(h.snapshots.identity(other),ids[other.path]);
 assert.equal(h.plugin.settings.snapshots.identityMap['Book/One.md'],undefined);
 assert.equal(h.snapshots.lastAuto.get(one.path),1234);
 assert.equal(h.snapshots.lastAuto.has('Book/One.md'),false);
 assert.equal(h.snapshots.lastAuto.get(other.path),5678);
 assert.equal(h.saves,saves+1);
 assert.equal(await h.snapshots.read(one,first),'chapter one');
 assert.equal(await h.snapshots.read(two,second),'chapter two');
 assert.equal(await h.snapshots.read(other,unrelated),'unrelated');
});

test('a folder rename during a save keeps the same queue and snapshot identity',async()=>{
 const h=harness(),file=new TFile('Book/One.md'),started=deferred(),continueSave=deferred();let held=false;
 h.adapter.beforeWrite=async path=>{
  if(!held&&path.endsWith('/manifest.json')){held=true;started.resolve();await continueSave.promise;}
 };
 const first=h.snapshots.create(file,'Before rename',{content:'one'});
 await started.promise;
 const id=h.snapshots.identity(file);
 await h.snapshots.onRename(new TFolder('Renamed'),'Book');file.path='Renamed/One.md';
 const second=h.snapshots.create(file,'After rename',{content:'two'});
 continueSave.resolve();await Promise.all([first,second]);
 assert.equal(h.snapshots.identity(file),id);
 assert.deepEqual(Array.from(await h.snapshots.list(file),x=>x.name),['After rename','Before rename']);
 assert.equal((await h.snapshots.manifest(file)).notePath,file.path);
});
