'use strict';
/* v9 calendar engine, independent adaptation of Full Calendar / Remastered workflows.
   Local Markdown only; no FullCalendar bundle, provider credentials or external sync. */
const WRITER_V9_CAL_COLORS=['rose','orange','amber','green','blue','purple','slate'];
const WRITER_V9_CAL_FIELDS=['title','date','time','endTime','repeat','category','repeatInterval','repeatUntil','repeatDays','exceptions','location','details','color','recurrenceParent','recurrenceDate'];
const writerV9PriorParse=writerV83CalParse;
const writerV9PriorFormat=writerV83CalFormat;
const writerV9PriorValid=writerV83CalValid;
function writerV9CalDayNumber(day){
 if(!writerV83Date(day))return NaN;
 const [y,m,d]=day.split('-').map(Number);
 return Math.floor(Date.UTC(y,m-1,d)/86400000);
}
function writerV9CalWeekday(day){
 const [y,m,d]=day.split('-').map(Number);
 return new Date(Date.UTC(y,m-1,d)).getUTCDay();
}
function writerV9CalDates(raw){
 const parts=Array.isArray(raw)?raw:String(raw||'').split(',');
 return [...new Set(parts.map(x=>String(x||'').trim()).filter(writerV83Date))].sort().slice(0,300);
}
function writerV9CalWeekdays(raw){
 const parts=Array.isArray(raw)?raw:String(raw||'').split(',');
 return [...new Set(parts.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort((a,b)=>a-b);
}
function writerV9CalExtras(event){
 return {
  repeatInterval:Math.min(52,Math.max(1,Math.floor(Number(event?.repeatInterval)||1))),
  repeatUntil:writerV83Date(event?.repeatUntil)||'',
  repeatDays:writerV9CalWeekdays(event?.repeatDays),
  exceptions:writerV9CalDates(event?.exceptions),
  location:String(event?.location||'').slice(0,250),
  details:String(event?.details||'').slice(0,3000),
  color:WRITER_V9_CAL_COLORS.includes(event?.color)?event.color:'rose',
  recurrenceParent:String(event?.recurrenceParent||'').slice(0,450),
  recurrenceDate:writerV83Date(event?.recurrenceDate)||''
 };
}
function writerV9CalParseExtraField(frontmatter,name){
 const re=new RegExp('^'+name+':\\s*(.*)$','m'),match=re.exec(frontmatter);
 if(!match)return '';
 const text=match[1].trim();
 try{return JSON.parse(text);}catch(_){return text.replace(/^['"]|['"]$/g,'');}
}
writerV83CalParse=function(text,path){
 const original=writerV9PriorParse(text,path);
 if(!original)return null;
 const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text||''))?.[1]||'';
 const values={};
 for(const name of ['repeatInterval','repeatUntil','repeatDays','exceptions','location','details','color','recurrenceParent','recurrenceDate']){
  values[name]=writerV9CalParseExtraField(front,name);
 }
 return {...original,...writerV9CalExtras(values)};
};
writerV83CalFormat=function(event,body=''){
 const original=writerV9PriorFormat(event,body);
 const extra=writerV9CalExtras(event);
 const lines=Object.entries(extra).map(([key,value])=>key+': '+JSON.stringify(Array.isArray(value)?value.join(','):value));
 // Preserve the existing event Markdown body, never replace it when changing metadata.
 return original.replace(/\n---\n/,'\n'+lines.join('\n')+'\n---\n');
};
writerV83CalValid=function(input){
 const original=writerV9PriorValid(input);
 if(!original)return null;
 const extra=writerV9CalExtras(input);
 if(input.repeatUntil&&!extra.repeatUntil)return null;
 if(extra.repeatUntil&&extra.repeatUntil<original.date)return null;
 return {...original,...extra};
};
function writerV9CalOccurrence(event,start,end){
 if(!event||!writerV83Date(event.date)||!writerV83Date(start)||!writerV83Date(end)||end<start)return [];
 const a=writerV9CalDayNumber(event.date),until=writerV83Date(event.repeatUntil)||'';
 const interval=Math.max(1,Math.min(52,Math.floor(Number(event.repeatInterval)||1)));
 const weekdays=writerV9CalWeekdays(event.repeatDays);
 const exclusions=new Set(writerV9CalDates(event.exceptions));
 const firstWeekday=writerV9CalWeekday(event.date),selected=weekdays.length?weekdays:[firstWeekday];
 const [firstYear,firstMonth,firstDay]=event.date.split('-').map(Number);
 const startN=writerV9CalDayNumber(start),endN=writerV9CalDayNumber(end);
 const results=[];
 for(let dayN=Math.max(startN,a);dayN<=Math.min(endN,startN+739);dayN++){
  const date=new Date(dayN*86400000);
  const day=[date.getUTCFullYear(),String(date.getUTCMonth()+1).padStart(2,'0'),String(date.getUTCDate()).padStart(2,'0')].join('-');
  if(until&&day>until)break;
  if(exclusions.has(day))continue;
  const diff=dayN-a;
  const months=(date.getUTCFullYear()-firstYear)*12+(date.getUTCMonth()+1-firstMonth);
  let match=false;
  switch(event.repeat){
   case 'daily':match=diff%interval===0;break;
   case 'weekly':{
    const weekStart=a-((firstWeekday+6)%7);
    const weeks=Math.floor((dayN-weekStart)/7);
    match=weeks%interval===0&&selected.includes(date.getUTCDay());break;
   }
   case 'monthly':match=months>=0&&months%interval===0&&date.getUTCDate()===firstDay;break;
   case 'yearly':match=months>=0&&months%(12*interval)===0&&date.getUTCDate()===firstDay;break;
   default:match=diff===0;
  }
  if(match)results.push({...event,occurs:day});
 }
 return results;
}
writerV83CalOccurrence=writerV9CalOccurrence;
function writerV9CalSame(a,b){
 if(!a||!b)return false;
 for(const key of WRITER_V9_CAL_FIELDS){
  const x=a[key],y=b[key];
  if(Array.isArray(x)||Array.isArray(y)){
   if(JSON.stringify(x||[])!==JSON.stringify(y||[]))return false;
  }else if(String(x??'')!==String(y??''))return false;
 }
 return true;
}
async function writerV9CalUpdateSeries(view,old,transform){
 const file=view.app.vault.getAbstractFileByPath(old?.path);
 if(!(file instanceof TFile))throw Error(writerUi('Nota do evento não encontrada.','Event note not found.'));
 await view.app.vault.process(file,source=>{
  const latest=writerV83CalParse(source,file.path);
  if(!writerV9CalSame(latest,old))throw Error(writerUi('Evento alterado em outro lugar. Reabra antes de editar.','Event changed elsewhere. Reopen before editing.'));
  const changed=transform(latest);
  const valid=writerV83CalValid(changed);
  if(!valid)throw Error(writerUi('Dados do evento inválidos.','Invalid event data.'));
  const body=source.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/,'');
  return writerV83CalFormat(valid,body);
 });
}
async function writerV9CalCreate(view,event){
 if(!view.app.vault.getAbstractFileByPath(WRITER_V83_CAL_FOLDER))
  await view.app.vault.createFolder(WRITER_V83_CAL_FOLDER);
 const base=WRITER_V83_CAL_FOLDER+'/'+event.date+'-event';
 let filePath=base+'.md',index=2;
 while(view.app.vault.getAbstractFileByPath(filePath))filePath=base+'-'+index+++'.md';
 return view.app.vault.create(filePath,writerV83CalFormat(event));
}
async function writerV9CalExclude(view,event,date){
 if(!writerV83Date(date))throw Error('Invalid occurrence date.');
 await writerV9CalUpdateSeries(view,event,current=>({
  ...current,exceptions:writerV9CalDates([...(current.exceptions||[]),date])
 }));
 await view.load();
}
function writerV9CalEventColor(event){
 const color=WRITER_V9_CAL_COLORS.includes(event.color)?event.color:'rose';
 return color;
}
