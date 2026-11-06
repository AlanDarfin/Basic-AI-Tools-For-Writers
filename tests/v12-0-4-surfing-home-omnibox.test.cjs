'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const home=fs.readFileSync('src/v8/writing-home.js','utf8');
const util=fs.readFileSync('src/v8/home-utilities.js','utf8');
const css=fs.readFileSync('src/styles/v8-finish-suite.css','utf8');
const utils=vm.runInNewContext(util+'\n({writerV8HomeSurfing})',{URL,writerUi:(pt,en)=>en,console});
function plugin(enabled=true){
 return {app:{isMobile:false,plugins:{plugins:{surfing:{settings:{defaultSearchEngine:'Google'}}},
  enabledPlugins:new Set(enabled?['surfing']:[])}}};
}
class Element{
 constructor(opts={}){this.children=[];this.attrs=opts.attr||{};this.cls=opts.cls||'';this.listeners={};
  this.value='';this.isConnected=true;this.disabled=false;}
 createEl(tag,opts={}){const e=new Element(opts);e.tag=tag;this.children.push(e);return e;}
 createDiv(opts){return this.createEl('div',opts);}
 createSpan(opts){return this.createEl('span',opts);}
 addEventListener(name,handler){(this.listeners[name]??=[]).push(handler);}
 emit(name,options={}){const event={key:'',prevented:false,preventDefault(){this.prevented=true;},...options};
  for(const h of this.listeners[name]||[])h(event);return event;}
 focus(){this.focused=true;}
 select(){this.selected=true;}
}
const opened=[];
const viewApi=vm.runInNewContext(home+'\nWriterV8HomeView',{
 ItemView:class{},writerUi:(pt,en)=>pt,
 writerV8HomeSurfing:utils.writerV8HomeSurfing,
 writerV8HomeIsMobile:p=>p.app.isMobile,
 writerV8HomeSearchURL:(_,q)=>'https://www.google.com/search?q='+encodeURIComponent(q),
 writerV8HomeOpenURL:async(_plugin,url)=>{opened.push(url);return 'surfing';},
 Notice:class{},require:id=>id==='obsidian'?{setIcon:()=>{}}:{},
 console
});
test('Surfing is visible only when its plugin is enabled, never from a stale installed instance',()=>{
 assert.ok(utils.writerV8HomeSurfing(plugin(true)));
 assert.equal(utils.writerV8HomeSurfing(plugin(false)),null);
 const missing=plugin(true);missing.app.plugins.enabledPlugins=undefined;
 assert.equal(utils.writerV8HomeSurfing(missing),null);
 const mobile=plugin(true);mobile.app.isMobile=true;
 const view=Object.create(viewApi.prototype);view.plugin=mobile;view.homeSurfingEnabled=false;
 let rerenders=0;view.render=()=>rerenders++;
 view.syncSurfingVisibility();assert.equal(rerenders,0);
 mobile.app.isMobile=false;view.syncSurfingVisibility();assert.equal(rerenders,1);
 view.homeSurfingEnabled=true;mobile.app.plugins.enabledPlugins.clear();
 view.syncSurfingVisibility();assert.equal(rerenders,2);
});
test('a single fixed web address bar precedes the homepage heading; no selector survives',()=>{
 const bar=home.indexOf('this.renderSurfingBar(this.contentEl)');
 const heading=home.indexOf("const hero=this.contentEl.createDiv({cls:'writer-v8-home-hero'})");
 const vault=home.indexOf('this.renderSearch(top);');
 assert.ok(bar>=0&&bar<heading&&heading<vault);
 assert.doesNotMatch(home,/writer-v1203-home-search-modes|Web · Surfing|setMode\(.*web/);
 assert.doesNotMatch(css,/writer-v1203-home-search-modes/);
 assert.match(css,/\.writer-v1204-home-surfing-bar\{\s*position:sticky;top:0/);
 assert.match(home,/this\.syncSurfingVisibility\(\)/);
 assert.match(home,/if\(this\.homeSurfingEnabled\)this\.renderSurfingBar/);
});
test('address input accepts website or keywords by Enter, including focus and Escape',async()=>{
 opened.length=0;
 const view=Object.create(viewApi.prototype);
 view.plugin=plugin(true);
 const root=new Element(),bar=view.renderSurfingBar(root);
 assert.equal(bar,undefined);
 assert.equal(root.children.length,1);
 const address=root.children[0];
 const input=address.children.find(x=>x.tag==='input');
 const go=address.children.find(x=>x.tag==='button');
 assert.ok(input&&go);
 input.emit('focus');assert.equal(input.selected,true);
 input.value='writing research';
 input.emit('input');
 assert.equal(view.homeSurfingQuery,'writing research');
 assert.equal(input.emit('keydown',{key:'Enter'}).prevented,true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(opened[0],'https://www.google.com/search?q=writing%20research');
 assert.equal(view.homeSearchWebMode(),true);
 assert.equal(input.focused,true);
 assert.equal(input.emit('keydown',{key:'Escape'}).prevented,true);
 assert.equal(input.value,'');
 assert.equal(view.homeSurfingQuery,'');
});
test('note search remains independent and web search settings do not add top-level tabs',()=>{
 assert.match(home,/renderSearch\(parent\)\{/);
 assert.match(home,/writerV8HomeSearch\(files,q,this\.app\.metadataCache,12\)/);
 assert.match(home,/if\(writerV8HomeSurfing\(plugin\)&&!writerV8HomeIsMobile\(plugin\)\)\{/);
 assert.doesNotMatch(home,/Mostra Cofre\/Web|Adds Vault\/Web/);
});
