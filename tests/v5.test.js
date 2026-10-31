'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const files=['src/v5/keyshots.js','src/v5/extended-syntax.js','src/v5/pandoc-syntax.js'];
const source=files.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const mock={writerUi:pt=>pt,writerModuleOn:()=>true,console,require:()=>({})};
const v5=vm.runInNewContext(source+'\n({writerKeyshotsMerge,writerKeyshotsLineAction,writerKeyshotsBindings,writerExtendedMerge,writerExtendedTokens,writerPandocMerge,writerPandocNumber,writerPandocListItem,writerPandocOutline})',
 mock);
let total=0;
function test(name,callback){callback();total++;console.log('PASS '+name);}
test('settings merge preserves unrelated settings and module isolation',()=>{
 const settings={writerV4:{profiles:[{name:'Draft'}]},visibleModules:{translation:false},keyshots:{preset:'invalid',enabled:false},extendedSyntax:{spoiler:false}};
 v5.writerKeyshotsMerge(settings);v5.writerExtendedMerge(settings);v5.writerPandocMerge(settings);
 assert.equal(settings.keyshots.enabled,false);
 assert.equal(settings.keyshots.preset,'vscode');
 assert.equal(settings.extendedSyntax.spoiler,false);
 assert.equal(settings.pandocSyntax.enabled,true);
 assert.equal(settings.visibleModules.translation,false);
 assert.equal(settings.writerV4.profiles.length,1);
});
test('extended Markdown tokens are bounded, categorized and escape-aware',()=>{
 const tokens=v5.writerExtendedTokens('++under++ ||hide|| ^2^ ~3~ =={red}warm== !!{note}callout!!');
 assert.equal(tokens.length,6);
 assert.equal(tokens.map(t=>t.kind).join(','),'underline,spoiler,superscript,subscript,highlight,span');
 assert.equal(v5.writerExtendedTokens('\\++literal++').length,0);
 assert.equal(v5.writerExtendedTokens(String.fromCharCode(96)+'++code++'+String.fromCharCode(96)).length,0);
 assert.equal(v5.writerExtendedTokens('^^invalid^^').length,0);
 assert.equal(v5.writerExtendedTokens('++ spaced ++').length,0);
});
test('Pandoc markers parse alphabetical, Roman and auto-numbered lists',()=>{
 assert.equal(v5.writerPandocListItem('A) First').type,'A');
 assert.equal(v5.writerPandocListItem('iv. Fourth').type,'i');
 assert.equal(v5.writerPandocListItem('#. Automatic').type,'1');
 assert.equal(v5.writerPandocNumber('IV'),4);
 assert.equal(v5.writerPandocListItem('Regular prose'),null);
});
test('Pandoc outline excludes fenced source code',()=>{
 const outline=v5.writerPandocOutline('A. First\nTerm\n: meaning\n(@ex) Example\n{::P} Premise\n::: {.theorem}\n'+String.fromCharCode(96).repeat(3)+'\nB. ignored\n'+String.fromCharCode(96).repeat(3));
 assert.equal(outline.length,5);
 assert.equal(outline[0].line,0);
 assert.equal(outline[1].kind,'definition');
 assert.equal(outline[2].kind,'example');
});
test('keymap presets expose predictable shortcuts and allow none',()=>{
 assert.equal(v5.writerKeyshotsBindings('none').length,0);
 assert.ok(v5.writerKeyshotsBindings('vscode').some(([k,a])=>k==='Alt-ArrowDown'&&a==='move-down'));
 assert.ok(v5.writerKeyshotsBindings('jetbrains').some(([k,a])=>a==='move-up'));
});
function fakeEditor(initial,line=1){
 return {
  text:initial,cursor:{line,ch:0},getLine(n){return this.text.split('\n')[n]??'';},
  lineCount(){return this.text.split('\n').length;},
  getCursor(){return this.cursor;},setCursor(p){this.cursor=p;},
  setSelection(from,to){this.cursor=to;},
  replaceRange(value,from,to=from){
   const offset=p=>this.text.split('\n').slice(0,p.line).reduce((n,s)=>n+s.length+1,0)+p.ch;
   this.text=this.text.slice(0,offset(from))+value+this.text.slice(offset(to));
  },
  getSelection(){return '';}
 };
}
test('move/duplicate/insert/delete lines edit correct ranges',()=>{
 const move=fakeEditor('a\nb\nc');assert.ok(v5.writerKeyshotsLineAction(move,'move-up'));assert.equal(move.text,'b\na\nc');
 const dup=fakeEditor('a\nb\nc');assert.ok(v5.writerKeyshotsLineAction(dup,'duplicate-down'));assert.equal(dup.text,'a\nb\nb\nc');
 const insert=fakeEditor('a\nb');assert.ok(v5.writerKeyshotsLineAction(insert,'insert-below'));assert.equal(insert.text,'a\nb\n');
 const remove=fakeEditor('a\nb\nc');assert.ok(v5.writerKeyshotsLineAction(remove,'delete-line'));assert.equal(remove.text,'a\nc');
});
test('standalone bundle and settings include all v5 modules',()=>{
 const main=fs.readFileSync('main.js','utf8'),build=fs.readFileSync('scripts/build-v3.js','utf8');
 for(const name of ['keyshots','extended-syntax','pandoc-syntax']){
  assert.ok(main.includes('src/v5/'+name+'.js'));
  assert.ok(build.includes('v5/'+name));
 }
 for(const name of ['writerKeyshotsMerge(this.settings)','writerExtendedMerge(this.settings)','writerPandocMerge(this.settings)','this.writerPandocSyntax.register()'])
  assert.ok(main.includes(name),name);
 assert.ok(main.includes("['pandocSyntax',msg('Pandoc Syntax'"));
 assert.ok(!source.includes('eval('));
});
console.log(total+' Basic AI v5 tests passed.');
