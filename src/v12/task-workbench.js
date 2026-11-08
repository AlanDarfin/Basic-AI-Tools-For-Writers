'use strict';
/* Basic v12 task workbench: notes stay authoritative, writes are optional,
 * atomic and reject concurrent changes. Markdown code fences are excluded. */
function writerV12TaskRefs(source){
 const lines=String(source||'').split(/\r?\n/),tasks=[];
 let fence=null;
 for(let line=0;line<lines.length;line++){
  const raw=lines[line],delimiter=/^[ \t]*(`{3,}|~{3,})(.*)$/.exec(raw);
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
  const m=/^([ \t]*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\][ \t]+.+)$/.exec(raw);
  if(!m)continue;
  const label=m[3].replace(/^\]\s+/,'').trim();
  const tags=[...new Set(label.match(/#[\p{L}\p{N}_/-]+/gu)||[])].slice(0,8);
  tasks.push({line,raw,text:label,done:m[2].toLowerCase()==='x',tags});
  if(tasks.length>=250)break;
 }
 return tasks;
}
function writerV12TaskReplacedLine(entry){
 const m=/^([ \t]*(?:[-*+]|\d+\.)[ \t]+\[)([ xX])(\][ \t]+.+)$/.exec(entry.raw);
 if(!m)throw Error('Invalid task marker');
 return m[1]+(entry.done?' ':'x')+m[3];
}
async function writerV12ToggleTask(plugin,file,entry,expected){
 if(!(file instanceof TFile)||file.extension!=='md')throw Error('Invalid task file');
 if(typeof expected!=='string'||expected.length>2500000)throw Error('Invalid source snapshot');
 for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])
  if(leaf.view?.file?.path===file.path&&leaf.view.editor?.getValue?.()!==expected)
   throw Error(writerUi('Nota com alterações não salvas: salve antes de marcar.','Unsaved changes: save the note first.'));
 const oldLines=expected.split(/\r?\n/);
 if(oldLines[entry.line]!==entry.raw)throw Error(writerUi('Tarefa desatualizada.','Task is outdated.'));
 const next=oldLines.map((s,i)=>i===entry.line?writerV12TaskReplacedLine(entry):s)
  .join(expected.includes('\r\n')?'\r\n':'\n');
 await plugin.app.vault.process(file,current=>{
  if(current!==expected)throw Error(writerUi('Arquivo mudou; nada foi alterado.','File changed; no modifications applied.'));
  return next;
 });
 return next;
}
function writerV12TaskWorkbench(plugin){
 if(!writerV12On(plugin,'taskNavigator'))return;
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Workbench de tarefas','Task workbench'));
 const root=modal.contentEl;
 const summary=root.createEl('p',{cls:'setting-item-description'});
 const query=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar por tarefa, nota ou etiqueta','Filter by task, note or tag'),style:'width:100%'}});
 const showDone=root.createEl('label',{text:' '+writerUi('Mostrar concluídas','Show completed')});
 const checkbox=showDone.createEl('input',{attr:{type:'checkbox',checked:''}});
 const results=root.createDiv();
 let data=[],loading=false;
 const render=()=>{
  results.empty();
  const term=query.value.trim().toLocaleLowerCase();
  const visible=data.filter(row=>(checkbox.checked||!row.entry.done)&&
   (!term||(row.entry.text+' '+row.file.path).toLocaleLowerCase().includes(term)));
  summary.setText(data.length+' '+writerUi('tarefas · ','tasks · ')+visible.length+' '+writerUi('visíveis','visible'));
  const groups=new Map();
  for(const row of visible.slice(0,400)){
   const tag=row.entry.tags[0]||writerUi('Sem etiqueta','Untagged');
   if(!groups.has(tag))groups.set(tag,[]);
   groups.get(tag).push(row);
  }
  if(!groups.size)results.createEl('p',{text:writerUi('Nenhuma tarefa encontrada.','No tasks found.')});
  for(const [tag,group] of groups){
   results.createEl('h4',{text:tag+' ('+group.length+')'});
   for(const row of group){
    const el=results.createDiv({cls:'setting-item'}),info=el.createDiv({cls:'setting-item-info'});
    info.createDiv({cls:'setting-item-name',text:row.entry.text.slice(0,320)});
    info.createDiv({cls:'setting-item-description',text:row.file.path+' · '+(row.entry.line+1)});
    const button=el.createEl('button',{text:row.entry.done?'☑':'☐',attr:{type:'button','aria-label':writerUi('Alternar tarefa','Toggle task')}});
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{await writerV12ToggleTask(plugin,row.file,row.entry,row.source);await refresh();}
     catch(err){new Notice(String(err.message||err));button.disabled=false;}
    });
    el.createEl('button',{text:writerUi('Abrir','Open'),attr:{type:'button'}})
     .addEventListener('click',()=>void plugin.app.workspace.getLeaf(false).openFile(row.file));
   }
  }
 };
 const refresh=async()=>{
  if(loading)return;
  loading=true;summary.setText(writerUi('Lendo notas locais…','Reading local notes…'));
  try{
   const files=plugin.app.vault.getMarkdownFiles().slice(0,writerV12Config(plugin).maxTaskFiles),rows=[];
   for(let i=0;i<files.length;i+=12){
    const batch=await Promise.all(files.slice(i,i+12).map(async file=>({
     file,source:await plugin.app.vault.cachedRead(file).catch(()=>null)
    })));
    if(!root.isConnected)return;
    for(const {file,source} of batch)if(source!==null)
     for(const entry of writerV12TaskRefs(source))rows.push({file,source,entry});
   }
   data=rows;
  }catch(err){new Notice(String(err.message||err));}
  finally{loading=false;render();}
 };
 query.addEventListener('input',render);
 checkbox.addEventListener('change',render);
 new Setting(root).addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(()=>void refresh()));
 modal.open();void refresh();
}
function writerV12TasksRegister(plugin){
 plugin.addCommand({id:'v12-task-workbench',name:writerUi('Tarefas: Workbench com etiquetas','Tasks: tag-grouped workbench'),
  callback:()=>writerV12TaskWorkbench(plugin)});
}
