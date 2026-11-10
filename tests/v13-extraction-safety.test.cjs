'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v12/unified-toolkit.js','utf8')+'\n'+fs.readFileSync('src/v12/selection-reader.js','utf8');

function fixture(text='Before passage after',start=7,end=14){
 const files=new Map(),folders=new Set(),created=[],opened=[],replacements=[],notices=[],hooks={};
 let modal,action,editorText=text,anchor=start,head=end;
 class Element{
  constructor(tag){this.tag=tag;this.value=tag==='input'?'Extracted chapter':'';this.text='';this.children=[];}
  createEl(tag,options={}){const child=new Element(tag);child.text=options.text||'';this.children.push(child);return child;}
  setText(value){this.text=value;}
 }
 class Modal{
  constructor(){this.contentEl=new Element('root');this.closed=false;modal=this;}
  setTitle(){}open(){}close(){this.closed=true;}
 }
 class Setting{
  addButton(callback){
   const button={disabled:false,setButtonText(){return this;},setCta(){return this;},
    setDisabled(value){this.disabled=value;return this;},onClick(callback){action=callback;return this;}};
   callback(button);return this;
  }
 }
 const sourceFile={path:'Book/Source.md',extension:'md',stat:{mtime:1,size:text.length}};
 files.set(sourceFile.path,{file:sourceFile,content:text});
 const position=offset=>{const lines=editorText.slice(0,offset).split('\n');return {line:lines.length-1,ch:lines.at(-1).length};};
 const editor={
  getValue:()=>editorText,
  getSelection:()=>editorText.slice(Math.min(anchor,head),Math.max(anchor,head)),
  listSelections:()=>[{anchor:position(anchor),head:position(head)}],
  replaceSelection(value){
   const from=Math.min(anchor,head),to=Math.max(anchor,head);
   editorText=editorText.slice(0,from)+value+editorText.slice(to);
   files.get(view.file.path).content=editorText;replacements.push({file:view.file,value,text:editorText});
  }
 };
 const view={file:sourceFile,editor,getMode:()=> 'source'},leaves=[{view}];
 const vault={
  getAbstractFileByPath:path=>files.get(path)?.file||(folders.has(path)?{path}:null),
  createFolder:async path=>{folders.add(path);},
  create:async(path,content)=>{
   await hooks.beforeCreate?.(path,content);
   if(files.has(path))throw Error('File already exists');
   const file={path,extension:'md',stat:{mtime:1,size:content.length}};files.set(path,{file,content});created.push(file);
   await hooks.afterCreate?.(file);return file;
  },
  read:async file=>{
   await hooks.beforeRead?.(file);
   const value=files.get(file.path)?.content;
   if(value===undefined)throw Error('File not found');
   await hooks.afterRead?.(file);return value;
  }
 };
 const workspace={getLeavesOfType:()=>leaves,getLeaf:()=>({openFile:async file=>{
  opened.push({file,sourceText:files.get(sourceFile.path)?.content});
  await hooks.beforeOpen?.(file);
  view.file=file;editorText=files.get(file.path).content;
 }})};
 const plugin={app:{vault,workspace}};
 const api=vm.runInNewContext(source+'\nwriterV12On=()=>true;({writerV12CreateNote,writerV12MoveSelection,writerV12ReaderRegister})',{
  Modal,Setting,writerUi:(pt,en)=>en,Notice:class{constructor(text){notices.push(text);}},console
 });
 return {api,plugin,editor,view,sourceFile,files,created,opened,replacements,notices,hooks,leaves,
  start(){api.writerV12MoveSelection(plugin,editor,view);},
  click(){return action();},
  get modal(){return modal;},
  get feedback(){return modal.contentEl.children.at(-1).text;},
  get sourceText(){return files.get(sourceFile.path)?.content;},
  changeFile(file,content){const entry=files.get(file.path);entry.content=content;file.stat.mtime++;file.stat.size=content.length;},
  set editorText(value){editorText=value;},
  select(from,to){anchor=from;head=to;}
 };
}
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};}

test('extraction preserves all selected characters around the former 100K boundary',async()=>{
 for(const length of [99999,100000,100001,250000]){
  const passage=' \t\r\n'+ 'á日本語🙂'.repeat(Math.ceil(length/6)).slice(0,length-10)+'\r\n \t  ';
  assert.equal(passage.length,length);
  const h=fixture('Prefix\n'+passage+'\nSuffix',7,7+passage.length);h.start();await h.click();
  assert.equal(h.created.length,1);
  assert.equal(h.files.get(h.created[0].path).content,passage);
  assert.equal(h.sourceText,'Prefix\n[['+h.created[0].path.replace(/\.md$/,'')+']]\nSuffix');
  assert.equal(h.replacements.length,1);
  assert.equal(h.opened.length,1);
  assert.equal(h.opened[0].sourceText,h.sourceText,'The source is replaced before reusing its pane');
 }
});

test('local note creation preserves complete content and still opens captures by default',async()=>{
 const h=fixture(),body=' '+ 'x'.repeat(100001)+'\n';
 const file=await h.api.writerV12CreateNote(h.plugin,'Inbox','Capture',body);
 assert.equal(h.files.get(file.path).content,body);
 assert.equal(h.opened[0].file,file);
});

test('source edits made while creating or verifying the copy keep the original passage',async()=>{
 for(const stage of ['afterCreate','beforeRead','afterRead']){
  const h=fixture();h.hooks[stage]=()=>{h.editorText='New prose '+h.sourceText;};
  h.start();await h.click();
  assert.equal(h.created.length,1);assert.equal(h.replacements.length,0);assert.equal(h.opened.length,0);
  assert.equal(h.files.get(h.created[0].path).content,'passage');
  assert.match(h.feedback,/original changed/);
 }
});

test('an external source change during verification keeps the editor passage intact',async()=>{
 const h=fixture();h.hooks.afterRead=()=>h.changeFile(h.sourceFile,'External revision');
 h.start();await h.click();assert.equal(h.replacements.length,0);
 assert.equal(h.editor.getSelection(),'passage');assert.equal(h.sourceText,'External revision');
 assert.match(h.feedback,/original changed/);
});

test('moving the selection to identical prose or reversing its direction cancels replacement',async()=>{
 for(const [from,to] of [[8,15],[7,0]]){
  const h=fixture('passage passage',0,7);h.hooks.afterCreate=()=>h.select(from,to);
  h.start();await h.click();
  assert.equal(h.replacements.length,0);assert.equal(h.sourceText,'passage passage');
  assert.match(h.feedback,/original changed/);
 }
});

test('source pane reuse, removal, rename and file replacement cannot redirect extraction',async()=>{
 const changes=[
  h=>{h.view.file={path:'Other.md',extension:'md'};},
  h=>{h.leaves.length=0;},
  h=>{const stored=h.files.get(h.sourceFile.path);h.files.delete(h.sourceFile.path);h.sourceFile.path='Renamed.md';h.files.set(h.sourceFile.path,stored);},
  h=>{h.files.set(h.sourceFile.path,{file:{...h.sourceFile},content:h.sourceText});},
  h=>{h.view.editor={...h.editor};}
 ];
 for(const change of changes){
  const h=fixture();h.hooks.afterCreate=()=>change(h);h.start();await h.click();
  assert.equal(h.replacements.length,0);assert.equal(h.opened.length,0);assert.match(h.feedback,/original changed/);
 }
});

test('incomplete, changed, renamed, deleted and replaced destination copies preserve the source',async()=>{
 const changes=[
  (h,file)=>{h.changeFile(file,'passag');},
  (h,file)=>{h.changeFile(file,'changed');},
  (h,file)=>{const entry=h.files.get(file.path);h.files.delete(file.path);file.path='Renamed copy.md';h.files.set(file.path,entry);},
  (h,file)=>{h.files.delete(file.path);},
  (h,file)=>{h.files.set(file.path,{file:{...file},content:'passage'});},
  (h,file)=>{h.leaves.push({view:{file,editor:{getValue:()=> 'Unsaved destination changes'},getMode:()=> 'source'}});}
 ];
 for(const change of changes){
  const h=fixture();h.hooks.afterRead=file=>change(h,file);h.start();await h.click();
  assert.equal(h.replacements.length,0);assert.equal(h.sourceText,'Before passage after');
  assert.equal(h.opened.length,0);assert.match(h.feedback,/destination copy changed/);
 }
});

test('the fresh destination read must match every character even when file metadata matches',async()=>{
 const h=fixture();h.hooks.beforeRead=file=>{h.files.get(file.path).content='passAge';};
 h.start();await h.click();assert.equal(h.replacements.length,0);
 assert.equal(h.sourceText,'Before passage after');assert.match(h.feedback,/destination copy changed/);
});

test('creation and verification failures leave the source untouched',async()=>{
 for(const stage of ['beforeCreate','beforeRead']){
  const h=fixture();h.hooks[stage]=()=>{throw Error('Storage unavailable');};h.start();await h.click();
  assert.equal(h.replacements.length,0);assert.equal(h.sourceText,'Before passage after');
  assert.equal(h.opened.length,0);assert.equal(h.feedback,'Storage unavailable');
  assert.equal(h.created.length,stage==='beforeCreate'?0:1);
 }
});

test('a second click while storage is busy creates one verified note and one replacement',async()=>{
 const h=fixture(),started=deferred(),resume=deferred();
 h.hooks.beforeCreate=async()=>{started.resolve();await resume.promise;};h.start();
 const first=h.click();await started.promise;await h.click();resume.resolve();await first;
 assert.equal(h.created.length,1);assert.equal(h.replacements.length,1);assert.equal(h.opened.length,1);
});

test('an opening failure after successful extraction reports success without deleting the copy',async()=>{
 const h=fixture();h.hooks.beforeOpen=()=>{throw Error('Pane unavailable');};h.start();await h.click();
 assert.equal(h.created.length,1);assert.equal(h.replacements.length,1);assert.equal(h.modal.closed,true);
 assert.equal(h.files.get(h.created[0].path).content,'passage');
 assert.match(h.notices[0],/Passage extracted; could not open the new note: Pane unavailable/);
});

test('multiple selected ranges are rejected before creating a note',()=>{
 const h=fixture();h.editor.listSelections=()=>[
  {anchor:{line:0,ch:0},head:{line:0,ch:7}},{anchor:{line:0,ch:8},head:{line:0,ch:15}}
 ];h.start();assert.equal(h.created.length,0);assert.equal(h.modal,undefined);assert.match(h.notices[0],/Select one passage/);
});
