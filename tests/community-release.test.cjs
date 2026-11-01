'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('community package contains the required assets and consistent versions',()=>{
 const result=cp.spawnSync(process.execPath,['scripts/check-community-package.cjs'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
test('Pandoc remains opt-in and mobile-guarded without shell interpolation',()=>{
 const src=fs.readFileSync(path.join(root,'src/v5/pandoc-export.js'),'utf8');
 assert.match(src,/enabled:false/);
 assert.match(src,/plugin\.app\.isMobile/);
 assert.match(src,/shell:false/);
 assert.match(src,/cp\.spawn\(/);
});
