'use strict';
/* v6 beta 2: original hierarchical Longform navigation informed by BookNav and Note Chain behavior. */
const WRITER_BOOKNAV_DEFAULTS={enabled:true,showMain:true,showSub:true,auto:false};
function writerBookNavMerge(settings){
 const old=settings.bookNavigation;
 settings.bookNavigation={...WRITER_BOOKNAV_DEFAULTS,...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})};
 return settings.bookNavigation;
}
function writerBookNavFindSceneFile(index,entry,app){
 const parent=index.file.parent?.path||'';
 const folder=String(index.meta?.sceneFolder||'/').replace(/^\/+|\/+$/g,'');
 const title=String(entry?.title||'').trim();
 if(!title)return null;
 const names=[entry?.path,entry?.file,title].filter(x=>typeof x==='string'&&x.trim());
 const candidatePaths=[];
 for(const name of names){
  const base=name.replace(/\\/g,'/').replace(/\.md$/i,'');
  for(const prefix of [[parent,folder],[parent],[]]){
   candidatePaths.push(lfPath(...prefix,base+'.md'));
   candidatePaths.push(lfPath(...prefix,base));
  }
 }
 for(const path of new Set(candidatePaths)){
  const found=app.vault.getAbstractFileByPath(path);
  if(found instanceof TFile&&found.extension==='md')return found;
 }
 // A Longform scene can live in a nested folder. Search *inside this project*
 // only, and only when the basename is unambiguous, never across other books.
 const projectRoot=parent?parent+'/':'';
 const basename=title.replace(/\.md$/i,'').split('/').pop();
 const matches=app.vault.getMarkdownFiles().filter(file=>
  (file.path.startsWith(projectRoot)||!parent)&&file.basename===basename&&
  app.vault.getAbstractFileByPath(file.path) instanceof TFile
 );
 return matches.length===1?matches[0]:null;
}
function writerBookNavFlatten(index,app){
 if(!index||index.format!=='scenes')return [];
 const entries=lfFlattenScenes(index.scenes),out=[];
 for(let i=0;i<entries.length;i++){
  const file=writerBookNavFindSceneFile(index,entries[i],app);
  const level=Math.max(0,Math.floor(Number(entries[i].indent)||0));
  // Entries lacking a valid note still determine hierarchy and placement but
  // should never produce a navigation button to an invented or missing file.
  out.push({title:entries[i].title,indent:level,file,path:file?.path||null,index:i});
 }
 return out;
}
function writerBookNavTargets(entries,currentPath){
 const current=entries.findIndex(x=>x.path===currentPath);
 if(current<0)return null;
 const node=entries[current],level=node.indent;
 const roots=entries.map((x,i)=>({...x,i})).filter(x=>x.indent===0);
 const rootPos=roots.findLastIndex(x=>x.i<=current);
 if(rootPos<0)return null;
 const root=roots[rootPos],nextRoot=roots.slice(rootPos+1).find(x=>x.path);
 const prevRoot=roots.slice(0,rootPos).reverse().find(x=>x.path);
 let parent=null;
 if(level>0)for(let j=current-1;j>=root.i;j--)if(entries[j].indent<level){parent=entries[j];break;}
 const previousMain=level>0?(parent?.path?parent:prevRoot):prevRoot;
 const nextMain=nextRoot;
 const siblingRangeStart=parent?entries.indexOf(parent)+1:root.i+1;
 const limit=roots[rootPos+1]?.i??entries.length;
 let previousSub=null,nextSub=null;
 if(level===0){
  // A chapter offers its first direct subchapter independently of the next main chapter.
  nextSub=entries.slice(current+1,limit).find(x=>x.indent===1&&x.path)||null;
  if(prevRoot){
   const prevEnd=root.i;
   previousSub=entries.slice(prevRoot.i+1,prevEnd).filter(x=>x.indent===1&&x.path).pop()||null;
  }
 }else{
  const targetDepth=level,upper=entries.findIndex((x,j)=>j>current&&x.indent<targetDepth);
  const end=upper>=0?upper:entries.length;
  const inFamily=entries.map((x,i)=>({...x,i})).filter(x=>x.i>=siblingRangeStart&&x.i<end&&x.indent===targetDepth&&x.path);
  previousSub=inFamily.filter(x=>x.i<current).pop()||null;
  nextSub=inFamily.find(x=>x.i>current)||null;
  // If this note has subchapters, descend when no next sibling exists.
  if(!nextSub)nextSub=entries.slice(current+1,end).find(x=>x.indent===level+1&&x.path)||null;
 }
 const same=node.path;
 const cleaned=x=>x?.path&&x.path!==same?{path:x.path,title:x.title,indent:x.indent}:null;
 return {current:{path:node.path,title:node.title,indent:level},previousMain:cleaned(previousMain),nextMain:cleaned(nextMain),previousSub:cleaned(previousSub),nextSub:cleaned(nextSub)};
}
function writerBookNavFindProject(app,sourcePath,selectedIndex){
 const file=app.vault.getAbstractFileByPath(sourcePath);
 if(!(file instanceof TFile)||file.extension!=='md')return null;
 const indexes=app.vault.getMarkdownFiles().map(x=>longformIndex(x,app)).filter(Boolean);
 const matches=[];
 for(const index of indexes){
  const items=writerBookNavFlatten(index,app);
  if(items.some(x=>x.path===sourcePath))matches.push({index,items});
 }
 if(!matches.length)return null;
 return matches.find(x=>x.index.file.path===selectedIndex)||matches[0];
}
async function writerBookNavFindProjectAsync(app,sourcePath,selectedIndex){
 // Fast path for normal indexed YAML metadata.
 const direct=writerBookNavFindProject(app,sourcePath,selectedIndex);
 if(direct)return direct;
 const sourceFile=app.vault.getAbstractFileByPath(sourcePath);
 if(!(sourceFile instanceof TFile)||sourceFile.extension!=='md')return null;
 const indexes=app.vault.getMarkdownFiles().map(file=>longformIndex(file,app)).filter(Boolean);
 indexes.sort((a,b)=>Number(b.file.path===selectedIndex)-Number(a.file.path===selectedIndex));
 const matches=[];
 for(const index of indexes){
  // Obsidian's metadata cache may contain the Longform header but omit or
  // temporarily lag behind its nested scenes. The Projects sidebar already
  // handles this by reading the original YAML, so navigation does too.
  let actual=index;
  try{
   const text=await app.vault.cachedRead(index.file);
   const front=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
   const parsed=front?parseYaml(front[1]):null;
   if(parsed?.longform&&typeof parsed.longform==='object'&&Array.isArray(parsed.longform.scenes)){
    actual={...index,meta:{...index.meta,...parsed.longform},scenes:parsed.longform.scenes};
   }
  }catch(error){console.warn('[Basic AI] Longform index fallback:',error);}
  const items=writerBookNavFlatten(actual,app);
  if(items.some(item=>item.path===sourcePath))matches.push({index:actual,items});
 }
 if(!matches.length)return null;
 return matches.find(match=>match.index.file.path===selectedIndex)||matches[0];
}
function writerBookNavButtons(targets,options){
 const out=[];
 if(options.showMain!==false){
  if(targets.previousMain)out.push({direction:'previous',kind:'main',target:targets.previousMain});
  if(targets.nextMain)out.push({direction:'next',kind:'main',target:targets.nextMain});
 }
 if(options.showSub!==false){
  if(targets.previousSub)out.push({direction:'previous',kind:'sub',target:targets.previousSub});
  if(targets.nextSub)out.push({direction:'next',kind:'sub',target:targets.nextSub});
 }
 return out;
}

function writerBookNavParseManual(source){
 const raw=String(source||'').trim();
 if(!raw)return null;
 let data;
 try{data=parseYaml(raw);}catch(_){return null;}
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 if(String(data.mode||'').toLowerCase()!=='manual'&&!('previous' in data)&&!('next' in data))return null;
 const allowed=value=>typeof value==='string'?value.slice(0,500).trim():'';
 return {previous:allowed(data.previous||data.before),next:allowed(data.next||data.after)};
}
function writerBookNavResolveManual(app,sourcePath,value){
 let link=String(value||'').trim();
 if(link.startsWith('![['))link=link.slice(3);else if(link.startsWith('[['))link=link.slice(2);
 if(link.endsWith(']]'))link=link.slice(0,-2);
 link=link.split('|')[0].split('#')[0].trim();
 if(!link||link.includes('\0'))return null;
 const file=app.metadataCache?.getFirstLinkpathDest?.(link,sourcePath)||
  app.vault.getAbstractFileByPath(link.endsWith('.md')?link:link+'.md');
 if(!(file instanceof TFile)||file.extension!=='md')return null;
 return {path:file.path,title:file.basename,indent:0};
}
function writerBookNavManualButtons(app,sourcePath,data){
 const out=[];
 for(const [field,direction] of [['previous','previous'],['next','next']]){
  const target=writerBookNavResolveManual(app,sourcePath,data?.[field]);
  if(target&&target.path!==sourcePath)out.push({direction,kind:'main',target});
 }
 return out;
}
function writerBookNavRenderButtons(container,app,buttons,{manual=false,automatic=false}={}){
 if(!buttons.length)return false;
 const root=container.createDiv({cls:'writer-v6-booknav'+(automatic?' writer-v6-booknav-auto':'')+(manual?' writer-v6-booknav-manual':'')});
 root.setAttribute('role','navigation');
 root.setAttribute('aria-label',manual?writerUi('Navegação manual','Manual navigation'):writerUi('Navegação Longform','Longform navigation'));
 for(const button of buttons){
  const label=manual?writerUi(button.direction==='previous'?'Anterior':'Próximo',button.direction==='previous'?'Previous':'Next'):
   button.kind==='main'?
   writerUi(button.direction==='previous'?'Capítulo anterior':'Próximo capítulo',button.direction==='previous'?'Previous chapter':'Next chapter'):
   writerUi(button.direction==='previous'?'Subcapítulo anterior':'Próximo subcapítulo',button.direction==='previous'?'Previous subchapter':'Next subchapter');
  const item=root.createEl('button',{cls:'writer-v6-booknav-item writer-v6-booknav-'+button.direction+' writer-v6-booknav-'+button.kind,attr:{type:'button','aria-label':label+': '+button.target.title}});
  item.createSpan({cls:'writer-v6-booknav-arrow',text:button.direction==='previous'?'‹':'›'});
  const content=item.createSpan({cls:'writer-v6-booknav-text'});
  content.createSpan({cls:'writer-v6-booknav-label',text:label});
  content.createSpan({cls:'writer-v6-booknav-title',text:button.target.title});
  item.addEventListener('click',()=>{
   const file=app.vault.getAbstractFileByPath(button.target.path);
   if(file instanceof TFile)void app.workspace.getLeaf(false).openFile(file);
   else new Notice(writerUi('Nota não encontrada.','Note not found.'));
  });
 }
 return true;
}
function writerBookNavAutoAllowed(plugin,match){
 if(!match||!plugin.settings.bookNavigation?.enabled||!writerModuleOn(plugin,'bookNavigation'))return false;
 const pref=plugin.settings.projectsData?.[match.index.file.path]?.writingSettings?.navigation||'inherit';
 return pref==='on'||(pref!=='off'&&plugin.settings.bookNavigation.auto===true);
}
function writerBookNavHasSourceBlock(text){
 return /^ {0,3}(?:\x60{3,}|~{3,})longform-nav(?:\s|$)/mi.test(String(text||''));
}
class WriterBookNavWidget extends (typeof WriterV6WidgetType!=='undefined'?WriterV6WidgetType:class{}){
 constructor(plugin,buttons){super();this.plugin=plugin;this.buttons=buttons;}
 eq(other){return other instanceof WriterBookNavWidget&&JSON.stringify(other.buttons)===JSON.stringify(this.buttons);}
 toDOM(view){
  const root=view.dom.ownerDocument.createElement('div');
  writerBookNavRenderButtons(root,this.plugin.app,this.buttons,{automatic:true});
  return root;
 }
 ignoreEvent(){return false;}
}
function writerBookNavRender(container,app,sourcePath,options,resolvedMatch){
 const match=resolvedMatch||writerBookNavFindProject(app,sourcePath,options?.projectPath);
 if(!match)return false;
 const targets=writerBookNavTargets(match.items,sourcePath);
 if(!targets)return false;
 const buttons=writerBookNavButtons(targets,options||{});
 if(!buttons.length)return false;
 return writerBookNavRenderButtons(container,app,buttons);
}
class WriterBookNavigation{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.bookNavigation;}
 register(){
  const plugin=this.plugin;
  plugin.registerMarkdownCodeBlockProcessor?.('longform-nav',async (source,el,ctx)=>{
   if(this.cfg.enabled!==true||!writerModuleOn(plugin,'bookNavigation'))return;
   const manual=writerBookNavParseManual(source);
   if(manual){
    if(!writerBookNavRenderButtons(el,plugin.app,writerBookNavManualButtons(plugin.app,ctx.sourcePath,manual),{manual:true}))
     el.createEl('span',{cls:'writer-v6-booknav-empty',text:writerUi('Selecione notas válidas para anterior e próximo.','Choose valid previous and next notes.')});
    return;
   }
   const options={...this.cfg,projectPath:plugin.settings.lastLongformProject};
   const match=await writerBookNavFindProjectAsync(plugin.app,ctx.sourcePath,options.projectPath);
   if(!writerBookNavRender(el,plugin.app,ctx.sourcePath,options,match))
    el.createEl('span',{cls:'writer-v6-booknav-empty',text:writerUi('Esta nota não está na ordem de cenas do Longform. Use o modo manual para notas avulsas.','This note is not in a Longform scene order. Use manual mode for standalone notes.')});
  });
  plugin.addCommand({id:'v6-insert-manual-navigation',name:writerUi('Navegação: escolher anterior e próximo manualmente','Navigation: manually choose previous and next notes'),editorCallback:editor=>this.insertManual(editor)});
  plugin.addCommand({id:'v6-jump-to-chapter',name:writerUi('Longform: ir para capítulo','Longform: jump to chapter'),callback:()=>this.jumpToChapter()});
  this.registerAutomatic();
  plugin.addCommand({id:'v6-insert-longform-navigation',name:writerUi('Longform: inserir navegação entre capítulos','Longform: insert chapter navigation'),editorCallback:editor=>{
   editor.replaceSelection('\n'+'~~~longform-nav'+'\n'+'~~~'+'\n');
  }});
 }
 async chooseNote(title){
  const app=this.plugin.app;
  const options=[null,...app.vault.getMarkdownFiles()];
  return await new Promise(resolve=>{
   let chosen=false;
   class Picker extends FuzzySuggestModal{
    constructor(){super(app);this.setPlaceholder(title);}
    getItems(){return options;}
    getItemText(file){return file?file.path:writerUi('Nenhuma nota','No note');}
    onChooseItem(file){chosen=true;resolve(file);}
    onClose(){if(!chosen)resolve(undefined);}
   }
   new Picker().open();
  });
 }
 async insertManual(editor){
  const snapshot=editor.getValue(),from=editor.getCursor('from'),to=editor.getCursor('to');
  const previous=await this.chooseNote(writerUi('Selecione a nota anterior','Choose previous note'));
  if(previous===undefined)return;
  const next=await this.chooseNote(writerUi('Selecione a próxima nota','Choose next note'));
  if(next===undefined)return;
  if(editor.getValue()!==snapshot)return void new Notice(writerUi('A nota mudou. Insira a navegação novamente.','The note changed. Please retry insertion.'));
  const path=f=>f?'[['+f.path.replace(/\.md$/i,'')+']]':'';
  const source='\n~~~longform-nav\nmode: manual\nprevious: '+JSON.stringify(path(previous))+'\nnext: '+JSON.stringify(path(next))+'\n~~~\n';
  editor.replaceRange(source,from,to);
 }
 async jumpToChapter(){
  const active=this.plugin.app.workspace.getActiveFile();
  if(!(active instanceof TFile))return void new Notice(writerUi('Abra um capítulo Markdown.','Open a Markdown chapter.'));
  const match=await writerBookNavFindProjectAsync(this.plugin.app,active.path,this.plugin.settings.lastLongformProject);
  if(!match)return void new Notice(writerUi('Capítulo fora de um projeto Longform.','Chapter is outside a Longform project.'));
  const files=match.items.filter(x=>x.file&&x.path);
  const app=this.plugin.app;
  class Picker extends FuzzySuggestModal{
   constructor(){super(app);this.setPlaceholder(writerUi('Pesquisar capítulo ou subcapítulo','Search chapter or subchapter'));}
   getItems(){return files;}
   getItemText(item){return '  '.repeat(Math.min(item.indent,5))+item.title;}
   onChooseItem(item){void app.workspace.getLeaf(false).openFile(item.file);}
  }
  new Picker().open();
 }
 registerAutomatic(){
  const plugin=this.plugin,owner=this;
  const effect=require('@codemirror/state').StateEffect.define();
  const refreshEditors=()=>{
   for(const leaf of plugin.app.workspace.getLeavesOfType('markdown')||[]){
    try{leaf.view?.editor?.cm?.dispatch({effects:effect.of(null)});}catch(_){}
   }
   void updatePreview();
  };
  const updatePreview=async()=>{
   for(const leaf of plugin.app.workspace.getLeavesOfType('markdown')||[]){
    const view=leaf.view,file=view?.file;
    const root=view?.previewMode?.containerEl?.querySelector?.('.markdown-preview-sizer');
    if(!root)continue;
    root.querySelectorAll('.writer-v6-booknav-preview-auto').forEach(x=>x.remove());
    if(!(file instanceof TFile)||!owner.cfg.enabled)continue;
    const match=await writerBookNavFindProjectAsync(plugin.app,file.path,plugin.settings.lastLongformProject);
    if(!root.isConnected||!writerBookNavAutoAllowed(plugin,match))continue;
    const noteText=view?.editor?.getValue?.()||await plugin.app.vault.cachedRead(file);
    if(writerBookNavHasSourceBlock(noteText))continue;
    const buttons=writerBookNavButtons(writerBookNavTargets(match.items,file.path),owner.cfg);
    if(!buttons.length)continue;
    const holder=root.createDiv({cls:'writer-v6-booknav-preview-auto'});
    writerBookNavRenderButtons(holder,plugin.app,buttons,{automatic:true});
   }
  };
  plugin.registerEditorExtension(ViewPlugin.fromClass(class{
   constructor(view){this.view=view;this.key='';this.buttons=[];this.decorations=Decoration.none;this.rebuild();}
   getPath(){
    for(const leaf of plugin.app.workspace.getLeavesOfType('markdown')||[]){
     if(leaf.view?.editor?.cm===this.view)return leaf.view?.file?.path||'';
    }
    return '';
   }
   rebuild(){
    const path=this.getPath(),source=this.view.state.doc.toString();
    if(!path||!owner.cfg.enabled||writerBookNavHasSourceBlock(source)){
     this.key='';this.buttons=[];this.decorations=Decoration.none;return;
    }
    const key=path+'|'+source.length+'|'+writerBookNavHasSourceBlock(source)+'|'+String(owner.cfg.auto);
    if(key===this.key)return;
    this.key=key;
    const current=key;
    void writerBookNavFindProjectAsync(plugin.app,path,plugin.settings.lastLongformProject).then(match=>{
     if(current!==this.key)return;
     const targets=match&&writerBookNavAutoAllowed(plugin,match)?writerBookNavTargets(match.items,path):null;
     this.buttons=targets?writerBookNavButtons(targets,owner.cfg):[];
     try{this.view.dispatch({effects:effect.of(null)});}catch(_){}
    }).catch(e=>console.warn('[Basic AI] Automatic navigation:',e));
   }
   update(update){
    if(update.docChanged||update.transactions.some(tr=>tr.effects.some(e=>e.is(effect))))this.rebuild();
    this.decorations=this.buttons.length&&!writerBookNavHasSourceBlock(update.view.state.doc.toString())
     ?Decoration.set([Decoration.widget({widget:new WriterBookNavWidget(plugin,this.buttons),side:1,block:true}).range(update.view.state.doc.length)])
     :Decoration.none;
   }
  },{decorations:instance=>instance.decorations}));
  for(const name of ['file-open','layout-change','active-leaf-change']){
   plugin.registerEvent(plugin.app.workspace.on(name,()=>setTimeout(refreshEditors,120)));
  }
  if(typeof plugin.app.metadataCache?.on==='function')plugin.registerEvent(plugin.app.metadataCache.on('changed',()=>setTimeout(refreshEditors,150)));
  plugin.registerEvent(plugin.app.vault.on('rename',()=>setTimeout(refreshEditors,150)));
  plugin.registerEvent(plugin.app.vault.on('modify',file=>{
   if(file?.extension==='md'&&file.path===plugin.settings.lastLongformProject)setTimeout(refreshEditors,150);
  }));
  setTimeout(refreshEditors,220);
  this.refreshAutomatic=refreshEditors;
 }
 renderSettings(panel){
  const root=panel.createDiv({cls:'writer-v6-settings-clean'});
  const section=root.createDiv({cls:'writer-v6-settings-section'});
  section.createEl('h3',{text:writerUi('Navegação Longform','Longform navigation')});
  section.createEl('p',{cls:'dictionary-muted',text:writerUi('Use ~~~longform-nav. A navegação acompanha a ordem real dos capítulos e subcapítulos do índice, inclusive em projetos cuja lista só apareça após carregar o YAML.','Insert ~~~longform-nav. Navigation follows the actual chapter and subchapter order, including projects whose scene list requires loading the YAML.')});
  for(const [key,pt,en] of [['enabled','Ativar navegação','Enable navigation'],['showMain','Exibir capítulos principais','Show main chapters'],['showSub','Exibir subcapítulos','Show subchapters'],['auto','Adicionar automaticamente ao fim das notas','Automatically add to note ends']])
   new Setting(section).setName(writerUi(pt,en)).addToggle(toggle=>toggle.setValue(this.cfg[key]!==false).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();this.refreshAutomatic?.();}));
 }
}
