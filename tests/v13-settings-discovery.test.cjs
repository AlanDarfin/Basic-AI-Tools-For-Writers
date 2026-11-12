'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');
const ui=read('src/v13/ui-foundation.js'),search=read('src/v5/workspace-ux.js');
const catalog=read('src/v13/settings-catalog.js'),index=read('src/v13/settings-search-index.js');

class Element{
 constructor(tag='div',options={},document=null){
  this.tagName=tag.toUpperCase();this.options=options;this.attributes={...options.attr};this.ownText=options.text||'';
  this.ownerDocument=document;this.children=[];this.parentElement=null;this.events={};this.value='';this.hidden=false;
  this.dataset={};this.disabled=false;this.open=false;this.scrolls=0;
  const classes=new Set((options.cls||'').split(/\s+/).filter(Boolean));
  this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)};
 }
 get textContent(){return this.ownText+this.children.map(child=>child.textContent).join('');}
 get isConnected(){let parent=this;while(parent.parentElement)parent=parent.parentElement;return parent===this.ownerDocument?.body;}
 createEl(tag,options={}){const node=new Element(tag,options,this.ownerDocument);node.parentElement=this;this.children.push(node);return node;}
 createDiv(options){return this.createEl('div',options);}
 createSpan(options){return this.createEl('span',options);}
 empty(){for(const child of this.children)child.parentElement=null;this.children=[];this.ownText='';}
 setText(value){this.empty();this.ownText=String(value);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 getAttribute(name){return this.attributes[name]??null;}
 addEventListener(type,callback){(this.events[type]??=[]).push(callback);}
 descendants(){return this.children.flatMap(child=>[child,...child.descendants()]);}
 contains(node){return node===this||this.descendants().includes(node);}
 matches(selectors){return selectors.split(',').some(selector=>{
  let value=selector.trim();
  if(value.includes(':not(:disabled)')&&this.disabled)return false;
  if(value.includes(':not([type="hidden"])')&&this.getAttribute('type')==='hidden')return false;
  if(value.includes(':not([aria-disabled="true"])')&&this.getAttribute('aria-disabled')==='true')return false;
  value=value.replace(/:not\([^)]*\)/g,'');
  const tag=/^[a-z]+/i.exec(value);if(tag&&this.tagName.toLowerCase()!==tag[0].toLowerCase())return false;
  for(const [,name] of value.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(name))return false;
  for(const [,name,expected] of value.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)){
   if(expected!==undefined&&this.getAttribute(name)!==expected)return false;
   if(expected===undefined&&this.getAttribute(name)==null)return false;
  }
  return true;
 });}
 querySelectorAll(selector){return this.descendants().filter(node=>node.matches(selector));}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
 focus(){this.ownerDocument.activeElement=this;}
 scrollIntoView(){this.scrolls++;}
 async activate(){for(const handler of this.events.click||[])await handler({target:this});}
 click(){for(const handler of this.events.click||[])handler({target:this});for(const handler of this.parentElement?.events.click||[])handler({target:this});}
}
class Setting{
 constructor(parent){this.row=parent.createDiv({cls:'setting-item'});this.name=this.row.createDiv({cls:'setting-item-name'});this.description=this.row.createDiv({cls:'setting-item-description'});this.controls=this.row.createDiv({cls:'setting-item-control'});}
 setName(value){this.name.setText(value);return this;}
 setDesc(value){this.description.setText(value);return this;}
 addDropdown(register){
  const select=this.controls.createEl('select');
  const control={selectEl:select,addOption:(value,label)=>{select.createEl('option',{text:label,attr:{value}});return control;},setValue:value=>{select.value=value;return control;},onChange:callback=>{select.change=callback;return control;}};
  register(control);return this;
 }
 addButton(register){
  const button=this.controls.createEl('button');
  const control={buttonEl:button,setButtonText:text=>{button.setText(text);return control;},setCta:()=>control,setDisabled:value=>{button.disabled=value;return control;},onClick:callback=>{button.addEventListener('click',callback);return control;}};
  register(control);return this;
 }
}
function fixture(language='en'){
 const document={activeElement:null,defaultView:{getComputedStyle:node=>({direction:node.direction||'ltr'})}};
 document.body=new Element('body',{},document);document.activeElement=document.body;
 const timers=[],notices=[];
 const context={console,writerUi:(pt,en)=>language==='pt'?pt:en,Setting,
  require:()=>({setIcon(){}}),setTimeout:fn=>{timers.push(fn);return timers.length;},
  Notice:class{constructor(text){notices.push(text);}},writerV5RefreshEditors(){}};
 const api=vm.runInNewContext(ui+catalog+index+search+'\n({writerWorkspaceBindSearch,writerV1048SearchIndex,writerV1048SearchReveal,writerV131RankSettings,writerV13BindSettingsTabs,writerV137SyncSettingsTabs,writerWorkspaceMerge,WriterWorkspaceProfiles,WRITER_SETTINGS_CATALOG,WRITER_SETTINGS_SEARCH_INDEX})',context);
 return {document,api,timers,notices,root:document.body.createDiv()};
}
const row=(parent,title)=>{
 const setting=new Setting(parent).setName(title);return {row:setting.row,control:setting.controls.createEl('input',{attr:{type:'text'}})};
};

test('settings are searchable on a fresh page in both languages, including renamed and disabled-feature destinations',()=>{
 for(const language of ['pt','en']){
  const h=fixture(language),sections=h.api.WRITER_SETTINGS_CATALOG.map(item=>[item.id,language==='pt'?item.pt:item.en]);
  const entries=h.api.writerV1048SearchIndex(sections,h.root,'general',new Map());
  for(const [query,id] of [['Máximo de notas lembradas','cursor'],['Maximum remembered notes','cursor'],['Pasta principal','study'],['Root folder','study']]){
   const found=h.api.writerV131RankSettings(entries,query,40);
   assert.ok(found.some(item=>item.id===id),language+': '+query);
  }
  assert.ok(entries.some(item=>item.id==='study'&&item.source==='catalog'));
  assert.ok(entries.some(item=>item.id==='cursor'&&item.source==='catalog'));
 }
});

test('search keyboard activation ignores IME and modified Enter while plain Enter still opens a legacy alias',()=>{
 const h=fixture(),sections=h.api.WRITER_SETTINGS_CATALOG.map(item=>[item.id,item.en]);let active='general';const opened=[];
 const search=h.api.writerWorkspaceBindSearch(h.root,sections,id=>{active=id;opened.push(id);},()=>h.root,()=>active);
 search.input.value='keysho';search.update();
 for(const event of [{isComposing:true},{keyCode:229},{altKey:true},{ctrlKey:true},{metaKey:true},{shiftKey:true}]){
  let prevented=false;search.input.events.keydown[0]({key:'Enter',...event,preventDefault(){prevented=true;}});
  assert.equal(prevented,false);assert.equal(search.input.value,'keysho');assert.equal(opened.length,0);
 }
 search.input.events.keydown[0]({key:'Enter',preventDefault(){}});
 assert.deepEqual(opened,['keyshots']);assert.equal(search.input.value,'');
 const target=h.root.querySelector('.writer-v1050-result-target');
 const before=opened.length;
 for(const event of [{isComposing:true},{keyCode:229},{ctrlKey:true},{shiftKey:true}])target.events.keydown[0]({key:' ',...event,preventDefault(){throw Error('Composition was intercepted');}});
 assert.equal(opened.length,before);
});

test('revealing a result opens nested details, replaces the previous highlight and focuses its control',()=>{
 const h=fixture(),first=row(h.root,'First');
 h.api.writerV1048SearchReveal(h.root,'First',true);
 assert.equal(h.document.activeElement,first.control);
 const outer=h.root.createEl('details'),inner=outer.createEl('details'),second=row(inner,'Second');
 assert.equal(h.api.writerV1048SearchReveal(h.root,'Second',true),true);
 assert.equal(outer.open,true);assert.equal(inner.open,true);
 assert.equal(first.row.classList.contains('writer-v1048-search-target'),false);
 assert.equal(second.row.classList.contains('writer-v1048-search-target'),true);
 assert.equal(h.document.activeElement,second.control);
 const direct=h.root.createEl('button',{text:'Test connection'});
 assert.equal(h.api.writerV1048SearchReveal(h.root,'Test connection',true),true);
 assert.equal(h.document.activeElement,direct);
 const detail=h.root.createEl('details');detail.createEl('summary',{text:'Advanced options'});
 h.api.writerV1048SearchReveal(h.root,'Advanced options',true);assert.equal(detail.open,true);
});

test('a delayed result cannot steal focus after another page or a new query is selected',()=>{
 const h=fixture();let active='general',target;const panel=h.root.createDiv();
 const search=h.api.writerWorkspaceBindSearch(h.root,[['general','Get started'],['cursor','Cursor position']],id=>{active=id;panel.empty();target=row(panel,'Maximum remembered notes');},()=>panel,()=>active);
 const enter=()=>search.input.events.keydown[0]({key:'Enter',preventDefault(){}});
 search.input.focus();search.input.value='Maximum remembered notes';search.update();enter();
 active='general';panel.empty();while(h.timers.length)h.timers.shift()();assert.notEqual(h.document.activeElement,target.control);
 search.input.focus();search.input.value='Maximum remembered notes';search.update();enter();
 search.input.value='another query';while(h.timers.length)h.timers.shift()();assert.notEqual(h.document.activeElement,target.control);
 search.input.focus();search.input.value='Maximum remembered notes';search.update();enter();
 while(h.timers.length)h.timers.shift()();assert.equal(h.document.activeElement,target.control);
});

test('settings tabs use one tab stop, logical RTL arrows and preserve composition or modified keys',()=>{
 for(const direction of ['ltr','rtl']){
  const h=fixture(),strip=h.root.createDiv();strip.direction=direction;
  const buttons=Array.from({length:4},(_,i)=>strip.createEl('button',{attr:{role:'tab','aria-selected':String(i===0)}}));
  buttons[1].disabled=true;
  for(const button of buttons)button.addEventListener('click',()=>{for(const other of buttons)other.setAttribute('aria-selected',String(other===button));});
  h.api.writerV13BindSettingsTabs(strip,null);h.api.writerV13BindSettingsTabs(strip,null);
  const press=(key,index=0,extra={})=>{let prevented=false;strip.events.keydown[0]({key,target:buttons[index],...extra,preventDefault(){prevented=true;}});return prevented;};
  assert.equal(strip.events.keydown.length,1);assert.equal(buttons.filter(item=>item.tabIndex===0).length,1);
  press('ArrowRight');assert.equal(h.document.activeElement,buttons[direction==='rtl'?3:2]);
  assert.equal(buttons.filter(item=>item.tabIndex===0).length,1);
  press('Home',3);assert.equal(h.document.activeElement,buttons[0]);
  press('End');assert.equal(h.document.activeElement,buttons[3]);
  for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{isComposing:true},{keyCode:229}])assert.equal(press('Home',3,extra),false);
 }
});

test('writing profiles refresh Apply/Restore and saved choices without replacing the settings page',async()=>{
 const h=fixture(),settings={keyshots:{enabled:false,shortcuts:false,preset:'none'},easyTyping:{enabled:false}};
 h.api.writerWorkspaceMerge(settings);let pageRebuilds=0;
 const plugin={settings,app:{},saveSettings:async()=>{},writerSettingsTab:{display(){pageRebuilds++;}}};
 const profiles=new h.api.WriterWorkspaceProfiles(plugin);profiles.renderSettings(h.root);
 const action=name=>h.root.querySelector('[data-profile-action="'+name+'"]');
 assert.equal(action('restore').disabled,true);action('apply').focus();await action('apply').activate();
 assert.equal(action('restore').disabled,false);assert.equal(h.document.activeElement,action('apply'));
 assert.equal(settings.keyshots.enabled,true);
 action('restore').focus();await action('restore').activate();assert.equal(action('restore').disabled,true);assert.equal(settings.keyshots.enabled,false);
 assert.equal(h.document.activeElement,action('choose'));
 const external=h.document.body.createEl('input');external.focus();
 await profiles.saveCustom('My settings');assert.equal(h.document.activeElement,external);
 assert.ok(h.root.querySelectorAll('option').some(option=>option.getAttribute('value')==='custom:My settings'));
 await action('delete').activate();assert.equal(settings.workspaceProfiles.saved.length,0);assert.equal(pageRebuilds,0);
});

test('profile commands cannot redraw another settings section after their original panel is removed',async()=>{
 const h=fixture(),settings={keyshots:{enabled:false}};h.api.writerWorkspaceMerge(settings);
 const profiles=new h.api.WriterWorkspaceProfiles({settings,app:{},saveSettings:async()=>{}});
 profiles.renderSettings(h.root);h.root.empty();const other=h.root.createEl('p',{text:'Another page'});
 await profiles.saveCustom('From command');assert.equal(h.root.children.length,1);assert.equal(h.root.children[0],other);
});

test('source indexing extracts bilingual controls and loops without evaluating callbacks or unrelated modals',()=>{
 const {tokenize,extract,scope}=require('../scripts/settings-search-index.js');
 const source=`
 const sideEffect=fetch('https://invalid.example/should-not-run');
 function renderSettings(plugin,panel){
  const toggle=(key,pt,en)=>new Setting(panel).setName(writerUi(pt,en)).addToggle(x=>x.onChange(()=>{throw Error('Do not run');}));
  new Setting(panel).setName(writerUi('Destino','Destination')).setDesc(writerUi('Descrição','Description'));
  for(const [key,pt,en] of [['enabled','Ativar','Enable'],['scroll','Rolagem','Scroll']])new Setting(panel).setName(writerUi(pt,en));
  toggle('quotes','Aspas','Quotes');
 }
 function unrelatedModal(){new Setting(panel).setName(writerUi('Segredo do modal','Unrelated modal'));}
 `;
 const model=tokenize(source),result=extract(model,scope(model,'renderSettings'));
 const names=new Set(result.map(item=>item.titleEn));
 assert.deepEqual([...names].sort(),['Destination','Enable','Quotes','Scroll']);
 assert.equal(result.find(item=>item.titleEn==='Destination').descriptionPt,'Descrição');
});

test('generated labels cover every settings route and keep provider credentials out of model-only results',()=>{
 const h=fixture(),entries=h.api.WRITER_SETTINGS_SEARCH_INDEX;
 for(const section of h.api.WRITER_SETTINGS_CATALOG)assert.ok(entries.some(item=>item.id===section.id),'No searchable options for '+section.id);
 assert.ok(entries.some(item=>item.id==='providers'&&item.titleEn==='API key'));
 assert.ok(!entries.some(item=>item.id==='models'&&item.titleEn==='API key'));
 assert.ok(entries.every(item=>Object.values(item).every(value=>typeof value==='string')));
 const allowed=new Set(h.api.WRITER_SETTINGS_CATALOG.map(item=>item.id));
 assert.ok(entries.every(item=>allowed.has(item.id)));
});
