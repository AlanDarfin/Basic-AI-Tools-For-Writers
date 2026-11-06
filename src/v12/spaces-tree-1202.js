'use strict';
/* Basic 12.0.2: native File Explorer projection of the current Space.
 * No file moves, no cloned tree, no hidden state shared between Spaces. */
function writerV122Root(plugin){
 const space=typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
 if(!space||space.rootExplorer===false||!space.folder)return '';
 const path=String(space.folder).replace(/^\/+|\/+$/g,'');
 const folder=plugin.app.vault.getAbstractFileByPath?.(path);
 return folder&&folder.children?path:'';
}
function writerV122TreeBranch(root,path){
 if(!root||!path)return 'all';
 if(path===root)return 'root';
 if(root.startsWith(path+'/'))return 'ancestor';
 if(path.startsWith(root+'/'))return 'child';
 return 'outside';
}
function writerV122ScopedHidden(plugin,path){
 const space=typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
 if(!space||!path||plugin._writerV122RevealSpaceHidden)return false;
 return (space.hiddenPaths||[]).some(item=>item===path||path.startsWith(item+'/'));
}
function writerV122SpaceConcealed(plugin,path){
 return writerV122TreeBranch(writerV122Root(plugin),path)==='outside'||
  writerV122ScopedHidden(plugin,path);
}
function writerV122ExpandPath(view,root){
 if(!view||!root)return;
 const folder=view.app?.vault?.getAbstractFileByPath?.(root);
 // Obsidian's native reveal method is preferred and expands intermediate
 // folders without mutating their physical positions.
 if(folder&&typeof view.revealInFolder==='function'){
  try{const result=view.revealInFolder(folder);result?.catch?.(error=>
    console.debug('[Basic] Space root reveal not available:',error));}catch(_){}
 }
 const names=root.split('/'),parts=[];
 for(const segment of names){
  parts.push(segment);
  const path=parts.join('/');
  const entry=view.fileItems?.[path];
  try{if(entry?.collapsed===true&&typeof entry.setCollapsed==='function')entry.setCollapsed(false);}catch(_){}
 }
}
function writerV122TreeDecorate(plugin,leaf){
 const host=leaf?.view?.containerEl;
 if(!host)return;
 const root=writerV122Root(plugin);
 const previous=host.dataset.writerV122Root||'';
 host.classList.toggle('writer-v122-rooted-explorer',Boolean(root));
 if(root)host.dataset.writerV122Root=root;else delete host.dataset.writerV122Root;
 for(const node of host.querySelectorAll('.nav-folder, .tree-item')){
  const path=writerV91FlexNodePath(node,leaf.view);
  const branch=writerV122TreeBranch(root,path);
  node.classList.toggle('writer-v122-root-ancestor',branch==='ancestor');
  node.classList.toggle('writer-v122-root-folder',branch==='root');
 }
 if(root&&root!==previous)writerV122ExpandPath(leaf.view,root);
}
function writerV122SpaceRootRegister(plugin){
 plugin.addCommand({
  id:'v122-space-reveal-hidden',
  name:writerUi('Spaces: mostrar ou ocultar itens escondidos temporariamente','Spaces: temporarily show or hide hidden items'),
  callback:()=>{
   if(!writerV9215ActiveSpace(plugin)){
    new Notice(writerUi('Ative um Space primeiro.','Select a Space first.'));return;
   }
   plugin._writerV122RevealSpaceHidden=!plugin._writerV122RevealSpaceHidden;
   plugin.writerV91FlexRefresh?.();
   new Notice(plugin._writerV122RevealSpaceHidden?
    writerUi('Exibindo itens ocultos temporariamente.','Temporarily revealing hidden items.'):
    writerUi('Ocultação do Space restaurada.','Space hiding restored.'));
  }
 });
 plugin.register?.(()=>{
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
   const host=leaf.view?.containerEl;
   host?.classList.remove('writer-v122-rooted-explorer');
   if(host)delete host.dataset.writerV122Root;
   for(const node of host?.querySelectorAll('.writer-v122-root-ancestor,.writer-v122-root-folder')||[])
    node.classList.remove('writer-v122-root-ancestor','writer-v122-root-folder');
  }
 });
}
