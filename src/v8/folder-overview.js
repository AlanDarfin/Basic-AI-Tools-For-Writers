'use strict';
/* Folder Overview: vault-native, icon-only previews and responsive layouts.
 * Supports browsing nested folders on desktop and mobile without rewriting notes. */
const WRITER_V8_OVERVIEW_DEFAULTS={
 style:'cards',sort:'name-asc',folderFirst:true,subfolders:true,depth:2,
 limit:48,briefMax:110,noteOnly:false,showBrief:false,showPath:false,controls:true
};
const WRITER_V8_OVERVIEW_STYLES=['cards','list','compact','grid','table','board'];
const WRITER_V8_OVERVIEW_SORTS=['name-asc','name-desc','modified-desc','modified-asc','created-desc','created-asc','size-desc','size-asc','type'];
function writerV8OverviewConfig(source){
 const cfg={...WRITER_V8_OVERVIEW_DEFAULTS};
 for(const raw of String(source||'').slice(0,4000).split(/\r?\n/)){
  const match=/^\s*([A-Za-z][\w-]*):\s*(.*?)\s*$/.exec(raw);
  if(!match)continue;
  const key=match[1],value=match[2].replace(/^['"]|['"]$/g,'').trim();
  if(['style','view','layout'].includes(key)){
   const normalized=value==='card'?'cards':value==='strip'?'list':value;
   if(WRITER_V8_OVERVIEW_STYLES.includes(normalized))cfg.style=normalized;
  }
  if(key==='sort'&&WRITER_V8_OVERVIEW_SORTS.includes(value))cfg.sort=value;
  if(key==='type'&&value==='folder_brief_live')cfg.live=true;
  if(key==='folder'&&value&&!value.includes('..')&&!value.startsWith('/')&&value.length<400)cfg.folder=value;
  if(['subfolders','noteOnly','showBrief','showPath','controls','folderFirst'].includes(key)&&/^(true|false)$/.test(value))
   cfg[key]=value==='true';
  if(key==='depth')cfg.depth=Math.max(0,Math.min(8,Number(value)||0));
  if(key==='limit')cfg.limit=Math.max(1,Math.min(200,Number(value)||48));
  if(key==='briefMax')cfg.briefMax=Math.max(32,Math.min(400,Number(value)||110));
 }
 return cfg;
}
function writerV8OverviewRoot(app,sourcePath,config){
 const file=app.vault.getAbstractFileByPath(sourcePath||'');
 if(config.folder){
  const explicit=app.vault.getAbstractFileByPath(config.folder.replace(/\/$/,''));
  return explicit instanceof TFolder?explicit:null;
 }
 if(file instanceof TFolder)return file;
 if(!(file instanceof TFile))return null;
 const outside=app.vault.getAbstractFileByPath(file.path.replace(/\.md$/i,''));
 if(outside instanceof TFolder)return outside;
 return file.parent instanceof TFolder?file.parent:null;
}
function writerV8OverviewSortEntries(entries,cfg){
 const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 const name=(item)=>String(item.file.basename||item.file.name||'');
 const timestamp=(item,key)=>Number(item.file.stat?.[key]||0);
 const size=(item)=>Number(item.file.stat?.size||0);
 const comparison=(a,b)=>{
  if(cfg.folderFirst!==false&&a.kind!==b.kind)return a.kind==='folder'?-1:1;
  let result=0;
  switch(cfg.sort){
   case 'name-desc':result=-collator.compare(name(a),name(b));break;
   case 'modified-desc':result=timestamp(b,'mtime')-timestamp(a,'mtime');break;
   case 'modified-asc':result=timestamp(a,'mtime')-timestamp(b,'mtime');break;
   case 'created-desc':result=timestamp(b,'ctime')-timestamp(a,'ctime');break;
   case 'created-asc':result=timestamp(a,'ctime')-timestamp(b,'ctime');break;
   case 'size-desc':result=size(b)-size(a);break;
   case 'size-asc':result=size(a)-size(b);break;
   case 'type':result=a.kind===b.kind?0:(a.kind==='folder'?-1:1);break;
   default:result=collator.compare(name(a),name(b));
  }
  return result||collator.compare(name(a),name(b))||collator.compare(a.file.path,b.file.path);
 };
 return entries.sort(comparison);
}
function writerV8OverviewEntries(app,root,cfg){
 if(!(root instanceof TFolder))return [];
 const entries=[],seen=new Set();
 const scan=(folder,depth)=>{
  if(depth>cfg.depth||entries.length>=cfg.limit)return;
  const children=(folder.children||[]).filter(child=>child instanceof TFolder||
   child instanceof TFile&&child.extension==='md');
  const sorted=writerV8OverviewSortEntries(children.map(file=>({
   file,kind:file instanceof TFolder?'folder':'note'
  })),cfg);
  for(const item of sorted){
   if(entries.length>=cfg.limit)break;
   const child=item.file;
   if(item.kind==='folder'){
    if(!cfg.noteOnly)entries.push({...item,depth});
    if(cfg.subfolders&&depth<cfg.depth)scan(child,depth+1);
   }else{
    const folderNote=typeof writerV7FolderNote==='function'?writerV7FolderNote(app,child.parent):null;
    if(folderNote?.path===child.path||seen.has(child.path))continue;
    seen.add(child.path);
    entries.push({...item,depth});
   }
  }
 };
 scan(root,0);
 return entries;
}
function writerV8OverviewPlainBrief(raw,max){
 return String(raw||'')
  .replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/,'')
  .replace(/(?:^|\n)[ \t]*(?:\x60{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*(?:\x60{3,}|~{3,})[ \t]*(?=\n|$)/g,'')
  .split(/\r?\n/)
  .map(line=>line.trim())
  .filter(line=>line&&
   !/^(?:#|---|:::|!? \[\[)/.test(line)&&
   !/^(?:id|folderPath|showTitle|depth|style|subfolders|overview|title|folder|icon|cover|tags|aliases|cssclasses|position|view|type):\s*/i.test(line)&&
   !/^\{\{[^}]+\}\}$/.test(line))
  .join(' ')
  .replace(/!\[\[[^\]]+\]\]/g,'')
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_match,target,label)=>label||target)
  .replace(/[*_~]/g,'')
  .replace(/\s+/g,' ').trim().slice(0,max);
}
async function writerV8OverviewBrief(app,file,max){
 const meta=app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 const simple=meta.summary||meta.description||meta.brief||'';
 if(typeof simple==='string'&&simple.trim())return writerV8OverviewPlainBrief(simple,max);
 if(!(file instanceof TFile))return '';
 try{
  const raw=(await app.vault.cachedRead(file)).slice(0,6000);
  return writerV8OverviewPlainBrief(raw,max);
 }catch(_){return '';}
}
function writerV8OverviewIcon(plugin,item,host){
 const appearance=plugin.settings?.v9Explorer?.items?.[item.file.path]||{};
 const iconName=/^[a-z][a-z0-9-]{0,50}$/.test(appearance.icon||'')?
  appearance.icon:(item.kind==='folder'?'folder':'file-text');
 const color=/^#[0-9a-f]{6}$/i.test(appearance.color||'')?appearance.color:'';
 const symbol=host.createSpan({cls:'writer-v8-overview-icon'});
 if(color)symbol.style.color=color;
 try{
  const setIcon=require('obsidian').setIcon;
  if(typeof setIcon==='function')setIcon(symbol,iconName);
  else symbol.setText(item.kind==='folder'?'📁':'📄');
 }catch(_){symbol.setText(item.kind==='folder'?'📁':'📄');}
 return symbol;
}
function writerV8OverviewSortOptions(){
 return [
  ['name-asc','Nome A–Z','Name A–Z'],['name-desc','Nome Z–A','Name Z–A'],
  ['modified-desc','Modificado recentemente','Recently modified'],
  ['modified-asc','Modificado há mais tempo','Oldest modified'],
  ['created-desc','Criado recentemente','Recently created'],
  ['created-asc','Criado há mais tempo','Oldest created'],
  ['size-desc','Maior arquivo','Largest first'],
  ['size-asc','Menor arquivo','Smallest first'],
  ['type','Tipo','Type']
 ];
}
function writerV8OverviewStyleOptions(){
 return [
  ['cards','Cartões','Cards'],['list','Lista (árvore)','List (tree)'],
  ['compact','Compacto','Compact'],['grid','Grade de ícones','Icon grid'],
  ['table','Tabela','Table'],['board','Quadro','Board']
 ];
}
function writerV8RegisterFolderOverview(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 const render=async(source,element,ctx)=>{
  const cfg=writerV8OverviewConfig(source),root=writerV8OverviewRoot(plugin.app,ctx.sourcePath,cfg);
  const host=element.createDiv({cls:'writer-v8-overview'});
  if(!root){host.createEl('p',{text:writerUi('Pasta não encontrada.','Folder not found.')});return;}
  let current=root,revision=0,style=cfg.style,sort=cfg.sort,query='';
  const collapsed=new Set();
  const draw=async()=>{
   const seq=++revision;
   host.empty();
   const header=host.createDiv({cls:'writer-v8-overview-header'});
   if(current.path!==root.path){
    const back=header.createEl('button',{text:'← '+writerUi('Voltar','Back'),attr:{type:'button'}});
    back.addEventListener('click',event=>{
     event.preventDefault();event.stopPropagation();
     current=current.parent instanceof TFolder?current.parent:root;collapsed.clear();void draw();
    });
   }
   header.createEl('strong',{text:current.name||writerUi('Cofre','Vault')});
   if(cfg.controls){
    const toolbar=host.createDiv({cls:'writer-v8-overview-controls'});
    const select=(options,value,label,onChange)=>{
     const field=toolbar.createEl('select',{attr:{'aria-label':label,title:label}});
     for(const [key,pt,en] of options){
      const opt=field.createEl('option',{text:writerUi(pt,en)});opt.value=key;
     }
     field.value=value;
     field.addEventListener('change',()=>onChange(field.value));
     return field;
    };
    select(writerV8OverviewStyleOptions(),style,writerUi('Modo de visualização','View mode'),
     value=>{style=value;collapsed.clear();void draw();});
    select(writerV8OverviewSortOptions(),sort,writerUi('Ordenação','Sort order'),
     value=>{sort=value;void draw();});
    const search=toolbar.createEl('input',{attr:{
     type:'search',placeholder:writerUi('Filtrar nomes…','Filter names…'),
     'aria-label':writerUi('Pesquisar no Overview','Search overview')
    }});
    search.value=query;
    search.addEventListener('input',()=>{
     query=search.value;const position=search.selectionStart;
     void draw().then(()=>{
      const active=host.querySelector('.writer-v8-overview-controls input[type="search"]');
      if(active){active.focus();if(position!==null)try{active.setSelectionRange(position,position);}catch(_){}}
     });
    });
   }
   const config={...cfg,sort},entries=writerV8OverviewEntries(plugin.app,current,config);
   const normalized=query.toLocaleLowerCase().trim();
   const filtered=entries.filter(entry=>{
    if(normalized&&!String(entry.file.basename||entry.file.name||'').toLocaleLowerCase().includes(normalized)
       &&!entry.file.path.toLocaleLowerCase().includes(normalized))return false;
    if(!normalized&&style==='list'&&cfg.subfolders)
     for(const path of collapsed)if(entry.file.path.startsWith(path+'/'))return false;
    return true;
   });
   const content=host.createDiv({cls:'writer-v8-overview-items is-'+style});
   if(!filtered.length){
    content.createEl('p',{text:writerUi('Nenhuma nota ou subpasta encontrada.','No notes or subfolders found.')});return;
   }
   const obs=typeof require==='function'?require('obsidian'):null;
   const createTile=async(entry,parent=content)=>{
    if(seq!==revision)return;
    const path=entry.file.path,name=entry.file.basename||entry.file.name;
    const row=parent.createDiv({cls:'writer-v8-overview-entry'+(entry.depth?' is-nested':'')});
    if(style==='list'&&entry.depth>0)row.style.setProperty('--writer-v8-overview-depth',String(Math.min(entry.depth,8)));
    const tile=row.createEl('button',{cls:'writer-v8-overview-tile',attr:{type:'button',title:path}});
    const title=tile.createDiv({cls:'writer-v8-overview-title'});
    writerV8OverviewIcon(plugin,entry,title);
    title.createSpan({text:name,cls:'writer-v8-overview-name'});
    if(entry.depth>0&&style!=='list'&&cfg.showPath)
     tile.createSpan({cls:'writer-v8-overview-path',text:entry.file.parent?.path||''});
    if(style==='table'){
     tile.createSpan({cls:'writer-v8-overview-type',text:entry.kind==='folder'?writerUi('Pasta','Folder'):writerUi('Nota','Note')});
     const stamp=entry.file.stat?.mtime;
     tile.createEl('time',{cls:'writer-v8-overview-date',text:stamp?
      new Date(stamp).toLocaleDateString(): '—'});
    }
    if(cfg.showBrief&&style!=='compact'&&style!=='grid'){
     const note=entry.kind==='folder'?
      (typeof writerV7FolderNote==='function'?writerV7FolderNote(plugin.app,entry.file):null):entry.file;
     if(note instanceof TFile){
      const brief=await writerV8OverviewBrief(plugin.app,note,cfg.briefMax);
      if(seq!==revision)return;
      if(brief)tile.createSpan({cls:'writer-v8-overview-brief',text:brief});
     }
    }
    tile.addEventListener('click',event=>{
     event.preventDefault();event.stopPropagation();
     if(entry.kind==='folder'){current=entry.file;collapsed.clear();void draw();}
     else void plugin.app.workspace.getLeaf(false).openFile(entry.file);
    });
    if(style==='list'&&entry.kind==='folder'&&cfg.subfolders&&entry.depth<cfg.depth){
     const toggle=row.createEl('button',{cls:'writer-v8-overview-expand',attr:{
      type:'button','aria-label':writerUi('Expandir ou recolher subpasta: ','Expand or collapse subfolder: ')+name,
      'aria-expanded':String(!collapsed.has(path))
     }});
     const folded=collapsed.has(path);
     try{obs?.setIcon?.(toggle,folded?'chevron-right':'chevron-down');}
     catch(_){toggle.setText(folded?'›':'⌄');}
     toggle.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      if(collapsed.has(path))collapsed.delete(path);else collapsed.add(path);
      void draw();
     });
    }
    return row;
   };
   if(style==='board'){
    for(const kind of ['folder','note']){
     const column=content.createDiv({cls:'writer-v8-overview-column'});
     const group=filtered.filter(item=>item.kind===kind);
     column.createEl('h4',{text:(kind==='folder'?writerUi('Pastas','Folders'):writerUi('Notas','Notes'))+' ('+group.length+')'});
     for(const entry of group)await createTile(entry,column);
    }
   }else{
    if(style==='table'){
     const row=content.createDiv({cls:'writer-v8-overview-table-head'});
     for(const [pt,en] of [['Nome','Name'],['Tipo','Type'],['Modificado','Modified']])
      row.createSpan({text:writerUi(pt,en)});
    }
    for(const entry of filtered)await createTile(entry);
   }
  };
  await draw();
  const Child=require('obsidian').MarkdownRenderChild;
  if(typeof Child==='function'&&typeof ctx.addChild==='function'){
   const observer=new Child(host);let timer;
   observer.onload=()=>{
    const update=file=>{
     if(file?.path&&(file.path===current.path||file.path.startsWith(current.path+'/'))){
      clearTimeout(timer);timer=setTimeout(()=>{if(host.isConnected)void draw();},260);
     }
    };
    for(const name of ['create','delete','rename','modify'])observer.registerEvent(plugin.app.vault.on(name,update));
   };
   observer.onunload=()=>clearTimeout(timer);
   ctx.addChild(observer);
  }
 };
 plugin.registerMarkdownCodeBlockProcessor('folder-overview',render);
 plugin.registerMarkdownCodeBlockProcessor('writer-folder-overview',render);
 plugin.addCommand?.({id:'v8-insert-folder-overview',name:writerUi('Pasta: inserir Overview','Folder: insert overview'),
  editorCallback:editor=>editor.replaceSelection('\n\x60\x60\x60folder-overview\nstyle: cards\nsort: name-asc\nsubfolders: true\ndepth: 2\nshowBrief: false\n\x60\x60\x60\n')});
}
