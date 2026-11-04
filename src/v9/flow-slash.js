'use strict';
/* v9.2.15: initial local-first Maker-style slash menu + editable Flow embeds.
 * No private Obsidian APIs and no dependency on Make.md. */
function writerV9215FlowMerge(settings){
 const raw=settings.v9215Flow&&typeof settings.v9215Flow==='object'?settings.v9215Flow:{};
 const cfg=settings.v9215Flow={enabled:true,slash:true,embeds:true,...raw};
 for(const key of ['enabled','slash','embeds'])cfg[key]=cfg[key]!==false;
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
  {id:'date',pt:'Data de hoje',en:'Today',keys:'date today calendar',text:''},
  {id:'flow',pt:'Flow: incorporar nota',en:'Flow: embed note',keys:'embed inline edit note flow',text:''}
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
  button.addEventListener('click',async event=>{
   event.preventDefault();event.stopPropagation();
   const existing=embed.querySelector(':scope > .writer-v9215-flow-editor');
   if(existing){existing.remove();button.setAttribute('aria-expanded','false');return;}
   button.disabled=true;
   try{
    const baseline=file.stat?.mtime||0,original=await plugin.app.vault.cachedRead(file);
    if(!embed.isConnected)return;
    const box=embed.ownerDocument.createElement('div');box.className='writer-v9215-flow-editor';
    const textarea=embed.ownerDocument.createElement('textarea');textarea.value=original;
    textarea.setAttribute('aria-label',writerUi('Conteúdo de ','Content of ')+file.basename);
    const actions=embed.ownerDocument.createElement('div');actions.className='writer-v9215-flow-actions';
    const save=embed.ownerDocument.createElement('button');save.type='button';save.textContent=writerUi('Salvar','Save');
    const cancel=embed.ownerDocument.createElement('button');cancel.type='button';cancel.textContent=writerUi('Cancelar','Cancel');
    actions.append(save,cancel);box.append(textarea,actions);embed.appendChild(box);
    button.setAttribute('aria-expanded','true');
    cancel.addEventListener('click',()=>{box.remove();button.setAttribute('aria-expanded','false');});
    save.addEventListener('click',async()=>{
     if((file.stat?.mtime||0)!==baseline){
      new Notice(writerUi('Nota alterada em outro lugar. Abra-a antes de salvar para evitar perda de dados.','Note changed elsewhere. Open it before saving to avoid data loss.'));
      return;
     }
     save.disabled=true;
     try{
      await plugin.app.vault.modify(file,textarea.value);
      box.remove();button.setAttribute('aria-expanded','false');
      new Notice(writerUi('Nota incorporada salva.','Embedded note saved.'));
     }catch(error){new Notice(String(error.message||error));save.disabled=false;}
    });
    textarea.focus();
   }catch(error){new Notice(String(error.message||error));}
   finally{button.disabled=false;}
  });
 }
}
function writerV9215FlowRegister(plugin){
 plugin.registerEditorSuggest(new WriterV9215SlashSuggest(plugin.app,plugin));
 plugin.registerMarkdownPostProcessor((element,context)=>writerV9215FlowDecorateEmbed(plugin,element,context),90);
 plugin.addCommand({id:'v9215-flow-toggle',name:writerUi('Flow: ativar/desativar edição de notas incorporadas','Flow: toggle inline embed editing'),callback:async()=>{
  plugin.settings.v9215Flow.embeds=!plugin.settings.v9215Flow.embeds;
  await plugin.saveSettings();
 }});
}
function writerV9215FlowSettings(plugin,panel){
 const cfg=plugin.settings.v9215Flow;
 panel.createEl('h3',{text:writerUi('Flow e menu rápido /','Flow and slash menu /')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Use / no editor para inserir blocos. Notas Markdown incorporadas podem ser editadas na visualização, com proteção contra alterações simultâneas.','Type / in the editor to insert blocks. Embedded Markdown notes can be edited in reading view, with concurrent-edit protection.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar Flow e comandos rápidos','Enable Flow and slash commands'],
  ['slash','Menu de comandos /','Slash command menu'],
  ['embeds','Edição de notas incorporadas','Editable embedded notes']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();}));
 }
}
