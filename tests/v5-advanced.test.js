'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const paths=['src/v5/easy-typing.js','src/v5/easy-advanced.js','src/v5/smart-typography.js','src/v5/pandoc-export.js'];
const source=paths.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const ctx={writerUi:(pt)=>pt,writerModuleOn:()=>true,console,require:()=>({})};
const v=vm.runInNewContext(source+'\n({writerEasyMerge,writerEasyAdvancedMerge,writerEasyTypingAtInput,writerEasyRegexSafe,writerEasyRegexAtInput,writerEasySnippetExpand,writerPandocExportMerge,writerPandocExportFolder,writerPandocExportFilename,writerPandocExportArgs})',ctx);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
test('advanced typing settings are safe to merge repeatedly',()=>{
 const settings={easyTyping:{regexEnabled:true,regexRules:[{pattern:'abc',replace:'xyz'}],snippets:[{name:'Brief',body:'\${1:foo}'}]},visibleModules:{keyshots:false}};
 v.writerEasyMerge(settings);v.writerEasyAdvancedMerge(settings);v.writerEasyAdvancedMerge(settings);
 assert.equal(settings.easyTyping.regexRules.length,1);
 assert.equal(settings.easyTyping.snippets.length,1);
 assert.equal(settings.visibleModules.keyshots,false);
});
test('opt-in regex rules replace only line-ending patterns',()=>{
 const cfg=v.writerEasyAdvancedMerge({easyTyping:{enabled:true,regexEnabled:true,regexRules:[
  {pattern:'(teh)',replace:'the',enabled:true},
  {pattern:'color([0-9]+)',replace:'colour$1',enabled:true}
 ]}});
 assert.equal(v.writerEasyRegexAtInput('teh',cfg)?.text,'the');
 assert.equal(v.writerEasyRegexAtInput('color42',cfg)?.text,'colour42');
 assert.equal(v.writerEasyTypingAtInput('teh','h',cfg)?.text,'the');
 assert.equal(v.writerEasyRegexAtInput('something else',cfg),null);
 assert.equal(v.writerEasyRegexAtInput('teh',{...cfg,regexEnabled:false}),null);
});
test('avoid dangerous or malformed regex patterns',()=>{
 for(const pattern of ['(a+)+','(a*)*','(xy{2})+','\\1','(?<=x)y'])assert.equal(v.writerEasyRegexSafe(pattern),false,pattern);
 assert.equal(v.writerEasyRegexSafe('[a-z]{1,5}'),true);
 assert.equal(v.writerEasyRegexAtInput('hello',{enabled:true,regexEnabled:true,regexRules:[{pattern:'[',replace:'a',enabled:true}]}),null);
});
test('snippet placeholders sort by index, preserve text and end cursor',()=>{
 const out=v.writerEasySnippetExpand('A \${2:two}, \${1:one}!\${0}');
 assert.equal(out.text,'A two, one!');
 assert.equal(out.stops.length,3);
 assert.deepEqual(Array.from(out.stops,x=>x.index),[1,2,0]);
 assert.equal(out.text.slice(out.stops[0].from,out.stops[0].to),'one');
 const cfg=v.writerEasyAdvancedMerge({easyTyping:{enabled:true}});
 assert.ok(cfg.snippets.length>=2);
 assert.ok(v.writerEasySnippetExpand(cfg.snippets[0].body).stops.length);
});
test('Pandoc configuration and export paths reject traversal',()=>{
 const settings={pandocExport:{enabled:true,folder:'../../outside',format:'wrong'},visibleModules:{pandocSyntax:false}};
 const cfg=v.writerPandocExportMerge(settings);
 assert.equal(cfg.folder,'Exports/Pandoc');
 assert.equal(cfg.format,'docx');
 assert.equal(cfg.enabled,true);
 assert.equal(settings.visibleModules.pandocSyntax,false);
 assert.equal(v.writerPandocExportFolder('Exports/Writer'),'Exports/Writer');
 assert.equal(v.writerPandocExportFilename('My: Story/Part','docx'),'My- Story-Part.docx');
 assert.throws(()=>v.writerPandocExportFilename('x','unknown'));
});
test('Pandoc args use a fixed format and never a shell string',()=>{
 const args=v.writerPandocExportArgs('epub','/tmp/output.epub','/tmp/vault');
 assert.ok(args.includes('epub'));
 assert.equal(args[args.indexOf('--output')+1],'/tmp/output.epub');
 assert.ok(args.includes('markdown+fenced_divs+fancy_lists+definition_lists+example_lists+bracketed_spans+native_divs+tex_math_dollars'));
 assert.throws(()=>v.writerPandocExportArgs('bad; rm -rf /','out',''));
});
test('bundle, docs and code prohibit unsafe runtime rule execution',()=>{
 const main=fs.readFileSync('main.js','utf8');
 for(const p of ['src/v5/easy-advanced.js','src/v5/pandoc-export.js'])assert.ok(main.includes('// v3 module: '+p));
 for(const token of ['writerEasyAdvancedMerge(this.settings)','writerPandocExportMerge(this.settings)','this.writerEasyAdvanced.register()','this.writerPandocExporter.register()'])assert.ok(main.includes(token));
 assert.ok(!source.includes('eval('));
 assert.ok(!source.includes('shell:true'));
});
console.log(passed+' advanced v5 tests passed');
