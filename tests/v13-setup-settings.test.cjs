'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function runtime(){
 const calls=[],context={writerUi:(_pt,en)=>en,writerModuleOn:(p,id)=>p.settings.visibleModules?.[id]!==false};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('src/v4/modules.js','utf8')+'\n'+fs.readFileSync('src/v13/settings-catalog.js','utf8')+'\n'+fs.readFileSync('src/v13/setup-guide.js','utf8')+'\nglobalThis.api={WRITER_MODULES,WRITER_SETTINGS_CATALOG,WRITER_SETTINGS_GROUPS,writerSettingsSections,writerSettingsGroups,writerSettingsNavigation,writerSettingsToggleFavorite,writerQuickStartChoices,writerQuickStartApply,writerQuickStartRegister};',context);
 context.calls=calls;
 return {api:context.api,context,calls};
}
test('every existing configuration route remains available when all features are off',()=>{
 const {api}=runtime();
 const ids=api.writerSettingsSections({settings:{visibleModules:Object.fromEntries(api.WRITER_MODULES.map(([id])=>[id,false]))}}).map(([id])=>id);
 const legacy=['general','modules','workspaceProfiles','diagnostics','homepage','soundscapes','v9Toolbar','v9Explorer','v9Pretty','v9Flow','v9Pomodoro','v9Spaces','v9Lock','v9Calendar','v10Bookshelf','v10Tools','dictionary','translation','assistant','projects','v7Worldbuilding','complements','variants','writingProfiles','integrationsV4','keyshots','extendedSyntax','pandocSyntax','v6Markdown','smartInsert','typing','clickClack','cursor','snapshots','projectTasks','bookNavigation','virtualContent','writingWidgets','research','sessionDrafts','abbreviations','anotherName','viewMode','templates','unicode','toc','tts','v6Reading','v6Linter','review','reviewAI','providers','models','prompts'];
 for(const id of legacy)assert.ok(ids.includes(id),id);
 assert.equal(new Set(ids).size,ids.length);
 const assigned=api.writerSettingsGroups().flatMap(([, ,sections])=>sections);
 assert.equal(assigned.length,ids.length);assert.equal(new Set(assigned).size,ids.length);
 for(const item of api.WRITER_SETTINGS_CATALOG){assert.ok(item.pt&&item.en&&item.descriptionPt&&item.descriptionEn,item.id);}
});
test('favorites retain valid unique routes and preserve unrelated navigation preferences',()=>{
 const {api}=runtime(),settings={settingsNavigation:{favorites:['keyshots','keyshots','missing','providers',null],custom:'keep'},aiKeys:{example:'private'}};
 const cfg=api.writerSettingsNavigation(settings);
 assert.equal(cfg,settings.settingsNavigation);assert.deepEqual([...cfg.favorites],['keyshots','providers']);
 assert.equal(api.writerSettingsToggleFavorite(settings,'keyshots'),true);assert.deepEqual([...cfg.favorites],['providers']);
 assert.equal(api.writerSettingsToggleFavorite(settings,'missing'),false);
 assert.equal(api.writerSettingsToggleFavorite(settings,'study'),true);assert.deepEqual([...cfg.favorites],['providers','study']);
 assert.equal(cfg.custom,'keep');assert.equal(settings.aiKeys.example,'private');
});
test('favorite limit keeps existing selections until the user unpins one',()=>{
 const {api}=runtime(),ids=api.writerSettingsSections().map(([id])=>id),settings={settingsNavigation:{favorites:ids.slice(0,12)}};
 assert.equal(api.writerSettingsToggleFavorite(settings,ids[12]),false);assert.equal(settings.settingsNavigation.favorites.length,12);
 assert.equal(api.writerSettingsToggleFavorite(settings,ids[0]),true);assert.equal(api.writerSettingsToggleFavorite(settings,ids[12]),true);
 assert.equal(settings.settingsNavigation.favorites.length,12);
});
test('quick-start presets and custom choices cover every feature without changing current settings',()=>{
 const {api}=runtime(),settings={visibleModules:{dictionary:false,study:true,legacyFlag:false},autoGrammar:{enabled:true}};
 const before=JSON.stringify(settings);
 for(const preset of ['essentials','books','study','custom']){
  const values=api.writerQuickStartChoices(settings,preset);
  assert.equal(Object.keys(values).length,api.WRITER_MODULES.length);
  assert.ok(Object.values(values).every(value=>typeof value==='boolean'));
 }
 assert.equal(api.writerQuickStartChoices(settings,'books').projects,true);
 assert.equal(api.writerQuickStartChoices(settings,'study').study,true);
 assert.equal(api.writerQuickStartChoices(settings,'custom').dictionary,false);
 assert.equal(api.writerQuickStartChoices(settings,'custom').study,true);
 assert.equal(JSON.stringify(settings),before);
});
test('applying quick start saves feature choices before refreshing and preserves notes/preferences',async()=>{
 const {api}=runtime(),events=[];
 const settings={visibleModules:{dictionary:true,study:false,legacyFlag:false},aiKeys:{openai:'keep'},prompts:{writing:'Keep my voice'},autoGrammar:{enabled:false},manuscript:'Untouched'};
 const plugin={settings,saveSettings:async()=>{events.push('save');},refreshModuleVisibility:()=>events.push('refresh'),writerV91Sound:{pause:()=>events.push('pause'),emit:()=>events.push('emit')}};
 await api.writerQuickStartApply(plugin,{dictionary:false,study:true,unrecognized:true,chat:'true'});
 assert.equal(settings.visibleModules.dictionary,false);assert.equal(settings.visibleModules.study,true);
 assert.equal(settings.visibleModules.legacyFlag,false);assert.equal(Object.hasOwn(settings.visibleModules,'unrecognized'),false);
 assert.equal(Object.hasOwn(settings.visibleModules,'chat'),false);assert.equal(events[0],'save');assert.equal(events[1],'refresh');
 assert.equal(settings.quickStart.status,'complete');assert.equal(settings.aiKeys.openai,'keep');assert.equal(settings.prompts.writing,'Keep my voice');assert.equal(settings.manuscript,'Untouched');
});
test('failed quick-start save restores previous feature object and completion state',async()=>{
 const {api}=runtime(),previous={dictionary:true},priorStart={status:'deferred'},settings={visibleModules:previous,quickStart:priorStart};let refreshed=false;
 await assert.rejects(api.writerQuickStartApply({settings,saveSettings:async()=>{throw Error('Disk full');},refreshModuleVisibility:()=>{refreshed=true;}},{dictionary:false}),/Disk full/);
 assert.equal(settings.visibleModules,previous);assert.equal(settings.quickStart,priorStart);assert.equal(refreshed,false);
});
test('upgrades register a reopen command without scheduling or changing feature choices',()=>{
 const {api,context,calls}=runtime(),commands=[];let ready=false;
 vm.runInContext('writerQuickStartOpen=(plugin,initial)=>calls.push({plugin,initial});',context);
 const settings={visibleModules:{dictionary:false}};
 const plugin={settings,addCommand:command=>commands.push(command),register:()=>{},app:{workspace:{onLayoutReady:()=>{ready=true;}}}};
 api.writerQuickStartRegister(plugin,false);
 assert.equal(ready,false);assert.equal(calls.length,0);assert.equal(settings.visibleModules.dictionary,false);
 assert.equal(commands[0].id,'v137-quick-start');commands[0].callback();assert.equal(calls.length,1);assert.equal(calls[0].initial,undefined);
});
test('first-run dialog waits for layout and never opens after unload or completion',()=>{
 const {api,context,calls}=runtime();let ready,stop;
 vm.runInContext('writerQuickStartOpen=(plugin,initial)=>calls.push(initial);',context);
 const plugin={settings:{},addCommand:()=>{},register:callback=>{stop=callback;},app:{workspace:{onLayoutReady:callback=>{ready=callback;}}}};
 api.writerQuickStartRegister(plugin,true);assert.equal(calls.length,0);ready();assert.deepEqual(calls,[true]);
 plugin.settings.quickStart={status:'deferred'};ready();assert.equal(calls.length,1);
 delete plugin.settings.quickStart;stop();ready();assert.equal(calls.length,1);
});
