'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class File{
 constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');}
}
class Element{
 constructor(tag,options={}){this.tag=tag;this.text=options.text||'';this.cls=options.cls||'';this.children=[];this.events={};this.isConnected=true;this.value='';this.hidden=false;}
 createEl(tag,options){const el=new Element(tag,options);this.children.push(el);return el;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 setText(value){this.text=value;}
 addEventListener(name,fn){this.events[name]=fn;}
 find(fn){if(fn(this))return this;for(const child of this.children){const found=child.find(fn);if(found)return found;}}
}
const source=fs.readFileSync('src/v13/draft-recovery.js','utf8')+'\n'+fs.readFileSync('src/v11/longform-studio.js','utf8');
function harness(){
 const disk=new Map(),notes=new Map(),timers=new Map(),notices=[],opened=[];let serial=0;
 const api=vm.runInNewContext(source+'\nwriterV11ReviewArea=()=>{};\n({writerV134Recovery,writerV11RenderLongformTab,writerV11StudioRegister})',{
  TFile:File,writerUi:(_pt,en)=>en,console,Date,JSON,Map,Set,Promise,
  setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
  Notice:class{constructor(message){notices.push(message);}},writerV134OpenRecovery:(plugin,path)=>opened.push(path||'all')
 });
 const adapter={exists:async path=>disk.has(path),read:async path=>{if(!disk.has(path))throw Error('Missing '+path);return disk.get(path);},
  write:async(path,text)=>{disk.set(path,text);},mkdir:async path=>disk.set(path,'')};
 const createPlugin=()=>{
  const events={},commands={},cleanups=[];
  const plugin={manifest:{id:'basic-ai-tool-for-writers',dir:'.obsidian/plugins/basic-ai-tool-for-writers'},settings:{},
   app:{workspace:{getLeavesOfType:()=>[]},vault:{adapter,configDir:'.obsidian',
    read:async file=>{if(!notes.has(file.path))throw Error('Missing note');return notes.get(file.path);},
    process:async(file,update)=>{notes.set(file.path,update(notes.get(file.path)));},
    on:(name,fn)=>{events[name]=fn;return {};}}},
   registerEvent(){},register:fn=>cleanups.push(fn),addCommand:command=>{commands[command.id]=command;},saveSettings:async()=>{}
  };
  api.writerV11StudioRegister(plugin);
  return {plugin,events,commands,cleanups};
 };
 const chapter=async(plugin,file)=>{
  const panel=new Element('div');api.writerV11RenderLongformTab({plugin},panel,{format:'single',title:'Chapter',file});
  const details=panel.find(el=>el.tag==='details');details.open=true;await details.events.toggle();
  return {panel,editor:panel.find(el=>el.tag==='textarea'),save:panel.find(el=>el.text==='Save scene'),
   status:panel.find(el=>el.tag==='small'&&['No changes','Unsaved draft recovered'].includes(el.text)),
   recovery:panel.find(el=>el.cls==='writer-v134-recovery-status')};
 };
 return {api,disk,notes,timers,notices,opened,createPlugin,chapter};
}
function gate(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}

test('Longform drafts survive a plugin restart and disappear from recovery only after an explicit scene save',async()=>{
 const h=harness(),file=new File('Book/Chapter.md');h.notes.set(file.path,'Original');
 const first=h.createPlugin(),view=await h.chapter(first.plugin,file);
 view.editor.value='Unsaved chapter';view.editor.events.input();
 assert.equal(h.notes.get(file.path),'Original');
 await first.plugin._writerV134Recovery.flush();
 assert.match(view.recovery.text,/recovery copy updated/i);
 await first.plugin._writerV134Recovery.close();
 const second=h.createPlugin(),restored=await h.chapter(second.plugin,file);
 assert.equal(restored.editor.value,'Unsaved chapter');
 assert.equal(restored.status.text,'Unsaved draft recovered');
 assert.equal(h.notes.get(file.path),'Original');
 await restored.save.events.click();await second.plugin._writerV134Recovery.flush();
 assert.equal(h.notes.get(file.path),'Unsaved chapter');
 assert.equal(second.plugin._writerV11Drafts.has(file.path),false);
 const third=h.createPlugin();await third.plugin._writerV134Recovery.ready;
 assert.equal(third.plugin._writerV134Recovery.list().length,0);
});

test('a changed original preserves the recovered draft and requires review before editing that scene',async()=>{
 const h=harness(),file=new File('Book/Chapter.md');h.notes.set(file.path,'Original');
 const first=h.createPlugin();await first.plugin._writerV134Recovery.ready;
 first.plugin._writerV134Recovery.capture(file.path,'Original','Old unsaved draft');
 await first.plugin._writerV134Recovery.flush();h.notes.set(file.path,'External revision');
 const second=h.createPlugin(),view=await h.chapter(second.plugin,file);
 assert.equal(view.editor.value,'External revision');assert.equal(view.editor.readOnly,true);assert.equal(view.save.disabled,true);
 view.editor.value='Programmatic change';view.editor.events.input();await view.save.events.click();
 assert.equal(second.plugin._writerV11Drafts.get(file.path).text,'Old unsaved draft');
 assert.equal(h.notes.get(file.path),'External revision');
 view.panel.find(el=>el.text==='Review recovered draft').events.click();assert.equal(h.opened.at(-1),file.path);
 view.editor.value='External revision';
 await second.plugin._writerV134Recovery.discard(second.plugin._writerV134Recovery.list()[0]);
 assert.equal(view.editor.readOnly,false);assert.equal(view.save.disabled,false);
 view.editor.value='New chapter revision';view.editor.events.input();await view.save.events.click();
 assert.equal(h.notes.get(file.path),'New chapter revision');
});

test('typing during a save persists the later text with the submitted revision as its new base',async()=>{
 const h=harness(),file=new File('Book/Chapter.md');h.notes.set(file.path,'Original');
 const first=h.createPlugin(),view=await h.chapter(first.plugin,file),started=gate(),release=gate();
 first.plugin.writerSnapshots={config:{enabled:true},create:async()=>{started.resolve();await release.promise;}};
 view.editor.value='Submitted';view.editor.events.input();
 const saving=view.save.events.click();await started.promise;
 view.editor.value='Submitted plus more';view.editor.events.input();release.resolve();await saving;
 await first.plugin._writerV134Recovery.flush();
 const next=h.createPlugin(),restored=await h.chapter(next.plugin,file);
 assert.equal(h.notes.get(file.path),'Submitted');assert.equal(restored.editor.value,'Submitted plus more');
 assert.equal(restored.editor.readOnly,false);
 assert.equal(next.plugin._writerV11Drafts.get(file.path).original,'Submitted');
});

test('folder renames preserve persistent draft paths and the recovery command opens the center',async()=>{
 const h=harness(),file=new File('Book/Chapter.md');h.notes.set(file.path,'Original');
 const first=h.createPlugin();await first.plugin._writerV134Recovery.ready;
 first.plugin._writerV134Recovery.capture(file.path,'Original','Renamed draft');
 first.events.rename({path:'Renamed',children:[]},'Book');
 await first.plugin._writerV134Recovery.flush();
 h.notes.delete(file.path);file.path='Renamed/Chapter.md';h.notes.set(file.path,'Original');
 const next=h.createPlugin(),restored=await h.chapter(next.plugin,file);
 assert.equal(restored.editor.value,'Renamed draft');
 assert.equal(next.plugin._writerV11Drafts.has('Book/Chapter.md'),false);
 next.commands['v134-longform-recovery'].callback();assert.equal(h.opened.at(-1),'all');
});

test('two Longform panes with the same original share the latest draft instead of replacing each other',async()=>{
 const h=harness(),file=new File('Book/Chapter.md');h.notes.set(file.path,'Original');
 const state=h.createPlugin(),first=await h.chapter(state.plugin,file),second=await h.chapter(state.plugin,file);
 first.editor.value='Draft from first';first.editor.events.input();
 assert.equal(second.editor.value,'Draft from first');
 second.editor.value+=' and second';second.editor.events.input();
 assert.equal(first.editor.value,'Draft from first and second');
 await state.plugin._writerV134Recovery.flush();
 const restarted=h.createPlugin(),restored=await h.chapter(restarted.plugin,file);
 assert.equal(restored.editor.value,'Draft from first and second');
 assert.equal(h.notes.get(file.path),'Original');
});
