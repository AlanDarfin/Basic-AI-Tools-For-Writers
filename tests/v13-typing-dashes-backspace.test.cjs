'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/editor/easy-typing.js','src/editor/easy-advanced.js','src/editor/smart-typography.js']
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
const trans=(before,insert,event,at=before.length,previous,caret=insert.length)=>{
 const next=before.slice(0,at)+insert+before.slice(at);
 const isUserEvent=pattern=>event===pattern||event.startsWith(pattern+'.');
 return {docChanged:true,newDoc:mockDoc(next),startState:{
  doc:mockDoc(before),field:()=>previous,
  selection:{main:{head:at,empty:true},ranges:[{}]}},
  newSelection:{main:{head:at+caret,empty:true},ranges:[{}]},
  isUserEvent,changes:{iterChanges:fn=>fn(at,at,at,at+insert.length,{toString:()=>insert})}};
};
const deletion=(before,from,to,head,previous,event='delete.backward')=>({
 docChanged:true,newDoc:mockDoc(before.slice(0,from)+before.slice(to)),
 startState:{doc:mockDoc(before),field:()=>previous,selection:{main:{head,empty:true},ranges:[{}]}},
 isUserEvent:name=>name===event,
 changes:{iterChanges:fn=>fn(from,to,from,from,{toString:()=>''})}
});

const pressBackspace=(p,text,head,state)=>{
 const submitted=[];
 const view={state:{doc:mockDoc(text),field:()=>state,
  selection:{ranges:[{}],main:{head,empty:true}}},dispatch:spec=>submitted.push(spec)};
 assert.equal(api.writerTypingRestoreBackspace(view,p),true);
 return submitted[0];
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
test('leading dashes progress through en dash and can be restored to a Markdown separator',()=>{
 const cfg=api.writerTypoMerge({});
 const p=plugin(cfg);
 for(const prefix of ['','Earlier paragraph\n\n','  ']){
  const first=api.writerTypingFilterTransaction(trans(prefix+'-','-','input.type'),p);
  assert.equal(first[1].changes[0].insert,'–');
  const firstMeta=first[1].annotations.payload;
  const second=api.writerTypingFilterTransaction(trans(prefix+'–','-','input.type',prefix.length+1,firstMeta),p);
  assert.equal(second[1].changes[0].insert,'—');
  const restored=pressBackspace(p,prefix+'—',prefix.length+1,second[1].annotations.payload);
  assert.deepEqual(plain(restored.changes),{from:prefix.length,to:prefix.length+1,insert:'---'});
  const literal=trans(prefix+'---','-','input.type');
  assert.equal(api.writerTypingFilterTransaction(literal,p),literal);
 }
 for(const prefix of ['---\ntitle: test\n','```md\n','~~~md\n','    ']){
  const tx=trans(prefix+'-','-','input.type');
  assert.equal(api.writerTypingFilterTransaction(tx,p),tx);
 }
});
test('dialogue shorthand honors the automatic conversion and the no-space toggle',()=>{
 const p=plugin(api.writerTypoMerge({smartTypography:{restoreOnBackspace:false}}));
 const first=api.writerTypingFilterTransaction(trans('-','-','input.type'),p);
 assert.equal(first[1].changes[0].insert,'–');
 const meta=first[1].annotations.payload;
 for(const next of [' ','O']){
  const tx=trans('–',next,'input.type',1,meta);
  const converted=api.writerTypingFilterTransaction(tx,p);
  assert.equal(converted[1].changes[0].insert,'—'+next);
 }
 p.writerSmartTypography.cfg.dialogueDashes=false;
 const tx=trans('–','O','input.type',1,meta);
 assert.equal(api.writerTypingFilterTransaction(tx,p),tx);
 const preexisting=trans('–',' ','input.type');
 assert.equal(api.writerTypingFilterTransaction(preexisting,p),preexisting);
});
test('paired opening quotes restore one straight quote and remove the auto-inserted closer',()=>{
 const p=plugin();
 for(const [straight,open,close] of [['"','“','”'],["'",'‘','’']]){
  const pair=api.writerTypingFilterTransaction(trans('A: texto',straight.repeat(2),'input.type',3,undefined,1),p);
  const [{insert}]=pair[1].changes;
  const meta=pair[1].annotations.payload,text='A: '+open+close+'texto';
  assert.equal(insert,open+close);
  assert.equal(pair[1].selection.anchor,4);
  const restored=pressBackspace(p,text,4,meta);
  assert.deepEqual(plain(restored.changes),{from:3,to:5,insert:straight});
  assert.equal(restored.selection.anchor,4);
  for(const [to,event] of [[4,'input.delete'],[5,'delete.backward']]){
   const mobile=api.writerTypingFilterTransaction(deletion(text,3,to,4,meta,event),p);
   assert.deepEqual(plain(mobile[1].changes),{from:3,to:5-(to-3),insert:straight});
   assert.equal(mobile[1].selection.anchor,4);
  }
 }
});
test('unpaired opening and closing quotes, apostrophes, and stepped-over closers revert to ASCII',()=>{
 const p=plugin();
 for(const [before,straight,curly] of [['Ele disse: ','"','“'],['Ele disse: ',"'",'‘'],['“Fim','"','”'],['d',"'","’"]]){
  const converted=api.writerTypingFilterTransaction(trans(before,straight,'input.type'),p);
  const text=before+curly,meta=converted[1].annotations.payload;
  assert.equal(converted[1].changes[0].insert,curly);
  assert.equal(pressBackspace(p,text,text.length,meta).changes.insert,straight);
  assert.equal(api.writerTypingFilterTransaction(deletion(text,before.length,text.length,text.length,meta),p)[1].changes.insert,straight);
 }
 for(const [before,straight] of [['“Fim”','"'],['‘Fim’',"'"]]){
  const typed=api.writerTypingFilterTransaction(trans(before,straight,'input.type',before.length-1),p);
  assert.equal(typed[1].selection.anchor,before.length);
  assert.equal(pressBackspace(p,before,before.length,typed[1].annotations.payload).changes.insert,straight);
 }
});
test('custom multicharacter quotes are restored as a single replacement',()=>{
 const p=plugin(api.writerTypoMerge({smartTypography:{openDouble:'« ',closeDouble:' »'}}));
 const pair=api.writerTypingFilterTransaction(trans('','""','input.type',0,undefined,1),p);
 const text='«  »',meta=pair[1].annotations.payload;
 assert.equal(pair[1].selection.anchor,2);
 assert.deepEqual(plain(pressBackspace(p,text,2,meta).changes),{from:0,to:4,insert:'"'});
 assert.deepEqual(plain(api.writerTypingFilterTransaction(deletion(text,1,2,2,meta),p)[1].changes),{from:0,to:3,insert:'"'});
});
test('Restore stays out of IME composition and multi-cursor deletion',()=>{
 const p=plugin(),state={from:2,to:3,text:'—',original:'---',source:'typography'};
 const view={composing:true,state:{doc:mockDoc('A —'),field:()=>state,
  selection:{ranges:[{}],main:{head:3,empty:true}}},dispatch:()=>assert.fail('IME must keep control')};
 assert.equal(api.writerTypingRestoreBackspace(view,p),false);
 const tr={docChanged:true,newDoc:mockDoc('A '),startState:{doc:mockDoc('A —'),field:()=>state,
  selection:{main:{head:3,empty:true},ranges:[{},{}]}},isUserEvent:e=>e==='delete.backward',
  changes:{iterChanges:fn=>fn(2,3,2,2,{toString:()=>''})}};
 assert.equal(api.writerTypingFilterTransaction(tr,p),tr);
});
test('Disabling the owning module or restore option leaves Backspace native',()=>{
 const p=plugin(),state={from:2,to:3,text:'—',original:'---',source:'typography'};
 const view={state:{doc:mockDoc('A —'),field:()=>state,
  selection:{ranges:[{}],main:{head:3,empty:true}}},dispatch:()=>assert.fail('disabled handler')};
 p.writerSmartTypography.active=()=>false;
 assert.equal(api.writerTypingRestoreBackspace(view,p),false);
 p.writerSmartTypography.active=()=>true;p.writerSmartTypography.cfg.restoreOnBackspace=false;
 assert.equal(api.writerTypingRestoreBackspace(view,p),false);
});
