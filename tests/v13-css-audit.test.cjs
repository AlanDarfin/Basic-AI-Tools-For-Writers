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
