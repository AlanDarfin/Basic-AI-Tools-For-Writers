'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {auditFromStrings}=require('../scripts/audit-v13-dom-contracts.js');
const root=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v13 adapters protect Obsidian/Surfing DOM and keep Basic class contracts',()=>{
 const r=auditFromStrings({
  foundation:load('src/styles/v13-foundation.css'),
  surfing:load('src/styles/v12-0-5-home-widgets.css'),
  main:load('main.js'),css:load('styles.css')
 });
 assert.deepEqual(r.errors,[]);
 assert.ok(r.metrics.v13Rules>50);
 assert.equal(r.metrics.surfingNativeScopedRules,2);
 assert.ok(r.metrics.classListAdd>10);
 assert.ok(r.metrics.templateInterpolations>0);
 assert.ok(r.metrics.cssClassLiteralsMissingInJs>0,
  'missing literal matches are preserved, never automatically pruned');
});
test('static guard rejects unscoped third-party controls',()=>{
 const source={foundation:'.wb-search-bar{display:none}',surfing:'.wb-search-bar{display:none}',
  main:'',css:'.wb-search-bar{display:none}'};
 const r=auditFromStrings(source);
 assert.ok(r.errors.some(x=>x.includes('third-party/Obsidian')));
 assert.ok(r.errors.some(x=>x.includes('outside Basic host')));
});
test('confirmed unused declarations were removed while DOM creation survives',()=>{
 const main=load('main.js');
 assert.doesNotMatch(main,/\bWRITER_V9_EXPLORER_COLORS\b/);
 assert.doesNotMatch(main,/\bWRITER_V92_FAVORITE_ICONS\b/);
 assert.doesNotMatch(main,/\bconst allDay=board\.createDiv/);
 assert.doesNotMatch(main,/\.onChange\(\(\)\s*=>\s*\{\s*\}\)/);
 assert.match(main,/board\.createDiv\(\{cls:'writer-v9-calendar-all-day-label'/);
});
