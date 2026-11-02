'use strict';
/* 9.0.1: open the existing calendar ItemView in a main tab or a native
 * Obsidian sidebar. No extra sidebar type, event store or global panel. */
const WRITER_V901_CAL_LOCATIONS=['tab','left','right'];
function writerV901CalendarLeafLocation(workspace,leaf){
 const root=leaf?.getRoot?.();
 if(root&&root===workspace.leftSplit)return 'left';
 if(root&&root===workspace.rightSplit)return 'right';
 return leaf?.view?.writerV901Placement||'tab';
}
async function writerV901CalendarOpen(plugin,placement,date){
 if(!writerModuleOn(plugin,'calendar'))return null;
 const workspace=plugin.app.workspace;
 const requested=WRITER_V901_CAL_LOCATIONS.includes(placement)?placement:'tab';
 const leaves=workspace.getLeavesOfType?.(WRITER_V83_CAL_VIEW)||[];
 let leaf=leaves.find(item=>writerV901CalendarLeafLocation(workspace,item)===requested);
 const created=!leaf;
 if(!leaf){
  if(requested==='left')leaf=workspace.getLeftLeaf?.(true);
  else if(requested==='right')leaf=workspace.getRightLeaf?.(true);
  else leaf=workspace.getLeaf?.('tab');
  if(!leaf)throw Error(writerUi('Não foi possível abrir o calendário neste painel.','Cannot open the calendar in this pane.'));
  await leaf.setViewState({type:WRITER_V83_CAL_VIEW,active:true});
 }
 if(!(leaf.view instanceof WriterV83CalendarView))
  throw Error(writerUi('A visualização do calendário não está disponível.','The calendar view is unavailable.'));
 leaf.view.writerV901Placement=requested;
 if(created&&requested!=='tab'){
  // A docked pane has little horizontal space; open the compact event list.
  leaf.view.mode='agenda';
  leaf.view.writerV9SidebarOpen=false;
 }
 if(writerV83Date(date)){leaf.view.anchor=date;leaf.view.render();}
 else if(created&&requested!=='tab')leaf.view.render();
 await workspace.revealLeaf?.(leaf);
 return leaf;
}
function writerV901RegisterCalendar(plugin){
 const safeOpen=async(placement,date)=>{
  try{return await writerV901CalendarOpen(plugin,placement,date);}
  catch(error){console.warn('[Basic AI] Calendar placement:',error);
   new Notice(writerUi('Não foi possível abrir o calendário: ','Could not open calendar: ')+String(error.message||error));
   return null;
  }
 };
 plugin.writerCalendarOpen=date=>safeOpen(plugin.settings.v9Calendar?.openLocation||'tab',date);
 plugin.writerCalendarOpenIn=(placement,date)=>safeOpen(placement,date);
 for(const [id,pt,en,placement] of [
  ['v901-calendar-open-tab','Calendário: abrir em aba','Calendar: open in main tab','tab'],
  ['v901-calendar-open-left','Calendário: abrir na barra lateral esquerda','Calendar: open in left sidebar','left'],
  ['v901-calendar-open-right','Calendário: abrir na barra lateral direita','Calendar: open in right sidebar','right']
 ]){
  plugin.addCommand({id,name:writerUi(pt,en),callback:()=>void plugin.writerCalendarOpenIn(placement)});
 }
}
