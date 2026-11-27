'use strict';
/**
 * Companion contracts checked against the original sources, not copied from them.
 * Native commands keep their own checks, settings, transport and confirmation flows.
 * No task is changed, file sent, process started or network request made on registration.
 */
const WRITER_COMPANION_NOTES=[
 {
  id:'snailkit',name:'Snailkit',repository:'https://github.com/arnaudgastelblum/snailkit',
  revision:'ef857e50f501dc7cfa9cda47b63919259e1b06ed',license:'MIT',version:'0.2.9',
  settingsTabId:'snailkit',mobile:true,viewTypes:['snailkit-tasks'],
  settingsSections:[
   {id:'workbench',pt:'Painel e abas',en:'Workbench and tabs'},
   {id:'note-rail',pt:'Botões flutuantes das notas',en:'Floating note buttons'},
   {id:'tasks',pt:'Tarefas e captura',en:'Tasks and capture'},
   {id:'home',pt:'Página inicial e notas',en:'Home and notes'},
   {id:'sessions',pt:'Sessões de ideias',en:'Brainstorm sessions'}
  ],
  actions:[
   {id:'home',pt:'Abrir página inicial',en:'Open home',command:'snailkit:workbench-home',viewType:'snailkit-tasks',effect:'panel'},
   {id:'tasks',pt:'Abrir tarefas',en:'Open tasks',command:'snailkit:workbench-tasks',viewType:'snailkit-tasks',effect:'panel'},
   {id:'tasks-side',pt:'Tarefas na lateral',en:'Tasks in sidebar',command:'snailkit:tasks-open-side',viewType:'snailkit-tasks',effect:'panel'},
   {id:'today',pt:'Tarefas de hoje',en:'Today’s tasks',command:'snailkit:tasks-open-today',viewType:'snailkit-tasks',effect:'panel'},
   {id:'brainstorms',pt:'Abrir sessões de ideias',en:'Open brainstorm sessions',command:'snailkit:workbench-brainstorms',viewType:'snailkit-tasks',effect:'panel'},
   {id:'note-menu',pt:'Menu flutuante da nota',en:'Floating note menu',command:'snailkit:note-rail-open-menu',effect:'panel',requiresEditor:true},
   {id:'note-contents',pt:'Sumário da nota',en:'Note contents',command:'snailkit:note-rail-open-contents',effect:'panel',requiresEditor:true},
   {id:'note-tasks',pt:'Tarefas da nota',en:'Note tasks',command:'snailkit:note-rail-open-tasks',effect:'panel',requiresEditor:true},
   {id:'note-bookmarks',pt:'Favoritos da nota',en:'Note bookmarks',command:'snailkit:note-rail-open-bookmarks',effect:'panel',requiresEditor:true},
   {id:'note-actions',pt:'Ações da nota',en:'Note actions',command:'snailkit:note-rail-open-actions',effect:'panel',requiresEditor:true},
   {id:'note-calendar',pt:'Calendário do menu da nota',en:'Note menu calendar',command:'snailkit:note-rail-open-calendar',effect:'panel',requiresEditor:true},
   {id:'new-task',pt:'Nova tarefa',en:'New task',command:'snailkit:tasks-new-task',effect:'create'},
   {id:'new-note',pt:'Nova nota',en:'New note',command:'snailkit:home-new-note',effect:'create'},
   {id:'new-session',pt:'Nova sessão de ideias',en:'New brainstorm session',command:'snailkit:sessions-new',effect:'create'},
   {id:'adopt-session',pt:'Usar nota como sessão de ideias',en:'Use note as brainstorm session',command:'snailkit:sessions-adopt',effect:'write',requiresEditor:true}
  ]
 },
 {
  id:'dropit',name:'dropit',repository:'https://github.com/smart-kits/dropit-obsidian',
  revision:'00d5e59ec23d90571da51f9eb460f7c9f45256d8',license:'MIT',version:'3.3.1',
  settingsTabId:'dropit',mobile:true,viewTypes:[],
  actions:[
   {id:'sync',pt:'Receber agora',en:'Receive now',command:'dropit:sync',effect:'network'},
   {id:'send-note',pt:'Enviar nota atual',en:'Send current note',command:'dropit:send-note',effect:'send',requiresEditor:true},
   {id:'send-selection',pt:'Enviar seleção',en:'Send selection',command:'dropit:send-selection',effect:'send',requiresEditor:true,requiresSelection:true},
   {id:'process-note',pt:'Processar nota com regra do dropit',en:'Process note with a dropit rule',command:'dropit:process-note',effect:'process',requiresEditor:true,desktopOnly:true},
   {id:'rerun-last',pt:'Repetir último processamento',en:'Repeat last processing',command:'dropit:rerun-last',effect:'process',desktopOnly:true}
  ]
 }
];

/** Open the companion's own settings so credentials, pairing and rules stay native. */
function writerCompanionNotesOpenSettings(plugin,id,section){
 const descriptor=WRITER_COMPANION_NOTES.find(item=>item.id===id);
 const companion=plugin?.app?.plugins?.plugins?.[id];
 if(!descriptor||!companion)return false;
 try{
  if(id==='snailkit'&&typeof companion.openSettings==='function'){
   const selected=descriptor.settingsSections.some(item=>item.id===section)?section:undefined;
   companion.openSettings(selected);return true;
  }
  if(id==='dropit'&&typeof companion.openSettings==='function'){
   companion.openSettings();return true;
  }
  const setting=plugin?.app?.setting;
  if(typeof setting?.open!=='function'||typeof setting?.openTabById!=='function')return false;
  setting.open();setting.openTabById(descriptor.settingsTabId);return true;
 }catch(_){return false;}
}

/** Always resolve the running service: Snailkit removes it when Tasks is disabled. */
function writerCompanionSnailkitService(plugin){
 try{
  if(typeof writerCompanionEnabled==='function'&&!writerCompanionEnabled(plugin,'snailkit'))return null;
  const api=plugin?.app?.plugins?.plugins?.snailkit?.api;
  if(api?.version!==1||typeof api.isEnabled!=='function'||!api.isEnabled('tasks')||typeof api.service!=='function')return null;
  const service=api.service('tasks');
  return service?.version===1?service:null;
 }catch(_){return null;}
}
function writerCompanionSnailkitLocation(value){
 return value&&typeof value.path==='string'&&value.path.length>0&&
  Number.isInteger(value.line)&&value.line>=0&&typeof value.raw==='string'&&value.raw.length>0?
  {path:value.path,line:value.line,raw:value.raw}:null;
}
function writerCompanionSnailkitTask(value){
 const location=writerCompanionSnailkitLocation(value);
 if(!location||typeof value.done!=='boolean')return null;
 const task={...location,done:value.done};
 for(const key of ['key','text','title','plainTitle','description','tag'])task[key]=typeof value[key]==='string'?value[key]:'';
 for(const key of ['due','doneDate','notePath'])task[key]=typeof value[key]==='string'?value[key]:null;
 task.priority=['high','medium','low'].includes(value.priority)?value.priority:null;
 task.tags=Array.isArray(value.tags)?value.tags.filter(tag=>typeof tag==='string'):[];
 task.markers=Object.fromEntries(Object.entries(value.markers||{}).filter(([key,item])=>typeof key==='string'&&typeof item==='string'));
 return task;
}
/** Read a detached snapshot; the external service remains the source of truth. */
function writerCompanionSnailkitTasks(plugin,includeDone=false){
 const service=writerCompanionSnailkitService(plugin);
 try{
  if(typeof service?.isReady!=='function'||!service.isReady()||typeof service.getTasks!=='function')return [];
  const tasks=service.getTasks({includeDone:includeDone===true});
  return Array.isArray(tasks)?tasks.map(writerCompanionSnailkitTask).filter(Boolean):[];
 }catch(_){return [];}
}
/** Called only by a user action; native find/setDone preserve concurrent edits. */
async function writerCompanionSnailkitSetDone(plugin,value,done){
 const location=writerCompanionSnailkitLocation(value);
 if(!location||typeof done!=='boolean')return null;
 const service=writerCompanionSnailkitService(plugin);
 try{
  if(typeof service?.isReady!=='function'||!service.isReady()||typeof service.find!=='function'||typeof service.setDone!=='function')return null;
  const current=service.find(location);
  if(!current||current.path!==location.path||current.raw!==location.raw)return null;
  // Resolve again after find: disabling/replacing the companion must invalidate old UI.
  if(writerCompanionSnailkitService(plugin)!==service)return null;
  const result=await service.setDone(location,done);
  return writerCompanionSnailkitTask(result);
 }catch(_){return null;}
}

/**
 * A Basic tab in Snailkit's native page/sidebar. Returns an idempotent lifecycle.
 * The common companion manager calls refresh() after preferences or plugins change.
 */
function writerCompanionSnailkitRegister(plugin,isEnabled=()=>true){
 let stopped=false,service=null,removeTab=null,refreshing=false;
 const events=[];
 const moduleOn=id=>typeof writerModuleOn==='function'?writerModuleOn(plugin,id):plugin?.settings?.visibleModules?.[id]!==false;
 const enabled=()=>{try{return !stopped&&isEnabled()===true;}catch(_){return false;}};
 const label=(pt,en)=>typeof writerUi==='function'?writerUi(pt,en):en;
 const mounts=new Set();
 const cleanup=()=>{
  const remove=removeTab;removeTab=null;service=null;
  try{remove?.();}catch(_){}
  for(const mounted of [...mounts])mounted.destroy();
 };
 const mount=el=>{
  let destroyed=false;
  el.addClass?.('basic-companion-snailkit');
  const heading=el.createEl('h3',{text:label('Escrita com Basic','Writing with Basic')});
  const description=el.createEl('p',{text:label('Abra seu projeto e suas ferramentas sem sair do painel de tarefas.','Open your project and writing tools from your task workspace.')});
  const actions=el.createDiv({cls:'basic-companion-snailkit-actions'});
  const buttons=[];
  const add=(pt,en,module,method,arg)=>{
   const button=actions.createEl('button',{text:label(pt,en),attr:{type:'button'}});
   button.addEventListener('click',()=>{
   if(destroyed||!enabled()||!writerCompanionSnailkitService(plugin)||module&&!moduleOn(module))return;
    if(typeof plugin?.[method]!=='function')return;
    try{Promise.resolve(plugin[method](arg)).catch(()=>{});}catch(_){}
   });
   buttons.push({button,module,method});
  };
  add('Projetos e manuscritos','Projects and manuscripts','projects','openProjects');
  add('Ferramentas de escrita','Writing tools','tools','openWritingTools');
  add('Opções de escrita','Writing options',null,'openCoreSettings','editorAdvanced');
  const instance={
   update(){
    if(destroyed)return;
    for(const {button,module,method} of buttons){
     const available=enabled()&&(!module||moduleOn(module))&&typeof plugin?.[method]==='function';
     button.hidden=!available;button.disabled=!available;
    }
   },
   destroy(){
    if(destroyed)return;destroyed=true;mounts.delete(instance);
    el.removeClass?.('basic-companion-snailkit');
    heading.remove?.();description.remove?.();actions.remove?.();
   }
  };
  mounts.add(instance);instance.update();return instance;
 };
 const refresh=()=>{
  if(refreshing||stopped)return;
  refreshing=true;
  try{
   const next=enabled()?writerCompanionSnailkitService(plugin):null;
   if(next===service){for(const mounted of mounts)mounted.update();return;}
   cleanup();
   if(typeof next?.addViewTab!=='function')return;
   const remove=next.addViewTab({id:'basic-writing',icon:'pen-line',label:label('Escrita · Basic','Writing · Basic'),mount});
   if(typeof remove!=='function')return;
   service=next;removeTab=remove;
   if(!enabled()||writerCompanionSnailkitService(plugin)!==next)cleanup();
  }catch(_){cleanup();}
  finally{refreshing=false;}
 };
 const stop=()=>{
  if(stopped)return;stopped=true;cleanup();
  for(const {emitter,ref} of events.splice(0))try{emitter.offref?.(ref);}catch(_){}
 };
 const workspace=plugin?.app?.workspace;
 if(typeof workspace?.on==='function'){
  for(const event of ['snailkit:services-changed','layout-ready']){
   try{events.push({emitter:workspace,ref:workspace.on(event,refresh)});}catch(_){}
  }
 }
 plugin?.register?.(stop);
 refresh();return {refresh,stop};
}
