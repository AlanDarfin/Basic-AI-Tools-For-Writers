'use strict';
/* v10: small, opt-in integrations, with original vault files and native UI. */
const WRITER_V10_TEXT_EXT=new Set(['txt','md','json','jsonc','yaml','yml','csv','tsv','xml','html','htm','css','js','jsx','ts','tsx','py','sh','fish','toml','ini','cfg','conf','log','sql','svg','tex','bib','gitignore','properties','rs','go','java','kt','kts','swift','c','h','cpp','hpp','cs','php','rb','lua','dart','scss','less','vue','svelte','sql','ps1','bat','cmd','dockerfile','r','jl','gradle','graphql','mdx','diff','patch','gitconfig']);
function writerV10EditableText(file){
 return file instanceof TFile && WRITER_V10_TEXT_EXT.has(String(file.extension||'').toLowerCase()) &&
  Number(file.stat?.size||0)<=512*1024;
}
const WRITER_V1044_DOUBLE_KEYS=[
 ['Shift','Shift'],['ShiftLeft','Shift esquerdo'],['ShiftRight','Shift direito'],
 ['Control','Ctrl'],['Alt','Alt'],['Meta','Meta / Super'],
 ['Escape','Esc'],['Tab','Tab'],['Space','Espaço'],
 ...Array.from({length:12},(_,i)=>['F'+(i+1),'F'+(i+1)]),
 ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter=>['Key'+letter,letter]),
 ...'0123456789'.split('').map(digit=>['Digit'+digit,digit])
];
function writerV1044DoubleKeyNormalize(entry,index){
 if(!entry||typeof entry!=='object')return null;
 const key=String(entry.key||'').slice(0,32);
 if(!WRITER_V1044_DOUBLE_KEYS.some(row=>row[0]===key))return null;
 const command=String(entry.command||'app:open-command-palette').trim().slice(0,200);
 if(!/^[\w.:-]{1,200}$/.test(command))return null;
 const context=['all','nonText','editorOnly'].includes(entry.context)?entry.context:'nonText';
 return {id:String(entry.id||'double-'+index).replace(/[^\w-]/g,'').slice(0,50)||'double-'+index,
  key,command,context,enabled:entry.enabled!==false};
}
function writerV1044DoubleKeyCode(event){
 if(!event)return '';
 const code=String(event.code||''),key=String(event.key||'');
 if(['Shift','Control','Alt','Meta'].includes(key))return code.startsWith(key)?code:key;
 if(code==='Space'||key===' ')return 'Space';
 if(code==='Escape'||key==='Escape')return 'Escape';
 if(code==='Tab'||key==='Tab')return 'Tab';
 if(/^F(?:[1-9]|1[0-2])$/.test(code))return code;
 if(/^Key[A-Z]$/.test(code)||/^Digit\d$/.test(code))return code;
 return '';
}
function writerV1044DoubleKeyMatch(rule,code){
 return rule?.key===code||
  (rule?.key==='Shift'&&/^Shift(?:Left|Right)?$/.test(code))||
  (rule?.key==='Control'&&/^Control(?:Left|Right)?$/.test(code))||
  (rule?.key==='Alt'&&/^Alt(?:Left|Right)?$/.test(code))||
  (rule?.key==='Meta'&&/^Meta(?:Left|Right)?$/.test(code));
}
function writerV1044DoubleKeyIsText(key){
 return /^Key[A-Z]$|^Digit[0-9]$|^Space$|^Tab$/.test(key);
}
function writerV10ToolboxMerge(settings){
 const old=settings.v10Tools&&typeof settings.v10Tools==='object'?settings.v10Tools:{};
 const cfg=settings.v10Tools={enabled:true,textEditor:true,doubleShift:false,doubleShiftDelay:320,
  tableSorting:true,jsonFormatting:true,quickCallout:true,doubleShiftCode:'either',
  doubleShiftContext:'all',doubleShiftIgnoreModal:true,doublePressEnabled:undefined,
  doublePressBindings:undefined,...old};
 cfg.doubleShiftDelay=Math.max(200,Math.min(650,Number(cfg.doubleShiftDelay)||320));
 cfg.doubleShiftCode=['either','same','left','right'].includes(cfg.doubleShiftCode)?cfg.doubleShiftCode:'either';
 cfg.doubleShiftContext=['all','nonText','editorOnly'].includes(cfg.doubleShiftContext)?cfg.doubleShiftContext:'all';
 // Migrate the old double Shift shortcut without changing it for existing users.
 if(cfg.doublePressEnabled===undefined)cfg.doublePressEnabled=cfg.doubleShift===true;
 if(!Array.isArray(cfg.doublePressBindings)){
  const shift=cfg.doubleShiftCode==='left'?'ShiftLeft':cfg.doubleShiftCode==='right'?'ShiftRight':'Shift';
  cfg.doublePressBindings=[{id:'legacy-shift',key:shift,command:'app:open-command-palette',
   context:cfg.doubleShiftContext,enabled:true}];
 }
 cfg.doublePressBindings=cfg.doublePressBindings
  .slice(0,20).map(writerV1044DoubleKeyNormalize).filter(Boolean);
 // Do not accidentally re-create removed bindings on the next load.
 cfg.doublePressEnabled=cfg.doublePressEnabled===true;
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
 let pending=null,pressed=new Set();
 const isTextTarget=target=>Boolean(target?.closest?.('input,textarea,[contenteditable="true"],.cm-editor'))||
  Boolean(target?.isContentEditable);
 const reset=()=>{pending=null;};
 const handler=event=>{
  const cfg=plugin.settings.v10Tools;
  if(!cfg?.enabled||!cfg.doublePressEnabled||event.repeat)return;
  if(event.isComposing){reset();return;}
  const code=writerV1044DoubleKeyCode(event);
  if(!code){reset();return;}
  // Keep double-tap shortcuts independent of modifier key combinations.
  const modifier=/^(Shift|Control|Alt|Meta)/.test(code);
  if((!modifier&&(event.shiftKey||event.altKey||event.ctrlKey||event.metaKey))||
     (modifier&&['Shift','Control','Alt','Meta'].some(name=>name!==event.key&&event[name==='Control'?'ctrlKey':name.toLowerCase()+'Key']))){
   reset();return;
  }
  const target=event.target,editing=isTextTarget(target);
  if(cfg.doubleShiftIgnoreModal!==false&&target?.closest?.('.modal-container,.suggestion-container')){
   reset();return;
  }
  if(pressed.has(code))return;
  pressed.add(code);
  const rules=(cfg.doublePressBindings||[]).filter(rule=>
   rule.enabled!==false&&writerV1044DoubleKeyMatch(rule,code)&&
   (rule.context!=='nonText'||!editing)&&(rule.context!=='editorOnly'||editing)&&
   !(editing&&writerV1044DoubleKeyIsText(code)));
  if(!rules.length){reset();return;}
  const now=Date.now();
  const rule=rules[0];
  if(pending&&pending.id===rule.id&&pending.released&&now-pending.at<=cfg.doubleShiftDelay&&
     (cfg.doubleShiftCode!=='same'||rule.key!=='Shift'||pending.code===code)){
   reset();
   const success=plugin.app.commands?.executeCommandById?.(rule.command);
   if(success!==false){event.preventDefault?.();event.stopPropagation?.();}
  }else{
   pending={id:rule.id,code,at:now,released:false};
  }
 };
 const released=event=>{
  const code=writerV1044DoubleKeyCode(event);
  pressed.delete(code);
  if(pending&&pending.code===code)pending.released=true;
 };
 if(typeof document!=='undefined'&&typeof plugin.registerDomEvent==='function'){
  plugin.registerDomEvent(document,'keydown',handler,true);
  plugin.registerDomEvent(document,'keyup',released,true);
  plugin.registerEvent?.(plugin.app.workspace.on('active-leaf-change',reset));
 }

}
function writerV1044CommandPicker(plugin,selected){
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Escolher comando','Choose command'));
 const root=modal.contentEl;
 const input=root.createEl('input',{attr:{type:'search',
  placeholder:writerUi('Buscar comando…','Search commands…'),
  'aria-label':writerUi('Buscar comando','Search command')}});
 const list=root.createDiv({cls:'writer-v1044-command-options'});
 const commands=Object.entries(plugin.app.commands?.commands||{})
  .filter(([id,entry])=>entry?.name&&typeof id==='string')
  .map(([id,entry])=>({id,name:String(entry.name)}))
  .sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
 const render=()=>{
  list.empty();
  const q=input.value.trim().toLocaleLowerCase();
  const matches=commands.filter(c=>!q||c.name.toLocaleLowerCase().includes(q)||c.id.toLowerCase().includes(q)).slice(0,70);
  if(!matches.length)list.createEl('p',{text:writerUi('Nenhum comando encontrado.','No matching commands.')});
  for(const c of matches){
   const button=list.createEl('button',{cls:'writer-v1044-command-option',attr:{type:'button'}});
   button.createEl('span',{text:c.name});
   button.createEl('small',{text:c.id});
   button.addEventListener('click',()=>{selected(c.id,c.name);modal.close();});
  }
 };
 input.addEventListener('input',render);
 // Text field covers commands not yet registered in app.commands.
 const custom=new Setting(root).setName(writerUi('ID de comando personalizado','Custom command ID'))
  .addText(field=>field.setPlaceholder('app:open-command-palette').onChange(()=>{}))
  .addButton(button=>button.setButtonText(writerUi('Usar ID','Use ID')).onClick(()=>{
   const id=custom.controlEl.querySelector('input')?.value.trim()||'';
   if(!/^[\w.:-]{1,200}$/.test(id))return;
   selected(id,id);modal.close();
  }));
 modal.onOpen=()=>{render();input.focus();};
 modal.open();
}
function writerV1044DoubleKeySettings(plugin,panel){
 const cfg=plugin.settings.v10Tools;
 const section=panel.createEl('details',{cls:'writer-v1044-double-keys'});
 section.createEl('summary',{text:writerUi('Atalhos por tecla pressionada duas vezes','Double-press key shortcuts')});
 section.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Adicione teclas e escolha um comando da paleta para cada uma. Letras, números, Tab e Espaço não disparam enquanto você digita, evitando alterações acidentais nas notas.',
  'Add keys and assign a command to each. Letters, numbers, Tab and Space never trigger while typing, preventing accidental edits.')});
 new Setting(section).setName(writerUi('Ativar atalhos de tecla dupla','Enable double-press shortcuts'))
  .addToggle(t=>t.setValue(cfg.doublePressEnabled===true).onChange(async v=>{cfg.doublePressEnabled=v;await plugin.saveSettings();}));
 new Setting(section).setName(writerUi('Intervalo entre toques (ms)','Time between taps (ms)'))
  .addSlider(sl=>sl.setLimits(200,650,25).setDynamicTooltip().setValue(cfg.doubleShiftDelay)
   .onChange(async v=>{cfg.doubleShiftDelay=v;await plugin.saveSettings();}));
 new Setting(section).setName(writerUi('Ignorar em janelas e sugestões','Ignore in dialogs and suggestions'))
  .addToggle(t=>t.setValue(cfg.doubleShiftIgnoreModal!==false).onChange(async v=>{
   cfg.doubleShiftIgnoreModal=v;await plugin.saveSettings();
  }));
 const rows=section.createDiv({cls:'writer-v1044-double-key-list'});
 const draw=()=>{
  rows.empty();
  for(const [index,rule] of cfg.doublePressBindings.entries()){
   const row=rows.createDiv({cls:'writer-v1044-double-key-rule'});
   const keySetting=new Setting(row).setName(writerUi('Tecla','Key')+' '+(index+1));
   keySetting.addDropdown(drop=>{
    for(const [id,label] of WRITER_V1044_DOUBLE_KEYS)drop.addOption(id,label);
    drop.setValue(rule.key).onChange(async v=>{
     rule.key=v;
     if(writerV1044DoubleKeyIsText(v))rule.context='nonText';
     await plugin.saveSettings();draw();
    });
   });
   new Setting(row).setName(writerUi('Comando','Command'))
    .setDesc(plugin.app.commands?.commands?.[rule.command]?.name||rule.command)
    .addButton(button=>button.setButtonText(writerUi('Escolher…','Choose…')).onClick(()=>
     writerV1044CommandPicker(plugin,async id=>{rule.command=id;await plugin.saveSettings();draw();})));
   new Setting(row).setName(writerUi('Onde funciona','Where active'))
    .addDropdown(drop=>{
     for(const [id,pt,en] of [['all','Qualquer local','Anywhere'],
      ['nonText','Fora de campos de texto','Outside text fields'],
      ['editorOnly','Somente editores','Text editors only']])drop.addOption(id,writerUi(pt,en));
     drop.setValue(rule.context).onChange(async v=>{rule.context=v;await plugin.saveSettings();});
    });
   new Setting(row).setName(writerUi('Ativo','Enabled'))
    .addToggle(t=>t.setValue(rule.enabled!==false).onChange(async v=>{rule.enabled=v;await plugin.saveSettings();}))
    .addExtraButton(button=>button.setIcon('trash-2')
     .setTooltip(writerUi('Remover atalho','Remove shortcut')).onClick(async()=>{
      cfg.doublePressBindings.splice(index,1);await plugin.saveSettings();draw();
     }));
  }
 };
 draw();
 new Setting(section).setName(writerUi('Novo atalho','New shortcut')).addButton(button=>
  button.setButtonText(writerUi('Adicionar tecla','Add key')).setCta().onClick(async()=>{
   if(cfg.doublePressBindings.length>=20)return;
   cfg.doublePressBindings.push({id:'key-'+Date.now(),key:'Control',
    command:'app:open-command-palette',context:'all',enabled:true});
   await plugin.saveSettings();draw();section.open=true;
  }));
}
function writerV10ToolboxSettings(plugin,panel){
 const cfg=plugin.settings.v10Tools;
 panel.createEl('h3',{text:writerUi('Ferramentas de arquivos','File tools')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Ferramentas de edição de arquivos e comandos Markdown. Os atalhos por tecla dupla são configurados separadamente abaixo.',
  'File editing and Markdown commands. Double-press shortcuts are configured separately below.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar extras da v10','Enable v10 tools'],
  ['textEditor','Permitir edição de arquivos de texto (até 512 KiB)','Allow text-file edits (up to 512 KiB)'],
  ['tableSorting','Ordenar linhas de tabelas Markdown','Sort Markdown table rows'],
  ['jsonFormatting','Formatar JSON selecionado','Format selected JSON'],
  ['quickCallout','Inserir callouts por comando','Insert callouts via command']
 ])new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 writerV1044DoubleKeySettings(plugin,panel);
}
