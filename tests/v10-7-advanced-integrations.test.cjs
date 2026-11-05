'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class TFile{}
class ItemView{}
const expose=(name,items,extra={})=>vm.runInNewContext(
 fs.readFileSync('src/v10/'+name+'.js','utf8')+'\n({'+items.join(',')+'})',
 {console,Math,Date,Number,String,JSON,Set,Map,Array,Uint8Array,URL,TFile,ItemView,Promise,
  writerUi:(pt,en)=>en,writerV83StudySchedule:()=>({interval:10}),...extra}
);
const db=expose('data-tables',['writerV107DbSpec','writerV107DbFormula','writerV107DbMatch','writerV107DbRows','writerV107DbCsv']);
const zotero=expose('zotero-web',['writerV107ZoteroUrl','writerV107ZoteroNormalize','writerV107ZoteroMarkdown','writerV107ZoteroCsl','writerV107ZoteroConfig']);
const study=expose('study-fsrs',['writerV107StudyConfig','writerV107StudyRetrievability','writerV107StudySchedule','writerV107StudyExportRows','writerV107StudyImportRows']);
const feeds=expose('calendar-feeds',['writerV107CalendarConfig','writerV107CalendarUrl','writerV107CalendarHash']);
const graph=expose('story-graph',['writerV107GraphLinks','writerV107GraphPositions','writerV107GraphBuild','writerV107GraphConfig']);
const editor=expose('editor-pro',['writerV107ReplacePreview','writerV107ReplacePlain','writerV107EditorYamlState']);
const speech=expose('speech-accessibility',['writerV107SpeechChunks','writerV107SpeechConfig']);
const media=expose('media-drag-extension',['writerV107CrossNoteBlock','writerV107MediaConfig'],{writerV106DragBlockAt:()=>({start:0,end:2})});
test('Make.md database spec supports local formulas and relation rollups',()=>{
 const spec=db.writerV107DbSpec('columns: file, priority\nformula: doubled = priority * 2\nrollup: estimate = related.hours | sum\nsort: modified\nlimit: 15');
 assert.equal(spec.formulas.length,1);assert.equal(spec.rollups[0].op,'sum');assert.equal(spec.limit,15);
 assert.equal(db.writerV107DbFormula('priority * 2 + hours / 4',{priority:3,hours:8}),8);
 assert.equal(db.writerV107DbFormula('x / 0',{x:10}),null);
 assert.equal(db.writerV107DbFormula('process.exit(1)',{}),null);
 assert.equal(db.writerV107DbMatch({status:'Doing'},'status contains oin'),true);
 assert.equal(db.writerV107DbMatch({priority:5},'priority >= 4'),true);
});
test('Database index remains bounded and CSV escapes spreadsheet formulas',()=>{
 const f1=Object.assign(new TFile(),{path:'A.md',basename:'A',stat:{mtime:10}});
 const f2=Object.assign(new TFile(),{path:'B.md',basename:'B',stat:{mtime:20}});
 const app={vault:{getMarkdownFiles:()=>[f1,f2]},metadataCache:{
  getFileCache:f=>({frontmatter:{priority:f===f1?2:5,status:'Doing'}}),
  getFirstLinkpathDest:()=>null}};
 const rows=db.writerV107DbRows({app,settings:{}},{folder:'',columns:['file','priority'],filter:'priority > 3',sort:'priority',order:'asc',formulas:[],rollups:[],limit:20});
 assert.equal(rows.length,1);assert.equal(rows[0].file.path,'B.md');
 assert.ok(db.writerV107DbCsv([{data:{file:'=SUM(A1:A2)'}}],['file']).includes("'=SUM"));
});
test('Zotero URL rejects path injection and does not require storing a key',()=>{
 const cfg=zotero.writerV107ZoteroConfig({v107Zotero:{libraryId:'123',enabled:true}});
 const u=zotero.writerV107ZoteroUrl(cfg,100);
 assert.ok(u.startsWith('https://api.zotero.org/users/123/items/top?'));
 assert.throws(()=>zotero.writerV107ZoteroUrl({...cfg,libraryId:'../secret'}));
 const item=zotero.writerV107ZoteroNormalize({key:'ABCD1234',data:{title:'A Paper',itemType:'journalArticle',creators:[{firstName:'Ana',lastName:'Silva'}],date:'2026-05-10',extra:'Citation Key: silva2026',DOI:'10.1/example'}});
 assert.equal(item.citekey,'silva2026');assert.equal(item.author,'Ana Silva');
 assert.match(zotero.writerV107ZoteroMarkdown(item),/zoteroSource: true/);
 assert.equal(zotero.writerV107ZoteroCsl({key:'ABCD1234',data:{title:'A Paper',creators:[],date:'2026',itemType:'book'}}).type,'book');
});
test('FSRS-4.5 keeps SM-2 as default and produces bounded scheduling',()=>{
 assert.equal(study.writerV107StudyConfig({}).scheduler,'sm2');
 const settings={v107Study:{scheduler:'fsrs45',desiredRetention:.9},v83Study:{learningMinutes:10,maxIntervalDays:10000}};
 const now=Date.UTC(2026,9,5);
 const hard=study.writerV107StudySchedule(null,2,now,settings);
 const good=study.writerV107StudySchedule(null,4,now,settings);
 const easy=study.writerV107StudySchedule(null,5,now,settings);
 assert.ok(easy.interval>=good.interval&&good.interval>=hard.interval);
 assert.ok(good.due>now);assert.equal(good.algorithm,'fsrs45');
 const next=study.writerV107StudySchedule(good,4,good.due,settings);
 assert.ok(next.stability>0&&next.difficulty>=1&&next.difficulty<=10);
 assert.ok(Math.abs(study.writerV107StudyRetrievability(2,2)-.9)<.00001);
});
test('Anki TSV export and import preserves fields and rejects malformed lines',()=>{
 const raw=study.writerV107StudyExportRows([{front:'Question',back:'Answer'}]);
 assert.match(raw,/#separator:tab/);
 assert.equal(study.writerV107StudyImportRows(raw)[0].back,'Answer');
 assert.equal(study.writerV107StudyImportRows('invalid\nQuestion\tAnswer').length,1);
});
test('iCalendar subscription validation requires public HTTPS without credentials',()=>{
 assert.ok(feeds.writerV107CalendarUrl('https://example.org/calendar.ics'));
 for(const url of ['http://example.org/feed.ics','https://localhost/a','https://192.168.1.2/a','https://user:pass@example.org/a','https://example.org:8080/a'])assert.equal(feeds.writerV107CalendarUrl(url),'');
 assert.equal(feeds.writerV107CalendarHash('same'),feeds.writerV107CalendarHash('same'));
});
test('StoryLine map reads relations and builds graph edges without network',()=>{
 const a=Object.assign(new TFile(),{path:'Chars/A.md',basename:'A'});
 const b=Object.assign(new TFile(),{path:'Chars/B.md',basename:'B'});
 const app={vault:{getMarkdownFiles:()=>[a,b]},metadataCache:{
  getFileCache:f=>({frontmatter:{tags:['personagem'],relationships:f===a?['[[B]]']:[]},tags:[]}),
  getFirstLinkpathDest:name=>name==='B'?b:null}};
 const model=graph.writerV107GraphBuild({app,settings:{}});
 assert.equal(model.nodes.length,2);assert.equal(model.edges.length,1);
 assert.deepEqual(Array.from(graph.writerV107GraphLinks(['[[B|Name]]'])),['B']);
 assert.equal(graph.writerV107GraphPositions(model,{layout:'radial',positions:{}}).length,2);
});
test('Enhancement batch replace is literal and non-destructive in preview',()=>{
 const file={path:'A.md'},src='Word word word';
 const preview=editor.writerV107ReplacePreview([{file,text:src}],'word','new',false);
 assert.equal(preview[0].count,3);
 assert.equal(src,'Word word word');
 assert.equal(editor.writerV107ReplacePlain(src,'word','new',false),'new new new');
 const valid=editor.writerV107EditorYamlState('---\na: 1\n---\ntext',text=>({a:1}));
 assert.equal(valid.valid,true);
 const invalid=editor.writerV107EditorYamlState('---\na: (\n---\ntext',()=>{throw Error('bad value')});
 assert.equal(invalid.valid,false);
});
test('Offline speech splits long text without dropping words',()=>{
 const text='Long sentence. '.repeat(600),pieces=speech.writerV107SpeechChunks(text,200);
 assert.ok(pieces.length>20);
 assert.equal(pieces.join('').replace(/\s+/g,''),text.replace(/\s+/g,''));
});
test('Cross-note move extracts either a selection or full block safely',()=>{
 const selected=media.writerV107CrossNoteBlock({getSelection:()=>'- A',getCursor:()=>({line:0,ch:0})});
 assert.equal(selected.text,'- A');
 const editor={getSelection:()=>'',getCursor:()=>({line:0,ch:0}),getValue:()=>'- Parent\n  - child\n\nNext'};
 assert.equal(media.writerV107CrossNoteBlock(editor).text,'- Parent\n  - child');
});
test('All 10.7 sources are restored in active source list and package',()=>{
 const read=p=>fs.readFileSync(p,'utf8'),build=read('scripts/build-v3.js'),enhancements=read('src/v10/enhancements.js');
 for(const name of ['data-tables','zotero-web','study-fsrs','calendar-feeds','story-graph','editor-pro','speech-accessibility','media-drag-extension','integrations-107']){
  assert.ok(build.match(/const sources=(\[[^;]+\]);/)?.[1].includes("'v10/"+name+"'"));
  assert.ok(fs.existsSync('src/v10/'+name+'.js'));
 }
 assert.match(enhancements,/writerV107RegisterAfterStartup\(plugin\)/);
 assert.match(enhancements,/writerV107Settings\(plugin,panel\)/);
});
