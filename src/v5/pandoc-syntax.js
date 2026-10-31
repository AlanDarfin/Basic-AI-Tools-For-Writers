'use strict';
/* Basic AI v5: lightweight Pandoc-compatible syntax, preserving Markdown source. */
const WRITER_PANDOC_DEFAULTS={enabled:true,fancyLists:true,definitionLists:true,exampleLists:true,customLabels:true,fencedDivs:true,superSub:true,outline:true};
function writerPandocMerge(settings){
 const old=settings.pandocSyntax;
 settings.pandocSyntax={...WRITER_PANDOC_DEFAULTS,...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})};
 for(const key in WRITER_PANDOC_DEFAULTS)settings.pandocSyntax[key]=settings.pandocSyntax[key]!==false;
 return settings.pandocSyntax;
}
function writerPandocRoman(number){
 let value=Number(number)||0,answer='';
 for(const [unit,letter] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])
  while(value>=unit){answer+=letter;value-=unit;}
 return answer;
}
function writerPandocNumber(letters){
 if(!letters)return 1;
 if(/^\d+$/.test(letters))return Number(letters);
 if(/^[ivxlcdm]+$/i.test(letters)){
  const symbols={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let sum=0,last=0;
  for(const ch of letters.toUpperCase().split('').reverse()){
   const n=symbols[ch];sum+=n<last?-n:n;last=n;
  }
  if(sum>0&&sum<4000&&writerPandocRoman(sum).toLowerCase()===letters.toLowerCase())return sum;
 }
 if(/^[a-z]$/i.test(letters))return letters.toLowerCase().charCodeAt(0)-96;
 return 1;
}
function writerPandocListItem(text){
 const m=/^\s{0,3}([A-Za-z]{1,7}|#|\d{1,5})([.)])\s+(.+)$/.exec(text);
 if(!m)return null;
 const marker=m[1];
 let type='1';
 if(marker==='#')type='1';
 else if(/^[ivxlcdm]+$/.test(marker))type='i';
 else if(/^[IVXLCDM]+$/.test(marker))type='I';
 else if(/^[a-z]$/.test(marker))type='a';
 else if(/^[A-Z]$/.test(marker))type='A';
 else if(!/^\d+$/.test(marker))return null;
 return {type,start:writerPandocNumber(marker),prefix:m[0].length-m[3].length,content:m[3],marker};
}
function writerPandocOutline(text){
 const entries=[],lines=String(text).split(/\r?\n/);let fenced=false;
 for(let line=0;line<lines.length;line++){
  const s=lines[line].trim();
  if(/^(?:\x60{3,}|~{3,})/.test(s)){fenced=!fenced;continue;}
  if(fenced)continue;
  const fancy=writerPandocListItem(lines[line]);
  const example=/^\(@([-\w]+)\)\s+(.+)/.exec(s);
  const custom=/^\{::([^}]+)\}\s*(.*)/.exec(s);
  const div=/^:{3,}\s+\{?\.[\w-]+/.exec(s);
  const definition=line>0&&/^:\s+\S/.test(s);
  if(example)entries.push({line,title:'(@'+example[1]+') '+example[2],kind:'example'});
  else if(custom)entries.push({line,title:custom[1]+': '+custom[2],kind:'label'});
  else if(div)entries.push({line,title:s,kind:'div'});
  else if(definition)entries.push({line,title:lines[line-1].trim()+': '+s.replace(/^:\s*/,''),kind:'definition'});
  else if(fancy)entries.push({line,title:lines[line].trim(),kind:'list'});
 }
 return entries;
}
function writerPandocRemovePrefix(p,chars){
 let remaining=chars;
 const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
 while(remaining>0&&walker.nextNode()){
  const node=walker.currentNode,n=node.nodeValue||'',cut=Math.min(remaining,n.length);
  node.nodeValue=n.slice(cut);remaining-=cut;
 }
}
function writerPandocReading(root,cfg){
 if(!root?.querySelectorAll||typeof document==='undefined')return;
 if(cfg.superSub&&!root.querySelector('.cm-editor')){
  writerExtendedReading(root,{underline:false,spoiler:false,superscript:true,subscript:true,coloredHighlight:false,customSpan:false});
 }
 const paragraphs=Array.from(root.querySelectorAll('p'));
 const examples=new Map();let exampleIndex=0;
 if(cfg.exampleLists){
  for(const p of paragraphs){
   if(!p.isConnected||p.closest('pre,blockquote,li,code'))continue;
   const m=/^\(@([-\w]{1,80})\)\s+(.+)/.exec(p.textContent||'');
   if(!m)continue;
   if(!examples.has(m[1]))examples.set(m[1],++exampleIndex);
   const badge=document.createElement('span');badge.className='writer-v5-pandoc-marker';badge.textContent='('+examples.get(m[1])+') ';
   writerPandocRemovePrefix(p,m[0].length-m[2].length);
   p.prepend(badge);p.classList.add('writer-v5-pandoc-example');
  }
 }
 if(cfg.customLabels){
  for(const p of paragraphs){
   if(!p.isConnected||p.closest('pre,blockquote,li,code'))continue;
   const m=/^\{::([^}]{1,60})\}\s*/.exec(p.textContent||'');
   if(!m)continue;
   writerPandocRemovePrefix(p,m[0].length);
   const badge=document.createElement('span');badge.className='writer-v5-pandoc-marker';badge.textContent='('+m[1]+') ';
   p.prepend(badge);p.classList.add('writer-v5-pandoc-labeled');
  }
 }
 if(cfg.definitionLists){
  for(const p of paragraphs){
   if(!p.isConnected||p.closest('li,blockquote,pre,code')||p.children.length)continue;
   const next=p.nextElementSibling;
   if(!next||next.tagName!=='P'||next.children.length)continue;
   const m=/^:\s+([\s\S]+)/.exec(next.textContent||'');
   if(!m||!p.textContent?.trim())continue;
   const dl=document.createElement('dl');dl.className='writer-v5-pandoc-definition';
   const dt=document.createElement('dt'),dd=document.createElement('dd');
   while(p.firstChild)dt.appendChild(p.firstChild);
   while(next.firstChild)dd.appendChild(next.firstChild);
   writerPandocRemovePrefix(dd,m[0].length-m[1].length);
   dl.append(dt,dd);p.replaceWith(dl);next.remove();
  }
 }
 if(cfg.fancyLists){
  for(const p of paragraphs){
   if(!p.isConnected||p.tagName!=='P'||p.closest('blockquote,pre,code,li'))continue;
   const parsed=writerPandocListItem(p.textContent||'');
   if(!parsed)continue;
   const previous=p.previousElementSibling;
   let ol=previous?.tagName==='OL'&&previous.classList.contains('writer-v5-pandoc-fancy')&&previous.getAttribute('type')===parsed.type?previous:null;
   if(!ol){ol=document.createElement('ol');ol.className='writer-v5-pandoc-fancy';ol.type=parsed.type;ol.start=Math.max(1,Math.min(parsed.start,3999));p.parentElement.insertBefore(ol,p);}
   const li=document.createElement('li');
   writerPandocRemovePrefix(p,parsed.prefix);
   while(p.firstChild)li.appendChild(p.firstChild);
   ol.appendChild(li);p.remove();
  }
 }
 if(cfg.fencedDivs){
  for(const p of paragraphs){
   if(!p.isConnected||p.children.length)continue;
   const m=/^:{3,}\s+\{\.([\w-]{1,60})(?:\s+#([\w-]{1,80}))?(?:\s+title="([^"]{1,120})")?\}$/.exec((p.textContent||'').trim());
   if(!m)continue;
   const children=[];let next=p.nextElementSibling,closing=null;
   while(next&&children.length<120){
    if(next.tagName==='P'&&/^:{3,}\s*$/.test((next.textContent||'').trim())){closing=next;break;}
    if(next.tagName==='HR')break;
    children.push(next);next=next.nextElementSibling;
   }
   if(!closing)continue;
   const section=document.createElement('section');section.className='writer-v5-pandoc-div writer-v5-class-'+m[1];
   if(m[2])section.id=m[2];
   if(m[3]){const header=document.createElement('div');header.className='writer-v5-pandoc-div-title';header.textContent=m[3];section.appendChild(header);}
   p.parentElement.insertBefore(section,p);
   for(const item of children)section.appendChild(item);
   p.remove();closing.remove();
  }
 }
 if(examples.size){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),refs=[];
  while(walker.nextNode()){
   const n=walker.currentNode;
   if(!n.parentElement?.closest('pre,code,a,.writer-v5-pandoc-marker')&&/\(@[-\w]+\)/.test(n.nodeValue||''))refs.push(n);
  }
  for(const n of refs)n.nodeValue=n.nodeValue.replace(/\(@([-\w]+)\)/g,(match,id)=>examples.has(id)?'('+examples.get(id)+')':match);
 }
}
function writerPandocLiveDecorations(view,cfg){
 if(!cfg.enabled||!view?.state?.doc)return Decoration.none;
 const doc=view.state.doc,ranges=[];let code=false;
 for(let n=1;n<=doc.lines;n++){
  const line=doc.line(n),trim=line.text.trim();
  if(/^(?:\x60{3,}|~{3,})/.test(trim)){code=!code;continue;}
  if(code)continue;
  const fancy=cfg.fancyLists&&writerPandocListItem(line.text);
  let cls='';
  if(fancy)cls='writer-v5-pandoc-fancy-line';
  else if(cfg.definitionLists&&/^:\s+\S/.test(trim))cls='writer-v5-pandoc-definition-line';
  else if(cfg.exampleLists&&/^\(@[-\w]+\)\s+/.test(trim))cls='writer-v5-pandoc-example-line';
  else if(cfg.customLabels&&/^\{::[^}]+\}/.test(trim))cls='writer-v5-pandoc-custom-line';
  else if(cfg.fencedDivs&&/^:{3,}\s+\{/.test(trim))cls='writer-v5-pandoc-div-line';
  if(cls)ranges.push(Decoration.line({class:cls}).range(line.from));
 }
 return ranges.length?Decoration.set(ranges,true):Decoration.none;
}
class WriterPandocSyntax{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.pandocSyntax;}
 active(){return writerModuleOn(this.plugin,'pandocSyntax')&&this.cfg.enabled;}
 register(){
  const p=this.plugin;
  p.registerMarkdownPostProcessor(el=>{if(this.active())writerPandocReading(el,{...this.cfg,superSub:this.cfg.superSub&&!(writerModuleOn(p,'extendedSyntax')&&p.settings.extendedSyntax?.enabled)});});
  if(ViewPlugin?.fromClass){
   const controller=this;
   p.registerEditorExtension(ViewPlugin.fromClass(class{
    constructor(view){this.decorations=this.make(view);}
    make(view){return controller.active()?writerPandocLiveDecorations(view,controller.cfg):Decoration.none;}
    update(update){if(update.docChanged||update.viewportChanged)this.decorations=this.make(update.view);}
   },{decorations:v=>v.decorations}));
  }
  p.addCommand({id:'v5-pandoc-outline',name:writerUi('Pandoc: índice de listas e definições','Pandoc: list and definition outline'),callback:()=>this.openOutline()});
 }
 openOutline(){
  if(!this.active()||!this.cfg.outline)return;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view?.editor)return new Notice(writerUi('Abra uma nota Markdown.','Open a Markdown note.'));
  const entries=writerPandocOutline(view.editor.getValue());
  const dialog=new Modal(this.plugin.app);
  dialog.onOpen=()=>{
   dialog.setTitle(writerUi('Índice Pandoc','Pandoc outline'));
   if(!entries.length){dialog.contentEl.createEl('p',{text:writerUi('Nenhum item estruturado encontrado.','No structured entries found.')});return;}
   const box=dialog.contentEl.createDiv({cls:'writer-v5-pandoc-outline'});
   for(const entry of entries.slice(0,500)){
    const button=box.createEl('button',{text:(entry.line+1)+' · '+entry.title});
    button.addEventListener('click',()=>{dialog.close();view.editor.setCursor({line:entry.line,ch:0});view.editor.scrollIntoView?.({from:{line:entry.line,ch:0},to:{line:entry.line,ch:0}},true);view.editor.focus();});
   }
  };
  dialog.open();
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Pandoc Syntax · listas e blocos','Pandoc Syntax · lists and blocks')});
  panel.createEl('p',{text:writerUi('Renderização local de Markdown compatível com Pandoc. Exportação por executável Pandoc e filtros Lua não estão incluídos nesta etapa.','Local Pandoc-compatible Markdown rendering. Pandoc executable exports and Lua filters are not part of this stage.'),cls:'dictionary-muted'});
  for(const [key,pt,en] of [
   ['enabled','Habilitar Pandoc Syntax','Enable Pandoc Syntax'],
   ['fancyLists','Listas alfabéticas, romanas e #.','Alphabetic, Roman and #. lists'],
   ['definitionLists','Listas de definições','Definition lists'],
   ['exampleLists','Exemplos numerados (@id)','Numbered examples (@id)'],
   ['customLabels','Rótulos {::P}','Custom labels {::P}'],
   ['fencedDivs','Blocos ::: {.classe}','Fenced div ::: {.class}'],
   ['superSub','Sobrescrito e subscrito','Superscript and subscript'],
   ['outline','Índice navegável','Navigable outline']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(this.cfg[key]).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();}));
 }
}
