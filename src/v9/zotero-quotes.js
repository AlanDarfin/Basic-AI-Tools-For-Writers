'use strict';
/* 9.2.0 — Zotero-aware local literature index and homepage quote bridge.
 * Designed to read already imported Zotero Markdown/Better BibTeX exports.
 * No Zotero IPC or undocumented upstream plugin APIs are called. */
function writerV92ZoteroMerge(settings){
 const old=settings.v92Zotero&&typeof settings.v92Zotero==='object'?settings.v92Zotero:{};
 const cfg=settings.v92Zotero={enabled:true,folder:'',bibFile:'',quoteSource:'both',
  maxEntries:700,maxQuotes:350,includeBlockquotes:true,...old};
 cfg.enabled=cfg.enabled!==false;cfg.folder=String(cfg.folder||'').trim().replace(/^\/|\/$/g,'').slice(0,300);
 cfg.bibFile=String(cfg.bibFile||'').trim().slice(0,500);
 cfg.quoteSource=['manual','zotero','both'].includes(cfg.quoteSource)?cfg.quoteSource:'both';
 cfg.maxEntries=Math.max(30,Math.min(1500,Math.floor(Number(cfg.maxEntries)||700)));
 cfg.maxQuotes=Math.max(20,Math.min(700,Math.floor(Number(cfg.maxQuotes)||350)));
 cfg.includeBlockquotes=cfg.includeBlockquotes!==false;
 return cfg;
}
function writerV92ZoteroClean(raw,len=400){
 return String(raw||'').replace(/\{\{|\}\}/g,'').replace(/\{([^{}]+)\}/g,'$1')
  .replace(/<[^>]*>/g,'').replace(/[*_~]/g,'').replace(/\s+/g,' ').trim().slice(0,len);
}
function writerV92ZoteroKey(fm){
 const x=fm?.citekey||fm?.citationKey||fm?.citation_key||fm?.zoteroKey||fm?.zoteroItemKey||fm?.citation_key;
 return typeof x==='string'?x.replace(/^@/,'').trim().slice(0,120):'';
}
function writerV92ZoteroMeta(file,cache){
 const fm=cache?.frontmatter||{};
 const key=writerV92ZoteroKey(fm);
 const zoteroMark=typeof fm.zotero==='string'||typeof fm.zotero==='object'||Boolean(fm.zoteroUri||fm.zoteroItemKey||key);
 if(!zoteroMark)return null;
 const author=Array.isArray(fm.authors)?fm.authors.join(', '):fm.author||fm.creators||'';
 const title=fm.title||fm.reference||fm.bibliography||file.basename;
 const year=fm.year||fm.date||fm.publicationYear||'';
 const url=typeof fm.zoteroUri==='string'?fm.zoteroUri:
  typeof fm.url==='string'&&/^https:\/\//.test(fm.url)?fm.url:'';
 return {path:file.path,key,title:writerV92ZoteroClean(title,200),author:writerV92ZoteroClean(author,120),
  year:writerV92ZoteroClean(year,30),url,basename:file.basename};
}
function writerV92ZoteroExtract(raw,meta,max=8){
 const text=String(raw||'').slice(0,25000),quotes=[];
 const add=(value)=>{
  const cleaned=writerV92ZoteroClean(value,460);
  if(cleaned.length>=18&&!quotes.includes(cleaned))quotes.push(cleaned);
 };
 const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
 if(front){
  try{
   const fm=parseYaml(front[1])||{};
   const quoteFields=[fm.quote,fm.quotation,fm.highlight,fm.excerpt,fm.quotes,fm.highlights,fm.annotations];
   const parse=(value)=>{
    if(Array.isArray(value))for(const x of value.slice(0,20))parse(x);
    else if(typeof value==='string')add(value);
    else if(value&&typeof value==='object')parse(value.text||value.quote||value.annotationText||value.content);
   };
   for(const field of quoteFields)parse(field);
  }catch(_){}
 }
 const block=text.replace(/^---[\s\S]*?---\s*/,'');
 for(const line of block.split(/\r?\n/)){
  const m=/^\s*>\s*(?!\[!)(.+)/.exec(line);
  if(m)add(m[1]);
  if(quotes.length>=max)break;
 }
 return quotes.slice(0,max).map(quote=>({quote,author:meta.author||meta.title||'',path:meta.path,key:meta.key,title:meta.title}));
}
function writerV92ZoteroBibEntries(text,limit=700){
 const entries=[];
 // Tolerant single-line field extraction; does not claim full BibTeX grammar support.
 const rx=/@([A-Za-z]+)\s*\{\s*([^,\s{}]+)\s*,/g;
 let m;
 while((m=rx.exec(String(text||'').slice(0,2e6)))&&entries.length<limit){
  const start=rx.lastIndex;let depth=1,end=start,quoted=false;
  for(let i=start;i<Math.min(text.length,start+30000);i++){
   const ch=text[i];
   if(ch==='{'&&!quoted)depth++;
   if(ch==='}'&&!quoted){depth--;if(depth===0){end=i;break;}}
   if(ch==='"'&&text[i-1]!=='\\')quoted=!quoted;
  }
  if(!end)break;
  const body=text.slice(start,end),field=key=>{
   const found=new RegExp('(?:^|[,\\n])\\s*'+key+'\\s*=\\s*(?:\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}|"([^"]*)"|([^,\\n]+))','i').exec(body);
   return writerV92ZoteroClean(found?.[1]||found?.[2]||found?.[3]||'',250);
  };
  entries.push({key:m[2].slice(0,120),title:field('title')||m[2],author:field('author'),year:field('year')||field('date'),url:field('url'),path:'',basename:m[2]});
  rx.lastIndex=end+1;
 }
 return entries;
}
function writerV92ZoteroQuoteChoices(plugin){
 const settings=plugin.settings.v92Zotero;
 if(!settings?.enabled||settings.quoteSource==='manual'||!writerModuleOn(plugin,'zotero'))return [];
 return Array.isArray(plugin.writerV92Zotero?.quotes)?plugin.writerV92Zotero.quotes.map(x=>[x.quote,x.author,x.path,x.title]):[];
}
function writerV92ZoteroQuotesForHome(plugin){
 const manual=writerV8HomeQuoteChoices(plugin.settings.v8Finish.homeQuotes);
 const cfg=plugin.settings.v92Zotero;
 if(!cfg?.enabled||!writerModuleOn(plugin,'zotero'))return manual;
 const imported=writerV92ZoteroQuoteChoices(plugin);
 if(cfg.quoteSource==='manual')return manual;
 if(cfg.quoteSource==='zotero')return imported.length?imported:manual;
 return imported.length?[...manual,...imported]:manual;
}
class WriterV92Zotero{
 constructor(plugin){this.plugin=plugin;this.entries=[];this.quotes=[];this.timer=null;this.epoch=0;}
 get cfg(){return this.plugin.settings.v92Zotero;}
 inScope(file){
  const prefix=this.cfg.folder;
  return !prefix||file.path.startsWith(prefix+'/');
 }
 async index(){
  const id=++this.epoch,plugin=this.plugin;
  if(!this.cfg.enabled||!writerModuleOn(plugin,'zotero')){this.entries=[];this.quotes=[];return;}
  const docs=(plugin.app.vault.getMarkdownFiles?.()||[]).filter(file=>this.inScope(file)).slice(0,this.cfg.maxEntries);
  const entries=[],quotes=[];
  for(const file of docs){
   if(id!==this.epoch)return;
   const meta=writerV92ZoteroMeta(file,plugin.app.metadataCache?.getFileCache?.(file));
   if(!meta)continue;
   entries.push(meta);
   if(quotes.length>=this.cfg.maxQuotes)continue;
   try{
    const note=await plugin.app.vault.cachedRead(file);
    quotes.push(...writerV92ZoteroExtract(note,meta,Math.min(12,this.cfg.maxQuotes-quotes.length)));
   }catch(_){}
  }
  if(this.cfg.bibFile){
   const bib=plugin.app.vault.getAbstractFileByPath(this.cfg.bibFile);
   if(bib instanceof TFile&&/\.bib$/i.test(bib.path)){
    try{
     const content=await plugin.app.vault.cachedRead(bib);
     const indexed=new Set(entries.map(e=>e.key).filter(Boolean));
     for(const row of writerV92ZoteroBibEntries(content,this.cfg.maxEntries)){
      if(!indexed.has(row.key)){entries.push(row);indexed.add(row.key);}
     }
    }catch(_){}
   }
  }
  if(id!==this.epoch)return;
  this.entries=entries;this.quotes=quotes.slice(0,this.cfg.maxQuotes);
  this.refreshHomepage();
 }
 refreshHomepage(){
  for(const leaf of this.plugin.app.workspace.getLeavesOfType?.(WRITER_V8_HOME_VIEW)||[]){
   if(!leaf.view)continue;
   leaf.view.homeQuote=null;
   leaf.view.render?.();
  }
 }
 schedule(){
  clearTimeout(this.timer);
  this.timer=setTimeout(()=>{this.timer=null;void this.index().catch(e=>console.warn('[Basic AI] Zotero index:',e));},500);
 }
 async chooseCitation(editor){
  if(!this.entries.length)await this.index();
  const entries=this.entries.filter(x=>x.path||x.key);
  if(!entries.length)return void new Notice(writerUi(
   'Nenhuma referência local encontrada. Importe notas do Zotero ou indique um arquivo BibTeX.',
   'No local references found. Import Zotero notes or configure a BibTeX file.'
  ));
  const app=this.plugin.app;
  class Picker extends FuzzySuggestModal{
   constructor(){super(app);this.setPlaceholder(writerUi('Pesquisar referência Zotero','Search Zotero reference'));}
   getItems(){return entries;}
   getItemText(item){return (item.author?item.author+' — ':'')+item.title+(item.year?' ('+item.year+')':'')+(item.key?' @'+item.key:'');}
   onChooseItem(item){
    const value=item.key?'[@'+item.key+']':item.path?'[['+item.path.replace(/\.md$/i,'')+']]':'';
    if(value)editor.replaceSelection(value);
   }
  }new Picker().open();
 }
 register(){
  const plugin=this.plugin;
  plugin.addCommand({id:'v92-insert-zotero-citation',name:writerUi('Zotero: inserir citação da biblioteca local','Zotero: insert citation from local library'),
   editorCallback:editor=>void this.chooseCitation(editor)});
  plugin.addCommand({id:'v92-reindex-zotero',name:writerUi('Zotero: atualizar referências e citações','Zotero: refresh references and quotes'),
   callback:()=>void this.index()});
  plugin.registerMarkdownCodeBlockProcessor('zotero',(source,el,ctx)=>this.renderReferences(source,el,ctx));
  plugin.registerMarkdownCodeBlockProcessor('bibliography',(source,el,ctx)=>this.renderReferences(source,el,ctx));
  if(typeof plugin.app.metadataCache?.on==='function')
   plugin.registerEvent(plugin.app.metadataCache.on('changed',()=>this.schedule()));
  for(const event of ['create','modify','delete','rename'])
   plugin.registerEvent(plugin.app.vault.on(event,file=>{
    if(event!=='modify'||file?.extension==='md'||file?.path===this.cfg.bibFile)this.schedule();
   }));
  plugin.app.workspace.onLayoutReady?.(()=>this.schedule());
  plugin.register?.(()=>{clearTimeout(this.timer);this.epoch++;});
 }
 renderReferences(source,el,ctx){
  if(!this.cfg.enabled||!writerModuleOn(this.plugin,'zotero'))return;
  const data=writerV92Yaml(source);
  const keys=Array.isArray(data.keys)?data.keys:
   String(data.keys||data.citekeys||'').split(/[,\s]+/).filter(Boolean);
  const wanted=keys.length?new Set(keys.map(x=>String(x).replace(/^@/,''))):null;
  const entries=this.entries.filter(x=>!wanted||wanted.has(x.key)).slice(0,150);
  const root=el.createDiv({cls:'writer-v92-zotero-bibliography'});
  if(!entries.length)root.createEl('p',{cls:'dictionary-muted',text:writerUi('Nenhuma referência indexada.','No indexed references.')});
  const list=root.createEl('ol');
  for(const ref of entries){
   const row=list.createEl('li');
   const title=[ref.author,ref.year?'('+ref.year+')':'',ref.title].filter(Boolean).join('. ');
   if(ref.path){
    const link=row.createEl('a',{text:title||ref.key,attr:{href:ref.path,'data-href':ref.path,class:'internal-link'}});
    link.addEventListener('click',e=>{
     e.preventDefault();void this.plugin.app.workspace.openLinkText(ref.path,ctx.sourcePath,false);
    });
   }else row.createSpan({text:title||ref.key});
   if(ref.key)row.createEl('small',{text:' @'+ref.key});
  }
 }
}
function writerV92ZoteroRegister(plugin){
 plugin.writerV92Zotero=new WriterV92Zotero(plugin);
 plugin.writerV92Zotero.register();
}
function writerV92ZoteroSettings(plugin,panel){
 const cfg=plugin.settings.v92Zotero;
 panel.createEl('h3',{text:writerUi('Zotero e citações','Zotero & citations')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Lê referências importadas como notas Markdown do Zotero ou um arquivo BibTeX do cofre. Não acessa diretamente o banco de dados do Zotero. Os destaques e citações podem alimentar o widget de citações da homepage.',
  'Reads references imported as Zotero Markdown notes or a vault BibTeX file. Does not access Zotero’s database directly. Highlights and quotations can feed the homepage quote widget.'
 )});
 const save=async()=>{await plugin.saveSettings();plugin.writerV92Zotero?.schedule();};
 new Setting(panel).setName(writerUi('Ativar integração de referências','Enable reference integration'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await save();}));
 new Setting(panel).setName(writerUi('Pasta das notas Zotero','Zotero notes folder'))
  .setDesc(writerUi('Vazio: procura propriedades Zotero no cofre inteiro.','Blank: find Zotero properties throughout the vault.'))
  .addText(t=>t.setPlaceholder('References/Zotero').setValue(cfg.folder).onChange(async v=>{cfg.folder=v.trim();await save();}));
 new Setting(panel).setName(writerUi('Arquivo BibTeX opcional','Optional BibTeX file'))
  .addText(t=>t.setPlaceholder('References/library.bib').setValue(cfg.bibFile).onChange(async v=>{cfg.bibFile=v.trim();await save();}));
 new Setting(panel).setName(writerUi('Origem das citações da homepage','Homepage quote source'))
  .addDropdown(d=>{
   for(const [value,pt,en] of [['manual','Apenas citações manuais','Manual quotes only'],
    ['zotero','Preferir Zotero','Prefer Zotero'],
    ['both','Misturar Zotero e citações manuais','Mix Zotero and manual quotes']])d.addOption(value,writerUi(pt,en));
   d.setValue(cfg.quoteSource).onChange(async v=>{cfg.quoteSource=v;await save();});
  });
 new Setting(panel).setName(writerUi('Usar trechos em bloco de citação','Index Markdown blockquotes'))
  .addToggle(t=>t.setValue(cfg.includeBlockquotes).onChange(async v=>{cfg.includeBlockquotes=v;await save();}));
 new Setting(panel).setName(writerUi('Reindexar biblioteca','Reindex library'))
  .addButton(b=>b.setButtonText(writerUi('Atualizar citações','Refresh quotes')).onClick(()=>void plugin.writerV92Zotero?.index()));
 const count=plugin.writerV92Zotero;
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Referências: ','References: ')+(count?.entries?.length||0)+
  ' · '+writerUi('Trechos: ','Quotes: ')+(count?.quotes?.length||0)});
}
