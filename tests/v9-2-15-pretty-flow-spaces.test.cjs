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
test('Explorer hiding combines independent Space rules with global rules',()=>{
 const cfg={v9Spaces:{enabled:true,activeId:'first',spaces:[
  {id:'first',name:'First',hiddenPaths:['Writing/Drafts']},
  {id:'second',name:'Second',hiddenPaths:[]}
 ]}};
 scope.writerV9SpacesMerge(cfg);
 const plugin={settings:cfg};
 assert.equal(scope.writerV91FlexIsHidden({hidden:[]},'Writing/Drafts/chapter.md',[],plugin),true);
 assert.equal(scope.writerV91FlexIsHidden({hidden:['Writing/Drafts/chapter.md']},'Writing/Drafts/chapter.md',[],plugin),true);
 cfg.v9Spaces.activeId='second';
 assert.equal(scope.writerV91FlexIsHidden({hidden:[]},'Writing/Drafts/chapter.md',[],plugin),false);
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
 assert.match(src,/vault\.process/);
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
test('the quick-insert catalogue supplies usable fences without absorbing adjacent prose',()=>{
 const source=read('src/v9/flow-slash.js');
 const {writerV9215SlashActions,writerV9215InsertAction}=vm.runInNewContext(source+
  '\n({writerV9215SlashActions,writerV9215InsertAction})',{require:()=>({EditorSuggest:class{}}),writerUi:pt=>pt});
 const actions=writerV9215SlashActions();
 const fences=new Set(actions.filter(action=>action.fence).map(action=>action.fence));
 for(const fence of ['chat','post','tabs','wiki','avatar','scene-card','character-voice','beat-sheet','editor-note',
  'media-gallery','folder-overview','columns','writer-columns','progressbar','widgets','meta-field','insta-toc',
  'longform-nav','timeline','timeline-labeled','bookshelf','bibliography','basic-database','basic-suite-db',
  'basic-suite-chart','basic-timetable','flow'])assert.ok(fences.has(fence),fence);
 for(const action of actions.filter(action=>action.fence)){
  for(const template of [action.text,action.textPt].filter(Boolean)){
   assert.equal(template.split('\n')[0],'~~~'+action.fence);
   assert.equal(template.split('\n').at(-1),'~~~');
  }
 }
 let value='Before /chat after';
 const editor={getLine:()=>value,replaceRange:(text,from,to)=>{value=value.slice(0,from.ch)+text+value.slice(to.ch);},focus(){}};
 writerV9215InsertAction(actions.find(action=>action.id==='chat'),editor,{line:0,ch:7},{line:0,ch:12});
 assert.match(value,/^Before \n~~~chat\n[\s\S]*Você encontrou o mapa\?[\s\S]*\n~~~\n after$/);
});
