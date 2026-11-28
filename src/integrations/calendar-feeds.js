'use strict';
/* Optional HTTPS iCalendar subscriptions. Read-only upstream, append-only local imports. */
const writerV107CalendarSessions=new WeakMap();
function writerV107CalendarSession(plugin,renew=false){
 const previous=writerV107CalendarSessions.get(plugin);
 if(previous&&(!previous.closed||!renew))return previous;
 const session={closed:false,registered:false,run:null,revision:0,automaticRevision:0,lastAutomatic:null,stopInterval:null};
 writerV107CalendarSessions.set(plugin,session);
 plugin.register?.(()=>{
  session.closed=true;
  session.stopInterval?.();
  session.stopInterval=null;
 });
 return session;
}
function writerV107CalendarConfig(settings){
 const old=settings.v107Feeds&&typeof settings.v107Feeds==='object'&&!Array.isArray(settings.v107Feeds)?settings.v107Feeds:{};
 const urls=Array.isArray(old.urls)?Array.from(old.urls.slice(0,5),value=>typeof value==='string'?value:''):[];
 return settings.v107Feeds=Object.assign(old,{enabled:false,autoSync:false,intervalHours:6,urls,maxEvents:160,...old,
  urls,intervalHours:Math.max(1,Math.min(24,Number(old.intervalHours)||6)),maxEvents:Math.max(20,Math.min(300,Number(old.maxEvents)||160))});
}
function writerV107CalendarUrl(value){
 const text=String(value||'').trim();
 if(text.length>1500||!/^https:\/\//i.test(text))return '';
 try{
  const url=new URL(text);
  if(url.username||url.password||url.port&&url.port!=='443'||url.hash)return '';
  if(!url.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1)/i.test(url.hostname))return '';
  return url.toString();
 }catch(_){return '';}
}
function writerV107CalendarHash(value){
 let hash=2166136261;
 for(const ch of String(value)){hash=Math.imul(hash^ch.charCodeAt(0),16777619);}
 return (hash>>>0).toString(36);
}
async function writerV107CalendarFetch(url){
 const safe=writerV107CalendarUrl(url);if(!safe)throw Error('Invalid HTTPS iCalendar feed URL');
 const res=await require('obsidian').requestUrl({url:safe,headers:{Accept:'text/calendar'},method:'GET',throw:false});
 if(res.status!==200)throw Error('iCalendar returned HTTP '+res.status);
 if(String(res.text||'').length>1000000)throw Error('iCalendar feed too large');
 return res.text;
}
async function writerV107CalendarImport(plugin,run,current){
 let imported=0,skipped=0,errors=0;
 const folder=WRITER_V83_CAL_FOLDER,vault=plugin.app.vault;
 if(!vault.getAbstractFileByPath(folder))await vault.createFolder(folder);
 for(const url of run.urls){
  if(!current())break;
  if(!url)continue;
  if(!writerV107CalendarUrl(url)){errors++;continue;}
  try{
   const response=await writerV107CalendarFetch(url);
   if(!current())break;
   const items=writerV101IcsParse(response,run.maxEvents);
   const prefix='feed-'+writerV107CalendarHash(url)+'-';
   for(const event of items){
    if(!current())break;
    const valid=writerV83CalValid(event);if(!valid){skipped++;continue;}
    const id=writerV107CalendarHash(String(event.uid||'')||event.date+'|'+event.time+'|'+event.title);
    const path=folder+'/'+prefix+id+'.md';
    if(vault.getAbstractFileByPath(path)){skipped++;continue;}
    const body=['> [!info] '+writerUi('Assinatura iCalendar','iCalendar subscription'),
     '> '+writerUi('Evento importado. Mudanças locais são preservadas; atualizações não sobrescrevem notas existentes.','Imported event. Local edits are preserved; updates never overwrite existing notes.'),'',event.description||''].join('\n');
    await vault.create(path,writerV83CalFormat({...valid,category:valid.category||'iCalendar'},body));
    imported++;
   }
  }catch(_){
   if(!current())break;
   errors++;
   console.warn('[Basic AI] Calendar subscription failed.');
  }
 }
 if(current()&&run.notify)new Notice(imported+' '+writerUi('eventos novos, ','new events, ')+skipped+' '+writerUi('já importados, ','already imported, ')+errors+' '+writerUi('fontes com erro.','feeds failed.'));
 return {imported,skipped,errors};
}
async function writerV107CalendarSynchronize(plugin,quiet=false,session=writerV107CalendarSession(plugin),automatic=false){
 if(session.closed)return {imported:0,skipped:0,errors:0};
 const cfg=writerV107CalendarConfig(plugin.settings);
 if(!cfg.enabled||(automatic&&!cfg.autoSync))return {imported:0,skipped:0,errors:0};
 const pending=session.run;
 if(pending){
  if(pending.current()){
   if(!quiet)pending.notify=true;
   return pending.promise;
  }
  // An already-dispatched vault write can still finish. Wait before another import starts.
  pending.invalidated=true;
  const {revision,automaticRevision}=session;
  await pending.promise;
  if(session.revision!==revision||(automatic&&session.automaticRevision!==automaticRevision))return {imported:0,skipped:0,errors:0};
  return writerV107CalendarSynchronize(plugin,quiet,session,automatic);
 }
 const {revision,automaticRevision}=session;
 const run={notify:!quiet,automatic,invalidated:false,urls:cfg.urls.slice(),maxEvents:cfg.maxEvents};
 const current=()=>!session.closed&&session.run===run&&!run.invalidated&&session.revision===revision&&plugin.settings.v107Feeds===cfg&&cfg.enabled&&
  (!run.automatic||run.notify||(cfg.autoSync&&session.automaticRevision===automaticRevision))&&cfg.maxEvents===run.maxEvents&&cfg.urls.length===run.urls.length&&
  run.urls.every((url,index)=>cfg.urls[index]===url);
 run.current=current;
 session.run=run;
 run.promise=writerV107CalendarImport(plugin,run,current).catch(error=>{
  if(current()&&run.notify)new Notice(String(error.message||error));
  return {imported:0,skipped:0,errors:1};
 }).finally(()=>{if(session.run===run)session.run=null;});
 return run.promise;
}
function writerV107CalendarRegister(plugin){
 const session=writerV107CalendarSession(plugin,true);
 if(session.registered)return;
 session.registered=true;
 writerV107CalendarConfig(plugin.settings);
 plugin.addCommand({id:'v107-sync-ical-subscriptions',name:writerUi('Calendário: atualizar assinaturas HTTPS','Calendar: sync HTTPS subscriptions'),callback:()=>void writerV107CalendarSynchronize(plugin,false,session)});
 const win=plugin.app.workspace.containerEl?.ownerDocument?.defaultView;
 if(typeof win?.setInterval==='function'){
  const handler=()=>{const c=plugin.settings.v107Feeds;if(!session.closed&&c?.enabled&&c?.autoSync&&(session.lastAutomatic===null||Date.now()-session.lastAutomatic>=c.intervalHours*3600000)){
   session.lastAutomatic=Date.now();void writerV107CalendarSynchronize(plugin,true,session,true);
  }};
  const id=win.setInterval(handler,3600000);
  session.stopInterval=()=>win.clearInterval(id);
 }
}
function writerV107CalendarSettings(plugin,panel){
 const cfg=plugin.settings.v107Feeds;
 const session=writerV107CalendarSession(plugin);
 panel.createEl('h3',{text:writerUi('Calendário · assinaturas HTTPS','Calendar · HTTPS subscriptions')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('URLs privadas podem conter tokens: são guardadas localmente nas configurações do cofre. Não envie URLs de outras pessoas. Sincronização somente de leitura; notas locais nunca são sobrescritas.','Private URLs may contain tokens and are stored locally in vault settings. Read-only import; existing local notes are never overwritten.')});
 new Setting(panel).setName(writerUi('Ativar assinaturas externas','Enable external subscriptions')).addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{
  cfg.enabled=v;
  if(!v)session.revision++;
  await plugin.saveSettings();
 }));
 new Setting(panel).setName(writerUi('Atualizar automaticamente','Automatic refresh')).addToggle(t=>t.setValue(cfg.autoSync).onChange(async v=>{
  cfg.autoSync=v;
  if(!v)session.automaticRevision++;
  await plugin.saveSettings();
 }));
 new Setting(panel).setName(writerUi('Intervalo (horas)','Refresh interval (hours)')).addSlider(s=>s.setLimits(1,24,1).setValue(cfg.intervalHours).setDynamicTooltip().onChange(async v=>{cfg.intervalHours=v;await plugin.saveSettings();}));
 for(let i=0;i<5;i++){
  new Setting(panel).setName(writerUi('Fonte ICS HTTPS ','HTTPS ICS feed ')+(i+1))
   .addText(t=>t.setValue(cfg.urls[i]||'').setPlaceholder('https://example.com/calendar.ics').onChange(async v=>{
    const list=[...cfg.urls];if(v&&!writerV107CalendarUrl(v))return;
    while(list.length<=i)list.push('');
    if(list[i]!==v)session.revision++;
    list[i]=v;cfg.urls=list;await plugin.saveSettings();
   }));
 }
 new Setting(panel).setName(writerUi('Sincronizar agora','Sync now')).addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(()=>void writerV107CalendarSynchronize(plugin,false,session)));
}
