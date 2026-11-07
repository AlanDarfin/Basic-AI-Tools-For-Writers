'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const chat=read('src/v8/finish-blocks.js');
const parse=vm.runInNewContext(chat+'\nwriterV8ChatParse');
test('repeated speaker is inherited without forcing a visible name or time',()=>{
 const data=parse('[Left=Maria]\n< Maria | Primeira | 08:00\n< | Segunda mensagem\n< João | Resposta | 09:00');
 assert.equal(data.messages.length,3);
 assert.equal(data.messages[0].explicitName,true);
 assert.equal(data.messages[1].explicitName,false);
 assert.equal(data.messages[1].name,'Maria');
 assert.equal(data.messages[1].time,'');
 assert.equal(data.messages[2].name,'João');
});
test('chat renders repeated speaker as compact message-only row',()=>{
 class El{
  constructor(tag='div',options={}){this.tag=tag;this.options=options;this.children=[];}
  createDiv(x){const e=new El('div',x);this.children.push(e);return e;}
  createEl(tag,x){const e=new El(tag,x);this.children.push(e);return e;}
  setText(x){this.text=x;}empty(){this.children=[];}
 }
 const render=vm.runInNewContext(chat+'\nwriterV8ChatRender',{
  writerUi:s=>s,writerV8ImagePath:()=>'',writerV8Markdown:()=>Promise.resolve(),console
 });
 const root=new El();
 render({app:{}},'[Left=Maria]\n< Maria | Olá | 08:00\n< | Também estou aqui',root,{sourcePath:'Book.md'});
 const transcript=root.children[0].children[0];
 const first=transcript.children[0],second=transcript.children[1];
 assert.match(second.options.cls,/is-continuation/);
 assert.ok(first.children[0].children.some(node=>node.options.cls==='writer-v8-chat-meta'));
 assert.ok(!second.children[0].children.some(node=>node.options.cls==='writer-v8-chat-meta'));
});
const lock=read('src/v9/password-lock.js');
const lockApi=vm.runInNewContext(lock+'\n({merge:writerV9LockMerge,matches:writerV9LockMatches})');
test('visual lock is opt-in, limits paths and never claims encryption',()=>{
 const data={};lockApi.merge(data);
 assert.equal(data.v9Lock.enabled,false);
 assert.equal(lockApi.matches(data.v9Lock,'Novel/Chapter.md'),false);
 const raw={v9Lock:{enabled:true,salt:'1'.repeat(32),verifier:'2'.repeat(64),paths:['Novel','Private.md','/']}};
 lockApi.merge(raw);
 assert.equal(raw.v9Lock.enabled,true);
 assert.equal(lockApi.matches(raw.v9Lock,'Novel/Chapter.md'),true);
 assert.equal(lockApi.matches(raw.v9Lock,'Elsewhere.md'),true);
 assert.match(lock,/NOT encrypt|NÃO criptografa/);
 const invalid={v9Lock:{enabled:true,salt:'',verifier:'',paths:['Private']}};
 lockApi.merge(invalid);
 assert.equal(invalid.v9Lock.enabled,false);
});
test('v9.0.1 sources and runtime bundle contain new controls',()=>{
 const main=read('main.js'),style=read('styles.css');
 for(const needle of ['writerV9LockRegister(this)','writerV9SpacesSidebarOpen',
  'writerV9SafeHex','writer-v901-nav-icon','Escrita e edição','Markdown e extensões','homeTitleColor']){
  assert.ok(main.includes(needle),needle);
 }
 assert.match(style,/writer-v901-color-input/);
 assert.match(style,/writer-v9-space-sidebar/);
 assert.match(read('scripts/build-v3.js'),/v9\/password-lock/);
});
