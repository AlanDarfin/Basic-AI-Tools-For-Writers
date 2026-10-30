'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v4/modules.js','utf8');
const api=vm.runInNewContext(source+'\n({WRITER_MODULES,writerMergeModules,writerModuleOn,writerVisibleTabs,writerDiagnostics})',{
 writerUi:(pt,en)=>pt,URL,console
});
const plain=x=>JSON.parse(JSON.stringify(x));
const {WRITER_MODULES,writerMergeModules,writerModuleOn,writerVisibleTabs,writerDiagnostics}=api;
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS',name);};
test('migrate old settings and preserve notes, profile and history data',()=>{
 const existing={projectsData:{'My Book':{goal:2000}},writerV4Extras:{comments:{'A.md':[{body:'old note'}]}},prompts:{translate:'Custom prompt'}};
 writerMergeModules(existing);
 assert.ok(WRITER_MODULES.length>=15);
 assert.equal(existing.visibleModules.translation,true);
 assert.equal(existing.projectsData['My Book'].goal,2000);
 assert.equal(existing.writerV4Extras.comments['A.md'][0].body,'old note');
 assert.equal(existing.prompts.translate,'Custom prompt');
});
test('disable translator only without disabling dictionary, chat or review',()=>{
 const plugin={settings:{visibleModules:{translation:false}}};
 writerMergeModules(plugin.settings);
 assert.equal(writerModuleOn(plugin,'translation'),false);
 assert.equal(writerModuleOn(plugin,'chat'),true);
 assert.equal(writerModuleOn(plugin,'dictionary'),true);
 const tabs=[['definition','Dictionary'],['translation','Translator'],['chat','Chat'],['review','Review']];
 assert.deepEqual(plain(writerVisibleTabs(plugin,tabs).map(x=>x[0])),['definition','chat','review']);
 plugin.settings.visibleModules.translation=true;
 assert.equal(writerVisibleTabs(plugin,tabs).length,4);
});
test('existing preference false survives migration, unrelated legacy keys survive',()=>{
 const settings={visibleModules:{tts:false,customPluginFlag:'preserve'},apiKeys:{id:'secret'}};
 writerMergeModules(settings);
 assert.equal(settings.visibleModules.tts,false);
 assert.equal(settings.visibleModules.customPluginFlag,'preserve');
 assert.equal(settings.apiKeys.id,'secret');
});
test('diagnostics never expose API keys or credentials from endpoint',()=>{
 const plugin={
  manifest:{version:'4.0.0-rc.1'},
  app:{isMobile:true,vault:{getMarkdownFiles:()=>[{path:'Book.md'}]}},
  settings:{
   visibleModules:{translation:false},autoGrammar:{enabled:true},
   aiKeys:{openai:'top-secret-key'},
   reviewEndpoint:'https://user:private@languagetool.example.com/v2/check?apiKey=secret',
   snapshots:{enabled:true}
  }
 };
 writerMergeModules(plugin.settings);
 const rows=writerDiagnostics(plugin),shown=JSON.stringify(rows);
 assert.ok(shown.includes('4.0.0-rc.1'));
 assert.ok(shown.includes('languagetool.example.com'));
 assert.ok(!shown.includes('top-secret-key'));
 assert.ok(!shown.includes('private'));
 assert.ok(!shown.includes('apiKey=secret'));
});
test('standalone views and Longform respect optional modules and skip hidden panels',()=>{
 const main=fs.readFileSync('main.js','utf8');
 const tools=fs.readFileSync('src/v3/workspace.js','utf8');
 const projects=fs.readFileSync('projects.js','utf8');
 const grammar=fs.readFileSync('src/v4/auto-grammar.js','utf8');
 const integrations=fs.readFileSync('src/v4/integrations.js','utf8');
 assert.ok(main.includes('this.applyModuleVisibility()'));
 assert.ok(main.includes("settingsFlags={dictionary:'dictionary'"));
 assert.ok(main.includes('writerRenderModuleSettings(this.plugin,panel'));
 assert.ok(main.includes('writerRenderDiagnostics(this.plugin,panel'));
 assert.ok(main.includes("writerModuleOn(this,'translation')"));
 assert.ok(main.includes("this.refreshModuleVisibility()"));
 assert.ok(tools.includes("writerModuleOn(this.plugin,feature)"));
 assert.ok(projects.includes("this.activeTab==='scenes')this.drawScenes"));
 assert.ok(projects.includes("writerModuleOn(this.plugin,'comments')"));
 assert.ok(grammar.includes("writerModuleOn(this.plugin,'review')"));
 assert.ok(integrations.includes("writerModuleOn(this.plugin,'mentions')"));
 assert.ok(integrations.includes("writerModuleOn(this.plugin,'wordwise')"));
 assert.ok(main.includes('// v3 module: src/v4/modules.js'));
});
console.log(passed+' RC feature module tests passed.');
