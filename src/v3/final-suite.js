'use strict';
/* Independent small writing utilities. No upstream bundled files are copied. */
const WRITER_FINAL_DEFAULTS={
 abbreviations:{enabled:true,caseSensitive:false,entries:{"eg.":"for example","atm":"at the moment","imo":"in my opinion","w/":"with","w/o":"without","btw":"by the way","afaik":"as far as I know","rn":"right now","ily":"I love you"},expandAtWordBoundary:true},
 anotherName:{enabled:true,property:"another-name"},
 viewMode:{enabled:true,property:"prefer-view"},
 templates:{enabled:true,folder:"Templates",matchCase:false,onlyNew:true,applyOnCreate:true},
 unicode:{enabled:true,favorites:["—","…","«","»","“","”","•","→","←","✓","★","≈","≠","∞"],recent:[],maxResults:40},
 toc:{enabled:true,codeBlock:"insta-toc",maxDepth:6,folded:false,numbered:false},
 tts:{enabled:true,language:"auto",rate:1,pitch:1,volume:1,voice:"",readSelection:true,maxCharacters:12000}
};
function writerFinalMerge(plugin){
 const current=plugin.settings.finalSuite||{};
 for(const [key,defaults] of Object.entries(WRITER_FINAL_DEFAULTS)){
  current[key]={...defaults,...(current[key]||{})};
  if(key==='abbreviations')current[key].entries={...defaults.entries,...(current[key].entries||{})};
 }
 plugin.settings.finalSuite=current;
 return current;
}
class WriterFinalFeatures{
 constructor(plugin){this.plugin=plugin;this.timer=null;this.speaking=false;this.lastFile=null;}
 get cfg(){return this.plugin.settings.finalSuite;}
 register(){
  const p=this.plugin;
  p.registerEvent(p.app.workspace.on('layout-change',()=>this.refreshNames()));
  if(p.app.metadataCache?.on)p.registerEvent(p.app.metadataCache.on('changed',()=>this.refreshNames()));
  p.registerEvent(p.app.workspace.on('file-open',file=>{if(file){this.refreshNames();this.applyViewMode(file).catch(console.warn);}}));
  p.registerEvent(p.app.vault.on('create',file=>{if(file instanceof TFile&&file.extension==='md')this.applyTemplate(file).catch(e=>console.warn('[Basic AI] template:',e));}));
  if(EditorView.updateListener?.of)p.registerEditorExtension(EditorView.updateListener.of(update=>{
   if(!update.docChanged||!p.settings.finalSuite?.abbreviations?.enabled)return;
   if(this.expanding)return;
   let change=null;
   update.changes.iterChanges((fromA,toA,fromB,toB,inserted)=>{
    const value=inserted.toString();
    if(value.length===1&&/[\s.,!?;:]/.test(value))change={at:toB,character:value};
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
  if(p.app.workspace.iterateAllLeaves)this.refreshNames();
 }
 tryExpand(view,change){
  const config=this.cfg.abbreviations;if(!config?.enabled||this.expanding)return;
  const doc=view.state.doc.toString(),position=change.at;
  if(position<1||doc[position-1]!==change.character)return;
  const prefix=doc.slice(Math.max(0,position-160),position-1);
  const entries=Object.entries(config.entries||{}).filter(([k,v])=>k&&typeof v==='string'&&v);
  entries.sort((a,b)=>b[0].length-a[0].length);
  for(const [needle,replacement] of entries){
   const before=prefix.slice(-needle.length);
   if(config.caseSensitive?before!==needle:before.toLocaleLowerCase()!==needle.toLocaleLowerCase())continue;
   const start=position-1-needle.length;
   if(start>0&&/[\p{L}\p{N}_]/u.test(doc[start-1]))continue;
   this.expanding=true;
   view.dispatch({changes:{from:start,to:position-1,insert:replacement}});
   this.expanding=false;return;
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
 async applyTemplate(file,force=false){
  const cfg=this.cfg.templates;if(!cfg.enabled||(!force&&!cfg.applyOnCreate))return;
  const folder=String(cfg.folder||'Templates').replace(/^\/|\/$/g,'');
  if(file.path.startsWith(folder+'/'))return;
  const target=this.plugin.app.vault.getAbstractFileByPath(folder+'/'+file.basename+'.md');
  if(!(target instanceof TFile)||target.path===file.path)return;
  const current=await this.plugin.app.vault.read(file);
  if(cfg.onlyNew&&!force&&current.trim())return;
  const template=await this.plugin.app.vault.cachedRead(target);
  const rendered=template.replace(/\{\{title\}\}/gi,file.basename).replace(/\{\{date\}\}/gi,new Date().toISOString().slice(0,10));
  if(current.trim()&&!force)return;
  await this.plugin.app.vault.process(file,old=>old.trim()?old:rendered);
 }
 async applyTemplateToCurrent(){
  const file=this.plugin.app.workspace.getActiveFile();
  if(!(file instanceof TFile))return new Notice('Open a Markdown note.');
  await this.applyTemplate(file,true);
 }
 async insertToc(){
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view)return new Notice('Open a Markdown note.');
  view.editor.replaceSelection('\n'+String.fromCharCode(96,96,96)+'insta-toc\n'+String.fromCharCode(96,96,96)+'\n');
 }
 async renderToc(el,path){
  if(!this.cfg.toc.enabled)return;
  const file=this.plugin.app.vault.getAbstractFileByPath(path);
  if(!(file instanceof TFile))return;
  const text=await this.plugin.app.vault.cachedRead(file);
  const headings=[...text.matchAll(/^(#{1,6})[ \t]+(.+)$/gm)].filter(m=>m[1].length<=Number(this.cfg.toc.maxDepth||6));
  const list=el.createEl(this.cfg.toc.numbered?'ol':'ul',{cls:'writer-insta-toc'});
  for(const [,level,label] of headings){
   const li=list.createEl('li');
   li.style.marginInlineStart=((level.length-1)*12)+'px';
   const link=li.createEl('a',{text:label.replace(/[*_]+/g,''),href:'#'});
   link.addEventListener('click',e=>{
    e.preventDefault();
    const target=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const cache=this.plugin.app.metadataCache.getFileCache(file);
    const heading=cache?.headings?.find(h=>h.heading===label.replace(/[*_]+/g,''));
    if(target?.file?.path===file.path&&heading){target.editor.setCursor(heading.position.start);target.editor.scrollIntoView({from:heading.position.start,to:heading.position.end},true);}
   });
  }
 }
 async unicodePicker(){
  const config=this.cfg.unicode;
  const modal=new Modal(this.plugin.app);
  modal.onOpen=()=>{
   modal.setTitle('Unicode search');
   const input=modal.contentEl.createEl('input',{type:'search',placeholder:'Name, symbol or U+ code point'});
   input.style.width='100%';
   const results=modal.contentEl.createDiv({cls:'writer-unicode-results'});
   const builtins=[['Em dash','—'],['En dash','–'],['Ellipsis','…'],['Left guillemet','«'],['Right guillemet','»'],['Left double quote','“'],['Right double quote','”'],['Bullet','•'],['Arrow right','→'],['Arrow left','←'],['Check mark','✓'],['Star','★'],['Approximation','≈'],['Not equal','≠'],['Infinity','∞'],['Section','§'],['Degree','°'],['Copyright','©'],['Registered','®'],['Euro','€'],['Emoticon','☺']];
   const render=()=>{
    results.empty();
    const query=input.value.trim().toLocaleLowerCase();
    let values=[...new Set([...config.favorites,...config.recent,...builtins.map(x=>x[1])])];
    if(/^u\+[0-9a-f]{1,6}$/i.test(query)){
     const n=parseInt(query.slice(2),16);
     if(n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff))values.unshift(String.fromCodePoint(n));
    }
    const filtered=values.filter(c=>!query||c.includes(query)||builtins.find(x=>x[1]===c)?.[0].toLowerCase().includes(query)||c.codePointAt(0)?.toString(16).includes(query.replace('u+',''))).slice(0,config.maxResults||40);
    for(const char of filtered){
     const name=builtins.find(x=>x[1]===char)?.[0]||'Unicode';
     const button=results.createEl('button',{text:char+'  '+name+'  U+'+char.codePointAt(0).toString(16).toUpperCase()});
     button.addEventListener('click',()=>{
      const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if(view)view.editor.replaceSelection(char);
      else navigator.clipboard?.writeText(char);
      config.recent=[char,...config.recent.filter(x=>x!==char)].slice(0,30);
      this.plugin.saveSettings();modal.close();
     });
    }
   };
   input.addEventListener('input',render);render();input.focus();
  };
  modal.open();
 }
 async editAbbreviations(){
  const modal=new Modal(this.plugin.app),entries=this.cfg.abbreviations.entries;
  modal.onOpen=()=>{
   modal.setTitle('Abbreviations');
   const list=modal.contentEl.createDiv();
   const paint=()=>{
    list.empty();
    for(const [key,value] of Object.entries(entries)){
     new Setting(list).setName(key).setDesc(value).addExtraButton(b=>b.setIcon('trash').onClick(async()=>{delete entries[key];await this.plugin.saveSettings();paint();}));
    }
   };
   const row=new Setting(modal.contentEl);let key='',value='';
   row.addText(t=>t.setPlaceholder('Short form').onChange(v=>key=v));
   row.addText(t=>t.setPlaceholder('Expansion').onChange(v=>value=v));
   row.addButton(b=>b.setButtonText('Add').onClick(async()=>{if(!key.trim()||!value.trim())return;entries[key.trim()]=value;await this.plugin.saveSettings();paint();}));
   paint();
  };modal.open();
 }
 speakActive(){
  if(!this.cfg.tts.enabled)return new Notice('Enable text-to-speech in settings.');
  if(typeof speechSynthesis==='undefined')return new Notice('System speech synthesis is unavailable on this device.');
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view)return new Notice('Open a Markdown note.');
  const selected=view.editor.getSelection();
  const raw=selected&&this.cfg.tts.readSelection?selected:view.editor.getValue();
  const text=writerMaskMarkdown(raw).replace(/ +/g,' ').trim().slice(0,this.cfg.tts.maxCharacters||12000);
  if(!text)return new Notice('No readable text.');
  this.stop();
  const utterance=new SpeechSynthesisUtterance(text);
  const lang=this.cfg.tts.language;
  utterance.lang=lang==='auto'?(navigator.language||'pt-BR'):lang;
  utterance.rate=Number(this.cfg.tts.rate)||1;
  utterance.pitch=Number(this.cfg.tts.pitch)||1;
  utterance.volume=Number(this.cfg.tts.volume)||1;
  const voices=speechSynthesis.getVoices();
  const requested=voices.find(v=>v.voiceURI===this.cfg.tts.voice)||voices.find(v=>v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0,2)));
  if(requested)utterance.voice=requested;
  utterance.onend=()=>{this.speaking=false;};
  speechSynthesis.speak(utterance);this.speaking=true;
 }
 pause(){if(typeof speechSynthesis!=='undefined')speechSynthesis.pause();}
 resume(){if(typeof speechSynthesis!=='undefined')speechSynthesis.resume();}
 stop(){if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();this.speaking=false;}
};
function writerRenderFinalSettings(panel,plugin,section){
 const sectionMap={abbreviations:'Abbreviations',anotherName:'Another name',viewMode:'View mode',templates:'Templates by note name',unicode:'Unicode search',toc:'Instant TOC',tts:'Text to speech'};
 const cfg=plugin.settings.finalSuite[section];
 panel.createEl('h3',{text:sectionMap[section]||section});
 const bool=(field,label)=>new Setting(panel).setName(label).addToggle(t=>t.setValue(!!cfg[field]).onChange(async v=>{cfg[field]=v;await plugin.saveSettings();}));
 const str=(field,label)=>new Setting(panel).setName(label).addText(t=>t.setValue(String(cfg[field]??'')).onChange(async v=>{cfg[field]=v;await plugin.saveSettings();}));
 bool('enabled','Enabled');
 if(section==='abbreviations'){bool('caseSensitive','Case sensitive');bool('expandAtWordBoundary','Expand on punctuation or space');new Setting(panel).setName('Edit abbreviations').addButton(b=>b.setButtonText('Open').onClick(()=>plugin.writerFinalFeatures.editAbbreviations()));}
 if(section==='anotherName')str('property','Frontmatter property');
 if(section==='viewMode')str('property','View mode frontmatter property');
 if(section==='templates'){str('folder','Templates folder');bool('onlyNew','Only empty notes');bool('applyOnCreate','Apply when note is created');}
 if(section==='unicode'){new Setting(panel).setName('Unicode picker').addButton(b=>b.setButtonText('Search').onClick(()=>plugin.writerFinalFeatures.unicodePicker()));str('maxResults','Max results');}
 if(section==='toc'){str('maxDepth','Max heading level');bool('numbered','Numbered table of contents');}
 if(section==='tts'){
  str('language','Speech language (pt-BR, en-US, es-ES...)');
  bool('readSelection','Prefer selected text');
  for(const [field,label,min,max,step] of [['rate','Speaking speed',.5,2,.1],['pitch','Pitch',.5,2,.1],['volume','Volume',0,1,.1]]){
   new Setting(panel).setName(label).addSlider(s=>s.setLimits(min,max,step).setValue(Number(cfg[field])).onChange(async value=>{cfg[field]=value;await plugin.saveSettings();}));
  }
  new Setting(panel).setName('Speech').addButton(b=>b.setButtonText('Read').onClick(()=>plugin.writerFinalFeatures.speakActive())).addButton(b=>b.setButtonText('Pause').onClick(()=>plugin.writerFinalFeatures.pause())).addButton(b=>b.setButtonText('Stop').onClick(()=>plugin.writerFinalFeatures.stop()));
 }
}
