'use strict';
/* Basic AI v3 editor core. Local helpers with original source offsets. */
const WRITER_V3_DEFAULTS={
 schemaVersion:3,
 complements:{enabled:true,automatic:true,currentFile:true,vault:true,dictionaries:true,internalLinks:true,frontmatter:false,minChars:3,maxResults:8,caseSensitive:false,excludedFolders:'.obsidian,.trash,.note-snapshots,.basic-ai-history',dictionaryPaths:'',useLocalDictionary:false,indexLimit:12000,fileLimit:120000,maxFiles:3000,matchMiddle:false,learnRanking:true,usage:{}},
 variants:{enabled:true,decorate:true,offerInReview:true,snapshotBeforeCommit:true,confirmAll:true,defaultAlternatives:2,aiPrompt:'Suggest 3 stylistically distinct, natural rewrites of the passage in the original language. Preserve meaning, voice, tense and Markdown. Return only the alternatives, one per line, without numbering. Passage:'},
 snapshots:{enabled:true,store:'.basic-ai-history',automatic:false,autoDelaySeconds:300,includeAttachments:false,snapshotBeforeRewrite:true,snapshotBeforeRestore:true,maxPerNote:0,retentionDays:0,identityMap:{},showDiffContext:3}
};
function writerMergeV3(settings){
 const base=settings&&typeof settings==='object'?settings:{};
 for(const [name,values] of Object.entries(WRITER_V3_DEFAULTS)){
  if(name==='schemaVersion')continue;
  base[name]={...values,...(base[name]&&typeof base[name]==='object'&&!Array.isArray(base[name])?base[name]:{})};
 }
 base.schemaVersion=3;return base;
}
function writerUi(pt,en){try{return (require('obsidian').getLanguage?.()||'en').toLowerCase().startsWith('pt')?pt:en;}catch(_){return en;}}
function writerMaskMarkdown(source,keepVariants=false){
 const text=String(source||''),hidden=new Uint8Array(text.length);
 const hide=(from,to)=>{for(let i=Math.max(0,from);i<Math.min(text.length,to);i++)if(text[i]!=='\n'&&text[i]!=='\r')hidden[i]=1;};
 // Never alter the length: LanguageTool offsets correspond to the original Markdown.
 if(text.startsWith('---\n')||text.startsWith('---\r\n')){
  const fm=/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if(fm)hide(0,fm[0].length);
 }
 let fence=null,offset=0;
 for(const line of text.split('\n')){
  const m=/^[ \t]{0,3}(\x60{3,}|~{3,})/.exec(line);
  if(m){
   if(!fence)fence={char:m[1][0],size:m[1].length};
   else if(m[1][0]===fence.char&&m[1].length>=fence.size)fence=null;
   hide(offset,offset+line.length);
  }else if(fence)hide(offset,offset+line.length);
  offset+=line.length+1;
 }
 const masks=[/\x60+[^\x60\r\n]*\x60+/g,/%%[\s\S]*?%%/g,/<!--[\s\S]*?-->/g,/!\[[^\]\r\n]*\]\([^\r\n)]*\)/g,/!?\[\[[^\]\r\n]*\]\]/g,/\[[^\]\r\n]+\]\([^\r\n)]*\)/g];
 if(!keepVariants)masks.push(/\{\{[^\r\n]{1,6000}?\}\}\^\d+/g);
 for(const re of masks){
  let m;while((m=re.exec(text))!==null){
   hide(m.index,m.index+m[0].length);
   if(!m[0].length)re.lastIndex++;
  }
 }
 // HTML attributes and tag names are not natural language. Keep the original
 // UTF-16 offsets (including newlines) so LanguageTool findings still point
 // to the correct Markdown characters. Visible prose *between* tags survives.
 const rawHtml=new Set(['script','style','svg','math','pre','code','textarea','iframe']);
 for(let i=0;i<text.length;){
  if(text[i]!=='<'||hidden[i]){i++;continue;}
  let cursor=i+1,closing=false;
  if(text[cursor]==='/'){closing=true;cursor++;}
  if(text[cursor]==='!'){
   const special=/^<![^>]{1,4000}>/.exec(text.slice(i,i+4002));
   if(special){hide(i,i+special[0].length);i+=special[0].length;continue;}
  }
  const name=/^[A-Za-z][A-Za-z0-9:-]*/.exec(text.slice(cursor,cursor+128));
  if(!name){i++;continue;}
  const tag=name[0].toLowerCase();
  cursor+=name[0].length;
  if(!/[\s/>]/.test(text[cursor]||'')){i++;continue;}
  let quoted=null,end=-1;
  for(let j=cursor;j<Math.min(text.length,i+4000);j++){
   const char=text[j];
   if(quoted){if(char===quoted)quoted=null;}
   else if(char==='"'||char==="'")quoted=char;
   else if(char==='>'){end=j+1;break;}
  }
  if(end<0){i++;continue;}
  hide(i,end);
  if(!closing&&rawHtml.has(tag)&&!text.slice(i,end).endsWith('/>')){
   const closeRe=new RegExp('<\\s*\\/\\s*'+tag+'\\s*>','ig');
   closeRe.lastIndex=end;
   const close=closeRe.exec(text);
   if(close){hide(end,close.index+close[0].length);i=close.index+close[0].length;continue;}
   // Do not leak JavaScript/CSS/code into the checker if the closing tag
   // was omitted; an unclosed raw-HTML block runs to the end of the file.
   hide(end,text.length);break;
  }
  i=end;
 }
 // Entities such as &nbsp; and &#160; are formatting, not spelling mistakes.
 const entity=/&(?:[A-Za-z][A-Za-z0-9]{1,31}|#(?:[0-9]{1,8}|[xX][0-9a-fA-F]{1,8}));/g;
 for(const match of text.matchAll(entity))hide(match.index,match.index+match[0].length);
 // A paired delimiter marks formatting, but the words between markers are prose.
 // This excludes underscores inside identifiers (foo_bar) and escaped characters.
 const emphasis=/(?<![\p{L}\p{N}\\])(\*\*|__|~~|\*|_)(?=\S)([^\r\n]*?\S)\1(?![\p{L}\p{N}])/gu;
 let m;
 while((m=emphasis.exec(text))!==null){
  const from=m.index,closing=from+m[0].length-m[1].length;
  if(closing-from>4000||hidden[from]||hidden[closing])continue;
  let protectedPart=false;
  for(let i=from;i<closing;i++)if(hidden[i]){protectedPart=true;break;}
  if(protectedPart)continue;
  hide(from,from+m[1].length);
  hide(closing,closing+m[1].length);
 }
 const structural=/^[ \t]{0,3}(?:#{1,6}(?=\s)|>(?=\s)|[-*+](?=\s)|\d+[.)](?=\s)|(?:---+|\*\*\*+|___+)[ \t]*$)/gm;
 while((m=structural.exec(text))!==null)hide(m.index,m.index+m[0].length);
 let masked='';for(let i=0;i<text.length;i++)masked+=hidden[i]?' ':text[i];
 return masked;
}
function writerGrammarMatchIsSafe(source,masked,match){
 const from=match?.offset,length=match?.length;
 if(!Number.isInteger(from)||!Number.isInteger(length)||length<=0||from<0||from+length>source.length||masked.length!==source.length)return false;
 for(let i=from;i<from+length;i++)if(source[i]!==masked[i])return false;
 return true;
}
function writerParseVariants(input){
 const text=String(input||''),found=[];let pos=0;
 const exposed=writerMaskMarkdown(text,true);
 while(pos<text.length){
  const from=text.indexOf('{{',pos);if(from<0)break;
  if(exposed.slice(from,from+2)!=='{{'){pos=from+2;continue;}
  let i=from+2,escaped=false,part='',items=[],end=-1;
  while(i<text.length&&i-from<32000){
   const c=text[i];
   if(escaped){part+=c;escaped=false;i++;continue;}
   if(c==='\\'){escaped=true;i++;continue;}
   if(c==='|'){items.push(part);part='';i++;continue;}
   if(c==='}'&&text[i+1]==='}'&&text[i+2]==='^'){
    const m=/^\^(\d{1,5})(?!\d)/.exec(text.slice(i+2,i+10));
    if(m){items.push(part);end=i+2+m[0].length;const active=Number(m[1]);if(items.length>1&&active<items.length)found.push({from,to:end,variants:items,active,raw:text.slice(from,end)});break;}
   }
   if(c==='\n'&&i-from>16000)break;
   part+=c;i++;
  }
  pos=end>from?end:from+2;
 }
 return found;
}
function writerEncodeVariant(items,active=0){
 const list=(items||[]).map(v=>String(v).replace(/\\/g,'\\\\').replace(/\|/g,'\\|').replace(/\}/g,'\\}'));
 if(list.length<2||list.some(v=>v.length>16000))throw Error(writerUi('Variantes inválidas','Invalid variants'));
 return '{{'+list.join('|')+'}}^'+Math.min(Math.max(0,active),list.length-1);
}
function writerVariantAt(text,offset){return writerParseVariants(text).find(v=>offset>=v.from&&offset<=v.to)||null;}
function writerActiveEditor(plugin,file){
 const leaf=plugin.app.workspace.getLeavesOfType('markdown').find(l=>l.view?.file?.path===file?.path);
 return leaf?.view?.editor||null;
}
function writerCurrentText(plugin,file){const editor=writerActiveEditor(plugin,file);return editor?Promise.resolve(editor.getValue()):plugin.app.vault.read(file);}
function writerOffsetToPos(editor,offset){return typeof editor.offsetToPos==='function'?editor.offsetToPos(offset):{line:0,ch:offset};}
async function writerSafeReplace(plugin,file,from,to,expected,replacement,reason){
 if(!file||file.extension!=='md')throw Error(writerUi('Abra uma nota Markdown.','Open a Markdown note.'));
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from)throw Error(writerUi('Intervalo inválido.','Invalid range.'));
 const editor=writerActiveEditor(plugin,file),text=editor?editor.getValue():await plugin.app.vault.read(file);
 if(to>text.length||text.slice(from,to)!==expected)throw Error(writerUi('A nota mudou depois da sugestão. Refaça a operação.','The note changed after the suggestion. Please try again.'));
 const committing=reason.includes('confirmar variante')||reason.includes('confirmar todas as variantes');
 const shouldSnapshot=committing?plugin.settings.variants?.snapshotBeforeCommit!==false:plugin.settings.snapshots?.snapshotBeforeRewrite!==false;
 if(plugin.settings.snapshots?.enabled&&shouldSnapshot&&plugin.writerSnapshots){
  await plugin.writerSnapshots.create(file,'Antes de '+reason,{content:text});
 }
 const next=text.slice(0,from)+replacement+text.slice(to);
 if(editor){
  // A snapshot may involve async I/O: never apply stale offsets afterward.
  if(editor.getValue()!==text)throw Error(writerUi('A nota mudou durante o snapshot. Faça uma nova revisão.','The note changed while creating the snapshot. Run the review again.'));
  editor.replaceRange(replacement,writerOffsetToPos(editor,from),writerOffsetToPos(editor,to));
 }else await plugin.app.vault.process(file,old=>{
   // A matching fragment is not enough: concurrent edits elsewhere must survive.
   if(old!==text)throw Error(writerUi('O arquivo foi editado simultaneamente.','The file was edited concurrently.'));
   return old.slice(0,from)+replacement+old.slice(to);
 });
 return next;
}
