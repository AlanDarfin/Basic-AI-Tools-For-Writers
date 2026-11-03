'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const pretty=read('src/v9/pretty-properties.js');
const flow=read('src/v9/flow-slash.js');
const spaces=read('src/v9/smart-spaces.js');
const flex=read('src/v9/explorer-flex.js');
class TFile{constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension='md';}}
class TFolder{constructor(path){this.path=path;}}
const context={console,TFile,TFolder,Modal:class{},Setting:class{},ItemView:class{},
 EditorSuggest:class{constructor(app){this.app=app;}},
 writerUi:(pt,en)=>en,writerV9SafeHex:s=>s,
 writerV9AvailableIcons:()=>['star','file-text','book-open','folder','heart'],
 writerV921ResolveImage:()=>null,
 require:()=>({setIcon:(el,name)=>{el.renderedIcon=name;}})};
const pp=vm.runInNewContext(pretty+'\n({merge:writerV93PrettyMerge,color:writerV93PrettyRulesParse,progress:writerV93PrettyProgressParse,select:writerV93PrettySelectParse,title:writerV93PrettyUpdateIcon})',context);
const fsApi=vm.runInNewContext(spaces+'\n({merge:writerV9SpacesMerge,sanitize:writerV9SpaceSanitize})',context);
const flexApi=vm.runInNewContext(flex+'\n({scope:writerV91FlexScope,set:writerV91FlexSetScope})',context);
const fl=vm.runInNewContext(flow+'\n({parse:writerV93FlowParse,key:writerV93FlowKey,merge:writerV93FlowMerge,Slash:WriterV93SlashSuggest,actions:WRITER_V93_SLASH_ACTIONS})',context);
test('Pretty settings: valid colors, hidden keys, progress and select options are sanitized',()=>{
 const settings={v93Pretty:{hiddenProperties:['id','id','invalid key'],colorRules:{status:{Done:'#56AA66',bad:'pink'}},
  progressRules:{words:'goal',bad:-5},selectOptions:{status:['Done','Done','Draft']}}};
 pp.merge(settings);
 assert.deepEqual(Array.from(settings.v93Pretty.hiddenProperties),['id']);
 assert.equal(settings.v93Pretty.colorRules.status.Done,'#56AA66');
 assert.equal(settings.v93Pretty.colorRules.status.bad,undefined);
 assert.equal(settings.v93Pretty.progressRules.words,'goal');
 assert.equal(settings.v93Pretty.progressRules.bad,undefined);
 assert.deepEqual(Array.from(settings.v93Pretty.selectOptions.status),['Done','Draft']);
 const colors=pp.color('status: Done = #56aa66\npriority: High = #ff0000\ninvalid');
 assert.equal(colors.status.Done,'#56aa66');
 const prog=pp.progress('words: goal\nprogress: 100\nbad: -1');
 assert.equal(prog.words,'goal');assert.equal(prog.progress,100);
 const select=pp.select('status: Draft | Review | Done');
 assert.equal(select.status.length,3);
});
test('Inline title icon uses existing explorer icon, without touching Markdown source',()=>{
 const file=new TFile('Book/Chapter.md');
 const children=[];
 const title={
  classList:{add(name){this[name]=true;},remove(name){delete this[name];}},
  ownerDocument:{createElement(tag){
   return {tagName:tag,className:'',dataset:{},style:{removeProperty(){}},
    setAttribute(){},replaceChildren(){},remove(){}};
  }},
  querySelector(){return children[0]||null;},
  prepend(node){children.unshift(node);}
 };
 const plugin={settings:{v93Pretty:{enabled:true,titleIcons:true},v9Explorer:{items:{
  'Book/Chapter.md':{icon:'star',color:'#aabbcc'}}}},
  app:{metadataCache:{getFileCache:()=>({frontmatter:{icon:'heart'}})}}};
 pp.title(plugin,{containerEl:{querySelector:()=>title}},file);
 assert.equal(children.length,1);
 assert.equal(children[0].renderedIcon,'star','explorer icon takes priority over YAML');
 assert.equal(children[0].style.color,'#aabbcc');
 assert.equal(title.classList['writer-v93-has-title-icon'],true);
 pp.title(plugin,{containerEl:{querySelector:()=>title}},file);
 assert.equal(children.length,1,'no icon duplication on rerender');
});
test('Space-specific hidden paths, pins and sort do not leak across active Spaces',()=>{
 const config={v9Spaces:{enabled:true,activeId:'one',spaces:[
  {id:'one',name:'One',hiddenPaths:['Book/Secret'],pinnedPaths:[],folderSettings:{'':{sort:'name'}}},
  {id:'two',name:'Two',hiddenPaths:[],pinnedPaths:['Book/Note.md'],folderSettings:{}}
 ]},v91Flex:{enabled:true,hidden:['Global'],pinned:['Pinned'],folders:{},patterns:'',showHidden:false}};
 fsApi.merge(config);
 const plugin={settings:config};
 let active=flexApi.scope(plugin);
 assert.deepEqual(Array.from(active.hidden),['Book/Secret']);
 flexApi.set(plugin,'hidden',['Book/Secret','Book/Drafts']);
 assert.equal(config.v9Spaces.spaces[0].hiddenPaths.length,2);
 config.v9Spaces.activeId='two';active=flexApi.scope(plugin);
 assert.equal(active.hidden.length,0);
 assert.equal(active.pinned[0],'Book/Note.md');
 config.v9Spaces.activeId='';
 active=flexApi.scope(plugin);
 assert.equal(active.hidden[0],'Global');
 assert.equal(config.v9Spaces.spaces[1].hiddenPaths.length,0);
});
test('Flow parses ordered columns and safe card text, settings remain separate from Markdown',()=>{
 const src='id: chapter-map\n=== Draft\n- First scene\n- [x] Second scene\n=== Review\n- Edit dialogue';
 const board=fl.parse(src);
 assert.equal(board.id,'chapter-map');
 assert.deepEqual(Array.from(board.columns.map(c=>c.name)),['Draft','Review']);
 assert.equal(board.columns[0].cards.length,2);
 assert.equal(board.columns[1].cards[0].label,'Edit dialogue');
 const settings={};fl.merge(settings);
 assert.equal(settings.v93Flow.enabled,true);
 assert.equal(settings.v93Flow.slashEnabled,false,'slash menu is opt-in');
 assert.equal(fl.key('Book/Chapter.md',board.id),'Book/Chapter.md::chapter-map');
});
test('Slash suggestions trigger only after slash and replace just the typed expression',()=>{
 const cfg={v93Flow:{slashEnabled:true}},p={app:{},settings:cfg};
 const suggest=new fl.Slash(p);
 const editor={getLine:()=>'/flo',replaceRange:(content,start,end)=>{
  editor.result={content,start,end};
 }};
 const trigger=suggest.onTrigger({line:0,ch:4},editor,null);
 assert.equal(trigger.start.ch,0);assert.equal(trigger.query,'flo');
 const choices=suggest.getSuggestions(trigger);
 assert.equal(choices[0].id,'flow');
 suggest.context={...trigger,editor};
 suggest.selectSuggestion(choices[0]);
 assert.match(editor.result.content,/flow\nid:/);
 assert.equal(editor.result.end.ch,4);
 cfg.v93Flow.slashEnabled=false;
 assert.equal(suggest.onTrigger({line:0,ch:4},editor,null),null);
});
test('Existing preview is promoted to a full card with responsive image on mobile',()=>{
 const css=read('src/styles/v9-3-pretty-flow.css');
 assert.match(css,/writer-v92-preview-shell\.has-image/);
 assert.match(css,/aspect-ratio:16\/9/);
 assert.match(css,/body\.is-mobile/);
 assert.match(css,/writer-v93-title-icon/);
 assert.match(css,/writer-v93-flow-column/);
});
test('Full plugin registers new modules and settings without overriding native Obsidian',()=>{
 const main=read('main.js'),builder=read('scripts/build-v3.js'),styles=read('styles.css');
 for(const name of ['writerV93PrettyMerge','writerV93PrettyRegister','writerV93PrettySettings',
  'writerV93FlowMerge','writerV93FlowRegister','writerV93FlowSettings','writerV91FlexScope']){
  assert.ok(main.includes(name),name);
 }
 assert.match(builder,/v9\/pretty-properties/);
 assert.match(builder,/v9\/flow-slash/);
 assert.match(styles,/writer-v93-pretty-cover/);
 assert.doesNotMatch(pretty,/require\(['"]electron['"]\)|eval\(|new Function\(/);
 const p=JSON.parse(read('package.json')),m=JSON.parse(read('manifest.json'));
 assert.equal(p.version,m.version);
});
