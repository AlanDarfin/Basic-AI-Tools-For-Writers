'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function harness(){
 const spoken=[],notices=[],menus=[];
 class MarkdownView{}
 const api=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/v12/mobile-ux-1201.js'),'utf8')+
  '\n({writerV1201Editor,writerV1201Read,writerV1201Format,writerV1201QuickMenu})',{
  MarkdownView,writerUi:(_pt,en)=>en,writerModuleOn:()=>true,
  writerV12SelectedText:()=>'',writerV107SpeechConfig:()=>{},
  writerV107SpeechStart:(_plugin,text)=>spoken.push(text),Notice:class{constructor(text){notices.push(text);}},
  Menu:class{
   constructor(){this.items=[];menus.push(this);}
   addItem(configure){const item={setTitle(title){this.title=title;return this;},setIcon(){return this;},onClick(callback){this.callback=callback;return this;}};configure(item);this.items.push(item);}
   showAtPosition(){}
  }
 });
 const file={path:'Chapter.md',extension:'md'};
 const workspace={getActiveFile:()=>file,getActiveViewOfType:()=>null};
 const plugin={settings:{},app:{workspace,vault:{cachedRead:()=>{throw Error('Unexpected disk read');}}}};
 return {api,plugin,workspace,file,spoken,notices,menus};
}
test('mobile read-aloud uses the current unsaved editor buffer',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'',getValue:()=>'# New draft\nUnsaved words'}};
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['New draft\nUnsaved words']);
});
test('mobile selection takes precedence over the whole editor buffer',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'Selected passage',getValue:()=>{throw Error('Unexpected whole-note read');}}};
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Selected passage']);
});
test('switching between Markdown panes cannot reuse the previous pane editor',()=>{
 const h=harness(),old={path:'Old.md',extension:'md'};
 const current={getSelection:()=>'',getValue:()=>'Current draft'};
 h.workspace.activeEditor={file:old,editor:{getSelection:()=>'Stale selection'}};
 h.workspace.activeLeaf={view:{file:h.file,editor:current,getViewType:()=>'markdown'}};
 assert.equal(h.api.writerV1201Editor(h.plugin),current);
 h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Current draft']);
});
test('formatting a PDF tab does not change a stale Markdown editor',()=>{
 const h=harness();
 h.workspace.activeEditor={file:h.file,editor:{getSelection:()=>'Stale selection'}};
 h.workspace.getActiveFile=()=>({path:'Reference.pdf',extension:'pdf'});
 assert.equal(h.api.writerV1201Editor(h.plugin),null);
 h.api.writerV1201Format(h.plugin);
 assert.deepEqual(h.notices,['Open a note in editing mode to format.']);
});
test('a delayed preview read is discarded when the current note changes',async()=>{
 const h=harness();let finish;
 h.plugin.app.vault.cachedRead=()=>new Promise(resolve=>{finish=resolve;});
 const reading=h.api.writerV1201Read(h.plugin);
 h.workspace.getActiveFile=()=>({path:'Other.md',extension:'md'});
 finish('Old preview');await reading;
 assert.deepEqual(h.spoken,[]);
});
test('reading view still reads the selected note and reports disk errors',async()=>{
 const h=harness();
 h.plugin.app.vault.cachedRead=async()=> 'Preview text';
 await h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.spoken,['Preview text']);
 h.plugin.app.vault.cachedRead=async()=>{throw Error('Read failed');};
 await h.api.writerV1201Read(h.plugin);
 assert.deepEqual(h.notices,['Read failed']);
});
test('Basic quick actions expose the existing Space chooser when registered',()=>{
 const h=harness();let opened=0;
 h.plugin.writerV133SpacesChoose=()=>{opened++;};
 h.api.writerV1201QuickMenu(h.plugin);
 const action=h.menus[0].items.find(item=>item.title==='Choose Space');
 assert.ok(action);action.callback();assert.equal(opened,1);
 delete h.plugin.writerV133SpacesChoose;
 h.api.writerV1201QuickMenu(h.plugin);
 assert.equal(h.menus[1].items.some(item=>item.title==='Choose Space'),false);
});
