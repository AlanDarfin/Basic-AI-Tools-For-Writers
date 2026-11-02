'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=fs.readFileSync('src/v3/core.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const api=vm.runInNewContext(core+'\n({writerMaskMarkdown,writerGrammarMatchIsSafe})',{console});
const {writerMaskMarkdown,writerGrammarMatchIsSafe}=api;

test('HTML attributes and raw markup never become LanguageTool words',()=>{
 const text='<div align="center" data-name="chapter">Olá mundo!</div>\n' +
  '<span style="color: red" title="my value">Palavras legíveis</span>\n' +
  '<script>var veryWrong = true;</script>\n<p>Outro parágrafo.</p>';
 const masked=writerMaskMarkdown(text);
 assert.equal(masked.length,text.length);
 for(const token of ['align','center','chapter','color','veryWrong','script','span','title']){
  const at=text.indexOf(token);
  assert.ok(at>=0);
  assert.equal(masked.slice(at,at+token.length).trim(),'','Leaked HTML code '+token);
 }
 for(const textVisible of ['Olá mundo!','Palavras legíveis','Outro parágrafo.'])assert.ok(masked.includes(textVisible));
 const mark={offset:text.indexOf('Palavras'),length:'Palavras'.length};
 assert.equal(writerGrammarMatchIsSafe(text,masked,mark),true);
 const code={offset:text.indexOf('center'),length:'center'.length};
 assert.equal(writerGrammarMatchIsSafe(text,masked,code),false);
});

test('multiline HTML attributes, entities and fenced Markdown preserve exact offsets',()=>{
 const text=['Café ☕ antes.', '<div\n align="center"\n data-example="1 > 0">', 'Texto &nbsp; visível', '</div>',
  '```html','<h1 align="center">Dentro de código</h1>','```','Continuação.'].join('\n');
 const masked=writerMaskMarkdown(text);
 assert.equal(masked.length,text.length,'Never shift UTF-16 source positions');
 for(const word of ['align','center','data-example','nbsp','Dentro de código']){
  const at=text.indexOf(word);assert.equal(masked.slice(at,at+word.length).trim(),'','Leaked '+word);
 }
 assert.ok(masked.includes('Café ☕ antes.'));
 assert.ok(masked.includes('Texto'));
 assert.ok(masked.includes('Continuação.'));
 assert.ok(!masked.includes('1 > 0'));
});

test('plain prose with comparisons is not falsely swallowed as an HTML tag',()=>{
 const text='A pontuação é 5 < 10 e também 8 > 2.\nTexto <3 continua.';
 assert.equal(writerMaskMarkdown(text).trim(),text);
});

test('large review lists display incrementally without discarding any matches',()=>{
 const from=main.indexOf(' renderGrammarResults(file,source,matches){');
 const to=main.indexOf(' renderGrammarSuggestion(',from);
 assert.ok(from>0&&to>from);
 const {renderGrammarResults}=vm.runInNewContext('({'+main.slice(from,to)+'})',{msg:(pt)=>pt});
 const items=[];
 const parent={items,empty(){items.length=0;},createEl(tag,props){
  const row={tag,props,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},remove(){const index=items.indexOf(this);if(index>=0)items.splice(index,1);}};
  items.push(row);return row;
 }};
 const rendered=[];
 const view={reviewResults:parent,renderGrammarSuggestion(_f,_s,m){rendered.push(m);},renderGrammarResults};
 const matches=Array.from({length:72},(_,i)=>({offset:i,length:1}));
 view.renderGrammarResults({},'text',matches);
 assert.equal(rendered.length,24);
 let more=items.find(x=>x.props?.cls==='writer-lt-show-more');assert.ok(more);
 more.handlers.click();
 assert.equal(rendered.length,48);
 more=items.find(x=>x.props?.cls==='writer-lt-show-more');
 more.handlers.click();
 assert.equal(rendered.length,72);
 assert.equal(items.filter(x=>x.props?.cls==='writer-lt-show-more').length,0);
});

test('Android popup exposes native Obsidian modal actions without mouse coordinates',()=>{
 const from=main.indexOf('  showMobileReviewSuggestionMenu(');
 const to=main.indexOf('  showReviewSuggestionMenu(',from);
 assert.ok(from>=0&&to>from);
 let lastModal;
 class Element{
  constructor(){this.children=[];this.events={};this.classList={add(){}};}
  empty(){this.children=[];}
  createDiv(opts){const e=new Element();e.options=opts;this.children.push(e);return e;}
  createEl(tag,opts){const e=new Element();e.tag=tag;e.options=opts;this.children.push(e);return e;}
  addEventListener(type,fn){this.events[type]=fn;}
 }
 class Modal{
  constructor(){this.contentEl=new Element();this.modalEl={addClass:()=>{}};lastModal=this;}
  open(){this.opened=true;}
  close(){this.opened=false;this.onClose?.();}
 }
 const {showMobileReviewSuggestionMenu}=vm.runInNewContext('({'+main.slice(from,to)+'})',{Modal,Notice:class{},msg:(pt)=>pt,Promise,writerReviewWord:(src,m)=>src.slice(m.offset,m.offset+m.length)});
 const host={app:{isMobile:true},showMobileReviewSuggestionMenu,applyGrammarReplacement:()=>{},jumpToReviewError:()=>{},
  explainGrammarSuggestion:()=>{},dismissGrammarSuggestion:()=>{},ignoreGrammarRule:()=>{},addGrammarWord:()=>{}};
 const file={path:'Book.md'},match={offset:6,length:5,replacements:[{value:'correto'}],rule:{id:'SPELL'}};
 const modal=host.showMobileReviewSuggestionMenu(file,'texto errado',match,'book:6');
 assert.equal(modal,lastModal);assert.equal(modal.opened,true);
 assert.equal(host.reviewPopupKey,'book:6');
 const choices=modal.contentEl.children.find(e=>e.options?.cls==='writer-lt-mobile-choices');
 assert.equal(choices.children.length,1);
 const actions=modal.contentEl.children.find(e=>e.options?.cls==='writer-lt-mobile-actions');
 assert.equal(actions.children.length,4);
 choices.children[0].events.click();
 assert.equal(modal.opened,false);
 assert.equal(host.reviewPopup,null);
});
