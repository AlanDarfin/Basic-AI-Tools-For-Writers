'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {test}=require('node:test');
const vm=require('node:vm');

const main=fs.readFileSync('main.js','utf8');
const typo={offset:0,length:3,message:'Check this word',replacements:[{value:'The'}],rule:{id:'SPELLING'}};

class TFile{
 constructor(path){this.path=path;this.extension='md';}
}
class Element{
 constructor(text=''){this.text=text;this.children=[];this.dataset={};this.events={};}
 empty(){this.children=[];}
 setText(text){this.text=text;}
 setAttribute(){}
 addEventListener(type,callback){this.events[type]=callback;}
 createEl(_tag,{text}={}){const element=new Element(text);element.parent=this;this.children.push(element);return element;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
 focus(){this.focused=true;}
 find(text){return this.text===text?this:this.children.map(child=>child.find(text)).find(Boolean);}
 get textContent(){return this.text+this.children.map(child=>child.textContent).join(' ');}
}

function harness(){
 const requests=[],leaves=[],events={};
 const Empty=class{};
 const obsidian={Plugin:Empty,ItemView:Empty,PluginSettingTab:Empty,Setting:Empty,Notice:Empty,
  MarkdownView:class{},TFile,TFolder:Empty,Modal:Empty,FuzzySuggestModal:Empty,EditorSuggest:Empty,
  getLanguage:()=> 'en',requestUrl:options=>new Promise(resolve=>{
   const respond=(matches,status=200)=>resolve({status,json:{matches}});
   requests.push({text:new URLSearchParams(options.body).get('text'),respond});
  })};
 const modules={obsidian,
  '@codemirror/state':{StateField:{define:()=>({})},StateEffect:{define:()=>({of:value=>value})}},
  '@codemirror/view':{Decoration:{none:{}},EditorView:{decorations:{from:()=>({})}},ViewPlugin:{fromClass:()=>({})}}
 };
 const {DictionaryView,Plugin,WriterAutoGrammar}=vm.runInNewContext(
  main+'\n({DictionaryView,Plugin:module.exports,WriterAutoGrammar})',
  {require:name=>{if(!Object.hasOwn(modules,name))throw Error('Unknown import: '+name);return modules[name];},
   module:{exports:{}},URL,URLSearchParams,setTimeout,clearTimeout}
 );
 const plugin=new Plugin();
 plugin.settings={reviewEngine:'basic',reviewAutoOpenNote:false,autoGrammar:{enabled:false}};
 plugin.app={
  workspace:{
   on:(name,callback)=>{events[name]=callback;},
   getLeavesOfType:type=>type==='markdown'?leaves:[{view}],
   iterateAllLeaves:callback=>leaves.forEach(callback)
  },
  vault:{getMarkdownFiles:()=>[],getAbstractFileByPath:path=>leaves.find(leaf=>leaf.view.file.path===path)?.view.file}
 };
 const view=new DictionaryView({},plugin);
 Object.assign(view,{activeTab:'review',reviewMode:{value:'grammar'},reviewBusy:false,
  reviewResults:new Element(),reviewStatus:new Element()});
 plugin.autoGrammar=new WriterAutoGrammar(plugin);
 plugin.registerEvent=()=>{};plugin.autoGrammar.register();

 function note(path,text,cursor=0){
  const file=new TFile(path),state={file,text,marks:[]};
  const editor={getValue:()=>state.text,getCursor:()=>cursor,posToOffset:position=>position,
   cm:{state:{doc:{toString:()=>state.text}},dispatch:({effects})=>{state.marks=effects;}}};
  const markdown=new obsidian.MarkdownView();
  Object.assign(markdown,{file,editor});
  leaves.push({view:markdown});
  return state;
 }
 async function request(index){
  for(let attempt=0;attempt<10&&!requests[index];attempt++)await Promise.resolve();
  assert.ok(requests[index],`Expected LanguageTool request ${index+1}`);
  return requests[index];
 }
 return {plugin,view,note,request,requests,events};
}

test('reviewing another note clears marks left in every editor of the previous note',()=>{
 const {plugin,note}=harness();
 const first=note('First.md','Teh first note.');
 const split=note('First.md',first.text);
 const second=note('Second.md','Teh second note.');

 plugin.reviewSource=first.text;
 plugin.showReviewMarks(first.file,[typo]);
 assert.equal(first.marks.length,1);
 assert.equal(split.marks.length,1);

 plugin.reviewSource=second.text;
 plugin.showReviewMarks(second.file,[typo]);
 assert.equal(first.marks.length,0);
 assert.equal(split.marks.length,0);
 assert.equal(second.marks.length,1);
});

test('a manual review of another note supersedes the in-flight request',async()=>{
 const {view,note,request}=harness();
 const first=note('First.md','Teh first note.');
 const second=note('Second.md','Teh second note.');
 const previous=view.reviewFile(first.file);
 const oldRequest=await request(0);
 const latest=view.reviewFile(second.file);
 const newRequest=await request(1);
 assert.equal(newRequest.text,second.text);

 oldRequest.respond([{...typo,message:'Stale first-note finding'}]);
 await previous;
 assert.equal(view.reviewBusy,true);
 assert.match(view.reviewStatus.textContent,/Second\.md/);
 assert.equal(first.marks.length,0);
 assert.doesNotMatch(view.reviewResults.textContent,/Stale first-note finding/);

 newRequest.respond([typo]);
 await latest;
 assert.equal(view.reviewBusy,false);
 assert.equal(second.marks.length,1);
 assert.match(view.reviewResults.textContent,/Check this word/);
});

test('a note changed during manual review shows how to retry with auto-check off',async()=>{
 const {view,note,request,requests}=harness();
 const draft=note('Draft.md','Teh first draft.');
 const pending=view.reviewFile(draft.file);
 const oldRequest=await request(0);
 draft.text='The edited draft.';
 oldRequest.respond([typo]);

 await pending;
 assert.equal(view.reviewBusy,false);
 assert.match(view.reviewStatus.textContent,/again|retry|rerun/i);
 assert.doesNotMatch(view.reviewStatus.textContent,/refreshing|analyzing/i);
 assert.doesNotMatch(view.reviewResults.textContent,/No issues found/);
 assert.equal(draft.marks.length,0);
 assert.equal(requests.length,1);
});

test('opening a different editor in manual mode leaves the chosen review in place',async()=>{
 const {view,note,request,events}=harness();
 const first=note('Chosen.md','Teh chosen note.');
 const second=note('Other.md','Teh other note.');
 const pending=view.reviewFile(first.file);
 const reviewing=await request(0);
 events['file-open'](second.file);
 reviewing.respond([typo]);await pending;
 assert.equal(view.reviewFilePath,first.file.path);
 assert.equal(first.marks.length,1);
 assert.equal(second.marks.length,0);
});

test('extra replacements expand directly in the suggestion and receive keyboard focus',async()=>{
 const {plugin,view,note,request}=harness();
 const draft=note('Draft.md','Teh first draft.');
 const pending=view.reviewFile(draft.file);
 (await request(0)).respond([{...typo,replacements:[{value:'The'},{value:'Then'},{value:'Them'}]}]);
 await pending;
 const expansion=view.reviewResults.find('More options (1)');
 assert.ok(expansion);
 assert.equal(view.reviewResults.find('Them'),undefined);
 expansion.events.click();
 const choice=view.reviewResults.find('Them');
 assert.equal(choice.focused,true);
 assert.equal(view.reviewResults.find('More options (1)'),undefined);
 plugin.applyGrammarReplacement=(file,source,match,replacement)=>{
  assert.equal(file,draft.file);assert.equal(source,draft.text);assert.equal(match.offset,typo.offset);
  assert.equal(replacement,'Them');
 };
 choice.events.click();
});

test('a note with only Markdown code or metadata skips the LanguageTool request',async()=>{
 const {view,note,requests}=harness();
 const draft=note('Code.md','---\ntitle: Hidden title\n---\n\n```js\nconst hiddenCode = true;\n```');
 const pending=view.reviewFile(draft.file);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,0);
 await pending;
 assert.match(view.reviewStatus.textContent,/no text to review/i);
 assert.equal(draft.marks.length,0);
});

test('a result from outside a checked window cannot become a mark in the note',async()=>{
 const {view,note,request}=harness();
 const text='Some prose. '.repeat(2000);
 const draft=note('Long draft.md',text,text.length-100);
 const pending=view.reviewFile(draft.file);
 const windowRequest=await request(0);
 assert.ok(windowRequest.text.length<draft.text.length);

 windowRequest.respond([{...typo,offset:-3},typo]);
 await pending;
 assert.equal(draft.marks.length,1);
 assert.equal(draft.marks[0].from,text.length-windowRequest.text.length);
});

test('a failed local recheck does not mark the edited source as checked or empty',async()=>{
 const {view,note,request}=harness();
 const before='Teh first paragraph.\n\nThe last paragraph.';
 const after='The first paragraph.\n\nThe last paragraph.';
 const draft=note('Draft.md',before);
 const initial=view.reviewFile(draft.file);
 const initialRequest=await request(0);
 initialRequest.respond([typo]);
 await initial;
 assert.equal(view.grammarCheckedSource,before);

 draft.text=after;
 const refresh=view.recheckGrammarCorrection(draft.file,before,after,0,3,3,[typo]);
 const localRequest=await request(1);
 assert.notEqual(view.grammarCheckedSource,after);
 assert.doesNotMatch(view.reviewResults.textContent,/No issues found/);

 localRequest.respond([],503);
 await refresh;
 assert.equal(view.reviewBusy,false);
 assert.notEqual(view.grammarCheckedSource,after);
 assert.match(view.reviewStatus.textContent,/could not recheck|failed/i);
 assert.doesNotMatch(view.reviewResults.textContent,/No issues found/);
});

test('adding a code fence discards cached findings in newly protected Markdown',async()=>{
 const {view,note,request,requests}=harness();
 const before='The first paragraph.\n\nTeh last paragraph.';
 const fence='```md\n';
 const after=fence+before;
 const match={...typo,offset:before.indexOf('Teh')};
 const draft=note('Draft.md',before);
 const initial=view.reviewFile(draft.file);
 const initialRequest=await request(0);
 initialRequest.respond([match]);
 await initial;
 assert.equal(draft.marks.length,1);

 draft.text=after;
 const refresh=view.recheckGrammarCorrection(draft.file,before,after,0,0,fence.length,[match]);
 assert.equal(draft.marks.length,0,'The cached finding is invalid even before the server responds');
 await new Promise(resolve=>setImmediate(resolve));
 requests[1]?.respond([]);
 await refresh;
 assert.equal(draft.marks.length,0);
 assert.doesNotMatch(view.reviewResults.textContent,/Teh/);
});
