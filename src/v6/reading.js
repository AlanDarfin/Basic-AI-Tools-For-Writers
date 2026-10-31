'use strict';
/* v6: reading-time and Discord timestamp support, without upstream bundled dependencies. */
function writerV6ReadingCount(source,{skipCode=true,skipFrontmatter=true}={}){
 let text=String(source||'');
 if(skipFrontmatter)text=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
 if(skipCode)text=text.replace(/^\s*(?:\x60{3,}|~{3,})[\s\S]*?^\s*(?:\x60{3,}|~{3,})[^\n]*$/gm,' ').replace(/\x60+[^\x60\n]*\x60+/g,' ');
 text=text.replace(/!?\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/<[^>]+>/g,' ');
 return (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
}
function writerV6ReadingEstimate(text,cfg){
 const words=writerV6ReadingCount(text,cfg),seconds=Math.max(0,Math.round(words*60/(cfg.wpm||230)));
 return {words,seconds,minutes:Math.ceil(seconds/60)};
}
function writerV6TimestampTokens(text){
 const out=[],rx=/<t:(-?\d{1,12})(?::([tTdDfFR]))?>/g;
 for(const m of String(text||'').matchAll(rx)){
  const unix=Number(m[1]);
  if(!Number.isSafeInteger(unix)||unix<0||unix>253402300799)continue;
  out.push({from:m.index,to:m.index+m[0].length,epoch:unix,format:m[2]||'f'});
 }
 return out;
}
function writerV6FormatTimestamp(epoch,format,locale='auto',timezone='local',now=Date.now()){
 const date=new Date(epoch*1000);
 if(!Number.isFinite(date.getTime()))return '';
 const lang=locale==='auto'?undefined:locale;
 const tz=timezone==='local'?undefined:timezone;
 const make=options=>{try{return new Intl.DateTimeFormat(lang,{...options,...(tz?{timeZone:tz}:{})}).format(date);}catch(_){return new Intl.DateTimeFormat(lang,options).format(date);}};
 if(format==='R'){
  const seconds=Math.round((epoch*1000-now)/1000),abs=Math.abs(seconds);
  const [unit,divisor]=abs>=86400?['day',86400]:abs>=3600?['hour',3600]:abs>=60?['minute',60]:['second',1];
  const relative=new Intl.RelativeTimeFormat(lang,{numeric:'auto'});
  return relative.format(Math.round(seconds/divisor),unit);
 }
 if(format==='t')return make({hour:'2-digit',minute:'2-digit'});
 if(format==='T')return make({hour:'2-digit',minute:'2-digit',second:'2-digit'});
 if(format==='d')return make({year:'numeric',month:'2-digit',day:'2-digit'});
 if(format==='D')return make({year:'numeric',month:'long',day:'numeric'});
 if(format==='F')return make({weekday:'long',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
 return make({year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
function writerV6TimestampReading(root,cfg){
 for(const node of writerV6SafeTextNodes(root)){
  const value=node.nodeValue||'',tokens=writerV6TimestampTokens(value);
  if(!tokens.length)continue;
  const doc=node.ownerDocument,fragment=doc.createDocumentFragment();let cursor=0;
  for(const t of tokens){
   if(t.from<cursor)continue;
   fragment.append(doc.createTextNode(value.slice(cursor,t.from)));
   const mark=doc.createElement('time');
   mark.className='writer-v6-rendered writer-v6-timestamp';
   mark.dateTime=new Date(t.epoch*1000).toISOString();
   mark.textContent=writerV6FormatTimestamp(t.epoch,t.format,cfg.locale,cfg.timezone);
   mark.title=value.slice(t.from,t.to);
   fragment.append(mark);cursor=t.to;
  }
  fragment.append(doc.createTextNode(value.slice(cursor)));
  node.replaceWith(fragment);
 }
}
function writerV6ReadingTextStatus(plugin,element){
 const cfg=plugin.settings.v6.readingTime,file=plugin.app.workspace.getActiveFile?.();
 if(!writerV6Allowed(plugin,'readingTime')||!cfg.status||!file||file.extension!=='md'){
  element.textContent='';element.style.display='none';return;
 }
 const view=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
 const source=view?.editor?.getValue?.()||'';
 const result=writerV6ReadingEstimate(source,cfg);
 element.style.display='';
 element.textContent=result.words+' '+writerUi('palavras','words')+' · '+result.minutes+' '+writerUi('min leitura','min read');
 element.title=writerUi('Estimativa de tempo de leitura','Estimated reading time');
}
class WriterV6Reading{
 constructor(plugin){this.plugin=plugin;this.updateTimer=null;}
 register(){
  const p=this.plugin;
  const status=p.addStatusBarItem?.();
  if(status){
   status.addClass('writer-v6-reading-status');
   const update=()=>{clearTimeout(this.updateTimer);this.updateTimer=setTimeout(()=>writerV6ReadingTextStatus(p,status),250);};
   p.registerEvent(p.app.workspace.on('active-leaf-change',update));
   p.registerEvent(p.app.vault.on('modify',file=>{if(file?.path===p.app.workspace.getActiveFile?.()?.path)update();}));
   p.registerEvent(p.app.workspace.on('editor-change',update));
   p.register(()=>clearTimeout(this.updateTimer));update();
  }
  p.addCommand({id:'v6-reading-time-selection',name:writerUi('Tempo de leitura: seleção ou nota','Reading time: selection or note'),callback:()=>{
   const editor=p.app.workspace.getActiveViewOfType?.(MarkdownView)?.editor;
   if(!editor)return;
   const text=editor.getSelection?.()||editor.getValue();
   const result=writerV6ReadingEstimate(text,p.settings.v6.readingTime);
   new Notice(result.words+' '+writerUi('palavras','words')+' · '+result.minutes+' '+writerUi('minutos de leitura','reading minutes'));
  }});
  p.registerMarkdownPostProcessor?.(root=>{if(writerV6Allowed(p,'timestamps'))writerV6TimestampReading(root,p.settings.v6.timestamps);});
  p.addCommand({id:'v6-insert-discord-time',name:writerUi('Data Discord: inserir marcador','Discord timestamp: insert marker'),editorCallback:editor=>this.openDatePicker(editor)});
  if(ViewPlugin?.fromClass){
   const owner=this;
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){this.decorations=this.build(view);}
    build(view){
     if(!writerV6Allowed(owner.plugin,'timestamps'))return Decoration.none;
     const ranges=[],doc=view.state.doc,protectedRanges=writerV6ProtectedRanges(doc.toString());
     for(const visible of view.visibleRanges||[{from:0,to:doc.length}]){
      const text=doc.sliceString(visible.from,visible.to);
      for(const t of writerV6TimestampTokens(text)){
       const from=visible.from+t.from,to=visible.from+t.to;
       if(writerV6Overlaps(protectedRanges,from,to))continue;
       ranges.push(Decoration.mark({class:'writer-v6-timestamp-source',attributes:{title:writerV6FormatTimestamp(t.epoch,t.format,owner.plugin.settings.v6.timestamps.locale,owner.plugin.settings.v6.timestamps.timezone)}}).range(from,to));
      }
     }
     return ranges.length?Decoration.set(ranges.sort((a,b)=>a.from-b.from),true):Decoration.none;
    }
    update(update){if(update.docChanged||update.viewportChanged)this.decorations=this.build(update.view);}
   },{decorations:v=>v.decorations}));
  }
 }
 openDatePicker(editor){
  const plugin=this.plugin,cfg=plugin.settings.v6.timestamps;
  const local=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  let dateValue=local,format='f';
  class Picker extends Modal{
   onOpen(){
    this.setTitle(writerUi('Inserir data do Discord','Insert Discord timestamp'));
    new Setting(this.contentEl).setName(writerUi('Data e hora local','Local date and time')).addText(t=>{
     t.inputEl.type='datetime-local';t.setValue(local).onChange(v=>dateValue=v);
    });
    new Setting(this.contentEl).setName(writerUi('Formato','Format')).addDropdown(d=>{
     for(const [id,label] of [['t',writerUi('Hora curta','Short time')],['T',writerUi('Hora com segundos','Long time')],['d',writerUi('Data curta','Short date')],['D',writerUi('Data longa','Long date')],['f',writerUi('Data e hora','Date & time')],['F',writerUi('Data completa','Full date')],['R',writerUi('Tempo relativo','Relative time')]])d.addOption(id,label);
     d.setValue('f').onChange(v=>format=v);
    });
    new Setting(this.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>this.close()))
      .addButton(b=>b.setButtonText(writerUi('Inserir','Insert')).setCta().onClick(async()=>{
       const unix=Math.floor(new Date(dateValue).getTime()/1000);
       if(!Number.isFinite(unix)||unix<0||unix>253402300799)return new Notice(writerUi('Data inválida.','Invalid date.'));
       const token='<t:'+unix+':'+format+'>';
       editor.replaceSelection(token);
       cfg.recent=[token,...(Array.isArray(cfg.recent)?cfg.recent:[]).filter(x=>x!==token)].slice(0,10);
       await plugin.saveSettings();this.close();
      }));
    const recent=Array.isArray(cfg.recent)?cfg.recent:[];
    if(recent.length){
     this.contentEl.createEl('h4',{text:writerUi('Últimas datas usadas','Recently used timestamps')});
     const list=this.contentEl.createDiv({cls:'writer-v6-date-history'});
     for(const token of recent.slice(0,6)){
      const valid=writerV6TimestampTokens(token)[0];
      if(!valid)continue;
      list.createEl('button',{text:writerV6FormatTimestamp(valid.epoch,valid.format,cfg.locale,cfg.timezone)}).addEventListener('click',()=>{editor.replaceSelection(token);this.close();});
     }
    }
   }
   onClose(){this.contentEl.empty();}
  }
  new Picker(plugin.app).open();
 }
 renderSettings(panel){
  const rt=this.plugin.settings.v6.readingTime,ts=this.plugin.settings.v6.timestamps;
  panel.createEl('h3',{text:writerUi('Tempo de leitura','Reading time')});
  new Setting(panel).setName(writerUi('Ativar tempo de leitura','Enable reading time')).addToggle(t=>t.setValue(rt.enabled).onChange(async v=>{rt.enabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Palavras por minuto','Words per minute')).addSlider(s=>s.setLimits(60,900,10).setDynamicTooltip().setValue(rt.wpm).onChange(async v=>{rt.wpm=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Ignorar código','Exclude code')).addToggle(t=>t.setValue(rt.skipCode).onChange(async v=>{rt.skipCode=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Ignorar frontmatter','Exclude frontmatter')).addToggle(t=>t.setValue(rt.skipFrontmatter).onChange(async v=>{rt.skipFrontmatter=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Exibir na barra de status','Show in status bar')).addToggle(t=>t.setValue(rt.status).onChange(async v=>{rt.status=v;await this.plugin.saveSettings();}));
  panel.createEl('h3',{text:writerUi('Datas do Discord','Discord timestamps')});
  new Setting(panel).setName(writerUi('Renderizar marcadores <t:…>','Render <t:…> timestamps')).addToggle(t=>t.setValue(ts.enabled).onChange(async v=>{ts.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(panel).setName(writerUi('Idioma de exibição','Display locale')).setDesc(writerUi('Automático, pt-BR, en-US ou espanhol','Auto, pt-BR, en-US or Spanish')).addDropdown(d=>d.addOption('auto',writerUi('Automático','Automatic')).addOption('pt-BR','Português (Brasil)').addOption('en-US','English (US)').addOption('es-ES','Español').setValue(ts.locale).onChange(async v=>{ts.locale=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Fuso horário IANA','IANA timezone')).setDesc(writerUi('Use local ou um nome como America/Sao_Paulo','Use local or a name such as America/New_York')).addText(t=>t.setValue(ts.timezone).onChange(async v=>{ts.timezone=String(v||'local').slice(0,60);await this.plugin.saveSettings();}));
 }
}
