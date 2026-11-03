'use strict';
/* Basic AI folder overview. Original implementation, compatible with normal vault notes. */
const WRITER_V8_OVERVIEW_DEFAULTS={style:'cards',subfolders:true,depth:1,limit:48,briefMax:110,noteOnly:false};
function writerV8OverviewConfig(source){
 const cfg={...WRITER_V8_OVERVIEW_DEFAULTS};
 for(const raw of String(source||'').slice(0,3000).split(/\r?\n/)){
  const match=/^([A-Za-z][\w-]*):\s*(.*?)\s*$/.exec(raw);
  if(!match)continue;
  const key=match[1],value=match[2].replace(/^['"]|['"]$/g,'');
  if(key==='style'&&['cards','card','list','strip'].includes(value))cfg.style=value==='card'?'cards':value==='strip'?'list':value;
  if(key==='type'&&value==='folder_brief_live')cfg.live=true;
  if(key==='folder'&&value&&!value.includes('..')&&!value.startsWith('/')&&value.length<400)cfg.folder=value;
  if(['subfolders','noteOnly'].includes(key))cfg[key]=value==='true';
  if(key==='depth')cfg.depth=Math.max(0,Math.min(3,Number(value)||0));
  if(key==='limit')cfg.limit=Math.max(1,Math.min(80,Number(value)||48));
  if(key==='briefMax')cfg.briefMax=Math.max(32,Math.min(220,Number(value)||110));
 }
 return cfg;
}
function writerV8OverviewRoot(app,sourcePath,config){
 const file=app.vault.getAbstractFileByPath(sourcePath||'');
 if(config.folder){
  const explicit=app.vault.getAbstractFileByPath(config.folder.replace(/\/$/,''));
  return explicit instanceof TFolder?explicit:null;
 }
 if(!(file instanceof TFile))return null;
 const outside=app.vault.getAbstractFileByPath(file.path.replace(/\.md$/i,''));
 if(outside instanceof TFolder)return outside;
 return file.parent instanceof TFolder?file.parent:null;
}
function writerV8OverviewEntries(app,root,cfg){
 if(!(root instanceof TFolder))return [];
 const entries=[],seen=new Set();
 const scan=(folder,depth)=>{
  if(depth>cfg.depth||entries.length>=cfg.limit)return;
  const children=[...(folder.children||[])].sort((a,b)=>{
   if((a instanceof TFolder)!==(b instanceof TFolder))return a instanceof TFolder?-1:1;
   return a.name.localeCompare(b.name,undefined,{sensitivity:'base'});
  });
  for(const child of children){
   if(entries.length>=cfg.limit)break;
   if(child instanceof TFolder){
    if(!cfg.noteOnly)entries.push({file:child,kind:'folder',depth});
    if(cfg.subfolders&&depth<cfg.depth)scan(child,depth+1);
   }else if(child instanceof TFile&&child.extension==='md'){
    const folderNote=writerV7FolderNote(app,child.parent);
    if(folderNote?.path===child.path||seen.has(child.path))continue;
    seen.add(child.path);
    entries.push({file:child,kind:'note',depth});
   }
  }
 };
 scan(root,0);
 return entries;
}
async function writerV8OverviewBrief(app,file,max){
 const meta=app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 const simple=String(meta.summary||meta.description||meta.brief||'').replace(/\s+/g,' ').trim();
 if(simple)return simple.slice(0,max);
 if(!(file instanceof TFile))return '';
 try{
  const body=(await app.vault.cachedRead(file)).slice(0,2400)
   .replace(/^---[\s\S]*?\n---\s*/,'')
   .replace(/^\s*(?:#.*|\x60{3}[^\n]*|:::.*)$/gm,'')
   .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,target,label)=>label||target)
   .replace(/[*_~!>]/g,'').trim();
  const first=body.split(/\n\s*\n/)[0]?.replace(/\s+/g,' ').trim()||'';
  return first.slice(0,max);
 }catch(_){return '';}
}
function writerV8RegisterFolderOverview(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 const render=async(source,element,ctx)=>{
  const cfg=writerV8OverviewConfig(source),root=writerV8OverviewRoot(plugin.app,ctx.sourcePath,cfg);
  const host=element.createDiv({cls:'writer-v8-overview'});
  if(!root){host.createEl('p',{text:writerUi('Pasta não encontrada.','Folder not found.')});return;}
  let current=root,revision=0;
  const draw=async()=>{
   const seq=++revision;
   host.empty();
   const header=host.createDiv({cls:'writer-v8-overview-header'});
   if(current.path!==root.path)header.createEl('button',{text:'← '+writerUi('Voltar','Back')})
    .addEventListener('click',()=>{current=current.parent instanceof TFolder?current.parent:root;void draw();});
   header.createEl('strong',{text:current.name||writerUi('Cofre','Vault')});
   const entries=writerV8OverviewEntries(plugin.app,current,cfg),cards=host.createDiv({cls:'writer-v8-overview-items '+(cfg.style==='list'?'is-list':'is-cards')});
   if(!entries.length){cards.createEl('p',{text:writerUi('Nenhuma nota ou subpasta encontrada.','No notes or subfolders found.')});return;}
   for(const entry of entries){
    if(seq!==revision)return;
    const tile=cards.createEl('button',{cls:'writer-v8-overview-tile',attr:{type:'button'}});
    const row=tile.createDiv({cls:'writer-v8-overview-title'});
    const symbol=row.createSpan({cls:'writer-v8-overview-icon'});
    if(typeof require('obsidian').setIcon==='function')require('obsidian').setIcon(symbol,entry.kind==='folder'?'folder':'file-text');
    else symbol.textContent=entry.kind==='folder'?'📁':'📄';
    row.createSpan({text:entry.file.basename||entry.file.name,cls:'writer-v8-overview-name'});
    if(entry.depth>0)tile.classList.add('is-nested');
    const note=entry.kind==='folder'?writerV7FolderNote(plugin.app,entry.file):entry.file;
    const image=note&&typeof writerV7StudioImage==='function'?writerV7StudioImage(plugin.app,{path:note.path,cache:plugin.app.metadataCache?.getFileCache?.(note)}):'';
    if(image)tile.createEl('img',{cls:'writer-v8-overview-image',attr:{src:image,alt:'',loading:'lazy'}});
    if(note instanceof TFile){
     const brief=await writerV8OverviewBrief(plugin.app,note,cfg.briefMax);
     if(seq!==revision)return;
     if(brief)tile.createEl('span',{cls:'writer-v8-overview-brief',text:brief});
    }
    tile.addEventListener('click',()=>{
     if(entry.kind==='folder'){current=entry.file;void draw();return;}
     void plugin.app.workspace.getLeaf(false).openFile(entry.file);
    });
   }
  };
  await draw();
  // Refresh only while the rendered block remains mounted. The child owns its listeners.
  const Child=require('obsidian').MarkdownRenderChild;
  if(typeof Child==='function'&&typeof ctx.addChild==='function'){
   const observer=new Child(host);
   let timer;
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
  editorCallback:editor=>editor.replaceSelection('\n\x60\x60\x60folder-overview\nstyle: cards\nsubfolders: true\n\x60\x60\x60\n')});
}
