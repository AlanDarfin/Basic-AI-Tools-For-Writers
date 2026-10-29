'use strict';
const {Plugin, ItemView, PluginSettingTab, Setting, Notice, MarkdownRenderer, MarkdownView, TFile, requestUrl} = require('obsidian');
const VIEW = 'offline-dictionary-view';
const DEFAULTS = {dictionaryFileName:'Dicionario.md', onlineMode:'ask', importMode:'confirm', ignoreAccents:true, onlineLanguage:'pt', historyEnabled:false,provider:'free',yomitanDictionaries:[]};
const normalize = (s, accents=true) => (accents ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,'') : s).toLocaleLowerCase().trim();
function parseDictionary(text) {
  const entries=[]; let word=null, lines=[];
  const flush=()=>{if(word) entries.push({word, markdown:('# '+word+'\n'+lines.join('\n')).trim()});};
  for(const line of text.split(/\r?\n/)){
    const heading=/^#\s+(.+?)\s*$/.exec(line);
    if(heading){flush();word=heading[1];lines=[];}
    else if(word){if(/^---+\s*$/.test(line)) continue;lines.push(line);}
  }
  flush();return entries;
}
class DictionaryView extends ItemView {
  constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.sequence=0;}
  getViewType(){return VIEW;}
  getDisplayText(){return 'Offline Dictionary';}
  getIcon(){return 'book-open';}
  async onOpen(){
    this.contentEl.empty();
    const root=this.contentEl.createDiv({cls:'dictionary-view-content'});
    const input=root.createEl('input',{attr:{type:'search',placeholder:'Search word...', 'aria-label':'Search dictionary'}});
    input.style.width='100%';
    const controls=root.createDiv({cls:'dictionary-controls'});controls.style.margin='10px 0';controls.style.display='flex';controls.style.flexWrap='wrap';controls.style.gap='6px';
    this.provider=controls.createEl('select',{attr:{'aria-label':'Dictionary provider'}});
    for(const [value,label] of [['free','Free Dictionary API'],['wiktionary','Wiktionary'],['yomitan','Yomitan (offline)']]){const opt=this.provider.createEl('option',{text:label,value});opt.value=value;}
    this.provider.value=this.plugin.settings.provider;
    this.provider.addEventListener('change',async()=>{this.plugin.settings.provider=this.provider.value;await this.plugin.saveSettings();});
    this.language=controls.createEl('select',{attr:{'aria-label':'Definition language'}});
    for(const [value,label] of Object.entries({pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italian',ja:'日本語'})){const opt=this.language.createEl('option',{text:label});opt.value=value;}
    this.language.value=this.plugin.settings.onlineLanguage;
    this.language.addEventListener('change',async()=>{this.plugin.settings.onlineLanguage=this.language.value;await this.plugin.saveSettings();});
    this.saveButton=controls.createEl('button',{text:'Save',attr:{'aria-label':'Save definition'}});this.saveButton.disabled=true;
    this.saveButton.addEventListener('click',async()=>{if(!this.pending)return;try{await this.plugin.importEntry(this.pending);new Notice('Saved to local dictionary');this.pending=null;this.saveButton.disabled=true;await this.search(this.input.value);}catch(e){new Notice(e.message);}});
    this.onlineButton=root.createEl('button',{text:'Search online / provider'});this.onlineButton.style.marginBottom='10px';
    this.onlineButton.addEventListener('click',()=>{const term=this.input.value.trim();if(term)this.online(term,this.sequence);else new Notice('Enter a word first');});
    this.onlineResults=root.createDiv({cls:'dictionary-online-results'});
    this.results=root.createDiv({cls:'dictionary-results'});
    input.addEventListener('input',()=>this.search(input.value));
    this.input=input;
  }
  async search(query){
    const token=++this.sequence;this.results.empty();this.onlineResults.empty();this.pending=null;this.saveButton.disabled=true;
    const term=query.trim();if(!term)return;
    const entries=await this.plugin.getEntries();
    if(token!==this.sequence)return;
    const norm=normalize(term,this.plugin.settings.ignoreAccents);
    const matches=entries.filter(e=>normalize(e.word,this.plugin.settings.ignoreAccents).includes(norm)).slice(0,50);
    if(matches.length){
      for(const entry of matches){
        if(token!==this.sequence)return;
        const el=this.results.createDiv({cls:'dictionary-entry'});
        await MarkdownRenderer.render(this.app,entry.markdown,el,this.plugin.dictionaryPath(),this);
      }
      return;
    }
    this.results.createEl('p',{text:'No local results found.'});
    if(this.plugin.settings.onlineMode==='off')return;
    if(this.plugin.settings.onlineMode==='auto')await this.online(term,token);
    // Manual provider search remains available regardless of fallback mode.
  }
  async online(term,token){
    if(token!==this.sequence)return;
    const target=this.onlineResults;target.empty();target.createEl('p',{text:'Searching selected provider...'});
    try{
      const result=await this.plugin.lookupProvider(term);
      if(token!==this.sequence)return;
      target.empty();this.pending=result;this.saveButton.disabled=!result;
      if(!result){target.createEl('p',{text:'No definition found from this provider.'});return;}
      target.createEl('h3',{text:result.word});
      const list=target.createEl('ul');for(const definition of result.definitions)list.createEl('li',{text:definition});
      target.createEl('small',{text:'Source: '+(result.source||this.plugin.settings.provider)});
    }catch(err){if(token!==this.sequence)return;target.empty();this.pending=null;this.saveButton.disabled=true;target.createEl('p',{text:'Lookup failed: '+err.message});console.error(err);}
  }
  async onClose(){this.sequence++;}
}
class DictionarySettings extends PluginSettingTab{
  constructor(app,plugin){super(app,plugin);this.plugin=plugin;}
  display(){
    const el=this.containerEl;el.empty();el.createEl('h2',{text:'Offline Dictionary'});
    new Setting(el).setName('Dictionary file').setDesc('Path relative to vault, or an exact file name.').addText(t=>t.setValue(this.plugin.settings.dictionaryFileName).onChange(async v=>{this.plugin.settings.dictionaryFileName=v.trim();this.plugin.invalidate();await this.plugin.saveSettings();}));
    new Setting(el).setName('Online fallback').addDropdown(d=>d.addOption('off','Offline only').addOption('ask','Ask before searching').addOption('auto','Search automatically').setValue(this.plugin.settings.onlineMode).onChange(async v=>{this.plugin.settings.onlineMode=v;await this.plugin.saveSettings();}));
    new Setting(el).setName('Ignore accents in search').addToggle(t=>t.setValue(this.plugin.settings.ignoreAccents).onChange(async v=>{this.plugin.settings.ignoreAccents=v;await this.plugin.saveSettings();}));
    new Setting(el).setName('Online language').setDesc('Select the language used for online definitions. Portuguese is the default for new installations.').addDropdown(d=>{for(const [k,v] of Object.entries({en:'English',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',hi:'Hindi'}))d.addOption(k,v);d.setValue(this.plugin.settings.onlineLanguage).onChange(async v=>{this.plugin.settings.onlineLanguage=v;await this.plugin.saveSettings();});});
    new Setting(el).setName('Dictionary provider').setDesc('Choose the source for manual searches and fallback.').addDropdown(d=>{for(const [k,v] of Object.entries({free:'Free Dictionary API',wiktionary:'Wiktionary',yomitan:'Yomitan (offline)'}))d.addOption(k,v);d.setValue(this.plugin.settings.provider).onChange(async v=>{this.plugin.settings.provider=v;await this.plugin.saveSettings();});});
    new Setting(el).setName('Import Yomitan ZIP').setDesc('Select a local Yomitan dictionary ZIP. Files are kept in plugin data, not in your Markdown dictionary.').addButton(b=>b.setButtonText('Choose ZIP').onClick(()=>{const input=document.createElement('input');input.type='file';input.accept='.zip,application/zip';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const count=await this.plugin.importYomitan(await file.arrayBuffer(),file.name);new Notice('Imported '+count+' Yomitan entries');this.display();}catch(e){new Notice('Import failed: '+e.message);}};input.click();}));
    for(const dict of this.plugin.settings.yomitanDictionaries||[]){new Setting(el).setName(dict.name).setDesc(dict.entries.length+' entries').addToggle(t=>t.setValue(dict.enabled!==false).onChange(async v=>{dict.enabled=v;await this.plugin.saveSettings();})).addButton(b=>b.setButtonText('Remove').onClick(async()=>{this.plugin.settings.yomitanDictionaries=this.plugin.settings.yomitanDictionaries.filter(d=>d!==dict);await this.plugin.saveSettings();this.display();}));}
    el.createEl('p',{text:'Online definitions are imported only after you click Save. Existing entries are never overwritten.'});
  }
}
module.exports=class AlansOfflineDictionary extends Plugin{
  async onload(){
    const saved=await this.loadData()||{};this.settings=Object.assign({},DEFAULTS,saved);
    this.cache={path:null,entries:[]};this.dirty=true;
    this.registerView(VIEW,leaf=>new DictionaryView(leaf,this));
    this.addSettingTab(new DictionarySettings(this.app,this));
    this.addRibbonIcon('book-open','Offline Dictionary',()=>this.activateView());
    this.addCommand({id:'open-dictionary-view',name:'Open Offline Dictionary',callback:()=>this.activateView()});
    this.addCommand({id:'search-selected-word',name:'Search selected word in dictionary',editorCallback:async editor=>{const term=editor.getSelection().trim();if(!term){new Notice('Select a word first.');return;}await this.activateView();const view=this.app.workspace.getLeavesOfType(VIEW)[0]?.view;if(view?.input){view.input.value=term;await view.search(term);}}});
    this.registerEvent(this.app.vault.on('modify',f=>{if(f.path===this.dictionaryPath())this.invalidate();}));
    this.registerEvent(this.app.vault.on('rename',()=>this.invalidate()));
    this.registerEvent(this.app.vault.on('delete',()=>this.invalidate()));
  }
  invalidate(){this.dirty=true;}
  dictionaryFile(){
    const name=this.settings.dictionaryFileName.trim();
    const exact=this.app.vault.getAbstractFileByPath(name);
    if(exact instanceof TFile&&exact.extension==='md')return exact;
    return this.app.vault.getMarkdownFiles().find(f=>f.name.toLocaleLowerCase()===name.toLocaleLowerCase())||null;
  }
  dictionaryPath(){return this.dictionaryFile()?.path||this.settings.dictionaryFileName;}
  async getEntries(){
    const file=this.dictionaryFile();if(!file)return [];
    if(!this.dirty&&this.cache.path===file.path)return this.cache.entries;
    const content=await this.app.vault.cachedRead(file);
    const entries=parseDictionary(content);
    this.cache={path:file.path,entries};this.dirty=false;return entries;
  }
  async lookupProvider(term){
    if(this.settings.provider==='yomitan'){
      const n=normalize(term,this.settings.ignoreAccents),defs=[];
      for(const d of this.settings.yomitanDictionaries||[]){if(d.enabled===false)continue;for(const e of d.entries){if(normalize(e.word,this.settings.ignoreAccents)===n)defs.push(...e.definitions);}}
      return defs.length?{word:term,definitions:[...new Set(defs)].slice(0,30),source:'Yomitan local'}:null;
    }
    if(this.settings.provider==='wiktionary'){
      const lang=this.settings.onlineLanguage;
      const url='https://'+encodeURIComponent(lang)+'.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&format=json&redirects=1&titles='+encodeURIComponent(term);
      const response=await requestUrl({url,throw:false});
      if(response.status!==200)throw new Error('Wiktionary HTTP '+response.status);
      const pages=response.json?.query?.pages||{};const page=Object.values(pages)[0];
      const extract=page?.extract?.trim();
      return extract?{word:term,definitions:[extract.slice(0,4000)],source:'Wiktionary ('+lang+')'}:null;
    }
    return this.lookupOnline(term);
  }
  async importYomitan(buffer,name){
    const bytes=new Uint8Array(buffer);if(bytes.length>30*1024*1024)throw new Error('ZIP exceeds 30 MB');
    const view=new DataView(buffer);let end=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(view.getUint32(i,true)===0x06054b50){end=i;break;}}
    if(end<0)throw new Error('Invalid ZIP');
    const count=view.getUint16(end+10,true);if(count>1000)throw new Error('Too many ZIP members');
    let offset=view.getUint32(end+16,true),total=0,entries=[];
    for(let i=0;i<count;i++){
      if(view.getUint32(offset,true)!==0x02014b50)throw new Error('Invalid central directory');
      const method=view.getUint16(offset+10,true),size=view.getUint32(offset+20,true),nlen=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true);
      const filename=new TextDecoder().decode(bytes.slice(offset+46,offset+46+nlen));const local=view.getUint32(offset+42,true);
      offset+=46+nlen+extra+comment;
      if(!/^term_bank_.*\.json$/.test(filename))continue;
      total+=size;if(total>70*1024*1024)throw new Error('Dictionary exceeds 70 MB uncompressed');
      if(view.getUint32(local,true)!==0x04034b50)throw new Error('Invalid ZIP member');
      const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
      let payload=bytes.slice(start,start+size);
      if(method===8){
        if(typeof DecompressionStream==='undefined')throw new Error('ZIP decompression is unavailable on this device');
        const stream=new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        payload=new Uint8Array(await new Response(stream).arrayBuffer());
      }else if(method!==0)throw new Error('Unsupported ZIP compression');
      const data=JSON.parse(new TextDecoder().decode(payload));
      if(!Array.isArray(data))continue;
      for(const row of data){
        if(!Array.isArray(row)||typeof row[0]!=='string')continue;
        const glossary=row[5];const definitions=[];
        const collect=v=>{if(typeof v==='string')definitions.push(v);else if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object'){if(v.type==='text'&&typeof v.text==='string')definitions.push(v.text);else if(v.type==='structured-content')collect(v.content);else if(v.content)collect(v.content);}};
        collect(glossary);if(definitions.length)entries.push({word:row[0],definitions:definitions.slice(0,15)});
        if(entries.length>150000)throw new Error('Too many dictionary entries');
      }
    }
    if(!entries.length)throw new Error('No supported term_bank definitions found');
    this.settings.yomitanDictionaries.push({name,enabled:true,entries});
    await this.saveSettings();return entries.length;
  }
  async lookupOnline(term){
    const language=this.settings.onlineLanguage;
    const url='https://api.dictionaryapi.dev/api/v2/entries/'+encodeURIComponent(language)+'/'+encodeURIComponent(term);
    const response=await requestUrl({url,throw:false});
    if(response.status===404)return null;
    if(response.status!==200)throw new Error('HTTP '+response.status);
    const data=response.json;if(!Array.isArray(data)||!data.length)return null;
    const first=data[0];
    const definitions=(first.meanings||[]).flatMap(m=>(m.definitions||[]).map(d=>d.definition)).filter(x=>typeof x==='string').slice(0,12);
    if(!definitions.length)return null;
    return {word:String(first.word||term).replace(/[\r\n#]/g,' ').trim(),definitions,source:'Free Dictionary API'};
  }
  async importEntry(result){
    const file=this.dictionaryFile();if(!file)throw new Error('Dictionary file not found');
    const norm=normalize(result.word,true);
    if((await this.getEntries()).some(e=>normalize(e.word,true)===norm))throw new Error('Word already exists');
    const content='\n\n---\n\n# '+result.word+'\n\n'+result.definitions.map(d=>'- '+d.replace(/\r?\n/g,' ')).join('\n')+'\n';
    await this.app.vault.process(file,old=>old.trimEnd()+content);
    this.invalidate();
  }
  async activateView(){
    let leaf=this.app.workspace.getLeavesOfType(VIEW)[0];
    if(!leaf){leaf=this.app.workspace.getRightLeaf(false);if(!leaf)return;await leaf.setViewState({type:VIEW,active:true});}
    await this.app.workspace.revealLeaf(leaf);
  }
  async saveSettings(){await this.saveData(this.settings);}
  onunload(){this.app.workspace.detachLeavesOfType(VIEW);}
};
