'use strict';
/* v6 beta4: project-level preferences, no destructive Longform frontmatter changes. */
const WRITER_V6_PROJECT_TOOLS=[
 ['ruby','Ruby','Ruby'],['ratings','Avaliações','Ratings'],['discordSyntax','Discord Syntax','Discord syntax'],
 ['timestamps','Datas Discord','Discord timestamps'],['readingTime','Tempo de leitura','Reading time'],
 ['linter','Linter','Linter']
];
function writerV6ProjectPreferences(plugin,indexPath){
 const data=plugin.settings.projectsData?.[indexPath]?.writingSettings;
 return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
}
function writerV6ProjectContext(plugin,path){
 if(!plugin?.app||typeof path!=='string'||!path)return null;
 const indexes=plugin.app.vault.getMarkdownFiles().map(f=>longformIndex(f,plugin.app)).filter(Boolean);
 const selected=plugin.settings.lastLongformProject;
 // Prefer a genuine scene match over merely being inside an index folder.
 const matched=writerBookNavFindProject(plugin.app,path,selected);
 if(matched){
  return {indexPath:matched.index.file.path,prefs:writerV6ProjectPreferences(plugin,matched.index.file.path)};
 }
 const possible=indexes.map(index=>{
  const base=index.file.parent?.path||'',folder=String(index.meta?.sceneFolder||'').replace(/^\/+|\/+$/g,'');
  const root=lfPath(base,folder);
  if(!root||!(path.startsWith(root+'/')||path===index.file.path))return null;
  return {indexPath:index.file.path,size:root.length,prefs:writerV6ProjectPreferences(plugin,index.file.path)};
 }).filter(Boolean).sort((a,b)=>b.size-a.size);
 return possible.find(item=>item.indexPath===selected)||possible[0]||null;
}
function writerV6ProjectToolAllowed(plugin,key,path){
 if(!writerModuleOn(plugin,key))return false;
 const preference=writerV6ProjectContext(plugin,path)?.prefs?.tools?.[key];
 return preference!=='off';
}
function writerV6EditorSourcePath(plugin,editorView){
 for(const leaf of plugin.app.workspace.getLeavesOfType('markdown')||[])
  if(leaf.view?.editor?.cm===editorView)return leaf.view?.file?.path||'';
 return plugin.app.workspace.getActiveFile?.()?.path||'';
}
function writerV6ProjectReviewText(plugin,file){
 const path=typeof file==='string'?file:file?.path;
 const text=writerV6ProjectContext(plugin,path)?.prefs?.reviewProfile;
 return typeof text==='string'?text.trim().slice(0,3000):'';
}
function writerV6ProjectPreferencesRender(view,panel,project){
 if(!project?.file)return;
 const pref=view.prefs(project);
 const cfg=pref.writingSettings&&typeof pref.writingSettings==='object'?pref.writingSettings:(pref.writingSettings={});
 if(!cfg.tools||typeof cfg.tools!=='object')cfg.tools={};
 const root=panel.createDiv({cls:'writer-v6-settings-clean writer-v6-project-prefs'});
 const title=root.createDiv({cls:'writer-v6-settings-section'});
 title.createEl('h3',{text:writerUi('Preferências deste projeto','Preferences for this project')});
 title.createEl('p',{cls:'dictionary-muted',text:writerUi('São armazenadas no Basic AI, não modificam o índice Longform. Herdar usa as configurações globais.','Stored in Basic AI settings without changing the Longform index. Inherit follows global preferences.')});
 const choose=(target,key,pt,en)=>{
  new Setting(target).setName(writerUi(pt,en)).addDropdown(d=>
   d.addOption('inherit',writerUi('Herdar','Inherit'))
    .addOption('on',writerUi('Ativado','Enabled'))
    .addOption('off',writerUi('Desativado','Disabled'))
    .setValue(['on','off'].includes(cfg[key])?cfg[key]:'inherit').onChange(async value=>{
     cfg[key]=value;
     await view.plugin.saveSettings();
     view.plugin.writerBookNavigation?.refreshAutomatic?.();
     writerV6Refresh(view.plugin);
    }));
 };
 choose(title,'navigation','Navegação automática','Automatic navigation');
 const tools=root.createDiv({cls:'writer-v6-settings-section'});
 tools.createEl('h3',{text:writerUi('Ferramentas no projeto','Tools for this project')});
 tools.createEl('p',{cls:'dictionary-muted',text:writerUi('Um módulo oculto globalmente continua oculto aqui. Desativar no projeto não muda outros livros.','Modules hidden globally remain hidden here. Disabling a tool in this project does not affect other books.')});
 for(const [key,pt,en] of WRITER_V6_PROJECT_TOOLS){
  new Setting(tools).setName(writerUi(pt,en)).addDropdown(d=>
   d.addOption('inherit',writerUi('Herdar','Inherit')).addOption('off',writerUi('Desativar aqui','Disable here'))
    .setValue(cfg.tools[key]==='off'?'off':'inherit').onChange(async value=>{
     if(value==='off')cfg.tools[key]='off';else delete cfg.tools[key];
     await view.plugin.saveSettings();writerV6Refresh(view.plugin);
    }));
 }
 const editorial=root.createDiv({cls:'writer-v6-settings-section'});
 editorial.createEl('h3',{text:writerUi('Perfil editorial','Editorial profile')});
 editorial.createEl('p',{cls:'dictionary-muted',text:writerUi('Instruções adicionais usadas nas revisões por IA deste projeto, sem substituir seu perfil global.','Additional instructions for AI reviews in this project without replacing the global profile.')});
 let profile=String(cfg.reviewProfile||'');
 new Setting(editorial).setName(writerUi('Orientações do projeto','Project guidelines')).addTextArea(t=>{
  t.inputEl.rows=3;t.setValue(profile).onChange(v=>profile=v.slice(0,3000));
 }).addButton(b=>b.setButtonText(writerUi('Salvar','Save')).onClick(async()=>{
  cfg.reviewProfile=profile;await view.plugin.saveSettings();
  new Notice(writerUi('Preferências salvas.','Preferences saved.'));
 }));
 const presets=root.createDiv({cls:'writer-v6-settings-section'});
 presets.createEl('h3',{text:writerUi('Perfil de escrita sugerido','Suggested writing profile')});
 let picked=String(cfg.writingPreset||'');
 new Setting(presets).setName(writerUi('Perfil ao trabalhar neste projeto','Profile for this project'))
  .setDesc(writerUi('A aplicação é manual e altera preferências globais até você desfazer.','Applying it manually changes global preferences until you undo.'))
  .addDropdown(d=>{
   d.addOption('',writerUi('Nenhum','None'));
   for(const [key,p] of Object.entries(WRITER_WORKSPACE_PRESETS))d.addOption(key,writerUi(p.labelPt,p.labelEn));
   d.setValue(WRITER_WORKSPACE_PRESETS[picked]?picked:'').onChange(async v=>{picked=v;cfg.writingPreset=v;await view.plugin.saveSettings();});
  }).addButton(b=>b.setButtonText(writerUi('Aplicar','Apply')).onClick(async()=>{
   const preset=WRITER_WORKSPACE_PRESETS[picked];
   if(preset)await view.plugin.writerWorkspaceProfiles.apply(writerUi(preset.labelPt,preset.labelEn),preset.values);
  }));
}
