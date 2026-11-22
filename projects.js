'use strict';
const {ItemView,TFile,TFolder,Notice,Modal,Menu,Setting,FuzzySuggestModal,parseYaml,stringifyYaml,getLanguage,setIcon}=require('obsidian');
const PROJECT_VIEW='basic-ai-projects';
function getLocale(){
 const pick=value=>typeof value==='string'&&value.trim()?(/^pt(?:[-_]|$)/i.test(value.trim())?'pt':'en'):null;
 try{const locale=pick(getLanguage?.());if(locale)return locale;}catch(_){}
 try{const locale=pick(globalThis.window?.localStorage?.getItem('language'));if(locale)return locale;}catch(_){}
 return pick(globalThis.navigator?.language)||'en';
}
function lfMsg(pt,en){return getLocale()==='pt'?pt:en;}
const WRITER_DEFAULT_WORKFLOW='Padrão'; // Persistent key, independent of the displayed language.
function lfIconButton(parent,icon,label,extraClass=''){
 const button=parent.createEl('button',{cls:['writer-project-icon-action',extraClass].filter(Boolean).join(' '),
  attr:{type:'button',title:label,'aria-label':label}});
 const glyph=button.createSpan({cls:'writer-project-action-glyph',attr:{'aria-hidden':'true'}});
 setIcon?.(glyph,icon);
 return button;
}
function clean(value){
 const name=String(value??'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').trim().replace(/[. ]+$/,'');
 return /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³]) *(?:\.|$)/i.test(name)||['__proto__','constructor','prototype'].includes(name)?'':name;
}
function lfProjectSceneFolder(project,value=project.meta.sceneFolder){
 const base=lfPath(project.file.parent?.path||'');
 const relative=[];
 for(const segment of String(value||'').split('/')){
  if(!segment||segment==='.')continue;
  if(segment==='..'){if(!relative.length)return null;relative.pop();continue;}
  if(clean(segment)!==segment||!segment)return null;
  relative.push(segment);
 }
 return lfPath(base,...relative);
}
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
function lfSessionElapsed(session,now=Date.now()){
 if(!session)return 0;
 const segment=session.runningSince??(session.elapsedMs==null?session.startedAt:null);
 const end=session.pausedAt??session.stoppedAt??now;
 return (session.elapsedMs||0)+(segment==null?0:Math.max(0,end-segment));
}
function lfIgnoredScene(entries,file,folder){
 if(!Array.isArray(entries))return false;
 const relative=folder&&file.path.startsWith(folder+'/')?file.path.slice(folder.length+1):file.path;
 return entries.some(entry=>typeof entry==='string'&&[file.basename,file.path,relative,relative.replace(/\.md$/i,'')].includes(entry));
}
function lfMigrateProjectPaths(settings,oldPath,newPath){
 const data=settings.projectsData;
 if(!data||!oldPath||!newPath||oldPath===newPath)return false;
 const rename=path=>path===oldPath||path.startsWith(oldPath+'/')?newPath+path.slice(oldPath.length):path;
 let changed=false;
 for(const [path,prefs] of Object.entries(data)){
  if(!prefs||data[path]!==prefs)continue;
  const next=rename(path);
  if(next!==path){
   const existing=Object.hasOwn(data,next)?data[next]:null;
   if(existing&&existing!==prefs){
    const drafts={...existing.drafts,...prefs.drafts},workflows={...existing.workflows,...prefs.workflows};
    for(const [key,value] of Object.entries(existing))if(!Object.hasOwn(prefs,key))prefs[key]=value;
    if(Object.keys(drafts).length)prefs.drafts=drafts;
    if(Object.keys(workflows).length)prefs.workflows=workflows;
   }
   Object.defineProperty(data,next,{value:prefs,configurable:true,writable:true,enumerable:true});delete data[path];changed=true;
  }
  const session=prefs?.session;
  if(!session)continue;
  if(session.projectPath!==next){session.projectPath=next;changed=true;}
  for(const [file,count] of Object.entries(session.baseline||{})){
   const target=rename(file);if(target===file)continue;
   session.baseline[target]=count;delete session.baseline[file];changed=true;
  }
 }
 return changed;
}
function lfUnescape(s){return String(s||'').replace(/\\n/g,'\n').replace(/\\t/g,'\t');}
class ProjectsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.activeTab='scenes';this.selected=typeof plugin.settings?.lastLongformProject==='string'?plugin.settings.lastLongformProject:null;this.draft='Principal';this.workflow=WRITER_DEFAULT_WORKFLOW;this.renderToken=0;this.tabScrollPositions=Object.create(null);this.tabPanelScrollPositions=Object.create(null);this.tabGroup=null;}
 getViewType(){return PROJECT_VIEW;}
 getDisplayText(){return lfMsg('Projetos de escrita','Writing projects');}
 getIcon(){return 'notebook-pen';}
 async onOpen(){
  this.writerProjectClosed=false;
  this.root=this.contentEl.createDiv({cls:'writer-project-root'});
  const root=this.root;
  if(typeof MutationObserver==='function'&&typeof writerMarkCompactSettings==='function'){
   const options={childList:true,subtree:true};
   const observer=new MutationObserver(()=>{
    if(this.writerProjectClosed||this.root!==root)return;
    observer.disconnect();
    try{writerMarkCompactSettings(root);}finally{observer.observe(root,options);}
   });
   this.writerSettingsObserver=observer;
   observer.observe(root,options);
  }
  this.registerDomEvent?.(root,'wheel',event=>{
   const tabs=event.target?.closest?.('.writer-project-tabs');
   if(tabs&&root.contains(tabs)&&tabs.scrollWidth>tabs.clientWidth&&Math.abs(event.deltaY)>Math.abs(event.deltaX)){
    tabs.scrollLeft+=event.deltaY;event.preventDefault();
   }
  },{passive:false});
  this.registerEvent(this.app.vault.on('create',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('delete',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('rename',(file,oldPath)=>{
   if(oldPath&&file?.path){
    const saved=this.plugin.settings.lastLongformProject;
    const next=writerProjectRenamedPath(saved,oldPath,file.path);
    if(next!==saved){this.plugin.settings.lastLongformProject=next;void this.plugin.saveSettings();}
    this.lastSelected=writerProjectRenamedPath(this.lastSelected,oldPath,file.path);
    this.selected=writerProjectRenamedPath(this.selected,oldPath,file.path);
    const replay=new Set();
    for(const [key,job] of this.sessionUpdateJobs||[]){
     if(job.file.path===job.path&&job.session.projectPath===job.projectPath)continue;
     clearTimeout(job.timer);this.sessionUpdateJobs.delete(key);replay.add(job.file);
    }
    for(const pendingFile of replay)this.recordSessionChange(pendingFile);
   }
   this.queueRender();
  }));
  this.registerEvent(this.app.metadataCache.on('changed',file=>{
   const notes=this.currentProject&&this.notesRoot(this.currentProject)+'/';
   const changedScene=this.currentProject&&['scenes','board','structure','analytics'].includes(this.activeTab)
    &&this.activeScenes(this.currentProject).some(scene=>this.resolveScene(this.currentProject,scene.title)?.path===file?.path);
   if(file?.path===this.selected||(notes&&file?.path?.startsWith(notes)&&['notes','timeline'].includes(this.activeTab))||changedScene)this.queueRender();
  }));
  this.registerEvent(this.app.vault.on('modify',file=>{
   if(!(file instanceof TFile))return;
   this.recordSessionChange(file);
   if(this.activeTab==='project')void this.refreshProjectStats(file);
  }));
  if(this.registerInterval){this.sessionClock=setInterval(()=>this.refreshSessionClock(),1000);this.registerInterval(this.sessionClock);}
  await this.render();
 }
 queueRender(){if(this.writerProjectClosed)return;clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.render(),220);}
 async onClose(){this.writerProjectClosed=true;this.renderToken++;this.writerSettingsObserver?.disconnect();clearTimeout(this.refreshTimer);clearTimeout(this.sessionSaveTimer);if(this.sessionClock!=null)clearInterval(this.sessionClock);this.clearScenePickup();this.clearSessionJobs();await this.plugin.saveSettings();}
 indexes(){return this.app.vault.getMarkdownFiles().map(f=>longformIndex(f,this.app)).filter(Boolean);}
 async render(){
  const root=this.root;
  if(!root||this.writerProjectClosed)return;
  this.cancelSceneHold();
  if(this.scenePickup&&(this.scenePickup.path!==this.selected||this.scenePickup.draft!==this.draft||this.activeTab!=='scenes'))this.clearScenePickup();
  const token=++this.renderToken;
  const navigation=this.writerPanelNavigation;
  const isLatest=()=>!this.writerProjectClosed&&this.root===root&&token===this.renderToken&&this.writerPanelNavigation===navigation;
  const indexes=this.indexes();
  const active=this.app.workspace.getActiveFile();
  const activeProject=active&&indexes.find(p=>p.file.path===active.path);
  const staging=root.cloneNode(false);
  const top=staging.createDiv({cls:'writer-project-toolbar',attr:{role:'toolbar','aria-label':lfMsg('Ações dos projetos','Project actions')}});
  lfIconButton(top,'plus',lfMsg('Criar projeto','Create project'),'writer-project-create')
   .addEventListener('click',()=>this.promptNewProject());
  const selector=top.createEl('select',{attr:{'aria-label':lfMsg("Projeto","Project")}});
  for(const project of indexes){const option=selector.createEl('option',{text:project.title});option.value=project.file.path;}
  const mount=()=>{
   this.rememberPanelScroll(root);
   const previousTabs=root.querySelector('.writer-project-tabs');
   if(previousTabs&&this.tabGroup)this.tabScrollPositions[this.tabGroup]=previousTabs.scrollLeft;
   root.replaceChildren(...staging.childNodes);
   this.writerMountedProject=staging;
  };
  if(!indexes.length){
   staging.createEl('p',{text:lfMsg("Nenhum projeto encontrado. Crie um projeto ou selecione um índice Longform existente. Projetos Longform válidos são detectados automaticamente.","No projects found. Create one or select an existing Longform index. Valid Longform projects are detected automatically.")});
   if(isLatest()){mount();this.currentProject=null;this.projectPrefs=null;this.seriesMembershipValue=null;}
   return;
  }
  if(!indexes.some(x=>x.file.path===this.selected))writerProjectRemember(this,activeProject?.file.path||indexes[0].file.path);
  selector.value=this.selected;
  selector.addEventListener('change',()=>{writerProjectRemember(this,selector.value);this.render();});
  const project=indexes.find(x=>x.file.path===this.selected);
  selector.title=project.title;
  const projectPath=project.file.path;
  const isCurrent=()=>isLatest()&&this.selected===projectPath&&project.file.path===projectPath;
  if(project.format==='scenes'&&!project.scenes.length){
   try{const raw=await this.app.vault.cachedRead(project.file);
    if(!isCurrent())return;
    const fm=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
    const parsed=fm?parseYaml(fm[1]):null;
    if(Array.isArray(parsed?.longform?.scenes)&&parsed.longform.scenes.length){project.meta={...project.meta,...parsed.longform};project.scenes=parsed.longform.scenes;}
   }catch(e){if(!isCurrent())return;console.warn('[Basic AI] Could not read Longform index',e);}
  }
  if(!isCurrent())return;
  if(this.lastSelected!==projectPath){this.draft='Principal';this.workflowDraft=null;}
  this.lastSelected=projectPath;
  const projectPrefs=this.prefs(project);
  // Series stays below the selector, even when the viewport or tab changes.
  const seriesRow=staging.createDiv({cls:'writer-project-series-row'});
  const seriesField=seriesRow.createDiv({cls:'writer-project-series-field'});
  seriesField.createSpan({cls:'writer-project-series-label',text:lfMsg('Série','Series')});
  const membership=seriesField.createSpan({cls:'writer-project-series-value',attr:{'aria-live':'polite'}});
  this.refreshSeriesMembership(membership,projectPath);
  lfIconButton(seriesRow,'settings-2',lfMsg('Gerenciar séries de livros','Manage book series'),'writer-v7-stable-series-launch')
   .addEventListener('click',()=>writerV7SeriesOpen(this));
  const commit=()=>{
   mount();
   this.currentProject=project;this.projectPrefs=projectPrefs;this.seriesMembershipValue=membership;
  };
  if(!writerModuleOn(this.plugin,'projects')){
   staging.createEl('p',{text:lfMsg('Projetos ocultos. Reative em Configurações → Módulos.','Projects hidden. Enable in Settings → Modules.')});
   commit();return;
  }
  if(this.activeTab==='comments'&&!writerModuleOn(this.plugin,'comments'))this.activeTab='scenes';
   if(this.activeTab==='manuscript'&&this.plugin.settings?.v11Studio?.enabled===false)this.activeTab='scenes';
  const allTabs=[['scenes',lfMsg("Cenas","Scenes")],['manuscript',lfMsg('Escrita contínua','Continuous writing')],['project',lfMsg("Projeto","Project")],['compile',lfMsg("Compilar","Compile")],['notes',lfMsg("Compêndio","Compendium")],['timeline',lfMsg('Timeline','Timeline')],['board',lfMsg('Quadro','Board')],['structure',lfMsg('Estrutura','Structure')],['relations',lfMsg('Relações','Relationships')],['maps',lfMsg('Mapas','Maps')],['gallery',lfMsg('Galeria','Gallery')],['sessions',lfMsg('Sessões','Sessions')],['analytics',lfMsg('Análise','Analytics')],['tasks',lfMsg('Tarefas','Tasks')],['comments',lfMsg('Revisão','Review') ]].filter(([id])=>(id!=='manuscript'||this.plugin.settings?.v11Studio?.enabled!==false)&&(id!=='comments'||writerModuleOn(this.plugin,'comments'))&&(id!=='timeline'||this.plugin.settings.v7?.timeline!==false)
  &&(id!=='board'||this.plugin.settings.v7?.studioBoard!==false)
  &&(id!=='structure'||this.plugin.settings.v7?.rcPlotlines!==false||this.plugin.settings.v7?.rcBeats!==false||this.plugin.settings.v7?.rcPacing!==false||this.plugin.settings.v7?.stableDependencies!==false||this.plugin.settings.v7?.storyPlanning!==false)
  &&(id!=='relations'||this.plugin.settings.v7?.studioRelations!==false)
  &&(id!=='maps'||this.plugin.settings.v7?.studioMaps!==false)
  &&(id!=='analytics'||this.plugin.settings.v7?.studioAnalytics!==false)
  &&(id!=='gallery'||this.plugin.settings.v7?.studioGallery!==false)
  &&(id!=='sessions'||this.plugin.settings.v7?.studioSessions!==false));
  if(!allTabs.some(([id])=>id===this.activeTab))this.activeTab=allTabs[0]?.[0]||'scenes';
  const tabLucide={scenes:'clapperboard',manuscript:'book-open-text',project:'settings-2',compile:'file-output',notes:'library-big',timeline:'calendar-range',board:'columns-3',structure:'list-tree',relations:'git-branch',maps:'map',gallery:'images',sessions:'clock',analytics:'chart-no-axes-column',tasks:'list-check',comments:'message-circle'};
  const groupLucide={writing:'pen-line',world:'globe',management:'folder-kanban'};
  const menuGroups=[
   {id:'writing',pt:'Escrita',en:'Writing',tabs:['scenes','manuscript','board','structure','compile','analytics']},
   {id:'world',pt:'Universo',en:'World',tabs:['notes','timeline','relations','maps','gallery','sessions']},
   {id:'management',pt:'Projeto',en:'Project',tabs:['project','tasks','comments']}
  ];
  const activeGroup=menuGroups.find(g=>g.tabs.includes(this.activeTab))?.id||'writing';
  const groupNav=staging.createDiv({cls:'writer-project-nav-groups',attr:{role:'group','aria-label':lfMsg('Áreas do projeto','Project areas')}});
  const groupButtons={};
  const tabPrefix=this.writerTabPrefix??=('writer-project-'+(this.leaf?.id||Math.random().toString(36).slice(2)));
  const tabs=staging.createDiv({cls:'writer-project-tabs writer-sidebar-tabs',attr:{role:'tablist','aria-label':lfMsg('Seções do projeto','Project sections')}});
  if(typeof writerV136BindProjectTabs==='function')writerV136BindProjectTabs(tabs);
  const panels={};
  const tabButtons={};
  const lastTabs=this.writerLastGroupTabs??={};
  let rebuildingTabs=false;
  const canNavigate=()=>this.root===root&&this.writerMountedProject===staging&&!this.writerProjectClosed&&this.selected===projectPath&&project.file.path===projectPath;
  const openTab=id=>{
   this.rememberPanelScroll(root,this.activeTab);
   if(id!=='scenes')this.clearScenePickup();
   this.activeTab=id;
   const navigation=this.writerPanelNavigation=(this.writerPanelNavigation||0)+1;
   return ()=>canNavigate()&&this.writerPanelNavigation===navigation&&this.activeTab===id;
  };
  // Keep the tab strip mounted on regular tab changes. Only the selected panel
  // is redrawn, so horizontal scroll, focus and pointer position stay intact.
  const switchTab=id=>{
   if(!canNavigate()||this.activeTab===id)return;
   const isPanelCurrent=openTab(id);
   lastTabs[this.tabGroup]=id;
   for(const [key,button] of Object.entries(tabButtons)){
    const selected=key===id;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-selected',String(selected));
    if(selected)button.setAttribute('aria-current','true');else button.removeAttribute?.('aria-current');
    button.tabIndex=selected?0:-1;
   }
   for(const [key,panel] of Object.entries(panels)){
    panel.style.display=key===id?'block':'none';
    panel.setAttribute?.('aria-hidden',String(key!==id));
   }
   void this.renderProjectPanel(panels,project,isPanelCurrent,id)
    .catch(error=>console.error('[Basic AI] Could not render project tab',error));
  };
  const fillTabs=group=>{
   rebuildingTabs=true;
   tabs.empty();
   for(const key of Object.keys(tabButtons))delete tabButtons[key];
   for(const [id,name] of allTabs.filter(([id])=>menuGroups.find(g=>g.id===group)?.tabs.includes(id))){
    const selected=this.activeTab===id;
    const btn=tabs.createEl('button',{cls:selected?'is-active':'',
     attr:{type:'button',role:'tab',id:tabPrefix+'-tab-'+id,'aria-controls':tabPrefix+'-panel-'+id,
      title:name,'aria-label':name,'aria-selected':String(selected),...(selected?{'aria-current':'true'}:{}),tabindex:selected?'0':'-1'}});
    const glyph=btn.createSpan({cls:'writer-v901-nav-icon',attr:{'aria-hidden':'true'}});
    setIcon?.(glyph,tabLucide[id]||'file-text');
    btn.createSpan({cls:'writer-sidebar-tab-label',text:name});
    tabButtons[id]=btn;
    btn.addEventListener('click',()=>switchTab(id));
   }
   tabs.scrollLeft=Math.max(0,this.tabScrollPositions[group]||0);
   rebuildingTabs=false;
  };
  for(const group of menuGroups){
   const groupLabel=lfMsg(group.pt,group.en);
   const button=groupNav.createEl('button',{cls:activeGroup===group.id?'is-active':'',
    attr:{type:'button',title:groupLabel,'aria-label':groupLabel,'aria-pressed':String(activeGroup===group.id)}});
   const glyph=button.createSpan({cls:'writer-v901-nav-icon',attr:{'aria-hidden':'true'}});
   setIcon?.(glyph,groupLucide[group.id]||'folder');
   button.createSpan({cls:'writer-project-nav-label',text:groupLabel});
   groupButtons[group.id]=button;
   button.addEventListener('click',()=>{
    if(!canNavigate()||this.tabGroup===group.id)return;
    const available=allTabs.filter(([id])=>group.tabs.includes(id));
    if(!available.length)return;
    this.tabScrollPositions[this.tabGroup]=tabs.scrollLeft;
    lastTabs[this.tabGroup]=this.activeTab;
    this.tabGroup=group.id;
    const isPanelCurrent=openTab(available.find(([id])=>id===lastTabs[group.id])?.[0]||available[0][0]);
    for(const [key,b] of Object.entries(groupButtons)){
     const active=key===group.id;
     b.classList.toggle('is-active',active);
     b.setAttribute('aria-pressed',String(active));
    }
    fillTabs(group.id);
    for(const [key,panel] of Object.entries(panels)){
     panel.style.display=key===this.activeTab?'block':'none';
     panel.setAttribute?.('aria-hidden',String(key!==this.activeTab));
    }
    void this.renderProjectPanel(panels,project,isPanelCurrent,this.activeTab)
     .catch(error=>console.error('[Basic AI] Could not render project group',error));
   });
  }
  for(const [id] of allTabs){
   panels[id]=staging.createDiv({cls:'writer-project-panel',attr:{role:'tabpanel',id:tabPrefix+'-panel-'+id,'aria-labelledby':tabPrefix+'-tab-'+id,tabindex:'0'}});
   panels[id].setAttribute?.('data-tab',id);
   panels[id].setAttribute?.('data-project-path',projectPath);
   panels[id].setAttribute?.('aria-hidden',String(this.activeTab!==id));
   panels[id].style.display=this.activeTab===id?'block':'none';
  }
  tabs.addEventListener('scroll',()=>{
   if(!rebuildingTabs&&canNavigate()&&tabs.isConnected)this.tabScrollPositions[this.tabGroup]=tabs.scrollLeft;
  },{passive:true});
  fillTabs(activeGroup);
  const id=this.activeTab;
  await this.renderProjectPanel(panels,project,isCurrent,id);
  if(!isCurrent())return;
  const previousScroll=root.scrollTop;
  commit();
  this.tabGroup=activeGroup;
  tabs.scrollLeft=Math.max(0,this.tabScrollPositions[activeGroup]||0);
  this.restorePanelScroll(panels[id],projectPath,id);
  root.scrollTop=previousScroll;
  if(this.pendingSceneFocus?.path===project.file.path&&this.activeTab==='scenes'){
   const scene=this.pendingSceneFocus.title;this.pendingSceneFocus=null;
   const moved=[...(this.root.querySelectorAll?.('.writer-project-scene[data-scene-title]')||[])].find(el=>el.dataset.sceneTitle===scene);
   if(moved&&typeof moved.scrollIntoView==='function')moved.scrollIntoView({block:'nearest'});
  }
 }
 rememberPanelScroll(root,onlyTab){
  this.tabPanelScrollPositions??=Object.create(null);
  for(const element of root.querySelectorAll?.('.writer-project-panel[data-tab]')||[]){
   const {projectPath,tab}=element.dataset;
   if(!projectPath||!tab||(onlyTab?tab!==onlyTab:element.style.display==='none'))continue;
   const offsets=this.tabPanelScrollPositions[projectPath]??=Object.create(null);
   offsets[tab]=element.scrollTop;
  }
 }
 restorePanelScroll(panel,projectPath,id){
  if(panel?.isConnected)panel.scrollTop=Math.max(0,this.tabPanelScrollPositions?.[projectPath]?.[id]||0);
 }
 async renderProjectPanel(panels,project,isCurrent,id=this.activeTab){
  const panel=panels[id];
  if(!panel)return;
  panel.empty();
  if(id==='scenes')this.drawScenes(panel,project);
   else if(id==='manuscript'&&typeof writerV11RenderLongformTab==='function')writerV11RenderLongformTab(this,panel,project);
  else if(id==='project'){this.drawProject(panel,project);await this.drawStats(panel,project,isCurrent);}
  else if(id==='compile')this.drawCompile(panel,project);
  else if(id==='notes')await this.drawNotes(panel,project);
  else if(id==='timeline')writerV7RenderTimeline(this,panel,project);
  else if(id==='board')writerV7StudioRenderBoard(this,panel,project);
  else if(id==='structure')writerV7RCRenderStructure(this,panel,project);
  else if(id==='relations')writerV7StudioRenderGraph(this,panel,project);
  else if(id==='maps')writerV7StudioRenderMaps(this,panel,project);
  else if(id==='analytics')writerV7StudioRenderAnalytics(this,panel,project);
  else if(id==='gallery')writerV7StudioRenderGallery(this,panel,project);
  else if(id==='sessions')writerV7StudioRenderSessions(this,panel,project);
  else if(id==='tasks')this.drawTasks(panel,project);
  else if(id==='comments')this.plugin.writerV4Extras?.drawComments(panel,project,this);
  if(isCurrent())this.restorePanelScroll(panel,project.file.path,id);
 }
 refreshSeriesMembership(value=this.seriesMembershipValue,path=this.currentProject?.file.path){
  if(!value)return;
  const matches=writerV7SeriesForProject(this.plugin.settings,path);
  const name=matches.length?matches.map(item=>item.name).join(' · '):lfMsg('Sem série','No series');
  value.setText(name);
  value.setAttribute('title',name);
  value.setAttribute('aria-label',lfMsg('Série do livro: ','Book series: ')+name);
 }
 resolveScene(project,name){
  const base=project.file.parent?.path||'';
  const raw=String(project.meta.sceneFolder||'/').split('/').filter(Boolean).join('/');
  const folder=lfPath(base,raw);
  const exact=[lfPath(folder,name+'.md'),lfPath(folder,name),lfPath(base,name+'.md'),name+'.md',name];
  return exact.map(p=>this.app.vault.getAbstractFileByPath(p)).find(f=>f instanceof TFile)||null;
 }
 openFile(file){if(file instanceof TFile)this.app.workspace.getLeaf(false).openFile(file);}
 openSceneSearch(project){
  const draft=this.draft,projectPath=project.file.path;
  const items=(project.format==='single'?[{title:project.title,file:project.file}]:this.activeScenes(project,draft)
   .map(({title})=>({title,file:this.resolveScene(project,title)})).filter(item=>item.file));
  if(!items.length)return new Notice(lfMsg('Nenhuma cena disponível neste rascunho.','No scenes available in this draft.'));
  const view=this;
  const picker=new class extends FuzzySuggestModal{
   getItems(){return items;}
   getItemText(item){return item.title+' · '+item.file.path;}
   onChooseItem(item){
    if(view.writerProjectClosed||view.selected!==projectPath||view.draft!==draft)return;
    const file=project.format==='single'?project.file:view.resolveScene(project,item.title);
    if(file===item.file&&view.app.vault.getAbstractFileByPath(file.path)===file)view.openFile(file);
    else new Notice(lfMsg('A cena mudou. Abra a busca novamente.','The scene changed. Open the search again.'));
   }
  }(this.app);
  picker.setPlaceholder(lfMsg('Buscar cenas neste rascunho…','Find scenes in this draft…'));picker.open();
 }

 prefs(project){
  if(!this.plugin.settings.projectsData)this.plugin.settings.projectsData={};
  const key=project.file.path;
  return this.plugin.settings.projectsData[key]||(this.plugin.settings.projectsData[key]={drafts:{},goal:0});
 }
 async savePrefs(){await this.plugin.saveSettings();await this.render();}
 async backupIndex(project){
  const index=project.file,path=index.path;
  this.indexBackups??=new Map();
  if(this.indexBackups.has(path))return this.indexBackups.get(path);
  const pending=(async()=>{
   const text=await this.app.vault.read(index);
   if(index.path!==path)throw Error(lfMsg('O índice foi movido. Tente novamente.','The index was moved. Try again.'));
   return this.writeIndexBackup(project,text);
  })();
  this.indexBackups.set(path,pending);
  try{return await pending;}
  catch(error){if(this.indexBackups.get(path)===pending)this.indexBackups.delete(path);throw error;}
 }
 async writeIndexBackup(project,text,prefix=''){
  const indexPath=project.file.path,basename=clean(project.file.basename)||'Index';
  const dir=lfPath(project.file.parent?.path,'_Backups');
  await this.ensureFolder(dir);
  if(project.file.path!==indexPath)throw Error(lfMsg('O índice foi movido. Tente novamente.','The index was moved. Try again.'));
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const base=lfPath(dir,basename+' - '+prefix+stamp);
  let path=base+'.txt',n=2;
  while(this.app.vault.getAbstractFileByPath(path))path=base+' '+n+++'.txt';
  return this.app.vault.create(path,text);
 }
 latestIndexBackup(project){
  const folder=this.app.vault.getAbstractFileByPath(lfPath(project.file.parent?.path,'_Backups'));
  if(!(folder instanceof TFolder))return null;
  const prefix=(clean(project.file.basename)||'Index')+' - ';
  const timestamp=/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(?: \d+)?\.txt$/;
  return (folder.children||[]).filter(file=>file instanceof TFile&&file.name?.startsWith(prefix)&&timestamp.test(file.name.slice(prefix.length)))
   .sort((a,b)=>b.name.localeCompare(a.name,undefined,{numeric:true}))[0]||null;
 }
 async restoreIndexBackup(project,backup,indexPath,expected,text,backupPath=backup.path){
  const index=project.file,vault=this.app.vault;
  const changed=()=>Error(lfMsg('O índice ou o backup mudou. Abra a restauração novamente.','The index or backup changed. Open the restore action again.'));
  const verify=()=>{
   if(index.path!==indexPath||vault.getAbstractFileByPath(indexPath)!==index||backup.path!==backupPath||vault.getAbstractFileByPath(backupPath)!==backup)throw changed();
   if(writerActiveEditor(this.plugin,index))throw Error(lfMsg('Feche o índice no editor antes de restaurar.','Close the index in the editor before restoring it.'));
  };
  verify();
  if(await vault.read(backup)!==text||await vault.read(index)!==expected)throw changed();
  if(expected===text)return false;
  const safeguard=await this.writeIndexBackup(project,expected,'pre-restore - ');
  verify();
  if(await vault.read(backup)!==text)throw changed();
  await vault.process(index,current=>{verify();if(current!==expected)throw changed();return text;});
  this.indexBackups?.delete(indexPath);
  await this.render();return safeguard;
 }
 async confirmIndexRestore(project){
  try{
   const backup=this.latestIndexBackup(project),indexPath=project.file.path;
   if(!backup)return new Notice(lfMsg('Nenhum backup do índice encontrado.','No index backup found.'));
   const backupPath=backup.path;
   const [expected,text]=await Promise.all([this.app.vault.read(project.file),this.app.vault.read(backup)]);
   new ConfirmProjectAction(this.app,lfMsg('Restaurar backup do índice','Restore index backup'),
    lfMsg('Esta ação restaura o índice inteiro a partir de ','This restores the entire index from ')+backup.name+
     lfMsg('. O índice atual será guardado em _Backups. Nenhuma nota de cena será editada, movida ou apagada.','. The current index will be kept in _Backups. No scene note will be edited, moved, or deleted.'),async()=>{
     const safeguard=await this.restoreIndexBackup(project,backup,indexPath,expected,text,backupPath);
     new Notice(safeguard?lfMsg('Índice restaurado. Cópia anterior: ','Index restored. Previous copy: ')+safeguard.path:
      lfMsg('O índice já é idêntico ao backup.','The index already matches the backup.'));
    }).open();
  }catch(error){new Notice(error.message);}
 }
 async updateIndex(project,change){
  const path=project.file.path;
  await this.backupIndex(project);
  // Use Obsidian's safe frontmatter API. Its YAML serializer can normalize formatting
  // or discard YAML comments; backupIndex retains the original text.
  await this.app.fileManager.processFrontMatter(project.file,fm=>{
   if(project.file.path!==path)throw Error(lfMsg('O índice foi movido. Tente novamente.','The index was moved. Try again.'));
   if(!fm.longform||typeof fm.longform!=='object')fm.longform={};
   change(fm.longform);
  });
  await this.render();
 }
 sceneList(project){return lfFlattenScenes(project.scenes);}
 activeScenes(project,draft=this.draft){return draft==='Principal'?this.sceneList(project):(this.prefs(project).drafts?.[draft]||this.sceneList(project));}
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
   const name=clean(raw);
   try{
    if(!name)throw Error(lfMsg('Nome de cena inválido.','Invalid scene name.'));
    const dir=lfProjectSceneFolder(project);
    if(dir===null)throw Error(lfMsg('A pasta das cenas deve ficar dentro da pasta do projeto.','The scene folder must stay inside the project folder.'));
    const path=lfPath(dir,name+'.md');
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
  this.pendingSceneFocus={path:project.file.path,title:source};
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
 cancelSceneHold(){
  const hold=this.sceneHold;
  if(hold){clearTimeout(hold.timer);this.sceneHold=null;}
 }
 clearScenePickup(){
  this.cancelSceneHold();
  this.scenePickup=null;
  this.scenePickupNotice?.hide?.();this.scenePickupNotice=null;
  for(const row of this.root?.querySelectorAll?.('.writer-project-pickup')||[])row.removeClass('writer-project-pickup');
 }
 pickUpScene(project,draft,name,row){
  this.clearScenePickup();
  this.writerArcPickup=null;
  this.scenePickup={path:project.file.path,draft,source:name};
  row.addClass('writer-project-pickup');
  const message=lfMsg('Toque na alça de destino para mover o capítulo.','Tap the destination handle to move the chapter.');
  const doc=row.ownerDocument,fragment=doc.createDocumentFragment();
  const label=doc.createElement('span');label.textContent=message+' ';
  label.addEventListener('click',event=>event.stopPropagation());fragment.append(label);
  const cancel=doc.createElement('button');cancel.type='button';cancel.textContent=lfMsg('Cancelar','Cancel');
  cancel.addEventListener('click',event=>{event.stopPropagation();this.clearScenePickup();});
  fragment.append(cancel);this.scenePickupNotice=new Notice(fragment,0);
 }
 drawScenes(panel,project){
  const addReviewButton=parent=>{
   if(writerModuleOn(this.plugin,'comments'))lfIconButton(parent,'message-square-text',lfMsg('Fila de revisão','Review queue'))
    .addEventListener('click',()=>void this.plugin.openProjects('comments').catch(writerEditorialError));
  };
  if(project.format==='single'){
   panel.createEl('p',{text:lfMsg("Projeto de nota única.","Single-note project.")});
   panel.createEl('button',{text:lfMsg("Abrir texto","Open text")}).addEventListener('click',()=>this.openFile(project.file));
   addReviewButton(panel);
   return;
  }
  const prefs=this.prefs(project),draftBar=panel.createDiv({cls:'writer-project-notes-toolbar writer-project-draft-actions',
   attr:{role:'group','aria-label':lfMsg('Variantes e rascunhos','Variants and drafts')}});
  const linked=this.indexes().filter(x=>x.title===project.title&&x.file.path!==project.file.path);
  if(linked.length){
   const other=draftBar.createEl('select',{cls:'writer-project-linked-draft-select',
    attr:{'aria-label':lfMsg('Rascunhos Longform existentes','Existing Longform drafts')}});
   other.createEl('option',{text:lfMsg('Trocar para rascunho Longform...','Switch to Longform draft...'),value:''});
   for(const d of linked){const o=other.createEl('option',{text:d.draftTitle||d.file.basename});o.value=d.file.path;}
   other.addEventListener('change',()=>{if(other.value){this.draft='Principal';writerProjectRemember(this,other.value);this.render();}});
  }
  const select=draftBar.createEl('select',{attr:{'aria-label':lfMsg('Rascunho local','Local draft')}});
  const drafts=['Principal',...Object.keys(prefs.drafts||{})];
  if(!drafts.includes(this.draft))this.draft='Principal';
  for(const d of drafts){const o=select.createEl('option',{text:d==='Principal'?lfMsg('Principal','Main'):d});o.value=d;}select.value=this.draft;
  select.addEventListener('change',()=>{this.draft=select.value;this.render();});
  lfIconButton(draftBar,'git-branch-plus',lfMsg('Adicionar variante','Add variant')).addEventListener('click',()=>new TextPrompt(this.app,lfMsg('Nome da variante','Variant name'),async name=>{
   name=clean(name);if(!name||name==='Principal'||prefs.drafts[name])return;
   prefs.drafts[name]=JSON.parse(JSON.stringify(this.activeScenes(project)));
   this.draft=name;await this.savePrefs();
  }).open());
  if(this.draft!=='Principal')lfIconButton(draftBar,'trash-2',lfMsg('Excluir variante','Delete variant')).addEventListener('click',()=>{
   const draft=this.draft,original=prefs.drafts[draft];
   if(!original||draft==='Principal')return;
   new ConfirmProjectAction(this.app,lfMsg('Excluir variante','Delete variant'),
    lfMsg('Excluir a variante “','Delete the variant “')+draft+lfMsg('”? As notas das cenas serão mantidas.','”? The scene notes will be kept.'),async()=>{
     if(prefs.drafts[draft]!==original)return;
     delete prefs.drafts[draft];
     if((this.selected??this.currentProject?.file.path)===project.file.path&&this.draft===draft)this.draft='Principal';
     await this.savePrefs();
   }).open();
  });
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar writer-project-scene-actions-bar',
   attr:{role:'toolbar','aria-label':lfMsg('Ações de cenas','Scene actions')}});
  lfIconButton(toolbar,'file-plus',lfMsg('Adicionar cena','Add scene')).addEventListener('click',()=>this.addScene(project));
  lfIconButton(toolbar,'search',lfMsg('Buscar cena','Find scene')).addEventListener('click',()=>this.openSceneSearch(project));
  lfIconButton(toolbar,'notebook-pen',lfMsg('Novo rascunho Longform','New Longform draft')).addEventListener('click',()=>this.createLinkedDraft(project));
  addReviewButton(toolbar);
  const scenes=this.activeScenes(project),tree=lfSceneTree(scenes);
  const branches=new Set(),pending=[...tree];
  while(pending.length){
   const item=pending.pop();
   if(!item.children.length)continue;
   branches.add(item.title);
   for(const child of item.children)pending.push(child);
  }
  const allCollapsed=()=>branches.size>0&&[...branches].every(name=>prefs.v7CollapsedScenes?.[name]===true);
  const expand=allCollapsed();
  const toggle=lfIconButton(toolbar,expand?'chevrons-up-down':'chevrons-down-up',
   expand?lfMsg('Expandir tudo','Expand all'):lfMsg('Recolher tudo','Collapse all'),
   'writer-project-toggle-scenes');
  toggle.disabled=!branches.size;
  toggle.addEventListener('click',async()=>{
   if(toggle.disabled)return;
   const previous=prefs.v7CollapsedScenes;
   const next={...previous};
   const unfolding=allCollapsed();
   for(const name of branches){
    if(unfolding)delete next[name];
    else Object.defineProperty(next,name,{value:true,enumerable:true,configurable:true,writable:true});
   }
   const restoreFocus=toggle.ownerDocument?.activeElement===toggle;
   toggle.disabled=true;
   prefs.v7CollapsedScenes=next;
   try{await this.plugin.saveSettings();}
   catch(error){
    if(prefs.v7CollapsedScenes===next)prefs.v7CollapsedScenes=previous;
    new Notice(lfMsg('Não foi possível salvar o estado das cenas.','Could not save the scene state.'));
    toggle.disabled=false;
    if(restoreFocus)toggle.focus?.({preventScroll:true});
    return;
   }
   await this.render();
   if(restoreFocus&&this.currentProject?.file===project.file&&this.activeTab==='scenes'){
    const active=toggle.ownerDocument.activeElement;
    if(active===toggle||active===toggle.ownerDocument.body)
     this.root?.querySelector('.writer-project-toggle-scenes')?.focus({preventScroll:true});
   }
  });
  const renderItem=(item,parent,level=0)=>{
   const name=item.title;
   const row=parent.createDiv({cls:'writer-project-scene writer-project-scene-actions'});
   // The hierarchy is visualized inside the title, keeping drag and action
   // controls in fixed columns even on narrow Android sidebars.
   row.dataset.depth=String(level);
   row.dataset.sceneTitle=name;
   if(item.children?.length)row.addClass('writer-project-scene-has-children');
   row.draggable=false;
   const grip=row.createEl('button',{text:'⠿',cls:'writer-project-drag-handle',attr:{title:lfMsg('Arraste para mover ou toque e escolha o destino','Drag to reorder or tap and choose a destination'),'aria-label':lfMsg('Mover capítulo: ','Move chapter: ')+name}});
   grip.draggable=true;
   const path=project.file.path,draft=this.draft;
   const inScope=()=>!this.writerProjectClosed&&grip.isConnected&&this.selected===path&&this.draft===draft&&this.activeTab==='scenes';
   let consumeClick=false;
   const cancelHold=()=>{if(this.sceneHold?.grip===grip)this.cancelSceneHold();};
   grip.addEventListener('touchstart',event=>{
    const touch=event.touches?.[0];if(!touch)return;
    consumeClick=false;this.cancelSceneHold();
    const hold={grip,x:touch.clientX,y:touch.clientY,timer:null};this.sceneHold=hold;
    hold.timer=setTimeout(()=>{
     if(this.sceneHold!==hold)return;
     this.sceneHold=null;
     if(!inScope())return;
     consumeClick=true;this.pickUpScene(project,draft,name,row);
    },420);
   },{passive:true});
   grip.addEventListener('touchmove',event=>{
    const touch=event.touches?.[0],hold=this.sceneHold;
    if(touch&&hold?.grip===grip&&Math.hypot(touch.clientX-hold.x,touch.clientY-hold.y)>10)cancelHold();
   },{passive:true});
   for(const event of ['touchend','touchcancel'])grip.addEventListener(event,cancelHold,{passive:true});
   grip.addEventListener('click',event=>{
    if(consumeClick){consumeClick=false;event.preventDefault();return;}
    if(!inScope())return;
    const pickup=this.scenePickup;
    if(pickup?.path===path&&pickup.draft===draft){
     this.clearScenePickup();if(pickup.source!==name)void this.moveSceneRelative(project,pickup.source,name,false);
    }else this.pickUpScene(project,draft,name,row);
   });
   if(this.scenePickup?.source===name&&this.scenePickup.path===path&&this.scenePickup.draft===draft)row.addClass('writer-project-pickup');
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
   const titleButton=titleWrapper.createEl('button',{cls:'writer-project-scene-title',attr:{title:name,
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
     [lfMsg('Mover para cima','Move up'),'arrow-up',()=>this.moveScene(project,name,-1)],
     [lfMsg('Mover para baixo','Move down'),'arrow-down',()=>this.moveScene(project,name,1)],
     [lfMsg('Diminuir recuo','Decrease indent'),'arrow-left',()=>this.indentScene(project,name,-1)],
     [lfMsg('Aumentar recuo','Increase indent'),'arrow-right',()=>this.indentScene(project,name,1)],
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
  if(!scenes.length)panel.createEl('p',{text:lfMsg('Nenhuma cena cadastrada. Use o botão Adicionar cena.','No scenes yet. Use the Add scene button.')});
 }
 async createLinkedDraft(project){
  new TextPrompt(this.app,lfMsg('Nome do novo rascunho Longform','New Longform draft name'),async raw=>{
   const name=clean(raw);if(!name)return;
   const root=[project.file.parent?.path,lfMsg('Rascunhos','Drafts'),name].filter(Boolean).join('/');
   const path=[root,lfMsg('Índice.md','Index.md')].join('/');
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
  if(this.latestIndexBackup(project))panel.createEl('button',{text:lfMsg('Restaurar backup do índice','Restore index backup')})
   .addEventListener('click',()=>this.confirmIndexRestore(project));
  new Setting(panel).setName(lfMsg("Título do projeto","Project title")).addText(t=>t.setValue(project.title).onChange(v=>this.newTitle=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(()=>this.updateIndex(project,data=>{data.title=this.newTitle||project.title;})));
  let sceneFolder=project.meta.sceneFolder||'';
  new Setting(panel).setName(lfMsg("Pasta das cenas","Scene folder")).setDesc(lfMsg("Relativa à pasta do índice; não move arquivos existentes.","Relative to the index folder; does not move existing files.")).addText(t=>t.setValue(sceneFolder).onChange(v=>sceneFolder=v)).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).onClick(()=>{
   if(lfProjectSceneFolder(project,sceneFolder)===null)return new Notice(lfMsg('A pasta das cenas deve ficar dentro da pasta do projeto.','The scene folder must stay inside the project folder.'));
   return this.updateIndex(project,data=>{data.sceneFolder=sceneFolder;});
  }));
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
   ['strip-frontmatter',lfMsg('Remover propriedades YAML','Remove YAML properties'),'both'],
   ['remove-links',lfMsg('Remover links','Remove links'),'both'],
   ['remove-comments',lfMsg('Remover comentários','Remove comments'),'both'],
   ['remove-strikethroughs',lfMsg('Remover trechos riscados','Remove strikethrough passages'),'both'],
   ['prepend-title',lfMsg('Adicionar títulos','Add titles'),'scene'],
   ['concatenate-text',lfMsg('Juntar cenas','Join scenes'),'join'],
   ['add-frontmatter',lfMsg('Adicionar propriedades YAML','Add YAML properties'),'manuscript'],
   ['write-to-note',lfMsg('Salvar como nota','Save as note'),'manuscript']
  ];
 }
 defaultWorkflow(){
  return {name:WRITER_DEFAULT_WORKFLOW,description:lfMsg('Compilação compatível com etapas Longform','Compilation compatible with Longform steps'),steps:[
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
   prefs.workflows={[WRITER_DEFAULT_WORKFLOW]:standard};
   for(const [name,options] of Object.entries(legacy)){
    if(!options||typeof options!=='object'||Array.isArray(options.steps))continue;
    const steps=JSON.parse(JSON.stringify(standard.steps));
    if(options.frontmatter===false)steps.splice(steps.findIndex(x=>x.id==='strip-frontmatter'),1);
    const links=steps.find(x=>x.id==='remove-links');
    if(options.links===false&&links)links.optionValues={'remove-wikilinks':false,'remove-external-links':false};
    const join=steps.find(x=>x.id==='concatenate-text');if(join&&options.separator!=null)join.optionValues.separator=options.separator;
    Object.defineProperty(prefs.workflows,name,{value:{name,steps,description:lfMsg('Importado da configuração anterior','Imported from previous settings')},enumerable:true,configurable:true,writable:true});
   }
  }
  return prefs.workflows;
 }
 async renameWorkflow(project,previous,raw){
  const workflows=this.workflowsFor(project),name=clean(raw);
  if(!name)throw Error(lfMsg('Nome de workflow inválido.','Invalid workflow name.'));
  if(previous===WRITER_DEFAULT_WORKFLOW)throw Error(lfMsg('O workflow padrão não pode ser renomeado.','The default workflow cannot be renamed.'));
  const original=Object.hasOwn(workflows,previous)?workflows[previous]:null;
  if(!original)throw Error(lfMsg('O workflow não existe mais.','The workflow no longer exists.'));
  if(name===previous)return previous;
  if(Object.keys(workflows).some(key=>key.normalize('NFC').toLowerCase()===name.normalize('NFC').toLowerCase()&&key!==previous)){
   throw Error(lfMsg('Já existe um workflow com esse nome.','A workflow with this name already exists.'));
  }
  const next={...original,name};
  workflows[name]=next;delete workflows[previous];
  try{await this.plugin.saveSettings();}
  catch(error){
   if(workflows[name]===next&&!Object.hasOwn(workflows,previous)){delete workflows[name];workflows[previous]=original;}
   throw error;
  }
  return name;
 }
 workflowJSON(name,wf){
  return JSON.stringify({workflows:{[name]:{...wf,name}}},null,2)+'\n';
 }
 importWorkflowEntries(project,entries,prefix=''){
  const dest=this.workflowsFor(project);let count=0;
  const used=new Set(Object.keys(dest).map(key=>key.normalize('NFC').toLowerCase()));
  for(const [key,wf] of Object.entries(entries)){
   if(!Array.isArray(wf?.steps)||wf.steps.some(step=>!step||typeof step.id!=='string'))continue;
   const base=clean((prefix+key).slice(0,90))||lfMsg('Workflow importado','Imported workflow');
   let name=base,n=2;
   while(used.has(name.normalize('NFC').toLowerCase()))name=base+' '+n++;
   used.add(name.normalize('NFC').toLowerCase());
   dest[name]=JSON.parse(JSON.stringify({...wf,name}));count++;
  }
  return count;
 }
 exportWorkflowJSON(name,wf){
  const modal=new Modal(this.app),json=this.workflowJSON(name,wf);
  modal.setTitle(lfMsg('Exportar workflow (JSON)','Export workflow (JSON)'));
  modal.contentEl.createEl('p',{text:lfMsg('Inclui as etapas e opções atuais, mesmo antes de salvar o workflow.','Includes the current steps and options, even before saving the workflow.')});
  const area=modal.contentEl.createEl('textarea',{cls:'writer-project-compile-preview',attr:{rows:'12','aria-label':lfMsg('JSON do workflow','Workflow JSON')}});
  area.readOnly=true;area.value=json;
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg('Copiar JSON','Copy JSON')).setCta().onClick(async()=>{
   try{await area.ownerDocument.defaultView.navigator.clipboard.writeText(json);new Notice(lfMsg('JSON copiado.','JSON copied.'));}
   catch(_){area.focus();area.select();new Notice(lfMsg('O texto foi selecionado. Copie pelo menu do sistema.','The text is selected. Copy it using the system menu.'));}
  }));
  modal.open();
 }
 validateWorkflow(project,wf){
  if(!wf||!Array.isArray(wf.steps)||!wf.steps.length)throw Error(lfMsg('Workflow sem etapas.','Workflow has no steps.'));
  const catalog=new Map(this.workflowCatalog().map(([id,,kind])=>[id,kind]));
  let joined=project.format==='single';
  let saves=0;
  for(let i=0;i<wf.steps.length;i++){
   const id=wf.steps[i]?.id,kind=catalog.get(id);
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
  const dir=lfProjectSceneFolder(project);
  const folder=dir===null?null:this.app.vault.getAbstractFileByPath(dir||'/');
  const existing=folder instanceof TFolder?folder.children.filter(x=>x instanceof TFile&&x.extension==='md'&&x.path!==project.file.path):[];
  const trackedPaths=new Set([...tracked].map(title=>this.resolveScene(project,title)?.path).filter(Boolean));
  const ignored=Array.isArray(project.meta.ignoredFiles)?project.meta.ignoredFiles:[];
  const unknown=existing.filter(f=>!trackedPaths.has(f.path)&&!lfIgnoredScene(ignored,f,dir));
  const missing=[...tracked].filter(name=>!this.resolveScene(project,name));
  const section=panel.createEl('details',{cls:'writer-project-diagnostics'});
  section.createEl('summary',{text:lfMsg("Diagnóstico · ","Diagnostics · ")+missing.length+lfMsg(' cenas ausentes, ',' missing scenes, ')+unknown.length+lfMsg(' arquivos soltos',' unindexed files')});
  if(missing.length)section.createEl('p',{text:lfMsg('Ausentes: ','Missing: ')+missing.join(', ')});
  if(unknown.length){
   for(const file of unknown){
    const row=section.createDiv({cls:'writer-project-notes-toolbar'});
    row.createSpan({text:file.basename});
    lfIconButton(row,'ellipsis',lfMsg('Ações para ','Actions for ')+file.basename).addEventListener('click',event=>{
     const path=file.path;
     const menu=new Menu();
     menu.addItem(item=>item.setTitle(lfMsg('Ignorar este arquivo','Ignore this file')).setIcon('eye-off').onClick(()=>{
      void this.updateIndex(project,data=>{
       if(this.app.vault.getAbstractFileByPath(path)!==file||file.path!==path)return;
       const entries=Array.isArray(data.ignoredFiles)?data.ignoredFiles:[];
       if(!lfIgnoredScene(entries,file,dir))data.ignoredFiles=[...entries,file.basename];
      }).catch(error=>new Notice(error.message));
     }));
     menu.showAtMouseEvent(event);
    });
   }
   section.createEl('button',{text:lfMsg("Adicionar arquivos soltos ao índice","Add unindexed files")}).addEventListener('click',()=>{
    new ConfirmProjectAction(this.app,lfMsg('Adicionar arquivos ao índice','Add files to index'),
     lfMsg('Adicionar ','Add ')+unknown.length+lfMsg(' arquivo(s) Markdown como cenas ao final do índice? Nenhum arquivo será movido.',' Markdown file(s) as scenes to the end of the index? No files will be moved.'),
     ()=>this.updateIndex(project,data=>{
      const scenes=lfFlattenScenes(data.scenes||[]),paths=new Set(scenes.map(scene=>this.resolveScene(project,scene.title)?.path).filter(Boolean));
      for(const f of unknown){
       if(paths.has(f.path)||lfIgnoredScene(data.ignoredFiles,f,dir)||this.app.vault.getAbstractFileByPath(f.path)!==f)continue;
       if(lfPath(dir,f.basename+'.md')!==f.path)continue;
       scenes.push({title:f.basename,indent:0});paths.add(f.path);
      }
      data.scenes=lfNestScenes(scenes);
     })
    ).open();
   });
  }
  if(ignored.length){
   section.createEl('p',{text:lfMsg('Ignorados no índice:','Ignored in the index:')});
   for(const name of new Set(ignored.filter(item=>typeof item==='string'&&item))){
    const row=section.createDiv({cls:'writer-project-notes-toolbar'});
    row.createSpan({text:name});
    row.createEl('button',{text:lfMsg('Voltar a mostrar','Show again'),attr:{type:'button','aria-label':lfMsg('Voltar a mostrar ','Show again ')+name}}).addEventListener('click',()=>{
     void this.updateIndex(project,data=>{
      if(Array.isArray(data.ignoredFiles))data.ignoredFiles=data.ignoredFiles.filter(item=>item!==name);
     }).catch(error=>new Notice(error.message));
    });
   }
  }
 }
 compileOutputPath(project,wf){
  const step=wf.steps.find(item=>item.id==='write-to-note');
  const target=String(step?.optionValues?.target||'manuscript.md').replace(/\$1/g,clean(project.title)).trim();
  const parts=target.split('/');
  const relative=parts.map(clean);
  if(parts.some(part=>!part||part==='..'||part==='.')||target.includes('\\')||
   relative.some(part=>!part)||relative.at(-1).toLowerCase()==='.md'){
   throw Error(lfMsg('Caminho de saída inválido.','Invalid output path.'));
  }
  if(!/\.md$/i.test(relative.at(-1)))relative[relative.length-1]+='.md';
  return lfPath(project.file.parent?.path,...relative);
 }
 assertCompileOutput(project,path,sourcePaths,allProjects=false){
  const normalized=path.normalize('NFC').toLowerCase();
  const protectedPath=target=>target?.normalize('NFC').toLowerCase()===normalized;
  const error=()=>Error(lfMsg('A saída não pode sobrescrever um índice ou uma cena.','The output cannot overwrite an index or a scene.'));
  if(protectedPath(project.file.path)||[...sourcePaths].some(protectedPath))throw error();
  if(!allProjects)return;
  const projects=[project,...this.indexes().filter(item=>item.file.path!==project.file.path)];
  for(const item of projects){
   if(protectedPath(item.file.path))throw error();
   const drafts=this.plugin.settings.projectsData?.[item.file.path]?.drafts||{};
   const all=[...this.sceneList(item),...Object.values(drafts).filter(Array.isArray).flat()];
   if(all.some(scene=>typeof scene?.title==='string'&&protectedPath(this.resolveScene(item,scene.title)?.path)))throw error();
  }
 }
 async replaceCompiledManuscript(project,path,expectedFile,expectedText,manuscript,sourcePaths){
  const vault=this.app.vault;
  const changed=()=>Error(lfMsg('O destino mudou. Confira e compile novamente.','The destination changed. Review it and compile again.'));
  const verify=()=>{
   if(vault.getAbstractFileByPath(path)!==expectedFile||expectedFile.path!==path)throw changed();
   this.assertCompileOutput(project,path,sourcePaths,true);
   if(writerActiveEditor(this.plugin,expectedFile))throw Error(lfMsg(
    'Feche o manuscrito no editor antes de substituir.','Close the manuscript in the editor before replacing it.'));
  };
  verify();
  const previous=await vault.read(expectedFile);
  if(previous!==expectedText)throw changed();
  const folder=lfPath(project.file.parent?.path,'_Backups','Manuscripts');
  await this.ensureFolder(folder);
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const basename=clean(expectedFile.basename)||'manuscript';
  const prefix=folder+'/'+basename+' - '+stamp;
  let backupPath=prefix+'.txt',n=2;
  while(vault.getAbstractFileByPath(backupPath))backupPath=prefix+' '+n+++'.txt';
  const backup=await vault.create(backupPath,previous);
  verify();
  await vault.process(expectedFile,current=>{
   if(vault.getAbstractFileByPath(path)!==expectedFile||expectedFile.path!==path||current!==previous||writerActiveEditor(this.plugin,expectedFile))throw changed();
   this.assertCompileOutput(project,path,sourcePaths,true);
   return manuscript;
  });
  return backup;
 }
 async compileProject(project,wf,preview=false,{draft=this.draft,replacement=null}={}){
  this.validateWorkflow(project,wf);
  const originalProjectPath=project.file.path;
  const outputPath=preview?null:this.compileOutputPath(project,wf);
  const flat=lfNumberScenes(project.format==='single'?[{title:project.title,indent:0}]:this.activeScenes(project,draft));
  const sourcePaths=new Set();
  let scenes=[];
  for(const entry of flat){
   const file=project.format==='single'?project.file:this.resolveScene(project,entry.title);
   if(!(file instanceof TFile))throw Error(lfMsg('Cena ausente: ','Missing scene: ')+entry.title);
   sourcePaths.add(file.path);
   const contents=await this.app.vault.read(file);
   sourcePaths.add(file.path);
   scenes.push({title:entry.title,indent:entry.indent,numbering:entry.numbering,contents});
  }
  let manuscript=null,openAfter=true;
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
    openAfter=o['open-after']!==false;
   }
  }
  if(manuscript===null)manuscript=scenes.map(x=>x.contents.trim()).join('\n\n');
  if(preview)return {contents:manuscript};
  if(project.file.path!==originalProjectPath)throw Error(lfMsg('O índice foi movido. Compile novamente.','The index was moved. Compile again.'));
  let path=outputPath;
  this.assertCompileOutput(project,path,sourcePaths);
  if(replacement){
   const {file,text}=replacement;
   const backup=await this.replaceCompiledManuscript(project,path,file,text,manuscript+'\n',sourcePaths);
   if(openAfter)this.openFile(file);
   return {contents:manuscript,file,backup};
  }
  const basename=path.replace(/\.md$/i,'');let n=2;
  while(this.app.vault.getAbstractFileByPath(path))path=basename+' '+n+++'.md';
  const parent=path.split('/').slice(0,-1).join('/');if(parent)await this.ensureFolder(parent);
  const file=await this.app.vault.create(path,manuscript+'\n');
  if(openAfter)this.openFile(file);
  return {contents:manuscript,file};
 }
 async chooseCompileOutput(project,workflow,status){
  const wf=JSON.parse(JSON.stringify(workflow)),draft=this.draft,projectPath=project.file.path;
  const run=async(replacement=null)=>{
   try{
    if(project.file.path!==projectPath)throw Error(lfMsg('O índice foi movido. Compile novamente.','The index was moved. Compile again.'));
    const result=await this.compileProject(project,wf,false,{draft,replacement});
    status.setText(result.backup?
     lfMsg('Substituído: ','Replaced: ')+result.file.path+lfMsg(' · Backup: ',' · Backup: ')+result.backup.path:
     lfMsg('Criado: ','Created: ')+result.file.path);
    new Notice(result.backup?lfMsg('Manuscrito substituído. Backup criado.','Manuscript replaced. Backup created.'):
     lfMsg('Manuscrito criado sem sobrescrever o original.','Manuscript created without overwriting the original.'));
   }catch(e){new Notice(lfMsg('Falha na compilação: ','Compilation failed: ')+e.message,8000);}
  };
  try{
   this.validateWorkflow(project,wf);
   const path=this.compileOutputPath(project,wf),vault=this.app.vault;
   const existing=vault.getAbstractFileByPath(path);
   if(!(existing instanceof TFile))return await run();
   const text=await vault.read(existing);
   const modal=new Modal(this.app);
   modal.setTitle(lfMsg('Compilar manuscrito','Compile manuscript'));
   modal.contentEl.createEl('p',{text:lfMsg('Já existe um arquivo neste destino.','A file already exists at this destination.')});
   modal.contentEl.createEl('p',{text:path});
   modal.contentEl.createEl('p',{text:lfMsg('Substituir guarda o conteúdo anterior em _Backups/Manuscripts.','Replacing keeps the previous content in _Backups/Manuscripts.')});
   new Setting(modal.contentEl)
    .addButton(b=>b.setButtonText(lfMsg('Cancelar','Cancel')).onClick(()=>modal.close()))
    .addButton(b=>b.setButtonText(lfMsg('Criar novo','Create new')).setCta().onClick(()=>{modal.close();return run();}))
    .addButton(b=>b.setButtonText(lfMsg('Substituir com backup','Replace with backup')).setWarning().onClick(()=>{
     modal.close();return run({file:existing,text});
    }));
   modal.open();
  }catch(e){new Notice(lfMsg('Falha na compilação: ','Compilation failed: ')+e.message,8000);}
 }
 async importLongformWorkflows(project){
  try{
   const installed=this.app.plugins?.plugins?.longform;
   if(!installed?.loadData)throw Error(lfMsg('O Longform não está instalado ou ativo; use a importação por JSON.','Longform is not installed or active; use JSON import.'));
   const data=await installed.loadData(),entries=data?.workflows;
   if(!entries||typeof entries!=='object')throw Error(lfMsg('Nenhum workflow encontrado no Longform.','No workflows found in Longform.'));
   const count=this.importWorkflowEntries(project,entries,'Longform · ');
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
     const count=this.importWorkflowEntries(project,input);
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
  if(!Object.hasOwn(workflows,this.workflow))this.workflow=Object.keys(workflows)[0];
  const bar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const selector=bar.createEl('select',{attr:{'aria-label':'Workflow'}});
  for(const name of Object.keys(workflows)){const opt=selector.createEl('option',{text:name===WRITER_DEFAULT_WORKFLOW?lfMsg('Padrão','Default'):name});opt.value=name;}
  selector.value=this.workflow;
  const workflowName=this.workflow;
  selector.addEventListener('change',()=>{this.workflow=selector.value;this.workflowDraft=null;this.render();});
  bar.createEl('button',{text:'+ Workflow'}).addEventListener('click',()=>new TextPrompt(this.app,lfMsg('Nome do workflow','Workflow name'),async name=>{
   name=clean(name);
   if(!name)return new Notice(lfMsg('Nome de workflow inválido.','Invalid workflow name.'));
   if(Object.keys(workflows).some(key=>key.normalize('NFC').toLowerCase()===name.normalize('NFC').toLowerCase())){
    return new Notice(lfMsg('Já existe um workflow com esse nome.','A workflow with this name already exists.'));
   }
   if(!Object.hasOwn(workflows,workflowName))return;
   const next=JSON.parse(JSON.stringify({...workflows[workflowName],name}));
   workflows[name]=next;
   try{await this.plugin.saveSettings();}
   catch(error){if(workflows[name]===next)delete workflows[name];return new Notice(error.message);}
   if(this.selected===project.file.path&&this.workflow===workflowName){this.workflow=name;this.workflowDraft=null;await this.render();}
  }).open());
  bar.createEl('button',{text:lfMsg('Importar Longform','Import from Longform')}).addEventListener('click',()=>this.importLongformWorkflows(project));
  bar.createEl('button',{text:lfMsg('Importar JSON','Import JSON')}).addEventListener('click',()=>this.importWorkflowJSON(project));
  const wf=this.workflowDraft&&this.workflowDraftName===workflowName?this.workflowDraft:
   (this.workflowDraft=JSON.parse(JSON.stringify(workflows[workflowName])),this.workflowDraftName=workflowName,this.workflowDraft);
  if(workflowName!==WRITER_DEFAULT_WORKFLOW){
   bar.createEl('button',{text:lfMsg('Renomear workflow','Rename workflow')}).addEventListener('click',()=>{
    new TextPrompt(this.app,lfMsg('Novo nome do workflow','New workflow name'),async raw=>{
     try{
      const name=await this.renameWorkflow(project,workflowName,raw);
      if(this.selected===project.file.path&&this.workflow===workflowName){
       this.workflow=name;this.workflowDraftName=name;this.workflowDraft={...wf,name};await this.render();
      }
     }catch(error){new Notice(error.message);}
    },workflowName).open();
   });
  }
  bar.createEl('button',{text:lfMsg('Exportar JSON','Export JSON')}).addEventListener('click',()=>this.exportWorkflowJSON(workflowName,wf));
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
   if(!Object.hasOwn(workflows,workflowName))return;
   workflows[workflowName]=JSON.parse(JSON.stringify({...wf,name:workflowName}));await this.plugin.saveSettings();status.setText(lfMsg('Workflow salvo.','Workflow saved.'));
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
  add.createEl('button',{text:lfMsg("Compilar","Compile"),cls:'mod-cta'})
   .addEventListener('click',()=>this.chooseCompileOutput(project,wf,status));
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
   const name=clean(raw);if(!name)return new Notice(lfMsg('Nome inválido.','Invalid name.'));
   try{await this.ensureFolder(dir);const path=dir+'/'+name+'.md';
    if(this.app.vault.getAbstractFileByPath(path))throw Error(lfMsg('Já existe uma nota com esse nome.','A note with this name already exists.'));
    const file=await this.app.vault.create(path,'');this.openFile(file);await this.render();
   }catch(e){new Notice(e.message);}
  }).open();
 }
 renameProjectItem(item){
  new TextPrompt(this.app,lfMsg('Novo nome','New name'),async raw=>{
   const name=clean(raw);if(!name)return new Notice(lfMsg('Nome inválido.','Invalid name.'));
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
   new Setting(modal.contentEl).setName(lfMsg('Nome','Name')).addText(t=>t.setPlaceholder(lfMsg('Meu livro','My book')).onChange(v=>title=v));
   new Setting(modal.contentEl).setName(lfMsg('Pasta no cofre','Vault folder')).setDesc(lfMsg('Caminho relativo ao cofre','Path relative to the vault')).addText(t=>t.setValue(parent).onChange(v=>parent=v));
   new Setting(modal.contentEl).setName(lfMsg('Tipo','Type')).addDropdown(d=>d.addOption('scenes',lfMsg('Várias cenas','Multiple scenes')).addOption('single',lfMsg('Nota única','Single note')).onChange(v=>format=v));
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg("Criar projeto","Create project")).setCta().onClick(async()=>{
    try{
     title=clean(title);if(!title)throw Error(lfMsg('Informe o nome do projeto.','Enter a project name.'));
     if(parent.startsWith('/')||parent.split('/').includes('..'))throw Error(lfMsg('Pasta inválida.','Invalid folder.'));
     const dir=[parent,clean(title)].filter(Boolean).join('/');
     const path=dir+'/'+(format==='scenes'?lfMsg('Índice.md','Index.md'):title+'.md');
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
  const prefs=this.prefs(project),baseline=Object.create(null);
  const projectPath=project.file.path,today=new Date().toDateString();
  const previous=prefs.session;
  if(previous?.active&&previous.day===today)return;
  const files=project.format==='single'?[project.file]:this.activeScenes(project).map(x=>this.resolveScene(project,x.title)).filter(Boolean);
  for(const file of files){try{const words=lfWordCount(await this.app.vault.cachedRead(file));baseline[file.path]=words;}catch(_){}}
  if(this.writerProjectClosed||project.file.path!==projectPath||prefs.session!==previous)return;
  const now=Date.now(),sameDay=previous?.day===today;
  prefs.session={active:true,projectPath,startedAt:now,runningSince:now,elapsedMs:sameDay?lfSessionElapsed(previous):0,day:today,
   words:sameDay?previous.words||0:0,baseline,notified:sameDay&&previous.notified};
  await this.plugin.saveSettings();await this.render();
 }
 clearSessionJobs(session){
  for(const [key,job] of this.sessionUpdateJobs||[]){
   if(session&&job.session!==session)continue;
   clearTimeout(job.timer);
   this.sessionUpdateJobs.delete(key);
  }
 }
 applySessionCount(prefs,session,path,words){
  if(!Object.hasOwn(session.baseline,path))return;
  const before=session.baseline[path];
  session.baseline[path]=words;
  session.words=Math.max(0,(session.words||0)+words-before);
  if(prefs.dailyGoal>0&&session.words>=prefs.dailyGoal&&!session.notified){
   session.notified=true;new Notice(lfMsg("Meta diária de escrita atingida!","Daily writing goal reached!"));
  }
 }
 async flushSessionChanges(prefs,session){
  // Count queued saves once, including jobs already waiting for an async read.
  const pending=[...(this.sessionUpdateJobs?.values()||[])].filter(job=>job.session===session);
  this.clearSessionJobs(session);
  for(const {file,path} of pending){
   try{
    const words=lfWordCount(await this.app.vault.cachedRead(file));
    if(!this.writerProjectClosed&&prefs.session===session&&file.path===path)this.applySessionCount(prefs,session,path,words);
   }catch(e){console.warn('[Basic AI] Session tracking:',e);}
  }
 }
 async pauseWritingSession(project){
  const prefs=this.prefs(project),session=prefs.session;
  if(!session?.active||session.pausedAt!=null)return;
  const now=Date.now();
  session.elapsedMs=lfSessionElapsed(session,now);session.runningSince=null;session.pausedAt=now;
  await this.flushSessionChanges(prefs,session);
  await this.plugin.saveSettings();await this.render();
 }
 async resumeWritingSession(project){
  const prefs=this.prefs(project),session=prefs.session;
  if(!session?.active||session.pausedAt==null)return;
  if(session.day!==new Date().toDateString())return this.startWritingSession(project);
  const pausedAt=session.pausedAt,baseline=Object.create(null),projectPath=project.file.path;
  for(const path of Object.keys(session.baseline||{})){
   const file=this.app.vault.getAbstractFileByPath(path);
   if(!(file instanceof TFile)||file.path!==path)continue;
   try{const words=lfWordCount(await this.app.vault.cachedRead(file));if(file.path===path)baseline[path]=words;}
   catch(e){console.warn('[Basic AI] Session tracking:',e);}
  }
  if(this.writerProjectClosed||project.file.path!==projectPath||prefs.session!==session||!session.active||session.pausedAt!==pausedAt)return;
  session.baseline=baseline;session.pausedAt=null;session.runningSince=Date.now();
  await this.plugin.saveSettings();await this.render();
 }
 async stopWritingSession(project){
  const prefs=this.prefs(project),session=prefs.session;
  if(session?.active){
   const now=Date.now();
   session.elapsedMs=lfSessionElapsed(session,now);session.runningSince=null;session.pausedAt=null;
   session.active=false;session.stoppedAt=now;
   await this.flushSessionChanges(prefs,session);
  }
  await this.plugin.saveSettings();await this.render();
 }
 recordSessionChange(file){
  if(this.writerProjectClosed)return;
  const path=file.path,today=new Date().toDateString();
  for(const [projectPath,prefs] of Object.entries(this.plugin.settings?.projectsData||{})){
   const session=prefs?.session;
   if(!session?.active||session.pausedAt!=null||session.day!==today||!Object.hasOwn(session.baseline||{},path))continue;
   // Older saved sessions are owned by the path of their containing settings record.
   session.projectPath=projectPath;
   const key=JSON.stringify([session.projectPath,path]);
   this.sessionUpdateJobs??=new Map();
   clearTimeout(this.sessionUpdateJobs.get(key)?.timer);
   const job={session,file,path,projectPath,timer:null};
   this.sessionUpdateJobs.set(key,job);
   job.timer=setTimeout(async()=>{
    const isCurrent=()=>this.sessionUpdateJobs.get(key)===job&&!this.writerProjectClosed&&session.active&&session.pausedAt==null&&session.day===new Date().toDateString()&&
     file.path===path&&this.plugin.settings.projectsData?.[projectPath]?.session===session;
    try{
     const words=lfWordCount(await this.app.vault.cachedRead(file));
     if(!isCurrent())return;
     this.applySessionCount(prefs,session,path,words);
     clearTimeout(this.sessionSaveTimer);
     this.sessionSaveTimer=setTimeout(()=>this.plugin.saveSettings().catch(error=>console.warn('[Basic AI] Could not save writing session:',error)),1300);
     if(this.activeTab==='project'&&this.currentProject?.file.path===projectPath)this.refreshSessionProgress(projectPath,session,prefs);
    }catch(e){console.warn('[Basic AI] Session tracking:',e);}
    finally{if(this.sessionUpdateJobs.get(key)===job)this.sessionUpdateJobs.delete(key);}
   },500);
  }
 }
 sessionProgressText(words,goal){
  return words+lfMsg(' palavras registradas hoje',' words recorded today')+(goal?lfMsg(' / meta ',' / goal ')+goal:'');
 }
 refreshSessionProgress(projectPath,session,prefs){
  const target=this.root?.querySelector('.writer-project-session');
  if(!target||target.dataset.projectPath!==projectPath)return;
  target.querySelector('.writer-session-count')?.setText(this.sessionProgressText(session.words,prefs.dailyGoal));
  const progress=target.querySelector('progress');
  if(progress)progress.value=Math.min(session.words,prefs.dailyGoal);
 }
 sessionTimeText(session,today=new Date().toDateString()){
  const seconds=Math.floor((session?.day===today?lfSessionElapsed(session):0)/1000);
  const time=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(value=>String(value).padStart(2,'0')).join(':');
  return lfMsg('Tempo de escrita: ','Writing time: ')+time;
 }
 refreshSessionClock(){
  const time=this.root?.querySelector('.writer-session-time');
  const path=time?.closest('.writer-project-session')?.dataset.projectPath;
  if(!path||path!==this.selected||this.activeTab!=='project')return;
  const session=this.plugin.settings.projectsData?.[path]?.session;
  const text=this.sessionTimeText(session);
  if(time.textContent!==text)time.setText(text);
 }
 drawSession(panel,project){
  const prefs=this.prefs(project),session=prefs.session;
  const box=panel.createDiv({cls:'writer-project-session',attr:{'data-project-path':project.file.path}});
  box.createEl('h4',{text:lfMsg("Sessão de escrita","Writing session")});
  const today=new Date().toDateString(),words=session?.day===today?session.words||0:0;
  const active=session?.active&&session.day===today,paused=active&&session.pausedAt!=null;
  box.createEl('p',{cls:'writer-session-count',text:this.sessionProgressText(words,prefs.dailyGoal)});
  box.createEl('p',{cls:'writer-session-time',text:this.sessionTimeText(session,today)});
  if(prefs.dailyGoal>0){
   const progress=box.createEl('progress');progress.max=prefs.dailyGoal;progress.value=Math.min(words,prefs.dailyGoal);
  }
  const actions=box.createDiv({cls:'writer-project-notes-toolbar'});
  const button=(label,action)=>actions.createEl('button',{text:label,attr:{type:'button'}}).addEventListener('click',async()=>{
   const buttons=actions.querySelectorAll('button');for(const item of buttons)item.disabled=true;
   try{await action.call(this,project);}catch(error){new Notice(error.message);}
   finally{for(const item of buttons)item.disabled=false;}
  });
  if(active){
   button(paused?lfMsg('Retomar sessão','Resume session'):lfMsg('Pausar sessão','Pause session'),paused?this.resumeWritingSession:this.pauseWritingSession);
   button(lfMsg('Encerrar sessão','End session'),this.stopWritingSession);
  }else button(lfMsg('Iniciar sessão','Start session'),this.startWritingSession);
  box.createEl('p',{text:lfMsg("Contagem baseada nos arquivos salvos durante a sessão. Alterações fora do Obsidian podem não ser contabilizadas.","Counts reflect files saved during this session. Changes outside Obsidian may not be counted.")});
 }
 async drawStats(panel,project,isCurrent){
  const scenes=project.format==='single'?[{title:project.title,file:project.file}]:this.activeScenes(project)
   .map(({title})=>({title,file:this.resolveScene(project,title)})).filter(item=>item.file);
  const box=panel.createDiv({cls:'writer-project-progress',attr:{'data-project-path':project.file.path}});
  const counts=new Map();
  for(const {file} of scenes){
   if(!isCurrent())return;
   if(counts.has(file.path))continue;
   try{counts.set(file.path,lfWordCount(await this.app.vault.cachedRead(file)));}catch(_){counts.set(file.path,0);}
  }
  if(!isCurrent())return;
  const goal=this.prefs(project).goal||0;
  const label=box.createEl('strong');
  const goalLabel=goal>0?box.createEl('p'):null;
  const progress=goal>0?box.createEl('progress'):null;
  const sceneLabels=new Map();
  if(scenes.length&&project.format!=='single'){
   const details=box.createEl('details');
   details.createEl('summary',{text:lfMsg('Palavras por cena','Words per scene')});
   const entries=details.createEl('ul');
   for(const {title,file} of scenes){
    if(sceneLabels.has(file.path))continue;
    const row=entries.createEl('li'),target=Number(this.app.metadataCache?.getFileCache?.(file)?.frontmatter?.target_wordcount);
    row.createEl('strong',{text:title});
    sceneLabels.set(file.path,{label:row.createEl('span'),target:Number.isFinite(target)&&target>0?Math.floor(target):0});
   }
  }
  const state={counts,goal,label,goalLabel,progress,reads:new Map(),sceneLabels};
  this.projectProgress??=new WeakMap();this.projectProgress.set(box,state);
  this.paintProjectStats(state);
 }
 paintProjectStats({counts,goal,label,goalLabel,progress,sceneLabels}){
  const total=[...counts.values()].reduce((sum,count)=>sum+count,0);
  label.setText('Total: '+total.toLocaleString(getLocale())+lfMsg(' palavras',' words'));
  if(progress){
   goalLabel.setText(Math.min(100,Math.round(100*total/goal))+lfMsg('% da meta de ','% of goal: ')+goal+lfMsg(' palavras',' words'));
   progress.max=goal;progress.value=Math.min(total,goal);
  }
  for(const [path,{label,target}] of sceneLabels||[]){
   const locale=getLocale(),format=value=>value.toLocaleString(locale);
   label.setText(' · '+format(counts.get(path)??0)+(target?' / '+format(target):'')+lfMsg(' palavras',' words'));
  }
 }
 async refreshProjectStats(file){
  const box=this.root?.querySelector('.writer-project-progress');
  const state=box&&this.projectProgress?.get(box),path=file.path;
  if(!state?.counts.has(path)||box.dataset.projectPath!==this.selected)return;
  const read={};state.reads.set(path,read);
  try{
   const text=await this.app.vault.cachedRead(file);
   if(this.writerProjectClosed||this.activeTab!=='project'||!box.isConnected||box.dataset.projectPath!==this.selected||
     state.reads.get(path)!==read||file.path!==path)return;
   state.counts.set(path,lfWordCount(text));
   const scene=state.sceneLabels?.get(path);
   if(scene){const target=Number(this.app.metadataCache?.getFileCache?.(file)?.frontmatter?.target_wordcount);scene.target=Number.isFinite(target)&&target>0?Math.floor(target):0;}
   this.paintProjectStats(state);
  }catch(error){console.warn('[Basic AI] Could not refresh project count',error);}
  finally{if(state.reads.get(path)===read)state.reads.delete(path);}
 }

 taskOptions(){
  const defaults={autoSort:true,hideCompleted:false,showDueDates:true,showTooltips:true};
  this.plugin.settings.longformTasksOptions={...defaults,...(this.plugin.settings.longformTasksOptions||{})};
  return this.plugin.settings.longformTasksOptions;
 }
 taskState(project){
  const states=this.plugin.settings.longformTasks||(this.plugin.settings.longformTasks={});
  if(!states[project.file.path])states[project.file.path]={groups:[{name:lfMsg('Geral','General'),tasks:[]}],tasks:[]};
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
    const toggle=row.createEl('input',{type:'checkbox',attr:{'aria-label':lfMsg('Concluir tarefa','Complete task')+' — '+task.name}});
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
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(lfMsg("Salvar","Save")).setCta().onClick(async()=>{
    if(!values.name.trim())return new Notice(lfMsg('Informe a tarefa','Enter a task'));
    if(values.date&&!/^\d{4}-\d{2}-\d{2}$/.test(values.date))return new Notice('YYYY-MM-DD');
    if(existing)Object.assign(existing,values);else (group?group.tasks:state.tasks).push(values);
    modal.close();await this.saveTaskState();
   }));
  };modal.open();
 }

}
module.exports={ProjectsView,PROJECT_VIEW,lfFlattenScenes,lfNestScenes,lfSceneTree,lfNumberScenes,lfWordCount};
