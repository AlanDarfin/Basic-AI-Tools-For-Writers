'use strict';
/* v9.2.15: initial local-first Maker-style slash menu + editable Flow embeds.
 * No private Obsidian APIs and no dependency on Make.md. */
function writerV9215FlowMerge(settings){
 const raw=settings.v9215Flow&&typeof settings.v9215Flow==='object'?settings.v9215Flow:{};
 const cfg=settings.v9215Flow={enabled:true,slash:true,embeds:true,flowBlocks:true,
  flowArrange:true,flowPreviews:true,defaultLayout:'cards',maxItems:30,...raw};
 for(const key of ['enabled','slash','embeds','flowBlocks','flowArrange','flowPreviews'])cfg[key]=cfg[key]!==false;
 cfg.defaultLayout=['cards','list','board'].includes(cfg.defaultLayout)?cfg.defaultLayout:'cards';
 cfg.maxItems=Math.max(5,Math.min(80,Math.round(Number(cfg.maxItems)||30)));
 return cfg;
}
function writerV9215SlashActions(){
 return [
  {id:'h1',pt:'Título 1',en:'Heading 1',keys:'h1 title heading',text:'# '},
  {id:'h2',pt:'Título 2',en:'Heading 2',keys:'h2 title heading',text:'## '},
  {id:'h3',pt:'Título 3',en:'Heading 3',keys:'h3 title heading',text:'### '},
  {id:'bullet',pt:'Lista com marcadores',en:'Bulleted list',keys:'ul list bullet',text:'- '},
  {id:'number',pt:'Lista numerada',en:'Numbered list',keys:'ol list number',text:'1. '},
  {id:'todo',pt:'Lista de tarefas',en:'Task list',keys:'check task todo',text:'- [ ] '},
  {id:'quote',pt:'Citação',en:'Quote',keys:'quote blockquote',text:'> '},
  {id:'callout',pt:'Bloco de destaque',en:'Callout',keys:'callout note',text:'> [!note]\n> '},
  {id:'divider',pt:'Separador',en:'Divider',keys:'hr rule divider',text:'---\n'},
  {id:'code',pt:'Código',en:'Code block',keys:'code fence',text:"~~~\n\n~~~"},
  {id:'table',pt:'Tabela',en:'Table',keys:'table grid',text:"| Coluna 1 | Coluna 2 |\n| --- | --- |\n|  |  |"},
  {id:'tip',pt:'Dica',en:'Tip callout',keys:'tip callout',text:"> [!tip]\n> "},
  {id:'warning',pt:'Aviso',en:'Warning callout',keys:'warning alert callout',text:"> [!warning]\n> "},
  {id:'important',pt:'Importante',en:'Important callout',keys:'important callout',text:"> [!important]\n> "},
  {id:'link',pt:'Link Markdown',en:'Markdown link',keys:'link url',text:"[texto](https://)"},
  {id:'highlight',pt:'Realce',en:'Highlight',keys:'mark highlight',text:"==texto=="},
  {id:'formula',pt:'Fórmula',en:'Math formula',keys:'math formula latex',text:"$$\n\n$$"},
  {id:'flowboard',pt:'Painel de notas',en:'Note board',keys:'flow board panel notes',text:"~~~flow\n[[nome da nota]]\n~~~"},
  {id:'dbview',pt:'Banco: nova visualização',en:'Database: new view',keys:'notion base database gallery board',text:'~~~basic-suite-db\nfolder: Databases/Tarefas\nview: gallery\ncolumns: file, status\n~~~'},
  {id:'timetable',pt:'Estudos: horário de aulas',en:'Study: class timetable',keys:'unique agenda schedule horario aula',text:'~~~basic-timetable\n~~~'},
  {id:'date',pt:'Data de hoje',en:'Today',keys:'date today calendar',text:''},
  {id:'flow',pt:'Incorporar nota',en:'Embed note',keys:'embed inline edit note flow',text:''}
 ];
}
class WriterV9215SlashSuggest extends require('obsidian').EditorSuggest{
 constructor(app,plugin){super(app);this.plugin=plugin;}
 onTrigger(cursor,editor,file){
  const cfg=this.plugin.settings.v9215Flow;
  if(!cfg.enabled||!cfg.slash||!(file instanceof TFile))return null;
  const head=editor.getLine(cursor.line).slice(0,cursor.ch);
  const found=/(?:^|[ ])[/]([^ ]*)$/u.exec(head);
  if(!found)return null;
  const from=cursor.ch-found[1].length-1;
  return {start:{line:cursor.line,ch:from},end:cursor,query:found[1]};
 }
 getSuggestions(context){
  const query=String(context.query||'').toLocaleLowerCase();
  return writerV9215SlashActions().filter(action=>(action.id+' '+action.pt+' '+action.en+' '+action.keys).toLocaleLowerCase().includes(query)).slice(0,14);
 }
 renderSuggestion(action,el){
  el.createEl('span',{cls:'writer-v9215-slash-name',text:writerUi(action.pt,action.en)});
  el.createEl('small',{cls:'writer-v9215-slash-id',text:'/'+action.id});
 }
 selectSuggestion(action){
  const ctx=this.context;
  if(!ctx)return;
  const editor=ctx.editor,position=ctx.start;
  if(action.id==='flow'){
   editor.replaceRange('',ctx.start,ctx.end);
   const Search=require('obsidian').FuzzySuggestModal;
   const modal=new (class extends Search{
    getItems(){return this.app.vault.getMarkdownFiles().filter(file=>file.path!==ctx.file?.path);}
    getItemText(file){return file.path;}
    onChooseItem(file){editor.replaceRange('![['+file.path+']]',position);editor.focus();}
   })(this.plugin.app);
   modal.setPlaceholder(writerUi('Escolha a nota para incorporar…','Choose the note to embed…'));
   modal.open();return;
  }
  const today=new Date();
  const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,'0'),dd=String(today.getDate()).padStart(2,'0');
  const text=action.id==='date'?[yyyy,mm,dd].join('-'):action.text;
  editor.replaceRange(text,ctx.start,ctx.end);
  editor.focus();
 }
}
/* Shared Flow editor: check actual vault content before overwriting. */
async function writerV9216FlowOpenEditor(plugin,file,mount,button){
 const existing=mount.querySelector(':scope > .writer-v9215-flow-editor');
 if(existing){existing.remove();button.setAttribute('aria-expanded','false');return;}
 button.disabled=true;
 try{
  const baseline=file.stat?.mtime||0,original=await plugin.app.vault.cachedRead(file);
  if(!mount.isConnected)return;
  const box=mount.ownerDocument.createElement('div');box.className='writer-v9215-flow-editor';
  const textarea=mount.ownerDocument.createElement('textarea');textarea.value=original;
  textarea.setAttribute('aria-label',writerUi('Conteúdo de ','Content of ')+file.basename);
  const actions=mount.ownerDocument.createElement('div');actions.className='writer-v9215-flow-actions';
  const save=mount.ownerDocument.createElement('button');save.type='button';save.textContent=writerUi('Salvar','Save');
  const cancel=mount.ownerDocument.createElement('button');cancel.type='button';cancel.textContent=writerUi('Cancelar','Cancel');
  actions.append(save,cancel);box.append(textarea,actions);mount.appendChild(box);
  button.setAttribute('aria-expanded','true');
  cancel.addEventListener('click',()=>{box.remove();button.setAttribute('aria-expanded','false');});
  save.addEventListener('click',async()=>{
   save.disabled=true;
   try{
    const fresh=await plugin.app.vault.read(file);
    if((file.stat?.mtime||0)!==baseline||fresh!==original){
     new Notice(writerUi('A nota mudou em outra janela. Abra-a antes de salvar, para não perder alterações.','The note changed elsewhere. Open it before saving to avoid overwriting changes.'));
     return;
    }
    if(textarea.value!==original)await plugin.app.vault.modify(file,textarea.value);
    box.remove();button.setAttribute('aria-expanded','false');
    new Notice(writerUi('Nota incorporada salva.','Embedded note saved.'));
   }catch(error){new Notice(String(error.message||error));}
   finally{save.disabled=false;}
  });
  textarea.focus();
 }catch(error){new Notice(String(error.message||error));}
 finally{button.disabled=false;}
}
/* Local note collections from a Markdown ~~~flow block: one note link per line. */
function writerV9216FlowBlock(plugin,source,root,ctx){
 if(typeof writerV93FlowComposer==='function')return writerV93FlowComposer(plugin,source,root,ctx);
 const cfg=plugin.settings.v9215Flow;
 if(!cfg.enabled||!cfg.flowBlocks)return;
 const rows=String(source||'').split(/\r?\n/).map(s=>s.trim())
  .filter(s=>s&&!s.startsWith('#')).slice(0,cfg.maxItems);
 root.classList.add('writer-v9216-flow-board');
 if(!rows.length){root.createEl('p',{text:writerUi('Adicione caminhos de notas, um por linha.','Add note paths, one per line.')});return;}
 for(const row of rows){
  const link=row.replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0].trim();
  const file=plugin.app.metadataCache?.getFirstLinkpathDest?.(link,ctx.sourcePath||'')||
   plugin.app.vault.getAbstractFileByPath(link);
  if(!(file instanceof TFile)||file.extension!=='md')continue;
  const card=root.createDiv({cls:'writer-v9216-flow-card'});
  const head=card.createDiv({cls:'writer-v9216-flow-head'});
  const title=head.createEl('button',{cls:'writer-v9216-flow-open',text:file.basename,attr:{type:'button'}});
  title.addEventListener('click',()=>void plugin.app.workspace.getLeaf('tab').openFile(file));
  if(cfg.embeds){
   const edit=head.createEl('button',{cls:'writer-v9216-flow-edit',text:writerUi('Editar','Edit'),attr:{type:'button'}});
   edit.addEventListener('click',()=>void writerV9216FlowOpenEditor(plugin,file,card,edit));
  }
  const text=card.createDiv({cls:'writer-v9216-flow-excerpt'});
  void plugin.app.vault.cachedRead(file).then(raw=>{
   if(card.isConnected)text.textContent=writerV921PreviewBody(raw,180)||writerUi('Nota sem texto de prévia.','No preview text.');
  }).catch(()=>{text.textContent=writerUi('Prévia indisponível.','Preview unavailable.');});
 }
}

function writerV9215FlowDecorateEmbed(plugin,element,context){
 const cfg=plugin.settings.v9215Flow;
 if(!cfg.enabled||!cfg.embeds)return;
 const source=context.sourcePath||'';
 for(const embed of element.querySelectorAll('.internal-embed[src],.markdown-embed[src]')){
  if(embed.dataset.writerFlowAdded==='true')continue;
  const link=(embed.getAttribute('src')||'').split('#')[0];
  const file=plugin.app.metadataCache.getFirstLinkpathDest?.(link,source);
  if(!(file instanceof TFile)||file.extension!=='md'||file.path===source)continue;
  embed.dataset.writerFlowAdded='true';
  const button=embed.ownerDocument.createElement('button');
  button.className='writer-v9215-flow-toggle';
  button.type='button';
  button.textContent=writerUi('Editar aqui','Edit inline');
  button.setAttribute('aria-label',writerUi('Editar nota incorporada','Edit embedded note')+': '+file.basename);
  embed.appendChild(button);
  button.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();
   void writerV9216FlowOpenEditor(plugin,file,embed,button);
  });
 }
}
function writerV9215FlowRegister(plugin){
 if(typeof plugin.registerEditorSuggest==='function')
  plugin.registerEditorSuggest(new WriterV9215SlashSuggest(plugin.app,plugin));
 if(typeof plugin.registerMarkdownPostProcessor==='function')
  plugin.registerMarkdownPostProcessor((element,context)=>writerV9215FlowDecorateEmbed(plugin,element,context),90);
 if(typeof plugin.registerMarkdownCodeBlockProcessor==='function'){
  for(const id of ['flow','writer-flow'])
   plugin.registerMarkdownCodeBlockProcessor(id,(source,root,context)=>writerV9216FlowBlock(plugin,source,root,context));
 }
 plugin.addCommand({id:'v9215-flow-toggle',name:writerUi('Notas incorporadas: ativar/desativar edição','Embedded notes: toggle inline editing'),callback:async()=>{
  plugin.settings.v9215Flow.embeds=!plugin.settings.v9215Flow.embeds;
  await plugin.saveSettings();
 }});
}
function writerV9215FlowSettings(plugin,panel){
 const cfg=plugin.settings.v9215Flow;
 panel.createEl('h3',{text:writerUi('Painéis de notas e comandos /','Note boards and slash commands')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Use / no editor para inserir blocos. Notas Markdown incorporadas podem ser editadas na visualização, com proteção contra alterações simultâneas.','Type / in the editor to insert blocks. Embedded Markdown notes can be edited in reading view, with concurrent-edit protection.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar painéis e comandos rápidos','Enable note boards and slash commands'],
  ['slash','Menu de comandos /','Slash command menu'],
  ['embeds','Edição de notas incorporadas','Editable embedded notes'],
  ['flowBlocks','Painéis para coleções de notas','Boards for note collections'],
  ['flowArrange','Organizar cartões e salvar no Markdown','Arrange cards and save to Markdown'],
  ['flowPreviews','Prévia do texto nos cartões','Card text previews']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();}));
 }
 new Setting(panel).setName(writerUi('Layout padrão dos painéis de notas','Default note board layout'))
  .addDropdown(drop=>{
   for(const [id,pt,en] of [['cards','Cartões','Cards'],['list','Lista','List'],['board','Quadro','Board']])
    drop.addOption(id,writerUi(pt,en));
   drop.setValue(cfg.defaultLayout).onChange(async value=>{cfg.defaultLayout=value;await plugin.saveSettings();});
  });
 new Setting(panel).setName(writerUi('Máximo de notas por painel','Maximum notes per board'))
  .addSlider(sl=>sl.setLimits(5,80,5).setValue(cfg.maxItems).setDynamicTooltip().onChange(async value=>{
   cfg.maxItems=value;await plugin.saveSettings();
  }));
}
