'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(tag='div',options={}){this.tag=tag;this.cls=options.cls||'';this.text=options.text||'';this.attrs={...options.attr};this.dataset={};this.children=[];this.isConnected=true;}
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 setText(value){this.text=value;}
 setAttribute(name,value){this.attrs[name]=value;}
 getAttribute(name){return this.attrs[name]??null;}
 find(cls){return this.cls.split(' ').includes(cls)?this:this.children.map(child=>child.find(cls)).find(Boolean);}
}
function runtime(initial={},language='en'){
 const rows=[],saves=[],requests=[],timers=new Map();let timerId=0;
 let reply=async()=>{throw Error('Unexpected request');},read=async()=> 'A short note.';
 class Setting{
  constructor(parent){this.row={controls:[],parent};rows.push(this.row);}
  setName(value){this.row.name=value;return this;}
  setDesc(value){this.row.description=value;return this;}
  control(type,register){
   const control={type,inputEl:new Element('input'),buttonEl:new Element('button'),
    setValue(value){this.value=value;return this;},setDisabled(value){this.disabled=value;return this;},
    setPlaceholder(){return this;},setLimits(){return this;},setDynamicTooltip(){return this;},
    addOption(){return this;},setButtonText(value){this.text=value;return this;},
    onChange(callback){this.change=callback;return this;},onClick(callback){this.click=callback;return this;}};
   this.row.controls.push(control);register(control);return this;
  }
  addDropdown(register){return this.control('dropdown',register);}
  addToggle(register){return this.control('toggle',register);}
  addSlider(register){return this.control('slider',register);}
  addText(register){return this.control('text',register);}
  addTextArea(register){return this.control('textarea',register);}
  addButton(register){return this.control('button',register);}
 }
 const source=fs.readFileSync('src/v4/auto-grammar.js','utf8')+'\n'+fs.readFileSync('src/v13/grammar-settings.js','utf8');
 const api=vm.runInNewContext(source+'\n({writerAutoGrammarSettings,writerGrammarEndpoint,writerGrammarRequest,writerGrammarCancel,WriterAutoGrammar,writerV137GrammarSettings,writerV137GrammarWords,writerV137GrammarRules})',{
  Setting,URL,URLSearchParams,VIEW:'offline-dictionary-view',Date,console,
  writerUi:(pt,en)=>language==='pt'?pt:en,
  writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
  writerCurrentText:(...args)=>read(...args),
  requestUrl:async options=>{requests.push(options);return reply(options);},
  setTimeout:callback=>{timers.set(++timerId,callback);return timerId;},clearTimeout:id=>timers.delete(id)
 });
 const settings={reviewLanguage:'pt-BR',reviewEndpoint:'https://api.languagetool.org/v2/check',...structuredClone(initial)};
 const plugin={settings,app:{workspace:{getLeavesOfType:()=>[]}},
  autoGrammar:{cancelPending(){}},clearReviewMarks(){},
  saveSettings:async()=>{saves.push(structuredClone(settings));},
  checkGrammar:text=>api.writerGrammarRequest(plugin,text)};
 const panel=new Element();
 const control=(name,type)=>{
  const row=rows.find(row=>row.name===name);assert.ok(row,'Missing setting '+name);
  const item=row.controls.find(item=>item.type===type);assert.ok(item,'Missing '+type+' for '+name);return item;
 };
 return {api,settings,plugin,panel,rows,saves,requests,timers,control,
  send:callback=>{reply=callback;},read:callback=>{read=callback;},render:()=>api.writerV137GrammarSettings(plugin,panel)};
}
const response=matches=>({status:200,json:{matches}});
function deferred(){let resolve,reject;const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});return {promise,resolve,reject};}

test('grammar setup renders both languages without reading notes or contacting a server',()=>{
 for(const lang of ['pt','en']){
  const h=runtime({reviewApiKey:'example-key'},lang);
  h.plugin.app.vault={read:()=>{throw Error('Do not read notes');}};
  h.render();
  assert.equal(h.requests.length,0);assert.equal(h.saves.length,0);
  const key=h.control(lang==='pt'?'Chave da API (opcional)':'API key (optional)','text');
  assert.equal(key.inputEl.type,'password');
  const show=h.control(lang==='pt'?'Chave da API (opcional)':'API key (optional)','button');
  assert.equal(show.buttonEl.getAttribute('aria-pressed'),'false');show.click();
  assert.equal(key.inputEl.type,'text');assert.equal(show.buttonEl.getAttribute('aria-pressed'),'true');
  assert.equal(h.requests.length,0);
 }
});

test('invalid server edits retain the last endpoint and valid HTTPS edits persist',async()=>{
 const h=runtime();const root=h.render(),endpoint=h.control('Server endpoint','text');
 const original=h.settings.reviewEndpoint;
 for(const value of ['not a URL','http://example.org/v2/check','https://user:secret@example.org/v2/check']){
  await endpoint.change(value);assert.equal(h.settings.reviewEndpoint,original);
  assert.equal(endpoint.inputEl.getAttribute('aria-invalid'),'true');
  assert.equal(h.control('Test connection','button').disabled,true);
 }
 assert.match(root.find('writer-grammar-feedback').text,/previous address was kept/);
 await endpoint.change(' https://grammar.example.org/v2/check ');
 assert.equal(h.settings.reviewEndpoint,'https://grammar.example.org/v2/check');
 assert.equal(endpoint.inputEl.getAttribute('aria-invalid'),'false');assert.equal(h.saves.length,1);
 assert.equal(h.api.writerGrammarEndpoint(''),original);
 assert.equal(h.requests.length,0);
});

test('grammar requests send configured language and optional account fields without changing preferences',async()=>{
 const h=runtime({reviewLanguage:'en-GB',reviewApiKey:'example-key',reviewUsername:'person@example.org',reviewCustomWords:['Invented']});
 h.send(async()=>response([{offset:0,length:3,message:'Example'}]));
 const matches=await h.api.writerGrammarRequest(h.plugin,'The short text.');
 assert.equal(matches.length,1);assert.equal(h.requests.length,1);
 const request=h.requests[0],body=new URLSearchParams(request.body);
 assert.equal(request.url,h.settings.reviewEndpoint);assert.equal(request.method,'POST');
 assert.equal(body.get('language'),'en-GB');assert.equal(body.get('text'),'The short text.');
 assert.equal(body.get('apiKey'),'example-key');assert.equal(body.get('username'),'person@example.org');
 assert.equal(body.has('reviewCustomWords'),false);assert.equal(h.saves.length,0);
});

test('disabled review, external mode, invalid endpoints and oversized passages never send requests',async()=>{
 for(const settings of [{visibleModules:{review:false}},{reviewEngine:'external'},
  {reviewEndpoint:'http://example.org/check'},{reviewEndpoint:'https://user:secret@example.org/check'}]){
  const h=runtime(settings);await assert.rejects(h.api.writerGrammarRequest(h.plugin,'Text.'));
  assert.equal(h.requests.length,0);
 }
 const long=runtime();await assert.rejects(long.api.writerGrammarRequest(long.plugin,'x'.repeat(18001)),/18,000/);
 assert.equal(long.requests.length,0);
});

test('late responses are cancelled after disabling review, changing connection or explicit cancellation',async()=>{
 for(const change of [h=>{h.settings.visibleModules={review:false};},h=>{h.settings.reviewEngine='external';},
  h=>{h.settings.reviewLanguage='en-US';},h=>{h.api.writerGrammarCancel(h.plugin);}]){
  const h=runtime(),pending=deferred();h.send(()=>pending.promise);
  const job=h.api.writerGrammarRequest(h.plugin,'Text.');change(h);pending.resolve(response([]));
  await assert.rejects(job,error=>error.code==='WRITER_GRAMMAR_CANCELLED');
 }
});

test('connection failures explain HTTP status without disclosing server response text',async()=>{
 for(const status of [400,401,403,413,429,500]){
  const h=runtime();h.send(async()=>({status,text:'Sensitive echoed input or credential',json:{}}));
  await assert.rejects(h.api.writerGrammarRequest(h.plugin,'Text.'),error=>
   error.message.includes('HTTP '+status)&&!error.message.includes('Sensitive'));
 }
 const bad=runtime();bad.send(async()=>({status:200,get json(){throw Error('Sensitive JSON');}}));
 await assert.rejects(bad.api.writerGrammarRequest(bad.plugin,'Text.'),/Invalid checker response/);
});

test('the explicit connection test sends only a fixed sample and reports success',async()=>{
 const h=runtime();const root=h.render();h.send(async()=>response([]));
 h.plugin.app.vault={read:()=>{throw Error('No note may be read');},cachedRead:()=>{throw Error('No note may be read');}};
 await h.control('Test connection','button').click();
 assert.equal(h.requests.length,1);
 assert.equal(new URLSearchParams(h.requests[0].body).get('text'),'This is a short test sentence.');
 assert.equal(root.find('writer-grammar-test-status').dataset.state,'success');
 assert.match(root.find('writer-grammar-test-status').text,/Connection available/);
 assert.equal(h.control('Test connection','button').disabled,false);
});

test('editing a connection while its test is pending ignores the old response without another request',async()=>{
 const h=runtime();const root=h.render(),pending=deferred();h.send(()=>pending.promise);
 const button=h.control('Test connection','button'),job=button.click();
 assert.equal(button.disabled,true);
 await h.control('Server endpoint','text').change('https://new.example.org/v2/check');
 pending.resolve(response([]));await job;
 assert.equal(h.requests.length,1);assert.equal(root.find('writer-grammar-test-status').text,'');
 assert.equal(button.disabled,false);
});

test('manual mode and reviewer controls keep valid choices through repeated normalization',async()=>{
 const h=runtime({autoGrammar:{enabled:true,delayMs:3500,minIntervalMs:9000,maxWindowChars:12000}});
 let cancellations=0;h.plugin.autoGrammar.cancelPending=()=>{cancellations++;};h.render();
 const current=h.settings.autoGrammar;
 await h.control('When to check','dropdown').change('manual');h.api.writerAutoGrammarSettings(h.settings);
 assert.equal(h.settings.autoGrammar,current);assert.equal(h.settings.autoGrammar.enabled,false);
 assert.equal(h.control('Pause after typing','slider').disabled,true);
 await h.control('When to check','dropdown').change('automatic');
 await h.control('Pause after typing','slider').change(8);
 await h.control('Minimum interval between checks','slider').change(15);
 await h.control('Characters per automatic check','slider').change(8000);
 assert.equal(h.settings.autoGrammar.delayMs,8000);assert.equal(h.settings.autoGrammar.minIntervalMs,15000);
 assert.equal(h.settings.autoGrammar.maxWindowChars,8000);assert.ok(cancellations>=5);
 assert.equal(h.requests.length,0);
});

test('disabled review and external checker keep Basic connection tests unavailable',async()=>{
 const disabled=runtime({visibleModules:{review:false}});const state=disabled.render().find('writer-grammar-state');
 assert.equal(state.dataset.state,'disabled');assert.equal(disabled.control('Test connection','button').disabled,true);
 await disabled.control('Test connection','button').click();assert.equal(disabled.requests.length,0);
 const external=runtime();external.render();await external.control('Grammar checker','dropdown').change('external');
 assert.equal(external.control('Test connection','button').disabled,true);
 assert.equal(external.control('Server endpoint','text').disabled,true);
 assert.equal(external.control('When to check','dropdown').disabled,true);assert.equal(external.requests.length,0);
});

test('personal words and ignored rule editors deduplicate valid entries and explain rejected entries',async()=>{
 const h=runtime();h.render();
 await h.control('Personal spelling dictionary','textarea').change('Ana\nAna\nFaísca\n123\nnot a word');
 assert.deepEqual(Array.from(h.settings.reviewCustomWords),['Ana','Faísca']);
 await h.control('Ignored rule IDs','textarea').change('RULE_ONE, rule_one; OTHER_RULE\n<invalid>');
 assert.equal(h.settings.reviewIgnoreRules,'RULE_ONE, OTHER_RULE');assert.equal(h.requests.length,0);
});

function reviewer(h,path='Novel.md'){
 const file={path,extension:'md'},view={activeTab:'review',reviewMode:{value:'grammar'},reviewFilePath:path,
  reviewStatus:{setText:text=>{view.status=text;}},reviewFile:async()=>{view.checks=(view.checks||0)+1;}};
 h.plugin.settings.autoGrammar=h.api.writerAutoGrammarSettings(h.settings);
 h.plugin.app.workspace.getLeavesOfType=()=>[{view}];
 h.plugin.app.vault={getAbstractFileByPath:()=>file};
 return {file,view,manager:new h.api.WriterAutoGrammar(h.plugin)};
}

test('automatic review does not start after the module is disabled during a note read',async()=>{
 const h=runtime(),pending=deferred();h.read(()=>pending.promise);
 const {file,view,manager}=reviewer(h);manager.schedule(file);const job=manager.run();
 h.settings.visibleModules={review:false};pending.resolve('Text.');await job;
 assert.equal(view.checks,undefined);assert.equal(h.requests.length,0);
});

test('a newer scheduled note is not lost when an earlier automatic read finishes',async()=>{
 const h=runtime(),pending=deferred();h.read(()=>pending.promise);
 const {file,view,manager}=reviewer(h);manager.schedule(file);const job=manager.run();
 const next={path:'Next.md',extension:'md'};view.reviewFilePath=next.path;manager.schedule(next);
 pending.resolve('Old text.');await job;
 assert.equal(view.checks,undefined);assert.equal(manager.pendingPath,next.path);assert.ok(manager.timer);
});

test('automatic checker failures are handled without an unhandled timer rejection',async()=>{
 const h=runtime();const {file,view,manager}=reviewer(h);
 view.reviewFile=async()=>{throw Error('Offline');};manager.schedule(file);await manager.run();
 assert.match(view.status,/Could not update automatic review/);
 manager.stop();assert.equal(manager.pendingPath,null);assert.equal(manager.timer,null);
});
