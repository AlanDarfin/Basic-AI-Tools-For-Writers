'use strict';
/* Dragger-inspired local block movement for the Basic editor.
 * Original implementation: no dependency on, or code copied from, the Dragger plugin. */
function writerV106DragMerge(settings){
 const old=settings.v106Dragger&&typeof settings.v106Dragger==='object'?settings.v106Dragger:{};
 const cfg=settings.v106Dragger={
  enabled:true,visibility:'hover',icon:'grip',size:20,offset:0,color:'',indicatorColor:'',
  multiSelect:true,nested:true,mobileLongPress:true,highlight:true,...old
 };
 if(!['hover','always','hidden'].includes(cfg.visibility))cfg.visibility='hover';
 if(!['grip','grip-lines','dot','square'].includes(cfg.icon))cfg.icon='grip';
 cfg.size=Math.max(12,Math.min(28,Math.round(Number(cfg.size)||20)));
 cfg.offset=Math.max(-70,Math.min(70,Math.round(Number(cfg.offset)||0)));
 for(const k of ['color','indicatorColor'])if(!/^#[0-9a-f]{6}$/i.test(cfg[k]||''))cfg[k]='';
 return cfg;
}
function writerV106DragKind(line){
 const t=String(line||'');
 if(/^\s*(`{3,}|~{3,})/.test(t))return 'fence';
 if(/^\s*#{1,6}\s/.test(t))return 'heading';
 if(/^\s*(?:[-*+]|\d+[.)])\s/.test(t))return 'list';
 if(/^\s*>\s?/.test(t))return 'quote';
 if(/^\s*\|/.test(t))return 'table';
 if(/^\s*(?:---+|\*\s*\*\s*\*|___+)\s*$/.test(t))return 'rule';
 return 'paragraph';
}
function writerV106DragBlocks(source){
 const lines=Array.isArray(source)?source:String(source||'').split('\n');
 const blocks=[],n=lines.length;
 const structural=t=>/^\s*(?:#{1,6}\s|(?:[-*+]|\d+[.)])\s|>\s?|`{3,}|~{3,}|\|)/.test(t);
 for(let i=0;i<n;){
  if(!lines[i].trim()){i++;continue;}
  const start=i,kind=writerV106DragKind(lines[i]);
  if(kind==='fence'){
   const mark=lines[i].trim().match(/^(`{3,}|~{3,})/)[1];
   i++;
   while(i<n){
    if(lines[i].trim().startsWith(mark[0].repeat(mark.length))){i++;break;}
    i++;
   }
  }else if(kind==='heading'||kind==='rule'){i++;}
  else if(kind==='table'&&i+1<n&&/^\s*\|?[\s:|\-]+\|?\s*$/.test(lines[i+1])&&lines[i+1].includes('---')){
   i+=2;while(i<n&&lines[i].trim()&&lines[i].includes('|'))i++;
  }else if(kind==='list'){
   const level=(lines[start].match(/^\s*/)||[''])[0].length;
   i++;
   // Keep nested children and continuation paragraphs with the list item.
   while(i<n){
    if(!lines[i].trim()){
     if(i+1<n&&lines[i+1].trim()&&(lines[i+1].match(/^\s*/)||[''])[0].length>level){i++;continue;}
     break;
    }
    const ind=(lines[i].match(/^\s*/)||[''])[0].length;
    if(ind<=level&&/^\s*(?:[-*+]|\d+[.)])\s/.test(lines[i]))break;
    if(ind<=level&&structural(lines[i]))break;
    if(ind<=level&&!/^\s+/.test(lines[i]))break;
    i++;
   }
  }else if(kind==='quote'){
   i++;while(i<n&&/^\s*>/.test(lines[i]))i++;
  }else{
   i++;while(i<n&&lines[i].trim()&&!structural(lines[i]))i++;
  }
  blocks.push({start,end:i,kind});
 }
 return blocks;
}
function writerV106DragBlockAt(lines,line){
 const count=lines.length;
 const y=Math.max(0,Math.min(count-1,Math.floor(Number(line)||0)));
 const blocks=writerV106DragBlocks(lines);
 return blocks.find(b=>y>=b.start&&y<b.end)||blocks.find(b=>b.start>y)||blocks[blocks.length-1]||null;
}
function writerV106DragMove(source,fromStart,fromEnd,dest,indent=0){
 const lines=String(source||'').split('\n'),max=lines.length;
 const start=Math.max(0,Math.min(max,Math.floor(fromStart)));
 const end=Math.max(start,Math.min(max,Math.floor(fromEnd)));
 const target=Math.max(0,Math.min(max,Math.floor(dest)));
 if(start===end||target>=start&&target<=end)return null;
 let moved=lines.slice(start,end);
 if(indent!==0&&/^\s*(?:[-*+]|\d+[.)])\s/.test(moved[0]||'')){
  const firstIndent=(moved[0].match(/^\s*/)||[''])[0].length;
  const safe=Math.max(-Math.floor(firstIndent/2),Math.min(5,Math.trunc(indent)));
  moved=moved.map(line=>{
   if(!line.trim())return line;
   const prefix=(line.match(/^\s*/)||[''])[0].length;
   return ' '.repeat(Math.max(0,prefix+2*safe))+line.trimStart();
  });
 }
 const lo=Math.min(start,target),hi=Math.max(end,target);
 const between=target<start?lines.slice(target,start):lines.slice(end,target);
 let replacement;
 if(target<start){
  const middle=[...between],separators=[];
  while(middle.length&&!middle[middle.length-1].trim())separators.unshift(middle.pop());
  replacement=[...moved,...separators,...middle];
 }else{
  const middle=[...between],separators=[];
  while(middle.length&&!middle[0].trim())separators.push(middle.shift());
  replacement=[...middle,...separators,...moved];
 }
 return {start:lo,end:hi,lines:replacement,sourceLength:hi-lo,
  insertion:target<start?target:target-(end-start),text:replacement.join('\n')};
}
function writerV106DragApply(editor,move){
 if(!move)return false;
 const last=editor.lineCount();
 const from={line:move.start,ch:0};
 const to=move.end<last?{line:move.end,ch:0}:{line:last-1,ch:editor.getLine(last-1).length};
 // A single document transaction (one undo step); never touch unrelated lines.
 const fragment=move.text+(move.end<last?'\n':'');
 editor.replaceRange(fragment,from,to);
 editor.setCursor({line:Math.max(0,Math.min(editor.lineCount()-1,move.insertion)),ch:0});
 return true;
}
function writerV106DragConvert(text,type){
 const line=String(text||'');
 if(!line.trim())return line;
 const body=line.replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+(?:\[(?: |x|X)\]\s+)?|\d+[.)]\s+)/,'').trimStart();
 const prefix=type==='heading'?'## ':type==='bullet'?'- ':type==='number'?'1. ':type==='task'?'- [ ] ':type==='quote'?'> ':type==='callout'?'> [!note] ':''; 
 return prefix+body;
}
function writerV106DragNativeConflict(plugin){
 const internal=plugin.app?.plugins;
 try{return !!(internal?.enabledPlugins?.has?.('dragger')||internal?.plugins?.dragger?.enabled);}
 catch(_){return false;}
}
function writerV106DragRegister(plugin){
 const cfg=writerV106DragMerge(plugin.settings);
 const {Platform:platform,setIcon:obsidianSetIcon}=require('obsidian');
 // Drag handles are desktop-only: on mobile they obstruct the editor and
 // interfere with touch selection. Do not create DOM, commands or listeners.
 if(platform?.isMobile===true||plugin.app?.isMobile===true)return;
 const doc=plugin.app.workspace.containerEl?.ownerDocument;
 if(!doc)return;
 const isMobile=()=>Boolean(platform?.isMobile||plugin.app.isMobile);
 const enabled=()=>cfg.enabled&&!writerV106DragNativeConflict(plugin);
 const handle=doc.createElement('button'),indicator=doc.createElement('div');
 handle.type='button';handle.className='writer-v106-drag-handle';
 handle.setAttribute('aria-label',writerUi('Arrastar bloco','Drag block'));
 handle.style.display='none';indicator.className='writer-v106-drag-indicator';indicator.style.display='none';
 doc.body.appendChild(handle);doc.body.appendChild(indicator);
 let active=null,drag=null,pressTimer=null,hideTimer=null,selection=null,sourceNode=null,targetNode=null;
 const viewFor=node=>{
  const view=plugin.app.workspace.getActiveViewOfType?.(require('obsidian').MarkdownView);
  if(!view?.editor||!view.containerEl?.contains(node)||!view.containerEl?.querySelector('.cm-content'))return null;
  return view;
 };
 const applyIcon=()=>{
  handle.replaceChildren();
  if(cfg.icon==='dot')handle.textContent='●';
  else if(cfg.icon==='square')handle.textContent='■';
  else if(typeof obsidianSetIcon==='function')obsidianSetIcon(handle,cfg.icon==='grip-lines'?'menu':'grip');
  else handle.textContent='⋮⋮';
  handle.style.width=cfg.size+'px';handle.style.height=cfg.size+'px';
  handle.style.color=cfg.color||'var(--text-muted)';
  indicator.style.backgroundColor=cfg.indicatorColor||'var(--interactive-accent)';
 };
 applyIcon();
 const clear=()=>{
  sourceNode?.classList.remove('writer-v106-drag-source');sourceNode=null;
  targetNode?.classList.remove('writer-v106-drag-target');targetNode=null;
  drag=null;active=null;selection=null;handle.style.display='none';indicator.style.display='none';
  plugin.app.workspace.containerEl?.classList.remove('writer-v106-dragging');
 };
 const locate=(view,x,y)=>{
  const ed=view?.editor;
  if(!ed?.posAtCoords)return null;
  const pos=ed.posAtCoords({left:x,top:y});
  if(!pos)return null;
  const lines=ed.getValue().split('\n');
  const block=writerV106DragBlockAt(lines,pos.line);
  return block?{block,view,ed,lines}:null;
 };
 const preview=(info,rect)=>{
  if(!info||!rect||!enabled()||cfg.visibility==='hidden'){handle.style.display='none';return;}
  active=info;
  handle.style.position='fixed';
  handle.style.left=Math.max(2,rect.left-cfg.size-7+cfg.offset)+'px';
  handle.style.top=Math.max(0,rect.top+Math.min(rect.height,28)/2-cfg.size/2)+'px';
  handle.style.display='flex';
 };
 const source=(view,point)=>{
  const ed=view.editor,lines=ed.getValue().split('\n');
  let range=writerV106DragBlockAt(lines,point.line);
  if(!range)return null;
  if(cfg.multiSelect){
   const first=ed.getCursor?.('from'),last=ed.getCursor?.('to');
   if(first&&last&&last.line>first.line){
    const start=writerV106DragBlockAt(lines,first.line);
    const finish=writerV106DragBlockAt(lines,Math.max(first.line,last.line-(last.ch===0?1:0)));
    if(start&&finish)range={start:start.start,end:finish.end,kind:'selection'};
   }else if(selection?.view===view){
    range={start:Math.min(selection.start,range.start),end:Math.max(selection.end,range.end),kind:'selection'};
   }
  }
  return {ed,view,range,lines,initialX:point.x,point};
 };
 const startDrag=(point,view,origin)=>{
  if(!enabled()||!view?.editor)return false;
  const data=source(view,point);
  if(!data)return false;
  drag={...data,target:data.range.end,destRect:null,origin,indent:0};
  plugin.app.workspace.containerEl?.classList.add('writer-v106-dragging');
  handle.classList.add('is-dragging');
  const coords=view.editor.coordsAtPos?.({line:data.range.start,ch:0});
  sourceNode=coords?doc.elementFromPoint?.(coords.left+6,coords.top+4)?.closest?.('.cm-line'):null;
  if(cfg.highlight)sourceNode?.classList.add('writer-v106-drag-source');
  return true;
 };
 const targetAt=e=>{
  if(!drag)return;
  const view=drag.view,ed=view.editor;
  const pos=ed.posAtCoords?.({left:e.clientX,top:e.clientY});
  if(!pos)return;
  const lines=ed.getValue().split('\n'),block=writerV106DragBlockAt(lines,pos.line);
  const node=doc.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('.cm-line');
  if(targetNode&&targetNode!==node)targetNode.classList.remove('writer-v106-drag-target');
  targetNode=node||null;
  if(cfg.highlight&&targetNode&&targetNode!==sourceNode)targetNode.classList.add('writer-v106-drag-target');
  const scroller=view.containerEl.querySelector('.cm-scroller');
  if(scroller){
   const rect=scroller.getBoundingClientRect();
   if(e.clientY<rect.top+30)scroller.scrollTop-=12;
   else if(e.clientY>rect.bottom-30)scroller.scrollTop+=12;
  }
  if(!block)return;
  const targetLine=block.start;
  drag.target=targetLine>=drag.range.start&&targetLine<drag.range.end?drag.range.end:targetLine;
  const list=drag.range.kind==='list'||(/^\s*(?:[-*+]|\d+[.)])\s/.test(lines[drag.range.start]||''));
  drag.indent=list&&cfg.nested?Math.max(-3,Math.min(5,Math.round((e.clientX-drag.initialX)/28))):0;
  const coords=ed.coordsAtPos?.({line:Math.min(ed.lineCount()-1,Math.max(0,drag.target)),ch:0});
  const root=view.containerEl.querySelector('.cm-content')?.getBoundingClientRect();
  if(coords&&root){
   indicator.style.cssText='display:block;position:fixed;z-index:100;pointer-events:none;height:3px;border-radius:3px;';
   indicator.style.left=root.left+'px';indicator.style.width=root.width+'px';
   indicator.style.top=coords.top+'px';indicator.style.backgroundColor=cfg.indicatorColor||'var(--interactive-accent)';
  }
 };
 const finishDrag=()=>{
  if(!drag)return;
  const {ed,range,target,indent}=drag;
  let moved=false;
  try{
   const current=ed.getValue();
   const result=writerV106DragMove(current,range.start,range.end,target,indent);
   moved=writerV106DragApply(ed,result);
  }catch(error){console.warn('[Basic AI] Move block:',error);new Notice(writerUi('Não foi possível mover o bloco.','Could not move the block.'));}
  drag=null;selection=null;indicator.style.display='none';handle.classList.remove('is-dragging');
  sourceNode?.classList.remove('writer-v106-drag-source');sourceNode=null;
  targetNode?.classList.remove('writer-v106-drag-target');targetNode=null;
  plugin.app.workspace.containerEl?.classList.remove('writer-v106-dragging');
  if(moved){handle.style.display='none';active=null;}
 };
 const withCurrent=(fn)=>{
  const view=plugin.app.workspace.getActiveViewOfType?.(require('obsidian').MarkdownView);
  if(!view?.editor)return;
  const ed=view.editor,at=ed.getCursor().line,lines=ed.getValue().split('\n');
  const block=writerV106DragBlockAt(lines,at);
  if(block)fn({ed,view,at,lines,block});
 };
 const moveBy=direction=>withCurrent(({ed,lines,block})=>{
  const ranges=writerV106DragBlocks(lines);
  const idx=ranges.findIndex(b=>b.start===block.start);
  const neighbor=ranges[idx+direction];
  if(!neighbor)return;
  const destination=direction<0?neighbor.start:neighbor.end;
  writerV106DragApply(ed,writerV106DragMove(ed.getValue(),block.start,block.end,destination,0));
 });
 const convert=type=>withCurrent(({ed,lines,block})=>{
  if(type==='delete'){const modal=new Modal(plugin.app);modal.setTitle(writerUi('Excluir este bloco?','Delete this block?'));
   modal.onOpen=()=>{
    modal.contentEl.createEl('p',{text:writerUi('A exclusão pode ser desfeita pelo editor.','You can undo this action in the editor.')});
    const btn=modal.contentEl.createEl('button',{text:writerUi('Excluir bloco','Delete block'),cls:'mod-warning'});
    btn.addEventListener('click',()=>{ed.replaceRange('',{line:block.start,ch:0},{line:Math.min(ed.lineCount()-1,block.end),ch:0});modal.close();});
   };modal.open();return;}
  if(block.kind==='fence'||block.kind==='table')return new Notice(writerUi('Blocos de código e tabelas não são convertidos automaticamente.','Code blocks and tables cannot be converted automatically.'));
  const original=lines[block.start];
  ed.replaceRange(writerV106DragConvert(original,type),{line:block.start,ch:0},{line:block.start,ch:original.length});
 });
 const showMenu=ev=>{
  const menu=new Menu();
  for(const [kind,pt,en,icon] of [
   ['paragraph','Parágrafo','Paragraph','pilcrow'],['heading','Título nível 2','Heading level 2','heading-2'],
   ['bullet','Lista','Bullet list','list'],['number','Lista numerada','Numbered list','list-ordered'],
   ['task','Tarefa','Task','list-check'],['quote','Citação','Quote','quote'],
   ['callout','Callout','Callout','message-square'],['delete','Excluir bloco','Delete block','trash-2']
  ])menu.addItem(item=>item.setTitle(writerUi(pt,en)).setIcon(icon).onClick(()=>convert(kind)));
  if(ev?.clientX!==undefined)menu.showAtPosition({x:ev.clientX,y:ev.clientY});
  else menu.showAtPosition({x:200,y:120});
 };
 const pointermove=e=>{
  clearTimeout(hideTimer);
  if(drag){e.preventDefault?.();targetAt(e);return;}
  if(!enabled())return;
  const line=e.target?.closest?.('.cm-line');
  if(!line){if(cfg.visibility!=='always')hideTimer=setTimeout(()=>{if(!drag)handle.style.display='none';},170);return;}
  const view=viewFor(line);
  if(!view)return;
  const rect=line.getBoundingClientRect();
  const info=locate(view,rect.left+Math.min(15,rect.width/2),rect.top+Math.min(8,rect.height/2));
  preview(info,rect);
 };
 const pointerdown=e=>{
  if(e.target===handle||handle.contains(e.target)){
   if(e.button===2)return;
   if(!active)return;
   if(e.shiftKey&&cfg.multiSelect){
    selection={view:active.view,start:active.block.start,end:active.block.end};
    return;
   }
   e.preventDefault();
   startDrag({x:e.clientX,y:e.clientY,line:active.block.start},active.view,'handle');
   return;
  }
  if(!enabled()||!isMobile()||!cfg.mobileLongPress||e.pointerType!=='touch')return;
  const line=e.target?.closest?.('.cm-line');
  const view=line&&viewFor(line);
  if(!view)return;
  const x=e.clientX,y=e.clientY;
  plugin._writerV106TouchOrigin={x,y};
  clearTimeout(pressTimer);
  pressTimer=setTimeout(()=>{
   pressTimer=null;
   const pos=view.editor.posAtCoords?.({left:x,top:y});
   if(!pos)return;
   if(startDrag({x,y,line:pos.line},view,'touch')){new Notice(writerUi('Arraste para mover o bloco','Drag to move the block'),1000);}
  },420);
 };
 const release=e=>{
  clearTimeout(pressTimer);pressTimer=null;plugin._writerV106TouchOrigin=null;
  if(drag){e.preventDefault?.();finishDrag();}
 };
 plugin.registerDomEvent(plugin.app.workspace.containerEl,'pointermove',pointermove,true);
 plugin.registerDomEvent(plugin.app.workspace.containerEl,'pointerdown',pointerdown,true);
 plugin.registerDomEvent(doc,'pointermove',e=>{
  if(pressTimer&&e.pointerType==='touch'){const origin=plugin._writerV106TouchOrigin;if(origin&&Math.hypot(origin.x-e.clientX,origin.y-e.clientY)>12){clearTimeout(pressTimer);pressTimer=null;}}
  if(drag)targetAt(e);
 },true);
 plugin.registerDomEvent(doc,'pointerup',release,true);
 plugin.registerDomEvent(doc,'pointercancel',()=>{clearTimeout(pressTimer);pressTimer=null;clear();},true);
 plugin.registerDomEvent(handle,'contextmenu',e=>{e.preventDefault();showMenu(e);});
 plugin.registerDomEvent(handle,'click',e=>{if(!drag&&isMobile())showMenu(e);});
 plugin.registerDomEvent(doc,'keydown',e=>{if(e.key==='Escape'&&drag){clear();}});
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',clear));
 plugin.addCommand({id:'v106-drag-move-block-up',name:writerUi('Bloco: mover para cima','Block: move up'),editorCallback:()=>moveBy(-1)});
 plugin.addCommand({id:'v106-drag-move-block-down',name:writerUi('Bloco: mover para baixo','Block: move down'),editorCallback:()=>moveBy(1)});
 plugin.addCommand({id:'v106-drag-block-type',name:writerUi('Bloco: mudar tipo…','Block: change type…'),editorCallback:()=>showMenu(null)});
 plugin.writerV106DragApplyStyles=applyIcon;
 plugin.register?.(()=>{clearTimeout(pressTimer);clearTimeout(hideTimer);clear();handle.remove();indicator.remove();});
}
function writerV106DragSettings(plugin,panel){
 const cfg=writerV106DragMerge(plugin.settings);
 panel.createEl('h3',{text:writerUi('Arrastar blocos (Dragger)','Block dragger')});
 if(require('obsidian').Platform?.isMobile===true||plugin.app?.isMobile===true){
  panel.createEl('p',{cls:'setting-item-description',text:writerUi('O Dragger está desativado no celular. Nenhuma alça ou gesto de arrastar será instalado. Suas preferências para PC foram preservadas.','Dragger is disabled on mobile. No drag handles or gestures will be installed. Your desktop preferences are preserved.')});
  return;
 }
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Disponível somente no computador. No celular, a alça e seus eventos são desativados para não atrapalhar a seleção de texto nem ocupar espaço. No PC, arraste os blocos pela alça; Ctrl+Z desfaz.','Desktop only. On mobile, drag handles and touch listeners are disabled to avoid obstructing text selection or taking up editor space. On desktop, drag blocks using the handle; undo with Ctrl+Z.')});
 for(const [k,pt,en] of [['enabled','Ativar alça de arrastar','Enable drag handles'],['multiSelect','Mover seleção de linhas juntas','Move selected lines together'],['nested','Ajustar recuo de listas ao arrastar','Adjust list indentation while dragging'],['highlight','Destacar bloco de origem','Highlight source block']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[k]!==false).onChange(async v=>{cfg[k]=v;await plugin.saveSettings();plugin.writerV106DragApplyStyles?.();}));
 }
 new Setting(panel).setName(writerUi('Mostrar alça','Handle visibility')).addDropdown(d=>{
  for(const [v,pt,en] of [['hover','Ao passar o mouse','On hover'],['always','Sempre que mover o mouse','While moving pointer'],['hidden','Oculta (somente comandos)','Hidden (commands only)']])d.addOption(v,writerUi(pt,en));
  d.setValue(cfg.visibility);d.onChange(async v=>{cfg.visibility=v;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Ícone da alça','Handle icon')).addDropdown(d=>{
  for(const [v,pt,en] of [['grip','Seis pontos','Six dots'],['grip-lines','Três linhas','Three lines'],['dot','Ponto','Dot'],['square','Quadrado','Square']])d.addOption(v,writerUi(pt,en));
  d.setValue(cfg.icon);d.onChange(async v=>{cfg.icon=v;await plugin.saveSettings();plugin.writerV106DragApplyStyles?.();});
 });
 for(const [key,pt,en,min,max] of [['size','Tamanho da alça','Handle size',12,28],['offset','Deslocamento lateral','Horizontal offset',-70,70]])
  new Setting(panel).setName(writerUi(pt,en)).addSlider(s=>s.setLimits(min,max,key==='size'?2:5).setValue(cfg[key]).setDynamicTooltip().onChange(async n=>{cfg[key]=n;await plugin.saveSettings();plugin.writerV106DragApplyStyles?.();}));
 for(const [key,pt,en] of [['color','Cor da alça','Handle color'],['indicatorColor','Cor do indicador','Drop indicator color']])
  new Setting(panel).setName(writerUi(pt,en)).setDesc(writerUi('Hexadecimal #RRGGBB, vazio usa a cor do tema.','Hex #RRGGBB; empty follows the theme.'))
   .addText(t=>t.setValue(cfg[key]).setPlaceholder('#aa88ff').onChange(async val=>{if(val&&!/^#[0-9a-f]{6}$/i.test(val))return;cfg[key]=val;await plugin.saveSettings();plugin.writerV106DragApplyStyles?.();}));
}
