'use strict';
/* v8: local, accessible Markdown presentation blocks. Source notes stay ordinary Markdown. */
const WRITER_V8_BLOCK_MAX=32000;
let writerV8TabSerial=0;
function writerV8SplitTabs(source){
 const lines=String(source||'').slice(0,WRITER_V8_BLOCK_MAX+1).split(/\r?\n/);
 if(String(source||'').length>WRITER_V8_BLOCK_MAX)return [];
 const tabs=[];let current=null;
 for(const line of lines){
  const marker=/^===\s+(.{1,80})\s*$/.exec(line);
  if(marker){
   if(tabs.length>=12)return [];
   current={title:marker[1].trim(),content:[]};tabs.push(current);
  }else if(current)current.content.push(line);
 }
 return tabs.map(tab=>({title:tab.title,content:tab.content.join('\n').trim()})).filter(tab=>tab.title);
}
function writerV8ReadCard(source){
 const input=String(source||'');
 if(input.length>WRITER_V8_BLOCK_MAX)return null;
 const lines=input.split(/\r?\n/),fields={},body=[];
 let header=true;
 for(const line of lines){
  if(header&&/^---\s*$/.test(line)){header=false;continue;}
  const match=header&&/^([a-z][a-z0-9_-]{0,35}):\s*(.*)$/i.exec(line);
  if(match){fields[match[1].toLowerCase()]=match[2].trim().slice(0,500);continue;}
  header=false;body.push(line);
 }
 return {fields,body:body.join('\n').trim()};
}
function writerV8ImagePath(app,raw,sourcePath){
 let link=String(raw||'').trim();
 if(!link||/[\n\r]/.test(link)||/^(?:https?:|file:|data:|javascript:)/i.test(link))return '';
 link=link.replace(/^!\[\[/,'').replace(/^\[\[/,'').replace(/\]\]$/,'').split('|')[0].trim();
 if(!link)return '';
 const file=app.metadataCache?.getFirstLinkpathDest?.(link,sourcePath||'')
  ||app.vault.getAbstractFileByPath?.(link);
 if(!(file instanceof TFile)||!/^(png|jpe?g|webp|gif|avif|svg)$/i.test(file.extension))return '';
 return app.vault.getResourcePath?.(file)||'';
}
async function writerV8Markdown(plugin,ctx,element,value){
 if(!value)return;
 await MarkdownRenderer.render(plugin.app,value,element,ctx.sourcePath||'',plugin);
}
function writerV8RenderTabs(plugin,source,element,ctx,fenceType='writer-tabs'){
 const tabs=writerV8SplitTabs(source);
 const layout=writerV8TabLayout(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-tabs'+(layout==='top'?'':' writer-v8-tabs-side')+(layout==='right'?' writer-v8-tabs-right':'')});
 const rerender=next=>writerV8RenderTabs(plugin,next,element,ctx,fenceType);
 if(!tabs.length){root.createEl('p',{text:writerUi('Use === Título para iniciar cada aba (máximo 12).','Use === Title to start each tab (12 maximum).')});return;}
 const nav=root.createDiv({cls:'writer-v8-tab-list',attr:{role:'tablist','aria-label':writerUi('Abas do conteúdo','Content tabs')}});
 const pane=root.createDiv({cls:'writer-v8-tab-panels'});
 const id='writer-v8-tab-'+(++writerV8TabSerial);
 const buttons=[],panels=[];
 const select=index=>{
  for(let i=0;i<tabs.length;i++){
   const active=i===index;
   buttons[i].setAttribute('aria-selected',String(active));
   buttons[i].tabIndex=active?0:-1;
   buttons[i].classList.toggle('is-active',active);
   panels[i].hidden=!active;
  }
  const target=panels[index];
  if(!target.dataset.loaded){
   target.dataset.loaded='1';
   const content=target.createDiv({cls:'writer-v8-tab-content',attr:{tabindex:'0','aria-label':writerUi('Clique para editar a aba','Click to edit tab')}});
   if(!tabs[index].content)content.createEl('p',{cls:'writer-v8-edit-placeholder',text:writerUi('Toque aqui para escrever…','Tap here to write…')});
   else void writerV8Markdown(plugin,ctx,content,tabs[index].content)
    .catch(error=>{console.warn('[Basic AI] tab render failed:',error);content.createEl('p',{text:writerUi('Não foi possível renderizar esta aba.','This tab could not be rendered.')});});
   const edit=event=>{
    if(event?.target?.closest?.('a,button,input,textarea,select'))return;
    if(target.querySelector('.writer-v8-inline-editor'))return;
    writerV8InlineEditor(plugin,ctx,target,element,fenceType,source,tabs[index].content,
     value=>writerV8ReplaceTab(source,index,value),rerender);
   };
   content.addEventListener('click',edit);
   content.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();edit();}});
  }
 };
 tabs.forEach((tab,i)=>{
  const button=nav.createEl('button',{text:tab.title,attr:{type:'button',role:'tab',id:id+'-button-'+i,'aria-controls':id+'-panel-'+i,'aria-selected':'false'}});
  const panel=pane.createDiv({cls:'writer-v8-tab-panel',attr:{role:'tabpanel',id:id+'-panel-'+i,'aria-labelledby':id+'-button-'+i}});
  buttons.push(button);panels.push(panel);
  button.addEventListener('click',()=>select(i));
  button.addEventListener('keydown',event=>{
   const keys={ArrowRight:1,ArrowLeft:-1,ArrowUp:-1,ArrowDown:1,Home:-i,End:tabs.length-1-i};
   if(!Object.prototype.hasOwnProperty.call(keys,event.key))return;
   event.preventDefault();
   const next=(i+keys[event.key]+tabs.length)%tabs.length;
   select(next);buttons[next].focus();
  });
 });
 const plus=nav.createEl('button',{text:'+',cls:'writer-v8-tab-add',attr:{type:'button','aria-label':writerUi('Adicionar nova aba','Add new tab'),title:writerUi('Adicionar nova aba','Add new tab')}});
 plus.disabled=tabs.length>=12;
 plus.addEventListener('click',()=>{
  if(nav.querySelector('.writer-v8-tab-new-title'))return;
  const input=nav.createEl('input',{cls:'writer-v8-tab-new-title',attr:{placeholder:writerUi('Nome da aba…','Tab title…'),'aria-label':writerUi('Nome da nova aba','New tab title')}});
  input.maxLength=80;input.focus();
  const add=async()=>{
   const title=input.value.trim().replace(/[\r\n]/g,' ');
   if(!title)return;
   const next=source.replace(/\n+$/,'')+'\n=== '+title+'\n';
   try{
    await writerV8CommitFenced(plugin,ctx,element,fenceType,source,next);
    if(element.isConnected){element.empty();rerender(next);}
   }catch(error){new Notice(writerUi('Erro ao criar aba: ','Unable to add tab: ')+String(error.message||error));}
  };
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();void add();}
   if(event.key==='Escape'){event.preventDefault();input.remove();}
  });
  input.addEventListener('blur',()=>{if(!input.value.trim())input.remove();});
 });
 select(0);
}
function writerV8RenderCard(plugin,source,element,ctx,kind,fenceType=kind==='avatar'?'writer-avatar':'writer-wiki'){
 const parsed=writerV8ReadCard(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-'+kind});
 if(!parsed){root.createEl('p',{text:writerUi('Bloco muito grande.','Block too large.')});return;}
 const {fields,body}=parsed,title=fields.title||fields.name||fields.nome||'';
 const layout=String(fields.layout||fields.position||'top').toLowerCase();
 if(kind==='avatar'&&['left','right'].includes(layout))root.classList.add('writer-v8-avatar-side','writer-v8-avatar-'+layout);
 const heading=root.createDiv({cls:'writer-v8-card-heading'});
 const url=writerV8ImagePath(plugin.app,fields.image||fields.avatar||fields.cover,ctx.sourcePath);
 if(url)heading.createEl('img',{cls:'writer-v8-card-image',attr:{src:url,alt:title||writerUi('Ilustração','Illustration'),loading:'lazy'}});
 else if(kind==='avatar')heading.createSpan({cls:'writer-v8-avatar-placeholder',text:(title||'?').slice(0,1).toUpperCase()});
 const labels=heading.createDiv({cls:'writer-v8-card-labels'});
 if(title)labels.createEl('strong',{text:title});
 const subtitle=fields.subtitle||fields.role||fields.type||fields.tipo||'';
 if(subtitle)labels.createEl('span',{text:subtitle,cls:'writer-v8-card-subtitle'});
 if(kind==='wiki'){
  const meta=Object.entries(fields).filter(([key,value])=>value&&!['title','name','nome','type','tipo','subtitle','role','image','avatar','cover','layout','position'].includes(key)).slice(0,12);
  if(meta.length){
   const dl=root.createEl('dl',{cls:'writer-v8-wiki-meta'});
   for(const [key,value] of meta){dl.createEl('dt',{text:key.replace(/[_-]/g,' ')});dl.createEl('dd',{text:value});}
  }
 }
 const content=root.createDiv({cls:'writer-v8-card-content',attr:{tabindex:'0','aria-label':writerUi('Clique para editar descrição','Click to edit description')}});
 if(body)void writerV8Markdown(plugin,ctx,content,body)
  .catch(error=>{console.warn('[Basic AI] card render failed:',error);content.createEl('p',{text:writerUi('Não foi possível renderizar o conteúdo.','Content could not be rendered.')});});
 else content.createEl('p',{cls:'writer-v8-edit-placeholder',text:writerUi('Toque para escrever a descrição…','Tap to write description…')});
 const edit=event=>{
  if(event?.target?.closest?.('a,button,input,textarea,select'))return;
  if(root.querySelector('.writer-v8-inline-editor'))return;
  writerV8InlineEditor(plugin,ctx,root,element,fenceType,source,body,
   value=>source.includes('\n---\n')
    ?source.slice(0,source.indexOf('\n---\n')+5)+value
    :source.trimEnd()+'\n---\n'+value,
   next=>writerV8RenderCard(plugin,next,element,ctx,kind,fenceType));
 };
 content.addEventListener('click',edit);
 content.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();edit();}});
}
function writerV8RegisterBlocks(plugin,enabled){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 for(const type of ['tabs','avatar','wiki','writer-tabs','writer-avatar','writer-wiki']){
  plugin.registerMarkdownCodeBlockProcessor(type,(source,element,ctx)=>{
   if(!enabled()){element.createEl('pre',{text:source});return;}
   const kind=type.replace(/^writer-/,'');
   if(kind==='tabs')writerV8RenderTabs(plugin,source,element,ctx,type);
   else writerV8RenderCard(plugin,source,element,ctx,kind,type);
  });
 }
}
