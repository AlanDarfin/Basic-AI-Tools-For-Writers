'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const spaces=read('src/v9/smart-spaces.js');
const flex=read('src/v9/explorer-flex.js');
const toolbar=read('src/v9/context-toolbar.js');
const dragger=read('src/v10/block-dragger.js');
const ctx={
 writerUi:(pt,en)=>pt,
 writerV8HomeIsMobile:plugin=>!!plugin.app?.isMobile,
 writerModuleOn:()=>true,
 writerV9215ActiveSpace:plugin=>plugin.settings.v9Spaces?.spaces?.find(x=>x.id===plugin.settings.v9Spaces.activeId)||null,
 writerV9215SpaceHidden:(plugin,path)=>{
  const space=plugin.settings.v9Spaces?.spaces?.find(x=>x.id===plugin.settings.v9Spaces.activeId);
  return !!space?.hiddenPaths?.some(p=>path===p||path.startsWith(p+'/'));
 },
 console
};
const scope=vm.runInNewContext(flex+'\n({writerV1202SpaceScope,writerV1202SpaceVisibility})',ctx);
const tools=vm.runInNewContext(toolbar+'\n({writerV9ToolbarMerge,writerV1048ToolbarProfile,writerV1048ToolbarHasSelection})',ctx);
const spaceModel=vm.runInNewContext(spaces+'\n({writerV9SpaceItems})',{writerUi:ctx.writerUi,ItemView:class{},console});
function sample(){
 return {settings:{v9Spaces:{activeId:'fireverse',spaces:[
  {id:'fireverse',folder:'Trabalho/Escrita/Fireverse',hiddenPaths:['Trabalho/Escrita/Fireverse/Privado']},
  {id:'other',folder:'Outros',hiddenPaths:[]}
 ]},v91Flex:{enabled:true,hideEnabled:true,hidden:[]}},app:{isMobile:false}};
}
test('folder Spaces hide siblings, visually flatten ancestors, preserve the chosen root',()=>{
 const plugin=sample(),classify=p=>scope.writerV1202SpaceScope(plugin,p);
 assert.equal(classify('Trabalho'),'ancestor');
 assert.equal(classify('Trabalho/Escrita'),'ancestor');
 assert.equal(classify('Trabalho/Escrita/Fireverse'),'root');
 assert.equal(classify('Trabalho/Escrita/Fireverse/Livro'),'descendant');
 assert.equal(classify('Trabalho/Outros'),'excluded');
 const visible=p=>scope.writerV1202SpaceVisibility(plugin,plugin.settings.v91Flex,p,[]);
 assert.equal(visible('Trabalho').hidden,false,'ancestor DOM shell must stay mounted');
 assert.equal(visible('Trabalho/Outros').hidden,true);
 assert.equal(visible('Trabalho/Escrita/Fireverse/Privado/Nota.md').hidden,true);
 plugin.settings.v9Spaces.activeId='other';
 assert.equal(classify('Trabalho/Escrita/Fireverse'),'excluded');
 assert.equal(visible('Outros').hidden,false);
});
test('Space collections respect per-Space hidden folder descendants',()=>{
 const base='Trabalho/Escrita/Fireverse/';
 const files=['Capitulo.md','Privado/Plano.md','Notas/Lore.md'].map(path=>({
  path:base+path,basename:path.split('/').pop().replace('.md',''),stat:{mtime:1}
 }));
 const plugin={app:{vault:{getMarkdownFiles:()=>files},metadataCache:{getFileCache:()=>({})}}};
 const space={mode:'folder',folder:'Trabalho/Escrita/Fireverse',hiddenPaths:[base+'Privado'],pinnedPaths:[],sort:'name'};
 assert.deepEqual(Array.from(spaceModel.writerV9SpaceItems(plugin,space),file=>file.path),
  [base+'Capitulo.md',base+'Notas/Lore.md']);
});
test('toolbar profiles migrate old settings and keep PC and mobile independent',()=>{
 const plugin={settings:{v9Toolbar:{actions:['bold','italic'],buttonSize:36,placement:'floating',enabledDesktop:true,enabledMobile:true}},
  app:{isMobile:false}};
 tools.writerV9ToolbarMerge(plugin.settings);
 const desktop=tools.writerV1048ToolbarProfile(plugin,'desktop');
 const mobile=tools.writerV1048ToolbarProfile(plugin,'mobile');
 assert.equal(desktop.placement,'floating');
 assert.equal(mobile.placement,'bottom','floating layout is not used on mobile');
 assert.notEqual(desktop,mobile);
 desktop.actions.push('underline');desktop.buttonSize=42;
 mobile.actions=['italic'];mobile.buttonSize=28;
 tools.writerV9ToolbarMerge(plugin.settings);
 assert.equal(tools.writerV1048ToolbarProfile(plugin,'desktop').buttonSize,42);
 assert.equal(tools.writerV1048ToolbarProfile(plugin,'mobile').buttonSize,28);
 assert.ok(tools.writerV1048ToolbarProfile(plugin,'desktop').actions.includes('underline'));
 assert.deepEqual(Array.from(tools.writerV1048ToolbarProfile(plugin,'mobile').actions),['italic']);
});
test('floating toolbar requires a real selection and editing mode',()=>{
 const selected={getMode:()=>'source',editor:{getSelection:()=> 'Hello'}};
 const empty={getMode:()=>'source',editor:{getSelection:()=>'',cm:{state:{selection:{ranges:[{from:5,to:5}]}}}}};
 const reading={getMode:()=>'preview',editor:{getSelection:()=> 'Hello'}};
 assert.equal(tools.writerV1048ToolbarHasSelection(selected),true);
 assert.equal(tools.writerV1048ToolbarHasSelection(empty),false);
 assert.equal(tools.writerV1048ToolbarHasSelection(reading),false);
 assert.match(toolbar,/cfg\.placement==='floating'&&!writerV1048ToolbarHasSelection\(view\)/);
 assert.match(toolbar,/plugin\.registerDomEvent\(document,key,reposition,true\)/);
});
test('dragger retains its handle while crossing from text to the grip',()=>{
 assert.match(dragger,/const nearHandle=e=>/);
 assert.match(dragger,/if\(e\.target===handle\|\|handle\.contains\(e\.target\)\|\|nearHandle\(e\)\)return/);
 assert.match(dragger,/registerDomEvent\(handle,'pointerenter'/);
});
test('root Space styling hides only ancestor labels, not descendants',()=>{
 const css=read('src/styles/v12-0-1-mobile.css');
 assert.match(css,/writer-v1202-space-ancestor > \.nav-folder-title/);
 assert.match(css,/writer-v1202-space-scoped/);
 assert.doesNotMatch(css,/writer-v1202-space-root > \.nav-folder-title\s*\{\s*display:none/);
});
