'use strict';
/* v6 syntax and ratings: independently authored, safe DOM/CodeMirror implementations. */
function writerV6RubyTokens(source){
 const text=String(source||''),out=[];let start=-1,divider=-1,depth=0;
 for(let i=0;i<text.length;i++){
  if(text[i]==='\\'){i++;continue;}
  if(text[i]==='{'){if(depth===0){start=i;divider=-1;}depth++;continue;}
  if(text[i]==='|'&&depth===1&&divider<0){divider=i;continue;}
  if(text[i]!=='}'||!depth)continue;
  depth--;
  if(depth!==0||start<0||divider<start+2||i-divider<2||i-start>500)continue;
  const base=text.slice(start+1,divider),raw=text.slice(divider+1,i);
  const modifier=/\|(under|below|abaixo|over|above|acima)$/i.exec(raw);
  const position=modifier&&/^(under|below|abaixo)$/i.test(modifier[1])?'under':'over';
  const ruby=modifier?raw.slice(0,-modifier[0].length):raw;
  if(!ruby.trim())continue;
  if(/[\r\n]/.test(base+ruby))continue;
  out.push({from:start,to:i+1,base,ruby,position});
  start=-1;
 }
 return out;
}
function writerV6RubyNode(doc,base,ruby,level=1,position='over'){
 const root=doc.createElement('ruby');
 root.className='writer-v6-rendered writer-v6-ruby writer-v6-ruby-'+position+' writer-v6-ruby-lv'+Math.min(2,level);
 if(level<2){
  let offset=0;
  for(const nested of writerV6RubyTokens(base)){
   root.append(doc.createTextNode(base.slice(offset,nested.from)));
   root.append(writerV6RubyNode(doc,nested.base,nested.ruby,level+1,nested.position));
   offset=nested.to;
  }
  root.append(doc.createTextNode(base.slice(offset)));
 }else root.append(doc.createTextNode(base));
 const rt=doc.createElement('rt');rt.textContent=ruby;root.append(rt);
 return root;
}
function writerV6RubyHtml(source){
 const tokens=writerV6RubyTokens(source);
 if(!tokens.length)return source;
 const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 let result='',offset=0;
 for(const t of tokens){
  result+=escape(source.slice(offset,t.from))+'<ruby class="writer-v6-ruby writer-v6-ruby-'+t.position+'">'+escape(t.base)+'<rt>'+escape(t.ruby)+'</rt></ruby>';
  offset=t.to;
 }
 return result+escape(source.slice(offset));
}
function writerV6RubyStrip(source){
 let result=String(source||'');
 for(let n=0;n<2;n++)result=result.replace(/\{([^{}|\n]+)\|([^{}\n]+)\}/g,'$1');
 return result;
}
function writerV6RubyReading(root,cfg){
 if(root?.style){root.style.setProperty('--writer-v6-ruby-lv1-size',(cfg?.lv1Size||50)+'%');root.style.setProperty('--writer-v6-ruby-lv2-size',(cfg?.lv2Size||45)+'%');}
 for(const node of writerV6SafeTextNodes(root)){
  const text=node.nodeValue||'',tokens=writerV6RubyTokens(text);
  if(!tokens.length)continue;
  const doc=node.ownerDocument,fragment=doc.createDocumentFragment();let cursor=0;
  for(const token of tokens){
   if(token.from<cursor)continue;
   fragment.append(doc.createTextNode(text.slice(cursor,token.from)));
   fragment.append(writerV6RubyNode(doc,token.base,token.ruby,1,token.position));cursor=token.to;
  }
  fragment.append(doc.createTextNode(text.slice(cursor)));node.replaceWith(fragment);
 }
}
function writerV6BlockSpoilers(root){
 for(const opener of [...(root?.querySelectorAll?.('p')||[])]){
  if(!opener.isConnected||opener.children.length||opener.textContent.trim()!=='||')continue;
  let current=opener.nextElementSibling,closer=null;const contents=[];
  while(current&&contents.length<80){
   if(current.tagName==='P'&&!current.children.length&&current.textContent.trim()==='||'){closer=current;break;}
   if(current.tagName==='HR'||current.tagName==='SECTION')break;
   contents.push(current);current=current.nextElementSibling;
  }
  if(!closer||!contents.length||!opener.parentElement)continue;
  const doc=opener.ownerDocument,details=doc.createElement('details');
  details.className='writer-v6-rendered writer-v6-block-spoiler';
  const summary=doc.createElement('summary');summary.textContent=writerUi('Mostrar spoiler','Show spoiler');details.append(summary);
  opener.parentNode.insertBefore(details,opener);
  for(const child of contents)details.append(child);
  opener.remove();closer.remove();
 }
}
function writerV6SubtextReading(root){
 for(const p of root?.querySelectorAll?.('p')||[]){
  if(p.closest('pre,code,blockquote,.cm-editor,.writer-v6-rendered')||p.children.length)continue;
  const text=p.textContent||'';
  if(!/^-# [^\n]/.test(text))continue;
  p.classList.add('writer-v6-subtext');
  if(p.firstChild?.nodeType===3)p.firstChild.nodeValue=p.firstChild.nodeValue.replace(/^-# /,'');
 }
}
const WRITER_V6_RATING_SETS={
 star:{full:'★',empty:'☆',half:'⯪'},
 heart:{full:'♥',empty:'♡',half:'♥'},
 moon:{full:'🌕',empty:'🌑',half:'🌗'},
 circle:{full:'●',empty:'○',half:'◐'},
 bar:{full:'█',empty:'░',half:'▌'}
};
function writerV6RatingSymbols(kind,config){
 if(kind==='custom'){
  const full=String(config?.full||'◆').slice(0,12),empty=String(config?.empty||'◇').slice(0,12),half=String(config?.half||'◈').slice(0,12);
  return {full,empty,half};
 }
 return WRITER_V6_RATING_SETS[kind]||WRITER_V6_RATING_SETS.star;
}
function writerV6RatingTokens(text){
 const results=[];
 for(const match of String(text||'').matchAll(/\[rating:((?:\d+(?:\.\d+)?))\/(\d{1,2})(?::(star|heart|moon|circle|bar|custom))?\]/g)){
  const n=Number(match[1]),max=Number(match[2]);
  if(max<2||max>10||n<0||n>max||!Number.isFinite(n))continue;
  results.push({from:match.index,to:match.index+match[0].length,value:n,max,kind:match[3]||'star'});
 }
 return results;
}
function writerV6RatingLabel(t){return t.value+' / '+t.max;}
function writerV6RatingText(t,config){
 const set=writerV6RatingSymbols(t.kind,config);
 return Array.from({length:t.max},(_,i)=>{
  const delta=t.value-i;
  return delta>=1?set.full:delta>=.5?set.half:set.empty;
 }).join('');
}
function writerV6RatingMarker(t){return '[rating:'+t.value+'/'+t.max+':'+t.kind+']';}
function writerV6RatingReading(root,config){
 for(const node of writerV6SafeTextNodes(root)){
  const source=node.nodeValue||'',tokens=writerV6RatingTokens(source);if(!tokens.length)continue;
  const doc=node.ownerDocument,fragment=doc.createDocumentFragment();let previous=0;
  for(const t of tokens){
   if(t.from<previous)continue;
   fragment.append(doc.createTextNode(source.slice(previous,t.from)));
   const span=doc.createElement('span');span.className='writer-v6-rendered writer-v6-rating';
   span.textContent=writerV6RatingText(t,config)+(config?.showValue==='percent'?' '+Math.round(t.value/t.max*100)+'%':config?.showValue==='fraction'?' '+writerV6RatingLabel(t):'');
   span.title=writerV6RatingLabel(t);
   span.setAttribute('role','img');span.setAttribute('aria-label',writerUi('Avaliação ','Rating ')+writerV6RatingLabel(t));
   fragment.append(span);previous=t.to;
  }
  fragment.append(doc.createTextNode(source.slice(previous)));node.replaceWith(fragment);
 }
}
const WriterV6WidgetType=require('@codemirror/view').WidgetType||class{};
class WriterV6RubyWidget extends WriterV6WidgetType{
 constructor(token,config){super();this.token=token;this.config=config;}
 eq(other){
  return other instanceof WriterV6RubyWidget&&other.token.base===this.token.base&&other.token.ruby===this.token.ruby&&other.token.position===this.token.position&&other.config.lv1Size===this.config.lv1Size&&other.config.lv2Size===this.config.lv2Size;
 }
 toDOM(view){
  const root=writerV6RubyNode(view.dom.ownerDocument,this.token.base,this.token.ruby,1,this.token.position);
  root.classList.add('writer-v6-ruby-editor');
  root.style.setProperty('--writer-v6-ruby-lv1-size',(this.config.lv1Size||50)+'%');
  root.style.setProperty('--writer-v6-ruby-lv2-size',(this.config.lv2Size||45)+'%');
  root.setAttribute('aria-label',this.token.base+': '+this.token.ruby);
  return root;
 }
 ignoreEvent(){return false;}
}
class WriterV6RatingWidget extends WriterV6WidgetType{
 constructor(token,view,from,to,config){super();this.token=token;this.view=view;this.from=from;this.to=to;this.config=config;}
 eq(other){return other instanceof WriterV6RatingWidget&&writerV6RatingMarker(this.token)===writerV6RatingMarker(other.token)&&this.from===other.from&&this.to===other.to;}
 toDOM(view){
  const doc=view.dom.ownerDocument,container=doc.createElement('span');
  container.className='writer-v6-rating-editor';container.setAttribute('role','group');
  container.setAttribute('aria-label',writerUi('Avaliação ajustável','Adjustable rating'));
  const set=writerV6RatingSymbols(this.token.kind,this.config);
  for(let i=1;i<=this.token.max;i++){
   const button=doc.createElement('button');button.type='button';
   button.className='writer-v6-rating-button';
   button.textContent=i<=this.token.value?set.full:i-this.token.value===.5?set.half:set.empty;
   button.title=writerUi('Definir avaliação como ','Set rating to ')+i+'/'+this.token.max+writerUi(' (Shift: meio ponto)',' (Shift: half point)');
   button.setAttribute('aria-label',button.title);
   button.setAttribute('aria-pressed',String(i===this.token.value));
   button.addEventListener('mousedown',event=>event.preventDefault());
   button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const next={...this.token,value:event.shiftKey?i-.5:i};
    if(view.state.doc.sliceString(this.from,this.to)!==writerV6RatingMarker(this.token))return;
    view.dispatch({changes:{from:this.from,to:this.to,insert:writerV6RatingMarker(next)}});
   });
   container.append(button);
  }
  return container;
 }
 ignoreEvent(){return true;}
}
function writerV6MarkupDecorations(view,plugin){
 const cfg=plugin.settings.v6,doc=view.state.doc,ranges=[],protectedRanges=writerV6ProtectedRanges(doc.toString()),selection=view.state.selection.main;
 for(const v of view.visibleRanges||[{from:0,to:doc.length}]){
  const start=doc.lineAt(v.from).number,end=doc.lineAt(Math.min(v.to,doc.length)).number;
  for(let n=start;n<=end;n++){
   const line=doc.line(n),source=line.text;
   if(cfg.discordSyntax.enabled&&writerModuleOn(plugin,'discordSyntax')&&cfg.discordSyntax.blockSpoilers&&source.trim()==='||'&&!writerV6Overlaps(protectedRanges,line.from,line.to))ranges.push(Decoration.line({class:'writer-v6-spoiler-marker'}).range(line.from));
   if(cfg.discordSyntax.enabled&&cfg.discordSyntax.subtext&&writerModuleOn(plugin,'discordSyntax')&&/^-# /.test(source)&&!writerV6Overlaps(protectedRanges,line.from,line.to))
    ranges.push(Decoration.line({class:'writer-v6-subtext-line'}).range(line.from));
   if(cfg.ruby.enabled&&cfg.ruby.livePreview&&writerModuleOn(plugin,'ruby')){
    for(const token of writerV6RubyTokens(source)){
     const from=line.from+token.from,to=line.from+token.to;
     if(writerV6Overlaps(protectedRanges,from,to))continue;
     // Preserve editable source at the caret/selection; otherwise show the
     // same Ruby layout as Reading View, without mutating the Markdown file.
     if(selection.from<=to&&selection.to>=from)
      ranges.push(Decoration.mark({class:'writer-v6-ruby-source'}).range(from,to));
     else
      ranges.push(Decoration.replace({widget:new WriterV6RubyWidget(token,cfg.ruby)}).range(from,to));
    }
   }
   if(cfg.ratings.enabled&&writerModuleOn(plugin,'ratings')){
    for(const t of writerV6RatingTokens(source)){
     const from=line.from+t.from,to=line.from+t.to;
     if(writerV6Overlaps(protectedRanges,from,to)||selection.from<=to&&selection.to>=from)continue;
     ranges.push(Decoration.replace({widget:new WriterV6RatingWidget(t,view,from,to,cfg.ratings)}).range(from,to));
    }
   }
  }
 }
 return ranges.length?Decoration.set(ranges.sort((a,b)=>a.from-b.from||a.to-b.to),true):Decoration.none;
}
class WriterV6Markup{
 constructor(plugin){this.plugin=plugin;}
 register(){
  const p=this.plugin;
  p.registerMarkdownPostProcessor?.(root=>{
   if(writerV6Allowed(p,'ruby'))writerV6RubyReading(root,p.settings.v6.ruby);
   if(writerV6Allowed(p,'discordSyntax')){writerV6SubtextReading(root);if(p.settings.v6.discordSyntax.blockSpoilers)writerV6BlockSpoilers(root);}
   if(writerV6Allowed(p,'ratings'))writerV6RatingReading(root,p.settings.v6.ratings);
  });
  if(ViewPlugin?.fromClass){
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){this.decorations=writerV6MarkupDecorations(view,p);}
    update(update){if(update.docChanged||update.viewportChanged||update.selectionSet)this.decorations=writerV6MarkupDecorations(update.view,p);}
   },{decorations:v=>v.decorations}));
  }
  p.addCommand({id:'v6-wrap-ruby',name:writerUi('Ruby: anotar texto selecionado','Ruby: annotate selection'),editorCheckCallback:(checking,editor)=>{
   if(!editor?.getSelection?.())return false;
   if(!checking){
    const selection=editor.getSelection();
    editor.replaceSelection('{'+selection+'|'+writerUi('leitura','reading')+'}');
   }
   return true;
  }});
  p.addCommand({id:'v6-wrap-ruby-below',name:writerUi('Ruby: anotar abaixo da seleção','Ruby: annotate below selection'),editorCheckCallback:(checking,editor)=>{
   if(!editor?.getSelection?.())return false;
   if(!checking)editor.replaceSelection('{'+editor.getSelection()+'|'+writerUi('leitura','reading')+'|under}');
   return true;
  }});
  p.addCommand({id:'v6-ruby-strip',name:writerUi('Ruby: remover anotações da seleção','Ruby: remove annotations from selection'),editorCheckCallback:(checking,editor)=>{if(!editor?.getSelection?.())return false;if(!checking)editor.replaceSelection(writerV6RubyStrip(editor.getSelection()));return true;}});
  p.addCommand({id:'v6-ruby-html',name:writerUi('Ruby: converter seleção em HTML','Ruby: convert selection to HTML'),editorCheckCallback:(checking,editor)=>{if(!editor?.getSelection?.())return false;if(!checking)editor.replaceSelection(writerV6RubyHtml(editor.getSelection()));return true;}});
  p.addCommand({id:'v6-insert-rating',name:writerUi('Avaliação: inserir estrelas','Rating: insert stars'),editorCallback:editor=>editor.replaceSelection('[rating:3/5:star]')});
 }
 renderSettings(panel){
  const cfg=this.plugin.settings.v6;
  const root=panel.createDiv({cls:'writer-v6-settings-clean'});
  const ruby=root.createDiv({cls:'writer-v6-settings-section'});
  ruby.createEl('h3',{text:writerUi('Ruby · anotações','Ruby · annotations')});
  ruby.createEl('p',{cls:'dictionary-muted',text:writerUi('Exemplos: {palavra|pronúncia} (acima) e {palavra|anotação|under} (abaixo). No Live Preview, clique na anotação para editar o texto original.','Examples: {word|reading} (above) and {word|note|under} (below). In Live Preview, select an annotation to edit the source.')});
  new Setting(ruby).setName(writerUi('Ativar Ruby','Enable Ruby')).addToggle(t=>t.setValue(cfg.ruby.enabled).onChange(async v=>{cfg.ruby.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(ruby).setName(writerUi('Renderizar ao editar','Render while editing')).addToggle(t=>t.setValue(cfg.ruby.livePreview).onChange(async v=>{cfg.ruby.livePreview=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(ruby).setName(writerUi('Tamanho da anotação','Annotation size')).addSlider(t=>t.setLimits(25,100,5).setDynamicTooltip().setValue(cfg.ruby.lv1Size).onChange(async v=>{cfg.ruby.lv1Size=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(ruby).setName(writerUi('Tamanho do Ruby aninhado','Nested Ruby size')).addSlider(t=>t.setLimits(25,100,5).setDynamicTooltip().setValue(cfg.ruby.lv2Size).onChange(async v=>{cfg.ruby.lv2Size=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  const discord=root.createDiv({cls:'writer-v6-settings-section'});
  discord.createEl('h3',{text:writerUi('Discord Syntax','Discord syntax')});
  new Setting(discord).setName(writerUi('Ativar subtexto -#','Enable -# subtext')).addToggle(t=>t.setValue(cfg.discordSyntax.enabled).onChange(async v=>{cfg.discordSyntax.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(discord).setName(writerUi('Spoiler em bloco ||','Block spoiler ||')).addToggle(t=>t.setValue(cfg.discordSyntax.blockSpoilers).onChange(async v=>{cfg.discordSyntax.blockSpoilers=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  const ratings=root.createDiv({cls:'writer-v6-settings-section'});
  ratings.createEl('h3',{text:writerUi('Avaliações','Ratings')});
  ratings.createEl('p',{cls:'dictionary-muted',text:writerUi('Use [rating:3/5:star]. Clique para ajustar; Shift define meio ponto.','Use [rating:3/5:star]. Click to change; Shift sets a half point.')});
  new Setting(ratings).setName(writerUi('Habilitar avaliações','Enable ratings')).addToggle(t=>t.setValue(cfg.ratings.enabled).onChange(async v=>{cfg.ratings.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(ratings).setName(writerUi('Exibir valor','Show rating value')).addDropdown(d=>d.addOption('none',writerUi('Somente símbolos','Symbols only')).addOption('fraction',writerUi('Fração','Fraction')).addOption('percent',writerUi('Porcentagem','Percentage')).setValue(cfg.ratings.showValue||'none').onChange(async v=>{cfg.ratings.showValue=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  for(const [key,pt,en] of [['full','Símbolo preenchido','Filled symbol'],['empty','Símbolo vazio','Empty symbol'],['half','Meio ponto','Half symbol']])
   new Setting(ratings).setName(writerUi(pt,en)).addText(t=>t.setValue(String(cfg.ratings[key]||'')).onChange(async v=>{cfg.ratings[key]=v.slice(0,12);await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
 }
}
