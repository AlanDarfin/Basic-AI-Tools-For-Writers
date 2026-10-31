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
  const base=text.slice(start+1,divider),ruby=text.slice(divider+1,i);
  if(/[\r\n]/.test(base+ruby))continue;
  out.push({from:start,to:i+1,base,ruby});
  start=-1;
 }
 return out;
}
function writerV6RubyNode(doc,base,ruby){
 const root=doc.createElement('ruby');root.className='writer-v6-rendered writer-v6-ruby';
 root.append(doc.createTextNode(base));
 const rt=doc.createElement('rt');rt.textContent=ruby;root.append(rt);
 return root;
}
function writerV6RubyReading(root){
 for(const node of writerV6SafeTextNodes(root)){
  const text=node.nodeValue||'',tokens=writerV6RubyTokens(text);
  if(!tokens.length)continue;
  const doc=node.ownerDocument,fragment=doc.createDocumentFragment();let cursor=0;
  for(const token of tokens){
   if(token.from<cursor)continue;
   fragment.append(doc.createTextNode(text.slice(cursor,token.from)));
   fragment.append(writerV6RubyNode(doc,token.base,token.ruby));cursor=token.to;
  }
  fragment.append(doc.createTextNode(text.slice(cursor)));node.replaceWith(fragment);
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
function writerV6RatingTokens(text){
 const results=[];
 for(const match of String(text||'').matchAll(/\[rating:((?:\d+(?:\.\d+)?))\/(\d{1,2})(?::(star|heart|moon|circle|bar))?\]/g)){
  const n=Number(match[1]),max=Number(match[2]);
  if(max<2||max>10||n<0||n>max||!Number.isFinite(n))continue;
  results.push({from:match.index,to:match.index+match[0].length,value:n,max,kind:match[3]||'star'});
 }
 return results;
}
function writerV6RatingLabel(t){return t.value+' / '+t.max;}
function writerV6RatingText(t){
 const set=WRITER_V6_RATING_SETS[t.kind]||WRITER_V6_RATING_SETS.star;
 return Array.from({length:t.max},(_,i)=>{
  const delta=t.value-i;
  return delta>=1?set.full:delta>=.5?set.half:set.empty;
 }).join('');
}
function writerV6RatingMarker(t){return '[rating:'+t.value+'/'+t.max+':'+t.kind+']';}
function writerV6RatingReading(root){
 for(const node of writerV6SafeTextNodes(root)){
  const source=node.nodeValue||'',tokens=writerV6RatingTokens(source);if(!tokens.length)continue;
  const doc=node.ownerDocument,fragment=doc.createDocumentFragment();let previous=0;
  for(const t of tokens){
   if(t.from<previous)continue;
   fragment.append(doc.createTextNode(source.slice(previous,t.from)));
   const span=doc.createElement('span');span.className='writer-v6-rendered writer-v6-rating';
   span.textContent=writerV6RatingText(t);
   span.title=writerV6RatingLabel(t);
   span.setAttribute('role','img');span.setAttribute('aria-label',writerUi('Avaliação ','Rating ')+writerV6RatingLabel(t));
   fragment.append(span);previous=t.to;
  }
  fragment.append(doc.createTextNode(source.slice(previous)));node.replaceWith(fragment);
 }
}
const WriterV6WidgetType=require('@codemirror/view').WidgetType;
class WriterV6RatingWidget extends WriterV6WidgetType{
 constructor(token,view,from,to){super();this.token=token;this.view=view;this.from=from;this.to=to;}
 eq(other){return other instanceof WriterV6RatingWidget&&writerV6RatingMarker(this.token)===writerV6RatingMarker(other.token)&&this.from===other.from&&this.to===other.to;}
 toDOM(view){
  const doc=view.dom.ownerDocument,container=doc.createElement('span');
  container.className='writer-v6-rating-editor';container.setAttribute('role','group');
  container.setAttribute('aria-label',writerUi('Avaliação ajustável','Adjustable rating'));
  const set=WRITER_V6_RATING_SETS[this.token.kind]||WRITER_V6_RATING_SETS.star;
  for(let i=1;i<=this.token.max;i++){
   const button=doc.createElement('button');button.type='button';
   button.className='writer-v6-rating-button';
   button.textContent=i<=this.token.value?set.full:set.empty;
   button.title=writerUi('Definir avaliação como ','Set rating to ')+i+'/'+this.token.max;
   button.setAttribute('aria-label',button.title);
   button.setAttribute('aria-pressed',String(i===this.token.value));
   button.addEventListener('mousedown',event=>event.preventDefault());
   button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const next={...this.token,value:i};
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
   if(cfg.discordSyntax.enabled&&cfg.discordSyntax.subtext&&writerModuleOn(plugin,'discordSyntax')&&/^-# /.test(source)&&!writerV6Overlaps(protectedRanges,line.from,line.to))
    ranges.push(Decoration.line({class:'writer-v6-subtext-line'}).range(line.from));
   if(cfg.ruby.enabled&&cfg.ruby.livePreview&&writerModuleOn(plugin,'ruby')){
    for(const token of writerV6RubyTokens(source)){
     const from=line.from+token.from,to=line.from+token.to;
     if(writerV6Overlaps(protectedRanges,from,to))continue;
     ranges.push(Decoration.mark({class:'writer-v6-ruby-source'}).range(from,to));
    }
   }
   if(cfg.ratings.enabled&&writerModuleOn(plugin,'ratings')){
    for(const t of writerV6RatingTokens(source)){
     const from=line.from+t.from,to=line.from+t.to;
     if(writerV6Overlaps(protectedRanges,from,to)||selection.from<=to&&selection.to>=from)continue;
     ranges.push(Decoration.replace({widget:new WriterV6RatingWidget(t,view,from,to)}).range(from,to));
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
   if(writerV6Allowed(p,'ruby'))writerV6RubyReading(root);
   if(writerV6Allowed(p,'discordSyntax'))writerV6SubtextReading(root);
   if(writerV6Allowed(p,'ratings'))writerV6RatingReading(root);
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
  p.addCommand({id:'v6-insert-rating',name:writerUi('Avaliação: inserir estrelas','Rating: insert stars'),editorCallback:editor=>editor.replaceSelection('[rating:3/5:star]')});
 }
 renderSettings(panel){
  const cfg=this.plugin.settings.v6;
  panel.createEl('h3',{text:writerUi('Ruby — pronúncia e anotações','Ruby — pronunciation and annotations')});
  new Setting(panel).setName(writerUi('Habilitar Ruby {base|leitura}','Enable Ruby {base|reading}')).addToggle(t=>t.setValue(cfg.ruby.enabled).onChange(async v=>{cfg.ruby.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  new Setting(panel).setName(writerUi('Ruby no Live Preview','Ruby in Live Preview')).addToggle(t=>t.setValue(cfg.ruby.livePreview).onChange(async v=>{cfg.ruby.livePreview=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  panel.createEl('h3',{text:writerUi('Discord Syntax','Discord Syntax')});
  new Setting(panel).setName(writerUi('Ativar subtexto -#','Enable -# subtext')).setDesc(writerUi('Mantém o mesmo parser de spoilers ||texto|| existente.','Keeps the existing ||text|| spoiler parser.')).addToggle(t=>t.setValue(cfg.discordSyntax.enabled).onChange(async v=>{cfg.discordSyntax.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  panel.createEl('h3',{text:writerUi('Avaliações interativas','Interactive ratings')});
  new Setting(panel).setName(writerUi('Habilitar [rating:3/5:star]','Enable [rating:3/5:star]')).addToggle(t=>t.setValue(cfg.ratings.enabled).onChange(async v=>{cfg.ratings.enabled=v;await this.plugin.saveSettings();writerV6Refresh(this.plugin);}));
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Formatos: star, heart, moon, circle e bar. Clique nas estrelas no editor para alterar valores.','Formats: star, heart, moon, circle and bar. Click rating symbols in the editor to change a value.')});
 }
}
