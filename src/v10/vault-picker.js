'use strict';
/* Reusable fuzzy vault file/folder pickers. Never create or move vault files. */
function writerV109VaultItems(plugin,kind='both'){
 const all=plugin.app.vault.getAllLoadedFiles?.()||[
  ...(plugin.app.vault.getMarkdownFiles?.()||[]),
  ...(plugin.app.vault.getAllFolders?.(true)||[])
 ];
 const seen=new Set(),items=[];
 for(const file of all){
  if(!file||typeof file.path!=='string'||seen.has(file.path))continue;
  const folder=file instanceof TFolder;
  if(kind==='folder'&&!folder||kind==='note'&&(!(file instanceof TFile)||file.extension!=='md'))continue;
  if(kind==='file'&&folder)continue;
  if(!file.path||file.path==='/')continue;
  seen.add(file.path);items.push(file);
 }
 return items.sort((a,b)=>a.path.localeCompare(b.path,undefined,{sensitivity:'base'})).slice(0,12000);
}
function writerV109FuzzyScore(candidate,query){
 const text=String(candidate||'').toLocaleLowerCase();
 const term=String(query||'').trim().toLocaleLowerCase();
 if(!term)return 1;
 if(text===term)return 1000;
 if(text.startsWith(term))return 600-term.length/100;
 const base=text.split('/').pop()||text;
 if(base.startsWith(term))return 500-term.length/100;
 const at=text.indexOf(term);
 if(at>=0)return 350-at*.1;
 let cursor=0,penalty=0;
 for(const char of term){const pos=text.indexOf(char,cursor);if(pos<0)return -1;penalty+=pos-cursor;cursor=pos+1;}
 return Math.max(1,200-penalty-text.length/20);
}
function writerV109FuzzyPaths(items,query,max=12){
 return items.map(item=>({item,score:writerV109FuzzyScore(item.path,query)}))
  .filter(row=>row.score>=0).sort((a,b)=>b.score-a.score||a.item.path.localeCompare(b.item.path))
  .slice(0,max).map(row=>row.item);
}
function writerV109PickVaultPath(plugin,{kind='both',onChoose,placeholder}={}){
 const items=writerV109VaultItems(plugin,kind);
 const Suggest=require('obsidian').FuzzySuggestModal;
 if(typeof Suggest==='function'){
  const picker=new (class extends Suggest{
   getItems(){return items;}
   getItemText(item){return item.path;}
   onChooseItem(item){onChoose?.(item);}
  })(plugin.app);
  picker.setPlaceholder?.(placeholder||writerUi('Pesquisar notas ou pastas…','Search files or folders…'));
  picker.open();return picker;
 }
 // Safe fallback for rare Obsidian API variants.
 const modal=new Modal(plugin.app);
 modal.setTitle(placeholder||writerUi('Selecionar do cofre','Select vault item'));
 modal.onOpen=()=>{
  const input=modal.contentEl.createEl('input',{attr:{type:'search',placeholder:writerUi('Nome ou caminho…','Name or path…')}});
  const results=modal.contentEl.createDiv({cls:'writer-v109-pick-results'});
  const draw=()=>{results.empty();for(const item of writerV109FuzzyPaths(items,input.value,30)){
   results.createEl('button',{text:item.path}).addEventListener('click',()=>{onChoose?.(item);modal.close();});
  }};
  input.addEventListener('input',draw);draw();input.focus();
 };
 modal.open();return modal;
}
function writerV109AttachPathAutocomplete(plugin,input,{kind='both',onChoose}={}){
 if(!input||!input.parentElement)return;
 const container=input.parentElement;container.classList.add('writer-v109-path-holder');
 const dropdown=container.createDiv({cls:'writer-v109-path-options'});
 dropdown.hidden=true;const items=()=>writerV109VaultItems(plugin,kind);
 let matched=[],selected=0;
 input.setAttribute('role','combobox');
 input.setAttribute('aria-autocomplete','list');
 input.setAttribute('aria-expanded','false');
 const close=()=>{dropdown.hidden=true;input.setAttribute('aria-expanded','false');};
 const choose=item=>{input.value=item.path;input.dispatchEvent(new Event('input',{bubbles:true}));onChoose?.(item);close();};
 const render=()=>{
  const query=input.value.trim();dropdown.empty();
  if(!query){close();return;}
  matched=writerV109FuzzyPaths(items(),query,8);selected=0;
  for(const [i,item] of matched.entries()){
   const button=dropdown.createEl('button',{cls:'writer-v109-path-option',attr:{type:'button',role:'option'}});
   const icon=button.createSpan({cls:'writer-v109-path-icon'});
   require('obsidian').setIcon?.(icon,item instanceof TFolder?'folder':'file-text');
   button.createSpan({cls:'writer-v109-path-title',text:item.name||item.basename||item.path});
   button.createSpan({cls:'writer-v109-path-dir',text:item.path});
   button.addEventListener('mousedown',event=>event.preventDefault());
   button.addEventListener('click',()=>choose(item));
   button.classList.toggle('is-selected',i===selected);
  }
  dropdown.hidden=!matched.length;
  input.setAttribute('aria-expanded',String(matched.length>0));
 };
 input.addEventListener('input',render);
 input.addEventListener('keydown',event=>{
  if(dropdown.hidden)return;
  if(event.key==='Escape'){close();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();selected=(selected+(event.key==='ArrowDown'?1:-1)+matched.length)%matched.length;
   dropdown.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('is-selected',i===selected));
  }else if(event.key==='Enter'&&matched[selected]){event.preventDefault();choose(matched[selected]);}
 });
 input.addEventListener('blur',()=>setTimeout(close,180));
 return {render,close};
}
function writerV109AddVaultPathSetting(plugin,parent,{pt,en,kind='both',value='',onChange}){
 const setting=new Setting(parent).setName(writerUi(pt,en));
 setting.addText(control=>{
  control.setValue(String(value||'')).onChange(path=>onChange?.(path));
  writerV109AttachPathAutocomplete(plugin,control.inputEl,{kind,onChoose:item=>onChange?.(item.path)});
 });
 setting.addButton(button=>button.setIcon('search').setTooltip(writerUi('Buscar no cofre','Search vault'))
  .onClick(()=>writerV109PickVaultPath(plugin,{kind,onChoose:item=>{
   onChange?.(item.path);
   const input=setting.controlEl.querySelector('input');if(input)input.value=item.path;
  }})));
 return setting;
}

/* Horizontal tab overflow: hidden native sliders and only show edge fades
 * when there is actually more content in that direction. */
function writerV109RegisterScrollHints(plugin){
 const selector='.dictionary-settings-tabs,.dictionary-settings-subtabs,.writer-project-tabs,.writer-project-nav-groups,.writer-tools-v3-tabs,.writer-tool-tabs,.writer-v7-rc-structure-tabs,.writer-v9-space-side-nav';
 const doc=plugin.app.workspace.containerEl?.ownerDocument||(typeof document!=='undefined'?document:null);
 if(!doc)return;
 let timer=null;
 const updateElement=el=>{
  if(!el?.isConnected)return;
  const max=Math.max(0,el.scrollWidth-el.clientWidth);
  const left=el.scrollLeft;
  el.classList.add('writer-v109-hscroll');
  el.dataset.writerScroll=max<=3?'none':left<=2?'start':left>=max-2?'end':'middle';
 };
 const scan=()=>{
  // Keep the old package ID stable, but never show the long legacy brand in UI.
  for(const label of doc.querySelectorAll('.side-dock-ribbon-action,.community-plugin-item,.vertical-tab-nav-item,.plugin-item')){
   for(const attr of ['title','aria-label']){
    const original=label.getAttribute?.(attr)||'';
    if(/^(?:Basic AI Tool for Writers|Basic AI)(?:: .*)?$/i.test(original))
     label.setAttribute(attr,original.replace(/^Basic AI Tool for Writers|^Basic AI/i,'basic'));
   }
   if(label.children?.length===0&&/^(Basic AI Tool for Writers|Basic AI)$/i.test(label.textContent?.trim()||''))
    label.textContent='basic';
  }
  const elements=doc.querySelectorAll(selector);
  for(const el of Array.from(elements).slice(0,150))updateElement(el);
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(scan,100);};
 plugin.registerDomEvent?.(doc,'scroll',event=>{
  const el=event.target;
  if(el?.matches?.(selector))updateElement(el);
 },true);
 let observer=null;
 const root=plugin.app.workspace.containerEl;
 if(root&&typeof MutationObserver!=='undefined'){
  observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
 }
 plugin.registerEvent?.(plugin.app.workspace.on('layout-change',schedule));
 if(typeof ResizeObserver!=='undefined'){
  const resize=new ResizeObserver(schedule);if(root)resize.observe(root);
  plugin.register?.(()=>resize.disconnect());
 }
 plugin.app.workspace.onLayoutReady?.(schedule);
 plugin.register?.(()=>{clearTimeout(timer);observer?.disconnect();});
 schedule();
}
