'use strict';
/* Basic AI v3: local per-note snapshots, separate store to avoid altering Note Snapshots data. */
function writerDiffLines(before,after,limit=500){
 const oldLines=String(before).split('\n'),newLines=String(after).split('\n');
 if(oldLines.length>limit||newLines.length>limit)return {truncated:true,removed:oldLines.length,added:newLines.length,changes:[]};
 const n=oldLines.length,m=newLines.length,rows=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)rows[i][j]=oldLines[i]===newLines[j]?1+rows[i+1][j+1]:Math.max(rows[i+1][j],rows[i][j+1]);
 const changes=[];let i=0,j=0;
 while(i<n||j<m){
  if(i<n&&j<m&&oldLines[i]===newLines[j]){changes.push({type:'same',line:oldLines[i++]});j++;}
  else if(j<m&&(i>=n||rows[i][j+1]>=rows[i+1][j]))changes.push({type:'add',line:newLines[j++]});
  else if(i<n)changes.push({type:'remove',line:oldLines[i++]});
 }
 return {truncated:false,changes,added:changes.filter(x=>x.type==='add').length,removed:changes.filter(x=>x.type==='remove').length};
}
class WriterSnapshots{
 constructor(plugin){this.plugin=plugin;this.lastAuto=new Map();this.jobs=new Map();}
 get config(){return this.plugin.settings.snapshots||WRITER_V3_DEFAULTS.snapshots;}
 path(...parts){
  const all=parts.flatMap(v=>String(v||'').split('/')).filter(Boolean);
  if(all.some(s=>s==='.'||s==='..'||s.includes('\\')))throw Error(writerUi('Caminho inseguro para histórico.','Unsafe history path.'));
  return all.join('/');
 }
 root(){
  const root=String(this.config.store||'.basic-ai-history').trim().replace(/\/+$/,'');
  if(!root||root.startsWith('/')||root.split('/').some(p=>p==='..'||p==='.')||root.includes('\\'))throw Error(writerUi('Pasta de histórico inválida.','Invalid history folder.'));
  return root;
 }
 async mkdir(path){
  const adapter=this.plugin.app.vault.adapter;let part='';
  for(const segment of path.split('/').filter(Boolean)){
   part=part?part+'/'+segment:segment;
   if(!(await adapter.exists(part)))await adapter.mkdir(part);
  }
 }
 identity(file){
  const map=this.config.identityMap||(this.config.identityMap={});
  if(map[file.path])return map[file.path];
  const id='n'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  map[file.path]=id;return id;
 }
 folder(file){const id=this.identity(file);if(!/^n[a-z0-9-]+$/i.test(id))throw Error(writerUi('Identidade de nota inválida.','Invalid note identity.'));return this.path(this.root(),id);}
 async manifest(file){
  const path=this.path(this.folder(file),'manifest.json');
  if(!(await this.plugin.app.vault.adapter.exists(path)))return {version:1,notePath:file.path,snapshots:[]};
  try{
   const obj=JSON.parse(await this.plugin.app.vault.adapter.read(path));
   if(!Array.isArray(obj.snapshots))throw Error(writerUi('Manifesto inválido.','Invalid manifest.'));
   return obj;
  }catch(e){throw Error(writerUi('Não foi possível ler o histórico. Nada será sobrescrito: ','Could not read history. Nothing will be overwritten: ')+e.message);}
 }
 async writeManifest(file,data){
  const path=this.path(this.folder(file),'manifest.json'),adapter=this.plugin.app.vault.adapter;
  await this.mkdir(this.folder(file));
  // Backup old manifest if it exists before writing.
  if(await adapter.exists(path)){
   const copy=this.path(this.folder(file),'manifest.previous.json');
   await adapter.write(copy,await adapter.read(path));
  }
  await adapter.write(path,JSON.stringify(data,null,2));
 }
 async digest(data){
  const arr=data instanceof ArrayBuffer?data:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
  if(typeof crypto!=='undefined'&&crypto.subtle?.digest){
   const hash=await crypto.subtle.digest('SHA-256',arr);
   return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  // FNV hash fallback used only as a non-cryptographic content key on unsupported runtimes.
  const bytes=new Uint8Array(arr);let h=2166136261;
  for(const n of bytes)h=Math.imul(h^n,16777619);
  return 'fnv'+(h>>>0).toString(16)+'-'+bytes.length;
 }
 attachmentLinks(source,file){
  const links=new Set(),re=/!\[\[([^\]]+)\]\]|!\[[^\]]*\]\(([^)]+)\)/g;
  let match;while((match=re.exec(source))){
   let raw=(match[1]||match[2]||'').split('|')[0].split('#')[0].trim();
   try{raw=decodeURIComponent(raw.replace(/^<|>$/g,'')).trim();}catch(_){continue;}
   if(!raw||/^[a-z]+:\/\//i.test(raw)||raw.startsWith('data:'))continue;
   const found=this.plugin.app.metadataCache.getFirstLinkpathDest(raw,file.path);
   if(found instanceof TFile&&found.extension!=='md')links.add(found);
   if(links.size>=30)break;
  }
  return [...links];
 }
 async captureAttachments(file,source,folder){
  const refs=[],adapter=this.plugin.app.vault.adapter;
  const dir=this.path(folder,'attachments');await this.mkdir(dir);
  let used=0;
  for(const target of this.attachmentLinks(source,file)){
   if(target.stat?.size>20*1024*1024||used+(target.stat?.size||0)>40*1024*1024)continue;
   const bytes=await this.plugin.app.vault.readBinary(target);
   if(bytes.byteLength>20*1024*1024||used+bytes.byteLength>40*1024*1024)continue;
   const hash=await this.digest(bytes);
   const extension=String(target.extension||'bin').replace(/[^a-z0-9]/gi,'').slice(0,10)||'bin';
   const stored=this.path(dir,hash+'.'+extension);
   if(!(await adapter.exists(stored)))await adapter.writeBinary(stored,bytes);
   refs.push({path:target.path,stored,hash,size:bytes.byteLength});
   used+=bytes.byteLength;
  }
  return refs;
 }
 async create(file,name=writerUi('Versão manual','Manual version'),options={}){
  if(!this.config.enabled)throw Error('Snapshots desativados.');
  if(!(file instanceof TFile)||file.extension!=='md')throw Error(writerUi('Selecione uma nota Markdown.','Select a Markdown note.'));
  const text=options.content??await writerCurrentText(this.plugin,file);
  const folder=this.folder(file);await this.mkdir(folder);
  const manifest=await this.manifest(file);
  const entry={id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),at:new Date().toISOString(),name:String(name||writerUi('Versão manual','Manual version')).slice(0,120),size:text.length,attachments:[]};
  const path=this.path(folder,entry.id+'.md'),adapter=this.plugin.app.vault.adapter;
  await adapter.write(path,text);
  try{
   if(options.attachments??this.config.includeAttachments)entry.attachments=await this.captureAttachments(file,text,folder);
   manifest.notePath=file.path;manifest.snapshots.push(entry);
   await this.writeManifest(file,manifest);
   await this.prune(file,manifest);
   await this.plugin.saveSettings();
   return entry;
  }catch(e){throw Error(writerUi('O snapshot foi salvo, mas o índice não foi atualizado: ','Snapshot saved, but the index was not updated: ')+e.message);}
 }
 async prune(file,manifest){
  const max=Number(this.config.maxPerNote)||0,days=Number(this.config.retentionDays)||0;
  if(max<=0&&days<=0)return;
  const now=Date.now(),byDate=days>0?now-days*86400000:0;
  const expired=manifest.snapshots.filter((x,i)=>(max>0&&i<manifest.snapshots.length-max)||(byDate&&Date.parse(x.at)<byDate));
  if(!expired.length)return;
  const keep=manifest.snapshots.filter(x=>!expired.includes(x));
  await this.writeManifest(file,{...manifest,snapshots:keep});
  for(const item of expired){
   const path=this.path(this.folder(file),item.id+'.md');
   if(await this.plugin.app.vault.adapter.exists(path))await this.plugin.app.vault.adapter.remove(path);
  }
  // Deduplicated attachments are retained to protect other snapshots.
 }
 async list(file){return (await this.manifest(file)).snapshots.slice().reverse();}
 async read(file,entry){
  if(!/^s[a-z0-9]+$/i.test(String(entry.id)))throw Error(writerUi('ID de versão inválido.','Invalid version ID.'));
  const path=this.path(this.folder(file),entry.id+'.md');
  if(!(await this.plugin.app.vault.adapter.exists(path)))throw Error(writerUi('Conteúdo desta versão não foi encontrado.','Version content not found.'));
  return this.plugin.app.vault.adapter.read(path);
 }
 async restore(file,entry,attachments=false){
  const text=await this.read(file,entry);
  const live=await writerCurrentText(this.plugin,file);
  if(this.config.snapshotBeforeRestore!==false&&this.config.enabled)await this.create(file,writerUi('Antes de restaurar ','Before restoring ')+entry.name,{content:live});
  const editor=writerActiveEditor(this.plugin,file);
  if(editor)editor.setValue(text);
  else await this.plugin.app.vault.process(file,()=>text);
  let restored=0,skipped=0;
  if(attachments)for(const item of entry.attachments||[]){
   if(typeof item.path!=='string'||item.path.startsWith('/')||item.path.split('/').some(x=>x==='..'||x==='.')||item.path.includes('\\')){skipped++;continue;}
   const dst=this.plugin.app.vault.getAbstractFileByPath(item.path);
   // NEVER overwrite existing attachment files: they may be shared with other notes.
   if(dst||await this.plugin.app.vault.adapter.exists(item.path)){skipped++;continue;}
   const stored=this.path(this.folder(file),'attachments',item.stored.split('/').pop());
   if(!(await this.plugin.app.vault.adapter.exists(stored))){skipped++;continue;}
   const binary=await this.plugin.app.vault.adapter.readBinary(stored);
   const parent=item.path.split('/').slice(0,-1).join('/');
   if(parent)await this.mkdir(parent);
   await this.plugin.app.vault.createBinary(item.path,binary);restored++;
  }
  return {restored,skipped};
 }
 async delete(file,entry){
  const data=await this.manifest(file);
  const current=data.snapshots.find(x=>x.id===entry.id);if(!current)return;
  data.snapshots=data.snapshots.filter(x=>x.id!==entry.id);
  await this.writeManifest(file,data);
  const path=this.path(this.folder(file),entry.id+'.md');
  if(await this.plugin.app.vault.adapter.exists(path))await this.plugin.app.vault.adapter.remove(path);
 }
 onRename(file,oldPath){
  const map=this.config.identityMap||{};
  if(map[oldPath]){map[file.path]=map[oldPath];delete map[oldPath];this.plugin.saveSettings();}
 }
 onModify(file){
  if(!this.config.enabled||!this.config.automatic||!(file instanceof TFile)||file.extension!=='md'||file.path.startsWith(this.root()+'/'))return;
  const delay=Math.max(60,Number(this.config.autoDelaySeconds)||300)*1000;
  const last=this.lastAuto.get(file.path)||0;
  if(Date.now()-last<delay)return;
  this.lastAuto.set(file.path,Date.now());
  this.create(file,writerUi('Automático','Automatic')).catch(e=>console.warn('[Basic AI] Autosnapshot:',e));
 }
 async showHistory(file){
  if(!(file instanceof TFile)||file.extension!=='md')return new Notice(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
  const modal=new Modal(this.plugin.app);
  const render=async()=>{
   modal.contentEl.empty();modal.setTitle(writerUi("Histórico de versões · ","Version history · ")+file.basename);
   const snapshots=await this.list(file);
   modal.contentEl.createEl('p',{text:snapshots.length+writerUi(' versões · histórico local do Basic AI',' versions · local Basic AI history')});
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi("Salvar versão agora","Save version now")).setCta().onClick(async()=>{
    await this.create(file,writerUi('Manual','Manual'));await render();
   })).addButton(b=>b.setButtonText(writerUi("Nomear versão","Name a version")).onClick(()=>{
    const prompt=new Modal(this.plugin.app);let label='';
    prompt.onOpen=()=>{prompt.setTitle(writerUi("Nome da versão","Version name"));
     new Setting(prompt.contentEl).addText(t=>t.setPlaceholder(writerUi('Antes da revisão','Before review')).onChange(v=>label=v))
      .addButton(b=>b.setButtonText(writerUi("Salvar","Save")).setCta().onClick(async()=>{prompt.close();await this.create(file,label||'Manual');await render();}));
    };prompt.open();
   }));
   if(!snapshots.length)modal.contentEl.createEl('p',{text:writerUi("Nenhuma versão salva ainda.","No versions saved yet.")});
   const list=modal.contentEl.createDiv({cls:'writer-history-list'});
   for(const entry of snapshots.slice(0,250)){
    const card=list.createDiv({cls:'writer-history-entry'});
    card.createEl('strong',{text:entry.name});
    card.createEl('small',{text:new Date(entry.at).toLocaleString()+' · '+entry.size+' caracteres · '+(entry.attachments?.length||0)+' anexo(s)'});
    const actions=card.createDiv({cls:'writer-history-actions'});
    actions.createEl('button',{text:'Comparar'}).addEventListener('click',()=>this.showDiff(file,entry));
    actions.createEl('button',{text:writerUi('Restaurar','Restore')}).addEventListener('click',()=>{
     const confirm=new Modal(this.plugin.app);let withAttachments=false;
     confirm.onOpen=()=>{confirm.setTitle(writerUi("Restaurar versão","Restore version"));
      confirm.contentEl.createEl('p',{text:writerUi('Restaurar ','Restore ')+entry.name+writerUi('? O estado atual será salvo automaticamente antes da restauração.','? The current state will be saved automatically before restoring.')});
      if(entry.attachments?.length)new Setting(confirm.contentEl).setName('Restaurar somente anexos ausentes').setDesc(writerUi("Anexos existentes jamais serão sobrescritos.","Existing attachments will never be overwritten.")).addToggle(t=>t.setValue(false).onChange(v=>withAttachments=v));
      new Setting(confirm.contentEl).addButton(b=>b.setButtonText('Cancelar').onClick(()=>confirm.close()))
       .addButton(b=>b.setButtonText(writerUi('Restaurar','Restore')).setWarning().onClick(async()=>{
        try{await this.restore(file,entry,withAttachments);confirm.close();await render();new Notice(writerUi("Nota restaurada.","Note restored."));}
        catch(e){new Notice(e.message);}
       }));
     };confirm.open();
    });
    actions.createEl('button',{text:writerUi("Excluir","Delete")}).addEventListener('click',()=>{
     const confirm=new Modal(this.plugin.app);
     confirm.onOpen=()=>{confirm.setTitle(writerUi("Excluir versão","Delete version"));
      confirm.contentEl.createEl('p',{text:writerUi("Excluir permanentemente esta versão? A operação não poderá ser desfeita.","Permanently delete this version? This cannot be undone.")});
      new Setting(confirm.contentEl).addButton(b=>b.setButtonText('Cancelar').onClick(()=>confirm.close()))
       .addButton(b=>b.setButtonText(writerUi("Excluir","Delete")).setWarning().onClick(async()=>{await this.delete(file,entry);confirm.close();await render();}));
     };confirm.open();
    });
   }
  };
  modal.onOpen=()=>{render().catch(e=>new Notice(writerUi("Histórico: ","History: ")+e.message));};modal.open();
 }
 async showDiff(file,entry){
  const [oldText,current]=await Promise.all([this.read(file,entry),writerCurrentText(this.plugin,file)]);
  const diff=writerDiffLines(oldText,current);
  const modal=new Modal(this.plugin.app);modal.onOpen=()=>{
   modal.setTitle('Comparar · '+entry.name);
   modal.contentEl.createEl('p',{text:diff.added+' linha(s) adicionada(s) · '+diff.removed+' removida(s)'});
   const box=modal.contentEl.createDiv({cls:'writer-history-diff'});
   if(diff.truncated){
    box.createEl('p',{text:writerUi("Nota longa demais para diferença linha a linha. Comparação lado a lado disponível.","Note too long for line-by-line diff. Side-by-side comparison is available.")});
    for(const [title,contents] of [[writerUi('Versão salva','Saved version'),oldText],[writerUi('Nota atual','Current note'),current]]){
     box.createEl('strong',{text:title});const area=box.createEl('textarea');area.readOnly=true;area.value=contents;
    }
   }else{
    let unchanged=0;
    for(const chunk of diff.changes){
     if(chunk.type==='same'&&unchanged++>Number(this.config.showDiffContext||3))continue;
     if(chunk.type!=='same')unchanged=0;
     box.createDiv({cls:'writer-diff-line writer-diff-'+chunk.type,text:(chunk.type==='add'?'+ ':chunk.type==='remove'?'- ':'  ')+chunk.line});
    }
   }
  };modal.open();
 }
}
