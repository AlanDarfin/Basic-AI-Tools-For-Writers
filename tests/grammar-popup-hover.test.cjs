'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('main.js','utf8');

function extractExtension(){
 const start=source.indexOf('    this.registerEditorExtension(ViewPlugin.fromClass(class{',source.indexOf('module.exports=class AlansOfflineDictionary'));
 const end=source.indexOf('    }));',start);
 assert.ok(start>=0&&end>start);
 return source.slice(start,end+'    }));'.length);
}
function fixture(){
 const tasks=new Map(),removed=[],listeners=new Map();
 let tid=0,calls=[],Ctor;
 const plugin={maybeShowReviewPopup:(view,anchor)=>calls.push({view,anchor})};
 const ctx={
  plugin,ViewPlugin:{fromClass:cls=>cls},
  registerEditorExtension:cls=>{Ctor=cls;},
  setTimeout:fn=>{const id=++tid;tasks.set(id,fn);return id;},
  clearTimeout:id=>{tasks.delete(id);removed.push(id);}
 };
 vm.runInNewContext(extractExtension(),ctx);
 const dom={
  isConnected:true,
  contains:el=>el?.within===true,
  addEventListener:(name,handler)=>listeners.set(name,handler),
  removeEventListener:(name)=>listeners.delete(name)
 };
 const view={dom,state:{selection:{main:{head:0}}}};
 const instance=new Ctor(view);
 const mark=(from,to)=>({
  within:true,getAttribute:attribute=>attribute==='data-review-from'?String(from):String(to)
 });
 const event=(name,target,key,pointerType)=>listeners.get(name)?.({
  target:{closest:selector=>selector==='.writer-cm-review-mark'?target:null},
  key,pointerType
 });
 const flush=()=>{const jobs=[...tasks.values()];tasks.clear();jobs.forEach(fn=>fn());};
 return {view,instance,calls,tasks,listeners,mark,event,flush};
}

test('hovering highlighted text triggers without moving the text caret',()=>{
 const x=fixture();
 x.view.state.selection.main.head=990;
 x.event('pointermove',x.mark(10,14),null,'mouse');
 assert.equal(x.calls.length,0,'Hover uses a short delay');
 x.flush();
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].anchor.mark.from,10);
 assert.equal(x.calls[0].anchor.mark.to,14);
 x.event('pointermove',x.mark(10,14),null,'mouse');
 assert.equal(x.tasks.size,0,'Same highlight should not queue repeated menus');
 x.instance.destroy();
 assert.equal(x.listeners.size,0);
});

test('fast mouse movement cancels transient popups; mouse leaving does not close an open menu',()=>{
 const x=fixture();
 x.event('pointermove',x.mark(5,9),null,'mouse');
 x.event('pointermove',null,null,'mouse');
 x.flush();
 assert.equal(x.calls.length,0,'Hovering outside cancels the pending open');
 x.event('pointermove',x.mark(12,16),null,'mouse');
 x.event('pointerleave');
 x.flush();
 assert.equal(x.calls.length,0,'Leaving the editor cancels a pending open');
 x.instance.destroy();
});

test('placing a caret with click or arrow keys triggers the menu',()=>{
 const x=fixture();
 x.event('pointerup',null);
 x.flush();
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].anchor.caret,true);
 x.event('keyup',null,'a');
 x.flush();
 assert.equal(x.calls.length,1,'Ordinary typing should not create a new popup');
 x.event('keyup',null,'ArrowRight');
 x.flush();
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[1].anchor.caret,true);
 x.instance.destroy();
});

test('touch has no hover popup but retains tap as an explicit trigger',()=>{
 const x=fixture();
 x.event('pointermove',x.mark(1,3),null,'touch');
 x.flush();
 assert.equal(x.calls.length,0);
 x.event('pointerup',x.mark(1,3),null,'touch');
 x.flush();
 assert.equal(x.calls.length,1);
 assert.equal(x.calls[0].anchor.mark.from,1);
 x.instance.destroy();
});
test('closed editors cancel all scheduled callbacks',()=>{
 const x=fixture();
 x.event('pointermove',x.mark(1,3),null,'mouse');
 x.instance.destroy();
 x.flush();
 assert.equal(x.calls.length,0);
});
test('review marks carry exact offset metadata for hover selection',()=>{
 assert.match(source,/['"]data-review-from['"]:String\(m.from\)/);
 assert.match(source,/['"]data-review-to['"]:String\(m.to\)/);
});
test('hover selects the error independent of caret; caret selection is a fallback',()=>{
 const a=source.indexOf('  maybeShowReviewPopup(cm,anchor={}){');
 const b=source.indexOf('  reviewEditors(file){',a);
 assert.ok(a>0&&b>a);
 const sandbox={
  window:{innerWidth:900,innerHeight:500},
  msg:pt=>pt,
  console
 };
 const obj=vm.runInNewContext('({'+source.slice(a,b)+'})',sandbox);
 const file={path:'Story.md'},view={state:{selection:{main:{head:50}}},coordsAtPos:()=>({left:100,bottom:40})};
 let opened=0,closed=0,key='';
 const host={
  settings:{reviewPopupEnabled:true},
  app:{workspace:{getLeavesOfType:()=>[{view:{editor:{cm:view},file}}]}},
  reviewMarkedPath:file.path,
  reviewMarks:[{from:10,to:13},{from:20,to:25}],
  reviewMatches:[{offset:10,length:3,message:'x'},{offset:20,length:5,message:'y'}],
  reviewSource:'text',reviewPopup:null,reviewPopupKey:null,
  showReviewSuggestionMenu(_file,_source,match){opened++;key=match.offset;this.reviewPopup={};this.reviewPopupKey=file.path+':'+match.offset+':'+(match.offset+match.length);},
  closeReviewPopup(){closed++;this.reviewPopup=null;this.reviewPopupKey=null;},
  ...obj
 };
 host.maybeShowReviewPopup(view,{mark:{from:10,to:13}});
 assert.equal(opened,1);assert.equal(key,10);
 host.maybeShowReviewPopup(view,{mark:{from:10,to:13}});
 assert.equal(opened,1,'Existing popup does not reopen for same error');
 host.maybeShowReviewPopup(view,{mark:{from:20,to:25}});
 assert.equal(opened,2);assert.equal(key,20);
 view.state.selection.main.head=22;
 host.maybeShowReviewPopup(view,{caret:true});
 assert.equal(opened,2);
 view.state.selection.main.head=45;
 host.maybeShowReviewPopup(view,{caret:true});
 assert.equal(closed,1,'Leaving the error with the text cursor closes it');
 host.maybeShowReviewPopup(view,{mark:{from:999,to:1000}});
 assert.equal(opened,2,'Stale decoration cannot trigger the wrong popup');
});
