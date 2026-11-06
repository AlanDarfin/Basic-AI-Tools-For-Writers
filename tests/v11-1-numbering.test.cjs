'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v11/numbering-extensions.js','utf8');
function load(keys,extra={}){
 return vm.runInNewContext(source+'\n({'+keys.join(',')+'})',{
  Number,Math,String,Array,Set,Map,Date,console,
  writerUi:(pt,en)=>pt,
  writerV1011NumberHeadings:src=>src.split(/\r?\n/).map((s,i)=>/^# /.test(s)?{line:i,number:String(i+1),title:s.slice(2)}:null).filter(Boolean),
  writerV1011NumberCfg:()=>({enabled:true,virtual:true,captions:true,scheme:'hierarchical'}),
  writerV1011NumberDisabled:()=>false,...extra
 });
}
test('Number Suite counters are independent and ignore YAML and code fences',()=>{
 const {writerV111NumberStructure:f}=load(['writerV111NumberStructure']);
 const text=['---','title: Figure: ignored','---','# Intro','Figure: Cover','Table: One','~~~md','Figure: not numbered','~~~','Figure: Second','[^footnote:note]: Source','[^endnote:end]: After'].join('\n');
 const r=f(text);
 assert.deepEqual(Array.from(r.captions,x=>[x.kind,x.number]),[['Figure',1],['Table',1],['Figure',2]]);
 assert.deepEqual(Array.from(r.footnotes,x=>x.kind),['footnote','endnote']);
 assert.equal(r.headings.length,1);
});
test('Live Preview is opt-in, ignores already stored numbers and disabled per-note numbering',()=>{
 const {writerV111NumberCfg,writerV111NumberLineSpecs}=load(['writerV111NumberCfg','writerV111NumberLineSpecs'],
 {writerV1011NumberHeadings:()=>[{line:0,number:'1',stored:'',title:'Start'},{line:1,number:'2',stored:'2.',title:'Already numbered'}]});
 const settings={v111Number:{livePreview:true}};
 const file={extension:'md'};
 const view={dom:{closest:()=>({})},state:{doc:{toString:()=> '# Start\n# 2. Already numbered',lines:2}}};
 const plugin={settings,app:{workspace:{getLeavesOfType:()=>[{view:{editor:{cm:view},file}}]}}};
 assert.equal(writerV111NumberLineSpecs(plugin,view).length,1);
 settings.v111Number.livePreview=false;
 assert.equal(writerV111NumberLineSpecs(plugin,view).length,0);
 assert.equal(writerV111NumberCfg({}).captionNumbers,false);
});
test('Number Suite additional features never write notes or call network',()=>{
 assert.doesNotMatch(source,/vault\.(?:modify|process|create)\s*\(/);
 assert.doesNotMatch(source,/\bfetch\s*\(|requestUrl\s*\(/);
});
