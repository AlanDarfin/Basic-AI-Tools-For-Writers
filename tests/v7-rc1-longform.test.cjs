'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/v7/longform-rc.js','utf8');
class TFile{constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');}}
const alpha=new TFile('Novel/Ch 1.md'),beta=new TFile('Novel/Ch 2.md'),gamma=new TFile('Novel/Extra.md');
const objects={
 [alpha.path]:{act:'1',plotlines:['main','sub'],intensity:7,storyBeat:['opening'],status:'draft',pov:'Mira',setup_scenes:['[[Ch 2]]'],target_wordcount:850},
 [beta.path]:{act:'2',plotline:'main',intensity:0,storyBeat:'inciting',payoff_scenes:['Ch 1'],emotion:'hopeful',status:'final'},
 [gamma.path]:{act:'2',plotline:'sub',storyBeat:'custom',setup_scenes:['Missing scene'],status:'idea'}
};
const files=[alpha,beta,gamma],index=Object.fromEntries(files.map(f=>[f.path,f]));
const sceneRows=files.map((f,i)=>({file:f,title:f.basename,position:i+1,indent:i===2?1:0,
 status:objects[f.path].status,pov:objects[f.path].pov||'',
 summary:'',date:'',location:''}));
const app={
 vault:{getAbstractFileByPath:p=>index[p]||null},
 fileManager:{async processFrontMatter(file,handler){handler(objects[file.path]);}},
 metadataCache:{getFileCache:file=>({frontmatter:objects[file.path]})}
};
const context={
 TFile,writerUi:(pt,en)=>pt,
 writerV7StudioScenes:()=>sceneRows,
 writerV7StudioOpenSheet:()=>{},
 Notice:class{},Modal:class{},Setting:class{},ConfirmProjectAction:class{},
 PROJECT_VIEW:'basic-ai-projects'
};
const api=vm.runInNewContext(source+'\n({WRITER_V7_RC_BEATS,WRITER_V7_RC_STATUS,writerV7RCStrings,writerV7RCSceneView,writerV7RCLabelStatus,writerV7RCDimensions,writerV7RCPlotGroups,writerV7RCContinuityFindings,writerV7RCAssignSceneProperty})',context);
const view={app,activeScenes:()=>[],plugin:{settings:{v7:{}},saveSettings:async()=>{}},prefs:()=>({}),resolveScene:()=>null};
const project={file:alpha};
const plain=x=>JSON.parse(JSON.stringify(x));
test('RC reads real Longform order and YAML rather than another scene database',()=>{
 const scenes=api.writerV7RCSceneView(view,project);
 assert.deepEqual(plain(scenes.map(s=>s.title)),['Ch 1','Ch 2','Extra']);
 assert.deepEqual(plain(scenes[0].plotlines),['main','sub']);
 assert.deepEqual(plain(scenes[0].beats),['opening']);
 assert.equal(scenes[0].intensity,7);
 assert.equal(scenes[1].intensity,0);
 assert.equal(scenes[2].intensity,null);
});
test('Plotline grouping allows multiple story arcs per scene without duplicating chapter order',()=>{
 const scenes=api.writerV7RCSceneView(view,project);
 const groups=api.writerV7RCPlotGroups(scenes);
 assert.equal(groups.get('main').length,2);
 assert.equal(groups.get('sub').length,2);
 assert.equal(new Set(groups.get('main').map(x=>x.file.path)).size,2);
 assert.deepEqual(plain(api.writerV7RCDimensions(scenes).acts),['1','2']);
});
test('Three-act, five-act and journey structure are all informative templates',()=>{
 const t=api.WRITER_V7_RC_BEATS;
 assert.ok(t.three.length>=6);assert.ok(t.five.length>=5);assert.ok(t.journey.length>=8);
 for(const template of Object.values(t))assert.equal(new Set(template.map(x=>x[0])).size,template.length);
 assert.equal(api.writerV7RCLabelStatus('draft'),'Rascunho');
});
test('Metadata assignments use Obsidian frontmatter; new beat does not erase existing beats',async()=>{
 await api.writerV7RCAssignSceneProperty(view,alpha,'storyBeat','midpoint');
 assert.deepEqual(plain(objects[alpha.path].storyBeat),['opening','midpoint']);
 await api.writerV7RCAssignSceneProperty(view,alpha,'plotlines','third');
 assert.deepEqual(plain(objects[alpha.path].plotlines),['main','sub','third']);
 await assert.rejects(()=>api.writerV7RCAssignSceneProperty(view,alpha,'intensity','22'));
 await assert.rejects(()=>api.writerV7RCAssignSceneProperty(view,alpha,'dangerousKey','value'));
 assert.equal(objects[alpha.path].intensity,7);
});
test('RC checks missing setup/payoff references, recognizes real title and file links',()=>{
 const scenes=api.writerV7RCSceneView(view,project),issues=api.writerV7RCContinuityFindings(scenes);
 assert.equal(issues.length,1);
 assert.match(issues[0].detail,/Missing scene/);
 objects[gamma.path].setup_scenes=['[[Novel/Ch 2.md]]'];
 assert.equal(api.writerV7RCContinuityFindings(api.writerV7RCSceneView(view,project)).length,0);
});
test('RC version, modules, built entry point, translations and stylesheet are synchronized',()=>{
 const main=fs.readFileSync('main.js','utf8'),projects=fs.readFileSync('projects.js','utf8'),styles=fs.readFileSync('styles.css','utf8');
 const m=require('../manifest.json'),p=require('../package.json'),v=require('../versions.json');
 assert.ok(['7.0.0-rc.1','7.0.0','7.0.1','7.0.2','7.0.3','7.0.4','7.0.5','7.0.6','7.1.0','7.1.1'].includes(m.version));assert.equal(p.version,m.version);assert.equal(v[m.version],m.minAppVersion);
 assert.match(main,/new WriterV7LongformRC\(this\)/);
 assert.match(main,/v7\/longform-rc\.js/);
 assert.match(main,/writerV7RCRenderStructure\(view,panel,project\)/);
 assert.match(projects,/writerV7RCRenderStructure\(this,panel,project\)/);
 assert.match(projects,/Inspecionar cena/);
 for(const selector of ['writer-v7-rc-kanban','writer-v7-rc-corkboard','writer-v7-rc-plotgrid','writer-v7-rc-pacing-row'])
  assert.ok(styles.includes(selector),selector);
 for(const file of ['README.md','docs/README.pt-BR.md'])
  assert.ok(fs.readFileSync(file,'utf8').includes(m.version),file);
 for(const file of ['docs/V7_RC1.en.md','docs/V7_RC1.pt-BR.md'])
  assert.ok(fs.readFileSync(file,'utf8').includes('7.0.0-rc.1'),file);
});
