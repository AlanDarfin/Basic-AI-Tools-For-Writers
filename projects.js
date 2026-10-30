'use strict';
const {ItemView,TFile,TFolder,Notice,Modal,Setting,parseYaml,stringifyYaml}=require('obsidian');
const PROJECT_VIEW='basic-ai-projects';
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'-').trim();
class TextPrompt extends Modal{
 constructor(app,title,done,initial=''){super(app);this.titleText=title;this.done=done;this.initial=initial;}
 onOpen(){this.contentEl.empty();this.setTitle(this.titleText);let value=this.initial;new Setting(this.contentEl).setName(this.titleText).addText(t=>{t.setValue(value).onChange(v=>value=v);t.inputEl.focus();t.inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.close();this.done(value);}})});new Setting(this.contentEl).addButton(b=>b.setButtonText('Confirmar').setCta().onClick(()=>{this.close();this.done(value);}));}
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
function lfWordCount(text){
 return (String(text||'').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
}
function lfUnescape(s){return String(s||'').replace(/\\n/g,'\n').replace(/\\t/g,'\t');}
class ProjectsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.activeTab='scenes';this.selected=null;this.draft='Principal';this.workflow='Padrão';this.renderToken=0;}
 getViewType(){return PROJECT_VIEW;}
 getDisplayText(){return 'Projetos de escrita';}
 getIcon(){return 'notebook-pen';}
 async onOpen(){
  this.root=this.contentEl.createDiv({cls:'writer-project-root'});
  this.registerEvent(this.app.vault.on('create',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('delete',()=>this.queueRender()));
  this.registerEvent(this.app.vault.on('rename',()=>this.queueRender()));
  this.registerEvent(this.app.metadataCache.on('changed',file=>{if(file?.path===this.selected)this.queueRender();}));
  await this.render();
 }
 queueRender(){clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>this.render(),220);}
 async onClose(){clearTimeout(this.refreshTimer);}
 indexes(){return this.app.vault.getMarkdownFiles().map(f=>longformIndex(f,this.app)).filter(Boolean);}
 async render(){
  if(!this.root)return;
  this.root.empty();
  const indexes=this.indexes();
  const token=++this.renderToken;
  const active=this.app.workspace.getActiveFile();
  const activeProject=active&&indexes.find(p=>p.file.path===active.path);
  if(!this.selected&&activeProject)this.selected=activeProject.file.path;
  const top=this.root.createDiv({cls:'writer-project-toolbar'});
  const selector=top.createEl('select',{attr:{'aria-label':'Projeto'}});
  for(const project of indexes){const option=selector.createEl('option',{text:project.title});option.value=project.file.path;}
  if(!indexes.length){this.root.createEl('p',{text:'Nenhum projeto Longform encontrado. Abra uma nota de índice com frontmatter longform para importá-la.'});return;}
  if(!indexes.some(x=>x.file.path===this.selected))this.selected=indexes[0].file.path;
  selector.value=this.selected;
  selector.addEventListener('change',()=>{this.selected=selector.value;this.render();});
  const project=indexes.find(x=>x.file.path===this.selected);
  this.currentProject=project;
  this.projectPrefs=this.prefs(project);
  const tabs=this.root.createDiv({cls:'writer-project-tabs'});
  const panels={};
  for(const [id,name] of [['scenes','Cenas'],['project','Projeto'],['compile','Compilar'],['notes','Notas']]){
   const btn=tabs.createEl('button',{text:name,cls:this.activeTab===id?'is-active':''});
   btn.addEventListener('click',()=>{this.activeTab=id;this.render();});
   panels[id]=this.root.createDiv({cls:'writer-project-panel'});
   panels[id].style.display=this.activeTab===id?'block':'none';
  }
  this.drawScenes(panels.scenes,project);
  this.drawProject(panels.project,project);
  this.drawCompile(panels.compile,project);
  if(this.activeTab==='notes')await this.drawNotes(panels.notes,project);
  if(this.activeTab==='project')await this.drawStats(panels.project,project,token);
 }
 resolveScene(project,name){
  const base=project.file.parent?.path||'';
  const raw=String(project.meta.sceneFolder||'/').split('/').filter(Boolean).join('/');
  const folder=[base,raw].filter(Boolean).join('/');
  const exact=[[folder,name+'.md'].filter(Boolean).join('/'),[folder,name].filter(Boolean).join('/'),[base,name+'.md'].filter(Boolean).join('/'),name+'.md',name];
  return exact.map(p=>this.app.vault.getAbstractFileByPath(p)).find(f=>f instanceof TFile)||null;
 }
 openFile(file){if(file instanceof TFile)this.app.workspace.getLeaf(false).openFile(file);}

 prefs(project){
  if(!this.plugin.settings.projectsData)this.plugin.settings.projectsData={};
  const key=project.file.path;
  return this.plugin.settings.projectsData[key]||(this.plugin.settings.projectsData[key]={drafts:{},goal:0,workflow:'standard'});
 }
 async savePrefs(){await this.plugin.saveSettings();await this.render();}
 async updateIndex(project,change){
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
 async addScene(project,parent=null){
  new TextPrompt(this.app,parent?'Novo subcapítulo':'Nova cena',async raw=>{
   const name=clean(raw);if(!name)return;
   const dir=project.file.parent?.path||'',folder=String(project.meta.sceneFolder||'').replace(/^\/+|\/+$/g,'');
   const path=[dir,folder,name+'.md'].filter(Boolean).join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error('Já existe um arquivo com esse nome.');
    if(folder)await this.ensureFolder([dir,folder].filter(Boolean).join('/'));
    const file=await this.app.vault.create(path,'');
    await this.changeScenes(project,scenes=>{
     if(parent){
      const target=this.findScene(scenes,parent);
      if(!target)throw Error('Cena pai não encontrada');
      if(typeof target.item==='string')target.list[target.index]={name:target.item,children:[]};
      const node=target.list[target.index];
      if(!Array.isArray(node.children))node.children=[];
      node.children.push(name);
     }else scenes.push(name);
    });
    this.openFile(file);
   }catch(e){new Notice('Não foi possível criar cena: '+e.message);}
  }).open();
 }
 findScene(items,path){
  if(!Array.isArray(items))return null;
  for(let i=0;i<items.length;i++){
   const item=items[i],name=typeof item==='string'?item:String(item?.scene||item?.name||'');
   const current=path[0];
   if(name!==current)continue;
   if(path.length===1)return {list:items,index:i,item};
   return this.findScene(item?.children,path.slice(1));
  }
  return null;
 }
 async reorderScene(project,path,delta){
  try{await this.changeScenes(project,scenes=>{
   const found=this.findScene(scenes,path);
   if(!found)return;
   const to=found.index+delta;
   if(to<0||to>=found.list.length)return;
   found.list.splice(to,0,found.list.splice(found.index,1)[0]);
  });}catch(e){new Notice(e.message);}
 }
 async removeSceneFromIndex(project,path){
  try{await this.updateIndex(project,data=>{
   const found=this.findScene(data.scenes,path);
   if(found)found.list.splice(found.index,1);
  });new Notice('Cena removida apenas do índice; arquivo preservado.');}catch(e){new Notice(e.message);}
 }
 drawScenes(panel,project){
  const prefs=this.prefs(project);
  const draftBar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const select=draftBar.createEl('select',{attr:{'aria-label':'Rascunho'}});
  const drafts=['Principal',...Object.keys(prefs.drafts||{})];
  for(const d of drafts){const o=select.createEl('option',{text:d});o.value=d;}
  if(!drafts.includes(this.draft))this.draft='Principal';
  select.value=this.draft;
  select.addEventListener('change',()=>{this.draft=select.value;this.render();});
  draftBar.createEl('button',{text:'+ Rascunho'}).addEventListener('click',()=>new TextPrompt(this.app,'Nome do rascunho',async name=>{
   name=clean(name);if(!name||name==='Principal'||prefs.drafts[name])return;
   prefs.drafts[name]=JSON.parse(JSON.stringify(project.scenes));
   this.draft=name;await this.savePrefs();
  }).open());
  if(this.draft!=='Principal')draftBar.createEl('button',{text:'Excluir rascunho'}).addEventListener('click',async()=>{delete prefs.drafts[this.draft];this.draft='Principal';await this.savePrefs();});
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  toolbar.createEl('button',{text:'+ Cena'}).addEventListener('click',()=>this.addScene(project));
  const renderItem=(item,parent,path=[],level=0)=>{
   if(level>25)return;
   const name=typeof item==='string'?item:String(item?.scene||item?.name||'Cena');
   const next=[...path,name],row=parent.createDiv({cls:'writer-project-scene writer-project-scene-actions'});
   row.style.paddingLeft=(level*10)+'px';
   const file=this.resolveScene(project,name);
   row.createEl('button',{text:name,cls:'writer-project-scene-title'}).addEventListener('click',()=>file?this.openFile(file):new Notice('Cena não encontrada: '+name));
   for(const [label,fn,title] of [['↑',()=>this.reorderScene(project,next,-1),'Mover para cima'],['↓',()=>this.reorderScene(project,next,1),'Mover para baixo'],['+',()=>this.addScene(project,next),'Novo subcapítulo'],['×',()=>this.removeSceneFromIndex(project,next),'Retirar do índice (não apaga arquivo)']]){
    const button=row.createEl('button',{text:label,cls:'writer-project-small-button',attr:{'aria-label':title,title}});
    button.addEventListener('click',fn);
   }
   if(Array.isArray(item?.children))for(const child of item.children)renderItem(child,parent,next,level+1);
  };
  for(const scene of this.activeScenes(project))renderItem(scene,panel);
  if(!this.activeScenes(project).length)panel.createEl('p',{text:'Nenhuma cena cadastrada. Use + Cena.'});
 }
 drawProject(panel,project){
  panel.createEl('h4',{text:project.title});
  panel.createEl('p',{text:'Índice: '+project.file.path});
  panel.createEl('p',{text:'Cenas: '+sceneNames(project.scenes).length});
  panel.createEl('button',{text:'Abrir índice'}).addEventListener('click',()=>this.openFile(project.file));
  new Setting(panel).setName('Título do projeto').addText(t=>t.setValue(project.title).onChange(v=>this.newTitle=v)).addButton(b=>b.setButtonText('Salvar').onClick(()=>this.updateIndex(project,data=>{data.title=this.newTitle||project.title;})));
  new Setting(panel).setName('Pasta das cenas').setDesc('Relativa à pasta do índice; não move arquivos existentes.').addText(t=>t.setValue(project.meta.sceneFolder||'').onChange(v=>this.sceneFolder=v)).addButton(b=>b.setButtonText('Salvar').onClick(()=>this.updateIndex(project,data=>{data.sceneFolder=this.sceneFolder||'';})));
  const prefs=this.prefs(project);
  new Setting(panel).setName('Meta de palavras').setDesc('Meta total do projeto').addText(t=>t.setValue(String(prefs.goal||0)).onChange(v=>this.goalInput=v)).addButton(b=>b.setButtonText('Salvar').onClick(async()=>{prefs.goal=Math.max(0,Number(this.goalInput)||0);await this.savePrefs();}));
  const count=this.activeScenes(project).length;
  panel.createEl('p',{text:'Cenas no rascunho: '+count+(prefs.goal?' · Meta: '+prefs.goal+' palavras':'')});
  panel.createEl('p',{text:'Rascunhos e metas do Basic AI ficam nas configurações do plugin; o índice Longform original não é reescrito por essas opções.'});
 }
 async compileProject(project,options){
  const names=sceneNames(this.activeScenes(project)),contents=[];
  for(const name of names){
   const file=this.resolveScene(project,name);if(!file)continue;
   let body=await this.app.vault.read(file);
   if(options.frontmatter!==false)body=body.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/,'');
   if(options.links!==false)body=body.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,(_,alias,target)=>alias?target:target);
   contents.push(body.trim());
  }
  if(!contents.length)throw Error('Nenhuma cena encontrada.');
  const separator=options.separator??'\n\n---\n\n';
  return contents.join(separator)+'\n';
 }
 drawCompile(panel,project){
  panel.createEl('h4',{text:'Compilar manuscrito'});
  const prefs=this.prefs(project);
  const workflows=prefs.workflows||(prefs.workflows={Padrão:{frontmatter:true,links:true,separator:'\n\n---\n\n'}});
  const opts={...(workflows[this.workflow]||workflows.Padrão)};
  const bar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const selector=bar.createEl('select',{attr:{'aria-label':'Workflow'}});
  for(const name of Object.keys(workflows)){const option=selector.createEl('option',{text:name});option.value=name;}
  if(!workflows[this.workflow])this.workflow='Padrão';selector.value=this.workflow;
  selector.addEventListener('change',()=>{this.workflow=selector.value;this.render();});
  bar.createEl('button',{text:'Salvar workflow'}).addEventListener('click',()=>new TextPrompt(this.app,'Nome do workflow',async name=>{name=clean(name);if(!name)return;workflows[name]={...opts};this.workflow=name;await this.savePrefs();},this.workflow).open());
  panel.createEl('p',{text:'Rascunho: '+this.draft});
  new Setting(panel).setName('Remover propriedades YAML').addToggle(t=>t.setValue(opts.frontmatter!==false).onChange(v=>opts.frontmatter=v));
  new Setting(panel).setName('Remover wikilinks').addToggle(t=>t.setValue(opts.links!==false).onChange(v=>opts.links=v));
  new Setting(panel).setName('Separador').addTextArea(t=>t.setValue((opts.separator||'\n\n---\n\n').replace(/\n/g,'\\n')).onChange(v=>opts.separator=v.replace(/\\n/g,'\n')));
  panel.createEl('button',{text:'Gerar manuscrito Markdown',cls:'mod-cta'}).addEventListener('click',async()=>{
   try{
    const content=await this.compileProject(project,opts);
    const dir=project.file.parent?.path||'',base=clean(project.title)+' - Manuscrito';
    let path=(dir?dir+'/':'')+base+'.md',n=2;
    while(this.app.vault.getAbstractFileByPath(path))path=(dir?dir+'/':'')+base+' '+n+++'.md';
    const file=await this.app.vault.create(path,content);
    this.openFile(file);new Notice('Manuscrito criado: '+file.path);
   }catch(e){new Notice('Falha ao compilar: '+e.message);}
  });
 }
 notesRoot(project){const dir=project.file.parent?.path||'';return (dir?dir+'/':'')+'_Notas';}
 async ensureFolder(path){let current='';for(const part of path.split('/').filter(Boolean)){current=current?current+'/'+part:part;if(!this.app.vault.getAbstractFileByPath(current))await this.app.vault.createFolder(current);}}
 async drawNotes(panel,project){
  const root=this.notesRoot(project);
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  toolbar.createEl('button',{text:'+ Pasta'}).addEventListener('click',()=>new TextPrompt(this.app,'Nova pasta de notas',async name=>{name=clean(name);if(!name)return;try{await this.ensureFolder(root+'/'+name);await this.render();}catch(e){new Notice(e.message);}}).open());
  toolbar.createEl('button',{text:'+ Nota'}).addEventListener('click',()=>this.promptNote(root));
  const folder=this.app.vault.getAbstractFileByPath(root);
  if(!(folder instanceof TFolder)){panel.createEl('p',{text:'Crie uma pasta ou nota para começar. As notas não entram no manuscrito.'});return;}
  const drawFolder=(f,parent,depth)=>{
   if(depth>12)return;
   const section=parent.createEl('details',{cls:'writer-project-notes-folder'});section.open=depth===0;
   const summary=section.createEl('summary',{text:depth===0?'Notas':f.name});
   summary.addEventListener('contextmenu',e=>{e.preventDefault();this.promptNote(f.path);});
   const add=section.createEl('button',{text:'+ Nota',cls:'writer-project-small-button'});add.addEventListener('click',()=>this.promptNote(f.path));
   for(const child of f.children.sort((a,b)=>a.name.localeCompare(b.name))){
    if(child instanceof TFolder)drawFolder(child,section,depth+1);
    else if(child instanceof TFile&&child.extension==='md')section.createEl('button',{text:child.basename,cls:'writer-project-note'}).addEventListener('click',()=>this.openFile(child));
   }
  };
  drawFolder(folder,panel,0);
 }
 promptNote(dir){new TextPrompt(this.app,'Nova nota',async name=>{name=clean(name);if(!name)return;try{await this.ensureFolder(dir);let path=dir+'/'+name+'.md';if(this.app.vault.getAbstractFileByPath(path))throw Error('Já existe uma nota com esse nome.');const file=await this.app.vault.create(path,'');this.openFile(file);await this.render();}catch(e){new Notice(e.message);}}).open();}
}
module.exports={ProjectsView,PROJECT_VIEW};
