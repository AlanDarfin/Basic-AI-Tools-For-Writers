'use strict';
/* Basic 10.11 numbering, local and non-destructive by default. */
function writerV1011NumberCfg(settings){
 const old=settings.v1011Number&&typeof settings.v1011Number==='object'&&!Array.isArray(settings.v1011Number)?settings.v1011Number:{};
 return settings.v1011Number=Object.assign(old,{enabled:true,virtual:false,captions:true,outline:true,scheme:'hierarchical',...old,
  scheme:old.scheme==='flat'?'flat':'hierarchical'});
}
function writerV1011NumberStored(title){
 const m=/^(\d+(?:\.\d+){1,8}\.?|\d+\.)\s+(.+)$/.exec(String(title||''));
 return m?{prefix:m[1],title:m[2]}:null;
}
function writerV1011NumberHeadings(source,scheme='hierarchical'){
 const text=String(source||'');if(text.length>2e6)return [];
 const lines=text.split(/\r?\n/),out=[],counts=Array(7).fill(0);
 let fence='',yaml=false;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(i===0&&line.trim()==='---'){yaml=true;continue;}
  if(yaml){if(/^(---|\.\.\.)\s*$/.test(line))yaml=false;continue;}
  const f=/^\s{0,3}(`{3,}|~{3,})/.exec(line);
  if(f){if(!fence)fence=f[1][0];else if(fence===f[1][0])fence='';continue;}
  if(fence)continue;
  const m=/^(#{1,6})[ \t]+(.+?)\s*$/.exec(line);
  if(!m)continue;
  const level=m[1].length,stored=writerV1011NumberStored(m[2]);
  const title=stored?stored.title:m[2];
  if(!title.trim())continue;
  counts[level]++;for(let n=level+1;n<=6;n++)counts[n]=0;
  const number=scheme==='flat'?String(counts[level]):counts.slice(1,level+1).filter(Boolean).join('.');
  out.push({line:i,level,number,title,stored:stored?.prefix||'',raw:line,prefix:m[1]+' '});
  if(out.length>=800)break;
 }
 return out;
}
function writerV1011NumberPlan(source,mode='write',scheme='hierarchical'){
 const text=String(source||''),eol=text.includes('\r\n')?'\r\n':'\n';
 const lines=text.split(/\r?\n/),changes=[];
 for(const item of writerV1011NumberHeadings(source,scheme)){
  if(/\s+#+\s*$/.test(item.title))continue;
  if(mode==='remove'&&!item.stored)continue;
  const next=item.prefix+(mode==='remove'?item.title:item.number+'. '+item.title);
  if(next===lines[item.line])continue;
  changes.push({line:item.line+1,before:lines[item.line],after:next});
  lines[item.line]=next;
 }
 return {before:text,after:lines.join(eol),changes};
}
function writerV1011NumberDisabled(plugin,file){
 const fm=plugin.app.metadataCache.getFileCache?.(file)?.frontmatter||{};
 return fm['basic-numbering']===false||['off','disabled'].includes(fm['basic-numbering']);
}
function writerV1011NumberPreview(plugin,mode){
 const file=plugin.app.workspace.getActiveFile?.(),cfg=writerV1011NumberCfg(plugin.settings);
 if(!cfg.enabled)return;
 if(!file||file.extension!=='md'){new Notice(writerUi('Abra uma nota Markdown.','Open a Markdown note.'));return;}
 if(writerV1011NumberDisabled(plugin,file)){new Notice(writerUi('Numeração desativada nesta nota.','Numbering is disabled for this note.'));return;}
 const modal=new Modal(plugin.app);
 modal.setTitle(mode==='remove'?writerUi('Remover números dos títulos','Remove heading numbers'):writerUi('Numerar títulos','Number headings'));
 modal.onOpen=()=>{
  const root=modal.contentEl;
  root.createEl('p',{text:writerUi('Calculando alterações…','Calculating changes…')});
  void plugin.app.vault.read(file).then(text=>{
   const plan=writerV1011NumberPlan(text,mode,cfg.scheme);
   root.empty();root.addClass('writer-v1011-number-preview');
   root.createEl('p',{cls:'setting-item-description',text:writerUi(
    'Alterações em títulos podem afetar links para seções. Revise antes de confirmar.',
    'Heading changes can affect section links. Review before confirming.')});
   root.createEl('strong',{text:plan.changes.length+' '+writerUi('alterações propostas','proposed changes')});
   if(!plan.changes.length)return;
   const list=root.createDiv({cls:'writer-v1011-number-diff'});
   for(const change of plan.changes.slice(0,150)){
    const row=list.createDiv({cls:'writer-v1011-number-change'});
    row.createEl('small',{text:writerUi('Linha ','Line ')+change.line});
    row.createEl('div',{cls:'writer-v1011-number-before',text:'− '+change.before});
    row.createEl('div',{cls:'writer-v1011-number-after',text:'+ '+change.after});
   }
   let approved=false;
   new Setting(root).setName(writerUi('Confirmo as alterações','I confirm these changes'))
    .addToggle(t=>t.setValue(false).onChange(v=>approved=v));
   new Setting(root).addButton(button=>button.setButtonText(writerUi('Aplicar com snapshot','Apply with snapshot'))
    .setWarning().onClick(async()=>{
     if(!approved){new Notice(writerUi('Confirme a prévia.','Confirm the preview.'));return;}
     if(plugin.app.vault.getAbstractFileByPath(file.path)!==file||typeof plugin.app.vault.process!=='function'){
      new Notice(writerUi('Não foi possível verificar o arquivo com segurança.','Unable to update file safely.'));return;
     }
     button.setDisabled(true);
     try{
      if(plugin.writerSnapshots?.create)await plugin.writerSnapshots.create(file,'Before heading numbering');
      await plugin.app.vault.process(file,current=>{
       if(current!==plan.before)throw Error(writerUi('A nota mudou. Gere nova prévia.','Note changed. Generate a new preview.'));
       return plan.after;
      });
      modal.close();new Notice(writerUi('Numeração atualizada.','Numbering updated.'));
     }catch(error){new Notice(String(error.message||error));button.setDisabled(false);}
    }));
  }).catch(error=>{root.empty();root.createEl('p',{text:String(error.message||error)});});
 };
 modal.open();
}
function writerV1011NumberReading(plugin,el,ctx){
 const cfg=writerV1011NumberCfg(plugin.settings);
 const file=plugin.app.vault.getAbstractFileByPath?.(ctx.sourcePath);
 const enabled=cfg.enabled&&!(file&&writerV1011NumberDisabled(plugin,file));
 const preview=el.closest?.('.markdown-preview-view');
 preview?.classList?.toggle('writer-v1011-number-reading',Boolean(enabled&&cfg.virtual));
 if(!enabled)return;
 if(cfg.virtual&&preview){
  preview.classList.add('writer-v1011-number-reading');
  preview.dataset.basicScheme=cfg.scheme;
  for(const h of el.querySelectorAll('h1,h2,h3,h4,h5,h6')){
   h.classList.add('writer-v1011-numbered-title');
   h.classList.toggle('writer-v1011-number-already-stored',Boolean(writerV1011NumberStored(h.textContent.trim())));
  }
 }
 if(cfg.captions){
  for(const p of el.querySelectorAll('p')){
   if(p.querySelector('a,code,img,button'))continue;
   const m=/^(Figure|Table|Equation|Code):\s+.{1,500}$/.exec(p.textContent.trim());
   if(m){p.classList.add('writer-v1011-number-caption');p.dataset.basicCaption=m[1];}
  }
 }
}
function writerV1011NumberOutline(plugin){
 const cfg=writerV1011NumberCfg(plugin.settings);
 if(!cfg.enabled||!cfg.outline)return;
 const file=plugin.app.workspace.getActiveFile?.();
 if(!file||file.extension!=='md'){new Notice(writerUi('Abra uma nota.','Open a note.'));return;}
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Sumário numerado','Numbered outline'));
 modal.onOpen=()=>{
  const root=modal.contentEl;
  void plugin.app.vault.read(file).then(text=>{
   root.empty();
   const cfg=writerV1011NumberCfg(plugin.settings);
   for(const item of writerV1011NumberHeadings(text,cfg.scheme)){
    const button=root.createEl('button',{cls:'writer-v1011-number-outline-item'});
    button.style.paddingInlineStart=String(item.level*12)+'px';
    button.createEl('small',{text:item.number});button.createSpan({text:item.title});
    button.addEventListener('click',async()=>{
     const leaf=plugin.app.workspace.getLeaf('tab');await leaf.openFile(file);
     leaf.view?.editor?.setCursor({line:item.line,ch:0});
     modal.close();
    });
   }
  }).catch(error=>root.createEl('p',{text:String(error.message||error)}));
 };
 modal.open();
}
function writerV1011NumberRegister(plugin){
 writerV1011NumberCfg(plugin.settings);
 plugin.registerMarkdownPostProcessor?.((el,ctx)=>writerV1011NumberReading(plugin,el,ctx));
 plugin.addCommand({id:'v1011-number-outline',name:writerUi('Numeração: sumário navegável','Numbering: navigable outline'),
  callback:()=>writerV1011NumberOutline(plugin)});
 plugin.addCommand({id:'v1011-number-write',name:writerUi('Numeração: prévia para numerar nota','Numbering: preview heading numbering'),
  callback:()=>writerV1011NumberPreview(plugin,'write')});
 plugin.addCommand({id:'v1011-number-remove',name:writerUi('Numeração: prévia para remover números','Numbering: preview remove numbers'),
  callback:()=>writerV1011NumberPreview(plugin,'remove')});
}
function writerV1011NumberSettings(plugin,panel){
 const cfg=writerV1011NumberCfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('Numeração automática','Automatic numbering')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Numeração visual só no modo de leitura. Gravar ou remover títulos exige prévia e confirmação. H1–H6.',
  'Display-only numbers in Reading View. Writing/removal requires preview and confirmation. H1–H6.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar numeração','Enable numbering'],
  ['virtual','Números visuais em leitura','Virtual numbers in Reading View'],
  ['captions','Realçar legendas','Highlight captions'],
  ['outline','Habilitar sumário','Enable outline']
 ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{
  cfg[key]=v;await plugin.saveSettings();
 }));
 new Setting(panel).setName(writerUi('Esquema numérico','Number scheme')).addDropdown(d=>{
  d.addOption('hierarchical',writerUi('Hierárquico','Hierarchical'));d.addOption('flat',writerUi('Por nível','Per level'));
  d.setValue(cfg.scheme).onChange(async v=>{cfg.scheme=v;await plugin.saveSettings();});
 });
}
