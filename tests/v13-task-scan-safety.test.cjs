'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v12/task-workbench.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}
class TFile{constructor(path,text=''){this.path=path;this.extension='md';this.stat={mtime:1,size:text.length};}}
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.attributes=options.attr||{};this.children=[];this.events={};this.value=options.attr?.value||'';this.classes=new Set((options.cls||'').split(' ').filter(Boolean));this.isConnected=true;}
 createEl(tag,options){const el=new Element(tag,options);this.children.push(el);return el;}
 createDiv(options){return this.createEl('div',options);}createSpan(options){return this.createEl('span',options);}
 setText(value){this.text=value;}setAttribute(key,value){this.attributes[key]=value;}addClass(value){this.classes.add(value);}
 addEventListener(key,callback){this.events[key]=callback;}empty(){this.children=[];this.text='';}
 find(cls){return this.classes.has(cls)?this:this.children.map(el=>el.find(cls)).find(Boolean);}
 all(tag){return this.children.flatMap(el=>(el.tag===tag?[el]:[]).concat(el.all(tag)));}
}
function harness(language='en'){
 const files=new Map(),writes=[],notices=[],modals=[],opens=[],hooks={},leaves=[];let processCalls=0,readCalls=0;
 class Modal{
  constructor(){this.contentEl=new Element();this.buttons=[];modals.push(this);}
  setTitle(value){this.title=value;}open(){this.opened=true;}close(){this.closed=true;this.contentEl.isConnected=false;this.onClose?.();}
 }
 class Setting{
  constructor(){this.modal=modals.at(-1);}
  addButton(register){const button={setButtonText(value){this.text=value;return this;},setDisabled(value){this.disabled=value;return this;},onClick(callback){this.click=callback;return this;}};this.modal.buttons.push(button);register(button);return this;}
 }
 const settings={v12Toolkit:{enabled:true,taskNavigator:true,maxTaskFiles:250},customPreference:'keep'};
 const plugin={settings,openCoreSettings:id=>opens.push(id),app:{workspace:{getLeavesOfType:()=>leaves},vault:{
  getMarkdownFiles:()=>{hooks.beforeList?.();return [...files.values()].map(row=>row.file);},
  getAbstractFileByPath:path=>files.get(path)?.file||null,
  cachedRead:async file=>{readCalls++;await hooks.beforeRead?.(file);return files.get(file.path)?.text;},
  read:async file=>files.get(file.path)?.text,
  process:async(file,update)=>{processCalls++;await hooks.beforeProcess?.(file);const row=files.get(file.path);const text=update(row.text);row.text=text;writes.push(text);}
 }}};
 const api=vm.runInNewContext(source+'\n({writerV12TaskRefs,writerV12ToggleTask,writerV1391TaskScan,writerV1391TaskEligible,writerV12TaskWorkbench,writerV139TaskAppendable,writerV139TaskPreview})',{
  TFile,Modal,Setting,console,require:()=>({setIcon(){}}),Notice:class{constructor(message){notices.push(message);}},writerUi:(pt,en)=>language==='pt'?pt:en,
  writerV12On:(plugin,key)=>plugin.settings.v12Toolkit.enabled!==false&&plugin.settings.v12Toolkit[key]!==false,
  writerV12Config:plugin=>plugin.settings.v12Toolkit
 });
 const add=(path,text)=>{const file=new TFile(path,text);files.set(path,{file,text});return file;};
 const button=(modal,text)=>{const found=modal.buttons.find(item=>item.text===text);assert.ok(found,'Missing button '+text);return found;};
 return {api,plugin,settings,files,writes,notices,modals,opens,hooks,leaves,add,button,get processCalls(){return processCalls;},get readCalls(){return readCalls;}};
}
const settle=()=>new Promise(setImmediate);

test('YAML properties, including block scalars and both closing markers, never become tasks',()=>{
 for(const end of ['---','...'])for(const bom of ['','\uFEFF']){
  const h=harness(),text=bom+'---\r\ndescription: |\r\n  - [ ] Hidden YAML 🐌 #high\r\n  %% example\r\n  <!-- example\r\n'+end+'\r\n- [ ] Visible 日本語 📅 2026-11-16\r\n';
  const tasks=h.api.writerV12TaskRefs(text);
  assert.equal(tasks.length,1);assert.equal(tasks[0].line,6);assert.equal(tasks[0].raw,'- [ ] Visible 日本語 📅 2026-11-16');
  assert.equal(h.api.writerV1391TaskEligible(text,{line:2,raw:'  - [ ] Hidden YAML 🐌 #high',done:false}),false);
 }
});
test('unfinished YAML stays excluded, while a later horizontal rule does not start properties',()=>{
 const h=harness();assert.equal(h.api.writerV12TaskRefs('---\nfield: |\n  - [ ] Hidden until YAML closes').length,0);
 const text='\n---\n- [ ] Visible below a horizontal rule';
 assert.equal(h.api.writerV12TaskRefs(text)[0].line,2);
});
test('closed and unfinished HTML or Obsidian comments exclude their task-shaped lines',()=>{
 const h=harness();
 for(const [open,close] of [['<!--','-->'],['%%','%%']]){
  const text=['- [ ] Before',open,'  - [ ] Hidden',close,'- [X] After #writing'].join('\n');
  assert.deepEqual(Array.from(h.api.writerV12TaskRefs(text),task=>task.line),[0,4]);
  assert.equal(h.api.writerV12TaskRefs(open+'\n- [ ] Hidden to EOF').length,0);
 }
});
test('comment markers inside code examples do not swallow following visible tasks',()=>{
 const h=harness(),text=['- [ ] Explain `<!--` and `%%` syntax','````md','<!--','%%','```','- [ ] Hidden code','````','- [ ] Actual after fence','<!--','```','- [ ] Hidden comment','-->','- [ ] Actual after comment'].join('\n');
 const tasks=h.api.writerV12TaskRefs(text);
 assert.deepEqual(Array.from(tasks,task=>task.line),[0,7,12]);
 assert.equal(h.api.writerV12TaskRefs('- [ ] Explain ``a ` <!-- %%`` safely\n- [ ] Next').length,2);
});
test('nested and ordered visible tasks retain their raw lines, state and inline metadata',()=>{
 const h=harness(),raw='\t  12. [X] 日本語 😃 #writing 📅 2026-11-16 <!-- inline note -->';
 const tasks=h.api.writerV12TaskRefs(raw+'\r\n    - [ ] Nested child\n- [ ] Next');
 assert.equal(tasks.length,3);assert.equal(tasks[0].raw,raw);assert.equal(tasks[0].done,true);
 assert.equal(tasks[0].text,'日本語 😃 #writing 📅 2026-11-16 <!-- inline note -->');assert.deepEqual([...tasks[0].tags],['#writing']);
});
test('forged hidden task references cannot reach the atomic write',async()=>{
 for(const text of ['---\n  - [ ] Hidden\n---','<!--\n  - [ ] Hidden\n-->','%%\n  - [ ] Hidden\n%%','```md\n  - [ ] Hidden\n```']){
  const h=harness(),file=h.add('Tasks.md',text),reference={line:1,raw:'  - [ ] Hidden',done:false};
  await assert.rejects(h.api.writerV12ToggleTask(h.plugin,file,reference,text),/not an editable/);
  assert.equal(h.processCalls,0);assert.equal(h.writes.length,0);assert.equal(h.files.get(file.path).text,text);
 }
});
test('forged checkbox state and invalid positions are rejected without modifying the note',async()=>{
 const h=harness(),text='- [x] Actual',file=h.add('Tasks.md',text);
 for(const reference of [{line:0,raw:text,done:false},{line:0,raw:text,done:'true'},null,{line:-1,raw:text,done:true}])await assert.rejects(h.api.writerV12ToggleTask(h.plugin,file,reference,text));
 assert.equal(h.processCalls,0);assert.equal(h.files.get(file.path).text,text);
});
test('a valid write changes only the chosen checkbox, retaining hidden content and mixed line endings',async()=>{
 const h=harness(),text='---\r\ndescription: |\n  - [ ] YAML\r\n---\n<!--\r\n- [ ] Comment\n-->\r\n\t- [ ] Real 😃 #writing 📅 2026-11-16\n',file=h.add('Tasks.md',text);
 const reference=h.api.writerV12TaskRefs(text)[0];await h.api.writerV12ToggleTask(h.plugin,file,reference,text);
 assert.equal(h.writes[0],text.replace('\t- [ ] Real','\t- [x] Real'));assert.equal(h.writes.length,1);
});
test('the queued write keeps the original reference and rechecks file, module and source',async()=>{
 for(const change of ['source','module','identity','reference']){
  const h=harness(),text='- [ ] First\n- [ ] Second',file=h.add('Tasks.md',text),reference=plain(h.api.writerV12TaskRefs(text)[0]),pending=deferred();
  h.hooks.beforeProcess=()=>pending.promise;const write=h.api.writerV12ToggleTask(h.plugin,file,reference,text);
  if(change==='source')h.files.get(file.path).text='<!--\n'+text+'\n-->';
  if(change==='module')h.settings.v12Toolkit.taskNavigator=false;
  if(change==='identity')h.files.set(file.path,{file:new TFile(file.path,text),text});
  if(change==='reference')Object.assign(reference,{line:1,raw:'- [ ] Second'});
  pending.resolve();
  if(change==='reference'){await write;assert.equal(h.writes[0],'- [x] First\n- [ ] Second');}
  else {await assert.rejects(write);assert.equal(h.writes.length,0);}
 }
});
test('the per-note limit reports truncation only when an additional eligible task exists',()=>{
 const h=harness(),first=Array.from({length:250},(_,i)=>'- [ ] Visible '+i).join('\n');
 assert.equal(h.api.writerV1391TaskScan(first).truncated,false);
 assert.equal(h.api.writerV1391TaskScan(first+'\n<!--\n- [ ] Hidden extra\n-->').truncated,false);
 const extra=h.api.writerV1391TaskScan(first+'\n- [ ] Visible 251');assert.equal(extra.tasks.length,250);assert.equal(extra.truncated,true);
 assert.equal(h.api.writerV1391TaskEligible(first+'\n- [ ] Visible 251',{line:250,raw:'- [ ] Visible 251',done:false}),true);
});
test('dashboard reports scanned notes, unreadable notes and task truncation without changing limits',async()=>{
 const h=harness();h.settings.v12Toolkit.maxTaskFiles=2;
 h.add('Many.md',Array.from({length:251},(_,i)=>'- [ ] Task '+i).join('\n'));h.add('Unreadable.md','- [ ] Unreadable');h.add('Outside.md','- [ ] Outside scan');h.add('Outside2.md','- [ ] Also outside');
 h.hooks.beforeRead=file=>{if(file.path==='Unreadable.md')throw Error('Cannot read');};
 const modal=h.api.writerV12TaskWorkbench(h.plugin);await settle();
 assert.match(modal.contentEl.all('p')[0].text,/250 tasks.*2\/4 notes examined/);
 const message=modal.contentEl.find('writer-native-task-coverage').text;
 assert.match(message,/Incomplete search/);assert.match(message,/2 notes outside/);assert.match(message,/1 notes could not be read/);assert.match(message,/first 250/);
 assert.equal(h.readCalls,2);assert.equal(h.settings.v12Toolkit.maxTaskFiles,2);assert.equal(h.settings.customPreference,'keep');assert.equal(h.writes.length,0);
 await h.button(modal,'Search options').click();assert.deepEqual(h.opens,['tasks']);assert.equal(modal.closed,true);assert.equal(h.readCalls,2);
});
test('complete scans do not claim truncation at exactly 250 and empty filters describe the examined scope',async()=>{
 const h=harness();h.add('Tasks.md',Array.from({length:250},(_,i)=>'- [ ] Task '+i).join('\n'));
 const modal=h.api.writerV12TaskWorkbench(h.plugin,'today');await settle();
 assert.equal(modal.contentEl.find('writer-native-task-coverage').text,'');assert.match(modal.contentEl.all('p')[0].text,/1\/1 notes examined/);
 assert.match(modal.contentEl.find('writer-native-task-results').all('p')[0].text,/examined notes/);
});
test('coverage and native search options are localized without triggering a settings change',async()=>{
 const h=harness('pt');h.settings.v12Toolkit.maxTaskFiles=1;h.add('First.md','');h.add('Second.md','- [ ] Not scanned');
 const modal=h.api.writerV12TaskWorkbench(h.plugin);await settle();
 assert.match(modal.contentEl.all('p')[0].text,/1\/2 notas examinadas/);assert.match(modal.contentEl.find('writer-native-task-coverage').text,/Busca incompleta/);
 await h.button(modal,'Opções de busca').click();assert.deepEqual(h.opens,['tasks']);assert.equal(h.settings.v12Toolkit.maxTaskFiles,1);assert.equal(h.writes.length,0);
});
test('a failed refresh labels preserved results instead of presenting them as a fresh complete scan',async()=>{
 const h=harness();h.add('Tasks.md','- [ ] Existing');const modal=h.api.writerV12TaskWorkbench(h.plugin);await settle();
 h.hooks.beforeList=()=>{throw Error('List unavailable');};await h.button(modal,'Refresh').click();
 assert.ok(modal.contentEl.find('writer-native-task-title'));assert.match(modal.contentEl.find('writer-native-task-coverage').text,/refresh failed.*previous results/);
 assert.equal(h.writes.length,0);assert.equal(h.notices.length,1);
});
test('module disable or closing during a scan prevents obsolete coverage and task results from appearing',async()=>{
 for(const action of ['disable','close']){
  const h=harness(),pending=deferred();h.add('Tasks.md','- [ ] Existing');h.hooks.beforeRead=()=>pending.promise;
  const modal=h.api.writerV12TaskWorkbench(h.plugin);if(action==='close')modal.close();else h.settings.v12Toolkit.taskNavigator=false;
  pending.resolve();await settle();
  assert.equal(modal.contentEl.find('writer-native-task-results').children.length,0);assert.equal(modal.contentEl.find('writer-native-task-coverage').text,'');assert.equal(h.writes.length,0);
 }
});
test('quick capture refuses an unfinished HTML or Obsidian comment instead of creating an invisible task',async()=>{
 for(const prefix of ['<!--','%%']){
  const h=harness(),text='# Note\n'+prefix+'\nPrivate unfinished comment',file=h.add('Note.md',text);
  assert.equal(h.api.writerV139TaskAppendable(text),false);
  await assert.rejects(h.api.writerV139TaskPreview(h.plugin,file,{title:'Must remain visible'}),/unfinished comment/);
  assert.equal(h.files.get(file.path).text,text);assert.equal(h.processCalls,0);assert.equal(h.writes.length,0);
 }
});
test('capture accepts closed comments and inline examples without mistaking literal fence markers for an open block',async()=>{
 for(const text of ['<!--\n```md\n-->\n','%%\n~~~md\n%%\n','Explain `<!--` and ``%%`` syntax.\n']){
  const h=harness(),file=h.add('Note.md',text);assert.equal(h.api.writerV139TaskAppendable(text),true);
  const preview=await h.api.writerV139TaskPreview(h.plugin,file,{title:'Visible capture'});
  assert.equal(preview.source,text);assert.equal(preview.next,text+'- [ ] Visible capture\n');
  const tasks=h.api.writerV12TaskRefs(preview.next);assert.equal(tasks.length,1);assert.equal(tasks[0].text,'Visible capture');assert.equal(h.writes.length,0);
 }
});
