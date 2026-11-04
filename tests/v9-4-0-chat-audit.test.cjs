'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v8/finish-blocks.js','utf8');
const api=vm.runInNewContext(source+'\n({writerV8ChatParse,writerV8ChatFakeAudio,writerV8ChatExpandBreaks})',{console});
test('fictional audio duration validation without media access',()=>{
 assert.equal(api.writerV8ChatFakeAudio('[audio:0:15]').seconds,15);
 assert.equal(api.writerV8ChatFakeAudio('[voice:1:09]').seconds,69);
 assert.equal(api.writerV8ChatFakeAudio('[áudio:0:15]').seconds,15);
 for(const v of ['[audio:0:00]','[audio:0:77]','[audio:3:00:00]','[audio:./music.mp3]'])assert.equal(api.writerV8ChatFakeAudio(v),null);
 assert.doesNotMatch(source,/getUserMedia\(|new Audio\(|MediaRecorder\(/);
});
test('per-block styles, implicit names and escaped line breaks',()=>{
 const data=api.writerV8ChatParse(['density: compact','bubbles: round','width: wide','avatars: off',
 '[Left=Maria]','< | Hello | 10:00','< | [audio:0:15] | 10:01'].join('\n'));
 assert.equal(data.options.density,'compact');assert.equal(data.options.bubbles,'round');
 assert.equal(data.options.width,'wide');assert.equal(data.options.avatars,false);
 assert.equal(data.messages.length,2);assert.equal(data.messages[1].name,'Maria');
 const other=api.writerV8ChatParse(['< | Maria | First\\nSecond','','- item','> | João | Reply | 10:02'].join('\n'));
 assert.equal(other.messages[0].name,'Maria');assert.equal(other.messages[0].time,'');
 assert.match(other.messages[0].body,/First\nSecond/);assert.match(other.messages[0].body,/- item/);
 const escaped='Text'+String.fromCharCode(92,92)+'n';
 assert.equal(api.writerV8ChatExpandBreaks(escaped),'Text'+String.fromCharCode(92)+'n');
 const bad=api.writerV8ChatParse('bubbles: url(script)\ndensity: custom\n< Maria | Hi');
 assert.equal(bad.options.bubbles,'soft');assert.equal(bad.options.density,'normal');
});
test('bundles and bilingual examples are updated',()=>{
 assert.match(fs.readFileSync('main.js','utf8'),/writerV8ChatRenderFakeAudio/);
 assert.match(fs.readFileSync('styles.css','utf8'),/writer-v8-chat-fake-audio/);
 for(const p of ['docs/BLOCKS.en.md','docs/BLOCKS.pt-BR.md'])assert.match(fs.readFileSync(p,'utf8'),/\[audio:0:15\]/);
 for(const p of ['manifest.json','package.json','README.md','docs/README.pt-BR.md'])assert.match(fs.readFileSync(p,'utf8'),/10\.0\.0/);
});
