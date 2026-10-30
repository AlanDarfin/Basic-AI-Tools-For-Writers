'use strict';
/* Longform project quick tasks, inspired by Homework Manager subjects / views. */
function w4HomeworkNormalize(prefs){
 if(!prefs.homework||!Array.isArray(prefs.homework.views))prefs.homework={selected:0,views:[{name:'Principal',subjects:[],tasks:[]}]};
 if(!prefs.homework.views.length)prefs.homework.views.push({name:'Principal',subjects:[],tasks:[]});
 prefs.homework.views.forEach(view=>{
  view.subjects=Array.isArray(view.subjects)?view.subjects:[];
  view.tasks=Array.isArray(view.tasks)?view.tasks:[];
  view.subjects.forEach(sub=>{sub.tasks=Array.isArray(sub.tasks)?sub.tasks:[];});
 });
 prefs.homework.selected=Math.max(0,Math.min(prefs.homework.views.length-1,Number(prefs.homework.selected)||0));
 return prefs.homework;
}
class WriterHomework{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.homework;}
 data(project){const prefs=this.plugin.app.workspace.getLeavesOfType(PROJECT_VIEW)[0]?.view?.prefs(project);return prefs?w4HomeworkNormalize(prefs):null;}
 async save(view){await this.plugin.saveSettings();await view.render();}
 showTaskDialog(view,project,collection,task){
  const modal=new Modal(this.plugin.app),txt=(p,e)=>w4text(this.plugin,p,e);
  const editing=!!task,entry=task?{...task}:{id:'task-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:'',date:'',page:'',done:false};
  modal.onOpen=()=>{
   modal.setTitle(txt(editing?'Editar tarefa':'Nova tarefa',editing?'Edit task':'New task'));
   new Setting(modal.contentEl).setName(txt('Descrição','Description')).addText(t=>t.setValue(entry.name).setPlaceholder(txt('O que precisa ser feito?','What needs to be done?')).onChange(v=>entry.name=v));
   new Setting(modal.contentEl).setName(txt('Prazo (AAAA-MM-DD)','Due (YYYY-MM-DD)')).addText(t=>{
    t.inputEl.type='date';t.setValue(entry.date||'').onChange(v=>entry.date=v);
   });
   new Setting(modal.contentEl).setName(txt('Nota relacionada (opcional)','Related note (optional)')).addText(t=>t.setValue(entry.page||'').onChange(v=>entry.page=v));
   const row=new Setting(modal.contentEl);
   row.addButton(b=>b.setButtonText(txt('Cancelar','Cancel')).onClick(()=>modal.close()));
   row.addButton(b=>b.setButtonText(txt('Salvar','Save')).setCta().onClick(async()=>{
    if(!entry.name.trim())return new Notice(txt('Informe o nome da tarefa.','Enter the task name.'));
    entry.name=entry.name.trim();
    if(entry.date&&!/^\d{4}-\d{2}-\d{2}$/.test(entry.date))return new Notice(txt('Prazo inválido.','Invalid due date.'));
    if(!editing)collection.push(entry);
    else Object.assign(task,entry);
    modal.close();await this.save(view);
   }));
  };
  modal.open();
 }
 drawTask(container,view,project,task,collection){
  const txt=(p,e)=>w4text(this.plugin,p,e);
  if(this.cfg.hideCompleted&&task.done)return;
  const row=container.createDiv({cls:'writer-v4-task'});
  const check=row.createEl('input',{attr:{type:'checkbox','aria-label':txt('Concluir tarefa','Complete task')}});
  check.checked=!!task.done;
  check.addEventListener('change',async()=>{task.done=check.checked;await this.save(view);});
  const content=row.createDiv({cls:'writer-v4-task-description'});
  const name=content.createEl('span',{text:task.name||txt('Sem título','Untitled'),cls:task.done?'is-done':''});
  if(this.cfg.showTooltips)name.title=task.page||task.name;
  if(task.date){
   const label=content.createEl('small',{text:task.date});
   if(!task.done&&task.date<new Date().toISOString().slice(0,10))label.addClass('is-overdue');
  }
  const buttons=row.createDiv({cls:'writer-v4-task-actions'});
  if(task.page)buttons.createEl('button',{text:'↗',attr:{title:txt('Abrir nota','Open note'),'aria-label':txt('Abrir nota','Open note')}})
   .addEventListener('click',()=>this.plugin.app.workspace.openLinkText(task.page,project.file.path,false));
  buttons.createEl('button',{text:'⋯',attr:{title:txt('Editar tarefa','Edit task'),'aria-label':txt('Editar tarefa','Edit task')}})
   .addEventListener('click',e=>{
    const menu=new Menu(this.plugin.app);
    menu.addItem(item=>item.setTitle(txt('Editar','Edit')).setIcon('pencil').onClick(()=>this.showTaskDialog(view,project,collection,task)));
    menu.addItem(item=>item.setTitle(txt('Excluir','Delete')).setIcon('trash').onClick(async()=>{
     const idx=collection.indexOf(task);if(idx>=0)collection.splice(idx,1);
     await this.save(view);
    }));
    menu.showAtMouseEvent(e);
   });
 }
 draw(panel,view,project){
  const txt=(p,e)=>w4text(this.plugin,p,e),data=w4HomeworkNormalize(view.prefs(project));
  if(!this.cfg.enabled){panel.createEl('p',{text:txt('Tarefas desativadas nas configurações.','Tasks are disabled in settings.')});return;}
  panel.addClass('writer-v4-homework');
  const head=panel.createDiv({cls:'writer-v4-homework-head'});
  head.createEl('h3',{text:txt('Tarefas do projeto','Project tasks')});
  const picker=head.createEl('select',{attr:{'aria-label':txt('Lista de tarefas','Task list')}});
  data.views.forEach((v,i)=>{const option=picker.createEl('option',{text:v.name});option.value=String(i);});
  picker.value=String(data.selected);
  picker.addEventListener('change',async()=>{data.selected=Number(picker.value);await this.save(view);});
  head.createEl('button',{text:'+',attr:{title:txt('Nova lista','New list')}}).addEventListener('click',()=>{
   new TextPrompt(this.plugin.app,txt('Nova lista','New list'),async name=>{
    const clean=String(name||'').trim();if(!clean)return;
    data.views.push({name:clean,subjects:[],tasks:[]});data.selected=data.views.length-1;await this.save(view);
   }).open();
  });
  const current=data.views[data.selected];
  const toolbar=panel.createDiv({cls:'writer-v4-homework-actions'});
  toolbar.createEl('button',{text:txt('+ Tarefa','+ Task')}).addEventListener('click',()=>this.showTaskDialog(view,project,current.tasks));
  toolbar.createEl('button',{text:txt('+ Grupo','+ Group')}).addEventListener('click',()=>{
   new TextPrompt(this.plugin.app,txt('Grupo de tarefas','Task group'),async name=>{
    const clean=String(name||'').trim();if(!clean)return;
    current.subjects.push({name:clean,tasks:[]});await this.save(view);
   }).open();
  });
  toolbar.createEl('button',{text:txt('Renomear lista','Rename list')}).addEventListener('click',()=>{
   new TextPrompt(this.plugin.app,txt('Nome da lista','List name'),async name=>{
    if(name.trim()){current.name=name.trim();await this.save(view);}
   },current.name).open();
  });
  const sum=[...current.tasks,...current.subjects.flatMap(s=>s.tasks)];
  const done=sum.filter(t=>t.done).length;
  panel.createEl('p',{text:done+'/'+sum.length+' '+txt('tarefas concluídas','tasks completed'),cls:'writer-tools-muted'});
  if(sum.length){const progress=panel.createEl('progress');progress.max=sum.length;progress.value=done;}
  const inbox=panel.createDiv({cls:'writer-v4-homework-group'});
  inbox.createEl('h4',{text:txt('Tarefas rápidas','Quick tasks')});
  for(const task of current.tasks)this.drawTask(inbox,view,project,task,current.tasks);
  const subjects=this.cfg.autoSort?[...current.subjects].sort((a,b)=>b.tasks.filter(t=>!t.done).length-a.tasks.filter(t=>!t.done).length):current.subjects;
  for(const subject of subjects){
   const group=panel.createDiv({cls:'writer-v4-homework-group'});
   const title=group.createDiv({cls:'writer-v4-homework-subject'});
   title.createEl('strong',{text:subject.name});
   title.createEl('button',{text:'+',attr:{'aria-label':txt('Adicionar tarefa','Add task')}}).addEventListener('click',()=>this.showTaskDialog(view,project,subject.tasks));
   title.createEl('button',{text:'⋯',attr:{'aria-label':txt('Opções do grupo','Group options')}}).addEventListener('click',e=>{
    const menu=new Menu(this.plugin.app);
    menu.addItem(item=>item.setTitle(txt('Renomear grupo','Rename group')).onClick(()=>{
     new TextPrompt(this.plugin.app,txt('Nome do grupo','Group name'),async name=>{if(name.trim()){subject.name=name.trim();await this.save(view);}},subject.name).open();
    }));
    menu.addItem(item=>item.setTitle(txt('Remover grupo','Remove group')).onClick(async()=>{
     if(subject.tasks.length)return new Notice(txt('Mova ou remova as tarefas do grupo primeiro.','Move or remove group tasks first.'));
     const i=current.subjects.indexOf(subject);if(i>=0)current.subjects.splice(i,1);await this.save(view);
    }));
    menu.showAtMouseEvent(e);
   });
   for(const task of subject.tasks)this.drawTask(group,view,project,task,subject.tasks);
  }
 }
}
