'use strict';
/* Basic AI v5: original extended Markdown implementation. */
const WRITER_EXTENDED_DEFAULTS={enabled:true,underline:true,spoiler:true,superscript:true,subscript:true,coloredHighlight:true,customSpan:true,fencedDivs:true,livePreview:true};
function writerExtendedMerge(settings){
 const old=settings.extendedSyntax;
 settings.extendedSyntax={...WRITER_EXTENDED_DEFAULTS,...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})};
 for(const key in WRITER_EXTENDED_DEFAULTS)settings.extendedSyntax[key]=settings.extendedSyntax[key]!==false;
 return settings.extendedSyntax;
}
function writerExtendedTokens(source,config=WRITER_EXTENDED_DEFAULTS){
 const rules=[
  ['underline','underline',/\+\+([^\s+](?:[^\n]*?[^\s+])?)\+\+/g],
  ['spoiler','spoiler',/\|\|([^\s|](?:[^\n]*?[^\s|])?)\|\|/g],
  ['superscript','superscript',/\^([^\s^]+)\^/g],
  ['subscript','subscript',/~([^\s~]+)~/g],
  ['coloredHighlight','highlight',/==\{([a-zA-Z0-9_-]{1,30})\}([^\s=](?:[^\n]*?[^\s=])?)==/g],
  ['customSpan','span',/!!\{([a-zA-Z0-9_ -]{1,60})\}([^\s!](?:[^\n]*?[^\s!])?)!!/g]
 ],result=[],matches=[];
 const ignored=[];
 for(const match of source.matchAll(/\x60+[^\x60\n]*\x60+|\\./g))ignored.push([match.index,match.index+match[0].length]);
 for(const [feature,kind,re] of rules){
  if(config[feature]===false)continue;
  for(const m of source.matchAll(re)){
   const from=m.index,to=from+m[0].length;
   if(to-from>3072)continue;
   const opening=kind==='highlight'?'=={'+m[1]+'}':kind==='span'?'!!{'+m[1]+'}':({underline:'++',spoiler:'||',superscript:'^',subscript:'~'})[kind];
   const closing=kind==='highlight'?'==':kind==='span'?'!!':opening;
   if(from>0&&(source[from-1]==='\\'||source[from-1]===opening[0]))continue;
   if(source[to]===closing[0]||ignored.some(([a,b])=>from<b&&to>a))continue;
   const value=kind==='highlight'||kind==='span'?m[2]:m[1];
   if(!value||!value.trim())continue;
   matches.push({from,to,innerFrom:from+opening.length,innerTo:to-closing.length,kind,value,tag:kind==='highlight'||kind==='span'?m[1]:''});
  }
 }
 matches.sort((a,b)=>a.from-b.from||b.to-a.to);
 let end=0;for(const match of matches)if(match.from>=end){result.push(match);end=match.to;}
 return result;
}
function writerExtendedColor(tag){
 return ({red:'var(--color-red)',orange:'var(--color-orange)',yellow:'var(--color-yellow)',green:'var(--color-green)',blue:'var(--color-blue)',purple:'var(--color-purple)',pink:'var(--color-pink)',accent:'var(--interactive-accent)'})[String(tag).toLowerCase()]||null;
}
function writerExtendedElement(token){
 const tag=token.kind==='superscript'?'sup':token.kind==='subscript'?'sub':token.kind==='underline'?'ins':token.kind==='highlight'?'mark':'span';
 const node=document.createElement(tag);node.classList.add('writer-v5-ext','writer-v5-'+token.kind);node.textContent=token.value;
 if(token.kind==='highlight'){
  const color=writerExtendedColor(token.tag);
  if(color)node.style.setProperty('--writer-v5-highlight-color',color);
 }
 if(token.kind==='span'){
  for(const cls of token.tag.trim().split(/\s+/))if(/^[a-zA-Z][a-zA-Z0-9_-]{0,40}$/.test(cls))node.classList.add('writer-v5-class-'+cls);
 }
 if(token.kind==='spoiler'){
  node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label',writerUi('Revelar spoiler','Reveal spoiler'));node.setAttribute('aria-pressed','false');
  const toggle=()=>{node.setAttribute('aria-pressed',String(node.classList.toggle('is-revealed')));};
  node.addEventListener('click',toggle);
  node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
 }
 return node;
}
function writerExtendedReading(root,cfg){
 if(!root||typeof document==='undefined'||typeof document.createTreeWalker!=='function')return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode,p=n.parentElement;
  if(!p||p.closest('pre,code,kbd,samp,script,style,textarea,a,math,svg,.cm-editor,.writer-v5-ext'))continue;
  if(/[+|^~!=]/.test(n.nodeValue||''))nodes.push(n);
 }
 for(const node of nodes){
  const source=node.nodeValue||'',tokens=writerExtendedTokens(source,cfg);
  if(!tokens.length||!node.parentNode)continue;
  const fragment=document.createDocumentFragment();let offset=0;
  for(const token of tokens){
   fragment.append(document.createTextNode(source.slice(offset,token.from)));
   fragment.append(writerExtendedElement(token));offset=token.to;
  }
  fragment.append(document.createTextNode(source.slice(offset)));
  node.parentNode.replaceChild(fragment,node);
 }
}
function writerExtendedFencedDivs(root,cfg){
 if(!cfg.fencedDivs||!root?.querySelectorAll||typeof document==='undefined')return;
 for(const el of root.querySelectorAll('p')){
  if(!el.isConnected||!el.parentElement||el.children.length)continue;
  const m=/^:{3,}\s+([a-zA-Z][\w .-]{0,90})$/.exec(el.textContent.trim());
  if(!m)continue;
  let cursor=el.nextElementSibling;const entries=[];let close=null;
  while(cursor&&entries.length<120){
   if(cursor.tagName==='P'&&/^:{3,}\s*$/.test(cursor.textContent.trim())){close=cursor;break;}
   if(cursor.tagName==='HR')break;
   entries.push(cursor);cursor=cursor.nextElementSibling;
  }
  if(!close||!entries.length)continue;
  const section=document.createElement('section');section.className='writer-v5-fenced-div';
  for(const name of m[1].trim().split(/\s+/))if(/^[a-zA-Z][\w-]{0,40}$/.test(name))section.classList.add('writer-v5-class-'+name);
  el.parentElement.insertBefore(section,el);
  for(const entry of entries)section.appendChild(entry);
  el.remove();close.remove();
 }
}
function writerExtendedLiveDecorations(view,cfg){
 if(!cfg.livePreview||!view?.state?.doc)return Decoration.none;
 const doc=view.state.doc,selection=view.state.selection.main,ranges=[];
 let fenced=false,frontMatter=false;
 for(let n=1;n<=doc.lines;n++){
  const line=doc.line(n),raw=line.text,trim=raw.trim();
  if(n===1&&trim==='---'){frontMatter=true;continue;}
  if(frontMatter){if(trim==='---')frontMatter=false;continue;}
  if(/^\s{0,3}(?:\x60{3,}|~{3,})/.test(raw)){fenced=!fenced;continue;}
  if(fenced||/^(?: {4}|\t)/.test(raw))continue;
  if(view.visibleRanges?.length&&!view.visibleRanges.some(range=>line.to>=range.from&&line.from<=range.to))continue;
  for(const token of writerExtendedTokens(raw,cfg)){
   const from=line.from+token.from,to=line.from+token.to;
   const attrs={};
   if(token.kind==='highlight'&&writerExtendedColor(token.tag))attrs.style='--writer-v5-highlight-color:'+writerExtendedColor(token.tag);
   ranges.push(Decoration.mark({class:'writer-v5-ext writer-v5-'+token.kind,attributes:attrs}).range(line.from+token.innerFrom,line.from+token.innerTo));
   if(selection.from<=to&&selection.to>=from)continue;
   ranges.push(Decoration.replace({}).range(from,line.from+token.innerFrom));
   ranges.push(Decoration.replace({}).range(line.from+token.innerTo,to));
  }
 }
 return ranges.length?Decoration.set(ranges.sort((a,b)=>a.from-b.from||a.to-b.to),true):Decoration.none;
}
class WriterExtendedSyntax{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.extendedSyntax;}
 active(){return writerModuleOn(this.plugin,'extendedSyntax')&&this.cfg.enabled;}
 register(){
  this.plugin.registerMarkdownPostProcessor(el=>{
   if(this.active()){writerExtendedReading(el,this.cfg);writerExtendedFencedDivs(el,this.cfg);}
  });
  if(ViewPlugin?.fromClass){
   const controller=this;
   this.plugin.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){this.decorations=this.make(view);}
    make(view){return controller.active()?writerExtendedLiveDecorations(view,controller.cfg):Decoration.none;}
    update(update){if(update.docChanged||update.viewportChanged||update.selectionSet||update.focusChanged)this.decorations=this.make(update.view);}
   },{decorations:v=>v.decorations}));
  }
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Extended Syntax · Markdown','Extended Syntax · Markdown')});
  panel.createEl('p',{text:writerUi('Renderização adicional; não reinstala a antiga toolbar nem comandos de formatação.','Extra syntax without reinstating the retired toolbar or formatting commands.'),cls:'dictionary-muted'});
  for(const [key,pt,en] of [
   ['enabled','Habilitar sintaxe estendida','Enable extended syntax'],
   ['underline','Sublinhado ++texto++','Underline ++text++'],
   ['spoiler','Spoiler ||texto||','Spoiler ||text||'],
   ['superscript','Sobrescrito ^texto^','Superscript ^text^'],
   ['subscript','Subscrito ~texto~','Subscript ~text~'],
   ['coloredHighlight','Destaque =={cor}texto==','Colored highlight =={color}text=='],
   ['customSpan','Span !!{classe}texto!!','Custom span !!{class}text!!'],
   ['fencedDivs','Blocos ::: classe (fechamento :::)','Fenced div ::: class (closing :::)'],
   ['livePreview','Estilizar no Live Preview','Style in Live Preview']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(this.cfg[key]).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();}));
 }
}
