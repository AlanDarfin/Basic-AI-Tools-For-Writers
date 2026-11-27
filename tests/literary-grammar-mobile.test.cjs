'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('src/writing/auto-grammar.js','utf8');
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

test('English interjections and common foreign expressions do not become Portuguese spelling errors',()=>{
 const text='— _Damn!_ — exclamou ela. Hey, Gotcha! Bonjour, gracias.';
 const values=['Damn','Hey','Gotcha','Bonjour','gracias'];
 const remote=values.map(word=>({offset:text.indexOf(word),length:word.length,
  message:'Possível erro ortográfico',rule:{id:'MORFOLOGIK_RULE_PT_BR',category:{id:'TYPOS'}},
  replacements:[{value:'correção'}]}));
 assert.deepEqual(review(text,remote,pt),[],'spelling false positives are suppressed');
 assert.equal(review(text,remote,{...pt,reviewMixedLanguageMode:false}).length,5);
});
test('Portuguese agreement is preserved while nearby foreign words are protected',()=>{
 const text='Os cara gritaram Damn!';
 const remote=[
  {offset:0,length:7,rule:{id:'GENERAL_AGREEMENT',category:{id:'GRAMMAR'}},message:'Concordância de número',replacements:[{value:'Os caras'}]},
  {offset:text.indexOf('Damn'),length:4,rule:{id:'MORFOLOGIK_RULE_PT_BR'},message:'Possible spelling mistake',replacements:[{value:'Dão'}]}
 ];
 const actual=review(text,remote,pt);
 assert.equal(actual.length,1);assert.equal(actual[0].rule.id,'GENERAL_AGREEMENT');
});
test('dialogue em dash after italic English exclamation retains lowercase dicendi',()=>{
 const text='— _Damn!_ — exclamou mais uma vez.';
 const offset=text.indexOf('exclamou');
 const remote=[cap(offset,'exclamou')];
 assert.equal(review(text,remote,pt).length,0);
 const upper='— _Damn!_ — Exclamou mais uma vez.';
 const findings=review(upper,[],pt);
 assert.equal(findings.length,1);
 assert.equal(findings[0].offset,upper.indexOf('Exclamou'));
 assert.equal(findings[0].replacements[0].value,'exclamou');
});
test('mixed-language clause detection is conservative and ignores only spelling reports',()=>{
 const english='She was really thinking about the story.';
 const errors=[{offset:english.indexOf('thinking'),length:8,rule:{id:'MORFOLOGIK_RULE_PT_BR'},replacements:[]}];
 assert.equal(review(english,errors,pt).length,0);
 const portuguese='A história foi bem contada e não tem erro.';
 const finding={offset:portuguese.indexOf('história'),length:8,rule:{id:'MORFOLOGIK_RULE_PT_BR'},replacements:[]};
 assert.equal(review(portuguese,[finding],pt).length,1);
});
test('small-screen menu CSS wraps the full navigation instead of clipping tabs',()=>{
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/@container writer-sidebar \(max-width:440px\)/);
 assert.match(css,/writer-tool-tabs\.writer-sidebar-tabs\{\s*flex-wrap:wrap;overflow-x:visible/);
 assert.match(css,/writer-lt-mobile-modal \.modal-content\{\s*box-sizing:border-box;min-width:0;width:100%/);
});

