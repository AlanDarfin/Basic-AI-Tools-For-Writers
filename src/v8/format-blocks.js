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
function writerV8RenderTabs(plugin,source,element,ctx){
 const tabs=writerV8SplitTabs(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-tabs'});
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
   void writerV8Markdown(plugin,ctx,target,tabs[index].content)
    .catch(error=>{console.warn('[Basic AI] tab render failed:',error);target.createEl('p',{text:writerUi('Não foi possível renderizar esta aba.','This tab could not be rendered.')});});
  }
 };
 tabs.forEach((tab,i)=>{
  const button=nav.createEl('button',{text:tab.title,attr:{type:'button',role:'tab',id:id+'-button-'+i,'aria-controls':id+'-panel-'+i,'aria-selected':'false'}});
  const panel=pane.createDiv({cls:'writer-v8-tab-panel',attr:{role:'tabpanel',id:id+'-panel-'+i,'aria-labelledby':id+'-button-'+i}});
  buttons.push(button);panels.push(panel);
  button.addEventListener('click',()=>select(i));
  button.addEventListener('keydown',event=>{
   const keys={ArrowRight:1,ArrowLeft:-1,Home:-i,End:tabs.length-1-i};
   if(!Object.prototype.hasOwnProperty.call(keys,event.key))return;
   event.preventDefault();
   const next=(i+keys[event.key]+tabs.length)%tabs.length;
   select(next);buttons[next].focus();
  });
 });
 select(0);
}
function writerV8RenderCard(plugin,source,element,ctx,kind){
 const parsed=writerV8ReadCard(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-'+kind});
 if(!parsed){root.createEl('p',{text:writerUi('Bloco muito grande.','Block too large.')});return;}
 const {fields,body}=parsed,title=fields.title||fields.name||fields.nome||'';
 const heading=root.createDiv({cls:'writer-v8-card-heading'});
 const url=writerV8ImagePath(plugin.app,fields.image||fields.avatar||fields.cover,ctx.sourcePath);
 if(url)heading.createEl('img',{cls:'writer-v8-card-image',attr:{src:url,alt:title||writerUi('Ilustração','Illustration'),loading:'lazy'}});
 else if(kind==='avatar')heading.createSpan({cls:'writer-v8-avatar-placeholder',text:(title||'?').slice(0,1).toUpperCase()});
 const labels=heading.createDiv({cls:'writer-v8-card-labels'});
 if(title)labels.createEl('strong',{text:title});
 const subtitle=fields.subtitle||fields.role||fields.type||fields.tipo||'';
 if(subtitle)labels.createEl('span',{text:subtitle,cls:'writer-v8-card-subtitle'});
 if(kind==='wiki'){
  const meta=Object.entries(fields).filter(([key,value])=>value&&!['title','name','nome','type','tipo','subtitle','role','image','avatar','cover'].includes(key)).slice(0,12);
  if(meta.length){
   const dl=root.createEl('dl',{cls:'writer-v8-wiki-meta'});
   for(const [key,value] of meta){dl.createEl('dt',{text:key.replace(/[_-]/g,' ')});dl.createEl('dd',{text:value});}
  }
 }
 if(body){
  const content=root.createDiv({cls:'writer-v8-card-content'});
  void writerV8Markdown(plugin,ctx,content,body)
   .catch(error=>{console.warn('[Basic AI] card render failed:',error);content.createEl('p',{text:writerUi('Não foi possível renderizar o conteúdo.','Content could not be rendered.')});});
 }
}
function writerV8RegisterBlocks(plugin,enabled){
 for(const type of ['writer-tabs','writer-avatar','writer-wiki']){
  plugin.registerMarkdownCodeBlockProcessor(type,(source,element,ctx)=>{
   if(!enabled()){element.createEl('pre',{text:source});return;}
   if(type==='writer-tabs')writerV8RenderTabs(plugin,source,element,ctx);
   else writerV8RenderCard(plugin,source,element,ctx,type==='writer-avatar'?'avatar':'wiki');
  });
 }
}
