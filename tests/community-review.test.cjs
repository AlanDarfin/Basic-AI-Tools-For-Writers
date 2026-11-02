'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const pandoc=fs.readFileSync('src/v5/pandoc-export.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const sandbox={writerUi:(pt,en)=>en,console,Modal:class{},Setting:class{},Notice:class{}};
const api=vm.runInNewContext(pandoc+'\n({writerPandocExecutableAllowed,writerPandocExportRun,writerPandocExportArgs})',sandbox);
test('Pandoc accepts executable names, not arbitrary commands or flags',()=>{
 for(const path of ['pandoc','/usr/bin/pandoc','C:\\Program Files\\Pandoc\\pandoc.exe','pandoc.exe'])assert.equal(api.writerPandocExecutableAllowed(path),true,path);
 for(const path of ['sh','/bin/bash','evil-pandoc','pandoc --version','pandoc\nfoo',''])assert.equal(api.writerPandocExecutableAllowed(path),false,path);
});
test('mobile Pandoc fails before loading Node.js modules',async()=>{
 await assert.rejects(()=>api.writerPandocExportRun({app:{isMobile:true},settings:{pandocExport:{enabled:true,pandocPath:'pandoc'}}},'docx'),/desktop/i);
});
test('Pandoc never invokes a system shell',()=>{
 assert.match(pandoc,/shell:false/);
 assert.match(pandoc,/cp\.spawn\(cfg\.pandocPath/);
 assert.match(pandoc,/writerPandocExecutableAllowed\(cfg\.pandocPath\)/);
 assert.match(main,/writerPandocExecutableAllowed/);
});
test('stable version, lockfile and documentation agree',()=>{
 const m=require('../manifest.json'),p=require('../package.json'),l=require('../package-lock.json'),v=require('../versions.json');
 assert.equal(m.version,'8.0.2');assert.equal(p.version,m.version);assert.equal(l.version,m.version);
 assert.equal(l.packages[''].version,m.version);assert.equal(v[m.version],m.minAppVersion);assert.equal(m.isDesktopOnly,false);
 for(const file of ['README.md','docs/README.pt-BR.md','SECURITY.md','CONTRIBUTING.md','docs/maintenance/COMMUNITY_REVIEW.md'])
  assert.ok(fs.readFileSync(file,'utf8').length>0,file);
});
test('stable release attaches only the 3 supported files',()=>{
 const workflow=fs.readFileSync('.github/workflows/publish-release.yml','utf8');
 assert.match(workflow,/actions\/attest-build-provenance@v3/);
 assert.match(workflow,/npm ci --ignore-scripts/);
 assert.match(workflow,/gh release create "\$RELEASE_TAG" main\.js manifest\.json styles\.css/);
 assert.doesNotMatch(workflow,/gh release create[^\n]*\.zip/);
 assert.match(workflow,/actions\/upload-artifact@v4/);
});
