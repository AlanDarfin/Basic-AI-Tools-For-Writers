'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function fixture(language='en'){
 const rows=[],saves=[];let refreshes=0;
 class Setting{
  constructor(){this.row={};rows.push(this.row);}
  setName(value){this.row.name=value;return this;}setDesc(value){this.row.description=value;return this;}
  control(type,register){const control={type,options:{},addOption(key,label){this.options[key]=label;return this;},setValue(value){this.value=value;return this;},onChange(callback){this.change=callback;return this;}};this.row.control=control;register(control);return this;}
  addToggle(register){return this.control('toggle',register);}addDropdown(register){return this.control('dropdown',register);}
 }
 const source=['src/v13/settings-catalog.js','src/v13/companion-bridge.js','src/v13/native-support-settings.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
 const api=vm.runInNewContext(source+'\n({writerSettingsSections,writerSettingsResolveSection,writerSettingsNavigation,writerNativeFloatingSettings,writerNativeExplorerSupportSettings})',{
  Setting,writerUi:(pt,en)=>language==='pt'?pt:en
 });
 const settings={v12Toolkit:{enabled:false,integrations:false},companionCompatibility:{enabledById:{snailkit:false},ttsProvider:'ahmed-toolkit',allowToolkitOnline:false,mobileLayout:false,explorerIcons:'basic'},aiKeys:{example:'private-original'}};
 const plugin={settings,saveSettings:async()=>saves.push(structuredClone(settings)),_writerCompanionManager:{refresh:()=>refreshes++}};
 return {api,plugin,rows,saves,refreshes:()=>refreshes};
}
test('removed integration category redirects saved destinations and favorites to native editing',()=>{
 const h=fixture(),ids=h.api.writerSettingsSections().map(([id])=>id);
 assert.equal(ids.includes('integrationsV4'),false);assert.ok(ids.includes('editorAdvanced'));
 assert.equal(h.api.writerSettingsResolveSection('integrationsV4'),'editorAdvanced');
 assert.equal(h.api.writerSettingsResolveSection('tts'),'tts');
 h.plugin.settings.settingsNavigation={favorites:['integrationsV4','editorAdvanced','tts','missing'],custom:'keep'};
 const cfg=h.api.writerSettingsNavigation(h.plugin.settings);
 assert.deepEqual([...cfg.favorites],['editorAdvanced','tts']);assert.equal(cfg.custom,'keep');
 assert.equal(h.plugin.settings.aiKeys.example,'private-original');assert.equal(h.saves.length,0);
});
test('native appearance and explorer controls are bilingual and do not invoke companion commands',()=>{
 for(const language of ['en','pt']){
  const h=fixture(language);h.api.writerNativeFloatingSettings(h.plugin,{});h.api.writerNativeExplorerSupportSettings(h.plugin,{});
  assert.equal(h.rows.length,2);assert.equal(h.rows[0].control.value,false);
  assert.match(h.rows[0].name,language==='pt'?/controles flutuantes/:/floating controls/);
  assert.equal(h.rows[1].control.value,'basic');assert.equal(h.saves.length,0);assert.equal(h.refreshes(),0);
 }
});
test('native layout choices retain unrelated preferences and notify the existing coordinator after save',async()=>{
 const h=fixture(),cfg=h.plugin.settings.companionCompatibility;
 h.api.writerNativeFloatingSettings(h.plugin,{});h.api.writerNativeExplorerSupportSettings(h.plugin,{});
 await h.rows[0].control.change(true);await h.rows[1].control.change('companion');
 assert.equal(h.plugin.settings.companionCompatibility,cfg);assert.equal(cfg.mobileLayout,true);assert.equal(cfg.explorerIcons,'companion');
 assert.equal(cfg.enabledById.snailkit,false);assert.equal(cfg.ttsProvider,'ahmed-toolkit');assert.equal(cfg.allowToolkitOnline,false);
 assert.equal(h.plugin.settings.v12Toolkit.enabled,false);assert.equal(h.plugin.settings.v12Toolkit.integrations,false);
 assert.equal(h.plugin.settings.aiKeys.example,'private-original');assert.equal(h.saves.length,2);assert.equal(h.refreshes(),2);
 await h.rows[1].control.change('unknown-source');assert.equal(h.saves.length,2);assert.equal(cfg.explorerIcons,'companion');
});
