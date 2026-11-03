'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/folder-overview.js','utf8');
class TFolder{constructor(path,children=[]){this.path=path;this.name=path.split('/').pop();this.children=children;this.parent=null;}}
class TFile{constructor(path,mtime=0){this.path=path;this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.name=path.split('/').at(-1);this.extension='md';this.stat={mtime,ctime:mtime,size:mtime};this.parent=null;}}
const api=vm.runInNewContext(source+'\n({writerV8OverviewConfig,writerV8OverviewEntries,writerV8OverviewSortEntries,writerV8OverviewRoot,writerV8OverviewPlainBrief,writerV8RegisterFolderOverview})',{
 TFile,TFolder,console,Intl,Set,writerV7FolderNote:()=>null,writerUi:(pt,en)=>en,
 require:()=>({setIcon:()=>{},MarkdownRenderChild:class{}})
});
function tree(){
 const root=new TFolder('Writing'),a=new TFolder('Writing/Stories'),b=new TFolder('Writing/Reference');
 const one=new TFile('Writing/Zeta.md',1),two=new TFile('Writing/Alpha.md',50);
 const nested=new TFile('Writing/Stories/Scene.md',120),deep=new TFile('Writing/Stories/Deep.md',500);
 one.parent=root;two.parent=root;nested.parent=a;deep.parent=a;a.parent=root;b.parent=root;
 root.children=[one,a,two,b];a.children=[deep,nested];return {root,a,b,one,two,nested,deep};
}
test('six overview views and nine sort options parse with safe defaults and limits',()=>{
 const opts=api.writerV8OverviewConfig('style: board\nsort: modified-desc\nfolderFirst: false\nsubfolders: true\ndepth: 4\nshowBrief: true\nnoteOnly: false\nlimit: 99');
 assert.equal(opts.style,'board');assert.equal(opts.sort,'modified-desc');
 assert.equal(opts.folderFirst,false);assert.equal(opts.showBrief,true);assert.equal(opts.depth,4);
 assert.equal(opts.limit,99);
 const def=api.writerV8OverviewConfig('');
 assert.equal(def.style,'cards');assert.equal(def.showBrief,false);assert.equal(def.depth,2);
 for(const style of ['cards','list','compact','grid','table','board'])assert.equal(api.writerV8OverviewConfig('style: '+style).style,style);
 for(const sort of ['name-asc','name-desc','modified-desc','modified-asc','created-desc','created-asc','size-desc','size-asc','type'])
  assert.equal(api.writerV8OverviewConfig('sort: '+sort).sort,sort);
 const limited=api.writerV8OverviewConfig('folder: ../oops\ndepth: 100\nlimit: 999\nbriefMax: 999');
 assert.equal(limited.folder,undefined);assert.equal(limited.depth,8);
 assert.equal(limited.limit,200);assert.equal(limited.briefMax,400);
});
test('tree traversal includes mobile list subfolders, preserving hierarchy',()=>{
 const {root,a,one,nested}=tree();
 const cfg=api.writerV8OverviewConfig('style: list\nsubfolders: true\ndepth: 3');
 const entries=api.writerV8OverviewEntries({},root,cfg);
 assert.ok(entries.some(x=>x.file.path===a.path&&x.kind==='folder'));
 assert.equal(entries.find(x=>x.file.path===nested.path).depth,1);
 assert.equal(entries.find(x=>x.file.path===one.path).depth,0);
 const shallow=api.writerV8OverviewEntries({},root,{...cfg,subfolders:false});
 assert.equal(shallow.some(x=>x.file.path===nested.path),false);
 const notesOnly=api.writerV8OverviewEntries({},root,{...cfg,noteOnly:true});
 assert.equal(notesOnly.some(x=>x.kind==='folder'),false);
 assert.equal(notesOnly.some(x=>x.file.path===nested.path),true);
});
test('name descending and modified ascending sort deterministically, folder-first optional',()=>{
 const {root}=tree();
 const alpha=api.writerV8OverviewEntries({},root,api.writerV8OverviewConfig('sort: name-asc\nsubfolders: false'));
 assert.equal(alpha[0].kind,'folder');
 const mixed=api.writerV8OverviewEntries({},root,api.writerV8OverviewConfig('sort: name-desc\nfolderFirst: false\nsubfolders: false'));
 assert.equal(mixed[0].file.name,'Zeta.md');
 const changed=api.writerV8OverviewEntries({},root,api.writerV8OverviewConfig('sort: modified-desc\nfolderFirst: false\nsubfolders: false'));
 assert.equal(changed[0].file.name,'Alpha.md');
});
test('technical folder-note metadata is not shown as a user-facing card description',()=>{
 const raw='---\nid: secret\nfolderPath: Writing\n---\n\nid: 04aa\nfolderPath: Writing\nshowTitle: true\nstyle: cards\n\n# Overview\nThis is a writing summary.';
 const brief=api.writerV8OverviewPlainBrief(raw,200);
 assert.doesNotMatch(brief,/folderPath|04aa|showTitle/);
 assert.match(brief,/This is a writing summary/);
});
test('renderer uses separate folder expand and open targets on mobile',()=>{
 assert.match(source,/writer-v8-overview-expand/);
 assert.match(source,/if\(entry\.kind==='folder'\)\{current=entry\.file/);
 assert.match(source,/if\(collapsed\.has\(path\)\)collapsed\.delete\(path\)/);
 assert.match(source,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.doesNotMatch(source,/writer-v8-overview-image/);
 assert.match(source,/settings\?\.v9Explorer\?\.items/);
});
test('bundled assets and complete bilingual block guides',()=>{
 const main=fs.readFileSync('main.js','utf8'),styles=fs.readFileSync('styles.css','utf8');
 assert.match(main,/function writerV8OverviewSortOptions/);
 assert.match(main,/function writerV8OverviewStyleOptions/);
 assert.match(styles,/writer-v8-overview-items\.is-board/);
 assert.match(styles,/body\.is-mobile \.writer-v8-overview-expand/);
 for(const file of ['docs/BLOCKS.en.md','docs/BLOCKS.pt-BR.md']){
  const text=fs.readFileSync(file,'utf8');
  for(const fence of ['folder-overview','tabs','wiki','avatar','post','chat','media-gallery',
   'columns','progressbar','widgets','meta-field','insta-toc','longform-nav'])
   assert.ok(text.includes('~~~'+fence),file+': '+fence);
 }
});
