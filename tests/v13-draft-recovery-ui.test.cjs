'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/v13/draft-recovery-ui.js'),'utf8');
class TFile{
 constructor(path){this.path=path;this.extension=path.split('.').pop();this.basename=path.split('/').pop().replace(/\.[^.]+$/,'');}
}
class TFolder{constructor(path){this.path=path;this.children=[];}}
class Element{
 constructor(tag='div',options={},doc){
  this.tag=tag;this.cls=options.cls||'';this.text=options.text||'';this.children=[];this.listeners={};
  this.attributes={...options.attr};this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.ownerDocument=doc;
 }
 createEl(tag,options={}){const node=new Element(tag,options,this.ownerDocument);this.children.push(node);return node;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 addClass(value){this.cls+=' '+value;}
 setText(value){this.text=String(value);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]??null;}
 empty(){this.children=[];}
 addEventListener(name,fn){this.listeners[name]=fn;}
 focus(){this.ownerDocument.activeElement=this;}
 find(cls){if(this.cls.split(/\s+/).includes(cls))return this;for(const child of this.children){const found=child.find(cls);if(found)return found;}return null;}
}
function gate(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}
async function settle(){for(let i=0;i<8;i++)await Promise.resolve();}
function entry(path='Book/Chapter.md',text='Unsaved draft',original='Original'){
 return {path,text,original,updatedAt:'2026-11-09T12:00:00.000Z'};
}
function setup(entries=[entry()]){
 const files=new Map(),contents=new Map(),created=[],opened=[],notices=[],document={};
 files.set('Book',new TFolder('Book'));
 for(const draft of entries){files.set(draft.path,new TFile(draft.path));contents.set(draft.path,draft.original);}
 const store={
  entries:entries.map(item=>({...item})),status:{phase:'saved',error:'',count:entries.length},ready:Promise.resolve(),listeners:new Set(),discards:[],retries:0,
  list(){return this.entries.map(item=>({...item}));},
  subscribe(callback){this.listeners.add(callback);return ()=>this.listeners.delete(callback);},
  emit(){this.status.count=this.entries.length;for(const callback of this.listeners)callback();},
  async discard(target){
   const actual=this.entries.find(item=>item.path===target.path);
   if(!actual||actual.original!==target.original||actual.text!==target.text)throw Error('Draft changed; reopen before discarding');
   this.discards.push({...target});this.entries=this.entries.filter(item=>item!==actual);this.emit();
  },
  async retry(){this.retries++;this.status={phase:'saved',count:this.entries.length,error:''};this.emit();}
 };
 const vault={
  getAbstractFileByPath:filename=>files.get(filename)||null,
  async read(file){if(!contents.has(file.path))throw Error('Missing original');return contents.get(file.path);},
  async createFolder(folder){if(files.has(folder))throw Error('Folder exists');files.set(folder,new TFolder(folder));},
  async create(filename,text){
   await this.beforeCreate?.(filename,text);
   if(files.has(filename))throw Error('File exists');
   const file=new TFile(filename);files.set(filename,file);contents.set(filename,text);created.push({file,text});return file;
  },
  modify(){throw Error('Original must not be modified');},
  process(){throw Error('Original must not be processed');}
 };
 const plugin={app:{vault,workspace:{getLeaf:()=>({openFile:async file=>{opened.push(file);}})}}};
 class Modal{
  constructor(){this.modalEl=new Element('div',{},document);this.contentEl=new Element('div',{},document);}
  setTitle(value){this.title=value;}
  open(){this.opened=this.onOpen();}
  close(){this.onClose();}
 }
 const api=vm.runInNewContext(source+'\n({writerV134OpenRecovery,writerV134SaveRecoveryCopy})',{
  TFile,TFolder,Modal,writerUi:(_pt,en)=>en,writerV134Recovery:()=>store,
  Notice:class{constructor(message){notices.push(message);}}
 });
 const open=async initialPath=>{
  const modal=api.writerV134OpenRecovery(plugin,initialPath);await modal.opened;await settle();
  return modal;
 };
 return {api,plugin,store,files,contents,created,opened,notices,document,vault,open};
}
test('the concatenated store and UI preserve independent entry validators',async()=>{
 const storeSource=fs.readFileSync(path.join(__dirname,'../src/v13/draft-recovery.js'),'utf8');
 const plugin={settings:{v11Studio:{}},manifest:{dir:'.obsidian/plugins/basic'},app:{vault:{
  adapter:{exists:async()=>false}
 }}};
 const api=vm.runInNewContext(storeSource+'\n'+source+'\n({writerV134Recovery})',{
  console,writerUi:(_pt,en)=>en,setTimeout:()=>1,clearTimeout:()=>{}
 });
 const store=api.writerV134Recovery(plugin);await store.ready;
 assert.equal(store.capture('Book/Chapter.md','Original','Recovered text'),true);
 assert.equal(store.list()[0].path,'Book/Chapter.md');
 assert.equal(store.list()[0].text,'Recovered text');
});
test('export creates a unique sibling note and preserves source bytes and the recovery entry',async()=>{
 const draft=entry('Book/Chapter.md',' \nNew **Markdown** with coração.\n');
 const h=setup([draft]);
 h.files.set('Book/Chapter (recovered draft).md',new TFile('Book/Chapter (recovered draft).md'));
 h.contents.set('Book/Chapter (recovered draft).md','Existing copy');
 const file=await h.api.writerV134SaveRecoveryCopy(h.plugin,draft);
 assert.equal(file.path,'Book/Chapter (recovered draft 2).md');
 assert.equal(h.contents.get(file.path),draft.text);
 assert.equal(h.contents.get(draft.path),'Original');
 assert.equal(h.contents.get('Book/Chapter (recovered draft).md'),'Existing copy');
 assert.equal(h.store.entries.length,1);
});
test('missing parent uses Basic Recovered and a create collision retries without overwriting the competing note',async()=>{
 const draft=entry('Deleted/Chapter.md','Recovered');
 const h=setup([draft]);let first=true;
 h.vault.beforeCreate=filename=>{
  if(first){first=false;h.files.set(filename,new TFile(filename));h.contents.set(filename,'Concurrent note');throw Error('Already exists');}
 };
 const file=await h.api.writerV134SaveRecoveryCopy(h.plugin,draft);
 assert.ok(h.files.get('Basic Recovered') instanceof TFolder);
 assert.equal(file.path,'Basic Recovered/Chapter (recovered draft 2).md');
 assert.equal(h.contents.get('Basic Recovered/Chapter (recovered draft).md'),'Concurrent note');
 assert.equal(h.contents.get(file.path),'Recovered');
});
test('export rejects unsafe paths and propagates storage failures without writing an original',async()=>{
 const h=setup();
 for(const filename of ['../Escape.md','/Escape.md','Book\\Escape.md','Book//Escape.md','Document.pdf']){
  await assert.rejects(h.api.writerV134SaveRecoveryCopy(h.plugin,entry(filename)),/Invalid recovery/);
 }
 await assert.rejects(h.api.writerV134SaveRecoveryCopy(h.plugin,entry('Invalid.md',null)),/Invalid recovery/);
 h.vault.beforeCreate=()=>{throw Error('Disk full');};
 await assert.rejects(h.api.writerV134SaveRecoveryCopy(h.plugin,entry()),/Disk full/);
 assert.equal(h.created.length,0);assert.equal(h.contents.get('Book/Chapter.md'),'Original');
 const empty=setup([entry('Book/Empty.md','','Original')]);
 const file=await empty.api.writerV134SaveRecoveryCopy(empty.plugin,empty.store.entries[0]);
 assert.equal(empty.contents.get(file.path),'','An intentionally empty draft is still recoverable');
});
test('explicit export rescues an oversized in-memory draft without the automatic-store limit',async()=>{
 const draft=entry('Book/Large.md','x'.repeat(2000001)+'\nFull final line');
 const h=setup([draft]);
 const file=await h.api.writerV134SaveRecoveryCopy(h.plugin,draft);
 assert.equal(h.contents.get(file.path),draft.text);
 assert.equal(h.contents.get(draft.path),'Original');
 assert.equal(h.store.entries[0].text,draft.text);
});
test('recovery waits for loading and previews a matching base without applying changes',async()=>{
 const h=setup(),loading=gate();h.store.ready=loading.promise;h.store.status.phase='loading';
 const modal=h.api.writerV134OpenRecovery(h.plugin);
 assert.equal(modal.contentEl.find('writer-v134-recovery-detail').hidden,true);
 assert.match(modal.contentEl.find('writer-v134-recovery-status').text,/Loading/);
 loading.resolve();h.store.status.phase='saved';await modal.opened;await settle();
 assert.equal(modal.contentEl.find('writer-v134-recovery-draft').value,'Unsaved draft');
 assert.equal(modal.contentEl.find('writer-v134-recovery-comparison').dataset.state,'safe');
 assert.equal(modal.contentEl.find('writer-v134-recovery-current').value,'Original');
 assert.equal(h.contents.get('Book/Chapter.md'),'Original');assert.equal(h.created.length,0);
 modal.close();assert.equal(h.store.listeners.size,0);
});
test('a conflict remains read-only and saving a copy keeps the changed original and newer drafts',async()=>{
 const h=setup();h.contents.set('Book/Chapter.md','External revision');
 const modal=await h.open(),root=modal.contentEl;
 assert.equal(root.find('writer-v134-recovery-comparison').dataset.state,'conflict');
 assert.equal(root.find('writer-v134-recovery-current').value,'External revision');
 assert.equal(root.find('writer-v134-recovery-draft').getAttribute('readonly'),'');
 const started=gate(),release=gate();h.vault.beforeCreate=async()=>{started.resolve();await release.promise;};
 const save=root.find('writer-v134-recovery-save-copy');
 const pending=save.listeners.click();await started.promise;
 assert.equal(save.disabled,true);await save.listeners.click();
 h.store.entries[0].text='Newer live draft';h.store.entries[0].updatedAt='2026-11-09T12:01:00Z';h.store.emit();
 release.resolve();await pending;await settle();
 assert.equal(h.created.length,1);assert.equal(h.created[0].text,'Unsaved draft');
 assert.equal(h.contents.get('Book/Chapter.md'),'External revision');
 assert.equal(h.store.entries[0].text,'Newer live draft');
 assert.equal(root.find('writer-v134-recovery-draft').value,'Newer live draft');
 assert.equal(h.opened[0],h.created[0].file);assert.equal(save.disabled,false);
});
test('late original reads cannot replace another selected preview or update a closed modal',async()=>{
 const a=entry('Book/A.md','Draft A','Base A'),b=entry('Book/B.md','Draft B','Base B');
 const h=setup([a,b]),pending=gate(),reading=gate();
 h.vault.read=async file=>file.path===a.path?(reading.resolve(),pending.promise):'New B';
 const modal=await h.open(a.path);await reading.promise;
 const rows=modal.contentEl.find('writer-v134-recovery-list').children;
 rows.find(node=>node.dataset.path===b.path).listeners.click();await settle();
 assert.equal(modal.contentEl.find('writer-v134-recovery-draft').value,'Draft B');
 assert.equal(modal.contentEl.find('writer-v134-recovery-current').value,'New B');
 pending.resolve('Old A');await settle();
 assert.equal(modal.contentEl.find('writer-v134-recovery-current').value,'New B');
 const delayed=gate();h.vault.read=()=>delayed.promise;
 modal.contentEl.find('writer-v134-recovery-refresh').listeners.click();modal.close();
 delayed.resolve('Late data');await settle();assert.equal(modal.contentEl.children.length,0);
});
test('storage status updates preserve filter focus and the selected preview object',async()=>{
 const h=setup(),modal=await h.open(),root=modal.contentEl;
 const filter=root.find('writer-v134-recovery-filter'),preview=root.find('writer-v134-recovery-draft');
 filter.value='book';filter.focus();filter.listeners.input();
 const row=root.find('writer-v134-recovery-list').children[0];
 h.store.status.phase='pending';h.store.emit();h.store.status.phase='saved';h.store.emit();
 assert.equal(h.document.activeElement,filter);assert.equal(filter.value,'book');
 assert.equal(root.find('writer-v134-recovery-draft'),preview);
 assert.equal(root.find('writer-v134-recovery-list').children[0],row);
 filter.value='no match';filter.listeners.input();
 assert.equal(root.find('writer-v134-recovery-detail').hidden,true);
 assert.match(root.find('writer-v134-recovery-empty').text,/No drafts match/);
});
test('discard requires two clicks, rejects a stale snapshot and never changes the chapter',async()=>{
 const h=setup(),modal=await h.open(),button=modal.contentEl.find('writer-v134-recovery-discard');
 await button.listeners.click();assert.equal(h.store.discards.length,0);assert.equal(button.text,'Confirm discard');
 h.store.entries[0].text='Newer text without a UI notification';
 await button.listeners.click();assert.equal(h.store.entries.length,1);assert.equal(h.store.discards.length,0);
 assert.ok(h.notices.some(message=>message.includes('Draft changed')));
 assert.equal(modal.contentEl.find('writer-v134-recovery-draft').value,'Newer text without a UI notification');
 await button.listeners.click();await button.listeners.click();await settle();
 assert.equal(h.store.entries.length,0);assert.equal(h.store.discards.length,1);
 assert.equal(h.contents.get('Book/Chapter.md'),'Original');assert.equal(h.created.length,0);
 assert.equal(modal.contentEl.find('writer-v134-recovery-detail').hidden,true);
});
test('new draft input cancels discard confirmation before a newer version could be lost',async()=>{
 const h=setup(),modal=await h.open(),button=modal.contentEl.find('writer-v134-recovery-discard');
 await button.listeners.click();h.store.entries[0].text='New input';h.store.emit();
 assert.equal(button.text,'Discard draft');
 await button.listeners.click();assert.equal(h.store.discards.length,0);
});
test('missing notes keep export available while storage failures offer an explicit retry',async()=>{
 const h=setup();h.files.delete('Book/Chapter.md');
 h.store.status={phase:'error',error:'Recovery file is unreadable',count:1};
 const modal=await h.open(),root=modal.contentEl;
 assert.equal(root.find('writer-v134-recovery-comparison').dataset.state,'missing');
 assert.equal(root.find('writer-v134-recovery-open-original').disabled,true);
 assert.equal(root.find('writer-v134-recovery-save-copy').disabled,false);
 assert.match(root.find('writer-v134-recovery-status').text,/Recovery file is unreadable/);
 const retry=root.find('writer-v134-recovery-retry');assert.equal(retry.hidden,false);
 await retry.listeners.click();assert.equal(h.store.retries,1);assert.equal(retry.hidden,true);
 assert.equal(h.created.length,0);
});
test('copy failures keep the draft available and reenable its action without touching the source',async()=>{
 const h=setup(),modal=await h.open(),button=modal.contentEl.find('writer-v134-recovery-save-copy');
 h.vault.beforeCreate=()=>{throw Error('Permission denied');};
 await button.listeners.click();
 assert.equal(button.disabled,false);assert.equal(h.store.entries.length,1);
 assert.equal(h.contents.get('Book/Chapter.md'),'Original');assert.equal(h.created.length,0);
 assert.ok(h.notices.some(message=>message.includes('Permission denied')));
});
