'use strict';
/* v6 preflight: safeguard the existing 5.x behavior before beginning the six integrations. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=filename=>fs.readFileSync(path.resolve(__dirname,'..',filename),'utf8');
let passed=0;
function test(name,fn){fn();console.log('PASS',name);passed++;}
test('v6 planning does not silently change stable Obsidian manifest',()=>{
 const manifest=JSON.parse(read('manifest.json')),pkg=JSON.parse(read('package.json')),versions=JSON.parse(read('versions.json'));
 assert.equal(manifest.id,'basic-ai-tool-for-writers');
 assert.equal(manifest.version,pkg.version);
 assert.equal(versions[manifest.version],manifest.minAppVersion);
 assert.equal(manifest.isDesktopOnly,false);
});
test('Markdown spoiler is already owned by Extended Syntax',()=>{
 const ext=read('src/v5/extended-syntax.js');
 assert.match(ext,/spoiler:true/);
 assert.match(ext,/\['spoiler','spoiler'/);
 assert.match(ext,/registerMarkdownPostProcessor/);
 assert.match(ext,/registerEditorExtension/);
});
test('both existing typing modules are preserved before the new linter',()=>{
 const easy=read('src/v5/easy-typing.js'),typo=read('src/v5/smart-typography.js');
 assert.match(easy,/clipboardInputFilter/);
 assert.match(easy,/writerEasyTabOut/);
 assert.match(typo,/transactionFilter/);
 assert.match(typo,/writerTypingUnsafeContext/);
});
test('canonical Longform and plugin bundle scripts are present',()=>{
 const build=read('scripts/build-v3.js'),sync=read('scripts/sync-projects.js');
 assert.ok(build.includes('src/v3/'));
 assert.ok(build.includes('src/v5/'));
 assert.ok(sync.includes('projects.js'));
 assert.ok(sync.includes('main.js'));
 assert.ok(read('projects.js').includes('lastLongformProject'));
});
test('bilingual v6 audit lists every supplied reference and licensing boundary',()=>{
 const pt=read('docs/V6-ARCHITECTURE.pt-BR.md'),en=read('docs/V6-ARCHITECTURE.en.md');
 for(const name of ['Advanced Ruby','Discord Timestamps','Interactive Ratings','Discord Syntax','Linter','Reading Time']){
  assert.ok(pt.includes(name),'Missing pt-BR: '+name);
  assert.ok(en.includes(name),'Missing en: '+name);
 }
 assert.ok(pt.includes('PolyForm-Perimeter'));
 assert.ok(en.includes('PolyForm-Perimeter'));
 assert.ok(pt.includes('5.2.0')&&en.includes('5.2.0'));
});
console.log('Passed '+passed+' v6 foundation preflight checks');
