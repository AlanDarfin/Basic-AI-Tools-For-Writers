'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const api={};
class TFile{constructor(path){this.path=path;this.extension='md';this.basename=path.split('/').at(-1).replace(/\.md$/,'');}}
class MarkdownRenderChild{registerEvent(event){this.event=event;}}
const O={MarkdownRenderChild,getLanguage:()=> 'en',moment:()=>({format:pattern=>'formatted-'+pattern})};
const source=fs.readFileSync('src/v3/final-suite.js','utf8');
const ctx={console,writerModuleOn:()=>true,require:()=>O,TFile,MarkdownView:class MarkdownView{},setTimeout,clearTimeout,requestUrl:async()=>({status:200,text:'0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;\n00E9;LATIN SMALL LETTER E WITH ACUTE;Ll;0;L;;;;;N;;;00C9;;00C9;\n'})};
ctx.writerUi=(_pt,en)=>en;
const {writerFinalMerge,WriterFinalFeatures}=vm.runInNewContext(source+'\n({writerFinalMerge,WriterFinalFeatures})',ctx);
async function checkToc(){
 class Element{
  constructor(tag,options){this.tag=tag;this.text=options?.text;this.children=[];}
  createEl(tag,options){const child=new Element(tag,options);this.children.push(child);return child;}
  createDiv(options){return this.createEl('div',options);}
  empty(){this.children=[];}
  addEventListener(type,callback){this[type]=callback;}
  querySelectorAll(tag){return this.children.flatMap(node=>[...(node.tag===tag?[node]:[]),...node.querySelectorAll(tag)]);}
 }
 const file=new TFile('Chapters.md'),heading=(heading,level,line,col=0)=>({heading,level,position:{start:{line,col}}});
 const cache={headings:[heading('**Opening** file_name',1,1),heading('Repeated',2,8),heading('Repeated',2,21,2),heading('Too deep',3,25)]};
 const el=new Element('div');let changed,child,cursor,scrolled,mode='source';
 const view={file,getMode:()=>mode,editor:{setCursor:pos=>{cursor=pos;},scrollIntoView(){}},previewMode:{applyScroll:line=>{scrolled=line;}}};
 const metadataCache={getFileCache:()=>cache,on:(type,callback)=>{assert.equal(type,'changed');changed=callback;return callback;}};
 const plugin={settings:{},app:{vault:{getAbstractFileByPath:()=>file},metadataCache,workspace:{getActiveViewOfType:()=>view}}};
 writerFinalMerge(plugin);
 new WriterFinalFeatures(plugin).renderToc(el,file.path,'MAXDEPTH: 2\nNUMBERED: TRUE\nFOLDED: TRUE',{addChild:value=>{child=value;}});
 assert.ok(child instanceof MarkdownRenderChild);
 assert.ok(el.querySelectorAll('ol').length>=2);
 assert.equal(el.querySelectorAll('details')[0].open,false);
 const links=el.querySelectorAll('a');
 assert.deepEqual(links.map(node=>node.text),['Opening file_name','Repeated','Repeated']);
 await links[2].click({preventDefault(){}});
 assert.equal(cursor.line,21);
 assert.equal(cursor.ch,2);
 mode='preview';
 await links[1].click({preventDefault(){}});
 assert.equal(scrolled,8);
 changed(file,'',{headings:[heading('Updated',1,2)]});
 assert.deepEqual(el.querySelectorAll('a').map(node=>node.text),['Updated']);
}
async function checkTemplateFolderRefresh(){
 let focused;
 class Element{
  constructor(options={}){Object.assign(this,options);this.children=[];this.textContent=options.text||'';}
  createEl(_tag,options){const child=new Element(options);this.children.push(child);return child;}
  createDiv(options){return this.createEl('div',options);}
  empty(){this.children=[];}
  focus(){focused=this;}
  addEventListener(type,callback){this[type]=callback;}
  get selectedOptions(){return this.children.filter(option=>option.value===this.value);}
 }
 const fields=new Map();
 class Setting{
  setName(name){this.name=name;return this;}
  setDesc(){return this;}
  setHeading(){return this;}
  addText(render){
   const field={inputEl:new Element(),setValue(value){this.inputEl.value=value;return this;},onChange(callback){this.input=callback;return this;}};
   render(field);fields.set(this.name,field);return this;
  }
  addToggle(render){return this.addText(render);}
  addButton(render){render({buttonEl:new Element(),setButtonText(){return this;},setIcon(){return this;},setTooltip(){return this;},onClick(){return this;}});return this;}
 }
 const render=vm.runInNewContext(source+'\nwriterRenderFinalSettings',{
  Setting,writerUi:(_pt,en)=>en,require:()=>({setIcon(){}})
 });
 const savedPath='Templates/Chapter.md',newPath='Story models/Outline.md';
 const rule={matchMethod:'prefix',matchString:'Chapter',templatePath:savedPath};
 const templates={folder:'Templates',matchers:[rule]};
 const panel=new Element();let saves=0;
 const plugin={settings:{finalSuite:{templates}},app:{vault:{getMarkdownFiles:()=>[new TFile(savedPath),new TFile(newPath)]}},
  async saveSettings(){saves++;}};
 render(panel,plugin,'templates');
 const list=panel.children.find(node=>node.cls==='writer-template-matcher-list');
 const templateSelect=()=>list.children[0].children.find(node=>node.cls==='writer-template-matcher-controls').children
  .find(node=>node.attr?.['aria-label']==='Select template');
 const select=templateSelect();
 assert.equal(select.value,savedPath);
 assert.deepEqual(select.children.map(option=>option.value),['',savedPath]);
 const folder=fields.get('Templates folder');
 folder.inputEl.focus();
 await folder.input('/Story models/');
 folder.inputEl.change();
 assert.equal(templateSelect(),select);
 assert.equal(focused,folder.inputEl);
 assert.equal(select.value,savedPath);
 assert.equal(rule.templatePath,savedPath);
 assert.equal(select.title,savedPath+' (outside folder)');
 assert.deepEqual(select.children.map(option=>option.value),['',newPath,savedPath]);
 assert.equal(saves,1);
 select.value=newPath;
 await select.change();
 assert.equal(rule.templatePath,newPath);
 assert.equal(select.title,newPath);
 assert.equal(saves,2);
}
async function main(){
 let count=0;const ok=(name)=>{console.log('PASS',name);count++;};
 await checkToc();
 ok('Instant TOC follows native heading positions, live metadata and Reading View');
 const settings={};
 const docs=new Map();
 const templateFile=new TFile('Templates/Chapter.md');
 const file=new TFile('Books/Chapter.md');
 docs.set(templateFile.path,'# {{title}}\nDate {{date}}');
 docs.set(file.path,'');
 const adapter={exists:async p=>p==='test-plugin/writer-unicode-data.txt',read:async()=> '0041;LATIN CAPITAL LETTER A;Lu;\n00E9;LATIN SMALL LETTER E WITH ACUTE;Ll;\n',write:async()=>{}};
 const view={file,getState:()=>({mode:'source'}),async setState(state){this.state=state}};
 const app={vault:{adapter,configDir:'.obsidian',getAbstractFileByPath:path=>docs.has(path)?new TFile(path):null,read:async f=>docs.get(f.path),cachedRead:async f=>docs.get(f.path),process:async(f,fn)=>{docs.set(f.path,fn(docs.get(f.path)));}},
   metadataCache:{getFileCache:()=>({frontmatter:{'prefer-view':'read'}})},
   workspace:{getActiveViewOfType:()=>view}};
 const plugin={app,settings,manifest:{dir:'test-plugin',id:'basic-ai-tool-for-writers'},async saveSettings(){}};
 writerFinalMerge(plugin);
 const f=new WriterFinalFeatures(plugin);
 assert.ok(settings.finalSuite.abbreviations.entries.atm.value==='at the moment');
 assert.equal(settings.finalSuite.anotherName.property,'another-name');
 assert.equal(settings.finalSuite.viewMode.property,'prefer-view');
 ok('Existing note subtitle and view-mode properties are preserved');
 let doc='I am atm ';
 const editor={state:{doc:{toString:()=>doc}},dispatch({changes}){doc=doc.slice(0,changes.from)+changes.insert+doc.slice(changes.to);}};
 f.tryExpand(editor,{at:doc.length,character:' '});
 assert.equal(doc,'I am at the moment ');
 ok('Abbreviation expands on space');
 doc='I am ATM ';
 f.tryExpand(editor,{at:doc.length,character:' '});
 assert.equal(doc,'I am at the moment ');
 settings.finalSuite.abbreviations.entries.atm.isEnabled=false;
 doc='I am atm ';
 f.tryExpand(editor,{at:doc.length,character:' '});
 assert.equal(doc,'I am atm ');
 settings.finalSuite.abbreviations.entries.atm.isEnabled=true;
 settings.finalSuite.abbreviations.entries.atm.isCaseSensitive=true;
 doc='I am ATM ';
 f.tryExpand(editor,{at:doc.length,character:' '});
 assert.equal(doc,'I am ATM ');
 ok('Per-entry enable and case sensitivity work');
 await f.applyTemplate(file,true);
 assert.equal(docs.get(file.path).startsWith('# Chapter\nDate '),true);
 ok('Template by note name applies from configured folder');
 docs.set(file.path,'My manuscript');
 await f.applyTemplate(file,false);
 assert.equal(docs.get(file.path),'My manuscript');
 ok('Automatic templates never overwrite existing note text');
 // Source-plugin compatible: title pattern rules and explicit template file.
 const templateRules=settings.finalSuite.templates;
 const taskTemplate=new TFile('Templates/TaskBase.md');
 const task=new TFile('Books/TODO Organize.md');
 docs.set(taskTemplate.path,'# {{title}}\nDATE {{date:YYYY}}\nTIME {{time:HH:mm}}');
 docs.set(task.path,'My original task');
 templateRules.matchers=[{matchMethod:'prefix',matchString:'TODO',templatePath:taskTemplate.path}];
 assert.equal(f.fileMatchesTemplateRule('TODO Organize',templateRules.matchers[0]),true);
 assert.equal(f.fileMatchesTemplateRule('NOTODO Organize',templateRules.matchers[0]),false);
 assert.equal(await f.applyTemplate(task),true);
 assert.ok(docs.get(task.path).startsWith('# TODO Organize\nDATE formatted-YYYY\nTIME formatted-HH:mm\n\n'));
 assert.ok(docs.get(task.path).endsWith('My original task'));
 ok('Configured prefix matcher chooses explicit template and prepends original content');
 templateRules.matchers[0].matchMethod='contains';
 assert.equal(f.fileMatchesTemplateRule('Chapter TODO Organize',templateRules.matchers[0]),true);
 templateRules.matchers[0].matchMethod='suffix';
 assert.equal(f.fileMatchesTemplateRule('Chapter TODO',templateRules.matchers[0]),true);
 assert.equal(f.fileMatchesTemplateRule('TODO Chapter',templateRules.matchers[0]),false);
 templateRules.caseSensitive=false;
 templateRules.matchers[0].matchMethod='prefix';
 templateRules.matchers[0].matchString='todo';
 assert.equal(f.fileMatchesTemplateRule('TODO Organize',templateRules.matchers[0]),true);
 ok('Contains, suffix and case insensitive matcher behavior');
 templateRules.templateOnRename=true;
 const renamed=new TFile('Books/TODO Renamed.md');
 docs.set(renamed.path,'Existing note');
 assert.equal(await f.applyTemplateOnRename(renamed,'Books/Untitled.md'),true);
 assert.ok(docs.get(renamed.path).endsWith('\n\nExisting note'));
 const once=docs.get(renamed.path);
 assert.equal(await f.applyTemplateOnRename(renamed,'Books/TODO Previous.md'),false);
 assert.equal(docs.get(renamed.path),once);
 ok('Rename applies only on entering matching rule, never repeatedly');
 templateRules.matchers=[{matchMethod:'contains',matchString:'DOES_NOT_MATCH',templatePath:taskTemplate.path}];
 const noTemplate=new TFile('Books/Chapter.md');
 const saved=docs.get(noTemplate.path);
 assert.equal(await f.applyTemplate(noTemplate,true),false);
 assert.equal(docs.get(noTemplate.path),saved);
 ok('When matcher rules exist, exact-name fallback does not override them');
 await checkTemplateFolderRefresh();
 ok('Folder changes refresh existing template selects and preserve saved paths and focus');
 const css=fs.readFileSync('styles.css','utf8');
 assert.ok(css.includes('@container writer-sidebar (max-width:420px)'));
 assert.ok(css.includes('dictionary-translation-engine'));
 assert.ok(css.includes('writer-template-matcher-list'));
 ok('Desktop narrow sidebar uses single-column language selectors');

 await f.applyViewMode(file);
 assert.equal(view.state.mode,'preview');
 ok('Frontmatter view mode switches Markdown state');
 const unicode=await f.loadUnicodeIndex();
 assert.equal(unicode.length,2);
 assert.equal(unicode[0].name,'LATIN CAPITAL LETTER A');
 ok('Unicode index is parsed from the offline local cache');
 console.log(count+' final-suite tests passed');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
