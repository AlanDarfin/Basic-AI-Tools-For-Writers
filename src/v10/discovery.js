'use strict';
/* Local-first note discovery and safe Obsidian .trash explorer.
 * Inspired by Related Notes and Trash Explorer; independent MIT-compatible implementation. */
const WRITER_V10_RELATED_VIEW='writer-related-notes';
const WRITER_V10_TRASH_VIEW='writer-trash-explorer';
function writerV10DiscoveryMerge(settings){
 const old=settings.v10Discovery&&typeof settings.v10Discovery==='object'?settings.v10Discovery:{};
 const cfg=settings.v10Discovery={enabled:true,related:true,trash:true,maxCandidates:350,maxResults:8,relatedMinScore:0.12,...old};
 cfg.maxCandidates=Math.max(30,Math.min(1200,Math.floor(Number(cfg.maxCandidates)||350)));
 cfg.maxResults=Math.max(3,Math.min(20,Math.floor(Number(cfg.maxResults)||8)));
 cfg.relatedMinScore=Math.max(0.02,Math.min(0.85,Number(cfg.relatedMinScore)||0.12));
 return cfg;
}
const WRITER_V10_STOP=new Set('a o os as de da do das dos em no na nos nas para por com sem que um uma uns umas ao aos se e ou é ser ter the and for with from that this are was were into then than have has you your not but our their its der die das und ist ein eine les des aux dans pour est avec sur los las del con que una uno'.split(' '));
function writerV10RelatedTokens(text){
 const source=String(text||'').replace(/^---\r?\n[\s\S]*?\r?\n---\s*\n/,' ').replace(/```[\s\S]*?```/g,' ').slice(0,45000).toLocaleLowerCase();
 const out=new Set();
 for(const match of source.matchAll(/[\p{L}\p{N}]{2,}/gu)){
  const word=match[0];
  if(word.length>2&&!WRITER_V10_STOP.has(word))out.add(word.slice(0,45));
  if(/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(word)){
   for(let i=0;i<Math.min(word.length-1,80);i++)out.add(word.slice(i,i+2));
  }
  if(out.size>=1400)break;
 }
 return out;
}
function writerV10RelatedSignature(tokens){
 const bloom=new Uint32Array(64);
 for(const token of tokens){
  let h=2166136261;
  for(let i=0;i<token.length;i++)h=Math.imul(h^token.charCodeAt(i),16777619)>>>0;
  for(const bit of [h&2047,(Math.imul(h^(h>>>16),2246822519)>>>0)&2047])bloom[bit>>>5]|=1<<(bit&31);
 }
 return bloom;
}
function writerV10RelatedScore(a,b){
 if(!a?.tokens?.size||!b?.tokens?.size)return 0;
 let common=0,possible=0;
 for(let i=0;i<64;i++){let v=a.bloom[i]&b.bloom[i];while(v){v&=v-1;possible++;}}
 if(possible<2)return 0;
 const [small,big]=a.tokens.size<b.tokens.size?[a.tokens,b.tokens]:[b.tokens,a.tokens];
 for(const token of small)if(big.has(token))common++;
 const base=common/Math.sqrt(a.tokens.size*b.tokens.size);
 const overlap=common/Math.max(1,Math.min(a.tokens.size,b.tokens.size));
 const tagsA=new Set(a.tags),tagsB=new Set(b.tags);
 const tagOverlap=[...tagsA].filter(t=>tagsB.has(t)).length;
 return Math.min(1,base*.8+overlap*.16+Math.min(0.18,tagOverlap*.06));
}
async function writerV10RelatedIndex(plugin,file){
 const cache=plugin._writerV10RelatedCache||(plugin._writerV10RelatedCache=new Map());
 const old=cache.get(file.path);
 if(old?.mtime===file.stat?.mtime&&old.size===file.stat?.size)return old;
 if((file.stat?.size||0)>750000)return null;
 const raw=await plugin.app.vault.cachedRead(file);
 const tokens=writerV10RelatedTokens(raw),metadata=plugin.app.metadataCache?.getFileCache?.(file);
 for(const word of writerV10RelatedTokens(file.basename||''))tokens.add(word);
 const tags=[...(metadata?.tags||[]).map(x=>x.tag),...(Array.isArray(metadata?.frontmatter?.tags)?metadata.frontmatter.tags:[metadata?.frontmatter?.tags])].filter(Boolean).map(x=>String(x).toLocaleLowerCase().replace(/^#/,''));
 const entry={mtime:file.stat?.mtime,size:file.stat?.size,tokens,tags,bloom:writerV10RelatedSignature(tokens)};
 if(cache.size>1800)cache.delete(cache.keys().next().value);
 cache.set(file.path,entry);
 return entry;
}
async function writerV10FindRelated(plugin,active){
 const cfg=plugin.settings.v10Discovery;
 if(!cfg?.enabled||!cfg.related||!(active instanceof TFile)||active.extension!=='md')return [];
 const current=await writerV10RelatedIndex(plugin,active);
 if(!current)return [];
 const candidates=(plugin.app.vault.getMarkdownFiles?.()||[])
  .filter(file=>file.path!==active.path&&(file.stat?.size||0)<750000)
  .sort((a,b)=>(b.stat?.mtime||0)-(a.stat?.mtime||0))
  .slice(0,cfg.maxCandidates);
 const ranked=[];
 for(let i=0;i<candidates.length;i++){
  const file=candidates[i];
  try{
   const entry=await writerV10RelatedIndex(plugin,file),score=writerV10RelatedScore(current,entry);
   if(score>=cfg.relatedMinScore)ranked.push({file,score});
  }catch(error){console.warn('[Basic AI] Related note:',file.path,error);}
  if(i%28===27)await new Promise(resolve=>setTimeout(resolve,0));
 }
 return ranked.sort((a,b)=>b.score-a.score).slice(0,cfg.maxResults);
}
function writerV10RelatedResults(plugin,host,file){
 host.empty();
 if(!(file instanceof TFile)){host.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Abra uma nota Markdown para ver conexões.','Open a Markdown note to discover connections.')});return;}
 const current=file.path;
 host.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Analisando notas localmente…','Finding local connections…')});
 void writerV10FindRelated(plugin,file).then(results=>{
  if(!host.isConnected||current!==file.path)return;
  host.empty();
  if(!results.length){host.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Nenhuma correspondência forte encontrada.','No strong matches found.')});return;}
  for(const {file:other,score} of results){
   const row=host.createDiv({cls:'writer-v10-discovery-row'});
   const open=row.createEl('button',{cls:'writer-v10-discovery-open',attr:{type:'button',title:other.path}});
   open.createSpan({text:other.basename});
   open.createEl('small',{text:Math.round(score*100)+'% · '+other.path});
   open.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(other));
   const link=row.createEl('button',{cls:'writer-v10-discovery-icon',attr:{type:'button',title:writerUi('Inserir link na nota ativa','Insert link in active note'),'aria-label':writerUi('Inserir link','Insert link')}});
   setIcon(link,'link-2');
   link.addEventListener('click',()=>{
    const view=plugin.app.workspace.getActiveViewOfType?.(require('obsidian').MarkdownView);
    const source=view?.file;
    if(!source||!view.editor){new Notice(writerUi('Abra uma nota em edição antes de inserir o link.','Open an editable note before inserting a link.'));return;}
    const markdown=plugin.app.fileManager.generateMarkdownLink(other,source.path);
    view.editor.replaceSelection(markdown);
   });
  }
 }).catch(error=>{if(host.isConnected)host.setText(writerUi('Não foi possível analisar as notas.','Could not analyze notes.'));console.warn('[Basic AI] Related notes:',error);});
}
class WriterV10RelatedView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;}
 getViewType(){return WRITER_V10_RELATED_VIEW;}
 getDisplayText(){return writerUi('Notas relacionadas','Related notes');}
 getIcon(){return 'link-2';}
 async onOpen(){this.refresh();}
 refresh(){
  this.contentEl.empty();this.contentEl.addClass('writer-v10-discovery-pane');
  const top=this.contentEl.createDiv({cls:'writer-v10-discovery-top'});
  top.createEl('h3',{text:writerUi('Notas relacionadas','Related notes')});
  const reload=top.createEl('button',{attr:{type:'button','aria-label':writerUi('Reanalisar','Reanalyze')}});setIcon(reload,'refresh-cw');reload.addEventListener('click',()=>this.refresh());
  const host=this.contentEl.createDiv();
  writerV10RelatedResults(this.plugin,host,this.plugin.app.workspace.getActiveFile?.());
 }
}
async function writerV10TrashList(plugin,max=400){
 const adapter=plugin.app.vault.adapter;
 if(!await adapter.exists('.trash'))return [];
 const found=[],pending=['.trash'];
 while(pending.length&&found.length<max){
  const path=pending.shift();
  let listing;
  try{listing=await adapter.list(path);}catch(error){console.warn('[Basic AI] Trash list:',path,error);continue;}
  for(const file of listing.files||[])if(file.startsWith('.trash/')&&found.length<max)found.push(file);
  for(const folder of listing.folders||[])if(folder.startsWith('.trash/')&&folder.split('/').length<14&&pending.length<500)pending.push(folder);
 }
 return found.sort((a,b)=>a.localeCompare(b));
}
async function writerV10TrashFolders(plugin){
 const adapter=plugin.app.vault.adapter;
 if(!await adapter.exists('.trash'))return [];
 try{
  const listing=await adapter.list('.trash');
  return (listing.folders||[]).filter(p=>p.startsWith('.trash/')&&p!=='.trash').sort((a,b)=>a.localeCompare(b));
 }catch(error){console.warn('[Basic AI] Trash folders:',error);return [];}
}
async function writerV10TrashDeleteFolder(plugin,path){
 if(!path.startsWith('.trash/')||path.slice(7).split('/').some(x=>!x||x==='.'||x==='..'||x.includes('\\')||x.includes('\0')))throw Error('Invalid trash folder');
 await plugin.app.vault.adapter.rmdir(path,true);
}
async function writerV10TrashRestore(plugin,path){
 if(!path.startsWith('.trash/')||path.slice(7).split('/').some(segment=>!segment||segment==='.'||segment==='..'||segment.includes('\\')||segment.includes('\0')))throw Error('Invalid trash path');
 const adapter=plugin.app.vault.adapter,destination=path.slice('.trash/'.length);
 if(!destination||destination.startsWith('.trash/'))throw Error('Invalid destination');
 if(await adapter.exists(destination))throw Error(writerUi('Já existe um arquivo com esse nome.','A file with this name already exists.'));
 const segments=destination.split('/');segments.pop();
 let dir='';
 for(const segment of segments){dir=dir?dir+'/'+segment:segment;if(!await adapter.exists(dir))await adapter.mkdir(dir);}
 await adapter.rename(path,destination);
 return destination;
}
async function writerV10TrashPermanentlyDelete(plugin,path){
 if(!path.startsWith('.trash/')||path.slice(7).split('/').some(segment=>!segment||segment==='.'||segment==='..'||segment.includes('\\')||segment.includes('\0')))throw Error('Invalid trash path');
 await plugin.app.vault.adapter.remove(path);
}
function writerV10Confirm(plugin,title,description,action){
 const modal=new Modal(plugin.app);modal.setTitle(title);
 modal.onOpen=()=>{
  modal.contentEl.createEl('p',{text:description});
  const buttons=modal.contentEl.createDiv({cls:'writer-v10-discovery-actions'});
  buttons.createEl('button',{text:writerUi('Cancelar','Cancel')}).addEventListener('click',()=>modal.close());
  const ok=buttons.createEl('button',{text:writerUi('Excluir definitivamente','Delete permanently'),cls:'mod-warning'});
  ok.addEventListener('click',async()=>{ok.disabled=true;try{await action();modal.close();}catch(error){new Notice(String(error.message||error));ok.disabled=false;}});
 };
 modal.open();
}
async function writerV10TrashEmpty(plugin){
 let count=0;
 for(let pass=0;pass<10;pass++){
  const files=await writerV10TrashList(plugin,1000);
  if(!files.length){
   const folders=await writerV10TrashFolders(plugin);
   for(const path of folders)await writerV10TrashDeleteFolder(plugin,path);
   return count+folders.length;
  }
  for(const path of files){await writerV10TrashPermanentlyDelete(plugin,path);count++;}
 }
 throw Error(writerUi('A operação atingiu o limite de segurança de 10 mil arquivos.','Reached the 10,000-file safety limit.'));
}
function writerV10TrashRows(plugin,host,limit=40){
 host.empty();host.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('Carregando lixeira interna…','Loading Obsidian trash…')});
 void Promise.all([writerV10TrashList(plugin),writerV10TrashFolders(plugin)]).then(([files,folders])=>{
  if(!host.isConnected)return;
  host.empty();
  host.createEl('p',{cls:'writer-v8-home-muted',text:files.length+' '+writerUi('arquivos','files')+' · '+folders.length+' '+writerUi('pastas','folders')});
  if(!files.length&&!folders.length)return;
  for(const path of [...folders.map(path=>({path,isFolder:true})),...files.map(path=>({path,isFolder:false}))].slice(0,limit).map(x=>x)){ 
   const isFolder=path.isFolder,entry=path.path;
   const row=host.createDiv({cls:'writer-v10-discovery-row'});
   row.createEl('span',{text:entry.slice(7)+(isFolder?'/':''),cls:'writer-v10-trash-path'});
   const actions=row.createDiv({cls:'writer-v10-discovery-actions'});
   const restore=actions.createEl('button',{attr:{title:writerUi('Restaurar','Restore'),'aria-label':writerUi('Restaurar','Restore')}});setIcon(restore,'undo-2');
   restore.addEventListener('click',async()=>{
    restore.disabled=true;
    try{const dest=await writerV10TrashRestore(plugin,entry);new Notice(writerUi('Restaurado: ','Restored: ')+dest);writerV10TrashRows(plugin,host,limit);}
    catch(error){new Notice(String(error.message||error));restore.disabled=false;}
   });
   const erase=actions.createEl('button',{attr:{title:writerUi('Excluir definitivamente','Delete permanently'),'aria-label':writerUi('Excluir definitivamente','Delete permanently')}});setIcon(erase,'trash-2');
   erase.addEventListener('click',()=>writerV10Confirm(plugin,writerUi('Excluir arquivo?','Delete file?'),entry,async()=>{
    if(isFolder)await writerV10TrashDeleteFolder(plugin,entry);
    else await writerV10TrashPermanentlyDelete(plugin,entry);
    writerV10TrashRows(plugin,host,limit);
   }));
  }
  if(files.length+folders.length>limit)host.createEl('small',{text:writerUi('Abra o explorador para ver mais arquivos.','Open the explorer to see more files.')});
 }).catch(error=>{if(host.isConnected)host.setText(writerUi('Não foi possível acessar a lixeira interna.','Could not read Obsidian trash.'));console.warn('[Basic AI] Trash:',error);});
}
class WriterV10TrashView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;}
 getViewType(){return WRITER_V10_TRASH_VIEW;}
 getDisplayText(){return writerUi('Lixeira','Trash explorer');}
 getIcon(){return 'trash-2';}
 async onOpen(){this.refresh();}
 refresh(){
  this.contentEl.empty();this.contentEl.addClass('writer-v10-discovery-pane');
  const top=this.contentEl.createDiv({cls:'writer-v10-discovery-top'});
  top.createEl('h3',{text:writerUi('Lixeira do Obsidian','Obsidian trash')});
  const refresh=top.createEl('button',{attr:{'aria-label':writerUi('Atualizar','Refresh')}});setIcon(refresh,'refresh-cw');refresh.addEventListener('click',()=>this.refresh());
  this.contentEl.createEl('p',{cls:'writer-v8-home-muted',text:writerUi('A restauração usa o caminho preservado na lixeira; o Obsidian pode descartar as pastas originais.','Restore uses the path preserved in trash; Obsidian may discard original parent folders.')});
  const actions=this.contentEl.createDiv({cls:'writer-v10-discovery-actions'});
  actions.createEl('button',{text:writerUi('Esvaziar lixeira…','Empty trash…')}).addEventListener('click',()=>writerV10Confirm(this.plugin,writerUi('Esvaziar lixeira?','Empty trash?'),writerUi('Esta ação não pode ser desfeita.','This action cannot be undone.'),async()=>{
   const count=await writerV10TrashEmpty(this.plugin);new Notice(count+' '+writerUi('arquivos apagados.','files deleted.'));this.refresh();
  }));
  writerV10TrashRows(this.plugin,this.contentEl.createDiv(),400);
 }
}
function writerV10DiscoveryCurrentFile(plugin){
 const active=plugin.app.workspace.getActiveFile?.();
 if(active instanceof TFile&&active.extension==='md')return active;
 const recent=plugin.settings?.v8Finish?.homeRecent||[];
 for(const path of recent){const file=plugin.app.vault.getAbstractFileByPath(path);if(file instanceof TFile&&file.extension==='md')return file;}
 return null;
}
function writerV10RenderRelatedWidget(view,parent){
 const host=view.card(parent,'related','Notas relacionadas','Related notes');
 const open=host.createEl('button',{text:writerUi('Abrir painel','Open sidebar')});
 open.addEventListener('click',()=>void view.plugin.writerV10OpenRelated?.());
 writerV10RelatedResults(view.plugin,host.createDiv(),writerV10DiscoveryCurrentFile(view.plugin));
}
function writerV10RenderTrashWidget(view,parent){
 const host=view.card(parent,'trash','Lixeira','Trash');
 const open=host.createEl('button',{text:writerUi('Explorar lixeira','Explore trash')});
 open.addEventListener('click',()=>void view.plugin.writerV10OpenTrash?.());
 writerV10TrashRows(view.plugin,host.createDiv(),5);
}
function writerV10RenderReadingWidget(view,parent){
 const host=view.card(parent,'reading','Leitura da nota','Note reading');
 const file=writerV10DiscoveryCurrentFile(view.plugin);
 if(!(file instanceof TFile)){host.createEl('p',{text:writerUi('Abra uma nota para visualizar o resumo.','Open a note for reading statistics.')});return;}
 const detail=host.createDiv({cls:'writer-v10-reading-stats'});
 void view.app.vault.cachedRead(file).then(content=>{
  if(!detail.isConnected)return;
  const words=(content.match(/[\p{L}\p{N}]+/gu)||[]).length;
  const headings=(content.match(/^#{1,6} /gm)||[]).length;
  const minutes=Math.max(1,Math.ceil(words/220));
  detail.createEl('strong',{text:file.basename});
  detail.createEl('p',{text:words+' '+writerUi('palavras','words')+' · '+headings+' '+writerUi('títulos','headings')+' · ~'+minutes+' min'});
 }).catch(()=>{if(detail.isConnected)detail.setText(writerUi('Não foi possível ler esta nota.','Could not read this note.'));});
}
function writerV10RenderZoteroWidget(view,parent){
 const host=view.card(parent,'zotero','Biblioteca Zotero','Zotero library');
 const files=(view.app.vault.getMarkdownFiles?.()||[]).filter(file=>typeof writerV92ZoteroIsSource==='function'&&writerV92ZoteroIsSource(view.plugin,file));
 host.createEl('p',{text:files.length+' '+writerUi('notas importadas','imported notes')});
 const cite=host.createEl('button',{text:writerUi('Inserir citação…','Insert citation…')});
 cite.addEventListener('click',()=>writerV10ZoteroPicker(view.plugin));
 for(const file of files.slice(0,4)){
  const button=host.createEl('button',{cls:'writer-v10-discovery-open',text:file.basename});
  button.addEventListener('click',()=>void view.app.workspace.getLeaf('tab').openFile(file));
 }
 host.createEl('small',{cls:'writer-v8-home-muted',text:writerUi('Fonte: notas locais importadas; sem sincronização automática.','Source: local imported notes; no automatic sync.')});
}
function writerV10ZoteroRef(plugin,file){
 const front=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 const key=String(front.citekey||front.citationKey||front['citation-key']||front.bibtexKey||'').trim().replace(/^@/,'').slice(0,100);
 const title=String(front.title||file.basename).slice(0,160);
 const creator=front.author||front.creators||front.creator||'';
 const author=Array.isArray(creator)?creator.map(p=>typeof p==='string'?p:[p.lastName,p.firstName].filter(Boolean).join(', ')).join('; '):String(creator);
 return {file,key,title,author:author.slice(0,150),doi:String(front.DOI||front.doi||'').slice(0,100)};
}
function writerV10ZoteroPicker(plugin){
 const files=(plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>typeof writerV92ZoteroIsSource==='function'&&writerV92ZoteroIsSource(plugin,file)).slice(0,500);
 const references=files.map(file=>writerV10ZoteroRef(plugin,file));
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Inserir citação Zotero','Insert Zotero citation'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Pesquisa em notas Markdown já importadas. Better BibTeX: propriedade citekey.','Search previously imported Markdown notes. Better BibTeX: citekey property.')});
  const search=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Título, autor, DOI ou citekey…','Title, author, DOI or citekey…'),'aria-label':writerUi('Buscar referências','Search references')}});
  const results=root.createDiv({cls:'writer-v10-zotero-picker'});
  const draw=()=>{
   results.empty();const query=search.value.trim().toLocaleLowerCase();
   const filtered=references.filter(ref=>[ref.key,ref.title,ref.author,ref.doi].some(value=>value.toLocaleLowerCase().includes(query))).slice(0,40);
   if(!filtered.length){results.createEl('p',{text:writerUi('Nenhuma referência importada encontrada.','No imported reference found.')});return;}
   for(const ref of filtered){
    const button=results.createEl('button',{cls:'writer-v10-discovery-open',attr:{type:'button'}});
    button.createSpan({text:ref.title});button.createEl('small',{text:[ref.author,ref.key?'@'+ref.key:'',ref.doi].filter(Boolean).join(' · ')});
    button.addEventListener('click',()=>{
     const view=plugin.app.workspace.getActiveViewOfType?.(require('obsidian').MarkdownView);
     if(!view?.editor||!view?.file){new Notice(writerUi('Abra uma nota editável antes de citar.','Open an editable note to insert a citation.'));return;}
     const citation=ref.key?'[@'+ref.key.replace(/[^\w:.-]/g,'')+']':plugin.app.fileManager.generateMarkdownLink(ref.file,view.file.path);
     view.editor.replaceSelection(citation);modal.close();
    });
   }
  };
  search.addEventListener('input',draw);draw();
 };
 modal.open();
}
function writerV10DiscoveryRegister(plugin){
 writerV10DiscoveryMerge(plugin.settings);
 if(!plugin.settings.v10Discovery.enabled)return;
 plugin.registerView?.(WRITER_V10_RELATED_VIEW,leaf=>new WriterV10RelatedView(leaf,plugin));
 plugin.registerView?.(WRITER_V10_TRASH_VIEW,leaf=>new WriterV10TrashView(leaf,plugin));
 const open=async(type,where)=>{const leaf=plugin.app.workspace.getLeavesOfType?.(type)?.[0]||plugin.app.workspace.getRightLeaf?.(false)||plugin.app.workspace.getLeaf?.('tab');if(leaf){await leaf.setViewState({type,active:true});plugin.app.workspace.revealLeaf?.(leaf);}};
 plugin.writerV10OpenRelated=()=>open(WRITER_V10_RELATED_VIEW);
 plugin.writerV10OpenTrash=()=>open(WRITER_V10_TRASH_VIEW);
 plugin.addCommand({id:'v10-zotero-insert-citation',name:writerUi('Zotero: inserir referência importada','Zotero: insert imported citation'),callback:()=>writerV10ZoteroPicker(plugin)});
 plugin.addCommand({id:'v10-related-notes',name:writerUi('Notas: encontrar relacionadas','Notes: find related'),callback:()=>void plugin.writerV10OpenRelated()});
 plugin.addCommand({id:'v10-trash-explorer',name:writerUi('Lixeira: abrir explorador','Trash: open explorer'),callback:()=>void plugin.writerV10OpenTrash()});
 plugin.addCommand({id:'v10-empty-trash',name:writerUi('Lixeira: esvaziar com confirmação','Trash: empty with confirmation'),callback:()=>writerV10Confirm(plugin,writerUi('Esvaziar lixeira?','Empty trash?'),writerUi('Apaga permanentemente os arquivos da lixeira interna.','Permanently deletes files from the internal trash.'),async()=>{const count=await writerV10TrashEmpty(plugin);new Notice(count+' '+writerUi('arquivos excluídos.','files deleted.'));})});
 const refresh=()=>{for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V10_RELATED_VIEW)||[])leaf.view?.refresh?.();};
 plugin.registerEvent(plugin.app.workspace.on('file-open',refresh));
 plugin.registerEvent(plugin.app.vault.on('rename',(file,oldPath)=>{plugin._writerV10RelatedCache?.delete(oldPath);refresh();}));
 plugin.registerEvent(plugin.app.vault.on('modify',file=>{plugin._writerV10RelatedCache?.delete(file.path);}));
 plugin.registerEvent(plugin.app.vault.on('delete',file=>{plugin._writerV10RelatedCache?.delete(file.path);}));
 plugin.register?.(()=>plugin._writerV10RelatedCache?.clear());
}
function writerV10DiscoverySettings(plugin,panel){
 const cfg=plugin.settings.v10Discovery;
 panel.createEl('h3',{text:writerUi('Notas relacionadas e lixeira','Related notes & trash')});
 for(const [key,pt,en] of [['enabled','Ativar descoberta e lixeira','Enable discovery and trash'],['related','Buscar notas relacionadas localmente','Find related notes locally'],['trash','Ativar explorador da lixeira','Enable trash explorer']])
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Máximo de notas analisadas','Maximum notes to scan'))
  .setDesc(writerUi('Notas recentes primeiro; índices mantidos apenas na memória.','Recent notes first; indexes stay in memory.'))
  .addSlider(s=>s.setLimits(30,1200,30).setValue(cfg.maxCandidates).setDynamicTooltip().onChange(async v=>{cfg.maxCandidates=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Resultados relacionados','Related results')).addSlider(s=>s.setLimits(3,20,1).setValue(cfg.maxResults).setDynamicTooltip().onChange(async v=>{cfg.maxResults=v;await plugin.saveSettings();}));
}
