'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const util=fs.readFileSync('src/v8/home-utilities.js','utf8');
const finish=fs.readFileSync('src/v8/finish-blocks.js','utf8');
const home=fs.readFileSync('src/v8/writing-home.js','utf8');
const spaces=fs.readFileSync('src/v9/smart-spaces.js','utf8');
const obs={Platform:{isMobile:false}};
const common={URL,console,require:id=>id==='obsidian'?obs:null,writerUi:(pt,en)=>en};
const api=vm.runInNewContext(util+
 '\n({writerV8HomeValidURL,writerV8HomeSearchURL,writerV8HomeOpenURL,writerV8HomeSurfing})',common);
const migration=vm.runInNewContext(finish+
 '\n({writerV8FinishMerge})',{URL,writerV8HomeValidURL:api.writerV8HomeValidURL,
 writerV8HomeIconName:()=> 'book-open',writerV9SafeHex:()=>''});
test('Surfing search uses the installed default engine and encodes query terms safely',()=>{
 const plugin={app:{plugins:{enabledPlugins:new Set(['surfing']),plugins:{surfing:{
  settings:{defaultSearchEngine:'Duckduckgo',customSearchEngine:[]}
 }}}},settings:{v8Finish:{homeWebSearchEngine:'surfing'}}};
 assert.equal(api.writerV8HomeSearchURL(plugin,'write notes & books'),
  'https://duckduckgo.com/?q=write%20notes%20%26%20books');
 assert.equal(api.writerV8HomeSearchURL(plugin,'obsidian.md'),'https://obsidian.md/');
 for(const unsafe of ['','   ','a\nb'])assert.throws(()=>api.writerV8HomeSearchURL(plugin,unsafe));
});
test('user-selected search engine and fallback remain valid without Surfing',()=>{
 const plugin={app:{},settings:{v8Finish:{homeWebSearchEngine:'bing'}}};
 assert.equal(api.writerV8HomeSearchURL(plugin,'example phrase'),
  'https://www.bing.com/search?q=example%20phrase');
 plugin.settings.v8Finish.homeWebSearchEngine='surfing';
 assert.equal(api.writerV8HomeSearchURL(plugin,'other'),
  'https://www.google.com/search?q=other');
});
test('web links open in Surfing if installed and preference is automatic',async()=>{
 let last={};
 const leaf={setViewState:async next=>{last=next;},getViewState:()=>last};
 const plugin={settings:{v8Finish:{homeWebSearchTarget:'auto'}},app:{
  isMobile:false,plugins:{enabledPlugins:new Set(['surfing']),plugins:{surfing:{settings:{}}}},
  workspace:{getLeaf:()=>leaf}
 }};
 assert.equal(await api.writerV8HomeOpenURL(plugin,'https://example.org'),'surfing');
 assert.equal(last.type,'surfing-view');
 assert.equal(last.state.url,'https://example.org/');
});
test('browser routing uses Web Viewer when Surfing is absent and external on mobile',async()=>{
 let last={};
 const desktop={settings:{v8Finish:{homeWebSearchTarget:'auto'}},app:{
  isMobile:false,plugins:{enabledPlugins:new Set(),plugins:{}},
  internalPlugins:{getPluginById:()=>({enabled:true})},
  workspace:{getLeaf:()=>({setViewState:async next=>{last=next;},getViewState:()=>last})}
 }};
 assert.equal(await api.writerV8HomeOpenURL(desktop,'example.org'),'webviewer');
 assert.equal(last.type,'webviewer');
 const calls=[];
 const mobile={settings:{v8Finish:{homeWebSearchTarget:'surfing'}},app:{
  isMobile:true,plugins:{enabledPlugins:new Set(['surfing']),plugins:{surfing:{}}},
  workspace:{containerEl:{ownerDocument:{defaultView:{
   open:(url,target)=>calls.push({url,target})
  }}}}
 }};
 assert.equal(await api.writerV8HomeOpenURL(mobile,'example.org'),'external');
 assert.equal(calls[0].target,'_system');
});
test('web bookmarks are sanitized, deduplicated, capped and off by default',()=>{
 const empty={};
 migration.writerV8FinishMerge(empty);
 assert.ok(empty.v8Finish.homeOrder.includes('webBookmarks'));
 assert.ok(empty.v8Finish.homeHidden.includes('webBookmarks'));
 assert.equal(empty.v8Finish.homeWebSearchTarget,'auto');
 const cfg={v8Finish:{homeOrder:['recent'],homeHidden:['recent'],
 homeWebBookmarks:[
 {id:'test',title:'Example',url:'example.org',icon:'globe',group:'Research'},
 {id:'again',title:'duplicate',url:'https://example.org/',icon:'globe'},
 {id:'bad',title:'Unsafe',url:'javascript:alert(1)'},
 {id:'safe',title:'Wikipedia',url:'https://wikipedia.org/',icon:'book-open'}
 ]}};
 migration.writerV8FinishMerge(cfg);
 assert.equal(cfg.v8Finish.homeWebBookmarks.length,2);
 assert.equal(cfg.v8Finish.homeWebBookmarks[0].url,'https://example.org/');
 assert.ok(cfg.v8Finish.homeHidden.includes('webBookmarks'));
 assert.ok(!cfg.v8Finish.homeOrder.includes('search'));
});
test('widget integrates with existing dashboard and per-Space preferences',()=>{
 for(const part of ['renderWebBookmarks(parent)','editWebBookmark(bookmark)',
  'moveWebBookmark(bookmark,offset)','removeWebBookmark(bookmark)',
  'homeSearchWebMode','v1203-bookmark-current-webpage','v1203-web-search'])
  assert.ok(home.includes(part),part);
 assert.match(spaces,/const widgetKeys=\[[^\]]*'webBookmarks'/);
 assert.doesNotMatch(home,/registerEditorExtension\(/);
 assert.doesNotMatch(util,/window\.location\s*=/);
});
