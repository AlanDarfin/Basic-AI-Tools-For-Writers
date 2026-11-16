'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');
const copy=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

class Element{
 constructor(options={},document=null){this.attributes={...options.attr};this.text=options.text||'';this.children=[];this.events={};this.value='';this.disabled=false;this.isConnected=true;this.ownerDocument=document;}
 addClass(){}
 createEl(tag,options={}){const child=new Element(options,this.ownerDocument);child.tag=tag;this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 setText(value){this.text=value;}
 empty(){this.children=[];}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]??null;}
 addEventListener(name,callback){this.events[name]=callback;}
 all(){return this.children.flatMap(child=>[child,...child.all()]);}
 querySelectorAll(selector){return this.all().filter(child=>{
  const attr=/\[([^=\]]+)(?:="([^"]*)")?\]/.exec(selector);
  return attr&&child.getAttribute(attr[1])!==null&&(attr[2]===undefined||child.getAttribute(attr[1])===attr[2])&&(!selector.includes(':not(:disabled)')||!child.disabled);
 });}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 contains(child){return child===this||this.all().includes(child);}
 focus(){this.ownerDocument.activeElement=this;}
}
class Setting{
 constructor(parent){this.settingEl=parent.createDiv();}
 setName(value){this.settingEl.setAttribute('data-setting-name',value);return this;}
 setDesc(){return this;}
 addButton(register){
  const element=this.settingEl.createEl('button');
  const control={buttonEl:element,setButtonText:value=>{element.text=value;return control;},setCta:()=>control,setDisabled:value=>{element.disabled=value;return control;},onClick:callback=>{element.events.click=callback;return control;}};
  register(control);return this;
 }
 addDropdown(register){
  const element=this.settingEl.createEl('select');
  const control={selectEl:element,addOption:()=>control,setValue:value=>{element.value=value;return control;},onChange:callback=>{element.events.change=callback;return control;}};
  register(control);return this;
 }
 addToggle(register){const control={setValue:()=>control,onChange:()=>control};register(control);return this;}
 addTextArea(register){const control={inputEl:{},setValue:()=>control,onChange:()=>control};register(control);return this;}
}
function profileRuntime(language='en'){
 const notices=[],refreshes=[],commands=[],cleanups=[],document={activeElement:null};
 const root=new Element({},document);document.activeElement=root;
 const context={console,Setting,writerUi:(pt,en)=>language==='pt'?pt:en,Notice:class{constructor(message){notices.push(message);}},refreshes,
  FuzzySuggestModal:class{open(){context.picker=this;}}};
 const api=vm.runInNewContext(read('src/v5/workspace-ux.js')+'\n'+read('src/v6/project-workspace.js')+'\nwriterV5RefreshEditors=()=>refreshes.push("editors");\n({WriterWorkspaceProfiles,writerV6ProjectPreferencesRender});',context);
 const previousUndo={easyTyping:{enabled:false}},saved=[{name:'Existing',values:{easyTyping:{enabled:true}}}];
 const settings={workspaceProfiles:{undo:previousUndo,lastPreset:'Previous',saved},easyTyping:{enabled:true},smartTypography:{enabled:true},aiKeys:{private:'retain'},prompts:{writing:'Keep my voice'},visibleModules:{easyTyping:false}};
 const plugin={settings,app:{},saveSettings:async()=>{},register:callback=>cleanups.push(callback),addCommand:command=>commands.push(command),refreshModuleVisibility:()=>refreshes.push('modules'),writerV4Extras:{updateTypewriterClass:()=>refreshes.push('typewriter')}};
 const controller=new api.WriterWorkspaceProfiles(plugin);
 return {api,controller,plugin,settings,notices,refreshes,root,commands,context,stop:()=>cleanups.forEach(cleanup=>cleanup())};
}

test('failed profile application restores edited fields, absent keys and the previous undo without touching private settings',async()=>{
 const h=profileRuntime(),before=copy(h.settings),undo=h.settings.workspaceProfiles.undo;
 h.plugin.saveSettings=async()=>{throw Error('Disk full');};
 await assert.rejects(h.controller.apply('Next',{easyTyping:{enabled:false,smartPaste:true}}),/Disk full/);
 assert.deepEqual(h.settings,before);assert.equal(h.settings.workspaceProfiles.undo,undo);
 assert.equal(Object.hasOwn(h.settings.easyTyping,'smartPaste'),false);assert.equal(h.controller.busy,false);
 assert.deepEqual(h.refreshes,[]);assert.deepEqual(h.notices,[]);
});

test('a failed undo keeps its recovery snapshot and can be retried successfully',async()=>{
 const h=profileRuntime();await h.controller.apply('Next',{easyTyping:{enabled:false}});
 const before=copy(h.settings),undo=h.settings.workspaceProfiles.undo;
 h.plugin.saveSettings=async()=>{throw Error('Disk full');};
 await assert.rejects(h.controller.undo(),/Disk full/);
 assert.deepEqual(copy(h.settings),before);assert.equal(h.settings.workspaceProfiles.undo,undo);
 h.plugin.saveSettings=async()=>{};await h.controller.undo();
 assert.equal(h.settings.easyTyping.enabled,true);assert.equal(h.settings.workspaceProfiles.undo,null);
});

test('failed save and deletion retain the original saved profiles, including entries at the ten-profile limit',async()=>{
 const h=profileRuntime();h.settings.workspaceProfiles.saved=Array.from({length:10},(_,i)=>({name:'Profile '+i,values:{easyTyping:{enabled:true}}}));
 const saved=h.settings.workspaceProfiles.saved,before=copy(saved);
 h.plugin.saveSettings=async()=>{throw Error('Disk full');};
 await assert.rejects(h.controller.saveCustom('Unsaved'),/Disk full/);
 assert.equal(h.settings.workspaceProfiles.saved,saved);assert.deepEqual(saved,before);
 await assert.rejects(h.controller.deleteCustom('Profile 0'),/Disk full/);
 assert.equal(h.settings.workspaceProfiles.saved,saved);assert.deepEqual(saved,before);
 h.plugin.saveSettings=async()=>{};await h.controller.deleteCustom('Profile 0');
 assert.equal(h.settings.workspaceProfiles.saved.length,9);assert.equal(h.settings.workspaceProfiles.saved.some(item=>item.name==='Profile 0'),false);
});

test('pending profile writes reject overlapping apply, undo, save and delete without replacing the original recovery state',async()=>{
 const h=profileRuntime(),save=deferred();let writes=0;
 h.plugin.saveSettings=()=>{writes++;return save.promise;};
 const pending=h.controller.apply('First',{easyTyping:{enabled:false}}),undo=h.settings.workspaceProfiles.undo;
 assert.equal(h.controller.busy,true);
 assert.deepEqual(await Promise.all([h.controller.apply('Second',{easyTyping:{enabled:true}}),h.controller.undo(),h.controller.saveCustom('Other'),h.controller.deleteCustom('Existing')]),[false,false,false,false]);
 assert.equal(writes,1);assert.equal(h.settings.workspaceProfiles.undo,undo);assert.equal(h.settings.workspaceProfiles.lastPreset,'First');
 save.resolve();assert.equal(await pending,true);assert.equal(h.controller.busy,false);
 h.plugin.saveSettings=async()=>{};await h.controller.undo();assert.equal(h.settings.easyTyping.enabled,true);
});

test('profile rollback leaves unrelated preferences and newer external values intact',async()=>{
 const h=profileRuntime(),save=deferred();h.plugin.saveSettings=()=>save.promise;
 const pending=h.controller.apply('Next',{easyTyping:{enabled:false,smartPaste:true}});
 h.settings.smartTypography.enabled=false;h.settings.prompts.writing='Changed elsewhere';h.settings.easyTyping.smartPaste=false;h.settings.workspaceProfiles.lastPreset='External';
 save.reject(Error('Disk full'));await assert.rejects(pending,/Disk full/);
 assert.equal(h.settings.easyTyping.enabled,true);assert.equal(h.settings.easyTyping.smartPaste,false);
 assert.equal(h.settings.smartTypography.enabled,false);assert.equal(h.settings.prompts.writing,'Changed elsewhere');assert.equal(h.settings.workspaceProfiles.lastPreset,'External');
});

test('profile buttons disable during persistence and report bilingual failures without losing retry or undo',async()=>{
 for(const language of ['en','pt']){
  const h=profileRuntime(language),save=deferred();h.plugin.saveSettings=()=>save.promise;h.controller.renderSettings(h.root);
  const action=name=>h.root.querySelector('[data-profile-action="'+name+'"]');
  const pending=action('apply').events.click();
  assert.ok(h.root.querySelectorAll('[data-profile-action]').every(control=>control.disabled));
  save.reject(Error('Disk full'));await pending;
  assert.equal(action('apply').disabled,false);assert.equal(action('restore').disabled,false);
  assert.equal(h.settings.easyTyping.enabled,true);assert.equal(h.settings.workspaceProfiles.lastPreset,'Previous');
  assert.match(h.notices[0],language==='en'?/Could not save the profile.*Previous choices/:/Não foi possível salvar o perfil.*escolhas anteriores/);
 }
});

test('profile picker and undo command handle save rejection through notices',async()=>{
 const h=profileRuntime();h.plugin.saveSettings=async()=>{throw Error('Disk full');};
 h.controller.openPicker();await h.context.picker.onChooseItem({name:'Next',values:{easyTyping:{enabled:false}}});
 h.controller.register();const command=h.commands.find(item=>item.id==='v51-undo-workspace-profile');
 assert.equal(command.checkCallback(false),true);await new Promise(setImmediate);
 assert.equal(h.notices.length,2);assert.equal(h.settings.easyTyping.enabled,true);assert.ok(h.settings.workspaceProfiles.undo);
});

test('the suggested project profile button also reports persistence failure and retains the prior editing preferences',async()=>{
 const h=profileRuntime(),before=copy(h.settings);h.plugin.writerWorkspaceProfiles=h.controller;h.plugin.saveSettings=async()=>{throw Error('Disk full');};
 const preferences={writingSettings:{writingPreset:'novel'}};
 h.api.writerV6ProjectPreferencesRender({plugin:h.plugin,prefs:()=>preferences},h.root,{file:{path:'Book.md'}});
 const row=h.root.querySelector('[data-setting-name="Profile for this project"]'),button=row.children.find(item=>item.tag==='button');
 await button.events.click();assert.deepEqual(h.settings,before);assert.match(h.notices[0],/Could not save the profile/);
});

test('profile operations already saving at unload preserve their write but never refresh UI or show notices afterward',async()=>{
 for(const action of ['apply','undo','save','delete']){
  const h=profileRuntime(),save=deferred();h.plugin.saveSettings=()=>save.promise;h.controller.register();h.controller.renderSettings(h.root);
  const operations={apply:()=>h.controller.apply('Next',{easyTyping:{enabled:false}}),undo:()=>h.controller.undo(),save:()=>h.controller.saveCustom('Next'),delete:()=>h.controller.deleteCustom('Existing')};
  const pending=operations[action]();h.stop();save.resolve();assert.equal(await pending,false,action);
  assert.deepEqual(h.refreshes,[],action);assert.deepEqual(h.notices,[],action);
  let writes=0;h.plugin.saveSettings=async()=>{writes++;};
  assert.deepEqual(await Promise.all([h.controller.apply('Late',{}),h.controller.undo(),h.controller.saveCustom('Late'),h.controller.deleteCustom('Next')]),[false,false,false,false]);
  assert.equal(writes,0);assert.equal(h.commands.find(item=>item.id==='v51-undo-workspace-profile').checkCallback(false),false);
 }
});

test('a profile save failure after unload rolls back silently through its UI handler',async()=>{
 const h=profileRuntime(),save=deferred(),before=copy(h.settings);h.plugin.saveSettings=()=>save.promise;h.controller.register();h.controller.renderSettings(h.root);
 const pending=h.root.querySelector('[data-profile-action="apply"]').events.click();h.stop();save.reject(Error('Disk full'));await pending;
 assert.deepEqual(h.settings,before);assert.deepEqual(h.refreshes,[]);assert.deepEqual(h.notices,[]);
});

test('unload between persistence completion and the profile action continuation also leaves UI inactive',async()=>{
 const h=profileRuntime(),save=deferred();h.plugin.saveSettings=()=>save.promise;h.controller.register();
 const pending=h.controller.apply('Next',{easyTyping:{enabled:false}});save.resolve();queueMicrotask(()=>h.stop());
 assert.equal(await pending,false);assert.deepEqual(h.refreshes,[]);assert.deepEqual(h.notices,[]);
});

function quickStartRuntime(){
 const notices=[],commands=[],cleanups=[],refreshes=[],document={activeElement:null};
 class Modal{
  constructor(){this.modalEl=new Element({},document);this.contentEl=new Element({},document);this.closed=false;}
  setTitle(){}
  open(){this.onOpen?.();}
  close(){this.closed=true;this.modalEl.isConnected=false;this.onClose?.();}
 }
 const context={console,Modal,Setting,writerUi:(_pt,en)=>en,writerV13SearchText:value=>value.toLowerCase(),writerSettingsLabelControls(){},Notice:class{constructor(message){notices.push(message);}}};
 const api=vm.runInNewContext(read('src/v4/modules.js')+'\n'+read('src/v13/setup-guide.js')+'\n({writerQuickStartOpen,writerQuickStartApply,writerQuickStartRegister});',context);
 const plugin={settings:{visibleModules:{dictionary:true}},app:{workspace:{}},saveSettings:async()=>{},register:callback=>cleanups.push(callback),addCommand:command=>commands.push(command),refreshModuleVisibility:()=>refreshes.push('modules'),writerSettingsTab:{display:()=>refreshes.push('settings')}};
 api.writerQuickStartRegister(plugin,false);
 return {api,plugin,notices,commands,refreshes,stop:()=>cleanups.forEach(cleanup=>cleanup()),button:(modal,text)=>modal.contentEl.all().find(item=>item.text===text)};
}

test('unload closes a busy first-run dialog immediately and a completed write cannot refresh unloaded UI',async()=>{
 const h=quickStartRuntime(),save=deferred();let writes=0;
 h.plugin.saveSettings=()=>{writes++;return save.promise;};
 const modal=h.api.writerQuickStartOpen(h.plugin,true),apply=h.button(modal,'Apply choices'),pending=apply.events.click();
 h.stop();assert.equal(modal.closed,true);assert.equal(modal.modalEl.isConnected,false);assert.equal(writes,1);
 assert.equal(h.plugin._writerQuickStartModal,null);save.resolve();await pending;
 assert.deepEqual(h.refreshes,[]);assert.deepEqual(h.notices,[]);assert.equal(h.plugin.settings.quickStart.status,'complete');
 assert.equal(h.api.writerQuickStartOpen(h.plugin),null);assert.equal(h.commands[0].callback(),null);
 await apply.events.click();assert.equal(writes,1);
});

test('a failed quick-start write after unload rolls back silently and does not create a deferred write',async()=>{
 const h=quickStartRuntime(),save=deferred(),previous=h.plugin.settings.visibleModules;let writes=0;
 h.plugin.saveSettings=()=>{writes++;return save.promise;};
 const modal=h.api.writerQuickStartOpen(h.plugin,true),pending=h.button(modal,'Apply choices').events.click();
 h.stop();save.reject(Error('Disk full'));await pending;
 assert.equal(h.plugin.settings.visibleModules,previous);assert.equal(h.plugin.settings.quickStart,undefined);
 assert.equal(writes,1);assert.deepEqual(h.refreshes,[]);assert.deepEqual(h.notices,[]);
});

test('first-run unload without applying leaves setup pending, while an explicit later choice is saved',async()=>{
 const h=quickStartRuntime();let writes=0;h.plugin.saveSettings=async()=>{writes++;};
 const modal=h.api.writerQuickStartOpen(h.plugin,true);h.stop();assert.equal(modal.closed,true);assert.equal(writes,0);assert.equal(h.plugin.settings.quickStart,undefined);
 const later=quickStartRuntime();later.plugin.saveSettings=async()=>{writes++;};
 later.button(later.api.writerQuickStartOpen(later.plugin,true),'Set up later').events.click();
 assert.equal(writes,1);assert.equal(later.plugin.settings.quickStart.status,'deferred');
});

test('ordinary quick-start application still persists choices and refreshes the open settings page',async()=>{
 const h=quickStartRuntime();let writes=0;h.plugin.saveSettings=async()=>{writes++;};
 const modal=h.api.writerQuickStartOpen(h.plugin,true);await h.button(modal,'Apply choices').events.click();
 assert.equal(modal.closed,true);assert.equal(writes,1);assert.equal(h.plugin.settings.quickStart.status,'complete');
 assert.deepEqual(h.refreshes,['modules','settings']);assert.deepEqual(h.notices,[]);
});

test('a failed quick-start save does not overwrite settings replaced by a newer external change',async()=>{
 const h=quickStartRuntime(),save=deferred();h.plugin.saveSettings=()=>save.promise;
 const pending=h.api.writerQuickStartApply(h.plugin,{dictionary:false}),newModules={dictionary:true,review:false},newSetup={version:1,status:'deferred'};
 h.plugin.settings.visibleModules=newModules;h.plugin.settings.quickStart=newSetup;
 save.reject(Error('Disk full'));await assert.rejects(pending,/Disk full/);
 assert.equal(h.plugin.settings.visibleModules,newModules);assert.equal(h.plugin.settings.quickStart,newSetup);assert.deepEqual(h.refreshes,[]);
});
