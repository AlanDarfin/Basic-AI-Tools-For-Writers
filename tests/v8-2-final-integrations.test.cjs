'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const src=read('src/v8/finish-blocks.js');
const home=read('src/v8/writing-home.js');
const css=read('src/styles/v8-finish-suite.css');
const fm=vm.runInNewContext(src+'\n({writerV8FinishMerge,writerV8ParseCaption,writerV8CaptionFromImage,writerV8CaptionProcess,writerV8ChatParse})',{});
const hm=vm.runInNewContext(home+'\n({writerV8HomeSearch,writerV8HomeTopFiles,writerV8HomeStats,writerV8HomeToggleFavorite})',{ItemView:class{},TFile:class{},PROJECT_VIEW:'writer-projects'});
test('caption parser preserves user text, filename shorthand and avoids default filenames',()=>{
 assert.equal(fm.writerV8ParseCaption('A red sky','sky.webp'),'A red sky');
 assert.equal(fm.writerV8ParseCaption('%','sky.webp'),'sky');
 assert.equal(fm.writerV8ParseCaption('%.%','sky.webp'),'sky.webp');
 assert.equal(fm.writerV8ParseCaption('sky.webp','sky.webp'),'');
 assert.equal(fm.writerV8ParseCaption('','sky.webp'),'');
 const fake={
  closest:()=>({getAttribute:key=>key==='src'?'Images/sky.webp':key==='alt'?'A beautiful evening|center|240':''}),
  getAttribute:key=>key==='src'?'Images/sky.webp':null
 };
 assert.equal(fm.writerV8CaptionFromImage(fake,180),'A beautiful evening');
});
test('caption feature respects off switch and upstream Image Captions to avoid double captions',()=>{
 const settings={};fm.writerV8FinishMerge(settings);
 assert.equal(settings.v8Finish.homeAtStartup,false);
 assert.equal(settings.v8Finish.captionMax,180);
 const root={querySelectorAll:()=>{throw Error('Should not process when upstream is enabled')}};
 const ctx={settings,app:{plugins:{enabledPlugins:new Set(['image-captions'])}}};
 const env=vm.runInNewContext(src+'\n({writerV8CaptionProcess})',{
  writerModuleOn:()=>true,WRITER_V8_BLOCK_MAX:32000
 });
 assert.doesNotThrow(()=>env.writerV8CaptionProcess(ctx,root));
 ctx.app.plugins.enabledPlugins.clear();settings.v8Finish.captions=false;
 assert.doesNotThrow(()=>env.writerV8CaptionProcess(ctx,root));
});
test('fictional chat parses Markdown message boundaries with optional avatars',()=>{
 const chat=fm.writerV8ChatParse('title: Harbor\n=== Maria\nside: left\navatar: [[Images/maria.webp]]\ntime: 19:00\n---\nI **found it**.\n=== João\nside: right\n---\nWhere?');
 assert.equal(chat.title,'Harbor');
 assert.equal(chat.messages.length,2);
 assert.equal(chat.messages[0].avatar,'[[Images/maria.webp]]');
 assert.equal(chat.messages[0].time,'19:00');
 assert.equal(chat.messages[0].body,'I **found it**.');
 assert.equal(chat.messages[1].avatar,'');
 assert.equal(chat.messages[1].side,'right');
 assert.equal(fm.writerV8ChatParse('x'.repeat(40000)),null);
 assert.match(src,/if\(msg\.avatar&&!continuation\)/);
 assert.match(src,/writerV8ImagePath\(plugin\.app,msg\.avatar,ctx\.sourcePath\)/);
});
test('home dashboard search respects headings and bookmarks remain local',()=>{
 const File=class{constructor(path){this.path=path;this.basename=path.split('/').pop().replace('.md','');this.extension='md';this.stat={mtime:2};}};
 const modules=vm.runInNewContext(home+'\n({writerV8HomeSearch,writerV8HomeToggleFavorite,writerV8HomeTopFiles})',{ItemView:class{},TFile:File,PROJECT_VIEW:'projects'});
 const a=new File('Chapters/Part One.md'),b=new File('World/Island.md');
 const files=[a,b];
 const cache={getFileCache:f=>f===a?{headings:[{heading:'The unexpected letter'}]}:{headings:[]}};
 assert.equal(modules.writerV8HomeSearch(files,'unexpected',cache)[0].path,a.path);
 assert.equal(modules.writerV8HomeSearch(files,'island',cache)[0].path,b.path);
 const plugin={settings:{v8Finish:{homeFavorites:[],homeRecent:[a.path,a.path]}},app:{vault:{getAbstractFileByPath:path=>files.find(f=>f.path===path),getMarkdownFiles:()=>files}}};
 modules.writerV8HomeToggleFavorite(plugin,a.path);
 assert.equal(plugin.settings.v8Finish.homeFavorites[0],a.path);
 modules.writerV8HomeToggleFavorite(plugin,a.path);
 assert.equal(plugin.settings.v8Finish.homeFavorites.length,0);
 assert.equal(modules.writerV8HomeTopFiles(plugin,12).length,2);
});
test('quick drafts are local and persist across switches; export chooses a new path',()=>{
 assert.match(home,/homeQuick=\[|homeQuick\[index\]/);
 assert.match(home,/if\(index>=0\)/);
 assert.match(home,/plugin\.saveSettings/);
 assert.match(home,/this\.app\.vault\.create\(path,body\+'\\n'\)/);
 assert.match(home,/while\(this\.app\.vault\.getAbstractFileByPath\(path\)\)/);
 assert.doesNotMatch(home,/fetch\(|requestUrl\(/);
});
test('dashboard does not replace new tabs by default or add editor extensions',()=>{
 assert.match(home,/if\(plugin\.settings\.v8Finish\.homeAtStartup/);
 assert.match(src,/plugin\.registerMarkdownPostProcessor/);
 assert.match(src,/\['chat','writer-chat'\]/);
 assert.doesNotMatch(home,/registerEditorExtension/);
 assert.doesNotMatch(src,/registerEditorExtension/);
 assert.match(css,/body\.is-mobile \.writer-v8-chat/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.doesNotMatch(css,/!important/);
});
test('published bundle, source and documentation all include final writing features',()=>{
 const bundle=read('main.js');
 for(const marker of ['writerV8FinishMerge','writerV8RegisterFinishBlocks','writerV8RegisterHome','writer-chat','writer-v8-caption'])assert.ok(bundle.includes(marker),marker);
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const docs=read(path);
  for(const feature of ['writer-chat','Image Captions','Soundscapes','writer-post','writer-tabs','writer-media-gallery'])assert.ok(docs.includes(feature),path+': '+feature);
 }
 assert.match(read('scripts/build-v3.js'),/v8\/finish-blocks/);
 assert.match(read('scripts/build-v3.js'),/v8\/writing-home/);
});
