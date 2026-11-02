'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const main=read('main.js'),style=read('src/styles/v9-design-system.css');
test('v1 Markdown dictionary headings and separators still parse after historical rename',()=>{
 const i=main.indexOf('function parseDictionary(text) {');
 const j=main.indexOf('const AI_PROVIDERS=',i);
 assert.ok(i>=0&&j>i,'v1-compatible parser still exists');
 const fn=vm.runInNewContext(main.slice(i,j)+'\nparseDictionary',{});
 const entries=fn('# Abelha\nUma descrição.\n\n---\n# Abelhas\nOutra definição.\n---\n');
 assert.equal(entries.length,2);
 assert.equal(entries[0].word,'Abelha');
 assert.match(entries[0].markdown,/Uma descrição/);
 assert.equal(entries[1].word,'Abelhas');
});
test('all v9 settings appear under distinct Customization tabs rather than General',()=>{
 assert.match(main,/\['customize',msg\('Personalização','Customization'\)/);
 for(const key of ['homepage','v9Toolbar','v9Explorer','v9Spaces','v9Calendar']){
  assert.match(main,new RegExp("id==='"+key+"'"),key);
 }
 const general=main.slice(main.indexOf("}else if(id==='general'){"),main.indexOf("}else if(id==='dictionary'){"));
 for(const key of ['writerV9ToolbarSettings','writerV9ExplorerSettings','writerV9SpacesSettings','writerV9CalendarSettings']){
  assert.doesNotMatch(general,new RegExp(key));
 }
});
test('only Basic-owned visual elements are styled by the final theme layer',()=>{
 assert.ok(style.length>1000);
 assert.match(style,/var\(--background-secondary\)/);
 assert.match(style,/var\(--interactive-accent\)/);
 assert.match(style,/focus-visible/);
 assert.match(style,/@media\(max-width:720px\)/);
 assert.doesNotMatch(style,/!important|\bzoom\s*:|\bcolumn-gap\s*:/);
 assert.doesNotMatch(style,/\n(?:body|html|\.workspace-leaf|\.modal-container)\s*\{/);
});
test('file explorer observes only its own view and does not rebuild stable icons',()=>{
 const source=read('src/v9/native-explorer.js');
 assert.match(source,/explorerObservers=new Map/);
 assert.match(source,/watcher\.observe\(host,\{childList:true,subtree:true\}\)/);
 assert.doesNotMatch(source,/observer\.observe\(documentRoot/);
 assert.match(source,/existing\?\.dataset\.icon!==desiredIcon/);
 assert.match(main,/writerV9RegisterExplorer\(this\)/);
});
test('v9 comparison and historic data migration are documented without claiming full upstream parity',()=>{
 const s=read('docs/V9_FINAL_AUDIT.md');
 for(const entry of ["Alan's Offline Dictionary","alans-offline-dictionary","Make.md","cMenu","Full Calendar","LanguageTool","Spaced Repetition","Obsidian"])assert.ok(s.includes(entry),entry);
 assert.match(s,/not a complete|no claim of exact/i);
});
