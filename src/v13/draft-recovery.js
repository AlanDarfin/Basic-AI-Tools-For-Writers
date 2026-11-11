'use strict';
/* Local Longform recovery copies. Source Markdown and deliberately temporary
 * session notes are never written by this store. */
const WRITER_V134_RECOVERY_MAX=5000000;
const WRITER_V134_RECOVERY_COUNT=40;
function writerV134RecoveryPath(value,markdown=false){
 return typeof value==='string'&&value.length>0&&value.length<=1024&&
  !/^[\/]|[\\\x00-\x1f]/.test(value)&&
  value.split('/').every(part=>part&&part!=='.'&&part!=='..')&&
  (!markdown||/\.md$/i.test(value));
}
function writerV134RecoveryEntry(path,draft,updatedAt,bounded=true){
 if(!writerV134RecoveryPath(path,true)||!draft||typeof draft.original!=='string'||typeof draft.text!=='string')
  throw Error(writerUi('Rascunho de recuperação inválido.','Invalid recovery draft.'));
 if(bounded&&(draft.original.length>2000000||draft.text.length>2000000))
  throw Error(writerUi('Capítulo muito grande para a recuperação local. O texto continua no editor.','Chapter is too large for local recovery. Your text remains in the editor.'));
 const at=new Date(updatedAt);
 if(!Number.isFinite(at.getTime()))throw Error(writerUi('Data de recuperação inválida.','Invalid recovery date.'));
 return {path,original:draft.original,text:draft.text,updatedAt:at.toISOString()};
}
function writerV134RecoveryDecode(raw){
 if(typeof raw!=='string'||raw.length>WRITER_V134_RECOVERY_MAX)
  throw Error(writerUi('Arquivo de recuperação excede o limite local.','Recovery file exceeds the local limit.'));
 const data=JSON.parse(raw);
 if(!data||data.version!==1||!Array.isArray(data.entries)||data.entries.length>WRITER_V134_RECOVERY_COUNT)
  throw Error(writerUi('Formato de recuperação inválido.','Invalid recovery format.'));
 const paths=new Set();
 return data.entries.map(item=>{
  const entry=writerV134RecoveryEntry(item?.path,item,item?.updatedAt);
  if(paths.has(entry.path))throw Error(writerUi('Caminho repetido na recuperação.','Duplicate recovery path.'));
  paths.add(entry.path);return entry;
 });
}
class WriterV134DraftRecovery{
 constructor(plugin){
  this.plugin=plugin;
  plugin._writerV11Drafts??=new Map();
  this.times=new Map();this.touched=new Set(plugin._writerV11Drafts.keys());
  // Paths can be reused after a rename. Track the draft owning each in-memory
  // and persisted path so an explicit discard removes only that draft's copies.
  this.identities=new Map([...this.touched].map(path=>[path,{}]));
  this.persistedIdentities=new Map(this.identities);
  this.persisted=new Map();this.discarded=new Set();this.listeners=new Set();this.renames=[];
  this.revision=this.touched.size?1:0;this.savedRevision=0;
  this.timer=null;this.queue=Promise.resolve();this.lastGood=null;this.blocked=false;
  this.phase='loading';this.error='';this.closed=false;this.closing=false;this.closePromise=null;
  for(const path of this.touched)this.times.set(path,new Date().toISOString());
  const id=String(plugin.manifest?.id||'basic-ai-tool-for-writers');
  this.dir=plugin.manifest?.dir||String(plugin.app.vault.configDir||'.obsidian')+'/plugins/'+id;
  this.path=this.dir+'/longform-recovery.json';
  this.previousPath=this.dir+'/longform-recovery.previous.json';
  this.ready=this.load().then(()=>{
   if(this.revision!==this.savedRevision&&!this.blocked)this.schedule();
   return this;
  });
 }
 get enabled(){return this.plugin.settings?.v11Studio?.recoveryEnabled!==false;}
 get drafts(){return this.plugin._writerV11Drafts;}
 get status(){return {phase:this.phase==='error'||this.phase==='loading'?this.phase:!this.enabled?'disabled':this.phase,
  error:this.error,count:this.drafts.size};}
 notify(phase=this.phase,error=''){
  this.phase=phase;this.error=error;
  for(const listener of [...this.listeners]){
   try{listener(this.status);}catch(e){console.warn('[Basic] Recovery status listener failed:',e);}
  }
 }
 subscribe(listener){
  if(typeof listener!=='function')return ()=>{};
  this.listeners.add(listener);listener(this.status);
  return ()=>this.listeners.delete(listener);
 }
 fail(error){
  const reason=String(error?.message||error).slice(0,240);
  this.notify('error',reason);return error instanceof Error?error:Error(reason);
 }
 async readStore(path){
  const adapter=this.plugin.app.vault.adapter;
  if(!(await adapter.exists(path)))return null;
  const raw=await adapter.read(path);return {raw,entries:writerV134RecoveryDecode(raw)};
 }
 async load(){
  let loaded=null,problem=null;
  try{
   if(!writerV134RecoveryPath(this.dir))throw Error(writerUi('Pasta de recuperação inválida.','Invalid recovery folder.'));
   try{loaded=await this.readStore(this.path);}catch(error){problem=error;}
   if(!loaded){
    try{loaded=await this.readStore(this.previousPath);}catch(error){problem??=error;}
   }
   this.blocked=Boolean(problem);
   if(loaded){
    const persistedIdentities=new Map(),paths=new Map(),reserved=new Set();
    const destinations=new Map(),originalPaths=new Set(loaded.entries.map(entry=>entry.path));
    const destination=path=>{
     for(const rename of this.renames)
      if(path===rename.oldPath||path.startsWith(rename.oldPath+'/'))path=rename.newPath+path.slice(rename.oldPath.length);
     return path;
    };
    for(const entry of loaded.entries){const path=destination(entry.path);destinations.set(path,(destinations.get(path)||0)+1);}
    for(const entry of loaded.entries){
     let path=destination(entry.path);
     // A rename can collide with an orphaned recovery copy. Keep both under
     // their original paths instead of dropping whichever one loads second.
     if(path!==entry.path&&(originalPaths.has(path)||destinations.get(path)>1||this.drafts.has(path)||this.touched.has(path)))path=entry.path;
     paths.set(entry,path);
     const previous=this.persisted.get(entry.path);
     const same=!previous||(previous.original===entry.original&&previous.text===entry.text&&previous.updatedAt===entry.updatedAt);
     const identity=same&&this.persistedIdentities.get(entry.path);
     if(identity&&!reserved.has(identity)){persistedIdentities.set(entry.path,identity);reserved.add(identity);}
    }
    for(const entry of loaded.entries){
     if(persistedIdentities.has(entry.path))continue;
     const current=this.identities.get(paths.get(entry));
     const identity=current&&!reserved.has(current)?current:{};
     persistedIdentities.set(entry.path,identity);reserved.add(identity);
    }
    const origins=new Map([...persistedIdentities].map(([path,identity])=>[identity,path]));
    for(const entry of loaded.entries){
     const path=paths.get(entry),identity=persistedIdentities.get(entry.path);
     let relocated=false;
     if(this.drafts.has(path)&&this.identities.get(path)!==identity){
      const originalPath=origins.get(this.identities.get(path));
      if(originalPath&&originalPath!==path){
       // Typing can precede loading, then move onto an unknown orphan. Put
       // that moved draft back at its original vacant path and expose both.
       if(this.drafts.has(originalPath))throw Error(writerUi(
        'A renomeação encontrou rascunhos diferentes no mesmo caminho. A recuperação em disco foi preservada; salve cópias dos rascunhos e tente novamente.',
        'The rename found different drafts at the same path. Disk recovery was preserved; save draft copies and retry.'));
       this.drafts.set(originalPath,this.drafts.get(path));this.drafts.delete(path);
       this.identities.set(originalPath,this.identities.get(path));this.identities.delete(path);
       this.times.set(originalPath,this.times.get(path)||new Date().toISOString());this.times.delete(path);
       this.touched.add(originalPath);this.revision++;relocated=true;
      }
     }
     // A touched alias may now belong to a different draft. Only the owner
     // of this identity can supersede its stored copy (including a clear).
     const owned=[...this.identities.values()].includes(identity);
     if(!relocated&&(owned||this.drafts.has(path)))continue;
     this.drafts.set(path,{original:entry.original,text:entry.text});this.times.set(path,entry.updatedAt);this.identities.set(path,identity);
    }
    this.lastGood=loaded.raw;this.persisted=new Map(loaded.entries.map(entry=>[entry.path,entry]));
    this.persistedIdentities=persistedIdentities;
   }
   if(problem)throw Error(writerUi(
    'Não foi possível ler a recuperação. O arquivo será preservado; salve uma cópia do rascunho e tente novamente após reparar o arquivo. ',
    'Recovery could not be read. The file is preserved; save a draft copy and retry after repairing the file. ')+String(problem.message||problem).slice(0,160));
   this.notify(this.enabled?(this.revision!==this.savedRevision?'pending':'saved'):'disabled');
  }catch(error){this.blocked=true;this.fail(error);}
 }
 list(){
  const entries=[];
  for(const [path,draft] of this.drafts){
   try{entries.push(writerV134RecoveryEntry(path,draft,this.times.get(path)||new Date().toISOString(),false));}
   catch(_){/* Invalid legacy entries remain in memory; flush reports the error. */}
  }
  return entries.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.path.localeCompare(b.path));
 }
 identity(path){
  let identity=this.identities.get(path);
  if(!identity){
   identity={};this.identities.set(path,identity);
   // A draft may be renamed before its older disk copy finishes loading.
   if(!this.persistedIdentities.has(path))this.persistedIdentities.set(path,identity);
  }
  return identity;
 }
 capture(path,original,text){
  if(this.closed||this.closing)return false;
  try{
   const entry=writerV134RecoveryEntry(path,{original,text},new Date().toISOString(),false);
   this.identity(path);
   if(original===text){this.drafts.delete(path);this.times.delete(path);}
   else{this.drafts.set(path,{original:entry.original,text:entry.text});this.times.set(path,entry.updatedAt);}
   this.touched.add(path);this.revision++;
   if(original!==text)writerV134RecoveryEntry(path,entry,entry.updatedAt);
   this.schedule();return true;
  }catch(error){this.fail(error);return false;}
 }
 changed(){
  if(this.closed||this.closing)return;
  const now=new Date().toISOString();
  for(const path of new Set([...this.times.keys(),...this.drafts.keys(),...this.persisted.keys()])){
   this.touched.add(path);
   if(this.drafts.has(path))this.times.set(path,now);else this.times.delete(path);
  }
  this.revision++;this.schedule();
 }
 rename(oldPath,newPath){
  if(this.closed||this.closing||!writerV134RecoveryPath(oldPath)||!writerV134RecoveryPath(newPath)||oldPath===newPath)return;
  this.renames.push({oldPath,newPath});
  let changed=false;
  for(const [path,draft] of [...this.drafts]){
   if(path!==oldPath&&!path.startsWith(oldPath+'/'))continue;
   const next=newPath+path.slice(oldPath.length);
   if(this.drafts.has(next)||!writerV134RecoveryPath(next,true))continue;
   const identity=this.identity(path);this.identities.set(next,identity);this.identities.delete(path);
   this.drafts.set(next,draft);this.drafts.delete(path);
   this.times.set(next,this.times.get(path)||new Date().toISOString());this.times.delete(path);
   this.touched.add(path);this.touched.add(next);changed=true;
  }
  if(changed||this.phase==='loading'){this.revision++;this.schedule();}
 }
 schedule(){
  clearTimeout(this.timer);this.timer=null;
  if(this.closed||this.closing)return;
  if(this.blocked){this.notify('error',this.error);return;}
  this.notify(this.enabled?'pending':'disabled');
  if(!this.enabled)return;
  this.timer=setTimeout(()=>{this.timer=null;void this.flush().catch(()=>{});},600);
 }
 async mkdir(){
  const adapter=this.plugin.app.vault.adapter;let current='';
  for(const part of this.dir.split('/')){
   current=current?current+'/'+part:part;
   if(!(await adapter.exists(current))){
    try{await adapter.mkdir(current);}catch(error){if(!(await adapter.exists(current)))throw error;}
   }
  }
 }
 serialize(entries){
  if(entries.length>WRITER_V134_RECOVERY_COUNT)
   throw Error(writerUi('Limite de 40 rascunhos de recuperação atingido. Salve cópias ou descarte rascunhos; nenhum foi removido automaticamente.',
    'The 40-draft recovery limit was reached. Save copies or discard drafts; none were removed automatically.'));
  const raw=JSON.stringify({version:1,entries});
  if(raw.length>WRITER_V134_RECOVERY_MAX)
   throw Error(writerUi('A recuperação excede 5 milhões de caracteres. Salve cópias ou descarte rascunhos; o arquivo anterior foi preservado.',
    'Recovery exceeds 5 million characters. Save copies or discard drafts; the previous file was preserved.'));
  return raw;
 }
 flush(options={}){
  clearTimeout(this.timer);this.timer=null;
  if(this.closed)return Promise.resolve();
  const run=async()=>{
   await this.ready;
   try{
    if(this.blocked)throw Error(this.error||writerUi('O arquivo de recuperação precisa ser reparado.','The recovery file needs repair.'));
    while(!this.closed){
     const enabled=this.enabled;
     if(!enabled&&!options.discard){this.notify('disabled');return;}
     if(enabled&&this.revision===this.savedRevision&&!this.discarded.size){this.notify('saved');return;}
     if(!enabled&&!this.discarded.size){this.notify('disabled');return;}
     const revision=this.revision,removed=new Set(this.discarded);
     const identities=new Map(),persistedIdentities=this.persistedIdentities;
     const entries=enabled?[...this.drafts].map(([path,draft])=>{
      identities.set(path,this.identity(path));
      return writerV134RecoveryEntry(path,draft,this.times.get(path)||new Date().toISOString());
     }):[...this.persisted.values()].filter(entry=>!removed.has(persistedIdentities.get(entry.path)));
     if(!enabled)for(const entry of entries)identities.set(entry.path,persistedIdentities.get(entry.path));
     const raw=this.serialize(entries);
     this.notify(enabled?'pending':'disabled');
     await this.mkdir();
     if(this.lastGood!==null){
      // Explicit discard also removes that text from the fallback copy, so a
      // later damaged primary cannot resurrect a deliberately discarded draft.
      const previous=removed.size?this.serialize(writerV134RecoveryDecode(this.lastGood).filter(entry=>!removed.has(persistedIdentities.get(entry.path)))):this.lastGood;
      await this.plugin.app.vault.adapter.write(this.previousPath,previous);
     }
     await this.plugin.app.vault.adapter.write(this.path,raw);
     this.lastGood=raw;this.persisted=new Map(entries.map(entry=>[entry.path,entry]));
     this.persistedIdentities=identities;
     for(const identity of removed)this.discarded.delete(identity);
     if(enabled)this.savedRevision=revision;
     if(!this.enabled){this.notify('disabled');return;}
     if(this.revision===revision){this.notify('saved');return;}
    }
   }catch(error){throw this.fail(error);}
  };
  const result=this.queue.then(run);this.queue=result.then(()=>{},()=>{});return result;
 }
 async discard(entry){
  await this.ready;
  if(this.closed||this.closing)throw Error(writerUi('A recuperação foi encerrada.','Recovery has closed.'));
  const current=this.drafts.get(entry?.path);
  if(!current||current.original!==entry.original||current.text!==entry.text)
   throw Error(writerUi('O rascunho mudou. Reabra a recuperação antes de descartá-lo.','The draft changed. Reopen recovery before discarding it.'));
  const at=this.times.get(entry.path);
  const identity=this.identity(entry.path);
  this.drafts.delete(entry.path);this.times.delete(entry.path);this.touched.add(entry.path);
  this.identities.delete(entry.path);this.discarded.add(identity);this.revision++;
  try{await this.flush({discard:true});}
  catch(error){
   if(!this.drafts.has(entry.path)){
    this.drafts.set(entry.path,current);this.times.set(entry.path,at||new Date().toISOString());this.revision++;
    this.identities.set(entry.path,identity);
   }
   this.discarded.delete(identity);throw error;
  }
 }
 async retry(){
  if(this.closed||this.closing)return;
  const reloaded=this.queue.then(async()=>{
   if(this.closed||this.closing)return;
   this.notify('loading');
   await this.load();
   if(this.blocked)throw Error(this.error);
   this.savedRevision=-1;
  });
  this.queue=reloaded.then(()=>{},()=>{});
  await reloaded;
  if(this.closed||this.closing)return;
  return this.flush();
 }
 close(){
  if(this.closePromise)return this.closePromise;
  this.closing=true;clearTimeout(this.timer);this.timer=null;
  this.closePromise=this.flush().finally(()=>{this.closed=true;this.listeners.clear();});
  return this.closePromise;
 }
}
function writerV134Recovery(plugin){
 return plugin._writerV134Recovery??=(new WriterV134DraftRecovery(plugin));
}
