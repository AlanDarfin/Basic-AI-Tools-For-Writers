'use strict';
/* v9.3.0: original interactive Flow board and optional / quick insert.
 * Inspired by Make.md workflow concepts, not a Make.md source-code port.
 * Flow moves persist in Basic settings and never silently edit Markdown. */
const WRITER_V93_SLASH_ACTIONS=[
 {id:'heading',pt:'Título H2',en:'Heading H2',icon:'heading-2',content:'## '},
 {id:'task',pt:'Tarefa',en:'Task',icon:'list-check',content:'- [ ] '},
 {id:'callout',pt:'Aviso',en:'Callout',icon:'message-square',content:'> [!note]\n> '},
 {id:'divider',pt:'Separador',en:'Divider',icon:'minus',content:'---\n'},
 {id:'link',pt:'Link de nota',en:'Note link',icon:'link',content:'[[]]'},
 {id:'overview',pt:'Overview de pasta',en:'Folder Overview',icon:'folder-tree',content:'\n\x60\x60\x60folder-overview\nstyle: cards\nsort: name-asc\nsubfolders: true\n\x60\x60\x60\n'},
 {id:'flow',pt:'Quadro Flow',en:'Flow board',icon:'panels-top-left',content:'\n\x60\x60\x60flow\nid: meu-fluxo\n=== Ideias\n- Planejar nova cena\n=== Escrevendo\n- Escrever primeiro rascunho\n=== Concluído\n- Revisar abertura\n\x60\x60\x60\n'},
 {id:'tabs',pt:'Abas',en:'Tabs',icon:'panels-top-left',content:'\n\x60\x60\x60tabs\n=== Primeiro\nTexto\n=== Segundo\nTexto\n\x60\x60\x60\n'},
 {id:'gallery',pt:'Galeria',en:'Gallery',icon:'images',content:'\n\x60\x60\x60media-gallery\npath: Imagens\nlayout: grid\n\x60\x60\x60\n'},
 {id:'progress',pt:'Barra de progresso',en:'Progress bar',icon:'chart-no-axes-column',content:'\n\x60\x60\x60progressbar\nkind: manual\nmin: 0\nmax: 100\nvalue: 25\n\x60\x60\x60\n'},
 {id:'date',pt:'Data de hoje',en:'Today date',icon:'calendar',content:null}
];
function writerV93FlowMerge(settings){
 const raw=settings.v93Flow&&typeof settings.v93Flow==='object'&&!Array.isArray(settings.v93Flow)?settings.v93Flow:{};
 const cfg=settings.v93Flow={enabled:true,slashEnabled:false,boards:{},...raw};
 cfg.enabled=cfg.enabled!==false;cfg.slashEnabled=cfg.slashEnabled===true;
 const boards=cfg.boards&&typeof cfg.boards==='object'&&!Array.isArray(cfg.boards)?cfg.boards:{};
 cfg.boards=Object.fromEntries(Object.entries(boards).slice(-120).filter(([id,order])=>
  typeof id==='string'&&id.length<300&&order&&typeof order==='object'&&!Array.isArray(order)
 ).map(([id,order])=>[id,Object.fromEntries(Object.entries(order).slice(0,120).filter(([name,section])=>
  typeof name==='string'&&name.length<80&&typeof section==='string'&&section.length<70))]));
 return cfg;
}
function writerV93FlowParse(source){
 const lines=String(source||'').slice(0,18000).split(/\r?\n/);
 const result={id:'',columns:[]},seen=new Set();
 let current=null,count=0;
 for(const line of lines){
  const id=/^\s*id:\s*([\w-]{1,70})\s*$/.exec(line);
  if(id&&!current){result.id=id[1];continue;}
  const heading=/^\s*===\s+(.+?)\s*$/.exec(line);
  if(heading){
   const title=heading[1].slice(0,70);
   if(seen.has(title)||result.columns.length>=10){current=null;continue;}
   seen.add(title);current={name:title,cards:[]};result.columns.push(current);continue;
  }
  if(current&&current.cards.length<100){
   const card=/^\s*[-*]\s+(?:\[[xX ]\]\s*)?(.+?)\s*$/.exec(line);
   if(card)current.cards.push({id:String(count++),label:card[1].slice(0,300)});
  }
 }
 return result;
}
function writerV93FlowKey(path,id){return String(path||'').slice(0,170)+'::'+String(id||'').slice(0,70);}
function writerV93FlowBoard(plugin,source,el,ctx){
 const cfg=plugin.settings.v93Flow;
 if(!cfg.enabled){el.createEl('p',{text:writerUi('Ative Flow nas configurações.','Enable Flow in settings.')});return;}
 const parsed=writerV93FlowParse(source),key=writerV93FlowKey(ctx.sourcePath,parsed.id);
 const board=el.createDiv({cls:'writer-v93-flow'});
 if(!parsed.columns.length){board.createEl('p',{text:writerUi('Crie seções === Nome e itens - Cartão.','Create === Column sections and - Card items.')});return;}
 const original=parsed.columns.flatMap(col=>col.cards.map(card=>({...card,section:col.name})));
 const valid=new Set(parsed.columns.map(col=>col.name));
 let state={...(cfg.boards[key]||{})},drag=null;
 const persist=async(id,to)=>{
  if(!valid.has(to))return;
  state={...state,[id]:to};
  cfg.boards=Object.fromEntries(Object.entries({...cfg.boards,[key]:state}).slice(-120));
  await plugin.saveSettings();
  draw();
 };
 const draw=()=>{
  board.empty();
  const heading=board.createDiv({cls:'writer-v93-flow-heading'});
  heading.createEl('strong',{text:writerUi('Flow · Quadro de escrita','Flow · Writing board')});
  heading.createSpan({text:writerUi('Arraste ou use as setas','Drag or use arrows')});
  const columns=board.createDiv({cls:'writer-v93-flow-columns'});
  for(let i=0;i<parsed.columns.length;i++){
   const col=parsed.columns[i];
   const cards=original.filter(card=>(valid.has(state[card.id])?state[card.id]:card.section)===col.name);
   const lane=columns.createDiv({cls:'writer-v93-flow-column'});
   const header=lane.createDiv({cls:'writer-v93-flow-column-header'});
   header.createEl('strong',{text:col.name});header.createSpan({text:String(cards.length)});
   lane.addEventListener('dragover',e=>{if(drag!==null)e.preventDefault();});
   lane.addEventListener('drop',e=>{
    if(drag===null)return;e.preventDefault();const id=drag;drag=null;void persist(id,col.name);
   });
   for(const card of cards){
    const row=lane.createDiv({cls:'writer-v93-flow-card',attr:{draggable:'true','aria-label':card.label}});
    row.createSpan({cls:'writer-v93-flow-card-label',text:card.label});
    row.addEventListener('dragstart',e=>{
     drag=card.id;
     if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.id);}
    });
    row.addEventListener('dragend',()=>{drag=null;});
    const actions=row.createSpan({cls:'writer-v93-flow-card-actions'});
    for(const [delta,icon] of [[-1,'chevron-left'],[1,'chevron-right']]){
     const button=actions.createEl('button',{attr:{type:'button',
      'aria-label':delta<0?writerUi('Mover para a coluna anterior','Move to previous column'):writerUi('Mover para a próxima coluna','Move to next column')}});
     require('obsidian').setIcon(button,icon);
     button.disabled=!parsed.columns[i+delta];
     button.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const next=parsed.columns[i+delta];if(next)void persist(card.id,next.name);
     });
    }
   }
  }
 };
 draw();
}
class WriterV93SlashSuggest extends EditorSuggest{
 constructor(plugin){super(plugin.app);this.plugin=plugin;}
 onTrigger(cursor,editor,file){
  if(!this.plugin.settings.v93Flow?.slashEnabled)return null;
  const prefix=editor.getLine(cursor.line).slice(0,cursor.ch);
  const found=/(^|\s)\/([a-zA-Z0-9_-]{0,35})$/.exec(prefix);
  if(!found)return null;
  return {start:{line:cursor.line,ch:cursor.ch-found[2].length-1},end:cursor,query:found[2]};
 }
 getSuggestions(context){
  const query=context.query.toLocaleLowerCase();
  return WRITER_V93_SLASH_ACTIONS.filter(a=>a.id.includes(query)||
   writerUi(a.pt,a.en).toLocaleLowerCase().includes(query)).slice(0,12);
 }
 renderSuggestion(a,el){
  require('obsidian').setIcon(el.createSpan({cls:'writer-v93-slash-icon'}),a.icon);
  el.createSpan({text:writerUi(a.pt,a.en)});
 }
 selectSuggestion(action){
  const ctx=this.context;
  if(!ctx||!action)return;
  const content=action.id==='date'?new Date().toISOString().slice(0,10):action.content;
  if(typeof content==='string')ctx.editor.replaceRange(content,ctx.start,ctx.end);
 }
}
function writerV93FlowRegister(plugin){
 plugin.registerMarkdownCodeBlockProcessor('flow',(source,el,ctx)=>writerV93FlowBoard(plugin,source,el,ctx));
 plugin.addCommand({id:'v93-insert-flow',name:writerUi('Flow: inserir quadro','Flow: insert board'),
  editorCallback:editor=>editor.replaceSelection(WRITER_V93_SLASH_ACTIONS.find(a=>a.id==='flow').content)});
 plugin.addCommand({id:'v93-insert-block',name:writerUi('Escrita: catálogo de inserção rápida','Writing: quick insert catalog'),
  editorCallback:editor=>{
   const modal=new Modal(plugin.app);
   modal.onOpen=()=>{
    modal.setTitle(writerUi('Inserir bloco','Insert block'));
    for(const a of WRITER_V93_SLASH_ACTIONS){
     const b=modal.contentEl.createEl('button',{cls:'writer-v93-slash-option',attr:{type:'button'}});
     require('obsidian').setIcon(b.createSpan(),a.icon);
     b.createSpan({text:writerUi(a.pt,a.en)});
     b.addEventListener('click',()=>{
      editor.replaceSelection(a.id==='date'?new Date().toISOString().slice(0,10):a.content);
      modal.close();
     });
    }
   };modal.open();
  }});
 plugin.registerEditorSuggest(new WriterV93SlashSuggest(plugin));
}
function writerV93FlowSettings(plugin,panel){
 const cfg=plugin.settings.v93Flow;
 panel.createEl('h3',{text:writerUi('Flow e inserção rápida (beta)','Flow and quick insert (beta)')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Quadros Markdown interativos: mover cartões salva as colunas nas configurações do Basic, sem reescrever a nota. O menu / é opcional para evitar conflitos com outros plugins.',
  'Interactive Markdown boards: moving cards saves columns in Basic settings without rewriting the note. Slash suggestions are opt-in to avoid plugin conflicts.'
 )});
 new Setting(panel).setName(writerUi('Ativar Flow','Enable Flow'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Ativar atalhos com /','Enable slash commands'))
  .addToggle(t=>t.setValue(cfg.slashEnabled).onChange(async v=>{cfg.slashEnabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Abrir menu de blocos','Open block catalog'))
  .setDesc(writerUi('Use o comando Escrita: catálogo de inserção rápida no editor.','Use Writing: quick insert catalog from the editor command palette.'));
}
