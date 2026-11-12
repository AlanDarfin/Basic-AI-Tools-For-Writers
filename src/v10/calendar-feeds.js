'use strict';
/* Optional HTTPS iCalendar subscriptions. Read-only upstream, append-only local imports. */
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
async function writerV107CalendarFetch(plugin,url){
 const safe=writerV107CalendarUrl(url);if(!safe)throw Error('Invalid HTTPS iCalendar feed URL');
 const res=await require('obsidian').requestUrl({url:safe,headers:{Accept:'text/calendar'},method:'GET',throw:false});
 if(res.status!==200)throw Error('iCalendar returned HTTP '+res.status);
 if(String(res.text||'').length>1000000)throw Error('iCalendar feed too large');
 return res.text;
}
async function writerV107CalendarSynchronize(plugin,quiet=false){
 const cfg=writerV107CalendarConfig(plugin.settings);
 if(!cfg.enabled)return {imported:0,skipped:0,errors:0};
 let imported=0,skipped=0,errors=0;
 const folder=WRITER_V83_CAL_FOLDER;
 if(!plugin.app.vault.getAbstractFileByPath(folder))await plugin.app.vault.createFolder(folder);
 for(const url of cfg.urls.slice(0,5)){
  if(!url)continue;
  if(!writerV107CalendarUrl(url)){errors++;continue;}
  try{
   const items=writerV101IcsParse(await writerV107CalendarFetch(plugin,url),cfg.maxEvents);
   const prefix='feed-'+writerV107CalendarHash(url)+'-';
   for(const event of items){
    const valid=writerV83CalValid(event);if(!valid){skipped++;continue;}
    const id=writerV107CalendarHash(String(event.uid||'')||event.date+'|'+event.time+'|'+event.title);
    const path=folder+'/'+prefix+id+'.md';
    if(plugin.app.vault.getAbstractFileByPath(path)){skipped++;continue;}
    const body=['> [!info] '+writerUi('Assinatura iCalendar','iCalendar subscription'),
     '> '+writerUi('Evento importado. Mudanças locais são preservadas; atualizações não sobrescrevem notas existentes.','Imported event. Local edits are preserved; updates never overwrite existing notes.'),'',event.description||''].join('\n');
    await plugin.app.vault.create(path,writerV83CalFormat({...valid,category:valid.category||'iCalendar'},body));
    imported++;
   }
  }catch(error){errors++;console.warn('[Basic AI] Calendar subscription failed:',String(error.message||error).slice(0,150));}
 }
 if(!quiet)new Notice(imported+' '+writerUi('eventos novos, ','new events, ')+skipped+' '+writerUi('já importados, ','already imported, ')+errors+' '+writerUi('fontes com erro.','feeds failed.'));
 return {imported,skipped,errors};
}
function writerV107CalendarRegister(plugin){
 const cfg=writerV107CalendarConfig(plugin.settings);
 plugin.addCommand({id:'v107-sync-ical-subscriptions',name:writerUi('Calendário: atualizar assinaturas HTTPS','Calendar: sync HTTPS subscriptions'),callback:()=>void writerV107CalendarSynchronize(plugin).catch(e=>new Notice(String(e.message||e)))});
 const interval=plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.setInterval;
 if(typeof interval==='function'){
  const handler=()=>{const c=plugin.settings.v107Feeds;if(c?.enabled&&c?.autoSync&&(!plugin._writerV107FeedLast||Date.now()-plugin._writerV107FeedLast>=c.intervalHours*3600000)){
   plugin._writerV107FeedLast=Date.now();void writerV107CalendarSynchronize(plugin,true);
  }};
  const id=plugin.app.workspace.containerEl.ownerDocument.defaultView.setInterval(handler,3600000);
  plugin.register?.(()=>plugin.app.workspace.containerEl?.ownerDocument?.defaultView?.clearInterval(id));
 }
}
function writerV107CalendarSettings(plugin,panel){
 const cfg=plugin.settings.v107Feeds;
 panel.createEl('h3',{text:writerUi('Calendário · assinaturas HTTPS','Calendar · HTTPS subscriptions')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('URLs privadas podem conter tokens: são guardadas localmente nas configurações do cofre. Não envie URLs de outras pessoas. Sincronização somente de leitura; notas locais nunca são sobrescritas.','Private URLs may contain tokens and are stored locally in vault settings. Read-only import; existing local notes are never overwritten.')});
 new Setting(panel).setName(writerUi('Ativar assinaturas externas','Enable external subscriptions')).addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Atualizar automaticamente','Automatic refresh')).addToggle(t=>t.setValue(cfg.autoSync).onChange(async v=>{cfg.autoSync=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Intervalo (horas)','Refresh interval (hours)')).addSlider(s=>s.setLimits(1,24,1).setValue(cfg.intervalHours).setDynamicTooltip().onChange(async v=>{cfg.intervalHours=v;await plugin.saveSettings();}));
 for(let i=0;i<5;i++){
  new Setting(panel).setName(writerUi('Fonte ICS HTTPS ','HTTPS ICS feed ')+(i+1))
   .addText(t=>t.setValue(cfg.urls[i]||'').setPlaceholder('https://example.com/calendar.ics').onChange(async v=>{
    const list=[...cfg.urls];if(v&&!writerV107CalendarUrl(v))return;
    while(list.length<=i)list.push('');
    list[i]=v;cfg.urls=list;await plugin.saveSettings();
   }));
 }
 new Setting(panel).setName(writerUi('Sincronizar agora','Sync now')).addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(()=>void writerV107CalendarSynchronize(plugin)));
}
