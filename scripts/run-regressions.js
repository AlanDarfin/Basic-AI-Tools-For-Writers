#!/usr/bin/env node
'use strict';
/* Run each historical test in its own Node process, collect ALL regressions. */
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pkg=require('../package.json');
const list=String(pkg.scripts['test:sequential']||'').split(/\s*&&\s*/).filter(Boolean);
if(!list.length)throw Error('No regression tests registered');
let failed=0;
for(const command of list){
 const match=/^node\s+(--test\s+)?(tests\/[\w.\/-]+)$/.exec(command.trim());
 if(!match)throw Error('Unsupported test command: '+command);
 const args=[...(match[1]?['--test']:[]),match[2]];
 const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:2*1024*1024});
 const ok=r.status===0&&!r.error;
 process.stdout.write((ok?'PASS ':'FAIL ')+match[2]+'\n');
 if(!ok){
  failed++;
  if(r.error)process.stderr.write(String(r.error)+'\n');
  const output=(r.stdout||'')+'\n'+(r.stderr||'');
  process.stderr.write(output.slice(-10000)+'\n');
 }
}
process.stdout.write('Regression suite: '+(list.length-failed)+' passed / '+failed+' failed ('+list.length+' files)\n');
if(failed)process.exitCode=1;
