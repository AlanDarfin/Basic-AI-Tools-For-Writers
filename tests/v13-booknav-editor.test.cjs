'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v6/longform-navigation.js','utf8');
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').pop().replace(/\.md$/,'');}}
class Doc{constructor(text){this.text=text;this.length=text.length;}toString(){return this.text;}}
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.text=options.text||'';this.cls=options.cls||'';this.children=[];this.attributes=options.attr||{};this.events={};}
 createEl(tag,options={}){const child=new Element(tag,options);child.parent=this;this.children.push(child);return child;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 setAttribute(key,value){this.attributes[key]=value;}
 addEventListener(name,callback){this.events[name]=callback;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
 find(predicate){if(predicate(this))return this;for(const child of this.children){const found=child.find(predicate);if(found)return found;}}
}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function settle(){for(let i=0;i<8;i++)await Promise.resolve();}
function harness(options={}){
 const fields=[],viewPlugins=[],providers=[],extensions=[],requests=[],cleanups=[],opened=[],writes=[],warnings=[];
 const timers=new Map(),events=new Map(),leaves=[],modules={bookNavigation:true,virtualContent:true};let timerSerial=0;
 const StateEffect={define:()=>{const effect={of:value=>({value,is:other=>other===effect})};return effect;}};
 const StateField={define:spec=>{const field={kind:'field',spec};fields.push(field);return field;}};
 const Decoration={none:{ranges:[]},set:ranges=>({ranges}),widget:spec=>({range:at=>({from:at,to:at,value:{spec}})})};
 const EditorView={decorations:{from:(field,read)=>{const provider={field,read};providers.push(provider);return provider;}}};
 const ViewPlugin={fromClass:(type,spec)=>{const extension={kind:'lookup',type,spec};viewPlugins.push(extension);return extension;}};
 const index=new TFile('Book/Index.md'),files=new Map();
 const items=[['A',0],['A.1',1],['B',0]].map(([title,indent])=>{
  const file=new TFile('Book/'+title+'.md');files.set(file.path,file);return {title,indent,path:file.path,file};
 });
 const match={index:{file:index},items};
 const on=scope=>(name,callback)=>{events.set(scope+':'+name,callback);return {};};
 const plugin={settings:{bookNavigation:{enabled:true,showMain:true,showSub:true,auto:false},
  v912Virtual:{enabled:true,autoBookNav:true},lastLongformProject:index.path,projectsData:{}},
  app:{workspace:{getLeavesOfType:()=>leaves,on:on('workspace'),getLeaf:()=>({openFile:async file=>opened.push(file.path)})},
   vault:{getAbstractFileByPath:path=>files.get(path)||null,cachedRead:async()=>options.text||'Chapter prose',on:on('vault'),
    modify:async(...args)=>writes.push(args),process:async(...args)=>writes.push(args)},metadataCache:{on:on('metadata')}},
  registerEditorExtension:extension=>extensions.push(extension),registerEvent(){},register:cleanup=>cleanups.push(cleanup)};
 const api=vm.runInNewContext(source+'\nwriterBookNavFindProjectAsync=lookup;\n({WriterBookNavigation,WriterBookNavWidget})',{
  TFile,Decoration,ViewPlugin,WriterV6WidgetType:class{},writerUi:(_pt,en)=>en,
  writerModuleOn:(_plugin,key)=>modules[key]!==false,Notice:class{},
  lookup:(_app,path,selected)=>{const pending=deferred();requests.push({path,selected,...pending});return pending.promise;},
  require:name=>name==='@codemirror/state'?{StateEffect,StateField}:name==='@codemirror/view'?{EditorView}:null,
  setTimeout:callback=>{const id=++timerSerial;timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id),
  console:{warn:(...args)=>warnings.push(args)}
 });
 const owner=new api.WriterBookNavigation(plugin);owner.registerAutomatic();
 const field=fields[0],lookup=viewPlugins[0];
 if(field)field.spec.provide(field);
 let fieldValue=field?.spec.create(),inUpdate=false,synchronousDispatches=0,dispatches=0;
 const cm={state:{doc:new Doc(options.text||'Chapter prose')},dom:{ownerDocument:{createElement:tag=>new Element(tag)}},
  dispatch(spec){
   if(inUpdate){synchronousDispatches++;throw Error('Cannot dispatch while updating a CodeMirror view');}
   dispatches++;
   const before=this.state.doc,change=spec.changes;
   const next=change?new Doc(before.text.slice(0,change.from)+change.insert+before.text.slice(change.to)):before;
   const effects=Array.isArray(spec.effects)?spec.effects:spec.effects?[spec.effects]:[];
   const transaction={effects,newDoc:next,docChanged:next!==before};
   if(field)fieldValue=field.spec.update(fieldValue,transaction);
   this.state={doc:next};
   inUpdate=true;
   try{
    instance.update({view:this,state:this.state,docChanged:transaction.docChanged,transactions:[transaction]});
    // Mirror the CM6 contract that rejected the old ViewPlugin block provider.
    const indirect=lookup.spec?.decorations?.(instance);
    if(indirect?.ranges?.some(range=>range.value.spec.block))throw Error('Block decorations may not be specified via plugins');
   }finally{inUpdate=false;}
  }};
 const leaf={view:{file:files.get('Book/A.md'),editor:{cm,getValue:()=>cm.state.doc.toString()}}};leaves.push(leaf);
 const previewRoots=[];
 if(options.previews){
  leaves.push({view:{file:files.get('Book/B.md'),editor:{getValue:()=> 'B prose'}}});
  for(const pane of leaves){
   const root=new Element();root.isConnected=true;
   root.querySelectorAll=()=>root.children.filter(child=>child.cls==='writer-v6-booknav-preview-auto');
   pane.view.previewMode={containerEl:{querySelector:()=>root,querySelectorAll:()=>root.querySelectorAll()}};
   previewRoots.push(root);
  }
 }
 const instance=new lookup.type(cm);
 const decorations=()=>field?providers[0].read(fieldValue):Decoration.none;
 const edit=(from,to,insert)=>cm.dispatch({changes:{from,to,insert}});
 const replace=text=>edit(0,cm.state.doc.length,text);
 const resolve=async(number=requests.length-1,result=match)=>{requests[number].resolve(result);await settle();};
 return {api,owner,plugin,modules,match,files,items,index,cm,leaf,instance,field,lookup,providers,extensions,requests,
  cleanups,timers,events,opened,writes,warnings,previewRoots,decorations,edit,replace,resolve,
  get value(){return fieldValue;},get synchronousDispatches(){return synchronousDispatches;},get dispatches(){return dispatches;}};
}
function footer(h){const ranges=h.decorations().ranges;assert.equal(ranges.length,1);return ranges[0];}

test('automatic navigation supplies block widgets from a StateField while virtual auto navigation is active',async()=>{
 const h=harness();assert.equal(h.plugin.settings.bookNavigation.auto,false);
 assert.ok(h.field,'automatic footer has a state field');assert.equal(h.lookup.spec?.decorations,undefined);
 assert.equal(h.providers[0].field,h.field);assert.equal(h.decorations().ranges.length,0);
 await h.resolve();const range=footer(h);
 assert.equal(range.value.spec.block,true);assert.equal(range.value.spec.side,1);
 assert.equal(range.from,h.cm.state.doc.length);assert.equal(h.value.data.path,'Book/A.md');
 const root=range.value.spec.widget.toDOM(h.cm);
 const next=root.find(element=>element.tag==='button'&&element.attributes['aria-label']==='Next chapter: B');
 assert.ok(next);await next.events.click();assert.deepEqual(h.opened,['Book/B.md']);
 assert.equal(h.cm.state.doc.toString(),'Chapter prose');assert.deepEqual(h.writes,[]);
});

test('typing and deleting keep the block at the current document end without synchronous dispatch',async()=>{
 const h=harness();await h.resolve();
 h.edit(0,0,'Start\n');assert.equal(footer(h).from,h.cm.state.doc.length);
 h.edit(h.cm.state.doc.length,h.cm.state.doc.length,'\nEnd');assert.equal(footer(h).from,h.cm.state.doc.length);
 h.edit(0,h.cm.state.doc.length,'');assert.equal(footer(h).from,0);
 await h.resolve();assert.equal(footer(h).from,0);
 assert.equal(h.synchronousDispatches,0);assert.deepEqual(h.writes,[]);
});

test('async lookups cannot revive a footer after a source block is added, including same-length edits',async()=>{
 const sourceBlock='~~~longform-nav\nmode: manual\n~~~';
 const h=harness({text:'x'.repeat(sourceBlock.length)});
 h.replace(sourceBlock);assert.equal(h.decorations().ranges.length,0);
 await h.resolve(0);assert.equal(h.decorations().ranges.length,0);
 assert.equal(h.requests.length,1);assert.equal(h.cm.state.doc.toString(),sourceBlock);
 h.replace('Prose again');await h.resolve();assert.equal(footer(h).from,'Prose again'.length);
 assert.equal(h.synchronousDispatches,0);assert.deepEqual(h.writes,[]);
});

test('manual fences clear an existing automatic footer immediately and removing them restores navigation',async()=>{
 const h=harness();await h.resolve();footer(h);
 const sourceBlock='Before\n```longform-nav\nmode: manual\n```\nAfter';
 h.replace(sourceBlock);assert.equal(h.decorations().ranges.length,0);await settle();
 assert.equal(h.decorations().ranges.length,0);assert.equal(h.cm.state.doc.toString(),sourceBlock);
 h.replace('After');await h.resolve();footer(h);
});

test('a file switch clears old buttons and ignores the earlier path lookup',async()=>{
 const h=harness();await h.resolve();footer(h);
 h.edit(0,0,'New ');const stale=h.requests.length-1;
 h.leaf.view.file=h.files.get('Book/B.md');h.replace('B prose');
 assert.equal(h.decorations().ranges.length,0);assert.equal(h.requests.at(-1).path,'Book/B.md');
 await h.resolve(stale);assert.equal(h.decorations().ranges.length,0);
 await h.resolve();assert.equal(h.value.data.path,'Book/B.md');footer(h);
 assert.equal(h.synchronousDispatches,0);
});

test('only the latest document lookup may update the footer, even when prose lengths match',async()=>{
 const h=harness({text:'first'});h.replace('other');const recent=h.requests.length-1;
 await h.resolve(recent);const current=h.value;
 await h.resolve(0,null);assert.equal(h.value,current);footer(h);
});

test('disabling navigation or its module clears buttons and blocks late async results',async()=>{
 for(const module of [false,true]){
  const h=harness();await h.resolve();footer(h);h.edit(0,0,'New ');const pending=h.requests.length-1;
  if(module)h.modules.bookNavigation=false;else h.plugin.settings.bookNavigation.enabled=false;
  h.owner.refreshAutomatic();assert.equal(h.decorations().ranges.length,0);
  await h.resolve(pending);assert.equal(h.decorations().ranges.length,0);
  h.modules.bookNavigation=true;h.plugin.settings.bookNavigation.enabled=true;
  h.owner.refreshAutomatic();await h.resolve();footer(h);
 }
});

test('project, virtual-content and main/subchapter preferences still control automatic buttons',async()=>{
 const h=harness();await h.resolve();
 h.plugin.settings.bookNavigation.showMain=false;h.owner.refreshAutomatic();await h.resolve();
 assert.deepEqual(Array.from(h.value.data.buttons,button=>button.kind),['sub']);
 h.plugin.settings.v912Virtual.autoBookNav=false;h.owner.refreshAutomatic();await h.resolve();
 assert.equal(h.decorations().ranges.length,0);
 h.plugin.settings.projectsData[h.index.path]={writingSettings:{navigation:'on'}};
 h.owner.refreshAutomatic();await h.resolve();footer(h);
 h.plugin.settings.projectsData[h.index.path].writingSettings.navigation='off';
 h.owner.refreshAutomatic();await h.resolve();assert.equal(h.decorations().ranges.length,0);
});

test('destroyed views ignore pending results and unload clears widgets, timers and future refreshes',async()=>{
 const destroyed=harness();destroyed.instance.destroy();const before=destroyed.dispatches;
 await destroyed.resolve();assert.equal(destroyed.dispatches,before);assert.equal(destroyed.decorations().ranges.length,0);
 const h=harness();await h.resolve();footer(h);h.edit(0,0,'New ');const pending=h.requests.length-1;
 h.events.get('workspace:file-open')();assert.ok(h.timers.size>0);
 for(const cleanup of h.cleanups)cleanup();assert.equal(h.timers.size,0);assert.equal(h.decorations().ranges.length,0);
 const after=h.dispatches;await h.resolve(pending);h.owner.refreshAutomatic();h.events.get('workspace:file-open')();
 await settle();assert.equal(h.dispatches,after);assert.equal(h.timers.size,0);assert.equal(h.decorations().ranges.length,0);
 assert.deepEqual(h.writes,[]);
});

test('an older preview refresh cannot remove a newer footer in another reading pane',async()=>{
 const h=harness({previews:true});await h.resolve();
 h.owner.refreshAutomatic();const older=h.requests.length-1;
 h.owner.refreshAutomatic();await h.resolve();await h.resolve();
 assert.deepEqual(h.previewRoots.map(root=>root.querySelectorAll().length),[1,1]);
 await h.resolve(older);
 assert.deepEqual(h.previewRoots.map(root=>root.querySelectorAll().length),[1,1]);
 for(const cleanup of h.cleanups)cleanup();
 assert.deepEqual(h.previewRoots.map(root=>root.querySelectorAll().length),[0,0]);
});

test('a rejected preview lookup is contained and later reading panes still receive navigation',async()=>{
 const h=harness({previews:true});await h.resolve();h.owner.refreshAutomatic();
 const failed=h.requests.at(-1);assert.equal(failed.path,'Book/A.md');
 failed.reject(Error('Index temporarily unavailable'));await settle();
 assert.equal(h.requests.at(-1).path,'Book/B.md');await h.resolve();
 assert.deepEqual(h.previewRoots.map(root=>root.querySelectorAll().length),[0,1]);
 assert.equal(h.warnings.length,1);assert.match(String(h.warnings[0][0]),/navigation preview/);
 assert.deepEqual(h.writes,[]);
});

test('navigation widget equality uses rendered fields without traversing circular vault metadata',()=>{
 const h=harness();const circular=new TFile('Book/B.md');circular.parent={children:[circular]};
 const button={direction:'next',kind:'main',target:{path:circular.path,title:'B',file:circular}};
 const one=new h.api.WriterBookNavWidget(h.plugin,[button]);
 const two=new h.api.WriterBookNavWidget(h.plugin,[{...button,target:{path:circular.path,title:'B',file:{different:true}}}]);
 assert.equal(one.eq(two),true);assert.equal(one.eq({buttons:[button]}),false);
 for(const change of [{direction:'previous'},{kind:'sub'},{target:{path:'Other.md',title:'B'}},{target:{path:circular.path,title:'Different'}}]){
  assert.equal(one.eq(new h.api.WriterBookNavWidget(h.plugin,[{...button,...change}])),false);
 }
 assert.equal(one.eq(new h.api.WriterBookNavWidget(h.plugin,[])),false);
});
