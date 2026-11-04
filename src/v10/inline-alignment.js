'use strict';
/* Basic inline alignment, compatible with Markdown headings and links.
 * Preferred suffix: Text {c}, # Heading {r}, ## Heading {l}.
 * Legacy ::c: Text, ::c[Text] remain supported; never reformat saved
 * notes automatically. Editor commands replace only the current line(s). */
function writerV102AlignMerge(settings){
 const raw=settings.v102Align&&typeof settings.v102Align==='object'?settings.v102Align:{};
 const cfg=settings.v102Align={enabled:true,livePreview:true,reading:true,hideDelimiters:true,...raw};
 for(const key of ['enabled','livePreview','reading','hideDelimiters'])cfg[key]=cfg[key]!==false;
 return cfg;
}
function writerV102AlignSide(alias){
 const side=String(alias||'').toLowerCase();
 return side==='l'||side==='left'?'left':side==='r'||side==='right'?'right':'center';
}
function writerV102AlignToken(raw){
 const source=String(raw||'');
 if(source.length>6000||!source.trim()||source.includes('\n'))return null;
 // Heading markers stay at the beginning, so Obsidian recognizes actual H1–H6.
 const heading=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(source);
 const offset=heading?heading[0].length:0;
 const text=source.slice(offset);
 const suffix=/[ \t]+\{(left|center|right|l|c|r)\}[ \t]*$/i.exec(text);
 if(suffix&&text.slice(0,suffix.index).trim()){
  const from=offset+suffix.index,to=offset+suffix.index+suffix[0].length;
  return {side:writerV102AlignSide(suffix[1]),format:'suffix',legacy:false,heading:!!heading,
   from,innerFrom:to,innerTo:to,to};
 }
 const modern=/^([ \t]*)::(left|center|right|l|c|r):[ \t]+([^\n]{1,5000}?)[ \t]*$/i.exec(text);
 const legacy=modern?null:/^([ \t]*)::(left|center|right|l|c|r)\[([^\n]{1,5000})\][ \t]*$/i.exec(text);
 const match=modern||legacy;
 if(!match)return null;
 const start=(modern
  ?/^([ \t]*)::(left|center|right|l|c|r):[ \t]+/i
  :/^([ \t]*)::(left|center|right|l|c|r)\[/i).exec(text)[0];
 const from=offset+match[1].length;
 const innerFrom=offset+start.length;
 const innerTo=innerFrom+match[3].trimEnd().length;
 return {side:writerV102AlignSide(match[2]),format:'prefix',legacy:!!legacy,heading:!!heading,
  from,innerFrom,innerTo,to:offset+match[0].trimEnd().length};
}
function writerV102AlignReading(root){
 if(!root?.querySelectorAll||typeof document==='undefined'||typeof NodeFilter==='undefined')return;
 const blocks=[...root.querySelectorAll('p,h1,h2,h3,h4,h5,h6')].slice(0,1500);
 for(let block of blocks){
  if(block.closest('pre,code,table,script,style,textarea,.cm-editor,.writer-v102-align-processed'))continue;
  const token=writerV102AlignToken(block.textContent||'');
  if(!token)continue;
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
  const texts=[];while(walker.nextNode()&&texts.length<250)texts.push(walker.currentNode);
  if(!texts.length||texts.length>=250)continue;
  const first=texts[0],last=texts[texts.length-1];
  if(token.format==='suffix'){
   // Only remove the author's dedicated suffix; preserve inline links/emphasis.
   if(!/[ \t]+\{(?:left|center|right|l|c|r)\}[ \t]*$/i.test(last.nodeValue||''))continue;
   last.nodeValue=last.nodeValue.replace(/[ \t]+\{(?:left|center|right|l|c|r)\}[ \t]*$/i,'');
  }else{
   const begin=token.legacy
    ?/^([ \t]*)::(left|center|right|l|c|r)\[/i
    :/^([ \t]*)::(left|center|right|l|c|r):[ \t]+/i;
   const open=begin.exec(first.nodeValue||'');
   if(!open||(token.legacy&&!/\][ \t]*$/.test(last.nodeValue||'')))continue;
   first.nodeValue=first.nodeValue.slice(open[0].length);
   if(token.legacy)last.nodeValue=last.nodeValue.replace(/\][ \t]*$/,'');
   // Preserve heading semantics for old lines such as ::c: # Title.
   const oldHeading=block.tagName?.toLowerCase()==='p'
    ?/^#{1,6}[ \t]+/.exec(first.nodeValue||''):null;
   if(oldHeading){
    const actual=block.ownerDocument.createElement('h'+oldHeading[0].match(/#/g).length);
    first.nodeValue=first.nodeValue.slice(oldHeading[0].length);
    while(block.firstChild)actual.appendChild(block.firstChild);
    block.replaceWith(actual);block=actual;
   }
  }
  block.classList.add('writer-v102-align-processed','writer-v102-align-'+token.side);
  // Honor an explicitly marked heading even when the user's CSS snippet
  // centers every h1–h6 with !important.
  block.style?.setProperty?.('text-align',token.side==='center'?'center':token.side==='left'?'left':'right','important');
 }
}
function writerV102AlignDecorations(view,cfg){
 if(!cfg.enabled||!cfg.livePreview||!view?.state?.doc)return Decoration.none;
 const doc=view.state.doc,selection=view.state.selection?.main||{from:-1,to:-1},ranges=[];
 let fenced=false,frontMatter=false;
 for(let n=1;n<=doc.lines;n++){
  const line=doc.line(n),source=line.text,trim=source.trim();
  if(n===1&&trim==='---'){frontMatter=true;continue;}
  if(frontMatter){if(trim==='---')frontMatter=false;continue;}
  if(/^\s{0,3}(?:\x60{3,}|~{3,})/.test(source)){fenced=!fenced;continue;}
  if(fenced||/^(?: {4}|\t)/.test(source))continue;
  if(view.visibleRanges?.length&&!view.visibleRanges.some(range=>line.to>=range.from&&line.from<=range.to))continue;
  const token=writerV102AlignToken(source);
  if(!token)continue;
  ranges.push(Decoration.line({class:'writer-v102-align-'+token.side}).range(line.from));
  if(!cfg.hideDelimiters||selection.from<=line.to&&selection.to>=line.from)continue;
  const start=line.from+token.from,inside=line.from+token.innerFrom,after=line.from+token.innerTo,end=line.from+token.to;
  if(inside>start)ranges.push(Decoration.replace({}).range(start,inside));
  if(end>after)ranges.push(Decoration.replace({}).range(after,end));
 }
 return ranges.length?Decoration.set(ranges.sort((a,b)=>a.from-b.from||a.to-b.to),true):Decoration.none;
}
function writerV102AlignNormalizeLine(source){
 let text=String(source||'');
 const heading=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(text);
 let lead=heading?heading[0]:'';
 if(lead)text=text.slice(lead.length);
 const token=writerV102AlignToken(source);
 if(token?.format==='suffix')text=text.slice(0,token.from-lead.length).trimEnd();
 else if(token?.format==='prefix'){
  const open=/^([ \t]*)::(left|center|right|l|c|r)(?::[ \t]+|\[)/i.exec(text);
  if(open)text=text.slice(open[0].length);
  if(token.legacy)text=text.replace(/\][ \t]*$/,'');
  text=text.trimEnd();
 }
 // Legacy prefix-before-heading becomes a real heading when a command is used.
 if(!lead){
  const inside=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(text);
  if(inside){lead=inside[0];text=text.slice(lead.length);}
 }
 return {lead,text,side:token?.side||null};
}
function writerV102AlignApply(editor,side){
 const from=editor.getCursor?.('from')||editor.getCursor?.()||{line:0};
 const to=editor.getCursor?.('to')||from;
 const end=Math.max(from.line,to.line-(to.line>from.line&&to.ch===0?1:0));
 const start=Math.min(from.line,end);
 let changed=false;
 for(let n=end;n>=start;n--){
  const before=String(editor.getLine?.(n)||'');
  if(/^\s*(?:\x60{3,}|~{3,})/.test(before))continue;
  const line=writerV102AlignNormalizeLine(before);
  if(!line.text.trim()&&!line.lead)continue;
  const label=line.text.trim()?'':writerUi('Título','Heading');
  const replacement=line.lead+(line.text||label)+(side?' {'+side[0]+'}':'');
  if(before===replacement)continue;
  editor.replaceRange(replacement,{line:n,ch:0},{line:n,ch:before.length});
  changed=true;
 }
 return changed;
}
function writerV102AlignRegister(plugin){
 plugin.registerMarkdownPostProcessor?.(root=>{
  if(plugin.settings.v102Align?.enabled&&plugin.settings.v102Align.reading)writerV102AlignReading(root);
 });
 if(typeof ViewPlugin!=='undefined'&&ViewPlugin?.fromClass){
  plugin.registerEditorExtension(ViewPlugin.fromClass(class{
   constructor(view){this.decorations=this.make(view);}
   make(view){return writerV102AlignDecorations(view,plugin.settings.v102Align);}
   update(update){if(update.docChanged||update.viewportChanged||update.selectionSet||update.focusChanged)
    this.decorations=this.make(update.view);
   }
  },{decorations:v=>v.decorations}));
 }
 for(const [side,id,pt,en] of [
  ['l','left','Alinhar à esquerda','Align left'],
  ['c','center','Centralizar texto ou título','Center text or heading'],
  ['r','right','Alinhar à direita','Align right']
 ]){
  plugin.addCommand({id:'v102-align-'+id,name:writerUi(pt,en),
   editorCheckCallback:(checking,editor)=>{
    if(!plugin.settings.v102Align?.enabled)return false;
    if(checking)return true;
    writerV102AlignApply(editor,side);return true;
   }});
 }
 plugin.addCommand({id:'v105-align-cycle',name:writerUi('Alternar alinhamento da linha ou título','Cycle line or heading alignment'),
  editorCheckCallback:(checking,editor)=>{
   if(!plugin.settings.v102Align?.enabled)return false;
   if(checking)return true;
   const cursor=editor.getCursor?.('from')||editor.getCursor?.()||{line:0};
   const side=writerV102AlignToken(editor.getLine?.(cursor.line)||'')?.side;
   const next=side==='center'?'r':side==='right'?'l':side==='left'?null:'c';
   writerV102AlignApply(editor,next);return true;
  }});
}
function writerV102AlignSettings(plugin,panel){
 const cfg=plugin.settings.v102Align;
 panel.createEl('h3',{text:writerUi('Alinhamento de texto e títulos','Text and heading alignment')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Use um comando na paleta ou na barra móvel (Centralizar, Direita, Esquerda ou Alternar). Para digitar: texto {c}, # Título {r}, ## Título {l}. Os formatos antigos ::c: texto e ::c[texto] continuam funcionando.',
  'Use a command from the palette or mobile toolbar (Center, Right, Left or Cycle). To type: text {c}, # Heading {r}, ## Heading {l}. Legacy ::c: text and ::c[text] stay supported.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar alinhamento de texto','Enable text alignment'],
  ['reading','Renderizar no modo de leitura','Render in Reading mode'],
  ['livePreview','Alinhar no Live Preview','Align in Live Preview'],
  ['hideDelimiters','Ocultar marcadores fora da linha em edição','Hide markers outside the edited line']
 ])new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
}
