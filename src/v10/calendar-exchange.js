'use strict';
/* RFC 5545 subset for offline .ics import/export; never connects to remote calendars. */
function writerV101CalendarExchangeMerge(settings){
 const old=settings.v101CalendarExchange&&typeof settings.v101CalendarExchange==='object'?settings.v101CalendarExchange:{};
 const cfg=settings.v101CalendarExchange={enabled:true,maxImport:150, ...old};
 cfg.maxImport=Math.max(10,Math.min(300,Number(cfg.maxImport)||150));
 return cfg;
}
function writerV101IcsUnescape(raw){
 return String(raw||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
}
function writerV101IcsDate(value){
 const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(value||''));
 if(!m)return null;
 const day=m[1]+'-'+m[2]+'-'+m[3],time=m[4]?m[4]+':'+m[5]:'';
 if(typeof writerV83Date==='function'&&!writerV83Date(day))return null;
 if(m[7]){
  const date=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]||0)));
  if(!Number.isFinite(date.getTime()))return null;
  return {date:writerV83DateOf(date),time:String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')};
 }
 return {date:day,time};
}
function writerV101IcsParse(text,limit=150){
 const raw=String(text||'');
 if(raw.length>500000||!raw.includes('BEGIN:VCALENDAR'))return [];
 const lines=raw.replace(/\r\n[ \t]/g,'').replace(/\r/g,'').split('\n');
 let current=null;const events=[];
 for(const line of lines){
  if(line.trim()==='BEGIN:VEVENT'){current={};continue;}
  if(line.trim()==='END:VEVENT'){
   if(current){
    const from=writerV101IcsDate(current.DTSTART);
    if(from&&current.SUMMARY){
     const to=writerV101IcsDate(current.DTEND);
     const type=/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i.exec(current.RRULE||'')?.[1]?.toLowerCase()||'none';
     events.push({title:writerV101IcsUnescape(current.SUMMARY).slice(0,160),
      date:from.date,time:from.time,endTime:to?.date===from.date?to.time:'',
      repeat:type,description:writerV101IcsUnescape(current.DESCRIPTION||'').slice(0,2000),
      uid:String(current.UID||'').slice(0,250)});
    }
   }
   current=null;if(events.length>=limit)break;continue;
  }
  if(!current)continue;
  const m=/^([A-Z-]+)(?:;[^:]*)?:(.*)$/.exec(line);
  if(m&&['SUMMARY','DTSTART','DTEND','RRULE','DESCRIPTION','UID'].includes(m[1]))current[m[1]]=m[2];
 }
 return events;
}
function writerV101IcsEscape(value){
 return String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').slice(0,10000);
}
function writerV101IcsEncodeDate(date,time){
 return String(date||'').replace(/-/g,'')+(time?'T'+String(time).replace(':','')+'00':'');
}
function writerV101IcsExport(events){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Basic AI Tool for Writers//Calendar Exchange//EN','CALSCALE:GREGORIAN'];
 for(const event of events.slice(0,900)){
  if(!event.date||!event.title)continue;
  const uid='basic-ai-'+String(event.path||event.title+'-'+event.date).replace(/[^a-zA-Z0-9-]/g,'-').slice(0,170)+'@local';
  lines.push('BEGIN:VEVENT','UID:'+uid,'SUMMARY:'+writerV101IcsEscape(event.title),
   (event.time?'DTSTART:':'DTSTART;VALUE=DATE:')+writerV101IcsEncodeDate(event.date,event.time));
  // Set a valid one-hour default for timed events; one-day for all-day dates.
  if(event.time){
   const [h,m]=event.time.split(':').map(Number);
   const end=event.endTime||String((h+1)%24).padStart(2,'0')+':'+String(m).padStart(2,'0');
   lines.push('DTEND:'+writerV101IcsEncodeDate(event.date,end));
  }
  if(['daily','weekly','monthly','yearly'].includes(event.repeat))lines.push('RRULE:FREQ='+event.repeat.toUpperCase());
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 return lines.join('\r\n')+'\r\n';
}
async function writerV101IcsSave(plugin,text,pathPrefix){
 const folder=WRITER_V83_CAL_FOLDER;
 if(!plugin.app.vault.getAbstractFileByPath(folder))await plugin.app.vault.createFolder(folder);
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 let path=folder+'/'+pathPrefix+'-'+stamp+'.ics',i=2;
 while(plugin.app.vault.getAbstractFileByPath(path))path=folder+'/'+pathPrefix+'-'+stamp+'-'+i+++'.ics';
 return plugin.app.vault.create(path,text);
}
async function writerV101IcsImport(plugin,source){
 const text=await plugin.app.vault.read(source);
 const events=writerV101IcsParse(text,plugin.settings.v101CalendarExchange.maxImport);
 if(!events.length){new Notice(writerUi('Nenhum evento válido encontrado.','No valid events found.'));return;}
 const folder=WRITER_V83_CAL_FOLDER,modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Importar eventos do ICS','Import ICS calendar events'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{text:events.length+' '+writerUi('eventos serão importados como notas Markdown novas. Notas existentes nunca são substituídas.','events will be imported as new Markdown notes. Existing notes are never overwritten.')});
  root.createEl('small',{text:events.slice(0,12).map(e=>e.date+' · '+e.title).join('\n'),cls:'writer-v101-ics-preview'});
  new Setting(root).addButton(btn=>btn.setButtonText(writerUi('Criar eventos','Create events')).setCta().onClick(async()=>{
   btn.setDisabled(true);let count=0;
   try{
    if(!plugin.app.vault.getAbstractFileByPath(folder))await plugin.app.vault.createFolder(folder);
    const existing=await writerV83CalEvents(plugin);
    const signatures=new Set(existing.map(e=>e.title+'|'+e.date+'|'+e.time));
    for(const event of events){
     const signature=event.title+'|'+event.date+'|'+event.time;
     if(signatures.has(signature))continue;
     const valid=writerV83CalValid(event);if(!valid)continue;
     let path=folder+'/'+event.date+'-ics-event.md',n=2;
     while(plugin.app.vault.getAbstractFileByPath(path))path=folder+'/'+event.date+'-ics-event-'+n+++'.md';
     const body=(event.description||'').replace(/^---/gm,'\\---');
     await plugin.app.vault.create(path,writerV83CalFormat(valid,body));
     signatures.add(signature);count++;
    }
    modal.close();new Notice(count+' '+writerUi('novos eventos importados.','new events imported.'));
   }catch(error){new Notice(writerUi('Importação interrompida após ','Import stopped after ')+count+': '+String(error.message||error));}
   finally{btn.setDisabled(false);}
  }));
 };
 modal.open();
}
function writerV101IcsChoose(plugin){
 const files=plugin.app.vault.getFiles?.().filter(f=>String(f.extension).toLowerCase()==='ics'&&Number(f.stat?.size||0)<500000)||[];
 if(!files.length){new Notice(writerUi('Coloque um arquivo .ics no cofre para importá-lo.','Place a .ics file in your vault to import it.'));return;}
 const ModalClass=require('obsidian').FuzzySuggestModal;
 const modal=new (class extends ModalClass{
  getItems(){return files;}
  getItemText(file){return file.path;}
  onChooseItem(file){void writerV101IcsImport(plugin,file).catch(error=>new Notice(String(error.message||error)));}
 })(plugin.app);
 modal.setPlaceholder(writerUi('Escolha um arquivo ICS do cofre…','Choose an ICS file from the vault…'));modal.open();
}
function writerV101RegisterCalendarExchange(plugin){
 plugin.addCommand({id:'v101-calendar-import-ics',name:writerUi('Calendário: importar arquivo ICS local','Calendar: import local ICS file'),
  callback:()=>writerV101IcsChoose(plugin)});
 plugin.addCommand({id:'v101-calendar-export-ics',name:writerUi('Calendário: exportar agenda para ICS','Calendar: export schedule to ICS'),
  callback:async()=>{
   const events=await writerV83CalEvents(plugin);
   if(!events.length){new Notice(writerUi('Nenhum evento para exportar.','No events to export.'));return;}
   try{const file=await writerV101IcsSave(plugin,writerV101IcsExport(events),'calendar-export');
    new Notice(writerUi('ICS criado em ','ICS created at ')+file.path);}
   catch(error){new Notice(String(error.message||error));}
  }});
}
function writerV101CalendarExchangeSettings(plugin,panel){
 const cfg=plugin.settings.v101CalendarExchange;
 panel.createEl('h3',{text:writerUi('Intercâmbio de calendário (.ics)','Calendar exchange (.ics)')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Importação/exportação manual e offline. Não sincroniza Google Calendar ou outros serviços online.','Manual offline import/export; does not sync Google Calendar or online services.')});
 new Setting(panel).setName(writerUi('Limite de importação por vez','Events per import'))
  .addSlider(s=>s.setLimits(10,300,10).setDynamicTooltip().setValue(cfg.maxImport)
   .onChange(async v=>{cfg.maxImport=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Importar ICS','Import ICS'))
  .addButton(b=>b.setButtonText(writerUi('Escolher arquivo','Choose file')).onClick(()=>writerV101IcsChoose(plugin)));
 new Setting(panel).setName(writerUi('Exportar agenda','Export calendar'))
  .addButton(b=>b.setButtonText(writerUi('Exportar','Export')).onClick(()=>plugin.app.commands.executeCommandById(plugin.manifest.id+':v101-calendar-export-ics')));
}
