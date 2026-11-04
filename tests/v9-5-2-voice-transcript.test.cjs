'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/finish-blocks.js','utf8');
const api=vm.runInNewContext(source+'\n({writerV8ChatParse,writerV8ChatFakeAudio,writerV8ChatRenderFakeAudio})',
 {console,writerUi:(pt)=>pt});

test('audio, voice and áudio formats preserve old duration and add optional transcription',()=>{
 for(const alias of ['audio','voice','áudio']){
  const old=api.writerV8ChatFakeAudio('['+alias+':0:15]');
  assert.equal(old.seconds,15);
  assert.equal(old.duration,'0:15');
  assert.equal(old.transcript,'');
  const full=api.writerV8ChatFakeAudio('['+alias+':0:15:Olá! Vou chegar às 14:30.]');
  assert.equal(full.seconds,15);
  assert.equal(full.transcript,'Olá! Vou chegar às 14:30.');
 }
 const hour=api.writerV8ChatFakeAudio('[audio:1:02:09:Segunda parte]');
 assert.equal(hour.seconds,3729);assert.equal(hour.transcript,'Segunda parte');
});
test('escaped or actual newlines remain plain text; invalid or oversized audio stays unparsed',()=>{
 const data=api.writerV8ChatParse('< | Ana | [áudio:0:15:Primeira frase.\\nSegunda frase.] | 09:42');
 assert.equal(data.messages[0].time,'09:42');
 assert.equal(api.writerV8ChatFakeAudio(data.messages[0].body).transcript,'Primeira frase.\nSegunda frase.');
 const raw=api.writerV8ChatFakeAudio('[audio:0:15:Text: with [brackets] and <tag>]');
 assert.equal(raw.transcript,'Text: with [brackets] and <tag>');
 for(const value of ['[audio:0:00:empty]','[audio:0:67:invalid]','[audio:3:00:00:too long]',
  '[audio:0:15:'+('x'.repeat(2401))+']','[audio:file.mp3:transcript]']){
  assert.equal(api.writerV8ChatFakeAudio(value),null);
 }
});
class FakeEl{
 constructor(tag='div',opts={}){this.tag=tag;this.options=opts;this.children=[];
  this.attributes={...(opts.attr||{})};this.hidden=false;this.text='';
  this.handlers={};this.classNames=new Set((opts.cls||'').split(/\s+/).filter(Boolean));
  this.classList={toggle:(token,enabled)=>{if(enabled===undefined)enabled=!this.classNames.has(token);
   if(enabled)this.classNames.add(token);else this.classNames.delete(token);return enabled;},
   contains:(token)=>this.classNames.has(token)};}
 createDiv(options){const item=new FakeEl('div',options);this.children.push(item);return item;}
 createEl(tag,options){const item=new FakeEl(tag,options);this.children.push(item);return item;}
 createSpan(options){const item=new FakeEl('span',options);this.children.push(item);return item;}
 setAttribute(key,value){this.attributes[key]=String(value);}
 addEventListener(key,handler){this.handlers[key]=handler;}
 setText(text){this.text=String(text);}
}
test('transcript is always visible, text-only and has no extra toggle',()=>{
 const root=new FakeEl();
 api.writerV8ChatRenderFakeAudio(root,api.writerV8ChatFakeAudio('[audio:0:15:<span>Não executar HTML</span>]'));
 const player=root.children.find(e=>e.classNames.has('writer-v8-chat-fake-audio'));
 assert.ok(player);
 const body=player.children.find(e=>e.classNames.has('writer-v8-chat-transcript-text'));
 assert.ok(body);assert.equal(body.hidden,false);
 assert.equal(body.text,'<span>Não executar HTML</span>');
 assert.equal(root.children.filter(e=>e.classNames.has('writer-v8-chat-transcript-toggle')).length,0);
 const plain=new FakeEl();
 api.writerV8ChatRenderFakeAudio(plain,api.writerV8ChatFakeAudio('[audio:0:15]'));
 assert.equal(plain.children[0].children.some(e=>e.classNames.has('writer-v8-chat-transcript-text')),false);
});

test('shipped bundle, styles and documentation include transcription and no external recognition',()=>{
 assert.match(fs.readFileSync('main.js','utf8'),/Written transcript/);
 const css=fs.readFileSync('src/styles/v9-5-2-chat-audio.css','utf8');
 assert.ok(fs.readFileSync('styles.css','utf8').includes(css.trimEnd()));
 assert.match(css,/writer-v8-chat-transcript-text/);
 assert.doesNotMatch(source,/getUserMedia\(|MediaRecorder\(|new Audio\(/);
 for(const path of ['docs/BLOCKS.pt-BR.md','docs/BLOCKS.en.md']){
  const doc=fs.readFileSync(path,'utf8');
  assert.ok(doc.includes('[áudio:0:15:')||doc.includes('[audio:0:15:'));
 }
 for(const path of ['manifest.json','package.json','README.md','docs/README.pt-BR.md']){
  assert.match(fs.readFileSync(path,'utf8'),/10\.0\.0/);
 }
});
