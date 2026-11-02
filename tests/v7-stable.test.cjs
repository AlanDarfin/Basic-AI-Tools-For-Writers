'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v7/stable.js','utf8');
class TFile{constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');}}
const context={
 TFile,writerUi:(pt,en)=>pt,Modal:class{},Setting:class{},Notice:class{},TextPrompt:class{},
 ConfirmProjectAction:class{},PROJECT_VIEW:'basic-ai-projects',writerProjectRemember:()=>{},
 writerV7RCSceneView:()=>[],console
};
const api=vm.runInNewContext(source+'\n({writerV7CalendarNormalize,writerV7CalendarYearLength,writerV7CalendarSortDate,writerV7CalendarParseMonths,writerV7SeriesSafe,writerV7SeriesForProject,writerV7StableSceneKey,writerV7StableDependencies})',context);
const js=v=>JSON.parse(JSON.stringify(v));
test('chronology is monotonic across Gregorian year boundary (regression)',()=>{
 const date=api.writerV7CalendarSortDate;
 assert.ok(date('2024-12-31')<date('2025-01-01'));
 assert.ok(date('2024-02-29')<date('2024-03-01'));
 assert.equal(date('2023-02-29'),null);
 assert.equal(date('2024-02-30'),null);
 assert.equal(date('2024-13-01'),null);
 assert.equal(date('2024-04-31'),null);
 assert.equal(date('2024-02-29'),date('2024-02-28')+1);
 assert.ok(date('-0010-12-31')<date('-0009-01-01'));
 assert.ok(date('0')<date('1'));
 assert.equal(date('Era of Stars'),null);
});
test('world-specific fictional calendars support custom month sizes safely',()=>{
 const config={mode:'custom',months:[{name:'Bloom',days:40},{name:'Dusk',days:22}]};
 const date=value=>api.writerV7CalendarSortDate(value,config);
 assert.ok(date('12-01-40')<date('12-02-01'));
 assert.ok(date('12-02-22')<date('13-01-01'));
 assert.equal(date('12-02-23'),null);
 assert.equal(date('12-03-01'),null);
 assert.equal(api.writerV7CalendarYearLength(config,12),62);
 assert.deepEqual(js(api.writerV7CalendarParseMonths('Bloom:40\nDusk:22')),config.months);
 assert.throws(()=>api.writerV7CalendarParseMonths('Month:999'));
 assert.throws(()=>api.writerV7CalendarParseMonths('Bad month format'));
});
test('series indexes deduplicate projects and never touch the Longform source',()=>{
 const state={v7Series:[{id:'series-1',name:'Trilogy',books:['Books/A.md','Books/B.md','Books/A.md','invalid.pdf']},
 {id:'series-1',name:'Duplicate',books:['Books/C.md']},{id:'series-2',name:'Duology',books:['Books/C.md']}]};
 const safe=js(api.writerV7SeriesSafe(state));
 assert.equal(safe.length,2);
 assert.deepEqual(safe[0].books,['Books/A.md','Books/B.md']);
 assert.deepEqual(js(api.writerV7SeriesForProject(state,'Books/C.md')).map(x=>x.name),['Duology']);
 assert.deepEqual(js(api.writerV7SeriesForProject(state,'Books/Z.md')),[]);
});
test('scene setup and payoff relationships use canonical Longform notes',()=>{
 const a=new TFile('Book/A.md'),b=new TFile('Book/B.md'),c=new TFile('Book/C.md');
 const scenes=[
 {file:a,title:'A',position:1,setup:[],payoff:['[[B]]'],indent:0},
 {file:b,title:'B',position:2,setup:['[[A]]'],payoff:['[[C]]'],indent:0},
 {file:c,title:'C',position:3,setup:['[[B]]'],payoff:[],indent:0}
 ];
 const relationships=api.writerV7StableDependencies(scenes);
 assert.equal(relationships.edges.length,2);
 assert.deepEqual(js(relationships.edges.map(x=>[x.from.title,x.to.title])),[['A','B'],['B','C']]);
 assert.equal(relationships.warnings.length,0);
 scenes[2].setup=['[[Unknown]]','[[C]]'];
 const invalid=api.writerV7StableDependencies(scenes);
 assert.ok(invalid.warnings.some(x=>x.reason==='Cena inexistente'));
 assert.ok(invalid.warnings.some(x=>x.reason.includes('própria')));
});
test('stable release manifest, bilingual docs, new UI and bundled modules',()=>{
 const m=require('../manifest.json'),p=require('../package.json'),versions=require('../versions.json');
 assert.equal(m.version,'8.0.0');assert.equal(m.version,p.version);
 assert.equal(versions[m.version],m.minAppVersion);
 assert.equal(m.name,'Basic AI Tool for Writers');
 assert.doesNotMatch(m.name,/\b(obsidian|plugin)\b/i);
 assert.match(m.id,/^[a-z-]+$/);assert.ok(!m.id.includes('obsidian'));
 assert.ok(m.description.length<=250&&m.description.endsWith('.'));
 assert.equal(m.isDesktopOnly,false);
 const main=fs.readFileSync('main.js','utf8'),project=fs.readFileSync('projects.js','utf8'),css=fs.readFileSync('styles.css','utf8');
 for(const value of ['new WriterV7StableFeatures(this)','// v3 module: src/v7/stable.js','writerV7StableDependencies','writerV7CalendarSortDate','writerV7SeriesOpen'])
  assert.ok(main.includes(value),value);
 for(const value of ['writer-project-nav-groups','writerV7SeriesOpen(this)','writerV7RCRenderStructure'])
  assert.ok(project.includes(value),value);
 assert.ok(css.includes('.writer-project-root .writer-project-nav-groups'));
 for(const path of ['README.md','docs/README.pt-BR.md','docs/V8_0_0_RELEASE.en.md','docs/V8_0_0_RELEASE.pt-BR.md'])
  assert.ok(fs.readFileSync(path,'utf8').includes(m.version),path);
 for(const path of ['docs/V7_RELEASE.en.md','docs/V7_RELEASE.pt-BR.md'])
  assert.ok(fs.readFileSync(path,'utf8').includes('7.0.0'),path);
});
