'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
class TFile{
 constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension='md';this.parent={path:path.split('/').slice(0,-1).join('/')};}
}
const index=new TFile('Book/index.md'),one=new TFile('Book/Scenes/One.md'),two=new TFile('Book/Scenes/Two.md'),other=new TFile('Outside/Extra.md');
const files=[index,one,two,other],metadata={longform:{format:'scenes',sceneFolder:'Scenes',scenes:[{title:'One',indent:0},{title:'Two',indent:0}]}};
const app={
 vault:{getMarkdownFiles:()=>files,getAbstractFileByPath:p=>files.find(x=>x.path===p)||null,cachedRead:async()=>''},
 metadataCache:{getFileCache:f=>f===index?{frontmatter:metadata}:null,
  getFirstLinkpathDest:(p)=>files.find(f=>f.path.replace(/\.md$/,'')===p||f.basename===p)||null},
 workspace:{getLeavesOfType:()=>[],getActiveFile:()=>one}
};
const prefs={};
const plugin={app,settings:{bookNavigation:{enabled:true,auto:false,showMain:true,showSub:true},projectsData:{'Book/index.md':{writingSettings:prefs}},lastLongformProject:index.path,visibleModules:{ruby:true,ratings:true}}};
const content=fs.readFileSync('src/v6/longform-navigation.js','utf8')+fs.readFileSync('src/v6/project-workspace.js','utf8');
const api=vm.runInNewContext(content+'\n({writerBookNavParseManual,writerBookNavManualButtons,writerBookNavAutoAllowed,writerBookNavFindProject,writerBookNavHasSourceBlock,writerV6ProjectContext,writerV6ProjectToolAllowed,writerV6ProjectReviewText})',{
 TFile,console,parseYaml:raw=>{
  const o={};for(const line of raw.split('\n')){const match=/^(\w+):\s*(.*)$/.exec(line);if(match){let v=match[2];try{v=JSON.parse(v);}catch{}o[match[1]]=v;}}return o;
 },
 lfPath:(...segs)=>segs.filter(Boolean).join('/').replace(/\/+/g,'/'),
 lfFlattenScenes:xs=>xs,longformIndex:(file)=>file===index?{file,format:'scenes',meta:metadata.longform,scenes:metadata.longform.scenes}:null,
 writerUi:(pt,en)=>en||pt,writerModuleOn:(p,key)=>p.settings.visibleModules?.[key]!==false,
 Setting:class{},Notice:class{},console
});
const manual=api.writerBookNavParseManual('mode: manual\nprevious: "[[Book/Scenes/One]]"\nnext: "[[Outside/Extra]]"');
assert.equal(manual.previous,'[[Book/Scenes/One]]');
const manualButtons=api.writerBookNavManualButtons(app,two.path,manual);
assert.deepEqual(Array.from(manualButtons,x=>x.direction),['previous','next']);
assert.equal(manualButtons[1].target.path,other.path);
assert.equal(api.writerBookNavParseManual(''),null);
assert.equal(api.writerBookNavHasSourceBlock('~~~longform-nav\nmode: manual\n~~~'),true);
assert.equal(api.writerBookNavHasSourceBlock('Some prose.'),false);
const matched=api.writerBookNavFindProject(app,one.path,index.path);
assert.ok(matched);assert.equal(api.writerBookNavAutoAllowed(plugin,matched),false);
prefs.navigation='on';assert.equal(api.writerBookNavAutoAllowed(plugin,matched),true);
prefs.navigation='off';assert.equal(api.writerBookNavAutoAllowed(plugin,matched),false);
prefs.navigation='inherit';plugin.settings.bookNavigation.auto=true;assert.equal(api.writerBookNavAutoAllowed(plugin,matched),true);
const project=api.writerV6ProjectContext(plugin,one.path);assert.equal(project.indexPath,index.path);
assert.equal(api.writerV6ProjectToolAllowed(plugin,'ruby',one.path),true);
prefs.tools={ruby:'off'};assert.equal(api.writerV6ProjectToolAllowed(plugin,'ruby',one.path),false);
assert.equal(api.writerV6ProjectToolAllowed(plugin,'ratings',one.path),true);
prefs.reviewProfile='Review voices and punctuation';assert.equal(api.writerV6ProjectReviewText(plugin,one),'Review voices and punctuation');
const insert=fs.readFileSync('src/v6/smart-insert.js','utf8');
const ui=vm.runInNewContext(insert+'\n({writerV6InsertSnapshot,writerV6InsertIfUnchanged,writerV6InsertValidRubyText})',{
 Notice:class{},writerUi:(a,b)=>b||a,Modal:class{},Setting:class{},Menu:class{},console
});
const edits=[];const ed={value:'abc',getValue(){return this.value;},getCursor:()=>({line:0,ch:1}),getSelection:()=> 'b',replaceRange:(s,a,b)=>edits.push({s,a,b})};
const snapshot=ui.writerV6InsertSnapshot(ed);assert.equal(ui.writerV6InsertIfUnchanged(ed,snapshot,'{b|bee}'),true);
assert.equal(edits.length,1);ed.value='different';assert.equal(ui.writerV6InsertIfUnchanged(ed,snapshot,'unsafe'),false);
assert.equal(ui.writerV6InsertValidRubyText('Word'),true);assert.equal(ui.writerV6InsertValidRubyText('Word|bad'),false);
for(const name of ['src/v6/longform-navigation.js','src/v6/smart-insert.js','src/v6/project-workspace.js']){
 const main=fs.readFileSync('main.js','utf8');assert.ok(main.includes('// v3 module: '+name));
}
assert.ok(fs.readFileSync('main.js','utf8').includes('writerV6ProjectReviewText(this,targetFile)'));
assert.ok(fs.readFileSync('projects.js','utf8').includes('writerV6ProjectPreferencesRender(this,panel,project)'));
assert.ok(fs.readFileSync('styles.css','utf8').includes('.writer-v6-smart-insert'));
assert.ok(fs.readFileSync('README.md','utf8').includes('6.0.0-beta.4'));
assert.ok(fs.readFileSync('docs/README.pt-BR.md','utf8').includes('6.0.0-beta.4'));
console.log('PASS v6 beta4: manual nav, project auto override, per-project tools, editorial context and safe smart insertion');
