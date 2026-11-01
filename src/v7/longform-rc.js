'use strict';
/* v7 RC1 — Longform StoryLine-inspired planning surfaces.
 * All data is obtained from the existing Longform scene list and YAML properties.
 * No code or styles from the referenced StoryLine plugin are copied.
 */
const WRITER_V7_RC_BEATS={
 three:[
  ['opening','Abertura','Opening'],
  ['inciting','Incidente inicial','Inciting incident'],
  ['first-turn','Primeira virada','First turning point'],
  ['midpoint','Ponto médio','Midpoint'],
  ['crisis','Crise','Crisis'],
  ['climax','Clímax','Climax'],
  ['resolution','Resolução','Resolution']
 ],
 five:[
  ['exposition','Exposição','Exposition'],['rising','Ação crescente','Rising action'],
  ['crisis','Crise','Crisis'],['falling','Ação decrescente','Falling action'],
  ['resolution','Desfecho','Resolution']
 ],
 journey:[
  ['ordinary','Mundo comum','Ordinary world'],['call','Chamado','Call to adventure'],
  ['refusal','Recusa','Refusal'],['mentor','Mentor','Meeting the mentor'],
  ['threshold','Travessia','Crossing the threshold'],['trials','Provações','Tests and allies'],
  ['ordeal','Provação central','Ordeal'],['reward','Recompensa','Reward'],
  ['return','Retorno','Return'],['change','Transformação','Transformation']
 ]
};
const WRITER_V7_RC_STATUS=[
 ['idea','Ideia','Idea'],['outline','Planejada','Outlined'],
 ['draft','Rascunho','Draft'],['wip','Em escrita','In progress'],
 ['written','Escrita','Written'],['revised','Revisada','Revised'],
 ['final','Final','Final']
];
function writerV7RCStrings(value){
 if(Array.isArray(value))return value.map(v=>String(v||'').trim()).filter(Boolean).slice(0,40);
 if(typeof value==='string')return value.split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean).slice(0,40);
 return [];
}
function writerV7RCSceneView(view,project){
 const scenes=writerV7StudioScenes(view,project);
 return scenes.map(scene=>{
  const fm=scene.file?view.app.metadataCache?.getFileCache?.(scene.file)?.frontmatter||{}:{};
  const plotlines=writerV7RCStrings(fm.plotlines||fm.plotline||fm.storyArc||fm.arc);
  const beats=writerV7RCStrings(fm.storyBeat||fm.beat||fm.beatsheet);
  const intensity=fm.intensity===undefined||fm.intensity===null||fm.intensity===''?NaN:Number(fm.intensity);
  const act=String(fm.act||fm.storyAct||'').trim().slice(0,80);
  const sequence=String(fm.sequence||fm.storySequence||'').trim().slice(0,80);
  const emotion=String(fm.emotion||'').trim().slice(0,80);
  const target=Number(fm.target_wordcount||fm.targetWordCount||fm.wordGoal);
  return {...scene,act,sequence,plotlines,beats,emotion,
   intensity:Number.isFinite(intensity)&&intensity>=0&&intensity<=10?intensity:null,
   target:Number.isFinite(target)&&target>0?Math.min(100000,target):null,
   characters:writerV7RCStrings(fm.characters),conflict:String(fm.conflict||'').slice(0,240),
   setup:writerV7RCStrings(fm.setup_scenes||fm.setupScenes),
   payoff:writerV7RCStrings(fm.payoff_scenes||fm.payoffScenes),
   isArcPoint:fm.arcPoint===true||fm.arc_point===true
  };
 });
}
function writerV7RCLabelStatus(key){
 const found=WRITER_V7_RC_STATUS.find(x=>x[0]===key);
 return found?writerUi(found[1],found[2]):key;
}
function writerV7RCDimensions(scenes){
 return {
  statuses:[...new Set(scenes.map(s=>s.status).filter(Boolean))].sort(),
  povs:[...new Set(scenes.map(s=>s.pov).filter(Boolean))].sort(),
  acts:[...new Set(scenes.map(s=>s.act).filter(Boolean))].sort(),
  plotlines:[...new Set(scenes.flatMap(s=>s.plotlines).filter(Boolean))].sort()
 };
}
function writerV7RCAssignSceneProperty(view,file,key,value){
 if(!(file instanceof TFile)||!['storyBeat','plotlines','act','intensity','emotion'].includes(key))
  return Promise.reject(Error(writerUi('Campo ou arquivo inválido.','Invalid field or file.')));
 const update=()=>{
  if(!view.app.fileManager?.processFrontMatter)throw Error(writerUi('A API de propriedades não está disponível.','Frontmatter API is unavailable.'));
  return view.app.fileManager.processFrontMatter(file,fm=>{
   if(key==='intensity'){
    const num=Number(value);
    if(!Number.isFinite(num)||num<0||num>10)throw Error(writerUi('Intensidade deve estar entre 0 e 10.','Intensity must be 0 to 10.'));
    fm.intensity=num;
   }else if(key==='storyBeat'||key==='plotlines'){
    const values=writerV7RCStrings(value);
    const current=writerV7RCStrings(fm[key]||(key==='plotlines'?fm.plotline:fm.beat));
    if(values.length)fm[key]=[...new Set([...current,...values])].slice(0,40);
    else if(!current.length)delete fm[key];
   }else if(String(value||'').trim())fm[key]=String(value).trim().slice(0,100);
   else delete fm[key];
  });
 };
 return Promise.resolve().then(update);
}
function writerV7RCSceneCard(view,parent,scene,compact=false){
 const card=parent.createDiv({cls:compact?'writer-v7-rc-card writer-v7-rc-card-mini':'writer-v7-rc-card'});
 const head=card.createDiv({cls:'writer-v7-rc-card-head'});
 head.createEl('button',{cls:'writer-v7-rc-card-title',text:scene.title})
  .addEventListener('click',()=>scene.file?view.openFile(scene.file):new Notice(writerUi('Cena não encontrada.','Scene not found.')));
 const badge=head.createSpan({cls:'writer-v7-rc-status',text:writerV7RCLabelStatus(scene.status)});
 badge.dataset.status=scene.status;
 const chips=card.createDiv({cls:'writer-v7-rc-card-tags'});
 for(const label of [
  scene.act&&writerUi('Ato ','Act ')+scene.act,scene.pov&&'POV '+scene.pov,
  ...scene.plotlines.slice(0,3),scene.emotion,scene.intensity!==null?writerUi('Intensidade ','Intensity ')+scene.intensity+'/10':null
 ].filter(Boolean))chips.createSpan({cls:'writer-v7-rc-chip',text:String(label).slice(0,80)});
 if(!compact&&scene.summary)card.createEl('p',{cls:'writer-v7-rc-card-summary',text:scene.summary.slice(0,300)});
 if(!compact&&(scene.conflict||scene.beats.length)){
  const meta=card.createEl('p',{cls:'writer-v7-rc-card-meta',
   text:[scene.beats.length&&writerUi('Marcos: ','Beats: ')+scene.beats.join(', '),scene.conflict].filter(Boolean).join(' · ')});
 }
 if(scene.file){
  card.createEl('button',{cls:'writer-v7-rc-card-edit',text:writerUi('Editar ficha','Edit sheet')}).addEventListener('click',()=>{
   const cache=view.app.metadataCache?.getFileCache?.(scene.file);
   writerV7StudioOpenSheet(view,{file:scene.file,path:scene.file.path,title:scene.title,cache,tags:[]},
    {fields:['summary','status','act','sequence','pov','characters','location','sceneDate','plotlines','storyBeat','emotion','intensity','conflict','setup_scenes','payoff_scenes','target_wordcount']});
  });
 }
 return card;
}
function writerV7RCRenderBoard(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-rc-board'});
 root.createEl('h3',{text:writerUi('Quadro da história','Story board')});
 root.createEl('p',{cls:'writer-v7-muted',
 text:writerUi('Cenas da ordem Longform, com filtros, cartões e Kanban. Reordenar e recuar continuam na aba Cenas.','Scenes in Longform order, with filters, cards and Kanban. Reordering and nesting remain in Scenes.')});
 const scenes=writerV7RCSceneView(view,project),dim=writerV7RCDimensions(scenes);
 const pref=view.prefs(project),saved=String(pref.v7RCBoardMode||'cards'),bar=root.createDiv({cls:'writer-v7-rc-board-toolbar'});
 const mode=bar.createEl('select',{attr:{'aria-label':writerUi('Modo do quadro','Board mode')}});
 for(const [key,pt,en] of [['cards','Cartões','Cards'],['kanban','Kanban','Kanban'],['list','Lista','List']]){
  const o=mode.createEl('option',{text:writerUi(pt,en)});o.value=key;
 }
 mode.value=['cards','kanban','list'].includes(saved)?saved:'cards';
 const q=bar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar cenas…','Search scenes…'),'aria-label':writerUi('Pesquisar cenas','Search scenes')}});
 function picker(pt,en,values){
  const sel=bar.createEl('select',{attr:{'aria-label':writerUi(pt,en)}});
  const all=sel.createEl('option',{text:writerUi('Todos','All')});all.value='';
  for(const val of values){const opt=sel.createEl('option',{text:val});opt.value=val;}
  return sel;
 }
 const status=picker('Estado','Status',dim.statuses),pov=picker('Ponto de vista','Point of view',dim.povs);
 const arc=picker('Trama','Plotline',dim.plotlines),act=picker('Ato','Act',dim.acts);
 const count=root.createEl('p',{cls:'writer-v7-muted'});
 const content=root.createDiv({cls:'writer-v7-rc-board-content'});
 const draw=()=>{
  content.empty();
  const search=q.value.trim().toLocaleLowerCase();
  const shown=scenes.filter(s=>(!status.value||status.value===s.status)&&(!pov.value||pov.value===s.pov)
   &&(!arc.value||s.plotlines.includes(arc.value))&&(!act.value||act.value===s.act)
   &&(!search||(s.title+' '+s.summary+' '+s.plotlines.join(' ')+' '+s.pov+' '+s.emotion).toLocaleLowerCase().includes(search)));
  count.setText(shown.length+'/'+scenes.length+' '+writerUi('cenas','scenes'));
  if(!shown.length){content.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma cena corresponde aos filtros.','No scenes match these filters.')});return;}
  if(mode.value==='kanban'){
   const columns=dim.statuses.filter(s=>shown.some(x=>x.status===s));
   const grid=content.createDiv({cls:'writer-v7-rc-kanban'});
   for(const state of columns){
    const column=grid.createDiv({cls:'writer-v7-rc-kanban-column'});
    column.createEl('h4',{text:writerV7RCLabelStatus(state)+' ('+shown.filter(s=>s.status===state).length+')'});
    for(const scene of shown.filter(x=>x.status===state))writerV7RCSceneCard(view,column,scene,true);
   }
  }else{
   const list=content.createDiv({cls:mode.value==='cards'?'writer-v7-rc-corkboard':'writer-v7-rc-list'});
   for(const scene of shown)writerV7RCSceneCard(view,list,scene,mode.value==='list');
  }
 };
 for(const select of [status,pov,arc,act,mode])select.addEventListener('change',()=>{
  if(select===mode){pref.v7RCBoardMode=mode.value;void view.plugin.saveSettings();}
  draw();
 });
 q.addEventListener('input',draw);draw();
}
function writerV7RCPlotGroups(scenes){
 const groups=new Map();
 for(const scene of scenes){
  const names=scene.plotlines.length?scene.plotlines:[writerUi('Sem trama','No plotline')];
  for(const label of names){
   if(!groups.has(label))groups.set(label,[]);
   groups.get(label).push(scene);
  }
 }
 return groups;
}
function writerV7RCRenderPlotlines(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-rc-plotlines'});
 root.createEl('h3',{text:writerUi('Tramas e arcos narrativos','Plotlines and story arcs')});
 root.createEl('p',{cls:'writer-v7-muted',
  text:writerUi('Organize arcos usando a propriedade plotlines das próprias cenas. Não é criada uma segunda lista de cenas.','Organize arcs using each scene’s plotlines property. No duplicate scene index is created.')});
 const scenes=writerV7RCSceneView(view,project),groups=writerV7RCPlotGroups(scenes);
 const tools=root.createDiv({cls:'writer-v7-toolbar'});
 const query=tools.createEl('input',{attr:{type:'search',placeholder:writerUi('Filtrar trama ou cena…','Filter plotline or scene…'),'aria-label':writerUi('Pesquisar tramas','Search plotlines')}});
 tools.createEl('button',{text:writerUi('Adicionar cena a uma trama','Assign plotline to scene')}).addEventListener('click',()=>{
  writerV7RCAssignmentModal(view,project,'plotlines');
 });
 const viewMode=tools.createEl('select',{attr:{'aria-label':writerUi('Visualização das tramas','Plotline view')}});
 for(const [mode,pt,en] of [['list','Lista','List'],['grid','Matriz por atos','Act matrix']]){
  const op=viewMode.createEl('option',{text:writerUi(pt,en)});op.value=mode;
 }
 const list=root.createDiv({cls:'writer-v7-rc-plotlist'});
 const draw=()=>{
  list.empty();
  const term=query.value.trim().toLocaleLowerCase();
  if(viewMode.value==='grid'){
   const acts=[...new Set(scenes.map(s=>s.act||writerUi('(sem ato)','(no act)')))].sort();
   const grid=list.createDiv({cls:'writer-v7-rc-plotgrid',attr:{role:'table','aria-label':writerUi('Matriz de trama e atos','Plotlines by acts matrix')}});
   grid.style.setProperty('--writer-rc-acts',String(acts.length));
   const header=grid.createDiv({cls:'writer-v7-rc-plotgrid-row',attr:{role:'row'}});
   header.createEl('strong',{text:writerUi('Trama','Plotline'),attr:{role:'columnheader'}});
   for(const act of acts)header.createEl('strong',{text:act,attr:{role:'columnheader'}});
   for(const [name,items] of groups){
    if(term&&!(name+' '+items.map(s=>s.title).join(' ')).toLocaleLowerCase().includes(term))continue;
    const line=grid.createDiv({cls:'writer-v7-rc-plotgrid-row',attr:{role:'row'}});
    line.createEl('strong',{text:name,attr:{role:'rowheader'}});
    for(const act of acts){
     const cell=line.createDiv({cls:'writer-v7-rc-plotgrid-cell',attr:{role:'cell'}});
     const assigned=items.filter(x=>(x.act||writerUi('(sem ato)','(no act)'))===act);
     for(const scene of assigned.slice(0,15)){
      cell.createEl('button',{text:scene.title,attr:{title:scene.title}}).addEventListener('click',()=>scene.file&&view.openFile(scene.file));
     }
     if(assigned.length>15)cell.createSpan({text:'+'+(assigned.length-15)});
     if(!assigned.length)cell.createSpan({cls:'writer-v7-muted',text:'—'});
    }
   }
   return;
  }
  for(const [name,items] of groups){
   const found=items.filter(x=>!term||(x.title+' '+name).toLocaleLowerCase().includes(term));
   if(!found.length)continue;
   const details=list.createEl('details',{cls:'writer-v7-rc-plotgroup'});details.open=true;
   details.createEl('summary',{text:name+' · '+found.length+' '+writerUi('cenas','scenes')});
   const cardRows=details.createDiv({cls:'writer-v7-rc-plotrows'});
   for(const scene of found){
    const row=cardRows.createDiv({cls:'writer-v7-rc-plotrow'});
    row.createSpan({cls:'writer-v7-rc-order',text:String(scene.position)});
    row.createEl('button',{text:scene.title}).addEventListener('click',()=>scene.file&&view.openFile(scene.file));
    if(scene.act)row.createSpan({cls:'writer-v7-rc-chip',text:writerUi('Ato ','Act ')+scene.act});
    if(scene.beats.length)row.createSpan({cls:'writer-v7-rc-chip',text:scene.beats.join(', ')});
   }
  }
 };
 query.addEventListener('input',draw);viewMode.addEventListener('change',draw);draw();
}
function writerV7RCAssignmentModal(view,project,field,defaultBeat=''){
 const scenes=writerV7RCSceneView(view,project).filter(s=>s.file);
 if(!scenes.length)return void new Notice(writerUi('Nenhuma cena encontrada.','No scenes found.'));
 const modal=new Modal(view.app);
 let path=scenes[0].file.path,value=defaultBeat;
 modal.onOpen=()=>{
  modal.setTitle(field==='storyBeat'?writerUi('Associar marco a uma cena','Assign beat to scene'):writerUi('Associar cena a uma trama','Assign scene to plotline'));
  new Setting(modal.contentEl).setName(writerUi('Cena','Scene')).addDropdown(d=>{
   for(const scene of scenes)d.addOption(scene.file.path,scene.title);
   d.setValue(path).onChange(v=>path=v);
  });
  new Setting(modal.contentEl).setName(field==='storyBeat'?writerUi('Marco','Beat'):writerUi('Tramas, separadas por vírgulas','Plotlines, separated by commas'))
  .addText(t=>t.setValue(value).onChange(v=>value=v.slice(0,300)));
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setCta().setButtonText(writerUi('Salvar','Save')).onClick(async()=>{
    const file=view.app.vault.getAbstractFileByPath(path);
    try{await writerV7RCAssignSceneProperty(view,file,field,value);modal.close();await view.render();}
    catch(e){new Notice(String(e.message||e));}
   }));
 };modal.open();
}
function writerV7RCRenderBeats(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-rc-beats'});
 root.createEl('h3',{text:writerUi('Estrutura e marcos narrativos','Story beats and structure')});
 root.createEl('p',{cls:'writer-v7-muted',
  text:writerUi('Modelos não criam capítulos nem modificam o índice Longform. Associe marcos às notas existentes com storyBeat.','Templates do not create chapters or modify the Longform index. Assign beats to existing notes using storyBeat.')});
 const scenes=writerV7RCSceneView(view,project);
 const bar=root.createDiv({cls:'writer-v7-toolbar'});
 const type=bar.createEl('select',{attr:{'aria-label':writerUi('Estrutura narrativa','Story structure')}});
 for(const [id,pt,en] of [['three','Três atos','Three acts'],['five','Cinco atos','Five acts'],['journey','Jornada do herói','Hero’s journey']]){
  const o=type.createEl('option',{text:writerUi(pt,en)});o.value=id;
 }
 const prefs=view.prefs(project);type.value=WRITER_V7_RC_BEATS[prefs.v7RCBeatPreset]?prefs.v7RCBeatPreset:'three';
 bar.createEl('button',{text:writerUi('Associar marco','Assign beat')}).addEventListener('click',()=>writerV7RCAssignmentModal(view,project,'storyBeat'));
 const list=root.createDiv({cls:'writer-v7-rc-beat-list'});
 const draw=()=>{
  list.empty();
  const template=WRITER_V7_RC_BEATS[type.value]||WRITER_V7_RC_BEATS.three;
  const known=new Set(template.map(x=>x[0]));
  let done=0;
  for(const [id,pt,en] of template){
   const linked=scenes.filter(s=>s.beats.includes(id));
   if(linked.length)done++;
   const row=list.createDiv({cls:'writer-v7-rc-beat-row'});
   row.createSpan({cls:linked.length?'writer-v7-rc-beat-complete':'writer-v7-rc-beat-pending',text:linked.length?'✓':'○'});
   row.createEl('strong',{text:writerUi(pt,en)});
   const buttons=row.createDiv({cls:'writer-v7-rc-beat-scenes'});
   for(const s of linked)buttons.createEl('button',{text:s.title}).addEventListener('click',()=>s.file&&view.openFile(s.file));
   row.createEl('button',{text:writerUi('Vincular','Assign')}).addEventListener('click',()=>writerV7RCAssignmentModal(view,project,'storyBeat',id));
   if(linked.length){
    row.createEl('button',{text:writerUi('Desvincular','Unassign')}).addEventListener('click',async()=>{
     const scene=linked[0];
     if(!(scene.file instanceof TFile))return;
     try{
      await view.app.fileManager.processFrontMatter(scene.file,fm=>{
       const list=writerV7RCStrings(fm.storyBeat||fm.beat||fm.beatsheet);
       fm.storyBeat=list.filter(x=>x!==id);
      });
      await view.render();
     }catch(e){new Notice(String(e.message||e));}
    });
   }
  }
  const assigned=scenes.flatMap(s=>s.beats.map(beat=>({beat,scene:s}))).filter(x=>!known.has(x.beat));
  if(assigned.length){
   const extra=list.createEl('details',{cls:'writer-v7-rc-beat-extras'});
   extra.createEl('summary',{text:writerUi('Marcos personalizados','Custom beats')+' ('+assigned.length+')'});
   for(const x of assigned)extra.createEl('p',{text:x.beat+' · '+x.scene.title});
  }
  const progress=root.querySelector('.writer-v7-rc-beat-progress');
  if(progress)progress.setText(done+'/'+template.length+' '+writerUi('marcos associados','beats assigned'));
 };
 root.createEl('p',{cls:'writer-v7-rc-beat-progress writer-v7-muted'});
 type.addEventListener('change',()=>{prefs.v7RCBeatPreset=type.value;void view.plugin.saveSettings();draw();});
 draw();
}
function writerV7RCContinuityFindings(scenes){
 const titles=new Set(scenes.flatMap(s=>[
  s.title.toLocaleLowerCase(),
  s.file?.path?.replace(/\.md$/i,'').toLocaleLowerCase(),
  s.file?.basename?.toLocaleLowerCase()
 ].filter(Boolean)));
 const results=[];
 for(const scene of scenes){
  for(const [items,label] of [[scene.setup,'setup'],[scene.payoff,'payoff']]){
   for(const entry of items){
    const name=entry.replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].replace(/\.md$/,'').trim();
    if(!name||titles.has(name.toLocaleLowerCase()))continue;
    results.push({
     title:writerUi('Referência de cena não encontrada','Scene reference not found'),
     detail:scene.title+' · '+label+' → '+entry
    });
    if(results.length>=100)return results;
   }
  }
 }
 return results;
}
function writerV7RCRenderContinuity(view,panel,project){
 const scenes=writerV7RCSceneView(view,project),results=writerV7RCContinuityFindings(scenes);
 if(!results.length)return;
 const box=panel.createDiv({cls:'writer-v7-rc-continuity'});
 box.createEl('h4',{text:writerUi('Preparação e consequência de cenas','Scene setups and payoffs')});
 box.createEl('p',{cls:'writer-v7-muted',text:writerUi('Analisa referências setup_scenes e payoff_scenes, sem inventar conexões nem interpretar semanticamente o enredo.','Checks setup_scenes and payoff_scenes references without inventing links or interpreting the plot.')});
 for(const item of results.slice(0,60)){
  const row=box.createDiv({cls:'writer-v7-rc-continuity-row'});
  row.createEl('strong',{text:item.title});row.createEl('p',{text:item.detail});
 }
}
function writerV7RCRenderPacing(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-rc-pacing'});
 root.createEl('h3',{text:writerUi('Ritmo e intensidade','Pacing and intensity')});
 root.createEl('p',{cls:'writer-v7-muted',
 text:writerUi('Gráfico na ordem real do Longform, baseado na propriedade intensity (0–10) de cada cena. Ausências não são inventadas.','Graph follows the real Longform order, using each scene’s intensity property (0–10). Missing values are never guessed.')});
 const scenes=writerV7RCSceneView(view,project),filters=root.createDiv({cls:'writer-v7-toolbar'});
 const acts=[...new Set(scenes.map(x=>x.act).filter(Boolean))].sort();
 const filter=filters.createEl('select',{attr:{'aria-label':writerUi('Filtrar ato','Filter act')}});
 const all=filter.createEl('option',{text:writerUi('Todos os atos','All acts')});all.value='';
 for(const act of acts){const opt=filter.createEl('option',{text:act});opt.value=act;}
 const content=root.createDiv({cls:'writer-v7-rc-pacing-list'});
 const draw=()=>{
  content.empty();
  const items=scenes.filter(x=>!filter.value||x.act===filter.value);
  const marked=items.filter(x=>x.intensity!==null);
  const avg=marked.length?Math.round(marked.reduce((sum,x)=>sum+x.intensity,0)/marked.length*10)/10:null;
  content.createEl('p',{cls:'writer-v7-muted',
   text:marked.length+'/'+items.length+' '+writerUi('cenas com intensidade definida','scenes with defined intensity')+
    (avg===null?'':' · '+writerUi('Média ','Average ')+avg+'/10')});
  for(const scene of items){
   const row=content.createDiv({cls:'writer-v7-rc-pacing-row'});
   row.createEl('button',{text:scene.title}).addEventListener('click',()=>scene.file&&view.openFile(scene.file));
   const bar=row.createDiv({cls:'writer-v7-rc-pacing-track',
     attr:{role:'meter','aria-label':scene.title,'aria-valuemin':'0','aria-valuemax':'10',
      'aria-valuenow':scene.intensity===null?'0':String(scene.intensity)}});
   if(scene.intensity!==null){
    const inner=bar.createDiv({cls:'writer-v7-rc-pacing-fill'});
    inner.style.width=(scene.intensity*10)+'%';
   }
   row.createSpan({text:scene.intensity===null?'—':scene.intensity+'/10',cls:'writer-v7-rc-pacing-value'});
  }
 };
 filter.addEventListener('change',draw);draw();
}
function writerV7RCRenderStructure(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-rc-structure'});
 const tabs=root.createDiv({cls:'writer-v7-rc-structure-tabs'});
 const content=root.createDiv({cls:'writer-v7-rc-structure-body'});
 const settings=view.plugin.settings.v7||{};
 const choices=[
  ['plotlines',writerUi('Tramas','Plotlines'),'rcPlotlines'],
  ['beats',writerUi('Marcos narrativos','Story beats'),'rcBeats'],
  ['pacing',writerUi('Ritmo','Pacing'),'rcPacing'],
  ['dependencies',writerUi('Conexões','Connections'),'stableDependencies']
 ].filter(entry=>settings[entry[2]]!==false);
 const show=()=>{
  const active=choices.some(x=>x[0]===view.writerV7RCSubtab)?view.writerV7RCSubtab:choices[0]?.[0]||'plotlines';
  content.empty();
  if(!choices.length)return void content.createEl('p',{text:writerUi('Habilite algum módulo de estrutura nas configurações.','Enable a structure module in settings.')});
  for(const btn of tabs.querySelectorAll('button'))btn.classList.toggle('is-active',btn.dataset.section===active);
  if(active==='beats')writerV7RCRenderBeats(view,content,project);
  else if(active==='pacing')writerV7RCRenderPacing(view,content,project);
  else if(active==='dependencies')writerV7StableRenderDependencies(view,content,project);
  else writerV7RCRenderPlotlines(view,content,project);
 };
 for(const [id,label] of choices){
  const btn=tabs.createEl('button',{text:label,attr:{type:'button','aria-label':label,'data-section':id}});
  btn.addEventListener('click',()=>{view.writerV7RCSubtab=id;show();});
 }
 show();
}
class WriterV7LongformRC{
 constructor(plugin){this.plugin=plugin;}
 register(){
  const p=this.plugin;
  const open=async sub=>{
   await p.openProjects('structure');
   const leaf=p.app.workspace.getLeavesOfType(PROJECT_VIEW)?.[0];
   if(leaf?.view?.root){leaf.view.writerV7RCSubtab=sub;await leaf.view.render();}
  };
  p.addCommand({id:'v7-rc-plotlines',name:writerUi('Longform: tramas e arcos','Longform: plotlines and arcs'),callback:()=>open('plotlines')});
  p.addCommand({id:'v7-rc-beat-sheet',name:writerUi('Longform: marcos narrativos','Longform: story beats'),callback:()=>open('beats')});
  p.addCommand({id:'v7-rc-pacing',name:writerUi('Longform: ritmo e intensidade','Longform: pacing and intensity'),callback:()=>open('pacing')});
 }
 renderSettings(panel){
  const cfg=this.plugin.settings.v7||(this.plugin.settings.v7={});
  panel.createEl('h4',{text:writerUi('Planejamento Longform (RC)','Longform planning (RC)')});
  panel.createEl('p',{text:writerUi('Usa o índice Longform e as propriedades das cenas existentes; não cria outra organização paralela.','Uses the existing Longform index and scene properties; no parallel scene organization is created.')});
  for(const [key,pt,en] of [['rcPlotlines','Exibir tramas e arcos','Show plotlines and arcs'],['rcBeats','Exibir modelos de marcos','Show beat templates'],['rcPacing','Exibir análise de ritmo','Show pacing analysis'],['stableDependencies','Exibir preparações e consequências','Show scene dependencies']]){
   new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false)
    .onChange(async value=>{cfg[key]=value;await this.plugin.saveSettings();}));
  }
 }
}
