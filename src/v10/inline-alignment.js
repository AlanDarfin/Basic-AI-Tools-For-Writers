'use strict';
/* Safe, line-anchored inline alignment. Markdown remains plain editable text.
 * Preferred syntax: ::l: text, ::c: text, ::r: text (long aliases allowed).\n * Legacy bracket syntax is retained for existing notes.
 * Never interprets /links/, |tables|, or backslashes as formatting. */
function writerV102AlignMerge(settings){
 const raw=settings.v102Align&&typeof settings.v102Align==='object'?settings.v102Align:{};
 const cfg=settings.v102Align={enabled:true,livePreview:true,reading:true,hideDelimiters:true,...raw};
 for(const key of ['enabled','livePreview','reading','hideDelimiters'])cfg[key]=cfg[key]!==false;
 return cfg;
}
function writerV102AlignToken(raw){
 const text=String(raw||'');
 // Colon delimiters avoid Obsidian's inline link parsers altogether.
 const modern=/^([ \t]*)::(left|center|right|l|c|r):[ \t]+([^\n]{1,5000}?)[ \t]*$/i.exec(text);
 const legacy=modern?null:/^([ \t]*)::(left|center|right|l|c|r)\[([^\n]{1,5000})\][ \t]*$/i.exec(text);
 const match=modern||legacy;
 if(!match)return null;
 const word=match[2].toLowerCase();
 const side=word==='left'||word==='l'?'left':word==='right'||word==='r'?'right':'center';
 const prefix=modern?/^([ \t]*)::(left|center|right|l|c|r):[ \t]+/i.exec(text)[0].length:
   match[1].length+2+match[2].length+1;
 const suffix=legacy?1:0;
 const inner=match[3].trimEnd();
 return {side,from:match[1].length,to:text.trimEnd().length,innerFrom:prefix,
  innerTo:prefix+inner.length,legacy:!!legacy};
}
function writerV102AlignReading(root){
 if(!root?.querySelectorAll||typeof document==='undefined'||typeof NodeFilter==='undefined')return;
 const nodes=[...root.querySelectorAll('p')].slice(0,1500);
 for(const p of nodes){
  if(p.closest('pre,code,table,script,style,textarea,.cm-editor,.writer-v102-align-processed'))continue;
  const token=writerV102AlignToken(p.textContent||'');
  if(!token)continue;
  const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
  const texts=[];while(walker.nextNode()&&texts.length<250)texts.push(walker.currentNode);
  if(!texts.length||texts.length>=250)continue;
  const first=texts[0],last=texts[texts.length-1];
  const begin=token.legacy?/^(\s*)::(left|center|right|l|c|r)\[/i:
   /^(\s*)::(left|center|right|l|c|r):[ \t]+/i;
  const open=begin.exec(first.nodeValue||'');
  if(!open||(token.legacy&&!/\]\s*$/.test(last.nodeValue||'')))continue;
  if(first===last){
   const original=first.nodeValue;
   first.nodeValue=original.slice(open[0].length);
   if(token.legacy)first.nodeValue=first.nodeValue.replace(/\]\s*$/,'');
  }else{
   first.nodeValue=first.nodeValue.slice(open[0].length);
   if(token.legacy)last.nodeValue=last.nodeValue.replace(/\]\s*$/,'');
  }
  p.classList.add('writer-v102-align-processed','writer-v102-align-'+token.side);
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
  if(/^\s{0,3}(?:`{3,}|~{3,})/.test(source)){fenced=!fenced;continue;}
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
function writerV102AlignRegister(plugin){
 plugin.registerMarkdownPostProcessor?.((root,ctx)=>{
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
  ['l','left','Alinhar texto à esquerda','Align text left'],
  ['c','center','Centralizar texto','Center text'],
  ['r','right','Alinhar texto à direita','Align text right']
 ]){
  plugin.addCommand({id:'v102-align-'+id,name:writerUi(pt,en),
   editorCheckCallback:(checking,editor)=>{
    if(!plugin.settings.v102Align?.enabled)return false;
    if(checking)return true;
    const selected=String(editor.getSelection?.()||'');
    if(selected.includes('\n')||selected.includes('\r')){
     new Notice(writerUi('Selecione somente uma linha.','Select only one line.'));return true;
    }
    editor.replaceSelection('::'+side+': '+(selected||writerUi('texto','text')));
    return true;
   }});
 }
}
function writerV102AlignSettings(plugin,panel){
 const cfg=plugin.settings.v102Align;
 panel.createEl('h3',{text:writerUi('Alinhamento curto de texto','Short text alignment')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Em uma linha própria: ::l: texto (esquerda), ::c: texto (centro), ::r: texto (direita). O formato antigo com colchetes continua aceito, mas o novo evita conflitos com links.',
  'On its own line: ::l: text (left), ::c: text (center), ::r: text (right). Legacy bracket markup is still supported, but colon notation avoids link conflicts.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar alinhamento de texto','Enable text alignment'],
  ['reading','Renderizar no modo de leitura','Render in Reading mode'],
  ['livePreview','Alinhar no Live Preview','Align in Live Preview'],
  ['hideDelimiters','Ocultar marcadores fora da linha em edição','Hide markers outside the edited line']
 ])new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(cfg[key]===true).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();}));
}
