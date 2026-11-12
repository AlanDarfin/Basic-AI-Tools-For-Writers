'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/companion-sync.js','utf8');
function fixture(enabled=true){
 const context={writerCompanionEnabled:()=>enabled};
 const api=vm.runInNewContext(source+'\n({WRITER_COMPANION_SYNC,writerCompanionSyncStatus,writerCompanionSyncActionAvailable})',context);
 let calls=0;
 const plugins={},commands={};
 for(const descriptor of api.WRITER_COMPANION_SYNC){
  plugins[descriptor.id]={manifest:{id:descriptor.id,version:'future-compatible-version'}};
  for(const action of descriptor.actions)commands[action.command]={callback(){calls++;throw new Error('Native action must require explicit dispatch');}};
 }
 const plugin={app:{isMobile:true,plugins:{plugins},commands:{commands}}};
 return {api,plugin,plugins,commands,calls:()=>calls};
}
const plain=value=>JSON.parse(JSON.stringify(value));
const blocked=()=>{throw new Error('Sensitive or active API was accessed');};

test('sync contracts preserve native command semantics, bilingual labels and current mobile requirements',()=>{
 const h=fixture(),descriptors=h.api.WRITER_COMPANION_SYNC;
 assert.deepEqual(Array.from(descriptors,item=>item.id),['syncthing-integration','syncthing-manager','obsidian-git','fit']);
 for(const descriptor of descriptors){
  assert.equal(descriptor.mobile,true);
  assert.equal(descriptor.license,'MIT');
  assert.match(descriptor.revision,/^[a-f0-9]{40}$/);
  assert.equal(descriptor.settingsTabId,descriptor.id);
  for(const action of descriptor.actions){
   assert.ok(action.pt&&action.en);
   assert.ok(action.command.startsWith(descriptor.id+':'));
   assert.equal(action.effect,action.kind);
  }
 }
 const integration=descriptors.find(item=>item.id==='syncthing-integration');
 assert.equal(integration.actions.some(item=>item.kind==='sync'),false,'Do not invent an upstream sync API');
 const git=descriptors.find(item=>item.id==='obsidian-git');
 assert.equal(git.minAppVersion,'1.13.0');
 assert.equal(git.actions.find(item=>item.id==='commit-and-sync').command,'obsidian-git:push');
 assert.equal(git.actions.find(item=>item.id==='commit-and-sync').en,'Commit and sync');
 assert.equal(git.actions.find(item=>item.id==='push').command,'obsidian-git:push2');
 assert.equal(git.actions.find(item=>item.id==='diff').requiresEditor,true);
 assert.equal(integration.actions.find(item=>item.id==='diff').requiresEditor,true);
 assert.equal(descriptors.find(item=>item.id==='fit').actions.find(item=>item.id==='explain-status').kind,'network');
 assert.equal(descriptors.find(item=>item.id==='syncthing-manager').actions.find(item=>item.id==='diagnostics').kind,'network');
});

test('detecting native panels and actions never executes their callbacks or a transfer',()=>{
 const h=fixture();
 h.plugins['obsidian-git'].gitReady=true;
 for(const descriptor of h.api.WRITER_COMPANION_SYNC){
  for(const action of descriptor.actions)assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,descriptor.id,action.id),true,action.command);
  h.api.writerCompanionSyncStatus(h.plugin,descriptor.id);
 }
 assert.equal(h.calls(),0);
 delete h.commands['fit:fit-sync'];
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'fit','sync'),false);
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'fit','unlisted-action'),false);
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'unsupported','sync'),false);
});

test('mobile Git operations depend on the initialized backend while native settings panels remain reachable',()=>{
 const h=fixture(),git=h.plugins['obsidian-git'];
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'obsidian-git','source-control'),true);
 for(const id of ['fetch','pull','push','commit-and-sync','diff','changed-files'])
  assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'obsidian-git',id),false,id);
 git.gitReady=true;
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'obsidian-git','commit-and-sync'),true);
 git.repositoryMissing=true;
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'obsidian-git','commit-and-sync'),false);
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'obsidian-git','history'),true);
 assert.equal(h.calls(),0);
});

test('disabled and unloaded integrations invalidate old UI without touching native APIs',()=>{
 const h=fixture(false);
 h.plugin.app=new Proxy({}, {get:blocked});
 assert.equal(h.api.writerCompanionSyncActionAvailable(h.plugin,'fit','sync'),false);
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'fit')),{status:'unavailable'});
 const loaded=fixture();
 delete loaded.plugins.fit;
 assert.equal(loaded.api.writerCompanionSyncActionAvailable(loaded.plugin,'fit','sync'),false);
 assert.deepEqual(plain(loaded.api.writerCompanionSyncStatus(loaded.plugin,'fit')),{status:'unavailable'});
 assert.deepEqual(plain(loaded.api.writerCompanionSyncStatus(loaded.plugin,'unsupported')),{status:'unavailable'});
});

test('manager snapshots whitelist cached status, count, pause and native last-sync label',()=>{
 const h=fixture(),manager=h.plugins['syncthing-manager'];
 Object.assign(manager,{currentStatus:'pausado-remoto',isPaused:false,connectedDevices:2,lastSyncTime:'01:24 PM'});
 for(const key of ['settings','deviceMap','connectedDeviceNames','apiUrl','monitor'])Object.defineProperty(manager,key,{get:blocked});
 manager.verificarConexao=blocked;manager.forcarSincronizacao=blocked;
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'syncthing-manager')),
  {status:'remote-paused',paused:false,connectedDevicesCount:2,lastSync:'01:24 PM'});
 const expected={conectado:'synced',sincronizando:'syncing',escutando:'listening',pausado:'paused',
  'aguardando-dispositivos':'waiting',desconectado:'offline',erro:'error',configurando:'setup',desconhecido:'unknown'};
 for(const [native,status] of Object.entries(expected)){
  manager.currentStatus=native;
  assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'syncthing-manager').status,status,native);
 }
 assert.equal(h.calls(),0);
});

test('snapshot validation does not leak arbitrary status values or account data',()=>{
 const h=fixture(),manager=h.plugins['syncthing-manager'];
 Object.assign(manager,{currentStatus:'__proto__',isPaused:'secret-token',connectedDevices:-1,lastSyncTime:'https://private-device.invalid/key'});
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'syncthing-manager')),{status:'unknown'});
 manager.currentStatus={toString:blocked};manager.connectedDevices=Infinity;manager.lastSyncTime='--:--';
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'syncthing-manager')),{status:'unknown'});
 const integration=h.plugins['syncthing-integration'];
 Object.defineProperty(integration,'syncthingController',{get:blocked});
 Object.defineProperty(integration,'settings',{get:blocked});
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'syncthing-integration')),{status:'unknown'});
});

test('Git snapshots inspect known cached state without shell, repository, settings or scheduler calls',()=>{
 const h=fixture(),git=h.plugins['obsidian-git'];
 git.gitReady=true;git.state={operation:0,offlineMode:false,mergeInProgress:false};
 for(const key of ['settings','gitManager','cachedStatus','localStorage','gitActions'])Object.defineProperty(git,key,{get:blocked});
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git')),{status:'idle'});
 git.state.operation=3;
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git').status,'syncing');
 git.state.offlineMode=true;
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git').status,'offline');
 git.state.offlineMode=false;git.state.mergeInProgress=true;
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git').status,'conflict');
 git.repositoryMissing=true;
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git').status,'setup');
 git.repositoryMissing=false;git.state.mergeInProgress=false;git.state.operation='new-unknown-operation';
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'obsidian-git').status,'unknown');
 assert.equal(h.calls(),0);
});

test('FIT status uses its cached activity getter and successful-sync timestamp without checking the remote',()=>{
 const h=fixture(),fit=h.plugins.fit;
 fit.fitSync={isActive:true,explainStatus:blocked,sync:blocked};
 fit.localStore={lastSyncedAt:1760000000000};
 for(const key of ['settings','fit','githubConnection'])Object.defineProperty(fit,key,{get:blocked});
 fit.triggerManualSync=blocked;
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'fit')),{status:'syncing',lastSync:1760000000000});
 fit.fitSync.isActive=false;
 assert.equal(h.api.writerCompanionSyncStatus(h.plugin,'fit').status,'idle');
 fit.localStore.lastSyncedAt='private-repository';
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'fit')),{status:'idle'});
 Object.defineProperty(fit.fitSync,'isActive',{get:blocked});
 assert.deepEqual(plain(h.api.writerCompanionSyncStatus(h.plugin,'fit')),{status:'unknown'});
 assert.equal(h.calls(),0);
});
