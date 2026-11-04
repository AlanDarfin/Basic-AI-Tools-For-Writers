'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function moduleUnderTest(name,exportNames){
 const source=fs.readFileSync(path.join(root,'src/v9',name),'utf8');
 const context=vm.createContext({console,URL,RegExp,Math,Number,String,Set,Map,Array,Date,writerUi:(pt,en)=>en});
 const exports=exportNames.map(key=>key+':'+key).join(',');
 const exposed=vm.runInContext(source+'\n({'+exports+'})',context);
 return {source,exposed};
}
test('9.1 version and assembled runtime',()=>{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const versions=JSON.parse(fs.readFileSync(path.join(root,'versions.json'),'utf8'));
 assert.equal(pkg.version,manifest.version);assert.match(manifest.version,/^(?:9|10)\.[0-9]+\.[0-9]+$/);
 assert.equal(versions[manifest.version],'1.11.4');
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
 for(const name of ['soundscapes','click-clack','explorer-flex'])
  assert.ok(main.includes('// v3 module: src/v9/'+name+'.js'),name+' missing from main.js');
 assert.match(main,/writerV91RegisterSound\(this\)/);
 assert.match(main,/writerV91RegisterClick\(this\)/);
 assert.match(main,/writerV91FlexRegister\(this\)/);
 assert.match(main,/writerV91HomeSoundscape\(this,p\)/);
 assert.match(main,/writer-v91-ai-chat-row/);
});
test('Soundscapes original preset radio IDs, YouTube URL restrictions and safe settings migration',()=>{
 const {exposed:m}=moduleUnderTest('soundscapes.js',['WRITER_V91_RADIOS','writerV91VideoId','writerV91SoundMerge','writerV91SoundAudioFiles']);
 assert.equal(m.WRITER_V91_RADIOS.length,17);
 assert.equal(m.writerV91VideoId('https://youtu.be/jfKfPfyJRdk'),'jfKfPfyJRdk');
 assert.equal(m.writerV91VideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk'),'jfKfPfyJRdk');
 assert.equal(m.writerV91VideoId('https://fake-youtube.com/watch?v=jfKfPfyJRdk'),'');
 assert.equal(m.writerV91VideoId('https://example.com/jfKfPfyJRdk'),'');
 const settings={v91Sound:{station:'unsafe',volume:999,customPlaylists:[{id:'one',name:'Test',tracks:[{id:'https://youtu.be/jfKfPfyJRdk',name:'Lofi'},{id:'javascript:alert(1)',name:'Bad'}]}]}};
 const cfg=m.writerV91SoundMerge(settings);
 assert.equal(cfg.station,'lofi');assert.equal(cfg.volume,100);
 assert.equal(cfg.customPlaylists.length,1);
 assert.equal(cfg.customPlaylists[0].tracks.length,1);
 const plugin={settings:{v91Sound:{musicFolder:'Music'}},app:{vault:{getFiles:()=>[
  {path:'Music/a.mp3',extension:'mp3'},{path:'Music/s.md',extension:'md'},
  {path:'Other/b.ogg',extension:'ogg'},{path:'Music/c.wav',extension:'wav'}]}}};
 assert.deepEqual(Array.from(m.writerV91SoundAudioFiles(plugin),x=>x.path),['Music/a.mp3','Music/c.wav']);
});
test('Click Clack ignores shortcuts and classifies keys',()=>{
 const {exposed:m}=moduleUnderTest('click-clack.js',['writerV91ClickCategory','writerV91ClickMerge']);
 assert.equal(m.writerV91ClickCategory({key:'a'}),'key');
 assert.equal(m.writerV91ClickCategory({key:' ',code:'Space'}),'space');
 assert.equal(m.writerV91ClickCategory({key:'Enter'}),'enter');
 assert.equal(m.writerV91ClickCategory({key:'Backspace'}),'delete');
 assert.equal(m.writerV91ClickCategory({key:'a',ctrlKey:true}),'');
 assert.equal(m.writerV91ClickCategory({key:'s',metaKey:true}),'');
 const settings={};assert.equal(m.writerV91ClickMerge(settings).enabled,false);
});
test('Flexplorer hide globs, pinning and folder sorting are independent of vault data',()=>{
 const {exposed:m}=moduleUnderTest('explorer-flex.js',['writerV91FlexMerge','writerV91FlexGlob','writerV91FlexIsHidden','writerV91FlexPatterns']);
 const cfg=m.writerV91FlexMerge({v91Flex:{hidden:['Secrets/a.md'],patterns:'Templates/**\n*.bak',folders:{Notes:{sort:'custom',order:['c.md','b.md','c.md']}}}});
 const patterns=m.writerV91FlexPatterns(cfg);
 assert.ok(m.writerV91FlexIsHidden(cfg,'Secrets/a.md',patterns));
 assert.ok(m.writerV91FlexIsHidden(cfg,'Templates/draft.md',patterns));
 assert.ok(m.writerV91FlexIsHidden(cfg,'old.bak',patterns));
 assert.ok(!m.writerV91FlexIsHidden(cfg,'Notes/readme.md',patterns));
 assert.deepEqual(Array.from(cfg.folders.Notes.order),['c.md','b.md']);
 assert.equal(m.writerV91FlexGlob(''),null);
});
test('Native Explorer sorts persisted custom order and hides folder descendants',()=>{
 const {exposed:m}=moduleUnderTest('explorer-flex.js',['writerV91FlexMerge','writerV91FlexIsHidden','writerV104FlexNativeSort']);
 const settings={v91Flex:{perSpaceSorting:false,perSpacePins:false,folders:{Notes:{sort:'custom',order:['three.md','one.md','two.md']}},hidden:['Secrets']}};
 const cfg=m.writerV91FlexMerge(settings);
 assert.equal(m.writerV91FlexIsHidden(cfg,'Secrets/nested/deep.md',[]),true);
 assert.equal(m.writerV91FlexIsHidden(cfg,'Public.md',[]),false);
 const files=['one.md','two.md','three.md'].map(name=>({file:{name,path:'Notes/'+name}}));
 const plugin={settings:{v91Flex:cfg}};
 const sorted=m.writerV104FlexNativeSort(plugin,{path:'Notes'},files);
 assert.deepEqual(Array.from(sorted,x=>x.file.name),['three.md','one.md','two.md']);
 assert.deepEqual(Array.from(files,x=>x.file.name),['one.md','two.md','three.md']);
});
test('Moving up changes only saved order and never reparents explorer nodes',()=>{
 const {source,exposed:m}=moduleUnderTest('explorer-flex.js',
  ['writerV91FlexMerge','writerV91FlexReorder']);
 const parent={path:'Notes',children:[]};
 const all=['one.md','two.md','three.md'].map(name=>({name,path:'Notes/'+name,parent}));
 parent.children=all;
 const byPath=Object.fromEntries(all.map(file=>[file.path,file]));
 const settings={v91Flex:{perSpaceSorting:false,perSpacePins:false,
  folders:{Notes:{sort:'custom',order:['one.md','two.md','three.md']}}}};
 m.writerV91FlexMerge(settings);
 let saves=0,refreshes=0;
 const plugin={settings,app:{vault:{getAbstractFileByPath:p=>byPath[p]}},
  saveSettings:()=>{saves++;},writerV91FlexRefresh:()=>{refreshes++;}};
 m.writerV91FlexReorder(plugin,'Notes/two.md','Notes/one.md','before');
 assert.deepEqual(Array.from(settings.v91Flex.folders.Notes.order),
  ['two.md','one.md','three.md']);
 assert.deepEqual(Array.from(parent.children,file=>file.name),
  ['one.md','two.md','three.md']);
 assert.equal(byPath['Notes/two.md'].path,'Notes/two.md');
 assert.equal(refreshes,1);
 assert.doesNotMatch(source,/container\.appendChild\(row\.node\)/);
 assert.match(source,/writerFlexOrderHost/);
});
test('Root sorting normalizes / and empty key, and native toolbar mode overrides every folder',()=>{
 const {exposed:m}=moduleUnderTest('explorer-flex.js',[
  'writerV91FlexMerge','writerV93FlexRecord','writerV104FlexNativeSort',
  'writerV1043RootKey','writerV1043GlobalSortingMenu','writerV1043IsSortButton']);
 const settings={v91Flex:{perSpaceSorting:false,pinEnabled:false,
  folders:{'/':{sort:'custom',order:['zeta.md','alpha.md']},
   'Notes':{sort:'name-desc',order:[]}}}};
 const cfg=m.writerV91FlexMerge(settings);
 assert.equal(m.writerV1043RootKey('/'),'');
 assert.equal(m.writerV1043RootKey(''),'');
 assert.equal(cfg.folders[''].sort,'custom');
 const plugin={settings,saveSettings:async()=>{},writerV91FlexRefresh:()=>{}};
 const root={path:'/'},inner={path:'Notes'};
 const make=(folder,names)=>names.map(name=>({file:{name,path:(folder.path==='/'?'':folder.path+'/')+name,stat:{mtime:1},parent:folder}}));
 const rootItems=make(root,['alpha.md','zeta.md']);
 assert.deepEqual(Array.from(m.writerV104FlexNativeSort(plugin,root,rootItems),r=>r.file.name),['zeta.md','alpha.md']);
 cfg.globalSortMode='name';
 assert.equal(m.writerV93FlexRecord(plugin,'/').sort,'name');
 assert.equal(m.writerV93FlexRecord(plugin,'Notes').sort,'name');
 assert.deepEqual(Array.from(m.writerV104FlexNativeSort(plugin,root,rootItems),r=>r.file.name),['alpha.md','zeta.md']);
 cfg.globalSortMode='name-desc';
 assert.deepEqual(Array.from(m.writerV104FlexNativeSort(plugin,inner,make(inner,['a.md','b.md'])),r=>r.file.name),['b.md','a.md']);
 cfg.globalSortMode='custom';
 const menu={items:[{checked:true,setChecked(v){this.checked=v;}}],
  addSeparator(){},addItem(fn){
   const item={setTitle(v){this.title=v;return this;},setIcon(){return this;},
    setChecked(v){this.checked=v;return this;},onClick(cb){this.click=cb;return this;}};
   fn(item);this.items.push(item);
  }};
 m.writerV1043GlobalSortingMenu(plugin,menu);
 assert.equal(menu.items[0].checked,false);
 assert.ok(menu.items.some(x=>x.title==='Manual sorting (Basic)'&&x.checked));
 const nativeButton={getAttribute:()=> 'Change sort order',closest:()=>({}),querySelector:()=>null};
 assert.equal(m.writerV1043IsSortButton({target:{closest:()=>nativeButton}}),true);
 const otherButton={getAttribute:()=> 'New note',closest:()=>({}),querySelector:()=>null};
 assert.equal(m.writerV1043IsSortButton({target:{closest:()=>otherButton}}),false);
});
test('Root reorder changes saved order only, without moving or deleting files',()=>{
 const {source,exposed:m}=moduleUnderTest('explorer-flex.js',
  ['writerV91FlexMerge','writerV91FlexReorder']);
 const root={path:'/',children:[]};
 root.children=['alpha.md','zeta.md'].map(name=>({name,path:name,parent:root}));
 const files=Object.fromEntries(root.children.map(file=>[file.path,file]));
 const settings={v91Flex:{perSpaceSorting:false,pinEnabled:false,
  folders:{'/':{sort:'custom',order:['alpha.md','zeta.md']}}}};
 m.writerV91FlexMerge(settings);
 let refreshes=0;
 const plugin={settings,app:{vault:{getAbstractFileByPath:path=>files[path]},
   workspace:{getLeavesOfType:()=>[{view:{getSortedFolderItems:()=>root.children.map(file=>({file}))}}]}},
  saveSettings:async()=>{},writerV91FlexRefresh:()=>refreshes++};
 m.writerV91FlexReorder(plugin,'zeta.md','alpha.md','before');
 assert.deepEqual(Array.from(settings.v91Flex.folders[''].order),['zeta.md','alpha.md']);
 assert.deepEqual(root.children.map(x=>x.path),['alpha.md','zeta.md']);
 assert.equal(refreshes,1);
 assert.doesNotMatch(source,/container\\.appendChild\\(row\\.node\\)/);
 assert.equal(source.includes("setTitle(writerUi('Mover para cima'"),false);
});
test('Desktop-only sections and README feature documentation in both languages',()=>{
 const sound=fs.readFileSync(path.join(root,'src/v9/soundscapes.js'),'utf8');
 const clicks=fs.readFileSync(path.join(root,'src/v9/click-clack.js'),'utf8');
 assert.match(sound,/if\(plugin\.app\.isMobile\)return/);
 assert.match(clicks,/if\(plugin\.app\.isMobile\)return/);
 const en=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const pt=fs.readFileSync(path.join(root,'docs/README.pt-BR.md'),'utf8');
 assert.doesNotMatch(en,/^## What's new/m);
 assert.doesNotMatch(pt,/^## Novidades da/m);
 for(const doc of [en,pt]){
  assert.match(doc,/Soundscapes/);
  assert.match(doc,/Flexplorer/);
  assert.match(doc,/Click Clack/);
 }
});
