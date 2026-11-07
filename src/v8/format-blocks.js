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
 writerV131RegisterWritingBlocks(plugin,enabled);
}

/* Local writing helpers and story blocks. No external services or note indexing. */
const WRITER_V131_STORY_BLOCKS={
 'scene-card':{pt:'Ficha de cena',en:'Scene card',icon:'clapperboard'},
 'character-voice':{pt:'Voz da personagem',en:'Character voice',icon:'quote'},
 'beat-sheet':{pt:'Batidas da história',en:'Story beats',icon:'list-ordered'},
 'editor-note':{pt:'Nota de revisão',en:'Editorial note',icon:'pencil-line'}
};
const WRITER_V131_STOPWORDS=new Set(('a ao aos as até com como da das de dela dele do dos e é em entre eu foi há isso la lhe mais mas me meu minha na nas não no nos o os ou para pela pelo por que se sem seu sua um uma uns umas você ele ela eles elas the a an and are as at be been but by for from had has have he her his i if in into is it its me my not of on or our she so than that the their them then there they this to was we were what when where which who will with you your').split(/\s+/));
function writerV131NormalizeWord(word){
 return String(word||'').toLocaleLowerCase().normalize('NFC').replace(/[’]/g,"'");
}
function writerV131WritingAnalysis(input){
 // Analyze a bounded in-memory snapshot; never save or transmit its text.
 const text=String(input||'').slice(0,200000);
 const words=[...text.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)].map(m=>({word:m[0],index:m.index}));
 const counts=new Map(),near=[];
 for(let i=0;i<words.length;i++){
  const item=words[i],key=writerV131NormalizeWord(item.word);
  if(key.length<4||WRITER_V131_STOPWORDS.has(key))continue;
  const entry=counts.get(key)||{word:item.word,count:0,last:-100};
  entry.count++;
  if(i-entry.last<=7&&near.length<20){
   const excerpt=text.slice(Math.max(0,item.index-36),Math.min(text.length,item.index+item.word.length+36)).replace(/\s+/g,' ').trim();
   near.push({word:item.word,distance:i-entry.last,excerpt});
  }
  entry.last=i;counts.set(key,entry);
 }
 const repeated=[...counts.values()].filter(x=>x.count>1)
  .sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,20)
  .map(({word,count})=>({word,count}));
 return {wordCount:words.length,repeated,near,truncated:String(input||'').length>text.length};
}
function writerV131ReviewModal(plugin,text,scope){
 const result=writerV131WritingAnalysis(text),modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Revisão de repetições','Repetition review'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v131-review');
  root.createEl('p',{cls:'setting-item-description',text:scope+' · '+result.wordCount+' '+writerUi('palavras','words')+
   (result.truncated?' · '+writerUi('primeiros 200 mil caracteres','first 200,000 characters'):'')});
  root.createEl('p',{cls:'setting-item-description',text:writerUi('Sugestões locais: nomes e repetições intencionais também podem aparecer. Nenhuma alteração é feita na nota.','Local suggestions: names and intentional repetition may appear. Your note is not changed.')});
  root.createEl('h4',{text:writerUi('Palavras repetidas','Repeated words')});
  if(!result.repeated.length)root.createEl('p',{text:writerUi('Nenhuma repetição relevante encontrada.','No relevant repetitions found.')});
  else{
   const list=root.createEl('ul',{cls:'writer-v131-review-frequency'});
   for(const item of result.repeated)list.createEl('li',{text:item.word+' · '+item.count});
  }
  root.createEl('h4',{text:writerUi('Repetições próximas','Nearby repetitions')});
  if(!result.near.length)root.createEl('p',{text:writerUi('Nenhuma repetição próxima encontrada.','No nearby repetitions found.')});
  else{
   const list=root.createEl('ul',{cls:'writer-v131-review-near'});
   for(const item of result.near){const li=list.createEl('li');li.createEl('strong',{text:item.word});
    li.createEl('span',{text:' · …'+item.excerpt+'…'});}
  }
 };
 modal.onClose=()=>modal.contentEl.empty();modal.open();
}
function writerV131BeatLines(text){
 return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,80).map((line,i)=>{
  line=line.replace(/^[-*]\s+/,'');const separator=/\s+\|\s+/.exec(line);
  return {title:separator?line.slice(0,separator.index).trim().slice(0,100):String(i+1),
   body:(separator?line.slice(separator.index+separator[0].length):line).trim()};
 });
}
function writerV131BlockTemplate(kind,selection=''){
 const selected=String(selection||'');
 const templates={
  'scene-card':'title: '+writerUi('Nome da cena','Scene title')+'\npov: '+writerUi('Ponto de vista','Point of view')+'\nlocation: '+writerUi('Local','Location')+'\ngoal: '+writerUi('Objetivo','Goal')+'\nconflict: '+writerUi('Conflito','Conflict')+'\noutcome: '+writerUi('Resultado','Outcome')+'\n---\n',
  'character-voice':'name: '+writerUi('Personagem','Character')+'\ntone: '+writerUi('Tom','Tone')+'\n---\n',
  'beat-sheet':'title: '+writerUi('Batidas da história','Story beats')+'\n---\n',
  'editor-note':'title: '+writerUi('Nota de revisão','Editorial note')+'\nstatus: '+writerUi('Pendente','Pending')+'\n---\n'
 };
 const defaults={
  'scene-card':writerUi('Descreva a cena em Markdown.','Describe the scene in Markdown.'),
  'character-voice':writerUi('Escreva uma fala ou pensamento.','Write a line or thought.'),
  'beat-sheet':writerUi('Abertura | Apresente a situação.\nVirada | Algo muda.\nDesfecho | Mostre a consequência.','Opening | Set the scene.\nTurn | Something changes.\nOutcome | Show the consequence.'),
  'editor-note':writerUi('O que precisa de atenção?','What needs attention?')
 };
 if(!templates[kind])return '';
 const body=templates[kind]+(selected.length?selected:defaults[kind]);
 let longest=2;
 for(const match of body.matchAll(/`+/g))longest=Math.max(longest,match[0].length);
 const fence='`'.repeat(longest+1);
 return '\n'+fence+kind+'\n'+body+'\n'+fence+'\n';
}
function writerV131RenderStoryBlock(plugin,source,element,ctx,type){
 const cfg=WRITER_V131_STORY_BLOCKS[type],parsed=writerV8ReadCard(source);
 const root=element.createDiv({cls:'writer-v131-story-block writer-v131-'+type});
 if(!parsed){root.createEl('p',{text:writerUi('Bloco muito grande.','Block too large.')});return;}
 const {fields,body}=parsed,header=root.createDiv({cls:'writer-v131-story-header'});
 const symbol=header.createSpan({cls:'writer-v131-story-icon',attr:{'aria-hidden':'true'}});
 require('obsidian').setIcon?.(symbol,cfg.icon);
 const name=fields.title||fields.name||fields.nome||writerUi(cfg.pt,cfg.en);
 header.createEl('strong',{text:name});
 const edit=header.createEl('button',{cls:'writer-v131-story-edit',text:writerUi('Editar','Edit'),attr:{type:'button','aria-label':writerUi('Editar bloco','Edit block')+': '+name}});
 edit.addEventListener('click',()=>writerV8InlineEditor(plugin,ctx,root,element,type,source,source,value=>value,
  next=>writerV131RenderStoryBlock(plugin,next,element,ctx,type)));
 const metaNames=type==='scene-card'?[
  ['pov','Ponto de vista','Point of view'],['location','Local','Location'],['goal','Objetivo','Goal'],
  ['conflict','Conflito','Conflict'],['outcome','Resultado','Outcome']]:
  type==='character-voice'?[['tone','Tom','Tone']]:type==='editor-note'?[['status','Estado','Status']]:[];
 const visible=metaNames.filter(([key])=>fields[key]);
 if(visible.length){const list=root.createEl('dl',{cls:'writer-v131-story-meta'});
  for(const [key,pt,en] of visible){list.createEl('dt',{text:writerUi(pt,en)});list.createEl('dd',{text:fields[key]});}}
 const content=root.createDiv({cls:'writer-v131-story-content'});
 const render=(parent,markdown)=>{if(markdown)void writerV8Markdown(plugin,ctx,parent,markdown).catch(()=>parent.createEl('p',{text:markdown}));};
 if(type==='beat-sheet'){
  const beats=writerV131BeatLines(body),list=content.createEl('ol',{cls:'writer-v131-beats'});
  for(const beat of beats){const li=list.createEl('li');li.createEl('strong',{text:beat.title});render(li.createDiv(),beat.body);}
 }else render(content,body);
}
function writerV131RegisterWritingBlocks(plugin,enabled){
 for(const [type,cfg] of Object.entries(WRITER_V131_STORY_BLOCKS)){
  plugin.registerMarkdownCodeBlockProcessor(type,(source,element,ctx)=>{
   if(!enabled()){element.createEl('pre',{text:source});return;}
   writerV131RenderStoryBlock(plugin,source,element,ctx,type);
  });
  plugin.addCommand?.({id:'v131-insert-'+type,name:writerUi('Inserir: '+cfg.pt,'Insert: '+cfg.en),editorCallback:editor=>{
   if(!enabled()){new Notice(writerUi('Ative os blocos interativos nas configurações.','Enable interactive blocks in settings.'));return;}
   const selection=editor.getSelection();
   if(selection.length>WRITER_V8_BLOCK_MAX-600){new Notice(writerUi('Seleção grande demais para um bloco.','Selection is too large for a block.'));return;}
   editor.replaceSelection(writerV131BlockTemplate(type,selection));
  }});
 }
 plugin.addCommand?.({id:'v131-review-repetitions',name:writerUi('Escrita: analisar repetições','Writing: review repetitions'),editorCallback:editor=>{
  const selection=editor.getSelection(),content=selection||editor.getValue();
  if(!content.trim()){new Notice(writerUi('Não há texto para analisar.','No text to review.'));return;}
  writerV131ReviewModal(plugin,content,selection?writerUi('Seleção','Selection'):writerUi('Nota atual','Current note'));
 }});
}
