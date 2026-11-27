'use strict';
/* Basic inline alignment, compatible with Markdown headings and links.
 * Preferred suffix: Text {c}, # Heading {r}, ## Heading {l}, Text {j}.
 * Legacy ::c: Text, ::c[Text] remain supported; never reformat saved
 * notes automatically. Editor commands replace only the current line(s). */
function writerV102AlignMerge(settings){
 const raw=settings.v102Align&&typeof settings.v102Align==='object'?settings.v102Align:{};
 const cfg=settings.v102Align={enabled:true,livePreview:true,reading:true,hideDelimiters:true,proseLayout:true,...raw};
 for(const key of ['enabled','livePreview','reading','hideDelimiters','proseLayout'])cfg[key]=cfg[key]!==false;
 return cfg;
}
function writerV102AlignSide(alias){
 const side=String(alias||'').toLowerCase();
 return side==='l'||side==='left'?'left':side==='r'||side==='right'?'right':
  side==='j'||side==='justify'?'justify':'center';
}
/* Paragraph-only suffixes are metadata, not visible prose. Suffixes may be
 * combined in either order, e.g. {j} {dropcap} or {capitular} {r}. */
function writerV102ParagraphSuffix(source){
 const raw=String(source||'');
 if(!raw||raw.length>6000||/[\r\n]/.test(raw))return null;
 let remaining=raw,attributes=[];
 while(attributes.length<8){
  const match=/[ \t]+\{(dropcap|capitular|left|center|right|justify|l|c|r|j)\}[ \t]*$/i.exec(remaining);
  if(!match)break;
  attributes.unshift({key:match[1].toLowerCase(),from:match.index,to:remaining.length});
  remaining=remaining.slice(0,match.index);
 }
 if(!attributes.length||!remaining.trim())return null;
 const align=attributes.filter(attr=>!['dropcap','capitular'].includes(attr.key));
 if(align.length>1||attributes.filter(attr=>['dropcap','capitular'].includes(attr.key)).length>1)return null;
 const dropcap=attributes.find(attr=>attr.key==='dropcap'||attr.key==='capitular');
 const heading=/^[ \t]{0,3}#{1,6}[ \t]+/.test(remaining);
 if(heading&&dropcap)return null; // Capitals belong to prose, never headings.
 return {from:remaining.length,to:raw.length,base:remaining,attributes,
  side:align.length?writerV102AlignSide(align[0].key):null,
  dropcap:!!dropcap,dropcapKey:dropcap?.key||null};
}
function writerV102InitialRange(source,token){
 if(!token?.dropcap||token.heading)return null;
 const beginning=token.format==='prefix'?token.innerFrom:0;
 const ending=token.suffixFrom??token.from;
 const prose=source.slice(beginning,ending);
 if(/^\s*(?:!\[|[-*+]\s|\d+[.)]\s|>\s|\x60)/.test(prose))return null;
 const letter=/\p{L}/u.exec(prose);
 if(!letter)return null;
 const from=beginning+letter.index;
 return {from,to:from+letter[0].length};
}
function writerV102AlignToken(raw){
 const source=String(raw||'');
 if(source.length>6000||!source.trim()||source.includes('\n'))return null;
 const trailing=writerV102ParagraphSuffix(source);
 const base=trailing?.base??source;
 const heading=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(base);
 const offset=heading?heading[0].length:0;
 const text=base.slice(offset);
 if(trailing?.side||trailing?.dropcap){
  // A suffix may coexist with an old prefix-alignment marker; preserve it.
  const old=/^([ \t]*)::(left|center|right|justify|l|c|r|j)(?::[ \t]+|\[)/i.exec(text);
  if(!old||trailing.side){
   return {side:trailing.side,dropcap:trailing.dropcap,dropcapKey:trailing.dropcapKey,
    format:'suffix',legacy:false,heading:!!heading,
    from:trailing.from,innerFrom:trailing.to,innerTo:trailing.to,to:trailing.to,
    suffixFrom:trailing.from,suffixTo:trailing.to};
  }
 }
 const modern=/^([ \t]*)::(left|center|right|justify|l|c|r|j):[ \t]+([^\n]{1,5000}?)[ \t]*$/i.exec(text);
 const legacy=modern?null:/^([ \t]*)::(left|center|right|justify|l|c|r|j)\[([^\n]{1,5000})\][ \t]*$/i.exec(text);
 const match=modern||legacy;
 if(!match)return null;
 const start=(modern
  ?/^([ \t]*)::(left|center|right|justify|l|c|r|j):[ \t]+/i
  :/^([ \t]*)::(left|center|right|justify|l|c|r|j)\[/i).exec(text)[0];
 const from=offset+match[1].length;
 const innerFrom=offset+start.length;
 const innerTo=innerFrom+match[3].trimEnd().length;
 return {side:writerV102AlignSide(match[2]),dropcap:!!trailing?.dropcap,
  dropcapKey:trailing?.dropcapKey||null,format:'prefix',legacy:!!legacy,heading:!!heading,
  from,innerFrom,innerTo,to:offset+match[0].trimEnd().length,
  suffixFrom:trailing?.from??null,suffixTo:trailing?.to??null};
}
function writerV102AlignReading(root){
 if(!root?.querySelectorAll||typeof document==='undefined'||typeof NodeFilter==='undefined')return;
 const blocks=[...root.querySelectorAll('p,h1,h2,h3,h4,h5,h6')].slice(0,1500);
 for(let block of blocks){
  if(block.closest('pre,code,table,script,style,textarea,.cm-editor,.writer-v102-align-processed,.writer-v8-chat,.writer-v8-home,.writer-v102-spaces-manager'))continue;
  const token=writerV102AlignToken(block.textContent||'');
  if(!token)continue;
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
  const texts=[];while(walker.nextNode()&&texts.length<250)texts.push(walker.currentNode);
  if(!texts.length||texts.length>=250)continue;
  const first=texts[0],last=texts[texts.length-1];
  if(first.parentElement?.closest?.('code,pre')||last.parentElement?.closest?.('code,pre'))continue;
  if(token.format==='suffix'){
   // Only author-owned terminal attributes, not Markdown links or emphasis.
   if(!/[ \t]+\{(?:left|center|right|justify|l|c|r|j|dropcap|capitular)\}[ \t]*$/i.test(last.nodeValue||''))continue;
   last.nodeValue=last.nodeValue.replace(/(?:[ \t]+\{(?:left|center|right|justify|l|c|r|j|dropcap|capitular)\})+[ \t]*$/i,'');
  }else{
   const begin=token.legacy
    ?/^([ \t]*)::(left|center|right|justify|l|c|r|j)\[/i
    :/^([ \t]*)::(left|center|right|justify|l|c|r|j):[ \t]+/i;
   const open=begin.exec(first.nodeValue||'');
   if(!open||(token.legacy&&!/\][ \t]*$/.test(last.nodeValue||'')))continue;
   first.nodeValue=first.nodeValue.slice(open[0].length);
   if(token.legacy)last.nodeValue=last.nodeValue.replace(/\][ \t]*$/,'');
   if(token.suffixFrom!==null)
    last.nodeValue=last.nodeValue.replace(/(?:[ \t]+\{(?:left|center|right|justify|l|c|r|j|dropcap|capitular)\})+[ \t]*$/i,'');
   const oldHeading=block.tagName?.toLowerCase()==='p'
    ?/^#{1,6}[ \t]+/.exec(first.nodeValue||''):null;
   if(oldHeading){
    const actual=block.ownerDocument.createElement('h'+oldHeading[0].match(/#/g).length);
    first.nodeValue=first.nodeValue.slice(oldHeading[0].length);
    while(block.firstChild)actual.appendChild(block.firstChild);
    block.replaceWith(actual);block=actual;
   }
  }
  block.classList.add('writer-v102-align-processed');
  if(token.side){
   block.classList.add('writer-v102-align-'+token.side);
   block.style?.setProperty?.('text-align',token.side,'important');
  }
  if(token.dropcap&&block.tagName?.toLowerCase()==='p')
   block.classList.add('writer-v102-dropcap');
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
  if(fenced||/^(?: {4}|\t)/.test(source)||/^\s*(?:[-*+]\s|\d+[.)]\s|>|\|)/.test(source))continue;
  if(view.visibleRanges?.length&&!view.visibleRanges.some(range=>line.to>=range.from&&line.from<=range.to))continue;
  const token=writerV102AlignToken(source);
  if(!token)continue;
  const classes=[token.side?'writer-v102-align-'+token.side:'',token.dropcap?'writer-v102-dropcap':''].filter(Boolean);
  if(classes.length)ranges.push(Decoration.line({class:classes.join(' ')}).range(line.from));
  const initial=writerV102InitialRange(source,token);
  if(initial)ranges.push(Decoration.mark({class:'writer-v102-dropcap-initial'}).range(line.from+initial.from,line.from+initial.to));
  if(!cfg.hideDelimiters||selection.from<=line.to&&selection.to>=line.from)continue;
  const start=line.from+token.from,inside=line.from+token.innerFrom,after=line.from+token.innerTo,end=line.from+token.to;
  if(inside>start)ranges.push(Decoration.replace({}).range(start,inside));
  if(end>after)ranges.push(Decoration.replace({}).range(after,end));
  if(token.format==='prefix'&&token.suffixFrom!==null&&token.suffixTo>token.suffixFrom)
   ranges.push(Decoration.replace({}).range(line.from+token.suffixFrom,line.from+token.suffixTo));
 }
 return ranges.length?Decoration.set(ranges.sort((a,b)=>a.from-b.from||a.to-b.to),true):Decoration.none;
}
function writerV102AlignNormalizeLine(source){
 const trailing=writerV102ParagraphSuffix(source);
 let text=trailing?String(source).slice(0,trailing.from):String(source||'');
 const heading=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(text);
 let lead=heading?heading[0]:'';
 if(lead)text=text.slice(lead.length);
 const token=writerV102AlignToken(source);
 if(token?.format==='prefix'){
  const open=/^([ \t]*)::(left|center|right|justify|l|c|r|j)(?::[ \t]+|\[)/i.exec(text);
  if(open)text=text.slice(open[0].length);
  if(token.legacy)text=text.replace(/\][ \t]*$/,'');
 }
 text=text.trimEnd();
 if(!lead){
  const inside=/^([ \t]{0,3}#{1,6}[ \t]+)/.exec(text);
  if(inside){lead=inside[0];text=text.slice(lead.length);}
 }
 return {lead,text,side:token?.side||null,dropcapKey:trailing?.dropcapKey||null};
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
  const replacement=line.lead+(line.text||label)+(side?' {'+side[0]+'}':'')+(line.dropcapKey?' {'+line.dropcapKey+'}':'');
  if(before===replacement)continue;
  editor.replaceRange(replacement,{line:n,ch:0},{line:n,ch:before.length});
  changed=true;
 }
 return changed;
}
function writerV102ToggleDropcap(editor){
 const from=editor.getCursor?.('from')||editor.getCursor?.()||{line:0};
 const to=editor.getCursor?.('to')||from;
 const end=Math.max(from.line,to.line-(to.line>from.line&&to.ch===0?1:0));
 const start=Math.min(from.line,end);
 let changed=false;
 for(let n=end;n>=start;n--){
  const before=String(editor.getLine?.(n)||'');
  if(!before.trim()||/^\s*(?:\x60{3,}|~{3,}|#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|\|)/.test(before))continue;
  const trailing=writerV102ParagraphSuffix(before);
  const attributes=trailing?.attributes||[];
  const kept=attributes.filter(attr=>!['dropcap','capitular'].includes(attr.key));
  const base=trailing?trailing.base:before.trimEnd();
  const suffix=kept.map(attr=>' {'+attr.key+'}').join('');
  const replacement=base+suffix+(trailing?.dropcap?'':' {dropcap}');
  if(replacement===before)continue;
  editor.replaceRange(replacement,{line:n,ch:0},{line:n,ch:before.length});
  changed=true;
 }
 return changed;
}
function writerV102SyncProseLayout(plugin){
 const doc=plugin.app?.workspace?.containerEl?.ownerDocument||(typeof document!=='undefined'?document:null);
 doc?.body?.classList?.toggle('writer-v102-prose-layout',plugin.settings?.v102Align?.proseLayout!==false);
}
function writerV102AlignRegister(plugin){
 writerV102SyncProseLayout(plugin);
 plugin.register?.(()=>{
  const doc=plugin.app?.workspace?.containerEl?.ownerDocument||(typeof document!=='undefined'?document:null);
  doc?.body?.classList?.remove('writer-v102-prose-layout');
 });
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
  ['r','right','Alinhar à direita','Align right'],
  ['j','justify','Justificar texto','Justify text']
 ]){
  plugin.addCommand({id:'v102-align-'+id,name:writerUi(pt,en),
   editorCheckCallback:(checking,editor)=>{
    if(!plugin.settings.v102Align?.enabled)return false;
    if(checking)return true;
    writerV102AlignApply(editor,side);return true;
   }});
 }
 plugin.addCommand({id:'v102-toggle-dropcap',
  name:writerUi('Capitular: alternar primeira letra ampliada','Drop cap: toggle enlarged first letter'),
  editorCheckCallback:(checking,editor)=>{
   if(plugin.settings.v102Align?.enabled===false)return false;
   if(checking)return true;
   writerV102ToggleDropcap(editor);return true;
  }});
 plugin.addCommand({id:'v105-align-cycle',name:writerUi('Alternar alinhamento da linha ou título','Cycle line or heading alignment'),
  editorCheckCallback:(checking,editor)=>{
   if(!plugin.settings.v102Align?.enabled)return false;
   if(checking)return true;
   const cursor=editor.getCursor?.('from')||editor.getCursor?.()||{line:0};
   const side=writerV102AlignToken(editor.getLine?.(cursor.line)||'')?.side;
   const next=side==='center'?'r':side==='right'?'l':side==='left'?'j':side==='justify'?null:'c';
   writerV102AlignApply(editor,next);return true;
  }});
}
function writerV102AlignSettings(plugin,panel){
 const cfg=plugin.settings.v102Align;
 panel.createEl('h3',{text:writerUi('Alinhamento de texto e títulos','Text and heading alignment')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Use alinhamentos {l}, {c}, {r}, {j} e a capitular {dropcap} (ou {capitular}) ao fim de parágrafos. Exemplo: Era uma vez... {j} {dropcap}. Use a paleta de comandos para alternar a capitular. Os formatos antigos ::c: texto e ::c[texto] continuam funcionando.',
  'Append {l}, {c}, {r} or {j} to align text. Use {dropcap} (or {capitular}) to enlarge a paragraph’s first letter; e.g. Once upon a time... {j} {dropcap}. A palette command toggles it. Legacy ::c: text and ::c[text] remain supported.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar alinhamento de texto','Enable text alignment'],
  ['reading','Renderizar no modo de leitura','Render in Reading mode'],
  ['livePreview','Alinhar no Live Preview','Align in Live Preview'],
  ['hideDelimiters','Ocultar marcadores fora da linha em edição','Hide markers outside the edited line']
 ])new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Justificar e hifenizar parágrafos','Justify and hyphenate paragraphs'))
  .setDesc(writerUi('Ativado por padrão na leitura: recuo de 5%, texto justificado e hifenização automática. Não altera listas, cartões ou os alinhamentos explícitos {l}, {c}, {r} e {j}.',
   'On by default in Reading view: 5% first-line indent, justified text and automatic hyphenation. Does not change lists, cards or explicit {l}, {c}, {r} and {j} alignment.'))
  .addToggle(t=>t.setValue(cfg.proseLayout!==false).onChange(async value=>{
   cfg.proseLayout=value;
   writerV102SyncProseLayout(plugin);
   await plugin.saveSettings();
  }));
}
