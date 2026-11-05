'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
class TFile{}
const source=fs.readFileSync('src/v10/discovery.js','utf8');
const helpers=vm.runInNewContext(source+'\n({writerV10DiscoveryMerge,writerV10RelatedTokens,writerV10RelatedSignature,writerV10RelatedScore,writerV10TrashRestore,writerV10TrashList,writerV10TrashFolders,writerV10TrashDeleteFolder,writerV10TrashPermanentlyDelete,writerV10ZoteroRef})',
 {console,Map,Set,Uint32Array,Math,Promise,setTimeout,ItemView:class{},TFile,writerUi:(pt,en)=>en});
test('Discovery defaults remain bounded and opt in to local matching',()=>{
 const settings={};
 const cfg=helpers.writerV10DiscoveryMerge(settings);
 assert.equal(cfg.related,true);assert.equal(cfg.trash,true);
 assert.ok(cfg.maxCandidates<=1200);
 const old={v10Discovery:{enabled:false,maxCandidates:99999,maxResults:100}};
 const v=helpers.writerV10DiscoveryMerge(old);
 assert.equal(v.enabled,false);assert.equal(v.maxCandidates,1200);assert.equal(v.maxResults,20);
});
test('Multilingual tokens and similarity use a bounded local signature',()=>{
 const a=helpers.writerV10RelatedTokens('Arquivo: escrita narrativa personagens criação literatura 中文写作');
 const b=helpers.writerV10RelatedTokens('Personagens e escrita narrativa com literatura 中文学习');
 const c=helpers.writerV10RelatedTokens('Bananas cozinha maçãs e compras do mercado');
 const entry=t=>({tokens:t,bloom:helpers.writerV10RelatedSignature(t),tags:[]});
 const same=helpers.writerV10RelatedScore(entry(a),entry(b));
 const other=helpers.writerV10RelatedScore(entry(a),entry(c));
 assert.ok(a.size>3);assert.ok([...a].some(t=>t.includes('中文')));
 assert.ok(same>other);
});
test('Trash enumerates only Obsidian internal files and respects nested folders',async()=>{
 const adapter={exists:async()=>true,list:async path=>path==='.trash'?{files:['.trash/one.md'],folders:['.trash/Old']}:{files:['.trash/Old/two.md'],folders:[]}};
 const paths=await helpers.writerV10TrashList({app:{vault:{adapter}}});
 assert.deepEqual(Array.from(paths),['.trash/Old/two.md','.trash/one.md']);
});
test('Trash restore protects collisions and forbids traversal and system paths',async()=>{
 const actions=[];const existing=new Set(['Present.md']);
 const adapter={exists:async p=>existing.has(p),mkdir:async p=>actions.push(['mkdir',p]),rename:async(a,b)=>actions.push(['rename',a,b]),remove:async p=>actions.push(['remove',p])};
 const plugin={app:{vault:{adapter}}};
 await assert.rejects(helpers.writerV10TrashRestore(plugin,'.trash/../escape.md'));
 await assert.rejects(helpers.writerV10TrashRestore(plugin,'/Downloads/secret.md'));
 await assert.rejects(helpers.writerV10TrashRestore(plugin,'.trash/Present.md'));
 assert.equal(actions.length,0);
 const restored=await helpers.writerV10TrashRestore(plugin,'.trash/Notes/chapter.md');
 assert.equal(restored,'Notes/chapter.md');
 assert.deepEqual(actions[0],['mkdir','Notes']);
 assert.deepEqual(actions[1],['rename','.trash/Notes/chapter.md','Notes/chapter.md']);
 await assert.rejects(helpers.writerV10TrashPermanentlyDelete(plugin,'System/file.md'));
 await helpers.writerV10TrashPermanentlyDelete(plugin,'.trash/Old.md');
 assert.deepEqual(actions[2],['remove','.trash/Old.md']);
});
test('Trash restores and removes folders only inside internal trash',async()=>{
 const calls=[];
 const adapter={exists:async path=>path==='.trash',list:async path=>({files:[],folders:path==='.trash'?['.trash/Old']:[]}),rmdir:async(path,recursive)=>calls.push([path,recursive])};
 const plugin={app:{vault:{adapter}}};
 assert.deepEqual(Array.from(await helpers.writerV10TrashFolders(plugin)),['.trash/Old']);
 await assert.rejects(helpers.writerV10TrashDeleteFolder(plugin,'.trash/../Documents'));
 await helpers.writerV10TrashDeleteFolder(plugin,'.trash/Old');
 assert.deepEqual(calls,[['.trash/Old',true]]);
});
test('Zotero note metadata produces citekey and author without network',()=>{
 const file={basename:'Research',path:'Zotero/Research.md'};
 const app={metadataCache:{getFileCache:()=>({frontmatter:{title:'Example research',citekey:'doe2026',author:'Doe, Jane',DOI:'10.1000/example'}})}};
 const ref=helpers.writerV10ZoteroRef({app},file);
 assert.equal(ref.key,'doe2026');assert.equal(ref.author,'Doe, Jane');assert.equal(ref.doi,'10.1000/example');
});
test('Homepage, bundle, and styles include all discovery integrations',()=>{
 const home=fs.readFileSync('src/v8/writing-home.js','utf8'),build=fs.readFileSync('scripts/build-v3.js','utf8');
 const enhancement=fs.readFileSync('src/v10/enhancements.js','utf8');
 for(const key of ['books','trash','reading','zotero'])assert.match(home,new RegExp('\\b'+key+':p=>'));
 assert.doesNotMatch(home,/related:p=>/);
 assert.doesNotMatch(fs.readFileSync('src/v10/discovery.js','utf8'),/id:'v10-trash-explorer'/);
 assert.match(build,/v10\/discovery/);
 assert.match(enhancement,/writerV10DiscoveryRegister/);
 assert.match(enhancement,/markdown-source-view \.cm-scroller/);
});
