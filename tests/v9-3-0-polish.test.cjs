'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
test('Folder Notes use only description YAML, not the opening prose',()=>{
 const source=read('src/v9/explorer-favorites-preview.js');
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 class TFolder{constructor(path){this.path=path;this.name='Writing';}}
 const target=new TFile('Writing/Writing.md'),folder=new TFolder('Writing');
 const plugin={settings:{v92Explorer:{previewMode:'all',previewMax:135,folderDescriptionKey:'description'}},
  app:{vault:{getAbstractFileByPath:path=>path===target.path?target:null},
   metadataCache:{getFileCache:()=>({frontmatter:{}})}}};
 const api=vm.runInNewContext(source+
  '\n({writerV9216FolderDescription,writerV921PreviewBody})',
  {TFile,TFolder,require:()=>({parseYaml:body=>body.includes('description:')?
   {description:'Folder-only description'}:{tags:['novel']}})});
 assert.equal(api.writerV9216FolderDescription(plugin,folder,'---\ndescription: Folder-only description\n---\nProse'), 'Folder-only description');
 assert.equal(api.writerV9216FolderDescription(plugin,folder,'---\ntags: [novel]\n---\nProse that must not appear'),'');
 assert.equal(api.writerV921PreviewBody('---\ndescription: Ignored\n---\n# Header\nActual note opening.',135),'Actual note opening.');
 assert.match(source,/writer-v93-folder-description/);
 assert.match(source,/previewTouchExpand/);
 assert.match(source,/touchstart/);
 assert.match(source,/touchmove/);
 assert.match(source,/hoverExpand/);
 assert.match(source,/folderDescriptions/);
 assert.match(source,/noteExcerpts/);
});
test('Title icons do not affect editable title baseline and toolbar icons are sized for touch',()=>{
 const source=read('src/v9/native-explorer.js'),css=read('src/styles/v9-2-2-iconic-fixes.css');
 assert.match(source,/writer-v93-title-icon-host/);
 assert.match(source,/title\.classList\.toggle/);
 assert.match(css,/\.inline-title\.writer-v93-title-icon-host/);
 const titleRule=css.slice(css.indexOf('/* 9.3.2 — Place note icons'));
 assert.match(titleRule,/position:static/);
 assert.match(titleRule,/padding-inline-start:0/);
 assert.match(titleRule,/vertical-align:-\.13em/);
 assert.doesNotMatch(titleRule,/position:absolute/);
 assert.match(css,/width:27px/);
 assert.match(css,/writer-v93-folder-description:not\(\.is-expanded\)/);
 assert.match(read('src/v9/spaces-dock.js'),/writer-v93-space-manage-action/);
});
test('Custom Sorting-compatible YAML subset is opt-in and per folder',()=>{
 const flex=read('src/v9/explorer-flex.js');
 const scope=vm.runInNewContext(flex+
  '\n({writerV93FlexParseSortSpec,writerV93FlexRecord,writerV91FlexMerge})',{});
 const rules=scope.writerV93FlexParseSortSpec('folders-first\norder-desc: a-z');
 assert.equal(rules.sort,'name-desc');assert.equal(rules.foldersFirst,true);
 assert.equal(scope.writerV93FlexParseSortSpec('order-asc: \\d+').sort,'number');
 assert.equal(scope.writerV93FlexParseSortSpec('by-metadata: priority').property,'priority');
 assert.deepEqual(Array.from(scope.writerV93FlexParseSortSpec('order-asc: Chapter *\norder-asc: Notes.md').order),['Chapter *','Notes.md']);
 assert.equal(scope.writerV93FlexParseSortSpec('unrelated: ignore'),null);
 const note={path:'Writing/Writing.md',extension:'md'};
 const plugin={settings:{v91Flex:{enabled:true,yamlSorting:true,sortSpecCompat:true}},
  app:{vault:{getAbstractFileByPath:()=>({path:'Writing'})},
   metadataCache:{getFileCache:()=>({frontmatter:{'sorting-spec':'order-asc: a-z'}})}}};
 scope.writerV91FlexMerge(plugin.settings);
 assert.equal(scope.writerV93FlexRecord(plugin,'Writing').sort,'native','without a Folder Note resolver no rule should be guessed');
 assert.match(flex,/sortSpecCompat/);
 assert.match(flex,/foldersFirst/);
});
test('Flow and per-Space settings retain distinct controls for pre-v10 modularity',()=>{
 const spaces=read('src/v9/smart-spaces.js'),flow=read('src/v9/flow-slash.js');
 const pretty=read('src/v9/pretty-properties.js');
 assert.match(spaces,/manageIcon/);assert.match(spaces,/pinnedPaths/);
 assert.match(spaces,/homeWidgetsEnabled/);assert.match(spaces,/foldersFirst/);
 assert.match(flow,/flowArrange/);assert.match(flow,/flowPreviews/);
 assert.match(flow,/flowBlocks/);
 assert.match(pretty,/toggle\('enabled'/);
});
