'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v9/explorer-flex.js','utf8');
const css=fs.readFileSync('src/styles/v9-2-2-iconic-fixes.css','utf8');
const expose=(names)=>vm.runInNewContext(source+'\n({'+names.join(',')+'})',{
 console,Date,Math,Number,String,Array,RegExp,Set,Map,Intl,
 writerUi:(pt,en)=>en,require:()=>({setIcon:()=>{}})
});
const f=expose(['writerV91FlexMerge','writerV1047MobileReorderVisible',
 'writerV1047ToggleMobileReorder','writerV91FlexSortGroup']);
function makeFixture(){
 const root={path:'/'},files=['A.md','B.md'].map(name=>({path:name,name,parent:root,stat:{mtime:0}}));
 root.children=files;
 const byPath=Object.fromEntries(files.map(file=>[file.path,file]));
 const settings={v91Flex:{perSpaceSorting:false,perSpacePins:false,
  folders:{'':{sort:'custom',order:['A.md','B.md']}}}};
 f.writerV91FlexMerge(settings);
 let refreshes=0,icons=0;
 const host={querySelectorAll:()=>[]};
 const plugin={settings,app:{isMobile:true,
  vault:{getAbstractFileByPath:path=>byPath[path]},
  workspace:{getLeavesOfType:()=>[{view:{containerEl:host}}]}},
  writerV91FlexRefresh:()=>{refreshes++;}};
 const titles=files.map(file=>{
  const classes=new Set();
  const title={
   ownerDocument:{createElement(tag){
    const node={tagName:tag,children:[],dataset:{},className:'',
     setAttribute(){},addEventListener(){},appendChild(el){this.children.push(el);},
     remove(){if(title.action===this)title.action=null;}};
    return node;
   }},
   dataset:{},classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},
   querySelector:selector=>selector.includes('writer-v93-reorder-actions')?title.action||null:null,
   appendChild(node){title.action=node;},
   get actionCount(){return this.action?.children.length||0;},
   classes
  };
  const node={classList:{contains:label=>label==='nav-file',toggle(){}},
   dataset:{},style:{removeProperty(){},setProperty(){}},
   getAttribute:key=>key==='data-path'?file.path:null,
   querySelector:()=>title};
  return {title,node};
 });
 const container={children:titles.map(entry=>entry.node),closest:()=>null,dataset:{},
  style:{removeProperty(){},setProperty(){}}};
 const scan=()=>f.writerV91FlexSortGroup(plugin,container,[],true);
 return {plugin,settings,titles,scan,refreshes:()=>refreshes};
}
test('mobile Explorer does not render reorder arrows until the user enables editing mode',()=>{
 const x=makeFixture();
 assert.equal(f.writerV1047MobileReorderVisible(x.plugin),false);
 x.scan();
 assert.deepEqual(x.titles.map(entry=>entry.title.actionCount),[0,0]);
 assert.ok(x.titles.every(entry=>!entry.title.classes.has('writer-v1047-reorder-title')));
 assert.equal(f.writerV1047ToggleMobileReorder(x.plugin,true),true);
 x.scan();
 assert.deepEqual(x.titles.map(entry=>entry.title.actionCount),[2,2]);
 assert.ok(x.titles.every(entry=>entry.title.classes.has('writer-v1047-reorder-title')));
 assert.equal(f.writerV1047ToggleMobileReorder(x.plugin,false),false);
 x.scan();
 assert.deepEqual(x.titles.map(entry=>entry.title.actionCount),[0,0]);
 assert.equal(x.refreshes(),2);
 assert.deepEqual(JSON.parse(JSON.stringify(x.settings.v91Flex.folders[''].order)),['A.md','B.md'],
  'Switching editing controls does not change stored ordering');
});
test('disabling mobile reorder settings and desktop views never show arrows',()=>{
 const x=makeFixture();
 x.plugin.writerV91FlexMobileSortActive=true;
 x.plugin.settings.v91Flex.mobileReorder=false;
 assert.equal(f.writerV1047MobileReorderVisible(x.plugin),false);
 x.scan();
 assert.deepEqual(x.titles.map(entry=>entry.title.actionCount),[0,0]);
 x.plugin.settings.v91Flex.mobileReorder=true;
 x.plugin.app.isMobile=false;
 assert.equal(f.writerV1047MobileReorderVisible(x.plugin),false);
});
test('compact mobile presentation preserves preview shells and passes Obsidian CSS lint rules',()=>{
 assert.match(css,/writer-v1047-reorder-title > \.writer-v93-reorder-actions/);
 assert.match(css,/writer-v1047-reorder-title/);
 assert.match(css,/position:absolute/);
 assert.match(css,/\.writer-v93-reorder-actions\{display:none/);
 assert.match(css,/:not\(\.writer-v92-has-preview\)/);
 assert.doesNotMatch(css,/:has\s*\(|!important/);
 assert.match(source,/id:'v1047-toggle-explorer-mobile-reorder'/);
 assert.match(source,/Reorganizar itens no celular/);
 assert.doesNotMatch(source,/container\.appendChild\(row\.node\)/);
});
