'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const spaceSource=read('src/v9/smart-spaces.js');
const flexSource=read('src/v9/explorer-flex.js');
const sandbox={ItemView:class {}};
const scope=vm.runInNewContext(spaceSource+'\n'+flexSource+
 '\n({writerV9SpacesMerge,writerV9215ActiveSpace,writerV9215SpaceHidden,writerV91FlexIsHidden})',sandbox);
test('Space explorer visibility is isolated to its active Space',()=>{
 const cfg={v9Spaces:{enabled:true,activeId:'first',spaces:[
  {id:'first',name:'First',hiddenPaths:['Writing/Drafts']},
  {id:'second',name:'Second',hiddenPaths:[]}
 ]}};
 scope.writerV9SpacesMerge(cfg);
 const plugin={settings:cfg};
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Writing/Drafts/chapter.md'),true);
 assert.equal(scope.writerV91FlexIsHidden({hidden:[]},'Writing/Drafts/chapter.md',[],plugin),true);
 cfg.v9Spaces.activeId='second';
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Writing/Drafts/chapter.md'),false);
 assert.equal(scope.writerV91FlexIsHidden({hidden:[]},'Writing/Drafts/chapter.md',[],plugin),false);
 cfg.v9Spaces.activeId='';
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Writing/Drafts/chapter.md'),false);
});
test('Pretty Properties sanitizes settings and stays native and local',()=>{
 const src=read('src/v9/pretty-properties.js');
 const helpers=vm.runInNewContext(src+'\n({writerV9215PrettyMerge,writerV9215PrettyPairs})',{});
 const cfg={v9215Pretty:{hidden:['Status','status'],colors:'status=#aabbcc'}};
 helpers.writerV9215PrettyMerge(cfg);
 assert.deepEqual(Array.from(cfg.v9215Pretty.hidden),['status']);
 assert.equal(helpers.writerV9215PrettyPairs('status=#aabbcc').status,'#aabbcc');
 assert.match(src,/processFrontMatter/);
 assert.match(src,/writerV9215PrettyImage/);
 assert.match(src,/writer-v9215-property-progress/);
 assert.doesNotMatch(src,/fetch\s*\(/);
});
test('slash actions and Flow preserve editable note files',()=>{
 const src=read('src/v9/flow-slash.js');
 const helpers=vm.runInNewContext(src+'\n({writerV9215SlashActions,writerV9215FlowMerge})',{
  require:()=>({EditorSuggest:class{}})
 });
 const actions=Array.from(helpers.writerV9215SlashActions());
 for(const id of ['h1','todo','callout','table','flow'])assert.ok(actions.some(a=>a.id===id));
 const cfg={};helpers.writerV9215FlowMerge(cfg);
 assert.equal(cfg.v9215Flow.slash,true);
 assert.match(src,/registerEditorSuggest/);
 assert.match(src,/registerMarkdownPostProcessor/);
 assert.match(src,/stat\?\.mtime/);
 assert.match(src,/vault\.modify/);
});
test('compiled stylesheet will contain right-side previews and white/inherited title icons',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 assert.match(css,/flex-direction:row/);
 assert.match(css,/aspect-ratio:1/);
 assert.match(css,/margin-inline-start:auto/);
 assert.match(css,/color:inherit/);
 assert.match(css,/writer-v9215-flow-editor/);
 assert.match(css,/writer-v9215-pretty-banner/);
});
