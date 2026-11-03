'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function mock(initial){
 const main=fs.readFileSync('main.js','utf8');
 const start=main.indexOf('  hotReloadStorageKey(){');
 const end=main.indexOf('  async onunload(){',start);
 assert.ok(start>=0&&end>start);
 const store=new Map();
 const ctx={
  PROJECT_VIEW:'projects',VIEW:'dictionary',WRITER_TOOLS_VIEW:'tools',WRITER_V8_HOME_VIEW:'home',
  WRITER_V83_CAL_VIEW:'calendar',WRITER_V83_STUDY_VIEW:'study',WRITER_V9_SPACE_VIEW:'spaces',
  window:{sessionStorage:{setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null,removeItem:k=>store.delete(k)}},
  Date,console,Set,Map,Number,String,Array,Math
 };
 const Hot=vm.runInNewContext('class Hot{\n'+main.slice(start,end)+'\n};Hot',ctx);
 const workspace={
  leftSplit:{children:[],collapsed:false,containerEl:{contains:el=>el?.side==='left'}},
  rightSplit:{children:[],collapsed:false,containerEl:{contains:el=>el?.side==='right'}},
  central:[],activeLeaf:null,created:[],revealed:[],
  getLeavesOfType(type){
   const groups=[...this.leftSplit.children,...this.rightSplit.children];
   return [...groups.flatMap(g=>g.children),...this.central].filter(l=>l.type===type);
  },
  createLeafInParent(parent,index){
   const side=parent===this.leftSplit?'left':parent===this.rightSplit?'right':null;
   let group=parent;
   if(side){
    group={children:[],parent};
    parent.children.splice(Math.min(index,parent.children.length),0,group);
   }
   const where=side||(parent.parent===this.leftSplit?'left':'right');
   const l=makeLeaf('empty',where,group);
   group.children.splice(Math.min(index,group.children.length),0,l);
   this.created.push({side:where,at:index,parent:side?'dock':'tabs'});
   return l;
  },
  getLeftLeaf(){throw Error('Must not append a bottom split');},
  getRightLeaf(){throw Error('Must not append a bottom split');},
  getLeaf(){const leaf=makeLeaf('empty','tab');this.central.push(leaf);return leaf;},
  revealLeaf:async leaf=>{workspace.revealed.push(leaf);},
  setActiveLeaf(leaf){workspace.activeLeaf=leaf;}
 };
 function makeLeaf(type,side,parent){
  return {
   type,parent,containerEl:{side},
   view:{contentEl:{scrollTop:0}},
   getViewState(){return {type:this.type};},
   async setViewState(state){this.type=state.type;this.view={contentEl:{scrollTop:0},render(){}};},
   detach(){
    if(!this.parent)return;
    const a=this.parent.children;
    a.splice(a.indexOf(this),1);
    if(!a.length){
     const parents=this.parent.parent.children;
     parents.splice(parents.indexOf(this.parent),1);
    }
   }
  };
 }
 function add(side,types){
  const dock=side==='left'?workspace.leftSplit:workspace.rightSplit;
  const group={children:[],parent:dock};
  dock.children.push(group);
  for(const type of types)group.children.push(makeLeaf(type,side,group));
  return group;
 }
 for(const [side,types] of initial)add(side,types);
 const plugin=Object.create(Hot.prototype);
 plugin.manifest={id:'basic-ai-tool-for-writers'};
 plugin.app={vault:{getName:()=> 'test'},workspace};
 function unload(types){
  for(const type of types)
   for(const leaf of workspace.getLeavesOfType(type))leaf.detach();
 }
 return {workspace,plugin,unload,store,add,makeLeaf};
}
function groups(ws,side='left'){
 return (side==='left'?ws.leftSplit:ws.rightSplit).children.map(g=>g.children.map(l=>l.type));
}

test('restores a project panel ABOVE the explorer, never as a new bottom panel',async()=>{
 const {workspace,plugin,unload,store}=mock([['left',['projects']],['left',['file-explorer']]]);
 workspace.getLeavesOfType('projects')[0].view.selected='Bonfire/Index.md';
 plugin.rememberHotReloadSidebars();
 const snap=JSON.parse([...store.values()][0]);
 assert.equal(snap.leaves[0].groupIndex,0);
 unload(['projects']);
 assert.deepEqual(groups(workspace),[['file-explorer']]);
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace),[['projects'],['file-explorer']]);
 assert.equal(workspace.getLeavesOfType('projects')[0].view.selected,'Bonfire/Index.md');
 assert.equal(store.size,0);
});

test('rejoins the original Explorer tab group at the same tab index',async()=>{
 const {workspace,plugin,unload}=mock([['left',['file-explorer','projects','bookmarks']]]);
 plugin.rememberHotReloadSidebars();
 unload(['projects']);
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace),[['file-explorer','projects','bookmarks']]);
 assert.equal(workspace.created[0].parent,'tabs');
});

test('restores multiple plugin tabs together without adding extra sidebar splits',async()=>{
 const {workspace,plugin,unload}=mock([['left',['projects','tools']],['left',['file-explorer']]]);
 plugin.rememberHotReloadSidebars();
 unload(['projects','tools']);
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace),[['projects','tools'],['file-explorer']]);
 assert.equal(workspace.created.filter(x=>x.parent==='dock').length,1);
});

test('preserves groups on right and does not duplicate a view restored by Obsidian',async()=>{
 const {workspace,plugin,unload}=mock([['right',['search']],['right',['tools']]]);
 plugin.rememberHotReloadSidebars();
 unload(['tools']);
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace,'right'),[['search'],['tools']]);
 const created=workspace.created.length;
 plugin.rememberHotReloadSidebars();
 await plugin.restoreHotReloadSidebars();
 assert.equal(workspace.created.length,created);
});

test('legacy pre-9.2.7 snapshot defaults to the top, rather than appending below the explorer',async()=>{
 const {workspace,plugin,store}=mock([['left',['file-explorer']]]);
 store.set(plugin.hotReloadStorageKey(),JSON.stringify({timestamp:Date.now(),leaves:[
  {type:'projects',side:'left',visible:true,selected:'Book/Index.md'}
 ]}));
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace),[['projects'],['file-explorer']]);
});

test('restores only fresh pane snapshots, never reopens stale/closed views',async()=>{
 const {workspace,plugin,store}=mock([['left',['file-explorer']]]);
 store.set(plugin.hotReloadStorageKey(),JSON.stringify({timestamp:Date.now()-300000,leaves:[
  {type:'projects',side:'left',groupIndex:0,tabIndex:0}
 ]}));
 await plugin.restoreHotReloadSidebars();
 assert.deepEqual(groups(workspace),[['file-explorer']]);
 assert.equal(store.size,0);
});
