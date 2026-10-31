'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class TFile{constructor(path,extension){this.path=path;this.extension=extension;this.basename=path.split('/').pop().replace(/\.[^.]+$/,'');}}
const collected=[];
class MockElement{
 constructor(){this.children=[];this.text='';}
 createDiv(){const c=new MockElement();this.children.push(c);return c;}
 createEl(tag,attributes={}){const e=new MockElement();e.tag=tag;e.text=attributes.text||'';e.attributes=attributes.attr||{};this.children.push(e);return e;}
 setText(text){this.text=text;}
}
class Setting{
 constructor(parent){this.parent=parent;this.index=collected.length;collected.push(this);}
 setName(value){this.name=value;return this;}
 setDesc(value){this.description=value;return this;}
 addDropdown(fn){const d={options:[],selected:'',addOption(id,name){this.options.push({id,name});return this;},setValue(value){this.selected=value;return this;},onChange(fn){this.change=fn;return this;}};this.dropdown=d;fn(d);return this;}
 addTextArea(fn){const t={inputEl:{rows:0,maxLength:0},setPlaceholder(){return this;},setValue(value){this.value=value;return this;},onChange(fn){this.change=fn;return this;}};this.textarea=t;fn(t);return this;}
 addButton(fn){const b={setButtonText(){return this;},onClick(fn){this.click=fn;return this;}};this.button=b;fn(b);return this;}
}
const ctx={TFile,Setting,lfMsg:(pt)=>pt,Notice:class{},console};
const source=fs.readFileSync('src/v5/project-metadata.js','utf8');
const projectApi=vm.runInNewContext(source+'\n({writerProjectCoverFiles,writerProjectValidCover,writerProjectNormalizeDescription,writerProjectLicenseInfo,writerProjectRemember,writerProjectRenamedPath,writerProjectMetaRender,WRITER_PROJECT_LICENSES})',ctx);
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS',name);}
(async()=>{
 await test('project selection is saved and restored without switching unexpectedly',async()=>{
  let writes=0;
  const view={plugin:{settings:{lastLongformProject:''},saveSettings:async()=>{writes++;}},selected:null};
  projectApi.writerProjectRemember(view,'Stories/Book/Index.md');
  assert.equal(view.selected,'Stories/Book/Index.md');
  assert.equal(view.plugin.settings.lastLongformProject,'Stories/Book/Index.md');
  assert.equal(writes,1);
  projectApi.writerProjectRemember(view,'Stories/Book/Index.md');
  assert.equal(writes,1);
  const restored={selected:view.plugin.settings.lastLongformProject};
  assert.equal(restored.selected,'Stories/Book/Index.md');
 });
 await test('renaming an index or containing folder keeps the selected path',()=>{
  assert.equal(projectApi.writerProjectRenamedPath('Books/One/Index.md','Books/One','Books/Two'),'Books/Two/Index.md');
  assert.equal(projectApi.writerProjectRenamedPath('Books/One/Index.md','Books/One/Index.md','Books/One/New.md'),'Books/One/New.md');
  assert.equal(projectApi.writerProjectRenamedPath('Books/Other.md','Books/One','Books/Two'),'Books/Other.md');
  assert.equal(projectApi.writerProjectRenamedPath(null,'a','b'),null);
 });
 await test('cover picker only accepts existing vault image files',()=>{
  const images=[new TFile('Covers/story.webp','webp'),new TFile('Covers/book.png','png'),new TFile('Notes/idea.md','md')];
  const app={vault:{getFiles:()=>images,getAbstractFileByPath:p=>images.find(x=>x.path===p)}};
  assert.deepEqual(Array.from(projectApi.writerProjectCoverFiles(app),x=>x.path),['Covers/book.png','Covers/story.webp']);
  assert.equal(projectApi.writerProjectValidCover(app,'Notes/idea.md'),null);
  assert.equal(projectApi.writerProjectValidCover(app,'Covers/story.webp')?.extension,'webp');
  assert.equal(projectApi.writerProjectValidCover(app,'../invalid.png'),null);
 });
 await test('copyright options explain common permissions in two languages',()=>{
  assert.ok(projectApi.WRITER_PROJECT_LICENSES.length>=8);
  for(const entry of projectApi.WRITER_PROJECT_LICENSES){
   assert.equal(entry.length,5);
   assert.ok(entry.every(x=>typeof x==='string'&&x.length>=3));
  }
  assert.equal(projectApi.writerProjectLicenseInfo('cc-by-4.0')[0],'cc-by-4.0');
  assert.equal(projectApi.writerProjectLicenseInfo('unknown')[0],'unspecified');
 });
 await test('description is limited and is stored in Longform frontmatter, not data.json',async()=>{
  const images=[new TFile('Covers/novel.png','png')],metadata={cover:'',description:'',copyright:'unspecified'};
  const app={vault:{getFiles:()=>images,getAbstractFileByPath:p=>images.find(f=>f.path===p),getResourcePath:f=>'app://vault/'+f.path}};
  const written=[];
  const view={app,updateIndex:async(_,action)=>{const data={};action(data);written.push(data);}};
  const project={title:'Novel',meta:metadata,file:new TFile('Novel/Index.md','md')};
  const panel=new MockElement();
  projectApi.writerProjectMetaRender(view,panel,project);
  assert.equal(collected.length,3);
  assert.ok(collected[0].dropdown.options.some(x=>x.id==='Covers/novel.png'));
  await collected[0].dropdown.change('Covers/novel.png');
  assert.equal(written[0].cover,'Covers/novel.png');
  collected[1].textarea.change('A story about friendship. ');
  await collected[1].button.click();
  assert.equal(written[1].description,'A story about friendship.');
  await collected[2].dropdown.change('cc-by-sa-4.0');
  assert.equal(written[2].copyright,'cc-by-sa-4.0');
  assert.equal(projectApi.writerProjectNormalizeDescription('a'.repeat(2500)).length,2000);
 });
 await test('settings use six grouped categories with only one combined typing section',()=>{
  const main=fs.readFileSync('main.js','utf8');
  assert.ok(main.includes("['typing',msg('Digitação e tipografia','Typing & typography')]"));
  assert.ok(main.includes("if(writerModuleOn(this.plugin,'easyTyping'))this.plugin.writerEasyTyping.renderSettings(panel)"));
  assert.ok(main.includes("this.plugin.writerSmartTypography.renderSettings(panel)"));
  assert.ok(main.includes("const groups=["));
  assert.ok(main.includes("const subnav=el.createDiv({cls:'dictionary-settings-subtabs'})"));
  assert.ok(!main.includes("['easyTyping',msg("));
  assert.ok(!main.includes("['smartTypography',msg("));
 });
 await test('source bundle, translations, responsive CSS and stable meta exist',()=>{
  const main=fs.readFileSync('main.js','utf8');
  const build=fs.readFileSync('scripts/build-v3.js','utf8');
  const css=fs.readFileSync('styles.css','utf8');
  assert.ok(main.includes('writerProjectMetaRender(this,panel,project)'));
  assert.ok(main.includes('writerProjectRemember(this,selector.value)'));
  assert.ok(main.includes('// v3 module: src/v5/project-metadata.js'));
  assert.ok(build.includes("'v5/project-metadata'"));
  assert.ok(css.includes('.writer-project-cover-preview img'));
  assert.ok(css.includes('.dictionary-settings-subtabs'));
  assert.ok(fs.readFileSync('README.md','utf8').includes('5.2.0'));
  assert.ok(fs.readFileSync('docs/README.pt-BR.md','utf8').includes('5.2.0'));
 });
 console.log(passed+' Basic AI v5.2 tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
