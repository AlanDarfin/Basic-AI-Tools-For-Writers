'use strict';
/* v11 Markdown database interactions: typed property editor and safe board movement.
 * No proprietary store, no automatic mutation and no remote connections. */
function writerV11DbPropertyKey(value){
 const key=String(value||'').trim();
 return /^[a-zA-Z_][\w-]{0,59}$/.test(key)&&!['__proto__','prototype','constructor','file','path','created','modified'].includes(key)?key:'';
}
function writerV11DbValue(type,raw){
 if(type==='checkbox')return raw===true||raw==='true';
 if(type==='number'){
  const n=Number(raw);
  if(!String(raw).trim()||!Number.isFinite(n))throw Error('Invalid numeric value');
  return n;
 }
 if(type==='date'){
  if(typeof writerV1011NotionDate!=='function'||!writerV1011NotionDate(raw))throw Error('Invalid ISO date');
  return String(raw);
 }
 if(type==='tags'){
  const values=String(raw||'').split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean);
  if(values.some(x=>!/^[\p{L}\p{N}_/-]{1,80}$/u.test(x)))throw Error('Invalid tag');
  return [...new Set(values)].slice(0,50);
 }
 return String(raw||'').slice(0,3000);
}
async function writerV11DbChangeGroup(plugin,row,key,value){
 if(!writerV11DbPropertyKey(key))throw Error('Invalid group property');
 if(!plugin.settings.v107Db?.editable)throw Error(writerUi('Ative a edição de bancos nas configurações.','Enable database editing in settings.'));
 const file=row.file,previous=String(row.data[key]??'');
 if(previous===String(value))return false;
 // Compare the effective property before and during the atomic frontmatter operation.
 const cache=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter;
 if(cache&&String(cache[key]??'')!==previous)throw Error(writerUi('O status mudou. Atualize a visualização.','Status changed. Refresh the view.'));
 if(plugin.writerSnapshots?.config?.enabled)
  await plugin.writerSnapshots.create(file,writerUi('Antes de mover cartão','Before moving card'));
 await plugin.app.fileManager.processFrontMatter(file,fm=>{
  if(String(fm[key]??'')!==previous)throw Error(writerUi('Conflito detectado ao mover cartão.','Conflict detected while moving card.'));
  fm[key]=String(value).slice(0,120);
 });
 return true;
}
function writerV11DbPropertyModal(plugin,file){
 if(!(file instanceof TFile)||file.extension!=='md')return new Notice(writerUi('Selecione uma nota Markdown.','Select a Markdown note.'));
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Propriedades tipadas','Typed properties'));
 let key='',type='text',raw='',approved=false,base='';
 modal.onOpen=async()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Edite uma propriedade por vez, com prévia e snapshot. O arquivo só é alterado ao confirmar.',
   'Edit one property at a time with a preview and snapshot. The file changes only after confirmation.')});
  try{base=await plugin.app.vault.read(file);}catch(e){root.createEl('p',{text:String(e.message||e)});return;}
  const preview=root.createDiv({cls:'writer-v11-property-preview'});
  const render=()=>{
   preview.empty();
   const valid=writerV11DbPropertyKey(key);
   if(!valid){preview.createEl('small',{text:writerUi('Informe uma chave YAML válida.','Enter a valid YAML property key.')});return;}
   try{
    const next=writerV11DbValue(type,raw);
    const old=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter?.[valid];
    preview.createEl('p',{text:valid+': '+JSON.stringify(old??null)+' → '+JSON.stringify(next)});
   }catch(e){preview.createEl('small',{text:String(e.message||e)});}
  };
  new Setting(root).setName(writerUi('Nome da propriedade','Property name'))
   .addText(t=>t.setPlaceholder('status').onChange(v=>{key=v;render();}));
  new Setting(root).setName(writerUi('Tipo','Type')).addDropdown(d=>{
   for(const [value,pt,en] of [['text','Texto','Text'],['number','Número','Number'],['checkbox','Checkbox','Checkbox'],['date','Data ISO','ISO date'],['tags','Tags','Tags']])
    d.addOption(value,writerUi(pt,en));
   d.onChange(v=>{type=v;render();});
  });
  new Setting(root).setName(writerUi('Valor','Value')).addTextArea(t=>t.onChange(v=>{raw=v;render();}));
  new Setting(root).setName(writerUi('Confirmo a edição da nota','I confirm editing this note'))
   .addToggle(t=>t.setValue(false).onChange(v=>{approved=v;}));
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Salvar propriedade','Save property')).setCta().onClick(async()=>{
   if(!approved)return new Notice(writerUi('Confirme a operação.','Confirm the operation.'));
   const prop=writerV11DbPropertyKey(key);
   if(!prop)return new Notice(writerUi('Nome de propriedade inválido.','Invalid property name.'));
   let next;try{next=writerV11DbValue(type,raw);}catch(e){return new Notice(String(e.message||e));}
   b.setDisabled(true);
   try{
    if(await plugin.app.vault.read(file)!==base)throw Error(writerUi('A nota mudou: operação cancelada.','Note changed: operation cancelled.'));
    if(plugin.writerSnapshots?.config?.enabled)
     await plugin.writerSnapshots.create(file,writerUi('Antes de editar propriedade v11','Before v11 property edit'),{content:base});
    await plugin.app.fileManager.processFrontMatter(file,fm=>{fm[prop]=next;});
    modal.close();new Notice(writerUi('Propriedade atualizada.','Property updated.'));
   }catch(e){new Notice(String(e.message||e));}
   finally{b.setDisabled(false);}
  }));
  render();
 };
 modal.open();
}
function writerV11DbRegister(plugin){
 plugin.addCommand({id:'v11-property-editor',name:writerUi('Bancos: editar propriedade tipada','Databases: edit typed property'),
  callback:()=>writerV11DbPropertyModal(plugin,plugin.app.workspace.getActiveFile?.())});
}
