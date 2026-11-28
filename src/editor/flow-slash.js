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
 const block=(id,pt,en,keys,body='',bodyPt,fence=id)=>{
  const wrap=value=>'~~~'+fence+'\n'+(value?value+'\n':'')+'~~~';
  return {id,pt,en,keys,fence,text:wrap(body),textPt:bodyPt===undefined?undefined:wrap(bodyPt)};
 };
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
  block('flowboard','Painel de notas','Note board','writer-flow flow board panel notes','[[Note name]]','[[Nome da nota]]','flow'),
  block('flowcards','Quadro de cartões de texto','Text card board','writer-flow flow board columns cards',
   '=== Ideas\n- New idea\n=== In progress','=== Ideias\n- Ideia nova\n=== Em andamento','flow'),
  block('dbview','Banco: nova visualização','Database: new view','basic-suite-db notion base database gallery board',
   'folder: Databases/Tasks\nview: gallery\ncolumns: file, status','folder: Bancos/Tarefas\nview: gallery\ncolumns: file, status','basic-suite-db'),
  block('timetable','Estudos: horário de aulas','Study: class timetable','basic-timetable unique agenda schedule horario aula','',undefined,'basic-timetable'),
  {id:'date',pt:'Data de hoje',en:'Today',keys:'date today calendar',text:''},
  {id:'flow',pt:'Incorporar nota',en:'Embed note',keys:'embed inline edit note flow',text:''},
  block('chat','Conversa fictícia','Fictional chat','writer-chat diálogo dialogue','[left=Ana, right=Leo]\n< | Ana | Did you find the map?\n> | Leo | Yes, I did.',
   '[left=Ana, right=Leo]\n< | Ana | Você encontrou o mapa?\n> | Leo | Encontrei.'),
  block('post','Publicação fictícia','Fictional post','writer-post social','author: Ana\n---\nWe found the map.','author: Ana\n---\nEncontramos o mapa.'),
  block('tabs','Abas Markdown','Markdown tabs','writer-tabs guides','=== Overview\nWrite here.\n=== Notes','=== Visão geral\nEscreva aqui.\n=== Notas'),
  block('wiki','Ficha wiki','Wiki infobox','writer-wiki worldbuilding','title: Northern Archive\n---\nDescribe the archive.','title: Arquivo do Norte\n---\nDescreva o arquivo.'),
  block('avatar','Cartão de personagem','Character card','writer-avatar portrait','title: Ana\nlayout: left\n---\nDescribe the character.','title: Ana\nlayout: left\n---\nDescreva a personagem.'),
  block('scene-card','Ficha de cena','Scene card','writing cena','title: Opening\n---\nDraft the scene.','title: Abertura\n---\nEsboce a cena.'),
  block('character-voice','Voz da personagem','Character voice','writing diálogo dialogue','name: Ana\n---\nWrite a line of dialogue.','name: Ana\n---\nEscreva uma fala.'),
  block('beat-sheet','Batidas da história','Story beats','writing outline','---\nOpening | Ana finds a map.','---\nAbertura | Ana encontra um mapa.'),
  block('editor-note','Nota de revisão','Editorial note','writing revisão edit','---\nWhat needs revision?','---\nO que precisa de revisão?'),
  block('media-gallery','Galeria de mídias','Media gallery','writer-media-gallery fotos imagens pictures','type: all'),
  block('folder-overview','Visão geral da pasta','Folder overview','writer-folder-overview explorer','style: cards'),
  block('columns','Colunas Markdown','Markdown columns','layout','columns: 2\n### Notes\n--- end-column ---\n### References',
   'columns: 2\n### Notas\n--- end-column ---\n### Referências'),
  block('writer-columns','Colunas responsivas','Responsive columns','layout','### Notes\n---column---\n### References','### Notas\n---column---\n### Referências'),
  block('progressbar','Barra de progresso','Progress bar','progresso','kind: manual\nmax: 20\nvalue: 5'),
  block('widgets','Widget de relógio','Clock widget','relógio countdown contador quote counter','type: clock\nformat: 24hr'),
  block('meta-field','Campo YAML','YAML property field','propriedade frontmatter','property: status\ntype: view'),
  block('insta-toc','Sumário instantâneo','Instant table of contents','toc índice headings','maxDepth: 3'),
  block('longform-nav','Navegação de capítulos','Chapter navigation','longform booknav'),
  block('timeline','Linha do tempo narrativa','Narrative timeline','writer-timeline cronologia','+ Year one\n+ The expedition\n+ The journey begins.',
   '+ Ano um\n+ A expedição\n+ A jornada começa.'),
  block('timeline-labeled','Linha do tempo com campos','Timeline with fields','timeline cronologia','date: Year one\ntitle: The expedition\ncontent:\nThe journey begins.',
   'date: Ano um\ntitle: A expedição\ncontent:\nA jornada começa.'),
  block('bookshelf','Estante Longform','Longform bookshelf','writer-bookshelf library biblioteca','sort: title'),
  block('bibliography','Bibliografia local','Local bibliography','zotero citação citation'),
  block('basic-database','Banco de notas','Note database','writer-database tabela table',
   'folder: Writing\ncolumns: file, status\nview: table','folder: Escrita\ncolumns: file, status\nview: table'),
  block('basic-suite-chart','Gráfico do banco de notas','Note database chart','database gráfico chart',
   'folder: Writing\ngroup: status','folder: Escrita\ngroup: status')
 ];
}
function writerV9215InsertAction(action,editor,start,end){
 let text=action.textPt?writerUi(action.textPt,action.text):action.text;
 if(action.id==='date'){
  const today=new Date();
  text=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 }
 if(action.fence){
  if(start.ch>0)text='\n'+text;
  if(editor.getLine(end.line).slice(end.ch))text+='\n';
 }
 editor.replaceRange(text,start,end);
 editor.focus();
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
   const original=editor.getValue();
   const Search=require('obsidian').FuzzySuggestModal;
   const modal=new (class extends Search{
    getItems(){return this.app.vault.getMarkdownFiles().filter(file=>file.path!==ctx.file?.path);}
    getItemText(file){return file.path;}
    onChooseItem(file){
     const activeFile=this.app?.workspace?.activeEditor?.file;
     if((activeFile&&activeFile!==ctx.file)||editor.getValue()!==original){
      new Notice(writerUi('A nota mudou. Abra o menu novamente.','The note changed. Open the menu again.'));return;
     }
     editor.replaceRange('![['+file.path+']]',position,ctx.end);editor.focus();
    }
   })(this.plugin.app);
   modal.setPlaceholder(writerUi('Escolha a nota para incorporar…','Choose the note to embed…'));
   modal.open();return;
  }
  writerV9215InsertAction(action,editor,ctx.start,ctx.end);
 }
}
/* Shared Flow editor: check actual vault content before overwriting. */
async function writerV9216FlowOpenEditor(plugin,file,mount,button){
 const existing=mount.querySelector(':scope > .writer-v9215-flow-editor');
 if(existing){existing.remove();button.setAttribute('aria-expanded','false');return;}
 button.disabled=true;
 try{
  const path=file.path,baseline=file.stat?.mtime||0,original=await plugin.app.vault.cachedRead(file);
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
   if(save.disabled)return;
   save.disabled=true;
   try{
    const next=textarea.value;
    if(next!==original)await plugin.app.vault.process(file,fresh=>{
     if(file.path!==path||(file.stat?.mtime||0)!==baseline||fresh!==original)
      throw Error(writerUi('A nota mudou em outra janela. Abra-a antes de salvar, para não perder alterações.','The note changed elsewhere. Open it before saving to avoid overwriting changes.'));
     return next;
    });
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
function writerV9216FlowBlock(plugin,source,root,ctx,type){
 if(typeof writerV93FlowComposer==='function')return writerV93FlowComposer(plugin,source,root,ctx,type);
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
   plugin.registerMarkdownCodeBlockProcessor(id,(source,root,context)=>writerV9216FlowBlock(plugin,source,root,context,id));
 }
 plugin.addCommand({id:'v93-insert-block',name:writerUi('Escrita: catálogo de inserção rápida','Writing: quick insert catalog'),
  editorCheckCallback:(checking,editor,context)=>{
   if(!plugin.settings.v9215Flow.enabled)return false;
   if(checking)return true;
   const file=context.file,start=editor.getCursor('from'),end=editor.getCursor('to'),original=editor.getValue();
   const Picker=require('obsidian').FuzzySuggestModal;
   const modal=new (class extends Picker{
    getItems(){return writerV9215SlashActions().filter(action=>action.id!=='flow');}
    getItemText(action){return writerUi(action.pt,action.en)+(action.fence?' · '+action.fence:'');}
    onChooseItem(action){
     if(!plugin.settings.v9215Flow.enabled||context.file!==file||editor.getValue()!==original){
      new Notice(writerUi('A nota mudou. Abra o catálogo novamente.','The note changed. Open the catalog again.'));return;
     }
     writerV9215InsertAction(action,editor,start,end);
    }
   })(plugin.app);
   modal.setPlaceholder(writerUi('Inserir bloco…','Insert block…'));modal.open();return true;
  }
 });
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
  ['flowArrange','Permitir mover cartões','Allow moving cards'],
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
