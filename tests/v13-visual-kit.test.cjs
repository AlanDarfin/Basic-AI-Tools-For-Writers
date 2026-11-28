'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/integrations/visual-kit.js','utf8');
function runtime({mobile=false,external=false,enabled=true}={}){
 const children=[],disposals=[],saved=[];
 let constructed=0;
 class VisualKit{constructor(...args){constructed++;this.args=args;}}
 const platform={isDesktopApp:!mobile,isMobile:mobile};
 const context={console,require:name=>{assert.equal(name,'obsidian');return {Platform:platform};},
  writerUi:(pt,en)=>en,writerVisualKitBuild:()=>VisualKit};
 const register=vm.runInNewContext(source+'\nwriterVisualKitRegister',context);
 const plugin={app:{isMobile:mobile,plugins:{enabledPlugins:new Set(external?['visual-kit']:[])}},
  settings:{visualKitEnabled:enabled,visualKitState:{settings:{width:480}},keep:true},
  addChild:component=>children.push(component),register:disposal=>disposals.push(disposal),
  saveSettings:async()=>saved.push(plugin.settings.visualKitState)};
 return {plugin,register,children,disposals,saved,count:()=>constructed};
}
test('Basic owns the bundled lifecycle and keeps the settings isolated',async()=>{
 const h=runtime();h.register(h.plugin);h.register(h.plugin);
 assert.equal(h.count(),1);
 const [host,translate,read,write,owns]=h.children[0].args;
 assert.equal(host,h.plugin);assert.equal(translate('pt','en'),'en');assert.equal(read().settings.width,480);
 assert.equal(owns(),true);h.plugin.app.plugins.enabledPlugins.add('visual-kit');assert.equal(owns(),false);
 await write({settings:{width:640},index:[]});assert.equal(h.saved[0].settings.width,640);
 assert.equal(h.plugin.settings.keep,true);h.disposals[0]();assert.equal(h.plugin._writerVisualKit,null);
});
test('mobile, explicit opt-out, and an enabled upstream plugin never initialize the desktop bundle',()=>{
 for(const options of [{mobile:true},{external:true},{enabled:false}]){
  const h=runtime(options);h.register(h.plugin);assert.equal(h.count(),0);
 }
});
test('packaged desktop code remains lazy; HTML extensions and network lookups are opt-in',()=>{
 const bundle=fs.readFileSync('main.js','utf8');
 assert.match(bundle,/function writerVisualKitBuild\(\)\{/);
 assert.match(bundle,/basic-visual-kit-html-note/);
 const paste=fs.readFileSync('vendor/visual-kit/src/paste/HtmlImagePaste.ts','utf8');
 assert.ok(paste.indexOf('if (!allowRemote)')<paste.indexOf('await requestUrl('));
 const preview=fs.readFileSync('vendor/visual-kit/src/html-notes/FullPreview.ts','utf8');
 assert.match(preview,/script-src 'none'/);assert.match(preview,/sandbox: ""/);
});

test('rich Markdown paste removes live resource attributes before sanitizing the surrounding markup',async t=>{
 const {JSDOM}=require('../vendor/visual-kit/node_modules/jsdom');
 const {buildSync}=require('../vendor/visual-kit/node_modules/esbuild');
 const dom=new JSDOM('');
 t.after(()=>dom.window.close());
 const document=dom.window.document;
 const requests=[];
 const obsidian={
  sanitizeHTMLToDom(html){
   assert.doesNotMatch(html,/<(?:img|source|iframe|script|style)\b|\b(?:src|srcset|poster|background)=/i);
   const template=document.createElement('template');template.innerHTML=html;
   template.content.querySelector('p').removeAttribute('onclick');
   return template.content;
  },
  htmlToMarkdown(fragment){
   assert.equal(fragment.querySelector('p').getAttribute('onclick'),null);
   assert.equal(fragment.querySelector('strong').textContent,'Antes');
   assert.equal(fragment.querySelector('a').getAttribute('href'),'https://example.test/note');
   return fragment.textContent;
  },
  async requestUrl({url}){requests.push(url);return {status:200,arrayBuffer:Uint8Array.of(1,2,3).buffer};}
 };
 const module={exports:{}};
 const {outputFiles}=buildSync({entryPoints:['vendor/visual-kit/src/paste/HtmlImagePaste.ts'],
  bundle:true,external:['obsidian'],platform:'browser',format:'cjs',write:false});
 vm.runInNewContext(outputFiles[0].text,{module,require:name=>{assert.equal(name,'obsidian');return obsidian;},
  document,crypto:require('node:crypto').webcrypto,File,URL});
 const {htmlImagePaste}=module.exports;
 const url='https://example.test/image.png';
 const html=`<p onclick="return false"><strong>Antes</strong><a href="https://example.test/note">Nota</a>`+
  `<picture><source srcset="${url}"><img src="${url}" alt="Amostra"></picture></p>`+
  `<iframe src="${url}"></iframe><div background="${url}"></div>`;
 const blocked=htmlImagePaste(html,[]);
 assert.equal(blocked.images.length,1);
 assert.equal(blocked.images[0].name,'Amostra');
 assert.equal(blocked.render(['![[Amostra.png]]']),'AntesNota![[Amostra.png]]');
 await assert.rejects(blocked.images[0].load(),/Remote images are blocked/);
 assert.deepEqual(requests,[]);

 const allowed=htmlImagePaste(html,[],true);
 assert.equal(requests.length,0,'Parsing never downloads an image');
 const image=await allowed.images[0].load();
 assert.equal(image.name,'Amostra');
 assert.deepEqual(requests,[url]);
});

test('rich HTML copy uses local images and leaves the clipboard unchanged for a linked image',async t=>{
 const {JSDOM}=require('../vendor/visual-kit/node_modules/jsdom');
 const {buildSync}=require('../vendor/visual-kit/node_modules/esbuild');
 const dom=new JSDOM('');
 t.after(()=>dom.window.close());
 const document=dom.window.document;
 const written=[],requests=[];
 class TFile{constructor(path){this.path=path;this.name=path;}}
 const bytes=Uint8Array.of(137,80,78,71).buffer;
 const imports={
  obsidian:{TFile,requestUrl:async({url})=>{requests.push(url);return {status:200,arrayBuffer:bytes};}},
  electron:{clipboard:{write:value=>written.push(value)},nativeImage:{createFromDataURL:()=>({isEmpty:()=>true})}}
 };
 const file=new TFile('local.png');
 const note=new TFile('Note.html');
 const plugin={settings:{htmlExternalImages:'download',htmlClipboardCompatibility:false},
  app:{vault:{getAbstractFileByPath:path=>path===file.path?file:null,readBinary:async()=>bytes}}};
 const module={exports:{}};
 const {outputFiles}=buildSync({entryPoints:['vendor/visual-kit/src/html-notes/Clipboard.ts'],
  bundle:true,external:['obsidian','electron'],platform:'browser',format:'cjs',write:false});
 vm.runInNewContext(outputFiles[0].text,{module,require:name=>imports[name],
  document,window:dom.window,createEl:tag=>document.createElement(tag),File,URL,TextDecoder,Blob,btoa,atob,
  createImageBitmap:async()=>({width:1,height:1,close(){}})});
 const {copyHtml}=module.exports;

 await copyHtml(plugin,note,'<p><strong>Texto local</strong></p><img src="local.png" alt="Local">');
 assert.equal(written.length,1);
 assert.match(written[0].html,/<strong>Texto local<\/strong>/);
 assert.match(written[0].html,/src="data:image\/png;base64,/);
 assert.match(written[0].text,/Texto local/);
 await assert.rejects(copyHtml(plugin,note,'<p>Outro texto</p><img src="https://example.test/image.png" alt="Remota">'),
  /Import the linked image into the vault before copying.*Clipboard unchanged/);
 assert.equal(written.length,1);
 assert.deepEqual(requests,[]);
});

test('compiled Visual Kit registers commands and keeps remote image downloads opt-in',async()=>{
 const source=fs.readFileSync('main.js','utf8').split('function writerVisualKitBuild(){')[1].split('// END WRITER V3 MODULES')[0];
 const noop=class {};
 const calls={commands:[],views:[],extensions:[],events:[],removed:[]};
 const obsidian={Modal:noop,PluginSettingTab:noop,FileView:noop,Plugin:class{
  constructor(app,manifest){this.app=app;this.manifest=manifest;}
  addCommand(command){calls.commands.push(command.id);}
  registerView(type){calls.views.push(type);}
  registerExtensions(extension){calls.extensions.push(extension);}
  registerEvent(ref){calls.events.push(ref);}
  register(){} registerDomEvent(){} registerInterval(){}
 }};
 const app={workspace:{
  on:name=>'workspace:'+name,onLayoutReady:()=>{},detachLeavesOfType:type=>calls.removed.push(type),
 },vault:{on:name=>'vault:'+name}};
 const context={require:name=>name==='obsidian'?obsidian:{},document:{documentElement:{style:{}}},
  window:{setInterval:()=>1},navigator:{userAgent:'',vendor:'',platform:''}};
 const Kit=vm.runInNewContext('function writerVisualKitBuild(){'+source+'\nwriterVisualKitBuild();',context);
 const writes=[];
 const create=state=>new Kit({app,manifest:{id:'basic-ai-tool-for-writers'}},(pt,en)=>en,()=>state,
  async next=>writes.push(next),()=>true);
 const instance=create(undefined);
 instance.onload();
 assert.equal(instance.settings.htmlRegisterExtensions,false);
 assert.equal(instance.settings.htmlExternalImages,'block');
 assert.equal(instance.settings.copyMode,'dedicated');
 assert.equal(calls.commands.length,9);
 assert.ok(calls.commands.includes('visual-kit-create-html-note'));
 assert.ok(calls.commands.includes('visual-kit-rebuild-image-duplicate-index'));
 assert.deepEqual(calls.views,['basic-visual-kit-html-note']);
 assert.deepEqual(calls.extensions,[]);
 assert.ok(calls.events.includes('workspace:editor-paste')&&calls.events.includes('vault:rename'));
 instance.onunload();
 assert.deepEqual(calls.removed,['basic-visual-kit-html-note']);
 assert.equal(writes.length,0,'loading by itself does not persist settings');

 const preview=create({settings:{htmlExternalImages:'download',width:720}});
 preview.onload();
 assert.equal(preview.settings.htmlExternalImages,'block','ignore the default persisted by early previews');
 assert.equal(preview.settings.width,720);
 preview.settings.htmlExternalImages='download';
 await preview.persist();
 assert.equal(writes[0].remoteImagesOptIn,true);
 preview.onunload();

 const consented=create(writes[0]);
 consented.onload();
 assert.equal(consented.settings.htmlExternalImages,'download');
 consented.onunload();
});
