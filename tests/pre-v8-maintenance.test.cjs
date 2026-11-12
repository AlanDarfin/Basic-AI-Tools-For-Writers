'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('src/v4/auto-grammar.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const tools=fs.readFileSync('src/v3/workspace.js','utf8');
const read=()=>new Map();
function externalMethods(){
 const from=main.indexOf('  externalLanguageTool(){'),end=main.indexOf('  async checkGrammar(text){',from);
 assert.ok(from>0&&end>from);
 return vm.runInNewContext(fs.readFileSync('src/v13/grammar-companion.js','utf8')+
  '\nnew (class {'+main.slice(from,end)+'})()',{
   writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
   writerUi:pt=>pt,Notice:class{},msg:pt=>pt
  });
}

test('only changed paragraph is rechecked after an automatic editor change',async()=>{
 const file={extension:'md',path:'Draft.md'};
 const old='Primeiro parágrafo com palavras.\n\nAqui nao está correto. Outra frase.\n\nÚltima parte sem erros.';
 const newer=old.replace('nao','não');
 const cache=[{offset:4,length:4},{offset:old.lastIndexOf('Última'),length:5}];
 let local=null,full=0;
 const view={
  activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,reviewBusy:false,
  grammarCheckedPath:file.path,grammarCheckedSource:old,
  async recheckGrammarCorrection(...args){local=args;return false;},
  async reviewFile(){full++;}
 };
 const plugin={
  app:{workspace:{getLeavesOfType:()=>[{view}]},vault:{getAbstractFileByPath:()=>file}},
  settings:{reviewEngine:'basic',autoGrammar:{enabled:true,delayMs:2000,minIntervalMs:6000,maxWindowChars:12000}},
  reviewMarkedPath:file.path,reviewSource:old,reviewMatches:cache
 };
 const {WriterAutoGrammar,writerGrammarLocalScopes,writerGrammarDiffSpan}=vm.runInNewContext(
  src+'\n({WriterAutoGrammar,writerGrammarLocalScopes,writerGrammarDiffSpan})',
  {VIEW:'basic-ai-tool-for-writers',writerModuleOn:()=>true,writerCurrentText:async()=>newer,Date,console,clearTimeout,setTimeout}
 );
 const diff=writerGrammarDiffSpan(old,newer);
 const scopes=writerGrammarLocalScopes(old,newer,diff.start,diff.oldEnd,diff.newEnd,true);
 assert.equal(scopes.next.kind,'paragraph');
 assert.ok(scopes.next.text.includes('Aqui não'));
 assert.ok(!scopes.next.text.includes('Primeiro parágrafo'));
 const manager=new WriterAutoGrammar(plugin);
 manager.pendingPath=file.path;
 await manager.run();
 assert.equal(full,0,'Unrelated paragraphs are not reanalyzed');
 assert.ok(local,'Must dispatch a local LanguageTool check');
 assert.equal(local[0].path,file.path);
 assert.equal(local[1],old);
 assert.equal(local[2],newer);
 assert.equal(local[7].preferParagraph,true);
 assert.equal(manager.pendingPath,null);
});
test('external mode disables the automatic internal LanguageTool scheduler',()=>{
 const plugin={settings:{reviewEngine:'external',autoGrammar:{enabled:true}},
  app:{workspace:{getLeavesOfType:()=>[{view:{activeTab:'review',reviewMode:{value:'grammar'}}}]}}};
 const {WriterAutoGrammar}=vm.runInNewContext(src+'\n({WriterAutoGrammar})',
 {VIEW:'basic-ai-tool-for-writers',writerModuleOn:()=>true,setTimeout,clearTimeout});
 const manager=new WriterAutoGrammar(plugin);
 assert.equal(manager.reviewView(),null);
 const file={extension:'md',path:'Draft.md'};
 manager.schedule(file);
 assert.equal(manager.pendingPath,null);
});
test('writing tools tab click updates content only without rebuilding the nav',()=>{
 const from=tools.indexOf("btn.addEventListener('click',()=>{",tools.indexOf('const buttons={};'));
 const stop=tools.indexOf('  // Restore scroll after adding buttons',from);
 assert.ok(from>0&&stop>from);
 const click=tools.slice(from,stop);
 assert.match(click,/this\.renderSelectedTab\(panel,this\.app\.workspace\.getActiveFile\(\)\)/);
 assert.doesNotMatch(click,/this\.render\(\)/,'No full render for selecting Extras');
 assert.ok(tools.includes('const previousTabs=root.querySelector'));
 assert.ok(tools.includes('tabs.scrollLeft=Math.max(0,this.tabScrollLeft||0)'));
});
test('external reviewer uses plugin APIs and never triggers native LanguageTool',async()=>{
 const {externalLanguageTool,runExternalLanguageToolCommand,reviewWithExternalLanguageTool}=externalMethods();
 const file={path:'Draft.md'};
 let externalCalls=0,commands=[],status='',nativeCalls=0;
 const cm={state:{doc:{}}},leaf={view:{file,editor:{cm}}};
 const workspace={activeLeaf:{view:{}},getLeavesOfType:()=>[leaf],getMostRecentLeaf:()=>leaf,
  getActiveFile:()=>workspace.activeLeaf.view.file||file,setActiveLeaf:value=>{workspace.activeLeaf=value;}};
 const plugin={
  settings:{reviewEngine:'external',visibleModules:{review:true}},
  app:{workspace,plugins:{plugins:{languagetool:{runDetection:async editor=>{
   assert.equal(editor,cm);assert.equal(workspace.activeLeaf,leaf);externalCalls++;return true;
  }}}},
   commands:{commands:Object.fromEntries(['clear','next','toggle-auto-check'].map(id=>['languagetool:'+id,{}])),
    executeCommandById:id=>{commands.push(id);return true;}}},
  checkGrammar:async()=>{nativeCalls++;},
  externalLanguageTool,runExternalLanguageToolCommand,reviewWithExternalLanguageTool
 };
 const view={activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,reviewBusy:false,
  reviewStatus:{setText:x=>{status=x;}},
  updateReviewEngineUI:()=>{}};
 await plugin.reviewWithExternalLanguageTool(file,view);
 assert.equal(externalCalls,1);
 assert.equal(nativeCalls,0);
 assert.match(status,/Confira os sublinhados e os avisos do LanguageTool/);
 plugin.runExternalLanguageToolCommand('clear');
 plugin.runExternalLanguageToolCommand('next');
 plugin.runExternalLanguageToolCommand('toggle-auto-check');
 assert.deepEqual(commands,['languagetool:clear','languagetool:next','languagetool:toggle-auto-check']);
});
test('external checker missing is handled without posting any native request',async()=>{
 const {externalLanguageTool,reviewWithExternalLanguageTool}=externalMethods();
 let updated=0,nativeCalls=0;
 const plugin={settings:{reviewEngine:'external',visibleModules:{review:true}},app:{plugins:{plugins:{}}},
  externalLanguageTool,reviewWithExternalLanguageTool,checkGrammar:()=>{nativeCalls++;}};
 const file={path:'x.md'},view={activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,
  updateReviewEngineUI:()=>{updated++;}};
 assert.equal(await plugin.reviewWithExternalLanguageTool(file,view),false);
 assert.equal(updated,0);assert.equal(nativeCalls,0);assert.equal(plugin.externalLanguageTool(),null);
 plugin.app.plugins.plugins.languagetool={};
 assert.equal(await plugin.reviewWithExternalLanguageTool(file,view),false);
 assert.equal(updated,1);
 assert.equal(nativeCalls,0);
 assert.match(main,/this\.plugin\.settings\.reviewEngine==='external'/);
});

test('external wrapper honors current module, provider, integration and reviewer mode before checking',async()=>{
 for(const change of [plugin=>{plugin.settings.visibleModules.review=false;},
  plugin=>{plugin.settings.reviewEngine='basic';},plugin=>{plugin.settings.v12Toolkit={integrations:false};},
  plugin=>{plugin.settings.companionCompatibility={enabledById:{languagetool:false}};},
  (_plugin,view)=>{view.reviewMode.value='style';},(_plugin,view)=>{view.activeTab='dictionary';}]){
  const methods=externalMethods();let requests=0,nativeCalls=0;
  const plugin={reviewWithExternalLanguageTool:methods.reviewWithExternalLanguageTool,
   settings:{reviewEngine:'external',visibleModules:{review:true}},
   app:{plugins:{plugins:{languagetool:{runDetection:async()=>{requests++;}}}}},checkGrammar:()=>{nativeCalls++;}};
  const file={path:'Draft.md'},view={activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path};
  change(plugin,view);assert.equal(await plugin.reviewWithExternalLanguageTool(file,view),false);
  assert.equal(requests,0);assert.equal(nativeCalls,0);
 }
});
