'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const home=fs.readFileSync('src/v8/writing-home.js','utf8');
const util=fs.readFileSync('src/v8/home-utilities.js','utf8');
const css=fs.readFileSync('src/styles/v12-0-5-home-widgets.css','utf8');
const utils=vm.runInNewContext(util+'\n({writerV8HomeSurfing})',{URL,writerUi:(pt,en)=>en,console});
let nativeMounted=0,nativeEnter=0;
function plugin(enabled=true){
 const surfing={settings:{defaultSearchEngine:'Google'},addHeaderAndSearchBar(adapter){
  nativeMounted++;
  assert.equal(adapter.getViewType(),'empty');
  const field=adapter.titleContainerEl.createEl('input',{cls:'wb-search-bar'});
  field.addEventListener('keydown',event=>{if(event.key==='Enter')nativeEnter++;});
 }};
 return {app:{isMobile:false,plugins:{plugins:{surfing},enabledPlugins:new Set(enabled?['surfing']:[])}}};
}
class Element{
 constructor(opts={}){this.children=[];this.attrs=opts.attr||{};this.cls=opts.cls||'';this.listeners={};
  this.value='';this.isConnected=true;this.disabled=false;}
 createEl(tag,opts={}){const element=new Element(opts);element.tag=tag;this.children.push(element);return element;}
 createDiv(opts){return this.createEl('div',opts);}
 createSpan(opts){return this.createEl('span',opts);}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
 emit(type,fields={}){const e={key:'',preventDefault(){this.prevented=true;},...fields};
  for(const fn of this.listeners[type]||[])fn(e);return e;}
 querySelector(selector){return selector==='input.wb-search-bar'?
  this.children.find(x=>x.tag==='input'&&x.cls.includes('wb-search-bar')):null;}
 focus(){this.focused=true;}
}
const View=vm.runInNewContext(home+'\nWriterV8HomeView',{
 ItemView:class{},writerUi:pt=>pt,writerV8HomeSurfing:utils.writerV8HomeSurfing,
 writerV8HomeIsMobile:p=>p.app.isMobile,Notice:class{},console
});
test('Surfing is shown only while enabled on desktop; disabling removes it',()=>{
 assert.ok(utils.writerV8HomeSurfing(plugin(true)));
 assert.equal(utils.writerV8HomeSurfing(plugin(false)),null);
 const missing=plugin(true);missing.app.plugins.enabledPlugins=undefined;
 assert.equal(utils.writerV8HomeSurfing(missing),null);
 const p=plugin(true),view=Object.create(View.prototype);
 view.plugin=p;view.homeSurfingEnabled=true;
 let rerenders=0;view.render=()=>rerenders++;
 view.syncSurfingVisibility();assert.equal(rerenders,0);
 p.app.plugins.enabledPlugins.clear();
 view.syncSurfingVisibility();assert.equal(rerenders,1);
 p.app.isMobile=true;view.homeSurfingEnabled=false;
 view.syncSurfingVisibility();assert.equal(rerenders,1);
});
test('mounts the original Surfing HeaderBar instead of an imitation',()=>{
 nativeMounted=0;nativeEnter=0;
 const view=Object.create(View.prototype);view.plugin=plugin(true);view.leaf={};
 const root=new Element();
 view.renderSurfingBar(root);
 assert.equal(nativeMounted,1);
 assert.equal(root.children.length,1);
 const input=root.children[0].querySelector('input.wb-search-bar');
 assert.ok(input);assert.equal(view.homeSurfingInput,input);
 input.value='http://example.org';
 input.emit('input');assert.equal(view.homeSurfingQuery,'http://example.org');
 input.emit('keydown',{key:'Enter'});assert.equal(nativeEnter,1);
 assert.equal(view.homeSearchWebMode(),true);
 assert.equal(input.focused,true);
 assert.doesNotMatch(home,/writer-v1204-home-surfing-input|writer-v1204-home-surfing-go/);
 assert.match(css,/\.writer-v1205-native-surfing-host input\.wb-search-bar/);
});
test('native Surfing bar is before the hero and vault search stays independent',()=>{
 const header=home.indexOf('this.renderSurfingBar(this.contentEl)');
 const hero=home.indexOf("const hero=this.contentEl.createDiv({cls:'writer-v8-home-hero'})");
 const vault=home.indexOf('this.renderSearch(top);');
 assert.ok(header>=0&&header<hero&&hero<vault);
 assert.doesNotMatch(home,/Web · Surfing|writer-v1203-home-search-modes/);
 assert.match(home,/writerV8HomeSearch\(files,q,this\.app\.metadataCache,12\)/);
 assert.match(home,/if\(writerV8HomeSurfing\(plugin\)&&!writerV8HomeIsMobile\(plugin\)\)\{/);
});
