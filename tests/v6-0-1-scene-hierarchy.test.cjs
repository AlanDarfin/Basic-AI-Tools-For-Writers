'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('projects.js','utf8'),bundle=fs.readFileSync('main.js','utf8'),css=fs.readFileSync('styles.css','utf8');
test('hierarchy uses one line per Longform sublevel, with no arrow widget',()=>{
 assert.match(source,/if\(level>0\)\{[\s\S]*?for\(let depth=0;depth<level;depth\+\+\)/);
 assert.match(source,/rails\.createSpan\(\{cls:'writer-project-scene-rail'\}\)/);
 assert.doesNotMatch(source,/writer-project-scene-depth-mark|↳/);
 assert.match(source,/row\.dataset\.depth=String\(level\)/);
 assert.match(source,/aria-label.*Subcapítulo nível/);
 assert.match(bundle,/rails\.createSpan\(\{cls:'writer-project-scene-rail'\}\)/);
});
test('nested scene hierarchy is retained and controls remain fixed',()=>{
 const start=source.indexOf('function lfSceneTree(flat){'),end=source.indexOf('function lfNumberScenes(',start);
 assert.ok(start>=0&&end>start,'scene hierarchy function must exist');
 const tree=vm.runInNewContext(source.slice(start,end)+'\nlfSceneTree',{}, {timeout:1000});
 const nodes=tree([{title:'Capítulo',indent:0},{title:'Subcapítulo',indent:1},{title:'Nota interna',indent:2},{title:'Próximo capítulo',indent:0}]);
 assert.equal(nodes.length,2);
 assert.equal(nodes[0].children[0].children[0].title,'Nota interna');
 assert.equal(nodes[1].title,'Próximo capítulo');
 assert.match(css,/\.writer-project-scene-rails\s*\{/);
 assert.match(css,/\.writer-project-scene-rail\s*\{/);
 assert.match(css,/border-inline-start:2px solid var\(--interactive-accent\)/);
 assert.match(css,/\.writer-project-scene-title-text\s*\{[\s\S]*?overflow-wrap:anywhere/);
 assert.match(css,/grid-template-columns:34px minmax\(0,1fr\) auto/);
});
test('stable release metadata and translations are updated',()=>{
 const manifest=require('../manifest.json'),pkg=require('../package.json'),versions=require('../versions.json');
 assert.ok(manifest.version==='6.0.1'||/^7\.0\.\d+(?:-(beta|rc)\.\d+)?$/.test(manifest.version));
 assert.equal(pkg.version,manifest.version);
 assert.equal(versions[manifest.version],manifest.minAppVersion);
 for(const file of ['README.md','docs/README.pt-BR.md','docs/V6_0_1_RELEASE.en.md','docs/V6_0_1_RELEASE.pt-BR.md'])
  assert.ok(fs.readFileSync(file,'utf8').includes('6.0.1'),file);
 const expected=/^7\.0\.\d+$/.test(manifest.version)?manifest.version:'6.0.1';
 assert.ok(fs.readFileSync('README.md','utf8').includes('Latest stable:** ['+expected+']'));
 assert.ok(fs.readFileSync('docs/README.pt-BR.md','utf8').includes('Versão atual:** '+expected));
});