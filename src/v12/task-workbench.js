'use strict';
/* Basic v12 task workbench: notes stay authoritative, writes are optional,
 * atomic and reject concurrent changes. Hidden Markdown regions are excluded. */
function writerV1391TaskCommentState(line,comment){
 const ticks=new Map();
 for(const match of line.matchAll(/\x60+/g)){
  const size=match[0].length;
  if(!ticks.has(size))ticks.set(size,{runs:[],next:0});
  ticks.get(size).runs.push({start:match.index,end:match.index+size});
 }
 for(let at=0;at<line.length;){
  if(comment){
   const close=comment==='html'?'-->':'%%',end=line.indexOf(close,at);
   if(end<0)return comment;
   at=end+close.length;comment=null;continue;
  }
  if(line[at]==='\\'){at+=2;continue;}
  // Comment examples in a same-line code span must not hide subsequent tasks.
  if(line[at]==='`'){
   let end=at+1;while(line[end]==='`')end++;
   const group=ticks.get(end-at);
   // Each delimiter is visited at most once, even in a long unmatched example.
   if(group)while(group.next<group.runs.length&&group.runs[group.next].start<end)group.next++;
   at=group?.runs[group.next]?.end??end;continue;
  }
  if(line.startsWith('<!--',at)){comment='html';at+=4;continue;}
  if(line.startsWith('%%',at)){comment='obsidian';at+=2;continue;}
  at++;
 }
 return comment;
}
function writerV1391TaskWalk(source,visit){
 const lines=String(source||'').split(/\r?\n/);
 let frontmatter=/^\uFEFF?---[ \t]*$/.test(lines[0]||''),fence=null,comment=null;
 for(let line=0;line<lines.length;line++){
  const raw=lines[line];
  if(frontmatter){if(line>0&&/^(?:---|\.\.\.)[ \t]*$/.test(raw))frontmatter=false;continue;}
  const hidden=!!comment,delimiter=!hidden&&/^[ \t]*(`{3,}|~{3,})(.*)$/.exec(raw);
  if(delimiter){
   const marker=delimiter[1],tail=delimiter[2];
   if(fence){
    if(marker[0]===fence.char&&marker.length>=fence.length&&!tail.trim())fence=null;
    continue;
   }
   if(marker[0]==='~'||!tail.includes('`')){
    fence={char:marker[0],length:marker.length};
    continue;
   }
  }
  if(fence)continue;
  comment=writerV1391TaskCommentState(raw,comment);
  if(hidden||typeof visit!=='function')continue;
  const m=/^([ \t]*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\][ \t]+.+)$/.exec(raw);
  if(!m)continue;
  const label=m[3].replace(/^\]\s+/,'').trim();
  const tags=[...new Set(label.match(/#[\p{L}\p{N}_/-]+/gu)||[])].slice(0,8);
  if(visit({line,raw,text:label,done:m[2].toLowerCase()==='x',tags})===false)break;
 }
 return {frontmatter,fence,comment};
}
function writerV1391TaskScan(source){
 const tasks=[];let truncated=false;
 writerV1391TaskWalk(source,task=>{
  if(tasks.length===250){truncated=true;return false;}
  tasks.push(task);
 });
 return {tasks,truncated};
}
function writerV12TaskRefs(source){return writerV1391TaskScan(source).tasks;}
function writerV1391TaskEligible(source,entry){
 if(!entry||!Number.isInteger(entry.line)||entry.line<0||typeof entry.raw!=='string'||typeof entry.done!=='boolean')return false;
 let eligible=false;
 writerV1391TaskWalk(source,task=>{
  if(task.line>entry.line)return false;
  if(task.line===entry.line){eligible=task.raw===entry.raw&&task.done===entry.done;return false;}
 });
 return eligible;
}
function writerV12TaskReplacedLine(entry){
 const m=/^([ \t]*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\][ \t]+.+)$/.exec(entry.raw);
 if(!m)throw Error('Invalid task marker');
 return m[1]+(entry.done?' ':'x')+m[3];
}
async function writerV12ToggleTask(plugin,file,entry,expected){
 if(!(file instanceof TFile)||file.extension!=='md')throw Error('Invalid task file');
 if(typeof expected!=='string'||expected.length>2500000)throw Error('Invalid source snapshot');
 const path=file.path;writerV139TaskEditable(plugin,file,path,expected);
 if(!entry||!Number.isInteger(entry.line)||entry.line<0)throw Error(writerUi('Tarefa desatualizada.','Task is outdated.'));
 const reference={line:entry.line,raw:entry.raw,done:entry.done};
 const parts=expected.split(/(\r?\n)/),index=reference.line*2;
 if(parts[index]!==reference.raw)throw Error(writerUi('Tarefa desatualizada.','Task is outdated.'));
 if(!writerV1391TaskEligible(expected,reference))throw Error(writerUi('Esta linha não é uma tarefa Markdown editável. Atualize o painel.','This line is not an editable Markdown task. Refresh the dashboard.'));
 // Keep each original line ending, including notes containing both LF and CRLF.
 parts[index]=writerV12TaskReplacedLine(reference);const next=parts.join('');
 await plugin.app.vault.process(file,current=>{
  writerV139TaskEditable(plugin,file,path,expected);
  if(current!==expected)throw Error(writerUi('Arquivo mudou; nada foi alterado.','File changed; no modifications applied.'));
  if(!writerV1391TaskEligible(current,reference))throw Error(writerUi('Esta linha não é uma tarefa Markdown editável. Atualize o painel.','This line is not an editable Markdown task. Refresh the dashboard.'));
  return next;
 });
 return next;
}
function writerV139TaskOn(plugin){
 return typeof writerV12On==='function'?writerV12On(plugin,'taskNavigator'):
  plugin?.settings?.v12Toolkit?.enabled!==false&&plugin?.settings?.v12Toolkit?.taskNavigator!==false;
}
function writerV139TaskToday(now=new Date()){
 return String(now.getFullYear()).padStart(4,'0')+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
}
function writerV139TaskDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
 const [year,month,day]=value.split('-').map(Number);
 if(year<1||month<1||month>12||day<1||day>31)return '';
 const check=new Date(0);check.setUTCHours(12,0,0,0);check.setUTCFullYear(year,month-1,day);
 return check.getUTCFullYear()===year&&check.getUTCMonth()===month-1&&check.getUTCDate()===day?value:'';
}
function writerV139TaskDayAfter(day,count){
 const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+count);
 return date.toISOString().slice(0,10);
}
function writerV139TaskMetadata(text){
 const source=String(text||'');
 const dates=[...source.matchAll(/📅\s*(\d{4}-\d{2}-\d{2})(?=$|\s)|\[due::\s*(\d{4}-\d{2}-\d{2})\s*\]/gu)];
 const due=dates.map(match=>writerV139TaskDate(match[1]||match[2])).find(Boolean)||'';
 const priority=/(?:^|\s)#(high|medium|low)(?=\s|$)/i.exec(source)?.[1]?.toLowerCase()||'';
 return {due,priority};
}
function writerV139TaskVisible(entry,scope,today=writerV139TaskToday(),metadata){
 const {due}=metadata||writerV139TaskMetadata(entry.text);
 if(scope==='today')return due===today;
 if(scope==='overdue')return !!due&&due<today;
 if(scope==='upcoming')return !!due&&due>today&&due<=writerV139TaskDayAfter(today,7);
 if(scope==='unscheduled')return !due;
 return true;
}
function writerV139TaskLine(fields){
 const title=String(fields?.title||'').trim();
 if(!title||title.length>500||/[\r\n\0]/.test(title))throw Error(writerUi('Use uma descrição de uma linha, com até 500 caracteres.','Use a one-line description of up to 500 characters.'));
 const due=String(fields?.due||'').trim(),priority=String(fields?.priority||'');
 if(due&&!writerV139TaskDate(due))throw Error(writerUi('Informe uma data válida no formato AAAA-MM-DD.','Enter a valid YYYY-MM-DD date.'));
 if(!['','high','medium','low'].includes(priority))throw Error(writerUi('Prioridade inválida.','Invalid priority.'));
 const tags=[...new Set(String(fields?.tags||'').trim().split(/\s+/).filter(Boolean))];
 if(tags.length>8||tags.some(tag=>!/^#[\p{L}\p{N}_][\p{L}\p{N}_/-]*$/u.test(tag)))throw Error(writerUi('Use até oito etiquetas, como #escrita #revisão.','Use up to eight tags, such as #writing #review.'));
 return '- [ ] '+title+(priority?' #'+priority:'')+(tags.length?' '+tags.join(' '):'')+(due?' 📅 '+due:'');
}
function writerV139TaskAppendable(source){
 const state=writerV1391TaskWalk(source);
 return !state.frontmatter&&!state.fence&&!state.comment;
}
function writerV139TaskEditable(plugin,file,path,source){
 if(!writerV139TaskOn(plugin))throw Error(writerUi('As tarefas estão desligadas nas configurações.','Tasks are disabled in settings.'));
 if(!(file instanceof TFile)||file.extension!=='md'||file.path!==path||
  (typeof plugin.app.vault.getAbstractFileByPath==='function'&&plugin.app.vault.getAbstractFileByPath(path)!==file))
  throw Error(writerUi('A nota foi movida ou removida. Escolha o destino novamente.','The note was moved or removed. Choose the destination again.'));
 for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
  const view=leaf.view;
  if(view?.file?.path===path&&typeof view.editor?.getValue==='function'&&view.editor.getValue()!==source)
   throw Error(writerUi('A nota tem alterações não salvas. Salve antes de adicionar ou marcar tarefas.','The note has unsaved changes. Save before adding or checking tasks.'));
 }
}
async function writerV139TaskPreview(plugin,file,fields){
 if(!writerV139TaskOn(plugin))throw Error(writerUi('As tarefas estão desligadas nas configurações.','Tasks are disabled in settings.'));
 if(!(file instanceof TFile)||file.extension!=='md')throw Error(writerUi('Escolha uma nota Markdown de destino.','Choose a destination Markdown note.'));
 const path=file.path,mtime=file.stat?.mtime,size=file.stat?.size,line=writerV139TaskLine(fields);
 const source=await plugin.app.vault.read(file);
 if(typeof source!=='string'||source.length>2500000)throw Error(writerUi('Esta nota é grande demais para uma captura segura.','This note is too large for safe capture.'));
 writerV139TaskEditable(plugin,file,path,source);
 if(file.stat?.mtime!==mtime||file.stat?.size!==size)throw Error(writerUi('A nota mudou durante a leitura. Atualize a prévia.','The note changed while reading. Refresh the preview.'));
 if(!writerV139TaskAppendable(source))throw Error(writerUi('Feche o comentário ou bloco de código/propriedades no final da nota antes de adicionar tarefas.','Close the unfinished comment, code or properties block before adding tasks.'));
 const eol=source.includes('\r\n')?'\r\n':'\n',separator=source&&!source.endsWith('\n')?eol:'';
 return Object.freeze({file,path,mtime,size,source,line,next:source+separator+line+eol});
}
async function writerV139TaskCommit(plugin,snapshot){
 if(!snapshot||typeof snapshot.source!=='string'||typeof snapshot.line!=='string'||typeof snapshot.next!=='string')throw Error('Invalid task preview');
 const {file,path,source,next,mtime,size}=snapshot;
 writerV139TaskEditable(plugin,file,path,source);
 if(file.stat?.mtime!==mtime||file.stat?.size!==size)throw Error(writerUi('A nota mudou. Atualize a prévia antes de adicionar.','The note changed. Refresh the preview before adding.'));
 if(typeof plugin.app.vault.process!=='function')throw Error(writerUi('A captura exige gravação atômica do Obsidian.','Capture requires Obsidian atomic writes.'));
 await plugin.app.vault.process(file,current=>{
  writerV139TaskEditable(plugin,file,path,source);
  if(current!==source)throw Error(writerUi('A nota mudou. Nenhuma tarefa foi adicionada.','The note changed. No task was added.'));
  return next;
 });
 return file;
}
function writerV139TaskQuickAdd(plugin,onSaved){
 if(!writerV139TaskOn(plugin))return;
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Nova tarefa','New task'));
 const root=modal.contentEl;root.addClass('writer-native-task-capture');
 root.createEl('p',{cls:'setting-item-description',text:writerUi('Adiciona uma linha de tarefa no final da nota escolhida. Confira o destino e a prévia antes de salvar.','Append a task line to the selected note. Review the destination and preview before saving.')});
 const files=plugin.app.vault.getMarkdownFiles().sort((a,b)=>a.path.localeCompare(b.path));
 const active=plugin.app.workspace.getActiveFile?.(),fields={title:'',due:'',priority:'',tags:''};
 let chosen=files.includes(active)?active:null,snapshot=null,token=0,closed=false,busy=false,addButton,previewButton;
 const controls=[];
 const feedback=root.createEl('p',{cls:'writer-native-task-feedback',attr:{role:'status','aria-live':'polite'}});
 const destination=root.createEl('p',{cls:'writer-native-task-destination'});
 const preview=root.createEl('pre',{cls:'writer-native-task-preview'});
 const invalidate=()=>{token++;snapshot=null;addButton?.setDisabled(true);preview.setText('');destination.setText('');feedback.setText('');};
 const bind=(setting,key,placeholder='')=>new Setting(root).setName(setting).addText(input=>{
  controls.push(input);input.setValue(fields[key]).setPlaceholder(placeholder).onChange(value=>{fields[key]=value;invalidate();});
  if(key==='title')input.inputEl.setAttribute('maxlength','500');
  if(key==='due')input.inputEl.type='date';
 });
 new Setting(root).setName(writerUi('Nota de destino','Destination note')).addDropdown(dropdown=>{
  controls.push(dropdown);dropdown.addOption('',writerUi('Escolher nota Markdown','Choose Markdown note'));
  for(const file of files)dropdown.addOption(file.path,file.path);
  dropdown.setValue(chosen?.path||'').onChange(path=>{chosen=files.find(file=>file.path===path)||null;invalidate();});
 });
 bind(writerUi('Descrição','Description'),'title',writerUi('O que precisa ser feito?','What needs to be done?'));
 bind(writerUi('Prazo (opcional)','Due date (optional)'),'due');
 new Setting(root).setName(writerUi('Prioridade','Priority')).addDropdown(dropdown=>{
  controls.push(dropdown);
  for(const [value,pt,en] of [['','Sem prioridade','No priority'],['high','Alta','High'],['medium','Média','Medium'],['low','Baixa','Low']])dropdown.addOption(value,writerUi(pt,en));
  dropdown.setValue('').onChange(value=>{fields.priority=value;invalidate();});
 });
 bind(writerUi('Etiquetas (opcional)','Tags (optional)'),'tags','#writing #review');
 const setBusy=value=>{busy=value;for(const control of controls)control.setDisabled(value);previewButton?.setDisabled(value);addButton?.setDisabled(value||!snapshot);};
 new Setting(root).addButton(button=>{
  previewButton=button;button.setButtonText(writerUi('Preparar prévia','Prepare preview')).onClick(async()=>{
   if(busy||closed)return;invalidate();const current=token;setBusy(true);
   try{
    const prepared=await writerV139TaskPreview(plugin,chosen,fields);
    if(closed||token!==current)return;
    snapshot=prepared;destination.setText(writerUi('Destino: ','Destination: ')+prepared.path);preview.setText(prepared.line);
    feedback.setText(writerUi('Pronto para adicionar uma tarefa.','Ready to add one task.'));
   }catch(error){if(!closed&&token===current)feedback.setText(String(error.message||error));}
   finally{if(!closed)setBusy(false);}
  });
 }).addButton(button=>{
  addButton=button;button.setButtonText(writerUi('Adicionar tarefa','Add task')).setCta().setDisabled(true).onClick(async()=>{
   if(busy||closed||!snapshot)return;setBusy(true);
   try{
    const file=await writerV139TaskCommit(plugin,snapshot);
    if(!closed){modal.close();new Notice(writerUi('Tarefa adicionada em ','Task added to ')+file.path);onSaved?.();}
   }catch(error){if(!closed){invalidate();feedback.setText(String(error.message||error));}}
   finally{if(!closed)setBusy(false);}
  });
 });
 if(!files.length)feedback.setText(writerUi('Crie uma nota Markdown para receber suas tarefas.','Create a Markdown note to hold your tasks.'));
 modal.onClose=()=>{closed=true;token++;snapshot=null;};modal.open();return modal;
}
function writerV12TaskWorkbench(plugin,initialScope='all'){
 if(!writerV139TaskOn(plugin))return;
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Minhas tarefas','My tasks'));
 const root=modal.contentEl;root.addClass('writer-native-tasks');
 const summary=root.createEl('p',{cls:'setting-item-description',attr:{role:'status','aria-live':'polite'}});
 const coverage=root.createEl('p',{cls:'writer-native-task-coverage',attr:{role:'status','aria-live':'polite'}});
 const toolbar=root.createDiv({cls:'writer-native-task-toolbar'});
 const query=toolbar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar por tarefa, nota ou etiqueta','Filter by task, note or tag'),'aria-label':writerUi('Buscar tarefas','Find tasks')}});
 const scope=toolbar.createEl('select',{attr:{'aria-label':writerUi('Filtrar por prazo','Filter by due date')}});
 for(const [value,pt,en] of [['all','Todas','All'],['today','Hoje','Today'],['overdue','Atrasadas','Overdue'],['upcoming','Próximos 7 dias','Next 7 days'],['unscheduled','Sem prazo','No due date']])scope.createEl('option',{text:writerUi(pt,en),attr:{value}});
 scope.value=['all','today','overdue','upcoming','unscheduled'].includes(initialScope)?initialScope:'all';
 const showDone=toolbar.createEl('label',{cls:'writer-native-task-completed'});
 const checkbox=showDone.createEl('input',{attr:{type:'checkbox'}});showDone.createSpan({text:writerUi('Mostrar concluídas','Show completed')});
 const results=root.createDiv({cls:'writer-native-task-results'});let data=[],loading=false,closed=false;
 let scan={total:0,examined:0,failed:0,limited:0},scanFailed=false;
 const render=()=>{
  if(closed)return;results.empty();
  if(!writerV139TaskOn(plugin)){summary.setText(writerUi('As tarefas estão desligadas nas configurações.','Tasks are disabled in settings.'));coverage.setText('');return;}
  const term=query.value.trim().toLocaleLowerCase(),today=writerV139TaskToday();
  const visible=data.filter(row=>(checkbox.checked||!row.entry.done)&&writerV139TaskVisible(row.entry,scope.value,today,row.meta)&&
   (!term||(row.entry.text+' '+row.file.path).toLocaleLowerCase().includes(term)));
  const rank={high:0,medium:1,low:2,'':3};
  visible.sort((a,b)=>{
   const x=a.meta,y=b.meta;
   return Number(a.entry.done)-Number(b.entry.done)||(x.due||'9999').localeCompare(y.due||'9999')||rank[x.priority]-rank[y.priority]||a.file.path.localeCompare(b.file.path)||a.entry.line-b.entry.line;
  });
  summary.setText(data.length+' '+writerUi('tarefas · ','tasks · ')+visible.length+' '+writerUi('visíveis','visible')+' · '+scan.examined+'/'+scan.total+' '+writerUi('notas examinadas','notes examined')+(visible.length>400?writerUi(' · exibindo as primeiras 400',' · showing the first 400'):''));
  const incomplete=[];
  if(scanFailed)incomplete.push(writerUi('não foi possível atualizar; os resultados anteriores foram mantidos','refresh failed; previous results were retained'));
  if(scan.examined<scan.total)incomplete.push((scan.total-scan.examined)+' '+writerUi('notas fora do limite da busca','notes outside the scan limit'));
  if(scan.failed)incomplete.push(scan.failed+' '+writerUi('notas não puderam ser lidas','notes could not be read'));
  if(scan.limited)incomplete.push(scan.limited+' '+writerUi('notas com mais de 250 tarefas; somente as primeiras 250 de cada nota foram incluídas','notes with more than 250 tasks; only the first 250 from each note were included'));
  coverage.setText(incomplete.length?writerUi('Busca incompleta: ','Incomplete search: ')+incomplete.join(' · ')+'.':'');
  const groups=new Map();
  for(const row of visible.slice(0,400)){
   const tag=row.entry.tags.find(tag=>!/^#(?:high|medium|low)$/i.test(tag))||writerUi('Sem etiqueta','Untagged');
   if(!groups.has(tag))groups.set(tag,[]);groups.get(tag).push(row);
  }
  if(!groups.size)results.createEl('p',{text:writerUi('Nenhuma tarefa encontrada neste filtro nas notas examinadas.','No tasks found for this filter in the examined notes.')});
  for(const [tag,group] of groups){
   results.createEl('h4',{text:tag+' ('+group.length+')'});
   for(const row of group){
    const meta=row.meta,el=results.createDiv({cls:'writer-native-task-row'});
    const checkLabel=el.createEl('label',{cls:'writer-native-task-check'});
    const button=checkLabel.createEl('input',{attr:{type:'checkbox','aria-label':writerUi('Alternar tarefa','Toggle task')}});button.checked=row.entry.done;
    const info=el.createDiv({cls:'writer-native-task-info'});info.createDiv({cls:'writer-native-task-title',text:row.entry.text.slice(0,500)});
    info.createDiv({cls:'setting-item-description',text:row.file.path+' · '+(row.entry.line+1)});
    if(meta.due){const due=info.createSpan({cls:'writer-native-task-due',text:meta.due});if(!row.entry.done&&meta.due<today)due.addClass('is-overdue');}
    if(meta.priority)info.createSpan({cls:'writer-native-task-priority',text:writerUi({high:'Alta',medium:'Média',low:'Baixa'}[meta.priority],{high:'High',medium:'Medium',low:'Low'}[meta.priority])});
    button.addEventListener('change',async()=>{
     if(closed)return;
     if(!writerV139TaskOn(plugin)){button.checked=row.entry.done;render();return;}button.disabled=true;
     try{await writerV12ToggleTask(plugin,row.file,row.entry,row.source);if(!closed)await refresh();}
     catch(error){if(!closed){button.checked=row.entry.done;button.disabled=false;new Notice(String(error.message||error));}}
    });
    el.createEl('button',{text:writerUi('Abrir','Open'),attr:{type:'button'}}).addEventListener('click',()=>{
     if(closed||!writerV139TaskOn(plugin))return;modal.close();void plugin.app.workspace.getLeaf(false).openFile(row.file,{eState:{line:row.entry.line}});
    });
   }
  }
 };
 const refresh=async()=>{
  if(loading||closed)return;if(!writerV139TaskOn(plugin)){render();return;}loading=true;summary.setText(writerUi('Lendo notas locais…','Reading local notes…'));
  try{
   const all=plugin.app.vault.getMarkdownFiles(),files=all.slice(0,writerV12Config(plugin).maxTaskFiles),rows=[];
   const report={total:all.length,examined:0,failed:0,limited:0};
   for(let i=0;i<files.length;i+=12){
    const batch=await Promise.all(files.slice(i,i+12).map(async file=>({file,source:await plugin.app.vault.cachedRead(file).catch(()=>null)})));
    if(closed||!writerV139TaskOn(plugin))return;
    report.examined+=batch.length;
    for(const {file,source} of batch){
     if(typeof source!=='string'){report.failed++;continue;}
     const parsed=writerV1391TaskScan(source);if(parsed.truncated)report.limited++;
     for(const entry of parsed.tasks)rows.push({file,source,entry,meta:writerV139TaskMetadata(entry.text)});
    }
   }
   data=rows;scan=report;scanFailed=false;
  }catch(error){scanFailed=true;if(!closed)new Notice(String(error.message||error));}
  finally{loading=false;if(!closed&&writerV139TaskOn(plugin))render();}
 };
 query.addEventListener('input',render);checkbox.addEventListener('change',render);scope.addEventListener('change',render);
 new Setting(root).addButton(button=>button.setButtonText(writerUi('Nova tarefa','New task')).onClick(()=>writerV139TaskQuickAdd(plugin,()=>void refresh())))
  .addButton(button=>button.setButtonText(writerUi('Atualizar','Refresh')).onClick(()=>void refresh()))
  .addButton(button=>button.setButtonText(writerUi('Opções de busca','Search options')).setDisabled(typeof plugin.openCoreSettings!=='function').onClick(()=>{
   if(closed||typeof plugin.openCoreSettings!=='function')return;modal.close();plugin.openCoreSettings('tasks');
  }));
 modal.onClose=()=>{closed=true;data=[];};modal.open();void refresh();return modal;
}
function writerV12TasksRegister(plugin){
 plugin.addCommand({id:'v12-task-workbench',name:writerUi('Tarefas: abrir painel','Tasks: open dashboard'),callback:()=>writerV12TaskWorkbench(plugin)});
 plugin.addCommand({id:'v13-tasks-today',name:writerUi('Tarefas: ver prazos de hoje','Tasks: view today’s due dates'),callback:()=>writerV12TaskWorkbench(plugin,'today')});
 plugin.addCommand({id:'v13-task-quick-add',name:writerUi('Tarefas: criar tarefa rápida','Tasks: quick add'),callback:()=>writerV139TaskQuickAdd(plugin)});
}
