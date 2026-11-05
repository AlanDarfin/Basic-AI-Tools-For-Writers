'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const files=['src/v10/bookshelf.js','src/v10/toolbox.js','src/v9/smart-spaces.js','src/v8/media-gallery.js'];
for(const file of files)test('v10 module exists: '+file,()=>assert.ok(fs.statSync(file).size>100));
test('v10 safe text editor allows ordinary text and rejects large/binary files',()=>{
 class TFile{}
 const context={TFile,Set,console};
 const api=vm.runInNewContext(fs.readFileSync('src/v10/toolbox.js','utf8')+
  '\n({writerV10EditableText,writerV10FormatJson,writerV10TableSortText,writerV10ToolboxMerge})',context);
 const a=new TFile();a.extension='json';a.stat={size:100};
 assert.equal(api.writerV10EditableText(a),true);
 a.extension='pdf';assert.equal(api.writerV10EditableText(a),false);
 a.extension='md';a.stat.size=550000;assert.equal(api.writerV10EditableText(a),false);
 assert.equal(api.writerV10FormatJson('{"a":1}'),'{\n  "a": 1\n}');
 assert.equal(api.writerV10FormatJson('{"oops":}'),null);
 const markdown='| Name | Value |\n| --- | --- |\n| Zoe | 2 |\n| Ana | 1 |';
 assert.equal(api.writerV10TableSortText(markdown).split('\n')[2],'| Ana | 1 |');
 const cfg=api.writerV10ToolboxMerge({});
 assert.equal(cfg.doubleShift,false);
});
test('v10 bookshelf uses existing Longform indices without duplicating books',()=>{
 class TFile{}
 const file=new TFile();file.basename='novel';file.stat={mtime:12};
 const api=vm.runInNewContext(fs.readFileSync('src/v10/bookshelf.js','utf8')+
  '\n({writerV10BookshelfMerge,writerV10BookshelfProjects,writerV10BookshelfSort})',
  {TFile,writerUi:pt=>pt,longformIndex:(value)=>({file:value,title:'Novel',scenes:[],meta:{}})});
 const plugin={settings:{v10Bookshelf:{standalone:[]}},app:{vault:{getMarkdownFiles:()=>[file]}}};
 assert.equal(api.writerV10BookshelfProjects(plugin).length,1);
 assert.equal(api.writerV10BookshelfSort(api.writerV10BookshelfProjects(plugin),'title')[0].title,'Novel');
 assert.equal(api.writerV10BookshelfMerge({}).enabled,true);
});
test('new media gallery supports documents, audio and PDF while retaining legacy aliases',()=>{
 const src=fs.readFileSync('src/v8/media-gallery.js','utf8');
 assert.match(src,/document:\[/);assert.match(src,/audio:\[/);assert.match(src,/pdf:\[/);
 assert.match(src,/writer-media-gallery/);assert.match(src,/media-gallery/);
});
test('Spaces support snapshots that are optional and isolated',()=>{
 const s=fs.readFileSync('src/v9/smart-spaces.js','utf8');
 assert.match(s,/layoutSnapshot/);assert.match(s,/autoSaveLayouts:false/);
 assert.match(s,/restoreLayoutsOnSwitch:false/);
 assert.match(s,/writerV10SpaceSaveLayout/);
});
test('new docs and bundle mention bookshelf and safe text files',()=>{
 for(const p of ['docs/BLOCKS.en.md','docs/BLOCKS.pt-BR.md'])assert.match(fs.readFileSync(p,'utf8'),/bookshelf/);
 const build=fs.readFileSync('scripts/build-v3.js','utf8');
 assert.match(build,/v10\/bookshelf/);assert.match(build,/v10\/toolbox/);
 const main=fs.readFileSync('main.js','utf8');
 assert.match(main,/writerV10RegisterBookshelf\(this\)/);
 assert.match(main,/writerV10RegisterToolbox\(this\)/);
});
