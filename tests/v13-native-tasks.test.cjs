'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v12/task-workbench.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function deferred(){let resolve;const promise=new Promise(ok=>{resolve=ok;});return {promise,resolve};}
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.stat={mtime:1,size:0};}}
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.attributes={...options.attr};this.children=[];this.listeners={};this.classes=new Set((options.cls||'').split(' ').filter(Boolean));this.value=options.attr?.value||'';this.checked=false;this.isConnected=true;}
 createEl(tag,options){const el=new Element(tag,options);this.children.push(el);return el;}
 createDiv(options){return this.createEl('div',options);}createSpan(options){return this.createEl('span',options);}
 setAttribute(key,value){this.attributes[key]=value;}addClass(value){this.classes.add(value);}setText(value){this.text=value;}
 addEventListener(name,callback){this.listeners[name]=callback;}empty(){this.children=[];this.text='';}
 all(tag){return this.children.flatMap(child=>(child.tag===tag?[child]:[]).concat(child.all(tag)));}
 withClass(name){return this.classes.has(name)?this:this.children.map(child=>child.withClass(name)).find(Boolean);}
}
function harness(language='en'){
 const stored=new Map(),writes=[],notices=[],modals=[],commands=[],opens=[],leaves=[],hooks={};let reads=0,processes=0,modal;
 class Modal{
  constructor(){this.contentEl=new Element('root');this.rows=[];modal=this;modals.push(this);}
  setTitle(title){this.title=title;}open(){this.opened=true;this.onOpen?.();}close(){this.closed=true;this.contentEl.isConnected=false;this.onClose?.();}
 }
 class Setting{
  constructor(){this.row={controls:[]};modal.rows.push(this.row);}
  setName(value){this.row.name=value;return this;}setDesc(value){this.row.description=value;return this;}
  add(kind,register){const control={kind,inputEl:new Element(kind==='dropdown'?'select':'input'),options:new Map(),
   setValue(value){this.value=value;this.inputEl.value=value;return this;},setPlaceholder(value){this.placeholder=value;return this;},
   setDisabled(value){this.disabled=value;return this;},addOption(value,label){this.options.set(value,label);return this;},
   setButtonText(value){this.text=value;return this;},setCta(){return this;},onChange(callback){this.change=callback;return this;},onClick(callback){this.click=callback;return this;}};
   this.row.controls.push(control);register(control);return this;
  }
  addText(register){return this.add('text',register);}addDropdown(register){return this.add('dropdown',register);}addButton(register){return this.add('button',register);}
 }
 const plugin={settings:{v12Toolkit:{enabled:true,taskNavigator:true,maxTaskFiles:250}},app:{workspace:{getLeavesOfType:()=>leaves,getActiveFile:()=>plugin.active,
  getLeaf:()=>({openFile:async(file,options)=>opens.push({file,options})})},vault:{
   getMarkdownFiles:()=>[...stored.values()].map(row=>row.file),getAbstractFileByPath:path=>stored.get(path)?.file||null,
   read:async file=>{reads++;await hooks.beforeRead?.(file);const row=stored.get(file.path);if(!row)throw Error('Missing note');return row.text;},
   cachedRead:async file=>{await hooks.beforeCachedRead?.(file);return stored.get(file.path)?.text??'';},
   process:async(file,update)=>{processes++;await hooks.beforeProcess?.(file);const row=stored.get(file.path);if(!row)throw Error('Missing note');const next=update(row.text);row.text=next;file.stat.mtime++;file.stat.size=next.length;writes.push(next);return next;}
  }},addCommand:command=>commands.push(command)};
 const api=vm.runInNewContext(source+'\n({writerV12TaskRefs,writerV12ToggleTask,writerV12TaskWorkbench,writerV12TasksRegister,writerV139TaskDate,writerV139TaskToday,writerV139TaskMetadata,writerV139TaskVisible,writerV139TaskLine,writerV139TaskAppendable,writerV139TaskPreview,writerV139TaskCommit,writerV139TaskQuickAdd})',{
  TFile,Modal,Setting,Notice:class{constructor(message){notices.push(message);}},writerUi:(pt,en)=>language==='pt'?pt:en,
  writerV12On:(plugin,key)=>plugin.settings.v12Toolkit.enabled!==false&&plugin.settings.v12Toolkit[key]!==false,
  writerV12Config:plugin=>plugin.settings.v12Toolkit,console
 });
 const add=(path,text)=>{const file=new TFile(path);file.stat.size=text.length;stored.set(path,{file,text});if(!plugin.active)plugin.active=file;return file;};
 const field=(name,target=modal)=>{const row=target.rows.find(row=>row.name===name);assert.ok(row,'Missing field '+name);return row.controls[0];};
 const button=(name,target=modal)=>{const control=target.rows.flatMap(row=>row.controls).find(control=>control.kind==='button'&&control.text===name);assert.ok(control,'Missing button '+name);return control;};
 const change=async(name,value,target=modal)=>{const control=field(name,target);control.value=value;control.inputEl.value=value;await control.change(value);};
 return {api,plugin,stored,writes,notices,modals,commands,opens,leaves,hooks,add,field,button,change,get modal(){return modal;},get reads(){return reads;},get processes(){return processes;}};
}
const newFields={title:'Prepare chapter 🐌',due:'2026-11-12',priority:'high',tags:'#writing #review'};

test('task dates validate calendar days and use the local calendar, including leap years',()=>{
 const h=harness();
 for(const value of ['2024-02-29','2026-11-12','0001-01-01'])assert.equal(h.api.writerV139TaskDate(value),value);
 for(const value of ['2025-02-29','2026-04-31','2026-13-01','2026-00-02','2026-11-00','0000-01-01','2026-1-02','2026-01-0199'])assert.equal(h.api.writerV139TaskDate(value),'');
 assert.equal(h.api.writerV139TaskToday({getFullYear:()=>2026,getMonth:()=>10,getDate:()=>12,toISOString:()=> '2026-11-13T01:00:00Z'}),'2026-11-12');
});

test('task metadata reads conventional dates, Basic study dates and priority tags without rewriting the label',()=>{
 const h=harness(),text='Revise #writing #medium 📅 2026-11-12';
 assert.deepEqual(plain(h.api.writerV139TaskMetadata(text)),{due:'2026-11-12',priority:'medium'});
 assert.deepEqual(plain(h.api.writerV139TaskMetadata('[due:: 2026-02-28] Reminder #HIGH')),{due:'2026-02-28',priority:'high'});
 for(const invalid of ['📅 2026-02-30','📅 2026-01-0199','[due:: 2026-11-12oops]'])assert.equal(h.api.writerV139TaskMetadata(invalid).due,'');
 assert.equal(h.api.writerV139TaskMetadata('#higher #writing/low').priority,'');
 assert.equal(text,'Revise #writing #medium 📅 2026-11-12');
});

test('today, overdue, next seven days and undated scopes have distinct date boundaries',()=>{
 const h=harness(),today='2026-12-29',visible=(due,scope)=>h.api.writerV139TaskVisible({text:'Task'+(due?' 📅 '+due:'')},scope,today);
 assert.equal(visible('2026-12-29','today'),true);assert.equal(visible('2026-12-28','today'),false);
 assert.equal(visible('2026-12-28','overdue'),true);assert.equal(visible('2026-12-29','overdue'),false);
 assert.equal(visible('2026-12-30','upcoming'),true);assert.equal(visible('2027-01-05','upcoming'),true);assert.equal(visible('2027-01-06','upcoming'),false);
 assert.equal(visible('','unscheduled'),true);assert.equal(visible('2026-12-29','unscheduled'),false);assert.equal(visible('2026-02-30','unscheduled'),true);
 assert.equal(visible('','all'),true);
});

test('quick task lines preserve Unicode and validate the explicit date, priority and tag fields',()=>{
 const h=harness();assert.equal(h.api.writerV139TaskLine(newFields),'- [ ] Prepare chapter 🐌 #high #writing #review 📅 2026-11-12');
 for(const fields of [{title:''},{title:'First\n- [ ] Hidden second task'},{title:'\0'},{title:'x'.repeat(501)},
  {...newFields,due:'2026-02-30'},{...newFields,priority:'urgent'},{...newFields,tags:'#writing\n- bad'},
  {...newFields,tags:Array.from({length:9},(_,index)=>'#tag'+index).join(' ')}])assert.throws(()=>h.api.writerV139TaskLine(fields));
 assert.equal(h.api.writerV139TaskLine({title:'A task',tags:'#work #work'}),'- [ ] A task #work');
});

test('capture preview performs no write and commit preserves every original CRLF and Unicode character',async()=>{
 const h=harness(),original='---\r\ntitle: Livro 日本語\r\n---\r\n\r\n- [ ] Previous task 🐌  \r\n\r\n',file=h.add('Book/Tasks.md',original);
 const snapshot=await h.api.writerV139TaskPreview(h.plugin,file,newFields);
 assert.equal(h.writes.length,0);assert.equal(snapshot.path,'Book/Tasks.md');assert.equal(snapshot.source,original);
 await h.api.writerV139TaskCommit(h.plugin,snapshot);
 assert.equal(h.stored.get(file.path).text,original+snapshot.line+'\r\n');assert.equal(h.writes.length,1);
 assert.equal(h.api.writerV12TaskRefs(h.writes[0]).length,2);
 await assert.rejects(h.api.writerV139TaskCommit(h.plugin,snapshot),/changed/);assert.equal(h.writes.length,1);
});

test('append introduces exactly one separator when needed and leaves empty and fenced notes intact',async()=>{
 for(const original of ['', 'A note without newline', '```md\n- [ ] example\n```\n']){
  const h=harness(),file=h.add('Tasks.md',original),preview=await h.api.writerV139TaskPreview(h.plugin,file,{title:'A new task'});
  await h.api.writerV139TaskCommit(h.plugin,preview);
  assert.equal(h.writes[0],original+(original&&!original.endsWith('\n')?'\n':'')+'- [ ] A new task\n');
  assert.equal(h.api.writerV12TaskRefs(h.writes[0]).length,1);
 }
});

test('capture refuses to append inside unfinished code fences or frontmatter',async()=>{
 for(const original of ['````md\n```\n- [ ] Code example\n','~~~example\n','---\ntitle: Incomplete\n']){
  const h=harness(),file=h.add('Tasks.md',original);
  await assert.rejects(h.api.writerV139TaskPreview(h.plugin,file,newFields),/unfinished/);assert.equal(h.writes.length,0);
 }
 const h=harness();assert.equal(h.api.writerV139TaskAppendable('---\ntitle: Complete\n---\n```md\nExample\n```\n'),true);
});

test('unsaved editors block preview and a buffer changed after preview blocks the atomic append',async()=>{
 const h=harness(),file=h.add('Tasks.md','Original\n'),editor={text:'Unsaved writing',getValue(){return this.text;}};
 h.leaves.push({view:{file,editor}});
 await assert.rejects(h.api.writerV139TaskPreview(h.plugin,file,newFields),/unsaved/);assert.equal(h.writes.length,0);
 editor.text='Original\n';const preview=await h.api.writerV139TaskPreview(h.plugin,file,newFields);editor.text+='Local edit';
 await assert.rejects(h.api.writerV139TaskCommit(h.plugin,preview),/unsaved/);assert.equal(h.writes.length,0);
});

test('file replacement, rename or mutation after preview rejects append without creating another note',async()=>{
 for(const mutate of [(h,file)=>h.stored.set(file.path,{file:new TFile(file.path),text:'Replacement'}),
  (h,file)=>{h.stored.delete(file.path);file.path='Renamed.md';},
  (h,file)=>{h.stored.get(file.path).text='Concurrent content';}]){
  const h=harness(),file=h.add('Tasks.md','Original\n'),preview=await h.api.writerV139TaskPreview(h.plugin,file,newFields);mutate(h,file);
  await assert.rejects(h.api.writerV139TaskCommit(h.plugin,preview));assert.equal(h.writes.length,0);
 }
});

test('the atomic callback rechecks current editors, file identity and module switches after queued writes',async()=>{
 for(const change of [(h,file)=>h.leaves.push({view:{file,editor:{getValue:()=> 'Unsaved while queueing'}}}),
  h=>{h.plugin.settings.v12Toolkit.taskNavigator=false;},
  (h,file)=>{h.stored.set(file.path,{file:new TFile(file.path),text:'Original\n'});}]){
  const h=harness(),file=h.add('Tasks.md','Original\n'),preview=await h.api.writerV139TaskPreview(h.plugin,file,newFields),pending=deferred();
  h.hooks.beforeProcess=()=>pending.promise;
  const committing=h.api.writerV139TaskCommit(h.plugin,preview);change(h,file);pending.resolve();
  await assert.rejects(committing);assert.equal(h.writes.length,0);
 }
});

test('a task checkbox also refuses stale files, changed buffers and a newly disabled module in the atomic callback',async()=>{
 const h=harness(),source='- [ ] Existing #writing 📅 2026-11-12\r\n',file=h.add('Tasks.md',source),task=h.api.writerV12TaskRefs(source)[0],pending=deferred();
 h.hooks.beforeProcess=()=>pending.promise;
 const writing=h.api.writerV12ToggleTask(h.plugin,file,task,source);h.plugin.settings.v12Toolkit.taskNavigator=false;pending.resolve();
 await assert.rejects(writing,/disabled/);assert.equal(h.writes.length,0);
});

test('a changed file timestamp invalidates the reviewed capture even when the text is equal',async()=>{
 const h=harness(),file=h.add('Tasks.md','Original\n'),preview=await h.api.writerV139TaskPreview(h.plugin,file,newFields);
 file.stat.mtime++;
 await assert.rejects(h.api.writerV139TaskCommit(h.plugin,preview),/changed/);assert.equal(h.processes,0);assert.equal(h.writes.length,0);
});

test('checking one task preserves mixed line endings and rejects moved raw-line identities',async()=>{
 const h=harness(),original='Header 日本語\r\n- [ ] First 🐌\n- [ ] Second #writing\r\nTail\n',file=h.add('Tasks.md',original);
 const task=h.api.writerV12TaskRefs(original)[1];
 await h.api.writerV12ToggleTask(h.plugin,file,task,original);
 assert.equal(h.writes[0],original.replace('- [ ] Second','- [x] Second'));
 const changed=h.writes[0],stale={...h.api.writerV12TaskRefs(changed)[0],line:2};
 await assert.rejects(h.api.writerV12ToggleTask(h.plugin,file,stale,changed),/outdated/);assert.equal(h.writes.length,1);
});

test('quick add requires a reviewed preview, invalidates it when fields change and adds exactly one task',async()=>{
 const h=harness(),file=h.add('Tasks.md','Original\n'),modal=h.api.writerV139TaskQuickAdd(h.plugin);
 assert.equal(h.reads,0);assert.equal(h.button('Add task').disabled,true);
 await h.change('Description','First task');await h.button('Prepare preview').click();
 assert.equal(h.button('Add task').disabled,false);assert.equal(modal.contentEl.withClass('writer-native-task-destination').text,'Destination: Tasks.md');
 await h.change('Description','Changed task');assert.equal(h.button('Add task').disabled,true);assert.equal(modal.contentEl.withClass('writer-native-task-preview').text,'');
 await h.button('Prepare preview').click();
 const pending=deferred();h.hooks.beforeProcess=()=>pending.promise;
 const writing=h.button('Add task').click(),duplicate=h.button('Add task').click();pending.resolve();await Promise.all([writing,duplicate]);
 assert.equal(h.writes.length,1);assert.equal(h.stored.get(file.path).text,'Original\n- [ ] Changed task\n');assert.equal(modal.closed,true);
});

test('changing the selected destination requires a new preview and never writes the previous note',async()=>{
 const h=harness(),first=h.add('A.md','First\n'),second=h.add('B.md','Second\n');h.api.writerV139TaskQuickAdd(h.plugin);
 await h.change('Description','A task');await h.button('Prepare preview').click();
 await h.change('Destination note',second.path);assert.equal(h.button('Add task').disabled,true);
 await h.button('Prepare preview').click();await h.button('Add task').click();
 assert.equal(h.stored.get(first.path).text,'First\n');assert.equal(h.stored.get(second.path).text,'Second\n- [ ] A task\n');
});

test('closing capture while its read is pending discards the preview and makes no write',async()=>{
 const h=harness();h.add('Tasks.md','Original\n');const modal=h.api.writerV139TaskQuickAdd(h.plugin),pending=deferred();
 await h.change('Description','A task');h.hooks.beforeRead=()=>pending.promise;
 const preview=h.button('Prepare preview').click();modal.close();pending.resolve();await preview;
 assert.equal(h.writes.length,0);assert.equal(modal.contentEl.withClass('writer-native-task-preview').text,'');assert.equal(h.button('Add task').disabled,true);
});

test('native task UI and commands are bilingual, need no companion and respect their own switch',()=>{
 for(const lang of ['en','pt']){
  const h=harness(lang);h.add('Tasks.md','- [ ] Existing');h.api.writerV139TaskQuickAdd(h.plugin);
  assert.equal(h.modal.title,lang==='pt'?'Nova tarefa':'New task');assert.equal(h.reads,0);
  h.api.writerV12TasksRegister(h.plugin);assert.ok(h.commands.some(command=>command.id==='v13-task-quick-add'));
  h.plugin.settings.v12Toolkit.taskNavigator=false;
  const count=h.modals.length;h.commands.find(command=>command.id==='v13-task-quick-add').callback();assert.equal(h.modals.length,count);
 }
});

test('dashboard filters native Markdown tasks and opens the original line without depending on Snailkit',async()=>{
 const h=harness(),today=h.api.writerV139TaskToday(),file=h.add('Tasks.md','- [ ] Due today #writing #high 📅 '+today+'\n- [ ] No due date #review\n- [x] Done today 📅 '+today+'\n```md\n- [ ] Example 📅 '+today+'\n```\n');
 const modal=h.api.writerV12TaskWorkbench(h.plugin,'today');await new Promise(setImmediate);
 const rows=modal.contentEl.withClass('writer-native-task-results');assert.equal(rows.all('button').length,1);
 assert.ok(rows.withClass('writer-native-task-title').text.startsWith('Due today'));assert.equal(rows.withClass('writer-native-task-priority').text,'High');
 rows.all('button')[0].listeners.click();assert.equal(h.opens.length,1);assert.equal(h.opens[0].file,file);assert.deepEqual(plain(h.opens[0].options),{eState:{line:0}});
});

test('switching tasks off while the dashboard is open refuses checking and explains its disabled state',async()=>{
 const h=harness();h.add('Tasks.md','- [ ] Existing task');const modal=h.api.writerV12TaskWorkbench(h.plugin);await new Promise(setImmediate);
 const results=modal.contentEl.withClass('writer-native-task-results'),check=results.all('input')[0];
 h.plugin.settings.v12Toolkit.taskNavigator=false;check.checked=true;await check.listeners.change();
 assert.equal(h.writes.length,0);assert.equal(check.checked,false);assert.equal(results.children.length,0);
 assert.ok(modal.contentEl.all('p').some(el=>el.text==='Tasks are disabled in settings.'));
});
