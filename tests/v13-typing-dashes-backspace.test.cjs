'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/v5/easy-typing.js','src/v5/easy-advanced.js','src/v5/smart-typography.js']
 .map(path=>fs.readFileSync(path,'utf8')).join('\n');
const api=vm.runInNewContext(source+
 '\n({writerEasyMerge,writerEasyAdvancedMerge,writerEasyTypingAtInput,writerTypoMerge,writerTypoAtInput,writerTypingFilterTransaction,writerTypingRestoreBackspace})',
 {writerUi:(pt)=>pt,writerModuleOn:()=>true,console,require:()=>({})});
const plain=v=>JSON.parse(JSON.stringify(v));
const mockDoc=text=>({
 length:text.length,
 sliceString:(from,to)=>text.slice(from,to),
 lineAt(pos){const before=text.slice(0,pos),number=before.split('\n').length;
  const from=text.lastIndexOf('\n',Math.max(0,pos-1))+1;
  const end=text.indexOf('\n',pos);
  return {from,number,text:text.slice(from,end<0?text.length:end)};},
 line(number){const lines=text.split('\n');let from=0;for(let i=1;i<number;i++)from+=lines[i-1].length+1;
  return {from,number,text:lines[number-1]||''};}
});
const plugin=(typoCfg=api.writerTypoMerge({}),easyCfg=api.writerEasyMerge({}))=>({
 writerSmartTypography:{cfg:typoCfg,active:()=>true},
 writerEasyTyping:{cfg:easyCfg,active:()=>true},
 _writerTypingRestoreField:Symbol('field'),
 _writerTypingRestoreAnnotation:{of:payload=>({payload})}
});
const trans=(before,insert,event,at=before.length,previous)=>{
 const next=before.slice(0,at)+insert+before.slice(at);
 const isUserEvent=pattern=>event===pattern||event.startsWith(pattern+'.');
 return {docChanged:true,newDoc:mockDoc(next),startState:{
  doc:mockDoc(before),field:()=>previous,
  selection:{main:{head:at,empty:true},ranges:[{}]}},
  newSelection:{main:{head:at+insert.length,empty:true},ranges:[{}]},
  isUserEvent,changes:{iterChanges:fn=>fn(at,at,at,at+insert.length,{toString:()=>insert})}};
};
test('double and triple hyphen conversions are stable and preserve original keystrokes',()=>{
 const p=plugin();
 const first=api.writerTypingFilterTransaction(trans('A -','-','input.type'),p);
 assert.equal(first[1].changes[0].insert,'–');
 const state1=first[1].annotations.payload;
 assert.deepEqual(plain(state1),{from:2,to:3,text:'–',original:'--',source:'typography'});
 const second=api.writerTypingFilterTransaction(trans('A –','-','input.type',3,state1),p);
 assert.equal(second[1].changes[0].insert,'—');
 const state2=second[1].annotations.payload;
 assert.deepEqual(plain(state2),{from:2,to:3,text:'—',original:'---',source:'typography'});
 const submitted=[];
 const view={state:{doc:mockDoc('A —'),field:()=>state2,
  selection:{ranges:[{}],main:{head:3,empty:true}}},dispatch:spec=>submitted.push(spec)};
 assert.equal(api.writerTypingRestoreBackspace(view,p),true);
 assert.deepEqual(plain(submitted[0].changes),{from:2,to:3,insert:'---'});
 assert.equal(submitted[0].selection.anchor,5);
});
test('opt-in direct em dash does not revert itself when a third hyphen is typed',()=>{
 const cfg=api.writerTypoMerge({smartTypography:{skipEnDash:true}}),p=plugin(cfg);
 const first=api.writerTypingFilterTransaction(trans('A -','-','input.type'),p);
 assert.equal(first[1].changes[0].insert,'—');
 const state=first[1].annotations.payload;
 const second=api.writerTypingFilterTransaction(trans('A —','-','input.type',3,state),p);
 assert.equal(second[1].changes[0].insert,'—');
 assert.equal(second[1].annotations.payload.original,'---');
});
test('Android input.delete backspace restores --- without creating a Markdown note',()=>{
 const p=plugin(),before='A —';
 const state={from:2,to:3,text:'—',original:'---',source:'typography'};
 const t={docChanged:true,newDoc:mockDoc('A '),
  startState:{doc:mockDoc(before),field:()=>state,
   selection:{main:{head:3,empty:true},ranges:[{}]}},
  isUserEvent:e=>e==='delete.backward',
  changes:{iterChanges:fn=>fn(2,3,2,2,{toString:()=>''})}};
 const result=api.writerTypingFilterTransaction(t,p);
 assert.ok(Array.isArray(result));
 assert.deepEqual(plain(result[1].changes),{from:2,to:2,insert:'---'});
 assert.equal(result[1].selection.anchor,5);
});
test('stale conversions do not hijack Backspace or unrelated deletion',()=>{
 const p=plugin(),state={from:2,to:3,text:'—',original:'---',source:'typography'};
 const calls=[],view={state:{doc:mockDoc('A —'),field:()=>state,
  selection:{ranges:[{}],main:{head:2,empty:true}}},dispatch:c=>calls.push(c)};
 assert.equal(api.writerTypingRestoreBackspace(view,p),false);
 view.state.selection.main.head=3;
 view.state.doc=mockDoc('A x');
 assert.equal(api.writerTypingRestoreBackspace(view,p),false);
 assert.equal(calls.length,0);
});
test('literal and regex substitutions respect the immediate/Space toggle',()=>{
 const settings={easyTyping:{customReplacements:[{from:'vc',to:'você',enabled:true}],
  regexEnabled:true,regexRules:[{pattern:'teh',replace:'the',flags:'',enabled:true}]}};
 api.writerEasyMerge(settings);api.writerEasyAdvancedMerge(settings);
 const cfg=settings.easyTyping;
 assert.equal(api.writerEasyTypingAtInput('vc','c',cfg).text,'você');
 assert.equal(api.writerEasyTypingAtInput('teh','h',cfg).text,'the');
 cfg.replaceWithoutSpace=false;
 assert.equal(api.writerEasyTypingAtInput('vc','c',cfg),null);
 assert.equal(api.writerEasyTypingAtInput('teh','h',cfg),null);
 assert.deepEqual(plain(api.writerEasyTypingAtInput('vc ',' ',cfg)),{consume:3,text:'você '});
 assert.deepEqual(plain(api.writerEasyTypingAtInput('teh ',' ',cfg)),{consume:4,text:'the '});
});
test('Markdown horizontal rules are not auto-formatted as dashes',()=>{
 const cfg=api.writerTypoMerge({});
 for(const text of ['--','---','----'])assert.equal(api.writerTypoAtInput(text,'-',cfg),null);
 assert.equal(api.writerTypoAtInput('A --','-',cfg).text,'–');
 assert.equal(api.writerTypoAtInput('A –-','-',cfg).text,'—');
});
