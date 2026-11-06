'use strict';
/* Optional Number Suite additions: no Markdown writes, shared Reading View
   caption counters and line decorations in Live Preview. */
function writerV111NumberCfg(settings){
 const old=settings.v111Number&&typeof settings.v111Number==='object'&&!Array.isArray(settings.v111Number)?settings.v111Number:{};
 return settings.v111Number={livePreview:false,captionNumbers:false,...old};
}
function writerV111NumberStructure(source,scheme='hierarchical'){
 const text=String(source||'');
 if(text.length>2000000)return {headings:[],captions:[],footnotes:[]};
 const headings=typeof writerV1011NumberHeadings==='function'?writerV1011NumberHeadings(text,scheme):[];
 const captions=[],footnotes=[],counts={Figure:0,Table:0,Equation:0,Code:0};
 let yaml=false,fence='';
 for(const [index,line] of text.split(/\r?\n/).entries()){
  if(index===0&&line.trim()==='---'){yaml=true;continue;}
  if(yaml){if(/^(---|\.\.\.)\s*$/.test(line))yaml=false;continue;}
  const mFence=/^ {0,3}((?:\x60{3,}|~{3,}))/.exec(line);
  if(mFence){if(!fence)fence=mFence[1][0];else if(fence===mFence[1][0])fence='';continue;}
  if(fence||/^\s*(?:>|[-*+]\s+|(?:\d+)[.)]\s+)/.test(line))continue;
  const cap=/^(Figure|Table|Equation|Code):[ \t]+(.{1,500})\s*$/.exec(line);
  if(cap){counts[cap[1]]++;captions.push({line:index,kind:cap[1],number:counts[cap[1]],title:cap[2]});continue;}
  const foot=/^\[\^(?:(footnote|endnote):)?([^\]\s]{1,90})\]:\s*/.exec(line);
  if(foot&&footnotes.length<200)footnotes.push({line:index,kind:foot[1]==='endnote'?'endnote':'footnote',id:foot[2]});
  if(captions.length>=800)break;
 }
 return {headings,captions,footnotes};
}
function writerV111NumberLineSpecs(plugin,view){
 const cfg=writerV111NumberCfg(plugin.settings),base=writerV1011NumberCfg(plugin.settings);
 if(!cfg.livePreview||!base.enabled||!base.virtual||!view?.dom?.closest?.('.is-live-preview'))return [];
 const leaf=(plugin.app.workspace?.getLeavesOfType?.('markdown')||[]).find(x=>x.view?.editor?.cm===view);
 const file=leaf?.view?.file;
 if(!file||writerV1011NumberDisabled(plugin,file))return [];
 const items=writerV111NumberStructure(view.state.doc.toString(),base.scheme).headings;
 return items.filter(x=>x.line<view.state.doc.lines&&!x.stored)
  .map(x=>({line:x.line+1,number:x.number+'.'}));
}
function writerV111NumberRefresh(plugin){
 const effect=plugin._writerV111NumberEffect;
 for(const leaf of plugin.app.workspace?.getLeavesOfType?.('markdown')||[]){
  try{if(effect)leaf.view?.editor?.cm?.dispatch?.({effects:effect.of(null)});}catch(e){}
  const file=leaf.view?.file,root=leaf.view?.containerEl?.querySelector?.('.markdown-preview-view');
  if(root){
   const cfg=writerV111NumberCfg(plugin.settings),base=writerV1011NumberCfg(plugin.settings);
   root.classList.toggle('writer-v111-caption-numbers',Boolean(cfg.captionNumbers&&base.enabled&&base.captions&&file&&!writerV1011NumberDisabled(plugin,file)));
  }
 }
}
function writerV111NumberRegister(plugin){
 writerV111NumberCfg(plugin.settings);
 plugin.registerMarkdownPostProcessor?.((el,ctx)=>{
  const root=el.closest?.('.markdown-preview-view'),file=plugin.app.vault.getAbstractFileByPath?.(ctx.sourcePath);
  const base=writerV1011NumberCfg(plugin.settings),cfg=writerV111NumberCfg(plugin.settings);
  root?.classList?.toggle('writer-v111-caption-numbers',Boolean(cfg.captionNumbers&&base.enabled&&base.captions&&file&&!writerV1011NumberDisabled(plugin,file)));
 });
 if(typeof ViewPlugin!=='undefined'&&typeof Decoration!=='undefined'&&typeof plugin.registerEditorExtension==='function'){
  const effect=require('@codemirror/state').StateEffect.define();
  plugin._writerV111NumberEffect=effect;
  plugin.registerEditorExtension(ViewPlugin.fromClass(class{
   constructor(view){this.decorations=this.build(view);}
   build(view){
    const specs=writerV111NumberLineSpecs(plugin,view),ranges=[];
    for(const spec of specs){
     const line=view.state.doc.line(spec.line);
     ranges.push(Decoration.line({attributes:{class:'writer-v111-number-live-heading','data-basic-number':spec.number}}).range(line.from));
    }
    return ranges.length?Decoration.set(ranges,true):Decoration.none;
   }
   update(u){
    if(u.docChanged||u.viewportChanged||u.transactions.some(tr=>tr.effects.some(e=>e.is(effect))))
     this.decorations=this.build(u.view);
   }
  },{decorations:x=>x.decorations}));
 }
 for(const type of ['file-open','layout-change','active-leaf-change'])
  plugin.registerEvent?.(plugin.app.workspace.on(type,()=>writerV111NumberRefresh(plugin)));
 plugin.addCommand?.({id:'v111-number-structure-outline',
  name:writerUi('Numeração: estrutura, figuras e notas de rodapé','Numbering: heading, caption and footnote outline'),
  callback:()=>writerV111NumberStructureModal(plugin)});
}
function writerV111NumberStructureModal(plugin){
 const file=plugin.app.workspace.getActiveFile?.();
 if(!file||file.extension!=='md')return new Notice(writerUi('Abra uma nota Markdown.','Open a Markdown note.'));
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Estrutura numerada','Numbered structure'));
 modal.onOpen=async()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v111-number-structure');
  try{
   const data=writerV111NumberStructure(await plugin.app.vault.read(file),writerV1011NumberCfg(plugin.settings).scheme);
   const sections=[
    [writerUi('Títulos','Headings'),data.headings.map(x=>({line:x.line,label:x.number+' '+x.title,level:x.level}))],
    [writerUi('Legendas','Captions'),data.captions.map(x=>({line:x.line,label:x.kind+' '+x.number+' — '+x.title}))],
    [writerUi('Notas de rodapé e fim','Footnotes and endnotes'),data.footnotes.map(x=>({line:x.line,label:(x.kind==='endnote'?'Endnote ':'Footnote ')+x.id}))]
   ];
   for(const [heading,items] of sections){
    const section=root.createEl('details');section.open=heading===sections[0][0];
    section.createEl('summary',{text:heading+' · '+items.length});
    if(!items.length)section.createEl('p',{text:writerUi('Nenhum elemento encontrado.','No entries.')});
    for(const item of items.slice(0,200)){
     const button=section.createEl('button',{cls:'writer-v111-structure-row',attr:{type:'button'}});
     button.style.paddingInlineStart=Math.min(40,(item.level||1)*8)+'px';
     button.createSpan({text:item.label});button.createEl('small',{text:writerUi('Linha ','Line ')+(item.line+1)});
     button.addEventListener('click',async()=>{
      const leaf=plugin.app.workspace.getLeaf('tab');await leaf.openFile(file);
      leaf.view?.editor?.setCursor?.({line:item.line,ch:0});modal.close();
     });
    }
   }
  }catch(error){root.createEl('p',{text:String(error.message||error)});}
 };
 modal.open();
}
function writerV111NumberSettings(plugin,panel){
 const cfg=writerV111NumberCfg(plugin.settings);
 panel.createEl('h3',{text:writerUi('Number Suite · funções extras','Number Suite · additional features')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Números de títulos no Live Preview e numeração de legendas somente visuais. Nenhum arquivo é alterado.',
  'Display-only Live Preview headings and caption counters. No Markdown changes.')});
 for(const [key,pt,en] of [
  ['livePreview','Numeração dos títulos no Live Preview','Heading numbers in Live Preview'],
  ['captionNumbers','Numerar legendas no modo de leitura','Number captions in Reading View']
 ])new Setting(panel).setName(writerUi(pt,en))
   .addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{
    cfg[key]=v;await plugin.saveSettings();writerV111NumberRefresh(plugin);
   }));
 new Setting(panel).setName(writerUi('Estrutura e legendas','Structure and captions'))
  .addButton(b=>b.setButtonText(writerUi('Abrir sumário','Open outline'))
   .onClick(()=>writerV111NumberStructureModal(plugin)));
}
