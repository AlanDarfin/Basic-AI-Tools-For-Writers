'use strict';
/* v9.1 desktop Click Clack integration inspired by Acylation/obsidian-click-clack.
 * Supports local WAV schemes compatible with the original pack manifests.
 * Generated fallback clicks require no bundled or downloaded audio assets. */
const WRITER_V91_KEYS=['key','key2','space','enter','delete'];
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
 constructor(plugin){this.plugin=plugin;this.context=null;this.samples={};this.schemes=[];this.loading=false;this.activeScheme='generated';}
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
  this.plugin.registerDomEvent(this.plugin.app.workspace.containerEl,'keydown',event=>{
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
 new Setting(panel).setName(writerUi('Recarregar pacotes locais','Rescan local sound packs'))
  .addButton(b=>b.setButtonText(writerUi('Atualizar','Refresh')).onClick(async()=>{
   await plugin.writerV91Click.listSchemes();plugin.writerSettingsTab?.display();
  }));
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Pacotes podem ficar na pasta resources deste plugin ou na instalação local do Click Clack. Nenhum áudio externo é baixado automaticamente.',
  'Sound packs can live in this plugin’s resources folder or in a local Click Clack installation. No third-party sound files are downloaded automatically.'
 )});
}
function writerV91RegisterClick(plugin){
 if(plugin.app.isMobile)return;
 plugin.writerV91Click=new WriterV91ClickClack(plugin);plugin.writerV91Click.init();
}
