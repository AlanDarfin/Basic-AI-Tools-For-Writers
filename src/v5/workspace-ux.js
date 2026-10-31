'use strict';
/* Basic AI 5.1 — safe writing presets, settings finder and local shortcut audit. */
const WRITER_WORKSPACE_DEFAULTS={lastPreset:'',saved:[],undo:null};
const WRITER_WORKSPACE_FIELDS={
 'keyshots':['enabled','shortcuts','preset'],
 'easyTyping':['enabled','tabOut','smartPaste','smartBackspace','autoCapitalize','cjkSpacing','regexEnabled'],
 'smartTypography':['enabled','curlyQuotes','dashes','ellipsis','arrows','comparisons','fractions'],
 'extendedSyntax':['enabled','livePreview','spoiler','coloredHighlight'],
 'pandocSyntax':['enabled','fancyLists','definitionLists','outline'],
 'autoGrammar':['enabled'],
 'writerV4Extras.typewriter':['enabled','focusMode']
};
const WRITER_WORKSPACE_PRESETS={
 novel:{labelPt:'Romance',labelEn:'Novel',values:{keyshots:{enabled:true},easyTyping:{enabled:true,tabOut:true,smartPaste:true,autoCapitalize:false},smartTypography:{enabled:true,curlyQuotes:true,dashes:true,ellipsis:true},autoGrammar:{enabled:false},'writerV4Extras.typewriter':{enabled:true,focusMode:false}}},
 study:{labelPt:'Estudos',labelEn:'Study',values:{keyshots:{enabled:false},easyTyping:{enabled:true,smartPaste:true,autoCapitalize:false},smartTypography:{enabled:false},extendedSyntax:{enabled:true},pandocSyntax:{enabled:true},'writerV4Extras.typewriter':{enabled:false}}},
 review:{labelPt:'Revisão',labelEn:'Revision',values:{keyshots:{enabled:false},easyTyping:{enabled:true,autoCapitalize:false},smartTypography:{enabled:false},autoGrammar:{enabled:true},'writerV4Extras.typewriter':{enabled:false}}},
 markdown:{labelPt:'Markdown técnico',labelEn:'Technical Markdown',values:{keyshots:{enabled:true,shortcuts:false},easyTyping:{enabled:true,tabOut:true,smartPaste:false,regexEnabled:false},smartTypography:{enabled:false},extendedSyntax:{enabled:true,livePreview:true},pandocSyntax:{enabled:true},autoGrammar:{enabled:false},'writerV4Extras.typewriter':{enabled:false}}}
};
function writerWorkspaceTarget(settings,name){
 let target=settings;
 for(const part of name.split('.')){target=target?.[part];if(!target||typeof target!=='object')return null;}
 return target;
}
function writerWorkspaceCapture(settings){
 const values={};
 for(const [name,keys] of Object.entries(WRITER_WORKSPACE_FIELDS)){
  const obj=writerWorkspaceTarget(settings,name);if(!obj)continue;
  const copy={};
  for(const key of keys)if(typeof obj[key]==='boolean'||typeof obj[key]==='string')copy[key]=obj[key];
  if(Object.keys(copy).length)values[name]=copy;
 }
 return values;
}
function writerWorkspaceApplyValues(settings,values){
 for(const [name,fields] of Object.entries(values||{})){
  if(!Object.hasOwn(WRITER_WORKSPACE_FIELDS,name)||!fields||typeof fields!=='object')continue;
  const target=writerWorkspaceTarget(settings,name);
  if(!target)continue;
  for(const [key,value] of Object.entries(fields)){
   if(!WRITER_WORKSPACE_FIELDS[name].includes(key))continue;
   if(key==='preset'&&(!['vscode','jetbrains','none'].includes(value)))continue;
   if(key!=='preset'&&typeof value!=='boolean')continue;
   target[key]=value;
  }
 }
}
function writerWorkspaceMerge(settings){
 const prev=settings.workspaceProfiles,valid=prev&&typeof prev==='object'&&!Array.isArray(prev)?prev:{};
 const cfg=settings.workspaceProfiles={...WRITER_WORKSPACE_DEFAULTS,...valid};
 cfg.saved=Array.isArray(cfg.saved)?cfg.saved.filter(item=>item&&typeof item.name==='string'&&item.name.length<=60&&item.name.trim()&&typeof item.values==='object').slice(0,10).map(item=>({name:item.name,values:item.values})):[];
 cfg.lastPreset=typeof cfg.lastPreset==='string'?cfg.lastPreset.slice(0,60):'';
 if(!cfg.undo||typeof cfg.undo!=='object'||Array.isArray(cfg.undo))cfg.undo=null;
 return cfg;
}
function writerWorkspaceSearchNormalize(value){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
}
const WRITER_WORKSPACE_HINTS={
 general:'geral idioma linguagem general language',
 modules:'modulos visibilidade ocultar esconder show hide toggles',
 diagnostics:'diagnostico conflito atalhos teclas keymap hotkeys problems conflicts performance',
 workspaceProfiles:'perfil modo escrita romance estudo revisão tecnico focus profile preset novel study revision markdown',
 keyshots:'teclado linhas duplicar mover cursor atalho editor',
 extendedSyntax:'sublinhado spoiler highlight sobrescrito subscrito syntax underline',
 pandocSyntax:'pandoc exportacao docx pdf epub html listas',
 easyTyping:'digitar substituicao regex tab backspace colagem paste snippets espaco',
 smartTypography:'tipografia aspas apostrofos reticencias travessao frações guillemets',
 review:'languagetool corretor gramatica automático',
 snapshots:'versoes backup restaurar snapshot',
 translation:'tradutor idiomas translated',
 tts:'voz leitura audio voz alta'
};
function writerWorkspaceSearchSections(sections,query){
 const q=writerWorkspaceSearchNormalize(query);
 if(!q)return [];
 const terms=q.split(/\s+/).filter(Boolean);
 return sections.filter(([id,label])=>{
  const hay=writerWorkspaceSearchNormalize(id+' '+label+' '+(WRITER_WORKSPACE_HINTS[id]||''));
  return terms.every(t=>hay.includes(t));
 }).slice(0,12);
}
function writerWorkspaceFilterRows(panel,query){
 const q=writerWorkspaceSearchNormalize(query);
 let visible=0;
 for(const row of panel.querySelectorAll('.setting-item')){
  const hay=writerWorkspaceSearchNormalize(row.textContent||'');
  row.hidden=Boolean(q&&!q.split(/\s+/).every(t=>hay.includes(t)));
  if(!row.hidden)visible++;
 }
 return visible;
}
function writerWorkspaceBindSearch(root,sections,onOpen,getPanel,getActive){
 const wrap=root.createDiv({cls:'writer-v51-search'});
 const label=wrap.createEl('label',{text:writerUi('Buscar nas configurações','Search settings')});
 const input=wrap.createEl('input',{type:'search',attr:{placeholder:writerUi('Procure opções ou categorias…','Find options or categories…'),'aria-label':writerUi('Buscar configurações','Search settings')}});
 label.setAttribute('for','writer-v51-settings-search');
 input.id='writer-v51-settings-search';
 const feedback=wrap.createDiv({cls:'writer-v51-search-results',attr:{role:'status','aria-live':'polite'}});
 const update=()=>{
  const q=input.value.trim();
  feedback.empty();
  const matches=writerWorkspaceSearchSections(sections,q);
  const active=sections.find(([id])=>id===getActive());
  const categoryHit=active&&writerWorkspaceSearchNormalize(active[1]+' '+(WRITER_WORKSPACE_HINTS[active[0]]||'')).includes(writerWorkspaceSearchNormalize(q));
  const count=writerWorkspaceFilterRows(getPanel(),q&&categoryHit?'':q);
  if(!q)return;
  feedback.createSpan({text:writerUi('Categorias: ','Categories: ')+matches.length+' · '+writerUi('Opções nesta aba: ','Options in current tab: ')+count});
  for(const [id,title] of matches){
   const button=feedback.createEl('button',{text:title,attr:{type:'button'}});
   button.addEventListener('click',()=>{onOpen(id);update();});
  }
 };
 input.addEventListener('input',update);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){input.value='';update();}
  if(event.key==='Enter'){const first=writerWorkspaceSearchSections(sections,input.value)[0];if(first){event.preventDefault();onOpen(first[0]);update();}}
 });
 return {update,input};
}
function writerWorkspaceNormalizeShortcut(key){
 return String(key||'').toLowerCase().replace(/command|cmd|ctrl|control/g,'mod').replace(/arrow/g,'').split('-').filter(Boolean).sort().join('-');
}
function writerWorkspaceHotkeyAudit(plugin){
 const items=[],status=[],cfg=plugin.settings;
 if(!plugin.app.isMobile&&writerModuleOn(plugin,'keyshots')&&cfg.keyshots?.enabled&&cfg.keyshots.shortcuts){
  for(const [key,action] of writerKeyshotsBindings(cfg.keyshots.preset))items.push({key,action:'Keyshots: '+action,owner:'basic'});
 }
 if(writerModuleOn(plugin,'easyTyping')&&cfg.easyTyping?.enabled){
  if(cfg.easyTyping.tabOut)items.push({key:'Tab',action:'Easy Typing: tab-out (context only)',owner:'basic'});
  if(cfg.easyTyping.smartBackspace)items.push({key:'Backspace',action:'Easy Typing: empty list (context only)',owner:'basic'});
  items.push({key:'Shift-Tab',action:'Easy Typing: previous snippet (context only)',owner:'basic'});
 }
 const duplicates=[],seen=new Map();
 for(const item of items){
  const normalized=writerWorkspaceNormalizeShortcut(item.key);
  if(seen.has(normalized))duplicates.push({key:item.key,first:seen.get(normalized),second:item.action,kind:'internal'});
  else seen.set(normalized,item.action);
 }
 // Obsidian does not expose a documented, complete registry of other plugins' CodeMirror keymaps.
 // Only scan hotkeys exposed by an available host API; absence never means "no conflicts".
 const hotkeys=plugin.app.hotkeyManager;
 let hostScanned=false;
 if(hotkeys&&typeof hotkeys.getHotkeys==='function'&&typeof plugin.app.commands?.listCommands==='function'){
  try{
   for(const command of plugin.app.commands.listCommands().slice(0,4000)){
    if(!command?.id||command.id.startsWith(plugin.manifest.id+':'))continue;
    const keys=hotkeys.getHotkeys(command.id);
    if(!Array.isArray(keys))continue;
    hostScanned=true;
    for(const shortcut of keys){
     const mods=Array.isArray(shortcut.modifiers)?shortcut.modifiers.join('-')+'-':'';
     const combo=writerWorkspaceNormalizeShortcut(mods+shortcut.key);
     for(const own of items)if(writerWorkspaceNormalizeShortcut(own.key)===combo)
      duplicates.push({key:own.key,first:own.action,second:command.name||command.id,kind:'host'});
    }
   }
  }catch(error){status.push('Host hotkey API unavailable');hostScanned=false;}
 }
 return {items,duplicates,hostScanned,status};
}
class WriterWorkspaceProfiles{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.workspaceProfiles;}
 async apply(name,values){
  this.cfg.undo=writerWorkspaceCapture(this.plugin.settings);
  writerWorkspaceApplyValues(this.plugin.settings,values);
  this.cfg.lastPreset=name;
  await this.plugin.saveSettings();
  this.plugin.writerV4Extras?.updateTypewriterClass?.();
  this.plugin.refreshModuleVisibility?.();
  writerV5RefreshEditors(this.plugin);
  new Notice(writerUi('Perfil aplicado: ','Applied profile: ')+name);
 }
 async undo(){
  if(!this.cfg.undo)return;
  const old=this.cfg.undo;this.cfg.undo=null;
  writerWorkspaceApplyValues(this.plugin.settings,old);
  await this.plugin.saveSettings();this.plugin.writerV4Extras?.updateTypewriterClass?.();writerV5RefreshEditors(this.plugin);
  new Notice(writerUi('Preferências anteriores restauradas.','Previous preferences restored.'));
 }
 async saveCustom(name){
  const title=String(name||'').trim().slice(0,60);
  if(!title)return;
  if(this.cfg.saved.some(item=>item.name.toLowerCase()===title.toLowerCase()))return new Notice(writerUi('Já existe um perfil com esse nome.','A profile with that name already exists.'));
  this.cfg.saved.push({name:title,values:writerWorkspaceCapture(this.plugin.settings)});
  this.cfg.saved=this.cfg.saved.slice(-10);
  await this.plugin.saveSettings();
  new Notice(writerUi('Perfil salvo: ','Saved profile: ')+title);
 }
 register(){
  this.plugin.addCommand({id:'v51-choose-workspace-profile',name:writerUi('Perfis de escrita: escolher perfil','Writing profiles: choose preset'),callback:()=>this.openPicker()});
  this.plugin.addCommand({id:'v51-undo-workspace-profile',name:writerUi('Perfis de escrita: desfazer última troca','Writing profiles: undo last change'),checkCallback:checking=>{
   if(!this.cfg.undo)return false;
   if(!checking)this.undo();
   return true;
  }});
 }
 openPicker(){
  const plugin=this.plugin,controller=this;
  class Picker extends FuzzySuggestModal{
   getItems(){return [
    ...Object.entries(WRITER_WORKSPACE_PRESETS).map(([key,p])=>({name:writerUi(p.labelPt,p.labelEn),value:key,values:p.values})),
    ...controller.cfg.saved.map(item=>({name:item.name,value:item.name,values:item.values}))
   ];}
   getItemText(item){return item.name;}
   onChooseItem(item){controller.apply(item.name,item.values);}
  }
  new Picker(plugin.app).open();
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Perfis rápidos de escrita','Quick writing profiles')});
  panel.createEl('p',{text:writerUi('Alterne preferências de edição, não conteúdo. Não altera chaves de API, textos, prompts, snapshots ou dicionários. A última troca pode ser desfeita.','Switch editor preferences, never document content. API keys, prompts, snapshots and dictionaries are untouched. The previous setup can be restored.'),cls:'dictionary-muted'});
  const items=[...Object.entries(WRITER_WORKSPACE_PRESETS).map(([key,p])=>({key,label:writerUi(p.labelPt,p.labelEn),values:p.values})),...this.cfg.saved.map(item=>({key:'custom:'+item.name,label:item.name,values:item.values}))];
  const selector=panel.createDiv({cls:'writer-v51-profile-actions'});
  let chosen=items[0]?.key;
  new Setting(selector).setName(writerUi('Escolher perfil','Choose profile')).addDropdown(d=>{
   for(const item of items)d.addOption(item.key,item.label);
   d.onChange(value=>chosen=value);
  }).addButton(b=>b.setButtonText(writerUi('Aplicar','Apply')).setCta().onClick(async()=>{
   const item=items.find(x=>x.key===chosen);if(item)await this.apply(item.label,item.values);
  }));
  new Setting(panel).setName(writerUi('Guardar perfil atual','Save current profile'))
   .setDesc(writerUi('Salva somente opções de edição permitidas, até 10 perfis.','Saves only selected editor preferences, up to 10 profiles.'))
   .addButton(b=>b.setButtonText(writerUi('Salvar como…','Save as…')).onClick(()=>{
    new TextPrompt(this.plugin.app,writerUi('Nome do perfil','Profile name'),value=>this.saveCustom(value)).open();
   }));
  if(this.cfg.saved.length){
   new Setting(panel).setName(writerUi('Excluir perfil salvo','Delete saved profile')).addDropdown(d=>{
    for(const item of this.cfg.saved)d.addOption(item.name,item.name);
    d.onChange(v=>this.selectedToDelete=v);
   }).addButton(b=>b.setButtonText(writerUi('Excluir','Delete')).onClick(async()=>{
    const name=this.selectedToDelete||this.cfg.saved[0]?.name;
    this.cfg.saved=this.cfg.saved.filter(x=>x.name!==name);await this.plugin.saveSettings();this.plugin.settingsTab?.display?.();
   }));
  }
  new Setting(panel).setName(writerUi('Desfazer última aplicação','Undo last application'))
   .addButton(b=>b.setButtonText(writerUi('Restaurar','Restore')).setDisabled(!this.cfg.undo).onClick(()=>this.undo()));
 }
}
function writerWorkspaceRenderHotkeys(plugin,panel){
 panel.createEl('h3',{text:writerUi('Diagnóstico de atalhos','Shortcut diagnostics')});
 const container=panel.createDiv({cls:'writer-v51-hotkey-audit'});
 const render=()=>{
  container.empty();
  const audit=writerWorkspaceHotkeyAudit(plugin);
  container.createEl('p',{text:writerUi('Atalhos monitorados: ','Tracked keys: ')+audit.items.length+' · '+writerUi('Colisões identificadas: ','Detected overlaps: ')+audit.duplicates.length});
  if(audit.duplicates.length){
   for(const issue of audit.duplicates.slice(0,30)){
    const row=container.createDiv({cls:'writer-v51-conflict'});
    row.createEl('strong',{text:issue.key});
    row.createSpan({text:issue.first+' ↔ '+issue.second});
   }
  }else container.createEl('p',{text:writerUi('Nenhuma duplicação detectada entre as combinações verificadas.','No duplicate bindings found among inspected combinations.')});
  container.createEl('p',{text:audit.hostScanned
   ?writerUi('Atalhos de comandos expostos pelo Obsidian também foram comparados.','Exposed Obsidian command hotkeys were inspected.')
   :writerUi('Obsidian não expôs aqui todos os atalhos de outros plugins. O relatório não garante ausência de conflitos.','Obsidian did not expose every other plugin shortcut; a clean report is not a guarantee.')});
  container.createEl('p',{text:writerUi('Combinações contextuais (Tab/Backspace) só atuam quando o editor reconhece uma situação compatível.','Context-dependent Tab/Backspace bindings only act when a matching editor context exists.')});
 };
 render();
 new Setting(panel).setName(writerUi('Rever ou desativar atalhos de Keyshots','Review Keyshots shortcuts')).addButton(b=>b.setButtonText(writerUi('Desativar perfil automático','Disable preset shortcuts')).onClick(async()=>{
  if(plugin.settings.keyshots){plugin.settings.keyshots.shortcuts=false;plugin.settings.keyshots.preset='none';await plugin.saveSettings();render();}
 }));
 new Setting(panel).setName(writerUi('Atualizar diagnóstico','Refresh shortcut audit')).addButton(b=>b.setButtonText(writerUi('Analisar','Scan')).onClick(render));
}
