'use strict';
/* v10.1 local writing utilities: no third-party executables, no hidden writes. */
function writerV101SuiteMerge(settings){
 const old=settings.v101Suite&&typeof settings.v101Suite==='object'?settings.v101Suite:{};
 const cfg=settings.v101Suite={enabled:true,readingProgress:true,readingProgressHeight:3,readingProgressColor:'',yamlValidation:true,tableFilter:true,csvExport:true,footnotes:true,
  bulkProperties:false,batchMax:60, ...old};
 cfg.batchMax=Math.max(1,Math.min(100,Math.floor(Number(cfg.batchMax)||60)));
 cfg.readingProgressHeight=Math.max(2,Math.min(10,Math.round(Number(cfg.readingProgressHeight)||3)));
 cfg.readingProgressColor=/^#[0-9a-f]{6}$/i.test(cfg.readingProgressColor||'')?cfg.readingProgressColor:'';
 return cfg;
}
function writerV101YamlValidate(text,parse){
 const source=String(text||'').trim().replace(/^---\r?\n/,'').replace(/\r?\n---\s*$/,'');
 if(!source||source.length>100000)return {valid:false,error:'Empty or oversized YAML'};
 try{
  const value=parse(source);
  return {valid:true,value,keys:value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value):[]};
 }catch(error){return {valid:false,error:String(error.message||error).slice(0,300)};}
}
function writerV101TableSplit(line){
 return String(line||'').trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(s=>s.trim().replace(/\\\|/g,'|'));
}
function writerV101TableParse(raw){
 const rows=String(raw||'').trim().split(/\r?\n/);
 if(rows.length<3||!rows[0].includes('|')||!rows[1].includes('|'))return null;
 const header=writerV101TableSplit(rows[0]),separator=writerV101TableSplit(rows[1]);
 if(!header.length||header.length>30||header.length!==separator.length||
  !separator.every(x=>/^:?-{3,}:?$/.test(x)))return null;
 const body=rows.slice(2).filter(row=>row.includes('|')).map(writerV101TableSplit).slice(0,1000);
 return {headers:header,rows:body.map(row=>header.map((_,i)=>row[i]||''))};
}
function writerV101CsvCell(text){
 let value=String(text??'');
 // Spreadsheet software can execute formulas from CSV. Prefix formula-looking cells.
 if(/^[\s]*[=+\-@\t\r]/.test(value))value="'"+value;
 return '"'+value.replace(/"/g,'""')+'"';
}
function writerV101TableCsv(table){
 return [table.headers,...table.rows].map(row=>row.map(writerV101CsvCell).join(',')).join('\r\n')+'\r\n';
}
function writerV101TableFilterModal(plugin,selection){
 const data=writerV101TableParse(selection);
 if(!data){new Notice(writerUi('Selecione uma tabela Markdown válida.','Select a valid Markdown table.'));return;}
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Filtrar tabela (sem alterar a nota)','Filter table (read-only)'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.addClass('writer-v101-table-modal');
  const bar=root.createDiv({cls:'writer-v101-table-controls'});
  const col=bar.createEl('select',{attr:{'aria-label':writerUi('Coluna','Column')}});
  for(let i=0;i<data.headers.length;i++){const option=col.createEl('option',{text:data.headers[i]});option.value=String(i);}
  const query=bar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar valor…','Find value…'),'aria-label':writerUi('Filtrar valores','Filter values')}});
  const tableHost=root.createDiv({cls:'writer-v101-table-scroll'});
  const draw=()=>{
   tableHost.empty();
   const filtered=data.rows.filter(row=>String(row[Number(col.value)]||'').toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()));
   const stats=root.querySelector('.writer-v101-table-count')||root.createEl('small',{cls:'writer-v101-table-count'});
   stats.setText(filtered.length+' / '+data.rows.length+' '+writerUi('linhas','rows'));
   const table=tableHost.createEl('table');
   const head=table.createEl('thead').createEl('tr');
   for(const label of data.headers)head.createEl('th',{text:label});
   const tbody=table.createEl('tbody');
   for(const row of filtered.slice(0,100))for(const _ of [0]){
    const tr=tbody.createEl('tr');for(const cell of row)tr.createEl('td',{text:cell});
   }
  };
  col.addEventListener('change',draw);query.addEventListener('input',draw);draw();
 };
 modal.open();
}
function writerV101BulkPropertiesModal(plugin){
 const space=typeof writerV9215ActiveSpace==='function'?writerV9215ActiveSpace(plugin):null;
 const active=plugin.app.workspace.getActiveFile?.();
 const candidates=(space&&typeof writerV9SpaceItems==='function'?writerV9SpaceItems(plugin,space):[active]).filter(f=>f instanceof TFile&&f.extension==='md');
 const files=candidates.slice(0,plugin.settings.v101Suite.batchMax);
 if(!files.length){new Notice(writerUi('Abra uma nota Markdown ou selecione um Space com notas.','Open a Markdown note or a Space containing notes.'));return;}
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Editar propriedades em lote','Bulk property edits'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();
  root.createEl('p',{text:space?
   writerUi('Space ativo: ','Active Space: ')+space.name+' · '+files.length+' '+writerUi('notas','notes'):
   writerUi('Somente a nota atual.','Current note only.'),
   cls:'setting-item-description'});
  let key='',value='',confirmed=false,include=true;
  new Setting(root).setName(writerUi('Propriedade (chave YAML)','YAML property key'))
   .addText(t=>t.setPlaceholder('status').onChange(v=>key=v.trim()));
  new Setting(root).setName(writerUi('Novo valor (texto)','New value (text)'))
   .addText(t=>t.setPlaceholder(writerUi('Rascunho','Draft')).onChange(v=>value=v));
  new Setting(root).setName(writerUi('Confirmo a alteração nas notas listadas','I confirm editing the listed notes'))
   .addToggle(t=>t.setValue(false).onChange(v=>confirmed=v));
  const preview=root.createEl('details');
  preview.createEl('summary',{text:writerUi('Notas que serão modificadas','Notes to be changed')});
  const list=preview.createEl('ul');
  for(const f of files.slice(0,60))list.createEl('li',{text:f.path});
  new Setting(root).addButton(btn=>btn.setButtonText(writerUi('Aplicar com backup','Apply with backup')).setWarning().onClick(async()=>{
   if(!confirmed||!plugin.settings.v101Suite.bulkProperties){
    new Notice(writerUi('Confirme a operação e ative as alterações em lote nas configurações.','Confirm and enable bulk edits in settings.'));return;
   }
   if(!/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(key)||value.length>2000||
    ['__proto__','constructor','prototype'].includes(key)){
    new Notice(writerUi('Chave YAML ou valor inválido.','Invalid YAML key or value.'));return;
   }
   btn.setDisabled(true);let done=0;
   const app=plugin.app;
   try{
    for(const file of files){
     if(plugin.writerSnapshots?.create)await plugin.writerSnapshots.create(file,'Before bulk property edit');
     await app.fileManager.processFrontMatter(file,fm=>{fm[key]=value;});
     done++;
    }
    modal.close();new Notice(done+' '+writerUi('notas atualizadas com snapshots.','notes updated with snapshots.'));
   }catch(error){
    new Notice(writerUi('Interrompido após ','Stopped after ')+done+': '+String(error.message||error));
   }finally{btn.setDisabled(false);}
  }));
 };
 modal.open();
}
async function writerV101ExportCsv(plugin,table,sourceFile){
 const name=(sourceFile?.basename||'table').replace(/[^\p{L}\p{N} _-]+/gu,'').slice(0,60)||'table';
 const folder=sourceFile?.parent?.path||'';
 let path=(folder?folder+'/':'')+name+' - table.csv',index=2;
 while(plugin.app.vault.getAbstractFileByPath(path))path=(folder?folder+'/':'')+name+' - table '+index+++'.csv';
 const file=await plugin.app.vault.create(path,writerV101TableCsv(table));
 new Notice(writerUi('CSV criado: ','CSV created: ')+file.path);
}

/* Reading progress is derived from the current reading pane, never from book/chapter counts. */
function writerV101ReadingProgressRegister(plugin){
 const refresh=()=>{
  const enabled=plugin.settings.v101Suite?.enabled&&plugin.settings.v101Suite.readingProgress!==false;
  for(const leaf of plugin.app.workspace.getLeavesOfType?.('markdown')||[]){
   const host=leaf.view?.containerEl;
   if(!host)continue;
   const old=host.querySelector(':scope > .writer-v101-reading-track');
   const scroller=host.querySelector('.markdown-preview-view');
   if(!enabled||!scroller||!scroller.isConnected||!scroller.offsetParent){old?.remove();continue;}
   if(host.ownerDocument?.defaultView?.getComputedStyle(host).position==='static')host.style.position='relative';
   let track=old;
   if(!track){
    track=host.ownerDocument.createElement('div');
    track.className='writer-v101-reading-track';
    track.setAttribute('role','progressbar');
    track.setAttribute('aria-label',writerUi('Progresso de leitura','Reading progress'));
    track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
    track.style.cssText='position:absolute;top:0;left:0;right:0;height:3px;z-index:5;pointer-events:none;background:transparent;';
    const fill=host.ownerDocument.createElement('div');
    fill.className='writer-v101-reading-fill';
    fill.style.cssText='height:100%;width:0%;background:var(--interactive-accent);transition:width 90ms linear;';
    track.appendChild(fill);host.appendChild(track);
   }
   const style=plugin.settings.v101Suite;
   track.style.height=(style?.readingProgressHeight||3)+'px';
   track.firstElementChild.style.backgroundColor=style?.readingProgressColor||'var(--interactive-accent)';
   const maximum=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
   const value=maximum?Math.min(100,Math.max(0,Math.round(100*scroller.scrollTop/maximum))):100;
   track.setAttribute('aria-valuenow',String(value));
   track.firstElementChild.style.width=value+'%';
  }
 };
 const throttled=()=>{if(plugin._writerReadingProgressRaf)return;
  plugin._writerReadingProgressRaf=true;
  const view=plugin.app.workspace.containerEl?.ownerDocument?.defaultView;
  (view?.requestAnimationFrame||((fn)=>fn()))(()=>{plugin._writerReadingProgressRaf=false;refresh();});
 };
 plugin.registerDomEvent?.(plugin.app.workspace.containerEl,'scroll',throttled,true);
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',throttled));
 plugin.registerEvent(plugin.app.workspace.on('layout-change',throttled));
 plugin.registerEvent(plugin.app.workspace.on('file-open',throttled));
 plugin.app.workspace.onLayoutReady?.(throttled);
 plugin.writerV101ReadingProgressRefresh=throttled;
 plugin.register?.(()=>{for(const el of plugin.app.workspace.containerEl.querySelectorAll('.writer-v101-reading-track'))el.remove();});
}

function writerV101RegisterEnhancements(plugin){
 writerV101ReadingProgressRegister(plugin);
 const active=key=>plugin.settings.v101Suite?.enabled&&plugin.settings.v101Suite[key]!==false;
 plugin.addCommand({id:'v101-validate-yaml',name:writerUi('YAML: validar seleção','YAML: validate selection'),editorCheckCallback:(checking,editor)=>{
  if(!active('yamlValidation')||!editor.getSelection().trim())return false;
  if(checking)return true;
  const parse=require('obsidian').parseYaml;
  const result=writerV101YamlValidate(editor.getSelection(),parse);
  new Notice(result.valid?writerUi('YAML válido.','Valid YAML.')+' '+result.keys.length+' '+writerUi('chaves','keys'):
   writerUi('YAML inválido: ','Invalid YAML: ')+result.error);
  return true;
 }});
 plugin.addCommand({id:'v101-preview-table-filter',name:writerUi('Tabela: filtrar seleção','Table: filter selection'),editorCheckCallback:(checking,editor)=>{
  if(!active('tableFilter')||!writerV101TableParse(editor.getSelection()))return false;
  if(!checking)writerV101TableFilterModal(plugin,editor.getSelection());return true;
 }});
 plugin.addCommand({id:'v101-export-table-csv',name:writerUi('Tabela: exportar seleção para CSV','Table: export selection to CSV'),editorCheckCallback:(checking,editor,view)=>{
  const data=writerV101TableParse(editor.getSelection());
  if(!active('csvExport')||!data)return false;
  if(!checking)void writerV101ExportCsv(plugin,data,view?.file).catch(error=>new Notice(String(error.message||error)));
  return true;
 }});
 plugin.addCommand({id:'v101-insert-footnote',name:writerUi('Markdown: inserir nota de rodapé','Markdown: insert footnote'),editorCheckCallback:(checking,editor)=>{
  if(!active('footnotes'))return false;
  if(!checking){const label='note-'+Date.now().toString(36);
   const text=editor.getSelection()||writerUi('Texto de referência','Reference text');
   editor.replaceSelection('[^'+label+']\n\n[^'+label+']: '+text.replace(/\r?\n/g,' '));
  }
  return true;
 }});
 plugin.addCommand({id:'v101-bulk-yaml',name:writerUi('Propriedades: editar notas do Space em lote','Properties: batch edit Space notes'),callback:()=>{
  if(!plugin.settings.v101Suite?.enabled||!plugin.settings.v101Suite.bulkProperties){
   new Notice(writerUi('Ative edição em lote nas configurações.','Enable batch editing in settings.'));return;
  }
  writerV101BulkPropertiesModal(plugin);
 }});
}
function writerV101EnhancementsSettings(plugin,panel){
 const cfg=plugin.settings.v101Suite;
 panel.createEl('h3',{text:writerUi('Ferramentas editoriais avançadas','Advanced editorial tools')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Comandos locais para seleção, sem sobrescrever a nota; alterações em lote exigem confirmação e snapshots.','Local selection commands; batch writes require confirmation and snapshots.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar ferramentas extras','Enable additional tools'],
  ['readingProgress','Barra de progresso de leitura','Reading progress bar'],
  ['yamlValidation','Validação de YAML','YAML validation'],
  ['tableFilter','Filtro de tabelas somente leitura','Read-only table filtering'],
  ['csvExport','Exportar seleção de tabela para CSV','Export selected table as CSV'],
  ['footnotes','Inserir notas de rodapé','Insert footnotes'],
  ['bulkProperties','Permitir editar propriedades em lote (desligado inicialmente)','Allow batch property edits (off by default)']
 ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Espessura da barra de leitura','Reading bar thickness'))
  .addSlider(slider=>slider.setLimits(2,10,1).setDynamicTooltip().setValue(cfg.readingProgressHeight||3)
   .onChange(async value=>{cfg.readingProgressHeight=value;await plugin.saveSettings();plugin.writerV101ReadingProgressRefresh?.();}));
 new Setting(panel).setName(writerUi('Cor da barra de leitura','Reading bar color'))
  .setDesc(writerUi('Hexadecimal (#RRGGBB) ou deixe vazio para usar a cor de destaque.','Hex color (#RRGGBB), or leave blank to use accent color.'))
  .addText(field=>field.setPlaceholder('#ff8800').setValue(cfg.readingProgressColor||'')
   .onChange(async value=>{if(value&&!/^#[0-9a-f]{6}$/i.test(value))return;
    cfg.readingProgressColor=value;await plugin.saveSettings();plugin.writerV101ReadingProgressRefresh?.();
   }));
 new Setting(panel).setName(writerUi('Limite de notas por operação','Maximum notes per operation'))
  .addSlider(s=>s.setLimits(1,100,1).setDynamicTooltip().setValue(cfg.batchMax)
   .onChange(async v=>{cfg.batchMax=v;await plugin.saveSettings();}));
}
