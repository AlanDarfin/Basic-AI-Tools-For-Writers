'use strict';
/* v9.5: original timeline renderer; recognizes George-debug's public documented
 * timeline and timeline-labeled formats, without copying the upstream code.
 * Longform's independent project timeline and event store remain unchanged. */
const WRITER_V95_TIMELINE_OPTIONS={
 layout:'vertical',theme:'classic',density:'normal',sort:'source',controls:true,
 line:3,body:2,accent:''
};
const WRITER_V95_TIMELINE_THEMES=['classic','cards','minimal','compact','editorial'];
const WRITER_V95_TIMELINE_ACCENTS={
 'active-color-background-modifier-success':'--background-modifier-success',
 'active-color-background-modifier-error':'--background-modifier-error',
 'active-color-text-accent':'--text-accent',
 'active-color-text-error':'--text-error',
 'active-color-interactive-accent':'--interactive-accent',
 'active-color-interactive-success':'--interactive-success'
};
function writerV95TimelineConfigOption(cfg,key,value){
 const name=String(key).trim().toLowerCase().replace(/_/g,'-');
 const val=String(value).trim().toLowerCase();
 if(['layout','orientation','direction'].includes(name)){
  if(['horizontal','vertical'].includes(val))cfg.layout=val;
 }else if(name==='theme'&&WRITER_V95_TIMELINE_THEMES.includes(val))cfg.theme=val;
 else if(name==='density'&&['normal','compact','comfortable'].includes(val))cfg.density=val;
 else if(name==='sort'&&['source','asc','desc'].includes(val))cfg.sort=val;
 else if(['controls','toolbar'].includes(name)&&['true','false','on','off','yes','no'].includes(val))
  cfg.controls=['true','on','yes'].includes(val);
 else if(name==='color'&&/^#[0-9a-f]{6}$/i.test(value.trim()))cfg.accent=value.trim();
 else if(name==='line'&&/^[2-5]$/.test(val))cfg.line=Number(val);
 else if(name==='body'&&/^[2-4]$/.test(val))cfg.body=Number(val);
}
function writerV95TimelineCleanEvent(raw){
 const e=raw||{};
 const result={
  date:String(e.date||e.time||'').trim().slice(0,120),
  title:String(e.title||'').trim().slice(0,200),
  content:String(e.content||'').trim().slice(0,8000),
  image:String(e.image||'').trim().slice(0,400),
  icon:String(e.icon||'').trim().slice(0,45),
  color:/^#[0-9a-f]{6}$/i.test(String(e.color||''))?String(e.color):'',
  group:String(e.group||e.track||'').trim().slice(0,80),
  link:String(e.link||'').trim().slice(0,350)
 };
 return result.date||result.title||result.content?result:null;
}
function writerV95TimelineLegacy(lines){
 const events=[];let parts=[],extra=[];
 const push=()=>{
  if(parts.length!==3)return;
  const item={date:parts[0],title:parts[1],content:[parts[2],...extra].join('\n').trim()};
  // Optional per-event attributes at the beginning of the content.
  const body=item.content.split('\n'),remaining=[];let prefix=true;
  for(const row of body){
   const m=/^\s*(image|icon|color|group|track|link):\s*(.+)\s*$/i.exec(row);
   if(prefix&&m){item[m[1].toLowerCase()]=m[2].trim();continue;}
   if(row.trim())prefix=false;
   remaining.push(row);
  }
  item.content=remaining.join('\n').trim();
  const event=writerV95TimelineCleanEvent(item);
  if(event)events.push(event);
 };
 for(const line of lines){
  const mark=/^\s*\+\s+(.+)$/.exec(line);
  if(mark){
   if(parts.length===3){push();parts=[];extra=[];}
   parts.push(mark[1].trim());continue;
  }
  if(parts.length===3)extra.push(line);
 }
 push();
 return events.slice(0,80);
}
function writerV95TimelineLabeled(lines){
 const events=[];let current=null,content=false;
 const push=()=>{const clean=writerV95TimelineCleanEvent(current);if(clean)events.push(clean);current=null;content=false;};
 const keys={date:'date',time:'date',when:'date',title:'title',content:'content',description:'content',
  image:'image',photo:'image',icon:'icon',color:'color',group:'group',track:'group',link:'link'};
 for(const line of lines){
  if(/^\s*---\s*$/.test(line)){if(current)push();continue;}
  const m=/^\s*([a-z][a-z-]*):\s*(.*)$/i.exec(line);
  const key=m?keys[m[1].toLowerCase()]:null;
  if(key){
   if(key==='date'&&current?.date)push();
   if(!current)current={};
   if(key==='content'){current.content=(current.content?current.content+'\n':'')+m[2];content=true;}
   else {current[key]=m[2];content=false;}
   continue;
  }
  if(current&&(content||line.trim())){
   current.content=(current.content?current.content+'\n':'')+line;
  }
 }
 if(current)push();
 return events.slice(0,80);
}
function writerV95TimelineSortKey(date){
 const text=String(date||'').trim();
 if(/^-?\d{1,6}$/.test(text))return Number(text)*10000;
 if(/^\d{4}-\d\d(?:-\d\d)?$/.test(text)){
  const stamp=Date.parse(text.length===7?text+'-01':text);
  return Number.isFinite(stamp)?stamp/86400000:null;
 }
 return null;
}
function writerV95TimelineParse(source,format='timeline'){
 const raw=String(source||'');
 if(raw.length>64000)return null;
 const cfg={...WRITER_V95_TIMELINE_OPTIONS},lines=raw.replace(/\r\n/g,'\n').split('\n');
 let begin=0;
 while(begin<lines.length){
  const line=lines[begin].trim();
  if(!line||line==='---'){begin++;continue;}
  const classes=/^\[([^\]\n]{1,200})\]$/.exec(line);
  if(classes){
   for(const token of classes[1].split(',').map(x=>x.trim())){
    const size=/^(line|body)-([2-5])$/.exec(token);
    if(size)writerV95TimelineConfigOption(cfg,size[1],size[2]);
    if(WRITER_V95_TIMELINE_ACCENTS[token])cfg.accent='var('+WRITER_V95_TIMELINE_ACCENTS[token]+')';
   }
   begin++;continue;
  }
  const option=/^(layout|orientation|direction|theme|density|sort|controls|toolbar|color|line|body):\s*(.*)$/i.exec(line);
  if(option){writerV95TimelineConfigOption(cfg,option[1],option[2]);begin++;continue;}
  break;
 }
 const body=lines.slice(begin);
 const labeled=format==='timeline-labeled'||/^\s*(?:date|time|when):/i.test(body.find(x=>x.trim())||'');
 let events=labeled?writerV95TimelineLabeled(body):writerV95TimelineLegacy(body);
 if(cfg.sort!=='source'){
  events=events.map((event,index)=>({...event,_order:index,_sort:writerV95TimelineSortKey(event.date)}))
   .sort((a,b)=>a._sort===null||b._sort===null?a._order-b._order:
    (cfg.sort==='asc'?1:-1)*(a._sort-b._sort)||a._order-b._order);
 }
 return {config:cfg,events};
}
function writerV95TimelineLink(plugin,ctx,raw){
 const text=String(raw||'').trim().replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0];
 if(!text||/^(?:https?:|file:|data:|javascript:)/i.test(text))return null;
 const file=plugin.app.metadataCache?.getFirstLinkpathDest?.(text,ctx.sourcePath||'')
  ||plugin.app.vault.getAbstractFileByPath?.(text);
 return file instanceof TFile&&file.extension==='md'?file:null;
}
function writerV95TimelineRender(plugin,source,element,ctx,format){
 const parsed=writerV95TimelineParse(source,format);
 const root=element.createDiv({cls:'writer-v95-timeline'});
 if(!parsed){root.createEl('p',{text:writerUi('Timeline muito grande (limite de 64 KB).','Timeline exceeds the 64 KB limit.')});return;}
 const cfg=parsed.config;
 root.classList.add('is-layout-'+cfg.layout,'is-theme-'+cfg.theme,'is-density-'+cfg.density);
 root.style.setProperty('--writer-v95-line-width',cfg.line+'px');
 root.style.setProperty('--writer-v95-body-width',cfg.body+'px');
 if(cfg.accent)root.style.setProperty('--writer-v95-accent',cfg.accent);
 if(!parsed.events.length){
  root.createEl('p',{text:writerUi('Use três linhas começando com + ou campos date/title/content.','Use three + lines or date/title/content fields.')});
  return;
 }
 const groups=[...new Set(parsed.events.map(e=>e.group).filter(Boolean))];
 const bar=cfg.controls?root.createDiv({cls:'writer-v95-timeline-toolbar'}):null;
 let layout=cfg.layout,query='',group='';
 if(bar){
  const orient=bar.createEl('button',{cls:'writer-v95-timeline-orientation',attr:{type:'button'}});
  const setOrientation=()=>{orient.textContent=layout==='vertical'?writerUi('Horizontal','Horizontal'):writerUi('Vertical','Vertical');orient.setAttribute('aria-label',writerUi('Mudar orientação','Switch orientation'));};
  setOrientation();
  orient.addEventListener('click',()=>{
   layout=layout==='vertical'?'horizontal':'vertical';
   root.classList.toggle('is-layout-horizontal',layout==='horizontal');
   root.classList.toggle('is-layout-vertical',layout==='vertical');
   setOrientation();
  });
  const search=bar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar eventos…','Search events…'),'aria-label':writerUi('Buscar eventos','Search events')}});
  search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();draw();});
  if(groups.length){
   const select=bar.createEl('select',{attr:{'aria-label':writerUi('Filtrar trilha','Filter track')}});
   for(const name of ['',...groups]){
    const option=select.createEl('option',{text:name||writerUi('Todas as trilhas','All tracks')});option.value=name;
   }
   select.addEventListener('change',()=>{group=select.value;draw();});
  }
 }
 const list=root.createDiv({cls:'writer-v95-timeline-items',attr:{role:'list','aria-label':writerUi('Linha do tempo','Timeline')}});
 if(bar){
  const backward=bar.createEl('button',{text:'‹',attr:{type:'button','aria-label':writerUi('Rolar para trás','Scroll backward')}});
  const forward=bar.createEl('button',{text:'›',attr:{type:'button','aria-label':writerUi('Rolar para frente','Scroll forward')}});
  backward.className='writer-v95-timeline-scroll';
  forward.className='writer-v95-timeline-scroll';
  for(const [button,dir] of [[backward,-1],[forward,1]])button.addEventListener('click',()=>{
   if(root.classList.contains('is-layout-horizontal'))list.scrollBy({left:dir*Math.max(240,list.clientWidth*.7),behavior:'smooth'});
   else list.scrollBy({top:dir*Math.max(240,list.clientHeight*.7),behavior:'smooth'});
  });
 }
 function draw(){
  list.empty();
  const filtered=parsed.events.filter(e=>(!group||e.group===group)&&
   (!query||(e.date+' '+e.title+' '+e.content+' '+e.group).toLocaleLowerCase().includes(query)));
  if(!filtered.length){list.createEl('p',{cls:'writer-v95-empty',text:writerUi('Nenhum evento encontrado.','No matching events.')});return;}
  for(const event of filtered){
   const card=list.createDiv({cls:'writer-v95-timeline-event',attr:{role:'listitem'}});
   if(event.color)card.style.setProperty('--writer-v95-event-accent',event.color);
   const marker=card.createDiv({cls:'writer-v95-timeline-marker',attr:{'aria-hidden':'true'}});
   if(event.icon&&/^[a-z0-9-]{1,45}$/i.test(event.icon)){
    try{if(require('obsidian').getIcon?.(event.icon))require('obsidian').setIcon(marker,event.icon);}catch(_){}
   }
   const info=card.createDiv({cls:'writer-v95-timeline-event-body'});
   if(event.date)info.createSpan({cls:'writer-v95-timeline-date',text:event.date});
   if(event.title)info.createEl('strong',{cls:'writer-v95-timeline-title',text:event.title});
   if(event.group)info.createSpan({cls:'writer-v95-timeline-group',text:event.group});
   if(event.image){
    const image=writerV8ImagePath(plugin.app,event.image,ctx.sourcePath);
    if(image)info.createEl('img',{cls:'writer-v95-timeline-image',attr:{src:image,alt:event.title||writerUi('Imagem do evento','Event photo'),loading:'lazy',decoding:'async'}});
   }
   if(event.content){
    const area=info.createDiv({cls:'writer-v95-timeline-content'});
    void writerV8Markdown(plugin,ctx,area,event.content).catch(error=>{
     console.warn('[Basic AI] Timeline Markdown:',error);area.setText(event.content);
    });
   }
   if(event.link){
    const file=writerV95TimelineLink(plugin,ctx,event.link);
    if(file)info.createEl('button',{cls:'writer-v95-timeline-link',text:writerUi('Abrir nota','Open note'),attr:{type:'button'}})
     .addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(file));
   }
  }
 }
 draw();
}
function writerV95RegisterTimelineBlocks(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 for(const format of ['timeline','timeline-labeled','writer-timeline']){
  plugin.registerMarkdownCodeBlockProcessor(format,(source,element,ctx)=>{
   if(!writerModuleOn(plugin,'timelineBlocks')){element.createEl('pre',{text:source});return;}
   writerV95TimelineRender(plugin,source,element,ctx,format);
  });
 }
 plugin.addCommand({
  id:'v95-insert-timeline',
  name:writerUi('Inserir bloco Timeline','Insert Timeline block'),
  editorCallback:editor=>{
   const fence=String.fromCharCode(96).repeat(3);
   editor.replaceSelection([
    fence+'timeline','layout: vertical','theme: cards','','+ 2026-01-01',
    '+ '+writerUi('Primeiro evento','First event'),
    '+ '+writerUi('Descrição do evento','Event description'),'',
    '+ 2026-02-01','+ '+writerUi('Segundo evento','Second event'),
    '+ '+writerUi('Outro momento importante','Another important moment'),fence
   ].join('\n'));
  }
 });
}
