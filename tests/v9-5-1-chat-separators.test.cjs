'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/finish-blocks.js','utf8');
const api=vm.runInNewContext(source+'\n({writerV8ChatParse,writerV8ChatDivider})',{console});
test('three dashes and labeled dividers produce independent transcript items',()=>{
 const data=api.writerV8ChatParse([
  'title: Conversa','group-image: [[Images/group.webp]]',
  '[Left=Ana, Right=Leo]','< | Ana | Olá | 10:00',
  '---','< | | Outra mensagem | 10:01',
  '--- Duas horas depois ---','> | Leo | Cheguei. | 12:01'
 ].join('\n'));
 assert.equal(data.title,'Conversa');
 assert.equal(data.groupImage,'[[Images/group.webp]]');
 assert.equal(data.messages.length,5);
 assert.equal(data.messages[1].type,'divider');
 assert.equal(data.messages[1].text,'');
 assert.equal(data.messages[2].body,'Outra mensagem');
 assert.equal(data.messages[3].type,'divider');
 assert.equal(data.messages[3].text,'Duas horas depois');
 assert.equal(data.messages[4].name,'Leo');
});
test('separator accepts timestamps, trims label and leaves normal Markdown intact',()=>{
 assert.equal(api.writerV8ChatDivider('--- 14:20 ---').text,'14:20');
 assert.equal(api.writerV8ChatDivider('   --- Dia seguinte ---  ').text,'Dia seguinte');
 for(const item of ['--- title','--- end-column --- more','- - -','----','> | Hello','some --- text ---'])assert.equal(api.writerV8ChatDivider(item),null);
 const multiline=api.writerV8ChatParse('< | Ana | First\nParagraph with **bold**.\n\n- Markdown item\n--- 4 hours later ---\n< | | Again');
 assert.match(multiline.messages[0].body,/Paragraph with \*\*bold\*\*/);
 assert.match(multiline.messages[0].body,/Markdown item/);
 assert.equal(multiline.messages[1].text,'4 hours later');
});
test('legacy chat still recognizes the first header delimiter and later dividers',()=>{
 const data=api.writerV8ChatParse([
  'title: Legacy','group-avatar: [[Covers/group.png]]',
  '=== Ana','avatar: [[People/Ana.png]]','time: 08:00','---',
  'Old message','--- 15 minutes later ---','Still Ana',
  '=== Leo','side: right','---','Reply'
 ].join('\n'));
 assert.equal(data.groupImage,'[[Covers/group.png]]');
 assert.equal(data.messages.length,4);
 assert.equal(data.messages[0].body,'Old message');
 assert.equal(data.messages[0].time,'08:00');
 assert.equal(data.messages[1].text,'15 minutes later');
 assert.equal(data.messages[2].body,'Still Ana');
 assert.equal(data.messages[3].side,'right');
});
test('group picture is local-only and independent of avatars: off',()=>{
 const data=api.writerV8ChatParse('group-photo: [[Folder/icon.png]]\navatars: off\n< Ana | Hello');
 assert.equal(data.options.avatars,false);
 assert.equal(data.groupImage,'[[Folder/icon.png]]');
 const src=fs.readFileSync('src/v8/format-blocks.js','utf8');
 assert.match(src,/writerV8ImagePath/);
 assert.match(src,/https\?:\|file:\|data:\|javascript:/);
 assert.match(source,/writerV8ImagePath\(plugin\.app,data\.groupImage,ctx\.sourcePath\)/);
});
test('group photo and dividers have scoped styles, are built, and bilingual docs exist',()=>{
 const css=fs.readFileSync('styles.css','utf8');
 const original=fs.readFileSync('src/styles/v9-5-1-chat.css','utf8');
 assert.ok(css.includes(original.trimEnd()));
 for(const token of ['writer-v8-chat-divider','writer-v8-chat-group-photo','writer-v8-chat-heading'])assert.match(css,new RegExp(token));
 const bundle=fs.readFileSync('main.js','utf8');
 assert.match(bundle,/writerV8ChatDivider/);
 assert.match(bundle,/writer-v8-chat-group-photo/);
 for(const path of ['docs/BLOCKS.pt-BR.md','docs/BLOCKS.en.md']){
  const docs=fs.readFileSync(path,'utf8');
  assert.ok(docs.includes('--- Duas horas depois ---')||docs.includes('--- Two hours later ---'));
  assert.match(docs,/group-image:/);
 }
});
