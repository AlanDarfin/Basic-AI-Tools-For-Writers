'use strict';
/* Local-first Media Gallery for writing projects. Inspired by Media Gallery View; no copied dependencies. */
const WRITER_V8_MEDIA_EXT={
 image:['png','jpg','jpeg','webp','gif','avif','svg','bmp'],
 video:['mp4','webm','mov','m4v','ogv'],
 audio:['mp3','ogg','wav','m4a','flac','opus'],
 pdf:['pdf'],
  document:['txt','rtf','doc','docx','odt','epub','csv','tsv','json','jsonc','yaml','yml','xml','html','css','md','toml']
};
function writerV8MediaConfig(source){
 const conf={path:'',type:'all',layout:'masonry',sort:'name-asc',subfolders:true,limit:90,pageSize:24};
 for(const line of String(source||'').slice(0,3000).split(/\r?\n/)){
  const match=/^\s*(path|folder|type|layout|sort|subfolders|limit|pageSize):\s*(.*?)\s*$/i.exec(line);
  if(!match)continue;
  const key=match[1].toLowerCase(),value=match[2].replace(/^['"]|['"]$/g,'');
  if(key==='path'||key==='folder')conf.path=value.slice(0,400);
  if(key==='type'&&['all','image','video','audio','pdf','document'].includes(value))conf.type=value;
  if(key==='layout'&&['masonry','grid','ratio'].includes(value))conf.layout=value;
  if(key==='sort'&&['name-asc','name-desc','mtime-desc','mtime-asc','size-desc','size-asc'].includes(value))conf.sort=value;
  if(key==='subfolders')conf.subfolders=value==='true';
  if(key==='limit')conf.limit=Math.max(1,Math.min(500,Number(value)||90));
  if(key==='pagesize'||key==='pageSize')conf.pageSize=Math.max(8,Math.min(60,Number(value)||24));
 }
 return conf;
}
function writerV8MediaKind(file){
 const ext=String(file?.extension||'').toLowerCase();
 return Object.keys(WRITER_V8_MEDIA_EXT).find(kind=>WRITER_V8_MEDIA_EXT[kind].includes(ext))||'';
}
function writerV8MediaFiles(app,folder,config){
 if(!(folder instanceof TFolder))return [];
 const files=[],stack=[{node:folder,depth:0}];
 while(stack.length&&files.length<config.limit){
  const {node,depth}=stack.pop();
  for(const child of node.children||[]){
   if(files.length>=config.limit)break;
   if(child instanceof TFolder){
    if(config.subfolders&&depth<20)stack.push({node:child,depth:depth+1});
   }else if(child instanceof TFile){
    const kind=writerV8MediaKind(child);
    if(kind&&(config.type==='all'||config.type===kind))files.push({file:child,kind});
   }
  }
 }
 const byName=(a,b)=>String(a.file.basename||a.file.name).localeCompare(String(b.file.basename||b.file.name),undefined,{sensitivity:'base'});
 const byTime=(a,b)=>(a.file.stat?.mtime||0)-(b.file.stat?.mtime||0)||byName(a,b);
 const bySize=(a,b)=>(a.file.stat?.size||0)-(b.file.stat?.size||0)||byName(a,b);
 files.sort(config.sort.startsWith('mtime')?byTime:config.sort.startsWith('size')?bySize:byName);
 if(config.sort.endsWith('desc'))files.reverse();
 return files;
}
function writerV8MediaRoot(plugin,sourcePath,config){
 const app=plugin.app;
 if(config.path){
  const folder=app.vault.getAbstractFileByPath(config.path.replace(/\/$/,''));
  return folder instanceof TFolder?folder:null;
 }
 const current=app.vault.getAbstractFileByPath(sourcePath||'');
 return current instanceof TFile&&current.parent instanceof TFolder?current.parent:null;
}
function writerV8MediaOpen(plugin,items,index){
 const item=items[index];
 if(!item)return;
 if(item.kind==='pdf'){void plugin.app.workspace.getLeaf(false).openFile(item.file);return;}
  if(item.kind==='document'){
   if(typeof plugin.writerV10OpenTextFile==='function'&&writerV10EditableText(item.file))plugin.writerV10OpenTextFile(item.file);
   else void plugin.app.workspace.getLeaf(false).openFile(item.file);
   return;
  }
 const modal=new Modal(plugin.app);
 const draw=i=>{
  const current=items[i];
  if(!current)return;
  modal.contentEl.empty();
  const shell=modal.contentEl.createDiv({cls:'writer-v8-media-lightbox'});
  const nav=shell.createDiv({cls:'writer-v8-media-lightbox-nav'});
  const prev=nav.createEl('button',{text:'←',attr:{type:'button','aria-label':writerUi('Anterior','Previous')}});
  nav.createEl('strong',{text:current.file.basename||current.file.name});
  const next=nav.createEl('button',{text:'→',attr:{type:'button','aria-label':writerUi('Próximo','Next')}});
  const url=plugin.app.vault.getResourcePath(current.file);
  if(current.kind==='image')shell.createEl('img',{cls:'writer-v8-media-preview',attr:{src:url,alt:current.file.basename||current.file.name}});
  if(current.kind==='video')shell.createEl('video',{cls:'writer-v8-media-preview',attr:{src:url,controls:'',preload:'metadata',playsinline:''}});
  if(current.kind==='audio')shell.createEl('audio',{cls:'writer-v8-media-audio',attr:{src:url,controls:'',preload:'metadata'}});
  const available=items.filter(x=>x.kind!=='pdf');
  const idx=available.findIndex(x=>x.file.path===current.file.path);
  prev.disabled=idx<=0;next.disabled=idx>=available.length-1;
  prev.addEventListener('click',()=>{shell.querySelector('video, audio')?.pause();draw(items.indexOf(available[idx-1]));});
  next.addEventListener('click',()=>{shell.querySelector('video, audio')?.pause();draw(items.indexOf(available[idx+1]));});
  const native=shell.createEl('button',{text:writerUi('Abrir arquivo no Obsidian','Open file in Obsidian')});
  native.addEventListener('click',()=>{modal.close();void plugin.app.workspace.getLeaf(false).openFile(current.file);});
 };
 modal.onOpen=()=>{draw(index);};
 modal.onClose=()=>{modal.contentEl.querySelectorAll('video, audio').forEach(media=>media.pause());};
 modal.open();
}
function writerV101MediaExcerpt(plugin,file,container){
 if(!file||Number(file.stat?.size||0)>200000)return;
 if(!['txt','md','csv','tsv','json','jsonc','yaml','yml','xml','html','css','toml'].includes(file.extension))return;
 const preview=container.createDiv({cls:'writer-v101-media-excerpt'});
 const show=()=>{
  void plugin.app.vault.cachedRead(file).then(text=>{
   if(preview.isConnected)preview.setText(String(text).replace(/^---\s*\r?\n[\s\S]*?\n---\s*\r?\n/,'').trim().slice(0,230));
  }).catch(()=>{if(preview.isConnected)preview.setText('');});
 };
 if(typeof IntersectionObserver==='function'){
  const io=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;io.disconnect();show();},{rootMargin:'160px'});
  io.observe(preview);const cleanup=()=>io.disconnect();
  if(typeof plugin.register==='function')plugin.register(cleanup);
 }else show();
}
function writerV8RenderMediaGallery(plugin,source,element,ctx){
 const cfg=writerV8MediaConfig(source);
 const root=writerV8MediaRoot(plugin,ctx.sourcePath,cfg);
 const host=element.createDiv({cls:'writer-v8-block writer-v8-media-gallery'});
 if(!root){host.createEl('p',{text:writerUi('Pasta da galeria não encontrada.','Gallery folder not found.')});return;}
 const all=writerV8MediaFiles(plugin.app,root,cfg);
 const header=host.createDiv({cls:'writer-v8-media-header'});
 header.createEl('strong',{text:root.name||writerUi('Galeria','Gallery')});
 const count=header.createSpan({cls:'writer-v8-media-count',text:String(all.length)});
 const search=header.createEl('input',{attr:{type:'search',placeholder:writerUi('Filtrar mídias…','Filter media…'),'aria-label':writerUi('Filtrar mídias','Filter media')}});
 const tabs=host.createDiv({cls:'writer-v8-media-filters'});
 const tools=host.createDiv({cls:'writer-v101-media-tools'});
 const toggle=tools.createEl('button',{text:writerUi('Selecionar vários','Select multiple'),attr:{type:'button','aria-pressed':'false'}});
 const copy=tools.createEl('button',{text:writerUi('Copiar links','Copy links'),attr:{type:'button'}});
 const selectedPaths=new Set();let multi=false;
 const grid=host.createDiv({cls:'writer-v8-media-grid writer-v8-media-'+cfg.layout});
 const pages=host.createDiv({cls:'writer-v101-media-pages'});
 let selected=cfg.type,page=0;
 const buttons=[];
 const render=()=>{
  grid.empty();pages.empty();
  const query=search.value.trim().toLocaleLowerCase();
  const matching=all.filter(x=>(selected==='all'||x.kind===selected)&&(!query||x.file.path.toLocaleLowerCase().includes(query)));
  count.setText(matching.length+' / '+all.length);
  buttons.forEach(({type,button})=>{button.classList.toggle('is-active',type===selected);button.setAttribute('aria-pressed',String(type===selected));});
  toggle.setAttribute('aria-pressed',String(multi));copy.disabled=!selectedPaths.size;
  const size=cfg.pageSize||24,last=Math.max(0,Math.ceil(matching.length/size)-1);
  page=Math.max(0,Math.min(page,last));
  const visible=matching.slice(page*size,page*size+size);
  for(const item of visible){
   const tile=grid.createEl('button',{cls:'writer-v8-media-item',attr:{type:'button',title:item.file.path}});
   tile.classList.toggle('is-selected',selectedPaths.has(item.file.path));
   tile.setAttribute('aria-pressed',String(multi&&selectedPaths.has(item.file.path)));
   if(item.kind==='image'){
    tile.createEl('img',{attr:{src:plugin.app.vault.getResourcePath(item.file),alt:item.file.basename||item.file.name,loading:'lazy',decoding:'async'}});
   }else if(item.kind==='video'){
    tile.createEl('video',{cls:'writer-v101-media-video-thumb',attr:{src:plugin.app.vault.getResourcePath(item.file),preload:'metadata',muted:'',playsinline:''}});
   }else if(item.kind==='pdf'){
    const preview=tile.createDiv({cls:'writer-v101-media-pdf-thumb'});
    const icon=preview.createSpan();
    require('obsidian').setIcon?.(icon,'file-search');
    preview.createSpan({text:'PDF'});
   }else{
    const glyph=tile.createDiv({cls:'writer-v8-media-glyph'});
    const obs=typeof require==='function'?require('obsidian'):null;
    const icon=item.kind==='audio'?'music':item.kind==='document'?'file-code-2':'file-text';
    if(typeof obs?.setIcon==='function')obs.setIcon(glyph,icon);
    else glyph.textContent=item.kind.toUpperCase();
    if(item.kind==='document')writerV101MediaExcerpt(plugin,item.file,tile);
   }
   tile.createSpan({cls:'writer-v8-media-filename',text:item.file.basename||item.file.name});
   if(multi)tile.createSpan({cls:'writer-v101-media-selection',text:selectedPaths.has(item.file.path)?'✓':'○'});
   tile.addEventListener('click',()=>{
    if(multi){
     if(selectedPaths.has(item.file.path))selectedPaths.delete(item.file.path);
     else if(selectedPaths.size<200)selectedPaths.add(item.file.path);
     render();
    }else writerV8MediaOpen(plugin,matching,matching.indexOf(item));
   });
  }
  if(!matching.length)grid.createEl('p',{text:writerUi('Nenhuma mídia encontrada.','No media found.')});
  if(last){
   const prev=pages.createEl('button',{text:writerUi('Anterior','Previous'),attr:{type:'button'}});prev.disabled=page===0;
   prev.addEventListener('click',()=>{page--;render();});
   pages.createSpan({text:(page+1)+' / '+(last+1)});
   const next=pages.createEl('button',{text:writerUi('Próxima','Next'),attr:{type:'button'}});next.disabled=page===last;
   next.addEventListener('click',()=>{page++;render();});
  }
 };
 toggle.addEventListener('click',()=>{multi=!multi;if(!multi)selectedPaths.clear();render();});
 copy.addEventListener('click',async()=>{
  const links=[...selectedPaths].map(path=>'[['+path.replace(/\]\]/g,'')+']]').join('\n');
  if(!links)return;
  try{if(!globalThis.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');
   await globalThis.navigator.clipboard.writeText(links);
   new Notice(writerUi('Links copiados.','Links copied.'));
  }catch(_){
   const dialog=new Modal(plugin.app);
   dialog.setTitle(writerUi('Copiar links de mídia','Copy media links'));
   dialog.onOpen=()=>{
    const textarea=dialog.contentEl.createEl('textarea',{cls:'writer-v101-media-links'});
    textarea.value=links;textarea.focus();textarea.select();
   };
   dialog.open();
  }
 });
 const categories=['all','image','video','audio','pdf','document'];
 for(const type of categories){
  if(cfg.type!=='all'&&type!==cfg.type)continue;
  const label={all:writerUi('Tudo','All'),image:writerUi('Imagens','Images'),video:writerUi('Vídeos','Videos'),audio:writerUi('Áudio','Audio'),pdf:'PDF',document:writerUi('Documentos','Documents')}[type];
  const button=tabs.createEl('button',{text:label,attr:{type:'button','aria-pressed':'false'}});
  button.addEventListener('click',()=>{selected=type;page=0;render();});buttons.push({type,button});
 }
 search.addEventListener('input',()=>{page=0;render();});render();
}

function writerV8RegisterMediaGallery(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor==='function')
  for(const type of ['media-gallery','writer-media-gallery'])plugin.registerMarkdownCodeBlockProcessor(type,(source,element,ctx)=>{
   if(!writerModuleOn(plugin,'mediaGallery')){element.createEl('pre',{text:source});return;}
   writerV8RenderMediaGallery(plugin,source,element,ctx);
  });
 plugin.addCommand?.({id:'v8-insert-media-gallery',name:writerUi('Galeria: inserir bloco de mídias','Gallery: insert media block'),
  editorCallback:editor=>editor.replaceSelection('\n```media-gallery\ntype: all\nlayout: masonry\nsubfolders: true\n```\n')});
}
