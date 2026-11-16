'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=['src/v8/home-utilities.js','src/v8/writing-home.js'].map(path=>fs.readFileSync(path,'utf8')).join('\n');
class Node{
 constructor(tag,options={}){this.tag=tag;this.cls=options.cls||'';this.attributes={...options.attr};this.text=options.text||'';this.children=[];this.listeners={};}
 createEl(tag,opts){const el=new Node(tag,opts);this.children.push(el);return el;}
 createDiv(opts){return this.createEl('div',opts);}
 createSpan(opts){return this.createEl('span',opts);}
 addClass(cls){this.cls+=' '+cls;}
 empty(){this.children=[];}
 addEventListener(name,callback){this.listeners[name]=callback;}
 setAttribute(key,value){this.attributes[key]=value;}
 setText(text){this.text=text;}
 all(){return [this,...this.children.flatMap(c=>c.all())];}
 byClass(cls){return this.all().filter(el=>el.cls.split(' ').includes(cls));}
}
const make=(length=17)=>Array.from({length},(_,i)=>({id:String(i),url:'https://site'+i+'.test/reference',title:i===length-1?'Referência de história':'Site '+(i+1),
 group:i%3===0?'':i%2===0?'Pesquisa':'Estudos'}));
function harness(bookmarks=make(),locale='pt'){
 const opened=[];
 const {WriterV8HomeView,writerHomeBookmarkResults}=vm.runInNewContext(source+'\n({WriterV8HomeView,writerHomeBookmarkResults})',{
  URL,ItemView:class{},writerUi:(pt,en)=>locale==='pt'?pt:en,require:()=>({Platform:{isMobile:true},setIcon(){}}),
  Notice:class{constructor(message){assert.fail(message);}}
 });
 const view=new WriterV8HomeView(null,{settings:{v8Finish:{homeWebBookmarks:bookmarks}},app:{isMobile:true,
  workspace:{containerEl:{ownerDocument:{defaultView:{open:(url,target)=>opened.push({url,target})}}}}}});
 view.card=parent=>parent.createDiv();
 let root;
 const render=()=>{root=new Node('root');view.renderWebBookmarks(root);return root;};
 return {view,filter:writerHomeBookmarkResults,render,opened,get root(){return root;}};
}
const rows=root=>root.byClass('writer-v1203-web-bookmark-open');
const find=(root,tag)=>root.all().find(el=>el.tag===tag);
test('search matches accents, combined words, host, URL path and group without reordering originals',()=>{
 const list=make(),h=harness(list);
 assert.deepEqual(Array.from(h.filter(list,'REFERENCIA historia site16'),x=>x.id),['16']);
 assert.deepEqual(Array.from(h.filter(list,'pesquisa site2'),x=>x.id),['2']);
 assert.deepEqual(Array.from(h.filter(list,'reference',''),x=>x.id),['0','3','6','9','12','15']);
 assert.equal(h.filter(list,'agora não').length,0);
 assert.equal(list.length,17);
});
test('looks past the first 12, retains search on rerender and keeps the same search input while filtering',()=>{
 const h=harness(),root=h.render(),input=find(root,'input');
 assert.equal(rows(root).length,12);
 input.value='historia';input.listeners.input();
 assert.equal(find(root,'input'),input);
 assert.equal(rows(root).length,1);
 assert.match(rows(root)[0].attributes['aria-label'],/Referência de história/);
 assert.equal(root.byClass('writer-v1205-web-bookmark-count')[0].text,'1/17 sites encontrados');
 assert.equal(root.byClass('writer-v1203-web-bookmarks-expand')[0].hidden,true);
 assert.equal(find(h.render(),'input').value,'historia');
 rows(h.root)[0].listeners.click();
 assert.deepEqual(h.opened,[{url:'https://site16.test/reference',target:'_system'}]);
});
test('exact group filters combine with search, include ungrouped, and fall back when a group disappears',()=>{
 const list=make(6),h=harness(list,'en'),root=h.render(),select=find(root,'select');
 const choose=name=>{select.value=select.children.find(child=>child.text===name).attributes.value;select.listeners.change();};
 choose('Ungrouped');
 assert.equal(rows(root).length,2);
 choose('Pesquisa');
 assert.equal(rows(root).length,2);
 const search=find(root,'input');search.value='does not exist';search.listeners.input();
 assert.equal(rows(root).length,0);
 assert.ok(root.all().some(item=>item.text==='No websites match these filters.'));
 search.value='';search.listeners.input();
 for(const entry of list)if(entry.group==='Pesquisa')entry.group='Estudos';
 assert.equal(find(h.render(),'select').value,'0');
 assert.equal(rows(h.root).length,6);
});
test('expand and collapse preserve the compact initial view and stay out of filtered results',()=>{
 const h=harness(),root=h.render(),expand=root.byClass('writer-v1203-web-bookmarks-expand')[0],search=find(root,'input');
 assert.equal(expand.attributes['aria-expanded'],'false');
 expand.listeners.click();assert.equal(rows(root).length,17);assert.equal(expand.attributes['aria-expanded'],'true');
 search.value='historia';search.listeners.input();
 assert.equal(expand.hidden,true);
 search.value='';search.listeners.input();
 assert.equal(rows(root).length,17);
 expand.listeners.click();assert.equal(rows(root).length,12);
});
test('empty bookmarks and entirely ungrouped lists do not add unusable controls',()=>{
 assert.equal(find(harness([]).render(),'input'),undefined);
 const list=make(3).map(item=>({...item,group:''}));
 const root=harness(list).render();
 assert.ok(find(root,'input'));assert.equal(find(root,'select'),undefined);
});
