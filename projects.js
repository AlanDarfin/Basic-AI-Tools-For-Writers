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

 sceneIndex(scenes,title){return scenes.findIndex(x=>x.title===title);}
 subtreeEnd(scenes,i){let end=i+1;while(end<scenes.length&&scenes[end].indent>scenes[i].indent)end++;return end;}
 async addScene(project,parentTitle=null){
  new TextPrompt(this.app,parentTitle?'Novo subcapítulo':'Nova cena',async raw=>{
   const name=clean(raw);if(!name||name==='.'||name==='..')return;
   const base=project.file.parent?.path||'',folder=String(project.meta.sceneFolder||'/').split('/').filter(Boolean).join('/');
   const dir=[base,folder].filter(Boolean).join('/'),path=[dir,name+'.md'].filter(Boolean).join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error('Já existe uma cena com esse nome.');
    if(this.activeScenes(project).some(x=>x.title===name))throw Error('Nome de cena duplicado.');
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
      if(i<0)throw Error('Cena pai não encontrada.');
      const end=this.subtreeEnd(scenes,i);
      scenes.splice(end,0,{title:name,indent:scenes[i].indent+1});
     }else scenes.push({title:name,indent:0});
    });
    this.openFile(file);
   }catch(e){new Notice('Não foi possível criar a cena: '+e.message);}
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
 async moveSceneBefore(project,source,target){
  if(source===target)return;
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,source),j=this.sceneIndex(scenes,target);
   if(i<0||j<0)return;
   const end=this.subtreeEnd(scenes,i);
   if(j>=i&&j<end)return;
   const part=scenes.splice(i,end-i);
   const dest=this.sceneIndex(scenes,target);
   if(dest<0)return;
   const shift=scenes[dest].indent-part[0].indent;
   part.forEach(item=>item.indent=Math.max(0,item.indent+shift));
   scenes.splice(dest,0,...part);
  });}catch(e){new Notice(e.message);}
 }
 async removeSceneFromIndex(project,title){
  try{await this.changeScenes(project,scenes=>{
   const i=this.sceneIndex(scenes,title);if(i<0)return;
   const depth=scenes[i].indent,end=this.subtreeEnd(scenes,i);
   scenes.splice(i,1);
   for(let j=i;j<end-1;j++)scenes[j].indent=Math.max(0,scenes[j].indent-1);
  });new Notice('Entrada removida do índice. Arquivo e subcapítulos preservados.');}
  catch(e){new Notice(e.message);}
 }
 async renameScene(project,title){
  new TextPrompt(this.app,'Renomear cena',async raw=>{
   const name=clean(raw);if(!name||name===title)return;
   const file=this.resolveScene(project,title);
   if(!(file instanceof TFile))return new Notice('Arquivo da cena não encontrado.');
   const newPath=[file.parent?.path,name+'.md'].filter(Boolean).join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(newPath))throw Error('Já existe uma cena com esse nome.');
    await this.app.fileManager.renameFile(file,newPath);
    await this.changeScenes(project,scenes=>{const i=this.sceneIndex(scenes,title);if(i>=0)scenes[i].title=name;});
   }catch(e){new Notice('Erro ao renomear cena: '+e.message);}
  },title).open();
 }
 drawScenes(panel,project){
  if(project.format==='single'){
   panel.createEl('p',{text:'Projeto de nota única.'});
   panel.createEl('button',{text:'Abrir texto'}).addEventListener('click',()=>this.openFile(project.file));
   return;
  }
  const prefs=this.prefs(project),draftBar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const linked=this.indexes().filter(x=>x.title===project.title&&x.file.path!==project.file.path);
  if(linked.length){
   const other=draftBar.createEl('select',{attr:{'aria-label':'Rascunhos Longform existentes'}});
   other.createEl('option',{text:'Trocar para rascunho Longform...',value:''});
   for(const d of linked){const o=other.createEl('option',{text:d.draftTitle||d.file.basename});o.value=d.file.path;}
   other.addEventListener('change',()=>{if(other.value){this.selected=other.value;this.draft='Principal';this.render();}});
  }
  const select=draftBar.createEl('select',{attr:{'aria-label':'Rascunho local'}});
  const drafts=['Principal',...Object.keys(prefs.drafts||{})];
  if(!drafts.includes(this.draft))this.draft='Principal';
  for(const d of drafts){const o=select.createEl('option',{text:d});o.value=d;}select.value=this.draft;
  select.addEventListener('change',()=>{this.draft=select.value;this.render();});
  draftBar.createEl('button',{text:'+ Variante'}).addEventListener('click',()=>new TextPrompt(this.app,'Nome da variante',async name=>{
   name=clean(name);if(!name||name==='Principal'||prefs.drafts[name])return;
   prefs.drafts[name]=JSON.parse(JSON.stringify(this.activeScenes(project)));
   this.draft=name;await this.savePrefs();
  }).open());
  if(this.draft!=='Principal')draftBar.createEl('button',{text:'Excluir variante'}).addEventListener('click',async()=>{
   delete prefs.drafts[this.draft];this.draft='Principal';await this.savePrefs();
  });
  const toolbar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  toolbar.createEl('button',{text:'+ Cena'}).addEventListener('click',()=>this.addScene(project));
  toolbar.createEl('button',{text:'Novo rascunho Longform'}).addEventListener('click',()=>this.createLinkedDraft(project));
  const scenes=this.activeScenes(project),tree=lfSceneTree(scenes);
  const renderItem=(item,parent,level=0)=>{
   const name=item.title;
   const row=parent.createDiv({cls:'writer-project-scene writer-project-scene-actions'});
   row.style.paddingLeft=(Math.min(12,level)*10)+'px';
   row.draggable=true;
   row.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',name);e.dataTransfer.effectAllowed='move';});
   row.addEventListener('dragover',e=>{e.preventDefault();row.addClass('writer-project-dragover');});
   row.addEventListener('dragleave',()=>row.removeClass('writer-project-dragover'));
   row.addEventListener('drop',e=>{e.preventDefault();row.removeClass('writer-project-dragover');const source=e.dataTransfer.getData('text/plain');if(source)this.moveSceneBefore(project,source,name);});
   const file=this.resolveScene(project,name);
   row.createEl('button',{text:name,cls:'writer-project-scene-title'}).addEventListener('click',()=>file?this.openFile(file):new Notice('Cena não encontrada: '+name));
   const controls=[['↑',()=>this.moveScene(project,name,-1),'Subir'],['↓',()=>this.moveScene(project,name,1),'Descer'],
    ['←',()=>this.indentScene(project,name,-1),'Diminuir recuo'],['→',()=>this.indentScene(project,name,1),'Aumentar recuo'],
    ['+',()=>this.addScene(project,name),'Adicionar subcapítulo'],['⋯',()=>this.renameScene(project,name),'Renomear'],['×',()=>this.removeSceneFromIndex(project,name),'Tirar do índice (sem excluir arquivo)']];
   for(const [label,fn,title] of controls)row.createEl('button',{text:label,cls:'writer-project-small-button',attr:{title,'aria-label':title}}).addEventListener('click',fn);
   for(const child of item.children)renderItem(child,parent,level+1);
  };
  for(const item of tree)renderItem(item,panel);
  if(!scenes.length)panel.createEl('p',{text:'Nenhuma cena cadastrada. Use + Cena.'});
 }
 async createLinkedDraft(project){
  new TextPrompt(this.app,'Nome do novo rascunho Longform',async raw=>{
   const name=clean(raw);if(!name)return;
   const root=[project.file.parent?.path,'Rascunhos',name].filter(Boolean).join('/');
   const path=[root,'Índice.md'].join('/');
   try{
    if(this.app.vault.getAbstractFileByPath(path))throw Error('Esse rascunho já existe.');
    await this.ensureFolder(root);
    const scenes=[];
    for(const entry of this.activeScenes(project)){
     const file=this.resolveScene(project,entry.title);
     if(!(file instanceof TFile))continue;
     const dest=[root,entry.title+'.md'].join('/');
     if(this.app.vault.getAbstractFileByPath(dest))throw Error('Arquivo de cena já existe: '+entry.title);
     await this.app.vault.create(dest,await this.app.vault.read(file));
     scenes.push({...entry});
    }
    const payload={longform:{format:'scenes',title:project.title,draftTitle:name,sceneFolder:'/',scenes:lfNestScenes(scenes),ignoredFiles:[]}};
    const index=await this.app.vault.create(path,'---\n'+stringifyYaml(payload)+'---\n');
    this.selected=index.path;this.draft='Principal';await this.render();
    new Notice('Rascunho Longform criado sem alterar o original.');
   }catch(e){new Notice('Não foi possível criar rascunho: '+e.message);}
  }).open();
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
