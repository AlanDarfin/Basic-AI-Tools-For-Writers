'use strict';
class WriterV4Editor{
 constructor(plugin){this.plugin=plugin;this.templateTimers=new Map();this.processing=new Set();}
 get config(){return this.plugin.settings;}
 extension(){
  const plugin=this.plugin;
  return ViewPlugin.fromClass(class{
   constructor(view){this.view=view;}
   update(update){
    if(!update.docChanged||!plugin.settings.abbreviations?.enabled||!update.view.hasFocus)return;
    const transaction=update.transactions.find(t=>t.isUserEvent?.('input.type'));
    if(!transaction)return;
    let enteredSpace=false;
    transaction.changes.iterChanges((fromA,toA,fromB,toB,insert)=>{
     if(insert.toString()===' ')enteredSpace=true;
    });
    if(!enteredSpace||!update.state.selection.main.empty)return;
    const position=update.state.selection.main.head;
    if(position<2||update.state.doc.sliceString(position-1,position)!==' ')return;
    const before=update.state.doc.sliceString(Math.max(0,position-160),position-1);
    const raw=before.match(/(?:^|\s)(\S+)$/)?.[1];
    if(!raw)return;
    const entries=plugin.settings.abbreviations.entries||{};
    const key=Object.keys(entries).find(x=>x.toLocaleLowerCase()===raw.toLocaleLowerCase());
    if(!key)return;
    const item=entries[key];
    if(!item?.isEnabled||!item.value||item.isCaseSensitive&&key!==raw)return;
    const from=position-1-raw.length;
    const replace=item.value+' ';
    requestAnimationFrame(()=>{
     if(this.view.state.doc.sliceString(from,position)!==raw+' ')return;
     this.view.dispatch({changes:{from,to:position,insert:replace},selection:{anchor:from+replace.length}});
    });
   }
  });
 }
 updateAnotherName(){
  if(!this.config.anotherName?.enabled)return;
  const property=String(this.config.anotherName.property||'another-name').trim();
  this.plugin.app.workspace.iterateAllLeaves(leaf=>{
   if(!(leaf.view instanceof MarkdownView))return;
   const view=leaf.view,file=view.file,container=view.containerEl;
   if(!container)return;
   for(const el of container.querySelectorAll('.writer-v4-another-name'))el.remove();
   if(!file||!property)return;
   const name=this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[property];
   if(typeof name!=='string'||!name.trim())return;
   const title=container.querySelector('.inline-title');
   if(!title)return;
   title.insertAdjacentElement('afterend',container.createDiv({cls:'writer-v4-another-name',text:name}));
  });
 }
 async applyViewMode(file){
  if(!this.config.viewMode?.enabled||!(file instanceof TFile))return;
  const value=this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[this.config.viewMode.property||'prefer-view']||this.config.viewMode.defaultMode;
  if(!['read','edit','edit-source','edit-preview'].includes(value))return;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view||view.file?.path!==file.path)return;
  const state=view.getState();
  let next={...state};
  if(value==='read')next.mode='preview';
  else{
   next.mode='source';
   if(value==='edit-source')next.source=true;
   else if(value==='edit-preview')next.source=false;
   else{
    try{const config=JSON.parse(await this.plugin.app.vault.adapter.read(this.plugin.app.vault.configDir+'/app.json'));next.source=!config.livePreview;}
    catch{next.source=false;}
   }
  }
  if(next.mode===state.mode&&(next.mode==='preview'||next.source===state.source))return;
  await view.setState(next,{history:false});
 }
 templateCandidates(file){
  const cfg=this.config.noteTemplates;
  const base=String(cfg.folder||'Templates').replace(/^\/+|\/+$/g,'');
  if(!base||base.split('/').includes('..'))return [];
  const folder=this.plugin.app.vault.getAbstractFileByPath(base);
  if(!(folder instanceof TFolder))return [];
  const wanted=file.basename;
  const files=this.plugin.app.vault.getMarkdownFiles().filter(f=>f.path.startsWith(base+'/')&&(cfg.includeSubfolders||f.parent?.path===base));
  return files.filter(f=>cfg.caseSensitive?f.basename===wanted:f.basename.toLocaleLowerCase()===wanted.toLocaleLowerCase()).sort((a,b)=>a.path.length-b.path.length);
 }
 async applyTemplate(file){
  if(!this.config.noteTemplates?.enabled||!(file instanceof TFile)||file.extension!=='md'||this.processing.has(file.path))return false;
  if(file.path.startsWith(String(this.config.noteTemplates.folder||'Templates').replace(/\/+$/,'')+'/'))return false;
  const template=this.templateCandidates(file)[0];if(!template)return false;
  this.processing.add(file.path);
  try{
   // Vault.process is atomic: a late-arriving user edit or another template wins.
   const contents=await this.plugin.app.vault.cachedRead(template);
   const now=new Date();
   const values={title:file.basename,date:now.toISOString().slice(0,10),time:now.toLocaleTimeString()};
   const expanded=contents.replace(/\{\{\s*(title|date|time)\s*\}\}/gi,(_,key)=>values[key.toLowerCase()]);
   let changed=false;
   await this.plugin.app.vault.process(file,old=>{
    if(this.config.noteTemplates.onlyEmpty!==false&&old.trim())return old;
    if(old===expanded)return old;
    changed=true;return expanded;
   });
   if(changed)new Notice(w4text(this.plugin,'Modelo aplicado: ','Template applied: ')+template.basename);
   return changed;
  }catch(e){console.warn('[Basic AI] template:',e);return false;}
  finally{this.processing.delete(file.path);}
 }
 register(){
  const plugin=this.plugin;
  plugin.registerEditorExtension(this.extension());
  plugin.registerEvent(plugin.app.workspace.on('file-open',file=>{
   if(file)this.applyViewMode(file).catch(console.error);
   this.updateAnotherName();
  }));
  plugin.registerEvent(plugin.app.workspace.on('layout-change',()=>this.updateAnotherName()));
  plugin.registerEvent(plugin.app.metadataCache.on('changed',(file)=>{
   if(file?.extension==='md'){
    if(this.config.anotherName.enabled)this.updateAnotherName();
    if(this.config.viewMode.enabled&&plugin.app.workspace.getActiveFile()?.path===file.path)this.applyViewMode(file).catch(console.error);
   }
  }));
  plugin.registerEvent(plugin.app.vault.on('create',file=>{
   if(!(file instanceof TFile)||file.extension!=='md')return;
   const timer=setTimeout(()=>{this.templateTimers.delete(file.path);this.applyTemplate(file);},450);
   this.templateTimers.set(file.path,timer);
  }));
  plugin.registerEvent(plugin.app.vault.on('rename',(file,oldPath)=>{
   if(file instanceof TFile&&this.config.noteTemplates?.enabled)this.updateAnotherName();
  }));
  plugin.addCommand({id:'v4-expand-abbreviation',name:w4text(plugin,'Alternar expansão de abreviações','Toggle abbreviation expansion'),callback:async()=>{
   this.config.abbreviations.enabled=!this.config.abbreviations.enabled;await plugin.saveSettings();
   new Notice(w4text(plugin,'Abreviações: ','Abbreviations: ')+(this.config.abbreviations.enabled?'ON':'OFF'));
  }});
  plugin.addCommand({id:'v4-apply-note-template',name:w4text(plugin,'Aplicar modelo por nome da nota','Apply template by note name'),callback:()=>{
   const file=plugin.app.workspace.getActiveFile();if(file)this.applyTemplate(file);
  }});
  plugin.addCommand({id:'v4-refresh-another-name',name:w4text(plugin,'Atualizar segundo título','Refresh secondary note title'),callback:()=>this.updateAnotherName()});
  plugin.addCommand({id:'v4-apply-view-mode',name:w4text(plugin,'Aplicar modo preferido da nota','Apply preferred note view mode'),callback:()=>{
   const file=plugin.app.workspace.getActiveFile();if(file)this.applyViewMode(file);
  }});
  plugin.app.workspace.onLayoutReady?.(()=>this.updateAnotherName());
 }
 destroy(){for(const timer of this.templateTimers.values())clearTimeout(timer);this.templateTimers.clear();}
}
