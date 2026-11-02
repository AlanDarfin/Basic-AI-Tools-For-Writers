'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/writing-home.js','utf8');
class Element {
 constructor(tag='div',opts={},parent=null){
  this.tag=tag;this.cls=opts.cls||'';this.text=opts.text||'';this.children=[];
  this.attrs=opts.attr||{};this.parent=parent;this.listeners={};this.value='';this.hidden=false;
  this.classList={toggle:(name,on)=>{
   const set=new Set(this.cls.split(/\s+/).filter(Boolean));
   if(on)set.add(name);else set.delete(name);
   this.cls=[...set].join(' ');
  }};
 }
 createEl(tag,opts={}){const c=new Element(tag,opts,this);this.children.push(c);return c;}
 createDiv(opts){return this.createEl('div',opts);}
 createSpan(opts){return this.createEl('span',opts);}
 addClass(cls){this.cls+=' '+cls;}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
 emit(type,fields={}){const event={key:'',target:this,preventDefault(){this.prevented=true;},...fields};
  for(const fn of this.listeners[type]||[])fn(event);return event;}
 setText(text){this.text=text;}
 setAttribute(key,value){this.attrs[key]=value;}
 scrollIntoView(){this.wasScrolled=true;}
 empty(){this.children=[];}
}
class TFile {constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension='md';}}
class ItemView {}
const View=vm.runInNewContext(source+'\nWriterV8HomeView',{
 ItemView,TFile,writerUi:pt=>pt,writerModuleOn:()=>true,
 writerV8HomeValidURL:()=>'',writerV8HomeOpenURL:async()=>{},console,
 require:()=>({setIcon:()=>{}}),
});
function fixture(){
 const files=[new TFile('Journal/Sem título.md'),new TFile('Book/Sem título.md'),new TFile('Book/Semanário.md')];
 const opened=[];
 const plugin={settings:{v8Finish:{homeOrder:['continue','recent'],homeFavorites:[]}},app:{
  vault:{getMarkdownFiles:()=>files},
  workspace:{getLeaf:()=>({openFile:file=>opened.push(file.path)})},
  metadataCache:{getFileCache:()=>({})}
 }};
 const view=Object.create(View.prototype);view.app=plugin.app;view.plugin=plugin;
 view.saveSoon=()=>{};
 const root=new Element('div');view.renderSearch(root);
 const card=root.children[0],input=card.children.find(el=>el.tag==='input');
 const results=card.children.find(el=>el.cls.includes('writer-v901-home-search-results'));
 const status=card.children.find(el=>el.cls.includes('writer-v901-home-search-status'));
 return {files,opened,card,input,results,status};
}
test('homepage search gives a full-width region before the hero, not alongside the calendar',()=>{
 const begin=source.indexOf('this.renderSearch(top);');
 const hero=source.indexOf("const hero=this.contentEl.createDiv({cls:'writer-v8-home-hero'})");
 const clock=source.indexOf('writerV8HomeRenderCalendar(this,schedule)');
 assert.ok(begin>=0&&begin<hero&&hero<clock);
 const css=fs.readFileSync('styles.css','utf8');
 assert.match(css,/writer-v8-home-search-region/);
 assert.match(css,/writer-v901-home-result\.is-selected/);
});
test('search shows full paths to distinguish equally named notes',()=>{
 const f=fixture();f.input.value='sem';f.input.emit('input');
 assert.equal(f.results.children.length,3);
 const names=f.results.children.map(row=>row.children[0].children[1].children[0].text);
 const paths=f.results.children.map(row=>row.children[0].children[1].children[1].text);
 assert.ok(names.includes('Sem título'));
 assert.ok(paths.includes('Journal/Sem título.md')&&paths.includes('Book/Sem título.md'));
 assert.match(f.status.text,/Enter para abrir/);
 assert.equal(f.results.children[0].attrs['aria-current'],'true');
});
test('arrow keys wrap the selected match and Enter opens exactly that note',()=>{
 const f=fixture();f.input.value='sem';f.input.emit('input');
 const firstPath=f.status.text;
 assert.equal(f.input.emit('keydown',{key:'ArrowDown'}).prevented,true);
 assert.notEqual(f.status.text,firstPath);
 assert.equal(f.results.children[1].attrs['aria-current'],'true');
 assert.equal(f.input.emit('keydown',{key:'Enter'}).prevented,true);
 assert.equal(f.opened.length,1);
 assert.ok(f.status.text.includes(f.opened[0]));
 assert.equal(f.input.emit('keydown',{key:'ArrowUp'}).prevented,true);
 assert.equal(f.results.children[0].attrs['aria-current'],'true');
 assert.equal(f.input.emit('keydown',{key:'Escape'}).prevented,true);
 assert.equal(f.input.value,'');assert.equal(f.results.hidden,true);
});
test('favorite buttons remain available and do not open notes',()=>{
 const f=fixture();f.input.value='sem';f.input.emit('input');
 const star=f.results.children[0].children[1];
 star.emit('click');
 assert.equal(f.opened.length,0);
 assert.ok(f.card.children[1].children.length>0);
});
