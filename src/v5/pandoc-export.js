'use strict';
/* Basic AI v5 — optional Pandoc export. No shell, scripts or bundled Lua filters. */
const WRITER_PANDOC_EXPORT_FORMATS={docx:'docx',html:'html',epub:'epub',odt:'odt',pdf:'pdf',plain:'txt',latex:'tex'};
const WRITER_PANDOC_EXPORT_DEFAULTS={enabled:false,format:'docx',pandocPath:'pandoc',folder:'Exports/Pandoc',timeoutSeconds:90};
function writerPandocExportMerge(settings){
 const existing=settings.pandocExport;
 const cfg=settings.pandocExport={...WRITER_PANDOC_EXPORT_DEFAULTS,...(existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{})};
 cfg.enabled=cfg.enabled===true;
 if(!Object.hasOwn(WRITER_PANDOC_EXPORT_FORMATS,cfg.format))cfg.format='docx';
 cfg.pandocPath=typeof cfg.pandocPath==='string'&&cfg.pandocPath.trim()?cfg.pandocPath.trim().slice(0,512):'pandoc';
 cfg.folder=writerPandocExportFolder(cfg.folder);
 cfg.timeoutSeconds=Math.min(180,Math.max(15,Number(cfg.timeoutSeconds)||90));
 return cfg;
}
function writerPandocExportFolder(value){
 const path=String(value??'Exports/Pandoc').trim().replace(/\\/g,'/');
 const segments=path.split('/').filter(Boolean);
 if(!segments.length||segments.some(x=>x==='.'||x==='..'||/[:*?"<>|]/.test(x)||x.length>120))return 'Exports/Pandoc';
 return segments.join('/');
}
function writerPandocExportFilename(basename,format){
 if(!Object.hasOwn(WRITER_PANDOC_EXPORT_FORMATS,format))throw Error('Invalid export format');
 const stem=String(basename||'Untitled').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').trim().slice(0,100)||'Untitled';
 return stem+'.'+WRITER_PANDOC_EXPORT_FORMATS[format];
}
function writerPandocExportArgs(format,outputPath,resourcePath){
 if(!Object.hasOwn(WRITER_PANDOC_EXPORT_FORMATS,format))throw Error('Invalid export format');
 // Arguments are fixed; user content is never interpolated into a shell command.
 const from='markdown+fenced_divs+fancy_lists+definition_lists+example_lists+bracketed_spans+native_divs+tex_math_dollars';
 const to=format==='plain'?'plain':format;
 const args=['--standalone','--from',from,'--to',to,'--output',outputPath];
 if(resourcePath)args.push('--resource-path',resourcePath);
 return args;
}
function writerPandocExportError(error,stderr){
 if(error?.code==='ENOENT')return writerUi('Pandoc não encontrado. Instale-o no computador ou configure o caminho do executável.','Pandoc was not found. Install it or configure the executable path.');
 if(error?.code==='ETIMEDOUT'||error?.killed)return writerUi('Tempo de exportação esgotado.','Pandoc export timed out.');
 const summary=String(stderr||error?.message||'').trim().slice(-600);
 return (summary||writerUi('Erro desconhecido na exportação.','Unknown export error.'));
}
async function writerPandocExportRun(plugin,format){
 const cfg=plugin.settings.pandocExport;
 if(plugin.app.isMobile)throw Error(writerUi('Exportação Pandoc requer Obsidian para desktop.','Pandoc export requires desktop Obsidian.'));
 if(!cfg?.enabled)throw Error(writerUi('Ative a exportação Pandoc nas configurações.','Enable Pandoc export in settings.'));
 const view=plugin.app.workspace.getActiveViewOfType(MarkdownView);
 const file=view?.file;
 if(!file||file.extension!=='md'||!view.editor)throw Error(writerUi('Abra uma nota Markdown para exportar.','Open a Markdown note before exporting.'));
 if(!Object.hasOwn(WRITER_PANDOC_EXPORT_FORMATS,format))throw Error('Invalid format');
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
 const root=plugin.app.vault.adapter?.getBasePath?.();
 if(!root)throw Error(writerUi('Este cofre não fornece acesso a um diretório local.','This vault does not expose a local filesystem.'));
 const folder=await fs.promises.mkdtemp(path.join(os.tmpdir(),'basic-ai-pandoc-'));
 const source=path.join(folder,'input.md'),dest=path.join(folder,'result.'+WRITER_PANDOC_EXPORT_FORMATS[format]);
 const parent=path.dirname(path.resolve(root,file.path));
 try{
  await fs.promises.writeFile(source,view.editor.getValue(),'utf8');
  const args=writerPandocExportArgs(format,dest,parent+path.delimiter+root);
  await new Promise((resolve,reject)=>{
   const child=cp.spawn(cfg.pandocPath,[...args,source],{cwd:parent,shell:false,windowsHide:true,stdio:['ignore','ignore','pipe']});
   let stderr='',finished=false;
   let timeout;
   const finish=(err)=>{if(finished)return;finished=true;clearTimeout(timeout);if(err)reject(new Error(writerPandocExportError(err,stderr)));else resolve();};
   timeout=setTimeout(()=>{
    const err=new Error('Pandoc timeout');err.code='ETIMEDOUT';
    try{child.kill();}catch(_){}finish(err);
   },cfg.timeoutSeconds*1000);
   child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString('utf8')).slice(-4000);});
   child.on('error',finish);
   child.on('close',code=>finish(code===0?null:new Error('pandoc exit '+code)));
  });
  const bytes=await fs.promises.readFile(dest);
  if(bytes.length===0)throw Error(writerUi('Pandoc gerou um arquivo vazio.','Pandoc generated an empty file.'));
  const folderInVault=writerPandocExportFolder(cfg.folder);
  let segments='';
  for(const part of folderInVault.split('/')){
   segments=segments?segments+'/'+part:part;
   if(!plugin.app.vault.getAbstractFileByPath(segments))await plugin.app.vault.createFolder(segments);
  }
  const filename=writerPandocExportFilename(file.basename,format);
  const dot=filename.lastIndexOf('.'),base=filename.slice(0,dot),extension=filename.slice(dot);
  let target=folderInVault+'/'+filename,number=2;
  while(plugin.app.vault.getAbstractFileByPath(target))target=folderInVault+'/'+base+' ('+number+++')'+extension;
  await plugin.app.vault.createBinary(target,Uint8Array.from(bytes).buffer);
  return target;
 }finally{
  await fs.promises.rm(folder,{recursive:true,force:true}).catch(()=>{});
 }
}
class WriterPandocExporter{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.pandocExport;}
 async run(format){
  try{
   const path=await writerPandocExportRun(this.plugin,format);
   new Notice(writerUi('Arquivo exportado: ','Exported file: ')+path,8000);
  }catch(error){console.warn('[Basic AI] Pandoc export:',error);new Notice(writerUi('Falha na exportação Pandoc: ','Pandoc export failed: ')+String(error.message||error).slice(0,250),9000);}
 }
 register(){
  const p=this.plugin;
  p.addCommand({id:'v5-pandoc-export',name:writerUi('Pandoc: exportar nota atual','Pandoc: export current note'),checkCallback:checking=>{
   if(p.app.isMobile||!this.cfg?.enabled||!p.app.workspace.getActiveViewOfType(MarkdownView)?.file)return false;
   if(!checking)this.openDialog();
   return true;
  }});
  for(const format of ['docx','html','pdf','epub','odt','plain'])
   p.addCommand({id:'v5-pandoc-export-'+format,name:'Pandoc: '+format.toUpperCase(),checkCallback:checking=>{
    if(p.app.isMobile||!this.cfg?.enabled||!p.app.workspace.getActiveViewOfType(MarkdownView)?.file)return false;
    if(!checking)this.run(format);
    return true;
   }});
 }
 openDialog(){
  const dialog=new Modal(this.plugin.app);dialog.onOpen=()=>{
   dialog.setTitle(writerUi('Exportar com Pandoc','Export with Pandoc'));
   dialog.contentEl.createEl('p',{text:writerUi('O Pandoc deve estar instalado no computador. Os documentos originais não serão modificados.','Pandoc must be installed on your computer. The original note will not be changed.')});
   let selected=this.cfg.format;
   new Setting(dialog.contentEl).setName(writerUi('Formato','Format')).addDropdown(d=>{
    for(const key of Object.keys(WRITER_PANDOC_EXPORT_FORMATS))d.addOption(key,key.toUpperCase());
    d.setValue(selected).onChange(value=>selected=value);
   });
   new Setting(dialog.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>dialog.close()))
    .addButton(b=>b.setCta().setButtonText(writerUi('Exportar','Export')).onClick(()=>{dialog.close();this.run(selected);}));
  };dialog.open();
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Exportação Pandoc (desktop)','Pandoc export (desktop)')});
  panel.createEl('p',{text:writerUi('Requer Pandoc instalado. A exportação cria uma cópia em seu cofre. Não executa filtros Lua ou comandos de shell. PDF pode exigir um mecanismo LaTeX instalado.','Requires a local Pandoc executable. Exports into a vault folder without running shell commands or Lua filters. PDF may require an additional LaTeX engine.'),cls:'dictionary-muted'});
  new Setting(panel).setName(writerUi('Ativar exportação','Enable export')).addToggle(t=>t.setValue(this.cfg.enabled).onChange(async value=>{this.cfg.enabled=value;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Formato padrão','Default format')).addDropdown(d=>{
   for(const key of Object.keys(WRITER_PANDOC_EXPORT_FORMATS))d.addOption(key,key.toUpperCase());
   d.setValue(this.cfg.format).onChange(async value=>{this.cfg.format=value;await this.plugin.saveSettings();});
  });
  new Setting(panel).setName(writerUi('Executável Pandoc','Pandoc executable')).addText(t=>t.setValue(this.cfg.pandocPath).onChange(async value=>{this.cfg.pandocPath=value.trim().slice(0,512)||'pandoc';await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Pasta de exportações','Export folder')).addText(t=>t.setValue(this.cfg.folder).onChange(async value=>{this.cfg.folder=writerPandocExportFolder(value);await this.plugin.saveSettings();}));
 }
}
