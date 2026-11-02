'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
const complements=fs.readFileSync('src/v3/complements.js','utf8');
const project=fs.readFileSync('projects.js','utf8');
const world=fs.readFileSync('src/v7/worldbuilding.js','utf8');
const workspace=fs.readFileSync('src/v3/workspace.js','utf8');
const section=(start,end)=>{
 const a=main.indexOf(start),b=main.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Could not find '+start);return main.slice(a,b);
};
const grammar=section('function writerGrammarDictionaryWord(','function reviewParagraph(');
const helpers=vm.runInNewContext(grammar+'\n({writerGrammarDictionaryWord,writerGrammarMatchWord,writerGrammarDictionaryHas})',{});
const {writerGrammarDictionaryWord,writerGrammarMatchWord,writerGrammarDictionaryHas}=helpers;
test('proofreader dictionary supports Unicode, accents and whole words only',()=>{
 assert.equal(writerGrammarDictionaryWord(' Guaiani '),'guaiani');
 assert.equal(writerGrammarDictionaryWord('Élvia'),'élvia');
 assert.equal(writerGrammarDictionaryWord('duas palavras'),'');
 assert.equal(writerGrammarDictionaryWord('<div>'),'');
 const settings={reviewDictionaryWords:['guaiani']};
 assert.equal(writerGrammarDictionaryHas(settings,'Olá Guaiani!',{offset:4,length:7}),true);
 assert.equal(writerGrammarDictionaryHas(settings,'Olá Guaianis!',{offset:4,length:8}),false);
 assert.equal(writerGrammarMatchWord('Olá Lucindy!',{offset:4,length:7}),'lucindy');
});
test('adding a word persists it and clears all matching existing findings, but not others',async()=>{
 const code=section('  async addReviewDictionaryWord(','  async ignoreGrammarRule(');
 let saved=0,notice='',published=null,cards=null;
 const {addReviewDictionaryWord}=vm.runInNewContext('({'+code+'})',{
  writerGrammarMatchWord,writerGrammarDictionaryWord,msg:(pt)=>pt,Notice:class{constructor(value){notice=value;}}
 });
 const src='Guaiani encontrou um amigo. Guaiani chegou.';
 const word=src.indexOf('Guaiani'),last=src.lastIndexOf('Guaiani');
 const other=src.indexOf('amigo');
 const matches=[{offset:word,length:7},{offset:last,length:7},{offset:other,length:5}];
 const file={path:'Book.md'};
 const view={activeTab:'review',reviewFilePath:file.path,renderGrammarResults(_file,_source,items){cards=items;}};
 const host={settings:{reviewDictionaryWords:[]},reviewMarkedPath:file.path,reviewSource:src,reviewMatches:matches,
  app:{workspace:{getLeavesOfType:()=>[{view}]}},
  async saveSettings(){saved++;},closeReviewPopup(){},
  showReviewMarks(_file,items){published=items;},addReviewDictionaryWord};
 await host.addReviewDictionaryWord(file,src,matches[0]);
 assert.deepEqual(Array.from(host.settings.reviewDictionaryWords),['guaiani']);
 assert.equal(published.length,1);
 assert.equal(cards.length,1);
 assert.equal(published[0].offset,other);
 assert.equal(saved,1);assert.match(notice,/dicionário pessoal/);
});
test('popup omits jump action, offers local dictionary on desktop and Android',()=>{
 const modal=section('  showMobileReviewSuggestionMenu(','  maybeShowReviewPopup(');
 assert.doesNotMatch(modal,/Go to error|Ir ao erro|jumpToReviewError/);
 assert.match(modal,/Add to dictionary/);
 assert.match(modal,/Adicionar ao dicionário/);
 assert.match(modal,/addReviewDictionaryWord/);
 const full=section(' async reviewFile(',' async recheckGrammarCorrection(');
 const incremental=section(' async recheckGrammarCorrection(',' renderGrammarResults(');
 assert.match(full,/writerGrammarDictionaryHas\(this\.plugin\.settings,source,m\)/);
 assert.match(incremental,/writerGrammarDictionaryHas\(this\.plugin\.settings,after,m\)/);
});
test('index all eligible files, do not stop early, and sample large notes',async()=>{
 class EditorSuggest{constructor(app){this.app=app;}}
 const {WriterComplements}=vm.runInNewContext(complements+'\n({WriterComplements})',{
  EditorSuggest,writerMaskMarkdown:value=>value,writerUi:pt=>pt,
  console,TFile:class{}
 });
 const files=Array.from({length:610},(_,i)=>({extension:'md',path:'Book/Chapter'+i+'.md',
  basename:'Chapter'+i,stat:{size:999999,mtime:i+1}}));
 let reads=0;
 const plugin={settings:{complements:{vault:true,dictionaries:false,internalLinks:false,indexLimit:12000,
  fileLimit:1000,maxFiles:5,excludedFolders:'',enabled:true}},
  app:{vault:{getMarkdownFiles:()=>files,async cachedRead(file){reads++;
   return 'unique'+file.path.match(/\d+/)[0]+' '+('sample '.repeat(200));
  }}}};
 const index=new WriterComplements(plugin);
 await index.rebuild();
 assert.equal(index.cache.size,610,'Must index eligible files beyond old maxFiles and total-word cap');
 assert.equal(index.indexStats.eligible,610);
 assert.equal(index.indexStats.indexed,610);
 assert.ok(index.cache.get(files[609].path).has('unique609'));
 assert.equal(reads,610);
 assert.ok(index.fileTermCache.size<=128);
});
test('settings own indexing controls, writing panel does not',()=>{
 assert.doesNotMatch(workspace.slice(workspace.indexOf(' renderComplements(panel){'),workspace.indexOf(' renderVariants(panel){')),/Reindexar cofre|Reindex vault|arquivo\(s\) no índice/);
 assert.match(workspace,/input\('indexLimit'/);
 assert.match(workspace,/Cobertura do índice/);
 assert.match(workspace,/Reindexar cofre/);
 assert.doesNotMatch(workspace,/input\('maxFiles'/);
});
test('Continuity tab and legacy toggle are removed without dropping project tasks',()=>{
 assert.doesNotMatch(project,/lfMsg\('Continuidade','Continuity'\)/);
 assert.doesNotMatch(project,/writerV7RenderContinuity/);
 assert.doesNotMatch(world,/function writerV7RenderContinuity\(/);
 assert.doesNotMatch(world,/\['continuity','Verificador local de continuidade'/);
 assert.match(project,/\['tasks',lfMsg\('Tarefas','Tasks'\)\]/);
});
