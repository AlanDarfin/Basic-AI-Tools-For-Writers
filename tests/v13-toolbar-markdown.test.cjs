'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const notices=[];
const document={
 createElement:()=>element(),
 createTreeWalker:()=>({nextNode:()=>false})
};
function element(firstChild=null){
 const styles={},classes=new Set();
 return {styles,classes,firstChild,closest:selector=>selector.includes('.writer-v5-ext')&&classes.has('writer-v5-ext'),
  get textContent(){return firstChild?.nodeValue||'';},
  set textContent(value){firstChild={nodeType:3,nodeValue:value};},
  classList:{add:(...names)=>names.forEach(name=>classes.add(name))},
  style:{setProperty:(key,value)=>{styles[key]=value;}}};
}
const api=vm.runInNewContext([
 read('src/v5/extended-syntax.js'),read('src/v10/inline-alignment.js'),read('src/v9/context-toolbar.js'),
 '({writerV9Format,writerV9ToolbarMerge,writerV1048ToolbarRun,writerExtendedTokens,writerExtendedElement,writerExtendedReading,writerExtendedLiveDecorations,WRITER_EXTENDED_DEFAULTS})'
].join('\n'),{
 document,NodeFilter:{SHOW_TEXT:4},writerUi:(pt,en)=>en,
 writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
 writerV8HomeIsMobile:plugin=>plugin.app.isMobile,
 Notice:class{constructor(message){notices.push(message);}},
 Decoration:{mark:options=>({range:(from,to)=>({from,to,...options})}),
  replace:()=>({range:(from,to)=>({from,to})}),set:ranges=>ranges,none:[]}
});
function editor(selection){
 const e={value:selection,selected:null,focused:false};
 return Object.assign(e,{
  getSelection:()=>selection,getLine:()=>e.value,
  getCursor:()=>({line:0,ch:e.value.length}),
  replaceSelection:value=>{e.value=value;},replaceRange:value=>{e.value=value;},
  setSelection:(from,to)=>{e.selected=[from.ch,to.ch];},focus:()=>{e.focused=true;}
 });
}
test('all former HTML actions write parseable Basic syntax, and common Markdown stays unchanged',()=>{
 for(const [id,source,kind,htmlColor] of [
  ['underline','++word++','underline'],['superscript','^word^','superscript'],
  ['subscript','~word~','subscript'],['spoiler','||word||','spoiler'],
  ['text-color','!!{color-012abc}word!!','span',['color','#012abc']],
  ['background-color','=={hex-4d7e9f}word==','highlight',['--writer-v5-highlight-color','#4d7e9f']]
 ]){
  const e=editor('word');
  assert.equal(api.writerV9Format(e,id,{textColor:'#012abc',backgroundColor:'#4d7e9f'}),true,id);
  assert.equal(e.value,source);
  assert.equal(e.focused,true);
  const [token]=api.writerExtendedTokens(e.value);
  assert.equal(token.kind,kind);
  assert.equal(token.value,'word');
  if(htmlColor)assert.equal(api.writerExtendedElement(token).styles[htmlColor[0]],htmlColor[1]);
 }
 for(const [id,source] of [['bold','**word**'],['strike','~~word~~'],['highlight','==word=='],['align-center','word {c}']]){
  const e=editor('word');
  assert.equal(api.writerV9Format(e,id),true);
  assert.equal(e.value,source);
 }
});
test('inline formats preserve blank lines, surrounding whitespace, and selected placeholders',()=>{
 const e=editor('  first word \n\n second line\t');
 api.writerV9Format(e,'underline');
 assert.equal(e.value,'  ++first word++ \n\n ++second line++\t');
 const sub=editor('one two\nthree');
 api.writerV9Format(sub,'subscript');
 assert.equal(sub.value,'~one~ ~two~\n~three~');
 assert.equal(api.writerExtendedTokens(sub.value).length,3);
 const empty=editor('');
 api.writerV9Format(empty,'text-color');
 assert.equal(empty.value,'!!{color-cf517f}text!!');
 assert.equal(empty.value.slice(...empty.selected),'text');
 const whitespace=editor(' \n\t');
 assert.equal(api.writerV9Format(whitespace,'underline'),false);
 assert.equal(whitespace.value,' \n\t');
});
test('device profiles preserve their hex colors and disabled syntax never inserts an HTML fallback',()=>{
 const settings={extendedSyntax:{},v9Toolbar:{profiles:{
  desktop:{textColor:'#aabbcc'},mobile:{textColor:'#112233'}
 }}};
 api.writerV9ToolbarMerge(settings);
 const plugin={settings,app:{isMobile:false}};
 const desktop=editor('word'),mobile=editor('word');
 assert.equal(api.writerV1048ToolbarRun(plugin,desktop,'text-color'),true);
 plugin.app.isMobile=true;
 assert.equal(api.writerV1048ToolbarRun(plugin,mobile,'text-color'),true);
 assert.equal(desktop.value,'!!{color-aabbcc}word!!');
 assert.equal(mobile.value,'!!{color-112233}word!!');
 settings.extendedSyntax.customSpan=false;
 const disabled=editor('word');
 assert.equal(api.writerV1048ToolbarRun(plugin,disabled,'text-color'),false);
 assert.equal(disabled.value,'word');
 assert.match(notices.at(-1),/Text formatting/);
});
test('Reading view styles native marks in place and leaves plain highlights and unknown colors alone',()=>{
 const mark=text=>element({nodeType:3,nodeValue:text});
 const hex=mark('{hex-012AbC}colored text'),named=mark('{red}a named color');
 const plain=mark('plain highlight'),unknown=mark('{hex-xyz123}unknown');
 const root={querySelectorAll:()=>[hex,plain,named,unknown]};
 api.writerExtendedReading(root,{coloredHighlight:false});
 assert.equal(hex.textContent,'{hex-012AbC}colored text');
 api.writerExtendedReading(root,api.WRITER_EXTENDED_DEFAULTS);
 assert.equal(hex.textContent,'colored text');
 assert.equal(hex.styles['--writer-v5-highlight-color'],'#012abc');
 assert.equal(named.styles['--writer-v5-highlight-color'],'var(--color-red)');
 assert.equal(plain.textContent,'plain highlight');
 assert.equal(unknown.textContent,'{hex-xyz123}unknown');
 assert.equal(plain.classes.size,0);
 api.writerExtendedReading(root,api.WRITER_EXTENDED_DEFAULTS);
 assert.equal(hex.textContent,'colored text');
});
test('Live Preview resolves the same colors without accepting arbitrary CSS',()=>{
 const text='!!{color-abcdef}text!! =={hex-123456}mark== !!{color-invalid}plain!!';
 const view={state:{doc:{lines:1,line:()=>({text,from:0,to:text.length})},selection:{main:{from:-1,to:-1}}}};
 const decorations=api.writerExtendedLiveDecorations(view,api.WRITER_EXTENDED_DEFAULTS).filter(r=>r.attributes);
 assert.deepEqual(Array.from(decorations,r=>r.attributes.style),
  ['color:#abcdef','--writer-v5-highlight-color:#123456',undefined]);
});
