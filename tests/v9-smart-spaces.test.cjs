'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('src/v9/smart-spaces.js','utf8');
const api=vm.runInNewContext(source+'\n({merge:writerV9SpacesMerge,sanitize:writerV9SpaceSanitize,tags:writerV9SpaceTags,items:writerV9SpaceItems})',
 {Modal:class{},Setting:class{},TFile:class{},TFolder:class{},ItemView:class{},writerUi:pt=>pt});
test('Spaces are disabled by default and preserve safe custom collections',()=>{
 const config={};api.merge(config);
 assert.equal(config.v9Spaces.enabled,false);
 assert.equal(config.v9Spaces.spaces.length,0);
 const draft={v9Spaces:{enabled:true,spaces:[{id:'story',name:'Story',folder:'Book',view:'board'}, {id:'story',name:'Duplicate'}]}};
 api.merge(draft);
 assert.equal(draft.v9Spaces.spaces.length,1);
 assert.equal(draft.v9Spaces.spaces[0].view,'board');
});
test('space configuration bounds properties, view and filenames',()=>{
 const space=api.sanitize({name:'Book',view:'not-valid',sort:'nope',groupBy:'sta tus!$',
  property:'status[foo]',folder:'/Book/notes/'});
 assert.equal(space.name,'Book');
 assert.equal(space.view,'cards');
 assert.equal(space.sort,'recent');
 assert.equal(space.groupBy,'status');
 assert.equal(space.property,'statusfoo');
 assert.equal(space.folder,'Book/notes');
 assert.equal(api.sanitize({name:''}),null);
});
test('tag matching supports frontmatter and inline tag cache',()=>{
 const tags=api.tags(null,{frontmatter:{tags:['#writing','novel/world']},tags:[{tag:'#flashcards'}]});
 assert.ok(tags.includes('writing'));
 assert.ok(tags.includes('novel/world'));
 assert.ok(tags.includes('flashcards'));
});
test('Spaces filter by folder/tag/properties without modifying notes',()=>{
 const files=[{path:'Book/First.md',basename:'First',stat:{mtime:8}},
  {path:'Book/Second.md',basename:'Second',stat:{mtime:20}},
  {path:'Other/Third.md',basename:'Third',stat:{mtime:10}}];
 const notes={'Book/First.md':{frontmatter:{tags:['story'],status:'draft'}},
  'Book/Second.md':{frontmatter:{tags:['story'],status:'ready'}},
  'Other/Third.md':{frontmatter:{tags:['story'],status:'draft'}}};
 const plugin={app:{vault:{getMarkdownFiles:()=>files},metadataCache:{getFileCache:f=>notes[f.path]}}};
 const space=api.sanitize({name:'Drafts',folder:'Book',tag:'story',property:'status',value:'draft',sort:'recent'});
 assert.equal(api.items(plugin,space).length,1);
 assert.equal(api.items(plugin,space)[0].path,'Book/First.md');
 assert.equal(files.length,3);
});
test('Spaces provide optional sidebar while leaving the native explorer untouched',()=>{
 const main=fs.readFileSync('main.js','utf8');
 assert.match(source,/writerV9SpaceModal/);
 assert.match(source,/registerView\(/);
 assert.match(source,/WriterV9SpacesSideView/);
 assert.doesNotMatch(source,/detachLeavesOfType\(|registerEditorExtension\(/);
 assert.match(main,/writerV9RegisterSpaces\(this\)/);
 assert.match(main,/writerV9SpacesSettings\(this.plugin,panel\)/);
 assert.match(fs.readFileSync('styles.css','utf8'),/writer-v9-spaces-results/);
});
