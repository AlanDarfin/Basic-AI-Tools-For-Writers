'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('main.js','utf8');
function deferred(){let resolve,reject;const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});return {promise,resolve,reject};}
function harness(){
 class TFile{constructor(){this.path='Book/Scene.md';this.extension='md';}}
 const file=new TFile(),requests=[],rendered=[],marks=[],text='Text in the scene.';
 const method=main.slice(main.indexOf(' async reviewFile('),main.indexOf(' async recheckGrammarCorrection('));
 const cancel=main.slice(main.indexOf(' cancelReview(){'),main.indexOf(' updateReviewEngineUI(){'));
 const methods=vm.runInNewContext('({'+cancel+','+method+'})',{
  TFile,writerModuleOn:(plugin,key)=>plugin.settings.visibleModules?.[key]!==false,
  writerCurrentText:async()=>text,prepareGrammarText:value=>value,writerActiveEditor:()=>null,
  writerAutoGrammarWindow:value=>({text:value,from:0,partial:false}),writerGrammarMatchIsSafe:()=>true,
  writerReviewIsAcceptedWord:()=>false,meaningfulGrammarMatch:()=>true,msg:(_pt,en)=>en
 });
 const plugin={settings:{visibleModules:{review:true},reviewAutoOpenNote:false},
  checkGrammar:()=>{const job=deferred();requests.push(job);return job.promise;},
  showReviewMarks:(_file,matches)=>marks.push(matches),clearReviewMarks(){},autoGrammar:{schedule(){throw Error('Unexpected automatic check');}}};
 const view={plugin,activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,
  reviewResults:{empty(){}},reviewStatus:{setText:value=>{view.status=value;}},
  renderGrammarResults:(_file,_source,matches)=>rendered.push(matches),...methods};
 const start=async()=>{const count=requests.length,result=view.reviewFile(file);for(let i=0;i<8&&requests.length===count;i++)await Promise.resolve();assert.ok(requests.length>count,view.status);return {result};};
 return {view,plugin,requests,rendered,marks,start};
}
test('re-enabling review starts a fresh check while an old request is still pending',async()=>{
 const h=harness(),old=await h.start();assert.equal(h.requests.length,1);assert.equal(h.view.reviewBusy,true);
 h.plugin.settings.visibleModules.review=false;h.view.cancelReview();assert.equal(h.view.reviewBusy,false);
 h.plugin.settings.visibleModules.review=true;const next=await h.start();assert.equal(h.requests.length,2);
 h.requests[0].resolve([{offset:0,length:4,rule:{id:'OLD'}}]);await old.result;
 assert.equal(h.view.reviewBusy,true,'an old finally must not unlock the newer check');
 assert.equal(h.rendered.length,0);assert.equal(h.marks.length,0);
 h.requests[1].resolve([{offset:0,length:4,rule:{id:'NEW'}}]);await next.result;
 assert.equal(h.view.reviewBusy,false);assert.equal(h.rendered.length,1);assert.equal(h.rendered[0][0].rule.id,'NEW');
});
test('an old failed check cannot replace the new status after cancellation',async()=>{
 const h=harness(),old=await h.start();h.view.cancelReview();const next=await h.start();const current=h.view.status;
 h.requests[0].reject(Error('Old connection failed'));await old.result;
 assert.equal(h.view.status,current);assert.equal(h.view.reviewBusy,true);
 h.requests[1].resolve([]);await next.result;assert.match(h.view.status,/0 suggestions/);assert.equal(h.rendered.length,1);
});
test('disabling review suppresses results and failures without automatically restarting it',async()=>{
 const h=harness(),old=await h.start();h.plugin.settings.visibleModules.review=false;h.view.cancelReview();
 h.requests[0].reject(Error('Late response'));await old.result;
 assert.equal(h.view.status,'');assert.equal(h.rendered.length,0);assert.equal(h.view.reviewBusy,false);assert.equal(h.requests.length,1);
});
