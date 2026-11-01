'use strict';
const {ItemView,TFile,TFolder,Notice,Modal,Menu,Setting,parseYaml,stringifyYaml}=require('obsidian');
const PROJECT_VIEW='basic-ai-projects';
const lfMsg=(pt,en)=>{try{return require('obsidian').getLanguage?.()?.toLowerCase().startsWith('pt')?pt:en;}catch(_){return en;}};
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'-').trim();
function lfPath(...parts){const path=[];for(const part of parts){for(const segment of String(part||'').split('/')){if(!segment||segment==='.')continue;if(segment==='..'){path.pop();continue;}path.push(segment);}}return path.join('/');}
class TextPrompt extends Modal{
 constructor(app,title,done,initial=''){super(app);this.titleText=title;this.done=done;this.initial=initial;}
 onOpen(){this.contentEl.empty();this.setTitle(this.titleText);let value=this.initial;new Setting(this.contentEl).setName(this.titleText).addText(t=>{t.setValue(value).onChange(v=>value=v);t.inputEl.focus();t.inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.close();this.done(value);}})});new Setting(this.contentEl).addButton(b=>b.setButtonText(lfMsg('Confirmar','Confirm')).setCta().onClick(()=>{this.close();this.done(value);}));}
 onClose(){this.contentEl.empty();}
}
class ConfirmProjectAction extends Modal{
 constructor(app,title,description,done){super(app);this.label=title;this.description=description;this.done=done;}
 onOpen(){this.setTitle(this.label);this.contentEl.createEl('p',{text:this.description});const row=new Setting(this.contentEl);
 row.addButton(b=>b.setButtonText(lfMsg('Cancelar','Cancel')).onClick(()=>this.close()));
 row.addButton(b=>b.setButtonText(lfMsg('Confirmar','Confirm')).setWarning().onClick(async()=>{this.close();try{await this.done();}catch(e){new Notice(e.message);}}));}
 onClose(){this.contentEl.empty();}
}
function lfFlattenScenes(raw){
 const out=[];
 function walk(list,depth){
  if(!Array.isArray(list))return;
  for(const entry of list){
   if(Array.isArray(entry)){walk(entry,depth+1);continue;}
   if(typeof entry==='string'&&entry.trim()){out.push({title:entry,indent:depth});continue;}
   if(entry&&typeof entry==='object'){
    const title=entry.title||entry.scene||entry.name;
    if(typeof title==='string'&&title.trim())out.push({title,indent:Math.max(0,Number.isFinite(+entry.indent)?+entry.indent:depth)});
    if(Array.isArray(entry.children))walk(entry.children,depth+1);
   }
  }
 }
 walk(raw,0);
 return out;
}
function lfNestScenes(flat){
 const result=[],stack=[result];let depth=0;
 for(const scene of flat){
  const title=typeof scene==='string'?scene:scene?.title;
  if(!title||typeof title!=='string')continue;
  let target=Math.max(0,Math.min(stack.length,Number(scene?.indent)||0));
  while(depth<target){const nested=[];stack[depth].push(nested);stack.push(nested);depth++;}
  while(depth>target){stack.pop();depth--;}
  stack[depth].push(title);
 }
 return result;
}
function sceneNames(items,out=[]){
 for(const scene of lfFlattenScenes(items))out.push(scene.title);
 return out;
}
function longformIndex(file,app){
 const data=app.metadataCache.getFileCache(file)?.frontmatter?.longform;
 if(!data||typeof data!=='object'||!['scenes','single'].includes(data.format||'scenes'))return null;
 const title=String(data.title||file.basename);
 return {file,meta:data,title,format:data.format||'scenes',draftTitle:data.draftTitle||'',scenes:Array.isArray(data.scenes)?data.scenes:[]};
}
function lfSceneTree(flat){
 const roots=[],nodes=[];
 for(const entry of flat){
  const depth=Math.max(0,Math.min(nodes.length,Number(entry.indent)||0));
  const node={title:entry.title,indent:depth,children:[]};
  if(depth===0)roots.push(node);else nodes[depth-1].children.push(node);
  nodes.length=depth;nodes.push(node);
 }
 return roots;
}
function lfNumberScenes(flat){
 const parts=[];
 return flat.map(scene=>{
  const indent=Math.max(0,Number(scene.indent)||0);
  parts.length=indent+1;
  parts[indent]=(parts[indent]||0)+1;
  return {...scene,numbering:parts.join('.')};
 });
}
function lfWordCount(text){
 return (String(text||'').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
}
function lfUnescape(s){return String(s||'').replace(/\\n/g,'\n').replace(/\\t/g,'\t');}
class ProjectsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.activeTab='scenes';this.selected=typeof plugin.settings?.lastLongformProject==='string'?plugin.settings.lastLongformProject:null;this.draft='Principal';this.workflow='Padrão';this.renderToken=0;}
 getViewType(){return PROJECT_VIEW;}
 getDisplayText(){return lfMsg('Projetos de escrita','Writing projects');}
 getIcon(){return 'notebook-pen';}
 async onOpen(){
  this.root=this.contentEl.createDiv({cls:'writer-project-root'});
  if(typeof MutationObserver==='function'){
   this.writerSettingsObserver=new MutationObserver(()=>{
    if(typeof writerMarkCompactSettings==='function')writerMarkCompactSettings(this.root);
   });
   this.writerSettingsObserver.observe(this.root,{childList:true,subtree:true});
  }
  this.registerEvent(this.app.vault.on('create',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('delete',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('rename',(file,oldPath)=>{
   if(oldPath&&file?.path){
    const saved=this.plugin.settings.lastLongformProject;
    const next=writerProjectRenamedPath(saved,oldPath,file.path);
    if(next!==saved){this.plugin.settings.lastLongformProject=next;void this.plugin.saveSettings();}
    this.selected=writerProjectRenamedPath(this.selected,oldPath,file.path);
   }
   this.queueRender();
  }));
  this.registerEvent(this.app.metadataCache.on('changed',file=>{
   const notes=this.currentProject&&this.notesRoot(this.currentProject)+'/';
   const changedScene=this.currentProject&&['scenes','board','structure','continuity','analytics'].includes(this.activeTab)
    &&this.activeScenes(this.currentProject).some(scene=>this.resolveScene(this.currentProject,scene.title)?.path===file?.path);
   if(file?.path===this.selected||(notes&&file?.path?.startsWith(notes)&&['notes','timeline','continuity'].includes(this.activeTab))||changedScene)this.queueRender();
  }));
  this.registerEvent(this.app.vault.on('modify',file=>{if(file instanceof TFile)this.recordSessionChange(file);}));
  await this.render();
 }
 queueRender(){clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.render(),220);}
 async onClose(){this.writerSettingsObserver?.disconnect();clearTimeout(this.refreshTimer);clearTimeout(this.sessionSaveTimer);for(const timer of this.sessionUpdateJobs?.values()||[])clearTimeout(timer);await this.plugin.saveSettings();}
 indexes(){return this.app.vault.getMarkdownFiles().map(f=>longformIndex(f,this.app)).filter(Boolean);}
 async render(){
  if(!this.root)return;
  const previousScroll=this.root.scrollTop;
  this.root.empty();
  const indexes=this.indexes();
  const token=++this.renderToken;
  const active=this.app.workspace.getActiveFile();
  const activeProject=active&&indexes.find(p=>p.file.path===active.path);
  if(!this.selected&&activeProject)writerProjectRemember(this,activeProject.file.path);
  const top=this.root.createDiv({cls:'writer-project-toolbar'});
  top.createEl('button',{text:lfMsg("+ Projeto","+ Project"),cls:'writer-project-create'}).addEventListener('click',()=>this.promptNewProject());
  const selector=top.createEl('select',{attr:{'aria-label':lfMsg("Projeto","Project")}});
  for(const project of indexes){const option=selector.createEl('option',{text:project.title});option.value=project.file.path;}
  if(!indexes.length){this.root.createEl('p',{text:lfMsg("Nenhum projeto encontrado. Crie um projeto ou selecione um índice Longform existente. Projetos Longform válidos são detectados automaticamente.","No projects found. Create one or select an existing Longform index. Valid Longform projects are detected automatically.")});return;}
  if(!indexes.some(x=>x.file.path===this.selected)){
   this.selected=activeProject?.file.path||indexes[0].file.path;
   writerProjectRemember(this,this.selected);
  }
  if(this.lastSelected!==this.selected){this.draft='Principal';this.workflowDraft=null;}
  this.lastSelected=this.selected;
  selector.value=this.selected;
  selector.addEventListener('change',()=>{writerProjectRemember(this,selector.value);this.render();});
  const project=indexes.find(x=>x.file.path===this.selected);
  this.currentProject=project;
  if(project.format==='scenes'&&!project.scenes.length){
   try{const raw=await this.app.vault.cachedRead(project.file),fm=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
    const parsed=fm?parseYaml(fm[1]):null;
    if(Array.isArray(parsed?.longform?.scenes)&&parsed.longform.scenes.length){project.meta={...project.meta,...parsed.longform};project.scenes=parsed.longform.scenes;}
   }catch(e){console.warn('[Basic AI] Could not read Longform index',e);}
  }
  this.projectPrefs=this.prefs(project);
  if(!writerModuleOn(this.plugin,'projects')){
   this.root.createEl('p',{text:lfMsg('Projetos ocultos. Reative em Configurações → Módulos.','Projects hidden. Enable in Settings → Modules.')});
   return;
  }
  if(this.activeTab==='comments'&&!writerModuleOn(this.plugin,'comments'))this.activeTab='scenes';
  const tabs=this.root.createDiv({cls:'writer-project-tabs'});
  tabs.scrollLeft=this.tabScrollLeft||0;
  tabs.addEventListener('scroll',()=>{this.tabScrollLeft=tabs.scrollLeft;},{passive:true});
  tabs.addEventListener('wheel',event=>{
   if(tabs.scrollWidth>tabs.clientWidth&&Math.abs(event.deltaY)>Math.abs(event.deltaX)){
    tabs.scrollLeft+=event.deltaY;event.preventDefault();
   }
  },{passive:false});
  const panels={};
  for(const [id,name] of [['scenes',lfMsg("Cenas","Scenes")],['project',lfMsg("Projeto","Project")],['compile',lfMsg("Compilar","Compile")],['notes',lfMsg("Compêndio","Compendium")],['timeline',lfMsg('Timeline','Timeline')],['board',lfMsg('Quadro','Board')],['structure',lfMsg('Estrutura','Structure')],['relations',lfMsg('Relações','Relationships')],['maps',lfMsg('Mapas','Maps')],['gallery',lfMsg('Galeria','Gallery')],['sessions',lfMsg('Sessões','Sessions')],['analytics',lfMsg('Análise','Analytics')],['continuity',lfMsg('Continuidade','Continuity')],['tasks',lfMsg('Tarefas','Tasks')],['comments',lfMsg('Comentários','Comments')]].filter(([id])=>(id!=='comments'||writerModuleOn(this.plugin,'comments'))&&(id!=='timeline'||this.plugin.settings.v7?.timeline!==false)&&(id!=='continuity'||this.plugin.settings.v7?.continuity!==false)
  &&(id!=='board'||this.plugin.settings.v7?.studioBoard!==false)
  &&(id!=='structure'||this.plugin.settings.v7?.rcPlotlines!==false||this.plugin.settings.v7?.rcBeats!==false)
  &&(id!=='relations'||this.plugin.settings.v7?.studioRelations!==false)
  &&(id!=='maps'||this.plugin.settings.v7?.studioMaps!==false)
  &&(id!=='analytics'||this.plugin.settings.v7?.studioAnalytics!==false)
  &&(id!=='gallery'||this.plugin.settings.v7?.studioGallery!==false)
  &&(id!=='sessions'||this.plugin.settings.v7?.studioSessions!==false))){
   const btn=tabs.createEl('button',{text:name,cls:this.activeTab===id?'is-active':''});
   btn.addEventListener('click',()=>{this.activeTab=id;this.render();});
   panels[id]=this.root.createDiv({cls:'writer-project-panel'});
   panels[id].style.display=this.activeTab===id?'block':'none';
  }
  // Rendering every hidden panel was expensive for books with many chapters.
  if(this.activeTab==='scenes')this.drawScenes(panels.scenes,project);
  if(this.activeTab==='project')this.drawProject(panels.project,project);
  if(this.activeTab==='compile')this.drawCompile(panels.compile,project);
  if(this.activeTab==='notes')await this.drawNotes(panels.notes,project);
  if(this.activeTab==='timeline')writerV7RenderTimeline(this,panels.timeline,project);
  if(this.activeTab==='board')writerV7StudioRenderBoard(this,panels.board,project);
  if(this.activeTab==='structure')writerV7RCRenderStructure(this,panels.structure,project);
  if(this.activeTab==='relations')writerV7StudioRenderGraph(this,panels.relations,project);
  if(this.activeTab==='maps')writerV7StudioRenderMaps(this,panels.maps,project);
  if(this.activeTab==='analytics')writerV7StudioRenderAnalytics(this,panels.analytics,project);
  if(this.activeTab==='gallery')writerV7StudioRenderGallery(this,panels.gallery,project);
  if(this.activeTab==='sessions')writerV7StudioRenderSessions(this,panels.sessions,project);
  if(this.activeTab==='continuity')writerV7RenderContinuity(this,panels.continuity,project);
  if(this.activeTab==='tasks')this.drawTasks(panels.tasks,project);
  if(this.activeTab==='comments')this.plugin.writerV4Extras?.drawComments(panels.comments,project,this);
  if(this.activeTab==='project')await this.drawStats(panels.project,project,token);
  this.root.scrollTop=previousScroll;
 }
 resolveScene(project,name){
  const base=project.file.parent?.path||'';
  const raw=String(project.meta.sceneFolder||'/').split('/').filter(Boolean).join('/');
  const folder=lfPath(base,raw);
  const exact=[lfPath(folder,name+'.md'),lfPath(folder,name),lfPath(base,name+'.md'),name+'.md',name];
  return exact.map(p=>this.app.vault.getAbstractFileByPath(p)).find(f=>f instanceof TFile)||null;
 }
 openFile(file){if(file instanceof TFile)this.app.workspace.getLeaf(false).openFile(file);}

 prefs(project){
  if(!this.plugin.settings.projectsData)this.plugin.settings.projectsData={};
  const key=project.file.path;
  return this.plugin.settings.projectsData[key]||(this.plugin.settings.projectsData[key]={drafts:{},goal:0,workflow:'standard'});
 }
 async savePrefs(){await this.plugin.saveSettings();await this.render();}
 async backupIndex(project){
  if(!this.indexBackups)this.indexBackups=new Set();
  if(this.indexBackups.has(project.file.path))return;
  const dir=lfPath(project.file.parent?.path,'_Backups');
  await this.ensureFolder(dir);
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const filename=clean(project.file.basename)+' - '+stamp+'.txt';
  const path=lfPath(dir,filename);
  await this.app.vault.create(path,await this.app.vault.read(project.file));
  this.indexBackups.add(project.file.path);
 }
 async updateIndex(project,change){
  await this.backupIndex(project);
  await this.app.fileManager.processFrontMatter(project.file,fm=>{
   if(!fm.longform||typeof fm.longform!=='object')fm.longform={};
   change(fm.longform);
  });
  await this.render();
 }
 sceneList(project){return lfFlattenScenes(project.scenes);}
 activeScenes(project){return this.draft==='Principal'?this.sceneList(project):(this.prefs(project).drafts[this.draft]||this.sceneList(project));}
 async changeScenes(project,change){
  if(this.draft==='Principal')return this.updateIndex(project,data=>{
   const flat=lfFlattenScenes(data.scenes||[]);
   change(flat);
   data.scenes=lfNestScenes(flat);
  });
  const prefs=this.prefs(project);
  if(!prefs.drafts[this.draft])prefs.drafts[this.draft]=this.sceneList(project);
  change(prefs.drafts[this.draft]);await this.savePrefs();
 }

 sceneIndex(scenes,title){return scenes.findIndex(x=>x.title===title);}
 subtreeEnd(scenes,i){let end=i+1;while(end<scenes.length&&scenes[end].indent>scenes[i].indent)end++;return end;}
 async addScene(project,parentTitle=null){
  new TextPrompt(this.app,parentTitle?lfMsg('Novo subcapítulo','New subchapter'):lfMsg('Nova cena','New scene'),async raw=>{
   const name=clean(raw);if(!name||name==='.'||name==='..')return;
   const base=project.file.parent?.path||'',folder=String(project.meta.sceneFolder||'/').split('/').filter(Boolean).join('/');
   const dir=lfPath(base,folder),path=lfPath(dir,name+'.md');
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Já existe uma cena com esse nome.','A scene with this name already exists.'));
    if(this.activeScenes(project).some(x=>x.title===name))throw Error(lfMsg('Nome de cena duplicado.','Duplicate scene name.'));
    if(dir)await this.ensureFolder(dir);
    let template='';
    const tp=project.meta.sceneTemplate;
    if(typeof tp==='string'&&tp.trim()){
     const file=this.app.vault.getAbstractFileByPath(tp)||this.app.vault.getMarkdownFiles().find(f=>f.basename===tp);
     if(file instanceof TFile)template=await this.app.vault.read(file);
    }
    const file=await this.app.vault.create(path,template);
    await this.changeScenes(project,scenes=>{
     if(parentTitle){
      const i=this.sceneIndex(scenes,parentTitle);
      if(i<0)throw Error(lfMsg('Cena pai não encontrada.','Parent scene not found.'));
      const end=this.subtreeEnd(scenes,i);
      scenes.splice(end,0,{title:name,indent:scenes[i].indent+1});
     }else scenes.push({title:name,indent:0});
    });
    this.openFile(file);
   }catch(e){new Notice(lfMsg("Não foi possível criar a cena: ","Could not create scene: ")+e.message);}
  }).open();
 }
 async moveScene(project,title,delta){
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,title);if(i<0)return;
   const end=this.subtreeEnd(scenes,i),block=scenes.slice(i,end),depth=scenes[i].indent;
   const siblings=scenes.map((x,j)=>j).filter(j=>scenes[j].indent===depth&&j!==i&&
     (j===0||scenes.slice(0,j).some(x=>x.indent<depth)||depth===0));
   let target;
   if(delta<0){target=siblings.filter(j=>j<i).pop();if(target==null)return;}
   else{target=siblings.find(j=>j>=end);if(target==null)return;target=this.subtreeEnd(scenes,target);}
   scenes.splice(i,block.length);
   const newPos=target>i?target-block.length:target;
   scenes.splice(newPos,0,...block);
  });}catch(e){new Notice(e.message);}
 }
 async indentScene(project,title,delta){
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,title);if(i<0)return;
   const depth=scenes[i].indent,newDepth=depth+delta;
   if(newDepth<0||newDepth>(i>0?scenes[i-1].indent+1:0))return;
   if(delta>0&&i>0&&scenes[i-1].indent<depth)return;
   const end=this.subtreeEnd(scenes,i);
   for(let j=i;j<end;j++)scenes[j].indent+=delta;
  });}catch(e){new Notice(e.message);}
 }
 async moveSceneBefore(project,source,target){return this.moveSceneRelative(project,source,target,false);}
 async moveSceneRelative(project,source,target,after=false){
  if(source===target)return;
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,source),j=this.sceneIndex(scenes,target);
   if(i<0||j<0)return;
   const end=this.subtreeEnd(scenes,i);
   if(j>=i&&j<end)return;
   const level=scenes[j].indent,part=scenes.splice(i,end-i);
   const targetIndex=this.sceneIndex(scenes,target);
   if(targetIndex<0)throw Error(lfMsg('Cena de destino não encontrada.','Destination scene not found.'));
   const destination=after?this.subtreeEnd(scenes,targetIndex):targetIndex;
   const shift=level-part[0].indent;
   part.forEach(item=>item.indent=Math.max(0,item.indent+shift));
   scenes.splice(destination,0,...part);
  });}catch(e){new Notice(e.message);}
 }
 async removeSceneFromIndex(project,title){
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,title);if(i<0)return;
   const depth=scenes[i].indent,end=this.subtreeEnd(scenes,i);
   scenes.splice(i,1);
   for(let j=i;j<end-1;j++)scenes[j].indent=Math.max(0,scenes[j].indent-1);
  });new Notice(lfMsg("Entrada removida do índice. Arquivo e subcapítulos preservados.","Entry removed from index. The file and child chapters were preserved."));}
  catch(e){new Notice(e.message);}
 }
 async renameScene(project,title){
  new TextPrompt(this.app,lfMsg('Renomear cena','Rename scene'),async raw=>{
   const name=clean(raw);if(!name||name===title)return;
   const file=this.resolveScene(project,title);
   if(!(file instanceof TFile))return new Notice(lfMsg("Arquivo da cena não encontrado.","Scene file not found."));
   const newPath=[file.parent?.path,name+'.md'].filter(Boolean).join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(newPath))throw Error(lfMsg('Já existe uma cena com esse nome.','A scene with this name already exists.'));
    await this.app.fileManager.renameFile(file,newPath);
    await this.changeScenes(project,scenes=>{const i=this.sceneIndex(scenes,title);if(i>=0)scenes[i].title=name;});
   }catch(e){new Notice(lfMsg('Erro ao renomear cena: ','Failed to rename scene: ')+e.message);}
  },title).open();
 }
 drawScenes(panel,project){
  if(project.format==='single'){
   panel.createEl('p',{text:lfMsg("Projeto de nota única.","Single-note project.")});
   panel.createEl('button',{text:lfMsg("Abrir texto","Open text")}).addEventListener('click',()=>this.openFile(project.file));
   return;
  }
  const prefs=this.prefs(project),draftBar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const linked=this.indexes().filter(x=>x.title===project.title&&x.file.path!==project.file.path);
  if(linked.length){
   const other=draftBar.createEl('select',{attr:{'aria-label':lfMsg('Rascunhos Longform existentes','Existing Longform drafts')}});
   other.createEl('option',{text:lfMsg('Trocar para rascunho Longform...','Switch to Longform draft...'),value:''});
   for(const d of linked){const o=other.createEl('option',{text:d.draftTitle||d.file.basename});o.value=d.file.path;}
   other.addEventListener('change',()=>{if(other.value){this.draft='Principal';writerProjectRemember(this,other.value);this.render();}});
  }
  const select=draftBar.createEl('select',{attr:{'aria-label':lfMsg('Rascunho local','Local draft')}});
  const drafts=['Principal',...Object.keys(prefs.drafts||{})];
  if(!drafts.includes(this.draft))this.draft='Principal';
  for(const d of drafts){const o=select.createEl('option',{text:d==='Principal'?lfMsg('Principal','Main'):d});o.value=d;}select.value=this.draft;
  select.addEventListener('change',()=>{this.draft=select.value;this.render();});
  draftBar.createEl('button',{text:lfMsg('+ Variante','+ Variant')}).addEventListener('click',()=>new TextPrompt(this.app,lfMsg('Nome da variante','Variant name'),async name=>{
   name=clean(name);if(!name||name==='Principal'||prefs.drafts[name])return;
   prefs.drafts[name]=JSON.parse(JSON.stringify(this.activeScenes(project)));
   this.draft=name;await this.savePrefs();
  }).open());
  if(this.draft!=='Principal')draftBar.createEl('button',{text:lfMsg("Excluir variante","Delete variant")}).addEventListener('click',async()=>{
   delete prefs.drafts[this.draft];this.draft='Principal';await this.savePrefs();
  });
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  toolbar.createEl('button',{text:lfMsg("+ Cena","+ Scene")}).addEventListener('click',()=>this.addScene(project));
  toolbar.createEl('button',{text:lfMsg("Novo rascunho Longform","New Longform draft")}).addEventListener('click',()=>this.createLinkedDraft(project));
  toolbar.createEl('button',{text:lfMsg('Expandir tudo','Expand all')}).addEventListener('click',async()=>{
   prefs.v7CollapsedScenes={};await this.plugin.saveSettings();await this.render();
  });
  toolbar.createEl('button',{text:lfMsg('Recolher tudo','Collapse all')}).addEventListener('click',async()=>{
   prefs.v7CollapsedScenes=Object.fromEntries(this.activeScenes(project).map(x=>[x.title,true]));
   await this.plugin.saveSettings();await this.render();
  });
  const scenes=this.activeScenes(project),tree=lfSceneTree(scenes);
  const renderItem=(item,parent,level=0)=>{
   const name=item.title;
   const row=parent.createDiv({cls:'writer-project-scene writer-project-scene-actions'});
   // The hierarchy is visualized inside the title, keeping drag and action
   // controls in fixed columns even on narrow Android sidebars.
   row.dataset.depth=String(level);
   row.dataset.sceneTitle=name;
   if(item.children?.length)row.addClass('writer-project-scene-has-children');
   row.draggable=true;
   const grip=row.createEl('button',{text:'⠿',cls:'writer-project-drag-handle',attr:{title:lfMsg('Arraste para mover ou toque e escolha o destino','Drag to reorder or tap and choose a destination'),'aria-label':lfMsg('Mover capítulo: ','Move chapter: ')+name}});
   grip.draggable=true;
   grip.addEventListener('click',()=>{
    if(this.scenePickup?.path===project.file.path&&this.scenePickup?.source===name){this.scenePickup=null;this.render();return;}
    if(this.scenePickup?.path===project.file.path&&this.scenePickup?.draft===this.draft){
     const source=this.scenePickup.source;this.scenePickup=null;this.moveSceneRelative(project,source,name,false);
    }else{
     this.scenePickup={path:project.file.path,draft:this.draft,source:name};
     new Notice(lfMsg('Capítulo selecionado. Toque na alça do destino para mover antes dele.','Chapter selected. Tap the destination handle to move before it.'),4000);
     row.addClass('writer-project-pickup');
    }
   });
   if(this.scenePickup?.source===name&&this.scenePickup?.path===project.file.path)row.addClass('writer-project-pickup');
   row.addEventListener('dragstart',e=>{
    if(!e.dataTransfer)return;
    e.dataTransfer.setData('application/x-basic-ai-scene',JSON.stringify({path:project.file.path,draft:this.draft,name}));
    e.dataTransfer.effectAllowed='move';row.addClass('writer-project-dragging');
   });
   row.addEventListener('dragend',()=>{row.removeClass('writer-project-dragging');row.removeClass('writer-project-dragover');});
   row.addEventListener('dragover',e=>{
    if(!e.dataTransfer?.types?.includes('application/x-basic-ai-scene'))return;
    e.preventDefault();e.dataTransfer.dropEffect='move';row.addClass('writer-project-dragover');
    row.toggleClass('writer-project-drop-after',e.clientY>row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
   });
   row.addEventListener('dragleave',e=>{if(!row.contains(e.relatedTarget)){row.removeClass('writer-project-dragover');row.removeClass('writer-project-drop-after');}});
   row.addEventListener('drop',e=>{
    e.preventDefault();e.stopPropagation();
    const after=e.clientY>row.getBoundingClientRect().top+row.getBoundingClientRect().height/2;
    row.removeClass('writer-project-dragover');row.removeClass('writer-project-drop-after');
    let data;try{data=JSON.parse(e.dataTransfer?.getData('application/x-basic-ai-scene')||'null');}catch(_){return;}
    if(data?.path===project.file.path&&data?.draft===this.draft&&typeof data.name==='string')
     this.moveSceneRelative(project,data.name,name,after);
   });
   const file=this.resolveScene(project,name);
   const titleWrapper=row.createDiv({cls:'writer-v7-scene-title-wrap'});
   if(item.children?.length){
    const closed=prefs.v7CollapsedScenes?.[name]===true;
    titleWrapper.createEl('button',{cls:'writer-v7-scene-collapse',text:closed?'+':'−',
     attr:{type:'button','aria-expanded':String(!closed),
      'aria-label':closed?lfMsg('Expandir ','Expand ')+name:lfMsg('Recolher ','Collapse ')+name}})
     .addEventListener('click',async()=>{
      prefs.v7CollapsedScenes=prefs.v7CollapsedScenes||{};
      prefs.v7CollapsedScenes[name]=!closed;
      await this.plugin.saveSettings();await this.render();
     });
   }
   const titleButton=titleWrapper.createEl('button',{cls:'writer-project-scene-title',attr:{
    'aria-label':(level?lfMsg('Subcapítulo nível ','Subchapter level ')+level+': ':'')+name
   }});
   if(level>0){
    // One slender vertical rail for each level:
    // chapter (0), │ subchapter (1), ││ nested note (2), etc.
    const rails=titleButton.createSpan({cls:'writer-project-scene-rails',
     attr:{'aria-hidden':'true'}});
    for(let depth=0;depth<level;depth++){
     rails.createSpan({cls:'writer-project-scene-rail'});
    }
   }
   titleButton.createSpan({text:name,cls:'writer-project-scene-title-text'});
   titleButton.addEventListener('click',()=>file?this.openFile(file):new Notice(lfMsg("Cena não encontrada: ","Scene not found: ")+name));
   const controls=row.createDiv({cls:'writer-project-scene-controls'});
   for(const [label,delta,hint] of [['↑',-1,lfMsg('Mover para cima','Move up')],['↓',1,lfMsg('Mover para baixo','Move down')]]){
    controls.createEl('button',{text:label,cls:'writer-project-small-button',attr:{title:hint,'aria-label':hint+' — '+name}})
     .addEventListener('click',()=>this.moveScene(project,name,delta));
   }
   const more=controls.createEl('button',{text:'⋯',cls:'writer-project-small-button writer-project-scene-more',attr:{title:lfMsg('Mais ações','More actions'),'aria-label':lfMsg('Mais ações para ','More actions for ')+name,'aria-haspopup':'menu'}});
   more.addEventListener('click',event=>{
    const menu=new Menu();
    for(const [label,icon,action] of [
     ['Diminuir recuo','arrow-left',()=>this.indentScene(project,name,-1)],
     ['Aumentar recuo','arrow-right',()=>this.indentScene(project,name,1)],
     [lfMsg('Adicionar subcapítulo','Add subchapter'),'plus',()=>this.addScene(project,name)],
     [lfMsg('Renomear cena','Rename scene'),'pencil',()=>this.renameScene(project,name)],
     [lfMsg('Inspecionar cena','Inspect scene'),'clipboard-list',()=>file?writerV7StudioOpenSheet(this,{
      file,path:file.path,title:name,cache:this.app.metadataCache?.getFileCache?.(file),tags:[]
     },{fields:['summary','status','act','sequence','pov','characters','location','sceneDate','plotlines','storyBeat','emotion','intensity','conflict','setup_scenes','payoff_scenes','target_wordcount']}):
      new Notice(lfMsg('Cena não encontrada.','Scene not found.'))],
     [lfMsg('Retirar do índice (preservar arquivo)','Remove from index (keep file)'),'list-x',()=>this.removeSceneFromIndex(project,name)]
    ])menu.addItem(item=>item.setTitle(label).setIcon(icon).onClick(action));
    menu.showAtMouseEvent(event);
   });
   if(prefs.v7CollapsedScenes?.[name]!==true)for(const child of item.children)renderItem(child,parent,level+1);
  };
  for(const item of tree)renderItem(item,panel);
  if(!scenes.length)panel.createEl('p',{text:lfMsg('Nenhuma cena cadastrada. Use + Cena.','No scenes yet. Use + Scene.')});
 }
 async createLinkedDraft(project){
  new TextPrompt(this.app,lfMsg('Nome do novo rascunho Longform','New Longform draft name'),async raw=>{
   const name=clean(raw);if(!name)return;
   const root=[project.file.parent?.path,'Rascunhos',name].filter(Boolean).join('/');
   const path=[root,'Índice.md'].join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Esse rascunho já existe.','This draft already exists.'));
    await this.ensureFolder(root);
    const scenes=[];
    for(const entry of this.activeScenes(project)){
     const file=this.resolveScene(project,entry.title);
     if(!(file instanceof TFile))continue;
     const dest=[root,entry.title+'.md'].join('/');
     if(this.app.vault.getAbstractFileByPath(dest))throw Error(lfMsg('Arquivo de cena já existe: ','Scene file already exists: ')+entry.title);
     await this.app.vault.create(dest,await this.app.vault.read(file));
     scenes.push({...entry});
    }
    const payload={longform:{format:'scenes',title:project.title,draftTitle:name,sceneFolder:'/',scenes:lfNestScenes(scenes),ignoredFiles:[]}};
    const index=await this.app.vault.create(path,'---\n'+stringifyYaml(payload)+'---\n');
    writerProjectRemember(this,index.path);this.draft='Principal';await this.render();this.queueRender();
    new Notice(lfMsg("Rascunho Longform criado sem alterar o original.","Longform draft created without changing the original."));
   }catch(e){new Notice(lfMsg("Não foi possível criar rascunho: ","Could not create draft: ")+e.message);}
  }).open();
 }
 drawProject(panel,project){
  panel.createEl('h4',{text:project.title});
  writerProjectMetaRender(this,panel,project);
  panel.createEl('p',{text:lfMsg("Índice: ","Index: ")+project.file.path});
  panel.createEl('p',{text:lfMsg("Cenas: ","Scenes: ")+sceneNames(project.scenes).length});
  panel.createEl('button',{text:lfMsg("Abrir índice","Open index")}).addEventListener('click',()=>this.openFile(project.file));
  new Setting(panel).setName(lfMsg("Título do projeto","Project title")).addText(t=>t.setValue(project.title).onChange(v=>this.newTitle=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(()=>this.updateIndex(project,data=>{data.title=this.newTitle||project.title;})));
  new Setting(panel).setName(lfMsg("Pasta das cenas","Scene folder")).setDesc(lfMsg("Relativa à pasta do índice; não move arquivos existentes.","Relative to the index folder; does not move existing files.")).addText(t=>t.setValue(project.meta.sceneFolder||'').onChange(v=>this.sceneFolder=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(()=>this.updateIndex(project,data=>{data.sceneFolder=this.sceneFolder||'';})));
  const prefs=this.prefs(project);
  new Setting(panel).setName(lfMsg("Meta diária (palavras)","Daily goal (words)")).addText(t=>t.setValue(String(prefs.dailyGoal||0)).onChange(v=>this.dailyGoalInput=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(async()=>{prefs.dailyGoal=Math.max(0,Number(this.dailyGoalInput)||0);await this.savePrefs();}));
  this.drawSession(panel,project);
  new Setting(panel).setName(lfMsg("Meta de palavras","Word goal")).setDesc(lfMsg("Meta total do projeto","Total project goal")).addText(t=>t.setValue(String(prefs.goal||0)).onChange(v=>this.goalInput=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(async()=>{prefs.goal=Math.max(0,Number(this.goalInput)||0);await this.savePrefs();}));
  const count=this.activeScenes(project).length;
  panel.createEl('p',{text:lfMsg("Cenas no rascunho: ","Scenes in draft: ")+count+(prefs.goal?' · Meta: '+prefs.goal+lfMsg(' palavras',' words'):'')});
  panel.createEl('p',{text:lfMsg("Rascunhos locais e metas ficam nas configurações do Basic AI. Rascunhos Longform são índices próprios.","Local drafts and goals are stored in Basic AI settings. Longform drafts are separate index notes.")});
  writerV6ProjectPreferencesRender(this,panel,project);
  this.drawSceneDiagnostics(panel,project);
 }

 workflowCatalog(){
  return [
   ['strip-frontmatter','Remover propriedades YAML','both'],
   ['remove-links','Remover links','both'],
   ['remove-comments',lfMsg('Remover comentários','Remove comments'),'both'],
   ['remove-strikethroughs',lfMsg('Remover trechos riscados','Remove strikethrough passages'),'both'],
   ['prepend-title',lfMsg('Adicionar títulos','Add titles'),'scene'],
   ['concatenate-text',lfMsg('Juntar cenas','Join scenes'),'join'],
   ['add-frontmatter',lfMsg('Adicionar propriedades YAML','Add YAML properties'),'manuscript'],
   ['write-to-note',lfMsg('Salvar como nota','Save as note'),'manuscript']
  ];
 }
 defaultWorkflow(){
  return {name:'Padrão',description:lfMsg('Compilação compatível com etapas Longform','Compilation compatible with Longform steps'),steps:[
   {id:'strip-frontmatter',optionValues:{}},
   {id:'remove-links',optionValues:{'remove-wikilinks':true,'remove-external-links':true}},
   {id:'prepend-title',optionValues:{format:'$3{#} $1',separator:'\n\n'}},
   {id:'concatenate-text',optionValues:{separator:'\\n\\n---\\n\\n'}},
   {id:'write-to-note',optionValues:{target:'manuscript.md','open-after':true}}
  ]};
 }
 workflowsFor(project){
  const prefs=this.prefs(project);
  if(!prefs.workflows||!Object.values(prefs.workflows).some(v=>v&&Array.isArray(v.steps))){
   const legacy=prefs.workflows||{},standard=this.defaultWorkflow();
   if(project.format==='single')standard.steps=standard.steps.filter(s=>s.id!=='concatenate-text');
   prefs.workflows={'Padrão':standard};
   for(const [name,options] of Object.entries(legacy)){
    if(!options||typeof options!=='object'||Array.isArray(options.steps))continue;
    const steps=JSON.parse(JSON.stringify(standard.steps));
    if(options.frontmatter===false)steps.splice(steps.findIndex(x=>x.id==='strip-frontmatter'),1);
    const links=steps.find(x=>x.id==='remove-links');
    if(options.links===false&&links)links.optionValues={'remove-wikilinks':false,'remove-external-links':false};
    const join=steps.find(x=>x.id==='concatenate-text');if(join&&options.separator!=null)join.optionValues.separator=options.separator;
    prefs.workflows[name]={name,steps,description:lfMsg('Importado da configuração anterior','Imported from previous settings')};
   }
  }
  return prefs.workflows;
 }
 validateWorkflow(project,wf){
  if(!wf||!Array.isArray(wf.steps)||!wf.steps.length)throw Error(lfMsg('Workflow sem etapas.','Workflow has no steps.'));
  const catalog=Object.fromEntries(this.workflowCatalog().map(([id,,kind])=>[id,kind]));
  let joined=project.format==='single';
  let saves=0;
  for(let i=0;i<wf.steps.length;i++){
   const id=wf.steps[i].id,kind=catalog[id];
   if(!kind)throw Error(lfMsg('Etapa não suportada: ','Unsupported step: ')+id+lfMsg('. Scripts externos não são executados por segurança.','. External scripts are not executed for security.'));
   if(kind==='scene'&&joined&&project.format!=='single')throw Error(lfMsg('Uma etapa de cena não pode aparecer depois de Juntar.','A scene step cannot come after Join.'));
   if(kind==='join'){if(joined)throw Error(lfMsg('Juntar cenas só pode ocorrer uma vez em projeto multicena.','Join scenes can appear only once in a multi-scene project.'));joined=true;}
   if(kind==='manuscript'&&!joined)throw Error(lfMsg('Junte as cenas antes das etapas de manuscrito.','Join scenes before manuscript steps.'));
   if(id==='write-to-note'){saves++;if(i!==wf.steps.length-1)throw Error(lfMsg('Salvar como nota deve ser a última etapa.','Save as note must be the final step.'));}
   if(saves>1)throw Error(lfMsg('Apenas uma etapa de salvar é permitida.','Only one save step is allowed.'));
  }
  if(!joined)throw Error(lfMsg('Adicione a etapa Juntar cenas.','Add a Join scenes step.'));
 }

 drawSceneDiagnostics(panel,project){
  if(project.format==='single')return;
  const tracked=new Set(this.sceneList(project).map(x=>x.title));
  const dir=lfPath(project.file.parent?.path||'',project.meta.sceneFolder||'/');
  const folder=this.app.vault.getAbstractFileByPath(dir||'/');
  const existing=folder instanceof TFolder?folder.children.filter(x=>x instanceof TFile&&x.extension==='md'&&x.path!==project.file.path):[];
  const unknown=existing.filter(f=>!tracked.has(f.basename)&&!((project.meta.ignoredFiles||[]).includes(f.basename)));
  const missing=[...tracked].filter(name=>!this.resolveScene(project,name));
  const section=panel.createEl('details',{cls:'writer-project-diagnostics'});
  section.createEl('summary',{text:lfMsg("Diagnóstico · ","Diagnostics · ")+missing.length+lfMsg(' cenas ausentes, ',' missing scenes, ')+unknown.length+lfMsg(' arquivos soltos',' unindexed files')});
  if(missing.length)section.createEl('p',{text:lfMsg('Ausentes: ','Missing: ')+missing.join(', ')});
  if(unknown.length){
   section.createEl('p',{text:lfMsg("Novos arquivos: ","New files: ")+unknown.map(f=>f.basename).join(', ')});
   section.createEl('button',{text:lfMsg("Adicionar arquivos soltos ao índice","Add unindexed files")}).addEventListener('click',()=>{
    new ConfirmProjectAction(this.app,lfMsg('Adicionar arquivos ao índice','Add files to index'),
     lfMsg('Adicionar ','Add ')+unknown.length+lfMsg(' arquivo(s) Markdown como cenas ao final do índice? Nenhum arquivo será movido.',' Markdown file(s) as scenes to the end of the index? No files will be moved.'),
     ()=>this.changeScenes(project,scenes=>{for(const f of unknown)scenes.push({title:f.basename,indent:0});})
    ).open();
   });
  }
 }
 async compileProject(project,wf,preview=false){
  this.validateWorkflow(project,wf);
  const flat=lfNumberScenes(project.format==='single'?[{title:project.title,indent:0}]:this.activeScenes(project));
  let scenes=[];
  for(const entry of flat){
   const file=project.format==='single'?project.file:this.resolveScene(project,entry.title);
   if(!(file instanceof TFile))throw Error(lfMsg('Cena ausente: ','Missing scene: ')+entry.title);
   const contents=await this.app.vault.read(file);
   scenes.push({title:entry.title,indent:entry.indent,numbering:entry.numbering,contents});
  }
  let manuscript=null,target='manuscript.md',openAfter=true;
  for(const step of wf.steps){
   const o=step.optionValues||{},id=step.id;
   const each=fn=>{if(manuscript!==null)manuscript=fn(manuscript,{title:project.title,indent:0});else scenes=scenes.map(scene=>({...scene,contents:fn(scene.contents,scene)}));};
   if(id==='strip-frontmatter')each(text=>text.replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/,''));
   else if(id==='remove-links')each(text=>{
    if(o['remove-wikilinks']!==false)text=text.replace(/!?\[\[([^\]]+)\]\]/g,(_,inner)=>inner.includes('|')?inner.split('|').slice(1).join('|'):inner.split('#')[0]);
    if(o['remove-external-links']!==false)text=text.replace(/!?\[([^\]]*)\]\([^)]+\)/g,'$1');
    return text;
   });
   else if(id==='remove-comments')each(text=>{
    if(o['remove-markdown-comments']!==false)text=text.replace(/%%[\s\S]*?%%/g,'');
    if(o['remove-html-comments']!==false)text=text.replace(/<!--[\s\S]*?-->/g,'');
    return text;
   });
   else if(id==='remove-strikethroughs')each(text=>text.replace(/~~[\s\S]*?~~/g,''));
   else if(id==='prepend-title')each((text,scene)=>{
    const number=scene.numbering||String(flat.findIndex(x=>x.title===scene.title)+1);
    const format=String(o.format??'$3{#} $1');
    const heading=format.replace(/\$3\{([^}]*)\}/g,(_,s)=>s.repeat(Math.max(1,(scene.indent||0)+1)))
      .replace(/\$1/g,scene.title).replace(/\$2/g,String(number));
    return heading+lfUnescape(o.separator??'\n\n')+text;
   });
   else if(id==='concatenate-text'){
    manuscript=scenes.map(x=>x.contents.trim()).join(lfUnescape(o.separator??'\\n\\n'));
   }
   else if(id==='add-frontmatter'){
    let yaml=String(o.frontmatter||'').trim();
    if(yaml){
     try{parseYaml(yaml);}catch(e){throw Error(lfMsg('YAML inválido na etapa Adicionar propriedades: ','Invalid YAML in Add properties step: ')+e.message);}
     if(manuscript!==null)manuscript='---\n'+yaml+'\n---\n'+manuscript;
     else scenes=scenes.map(x=>({...x,contents:'---\n'+yaml+'\n---\n'+x.contents}));
    }
   }
   else if(id==='write-to-note'){
    target=String(o.target||'manuscript.md').replace(/\$1/g,clean(project.title)).trim();
    openAfter=o['open-after']!==false;
   }
  }
  if(manuscript===null)manuscript=scenes.map(x=>x.contents.trim()).join('\n\n');
  if(preview)return {contents:manuscript};
  if(!target.endsWith('.md'))target+='.md';
  if(target.startsWith('/')||target.split('/').some(part=>part==='..'||part==='.')||target.includes('\\'))throw Error(lfMsg('Caminho de saída inválido.','Invalid output path.'));
  const dir=project.file.parent?.path||'',relative=target.split('/').map(clean).filter(Boolean).join('/');
  let path=[dir,relative].filter(Boolean).join('/');
  if(path===project.file.path||flat.some(x=>this.resolveScene(project,x.title)?.path===path))throw Error(lfMsg('A saída não pode sobrescrever o índice nem uma cena.','The output cannot overwrite the index or a scene.'));
  const basename=path.replace(/\.md$/i,''),original=path;let n=2;
  while(this.app.vault.getAbstractFileByPath(path))path=basename+' '+n+++'.md';
  const parent=path.split('/').slice(0,-1).join('/');if(parent)await this.ensureFolder(parent);
  const file=await this.app.vault.create(path,manuscript+'\n');
  if(openAfter)this.openFile(file);
  return {contents:manuscript,file,original};
 }
 async importLongformWorkflows(project){
  try{
   const installed=this.app.plugins?.plugins?.longform;
   if(!installed?.loadData)throw Error(lfMsg('O Longform não está instalado ou ativo; use a importação por JSON.','Longform is not installed or active; use JSON import.'));
   const data=await installed.loadData(),entries=data?.workflows;
   if(!entries||typeof entries!=='object')throw Error(lfMsg('Nenhum workflow encontrado no Longform.','No workflows found in Longform.'));
   const ours=this.workflowsFor(project);
   let count=0;
   for(const [name,wf] of Object.entries(entries)){
    if(!Array.isArray(wf?.steps))continue;
    const label='Longform · '+name;
    ours[label]=JSON.parse(JSON.stringify(wf));count++;
   }
   await this.savePrefs();new Notice(count+lfMsg(' workflow(s) importado(s). Etapas externas serão sinalizadas.',' workflow(s) imported. External steps are flagged.'));
  }catch(e){new Notice(e.message,7000);}
 }
 importWorkflowJSON(project){
  const modal=new Modal(this.app);let raw='';
  modal.onOpen=()=>{
   modal.setTitle(lfMsg('Importar workflows (JSON)','Import workflows (JSON)'));
   modal.contentEl.createEl('p',{text:lfMsg("Cole o objeto workflows ou o conteúdo de data.json do Longform. Apenas etapas reconhecidas poderão ser executadas.","Paste the workflows object or Longform data.json contents. Only recognized steps can be executed.")});
   const area=modal.contentEl.createEl('textarea',{attr:{rows:'12',placeholder:'{"workflows":{...}}'}});
   area.style.width='100%';area.addEventListener('input',()=>raw=area.value);
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg('Importar','Import')).setCta().onClick(async()=>{
    try{
     const parsed=JSON.parse(raw),input=parsed.workflows||parsed;
     if(!input||typeof input!=='object'||Array.isArray(input))throw Error(lfMsg('Esperado objeto de workflows.','Expected a workflows object.'));
     const dest=this.workflowsFor(project);let count=0;
     for(const [key,wf] of Object.entries(input)){
      if(!wf||!Array.isArray(wf.steps))continue;
      let name='Importado · '+String(key).slice(0,90);
      if(dest[name])name+=' (2)';
      dest[name]=JSON.parse(JSON.stringify(wf));count++;
     }
     if(!count)throw Error(lfMsg('Nenhum workflow com etapas foi encontrado.','No workflow with steps was found.'));
     modal.close();await this.savePrefs();new Notice(count+lfMsg(' workflow(s) importado(s).',' workflow(s) imported.'));
    }catch(e){new Notice(lfMsg("Importação inválida: ","Invalid import: ")+e.message,7000);}
   }));
  };
  modal.open();
 }
 drawCompile(panel,project){
  panel.createEl('h4',{text:lfMsg("Compilação por etapas","Step-by-step compilation")});
  const workflows=this.workflowsFor(project);
  if(!workflows[this.workflow])this.workflow=Object.keys(workflows)[0];
  const bar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const selector=bar.createEl('select',{attr:{'aria-label':'Workflow'}});
  for(const name of Object.keys(workflows)){const opt=selector.createEl('option',{text:name==='Padrão'?lfMsg('Padrão','Default'):name});opt.value=name;}
  selector.value=this.workflow;
  selector.addEventListener('change',()=>{this.workflow=selector.value;this.workflowDraft=null;this.render();});
  bar.createEl('button',{text:'+ Workflow'}).addEventListener('click',()=>new TextPrompt(this.app,lfMsg('Nome do workflow','Workflow name'),async name=>{
   name=clean(name);if(!name||workflows[name])return;
   workflows[name]=JSON.parse(JSON.stringify(workflows[this.workflow]));workflows[name].name=name;
   this.workflow=name;this.workflowDraft=null;await this.savePrefs();
  }).open());
  bar.createEl('button',{text:lfMsg('Importar Longform','Import from Longform')}).addEventListener('click',()=>this.importLongformWorkflows(project));
  bar.createEl('button',{text:lfMsg('Importar JSON','Import JSON')}).addEventListener('click',()=>this.importWorkflowJSON(project));
  const wf=this.workflowDraft&&this.workflowDraftName===this.workflow?this.workflowDraft:
   (this.workflowDraft=JSON.parse(JSON.stringify(workflows[this.workflow])),this.workflowDraftName=this.workflow,this.workflowDraft);
  const status=panel.createEl('p',{text:lfMsg("Edite etapas e clique em Salvar workflow. Scripts externos não são executados.","Edit steps and select Save workflow. External scripts are not executed.")});
  const stepNames=Object.fromEntries(this.workflowCatalog().map(([id,label])=>[id,label]));
  const drawStep=(step,i)=>{
   const box=panel.createDiv({cls:'writer-project-workflow-step'});
   const header=box.createDiv({cls:'writer-project-workflow-heading'});
   header.createEl('strong',{text:(i+1)+'. '+(stepNames[step.id]||lfMsg('Não suportada: ','Unsupported: ')+step.id)});
   for(const [label,change] of [['↑',-1],['↓',1]]){
    header.createEl('button',{text:label,attr:{'aria-label':label==='↑'?lfMsg('Subir etapa','Move step up'):lfMsg('Descer etapa','Move step down')}})
     .addEventListener('click',()=>{const j=i+change;if(j<0||j>=wf.steps.length)return;wf.steps.splice(j,0,wf.steps.splice(i,1)[0]);this.render();});
   }
   header.createEl('button',{text:'×',attr:{'aria-label':lfMsg('Remover etapa','Remove step')}}).addEventListener('click',()=>{wf.steps.splice(i,1);this.render();});
   const options=step.optionValues||(step.optionValues={});
   const toggle=(label,key,def=true)=>new Setting(box).setName(label).addToggle(t=>t.setValue(options[key]??def).onChange(v=>options[key]=v));
   const text=(label,key,def='',multiline=false)=>{
    const setting=new Setting(box).setName(label);
    const write=t=>t.setValue(String(options[key]??def)).onChange(v=>options[key]=v);
    if(multiline)setting.addTextArea(write);else setting.addText(write);
   };
   if(step.id==='remove-links'){toggle(lfMsg('Remover wikilinks','Remove wikilinks'),'remove-wikilinks');toggle(lfMsg('Remover links externos','Remove external links'),'remove-external-links');}
   if(step.id==='remove-comments'){toggle(lfMsg('Remover %% comentários %%','Remove %% comments %%'),'remove-markdown-comments');toggle(lfMsg('Remover comentários HTML','Remove HTML comments'),'remove-html-comments');}
   if(step.id==='prepend-title'){text(lfMsg('Formato ($1 título, $2 número, $3{#} nível)','Format ($1 title, $2 number, $3{#} level)'),'format','$3{#} $1');text(lfMsg('Separador','Separator'),'separator','\\n\\n');}
   if(step.id==='concatenate-text')text(lfMsg('Separador','Separator'),'separator','\\n\\n---\\n\\n');
   if(step.id==='write-to-note'){text(lfMsg('Destino relativo ao projeto','Destination relative to project'),'target','manuscript.md');toggle(lfMsg('Abrir manuscrito','Open manuscript'),'open-after');}
   if(step.id==='add-frontmatter')text('YAML','frontmatter','',true);
   if(!stepNames[step.id])box.createEl('p',{text:lfMsg("Etapa de script/customizada preservada na importação, mas não pode ser executada.","Custom/script step preserved on import but cannot be executed.")});
  };
  for(let i=0;i<wf.steps.length;i++)drawStep(wf.steps[i],i);
  const add=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const stepPicker=add.createEl('select');
  for(const [id,label] of this.workflowCatalog()){const o=stepPicker.createEl('option',{text:label});o.value=id;}
  add.createEl('button',{text:lfMsg('+ Etapa','+ Step')}).addEventListener('click',()=>{wf.steps.push({id:stepPicker.value,optionValues:{}});this.render();});
  add.createEl('button',{text:lfMsg("Salvar workflow","Save workflow")}).addEventListener('click',async()=>{
   workflows[this.workflow]=JSON.parse(JSON.stringify(wf));await this.plugin.saveSettings();status.setText(lfMsg('Workflow salvo.','Workflow saved.'));
  });
  add.createEl('button',{text:lfMsg("Prévia","Preview")}).addEventListener('click',async()=>{
   try{const result=await this.compileProject(project,wf,true);let preview=panel.querySelector('.writer-project-compile-preview');
    if(!preview)preview=panel.createEl('textarea',{cls:'writer-project-compile-preview'});
    preview.value=result.contents.slice(0,24000);preview.readOnly=true;
    status.setText(lfMsg('Prévia gerada; nenhum arquivo foi modificado.','Preview generated; no files were modified.'));
   }catch(e){new Notice(lfMsg("Workflow inválido: ","Invalid workflow: ")+e.message,8000);}
  });
  if(!this.app.isMobile&&this.plugin.settings.pandocExport?.enabled&&this.plugin.writerPandocExporter){
   add.createEl('button',{text:lfMsg('Compilar e exportar…','Compile and export…')}).addEventListener('click',async()=>{
    try{
     const result=await this.compileProject(project,wf,false);
     await this.app.workspace.getLeaf(false).openFile(result.file);
     this.plugin.writerPandocExporter.openDialog();
    }catch(e){new Notice(lfMsg('Falha na compilação: ','Compilation failed: ')+e.message);}
   });
  }
  add.createEl('button',{text:lfMsg("Compilar","Compile"),cls:'mod-cta'}).addEventListener('click',async()=>{
   try{const result=await this.compileProject(project,wf,false);status.setText(lfMsg('Criado: ','Created: ')+result.file.path);new Notice(lfMsg('Manuscrito criado sem sobrescrever o original.','Manuscript created without overwriting the original.'));}
   catch(e){new Notice(lfMsg('Falha: ','Failed: ')+e.message,8000);}
  });
 }
 notesRoot(project){const dir=project.file.parent?.path||'';return (dir?dir+'/':'')+'_Notas';}
 async ensureFolder(path){let current='';for(const part of path.split('/').filter(Boolean)){current=current?current+'/'+part:part;if(!this.app.vault.getAbstractFileByPath(current))await this.app.vault.createFolder(current);}}

 async drawNotes(panel,project){
  if(this.plugin.settings.v7?.compendium)return writerV7RenderCompendium(this,panel,project);
  return await this.drawNotesLegacy(panel,project);
 }
 async drawNotesLegacy(panel,project){
  const root=this.notesRoot(project);
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  toolbar.createEl('button',{text:lfMsg('+ Pasta','+ Folder')}).addEventListener('click',()=>this.promptNotesFolder(root));
  toolbar.createEl('button',{text:lfMsg("+ Nota","+ Note")}).addEventListener('click',()=>this.promptNote(root));
  const search=panel.createEl('input',{attr:{type:'search',placeholder:lfMsg('Pesquisar notas deste projeto','Search project notes'),'aria-label':lfMsg('Pesquisar notas','Search notes')}});
  search.addClass('writer-project-note-search');
  const contents=panel.createDiv({cls:'writer-project-note-tree'});
  const folder=this.app.vault.getAbstractFileByPath(root);
  if(!(folder instanceof TFolder)){contents.createEl('p',{text:lfMsg("Crie uma pasta ou nota para começar. As notas não entram no manuscrito.","Create a folder or note to get started. Notes are excluded from the manuscript.")});return;}
  const viewFolder=(f,parent,level=0)=>{
   if(level>18)return;
   const block=parent.createEl('details',{cls:'writer-project-notes-folder'});block.open=level<=1;
   block.createEl('summary',{text:level===0?lfMsg("Notas","Notes"):f.name});
   const actions=block.createDiv({cls:'writer-project-note-actions'});
   actions.createEl('button',{text:lfMsg("+ Nota","+ Note")}).addEventListener('click',()=>this.promptNote(f.path));
   actions.createEl('button',{text:lfMsg('+ Pasta','+ Folder')}).addEventListener('click',()=>this.promptNotesFolder(f.path));
   if(level>0){
    actions.createEl('button',{text:lfMsg('Nota da pasta','Folder note')}).addEventListener('click',async()=>{
     try{
      const note=writerV7FolderNote(this.app,f)||await this.plugin.writerV7Worldbuilding.createFolderNote(f);
      if(note)await this.openFile(note);
     }catch(e){new Notice(String(e.message||e));}
    });
    actions.createEl('button',{text:lfMsg("Renomear","Rename")}).addEventListener('click',()=>this.renameProjectItem(f));
    actions.createEl('button',{text:lfMsg('Lixeira','Trash')}).addEventListener('click',()=>this.trashProjectItem(f));
   }
   for(const item of [...f.children].sort((x,y)=>x.name.localeCompare(y.name,'pt-BR'))){
    if(item instanceof TFolder)viewFolder(item,block,level+1);
    else if(item instanceof TFile&&item.extension==='md'){
     const row=block.createDiv({cls:'writer-project-note-row'});
     row.dataset.noteTitle=item.basename.toLowerCase();
     row.createEl('button',{text:item.basename,cls:'writer-project-note'}).addEventListener('click',()=>this.openFile(item));
     row.createEl('button',{text:'✎',attr:{title:lfMsg("Renomear","Rename"), 'aria-label':lfMsg("Renomear","Rename")}}).addEventListener('click',()=>this.renameProjectItem(item));
     row.createEl('button',{text:'↪',attr:{title:lfMsg('Mover','Move'), 'aria-label':lfMsg('Mover','Move')}}).addEventListener('click',()=>this.moveProjectNote(item,folder));
     row.createEl('button',{text:'✦',attr:{title:lfMsg('Revisar nota','Review note'),'aria-label':lfMsg('Revisar nota','Review note')}}).addEventListener('click',()=>this.plugin.openReview('grammar',item));
     row.createEl('button',{text:'×',attr:{title:lfMsg('Mover para lixeira','Move to trash'),'aria-label':lfMsg('Mover para lixeira','Move to trash')}}).addEventListener('click',()=>this.trashProjectItem(item));
    }
   }
  };
  viewFolder(folder,contents);
  search.addEventListener('input',()=>{
   const q=search.value.trim().toLocaleLowerCase();
   for(const el of contents.querySelectorAll('.writer-project-note-row')){
    el.style.display=!q||el.dataset.noteTitle.includes(q)?'':'none';
    if(q&&el.style.display!=='none'){let ancestor=el.parentElement;while(ancestor&&ancestor!==contents){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}}
   }
  });
 }
 promptNotesFolder(parent){
  new TextPrompt(this.app,lfMsg('Nome da pasta','Folder name'),async raw=>{
   const name=clean(raw);if(!name)return;
   try{const path=[parent,name].filter(Boolean).join('/');
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Esta pasta já existe.','This folder already exists.'));
    await this.ensureFolder(path);await this.render();
   }catch(e){new Notice(e.message);}
  }).open();
 }
 promptNote(dir){
  new TextPrompt(this.app,lfMsg('Nova nota','New note'),async raw=>{
   const name=clean(raw);if(!name)return;
   try{await this.ensureFolder(dir);const path=dir+'/'+name+'.md';
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Já existe uma nota com esse nome.','A note with this name already exists.'));
    const file=await this.app.vault.create(path,'');this.openFile(file);await this.render();
   }catch(e){new Notice(e.message);}
  }).open();
 }
 renameProjectItem(item){
  new TextPrompt(this.app,lfMsg('Novo nome','New name'),async raw=>{
   const name=clean(raw);if(!name)return;
   const path=[item.parent?.path,name+(item instanceof TFile?'.'+item.extension:'')].filter(Boolean).join('/');
   if(path===item.path)return;
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Já existe um arquivo ou pasta com esse nome.','A file or folder with this name already exists.'));
    if(item instanceof TFile)await this.app.fileManager.renameFile(item,path);
    else await this.app.vault.rename(item,path);
    await this.render();
   }catch(e){new Notice(e.message);}
  },item instanceof TFile?item.basename:item.name).open();
 }
 moveProjectNote(file,root){
  const modal=new Modal(this.app);
  modal.onOpen=()=>{
   modal.setTitle(lfMsg("Mover nota para pasta","Move note to folder"));
   const folders=[];
   const walk=f=>{folders.push(f);for(const c of f.children)if(c instanceof TFolder)walk(c);};
   walk(root);
   let chosen=folders[0].path;
   new Setting(modal.contentEl).setName(lfMsg('Destino','Destination')).addDropdown(d=>{
    for(const f of folders)d.addOption(f.path,f.path.replace(root.path,lfMsg("Notas","Notes"))||lfMsg("Notas","Notes"));
    d.setValue(file.parent?.path||chosen).onChange(v=>chosen=v);
   });
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg('Mover','Move')).setCta().onClick(async()=>{
    modal.close();const target=chosen+'/'+file.name;
    try{if(target===file.path)return;if(this.app.vault.getAbstractFileByPath(target))throw Error(lfMsg('Já existe uma nota no destino.','A note already exists at the destination.'));
     await this.app.fileManager.renameFile(file,target);await this.render();
    }catch(e){new Notice(e.message);}
   }));
  };
  modal.open();
 }
 trashProjectItem(file){
  new ConfirmProjectAction(this.app,lfMsg('Mover para a lixeira','Move to trash'),
   lfMsg('Enviar “','Send “')+file.name+lfMsg('” para a lixeira do Obsidian? Esta ação inclui os arquivos internos se for uma pasta.','” to the Obsidian trash? If it is a folder, this also includes its contents.'),
   async()=>{await this.app.vault.trash(file,false);await this.render();}).open();
 }
 promptNewProject(){
  const modal=new Modal(this.app),active=this.app.workspace.getActiveFile();
  let title='',parent=active?.parent?.path||'',format='scenes';
  modal.onOpen=()=>{
   modal.setTitle(lfMsg("Novo projeto de escrita","New writing project"));
   new Setting(modal.contentEl).setName('Nome').addText(t=>t.setPlaceholder(lfMsg('Meu livro','My book')).onChange(v=>title=v));
   new Setting(modal.contentEl).setName(lfMsg('Pasta no cofre','Vault folder')).setDesc(lfMsg('Caminho relativo ao cofre','Path relative to the vault')).addText(t=>t.setValue(parent).onChange(v=>parent=v));
   new Setting(modal.contentEl).setName(lfMsg('Tipo','Type')).addDropdown(d=>d.addOption('scenes',lfMsg('Várias cenas','Multiple scenes')).addOption('single',lfMsg('Nota única','Single note')).onChange(v=>format=v));
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg("Criar projeto","Create project")).setCta().onClick(async()=>{
    try{
     title=clean(title);if(!title)throw Error(lfMsg('Informe o nome do projeto.','Enter a project name.'));
     if(parent.startsWith('/')||parent.split('/').includes('..'))throw Error(lfMsg('Pasta inválida.','Invalid folder.'));
     const dir=[parent,clean(title)].filter(Boolean).join('/');
     const path=dir+'/'+(format==='scenes'?'Índice.md':title+'.md');
     if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Projeto já existe nesse caminho.','A project already exists at this path.'));
     await this.ensureFolder(dir);
     const data={format,title,sceneFolder:'/',scenes:[],ignoredFiles:[]};
     if(format==='single'){delete data.sceneFolder;delete data.scenes;delete data.ignoredFiles;}
     const file=await this.app.vault.create(path,'---\n'+stringifyYaml({longform:data})+'---\n\n');
     modal.close();writerProjectRemember(this,file.path);this.draft='Principal';await this.render();this.queueRender();this.openFile(file);
    }catch(e){new Notice(e.message,7000);}
   }));
  };
  modal.open();
 }

 async startWritingSession(project){
  const prefs=this.prefs(project),baseline={};
  const files=project.format==='single'?[project.file]:this.activeScenes(project).map(x=>this.resolveScene(project,x.title)).filter(Boolean);
  for(const file of files){try{baseline[file.path]=lfWordCount(await this.app.vault.cachedRead(file));}catch(_){}}
  const today=new Date().toDateString();
  const previous=prefs.session;
  prefs.session={active:true,startedAt:Date.now(),day:today,words:previous?.day===today?previous.words||0:0,baseline,notified:false};
  await this.plugin.saveSettings();await this.render();
 }
 async stopWritingSession(project){
  const prefs=this.prefs(project);
  if(prefs.session){prefs.session.active=false;prefs.session.stoppedAt=Date.now();}
  await this.plugin.saveSettings();await this.render();
 }
 async recordSessionChange(file){
  const project=this.currentProject;if(!project||!this.plugin.settings?.projectsData)return;
  const prefs=this.prefs(project),session=prefs.session;
  if(!session?.active||session.day!==new Date().toDateString())return;
  if(!Object.prototype.hasOwnProperty.call(session.baseline||{},file.path))return;
  if(!this.sessionUpdateJobs)this.sessionUpdateJobs=new Map();
  clearTimeout(this.sessionUpdateJobs.get(file.path));
  this.sessionUpdateJobs.set(file.path,setTimeout(async()=>{
   try{
    const words=lfWordCount(await this.app.vault.cachedRead(file));
    const before=session.baseline[file.path],diff=words-before;
    session.baseline[file.path]=words;
    session.words=Math.max(0,(session.words||0)+diff);
    if(prefs.dailyGoal>0&&session.words>=prefs.dailyGoal&&!session.notified){session.notified=true;new Notice(lfMsg("Meta diária de escrita atingida!","Daily writing goal reached!"));}
    clearTimeout(this.sessionSaveTimer);
    this.sessionSaveTimer=setTimeout(()=>this.plugin.saveSettings(),1300);
    if(this.activeTab==='project')this.queueRender();
   }catch(e){console.warn('[Basic AI] Session tracking:',e);}
  },500));
 }
 drawSession(panel,project){
  const prefs=this.prefs(project),session=prefs.session;
  const box=panel.createDiv({cls:'writer-project-session'});
  box.createEl('h4',{text:lfMsg("Sessão de escrita","Writing session")});
  const today=new Date().toDateString(),words=session?.day===today?session.words||0:0;
  box.createEl('p',{text:words+lfMsg(' palavras registradas hoje',' words recorded today')+(prefs.dailyGoal?' / meta '+prefs.dailyGoal:'')});
  if(prefs.dailyGoal>0){
   const progress=box.createEl('progress');progress.max=prefs.dailyGoal;progress.value=Math.min(words,prefs.dailyGoal);
  }
  box.createEl('button',{text:session?.active?lfMsg('Encerrar sessão','End session'):lfMsg('Iniciar sessão','Start session')}).addEventListener('click',()=>session?.active?this.stopWritingSession(project):this.startWritingSession(project));
  box.createEl('p',{text:lfMsg("Contagem baseada nos arquivos salvos durante a sessão. Alterações fora do Obsidian podem não ser contabilizadas.","Counts reflect files saved during this session. Changes outside Obsidian may not be counted.")});
 }
 async drawStats(panel,project,token){
  const scenes=project.format==='single'?[project.file]:this.activeScenes(project).map(x=>this.resolveScene(project,x.title)).filter(Boolean);
  const box=panel.createDiv({cls:'writer-project-progress'});
  let total=0;
  for(const f of scenes){
   if(token!==this.renderToken)return;
   try{total+=lfWordCount(await this.app.vault.cachedRead(f));}catch(_){}
  }
  if(token!==this.renderToken)return;
  const prefs=this.prefs(project);
  box.createEl('strong',{text:'Total: '+total.toLocaleString('pt-BR')+lfMsg(' palavras',' words')});
  if(prefs.goal>0){
   const percent=Math.min(100,Math.round(100*total/prefs.goal));
   box.createEl('p',{text:percent+'% da meta de '+prefs.goal+lfMsg(' palavras',' words')});
   const progress=box.createEl('progress');progress.max=prefs.goal;progress.value=Math.min(total,prefs.goal);
  }
 }

 taskOptions(){
  const defaults={autoSort:true,hideCompleted:false,showDueDates:true,showTooltips:true};
  this.plugin.settings.longformTasksOptions={...defaults,...(this.plugin.settings.longformTasksOptions||{})};
  return this.plugin.settings.longformTasksOptions;
 }
 taskState(project){
  const states=this.plugin.settings.longformTasks||(this.plugin.settings.longformTasks={});
  if(!states[project.file.path])states[project.file.path]={groups:[{name:'General',tasks:[]}],tasks:[]};
  return states[project.file.path];
 }
 async saveTaskState(){await this.plugin.saveSettings();this.render();}
 drawTasks(panel,project){
  const state=this.taskState(project),options=this.taskOptions();
  panel.addClass('writer-project-tasks');
  const h=panel.createDiv({cls:'writer-tasks-heading'});
  h.createEl('h3',{text:lfMsg('Tarefas do projeto','Project tasks')});
  const all=[...state.tasks,...state.groups.flatMap(g=>g.tasks)];
  h.createEl('small',{text:all.filter(t=>!t.done).length+' '+lfMsg('pendentes','open')+' · '+all.filter(t=>t.done).length+' '+lfMsg('concluídas','done')});
  const toolbar=panel.createDiv({cls:'writer-task-toolbar'});
  toolbar.createEl('button',{text:lfMsg('+ Tarefa','+ Task')}).addEventListener('click',()=>this.promptTask(project,null));
  toolbar.createEl('button',{text:lfMsg('+ Grupo','+ Group')}).addEventListener('click',()=>new TextPrompt(this.app,lfMsg('Novo grupo','New group'),async name=>{
   if(!name.trim())return;
   state.groups.push({name:name.trim(),tasks:[]});await this.saveTaskState();
  }).open());
  const drawList=(container,tasks,group)=>{
   const ordered=options.autoSort?[...tasks].sort((a,b)=>Number(a.done)-Number(b.done)||String(a.date||'').localeCompare(String(b.date||''))):tasks;
   for(const task of ordered){
    if(options.hideCompleted&&task.done)continue;
    const row=container.createDiv({cls:'writer-task-row'});
    const toggle=row.createEl('input',{type:'checkbox',attr:{'aria-label':lfMsg('Concluir tarefa','Complete task')}});
    toggle.checked=!!task.done;
    toggle.addEventListener('change',async()=>{task.done=toggle.checked;await this.saveTaskState();});
    const content=row.createDiv({cls:'writer-task-info'});
    const name=content.createEl('span',{text:task.name,cls:task.done?'is-done':''});
    name.addEventListener('click',()=>this.promptTask(project,group,task));
    if(task.date&&options.showDueDates)content.createEl('small',{text:task.date,cls:'writer-task-date'});
    if(task.page)content.createEl('button',{text:'↗ '+task.page,cls:'writer-task-link'}).addEventListener('click',()=>{
     const f=this.app.metadataCache.getFirstLinkpathDest(task.page,project.file.path);
     if(f instanceof TFile)this.openFile(f);
     else new Notice(lfMsg('Nota não encontrada','Note not found'));
    });
    row.createEl('button',{text:'⋯',cls:'writer-task-more'}).addEventListener('click',event=>{
     const menu=new Menu(this.app);
     menu.addItem(i=>i.setTitle(lfMsg('Editar','Edit')).setIcon('pencil').onClick(()=>this.promptTask(project,group,task)));
     menu.addItem(i=>i.setTitle(lfMsg('Excluir tarefa','Delete task')).setIcon('trash').onClick(async()=>{
      const items=group?group.tasks:state.tasks;
      const pos=items.indexOf(task);if(pos>=0)items.splice(pos,1);await this.saveTaskState();
     }));
     menu.showAtMouseEvent(event);
    });
   }
  };
  if(state.tasks.length){panel.createEl('h4',{text:lfMsg('Sem grupo','Ungrouped')});drawList(panel,state.tasks,null);}
  for(const group of [...state.groups].sort((a,b)=>options.autoSort?b.tasks.filter(x=>!x.done).length-a.tasks.filter(x=>!x.done).length:0)){
   const section=panel.createDiv({cls:'writer-task-group'});
   const top=section.createDiv({cls:'writer-task-group-header'});
   top.createEl('h4',{text:group.name});
   top.createEl('span',{text:String(group.tasks.filter(x=>!x.done).length),cls:'writer-task-count'});
   top.createEl('button',{text:'+',attr:{title:lfMsg('Adicionar tarefa','Add task')}}).addEventListener('click',()=>this.promptTask(project,group));
   top.createEl('button',{text:'⋯',attr:{title:lfMsg('Ações do grupo','Group actions')}}).addEventListener('click',e=>{
    const menu=new Menu(this.app);
    menu.addItem(i=>i.setTitle(lfMsg('Renomear grupo','Rename group')).setIcon('pencil').onClick(()=>new TextPrompt(this.app,lfMsg('Nome do grupo','Group name'),async name=>{if(name.trim()){group.name=name.trim();await this.saveTaskState();}},group.name).open()));
    menu.addItem(i=>i.setTitle(lfMsg('Excluir grupo e tarefas','Delete group and tasks')).setIcon('trash').onClick(async()=>{state.groups=state.groups.filter(x=>x!==group);await this.saveTaskState();}));
    menu.showAtMouseEvent(e);
   });
   drawList(section,group.tasks,group);
  }
 }
 promptTask(project,group,existing=null){
  const state=this.taskState(project),modal=new Modal(this.app);
  const values=existing?{...existing}:{name:'',date:'',page:'',done:false};
  modal.onOpen=()=>{
   modal.setTitle(existing?lfMsg('Editar tarefa','Edit task'):lfMsg('Nova tarefa','New task'));
   new Setting(modal.contentEl).setName(lfMsg('Descrição','Description')).addText(x=>x.setValue(values.name).onChange(v=>values.name=v));
   new Setting(modal.contentEl).setName(lfMsg('Prazo (AAAA-MM-DD)','Due (YYYY-MM-DD)')).addText(x=>x.setValue(values.date||'').onChange(v=>values.date=v));
   new Setting(modal.contentEl).setName(lfMsg('Nota vinculada (opcional)','Linked note (optional)')).addText(x=>x.setValue(values.page||'').onChange(v=>values.page=v));
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg(lfMsg("Salvar","Save"),'Save')).setCta().onClick(async()=>{
    if(!values.name.trim())return new Notice(lfMsg('Informe a tarefa','Enter a task'));
    if(values.date&&!/^\d{4}-\d{2}-\d{2}$/.test(values.date))return new Notice('YYYY-MM-DD');
    if(existing)Object.assign(existing,values);else (group?group.tasks:state.tasks).push(values);
    modal.close();await this.saveTaskState();
   }));
  };modal.open();
 }

}
module.exports={ProjectsView,PROJECT_VIEW,lfFlattenScenes,lfNestScenes,lfSceneTree,lfNumberScenes,lfWordCount};
