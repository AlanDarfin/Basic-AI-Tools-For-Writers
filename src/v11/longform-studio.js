'use strict';
/* Basic v11: Longform Studio — source-preserving continuous chapter workspace,
 * editorial review, scoped search, manuscript preview and diagnostics.
 * The source notes remain ordinary Markdown files; edits are explicit and guarded. */
function writerV11Cfg(settings){
 const old=settings.v11Studio&&typeof settings.v11Studio==='object'?settings.v11Studio:{};
 const cfg=settings.v11Studio={enabled:true,searchLimit:240,chapterLimit:100,reviewNotes:{},...old};
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
 if(project.standalone)return [{title:project.title,file:project.file,indent:0}];
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
 for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
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
function writerV11OpenProject(plugin,project){
 const cfg=writerV11Cfg(plugin.settings);
 if(!cfg.enabled){new Notice(writerUi('Longform Studio desativado.','Longform Studio disabled.'));return;}
 const scenes=writerV11ProjectFiles(plugin,project,cfg.chapterLimit);
 const modal=new Modal(plugin.app);
 modal.modalEl?.addClass('writer-v11-studio-modal');
 modal.setTitle(writerUi('Longform Studio · ','Longform Studio · ')+project.title);
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v11-studio');
  const intro=root.createDiv({cls:'writer-v11-studio-intro'});
  intro.createEl('p',{text:writerUi(
   'Capítulos em sequência, cada um salvo no seu arquivo original. Expanda uma cena para editar; salve explicitamente. Outras alterações nunca são sobrescritas.',
   'Chapters in sequence, each stored in its original file. Expand a scene to edit and save explicitly. Concurrent changes are never overwritten.')});
  const bar=root.createDiv({cls:'writer-v11-studio-actions'});
  bar.createEl('button',{text:writerUi('Pesquisar livro','Search book')})
   .addEventListener('click',()=>writerV11OpenSearch(plugin,scenes.map(x=>x.file)));
  bar.createEl('button',{text:writerUi('Revisar versões','Review revisions')})
   .addEventListener('click',()=>writerV11OpenRevision(plugin,scenes[0]?.file));
  bar.createEl('button',{text:writerUi('Compilar manuscrito','Compile manuscript')})
   .addEventListener('click',()=>void writerV11Compile(plugin,project,scenes));
  const total=root.createEl('p',{cls:'writer-v11-summary',text:scenes.length+' '+writerUi('capítulos encontrados.','chapters found.')});
  if(!scenes.length){root.createEl('p',{text:writerUi('Nenhum capítulo Markdown encontrado. Confira a ordem no Longform.','No Markdown chapters found. Check Longform scene ordering.')});return;}
  const host=root.createDiv({cls:'writer-v11-chapters'});
  let wordTotal=0;
  for(const [index,entry] of scenes.entries()){
   const detail=host.createEl('details',{cls:'writer-v11-chapter'});
   const summary=detail.createEl('summary');
   summary.createSpan({text:String(index+1)+'. '+entry.title});
   const counter=summary.createEl('small',{text:' · …'});
   const content=detail.createDiv({cls:'writer-v11-chapter-body'});
   let loaded=false;
   detail.addEventListener('toggle',async()=>{
    if(!detail.open||loaded||modal._writerClosed)return;
    loaded=true;
    let original='';
    try{original=await plugin.app.vault.read(entry.file);}catch(error){
     loaded=false;content.createEl('p',{text:String(error.message||error)});return;
    }
    const count=writerV11Words(original);
    wordTotal+=count;
    total.setText(scenes.length+' '+writerUi('capítulos · ','chapters · ')+wordTotal+' '+writerUi('palavras carregadas','loaded words'));
    counter.setText(' · '+count+' '+writerUi(' palavras',' words'));
    const editor=content.createEl('textarea',{cls:'writer-v11-editor',attr:{spellcheck:'true','aria-label':entry.title}});
    const draft=plugin._writerV11Drafts?.get(entry.file.path);
    editor.value=draft?.original===original?draft.text:original;
    const buttons=content.createDiv({cls:'writer-v11-chapter-actions'});
    const status=buttons.createEl('small',{text:writerUi('Alterações não salvas','Unsaved changes')});
    const save=buttons.createEl('button',{text:writerUi('Salvar capítulo','Save chapter'),attr:{type:'button'}});
    const open=buttons.createEl('button',{text:writerUi('Abrir nota','Open note'),attr:{type:'button'}});
    const review=buttons.createEl('button',{text:writerUi('Revisão','Review'),attr:{type:'button'}});
    if(draft?.original===original)status.setText(writerUi('Rascunho temporário recuperado · não salvo','Temporary draft recovered · unsaved'));
    editor.addEventListener('input',()=>{
     if(!plugin._writerV11Drafts)plugin._writerV11Drafts=new Map();
     if(editor.value===original)plugin._writerV11Drafts.delete(entry.file.path);
     else plugin._writerV11Drafts.set(entry.file.path,{original,text:editor.value});
     status.setText(writerUi('Alterado · não salvo','Modified · not saved'));
    });
    save.addEventListener('click',async()=>{
     save.disabled=true;
     try{await writerV11SaveChapter(plugin,entry.file,original,editor.value);
      original=editor.value;plugin._writerV11Drafts?.delete(entry.file.path);status.setText(writerUi('Salvo','Saved'));counter.setText(' · '+writerV11Words(original)+' '+writerUi('palavras','words'));
      new Notice(writerUi('Capítulo salvo.','Chapter saved.'));
     }catch(error){status.setText(String(error.message||error));new Notice(String(error.message||error));}
     finally{save.disabled=false;}
    });
    open.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(entry.file));
    review.addEventListener('click',()=>writerV11OpenRevision(plugin,entry.file));
    writerV11ReviewArea(plugin,entry.file,content);
   });
  }
 };
 modal.onClose=()=>{modal._writerClosed=true;
  if(scenes.some(entry=>plugin._writerV11Drafts?.has(entry.file.path)))
   new Notice(writerUi('Rascunhos não salvos mantidos temporariamente nesta sessão do Basic.','Unsaved drafts are held temporarily in this Basic session.'));
 };
 modal.open();
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
async function writerV11Compile(plugin,project,scenes){
 if(!scenes?.length)return new Notice(writerUi('Nenhum capítulo encontrado.','No chapters found.'));
 let contents=[],words=0;
 for(const scene of scenes){
  try{const text=writerV11CleanMarkdown(await plugin.app.vault.read(scene.file));
   contents.push('# '+scene.title+'\n\n'+text);words+=writerV11Words(text);
  }catch(error){new Notice(String(error.message||error));return;}
 }
 const manuscript='# '+project.title+'\n\n'+contents.join('\n\n---\n\n')+'\n';
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Compilar manuscrito','Compile manuscript'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{text:scenes.length+' '+writerUi('capítulos · ','chapters · ')+words+' '+writerUi('palavras.','words.')});
  root.createEl('p',{text:writerUi('Prévia de compilação. O original não será alterado.','Compilation preview. Original notes are never changed.')});
  const pre=root.createEl('pre',{cls:'writer-v11-compile-preview'});
  pre.setText(manuscript.slice(0,6000)+(manuscript.length>6000?'\n…':''));
  let approved=false;
  new Setting(root).setName(writerUi('Confirmar criação de um novo Markdown','Confirm creation of a new Markdown file'))
   .addToggle(t=>t.onChange(v=>approved=v));
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Criar manuscrito','Create manuscript')).setCta().onClick(async()=>{
   if(!approved)return new Notice(writerUi('Confirme a criação.','Confirm creation.'));
   b.setDisabled(true);
   try{
    const folder='Basic Exports';
    if(!plugin.app.vault.getAbstractFileByPath(folder))await plugin.app.vault.createFolder(folder);
    const base=String(project.title||'Livro').replace(/[\x00-\x1f\\/:*?"<>|#\[\]]/g,' ').trim().slice(0,75)||'Livro';
    let path=folder+'/'+base+' - Manuscrito.md',i=2;
    while(plugin.app.vault.getAbstractFileByPath(path)&&i<100)path=folder+'/'+base+' - Manuscrito '+i+++'.md';
    if(plugin.app.vault.getAbstractFileByPath(path))throw Error('No free export path');
    const file=await plugin.app.vault.create(path,manuscript);
    modal.close();await plugin.app.workspace.getLeaf('tab').openFile(file);
   }catch(error){new Notice(String(error.message||error));}finally{b.setDisabled(false);}
  }));
 };
 modal.open();
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
 plugin.registerEvent?.(plugin.app.vault.on('rename',(file,oldPath)=>{
  if(!file||file.extension!=='md'||!oldPath||oldPath===file.path)return;
  const notes=plugin.settings.v11Studio?.reviewNotes||{};
  if(notes[oldPath]&&!notes[file.path]){notes[file.path]=notes[oldPath];delete notes[oldPath];void plugin.saveSettings();}
  if(plugin._writerV11Drafts?.has(oldPath)){
   plugin._writerV11Drafts.set(file.path,plugin._writerV11Drafts.get(oldPath));plugin._writerV11Drafts.delete(oldPath);
  }
 }));

 plugin.addCommand({id:'v11-longform-studio',name:writerUi('Longform: abrir estúdio contínuo','Longform: open continuous studio'),
  callback:()=>writerV11PickProject(plugin,project=>writerV11OpenProject(plugin,project))});
 plugin.addCommand({id:'v11-editorial-review',name:writerUi('Revisão: comparar snapshots do capítulo','Review: compare chapter snapshots'),
  callback:()=>writerV11OpenRevision(plugin,plugin.app.workspace.getActiveFile?.())});
 plugin.addCommand({id:'v11-universal-search',name:writerUi('Pesquisa: conteúdo e propriedades do cofre','Search: vault content and properties'),
  callback:()=>writerV11OpenSearch(plugin)});
 plugin.addCommand({id:'v11-manuscript-compile',name:writerUi('Longform: compilar manuscrito Markdown','Longform: compile Markdown manuscript'),
  callback:()=>writerV11PickProject(plugin,p=>void writerV11Compile(plugin,p,writerV11ProjectFiles(plugin,p,writerV11Cfg(plugin.settings).chapterLimit)))});
 plugin.addCommand({id:'v11-compatibility-center',name:writerUi('Basic: central de compatibilidade','Basic: compatibility center'),
  callback:()=>writerV11OpenDiagnostics(plugin)});
}
function writerV11StudioSettings(plugin,panel){
 const cfg=writerV11Cfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('v11 · Longform Studio','v11 · Longform Studio')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Escrita contínua segura, revisões com snapshots, pesquisa contextual e exportação Markdown por projeto.',
  'Safe continuous writing, snapshot comparisons, contextual search and per-project Markdown compilation.')});
 new Setting(panel).setName(writerUi('Ativar estúdio Longform','Enable Longform Studio'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Limite de capítulos por sessão','Chapter limit per session'))
  .addSlider(s=>s.setLimits(10,200,10).setValue(cfg.chapterLimit).setDynamicTooltip().onChange(async v=>{cfg.chapterLimit=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Máximo de notas pesquisadas','Maximum searched notes'))
  .addSlider(s=>s.setLimits(25,1000,25).setValue(cfg.searchLimit).setDynamicTooltip().onChange(async v=>{cfg.searchLimit=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Estúdio Longform','Longform Studio'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV11PickProject(plugin,p=>writerV11OpenProject(plugin,p))));
 new Setting(panel).setName(writerUi('Central de compatibilidade','Compatibility center'))
  .addButton(b=>b.setButtonText(writerUi('Diagnosticar','Diagnose')).onClick(()=>writerV11OpenDiagnostics(plugin)));
}
