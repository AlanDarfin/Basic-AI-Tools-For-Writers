'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
class TFile{constructor(path){this.path=path;this.extension='md';}}
const context={TFile,writerUi:(_pt,en)=>en};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/v12/task-workbench.js'),'utf8')+
 '\nglobalThis.api={writerV12TaskRefs,writerV12ToggleTask};',context);
const {writerV12TaskRefs,writerV12ToggleTask}=context.api;

test('Workbench ignores shorter, mixed and labelled fences inside a code example',()=>{
 for(const [opening,inner,closing] of [
  ['````markdown','```','````'],
  ['~~~~markdown','~~~','~~~~~'],
  ['```markdown','~~~','```'],
  ['```markdown','```still-code','```'],
  ['  ````markdown','   ```','  ````']
 ]){
  const source=[opening,inner,'- [ ] example only #example',closing,'- [ ] real task #writing'].join('\n');
  const refs=writerV12TaskRefs(source);
  assert.equal(refs.length,1,source);
  assert.equal(refs[0].text,'real task #writing');
  assert.equal(refs[0].line,4);
 }
});
test('an unclosed example stays excluded and an invalid backtick opener does not swallow tasks',()=>{
 assert.equal(writerV12TaskRefs('````\n```\n- [ ] example only').length,0);
 const refs=writerV12TaskRefs('```info`invalid\n- [ ] actual task');
 assert.equal(refs.length,1);
 assert.equal(refs[0].line,1);
});
test('toggling a real task preserves nested example code and CRLF bytes',async()=>{
 const source='````md\r\n```\r\n- [ ] example\r\n```\r\n````\r\n- [ ] real #writing\r\n';
 const file=new TFile('Tasks.md');
 let actual=source;
 const plugin={app:{workspace:{getLeavesOfType:()=>[]},vault:{process:async(_file,update)=>{actual=update(actual);}}}};
 const refs=writerV12TaskRefs(source);
 assert.equal(refs.length,1);
 const result=await writerV12ToggleTask(plugin,file,refs[0],source);
 assert.equal(result,source.replace('- [ ] real','- [x] real'));
 assert.equal(actual,result);
 await assert.rejects(writerV12ToggleTask(plugin,file,refs[0],source),/File changed/);
 assert.equal(actual,result);
});
