'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');

test('9.2.2 manifest and package versions match',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 const pkg=JSON.parse(read('package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 const versions=JSON.parse(read('versions.json'));
 assert.equal(manifest.version,'9.2.2');
 assert.equal(pkg.version,manifest.version);
 assert.equal(lock.version,manifest.version);
 assert.equal(lock.packages[''].version,manifest.version);
 assert.equal(versions[manifest.version],'1.11.4');
});

test('the chat puts user bubbles on right despite inherited row-reverse CSS',()=>{
 const css=read('src/styles/v9-1-unified.css');
 assert.match(css,/\.writer-v91-ai-chat-row\.is-right\s*\{[^}]*flex-direction:row\s*;[^}]*justify-content:flex-end/s);
 assert.match(css,/\.writer-v91-ai-chat-row\.is-right \.writer-v8-chat-group\s*\{[^}]*margin-inline-start:auto/s);
 assert.match(css,/\.writer-v91-ai-chat-row\.is-left\{justify-content:flex-start/);
 const main=read('main.js');
 assert.match(main,/const side=role==='user'\?'right':'left'/);
 assert.match(main,/writer-v91-ai-chat-row is-'\+side/);
});

test('the Explorer preview is outside the folder or file title row',()=>{
 const source=read('src/v9/explorer-favorites-preview.js');
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 assert.match(source,/node\.insertAdjacentElement\('afterend',shell\)/);
 assert.doesNotMatch(source,/node\.appendChild\(shell\)/);
 assert.match(source,/oldInline\?\.remove\(\)/);
 assert.match(css,/\.nav-folder > \.writer-v92-preview-shell/);
 assert.match(css,/\.nav-file > \.writer-v92-preview-shell/);
 assert.match(css,/flex-wrap:nowrap/);
 assert.match(source,/const fromYaml=writerV92PreviewValue\(plugin,item\)/);
 assert.match(source,/writerV921PreviewImage\(plugin,source/);
 assert.match(source,/writer-v92-favorite/);
});

test('homepage, favorite and file/folder pickers reuse one searchable Iconic gallery',()=>{
 const native=read('src/v9/native-explorer.js');
 const home=read('src/v8/writing-home.js');
 const fav=read('src/v9/explorer-favorites-preview.js');
 assert.match(native,/function writerV922OpenIconPicker\(plugin,options\)/);
 assert.match(native,/function writerV922IconSetting\(plugin,panel/);
 assert.match(native,/writerV922OpenIconPicker\(plugin,\{/);
 assert.match(native,/writer-v922-iconic-grid/);
 assert.match(native,/writer-v922-iconic-preview/);
 assert.match(native,/writer-v922-iconic-pin/);
 assert.match(native,/writerV9ColorSetting\(content,'Cor do ícone'/);
 assert.match(native,/v922IconRecent/);
 assert.match(native,/v922IconFavorites/);
 assert.match(home,/writerV922IconSetting\(plugin,panel,\{/);
 assert.match(fav,/writerV922IconSetting\(plugin,panel,\{/);
 assert.match(fav,/favoriteIconColor/);
 assert.match(fav,/--writer-v92-favorite-color/);
 const styles=read('styles.css');
 assert.match(styles,/writer-v922-iconic-choice/);
 assert.match(styles,/writer-v922-iconic-setting/);
 assert.match(styles,/writer-v92-preview-shell/);
});

test('all available Lucide IDs are accepted, unknown IDs fall back',()=>{
 const code=read('src/v9/native-explorer.js')+'\n'+read('src/v8/home-utilities.js')+
 '\n({writerV9AvailableIcons,writerV922ValidIconList,writerV8HomeIconName})';
 const lib=vm.runInNewContext(code,{require:()=>({getIconIds:()=>['audio-lines','book-open','star','custom-lucide']})});
 assert.equal(lib.writerV8HomeIconName('audio-lines'),'audio-lines');
 assert.equal(lib.writerV8HomeIconName('custom-lucide'),'custom-lucide');
 assert.equal(lib.writerV8HomeIconName('not-a-real-obsi-icon'),'book-open');
 const filtered=lib.writerV922ValidIconList(['star','star','audio-lines','unknown'],lib.writerV9AvailableIcons());
 assert.equal(JSON.stringify(filtered),JSON.stringify(['star','audio-lines']));
});

test('bundles remain registered without forcing HTML or SVG into notes',()=>{
 const main=read('main.js');
 const build=read('scripts/build-css.js');
 assert.match(main,/function writerV922OpenIconPicker/);
 assert.match(main,/node\.insertAdjacentElement\('afterend',shell\)/);
 assert.match(build,/v9-2-2-iconic-fixes\.css/);
 const icon=read('src/v9/native-explorer.js');
 assert.doesNotMatch(icon,/eval\(|new Function\(/);
});
