'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sources=['companion-toolkit.js','companion-notes.js','companion-sync.js','grammar-companion.js','companion-bridge.js'].map(name=>fs.readFileSync('src/v13/'+name,'utf8')).join('\n');
const plain=value=>JSON.parse(JSON.stringify(value));
function deferred(){let resolve;const promise=new Promise(ok=>{resolve=ok;});return {promise,resolve};}
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.children=[];this.dataset={};this.classes=new Set((options.cls||'').split(' ').filter(Boolean));this.events={};}
 createEl(tag,options){const el=new Element(tag,options);this.children.push(el);return el;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 addClass(value){this.classes.add(value);}
 empty(){this.children=[];}
 addEventListener(name,callback){this.events[name]=callback;}
 remove(){this.removed=true;}
}
function runtime(){
 const notices=[],dispatches=[],reveals=[],restores=[],saves=[],registered=[],cleanups=[],timers=new Map(),rows=[],lifecycle=[],events=new Map();let timerId=0;
 class Setting{
  constructor(){this.row={controls:[]};rows.push(this.row);}
  setName(value){this.row.name=value;return this;}
  setDesc(value){this.row.description=value;return this;}
  add(kind,register){const control={kind,options:{},addOption(key,label){this.options[key]=label;return this;},setValue(value){this.value=value;return this;},setDisabled(value){this.disabled=value;return this;},setButtonText(value){this.text=value;return this;},onChange(fn){this.change=fn;return this;},onClick(fn){this.click=fn;return this;}};this.row.controls.push(control);register(control);return this;}
  addDropdown(fn){return this.add('dropdown',fn);}addToggle(fn){return this.add('toggle',fn);}addButton(fn){return this.add('button',fn);}
 }
 const sandbox={console,Setting,Notice:class{constructor(value){notices.push(value);}},Platform:{isMobile:false},ItemView:class{constructor(leaf){this.leaf=leaf;this.contentEl=new Element();}},
  writerUi:(pt,en)=>en,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
  writerV12On:(plugin,id)=>plugin.settings.v12Toolkit?.enabled!==false&&plugin.settings.v12Toolkit?.[id]!==false,
  writerV12Config:plugin=>plugin.settings.v12Toolkit,
  WRITER_V12_SYNC:['none','syncthing-integration','syncthing-manager','obsidian-git','fit'],
  setInterval:callback=>{timers.set(++timerId,callback);return timerId;},clearInterval:id=>timers.delete(id),
  __registerSnail:()=>({refresh:()=>lifecycle.push('snail-refresh'),stop:()=>lifecycle.push('snail-stop')}),
  writerCompanionLayoutRegister:()=>({refresh:()=>lifecycle.push('layout-refresh'),stop:()=>lifecycle.push('layout-stop')})};
 const context=vm.createContext(sandbox);
 const api=vm.runInContext(sources+'\nwriterCompanionSnailkitRegister=__registerSnail;writerLanguageToolRegister=()=>{};\n({writerCompanionCatalog,writerCompanionConfig,writerCompanionEnabled,writerCompanionActionAvailable,writerCompanionEditorContext,writerCompanionRun,writerCompanionOpen,writerCompanionOpenPanel,writerCompanionSpeechStart,writerCompanionSpeechControl,writerCompanionSpeechSettings,writerCompanionToolkitSet,writerCompanionRegister,writerCompanionRender})',context);
 const leaves=new Map(),editor={selection:'Selected writing',text:'A complete chapter.',getSelection(){return this.selection;},getValue(){return this.text;},getCursor:()=>({line:0,ch:2}),posToOffset:()=>2};
 const note={view:{file:{path:'Manuscript/Chapter.md',basename:'Chapter',extension:'md'},editor}};leaves.set('markdown',[note]);
 const ws={activeLeaf:note,getLeavesOfType:type=>leaves.get(type)||[],getActiveFile:()=>note.view.file,
  setActiveLeaf:async leaf=>{restores.push(leaf);ws.activeLeaf=leaf;},revealLeaf:async leaf=>{reveals.push(leaf);},
  viewRegistry:{viewByType:{}},getRightLeaf:()=>null,getLeftLeaf:()=>null,getLeaf:()=>null,
  on(name,callback){const ref={name,callback};events.set(ref,ref);return ref;},offref:ref=>events.delete(ref),
  onLayoutReady:callback=>callback(),containerEl:{ownerDocument:{querySelectorAll:()=>[]}}};
 const speech=[];
 const manager={sentences:[],isPlaying:false,isPaused:false,playText(text,title){speech.push(['play',text,title]);this.sentences=[text];this.isPlaying=true;},pause(){speech.push(['pause']);this.isPaused=true;},resume(){speech.push(['resume']);this.isPaused=false;},stop(){speech.push(['stop']);this.isPlaying=false;}};
 const plugins={};for(const item of api.writerCompanionCatalog())plugins[item.id]={manifest:{version:'audited'},settings:{},sync:()=>{throw Error('Unexpected automatic sync');},sendText:()=>{throw Error('Unexpected automatic send');}};
 plugins['ahmed-toolkit'].settings={enableTTS:true,ttsEngine:'offline'};plugins['ahmed-toolkit'].ttsMgr=manager;
 plugins['obsidian-git'].gitReady=true;plugins['obsidian-git'].state={operation:0};
 const commands={};for(const item of api.writerCompanionCatalog())for(const action of item.actions)commands[action.command]={id:action.command,callback:()=>{throw Error('Do not probe native callbacks');}};
 const plugin={settings:{visibleModules:{},v12Toolkit:{enabled:true,integrations:true,syncProvider:'none'},companionCompatibility:{}},
  app:{workspace:ws,plugins:{plugins},commands:{commands,executeCommandById:id=>{dispatches.push(id);return true;}}},
  registerView:(type,factory)=>registered.push({type,factory}),register:callback=>cleanups.push(callback),registerInterval:()=>{},
  saveSettings:async()=>saves.push(plain(plugin.settings)),writerFinalFeatures:{stop:()=>speech.push(['basic-stop'])}};
 return {api,plugin,context,sandbox,notices,dispatches,reveals,restores,saves,registered,cleanups,timers,rows,lifecycle,ws,leaves,note,editor,manager,speech,events,
  emit:(name,...args)=>{for(const ref of [...events.values()])if(ref.name===name)ref.callback(...args);}};
}

test('configuration normalization is stable, preserves choices/unknown data, and has no transport side effects',()=>{
 const h=runtime(),original={enabledById:{dropit:false,future:false},ttsProvider:'invalid',panelPlacement:'bad',allowToolkitOnline:'yes',custom:{keep:1}};
 h.plugin.settings.companionCompatibility=original;
 const cfg=h.api.writerCompanionConfig(h.plugin),snapshot=plain(cfg);
 assert.equal(cfg,original);assert.equal(h.api.writerCompanionConfig(h.plugin),cfg);assert.deepEqual(plain(cfg),snapshot);
 assert.equal(cfg.enabledById.dropit,false);assert.equal(cfg.enabledById.future,false);assert.deepEqual(plain(cfg.custom),{keep:1});
 assert.equal(cfg.ttsProvider,'basic');assert.equal(cfg.panelPlacement,'right');assert.equal(cfg.allowToolkitOnline,false);
 assert.equal(h.dispatches.length,0);assert.equal(h.speech.length,0);assert.equal(h.saves.length,0);
});

test('live companion gates reject unloaded plugins, mobile desktop-only features, and newly disabled commands',async()=>{
 const h=runtime(),item=h.api.writerCompanionCatalog().find(item=>item.id==='dropit'),action=item.actions.find(action=>action.id==='sync');
 assert.equal(h.api.writerCompanionActionAvailable(h.plugin,item,action),true);
 h.api.writerCompanionConfig(h.plugin).enabledById.dropit=false;assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','sync'),false);
 h.api.writerCompanionConfig(h.plugin).enabledById.dropit=true;delete h.plugin.app.plugins.plugins.dropit;
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','sync'),false);
 h.plugin.app.isMobile=true;assert.equal(h.api.writerCompanionEnabled(h.plugin,'visual-kit'),false);
 h.plugin.settings.v12Toolkit.integrations=false;assert.equal(h.api.writerCompanionEnabled(h.plugin,'fit'),false);
 assert.equal(h.dispatches.length,0);
});

test('manual sync requires explicit provider selection; inspection and dropit sends retain their own workflows',async()=>{
 const h=runtime();
 assert.equal(await h.api.writerCompanionRun(h.plugin,'fit','sync'),false);
 assert.equal(await h.api.writerCompanionRun(h.plugin,'obsidian-git','pull'),false);
 assert.equal(await h.api.writerCompanionRun(h.plugin,'obsidian-git','source-control'),true);
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','send-selection',h.api.writerCompanionEditorContext(h.plugin)),true);
 h.plugin.settings.v12Toolkit.syncProvider='fit';
 assert.equal(await h.api.writerCompanionRun(h.plugin,'fit','sync'),true);
 assert.deepEqual(h.dispatches,['obsidian-git:open-git-view','dropit:send-selection','fit:fit-sync']);
 assert.equal(h.saves.length,0);
});

test('a saved editor is restored after opening the companion center and native command checks execute only at dispatch',async()=>{
 const h=runtime(),saved=h.api.writerCompanionEditorContext(h.plugin);
 h.ws.activeLeaf={view:{}};
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','send-selection',saved),true);
 assert.equal(h.ws.activeLeaf,h.note);assert.deepEqual(h.restores,[h.note]);assert.deepEqual(h.dispatches,['dropit:send-selection']);
 h.editor.selection='  ';
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','send-selection',saved),false);assert.equal(h.dispatches.length,1);
});

test('editor context is revalidated after asynchronous restoration before any content is sent',async()=>{
 for(const change of ['file','editor','closed','selection','disabled']){
  const h=runtime(),saved=h.api.writerCompanionEditorContext(h.plugin),pending=deferred();
  h.ws.setActiveLeaf=async leaf=>{h.ws.activeLeaf=leaf;await pending.promise;};
  const running=h.api.writerCompanionRun(h.plugin,'dropit','send-selection',saved);
  if(change==='file')h.note.view.file={path:'Private/Other.md'};
  if(change==='editor')h.note.view.editor={getSelection:()=> 'Other note'};
  if(change==='closed')h.leaves.set('markdown',[]);
  if(change==='selection')h.editor.selection='';
  if(change==='disabled')h.api.writerCompanionConfig(h.plugin).enabledById.dropit=false;
  pending.resolve();
  assert.equal(await running,false,change+' changed while restoring');assert.equal(h.dispatches.length,0,change+' must never send content');
 }
});

test('switching sync providers during editor restoration cancels a pending network action',async()=>{
 const h=runtime(),pending=deferred();h.plugin.settings.v12Toolkit.syncProvider='syncthing-manager';
 h.ws.setActiveLeaf=async leaf=>{h.ws.activeLeaf=leaf;await pending.promise;};
 const running=h.api.writerCompanionRun(h.plugin,'syncthing-manager','versions',h.api.writerCompanionEditorContext(h.plugin));
 h.plugin.settings.v12Toolkit.syncProvider='fit';pending.resolve();
 assert.equal(await running,false);assert.equal(h.dispatches.length,0);
});

test('an already rendered companion center follows the latest editor through workspace events',async()=>{
 const h=runtime();h.api.writerCompanionRegister(h.plugin);
 const panel={};panel.view=h.registered.find(item=>item.type==='basic-connected-plugins').factory(panel);
 panel.view.editorContext=h.api.writerCompanionEditorContext(h.plugin);h.leaves.set('basic-connected-plugins',[panel]);panel.view.render();
 const second={view:{file:{path:'Manuscript/Next.md',basename:'Next',extension:'md'},editor:{...h.editor,selection:'Latest note selection'}}};
 h.leaves.set('markdown',[h.note,second]);h.ws.activeLeaf=second;h.emit('active-leaf-change',second);
 assert.equal(panel.view.editorContext.leaf,second);
 h.ws.activeLeaf=panel;h.ws.getActiveFile=()=>null;
 assert.equal(h.api.writerCompanionEditorContext(h.plugin).leaf,second);
 const find=(root,predicate)=>predicate(root)?root:root.children.map(child=>find(child,predicate)).find(Boolean);
 const card=find(panel.view.contentEl,el=>el.dataset.companion==='dropit');
 const send=find(card,el=>el.tag==='button'&&el.text==='Send selection');assert.ok(send);
 send.events.click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.restores.at(-1),second);assert.deepEqual(h.dispatches,['dropit:send-selection']);
 for(const cleanup of h.cleanups)cleanup();assert.equal(h.events.size,0);
});

test('host restoration failure and native command failure return false instead of leaking rejected UI actions',async()=>{
 const h=runtime();h.ws.setActiveLeaf=async()=>{throw Error('Leaf was closed');};
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','send-note',h.api.writerCompanionEditorContext(h.plugin)),false);
 h.plugin.app.commands.executeCommandById=()=>{throw Error('Native plugin stopped');};
 assert.equal(await h.api.writerCompanionRun(h.plugin,'dropit','sync'),false);
 assert.ok(h.notices.length>=1);
});

test('native panels reuse existing leaves and never manufacture an unavailable module view',async()=>{
 const h=runtime(),existing={view:{}};h.leaves.set('snailkit-tasks',[existing]);
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'snailkit','snailkit-tasks'),true);assert.deepEqual(h.reveals,[existing]);
 h.leaves.set('snailkit-tasks',[]);
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'snailkit','snailkit-tasks'),false);
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'dropit','invented-dropit-view'),false);
 h.api.writerCompanionConfig(h.plugin).enabledById.snailkit=false;h.leaves.set('snailkit-tasks',[existing]);
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'snailkit','snailkit-tasks'),false);assert.equal(h.reveals.length,1);
});

test('native panel opening respects placement and rechecks live disable after view creation',async()=>{
 const h=runtime(),pending=deferred(),states=[],leaf={setViewState:async state=>{states.push(state);await pending.promise;}};
 h.ws.viewRegistry.viewByType['snailkit-tasks']=()=>{};h.ws.getLeftLeaf=()=>leaf;
 h.api.writerCompanionConfig(h.plugin).panelPlacement='left';
 const running=h.api.writerCompanionOpenPanel(h.plugin,'snailkit','snailkit-tasks');
 assert.deepEqual(plain(states),[{type:'snailkit-tasks',active:true}]);
 h.api.writerCompanionConfig(h.plugin).enabledById.snailkit=false;pending.resolve();
 assert.equal(await running,false);assert.equal(h.reveals.length,0);
});

test('native view factories use the real app registry and preserve the HTML file state',async()=>{
 const h=runtime(),states=[],leaf={setViewState:async state=>states.push(state)},viewType='visual-kit-html-note';
 h.plugin.app.viewRegistry={viewByType:vm.runInContext('new Map()',h.context)};h.plugin.app.viewRegistry.viewByType.set(viewType,()=>{});
 h.plugin.app.plugins.plugins['visual-kit'].settings.htmlNotes=true;
 h.ws.getActiveFile=()=>({path:'Exports/Preview.html',extension:'html'});h.ws.getRightLeaf=()=>leaf;
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'visual-kit',viewType),true);
 assert.deepEqual(plain(states),[{type:viewType,active:true,state:{file:'Exports/Preview.html'}}]);assert.deepEqual(h.reveals,[leaf]);
});

test('a native module switched off cannot be reopened through its still-registered view',async()=>{
 const h=runtime(),existing={view:{}},viewType='visual-kit-html-note';
 h.plugin.app.plugins.plugins['visual-kit'].settings.htmlNotes=false;
 h.ws.viewRegistry.viewByType[viewType]=()=>{};h.leaves.set(viewType,[existing]);
 assert.equal(await h.api.writerCompanionOpenPanel(h.plugin,'visual-kit',viewType),false);assert.equal(h.reveals.length,0);
});

test('speech stays with Basic by default and Toolkit online speech requires its separate permission',()=>{
 const h=runtime();
 assert.equal(h.api.writerCompanionSpeechStart(h.plugin,'Writing','Chapter'),false);assert.equal(h.speech.length,0);
 h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';h.plugin.app.plugins.plugins['ahmed-toolkit'].settings.ttsEngine='online';
 assert.equal(h.api.writerCompanionSpeechStart(h.plugin,'Writing','Chapter'),false);assert.equal(h.speech.length,0);
 assert.ok(h.notices.some(value=>/Google Translate|online|permission/i.test(value)));
});

test('Basic controls only speech it started and releases ownership after a native Toolkit reading replaces it',()=>{
 const h=runtime();h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';
 assert.equal(h.api.writerCompanionSpeechStart(h.plugin,'Owned writing','Chapter'),true);
 assert.equal(h.api.writerCompanionSpeechControl(h.plugin,'pause'),true);
 h.manager.sentences=['Native Toolkit reading'];h.manager.isPlaying=true;
 assert.equal(h.api.writerCompanionSpeechControl(h.plugin,'stop'),false);
 assert.equal(h.plugin._writerCompanionSpeechHandle,null);
 assert.deepEqual(h.speech,[['play','Owned writing','Chapter'],['pause']]);
});

test('Toolkit speech launcher uses the routed provider and cannot bypass the online/module gate via native commands',async()=>{
 const h=runtime(),selection='ahmed-toolkit:flowkit-tts-play-selection';
 assert.equal(await h.api.writerCompanionRun(h.plugin,'ahmed-toolkit',selection),false);
 assert.equal(h.dispatches.length,0);assert.equal(h.speech.length,0);
 h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';
 assert.equal(await h.api.writerCompanionRun(h.plugin,'ahmed-toolkit',selection),true);
 assert.deepEqual(h.speech,[['play','Selected writing','Chapter']]);assert.equal(h.dispatches.length,0);
 h.plugin.settings.visibleModules.tts=false;
 assert.equal(await h.api.writerCompanionRun(h.plugin,'ahmed-toolkit',selection),false);
 assert.equal(h.dispatches.length,0);
});

test('changing speech providers stops the owned session and invalidates pending Basic speech without altering native voices',async()=>{
 const h=runtime();h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';
 h.api.writerCompanionSpeechStart(h.plugin,'Owned writing','Chapter');
 const native=h.plugin.app.plugins.plugins['ahmed-toolkit'].settings;
 h.api.writerCompanionSpeechSettings(h.plugin,new Element());
 const provider=h.rows.find(row=>row.name==='Speech provider').controls.find(control=>control.kind==='dropdown');
 await provider.change('basic');
 assert.equal(h.api.writerCompanionConfig(h.plugin).ttsProvider,'basic');assert.equal(h.plugin._writerCompanionSpeechHandle,null);
 assert.deepEqual(h.speech,[['play','Owned writing','Chapter'],['stop'],['basic-stop']]);assert.equal(h.plugin._writerV107SpeechId,1);
 assert.equal(h.plugin.app.plugins.plugins['ahmed-toolkit'].settings,native);assert.equal(native.ttsEngine,'offline');assert.equal(h.saves.length,1);
});

test('companion preference writes are whitelisted, validated and delegated to native persistence',async()=>{
 const h=runtime(),native=h.plugin.app.plugins.plugins['ahmed-toolkit'],writes=[];
 native.settings={...native.settings,ttsRate:1,apiKey:'private-original',custom:{keep:true}};native.saveSettings=async()=>writes.push(plain(native.settings));
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','apiKey','replacement'),false);
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsRate',100),false);
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsRate','1.5'),false);
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsEngine','unknown-provider'),false);
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','enableTTS','true'),false);
 assert.equal(writes.length,0);
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsRate',1.5),true);
 assert.equal(writes.length,1);assert.equal(native.settings.ttsRate,1.5);assert.equal(native.settings.apiKey,'private-original');assert.deepEqual(native.settings.custom,{keep:true});
 assert.equal(h.saves.length,0);assert.equal(h.dispatches.length,0);assert.equal(h.speech.length,0);
});

test('failed native preference persistence rolls back only its own value and preserves concurrent edits',async()=>{
 const h=runtime(),native=h.plugin.app.plugins.plugins['ahmed-toolkit'];native.settings.ttsRate=1;
 native.saveSettings=async()=>{throw Error('Storage unavailable');};
 assert.equal(await h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsRate',1.2),false);assert.equal(native.settings.ttsRate,1);
 const pending=deferred();native.saveSettings=async()=>{await pending.promise;throw Error('Storage unavailable');};
 const writing=h.api.writerCompanionToolkitSet(h.plugin,'ahmed-toolkit','ttsRate',1.2);native.settings.ttsRate=1.4;pending.resolve();
 assert.equal(await writing,false);assert.equal(native.settings.ttsRate,1.4);assert.equal(h.notices.length,2);
});

test('live speech module and provider changes release only the Basic-owned session on refresh',()=>{
 for(const change of ['module','final-suite','provider']){
  const h=runtime();h.api.writerCompanionRegister(h.plugin);h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';
  assert.equal(h.api.writerCompanionSpeechStart(h.plugin,'Owned writing','Chapter'),true);
  if(change==='module')h.plugin.settings.visibleModules.tts=false;
  if(change==='final-suite')h.plugin.settings.finalSuite={tts:{enabled:false}};
  if(change==='provider')h.api.writerCompanionConfig(h.plugin).ttsProvider='basic';
  h.plugin._writerCompanionManager.refresh();
  assert.equal(h.plugin._writerCompanionSpeechHandle,null,change);assert.deepEqual(h.speech,[['play','Owned writing','Chapter'],['stop']],change);
  h.plugin._writerCompanionManager.stop();
 }
});

test('manager lifecycle is idempotent, refreshes live capability gates and never starts transport during discovery',()=>{
 const h=runtime();h.api.writerCompanionRegister(h.plugin);h.api.writerCompanionRegister(h.plugin);
 assert.equal(h.registered.filter(item=>item.type==='basic-connected-plugins').length,1);assert.equal(h.timers.size,1);
 const manager=h.plugin._writerCompanionManager;
 assert.ok(h.lifecycle.includes('snail-refresh'));assert.ok(h.lifecycle.includes('layout-refresh'));assert.equal(h.dispatches.length,0);assert.equal(h.speech.length,0);
 h.api.writerCompanionConfig(h.plugin).ttsProvider='ahmed-toolkit';h.api.writerCompanionSpeechStart(h.plugin,'Owned writing','Chapter');
 h.plugin.settings.v12Toolkit.integrations=false;manager.refresh();assert.equal(h.plugin._writerCompanionSpeechHandle,null);
 manager.stop();manager.stop();assert.equal(h.lifecycle.filter(value=>value==='snail-stop').length,1);assert.equal(h.lifecycle.filter(value=>value==='layout-stop').length,1);
 const count=h.lifecycle.length;for(const callback of h.timers.values())callback();assert.equal(h.lifecycle.length,count);assert.equal(h.dispatches.length,0);
});

test('companion center materializes deferred placeholders before rendering on first open and reuse',async()=>{
 const h=runtime();h.api.writerCompanionRegister(h.plugin);
 const factory=h.registered.find(item=>item.type==='basic-connected-plugins').factory;
 const states=[];let ready=deferred(),allocations=0,materializations=0;
 const leaf={view:{getViewType:()=> 'deferred'},
  setViewState:async state=>{states.push(plain(state));h.leaves.set('basic-connected-plugins',[leaf]);},
  async loadIfDeferred(){
   if(typeof this.view.render==='function')return;
   await ready.promise;this.view=factory(this);materializations++;
  }};
 h.ws.getRightLeaf=()=>{allocations++;return leaf;};
 const first=h.api.writerCompanionOpen(h.plugin,'sync');await Promise.resolve();
 assert.equal(h.reveals.length,0);assert.equal(typeof leaf.view.render,'undefined');
 ready.resolve();assert.equal(await first,true);
 assert.equal(materializations,1);assert.equal(leaf.view.role,'sync');assert.equal(leaf.view.editorContext.leaf,h.note);
 assert.ok(leaf.view.contentEl.children.some(el=>el.tag==='h2'&&el.text==='Connected plugins'));
 assert.deepEqual(states,[{type:'basic-connected-plugins',active:true}]);assert.deepEqual(h.reveals,[leaf]);
 leaf.view={getViewType:()=> 'deferred'};ready=deferred();
 const reused=h.api.writerCompanionOpen(h.plugin);await Promise.resolve();assert.equal(h.reveals.length,1);
 ready.resolve();assert.equal(await reused,true);
 assert.equal(materializations,2);assert.equal(allocations,1);assert.equal(states.length,1);assert.equal(leaf.view.role,undefined);
 assert.equal(leaf.view.editorContext.leaf,h.note);assert.deepEqual(h.reveals,[leaf,leaf]);
 h.plugin._writerCompanionManager.stop();
});

test('manager stop detaches only its own center leaves and keeps native companion views and plugins running',()=>{
 const h=runtime(),detached=[];h.api.writerCompanionRegister(h.plugin);
 const factory=h.registered.find(item=>item.type==='basic-connected-plugins').factory;
 const own={detach:()=>detached.push('center')};own.view=factory(own);
 const ownDeferred={view:{getViewType:()=> 'deferred'},detach:()=>detached.push('deferred-center')};
 const native={view:{getViewType:()=> 'snailkit-tasks'},detach:()=>detached.push('native-snailkit')};
 h.note.detach=()=>detached.push('markdown');
 h.leaves.set('basic-connected-plugins',[own,ownDeferred]);h.leaves.set('snailkit-tasks',[native]);
 const companion=h.plugin.app.plugins.plugins.snailkit;companion.onunload=()=>detached.push('native-plugin-unload');
 h.plugin._writerCompanionManager.stop();h.plugin._writerCompanionManager.stop();
 for(const callback of h.timers.values())callback();
 assert.deepEqual(detached,['center','deferred-center']);assert.equal(h.plugin.app.plugins.plugins.snailkit,companion);
 assert.equal(h.leaves.get('snailkit-tasks')[0],native);assert.equal(h.dispatches.length,0);
});
