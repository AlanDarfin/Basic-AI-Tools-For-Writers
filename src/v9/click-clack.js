'use strict';
/* v9.1 desktop Click Clack integration inspired by Acylation/obsidian-click-clack.
 * Supports local WAV schemes compatible with the original pack manifests.
 * Generated fallback clicks require no bundled or downloaded audio assets. */
const WRITER_V91_KEYS=['key','key2','space','enter','delete'];
/* 13 opt-in sound packs from Acylation/obsidian-click-clack (MIT), tag 0.1.2.
 * Downloaded on request from a pinned source revision, never bundled. */
const WRITER_V91_CLICK_PACKS=[
 ['alps-style-switch','ALPS Style Switch'],
 ['cherry-mx-black','Cherry MX Black'],
 ['cherry-mx-blue','Cherry MX Blue'],
 ['cherry-mx-brown','Cherry MX Brown'],
 ['cherry-mx-red','Cherry MX Red'],
 ['click-keyboard','Click keyboard'],
 ['ibm-keyboard','IBM keyboard'],
 ['ibm-selectric','IBM Selectric'],
 ['old-typewriter','Old typewriter'],
 ['olympia-regina-de-luxe','Olympia Regina De Luxe'],
 ['quill','Quill'],
 ['subtle-clicks','Subtle clicks'],
 ['synapses','Synapses']
];
const WRITER_V91_CLICK_SOURCE='https://raw.githubusercontent.com/Acylation/obsidian-click-clack/6d5b7f0f953e251e7c164129b81d700b2ac8362d/resources/';
function writerV91ClickPackUrl(id,kind){
 if(!WRITER_V91_CLICK_PACKS.some(pack=>pack[0]===id)||!WRITER_V91_KEYS.includes(kind))return '';
 return WRITER_V91_CLICK_SOURCE+id+'/'+kind+'.wav';
}
function writerV91ClickValidWav(data){
 if(!(data instanceof ArrayBuffer)||data.byteLength<44||data.byteLength>4000000)return false;
 const bytes=new Uint8Array(data);
 const tag=(offset,value)=>[...value].every((character,i)=>bytes[offset+i]===character.charCodeAt(0));
 return tag(0,'RIFF')&&tag(8,'WAVE');
}
function writerV91ClickMerge(settings){
 const raw=settings.v91Click&&typeof settings.v91Click==='object'?settings.v91Click:{};
 const cfg=settings.v91Click={enabled:false,volume:35,scheme:'generated',...raw};
 cfg.enabled=cfg.enabled===true;cfg.volume=Math.max(0,Math.min(100,Math.round(Number(cfg.volume)||0)));
 cfg.scheme=String(cfg.scheme||'generated').slice(0,120);
 return cfg;
}
function writerV91ClickCategory(event){
 if(!event||event.ctrlKey||event.metaKey||event.altKey)return '';
 if(event.key===' '||event.code==='Space')return 'space';
 if(event.key==='Enter')return 'enter';
 if(event.key==='Backspace'||event.key==='Delete')return 'delete';
 if(event.key==='Tab')return 'key2';
 if(event.key?.length===1)return 'key';
 return '';
}
class WriterV91ClickClack{
 constructor(plugin){this.plugin=plugin;this.context=null;this.samples={};this.schemes=[];this.loading=false;this.downloading=false;this.activeScheme='generated';}
 get cfg(){return this.plugin.settings.v91Click;}
 get baseDirs(){
  const config=this.plugin.app.vault.configDir||'.obsidian';
  return [
   config+'/plugins/'+this.plugin.manifest.id+'/resources',
   config+'/plugins/click-clack/resources'
  ];
 }
 async listSchemes(){
  if(this.plugin.app.isMobile)return [];
  const adapter=this.plugin.app.vault.adapter,schemes=[];
  for(const base of this.baseDirs){
   if(!(await adapter.exists(base)))continue;
   const entries=await adapter.list(base);
   for(const folder of entries.folders||[]){
    const manifestPath=folder+'/manifest.json';
    if(!(await adapter.exists(manifestPath)))continue;
    try{
     const data=JSON.parse(await adapter.read(manifestPath));
     const files={};
     if(!WRITER_V91_KEYS.every(key=>{
      const filename=data[key];
      if(typeof filename!=='string'||! /^[a-zA-Z0-9_.-]+\.wav$/i.test(filename)||filename.includes('..'))return false;
      files[key]=folder+'/'+filename;return true;
     }))continue;
     schemes.push({id:folder,name:String(data.caption||data.id||folder.split('/').pop()).slice(0,90),files});
    }catch(error){console.warn('[Basic AI] Ignoring invalid Click Clack scheme:',error);}
   }
  }
  this.schemes=schemes;
  return schemes;
 }
 async load(){
  if(this.plugin.app.isMobile)return;
  const key=this.cfg.scheme;
  if(key==='generated'){this.samples={};this.activeScheme='generated';return;}
  if(this.loading)return;
  this.loading=true;
  try{
   if(!this.schemes.length)await this.listSchemes();
   const scheme=this.schemes.find(x=>x.id===key);
   if(!scheme){this.samples={};this.activeScheme='generated';return;}
   const ctx=this.getContext(),buffers={};
   const adapter=this.plugin.app.vault.adapter;
   if(!ctx)return;
   for(const kind of WRITER_V91_KEYS){
    const binary=await adapter.readBinary(scheme.files[kind]);
    buffers[kind]=await ctx.decodeAudioData(binary.slice(0));
   }
   this.samples=buffers;this.activeScheme=key;
  }catch(error){
   this.samples={};this.activeScheme='generated';console.warn('[Basic AI] Click Clack sound pack:',error);
   new Notice(writerUi('Falha ao carregar o pacote de sons; usando clique gerado.','Could not load sound scheme; using generated clicks.'));
  }finally{this.loading=false;}
 }
 get resourceDir(){return this.baseDirs[0];}
 async downloadPack(id,{activate=true,quiet=false}={}){
  const pack=WRITER_V91_CLICK_PACKS.find(entry=>entry[0]===id);
  if(this.plugin.app.isMobile||!pack||this.downloading)return false;
  const adapter=this.plugin.app.vault.adapter,base=this.resourceDir,folder=base+'/'+id;
  this.downloading=true;let created=false;
  try{
   if(await adapter.exists(folder)){
    if(await adapter.exists(folder+'/manifest.json')){
     await this.listSchemes();if(activate)await this.selectPack(folder);
     return true;
    }
    throw new Error('Sound pack folder exists but is incomplete: '+folder);
   }
   // Fetch all 5 WAVs before any filesystem writes. Manifest is saved last.
   const audio={};
   for(const key of WRITER_V91_KEYS){
    const response=await requestUrl({url:writerV91ClickPackUrl(id,key),throw:false});
    if(response.status!==200||!writerV91ClickValidWav(response.arrayBuffer))
     throw new Error('Missing or invalid WAV: '+id+'/'+key+'.wav');
    audio[key]=response.arrayBuffer;
   }
   if(!(await adapter.exists(base)))await adapter.mkdir(base);
   await adapter.mkdir(folder);created=true;
   for(const key of WRITER_V91_KEYS)await adapter.writeBinary(folder+'/'+key+'.wav',audio[key]);
   const manifest={id,caption:pack[1]};
   for(const key of WRITER_V91_KEYS)manifest[key]=key+'.wav';
   await adapter.write(folder+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
   await this.listSchemes();
   if(activate)await this.selectPack(folder);
   if(!quiet)new Notice(writerUi('Pacote instalado: ','Sound pack installed: ')+pack[1]);
   return true;
  }catch(error){
   console.warn('[Basic AI] Click Clack download:',error);
   if(created)try{await adapter.rmdir(folder,true);}catch(cleanupError){console.warn('[Basic AI] Click Clack cleanup:',cleanupError);}
   if(!quiet)new Notice(writerUi('Falha ao baixar o pacote: ','Could not download pack: ')+pack[1]);
   return false;
  }finally{this.downloading=false;}
 }
 async selectPack(id){
  this.cfg.scheme=id;
  await this.plugin.saveSettings();await this.load();
  this.plugin.writerSettingsTab?.display();
 }
 openPackManager(){
  if(this.plugin.app.isMobile)return;
  const modal=new Modal(this.plugin.app);
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Pacotes de sons de digitação','Typing sound packs'));
   const root=modal.contentEl;root.empty();
   root.createEl('p',{cls:'dictionary-muted',text:writerUi(
    '13 pacotes de sons opcionais. Os arquivos são baixados do GitHub apenas com sua autorização e funcionam offline depois.',
    '13 optional typing sound packs. Files download from GitHub only on request and work offline afterward.'
   )});
   const status=root.createEl('p',{cls:'dictionary-muted',attr:{role:'status','aria-live':'polite'}});
   const actions=root.createDiv({cls:'writer-v91-click-actions'});
   const list=root.createDiv({cls:'writer-v91-click-catalog'});
   const installAll=actions.createEl('button',{text:writerUi('Baixar todos','Download all'),attr:{type:'button'}});
   const render=()=>{
    list.empty();
    for(const [id,name] of WRITER_V91_CLICK_PACKS){
     const installed=this.schemes.find(s=>s.id===this.resourceDir+'/'+id)||
      this.schemes.find(s=>s.id===this.baseDirs[1]+'/'+id);
     new Setting(list).setName(name).setDesc(installed?
      writerUi('Instalado','Installed'):writerUi('Disponível para download','Available for download'))
      .addButton(button=>button.setButtonText(installed?writerUi('Usar','Use'):writerUi('Baixar','Download'))
       .setDisabled(this.downloading).onClick(async()=>{
        if(this.downloading)return;
        if(installed){await this.selectPack(installed.id);modal.close();return;}
        status.setText(writerUi('Baixando: ','Downloading: ')+name);
        const ok=await this.downloadPack(id);
        status.setText(ok?writerUi('Pacote instalado.','Pack installed.'):writerUi('Falha no download.','Download failed.'));
        render();
       }));
    }
   };
   installAll.addEventListener('click',async()=>{
    if(this.downloading)return;
    installAll.disabled=true;
    try{
     let completed=0,failed=0;
     for(const [id,name] of WRITER_V91_CLICK_PACKS){
      if(this.schemes.some(s=>s.id===this.resourceDir+'/'+id||s.id===this.baseDirs[1]+'/'+id))continue;
      status.setText(writerUi('Baixando: ','Downloading: ')+name);
      if(await this.downloadPack(id,{activate:false,quiet:true}))completed++;else failed++;
     }
     status.setText(writerUi('Pacotes baixados: ','Downloaded: ')+completed+
      (failed?' · '+writerUi('falhas: ','failures: ')+failed:''));
     this.plugin.writerSettingsTab?.display();
    }finally{installAll.disabled=false;render();}
   });
   render();
  };
  modal.open();
 }
 getContext(){
  if(!this.context){
   const Context=window.AudioContext||window.webkitAudioContext;
   if(Context)this.context=new Context();
  }
  return this.context;
 }
 play(kind){
  if(this.plugin.app.isMobile||!writerModuleOn(this.plugin,'typewriter')||!this.cfg.enabled)return;
  const ctx=this.getContext();if(!ctx)return;
  if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
  const volume=Math.min(.7,this.cfg.volume/100*.38);
  if(!volume)return;
  const preset=this.samples[kind]||this.samples.key;
  if(preset){
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=preset;source.playbackRate.value=.97+Math.random()*.06;
   gain.gain.value=volume;source.connect(gain);gain.connect(ctx.destination);
   source.start();return;
  }
  // Self-contained short mechanical/transient fallback; no downloadable files.
  const now=ctx.currentTime;
  const length=kind==='enter'?.095:kind==='space'?.065:.04;
  const sample=ctx.createBuffer(1,Math.max(1,Math.round(ctx.sampleRate*length)),ctx.sampleRate);
  const data=sample.getChannelData(0);
  const freq=kind==='delete'?910:kind==='enter'?610:kind==='space'?380:760;
  let previous=0;
  for(let i=0;i<data.length;i++){
   const t=i/ctx.sampleRate,env=Math.exp(-t*(kind==='enter'?54:85));
   previous=previous*.62+(Math.random()*2-1)*.38;
   data[i]=(previous*.8+Math.sin(2*Math.PI*freq*t)*.2)*env;
  }
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=sample;gain.gain.value=volume;
  source.connect(gain);gain.connect(ctx.destination);source.start(now);
 }
 init(){
  if(this.plugin.app.isMobile)return;
  void this.listSchemes().then(()=>this.load()).catch(error=>console.warn('[Basic AI] Click Clack:',error));
  this.plugin.registerDomEvent?.(this.plugin.app.workspace.containerEl,'keydown',event=>{
   if(!this.cfg.enabled||!event.target?.closest?.('.cm-editor'))return;
   const kind=writerV91ClickCategory(event);if(!kind)return;
   this.play(kind==='key'&&Math.random()>.75?'key2':kind);
  });
  this.plugin.addCommand({id:'v91-click-clack-toggle',name:writerUi('Máquina de escrever: alternar sons','Typewriter: toggle typing sounds'),callback:async()=>{
   this.cfg.enabled=!this.cfg.enabled;await this.plugin.saveSettings();
   new Notice(this.cfg.enabled?writerUi('Som de teclado ativado.','Typing sounds enabled.'):writerUi('Som de teclado desativado.','Typing sounds disabled.'));
  }});
  this.plugin.register?.(()=>{this.samples={};if(this.context){void this.context.close().catch(()=>{});this.context=null;}});
 }
}
function writerV91ClickSettings(plugin,panel){
 panel.createEl('h3',{text:writerUi('Sons da máquina de escrever','Typewriter key sounds')});
 if(plugin.app.isMobile){
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Os sons de teclado só estão disponíveis no computador.','Keyboard sounds are only available on desktop.')});
  return;
 }
 const cfg=plugin.settings.v91Click;
 new Setting(panel).setName(writerUi('Ativar sons de digitação','Enable typing sounds'))
  .setDesc(writerUi('Sons somente ao digitar no editor Markdown.','Sounds only while typing in the Markdown editor.'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Volume dos sons','Sound volume'))
  .addSlider(s=>s.setLimits(0,100,5).setDynamicTooltip().setValue(cfg.volume)
   .onChange(async v=>{cfg.volume=v;await plugin.saveSettings();}));
 const choices=plugin.writerV91Click?.schemes||[];
 new Setting(panel).setName(writerUi('Esquema sonoro','Sound scheme'))
  .setDesc(writerUi('Compatível com os arquivos WAV e manifestos dos pacotes Click Clack.','Supports Click Clack WAV packs and manifest files.'))
  .addDropdown(drop=>{
   drop.addOption('generated',writerUi('Cliques integrados','Built-in clicks'));
   for(const scheme of choices)drop.addOption(scheme.id,scheme.name);
   drop.setValue(choices.some(x=>x.id===cfg.scheme)?cfg.scheme:'generated');
   drop.onChange(async v=>{cfg.scheme=v;await plugin.saveSettings();await plugin.writerV91Click.load();});
  });
 new Setting(panel).setName(writerUi('Baixar pacotes de sons','Download sound packs'))
  .setDesc(writerUi('Escolha entre os 13 pacotes originais ou instale todos. Download sob demanda.',
   'Choose from 13 original packs or install all. On-demand downloads.'))
  .addButton(b=>b.setButtonText(writerUi('Ver pacotes','Browse packs')).setCta()
   .onClick(()=>plugin.writerV91Click.openPackManager()));
 new Setting(panel).setName(writerUi('Recarregar pacotes locais','Rescan local sound packs'))
  .addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(async()=>{
   await plugin.writerV91Click.listSchemes();plugin.writerSettingsTab?.display();
  }));
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Pacotes ficam na pasta resources deste plugin ou na instalação do Click Clack. Nada é baixado automaticamente.',
  'Packs live in this plugin’s resources folder or a Click Clack installation. Nothing downloads automatically.'
 )});
}
function writerV91RegisterClick(plugin){
 if(plugin.app.isMobile)return;
 plugin.writerV91Click=new WriterV91ClickClack(plugin);plugin.writerV91Click.init();
}
