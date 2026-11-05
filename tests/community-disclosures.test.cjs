'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('all direct network request call sites and Zotero adapter are inventoried in security disclosures',()=>{
 const bundle=read('main.js');
 const hits=bundle.match(/\brequestUrl\s*\(/g)||[];
 assert.equal(hits.length,8,'Update SECURITY.md and this inventory if requestUrl call sites change');
 for(const fragment of ['UnicodeData.txt','api.languagetool.org/v2/check','/v1/models','/v1/chat/completions','Acylation/obsidian-click-clack']){
   assert(bundle.includes(fragment),'Missing expected network functionality: '+fragment);
 }
 const security=read('SECURITY.md');
 assert(read('src/v10/zotero-web.js').includes('api.zotero.org'));
 assert(read('src/v10/calendar-feeds.js').includes('requestUrl'));

 for(const fragment of ['Unicode index download','LanguageTool grammar check','AI model discovery','AI requests','speech.platform.bing.com','auto-check is enabled','Click Clack sound pack download','Photo search and download','Unsplash download tracking','Zotero Web API read-only','iCalendar HTTPS subscriptions']){
   assert(security.includes(fragment),'Missing disclosure: '+fragment);
 }
});
test('online TTS uses documented, opt-in WebSocket transport',()=>{
 const tts=read('src/v3/tts-online.js');
 assert(tts.includes('speech.platform.bing.com'));
 assert(tts.includes('new WebSocket(url)'));
 assert(read('SECURITY.md').includes('WebSocket'));
});
test('optional integrated Pandoc is guarded on mobile and avoids an OS shell',()=>{
 const source=read('src/v5/pandoc-export.js');
 assert(source.includes('enabled:false'));
 assert(source.includes('plugin.app.isMobile'));
 assert(source.includes('shell:false'));
 assert(source.includes('writerPandocExecutableAllowed'));
});
