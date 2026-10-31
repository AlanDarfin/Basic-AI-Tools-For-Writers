'use strict';
/* v6 beta 2: original hierarchical Longform navigation informed by BookNav and Note Chain behavior. */
const WRITER_BOOKNAV_DEFAULTS={enabled:true,showMain:true,showSub:true};
function writerBookNavMerge(settings){
 const old=settings.bookNavigation;
 settings.bookNavigation={...WRITER_BOOKNAV_DEFAULTS,...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})};
 return settings.bookNavigation;
}
function writerBookNavFindSceneFile(index,entry,app){
 const parent=index.file.parent?.path||'',sceneFolder=String(index.meta.sceneFolder||'').replace(/^\/|\/$/g,'');
 const title=String(entry?.title||'').trim();
 if(!title)return null;
 const candidates=[lfPath(parent,sceneFolder,title+'.md'),lfPath(parent,sceneFolder,title),lfPath(parent,title+'.md'),lfPath(parent,title)];
 return candidates.map(p=>app.vault.getAbstractFileByPath(p)).find(x=>x instanceof TFile&&x.extension==='md')||null;
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
function writerBookNavRender(container,app,sourcePath,options){
 const match=writerBookNavFindProject(app,sourcePath,options?.projectPath);
 if(!match)return false;
 const targets=writerBookNavTargets(match.items,sourcePath);
 if(!targets)return false;
 const buttons=writerBookNavButtons(targets,options||{});
 if(!buttons.length)return false;
 const root=container.createDiv({cls:'writer-v6-booknav'});
 root.setAttribute('role','navigation');
 root.setAttribute('aria-label',writerUi('Navegação Longform','Longform navigation'));
 for(const button of buttons){
  const label=button.kind==='main'?
   writerUi(button.direction==='previous'?'Capítulo anterior':'Próximo capítulo',button.direction==='previous'?'Previous chapter':'Next chapter'):
   writerUi(button.direction==='previous'?'Subcapítulo anterior':'Próximo subcapítulo',button.direction==='previous'?'Previous subchapter':'Next subchapter');
  const item=root.createEl('button',{cls:'writer-v6-booknav-item writer-v6-booknav-'+button.direction+' writer-v6-booknav-'+button.kind,attr:{type:'button','aria-label':label+': '+button.target.title}});
  const icon=item.createSpan({cls:'writer-v6-booknav-arrow',text:button.direction==='previous'?'‹':'›'});
  const text=item.createSpan({cls:'writer-v6-booknav-text'});
  text.createSpan({cls:'writer-v6-booknav-label',text:label});
  text.createSpan({cls:'writer-v6-booknav-title',text:button.target.title});
  item.addEventListener('click',()=>{
   const file=app.vault.getAbstractFileByPath(button.target.path);
   if(file instanceof TFile)void app.workspace.getLeaf(false).openFile(file);
   else new Notice(writerUi('Capítulo não encontrado no cofre.','Chapter not found in vault.'));
  });
 }
 return true;
}
class WriterBookNavigation{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.bookNavigation;}
 register(){
  const plugin=this.plugin;
  plugin.registerMarkdownCodeBlockProcessor?.('longform-nav',(_source,el,ctx)=>{
   if(this.cfg.enabled!==true||!writerModuleOn(plugin,'bookNavigation'))return;
   const rendered=writerBookNavRender(el,plugin.app,ctx.sourcePath,{...this.cfg,projectPath:plugin.settings.lastLongformProject});
   if(!rendered)el.createEl('span',{cls:'writer-v6-booknav-empty',text:writerUi('Esta nota não pertence à ordem de cenas de um projeto Longform.','This note is not in a Longform project scene order.')});
  });
  plugin.addCommand({id:'v6-insert-longform-navigation',name:writerUi('Longform: inserir navegação entre capítulos','Longform: insert chapter navigation'),editorCallback:editor=>{
   editor.replaceSelection('\n'+'~~~longform-nav'+'\n'+'~~~'+'\n');
  }});
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Navegação entre capítulos Longform','Longform chapter navigation')});
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Use o bloco de código longform-nav para exibir botões de capítulos e subcapítulos conforme a ordem do índice Longform. Não reorganiza seus arquivos.','Insert a longform-nav code block to show chapter and subchapter buttons based on the Longform index order. No files are rearranged.')});
  for(const [key,pt,en] of [['enabled','Ativar navegação Longform','Enable Longform navigation'],['showMain','Exibir capítulos principais','Show main chapters'],['showSub','Exibir subcapítulos','Show subchapters']])
   new Setting(panel).setName(writerUi(pt,en)).addToggle(toggle=>toggle.setValue(this.cfg[key]!==false).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();}));
 }
}
