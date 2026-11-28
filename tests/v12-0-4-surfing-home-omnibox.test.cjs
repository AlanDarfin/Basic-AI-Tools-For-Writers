'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const home=fs.readFileSync('src/workspace/writing-home.js','utf8');
const util=fs.readFileSync('src/workspace/home-utilities.js','utf8');
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
 createEl(tag,opts={}){const element=new Element(opts);element.tag=tag;element.parent=this;this.children.push(element);return element;}
 createDiv(opts){return this.createEl('div',opts);}
 createSpan(opts){return this.createEl('span',opts);}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
 emit(type,fields={}){const e={key:'',preventDefault(){this.prevented=true;},...fields};
  for(const fn of this.listeners[type]||[])fn(e);return e;}
 querySelector(selector){return selector==='input.wb-search-bar'?
  this.children.find(x=>x.tag==='input'&&x.cls.includes('wb-search-bar')):null;}
 removeEventListener(type,handler){this.listeners[type]=(this.listeners[type]||[]).filter(fn=>fn!==handler);}
 blur(){this.blurredWhileConnected=this.isConnected;this.focused=false;this.emit('blur');}
 remove(){this.isConnected=false;for(const child of this.children)child.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
 focus(){this.focused=true;}
}
const View=vm.runInNewContext(home+'\nWriterV8HomeView',{
 ItemView:class{},writerUi:pt=>pt,writerV8HomeSurfing:utils.writerV8HomeSurfing,
 writerV8HomeIsMobile:p=>p.app.isMobile,Notice:class{},console,clearTimeout,clearInterval
});
test('Surfing is shown only while enabled on desktop; disabling removes it',()=>{
 assert.ok(utils.writerV8HomeSurfing(plugin(true)));
 assert.equal(utils.writerV8HomeSurfing(plugin(false)),null);
 const missing=plugin(true);missing.app.plugins.enabledPlugins=undefined;
 assert.equal(utils.writerV8HomeSurfing(missing),null);
 const p=plugin(true),view=Object.create(View.prototype);
 view.plugin=p;view.homeSurfingEnabled=true;view.homeSurfingMount={surfing:utils.writerV8HomeSurfing(p)};
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

test('rerender disposes only its native Surfing host, blurs before removal and preserves query',()=>{
 const view=Object.create(View.prototype);view.plugin=plugin(true);view.leaf={};
 const root=new Element(),other=root.createDiv({cls:'unrelated'});view.renderSurfingBar(root);
 const old=view.homeSurfingInput,callback=old.listeners.input[0];let closed=0;
 old.addEventListener('blur',()=>closed++);old.value='draft query';old.emit('input');old.focus();
 view.renderSurfingBar(root);
 assert.equal(closed,1);assert.equal(old.blurredWhileConnected,true);assert.equal(old.isConnected,false);
 assert.equal(old.listeners.input.length,0);assert.equal(root.children.length,2);assert.equal(root.children[0],other);
 assert.equal(view.homeSurfingInput.value,'draft query');old.value='stale';callback();assert.equal(view.homeSurfingQuery,'draft query');
 view.disposeSurfingBar();view.disposeSurfingBar();assert.equal(root.children.length,1);assert.equal(view.homeSurfingInput,null);
});
test('partial native mount failure cleans up the input and suppresses repeated attempts',()=>{
 const view=Object.create(View.prototype);view.plugin=plugin(true);view.leaf={};
 const surfing=utils.writerV8HomeSurfing(view.plugin);let input,closed=0;
 surfing.addHeaderAndSearchBar=adapter=>{
  input=adapter.titleContainerEl.createEl('input',{cls:'wb-search-bar'});input.addEventListener('blur',()=>closed++);input.focus();
  throw Error('native mount failure');
 };
 const root=new Element();view.renderSurfingBar(root);
 assert.equal(closed,1);assert.equal(input.blurredWhileConnected,true);assert.equal(root.children.length,0);
 assert.equal(view.homeSurfingInput,null);assert.equal(view.homeSurfingMount,null);assert.equal(view.homeSurfingFailed,surfing);
 let rerenders=0;view.render=()=>rerenders++;view.syncSurfingVisibility();assert.equal(rerenders,0);
});
test('replacing an enabled Surfing instance requires remounting the native header',()=>{
 const view=Object.create(View.prototype),p=plugin(true);view.plugin=p;view.leaf={};
 view.renderSurfingBar(new Element());let rerenders=0;view.render=()=>rerenders++;
 view.syncSurfingVisibility();assert.equal(rerenders,0);
 p.app.plugins.plugins.surfing=utils.writerV8HomeSurfing(plugin(true));view.syncSurfingVisibility();assert.equal(rerenders,1);
});
test('closing the homepage disposes the owned Surfing header before clearing view references',async()=>{
 const view=Object.create(View.prototype);view.plugin=plugin(true);view.leaf={};const root=new Element();
 view.renderSurfingBar(root);const input=view.homeSurfingInput;
 await view.onClose();
 assert.equal(input.blurredWhileConnected,true);assert.equal(root.children.length,0);assert.equal(view.homeSurfingInput,null);assert.equal(view.homeSurfingMount,null);
});
