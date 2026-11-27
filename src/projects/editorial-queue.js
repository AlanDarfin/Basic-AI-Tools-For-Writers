'use strict';
/* Upgrade the existing Longform comments in place. The queue never writes to a
 * manuscript and only reads editor text to capture or locate a quotation. */
function writerEditorialItems(store,path){
 return store&&Object.hasOwn(store,path)&&Array.isArray(store[path])?store[path]:[];
}
function writerEditorialPut(store,path,items){
 if(items.length)Object.defineProperty(store,path,{value:items,enumerable:true,writable:true,configurable:true});
 else delete store[path];
}
function writerEditorialSerial(plugin,work){
 const result=(plugin._writerEditorialWrite||Promise.resolve()).catch(()=>{}).then(work);
 plugin._writerEditorialWrite=result;
 return result;
}
function writerEditorialChange(plugin,file,update){
 return writerEditorialSerial(plugin,async()=>{
  if(!writerModuleOn(plugin,'comments'))throw Error(writerUi('Os comentários estão desativados.','Comments are disabled.'));
  const path=file?.path;
  if(file?.extension!=='md'||plugin.app.vault.getAbstractFileByPath(path)!==file)
   throw Error(writerUi('O capítulo não está mais disponível.','The chapter is no longer available.'));
  const store=plugin.settings.writerV4Extras.comments,previous=writerEditorialItems(store,path);
  const next=update(previous);
  if(next===previous)return;
  writerEditorialPut(store,path,next);
  try{await plugin.saveSettings();}
  catch(error){writerEditorialPut(store,path,previous);throw error;}
 });
}
function writerEditorialRename(plugin,oldPath,newPath){
 return writerEditorialSerial(plugin,async()=>{
  const store=plugin.settings.writerV4Extras.comments;
  const moves=Object.keys(store).map(path=>[path,writerProjectRenamedPath(path,oldPath,newPath)])
   .filter(([path,next])=>next!==path);
  if(!moves.length)return;
  const entries=moves.map(([path,next])=>[path,next,writerEditorialItems(store,path)]);
  for(const [path] of entries)delete store[path];
  for(const [,next,items] of entries)writerEditorialPut(store,next,[...writerEditorialItems(store,next),...items]);
  // The vault rename already happened. Keep the correct paths in memory if
  // saving fails so the next settings save can persist them.
  await plugin.saveSettings();
 });
}
function writerEditorialCapture(editor){
 const selected=editor?.getSelection?.();
 if(!selected?.trim())return null;
 const quote=selected.slice(0,2000),text=editor.getValue?.();
 const start=editor.getCursor?.('from'),at=start?editor.posToOffset?.(start):null;
 if(typeof text!=='string'||!Number.isInteger(at)||at<0||text.slice(at,at+quote.length)!==quote)return {quote};
 return {quote,anchor:{before:text.slice(Math.max(0,at-64),at),after:text.slice(at+quote.length,at+quote.length+64),
  repeated:text.indexOf(quote)!==text.lastIndexOf(quote)}};
}
function writerEditorialLocate(text,comment){
 const quote=comment?.quote;
 if(typeof quote!=='string'||!quote.trim()||text.indexOf(quote)<0)return {kind:'missing'};
 const first=text.indexOf(quote),second=text.indexOf(quote,first+1),anchor=comment.anchor;
 if(second<0&&!anchor?.repeated)return {kind:'match',at:first};
 const before=typeof anchor?.before==='string'?anchor.before:'',after=typeof anchor?.after==='string'?anchor.after:'';
 if(!before&&!after)return {kind:'ambiguous'};
 let best=-1,score=0,tied=false;
 for(let at=first;at>=0;at=text.indexOf(quote,at+1)){
  const evidence=Number(!!before&&text.slice(Math.max(0,at-before.length),at)===before)+
   Number(!!after&&text.startsWith(after,at+quote.length));
  if(evidence>score){best=at;score=evidence;tied=false;}
  else if(score>0&&evidence===score)tied=true;
 }
 return best<0||tied?{kind:'ambiguous'}:{kind:'match',at:best};
}
async function writerEditorialJump(plugin,file,comment){
 const {vault,workspace}=plugin.app,path=file.path;
 const token=(plugin._writerEditorialJump||0)+1;plugin._writerEditorialJump=token;
 const live=()=>plugin._writerEditorialJump===token&&writerModuleOn(plugin,'comments')&&
  file.path===path&&vault.getAbstractFileByPath(path)===file;
 if(!live())return;
 const leaves=(workspace.getLeavesOfType('markdown')||[]).filter(leaf=>leaf.view?.file===file);
 const ordered=[workspace.activeLeaf,...leaves].filter(leaf=>leaf?.view?.file===file);
 let leaf=ordered.find(leaf=>leaf.view.editor&&leaf.view.getMode?.()!=='preview')||ordered[0];
 if(!leaf){
  leaf=workspace.getLeaf('tab');
  if(!leaf)throw Error(writerUi('Não foi possível abrir o capítulo.','Could not open the chapter.'));
  await leaf.openFile(file,comment.quote?{active:true,state:{mode:'source'}}:{active:true});
 }else if(comment.quote&&leaf.view.getMode?.()==='preview'){
  const state=leaf.getViewState();
  await leaf.setViewState({...state,active:true,state:{...state.state,mode:'source'}});
 }
 if(!live()||leaf.view?.file!==file)return;
 await workspace.revealLeaf(leaf);
 if(!live()||leaf.view?.file!==file||!comment.quote)return;
 const view=leaf.view,editor=view.getMode?.()==='preview'?null:view.editor;
 if(!editor)throw Error(writerUi('Abra o capítulo no modo de edição para localizar o trecho.','Switch the chapter to editing mode to locate the passage.'));
 const hit=writerEditorialLocate(editor.getValue(),comment);
 if(hit.kind!=='match'){
  new Notice(hit.kind==='missing'?writerUi('O trecho mudou. O comentário foi preservado.','The passage changed. The comment was kept.'):
   writerUi('Não foi possível distinguir esse trecho com segurança. O comentário foi preservado.','Could not identify the passage unambiguously. The comment was kept.'));
  return;
 }
 const from=editor.offsetToPos(hit.at),to=editor.offsetToPos(hit.at+comment.quote.length);
 editor.setSelection(from,to);
 editor.scrollIntoView({from,to},true);
 if(!plugin.app.isMobile)editor.focus?.();
}
function writerEditorialChapters(view,project){
 const rows=[],seen=new Set();
 const add=(file,title)=>{
  if(file?.extension!=='md'||seen.has(file.path))return;
  seen.add(file.path);rows.push({file,title});
 };
 // Keep existing index comments accessible. For single-note projects the
 // index is the manuscript itself.
 add(project.file,project.format==='single'?project.title:project.file.basename);
 if(project.format!=='single')for(const scene of view.activeScenes(project))add(view.resolveScene(project,scene.title),scene.title);
 return rows;
}
function writerEditorialText(value){
 return String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
}
function writerEditorialScope(chapters,store,{chapter=null,status='open',query=''}={}){
 const terms=writerEditorialText(query).trim().split(/\s+/).filter(Boolean),groups=[];
 let open=0,resolved=0,visible=0;
 for(const row of chapters){
  const {file,title}=row,items=writerEditorialItems(store,file.path).filter(comment=>comment&&typeof comment.body==='string');
  for(const comment of items)if(comment.resolved)resolved++;else open++;
  if(chapter&&chapter!==file)continue;
  const shown=items.filter(comment=>{
   if(status!=='all'&&!!comment.resolved!==(status==='resolved'))return false;
   if(!terms.length)return true;
   const haystack=writerEditorialText(title+' '+file.path+' '+comment.body+' '+(comment.quote||''));
   return terms.every(term=>haystack.includes(term));
  });
  if(shown.length){groups.push({...row,items:shown});visible+=shown.length;}
 }
 return {groups,open,resolved,visible};
}
function writerEditorialRefresh(plugin){
 for(const leaf of plugin.app.workspace.getLeavesOfType(PROJECT_VIEW)||[]){
  if(leaf.view?.activeTab==='comments')leaf.view.queueRender?.();
 }
}
function writerEditorialError(error){
 console.error('[Basic] Editorial comments:',error);
 new Notice(writerUi('Não foi possível concluir a ação no comentário.','Could not complete the comment action.'));
}
function writerEditorialCompose(plugin,file,capture){
 if(!writerModuleOn(plugin,'comments'))return new Notice(writerUi('Comentários ocultos nas configurações.','Comments are hidden in settings.'));
 const modal=new Modal(plugin.app);
 modal.onOpen=()=>{
  modal.setTitle(capture?writerUi('Comentar trecho','Comment on passage'):writerUi('Comentar capítulo','Comment on chapter'));
  const root=modal.contentEl;
  root.addClass('writer-editorial-compose');
  root.createEl('p',{text:file.basename});
  if(capture)root.createEl('blockquote',{text:capture.quote});
  const label=root.createEl('label',{text:writerUi('Comentário','Comment')});
  const input=label.createEl('textarea',{attr:{rows:'4',maxlength:'10000'}});
  input.focus();
  let saving=false;
  new Setting(root).addButton(button=>button.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>{if(!saving)modal.close();}))
   .addButton(button=>button.setButtonText(writerUi('Salvar comentário','Save comment')).setCta().onClick(async()=>{
    const body=input.value.trim();
    if(!body||saving)return;
    saving=true;input.disabled=true;button.setDisabled(true);
    try{
     const record={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),quote:'',...capture,
      body,at:new Date().toISOString(),resolved:false};
     await writerEditorialChange(plugin,file,items=>[...items,record]);
     modal.close();writerEditorialRefresh(plugin);
     new Notice(writerUi('Comentário salvo na fila de revisão.','Comment saved to the review queue.'));
    }catch(error){writerEditorialError(error);}
    finally{saving=false;input.disabled=false;button.setDisabled(false);}
   }));
 };
 modal.open();
}
function writerEditorialQueue(view,panel,project){
 const plugin=view.plugin,chapters=writerEditorialChapters(view,project);
 const root=panel.createDiv({cls:'writer-editorial-queue'});
 const state=(view.writerEditorialFilters??=new WeakMap());
 if(!state.has(project.file))state.set(project.file,{chapter:null,status:'open',query:''});
 const filter=state.get(project.file);
 if(filter.chapter&&!chapters.some(row=>row.file===filter.chapter))filter.chapter=null;
 root.createEl('h4',{text:writerUi('Fila de revisão','Review queue')});
 const tools=root.createDiv({cls:'writer-editorial-controls'});
 const chapter=tools.createEl('select',{attr:{'aria-label':writerUi('Filtrar por capítulo','Filter by chapter')}});
 chapter.createEl('option',{text:writerUi('Todos os capítulos','All chapters'),value:''});
 for(const {file,title} of chapters)chapter.createEl('option',{text:title,value:file.path});
 chapter.value=filter.chapter?.path||'';
 const status=tools.createEl('select',{attr:{'aria-label':writerUi('Estado do comentário','Comment status')}});
 for(const [id,pt,en] of [['open','Pendentes','Open'],['resolved','Resolvidos','Resolved'],['all','Todos os estados','All statuses']])
  status.createEl('option',{text:writerUi(pt,en),value:id});
 status.value=filter.status;
 const search=tools.createEl('input',{attr:{type:'search',maxlength:'200',placeholder:writerUi('Buscar na revisão…','Search review…'),
  'aria-label':writerUi('Buscar comentários','Search comments')}});
 search.value=filter.query;
 const add=tools.createEl('button',{text:writerUi('Comentar capítulo','Comment on chapter'),attr:{type:'button'}});
 const summary=root.createEl('p',{cls:'writer-tools-muted',attr:{role:'status'}});
 const list=root.createDiv({cls:'writer-editorial-list'});
 const chosen=()=>filter.chapter||chapters.find(row=>row.file===plugin.app.workspace.getActiveFile?.())?.file||null;
 add.addEventListener('click',()=>{
  const file=chosen();
  if(!file){chapter.focus();return new Notice(writerUi('Escolha um capítulo para comentar.','Select a chapter to comment on.'));}
  writerEditorialCompose(plugin,file,null);
 });
 const draw=()=>{
  const {groups,open,resolved,visible}=writerEditorialScope(chapters,plugin.settings.writerV4Extras.comments,filter);
  summary.setText(writerUi(open+' pendentes · '+resolved+' resolvidos · '+visible+' exibidos',
   open+' open · '+resolved+' resolved · '+visible+' shown'));
  list.empty();
  if(!visible){
   list.createEl('p',{cls:'writer-tools-muted',text:open+resolved===0?
    writerUi('Selecione um trecho no editor e use “Comentar seleção”, ou comente um capítulo inteiro.',
     'Select a passage and use “Comment on selection”, or comment on an entire chapter.'):
    writerUi('Nenhum comentário corresponde aos filtros.','No comments match the filters.')});
   return;
  }
  for(const {file,title,items} of groups){
   const section=list.createEl('section',{cls:'writer-editorial-section'});
   section.createEl('h5',{text:title,attr:{title:file.path}});
   for(const comment of items){
    const card=section.createDiv({cls:'writer-v4-comment-card'});
    if(comment.quote)card.createEl('blockquote',{text:comment.quote});
    card.createEl('p',{text:comment.body});
    const date=new Date(comment.at),statusText=comment.resolved?writerUi('Resolvido','Resolved'):writerUi('Pendente','Open');
    card.createEl('small',{text:statusText+(Number.isFinite(date.getTime())?' · '+date.toLocaleString():'')});
    const actions=card.createDiv({cls:'writer-editorial-actions'});
    const btn=(pt,en,action)=>actions.createEl('button',{attr:{type:'button'},text:writerUi(pt,en)}).addEventListener('click',action);
    btn(comment.quote?'Ir ao trecho':'Abrir capítulo',comment.quote?'Go to passage':'Open chapter',
     ()=>void writerEditorialJump(plugin,file,comment).catch(error=>{
      if(error?.message)new Notice(error.message);else writerEditorialError(error);
     }));
    const update=async action=>{
     for(const button of actions.querySelectorAll('button'))button.disabled=true;
     try{
      await writerEditorialChange(plugin,file,items=>{
       if(!items.includes(comment))return items;
       return action==='delete'?items.filter(item=>item!==comment):
        items.map(item=>item===comment?{...item,resolved:!item.resolved}:item);
      });
      if(root.isConnected){
       const active=root.ownerDocument.activeElement;
       const restore=card.contains(active)||active===root.ownerDocument.body;
       draw();
       if(restore)status.focus({preventScroll:true});
      }
      for(const leaf of plugin.app.workspace.getLeavesOfType(PROJECT_VIEW)||[])
       if(leaf.view!==view&&leaf.view?.activeTab==='comments')leaf.view.queueRender?.();
     }catch(error){writerEditorialError(error);}
     finally{for(const button of actions.querySelectorAll('button'))button.disabled=false;}
    };
    btn(comment.resolved?'Reabrir':'Resolver',comment.resolved?'Reopen':'Resolve',()=>void update('toggle'));
    btn('Excluir','Delete',()=>{
     new ConfirmProjectAction(plugin.app,writerUi('Excluir comentário?','Delete comment?'),
      writerUi('O capítulo não será alterado.','The chapter will not change.'),()=>update('delete')).open();
    });
   }
  }
 };
 chapter.addEventListener('change',()=>{filter.chapter=chapters.find(row=>row.file.path===chapter.value)?.file||null;draw();});
 status.addEventListener('change',()=>{filter.status=status.value;draw();});
 search.addEventListener('input',()=>{filter.query=search.value;draw();});
 draw();
}
