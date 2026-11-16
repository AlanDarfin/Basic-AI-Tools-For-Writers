'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/v13/visual-kit.js','utf8');
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
 const defaults=fs.readFileSync('vendor/visual-kit/src/settings.ts','utf8');
 assert.match(defaults,/htmlRegisterExtensions: false/);
 assert.match(defaults,/htmlExternalImages: "block"/);
 assert.match(defaults,/copyMode: "dedicated"/);
 const paste=fs.readFileSync('vendor/visual-kit/src/paste/HtmlImagePaste.ts','utf8');
 assert.ok(paste.indexOf('if (!allowRemote)')<paste.indexOf('await requestUrl('));
 const preview=fs.readFileSync('vendor/visual-kit/src/html-notes/FullPreview.ts','utf8');
 assert.match(preview,/script-src 'none'/);assert.match(preview,/sandbox: ""/);
});

test('compiled Visual Kit registers commands, vault events, and a separate HTML view on a desktop host',()=>{
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
 const instance=new Kit({app,manifest:{id:'basic-ai-tool-for-writers'}},(pt,en)=>en,()=>undefined,()=>{throw Error('No writes on load');},()=>true);
 instance.onload();
 assert.equal(calls.commands.length,9);
 assert.ok(calls.commands.includes('visual-kit-create-html-note'));
 assert.ok(calls.commands.includes('visual-kit-rebuild-image-duplicate-index'));
 assert.deepEqual(calls.views,['basic-visual-kit-html-note']);
 assert.deepEqual(calls.extensions,[]);
 assert.ok(calls.events.includes('workspace:editor-paste')&&calls.events.includes('vault:rename'));
 instance.onunload();
 assert.deepEqual(calls.removed,['basic-visual-kit-html-note']);
});
