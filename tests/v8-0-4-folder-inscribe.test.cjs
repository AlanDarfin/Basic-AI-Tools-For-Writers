'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=fs.readFileSync('src/v7/worldbuilding.js','utf8');
const overview=fs.readFileSync('src/v8/folder-overview.js','utf8');
const inline=fs.readFileSync('src/v8/inline-ai.js','utf8');
const css=fs.readFileSync('src/styles/v8-folder-inscribe.css','utf8');
class TFolder{constructor(path,children=[]){this.path=path;this.name=path.split('/').pop();this.children=children;}}
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');}}
const appFactory=()=>{
 const inner=new TFile('Work/Work.md'),one=new TFile('Work/Chapter.md'),nested=new TFile('Work/Writing/Scene.md');
 const dir=new TFolder('Work/Writing',[nested]);inner.parent=dir.parent=null;one.parent=null;nested.parent=dir;
 const root=new TFolder('Work',[one,inner,dir]);inner.parent=root;one.parent=root;dir.parent=root;
 const map=new Map([root,dir,inner,one,nested].map(v=>[v.path,v]));
 return {app:{vault:{getAbstractFileByPath:path=>map.get(path)||null}},root,dir,inner,one};
};
const worldFn=world.slice(world.indexOf('function writerV7FolderNote('),world.indexOf('function writerV7InheritedTags('));
const env={TFolder,TFile,writerV7FolderNote:null,console};
const {writerV7FolderNote}=vm.runInNewContext(worldFn+'\n({writerV7FolderNote})',env);
const local=vm.runInNewContext(overview.slice(0,overview.indexOf('function writerV8RegisterFolderOverview('))+'\n({writerV8OverviewConfig,writerV8OverviewRoot,writerV8OverviewEntries})',
 {TFolder,TFile,writerV7FolderNote,console});
const inlineFns=vm.runInNewContext(inline.slice(0,inline.indexOf('class WriterV8InlineAI'))+'\n({writerV8InlineMerge,writerV8InlineProfile,writerV8InlinePrompt,writerV8InlineClean})',{});
test('Folder notes recognize the same-name note within a folder without hiding ordinary notes',()=>{
 const {app,root,inner,one}=appFactory();
 assert.equal(writerV7FolderNote(app,root).path,inner.path);
 assert.notEqual(one.path,inner.path);
 assert.match(world,/nav-file-title\[data-path\]/);
 assert.match(world,/hiddenPaths\.has\(title\.getAttribute\('data-path'\)\)/);
 assert.match(world,/writer-v7-folder-note-hidden/);
 assert.match(world,/clearExplorerDecorations\(\)/);
 assert.match(world,/setIcon\(button,'book-open'\)/);
 assert.match(css,/\.nav-file\.writer-v7-folder-note-hidden\s*\{\s*display:none/);
 assert.match(css,/inset-inline-end:4px/);
});
test('Overview handles folder, subfolder, and excludes folder note duplicates',()=>{
 const {app,root,dir}=appFactory();
 const options=local.writerV8OverviewConfig('style: list\nsubfolders: true\ndepth: 2\nlimit: 48');
 assert.equal(options.style,'list');assert.equal(options.depth,2);
 const entries=local.writerV8OverviewEntries(app,root,options);
 assert.ok(entries.some(x=>x.file.path==='Work/Chapter.md'));
 assert.ok(entries.some(x=>x.file.path==='Work/Writing/Scene.md'));
 assert.ok(entries.some(x=>x.file.path==='Work/Writing'));
 assert.ok(!entries.some(x=>x.file.path==='Work/Work.md'));
 assert.equal(local.writerV8OverviewRoot(app,'Work/Work.md',options).path,root.path);
 const none=local.writerV8OverviewConfig('folder: ../secret\nlimit: 999\ndepth: 99');
 assert.ok(!none.folder);assert.equal(none.limit,80);assert.equal(none.depth,3);
});
test('Overview registered as own block, avoids breaking third-party ccard',()=>{
 assert.match(overview,/registerMarkdownCodeBlockProcessor\('writer-folder-overview'/);
 assert.doesNotMatch(overview,/registerMarkdownCodeBlockProcessor\('ccard'/);
 assert.match(world,/writerV8RegisterFolderOverview\(p\)/);
 assert.match(world,/writer-folder-overview/);
});
test('inline AI is opt-in, path profiles obey boundaries, prompts use short context',()=>{
 const settings={inlineAI:{enabled:true,auto:false,pathProfiles:'Books/|creative\nBooks/Private/|off\nResearch/|formal',maxChars:800}};
 const cfg=inlineFns.writerV8InlineMerge(settings);
 assert.equal(cfg.auto,false);assert.equal(cfg.maxChars,400);
 assert.equal(inlineFns.writerV8InlineProfile(cfg,'Books/One.md'),'creative');
 assert.equal(inlineFns.writerV8InlineProfile(cfg,'Books/Private/Note.md'),'off');
 assert.equal(inlineFns.writerV8InlineProfile(cfg,'Bookshelf/One.md'),'default');
 assert.equal(inlineFns.writerV8InlineProfile(cfg,'Research/Essay.md'),'formal');
 const doc={length:21,sliceString:(a,b)=>'Testing a short story.'.slice(a,b)};
 const prompt=inlineFns.writerV8InlinePrompt(cfg,doc,21,'creative');
 assert.match(prompt,/BEFORE:/);
 assert.ok(prompt.length<5000);
 assert.equal(inlineFns.writerV8InlineClean('story. next part','story.',100),' next part');
});
test('manual generation cannot overwrite notes and defaults are disabled',()=>{
 const settings={};
 assert.equal(inlineFns.writerV8InlineMerge(settings).enabled,false);
 assert.match(inline,/registerEditorExtension/);
 assert.match(inline,/plugin\.lookupAI/);
 assert.match(inline,/view\.state\.doc!==doc/);
 assert.match(inline,/stateEffect\.of\(\{at:pos,text:suggested\}\)/);
 assert.match(inline,/key:'Tab'/);
 assert.match(inline,/key:'Escape'/);
 assert.match(inline,/minInterval:15000/);
});
test('bundled files, tests and README mention all requested blocks',()=>{
 const main=fs.readFileSync('main.js','utf8'),styles=fs.readFileSync('styles.css','utf8'),readme=fs.readFileSync('README.md','utf8'),pt=fs.readFileSync('docs/README.pt-BR.md','utf8');
 for(const name of ['writer-tabs','writer-avatar','writer-wiki','writer-folder-overview']){assert.ok(main.includes(name),name);assert.ok(readme.includes(name),name);assert.ok(pt.includes(name),name);}
 assert.ok(main.includes('WriterV8InlineAI'));
 assert.ok(styles.includes('writer-v8-inline-ghost'));
 assert.match(readme,/Inscribe-inspired/);
 assert.match(pt,/Inscribe/);
 assert.doesNotMatch(css,/!important/);
});
