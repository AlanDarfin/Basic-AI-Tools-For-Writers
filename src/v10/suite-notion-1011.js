'use strict';
/* Basic 10.11 — extends existing Markdown database engine with Notion-inspired
 * local views. No duplicate Notion Suite registration or proprietary storage. */
const WRITER_V1011_DB_VIEWS=['table','board','gallery','list','calendar','timeline','chart'];
function writerV1011NotionCfg(settings){
 const old=settings.v1011Notion&&typeof settings.v1011Notion==='object'&&!Array.isArray(settings.v1011Notion)?settings.v1011Notion:{};
 return settings.v1011Notion=Object.assign(old,{enabled:true,maxShown:160,allowNew:true,...old,
  maxShown:Math.max(20,Math.min(500,Number(old.maxShown)||160))});
}
function writerV1011NotionSpec(source){
 const base=typeof writerV107DbSpec==='function'?writerV107DbSpec(source):{columns:['file','status'],limit:80,view:'table'};
 const opts={database:'',folder:'',view:'table',title:'',cover:'banner',date:'date',start:'start',end:'end',
  group:'status',chart:'',calculate:'count',parent:'parent',subgroup:'',...base};
 for(const line of String(source||'').slice(0,8000).split(/\r?\n/)){
  const m=/^\s*(database|folder|view|title|cover|date|start|end|group|chart|calculate|parent|subgroup)\s*:\s*(.*?)\s*$/i.exec(line);
  if(!m)continue;
  opts[m[1].toLowerCase()]=m[2].replace(/^["']|["']$/g,'').slice(0,250);
 }
 opts.view=WRITER_V1011_DB_VIEWS.includes(opts.view)?opts.view:'table';
 if(!opts.folder&&opts.database){
  const db=opts.database.replace(/^\/+|\/+$/g,'');
  if(!/^\.\.?$/.test(db)&&!db.split('/').some(p=>p==='..'||p.startsWith('.')))
   opts.folder='Databases/'+db;
 }
 if(opts.folder?.split('/').some(p=>p==='..'||p.startsWith('.')))opts.folder='';
 opts.limit=Math.max(5,Math.min(500,Number(opts.limit)||80));
 opts.columns=Array.isArray(opts.columns)?opts.columns:['file','status'];
 return opts;
}
function writerV1011NotionDate(value){
 const raw=String(value??'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return '';
 const date=new Date(raw+'T12:00:00');
 if(!Number.isFinite(date.getTime())||date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')!==raw)return '';
 return raw;
}
function writerV1011NotionCover(plugin,row,key){
 const raw=String(row.data[key]||row.data.banner||row.data.cover||'').trim();
 if(!raw||raw.length>700)return '';
 if(/^https:\/\//i.test(raw))return raw;
 const unwrapped=raw.replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0];
 const target=plugin.app.metadataCache.getFirstLinkpathDest?.(unwrapped,row.file.path)||
  plugin.app.vault.getAbstractFileByPath?.(unwrapped);
 return target?.extension?plugin.app.vault.getResourcePath(target):'';
}
function writerV1011NotionChart(rows,group,value='count'){
 const totals=new Map();
 for(const row of rows){
  const key=String(row.data[group]??'').trim()||'—';
  const current=totals.get(key)||0;
  const n=value==='count'?1:Number(row.data[value]);
  totals.set(key,current+(Number.isFinite(n)?n:0));
 }
 return [...totals].sort((a,b)=>b[1]-a[1]).slice(0,20);
}
function writerV1011NotionSafeName(value){
 return String(value||'').replace(/[\x00-\x1f\\/:*?"<>|#\[\]]/g,' ').replace(/\s+/g,' ').trim().replace(/^\.+\s*/,'').slice(0,75);
}
async function writerV1011NotionNew(plugin,spec,label){
 const folder=String(spec.folder||'').replace(/\/+$/,'');
 if(!folder||folder.split('/').some(p=>!p||p==='.'||p==='..'||p.startsWith('.')))throw Error('Invalid database folder');
 const name=writerV1011NotionSafeName(label);
 if(!name)throw Error(writerUi('Informe o título do item.','Enter a row title.'));
 let prefix='';
 for(const segment of folder.split('/')){
  prefix=prefix?prefix+'/'+segment:segment;
  const entry=plugin.app.vault.getAbstractFileByPath(prefix);
  if(entry&&entry.extension)throw Error('Folder path points to a file');
  if(!entry)await plugin.app.vault.createFolder(prefix);
 }
 let path=folder+'/'+name+'.md',i=2;
 while(plugin.app.vault.getAbstractFileByPath(path)&&i<101)path=folder+'/'+name+' '+i+++'.md';
 if(plugin.app.vault.getAbstractFileByPath(path))throw Error('Too many similarly named items');
 const props={title:name};
 if(spec.view==='board'&&/^[a-z][a-z0-9_-]{0,40}$/i.test(spec.group||'')&&
  !['__proto__','constructor','prototype','file','path'].includes(spec.group))props[spec.group]='Backlog';
 const fm='---\n'+Object.entries(props).map(([key,val])=>key+': '+JSON.stringify(val)).join('\n')+'\n---\n\n';
 const file=await plugin.app.vault.create(path,fm+'# '+name+'\n');
 await plugin.app.workspace.getLeaf('tab').openFile(file);
 return file;
}
function writerV1011NotionRender(plugin,source,element,ctx){
 const cfg=writerV1011NotionCfg(plugin.settings);
 const shell=element.createDiv({cls:'writer-v1011-notion'});
 if(!cfg.enabled||plugin.settings.v107AdvancedEnabled===false||plugin.settings.v107Db?.enabled===false){
  shell.setText(writerUi('Visualizações de banco desativadas','Database views disabled'));return;
 }
 const spec=writerV1011NotionSpec(source);
 if(!spec.folder){
  shell.createEl('p',{text:writerUi('Informe folder: ou database: no bloco.','Specify folder: or database: in the block.')});return;
 }
 let rows=[];
 try{rows=writerV107DbRows(plugin,{...spec,limit:Math.min(cfg.maxShown,spec.limit)});}
 catch(error){shell.createEl('p',{text:String(error.message||error)});return;}
 const top=shell.createDiv({cls:'writer-v1011-notion-toolbar'});
 top.createEl('strong',{text:spec.title||spec.database||spec.folder.split('/').pop()});
 top.createEl('small',{text:rows.length+' '+writerUi('itens','items')});
 const select=top.createEl('select',{attr:{'aria-label':writerUi('Visualização','View')}});
 for(const mode of WRITER_V1011_DB_VIEWS){
  const option=select.createEl('option',{text:({table:'Tabela',board:'Quadro',gallery:'Galeria',
   list:'Lista',calendar:'Calendário',timeline:'Linha do tempo',chart:'Gráfico'})[mode]});
  option.value=mode;
 }select.value=spec.view;
 const query=top.createEl('input',{attr:{type:'search',placeholder:writerUi('Pesquisar itens…','Search rows…'),
  'aria-label':writerUi('Pesquisar no banco','Search database')}});
 if(cfg.allowNew)top.createEl('button',{text:writerUi('+ Nova nota','+ New note')}).addEventListener('click',()=>{
  const modal=new Modal(plugin.app);modal.setTitle(writerUi('Novo item','New item'));let title='';
  modal.onOpen=()=>{
   new Setting(modal.contentEl).setName(writerUi('Título da nota','Note title')).addText(t=>t.onChange(v=>title=v));
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Criar','Create')).setCta().onClick(async()=>{
    try{await writerV1011NotionNew(plugin,spec,title);modal.close();}
    catch(error){new Notice(String(error.message||error));}
   }));
  };modal.open();
 });
 const host=shell.createDiv({cls:'writer-v1011-notion-body'});
 let month=(new Date()).toISOString().slice(0,7);
 const link=(parent,row,detail=false)=>{
  const button=parent.createEl('button',{cls:'writer-v1011-notion-row',type:'button'});
  button.createEl('strong',{text:row.file.basename});
  if(detail){
   for(const key of spec.columns.filter(x=>x!=='file'&&x!=='path').slice(0,4))
    button.createEl('small',{text:key+': '+String(row.data[key]??'—')});
  }
  button.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(row.file));
  return button;
 };
 const draw=()=>{
  host.empty();
  const q=query.value.trim().toLowerCase();
  const shown=rows.filter(row=>!q||row.file.path.toLowerCase().includes(q)||
   spec.columns.some(k=>String(row.data[k]??'').toLowerCase().includes(q)));
  const mode=select.value;
  if(!shown.length){host.createEl('p',{text:writerUi('Nenhum item encontrado.','No matching rows.')});return;}
  if(mode==='list'){
   const list=host.createDiv({cls:'writer-v1011-notion-list'});
   for(const row of shown){
    const item=list.createDiv({cls:'writer-v1011-notion-list-item'});
    if(spec.parent&&row.data[spec.parent]){
     item.addClass('is-child');
     item.title=writerUi('Subitem de: ','Child of: ')+String(row.data[spec.parent]).slice(0,120);
    }
    link(item,row,true);
   }
  }else if(mode==='gallery'){
   const gallery=host.createDiv({cls:'writer-v1011-notion-gallery'});
   for(const row of shown){
    const card=gallery.createDiv({cls:'writer-v1011-notion-gallery-card'});
    const url=writerV1011NotionCover(plugin,row,spec.cover);
    if(url){
     const image=card.createEl('img',{attr:{src:url,alt:row.file.basename,loading:'lazy'}});
     image.addEventListener('error',()=>image.remove());
    }
    link(card,row,true);
   }
  }else if(mode==='board'){
   const groups=new Map();
   for(const row of shown){
    const name=String(row.data[spec.group||'status']??'—');
    if(!groups.has(name))groups.set(name,[]);
    groups.get(name).push(row);
   }
   const board=host.createDiv({cls:'writer-v1011-notion-board'});
   for(const [name,items] of groups){
    const lane=board.createDiv({cls:'writer-v1011-notion-lane'});
    lane.createEl('h5',{text:name+' · '+items.length});
    const canMove=plugin.settings.v107Db?.editable&&typeof writerV11DbChangeGroup==='function'&&typeof writerV11DbPropertyKey==='function'&&writerV11DbPropertyKey(spec.group);
    if(canMove){
     lane.addEventListener('dragover',ev=>{if(ev.dataTransfer?.types.includes('text/plain'))ev.preventDefault();});
     lane.addEventListener('drop',ev=>{
      const data=ev.dataTransfer?.getData('text/plain')||'';
      if(!data.startsWith('basic-v11:'))return;
      ev.preventDefault();
      const source=shown.find(x=>x.file.path===data.slice('basic-v11:'.length));
      if(!source)return;
      void writerV11DbChangeGroup(plugin,source,spec.group,name).then(()=>{
       element.empty();writerV1011NotionRender(plugin,sourceText,element,ctx);
      }).catch(error=>new Notice(String(error.message||error)));
     });
    }
    for(const row of items){
     const button=link(lane,row,true);
     if(!canMove)continue;
     button.draggable=true;
     button.addEventListener('dragstart',ev=>{
      ev.dataTransfer?.setData('text/plain','basic-v11:'+row.file.path);
      if(ev.dataTransfer)ev.dataTransfer.effectAllowed='move';
     });
     const change=lane.createEl('select',{cls:'writer-v11-db-move',attr:{'aria-label':writerUi('Mover cartão: ','Move card: ')+row.file.basename}});
     for(const value of groups.keys()){
      const option=change.createEl('option',{text:value});option.value=value;
     }
     change.value=name;
     change.addEventListener('click',ev=>ev.stopPropagation());
     change.addEventListener('change',async()=>{
      change.disabled=true;
      try{
       await writerV11DbChangeGroup(plugin,row,spec.group,change.value);
       element.empty();writerV1011NotionRender(plugin,sourceText,element,ctx);
      }catch(error){new Notice(String(error.message||error));change.value=name;change.disabled=false;}
     });
    }
   }
  }else if(mode==='chart'){
   const data=writerV1011NotionChart(shown,spec.group||'status',spec.calculate||'count');
   const max=Math.max(1,...data.map(pair=>pair[1]));
   for(const [label,total] of data){
    const bar=host.createDiv({cls:'writer-v1011-notion-chart-row'});
    bar.createEl('span',{text:label});
    const track=bar.createDiv({cls:'writer-v1011-notion-chart-track'});
    const fill=track.createDiv({cls:'writer-v1011-notion-chart-fill'});
    fill.style.width=Math.max(0,Math.min(100,total/max*100))+'%';
    bar.createEl('small',{text:String(Math.round(total*100)/100)});
   }
  }else if(mode==='timeline'){
   const timeline=host.createDiv({cls:'writer-v1011-notion-timeline'});
   for(const row of shown){
    const start=writerV1011NotionDate(row.data[spec.start]),end=writerV1011NotionDate(row.data[spec.end]||row.data[spec.start]);
    if(!start)continue;
    const item=timeline.createDiv({cls:'writer-v1011-notion-timeline-item'});
    item.createEl('span',{text:start+' → '+(end||start)});
    link(item,row);const duration=Math.max(1,Math.min(31,Math.round(
     (new Date((end||start)+'T12:00:00')-new Date(start+'T12:00:00'))/86400000)+1));
    const track=item.createDiv({cls:'writer-v1011-notion-timeline-track'});
    const fill=track.createDiv({cls:'writer-v1011-notion-timeline-fill'});
    fill.style.width=Math.round(duration/31*100)+'%';
   }
  }else if(mode==='calendar'){
   const controls=host.createDiv({cls:'writer-v1011-notion-month'});
   const title=controls.createEl('strong',{text:month});
   const shift=change=>{const date=new Date(month+'-15T12:00:00');
    date.setMonth(date.getMonth()+change);
    month=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');draw();
   };
   controls.createEl('button',{text:'‹'}).addEventListener('click',()=>shift(-1));
   controls.createEl('button',{text:'›'}).addEventListener('click',()=>shift(1));
   const cells=host.createDiv({cls:'writer-v1011-notion-calendar'});
   const dayMap=new Map();
   for(const row of shown){
    const day=writerV1011NotionDate(row.data[spec.date]);if(!day||!day.startsWith(month))continue;
    if(!dayMap.has(day))dayMap.set(day,[]);dayMap.get(day).push(row);
   }
   const days=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
   for(let day=1;day<=days;day++){
    const key=month+'-'+String(day).padStart(2,'0');
    const cell=cells.createDiv({cls:'writer-v1011-notion-day'});
    cell.createEl('span',{text:String(day)});
    for(const row of (dayMap.get(key)||[]).slice(0,5))link(cell,row);
   }
  }else{
   const scroller=host.createDiv({cls:'writer-v1011-notion-scroll'});
   const table=scroller.createEl('table'),head=table.createEl('thead').createEl('tr');
   for(const col of spec.columns)head.createEl('th',{text:col});
   const body=table.createEl('tbody');
   for(const row of shown){
    const tr=body.createEl('tr');
    for(const col of spec.columns){
     const cell=tr.createEl('td');
     const btn=cell.createEl('button',{cls:'writer-v1011-notion-cell',text:String(row.data[col]??'—')});
     const derived=spec.formulas?.some(f=>f.name===col)||spec.rollups?.some(f=>f.name===col);
     if(col==='file'||col==='path')btn.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(row.file));
     else if(!derived&&plugin.settings.v107Db?.editable)
      btn.addEventListener('click',()=>writerV107DbEdit(plugin,row,col,()=>{element.empty();writerV1011NotionRender(plugin,source,element,ctx);}));
     else btn.disabled=true;
    }
   }
  }
 };
 select.addEventListener('change',draw);
 query.addEventListener('input',draw);draw();
}
function writerV1011NotionRegister(plugin){
 writerV1011NotionCfg(plugin.settings);
 // Own block syntax prevents conflicts with the standalone Notion Suite plugin.
 for(const name of ['basic-suite-db','basic-suite-chart'])
  plugin.registerMarkdownCodeBlockProcessor?.(name,(source,element,ctx)=>
   writerV1011NotionRender(plugin,name==='basic-suite-chart'?'view: chart\n'+source:source,element,ctx));
 plugin.addCommand({id:'v1011-insert-database-view',name:writerUi('Bancos: inserir visualização avançada','Databases: insert advanced view'),
  editorCallback:editor=>{
   const fence=String.fromCharCode(96).repeat(3);
   editor.replaceSelection(['',fence+'basic-suite-db','folder: Databases/Tarefas',
    'view: gallery','columns: file, status, due','cover: banner','group: status','sort: modified',
    'order: desc',fence,''].join('\n'));
  }});
}
function writerV1011NotionSettings(plugin,panel){
 const cfg=writerV1011NotionCfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('Bancos e visualizações','Databases and views')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Visualize notas Markdown em listas, galerias, quadros, calendários, linhas do tempo e gráficos com o bloco basic-suite-db.',
  'View Markdown notes as lists, galleries, boards, calendars, timelines and charts using the basic-suite-db block.')});
 new Setting(panel).setName(writerUi('Habilitar visualizações extras','Enable additional views'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Permitir criar novas notas pelo banco','Allow creating notes from a view'))
  .addToggle(t=>t.setValue(cfg.allowNew).onChange(async v=>{cfg.allowNew=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Máximo de itens visíveis','Maximum visible items'))
  .addSlider(t=>t.setLimits(20,500,20).setDynamicTooltip().setValue(cfg.maxShown).onChange(async v=>{
   cfg.maxShown=v;await plugin.saveSettings();
  }));
}
