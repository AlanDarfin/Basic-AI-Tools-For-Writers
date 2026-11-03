'use strict';
/* v9.2.0: independent writing widgets inspired by Meta Bind, Multi Column Markdown,
 * Progressbar and Obsidian Widgets. No GPL code is copied or bundled. */
function writerV92BlocksMerge(settings){
 const old=settings.v92Blocks&&typeof settings.v92Blocks==='object'?settings.v92Blocks:{};
 return settings.v92Blocks={enabled:true,columns:true,progress:true,widgets:true,metaFields:true,...old};
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
 const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
 const elapsed=(start,end)=>Math.floor((startOfDay(now)-startOfDay(start))/86400000)+1;
 if(kind==='day-year'){
  const start=new Date(now.getFullYear(),0,1),end=new Date(now.getFullYear()+1,0,1);
  max=Math.round((end-start)/86400000);value=elapsed(start,end);
 }else if(kind==='day-month'){
  const start=new Date(now.getFullYear(),now.getMonth(),1),end=new Date(now.getFullYear(),now.getMonth()+1,1);
  max=Math.round((end-start)/86400000);value=elapsed(start,end);
 }else if(kind==='day-week'){
  max=7;value=(now.getDay()+6)%7+1;
 }else if(kind==='month'){max=12;value=now.getMonth()+1;}
 else if(kind==='day-custom'){
  const start=new Date(String(options.min||'')+'T00:00:00');
  const end=new Date(String(options.max||'')+'T00:00:00');
  if(Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&end>start){
   max=Math.round((end-start)/86400000)+1;value=elapsed(start,end);
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
function writerV92RenderProgress(plugin,source,el,ctx){
 const options=writerV92BlockOptions(source);
 const key=String(options.id||'').slice(0,80);
 const values=plugin.settings.v92ProgressValues||(plugin.settings.v92ProgressValues={});
 const isManual=!['day-year','day-month','day-week','day-custom','month'].includes(options.kind);
 const host=el.createDiv({cls:'writer-v92-progress'});
 const name=host.createEl('label',{cls:'writer-v92-progress-label'});
 const bar=host.createDiv({cls:'writer-v92-progress-track',attr:{role:'progressbar','aria-valuemin':'0','aria-valuemax':'100'}});
 const fill=bar.createDiv({cls:'writer-v92-progress-fill'});
 const controls=host.createDiv({cls:'writer-v92-progress-controls'});
 const redraw=()=>{
  const cfg={...options};
  if(key&&Object.prototype.hasOwnProperty.call(values,key))cfg.value=values[key];
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
     const d=writerV92ProgressData({...options,value:values[key]??options.value});
     values[key]=Math.max(d.min,Math.min(d.max,d.value+delta));
     void plugin.saveSettings();
     redraw();
     for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[])
      for(const node of leaf.view?.containerEl?.querySelectorAll?.('.writer-v92-progress[data-progress-id]')||[])
       if(node.dataset.progressId===key)node.dispatchEvent(new Event('writer-progress-sync'));
    });
  }
  host.dataset.progressId=key;
  host.addEventListener('writer-progress-sync',redraw);
 }
 redraw();
}
function writerV92RenderColumns(plugin,source,el,ctx){
 const match=source.match(/^\s*columns?\s*:\s*(\d+)\s*$/mi);
 const count=Math.round(writerV92Clamp(match?.[1],1,4,2));
 const parts=source.replace(/^\s*columns?\s*:\s*\d+\s*$/mi,'').split(/^\s*(?:---\s*(?:end-column|column-end|column-break)\s*---|:::columnbreak)\s*$/mi).slice(0,4);
 const host=el.createDiv({cls:'writer-v92-columns'});
 host.style.setProperty('--writer-v92-columns',String(Math.max(1,Math.min(count,parts.length))));
 for(const part of parts){
  const cell=host.createDiv({cls:'writer-v92-column markdown-rendered'});
  void MarkdownRenderer.render(plugin.app,part.trim().slice(0,15000),cell,ctx.sourcePath,ctx);
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
  const id=String(options.id||ctx.sourcePath||'default').slice(0,160);
  const values=plugin.settings.v92CounterValues||(plugin.settings.v92CounterValues={});
  const value=host.createEl('strong');
  const draw=()=>value.setText(String(values[id]??writerV92Clamp(options.startvalue,-1e8,1e8,0)));
  draw();
  const delta=writerV92Clamp(options.increment,0.01,10000,1);
  for(const [text,change] of [['−',-delta],['+',delta],['↺',null]]){
   host.createEl('button',{text,attr:{type:'button'}}).addEventListener('click',()=>{
    values[id]=change===null?writerV92Clamp(options.startvalue,-1e8,1e8,0):
     writerV92Clamp((values[id]??Number(options.startvalue)||0)+change,-1e8,1e8,0);
    void plugin.saveSettings();draw();
   });
  }
  if(options.text)host.createEl('small',{text:options.text.slice(0,160)});
 }else host.createEl('p',{text:writerUi('Tipo de widget não suportado.','Unsupported widget type.')});
}
function writerV92MetaValue(plugin,ctx,key){
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
 if(!(file instanceof TFile))return {file:null,value:undefined};
 const front=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
 return {file,value:front[key]};
}
function writerV92RenderMeta(plugin,source,el,ctx){
 const options=writerV92BlockOptions(source),key=String(options.property||'').trim();
 if(!/^[a-zA-Z][\w-]{0,79}$/.test(key)){
  el.createEl('small',{text:writerUi('Defina property: nome_da_propriedade','Set property: property_name')});return;
 }
 const {file,value}=writerV92MetaValue(plugin,ctx,key);
 if(!file)return;
 const type=['toggle','text','number','select','view'].includes(options.type)?options.type:'view';
 const host=el.createDiv({cls:'writer-v92-meta'});
 host.createEl('label',{text:String(options.label||key).slice(0,90)});
 if(type==='view'){host.createSpan({text:String(value??'—').slice(0,500)});return;}
 const field=type==='select'?host.createEl('select'):host.createEl('input');
 if(type==='select'){
  for(const entry of String(options.options||'').split('|').slice(0,25)){
   const opt=field.createEl('option',{text:entry.trim()});opt.value=entry.trim();
  }
  field.value=String(value??'');
 }else{
  field.type=type==='toggle'?'checkbox':type==='number'?'number':'text';
  if(type==='toggle')field.checked=value===true||value==='true';
  else field.value=String(value??'');
 }
 const write=async()=>{
  if(!plugin.app.fileManager?.processFrontMatter)return;
  const newValue=type==='toggle'?field.checked:type==='number'?Number(field.value):field.value;
  try{await plugin.app.fileManager.processFrontMatter(file,front=>{front[key]=newValue;});}
  catch(error){new Notice(writerUi('Não foi possível salvar a propriedade.','Could not save property.'));}
 };
 field.addEventListener(type==='text'?'change':'change',()=>void write());
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
 plugin.addCommand?.({id:'v92-insert-columns',name:writerUi('Colunas: inserir layout','Columns: insert layout'),
  editorCallback:editor=>editor.replaceSelection('\n\`\`\`columns\ncolumns: 2\n### Coluna 1\nTexto aqui.\n--- end-column ---\n### Coluna 2\nTexto aqui.\n\`\`\`\n')});
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
}
