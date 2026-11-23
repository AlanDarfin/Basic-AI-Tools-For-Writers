'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('src/v4/auto-grammar.js','utf8');
const start=source.indexOf('const WRITER_LITERARY_DICENDI=');
const end=source.indexOf('async function writerGrammarRequest(',start);
assert.ok(start>=0&&end>start,'Literary helper must remain in the grammar source');
const review=new Function(source.slice(start,end)+'\nreturn writerLiteraryReviewMatches;')();
const pt={reviewLanguage:'pt-BR'};
const cap=(offset,word)=>({
 offset,length:word.length,
 message:'Verifica que a frase inicia com uma letra em maiúsculo',
 rule:{id:'UPPERCASE_SENTENCE_START',description:'Uppercase'},
 replacements:[{value:word[0].toUpperCase()+word.slice(1)}]
});
test('keeps lowercase speech tags after ? and !, ignoring misplaced capitalization warnings',()=>{
 const text='— O quê?! — respondeu ela.';
 const result=review(text,[cap(text.indexOf('respondeu'),'respondeu')],pt);
 assert.equal(result.length,0,'speech tag is already correct');
});
test('offers lowercase after a closing dialogue dash, preserving offsets',()=>{
 const text='— Você vai? — Respondeu Ana.';
 const result=review(text,[],pt);
 assert.equal(result.length,1);
 assert.equal(result[0].rule.id,'BASIC_LITERARY_DICENDI');
 assert.equal(result[0].offset,text.indexOf('Respondeu'));
 assert.equal(result[0].replacements[0].value,'respondeu');
 assert.equal(text.slice(result[0].offset,result[0].offset+result[0].length),'Respondeu');
});
test('does not alter uppercase dialogue or ordinary narrative sentences',()=>{
 assert.equal(review('— NÃO! — DISSE ELE.',[],pt).length,0);
 assert.equal(review('Respondeu ela à pergunta.',[],pt).length,0);
 assert.equal(review('— Respondeu ela rapidamente.',[],pt).length,0);
});
test('apostrophe shorthand is advisory and allows contextual alternatives',()=>{
 const text="Ma' você falou, ma’ eu não entendi.";
 const result=review(text,[],pt);
 assert.equal(result.length,2);
 assert.deepEqual(result[0].replacements.map(r=>r.value),['Mais','Mas']);
 assert.deepEqual(result[1].replacements.map(r=>r.value),['mais','mas']);
 assert.equal(result[0].offset,0);
 assert.equal(result[1].offset,text.indexOf('ma’'));
 assert.ok(text.startsWith("Ma'"),'original text is unchanged');
});
test('server matches are retained unless overlapped by the same literary finding',()=>{
 const text="Ma' você disse algo.";
 const remote=[
  {offset:0,length:3,rule:{id:'SPELLING'},replacements:[{value:'Mais'}]},
  {offset:text.indexOf('disse'),length:5,rule:{id:'OTHER'},replacements:[]}
 ];
 const result=review(text,remote,pt);
 assert.equal(result.filter(m=>m.offset===0).length,1);
 assert.equal(result.find(m=>m.offset===0).rule.id,'BASIC_LITERARY_APOSTROPHE');
 assert.ok(result.some(m=>m.rule.id==='OTHER'));
});
test('literary mode can be disabled and respects non-Portuguese locales',()=>{
 const text='— O quê?! — respondeu ela.';
 const remote=[cap(text.indexOf('respondeu'),'respondeu')];
 assert.equal(review(text,remote,{...pt,reviewLiteraryMode:false})[0],remote[0]);
 assert.equal(review(text,remote,{reviewLanguage:'en-US'})[0],remote[0]);
 assert.equal(review("Ma'",[],{...pt,reviewLiteraryMode:false}).length,0);
});
test('bundled code and mobile layout include compact progressive disclosure',()=>{
 const bundle=fs.readFileSync('main.js','utf8');
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(bundle,/function writerLiteraryReviewMatches\(/);
 assert.match(bundle,/writer-lt-mobile-extra-details/);
 assert.match(bundle,/writer-lt-mobile-alternatives/);
 assert.match(bundle,/Por que esta sugestão\?/);
 assert.match(bundle,/Dicionários, IA e outras ações/);
 assert.match(css,/body\.is-mobile \.writer-lt-mobile-modal \.modal-content/);
 assert.match(css,/writer-lt-mobile-footer/);
 assert.match(css,/writer-lt-details\[open\]/);
});
