'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const required=['main.js','manifest.json','styles.css'];
for(const name of required){
 const file=path.join(root,name);
 assert(fs.existsSync(file),'Missing community asset: '+name);
 assert(fs.statSync(file).size>0,'Empty community asset: '+name);
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const versions=JSON.parse(fs.readFileSync(path.join(root,'versions.json'),'utf8'));
assert.equal(manifest.version,pkg.version);
assert.equal(lock.version,pkg.version);
assert.equal(lock.packages[''].version,pkg.version);
assert.equal(versions[manifest.version],manifest.minAppVersion);
assert.equal(manifest.id,'basic-ai-tool-for-writers');
assert.equal(manifest.isDesktopOnly,false);
assert(!/\b(?:obsidian|plugin)\b/i.test(manifest.name),'Redundant manifest name');
const release=fs.readFileSync(path.join(root,'.github/workflows/publish-release.yml'),'utf8');
assert.match(release,/actions\/attest-build-provenance@v2/);
assert.match(release,/gh release create "\$GITHUB_REF_NAME" main\.js manifest\.json styles\.css/);
assert.doesNotMatch(release,/gh release create[^\n]*\.zip/);
console.log('Community package verified: '+required.join(', '));
