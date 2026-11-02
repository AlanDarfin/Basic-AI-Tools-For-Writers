'use strict';
/* Local Markdown calendar. Original code, no FullCalendar bundle or external sync. */
const WRITER_V83_CAL_VIEW='writer-calendar-view';
const WRITER_V83_CAL_FOLDER='Writing Calendar';
function writerV83Date(value){
 const v=String(value||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';
 const d=new Date(v+'T12:00:00');
 return !Number.isNaN(d.getTime())&&[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')===v?v:'';
}
function writerV83DateOf(date){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
function writerV83ShiftDay(day,offset){
 const date=new Date(day+'T12:00:00');date.setDate(date.getDate()+offset);return writerV83DateOf(date);
}
function writerV83CalYaml(value){
 return JSON.stringify(String(value||'').replace(/[\r\n]/g,' ').slice(0,350));
}
function writerV83CalFormat(event,body=''){
 return ['---','writerCalendar: true','title: '+writerV83CalYaml(event.title),
  'startDate: '+writerV83CalYaml(event.date),'startTime: '+writerV83CalYaml(event.time||''),
  'endTime: '+writerV83CalYaml(event.endTime||''),'repeat: '+writerV83CalYaml(event.repeat||'none'),
  'category: '+writerV83CalYaml(event.category||''),'---','',body||''].join('\n');
}
function writerV83CalParse(text,path){
 const yaml=/^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text||''));
 if(!yaml||!/^writerCalendar:\s*true\s*$/m.test(yaml[1]))return null;
 const fields={};
 for(const line of yaml[1].split(/\r?\n/)){
  const m=/^(title|startDate|startTime|endTime|repeat|category):\s*(.*)$/.exec(line);
  if(!m)continue;
  let value=m[2].trim();
  try{value=JSON.parse(value)}catch(_){value=value.replace(/^['"]|['"]$/g,'');}
  fields[m[1]]=String(value||'');
 }
 if(!writerV83Date(fields.startDate))return null;
 const date=fields.startDate;
 return {path,title:(fields.title||path.split('/').pop().replace(/\.md$/,'')).slice(0,160),
  date,time:fields.startTime||'',endTime:fields.endTime||'',
  repeat:['none','daily','weekly','monthly','yearly'].includes(fields.repeat)?fields.repeat:'none',
  category:fields.category||''};
}
function writerV83CalOccurrence(event,start,end){
 if(!event||!writerV83Date(start)||!writerV83Date(end)||end<start)return [];
 const found=[],first=event.date;
 const test=day=>{
  if(day<first)return false;
  if(event.repeat==='none')return day===first;
  const a=new Date(first+'T12:00:00'),b=new Date(day+'T12:00:00');
  const diff=Math.round((b-a)/86400000);
  if(event.repeat==='daily')return true;
  if(event.repeat==='weekly')return diff%7===0;
  if(event.repeat==='monthly')return b.getDate()===a.getDate();
  if(event.repeat==='yearly')return b.getDate()===a.getDate()&&b.getMonth()===a.getMonth();
  return false;
 };
 // Bound to ~2 years of rendered occurrences, not an unbounded recurrence iterator.
 const count=Math.min(740,Math.round((new Date(end+'T12:00:00')-new Date(start+'T12:00:00'))/86400000)+1);
 for(let i=0;i<count;i++){
  const day=writerV83ShiftDay(start,i);
  if(test(day))found.push({...event,occurs:day});
 }
 return found;
}
function writerV83CalValid(input){
 const title=String(input.title||'').trim().slice(0,160),date=writerV83Date(input.date);
 const time=String(input.time||'').trim(),endTime=String(input.endTime||'').trim();
 const validTime=t=>!t||/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
 if(!title||!date||!validTime(time)||!validTime(endTime)||endTime&&time&&endTime<time)return null;
 return {title,date,time,endTime,repeat:['daily','weekly','monthly','yearly'].includes(input.repeat)?input.repeat:'none',
  category:String(input.category||'').trim().slice(0,80)};
}
async function writerV83CalEvents(plugin){
 const folder=plugin.app.vault.getAbstractFileByPath(WRITER_V83_CAL_FOLDER);
 if(!(folder instanceof TFolder))return [];
 const files=folder.children.filter(f=>f instanceof TFile&&f.extension==='md').slice(0,900);
 const events=[];
 for(const file of files){
  try{const e=writerV83CalParse(await plugin.app.vault.cachedRead(file),file.path);if(e)events.push(e);}
  catch(error){console.warn('[Basic AI] Calendar event unreadable:',file.path,error);}
 }
 return events;
}
function writerV83CalForm(plugin,initial,onSave,onRemove){
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  const content=modal.contentEl;content.empty();
  content.createEl('h3',{text:initial?.path?writerUi('Editar evento','Edit event'):writerUi('Novo evento','New event')});
  const fields={title:initial?.title||'',date:initial?.occurs||initial?.date||writerV83DateOf(new Date()),
   time:initial?.time||'',endTime:initial?.endTime||'',repeat:initial?.repeat||'none',category:initial?.category||''};
  const field=(key,pt,en,type='text')=>{
   const label=content.createEl('label',{cls:'writer-v83-cal-field'});
   label.createSpan({text:writerUi(pt,en)});
   const input=label.createEl('input',{attr:{type,'aria-label':writerUi(pt,en)}});
   input.value=fields[key]||'';
   input.addEventListener('change',()=>{fields[key]=input.value;});return input;
  };
  field('title','Título','Title');field('date','Data','Date','date');
  field('time','Começa','Start time','time');field('endTime','Termina','End time','time');
  field('category','Categoria','Category');
  const repeat=content.createEl('label',{cls:'writer-v83-cal-field'});
  repeat.createSpan({text:writerUi('Repetição','Repeat')});
  const select=repeat.createEl('select');
  for(const [value,pt,en] of [['none','Não repete','No repeat'],['daily','Diário','Daily'],['weekly','Semanal','Weekly'],['monthly','Mensal','Monthly'],['yearly','Anual','Yearly']]){
   const opt=select.createEl('option',{value,text:writerUi(pt,en)});opt.value=value;
  }
  select.value=fields.repeat;select.addEventListener('change',()=>{fields.repeat=select.value;});
  const actions=content.createDiv({cls:'writer-v83-cal-form-actions'});
  const status=content.createEl('p',{cls:'writer-v83-cal-status'});
  const save=actions.createEl('button',{text:writerUi('Salvar','Save'),cls:'mod-cta'});
  save.addEventListener('click',async()=>{
   const data=writerV83CalValid(fields);
   if(!data){status.setText(writerUi('Preencha título e data válidos; verifique os horários.','Provide a valid title and date; check the times.'));return;}
   save.disabled=true;
   try{await onSave(data);modal.close();}
   catch(error){status.setText(String(error.message||error));save.disabled=false;}
  });
  if(initial?.path&&onRemove){
   const remove=actions.createEl('button',{text:writerUi('Excluir evento','Delete event')});
   remove.addEventListener('click',()=>{
    // Two-step explicit confirmation: no deletion by mis-tap.
    if(remove.dataset.confirm!=='yes'){remove.dataset.confirm='yes';remove.setText(writerUi('Confirmar exclusão','Confirm deletion'));return;}
    remove.disabled=true;
    void onRemove().then(()=>modal.close()).catch(err=>{remove.disabled=false;status.setText(String(err));});
   });
  }
  actions.createEl('button',{text:writerUi('Cancelar','Cancel')}).addEventListener('click',()=>modal.close());
 };
 modal.open();
}
class WriterV83CalendarView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.mode='month';this.anchor=writerV83DateOf(new Date());this.events=[];this.disposed=false;this.timer=null;}
 getViewType(){return WRITER_V83_CAL_VIEW;}
 getDisplayText(){return writerUi('Calendário de escrita','Writing calendar');}
 getIcon(){return 'calendar-days';}
 async onOpen(){
  this.disposed=false;await this.load();
  const update=()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>{if(!this.disposed)void this.load();},300);};
  this.registerEvent(this.app.vault.on('create',update));
  this.registerEvent(this.app.vault.on('modify',update));
  this.registerEvent(this.app.vault.on('delete',update));
  this.registerEvent(this.app.vault.on('rename',update));
 }
 async onClose(){this.disposed=true;clearTimeout(this.timer);}
 async load(){const events=await writerV83CalEvents(this.plugin);if(this.disposed)return;this.events=events;this.render();}
 range(){
  const d=new Date(this.anchor+'T12:00:00');
  if(this.mode==='day')return {start:this.anchor,end:this.anchor};
  if(this.mode==='week'){const shift=(d.getDay()+6)%7;const start=writerV83ShiftDay(this.anchor,-shift);return {start,end:writerV83ShiftDay(start,6)};}
  return {start:writerV83DateOf(new Date(d.getFullYear(),d.getMonth(),1)),
   end:writerV83DateOf(new Date(d.getFullYear(),d.getMonth()+1,0))};
 }
 async save(event,old){
  const folder=WRITER_V83_CAL_FOLDER;
  if(old?.path){
   const file=this.app.vault.getAbstractFileByPath(old.path);
   if(!(file instanceof TFile))throw Error('Event note no longer exists.');
   await this.app.vault.process(file,text=>{
    const latest=writerV83CalParse(text,file.path);
    if(!latest)throw Error('This is not a Basic AI calendar event.');
    // Reject stale saves from another device or editor rather than silently
    // overwriting a calendar event changed since the modal was opened.
    for(const key of ['title','date','time','endTime','repeat','category']){
     if(latest[key]!==old[key])throw Error(writerUi('Evento alterado em outro lugar. Reabra para editar.','Event changed elsewhere. Reopen it before editing.'));
    }
    const body=text.replace(/^---[\s\S]*?\n---\s*/,'');
    return writerV83CalFormat(event,body);
   });
  }else{
   if(!this.app.vault.getAbstractFileByPath(folder))await this.app.vault.createFolder(folder);
   const date=event.date;let path=folder+'/'+date+'-event.md',n=2;
   while(this.app.vault.getAbstractFileByPath(path))path=folder+'/'+date+'-event-'+n+++'.md';
   await this.app.vault.create(path,writerV83CalFormat(event));
  }
  await this.load();
 }
 edit(event){
  writerV83CalForm(this.plugin,event,data=>this.save(data,event),
   event?.path?async()=>{
    const file=this.app.vault.getAbstractFileByPath(event.path);
    if(!(file instanceof TFile)||!(await this.app.vault.cachedRead(file)).includes('writerCalendar: true'))throw Error('Event note changed.');
    await this.app.vault.trash(file,true);await this.load();
   }:null);
 }
 render(){
  const root=this.contentEl;root.empty();root.addClass('writer-v83-calendar');
  const head=root.createDiv({cls:'writer-v83-cal-toolbar'});
  head.createEl('h2',{text:writerUi('Calendário','Calendar')});
  const today=head.createEl('button',{text:writerUi('Hoje','Today')});today.addEventListener('click',()=>{this.anchor=writerV83DateOf(new Date());this.render();});
  for(const [delta,text] of [[-1,'‹'],[1,'›']]){
   const button=head.createEl('button',{text,attr:{'aria-label':delta<0?writerUi('Anterior','Previous'):writerUi('Próximo','Next')}});
   button.addEventListener('click',()=>{
    const d=new Date(this.anchor+'T12:00:00');
    if(this.mode==='month'){d.setDate(1);d.setMonth(d.getMonth()+delta);}
    else d.setDate(d.getDate()+delta*(this.mode==='week'?7:1));
    this.anchor=writerV83DateOf(d);this.render();
   });
  }
  const select=head.createEl('select',{attr:{'aria-label':writerUi('Visualização','View')}});
  for(const [type,pt,en] of [['month','Mês','Month'],['week','Semana','Week'],['day','Dia','Day']]){
   const opt=select.createEl('option',{text:writerUi(pt,en)});opt.value=type;
  }
  select.value=this.mode;select.addEventListener('change',()=>{this.mode=select.value;this.render();});
  const add=head.createEl('button',{text:writerUi('+ Evento','+ Event'),cls:'mod-cta'});
  add.addEventListener('click',()=>this.edit({date:this.anchor}));
  const {start,end}=this.range(),rows=[];
  for(const event of this.events)rows.push(...writerV83CalOccurrence(event,start,end));
  rows.sort((a,b)=>a.occurs.localeCompare(b.occurs)||a.time.localeCompare(b.time)||a.title.localeCompare(b.title));
  const byDay=new Map();
  for(const event of rows){if(!byDay.has(event.occurs))byDay.set(event.occurs,[]);byDay.get(event.occurs).push(event);}
  const headline=root.createEl('h3',{cls:'writer-v83-cal-period'});
  headline.setText(new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),this.mode==='month'?{month:'long',year:'numeric'}:{day:'numeric',month:'long',year:'numeric'}).format(new Date(this.anchor+'T12:00:00')));
  const drawDay=(cell,date)=>{
   const dateButton=cell.createEl('button',{text:String(Number(date.slice(-2))),cls:'writer-v83-cal-date'});
   dateButton.addEventListener('click',()=>{this.anchor=date;this.mode='day';this.render();});
   for(const e of byDay.get(date)||[]){
    const label=(e.time?e.time+' · ':'')+e.title;
    const eventButton=cell.createEl('button',{text:label,cls:'writer-v83-cal-event',attr:{title:label}});
    eventButton.addEventListener('click',()=>this.edit(e));
   }
  };
  if(this.mode==='month'){
   const grid=root.createDiv({cls:'writer-v83-cal-month'});
   const locale=writerUi('pt-BR','en-US');
   for(let i=0;i<7;i++)grid.createSpan({text:new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2024,0,1+i)),cls:'writer-v83-cal-weekday'});
   const first=new Date(start+'T12:00:00'),pad=(first.getDay()+6)%7;
   for(let i=0;i<pad;i++)grid.createDiv({cls:'writer-v83-cal-day is-outside'});
   for(let date=start;date<=end;date=writerV83ShiftDay(date,1)){
    const cell=grid.createDiv({cls:'writer-v83-cal-day'});
    if(date===writerV83DateOf(new Date()))cell.addClass('is-today');
    drawDay(cell,date);
   }
  }else{
   const list=root.createDiv({cls:'writer-v83-cal-agenda'});
   for(let date=start;date<=end;date=writerV83ShiftDay(date,1)){
    const cell=list.createDiv({cls:'writer-v83-cal-agenda-day'});
    cell.createEl('strong',{text:new Intl.DateTimeFormat(writerUi('pt-BR','en-US'),{weekday:'short',day:'numeric',month:'short'}).format(new Date(date+'T12:00:00'))});
    drawDay(cell,date);
    if(!byDay.has(date))cell.createSpan({text:writerUi('Sem eventos','No events'),cls:'writer-v83-cal-muted'});
   }
  }
 }
}
function writerV83RegisterCalendar(plugin){
 plugin.registerView(WRITER_V83_CAL_VIEW,leaf=>new WriterV83CalendarView(leaf,plugin));
 const open=async(date)=>{
  if(!writerModuleOn(plugin,'calendar'))return;
  const workspace=plugin.app.workspace;
  let leaf=workspace.getLeavesOfType(WRITER_V83_CAL_VIEW)[0];
  if(!leaf){leaf=workspace.getLeaf('tab');await leaf.setViewState({type:WRITER_V83_CAL_VIEW,active:true});}
  if(writerV83Date(date)&&leaf.view instanceof WriterV83CalendarView){leaf.view.anchor=date;leaf.view.render();}
  await workspace.revealLeaf?.(leaf);
 };
 plugin.writerCalendarOpen=open;
 plugin.addCommand({id:'v83-calendar-open',name:writerUi('Calendário: abrir agenda','Calendar: open agenda'),callback:()=>void open()});
}
