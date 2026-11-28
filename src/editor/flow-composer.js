'use strict';
/* Flow 9.3: Markdown-native note boards; edits only the single fenced source block.
 * This module has no network requests and never deletes or moves the linked notes. */
function writerV93FlowParse(source,cfg){
 const lines=String(source||'').split(/\r?\n/),itemLines=[];
 let layout=cfg.defaultLayout||'cards',layoutLine=-1;
 lines.forEach((line,index)=>{
  const trimmed=line.trim();
  if(/^layout:\s*(cards|list|board|graph)$/i.test(trimmed)){
   layout=trimmed.split(':')[1].trim().toLowerCase();layoutLine=index;
  }else if(trimmed&&!trimmed.startsWith('#')&&itemLines.length<cfg.maxItems)itemLines.push(index);
 });
 return {layout,originalLayout:layout,layoutLine,lines,itemLines,items:itemLines.map(index=>lines[index])};
}
function writerV93FlowSerialize(parsed){
 const {layout,originalLayout,layoutLine,lines,itemLines,items}=parsed;
 const slots=new Map(itemLines.map((line,index)=>[line,index])),output=[];
 if(layout!==originalLayout&&layoutLine<0)output.push('layout: '+layout);
 lines.forEach((line,index)=>{
  if(index===layoutLine&&layout!==originalLayout){
   output.push(line.replace(/(cards|list|board|graph)(\s*)$/i,(_match,_old,spacing)=>layout+spacing));
  }else if(slots.has(index)){
   const item=slots.get(index);
   if(item<items.length)output.push(items[item]);
   if(item===itemLines.length-1)output.push(...items.slice(itemLines.length));
  }else output.push(line);
 });
 if(!itemLines.length)output.push(...items);
 return output.join('\n');
}
function writerV93FlowRow(raw){
 const text=String(raw||'').trimEnd();
 const end=/^\s*!?\[\[.*?\]\]/.exec(text)?.[0].length||0;
 const suffix=/\s+\|\s*after\s*:\s*(.*?)$/i.exec(text.slice(end));
 return suffix?{link:text.slice(0,end+suffix.index).trimEnd(),after:suffix[1]}:{link:text,after:''};
}
function writerV93FlowLink(raw){
 const {link}=writerV93FlowRow(raw);
 return link.trim().replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0].trim();
}
function writerV101FlowLinkDependency(raw){
 return writerV93FlowLink(writerV93FlowRow(raw).after);
}
function writerV101FlowDepths(items){
 const names=items.map(raw=>writerV93FlowLink(raw));
 const index=new Map(names.map((name,i)=>[name.toLowerCase(),i]));
 const depths=items.map(()=>0),state=items.map(()=>0);
 const depth=i=>{
  if(state[i]===2)return depths[i];
  if(state[i]===1)return 0;
  state[i]=1;
  const dep=writerV101FlowLinkDependency(items[i]).toLowerCase(),parent=index.get(dep);
  depths[i]=parent===undefined||parent===i?0:Math.min(5,depth(parent)+1);
  state[i]=2;return depths[i];
 };
 items.forEach((_,i)=>depth(i));return depths;
}
async function writerV93FlowPersist(plugin,ctx,root,source,model,type,baseline){
 const replacement=writerV93FlowSerialize(model);
 try{
  await writerV8CommitFenced(plugin,ctx,root,type,source,replacement,baseline);
  return true;
 }catch(error){new Notice(String(error.message||error));return false;}
}
function writerV93TextBoardParse(source,maxItems){
 const columns=[],cards=[];let id='',column=null;
 for(const line of String(source||'').split(/\r?\n/)){
  const name=/^\s*===\s+(.+?)\s*$/.exec(line)?.[1];
  if(name){
   column=null;
   if(columns.length<10){column=columns.length;columns.push(name.slice(0,80));}
   continue;
  }
  if(!columns.length){id||=/^\s*id:\s*([\w-]{1,70})\s*$/.exec(line)?.[1]||'';continue;}
  const label=/^\s*[-*]\s+(?:\[[ xX]\]\s+)?(.+?)\s*$/.exec(line)?.[1];
  if(column!==null&&label&&cards.length<maxItems)cards.push({label:label.slice(0,300),column,index:cards.length});
 }
 return {id,columns,cards};
}
const WRITER_V93_TEXT_BOARD_WRITES=new WeakMap();
function writerV93TextBoard(plugin,source,root,ctx,board){
 const cfg=plugin.settings.v9215Flow,lanes=root.createDiv({cls:'writer-v93-flow-items'});
 root.classList.add('writer-v9216-flow-board','writer-v93-flow-layout-board');
 const anchor=board.id||ctx.getSectionInfo?.(root)?.lineStart||0;
 const key=ctx.sourcePath&&JSON.stringify([ctx.sourcePath,anchor,writerV83StudyHash(source.trim())]);
 const canMove=cfg.flowArrange&&Boolean(key);
 let dragged=null,saving=false;
 const positions=()=>cfg.textBoardMoves?.[key]||{};
 const position=(card,moves)=>Number.isInteger(moves[card.index])&&board.columns[moves[card.index]]!==undefined?
  moves[card.index]:card.column;
 const move=async(card,to)=>{
  if(!canMove||saving||board.columns[to]===undefined)return;
  saving=true;
  const pending=WRITER_V93_TEXT_BOARD_WRITES.get(cfg)||Promise.resolve();
  const write=pending.then(async()=>{
   if(!cfg.enabled||!cfg.flowArrange||to===position(card,positions()))return;
   const previous=cfg.textBoardMoves||{},nextPositions={...positions()};
   if(to===card.column)delete nextPositions[card.index];else nextPositions[card.index]=to;
   const entries=Object.entries(previous).filter(([id])=>id!==key);
   if(Object.keys(nextPositions).length)entries.push([key,nextPositions]);
   const next=Object.fromEntries(entries.slice(-120));
   cfg.textBoardMoves=next;
   try{await plugin.saveSettings();}
   catch(error){if(cfg.textBoardMoves===next)cfg.textBoardMoves=previous;throw error;}
  });
  WRITER_V93_TEXT_BOARD_WRITES.set(cfg,write.catch(()=>{}));
  try{await write;draw(card.index);}
  catch(_){
   new Notice(writerUi('Não foi possível salvar a posição do cartão.','Could not save the card position.'));
  }finally{saving=false;}
 };
 const draw=focusIndex=>{
  const moves=positions();
  lanes.empty();
  board.columns.forEach((name,index)=>{
   const lane=lanes.createDiv({cls:'writer-v93-flow-lane writer-v9216-flow-card'});
   lane.createEl('h4',{text:name});
   if(canMove){
    lane.addEventListener('dragover',event=>{if(dragged!==null)event.preventDefault();});
    lane.addEventListener('drop',event=>{
     if(dragged===null)return;
     event.preventDefault();const card=dragged;dragged=null;void move(card,index);
    });
   }
   for(const card of board.cards){
    if(position(card,moves)!==index)continue;
    const row=lane.createDiv({cls:'writer-v9216-flow-card'});
    row.createSpan({text:card.label});
    if(!canMove)continue;
    row.draggable=true;
    row.addEventListener('dragstart',event=>{
     dragged=card;
     if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',card.label);}
    });
    row.addEventListener('dragend',()=>{dragged=null;});
    const actions=row.createDiv({cls:'writer-v93-flow-actions'});
    const choices=[];
    for(const [step,icon,pt,en] of [[-1,'arrow-left','Mover para a coluna anterior','Move to previous column'],
     [1,'arrow-right','Mover para a próxima coluna','Move to next column']]){
     const button=actions.createEl('button',{attr:{type:'button','aria-label':writerUi(pt,en)}});
     require('obsidian').setIcon(button,icon);
     button.disabled=board.columns[index+step]===undefined;
     button.addEventListener('click',()=>move(card,index+step));
     if(!button.disabled)choices.push(button);
    }
    if(card.index===focusIndex)choices[0]?.focus();
   }
  });
 };
 draw();
}
function writerV93FlowComposer(plugin,source,root,ctx,type){
 const cfg=plugin.settings.v9215Flow;if(!cfg.enabled||!cfg.flowBlocks)return;
 const board=writerV93TextBoardParse(source,cfg.maxItems);
 if(board.columns.length)return writerV93TextBoard(plugin,source,root,ctx,board);
 const model=writerV93FlowParse(source,cfg);
 root.classList.add('writer-v9216-flow-board','writer-v93-flow-layout-'+model.layout);
 const toolbar=root.createDiv({cls:'writer-v93-flow-toolbar'});
 toolbar.createEl('strong',{text:writerUi('Painel de notas','Note board')+' · '+model.items.length+' '+writerUi('notas','notes')});
 const resolveNote=path=>plugin.app.metadataCache?.getFirstLinkpathDest?.(path,ctx.sourcePath||'')||
  plugin.app.vault.getAbstractFileByPath(path);
 const persist=(next,baseline)=>{
  if(root.isConnected)void writerV93FlowPersist(plugin,ctx,root,source,next,type,baseline);
 };
 if(cfg.flowArrange){
  const select=toolbar.createEl('select',{attr:{'aria-label':writerUi('Layout do painel de notas','Note board layout')}});
  for(const [id,pt,en] of [['cards','Cartões','Cards'],['list','Lista','List'],['board','Quadro','Board'],['graph','Grafo','Graph']]){
   const option=select.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  select.value=model.layout;
  select.addEventListener('change',()=>persist({...model,layout:select.value}));
  const add=toolbar.createEl('button',{attr:{type:'button','aria-label':writerUi('Adicionar nota ao painel','Add note to board')}});
  require('obsidian').setIcon(add,'plus');
  add.addEventListener('click',()=>{
   const baseline=writerV8CaptureFenced(plugin,ctx);
   const Suggest=require('obsidian').FuzzySuggestModal;
   const modal=new (class extends Suggest{
    getItems(){return plugin.app.vault.getMarkdownFiles().filter(f=>f.path!==ctx.sourcePath);}
    getItemText(f){return f.path;}
    onChooseItem(f){
     if(model.items.length>=cfg.maxItems){new Notice(writerUi('Limite de notas atingido.','Note limit reached.'));return;}
     const path='[['+f.path+']]';
     if(!model.items.some(item=>resolveNote(writerV93FlowLink(item))?.path===f.path))
      persist({...model,items:[...model.items,path]},baseline);
    }
   })(plugin.app);
   modal.setPlaceholder(writerUi('Adicionar nota existente…','Add an existing note…'));modal.open();
  });
 }
 const list=root.createDiv({cls:'writer-v93-flow-items'});
 const depths=writerV101FlowDepths(model.items);
 if(!model.items.length){list.createEl('p',{text:writerUi('Uma nota por linha no bloco flow.','Put one note per line inside the flow block.')});return;}
 let dragged=null;
 const reorder=(from,to)=>{
  if(!cfg.flowArrange||from===to||from<0||to<0||from>=model.items.length||to>=model.items.length)return;
  const items=model.items.slice(),value=items.splice(from,1)[0];items.splice(to,0,value);
  persist({...model,items});
 };
 model.items.forEach((raw,index)=>{
  const path=writerV93FlowLink(raw);
  const file=resolveNote(path);
  const card=list.createDiv({cls:'writer-v9216-flow-card'});
  if(model.layout==='graph'){
   card.dataset.depth=String(depths[index]);card.style.setProperty('--writer-v101-flow-depth',String(depths[index]));
   card.style.gridColumn=String(depths[index]+1);
  }
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
  if(model.layout==='graph'&&cfg.flowArrange){
   const depends=card.createDiv({cls:'writer-v101-flow-depends'});
   const selector=depends.createEl('select',{attr:{'aria-label':writerUi('Depende da nota','Depends on note')}});
   const current=writerV101FlowLinkDependency(raw);
   const empty=selector.createEl('option',{text:writerUi('Sem dependência','No dependency')});empty.value='';
   for(const item of model.items){
    const candidate=writerV93FlowLink(item);if(candidate===path)continue;
    const option=selector.createEl('option',{text:candidate});option.value=candidate;
   }
   selector.value=current;
   selector.addEventListener('change',()=>{
    const next=writerV93FlowRow(raw).link+(selector.value?' | after:[['+selector.value+']]':'');
    const items=model.items.slice();items[index]=next;persist({...model,items});
   });
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
   dragged=index;
   if(event.dataTransfer){
    event.dataTransfer.setData('text/x-writer-flow-index',String(index));
    event.dataTransfer.effectAllowed='move';
   }
   event.stopPropagation();
  });
  card.addEventListener('dragend',()=>{dragged=null;});
  card.addEventListener('dragover',event=>{
   if(dragged!==null)event.preventDefault();
  });
  card.addEventListener('drop',event=>{
   if(dragged===null)return;
   const from=dragged;dragged=null;
   event.preventDefault();event.stopPropagation();reorder(from,index);
  });
 });
}
