'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class TFile{constructor(path){this.path=path;this.extension='md';}}
const core=fs.readFileSync('src/v3/core.js','utf8');
const helpers=core.slice(core.indexOf('function writerActiveEditor('),core.indexOf('function writerOffsetToPos('));
const source=fs.readFileSync('src/v3/snapshots.js','utf8');
const {WriterSnapshots}=vm.runInNewContext(helpers+'\n'+source+'\n({WriterSnapshots})',{
 TFile,writerUi:(_pt,en)=>en,console
});
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}
function harness(open=true){
 const file=new TFile('Book/Chapter.md'),files=new Map(),folders=new Set(),notes=new Map([[file.path,'Current manuscript']]);
 const targets=new Map([[file.path,file]]);
 const editor={text:'Current manuscript',writes:[],getValue(){return this.text;},setValue(value){this.writes.push(value);this.text=value;}};
 const view={file,editor,getMode:()=> 'source'},leaf={view};
 const leaves=open?[leaf]:[];
 const adapter={
  exists:async path=>files.has(path)||folders.has(path),
  mkdir:async path=>{folders.add(path);},
  read:async path=>{if(!files.has(path))throw Error('Missing '+path);return files.get(path);},
  write:async(path,value)=>{await adapter.beforeWrite?.(path,value);files.set(path,value);},
  remove:async path=>{files.delete(path);}
 };
 const workspace={activeLeaf:open?leaf:null,getLeavesOfType:()=>leaves};
 const vault={adapter,getAbstractFileByPath:path=>targets.get(path)||null,read:async target=>notes.get(target.path),
  process:async(target,update)=>{await vault.beforeProcess?.();notes.set(target.path,update(notes.get(target.path)));}};
 const plugin={app:{vault,workspace},settings:{snapshots:{enabled:true,store:'.history',identityMap:{},maxPerNote:50,retentionDays:0,includeAttachments:false}},saveSettings:async()=>{}};
 const snapshots=new WriterSnapshots(plugin);
 const holdBackup=()=>{
  const started=deferred(),release=deferred();let held=false;
  adapter.beforeWrite=async path=>{
   if(!held&&path.endsWith('.md')){held=true;started.resolve();await release.promise;}
  };
  return {started:started.promise,release:release.resolve};
 };
 return {file,files,notes,targets,editor,view,leaf,leaves,workspace,vault,adapter,plugin,snapshots,holdBackup};
}
async function savedVersion(h){return h.snapshots.create(h.file,'Saved version',{content:'Earlier version'});}
async function assertVersionsPreserved(h,entry){
 assert.equal(await h.snapshots.read(h.file,entry),'Earlier version');
 const entries=await h.snapshots.list(h.file);
 const backup=entries.find(item=>item.name==='Before restoring Saved version');
 assert.ok(backup,'pre-restore backup remains available after cancellation');
 assert.equal(await h.snapshots.read(h.file,backup),'Current manuscript');
}

test('snapshot restore preserves prose typed while the pre-restore backup is written',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 h.editor.text='Current manuscript plus newer prose';backup.release();
 await assert.rejects(restoring,/edits were preserved/);
 assert.equal(h.editor.text,'Current manuscript plus newer prose');assert.deepEqual(h.editor.writes,[]);
 assert.equal(h.notes.get(h.file.path),'Current manuscript');
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore refuses a replacement editor even when its text matches the backed-up version',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 const replacement={text:'Current manuscript',writes:[],getValue(){return this.text;},setValue(text){this.writes.push(text);this.text=text;}};
 h.view.editor=replacement;backup.release();
 await assert.rejects(restoring,/editor changed/);
 assert.deepEqual(replacement.writes,[]);assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore does not write into an editor reused for another note',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 h.view.file=new TFile('Other.md');h.editor.text='Other manuscript';backup.release();
 await assert.rejects(restoring,/editor changed/);
 assert.equal(h.editor.text,'Other manuscript');assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore cancels when the target note moves while the backup is pending',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 await h.snapshots.onRename({path:'Renamed'},'Book');
 h.file.path='Renamed/Chapter.md';backup.release();
 await assert.rejects(restoring,/note or editor changed/);
 assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore preserves disk edits made while the pre-restore backup is written',async()=>{
 const h=harness(false),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 h.notes.set(h.file.path,'External manuscript revision');backup.release();
 await assert.rejects(restoring,/edits were preserved/);
 assert.equal(h.notes.get(h.file.path),'External manuscript revision');
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore refuses a deleted note replaced by a different file at the same path',async()=>{
 for(const open of [true,false]){
  const h=harness(open),entry=await savedVersion(h),backup=h.holdBackup();
  const restoring=h.snapshots.restore(h.file,entry);await backup.started;
  const replacement=new TFile(h.file.path);h.targets.set(h.file.path,replacement);
  h.notes.set(replacement.path,'Replacement manuscript');backup.release();
  await assert.rejects(restoring,/note or editor changed/);
  assert.equal(h.notes.get(replacement.path),'Replacement manuscript');
  assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
  await assertVersionsPreserved(h,entry);
 }
});

test('editor snapshot restore also preserves external disk edits made during the backup',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 h.notes.set(h.file.path,'External revision while editor still shows its old text');backup.release();
 await assert.rejects(restoring,/edits were preserved/);
 assert.equal(h.notes.get(h.file.path),'External revision while editor still shows its old text');
 assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore preserves an independent draft in another open pane',async()=>{
 const h=harness(),entry=await savedVersion(h);
 const other={text:'Independent unsaved prose',writes:[],getValue(){return this.text;},setValue(value){this.writes.push(value);this.text=value;}};
 h.leaves.push({view:{file:h.file,editor:other,getMode:()=> 'source'}});
 await assert.rejects(h.snapshots.restore(h.file,entry),/edits were preserved/);
 assert.equal(other.text,'Independent unsaved prose');assert.deepEqual(other.writes,[]);
 assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
 assert.equal(h.notes.get(h.file.path),'Current manuscript');
 assert.equal((await h.snapshots.list(h.file)).length,1);
});

test('snapshot restore preserves new prose entered in another pane during the backup',async()=>{
 const h=harness(),entry=await savedVersion(h),backup=h.holdBackup();
 const other={text:'Current manuscript',getValue(){return this.text;}};
 h.leaves.push({view:{file:h.file,editor:other,getMode:()=> 'source'}});
 const restoring=h.snapshots.restore(h.file,entry);await backup.started;
 other.text='Other pane gains new prose';backup.release();
 await assert.rejects(restoring,/edits were preserved/);
 assert.equal(other.text,'Other pane gains new prose');
 assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore rechecks editor prose after the final asynchronous disk read',async()=>{
 const h=harness(),entry=await savedVersion(h);let reads=0;
 h.vault.read=async file=>{
  if(++reads===2)h.editor.text='Prose typed during the final disk check';
  return h.notes.get(file.path);
 };
 await assert.rejects(h.snapshots.restore(h.file,entry),/edits were preserved/);
 assert.equal(h.editor.text,'Prose typed during the final disk check');assert.deepEqual(h.editor.writes,[]);
 await assertVersionsPreserved(h,entry);
});

test('snapshot restore compares disk content atomically even when pre-restore backups are disabled',async()=>{
 const h=harness(false),entry=await savedVersion(h),started=deferred(),release=deferred();
 h.plugin.settings.snapshots.snapshotBeforeRestore=false;
 h.vault.beforeProcess=async()=>{started.resolve();await release.promise;};
 const restoring=h.snapshots.restore(h.file,entry);await started.promise;
 h.notes.set(h.file.path,'Revision before atomic replacement');release.resolve();
 await assert.rejects(restoring,/edits were preserved/);
 assert.equal(h.notes.get(h.file.path),'Revision before atomic replacement');
 assert.equal((await h.snapshots.list(h.file)).length,1);
 assert.equal(await h.snapshots.read(h.file,entry),'Earlier version');
});

test('snapshot restore refuses a new editor opened while a disk replacement is queued',async()=>{
 const h=harness(false),entry=await savedVersion(h),started=deferred(),release=deferred();
 h.vault.beforeProcess=async()=>{started.resolve();await release.promise;};
 const restoring=h.snapshots.restore(h.file,entry);await started.promise;
 h.leaves.push(h.leaf);h.workspace.activeLeaf=h.leaf;h.editor.text='New unsaved editor prose';release.resolve();
 await assert.rejects(restoring,/editor changed/);
 assert.equal(h.editor.text,'New unsaved editor prose');assert.deepEqual(h.editor.writes,[]);
 assert.equal(h.notes.get(h.file.path),'Current manuscript');
 await assertVersionsPreserved(h,entry);
});

test('unchanged editor and disk restores still retain the previous manuscript as a backup',async()=>{
 for(const open of [true,false]){
  const h=harness(open),entry=await savedVersion(h);
  const result=await h.snapshots.restore(h.file,entry);
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{restored:0,skipped:0});
  assert.equal(open?h.editor.text:h.notes.get(h.file.path),'Earlier version');
  await assertVersionsPreserved(h,entry);
 }
});

test('editor restore supports unsaved prose when disk text is stable and ignores preview-only buffers',async()=>{
 const h=harness(),entry=await savedVersion(h);
 h.editor.text='Unsaved current manuscript';
 h.leaves.push({view:{file:h.file,editor:{getValue:()=> 'Stale preview text'},getMode:()=> 'preview'}});
 await h.snapshots.restore(h.file,entry);
 assert.equal(h.editor.text,'Earlier version');
 const backup=(await h.snapshots.list(h.file)).find(item=>item.name==='Before restoring Saved version');
 assert.ok(backup);assert.equal(await h.snapshots.read(h.file,backup),'Unsaved current manuscript');
 assert.equal(h.notes.get(h.file.path),'Current manuscript');
});

test('a failed pre-restore backup leaves the current manuscript and saved version untouched',async()=>{
 const h=harness(),entry=await savedVersion(h);
 h.adapter.beforeWrite=()=>{throw Error('History disk unavailable');};
 await assert.rejects(h.snapshots.restore(h.file,entry),/History disk unavailable/);
 assert.equal(h.editor.text,'Current manuscript');assert.deepEqual(h.editor.writes,[]);
 assert.equal(await h.snapshots.read(h.file,entry),'Earlier version');
});
