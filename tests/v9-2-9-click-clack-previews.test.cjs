'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const click=fs.readFileSync('src/v9/click-clack.js','utf8');
const preview=fs.readFileSync('src/v9/explorer-favorites-preview.js','utf8');
const css=fs.readFileSync('src/styles/v9-2-2-iconic-fixes.css','utf8');
const createWav=()=>{
 const buffer=new ArrayBuffer(44),bytes=new Uint8Array(buffer);
 for(const [offset,label] of [[0,'RIFF'],[8,'WAVE']])
  for(let i=0;i<label.length;i++)bytes[offset+i]=label.charCodeAt(i);
 return buffer;
};
function loadClick(request){
 const sandbox={console,ArrayBuffer,Uint8Array,writerUi:(_pt,en)=>en,
  Notice:class{},requestUrl:request,Modal:class{},Setting:class{}};
 return vm.runInNewContext(click+'\n({WRITER_V91_CLICK_PACKS,WRITER_V91_KEYS,writerV91ClickPackUrl,writerV91ClickValidWav,WriterV91ClickClack})',sandbox);
}
function runtime(request){
 const library=new Map(),requests=[];
 const module=loadClick(async arg=>{requests.push(arg.url);return request(arg);});
 const adapter={
  async exists(p){return library.has(p);},
  async mkdir(p){library.set(p,{directory:true});},
  async list(p){return {folders:[...library].filter(([name,value])=>value.directory&&
   name.startsWith(p+'/')&&!name.slice(p.length+1).includes('/')).map(([name])=>name)};},
  async read(p){return library.get(p);},
  async write(p,v){library.set(p,v);},
  async writeBinary(p,v){library.set(p,v);},
  async rmdir(p){for(const key of [...library.keys()])if(key===p||key.startsWith(p+'/'))library.delete(key);}
 };
 const plugin={app:{isMobile:false,vault:{configDir:'.obsidian',adapter}},
  manifest:{id:'basic-ai-tool-for-writers'},
  settings:{v91Click:{enabled:false,volume:35,scheme:'generated'}},
  async saveSettings(){},writerSettingsTab:{display(){}}};
 const player=new module.WriterV91ClickClack(plugin);
 return {player,plugin,library,adapter,requests,module};
}
test('all 13 original packs use pinned, safe download destinations',()=>{
 const {module}=runtime(async()=>({status:200,arrayBuffer:createWav()}));
 assert.equal(module.WRITER_V91_CLICK_PACKS.length,13);
 for(const [id] of module.WRITER_V91_CLICK_PACKS)
  for(const key of module.WRITER_V91_KEYS)
   assert.match(module.writerV91ClickPackUrl(id,key),
    /^https:\/\/raw\.githubusercontent\.com\/Acylation\/obsidian-click-clack\/[a-f0-9]{40}\/resources\//);
 assert.equal(module.writerV91ClickPackUrl('../bad','key'),'');
 assert.equal(module.writerV91ClickPackUrl('quill','../bad'),'');
 assert.equal(module.writerV91ClickValidWav(createWav()),true);
 assert.equal(module.writerV91ClickValidWav(new ArrayBuffer(5)),false);
});
test('user-triggered download writes five WAV files and the manifest last',async()=>{
 const {player,adapter,requests}=runtime(async()=>({status:200,arrayBuffer:createWav()}));
 assert.equal(requests.length,0,'no automatic network access');
 assert.equal(await player.downloadPack('quill',{activate:false}),true);
 assert.equal(requests.length,5);
 const folder=player.resourceDir+'/quill';
 for(const key of ['key','key2','space','enter','delete'])
  assert.equal(await adapter.exists(folder+'/'+key+'.wav'),true);
 const manifest=JSON.parse(await adapter.read(folder+'/manifest.json'));
 assert.equal(manifest.caption,'Quill');
 assert.equal(player.schemes.length,1);
 assert.equal(await player.downloadPack('quill',{activate:false}),true);
 assert.equal(requests.length,5,'installed pack should not download again');
});
test('invalid WAV never leaves a partial pack',async()=>{
 const {player,adapter}=runtime(async()=>({status:200,arrayBuffer:new ArrayBuffer(5)}));
 assert.equal(await player.downloadPack('quill',{activate:false,quiet:true}),false);
 assert.equal(await adapter.exists(player.resourceDir+'/quill'),false);
});
test('folder YAML preview can restore its full text while the collapsed value remains short',()=>{
 class TFile{};class TFolder{};
 const note=new TFile(),folder=new TFolder();
 const sentence='Very long folder note description. '.repeat(50);
 const api=vm.runInNewContext(preview+'\n({writerV92PreviewValue,writerV929PreviewExpand})',
  {console,TFile,TFolder,writerV7FolderNote:()=>note,writerUi:(_pt,en)=>en,Set,Map});
 const plugin={settings:{v92Explorer:{previewMode:'folder',folderDescriptionKey:'description',previewMax:40}},
  app:{metadataCache:{getFileCache:()=>({frontmatter:{description:sentence}})}}};
 assert.equal(api.writerV92PreviewValue(plugin,folder).length,40);
 assert.ok(api.writerV92PreviewValue(plugin,folder,true).length>40);
 const listeners={},classes=new Set(),attributes={},timers=[];
 const label={textContent:'',scrollHeight:28,clientHeight:28,removeAttribute(){}};
 const shell={
  dataset:{},isConnected:true,
  querySelector:()=>label,
  setAttribute:(name,value)=>{attributes[name]=value;},
  removeAttribute:name=>{delete attributes[name];},
  classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:(...ids)=>ids.forEach(x=>classes.delete(x)),
   toggle:(c,on)=>on?classes.add(c):classes.delete(c)},
  addEventListener:(name,fn)=>{listeners[name]=fn;}
 };
 // Fake timers let us test the exact 1500ms threshold without waiting.
 const fake=vm.runInNewContext(preview+'\nwriterV929PreviewExpand',{
  console,TFile,TFolder,writerUi:(_pt,en)=>en,
  setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},
  clearTimeout:()=>{}
 });
 fake(shell,'Short description',sentence);
 assert.equal(label.textContent,'Short description');
 listeners.mouseenter();
 assert.equal(timers[0].delay,1500);
 assert.equal(label.textContent,'Short description');
 timers[0].fn();
 assert.equal(label.textContent,sentence);
 assert.equal(attributes['aria-expanded'],'true');
 listeners.mouseleave();
 assert.equal(label.textContent,'Short description');
 assert.equal(attributes['aria-expanded'],'false');
 listeners.focus();
 assert.equal(label.textContent,sentence);
});
test('no pointer-events block; style, bundle and version are synchronized',()=>{
 assert.match(css,/pointer-events:auto/);
 assert.match(css,/\.writer-v92-preview-shell\.is-expanded \.writer-v92-file-preview/);
 const m=JSON.parse(fs.readFileSync('manifest.json','utf8'));
 const p=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.match(m.version,/^(?:9|10)\.[0-9]+\.[0-9]+$/);assert.equal(p.version,m.version);
 assert.match(p.scripts['test:sequential']||p.scripts.test,/v9-2-9-click-clack-previews/);
 const main=fs.readFileSync('main.js','utf8');
 assert.ok(main.includes('writerV91ClickPackUrl'));
 assert.ok(main.includes('writerV929PreviewExpand'));
 for(const file of ['README.md','docs/README.pt-BR.md'])
  assert.ok(fs.readFileSync(file,'utf8').includes(m.version));
});
