'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('src/v4/auto-grammar.js','utf8');
const api=vm.runInNewContext(src+'\n({writerGrammarLocalWindow,writerGrammarLocalScopes,writerGrammarPreserveOutside})',{console});
const {writerGrammarLocalWindow,writerGrammarLocalScopes,writerGrammarPreserveOutside}=api;

test('accepted replacement only rechecks one sentence from a later paragraph',()=>{
 const before=[
  'Antes de tudo, eu escrevi errado. Outro problema inicial.',
  'Segundo parágrafo, com um erro antigo.',
  'Mais um trecho sem alterações.',
  'Primeira sentença deste parágrafo. A terceira dizia nao claramente. Última sentença continua com um problema.'
 ].join('\n\n');
 const start=before.indexOf('nao'),after=before.slice(0,start)+'não'+before.slice(start+3);
 const scope=writerGrammarLocalScopes(before,after,start,start+3,start+3);
 assert.equal(scope.old.kind,'sentence');
 assert.equal(scope.next.kind,'sentence');
 assert.ok(scope.next.text.includes('não'));
 assert.ok(!scope.next.text.includes('Primeira sentença'));
 assert.ok(!scope.next.text.includes('Última sentença'));
 assert.ok(scope.next.text.length<before.length/3);
});
test('other paragraphs and sentences preserve findings and shifted offsets after longer replacement',()=>{
 const before='Primeiro erro aqui. Outro erro ali.\n\nEle dizia nao ontem. A menina percebeu o problema.\n\nUltimo erro aqui.';
 const original=before.indexOf('nao'),word='não mesmo',after=before.slice(0,original)+word+before.slice(original+3);
 const delta=word.length-3,scope=writerGrammarLocalScopes(before,after,original,original+3,original+word.length);
 const positions=[before.indexOf('Primeiro'),before.indexOf('Outro'),original,before.indexOf('problema'),before.indexOf('Ultimo')];
 const originalMatches=positions.map(offset=>({offset,length:4,message:String(offset)}));
 const keep=writerGrammarPreserveOutside(originalMatches,scope.old,delta);
 assert.deepEqual([...keep.map(x=>x.message)],[
  String(positions[0]),String(positions[1]),String(positions[3]),String(positions[4])
 ]);
 assert.equal(keep[0].offset,positions[0]);
 assert.equal(keep[2].offset,positions[3]+delta);
 assert.equal(keep[3].offset,positions[4]+delta);
});
test('changing sentence punctuation widens the local request to paragraph',()=>{
 const before='Prior paragraph.\n\nUm erro acontece. O próximo tem problema.\n\nDepois.';
 const start=before.indexOf('. O próximo'),end=start+2;
 const after=before.slice(0,start)+', '+before.slice(end);
 const scopes=writerGrammarLocalScopes(before,after,start,end,start+2);
 assert.equal(scopes.old.kind,'paragraph');
 assert.equal(scopes.next.kind,'paragraph');
 assert.ok(scopes.next.text.includes('próximo'));
 assert.ok(!scopes.next.text.includes('Prior paragraph'));
 assert.ok(!scopes.next.text.includes('Depois'));
});
test('long manuscripts never send an entire document for a local correction',()=>{
 const source=('Parágrafo longo sem erros. Segunda frase normal.\n\n').repeat(1200);
 const start=source.lastIndexOf('frase normal');
 const scope=writerGrammarLocalWindow(source,start,start+5);
 assert.ok(scope.text.length<500,'Recheck should be one sentence or paragraph');
 assert.ok(scope.text.length<source.length/20);
});
test('one localized request is wired without clearing all cached marks',()=>{
 const main=fs.readFileSync('main.js','utf8');
 const apply=main.slice(main.indexOf('  async applyGrammarReplacement('),main.indexOf('  async createGrammarVariant('));
 const local=main.slice(main.indexOf(' async recheckGrammarCorrection('),main.indexOf(' renderGrammarSuggestion('));
 assert.match(local,/checkGrammar\(masked\.slice\(scopes\.next\.from,scopes\.next\.to\)\)/);
 assert.match(local,/writerGrammarPreserveOutside\(previousMatches,scopes\.old,after\.length-before\.length\)/);
 assert.match(apply,/view\.recheckGrammarCorrection\(/);
 assert.doesNotMatch(apply,/this\.clearReviewMarks\(\);/);
 assert.doesNotMatch(apply,/setTimeout\(\(\)=>view\.reviewFile/);
 assert.ok(src.includes('this.plugin.grammarCorrectionPaths?.has(file.path)'));
});
