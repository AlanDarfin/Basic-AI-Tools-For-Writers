'use strict';
/* v6 original manual linter; pure rules and confirmed writes, no automatic mutation by default. */
function writerV6LintText(text,config={}){
 const source=String(text||''),lines=source.split('\n'),protect=writerV6ProtectedRanges(source),changes=[];
 let offset=0,inFront=false,inFence=false;
 const result=lines.map((line,index)=>{
  const from=offset,to=from+line.length;offset=to+1;
  const trim=line.trim();
  if(index===0&&trim==='---')inFront=true;
  const fence=/^\s{0,3}(?:\x60{3,}|~{3,})/.test(line);
  const skip=inFront||inFence||fence||/^(?: {4}|\t)/.test(line)||writerV6Overlaps(protect,from,to);
  if(fence)inFence=!inFence;
  if(inFront&&index>0&&trim==='---')inFront=false;
  if(skip)return line;
  let next=line;
  if(config.trimTrailing!==false)next=next.replace(/[ \t]+$/,'');
  if(config.headingSpace!==false)next=next.replace(/^(#{1,6})([^\s#])/,'$1 $2');
  if(config.listSpace!==false)next=next.replace(/^(\s{0,3}[-+*])([^\s-])/,'$1 $2').replace(/^(\s{0,3}\d+[.)])([^\s])/,'$1 $2');
  if(next!==line)changes.push({line:index+1,before:line,after:next});
  return next;
 });
 let output=result.join('\n');
 if(config.collapseBlanks===true)output=output.replace(/\n{4,}/g,'\n\n\n');
 if(config.finalNewline!==false&&output&&!output.endsWith('\n'))output+='\n';
 return {source,output,changed:output!==source,edits:changes,count:changes.length+(output!==result.join('\n')?1:0)};
}
function writerV6LintExcluded(path,setting){
 const p=String(path||'');
 return String(setting||'').split(/[,\n]/).map(s=>s.trim()).filter(Boolean).some(s=>{
  if(s.endsWith('/'))return p.startsWith(s);
  return p===s||p.startsWith(s+'/');
 });
}
class WriterV6Linter{
 constructor(plugin){this.plugin=plugin;this.locked=false;}
 get cfg(){return this.plugin.settings.v6.linter;}
 async formatFile(file){
  if(!(file instanceof TFile)||file.extension!=='md'||writerV6LintExcluded(file.path,this.cfg.excluded))return;
  if(this.locked){new Notice(writerUi('O Linter já está processando outra nota.','The Linter is already processing another note.'));return;}
  this.locked=true;
  try{
   const editorView=this.plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
   const editor=editorView?.file?.path===file.path?editorView.editor:null;
   const source=editor?editor.getValue():await this.plugin.app.vault.read(file);
   const lint=writerV6LintText(source,this.cfg);
   if(!lint.changed){new Notice(writerUi('Nenhuma alteração de formatação sugerida.','No formatting changes suggested.'));return;}
   await this.previewAndApply(file,source,lint,editor);
  }finally{this.locked=false;}
 }
 async previewAndApply(file,source,lint,editor){
  const plugin=this.plugin,owner=this;
  class Preview extends Modal{
   onOpen(){
    this.setTitle(writerUi('Linter — prévia das alterações','Linter — change preview'));
    this.contentEl.addClass('writer-v6-lint-modal');
    this.contentEl.createEl('p',{text:writerUi('Mudanças propostas: ','Proposed changes: ')+lint.count});
    const preview=this.contentEl.createEl('pre',{cls:'writer-v6-lint-preview'});
    preview.textContent=lint.edits.slice(0,80).map(e=>'L'+e.line+'\n− '+e.before+'\n+ '+e.after).join('\n')||
      writerUi('Normalização de linhas em branco/final do arquivo.','Blank-line/EOF normalization.');
    if(lint.edits.length>80)preview.append(document.createTextNode('\n…'));
    const actions=this.contentEl.createDiv({cls:'writer-v6-lint-actions'});
    new Setting(actions).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>this.close()))
     .addButton(b=>b.setButtonText(writerUi('Aplicar alterações','Apply changes')).setCta().onClick(async()=>{
      try{
       const active=editor?editor.getValue():await plugin.app.vault.read(file);
       if(active!==source)throw Error(writerUi('A nota foi modificada. Analise novamente antes de aplicar.','Note changed; rerun the preview before applying.'));
       if(plugin.writerSnapshots?.config?.enabled)await plugin.writerSnapshots.create(file,writerUi('Antes do Linter v6','Before v6 Linter'),{content:source,attachments:false});
       else{
        // Even without optional Snapshots enabled, persist a recovery copy in the plugin vault adapter.
        const adapter=plugin.app.vault.adapter,folder=(plugin.manifest.dir||plugin.app.vault.configDir+'/plugins/'+plugin.manifest.id)+'/v6-linter-backups';
        if(!(await adapter.exists(folder)))await adapter.mkdir(folder);
        const safe=file.path.replace(/[^a-z0-9_.-]/gi,'_').slice(-100);
        await adapter.write(folder+'/'+safe+'-'+Date.now()+'.md',source);
       }
       if(editor)editor.setValue(lint.output);
       else await plugin.app.vault.modify(file,lint.output);
       this.close();
       new Notice(writerUi('Formatação aplicada; backup criado.','Formatting applied; backup created.'));
      }catch(error){new Notice(writerUi('Não foi possível formatar: ','Unable to format: ')+error.message,6500);}
     }));
   }
   onClose(){this.contentEl.empty();}
  }
  new Preview(plugin.app).open();
 }
 register(){
  const plugin=this.plugin;
  plugin.addCommand({id:'v6-linter-current-note',name:writerUi('Linter: revisar formatação da nota','Linter: review note formatting'),checkCallback:checking=>{
   const file=plugin.app.workspace.getActiveFile?.();
   if(!writerV6Allowed(plugin,'linter')||!file||file.extension!=='md')return false;
   if(!checking)this.formatFile(file).catch(e=>new Notice(e.message));
   return true;
  }});
 }
 renderSettings(panel){
  const cfg=this.cfg;
  panel.createEl('h3',{text:writerUi('Linter — formatação assistida','Linter — assisted formatting')});
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Apenas manual: mostra uma prévia e cria backup antes de escrever. Exclui regiões Markdown protegidas.','Manual only: shows a preview and creates a backup before writing. Protected Markdown ranges are excluded.')});
  for(const [key,pt,en] of [
   ['enabled','Ativar Linter','Enable Linter'],
   ['trimTrailing','Remover espaços ao fim da linha','Remove trailing whitespace'],
   ['headingSpace','Espaço depois de títulos #','Space after heading #'],
   ['listSpace','Espaço depois de marcadores de lista','Space after list markers'],
   ['collapseBlanks','Reduzir linhas em branco excessivas','Collapse excessive blank lines'],
   ['finalNewline','Nova linha ao fim do arquivo','Final newline']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{cfg[key]=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Arquivos e pastas excluídos','Excluded files and folders')).setDesc(writerUi('Caminhos relativos ao cofre, um por linha; use barra final para pastas.','Vault-relative paths, one per line; end folder names with a slash.')).addTextArea(t=>{
   t.inputEl.rows=4;t.setValue(cfg.excluded).onChange(async v=>{cfg.excluded=v.slice(0,3000);await this.plugin.saveSettings();});
  });
 }
}
