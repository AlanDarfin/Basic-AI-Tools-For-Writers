'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('src/v9/smart-spaces.js');
const scope=vm.runInNewContext(source+'\n({writerV9SpaceSanitize,writerV9SpaceItems})',{ItemView:class{}});
test('per-Space hiding excludes only paths in that collection',()=>{
 const a=scope.writerV9SpaceSanitize({id:'a',name:'Writing',hiddenPaths:['Private','Draft.md']});
 const b=scope.writerV9SpaceSanitize({id:'b',name:'All'});
 const files=['Private/one.md','Draft.md','Public/one.md'].map(path=>({
  path,basename:path.split('/').pop(),stat:{mtime:1}
 }));
 const plugin={app:{vault:{getMarkdownFiles:()=>files},metadataCache:{getFileCache:()=>({})}}};
 assert.deepEqual(Array.from(scope.writerV9SpaceItems(plugin,a),file=>file.path),['Public/one.md']);
 assert.equal(scope.writerV9SpaceItems(plugin,b).length,3);
 assert.match(source,/Ocultar apenas neste Space/);
});
test('Spaces can use manual curated ordering and search beyond old 200-note cap',()=>{
 const items=Array.from({length:250},(_,i)=>({path:'Notes/'+String(i).padStart(3,'0')+'.md',
  basename:String(i).padStart(3,'0'),stat:{mtime:i}}));
 const plugin={app:{vault:{getMarkdownFiles:()=>items},metadataCache:{getFileCache:()=>({})}}};
 const space=scope.writerV9SpaceSanitize({name:'Manual',mode:'curated',sort:'manual',
  includePaths:['Notes/249.md','Notes/001.md','Notes']});
 const result=Array.from(scope.writerV9SpaceItems(plugin,space),item=>item.path);
 assert.equal(result.length,250);
 assert.equal(result[0],'Notes/249.md');
 assert.equal(result[1],'Notes/001.md');
});
test('title icon shares native explorer setting and does not rewrite notes',()=>{
 const src=read('src/v9/native-explorer.js');
 assert.match(src,/writer-v9-inline-title-icon/);
 assert.match(src,/getLeavesOfType\?\.\('markdown'\)/);
 assert.match(src,/active-leaf-change/);
 assert.match(src,/file-open/);
 assert.match(src,/writerV9ExplorerRefresh/);
});
test('preview restores square thumbnail to right side on mobile',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 assert.match(css,/9\.2\.15/);
 assert.match(css,/flex-direction:row/);
 assert.match(css,/aspect-ratio:1/);
 assert.match(css,/margin-inline-start:auto/);
 assert.match(css,/color:inherit/);
 assert.match(css,/body\.is-mobile/);
});
