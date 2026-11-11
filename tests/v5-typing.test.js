'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=['src/v5/easy-typing.js','src/v5/easy-advanced.js','src/v5/smart-typography.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const mock={writerUi:(pt)=>pt,writerModuleOn:()=>true,console,require:()=>({})};
const v=vm.runInNewContext(source+'\n({writerEasyMerge,writerEasyTypingAtInput,writerEasyExcluded,writerEasyPaste,writerEasyTabOut,writerEasyBackspacePrefix,writerEasyProseFormat,writerTypoMerge,writerTypoAtInput,writerTypoConvertProse,writerTypingUnsafeContext,WriterEasyTyping,WriterSmartTypography,writerTypingFilterTransaction,writerEasyRegexValid})',mock);
let count=0;
function test(title,run){run();count++;console.log('PASS',title);}
test('old data and module visibility preserved',()=>{
 const s={visibleModules:{keyshots:false},projectsData:{'Book.md':{wordGoal:1000}},smartTypography:{curlyQuotes:false},easyTyping:{tabOut:false}};
 v.writerEasyMerge(s);v.writerTypoMerge(s);
 assert.equal(s.visibleModules.keyshots,false);
 assert.equal(s.projectsData['Book.md'].wordGoal,1000);
 assert.equal(s.easyTyping.tabOut,false);
 assert.equal(s.smartTypography.curlyQuotes,false);
 assert.equal(s.smartTypography.enabled,true);
});
test('curly quotation marks and apostrophes',()=>{
 const c=v.writerTypoMerge({});
 assert.equal(v.writerTypoConvertProse('"" and \'\'.',c),'“” and ‘’.');
 assert.equal(v.writerTypoConvertProse('"Hello" -- ...',c),'“Hello” — …');
 assert.equal(v.writerTypoAtInput("don't".slice(0,-1)+"'", "'",c)?.text,'’');
});
test('smart dashes, ellipses, symbols and disabled options',()=>{
 const c=v.writerTypoMerge({});
 for(const [input,key,expect] of [['Text --','-','—'],['...','.','…'],['->','>','→'],['<-','-','←'],['>=','=','≥'],['<=','=','≤'],['/=','=','≠']])
  assert.equal(v.writerTypoAtInput(input,key,c)?.text,expect,input);
 assert.equal(v.writerTypoAtInput('1/2','2',c),null);
 assert.equal(v.writerTypoAtInput('1/2','2',{...c,fractions:true}).text,'½');
 assert.equal(v.writerTypoAtInput('<<','<',{...c,guillemets:true}).text,'«');
});
test('manual typography keeps URLs, inline/fenced code and Markdown links',()=>{
 const c=v.writerTypoMerge({});
 const input='Link: [x](https://site.test/a--b), \x60...--\x60, https://a.test/x--y, and ...\n\x60\x60\x60md\n--\n\x60\x60\x60';
 const actual=v.writerTypoConvertProse(input,c);
 assert.ok(actual.includes('https://site.test/a--b'));
 assert.ok(actual.includes('\x60...--\x60'));
 assert.ok(actual.includes('https://a.test/x--y'));
 assert.ok(actual.includes('and …'));
 assert.ok(actual.includes('\n\x60\x60\x60md\n--\n\x60\x60\x60'));
});
test('tab out works for Markdown and punctuation pairs without swallowing normal tab',()=>{
 assert.equal(v.writerEasyTabOut('hello',2),0);
 assert.equal(v.writerEasyTabOut('(x)',2),1);
 assert.equal(v.writerEasyTabOut('**bold**',6),2);
 assert.equal(v.writerEasyTabOut('[[Page]]',6),2);
 assert.equal(v.writerEasyTabOut('“Olá”',4),1);
 assert.equal(v.writerEasyTabOut('"x"',2),1);
 assert.equal(v.writerEasyTabOut("'x'",2),1);
});
test('list paste adds markdown marker only on subsequent unmarked lines',()=>{
 const s=v.writerEasyMerge({});
 assert.equal(v.writerEasyPaste('alpha\nbeta\n\n- existing','- ',s),'alpha\n- beta\n\n- existing');
 assert.equal(v.writerEasyPaste('alpha\nbeta','> ',s),'alpha\n> beta');
 assert.equal(v.writerEasyPaste('alpha\nbeta','plain',s),'alpha\nbeta');
});
test('smart backspace only clears an empty list or quote marker',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(v.writerEasyBackspacePrefix('- ',2))),{from:0,to:2,insert:''});
 assert.equal(v.writerEasyBackspacePrefix('- item',6),null);
 assert.equal(v.writerEasyBackspacePrefix('paragraph',9),null);
});
test('CJK spacing, capitalization, literal rules and folder exclusions',()=>{
 const s=v.writerEasyMerge({easyTyping:{autoCapitalize:true,cjkSpacing:true,excludedPaths:'Private\nDrafts',customReplacements:[{from:'btw',to:'by the way'}]}});
 assert.equal(v.writerEasyTypingAtInput('hello. a','a',s).text,'A');
 assert.equal(v.writerEasyTypingAtInput('中文a','a',s).text,' a');
 assert.equal(v.writerEasyTypingAtInput('btw','w',s).text,'by the way');
 assert.equal(v.writerEasyExcluded('Drafts/story.md',s),true);
 assert.equal(v.writerEasyExcluded('Other/story.md',s),false);
});
test('Markdown frontmatter and separators are preserved',()=>{
 const cfg=v.writerTypoMerge({});
 assert.equal(v.writerTypoAtInput('--','-',cfg),null);
 assert.equal(v.writerTypoAtInput('-- ',' ',cfg)?.text,'— ');
 assert.equal(v.writerTypoConvertProse('---\ntitle: "Hello"\n---\nHello ...',cfg),'---\ntitle: "Hello"\n---\nHello …');
 assert.equal(v.writerTypoConvertProse('A line\n---\nAnother line ...',cfg),'A line\n---\nAnother line …');
});
test('formatter leaves blank lines inside code fences intact',()=>{
 const cfg=v.writerEasyMerge({easyTyping:{inlineSpacing:true}});
 const input='\x60\x60\x60js\nconst x=1;\n\n\n\nstill code\n\x60\x60\x60\n\n\n\nOutside';
 const output=v.writerEasyProseFormat(input,cfg);
 assert.ok(output.includes('const x=1;\n\n\n\nstill code'));
 assert.ok(output.includes('\x60\x60\x60\n\n\nOutside'));
});
function typingTr(old,at,inserted,event='input.type',cursor=inserted.length){
 const next=old.slice(0,at)+inserted+old.slice(at);
 const makeDoc=text=>({
  length:text.length,sliceString:(a,b)=>text.slice(a,b),
  line(number){const lines=text.split('\n');const from=lines.slice(0,number-1).reduce((n,line)=>n+line.length+1,0);return {from,text:lines[number-1],number};},
  lineAt(pos){const number=text.slice(0,pos).split('\n').length;return this.line(number);}
 });
 const doc=makeDoc(next);
 return {docChanged:true,startState:{doc:makeDoc(old),selection:{ranges:[{}],main:{empty:true}}},
  newDoc:doc,newSelection:{ranges:[{}],main:{empty:true,head:at+cursor}},
  isUserEvent:requested=>event===requested||event.startsWith(requested+'.'),
  changes:{iterChanges:fn=>fn(at,at,at,at+inserted.length,{toString:()=>inserted})}};
}
test('desktop quote auto-pairs are converted without moving caret out of the pair',()=>{
 const cfg=v.writerTypoMerge({});
 const plugin={writerSmartTypography:{active:()=>true,cfg},writerEasyTyping:{active:()=>false}};
 for(const [original,expected] of [['""','“”'],["''",'‘’']]){
  const result=v.writerTypingFilterTransaction(typingTr('',0,original,'input.type',1),plugin);
  assert.ok(Array.isArray(result));
  assert.deepEqual(JSON.parse(JSON.stringify(result[1].changes)),[{from:0,to:2,insert:expected}]);
  assert.equal(result[1].selection.anchor,1);
 }
 const result=v.writerTypingFilterTransaction(typingTr('Ele disse: ',11,'"'),plugin);
 assert.equal(result[1].changes[0].insert,'“');
});
test('desktop input supports prose dashes and skips composition, paste and code',()=>{
 const cfg=v.writerTypoMerge({});
 const plugin={writerSmartTypography:{active:()=>true,cfg},writerEasyTyping:{active:()=>false}};
 assert.equal(v.writerTypoAtInput('--O','O',cfg).text,'—O');
 assert.equal(v.writerTypoAtInput('---','-',cfg),null);
 assert.equal(v.writerTypoAtInput('--O','O',{...cfg,dialogueDashes:false}),null);
 const typed=v.writerTypingFilterTransaction(typingTr('--',2,'O'),plugin);
 assert.equal(typed[1].changes[0].insert,'—O');
 for(const event of ['input.paste','input.drop','input.complete','input.type.compose']){
  const tx=typingTr('',0,'""',event,1);
  assert.equal(v.writerTypingFilterTransaction(tx,plugin),tx,event);
 }
 const inCode=typingTr(String.fromCharCode(96)+'code ',6,'"');
 assert.equal(v.writerTypingFilterTransaction(inCode,plugin),inCode);
});
test('typing a matching closing quote steps over the existing typographic pair',()=>{
 const cfg=v.writerTypoMerge({});
 const plugin={writerSmartTypography:{active:()=>true,cfg},writerEasyTyping:{active:()=>false}};
 for(const [before,insertion] of [['“Olá”','"'],['‘Olá’',"'"],['“Olá”','""']]){
  const tx=typingTr(before,4,insertion,'input.type',1);
  const result=v.writerTypingFilterTransaction(tx,plugin);
  assert.equal(result[1].changes[0].from,4);
  assert.equal(result[1].changes[0].to,4+insertion.length);
  assert.equal(result[1].changes[0].insert,'');
  assert.equal(result[1].selection.anchor,5);
 }
});
test('literal replacements preserve pipes, disabled rules and independent editor controls',()=>{
 const easy=v.writerEasyMerge({easyTyping:{customReplacements:[
  {from:'a|b',to:'with|pipe',enabled:true},
  {from:'off',to:'never',enabled:false}
 ]}});
 assert.equal(v.writerEasyTypingAtInput('a|b','b',easy).text,'with|pipe');
 assert.equal(v.writerEasyTypingAtInput('off','f',easy),null);
 const text=fs.readFileSync('src/v5/easy-typing.js','utf8');
 const advanced=fs.readFileSync('src/v5/easy-advanced.js','utf8');
 assert.ok(text.includes("createEl('details'"),'Literal rules need individual collapsible editors');
 assert.ok(!text.includes("origem|destino"),'Legacy pipe syntax must not be the editor');
 assert.ok(advanced.includes("writer-typing-regex-rule"));
 assert.ok(advanced.includes("setValue(rule.enabled!==false)"));
});
test('regex editing validates syntax and Unicode flags before replacing a saved pattern',()=>{
 assert.equal(v.writerEasyRegexValid('a|b','ui'),true);
 assert.equal(v.writerEasyRegexValid('(','i'),false);
 assert.equal(v.writerEasyRegexValid('a','ii'),false);
 assert.equal(v.writerEasyRegexValid('a','g'),false);
 assert.equal(v.writerEasyRegexValid('(a+)+',''),false);
 assert.equal(v.writerEasyRegexValid('\\x','u'),false);
});
test('desktop dialogue conversion uses the current line after real newlines',()=>{
 const cfg=v.writerTypoMerge({});
 const plugin={writerSmartTypography:{active:()=>true,cfg},writerEasyTyping:{active:()=>false}};
 const old='First paragraph\n\n--';
 const result=v.writerTypingFilterTransaction(typingTr(old,old.length,'O','input'),plugin);
 assert.equal(result[1].changes[0].insert,'—O');
 assert.equal(result[1].changes[0].from,old.length-2);
});
test('blank fenced-code lines remain literal even before syntax nodes are available',()=>{
 const cfg=v.writerTypoMerge({});
 const plugin={writerSmartTypography:{active:()=>true,cfg},writerEasyTyping:{active:()=>false}};
 const ticks=String.fromCharCode(96);
 for(const old of [ticks.repeat(3)+'js\n',ticks.repeat(4)+'md\n'+ticks.repeat(3)+'\n\n','~~~js\n\n','> '+ticks.repeat(3)+'js\n> ']){
  const tx=typingTr(old,old.length,'""','input.type',1);
  assert.equal(v.writerTypingFilterTransaction(tx,plugin),tx);
 }
 const prose=ticks.repeat(3)+'js\ncode\n'+ticks.repeat(3)+'\n';
 const result=v.writerTypingFilterTransaction(typingTr(prose,prose.length,'""','input.type',1),plugin);
 assert.equal(result[1].changes[0].insert,'“”');
});
test('typing settings are independent of Keyshots bindings',()=>{
 const basic=fs.readFileSync('main.js','utf8');
 const build=fs.readFileSync('scripts/build-v3.js','utf8');
 for(const name of ['easy-typing','smart-typography']){
  assert.ok(basic.includes('// v3 module: src/v5/'+name+'.js'));
  assert.ok(build.includes('v5/'+name));
 }
 for(const sym of ['writerEasyMerge(this.settings)','writerTypoMerge(this.settings)','this.writerEasyTyping.register()','this.writerSmartTypography.register()'])
  assert.ok(basic.includes(sym),sym);
 assert.ok(!source.includes('eval('));
});
console.log(count+' v5 Easy Typing & Smart Typography tests passed');
