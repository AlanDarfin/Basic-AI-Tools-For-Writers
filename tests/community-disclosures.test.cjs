'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('runtime retains the existing HTTP inventory and declares two opt-in Visual Kit import routes',()=>{
 const bundle=read('main.js').replace(/\/\*! Visual Kit \(embedded by Basic\)[\s\S]*?(?=\/\/ END WRITER V3 MODULES)/,'');
 const hits=bundle.match(/\brequestUrl\s*\(/g)||[];
 const grammarAlias=(bundle.match(/await send\(\{url:endpoint,method:'POST'/g)||[]).length;
 assert.equal(hits.length+grammarAlias,9,'Update SECURITY.md and this inventory if HTTP request paths change');
 for(const fragment of ['UnicodeData.txt','api.languagetool.org/v2/check','/v1/models','/v1/chat/completions','Acylation/obsidian-click-clack']){
   assert(bundle.includes(fragment),'Missing expected network functionality: '+fragment);
 }
 const security=read('SECURITY.md');
 for(const file of ['src/paste/HtmlImagePaste.ts','src/html-notes/Assets.ts'])
   assert.equal((read('vendor/visual-kit/'+file).match(/\brequestUrl\(/g)||[]).length,1);
 assert(security.includes('Visual Kit remote image import'));
 assert(read('vendor/visual-kit/src/settings.ts').includes('htmlExternalImages: "block"'));
 assert(read('src/integrations/zotero-web.js').includes('api.zotero.org'));
 assert(read('src/integrations/calendar-feeds.js').includes('requestUrl'));

 for(const fragment of ['Unicode index download','LanguageTool grammar check','AI model discovery','AI requests','Dedicated translation APIs','speech.platform.bing.com','auto-check is enabled','Click Clack sound pack download','Photo search and download','Unsplash download tracking','Zotero Web API read-only','iCalendar HTTPS subscriptions']){
   assert(security.includes(fragment),'Missing disclosure: '+fragment);
 }
});
test('online TTS uses documented, opt-in WebSocket transport',()=>{
 const tts=read('src/integrations/tts-online.js');
 assert(tts.includes('speech.platform.bing.com'));
 assert(tts.includes('new WebSocket(url)'));
 assert(read('SECURITY.md').includes('WebSocket'));
});
test('optional integrated Pandoc is guarded on mobile and avoids an OS shell',()=>{
 const source=read('src/writing/pandoc-export.js');
 assert(source.includes('enabled:false'));
 assert(source.includes('plugin.app.isMobile'));
 assert(source.includes('shell:false'));
 assert(source.includes('writerPandocExecutableAllowed'));
});
