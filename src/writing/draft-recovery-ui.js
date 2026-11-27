'use strict';
/* Longform recovery copies are separate from the original manuscript.
 * Export always creates a new Markdown note and never consumes the draft. */
function writerV134RecoveryExportEntry(entry){
 if(!entry||typeof entry.path!=='string'||typeof entry.text!=='string'||
  !/\.md$/i.test(entry.path)||entry.path.startsWith('/')||
  /[\\\u0000-\u001f]/.test(entry.path)||entry.path.split('/').some(part=>!part||part==='.'||part==='..'))
  throw Error(writerUi('Rascunho de recuperação inválido.','Invalid recovery draft.'));
 return {path:entry.path,text:entry.text,original:entry.original,updatedAt:entry.updatedAt};
}
async function writerV134SaveRecoveryCopy(plugin,entry){
 const snapshot=writerV134RecoveryExportEntry(entry),vault=plugin.app.vault;
 const index=snapshot.path.lastIndexOf('/'),parent=index<0?'':snapshot.path.slice(0,index);
 let folder=parent;
 if(parent&&!(vault.getAbstractFileByPath(parent) instanceof TFolder))folder='Basic Recovered';
 if(folder&&!(vault.getAbstractFileByPath(folder) instanceof TFolder)){
  try{await vault.createFolder(folder);}
  catch(error){if(!(vault.getAbstractFileByPath(folder) instanceof TFolder))throw error;}
 }
 const name=snapshot.path.slice(index+1).replace(/\.md$/i,'')
  .replace(/[<>:"|?*]/g,' ').replace(/[. ]+$/,'').trim().slice(0,120)||writerUi('Capítulo','Chapter');
 const suffix=writerUi('rascunho recuperado','recovered draft');
 for(let number=1;number<=1000;number++){
  const path=(folder?folder+'/':'')+name+' ('+suffix+(number>1?' '+number:'')+').md';
  if(vault.getAbstractFileByPath(path))continue;
  try{return await vault.create(path,snapshot.text);}
  catch(error){
   // Another view or sync process may have created this name after the check.
   if(!vault.getAbstractFileByPath(path))throw error;
  }
 }
 throw Error(writerUi('Não foi possível encontrar um nome livre para a cópia.','Could not find a free name for the copy.'));
}
function writerV134OpenRecovery(plugin,initialPath=''){
 const store=writerV134Recovery(plugin),modal=new Modal(plugin.app);
 modal.modalEl?.addClass('writer-v134-recovery-modal');
 modal.setTitle(writerUi('Recuperação de rascunhos Longform','Longform draft recovery'));
 let opened=false,ready=false,unsubscribe=null,selectedPath=initialPath,selected=null;
 let query='',rows=[],lastQuery='',readSerial=0,busy=false,confirmation=null;
 let filter,banner,retry,list,empty,detail,title,when,comparison,draft,current,currentNote,openOriginal,saveCopy,discard,refresh;
 const same=(a,b)=>Boolean(a&&b&&a.path===b.path&&a.original===b.original&&a.text===b.text);
 const text=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const date=value=>{
  const stamp=new Date(value);
  return Number.isFinite(stamp.getTime())?stamp.toLocaleString():writerUi('Horário indisponível','Time unavailable');
 };
 const fail=error=>new Notice(String(error?.message||error).slice(0,220));
 const actions=()=>{
  const exists=selected&&plugin.app.vault.getAbstractFileByPath(selected.path);
  if(openOriginal)openOriginal.disabled=!selected||!(exists instanceof TFile)||exists.extension!=='md';
  if(saveCopy)saveCopy.disabled=!selected||busy;
  if(discard){
   discard.disabled=!selected||busy;
   discard.setText(confirmation&&same(confirmation,selected)?
    writerUi('Confirmar descarte','Confirm discard'):writerUi('Descartar rascunho','Discard draft'));
  }
  if(refresh)refresh.disabled=!selected||busy;
  if(retry)retry.disabled=busy;
 };
 const inspect=async entry=>{
  const serial=++readSerial;
  current.value='';currentNote.setText('');
  comparison.dataset.state='loading';
  comparison.setText(writerUi('Verificando a nota original…','Checking the original note…'));
  actions();
  const file=plugin.app.vault.getAbstractFileByPath(entry.path);
  if(!(file instanceof TFile)||file.extension!=='md'){
   if(!opened||serial!==readSerial)return;
   comparison.dataset.state='missing';
   comparison.setText(writerUi('A nota original não foi encontrada. Você pode salvar uma nova cópia do rascunho.',
    'The original note was not found. You can save a new copy of the draft.'));
   return;
  }
  try{
   const content=await plugin.app.vault.read(file);
   if(!opened||serial!==readSerial)return;
   if(plugin.app.vault.getAbstractFileByPath(entry.path)!==file||file.path!==entry.path){
    comparison.dataset.state='missing';
    comparison.setText(writerUi('A nota mudou de caminho. Atualize a comparação.','The note moved. Refresh the comparison.'));
    actions();return;
   }
   current.value=content.slice(0,200000);
   if(content.length>current.value.length)currentNote.setText(writerUi(
    'Prévia da nota atual limitada aos primeiros 200 mil caracteres.',
    'The current-note preview shows the first 200,000 characters.'));
   const matches=content===entry.original;
   comparison.dataset.state=matches?'safe':'conflict';
   comparison.setText(matches?writerUi(
    'O arquivo original ainda corresponde à base do rascunho. A escrita contínua pode recuperar esse texto ao reabrir o capítulo.',
    'The original file still matches the draft base. Continuous writing can recover this text when you reopen the chapter.'):
    writerUi('A nota original mudou desde o início deste rascunho. Revise os textos e salve uma nova cópia para preservar ambos. Depois de conferir a cópia, você pode descartar este rascunho antigo para continuar editando no Longform.',
     'The original note changed after this draft began. Review both texts and save a new copy to preserve them. After checking the copy, you can discard this old draft to continue editing in Longform.'));
  }catch(error){
   if(!opened||serial!==readSerial)return;
   comparison.dataset.state='error';
   comparison.setText(writerUi('Não foi possível ler a nota original: ','Could not read the original note: ')+String(error.message||error).slice(0,180));
  }
 };
 const select=entry=>{
  if(!entry){
   selected=null;confirmation=null;readSerial++;detail.hidden=true;actions();return;
  }
  selectedPath=entry.path;
  if(same(selected,entry)&&selected.updatedAt===entry.updatedAt){actions();return;}
  selected={...entry};confirmation=null;detail.hidden=false;
  title.setText(entry.path);when.setText(writerUi('Atualizado: ','Updated: ')+date(entry.updatedAt));
  draft.value=entry.text;
  void inspect(selected);
 };
 const renderStatus=()=>{
  const state=store.status||{};
  banner.dataset.phase=state.phase||'loading';
  const messages={
   loading:writerUi('Carregando cópias locais de recuperação…','Loading local recovery copies…'),
   pending:writerUi('Cópia local de recuperação pendente. O capítulo original continua sem alterações.',
    'A local recovery copy is pending. The original chapter remains unchanged.'),
   saved:writerUi('Cópias locais de recuperação atualizadas. Salvar uma cópia cria uma nota nova.',
    'Local recovery copies are up to date. Saving a copy creates a new note.'),
   disabled:writerUi('Novas cópias de recuperação estão desativadas. Os rascunhos disponíveis ainda podem ser exportados ou descartados.',
    'New recovery copies are disabled. Available drafts can still be exported or discarded.')
  };
  banner.setText(state.phase==='error'?
   writerUi('A cópia local de recuperação precisa de atenção: ','The local recovery copy needs attention: ')+String(state.error||''):
   messages[state.phase]||messages.loading);
  retry.hidden=state.phase!=='error';actions();
 };
 const sync=()=>{
  if(!opened)return;
  renderStatus();if(!ready)return;
  const all=store.list(),needle=text(query);
  const visible=all.filter(entry=>!needle||text(entry.path).includes(needle));
  const changed=query!==lastQuery||visible.length!==rows.length||
   visible.some((entry,index)=>!same(entry,rows[index])||entry.updatedAt!==rows[index].updatedAt);
  const next=visible.find(entry=>entry.path===selectedPath)||visible[0]||null;
  if(changed){
   const focusedPath=Array.from(list.children).find(node=>node===list.ownerDocument?.activeElement)?.dataset.path;
   const scrollTop=list.scrollTop;
   let focusTarget=null;
   lastQuery=query;rows=visible.map(entry=>({...entry}));list.empty();
   for(const entry of visible){
    const button=list.createEl('button',{cls:'writer-v134-recovery-item',attr:{type:'button','aria-pressed':String(entry.path===next?.path)}});
    button.dataset.path=entry.path;
    if(entry.path===focusedPath)focusTarget=button;
    button.createSpan({cls:'writer-v134-recovery-item-path',text:entry.path});
    button.createEl('small',{text:date(entry.updatedAt)});
    button.addEventListener('click',()=>{
     selectedPath=entry.path;select(entry);
     for(const node of list.children)node.setAttribute('aria-pressed',String(node.dataset.path===selectedPath));
    });
   }
   if(focusTarget)focusTarget.focus({preventScroll:true});
   list.scrollTop=scrollTop;
  }
  empty.hidden=visible.length>0;
  empty.setText(all.length?writerUi('Nenhum rascunho corresponde à busca.','No drafts match the filter.'):
   writerUi('Nenhum rascunho Longform para recuperar. Alterações feitas na escrita contínua aparecem aqui.',
    'No Longform drafts to recover. Edits made in continuous writing appear here.'));
  select(next);
 };
 modal.onOpen=async()=>{
  opened=true;
  const root=modal.contentEl;root.empty();root.addClass('writer-v134-recovery');
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Estas são cópias locais de recuperação, separadas dos capítulos e dos snapshots. Revise o texto antes de salvar uma nova nota.',
   'These local recovery copies are separate from chapters and snapshots. Review the text before saving a new note.')});
  banner=root.createEl('p',{cls:'writer-v134-recovery-status',attr:{role:'status','aria-live':'polite'}});
  retry=root.createEl('button',{cls:'writer-v134-recovery-retry',text:writerUi('Tentar novamente','Try again'),attr:{type:'button'}});
  retry.hidden=true;
  retry.addEventListener('click',async()=>{
   if(busy)return;busy=true;actions();
   try{await store.retry();}catch(error){fail(error);}
   finally{busy=false;if(opened)sync();}
  });
  filter=root.createEl('input',{cls:'writer-v134-recovery-filter',attr:{type:'search','aria-label':writerUi('Filtrar rascunhos pelo caminho','Filter drafts by path'),placeholder:writerUi('Buscar capítulo ou pasta…','Find chapter or folder…')}});
  filter.value=query;filter.addEventListener('input',()=>{query=filter.value;sync();});
  const columns=root.createDiv({cls:'writer-v134-recovery-columns'});
  const navigation=columns.createDiv({cls:'writer-v134-recovery-navigation'});
  list=navigation.createDiv({cls:'writer-v134-recovery-list',attr:{role:'group','aria-label':writerUi('Rascunhos disponíveis','Available drafts')}});
  empty=navigation.createEl('p',{cls:'writer-v134-recovery-empty'});
  detail=columns.createDiv({cls:'writer-v134-recovery-detail'});detail.hidden=true;
  title=detail.createEl('h3',{cls:'writer-v134-recovery-path'});
  when=detail.createEl('p',{cls:'writer-v134-recovery-time'});
  comparison=detail.createEl('p',{cls:'writer-v134-recovery-comparison',attr:{role:'status','aria-live':'polite'}});
  const buttons=detail.createDiv({cls:'writer-v134-recovery-actions'});
  openOriginal=buttons.createEl('button',{cls:'writer-v134-recovery-open-original',text:writerUi('Abrir nota original','Open original note'),attr:{type:'button'}});
  openOriginal.addEventListener('click',async()=>{
   const entry=selected&&{...selected};if(!entry)return;
   const file=plugin.app.vault.getAbstractFileByPath(entry.path);
   if(!(file instanceof TFile)||file.extension!=='md'){fail(writerUi('A nota original não está disponível.','The original note is unavailable.'));return;}
   try{await plugin.app.workspace.getLeaf('tab').openFile(file);}catch(error){fail(error);}
  });
  saveCopy=buttons.createEl('button',{cls:'writer-v134-recovery-save-copy mod-cta',text:writerUi('Salvar cópia como nota','Save copy as note'),attr:{type:'button'}});
  saveCopy.addEventListener('click',async()=>{
   if(busy||!selected)return;
   const entry={...selected};busy=true;actions();
   try{
    const file=await writerV134SaveRecoveryCopy(plugin,entry);
    new Notice(writerUi('Cópia criada: ','Copy created: ')+file.path);
    try{await plugin.app.workspace.getLeaf('tab').openFile(file);}catch(error){fail(error);}
   }catch(error){fail(error);}
   finally{busy=false;if(opened)actions();}
  });
  discard=buttons.createEl('button',{cls:'writer-v134-recovery-discard',text:writerUi('Descartar rascunho','Discard draft'),attr:{type:'button'}});
  discard.addEventListener('click',async()=>{
   if(busy||!selected)return;
   if(!confirmation||!same(confirmation,selected)){confirmation={...selected};actions();return;}
   const entry=confirmation;busy=true;actions();
   try{await store.discard(entry);confirmation=null;}
   catch(error){confirmation=null;fail(error);}
   finally{busy=false;if(opened)sync();}
  });
  refresh=detail.createEl('button',{cls:'writer-v134-recovery-refresh',text:writerUi('Atualizar comparação','Refresh comparison'),attr:{type:'button'}});
  refresh.addEventListener('click',()=>{if(selected&&!busy)void inspect({...selected});});
  detail.createEl('label',{cls:'writer-v134-recovery-preview-label',text:writerUi('Texto do rascunho','Draft text')});
  draft=detail.createEl('textarea',{cls:'writer-v134-recovery-draft',attr:{readonly:'',spellcheck:'false','aria-label':writerUi('Texto do rascunho de recuperação','Recovery draft text')}});
  const comparisonDetails=detail.createEl('details',{cls:'writer-v134-recovery-original'});
  comparisonDetails.createEl('summary',{text:writerUi('Ver texto atual da nota original','View the current original note')});
  currentNote=comparisonDetails.createEl('p',{cls:'setting-item-description'});
  current=comparisonDetails.createEl('textarea',{cls:'writer-v134-recovery-current',attr:{readonly:'',spellcheck:'false','aria-label':writerUi('Texto atual da nota original','Current original note text')}});
  unsubscribe=store.subscribe(sync);
  renderStatus();
  await store.ready;
  if(!opened)return;
  ready=true;sync();
 };
 modal.onClose=()=>{
  opened=false;readSerial++;unsubscribe?.();unsubscribe=null;
  modal.contentEl.empty();
 };
 modal.open();return modal;
}
