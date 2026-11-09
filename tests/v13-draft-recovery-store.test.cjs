'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/draft-recovery.js','utf8');
const DIR='.obsidian/plugins/basic-ai-tool-for-writers';
const PRIMARY=DIR+'/longform-recovery.json';
const PREVIOUS=DIR+'/longform-recovery.previous.json';
const entry=(path='Book/Chapter.md',original='Original',text='Draft')=>({path,original,text,updatedAt:'2026-01-01T10:00:00.000Z'});
const encode=entries=>JSON.stringify({version:1,entries});
const clean=value=>JSON.parse(JSON.stringify(value));
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}
function harness(options={}){
 const files=options.files||new Map(),folders=new Set(),writes=[],timers=new Map();let serial=0;
 const adapter={
  exists:async path=>files.has(path)||folders.has(path),
  read:async path=>{await options.beforeRead?.(path);if(!files.has(path))throw Error('Missing recovery file');return files.get(path);},
  mkdir:async path=>{if(folders.has(path))throw Error('Already exists');folders.add(path);},
  write:async(path,value)=>{await adapter.beforeWrite?.(path,value);writes.push({path,value});files.set(path,value);}
 };
 const api=vm.runInNewContext(source+'\n({WriterV134DraftRecovery,writerV134Recovery})',{
  writerUi:(_pt,en)=>en,console,
  setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)
 });
 const plugin={manifest:{id:'basic-ai-tool-for-writers',dir:options.dir||DIR},
  settings:{v11Studio:{recoveryEnabled:options.enabled!==false}},app:{vault:{adapter,configDir:'.obsidian'}}};
 const store=api.writerV134Recovery(plugin);
 return {api,plugin,store,adapter,files,writes,timers,state:()=>JSON.parse(files.get(PRIMARY))};
}

test('recovery copies survive reload separately from note files and plugin settings',async()=>{
 const h=harness();await h.store.ready;
 assert.equal(h.api.writerV134Recovery(h.plugin),h.store);
 h.store.capture('Book/Chapter.md','Original','Unsaved manuscript');
 assert.equal(h.store.status.phase,'pending');
 await h.store.flush();
 const saved=h.state().entries[0];
 assert.equal(saved.path,'Book/Chapter.md');assert.equal(saved.original,'Original');assert.equal(saved.text,'Unsaved manuscript');
 assert.ok(Number.isFinite(Date.parse(saved.updatedAt)));
 assert.ok(h.writes.every(write=>write.path.startsWith(DIR+'/')));
 assert.equal(h.plugin.settings.v11Studio.drafts,undefined);
 const resumed=harness({files:h.files});await resumed.store.ready;
 assert.deepEqual(clean(resumed.store.list()),[saved]);
 assert.deepEqual(clean(resumed.plugin._writerV11Drafts.get(saved.path)),{original:'Original',text:'Unsaved manuscript'});
 await h.store.close();await resumed.store.close();
});

test('typing or clearing before disk loading finishes wins over old recovery copies',async()=>{
 const read=deferred(),started=deferred();
 const files=new Map([[PRIMARY,encode([entry('A.md'),entry('B.md')])]]);
 const h=harness({files,beforeRead:async path=>{if(path===PRIMARY){started.resolve();await read.promise;}}});
 await started.promise;
 h.store.capture('A.md','Original','Newer typing');h.store.capture('B.md','Original','Original');
 read.resolve();await h.store.ready;
 assert.equal(h.plugin._writerV11Drafts.get('A.md').text,'Newer typing');
 assert.equal(h.plugin._writerV11Drafts.has('B.md'),false);
 await h.store.flush();assert.deepEqual(h.state().entries.map(x=>x.path),['A.md']);
 await h.store.close();
});

test('input during a write is serialized into a later complete recovery copy',async()=>{
 const h=harness();await h.store.ready;
 const started=deferred(),release=deferred();let held=false;
 h.adapter.beforeWrite=async path=>{if(path===PRIMARY&&!held){held=true;started.resolve();await release.promise;}};
 h.store.capture('Chapter.md','Original','Submitted draft');
 const pending=h.store.flush();await started.promise;
 h.store.capture('Chapter.md','Original','Submitted draft and newer typing');release.resolve();await pending;
 assert.equal(h.state().entries[0].text,'Submitted draft and newer typing');
 assert.equal(JSON.parse(h.files.get(PREVIOUS)).entries[0].text,'Submitted draft');
 assert.equal(h.store.status.phase,'saved');await h.store.close();
});

test('a failed write preserves memory and a subsequent flush can recover',async()=>{
 const h=harness();await h.store.ready;let fail=true;
 h.adapter.beforeWrite=path=>{if(path===PRIMARY&&fail){fail=false;throw Error('disk busy');}};
 h.store.capture('Chapter.md','Before','Unsaved words');
 await assert.rejects(h.store.flush(),/disk busy/);
 assert.equal(h.store.status.phase,'error');assert.equal(h.store.list()[0].text,'Unsaved words');
 await h.store.flush();assert.equal(h.state().entries[0].text,'Unsaved words');assert.equal(h.store.status.phase,'saved');
 await h.store.close();
});

test('damaged primary falls back to the previous copy without overwriting the damaged file',async()=>{
 const damaged='{"version":1,"entries": [ incomplete';
 const h=harness({files:new Map([[PRIMARY,damaged],[PREVIOUS,encode([entry()])]])});
 await h.store.ready;
 assert.equal(h.store.status.phase,'error');assert.match(h.store.status.error,/preserved/);
 assert.equal(h.store.list()[0].text,'Draft');
 h.store.capture('Other.md','Before','Another draft');
 await assert.rejects(h.store.flush(),/preserved/);
 assert.equal(h.files.get(PRIMARY),damaged);assert.equal(h.writes.length,0);
 h.files.set(PRIMARY,encode([entry()]));await h.store.retry();
 assert.equal(h.store.status.phase,'saved');assert.equal(h.state().entries.length,2);
 await h.store.close();
});

test('unknown schemas and unsafe stored paths block replacement instead of silently dropping data',async()=>{
 for(const raw of [JSON.stringify({version:2,entries:[]}),encode([entry('../Private.md')]),encode([entry('/Absolute.md')]),encode([entry('A\\B.md')])]){
  const h=harness({files:new Map([[PRIMARY,raw]])});await h.store.ready;
  assert.equal(h.store.status.phase,'error');
  h.store.capture('Valid.md','Base','Typing');await assert.rejects(h.store.flush());
  assert.equal(h.files.get(PRIMARY),raw);assert.equal(h.writes.length,0);
  await assert.rejects(h.store.close());
 }
 const invalid=harness({dir:'../outside'});await invalid.store.ready;
 assert.equal(invalid.store.status.phase,'error');assert.equal(invalid.writes.length,0);
 await assert.rejects(invalid.store.close());
});

test('folder renames preserve nested drafts and do not match similar sibling folder names or collide',async()=>{
 const h=harness();await h.store.ready;
 h.store.capture('Book/One.md','Before','One');h.store.capture('Book/Sub/Two.md','Before','Two');
 h.store.capture('Bookcase/Other.md','Before','Other');h.store.capture('Archive/One.md','Before','Destination');
 h.store.rename('Book','Archive');
 assert.deepEqual(Array.from(h.plugin._writerV11Drafts.keys()).sort(),['Archive/One.md','Archive/Sub/Two.md','Book/One.md','Bookcase/Other.md']);
 assert.equal(h.plugin._writerV11Drafts.get('Archive/One.md').text,'Destination');
 assert.equal(h.plugin._writerV11Drafts.get('Book/One.md').text,'One');
 await h.store.flush();const resumed=harness({files:h.files});await resumed.store.ready;
 assert.equal(resumed.plugin._writerV11Drafts.get('Archive/Sub/Two.md').text,'Two');
 await h.store.close();await resumed.store.close();
});

test('a folder renamed during startup also migrates drafts that have not finished loading',async()=>{
 const read=deferred(),started=deferred();
 const h=harness({files:new Map([[PRIMARY,encode([entry('Book/Chapter.md')])]]),
  beforeRead:async path=>{if(path===PRIMARY){started.resolve();await read.promise;}}});
 await started.promise;h.store.rename('Book','Renamed');read.resolve();await h.store.ready;
 assert.equal(h.plugin._writerV11Drafts.has('Book/Chapter.md'),false);
 assert.equal(h.plugin._writerV11Drafts.get('Renamed/Chapter.md').text,'Draft');
 await h.store.flush();assert.equal(h.state().entries[0].path,'Renamed/Chapter.md');await h.store.close();
});

test('a rename during loading keeps an orphaned destination and the source recovery copy',async()=>{
 const read=deferred(),started=deferred();
 const h=harness({files:new Map([[PRIMARY,encode([
  entry('Book/A.md','Source base','Old unsaved'),entry('Renamed/A.md','Orphan base','Orphan unsaved')
 ])]]),beforeRead:async path=>{if(path===PRIMARY){started.resolve();await read.promise;}}});
 await started.promise;h.store.rename('Book','Renamed');read.resolve();await h.store.ready;
 assert.equal(h.plugin._writerV11Drafts.get('Book/A.md').text,'Old unsaved');
 assert.equal(h.plugin._writerV11Drafts.get('Renamed/A.md').text,'Orphan unsaved');
 await h.store.flush();
 assert.deepEqual(h.state().entries.map(x=>x.text).sort(),['Old unsaved','Orphan unsaved']);
 await h.store.close();
});

test('disabled recovery keeps new typing in memory and explicit discard does not persist those new drafts',async()=>{
 const h=harness({enabled:false,files:new Map([[PRIMARY,encode([entry('Old.md'),entry('Keep.md')])]])});await h.store.ready;
 h.store.capture('New.md','Base','New typing');h.store.capture('Old.md','Original','Changed while disabled');
 await h.store.flush();assert.equal(h.store.status.phase,'disabled');assert.equal(h.writes.length,0);
 const old=h.store.list().find(x=>x.path==='Old.md');await h.store.discard(old);
 assert.deepEqual(h.state().entries.map(x=>x.path),['Keep.md']);
 assert.deepEqual(JSON.parse(h.files.get(PREVIOUS)).entries.map(x=>x.path),['Keep.md']);
 assert.equal(h.plugin._writerV11Drafts.get('New.md').text,'New typing');
 assert.equal(h.store.status.phase,'disabled');await h.store.close();
});

test('discard refuses a stale draft and failed persistence restores the recoverable text',async()=>{
 const h=harness();await h.store.ready;
 h.store.capture('Chapter.md','Before','One');await h.store.flush();const old=h.store.list()[0];
 h.store.capture('Chapter.md','Before','Two');await assert.rejects(h.store.discard(old),/changed/);
 const latest=h.store.list()[0];h.adapter.beforeWrite=()=>{throw Error('cannot write');};
 await assert.rejects(h.store.discard(latest),/cannot write/);
 assert.equal(h.store.list()[0].text,'Two');assert.equal(h.plugin._writerV11Drafts.get('Chapter.md').text,'Two');
 h.adapter.beforeWrite=null;await h.store.flush();await h.store.discard(h.store.list()[0]);
 assert.deepEqual(h.state().entries,[]);assert.deepEqual(JSON.parse(h.files.get(PREVIOUS)).entries,[]);
 await h.store.close();
});

test('limits retain every memory draft and the previously valid file instead of evicting copies',async()=>{
 const h=harness();await h.store.ready;h.store.capture('Saved.md','Base','Safe');await h.store.flush();
 const before=h.files.get(PRIMARY);
 for(let i=0;i<40;i++)h.store.capture('Extra-'+i+'.md','Base','Draft '+i);
 await assert.rejects(h.store.flush(),/40-draft/);
 assert.equal(h.plugin._writerV11Drafts.size,41);assert.equal(h.store.list().length,41);assert.equal(h.files.get(PRIMARY),before);
 await assert.rejects(h.store.close());
 const large=harness();await large.store.ready;
 for(let i=0;i<3;i++)large.store.capture('Large-'+i+'.md','a'.repeat(1000000),'b'.repeat(1000000));
 await assert.rejects(large.store.flush(),/5 million/);assert.equal(large.store.list().length,3);assert.equal(large.writes.length,0);
 await assert.rejects(large.store.close());
 const chapter=harness();await chapter.store.ready;
 assert.equal(chapter.store.capture('Long.md','Base','x'.repeat(2000001)),false);
 assert.equal(chapter.plugin._writerV11Drafts.get('Long.md').text.length,2000001);
 assert.equal(chapter.store.list()[0].text.length,2000001);
 await assert.rejects(chapter.store.flush(),/too large/);await assert.rejects(chapter.store.close());
});

test('close flushes pending copies once and prevents timers or late input from reviving the store',async()=>{
 const h=harness();await h.store.ready;h.store.capture('Chapter.md','Base','Last words');
 assert.equal(h.timers.size,1);
 const closed=h.store.close();assert.equal(h.store.close(),closed);await closed;
 assert.equal(h.state().entries[0].text,'Last words');assert.equal(h.timers.size,0);
 const count=h.writes.length;
 assert.equal(h.store.capture('New.md','Base','Too late'),false);h.store.changed();
 await h.store.flush();assert.equal(h.writes.length,count);assert.equal(h.timers.size,0);
});

test('closing while retry reloads waits for that read and does not revive timers or late state',async()=>{
 let hold=false;const started=deferred(),release=deferred();
 const h=harness({files:new Map([[PRIMARY,encode([entry()])]]),beforeRead:async path=>{
  if(hold&&path===PRIMARY){started.resolve();await release.promise;}
 }});await h.store.ready;
 hold=true;const retry=h.store.retry();await started.promise;
 const closed=h.store.close();release.resolve();await Promise.all([retry,closed]);
 assert.equal(h.store.closed,true);assert.equal(h.timers.size,0);
 assert.equal(h.store.capture('Other.md','Base','Late'),false);
 assert.equal(h.state().entries.length,1);
});

test('status subscriptions report dirty capture immediately and settings replacement is respected',async()=>{
 const h=harness(),statuses=[];const stop=h.store.subscribe(status=>statuses.push({...status}));await h.store.ready;
 h.store.capture('Chapter.md','Before','After');assert.equal(statuses.at(-1).phase,'pending');
 await h.store.flush();assert.equal(statuses.at(-1).phase,'saved');
 h.plugin.settings.v11Studio={recoveryEnabled:false};h.store.capture('Chapter.md','Before','Newest');
 assert.equal(h.store.status.phase,'disabled');await h.store.flush();assert.equal(h.state().entries[0].text,'After');
 h.plugin.settings.v11Studio={recoveryEnabled:true};h.store.changed();await h.store.flush();
 assert.equal(h.state().entries[0].text,'Newest');stop();const before=statuses.length;
 h.store.capture('Chapter.md','Before','Final');assert.equal(statuses.length,before);await h.store.close();
});
