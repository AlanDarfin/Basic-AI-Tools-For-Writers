'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.textContent=options.text||'';this.cls=options.cls||'';this.children=[];this.attrs=options.attr||{};this.handlers={};}
 createDiv(options){return this.createEl('div',options);}
 createEl(tag,options){const element=new Element(tag,options);this.children.push(element);return element;}
 setText(text){this.textContent=text;}
 addEventListener(event,callback){this.handlers[event]=callback;}
 all(){return [this,...this.children.flatMap(child=>child.all())];}
}
function runtime(lang='en'){
 const notices=[],updates=[],rows=[],timers=[],cleanup=[],classes=new Set(),opened=[];
 const document={body:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name);},remove(name){classes.delete(name);}}}};
 class Setting{
  constructor(){this.row={};rows.push(this.row);}
  setName(name){this.row.name=name;return this;}
  setDesc(desc){this.row.desc=desc;return this;}
  control(callback){const control={setValue(value){this.value=value;return this;},setButtonText(text){this.text=text;return this;},
   setDisabled(value){this.disabled=value;return this;},addOption(){return this;},onChange(callback){this.change=callback;return this;},onClick(callback){this.click=callback;return this;}};
   this.row.control=control;callback(control);return this;}
  addButton(callback){return this.control(callback);}
  addToggle(callback){return this.control(callback);}
  addDropdown(callback){return this.control(callback);}
 }
 const api=vm.runInNewContext(fs.readFileSync('src/v13/grammar-companion.js','utf8')+
  '\n({WRITER_COMPANION_GRAMMAR,writerLanguageToolState,writerLanguageToolEnabled,writerLanguageToolCommand,writerLanguageToolReview,writerLanguageToolUpdate,writerLanguageToolSettings,writerLanguageToolPanel,writerLanguageToolRegister})',{
  Setting,Notice:class{constructor(message){notices.push(message);}},writerUi:(pt,en)=>lang==='pt'?pt:en,
  writerModuleOn:plugin=>plugin.settings.visibleModules.review!==false,document,
  setInterval(callback){timers.push(callback);return timers.length;},clearInterval(){},VIEW:'basic'
 });
 const file={path:'Chapter.md',extension:'md'},other={path:'Other.md',extension:'md'};
 const cm={state:{doc:{length:25}}},leaf={view:{file,editor:{cm}}},otherLeaf={view:{file:other,editor:{cm:{state:{doc:{}}}}}};
 const workspace={activeLeaf:{view:{}},getLeavesOfType:type=>type==='markdown'?[otherLeaf,leaf]:[],
  getMostRecentLeaf:()=>leaf,getActiveFile:()=>workspace.activeLeaf.view.file||other,
  setActiveLeaf(item){workspace.activeLeaf=item;}};
 const instance={manifest:{version:'1.6.0'},settings:{options:{shouldAutoCheck:false,pickyMode:false,longCheckNotification:true,
  staticLanguage:'pt-BR',dictionary:['Imagined'],apikeySecret:'private-reference',pendingDictEdits:[{word:'Draft'}]},
  async update(patch){updates.push(patch);this.options={...this.options,...patch};}},
  async runDetection(editor){assert.equal(editor,cm);assert.equal(workspace.getActiveFile().path,file.path);return true;}};
 const commands={};for(const action of api.WRITER_COMPANION_GRAMMAR[0].actions)commands[action.command]={};
 const executed=[];
 const plugin={settings:{reviewEngine:'external',visibleModules:{review:true}},app:{plugins:{plugins:{languagetool:instance}},workspace,
  vault:{getAbstractFileByPath:path=>path===file.path?file:null},commands:{commands,executeCommandById(command){executed.push({command,file:workspace.getActiveFile().path});return true;}},
  setting:{open(){opened.push('open');},openTabById(id){opened.push(id);}}},register:callback=>cleanup.push(callback),registerInterval(){}};
 const view={plugin,activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,reviewResults:new Element(),
  reviewStatus:{setText(text){view.status=text;}},updateReviewEngineUI(){view.refreshes=(view.refreshes||0)+1;},reviewActiveFile(){view.reviews=(view.reviews||0)+1;}};
 return {api,plugin,instance,workspace,file,other,leaf,otherLeaf,cm,view,commands,executed,notices,updates,rows,timers,cleanup,classes,opened};
}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}

test('external LanguageTool commands restore the chosen Markdown editor before native callbacks',()=>{
 const h=runtime();assert.equal(h.api.writerLanguageToolCommand(h.plugin,'clear',h.file),true);
 assert.equal(h.workspace.activeLeaf,h.leaf);assert.equal(h.executed[0].file,h.file.path);
 h.workspace.activeLeaf={view:{}};assert.equal(h.api.writerLanguageToolCommand(h.plugin,'next',h.file),true);
 assert.equal(h.executed[1].command,'languagetool:next');
 assert.equal(h.api.writerLanguageToolCommand(h.plugin,'clear',{path:'Closed.md'}),false);
 assert.equal(h.executed.length,2);assert.match(h.notices[0],/Open the note/);
 assert.equal(h.api.writerLanguageToolCommand(h.plugin,'accept-all',h.file),false,'no mass edits in bridge');
});

test('a native command is never sent to another split of the same note',()=>{
 const h=runtime(),otherSplit={view:{file:h.file,editor:{cm:{state:{doc:{}}}}}};
 h.workspace.setActiveLeaf=()=>{h.workspace.activeLeaf=otherSplit;};
 assert.equal(h.api.writerLanguageToolCommand(h.plugin,'clear',h.file),false);
 assert.equal(h.executed.length,0);
});

test('review uses external frontmatter context and never sends a second Basic request',async()=>{
 const h=runtime();h.plugin.checkGrammar=()=>{throw Error('Must not call Basic checker');};
 assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),true);
 assert.equal(h.workspace.activeLeaf,h.leaf);assert.equal(h.view.reviewBusy,false);
 assert.match(h.view.status,/Check the editor underlines and LanguageTool notices/);
 assert.equal(h.executed.length,0);
});

test('a busy external review leaves editor focus alone and a clean result clears the working status',async()=>{
 const h=runtime(),pending=deferred();let requests=0;
 h.instance.runDetection=()=>{requests++;return pending.promise;};
 const job=h.api.writerLanguageToolReview(h.plugin,h.file,h.view);
 h.workspace.activeLeaf=h.otherLeaf;
 assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),false);
 assert.equal(h.workspace.activeLeaf,h.otherLeaf);assert.equal(requests,1);
 pending.resolve(false);assert.equal(await job,true);
 assert.equal(h.view.reviewBusy,false);assert.match(h.view.status,/No LanguageTool suggestions/);
});

test('missing methods and exact command capabilities are detected separately',()=>{
 const h=runtime();delete h.commands['languagetool:next'];delete h.instance.runDetection;
 const state=h.api.writerLanguageToolState(h.plugin);
 assert.equal(state.canCheck,false);assert.equal(state.commands.clear,true);assert.equal(state.commands.next,false);
 h.api.writerLanguageToolPanel(h.view);
 const buttons=h.view.reviewResults.all().filter(element=>element.tag==='button');
 assert.ok(!buttons.some(button=>button.textContent==='Check note/selection'));
 assert.equal(buttons.find(button=>button.textContent==='Clear suggestions').disabled,false);
 assert.equal(buttons.find(button=>button.textContent==='Next suggestion').disabled,true);
});

test('disabled modules and disabled bridges block all external checks, commands and option writes',async()=>{
 for(const change of [h=>h.plugin.settings.visibleModules.review=false,
  h=>h.plugin.settings.v12Toolkit={integrations:false},h=>h.plugin.settings.v12Toolkit={enabled:false},
  h=>h.plugin.settings.companionCompatibility={enabledById:{languagetool:false}},
  h=>delete h.plugin.app.plugins.plugins.languagetool]){
  const h=runtime();change(h);
  assert.equal(h.api.writerLanguageToolState(h.plugin).enabled,false);
  assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),false);
  assert.equal(h.api.writerLanguageToolCommand(h.plugin,'clear',h.file),false);
  await assert.rejects(h.api.writerLanguageToolUpdate(h.plugin,'pickyMode',true));
  assert.equal(h.executed.length,0);assert.equal(h.updates.length,0);
 }
});

test('external review refuses inactive or changed reviewer contexts before transport',async()=>{
 for(const change of [h=>h.plugin.settings.reviewEngine='basic',h=>h.view.activeTab='dictionary',
  h=>h.view.reviewMode.value='style',h=>h.view.reviewFilePath='Other.md']){
  const h=runtime();let requests=0;h.instance.runDetection=async()=>{requests++;};change(h);
  assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),false);assert.equal(requests,0);
 }
});

test('late external results cannot overwrite status after disable, reload or mode change',async()=>{
 for(const change of [h=>h.plugin.settings.visibleModules.review=false,h=>h.plugin.settings.reviewEngine='basic',
  h=>h.view.activeTab='dictionary',h=>h.view.reviewMode.value='beta',h=>h.view.reviewFilePath='Other.md',
  h=>h.plugin.app.plugins.plugins.languagetool={...h.instance},
  h=>h.view.reviewToken++]){
  const h=runtime(),pending=deferred();h.instance.runDetection=()=>pending.promise;
  const job=h.api.writerLanguageToolReview(h.plugin,h.file,h.view);change(h);
  h.view.status='New status';pending.resolve(true);assert.equal(await job,false);assert.equal(h.view.status,'New status');
 }
});

test('editing a note during an external review clears the working status and allows another check',async()=>{
 const h=runtime(),pending=deferred();h.instance.runDetection=()=>pending.promise;
 const job=h.api.writerLanguageToolReview(h.plugin,h.file,h.view);
 h.cm.state.doc={};pending.resolve(true);
 assert.equal(await job,false);assert.match(h.view.status,/editor changed during the check/);
 assert.equal(h.view.reviewBusy,false);
 assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),true);
});

test('external errors do not echo note text or credentials into the Basic pane',async()=>{
 const h=runtime();h.instance.runDetection=async()=>{throw Error('secret-key and private manuscript');};
 assert.equal(await h.api.writerLanguageToolReview(h.plugin,h.file,h.view),false);
 assert.doesNotMatch(h.view.status,/secret-key|private manuscript/);assert.equal(h.view.reviewBusy,false);
});

test('external settings use the audited updater and preserve dictionaries, secret references and metadata',async()=>{
 const h=runtime(),before=structuredClone(h.instance.settings.options);
 await h.api.writerLanguageToolUpdate(h.plugin,'pickyMode',true);
 assert.deepEqual(JSON.parse(JSON.stringify(h.updates)),[{pickyMode:true}]);
 assert.deepEqual(h.instance.settings.options.dictionary,before.dictionary);
 assert.equal(h.instance.settings.options.apikeySecret,before.apikeySecret);
 assert.deepEqual(h.instance.settings.options.pendingDictEdits,before.pendingDictEdits);
 for(const [key,value] of [['dictionary',[]],['apikeySecret','oops'],['pickyMode','true'],['staticLanguage','<script>']])
  await assert.rejects(h.api.writerLanguageToolUpdate(h.plugin,key,value));
 assert.equal(h.updates.length,1);
 await h.api.writerLanguageToolUpdate(h.plugin,'staticLanguage','en-GB');
 assert.equal(h.instance.settings.options.staticLanguage,'en-GB');
});

test('both languages render external controls without reading notes, networking or copying account settings',async()=>{
 for(const language of ['en','pt']){
  const h=runtime(language);h.api.writerLanguageToolSettings(h.plugin,new Element());
  assert.equal(h.updates.length,0);assert.equal(h.executed.length,0);
  const toggle=h.rows.find(row=>row.name===(language==='en'?'External picky mode':'Revisão rigorosa externa'));
  await toggle.control.change(true);assert.equal(h.instance.settings.options.pickyMode,true);
  const full=h.rows.find(row=>row.name===(language==='en'?'Full plugin settings':'Configuração completa do plugin'));
  full.control.click();assert.deepEqual(h.opened,['open','languagetool']);
 }
});

test('a failed settings save displays the stored preference again',async()=>{
 const h=runtime();h.instance.settings.update=async()=>{throw Error('Cannot write');};
 const section=h.api.writerLanguageToolSettings(h.plugin,new Element());
 const toggle=h.rows.find(row=>row.name==='External picky mode').control;
 toggle.value=true;await toggle.change(true);
 assert.equal(toggle.value,false);assert.equal(toggle.disabled,false);
 assert.match(section.all().find(element=>element.cls==='writer-grammar-feedback').textContent,/Could not save/);
});

test('external suggestion controls avoid the active note when the reviewed path is gone',()=>{
 const h=runtime();h.view.reviewFilePath='Removed.md';h.workspace.activeLeaf=h.otherLeaf;
 h.api.writerLanguageToolPanel(h.view);
 const clear=h.view.reviewResults.all().find(element=>element.textContent==='Clear suggestions');
 clear.handlers.click();
 assert.equal(h.executed.length,0);assert.match(h.view.status,/Action unavailable/);
 h.view.reviewFilePath='';clear.handlers.click();
 assert.deepEqual(h.executed,[{command:'languagetool:clear',file:h.other.path}]);
 h.plugin.app.commands.executeCommandById=()=>{throw Error('Native command unavailable');};
 assert.doesNotThrow(()=>clear.handlers.click());assert.match(h.view.status,/Action unavailable/);
});

test('the external auto-check toggle shows the committed preference and recovers from errors',async()=>{
 const h=runtime(),pending=deferred(),update=h.instance.settings.update.bind(h.instance.settings);
 h.instance.settings.update=async patch=>{await pending.promise;await update(patch);};
 h.api.writerLanguageToolPanel(h.view);
 const toggle=h.view.reviewResults.all().find(element=>element.textContent==='Turn on external automatic checking');
 const job=toggle.handlers.click();
 assert.equal(toggle.disabled,true);assert.match(toggle.textContent,/Turn on/);
 await toggle.handlers.click();pending.resolve();await job;
 assert.equal(h.updates.length,1);assert.equal(h.executed.length,0);
 assert.equal(toggle.disabled,false);assert.match(toggle.textContent,/Turn off/);
 h.instance.settings.update=async()=>{throw Error('Cannot write');};await toggle.handlers.click();
 assert.equal(toggle.disabled,false);assert.match(toggle.textContent,/Turn off/);
 assert.match(h.notices[0],/Could not save automatic checking/);
});

test('external auto-check can still use the native command when the settings updater is missing',()=>{
 const h=runtime();delete h.instance.settings.update;
 h.api.writerLanguageToolPanel(h.view);
 const toggle=h.view.reviewResults.all().find(element=>element.textContent==='Toggle automatic checking');
 toggle.handlers.click();assert.equal(h.executed[0].command,'languagetool:toggle-auto-check');
 assert.equal(toggle.textContent,'Toggle automatic checking');
});

test('runtime watcher removes optional UI styling after disable and refreshes only on capability changes',()=>{
 const h=runtime();h.workspace.getLeavesOfType=type=>type==='basic'?[{view:h.view}]:[h.leaf];
 const registration=h.api.writerLanguageToolRegister(h.plugin);assert.equal(h.classes.has('writer-grammar-external-compat'),true);
 const count=h.view.refreshes;registration.refresh();assert.equal(h.view.refreshes,count);
 h.plugin.settings.companionCompatibility={enabledById:{languagetool:false}};registration.refresh();
 assert.equal(h.classes.has('writer-grammar-external-compat'),false);assert.equal(h.view.refreshes,count+1);
 for(const callback of h.cleanup)callback();assert.equal(h.classes.size,0);
 h.plugin.settings.companionCompatibility.enabledById.languagetool=true;registration.refresh();assert.equal(h.classes.size,0);
});

test('runtime capability refresh waits for an active review and cancels its Basic UI when the bridge is disabled',()=>{
 const h=runtime();h.view.reviewBusy=true;
 h.workspace.getLeavesOfType=type=>type==='basic'?[{view:h.view}]:[h.leaf];
 let cancellations=0;h.view.cancelReview=()=>{cancellations++;h.view.reviewBusy=false;};
 const registration=h.api.writerLanguageToolRegister(h.plugin);assert.equal(h.view.refreshes,undefined);
 h.view.reviewBusy=false;registration.refresh();assert.equal(h.view.refreshes,1);
 h.view.reviewBusy=true;h.plugin.settings.v12Toolkit={integrations:false};registration.refresh();
 assert.equal(cancellations,1);assert.equal(h.view.refreshes,2);assert.equal(h.view.reviewBusy,false);
 registration.stop();
});

test('mobile tooltip styling and correction scroll guard use only the enabled bridge scope',()=>{
 const css=fs.readFileSync('src/styles/v13-8-grammar-compat.css','utf8');
 assert.match(css,/\.is-mobile\.writer-grammar-external-compat/);assert.match(css,/min-height:44px/);
 assert.match(css,/max-width:calc\(100vw - 40px\)/);
 assert.match(fs.readFileSync('src/v4/integrations.js','utf8'),/\.writer-grammar-external-compat \.lt-tooltip/);
});

test('diagnostics report the selected external engine and redact its server credentials and URL parameters',()=>{
 const h=runtime();h.plugin.settings.reviewEndpoint='https://unused-basic.example/check';
 h.instance.settings.options.serverUrl='https://account:PRIVATE@external.example/v2?key=PRIVATE';
 h.plugin.app.vault.getMarkdownFiles=()=>[];
 const diagnostics=vm.runInNewContext(fs.readFileSync('src/v4/modules.js','utf8')+'\nwriterDiagnostics',{
  URL,writerUi:(_pt,en)=>en,writerLanguageToolState:h.api.writerLanguageToolState,
  writerLanguageToolInstalled:plugin=>plugin.app.plugins.plugins.languagetool
 })(h.plugin);
 assert.equal(diagnostics.find(([key])=>key==='LanguageTool')[1],'External plugin active; independent preferences');
 assert.equal(diagnostics.find(([key])=>key==='LanguageTool plugin server')[1],'https://external.example');
 assert.doesNotMatch(JSON.stringify(diagnostics),/PRIVATE|unused-basic/);
});
