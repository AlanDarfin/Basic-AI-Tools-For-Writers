'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const utils=read('src/v8/home-utilities.js');
const finish=read('src/v8/finish-blocks.js');
const home=read('src/v8/writing-home.js');
const clean=vm.runInNewContext(utils+'\nwriterV8HomeTitleClean',{});
const merge=vm.runInNewContext(utils+'\n'+finish+'\nwriterV8FinishMerge',{});

test('9.2.3 matches manifest, package and versions records',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 const pkg=JSON.parse(read('package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const versions=JSON.parse(read('versions.json'));
 assert.equal(manifest.version,'9.2.3');
 assert.equal(pkg.version,manifest.version);
 assert.equal(lock.version,manifest.version);
 assert.equal(lock.packages[''].version,manifest.version);
 assert.equal(versions[manifest.version],'1.11.4');
});

test('homepage title input preserves lowercase n and r and every other letter',()=>{
 const alphabet='abcdefghijklmnopqrstuvwxyz';
 assert.equal(clean(alphabet),alphabet);
 assert.equal(clean(alphabet.toUpperCase()),alphabet.toUpperCase());
 for(const title of ['bonfire','BONFIRE','Bonfire','narrativa','run','renner','rinoceronte','normal','banana','enredo','não remover nada']){
  assert.equal(clean(title),title,'Text mutated: '+title);
 }
 const settings={v8Finish:{homeTitle:'bonfire'}};
 assert.equal(merge(settings).homeTitle,'bonfire');
 assert.equal(clean('bonfire'),'bonfire');
 assert.match(home,/cfg\.homeTitle=writerV8HomeTitleClean\(value\)/);
 assert.match(finish,/cfg\.homeTitle=writerV8HomeTitleClean\(cfg\.homeTitle\)/);
});

test('international letters, accents, digits and symbols remain intact',()=>{
 for(const title of ['Bonfire 🔥','Énredo, Japão e França','Rönn, 123!?','漢字の文','L’écriture de l’auteur','Ñandú — árvores','n + r ≠ N + R']){
  assert.equal(clean(title),title,'Text mutated: '+title);
 }
});

test('only actual line breaks and control characters are sanitized',()=>{
 assert.equal(clean('Bonfire\nNova etapa'),'Bonfire Nova etapa');
 assert.equal(clean('Bonfire\r\nNovo título'),'Bonfire Novo título');
 assert.equal(clean('n\u2028r\u2029n'),'n r n');
 assert.equal(clean('a'+String.fromCharCode(0,7,31)+'n'),'an');
 assert.equal(clean('x'.repeat(120)).length,80);
 assert.equal(clean(null),'');
});

test('no other double-escaped CR/LF character class in original compiled source',()=>{
 const main=read('main.js');
 // The previous expression used two backslashes per escape *inside* a regex
 // character class, silently removing literal lowercase n and r.
 const matches=main.match(/\.replace\(\s*\/\[\s*\\\\[rn](?:\\\\[rn])?\]\s*\/g/g)||[];
 assert.equal(matches.length,0,JSON.stringify(matches));
 assert.match(main,/function writerV8HomeTitleClean\(value\)/);
 assert.ok((main.match(/cfg\.homeTitle=writerV8HomeTitleClean\(/g)||[]).length>=2);
});

test('favorite icon follows real row center at PC and Android sizes',()=>{
 const css=read('src/styles/v9-2-3-home-title-favorites.css');
 assert.match(css,/\.nav-file-title \.writer-v92-favorite\s*\{[^}]*top:0;[^}]*bottom:0;[^}]*margin-block:auto/s);
 assert.match(css,/body\.is-mobile[^{]*\.writer-v92-favorite\s*\{[^}]*top:0;[^}]*bottom:0;[^}]*margin-block:auto/s);
 assert.match(css,/height:24px/);
 assert.match(css,/height:36px/);
 assert.match(css,/align-items:center/);
});

test('desktop icon is visually larger, text cannot be masked, and mobile layout stays separate',()=>{
 const css=read('src/styles/v9-2-3-home-title-favorites.css');
 assert.match(css,/\.writer-v8-home-heading h2\s*\{[^}]*font-variant:normal;[^}]*letter-spacing:normal;[^}]*overflow:visible/s);
 assert.match(css,/body:not\(\.is-mobile\) \.writer-v8-home \.writer-v8-home-title-icon svg\s*\{[^}]*width:53px;[^}]*height:53px;/s);
 assert.match(css,/@media\(min-width:701px\)/);
 assert.match(read('styles.css'),/9\.2\.3: Home heading proportions/);
 assert.match(read('scripts/build-css.js'),/v9-2-3-home-title-favorites\.css/);
 assert.match(read('main.js'),/writerV8HomeTitleClean/);
});
