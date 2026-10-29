'use strict';
const {Plugin, ItemView, PluginSettingTab, Setting, Notice, MarkdownRenderer, MarkdownView, TFile, requestUrl} = require('obsidian');
const VIEW = 'offline-dictionary-view';
const DEFAULTS = {dictionaryFileName:'Dicionario.md', onlineMode:'ask', importMode:'confirm', ignoreAccents:true, onlineLanguage:'en', historyEnabled:false};
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
    this.results=root.createDiv({cls:'dictionary-results'});
    input.addEventListener('input',()=>this.search(input.value));
    this.input=input;
  }
  async search(query){
    const token=++this.sequence;this.results.empty();
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
    else this.results.createEl('button',{text:'Search online'}).addEventListener('click',()=>this.online(term,token));
  }
  async online(term,token){
    if(token!==this.sequence)return;
    this.results.empty();
    this.results.createEl('p',{text:'Searching online...'});
    try{
      const result=await this.plugin.lookupOnline(term);
      if(token!==this.sequence)return;
      this.results.empty();
      if(!result){this.results.createEl('p',{text:'No online definition found.'});return;}
      this.results.createEl('h3',{text:result.word});
      const list=this.results.createEl('ul');
      for(const definition of result.definitions)list.createEl('li',{text:definition});
      this.results.createEl('small',{text:'Source: Free Dictionary API (dictionaryapi.dev)'});
      this.results.createEl('br');
      this.results.createEl('button',{text:'Save to local dictionary'}).addEventListener('click',async()=>{
        try{await this.plugin.importEntry(result);new Notice('Word saved to local dictionary.');await this.search(term);}
        catch(err){new Notice('Could not save word: '+err.message);}
      });
      this.results.createEl('button',{text:'Open source website'}).addEventListener('click',()=>{
        window.open('https://en.wiktionary.org/wiki/'+encodeURIComponent(result.word),'_blank','noopener,noreferrer');
      });
    }catch(err){
      if(token!==this.sequence)return;
      this.results.empty();this.results.createEl('p',{text:'Online lookup failed. Check your connection.'});
      console.error('Offline Dictionary lookup:',err);
    }
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
    new Setting(el).setName('Online language').setDesc('Free Dictionary API currently supports selected languages; English is the default.').addDropdown(d=>{for(const [k,v] of Object.entries({en:'English',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',hi:'Hindi'}))d.addOption(k,v);d.setValue(this.plugin.settings.onlineLanguage).onChange(async v=>{this.plugin.settings.onlineLanguage=v;await this.plugin.saveSettings();});});
    el.createEl('p',{text:'Online definitions are imported only after you click Save. Existing entries are never overwritten.'});
  }
}
module.exports=class AlansOfflineDictionary extends Plugin{
  async onload(){
    this.settings=Object.assign({},DEFAULTS,await this.loadData());
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
    return {word:String(first.word||term).replace(/[\r\n#]/g,' ').trim(),definitions};
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
