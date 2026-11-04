'use strict';
/* v10: small, opt-in integrations, with original vault files and native UI. */
const WRITER_V10_TEXT_EXT=new Set(['txt','md','json','jsonc','yaml','yml','csv','tsv','xml','html','htm','css','js','jsx','ts','tsx','py','sh','fish','toml','ini','cfg','conf','log','sql','svg','tex','bib','gitignore','properties','rs','go','java','kt','kts','swift','c','h','cpp','hpp','cs','php','rb','lua','dart','scss','less','vue','svelte','sql','ps1','bat','cmd','dockerfile','r','jl','gradle','graphql','mdx','diff','patch','gitconfig']);
function writerV10EditableText(file){
 return file instanceof TFile && WRITER_V10_TEXT_EXT.has(String(file.extension||'').toLowerCase()) &&
  Number(file.stat?.size||0)<=512*1024;
}
function writerV10ToolboxMerge(settings){
 const old=settings.v10Tools&&typeof settings.v10Tools==='object'?settings.v10Tools:{};
 const cfg=settings.v10Tools={enabled:true,textEditor:true,doubleShift:false,doubleShiftDelay:320,tableSorting:true,jsonFormatting:true,quickCallout:true,doubleShiftCode:'either',doubleShiftContext:'all',doubleShiftIgnoreModal:true, ...old};
 cfg.doubleShiftDelay=Math.max(200,Math.min(650,Number(cfg.doubleShiftDelay)||320));
 cfg.doubleShiftCode=['either','same','left','right'].includes(cfg.doubleShiftCode)?cfg.doubleShiftCode:'either';
 cfg.doubleShiftContext=['all','nonText','editorOnly'].includes(cfg.doubleShiftContext)?cfg.doubleShiftContext:'all';
 return cfg;
}
async function writerV10OpenTextFile(plugin,file){
 if(!plugin.settings.v10Tools?.enabled||!plugin.settings.v10Tools?.textEditor)
  return new Notice(writerUi('Ative o editor de arquivos nas configurações.','Enable the file editor in settings.'));
 if(!writerV10EditableText(file))
  return new Notice(writerUi('Formato não editável ou arquivo maior que 512 KiB.','Unsupported text format or file larger than 512 KiB.'));
 let initial;
 try{initial=await plugin.app.vault.read(file);}catch(error){new Notice(String(error.message||error));return;}
 if(initial.includes('\0')){new Notice(writerUi('Arquivo binário não pode ser editado.','Binary files cannot be edited.'));return;}
 const mtime=Number(file.stat?.mtime||0);
 const modal=new Modal(plugin.app);modal.setTitle(file.name);
 const area=modal.contentEl.createEl('textarea',{cls:'writer-v10-text-editor',
  attr:{spellcheck:'false','aria-label':writerUi('Conteúdo do arquivo de texto','Text file contents')}});
 area.value=initial;
 area.setAttribute('wrap','off');
 const meta=modal.contentEl.createDiv({cls:'writer-v101-code-status'});
 const updateStatus=()=>{
  const at=area.selectionStart||0;
  const before=area.value.slice(0,at);
  meta.setText(file.extension.toUpperCase()+' · '+(before.split('\n').length)+':'+(before.length-before.lastIndexOf('\n'))+' · '+area.value.split('\n').length+' '+writerUi('linhas','lines'));
 };
 area.addEventListener('input',updateStatus);
 area.addEventListener('click',updateStatus);
 area.addEventListener('keyup',updateStatus);
 area.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||event.ctrlKey||event.metaKey||event.altKey)return;
  event.preventDefault();
  const start=area.selectionStart,end=area.selectionEnd;
  area.setRangeText('  ',start,end,'end');updateStatus();
 });
 updateStatus();
 const bar=modal.contentEl.createDiv({cls:'writer-v10-editor-actions'});
 bar.createEl('span',{cls:'setting-item-description',text:writerUi('Texto simples · grava apenas ao clicar em Salvar.','Plain text · saved only after pressing Save.')});
 const save=bar.createEl('button',{cls:'mod-cta',text:writerUi('Salvar arquivo','Save file'),attr:{type:'button'}});
 save.addEventListener('click',async()=>{
  const fresh=plugin.app.vault.getAbstractFileByPath(file.path);
  if(fresh!==file||Number(fresh.stat?.mtime||0)!==mtime){
   new Notice(writerUi('O arquivo mudou externamente. Copie sua edição antes de reabrir.','File changed externally. Copy edits before reopening.'));return;
  }
  if(area.value.length>512*1024){
   new Notice(writerUi('O texto excedeu 512 KiB.','Text exceeds 512 KiB.'));return;
  }
  save.disabled=true;
  try{await plugin.app.vault.modify(file,area.value);modal.close();new Notice(writerUi('Arquivo salvo.','File saved.'));}
  catch(error){new Notice(String(error.message||error));save.disabled=false;}
 });
 modal.open();
}
function writerV10TableSortText(value){
 const rows=String(value||'').trim().split(/\r?\n/);
 if(rows.length<3||!rows[0].includes('|')||!rows[1].includes('|'))return null;
 const isSeparator=line=>/^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/.test(line)&&line.includes('-');
 if(!isSeparator(rows[1]))return null;
 const data=rows.slice(2);
 if(data.some(line=>!line.includes('|')))return null;
 const cell=line=>line.replace(/^\s*\||\|\s*$/g,'').split('|')[0].trim();
 return rows.slice(0,2).concat(data.sort((a,b)=>cell(a).localeCompare(cell(b),undefined,{numeric:true,sensitivity:'base'}))).join('\n');
}
function writerV10FormatJson(text){
 const raw=String(text||'').trim();
 if(!raw||raw.length>512*1024)return null;
 try{return JSON.stringify(JSON.parse(raw),null,2);}catch(_){return null;}
}
function writerV10RegisterToolbox(plugin){
 plugin.writerV10OpenTextFile=file=>void writerV10OpenTextFile(plugin,file);
 const enabled=key=>plugin.settings.v10Tools?.enabled&&plugin.settings.v10Tools[key]!==false;
 plugin.addCommand?.({id:'v10-edit-text-file',name:writerUi('Arquivos: editar arquivo de texto atual','Files: edit active text file'),
  checkCallback:checking=>{
   const file=plugin.app.workspace.getActiveFile?.();
   if(!writerV10EditableText(file)||!enabled('textEditor'))return false;
   if(!checking)void writerV10OpenTextFile(plugin,file);
   return true;
  }});
 plugin.registerEvent?.(plugin.app.workspace.on('file-menu',(menu,file)=>{
  if(!writerV10EditableText(file)||!enabled('textEditor'))return;
  menu.addItem(item=>item.setTitle(writerUi('Editar como texto (Basic)','Edit as text (Basic)'))
   .setIcon('file-pen-line').onClick(()=>void writerV10OpenTextFile(plugin,file)));
 }));
 plugin.addCommand?.({id:'v10-sort-markdown-table',name:writerUi('Tabela: ordenar linhas selecionadas','Table: sort selected rows'),
  editorCheckCallback:(checking,editor)=>{
   if(!enabled('tableSorting')||!writerV10TableSortText(editor.getSelection()))return false;
   if(!checking)editor.replaceSelection(writerV10TableSortText(editor.getSelection()));
   return true;
  }});
 plugin.addCommand?.({id:'v10-format-json-selection',name:writerUi('JSON: formatar seleção','JSON: format selection'),
  editorCheckCallback:(checking,editor)=>{
   if(!enabled('jsonFormatting')||!writerV10FormatJson(editor.getSelection()))return false;
   if(!checking)editor.replaceSelection(writerV10FormatJson(editor.getSelection()));
   return true;
  }});
 plugin.addCommand?.({id:'v10-insert-callout',name:writerUi('Markdown: inserir callout','Markdown: insert callout'),
  editorCheckCallback:(checking,editor)=>{
   if(!enabled('quickCallout'))return false;
   if(!checking){
    const source=editor.getSelection()||writerUi('Escreva aqui','Write here');
    editor.replaceSelection('> [!note] '+writerUi('Nota','Note')+'\n'+
     source.split(/\r?\n/).map(line=>'> '+line).join('\n'));
   }
   return true;
  }});
 let previousShift=0,previousCode='',dirty=false;
 const isTextTarget=target=>Boolean(target?.closest?.('input, textarea, [contenteditable="true"], .cm-editor'))||
  Boolean(target?.isContentEditable);
 const handler=event=>{
  if(!plugin.settings.v10Tools?.enabled||!plugin.settings.v10Tools.doubleShift||event.repeat)return;
  const cfg=plugin.settings.v10Tools;
  if(cfg.doubleShiftIgnoreModal!==false&&event.target?.closest?.('.modal-container, .suggestion-container')){previousShift=0;return;}
  const editorTarget=isTextTarget(event.target);
  if((cfg.doubleShiftContext==='nonText'&&editorTarget)||(cfg.doubleShiftContext==='editorOnly'&&!editorTarget)){
   previousShift=0;return;
  }
  if(event.isComposing){previousShift=0;return;}
  if(event.key==='Shift'&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
   if(dirty){previousShift=0;dirty=false;return;}
   const code=event.code||'';
   const mode=cfg.doubleShiftCode||'either';
   if((mode==='left'&&code==='ShiftRight')||(mode==='right'&&code==='ShiftLeft')){previousShift=0;return;}
   const now=Date.now(),delay=cfg.doubleShiftDelay;
   if(previousShift&&now-previousShift<=delay&&(mode!=='same'||code===previousCode)){
    previousShift=0;previousCode='';event.preventDefault();
    plugin.app.commands?.executeCommandById?.('app:open-command-palette');
   }else {previousShift=now;previousCode=code;}
  }else if(event.key!=='Shift'){
   previousShift=0;previousCode='';dirty=true;
  }
 };
 const released=event=>{if(event.key==='Shift')dirty=false;};
 if(typeof document!=='undefined'&&typeof plugin.registerDomEvent==='function'){
  plugin.registerDomEvent(document,'keydown',handler,true);
  plugin.registerDomEvent(document,'keyup',released,true);
 }
}
function writerV10ToolboxSettings(plugin,panel){
 const cfg=plugin.settings.v10Tools;
 panel.createEl('h3',{text:writerUi('Ferramentas de arquivos e atalhos','File tools & shortcuts')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('As funções são opcionais e reutilizam o cofre. Arquivos binários são somente visualizados pelo aplicativo nativo.','Features are optional and use your vault. Binary files remain handled by their native viewer.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar extras da v10','Enable v10 tools'],
  ['textEditor','Permitir edição de arquivos de texto (até 512 KiB)','Allow text-file edits (up to 512 KiB)'],
  ['tableSorting','Ordenar linhas de tabelas Markdown','Sort Markdown table rows'],
  ['jsonFormatting','Formatar JSON selecionado','Format selected JSON'],
  ['quickCallout','Inserir callouts por comando','Insert callouts via command'],
  ['doubleShift','Pressionar Shift duas vezes para comandos','Double Shift opens command palette']
 ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]===true||cfg[key]!==false&&key!=='doubleShift').onChange(async value=>{cfg[key]=value;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Intervalo do duplo Shift (ms)','Double Shift interval (ms)'))
  .addSlider(s=>s.setLimits(200,650,25).setDynamicTooltip().setValue(cfg.doubleShiftDelay)
   .onChange(async v=>{cfg.doubleShiftDelay=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Teclas do duplo Shift','Double Shift keys')).addDropdown(d=>{
  for(const [id,pt,en] of [['either','Qualquer Shift','Either Shift'],['same','Duas vezes o mesmo Shift','Same Shift twice'],['left','Somente Shift esquerdo','Left Shift only'],['right','Somente Shift direito','Right Shift only']])d.addOption(id,writerUi(pt,en));
  d.setValue(cfg.doubleShiftCode).onChange(async v=>{cfg.doubleShiftCode=v;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Contexto do duplo Shift','Double Shift context')).addDropdown(d=>{
  for(const [id,pt,en] of [['all','Qualquer local','Anywhere'],['nonText','Fora de editores','Outside text editors'],['editorOnly','Somente editores','Inside editors only']])d.addOption(id,writerUi(pt,en));
  d.setValue(cfg.doubleShiftContext).onChange(async v=>{cfg.doubleShiftContext=v;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Ignorar Shift em janelas e sugestões','Ignore Shift in dialogs and suggestions'))
  .addToggle(t=>t.setValue(cfg.doubleShiftIgnoreModal!==false).onChange(async v=>{cfg.doubleShiftIgnoreModal=v;await plugin.saveSettings();}));
}
