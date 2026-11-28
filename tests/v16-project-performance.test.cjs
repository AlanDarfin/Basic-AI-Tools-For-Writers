'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const load=(name,marker,globals)=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/projects',name),'utf8');
 const ctx=vm.createContext(globals);
 vm.runInContext(source.slice(0,source.indexOf(marker)),ctx);
 return ctx;
};
class TFile { constructor(path,parent){this.path=path;this.parent=parent;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension='md';} }
class TFolder { constructor(path,parent){this.path=path;this.parent=parent;this.name=path.split('/').pop();this.children=[];} }
test('BookNav enumerates once per flatten, never for direct hits',()=>{
 const folder=new TFolder('book'), index={file:{parent:folder},format:'scenes',meta:{},scenes:[{title:'A'},{title:'B'}]};
 const files=[new TFile('book/nested/A.md',folder),new TFile('book/nested/B.md',folder)];
 let scans=0;
 const app={vault:{getMarkdownFiles:()=>{scans++;return files;},getAbstractFileByPath:p=>files.find(f=>f.path===p)}};
 const c=load('longform-navigation.js','function writerBookNavTargets',{TFile,lfFlattenScenes:x=>x,lfPath:(...p)=>p.filter(Boolean).join('/')});
 assert.equal(c.writerBookNavFlatten(index,app).map(x=>x.path).join(','),'book/nested/A.md,book/nested/B.md');
 assert.equal(scans,1);
 files.push(new TFile('book/other/A.md',folder));
 assert.equal(c.writerBookNavFlatten(index,app)[0].path,null);
 assert.equal(scans,2);
 index.scenes=[{path:'book/nested/B.md',title:'B'}];
 assert.equal(c.writerBookNavFlatten(index,app)[0].path,'book/nested/B.md');
 assert.equal(scans,2);
});
test('Compendium shares metadata and folder lookups per scan but refreshes next scan',()=>{
 const folder=new TFolder('book'),a=new TFile('book/A.md',folder),b=new TFile('book/B.md',folder),note=new TFile('book/book.md',folder);
 folder.children=[a,b,note];let reads=0,lookups=0,tag='place';
 const app={vault:{getAbstractFileByPath:p=>{lookups++;return p==='book'?folder:p===note.path?note:null;}},metadataCache:{getFileCache:f=>{reads++;return {frontmatter:{tags:[f===note?tag:'item']}};}}};
 const c=load('worldbuilding.js','function writerV7Classify',{TFile,TFolder,require:()=>({})});
 const view={app,notesRoot:()=>folder.path,plugin:{settings:{v7:{maxEntries:100}}}};
 assert.equal(c.writerV7ProjectNotes(view,{})[0].tags.join(','),'#item,#place');
 assert.equal(reads,3);assert.equal(lookups,2);
 tag='character';
 assert.equal(c.writerV7ProjectNotes(view,{})[0].tags.join(','),'#item,#character');
 assert.equal(reads,6);assert.equal(lookups,4);
});

test('Homepage Books and Zotero use the same per-render file snapshot',()=>{
 const read=path=>fs.readFileSync(path,'utf8');
 const home=read('src/workspace/writing-home.js');
 const bookshelf=read('src/projects/bookshelf.js');
 const discovery=read('src/workspace/discovery.js');
 const slice=(src,start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));
 const files=[{path:'A.md',basename:'A',extension:'md'}];let scans=0;
 const vault={getMarkdownFiles:()=>{scans++;return files;}};
 const plugin={app:{vault},settings:{}};
 const c=vm.createContext({longformIndex:file=>({file}),writerV92ZoteroIsSource:()=>true,writerUi:(pt,en)=>en});
 vm.runInContext(slice(home,'function writerV16HomeMarkdownSnapshot','function writerV8HomeTopFiles')+
  slice(bookshelf,'function writerV10BookshelfProjects','function writerV10BookCover')+
  slice(discovery,'function writerV10RenderZoteroWidget','function writerV10ZoteroRef'),c);
 const snapshot=c.writerV16HomeMarkdownSnapshot(vault);
 const node={createEl:()=>node,addEventListener:()=>{}};
 const view={app:plugin.app,plugin,card:()=>node};
 assert.equal(scans,0);
 assert.equal(c.writerV10BookshelfProjects(plugin,snapshot()).length,1);
 c.writerV10RenderZoteroWidget(view,node,snapshot());
 assert.equal(scans,1);
 files.push({path:'B.md',basename:'B',extension:'md'});
 assert.equal(c.writerV10BookshelfProjects(plugin,snapshot()).length,1);
 assert.equal(c.writerV10BookshelfProjects(plugin).length,2);
 assert.equal(scans,2);
 assert.match(home,/writerV10RenderBookshelfWidget\(this,card,markdownFiles\(\)\)/);
 assert.match(home,/writerV10RenderZoteroWidget\(this,p,markdownFiles\(\)\)/);
});
test('Zotero imported-reference collection stops at 500 matches and refreshes on each call',()=>{
 const source=fs.readFileSync('src/workspace/discovery.js','utf8');
 let inspected=0;
 const files=Array.from({length:1500},(_,i)=>({path:i+'.md',basename:String(i)}));
 const c=vm.createContext({writerV92ZoteroIsSource:(p,f)=>{inspected++;return Number(f.basename)%2===0;},
  writerV10ZoteroRef:(p,f)=>({title:f.basename})});
 vm.runInContext(source.slice(source.indexOf('function writerV10ZoteroImportedReferences'),source.indexOf('async function writerV10ZoteroReferences')),c);
 const plugin={app:{vault:{getMarkdownFiles:()=>files}}};
 const result=c.writerV10ZoteroImportedReferences(plugin);
 assert.equal(result.length,500);assert.equal(result[499].title,'998');assert.equal(inspected,999);
 files.shift();inspected=0;
 assert.equal(c.writerV10ZoteroImportedReferences(plugin)[0].title,'2');assert.equal(inspected,1000);
});

test('Zotero folder matches skip classification metadata and nested tags still work',()=>{
 const source=fs.readFileSync('src/writing/research-style.js','utf8');
 const c=vm.createContext({TFile});
 vm.runInContext(source.slice(source.indexOf('function writerV92ZoteroIsSource'),source.indexOf('function writerV92ZoteroExtract')),c);
 const folder=new TFile('Zotero/Book.md'),folderNote=new TFile('ZOTERO.md'),other=new TFile('Elsewhere.md');
 let reads=0,tag='#ZoTeRo/research';
 const plugin={settings:{v92Research:{zoteroFolder:'zotero',zoteroTag:'zotero'}},
  app:{metadataCache:{getFileCache:()=>{reads++;return {frontmatter:{tags:[tag]}};}}}};
 assert.equal(c.writerV92ZoteroIsSource(plugin,folder),true);
 assert.equal(c.writerV92ZoteroIsSource(plugin,folderNote),true);
 assert.equal(reads,0);
 assert.equal(c.writerV92ZoteroIsSource(plugin,other),true);
 tag='#unrelated';
 assert.equal(c.writerV92ZoteroIsSource(plugin,other),false);
 assert.equal(reads,2);
});
test('Zotero quote collection bounds source classification without changing read order',async()=>{
 const source=fs.readFileSync('src/writing/research-style.js','utf8');
 let inspected=0;const reads=[];
 const files=Array.from({length:1000},(_,i)=>({path:String(i)}));
 const c=vm.createContext({writerModuleOn:()=>true,
  writerV92ZoteroIsSource:(p,f)=>{inspected++;return Number(f.path)%2===0;},
  writerV92ZoteroExtract:()=>[]});
 vm.runInContext(source.slice(source.indexOf('async function writerV92ZoteroQuotes'),source.indexOf('function writerV92ZoteroQuoteMode')),c);
 const plugin={settings:{v92Research:{enabled:true,zoteroQuotes:true}},app:{vault:{getMarkdownFiles:()=>files,cachedRead:async f=>{reads.push(f.path);return 'note';}}}};
 assert.equal((await c.writerV92ZoteroQuotes(plugin)).length,0);
 assert.equal(inspected,479);assert.equal(reads.length,240);
 assert.equal(reads[0],'0');assert.equal(reads[239],'478');
});

test('Calendar category filtering only expands visible events',()=>{
 const s=fs.readFileSync('src/workspace/calendar-studio.js','utf8');
 const calls=[];const c=vm.createContext({writerV83CalOccurrence:e=>{calls.push(e.title);return [{...e,occurs:'2026-11-27'}];}});
 vm.runInContext(s.slice(s.indexOf('function writerV9CalRows'),s.indexOf('function writerV9CalButton')),c);
 const view={events:[{title:'B',category:'work'},{title:'Hidden',category:'other'},{title:'A',category:'work'}],writerV9CategoryFilter:'work'};
 assert.equal(Array.from(c.writerV9CalRows(view,'2026-11-27','2026-11-27'),x=>x.title).join(','),'A,B');assert.deepEqual(calls,['B','A']);
});
test('Calendar single occurrence respects exclusions and range cap',()=>{
 const s=fs.readFileSync('src/workspace/calendar-core.js','utf8');
 const c=vm.createContext({writerV83Date:x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)?x:''});
 vm.runInContext(s.slice(s.indexOf('function writerV9CalDayNumber'),s.indexOf('function writerV9CalExtras'))+s.slice(s.indexOf('function writerV9CalOccurrence'),s.indexOf('writerV83CalOccurrence=writerV9CalOccurrence')),c);
 const event={date:'2026-11-27',repeat:'none'};
 assert.equal(c.writerV9CalOccurrence(event,'2026-11-01','2026-12-31')[0].occurs,event.date);
 assert.equal(c.writerV9CalOccurrence({...event,exceptions:[event.date]},'2026-11-01','2026-12-31').length,0);
 assert.equal(c.writerV9CalOccurrence(event,'2010-01-01','2030-01-01').length,0);
 assert.equal(c.writerV9CalOccurrence({...event,repeatUntil:'2026-11-26'},'2026-11-01','2026-12-31').length,0);
 assert.equal(c.writerV9CalOccurrence({...event,repeat:'daily',repeatInterval:2},'2026-11-27','2026-12-02').length,3);
});
test('Folder Overview resolves the folder note once per traversal',()=>{
 const s=fs.readFileSync('src/blocks/folder-overview.js','utf8');
 const folder=new TFolder('book'),a=new TFile('book/A.md',folder),b=new TFile('book/B.md',folder);
 folder.children=[a,b];let calls=0,note=a;
 const c=vm.createContext({TFile,TFolder,writerV7FolderNote:()=>{calls++;return note;}});
 vm.runInContext(s.slice(s.indexOf('function writerV8OverviewSortEntries'),s.indexOf('function writerV8OverviewPlainBrief')),c);
 const cfg={depth:0,limit:48,sort:'name-asc'};
 assert.equal(c.writerV8OverviewEntries({},folder,cfg)[0].file,b);assert.equal(calls,1);
 note=b;assert.equal(c.writerV8OverviewEntries({},folder,cfg)[0].file,a);assert.equal(calls,2);
});
test('Virtual Content short-circuits any and all rules',()=>{
 const s=fs.readFileSync('src/blocks/virtual-content.js','utf8');let checks=0;
 const c=vm.createContext({writerV912VirtualConditionMatch:x=>{checks++;return x;}});
 vm.runInContext(s.slice(s.indexOf('function writerV912VirtualMatch'),s.indexOf('function writerV912HasBookNavRule')),c);
 const file={extension:'md'};
 assert.equal(c.writerV912VirtualMatch({conditions:[true,false],match:'any'},file,{}),true);assert.equal(checks,1);
 checks=0;assert.equal(c.writerV912VirtualMatch({conditions:[false,true],match:'all'},file,{}),false);assert.equal(checks,1);
});

test('Calendar collection stops inspecting children at 900 Markdown notes',async()=>{
 const s=fs.readFileSync('src/workspace/writing-calendar.js','utf8');
 const root=new TFolder('Writing Calendar');let inspected=0;const reads=[];
 root.children=Array.from({length:2000},(_,i)=>{
  const f=new TFile('Writing Calendar/'+i+'.md',root);
  Object.defineProperty(f,'extension',{get(){inspected++;return i%2===0?'md':'png';}});
  return f;
 });
 const c=vm.createContext({TFile,TFolder,WRITER_V83_CAL_FOLDER:root.path,writerV83CalParse:(_s,path)=>({path})});
 const start=s.indexOf('async function writerV83CalEvents'),end=s.indexOf('function writerV83CalForm',start);
 vm.runInContext(s.slice(start,end),c);
 const plugin={app:{vault:{getAbstractFileByPath:()=>root,cachedRead:async f=>{reads.push(f.path);return '';}}}};
 const result=await c.writerV83CalEvents(plugin);
 assert.equal(inspected,1799);assert.equal(result.length,900);assert.equal(reads[899],'Writing Calendar/1798.md');
});
test('Project cover menu keeps a missing selection and does not re-scan paths',()=>{
 const s=fs.readFileSync('src/projects/project-metadata.js','utf8');
 const start=s.indexOf("   let currentFound=false;"),end=s.indexOf("   d.setValue(current)",start);
 let reads=0;const options=[];
 const files=['A.png','B.png'].map(path=>({get path(){reads++;return path;}}));
 const c=vm.createContext({files,current:'Missing.png',d:{addOption:(id,label)=>options.push([id,label])},lfMsg:(_pt,en)=>en});
 vm.runInContext(s.slice(start,end),c);
 assert.equal(reads,2);assert.deepEqual(options,[['A.png','A.png'],['B.png','B.png'],['Missing.png','Missing file: Missing.png']]);
});
