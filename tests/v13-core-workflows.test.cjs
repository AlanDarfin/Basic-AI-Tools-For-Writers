'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('main.js','utf8');

class Element{
 constructor(tag='div',options={},parent=null){
  this.tag=tag;
  this.text=options.text||'';
  this.attrs=options.attr||{};
  this.parent=parent;
  this.children=[];
  this.style={};
  this.value='';
  this.listeners=new Map();
  const classes=new Set((options.cls||'').split(/\s+/).filter(Boolean));
  this.classList={
   add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),
   toggle:(name,on)=>on?classes.add(name):classes.delete(name)
  };
 }
 createEl(tag,options){const el=new Element(tag,options,this);this.children.push(el);return el;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 empty(){this.children=[];this.text='';}
 setText(text){this.empty();this.text=text;}
 setAttribute(name,value){this.attrs[name]=value;}
 addClass(name){this.classList.add(name);}
 addEventListener(name,fn){this.listeners.set(name,fn);}
 fire(name,event={}){return this.listeners.get(name)?.(event);}
 remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
 insertBefore(node,target){this.children=this.children.filter(child=>child!==node);this.children.splice(this.children.indexOf(target),0,node);}
 descendants(){return this.children.flatMap(child=>[child,...child.descendants()]);}
 querySelectorAll(selector){return this.descendants().filter(el=>el.classList.contains(selector.slice(1)));}
 findText(text){return this.descendants().find(el=>el.text===text);}
}

class Setting{
 constructor(parent){this.row=parent.createDiv({cls:'setting-item'});}
 setName(value){this.row.createEl('strong',{text:value});return this;}
 setDesc(value){this.row.createEl('p',{text:value});return this;}
 addButton(register){
  const button=this.row.createEl('button');
  const control={setButtonText:text=>{button.setText(text);return control;},
   setTooltip:()=>control,onClick:callback=>button.addEventListener('click',callback)};
  register(control);return this;
 }
 addToggle(register){
  const control={setValue:()=>control,onChange:()=>control};
  register(control);return this;
 }
}

class TFile{
 constructor(path){
  this.path=path;this.name=path.split('/').at(-1);
  this.extension=this.name.split('.').at(-1);
  this.basename=this.name.slice(0,-this.extension.length-1);
  this.parent={path:path.includes('/')?path.slice(0,path.lastIndexOf('/')):'/'};
 }
}

function runtime(locale='en'){
 const notices=[],timers=new Map();
 let timerId=0;
 let reply=async()=>{throw Error('Unexpected request');};
 const Base=class {};
 const obsidian={
  Plugin:Base,PluginSettingTab:Base,Setting,TFile,TFolder:Base,Modal:Base,
  FuzzySuggestModal:Base,EditorSuggest:Base,MarkdownView:Base,Menu:Base,
  ItemView:class{constructor(leaf){this.app=leaf.app;this.contentEl=new Element();}},
  Notice:class{constructor(message){notices.push(message);}},
  MarkdownRenderer:{render:async(_app,value,el)=>el.setText(value)},
  setIcon:(el,icon)=>{el.icon=icon;},
  requestUrl:options=>reply(options),
  getLanguage:()=>locale,parseYaml:()=>({}),stringifyYaml:()=>''
 };
 const state={StateField:{define:()=>({})},StateEffect:{define:()=>({of:value=>value})}};
 const view={Decoration:{none:{map:()=>({})},set:()=>({}),mark:()=>({range:()=>({})})},
  EditorView:{decorations:{from:()=>({})}},ViewPlugin:{fromClass:()=>({})}};
 const context={module:{exports:{}},console,URL,URLSearchParams,
  setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},
  clearTimeout:id=>timers.delete(id),
  require:id=>{if(id==='obsidian')return obsidian;if(id==='@codemirror/state')return state;
   if(id==='@codemirror/view')return view;throw Error('Unexpected module '+id);}
 };
 vm.runInNewContext(source+'\nmodule.exports.test={DictionaryView,DEFAULTS,parseDictionary,writerV13TranslationPlan,writerV13Connection,writerV13RenderStart,writerRenderModuleSettings,writerActiveEditor,writerSafeReplace,writerMaskMarkdown};',context);
 const Plugin=context.module.exports;
 const files=new Map(),data=new Map(),writes=[];
 const add=(path,text)=>{const file=new TFile(path);files.set(path,file);data.set(path,text);return file;};
 const plugin=new Plugin();
 plugin.settings={...Plugin.test.DEFAULTS,aiKeys:{openai:'test-key',gemini:'test-other-key'},
  aiModels:{},prompts:{},visibleModules:{chat:false},writerV4:{protectMarkdown:true}};
 plugin.saveSettings=async()=>{};
 plugin.app={
  workspace:{getActiveFile:()=>null,getLeavesOfType:()=>[]},
  vault:{
   getAbstractFileByPath:path=>files.get(path)||null,
   getMarkdownFiles:()=>[...files.values()],
   cachedRead:async file=>data.get(file.path),
   read:async file=>data.get(file.path),
   create:async(path,text)=>{
    if(files.has(path))throw Error('Already exists');
    writes.push(path);return add(path,text);
   },
   process:async(file,transform)=>{
    const before=data.get(file.path);
    const after=transform(before);
    if(after!==before){writes.push(file.path);data.set(file.path,after);}
   }
  }
 };
 const viewInstance=new Plugin.test.DictionaryView({app:plugin.app},plugin);
 plugin.activateView=async()=>viewInstance;
 return {
  plugin,view:viewInstance,api:Plugin.test,add,data,writes,notices,
  reply:fn=>{reply=fn;},
  flushTimers:async()=>{
   const pending=[...timers.values()];
   timers.clear();
   for(const fn of pending)fn();
   await new Promise(resolve=>setImmediate(resolve));
  }
 };
}

test('General links directly to connections and hidden modules, and module search retains its query',()=>{
 const {api,plugin}=runtime();
 const panel=new Element();
 const sections=[];
 plugin.settings.aiKeys={};
 api.writerV13RenderStart(plugin,panel,id=>sections.push(id));
 assert.ok(panel.findText('Get started'));
 panel.findText('Dictionary and definitions').parent.findText('Connection').fire('click');
 panel.findText('Writing assistant').parent.findText('Configure').fire('click');
 assert.deepEqual(sections,['providers','modules']);
 assert.equal(plugin.writerV131AISelected,'openai');
 const modules=new Element();
 api.writerRenderModuleSettings(plugin,modules);
 const search=modules.querySelectorAll('.writer-v13-module-filter')[0];
 search.value='revisão languagetool';search.fire('input');
 const shown=modules.querySelectorAll('.writer-v13-module-row').filter(row=>!row.hidden);
 assert.equal(shown.length,1);
 assert.ok(shown[0].findText('Review & LanguageTool'));
 const rerendered=new Element();api.writerRenderModuleSettings(plugin,rerendered);
 assert.equal(rerendered.querySelectorAll('.writer-v13-module-filter')[0].value,search.value);
});

test('typing and provider changes search saved definitions without sending text',async()=>{
 const env=runtime(),{plugin,view,writes}=env;
 env.add('Dicionario.md','# Preação\nBefore action\n\n# Ação\nA deed.');
 let calls=0;
 plugin.lookupAI=async(word,mode)=>{calls++;return {word,definitions:[mode+' from provider']};};
 await view.onOpen();
 view.input.value='acao';
 view.input.fire('input');
 await env.flushTimers();
 assert.equal(calls,0);
 assert.ok(view.results.findText('Local entries · Ação'));
 view.provider.value='gemini';
 view.provider.fire('change');
 assert.equal(calls,0);
 await plugin.runSelectionAction('AÇÃO','definition');
 assert.equal(calls,0,'exact local result is enough with Chat disabled');
 view.input.value='caminho';
 await view.lookup();
 assert.equal(calls,1);
 assert.equal(writes.length,0,'online lookup is read only');
 await view.output.findText('Save definition').fire('click');
 assert.deepEqual(writes,['Dicionario.md']);
 assert.match(env.data.get('Dicionario.md'),/# caminho\n\ndefinition from provider/);
});

test('Basic AI sidebar keeps named icon tabs and excludes modules that are off',async()=>{
 const {plugin,view}=runtime();
 await view.onOpen();
 const strip=view.contentEl.querySelectorAll('.writer-sidebar-tabs')[0];
 assert.equal(strip.attrs.role,'tablist');
 assert.ok(view.contentEl.querySelectorAll('.writer-tools-launcher')[0].children.some(el=>el.icon==='wrench'));
 assert.deepEqual(strip.children.map(tab=>[tab.attrs['aria-label'],tab.children[0].icon]),[
  ['Definitions','book-open'],['Translation','languages'],['Chat','messages-square'],['Review','spell-check']
 ]);
 assert.equal(view.tabs.chat.hidden,true);
 assert.equal(view.tabs.definition.attrs['aria-selected'],'true');
 assert.equal(view.tabs.definition.tabIndex,0);
 assert.equal(view.panels.definition.attrs['aria-labelledby'],view.tabs.definition.attrs.id);
 assert.deepEqual(view.panels.definition.querySelectorAll('.writer-sidebar-icon-action').map(button=>button.children[0].icon),['search','equal','equal-not']);
 view.tabs.translation.fire('click');
 assert.equal(view.tabs.translation.attrs['aria-selected'],'true');
 assert.equal(view.tabs.definition.tabIndex,-1);
 plugin.settings.visibleModules.translation=false;
 view.applyModuleVisibility();
 assert.equal(view.activeTab,'definition');
 assert.equal(view.tabs.translation.hidden,true);
 for(const module of ['dictionary','review'])plugin.settings.visibleModules[module]=false;
 view.applyModuleVisibility();
 assert.equal(view.activeTab,null);
 assert.ok(strip.children.every(tab=>tab.hidden&&tab.tabIndex===-1));
});

test('dictionary creation is explicit and append rechecks duplicates against the latest note',async()=>{
 const {plugin,data,writes,api}=runtime();
 assert.deepEqual(Array.from(await plugin.getEntries()),[]);
 const entry={word:'Coração',definitions:['A feeling.\n\n## Example\nA kind heart.']};
 assert.equal(await plugin.upsertEntry(entry),true);
 assert.deepEqual(writes,['Dicionario.md']);
 const first=data.get('Dicionario.md');
 assert.equal(await plugin.upsertEntry({...entry,word:'CORACAO'}),false);
 assert.equal(data.get('Dicionario.md'),first);
 const fenced=['# First','~~~md','# Not an entry','---','~~~','# Second','Meaning'].join('\n');
 assert.deepEqual(Array.from(api.parseDictionary(fenced),item=>item.word),['First','Second']);
});

test('selected translation follows the translator provider even with Chat disabled',async()=>{
 const env=runtime(),{plugin,view}=env;
 plugin.settings.translationProvider='gemini';
 plugin.settings.targetLanguage='en';
 let sent;
 env.reply(async options=>{
  sent=options;
  return {status:200,json:{candidates:[{content:{parts:[{text:'A deed'}]}}]}};
 });
 await view.onOpen();
 await plugin.runSelectionAction('Uma ação','translate');
 assert.equal(view.activeTab,'translation');
 assert.match(sent.url,/generativelanguage/);
 assert.equal(JSON.parse(sent.body).contents[0].parts[0].text,'Uma ação');
 assert.ok(view.translationOutput.findText('A deed'));
});

test('a second definition action on the same word supersedes the first',async()=>{
 const {plugin,view}=runtime();
 await view.onOpen();
 const reads=[];
 plugin.getEntries=()=>new Promise(resolve=>reads.push(resolve));
 const lookups=[];
 plugin.lookupAI=async(word,mode)=>{lookups.push(mode);return {word,definitions:[mode]};};
 const first=plugin.runSelectionAction('ação','definition');
 await new Promise(resolve=>setImmediate(resolve));
 const second=plugin.runSelectionAction('ação','synonyms');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(reads.length,2);
 reads[0]([]);
 await first;
 reads[1]([]);
 await second;
 assert.deepEqual(lookups,['synonyms']);
});

test('connection checks describe missing local configuration and use the route model',()=>{
 const {api,plugin}=runtime();
 const custom={...plugin.settings,customEndpoint:'http://localhost/test',aiKeys:{custom:'test-key'}};
 assert.match(api.writerV13Connection(custom,'custom','test').problem,/endpoint/);
 custom.customEndpoint='https://example.test/v1/chat/completions';
 assert.equal(api.writerV13Connection(custom,'custom','test').section,'models');
 const settings={...plugin.settings,assistantProvider:'gemini',assistantModel:'assistant-model',
  reviewProvider:'openai',aiModels:{openai:'review-provider-model'}};
 assert.equal(api.writerV13Connection(settings,'openai','review').model,'review-provider-model');
 assert.equal(api.writerV13Connection(settings,'gemini','writing').model,'assistant-model');
});

test('Markdown translation preserves fences, CRLF boundaries and literal markers',()=>{
 const {api}=runtime();
 const code='~~~~md\r\n'+('Secret code\r\n'.repeat(370))+'~~~\r\n# Protected\r\n~~~~';
 const input='---\r\ntitle: Private\r\n---\r\n\r\n'+
  ('Chapter line with emoji 😀.\r\n\r\n'.repeat(20))+code+
  '\r\n\r\n[[Chapter]] and a literal ⟦BASIC_KEEP_0_0⟧.\r\n';
 const plan=api.writerV13TranslationPlan(input,true,128);
 const plain=plan.parts.map(part=>part.text).join('');
 assert.ok(!plain.includes('Private')&&!plain.includes('Secret code')&&!plain.includes('[[Chapter]]'));
 assert.ok(plan.parts.every(part=>part.raw.length<=128));
 assert.equal(plan.parts.map(part=>part.text?plan.restore(part,part.text):part.raw).join(''),input);
 const protectedPart=plan.parts.find(part=>part.text.includes('⟦BASIC_KEEP_1_'));
 assert.throws(()=>plan.restore(protectedPart,'Missing marker'),/protected Markdown marker/);
});

test('translation keeps full Markdown links and code spans out of provider input',()=>{
 const {api}=runtime();
 const inlineCode='`` private `command` text ``';
 const angleLink='[Folder [draft]](<Vault folder/file).md> "a title with )")';
 const nestedLink=String.raw`[Link \[draft\]](https://example.test/a_(b(c))/keep\).md 'another ) title')`;
 const imageLink='[![Cover](cover.png)](https://example.test/book_(1)/chapter)';
 const input=['Read',inlineCode,angleLink,nestedLink,imageLink,'today.'].join(' ');
 const plan=api.writerV13TranslationPlan(input);
 assert.equal(plan.parts.length,1);
 const [part]=plan.parts;
 assert.equal(part.text.replace(/⟦BASIC_KEEP_0_\d+⟧/g,'marker'),'Read marker marker marker marker today.');
 const translated=part.text.replace('Read','Leia').replace('today.','hoje.');
 assert.equal(plan.restore(part,translated),input.replace('Read','Leia').replace('today.','hoje.'));
});

test('file translation uses a single settings snapshot and writes the final copy only',async()=>{
 const env=runtime(),{plugin,view}=env;
 const prose='An English line.\n\n'.repeat(190);
 const input='---\ntitle: Book\n---\n\n'+prose+'[[Other]]\n\n';
 const file=env.add('Book/Chapter.md',input);
 env.add('Book/Chapter (pt).md','existing');
 const routes=[];
 plugin.translateAI=async(part,mode,cfg,markers)=>{
  assert.equal(mode,true);
  assert.equal(markers,true);
  assert.ok(!part.includes('[[Other]]')&&!part.includes('title: Book'));
  routes.push([cfg.translationProvider,cfg.targetLanguage,cfg.aiKeys.openai]);
  plugin.settings.translationProvider='gemini';
  plugin.settings.targetLanguage='es';
  plugin.settings.aiKeys.openai='changed';
  return part.replaceAll('An English line.','Uma linha em inglês.');
 };
 await view.onOpen();
 await view.translateVaultFile(file);
 assert.ok(routes.length>1);
 assert.ok(routes.every(([id,lang,key])=>id==='openai'&&lang==='pt'&&key==='test-key'));
 assert.equal(env.data.get(file.path),input);
 assert.equal(env.data.get('Book/Chapter (pt).md'),'existing');
 assert.equal(env.data.get('Book/Chapter (pt) (2).md'),input.replaceAll('An English line.','Uma linha em inglês.'));
});

test('file translation reads the active editor when the vault copy is behind',async()=>{
 const {plugin,view,add,data}=runtime();
 const file=add('Chapter.md','Saved text.');
 plugin.app.workspace.activeLeaf={view:{file,getMode:()=> 'source',editor:{getValue:()=> 'Unsaved text.'}}};
 plugin.translateAI=async text=>{assert.equal(text,'Unsaved text.');return 'Texto atualizado.';};
 await view.onOpen();
 await view.translateVaultFile(file);
 assert.equal(data.get('Chapter (pt).md'),'Texto atualizado.');
 assert.equal(data.get(file.path),'Saved text.');
});

test('cancelling file translation discards the in-flight response',async()=>{
 const env=runtime(),{plugin,view}=env;
 const file=env.add('Chapter.md','Text.');
 await view.onOpen();
 let complete,started;
 const began=new Promise(resolve=>{started=resolve;});
 plugin.translateAI=()=>new Promise(resolve=>{complete=resolve;started();});
 const pending=view.translateVaultFile(file);
 await began;
 view.cancelFileTranslation();
 complete('Texto.');
 await pending;
 assert.equal(env.writes.length,0);
 assert.equal(view.fileTranslationStatus.text,'Translation cancelled.');
});

test('provider output limits abort translation instead of returning truncated content',async()=>{
 const env=runtime(),{plugin}=env;
 env.reply(async()=>({status:200,json:{choices:[{finish_reason:'length',message:{content:'Partial'}}]}}));
 await assert.rejects(plugin.translateAI('Something to translate',true),/output limit/);
 const long='x'.repeat(6200);
 env.reply(async()=>({status:200,json:{choices:[{finish_reason:'stop',message:{content:long}}]}}));
 assert.equal(await plugin.translateAI('Something to translate',true),long);
});

test('blocked or interrupted provider answers never become successful chat turns',async()=>{
 for(const locale of ['en','pt']){
  const env=runtime(locale),{plugin,view}=env;
  plugin.settings.visibleModules.chat=true;
  plugin.settings.assistantProvider='gemini';
  plugin.settings.aiKeys.gemini='test-gemini-key';
  await view.onOpen();view.switchTab('chat');
  for(const reason of ['SPII','BLOCKLIST','LANGUAGE','OTHER','MALFORMED_FUNCTION_CALL','UNEXPECTED_TOOL_CALL','NEW_UNKNOWN_REASON']){
   env.reply(async()=>({status:200,json:{candidates:[{finishReason:reason,content:{parts:[{text:'PARTIAL_RESPONSE_DO_NOT_ACCEPT'}]}}]}}));
   view.chatInput.value='Preserve this draft';
   await view.sendChat();
   assert.equal(view.chatInput.value,'Preserve this draft',reason);
   assert.equal(view.chatHistory.length,0,reason);
   assert.equal(view.chatMessages.children.length,0,reason);
   assert.match(view.chatStatus.text,locale==='pt'?/bloqueou|interrompeu/:/blocked|interrupted/,reason);
  }
  plugin.settings.assistantProvider='openai';
  env.reply(async()=>({status:200,json:{choices:[{finish_reason:'stop',message:{content:'PARTIAL_RESPONSE_DO_NOT_ACCEPT',refusal:'Unable to comply'}}]}}));
  view.chatInput.value='Keep this draft too';await view.sendChat();
  assert.equal(view.chatInput.value,'Keep this draft too');
  assert.equal(view.chatHistory.length,0);
  assert.match(view.chatStatus.text,locale==='pt'?/bloqueou/:/blocked/);
 }
});

test('Gemini complete responses and compatible responses without a finish reason still work',async()=>{
 const env=runtime(),{plugin}=env;
 plugin.settings.aiKeys.gemini='test-gemini-key';
 for(const reason of ['STOP',undefined]){
  env.reply(async()=>({status:200,json:{candidates:[{finishReason:reason,content:{parts:[{text:'A complete answer.'}]}}]}}));
  const result=await plugin.lookupAI('Question','writing','','gemini');
  assert.equal(result.definitions[0],'A complete answer.');
 }
});

test('chat restores failed drafts and ignores an answer after clearing the conversation',async()=>{
 const {plugin,view}=runtime();
 plugin.settings.visibleModules.chat=true;
 await view.onOpen();
 view.switchTab('chat');
 plugin.generateWriting=async()=>{throw Error('Connection lost');};
 view.chatInput.value='A draft';
 await view.sendChat();
 assert.equal(view.chatInput.value,'A draft');
 assert.equal(view.chatHistory.length,0);
 assert.match(view.chatStatus.text,/Connection lost/);
 let complete,started;
 const began=new Promise(resolve=>{started=resolve;});
 plugin.generateWriting=()=>new Promise(resolve=>{complete=resolve;started();});
 const pending=view.sendChat();
 await began;
 view.panels.chat.descendants().find(el=>el.attrs['aria-label']==='Clear conversation').fire('click');
 complete('Old answer');
 await pending;
 assert.equal(view.chatHistory.length,0);
 assert.ok(!view.chatMessages.findText('Old answer'));
 assert.equal(view.chatInput.value,'A draft');
 assert.equal(view.chatSend.disabled,false);
});

test('review prefers the active editor and refuses edits after the pane changes file',async()=>{
 const {api,plugin}=runtime();
 const note=new TFile('Chapter.md');
 const reading={view:{file:note,getMode:()=> 'preview',editor:{}}};
 let writes=0;
 const editing={view:{file:note,getMode:()=> 'source',editor:{getValue:()=> 'Prose',replaceRange:()=>{writes++;}}}};
 plugin.app.workspace.activeLeaf=editing;
 plugin.app.workspace.getLeavesOfType=()=>[reading,editing];
 assert.equal(api.writerActiveEditor(plugin,note),editing.view.editor);
 plugin.settings.snapshots={enabled:true,snapshotBeforeRewrite:true};
 plugin.writerSnapshots={create:async()=>{editing.view.file=new TFile('Other.md');}};
 await assert.rejects(api.writerSafeReplace(plugin,note,0,5,'Prose','Revised','review'),/changed while creating/);
 assert.equal(writes,0);
 const fenced=['~~~md','~~~text','Protected','~~~','Readable'].join('\n');
 const masked=api.writerMaskMarkdown(fenced);
 assert.ok(!masked.includes('Protected')&&masked.includes('Readable'));
});

test('the Basic Tools panel uses the Obsidian locale without changing its view type',async()=>{
 for(const [locale,title] of [['en','Basic Tools'],['pt-BR','Ferramentas Básicas']]){
  const {view}=runtime(locale);await view.onOpen();
  assert.equal(view.getDisplayText(),title);
  assert.equal(view.getViewType(),'offline-dictionary-view');
  assert.ok(view.contentEl.findText(title));
 }
});

test('dedicated translators use only their own credentials and official routes',async()=>{
 const cases=[
  ['deepl','https://api-free.deepl.com/v2/translate','Authorization','DeepL-Auth-Key private:fx',{text:['Ação'],target_lang:'EN-US',preserve_formatting:true},{translations:[{text:'Action'}]}],
  ['deepl','https://api.deepl.com/v2/translate','Authorization','DeepL-Auth-Key private',{text:['Ação'],target_lang:'EN-US',preserve_formatting:true},{translations:[{text:'Action'}]}],
  ['google-translate','https://translation.googleapis.com/language/translate/v2','x-goog-api-key','private',{q:['Ação'],target:'en',format:'text'},{data:{translations:[{translatedText:'Action &amp; care'}]}}],
  ['microsoft-translator','https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en&textType=plain','Ocp-Apim-Subscription-Key','private',[{Text:'Ação'}],[{translations:[{text:'Action'}]}]],
  ['libretranslate','http://localhost:5000/my-prefix/translate',null,null,{q:['Ação'],source:'auto',target:'en',format:'text',api_key:'private'},{translatedText:['Action']}]
 ];
 for(const [id,url,header,auth,body,response] of cases){
  const {plugin,reply}=runtime(); Object.assign(plugin.settings,{translationProvider:id,
   translationEndpoint:'http://localhost:5000/my-prefix',translationAzureRegion:'brazilsouth',targetLanguage:'en',
   translationKeys:{[id]:auth?.endsWith(':fx')?'private:fx':'private'}});
  reply(async request=>{
   assert.equal(request.url,url);
   assert.deepEqual(JSON.parse(request.body),body);
   if(header)assert.equal(request.headers[header],auth);
   else assert.equal(request.headers.Authorization,undefined);
   if(id==='microsoft-translator')assert.equal(request.headers['Ocp-Apim-Subscription-Region'],'brazilsouth');
   assert.ok(!JSON.stringify(request).includes('test-key'));
   return {status:200,json:response};
  });
  assert.equal(await plugin.translateAI('Ação'),id==='google-translate'?'Action & care':'Action');
 }
});

test('dedicated Markdown translation keeps links, properties, code and line endings in a separate copy',async()=>{
 const env=runtime(),{plugin,view,reply,add,data,writes}=env;
 Object.assign(plugin.settings,{translationProvider:'deepl',translationKeys:{deepl:'secret'},targetLanguage:'en'});
 const original='---\r\ntitle: Private\r\n---\r\n\r\n# Olá **mundo**\r\n- [ ] Pendente [[Arquivo]]\r\n\r\n```js\r\nsegredo\r\n```\r\n';
 const file=add('Livro.md',original);reply(async({body})=>{
  const {text}=JSON.parse(body);
  assert.deepEqual(text,['Olá','mundo','Pendente']);
  return {status:200,json:{translations:['Hello','world','Pending'].map(text=>({text}))}};
 });
 await view.onOpen();await view.translateVaultFile(file);
 assert.deepEqual(writes,['Livro (en).md']);assert.equal(data.get('Livro.md'),original);
 assert.equal(data.get('Livro (en).md'),original.replace('Olá','Hello').replace('mundo','world').replace('Pendente','Pending'));
});

test('missing credentials and invalid endpoints are blocked, and failed translators never fall back or echo their secrets',async()=>{
 const {plugin,view,reply}=runtime();
 await view.onOpen();plugin.settings.translationProvider='libretranslate';
 plugin.settings.translationEndpoint='http://untrusted.example/translate';
 await view.translate('Texto');assert.ok(view.translationOutput.findText('Configure connection'));
 assert.ok(view.translationOutput.descendants().some(e=>e.text.includes('instance URL')));
 Object.assign(plugin.settings,{translationProvider:'google-translate',translationKeys:{'google-translate':'secret'}});
 let calls=0;reply(async()=>{calls++;return {status:403,json:{error:'secret user manuscript'}};});
 await assert.rejects(plugin.translateAI('Texto'),error=>/403/.test(error.message)&&!error.message.includes('secret'));
 assert.equal(calls,1);
 reply(async()=>({status:200,json:{data:{translations:{malformed:true}}}}));
 await assert.rejects(plugin.translateAI('Texto'),/invalid or incomplete translation/);
});

test('chat shortcuts only draft, stop drops a late answer, and Gemini reasoning is not shown as prose',async()=>{
 const {plugin,view,reply}=runtime();plugin.settings.visibleModules.chat=true;
 plugin.settings.assistantProvider='gemini';
 await view.onOpen();view.switchTab('chat');
 assert.match(view.chatRoute.text,/Gemini.*gemini/);
 view.chatInput.value='A scene';
 view.panels.chat.findText('Brainstorm').fire('click');
 assert.match(view.chatInput.value,/three different ways[\s\S]*A scene/);
 const draft=view.chatInput.value;
 let finish,started;const pending=new Promise(resolve=>finish=resolve),start=new Promise(resolve=>started=resolve);
 reply(async config=>{assert.equal(JSON.parse(config.body).generationConfig.maxOutputTokens,2200);started();return pending;});
 const send=view.sendChat();await start;
 view.chatStop.fire('click');assert.equal(view.chatInput.value,draft);
 finish({status:200,json:{candidates:[{content:{parts:[{text:'late answer'}]}}]}});await send;
 assert.equal(view.chatHistory.length,0);assert.ok(!view.chatMessages.findText('late answer'));
 reply(async()=>({status:200,json:{candidates:[{content:{parts:[{thought:true,text:'internal'},{text:'Visible answer'}]}}]}}));
 await view.sendChat();assert.ok(view.chatMessages.findText('Visible answer'));assert.ok(!view.chatMessages.findText('internal'));
});

test('dedicated translation stops between batches when language settings change in the panel',async()=>{
 const {view,plugin,reply}=runtime();
 Object.assign(plugin.settings,{translationProvider:'deepl',translationKeys:{deepl:'secret'},targetLanguage:'en'});
 await view.onOpen();
 const input=('Palavra '.repeat(500)+'\n').repeat(5);
 let answer,begin,calls=0;const started=new Promise(resolve=>begin=resolve);
 reply(async config=>{calls++;begin();return new Promise(resolve=>answer=()=>resolve({
  status:200,json:{translations:JSON.parse(config.body).text.map(text=>({text}))}
 }));});
 const work=view.translate(input);await started;
 view.targetSelect.value='fr';view.targetSelect.fire('change');answer();await work;
 assert.equal(calls,1);
 assert.equal(view.translationOutput.children.length,0);
 assert.equal(plugin.settings.targetLanguage,'fr');
});
