'use strict';
/* Original Longform integration inspired by progressive plotting and narrative threads.
 * The Longform index owns scene order. These project preferences never edit prose. */
const WRITER_STORY_STAGES=[
 ['premise','Premissa','Premise','lightbulb',280,'Quem quer o quê, o que impede e o que está em jogo?','Who wants what, what stands in the way, and what is at stake?'],
 ['outline','Resumo em parágrafo','One-paragraph outline','align-left',3000,'Ligue o início, as principais viradas e o final em um parágrafo.','Connect the opening, major turns and ending in one paragraph.'],
 ['synopsis','Sinopse','Synopsis','file-text',30000,'Expanda a cadeia de causa e efeito. O que cada virada muda?','Expand the chain of cause and effect. What does each turn change?'],
 ['treatment','Tratamento','Treatment','book-open',60000,'Desenvolva a sinopse em sequências. Use as cenas do Longform quando quiser detalhar a ordem.','Develop the synopsis into sequences. Use existing Longform scenes when you want to detail the order.']
];
const WRITER_STORY_ROLES=[['plant','Plantio','Setup'],['echo','Reforço','Reinforcement'],['payoff','Desfecho','Payoff']];
const WRITER_STORY_STATES=[['planned','Planejada','Planned'],['active','Em andamento','Active'],['resolved','Resolvida','Resolved'],['abandoned','Abandonada','Abandoned']];
const writerStoryName=(list,id)=>{const item=list.find(entry=>entry[0]===id);return item?writerUi(item[1],item[2]):id;};
function writerStoryPlanSettings(plugin,panel){
 const cfg=plugin.settings.v7??={};
 new Setting(panel).setName(writerUi('Exibir plano da história','Show story plan'))
  .setDesc(writerUi('Etapas, pistas e checagem em Estrutura. Desligar preserva o plano salvo.','Stages, threads and checks under Structure. Turning this off keeps the saved plan.'))
  .addToggle(toggle=>toggle.setValue(cfg.storyPlanning!==false).onChange(async value=>{
   cfg.storyPlanning=value;await plugin.saveSettings();plugin.refreshModuleVisibility?.();
  }));
}
function writerStoryRead(plugin,path){
 const state=plugin.settings.writerStoryPlans;
 return state&&Object.hasOwn(state,path)?state[path]:null;
}
function writerStoryPlan(plugin,path){
 const raw=writerStoryRead(plugin,path);
 return {stages:raw?.stages||{},threads:Array.isArray(raw?.threads)?raw.threads:[]};
}
function writerStoryError(pt,en){return new Error(writerUi(pt,en));}
function writerStorySetStage(plan,id,value,approved=false){
 const index=WRITER_STORY_STAGES.findIndex(stage=>stage[0]===id);
 if(index<0)throw writerStoryError('Etapa inválida.','Invalid stage.');
 const text=String(value||'').replace(/\r\n/g,'\n').trim();
 if(text.length>WRITER_STORY_STAGES[index][4])throw writerStoryError('O texto passou do limite da etapa.','Text exceeds this stage’s limit.');
 const stages={...plan.stages},prev=stages[id];
 if(text)stages[id]={text,status:approved?'ready':prev?.text===text?prev.status:'draft'};
 else delete stages[id];
 if((prev?.text||'')!==text){
  for(const [key] of WRITER_STORY_STAGES.slice(index+1)){
   if(stages[key]?.text)stages[key]={...stages[key],status:'review'};
  }
 }
 return {...plan,stages};
}
function writerStoryScenes(view,project){
 const scenes=project.format==='single'?[{file:project.file,title:project.title,position:1}]:writerV7RCSceneView(view,project);
 return scenes.map(scene=>({...scene,path:scene.file?.path||''}));
}
function writerStoryFindIssues(plan,scenes){
 const byPath=new Map(),seen=new Set(),out=[];
 const add=(kind,details)=>out.push({kind,...details});
 for(const scene of scenes){
  if(seen.has(scene.title))add('duplicate',{scene});
  seen.add(scene.title);
  if(!scene.path)add('missing-scene',{scene});
  else if(!byPath.has(scene.path))byPath.set(scene.path,scene);
 }
 for(const [id] of WRITER_STORY_STAGES)if(plan.stages[id]?.status==='review')add('review-stage',{stage:id});
 for(const thread of plan.threads){
  if(thread.status==='abandoned')continue;
  const locations=thread.points.map(point=>({...point,scene:byPath.get(point.path)}));
  for(const point of locations)if(!point.scene)add('outside-draft',{thread,point});
  const setups=locations.filter(point=>point.role==='plant'),payoffs=locations.filter(point=>point.role==='payoff');
  if(thread.status!=='planned'){
   if(!setups.length)add('no-plant',{thread});
   if(!payoffs.length)add('no-payoff',{thread});
  }
  const start=setups[0]?.scene?.position,end=payoffs[0]?.scene?.position;
  if(start!==undefined&&end!==undefined&&start>end)add('order',{thread});
  for(const {role,scene} of locations)if(role==='echo'&&scene&&
   ((start!==undefined&&scene.position<start)||(end!==undefined&&scene.position>end)))add('echo-order',{thread,scene});
 }
 return out;
}
function writerStoryPointSummary(point,scenes){
 return scenes.find(scene=>scene.path===point.path)?.title||point.path;
}
function writerStoryCleanThread(input,id,allowed,previous){
 const title=String(input.title||'').trim(),note=String(input.note||'').trim();
 if(!title||title.length>120||note.length>3000||!WRITER_STORY_STATES.some(state=>state[0]===input.status))
  throw writerStoryError('Preencha o título e confira os limites dos campos.','Enter a title and check the field limits.');
 const oldPaths=new Set(previous?.points.map(point=>point.path)||[]),seen=new Set(),points=[];
 for(const point of input.points){
  if(!point.path)continue;
  if(!WRITER_STORY_ROLES.some(role=>role[0]===point.role)||(!allowed.has(point.path)&&!oldPaths.has(point.path)))
   throw writerStoryError('Escolha uma cena desse rascunho.','Choose a scene from this draft.');
  const key=point.role+'\0'+point.path;
  if(!seen.has(key)){seen.add(key);points.push({role:point.role,path:point.path});}
 }
 if(points.length>14||points.filter(p=>p.role==='plant').length>1||points.filter(p=>p.role==='payoff').length>1)
  throw writerStoryError('Use um plantio, até 12 reforços e um desfecho.','Use one setup, up to 12 reinforcements and one payoff.');
 return {id,title,note,status:input.status,points};
}
function writerStoryWrite(plugin,file,update){
 const path=file.path;
 const run=async()=>{
  if(file.path!==path)throw writerStoryError('O projeto mudou de caminho. Tente salvar novamente.','The project path changed. Try saving again.');
  if(plugin.app.vault.getAbstractFileByPath(path)!==file)throw writerStoryError('O projeto não está mais disponível.','The project is no longer available.');
  const previous=writerStoryRead(plugin,path);
  const next=update(writerStoryPlan(plugin,path));
  let store=plugin.settings.writerStoryPlans;
  if(!store||typeof store!=='object'||Array.isArray(store))store=plugin.settings.writerStoryPlans=Object.create(null);
  Object.defineProperty(store,path,{value:next,enumerable:true,writable:true,configurable:true});
  try{await plugin.saveSettings();}
  catch(error){
   // Roll back only our value. A later rename or a different write may have moved it.
   if(store[path]===next){if(previous)store[path]=previous;else delete store[path];}
   throw error;
  }
  return next;
 };
 const result=(plugin._writerStoryWrite||Promise.resolve()).catch(()=>{}).then(run);
 plugin._writerStoryWrite=result;
 return result;
}
function writerStoryRebase(plugin,oldPath,newPath){
 const store=plugin.settings.writerStoryPlans;
 if(!store||!oldPath||!newPath||oldPath===newPath)return false;
 let moved=false;
 for(const [path,plan] of Object.entries(store)){
  if(!plan)continue;
  const target=writerProjectRenamedPath(path,oldPath,newPath);
  let changed=false;
  const threads=(Array.isArray(plan.threads)?plan.threads:[]).map(thread=>{
   let relocated=false;
   const points=thread.points.map(point=>{
    const path=writerProjectRenamedPath(point.path,oldPath,newPath);
    if(path===point.path)return point;
    relocated=changed=true;
    return {...point,path};
   });
   return relocated?{...thread,points}:thread;
  });
  const destination=target!==path&&!Object.hasOwn(store,target)?target:path;
  if(destination!==path||changed){
   Object.defineProperty(store,destination,{value:changed?{...plan,threads}:plan,writable:true,configurable:true,enumerable:true});
   if(destination!==path)delete store[path];
   moved=true;
  }
 }
 return moved;
}
function writerStorySaveRename(plugin,file,oldPath){
 if(!plugin.settings.writerStoryPlans)return;
 const path=file?.path;
 if(!path||path===oldPath)return;
 const run=async()=>{if(writerStoryRebase(plugin,oldPath,path))await plugin.saveSettings();};
 const result=(plugin._writerStoryWrite||Promise.resolve()).catch(()=>{}).then(run);
 plugin._writerStoryWrite=result;
 void result.catch(error=>console.error('[Basic] Story planning rename could not be saved',error));
}
function writerStoryAsMarkdown(plan,scenes,activeDraft){
 const heading=text=>String(text).replace(/[\n\r]+/g,' ').replace(/[\\`*_\[\]#<>|]/g,'\\$&');
 const lines=['# '+writerUi('Plano da história','Story plan')];
 for(const [id,pt,en] of WRITER_STORY_STAGES){
  const stage=plan.stages[id];
  if(stage?.text){lines.push('','## '+writerUi(pt,en),'',stage.text);}
 }
 lines.push('','## '+writerUi('Pistas narrativas','Story threads'));
 for(const thread of plan.threads){
  lines.push('','### '+heading(thread.title),'',writerStoryName(WRITER_STORY_STATES,thread.status));
  if(thread.note)lines.push('',thread.note);
  if(thread.points.length)lines.push('');
  for(const point of thread.points)lines.push('- '+writerStoryName(WRITER_STORY_ROLES,point.role)+': '+heading(writerStoryPointSummary(point,scenes))+' ('+heading(point.path)+')');
 }
 lines.push('','## '+writerUi('Cenas do rascunho','Draft scenes')+' — '+heading(activeDraft));
 for(const scene of scenes)lines.push(' '.repeat(Math.max(0,Math.min(8,Number(scene.indent)||0))*2)+'- '+heading(scene.title));
 return lines.join('\n')+'\n';
}
async function writerStoryExport(view,project){
 if(view.app.vault.getAbstractFileByPath(project.file.path)!==project.file)
  throw writerStoryError('O projeto não está mais disponível.','The project is no longer available.');
 const plan=writerStoryPlan(view.plugin,project.file.path),scenes=writerStoryScenes(view,project);
 const vault=view.app.vault,folder=project.file.parent?.path;
 const prefix=(folder&&folder!=='/'?folder+'/':'')+clean(project.file.basename)+' - '+writerUi('Plano da história','Story plan');
 const content=writerStoryAsMarkdown(plan,scenes,view.draft==='Principal'?writerUi('Principal','Main'):view.draft);
 for(let n=1;n<=100;n++){
  const path=prefix+(n>1?' '+n:'')+'.md';
  if(vault.getAbstractFileByPath(path))continue;
  try{return await vault.create(path,content);}
  catch(error){if(!vault.getAbstractFileByPath(path))throw error;}
 }
 throw writerStoryError('Não foi possível encontrar um nome livre para a exportação.','Could not find a free export filename.');
}
function writerStoryButton(parent,icon,pt,en,action){
 const label=writerUi(pt,en),button=parent.createEl('button',{attr:{type:'button',title:label,'aria-label':label}});
 const glyph=button.createSpan({cls:'writer-v901-nav-icon',attr:{'aria-hidden':'true'}});
 require('obsidian').setIcon?.(glyph,icon);
 button.createSpan({cls:'writer-story-label',text:label});
 button.addEventListener('click',action);
 return button;
}
function writerStoryPlanUI(view,parent,project){
 const plugin=view.plugin,file=project.file,root=parent.createDiv({cls:'writer-story-plan'});
 let stageId=view.writerStoryStage||'premise',filter='',tab='steps',targetThread=null;
 const drafts=(view.writerStoryDrafts??=new WeakMap());
 if(!drafts.has(file))drafts.set(file,new Map());
 const staged=drafts.get(file);
 const sections=root.createDiv({cls:'writer-story-actions',attr:{role:'group','aria-label':writerUi('Planejamento da história','Story planning')}});
 const labels=[['steps','list-tree','Etapas','Stages'],['threads','route','Pistas','Threads'],['check','list-check','Checagem','Check']];
 const buttons=labels.map(([id,icon,pt,en])=>writerStoryButton(sections,icon,pt,en,()=>{tab=id;draw();}));
 writerStoryButton(sections,'file-output','Exportar plano','Export plan',async()=>{
  if(staged.size)return new Notice(writerUi('Salve as etapas alteradas antes de exportar.','Save changed stages before exporting.'));
  try{const file=await writerStoryExport(view,project);view.openFile(file);}
  catch(error){new Notice(error.message);}
 });
 const body=root.createDiv({cls:'writer-story-body'});
 const saveStage=async(id,value,ready,baseline)=>{
  const pending=staged.get(id);
  const saved=await writerStoryWrite(plugin,file,plan=>{
   if((plan.stages[id]?.text||'')!==baseline)
    throw writerStoryError('Esta etapa mudou. Copie seu texto, reabra a etapa e confira a versão salva.','This stage changed. Copy your text, reopen the stage and check the saved version.');
   return writerStorySetStage(plan,id,value,ready);
  });
  if(staged.get(id)===pending)staged.delete(id);
  else if(staged.has(id))staged.get(id).baseline=saved.stages[id]?.text||'';
  if(body.isConnected&&tab==='steps'&&stageId===id)draw();
 };
 function drawStages(plan){
  const progress=WRITER_STORY_STAGES.filter(([id])=>plan.stages[id]?.status==='ready').length;
  body.createEl('p',{cls:'writer-v7-muted',text:writerUi('Etapas prontas: ','Ready stages: ')+progress+'/'+WRITER_STORY_STAGES.length});
  const strip=body.createDiv({cls:'writer-story-actions',attr:{role:'group','aria-label':writerUi('Etapas do plano','Planning stages')}});
  for(const [id,pt,en,icon] of WRITER_STORY_STAGES){
   const button=writerStoryButton(strip,icon,pt,en,()=>{stageId=view.writerStoryStage=id;draw();});
   button.setAttribute('aria-pressed',String(id===stageId));
   button.classList.toggle('is-active',id===stageId);
  }
  const stage=WRITER_STORY_STAGES.find(item=>item[0]===stageId)||WRITER_STORY_STAGES[0];
  const [id,pt,en,,limit,hintPt,hintEn]=stage,label=writerUi(pt,en),prior=plan.stages[id];
  const earlier=WRITER_STORY_STAGES.slice(0,WRITER_STORY_STAGES.indexOf(stage)).reverse().find(([key])=>plan.stages[key]?.text);
  if(earlier){
   const ref=body.createEl('details',{cls:'writer-story-reference',attr:{open:''}});
   ref.createEl('summary',{text:writerUi('Referência: ','Reference: ')+writerUi(earlier[1],earlier[2])});
   ref.createEl('p',{text:plan.stages[earlier[0]].text});
  }
  body.createEl('h4',{text:label});
  body.createEl('p',{cls:'writer-v7-muted',text:writerUi(hintPt,hintEn)});
  if(prior?.status==='review')body.createEl('p',{cls:'writer-story-warning',text:writerUi('Uma etapa anterior mudou. Confira esta versão antes de marcar como pronta.','An earlier stage changed. Check this version before marking it ready.')});
  const input=body.createEl(id==='premise'?'input':'textarea',{attr:{'aria-label':label,maxlength:String(limit)}});
  const buffer=staged.get(id);
  input.value=buffer?.text??prior?.text??'';
  const baseline=buffer?.baseline??prior?.text??'';
  const meter=body.createEl('small',{cls:'writer-v7-muted'});
  const count=()=>meter.setText(input.value.trim().split(/\s+/u).filter(Boolean).length+' '+writerUi('palavras','words')+' · '+input.value.length+'/'+limit);
  count();
  input.addEventListener('input',()=>{
   if(input.value===baseline)staged.delete(id);
   else staged.set(id,{text:input.value,baseline});
   count();
  });
  const row=body.createDiv({cls:'writer-story-actions'});
  let busy=false;
  const save=async ready=>{
   if(busy)return;
   busy=true;
   const value=input.value;
   input.disabled=true;
   try{await saveStage(id,value,ready,baseline);}
   catch(error){new Notice(error.message);}
   finally{busy=false;input.disabled=false;}
  };
  writerStoryButton(row,'save','Salvar etapa','Save stage',()=>save(false));
  writerStoryButton(row,'check','Marcar pronta','Mark ready',()=>{
   if(!input.value.trim())return new Notice(writerUi('Escreva algo antes de concluir a etapa.','Write something before completing the stage.'));
   return save(true);
  });
  if(buffer&&baseline!==(prior?.text||''))writerStoryButton(row,'rotate-ccw','Carregar versão salva','Load saved version',()=>{
   new ConfirmProjectAction(view.app,writerUi('Descartar edição não salva?','Discard unsaved edit?'),
    writerUi('A etapa voltará à última versão salva.','This stage will return to its last saved version.'),async()=>{staged.delete(id);draw();}).open();
  });
  if(prior?.status==='ready')row.createSpan({cls:'writer-v7-muted',text:writerUi('Pronta','Ready')});
 }
 function drawThreads(plan,scenes){
  body.createEl('p',{cls:'writer-v7-muted',text:writerUi('As pistas são do projeto. A posição é calculada pela ordem do rascunho ativo.','Threads are shared by the project. Positions use the active draft’s order.')});
  const bar=body.createDiv({cls:'writer-story-actions'});
  writerStoryButton(bar,'plus','Nova pista','New thread',()=>writerStoryThreadModal(view,project,null,draw));
  const status=bar.createEl('select',{attr:{'aria-label':writerUi('Filtrar pistas por status','Filter threads by status')}});
  status.createEl('option',{text:writerUi('Todos os status','All statuses')}).value='';
  for(const [id,pt,en] of WRITER_STORY_STATES)status.createEl('option',{text:writerUi(pt,en)}).value=id;
  status.value=filter;status.addEventListener('change',()=>{filter=status.value;draw();});
  const list=body.createDiv({cls:'writer-story-list'});
  const threads=plan.threads.filter(thread=>!filter||thread.status===filter);
  if(!threads.length)list.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma pista neste filtro.','No threads match this filter.')});
  const order=new Map(scenes.filter(scene=>scene.path).map(scene=>[scene.path,scene.position]));
  for(const thread of threads){
   const card=list.createDiv({cls:'writer-story-card'});
   if(thread.id===targetThread)card.addClass('is-target');
   const heading=card.createDiv({cls:'writer-story-actions'});
   heading.createEl('strong',{text:thread.title});
   heading.createSpan({cls:'writer-v7-muted',text:writerStoryName(WRITER_STORY_STATES,thread.status)});
   writerStoryButton(heading,'pencil','Editar pista','Edit thread',()=>writerStoryThreadModal(view,project,thread,draw));
   if(thread.note)card.createEl('p',{text:thread.note});
   const points=card.createEl('ul');
   for(const point of [...thread.points].sort((a,b)=>(order.get(a.path)??Infinity)-(order.get(b.path)??Infinity))){
    const place=scenes.find(scene=>scene.path===point.path);
    const item=points.createEl('li',{text:writerStoryName(WRITER_STORY_ROLES,point.role)+' · '});
    if(place) item.createEl('button',{text:place.title,attr:{type:'button'}}).addEventListener('click',()=>view.openFile(place.file));
    else item.createSpan({cls:'writer-story-warning',text:point.path+' · '+writerUi('fora deste rascunho','outside this draft')});
   }
   if(thread.id===targetThread)card.scrollIntoView?.({block:'nearest'});
  }
 }
 function drawCheck(plan,scenes){
  const issues=writerStoryFindIssues(plan,scenes);
  const names={
   duplicate:['Cena repetida no índice','Duplicate scene in the index'],
   'missing-scene':['Arquivo da cena não encontrado','Scene file not found'],
   'review-stage':['Etapa precisa de revisão','Stage needs review'],
   'outside-draft':['Pista aponta para fora do rascunho','Thread points outside the draft'],
   'no-plant':['Pista sem plantio','Thread has no setup'],
   'no-payoff':['Pista sem desfecho','Thread has no payoff'],
   order:['O desfecho vem antes do plantio','Payoff comes before setup'],
   'echo-order':['Reforço fora da sequência','Reinforcement is out of sequence']
  };
  body.createEl('p',{cls:'writer-v7-muted',text:writerUi('Checagem de estrutura do rascunho ativo. Nenhuma correção é aplicada automaticamente.','Checks structure in the active draft. No automatic fixes are applied.')});
  if(!issues.length)body.createEl('p',{text:writerUi('Nenhuma pendência de estrutura encontrada.','No structure issues found.')});
  const list=body.createEl('ul',{cls:'writer-story-list'});
  for(const issue of issues){
   const item=list.createEl('li',{cls:'writer-story-card'});
   item.createEl('strong',{text:writerUi(...names[issue.kind])});
   const tag=issue.stage?writerStoryName(WRITER_STORY_STAGES,issue.stage):[issue.thread?.title,issue.scene?.title||issue.point?.path].filter(Boolean).join(' · ');
   if(tag)item.createEl('p',{text:tag});
   if(issue.stage||issue.thread)writerStoryButton(item,'arrow-right','Abrir','Open',()=>{
    if(issue.stage){tab='steps';stageId=view.writerStoryStage=issue.stage;}
    else{tab='threads';filter='';targetThread=issue.thread.id;}
    draw();
   });
  }
 }
 function draw(){
  if(root.isConnected===false)return;
  buttons.forEach((button,i)=>{const selected=labels[i][0]===tab;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected));});
  body.empty();
  const plan=writerStoryPlan(plugin,file.path);
  if(tab==='steps')drawStages(plan);
  else if(tab==='threads')drawThreads(plan,writerStoryScenes(view,project));
  else drawCheck(plan,writerStoryScenes(view,project));
 }
 draw();
}
function writerStoryThreadModal(view,project,existing,refresh){
 const modal=new Modal(view.app),file=project.file,plugin=view.plugin,draft=view.draft;
 const scenes=writerStoryScenes(view,project).filter(scene=>scene.path);
 const pointOptions=[...new Map(scenes.map(scene=>[scene.path,scene.title])).entries()];
 const allowed=new Set(pointOptions.map(([path])=>path));
 const id=existing?.id||'thread-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 modal.onOpen=()=>{
  modal.setTitle(existing?writerUi('Editar pista narrativa','Edit story thread'):writerUi('Nova pista narrativa','New story thread'));
  const root=modal.contentEl;
  root.addClass('writer-story-modal');
  const field=(tag,pt,en,value,maxlength)=>{
   const label=writerUi(pt,en),box=root.createEl('label',{text:label});
   const input=box.createEl(tag,{attr:{maxlength:String(maxlength)}});
   input.value=value;return input;
  };
  const title=field('input','Título','Title',existing?.title||'',120);
  const note=field('textarea','O que esta pista promete?','What does this thread promise?',existing?.note||'',3000);
  const status=root.createEl('label',{text:writerUi('Status','Status')}).createEl('select');
  for(const [key,pt,en] of WRITER_STORY_STATES)status.createEl('option',{text:writerUi(pt,en)}).value=key;
  status.value=existing?.status||'planned';
  const points=root.createDiv({cls:'writer-story-points'});
  const echoes=points.createDiv({cls:'writer-story-points'});
  const track=[];
  const addPoint=(target,role,path='',removable=false)=>{
   const label=writerStoryName(WRITER_STORY_ROLES,role);
   const wrap=target.createDiv({cls:'writer-story-actions'});
   const select=wrap.createEl('select',{attr:{'aria-label':label}});
   select.createEl('option',{text:label+' · '+writerUi('Sem cena','No scene')}).value='';
   for(const [candidate,name] of pointOptions)select.createEl('option',{text:label+' · '+name}).value=candidate;
   if(path&&!allowed.has(path))select.createEl('option',{text:label+' · '+path+' ('+writerUi('fora do rascunho','outside the draft')+')'}).value=path;
   select.value=path;
   const point={role,select};track.push(point);
   if(removable)writerStoryButton(wrap,'minus','Remover reforço','Remove reinforcement',()=>{track.splice(track.indexOf(point),1);wrap.remove();});
   return wrap;
  };
  const setup=addPoint(points,'plant',existing?.points.find(point=>point.role==='plant')?.path);
  points.insertBefore(setup,echoes);
  for(const point of existing?.points.filter(point=>point.role==='echo')||[])addPoint(echoes,'echo',point.path,true);
  writerStoryButton(points,'plus','Adicionar reforço','Add reinforcement',()=>{
   if(track.filter(point=>point.role==='echo').length<12)addPoint(echoes,'echo','',true);
  });
  addPoint(points,'payoff',existing?.points.find(point=>point.role==='payoff')?.path);
  const actions=root.createDiv({cls:'writer-story-actions'});
  let busy=false;
  const commit=async remove=>{
   if(busy)return;
   busy=true;
   try{
    await writerStoryWrite(plugin,file,plan=>{
     const currentProject=view.currentProject;
     if(view.draft!==draft||currentProject?.file!==file)throw writerStoryError('O projeto ou rascunho mudou. Reabra o formulário.','The project or draft changed. Reopen the form.');
     const found=plan.threads.find(thread=>thread.id===id);
     if(existing&&found!==existing)throw writerStoryError('A pista mudou. Reabra o formulário.','The thread changed. Reopen the form.');
     if(remove)return {...plan,threads:plan.threads.filter(thread=>thread.id!==id)};
     const currentPaths=new Set(writerStoryScenes(view,currentProject).filter(scene=>scene.path).map(scene=>scene.path));
     const next=writerStoryCleanThread({title:title.value,note:note.value,status:status.value,
      points:track.map(({role,select})=>({role,path:select.value}))},id,currentPaths,found);
     return {...plan,threads:existing?plan.threads.map(thread=>thread.id===id?next:thread):[...plan.threads,next]};
    });
    modal.close();refresh();
   }catch(error){new Notice(error.message);}
   finally{busy=false;}
  };
  writerStoryButton(actions,'save','Salvar pista','Save thread',()=>commit(false));
  if(existing)writerStoryButton(actions,'trash-2','Excluir pista','Delete thread',()=>{
   new ConfirmProjectAction(view.app,writerUi('Excluir pista?','Delete thread?'),
    writerUi('Somente o registro da pista será removido. Nenhuma cena será alterada.','Only the thread record will be removed. No scene will be edited.'),()=>commit(true)).open();
  });
 };
 modal.onClose=()=>modal.contentEl.empty();
 modal.open();
}
