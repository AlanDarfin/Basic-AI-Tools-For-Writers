'use strict';
/* v9.2.0: independent writing widgets inspired by Meta Bind, Multi Column Markdown,
 * Progressbar and Obsidian Widgets. No GPL code is copied or bundled. */
function writerV92BlocksMerge(settings){
 const old=settings.v92Blocks&&typeof settings.v92Blocks==='object'?settings.v92Blocks:{};
 return settings.v92Blocks={enabled:true,columns:true,progress:true,widgets:true,metaFields:true,inlineMetaFields:false,metaBindFences:false,...old};
}
function writerV92BlockOptions(source){
 const result={};
 for(const line of String(source||'').split(/\r?\n/).slice(0,80)){
  const match=line.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
  if(match)result[match[1].toLowerCase()]=match[2].trim().replace(/^["']|["']$/g,'');
 }
 return result;
}
function writerV92Clamp(value,min,max,fallback){
 const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
}
function writerV92ProgressData(options,now=new Date()){
 const kind=String(options.kind||'manual').toLowerCase();
 let min=0,max=100,value=0;
 const day=86400000;
 const midnight=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 const elapsed=start=>(midnight-start)/day+1;
 if(kind==='day-year'){
  const start=Date.UTC(now.getFullYear(),0,1),end=Date.UTC(now.getFullYear()+1,0,1);
  max=(end-start)/day;value=elapsed(start);
 }else if(kind==='day-month'){
  const start=Date.UTC(now.getFullYear(),now.getMonth(),1),end=Date.UTC(now.getFullYear(),now.getMonth()+1,1);
  max=(end-start)/day;value=elapsed(start);
 }else if(kind==='day-week'){
  max=7;value=(now.getDay()+6)%7+1;
 }else if(kind==='month'){max=12;value=now.getMonth()+1;}
 else if(kind==='day-custom'){
  const parse=value=>{
   const raw=String(value||''),date=new Date(raw+'T00:00:00Z');
   return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===raw?date.getTime():NaN;
  };
  const start=parse(options.min),end=parse(options.max);
  if(end>=start){
   max=(end-start)/day+1;value=elapsed(start);
  }
 }else{
  min=writerV92Clamp(options.min,-1e9,1e9,0);
  max=writerV92Clamp(options.max,-1e9,1e9,100);
  value=writerV92Clamp(options.value,-1e9,1e9,0);
 }
 if(max<=min)max=min+1;
 const percent=Math.max(0,Math.min(100,Math.round((value-min)/(max-min)*100)));
 return {kind,min,max,value,percent};
}
function writerV92StoredValue(values,id,fallback){
 return Object.hasOwn(values,id)?values[id]:fallback;
}
function writerV92UpdateWidgetValue(plugin,values,id,value,selector,dataKey){
 Object.defineProperty(values,id,{value,writable:true,enumerable:true,configurable:true});
 void plugin.saveSettings();
 for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])
  for(const node of leaf.view?.containerEl?.querySelectorAll?.(selector)||[])
   if(node.dataset[dataKey]===id)node.dispatchEvent(new Event('writer-widget-sync'));
}
function writerV92RenderProgress(plugin,source,el,ctx){
 const options=writerV92BlockOptions(source);
 const key=String(options.id||'').slice(0,80);
 const values=plugin.settings.v92ProgressValues||(plugin.settings.v92ProgressValues={});
 const isManual=!['day-year','day-month','day-week','day-custom','month'].includes(options.kind?.toLowerCase());
 const host=el.createDiv({cls:'writer-v92-progress'});
 const name=host.createEl('label',{cls:'writer-v92-progress-label'});
 const bar=host.createDiv({cls:'writer-v92-progress-track',attr:{role:'progressbar','aria-valuemin':'0','aria-valuemax':'100'}});
 const fill=bar.createDiv({cls:'writer-v92-progress-fill'});
 const controls=host.createDiv({cls:'writer-v92-progress-controls'});
 const redraw=()=>{
  const cfg={...options};
  if(key)cfg.value=writerV92StoredValue(values,key,options.value);
  const data=writerV92ProgressData(cfg);
  name.setText(String(options.name||options.kind||writerUi('Progresso','Progress')).replace(/\{(min|max|value|percentage)\}/g,(_,id)=>String(id==='percentage'?data.percent+'%':data[id])));
  bar.setAttribute('aria-valuenow',String(data.percent));
  bar.setAttribute('aria-label',name.textContent);
  fill.style.width=data.percent+'%';
 };
 if(isManual&&options.button==='true'&&key){
  for(const [label,delta] of [['−',-1],['+',1]]){
   controls.createEl('button',{text:label,attr:{type:'button','aria-label':delta<0?writerUi('Diminuir','Decrease'):writerUi('Aumentar','Increase')}})
    .addEventListener('click',()=>{
     const d=writerV92ProgressData({...options,value:writerV92StoredValue(values,key,options.value)});
     writerV92UpdateWidgetValue(plugin,values,key,Math.max(d.min,Math.min(d.max,d.value+delta)),
      '.writer-v92-progress[data-progress-id]','progressId');
     redraw();
    });
  }
 }
 if(isManual&&key){
  host.dataset.progressId=key;
  host.addEventListener('writer-widget-sync',redraw);
 }
 redraw();
}
function writerV92RenderColumns(plugin,source,el,ctx){
 const match=/^(?:[ \t]*\r?\n)* {0,3}columns?[ \t]*:[ \t]*(\d+)[ \t]*(?:\r?\n|$)/i.exec(source);
 const count=Math.round(writerV92Clamp(match?.[1],1,4,2));
 const content=match?source.slice(match[0].length):source;
 const parts=writerV8MarkdownSections(content,line=>/^ {0,3}(?:---[ \t]*(?:end-column|column-end|column-break)[ \t]*---|:::columnbreak)[ \t]*$/i.test(line),4);
 const host=el.createDiv({cls:'writer-v92-columns'});
 host.style.setProperty('--writer-v92-columns',String(Math.max(1,Math.min(count,parts.length))));
 for(const part of parts){
  const cell=host.createDiv({cls:'writer-v92-column markdown-rendered'});
  void writerV8Markdown(plugin,ctx,cell,writerV8TrimBlankLines(part)).catch(()=>cell.setText(part));
 }
}
function writerV92RenderWidget(plugin,source,el,ctx){
 const options=writerV92BlockOptions(source),kind=options.type||'clock';
 const host=el.createDiv({cls:'writer-v92-widget'});
 const drawClock=()=>{
  host.empty();
  const date=new Date();
  const format=options.format==='12hr'?'en-US':'pt-BR';
  host.createEl('time',{text:date.toLocaleTimeString(format,{hour:'2-digit',minute:'2-digit',second:options.hideseconds==='true'?undefined:'2-digit',hour12:options.format==='12hr'})});
 };
 if(kind==='clock'){
  drawClock();const timer=setInterval(drawClock,1000);
  const Child=require('obsidian').MarkdownRenderChild;
  if(Child&&ctx.addChild){class ClockChild extends Child{onunload(){clearInterval(timer);}}ctx.addChild(new ClockChild(host));}
  else clearInterval(timer);
 }else if(kind==='quote'){
  const block=host.createEl('blockquote');block.createEl('p',{text:String(options.quote||'').slice(0,2000)});
  if(options.author)host.createEl('small',{text:'— '+options.author.slice(0,180)});
 }else if(kind==='countdown'){
  const target=new Date(options.date||'');
  const label=host.createEl('strong');
  const draw=()=>{
   const diff=target.getTime()-Date.now();
   if(!Number.isFinite(diff)){label.setText(writerUi('Data inválida','Invalid date'));return;}
   if(diff<=0){label.setText(options.completedlabel||writerUi('Concluído','Completed'));return;}
   const days=Math.floor(diff/86400000),hours=Math.floor(diff/3600000)%24,mins=Math.floor(diff/60000)%60;
   label.setText(days+'d '+hours+'h '+mins+'m');
  };
  draw();const timer=setInterval(draw,30000);
  const Child=require('obsidian').MarkdownRenderChild;
  if(Child&&ctx.addChild){class CountChild extends Child{onunload(){clearInterval(timer);}}ctx.addChild(new CountChild(host));}
  else clearInterval(timer);
  if(options.to)host.createEl('small',{text:options.to.slice(0,180)});
 }else if(kind==='counter'){
  const id=String(options.id||ctx?.sourcePath||'default').slice(0,160);
  const values=plugin.settings.v92CounterValues||(plugin.settings.v92CounterValues={});
  const value=host.createEl('strong');
  const start=writerV92Clamp(options.startvalue,-1e8,1e8,0);
  const current=()=>writerV92Clamp(writerV92StoredValue(values,id,start),-1e8,1e8,start);
  const draw=()=>value.setText(String(current()));
  host.dataset.counterId=id;
  host.addEventListener('writer-widget-sync',draw);
  draw();
  const delta=writerV92Clamp(options.increment,0.01,10000,1);
  for(const [text,change,pt,en] of [['−',-delta,'Diminuir','Decrease'],['+',delta,'Aumentar','Increase'],['↺',null,'Reiniciar','Reset']]){
   host.createEl('button',{text,attr:{type:'button','aria-label':writerUi(pt,en)}}).addEventListener('click',()=>{
    const next=change===null?start:writerV92Clamp(current()+change,-1e8,1e8,start);
    writerV92UpdateWidgetValue(plugin,values,id,next,'.writer-v92-widget[data-counter-id]','counterId');
    draw();
   });
  }
  if(options.text)host.createEl('small',{text:options.text.slice(0,160)});
 }else host.createEl('p',{text:writerUi('Tipo de widget não suportado.','Unsupported widget type.')});
}
function writerV92MetaKey(key){
 return /^[a-zA-Z][\w-]{0,79}$/.test(key)&&key!=='constructor'&&key!=='prototype';
}
function writerV92MetaEnabled(plugin,mode='block'){
 const cfg=plugin.settings.v92Blocks;
 if(!writerModuleOn(plugin,'writingWidgets')||!cfg?.enabled||!cfg.metaFields)return false;
 if(mode==='block')return true;
 const plugins=plugin.app.plugins,id='obsidian-meta-bind-plugin';
 if(plugins?.enabledPlugins?.has?.(id)||plugins?.plugins?.[id])return false;
 return mode==='inline'?cfg.inlineMetaFields===true:cfg.metaBindFences===true;
}
function writerV92MetaValue(front,key){
 return front&&Object.hasOwn(front,key)?front[key]:undefined;
}
async function writerV92MetaWrite(plugin,file,key,mode,resolve){
 if(!writerV92MetaKey(key)||!writerV92MetaEnabled(plugin,mode)||!plugin.app.fileManager?.processFrontMatter||
    plugin.app.vault.getAbstractFileByPath(file.path)!==file)return false;
 try{
  await plugin.app.fileManager.processFrontMatter(file,front=>{
   const next=resolve(writerV92MetaValue(front,key));
   if(next!==undefined)front[key]=next;
  });
  return true;
 }catch(_){
  new Notice(writerUi('Não foi possível salvar a propriedade.','Could not save property.'));
  return false;
 }
}
function writerV92MetaWatch(plugin,el,ctx,file,refreshers){
 const cache=plugin.app.metadataCache;
 if(!refreshers.length||typeof cache?.on!=='function'||!ctx?.addChild)return;
 const Child=require('obsidian').MarkdownRenderChild;
 if(!Child)return;
 const child=new Child(el);
 child.registerEvent(cache.on('changed',changed=>{
  if(changed===file)for(const refresh of refreshers)refresh();
 }));
 ctx.addChild(child);
}
function writerV92RenderMeta(plugin,source,el,ctx){
 const options=writerV92BlockOptions(source),key=String(options.property||'').trim();
 if(!writerV92MetaKey(key)){
  el.createEl('small',{text:writerUi('Defina property: nome_da_propriedade','Set property: property_name')});return;
 }
 const type=['toggle','text','number','select','view'].includes(options.type)?options.type:'view';
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
 if(!(file instanceof TFile))return;
 const host=el.createDiv({cls:'writer-v92-meta'});
 const refresh=writerV92MetaField(plugin,host,file,key,{...options,type});
 if(refresh)writerV92MetaWatch(plugin,host,ctx,file,[refresh]);
}
function writerV92MetaField(plugin,host,file,key,options,mode='block'){
 const inline=mode==='inline';
 const value=()=>writerV92MetaValue(plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter,key);
 const type=options.type,label=String(options.label||key).slice(0,90);
 if(!inline)host.createEl('label',{text:label});
 if(type==='view'){
  const output=host.createSpan();
  const refresh=()=>output.setText(String(value()??'—').slice(0,500));
  refresh();
  return refresh;
 }
 const field=type==='select'?host.createEl('select'):host.createEl('input');
 field.setAttribute('aria-label',label);
 if(type==='select'){
  for(const entry of (Array.isArray(options.options)?options.options:String(options.options||'').split('|')).slice(0,25)){
   const opt=field.createEl('option',{text:entry.trim()});opt.value=entry.trim();
  }
 }else{
  field.type=({toggle:'checkbox',number:'number',slider:'range',date:'date'})[type]||'text';
  if(type==='number')field.step='any';
  if(type==='slider'){
   field.min=String(options.min);field.max=String(options.max);field.step=String(options.step);
  }
 }
 const refresh=()=>{
  const current=value();
  if(type==='toggle')field.checked=current===true||current==='true';
  else field.value=String(current??(type==='slider'?options.min:''));
 };
 refresh();
 const write=()=>{
  const numeric=type==='number'||type==='slider';
  const newValue=type==='toggle'?field.checked:numeric?Number(field.value):field.value;
  if(numeric&&(!field.value||!Number.isFinite(newValue)||field.validity?.valid===false))return;
  return writerV92MetaWrite(plugin,file,key,mode,()=>newValue);
 };
 field.addEventListener('change',()=>void write());
}
function writerV92MetaToken(token){
 const match=/^(INPUT|VIEW)\[([^\]\r\n]{1,220})\]$/.exec(token);
 if(!match)return null;
 if(match[1]==='VIEW'){
  const key=match[2].trim();
  return writerV92MetaKey(key)?{key,type:'view'}:null;
 }
 const input=/^(toggle|text|number|slider|date|select)(?:\(([^()]*)\))?\s*:\s*([\w-]+)$/.exec(match[2].trim());
 if(!input||!writerV92MetaKey(input[3]))return null;
 const [,type,args,key]=input;
 if(args===undefined)return type==='select'?null:{key,type,min:0,max:100,step:1};
 const values=args.split(',').map(value=>value.trim());
 if(type==='select'&&values.length<=25&&values.every(Boolean))return {key,type,options:values};
 if(type!=='slider'||values.length<2||values.length>3||!values.every(value=>/^-?\d+(?:\.\d+)?$/.test(value)))return null;
 const [min,max,step=1]=values.map(Number);
 return min>=-1e6&&max<=1e6&&max>min&&step>0&&step<=max-min?{key,type,min,max,step}:null;
}
function writerV92MetaInline(plugin,el,ctx){
 if(!writerV92MetaEnabled(plugin,'inline')||!ctx?.sourcePath)return;
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
 const doc=el.ownerDocument;
 if(!(file instanceof TFile)||file.extension!=='md'||!doc?.createTreeWalker)return;
 const walker=doc.createTreeWalker(el,4),nodes=[],refreshers=[];
 while(nodes.length<120&&walker.nextNode()){
  const node=walker.currentNode;
  if(!/\b(?:INPUT|VIEW)\[/.test(node.nodeValue||'')||node.parentElement?.closest(
   'pre,code,script,style,a,textarea,input,button,select,.cm-editor,.writer-v92-meta,.writer-v92-meta-inline'))continue;
  nodes.push(node);
 }
 for(const node of nodes){
  const text=node.nodeValue,fragment=doc.createDocumentFragment();
  let from=0;
  for(const token of text.matchAll(/\b(?:INPUT|VIEW)\[[^\]\r\n]{1,220}\]/g)){
   const spec=writerV92MetaToken(token[0]);if(!spec)continue;
   fragment.append(doc.createTextNode(text.slice(from,token.index)));
   const host=doc.createElement('span');host.className='writer-v92-meta-inline';
   const refresh=writerV92MetaField(plugin,host,file,spec.key,spec,'inline');
   if(refresh)refreshers.push(refresh);
   fragment.append(host);from=token.index+token[0].length;
  }
  if(!from)continue;
  fragment.append(doc.createTextNode(text.slice(from)));node.replaceWith(fragment);
 }
 writerV92MetaWatch(plugin,el,ctx,file,refreshers);
}
function writerV92MetaFenceField(spec){
 if(!spec||typeof spec!=='object'||Array.isArray(spec))return null;
 const key=spec.key??spec.property,type=spec.type??'text';
 if(typeof key!=='string'||!writerV92MetaKey(key)||!['toggle','text','number','slider','date','select','view'].includes(type))return null;
 const label=typeof spec.label==='string'?spec.label:'';
 if(type==='select'){
  const options=Array.isArray(spec.options)?spec.options:typeof spec.options==='string'?spec.options.split('|'):[];
  if(!options.length||options.length>25||options.some(option=>typeof option!=='string'||!option.trim()||option.length>120))return null;
  return {key,type,label,options};
 }
 if(type==='slider'){
  const {min=0,max=100,step=1}=spec;
  if(![min,max,step].every(Number.isFinite)||min< -1e6||max>1e6||max<=min||step<=0||step>max-min)return null;
  return {key,type,label,min,max,step};
 }
 return {key,type,label};
}
function writerV92MetaFenceButton(spec){
 const key=spec.property,action=spec.action??'toggle';
 if(typeof key!=='string'||!writerV92MetaKey(key))return null;
 const label=typeof spec.label==='string'?spec.label.trim().slice(0,80):'';
 if(action==='toggle')return {key,label,resolve:value=>value!==true&&value!=='true'};
 if(action==='increment'){
  const step=spec.step??1;
  if(!Number.isFinite(step)||Math.abs(step)>1000)return null;
  return {key,label,resolve:value=>{
   const amount=value==null?0:value;
   const result=typeof amount==='number'?amount+step:NaN;
   return Number.isFinite(result)?result:undefined;
  }};
 }
 const value=spec.value,scalar=typeof value==='string'&&value.length<=2000||
  typeof value==='boolean'||Number.isFinite(value);
 return action==='set'&&scalar?{key,label,resolve:()=>value}:null;
}
function writerV92MetaFences(plugin,el,ctx){
 if(!writerV92MetaEnabled(plugin,'fence')||!ctx?.sourcePath)return;
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
 if(!(file instanceof TFile)||file.extension!=='md')return;
 // Use the stock code blocks left by the renderer rather than claiming the
 // fence languages, so enabling Meta Bind later lets it own the next render.
 for(const code of Array.from(el.querySelectorAll?.('pre > code.language-meta-bind, pre > code.language-meta-bind-button')||[]).slice(0,40)){
  const source=code.textContent;
  if(!source||source.length>10000)continue;
  let spec;
  try{spec=parseYaml(source);}catch(_){continue;}
  if(!spec||typeof spec!=='object'||Array.isArray(spec))continue;
  const host=el.ownerDocument.createElement('div');
  if(code.classList.contains('language-meta-bind-button')){
   const action=writerV92MetaFenceButton(spec);
   if(!action)continue;
   const button=host.createEl('button',{text:action.label||writerUi('Atualizar propriedade','Update property'),attr:{type:'button'}});
   button.addEventListener('click',async()=>{
    if(button.disabled)return;
    button.disabled=true;
    try{await writerV92MetaWrite(plugin,file,action.key,'fence',action.resolve);}
    finally{button.disabled=false;}
   });
  }else{
   const fields=(Array.isArray(spec.fields)?spec.fields.slice(0,40):[spec]).map(writerV92MetaFenceField).filter(Boolean);
   if(!fields.length)continue;
   const refreshers=[];
   for(const field of fields){
    const refresh=writerV92MetaField(plugin,host.createDiv({cls:'writer-v92-meta'}),file,field.key,field,'fence');
    if(refresh)refreshers.push(refresh);
   }
   writerV92MetaWatch(plugin,host,ctx,file,refreshers);
  }
  code.parentElement.replaceWith(host);
 }
}
function writerV92RegisterBlocks(plugin){
 const register=(name,enabled,render)=>{
  plugin.registerMarkdownCodeBlockProcessor?.(name,(source,el,ctx)=>{
   if(!writerModuleOn(plugin,'writingWidgets')||!plugin.settings.v92Blocks.enabled||!plugin.settings.v92Blocks[enabled]){
    el.createEl('code',{text:source});return;
   }
   render(plugin,source,el,ctx);
  });
 };
 register('columns','columns',writerV92RenderColumns);
 register('progressbar','progress',writerV92RenderProgress);
 register('widgets','widgets',writerV92RenderWidget);
 register('meta-field','metaFields',writerV92RenderMeta);
 plugin.registerMarkdownPostProcessor?.((el,ctx)=>{
  writerV92MetaInline(plugin,el,ctx);
  writerV92MetaFences(plugin,el,ctx);
 },-10);
 plugin.addCommand?.({id:'v92-insert-columns',name:writerUi('Colunas: inserir layout','Columns: insert layout'),
  editorCallback:editor=>editor.replaceSelection([
   '','~~~columns','columns: 2','### '+writerUi('Coluna 1','Column 1'),writerUi('Texto aqui.','Text here.'),
   '--- end-column ---','### '+writerUi('Coluna 2','Column 2'),writerUi('Texto aqui.','Text here.'),'~~~',''
  ].join('\n'))});
 plugin.addCommand?.({id:'v92-insert-progress',name:writerUi('Progresso: inserir barra','Progress: insert bar'),
  editorCallback:editor=>editor.replaceSelection('\n\`\`\`progressbar\nkind: manual\nname: {percentage}\nvalue: 30\nmin: 0\nmax: 100\n\`\`\`\n')});
 plugin.addCommand?.({id:'v92-insert-meta-field',name:writerUi('Meta Bind: inserir campo seguro','Meta Bind: insert safe field'),
  editorCallback:editor=>editor.replaceSelection('\n\`\`\`meta-field\nproperty: done\ntype: toggle\nlabel: Concluído\n\`\`\`\n')});
}
function writerV92BlockSettings(plugin,panel){
 const cfg=plugin.settings.v92Blocks;
 panel.createEl('h3',{text:writerUi('Blocos interativos e colunas','Interactive blocks & columns')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Renderizadores independentes de colunas, barras de progresso, widgets e campos de propriedades. Os campos alteram somente a propriedade YAML indicada; não executam JavaScript.',
  'Independent column, progress, widget and frontmatter-field renderers. Fields only update the named YAML property; no JavaScript execution.'
 )});
 for(const [key,pt,en] of [['enabled','Ativar renderizadores','Enable renderers'],['columns','Colunas Markdown','Markdown columns'],
  ['progress','Barras de progresso','Progress bars'],['widgets','Widgets de notas','Note widgets'],['metaFields','Campos vinculados ao YAML','YAML-bound fields']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 }
 new Setting(panel).setName(writerUi('Campos INPUT e VIEW na leitura','Inline INPUT and VIEW fields'))
  .setDesc(writerUi('No modo Leitura, INPUT[toggle:done] edita a propriedade YAML done e VIEW[done] mostra seu valor. O plugin Meta Bind tem prioridade.',
   'In Reading view, INPUT[toggle:done] edits the done YAML property and VIEW[done] shows its value. The Meta Bind plugin takes priority.'))
  .addToggle(t=>t.setValue(cfg.inlineMetaFields===true).onChange(async value=>{cfg.inlineMetaFields=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Blocos antigos do Meta Bind','Legacy Meta Bind blocks'))
  .setDesc(writerUi('Renderiza campos YAML simples e botões set, toggle e increment dos blocos meta-bind e meta-bind-button. O plugin Meta Bind tem prioridade.',
   'Render simple YAML fields and set, toggle and increment buttons in meta-bind and meta-bind-button blocks. The Meta Bind plugin takes priority.'))
  .addToggle(t=>t.setValue(cfg.metaBindFences===true).onChange(async value=>{cfg.metaBindFences=value;await plugin.saveSettings();}));
}
