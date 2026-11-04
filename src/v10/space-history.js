'use strict';
/* Workspace snapshots supplement existing Spaces without moving notes or running code. */
function writerV101SpaceHistoryMerge(settings){
 const raw=settings.v101SpaceHistory&&typeof settings.v101SpaceHistory==='object'?settings.v101SpaceHistory:{};
 const cfg={maxPerSpace:5,history:{}};
 cfg.maxPerSpace=Math.max(2,Math.min(10,Math.floor(Number(raw.maxPerSpace)||5)));
 if(raw.history&&typeof raw.history==='object'&&!Array.isArray(raw.history)){
  for(const [id,items] of Object.entries(raw.history).slice(0,40)){
   if(!/^[a-z0-9_-]{1,72}$/i.test(id)||!Array.isArray(items))continue;
   cfg.history[id]=items.slice(-cfg.maxPerSpace).map(writerV101SpaceHistoryEntry).filter(Boolean);
  }
 }
 settings.v101SpaceHistory=cfg;return cfg;
}
function writerV101SpaceHistoryEntry(raw){
 if(!raw||typeof raw!=='object'||!raw.layout||typeof raw.layout!=='object'||Array.isArray(raw.layout))return null;
 try{
  const layout=JSON.stringify(raw.layout);
  if(layout.length>120000||!layout.length)return null;
  return {name:String(raw.name||'Snapshot').trim().slice(0,70),at:Math.max(0,Number(raw.at)||0),layout:JSON.parse(layout)};
 }catch(_){return null;}
}
function writerV101SpaceSnapshotFingerprint(layout){
 try{return JSON.stringify(layout)||'';}catch(_){return '';}
}
function writerV101SpaceHistoryRemember(plugin,space,layout,name){
 const cfg=plugin.settings.v101SpaceHistory;
 if(!space||!cfg)return false;
 const clean=writerV101SpaceHistoryEntry({name,at:Date.now(),layout});
 if(!clean)return false;
 const items=cfg.history[space.id]||(cfg.history[space.id]=[]);
 const value=writerV101SpaceSnapshotFingerprint(clean.layout);
 if(items.length&&writerV101SpaceSnapshotFingerprint(items[items.length-1].layout)===value)return false;
 items.push(clean);cfg.history[space.id]=items.slice(-cfg.maxPerSpace);
 return true;
}
function writerV101SpaceBeforeOverwrite(plugin,space){
 if(space?.layoutSnapshot)writerV101SpaceHistoryRemember(plugin,space,space.layoutSnapshot,
  writerUi('Layout anterior','Previous layout'));
}
function writerV101SpaceLayoutSummary(layout){
 const types=[];
 const scan=(node,depth)=>{
  if(depth>15||!node||typeof node!=='object'||types.length>=150)return;
  if(typeof node.type==='string'&&node.type.length<=90)types.push(node.type);
  for(const value of Object.values(node)){
   if(Array.isArray(value))for(const child of value.slice(0,30))scan(child,depth+1);
   else if(value&&typeof value==='object')scan(value,depth+1);
  }
 };
 scan(layout,0);
 return {panes:types.filter(t=>t==='leaf').length,types:new Set(types).size};
}
function writerV101SpaceRestoreHistory(plugin,space,entry){
 if(!space||!entry)return Promise.resolve(false);
 const next=writerV101SpaceHistoryEntry(entry);
 if(!next)return Promise.resolve(false);
 const previous=space.layoutSnapshot;
 space.layoutSnapshot=next.layout;
 return Promise.resolve(writerV10SpaceRestoreLayout(plugin,space)).then(async ok=>{
  if(!ok){space.layoutSnapshot=previous;return false;}
  if(previous)writerV101SpaceHistoryRemember(plugin,space,previous,writerUi('Antes da restauração','Before restore'));
  await plugin.saveSettings();return true;
 });
}
function writerV101SpaceHistoryModal(plugin){
 const space=writerV9215ActiveSpace(plugin);
 if(!space){new Notice(writerUi('Selecione um Space ativo para gerenciar layouts.','Select an active Space to manage layouts.'));return;}
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Histórico de layouts · ','Layout history · ')+space.name);
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Snapshots locais; restaurar pode reorganizar suas abas. Suas notas não são alteradas.','Local snapshots; restoring may rearrange tabs. Notes are never modified.')});
  new Setting(root).setName(writerUi('Guardar ponto de restauração','Create restore point'))
   .addButton(button=>button.setButtonText(writerUi('Guardar atual','Save current')).onClick(async()=>{
    const layout=plugin.app.workspace.getLayout?.();
    if(!writerV101SpaceHistoryRemember(plugin,space,layout,writerUi('Manual','Manual'))){
     new Notice(writerUi('Nenhuma mudança no layout ou layout inválido.','Layout unchanged or invalid.'));return;
    }
    await plugin.saveSettings();modal.onOpen();
   }));
  const items=plugin.settings.v101SpaceHistory.history[space.id]||[];
  for(let i=items.length-1;i>=0;i--){
   const entry=items[i],summary=writerV101SpaceLayoutSummary(entry.layout);
   new Setting(root).setName(entry.name||writerUi('Layout salvo','Saved layout'))
    .setDesc(new Date(entry.at||Date.now()).toLocaleString()+' · '+summary.panes+' '+writerUi('painéis','panes'))
    .addButton(button=>button.setButtonText(writerUi('Restaurar','Restore')).onClick(async()=>{
     if(await writerV101SpaceRestoreHistory(plugin,space,entry)){modal.close();}
     else new Notice(writerUi('Não foi possível restaurar o layout.','Could not restore the layout.'));
    }))
    .addExtraButton(button=>button.setIcon('trash-2').setTooltip(writerUi('Excluir checkpoint','Delete checkpoint')).onClick(async()=>{
     items.splice(i,1);await plugin.saveSettings();modal.onOpen();
    }));
  }
  if(!items.length)root.createEl('p',{text:writerUi('Nenhum checkpoint salvo ainda.','No saved checkpoints yet.')});
  new Setting(root).setName(writerUi('Exportar backup deste Space','Export Space backup'))
   .setDesc(writerUi('Copie o JSON e guarde em uma nota ou arquivo seguro.','Copy the JSON to a note or a safe file.'))
   .addButton(button=>button.setButtonText(writerUi('Gerar backup','Generate backup')).onClick(()=>{
    const snapshot=writerV101SpaceHistoryEntry({layout:space.layoutSnapshot,name:space.name,at:Date.now()});
    if(!snapshot){new Notice(writerUi('Salve um layout antes de exportar.','Save a layout before exporting.'));return;}
    const data=JSON.stringify({format:'basic-ai-space-layout-v1',space:space.name,...snapshot},null,2);
    const area=root.createEl('textarea',{cls:'writer-v101-space-json',attr:{readOnly:'', 'aria-label':writerUi('Backup JSON','Backup JSON')}});
    area.value=data;area.focus();area.select();
   }));
  const importWrap=root.createDiv({cls:'writer-v101-space-import'});
  new Setting(importWrap).setName(writerUi('Importar um backup','Import a backup'))
   .setDesc(writerUi('Aceita somente backups exportados pela biblioteca de layouts.','Only accepts layout backups exported here.'));
  const area=importWrap.createEl('textarea',{cls:'writer-v101-space-json',attr:{placeholder:writerUi('Cole aqui o JSON do backup','Paste backup JSON here'),'aria-label':writerUi('JSON para importar','JSON to import')}});
  new Setting(importWrap).addButton(button=>button.setButtonText(writerUi('Importar para este Space','Import into this Space')).onClick(async()=>{
   try{
    if(area.value.length>130000)throw Error('Backup too large');
    const obj=JSON.parse(area.value);
    if(obj.format!=='basic-ai-space-layout-v1')throw Error('Unsupported backup');
    const clean=writerV101SpaceHistoryEntry(obj);
    if(!clean)throw Error('Invalid layout');
    if(space.layoutSnapshot)writerV101SpaceHistoryRemember(plugin,space,space.layoutSnapshot,
     writerUi('Antes de importar','Before import'));
    space.layoutSnapshot=clean.layout;await plugin.saveSettings();modal.onOpen();
    new Notice(writerUi('Backup importado; use Restaurar para aplicá-lo.','Backup imported; use Restore to apply it.'));
   }catch(error){new Notice(writerUi('Backup inválido: ','Invalid backup: ')+String(error.message||error));}
  }));
 };
 modal.open();
}
function writerV101RegisterSpaceHistory(plugin){
 plugin.addCommand?.({id:'v101-space-layout-history',name:writerUi('Spaces: histórico e backups de layout','Spaces: layout history and backups'),
  callback:()=>writerV101SpaceHistoryModal(plugin)});
}
function writerV101SpaceHistorySettings(plugin,panel){
 new Setting(panel).setName(writerUi('Histórico e backups por Space','Space layout history & backups'))
  .setDesc(writerUi('Crie checkpoints, restaure versões, importe ou exporte seu layout.','Checkpoint, restore, import or export layouts.'))
  .addButton(b=>b.setButtonText(writerUi('Abrir histórico','Open history')).onClick(()=>writerV101SpaceHistoryModal(plugin)));
 new Setting(panel).setName(writerUi('Checkpoints por Space','Checkpoints per Space'))
  .addDropdown(drop=>{
   for(const number of [2,3,5,8,10])drop.addOption(String(number),String(number));
   drop.setValue(String(plugin.settings.v101SpaceHistory.maxPerSpace)).onChange(async value=>{
    const cfg=plugin.settings.v101SpaceHistory;cfg.maxPerSpace=Number(value);
    for(const items of Object.values(cfg.history))if(items.length>cfg.maxPerSpace)items.splice(0,items.length-cfg.maxPerSpace);
    await plugin.saveSettings();
   });
  });
}
