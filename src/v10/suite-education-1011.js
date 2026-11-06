'use strict';
/* Basic 10.11 — optional, local university workflow inspired by Unique Suite.
 * No upstream code, automatic vault reshaping, recurring network requests,
 * or duplicated calendar/ICS implementations. */
function writerV1011StudyCfg(settings){
 const old=settings.v1011Study&&typeof settings.v1011Study==='object'?settings.v1011Study:{};
 const cfg=settings.v1011Study=Object.assign({
  enabled:true,root:'Estudos',daily:'Diário',classes:'Aulas',reminders:'Lembretes.md',
  timetable:'Horário.md',maxRows:120
 },old);
 const folder=value=>{
  const parts=String(value||'').trim().replace(/\\/g,'/').split('/');
  if(!parts.length||parts.length>6||parts.some(p=>!p||p==='.'||p==='..'||p[0]==='.'||p.length>90||/[\x00-\x1f:*?"<>|]/.test(p)))return '';
  return parts.join('/').slice(0,300);
 };
 cfg.root=folder(cfg.root)||'Estudos';
 cfg.daily=folder(cfg.daily)||'Diário';
 cfg.classes=folder(cfg.classes)||'Aulas';
 const name=value=>/^[\p{L}\p{N} _.-]{1,80}\.md$/u.test(String(value||''))&&!String(value).startsWith('.')?String(value):'';
 cfg.reminders=name(cfg.reminders)||'Lembretes.md';
 cfg.timetable=name(cfg.timetable)||'Horário.md';
 cfg.maxRows=Math.max(10,Math.min(300,Number(cfg.maxRows)||120));
 return cfg;
}
function writerV1011StudyPath(cfg,type){
 return cfg.root+'/'+(type==='reminders'?cfg.reminders:type==='timetable'?cfg.timetable:cfg[type]);
}
function writerV1011StudyDate(date=new Date()){
 const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
 return year+'-'+month+'-'+day;
}
function writerV1011StudyClean(value){
 return String(value||'').replace(/[\x00-\x1f\\/:*?"<>|#\[\]]/g,' ').replace(/\s+/g,' ').trim().slice(0,75);
}
function writerV1011StudyFrontmatter(props){
 const entries=Object.entries(props).filter(([k])=>/^[a-z][a-z-]{0,35}$/i.test(k)).map(([k,v])=>{
  const value=String(v??'').replace(/[\r\n]+/g,' ').slice(0,400);
  return k+': '+JSON.stringify(value);
 });
 return '---\n'+entries.join('\n')+'\n---\n\n';
}
async function writerV1011StudyEnsureFolders(plugin,path){
 const parts=String(path||'').split('/');parts.pop();
 let prefix='';
 for(const part of parts){
  prefix=prefix?prefix+'/'+part:part;
  const existing=plugin.app.vault.getAbstractFileByPath(prefix);
  if(existing&&!Array.isArray(existing.children))throw Error('Path is not a folder: '+prefix);
  if(!existing)await plugin.app.vault.createFolder(prefix);
 }
}
async function writerV1011StudyCreate(plugin,path,body,openExisting=false){
 const vault=plugin.app.vault,existing=vault.getAbstractFileByPath(path);
 if(existing){
  if(openExisting&&existing.extension==='md'){await plugin.app.workspace.getLeaf('tab').openFile(existing);return existing;}
  throw Error(writerUi('Já existe uma nota neste caminho: ','A note already exists at: ')+path);
 }
 await writerV1011StudyEnsureFolders(plugin,path);
 const file=await vault.create(path,body);
 await plugin.app.workspace.getLeaf('tab').openFile(file);return file;
}
async function writerV1011StudyDaily(plugin,date=new Date()){
 const cfg=writerV1011StudyCfg(plugin.settings),day=writerV1011StudyDate(date);
 const path=writerV1011StudyPath(cfg,'daily')+'/'+day.slice(0,7)+'/'+day+'.md';
 const body=writerV1011StudyFrontmatter({date:day,type:'daily',tags:'study'})+
  '# '+day+'\n\n## '+writerUi('Aulas e anotações','Classes and notes')+
  '\n\n## '+writerUi('Tarefas','Tasks')+'\n\n- [ ] \n\n## '+writerUi('Reflexão','Reflection')+'\n';
 return writerV1011StudyCreate(plugin,path,body,true);
}
async function writerV1011StudyClass(plugin,title,semester='',date=new Date()){
 const cfg=writerV1011StudyCfg(plugin.settings),name=writerV1011StudyClean(title);
 if(!name)throw Error(writerUi('Informe o nome da aula.','Enter a class title.'));
 const term=writerV1011StudyClean(semester)||writerUi('Geral','General');
 const day=writerV1011StudyDate(date);
 const folder=writerV1011StudyPath(cfg,'classes')+'/'+term;
 const path=folder+'/'+day+' - '+name+'.md';
 const body=writerV1011StudyFrontmatter({title:name,date:day,semester:term,type:'class',status:'notes'})+
  '# '+name+'\n\n## '+writerUi('Resumo','Summary')+'\n\n## '+writerUi('Conceitos principais','Key concepts')+
  '\n\n## '+writerUi('Perguntas','Questions')+'\n\n## '+writerUi('Próximas tarefas','Next actions')+'\n\n- [ ] \n';
 return writerV1011StudyCreate(plugin,path,body,false);
}
async function writerV1011StudyReminder(plugin,label,date){
 const cfg=writerV1011StudyCfg(plugin.settings),clean=writerV1011StudyClean(label);
 if(!clean)throw Error(writerUi('Informe o texto do lembrete.','Enter the reminder text.'));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(new Date(date+'T12:00:00').getTime())||
   writerV1011StudyDate(new Date(date+'T12:00:00'))!==date)throw Error('Invalid reminder date');
 const path=writerV1011StudyPath(cfg,'reminders'),vault=plugin.app.vault;
 await writerV1011StudyEnsureFolders(plugin,path);
 if(!vault.getAbstractFileByPath(path))await vault.create(path,'# '+writerUi('Lembretes','Reminders')+'\n');
 const file=vault.getAbstractFileByPath(path);
 const line='- [ ] [due:: '+date+'] '+clean+'\n';
 if(typeof vault.process!=='function')throw Error('Atomic vault.process is required for reminders');
 await vault.process(file,text=>text.replace(/\s*$/,'\n')+line);
 return file;
}
function writerV1011StudyReminders(text,now=writerV1011StudyDate()){
 const rows=[];
 for(const line of String(text||'').split(/\r?\n/).slice(0,500)){
  const match=/^\s*-\s*\[\s\]\s*\[due::\s*(\d{4}-\d{2}-\d{2})\]\s*(.+)$/.exec(line);
  if(match)rows.push({date:match[1],label:match[2].slice(0,180),overdue:match[1]<now});
 }
 return rows.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,40);
}
function writerV1011StudyTimetable(text,maxRows=120){
 const lines=String(text||'').split(/\r?\n/);
 const rows=[];
 for(const line of lines){
  if(rows.length>=maxRows)break;
  const cells=line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
  if(cells.length<3||cells.length>8||cells.every(x=>/^:?-{3,}:?$/.test(x)))continue;
  if(/^(dia|day|weekday)$/i.test(cells[0]))continue;
  if(!/^(seg|ter|qua|qui|sex|sáb|sab|dom|mon|tue|wed|thu|fri|sat|sun)/i.test(cells[0]))continue;
  rows.push({day:cells[0].slice(0,25),time:cells[1].slice(0,32),
   course:cells[2].slice(0,100),place:String(cells[3]||'').slice(0,100)});
 }
 return rows;
}
function writerV1011StudyScheduleBlock(plugin,source,element){
 const root=element.createDiv({cls:'writer-v1011-study-schedule'});
 if(plugin.settings.v1011Study?.enabled===false)return;
 const opts={},lines=String(source||'').split(/\r?\n/);
 for(const line of lines.slice(0,20)){
  const m=/^\s*(file|title):\s*(.*?)\s*$/.exec(line);
  if(m)opts[m[1]]=m[2];
 }
 const cfg=writerV1011StudyCfg(plugin.settings),path=opts.file||writerV1011StudyPath(cfg,'timetable');
 const file=plugin.app.vault.getAbstractFileByPath(path);
 root.createEl('h4',{text:opts.title||writerUi('Horário de aulas','Class timetable')});
 if(!file||file.extension!=='md'){root.createEl('p',{cls:'setting-item-description',text:writerUi('Crie a nota de horário nas configurações acadêmicas.','Create the timetable note from Academic tools.')});return;}
 void plugin.app.vault.read(file).then(text=>{
  const rows=writerV1011StudyTimetable(text,cfg.maxRows);
  if(!rows.length){root.createEl('p',{text:writerUi('Nenhuma aula no horário.','No timetable entries.')});return;}
  const table=root.createEl('table');
  const header=table.createEl('thead').createEl('tr');
  for(const name of [writerUi('Dia','Day'),writerUi('Hora','Time'),writerUi('Aula','Class'),writerUi('Local','Place')])header.createEl('th',{text:name});
  const body=table.createEl('tbody');
  const current=new Date().getDay(),codes=['dom','seg','ter','qua','qui','sex','sáb'];
  for(const item of rows){
   const tr=body.createEl('tr');
   if(item.day.toLocaleLowerCase().startsWith(codes[current]))tr.addClass('is-today');
   for(const key of ['day','time','course','place'])tr.createEl('td',{text:item[key]});
  }
 }).catch(error=>root.createEl('small',{text:String(error.message||error)}));
}
function writerV1011StudyHub(plugin){
 const cfg=writerV1011StudyCfg(plugin.settings);
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Central acadêmica','Academic center'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.addClass('writer-v1011-study-hub');
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Aulas, diário, horário e lembretes locais. Nenhum conteúdo é criado até você escolher uma ação.',
   'Local class notes, daily journal, timetable and reminders. No files are created until you choose an action.')});
  const actions=root.createDiv({cls:'writer-v1011-study-actions'});
  const action=(label,icon,callback)=>{
   const b=actions.createEl('button',{type:'button'});
   if(typeof require('obsidian').setIcon==='function')require('obsidian').setIcon(b,icon);
   b.createSpan({text:label});
   b.addEventListener('click',()=>void Promise.resolve(callback()).catch(error=>new Notice(String(error.message||error))));
   return b;
  };
  action(writerUi('Nota de hoje','Today’s journal'),'calendar-days',()=>writerV1011StudyDaily(plugin));
  action(writerUi('Capturar aula','Capture class'),'notebook-pen',()=>{
   const child=new Modal(plugin.app),state={title:'',term:''};
   child.setTitle(writerUi('Nova aula','New class'));
   child.onOpen=()=>{
    new Setting(child.contentEl).setName(writerUi('Aula','Class')).addText(t=>t.onChange(v=>state.title=v));
    new Setting(child.contentEl).setName(writerUi('Semestre / pasta','Semester / folder')).addText(t=>t.onChange(v=>state.term=v));
    new Setting(child.contentEl).addButton(b=>b.setButtonText(writerUi('Criar nota','Create note')).setCta().onClick(async()=>{
     try{await writerV1011StudyClass(plugin,state.title,state.term);child.close();modal.close();}
     catch(error){new Notice(String(error.message||error));}
    }));
   };child.open();
  });
  action(writerUi('Novo lembrete','New reminder'),'bell',()=>{
   const child=new Modal(plugin.app),state={label:'',date:writerV1011StudyDate()};
   child.setTitle(writerUi('Lembrete','Reminder'));
   child.onOpen=()=>{
    new Setting(child.contentEl).setName(writerUi('Descrição','Description')).addText(t=>t.onChange(v=>state.label=v));
    new Setting(child.contentEl).setName(writerUi('Data YYYY-MM-DD','Date YYYY-MM-DD')).addText(t=>t.setValue(state.date).onChange(v=>state.date=v));
    new Setting(child.contentEl).addButton(b=>b.setButtonText(writerUi('Adicionar','Add')).setCta().onClick(async()=>{
     try{await writerV1011StudyReminder(plugin,state.label,state.date);child.close();modal.onOpen();}
     catch(error){new Notice(String(error.message||error));}
    }));
   };child.open();
  });
  action(writerUi('Abrir horário','Open timetable'),'calendar-clock',async()=>{
   const path=writerV1011StudyPath(cfg,'timetable'),existing=plugin.app.vault.getAbstractFileByPath(path);
   const example='# '+writerUi('Horário de aulas','Class timetable')+'\n\n| '+writerUi('Dia','Day')+' | '+writerUi('Hora','Time')+' | '+writerUi('Aula','Class')+' | '+writerUi('Local','Place')+' |\n| --- | --- | --- | --- |\n| Seg | 08:00–09:30 | Matemática | Sala 1 |\n';
   await writerV1011StudyCreate(plugin,path,example,true);
  });
  const reminderPath=writerV1011StudyPath(cfg,'reminders'),reminderFile=plugin.app.vault.getAbstractFileByPath(reminderPath);
  const upcoming=root.createDiv({cls:'writer-v1011-study-upcoming'});
  upcoming.createEl('h4',{text:writerUi('Próximos lembretes','Upcoming reminders')});
  if(reminderFile?.extension==='md'){
   void plugin.app.vault.read(reminderFile).then(text=>{
    for(const item of writerV1011StudyReminders(text).slice(0,12)){
     const row=upcoming.createDiv({cls:'writer-v1011-study-reminder'});
     row.createEl('time',{text:item.date});
     row.createSpan({text:item.label});
     if(item.overdue)row.addClass('is-overdue');
    }
   }).catch(error=>upcoming.createEl('small',{text:String(error.message||error)}));
  }else upcoming.createEl('p',{cls:'setting-item-description',text:writerUi('Sem lembretes ainda.','No reminders yet.')});
 };modal.open();
}
function writerV1011StudyRegister(plugin){
 writerV1011StudyCfg(plugin.settings);
 plugin.addCommand({id:'v1011-academic-center',name:writerUi('Estudos: abrir central acadêmica','Study: open academic center'),
  callback:()=>{if(plugin.settings.v1011Study.enabled!==false)writerV1011StudyHub(plugin);}});
 plugin.addCommand({id:'v1011-insert-timetable',name:writerUi('Estudos: inserir bloco de horário','Study: insert timetable block'),
  editorCallback:editor=>{
   const fence=String.fromCharCode(96).repeat(3);
   editor.replaceSelection('\n'+fence+'basic-timetable\n'+fence+'\n');
  }});
 plugin.registerMarkdownCodeBlockProcessor?.('basic-timetable',(source,el)=>writerV1011StudyScheduleBlock(plugin,source,el));
}
function writerV1011StudySettings(plugin,panel){
 const cfg=writerV1011StudyCfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('Unique Suite — rotina acadêmica','Unique Suite — academic workflow')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Integração local com o calendário já existente. Nenhuma pasta é criada ao ativar.',
  'Local workflow using the existing calendar. Enabling does not create folders.')});
 new Setting(panel).setName(writerUi('Ativar central acadêmica','Enable academic center'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 for(const [key,pt,en] of [
  ['root','Pasta principal','Root folder'],['daily','Subpasta de diário','Daily journal folder'],
  ['classes','Subpasta das aulas','Class notes folder'],['reminders','Nota dos lembretes','Reminder note'],
  ['timetable','Nota de horário','Timetable note']]){
  new Setting(panel).setName(writerUi(pt,en)).addText(t=>t.setValue(cfg[key])
   .onChange(async v=>{cfg[key]=v;writerV1011StudyCfg(plugin.settings);await plugin.saveSettings();}));
 }
}
