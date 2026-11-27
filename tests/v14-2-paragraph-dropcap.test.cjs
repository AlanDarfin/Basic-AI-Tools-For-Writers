'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const align=read('src/v10/inline-alignment.js');
const ext=read('src/v5/extended-syntax.js');
const exportCode=read('src/compat/pandoc-format-compat.js');
const api=vm.runInNewContext(ext+'\n'+align+'\n'+exportCode+
 '\n({writerV102AlignToken,writerV102AlignApply,writerV102ToggleDropcap,writerV102AlignReading,writerPandocExportPrepare,writerPandocExportEmbedCSS})',
 {writerUi:(pt,en)=>en,console});
test('capitular and alignment compose in both orders',()=>{
 for(const [line,side,drop] of [
  ['Abertura {j} {dropcap}','justify',true],
  ['Abertura {capitular} {r}','right',true],
  ['Abertura {dropcap} {c}','center',true],
  ['# Capítulo {l}','left',false],
  ['Abertura {dropcap}',null,true]
 ]){
  const result=api.writerV102AlignToken(line);
  assert.equal(result?.side,side,line);assert.equal(!!result?.dropcap,drop,line);
 }
 for(const bad of ['Título {unknown}','Eis {dropcap} algo','# Title {dropcap}'])
  assert.equal(api.writerV102AlignToken(bad),null,bad);
});
test('toolbar alignment keeps a previously chosen drop cap',()=>{
 const lines=['Once {j} {dropcap}','Once {capitular} {r}'];
 let n=0;
 const ed={getCursor:()=>({line:n,ch:0}),getLine:k=>lines[k],replaceRange:(s,pos)=>{lines[pos.line]=s;}};
 api.writerV102AlignApply(ed,'l');assert.equal(lines[0],'Once {l} {dropcap}');
 api.writerV102ToggleDropcap(ed);assert.equal(lines[0],'Once {l}');
 api.writerV102ToggleDropcap(ed);assert.equal(lines[0],'Once {l} {dropcap}');
 n=1;api.writerV102AlignApply(ed,'j');assert.equal(lines[1],'Once {j} {capitular}');
});
test('Reading View removes the syntax and decorates the paragraph',()=>{
 const classes=[],styles=[],node={nodeValue:'A floresta {j} {dropcap}',parentElement:{closest:()=>null}};
 const p={tagName:'P',textContent:node.nodeValue,closest:()=>false,
  classList:{add:(...values)=>classes.push(...values)},style:{setProperty:(...values)=>styles.push(values)}};
 const document={createTreeWalker:()=>({currentNode:null,i:0,nextNode(){if(this.i++)return false;this.currentNode=node;return true;}})};
 const fn=vm.runInNewContext(align+'\nwriterV102AlignReading',
  {document,NodeFilter:{SHOW_TEXT:4},writerUi:(pt,en)=>en,console});
 fn({querySelectorAll:()=>[p]});
 assert.equal(node.nodeValue,'A floresta');
 assert.ok(classes.includes('writer-v102-dropcap'));
 assert.ok(classes.includes('writer-v102-align-justify'));
 assert.equal(styles[0][1],'justify');
});
test('Pandoc preserves Basic styles with semantic divs, spans and HTML CSS',()=>{
 const convert=api.writerPandocExportPrepare;
 assert.equal(convert('Era uma vez {j} {dropcap}'),
  '::: {.basic-export-paragraph .basic-export-justify .basic-export-dropcap}\nEra uma vez\n:::');
 assert.equal(convert('Era uma vez {capitular} {r}'),
  '::: {.basic-export-paragraph .basic-export-right .basic-export-dropcap}\nEra uma vez\n:::');
 assert.equal(convert('# Título {c}'),'# Título {style="text-align:center"}');
 assert.equal(convert('::c: Um trecho'), '::: {.basic-export-paragraph .basic-export-center}\nUm trecho\n:::');
 assert.equal(convert('::l[Um trecho]'), '::: {.basic-export-paragraph .basic-export-left}\nUm trecho\n:::');
 assert.equal(convert('::c: # Título antigo'), '# Título antigo {style="text-align:center"}');
 const rich=convert('++under++ ||spoiler|| =={red}mark== !!{color-ff0022}color!! ^2^ ~2~');
 for(const fragment of ['[under]{.basic-export-underline}','[spoiler]{.basic-export-spoiler}',
  '[mark]{.basic-export-highlight .basic-export-color-red}',
  '[color]{style="color:#ff0022"}','^2^ ~2~'])assert.ok(rich.includes(fragment),fragment);
 const html=api.writerPandocExportEmbedCSS('<html><head></head><body></body></html>');
 assert.ok(html.includes('<style id="basic-export-typography">'));
 assert.ok(html.includes('.basic-export-paragraph.basic-export-dropcap>p::first-letter'));
});
test('export does not rewrite YAML, code, lists or arbitrary braces',()=>{
 const ticks=String.fromCharCode(96),fence=ticks.repeat(3);
 const raw=['---','title: Book','---','',fence+'md','Text {dropcap}','++code++',fence,'',
  'Code '+ticks+'++inline++'+ticks+' and ++real++','','- Item {j}','','Normal {unknown}'].join('\n');
 const output=api.writerPandocExportPrepare(raw);
 for(const fragment of [fence+'md\nText {dropcap}\n++code++\n'+fence,
  ticks+'++inline++'+ticks,'- Item {j}','Normal {unknown}','title: Book'])
  assert.ok(output.includes(fragment),fragment);
 assert.ok(output.includes('[real]{.basic-export-underline}'));
});
test('main.js and styles.css contain export pipeline and drop cap CSS',()=>{
 const main=read('main.js'),css=read('styles.css');
 for(const fn of ['writerV102ParagraphSuffix','writerV102ToggleDropcap','writerPandocExportPrepare','writerPandocExportEmbedCSS'])
  assert.ok(main.includes('function '+fn+'('),fn);
 assert.match(css,/\.markdown-preview-view p\.writer-v102-dropcap::first-letter/);
 const exporter=read('src/v5/pandoc-export.js');
 assert.match(exporter,/writerPandocExportPrepare\(view\.editor\.getValue\(\)\)/);
 assert.match(exporter,/if\(format==='epub'\)/);
 assert.match(exporter,/if\(format==='html'\)bytes=Buffer\.from\(writerPandocExportEmbedCSS/);
});
