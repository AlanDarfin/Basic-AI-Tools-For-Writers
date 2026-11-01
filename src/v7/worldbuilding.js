'use strict';
/* v7 beta.1 — original, local-first worldbuilding tools.
 * Reference plugins are not bundled or copied.
 */
const WRITER_V7_DEFAULTS={
 compendium:true,timeline:true,folderNotes:true,explorerFolderNotes:true,
 narrativeMemory:false,focusMode:false,continuity:true,
 maxEntries:3000,maxContextChars:4200
};
function writerV7Merge(settings){
 const x=settings.v7&&typeof settings.v7==='object'&&!Array.isArray(settings.v7)?settings.v7:{};
 settings.v7={...WRITER_V7_DEFAULTS,...x};
 for(const key of ['compendium','timeline','folderNotes','explorerFolderNotes','narrativeMemory','focusMode','continuity'])
  settings.v7[key]=x[key]===undefined?WRITER_V7_DEFAULTS[key]:x[key]===true;
 settings.v7.maxEntries=Math.max(100,Math.min(10000,Number(settings.v7.maxEntries)||3000));
 settings.v7.maxContextChars=Math.max(500,Math.min(12000,Number(settings.v7.maxContextChars)||4200));
 return settings.v7;
}
function writerV7Tag(value){
 const original=String(value||'').trim().replace(/^#+/,'');
 if(!original||original.length>100||/\s/.test(original))return '';
 return /^[\p{L}\p{N}_/-]+$/u.test(original)&&/[\p{L}\p{N}_]/u.test(original)?'#'+original:'';
}
function writerV7TagList(raw){
 const values=Array.isArray(raw)?raw:typeof raw==='string'?raw.split(/[\s,]+/):[];
 return [...new Set(values.map(writerV7Tag).filter(Boolean))];
}
function writerV7NoteTags(app,file){
 const cache=app.metadataCache?.getFileCache?.(file);
 const tags=writerV7TagList(cache?.frontmatter?.tags);
 for(const entry of cache?.tags||[]){
  const tag=writerV7Tag(entry?.tag);
  if(tag)tags.push(tag);
 }
 try{
  const all=require('obsidian').getAllTags?.(cache);
  for(const value of all||[]){const tag=writerV7Tag(value);if(tag)tags.push(tag);}
 }catch(_){}
 return [...new Set(tags)];
}
function writerV7FolderNote(app,folder){
 if(!(folder instanceof TFolder)||!folder.path||folder.path==='/')return null;
 const name=folder.name||folder.path.split('/').pop();
 for(const path of [folder.path+'/'+name+'.md',folder.path+'.md']){
  const file=app.vault.getAbstractFileByPath(path);
  if(file instanceof TFile&&file.extension==='md')return file;
 }
 return null;
}
function writerV7InheritedTags(app,file){
 const tags=new Set(writerV7NoteTags(app,file));
 let folder=file.parent,steps=0;
 while(folder instanceof TFolder&&steps++<32){
  const folderNote=writerV7FolderNote(app,folder);
  if(folderNote&&folderNote.path!==file.path)for(const tag of writerV7NoteTags(app,folderNote))tags.add(tag);
  folder=folder.parent;
 }
 return [...tags];
}
function writerV7ProjectNotes(view,project){
 const root=view.notesRoot(project),folder=view.app.vault.getAbstractFileByPath(root);
 if(!(folder instanceof TFolder))return [];
 const out=[],limit=view.plugin.settings.v7?.maxEntries||3000;
 const walk=(node,depth)=>{
  if(depth>30||out.length>=limit)return;
  for(const item of node.children||[]){
   if(out.length>=limit)break;
   if(item instanceof TFolder)walk(item,depth+1);
   else if(item instanceof TFile&&item.extension==='md'){
    const folderNote=item.parent instanceof TFolder?writerV7FolderNote(view.app,item.parent):null;
    out.push({file:item,path:item.path,title:item.basename,folder:item.parent?.path||'',folderNote:folderNote?.path===item.path,
     tags:writerV7InheritedTags(view.app,item),cache:view.app.metadataCache?.getFileCache?.(item)});
   }
  }
 };
 walk(folder,0);
 return out.sort((a,b)=>a.title.localeCompare(b.title,undefined,{sensitivity:'base'}));
}
function writerV7Classify(entry){
 const tags=entry.tags.map(t=>t.toLocaleLowerCase());
 if(tags.some(t=>/^#(personagem|character|npc)(\/|$)/.test(t)))return 'character';
 if(tags.some(t=>/^#(local|lugar|place|location)(\/|$)/.test(t)))return 'place';
 if(tags.some(t=>/^#(item|objeto|artefato)(\/|$)/.test(t)))return 'item';
 return 'note';
}
async function writerV7AssignTag(app,file,value){
 const tag=writerV7Tag(value);
 if(!tag)throw Error(writerUi('Tag inválida. Use #nome ou #grupo/subgrupo sem espaços.','Invalid tag. Use #name or #group/subgroup without spaces.'));
 if(typeof app.fileManager?.processFrontMatter!=='function')throw Error(writerUi('Edição de propriedades indisponível.','Frontmatter editing is unavailable.'));
 await app.fileManager.processFrontMatter(file,fm=>{
  const prior=writerV7TagList(fm.tags);
  if(!prior.includes(tag))prior.push(tag);
  fm.tags=prior.map(t=>t.slice(1));
 });
 return tag;
}
function writerV7TimelineDate(value){
 const str=String(value??'').trim();
 if(!str)return null;
 const m=/^(-?\d{1,6})(?:-(\d\d)(?:-(\d\d))?)?$/.exec(str);
 if(!m)return null;
 const year=Number(m[1]);
 if(!m[2])return year*400;
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const months=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 const month=Number(m[2]),day=Number(m[3]||1);
 if(month<1||month>12||day<1||day>months[month-1])return null;
 return year*400+months.slice(0,month-1).reduce((sum,n)=>sum+n,0)+day-1;
}
function writerV7TimelineEntries(view,project,records){
 const prefs=view.prefs(project),saved=Array.isArray(prefs.v7Timeline)?prefs.v7Timeline:[];
 const items=[];
 for(const item of saved.slice(0,2000)){
  if(!item||typeof item!=='object')continue;
  const title=String(item.title||'').trim().slice(0,200);
  if(!title)continue;
  items.push({id:String(item.id||''),title,date:String(item.date||'').slice(0,80),
   category:String(item.category||'').slice(0,100),note:String(item.note||'').slice(0,500),
   description:String(item.description||'').slice(0,1500),
   track:String(item.track||'').slice(0,100),branch:String(item.branch||'main').slice(0,100),
   endDate:String(item.endDate||'').slice(0,80),milestone:item.milestone===true,source:'manual'});
 }
 for(const entry of records){
  const fm=entry.cache?.frontmatter||{};
  const value=fm.timeline&&typeof fm.timeline==='object'?fm.timeline:null;
  const date=value?.date||fm.eventDate||fm.timelineDate;
  if(date===undefined||date===null||date==='')continue;
  items.push({id:'note:'+entry.path,title:String(value?.title||fm.eventTitle||entry.title).slice(0,200),
   date:String(date).slice(0,80),category:String(value?.category||fm.category||'').slice(0,100),
   note:entry.path,description:String(value?.description||fm.description||'').slice(0,1500),
   track:String(value?.track||fm.track||'').slice(0,100),branch:String(value?.branch||fm.branch||'main').slice(0,100),
   endDate:String(value?.endDate||fm.endDate||'').slice(0,80),
   milestone:value?.milestone===true||fm.milestone===true,source:'note'});
 }
 const sortDate=value=>typeof writerV7CalendarSortDate==='function'
  ?writerV7CalendarSortDate(value,prefs.v7Calendar):writerV7TimelineDate(value);
 return items.map((x,i)=>({...x,sortKey:sortDate(x.date),endKey:sortDate(x.endDate),originalOrder:i})).sort((a,b)=>{
  if(a.sortKey===null&&b.sortKey===null)return a.originalOrder-b.originalOrder;
  if(a.sortKey===null)return 1;if(b.sortKey===null)return -1;
  return a.sortKey-b.sortKey||a.originalOrder-b.originalOrder;
 });
}
function writerV7ContinuityChecks(view,project,records){
 const results=[],events=writerV7TimelineEntries(view,project,records),dates=new Map();
 for(const event of events){
  const key=event.title.trim().toLocaleLowerCase();
  if(!key)continue;
  const previous=dates.get(key);
  if(previous&&previous.date!==event.date)results.push({
   title:writerUi('Datas divergentes para o mesmo evento','Different dates for the same event'),
   detail:event.title+': '+previous.date+' / '+event.date
  });
  else dates.set(key,event);
 }
 for(const r of records){
  for(const link of (r.cache?.links||[]).slice(0,100)){
   const to=view.app.metadataCache?.getFirstLinkpathDest?.(link.link,r.path);
   if(!to&&String(link.link||'').trim())
    results.push({title:writerUi('Link não resolvido','Unresolved link'),detail:r.title+' → '+link.link});
   if(results.length>=120)return results;
  }
 }
 return results;
}
function writerV7CreateRecord(view,project,kind){
 const label=kind==='character'?writerUi('Personagem','Character'):kind==='place'?writerUi('Local','Place'):writerUi('Item','Item');
 const tag=kind==='character'?'personagem':kind==='place'?'local':'item';
 new TextPrompt(view.app,writerUi('Nome do registro: ','Record name: ')+label,async raw=>{
  const name=clean(raw);
  if(!name)return;
  try{
   const dir=view.notesRoot(project);
   await view.ensureFolder(dir);
   const path=dir+'/'+name+'.md';
   if(view.app.vault.getAbstractFileByPath(path))throw Error(writerUi('Nota já existente.','Note already exists.'));
   const body='---\ntags:\n  - '+tag+'\n---\n\n# '+name+'\n';
   const file=await view.app.vault.create(path,body);
   await view.openFile(file);await view.render();
  }catch(error){new Notice(String(error.message||error));}
 }).open();
}
function writerV7Connections(app,records,entry){
 const links=app.metadataCache?.resolvedLinks||{},out=[];
 for(const other of records){
  if(other.path===entry.path)continue;
  const forward=Number(links[entry.path]?.[other.path]||0);
  const reverse=Number(links[other.path]?.[entry.path]||0);
  if(forward||reverse)out.push({title:other.title,file:other.file,direction:forward?writerUi('Cita','Links to'):writerUi('Mencionado por','Linked from')});
 }
 return out.slice(0,15);
}
function writerV7RenderCompendium(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-compendium'});
 const heading=root.createDiv({cls:'writer-v7-section-header'});
 heading.createEl('h3',{text:writerUi('Compêndio do universo','World compendium')});
 heading.createEl('p',{text:writerUi('Pastas + tags do Obsidian, inclusive tags herdadas das notas de pasta.','Obsidian folders + tags, including tags inherited from folder notes.')});
 const actions=root.createDiv({cls:'writer-v7-toolbar'});
 actions.createEl('button',{text:writerUi('+ Nota','+ Note')}).addEventListener('click',()=>view.promptNote(view.notesRoot(project)));
 actions.createEl('button',{text:writerUi('+ Pasta','+ Folder')}).addEventListener('click',()=>view.promptNotesFolder(view.notesRoot(project)));
 const templates=writerV7StudioTemplates(view.plugin);
 const templatesSelect=actions.createEl('select',{attr:{'aria-label':writerUi('Tipo de novo registro','New entry type')}});
 for(const tpl of templates){const o=templatesSelect.createEl('option',{text:writerUi(tpl.pt||tpl.name,tpl.en||tpl.name)});o.value=tpl.id;}
 actions.createEl('button',{text:writerUi('+ Registro','+ Entry')}).addEventListener('click',()=>{
  const selected=templates.find(x=>x.id===templatesSelect.value);
  if(selected)writerV7StudioCreate(view,project,selected);
 });
 actions.createEl('button',{text:writerUi('Pastas','Folders')}).addEventListener('click',()=>{
  const tree=root.querySelector('.writer-v7-compendium-folders');
  if(tree)tree.open=!tree.open;
 });
 const records=writerV7ProjectNotes(view,project),allTags=[...new Set(records.flatMap(r=>r.tags))].sort();
 const controls=root.createDiv({cls:'writer-v7-filters'});
 const search=controls.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar nome, pasta ou tag…','Search names, folders or tags…'),'aria-label':writerUi('Pesquisar compêndio','Search compendium')}});
 const tagPicker=controls.createEl('select',{attr:{'aria-label':writerUi('Filtrar por tag','Filter by tag')}});
 tagPicker.createEl('option',{text:writerUi('Todas as tags','All tags'),value:''});
 for(const tag of allTags){const opt=tagPicker.createEl('option',{text:tag});opt.value=tag;}
 const kind=controls.createEl('select',{attr:{'aria-label':writerUi('Tipo de registro','Record type')}});
 const allTypes=[{id:'',pt:'Todos',en:'All'},...templates.map(t=>({id:t.id,pt:t.pt||t.name,en:t.en||t.name})),{id:'note',pt:'Outros',en:'Other'}];
 for(const category of allTypes){
  const o=kind.createEl('option',{text:writerUi(category.pt,category.en)});o.value=category.id;
 }
 const results=root.createDiv({cls:'writer-v7-compendium-results'});
 const update=()=>{
  results.empty();
  const q=search.value.trim().toLocaleLowerCase(),tag=tagPicker.value,type=kind.value;
  const shown=records.filter(r=>(!tag||r.tags.includes(tag))&&(!type||(writerV7StudioKind(r,templates)?.id||'note')===type)&&
   (!q||(r.title+' '+r.folder+' '+r.tags.join(' ')).toLocaleLowerCase().includes(q))).slice(0,500);
  const stat=root.querySelector('.writer-v7-compendium-count');
  if(stat)stat.setText(shown.length+'/'+records.length+' '+writerUi('registros','entries'));
  if(!shown.length){results.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma nota corresponde aos filtros.','No notes match these filters.')});return;}
  for(const r of shown){
   const card=results.createDiv({cls:'writer-v7-entry'});
   const head=card.createDiv({cls:'writer-v7-entry-head'});
   head.createEl('button',{cls:'writer-v7-entry-title',text:(r.folderNote?'▣ ':'')+r.title})
    .addEventListener('click',()=>view.openFile(r.file));
   const metadata=card.createDiv({cls:'writer-v7-entry-meta'});
   metadata.createSpan({text:r.folder,cls:'writer-v7-path'});
   for(const tag of r.tags.slice(0,12)){
    metadata.createEl('button',{cls:'writer-v7-tag',text:tag,attr:{type:'button','aria-label':writerUi('Filtrar por ','Filter by ')+tag}})
     .addEventListener('click',()=>{tagPicker.value=tag;update();});
   }
   card.createEl('button',{cls:'writer-v7-mini-action',text:'+ #',attr:{'aria-label':writerUi('Adicionar tag','Add tag')}})
    .addEventListener('click',()=>writerV7TagPrompt(view,r.file));
   writerV7StudioAugmentEntry(view,card,r,templates,records);

  }
 };
 const stat=root.createEl('p',{cls:'writer-v7-compendium-count'});
 search.addEventListener('input',update);tagPicker.addEventListener('change',update);kind.addEventListener('change',update);
 update();
 const folders=root.createEl('details',{cls:'writer-v7-compendium-folders'});
 folders.createEl('summary',{text:writerUi('Gerenciar estrutura de pastas','Manage folder structure')});
 const legacy=folders.createDiv({cls:'writer-v7-compendium-folder-tree'});
 view.drawNotesLegacy(legacy,project);
}
function writerV7TagPrompt(view,file){
 new TextPrompt(view.app,writerUi('Nova tag (#personagem, #item, #local…)','New tag (#character, #item, #place…)'),async input=>{
  try{await writerV7AssignTag(view.app,file,input);await view.render();}
  catch(e){new Notice(String(e.message||e));}
 }).open();
}
function writerV7TimelineEditor(view,project,existing){
 const modal=new Modal(view.app),item={date:existing?.date||'',title:existing?.title||'',category:existing?.category||'',description:existing?.description||'',note:existing?.note||'',
  endDate:existing?.endDate||'',track:existing?.track||'',branch:existing?.branch||'main',milestone:existing?.milestone===true};
 modal.onOpen=()=>{
  modal.setTitle(existing?writerUi('Editar evento','Edit event'):writerUi('Novo evento na timeline','New timeline event'));
  const field=(pt,en,key,rows)=>{
   const row=new Setting(modal.contentEl).setName(writerUi(pt,en));
   if(rows)row.addTextArea(t=>{t.inputEl.rows=rows;t.setValue(item[key]).onChange(v=>item[key]=v);});
   else row.addText(t=>t.setValue(item[key]).onChange(v=>item[key]=v));
  };
  field('Data ou era (AAAA-MM-DD, ano ou texto)','Date or era (YYYY-MM-DD, year or text)','date');
  field('Título','Title','title');
  field('Categoria ou tag','Category or tag','category');
  field('Trilha','Track','track');
  field('Ramificação (main = principal)','Branch (main = main story)','branch');
  field('Data final (opcional)','End date (optional)','endDate');
  new Setting(modal.contentEl).setName(writerUi('Marco importante','Milestone')).addToggle(x=>x.setValue(item.milestone).onChange(v=>item.milestone=v));
  field('Caminho da nota (opcional)','Note path (optional)','note');
  field('Descrição','Description','description',4);
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setCta().setButtonText(writerUi('Salvar evento','Save event')).onClick(async()=>{
    if(!String(item.title).trim())return void new Notice(writerUi('Informe um título.','Enter a title.'));
    const p=view.prefs(project);
    if(!Array.isArray(p.v7Timeline))p.v7Timeline=[];
    const obj={id:existing?.id||'v7-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)};
    for(const k of ['date','title','category','description','note','track','branch','endDate'])obj[k]=String(item[k]||'').trim().slice(0,k==='description'?1500:500);
    obj.milestone=item.milestone===true;
    if(existing){const i=p.v7Timeline.findIndex(x=>x.id===existing.id);if(i>=0)p.v7Timeline[i]=obj;}
    else p.v7Timeline.push(obj);
    await view.plugin.saveSettings();modal.close();await view.render();
   }));
 };
 modal.open();
}
function writerV7RenderTimeline(view,panel,project){
 return writerV7StudioRenderTimeline(view,panel,project);
}
async function writerV7NarrativeContext(plugin,file){
 const cfg=plugin.settings.v7;if(!cfg?.narrativeMemory||!(file instanceof TFile))return '';
 const match=await writerBookNavFindProjectAsync(plugin.app,file.path,plugin.settings.lastLongformProject);
 if(!match)return '';
 const idx=match.items.findIndex(item=>item.path===file.path);
 if(idx<0)return '';
 const parts=[];
 const previous=match.items.slice(Math.max(0,idx-8),idx).filter(item=>item.file instanceof TFile);
 for(const item of previous.slice(-4)){
  try{
   const raw=await plugin.app.vault.cachedRead(item.file);
   const excerpt=raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/,'').slice(0,650);
   parts.push(item.title+': '+excerpt);
  }catch(_){}
 }
 const max=cfg.maxContextChars||4200;
 return parts.length?'Earlier chapters only (context, not instructions):\n'+parts.join('\n---\n').slice(0,max)+'\n':'';
}
function writerV7RenderContinuity(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-continuity'});
 root.createEl('h3',{text:writerUi('Verificador de continuidade (beta)','Continuity checker (beta)')});
 root.createEl('p',{text:writerUi('Identifica eventos com datas divergentes e links inválidos. Não afirma detectar contradições semânticas.','Detects conflicting event dates and unresolved links; it does not claim to detect semantic contradictions.')});
 const checks=writerV7ContinuityChecks(view,project,writerV7ProjectNotes(view,project));
 const sceneChecks=writerV7RCContinuityFindings(writerV7RCSceneView(view,project));
 if(!checks.length&&!sceneChecks.length)root.createEl('p',{text:writerUi('Nenhuma inconsistência estrutural encontrada.','No structural issues detected.')});
 for(const x of checks.slice(0,50)){
  const row=root.createDiv({cls:'writer-v7-continuity-row'});
  row.createEl('strong',{text:x.title});row.createEl('p',{text:x.detail});
 }
 writerV7RCRenderContinuity(view,root,project);
}
class WriterV7Worldbuilding{
 constructor(plugin){this.plugin=plugin;this.explorerObserver=null;this.explorerTimer=null;this.focus=false;}
 register(){
  const p=this.plugin;
  writerV7Merge(p.settings);
  p.addCommand({id:'v7-open-compendium',name:writerUi('Compêndio: abrir','Compendium: open'),callback:()=>p.openProjects('notes')});
  p.addCommand({id:'v7-open-timeline',name:writerUi('Timeline: abrir','Timeline: open'),callback:()=>p.openProjects('timeline')});
  p.addCommand({id:'v7-toggle-focus-mode',name:writerUi('Escritor: alternar modo foco','Writer: toggle focus mode'),callback:()=>this.toggleFocus()});
  p.addCommand({id:'v7-folder-note-for-active',name:writerUi('Folder Notes: abrir nota da pasta atual','Folder Notes: open current folder note'),callback:()=>{
   const current=p.app.workspace.getActiveFile(),folder=current?.parent;
   const note=folder?writerV7FolderNote(p.app,folder):null;
   if(note)void p.app.workspace.getLeaf(false).openFile(note);
   else new Notice(writerUi('Pasta sem nota associada.','No folder note found.'));
  }});
  p.registerEvent(p.app.workspace.on('layout-change',()=>this.scheduleExplorer()));
  p.registerEvent(p.app.workspace.on('file-menu',(menu,file)=>{
   if(!(file instanceof TFolder)||!p.settings.v7?.folderNotes)return;
   const existing=writerV7FolderNote(p.app,file);
   menu.addItem(item=>item.setTitle(existing?writerUi('Abrir nota da pasta','Open folder note'):writerUi('Criar nota da pasta','Create folder note'))
    .setIcon('book-open').onClick(async()=>{
     try{
      const note=existing||await this.createFolderNote(file);
      if(note)await p.app.workspace.getLeaf(false).openFile(note);
     }catch(e){new Notice(String(e.message||e));}
    }));
  }));
  p.registerEvent(p.app.vault.on('create',()=>this.scheduleExplorer()));
  p.registerEvent(p.app.vault.on('rename',()=>this.scheduleExplorer()));
  p.registerEvent(p.app.vault.on('delete',()=>this.scheduleExplorer()));
  p.register?.(()=>{this.explorerObserver?.disconnect();clearTimeout(this.explorerTimer);});
  this.scheduleExplorer();
 }
 async createFolderNote(folder){
  if(!(folder instanceof TFolder))return null;
  const existing=writerV7FolderNote(this.plugin.app,folder);
  if(existing)return existing;
  const path=folder.path+'/'+folder.name+'.md';
  if(this.plugin.app.vault.getAbstractFileByPath(path))throw Error(writerUi('Já existe um arquivo com esse nome.','A file with that name already exists.'));
  return await this.plugin.app.vault.create(path,'---\ntags: []\n---\n\n# '+folder.name+'\n');
 }
 toggleFocus(){
  this.focus=!this.focus;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(view?.containerEl)view.containerEl.classList.toggle('writer-v7-focus-mode',this.focus);
  new Notice(this.focus?writerUi('Modo foco ativado.','Focus mode on.'):writerUi('Modo foco desativado.','Focus mode off.'));
 }
 scheduleExplorer(){
  clearTimeout(this.explorerTimer);
  this.explorerTimer=setTimeout(()=>this.decorateExplorer(),120);
 }
 decorateExplorer(){
  const app=this.plugin.app;
  const nativeFolderPlugin=app.plugins?.enabledPlugins?.has?.('folder-notes');
  const leaf=app.workspace.getLeavesOfType('file-explorer')?.[0];
  if(!leaf?.view?.containerEl)return;
  const el=leaf.view.containerEl;
  if(nativeFolderPlugin||!this.plugin.settings.v7?.folderNotes||!this.plugin.settings.v7?.explorerFolderNotes){
   el.querySelectorAll('.writer-v7-folder-open').forEach(btn=>btn.remove());return;
  }
  if(this.explorerNode!==el){
   this.explorerObserver?.disconnect();this.explorerNode=el;
   if(typeof MutationObserver==='function'){
    this.explorerObserver=new MutationObserver(records=>{
     if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('writer-v7-folder-open'))))this.scheduleExplorer();
    });
    this.explorerObserver.observe(el,{childList:true,subtree:true});
   }
  }
  for(const title of el.querySelectorAll('.nav-folder-title[data-path]')){
   const path=title.getAttribute('data-path'),folder=path&&app.vault.getAbstractFileByPath(path);
   const existing=title.querySelector('.writer-v7-folder-open');
   const note=writerV7FolderNote(app,folder);
   if(!note){existing?.remove();continue;}
   if(existing){existing.dataset.note=note.path;continue;}
   const b=title.ownerDocument.createElement('button');
   b.className='writer-v7-folder-open';b.type='button';b.dataset.note=note.path;
   b.setAttribute('aria-label',writerUi('Abrir nota da pasta: ','Open folder note: ')+folder.name);
   b.setAttribute('title',writerUi('Abrir nota da pasta','Open folder note'));
   b.textContent='▤';
   b.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const file=app.vault.getAbstractFileByPath(b.dataset.note);
    if(file instanceof TFile)void app.workspace.getLeaf(false).openFile(file);
   });
   title.appendChild(b);
  }
 }
 renderSettings(panel){
  const section=panel.createDiv({cls:'writer-v7-settings'});
  section.createEl('h3',{text:writerUi('Compêndio, Timeline e Folder Notes','Compendium, Timeline and Folder Notes')});
  section.createEl('p',{text:writerUi('Recursos locais, sem migração automática de arquivos. Compatível com tags existentes e a estrutura Longform.','Local features without automatic file migration. Works with existing tags and Longform structure.')});
  for(const [key,pt,en] of [
   ['compendium','Compêndio por tags','Tag-driven compendium'],
   ['timeline','Timeline de eventos','Event timeline'],
   ['folderNotes','Reconhecer notas de pasta','Recognize folder notes'],
   ['explorerFolderNotes','Mostrar acesso às notas de pasta no explorador','Show folder-note action in file explorer'],
   ['continuity','Verificador local de continuidade','Local continuity checker'],
   ['narrativeMemory','Enviar contexto de capítulos anteriores para revisão IA','Send previous-chapter context to AI review']
  ])new Setting(section).setName(writerUi(pt,en))
   .setDesc(key==='narrativeMemory'?writerUi('Desligado por padrão. Envia trechos anteriores ao provedor configurado, apenas durante a revisão.','Off by default. Previous chapter excerpts are sent to the configured provider only when reviewing.'):writerUi('Configurável; sem alterar automaticamente seus documentos.','Configurable; does not automatically modify your documents.'))
   .addToggle(toggle=>toggle.setValue(this.plugin.settings.v7[key]===true).onChange(async value=>{
    this.plugin.settings.v7[key]=value;await this.plugin.saveSettings();
    if(key==='explorerFolderNotes'||key==='folderNotes')this.scheduleExplorer();
   }));
  this.plugin.writerV7StoryStudio?.renderSettings(section);
  this.plugin.writerV7LongformRC?.renderSettings(section);
  new Setting(section).setName(writerUi('Limite de registros do compêndio','Compendium entry limit')).addText(x=>x.setValue(String(this.plugin.settings.v7.maxEntries)).onChange(async text=>{
   this.plugin.settings.v7.maxEntries=Math.max(100,Math.min(10000,Number(text)||3000));await this.plugin.saveSettings();
  }));
 }
}
