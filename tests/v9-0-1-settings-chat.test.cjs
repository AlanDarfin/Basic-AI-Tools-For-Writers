'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const src=read('src/v8/finish-blocks.js'),ux=read('src/v5/workspace-ux.js');
const main=read('main.js'),css=read('styles.css'),style=read('src/styles/v9-settings-chat-901.css');
const api=vm.runInNewContext(src+'\n({parse:writerV8ChatParse,render:writerV8ChatRender})',{console});
class Element{
 constructor(tag='root',props={}){this.tag=tag;this.props=props;this.children=[];}
 createDiv(props){const el=new Element('div',props);this.children.push(el);return el;}
 createEl(tag,props){const el=new Element(tag,props);this.children.push(el);return el;}
 createSpan(props){const el=new Element('span',props);this.children.push(el);return el;}
 setText(value){this.text=value;}
 empty(){this.children=[];}
}
function render(source){
 const markdown=[],root=new Element();
 const vmApi=vm.runInNewContext(src+'\n({render:writerV8ChatRender})',{
  console,writerUi:pt=>pt,writerV8ImagePath:(_,path)=>path?'app://image':'',
  writerV8Markdown:async(_plugin,_ctx,_el,body)=>{markdown.push(body);}
 });
 vmApi.render({app:{}},source,root,{sourcePath:'Story.md'});
 return {root,markdown};
}
function all(root){
 return [root,...root.children.flatMap(all)];
}
test('metadata is shown only when author/time were explicitly authored',()=>{
 const conversation='[Left=Maria]\n< | Texto sem hora\n< Maria | Com nome e hora | 10:12\n< | Mensagem sem hora\n> João | Resposta';
 const parsed=api.parse(conversation);
 assert.equal(parsed.messages.length,4);
 assert.equal(parsed.messages[0].name,'Maria');
 assert.equal(parsed.messages[0].nameExplicit,false);
 assert.equal(parsed.messages[1].nameExplicit,true);
 assert.equal(parsed.messages[1].time,'10:12');
 assert.equal(parsed.messages[2].nameExplicit,false);
 assert.equal(parsed.messages[2].time,'');
 assert.equal(parsed.messages[3].nameExplicit,true);
});
test('consecutive same-speaker messages render without redundant name or avatar',()=>{
 const text=['title: Conversa','[Maria=blue]','[Maria=Images/maria.png]',
  '< Maria | Primeira','< Maria | Segunda','< | Terceira',
  '> João | Quarta | 13:04','> João | Quinta','< Maria | Sexta'].join('\n');
 const {root}=render(text);
 const nodes=all(root);
 const names=nodes.filter(el=>el.tag==='strong').map(el=>el.props.text);
 const rows=nodes.filter(el=>el.props.cls?.includes('writer-v8-chat-row'));
 const timestamps=nodes.filter(el=>el.tag==='span'&&el.props.text==='13:04');
 assert.deepEqual(names,['Maria','João','Maria']);
 assert.equal(rows.length,6);
 assert.equal(rows.filter(el=>el.props.cls.includes('is-continuation')).length,3);
 assert.equal(timestamps.length,1);
 assert.equal(nodes.filter(el=>el.tag==='img').length,2);
});
test('legacy chats keep the speaker name from explicit section header',()=>{
 const data=api.parse('=== Maria\nside: left\n---\nOlá\n=== Maria\nside: left\n---\nTudo bem?');
 assert.ok(data.messages.every(x=>x.nameExplicit===true));
 const {root}=render('=== Maria\nside: left\n---\nOlá\n=== Maria\nside: left\n---\nTudo bem?');
 assert.equal(all(root).filter(x=>x.tag==='strong').length,1);
});
test('settings regroup Writing and Markdown while keeping Review/reading separate',()=>{
 assert.match(main,/\['writing',msg\('Escrita e Markdown','Writing & Markdown'\)/);
 const section=main.slice(main.indexOf('  const groups=[',main.indexOf('class DictionarySettings')),
  main.indexOf('  const groupFor=id=>',main.indexOf('class DictionarySettings')));
 assert.ok(section.includes("'extendedSyntax','pandocSyntax','v6Markdown'"));
 assert.ok(section.includes("'complements','variants','typing'"));
 assert.doesNotMatch(section,/\['markdown',msg\(/);
 assert.match(section,/'v6Linter'\]\]/);
});
test('settings search is compact with icon, clear action and bounded results',()=>{
 assert.match(ux,/writer-v901-settings-search-field/);
 assert.match(ux,/writer-v901-settings-search-clear/);
 assert.match(ux,/matches\.slice\(0,6\)/);
 assert.match(ux,/input\.value='';update\(\);input\.focus\(\)/);
 assert.match(ux,/'aria-live':'polite'/);
 assert.doesNotMatch(ux,/label=wrap\.createEl\('label',\{text:writerUi\('Buscar nas configurações'/);
 assert.match(style,/\.writer-v51-search\.writer-v901-settings-search\{/);
 assert.match(style,/border:0;border-radius:0;background:transparent/);
 assert.match(css,/writer-v901-settings-search-matches/);
});
test('settings tab bars grow to full width but remain scrollable on mobile',()=>{
 assert.match(style,/\.dictionary-settings-tabs\.dictionary-settings-tabs/);
 assert.match(style,/\.dictionary-settings-subtabs\.dictionary-settings-subtabs/);
 assert.match(style,/width:100%;max-width:100%;min-width:0/);
 assert.match(style,/flex:1 0 auto;min-width:max-content/);
 assert.match(style,/overflow-x:auto;overflow-y:hidden/);
 assert.match(style,/@media\(max-width:600px\)/);
});
test('bundles remain synchronized with chat and settings source and styles',()=>{
 assert.match(main,/const showName=Boolean\(msg\.nameExplicit&&!sameSpeaker&&msg\.name\)/);
 assert.match(main,/writer-v901-settings-search-icon/);
 assert.match(read('scripts/build-css.js'),/v9-settings-chat-901\.css/);
});
