'use strict';
/* Small opt-in followups from v1–v10: legacy dictionary path recovery and JSON tree inspector. */
function writerV106JsonParse(text){
 const source=String(text||'').trim();
 if(!source||source.length>200000)throw Error('Empty or oversized JSON');
 return JSON.parse(source);
}
function writerV106JsonTree(plugin,source){
 let parsed;
 try{parsed=writerV106JsonParse(source);}
 catch(error){new Notice(writerUi('JSON inválido: ','Invalid JSON: ')+String(error.message||error).slice(0,160));return;}
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Explorador de JSON','JSON tree explorer'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v106-json-viewer');
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Prévia somente leitura. Nada é enviado à rede ou escrito no cofre.','Read-only preview. No network calls or vault writes.')});
  const tree=root.createDiv({cls:'writer-v106-json-tree'}),budget={nodes:0};
  const render=(parent,key,value,depth)=>{
   if(budget.nodes++>=650||depth>12){parent.createEl('small',{text:'…'});return;}
   const object=value!==null&&typeof value==='object';
   if(!object){parent.createDiv({cls:'writer-v106-json-entry',text:String(key)+': '+JSON.stringify(value)});return;}
   const details=parent.createEl('details',{cls:'writer-v106-json-node'});
   if(depth<2)details.open=true;
   const entries=Object.entries(value),label=Array.isArray(value)?'['+entries.length+']':'{'+entries.length+'}';
   details.createEl('summary',{text:String(key)+' '+label});
   const children=details.createDiv({cls:'writer-v106-json-children'});
   for(const [child,entry] of entries.slice(0,150))render(children,child,entry,depth+1);
   if(entries.length>150)children.createEl('small',{text:'+'+(entries.length-150)+' …'});
  };
  render(tree,writerUi('Raiz','Root'),parsed,0);
 };
 modal.open();
}
function writerV106LegacyDictionaryCandidates(settings){
 const values=[];
 const visit=(value,depth=0)=>{
  if(depth>2||!value||typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
   if(/^(dictionaryPath|dictionaryFile|dictionaryNote|dictionaryFiles|dictionaryPaths|dictionary)$/i.test(key)){
    if(typeof item==='string')values.push(item);
    else if(Array.isArray(item))values.push(...item.filter(x=>typeof x==='string'));
   }else if(key==='settings'&&typeof item==='object')visit(item,depth+1);
  }
 };
 visit(settings);
 return [...new Set(values.flatMap(value=>String(value).split(/[,\n]/)).map(v=>v.trim()).filter(v=>v.length>2&&!/^\w+:\/\//.test(v)&&!v.includes('..')&&!/[\0\r\n]/.test(v)))].slice(0,20);
}
async function writerV106LegacyDictionaryInspector(plugin){
 const adapter=plugin.app.vault.adapter,dir=String(plugin.app.vault.configDir||'.obsidian');
 const path=dir+'/plugins/alans-offline-dictionary/data.json';
 let raw;
 try{
  if(!await adapter.exists(path))throw Error('No legacy settings file');
  raw=await adapter.read(path);
  if(raw.length>250000)throw Error('Legacy settings file too large');
 }catch(error){new Notice(writerUi('Configurações da v1 não encontradas. Mantenha a nota de dicionário antiga.','v1 settings not found. Your old dictionary note can still be used.'));return;}
 let object;
 try{object=JSON.parse(raw);}catch(_){new Notice(writerUi('Arquivo antigo inválido.','Invalid legacy settings file.'));return;}
 const candidates=writerV106LegacyDictionaryCandidates(object)
  .map(path=>plugin.app.vault.getAbstractFileByPath(path))
  .filter(file=>file instanceof TFile&&file.extension==='md');
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Recuperar dicionário da v1','Recover v1 dictionary'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{text:writerUi('O antigo plugin usava outro identificador. Esta ferramenta só importa o caminho de uma nota Markdown de dicionário, após sua confirmação. Chaves de API e outras configurações não são copiadas.','The old plugin had a different ID. This tool only imports a confirmed Markdown dictionary-note path. API keys and other settings are never copied.')});
  if(!candidates.length){root.createEl('p',{cls:'setting-item-description',text:writerUi('Nenhum caminho válido de dicionário foi identificado no arquivo antigo. A nota continua intacta.','No valid dictionary note path was found in the old settings. Your note is untouched.')});return;}
  for(const file of candidates){
   new Setting(root).setName(file.path)
    .addButton(btn=>btn.setButtonText(writerUi('Usar neste plugin','Use in Basic')).onClick(async()=>{
     const cfg=plugin.settings.complements||(plugin.settings.complements={});
     const list=String(cfg.dictionaryPaths||'').split(',').map(x=>x.trim()).filter(Boolean);
     if(!list.includes(file.path))list.push(file.path);
     cfg.dictionaryPaths=list.join(',');
     cfg.dictionaries=true;cfg.enabled=true;
     await plugin.saveSettings();
     new Notice(writerUi('Dicionário associado; nota original preservada.','Dictionary linked; original note preserved.'));
     modal.close();
    }));
  }
 };
 modal.open();
}
function writerV106HistoricRegister(plugin){
 plugin.addCommand({id:'v106-json-tree-viewer',name:writerUi('JSON: explorar seleção em árvore','JSON: inspect selection as a tree'),
  editorCheckCallback:(checking,editor)=>{
   const text=editor.getSelection();
   if(!text.trim()||text.length>200000)return false;
   try{writerV106JsonParse(text);}catch(_){return false;}
   if(!checking)writerV106JsonTree(plugin,text);
   return true;
  }});
 // Recovery utility is available from Settings, not listed among everyday editor commands.
}
