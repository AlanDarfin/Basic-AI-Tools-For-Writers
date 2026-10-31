'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const files=['src/v6/foundation.js','src/v6/reading.js','src/v6/markup.js','src/v6/linter.js'];
const source=files.map(p=>fs.readFileSync(p,'utf8')).join('\n');
const ctx={console,Intl,Date,Math,Number,String,Object,Array,RegExp,writerUi:(pt,en)=>en||pt,writerModuleOn:()=>true,writerV5RefreshEditors:()=>{},require:name=>{
 if(name==='@codemirror/view')return {WidgetType:class{}};throw Error(name);
}};
const v=vm.runInNewContext(source+'\n({writerV6Merge,writerV6ProtectedRanges,writerV6Overlaps,writerV6Allowed,writerV6ReadingCount,writerV6ReadingEstimate,writerV6TimestampTokens,writerV6FormatTimestamp,writerV6RubyTokens,writerV6RatingTokens,writerV6RatingMarker,writerV6RatingText,writerV6LintText,writerV6LintExcluded,WRITER_V6_DEFAULTS,WriterV6Reading,WriterV6Markup,WriterV6Linter})',ctx);
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
test('v6 defaults are isolated, disabled and migrate idempotently',()=>{
 const settings={v6:{linter:{enabled:true,excluded:'private/'},ruby:{enabled:false}},visibleModules:{dictionary:false}};
 v.writerV6Merge(settings);v.writerV6Merge(settings);
 assert.equal(settings.v6.linter.enabled,true);
 assert.equal(settings.v6.linter.excluded,'private/');
 assert.equal(settings.v6.ruby.enabled,false);
 assert.equal(settings.v6.readingTime.enabled,false);
 assert.equal(settings.visibleModules.dictionary,false);
});
test('protect YAML, fenced code, inline code and Markdown links',()=>{
 const src='---\ntitle: Foo\n---\nhello [world](https://abc.test)\n'+
  '~~~js\nhello\n~~~\nInline '+String.fromCharCode(96)+'code'+String.fromCharCode(96)+' and prose';
 const spans=v.writerV6ProtectedRanges(src);
 for(const word of ['title: Foo','hello\n~~~','code','[world]']){
  const i=src.indexOf(word);
  assert.equal(v.writerV6Overlaps(spans,i,i+word.length),true,word);
 }
 const at=src.indexOf('and prose');assert.equal(v.writerV6Overlaps(spans,at,at+8),false);
});
test('timestamp tokens validate all Discord formats and range',()=>{
 const x=v.writerV6TimestampTokens('<t:1710000000:t> <t:1710000000:R> <t:9999999999999:f>');
 assert.equal(x.length,2);
 assert.equal(x[0].format,'t');assert.equal(x[1].format,'R');
 assert.ok(v.writerV6FormatTimestamp(1710000000,'D','en-US','UTC').length>5);
 assert.ok(v.writerV6FormatTimestamp(1710000000,'R','pt-BR','UTC',1710000060000).length>0);
});
test('read-time counts Unicode, excludes YAML and code',()=>{
 const source='---\ntitle: Story\n---\nOlá mundo. 日本語 test. '+String.fromCharCode(96)+'ignored'+String.fromCharCode(96);
 assert.equal(v.writerV6ReadingCount(source,{skipCode:true,skipFrontmatter:true}),4);
 const result=v.writerV6ReadingEstimate('one two three four',{wpm:120});
 assert.equal(result.words,4);assert.equal(result.minutes,1);
});
test('Ruby basic braces do not alter source input',()=>{
 const str='Japanese {漢字|かんじ} text {ruby|annotation}.';
 const tokens=v.writerV6RubyTokens(str);assert.equal(tokens.length,2);
 assert.equal(tokens[0].base,'漢字');assert.equal(tokens[0].ruby,'かんじ');
 assert.equal(str.includes('{漢字|かんじ}'),true);
});
test('ratings: parse symbols, decimals and typed marker',()=>{
 const arr=v.writerV6RatingTokens('A [rating:3.5/5:star] and [rating:2/5:heart] bad [rating:12/5:star]');
 assert.equal(arr.length,2);assert.equal(arr[0].value,3.5);
 assert.equal(v.writerV6RatingMarker(arr[0]),'[rating:3.5/5:star]');
 assert.equal(v.writerV6RatingText(arr[1]).length,5);
});
test('linter proposes safe changes, preserving frontmatter and code',()=>{
 const src='---\ntitle:One\n---\n#Heading  \n~~~js\n#not-heading  \n~~~\nText   ';
 const l=v.writerV6LintText(src,{headingSpace:true,trimTrailing:true,finalNewline:true});
 assert.ok(l.changed);assert.ok(l.output.includes('title:One'));
 assert.ok(l.output.includes('#not-heading  '));
 assert.ok(l.output.includes('# Heading\n'));
 assert.ok(l.output.endsWith('Text\n'));
 assert.ok(!l.output.includes('Text   '));
});
test('ruby parser keeps nested two-level annotations available for rendering',()=>{
 const nested=v.writerV6RubyTokens('{one {漢字|かんじ}|annotation}');
 assert.equal(nested.length,1);
 assert.ok(nested[0].base.includes('{漢字|かんじ}'));
 assert.equal(v.writerV6RubyTokens(nested[0].base).length,1);
});
test('linter conserves CRLF and formats optional footnotes and YAML',()=>{
 const raw='---\r\ntitle:Book\r\n---\r\n[^1]:text\r\n>quoted\r\n';
 const out=v.writerV6LintText(raw,{yamlSpacing:true,footnoteSpace:true,quoteSpace:true});
 assert.ok(out.output.includes('title: Book\r\n'));
 assert.ok(out.output.includes('[^1]: text\r\n'));
 assert.ok(out.output.includes('> quoted\r\n'));
 assert.ok(!/(?<!\r)\n/.test(out.output));
});
test('linter exclusions never process excluded folders',()=>{
 assert.equal(v.writerV6LintExcluded('Private/book.md','Private/'),true);
 assert.equal(v.writerV6LintExcluded('Books/book.md','Private/'),false);
 assert.equal(v.writerV6LintExcluded('Private/file.md','Private/file.md'),true);
});
test('original source and build markers are present in shipped plugin',()=>{
 const main=fs.readFileSync('main.js','utf8');
 for(const file of files)assert.ok(main.includes('// v3 module: '+file));
 for(const cls of ['WriterV6Reading','WriterV6Markup','WriterV6Linter'])assert.ok(main.includes('new '+cls+'(this)'));
 const build=fs.readFileSync('scripts/build-v3.js','utf8');
 assert.ok(build.includes("'v6/foundation'"));assert.ok(build.includes("'v6/linter'"));
 assert.ok(fs.readFileSync('styles.css','utf8').includes('writer-v6-rating-editor'));
});
console.log(count+' v6 integration regression tests passed');
