'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {scanCss,analyze,auditWorkingTree}=require('../scripts/audit-v13-css.js');
test('scan respects @media boundaries and semicolons inside strings',()=>{
 const rules=scanCss("a{content:'hello;world';color:red}@media(max-width:650px){a{color:blue}}a{color:red}");
 assert.equal(rules.length,3);assert.equal(rules[0].decls.length,2);
 const summary=analyze(rules);assert.equal(summary.identicalDeclarations,1);
 assert.equal(summary.changedValues,0);
});
test('different overrides are not misclassified as identical',()=>{
 const r=analyze(scanCss('.a{color:red}.a{color:blue}.a{color:blue}'));
 assert.equal(r.repeatedSelectorKeys,1);assert.equal(r.extraSelectorOccurrences,2);
 assert.equal(r.overlappingProperties,2);assert.equal(r.changedValues,1);assert.equal(r.identicalDeclarations,1);
});
test('entire legacy CSS and modular tree is inventoried',()=>{
 const r=auditWorkingTree();
 assert.ok(r.files>=33);assert.ok(r.ruleCount>2000);assert.ok(r.repeatedSelectorKeys>100);
 assert.equal(r.duplicates.length,r.repeatedSelectorKeys);
});
