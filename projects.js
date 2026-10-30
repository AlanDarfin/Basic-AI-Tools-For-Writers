'use strict';
const {ItemView,TFile,TFolder,Notice,Modal,Setting}=require('obsidian');
const PROJECT_VIEW='basic-ai-projects';
const clean=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'-').trim();
class TextPrompt extends Modal{
 constructor(app,title,done,initial=''){super(app);this.titleText=title;this.done=done;this.initial=initial;}
 onOpen(){this.contentEl.empty();this.setTitle(this.titleText);let value=this.initial;new Setting(this.contentEl).setName(this.titleText).addText(t=>{t.setValue(value).onChange(v=>value=v);t.inputEl.focus();t.inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.close();this.done(value);}})});new Setting(this.contentEl).addButton(b=>b.setButtonText('Confirmar').setCta().onClick(()=>{this.close();this.done(value);}));}
 onClose(){this.contentEl.empty();}
}
function longformIndex(file,app){
 const data=app.metadataCache.getFileCache(file)?.frontmatter?.longform;
 if(!data||typeof data!=='object')return null;
 return {file,meta:data,title:String(data.title||file.basename),scenes:Array.isArray(data.scenes)?data.scenes:[]};
}
function sceneNames(items,out=[]){for(const item of items){if(typeof item==='string')out.push(item);else if(item&&typeof item==='object'){if(item.scene)out.push(String(item.scene));if(item.name)out.push(String(item.name));if(Array.isArray(item.children))sceneNames(item.children,out);}}return out;}
class ProjectsView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.activeTab='scenes';this.selected=null;}
 getViewType(){return PROJECT_VIEW;}
 getDisplayText(){return 'Projetos de escrita';}
 getIcon(){return 'notebook-pen';}
 async onOpen(){
  this.root=this.contentEl.createDiv({cls:'writer-project-root'});
  this.registerEvent(this.app.vault.on('create',()=>this.render()));
  this.registerEvent(this.app.vault.on('delete',()=>this.render()));
  this.registerEvent(this.app.vault.on('rename',()=>this.render()));
  this.registerEvent(this.app.metadataCache.on('changed',()=>this.render()));
  await this.render();
 }
 indexes(){return this.app.vault.getMarkdownFiles().map(f=>longformIndex(f,this.app)).filter(Boolean);}
 async render(){
  if(!this.root)return;
  this.root.empty();
  const indexes=this.indexes();
  const top=this.root.createDiv({cls:'writer-project-toolbar'});
  const selector=top.createEl('select',{attr:{'aria-label':'Projeto'}});
  for(const project of indexes){const option=selector.createEl('option',{text:project.title});option.value=project.file.path;}
  if(!indexes.length){this.root.createEl('p',{text:'Nenhum projeto Longform encontrado. Abra uma nota de índice com frontmatter longform para importá-la.'});return;}
  if(!indexes.some(x=>x.file.path===this.selected))this.selected=indexes[0].file.path;
  selector.value=this.selected;
  selector.addEventListener('change',()=>{this.selected=selector.value;this.render();});
  const project=indexes.find(x=>x.file.path===this.selected);
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
  await this.drawNotes(panels.notes,project);
 }
 resolveScene(project,name){
  const base=project.file.parent?.path||'';
  const exact=[base+'/'+name+'.md',base+'/'+name,name+'.md',name];
  return exact.map(p=>this.app.vault.getAbstractFileByPath(p)).find(f=>f instanceof TFile)
   ||this.app.vault.getMarkdownFiles().find(f=>f.basename===name&&f.path.startsWith(base+'/'));
 }
 openFile(file){if(file instanceof TFile)this.app.workspace.getLeaf(false).openFile(file);}
 drawScenes(panel,project){
  panel.createEl('h4',{text:'Cenas do manuscrito'});
  const renderItem=(item,parent,level=0)=>{
   if(level>25)return;
   const name=typeof item==='string'?item:String(item?.scene||item?.name||'Cena');
   const row=parent.createDiv({cls:'writer-project-scene'});
   row.style.paddingLeft=(level*12)+'px';
   const file=this.resolveScene(project,name);
   row.createEl('button',{text:name}).addEventListener('click',()=>file?this.openFile(file):new Notice('Cena não encontrada: '+name));
   if(Array.isArray(item?.children))for(const child of item.children)renderItem(child,parent,level+1);
  };
  for(const scene of project.scenes)renderItem(scene,panel);
  if(!project.scenes.length)panel.createEl('p',{text:'Nenhuma cena cadastrada neste índice.'});
 }
 drawProject(panel,project){
  panel.createEl('h4',{text:project.title});
  panel.createEl('p',{text:'Índice: '+project.file.path});
  panel.createEl('p',{text:'Cenas no índice: '+sceneNames(project.scenes).length});
  panel.createEl('button',{text:'Abrir índice do Longform'}).addEventListener('click',()=>this.openFile(project.file));
  panel.createEl('p',{text:'Importação compatível: leitura dos metadados existentes, sem alterar arquivos.'});
 }
 drawCompile(panel,project){
  panel.createEl('h4',{text:'Compilação básica'});
  panel.createEl('p',{text:'Concatena cenas existentes na ordem do índice. Não altera os capítulos nem substitui workflows personalizados do Longform.'});
  panel.createEl('button',{text:'Gerar manuscrito Markdown'}).addEventListener('click',async()=>{
   try{
    const names=sceneNames(project.scenes),contents=[];
    for(const name of names){const f=this.resolveScene(project,name);if(f)contents.push((await this.app.vault.read(f)).replace(/^---\s*\n[\s\S]*?\n---\s*\n?/,'').trim());}
    if(!contents.length)throw Error('Nenhuma cena encontrada.');
    const dir=project.file.parent?.path||'',base=clean(project.title)+' - Manuscrito';
    let path=(dir?dir+'/':'')+base+'.md',n=2;
    while(this.app.vault.getAbstractFileByPath(path))path=(dir?dir+'/':'')+base+' '+n+++'.md';
    const file=await this.app.vault.create(path,contents.join('\n\n---\n\n')+'\n');
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
