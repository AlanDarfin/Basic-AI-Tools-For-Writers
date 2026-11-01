'use strict';
/* Original, self-contained writer utilities for v4 beta. No code from referenced plugins. */
const WRITER_V4_EXTRA_DEFAULTS={
  comments:{},mention:{enabled:true,sign:'@',folder:'',mode:'link',maxResults:8},
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
  typewriter:{...WRITER_V4_EXTRA_DEFAULTS.typewriter,...(old.typewriter||{})},
  wordwise:{...WRITER_V4_EXTRA_DEFAULTS.wordwise,...(old.wordwise||{}),
   prompts:{...WRITER_V4_EXTRA_DEFAULTS.wordwise.prompts,...(old.wordwise?.prompts||{})}},
  comments:old.comments&&typeof old.comments==='object'&&!Array.isArray(old.comments)?old.comments:{}
 };
 delete cfg.toolbar; // Drop retired toolbar preferences during settings migration.
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
class WriterV4Extras{
 constructor(plugin){this.plugin=plugin;this.lastNote=null;this.typewriterActiveViews=new WeakSet();this.typewriterViews=new Set();}
 resetTypewriterHighlights(cm=null){
  for(const instance of this.typewriterViews){
   if(!cm||instance.view===cm)instance.setInteracting(false);
  }
 }
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
  p.registerEvent(p.app.workspace.on('file-open',file=>{
   if(file?.extension==='md'){
    this.lastNote=file;
    // Opening another note is not user interaction with its editor.
    const cm=p.app.workspace.getActiveViewOfType?.(MarkdownView)?.editor?.cm;
    if(cm)this.resetTypewriterHighlights(cm);
   }
  }));
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
   this.resetTypewriterHighlights();this.updateTypewriterClass();await p.saveSettings();
   new Notice(this.config.typewriter.enabled?writerUi('Modo máquina de escrever ativado.','Typewriter mode enabled.'):writerUi('Modo máquina de escrever desativado.','Typewriter mode disabled.'));
  }});
  this.updateTypewriterClass();
  if(typeof p.register==='function')p.register(()=>{if(typeof document!=='undefined'&&document.body?.classList)document.body.classList.remove('writer-v4-typewriter','writer-v4-typewriter-focus');});
  if(EditorView.updateListener?.of){
   p.registerEditorExtension(EditorView.updateListener.of(update=>{
    if(!writerModuleOn(this.plugin,'typewriter')||!this.config.typewriter.enabled||
      !this.typewriterActiveViews.has(update.view)||(!update.docChanged&&!update.selectionSet)||!update.view.hasFocus)return;
    try{
     const pos=update.state.selection.main.head;
     update.view.dispatch({effects:EditorView.scrollIntoView(pos,{y:'center',yMargin:0})});
    }catch(error){console.warn('[Basic AI] Typewriter scroll:',error);}
   }));
  }
  // Only direct editor interaction may activate the highlight. Cursor restoration,
  // programmatic selections and viewport measurements must never enable it.
  if(ViewPlugin?.fromClass&&Decoration?.line){
   const owner=this;
   const refreshEffect=typeof StateEffect!=='undefined'&&StateEffect?.define?StateEffect.define():null;
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){
     this.view=view;this.interacting=false;this.decorations=Decoration.set([]);
     this.onPointer=event=>{
      if(event.target?.closest?.('.cm-content, .cm-gutters'))this.setInteracting(true);
     };
     this.onKey=event=>{
      if(['Shift','Control','Alt','Meta'].includes(event.key))return;
      this.setInteracting(true);
     };
     this.onWheel=()=>{
      // The wheel gesture also wins over delayed Remember Cursor restoration.
      owner.plugin.writerCursorMemory?.cancelPendingForEditor?.(view);
      this.setInteracting(false);
     };
     view.dom.addEventListener('pointerdown',this.onPointer,true);
     view.dom.addEventListener('keydown',this.onKey,true);
     view.dom.addEventListener('wheel',this.onWheel,{capture:true,passive:true});
     owner.typewriterViews.add(this);
    }
    setInteracting(value){
     if(value)owner.plugin.writerCursorMemory?.cancelPendingForEditor?.(this.view);
     const allowed=value&&writerModuleOn(owner.plugin,'typewriter')&&owner.config.typewriter.enabled===true;
     if(this.interacting===allowed)return;
     this.interacting=allowed;
     if(allowed)owner.typewriterActiveViews.add(this.view);
     else owner.typewriterActiveViews.delete(this.view);
     this.view.dom.classList.toggle('writer-v4-typewriter-engaged',allowed);
     if(refreshEffect&&this.view.dispatch)this.view.dispatch({effects:refreshEffect.of(null)});
     else this.decorations=this.mark(this.view);
    }
    mark(view){
     if(!this.interacting||!writerModuleOn(owner.plugin,'typewriter')||!owner.config.typewriter.enabled)
      return Decoration.set([]);
     const line=view.state.doc.lineAt(view.state.selection.main.head);
     return Decoration.set([Decoration.line({class:'writer-v4-typewriter-current-line'}).range(line.from)]);
    }
    update(update){
     if(update.docChanged||update.selectionSet||update.viewportChanged||update.focusChanged||
       update.transactions?.some(tr=>tr.effects?.some(effect=>refreshEffect&&effect.is(refreshEffect))))
      this.decorations=this.mark(update.view);
    }
    destroy(){
     this.view.dom.removeEventListener('pointerdown',this.onPointer,true);
     this.view.dom.removeEventListener('keydown',this.onKey,true);
     this.view.dom.removeEventListener('wheel',this.onWheel,true);
     this.view.dom.classList.remove('writer-v4-typewriter-engaged');
     owner.typewriterActiveViews.delete(this.view);
     owner.typewriterViews.delete(this);
    }
   },{decorations:value=>value.decorations}));
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
 runEditorAIAction(editor,kind){
   if(!writerModuleOn(this.plugin,'wordwise'))return new Notice(writerUi('Ações de IA ocultas nas configurações.','AI actions are hidden in settings.'));
   if(!writerModuleOn(this.plugin,'wordwise')||this.config.wordwise.enabled===false)return new Notice(writerUi('Ative as ações de IA nas configurações.','Enable AI actions in settings.'));
   if(!editor?.getSelection?.()?.trim())return new Notice(writerUi('Selecione um trecho no editor.','Select text in the editor.'));
   return writerV4OpenDiff(this.plugin,{task:this.config.wordwise.prompts[kind],autoGenerate:true});
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
   cfg[section][key]=v;if(section==='typewriter'){this.resetTypewriterHighlights();this.updateTypewriterClass();}await this.plugin.saveSettings();
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
  toggle('typewriter','enabled',writerUi('Modo máquina de escrever','Typewriter mode'));
  toggle('typewriter','focusMode',writerUi('Atenuar linhas fora de foco','Dim unfocused lines'));
  toggle('wordwise','enabled',writerUi('Ações de IA para escrita','AI writing actions'));
  panel.createEl('h4',{text:writerUi('Prompts das ações de IA','AI action prompts')});
  for(const [key,label] of [['improve','Melhorar estilo'],['shorten','Encurtar'],['expand','Expandir'],['simplify','Simplificar'],['tone','Mudar tom'],['dialogue','Melhorar diálogo'],['critique','Revisar pontos fracos'],['brainstorm','Explorar alternativa'],['grammar','Corrigir gramática']]){
   new Setting(panel).setName(label).addTextArea(t=>{t.inputEl.rows=3;t.setValue(cfg.wordwise.prompts[key]||'').onChange(async v=>{cfg.wordwise.prompts[key]=v;await this.plugin.saveSettings();});});
  }
 }
}
