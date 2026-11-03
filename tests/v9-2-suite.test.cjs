'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const files=['src/v9/explorer-favorites-preview.js','src/v9/interactive-widgets.js','src/v9/research-style.js','src/v9/session-drafts.js'];
const sources=files.map(read);
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.parent={path:path.split('/').slice(0,-1).join('/')};}}
class TFolder{constructor(path){this.path=path;this.name=path.split('/').at(-1);this.children=[];}}
const novel=new TFile('Novel/Chapter.md'),folder=new TFolder('Novel'),folderNote=new TFile('Novel/Novel.md');
const cache={frontmatter:{description:'Folder description from YAML',tags:['zotero'],author:'Researcher',title:'Research work'},tags:[]};
const vault={getAbstractFileByPath:path=>[novel,folder,folderNote].find(x=>x.path===path)||null,getMarkdownFiles:()=>[novel,folderNote],cachedRead:async()=> '# Highlights\n> A passage explicitly marked as a highlight in Zotero.'};
const plugin={settings:{v8Finish:{homeFavorites:['Novel/Chapter.md']}},app:{vault,metadataCache:{getFileCache:()=>cache}}};
const context={TFile,TFolder,Date,Set,Map,Number,String,Object,Array,Math,RegExp,console,writerUi:(a,b)=>b,
 writerModuleOn:()=>true,writerV7FolderNote:()=>folderNote,WRITER_V8_HOME_VIEW:'home',
 ItemView:class{},Setting:class{},MarkdownRenderer:{render:async()=>{}},require:()=>({setIcon:()=>{}})};
const api=vm.runInNewContext(sources.join('\n')+'\n({writerV92ExplorerMerge,writerV92Favorite,writerV92PreviewValue,writerV921PreviewSource,writerV921PreviewBody,writerV921ResolveImage,writerV921PreviewImage,writerV92BlockOptions,writerV92ProgressData,writerV92BlocksMerge,writerV92ZoteroExtract,writerV92ZoteroIsSource,writerV92ResearchMerge,writerV92SessionMerge})',context);
test('9.2.x metadata, modules and CSS',()=>{
 const manifest=JSON.parse(read('manifest.json')),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),versions=JSON.parse(read('versions.json'));
 assert.match(manifest.version,/^\d+\.\d+\.\d+$/);assert.equal(pkg.version,manifest.version);assert.equal(lock.version,manifest.version);
 assert.equal(versions[manifest.version],'1.11.4');
 const main=read('main.js'),css=read('styles.css');
 for(const path of files)assert.ok(main.includes('// v3 module: '+path));
 for(const name of ['writerV92ExplorerRegister(this)','writerV92RegisterBlocks(this)','writerV92ResearchRegister(this)','writerV92SessionRegister(this)'])assert.ok(main.includes(name));
 for(const name of ['writer-v92-favorite','writer-v92-file-preview','writer-v92-progress','writer-v92-session'])assert.ok(css.includes(name));
 assert.ok(read('scripts/build-v3.js').includes("'v9/session-drafts'"));
 assert.ok(read('scripts/build-css.js').includes('v9-2-suite.css'));
});
test('favorites reuse homepage list and folder note descriptions',()=>{
 const cfg=api.writerV92ExplorerMerge(plugin.settings);
 assert.equal(cfg.favoriteIcon,'star');assert.equal(cfg.previewMode,'folder');
 assert.equal(api.writerV92Favorite(plugin,novel.path),true);
 assert.equal(api.writerV92PreviewValue(plugin,folder),'Folder description from YAML');
 assert.equal(api.writerV92PreviewValue(plugin,novel),'');
 cfg.previewMode='all';assert.equal(api.writerV92PreviewValue(plugin,novel),'Folder description from YAML');
 cfg.previewMode='off';assert.equal(api.writerV92PreviewValue(plugin,folder),'');
});
test('progressbar supports manual, year, month, week and date',()=>{
 const opts=api.writerV92BlockOptions('kind: manual\nvalue: 40\nmin: 0\nmax: 80\nname: Progress');
 assert.equal(api.writerV92ProgressData(opts).percent,50);
 assert.equal(api.writerV92ProgressData({kind:'day-year'},new Date(2024,11,31)).max,366);
 assert.equal(api.writerV92ProgressData({kind:'day-week'},new Date(2026,10,2)).value,1);
 assert.equal(api.writerV92ProgressData({kind:'month'},new Date(2026,10,2)).value,11);
 assert.equal(api.writerV92ProgressData({kind:'day-custom',min:'2026-11-01',max:'2026-11-11'},new Date(2026,10,6)).percent,55);
});
test('Zotero quotes must be explicit highlights with source',()=>{
 const cfg=api.writerV92ResearchMerge(plugin.settings);cfg.zoteroQuotes=true;
 assert.equal(api.writerV92ZoteroIsSource(plugin,folderNote),true);
 const text='# Abstract\nSome unquoted abstract text.\n# Highlights\n> A passage explicitly marked as a highlight in Zotero.';
 const quotes=api.writerV92ZoteroExtract(plugin,folderNote,text);
 assert.equal(quotes.length,1);
 assert.match(quotes[0][0],/explicitly marked/);
 assert.equal(quotes[0][2],folderNote.path);
 assert.equal(api.writerV92ZoteroExtract(plugin,folderNote,'# Abstract\nThis is a normal sentence.').length,0);
});
test('session drafts never delete existing vault files',()=>{
 assert.equal(api.writerV92SessionMerge({}).enabled,true);
 const src=read('src/v9/session-drafts.js');
 assert.doesNotMatch(src,/vault\.(delete|trash|modify|process)\(/);
 assert.match(src,/vault\.create\(/);
 assert.match(src,/Confirm discard/);
});
test('blocks do not execute arbitrary JS actions',()=>{
 const cfg=api.writerV92BlocksMerge({});
 assert.equal(cfg.metaFields,true);
 const src=read('src/v9/interactive-widgets.js');
 assert.match(src,/processFrontMatter/);
 assert.doesNotMatch(src,/eval\(|new Function\(/);
 for(const type of ['columns','progressbar','widgets','meta-field'])assert.ok(src.includes("register('"+type+"'"));
});

test('9.2.1 Explorer has a right-aligned interactive favorite and bottom preview toggle',()=>{
 const src=read('src/v9/explorer-favorites-preview.js'),css=read('src/styles/v9-2-suite.css');
 assert.match(src,/writer-v921-preview-toggle/);
 assert.match(src,/nav-header > \.nav-buttons-container/);
 assert.match(src,/aria-pressed/);
 assert.match(src,/writerV92ToggleFavorite\(plugin,button\.dataset\.path\)/);
 assert.match(css,/inset-inline-end:4px/);
 assert.match(css,/writer-v92-is-favorite .*writer-v92-favorite svg/);
 assert.match(css,/body\.is-mobile[\s\S]*writer-v92-favorite/);
 assert.match(src,/previewVisible/);
 assert.match(src,/previewLines/);
 assert.match(src,/previewImageSize/);
});
test('9.2.1 first embedded local image and YAML cover resolve with safe resource paths',()=>{
 const image=new TFile('Novel/cover.png');image.extension='png';
 const old=vault.getAbstractFileByPath;
 vault.getAbstractFileByPath=path=>path===image.path?image:old(path);
 try{
  const resolved=api.writerV921ResolveImage(plugin,folderNote,'![[cover.png|100]]');
  assert.equal(resolved.path,'Novel/cover.png');
  assert.equal(api.writerV921ResolveImage(plugin,folderNote,'https://example.com/image.png'),null);
  assert.equal(api.writerV921PreviewImage(plugin,folderNote,'# Hello\n![[cover.png]]').path,image.path);
 }finally{vault.getAbstractFileByPath=old;}
});
test('9.2.1 excerpt removes frontmatter and embedded image markup',()=>{
 const excerpt=api.writerV921PreviewBody('---\ndescription: test\n---\n# Heading\n\nFirst **paragraph** with a [[Link|label]].\n\n![[image.png]]',100);
 assert.ok(excerpt.includes('First paragraph with a label'));
 assert.ok(!excerpt.includes('description:'));
 assert.ok(!excerpt.includes('image.png'));
});
