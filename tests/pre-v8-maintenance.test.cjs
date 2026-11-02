'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('src/v4/auto-grammar.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const tools=fs.readFileSync('src/v3/workspace.js','utf8');
const read=()=>new Map();

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
 const from=main.indexOf('  externalLanguageTool(){'),end=main.indexOf('  async checkGrammar(text){',from);
 assert.ok(from>0&&end>from);
 const code=main.slice(from,end);
 const {externalLanguageTool,runExternalLanguageToolCommand,reviewWithExternalLanguageTool}=vm.runInNewContext('new (class {'+code+'})()',{
   writerActiveEditor:()=>({cm:{state:{}}}),Notice:class{},msg:pt=>pt
 });
 const file={path:'Draft.md'};
 let externalCalls=0,commands=[],status='',nativeCalls=0;
 const plugin={
  settings:{reviewEngine:'external'},
  app:{plugins:{plugins:{languagetool:{runDetection:async()=>{externalCalls++;return true;}}}},
   commands:{executeCommandById:id=>{commands.push(id);return true;}}},
  checkGrammar:async()=>{nativeCalls++;},
  externalLanguageTool,runExternalLanguageToolCommand,reviewWithExternalLanguageTool
 };
 const view={reviewFilePath:file.path,reviewBusy:false,
  reviewStatus:{setText:x=>{status=x;}},
  updateReviewEngineUI:()=>{}};
 await plugin.reviewWithExternalLanguageTool(file,view);
 assert.equal(externalCalls,1);
 assert.equal(nativeCalls,0);
 assert.match(status,/Sugestões disponíveis/);
 plugin.runExternalLanguageToolCommand('clear');
 plugin.runExternalLanguageToolCommand('next');
 plugin.runExternalLanguageToolCommand('toggle-auto-check');
 assert.deepEqual(commands,['languagetool:clear','languagetool:next','languagetool:toggle-auto-check']);
});
test('external checker missing is handled without posting any native request',async()=>{
 const idx=main.indexOf('  externalLanguageTool(){'),end=main.indexOf('  async checkGrammar(text){',idx);
 const {externalLanguageTool,reviewWithExternalLanguageTool}=vm.runInNewContext('new (class {'+main.slice(idx,end)+'})()',{
  writerActiveEditor:()=>({cm:{}}),Notice:class{},msg:pt=>pt
 });
 let updated=0;
 const plugin={app:{plugins:{plugins:{}}},externalLanguageTool,reviewWithExternalLanguageTool};
 await plugin.reviewWithExternalLanguageTool({path:'x.md'}, {updateReviewEngineUI:()=>{updated++;}});
 assert.equal(updated,1);
 assert.match(main,/this\.plugin\.settings\.reviewEngine==='external'/);
});
