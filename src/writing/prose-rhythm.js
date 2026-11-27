'use strict';
/* On-demand prose measurements with offsets into the unchanged editor text. */
const WRITER_PROSE_MAX=200000;
const WRITER_PROSE_CONTEXT_MAX=2000000;
const WRITER_PROSE_LONG_SENTENCE=25;
const WRITER_PROSE_LONG_PARAGRAPH=80;
const WRITER_PROSE_WORDS=/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’\-][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu;
const WRITER_PROSE_TITLE=/\b(?:sr|sra|dr|dra|prof|profa|mr|mrs|ms|ph\.d|etc|ex|p\.ex|e\.g|i\.e)$/iu;
function writerProseMask(source){
 const blank=value=>value.replace(/[^\r\n]/g,' ');
 const front=/^\uFEFF?---[ \t]*\r?\n[\s\S]*?^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m.exec(source);
 // A leading rule is not frontmatter unless it has a closing delimiter.
 const content=front?.index===0?blank(front[0])+source.slice(front[0].length):source;
 const masked=writerMaskMarkdown(content);
 // Keep paragraph boundaries after headings, rules and quotes out of the
 // measurements without changing any UTF-16 offsets.
 return masked.replace(/[^\r\n]+/g,(line,offset)=>{
  const raw=source.slice(offset,offset+line.length);
  if(/^[ \t]{0,3}(?:#{1,6}(?:[ \t]|$)|(?:[-*_][ \t]*){3,}$|={2,}[ \t]*$|>[ \t]*\[![^\]]+\])/.test(raw))return blank(line);
  return line.replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi,blank);
 });
}
function writerProseExcerpt(text,from,to,limit=155){
 const sample=text.slice(from,Math.min(to,from+limit+1)).replace(/\s+/g,' ').trim();
 return to-from>limit?sample.slice(0,limit).trimEnd()+'…':sample;
}
function writerProseAnalyze(text){
 const buckets=[0,0,0];
 let longestSentences=[],longestParagraphs=[],words=0,sentenceCount=0,paragraphCount=0;
 let sentenceWords=0,longParagraphCount=0;
 const wordCount=s=>{let n=0;for(const _ of s.matchAll(WRITER_PROSE_WORDS))n++;return n;};
 const record=(group,from,to,min)=>{
  const raw=text.slice(from,to),trimmed=raw.trim();
  if(!trimmed)return {};
  const size=wordCount(trimmed);
  if(!size)return {};
  const left=from+raw.length-raw.trimStart().length;
  const entry={from:left,to:left+trimmed.length,words:size};
  return {entry,top:size>=min?[...group,entry].sort((a,b)=>b.words-a.words||a.from-b.from).slice(0,12):group};
 };
 const paragraph=(from,to)=>{
  const part=record(longestParagraphs,from,to,WRITER_PROSE_LONG_PARAGRAPH);
  if(!part.entry)return;
  const p=part.entry;longestParagraphs=part.top;paragraphCount++;words+=p.words;
  if(p.words>=WRITER_PROSE_LONG_PARAGRAPH)longParagraphCount++;
  let start=p.from;
  const finish=end=>{
   const result=record(longestSentences,start,end,WRITER_PROSE_LONG_SENTENCE);
   if(!result.entry)return;
   const sentence=result.entry;longestSentences=result.top;sentenceCount++;sentenceWords+=sentence.words;
   const n=sentence.words;buckets[n<=12?0:n<WRITER_PROSE_LONG_SENTENCE?1:2]++;
  };
  const body=text.slice(p.from,p.to);
  for(const match of body.matchAll(/([.!?…]+)[”’"')\]}»]*(?=\s|$)/gu)){
   const at=p.from+match.index,end=at+match[0].length;
   if(match[1]==='.'&&end<p.to){
    const previous=text.slice(Math.max(start,at-24),at);
    if(WRITER_PROSE_TITLE.test(previous)||/(?:^|[^\p{L}])\p{Lu}$/u.test(previous))continue;
   }
   finish(end);start=end;
  }
  finish(p.to);
 };
 let offset=0,from=null;
 for(const line of text.split('\n')){
  const prose=!!line.trim(),dialogue=/^\s*[—–]\s*\S/u.test(line);
  if(from!==null&&(!prose||dialogue)){paragraph(from,offset-1);from=null;}
  if(prose&&from===null)from=offset;
  offset+=line.length+1;
 }
 if(from!==null)paragraph(from,text.length);
 return {words,paragraphCount,sentenceCount,mean:sentenceCount?sentenceWords/sentenceCount:0,
  buckets,longestSentences,longestParagraphs,longParagraphCount};
}
function writerProseSnapshot(editor){
 const documentText=editor.getValue(),selection=editor.getSelection();
 const pos=selection?editor.getCursor('from'):null;
 const offset=pos?editor.posToOffset(pos):0;
 if(!Number.isInteger(offset)||offset<0||offset>documentText.length||
  (selection&&documentText.slice(offset,offset+selection.length)!==selection))
  throw Error(writerUi('Selecione um único trecho para analisar.','Select one continuous passage to analyze.'));
 if(offset>=WRITER_PROSE_CONTEXT_MAX)
  throw Error(writerUi('A seleção começa depois dos primeiros 2 milhões de caracteres.','The selection begins after the first 2 million characters.'));
 const wanted=selection?selection.length:documentText.length;
 const limit=Math.min(wanted,WRITER_PROSE_MAX,WRITER_PROSE_CONTEXT_MAX-offset);
 // Read to the end of the containing line when possible so URLs, inline
 // markup and fence delimiters at the analysis boundary can be recognized.
 const newline=documentText.indexOf('\n',offset+limit);
 const contextEnd=Math.min(documentText.length,WRITER_PROSE_CONTEXT_MAX,offset+limit+4000,newline<0?documentText.length:newline);
 const masked=writerProseMask(documentText.slice(0,contextEnd)).slice(offset,offset+limit);
 return {documentText,text:masked,offset,truncated:limit<wanted,selection:!!selection};
}
function writerProseJump(plugin,view,editor,snapshot,range){
 const workspace=plugin.app.workspace;
 const file=snapshot.file;
 const scopeEnd=snapshot.offset+snapshot.text.length;
 const from=snapshot.offset+range.from,to=snapshot.offset+range.to;
 if(!file||view?.file!==file||view.editor!==editor||view.getMode?.()==='preview'||
  plugin.app.vault.getAbstractFileByPath(file.path)!==file||
  workspace.activeLeaf?.view!==view||
  editor.getValue()!==snapshot.documentText||!Number.isInteger(from)||!Number.isInteger(to)||
  from<snapshot.offset||from>=to||to>scopeEnd){
  new Notice(writerUi('O editor ou o texto mudou. Abra a análise novamente para localizar o trecho.',
   'The editor or text changed. Reopen the analysis to locate the passage.'));
  return false;
 }
 const a=editor.offsetToPos(from),b=editor.offsetToPos(to);
 editor.setSelection(a,b);
 editor.scrollIntoView({from:a,to:b},true);
 return true;
}
function writerProseModal(plugin,editor,view){
 let snapshot;
 try{snapshot=writerProseSnapshot(editor);}
 catch(error){new Notice(error.message);return;}
 snapshot.file=view?.file;
 const data=writerProseAnalyze(snapshot.text),repeat=writerV131WritingAnalysis(snapshot.text);
 if(!data.words){new Notice(writerUi('Não há prosa para analisar nesse trecho.','There is no prose to analyze in this passage.'));return;}
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Ritmo e repetições','Rhythm and repetition'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-prose-review');
  const num=new Intl.NumberFormat(writerUi('pt-BR','en'),{maximumFractionDigits:1});
  const description=snapshot.selection?writerUi('Seleção','Selection'):writerUi('Nota atual','Current note');
  root.createEl('p',{cls:'setting-item-description',text:description+' · '+num.format(data.words)+' '+writerUi('palavras','words')+' · '+
   num.format(data.sentenceCount)+' '+writerUi('frases','sentences')+' · '+num.format(data.paragraphCount)+' '+writerUi('parágrafos','paragraphs')});
  if(snapshot.truncated)root.createEl('p',{cls:'setting-item-description',text:writerUi('Análise parcial, limitada a ','Partial analysis, limited to ')+
   num.format(snapshot.text.length)+writerUi(' caracteres deste trecho.',' characters in this passage.')});
  root.createEl('p',{cls:'setting-item-description',text:writerUi('As contagens são estimativas para orientar a leitura. Nada é enviado ou alterado.',
   'These counts are estimates to guide your reading. Nothing is sent or changed.')});
  root.createEl('h4',{text:writerUi('Distribuição de frases','Sentence lengths')});
  root.createEl('p',{text:num.format(data.mean)+' '+writerUi('palavras por frase, em média','words per sentence on average')});
  const distribution=root.createEl('dl',{cls:'writer-prose-distribution'});
  for(const [i,label] of ['1–12','13–24','25+'].entries()){
   distribution.createEl('dt',{text:label+' '+writerUi('palavras','words')});
   const row=distribution.createEl('dd');
   row.createEl('span',{text:num.format(data.buckets[i])});
   row.createEl('progress',{attr:{max:String(data.sentenceCount||1),value:String(data.buckets[i]),'aria-hidden':'true'}});
  }
  const section=(title,open=false)=>{
   const details=root.createEl('details',{cls:'writer-prose-findings'});
   details.open=open;
   details.createEl('summary',{text:title});
   return details;
  };
  const jump=(list,text,range)=>{
   const li=list.createEl('li');
   const button=li.createEl('button',{text,attr:{type:'button'}});
   button.addEventListener('click',()=>{
    // Validate and select before closing. Leave the report open on stale data.
    if(writerProseJump(plugin,view,editor,snapshot,range)){
     modal.close();
     if(!plugin.app.isMobile&&plugin.app.workspace.activeLeaf?.view===view)editor.focus?.();
    }
   });
  };
  const marks=(items,total,min,pt,en,open=false)=>{
   const details=section(writerUi(pt,en)+' ('+min+'+) · '+num.format(total),open&&total>0);
   if(!items.length){details.createEl('p',{text:writerUi('Nenhum trecho nessa faixa.','No passages in this range.')});return;}
   if(total>items.length)details.createEl('p',{cls:'setting-item-description',
    text:writerUi('Mostrando os 12 trechos mais longos.','Showing the 12 longest passages.')});
   const list=details.createEl('ul',{cls:'writer-prose-jumps'});
   for(const item of items)jump(list,num.format(item.words)+' '+writerUi('palavras','words')+' · '+
    writerProseExcerpt(snapshot.text,item.from,item.to),item);
  };
  marks(data.longestSentences,data.buckets[2],WRITER_PROSE_LONG_SENTENCE,'Frases longas','Long sentences',true);
  marks(data.longestParagraphs,data.longParagraphCount,WRITER_PROSE_LONG_PARAGRAPH,'Parágrafos longos','Long paragraphs');
  const repeated=section(writerUi('Repetições','Repetition'));
  if(repeat.repeated.length){
   const frequency=repeated.createEl('ul',{cls:'writer-v131-review-frequency'});
   for(const item of repeat.repeated)frequency.createEl('li',{text:item.word+' · '+num.format(item.count)});
  }else repeated.createEl('p',{text:writerUi('Nenhuma repetição relevante encontrada.','No relevant repetition found.')});
  if(repeat.near.length){
   repeated.createEl('h5',{text:writerUi('Ocorrências próximas','Nearby occurrences')});
   const list=repeated.createEl('ul',{cls:'writer-prose-jumps'});
   for(const item of repeat.near)jump(list,item.word+' · …'+item.excerpt+'…',item);
  }
 };
 modal.onClose=()=>modal.contentEl.empty();modal.open();
}
