'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
class TFile{constructor(path){this.path=path;this.name=path.split('/').pop();this.basename=this.name.replace(/\.md$/,'');this.extension='md';this.parent={path:path.split('/').slice(0,-1).join('/')};}}
class TFolder{}
class Modal{}
class ItemView{}
class Setting{}
class Notice{}
const obsidian={TFile,TFolder,Modal,ItemView,Setting,Notice,parseYaml:()=>({}),stringifyYaml:()=>''};
const context={module:{exports:{}},require:id=>{if(id!=='obsidian')throw Error('Unexpected dependency');return obsidian;},console,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync('projects.js','utf8'),context,{filename:'projects.js'});
const {ProjectsView,lfFlattenScenes,lfNestScenes,lfSceneTree,lfWordCount}=context.module.exports;
const j=x=>JSON.parse(JSON.stringify(x));
function test(title,fn){return Promise.resolve().then(fn).then(()=>console.log('PASS',title),error=>{console.error('FAIL',title,error);process.exitCode=1;});}
const tests=[];
tests.push(test('Nested Longform YAML roundtrips without losing scenes',()=>{
 const scenes=['Prólogo',['Um',['Detalhe'],'Dois'],'Epílogo'];
 const flat=lfFlattenScenes(scenes);
 assert.deepEqual(j(flat),[{title:'Prólogo',indent:0},{title:'Um',indent:1},{title:'Detalhe',indent:2},{title:'Dois',indent:1},{title:'Epílogo',indent:0}]);
 assert.deepEqual(j(lfNestScenes(flat)),scenes);
 assert.equal(lfSceneTree(flat)[0].children[0].title,'Um');
}));
tests.push(test('Multiple root scenes are retained',()=>assert.deepEqual(j(lfNestScenes(lfFlattenScenes(['A','B','C']))),['A','B','C'])));
tests.push(test('Existing Longform flat scene metadata is readable',()=>assert.deepEqual(j(lfFlattenScenes([{title:'A',indent:0},{title:'B',indent:1}])),[{title:'A',indent:0},{title:'B',indent:1}])));
tests.push(test('Word counts exclude YAML and respect accented words',()=>assert.equal(lfWordCount('---\ntitle: Test\n---\nOlá, mundo!\nEu escrevi.'),4)));
function instance(){
 const view=Object.create(ProjectsView.prototype);
 view.app={vault:{},workspace:{},fileManager:{}};
 view.plugin={settings:{projectsData:{}},saveSettings:async()=>{}};
 view.draft='Principal';
 view.workflow='Padrão';
 view.sceneList=p=>lfFlattenScenes(p.scenes);
 view.activeScenes=p=>lfFlattenScenes(p.scenes);
 return view;
}
tests.push(test('Default multi-scene workflow has a Join and valid steps',()=>{
 const view=instance(),project={file:new TFile('Book/Index.md'),format:'scenes',scenes:['A',['B'],'C']};
 const wf=view.workflowsFor(project).Padrão;
 assert.ok(wf.steps.some(s=>s.id==='concatenate-text'));
 assert.doesNotThrow(()=>view.validateWorkflow(project,wf));
}));
tests.push(test('Single-scene workflows do not insert Join',()=>{
 const view=instance(),project={file:new TFile('Short.md'),format:'single',scenes:[]};
 const wf=view.workflowsFor(project).Padrão;
 assert.ok(!wf.steps.some(s=>s.id==='concatenate-text'));
 assert.doesNotThrow(()=>view.validateWorkflow(project,wf));
}));
tests.push(test('Unknown custom compile steps refuse execution',()=>{
 const view=instance(),project={file:new TFile('Book/Index.md'),format:'scenes'};
 assert.throws(()=>view.validateWorkflow(project,{steps:[{id:'custom-script',optionValues:{}}]}),/não suportada/);
}));
tests.push(test('Compiler preview is non-destructive and respects scene order',async()=>{
 const view=instance(),project={file:new TFile('Book/Index.md'),format:'scenes',title:'Book',scenes:['A',['B'],'C'],meta:{sceneFolder:'/'}};
 const content={'Book/A.md':'---\nfoo: bar\n---\nAlpha [[Page|name]]','Book/B.md':'Bravo','Book/C.md':'Charlie'};
 let created=0;
 view.resolveScene=(_p,name)=>new TFile('Book/'+name+'.md');
 view.app.vault.read=async file=>content[file.path];
 view.app.vault.create=async()=>{created++;throw Error('Preview cannot create');};
 const wf=view.defaultWorkflow();
 const result=await view.compileProject(project,wf,true);
 assert.match(result.contents,/Alpha name/);
 assert.match(result.contents,/Bravo/);
 assert.match(result.contents,/Charlie/);
 assert.ok(result.contents.indexOf('Alpha')<result.contents.indexOf('Bravo')&&result.contents.indexOf('Bravo')<result.contents.indexOf('Charlie'));
 assert.ok(!result.contents.includes('foo: bar'));
 assert.equal(created,0);
}));
tests.push(test('Compiled notes never replace source or existing output',async()=>{
 const view=instance(),project={file:new TFile('Book/Index.md'),format:'scenes',title:'Book',scenes:['A'],meta:{sceneFolder:'/'}};
 const files=new Set(['Book/Index.md','Book/A.md','Book/manuscript.md']);
 view.resolveScene=(_p,name)=>new TFile('Book/'+name+'.md');
 view.app.vault.read=async()=> 'Hello world';
 view.app.vault.getAbstractFileByPath=path=>files.has(path)?new TFile(path):null;
 view.app.vault.create=async(path,content)=>{if(files.has(path))throw Error('overwrite');files.add(path);return new TFile(path);};
 view.ensureFolder=async()=>{};
 view.openFile=()=>{};
 const result=await view.compileProject(project,view.defaultWorkflow(),false);
 assert.equal(result.file.path,'Book/manuscript 2.md');
 assert.ok(files.has('Book/A.md')&&files.has('Book/Index.md'));
}));
Promise.all(tests).then(()=>{if(process.exitCode)process.exit(process.exitCode);});
