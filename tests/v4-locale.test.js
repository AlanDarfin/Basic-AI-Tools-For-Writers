'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const files=[
 'projects.js','src/v3/core.js','src/v3/complements.js',
 'src/v3/variants.js','src/v3/snapshots.js','src/v3/workspace.js',
 'src/v3/final-suite.js','src/v4/editor.js','src/v4/integrations.js',
 'src/v4/auto-grammar.js','src/v4/modules.js'
];
const read=path=>fs.readFileSync(path,'utf8');
const original=read('main.js');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS',name);};
test('language detection switches between English and Portuguese',()=>{
 const code=read('projects.js').match(/const lfMsg=\(pt,en\)=>\{[\s\S]*?\};/)?.[0];
 assert.ok(code);
 for(const [language,expected] of [['en','Save'],['en-US','Save'],['pt-BR','Salvar']]){
  const ctx={require:()=>({getLanguage:()=>language})};
  const fn=vm.runInNewContext(code+';lfMsg',ctx);
  assert.equal(fn('Salvar','Save'),expected);
 }
 const helper=original.match(/function writerUi\(pt,en\)\{[\s\S]*?\}\s*function writerMaskMarkdown/)?.[0];
 assert.ok(helper);
});
test('Longform UI uses bilingual labels and keeps stored identifiers unchanged',()=>{
 const code=read('projects.js');
 for(const [pt,en] of [['Novo subcapítulo','New subchapter'],['Projetos de escrita','Writing projects'],
  ['Padrão','Default'],['Principal','Main'],['Renomear cena','Rename scene'],['Salvar','Save']]){
  const matches=code.includes("lfMsg('"+pt+"','"+en+"')")||code.includes('lfMsg("'+pt+'","'+en+'")');
  assert.ok(matches,'Missing translated label '+pt+' → '+en);
 }
 assert.ok(code.includes("prefs.workflows={'Padrão':standard}"));
 assert.ok(code.includes("const path=[root,'Índice.md'].join('/')"));
});
test('variants and snapshots have English error, action and dialog text',()=>{
 const v=read('src/v3/variants.js'),s=read('src/v3/snapshots.js'),w=read('src/v3/workspace.js');
 for(const name of ['Edit variants','Alternative ','Variants saved.']){
  assert.ok(v.includes(name),'Variants translation missing: '+name);
 }
 for(const name of ['Restore','Compare','Cancel']){
  assert.ok(s.includes(name),'History translation missing: '+name);
 }
 assert.ok(w.includes('Automatic snapshots'));
 assert.ok(w.includes('Enable local history'));
});
test('canonical source components are embedded in main bundle',()=>{
 for(const path of files){
  const marker='// v3 module: '+path;
  if(path==='projects.js'){
   assert.ok(original.includes("const PROJECT_VIEW='basic-ai-projects'"));
   continue;
  }
  assert.ok(original.includes(marker),'Missing module in main.js: '+path);
 }
 assert.ok(original.includes("msg('Índice atualizado.','Index updated.')"));
});
test('all user-visible known Portuguese-only strings are wrapped by translation helpers',()=>{
 const samples={
  'projects.js':[
   "text:'Projetos de escrita'",
   "setTitle('Renomear cena')",
   "text:'Mover para lixeira'",
   "setButtonText('Salvar')",
   "text:'Encerrar sessão'"
  ],
  'src/v3/variants.js':["new Notice('Nenhuma variante sob o cursor.')","setTitle('Editar variantes')"],
  'src/v3/snapshots.js':["setButtonText('Cancelar')","text:'Comparar'","setTitle('Restaurar versão')"],
  'src/v3/workspace.js':["toggle('automatic','Sugestões automáticas'","toggle('automatic','Snapshots automáticos'"]
 };
 for(const [path,phrases] of Object.entries(samples)){
  const source=read(path);
  for(const phrase of phrases)assert.ok(!source.includes(phrase),'Untranslated UI string in '+path+': '+phrase);
 }
});
test('release metadata and documentation agree on 4.2.0 localization',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 const pkg=JSON.parse(read('package.json'));
 const versions=JSON.parse(read('versions.json'));
 assert.equal(manifest.version,'4.2.0');
 assert.equal(pkg.version,'4.2.0');
 assert.equal(versions['4.2.0'],manifest.minAppVersion);
 assert.match(read('README.md'),/English.*interface/i);
 assert.match(read('docs/README.pt-BR.md'),/inglês/i);
});
console.log(passed+' localization checks passed.');
