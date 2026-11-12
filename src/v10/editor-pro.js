'use strict';
/* Enhancement Suite: bounded multi-file search/replace and local editor diagnostics. */
function writerV107EditorConfig(settings){
 const old=settings.v107Editor&&typeof settings.v107Editor==='object'&&!Array.isArray(settings.v107Editor)?settings.v107Editor:{};
 return settings.v107Editor=Object.assign(old,{enabled:true,yamlLive:true,maxFiles:80,jsonTreeEdit:true,...old,maxFiles:Math.max(5,Math.min(200,Number(old.maxFiles)||80))});
}
function writerV107ReplacePreview(files,search,replace,matchCase=false){
 if(!search||search.length>200||replace.length>1000)return [];
 const count=(text)=>{
  if(!matchCase){const target=text.toLocaleLowerCase(),q=search.toLocaleLowerCase();let start=0,n=0;while((start=target.indexOf(q,start))>=0&&n<10000){n++;start+=q.length;}return n;}
  return text.split(search).length-1;
 };
 return files.map(({file,text})=>({file,text,count:count(text)})).filter(x=>x.count>0);
}
function writerV107ReplacePlain(text,search,replacement,matchCase){
 if(matchCase)return text.split(search).join(replacement);
 const original=String(text),lower=original.toLocaleLowerCase(),needle=search.toLocaleLowerCase();
 if(!needle)return original;
 let start=0,last=0,out='',seen=0;
 while((start=lower.indexOf(needle,last))>=0&&seen<10000){out+=original.slice(last,start)+replacement;last=start+needle.length;seen++;}
 return out+original.slice(last);
}
function writerV107BatchReplaceModal(plugin){
 const cfg=plugin.settings.v107Editor,modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Buscar e substituir no cofre','Vault find and replace'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();let search='',replacement='',folder='',matchCase=false,confirmed=false,preview=[];
  new Setting(root).setName(writerUi('Buscar texto literal','Find literal text')).addText(t=>t.onChange(v=>{search=v.slice(0,200);}));
  new Setting(root).setName(writerUi('Substituir por','Replace with')).addText(t=>t.onChange(v=>{replacement=v.slice(0,1000);}));
  new Setting(root).setName(writerUi('Somente nesta pasta (opcional)','Folder filter (optional)')).addText(t=>t.onChange(v=>{folder=v.trim().slice(0,200);}));
  new Setting(root).setName(writerUi('Diferenciar maiúsculas','Case sensitive')).addToggle(t=>t.setValue(false).onChange(v=>{matchCase=v;}));
  const status=root.createDiv({cls:'writer-v107-search-preview'});
  const list=root.createDiv({cls:'writer-v107-search-results'});
  const button=root.createEl('button',{text:writerUi('Prévia das substituições','Preview replacements')});
  button.addEventListener('click',async()=>{
   list.empty();status.setText(writerUi('Analisando notas…','Analyzing notes…'));
   preview=[];confirmed=false;
   if(!search.trim()||search.length<2){status.setText(writerUi('Informe ao menos dois caracteres.','Enter at least two characters.'));return;}
   const files=plugin.app.vault.getMarkdownFiles().filter(f=>(!folder||f.path.startsWith(folder+'/'))&&(f.stat.size||0)<800000).slice(0,cfg.maxFiles);
   const sources=[];
   for(const file of files){try{sources.push({file,text:await plugin.app.vault.cachedRead(file)});}catch(_){/* unreadable note */}}
   preview=writerV107ReplacePreview(sources,search,replacement,matchCase);
   const total=preview.reduce((n,x)=>n+x.count,0);
   status.setText(preview.length+' '+writerUi('notas · ','notes · ')+total+' '+writerUi('ocorrências.','occurrences.'));
   for(const entry of preview.slice(0,30))list.createEl('p',{text:entry.file.path+' · '+entry.count});
  });
  new Setting(root).setName(writerUi('Confirmo a alteração dos arquivos da prévia','I confirm editing the previewed files')).addToggle(t=>t.onChange(v=>{confirmed=v;}));
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Substituir com snapshots','Replace with snapshots')).setWarning().onClick(async()=>{
   if(!confirmed||!preview.length){new Notice(writerUi('Gere a prévia e confirme primeiro.','Preview and confirm first.'));return;}
   b.setDisabled(true);let done=0;
   try{
    for(const item of preview){
     // Re-read before writing, never overwrite a note changed after preview.
     if(await plugin.app.vault.cachedRead(item.file)!==item.text)throw Error(writerUi('Nota alterada após prévia: ','Note changed after preview: ')+item.file.path);
     await plugin.writerSnapshots?.create?.(item.file,'Before batch find/replace');
     const updated=writerV107ReplacePlain(item.text,search,replacement,matchCase);
     await plugin.app.vault.modify(item.file,updated);done++;
    }
    modal.close();new Notice(done+' '+writerUi('notas atualizadas.','notes updated.'));
   }catch(e){new Notice(writerUi('Interrompido após ','Stopped after ')+done+': '+String(e.message||e));b.setDisabled(false);}
  }));
 };
 modal.open();
}
function writerV107JsonTreeEdit(plugin,selection,editor){
 if(String(selection).length>80000)return;
 let obj;
 try{obj=JSON.parse(selection);}catch(_){new Notice(writerUi('Selecione um JSON válido.','Select valid JSON.'));return;}
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Editar JSON hierárquico','Edit JSON tree'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  const tree=root.createDiv({cls:'writer-v106-json-tree'});
  let nodes=0;
  const draw=(parent,value,key,depth,apply)=>{
   if(++nodes>400||depth>10){parent.createEl('small',{text:'…'});return;}
   if(value&&typeof value==='object'){
    const details=parent.createEl('details');details.open=depth<2;
    details.createEl('summary',{text:String(key)+' '+(Array.isArray(value)?'['+value.length+']':'{'+Object.keys(value).length+'}')});
    const children=details.createDiv({cls:'writer-v106-json-children'});
    Object.entries(value).slice(0,100).forEach(([k,v])=>draw(children,v,k,depth+1,n=>{value[k]=n;}));
   }else{
    const row=parent.createDiv({cls:'writer-v107-json-leaf'});
    row.createSpan({text:String(key)});
    const input=row.createEl('input',{attr:{type:'text','aria-label':String(key)}});
    input.value=typeof value==='string'?value:JSON.stringify(value);
    input.addEventListener('change',()=>{
     let next=input.value;
     if(typeof value!=='string'){try{next=JSON.parse(next);}catch(_){input.addClass('is-invalid');return;}}
     input.removeClass('is-invalid');apply(next);
    });
   }
  };
  draw(tree,obj,'root',0,value=>{obj=value;});
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Aplicar à seleção','Apply to selection')).setCta().onClick(()=>{
   const updated=JSON.stringify(obj,null,2);
   if(updated.length>120000){new Notice(writerUi('JSON editado grande demais.','Edited JSON too large.'));return;}
   // Abort if the selection has changed under the editor while the modal was open.
   if(editor.getSelection()!==selection){new Notice(writerUi('A seleção mudou. Operação cancelada.','Selection changed. Operation cancelled.'));return;}
   editor.replaceSelection(updated);modal.close();
  }));
 };
 modal.open();
}
function writerV107EditorYamlState(text,parse){
 const opening=/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
 if(!opening)return {valid:true,skipped:true};
 if(opening[1].length>100000)return {valid:false,error:'Frontmatter too large'};
 try{parse(opening[1]);return {valid:true};}catch(e){
  return {valid:false,error:String(e.message||e).replace(/\s+/g,' ').slice(0,220)};
 }
}
function writerV107EditorRegister(plugin){
 const cfg=writerV107EditorConfig(plugin.settings);
 plugin.addCommand({id:'v107-find-replace-vault',name:writerUi('Edição: buscar e substituir entre notas','Editing: find and replace across notes'),callback:()=>writerV107BatchReplaceModal(plugin)});
 plugin.addCommand({id:'v107-json-tree-edit',name:writerUi('JSON: editar seleção em árvore','JSON: edit selection as tree'),editorCheckCallback:(checking,editor)=>{
  if(!cfg.jsonTreeEdit||!editor.getSelection().trim())return false;
  try{JSON.parse(editor.getSelection());}catch(_){return false;}
  if(!checking)writerV107JsonTreeEdit(plugin,editor.getSelection(),editor);
  return true;
 }});
 if(typeof EditorView!=='undefined'&&typeof plugin.registerEditorExtension==='function'){
  let timer=null;
  plugin.registerEditorExtension(EditorView.updateListener.of(update=>{
   if(!cfg.enabled||!cfg.yamlLive||!update.docChanged)return;
   clearTimeout(timer);
   timer=setTimeout(()=>{
    const view=update.view;
    if(!view?.dom?.isConnected)return;
    const status=writerV107EditorYamlState(view.state.doc.toString().slice(0,110000),require('obsidian').parseYaml);
    let banner=view.dom.querySelector(':scope > .writer-v107-yaml-warning');
    if(status.valid){banner?.remove();return;}
    if(!banner){banner=view.dom.ownerDocument.createElement('div');banner.className='writer-v107-yaml-warning';banner.setAttribute('role','status');view.dom.appendChild(banner);}
    banner.textContent=writerUi('YAML: ','YAML: ')+status.error;
   },380);
  }));
  plugin.register?.(()=>clearTimeout(timer));
 }
}
function writerV107EditorSettings(plugin,panel){
 const cfg=plugin.settings.v107Editor;
 panel.createEl('h3',{text:writerUi('Edição avançada','Advanced editing')});
 for(const [k,pt,en] of [['enabled','Ativar ferramentas avançadas','Enable advanced tools'],['yamlLive','Diagnóstico YAML no editor','Live YAML editor diagnostics'],['jsonTreeEdit','Editor JSON em árvore','JSON tree editor']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[k]!==false).onChange(async v=>{cfg[k]=v;await plugin.saveSettings();}));
 }
 new Setting(panel).setName(writerUi('Máximo de notas para busca/substituição','Max files for batch replace'))
  .addSlider(s=>s.setLimits(5,200,5).setValue(cfg.maxFiles).setDynamicTooltip().onChange(async v=>{cfg.maxFiles=v;await plugin.saveSettings();}));
}
