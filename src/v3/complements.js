'use strict';
/* Offline autocomplete inspired by Various Complements. */
class WriterComplements extends EditorSuggest{
 constructor(plugin){super(plugin.app);this.plugin=plugin;this.cache=new Map();this.ready=false;this.building=null;this.dictionaries=new Map();this.dirty=true;this.generation=0;this.maskCache=new WeakMap();this.fileTermCache=new Map();this.linkList=null;this.linkListAt=0;}
 get options(){return this.plugin.settings.complements||WRITER_V3_DEFAULTS.complements;}
 isExcluded(file){
  if(!file||file.extension!=='md')return true;
  const path=file.path.toLowerCase(),folders=String(this.options.excludedFolders||'').split(/[,;\n]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
  return folders.some(f=>path===f||path.startsWith(f.replace(/\/+$/,'')+'/')||path.includes('/'+f.replace(/\/+$/,'')+'/'));
 }
 tokenize(text){
  const m=new Map(),re=/[\p{L}\p{N}][\p{L}\p{N}_’'-]{1,64}/gu;
  let found;while((found=re.exec(text))!==null){
   const word=found[0];if(word.length<2||word.length>64)continue;
   const key=this.options.caseSensitive?word:word.toLocaleLowerCase();
   const prev=m.get(key);if(prev){prev.count++;}else m.set(key,{word,count:1});
   if(m.size>10000)break;
  }
  return m;
 }
 reset(){this.generation++;this.dirty=true;this.ready=false;this.cache.clear();this.dictionaries.clear();this.fileTermCache.clear();this.linkList=null;}
 async rebuild(){
  if(this.building)return this.building;
  const generation=++this.generation;
  this.building=(async()=>{
   const files=this.plugin.app.vault.getMarkdownFiles().filter(f=>!this.isExcluded(f)).slice(0,Math.max(10,Math.min(6000,Number(this.options.maxFiles)||500)));
   const next=new Map();let total=0;const limit=Math.max(1000,Number(this.options.indexLimit)||12000);
   if(this.options.vault!==false){
    for(let i=0;i<files.length;i++){
     const file=files[i];if(generation!==this.generation)return;
     try{
      if(file.stat?.size>Number(this.options.fileLimit||120000))continue;
      // Reuse unchanged file indexes on successive vault scans. Bound the
      // memory footprint; never trust cache entries without an mtime.
      const stamp=file.stat?.mtime,size=file.stat?.size;
      let stored=this.fileTermCache.get(file.path);
      let terms;
      if(Number.isFinite(stamp)&&stored?.mtime===stamp&&stored.size===size){
       terms=stored.terms;
      }else{
       const text=await this.plugin.app.vault.cachedRead(file);
       terms=this.tokenize(writerMaskMarkdown(text));
       if(Number.isFinite(stamp)){
        if(this.fileTermCache.size>=128)this.fileTermCache.delete(this.fileTermCache.keys().next().value);
        this.fileTermCache.set(file.path,{mtime:stamp,size,terms});
       }
      }
      const remaining=Math.max(0,limit-total);
      const subset=new Map([...terms].slice(0,remaining));next.set(file.path,subset);
      total+=subset.size;if(total>=limit)break;
     }catch(e){console.warn('[Basic AI] autocomplete index:',file.path,e.message);}
     if(i%20===19)await Promise.resolve();
    }
   }
   if(generation!==this.generation)return;
   this.cache=next;this.ready=true;this.dirty=false;
   await this.loadDictionaries();
  })().finally(()=>{this.building=null;});
  return this.building;
 }
 async loadDictionaries(){
  this.dictionaries.clear();
  if(!this.options.dictionaries)return;
  let paths=String(this.options.dictionaryPaths||'').split(/[\n,;]/).map(s=>s.trim()).filter(Boolean);
  if(this.options.useLocalDictionary&&this.plugin.settings.dictionaryFileName)paths.push(this.plugin.settings.dictionaryFileName);
  for(const path of new Set(paths)){
   const file=this.plugin.app.vault.getAbstractFileByPath(path);
   if(!(file instanceof TFile)||file.extension!=='md')continue;
   try{
    const text=await this.plugin.app.vault.cachedRead(file);
    for(const line of text.split('\n').slice(0,25000)){
     if(!line.trim()||/^\s*(?:#|---|\x60{3}|%%)/.test(line))continue;
     let parts=line.split(/\s*(?:=>|→|\t)\s*/);
     if(parts.length===1&&line.includes('|'))parts=line.split('|').map(x=>x.trim()).filter(Boolean);
     const label=parts[0].replace(/^[-*]\s+/,'').replace(/^\*\*|\*\*$/g,'').trim();
     if(!label||label.length>100||/[:{}\[\]]/.test(label))continue;
     const insert=(parts[1]||label).trim();
     this.dictionaries.set(this.options.caseSensitive?label:label.toLocaleLowerCase(),{word:label,insert,source:writerUi('Dicionário','Dictionary'),count:7});
    }
   }catch(e){console.warn('[Basic AI] dictionary:',path,e.message);}
  }
 }
 async getSuggestions(context){
  if(!this.options.enabled)return [];
  if(this.dirty||!this.ready)try{await this.rebuild();}catch(e){console.warn(e);}
  const query=String(context.query||''),key=this.options.caseSensitive?query:query.toLocaleLowerCase(),candidates=new Map();
  const add=(word,insert,score,source)=>{
   if(!word||word===query||word.length>128)return;
   const normalized=this.options.caseSensitive?word:word.toLocaleLowerCase();
   const pos=normalized.indexOf(key);
   if(pos!==0&&!(this.options.matchMiddle&&pos>0))return;
   const prior=candidates.get(normalized);
   const usage=Math.min(50,this.options.usage?.[normalized]||0);
   const weight=score+(pos===0?35:0)+usage+(normalized===key?0:1);
   if(!prior||prior.score<weight)candidates.set(normalized,{word,insert,source,score:weight});
  };
  if(this.options.currentFile&&context.editor){
   const current=this.tokenize(writerMaskMarkdown(context.editor.getValue()));
   for(const item of current.values())add(item.word,item.word,55+Math.min(35,item.count),writerUi('Nota atual','Current note'));
  }
  if(this.options.vault)for(const [path,terms] of this.cache){
   if(path===context.file?.path)continue;
   for(const item of terms.values())add(item.word,item.word,10+Math.min(20,item.count),'Cofre');
  }
  if(this.options.dictionaries)for(const item of this.dictionaries.values())add(item.word,item.insert,85,item.source);
  // A suggestion request should not enumerate a large vault for every key.
  // Refresh link names periodically; new files appear within 10 seconds.
  if(this.options.internalLinks){
   const now=Date.now();
   if(!this.linkList||now-this.linkListAt>10000){
    this.linkList=this.plugin.app.vault.getMarkdownFiles().filter(f=>!this.isExcluded(f));
    this.linkListAt=now;
   }
   for(const file of this.linkList){
   if(this.isExcluded(file))continue;
    add(file.basename,'[['+file.path.replace(/\.md$/i,'')+']]',28,'Link interno');
   }
  }
  if(this.options.frontmatter&&context.file){
   const props=this.plugin.app.metadataCache.getFileCache(context.file)?.frontmatter||{};
   for(const name of Object.keys(props))if(name!=='position')add(name,name,17,'Propriedade');
  }
  return [...candidates.values()].sort((a,b)=>b.score-a.score||a.word.localeCompare(b.word,'pt-BR'))
   .slice(0,Math.max(1,Math.min(30,Number(this.options.maxResults)||8)));
 }
 onTrigger(cursor,editor,file){
  if(!writerModuleOn(this.plugin,'complements')||!this.options.enabled||this.options.automatic===false||!file||this.isExcluded(file))return null;
  const line=editor.getLine(cursor.line)||'',before=line.slice(0,cursor.ch);
  const m=/([\p{L}\p{N}][\p{L}\p{N}_’'-]*)$/u.exec(before);
  if(!m||m[1].length<Math.max(1,Number(this.options.minChars)||3))return null;
  const start={line:cursor.line,ch:cursor.ch-m[1].length},end={line:cursor.line,ch:cursor.ch};
  const pos=typeof editor.posToOffset==='function'?editor.posToOffset(start):null;
  if(pos!==null){
   const full=editor.getValue();let record=this.maskCache.get(editor);
   if(!record||record.source!==full){record={source:full,masked:writerMaskMarkdown(full)};this.maskCache.set(editor,record);}
   if(record.masked.slice(pos,pos+m[1].length)!==m[1])return null;
  }
  if(this.plugin.reviewPopup)this.plugin.closeReviewPopup();
  return {start,end,query:m[1],editor,file};
 }
 renderSuggestion(suggestion,el){
  const row=el.createDiv({cls:'writer-complement-option'});
  row.createSpan({text:suggestion.word});
  row.createSpan({text:suggestion.source,cls:'writer-complement-kind'});
 }
 selectSuggestion(suggestion){
  const ctx=this.context;if(!ctx?.editor)return;
  ctx.editor.replaceRange(suggestion.insert,ctx.start,ctx.end);
  if(this.options.learnRanking){
   const key=this.options.caseSensitive?suggestion.word:suggestion.word.toLocaleLowerCase();
   const usage=this.options.usage||(this.options.usage={});
   usage[key]=Math.min(50,(usage[key]||0)+1);
   if(Object.keys(usage).length>1500)for(const k of Object.keys(usage).slice(0,300))delete usage[k];
   this.plugin.saveSettings();
  }
 }
 async manual(){
   if(!writerModuleOn(this.plugin,'complements'))return;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView),editor=view?.editor,file=view?.file;
  if(!editor||!file)return new Notice(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
  const cursor=editor.getCursor(),line=editor.getLine(cursor.line)||'';
  const m=/([\p{L}\p{N}][\p{L}\p{N}_’'-]*)$/u.exec(line.slice(0,cursor.ch));
  if(!m)return new Notice(writerUi("Posicione o cursor após o começo de uma palavra.","Place the cursor after the beginning of a word."));
  const context={query:m[1],start:{line:cursor.line,ch:cursor.ch-m[1].length},end:cursor,editor,file};
  const results=await this.getSuggestions(context);
  if(!results.length)return new Notice(writerUi("Nenhuma sugestão disponível.","No suggestions available."));
  const modal=new Modal(this.plugin.app);modal.onOpen=()=>{
   modal.setTitle(writerUi("Sugestões de escrita","Writing suggestions"));
   const list=modal.contentEl.createDiv({cls:'writer-complement-manual'});
   for(const item of results){
    list.createEl('button',{text:item.word+' · '+item.source}).addEventListener('click',()=>{modal.close();editor.replaceRange(item.insert,context.start,context.end);});
   }
  };modal.open();
 }
}
