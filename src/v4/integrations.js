'use strict';
/* Original, self-contained writer utilities for v4 beta. No code from referenced plugins. */
const WRITER_V4_EXTRA_DEFAULTS={
  comments:{},mention:{enabled:true,sign:'@',folder:'',mode:'link',maxResults:8},
  toolbar:{enabled:true,mobileMode:'native'},
  typewriter:{enabled:false,centerPercent:0.43,focusMode:false},
  wordwise:{enabled:true,prompts:{
    improve:'Improve fluency, clarity and rhythm while preserving the writer’s intent, voice and Markdown.',
    shorten:'Make the selection more concise without removing essential meaning or changing Markdown links.',
    expand:'Expand this passage naturally, maintaining perspective, tense, voice and factual accuracy.',
    simplify:'Make this passage easier to read, preserving its important meaning and Markdown.',
    tone:'Rewrite with an expressive, polished literary tone without introducing new facts.',
    dialogue:'Improve the naturalness and characterization of this dialogue without altering its intent.',
    critique:'Give concise, specific suggestions about weak points and improvements, then offer an improved rewrite of this passage. Return only the improved passage.',
    brainstorm:'Suggest a creative alternative approach to this scene while preserving its characters and established facts. Return only the alternative text.',
    grammar:'Correct spelling, grammar and punctuation while preserving intentional literary choices and all Markdown syntax.'
  }}
};
function writerV4ExtraMerge(settings){
 const old=settings.writerV4Extras&&typeof settings.writerV4Extras==='object'?settings.writerV4Extras:{};
 const cfg=settings.writerV4Extras={
  ...WRITER_V4_EXTRA_DEFAULTS,...old,
  mention:{...WRITER_V4_EXTRA_DEFAULTS.mention,...(old.mention||{})},
  toolbar:{...WRITER_V4_EXTRA_DEFAULTS.toolbar,...(old.toolbar||{})},
  typewriter:{...WRITER_V4_EXTRA_DEFAULTS.typewriter,...(old.typewriter||{})},
  wordwise:{...WRITER_V4_EXTRA_DEFAULTS.wordwise,...(old.wordwise||{}),
   prompts:{...WRITER_V4_EXTRA_DEFAULTS.wordwise.prompts,...(old.wordwise?.prompts||{})}},
  comments:old.comments&&typeof old.comments==='object'&&!Array.isArray(old.comments)?old.comments:{}
 };
 cfg.toolbar.mobileMode='native';
  cfg.toolbar.mobileModeConfirmed=true;
  cfg.mention.maxResults=Math.max(2,Math.min(30,Number(cfg.mention.maxResults)||8));
 cfg.typewriter.centerPercent=Math.max(.2,Math.min(.8,Number(cfg.typewriter.centerPercent)||.43));
 return cfg;
}
function writerV4NoteEditor(plugin,file){
 const leaves=plugin.app.workspace.getLeavesOfType('markdown')||[];
 return leaves.find(leaf=>leaf.view?.file?.path===file?.path)?.view?.editor||null;
}
class WriterV4Mentions extends EditorSuggest{
 constructor(plugin){super(plugin.app);this.plugin=plugin;}
 get opts(){return this.plugin.settings.writerV4Extras.mention;}
 onTrigger(cursor,editor,file){
  if(!writerModuleOn(this.plugin,'mentions')||!this.opts.enabled||file?.extension!=='md')return null;
  const sign=String(this.opts.sign||'@').slice(0,1);
  const preceding=editor.getLine(cursor.line).slice(0,cursor.ch);
  const i=preceding.lastIndexOf(sign);
  if(i<0||(i>0&&!/\s/.test(preceding[i-1])))return null;
  const query=preceding.slice(i+1);
  if(query.length>60||/[\[\]{}()|#\n\r]/.test(query))return null;
  return {start:{line:cursor.line,ch:i},end:cursor,query};
 }
 getSuggestions(context){
  const config=this.opts,query=context.query.trim().toLocaleLowerCase(),folder=String(config.folder||'').trim().replace(/^\/+|\/+$/g,'');
  return this.plugin.app.vault.getMarkdownFiles()
   .filter(file=>!folder||file.path.startsWith(folder+'/'))
   .filter(file=>file.basename.toLocaleLowerCase().includes(query))
   .slice(0,config.maxResults).concat(query?[{createNew:true,basename:context.query.trim(),path:''}]:[]);
 }
 renderSuggestion(file,el){
  el.createEl('div',{text:file.createNew?writerUi('Criar nota: ','Create note: ')+file.basename:file.basename});
  if(!file.createNew)el.createEl('small',{text:file.path,cls:'writer-v4-mention-hint'});
 }
 async selectSuggestion(file,evt){
  const {editor,start,end}=this.context||{};
  if(!editor||!file)return;
  if(file.createNew){
   const name=String(file.basename||'').replace(/[\\/:*?"<>|]/g,'-').trim().slice(0,80);
   if(!name)return;
   const folder=String(this.opts.folder||'').trim().replace(/^\/+|\/+$/g,'');
   const target=[folder,name+'.md'].filter(Boolean).join('/');
   let existing=this.plugin.app.vault.getAbstractFileByPath(target);
   if(!existing){
    const modal=new Modal(this.plugin.app);
    modal.onOpen=()=>{
     modal.setTitle(writerUi('Criar nota para menção?','Create mentioned note?'));
     modal.contentEl.createEl('p',{text:target});
     new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
      .addButton(b=>b.setButtonText(writerUi('Criar','Create')).setCta().onClick(async()=>{
       try{
        if(folder){let partial='';for(const part of folder.split('/')){partial=partial?partial+'/'+part:part;if(!(await this.plugin.app.vault.adapter.exists(partial)))await this.plugin.app.vault.createFolder(partial);}}
        const created=this.plugin.app.vault.getAbstractFileByPath(target)||await this.plugin.app.vault.create(target,'');
        this.insertMention(created,editor,start,end);modal.close();
       }catch(error){new Notice(String(error?.message||error));}
      }));
    };modal.open();return;
   }
   file=existing;
  }
  this.insertMention(file,editor,start,end);
 }
 insertMention(file,editor,start,end){
  const label=(this.opts.sign||'@')+file.basename;
  const source=this.context?.file?.path||'';
  const replacement=this.opts.mode==='text'?label:this.plugin.app.fileManager.generateMarkdownLink(file,source,'',label);
  editor.replaceRange(replacement,start,end);
 }
}
function writerV4FormatText(original,kind){
 const text=String(original||'');
 switch(kind){
  case 'bold':return '**'+text+'**';
  case 'italic':return '*'+text+'*';
  case 'heading':return text.split('\n').map(line=>'## '+line).join('\n');
  case 'quote':return text.split('\n').map(line=>'> '+line).join('\n');
  case 'list':return text.split('\n').map(line=>'- '+line).join('\n');
  case 'link':return '['+text+'](https://example.com)';
  default:return text;
 }
}
class WriterV4Extras{
 constructor(plugin){this.plugin=plugin;this.lastNote=null;}
 get config(){return this.plugin.settings.writerV4Extras;}
 getCurrentNote(){
  const app=this.plugin.app;
  const active=app.workspace.getActiveFile?.();
  if(active?.extension==='md')return active;
  const leaves=app.workspace.getLeavesOfType('markdown')||[];
  const visible=leaves.find(leaf=>leaf.view?.file?.extension==='md')?.view?.file;
  return visible||this.lastNote;
 }
 register(){
  const p=this.plugin;
  p.registerEvent(p.app.workspace.on('file-open',file=>{if(file?.extension==='md')this.lastNote=file;}));
  this.lastNote=this.getCurrentNote();
  p.registerEvent(p.app.vault.on('rename',(file,oldPath)=>{
   if(!(file instanceof TFile))return;
   const store=this.config.comments||{};
   if(store[oldPath]){
    store[file.path]=[...(store[file.path]||[]),...store[oldPath]];
    delete store[oldPath];p.saveSettings().catch(console.warn);
   }
  }));
  p.registerEditorSuggest(new WriterV4Mentions(p));
  p.addCommand({id:'v4-add-comment',name:writerUi('Comentar seleção','Comment on selection'),editorCallback:(editor,view)=>{
    this.commentSelection(view?.file,editor);
  }});
  p.addCommand({id:'v4-wordwise',name:writerUi('Ferramentas inteligentes de escrita','AI writing actions'),editorCallback:()=>this.wordwise()});
  p.addCommand({id:'v4-editing-toolbar',name:writerUi('Barra de edição: formatar seleção','Editing toolbar: format selection'),
   editorCallback:(editor,view)=>this.openEditingToolbar(editor,view)});
  // Individual actions can be pinned to Obsidian's native mobile toolbar.
  for(const [kind,pt,en] of [
   ['bold','Negrito','Bold'],['italic','Itálico','Italic'],
   ['heading','Título H2','Heading H2'],['quote','Citação','Blockquote'],
   ['list','Lista','List'],['link','Link','Link']
  ])p.addCommand({id:'v4-format-'+kind,name:writerUi('Formatar: '+pt,'Format: '+en),
    editorCallback:editor=>this.applyEditorFormat(editor,kind)});
  for(const [key,pt,en] of [
   ['improve','Melhorar estilo','Improve style'],['shorten','Encurtar texto','Shorten text'],
   ['expand','Expandir texto','Expand text'],['simplify','Simplificar texto','Simplify text'],
   ['tone','Mudar tom','Change tone'],['dialogue','Melhorar diálogo','Improve dialogue'],
   ['grammar','Corrigir gramática','Fix grammar'],['critique','Revisar pontos fracos','Critique passage'],
   ['brainstorm','Explorar alternativa','Brainstorm alternative']
  ])p.addCommand({id:'v4-writing-'+key,name:writerUi('IA: '+pt,'AI: '+en),
    editorCallback:editor=>this.runEditorAIAction(editor,key)});
  p.addCommand({id:'v4-toggle-typewriter',name:writerUi('Alternar modo máquina de escrever','Toggle typewriter mode'),callback:async()=>{
   this.config.typewriter.enabled=!this.config.typewriter.enabled;
   this.updateTypewriterClass();await p.saveSettings();
   new Notice(this.config.typewriter.enabled?writerUi('Modo máquina de escrever ativado.','Typewriter mode enabled.'):writerUi('Modo máquina de escrever desativado.','Typewriter mode disabled.'));
  }});
  this.updateTypewriterClass();
  if(typeof p.register==='function')p.register(()=>{if(typeof document!=='undefined'&&document.body?.classList)document.body.classList.remove('writer-v4-typewriter','writer-v4-typewriter-focus');});
  if(EditorView.updateListener?.of){
   p.registerEditorExtension(EditorView.updateListener.of(update=>{
    if(!writerModuleOn(this.plugin,'typewriter')||!this.config.typewriter.enabled||(!update.docChanged&&!update.selectionSet)||!update.view.hasFocus)return;
    try{
     const pos=update.state.selection.main.head;
     update.view.dispatch({effects:EditorView.scrollIntoView(pos,{y:'center',yMargin:0})});
    }catch(error){console.warn('[Basic AI] Typewriter scroll:',error);}
   }));
  }
  // Explicit line decoration works even when Obsidian Mobile does not maintain .cm-activeLine.
  if(ViewPlugin?.fromClass&&Decoration?.line){
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){this.decorations=this.mark(view);}
    mark(view){
     const line=view.state.doc.lineAt(view.state.selection.main.head);
     return Decoration.set([Decoration.line({class:'writer-v4-typewriter-current-line'}).range(line.from)]);
    }
    update(update){
     if(update.docChanged||update.selectionSet||update.viewportChanged||update.focusChanged)
      this.decorations=this.mark(update.view);
    }
   },{decorations:value=>value.decorations}));
  }
  if(ViewPlugin?.fromClass){
   const owner=this;
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){
     this.view=view;this.dom=view.dom.createDiv({cls:'writer-v4-floating-toolbar'});
     this.isMobile=owner.plugin.app.isMobile===true||(typeof navigator!=='undefined'&&/Android|iPad|iPhone/i.test(navigator.userAgent||''));
     if(this.isMobile)this.dom.addClass('writer-v4-toolbar-mobile');
     this.savedRange=null;this.expanded=false;this.dismissedKey=null;
     this.onSelection=()=>{
      clearTimeout(this.selectionTimer);
      this.selectionTimer=setTimeout(()=>this.refresh(),70);
     };
     view.dom.addEventListener('pointerup',this.onSelection);
     view.dom.addEventListener('touchend',this.onSelection,{passive:true});
     view.dom.addEventListener('keyup',this.onSelection);
     this.ownerDocument=view.dom.ownerDocument;
     this.ownerDocument?.addEventListener('selectionchange',this.onSelection);
     this.visualViewport=this.ownerDocument?.defaultView?.visualViewport||null;
     this.onViewport=()=>this.positionMobile();
     this.visualViewport?.addEventListener?.('resize',this.onViewport);
     this.visualViewport?.addEventListener?.('scroll',this.onViewport);
     if(this.isMobile){
      const nav=this.dom.createDiv({cls:'writer-v4-mobile-actions'});
      const toggle=nav.createEl('button',{text:writerUi('Aa Formatar','Aa Format'),attr:{'aria-expanded':'false','aria-label':writerUi('Expandir ferramentas','Expand editing tools')}});
      toggle.addEventListener('pointerdown',e=>e.preventDefault());
      toggle.addEventListener('click',()=>{
       this.expanded=!this.expanded;toggle.setAttribute('aria-expanded',String(this.expanded));
       this.dom.toggleClass('writer-v4-expanded',this.expanded);this.positionMobile();
      });
      const ai=nav.createEl('button',{text:'✦ IA',attr:{'aria-label':writerUi('Ações de IA','AI writing actions')}});
      ai.addEventListener('pointerdown',e=>e.preventDefault());
      ai.addEventListener('click',()=>this.useSelectedRange(()=>owner.wordwise()));
      const close=nav.createEl('button',{text:'×',cls:'writer-v4-toolbar-close',attr:{'aria-label':writerUi('Fechar barra','Close toolbar')}});
      close.addEventListener('pointerdown',e=>e.preventDefault());
      close.addEventListener('click',()=>{
       const selected=this.view.state.selection.main;this.dismissedKey=selected.from+':'+selected.to;
       this.expanded=false;this.dom.removeClass('is-visible','writer-v4-expanded');
      });
     }
     const formatActions=this.dom.createDiv({cls:'writer-v4-format-actions'});
     const formats=[
      ['B','bold','**','**'],['I','italic','*','*'],
      ['H','heading','## ',''],['“”','quote','> ',''],
      ['🔗','link','[','](https://example.com)'],['•','list','- ',''],
      ['✦','wordwise',null,null]
     ];
     for(const [label,title,before,after] of formats){
      if(this.isMobile&&title==='wordwise')continue;
      const button=formatActions.createEl('button',{text:label,attr:{'aria-label':title,title}});
      button.addEventListener('pointerdown',e=>e.preventDefault());
      button.addEventListener('click',()=>this.useSelectedRange(()=>{
       if(title==='wordwise')return owner.wordwise();
       const selected=this.view.state.selection.main;
       if(selected.empty)return;
       const raw=this.view.state.doc.sliceString(selected.from,selected.to);
       const value=(before||'')+raw+(after||'');
       this.view.dispatch({changes:{from:selected.from,to:selected.to,insert:value},selection:{anchor:selected.from+value.length}});
       this.expanded=false;this.savedRange=null;
       this.dom.removeClass('is-visible','writer-v4-expanded');this.view.focus();
      }));
     }
     this.refresh();
    }
    useSelectedRange(action){
     const current=this.view.state.selection.main;
     const selected=!current.empty?current:this.savedRange;
     if(!selected||selected.from===selected.to||selected.to>this.view.state.doc.length)return;
     if(current.empty)this.view.dispatch({selection:{anchor:selected.from,head:selected.to}});
     action();
    }
    update(update){
     if(update.docChanged){this.savedRange=null;this.expanded=false;this.dismissedKey=null;}
     if(update.selectionSet||update.docChanged)this.refresh();
    }
    refresh(){
     if(!owner.config.toolbar.enabled||this.isMobile){
      this.dom.removeClass('is-visible');return;
     }
     const selected=this.view.state.selection.main;
     if(selected.empty){
      this.savedRange=null;this.expanded=false;this.dismissedKey=null;
      this.dom.removeClass('is-visible','writer-v4-expanded');return;
     }
     if(!this.isMobile&&!this.view.hasFocus){this.dom.removeClass('is-visible');return;}
     const key=selected.from+':'+selected.to;
     if(this.dismissedKey===key)return;
     if(this.savedRange&&(this.savedRange.from!==selected.from||this.savedRange.to!==selected.to)){
      this.expanded=false;this.dom.removeClass('writer-v4-expanded');
     }
     this.savedRange={from:selected.from,to:selected.to};
     this.dom.addClass('is-visible');
     if(this.isMobile){this.positionMobile();return;}
     const pos=this.view.coordsAtPos(selected.from),box=this.view.dom.getBoundingClientRect();
     if(!pos){this.dom.removeClass('is-visible');return;}
     this.dom.style.top=Math.max(4,pos.top-box.top-42)+'px';
     this.dom.style.left=Math.max(0,Math.min(box.width-240,pos.left-box.left))+'px';
    }
    positionMobile(){
     if(!this.isMobile||!this.dom.hasClass('is-visible'))return;
     const selected=this.view.state.selection.main;
     const offset=selected.empty?this.savedRange?.to:selected.to;
     if(!Number.isInteger(offset))return;
     const rect=this.view.coordsAtPos(offset);
     if(!rect)return;
     const win=this.ownerDocument?.defaultView,vv=this.visualViewport;
     const leftEdge=vv?.offsetLeft||0,topEdge=vv?.offsetTop||0;
     const width=vv?.width||win?.innerWidth||360,height=vv?.height||win?.innerHeight||650;
     const barHeight=this.dom.offsetHeight||46,barWidth=this.dom.offsetWidth||185;
     const safeBottom=topEdge+height-12,safeTop=topEdge+46;
     // Avoid both Android's native selection popup and Obsidian's keyboard ribbon.
     let top=rect.bottom+62;
     if(top+barHeight>safeBottom)top=rect.top-barHeight-66;
     top=Math.max(safeTop,Math.min(top,safeBottom-barHeight));
     const left=Math.max(leftEdge+8,Math.min(rect.left-40,leftEdge+width-barWidth-8));
     this.dom.style.setProperty('top',top+'px','important');
     this.dom.style.setProperty('left',left+'px','important');
     this.dom.style.setProperty('inset-block-start',top+'px','important');
     this.dom.style.setProperty('inset-inline-start',left+'px','important');
     this.dom.style.setProperty('bottom','auto','important');
     this.dom.style.setProperty('right','auto','important');
    }
    destroy(){
     clearTimeout(this.selectionTimer);
     this.view.dom.removeEventListener('pointerup',this.onSelection);
     this.view.dom.removeEventListener('touchend',this.onSelection);
     this.view.dom.removeEventListener('keyup',this.onSelection);
     this.ownerDocument?.removeEventListener('selectionchange',this.onSelection);
     this.visualViewport?.removeEventListener?.('resize',this.onViewport);
     this.visualViewport?.removeEventListener?.('scroll',this.onViewport);
     this.dom.remove();
    }
   }));
  }
 }
 updateTypewriterClass(){
  if(typeof document!=='undefined'&&document.body?.classList){document.body.classList.toggle('writer-v4-typewriter',writerModuleOn(this.plugin,'typewriter')&&this.config.typewriter.enabled===true);document.body.classList.toggle('writer-v4-typewriter-focus',writerModuleOn(this.plugin,'typewriter')&&this.config.typewriter.enabled===true&&this.config.typewriter.focusMode===true);}
 }
 currentEditor(){
  const app=this.plugin.app;
  const active=app.workspace.getActiveViewOfType(MarkdownView);
  if(active?.editor&&active.file?.extension==='md')return active;
  const note=this.getCurrentNote();
  return (app.workspace.getLeavesOfType('markdown')||[]).find(leaf=>leaf.view?.file?.path===note?.path&&leaf.view.editor)?.view||null;
 }
 commentSelection(file,editor){
  if(!writerModuleOn(this.plugin,'comments'))return new Notice(writerUi('Comentários ocultos nas configurações.','Comments are hidden in settings.'));
  if(!file||file.extension!=='md'||!editor?.getSelection?.()?.trim())return new Notice(writerUi('Selecione um trecho para comentar.','Select text to comment on.'));
  const quote=editor.getSelection().slice(0,2000);
  const modal=new Modal(this.plugin.app);
  let body='';
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Comentar trecho','Comment on passage'));
   modal.contentEl.createEl('blockquote',{text:quote.slice(0,250)});
   new Setting(modal.contentEl).setName(writerUi('Comentário','Comment')).addTextArea(t=>{t.inputEl.rows=5;t.onChange(v=>body=v);});
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setButtonText(writerUi('Salvar comentário','Save comment')).setCta().onClick(async()=>{
    if(!body.trim())return;
    const record={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),quote,
      body:body.trim().slice(0,10000),at:new Date().toISOString(),resolved:false};
    const items=this.config.comments[file.path]||(this.config.comments[file.path]=[]);
    items.push(record);await this.plugin.saveSettings();modal.close();
    new Notice(writerUi('Comentário adicionado.','Comment added.'));
   }));
  };
  modal.open();
 }
 async jumpComment(file,comment){
  await this.plugin.app.workspace.getLeaf(false).openFile(file);
  const view=this.currentEditor();
  if(!view?.editor)return;
  const text=view.editor.getValue(),pos=text.indexOf(comment.quote);
  if(pos<0)return new Notice(writerUi('Trecho original alterado; comentário preservado.','Quote changed; comment is preserved.'));
  view.editor.setSelection(view.editor.offsetToPos(pos),view.editor.offsetToPos(pos+comment.quote.length));
  view.editor.scrollIntoView({from:view.editor.offsetToPos(pos),to:view.editor.offsetToPos(pos+comment.quote.length)},true);
 }
 drawComments(panel,project,projectsView){
  panel.createEl('h4',{text:writerUi('Comentários do manuscrito','Manuscript comments')});
  panel.createEl('p',{text:writerUi('Anotações locais ligadas a trechos dos capítulos. Não são enviadas à IA.','Local annotations anchored to passages in chapters. Never sent to AI.'),cls:'writer-tools-muted'});
  const scenes=projectsView.activeScenes(project),files=[project.file,...scenes.map(s=>projectsView.resolveScene(project,s.title)).filter(Boolean)];
  const unique=[...new Map(files.map(f=>[f.path,f])).values()];
  const bar=panel.createDiv({cls:'writer-project-notes-toolbar'});
  const dropdown=bar.createEl('select',{attr:{'aria-label':writerUi('Capítulo para comentar','Chapter to comment')}});
  for(const file of unique){const opt=dropdown.createEl('option',{text:file.basename});opt.value=file.path;}
  const current=projectsView.commentsFilePath||this.getCurrentNote()?.path||project.file.path;
  dropdown.value=unique.some(f=>f.path===current)?current:project.file.path;
  dropdown.addEventListener('change',()=>{projectsView.commentsFilePath=dropdown.value;projectsView.render();});
  bar.createEl('button',{text:writerUi('Comentar seleção','Comment selection')}).addEventListener('click',()=>{
   const file=unique.find(f=>f.path===dropdown.value),editor=writerV4NoteEditor(this.plugin,file);
   if(!editor)return new Notice(writerUi('Abra o capítulo e selecione o texto antes de comentar.','Open the chapter and select text to comment.'));
   this.commentSelection(file,editor);
  });
  const filter=panel.createEl('label',{cls:'writer-v4-comment-filter'});
  const check=filter.createEl('input',{attr:{type:'checkbox'}});check.checked=!!projectsView.showResolvedComments;
  filter.createSpan({text:writerUi('Mostrar comentários resolvidos','Show resolved comments')});
  check.addEventListener('change',()=>{projectsView.showResolvedComments=check.checked;projectsView.render();});
  let count=0;
  for(const file of unique){
   const items=(this.config.comments[file.path]||[]).filter(c=>projectsView.showResolvedComments||!c.resolved);
   if(!items.length)continue;
   const section=panel.createDiv({cls:'writer-v4-comment-section'});
   section.createEl('h5',{text:file.basename});
   for(const comment of items){
    count++;
    const card=section.createDiv({cls:'writer-v4-comment-card'+(comment.resolved?' is-resolved':'')});
    card.createEl('blockquote',{text:comment.quote||''});
    card.createEl('p',{text:comment.body});
    card.createEl('small',{text:new Date(comment.at).toLocaleString()});
    const actions=card.createDiv({cls:'writer-v4-actions'});
    actions.createEl('button',{text:writerUi('Localizar','Locate')}).addEventListener('click',()=>this.jumpComment(file,comment));
    actions.createEl('button',{text:comment.resolved?writerUi('Reabrir','Reopen'):writerUi('Resolver','Resolve')}).addEventListener('click',async()=>{
     comment.resolved=!comment.resolved;await this.plugin.saveSettings();projectsView.render();
    });
    actions.createEl('button',{text:writerUi('Excluir','Delete')}).addEventListener('click',()=>{
     const modal=new Modal(this.plugin.app);
     modal.onOpen=()=>{
      modal.setTitle(writerUi('Excluir comentário?','Delete comment?'));
      new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
       .addButton(b=>b.setButtonText(writerUi('Excluir','Delete')).setWarning().onClick(async()=>{
        this.config.comments[file.path]=this.config.comments[file.path].filter(c=>c.id!==comment.id);
        await this.plugin.saveSettings();modal.close();projectsView.render();
       }));
     };modal.open();
    });
   }
  }
  if(!count)panel.createEl('p',{text:writerUi('Nenhum comentário para exibir.','No comments to show.'),cls:'writer-tools-muted'});
 }
 applyEditorFormat(editor,kind){
   if(this.config.toolbar.enabled===false)return new Notice(writerUi('Ative as ferramentas de edição nas configurações.','Enable editing tools in settings.'));
   const text=editor?.getSelection?.()||'';
   if(!text.trim())return new Notice(writerUi('Selecione um trecho no editor.','Select text in the editor.'));
   editor.replaceRange(writerV4FormatText(text,kind),editor.getCursor('from'),editor.getCursor('to'));
  }
 runEditorAIAction(editor,kind){
   if(!writerModuleOn(this.plugin,'wordwise'))return new Notice(writerUi('Ações de IA ocultas nas configurações.','AI actions are hidden in settings.'));
   if(!writerModuleOn(this.plugin,'wordwise')||this.config.wordwise.enabled===false)return new Notice(writerUi('Ative as ações de IA nas configurações.','Enable AI actions in settings.'));
   if(!editor?.getSelection?.()?.trim())return new Notice(writerUi('Selecione um trecho no editor.','Select text in the editor.'));
   return writerV4OpenDiff(this.plugin,{task:this.config.wordwise.prompts[kind],autoGenerate:true});
  }
 openEditingToolbar(editor,view){
  if(this.config.toolbar.enabled===false)return new Notice(writerUi('Ative as ferramentas de edição nas configurações.','Enable editing tools in settings.'));
  if(!editor?.getSelection?.()?.trim())return new Notice(writerUi('Selecione um trecho para formatar.','Select a passage to format.'));
  const original=editor.getSelection();
  const from=editor.posToOffset(editor.getCursor('from')),to=editor.posToOffset(editor.getCursor('to'));
  const items=[
   ['bold',writerUi('Negrito','Bold')],['italic',writerUi('Itálico','Italic')],
   ['heading',writerUi('Título H2','Heading H2')],['quote',writerUi('Citação','Blockquote')],
   ['list',writerUi('Lista','List')],['link',writerUi('Link','Link')]
  ];
  const modal=new Modal(this.plugin.app);
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Barra de edição · Basic AI','Editing toolbar · Basic AI'));
   modal.contentEl.createEl('p',{cls:'writer-tools-muted',text:writerUi('Escolha uma formatação. A seleção será preservada até a aplicação.','Choose formatting. The selection is preserved until applying.')});
   const actions=modal.contentEl.createDiv({cls:'writer-v4-editor-command-grid'});
   for(const [kind,label] of items){
    actions.createEl('button',{text:label}).addEventListener('click',()=>{
     try{
      if(editor.getValue().slice(from,to)!==original)throw Error(writerUi('A nota mudou. Selecione novamente o trecho.','The note changed. Select the passage again.'));
      const replacement=writerV4FormatText(original,kind);
      editor.replaceRange(replacement,editor.offsetToPos(from),editor.offsetToPos(to));
      modal.close();editor.focus?.();
     }catch(error){new Notice(String(error?.message||error));}
    });
   }
   const extra=modal.contentEl.createDiv({cls:'writer-v4-editor-command-grid'});
   extra.createEl('button',{text:writerUi('Ações com IA ✦','AI writing actions ✦')}).addEventListener('click',()=>{
    modal.close();
    if(editor.getValue().slice(from,to)!==original)return new Notice(writerUi('Selecione novamente o trecho.','Select the passage again.'));
    editor.setSelection(editor.offsetToPos(from),editor.offsetToPos(to));
    this.wordwise();
   });
  };
  modal.open();
 }
 wordwise(){
  if(!writerModuleOn(this.plugin,'wordwise')||this.config.wordwise.enabled===false)return new Notice(writerUi('Ative as ações de IA nas configurações.','Enable AI actions in settings.'));
  const view=this.currentEditor();
  if(!view?.editor?.getSelection?.()?.trim())return new Notice(writerUi('Selecione um trecho para usar as ações de IA.','Select text to use AI actions.'));
  const items=[
   ['improve',writerUi('Melhorar estilo','Improve style')],['shorten',writerUi('Encurtar','Shorten')],
   ['expand',writerUi('Expandir','Expand')],['simplify',writerUi('Simplificar','Simplify')],
   ['tone',writerUi('Mudar tom','Change tone')],['dialogue',writerUi('Melhorar diálogo','Improve dialogue')],['critique',writerUi('Revisar pontos fracos','Critique & improve')],['brainstorm',writerUi('Explorar alternativa','Brainstorm alternative')],['grammar',writerUi('Corrigir gramática','Fix grammar')]
  ];
  const modal=new Modal(this.plugin.app);
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Ações de escrita com IA','AI writing actions'));
   modal.contentEl.createEl('p',{text:writerUi('A ação selecionada enviará o trecho ao seu provedor de IA e abrirá um comparador antes de alterar a nota.','The selected action sends the passage to your AI provider and opens a comparison before any edit.'),cls:'writer-tools-muted'});
   for(const [key,label] of items){
    const b=modal.contentEl.createEl('button',{text:label,cls:'writer-v4-wordwise-action'});
    b.addEventListener('click',()=>{modal.close();writerV4OpenDiff(this.plugin,{task:this.config.wordwise.prompts[key],autoGenerate:true});});
   }
  };
  modal.open();
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Ferramentas integradas · v4','Integrated writing tools · v4')});
  const cfg=this.config;
  const toggle=(section,key,label)=>new Setting(panel).setName(label).addToggle(t=>t.setValue(cfg[section][key]!==false).onChange(async v=>{
   cfg[section][key]=v;if(section==='typewriter')this.updateTypewriterClass();await this.plugin.saveSettings();
  }));
  toggle('mention','enabled',writerUi('Menções de notas','Note mentions'));
  new Setting(panel).setName(writerUi('Símbolo de menção','Mention trigger')).addDropdown(d=>{
   for(const sign of ['@','#','§','+','!'])d.addOption(sign,sign);
   d.setValue(cfg.mention.sign).onChange(async v=>{cfg.mention.sign=v;await this.plugin.saveSettings();});
  });
  new Setting(panel).setName(writerUi('Pasta das menções','Mention folder')).addText(t=>t.setPlaceholder('Characters').setValue(cfg.mention.folder).onChange(async v=>{
   cfg.mention.folder=v;await this.plugin.saveSettings();
  }));
  new Setting(panel).setName(writerUi('Inserção de menções','Mention insertion')).addDropdown(d=>{
   d.addOption('link',writerUi('Wikilink','Wikilink')).addOption('text',writerUi('Apenas texto','Plain text'));
   d.setValue(cfg.mention.mode).onChange(async v=>{cfg.mention.mode=v;await this.plugin.saveSettings();});
  });
  toggle('toolbar','enabled',writerUi('Comandos de formatação','Formatting commands'));
  new Setting(panel).setName(writerUi('Barra móvel do Obsidian','Obsidian mobile toolbar'))
   .setDesc(writerUi('No Android, adicione os comandos Basic AI: Formatar (Negrito, Itálico, Título, Citação, Lista, Link) e IA à barra nativa. A barra flutuante adicional está desativada.','On Android, add individual Basic AI Format and AI commands to the native mobile toolbar. No additional floating toolbar.'));
  new Setting(panel).setName(writerUi('Abrir todas as ferramentas','Open all formatting actions'))
   .addButton(b=>b.setButtonText(writerUi('Abrir menu','Open menu')).onClick(()=>{
    const view=this.currentEditor();this.openEditingToolbar(view?.editor,view);
   }));
  toggle('typewriter','enabled',writerUi('Modo máquina de escrever','Typewriter mode'));
  toggle('typewriter','focusMode',writerUi('Atenuar linhas fora de foco','Dim unfocused lines'));
  toggle('wordwise','enabled',writerUi('Ações de IA para escrita','AI writing actions'));
  panel.createEl('h4',{text:writerUi('Prompts das ações de IA','AI action prompts')});
  for(const [key,label] of [['improve','Melhorar estilo'],['shorten','Encurtar'],['expand','Expandir'],['simplify','Simplificar'],['tone','Mudar tom'],['dialogue','Melhorar diálogo'],['critique','Revisar pontos fracos'],['brainstorm','Explorar alternativa'],['grammar','Corrigir gramática']]){
   new Setting(panel).setName(label).addTextArea(t=>{t.inputEl.rows=3;t.setValue(cfg.wordwise.prompts[key]||'').onChange(async v=>{cfg.wordwise.prompts[key]=v;await this.plugin.saveSettings();});});
  }
 }
}
