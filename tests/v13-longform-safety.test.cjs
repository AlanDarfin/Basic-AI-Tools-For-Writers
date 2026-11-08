'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v11/longform-studio.js','utf8');
class File{
 constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');}
}
class Element{
 constructor(tag,options={}){
  this.tag=tag;this.text=options.text||'';this.cls=options.cls||'';
  this.children=[];this.events={};this.isConnected=true;this.value='';
 }
 createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 setText(value){this.text=value;}
 addEventListener(name,callback){this.events[name]=callback;}
 find(predicate){if(predicate(this))return this;for(const child of this.children){const found=child.find(predicate);if(found)return found;}}
}
function load(keys,extras={}){
 return vm.runInNewContext(source+'\nwriterV11ReviewArea=()=>{};\n({'+keys.join(',')+'})',{
  console,TFile:File,writerUi:(_pt,en)=>en,Notice:class{},...extras
 });
}
function gate(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}
async function chapter(api,plugin,file){
 const panel=new Element('div');
 api.writerV11RenderLongformTab({plugin},panel,{format:'single',title:'Chapter',file});
 const section=panel.find(el=>el.tag==='details');section.open=true;
 await section.events.toggle();
 return {
  editor:panel.find(el=>el.tag==='textarea'),
  save:panel.find(el=>el.tag==='button'&&el.text==='Save scene'),
  status:panel.find(el=>el.tag==='small'&&el.text==='No changes'||el.tag==='small'&&el.text==='Unsaved draft recovered')
 };
}
test('Longform preserves edits typed while an earlier revision is being saved and recovers them on rerender',async()=>{
 let current='Original';
 const saving=gate(),release=gate(),notices=[];
 const file=new File('Book/Chapter.md');
 const api=load(['writerV11RenderLongformTab'],{Notice:class{constructor(message){notices.push(message);}}});
 const plugin={settings:{},app:{workspace:{getLeavesOfType:()=>[]},vault:{
  read:async()=>current,process:async(_file,update)=>{current=update(current);}
 }},writerSnapshots:{config:{enabled:true},create:async()=>{saving.resolve();await release.promise;}}};
 const first=await chapter(api,plugin,file);
 first.editor.value='Submitted revision';first.editor.events.input();
 const pending=first.save.events.click();
 await saving.promise;
 first.editor.value='Submitted revision plus newer typing';first.editor.events.input();
 release.resolve();await pending;
 assert.equal(current,'Submitted revision');
 assert.equal(first.editor.value,'Submitted revision plus newer typing');
 assert.equal(first.status.text,'Unsaved changes');
 assert.equal(first.save.disabled,false);
 assert.deepEqual(JSON.parse(JSON.stringify(plugin._writerV11Drafts.get(file.path))),{
  original:'Submitted revision',text:'Submitted revision plus newer typing'
 });
 assert.match(notices.at(-1),/Newer edits remain/);
 const recovered=await chapter(api,plugin,file);
 assert.equal(recovered.editor.value,'Submitted revision plus newer typing');
 assert.equal(recovered.status.text,'Unsaved draft recovered');
 await recovered.save.events.click();
 assert.equal(current,'Submitted revision plus newer typing');
 assert.equal(plugin._writerV11Drafts.has(file.path),false);
 assert.equal(recovered.status.text,'Saved');
});
test('Longform keeps the unsaved draft when the original changes during snapshot creation',async()=>{
 let current='Original';
 const file=new File('Book/Chapter.md');
 const api=load(['writerV11RenderLongformTab']);
 const plugin={settings:{},app:{workspace:{getLeavesOfType:()=>[]},vault:{
  read:async()=>current,process:async(_file,update)=>{current=update(current);}
 }},writerSnapshots:{config:{enabled:true},create:async()=>{current='Other pane revision';}}};
 const view=await chapter(api,plugin,file);
 view.editor.value='My unsaved revision';view.editor.events.input();
 await view.save.events.click();
 assert.equal(current,'Other pane revision');
 assert.equal(plugin._writerV11Drafts.get(file.path).text,'My unsaved revision');
 assert.match(view.status.text,/Concurrent edit/);
 assert.equal(view.save.disabled,false);
});
function registered(notes,drafts){
 let onRename,saves=0;
 const api=load(['writerV11StudioRegister']);
 const plugin={settings:{v11Studio:{reviewNotes:notes}},_writerV11Drafts:new Map(drafts),
  app:{vault:{on:(_event,callback)=>{onRename=callback;return {};}}},
  registerEvent(){},addCommand(){},saveSettings:async()=>{saves++;}
 };
 api.writerV11StudioRegister(plugin);
 return {plugin,onRename,saves:()=>saves};
}
test('Renaming a Longform folder moves nested comments and drafts without touching similarly named folders',()=>{
 const comment=[{text:'Keep the voice',at:'2026-01-01'}];
 const draft={original:'before',text:'after'};
 const state=registered({'Book/Chapter.md':comment,'Book/Part/Scene.md':comment,'Bookcase/Scene.md':comment},[
  ['Book/Chapter.md',draft],['Book/Part/Scene.md',draft],['Bookcase/Scene.md',draft]
 ]);
 state.onRename({path:'Library/Renamed',children:[]},'Book');
 const notes=state.plugin.settings.v11Studio.reviewNotes;
 assert.equal(notes['Library/Renamed/Chapter.md'],comment);
 assert.equal(notes['Library/Renamed/Part/Scene.md'],comment);
 assert.equal(notes['Book/Chapter.md'],undefined);
 assert.equal(notes['Book/Part/Scene.md'],undefined);
 assert.equal(notes['Bookcase/Scene.md'],comment);
 assert.equal(state.plugin._writerV11Drafts.get('Library/Renamed/Part/Scene.md'),draft);
 assert.equal(state.plugin._writerV11Drafts.has('Book/Part/Scene.md'),false);
 assert.equal(state.plugin._writerV11Drafts.get('Bookcase/Scene.md'),draft);
 assert.equal(state.saves(),1);
 // Obsidian may also emit a child rename event after the folder event.
 state.onRename(new File('Library/Renamed/Chapter.md'),'Book/Chapter.md');
 assert.equal(notes['Library/Renamed/Chapter.md'],comment);
 assert.equal(state.saves(),1);
});
test('Renaming a chapter preserves direct-note recovery and never overwrites an existing recovery entry',()=>{
 const original=[{text:'Source note'}],existing=[{text:'Destination note'}];
 const draft={original:'source',text:'source draft'},other={original:'other',text:'other draft'};
 const state=registered({'Book/Chapter.md':original},[['Book/Chapter.md',draft]]);
 state.onRename(new File('Book/Final.md'),'Book/Chapter.md');
 assert.equal(state.plugin.settings.v11Studio.reviewNotes['Book/Final.md'],original);
 assert.equal(state.plugin._writerV11Drafts.get('Book/Final.md'),draft);
 const collision=registered({'Book/Chapter.md':original,'Archive/Chapter.md':existing},[
  ['Book/Chapter.md',draft],['Archive/Chapter.md',other]
 ]);
 collision.onRename({path:'Archive',children:[]},'Book');
 assert.equal(collision.plugin.settings.v11Studio.reviewNotes['Archive/Chapter.md'],existing);
 assert.equal(collision.plugin.settings.v11Studio.reviewNotes['Book/Chapter.md'],original);
 assert.equal(collision.plugin._writerV11Drafts.get('Archive/Chapter.md'),other);
 assert.equal(collision.plugin._writerV11Drafts.get('Book/Chapter.md'),draft);
 assert.equal(collision.saves(),0);
});
