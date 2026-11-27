'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {collectRules,declarations,analyze,makeMarkdown}=require('../scripts/css-v13-audit.js');
test('CSS rule inventory preserves @media scope and quoted CSS values',()=>{
 const css="a{content:'hello;world';color:red}@media(max-width:650px){a{color:blue}}a{color:red}";
 const rules=collectRules(css);
 assert.equal(rules.length,3);
 assert.equal(declarations(rules[0].body).length,2);
 const result=analyze(css);
 assert.equal(result.metrics.repeatedSelectors,1);
 assert.equal(result.metrics.sameContext,1);
 assert.equal(result.metrics.acrossContexts,1);
});
test('intentional cascade overrides remain classified separately',()=>{
 const result=analyze('.a{color:red}.a{color:blue}.a{color:blue}');
 assert.equal(result.metrics.repeatedSelectors,1);
 assert.equal(result.metrics.identicalDeclarationOccurrences,1);
 assert.equal(result.metrics.differingDeclarationOccurrences,1);
});
test('CSS report lists each duplicated selector, without deleting rules',()=>{
 const css=fs.readFileSync('styles.css','utf8'),result=analyze(css);
 assert.ok(result.metrics.rules>2000);
 assert.equal(result.rows.length,result.metrics.repeatedSelectors);
 assert.match(makeMarkdown(result),/Inventário completo/);
 assert.ok(result.metrics.sameContext>0);
});

test('CSS foundation: only active features own native editor geometry',()=>{
 const css=fs.readFileSync('styles.css','utf8'),rules=collectRules(css);
 const width=rules.find(r=>r.selector==='.writer-v92-style .markdown-preview-view, .writer-v92-style .markdown-source-view');
 assert.ok(width);
 assert.match(width.body,/--file-line-width:var\(--basic-editor-width,var\(--writer-v92-width\)\)/);
 assert.ok(rules.some(r=>r.selector.includes('.writer-v7-focus-mode :is(.cm-sizer,.markdown-preview-sizer):not(:where(')&&r.selector.includes('.writer-v1010-editor-width *')&&r.selector.includes('.writer-v92-style *')));
 assert.ok(!rules.some(r=>r.selector==='body.writer-v4-typewriter .cm-editor .cm-line'));
 assert.ok(!rules.some(r=>r.selector==='.metadata-property'));
 assert.ok(!rules.some(r=>r.selector==='body.writer-v4-typewriter .cm-editor .cm-scroller'&&r.body.includes('40vh')));
});
test('CSS foundation: StyleMate prose and desktop status are scoped',()=>{
 const css=fs.readFileSync('styles.css','utf8'),rules=collectRules(css);
 const prose=rules.filter(r=>r.selector.startsWith('.writer-v92-style .markdown-preview-view'));
 assert.ok(prose.some(r=>r.selector.includes('.markdown-preview-sizer > :is(.el-p,.el-ul,.el-ol,.el-blockquote')));
 assert.ok(!prose.some(r=>/^\.writer-v92-style \.markdown-preview-view (p|a|blockquote|:is\(ul,ol\))$/.test(r.selector)));
 const dock=rules.filter(r=>r.selector==='body:not(.is-mobile) .status-bar.writer-v132-status-host'&&!r.context);
 assert.equal(dock.length,1);
 assert.match(dock[0].body,/transform:none/);
 assert.match(dock[0].body,/bottom:0/);
});

test('CSS foundation: mobile notes and explorer controls require Basic-owned markers',()=>{
 const css=fs.readFileSync('styles.css','utf8'),rules=collectRules(css);
 const mobile=rules.find(r=>r.selector==='body.is-mobile :is(.markdown-preview-view,.cm-scroller).writer-mobile-note-scroll-clearance');
 assert.ok(mobile);
 assert.match(mobile.body,/padding-bottom:max\(var\(--writer-mobile-note-base-padding,0px\),var\(--writer-mobile-note-clearance,0px\)\)/);
 assert.ok(rules.some(r=>r.selector.includes(':is(.writer-v921-preview-toggle,.writer-v93-space-manage-action)')));
 assert.ok(!rules.some(r=>r.selector==='.workspace-leaf-content[data-type="file-explorer"] .nav-action-button'));
 assert.ok(!rules.some(r=>r.selector.includes('.nav-action-buttons .nav-action-button')&&!r.selector.includes('writer-')));
});

test('CSS phase 3: component layout stays scoped and responsive',()=>{
 const css=fs.readFileSync('styles.css','utf8'),rules=collectRules(css);
 assert.ok(rules.some(r=>r.selector.includes('.writer-project-scene.writer-project-scene-actions')&&r.context.includes('basic-project')&&r.body.includes('grid-template-columns:28px minmax(0,1fr) max-content')));
 assert.ok(rules.some(r=>r.selector==='.writer-v8-home'&&r.body.includes('--writer-home-grid-columns:12')));
 assert.ok(rules.some(r=>r.selector==='body.is-mobile .writer-v8-home .writer-v8-home-grid.writer-v925-grid'&&r.body.includes('repeat(var(--writer-home-grid-columns,12),minmax(0,1fr))')));
 assert.ok(!rules.some(r=>r.selector==='.writer-v8-home .writer-v925-grid>[data-section] :is(h3,h4,p,button,small,strong,span)'));
 assert.ok(rules.some(r=>r.selector==='.writer-v9216-space-chip > span'&&r.body.includes('min-width:0')));
 assert.ok(rules.some(r=>r.selector==='.dictionary-view-content.writer-tool-root .writer-lt-result-actions'&&r.body.includes('repeat(auto-fit,minmax(min(100%,120px),1fr))')));
});
