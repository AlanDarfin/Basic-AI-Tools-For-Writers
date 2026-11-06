'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
const layout=fs.readFileSync(path.join(root,'src/v10/sidebar-width-1010.js'),'utf8');
const enhancements=fs.readFileSync(path.join(root,'src/v10/enhancements.js'),'utf8');
const quickSource=fs.readFileSync(path.join(root,'src/v12/mobile-ux-1201.js'),'utf8');
const settings=fs.readFileSync(path.join(root,'src/v12/settings-hub-1201.js'),'utf8');
const queue=[];
const callbacks=[];
const ctx={
 writerUi:(pt,en)=>en, writerModuleOn:()=>true,
 Menu:class{constructor(){this.items=[];} addItem(cb){const self=this;const item={setTitle(){return this;},setIcon(){return this;},onClick(fn){self.items.push(fn);return this;}};cb(item);}showAtPosition(){}},
 Notice:class{constructor(message){ctx.notices.push(message);}},
 notices:[],console,setTimeout:fn=>{queue.push(fn);return queue.length;}
};
vm.runInNewContext(quickSource+'\nglobalThis.quick={writerV1201NativeAction,writerV1201RibbonRegister,writerV1201QuickMenu,writerV1201Format,writerV1201Editor,writerV1201BookmarkCommand};',ctx);
const quick=ctx.quick;
test('v12 settings are integrated into existing tabs with no new groups',()=>{
 const navigation=main.slice(main.indexOf('class DictionarySettings extends PluginSettingTab'),
  main.indexOf('module.exports=class AlansOfflineDictionary'));
 for(const page of ['v12Overview','v12Writing','v12Images','v12Tasks','v12Privacy','v12Reader','v12Connections',
  'suiteEducation','suiteDatabase','suiteNumbering','suiteLongform'])
  assert.equal(navigation.includes("['"+page+"',msg("),false,page+' must not have its own tab');
 const groups=navigation.slice(navigation.indexOf('const groups=['),navigation.indexOf('const groupIcons='));
 assert.doesNotMatch(groups,/\['toolkit',/);
 assert.doesNotMatch(groups,/\['suites',/);
 for(const id of ['v9Toolbar','v9Pretty','v9Flow','v9Calendar','v9Lock','v10Tools','integrationsV4','projects'])
  assert.match(groups,new RegExp("'"+id+"'"));
 for(const fn of ['writerV1201SettingsOverview','writerV1201SettingsWriting','writerV1201SettingsImages',
  'writerV1201SettingsTasks','writerV1201SettingsPrivacy','writerV1201SettingsReader',
  'writerV1201SettingsConnections','writerV1201SettingsSuite'])
  assert.ok(navigation.includes(fn+'(this.plugin,panel'));
});
test('recent modules are no longer all appended to Files and shortcuts settings',()=>{
 assert.doesNotMatch(enhancements,/if\(typeof writerV12Settings==='function'\)writerV12Settings/);
 assert.doesNotMatch(enhancements,/if\(typeof writerV1011StudySettings==='function'\)writerV1011StudySettings/);
 for(const name of ['writerV1201SettingsOverview','writerV1201SettingsWriting','writerV1201SettingsImages','writerV1201SettingsTasks','writerV1201SettingsPrivacy','writerV1201SettingsReader','writerV1201SettingsConnections','writerV1201SettingsSuite'])
  assert.ok(settings.includes('function '+name+'('));
});
test('ribbon registers one actionable menu and five native commands',()=>{
 const registered=[],commands=[],plugin={
  addRibbonIcon:(_icon,_label,callback)=>{registered.push(callback);return {addClass(){}};},
  addCommand:command=>commands.push(command),
  register:()=>{},
  app:{workspace:{containerEl:{ownerDocument:{body:{classList:{remove(){}}}}}}}
 };
 quick.writerV1201RibbonRegister(plugin);
 assert.equal(registered.length,1);
 assert.equal(commands.length,5);
 assert.ok(commands.every(x=>typeof x.callback==='function'));
 assert.ok(commands.some(c=>c.id==='v1201-format'));
});
test('native options action opens after the first menu has closed',()=>{
 let clicks=0,refresh=0;
 const plugin={
  app:{commands:{listCommands:()=>[],executeCommandById:()=>{}}},
  writerV1010Refresh:()=>{refresh++;}
 };
 const target={isConnected:true,click:()=>{clicks++;}};
 assert.equal(quick.writerV1201NativeAction(plugin,target,'More options'),true);
 assert.equal(clicks,0,'Must defer nested popup until native sheet closes');
 assert.equal(plugin._writerV1010NativeActionPending,true);
 assert.equal(queue.length,1);
 queue.shift()();
 assert.equal(clicks,1);
 queue.shift()();
 assert.equal(plugin._writerV1010NativeActionPending,false);
 assert.equal(refresh,1);
});
test('bookmark action uses an installed bookmark command instead of an inert hidden button',()=>{
 let commandId='',clicks=0;
 const plugin={app:{commands:{
  listCommands:()=>[{id:'bookmarks:bookmark-current-file',name:'Bookmark current file'}],
  executeCommandById:id=>{commandId=id;}
 }}};
 const target={isConnected:true,click:()=>clicks++};
 assert.equal(quick.writerV1201NativeAction(plugin,target,'Marcador'),true);
 queue.shift()();
 queue.shift()();
 assert.equal(commandId,'bookmarks:bookmark-current-file');
 assert.equal(clicks,0);
});
test('native sidebars delegate to the stabilized action relay with the label',()=>{
 assert.match(layout,/writerV1201NativeAction\(plugin,action,label\)/);
 assert.match(layout,/writerV1012OpenNativeAction\(action,sort,plugin,label\)/);
 assert.match(enhancements,/writerV1201RibbonRegister\(plugin\)/);
});
