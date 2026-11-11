'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v11/longform-studio.js','utf8');
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.stat={mtime:1,size:0};}}
class TFolder{constructor(path){this.path=path;}}
class Element{
 constructor(tag,options={}){this.tag=tag;this.text=options.text||'';this.attributes=options.attr||{};this.children=[];this.listeners={};this.isConnected=true;}
 createEl(tag,options){const node=new Element(tag,options);this.children.push(node);return node;}
 createDiv(options){return this.createEl('div',options);}createSpan(options){return this.createEl('span',options);}
 addEventListener(name,callback){this.listeners[name]=callback;}setText(value){this.text=value;}empty(){this.children=[];this.text='';}
 addClass(){}
 all(tag){return this.children.flatMap(child=>(child.tag===tag?[child]:[]).concat(child.all(tag)));}
}
function harness(count=2){
 const stored=new Map(),created=[],opened=[],notices=[],leaves=[],hooks={};let modal;
 const project={title:'Complete book',file:new TFile('Book/Index.md'),format:'scenes',scenes:[]};
 const files=Array.from({length:count},(_,index)=>{
  const file=new TFile('Book/Chapter '+(index+1)+'.md'),text='Saved chapter '+(index+1);
  file.stat.size=text.length;stored.set(file.path,{file,text});project.scenes.push({title:file.basename,indent:index%2});return file;
 });
 stored.set(project.file.path,{file:project.file,text:'Single book text'});
 class Modal{
  constructor(){this.contentEl=new Element('root');this.settings=[];this.ready=deferred();modal=this;}
  setTitle(value){this.title=value;}open(){this.onOpen?.();}close(){this.closed=true;this.onClose?.();}
 }
 class Setting{
  constructor(){this.record={name:'',buttons:[]};modal.settings.push(this.record);}
  setName(value){this.record.name=value;return this;}setDesc(){return this;}
  addDropdown(callback){
   const dropdown={options:{},addOption(value,label){this.options[value]=label;return this;},setValue(value){this.value=value;return this;},
    setDisabled(value){this.disabled=value;return this;},onChange(callback){this.change=callback;return this;}};
   this.record.dropdown=dropdown;callback(dropdown);return this;
  }
  addToggle(callback){
   const toggle={setValue(value){this.value=value;return this;},setDisabled(value){this.disabled=value;return this;},onChange(callback){this.change=callback;return this;}};
   this.record.toggle=toggle;callback(toggle);return this;
  }
  addButton(callback){
   const button={text:'',setButtonText(value){this.text=value;return this;},setCta(){return this;},
    setDisabled(value){this.disabled=value;if(!value&&this.text==='Create manuscript')modal.ready.resolve();return this;},
    onClick(callback){this.click=callback;return this;}};
   this.record.buttons.push(button);callback(button);return this;
  }
 }
 const vault={
  getAbstractFileByPath:path=>stored.get(path)?.file||null,
  read:async file=>{
   await hooks.beforeRead?.(file);
   const entry=stored.get(file.path);if(!entry)throw Error('Read failed');
   const value=entry.text;await hooks.afterRead?.(file);return value;
  },
  createFolder:async path=>{
   await hooks.beforeFolder?.(path);
   if(stored.has(path))throw Error('Folder already exists');stored.set(path,{file:new TFolder(path)});
  },
  create:async(path,text)=>{
   await hooks.beforeCreate?.(path,text);
   if(stored.has(path))throw Error('File already exists');
   const file=new TFile(path);file.stat.size=text.length;stored.set(path,{file,text});created.push(file);return file;
  },
  process:async()=>{throw Error('Compilation must not modify a source');},
  modify:async()=>{throw Error('Compilation must not modify a source');}
 };
 const plugin={settings:{v11Studio:{chapterLimit:10}},_writerV11Drafts:new Map(),app:{vault,
  workspace:{getLeavesOfType:()=>leaves,getLeaf:()=>({openFile:async file=>{opened.push(file);await hooks.beforeOpen?.(file);}})}}};
 const recovery={ready:Promise.resolve(),blocked:false};
 const api=vm.runInNewContext(source+'\n({writerV11ManuscriptScenes,writerV11ManuscriptSnapshot,writerV11SaveManuscript,writerV11Compile,writerV11RenderLongformTab})',{
  TFile,TFolder,Modal,Setting,setTimeout,writerUi:(_pt,en)=>en,Notice:class{constructor(text){notices.push(text);}},
  lfFlattenScenes:scenes=>scenes,writerBookNavFindSceneFile:(_project,scene)=>files.find(file=>file.basename===scene.title),
  writerV134Recovery:()=>recovery,console
 });
 const scenes=()=>api.writerV11ManuscriptScenes(plugin,project);
 const editor=(file,text,mode='source')=>{
  const view={file,editor:{text,getValue(){return this.text;}},getMode:()=>mode};leaves.push({view});return view;
 };
 return {api,plugin,project,files,stored,created,opened,notices,leaves,hooks,recovery,scenes,editor,
  snapshot:mode=>api.writerV11ManuscriptSnapshot(plugin,project,scenes(),mode),
  compile:sceneSource=>api.writerV11Compile(plugin,project,sceneSource),
  change(file,text){const entry=stored.get(file.path);entry.text=text;file.stat.mtime++;file.stat.size=text.length;},
  get modal(){return modal;},
  get create(){return modal.settings.flatMap(setting=>setting.buttons).find(button=>button.text==='Create manuscript');},
  get refresh(){return modal.settings.flatMap(setting=>setting.buttons).find(button=>button.text==='Refresh preview');},
  get dropdown(){return modal.settings.find(setting=>setting.dropdown).dropdown;},
  get approval(){return modal.settings.find(setting=>setting.toggle).toggle;},
  get summary(){return modal.contentEl.children.find(node=>node.attributes.role==='status')?.text;},
  get preview(){return modal.contentEl.all('pre')[0].text;}
 };
}
function observeVault(h){
 const listeners=new Set(),vault=h.plugin.app.vault;
 vault.on=(name,callback)=>{const ref={name,callback};listeners.add(ref);return ref;};
 vault.offref=ref=>listeners.delete(ref);
 return {get count(){return listeners.size;},emit(name,...args){for(const ref of [...listeners])if(ref.name===name)ref.callback(...args);}};
}

test('compilation includes all 125 ordered chapters beyond the editor session limit',async()=>{
 const h=harness(125),snapshot=await h.snapshot('saved');
 assert.equal(snapshot.rows.length,125);assert.equal(h.plugin.settings.v11Studio.chapterLimit,10);
 assert.deepEqual(Array.from(snapshot.rows,row=>row.path),h.files.map(file=>file.path));
 assert.ok(snapshot.manuscript.includes('# Chapter 125\n\nSaved chapter 125'));
 assert.ok(snapshot.manuscript.indexOf('# Chapter 2\n')<snapshot.manuscript.indexOf('# Chapter 3\n'));
 assert.equal(h.created.length,0);
});

test('inline compilation uses the complete active draft while limiting only chapter editors',async()=>{
 const h=harness(125),panel=new Element('section');let active=h.project.scenes.slice().reverse();
 const view={plugin:h.plugin,activeScenes:()=>active,resolveScene:(_project,title)=>h.files.find(file=>file.basename===title)};
 h.api.writerV11RenderLongformTab(view,panel,h.project);
 assert.equal(panel.all('details').length,10);
 assert.ok(panel.all('span').some(node=>node.text==='10/125 chapters'));
 panel.all('button').find(node=>node.text==='Compile manuscript').listeners.click();
 await h.modal.ready.promise;
 assert.equal(h.modal.contentEl.all('li').length,125);
 assert.ok(h.preview.startsWith('# Complete book\n\n# Chapter 125\n'));
 active=[h.project.scenes[3],h.project.scenes[1]];
 await h.refresh.click();assert.equal(h.modal.contentEl.all('li').length,2);
 assert.ok(h.preview.indexOf('# Chapter 4\n')<h.preview.indexOf('# Chapter 2\n'));
});

test('single-format Longform books and standalone notes compile their note',async()=>{
 for(const kind of ['single','standalone']){
  const h=harness(0);if(kind==='single')h.project.format='single';else h.project.standalone=true;
  const result=await h.snapshot('saved');assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].path,h.project.file.path);assert.ok(result.manuscript.includes('Single book text'));
 }
});

test('missing scenes remain visible blockers and repeated scene references retain their positions',async()=>{
 const h=harness(2);h.project.scenes.push({title:'Missing chapter'});
 assert.equal(h.scenes().length,3);assert.equal(h.scenes()[2].file,undefined);
 await assert.rejects(h.snapshot('saved'),/Missing or unavailable chapter: Missing chapter/);
 await h.compile();assert.equal(h.create.disabled,true);assert.equal(h.created.length,0);
 h.project.scenes=[h.project.scenes[0],h.project.scenes[1],h.project.scenes[0]];
 const snapshot=await h.snapshot('saved');assert.equal(snapshot.rows.length,3);
 assert.equal(snapshot.manuscript.split('# Chapter 1\n').length-1,2);
});

test('saved-file mode is the default and explicitly excludes unsaved writing',async()=>{
 const h=harness(1),saved=h.stored.get(h.files[0].path).text;
 h.plugin._writerV11Drafts.set(h.files[0].path,{original:saved,text:'Longform prose'});
 h.editor(h.files[0],'Independent editor prose');
 await h.compile();assert.equal(h.dropdown.value,'saved');assert.ok(h.preview.includes(saved));
 assert.equal(h.preview.includes('Longform prose'),false);assert.equal(h.preview.includes('Independent editor prose'),false);
 assert.ok(h.modal.contentEl.all('p').some(node=>node.text.includes('Saved files excludes unsaved edits')));
});

test('current writing includes compatible recovery drafts and native buffers without saving originals',async()=>{
 const h=harness(3),loading=deferred();h.recovery.ready=loading.promise;
 const reading=h.snapshot('current');
 h.plugin._writerV11Drafts.set(h.files[0].path,{original:h.stored.get(h.files[0].path).text,text:'Recovered Longform prose'});
 h.editor(h.files[1],'Unsaved native prose');h.editor(h.files[2],'Stale preview buffer','preview');loading.resolve();
 const result=await reading;
 assert.deepEqual(Array.from(result.rows,row=>row.origin),['draft','editor','saved']);
 assert.ok(result.manuscript.includes('Recovered Longform prose'));assert.ok(result.manuscript.includes('Unsaved native prose'));
 assert.equal(result.manuscript.includes('Stale preview buffer'),false);
 assert.equal(h.stored.get(h.files[0].path).text,'Saved chapter 1');assert.equal(h.stored.get(h.files[1].path).text,'Saved chapter 2');
 assert.equal(h.plugin._writerV11Drafts.get(h.files[0].path).text,'Recovered Longform prose');assert.equal(h.created.length,0);
});

test('current writing rejects stale draft bases and divergent drafts or editing panes',async()=>{
 const h=harness(1),file=h.files[0],saved=h.stored.get(file.path).text;
 h.plugin._writerV11Drafts.set(file.path,{original:'Earlier base',text:'Recovery conflict'});
 await assert.rejects(h.snapshot('current'),/Draft is based on another version/);
 h.plugin._writerV11Drafts.set(file.path,{original:saved,text:'Longform draft'});const view=h.editor(file,'Editor draft');
 await assert.rejects(h.snapshot('current'),/Draft and editor have different text/);
 view.editor.text='Longform draft';assert.ok((await h.snapshot('current')).manuscript.includes('Longform draft'));
 h.editor(file,saved);await assert.rejects(h.snapshot('current'),/Open panes have different text/);
 assert.equal(h.created.length,0);assert.equal(h.stored.get(file.path).text,saved);
});

test('unreadable recovery blocks current-writing mode while saved files remain exportable',async()=>{
 const h=harness(1);h.recovery.blocked=true;
 await assert.rejects(h.snapshot('current'),/Recovery copies need attention/);
 assert.ok((await h.snapshot('saved')).manuscript.includes('Saved chapter 1'));
});

test('changes to earlier disk chapters, drafts or buffers during preparation invalidate the preview',async()=>{
 for(const kind of ['disk','draft','buffer','path','identity']){
  const h=harness(2),first=h.files[0],saved=h.stored.get(first.path).text;
  const view=h.editor(first,saved);h.plugin._writerV11Drafts.set(first.path,{original:saved,text:saved});let changed=false;
  h.hooks.beforeRead=file=>{
   if(changed||file!==h.files[1])return;changed=true;
   if(kind==='disk')h.change(first,'Changed earlier chapter');
   if(kind==='draft')h.plugin._writerV11Drafts.set(first.path,{original:saved,text:'New draft'});
   if(kind==='buffer')view.editor.text='New unsaved prose';
   if(kind==='path'){const entry=h.stored.get(first.path);h.stored.delete(first.path);first.path='Renamed.md';h.stored.set(first.path,entry);}
   if(kind==='identity')h.stored.set(first.path,{file:new TFile(first.path),text:saved});
  };
  await assert.rejects(h.snapshot('current'),/project changed/);assert.equal(h.created.length,0);
 }
});

test('changing the active scene order during preparation blocks the incomplete generation',async()=>{
 const h=harness(2);let scenes=h.scenes(),changed=false;
 h.hooks.afterRead=()=>{if(!changed){changed=true;scenes=scenes.slice().reverse();}};
 await h.compile(()=>scenes);assert.equal(h.create.disabled,true);assert.match(h.summary,/project order changed/);
});

test('mutating a supplied scene array in place cannot change the prepared generation unnoticed',async()=>{
 for(const kind of ['order','title']){
  const h=harness(2),scenes=h.scenes();let changed=false;
  h.hooks.afterRead=()=>{
   if(changed)return;changed=true;
   if(kind==='order')scenes.reverse();else scenes[0].title='Changed chapter title';
  };
  await h.compile(scenes);assert.equal(h.create.disabled,true);assert.match(h.summary,/project order changed/);
 }
});

test('source modify events catch same-size preserved-mtime edits after an earlier chapter final read',async()=>{
 const h=harness(2),events=observeVault(h),first=h.files[0],metadata={...first.stat};let secondReads=0;
 h.hooks.afterRead=file=>{
  if(file===h.files[1]&&++secondReads===2){
   h.stored.get(first.path).text='Newer chapter 1';events.emit('modify',first);
  }
 };
 await assert.rejects(h.snapshot('saved'),/project changed/);
 assert.deepEqual(first.stat,metadata);assert.equal(h.created.length,0);assert.equal(events.count,0);
 h.hooks.afterRead=null;
 assert.ok((await h.snapshot('saved')).manuscript.includes('Newer chapter 1'));assert.equal(events.count,0);
});

test('project-index modification and ancestor rename/delete events invalidate preparation and detach listeners',async()=>{
 for(const event of ['modify','rename','delete']){
  const h=harness(2),events=observeVault(h);let secondReads=0;
  h.hooks.afterRead=file=>{
   if(file!==h.files[1]||++secondReads!==2)return;
   if(event==='modify'){h.project.scenes.reverse();events.emit(event,h.project.file);}
   else events.emit(event,new TFolder(event==='rename'?'Moved':'Book'),'Book');
  };
  await assert.rejects(h.snapshot('saved'),/project changed/);assert.equal(events.count,0);assert.equal(h.created.length,0);
 }
});

test('unrelated vault changes do not invalidate a manuscript and successful/failed preparations release listeners',async()=>{
 const h=harness(2),events=observeVault(h);
 h.hooks.afterRead=()=>events.emit('modify',new TFile('Other book/Chapter.md'));
 assert.equal((await h.snapshot('saved')).rows.length,2);assert.equal(events.count,0);
 h.hooks.beforeRead=()=>{throw Error('Read failed');};
 await assert.rejects(h.snapshot('saved'),/Read failed/);assert.equal(events.count,0);
});

test('newer source mode wins over a pending earlier preview and closing cancels pending reads',async()=>{
 const h=harness(1),events=observeVault(h),started=deferred(),resume=deferred();let held=false;
 h.hooks.beforeRead=async()=>{if(!held){held=true;started.resolve();await resume.promise;}};
 const initial=h.compile();await started.promise;h.editor(h.files[0],'Current editor text');
 h.dropdown.change('current');await h.modal.ready.promise;
 assert.ok(h.preview.includes('Current editor text'));resume.resolve();await initial;
 assert.ok(h.preview.includes('Current editor text'));assert.equal(events.count,0);
 const closed=harness(1),closeEvents=observeVault(closed),readStarted=deferred(),continueRead=deferred();
 closed.hooks.beforeRead=async()=>{readStarted.resolve();await continueRead.promise;};
 const pending=closed.compile();await readStarted.promise;closed.modal.close();continueRead.resolve();await pending;
 assert.equal(closed.created.length,0);assert.equal(closed.modal.closed,true);assert.equal(closeEvents.count,0);
});

test('export uses the complete frozen preview until refresh and creates no source writes',async()=>{
 const h=harness(2),long='BEGIN '+ 'á'.repeat(8000)+' END';h.change(h.files[0],long);await h.compile();
 assert.equal(h.preview.length,6000);assert.ok(h.modal.contentEl.all('p').some(node=>node.text.includes('6,000 characters')));
 assert.equal(h.modal.contentEl.all('details')[0].open,undefined,'The chapter list starts collapsed');
 h.change(h.files[0],'Edited after preview');h.approval.change(true);await h.create.click();
 const exported=h.stored.get(h.created[0].path).text;
 assert.ok(exported.includes(long));assert.equal(exported.includes('Edited after preview'),false);
 assert.equal(h.stored.get(h.files[0].path).text,'Edited after preview');assert.equal(h.opened.length,1);
 const refreshed=harness(1);await refreshed.compile();refreshed.change(refreshed.files[0],'Refreshed prose');
 refreshed.approval.change(true);await refreshed.refresh.click();assert.ok(refreshed.preview.includes('Refreshed prose'));
 await refreshed.create.click();assert.equal(refreshed.created.length,0,'Refresh clears prior approval');
});

test('export confirmation and a busy guard prevent unintended or duplicate creations',async()=>{
 const h=harness(1);await h.compile();await h.create.click();assert.equal(h.created.length,0);assert.match(h.notices[0],/Confirm creation/);
 const started=deferred(),resume=deferred();h.hooks.beforeCreate=async()=>{started.resolve();await resume.promise;};
 h.approval.change(true);const first=h.create.click();await started.promise;await h.create.click();resume.resolve();await first;
 assert.equal(h.created.length,1);assert.equal(h.opened.length,1);
});

test('concurrent folder and filename creation select a new path without overwriting existing notes',async()=>{
 const h=harness(1);let folderRaced=false,fileRaced=false;
 h.hooks.beforeFolder=path=>{if(!folderRaced){folderRaced=true;h.stored.set(path,{file:new TFolder(path)});}};
 h.hooks.beforeCreate=(path)=>{if(!fileRaced){fileRaced=true;h.stored.set(path,{file:new TFile(path),text:'Another export'});}};
 const file=await h.api.writerV11SaveManuscript(h.plugin,h.project,'Complete manuscript');
 assert.ok(file.path.endsWith('Manuscrito 2.md'));assert.equal(h.stored.get(file.path).text,'Complete manuscript');
 assert.equal(h.stored.get(file.path.replace(' 2.md','.md')).text,'Another export');
});

test('read, create and open failures preserve sources and keep completed exports available',async()=>{
 const h=harness(1);h.hooks.beforeRead=()=>{throw Error('Read failed');};await h.compile();
 assert.equal(h.create.disabled,true);assert.equal(h.created.length,0);
 const failing=harness(1);await failing.compile();failing.approval.change(true);
 failing.hooks.beforeCreate=()=>{throw Error('Disk full');};await failing.create.click();
 assert.equal(failing.created.length,0);assert.equal(failing.stored.get(failing.files[0].path).text,'Saved chapter 1');
 assert.equal(failing.create.disabled,false);assert.equal(failing.notices[0],'Disk full');
 failing.hooks.beforeCreate=null;failing.hooks.beforeOpen=()=>{throw Error('Cannot open pane');};await failing.create.click();
 assert.equal(failing.created.length,1);assert.match(failing.notices.at(-1),/Manuscript created; could not open/);
});
