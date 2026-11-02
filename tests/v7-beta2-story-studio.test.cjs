'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const studio=fs.readFileSync('src/v7/story-studio.js','utf8');
const timeline=fs.readFileSync('src/v7/timeline-studio.js','utf8');
const world=fs.readFileSync('src/v7/worldbuilding.js','utf8');
const fakeFiles=new Map();
class TFile{constructor(path){this.path=path;this.basename=path.split('/').pop().replace(/\.[^.]+$/,'');this.extension=path.split('.').pop();}}
fakeFiles.set('World/hero.png',new TFile('World/hero.png'));
fakeFiles.set('World/Alice.md',new TFile('World/Alice.md'));
fakeFiles.set('World/Castle.md',new TFile('World/Castle.md'));
const caches=new Map([
 ['World/Alice.md',{frontmatter:{type:'character',tags:['personagem'],summary:'An archivist',avatar:'[[World/hero.png]]',relationships:['[[World/Castle]]'],pov:'Alice'}}],
 ['World/Castle.md',{frontmatter:{tags:['local'],summary:'A castle'}}]
]);
const app={
 vault:{getAbstractFileByPath:p=>fakeFiles.get(p)||null,getResourcePath:f=>'app://'+f.path},
 metadataCache:{
  getFirstLinkpathDest:(p)=>fakeFiles.get(p)||fakeFiles.get(p+'.md')||null,
  getFileCache:f=>caches.get(f.path)||null,
  resolvedLinks:{'World/Alice.md':{'World/Castle.md':1}}
 }
};
const context={TFile,writerUi:(pt,en)=>pt,writerV7Tag:x=>/^[a-z]+$/i.test(String(x))?'#'+x:'',writerV7ProjectNotes:()=>[],
 writerV7Connections:()=>[],writerV7TimelineDate:s=>Number.isFinite(Number(s))?Number(s)*366:null,
 writerV7TimelineEntries:()=>[],Modal:class{},Setting:class{},TextPrompt:class{},ConfirmProjectAction:class{},
 console};
const api=vm.runInNewContext(studio+'\n'+timeline+
'\n({WRITER_V7_STUDIO_TEMPLATES,writerV7StudioTemplates,writerV7StudioKind,writerV7StudioFields,writerV7StudioImage,writerV7StudioLinkValue,writerV7StudioLinkedTargets,writerV7StudioScenes,writerV7StudioSafeMap,writerV7StudioImageFile,writerV7StudioTimelineBranches,writerV7StudioGanttModel})',context);
function plain(x){return JSON.parse(JSON.stringify(x));}
test('builtin templates add worldbuilding types without duplicate Compendium storage',()=>{
 const plugin={settings:{v7StudioTemplates:[{id:'custom-lore',name:'Lore',tag:'lore',fields:['summary','chronology']},
  {id:'character',name:'Duplicate',tag:'character',fields:[]}]}};
 const t=api.writerV7StudioTemplates(plugin);
 for(const id of ['character','place','item','group','culture','economy','magic','event','reference','custom-lore'])
  assert.ok(t.some(x=>x.id===id),id);
 assert.equal(t.filter(x=>x.id==='character').length,1);
 const entry={tags:['#personagem'],cache:caches.get('World/Alice.md')};
 assert.equal(api.writerV7StudioKind(entry,t).id,'character');
 const fields=api.writerV7StudioFields(entry,t[0]);
 assert.ok(fields.some(x=>x.key==='summary'&&x.text==='An archivist'));
});
test('portrait display is limited to vault image files (no arbitrary remote URLs)',()=>{
 const entry={path:'World/Alice.md',cache:caches.get('World/Alice.md')};
 assert.equal(api.writerV7StudioImage(app,entry),'app://World/hero.png');
 assert.equal(api.writerV7StudioImage(app,{path:entry.path,cache:{frontmatter:{avatar:'https://example.org/photo.png'}}}),'');
 assert.equal(api.writerV7StudioImage(app,{path:entry.path,cache:{frontmatter:{avatar:'[[World/Alice.md]]'}}}),'');
 assert.equal(api.writerV7StudioLinkValue('World/Castle'),'[[World/Castle]]');
 assert.equal(api.writerV7StudioLinkValue('[[World/Castle]]'),'[[World/Castle]]');
});
test('links in relationships resolve to existing Markdown notes only',()=>{
 const entry={path:'World/Alice.md',cache:caches.get('World/Alice.md')};
 assert.deepEqual(plain(api.writerV7StudioLinkedTargets(app,entry)),['World/Castle.md']);
});
test('safe image maps clamp markers and reject non-image files',()=>{
 const map=api.writerV7StudioSafeMap({id:'m',image:'World/hero.png',
  markers:[{note:'World/Alice.md',x:130,y:-20},{note:'World/Castle.md',x:22.5,y:88}]});
 assert.deepEqual(plain(map.markers.map(x=>[x.x,x.y])),[[100,0],[22.5,88]]);
 assert.ok(api.writerV7StudioImageFile(app,'World/hero.png') instanceof TFile);
 assert.equal(api.writerV7StudioImageFile(app,'World/Alice.md'),null);
});
test('board reuses the current Longform scene list and ordinary metadata',()=>{
 const view={app,activeScenes:()=>[{title:'Alice',indent:0},{title:'Castle',indent:1}],
  resolveScene:(_,name)=>fakeFiles.get(name==='Alice'?'World/Alice.md':'World/Castle.md')};
 const scenes=api.writerV7StudioScenes(view,{});
 assert.equal(scenes.length,2);
 assert.equal(scenes[0].position,1);assert.equal(scenes[1].indent,1);
 assert.equal(scenes[0].pov,'Alice');
});
test('timeline lanes and Gantt use existing events, not a separate database',()=>{
 const items=[{title:'Before',branch:'main',sortKey:0,endKey:200,track:'History'},
 {title:'After',branch:'alternate',sortKey:1000,endKey:null,track:'Alternate'}];
 assert.deepEqual(plain(api.writerV7StudioTimelineBranches(items)),['alternate','main']);
 const bars=api.writerV7StudioGanttModel(items);
 assert.equal(bars.length,2);
 for(const b of bars){assert.ok(b.left>=0&&b.left<=100);assert.ok(b.width>=2&&b.width<=100);}
});
test('beta.2 scripts, compiled bundle, CSS, language files and versions are synchronized',()=>{
 const main=fs.readFileSync('main.js','utf8'),projects=fs.readFileSync('projects.js','utf8'),
  css=fs.readFileSync('styles.css','utf8');
 const manifest=require('../manifest.json'),pkg=require('../package.json'),versions=require('../versions.json');
 assert.ok(['7.0.0-beta.2','7.0.0-rc.1','7.0.0','7.0.1','7.0.2','7.0.3','7.0.4','7.0.5','7.0.6','7.1.0','7.1.1','7.2.0','8.0.0','8.0.1'].includes(manifest.version));assert.equal(manifest.version,pkg.version);
 assert.equal(versions[manifest.version],manifest.minAppVersion);
 assert.ok(main.includes('// v3 module: src/v7/story-studio.js'));
 assert.ok(main.includes('// v3 module: src/v7/timeline-studio.js'));
 assert.ok(main.includes('this.writerV7StoryStudio=new WriterV7StoryStudio(this)'));
 for(const name of ['writerV7StudioRenderBoard','writerV7StudioRenderGraph','writerV7StudioRenderMaps',
  'writerV7StudioRenderGallery','writerV7StudioRenderSessions','writerV7StudioRenderTimeline'])
  assert.ok(projects.includes(name)||main.includes(name),name);
 for(const name of ['writer-v7-studio-map-stage','writer-v7-studio-scene','writer-v7-scene-collapse',
  'writer-v7-studio-gantt-row'])assert.ok(css.includes(name),name);
 for(const path of ['README.md','docs/README.pt-BR.md','docs/V7_BETA2.en.md','docs/V7_BETA2.pt-BR.md'])
  assert.ok(fs.readFileSync(path,'utf8').includes('7.0.0-beta.2'),path);
});
