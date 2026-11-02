'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
const complements=fs.readFileSync('src/v3/complements.js','utf8');
const workspace=fs.readFileSync('src/v3/workspace.js','utf8');
const projects=fs.readFileSync('projects.js','utf8');
const world=fs.readFileSync('src/v7/worldbuilding.js','utf8');

test('personal dictionary accepts Unicode proper nouns and suppresses repeated findings',()=>{
 const a=main.indexOf('function writerReviewWord('),b=main.indexOf('function prepareGrammarText(',a);
 assert.ok(a>=0&&b>a);
 const {writerReviewWord,writerReviewIsAcceptedWord}=vm.runInNewContext(main.slice(a,b)+'\n({writerReviewWord,writerReviewIsAcceptedWord})');
 const source='Guai ani e Guaiani, com Lucindy.';
 const mark={offset:source.indexOf('Guaiani'),length:7};
 assert.equal(writerReviewWord(source,mark),'Guaiani');
 assert.equal(writerReviewIsAcceptedWord({reviewCustomWords:['guaiani']},source,mark),true);
 assert.equal(writerReviewIsAcceptedWord({reviewCustomWords:['outro']},source,mark),false);
 assert.equal(writerReviewWord(source,{offset:0,length:8}),'','Multiple words cannot be stored as one dictionary entry');
 assert.match(main,/!writerReviewIsAcceptedWord\(this\.plugin\.settings,source,m\)/);
 assert.match(main,/!writerReviewIsAcceptedWord\(this\.plugin\.settings,after,m\)/);
 assert.match(main,/async addGrammarWord\(/);
 assert.match(main,/Adicionar ao dicionário/);
 assert.doesNotMatch(main.slice(main.indexOf('  showMobileReviewSuggestionMenu('),main.indexOf('  maybeShowReviewPopup(')),/Ir ao erro|Go to error/);
});
test('all eligible Markdown files receive a fair share of the vocabulary budget',async()=>{
 class EditorSuggest{constructor(app){this.app=app;}}
 const {WriterComplements}=vm.runInNewContext(complements+'\n({WriterComplements})',{
  EditorSuggest,writerMaskMarkdown:x=>x,writerUi:x=>x,writerModuleOn:()=>true,TFile:class{},console
 });
 const files=Array.from({length:180},(_,i)=>({path:'Book/Chapter'+i+'.md',basename:'Chapter'+i,extension:'md',stat:{mtime:1,size:400}}));
 const note='palavra '.repeat(40)+'texto '.repeat(40)+'sinônimo '.repeat(40);
 const plugin={app:{vault:{getMarkdownFiles:()=>files,cachedRead:async()=>note,getAbstractFileByPath:()=>null}},
  settings:{complements:{enabled:true,vault:true,dictionaries:false,internalLinks:false,indexLimit:1000,fileLimit:120000,excludedFolders:'.trash'}}};
 const index=new WriterComplements(plugin);
 await index.rebuild();
 assert.equal(index.cache.size,180);
 assert.equal(index.indexStats.indexed,180);
 assert.equal(index.indexStats.failed,0);
 assert.ok(index.cache.has('Book/Chapter179.md'),'Last file must not be discarded');
 assert.ok(index.cache.get('Book/Chapter179.md').size>0);
});
test('Index administration is only in plugin settings and Continuity tab has been retired',()=>{
 const render=workspace.slice(workspace.indexOf(' renderComplements(panel){'),workspace.indexOf(' renderVariants(panel){'));
 assert.doesNotMatch(render,/Reindexar cofre|Reindex vault|arquivo\(s\) no índice atual/);
 assert.match(workspace,/indexStats/);
 assert.match(workspace,/Arquivos Markdown elegíveis/);
 assert.match(workspace,/Atualizar índice/);
 assert.doesNotMatch(projects,/\['continuity',lfMsg/);
 assert.doesNotMatch(projects,/else if\(id==='continuity'\)/);
 assert.doesNotMatch(world,/\['continuity','Verificador local de continuidade'/);
});
