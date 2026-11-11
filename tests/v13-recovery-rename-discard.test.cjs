'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/draft-recovery.js','utf8');
const DIR='.obsidian/plugins/basic-ai-tool-for-writers';
const PRIMARY=DIR+'/longform-recovery.json',PREVIOUS=DIR+'/longform-recovery.previous.json';
const entry=(path,text)=>({path,original:'Original '+text,text,updatedAt:'2026-01-01T10:00:00.000Z'});
const encode=entries=>JSON.stringify({version:1,entries});
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}
function harness(options={}){
 const files=options.files||new Map([[PRIMARY,encode(options.entries||[])]]),folders=new Set(),timers=new Map();let serial=0;
 const adapter={
  exists:async path=>files.has(path)||folders.has(path),
  read:async path=>{await options.beforeRead?.(path);if(!files.has(path))throw Error('Missing '+path);return files.get(path);},
  mkdir:async path=>{folders.add(path);},
  write:async(path,value)=>{await adapter.beforeWrite?.(path,value);files.set(path,value);}
 };
 const api=vm.runInNewContext(source+'\n({writerV134Recovery})',{
  writerUi:(_pt,en)=>en,console,setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)
 });
 const plugin={manifest:{id:'basic-ai-tool-for-writers',dir:DIR},settings:{v11Studio:{recoveryEnabled:options.enabled!==false}},
  app:{vault:{adapter,configDir:'.obsidian'}}};
 const store=api.writerV134Recovery(plugin);
 return {files,adapter,plugin,store,timers};
}
const texts=entries=>Array.from(entries,entry=>entry.text).sort();
function assertStores(h,expected){
 for(const path of [PRIMARY,PREVIOUS])assert.deepEqual(texts(JSON.parse(h.files.get(path)).entries),expected.slice().sort(),path);
}
async function assertRestarts(h,expected){
 const resumed=harness({files:new Map(h.files)});await resumed.store.ready;
 assert.deepEqual(texts(resumed.store.list()),expected.slice().sort());await resumed.store.close();
 const damaged=new Map(h.files);damaged.set(PRIMARY,'{damaged');
 const fallback=harness({files:damaged});await fallback.store.ready;
 assert.equal(fallback.store.status.phase,'error');
 assert.deepEqual(texts(fallback.store.list()),expected.slice().sort());await assert.rejects(fallback.store.close());
}
function find(h,path){const found=h.store.list().find(entry=>entry.path===path);assert.ok(found,'draft at '+path);return found;}

test('discard after disabled recovery folder renames removes the original aliases from both stores',async()=>{
 const h=harness({enabled:false,entries:[entry('Book/Sub/A.md','discard me'),entry('Keep.md','keep me')]});await h.store.ready;
 h.store.rename('Book','Temporary');h.store.rename('Temporary','Library/Renamed');
 await h.store.discard(find(h,'Library/Renamed/Sub/A.md'));
 assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
});

test('enabled rename followed by immediate discard cannot resurrect text from the previous copy',async()=>{
 const h=harness({entries:[entry('Book/A.md','discard me'),entry('Keep.md','keep me')]});await h.store.ready;
 h.store.rename('Book/A.md','Renamed.md');await h.store.discard(find(h,'Renamed.md'));
 assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
});

test('renames before recovery loading finishes preserve the persisted identity for later discard',async()=>{
 for(const enabled of [true,false]){
  const started=deferred(),release=deferred();
  const h=harness({enabled,entries:[entry('Book/A.md','discard me'),entry('Keep.md','keep me')],beforeRead:async path=>{
   if(path===PRIMARY){started.resolve();await release.promise;}
  }});
  await started.promise;h.store.rename('Book','Stage');h.store.rename('Stage','Final');release.resolve();await h.store.ready;
  await h.store.discard(find(h,'Final/A.md'));
  assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
 }
});

test('a draft captured and renamed before loading retains ownership of its older disk copy',async()=>{
 const started=deferred(),release=deferred();
 const h=harness({enabled:false,entries:[entry('Book/A.md','older draft'),entry('Keep.md','keep me')],beforeRead:async path=>{
  if(path===PRIMARY){started.resolve();await release.promise;}
 }});
 await started.promise;h.store.capture('Book/A.md','Original older draft','new typing');h.store.rename('Book','Renamed');
 release.resolve();await h.store.ready;
 await h.store.discard(find(h,'Renamed/A.md'));
 assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
});

test('startup rename collisions never associate an orphaned destination with the source discard',async()=>{
 for(const selected of ['Book/A.md','Renamed/A.md'])for(const enabled of [true,false]){
  const started=deferred(),release=deferred();
  const h=harness({enabled,entries:[entry('Book/A.md','source draft'),entry('Renamed/A.md','orphan draft')],beforeRead:async path=>{
   if(path===PRIMARY){started.resolve();await release.promise;}
  }});
  await started.promise;h.store.rename('Book','Renamed');release.resolve();await h.store.ready;
  await h.store.discard(find(h,selected));
  const expected=selected==='Book/A.md'?['orphan draft']:['source draft'];
  assertStores(h,expected);await assertRestarts(h,expected);await h.store.close();
 }
});

test('typing and renaming before load keeps an unknown orphan independent of the moved draft',async()=>{
 for(const reverse of [false,true])for(const enabled of [true,false]){
  const started=deferred(),release=deferred();
  const entries=[entry('Book/A.md','older source'),entry('Renamed/A.md','orphan draft')];if(reverse)entries.reverse();
  const h=harness({enabled,entries,beforeRead:async path=>{
   if(path===PRIMARY){started.resolve();await release.promise;}
  }});
  await started.promise;h.store.capture('Book/A.md','Original older source','new typing');h.store.rename('Book','Renamed');
  release.resolve();await h.store.ready;
  assert.equal(find(h,'Book/A.md').text,'new typing');assert.equal(find(h,'Renamed/A.md').text,'orphan draft');
  await h.store.discard(find(h,'Book/A.md'));
  assertStores(h,['orphan draft']);await assertRestarts(h,['orphan draft']);await h.store.close();
 }
});

test('a reused source path during startup preserves disk copies instead of overwriting a third distinct draft',async()=>{
 const started=deferred(),release=deferred();
 const entries=[entry('Book/A.md','older source'),entry('Renamed/A.md','orphan draft')];
 const h=harness({entries,beforeRead:async path=>{
  if(path===PRIMARY){started.resolve();await release.promise;}
 }});
 await started.promise;h.store.capture('Book/A.md','Original older source','moved typing');h.store.rename('Book','Renamed');
 h.store.capture('Book/A.md','New original','independent typing');release.resolve();await h.store.ready;
 assert.equal(h.store.status.phase,'error');assert.match(h.store.status.error,/Disk recovery was preserved/);
 assert.equal(find(h,'Book/A.md').text,'independent typing');assert.equal(find(h,'Renamed/A.md').text,'moved typing');
 await assert.rejects(h.store.flush(),/Disk recovery was preserved/);
 assert.deepEqual(texts(JSON.parse(h.files.get(PRIMARY)).entries),['older source','orphan draft']);
 assert.equal(h.files.has(PREVIOUS),false);await assert.rejects(h.store.close());
});

test('a transient rename onto an orphan and back cannot clear that orphan through a touched alias',async()=>{
 const started=deferred(),release=deferred();
 const h=harness({entries:[entry('A.md','older source'),entry('B.md','orphan draft')],beforeRead:async path=>{
  if(path===PRIMARY){started.resolve();await release.promise;}
 }});
 await started.promise;h.store.capture('A.md','Original older source','new typing');
 h.store.rename('A.md','B.md');h.store.rename('B.md','A.md');release.resolve();await h.store.ready;
 assert.equal(find(h,'A.md').text,'new typing');assert.equal(find(h,'B.md').text,'orphan draft');
 await h.store.flush();await h.store.discard(find(h,'A.md'));
 assertStores(h,['orphan draft']);await assertRestarts(h,['orphan draft']);await h.store.close();
});

test('clearing the displaced source can unblock startup without clearing an unrelated orphan',async()=>{
 const started=deferred(),release=deferred();let hold=true;
 const h=harness({entries:[entry('A.md','older source'),entry('B.md','orphan draft')],beforeRead:async path=>{
  if(path===PRIMARY&&hold){started.resolve();await release.promise;}
 }});
 await started.promise;h.store.capture('A.md','Original older source','moved typing');h.store.rename('A.md','B.md');
 h.store.capture('A.md','New base','independent typing');release.resolve();await h.store.ready;
 assert.equal(h.store.status.phase,'error');
 h.store.capture('B.md','moved typing','moved typing');hold=false;await h.store.retry();
 assert.equal(find(h,'A.md').text,'independent typing');assert.equal(find(h,'B.md').text,'orphan draft');
 assert.deepEqual(texts(JSON.parse(h.files.get(PRIMARY)).entries),['independent typing','orphan draft']);
 await h.store.discard(find(h,'A.md'));assertStores(h,['orphan draft']);await assertRestarts(h,['orphan draft']);await h.store.close();
});

test('discarding a renamed draft preserves a separate draft created at its reused original path',async()=>{
 for(const enabled of [true,false]){
  const h=harness({enabled,entries:[entry('Book/A.md','old draft')]});await h.store.ready;
  h.store.rename('Book/A.md','Renamed.md');h.store.capture('Book/A.md','Another source','new independent draft');
  if(enabled)await h.store.flush();
  await h.store.discard(find(h,'Renamed.md'));
  assert.equal(find(h,'Book/A.md').text,'new independent draft');
  assertStores(h,enabled?['new independent draft']:[]);
  h.plugin.settings.v11Studio.recoveryEnabled=true;await h.store.flush();
  const resumed=harness({files:new Map(h.files)});await resumed.store.ready;
  assert.deepEqual(texts(resumed.store.list()),['new independent draft']);
  await resumed.store.close();await h.store.close();
 }
});

test('a rename collision after several moves keeps the orphaned destination when the source is discarded',async()=>{
 const h=harness({enabled:false,entries:[entry('Book/A.md','source draft'),entry('Final/A.md','orphan draft')]});await h.store.ready;
 h.store.rename('Book','Temporary');h.store.rename('Temporary','Final');
 await h.store.discard(find(h,'Temporary/A.md'));
 assertStores(h,['orphan draft']);assert.equal(find(h,'Final/A.md').text,'orphan draft');
 await assertRestarts(h,['orphan draft']);await h.store.close();
});

test('failed discard restores the renamed draft identity so retry scrubs its original alias',async()=>{
 for(const failedPath of [PRIMARY,PREVIOUS]){
  const h=harness({enabled:false,entries:[entry('Book/A.md','discard me'),entry('Keep.md','keep me')]});await h.store.ready;
  h.store.rename('Book','Renamed');let fail=true;
  h.adapter.beforeWrite=path=>{if(path===failedPath&&fail){fail=false;throw Error('disk unavailable');}};
  await assert.rejects(h.store.discard(find(h,'Renamed/A.md')),/disk unavailable/);
  assert.equal(find(h,'Renamed/A.md').text,'discard me');
  await h.store.retry();await h.store.discard(find(h,'Renamed/A.md'));
  assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
 }
});

test('a new draft captured at the same path during discard is not mistaken for the discarded identity',async()=>{
 for(const enabled of [true,false]){
  const h=harness({enabled,entries:[entry('Book/A.md','old draft')]});await h.store.ready;
  h.store.rename('Book/A.md','Renamed.md');const started=deferred(),release=deferred();let held=false;
  h.adapter.beforeWrite=async path=>{if(path===PRIMARY&&!held){held=true;started.resolve();await release.promise;}};
  const discarding=h.store.discard(find(h,'Renamed.md'));await started.promise;
  h.store.capture('Renamed.md','New base','new draft during write');release.resolve();await discarding;
  assert.equal(find(h,'Renamed.md').text,'new draft during write');
  if(enabled){
   assert.deepEqual(texts(JSON.parse(h.files.get(PRIMARY)).entries),['new draft during write']);
   assert.deepEqual(texts(JSON.parse(h.files.get(PREVIOUS)).entries),[]);
  }else assertStores(h,[]);
  await h.store.close();
 }
});

test('a rename and discard while an older primary write is pending still scrub both aliases',async()=>{
 const h=harness({entries:[entry('Book/A.md','old draft'),entry('Keep.md','keep me')]});await h.store.ready;
 h.store.capture('Book/A.md','Original old draft','newer draft');
 const started=deferred(),release=deferred();let held=false;
 h.adapter.beforeWrite=async path=>{if(path===PRIMARY&&!held){held=true;started.resolve();await release.promise;}};
 const writing=h.store.flush();await started.promise;
 h.store.rename('Book','Renamed');const discarding=h.store.discard(find(h,'Renamed/A.md'));
 release.resolve();await Promise.all([writing,discarding]);
 assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
});

test('a rename during a failed primary write keeps its identity when recovery is reloaded and retried',async()=>{
 const h=harness({entries:[entry('Book/A.md','old draft'),entry('Keep.md','keep me')]});await h.store.ready;
 h.store.capture('Book/A.md','Original old draft','newer draft');
 const started=deferred(),release=deferred();let fail=true;
 h.adapter.beforeWrite=async path=>{
  if(path===PRIMARY&&fail){fail=false;started.resolve();await release.promise;throw Error('write failed');}
 };
 const writing=h.store.flush();await started.promise;h.store.rename('Book','Renamed');release.resolve();
 await assert.rejects(writing,/write failed/);await h.store.retry();
 await h.store.discard(find(h,'Renamed/A.md'));
 assertStores(h,['keep me']);await assertRestarts(h,['keep me']);await h.store.close();
});
