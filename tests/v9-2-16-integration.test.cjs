'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('Folder Note descriptions survive metadata cache delay',()=>{
 const src=read('src/v9/explorer-favorites-preview.js');
 class TFile{constructor(path){this.path=path;this.extension='md';}}
 class TFolder{constructor(path){this.path=path;this.name='Escrita';}}
 const note=new TFile('Trabalho/Escrita/Escrita.md');
 const plugin={settings:{v92Explorer:{previewMode:'all',folderDescriptionKey:'description',previewMax:135}},
  app:{vault:{getAbstractFileByPath:path=>path===note.path?note:null},metadataCache:{getFileCache:()=>({frontmatter:{}})}}};
 const env={TFile,TFolder,require:()=>({parseYaml:()=>({description:'Uma pasta de escrita'})})};
 const api=vm.runInNewContext(src+'\n({writerV9216FolderDescription,writerV921PreviewBody})',env);
 const folder=new TFolder('Trabalho/Escrita');
 assert.equal(api.writerV9216FolderDescription(plugin,folder,'---\ndescription: Uma pasta de escrita\n---\n# Notas'), 'Uma pasta de escrita');
 assert.equal(api.writerV921PreviewBody('---\ndescription: Não mostrar isso\n---\n# Título\nPrimeiro parágrafo escrito.',135),'Primeiro parágrafo escrito.');
 assert.match(src,/const description=folder\?/);
 assert.match(src,/writerV9216FolderDescription\(plugin,item,body,false\)/);
 assert.match(src,/writerV921PreviewBody\(body,cfg.previewMax\)/);
});
test('native Spaces use their own name, icon and color, without mutating vault contents',()=>{
 const source=read('src/v9/smart-spaces.js');
 const scope=vm.runInNewContext(source+'\n({writerV9SpaceSanitize,writerV9215SpaceHidden})',{ItemView:class{}});
 const a=scope.writerV9SpaceSanitize({name:'Escrita',id:'w',icon:'notebook-pen',iconColor:'#336699',hiddenPaths:['Private']});
 const b=scope.writerV9SpaceSanitize({name:'Estudos',id:'s',hiddenPaths:[]});
 assert.equal(a.icon,'notebook-pen');
 assert.equal(a.iconColor,'#336699');
 const plugin={settings:{v9Spaces:{enabled:true,activeId:'w',spaces:[a,b]}}};
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Private/chapter.md'),true);
 plugin.settings.v9Spaces.activeId='s';
 assert.equal(scope.writerV9215SpaceHidden(plugin,'Private/chapter.md'),false);
 const dock=read('src/v9/spaces-dock.js');
 for(const term of ['writerV9SpaceEditor','writerV922OpenIconPicker','writerV9215SelectSpace','writer-v9216-spaces-dock'])
  assert.ok(dock.includes(term),term);
 assert.match(dock,/Nenhum arquivo será excluído/);
});
test('Pretty settings cover extended visual features',()=>{
 const src=read('src/v9/pretty-properties.js');
 const api=vm.runInNewContext(src+'\n({writerV9215PrettyMerge})',{});
 const cfg={v9215Pretty:{coverShape:'weird',bannerPosition:'top',dueSoonDays:400}};
 api.writerV9215PrettyMerge(cfg);
 assert.equal(cfg.v9215Pretty.coverShape,'rounded');
 assert.equal(cfg.v9215Pretty.bannerPosition,'top');
 assert.equal(cfg.v9215Pretty.dueSoonDays,30);
 for(const term of ['writer-v9216-pretty-search','writer-v9216-tag-colored','writer-v9216-date-soon','coverPosition'])
  assert.ok(src.includes(term),term);
});
test('Flow and slash actions are registered and use conflict-safe writes',()=>{
 const src=read('src/v9/flow-slash.js');
 const api=vm.runInNewContext(src+'\n({writerV9215SlashActions,writerV9215FlowMerge})',{require:()=>({EditorSuggest:class{}})});
 const a=Array.from(api.writerV9215SlashActions(),x=>x.id);
 for(const id of ['tip','warning','important','flow','flowboard','highlight'])assert.ok(a.includes(id),id);
 assert.match(src,/registerMarkdownCodeBlockProcessor/);
 assert.match(src,/fresh!==original/);
 assert.match(src,/vault\.modify\(file,textarea.value\)/);
 assert.doesNotMatch(src,/innerHTML\s*=/);
});
test('source and CSS provide a compact dock on mobile, not a second explorer',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 assert.match(css,/writer-v9216-spaces-host/);
 assert.match(css,/writer-v9216-spaces-rail/);
 assert.match(css,/body\.is-mobile \.writer-v9216-spaces-dock/);
 assert.match(css,/writer-v9216-flow-board/);
 assert.doesNotMatch(css,/!important/);
});
