'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.classes=new Set((options.cls||'').split(' ').filter(Boolean));this.children=[];this.events={};this.attrs=options.attr||{};}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 addClass(value){this.classes.add(value);}
 removeClass(value){this.classes.delete(value);}
 addEventListener(name,callback){this.events[name]=callback;}
 click(){return this.events.click?.();}
 remove(){this.removed=true;}
}
const plain=value=>JSON.parse(JSON.stringify(value));
const task=(extra={})=>({path:'Writing/Chapter.md',line:3,raw:'- [ ] Revise #book',done:false,title:'Revise',plainTitle:'Revise',tags:['book'],markers:{source:'manual'},...extra});
function harness(language='en'){
 const source=fs.readFileSync('src/v13/companion-notes.js','utf8');
 const api=vm.runInNewContext(source+'\n({WRITER_COMPANION_NOTES,writerCompanionNotesOpenSettings,writerCompanionSnailkitService,writerCompanionSnailkitTasks,writerCompanionSnailkitSetDone,writerCompanionSnailkitRegister})',{
  writerUi:(pt,en)=>language==='pt'?pt:en,
  writerModuleOn:(plugin,id)=>plugin.settings.visibleModules[id]!==false,
  writerCompanionEnabled:(plugin,id)=>id==='snailkit'&&plugin.compatEnabled!==false
 });
 const events=new Map(),cleanups=[],calls=[],tabs=[],removed=[],writes=[];
 const service={version:1,isReady:()=>true,getTasks:()=>[task()],find:location=>task(location),setDone:async(location,done)=>{writes.push({location:plain(location),done});return task({...location,done});},
  addViewTab(tab){tabs.push(tab);return ()=>removed.push(tab);}};
 const companion={api:{version:1,isEnabled:id=>id==='tasks',service:id=>id==='tasks'?service:undefined},openSettings:section=>calls.push(['snailkit-settings',section])};
 const workspace={on(name,callback){const ref={name,callback};events.set(ref,ref);return ref;},offref(ref){events.delete(ref);}};
 const plugin={compatEnabled:true,settings:{visibleModules:{}},app:{workspace,plugins:{plugins:{snailkit:companion}}},register:callback=>cleanups.push(callback),
  openProjects:()=>calls.push(['projects']),openWritingTools:()=>calls.push(['tools']),openCoreSettings:section=>calls.push(['basic-settings',section]),
  saveSettings:()=>{throw Error('Unexpected persistence');}};
 return {api,plugin,companion,service,events,cleanups,calls,tabs,removed,writes,emit:name=>{for(const ref of [...events.values()])if(ref.name===name)ref.callback();}};
}

test('catalog uses audited native command namespaces, exposes both languages and no invented dropit view',()=>{
 const {api}=harness(),catalog=api.WRITER_COMPANION_NOTES;
 for(const item of catalog){
  assert.match(item.revision,/^[a-f0-9]{40}$/);assert.equal(item.license,'MIT');
  assert.equal(item.settingsTabId,item.id);
  for(const action of item.actions){assert.ok(action.pt);assert.ok(action.en);assert.ok(action.command.startsWith(item.id+':'));}
 }
 const snail=catalog.find(item=>item.id==='snailkit'),drop=catalog.find(item=>item.id==='dropit');
 assert.ok(snail.settingsSections.some(item=>item.id==='note-rail'));
 assert.deepEqual(plain(drop.viewTypes),[]);
 assert.deepEqual(plain(drop.actions.map(item=>item.command)),['dropit:sync','dropit:send-note','dropit:send-selection','dropit:process-note','dropit:rerun-last']);
 assert.equal(drop.actions.find(item=>item.id==='send-selection').requiresSelection,true);
 assert.ok(drop.actions.filter(item=>item.effect==='process').every(item=>item.desktopOnly===true));
});

test('settings open the original module page without reading or replacing companion data',()=>{
 const h=harness(),secret={token:'keep-original',cursor:42,rules:[{id:'own-rule'}]};
 h.companion.settings=secret;
 assert.equal(h.api.writerCompanionNotesOpenSettings(h.plugin,'snailkit','note-rail'),true);
 assert.deepEqual(h.calls,[['snailkit-settings','note-rail']]);
 assert.equal(h.companion.settings,secret);
 h.plugin.app.plugins.plugins.dropit={settings:secret,openSettings:()=>h.calls.push(['dropit-settings'])};
 assert.equal(h.api.writerCompanionNotesOpenSettings(h.plugin,'dropit'),true);
 assert.equal(h.plugin.app.plugins.plugins.dropit.settings,secret);
 assert.equal(h.api.writerCompanionNotesOpenSettings(h.plugin,'unknown'),false);
});

test('settings fall back to the native host tab when a method is absent, and reject failures',()=>{
 const h=harness();delete h.companion.openSettings;
 h.plugin.app.setting={open:()=>h.calls.push('open'),openTabById:id=>h.calls.push(id)};
 assert.equal(h.api.writerCompanionNotesOpenSettings(h.plugin,'snailkit'),true);
 assert.deepEqual(h.calls,['open','snailkit']);
 h.plugin.app.setting.open=()=>{throw Error('Host unavailable');};
 assert.equal(h.api.writerCompanionNotesOpenSettings(h.plugin,'snailkit'),false);
});

test('task reads require a live enabled version 1 service and return detached snapshots',()=>{
 const h=harness(),original=task();let options;
 h.service.getTasks=value=>{options=value;return [original,{path:'bad'}];};
 const result=h.api.writerCompanionSnailkitTasks(h.plugin,true);
 assert.deepEqual(plain(options),{includeDone:true});assert.equal(result.length,1);
 result[0].tags.push('changed');result[0].markers.source='changed';result[0].title='changed';
 assert.deepEqual(original.tags,['book']);assert.equal(original.markers.source,'manual');assert.equal(original.title,'Revise');
 h.companion.api.isEnabled=()=>false;
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
 h.companion.api.isEnabled=()=>true;h.companion.api.version=2;
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
 h.companion.api.version=1;h.service.version=2;
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
 h.service.version=1;h.plugin.compatEnabled=false;
 assert.equal(h.api.writerCompanionSnailkitService(h.plugin),null);
});

test('loading, failing and unloaded external task services are harmless to Basic',()=>{
 const h=harness();h.service.isReady=()=>false;
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
 h.service.isReady=()=>true;h.service.getTasks=()=>{throw Error('Index not available');};
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
 delete h.plugin.app.plugins.plugins.snailkit;
 assert.equal(h.api.writerCompanionSnailkitService(h.plugin),null);
 assert.equal(h.api.writerCompanionSnailkitTasks(h.plugin).length,0);
});

test('completion delegates one explicit change using the exact original task location',async()=>{
 const h=harness(),location=task();
 const result=await h.api.writerCompanionSnailkitSetDone(h.plugin,location,true);
 assert.equal(result.done,true);
 assert.deepEqual(h.writes,[{location:{path:location.path,line:location.line,raw:location.raw},done:true}]);
 assert.equal(location.done,false);
});

test('stale, removed, invalid and newly disabled tasks never write',async()=>{
 const h=harness();
 h.service.find=()=>task({raw:'- [ ] Someone changed this #book'});
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),true),null);
 h.service.find=()=>null;
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),true),null);
 h.service.find=value=>{h.plugin.compatEnabled=false;return task(value);};
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),true),null);
 h.plugin.compatEnabled=true;
 for(const value of [null,{},task({line:-1}),task({line:1.5}),task({raw:''}),task({path:''})])assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,value,true),null);
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),'true'),null);
 assert.equal(h.writes.length,0);
});

test('external write rejection is contained and completing a task never starts other actions',async()=>{
 const h=harness();h.service.setDone=async()=>{throw Error('Note changed concurrently');};
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),true),null);
 assert.equal(h.calls.length,0);
});

test('registration adds exactly one native Basic tab, with no task read, write, transport or opening action',()=>{
 const h=harness();h.service.getTasks=()=>{throw Error('Unexpected scan');};
 const life=h.api.writerCompanionSnailkitRegister(h.plugin,()=>true);
 assert.equal(h.tabs.length,1);assert.equal(h.tabs[0].id,'basic-writing');
 life.refresh();h.emit('snailkit:services-changed');
 assert.equal(h.tabs.length,1);assert.equal(h.writes.length,0);assert.equal(h.calls.length,0);
 assert.equal(h.cleanups.length,1);life.stop();
});

test('native tab buttons are bilingual and honor Basic module disable on both refresh and old clicks',()=>{
 for(const language of ['en','pt']){
  const h=harness(language),life=h.api.writerCompanionSnailkitRegister(h.plugin,()=>true),el=new Element();
  const instance=h.tabs[0].mount(el,{}),buttons=el.children.find(item=>item.classes.has('basic-companion-snailkit-actions')).children;
  assert.equal(el.children[0].text,language==='pt'?'Escrita com Basic':'Writing with Basic');
  buttons[0].click();buttons[1].click();buttons[2].click();
  assert.deepEqual(h.calls,[['projects'],['tools'],['basic-settings','integrationsV4']]);
  h.plugin.settings.visibleModules.projects=false;h.plugin.settings.visibleModules.tools=false;
  life.refresh();assert.equal(buttons[0].hidden,true);assert.equal(buttons[1].hidden,true);
  buttons[0].click();buttons[1].click();assert.equal(h.calls.length,3);
  instance.destroy();buttons[2].click();assert.equal(h.calls.length,3);life.stop();
 }
});

test('service stop/reload and integration disable remove native tabs and detach mounted Basic content',()=>{
 const h=harness();let enabled=true;
 const life=h.api.writerCompanionSnailkitRegister(h.plugin,()=>enabled),el=new Element();
 h.tabs[0].mount(el,{});
 h.companion.api.isEnabled=()=>false;h.emit('snailkit:services-changed');
 assert.equal(h.removed.length,1);assert.ok(el.children.every(item=>item.removed));
 h.companion.api.isEnabled=()=>true;h.emit('snailkit:services-changed');assert.equal(h.tabs.length,2);
 enabled=false;life.refresh();assert.equal(h.removed.length,2);
 enabled=true;life.refresh();assert.equal(h.tabs.length,3);
 h.cleanups[0]();life.stop();assert.equal(h.removed.length,3);assert.equal(h.events.size,0);
 life.refresh();h.emit('snailkit:services-changed');assert.equal(h.tabs.length,3);
});

test('replacing the running service cleans the previous tab and old write targets cannot survive replacement',async()=>{
 const h=harness(),life=h.api.writerCompanionSnailkitRegister(h.plugin,()=>true),replacement={...h.service};
 h.companion.api.service=()=>replacement;life.refresh();assert.equal(h.removed.length,1);assert.equal(h.tabs.length,2);
 replacement.find=value=>{h.companion.api.service=()=>h.service;return task(value);};
 assert.equal(await h.api.writerCompanionSnailkitSetDone(h.plugin,task(),true),null);
 assert.equal(h.writes.length,0);life.stop();
});

test('an unavailable or disabled companion never registers a tab; a module stopping during registration is cleaned',()=>{
 const h=harness();h.plugin.compatEnabled=false;
 const life=h.api.writerCompanionSnailkitRegister(h.plugin,()=>true);assert.equal(h.tabs.length,0);
 h.plugin.compatEnabled=true;
 h.service.addViewTab=tab=>{h.tabs.push(tab);h.companion.api.isEnabled=()=>false;h.emit('snailkit:services-changed');return ()=>h.removed.push(tab);};
 life.refresh();assert.equal(h.tabs.length,1);assert.equal(h.removed.length,1);life.stop();
});
