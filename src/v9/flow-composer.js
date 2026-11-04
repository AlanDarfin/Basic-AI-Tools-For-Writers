'use strict';
/* Flow 9.3: Markdown-native note boards; edits only the single fenced source block.
 * This module has no network requests and never deletes or moves the linked notes. */
function writerV93FlowParse(source,cfg){
 const options=[],items=[];let layout=cfg.defaultLayout||'cards';
 for(const line of String(source||'').split(/\r?\n/)){
  const trimmed=line.trim();
  if(/^layout:\s*(cards|list|board)$/i.test(trimmed)){
   layout=trimmed.split(':')[1].trim().toLowerCase();options.push('layout: '+layout);
  }else if(!trimmed||trimmed.startsWith('#'))options.push(line);
  else items.push(trimmed);
 }
 return {layout,options,items:items.slice(0,cfg.maxItems)};
}
function writerV93FlowSerialize(parsed){return [...parsed.options,...parsed.items].join('\n').trim();}
function writerV93FlowLink(raw){
 return String(raw||'').replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0].trim();
}
function writerV93FlowLocateBlock(raw,source,hint){
 const nl=raw.includes('\r\n')?'\r\n':'\n',lines=raw.split(/\r?\n/),found=[];
 for(let start=0;start<lines.length;start++){
  const open=/^\s{0,3}(\x60{3,}|~{3,})\s*(?:writer-)?flow\s*$/.exec(lines[start]);
  if(!open)continue;
  const char=open[1][0],min=open[1].length;
  for(let end=start+1;end<lines.length;end++){
   const closing=lines[end].trim();
   if(closing.length>=min&&[...closing].every(c=>c===char)){
    if(lines.slice(start+1,end).join('\n').trim()===source.trim())found.push({start,end});
    start=end;break;
   }
  }
 }
 if(found.length===1)return {...found[0],lines,nl};
 const exact=found.find(x=>x.start===hint);
 return exact?{...exact,lines,nl}:null;
}
async function writerV93FlowPersist(plugin,ctx,root,source,model){
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath||'');
 if(!(file instanceof TFile)||file.extension!=='md')return false;
 const start=ctx.getSectionInfo?.(root)?.lineStart;
 const hint=Number.isInteger(start)?start:-1;
 const replacement=writerV93FlowSerialize(model);
 try{
  await plugin.app.vault.process(file,raw=>{
   const found=writerV93FlowLocateBlock(raw,source,hint);
   if(!found)throw Error(writerUi('O bloco Flow foi alterado. Reabra a nota e tente novamente.','Flow block changed. Reopen the note and try again.'));
   return [...found.lines.slice(0,found.start+1),...replacement.split('\n'),
    ...found.lines.slice(found.end)].join(found.nl);
  });
  return true;
 }catch(error){new Notice(String(error.message||error));return false;}
}
function writerV93FlowComposer(plugin,source,root,ctx){
 const cfg=plugin.settings.v9215Flow;if(!cfg.enabled||!cfg.flowBlocks)return;
 const model=writerV93FlowParse(source,cfg);
 root.classList.add('writer-v9216-flow-board','writer-v93-flow-layout-'+model.layout);
 const toolbar=root.createDiv({cls:'writer-v93-flow-toolbar'});
 toolbar.createEl('strong',{text:'Flow · '+model.items.length+' '+writerUi('notas','notes')});
 const persist=next=>void writerV93FlowPersist(plugin,ctx,root,source,next);
 if(cfg.flowArrange){
  const select=toolbar.createEl('select',{attr:{'aria-label':writerUi('Layout do painel Flow','Flow panel layout')}});
  for(const [id,pt,en] of [['cards','Cartões','Cards'],['list','Lista','List'],['board','Quadro','Board']]){
   const option=select.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  select.value=model.layout;
  select.addEventListener('change',()=>{
   persist({...model,layout:select.value,
    options:[...model.options.filter(x=>!/^layout:/i.test(x)),'layout: '+select.value]});
  });
  const add=toolbar.createEl('button',{attr:{type:'button','aria-label':writerUi('Adicionar nota ao Flow','Add note to Flow')}});
  require('obsidian').setIcon(add,'plus');
  add.addEventListener('click',()=>{
   const Suggest=require('obsidian').FuzzySuggestModal;
   const modal=new (class extends Suggest{
    getItems(){return plugin.app.vault.getMarkdownFiles().filter(f=>f.path!==ctx.sourcePath);}
    getItemText(f){return f.path;}
    onChooseItem(f){
     if(model.items.length>=cfg.maxItems){new Notice(writerUi('Limite de notas atingido.','Note limit reached.'));return;}
     const path='[['+f.path+']]';
     if(!model.items.includes(path))persist({...model,items:[...model.items,path]});
    }
   })(plugin.app);
   modal.setPlaceholder(writerUi('Adicionar nota existente…','Add an existing note…'));modal.open();
  });
 }
 const list=root.createDiv({cls:'writer-v93-flow-items'});
 if(!model.items.length){list.createEl('p',{text:writerUi('Uma nota por linha no bloco Flow.','Put one note per line inside the Flow block.')});return;}
 const reorder=(from,to)=>{
  if(!cfg.flowArrange||from===to||from<0||to<0||from>=model.items.length||to>=model.items.length)return;
  const items=model.items.slice(),value=items.splice(from,1)[0];items.splice(to,0,value);
  persist({...model,items});
 };
 model.items.forEach((raw,index)=>{
  const path=writerV93FlowLink(raw);
  const file=plugin.app.metadataCache?.getFirstLinkpathDest?.(path,ctx.sourcePath||'')||
   plugin.app.vault.getAbstractFileByPath(path);
  const card=list.createDiv({cls:'writer-v9216-flow-card'});
  const heading=card.createDiv({cls:'writer-v9216-flow-head'});
  if(!(file instanceof TFile)||file.extension!=='md'){
   heading.createSpan({text:path||raw});
   card.createEl('small',{text:writerUi('Nota não encontrada.','Note not found.')});
  }else{
   const title=heading.createEl('button',{cls:'writer-v9216-flow-open',text:file.basename,attr:{type:'button'}});
   title.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(file));
   if(cfg.embeds){
    const edit=heading.createEl('button',{cls:'writer-v9216-flow-edit',text:writerUi('Editar','Edit'),attr:{type:'button'}});
    edit.addEventListener('click',()=>void writerV9216FlowOpenEditor(plugin,file,card,edit));
   }
   if(cfg.flowPreviews){
    const summary=card.createDiv({cls:'writer-v9216-flow-excerpt'});
    void plugin.app.vault.cachedRead(file).then(rawText=>{
     if(card.isConnected)summary.textContent=writerV921PreviewBody(rawText,180)||writerUi('Sem prévia.','No preview.');
    }).catch(()=>{if(card.isConnected)summary.textContent=writerUi('Prévia indisponível.','Preview unavailable.');});
   }
  }
  if(!cfg.flowArrange)return;
  const actions=card.createDiv({cls:'writer-v93-flow-actions'});
  for(const [step,name,pt,en] of [[-1,'arrow-up','Mover acima','Move earlier'],[1,'arrow-down','Mover abaixo','Move later']]){
   const button=actions.createEl('button',{attr:{type:'button','aria-label':writerUi(pt,en)}});
   button.disabled=index+step<0||index+step>=model.items.length;
   require('obsidian').setIcon(button,name);
   button.addEventListener('click',()=>reorder(index,index+step));
  }
  const remove=actions.createEl('button',{attr:{type:'button','aria-label':writerUi('Remover do painel','Remove from panel')}});
  require('obsidian').setIcon(remove,'x');
  remove.addEventListener('click',()=>persist({...model,items:model.items.filter((_,i)=>i!==index)}));
  card.draggable=true;
  card.addEventListener('dragstart',event=>{
   event.dataTransfer?.setData('text/x-writer-flow-index',String(index));
   if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
   event.stopPropagation();
  });
  card.addEventListener('dragover',event=>{
   if(event.dataTransfer?.types?.includes('text/x-writer-flow-index'))event.preventDefault();
  });
  card.addEventListener('drop',event=>{
   const from=Number(event.dataTransfer?.getData('text/x-writer-flow-index'));
   if(!Number.isInteger(from))return;
   event.preventDefault();event.stopPropagation();reorder(from,index);
  });
 });
}
