'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
let queued=[],cleared=new Set(),nextId=0;
const mockTimers={
 setTimeout:fn=>{const id=++nextId;queued.push({id,fn});return id;},
 clearTimeout:id=>cleared.add(id)
};
const api=vm.runInNewContext(fs.readFileSync('src/v4/auto-grammar.js','utf8')+
 '\n({writerAutoGrammarSettings,writerAutoGrammarWindow,WriterAutoGrammar})',{
 VIEW:'basic-ai-tool-for-writers',writerModuleOn:()=>true,writerUi:(pt,en)=>pt,writerCurrentText:async()=> 'Sample document',console,...mockTimers,Date
});
const {writerAutoGrammarSettings,writerAutoGrammarWindow,WriterAutoGrammar}=api;
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
test('default auto-check is enabled only while review tab is open',()=>{
 const settings={unrelated:true};
 const cfg=writerAutoGrammarSettings(settings);
 assert.equal(cfg.enabled,true);assert.equal(cfg.delayMs,3500);
 assert.equal(cfg.minIntervalMs,9000);assert.equal(settings.unrelated,true);
});
test('delay and throttling are bounded',()=>{
 const s={autoGrammar:{delayMs:50,minIntervalMs:5,maxWindowChars:500000}};
 writerAutoGrammarSettings(s);assert.equal(s.autoGrammar.delayMs,2000);
 assert.equal(s.autoGrammar.minIntervalMs,6000);assert.equal(s.autoGrammar.maxWindowChars,16000);
});
test('large manuscript checks a small cursor window with source offsets',()=>{
 const input=('Lorem ipsum dolor sit amet.\n').repeat(1400);
 const offset=input.length-1000;
 const w=writerAutoGrammarWindow(input,offset,12000);
 assert.equal(w.partial,true);
 assert.ok(w.text.length<=12000&&w.from>0&&w.to<=input.length);
 assert.equal(w.text,input.slice(w.from,w.to));
 assert.ok(w.from<=offset&&offset<=w.to);
 assert.deepEqual(JSON.parse(JSON.stringify(writerAutoGrammarWindow('abc',1,12000))),
 {from:0,to:3,text:'abc',partial:false});
});
(async()=>{
 const file={path:'Novel.md',extension:'md'};
 let runs=0,status='',events={};
 const view={
  activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:file.path,
  reviewStatus:{setText:x=>status=x},
  reviewFile:async()=>{runs++;}
 };
 const plugin={
  settings:{autoGrammar:writerAutoGrammarSettings({})},
  registerEvent(){},register(){},
  app:{workspace:{on:(event,fn)=>{events[event]=fn;return {};},getLeavesOfType:()=>[{view}],getActiveFile:()=>file},
       vault:{getAbstractFileByPath:()=>file}}
 };
 const manager=new WriterAutoGrammar(plugin);manager.register();
 events['editor-change'](null,{file});
 events['editor-change'](null,{file});
 assert.equal(queued.length,2);
 assert.ok(cleared.has(queued[0].id),'older debounce scheduled timer cleared');
 assert.match(status,/Verificação automática/);
 await queued[1].fn();
 assert.equal(runs,1);
 passed++;console.log('PASS edits debounce to one LanguageTool review');
 view.activeTab='chat';manager.schedule(file);
 assert.equal(queued.length,2,'inactive reviewer does not auto-run');
 view.activeTab='review';view.reviewMode.value='style';manager.schedule(file);
 assert.equal(queued.length,2,'AI style mode cannot auto-trigger');
 manager.stop();
 passed++;console.log('PASS auto-check respects reviewer tab and mode, and cleans up timers');
 const code=fs.readFileSync('main.js','utf8');
 for(const text of ['writerAutoGrammarSettings(this.settings)','this.autoGrammar.register()',
  'this.plugin.autoGrammar?.schedule(file)','writerAutoGrammarWindow(grammarText',
  'source!==await writerCurrentText(this.plugin,file)','automatic=false']){
  assert.ok(code.includes(text),text);
 }
 passed++;console.log('PASS main bundle contains safeguards and auto-check integration');
 console.log(passed+' automated grammar tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
