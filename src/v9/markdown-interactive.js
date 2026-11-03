'use strict';
/* 9.2.0 — original Markdown layout and interaction extensions, behavior inspired by
 * Multi-Column Markdown, Meta Bind, ProgressBar and Obsidian Widgets.
 * No GPL-licensed sources copied. */
function writerV92MarkdownMerge(settings){
 const old=settings.v92Markdown&&typeof settings.v92Markdown==='object'?settings.v92Markdown:{};
 const cfg=settings.v92Markdown={columns:true,metaBind:true,progress:true,widgets:true,
  counters:{},progressValues:{},columnGap:16,...old};
 for(const flag of ['columns','metaBind','progress','widgets'])cfg[flag]=cfg[flag]!==false;
 for(const key of ['counters','progressValues'])
  cfg[key]=cfg[key]&&typeof cfg[key]==='object'&&!Array.isArray(cfg[key])?cfg[key]:{};
 cfg.columnGap=Math.max(0,Math.min(48,Math.floor(Number(cfg.columnGap)||16)));
 return cfg;
}
function writerV92Yaml(source){
 const txt=String(source||'').slice(0,32000).trim();
 try{
  const obj=parseYaml(txt);
  return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
 }catch(_){return {};}
}
function writerV92BoundNumber(value,fallback,min=-1e7,max=1e7){
 const x=Number(value);
 return Number.isFinite(x)?Math.max(min,Math.min(max,x)):fallback;
}
function writerV92ColumnsParse(source,gap){
 const src=String(source||'').replace(/\r\n/g,'\n');
 let options={},body=src;
 const sep=/^---\s*$/m.exec(src);
 if(sep&&sep.index<1200){
  const head=src.slice(0,sep.index);
  if(/^\s*(columns|number of columns|cols|gap|widths|border|align|largest column|column spacing)\s*:/mi.test(head)){
   options=writerV92Yaml(head);
   body=src.slice(sep.index+sep[0].length).replace(/^\n/,'');
  }
 }
 const split=/^\s*(?:---\s*(?:column-end|end-column|column-break|break-column|column)\s*---|===+|:::\s*columnbreak\s*:::|:::\s*columnbreak)\s*$/gmi;
 let chunks=body.split(split).map(x=>x.trim()).filter(Boolean);
 if(chunks.length<2)chunks=body.split(/^\s*:::\s*column\s*$/gm).map(x=>x.trim()).filter(Boolean);
 if(!chunks.length)chunks=[body.trim()].filter(Boolean);
 const desired=writerV92BoundNumber(options.columns??options.cols??options['number of columns'],chunks.length,1,6);
 const count=Math.max(1,Math.min(6,Math.max(chunks.length,desired)));
 const widthsRaw=Array.isArray(options.widths)?options.widths.join(' '):String(options.widths||'');
 const widths=widthsRaw.split(/[,\s]+/).filter(x=>/^(?:\d+(?:\.\d+)?(?:fr|%|px)|auto)$/.test(x)).slice(0,6);
 const space=writerV92BoundNumber(options.gap??options['column spacing'],gap,0,64);
 return {chunks:chunks.slice(0,6),count,widths,space,border:options.border===true,align:['start','center','end','stretch'].includes(options.align)?options.align:'stretch'};
}
async function writerV92RenderColumns(plugin,source,el,ctx){
 const data=writerV92ColumnsParse(source,plugin.settings.v92Markdown.columnGap);
 const root=el.createDiv({cls:'writer-v92-columns',attr:{role:'group','aria-label':writerUi('Colunas Markdown','Markdown columns')}});
 root.style.setProperty('--writer-v92-column-gap',data.space+'px');
 root.style.setProperty('--writer-v92-column-count',String(data.count));
 if(data.widths.length===data.chunks.length)root.style.gridTemplateColumns=data.widths.join(' ');
 root.classList.toggle('has-border',data.border);
 root.style.alignItems=data.align;
 for(const chunk of data.chunks){
  const child=root.createDiv({cls:'writer-v92-column markdown-rendered'});
  await MarkdownRenderer.render(plugin.app,chunk,child,ctx.sourcePath,ctx);
 }
}
function writerV92ProgressModel(source,now=new Date()){
 const data=writerV92Yaml(source),kind=String(data.kind||'manual').trim();
 let value=writerV92BoundNumber(data.value,0),min=writerV92BoundNumber(data.min,0),max=writerV92BoundNumber(data.max,100);
 const stamp=(year,month,day)=>Date.UTC(year,month,day)/86400000;
 const today=stamp(now.getFullYear(),now.getMonth(),now.getDate());
 const startOfWeek=new Date(now);startOfWeek.setDate(now.getDate()-((now.getDay()+6)%7));
 if(kind==='day-year'){
  min=0;max=(stamp(now.getFullYear()+1,0,1)-stamp(now.getFullYear(),0,1));
  value=today-stamp(now.getFullYear(),0,1);
 }else if(kind==='day-month'){
  min=0;max=stamp(now.getFullYear(),now.getMonth()+1,1)-stamp(now.getFullYear(),now.getMonth(),1);
  value=now.getDate()-1;
 }else if(kind==='day-week'){
  min=0;max=7;value=(now.getDay()+6)%7;
 }else if(kind==='month'){
  min=0;max=12;value=now.getMonth();
 }else if(kind==='day-custom'){
  const a=/^\d{4}-\d{2}-\d{2}$/.test(String(data.min||''))?new Date(String(data.min)+'T00:00:00Z'):null;
  const b=/^\d{4}-\d{2}-\d{2}$/.test(String(data.max||''))?new Date(String(data.max)+'T00:00:00Z'):null;
  if(a&&b&&!isNaN(+a)&&!isNaN(+b)&&b>a){
   min=0;max=Math.min(365250,Math.round((b-a)/86400000));value=Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-a)/86400000);
  }else{min=0;max=100;value=0;}
 }
 if(max<=min)max=min+1;
 value=Math.min(max,Math.max(min,value));
 const percentage=Math.max(0,Math.min(100,Math.round((value-min)/(max-min)*100)));
 return {kind,name:String(data.name||kind).slice(0,150),value,min,max,percentage,button:data.button===true||String(data.button)==='true',
  id:String(data.id||'').trim().slice(0,120),width:String(data.width||'').trim(),step:writerV92BoundNumber(data.step,1,0.001,1000)};
}
function writerV92ProgressName(model){
 return model.name.replace(/\{(percentage|value|min|max)\}/g,(_,k)=>k==='percentage'?model.percentage+'%':String(model[k]));
}
function writerV92ProgressDraw(host,model){
 host.empty();
 const label=host.createDiv({cls:'writer-v92-progress-name',text:writerV92ProgressName(model)});
 const row=host.createDiv({cls:'writer-v92-progress-row'});
 const progress=row.createEl('progress',{cls:'writer-v92-progress-track',attr:{max:100,value:model.percentage,'aria-label':label.textContent||model.name}});
 if(/^(?:\d{1,3}%|\d{1,4}px)$/.test(model.width))progress.style.width=model.width;
 row.createSpan({cls:'writer-v92-progress-percent',text:model.percentage+'%'});
 return row;
}
function writerV92ProgressRegister(plugin){
 plugin.registerMarkdownCodeBlockProcessor('progressbar',(source,el,ctx)=>{
  if(!writerModuleOn(plugin,'progressBars')||!plugin.settings.v92Markdown.progress)return;
  const data=writerV92ProgressModel(source),key=data.id?ctx.sourcePath+'|'+data.id:'';
  if(key&&Number.isFinite(Number(plugin.settings.v92Markdown.progressValues[key])))
   data.value=writerV92BoundNumber(plugin.settings.v92Markdown.progressValues[key],data.value,data.min,data.max);
  const redraw=()=>{
   data.percentage=Math.round(100*(data.value-data.min)/(data.max-data.min));
   writerV92ProgressDraw(el,data);
   if(data.button&&key&&data.kind==='manual'){
    const buttons=el.createDiv({cls:'writer-v92-progress-actions'});
    for(const [sign,icon] of [[-1,'minus'],[1,'plus']]){
     const b=buttons.createEl('button',{attr:{type:'button','aria-label':sign===1?'+':'−'}});
     require('obsidian').setIcon(b,icon);
     b.addEventListener('click',async()=>{
      data.value=writerV92BoundNumber(data.value+sign*data.step,data.value,data.min,data.max);
      plugin.settings.v92Markdown.progressValues[key]=data.value;
      await plugin.saveSettings();
      for(const node of plugin.app.workspace.containerEl?.querySelectorAll?.('.writer-v92-progress[data-progress-key]')||[])
       if(node.dataset.progressKey===key&&node!==el)node.dispatchEvent(new CustomEvent('writer-v92-update',{detail:data.value}));
      redraw();
     });
    }
   }
  };
  el.addClass('writer-v92-progress');
  if(key)el.dataset.progressKey=key;
  el.addEventListener('writer-v92-update',event=>{data.value=writerV92BoundNumber(event.detail,data.value,data.min,data.max);redraw();});
  redraw();
 });
 plugin.registerMarkdownCodeBlockProcessor('progress',(source,el,ctx)=>writerV92ProgressRegisterOne(plugin,source,el,ctx));
}
function writerV92ProgressRegisterOne(plugin,source,el,ctx){
 if(!writerModuleOn(plugin,'progressBars')||!plugin.settings.v92Markdown.progress)return;
 return writerV92ProgressDraw(el,writerV92ProgressModel(source));
}
function writerV92DateCountdown(value){
 const date=new Date(String(value||'').trim().replace(' ','T'));
 if(Number.isFinite(date.getTime()))return date;
 const m=/^\+(\d{1,6})([smhd])$/.exec(String(value||''));
 if(!m)return null;
 const units={s:1000,m:60000,h:3600000,d:86400000};
 return new Date(Date.now()+Number(m[1])*units[m[2]]);
}
function writerV92ClockValue(format,hideSeconds,date=new Date()){
 const parts=[date.getHours(),date.getMinutes(),date.getSeconds()];
 if(hideSeconds)parts.pop();
 const hour=format==='12hr'?(parts[0]%12||12):parts[0];
 return [hour,...parts.slice(1)].map(n=>String(n).padStart(2,'0')).join(':')+(format==='12hr'?(date.getHours()<12?' AM':' PM'):'');
}
function writerV92WidgetRegister(plugin){
 plugin.registerMarkdownCodeBlockProcessor('widgets',(source,el,ctx)=>{
  if(!plugin.settings.v92Markdown.widgets||!writerModuleOn(plugin,'noteWidgets'))return;
  const data=writerV92Yaml(source),kind=String(data.type||'clock').trim().toLowerCase();
  el.addClass('writer-v92-widget');
  const content=el.createDiv({cls:'writer-v92-widget-inner'});
  let clockTimer=null;
  if(kind==='clock'){
   const clock=content.createEl('strong',{cls:'writer-v92-widget-clock'});
   const paint=()=>clock.setText(writerV92ClockValue(String(data.format||'24hr'),data.hideSeconds===true));
   paint();
   clockTimer=setInterval(paint,data.hideSeconds===true?20000:1000);
  }else if(kind==='quote'){
   content.createEl('blockquote',{text:String(data.quote||'').slice(0,1500)});
   if(data.author)content.createEl('span',{cls:'writer-v92-widget-author',text:'— '+String(data.author).slice(0,150)});
  }else if(kind==='countdown'){
   const end=writerV92DateCountdown(data.date);
   if(!end){content.setText(writerUi('Data inválida.','Invalid countdown date.'));return;}
   if(data.to)content.createEl('strong',{text:String(data.to).slice(0,100)});
   const line=content.createDiv({cls:'writer-v92-widget-countdown'});
   const paint=()=>{
    const left=Math.max(0,end.getTime()-Date.now());
    if(left===0){line.setText(String(data.completedLabel||writerUi('Concluído','Complete')));return;}
    const seconds=Math.floor(left/1000),days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),
     minutes=Math.floor(seconds%3600/60),secs=seconds%60;
    line.setText((days?days+'d ':'')+[hours,minutes,secs].map(x=>String(x).padStart(2,'0')).join(':'));
   };paint();clockTimer=setInterval(paint,1000);
  }else if(kind==='counter'){
   const key=String(ctx.sourcePath||'')+'|'+String(data.id||'default').slice(0,120),cfg=plugin.settings.v92Markdown,
    start=writerV92BoundNumber(data.startValue,0),step=writerV92BoundNumber(data.increment,1,0.01,100000);
   const value=content.createEl('strong',{cls:'writer-v92-widget-counter'});
   const draw=()=>value.setText(String(writerV92BoundNumber(cfg.counters[key],start)));
   draw();
   if(data.text)content.createEl('p',{text:String(data.text).slice(0,120)});
   const buttons=content.createDiv({cls:'writer-v92-widget-buttons'});
   for(const [label,delta] of [['−',-step],['+',step],['↺',null]]){
    const b=buttons.createEl('button',{text:label,attr:{type:'button','aria-label':label}});
    b.addEventListener('click',async()=>{
     cfg.counters[key]=delta===null?start:writerV92BoundNumber(cfg.counters[key],start)+delta;
     await plugin.saveSettings();
     draw();
    });
   }
  }else content.setText(writerUi('Tipo de widget desconhecido.','Unknown widget type.'));
  if(clockTimer!==null){
   const component=new (require('obsidian').Component)();
   component.onunload=()=>clearInterval(clockTimer);
   ctx.addChild?.(component);
  }
 });
}
function writerV92MetaPathSafe(value){return /^[a-zA-Z_][\w.-]{0,119}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function writerV92MetaRead(plugin,file,key){
 const fm=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 return Object.prototype.hasOwnProperty.call(fm,key)?fm[key]:undefined;
}
async function writerV92MetaWrite(plugin,file,key,value){
 if(!(file instanceof TFile)||file.extension!=='md'||!writerV92MetaPathSafe(key))throw Error('Invalid property or file');
 if(typeof plugin.app.fileManager?.processFrontMatter!=='function')throw Error('Frontmatter API unavailable');
 await plugin.app.fileManager.processFrontMatter(file,fm=>{fm[key]=value;});
}
function writerV92MetaField(plugin,root,file,spec){
 if(!file||file.extension!=='md')return false;
 const key=String(spec.key||'').trim(),type=String(spec.type||'text');
 if(!writerV92MetaPathSafe(key))return false;
 const current=writerV92MetaRead(plugin,file,key);
 if(type==='view'){
  root.createSpan({cls:'writer-v92-meta-value',text:current===undefined?'—':String(current)});
  return true;
 }
 const label=String(spec.label||key).slice(0,100);
 const row=root.createDiv({cls:'writer-v92-meta-field'});
 if(label)row.createSpan({cls:'writer-v92-meta-label',text:label});
 const write=async v=>{
  try{await writerV92MetaWrite(plugin,file,key,v);}
  catch(err){new Notice(writerUi('Erro ao salvar: ','Save failed: ')+String(err?.message||err));}
 };
 if(type==='toggle'){
  const input=row.createEl('input',{attr:{type:'checkbox','aria-label':label}});
  input.checked=current===true;
  input.addEventListener('change',()=>void write(input.checked));
 }else if(type==='select'){
  const select=row.createEl('select',{attr:{'aria-label':label}});
  const opts=Array.isArray(spec.options)?spec.options:String(spec.options||'').split('|').map(x=>x.trim()).filter(Boolean);
  for(const opt of opts.slice(0,40)){
   const option=select.createEl('option',{text:String(opt).slice(0,120)});option.value=String(opt);
  }
  select.value=String(current??'');select.addEventListener('change',()=>void write(select.value));
 }else if(type==='slider'||type==='number'){
  const input=row.createEl('input',{attr:{type:type==='slider'?'range':'number','aria-label':label}});
  input.min=String(writerV92BoundNumber(spec.min,0));
  input.max=String(writerV92BoundNumber(spec.max,100));
  input.step=String(writerV92BoundNumber(spec.step,1,0.001,1e6));
  input.value=String(writerV92BoundNumber(current,writerV92BoundNumber(spec.min,0)));
  const display=row.createSpan({text:input.value});
  input.addEventListener('input',()=>display.setText(input.value));
  input.addEventListener('change',()=>void write(Number(input.value)));
 }else if(type==='date'){
  const input=row.createEl('input',{attr:{type:'date','aria-label':label}});
  input.value=typeof current==='string'?current.slice(0,10):'';
  input.addEventListener('change',()=>void write(input.value));
 }else{
  const input=row.createEl('input',{attr:{type:'text','aria-label':label}});
  input.value=String(current??'').slice(0,2000);
  input.addEventListener('change',()=>void write(input.value.slice(0,2000)));
 }
 return true;
}
function writerV92MetaToken(token){
 const data=/^(INPUT|VIEW)\[([^\]\n]{1,220})\]$/.exec(token);
 if(!data)return null;
 let [_,command,body]=data,key='',type='view',options={};
 if(command==='VIEW'){key=body.trim();}
 else{
  const match=/^(toggle|text|number|slider|date|select)(?:\(([^)]*)\))?:([a-zA-Z_][\w.-]*)$/.exec(body.trim());
  if(!match)return null;
  type=match[1];key=match[3];
  if(match[2]){
   const args=match[2].split(',').map(x=>x.trim());
   if(type==='slider'){options={min:Number(args[0])||0,max:Number(args[1])||100,step:Number(args[2])||1};}
   if(type==='select')options={options:args};
  }
 }
 return writerV92MetaPathSafe(key)?{type,key,...options}:null;
}
function writerV92MetaInline(plugin,el,ctx){
 if(!plugin.settings.v92Markdown.metaBind||!writerModuleOn(plugin,'metaBind'))return;
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
 if(!(file instanceof TFile))return;
 const doc=el.ownerDocument,walker=doc.createTreeWalker(el,4),nodes=[];
 while(walker.nextNode()){
  const node=walker.currentNode;
  if(!/INPUT\[|VIEW\[/.test(node.nodeValue||''))continue;
  if(node.parentElement?.closest('pre,code,script,style,a,textarea,input,button,.writer-v92-meta-field,.writer-v92-meta-value'))continue;
  nodes.push(node);
 }
 for(const node of nodes.slice(0,120)){
  const text=node.nodeValue,rx=/(?:INPUT|VIEW)\[[^\]\n]{1,220}\]/g;
  let last=0,m,valid=0;
  const frag=doc.createDocumentFragment();
  while((m=rx.exec(text))!==null){
   const spec=writerV92MetaToken(m[0]);if(!spec)continue;
   frag.append(doc.createTextNode(text.slice(last,m.index)));
   const host=doc.createElement('span');host.className='writer-v92-meta-inline';
   writerV92MetaField(plugin,host,file,{...spec,label:''});
   frag.appendChild(host);last=m.index+m[0].length;valid++;
  }
  if(valid){frag.append(doc.createTextNode(text.slice(last)));node.replaceWith(frag);}
 }
}
function writerV92MetaRegister(plugin){
 plugin.registerMarkdownPostProcessor?.((el,ctx)=>writerV92MetaInline(plugin,el,ctx),-10);
 plugin.registerMarkdownCodeBlockProcessor('meta-bind',(source,el,ctx)=>{
  if(!plugin.settings.v92Markdown.metaBind||!writerModuleOn(plugin,'metaBind'))return;
  const data=writerV92Yaml(source),file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
  if(!(file instanceof TFile))return;
  el.addClass('writer-v92-meta-form');
  const fields=Array.isArray(data.fields)?data.fields.slice(0,40):[data];
  for(const spec of fields)if(spec&&typeof spec==='object')writerV92MetaField(plugin,el,file,spec);
 });
 plugin.registerMarkdownCodeBlockProcessor('meta-bind-button',(source,el,ctx)=>{
  if(!plugin.settings.v92Markdown.metaBind||!writerModuleOn(plugin,'metaBind'))return;
  const data=writerV92Yaml(source),file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
  if(!(file instanceof TFile)||!writerV92MetaPathSafe(String(data.property||'')))return;
  const action=String(data.action||'toggle');
  if(!['toggle','set','increment'].includes(action))return;
  const label=String(data.label||writerUi('Atualizar','Update')).slice(0,80);
  const button=el.createEl('button',{cls:'writer-v92-meta-button',text:label,attr:{type:'button'}});
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const value=writerV92MetaRead(plugin,file,data.property);
    const next=action==='toggle'?!Boolean(value):action==='increment'?
     writerV92BoundNumber(value,0)+writerV92BoundNumber(data.step,1,-1000,1000):
     (typeof data.value==='string'||typeof data.value==='number'||typeof data.value==='boolean'?data.value:'');
    await writerV92MetaWrite(plugin,file,data.property,next);
   }catch(e){new Notice(String(e?.message||e));}finally{button.disabled=false;}
  });
 });
}
function writerV92MarkdownRegister(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 for(const block of ['columns','multi-column']){
  plugin.registerMarkdownCodeBlockProcessor(block,(source,el,ctx)=>{
   if(!plugin.settings.v92Markdown.columns||!writerModuleOn(plugin,'markdownColumns'))return;
   void writerV92RenderColumns(plugin,source,el,ctx).catch(error=>{console.warn('[Basic AI] Columns:',error);});
  });
 }
 writerV92ProgressRegister(plugin);
 writerV92WidgetRegister(plugin);
 writerV92MetaRegister(plugin);
 plugin.addCommand?.({id:'v92-insert-columns',name:writerUi('Colunas: inserir bloco Markdown','Columns: insert Markdown block'),editorCallback:editor=>{
  editor.replaceSelection('\n~~~columns\ncolumns: 2\ngap: 16\n---\n'+writerUi('Primeira coluna','First column')+'\n--- column ---\n'+writerUi('Segunda coluna','Second column')+'\n~~~\n');
 }});
 plugin.addCommand?.({id:'v92-insert-progress',name:writerUi('Progresso: inserir barra','Progress: insert bar'),editorCallback:editor=>{
  editor.replaceSelection('\n~~~progressbar\nkind: manual\nname: "Progress: {percentage}"\nvalue: 5\nmin: 0\nmax: 10\n~~~\n');
 }});
}
function writerV92MarkdownSettings(plugin,panel){
 const cfg=plugin.settings.v92Markdown;
 panel.createEl('h3',{text:writerUi('Blocos interativos e layout','Interactive blocks & layouts')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Colunas, barras de progresso, relógios, contadores, citações e campos de propriedades com blocos de Markdown. Campos e botões alteram apenas propriedades explícitas da nota.',
  'Columns, progress bars, clocks, counters, quotes and bound frontmatter fields through Markdown blocks. Fields and buttons edit only explicitly named properties.'
 )});
 const save=async()=>{await plugin.saveSettings();};
 for(const [key,pt,en] of [
  ['columns','Colunas Markdown','Markdown columns'],['metaBind','Campos vinculados a propriedades','Frontmatter-bound fields'],
  ['progress','Barras de progresso','Progress bars'],['widgets','Widgets em notas','In-note widgets']
 ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{cfg[key]=v;await save();}));
 new Setting(panel).setName(writerUi('Espaçamento padrão das colunas','Default column gap'))
  .addSlider(s=>s.setLimits(0,48,2).setValue(cfg.columnGap).setDynamicTooltip().onChange(async v=>{cfg.columnGap=v;await save();}));
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Use os blocos columns, progressbar, widgets, meta-bind e meta-bind-button. No modo Leitura, INPUT[toggle:done] e VIEW[done] podem acessar propriedades do frontmatter. Não executa JavaScript ou ações arbitrárias.',
  'Use columns, progressbar, widgets, meta-bind and meta-bind-button code blocks. In Reading mode, INPUT[toggle:done] and VIEW[done] can read and edit frontmatter properties. No arbitrary script execution or actions.'
 )});
}
