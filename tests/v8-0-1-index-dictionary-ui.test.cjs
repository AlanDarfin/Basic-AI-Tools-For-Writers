'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
const complements=fs.readFileSync('src/v3/complements.js','utf8');
const project=fs.readFileSync('projects.js','utf8');
const settings=fs.readFileSync('src/v3/workspace.js','utf8');

test('LanguageTool dictionary only accepts spelling tokens and matches case-insensitively',()=>{
 const begin=main.indexOf('function writerGrammarPersonalWord('),end=main.indexOf('function writerGrammarSeverity(',begin);
 assert.ok(begin>=0&&end>begin);
 const funcs=vm.runInNewContext(main.slice(begin,end)+'\n({writerGrammarPersonalWord,writerGrammarPersonalDictionaryHas})');
 const source='Guaiani falou guaiani. Alinhado?';
 const word={offset:0,length:7,rule:{category:{id:'TYPOS'},id:'MORFOLOGIK_RULE_PT_BR'}};
 assert.equal(funcs.writerGrammarPersonalWord(source,word),'Guaiani');
 assert.equal(funcs.writerGrammarPersonalDictionaryHas({reviewPersonalDictionary:['guaiani']},source,word),true);
 assert.equal(funcs.writerGrammarPersonalDictionaryHas({reviewPersonalDictionary:[]},source,word),false);
 assert.equal(funcs.writerGrammarPersonalWord(source,{...word,rule:{id:'GRAMMAR'}}),'');
 assert.equal(funcs.writerGrammarPersonalWord(source,{...word,length:22}),'');
});

test('dictionary action persists locally and immediately filters existing highlights',async()=>{
 const a=main.indexOf('  async addGrammarWordToDictionary(');
 const b=main.indexOf('  showMobileReviewSuggestionMenu(',a);
 const utilA=main.indexOf('function writerGrammarPersonalWord('),utilB=main.indexOf('function writerGrammarSeverity(',utilA);
 const sandbox={VIEW:'basic-ai-tool-for-writers',Notice:class{},msg:pt=>pt};
 const obj=vm.runInNewContext(main.slice(utilA,utilB)+'\n({'+main.slice(a,b)+'})',sandbox);
 const source='Guaiani disse que Guaiani viria.';
 const matches=[0,source.lastIndexOf('Guaiani')].map(offset=>({offset,length:7,rule:{id:'SPELLING',category:{id:'TYPOS'}}}));
 const ui={reviewFilePath:'Book.md',reviewStatus:{setText(v){this.value=v;}},renderGrammarResults(_file,_text,items){this.items=items;}};
 let persisted=0,marks=null;
 const host={settings:{reviewPersonalDictionary:[]},reviewMarkedPath:'Book.md',reviewSource:source,
  reviewMatches:matches,closeReviewPopup(){},async saveSettings(){persisted++;},
  app:{workspace:{getLeavesOfType:()=>[{view:ui}]}},
  showReviewMarks(_file,found){marks=found;this.reviewMatches=found;},
  ...obj};
 await host.addGrammarWordToDictionary({path:'Book.md'},source,matches[0]);
 assert.equal(persisted,1);
 assert.equal(host.settings.reviewPersonalDictionary[0],'Guaiani');
 assert.equal(marks.length,0);
 assert.equal(ui.items.length,0);
 await host.addGrammarWordToDictionary({path:'Book.md'},source,matches[0]);
 assert.equal(persisted,1,'Do not add duplicate entries');
});

test('autocomplete indexes all eligible Markdown notes instead of stopping at term limit',async()=>{
 const files=Array.from({length:592},(_,i)=>({path:'Book/'+i+'.md',extension:'md',basename:'Note '+i,stat:{size:90,mtime:10}}));
 let reads=0;
 const plugin={settings:{complements:{enabled:true,vault:true,dictionaries:false,excludedFolders:'',
  indexLimit:12000,fileLimit:120000}},app:{vault:{getMarkdownFiles:()=>files,cachedRead:async file=>{reads++;return 'Alvorecer alegre brilhante '+file.path+' feito.';}}}};
 const api=vm.runInNewContext(complements+'\n({WriterComplements})',{
  EditorSuggest:class{constructor(app){this.app=app;}},TFile:class{},writerMaskMarkdown:t=>t,writerUi:pt=>pt,console,Date,Promise
 });
 const index=new api.WriterComplements(plugin);
 await index.rebuild();
 assert.equal(index.cache.size,592);
 assert.equal(index.indexStats.eligible,592);
 assert.equal(index.indexStats.indexed,592);
 assert.equal(index.indexStats.failed,0);
 assert.equal(reads,592);
 index.dirty=true;
 await index.rebuild();
 assert.equal(index.cache.size,592);
 assert.ok(reads<592*2,'Repeated indexing should reuse recent unchanged file entries');
});

test('reindex control exists only in plugin settings and old Continuity tab is absent',()=>{
 const render=settings.slice(settings.indexOf(' renderComplements(panel){'),settings.indexOf(' renderVariants(panel){'));
 assert.doesNotMatch(render,/Reindexar cofre|Reindex vault/);
 assert.doesNotMatch(render,/arquivo\(s\) no índice atual/);
 const config=settings.slice(settings.indexOf('function writerRenderV3Settings('));
 assert.match(config,/Indexação do cofre/);
 assert.match(config,/Reindexar cofre/);
 assert.match(config,/indexStats/);
 assert.doesNotMatch(project,/\['continuity',lfMsg/);
 assert.doesNotMatch(project,/else if\(id==='continuity'\)/);
 assert.doesNotMatch(project,/tabs:\['project','continuity'/);
});

test('Android and desktop popup replace navigation action with local dictionary',()=>{
 const mobile=main.slice(main.indexOf('  showMobileReviewSuggestionMenu('),main.indexOf('  showReviewSuggestionMenu(',main.indexOf('  showMobileReviewSuggestionMenu(')));
 const desktop=main.slice(main.indexOf('  showReviewSuggestionMenu('),main.indexOf('  maybeShowReviewPopup(',main.indexOf('  showReviewSuggestionMenu(')));
 for(const code of [mobile,desktop]){
  assert.match(code,/Adicionar ao dicionário/);
  assert.doesNotMatch(code,/Ir ao erro|Go to error/);
 }
});
