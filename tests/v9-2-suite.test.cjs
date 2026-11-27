'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const files=['src/v9/explorer-favorites-preview.js','src/v9/interactive-widgets.js','src/v9/research-style.js','src/v9/session-drafts.js'];
const sources=files.map(read);
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.parent={path:path.split('/').slice(0,-1).join('/')};}}
class TFolder{constructor(path){this.path=path;this.name=path.split('/').at(-1);this.children=[];}}
const novel=new TFile('Novel/Chapter.md'),folder=new TFolder('Novel'),folderNote=new TFile('Novel/Novel.md');
const cache={frontmatter:{description:'Folder description from YAML',tags:['zotero'],author:'Researcher',title:'Research work'},tags:[]};
const vault={getAbstractFileByPath:path=>[novel,folder,folderNote].find(x=>x.path===path)||null,getMarkdownFiles:()=>[novel,folderNote],cachedRead:async()=> '# Highlights\n> A passage explicitly marked as a highlight in Zotero.'};
const plugin={settings:{v8Finish:{homeFavorites:['Novel/Chapter.md']}},app:{vault,metadataCache:{getFileCache:()=>cache}}};
class MarkdownRenderChild{registerEvent(off){this.unload=off;}}
const context={TFile,TFolder,Date,Set,Map,Number,String,Object,Array,Math,RegExp,Event,console,writerUi:(a,b)=>b,
 writerModuleOn:()=>true,writerV7FolderNote:()=>folderNote,WRITER_V8_HOME_VIEW:'home',
 ItemView:class{},Setting:class{},MarkdownRenderer:{render:async()=>{}},parseYaml:JSON.parse,require:()=>({setIcon:()=>{},MarkdownRenderChild})};
const api=vm.runInNewContext(sources.join('\n')+'\n({writerV92ExplorerMerge,writerV92Favorite,writerV92PreviewValue,writerV921PreviewSource,writerV921PreviewBody,writerV921ResolveImage,writerV921PreviewImage,writerV92BlockOptions,writerV92ProgressData,writerV92BlocksMerge,writerV92MetaToken,writerV92RegisterBlocks,writerV92ZoteroExtract,writerV92ZoteroIsSource,writerV92ResearchMerge,writerV92ResearchStyleApply,writerV92ResearchRegister,writerV92SessionMerge})',context);
test('9.2.x metadata, modules and CSS',()=>{
 const manifest=JSON.parse(read('manifest.json')),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),versions=JSON.parse(read('versions.json'));
 assert.match(manifest.version,/^\d+\.\d+\.\d+(?:-(?:beta|rc)\.\d+)?$/);assert.equal(pkg.version,manifest.version);assert.equal(lock.version,manifest.version);
 assert.equal(versions[manifest.version],'1.11.4');
 const main=read('main.js'),css=read('styles.css');
 for(const path of files)assert.ok(main.includes('// v3 module: '+path));
 for(const name of ['writerV92ExplorerRegister(this)','writerV92RegisterBlocks(this)','writerV92ResearchRegister(this)','writerV92SessionRegister(this)'])assert.ok(main.includes(name));
 for(const name of ['writer-v92-favorite','writer-v92-file-preview','writer-v92-progress','writer-v92-session'])assert.ok(css.includes(name));
 const {sourceIds}=require('../scripts/js-manifest.js');
 assert.ok(sourceIds.includes('src/v9/session-drafts.js'));
 assert.ok(read('scripts/css-manifest.js').includes('v9-2-suite.css'));
});
test('favorites reuse homepage list and folder note descriptions',()=>{
 const cfg=api.writerV92ExplorerMerge(plugin.settings);
 assert.equal(cfg.favoriteIcon,'star');assert.equal(cfg.previewMode,'folder');
 assert.equal(api.writerV92Favorite(plugin,novel.path),true);
 assert.equal(api.writerV92PreviewValue(plugin,folder),'Folder description from YAML');
 assert.equal(api.writerV92PreviewValue(plugin,novel),'');
 cfg.previewMode='all';assert.equal(api.writerV92PreviewValue(plugin,novel),'Folder description from YAML');
 cfg.previewMode='off';assert.equal(api.writerV92PreviewValue(plugin,folder),'');
});
test('progressbar supports manual, year, month, week and date',()=>{
 const opts=api.writerV92BlockOptions('kind: manual\nvalue: 40\nmin: 0\nmax: 80\nname: Progress');
 assert.equal(api.writerV92ProgressData(opts).percent,50);
 assert.equal(api.writerV92ProgressData({kind:'day-year'},new Date(2024,11,31)).max,366);
 assert.equal(api.writerV92ProgressData({kind:'day-week'},new Date(2026,10,2)).value,1);
 assert.equal(api.writerV92ProgressData({kind:'month'},new Date(2026,10,2)).value,11);
 assert.equal(api.writerV92ProgressData({kind:'day-custom',min:'2026-11-01',max:'2026-11-11'},new Date(2026,10,6)).percent,55);
});
test('calendar progress counts whole local dates across daylight saving and accepts a one-day period',()=>{
 const original=process.env.TZ;
 try{
  process.env.TZ='America/New_York';
  const today=new Date(2026,2,9,12);
  assert.equal(api.writerV92ProgressData({kind:'day-year'},today).value,68);
  assert.equal(api.writerV92ProgressData({kind:'day-month'},today).value,9);
  assert.equal(api.writerV92ProgressData({kind:'day-custom',min:'2026-03-07',max:'2026-03-10'},today).percent,75);
  assert.equal(api.writerV92ProgressData({kind:'day-custom',min:'2026-03-09',max:'2026-03-09'},today).percent,100);
  assert.equal(api.writerV92ProgressData({kind:'day-custom',min:'2026-02-30',max:'2026-03-09'},today).percent,0);
 }finally{
  if(original===undefined)delete process.env.TZ;else process.env.TZ=original;
 }
});
test('Zotero quotes must be explicit highlights with source',()=>{
 const cfg=api.writerV92ResearchMerge(plugin.settings);cfg.zoteroQuotes=true;
 assert.equal(api.writerV92ZoteroIsSource(plugin,folderNote),true);
 const text='# Abstract\nSome unquoted abstract text.\n# Highlights\n> A passage explicitly marked as a highlight in Zotero.';
 const quotes=api.writerV92ZoteroExtract(plugin,folderNote,text);
 assert.equal(quotes.length,1);
 assert.match(quotes[0][0],/explicitly marked/);
 assert.equal(quotes[0][2],folderNote.path);
 assert.equal(api.writerV92ZoteroExtract(plugin,folderNote,'# Abstract\nThis is a normal sentence.').length,0);
});
test('session drafts never delete existing vault files',()=>{
 assert.equal(api.writerV92SessionMerge({}).enabled,true);
 const src=read('src/v9/session-drafts.js');
 assert.doesNotMatch(src,/vault\.(delete|trash|modify|process)\(/);
 assert.match(src,/vault\.create\(/);
 assert.match(src,/Confirm discard/);
});
test('blocks do not execute arbitrary JS actions',()=>{
 const cfg=api.writerV92BlocksMerge({});
 assert.equal(cfg.metaFields,true);
 const src=read('src/v9/interactive-widgets.js');
 assert.match(src,/processFrontMatter/);
 assert.doesNotMatch(src,/eval\(|new Function\(/);
 for(const type of ['columns','progressbar','widgets','meta-field'])assert.ok(src.includes("register('"+type+"'"));
});

test('inline field parser accepts only explicit current-note property bindings',()=>{
 const parse=token=>JSON.parse(JSON.stringify(api.writerV92MetaToken(token)));
 assert.deepEqual(parse('VIEW[chapter-title]'),{key:'chapter-title',type:'view'});
 assert.equal(parse('INPUT[toggle:done]').type,'toggle');
 assert.deepEqual(parse('INPUT[slider(-2,4,0.5):progress]'),{key:'progress',type:'slider',min:-2,max:4,step:.5});
 assert.deepEqual(parse('INPUT[select(Ready,Draft):phase]'),{key:'phase',type:'select',options:['Ready','Draft']});
 for(const invalid of ['VIEW[other.md#title]','VIEW[title + done]','VIEW[chapter.title]','VIEW[constructor]',
  'INPUT[toggle:prototype]','INPUT[userScript:done]','INPUT[text(alert(1)):done]','INPUT[select:done]',
  'INPUT[slider(4,2):done]','INPUT[slider(0,1,9):done]'])assert.equal(parse(invalid),null,invalid);
});

function metaSection(){
 class Element{
  constructor(tag,text=''){this.tag=tag;this.nodeValue=tag==='#text'?text:null;this.textContent=text;this.children=[];this.events={};this.attrs={};this.dataset={};}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  closest(selector){return selector.split(',').includes(this.tag)?this:this.parentElement?.closest(selector);}
  createEl(tag,options){const el=new Element(tag,options?.text);el.attrs={...options?.attr};this.append(el);return el;}
  createSpan(){return this.createEl('span');}
  createDiv(){return this.createEl('div');}
  setText(value){this.textContent=value;}
  setAttribute(key,value){this.attrs[key]=value;}
  addEventListener(name,listener){this.events[name]=listener;}
  dispatchEvent(event){this.events[event.type]?.(event);}
  replaceWith(node){const siblings=this.parentElement.children;siblings.splice(siblings.indexOf(this),1,...(node.tag==='fragment'?node.children:[node]));}
 }
 const root=new Element('p'),text=(value)=>new Element('#text',value);
 root.ownerDocument={
  createTreeWalker(){
   const entries=root.children.flatMap(el=>el.children.length?el.children:[el]).filter(el=>el.tag==='#text');
   return {nextNode(){this.currentNode=entries.shift();return Boolean(this.currentNode);}};
  },
  createElement:tag=>new Element(tag),createTextNode:text,createDocumentFragment:()=>new Element('fragment')
 };
 const inline=text('Check INPUT[toggle:done]. Value: VIEW[done]. VIEW[constructor].');
 const literal=new Element('code');literal.append(text('INPUT[toggle:done]'));
 root.append(inline,literal);
 return {root,inline,literal,Element};
}

test('widget counters with a shared ID update both previews and restore the configured start value',()=>{
 const {Element}=metaSection(),first=new Element('div'),second=new Element('div'),processors=new Map(),settings={};
 api.writerV92BlocksMerge(settings);
 const plugin={settings,app:{workspace:{getLeavesOfType:()=>[first,second].map(root=>({view:{containerEl:{
  querySelectorAll:()=>root.children
 }}}))}},saveSettings(){},registerMarkdownCodeBlockProcessor:(name,processor)=>processors.set(name,processor)};
 api.writerV92RegisterBlocks(plugin);
 const source='type: counter\nid: writing\nstartvalue: 10\nincrement: 2';
 processors.get('widgets')(source,first,{});
 processors.get('widgets')(source,second,{});
 const controls=first.children[0].children,other=second.children[0].children[0];
 assert.equal(other.textContent,'10');
 assert.equal(controls[2].attrs['aria-label'],'Increase');
 controls[2].events.click();
 assert.equal(controls[0].textContent,'12');assert.equal(other.textContent,'12');
 controls[3].events.click();
 assert.equal(other.textContent,'10');
});

test('YAML block number fields ignore blanks and their read-only views refresh when the note changes',()=>{
 const {Element}=metaSection(),view=new Element('div'),editor=new Element('div'),processors=new Map(),settings={};
 api.writerV92BlocksMerge(settings);
 const frontmatter={score:7};let changed,child;
 const plugin={settings,app:{vault:{getAbstractFileByPath:()=>novel},metadataCache:{
  getFileCache:()=>({frontmatter}),on:(_event,listener)=>{changed=listener;return ()=>{changed=null;};}
 },fileManager:{processFrontMatter:async(file,write)=>{write(frontmatter);changed(file);}}},
 registerMarkdownCodeBlockProcessor:(name,processor)=>processors.set(name,processor)};
 api.writerV92RegisterBlocks(plugin);
 const render=processors.get('meta-field');
 const ctx={sourcePath:novel.path,addChild:value=>{child=value;}};
 render('property: score\ntype: view',view,ctx);
 render('property: score\ntype: number',editor,ctx);
 const field=editor.children[0].children.find(el=>el.tag==='input');
 const output=view.children[0].children.find(el=>el.tag==='span');
 assert.equal(field.step,'any');assert.equal(output.textContent,'7');
 field.value='';field.events.change();
 assert.equal(frontmatter.score,7);
 field.value='8.5';field.events.change();
 assert.equal(frontmatter.score,8.5);assert.equal(output.textContent,'8.5');
 child.unload();assert.equal(changed,null);
});

test('registered inline widgets respect opt-in, save the correct note, and refresh linked output',()=>{
 const {root,inline,literal}=metaSection();
 const settings={},cfg=api.writerV92BlocksMerge(settings);
 const frontmatter={done:false,other:'preserved'},other=new TFile('Other.md');
 let currentFile=novel,postprocess,changed,child;
 const p={settings,app:{
  vault:{getAbstractFileByPath:path=>path===novel.path?currentFile:other},
  metadataCache:{getFileCache:()=>({frontmatter}),on:(_event,listener)=>{changed=listener;return ()=>{changed=null;};}},
  fileManager:{processFrontMatter:async(file,write)=>{assert.equal(file,novel);write(frontmatter);changed(file);}}
 },registerMarkdownPostProcessor:callback=>{postprocess=callback;}};
 const ctx={sourcePath:novel.path,addChild:value=>{child=value;}};
 api.writerV92RegisterBlocks(p);
 postprocess(root,ctx);
 assert.equal(root.children[0],inline);
 cfg.inlineMetaFields=true;
 postprocess(root,ctx);
 const [input,view]=root.children.filter(el=>el.className==='writer-v92-meta-inline').map(el=>el.children[0]);
 assert.equal(input.type,'checkbox');
 assert.equal(input.attrs['aria-label'],'done');
 assert.equal(input.checked,false);
 assert.equal(view.textContent,'false');
 assert.equal(literal.children[0].nodeValue,'INPUT[toggle:done]');
 assert.ok(root.children.some(node=>node.nodeValue?.includes('VIEW[constructor]')));
 input.checked=true;input.events.change();
 assert.deepEqual(frontmatter,{done:true,other:'preserved'});
 assert.equal(view.textContent,'true');
 currentFile=other;input.checked=false;input.events.change();
 assert.equal(frontmatter.done,true);
 child.unload();
 assert.equal(changed,null);
});

test('legacy fences leave unsupported blocks alone and only edit their named frontmatter field',async()=>{
 const {root,Element}=metaSection(),settings={};
 const cfg=api.writerV92BlocksMerge(settings);
 const makeFence=(lang,spec)=>{
  const pre=new Element('pre'),code=new Element('code',JSON.stringify(spec));
  code.classList=new Set(['language-'+lang]);code.classList.contains=key=>code.classList.has(key);
  pre.append(code);root.append(pre);return code;
 };
 const field=makeFence('meta-bind',{fields:[{key:'done',type:'toggle'},{key:'untrusted.path',type:'number'}]});
 const increment=makeFence('meta-bind-button',{property:'doneCount',action:'increment',step:2,label:'Add'});
 const badAction=makeFence('meta-bind-button',{property:'done',action:'command',command:'delete-note'});
 const badValue=makeFence('meta-bind-button',{property:'done',action:'set',value:{nested:true}});
 const original=new Set(),frontmatter={done:false,doneCount:10,other:'preserved'};
 let listener;
 const p={settings,app:{
  plugins:{enabledPlugins:original},vault:{getAbstractFileByPath:()=>novel},
  metadataCache:{getFileCache:()=>({frontmatter})},
  fileManager:{processFrontMatter:async(file,write)=>{assert.equal(file,novel);write(frontmatter);}}
 },registerMarkdownPostProcessor:callback=>{listener=callback;}};
 const ctx={sourcePath:novel.path};
 root.querySelectorAll=()=>[field,increment,badAction,badValue];
 api.writerV92RegisterBlocks(p);
 listener(root,ctx);
 assert.equal(root.children.filter(el=>el.tag==='pre').length,4);
 cfg.metaBindFences=true;
 original.add('obsidian-meta-bind-plugin');
 listener(root,ctx);
 assert.equal(root.children.filter(el=>el.tag==='pre').length,4);
 original.clear();
 listener(root,ctx);
 assert.deepEqual(root.children.filter(el=>el.tag==='pre').map(el=>el.children[0]),[badAction,badValue]);
 const [form,action]=root.children.filter(el=>el.tag==='div');
 const [checkbox]=form.children[0].children.filter(el=>el.tag==='input');
 assert.equal(form.children.length,1);
 checkbox.checked=true;checkbox.events.change();
 const button=action.children[0];
 assert.equal(button.attrs.type,'button');
 assert.equal(button.textContent,'Add');
 await button.events.click();
 assert.deepEqual(frontmatter,{done:true,doneCount:12,other:'preserved'});
 original.add('obsidian-meta-bind-plugin');
 await button.events.click();
 assert.equal(frontmatter.doneCount,12);
});

test('reading presets normalize styles and leave unused overrides unset',()=>{
 const cfg=api.writerV92ResearchMerge({v92Research:{
  fontSize:19,stylePresets:[{name:' Draft ',values:{fontSize:60,headingSizes:[2],bodyColor:'bad'}}]
 }});
 assert.equal(cfg.fontSize,19);
 assert.equal(cfg.stylePrint,false);
 assert.equal(cfg.stylePresets[0].name,'Draft');
 assert.equal(cfg.stylePresets[0].values.fontSize,24);
 assert.equal(cfg.stylePresets[0].values.headingSizes[0],2);
 assert.equal(cfg.stylePresets[0].values.bodyColor,'');
 const classes=new Set(),properties=new Map();
 const root={classList:{toggle:(key,enabled)=>enabled?classes.add(key):classes.delete(key)},style:{
  setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)
 }};
 api.writerV92ResearchStyleApply(root,cfg,true);
 assert.equal(properties.get('--writer-v92-font-size'),'19px');
 assert.equal(properties.has('--writer-v92-list-indent'),false);
 api.writerV92ResearchStyleApply(root,cfg,false);
 assert.equal(classes.size,0);
 assert.equal(properties.size,0);
});

test('the native print preview recolors text without a raster filter and grayscales embedded media',()=>{
 const settings={},cfg=api.writerV92ResearchMerge(settings);
 const style=()=>({setProperty(key,value){this[key]=value;}});
 const image={style:style(),matches:()=>true};
 const preview={style:style(),matches:()=>false,querySelectorAll:()=>[image],
  closest:selector=>selector==='.print > .markdown-preview-view'?preview:null,
  ownerDocument:{defaultView:{CSS:{supports:()=>true},getComputedStyle:()=>({
   getPropertyValue:key=>key==='color'?'rgb(24, 124, 200)':''
  })}}};
 let registered;
 const p={settings,app:{workspace:{on(){}}},registerEvent(){},registerMarkdownPostProcessor(callback){registered=callback;}};
 api.writerV92ResearchRegister(p);
 cfg.styleEnabled=true;
 registered(preview);assert.equal(preview.style.color,undefined);
 cfg.stylePrint=true;
 registered({closest:()=>preview});assert.equal(preview.style.color,undefined);
 registered(preview);
 assert.equal(preview.style.color,'oklch(from rgb(24, 124, 200) l 0 h / alpha)');
 assert.equal(preview.style.filter,undefined);
 assert.equal(image.style.filter,'grayscale(1)');
});

test('9.2.1 Explorer has a right-aligned interactive favorite and bottom preview toggle',()=>{
 const src=read('src/v9/explorer-favorites-preview.js'),css=read('src/styles/features/v9-2-suite.css');
 assert.match(src,/writer-v921-preview-toggle/);
 assert.match(src,/nav-header > \.nav-buttons-container/);
 assert.match(src,/aria-pressed/);
 assert.match(src,/writerV92ToggleFavorite\(plugin,button\.dataset\.path\)/);
 assert.match(css,/inset-inline-end:4px/);
 assert.match(css,/writer-v92-is-favorite .*writer-v92-favorite svg/);
 assert.match(css,/body\.is-mobile[\s\S]*writer-v92-favorite/);
 assert.match(src,/previewVisible/);
 assert.match(src,/previewLines/);
 assert.match(src,/previewImageSize/);
});
test('9.2.1 first embedded local image and YAML cover resolve with safe resource paths',()=>{
 const image=new TFile('Novel/cover.png');image.extension='png';
 const old=vault.getAbstractFileByPath;
 vault.getAbstractFileByPath=path=>path===image.path?image:old(path);
 try{
  const resolved=api.writerV921ResolveImage(plugin,folderNote,'![[cover.png|100]]');
  assert.equal(resolved.path,'Novel/cover.png');
  assert.equal(api.writerV921ResolveImage(plugin,folderNote,'https://example.com/image.png'),null);
  assert.equal(api.writerV921PreviewImage(plugin,folderNote,'# Hello\n![[cover.png]]').path,image.path);
 }finally{vault.getAbstractFileByPath=old;}
});
test('9.2.1 excerpt removes frontmatter and embedded image markup',()=>{
 const excerpt=api.writerV921PreviewBody('---\ndescription: test\n---\n# Heading\n\nFirst **paragraph** with a [[Link|label]].\n\n![[image.png]]',100);
 assert.ok(excerpt.includes('First paragraph with a label'));
 assert.ok(!excerpt.includes('description:'));
 assert.ok(!excerpt.includes('image.png'));
});
