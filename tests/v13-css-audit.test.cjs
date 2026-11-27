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

test('CSS phase 4: ordered manifest validates paths and ownership without regrouping cascade',()=>{
 const {entries,sections,categories,validateEntries}=require('../scripts/css-manifest.js');
 assert.deepEqual(sections,entries.map(e=>e.path));
 assert.equal(new Set(sections).size,sections.length);
 assert.ok(categories.every(c=>entries.some(e=>e.category===c)));
 assert.ok(sections.indexOf('v9-5-timeline.css')<sections.indexOf('v12-0-5-timeline-dragger.css'));
 assert.ok(sections.indexOf('v12-0-5-home-widgets.css')<sections.indexOf('v13-foundation.css'));
 assert.throws(()=>validateEntries([entries[0],entries[0]]),/Duplicate CSS module/);
 assert.throws(()=>validateEntries([{path:'../styles.css',category:'core'}]),/Invalid CSS module path/);
 assert.throws(()=>validateEntries([{path:'test.css',category:'unknown'}]),/Invalid CSS category/);
 for(const file of sections)assert.ok(fs.existsSync('src/styles/'+file),file);
});

test('CSS phase 4: migrated legacy modules keep a single authoritative source',()=>{
 const {entries,sections}=require('../scripts/css-manifest.js');
 const relocated=[
  ['legacy-dictionary-settings.css','compat'],
  ['legacy-templates.css','compat'],
  ['legacy-writing-tools.css','editor']
 ];
 for(const [name,category] of relocated){
  const path=category+'/'+name;
  assert.ok(entries.some(e=>e.path===path&&e.category===category));
  assert.ok(fs.existsSync('src/styles/'+path));
  assert.ok(!fs.existsSync('src/styles/'+name),'Old duplicate source must be removed: '+name);
  assert.equal(sections.filter(s=>s.split('/').pop()===name).length,1);
 }
 assert.deepEqual(sections.slice(-3),relocated.map(([name,category])=>category+'/'+name));
});

test('CSS phase 4: categorized modules match their ownership and stable source names',()=>{
 const {entries,sections,validateEntries}=require('../scripts/css-manifest.js');
 const migrated=["core/v9-design-system.css","core/v10-consistency.css","core/panel-density.css","compat/v13-8-grammar-compat.css","editor/v13-7-typewriter.css","editor/v13-prose-rhythm.css","native/v13-9-native-focus.css","native/v13-9-native-tasks.css","mobile/v13-9-mobile-ui.css","mobile/v11-1-2-mobile-panels.css","mobile/v12-0-1-mobile.css","mobile/v8-review-mobile.css","native/v8-navigation.css"];
 for(const file of migrated){
  const name=file.split('/').pop();
  assert.ok(sections.includes(file),file);
  assert.ok(fs.existsSync('src/styles/'+file),file);
  assert.ok(!fs.existsSync('src/styles/'+name),name);
 }
 assert.equal(new Set(entries.map(e=>e.path.split('/').pop())).size,entries.length);
 assert.throws(()=>validateEntries([{path:'core/test.css',category:'core'},{path:'editor/test.css',category:'editor'}]),/Duplicate CSS module name/);
 assert.throws(()=>validateEntries([{path:'native/test.css',category:'core'}]),/CSS path does not match category/);
});

test('CSS phase 4: every registered stylesheet has exactly one authoritative file',()=>{
 const {entries,sections}=require('../scripts/css-manifest.js');
 const path=require('node:path');
 const root='src/styles';
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.css')?[path.relative(root,path.join(dir,e.name)).split(path.sep).join('/')]:[]);}
 assert.deepEqual(walk(root).sort(),[...sections].sort());
 for(const e of entries){
  if(e.path.includes('/'))assert.equal(e.path.split('/')[0],e.category);
 }
 const categorized=["features/v10-1-extensions.css","features/v11-1-integration.css","features/v11-longform-studio.css","features/v13-6-settings.css","features/v13-7-settings.css","features/v13-8-companions.css","features/v13-editorial-queue.css","features/v13-recovery.css","features/v13-story-planning.css","blocks/v13-visual-kit.css","features/v8-calendar-studies.css","features/v8-finish-suite.css","blocks/v8-folder-inscribe.css","blocks/v8-format-blocks.css","blocks/v8-interactive-media.css","features/v8-polish.css","blocks/v9-1-2-virtual-content.css","features/v9-1-unified.css","features/v9-2-3-home-title-favorites.css","features/v9-2-4-dashboard.css","features/v9-2-6-dashboard.css","features/v9-2-suite.css"];
 for(const file of categorized)assert.ok(sections.includes(file),file);
});
