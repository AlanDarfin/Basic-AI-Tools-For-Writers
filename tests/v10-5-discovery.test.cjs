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
const bibSource=fs.readFileSync('src/v9/research-style.js','utf8');
const zotero=vm.runInNewContext(bibSource+'\n'+source+'\n({writerV92BibEntries,writerV92ResearchMerge,writerV10ZoteroReferences,writerV10ZoteroBibliography})',{
 ItemView:class{},TFile,writerUi:(pt,en)=>en,writerModuleOn:plugin=>!plugin.disabled,
 parseYaml:source=>source.startsWith('{')?JSON.parse(source):({keys:['@other:2026']})
});
const bib=[
 '@string{p = "Publisher"}',
 '% @book{commented, title={Ignored comment}}',
 '@article{doe2026, title={A {nested {Better BibTeX}} title}, author={Doe, Jane}, year=2026, doi={10.1000/example}}',
 '@book(other:2026, title="Árvores" # " do Brasil", author="F. Silva", date={2026-01-01})',
 '@inbook{invalid[link], title={Ignored}}',
 '@book{unfinished, title={Not closed}',
 '@book{recovered, title={Valid next entry}}'
].join('\n');
test('Better BibTeX supports nested, multiline, quoted and concatenated reference fields',()=>{
 const refs=zotero.writerV92BibEntries(bib.replace('{nested','{nested\n'));
 assert.deepEqual(Array.from(refs,ref=>ref.key),['doe2026','other:2026','recovered']);
 assert.equal(refs[0].title,'A nested Better BibTeX title');
 assert.equal(refs[0].author,'Doe, Jane');assert.equal(refs[0].doi,'10.1000/example');
 assert.equal(refs[1].title,'Árvores do Brasil');assert.equal(refs[1].year,'2026-01-01');
});
test('malformed nested entries cannot cause repeated unbounded scans',()=>{
 const malformed='@book{unfinished, title={\n'.repeat(17000);
 const refs=zotero.writerV92BibEntries('@book{valid, title={Valid entry}}\n'+malformed);
 assert.deepEqual(Array.from(refs,ref=>ref.key),['valid']);
});
test('local BibTeX reads only the opt-in vault file, retains Markdown matches and caches by file revision',async()=>{
 const file=Object.assign(new TFile(),{path:'Zotero/reference.md',extension:'md',basename:'Imported'});
 const requests=[];let mtime=1;
 const cfg=zotero.writerV92ResearchMerge({}),plugin={settings:{v92Research:cfg},app:{
  metadataCache:{getFileCache:()=>({frontmatter:{citekey:'doe2026',title:'Imported title'}})},
  vault:{getMarkdownFiles:()=>[file],adapter:{stat:async path=>{requests.push(['stat',path]);return {type:'file',size:bib.length,mtime};},
   read:async path=>{requests.push(['read',path]);return bib;}}}
 }};
 assert.equal((await zotero.writerV10ZoteroReferences(plugin)).references.length,1);
 assert.deepEqual(requests,[]);
 cfg.zoteroBibFile='../Outside.bib';
 assert.equal((await zotero.writerV10ZoteroReferences(plugin)).unavailable,true);
 assert.deepEqual(requests,[]);
 cfg.zoteroBibFile='Referências/Artigos 2026.bib';
 const {references,unavailable}=await zotero.writerV10ZoteroReferences(plugin);
 assert.equal(unavailable,false);
 assert.deepEqual(Array.from(references,ref=>ref.title),['Imported title','Árvores do Brasil','Valid next entry']);
 await zotero.writerV10ZoteroReferences(plugin);
 assert.equal(requests.filter(([method])=>method==='read').length,1);
 mtime++;
 await Promise.all([zotero.writerV10ZoteroReferences(plugin),zotero.writerV10ZoteroReferences(plugin)]);
 assert.equal(requests.filter(([method])=>method==='read').length,2);
 plugin.disabled=true;
 assert.equal((await zotero.writerV10ZoteroReferences(plugin)).references.length,1);
 assert.equal(requests.filter(([method])=>method==='read').length,2);
});
test('bibliography block renders only requested keys and handles unavailable exports',async()=>{
 const cfg=zotero.writerV92ResearchMerge({v92Research:{zoteroBibFile:'Sources.bib'}});
 let available=true;
 const plugin={settings:{v92Research:cfg},app:{vault:{getMarkdownFiles:()=>[],adapter:{
  stat:async()=>available?{type:'file',size:bib.length,mtime:1}:null,read:async()=>bib
 }}}};
 const tags=[];
 const el={createEl:(tag,options)=>{tags.push([tag,options?.text]);return el;},
  createSpan:options=>tags.push(['span',options.text])};
 await zotero.writerV10ZoteroBibliography(plugin,'keys: [other:2026]',el,{});
 assert.deepEqual(tags,[['ol',undefined],['li',undefined],['span','F. Silva · Árvores do Brasil · 2026-01-01'],['small',' @other:2026']]);
 available=false;tags.length=0;
 await zotero.writerV10ZoteroBibliography(plugin,'keys: [other:2026]',el,{});
 assert.match(tags[0][1],/Could not read BibTeX/);
 available=true;tags.length=0;
 await zotero.writerV10ZoteroBibliography(plugin,'{"keys":[" recovered ","@other:2026","recovered"]}',el,{});
 assert.deepEqual(tags.filter(([tag])=>tag==='small').map(([,key])=>key),[' @recovered',' @other:2026']);
 tags.length=0;
 await zotero.writerV10ZoteroBibliography(plugin,'{bad',el,{});
 assert.deepEqual(tags,[['p','Invalid bibliography block options.']]);
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
