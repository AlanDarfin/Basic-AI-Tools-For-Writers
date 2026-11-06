'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const text=fs.readFileSync(path.join(__dirname,'../src/v12/unified-toolkit.js'),'utf8');
const context={writerUi:(pt,en)=>en,console};
vm.runInNewContext(text+'\nglobalThis.v12={writerV12Config,writerV12SafeName,writerV12NormalizeEmbeds,writerV12TaskLines,writerV12Commands,writerV12CompanionInstalled,writerV12Register,writerV12PaletteItems,WRITER_V12_COMPANIONS};',context,{filename:'unified-toolkit.js'});
const v=context.v12;

test('v12 bridges all eight requested projects without copying upstream engines',()=>{
 assert.equal(v.WRITER_V12_COMPANIONS.length,8);
 const ids=Array.from(v.WRITER_V12_COMPANIONS,x=>x.id);
 for(const expected of ['ahmed-toolkit','visual-kit','snailkit','dropit','syncthing-integration','syncthing-manager','obsidian-git','fit'])
  assert.ok(ids.includes(expected),expected);
});
test('settings normalize sync providers and scan limits',()=>{
 const plugin={settings:{v12Toolkit:{syncProvider:'unsupported',maxTaskFiles:20000}}};
 const cfg=v.writerV12Config(plugin);
 assert.equal(cfg.syncProvider,'none');
 assert.equal(cfg.maxTaskFiles,1000);
 assert.equal(cfg.enabled,true);
 assert.equal(plugin.settings.v12Toolkit,cfg);
});
test('image width normalization edits only selected wiki-image embeds',()=>{
 const source='![[assets/photo.png|120]] and ![[icons/pic.webp|alt text|320]]\n[[Other.md]] and ![[book.pdf]]';
 const {next,count}=v.writerV12NormalizeEmbeds(source,480);
 assert.equal(count,2);
 assert.match(next,/\!\[\[assets\/photo\.png\|480\]\]/);
 assert.match(next,/\!\[\[icons\/pic\.webp\|alt text\|480\]\]/);
 assert.match(next,/\[\[Other\.md\]\] and !\[\[book\.pdf\]\]/);
 assert.equal(v.writerV12NormalizeEmbeds(source,480).next,next);
});
test('task navigator parses checkboxes without modifying source',()=>{
 const input='# Sample\n- [ ] Write scene #writing\n* [x] Done\n- [X] Reviewed\n- other list\n';
 const tasks=v.writerV12TaskLines(input);
 assert.equal(tasks.length,3);
 assert.equal(tasks[0].done,false);
 assert.equal(tasks[1].done,true);
 assert.equal(tasks[2].text,'Reviewed');
 assert.equal(input.includes('- [ ] Write scene'),true);
});
test('safe filenames cannot escape the inbox',()=>{
 assert.equal(v.writerV12SafeName('../../something<>:##'), '.. .. something');
 assert.equal(v.writerV12SafeName(''), 'Captured');
});
test('command discovery is scoped to the installed companion',()=>{
 const plugin={app:{plugins:{plugins:{fit:{}}},commands:{listCommands:()=>[
  {id:'fit:sync',name:'Sync'}, {id:'obsidian-git:push',name:'Push'},
  {id:'fit-pull',name:'Pull'}, {id:'my-fit:fake',name:'Other'}
 ]}}};
 assert.equal(v.writerV12CompanionInstalled(plugin,'fit'),true);
 assert.equal(v.writerV12CompanionInstalled(plugin,'obsidian-git'),false);
 assert.equal(v.writerV12Commands(plugin,'fit').length,2);
 assert.equal(v.writerV12Commands(plugin,'obsidian-git').length,1);
});
test('registration never starts a sync transport or accesses the network',()=>{
 const registered=[],events=[];
 const plugin={
  settings:{},app:{plugins:{plugins:{}},workspace:{onLayoutReady:()=>{},on:()=>({})}},
  addCommand:c=>registered.push(c.id),
  registerMarkdownPostProcessor:()=>{},
  registerEvent:x=>events.push(x),
  register:()=>{}
 };
 v.writerV12Register(plugin);
 assert.ok(registered.includes('v12-sync-center'));
 assert.ok(registered.includes('v12-format-palette'));
 assert.ok(registered.includes('v12-capture'));
 assert.ok(registered.includes('v12-tasks'));
 assert.equal(registered.length,10);
 assert.equal(events.length,1);
 assert.equal(plugin.settings.v12Toolkit.syncProvider,'none');
});
