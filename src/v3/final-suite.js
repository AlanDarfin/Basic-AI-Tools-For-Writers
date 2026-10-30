'use strict';
/* Independent small writing utilities. No upstream bundled files are copied. */
const WRITER_FINAL_DEFAULTS={
 abbreviations:{enabled:true,entries:{"eg.":{value:"for example",isEnabled:true},"atm":{value:"at the moment",isEnabled:true},"imo":{value:"in my opinion",isEnabled:true},"w/":{value:"with",isEnabled:true},"w/o":{value:"without",isEnabled:true},"btw":{value:"by the way",isEnabled:true},"afaik":{value:"as far as I know",isEnabled:true},"rn":{value:"right now",isEnabled:true},"ily":{value:"I love you",isEnabled:true}},expandAtWordBoundary:false},
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
  const config=this.cfg.unicode;
  if(!config.enabled)return new Notice('Enable Unicode search in settings.');
  const modal=new Modal(this.plugin.app);
  const editor=this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
  const builtins=[['Em dash','—'],['En dash','–'],['Ellipsis','…'],['Left guillemet','«'],['Right guillemet','»'],['Left double quote','“'],['Right double quote','”'],['Bullet','•'],['Arrow right','→'],['Arrow left','←'],['Check mark','✓'],['Star','★'],['Approximation','≈'],['Not equal','≠'],['Infinity','∞'],['Section','§'],['Degree','°'],['Copyright','©'],['Registered','®'],['Euro','€'],['Smiley','☺']];
  modal.onOpen=async()=>{
   modal.setTitle('Unicode search');
   const input=modal.contentEl.createEl('input',{type:'search',placeholder:'Search character, Unicode name or U+XXXX'});
   input.setAttribute('aria-label','Search Unicode characters');input.style.width='100%';
   const status=modal.contentEl.createDiv({cls:'writer-unicode-status'});
   const results=modal.contentEl.createDiv({cls:'writer-unicode-results'});
   let index=[];
   try{index=await this.loadUnicodeIndex();}catch(e){status.setText('Local Unicode index unavailable: '+e.message);}
   if(!index.length){
    status.setText('Common symbols only. Download the full Unicode index in plugin settings.');
   }else status.setText(index.length+' indexed characters (offline).');
   let updateId=0;
   const show=(char,name,code)=>{
    const row=results.createDiv({cls:'writer-unicode-entry'});
    const button=row.createEl('button',{text:char+' '+name+' · U+'+code.toString(16).toUpperCase(),cls:'writer-unicode-insert'});
    button.setAttribute('aria-label','Insert '+name);
    button.addEventListener('click',()=>{
     if(editor)editor.replaceSelection(char);
     else if(navigator?.clipboard?.writeText)navigator.clipboard.writeText(char);
     config.recent=[char,...(config.recent||[]).filter(x=>x!==char)].slice(0,30);
     this.plugin.saveSettings();modal.close();
    });
    const favorite=row.createEl('button',{text:(config.favorites||[]).includes(char)?'★':'☆',cls:'writer-unicode-favorite'});
    favorite.setAttribute('aria-label','Toggle favorite '+name);
    favorite.addEventListener('click',()=>{
     config.favorites=(config.favorites||[]).includes(char)?config.favorites.filter(x=>x!==char):[...config.favorites,char];
     this.plugin.saveSettings();favorite.setText(config.favorites.includes(char)?'★':'☆');
    });
   };
   const render=()=>{
    results.empty();
    const q=input.value.trim().toLowerCase();
    const limit=Math.max(5,Math.min(150,Number(config.maxResults)||40));
    const matches=[];const seen=new Set();
    const add=(char,name,code)=>{if(!char||seen.has(char)||matches.length>=limit)return;seen.add(char);matches.push({char,name,code});};
    const fromCode=/^(?:u\+|0x)?([0-9a-f]{2,6})$/i.exec(q);
    if(fromCode){
     const code=Number.parseInt(fromCode[1],16);
     if(code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)){
      const char=String.fromCodePoint(code);
      add(char,index.find(x=>x.code===code)?.name||'Unicode character',code);
     }
    }
    const searchBuiltin=(char)=>{
     const named=builtins.find(x=>x[1]===char);
     const entry=index.find(x=>x.char===char);
     const name=entry?.name||named?.[0]||'Favorite';
     return {name,hex:char.codePointAt(0).toString(16)};
    };
    for(const char of [...new Set([...(config.favorites||[]),...(config.recent||[])])]){
     const {name,hex}=searchBuiltin(char);
     if(!q||name.toLowerCase().includes(q)||char.includes(q)||hex.includes(q.replace('u+','')))add(char,name,char.codePointAt(0));
    }
    for(const [name,char] of builtins)if(!q||name.toLowerCase().includes(q)||char.includes(q))add(char,name,char.codePointAt(0));
    if(q.length>=2)for(const entry of index){
     if(matches.length>=limit)break;
     if(entry.search.includes(q)||entry.hex.includes(q.replace('u+',''))||entry.char===q)add(entry.char,entry.name,entry.code);
    }
    for(const entry of matches)show(entry.char,entry.name,entry.code);
    if(!matches.length)results.createEl('p',{text:'No matching characters.'});
   };
   let queued=null;
   input.addEventListener('input',()=>{clearTimeout(queued);queued=setTimeout(render,110);});
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
 if(section==='abbreviations'){bool('expandAtWordBoundary','Expand on punctuation or space (instead of space only)');new Setting(panel).setName('Edit abbreviations').addButton(b=>b.setButtonText('Open').onClick(()=>plugin.writerFinalFeatures.editAbbreviations()));}
 if(section==='anotherName')str('property','Frontmatter property');
 if(section==='viewMode')str('property','View mode frontmatter property');
 if(section==='templates'){str('folder','Templates folder');bool('onlyNew','Only empty notes');bool('applyOnCreate','Apply when note is created');}
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
  new Setting(panel).setName('Speech language').addDropdown(d=>{
   for(const [key,name] of [['auto','Auto'],['pt-BR','Português (Brasil)'],['pt-PT','Português (Portugal)'],['en-US','English (US)'],['en-GB','English (UK)'],['es-ES','Español'],['fr-FR','Français'],['de-DE','Deutsch'],['it-IT','Italiano'],['ja-JP','日本語'],['zh-CN','中文']])d.addOption(key,name);
   d.setValue(cfg.language).onChange(async v=>{cfg.language=v;await plugin.saveSettings();});
  });
  const voices=typeof speechSynthesis!=='undefined'?speechSynthesis.getVoices():[];
  new Setting(panel).setName('System voice').setDesc('Available voices depend on your device. A Google voice can only be selected when installed.').addDropdown(d=>{
   d.addOption('','System default');
   for(const voice of voices)d.addOption(voice.voiceURI,voice.name+' ('+voice.lang+')');
   d.setValue(cfg.voice).onChange(async v=>{cfg.voice=v;await plugin.saveSettings();});
  });
  bool('readSelection','Prefer selected text');
  str('maxCharacters','Maximum characters per playback');
  for(const [field,label,min,max,step] of [['rate','Speaking speed',.5,2,.1],['pitch','Pitch',.5,2,.1],['volume','Volume',0,1,.1]]){
   new Setting(panel).setName(label).addSlider(s=>s.setLimits(min,max,step).setValue(Number(cfg[field])).onChange(async value=>{cfg[field]=value;await plugin.saveSettings();}));
  }
  new Setting(panel).setName('Speech').addButton(b=>b.setButtonText('Read').onClick(()=>plugin.writerFinalFeatures.speakActive())).addButton(b=>b.setButtonText('Pause').onClick(()=>plugin.writerFinalFeatures.pause())).addButton(b=>b.setButtonText('Stop').onClick(()=>plugin.writerFinalFeatures.stop()));
 }
}
