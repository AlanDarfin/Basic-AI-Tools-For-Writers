'use strict';
/* Independent small writing utilities. No upstream bundled files are copied. */
const WRITER_FINAL_DEFAULTS={
 abbreviations:{enabled:true,entries:{"eg.":{value:"for example",isEnabled:true},"atm":{value:"at the moment",isEnabled:true},"imo":{value:"in my opinion",isEnabled:true},"w/":{value:"with",isEnabled:true},"w/o":{value:"without",isEnabled:true},"btw":{value:"by the way",isEnabled:true},"afaik":{value:"as far as I know",isEnabled:true},"rn":{value:"right now",isEnabled:true},"ily":{value:"I love you",isEnabled:true}},expandAtWordBoundary:false},
 anotherName:{enabled:true,property:"another-name"},
 viewMode:{enabled:true,property:"prefer-view"},
 templates:{enabled:true,folder:"Templates",caseSensitive:true,matchCase:true,onlyNew:true,applyOnCreate:true,templateOnRename:false,dateFormat:"YYYY-MM-DD",timeFormat:"HH:mm",matchers:[]},
 unicode:{enabled:true,favorites:["—","…","«","»","“","”","•","→","←","✓","★","≈","≠","∞"],recent:[],maxResults:40},
 toc:{enabled:true,codeBlock:"insta-toc",maxDepth:6,folded:false,numbered:false},
 tts:{enabled:true,engine:"system",allowOnline:false,language:"auto",edgeVoice:"",rate:1,pitch:1,volume:1,voice:"",readSelection:true,maxCharacters:12000}
};
function writerFinalMerge(plugin){
 const current=plugin.settings.finalSuite||{};
 for(const [key,defaults] of Object.entries(WRITER_FINAL_DEFAULTS)){
  current[key]={...defaults,...(current[key]||{})};
  if(key==='templates'){
   if(!Array.isArray(current[key].matchers))current[key].matchers=[];
   if(current[key].caseSensitive===undefined)current[key].caseSensitive=current[key].matchCase!==false;
  }
  if(key==='abbreviations'){
   current[key].entries={...defaults.entries,...(current[key].entries||{})};
   for(const [abbr,entry] of Object.entries(current[key].entries)){
    current[key].entries[abbr]=typeof entry==='string'?{value:entry,isEnabled:true,isCaseSensitive:false}:{
     value:String(entry?.value||''),isEnabled:entry?.isEnabled!==false,isCaseSensitive:entry?.isCaseSensitive===true
    };
   }
  }
 }
 plugin.settings.finalSuite=current;
 return current;
}
class WriterFinalFeatures{
 constructor(plugin){this.plugin=plugin;this.timer=null;this.speaking=false;this.lastFile=plugin.app.workspace.getActiveFile?.()||null;this.edgePlayer=null;this.ttsStatus='idle';this.ttsMessage='';}
 get cfg(){return this.plugin.settings.finalSuite;}
 register(){
  const p=this.plugin;
  p.registerEvent(p.app.workspace.on('layout-change',()=>this.refreshNames()));
  if(p.app.metadataCache?.on)p.registerEvent(p.app.metadataCache.on('changed',()=>this.refreshNames()));
  p.registerEvent(p.app.workspace.on('file-open',file=>{if(file){this.lastFile=file;this.refreshNames();this.applyViewMode(file).catch(console.warn);}}));
  p.registerEvent(p.app.vault.on('create',file=>{if(file instanceof TFile&&file.extension==='md')this.applyTemplate(file).catch(e=>console.warn('[Basic AI] template:',e));}));
  p.registerEvent(p.app.vault.on('rename',(file,oldPath)=>{if(file instanceof TFile&&file.extension==='md')this.applyTemplateOnRename(file,oldPath).catch(e=>console.warn('[Basic AI] template rename:',e));}));
  if(EditorView.updateListener?.of)p.registerEditorExtension(EditorView.updateListener.of(update=>{
   if(!update.docChanged||!p.settings.finalSuite?.abbreviations?.enabled)return;
   if(!update.transactions?.some(tr=>tr.isUserEvent?.('input.type')))return;
   if(this.expanding)return;
   let change=null;
   update.changes.iterChanges((fromA,toA,fromB,toB,inserted)=>{
    const value=inserted.toString();
    if(value===' '||(value.length===1&&p.settings.finalSuite.abbreviations.expandAtWordBoundary&&/[\t.,!?;:]/.test(value)))change={at:toB,character:value};
   });
   if(change)queueMicrotask(()=>this.tryExpand(update.view,change));
  }));
  if(p.registerMarkdownCodeBlockProcessor)p.registerMarkdownCodeBlockProcessor('insta-toc',async(source,el,ctx)=>this.renderToc(el,ctx.sourcePath,source));
  const commands=[
   ['writer-insert-unicode','Unicode: Search and insert',()=>this.unicodePicker()],
   ['writer-tts-read','Read selection or current note aloud',()=>this.speakActive()],
   ['writer-tts-pause','Pause speech',()=>this.pause()],
   ['writer-tts-resume','Resume speech',()=>this.resume()],
   ['writer-tts-stop','Stop speech',()=>this.stop()],
   ['writer-insert-toc','Insert instant table of contents',()=>this.insertToc()],
   ['writer-abbreviations','Edit abbreviations',()=>this.editAbbreviations()],
   ['writer-insert-template','Insert note-name template',()=>this.applyTemplateToCurrent()]
  ];
  for(const [id,name,callback] of commands)p.addCommand({id,name,callback:async()=>{try{await callback();}catch(e){new Notice(String(e?.message||e));}}});
  // Voices can arrive asynchronously. Android WebView may not expose Web Speech.
  if(typeof speechSynthesis!=='undefined'&&typeof speechSynthesis.addEventListener==='function'){
   const update=()=>this.refreshVoiceSelectors();
   speechSynthesis.addEventListener('voiceschanged',update);
   if(typeof p.register==='function')p.register(()=>speechSynthesis.removeEventListener('voiceschanged',update));
  }
  if(p.app.workspace.iterateAllLeaves)this.refreshNames();
 }
 tryExpand(view,change){
  const cfg=this.cfg.abbreviations;
  if(!cfg?.enabled||this.expanding)return;
  const doc=view.state.doc.toString(),pos=change.at;
  if(pos<1||doc[pos-1]!==change.character)return;
  const prefix=doc.slice(Math.max(0,pos-160),pos-1);
  const entries=Object.entries(cfg.entries||{}).filter(([k,v])=>k&&v?.isEnabled!==false&&typeof v?.value==='string'&&v.value.trim()).sort((a,b)=>b[0].length-a[0].length);
  for(const [needle,entry] of entries){
   const before=prefix.slice(-needle.length);
   if(entry.isCaseSensitive?before!==needle:before.toLocaleLowerCase()!==needle.toLocaleLowerCase())continue;
   const start=pos-1-needle.length;
   if(start>0&&/[\p{L}\p{N}_]/u.test(doc[start-1]))continue;
   this.expanding=true;
   try{view.dispatch({changes:{from:start,to:pos-1,insert:entry.value}});}
   finally{this.expanding=false;}
   return;
  }
 }
 refreshNames(){
  if(!this.cfg.anotherName.enabled||!this.plugin.app.workspace.iterateAllLeaves)return;
  this.plugin.app.workspace.iterateAllLeaves(leaf=>{
   if(!(leaf.view instanceof MarkdownView))return;
   const view=leaf.view,file=view.file,root=view.containerEl;
   if(!root)return;
   root.querySelectorAll('.writer-another-name').forEach(el=>el.remove());
   if(!file)return;
   const value=this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[this.cfg.anotherName.property];
   const title=root.querySelector('.inline-title');
   if(title&&typeof value==='string'&&value.trim()){
    const line=root.createDiv({cls:'writer-another-name',text:value});
    title.insertAdjacentElement('afterend',line);
   }
  });
 }
 async applyViewMode(file){
  if(!this.cfg.viewMode.enabled)return;
  const mode=this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[this.cfg.viewMode.property];
  if(!['read','edit','edit-preview','edit-source'].includes(mode))return;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view||view.file?.path!==file.path)return;
  const state=view.getState();
  if(mode==='read'){state.mode='preview';}
  else{state.mode='source';state.source=mode==='edit-source';}
  await view.setState(state,{history:false});
 }
 templateFolder(){
  return String(this.cfg.templates.folder||'Templates').replace(/^\/+|\/+$/g,'');
 }
 fileMatchesTemplateRule(basename,rule){
  const raw=String(rule?.matchString||'').trim();
  if(!raw)return false;
  const sensitive=this.cfg.templates.caseSensitive!==false&&this.cfg.templates.matchCase!==false;
  const title=sensitive?String(basename):String(basename).toLowerCase();
  const match=sensitive?raw:raw.toLowerCase();
  switch(rule.matchMethod){
   case 'prefix':return title.startsWith(match);
   case 'suffix':return title.endsWith(match);
   case 'contains':return title.includes(match);
   default:return false;
  }
 }
 templateMatcher(file){
  const rules=this.cfg.templates.matchers||[];
  return rules.find(rule=>this.fileMatchesTemplateRule(file.basename,rule));
 }
 async templateForFile(file){
  const cfg=this.cfg.templates,folder=this.templateFolder();
  if(file.path.startsWith(folder+'/'))return null;
  const rules=cfg.matchers||[];
  let templatePath;
  let explicit=false;
  if(rules.length){
   const rule=this.templateMatcher(file);
   if(!rule)return null;
   templatePath=String(rule.templatePath||'');
   explicit=true;
  }else{
   // Compatibility with beta 4's exact-name template lookup.
   templatePath=folder+'/'+file.basename+'.md';
  }
  if(!templatePath.endsWith('.md'))return null;
  const target=this.plugin.app.vault.getAbstractFileByPath(templatePath);
  if(!(target instanceof TFile)||target.path===file.path)return null;
  if(!(target.path===folder||target.path.startsWith(folder+'/')))return null;
  return {target,explicit};
 }
 evaluateTemplate(template,file){
  const cfg=this.cfg.templates;
  const format=(pattern)=>{
   try{
    const moment=require('obsidian').moment;
    if(typeof moment==='function')return moment().format(pattern);
   }catch(_){}
   // When Obsidian's Moment API is unavailable, use stable ISO fallbacks.
   const now=new Date();
   return /H|h|m|s/.test(pattern)?now.toTimeString().slice(0,5):now.toISOString().slice(0,10);
  };
  return String(template).replace(/\{\{(date|time)(?::([^{}]+))?\}\}/g,(_whole,kind,formatOverride)=>{
   return format(formatOverride||(kind==='date'?cfg.dateFormat||'YYYY-MM-DD':cfg.timeFormat||'HH:mm'));
  }).replace(/\{\{title\}\}/gi,file.basename);
 }
 async prependTemplate(file,target,onlyIfEmpty){
  const source=await this.plugin.app.vault.cachedRead(target);
  if(!source)return false;
  const rendered=this.evaluateTemplate(source,file);
  let changed=false;
  const update=old=>{
   if(onlyIfEmpty&&old.trim())return old;
   // Never remove existing note data. A matching template is prepended.
   const next=rendered+(old.trim()?'\n\n'+old:'');
   if(next===old)return old;
   changed=true;return next;
  };
  if(this.plugin.app.vault.process)await this.plugin.app.vault.process(file,update);
  else{
   const old=await this.plugin.app.vault.read(file);
   const next=update(old);
   if(next!==old)await this.plugin.app.vault.modify(file,next);
  }
  return changed;
 }
 async applyTemplate(file,force=false){
  const cfg=this.cfg.templates;
  if(!cfg.enabled||(!force&&!cfg.applyOnCreate))return false;
  const found=await this.templateForFile(file);
  if(!found)return false;
  // Existing exact-name beta-4 templates retain their non-destructive behavior.
  return this.prependTemplate(file,found.target,found.explicit?false:cfg.onlyNew!==false);
 }
 async applyTemplateOnRename(file,oldPath){
  const cfg=this.cfg.templates;
  if(!cfg.enabled||!cfg.templateOnRename||!oldPath)return false;
  const found=await this.templateForFile(file);
  if(!found?.explicit)return false;
  const oldBase=String(oldPath).split('/').pop().replace(/\.md$/i,'');
  const matcher=this.templateMatcher(file);
  // Do not prepend repeatedly when the old name already matched the same rule.
  if(this.fileMatchesTemplateRule(oldBase,matcher))return false;
  return this.prependTemplate(file,found.target,false);
 }
 async applyTemplateToCurrent(){
  const file=this.plugin.app.workspace.getActiveFile();
  if(!(file instanceof TFile))return new Notice('Open a Markdown note.');
  const applied=await this.applyTemplate(file,true);
  new Notice(applied?'Template applied.':'No applicable template, or note is not empty.');
 }
 async insertToc(){
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view)return new Notice('Open a Markdown note.');
  view.editor.replaceSelection('\n'+String.fromCharCode(96,96,96)+'insta-toc\n'+String.fromCharCode(96,96,96)+'\n');
 }
 async renderToc(el,path,source=''){
  const cfg=this.cfg.toc;
  if(!cfg.enabled)return;
  const file=this.plugin.app.vault.getAbstractFileByPath(path);
  if(!(file instanceof TFile))return;
  const local={...cfg};
  for(const line of String(source).split('\n')){
   const match=/^\s*(maxDepth|numbered|folded)\s*:\s*(.*?)\s*$/i.exec(line);
   if(!match)continue;
   if(match[1]==='maxDepth')local.maxDepth=Math.max(1,Math.min(6,Number(match[2])||6));
   else local[match[1]]=match[2].toLowerCase()==='true';
  }
  const text=await this.plugin.app.vault.cachedRead(file);
  const re=/^(#{1,6})[ \t]+([^\r\n]+)$/gm;
  const nodes=[],stack=[{level:0,children:nodes}];let match;
  while((match=re.exec(text))!==null){
   const level=match[1].length,title=match[2].replace(/[ \t]+#+[ \t]*$/,'').trim();
   if(!title||level>Number(local.maxDepth)||title.toLowerCase()==='table of contents')continue;
   const node={level,title,children:[],offset:match.index};
   while(stack.length>1&&stack[stack.length-1].level>=level)stack.pop();
   stack[stack.length-1].children.push(node);stack.push(node);
  }
  const wrap=el.createDiv({cls:'writer-insta-toc-rendered'});
  if(!nodes.length){wrap.createEl('p',{text:'No headings found.'});return;}
  const toolbar=wrap.createDiv({cls:'writer-insta-toc-toolbar'});
  const list=wrap.createEl(local.numbered?'ol':'ul',{cls:'writer-insta-toc'});
  const openAt=async node=>{
   const active=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
   if(!active||active.file?.path!==file.path){
    const leaf=this.plugin.app.workspace.getLeaf(false);
    await leaf.openFile(file);
   }
   const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
   const cache=this.plugin.app.metadataCache.getFileCache(file);
   const found=cache?.headings?.find(h=>h.heading===node.title&&h.level===node.level);
   if(view?.editor){
    const pos=found?.position?.start||view.editor.offsetToPos(node.offset);
    view.editor.setCursor(pos);view.editor.scrollIntoView({from:pos,to:pos},true);
   }
  };
  const draw=(items,parent)=>{
   for(const node of items){
    const li=parent.createEl('li',{cls:'writer-insta-toc-item'});
    if(node.children.length){
     const details=li.createEl('details',{cls:'writer-insta-toc-branch'});
     details.open=!local.folded;
     const summary=details.createEl('summary');
     const title=summary.createEl('a',{text:node.title.replace(/[*_\x60]+/g,''),href:'#'});
     title.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openAt(node).catch(console.warn);});
     const child=details.createEl(local.numbered?'ol':'ul');
     draw(node.children,child);
    }else{
     const link=li.createEl('a',{text:node.title.replace(/[*_\x60]+/g,''),href:'#'});
     link.addEventListener('click',event=>{event.preventDefault();openAt(node).catch(console.warn);});
    }
   }
  };
  draw(nodes,list);
  const all=()=>[...list.querySelectorAll('details')];
  toolbar.createEl('button',{text:'Expand all',attr:{'aria-label':'Expand all headings'}}).addEventListener('click',()=>all().forEach(d=>d.open=true));
  toolbar.createEl('button',{text:'Collapse all',attr:{'aria-label':'Collapse all headings'}}).addEventListener('click',()=>all().forEach(d=>d.open=false));
 }
 unicodePath(){
  const base=this.plugin.manifest.dir||this.plugin.app.vault.configDir+'/plugins/'+this.plugin.manifest.id;
  return base+'/writer-unicode-data.txt';
 }
 async loadUnicodeIndex(){
  if(this.unicodeIndex)return this.unicodeIndex;
  const path=this.unicodePath();
  const adapter=this.plugin.app.vault.adapter;
  const list=[];
  if(await adapter.exists(path)){
   const raw=await adapter.read(path);
   for(const line of raw.split('\n')){
    const columns=line.split(';');
    if(columns.length<2)continue;
    const code=Number.parseInt(columns[0],16),name=columns[1]?.trim();
    if(!Number.isInteger(code)||code>0x10ffff||code>=0xd800&&code<=0xdfff||!name||name.startsWith('<'))continue;
    list.push({code,char:String.fromCodePoint(code),name,search:name.toLowerCase(),hex:columns[0].toLowerCase()});
   }
  }
  this.unicodeIndex=list;
  return list;
 }
 async downloadUnicode(){
  const url='https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt';
  const response=await requestUrl({url,throw:false});
  if(response.status!==200||!response.text||response.text.length>12000000||!response.text.includes(';LATIN CAPITAL LETTER A;'))throw Error('UnicodeData download failed.');
  const path=this.unicodePath();
  await this.plugin.app.vault.adapter.write(path,response.text);
  this.unicodeIndex=null;
  const list=await this.loadUnicodeIndex();
  new Notice('Unicode index ready: '+list.length+' characters.');
  return list;
 }
 async unicodePicker(){
  const cfg=this.cfg.unicode;
  if(!cfg.enabled)return new Notice(writerUi('Ative a busca Unicode nas configurações.','Enable Unicode search in settings.'));
  const modal=new Modal(this.plugin.app);
  const editor=this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
  const common=[['Em dash','—'],['En dash','–'],['Ellipsis','…'],['Left guillemet','«'],['Right guillemet','»'],['Left double quote','“'],['Right double quote','”'],['Bullet','•'],['Arrow right','→'],['Arrow left','←'],['Check mark','✓'],['Star','★'],['Approximation','≈'],['Not equal','≠'],['Infinity','∞'],['Section','§'],['Degree','°'],['Copyright','©'],['Registered','®'],['Euro','€'],['Smiley','☺']];
  modal.onOpen=async()=>{
   modal.setTitle(writerUi('Pesquisar Unicode','Unicode search'));
   modal.contentEl.addClass('writer-unicode-modal');
   const search=modal.contentEl.createDiv({cls:'writer-unicode-search'});
   const input=search.createEl('input',{type:'search',placeholder:writerUi('Nome, símbolo ou U+XXXX','Name, symbol or U+XXXX')});
   input.setAttribute('aria-label','Search Unicode characters');
   const categories=search.createEl('select',{cls:'writer-unicode-category',attr:{'aria-label':'Character category'}});
   for(const [id,title] of [['all',writerUi('Todos','All')],['favorites',writerUi('Favoritos','Favorites')],['arrows',writerUi('Setas','Arrows')],['quotes',writerUi('Aspas','Quotes')],['math',writerUi('Matemática','Math')],['symbols',writerUi('Símbolos','Symbols')],['letters',writerUi('Letras','Letters')]]){
    categories.createEl('option',{value:id,text:title});
   }
   const info=modal.contentEl.createDiv({cls:'writer-unicode-status'});
   const results=modal.contentEl.createDiv({cls:'writer-unicode-results'});
   let index=[];
   try{index=await this.loadUnicodeIndex();}catch(error){info.setText(error.message);}
   const meta=new Map(common.map(([name,char])=>[char,{name,char,code:char.codePointAt(0),search:name.toLowerCase()}]));
   for(const entry of index)if(!meta.has(entry.char))meta.set(entry.char,entry);
   const classify=entry=>{
    const name=entry.name.toUpperCase();
    if(/ARROW|HARPOON/.test(name))return 'arrows';
    if(/QUOTATION|APOSTROPHE|GUILLEMET/.test(name))return 'quotes';
    if(/MATHEMATICAL|INTEGRAL|EQUAL|PLUS|MINUS|INFINITY|SUMMATION|APPROXIMAT/.test(name))return 'math';
    if(/LETTER|SYLLABLE|IDEOGRAPH/.test(name))return 'letters';
    return 'symbols';
   };
   let visible=[];
   const insert=entry=>{
    if(editor)editor.replaceSelection(entry.char);
    else if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText)navigator.clipboard.writeText(entry.char).catch(()=>new Notice('Copy failed.'));
    cfg.recent=[entry.char,...(cfg.recent||[]).filter(c=>c!==entry.char)].slice(0,30);
    this.plugin.saveSettings();modal.close();
   };
   const render=()=>{
    results.empty();
    const q=input.value.trim().toLowerCase(),category=categories.value;
    const limit=Math.max(5,Math.min(150,Number(cfg.maxResults)||40));
    const score=entry=>{
     const name=entry.name.toLowerCase(),hex=entry.code.toString(16);
     if(entry.char===q)return 0;
     if(q.startsWith('u+')&&hex.startsWith(q.slice(2)))return 1;
     if(name===q)return 2;
     if(name.startsWith(q))return 3;
     if(name.split(/\s+/).some(word=>word===q))return 4;
     if(name.split(/\s+/).some(word=>word.startsWith(q)))return 5;
     if(name.includes(q))return 7;
     if(hex.includes(q.replace('u+','')))return 9;
     return 999;
    };
    let pool=[];
    if(!q){
     pool=[...new Set([...(cfg.favorites||[]),...(cfg.recent||[]),...common.map(x=>x[1])])].map(char=>meta.get(char)||{char,code:char.codePointAt(0),name:'Unicode character'}).filter(Boolean);
     if(category!=='all')pool=pool.filter(entry=>category==='favorites'?(cfg.favorites||[]).includes(entry.char):classify(entry)===category);
    }else{
     const candidates=index.length?index:[...meta.values()];
     pool=candidates.filter(entry=>(category==='all'||category==='favorites'&&(cfg.favorites||[]).includes(entry.char)||classify(entry)===category)&&score(entry)<999);
     if(/^u\+[0-9a-f]{2,6}$/i.test(q)){
      const number=Number.parseInt(q.slice(2),16);
      if(number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)){
       const char=String.fromCodePoint(number);
       if(!pool.some(entry=>entry.char===char))pool.unshift(meta.get(char)||{char,code:number,name:'Unicode character'});
      }
     }
     pool.sort((x,y)=>score(x)-score(y)||x.name.length-y.name.length||x.code-y.code);
    }
    visible=pool.slice(0,limit);
    info.setText(index.length
      ?writerUi('Índice offline: ','Offline index: ')+index.length.toLocaleString()+' · '+visible.length+writerUi(' resultados',' results')
      :writerUi('Símbolos comuns · baixe o índice completo nas configurações.','Common symbols · download the complete index in settings.'));
    for(const entry of visible){
     const card=results.createDiv({cls:'writer-unicode-entry'});
     const use=card.createEl('button',{cls:'writer-unicode-insert',attr:{'aria-label':'Insert '+entry.name}});
     use.createSpan({cls:'writer-unicode-glyph',text:entry.char});
     const detail=use.createSpan({cls:'writer-unicode-detail'});
     detail.createSpan({cls:'writer-unicode-name',text:entry.name});
     detail.createSpan({cls:'writer-unicode-code',text:'U+'+entry.code.toString(16).toUpperCase().padStart(4,'0')});
     use.addEventListener('click',()=>insert(entry));
     const favorite=card.createEl('button',{cls:'writer-unicode-favorite',text:(cfg.favorites||[]).includes(entry.char)?'★':'☆',attr:{'aria-label':'Toggle favorite '+entry.name,'aria-pressed':String((cfg.favorites||[]).includes(entry.char))}});
     favorite.addEventListener('click',()=>{
      cfg.favorites=(cfg.favorites||[]).includes(entry.char)?cfg.favorites.filter(ch=>ch!==entry.char):[...(cfg.favorites||[]),entry.char];
      this.plugin.saveSettings();
      favorite.setText(cfg.favorites.includes(entry.char)?'★':'☆');
      favorite.setAttribute('aria-pressed',String(cfg.favorites.includes(entry.char)));
      if(categories.value==='favorites')render();
     });
    }
    if(!visible.length)results.createEl('p',{text:writerUi('Nenhum caractere encontrado.','No matching characters.'),cls:'writer-unicode-empty'});
   };
   let queued;
   input.addEventListener('input',()=>{clearTimeout(queued);queued=setTimeout(render,100);});
   input.addEventListener('keydown',event=>{if(event.key==='Enter'&&visible.length){event.preventDefault();insert(visible[0]);}});
   categories.addEventListener('change',render);
   render();input.focus();
  };
  modal.open();
 }
 async editAbbreviations(){
  const modal=new Modal(this.plugin.app),entries=this.cfg.abbreviations.entries;
  modal.onOpen=()=>{
   modal.setTitle('Abbreviations');
   const create=modal.contentEl.createDiv({cls:'writer-abbr-add'});
   let word='',expansion='';
   new Setting(create).setName('Add abbreviation')
    .addText(t=>t.setPlaceholder('Abbreviation').onChange(v=>word=v))
    .addText(t=>t.setPlaceholder('Expansion').onChange(v=>expansion=v))
    .addButton(b=>b.setButtonText('Add').onClick(async()=>{
     const key=word.trim();
     if(!key||!expansion.trim()||/\s/.test(key))return new Notice('Please enter a word without spaces and a replacement.');
     if(entries[key])return new Notice('This abbreviation already exists.');
     entries[key]={value:expansion,isEnabled:true,isCaseSensitive:false};
     await this.plugin.saveSettings();paint();
    }));
   const list=modal.contentEl.createDiv({cls:'writer-abbr-list'});
   const paint=()=>{
    list.empty();
    for(const [key,entry] of Object.entries(entries)){
     const row=new Setting(list);
     row.setName(key);
     row.addToggle(t=>t.setValue(entry.isEnabled!==false).onChange(async value=>{
      entry.isEnabled=value;await this.plugin.saveSettings();
     }));
     row.addText(t=>t.setValue(entry.value||'').onChange(async value=>{entry.value=value;await this.plugin.saveSettings();}));
     row.addExtraButton(b=>b.setIcon('case-sensitive').setTooltip('Case sensitive').onClick(async()=>{
      entry.isCaseSensitive=!entry.isCaseSensitive;await this.plugin.saveSettings();new Notice(entry.isCaseSensitive?'Case-sensitive':'Case-insensitive');
     }));
     row.addExtraButton(b=>b.setIcon('pencil').setTooltip('Rename abbreviation').onClick(()=>{
      new TextPrompt(this.plugin.app,'Rename abbreviation',async name=>{
       const newName=name.trim();
       if(!newName||/\s/.test(newName)||entries[newName])return new Notice('Invalid or duplicate abbreviation.');
       entries[newName]=entry;delete entries[key];await this.plugin.saveSettings();paint();
      },key).open();
     }));
     row.addExtraButton(b=>b.setIcon('trash').setTooltip('Delete abbreviation').onClick(async()=>{
      delete entries[key];await this.plugin.saveSettings();paint();
     }));
    }
   };
   paint();
  };
  modal.open();
 }
 onTtsState(status,message=''){
  this.ttsStatus=status;this.ttsMessage=message;
  if(typeof document!=='undefined')document.querySelectorAll('.writer-tts-current-status').forEach(node=>{
   node.textContent=({idle:'Ready',loading:'Generating online speech…',playing:'Reading aloud',paused:'Paused',error:'Speech unavailable'}[status]||status)+(message?' · '+message:'');
  });
  if(status==='error')new Notice(message||'Online speech service unavailable.',6500);
 }
 getEdgePlayer(){
  if(!this.edgePlayer){
   if(typeof WriterEdgePlayer==='undefined')throw Error('Online TTS module was not loaded.');
   this.edgePlayer=new WriterEdgePlayer((status,message)=>this.onTtsState(status,message));
  }
  return this.edgePlayer;
 }
 systemVoices(){
  if(typeof speechSynthesis==='undefined'||typeof speechSynthesis.getVoices!=='function')return [];
  try{return Array.from(speechSynthesis.getVoices()||[]);}catch(_){return [];}
 }
 systemSpeechStatus(){
  if(typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined')
   return writerUi('A voz nativa não está disponível no WebView do Obsidian. No Android isso pode acontecer mesmo com vozes instaladas no telefone. Escolha o mecanismo online apenas se quiser permitir o envio do texto.','Native speech is not exposed by Obsidian’s WebView. On Android, this can happen even with voices installed on the phone. Select online speech only if you consent to sending text.');
  const voices=this.systemVoices();
  if(!voices.length)return writerUi('O WebView ainda não forneceu uma lista de vozes. Tente a voz padrão ou um mecanismo online com consentimento explícito.','The WebView has not provided a voice list. Try system default or an online engine with explicit consent.');
  return writerUi('Vozes disponíveis pelo WebView: ','Voices available in WebView: ')+voices.length;
 }
 refreshVoiceSelectors(){
  if(typeof document==='undefined'||!document.querySelectorAll)return;
  for(const select of document.querySelectorAll('.writer-tts-voice-select')){
   const selected=this.cfg.tts.voice||'';
   select.empty();
   select.createEl('option',{text:writerUi('Voz padrão do sistema','System default'),value:''});
   for(const voice of this.systemVoices())select.createEl('option',{text:voice.name+' ('+voice.lang+')',value:voice.voiceURI});
   select.value=[...select.options].some(o=>o.value===selected)?selected:'';
  }
  for(const node of document.querySelectorAll('.writer-tts-system-diagnostic'))node.setText?.(this.systemSpeechStatus());
 }
 async speakActive(){
  const cfg=this.cfg.tts;
  if(!cfg.enabled)return new Notice('Enable text-to-speech in settings.');
  // On Android, tapping a sidebar button often makes the sidebar the active leaf.
  // Find the last markdown editor before falling back to the vault note on disk.
  const workspace=this.plugin.app.workspace;
  const file=workspace.getActiveFile?.()||this.lastFile;
  const leaves=workspace.getLeavesOfType?.('markdown')||[];
  const view=workspace.getActiveViewOfType(MarkdownView)
   ||leaves.find(leaf=>leaf.view?.file?.path===file?.path&&leaf.view?.editor)?.view
   ||leaves.find(leaf=>leaf.view?.file?.extension==='md'&&leaf.view?.editor)?.view;
  const note= view?.file||file;
  if(!note||note.extension!=='md')return new Notice('Open a Markdown note.');
  this.lastFile=note;
  const selected=view?.editor?.getSelection?.()||'';
  const raw=selected&&cfg.readSelection?selected:
    (view?.editor?.getValue?.()??await this.plugin.app.vault.cachedRead(note));
  const maximum=Math.max(100,Math.min(60000,Number(cfg.maxCharacters)||12000));
  const text=writerMaskMarkdown(raw).replace(/ {2,}/g,' ').trim().slice(0,maximum);
  if(!text)return new Notice('No readable text.');
  const engine=cfg.engine||'system';
  if(engine==='edge'){
   if(!cfg.allowOnline)return new Notice('Enable "Allow text to be sent to Microsoft" in TTS settings before using online voices.');
   if(typeof WebSocket==='undefined')return new Notice('Online voice requires WebSocket support.');
   this.stop();
   const lang=cfg.language==='auto'?(typeof navigator!=='undefined'?navigator.language:'pt-BR'):cfg.language;
   const selectedVoice=cfg.edgeVoice||WRITER_EDGE_VOICES[lang]||WRITER_EDGE_VOICES[lang.split('-')[0]==='pt'?'pt-BR':'en-US'];
   try{await this.getEdgePlayer().start(text,selectedVoice,cfg.rate);}
   catch(error){this.onTtsState('error',error.message);}
   return;
  }
  if(typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined')
   return new Notice(writerUi('O WebView do Android não expõe a voz nativa do sistema. Use o mecanismo online somente se autorizar o envio do texto.','This WebView does not expose native text-to-speech. Use online speech only after allowing text to be sent.'),8000);
  this.stop();
  const utterance=new SpeechSynthesisUtterance(text);
  const lang=cfg.language;
  utterance.lang=lang==='auto'?(typeof navigator!=='undefined'?navigator.language:'pt-BR'):lang;
  utterance.rate=Number(cfg.rate)||1;utterance.pitch=Number(cfg.pitch)||1;utterance.volume=Number(cfg.volume)||1;
  const voices=this.systemVoices();
  const requested=voices.find(v=>v.voiceURI===cfg.voice)||voices.find(v=>String(v.lang||'').toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0,2)));
  if(requested)utterance.voice=requested;
  utterance.onstart=()=>this.onTtsState('playing');
  utterance.onend=()=>{this.speaking=false;this.onTtsState('idle');};
  utterance.onerror=event=>this.onTtsState('error',event.error||'System voice failed.');
  try{speechSynthesis.speak(utterance);this.speaking=true;}
  catch(error){this.speaking=false;this.onTtsState('error',writerUi('Não foi possível usar o mecanismo local: ','Cannot use system TTS: ')+String(error?.message||error));}
 }
 pause(){
  if(this.cfg.tts.engine==='edge')this.edgePlayer?.pause();
  else if(typeof speechSynthesis!=='undefined'){speechSynthesis.pause();this.onTtsState('paused');}
 }
 resume(){
  if(this.cfg.tts.engine==='edge')this.edgePlayer?.resume();
  else if(typeof speechSynthesis!=='undefined'){speechSynthesis.resume();this.onTtsState('playing');}
 }
 stop(){
  this.edgePlayer?.stop();
  if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();
  this.speaking=false;this.onTtsState('idle');
 }

};
function writerRenderFinalSettings(panel,plugin,section){
 const sectionMap={abbreviations:'Abbreviations',anotherName:'Another name',viewMode:'View mode',templates:'Templates by note name',unicode:'Unicode search',toc:'Instant TOC',tts:'Text to speech'};
 const cfg=plugin.settings.finalSuite[section];
 panel.createEl('h3',{text:sectionMap[section]||section});
 const bool=(field,label)=>new Setting(panel).setName(label).addToggle(t=>t.setValue(!!cfg[field]).onChange(async v=>{cfg[field]=v;await plugin.saveSettings();}));
 const str=(field,label)=>new Setting(panel).setName(label).addText(t=>t.setValue(String(cfg[field]??'')).onChange(async v=>{cfg[field]=v;await plugin.saveSettings();}));
 bool('enabled','Enabled');
 if(section==='abbreviations'){bool('expandAtWordBoundary','Expand on punctuation or space (instead of space only)');new Setting(panel).setName('Edit abbreviations').addButton(b=>b.setButtonText('Open').onClick(()=>plugin.writerFinalFeatures.editAbbreviations()));}
 if(section==='anotherName')str('property','Frontmatter property');
 if(section==='viewMode')str('property','View mode frontmatter property');
 if(section==='templates'){
  str('folder','Templates folder');
  str('dateFormat','Date format (e.g. YYYY-MM-DD)');
  str('timeFormat','Time format (e.g. HH:mm)');
  bool('applyOnCreate','Apply templates on note creation');
  bool('templateOnRename','Apply templates when a note is renamed to match');
  bool('caseSensitive','Case-sensitive title matching');
  new Setting(panel).setName('Original matching rules').setDesc('The first matching rule applies one template. When no rules exist, the previous exact-name lookup remains available.').setHeading();
  const container=panel.createDiv({cls:'writer-template-matcher-list'});
  const templates=plugin.app.vault.getMarkdownFiles().filter(file=>{
   const folder=String(cfg.folder||'Templates').replace(/^\/+|\/+$/g,'');
   return file.path.startsWith(folder+'/');
  }).sort((a,b)=>a.path.localeCompare(b.path));
  const render=()=>{
   container.empty();
   const matchers=cfg.matchers||(cfg.matchers=[]);
   for(let index=0;index<matchers.length;index++){
    const rule=matchers[index];
    const row=new Setting(container).setClass('writer-template-matcher');
    row.setName('Rule '+(index+1));
    row.addDropdown(d=>{
     for(const [key,label] of [['prefix','Starts with'],['contains','Contains'],['suffix','Ends with']])d.addOption(key,label);
     d.setValue(rule.matchMethod||'prefix').onChange(async value=>{rule.matchMethod=value;await plugin.saveSettings();});
    });
    row.addText(t=>t.setPlaceholder('Name fragment').setValue(rule.matchString||'').onChange(async value=>{rule.matchString=value;await plugin.saveSettings();}));
    row.addDropdown(d=>{
     d.addOption('','Select template');
     for(const file of templates)d.addOption(file.path,file.path);
     if(rule.templatePath&&!templates.some(f=>f.path===rule.templatePath))d.addOption(rule.templatePath,rule.templatePath+' (missing)');
     d.setValue(rule.templatePath||'').onChange(async value=>{rule.templatePath=value;await plugin.saveSettings();});
    });
    row.addExtraButton(b=>b.setIcon('trash').setTooltip('Delete rule').onClick(async()=>{
     matchers.splice(index,1);
     await plugin.saveSettings();render();
    }));
   }
  };
  new Setting(panel).setName('Add matching rule').addButton(b=>b.setButtonText('Add').setIcon('plus').onClick(async()=>{
   cfg.matchers.push({matchMethod:'prefix',matchString:'',templatePath:''});
   await plugin.saveSettings();render();
  }));
  render();
  new Setting(panel).setName('Legacy exact-name fallback').setDesc('If no matcher rules are configured, look for Templates/<note name>.md and apply it only when the note is empty.').addToggle(t=>t.setValue(cfg.onlyNew!==false).onChange(async value=>{cfg.onlyNew=value;await plugin.saveSettings();}));
 }
 if(section==='unicode'){
  new Setting(panel).setName('Unicode picker').addButton(b=>b.setButtonText('Search').onClick(()=>plugin.writerFinalFeatures.unicodePicker()));
  str('maxResults','Max results');
  new Setting(panel).setName('Offline Unicode index').setDesc('Download UnicodeData.txt from unicode.org once. Search works offline afterward.').addButton(b=>b.setButtonText('Download / update').onClick(async()=>{
   b.setDisabled(true).setButtonText('Downloading…');
   try{await plugin.writerFinalFeatures.downloadUnicode();}
   catch(e){new Notice('Unicode index: '+e.message);}
   finally{b.setDisabled(false).setButtonText('Download / update');}
  }));
 }
 if(section==='toc'){str('maxDepth','Max heading level');bool('numbered','Numbered table of contents');bool('folded','Start folded');}
 if(section==='tts'){
  new Setting(panel).setName('Voice engine').setDesc('System voices work offline. Edge online voices work even if Linux has no speech engine, but send the text to Microsoft and require internet.').addDropdown(d=>{
   d.addOption('system','System / offline (Web Speech)');
   d.addOption('edge','Microsoft Edge neural / online');
   d.setValue(cfg.engine||'system').onChange(async value=>{cfg.engine=value;plugin.writerFinalFeatures.stop();await plugin.saveSettings();});
  });
  new Setting(panel).setName('Allow online text processing').setDesc('OFF by default. When enabled and Edge is selected, the selected text or note is sent to Microsoft to generate speech. Edge Read Aloud is an unofficial, changeable service.').addToggle(t=>t.setValue(!!cfg.allowOnline).onChange(async value=>{cfg.allowOnline=value;if(!value)plugin.writerFinalFeatures.stop();await plugin.saveSettings();}));
  new Setting(panel).setName('Speech language').addDropdown(d=>{
   for(const [key,name] of [['auto','Auto'],['pt-BR','Português (Brasil)'],['pt-PT','Português (Portugal)'],['en-US','English (US)'],['en-GB','English (UK)'],['es-ES','Español'],['fr-FR','Français'],['de-DE','Deutsch'],['it-IT','Italiano'],['ja-JP','日本語'],['zh-CN','中文']])d.addOption(key,name);
   d.setValue(cfg.language).onChange(async value=>{cfg.language=value;await plugin.saveSettings();});
  });
  const system=plugin.writerFinalFeatures;
  panel.createEl('p',{text:system.systemSpeechStatus(),cls:'writer-tts-system-diagnostic dictionary-muted'});
  new Setting(panel).setName(writerUi('Voz do sistema','System voice')).setDesc(writerUi('As vozes dependem do WebView; talvez não estejam disponíveis no Android.','Voices depend on the WebView and might be unavailable on Android.')).addDropdown(d=>{
   d.selectEl?.addClass?.('writer-tts-voice-select');
   d.addOption('',writerUi('Voz padrão do sistema','System default'));
   for(const voice of system.systemVoices())d.addOption(voice.voiceURI,voice.name+' ('+voice.lang+')');
   d.setValue(cfg.voice||'').onChange(async value=>{cfg.voice=value;await plugin.saveSettings();});
  });
  new Setting(panel).setName(writerUi('Verificar vozes disponíveis','Check available voices')).addButton(b=>b.setButtonText(writerUi('Atualizar lista','Refresh list')).onClick(()=>system.refreshVoiceSelectors()));
  new Setting(panel).setName('Edge online voice').setDesc('High-quality online voices; independent of installed Linux voices.').addDropdown(d=>{
   d.addOption('','Auto by language');
   for(const [lang,voice] of Object.entries(WRITER_EDGE_VOICES))d.addOption(voice,lang+' · '+voice.split('-').slice(2).join('-'));
   d.setValue(cfg.edgeVoice||'').onChange(async value=>{cfg.edgeVoice=value;await plugin.saveSettings();});
  });
  bool('readSelection','Prefer selected text');
  str('maxCharacters','Maximum characters per playback');
  for(const [field,label,min,max,step] of [['rate','Speaking speed',.5,2,.1],['pitch','Pitch (system voice)',.5,2,.1],['volume','Volume (system voice)',0,1,.1]]){
   new Setting(panel).setName(label).addSlider(slider=>slider.setLimits(min,max,step).setValue(Number(cfg[field])).onChange(async value=>{cfg[field]=value;await plugin.saveSettings();}));
  }
  new Setting(panel).setName('Speech').addButton(b=>b.setButtonText('Read').onClick(()=>plugin.writerFinalFeatures.speakActive())).addButton(b=>b.setButtonText('Pause').onClick(()=>plugin.writerFinalFeatures.pause())).addButton(b=>b.setButtonText('Resume').onClick(()=>plugin.writerFinalFeatures.resume())).addButton(b=>b.setButtonText('Stop').onClick(()=>plugin.writerFinalFeatures.stop()));
  panel.createDiv({cls:'writer-tts-current-status',text:'Ready'});

 }
}
