'use strict';
/* Basic v11: Longform Studio — source-preserving continuous chapter workspace,
 * editorial review, scoped search, manuscript preview and diagnostics.
 * The source notes remain ordinary Markdown files; edits are explicit and guarded. */
function writerV11Cfg(settings){
 const old=settings.v11Studio&&typeof settings.v11Studio==='object'?settings.v11Studio:{};
 const cfg=settings.v11Studio={enabled:true,recoveryEnabled:true,searchLimit:240,chapterLimit:100,reviewNotes:{},...old};
 cfg.searchLimit=Math.max(25,Math.min(1000,Number(cfg.searchLimit)||240));
 cfg.chapterLimit=Math.max(10,Math.min(200,Number(cfg.chapterLimit)||100));
 if(!cfg.reviewNotes||typeof cfg.reviewNotes!=='object'||Array.isArray(cfg.reviewNotes))cfg.reviewNotes={};
 return cfg;
}
function writerV11Words(text){
 const clean=String(text||'').replace(/^---\r?\n[\s\S]*?\r?\n---\s*/,'').replace(/(?:\x60{3,}|~{3,})[\s\S]*?(?:\x60{3,}|~{3,})/g,' ');
 return (clean.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
}
function writerV11CleanMarkdown(source){
 return String(source||'').replace(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/,'').trim();
}
function writerV11ProjectFiles(plugin,project,limit){
 if(!project?.file)return [];
 if(project.standalone||project.format==='single')return [{title:project.title,file:project.file,indent:0}];
 const entries=typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[];
 const out=[],paths=new Set();
 for(const scene of entries){
  const file=typeof writerBookNavFindSceneFile==='function'?writerBookNavFindSceneFile(project,scene,plugin.app):null;
  if(!file||file.extension!=='md'||paths.has(file.path))continue;
  paths.add(file.path);
  out.push({title:String(scene.title||file.basename).slice(0,140),file,indent:Math.max(0,Number(scene.indent)||0)});
  if(out.length>=limit)break;
 }
 return out;
}
function writerV11PickProject(plugin,next){
 const books=typeof writerV10BookshelfProjects==='function'?writerV10BookshelfProjects(plugin):[];
 if(!books.length){new Notice(writerUi('Adicione um livro à biblioteca primeiro.','Add a book to the library first.'));return;}
 const {FuzzySuggestModal}=require('obsidian');
 class Picker extends FuzzySuggestModal{
  getItems(){return books;}
  getItemText(item){return item.title+' — '+item.file.path;}
  onChooseItem(item){next(item);}
 }
 const picker=new Picker(plugin.app);
 picker.setPlaceholder(writerUi('Escolha um livro ou projeto','Select a book or project'));
 picker.open();
}
function writerV11ReviewList(plugin,path){
 const cfg=writerV11Cfg(plugin.settings);
 return Array.isArray(cfg.reviewNotes[path])?cfg.reviewNotes[path].slice(0,120):[];
}
async function writerV11AddReview(plugin,path,content){
 const note=String(content||'').trim().slice(0,1200);
 if(!note)return;
 const cfg=writerV11Cfg(plugin.settings);
 cfg.reviewNotes[path]=[...writerV11ReviewList(plugin,path),{text:note,at:new Date().toISOString()}].slice(-120);
 await plugin.saveSettings();
}
async function writerV11SaveChapter(plugin,file,expected,next){
 if(!(file instanceof TFile)||file.extension!=='md')throw Error('Invalid Markdown chapter');
 if(String(next).length>2000000)throw Error(writerUi('Capítulo muito grande.','Chapter is too large.'));
 // The editor and other plugins may have modified the note in the meantime.
 for(const leaf of plugin.app.workspace?.getLeavesOfType?.('markdown')||[]){
  if(leaf.view?.file?.path===file.path&&leaf.view.editor?.getValue?.()!==expected)
   throw Error(writerUi('Esta nota também está sendo editada em outra aba. Salve essa aba antes.','This note is being edited in another pane. Save that pane first.'));
 }
 if(await plugin.app.vault.read(file)!==expected)throw Error(writerUi(
  'Esta nota mudou enquanto você editava. Copie seu rascunho e reabra a cena antes de salvar.',
  'This note changed while you edited it. Copy your draft and reopen the scene before saving.'));
 if(plugin.writerSnapshots?.config?.enabled)await plugin.writerSnapshots.create(file,writerUi('Antes da edição contínua v11','Before v11 continuous edit'),{content:expected});
 await plugin.app.vault.process(file,current=>{
  if(current!==expected)throw Error(writerUi('Alteração concorrente: gravação cancelada.','Concurrent edit: write cancelled.'));
  return String(next);
 });
}
function writerV11Heading(parent,pt,en){
 parent.createEl('h3',{text:writerUi(pt,en)});
}
async function writerV11OpenProject(plugin,project){
 // Reuse the canonical Projects view and selected Longform index.
 // No separate Studio leaf, homepage widget or manuscript database is created.
 if(!project?.file?.path)return;
 await plugin.openProjects?.('manuscript');
 const view=plugin.app.workspace.getLeavesOfType?.(PROJECT_VIEW)?.[0]?.view;
 if(!view){new Notice(writerUi('Não foi possível abrir o Longform.','Could not open Longform.'));return;}
 view.selected=project.file.path;
 if(typeof writerProjectRemember==='function')writerProjectRemember(view,project.file.path);
 view.activeTab='manuscript';
 await view.render?.();
}
function writerV11RenderLongformTab(view,panel,project){
 const plugin=view.plugin,cfg=writerV11Cfg(plugin.settings);
 const root=panel.createDiv({cls:'writer-v11-studio writer-v11-longform-inline'});
 if(cfg.enabled===false){
  root.createEl('p',{text:writerUi('A escrita contínua está desativada nas configurações do Longform.','Continuous writing is disabled in Longform settings.')});return;
 }
 const compileScenes=()=>writerV11ManuscriptScenes(plugin,project,
  typeof view.activeScenes==='function'?view.activeScenes(project):undefined,
  typeof view.resolveScene==='function'?scene=>view.resolveScene(project,scene.title):undefined);
 const entries=compileScenes().filter(entry=>entry.file?.extension==='md');
 const unique=new Set(),scenes=entries.filter(entry=>{
  if(!entry.file?.path||unique.has(entry.file.path))return false;
  unique.add(entry.file.path);return true;
 }).slice(0,cfg.chapterLimit);
 root.createEl('h4',{text:writerUi('Escrita contínua','Continuous writing')});
 root.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Todas as cenas continuam no Longform padrão, com a ordem, os metadados e os arquivos originais. Expanda uma cena para editar e salve explicitamente.',
  'Scenes retain the standard Longform order, metadata and original files. Expand a scene to edit and save explicitly.')});
 const bar=root.createDiv({cls:'writer-v11-studio-actions'});
 bar.createEl('button',{text:writerUi('Pesquisar capítulos','Search chapters')})
  .addEventListener('click',()=>writerV11OpenSearch(plugin,scenes.map(x=>x.file)));
 bar.createEl('button',{text:writerUi('Compilar manuscrito','Compile manuscript')})
  .addEventListener('click',()=>void writerV11Compile(plugin,project,compileScenes));
 if(typeof writerV134OpenRecovery==='function')bar.createEl('button',{text:writerUi('Recuperar rascunhos','Recover drafts')})
  .addEventListener('click',()=>writerV134OpenRecovery(plugin));
 const total=unique.size;
 const count=bar.createSpan({cls:'writer-v11-longform-counter',text:(scenes.length<total?scenes.length+'/'+total:scenes.length)+' '+writerUi('capítulos','chapters')});
 if(scenes.length<total)root.createEl('p',{cls:'setting-item-description',text:writerUi(
  'O limite reduz apenas os editores desta sessão. A compilação inclui todas as cenas do rascunho ativo.',
  'The session limit applies only to chapter editors. Compilation includes every scene in the active draft.')});
 if(!scenes.length){
  root.createEl('p',{text:writerUi('Este projeto ainda não contém cenas Markdown. Use a aba Cenas para adicioná-las.','This project has no Markdown scenes yet. Add them in Scenes.')});return;
 }
 const host=root.createDiv({cls:'writer-v11-chapters'});
 for(const [index,scene] of scenes.entries()){
  const section=host.createEl('details',{cls:'writer-v11-chapter'});
  const head=section.createEl('summary');
  head.createSpan({text:String(index+1)+'. '+scene.title});
  const info=head.createEl('small',{text:''});
  const body=section.createDiv({cls:'writer-v11-chapter-body'});
  let loading=false,loaded=false,expected='';
  section.addEventListener('toggle',async()=>{
   if(!section.open||loaded||loading)return;
   loading=true;
   try{
    const recovery=typeof writerV134Recovery==='function'?writerV134Recovery(plugin):null;
    if(recovery)await recovery.ready;
    expected=await plugin.app.vault.read(scene.file);
    if(!section.isConnected)return;
    info.setText(writerV11Words(expected)+' '+writerUi('palavras','words'));
    const editor=body.createEl('textarea',{cls:'writer-v11-editor',attr:{
     'aria-label':scene.title,spellcheck:'true'}});
    let draft=plugin._writerV11Drafts?.get(scene.file.path);
    if(draft?.text===expected){
     if(recovery)recovery.capture(scene.file.path,expected,expected);
     else plugin._writerV11Drafts.delete(scene.file.path);
     draft=null;
    }
    editor.value=draft?.original===expected?draft.text:expected;
    let localVersion=editor.value;
    const buttons=body.createDiv({cls:'writer-v11-chapter-actions'});
    const status=buttons.createEl('small',{text:editor.value===expected?
     writerUi('Sem alterações','No changes'):writerUi('Rascunho não salvo recuperado','Unsaved draft recovered')});
    const save=buttons.createEl('button',{attr:{type:'button'},text:writerUi('Salvar cena','Save scene')});
    let saving=false,conflicted=Boolean(recovery&&draft&&draft.original!==expected);
    const recoveryInfo=recovery?body.createEl('small',{cls:'writer-v134-recovery-status'}):null;
    let conflictInfo=null;
    if(recovery&&typeof writerV134OpenRecovery==='function'){
     conflictInfo=body.createDiv({cls:'writer-v134-recovery-conflict'});
     conflictInfo.createEl('p',{text:writerUi(
      'Existe um rascunho baseado em outra versão desta cena. Revise a cópia de recuperação antes de continuar a edição aqui.',
      'A draft is based on another version of this scene. Review the recovery copy before continuing to edit here.')});
     conflictInfo.createEl('button',{text:writerUi('Revisar rascunho recuperado','Review recovered draft'),attr:{type:'button'}})
      .addEventListener('click',()=>writerV134OpenRecovery(plugin,scene.file.path));
    }
    const paintRecovery=()=>{
     if(!recovery)return;
     const current=plugin._writerV11Drafts?.get(scene.file.path);
     // Keep panes sharing the same base in sync without replacing text changed
     // locally since its last input event. This prevents one pane losing the
     // other pane's draft merely because both originally opened a clean scene.
     if(current&&current.original===expected&&editor.value===localVersion&&editor.value!==current.text){
      editor.value=current.text;localVersion=current.text;
      status.setText(writerUi('Rascunho não salvo atualizado em outro painel','Unsaved draft updated in another pane'));
     }
     conflicted=Boolean(current&&current.original!==expected&&current.text!==expected);
     editor.readOnly=conflicted;save.disabled=saving||conflicted;
     if(conflictInfo)conflictInfo.hidden=!conflicted;
     const state=recovery.status;
     if(!current&&state.phase!=='error'){recoveryInfo.setText('');return;}
     recoveryInfo.setText(state.phase==='error'?writerUi('Cópia de recuperação indisponível: ','Recovery copy unavailable: ')+String(state.error||'').slice(0,180):
      state.phase==='disabled'?writerUi('Recuperação persistente desativada.','Persistent recovery is disabled.'):
      state.phase==='saved'?writerUi('Cópia local de recuperação atualizada. A cena ainda precisa ser salva.','Local recovery copy updated. The scene still needs saving.'):
      writerUi('Atualizando cópia local de recuperação…','Updating local recovery copy…'));
    };
    buttons.createEl('button',{attr:{type:'button'},text:writerUi('Abrir nota','Open note')})
     .addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(scene.file));
    buttons.createEl('button',{attr:{type:'button'},text:writerUi('Revisões','Revisions')})
     .addEventListener('click',()=>writerV11OpenRevision(plugin,scene.file));
    const rememberDraft=()=>{
     if(conflicted)return;
     localVersion=editor.value;
     plugin._writerV11Drafts??=new Map();
     if(recovery)recovery.capture(scene.file.path,expected,editor.value);
     else if(editor.value===expected)plugin._writerV11Drafts.delete(scene.file.path);
     else plugin._writerV11Drafts.set(scene.file.path,{original:expected,text:editor.value});
     status.setText(editor.value===expected?writerUi('Sem alterações','No changes'):writerUi('Rascunho não salvo','Unsaved changes'));
    };
    editor.addEventListener('input',rememberDraft);
    if(recovery){
     let unsubscribe=()=>{};
     unsubscribe=recovery.subscribe(()=>{if(!body.isConnected)unsubscribe();else paintRecovery();});
     plugin.register?.(unsubscribe);paintRecovery();
    }
    save.addEventListener('click',async()=>{
     if(saving||conflicted)return;
     saving=true;
     save.disabled=true;
     const submitted=editor.value;
     try{
      await writerV11SaveChapter(plugin,scene.file,expected,submitted);
      expected=submitted;
      rememberDraft();
      if(recovery)void recovery.flush().catch(()=>{});
      info.setText(writerV11Words(expected)+' '+writerUi('palavras','words'));
      if(editor.value===expected){
       status.setText(writerUi('Salvo','Saved'));
       new Notice(writerUi('Cena salva no arquivo Longform original.','Scene saved in original Longform note.'));
      }else new Notice(writerUi('Cena salva. As alterações mais recentes continuam no rascunho não salvo.','Scene saved. Newer edits remain in the unsaved draft.'));
     }catch(error){
      status.setText(String(error.message||error));new Notice(String(error.message||error));
     }finally{saving=false;save.disabled=conflicted;}
    });
    writerV11ReviewArea(plugin,scene.file,body);
    loaded=true;
   }catch(error){
    body.createEl('p',{text:String(error.message||error)});
   }finally{loading=false;}
  });
 }
}
function writerV11ReviewArea(plugin,file,root){
 const box=root.createDiv({cls:'writer-v11-review-area'});
 const draw=()=>{
  box.empty();box.createEl('h5',{text:writerUi('Comentários editoriais','Editorial notes')});
  const notes=writerV11ReviewList(plugin,file.path);
  for(const [index,item] of notes.entries()){
   const row=box.createDiv({cls:'writer-v11-review-item'});
   row.createSpan({text:String(item.text||'')});
   const del=row.createEl('button',{text:writerUi('Remover','Remove'),attr:{type:'button'}});
   del.addEventListener('click',async()=>{
    const cfg=writerV11Cfg(plugin.settings),current=writerV11ReviewList(plugin,file.path);
    const target=current[index];
    cfg.reviewNotes[file.path]=current.filter(x=>x!==target);
    await plugin.saveSettings();draw();
   });
  }
  const input=box.createEl('textarea',{attr:{rows:'2',placeholder:writerUi('Nota de revisão…','Review note…')}});
  box.createEl('button',{text:writerUi('Adicionar comentário','Add comment')})
   .addEventListener('click',async()=>{await writerV11AddReview(plugin,file.path,input.value);draw();});
 };
 draw();
}
function writerV11OpenRevision(plugin,file){
 if(!(file instanceof TFile)||file.extension!=='md'){new Notice(writerUi('Selecione um capítulo Markdown.','Select a Markdown chapter.'));return;}
 const modal=new Modal(plugin.app);modal.modalEl?.addClass('writer-v11-studio-modal');
 modal.setTitle(writerUi('Revisão editorial · ','Editorial review · ')+file.basename);
 modal.onOpen=async()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v11-studio');
  if(!plugin.writerSnapshots?.list){root.createEl('p',{text:writerUi('Ative os snapshots do Basic.','Enable Basic snapshots.')});return;}
  const history=await plugin.writerSnapshots.list(file);
  const current=await plugin.app.vault.read(file);
  root.createEl('p',{text:history.length+' '+writerUi('versões locais disponíveis. Comparação apenas para leitura.','local versions available. Read-only comparison.')});
  const versions=root.createEl('select',{attr:{'aria-label':writerUi('Versão','Version')}});
  for(const [i,entry] of history.entries()){
   const opt=versions.createEl('option',{text:entry.name+' · '+entry.at});opt.value=String(i);
  }
  const view=root.createDiv({cls:'writer-v11-revision-diff'});
  const show=async()=>{
   view.empty();if(!history.length)return;
   const old=await plugin.writerSnapshots.read(file,history[Number(versions.value)||0]);
   const diff=typeof writerDiffLines==='function'?writerDiffLines(old,current,500):{truncated:true};
   if(diff.truncated){view.createEl('p',{text:writerUi('Arquivo longo demais para comparação linha a linha.','File too long for line diff.')});return;}
   view.createEl('p',{text:'+'+diff.added+' / -'+diff.removed});
   for(const item of diff.changes.filter(x=>x.type!=='same').slice(0,300))
    view.createEl('div',{cls:'writer-v11-diff-'+item.type,text:(item.type==='add'?'+ ':'− ')+item.line});
  };
  versions.addEventListener('change',()=>void show());
  await show();writerV11ReviewArea(plugin,file,root);
 };
 modal.open();
}
function writerV11SearchExcerpt(text,at,len){
 const from=Math.max(0,at-70),to=Math.min(text.length,at+len+130);
 return (from?'…':'')+text.slice(from,to).replace(/\s+/g,' ').trim()+(to<text.length?'…':'');
}
function writerV11OpenSearch(plugin,scoped){
 const modal=new Modal(plugin.app);modal.modalEl?.addClass('writer-v11-studio-modal');
 modal.setTitle(writerUi('Pesquisa universal · Basic','Universal search · Basic'));
 let generation=0;
 modal.onClose=()=>{generation++;};
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v11-studio');
  const q=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Pesquisar conteúdo, nomes e propriedades…','Search content, titles and properties…'),'aria-label':writerUi('Consulta','Query')}});
  const scope=root.createEl('select',{attr:{'aria-label':writerUi('Escopo de pesquisa','Search scope')}});
  for(const [value,pt,en] of [['project','Projeto atual','Current project'],['space','Space ativo','Active Space'],['vault','Cofre','Vault']]){
   const option=scope.createEl('option',{text:writerUi(pt,en)});option.value=value;
  }
  if(!scoped?.length)scope.value='space';
  const info=root.createEl('p',{cls:'setting-item-description'});
  const results=root.createDiv({cls:'writer-v11-search-results'});
  let idle=null;
  const search=async()=>{
   const mine=++generation,term=q.value.trim().toLocaleLowerCase();
   results.empty();if(term.length<2){info.setText(writerUi('Digite pelo menos 2 caracteres.','Type at least 2 characters.'));return;}
   const cfg=writerV11Cfg(plugin.settings);
   const space=typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
   const files=(scope.value==='project'&&scoped?.length?scoped:
     scope.value==='space'&&space&&typeof writerV9SpaceItems==='function'?writerV9SpaceItems(plugin,space):
     plugin.app.vault.getMarkdownFiles?.()||[]).filter(f=>f?.extension==='md').slice(0,cfg.searchLimit);
   info.setText(writerUi('Analisando ','Scanning ')+files.length+' '+writerUi('notas…','notes…'));
   let hits=0,scanned=0;
   for(const file of files){
    if(mine!==generation)return;
    let text='';
    try{text=await plugin.app.vault.cachedRead(file);}catch(_){continue;}
    const metadata=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter||{};
    const searchable=file.path+'\n'+Object.entries(metadata).slice(0,50).map(([k,v])=>k+': '+String(v)).join('\n')+'\n'+text;
    const at=searchable.toLocaleLowerCase().indexOf(term);
    if(at>=0&&hits<80){
     hits++;
     const row=results.createEl('button',{cls:'writer-v11-search-result',attr:{type:'button'}});
     row.createEl('strong',{text:file.basename});
     row.createEl('small',{text:file.path});
     row.createEl('span',{text:writerV11SearchExcerpt(searchable,at,term.length)});
     row.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(file));
    }
    if(++scanned%18===0){info.setText(scanned+'/'+files.length+' · '+hits+' '+writerUi('resultados','results'));await new Promise(resolve=>setTimeout(resolve,0));}
    if(hits>=80)break;
   }
   if(mine!==generation)return;
   info.setText(scanned+'/'+files.length+' · '+hits+' '+writerUi('resultados','results'));
   if(!hits)results.createEl('p',{text:writerUi('Nada encontrado neste escopo.','No matches in this scope.')});
  };
  const changed=()=>{clearTimeout(idle);++generation;idle=setTimeout(()=>void search(),230);};
  q.addEventListener('input',changed);scope.addEventListener('change',changed);
  modal._writerCleanup=()=>clearTimeout(idle);
  q.focus();
 };
 const close=modal.onClose;
 modal.onClose=()=>{generation++;modal._writerCleanup?.();close?.();};
 modal.open();
}
function writerV11ManuscriptScenes(plugin,project,entries,resolve){
 if(!project?.file)return [];
 if(project.standalone||project.format==='single')return [{title:project.title,file:project.file,indent:0}];
 const scenes=entries??(typeof lfFlattenScenes==='function'?lfFlattenScenes(project.scenes):[]);
 // Keep unresolved entries and repeated references: every ordered scene must
 // either appear in the manuscript or produce an explicit preparation error.
 return scenes.map(scene=>({title:String(scene.title||''),indent:scene.indent||0,
  file:typeof resolve==='function'?resolve(scene):
   typeof writerBookNavFindSceneFile==='function'?writerBookNavFindSceneFile(project,scene,plugin.app):null}));
}
function writerV11ManuscriptBuffers(plugin,path){
 return (plugin.app.workspace.getLeavesOfType?.('markdown')||[]).map(leaf=>leaf.view)
  .filter(view=>view?.file?.path===path&&view.editor&&view.getMode?.()!=='preview')
  .map(view=>({view,editor:view.editor,text:view.editor.getValue()}));
}
function writerV11ManuscriptDraft(plugin,path){
 const draft=plugin._writerV11Drafts?.get(path);
 return draft?{original:draft.original,text:draft.text}:null;
}
async function writerV11ManuscriptSnapshot(plugin,project,scenes,mode='saved',active=()=>true){
 const vault=plugin.app.vault,rows=[],events=[];
 const tracked=new Set([project?.file,...(scenes||[]).map(scene=>scene.file)].filter(Boolean));
 const paths=[...tracked].map(file=>file.path).filter(path=>typeof path==='string');
 let dirty=false;
 const changed=()=>Error(writerUi('O projeto mudou durante a preparação. Atualize a prévia.',
  'The project changed while preparing the manuscript. Refresh the preview.'));
 const checkActive=()=>{if(dirty||!active())throw changed();};
 const invalidate=(file,oldPath)=>{
  if(tracked.has(file)||[file?.path,oldPath].some(path=>typeof path==='string'&&
   paths.some(target=>target===path||target.startsWith(path+'/'))))dirty=true;
 };
 try{
 // Metadata may retain mtime/size, and an earlier chapter can change after its
 // final read while another chapter is still loading. Observe source/index
 // events only during preparation; completed previews remain frozen.
 if(typeof vault.on==='function'&&typeof vault.offref==='function')
  for(const event of ['modify','rename','delete'])events.push(vault.on(event,invalidate));
 if(mode==='current'&&typeof writerV134Recovery==='function'){
  const recovery=writerV134Recovery(plugin);await recovery.ready;checkActive();
  if(recovery.blocked)throw Error(writerUi('As cópias de recuperação precisam de revisão. Abra a recuperação ou use os arquivos salvos.',
   'Recovery copies need attention. Open draft recovery or use saved files.'));
 }
 if(!scenes?.length)throw Error(writerUi('Nenhum capítulo encontrado.','No chapters found.'));
 for(const [index,scene] of scenes.entries()){
  checkActive();
  const file=scene.file,path=file?.path;
  if(!file||file.extension!=='md'||vault.getAbstractFileByPath(path)!==file)
   throw Error(writerUi('Capítulo ausente ou indisponível: ','Missing or unavailable chapter: ')+scene.title);
  const mtime=file.stat?.mtime,size=file.stat?.size,saved=await vault.read(file);
  checkActive();
  if(file.path!==path||vault.getAbstractFileByPath(path)!==file||file.stat?.mtime!==mtime||file.stat?.size!==size)throw changed();
  const buffers=mode==='current'?writerV11ManuscriptBuffers(plugin,path):[];
  const draft=mode==='current'?writerV11ManuscriptDraft(plugin,path):null;
  let text=saved,origin='saved';
  if(mode==='current'){
   const versions=new Set(buffers.map(buffer=>buffer.text));
   if(versions.size>1)throw Error(writerUi('Painéis com textos diferentes: ','Open panes have different text: ')+path);
   const editing=buffers[0]?.text??saved;
   if(draft&&draft.text!==saved){
    if(typeof draft.original!=='string'||typeof draft.text!=='string'||draft.original!==saved)
     throw Error(writerUi('Rascunho baseado em outra versão: ','Draft is based on another version: ')+path);
    if(editing!==saved&&editing!==draft.text)
     throw Error(writerUi('Rascunho e editor têm textos diferentes: ','Draft and editor have different text: ')+path);
    text=draft.text;origin='draft';
   }else if(editing!==saved){text=editing;origin='editor';}
  }
  rows.push({title:scene.title,path,file,indent:scene.indent||0,saved,mtime,size,buffers,draft,text,origin});
  if(index%12===11)await new Promise(resolve=>setTimeout(resolve,0));
 }
 // Re-read the original files, then check all identities and live buffers in
 // one synchronous pass so earlier chapters cannot change unnoticed while
 // later chapters are loading. Only the completed snapshot is frozen.
 for(const [index,row] of rows.entries()){
  checkActive();
  if(row.file.path!==row.path||vault.getAbstractFileByPath(row.path)!==row.file||await vault.read(row.file)!==row.saved)throw changed();
  if(index%12===11)await new Promise(resolve=>setTimeout(resolve,0));
 }
 checkActive();
 for(const row of rows){
  if(row.file.path!==row.path||vault.getAbstractFileByPath(row.path)!==row.file||
   row.file.stat?.mtime!==row.mtime||row.file.stat?.size!==row.size)throw changed();
  if(mode==='current'){
   const draft=writerV11ManuscriptDraft(plugin,row.path),buffers=writerV11ManuscriptBuffers(plugin,row.path);
   if(draft?.original!==row.draft?.original||draft?.text!==row.draft?.text||buffers.length!==row.buffers.length||
    buffers.some(buffer=>!row.buffers.some(old=>old.view===buffer.view&&old.editor===buffer.editor&&old.text===buffer.text)))throw changed();
  }
 }
 let words=0;
 const contents=rows.map(row=>{const text=writerV11CleanMarkdown(row.text);words+=writerV11Words(text);return '# '+row.title+'\n\n'+text;});
 return {rows,words,mode,createdAt:new Date(),manuscript:'# '+project.title+'\n\n'+contents.join('\n\n---\n\n')+'\n'};
 }finally{
  for(const event of events)vault.offref(event);
 }
}
async function writerV11SaveManuscript(plugin,project,manuscript){
 const vault=plugin.app.vault,folder='Basic Exports';
 const existing=vault.getAbstractFileByPath(folder);
 if(existing&&!(existing instanceof TFolder))throw Error(writerUi('Basic Exports precisa ser uma pasta.','Basic Exports must be a folder.'));
 if(!existing){
  try{await vault.createFolder(folder);}
  catch(error){if(!(vault.getAbstractFileByPath(folder) instanceof TFolder))throw error;}
 }
 const base=String(project.title||'Livro').replace(/[\x00-\x1f\\/:*?"<>|#\[\]]/g,' ').replace(/[. ]+$/,'').trim().slice(0,75)||'Livro';
 for(let number=1;number<=1000;number++){
  const path=folder+'/'+base+' - Manuscrito'+(number>1?' '+number:'')+'.md';
  if(vault.getAbstractFileByPath(path))continue;
  try{return await vault.create(path,manuscript);}
  catch(error){if(!vault.getAbstractFileByPath(path))throw error;}
 }
 throw Error(writerUi('Não foi possível encontrar um nome livre para o manuscrito.','Could not find a free name for the manuscript.'));
}
async function writerV11Compile(plugin,project,sceneSource){
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Compilar manuscrito','Compile manuscript'));
 modal.modalEl?.addClass('writer-v135-compile-modal');
 let mode='saved',snapshot=null,generation=0,closed=false,loading=false,busy=false,approved=false;
 let summary,chapters,preview,previewNote,confirmation,create,refreshButton,sourceChoice;
 const resolveScenes=()=>typeof sceneSource==='function'?sceneSource():sceneSource||writerV11ManuscriptScenes(plugin,project);
 const sourceLabel=origin=>origin==='draft'?writerUi('Rascunho Longform','Longform draft'):
  origin==='editor'?writerUi('Editor não salvo','Unsaved editor'):writerUi('Arquivo salvo','Saved file');
 const controls=()=>{
  create?.setDisabled(busy||loading||!snapshot);
  refreshButton?.setDisabled(busy||loading);
  sourceChoice?.setDisabled(busy);
  confirmation?.setDisabled(busy||loading||!snapshot);
 };
 const refresh=async()=>{
  if(busy||closed)return;
  const mine=++generation;loading=true;snapshot=null;approved=false;confirmation?.setValue(false);
  summary.setText(writerUi('Preparando todas as cenas…','Preparing every scene…'));
  chapters.empty();preview.setText('');previewNote.setText('');controls();
  try{
   const scenes=resolveScenes().map(scene=>({...scene}));
   const result=await writerV11ManuscriptSnapshot(plugin,project,scenes,mode,()=>!closed&&mine===generation);
   if(closed||mine!==generation)return;
   const latest=resolveScenes();
   if(latest.length!==scenes.length||latest.some((scene,index)=>scene.file!==scenes[index].file||scene.title!==scenes[index].title||scene.indent!==scenes[index].indent))
    throw Error(writerUi('A ordem do projeto mudou. Atualize a prévia.','The project order changed. Refresh the preview.'));
   snapshot=result;
   summary.setText(result.rows.length+' '+writerUi('capítulos · ','chapters · ')+result.words+' '+writerUi('palavras · ','words · ')+result.createdAt.toLocaleString());
   for(const row of result.rows)chapters.createEl('li',{text:row.title+' — '+row.path+' · '+sourceLabel(row.origin)});
   preview.setText(result.manuscript.slice(0,6000));
   previewNote.setText(result.manuscript.length>6000?writerUi(
    'A prévia mostra os primeiros 6.000 caracteres. O arquivo incluirá o manuscrito completo.',
    'The preview shows the first 6,000 characters. The file will contain the complete manuscript.'):
    writerUi('A prévia mostra o manuscrito completo.','The preview shows the complete manuscript.'));
  }catch(error){if(!closed&&mine===generation)summary.setText(String(error.message||error));}
  finally{if(!closed&&mine===generation){loading=false;controls();}}
 };
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v135-compile');
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Todas as cenas, na ordem do projeto. Os capítulos originais nunca são alterados.',
   'Every scene, in project order. Original chapters are never changed.')});
  new Setting(root).setName(writerUi('Texto a incluir','Text to include')).addDropdown(dropdown=>{
   sourceChoice=dropdown;
   dropdown.addOption('saved',writerUi('Arquivos salvos','Saved files'))
    .addOption('current',writerUi('Escrita atual','Current writing')).setValue(mode).onChange(value=>{mode=value;void refresh();});
  });
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Arquivos salvos ignora edições não salvas. Escrita atual inclui rascunhos Longform compatíveis e editores abertos; versões conflitantes precisam de revisão.',
   'Saved files excludes unsaved edits. Current writing includes matching Longform drafts and open editors; conflicting versions need review.')});
  summary=root.createEl('p',{attr:{role:'status','aria-live':'polite'}});
  const detail=root.createEl('details');detail.createEl('summary',{text:writerUi('Capítulos e fontes do texto','Chapters and text sources')});
  chapters=detail.createEl('ol');
  preview=root.createEl('pre',{cls:'writer-v11-compile-preview'});
  previewNote=root.createEl('p',{cls:'setting-item-description'});
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'A exportação usa esta cópia preparada. Alterações posteriores só entram após Atualizar prévia.',
   'Export uses this prepared copy. Later edits are included only after Refresh preview.')});
  new Setting(root).addButton(button=>{refreshButton=button;button.setButtonText(writerUi('Atualizar prévia','Refresh preview')).onClick(refresh);});
  new Setting(root).setName(writerUi('Confirmar novo Markdown','Confirm new Markdown file')).addToggle(toggle=>{
   confirmation=toggle;toggle.onChange(value=>approved=value);
  });
  new Setting(root).addButton(button=>{
   create=button;button.setButtonText(writerUi('Criar manuscrito','Create manuscript')).setCta().onClick(async()=>{
    if(busy||loading||!snapshot)return;
    if(!approved)return new Notice(writerUi('Confirme a criação.','Confirm creation.'));
    busy=true;controls();
    try{
     const file=await writerV11SaveManuscript(plugin,project,snapshot.manuscript);
     modal.close();
     try{await plugin.app.workspace.getLeaf('tab').openFile(file);}
     catch(error){new Notice(writerUi('Manuscrito criado; não foi possível abrir: ','Manuscript created; could not open: ')+String(error.message||error));}
    }catch(error){new Notice(String(error.message||error));}
    finally{busy=false;if(!closed)controls();}
   });
  });
 };
 modal.onClose=()=>{closed=true;generation++;snapshot=null;};
 modal.open();await refresh();return modal;
}
function writerV11OpenDiagnostics(plugin){
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Central de compatibilidade v11','v11 compatibility center'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v11-studio');
  root.createEl('p',{text:writerUi('Inspeção local e sem alterações nos arquivos.','Local read-only inspection, without file changes.')});
  const rows=[
   [writerUi('Versão do Obsidian','Obsidian version'),plugin.app?.vault?.config?.version||require('obsidian').apiVersion||'—'],
   [writerUi('Arquivos Markdown','Markdown files'),String(plugin.app.vault.getMarkdownFiles?.().length||0)],
   [writerUi('Módulos opcionais 10.7','Optional 10.7 modules'),plugin.settings.v107AdvancedEnabled===false?'disabled':'enabled'],
   [writerUi('Banco Markdown','Markdown databases'),plugin.settings.v1011Notion?.enabled===false?'disabled':'enabled'],
   [writerUi('Estúdio Longform','Longform Studio'),writerV11Cfg(plugin.settings).enabled?'enabled':'disabled'],
   [writerUi('Falhas 10.7','10.7 registration failures'),(plugin._writerV107Failures||[]).join(', ')||'none'],
   [writerUi('Spaces','Spaces'),String(plugin.settings.v9Spaces?.spaces?.length||0)]
  ];
  for(const [label,value] of rows){const row=root.createDiv({cls:'writer-v11-diagnostic-row'});row.createEl('strong',{text:label});row.createSpan({text:String(value)});}
  const installed=plugin.app.plugins?.enabledPlugins;
  if(installed?.has){
   const overlap=['make-md','obsidian-languagetool','obsidian-editing-toolbar','obsidian-dragger','obsidian-full-calendar'];
   const found=overlap.filter(id=>installed.has(id));
   root.createEl('p',{text:found.length?writerUi('Verifique possíveis controles duplicados: ','Review potentially overlapping controls: ')+found.join(', '):writerUi('Nenhum plugin redundante conhecido detectado.','No known duplicate plugin detected.')});
  }
 };
 modal.open();
}
function writerV11StudioRegister(plugin){
 writerV11Cfg(plugin.settings);
 const recovery=typeof writerV134Recovery==='function'?writerV134Recovery(plugin):null;
 const doc=plugin.app.workspace?.containerEl?.ownerDocument;
 if(recovery&&doc&&typeof plugin.registerDomEvent==='function')plugin.registerDomEvent(doc,'visibilitychange',()=>{
  if(doc.visibilityState==='hidden')void recovery.flush().catch(()=>{});
 });
 plugin.registerEvent?.(plugin.app.vault.on('rename',(file,oldPath)=>{
  if(typeof file?.path!=='string'||typeof oldPath!=='string'||!oldPath||oldPath===file.path)return;
  const destination=path=>path===oldPath||path.startsWith(oldPath+'/')?file.path+path.slice(oldPath.length):null;
  const notes=plugin.settings.v11Studio?.reviewNotes||{};
  let changed=false;
  for(const path of Object.keys(notes)){
   const next=destination(path);
   if(next&&!Object.prototype.hasOwnProperty.call(notes,next)){
    notes[next]=notes[path];delete notes[path];changed=true;
   }
  }
  if(changed)void plugin.saveSettings();
  if(recovery){recovery.rename(oldPath,file.path);return;}
  const drafts=plugin._writerV11Drafts;
  for(const [path,draft] of Array.from(drafts?.entries()||[])){
   const next=destination(path);
   if(next&&!drafts.has(next)){
    drafts.set(next,draft);drafts.delete(path);
   }
  }
 }));

 plugin.addCommand({id:'v11-longform-studio',name:writerUi('Longform: abrir escrita contínua','Longform: open continuous writing'),
  callback:()=>writerV11PickProject(plugin,project=>writerV11OpenProject(plugin,project))});
 plugin.addCommand({id:'v11-editorial-review',name:writerUi('Revisão: comparar snapshots do capítulo','Review: compare chapter snapshots'),
  callback:()=>writerV11OpenRevision(plugin,plugin.app.workspace.getActiveFile?.())});
 plugin.addCommand({id:'v11-universal-search',name:writerUi('Pesquisa: conteúdo e propriedades do cofre','Search: vault content and properties'),
  callback:()=>writerV11OpenSearch(plugin)});
 plugin.addCommand({id:'v11-manuscript-compile',name:writerUi('Longform: compilar manuscrito Markdown','Longform: compile Markdown manuscript'),
  callback:()=>writerV11PickProject(plugin,p=>void writerV11Compile(plugin,p))});
 plugin.addCommand({id:'v11-compatibility-center',name:writerUi('Basic: central de compatibilidade','Basic: compatibility center'),
  callback:()=>writerV11OpenDiagnostics(plugin)});
 if(typeof writerV134OpenRecovery==='function')plugin.addCommand({id:'v134-longform-recovery',name:writerUi('Longform: recuperar rascunhos','Longform: recover drafts'),
  callback:()=>writerV134OpenRecovery(plugin)});
}
function writerV11StudioSettings(plugin,panel){
 const cfg=writerV11Cfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('Longform · Escrita contínua','Longform · Continuous writing')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Escrita contínua segura, revisões com snapshots, pesquisa contextual e exportação Markdown por projeto.',
  'Safe continuous writing, snapshot comparisons, contextual search and per-project Markdown compilation.')});
 new Setting(panel).setName(writerUi('Ativar escrita contínua no Longform','Enable continuous writing in Longform'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Cópias locais de recuperação','Local recovery copies'))
  .setDesc(writerUi('Guarda rascunhos de capítulos nos dados locais do Basic para recuperar após reiniciar. Não substitui Salvar cena; desativar preserva as cópias existentes.',
   'Keeps chapter drafts in Basic local data for recovery after restart. Does not replace Save scene; disabling preserves existing copies.'))
  .addToggle(t=>t.setValue(cfg.recoveryEnabled!==false).onChange(async value=>{
   plugin.settings.v11Studio.recoveryEnabled=value;await plugin.saveSettings();
   if(typeof writerV134Recovery==='function')void writerV134Recovery(plugin).flush().catch(()=>{});
  }));
 if(typeof writerV134OpenRecovery==='function')new Setting(panel).setName(writerUi('Rascunhos recuperáveis','Recoverable drafts'))
  .addButton(button=>button.setButtonText(writerUi('Abrir recuperação','Open recovery')).onClick(()=>writerV134OpenRecovery(plugin)));
 new Setting(panel).setName(writerUi('Editores de capítulos por sessão','Chapter editors per session'))
  .setDesc(writerUi('Limita apenas a lista de editores da escrita contínua. A compilação inclui todas as cenas do rascunho ativo.',
   'Limits only the continuous writing editor list. Compilation includes every scene in the active draft.'))
  .addSlider(s=>s.setLimits(10,200,10).setValue(cfg.chapterLimit).setDynamicTooltip().onChange(async v=>{cfg.chapterLimit=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Máximo de notas pesquisadas','Maximum searched notes'))
  .addSlider(s=>s.setLimits(25,1000,25).setValue(cfg.searchLimit).setDynamicTooltip().onChange(async v=>{cfg.searchLimit=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Escrita contínua','Continuous writing'))
  .addButton(b=>b.setButtonText(writerUi('Abrir Longform','Open Longform')).onClick(()=>writerV11PickProject(plugin,p=>writerV11OpenProject(plugin,p))));
 new Setting(panel).setName(writerUi('Central de compatibilidade','Compatibility center'))
  .addButton(b=>b.setButtonText(writerUi('Diagnosticar','Diagnose')).onClick(()=>writerV11OpenDiagnostics(plugin)));
}
