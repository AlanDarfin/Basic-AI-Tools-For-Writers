'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/format-blocks.js','utf8');
const css=fs.readFileSync('src/styles/v13-foundation.css','utf8');
const projects=fs.readFileSync('projects.js','utf8');
class Element{
 constructor(tag='div',options={}){this.tag=tag;this.cls=options.cls||'';this.text=options.text||'';this.attr=options.attr||{};this.children=[];this.listeners={};}
 createDiv(o={}){return this.child('div',o);} createEl(t,o={}){return this.child(t,o);} createSpan(o={}){return this.child('span',o);}
 child(tag,o){const e=new Element(tag,o);this.children.push(e);return e;}
 empty(){this.children=[];} addClass(cls){this.cls+=(this.cls?' ':'')+cls;}
 addEventListener(type,fn){this.listeners[type]=fn;}
 find(cls){if(this.cls.split(' ').includes(cls))return this;for(const c of this.children){const x=c.find(cls);if(x)return x;}return null;}
}
const rendered=[];const context={console,TFile:class{},writerUi:(pt,en)=>pt,
 require:name=>{assert.equal(name,'obsidian');return {setIcon(){}};},
 MarkdownRenderer:{render:async(app,text,element,path)=>{rendered.push({text,path});element.text=text;}},
 writerV8InlineEditor:(...args)=>{context.edits.push(args);},edits:[],
 Notice:class{constructor(value){context.notices.push(value);}},notices:[],modals:[],
 Modal:class{constructor(){this.contentEl=new Element();context.modals.push(this);}setTitle(t){this.title=t;}open(){this.onOpen();}}};
const api=vm.runInNewContext(source+'\n({writerV131WritingAnalysis,writerV131BlockTemplate,writerV131BeatLines,writerV131RegisterWritingBlocks,writerV131RenderStoryBlock})',context);
test('local repetition review counts accents, nearby occurrences and bounds input',()=>{
 const result=api.writerV131WritingAnalysis('A noite estava escura. Noite fria. E a noite chegou.');
 assert.equal(result.wordCount,10);
 assert.equal(result.repeated[0].word,'noite');assert.equal(result.repeated[0].count,3);
 assert.equal(result.near.length,2);assert.ok(result.near[0].excerpt.includes('Noite fria'));
 assert.equal(api.writerV131WritingAnalysis('o a de para e').repeated.length,0);
 assert.equal(api.writerV131WritingAnalysis('coração CORAÇÃO').repeated[0].count,2);
 assert.equal(api.writerV131WritingAnalysis('a'.repeat(200001)).truncated,true);
});
test('beat parsing keeps wiki links with aliases and respects explicit separator',()=>{
 const beats=api.writerV131BeatLines('Abertura | [[Mundo|Lugar]]\n- Virada | **Mudança**\n[[Outro|Link]]');
 assert.equal(beats.length,3);assert.equal(beats[0].title,'Abertura');assert.equal(beats[0].body,'[[Mundo|Lugar]]');
 assert.equal(beats[1].body,'**Mudança**');assert.equal(beats[2].body,'[[Outro|Link]]');
 assert.equal(api.writerV131BeatLines(Array(100).fill('Um').join('\n')).length,80);
});
test('four insertion commands preserve selection and use a safe fence',()=>{
 const blocks={},commands={};let enabled=true;
 const plugin={app:{},registerMarkdownCodeBlockProcessor:(name,fn)=>blocks[name]=fn,addCommand:c=>commands[c.id]=c};
 api.writerV131RegisterWritingBlocks(plugin,()=>enabled);
 for(const name of ['scene-card','character-voice','beat-sheet','editor-note']){
  assert.equal(typeof blocks[name],'function');const cmd=commands['v131-insert-'+name];assert.ok(cmd);
  let result='';cmd.editorCallback({getSelection:()=> '  trecho ``` aqui  ',replaceSelection:s=>{result=s;}});
  assert.ok(result.includes('  trecho ``` aqui  '));assert.match(result,/\n`{4}/);
 }
 assert.ok(commands['v131-review-repetitions']);
 assert.ok(api.writerV131BlockTemplate('scene-card','   ').endsWith('\n---\n   \n```\n'));
 commands['v131-review-repetitions'].editorCallback({getSelection:()=> 'noite e noite',getValue:()=>{throw Error('Selected text should be used');}});
 const modal=context.modals.at(-1);assert.equal(modal.title,'Revisão de repetições');
 assert.ok(modal.contentEl.children.some(child=>child.text.includes('Seleção')));
 enabled=false;let replaced=false;
 commands['v131-insert-scene-card'].editorCallback({getSelection:()=>'',replaceSelection:()=>{replaced=true;}});
 assert.equal(replaced,false);assert.ok(context.notices.length);
 enabled=true;
 commands['v131-insert-scene-card'].editorCallback({getSelection:()=> 'x'.repeat(32001),replaceSelection:()=>{replaced=true;}});
 assert.equal(replaced,false,'Oversized selection is not deleted or replaced');
});
test('four blocks render distinct structured content and edit original source safely',()=>{
 const original='title: Capítulo\npov: Maria\ngoal: Fugir\n---\n**Texto** e [[Link]]';
 for(const type of ['scene-card','character-voice','beat-sheet','editor-note']){
  const container=new Element(),plugin={app:{}};
  api.writerV131RenderStoryBlock(plugin,original,container,{sourcePath:'Livro.md'},type);
  const root=container.children[0];assert.ok(root.cls.includes('writer-v131-'+type));
  const edit=root.find('writer-v131-story-edit');assert.ok(edit);edit.listeners.click();
  const call=context.edits.at(-1);assert.equal(call[4],type);assert.equal(call[5],original);assert.equal(call[7]('alterado'),'alterado');
 }
 assert.ok(rendered.some(x=>x.text==='**Texto** e [[Link]]'&&x.path==='Livro.md'));
 const c=new Element();api.writerV131RenderStoryBlock({app:{}},'title: T\n---\nAbertura | Um\nVirada | Dois',c,{sourcePath:'Livro.md'},'beat-sheet');
 const beats=c.find('writer-v131-beats');assert.equal(beats.children.length,2);assert.equal(beats.children[0].children[0].text,'Abertura');
});
test('project selectors target the nested title and full labels remain accessible',()=>{
 assert.match(projects,/title:name,[\s\S]*?aria-label/);
 assert.match(projects,/writer-project-nav-label/);
 assert.match(projects,/lfMsg\('Mover para cima','Move up'\).*this\.moveScene/);
 assert.match(css,/>\.writer-v7-scene-title-wrap\{[\s\S]*?grid-column:2/);
 assert.match(css,/\.writer-v7-scene-title-wrap \.writer-project-scene-title-text\{[\s\S]*?text-overflow:ellipsis/);
 assert.match(css,/@container basic-project \(max-width:175px\)/);
 assert.match(css,/\.status-bar\.writer-v132-status-host\{[\s\S]*?max-width:calc\(100vw - 128px\)/);
});
