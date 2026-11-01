'use strict';
/* v7 beta.2 — upgrade the existing v7 timeline; no duplicate event store. */
function writerV7StudioTimelineTrack(event){
 return String(event.track||event.category||'').trim().slice(0,100)||writerUi('Sem trilha','Unassigned');
}
function writerV7StudioTimelineBranches(events){
 return [...new Set(events.map(e=>String(e.branch||'main').trim()||'main'))].sort();
}
function writerV7StudioGanttModel(events){
 const dated=events.filter(e=>Number.isFinite(e.sortKey)),start=Math.min(...dated.map(e=>e.sortKey)),end=Math.max(...dated.map(e=>Number.isFinite(e.endKey)?e.endKey:e.sortKey));
 if(!dated.length)return [];
 const span=Math.max(1,end-start),minWidth=2;
 return dated.slice(0,80).map(e=>{
  const left=Math.max(0,Math.min(100,(e.sortKey-start)/span*100));
  const right=Number.isFinite(e.endKey)?e.endKey:e.sortKey;
  const width=Math.max(minWidth,Math.min(100-left,(right-e.sortKey)/span*100));
  return {event:e,left,width};
 });
}
function writerV7StudioRenderTimeline(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-timeline writer-v7-studio-timeline'});
 root.createEl('h3',{text:writerUi('Timeline do universo','World timeline')});
 root.createEl('p',{cls:'writer-v7-muted',text:writerUi('Uma única cronologia, agora com trilhas, ramificações, marcos e uma visão Gantt simplificada. Datas textuais não são convertidas à força.','A single timeline with tracks, branches, milestones and a simplified Gantt view. Textual eras are never converted to arbitrary numeric dates.')});
 const all=writerV7TimelineEntries(view,project,writerV7ProjectNotes(view,project));
 const toolbar=root.createDiv({cls:'writer-v7-toolbar'});
 toolbar.createEl('button',{text:writerUi('+ Evento','+ Event')}).addEventListener('click',()=>writerV7TimelineEditor(view,project));
 const search=toolbar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar eventos…','Search events…'),'aria-label':writerUi('Pesquisar eventos','Search events')}});
 const branches=writerV7StudioTimelineBranches(all),branch=toolbar.createEl('select',{attr:{'aria-label':writerUi('Ramificação','Branch')}});
 for(const key of ['',...branches]){
  const option=branch.createEl('option',{text:key||writerUi('Todas as versões','All branches')});option.value=key;
 }
 const tracks=[...new Set(all.map(writerV7StudioTimelineTrack))].sort();
 const track=toolbar.createEl('select',{attr:{'aria-label':writerUi('Trilha','Track')}});
 for(const key of ['',...tracks]){
  const option=track.createEl('option',{text:key||writerUi('Todas as trilhas','All tracks')});option.value=key;
 }
 const display=toolbar.createEl('select',{attr:{'aria-label':writerUi('Visualização','View mode')}});
 for(const [value,pt,en] of [['chronology','Cronologia','Chronology'],['tracks','Trilhas','Tracks'],['gantt','Gantt simples','Simple Gantt'],['milestones','Marcos','Milestones']]){
  const opt=display.createEl('option',{text:writerUi(pt,en)});opt.value=value;
 }
 const results=root.createDiv({cls:'writer-v7-studio-timeline-results'});
 const openNote=event=>{
  const file=view.app.vault.getAbstractFileByPath(event.note)||view.app.metadataCache?.getFirstLinkpathDest?.(event.note,project.file.path);
  if(file instanceof TFile)view.openFile(file);else new Notice(writerUi('Nota não encontrada.','Note not found.'));
 };
 const row=(parent,event)=>{
  const box=parent.createDiv({cls:'writer-v7-studio-event'});
  box.createSpan({cls:'writer-v7-studio-event-date',text:event.date+(event.endDate?' → '+event.endDate:'')});
  const details=box.createDiv({cls:'writer-v7-studio-event-details'});
  details.createEl('strong',{text:event.title});
  const chips=details.createDiv({cls:'writer-v7-studio-event-tags'});
  for(const label of [event.milestone?writerUi('Marco','Milestone'):null,writerV7StudioTimelineTrack(event),event.branch&&event.branch!=='main'?event.branch:null].filter(Boolean))
   chips.createSpan({cls:'writer-v7-tag',text:String(label).slice(0,80)});
  if(event.description)details.createEl('p',{text:event.description});
  const actions=details.createDiv({cls:'writer-v7-inline-actions'});
  if(event.note)actions.createEl('button',{text:writerUi('Nota','Note')}).addEventListener('click',()=>openNote(event));
  if(event.source==='manual'){
   actions.createEl('button',{text:writerUi('Editar','Edit')}).addEventListener('click',()=>writerV7TimelineEditor(view,project,event));
   actions.createEl('button',{text:writerUi('Excluir','Delete')}).addEventListener('click',()=>{
    new ConfirmProjectAction(view.app,writerUi('Excluir evento','Delete event'),event.title,async()=>{
     const p=view.prefs(project);p.v7Timeline=(p.v7Timeline||[]).filter(x=>x.id!==event.id);
     await view.plugin.saveSettings();await view.render();
    }).open();
   });
  }
 };
 const draw=()=>{
  results.empty();
  let filtered=all.filter(e=>(!branch.value||(e.branch||'main')===branch.value)&&(!track.value||writerV7StudioTimelineTrack(e)===track.value));
  const q=search.value.trim().toLocaleLowerCase();
  if(q)filtered=filtered.filter(e=>(e.title+' '+e.date+' '+e.track+' '+e.category+' '+e.description).toLocaleLowerCase().includes(q));
  if(display.value==='milestones')filtered=filtered.filter(e=>e.milestone===true);
  if(!filtered.length)return void results.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhum evento para os filtros escolhidos.','No events for these filters.')});
  if(display.value==='gantt'){
   const model=writerV7StudioGanttModel(filtered);
   if(!model.length)results.createEl('p',{cls:'writer-v7-muted',text:writerUi('Use anos ou datas para desenhar barras de duração. Eventos com eras textuais continuam na cronologia.','Use numeric years or dates to draw duration bars. Textual eras remain in chronology.')});
   for(const item of model){
    const line=results.createDiv({cls:'writer-v7-studio-gantt-row'});
    line.createEl('button',{text:item.event.title,cls:'writer-v7-studio-gantt-title'}).addEventListener('click',()=>item.event.source==='manual'?writerV7TimelineEditor(view,project,item.event):openNote(item.event));
    const bg=line.createDiv({cls:'writer-v7-studio-gantt-track'});
    const bar=bg.createDiv({cls:'writer-v7-studio-gantt-bar'});
    bar.style.left=item.left+'%';bar.style.width=item.width+'%';
    bg.setAttribute('aria-label',item.event.date+(item.event.endDate?' → '+item.event.endDate:''));
   }
   for(const e of filtered.filter(x=>!Number.isFinite(x.sortKey)))row(results,e);
   return;
  }
  if(display.value==='tracks'){
   const groups=new Map();
   for(const e of filtered){
    const key=writerV7StudioTimelineTrack(e);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(e);
   }
   for(const [name,events] of groups){
    const block=results.createEl('details',{cls:'writer-v7-studio-track'});block.open=true;
    block.createEl('summary',{text:name+' ('+events.length+')'});
    for(const e of events)row(block,e);
   }
   return;
  }
  const list=results.createDiv({cls:'writer-v7-timeline-list'});
  for(const e of filtered)row(list,e);
 };
 for(const el of [search,branch,track,display])el.addEventListener(el===search?'input':'change',draw);
 draw();
}
