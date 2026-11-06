'use strict';
/* Notion Suite / Make.md extension: guided editor for Basic Markdown views.
 * The builder inserts a selected view block only on explicit confirmation.
 * No proprietary database, no folder creation and no silent note rewrites. */
const WRITER_V111_DB_VIEWS=['table','board','gallery','list','calendar','timeline','chart'];
function writerV111DbFolder(value){
 const raw=String(value||'').trim().replace(/\\/g,'/');
 if(!raw||raw.length>240||raw.startsWith('/')||raw.endsWith('/')||/[\x00-\x1f:*?"<>|#\[\]]/.test(raw))return '';
 const parts=raw.split('/');
 return parts.length<=10&&parts.every(x=>x&&x!=='.'&&x!=='..'&&!x.startsWith('.'))?raw:'';
}
function writerV111DbBuilderNormalize(raw){
 const a=raw&&typeof raw==='object'?raw:{};
 const folder=writerV111DbFolder(a.folder);
 const view=WRITER_V111_DB_VIEWS.includes(a.view)?a.view:'table';
 const keys=String(a.columns||'file, status').split(',').map(x=>x.trim())
  .filter(x=>x==='file'||x==='path'||(typeof writerV11DbPropertyKey==='function'&&writerV11DbPropertyKey(x))).slice(0,18);
 const columns=[...new Set(keys.length?keys:['file','status'])];
 const prop=value=>typeof writerV11DbPropertyKey==='function'?writerV11DbPropertyKey(value):'';
 const group=prop(a.group)||'status';
 const sort=['name','file','modified','created',...columns].includes(a.sort)?a.sort:'file';
 const order=a.order==='desc'?'desc':'asc';
 const filter=String(a.filter||'').trim().slice(0,150);
 const safeFilter=/^[\w-]{1,60}\s*(?:=|!=|>=|<=|>|<|contains)\s*[^ \r\n](?:[^\r\n]{0,110})?$/i.test(filter)?filter:'';
 const title=String(a.title||'').trim().replace(/[\r\n]/g,' ').slice(0,80);
 const limit=Math.max(5,Math.min(500,Math.round(Number(a.limit)||80)));
 const cover=prop(a.cover)||'banner',date=prop(a.date)||'date';
 const start=prop(a.start)||'start',end=prop(a.end)||'end',parent=prop(a.parent)||'parent';
 return {folder,view,columns,group,sort,order,filter:safeFilter,title,limit,cover,date,start,end,parent};
}
function writerV111DbBuilderBlock(raw){
 const p=writerV111DbBuilderNormalize(raw);
 if(!p.folder)throw Error('Invalid database folder');
 const lines=['~~~basic-suite-db','folder: '+p.folder,'view: '+p.view,'columns: '+p.columns.join(', '),
  'group: '+p.group,'sort: '+p.sort,'order: '+p.order,'limit: '+p.limit];
 if(p.title)lines.push('title: '+p.title);
 if(p.filter)lines.push('filter: '+p.filter);
 if(p.view==='gallery'||p.view==='board')lines.push('cover: '+p.cover);
 if(p.view==='calendar')lines.push('date: '+p.date);
 if(p.view==='timeline')lines.push('start: '+p.start,'end: '+p.end);
 if(p.view==='list')lines.push('parent: '+p.parent);
 lines.push('~~~');
 return lines.join('\n');
}
function writerV111DbBuilderFromSelection(source){
 const match=/^\s*(?:\x60{3}|~{3})basic-suite-db\s*\r?\n([\s\S]*?)\r?\n(?:\x60{3}|~{3})\s*$/.exec(String(source||''));
 if(!match)return null;
 return writerV111DbBuilderNormalize(writerV1011NotionSpec(match[1]));
}
function writerV111DbBuilderOpen(plugin,editor){
 if(!editor)return new Notice(writerUi('Abra uma nota em edição.','Open a note in editing mode.'));
 const before=editor.getValue(),selected=editor.getSelection?.()||'';
 const existing=writerV111DbBuilderFromSelection(selected);
 let spec=existing||writerV111DbBuilderNormalize({folder:'Databases/Tasks',view:'board',columns:'file, status, due',group:'status',sort:'modified',order:'desc'});
 const modal=new Modal(plugin.app);modal.modalEl?.addClass('writer-v111-db-modal');
 modal.setTitle(writerUi(existing?'Editar visualização Markdown':'Criar visualização Markdown',
  existing?'Edit Markdown database view':'Create Markdown database view'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v111-db-builder');
  root.createEl('p',{cls:'setting-item-description',text:writerUi(
   'Configure a visualização; o código só será inserido ao confirmar. Para editar uma visualização, selecione o bloco inteiro no editor antes de abrir esta ferramenta.',
   'Configure the view; code is inserted only on confirmation. To edit an existing view, select its entire code block before opening.')});
  const fields=root.createDiv({cls:'writer-v111-db-fields'}),preview=root.createDiv({cls:'writer-v111-db-preview'});
  const details=preview.createEl('small'),code=preview.createEl('pre');
  const refresh=()=>{
   code.empty();
   try{
    const out=writerV111DbBuilderBlock(spec);code.setText(out);
    if(writerV111DbFolder(spec.folder)){
     const found=plugin.app.vault.getAbstractFileByPath(spec.folder);
     details.setText(found?writerUi('Pasta encontrada.','Folder found.'):writerUi('A pasta ainda não existe. Nenhuma será criada automaticamente.','Folder does not yet exist. None will be created automatically.'));
    }else details.setText(writerUi('Escolha uma pasta válida.','Choose a valid folder.'));
   }catch(e){details.setText(String(e.message||e));}
  };
  const field=(key,pt,en,value)=>new Setting(fields).setName(writerUi(pt,en)).addText(t=>
   t.setValue(String(spec[key]??value??'')).onChange(v=>{spec[key]=v;refresh();}));
  field('folder','Pasta de notas','Notes folder','Databases/Tasks');
  field('title','Título da visualização','View title','');
  new Setting(fields).setName(writerUi('Layout','Layout')).addDropdown(d=>{
   for(const name of WRITER_V111_DB_VIEWS)d.addOption(name,name[0].toUpperCase()+name.slice(1));
   d.setValue(spec.view).onChange(v=>{spec.view=v;refresh();});
  });
  field('columns','Colunas (separadas por vírgula)','Columns (comma separated)','file, status, due');
  field('group','Propriedade de agrupamento','Group property','status');
  field('filter','Filtro opcional','Optional filter','');
  field('sort','Ordenar por propriedade','Sort by property','file');
  new Setting(fields).setName(writerUi('Direção','Direction')).addDropdown(d=>{
   d.addOption('asc',writerUi('Crescente','Ascending')).addOption('desc',writerUi('Decrescente','Descending'));
   d.setValue(spec.order).onChange(v=>{spec.order=v;refresh();});
  });
  new Setting(fields).setName(writerUi('Limite de itens','Row limit')).addSlider(t=>{
   t.setLimits(5,500,5).setDynamicTooltip().setValue(spec.limit).onChange(v=>{spec.limit=v;refresh();});
  });
  field('cover','Campo de capa','Cover property','banner');
  field('date','Campo de data (calendário)','Date property (calendar)','date');
  field('start','Início (timeline)','Start date (timeline)','start');
  field('end','Fim (timeline)','End date (timeline)','end');
  field('parent','Pai (lista)','Parent (list)','parent');
  const actions=root.createDiv({cls:'writer-v111-db-actions'});
  const save=actions.createEl('button',{text:writerUi('Inserir visualização','Insert database view'),attr:{type:'button'}});
  save.addEventListener('click',()=>{
   let block;
   try{block=writerV111DbBuilderBlock(spec);}catch(e){return new Notice(String(e.message||e));}
   if(editor.getValue()!==before||editor.getSelection?.()!==selected){
    return new Notice(writerUi('A nota mudou. Abra o construtor novamente.','Note changed. Reopen the builder.'));
   }
   editor.replaceSelection((selected?'':'\n')+block+(selected?'':'\n'));
   modal.close();
  });
  refresh();
 };
 modal.open();
}
function writerV111DbBuilderRegister(plugin){
 plugin.addCommand({id:'v111-database-visual-builder',
  name:writerUi('Bancos: construtor visual de visualização','Databases: visual view builder'),
  editorCallback:editor=>writerV111DbBuilderOpen(plugin,editor)});
}
function writerV111DbBuilderSettings(plugin,panel){
 panel.createEl('h3',{text:writerUi('Notion Suite · construtor visual','Notion Suite · visual builder')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Configure filtros simples, colunas, cartões e visualizações sem digitar blocos manualmente. Para alterar blocos existentes, selecione-os no editor.',
  'Configure simple filters, columns, boards and views without hand-writing code blocks. Select existing blocks in the editor to modify.')});
 new Setting(panel).setName(writerUi('Construtor de bancos','Database builder'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>{
   const editor=plugin.app.workspace.getActiveViewOfType?.(MarkdownView)?.editor;
   writerV111DbBuilderOpen(plugin,editor);
  }));
}
