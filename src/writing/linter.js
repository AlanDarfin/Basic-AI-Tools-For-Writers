'use strict';
/* v6 original manual linter; pure rules and confirmed writes, no automatic mutation by default. */
function writerV6LintText(text,config={}){
 const source=String(text||''),eol=source.includes('\r\n')?'\r\n':'\n',lines=source.split(/\r?\n/),protect=writerV6ProtectedRanges(source),changes=[];
 let offset=0,inFront=false,inFence=false;
 const result=lines.map((line,index)=>{
  const from=offset,to=from+line.length;offset=to+eol.length;
  const trim=line.trim();
  if(index===0&&trim==='---')inFront=true;
  const yamlLine=inFront&&index>0&&trim!=='---';
  const fence=/^\s{0,3}(?:\x60{3,}|~{3,})/.test(line);
  const skip=inFront||inFence||fence||/^(?: {4}|\t)/.test(line)||writerV6Overlaps(protect,from,to);
  if(fence)inFence=!inFence;
  if(inFront&&index>0&&trim==='---')inFront=false;
  if(skip&&!yamlLine)return line;
  let next=line;
  if(yamlLine){
   if(config.yamlSpacing===true)next=next.replace(/^([A-Za-z_][\w-]*):(?=\S)/,'$1: ');
   if(next!==line)changes.push({line:index+1,before:line,after:next});
   return next;
  }
  if(config.trimTrailing!==false)next=next.replace(/[ \t]+$/,'');
  if(config.headingSpace!==false)next=next.replace(/^(#{1,6})([^\s#])/,'$1 $2');
  if(config.listSpace!==false)next=next.replace(/^(\s{0,3}[-+*])([^\s-])/,'$1 $2').replace(/^(\s{0,3}\d+[.)])([^\s])/,'$1 $2');
  if(config.footnoteSpace!==false)next=next.replace(/^(\[\^[^\]]{1,120}\]:)(\S)/,'$1 $2');
  if(config.quoteSpace===true)next=next.replace(/^(\s{0,3}>)([^ >\n])/,'$1 $2');
  if(next!==line)changes.push({line:index+1,before:line,after:next});
  return next;
 });
 let output=result.join(eol);
 if(config.collapseBlanks===true)output=output.replace(/(?:\r?\n){4,}/g,eol+eol+eol);
 if(config.finalNewline!==false&&output&&!output.endsWith(eol))output+=eol;
 return {source,output,changed:output!==source,edits:changes,count:changes.length+(output!==result.join(eol)?1:0)};
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
 async previewBatch(files,title){
  const plugin=this.plugin;
  if(this.locked){new Notice(writerUi('Outro processo do Linter está ativo.','Another Linter task is active.'));return;}
  const eligible=files.filter(file=>file instanceof TFile&&file.extension==='md'&&!writerV6LintExcluded(file.path,this.cfg.excluded));
  if(eligible.length>50){new Notice(writerUi('Limite de 50 notas por lote. Escolha uma pasta menor.','Batch limit is 50 notes. Select a smaller folder.'));return;}
  this.locked=true;
  try{
   const entries=[];
   const active=plugin.app.workspace.getActiveFile?.();
   for(const file of eligible){
    // Skip active unsaved documents in batch operations; use single-note review instead.
    if(active?.path===file.path)continue;
    const source=await plugin.app.vault.read(file),lint=writerV6LintText(source,this.cfg);
    if(lint.changed)entries.push({file,source,lint});
   }
   if(!entries.length){new Notice(writerUi('Nenhuma nota elegível precisa de mudanças.','No eligible notes need formatting.'));return;}
   const owner=this;
   class BatchPreview extends Modal{
    onOpen(){
     this.setTitle(writerUi('Linter: revisão em lote — ','Linter batch preview — ')+title);
     this.contentEl.addClass('writer-v6-lint-modal');
     this.contentEl.createEl('p',{text:entries.length+' '+writerUi('notas com mudanças. A nota ativa é excluída para evitar perda de edições não salvas.','notes with changes. The active note is excluded to avoid losing unsaved edits.')});
     const list=this.contentEl.createEl('pre',{cls:'writer-v6-lint-preview'});
     list.textContent=entries.map(item=>item.file.path+' ('+item.lint.count+' '+writerUi('alterações','changes')+')').join('\n');
     const actions=this.contentEl.createDiv({cls:'writer-v6-lint-actions'});
     new Setting(actions).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>this.close()))
      .addButton(b=>b.setButtonText(writerUi('Confirmar e aplicar','Confirm and apply')).setCta().onClick(async()=>{
       let applied=0,skipped=0;
       try{
        for(const item of entries){
         const live=await plugin.app.vault.read(item.file);
         if(live!==item.source){skipped++;continue;}
         try{
          if(plugin.writerSnapshots?.config?.enabled)await plugin.writerSnapshots.create(item.file,writerUi('Antes do Linter em lote','Before batch Linter'),{content:live,attachments:false});
          else{
           const adapter=plugin.app.vault.adapter;
           const folder=(plugin.manifest.dir||plugin.app.vault.configDir+'/plugins/'+plugin.manifest.id)+'/v6-linter-backups';
           if(!(await adapter.exists(folder)))await adapter.mkdir(folder);
           const safe=item.file.path.replace(/[^a-z0-9_.-]/gi,'_').slice(-100);
           await adapter.write(folder+'/'+safe+'-'+Date.now()+'.md',live);
          }
          await plugin.app.vault.modify(item.file,item.lint.output);applied++;
         }catch(error){skipped++;console.warn('[Basic AI] Batch lint:',error);}
        }
        this.close();
        new Notice(writerUi('Notas formatadas: ','Formatted notes: ')+applied+writerUi(' · ignoradas: ',' · skipped: ')+skipped,7000);
       }catch(error){new Notice(error.message,7000);}
      }));
    }
    onClose(){this.contentEl.empty();}
   }
   new BatchPreview(plugin.app).open();
  }finally{this.locked=false;}
 }
 register(){
  const plugin=this.plugin;
  plugin.addCommand({id:'v6-linter-current-folder',name:writerUi('Linter: revisar pasta da nota','Linter: review current folder'),checkCallback:checking=>{
   const file=plugin.app.workspace.getActiveFile?.();
   if(!writerV6Allowed(plugin,'linter')||(typeof writerV6ProjectToolAllowed==='function'&&!writerV6ProjectToolAllowed(plugin,'linter',file?.path))||!file||file.extension!=='md')return false;
   if(!checking){
    const prefix=file.parent?.path||'';
    const files=plugin.app.vault.getMarkdownFiles().filter(f=>(f.parent?.path||'')===prefix);
    this.previewBatch(files,prefix||writerUi('raiz','root')).catch(e=>new Notice(e.message));
   }
   return true;
  }});
  plugin.addCommand({id:'v6-linter-current-note',name:writerUi('Linter: revisar formatação da nota','Linter: review note formatting'),checkCallback:checking=>{
   const file=plugin.app.workspace.getActiveFile?.();
   if(!writerV6Allowed(plugin,'linter')||(typeof writerV6ProjectToolAllowed==='function'&&!writerV6ProjectToolAllowed(plugin,'linter',file?.path))||!file||file.extension!=='md')return false;
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
   ['footnoteSpace','Espaço após definição de nota de rodapé','Space after footnote definitions'],
   ['quoteSpace','Espaço depois de > em citações','Space after blockquote >'],
   ['yamlSpacing','Espaço após chaves YAML','Space after YAML keys'],
   ['collapseBlanks','Reduzir linhas em branco excessivas','Collapse excessive blank lines'],
   ['finalNewline','Nova linha ao fim do arquivo','Final newline']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async v=>{cfg[key]=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Arquivos e pastas excluídos','Excluded files and folders')).setDesc(writerUi('Caminhos relativos ao cofre, um por linha; use barra final para pastas.','Vault-relative paths, one per line; end folder names with a slash.')).addTextArea(t=>{
   t.inputEl.rows=4;t.setValue(cfg.excluded).onChange(async v=>{cfg.excluded=v.slice(0,3000);await this.plugin.saveSettings();});
  });
 }
}
