'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
class TFolder{constructor(path){this.path=path;this.name=path.split('/').at(-1);}}
class TFile{constructor(path,parent){this.path=path;this.basename=path.split('/').at(-1).replace(/\.md$/,'');this.extension=path.split('.').at(-1);this.parent=parent;this.stat={mtime:123};}}
const folder=new TFolder('Books/Act 2'),file=new TFile('Books/Act 2/Act 2.md',folder),other=new TFile('Books/Act 2/Chapter.md',folder);
const parseYaml=text=>{
 const result={};let last='';
 for(const line of String(text).split(/\r?\n/)){
  const m=/^\s*([a-zA-Z][\w-]*):\s*(.*)$/.exec(line);
  if(!m)continue;
  const value=m[2].trim();
  result[m[1]]=value==='true'?true:value==='false'?false:
    /^-?\d+(?:\.\d+)?$/.test(value)?Number(value):
    value.replace(/^["']|["']$/g,'');
  last=m[1];
 }
 return result;
};
const context={
 console,TFile,TFolder,ItemView:class{},Modal:class{},Setting:class{},
 MarkdownRenderer:{render:async()=>{}},parseYaml,
 writerUi:(pt,en)=>en||pt,writerV9SafeHex:v=>/^#[0-9a-fA-F]{6}$/.test(v)?v:'',
 writerV9AvailableIcons:()=>['heart','star','bookmark','diamond','book-heart','flower-2'],
 writerV8HomeToggleFavorite:(plugin,path)=>{
  const fav=plugin.settings.v8Finish.homeFavorites;
  plugin.settings.v8Finish.homeFavorites=fav.includes(path)?fav.filter(x=>x!==path):[path,...fav];
 },
 writerModuleOn:(plugin,id)=>plugin.settings.visibleModules?.[id]!==false,
 writerV7FolderNote:()=>file,
 writerV8HomeQuoteChoices:()=>[['Manual original','Writer']],
 WRITER_V8_HOME_VIEW:'writer-writing-home',
 require:()=>({Component:class{load(){}unload(){}}}),
 Date,Math,Number,Array,Object,Map,Set,String,RegExp,Intl
};
function load(file,names){
 const s=read(file);
 return vm.runInNewContext(s+'\n({'+names.join(',')+'})',context);
}
const exp=load('src/v9/explorer-favorites-preview.js',[
 'writerV92ExplorerMerge','writerV92FavoriteList','writerV92FavoriteToggle','writerV92FolderDescription','writerV92IsFolderNote','writerV92Excerpt','writerV92PreviewInfo'
]);
const mark=load('src/v9/markdown-interactive.js',[
 'writerV92MarkdownMerge','writerV92ColumnsParse','writerV92ProgressModel','writerV92ClockValue','writerV92MetaToken','writerV92MetaPathSafe','writerV92BoundNumber','writerV92DateCountdown'
]);
context.writerV92BoundNumber=mark.writerV92BoundNumber;
const zot=load('src/v9/zotero-quotes.js',[
 'writerV92ZoteroMerge','writerV92ZoteroMeta','writerV92ZoteroExtract','writerV92ZoteroBibEntries','writerV92ZoteroQuoteChoices','writerV92ZoteroQuotesForHome'
]);
const style=load('src/v9/style-session.js',[
 'writerV92StyleMerge','writerV92StyleRules','writerV92SessionMerge','writerV92SessionClean','WRITER_V92_SESSION_VIEW'
]);
test('all nine additions are opt-in visible modules with version, build and CSS sync',()=>{
 const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),
  manifest=JSON.parse(read('manifest.json')),versions=JSON.parse(read('versions.json'));
 for(const value of [pkg.version,lock.version,lock.packages[''].version,manifest.version])assert.equal(value,'9.2.0');
 assert.equal(versions['9.2.0'],'1.11.4');
 const main=read('main.js'),modules=read('src/v4/modules.js'),build=read('scripts/build-v3.js');
 for(const f of ['explorer-favorites-preview','markdown-interactive','zotero-quotes','style-session']){
  assert.ok(main.includes('// v3 module: src/v9/'+f+'.js'));
  assert.ok(build.includes("'v9/"+f+"'"));
 }
 for(const name of ['favoriteNotes','filePreview','markdownColumns','metaBind','progressBars','noteWidgets','zotero','styleMate','sessionNotes'])
  assert.ok(modules.includes("['"+name+"'"),name);
 for(const fun of ['writerV92ExplorerMerge','writerV92MarkdownMerge','writerV92ZoteroMerge','writerV92StyleMerge','writerV92SessionMerge',
  'writerV92ExplorerRegister','writerV92MarkdownRegister','writerV92ZoteroRegister','writerV92StyleSessionRegister'])
  assert.ok(main.includes(fun+'(this.settings)')||main.includes(fun+'(this)'),fun);
 assert.match(main,/writerV92ZoteroSettings\(this\.plugin,panel\)/);
 assert.match(main,/writerV92ExplorerSettings\(this\.plugin,panel\)/);
 assert.match(main,/writerV92MarkdownSettings\(this\.plugin,panel\)/);
 assert.match(main,/writerV92StyleSettings\(this\.plugin,panel\)/);
 assert.match(main,/writerV92SessionSettings\(this\.plugin,panel\)/);
 assert.match(read('styles.css'),/writer-v92-favorite-icon/);
 assert.match(read('scripts/build-css.js'),/v9-2-integrations\.css/);
});
test('favorite icon customizable, shared with Home, filled in Explorer and capped safely',()=>{
 const cfg=exp.writerV92ExplorerMerge({v92Explorer:{favoriteIcon:'star',favoriteColor:'#123456',previews:'all'}});
 assert.equal(cfg.favoriteIcon,'star');assert.equal(cfg.favoriteColor,'#123456');
 assert.equal(exp.writerV92ExplorerMerge({v92Explorer:{favoriteIcon:'impossible',previews:'bad'}}).favoriteIcon,'heart');
 assert.equal(exp.writerV92ExplorerMerge({v92Explorer:{previews:'bad'}}).previews,'folder');
 const plugin={settings:{v8Finish:{homeFavorites:['A.md']},v92Explorer:cfg},saveSettings:async()=>{},
  app:{workspace:{getLeavesOfType:()=>[]}}};
 exp.writerV92FavoriteToggle(plugin,'B.md');
 assert.ok(plugin.settings.v8Finish.homeFavorites.includes('B.md'));
 exp.writerV92FavoriteToggle(plugin,'B.md');
 assert.ok(!plugin.settings.v8Finish.homeFavorites.includes('B.md'));
 assert.match(read('src/styles/v9-2-integrations.css'),/is-filled svg\s*\{\s*fill:currentColor/);
 assert.match(read('src/v8/writing-home.js'),/homeFavorites=list\.slice\(0,500\)/);
});
test('Folder Note description and preview modes respect note identity and YAML descriptions',()=>{
 const app={metadataCache:{getFileCache(f){return {frontmatter:
  f.path===file.path?{description:'A cool folder note'}:{description:'Normal chapter'}};
 }}};
 const data=exp.writerV92FolderDescription(app,folder);
 assert.equal(data.note.path,file.path);assert.equal(data.description,'A cool folder note');
 assert.equal(exp.writerV92IsFolderNote(app,file),true);
 assert.equal(exp.writerV92IsFolderNote(app,other),false);
 const plugin={app,settings:{v92Explorer:{previews:'folder',preferDescription:true}}};
 const cache=new Map();
 assert.equal(exp.writerV92PreviewInfo(plugin,folder,cache).text,'A cool folder note');
 assert.equal(exp.writerV92PreviewInfo(plugin,other,cache),null);
 plugin.settings.v92Explorer.previews='all';
 assert.equal(exp.writerV92PreviewInfo(plugin,other,cache).text,'Normal chapter');
 assert.match(read('src/v9/native-explorer.js'),/description: \\"\\"/);
 assert.ok(exp.writerV92Excerpt('---\ntitle: Hi\n---\n# Title\nHello **world**',80).includes('Hello world'));
});
test('columns parse widths, gaps, conventional delimiters and responsive layout',()=>{
 const data=mark.writerV92ColumnsParse('columns: 2\ngap: 10\nwidths: 1fr 2fr\n---\n# Left\n--- column ---\n# Right',16);
 assert.equal(data.count,2);
 assert.equal(data.space,10);
 assert.equal(data.chunks.length,2);
 assert.equal(data.chunks[1],'# Right');
 assert.deepEqual(Array.from(data.widths),['1fr','2fr']);
 assert.match(read('src/styles/v9-2-integrations.css'),/@media \(max-width:700px\)/);
});
test('progress manual calculations, calendar kinds and state controls',()=>{
 const p=mark.writerV92ProgressModel('kind: manual\nname: "Progress {percentage}"\nvalue: 3\nmin: 0\nmax: 12\nid: chapter\nbutton: true');
 assert.equal(p.percentage,25);
 assert.equal(p.button,true);
 assert.equal(p.id,'chapter');
 const year=mark.writerV92ProgressModel('kind: day-year',new Date('2026-11-03T10:00:00Z'));
 assert.ok(year.percentage>60&&year.percentage<100);
 const custom=mark.writerV92ProgressModel('kind: day-custom\nmin: 2026-11-01\nmax: 2026-11-11',new Date('2026-11-03T10:00:00Z'));
 assert.equal(custom.percentage,20);
});
test('widgets support counter, quote, clock and countdown with bounded dates',()=>{
 const src=read('src/v9/markdown-interactive.js');
 for(const name of ['clock','quote','countdown','counter'])
  assert.ok(src.includes("kind==='"+name+"'"));
 assert.match(mark.writerV92ClockValue('24hr',true,new Date('2026-11-03T14:02:03Z')),/^\d{2}:\d{2}$/);
 assert.ok(mark.writerV92DateCountdown('2027-01-01 00:00:00') instanceof Date);
 assert.equal(mark.writerV92DateCountdown('not a date'),null);
 assert.match(src,/cfg\.counters\[key\]/);
});
test('safe Meta Bind field token parser and property validation',()=>{
 assert.deepEqual({...mark.writerV92MetaToken('INPUT[toggle:done]')},{type:'toggle',key:'done'});
 assert.deepEqual({...mark.writerV92MetaToken('VIEW[status]')},{type:'view',key:'status'});
 const slider=mark.writerV92MetaToken('INPUT[slider(0,10,2):progress]');
 assert.equal(slider.max,10);assert.equal(slider.step,2);
 assert.equal(mark.writerV92MetaToken('INPUT[js:run]'),null);
 assert.equal(mark.writerV92MetaPathSafe('__proto__'),false);
 assert.equal(mark.writerV92MetaPathSafe('constructor'),false);
 assert.equal(mark.writerV92MetaPathSafe('draft_status'),true);
 assert.match(read('src/v9/markdown-interactive.js'),/fileManager\.processFrontMatter/);
 assert.doesNotMatch(read('src/v9/markdown-interactive.js'),/\beval\(/);
});
test('Zotero reference metadata, quote extraction and Better BibTeX parser',()=>{
 const meta=zot.writerV92ZoteroMeta(file,{frontmatter:{citekey:'ref2026',title:'Source paper',
  author:'Example Writer',year:2026}});
 assert.equal(meta.key,'ref2026');assert.equal(meta.author,'Example Writer');
 const note='---\nquote: "A useful sentence from my research notes."\n---\n\n> A separate passage from this imported note that is helpful.';
 const quotes=zot.writerV92ZoteroExtract(note,meta,5);
 assert.equal(quotes.length,2);
 assert.equal(quotes[0].path,file.path);
 const bib=zot.writerV92ZoteroBibEntries('@article{foo2024,\n title={A Test Paper},\n author={Researcher},\n year={2024}\n}',20);
 assert.equal(bib.length,1);
 assert.equal(bib[0].key,'foo2024');
 assert.match(bib[0].title,/Test Paper/);
});
test('Zotero homepage quote choices combine local imports and manual values',()=>{
 const plugin={settings:{v8Finish:{homeQuotes:''},v92Zotero:{enabled:true,quoteSource:'both'},
  visibleModules:{zotero:true}},writerV92Zotero:{quotes:[{quote:'A note highlight',author:'Scholar',
   path:'Research/paper.md',key:'paper',title:'Paper'}]}};
 const choices=zot.writerV92ZoteroQuotesForHome(plugin);
 assert.equal(choices.length,2);
 assert.equal(choices[1][0],'A note highlight');
 assert.equal(choices[1][2],'Research/paper.md');
 plugin.settings.v92Zotero.quoteSource='zotero';
 assert.equal(zot.writerV92ZoteroQuotesForHome(plugin).length,1);
 assert.match(read('src/v8/writing-home.js'),/Abrir referência/);
});
test('style presets produce reversible, theme-variable scoped CSS only while enabled',()=>{
 const cfg=style.writerV92StyleMerge({v92Style:{enabled:true,textSize:18,headingColors:['#112233'],bodyColor:'#aabbcc'}});
 assert.equal(cfg.headingSizes.length,6);
 assert.equal(cfg.headingColors[0],'#112233');
 assert.equal(cfg.textSize,18);
 const sheet=style.writerV92StyleRules(cfg);
 assert.match(sheet,/--writer-v92-text-size:18px/);
 assert.match(sheet,/--writer-v92-h1-color:#112233/);
 assert.equal(style.writerV92StyleRules({...cfg,enabled:false}),'');
 assert.doesNotMatch(sheet,/!important/);
});
test('session notes live outside the vault until explicitly exported; no automatic vault deletion',()=>{
 assert.equal(style.WRITER_V92_SESSION_VIEW,'writer-session-notes');
 const cfg=style.writerV92SessionMerge({v92Session:{}});
 assert.equal(cfg.autoClearTemp,false);
 const data=style.writerV92SessionClean({notes:[
  {id:'a',title:'Scratch',body:'Draft!',kind:'temporary'},{id:'b',body:'Other',kind:'session'}]});
 assert.equal(data.notes.length,2);
 assert.equal(data.notes[0].kind,'temporary');
 const src=read('src/v9/style-session.js');
 assert.match(src,/sessionStorage\.setItem/);
 assert.match(src,/vault\.create\(/);
 assert.doesNotMatch(src,/vault\.trash\(|vault\.delete\(/);
 assert.match(src,/Excluir esta nota da sessão/);
});
test('bilingual feature docs, credits and separate release notes are complete',()=>{
 const en=read('README.md'),pt=read('docs/README.pt-BR.md');
 assert.match(en,/Version:\*\* 9\.2\.0/);assert.match(pt,/Versão:\*\* 9\.2\.0/);
 for(const feature of ['Favorite','Meta Bind','Progress','Zotero','Session Notes','StyleMate','Folder Note']){
  assert.ok(en.includes(feature),feature);
 }
 for(const feature of ['Favoritos','Progresso','Zotero','Notas de sessão','Folder Note']){
  assert.ok(pt.includes(feature),feature);
 }
 const credit=read('THIRD_PARTY_NOTICES.md');
 for(const repo of ['obsidian-favorite-plugin','multi-column-markdown','obsidian-meta-bind-plugin',
  'obsidian-progressbar','obsidian-widgets','obsidian-zotero-integration','stylemate',
  'session-notes','obsidian-file-preview'])assert.ok(credit.includes(repo),repo);
 assert.ok(read('docs/V9_2_0_RELEASE.pt-BR.md').includes('9.2.0'));
 assert.ok(read('docs/V9_2_0_RELEASE.en.md').includes('9.2.0'));
 assert.doesNotMatch(en,/^## (What's new|Change log)/mi);
 assert.doesNotMatch(pt,/^## (Novidades|Changelog)/mi);
});
