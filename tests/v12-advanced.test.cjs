'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..');
function evaluate(filename,globals,exports){
 const source=fs.readFileSync(path.join(root,'src/v12',filename),'utf8');
 const ctx={console,crypto:webcrypto,TextEncoder,TextDecoder,btoa,atob,
  writerUi:(pt,en)=>en,writerV12On:()=>true,...globals};
 vm.runInNewContext(source+'\nglobalThis.testApi={'+exports.join(',')+'};',ctx,{filename});
 return ctx.testApi;
}
const secure=evaluate('secure-notes.js',{},[
 'writerV12SecureSeal','writerV12SecureOpen','writerV12SecureB64','writerV12SecureUnb64','writerV12SecureKey'
]);
class FakeFile{
 constructor(path){this.path=path;this.extension='md';}
}
const task=evaluate('task-workbench.js',{TFile:FakeFile},[
 'writerV12TaskRefs','writerV12TaskReplacedLine','writerV12ToggleTask'
]);

test('AES-256-GCM protects content without storing the passphrase',async()=>{
 const message='My private draft, with unicode: á, 日本語';
 const password='correct-long-secret-2026';
 const envelope=await secure.writerV12SecureSeal(message,password);
 assert.ok(envelope.startsWith('BASIC-SECURE/1\n'));
 assert.equal(envelope.includes(message),false);
 assert.equal(envelope.includes(password),false);
 const decrypted=await secure.writerV12SecureOpen(envelope,password);
 assert.equal(decrypted,message);
});
test('encrypted note refuses wrong key and corrupted authentication tag',async()=>{
 const envelope=await secure.writerV12SecureSeal('Secret passage','a-long-passphrase-123');
 await assert.rejects(()=>secure.writerV12SecureOpen(envelope,'wrong-long-passphrase-123'));
 const parsed=JSON.parse(envelope.split('\n').slice(1).join('\n'));
 const ciphertext=secure.writerV12SecureUnb64(parsed.ciphertext);
 ciphertext[0]^=0x01;
 parsed.ciphertext=secure.writerV12SecureB64(ciphertext);
 await assert.rejects(()=>secure.writerV12SecureOpen('BASIC-SECURE/1\n'+JSON.stringify(parsed),'a-long-passphrase-123'));
});
test('task parser recognizes tags and ignores fenced code examples',()=>{
 const markdown='# Tasks\n- [ ] Draft chapter #writing\n~~~md\n- [ ] ignored #example\n~~~\n2. [x] Finished #review\n';
 const refs=task.writerV12TaskRefs(markdown);
 assert.equal(refs.length,2);
 assert.equal(refs[0].line,1);
 assert.equal(refs[0].tags[0],'#writing');
 assert.equal(refs[1].done,true);
 assert.equal(task.writerV12TaskReplacedLine(refs[0]),'- [x] Draft chapter #writing');
});
test('task toggle updates exactly the intended line, atomically',async()=>{
 const file=new FakeFile('tasks.md'),original='Notes\n- [ ] First\n- [ ] Second\n';
 let current=original;
 const plugin={app:{workspace:{getLeavesOfType:()=>[]},vault:{process:async(_file,updater)=>{current=updater(current);}}}};
 const entry=task.writerV12TaskRefs(original)[1];
 const updated=await task.writerV12ToggleTask(plugin,file,entry,original);
 assert.equal(updated,'Notes\n- [ ] First\n- [x] Second\n');
 assert.equal(current,updated);
 await assert.rejects(()=>task.writerV12ToggleTask(plugin,file,entry,original));
 assert.equal(current,updated);
});
test('task toggle rejects unsaved editor buffers',async()=>{
 const file=new FakeFile('draft.md');
 const original='- [ ] Task\n',entry=task.writerV12TaskRefs(original)[0];
 let writes=0;
 const plugin={app:{workspace:{getLeavesOfType:()=>[{
  view:{file,editor:{getValue:()=>'- [ ] Task\nunsaved'}}
 }]},vault:{process:async()=>{writes++;}}}};
 await assert.rejects(()=>task.writerV12ToggleTask(plugin,file,entry,original));
 assert.equal(writes,0);
});
