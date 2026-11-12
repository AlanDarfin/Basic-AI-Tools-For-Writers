'use strict';
/* Basic Longform arc dividers.
 * Purely visual items: never enter longform.scenes and never create vault files.
 * Plugin project preferences preserve a separate ordered list for each draft. */
function writerV13ArcRoots(view,project){
 return view.activeScenes(project).filter(scene=>Number(scene.indent||0)===0).map(scene=>scene.title);
}
function writerV13ArcStore(view,project){
 const prefs=view.prefs(project);
 if(!prefs.arcDividers||typeof prefs.arcDividers!=='object'||Array.isArray(prefs.arcDividers))prefs.arcDividers={};
 const draft=view.draft||'Principal';
 if(!Array.isArray(prefs.arcDividers[draft])){
  const original=prefs.arcDividers.Principal;
  prefs.arcDividers[draft]=draft!=='Principal'&&Array.isArray(original)?
   original.map(item=>({...item})):[]; // a new variant inherits arc markers
 }
 return prefs.arcDividers[draft];
}
function writerV13ArcLayout(roots,dividers){
 const known=new Set(roots),groups=new Map();
 for(const item of dividers||[]){
  if(!item||typeof item.id!=='string')continue;
  const before=known.has(item.before)?item.before:null;
  if(!groups.has(before))groups.set(before,[]);
  groups.get(before).push({type:'divider',id:item.id,label:String(item.label||''),before});
 }
 const layout=[];
 for(const title of roots){
  layout.push(...(groups.get(title)||[]),{type:'scene',title});
 }
 layout.push(...(groups.get(null)||[]));
 return layout;
}
function writerV13ArcReanchor(dividers,layout){
 const byId=new Map(dividers.map(item=>[item.id,item])),next=[];
 for(let i=0;i<layout.length;i++){
  if(layout[i].type!=='divider')continue;
  const item=byId.get(layout[i].id);
  if(!item)continue;
  item.before=layout.slice(i+1).find(entry=>entry.type==='scene')?.title||null;
  next.push(item);
 }
 dividers.splice(0,dividers.length,...next);
 return dividers;
}
async function writerV13ArcSave(view){
 await view.plugin.saveSettings();
 await view.render();
}
function writerV13ArcPrompt(view,project,existing=null){
 new TextPrompt(view.app,existing?
  lfMsg('Texto do separador (opcional)','Divider text (optional)'):
  lfMsg('Novo separador de arco (texto opcional)','New story arc divider (optional text)'),
  async text=>{
   const items=writerV13ArcStore(view,project);
   if(existing){
    const item=items.find(entry=>entry.id===existing.id);
    if(!item)return;
    item.label=String(text||'').trim().slice(0,160);
   }else{
    items.push({id:'arc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),
     label:String(text||'').trim().slice(0,160),before:null});
   }
   await writerV13ArcSave(view);
  },existing?.label||'').open();
}
async function writerV13ArcMove(view,project,id,target,after=false){
 const dividers=writerV13ArcStore(view,project);
 const layout=writerV13ArcLayout(writerV13ArcRoots(view,project),dividers);
 const sourceIndex=layout.findIndex(item=>item.type==='divider'&&item.id===id);
 const targetIndex=layout.findIndex(item=>item.type==='divider'?item.id===target:item.title===target);
 if(sourceIndex<0||targetIndex<0||sourceIndex===targetIndex)return;
 const [source]=layout.splice(sourceIndex,1);
 const index=layout.findIndex(item=>item.type==='divider'?item.id===target:item.title===target);
 layout.splice(index+(after?1:0),0,source);
 writerV13ArcReanchor(dividers,layout);
 view.writerArcPickup=null;
 await writerV13ArcSave(view);
}
async function writerV13ArcShift(view,project,id,delta){
 const layout=writerV13ArcLayout(writerV13ArcRoots(view,project),writerV13ArcStore(view,project));
 const index=layout.findIndex(item=>item.type==='divider'&&item.id===id);
 const target=layout[index+delta];
 if(index<0||!target)return;
 await writerV13ArcMove(view,project,id,target.type==='divider'?target.id:target.title,delta>0);
}
function writerV13ArcInstall(){
 if(typeof ProjectsView!=='function'||ProjectsView.prototype._writerArcInstalled)return;
 const original=ProjectsView.prototype.drawScenes;
 const originalChange=ProjectsView.prototype.changeScenes;
 // Preserve an arc's position when the chapter anchoring it is renamed or removed.
 ProjectsView.prototype.changeScenes=async function(project,change){
  let adjusted=false;
  const items=writerV13ArcStore(this,project);
  const result=await originalChange.call(this,project,scenes=>{
   const before=scenes.filter(scene=>Number(scene.indent||0)===0).map(scene=>scene.title);
   change(scenes);
   const after=scenes.filter(scene=>Number(scene.indent||0)===0).map(scene=>scene.title);
   for(const divider of items){
    const oldIndex=before.indexOf(divider.before);
    if(oldIndex<0||after.includes(divider.before))continue;
    divider.before=after[oldIndex]||null;
    adjusted=true;
   }
  });
  if(adjusted)await this.plugin.saveSettings();
  return result;
 };
 ProjectsView.prototype._writerArcInstalled=true;
 ProjectsView.prototype.drawScenes=function(panel,project){
  original.call(this,panel,project);
  if(project.format==='single')return;
  const view=this,roots=writerV13ArcRoots(view,project),dividers=writerV13ArcStore(view,project);
  const bars=panel.querySelectorAll('.writer-project-notes-toolbar');
  const toolbar=bars[bars.length-1];
  if(toolbar){
   const button=toolbar.createEl('button',{text:lfMsg('+ Separador','+ Divider'),
    cls:'writer-project-arc-create',attr:{type:'button',
     title:lfMsg('Inserir linha divisória sem criar nota','Insert visual divider without creating a note')}});
   button.addEventListener('click',()=>writerV13ArcPrompt(view,project));
   toolbar.insertBefore(button,toolbar.children[1]||null);
  }
  const rows=Array.from(panel.querySelectorAll('.writer-project-scene[data-depth="0"]'));
  const rowOf=title=>rows.find(row=>row.dataset.sceneTitle===title);
  const projectKey=project.file.path,draft=view.draft;
  const pickupValid=()=>view.writerArcPickup?.path===projectKey&&view.writerArcPickup?.draft===draft;
  // Capture the destination grip before the regular chapter pickup handler runs.
  for(const row of rows){
   const grip=row.querySelector('.writer-project-drag-handle');
   grip?.addEventListener('click',event=>{
    if(!pickupValid())return;
    event.preventDefault();event.stopImmediatePropagation();
    const id=view.writerArcPickup.id;view.writerArcPickup=null;
    void writerV13ArcMove(view,project,id,row.dataset.sceneTitle,false);
   },true);
   row.addEventListener('dragover',event=>{
    if(!event.dataTransfer?.types?.includes('application/x-basic-ai-arc'))return;
    event.preventDefault();row.addClass('writer-project-dragover');
   });
   row.addEventListener('drop',event=>{
    let data;try{data=JSON.parse(event.dataTransfer?.getData('application/x-basic-ai-arc')||'null');}catch(_){return;}
    if(data?.path!==projectKey||data?.draft!==draft)return;
    event.preventDefault();event.stopImmediatePropagation();
    row.removeClass('writer-project-dragover');
    const after=event.clientY>row.getBoundingClientRect().top+row.getBoundingClientRect().height/2;
    void writerV13ArcMove(view,project,data.id,row.dataset.sceneTitle,after);
   },true);
  }
  const layout=writerV13ArcLayout(roots,dividers);
  for(const divider of layout){
   if(divider.type!=='divider')continue;
   const row=panel.createDiv({cls:'writer-project-arc-divider'});
   row.dataset.arcId=divider.id;
   row.setAttribute('role','group');
   row.setAttribute('aria-label',divider.label?lfMsg('Separador: ','Divider: ')+divider.label:lfMsg('Separador de arco','Story arc divider'));
   const grip=row.createEl('button',{text:'⠿',cls:'writer-project-arc-grip',attr:{
    type:'button',title:lfMsg('Mover separador','Move divider'),
    'aria-label':lfMsg('Mover separador','Move divider')}});
   grip.draggable=true;
   grip.addEventListener('click',()=>{
    if(pickupValid()&&view.writerArcPickup.id===divider.id){
     view.writerArcPickup=null;void view.render();return;
    }
    if(pickupValid()){
     const id=view.writerArcPickup.id;view.writerArcPickup=null;
     void writerV13ArcMove(view,project,id,divider.id,false);return;
    }
    view.writerArcPickup={path:projectKey,draft,id:divider.id};
    row.addClass('writer-project-arc-picked');
    new Notice(lfMsg('Separador selecionado. Toque na alça de outro separador ou capítulo.','Divider selected. Tap the handle of a chapter or another divider.'),3000);
   });
   grip.addEventListener('dragstart',event=>{
    event.dataTransfer?.setData('application/x-basic-ai-arc',JSON.stringify({path:projectKey,draft,id:divider.id}));
    if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
   });
   const rule=row.createDiv({cls:'writer-project-arc-rule'+(divider.label?' is-labeled':'')});
   if(divider.label)rule.createSpan({cls:'writer-project-arc-label',text:divider.label});
   const more=row.createEl('button',{text:'⋯',cls:'writer-project-arc-more',attr:{type:'button',
    title:lfMsg('Opções do separador','Divider options'),'aria-label':lfMsg('Opções do separador','Divider options')}});
   more.addEventListener('click',event=>{
    const menu=new Menu();
    const actions=[
     [lfMsg('Editar texto','Edit text'),'pencil',()=>writerV13ArcPrompt(view,project,divider)],
     [lfMsg('Mover para cima','Move up'),'arrow-up',()=>writerV13ArcShift(view,project,divider.id,-1)],
     [lfMsg('Mover para baixo','Move down'),'arrow-down',()=>writerV13ArcShift(view,project,divider.id,1)],
     [lfMsg('Remover separador','Remove divider'),'trash-2',async()=>{
      const items=writerV13ArcStore(view,project),at=items.findIndex(item=>item.id===divider.id);
      if(at>=0){items.splice(at,1);view.writerArcPickup=null;await writerV13ArcSave(view);}
     }]
    ];
    for(const [label,icon,action] of actions)menu.addItem(item=>item.setTitle(label).setIcon(icon).onClick(action));
    menu.showAtMouseEvent(event);
   });
   row.addEventListener('dragover',event=>{
    if(!event.dataTransfer?.types?.includes('application/x-basic-ai-arc')&&!event.dataTransfer?.types?.includes('application/x-basic-ai-scene'))return;
    event.preventDefault();row.addClass('writer-project-dragover');
   });
   row.addEventListener('dragleave',event=>{
    if(!row.contains(event.relatedTarget))row.removeClass('writer-project-dragover');
   });
   row.addEventListener('drop',event=>{
    row.removeClass('writer-project-dragover');
    let arc,scene;
    try{arc=JSON.parse(event.dataTransfer?.getData('application/x-basic-ai-arc')||'null');}catch(_){arc=null;}
    if(arc?.path===projectKey&&arc?.draft===draft){
     event.preventDefault();event.stopImmediatePropagation();
     void writerV13ArcMove(view,project,arc.id,divider.id,false);return;
    }
    try{scene=JSON.parse(event.dataTransfer?.getData('application/x-basic-ai-scene')||'null');}catch(_){scene=null;}
    if(scene?.path===projectKey&&scene?.draft===draft){
     const target=divider.before||roots.at(-1);
     if(target){
      event.preventDefault();event.stopImmediatePropagation();
      void view.moveSceneRelative(project,scene.name,target,!divider.before);
     }
    }
   });
   if(pickupValid()&&view.writerArcPickup.id===divider.id)row.addClass('writer-project-arc-picked');
   panel.insertBefore(row,divider.before?rowOf(divider.before)||null:null);
  }
 };
}
writerV13ArcInstall();
