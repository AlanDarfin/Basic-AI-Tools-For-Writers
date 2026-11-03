'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function moduleUnderTest(name,exportNames){
 const source=fs.readFileSync(path.join(root,'src/v9',name),'utf8');
 const context=vm.createContext({console,URL,RegExp,Math,Number,String,Set,Map,Array,Date,writerUi:(pt,en)=>en});
 const exports=exportNames.map(key=>key+':'+key).join(',');
 const exposed=vm.runInContext(source+'\n({'+exports+'})',context);
 return {source,exposed};
}
test('9.1 version and assembled runtime',()=>{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const versions=JSON.parse(fs.readFileSync(path.join(root,'versions.json'),'utf8'));
 assert.equal(pkg.version,'9.1.0');assert.equal(manifest.version,'9.1.0');
 assert.equal(versions['9.1.0'],'1.11.4');
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
 for(const name of ['soundscapes','click-clack','explorer-flex'])
  assert.ok(main.includes('// v3 module: src/v9/'+name+'.js'),name+' missing from main.js');
 assert.match(main,/writerV91RegisterSound\(this\)/);
 assert.match(main,/writerV91RegisterClick\(this\)/);
 assert.match(main,/writerV91FlexRegister\(this\)/);
 assert.match(main,/writerV91HomeSoundscape\(this,grid\)/);
 assert.match(main,/writer-v91-ai-chat-row/);
});
test('Soundscapes original preset radio IDs, YouTube URL restrictions and safe settings migration',()=>{
 const {exposed:m}=moduleUnderTest('soundscapes.js',['WRITER_V91_RADIOS','writerV91VideoId','writerV91SoundMerge','writerV91SoundAudioFiles']);
 assert.equal(m.WRITER_V91_RADIOS.length,17);
 assert.equal(m.writerV91VideoId('https://youtu.be/jfKfPfyJRdk'),'jfKfPfyJRdk');
 assert.equal(m.writerV91VideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk'),'jfKfPfyJRdk');
 assert.equal(m.writerV91VideoId('https://fake-youtube.com/watch?v=jfKfPfyJRdk'),'');
 assert.equal(m.writerV91VideoId('https://example.com/jfKfPfyJRdk'),'');
 const settings={v91Sound:{station:'unsafe',volume:999,customPlaylists:[{id:'one',name:'Test',tracks:[{id:'https://youtu.be/jfKfPfyJRdk',name:'Lofi'},{id:'javascript:alert(1)',name:'Bad'}]}]}};
 const cfg=m.writerV91SoundMerge(settings);
 assert.equal(cfg.station,'lofi');assert.equal(cfg.volume,100);
 assert.equal(cfg.customPlaylists.length,1);
 assert.equal(cfg.customPlaylists[0].tracks.length,1);
 const plugin={settings:{v91Sound:{musicFolder:'Music'}},app:{vault:{getFiles:()=>[
  {path:'Music/a.mp3',extension:'mp3'},{path:'Music/s.md',extension:'md'},
  {path:'Other/b.ogg',extension:'ogg'},{path:'Music/c.wav',extension:'wav'}]}}};
 assert.deepEqual(Array.from(m.writerV91SoundAudioFiles(plugin),x=>x.path),['Music/a.mp3','Music/c.wav']);
});
test('Click Clack ignores shortcuts and classifies keys',()=>{
 const {exposed:m}=moduleUnderTest('click-clack.js',['writerV91ClickCategory','writerV91ClickMerge']);
 assert.equal(m.writerV91ClickCategory({key:'a'}),'key');
 assert.equal(m.writerV91ClickCategory({key:' ',code:'Space'}),'space');
 assert.equal(m.writerV91ClickCategory({key:'Enter'}),'enter');
 assert.equal(m.writerV91ClickCategory({key:'Backspace'}),'delete');
 assert.equal(m.writerV91ClickCategory({key:'a',ctrlKey:true}),'');
 assert.equal(m.writerV91ClickCategory({key:'s',metaKey:true}),'');
 const settings={};assert.equal(m.writerV91ClickMerge(settings).enabled,false);
});
test('Flexplorer hide globs, pinning and folder sorting are independent of vault data',()=>{
 const {exposed:m}=moduleUnderTest('explorer-flex.js',['writerV91FlexMerge','writerV91FlexGlob','writerV91FlexIsHidden','writerV91FlexPatterns']);
 const cfg=m.writerV91FlexMerge({v91Flex:{hidden:['Secrets/a.md'],patterns:'Templates/**\n*.bak',folders:{Notes:{sort:'custom',order:['c.md','b.md','c.md']}}}});
 const patterns=m.writerV91FlexPatterns(cfg);
 assert.ok(m.writerV91FlexIsHidden(cfg,'Secrets/a.md',patterns));
 assert.ok(m.writerV91FlexIsHidden(cfg,'Templates/draft.md',patterns));
 assert.ok(m.writerV91FlexIsHidden(cfg,'old.bak',patterns));
 assert.ok(!m.writerV91FlexIsHidden(cfg,'Notes/readme.md',patterns));
 assert.deepEqual(Array.from(cfg.folders.Notes.order),['c.md','b.md']);
 assert.equal(m.writerV91FlexGlob(''),null);
});
test('Desktop-only sections and README feature documentation in both languages',()=>{
 const sound=fs.readFileSync(path.join(root,'src/v9/soundscapes.js'),'utf8');
 const clicks=fs.readFileSync(path.join(root,'src/v9/click-clack.js'),'utf8');
 assert.match(sound,/if\(plugin\.app\.isMobile\)return/);
 assert.match(clicks,/if\(plugin\.app\.isMobile\)return/);
 const en=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const pt=fs.readFileSync(path.join(root,'docs/README.pt-BR.md'),'utf8');
 assert.doesNotMatch(en,/^## What's new/m);
 assert.doesNotMatch(pt,/^## Novidades da/m);
 for(const doc of [en,pt]){
  assert.match(doc,/Soundscapes/);
  assert.match(doc,/Flexplorer/);
  assert.match(doc,/Click Clack/);
 }
});
