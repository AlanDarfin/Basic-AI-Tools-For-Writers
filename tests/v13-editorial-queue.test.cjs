'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/projects/editorial-queue.js','utf8');
const json=value=>JSON.parse(JSON.stringify(value));

function setup(){
 const files=new Map(),saves=[],notices=[];
 const api=vm.runInNewContext(source+`\n({writerEditorialItems,writerEditorialChange,writerEditorialRename,
 writerEditorialCapture,writerEditorialLocate,writerEditorialJump,writerEditorialChapters,writerEditorialScope,writerEditorialQueue})`,{
  writerUi:(_pt,en)=>en,writerModuleOn:(p,id)=>p.settings.visibleModules?.[id]!==false,
  writerProjectRenamedPath:(path,oldPath,newPath)=>path===oldPath||path.startsWith(oldPath+'/')?newPath+path.slice(oldPath.length):path,
  Notice:class{constructor(text){notices.push(text);}}
 });
 const plugin={settings:{writerV4Extras:{comments:{}}},app:{
  vault:{getAbstractFileByPath:path=>files.get(path)},workspace:{}
 },async saveSettings(){saves.push(json(this.settings.writerV4Extras.comments));}};
 const addFile=path=>{
  const file={path,extension:'md',basename:path.split('/').at(-1).slice(0,-3)};
  files.set(path,file);return file;
 };
 return {files,saves,notices,plugin,api,addFile,store:plugin.settings.writerV4Extras.comments};
}

test('uses current Longform scene order, nested scenes, single-note projects and legacy index comments',()=>{
 const {api,addFile,store}=setup(),index=addFile('Livro/Índice.md'),a=addFile('Livro/Ação.md'),
  b=addFile('Livro/Depois.md'),excluded=addFile('Livro/Outro.md');
 const project={file:index,format:'scenes',title:'Livro'};
 const byTitle={a,b,excluded};
 const view={activeScenes:()=>[{title:'b',indent:0},{title:'a',indent:1},{title:'b'},{title:'missing'}],
  resolveScene:(_project,title)=>byTitle[title]};
 const chapters=api.writerEditorialChapters(view,project);
 assert.deepEqual(json(chapters.map(row=>row.file.path)),[index.path,b.path,a.path]);
 Object.assign(store,{[index.path]:[{body:'Índice'}],[b.path]:[{body:'Consequência',quote:'A reunião',resolved:true}],
  [a.path]:[{body:'Reescrever a ação.',quote:'Voltando à reunião'}],[excluded.path]:[{body:'Fora do rascunho'}]});
 const open=api.writerEditorialScope(chapters,store);
 assert.equal(open.open,2);
 assert.equal(open.resolved,1);
 assert.equal(open.visible,2);
 assert.deepEqual(json(open.groups.map(row=>row.file.path)),[index.path,a.path]);
 const matching=api.writerEditorialScope(chapters,store,{status:'all',query:'acao reuniao'});
 assert.deepEqual(json(matching.groups.map(row=>row.file.path)),[a.path]);
 const resolved=api.writerEditorialScope(chapters,store,{chapter:b,status:'resolved',query:'REUNIAO'});
 assert.equal(resolved.visible,1);
 assert.equal(resolved.groups[0].file,b);
 assert.equal(api.writerEditorialScope(chapters,store,{chapter:a,status:'resolved'}).visible,0);
 const single=api.writerEditorialChapters(view,{...project,format:'single'});
 assert.equal(single.length,1);
 assert.equal(single[0].title,'Livro');
});

test('uses quote context to find the selected occurrence and never guesses for ambiguous legacy comments',()=>{
 const {api}=setup(),quote='Diálogo repetido',different='c'.repeat(75);
 const text='A'.repeat(75)+quote+'B'.repeat(75)+different+quote+'Z'.repeat(75);
 const at=text.lastIndexOf(quote);
 const entry=api.writerEditorialCapture({
  getSelection:()=>quote,getValue:()=>text,getCursor:direction=>{assert.equal(direction,'from');return {line:0,ch:at};},posToOffset:p=>p.ch
 });
 assert.equal(entry.anchor.repeated,true);
 assert.equal(api.writerEditorialLocate('prefácio'+text,entry).at,at+8);
 assert.equal(api.writerEditorialLocate(text,{quote}).kind,'ambiguous');
 assert.equal(api.writerEditorialLocate(text.slice(0,text.indexOf(quote))+quote+'B'.repeat(75),entry).kind,'ambiguous');
 assert.equal(api.writerEditorialLocate(text.replaceAll(quote,'Reescrito'),entry).kind,'missing');
 assert.deepEqual(json(api.writerEditorialLocate('A única ponte',{quote:'única'})),{kind:'match',at:2});
 assert.equal(api.writerEditorialLocate('re-re-re',{quote:'re-re'}).kind,'ambiguous');
 assert.equal(api.writerEditorialCapture({getSelection:()=>''}),null);
 assert.deepEqual(json(api.writerEditorialCapture({getSelection:()=>quote})),{quote});
});

test('serializes only the existing comment store, rolls back targeted save failures and preserves legacy content',async()=>{
 const {api,plugin,addFile,saves,store}=setup(),file=addFile('Book/A.md'),early={id:'old',body:'Legacy',quote:'Text'};
 store[file.path]=[early];
 await Promise.all([
  api.writerEditorialChange(plugin,file,items=>[...items,{id:'new',body:'Chapter',quote:''}]),
  api.writerEditorialChange(plugin,file,items=>items.map(item=>item.id==='old'?{...item,resolved:true}:item))
 ]);
 assert.equal(saves.length,2);
 assert.equal(store[file.path][0].resolved,true);
 assert.equal(store[file.path][1].body,'Chapter');
 const previous=store[file.path];
 plugin.saveSettings=async()=>{throw Error('disk');};
 await assert.rejects(api.writerEditorialChange(plugin,file,()=>[]),/disk/);
 assert.equal(store[file.path],previous);
 plugin.settings.visibleModules={comments:false};
 await assert.rejects(api.writerEditorialChange(plugin,file,()=>[]),/disabled/);
 plugin.settings.visibleModules={comments:true};
 await assert.rejects(api.writerEditorialChange(plugin,{path:file.path,extension:'md'},()=>[]),/no longer available/);
 assert.equal(store[file.path],previous);
});

test('queued saves follow folder and file renames while retaining destination comments and neighboring paths',async()=>{
 const {api,plugin,store,files,addFile,saves}=setup(),file=addFile('Livro/Cenas/A.md');
 const first={id:'1',body:'Antigo'},second={id:'2',body:'Destino'},neighbor={id:'3',body:'Vizinho'};
 Object.assign(store,{[file.path]:[first],'Romance/Cenas/A.md':[second],'Livro 2/Cenas/A.md':[neighbor]});
 const old=file.path;files.delete(old);file.path='Romance/Cenas/A.md';files.set(file.path,file);
 await Promise.all([api.writerEditorialRename(plugin,'Livro','Romance'),
  api.writerEditorialChange(plugin,file,items=>[...items,{id:'4',body:'Novo'}])]);
 assert.equal(store[old],undefined);
 assert.deepEqual(json(store[file.path].map(item=>item.id)),['2','1','4']);
 assert.equal(store['Livro 2/Cenas/A.md'][0],neighbor);
 await api.writerEditorialRename(plugin,'Romance/Cenas/A.md','Romance/Cenas/B.md');
 assert.equal(store['Romance/Cenas/A.md'],undefined);
 assert.equal(store['Romance/Cenas/B.md'].length,3);
 assert.equal(saves.length,3);
});

test('jumps only in the exact chapter editor and does not show the mobile keyboard',async()=>{
 const {api,plugin,addFile,notices}=setup(),file=addFile('Book/A.md'),other=addFile('Book/B.md');
 const calls=[];
 const editor={getValue:()=> 'prefix passage suffix',offsetToPos:ch=>({line:0,ch}),
  setSelection:(from,to)=>calls.push(['select',from.ch,to.ch]),scrollIntoView:()=>calls.push(['scroll']),
  focus:()=>calls.push(['focus'])};
 const active={view:{file:other,editor:{setSelection(){assert.fail('Wrong note');}}}};
 let mode='preview';
 const selected={view:{file,editor,getMode:()=>mode},getViewState:()=>({type:'markdown',state:{file:file.path,mode}}),
  async setViewState(state){mode=state.state.mode;calls.push(['mode',mode]);}};
 Object.assign(plugin.app.workspace,{activeLeaf:active,getLeavesOfType:()=>[active,selected],revealLeaf:async leaf=>calls.push(['reveal',leaf===selected]),
  getLeaf(){assert.fail('Should reuse exact leaf');}});
 plugin.app.isMobile=true;
 await api.writerEditorialJump(plugin,file,{quote:'passage'});
 assert.deepEqual(calls,[['mode','source'],['reveal',true],['select',7,14],['scroll']]);
 await api.writerEditorialJump(plugin,file,{quote:'changed'});
 assert.match(notices.at(-1),/kept/);
 assert.equal(calls.filter(([kind])=>kind==='select').length,1);
});

test('an older navigation request cannot select text after a newer request or target change',async()=>{
 const {api,plugin,files,addFile}=setup(),a=addFile('A.md'),b=addFile('B.md');
 let finishA;const selected=[];
 const leaf=file=>({view:{file,editor:{getValue:()=>file.basename,
  offsetToPos:ch=>({line:0,ch}),setSelection:()=>selected.push(file.basename),scrollIntoView(){}}}});
 const la=leaf(a),lb=leaf(b);
 Object.assign(plugin.app.workspace,{getLeavesOfType:()=>[la,lb],revealLeaf(l){if(l===la)return new Promise(resolve=>finishA=resolve);}});
 const first=api.writerEditorialJump(plugin,a,{quote:'A'});
 await api.writerEditorialJump(plugin,b,{quote:'B'});
 finishA();await first;
 assert.deepEqual(selected,['B']);
 const pending=api.writerEditorialJump(plugin,a,{quote:'A'});files.delete(a.path);finishA();await pending;
 assert.deepEqual(selected,['B']);
});

test('ships with the existing project module, comment command and responsive control styles',()=>{
 const projects=fs.readFileSync('projects.js','utf8'),main=fs.readFileSync('main.js','utf8'),css=fs.readFileSync('styles.css','utf8');
 assert.match(projects,/writerModuleOn\(this\.plugin,'comments'\).*Fila de revisão/);
 assert.match(main,/id:'v4-add-comment'/);
 assert.match(main,/id:'longform-editorial-queue'/);
 assert.match(main,/function writerEditorialQueue\(/);
 assert.match(css,/\.writer-editorial-controls\{[^}]*minmax\(min\(100%,9rem\),1fr\)/);
 assert.match(css,/body\.is-mobile \.writer-editorial-actions>button\{min-height:44px\}/);
});
