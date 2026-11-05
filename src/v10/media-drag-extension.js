'use strict';
/* Cross-note block move, responsive columns and best-effort PDF per-page previews. */
function writerV107MediaConfig(settings){
 const old=settings.v107Media&&typeof settings.v107Media==='object'?settings.v107Media:{};
 return settings.v107Media={pdfPages:true,maxPage:30,crossNote:true,columns:true,...old,maxPage:Math.max(3,Math.min(80,Number(old.maxPage)||30))};
}
function writerV107CrossNoteBlock(editor){
 const selected=editor.getSelection();
 if(selected.trim())return {text:selected,from:editor.getCursor('from'),to:editor.getCursor('to')};
 const lines=editor.getValue().split('\n'),point=editor.getCursor().line;
 const block=writerV106DragBlockAt(lines,point);
 if(!block)return null;
 const text=lines.slice(block.start,block.end).join('\n');
 if(!text.trim())return null;
 const last=block.end<lines.length;
 const from={line:block.start,ch:0},to=last?{line:block.end,ch:0}:{line:block.end-1,ch:lines[block.end-1].length};
 return {text,last,from,to};
}
function writerV107MoveBlockModal(plugin,editor,source){
 const payload=writerV107CrossNoteBlock(editor);
 if(!payload||payload.text.length>50000)return new Notice(writerUi('Selecione um bloco de até 50 mil caracteres.','Select a block under 50,000 characters.'));
 const files=plugin.app.vault.getMarkdownFiles().filter(f=>f.path!==source.path&&f.stat.size<1000000).slice(0,1500);
 if(!files.length)return;
 const Suggest=require('obsidian').FuzzySuggestModal;
 const picker=new (class extends Suggest{
  getItems(){return files;}
  getItemText(file){return file.path;}
  onChooseItem(file){
   const modal=new Modal(plugin.app);modal.setTitle(writerUi('Mover bloco entre notas','Move block between notes'));
   modal.onOpen=()=>{
    modal.contentEl.createEl('p',{text:source.path+' → '+file.path});
    modal.contentEl.createEl('p',{text:writerUi('Cria snapshots quando disponíveis. Não exclui o bloco de origem até confirmar a gravação no destino.','Creates snapshots when available. Source text is not removed until destination write succeeds.')});
    new Setting(modal.contentEl).addButton(btn=>btn.setButtonText(writerUi('Mover bloco','Move block')).setWarning().onClick(async()=>{
     btn.setDisabled(true);
     try{
      if(plugin.app.workspace.getActiveFile()?.path!==source.path)throw Error('Source note changed');
      const start=editor.getValue(),current=editor.getRange(payload.from,payload.to);
      if(current.trim()!==payload.text.trim())throw Error('Selected source block changed');
      await plugin.writerSnapshots?.create?.(source,'Before moving block to another note');
      await plugin.writerSnapshots?.create?.(file,'Before receiving block from another note');
      const append=data=>data.replace(/\s*$/,'')+'\n\n'+payload.text.trim()+'\n';
      if(typeof plugin.app.vault.process==='function')await plugin.app.vault.process(file,append);
      else{
       const data=await plugin.app.vault.cachedRead(file);
       if(await plugin.app.vault.cachedRead(file)!==data)throw Error('Target note changed');
       await plugin.app.vault.modify(file,append(data));
      }
      // Do not remove source content if it changed during the write: safe copy wins over data loss.
      if(editor.getValue()!==start||editor.getRange(payload.from,payload.to)!==current){
       new Notice(writerUi('Destino atualizado, mas a origem mudou: mantenha a cópia e revise manualmente.','Destination saved but source changed; please review the duplicate.'));
      }else{
       editor.replaceRange('',payload.from,payload.to);
       new Notice(writerUi('Bloco movido para ','Block moved to ')+file.path);
      }
      modal.close();
     }catch(e){new Notice(String(e.message||e).slice(0,240));btn.setDisabled(false);}
    }));
   };modal.open();
  }
 })(plugin.app);
 picker.setPlaceholder(writerUi('Escolha a nota de destino…','Choose destination note…'));picker.open();
}
function writerV107ColumnsRender(plugin,source,element,ctx){
 const root=element.createDiv({cls:'writer-v107-columns'});
 const sections=String(source||'').split(/^\s*---column---\s*$/m).slice(0,4);
 for(const section of sections){
  const col=root.createDiv({cls:'writer-v107-column markdown-rendered'});
  void MarkdownRenderer.render(plugin.app,section,col,ctx.sourcePath,plugin).catch(()=>col.setText(section));
 }
}
function writerV107PdfViewer(plugin,file){
 if(!(file instanceof TFile)||file.extension!=='pdf')return;
 const modal=new Modal(plugin.app);modal.setTitle(file.basename);
 modal.onOpen=()=>{
  const root=modal.contentEl;root.addClass('writer-v107-pdf-modal');
  let page=1,max=plugin.settings.v107Media.maxPage;
  const url=plugin.app.vault.getResourcePath(file);
  const controls=root.createDiv({cls:'writer-v107-pdf-controls'}),panel=root.createDiv({cls:'writer-v107-pdf-pages'});
  const prev=controls.createEl('button',{text:'←'}),input=controls.createEl('input',{attr:{type:'number',min:'1',max:String(max),'aria-label':writerUi('Página','Page')}});
  const next=controls.createEl('button',{text:'→'});
  const native=controls.createEl('button',{text:writerUi('Abrir PDF no Obsidian','Open PDF in Obsidian')});
  native.addEventListener('click',()=>{modal.close();void plugin.app.workspace.getLeaf('tab').openFile(file);});
  const draw=()=>{
   panel.empty();input.value=String(page);prev.disabled=page<=1;next.disabled=page>=max;
   for(const n of [page,Math.min(max,page+1)].filter((x,i,a)=>a.indexOf(x)===i)){
    const cell=panel.createDiv({cls:'writer-v107-pdf-page'});
    cell.createEl('strong',{text:writerUi('Página ','Page ')+n});
    const frame=cell.createEl('iframe',{attr:{title:file.basename+' · '+n,loading:'lazy',src:url.split('#')[0]+'#page='+n+'&view=FitH'}});
    frame.setAttribute('referrerpolicy','no-referrer');
   }
  };
  prev.addEventListener('click',()=>{page=Math.max(1,page-1);draw();});
  next.addEventListener('click',()=>{page=Math.min(max,page+1);draw();});
  input.addEventListener('change',()=>{page=Math.max(1,Math.min(max,Number(input.value)||1));draw();});draw();
  root.createEl('small',{text:writerUi('A prévia usa o visualizador PDF do dispositivo e pode não funcionar em todas as WebViews. Use Abrir PDF quando necessário. O número máximo de páginas é configurável.','Page previews use your device PDF viewer and may not work in every WebView. Open the PDF natively if needed. The page limit is configurable.')});
 };
 modal.open();
}
function writerV107MediaRegister(plugin){
 writerV107MediaConfig(plugin.settings);
 const prior=writerV8MediaOpen;
 writerV8MediaOpen=function(p,items,index){
  const item=items[index];
  if(plugin.settings.v107Media.pdfPages&&item?.kind==='pdf')return writerV107PdfViewer(p,item.file);
  return prior(p,items,index);
 };
 plugin.register?.(()=>{writerV8MediaOpen=prior;});
 plugin.addCommand({id:'v107-move-block-to-note',name:writerUi('Dragger: mover bloco para outra nota','Dragger: move block to another note'),editorCheckCallback:(checking,editor,view)=>{
  if(!plugin.settings.v107Media.crossNote||!view?.file)return false;
  if(!checking)writerV107MoveBlockModal(plugin,editor,view.file);
  return true;
 }});
 plugin.addCommand({id:'v107-insert-columns',name:writerUi('Make.md: inserir colunas Markdown','Make.md: insert Markdown columns'),editorCallback:editor=>{
  const fence=String.fromCharCode(96).repeat(3);
  editor.replaceSelection(['',fence+'writer-columns','## '+writerUi('Coluna 1','Column 1'),'',
   '---column---','## '+writerUi('Coluna 2','Column 2'),fence,''].join('\n'));
 }});
 plugin.registerMarkdownCodeBlockProcessor('writer-columns',(source,element,ctx)=>writerV107ColumnsRender(plugin,source,element,ctx));
 plugin.addCommand({id:'v107-pdf-pages',name:writerUi('PDF: prévia por páginas','PDF: preview pages'),callback:()=>{
  const file=plugin.app.workspace.getActiveFile();
  if(file?.extension==='pdf')writerV107PdfViewer(plugin,file);
  else new Notice(writerUi('Abra um PDF para visualizar páginas.','Open a PDF to preview its pages.'));
 }});
}
function writerV107MediaSettings(plugin,panel){
 const cfg=plugin.settings.v107Media;
 panel.createEl('h3',{text:writerUi('Mídia, PDF e Dragger','Media, PDF and Dragger')});
 for(const [key,pt,en] of [['pdfPages','Prévia PDF por página','PDF page previews'],['crossNote','Mover blocos entre notas','Move blocks between notes'],['columns','Colunas Markdown responsivas','Responsive Markdown columns']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 }
 new Setting(panel).setName(writerUi('Máximo de páginas na prévia PDF','Maximum PDF preview page')).addSlider(s=>s.setLimits(3,80,1).setValue(cfg.maxPage).setDynamicTooltip().onChange(async v=>{cfg.maxPage=v;await plugin.saveSettings();}));
}
