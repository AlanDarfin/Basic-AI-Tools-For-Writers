'use strict';
/* v9 calendar workspace: responsive mini-calendar, agenda, day/3-day/week timeline,
 * recurrence-aware event editor and localized settings. Only local Markdown data. */
const WRITER_V9_CAL_VIEWS=['month','week','three','day','agenda'];
const WRITER_V9_CAL_VIEW_OPTIONS=[['month','Mês','Month'],['week','Semana','Week'],['three','3 dias','3 days'],['day','Dia','Day'],['agenda','Agenda','Agenda']];
const WRITER_V9_CAL_REPEAT=[['none','Não repetir','Does not repeat'],['daily','Diariamente','Daily'],['weekly','Semanalmente','Weekly'],['monthly','Mensalmente','Monthly'],['yearly','Anualmente','Yearly']];
function writerV9CalendarMerge(settings){
 const prior=settings.v9Calendar&&typeof settings.v9Calendar==='object'&&!Array.isArray(settings.v9Calendar)?settings.v9Calendar:{};
 const cfg=settings.v9Calendar={
  defaultView:'month',showSidebar:true,showSidebarMobile:false,compactMonth:true,
  startHour:7,endHour:21,maxMonthEvents:3,...prior
 };
 cfg.defaultView=WRITER_V9_CAL_VIEWS.includes(cfg.defaultView)?cfg.defaultView:'month';
 cfg.showSidebar=cfg.showSidebar!==false;cfg.showSidebarMobile=cfg.showSidebarMobile===true;
 cfg.compactMonth=cfg.compactMonth!==false;
 cfg.startHour=Math.max(0,Math.min(20,Number.isFinite(Number(cfg.startHour))?Math.floor(Number(cfg.startHour)):7));
 cfg.endHour=Math.max(cfg.startHour+1,Math.min(24,Math.floor(Number(cfg.endHour)||21)));
 cfg.maxMonthEvents=Math.max(1,Math.min(5,Math.floor(Number(cfg.maxMonthEvents)||3)));
 return cfg;
}
function writerV9CalendarLabel(date,format){
 return new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),format).format(new Date(date+'T12:00:00'));
}
function writerV9CalendarWeek(date){
 const diff=(writerV9CalWeekday(date)+6)%7;
 return writerV83ShiftDay(date,-diff);
}
function writerV9CalendarPeriod(view){
 const selected=view.anchor,mode=view.mode;
 if(mode==='day')return {start:selected,end:selected};
 if(mode==='three')return {start:selected,end:writerV83ShiftDay(selected,2)};
 if(mode==='week')return {start:writerV9CalendarWeek(selected),end:writerV83ShiftDay(writerV9CalendarWeek(selected),6)};
 if(mode==='agenda')return {start:selected,end:writerV83ShiftDay(selected,29)};
 const d=new Date(selected+'T12:00:00');
 return {start:writerV83DateOf(new Date(d.getFullYear(),d.getMonth(),1)),
  end:writerV83DateOf(new Date(d.getFullYear(),d.getMonth()+1,0))};
}
function writerV9CalRows(view,start,end){
 const rows=[];
 for(const event of view.events)rows.push(...writerV83CalOccurrence(event,start,end));
 rows.sort((a,b)=>a.occurs.localeCompare(b.occurs)||(a.time||'').localeCompare(b.time||'')||a.title.localeCompare(b.title));
 return view.writerV9CategoryFilter?rows.filter(event=>(event.category||'')===view.writerV9CategoryFilter):rows;
}
function writerV9CalButton(parent,label,icon,click,title){
 const btn=parent.createEl('button',{cls:'writer-v9-calendar-button',attr:{type:'button','aria-label':title||label,title:title||label}});
 if(icon)require('obsidian').setIcon(btn,icon);
 if(label)btn.createSpan({text:label});
 btn.addEventListener('click',click);
 return btn;
}
function writerV9CalEditor(view,occurrence){
 const event=occurrence||{date:view.anchor,repeat:'none'},old=event.path?{...event}:null;
 const recurring=Boolean(old&&old.repeat&&old.repeat!=='none');
 const occurrenceDate=event.occurs||event.date;
 const modal=new Modal(view.app),plugin=view.plugin;
 modal.onOpen=()=>{
  modal.setTitle(old?writerUi('Editar evento','Edit event'):writerUi('Novo evento','New event'));
  const root=modal.contentEl;root.empty();root.addClass('writer-v9-event-modal');
  let scope='series';
  const data={title:event.title||'',date:recurring?event.date:(event.date||view.anchor),
   time:event.time||'',endTime:event.endTime||'',category:event.category||'',
   location:event.location||'',details:event.details||'',color:event.color||'rose',
   repeat:event.repeat||'none',repeatInterval:event.repeatInterval||1,
   repeatUntil:event.repeatUntil||'',repeatDays:writerV9CalWeekdays(event.repeatDays),
   exceptions:writerV9CalDates(event.exceptions),
   recurrenceParent:event.recurrenceParent||'',recurrenceDate:event.recurrenceDate||''};
  const addInput=(key,pt,en,type='text')=>{
   const row=root.createEl('label',{cls:'writer-v9-event-field'});
   row.createSpan({text:writerUi(pt,en)});
   const control=row.createEl('input',{attr:{type,'aria-label':writerUi(pt,en)}});
   control.value=String(data[key]||'');
   control.addEventListener('input',()=>{data[key]=control.value;});
   return control;
  };
  addInput('title','Título','Title');
  const times=root.createDiv({cls:'writer-v9-event-grid'});
  const field=(key,pt,en,type='text')=>{
   const row=times.createEl('label',{cls:'writer-v9-event-field'});
   row.createSpan({text:writerUi(pt,en)});
   const input=row.createEl('input',{attr:{type,'aria-label':writerUi(pt,en)}});
   input.value=String(data[key]||'');
   input.addEventListener('input',()=>{data[key]=input.value;});
   return input;
  };
  const dateInput=field('date','Data','Date','date');
  field('time','Início · deixe vazio para dia inteiro','Starts · blank for all day','time');
  field('endTime','Término','End time','time');
  field('category','Categoria / calendário','Category / calendar');
  addInput('location','Local','Location');
  const colorRow=root.createEl('label',{cls:'writer-v9-event-field'});
  colorRow.createSpan({text:writerUi('Cor','Color')});
  const color=colorRow.createEl('select',{attr:{'aria-label':writerUi('Cor','Color')}});
  for(const [id,pt,en] of [['rose','Rosa','Rose'],['orange','Laranja','Orange'],['amber','Amarelo','Amber'],['green','Verde','Green'],['blue','Azul','Blue'],['purple','Roxo','Purple'],['slate','Cinza','Slate']]){
   const option=color.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  color.value=data.color;
  color.addEventListener('change',()=>{data.color=color.value;});
  const repeatRow=root.createEl('label',{cls:'writer-v9-event-field'});
  repeatRow.createSpan({text:writerUi('Repetição','Repeat')});
  const repeat=repeatRow.createEl('select',{attr:{'aria-label':writerUi('Repetição','Repeat')}});
  for(const [id,pt,en] of WRITER_V9_CAL_REPEAT){
   const option=repeat.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  repeat.value=data.repeat;
  const recur=root.createDiv({cls:'writer-v9-event-recurrence'});
  const recGrid=recur.createDiv({cls:'writer-v9-event-grid'});
  const every=recGrid.createEl('label',{cls:'writer-v9-event-field'});
  every.createSpan({text:writerUi('A cada (intervalo)','Every (interval)')});
  const interval=every.createEl('input',{attr:{type:'number',min:'1',max:'52','aria-label':writerUi('Intervalo','Interval')}});
  interval.value=String(data.repeatInterval);
  interval.addEventListener('input',()=>{data.repeatInterval=interval.value;});
  const until=recGrid.createEl('label',{cls:'writer-v9-event-field'});
  until.createSpan({text:writerUi('Repetir até (opcional)','Repeat until (optional)')});
  const untilInput=until.createEl('input',{attr:{type:'date','aria-label':writerUi('Repetir até','Repeat until')}});
  untilInput.value=data.repeatUntil;untilInput.addEventListener('input',()=>{data.repeatUntil=untilInput.value;});
  const days=recur.createDiv({cls:'writer-v9-event-weekdays'});
  const weekdays=[['seg','Mon',1],['ter','Tue',2],['qua','Wed',3],['qui','Thu',4],['sex','Fri',5],['sáb','Sat',6],['dom','Sun',0]];
  for(const [pt,en,n] of weekdays){
   const label=days.createEl('label');
   const check=label.createEl('input',{attr:{type:'checkbox','aria-label':writerUi(pt,en)}});
   check.checked=data.repeatDays.includes(n);
   check.addEventListener('change',()=>{
    data.repeatDays=check.checked?[...new Set([...data.repeatDays,n])]:data.repeatDays.filter(x=>x!==n);
   });
   label.createSpan({text:writerUi(pt,en)});
  }
  const adjustRepeat=()=>{
   recur.hidden=repeat.value==='none';
   days.hidden=repeat.value!=='weekly';
  };
  repeat.addEventListener('change',()=>{data.repeat=repeat.value;adjustRepeat();});adjustRepeat();
  const details=root.createEl('label',{cls:'writer-v9-event-field'});
  details.createSpan({text:writerUi('Descrição','Description')});
  const textarea=details.createEl('textarea',{attr:{rows:'3','aria-label':writerUi('Descrição','Description')}});
  textarea.value=data.details;textarea.addEventListener('input',()=>{data.details=textarea.value;});
  if(recurring){
   const scopeRow=root.createEl('label',{cls:'writer-v9-event-field'});
   scopeRow.createSpan({text:writerUi('Alterar','Change')});
   const pick=scopeRow.createEl('select',{attr:{'aria-label':writerUi('Escopo da alteração','Change scope')}});
   for(const [id,pt,en] of [['single','Somente esta ocorrência','This occurrence only'],['series','Toda a série','Entire series']]){
    const opt=pick.createEl('option',{text:writerUi(pt,en)});opt.value=id;
   }
   scope='single';pick.value=scope;
   const sync=()=>{
    scope=pick.value;
    if(scope==='single'){
     dateInput.value=occurrenceDate;data.date=occurrenceDate;
     repeat.value='none';data.repeat='none';
     repeat.disabled=true;adjustRepeat();
    }else{
     dateInput.value=old.date;data.date=old.date;
     repeat.disabled=false;repeat.value=old.repeat;data.repeat=old.repeat;adjustRepeat();
    }
   };
   pick.addEventListener('change',sync);sync();
  }
  const status=root.createEl('p',{cls:'writer-v83-cal-status',attr:{role:'status'}});
  const actions=root.createDiv({cls:'writer-v83-cal-form-actions'});
  const save=writerV9CalButton(actions,writerUi('Salvar','Save'),'check',async()=>{
   const valid=writerV83CalValid(data);
   if(!valid){status.setText(writerUi('Confira título, data, intervalo e horários.','Check title, date, interval and times.'));return;}
   save.disabled=true;
   try{
    if(recurring&&scope==='single'){
     const single={...valid,repeat:'none',repeatInterval:1,repeatUntil:'',repeatDays:[],exceptions:[],
      recurrenceParent:old.path,recurrenceDate:occurrenceDate};
     // Create first, then exclude original occurrence; rollback a newly created note on conflict.
     const created=await writerV9CalCreate(view,single);
     try{await writerV9CalExclude(view,old,occurrenceDate);}
     catch(error){await view.app.vault.trash(created,false);throw error;}
    }else await view.save(valid,old);
    modal.close();
   }catch(error){status.setText(String(error.message||error));save.disabled=false;}
  });
  save.addClass('mod-cta');
  if(old?.path){
   writerV9CalButton(actions,writerUi('Nota','Open note'),'file-text',()=>{
    const file=view.app.vault.getAbstractFileByPath(old.path);
    if(file instanceof TFile){modal.close();void view.app.workspace.getLeaf('tab').openFile(file);}
   });
   const remove=writerV9CalButton(actions,recurring?writerUi('Excluir ocorrência','Delete occurrence'):writerUi('Excluir evento','Delete event'),'trash-2',async()=>{
    if(remove.dataset.confirm!=='yes'){
     remove.dataset.confirm='yes';
     remove.setText(writerUi('Confirmar exclusão','Confirm deletion'));
     return;
    }
    remove.disabled=true;
    try{
     if(recurring&&scope==='single')await writerV9CalExclude(view,old,occurrenceDate);
     else{
      const file=view.app.vault.getAbstractFileByPath(old.path);
      if(!(file instanceof TFile))throw Error(writerUi('Nota não encontrada.','Note not found.'));
      const content=await view.app.vault.cachedRead(file);
      if(!writerV9CalSame(writerV83CalParse(content,file.path),old))
       throw Error(writerUi('Evento alterado em outro lugar.','Event changed elsewhere.'));
      await view.app.vault.trash(file,false);await view.load();
     }
     modal.close();
    }catch(e){status.setText(String(e.message||e));remove.disabled=false;}
   });
   remove.addClass('writer-v9-event-delete');
  }
  writerV9CalButton(actions,writerUi('Cancelar','Cancel'),null,()=>modal.close());
 };
 modal.open();
}
const writerV9OldCalendarOpen=WriterV83CalendarView.prototype.onOpen;
WriterV83CalendarView.prototype.onOpen=async function(){
 const cfg=writerV9CalendarMerge(this.plugin.settings);
 this.mode=cfg.defaultView;
 this.writerV9SidebarOpen=writerV8HomeIsMobile(this.plugin)?cfg.showSidebarMobile:cfg.showSidebar;
 this.writerV9CategoryFilter='';
 await writerV9OldCalendarOpen.call(this);
};
WriterV83CalendarView.prototype.range=function(){return writerV9CalendarPeriod(this);};
WriterV83CalendarView.prototype.save=async function(event,old){
 const valid=writerV83CalValid(event);
 if(!valid)throw Error(writerUi('Dados de evento inválidos.','Invalid event data.'));
 let file;
 if(old?.path){
  await writerV9CalUpdateSeries(this,old,()=>valid);
  file=this.app.vault.getAbstractFileByPath(old.path);
 }else file=await writerV9CalCreate(this,valid);
 await this.load();return file;
};
WriterV83CalendarView.prototype.edit=function(event){writerV9CalEditor(this,event);};
function writerV9MiniMonth(view,parent){
 const d=new Date(view.anchor+'T12:00:00'),year=d.getFullYear(),month=d.getMonth();
 const header=parent.createDiv({cls:'writer-v9-mini-header'});
 header.createEl('strong',{text:writerV9CalendarLabel(writerV83DateOf(new Date(year,month,1)),{month:'long',year:'numeric'})});
 const grid=parent.createDiv({cls:'writer-v9-mini-month'});
 for(let i=0;i<7;i++)grid.createSpan({text:writerV9CalendarLabel(writerV83DateOf(new Date(2024,0,1+i)),{weekday:'narrow'})});
 const first=new Date(year,month,1),pad=(first.getDay()+6)%7;
 for(let i=0;i<pad;i++)grid.createSpan({text:''});
 const count=new Date(year,month+1,0).getDate();
 for(let i=1;i<=count;i++){
  const date=writerV83DateOf(new Date(year,month,i));
  const btn=grid.createEl('button',{text:String(i),cls:'writer-v9-mini-date'+(date===view.anchor?' is-selected':'')+(date===writerV83DateOf(new Date())?' is-today':'')});
  btn.addEventListener('click',()=>{view.anchor=date;view.render();});
 }
}
function writerV9CalendarSidebar(view,parent){
 const section=parent.createEl('aside',{cls:'writer-v9-calendar-side',attr:{'aria-label':writerUi('Navegação e eventos','Navigation and events')}});
 writerV9MiniMonth(view,section);
 const add=writerV9CalButton(section,writerUi('Criar evento','Create event'),'plus',()=>view.edit({date:view.anchor}));
 add.addClass('writer-v9-calendar-create');
 const categories=[...new Set(view.events.map(e=>e.category||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const filter=section.createDiv({cls:'writer-v9-calendar-filters'});
 filter.createEl('h4',{text:writerUi('Calendários','Calendars')});
 const select=filter.createEl('select',{attr:{'aria-label':writerUi('Filtrar calendário','Filter calendar')}});
 const all=select.createEl('option',{text:writerUi('Todos os eventos','All events')});all.value='';
 for(const name of categories){const option=select.createEl('option',{text:name});option.value=name;}
 select.value=view.writerV9CategoryFilter||'';
 select.addEventListener('change',()=>{view.writerV9CategoryFilter=select.value;view.render();});
 const up=section.createDiv({cls:'writer-v9-calendar-upcoming'});
 up.createEl('h4',{text:writerUi('Próximos eventos','Upcoming events')});
 const from=writerV83DateOf(new Date()),rows=writerV9CalRows(view,from,writerV83ShiftDay(from,29)).slice(0,12);
 if(!rows.length)up.createEl('p',{text:writerUi('Nenhum evento nos próximos 30 dias.','No events in the next 30 days.'),cls:'writer-v83-cal-muted'});
 for(const row of rows){
  const btn=up.createEl('button',{cls:'writer-v9-upcoming-event'});
  const day=writerV9CalendarLabel(row.occurs,{day:'2-digit',month:'short'});
  btn.createSpan({cls:'writer-v9-upcoming-date',text:day});
  const detail=btn.createSpan({cls:'writer-v9-upcoming-info'});
  detail.createEl('strong',{text:row.title});
  if(row.time)detail.createSpan({text:row.time});
  btn.addEventListener('click',()=>view.edit(row));
 }
}
function writerV9CalendarEntry(view,parent,event,short=false){
 const btn=parent.createEl('button',{cls:'writer-v9-calendar-event color-'+writerV9CalEventColor(event),
  attr:{type:'button',title:[event.time,event.title,event.location].filter(Boolean).join(' · ')}});
 if(event.repeat!=='none'){
  const mark=btn.createSpan({cls:'writer-v9-calendar-repeat'});
  require('obsidian').setIcon(mark,'repeat-2');
 }
 btn.createSpan({text:(event.time?event.time+' ':'')+event.title});
 if(!short&&event.location)btn.createSpan({cls:'writer-v9-calendar-event-meta',text:event.location});
 btn.addEventListener('click',()=>view.edit(event));
 return btn;
}
function writerV9CalendarMonth(view,parent,range,rows){
 const dayMap=new Map();
 for(const event of rows){if(!dayMap.has(event.occurs))dayMap.set(event.occurs,[]);dayMap.get(event.occurs).push(event);}
 const grid=parent.createDiv({cls:'writer-v9-calendar-month'});
 for(let i=0;i<7;i++)grid.createSpan({cls:'writer-v9-calendar-weekday',text:writerV9CalendarLabel(writerV83DateOf(new Date(2024,0,1+i)),{weekday:'short'})});
 const firstDay=writerV9CalendarWeek(range.start),lastDay=writerV83ShiftDay(range.end,(7-(writerV9CalWeekday(range.end)+6)%7-1)%7);
 const cfg=view.plugin.settings.v9Calendar;
 for(let day=firstDay;day<=lastDay;day=writerV83ShiftDay(day,1)){
  const outside=day<range.start||day>range.end;
  const box=grid.createDiv({cls:'writer-v9-calendar-month-day'+(outside?' is-outside':'')+(day===writerV83DateOf(new Date())?' is-today':'')});
  const header=box.createDiv({cls:'writer-v9-calendar-month-dayhead'});
  writerV9CalButton(header,String(Number(day.slice(-2))),null,()=>{
   view.anchor=day;view.mode='day';view.render();
  },writerV9CalendarLabel(day,{weekday:'long',day:'numeric',month:'long'}));
  const events=dayMap.get(day)||[];
  const visible=cfg.compactMonth?cfg.maxMonthEvents:5;
  for(const event of events.slice(0,visible))writerV9CalendarEntry(view,box,event,true);
  if(events.length>visible)writerV9CalButton(box,'+'+(events.length-visible),null,()=>{
   view.anchor=day;view.mode='day';view.render();
  },writerUi('Ver todos os eventos','See all events'));
  if(!events.length&&!outside)box.addEventListener('dblclick',()=>view.edit({date:day}));
 }
}
function writerV9CalendarAgenda(view,parent,range,rows){
 const list=parent.createDiv({cls:'writer-v9-calendar-agenda'});
 const grouped=new Map();
 for(const event of rows){if(!grouped.has(event.occurs))grouped.set(event.occurs,[]);grouped.get(event.occurs).push(event);}
 for(let day=range.start;day<=range.end;day=writerV83ShiftDay(day,1)){
  if(!grouped.has(day)&&view.mode==='agenda')continue;
  const group=list.createDiv({cls:'writer-v9-calendar-agenda-day'});
  const head=group.createDiv({cls:'writer-v9-calendar-agenda-header'});
  writerV9CalButton(head,writerV9CalendarLabel(day,{weekday:'long',day:'numeric',month:'long'}),null,()=>{
   view.anchor=day;view.mode='day';view.render();
  });
  writerV9CalButton(head,'','plus',()=>view.edit({date:day}),writerUi('Criar evento','Create event'));
  const events=group.createDiv({cls:'writer-v9-calendar-agenda-events'});
  if(!grouped.has(day))events.createEl('span',{cls:'writer-v83-cal-muted',text:writerUi('Sem eventos','No events')});
  for(const event of grouped.get(day)||[])writerV9CalendarEntry(view,events,event);
 }
 if(!rows.length)list.createEl('p',{text:writerUi('Não há eventos neste período.','No events in this period.'),cls:'writer-v83-cal-muted'});
}
function writerV9CalendarTimegrid(view,parent,range,rows){
 const days=[];
 for(let date=range.start;date<=range.end;date=writerV83ShiftDay(date,1))days.push(date);
 const cfg=view.plugin.settings.v9Calendar;
 const board=parent.createDiv({cls:'writer-v9-calendar-timegrid',attr:{role:'group','aria-label':writerUi('Agenda por horário','Time schedule')}});
 board.style.setProperty('--writer-v9-day-count',String(days.length));
 board.createDiv({cls:'writer-v9-calendar-time-corner'});
 for(const day of days){
  const head=board.createDiv({cls:'writer-v9-calendar-time-head'});
  writerV9CalButton(head,writerV9CalendarLabel(day,{weekday:'short',day:'numeric',month:'short'}),null,()=>{
   view.anchor=day;view.mode='day';view.render();
  });
 }
 const daily=new Map(days.map(d=>[d,rows.filter(e=>e.occurs===d)]));
 const allDay=board.createDiv({cls:'writer-v9-calendar-all-day-label',text:writerUi('Dia inteiro','All day')});
 for(const day of days){
  const all=board.createDiv({cls:'writer-v9-calendar-time-slot is-all-day'});
  for(const event of daily.get(day).filter(e=>!e.time))writerV9CalendarEntry(view,all,event,true);
  writerV9CalButton(all,'','plus',()=>view.edit({date:day}),writerUi('Criar evento para o dia','Create all-day event'));
 }
 for(let hour=cfg.startHour;hour<cfg.endHour;hour++){
  board.createDiv({cls:'writer-v9-calendar-hour-label',text:String(hour).padStart(2,'0')+':00'});
  for(const day of days){
   const cell=board.createDiv({cls:'writer-v9-calendar-time-slot'});
   for(const event of daily.get(day).filter(e=>e.time&&Number(e.time.slice(0,2))===hour))
    writerV9CalendarEntry(view,cell,event,true);
   const add=writerV9CalButton(cell,'','plus',()=>view.edit({date:day,time:String(hour).padStart(2,'0')+':00'}),
    writerUi('Novo evento às ','New event at ')+String(hour).padStart(2,'0')+':00');
   add.addClass('writer-v9-calendar-hour-add');
  }
 }
 const other=rows.filter(e=>e.time&&(Number(e.time.slice(0,2))<cfg.startHour||Number(e.time.slice(0,2))>=cfg.endHour));
 if(other.length){
  const outside=parent.createDiv({cls:'writer-v9-calendar-other-times'});
  outside.createEl('h4',{text:writerUi('Eventos fora dos horários exibidos','Events outside visible hours')});
  for(const event of other)writerV9CalendarEntry(view,outside,event);
 }
}
WriterV83CalendarView.prototype.render=function(){
 if(this.disposed)return;
 const scroll=this.contentEl.scrollTop||0,root=this.contentEl;
 root.empty();root.addClass('writer-v83-calendar','writer-v9-calendar');
 const top=root.createDiv({cls:'writer-v9-calendar-header'});
 const heading=top.createDiv({cls:'writer-v9-calendar-heading'});
 heading.createEl('h2',{text:writerUi('Calendário','Calendar')});
 heading.createEl('p',{cls:'writer-v9-calendar-subtitle',text:writerUi('Planeje seu tempo, sem sair do cofre','Plan your time, inside your vault')});
 const toolbar=top.createDiv({cls:'writer-v9-calendar-actions'});
 writerV9CalButton(toolbar,'','panel-left',()=>{
  this.writerV9SidebarOpen=!this.writerV9SidebarOpen;this.render();
 },writerUi('Mostrar/ocultar painel lateral','Toggle calendar sidebar'));
 writerV9CalButton(toolbar,writerUi('Hoje','Today'),null,()=>{this.anchor=writerV83DateOf(new Date());this.render();});
 const move=delta=>{
  if(this.mode==='month'){
   const d=new Date(this.anchor+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()+delta);
   this.anchor=writerV83DateOf(d);
  }else this.anchor=writerV83ShiftDay(this.anchor,delta*(this.mode==='week'?7:this.mode==='three'?3:this.mode==='agenda'?30:1));
  this.render();
 };
 writerV9CalButton(toolbar,'','chevron-left',()=>move(-1),writerUi('Período anterior','Previous period'));
 writerV9CalButton(toolbar,'','chevron-right',()=>move(1),writerUi('Próximo período','Next period'));
 const select=toolbar.createEl('select',{cls:'writer-v9-calendar-view-select',attr:{'aria-label':writerUi('Visualização','View')}});
 for(const [id,pt,en] of WRITER_V9_CAL_VIEW_OPTIONS){const option=select.createEl('option',{text:writerUi(pt,en)});option.value=id;}
 select.value=this.mode;
 select.addEventListener('change',()=>{this.mode=select.value;this.render();});
 const add=writerV9CalButton(toolbar,writerUi('Evento','Event'),'plus',()=>this.edit({date:this.anchor}));
 add.addClass('mod-cta');
 const range=this.range(),rows=writerV9CalRows(this,range.start,range.end);
 const title=root.createDiv({cls:'writer-v9-calendar-period'});
 const periodText=this.mode==='month'?
  writerV9CalendarLabel(range.start,{month:'long',year:'numeric'}):
  writerV9CalendarLabel(range.start,{day:'numeric',month:'short',year:'numeric'})+
   (range.start!==range.end?' — '+writerV9CalendarLabel(range.end,{day:'numeric',month:'short',year:'numeric'}):'');
 title.createEl('h3',{text:periodText});
 title.createSpan({text:rows.length+' '+writerUi(rows.length===1?'evento':'eventos',rows.length===1?'event':'events')});
 const layout=root.createDiv({cls:'writer-v9-calendar-layout'+(this.writerV9SidebarOpen?' has-sidebar':'')});
 if(this.writerV9SidebarOpen)writerV9CalendarSidebar(this,layout);
 const content=layout.createDiv({cls:'writer-v9-calendar-main'});
 if(this.mode==='month')writerV9CalendarMonth(this,content,range,rows);
 else if(this.mode==='agenda')writerV9CalendarAgenda(this,content,range,rows);
 else writerV9CalendarTimegrid(this,content,range,rows);
 root.scrollTop=scroll;
};
function writerV9CalendarSettings(plugin,panel){
 const cfg=plugin.settings.v9Calendar;
 panel.createEl('h3',{text:writerUi('Calendário · visualização e eventos','Calendar · layout and events')});
 const refresh=()=>{
  for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V83_CAL_VIEW)||[]){
   if(leaf.view instanceof WriterV83CalendarView)leaf.view.render();
  }
 };
 new Setting(panel).setName(writerUi('Vista inicial','Default view')).addDropdown(drop=>{
  for(const [id,pt,en] of WRITER_V9_CAL_VIEW_OPTIONS)drop.addOption(id,writerUi(pt,en));
  drop.setValue(cfg.defaultView).onChange(async value=>{cfg.defaultView=value;await plugin.saveSettings();});
 });
 for(const [key,pt,en] of [
  ['showSidebar','Painel lateral no computador','Desktop sidebar'],
  ['showSidebarMobile','Painel lateral no celular inicialmente','Initial mobile sidebar'],
  ['compactMonth','Mês compacto','Compact month']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(toggle=>toggle.setValue(cfg[key]).onChange(async value=>{
   cfg[key]=value;await plugin.saveSettings();
   if(key==='showSidebar'||key==='showSidebarMobile'){
    const mobile=writerV8HomeIsMobile(plugin);
    if((mobile&&key==='showSidebarMobile')||(!mobile&&key==='showSidebar')){
     for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V83_CAL_VIEW)||[])
      if(leaf.view instanceof WriterV83CalendarView)leaf.view.writerV9SidebarOpen=value;
    }
   }
   refresh();
  }));
 }
 new Setting(panel).setName(writerUi('Máximo de eventos por dia no mês','Maximum month events per day'))
  .addSlider(slider=>slider.setLimits(1,5,1).setValue(cfg.maxMonthEvents).setDynamicTooltip().onChange(async value=>{
   cfg.maxMonthEvents=value;await plugin.saveSettings();refresh();
  }));
 for(const [key,pt,en,min,max] of [['startHour','Hora inicial da grade','Timeline start hour',0,20],
  ['endHour','Hora final da grade','Timeline end hour',1,24]]){
  new Setting(panel).setName(writerUi(pt,en)).addSlider(slider=>slider.setLimits(min,max,1).setValue(cfg[key]).setDynamicTooltip().onChange(async value=>{
   cfg[key]=value;writerV9CalendarMerge(plugin.settings);await plugin.saveSettings();refresh();
  }));
 }
 new Setting(panel).setName(writerUi('Abrir calendário de escrita','Open writing calendar'))
  .addButton(button=>button.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerCalendarOpen?.()));
}
