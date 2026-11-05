'use strict';
/* Local, bounded Markdown database with safe arithmetic formulas and relation rollups. */
function writerV107DbConfig(settings){
 const old=settings.v107Db&&typeof settings.v107Db==='object'?settings.v107Db:{};
 return settings.v107Db={enabled:true,maxFiles:500,editable:true,...old,maxFiles:Math.max(25,Math.min(2000,Number(old.maxFiles)||500))};
}
function writerV107DbSpec(source){
 const s={folder:'',columns:['file','tags'],filter:'',sort:'file',order:'asc',limit:80,formulas:[],rollups:[]};
 for(const line of String(source||'').slice(0,6000).split(/\r?\n/)){
  const m=/^\s*(folder|columns|filter|sort|order|limit|formula|rollup)\s*:\s*(.*?)\s*$/i.exec(line);if(!m)continue;
  const key=m[1].toLowerCase(),value=m[2].trim().replace(/^["']|["']$/g,'');
  if(key==='columns')s.columns=value.split(',').map(x=>x.trim()).filter(x=>/^[\w-]{1,60}$/.test(x)).slice(0,24);
  else if(key==='formula'){const f=/^([\w-]{1,35})\s*=\s*(.{1,140})$/.exec(value);if(f&&s.formulas.length<8)s.formulas.push({name:f[1],expression:f[2]});}
  else if(key==='rollup'){const f=/^([\w-]{1,35})\s*=\s*([\w-]{1,40})\.([\w-]{1,40})\s*\|\s*(count|sum|avg|min|max)$/i.exec(value);if(f&&s.rollups.length<8)s.rollups.push({name:f[1],relation:f[2],field:f[3],op:f[4].toLowerCase()});}
  else if(key==='limit')s.limit=Math.max(5,Math.min(300,Number(value)||80));
  else if(key==='order')s.order=value==='desc'?'desc':'asc';
  else if(key==='folder')s.folder=value.replace(/^\/|\/$/g,'').slice(0,260);
  else s[key]=value.slice(0,220);
 }
 return s;
}
function writerV107DbFormula(text,record){
 const source=String(text||'').replace(/\s+/g,'');
 const parts=source.match(/[a-z_][a-z0-9_-]*|\d+(?:\.\d+)?|[()+*/-]/gi)||[];
 if(source.length>140||parts.length>64||parts.join('')!==source)return null;
 let n=0;
 const atom=()=>{
  const x=parts[n++];
  if(x==='('){const v=add();return parts[n++]==')'?v:NaN;}
  if(x==='-')return -atom();
  if(!x)return NaN;
  return /^\d/.test(x)?Number(x):Number(record[x]??0);
 };
 const multiply=()=>{let x=atom();while(parts[n]==='*'||parts[n]==='/'){const op=parts[n++],y=atom();x=op==='*'?x*y:y===0?NaN:x/y;}return x;};
 const add=()=>{let x=multiply();while(parts[n]==='+'||parts[n]==='-'){const op=parts[n++],y=multiply();x=op==='+'?x+y:x-y;}return x;};
 const value=add();return n===parts.length&&Number.isFinite(value)?Math.round(value*1000)/1000:null;
}
function writerV107DbMatch(record,expression){
 if(!expression)return true;
 const m=/^([\w-]+)\s*(>=|<=|!=|=|>|<|contains)\s*(.+)$/i.exec(expression);if(!m)return true;
 const x=String(record[m[1]]??''),y=m[3].trim().replace(/^["']|["']$/g,'');
 const numeric=x!==''&&y!==''&&Number.isFinite(Number(x))&&Number.isFinite(Number(y));
 const cmp=numeric?Math.sign(Number(x)-Number(y)):x.toLowerCase().localeCompare(y.toLowerCase());
 switch(m[2].toLowerCase()){
  case '=':return cmp===0;case '!=':return cmp!==0;case '>':return cmp>0;case '<':return cmp<0;
  case '>=':return cmp>=0;case '<=':return cmp<=0;case 'contains':return x.toLowerCase().includes(y.toLowerCase());
 }
 return false;
}
function writerV107DbMetadata(plugin,file){
 const fm=plugin.app.metadataCache.getFileCache(file)?.frontmatter||{};
 return {...fm,file:file.basename,path:file.path,created:file.stat?.ctime||0,modified:file.stat?.mtime||0,
  tags:Array.isArray(fm.tags)?fm.tags.join(', '):fm.tags||''};
}
function writerV107DbRollup(plugin,file,record,rollup){
 const paths=(Array.isArray(record[rollup.relation])?record[rollup.relation]:String(record[rollup.relation]||'').split(',')).slice(0,70);
 const related=[];
 for(const path of paths){
  const dest=String(path||'').replace(/^\[\[|\]\]$/g,'').split('|')[0].trim();
  const linked=plugin.app.metadataCache.getFirstLinkpathDest(dest,file.path);
  if(linked instanceof TFile&&!related.some(x=>x.path===linked.path))related.push(linked);
 }
 if(rollup.op==='count')return related.length;
 const nums=related.map(f=>Number(writerV107DbMetadata(plugin,f)[rollup.field])).filter(Number.isFinite);
 if(!nums.length)return null;
 const sum=nums.reduce((a,b)=>a+b,0);
 return rollup.op==='sum'?sum:rollup.op==='avg'?Math.round(sum/nums.length*100)/100:rollup.op==='min'?Math.min(...nums):Math.max(...nums);
}
function writerV107DbRows(plugin,spec){
 const max=writerV107DbConfig(plugin.settings).maxFiles;
 const files=plugin.app.vault.getMarkdownFiles().filter(f=>!spec.folder||f.path.startsWith(spec.folder+'/')).slice(0,max);
 const rows=[];
 for(const file of files){
  const data=writerV107DbMetadata(plugin,file);
  if(!writerV107DbMatch(data,spec.filter))continue;
  for(const formula of spec.formulas)data[formula.name]=writerV107DbFormula(formula.expression,data);
  for(const rollup of spec.rollups)data[rollup.name]=writerV107DbRollup(plugin,file,data,rollup);
  rows.push({file,data});
 }
 const rev=spec.order==='desc'?-1:1;
 rows.sort((a,b)=>rev*String(a.data[spec.sort]??'').localeCompare(String(b.data[spec.sort]??''),undefined,{numeric:true})||a.file.path.localeCompare(b.file.path));
 return rows.slice(0,spec.limit);
}
function writerV107DbEdit(plugin,item,key,refresh){
 if(!plugin.settings.v107Db.editable||['file','path','created','modified'].includes(key))return;
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Editar propriedade','Edit property'));
 modal.onOpen=()=>{
  let value=String(item.data[key]??'');
  new Setting(modal.contentEl).setName(key).addTextArea(t=>t.setValue(value).onChange(v=>{value=v.slice(0,3000);}));
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Salvar com snapshot','Save with snapshot')).onClick(async()=>{
   b.setDisabled(true);
   try{
    await plugin.writerSnapshots?.create?.(item.file,'Before database edit');
    await plugin.app.fileManager.processFrontMatter(item.file,fm=>{fm[key]=value;});
    modal.close();refresh();
   }catch(e){new Notice(String(e.message||e));b.setDisabled(false);}
  }));
 };modal.open();
}
function writerV107DbCsv(rows,cols){
 const escape=v=>{const raw=String(v??''),safe=/^[=+\-@\t\r]/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"';};
 return [cols.map(escape).join(','),...rows.map(r=>cols.map(c=>escape(r.data[c])).join(','))].join('\r\n');
}
function writerV107DbRender(plugin,source,element,ctx){
 const cfg=plugin.settings.v107Db,spec=writerV107DbSpec(source);
 const root=element.createDiv({cls:'writer-v107-db'});
 if(!cfg.enabled){root.setText(writerUi('Banco de notas desativado','Note database disabled'));return;}
 const top=root.createDiv({cls:'writer-v107-db-top'});
 top.createEl('strong',{text:writerUi('Banco Markdown','Markdown database')});
 const count=top.createEl('small');
 const filter=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar neste banco…','Filter database…')}});
 const scroller=root.createDiv({cls:'writer-v107-db-scroll'});
 const cols=[...new Set([...spec.columns,...spec.formulas.map(f=>f.name),...spec.rollups.map(f=>f.name)])];
 let rows=[];
 const draw=()=>{
  scroller.empty();const q=filter.value.toLowerCase();
  const shown=rows.filter(r=>!q||cols.some(k=>String(r.data[k]??'').toLowerCase().includes(q)));
  count.setText(shown.length+' / '+rows.length);
  const table=scroller.createEl('table'),thead=table.createEl('thead').createEl('tr');
  for(const col of cols){const b=thead.createEl('th').createEl('button',{text:col});b.addEventListener('click',()=>{spec.sort=col;spec.order=spec.order==='asc'?'desc':'asc';refresh();});}
  const body=table.createEl('tbody');
  for(const row of shown){
   const tr=body.createEl('tr');
   for(const col of cols){
    const cell=tr.createEl('td');
    const b=cell.createEl('button',{text:String(row.data[col]??'—'),cls:'writer-v107-db-cell'});
    if(col==='file'||col==='path')b.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(row.file));
    else{
     b.disabled=!cfg.editable||col==='tags'||spec.formulas.some(f=>f.name===col)||spec.rollups.some(f=>f.name===col);
     if(!b.disabled)b.addEventListener('click',()=>writerV107DbEdit(plugin,row,col,refresh));
    }
   }
  }
 };
 const refresh=()=>{rows=writerV107DbRows(plugin,spec);draw();};
 const actions=top.createDiv({cls:'writer-v10-discovery-actions'});
 actions.createEl('button',{text:writerUi('Atualizar','Refresh')}).addEventListener('click',refresh);
 actions.createEl('button',{text:'CSV'}).addEventListener('click',async()=>{
  try{const path='Database-'+Date.now()+'.csv';await plugin.app.vault.create(path,writerV107DbCsv(rows,cols));new Notice(path);}
  catch(e){new Notice(String(e.message||e));}
 });
 filter.addEventListener('input',draw);refresh();
}
function writerV107DbRegister(plugin){
 writerV107DbConfig(plugin.settings);
 for(const lang of ['writer-database','basic-database'])plugin.registerMarkdownCodeBlockProcessor(lang,(source,element,ctx)=>writerV107DbRender(plugin,source,element,ctx));
 plugin.addCommand({id:'v107-insert-database',name:writerUi('Make.md: inserir banco de dados','Make.md: insert database'),editorCallback:editor=>{
  const fence=String.fromCharCode(96).repeat(3);
  editor.replaceSelection(['',fence+'writer-database','folder:','columns: file, status, priority','filter: status != done','sort: modified','order: desc','formula: score = priority * 2','rollup: total = related.pages | sum',fence,''].join('\n'));
 }});
}
function writerV107DbSettings(plugin,panel){
 const cfg=plugin.settings.v107Db;
 panel.createEl('h3',{text:writerUi('Make.md — bases e fórmulas','Make.md — databases and formulas')});
 for(const [key,pt,en] of [['enabled','Bases Markdown','Markdown databases'],['editable','Editar células','Edit cells']]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 }
 new Setting(panel).setName(writerUi('Notas máximas por banco','Maximum notes per database'))
  .addSlider(t=>t.setLimits(25,2000,25).setValue(cfg.maxFiles).setDynamicTooltip().onChange(async v=>{cfg.maxFiles=v;await plugin.saveSettings();}));
}
