'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class TFile{
 constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
const index=new TFile('Books/Bonfire/Index.md');
const titles=['Avisos','Sinopse','Dedicatória','Capítulo 1'];
const all=[index,...titles.map(t=>new TFile('Books/Bonfire/Cenas/'+t+'.md'))];
const scenes=titles.map((title,i)=>({title,indent:(i===1||i===2)?1:0}));
const app={
 vault:{getMarkdownFiles:()=>all,getAbstractFileByPath:p=>all.find(f=>f.path===p)||null,cachedRead:async()=> '---\nlongform:\n  format: scenes\n  scenes: []\n---\n'},
 metadataCache:{getFileCache:f=>f===index?{frontmatter:{longform:{format:'scenes',sceneFolder:'Cenas',scenes:[]}}}:null}
};
const n=vm.runInNewContext(fs.readFileSync('src/v6/longform-navigation.js','utf8')+'\n({writerBookNavFindProject,writerBookNavFindProjectAsync,writerBookNavTargets})',{
 TFile,console,parseYaml:()=>({longform:{format:'scenes',sceneFolder:'Cenas',scenes}}),
 longformIndex:f=>f===index?{file:index,format:'scenes',meta:{sceneFolder:'Cenas'},scenes:[]}:null,
 lfPath:(...xs)=>xs.filter(Boolean).join('/').replace(/\/+/g,'/'),
 lfFlattenScenes:x=>x,writerUi:(a,b)=>b||a,writerModuleOn:()=>true,Setting:class{},Notice:class{}
});
(async()=>{
 assert.equal(n.writerBookNavFindProject(app,all[1].path,index.path),null);
 const project=await n.writerBookNavFindProjectAsync(app,all[1].path,index.path);
 assert.ok(project);assert.deepEqual(Array.from(project.items,x=>x.title),titles);
 const links=n.writerBookNavTargets(project.items,all[1].path);
 assert.equal(links.nextMain.path,all[4].path);
 assert.equal(links.nextSub.path,all[2].path);
 const Decoration={mark:x=>({mark:x}),replace:x=>({replace:x}),line:x=>({line:x}),set:xs=>xs,none:[]};
 const m=vm.runInNewContext(fs.readFileSync('src/v6/markup.js','utf8')+'\n({writerV6RubyTokens,writerV6RubyHtml,writerV6RubyStrip,writerV6MarkupDecorations,WriterV6RubyWidget})',{
 require:x=>x==='@codemirror/view'?{WidgetType:class{}}:{},
 writerUi:(a,b)=>b||a,writerModuleOn:()=>true,writerV6ProtectedRanges:()=>[],
 writerV6Overlaps:()=>false,writerV6SafeTextNodes:()=>[],Decoration,ViewPlugin:null,console
 });
 const tokens=m.writerV6RubyTokens('{Teste|teste 1} / {漢字|かんじ|under}');
 assert.equal(tokens.length,2);assert.equal(tokens[0].position,'over');assert.equal(tokens[1].position,'under');
 assert.match(m.writerV6RubyHtml('{word|note|under}'),/writer-v6-ruby-under/);
 assert.equal(m.writerV6RubyStrip('{word|note|under}'),'word');
 const txt='Antes {Teste|teste 1|under} depois.';
 const doc={length:txt.length,toString:()=>txt,lineAt:()=>({number:1}),line:()=>({from:0,to:txt.length,text:txt})};
 const pl={settings:{v6:{ruby:{enabled:true,livePreview:true,lv1Size:50,lv2Size:45},discordSyntax:{enabled:false},ratings:{enabled:false}}}};
 const view={state:{doc,selection:{main:{from:0,to:0}}},visibleRanges:[{from:0,to:doc.length}]};
 assert.ok(m.writerV6MarkupDecorations(view,pl).some(x=>x.replace?.widget instanceof m.WriterV6RubyWidget));
 view.state.selection.main={from:11,to:11};
 assert.ok(m.writerV6MarkupDecorations(view,pl).some(x=>x.mark),'active source must stay editable');
 assert.match(fs.readFileSync('styles.css','utf8'),/\.writer-v6-ruby-under/);
 assert.match(fs.readFileSync('main.js','utf8'),/writerBookNavFindProjectAsync/);
 console.log('PASS beta3: Longform YAML fallback, chapter order, Ruby under and live-edit decorations');
})().catch(e=>{console.error(e);process.exitCode=1;});
