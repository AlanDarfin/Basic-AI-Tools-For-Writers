'use strict';
/**
 * Contracts observed in the original companion sources; no upstream code is copied.
 * Commands keep the companion's own editor checks, settings and transport lifecycle.
 * Registration and snapshots never invoke a command, transport, shell or sync task.
 */
const WRITER_COMPANION_SYNC=[
 {
  id:'syncthing-integration',name:'Syncthing Integration',role:'sync',
  repository:'https://github.com/LBF38/obsidian-syncthing-integration',
  revision:'12ca9b8bdb60a5d6527894aec802be11da06e3c8',license:'MIT',version:'2.4.0',
  minAppVersion:'1.0.0',mobile:true,settingsTabId:'syncthing-integration',viewTypes:[],
  descriptionPt:'Conflitos, diferenças e configuração do Syncthing nas telas originais. Este plugin não oferece um comando de sincronização manual.',
  descriptionEn:'Syncthing conflicts, differences and configuration in the original dialogs. This plugin does not expose a manual sync command.',
  panels:[
   {id:'conflicts',pt:'Abrir conflitos',en:'Open conflicts',command:'syncthing-integration:syncthing-conflicts-modal'}
  ],
  actions:[
   {id:'conflicts',pt:'Abrir conflitos',en:'Open conflicts',command:'syncthing-integration:syncthing-conflicts-modal',kind:'inspect',effect:'inspect'},
   {id:'diff',pt:'Comparar nota atual',en:'Compare current note',command:'syncthing-integration:syncthing-diff-modal',kind:'inspect',effect:'inspect',requiresEditor:true},
   {id:'configuration',pt:'Abrir configuração do Syncthing',en:'Open Syncthing configuration',command:'syncthing-integration:syncthing-configuration-modal',kind:'network',effect:'network'},
   {id:'settings',pt:'Abrir configurações da integração',en:'Open integration settings',command:'syncthing-integration:syncthing-plugin-settings',kind:'panel',effect:'panel'}
  ]
 },
 {
  id:'syncthing-manager',name:'Syncthing Manager',role:'sync',
  repository:'https://github.com/gustjose/obsidian-syncthing-manager',
  revision:'0e1e612982b21a27323e2f62a228689cdcdc6a13',license:'MIT',version:'1.4.5',
  minAppVersion:'1.11.4',mobile:true,settingsTabId:'syncthing-manager',viewTypes:['syncthing-view'],
  statusEvents:['syncthing:status-changed'],
  descriptionPt:'Painel, versões e diagnóstico do Syncthing. A leitura do estado usa apenas informações já mantidas pelo plugin.',
  descriptionEn:'Syncthing dashboard, versions and diagnostics. Status reads only information already maintained by the plugin.',
  panels:[
   {id:'dashboard',pt:'Abrir painel do Syncthing',en:'Open Syncthing dashboard',command:'syncthing-manager:open-syncthing-view',viewType:'syncthing-view'}
  ],
  actions:[
   {id:'dashboard',pt:'Abrir painel do Syncthing',en:'Open Syncthing dashboard',command:'syncthing-manager:open-syncthing-view',viewType:'syncthing-view',kind:'panel',effect:'panel'},
   {id:'versions',pt:'Ver versões da nota atual',en:'View current note versions',command:'syncthing-manager:view-file-versions',kind:'network',effect:'network',requiresEditor:true},
   {id:'scan',pt:'Solicitar sincronização agora',en:'Request sync now',command:'syncthing-manager:syncthing-force-scan',kind:'sync',effect:'sync'},
   {id:'test-connection',pt:'Testar conexão',en:'Test connection',command:'syncthing-manager:test-syncthing-connection',kind:'network',effect:'network'},
   {id:'diagnostics',pt:'Abrir diagnóstico de conexão',en:'Open connection diagnostics',command:'syncthing-manager:copy-debug-info',kind:'network',effect:'network'}
  ]
 },
 {
  id:'obsidian-git',name:'Obsidian Git',role:'sync',
  repository:'https://github.com/Vinzent03/obsidian-git',
  revision:'8d1144aef2d41ffca6245a60199656e7a0c5ab17',license:'MIT',version:'2.43.0',
  minAppVersion:'1.13.0',mobile:true,settingsTabId:'obsidian-git',
  viewTypes:['git-view','git-history-view','diff-view','split-diff-view','git-read-only-file-view'],
  statusEvents:['obsidian-git:refreshed','obsidian-git:repository-state-changed'],
  descriptionPt:'Controle de versão, histórico e diferenças. No celular, as operações dependem do backend Git disponível e inicializado pelo plugin.',
  descriptionEn:'Source control, history and differences. On mobile, operations depend on the Git backend being available and initialized by the plugin.',
  panels:[
   {id:'source-control',pt:'Abrir controle de versão',en:'Open source control',command:'obsidian-git:open-git-view',viewType:'git-view'},
   {id:'history',pt:'Abrir histórico',en:'Open history',command:'obsidian-git:open-history-view',viewType:'git-history-view'}
  ],
  actions:[
   {id:'source-control',pt:'Abrir controle de versão',en:'Open source control',command:'obsidian-git:open-git-view',viewType:'git-view',kind:'panel',effect:'panel'},
   {id:'history',pt:'Abrir histórico',en:'Open history',command:'obsidian-git:open-history-view',viewType:'git-history-view',kind:'panel',effect:'panel'},
   {id:'diff',pt:'Comparar nota atual',en:'Compare current note',command:'obsidian-git:open-diff-view',kind:'inspect',effect:'inspect',requiresEditor:true,requiresReady:true},
   {id:'changed-files',pt:'Listar arquivos alterados',en:'List changed files',command:'obsidian-git:list-changed-files',kind:'inspect',effect:'inspect',requiresReady:true},
   {id:'fetch',pt:'Buscar referências remotas',en:'Fetch remote references',command:'obsidian-git:fetch',kind:'network',effect:'network',requiresReady:true},
   {id:'pull',pt:'Receber alterações remotas',en:'Pull remote changes',command:'obsidian-git:pull',kind:'sync',effect:'sync',requiresReady:true},
   {id:'push',pt:'Enviar commits existentes',en:'Push existing commits',command:'obsidian-git:push2',kind:'sync',effect:'sync',requiresReady:true},
   {id:'commit-and-sync',pt:'Criar commit e sincronizar',en:'Commit and sync',command:'obsidian-git:push',kind:'sync',effect:'sync',requiresReady:true}
  ]
 },
 {
  id:'fit',name:'FIT',role:'sync',repository:'https://github.com/joshuakto/fit',
  revision:'e0b7af61393ef9cb973fc01d431b24fd2e9877fc',license:'MIT',version:'1.5.0',
  minAppVersion:'1.11.4',mobile:true,settingsTabId:'fit',viewTypes:[],
  descriptionPt:'Sincronização com GitHub e explicação do estado na janela original do FIT. Consultar o estado completo pode acessar o servidor.',
  descriptionEn:'GitHub sync and status explanations in FIT’s original dialog. Inspecting full status may contact the server.',
  panels:[],
  actions:[
   {id:'explain-status',pt:'Consultar e explicar estado',en:'Inspect and explain status',command:'fit:fit-explain-status',kind:'network',effect:'network'},
   {id:'sync',pt:'Sincronizar com FIT',en:'Sync with FIT',command:'fit:fit-sync',kind:'sync',effect:'sync'}
  ]
 }
];

function writerCompanionSyncInstance(plugin,id){
 try{
  if(!WRITER_COMPANION_SYNC.some(item=>item.id===id))return null;
  if(typeof writerCompanionEnabled==='function'&&!writerCompanionEnabled(plugin,id))return null;
  return plugin?.app?.plugins?.plugins?.[id]||null;
 }catch(_){return null;}
}

/**
 * Availability is observed, never probed by executing a native callback.
 * The common manager additionally checks module/preferences, selected sync provider
 * and editor context immediately before dispatching an explicit user action.
 */
function writerCompanionSyncActionAvailable(plugin,id,actionId){
 try{
  const descriptor=WRITER_COMPANION_SYNC.find(item=>item.id===id);
  const action=descriptor?.actions.find(item=>item.id===actionId);
  if(!action)return false;
  const companion=writerCompanionSyncInstance(plugin,id);
  if(!companion)return false;
  const command=plugin?.app?.commands?.commands?.[action.command];
  if(!command||!['callback','checkCallback','editorCallback','editorCheckCallback'].some(key=>typeof command[key]==='function'))return false;
  if(id==='obsidian-git'&&action.requiresReady&&(companion.gitReady!==true||companion.repositoryMissing===true))return false;
  return true;
 }catch(_){return false;}
}

/**
 * Redacted cached snapshot only. No native settings, credentials, hostnames,
 * repository paths, device names, file lists, logs or transport methods are read.
 * lastSync is a native time label (Syncthing Manager) or epoch milliseconds (FIT).
 */
function writerCompanionSyncStatus(plugin,id){
 const companion=writerCompanionSyncInstance(plugin,id);
 if(!companion)return {status:'unavailable'};
 try{
  if(id==='syncthing-manager'){
   const statuses={conectado:'synced',sincronizando:'syncing',escutando:'listening',pausado:'paused',
    'pausado-remoto':'remote-paused','aguardando-dispositivos':'waiting',desconectado:'offline',
    erro:'error',configurando:'setup',desconhecido:'unknown'};
   const currentStatus=companion.currentStatus;
   const result={status:typeof currentStatus==='string'&&Object.prototype.hasOwnProperty.call(statuses,currentStatus)?statuses[currentStatus]:'unknown'};
   const paused=companion.isPaused,count=companion.connectedDevices,lastSync=companion.lastSyncTime;
   if(typeof paused==='boolean')result.paused=paused;
   if(Number.isSafeInteger(count)&&count>=0)result.connectedDevicesCount=count;
   if(typeof lastSync==='string'&&/^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s?[ap]\.?m\.?)?$/i.test(lastSync))result.lastSync=lastSync;
   return result;
  }
  if(id==='obsidian-git'){
   const state=companion.state;
   if(companion.repositoryMissing===true)return {status:'setup'};
   if(state?.offlineMode===true)return {status:'offline'};
   if(state?.mergeInProgress===true)return {status:'conflict'};
   // GitOperation is the source enum idle=0, pull=1, commit=2, push=3,
   // fetch=4, checkout=5. Unknown values remain unknown on future versions.
   const operation=state?.operation;
   if(Number.isInteger(operation)&&operation>=1&&operation<=5)return {status:'syncing'};
   return {status:companion.gitReady===true&&operation===0?'idle':'unknown'};
  }
  if(id==='fit'){
   const active=companion.fitSync?.isActive;
   const result={status:active===true?'syncing':active===false?'idle':'unknown'};
   const lastSync=companion.localStore?.lastSyncedAt;
   if(Number.isSafeInteger(lastSync)&&lastSync>0&&lastSync<=8640000000000000)result.lastSync=lastSync;
   return result;
  }
 }catch(_){return {status:'unknown'};}
 // Syncthing Integration exposes dialogs, not a verified cached status contract.
 return {status:'unknown'};
}
