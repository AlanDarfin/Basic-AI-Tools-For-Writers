'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v5/workspace-ux.js','utf8');
const ctx={writerUi:(pt)=>pt,writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,writerKeyshotsBindings:()=>[['Alt-ArrowUp','move-up'],['Mod-Enter','insert-below']],console};
const v=vm.runInNewContext(source+'\n({writerWorkspaceMerge,writerWorkspaceCapture,writerWorkspaceApplyValues,writerWorkspaceSearchNormalize,writerWorkspaceSearchSections,writerWorkspaceFilterRows,writerWorkspaceNormalizeShortcut,writerWorkspaceHotkeyAudit,WRITER_WORKSPACE_PRESETS})',ctx);
let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name);}
function defaults(){
 return {workspaceProfiles:{},keyshots:{enabled:true,shortcuts:true,preset:'vscode'},easyTyping:{enabled:true,smartPaste:true,tabOut:true,smartBackspace:true},smartTypography:{enabled:true},extendedSyntax:{enabled:true},pandocSyntax:{enabled:true},autoGrammar:{enabled:false},writerV4Extras:{typewriter:{enabled:false,focusMode:false}},visibleModules:{keyshots:true,easyTyping:true}};
}
test('migration preserves unrelated and sensitive settings',()=>{
 const settings={...defaults(),apiKeys:{private:'not exported'},prompts:{deep:'prompt'},workspaceProfiles:{saved:[{name:'one',values:{keyshots:{enabled:false}}}]}};
 v.writerWorkspaceMerge(settings);
 assert.equal(settings.workspaceProfiles.saved.length,1);
 const snapshot=v.writerWorkspaceCapture(settings);
 assert.equal(JSON.stringify(snapshot).includes('not exported'),false);
 assert.equal(JSON.stringify(snapshot).includes('deep'),false);
 assert.equal(settings.apiKeys.private,'not exported');
});
test('novel and study presets apply only allowlisted editor preferences',()=>{
 const settings={...defaults(),apiKeys:{private:'retain'},writerV4Extras:{typewriter:{enabled:false,focusMode:false,centerPercent:0.42}}};
 const before=v.writerWorkspaceCapture(settings);
 v.writerWorkspaceApplyValues(settings,v.WRITER_WORKSPACE_PRESETS.novel.values);
 assert.equal(settings.smartTypography.enabled,true);
 assert.equal(settings.writerV4Extras.typewriter.enabled,true);
 v.writerWorkspaceApplyValues(settings,v.WRITER_WORKSPACE_PRESETS.study.values);
 assert.equal(settings.smartTypography.enabled,false);
 assert.equal(settings.keyshots.enabled,false);
 v.writerWorkspaceApplyValues(settings,before);
 assert.equal(settings.keyshots.enabled,true);
 assert.equal(settings.writerV4Extras.typewriter.enabled,false);
 assert.equal(settings.writerV4Extras.typewriter.centerPercent,0.42);
 assert.equal(settings.apiKeys.private,'retain');
});
test('malicious and unknown profile paths are ignored',()=>{
 const settings=defaults();
 v.writerWorkspaceApplyValues(settings,{__proto__:{polluted:true},keyshots:{preset:'evil',shortcuts:'yes',enabled:false},'apiKeys':{private:'overwrite'},'writerV4Extras.typewriter':{centerPercent:0,enabled:true}});
 assert.equal(settings.keyshots.preset,'vscode');
 assert.equal(settings.keyshots.shortcuts,true);
 assert.equal(settings.keyshots.enabled,false);
 assert.equal(settings.writerV4Extras.typewriter.enabled,true);
 assert.equal({}.polluted,undefined);
});
test('search supports Portuguese accents and categories',()=>{
 const sections=[['smartTypography','Tipografia inteligente'],['workspaceProfiles','Perfis rápidos'],['diagnostics','Diagnóstico'],['pandocSyntax','Pandoc Syntax']];
 assert.equal(v.writerWorkspaceSearchNormalize('Revisão'),'revisao');
 assert.equal(v.writerWorkspaceSearchSections(sections,'APÓSTROFOS')[0][0],'smartTypography');
 assert.equal(v.writerWorkspaceSearchSections(sections,'atalhos')[0][0],'diagnostics');
 assert.equal(v.writerWorkspaceSearchSections(sections,'perfil')[0][0],'workspaceProfiles');
 assert.equal(v.writerWorkspaceSearchSections(sections,'exportacao')[0][0],'pandocSyntax');
});
test('search hides only nonmatching setting rows and restores on clear',()=>{
 const rows=[{textContent:'Aspas curvas'},{textContent:'Travessões'},{textContent:'Apostrofos'}];
 const panel={querySelectorAll:()=>rows};
 assert.equal(v.writerWorkspaceFilterRows(panel,'Aspas'),1);
 assert.deepEqual(rows.map(x=>x.hidden),[false,true,true]);
 assert.equal(v.writerWorkspaceFilterRows(panel,''),3);
});
test('diagnostics reports duplicate known keymaps and distinguishes host uncertainty',()=>{
 const plugin={app:{isMobile:false},manifest:{id:'basic-ai-tool-for-writers'},settings:defaults()};
 const scan=v.writerWorkspaceHotkeyAudit(plugin);
 assert.equal(scan.items.length,5);
 assert.equal(scan.hostScanned,false);
 assert.equal(scan.duplicates.length,0);
 assert.equal(v.writerWorkspaceNormalizeShortcut('Ctrl-ArrowUp'),v.writerWorkspaceNormalizeShortcut('Mod-Up'));
 plugin.settings.keyshots.shortcuts=false;
 assert.equal(v.writerWorkspaceHotkeyAudit(plugin).items.length,3);
});
test('mobile runtime skips desktop Keyshots while preserving editing helpers',()=>{
 const settings=defaults(),app={isMobile:true};
 const scan=v.writerWorkspaceHotkeyAudit({settings,app,manifest:{id:'basic-ai-tool-for-writers'}});
 assert.equal(scan.items.some(item=>item.action.startsWith('Keyshots')),false);
 assert.ok(scan.items.some(item=>item.key==='Tab'));
 assert.ok(scan.items.some(item=>item.key==='Backspace'));
});
test('source, bundle and responsive UI remain synchronized',()=>{
 const main=fs.readFileSync('main.js','utf8'),css=fs.readFileSync('styles.css','utf8'),builder=fs.readFileSync('scripts/build-v3.js','utf8');
 assert.ok(main.includes('// v3 module: src/v5/workspace-ux.js'));
 assert.ok(main.includes('writerWorkspaceMerge(this.settings)'));
 assert.ok(main.includes('writerWorkspaceBindSearch('));
 assert.ok(main.includes('writerWorkspaceRenderHotkeys(this.plugin,panel)'));
 assert.ok(builder.includes("'v5/workspace-ux'"));
 assert.ok(css.includes('writer-v51-search'));
 assert.ok(css.includes('max-height:740px'));
});
console.log(passed+' Basic AI 5.1 tests passed.');
