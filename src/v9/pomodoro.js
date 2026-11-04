'use strict';
/* 9.3.1: original local-first Pomodoro inspired by eatgrass/obsidian-pomodoro-timer.
 * No timers are started automatically when enabling this module. */
const WRITER_V931_POMODORO_VIEW='writer-pomodoro-timer';
const WRITER_V931_POMODORO_MODES=['focus','short','long'];
function writerV931PomodoroDuration(cfg,mode){
 const key=mode==='short'?'shortMinutes':mode==='long'?'longMinutes':'focusMinutes';
 return Math.round((Number(cfg[key])||0)*60);
}
function writerV931PomodoroClock(seconds){
 const secs=Math.max(0,Math.ceil(Number(seconds)||0));
 return String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
}
function writerV931PomodoroToday(now=new Date()){
 return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
function writerV931PomodoroMerge(settings){
 const raw=settings.v931Pomodoro&&typeof settings.v931Pomodoro==='object'&&!Array.isArray(settings.v931Pomodoro)?settings.v931Pomodoro:{};
 const cfg=settings.v931Pomodoro={enabled:true,sidebar:true,statusBar:true,focusMinutes:25,shortMinutes:5,longMinutes:15,
  longEvery:4,autoAdvance:false,notify:true,sound:false,logDaily:false,dailyFolder:'',
  task:'',mode:'focus',remaining:1500,running:false,endsAt:0,completed:0,today:'',
  todayCompleted:0,...raw};
 for(const key of ['enabled','sidebar','statusBar','notify'])cfg[key]=cfg[key]!==false;
 for(const key of ['autoAdvance','sound','logDaily'])cfg[key]=cfg[key]===true;
 for(const key of ['focusMinutes','shortMinutes','longMinutes']){
  const limit=key==='focusMinutes'?180:60;
  const fallback=key==='focusMinutes'?25:key==='shortMinutes'?5:15;
  const requested=Number(cfg[key]);
  cfg[key]=Math.max(1,Math.min(limit,Math.round(Number.isFinite(requested)&&requested>0?requested:fallback)));
 }
 cfg.longEvery=Math.max(1,Math.min(12,Math.round(Number(cfg.longEvery)||4)));
 cfg.mode=WRITER_V931_POMODORO_MODES.includes(cfg.mode)?cfg.mode:'focus';
 cfg.endsAt=Number.isFinite(Number(cfg.endsAt))?Math.max(0,Number(cfg.endsAt)):0;
 cfg.completed=Math.max(0,Math.floor(Number(cfg.completed)||0));
 cfg.todayCompleted=Math.max(0,Math.floor(Number(cfg.todayCompleted)||0));
 cfg.task=String(cfg.task||'').slice(0,180);
 cfg.dailyFolder=String(cfg.dailyFolder||'').trim().replace(/^\/+|\/+$/g,'').slice(0,250);
 if(cfg.dailyFolder.split('/').some(part=>part==='..'||part==='.')||/[:\\\u0000-\u001f]/.test(cfg.dailyFolder))cfg.dailyFolder='';
 cfg.remaining=Math.max(0,Math.min(10800,Math.round(Number(cfg.remaining)||0)));
 if(!cfg.running||!cfg.endsAt){cfg.running=false;cfg.endsAt=0;
  if(cfg.remaining<=0)cfg.remaining=writerV931PomodoroDuration(cfg,cfg.mode);
 }
 cfg.today=typeof cfg.today==='string'?cfg.today:'';
 return cfg;
}
function writerV931PomodoroRemaining(cfg,now=Date.now()){
 return cfg.running?Math.max(0,Math.ceil((cfg.endsAt-now)/1000)):cfg.remaining;
}
class WriterV931PomodoroView extends require('obsidian').ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;}
 getViewType(){return WRITER_V931_POMODORO_VIEW;}
 getDisplayText(){return writerUi('Pomodoro · Foco','Pomodoro · Focus');}
 getIcon(){return 'timer';}
 async onOpen(){this.plugin.writerV931Pomodoro?.views.add(this);this.render();}
 async onClose(){this.plugin.writerV931Pomodoro?.forgetView(this);}
 render(){
  const root=this.contentEl;
  root.empty();root.addClass('writer-v931-pomodoro');
  const plugin=this.plugin,timer=plugin.writerV931Pomodoro,cfg=plugin.settings.v931Pomodoro;
  root.createEl('h3',{text:writerUi('Pomodoro · Foco','Pomodoro · Focus')});
  if(!cfg.enabled){
   root.createEl('p',{text:writerUi('Ative o Pomodoro nas configurações do Basic.','Enable Pomodoro in Basic settings.')});
   return;
  }
  const modes=root.createDiv({cls:'writer-v931-pomodoro-modes'});
  for(const [mode,pt,en] of [['focus','Foco','Focus'],['short','Pausa curta','Short break'],['long','Pausa longa','Long break']]){
   const button=modes.createEl('button',{text:writerUi(pt,en),attr:{type:'button'}});
   button.classList.toggle('is-active',cfg.mode===mode);
   button.addEventListener('click',()=>void timer.setMode(mode));
  }
  this.clock=root.createDiv({cls:'writer-v931-pomodoro-clock'});
  this.phase=root.createDiv({cls:'writer-v931-pomodoro-phase'});
  this.progress=root.createEl('progress',{cls:'writer-v931-pomodoro-progress',attr:{max:'100'}});
  const controls=root.createDiv({cls:'writer-v931-pomodoro-controls'});
  const mk=(pt,en,icon,handler)=>{
   const button=controls.createEl('button',{cls:'writer-v931-pomodoro-control',attr:{type:'button','aria-label':writerUi(pt,en)}});
   const glyph=button.createSpan({cls:'writer-v931-pomodoro-control-icon'});
   require('obsidian').setIcon(glyph,icon);
   const text=button.createSpan({text:writerUi(pt,en)});
   button.addEventListener('click',()=>void handler());
   return {button,text,glyph};
  };
  this.play=mk('Iniciar','Start','play',()=>timer.toggle());
  mk('Reiniciar','Reset','rotate-ccw',()=>timer.reset());
  mk('Pular','Skip','skip-forward',()=>timer.skip());
  const task=root.createDiv({cls:'writer-v931-pomodoro-task'});
  task.createEl('label',{text:writerUi('Tarefa em foco (opcional)','Current task (optional)')});
  const input=task.createEl('input',{attr:{type:'text',maxlength:'180',
   placeholder:writerUi('O que pretende escrever?','What are you writing?')}});
  input.value=cfg.task;
  input.addEventListener('change',()=>void timer.setTask(input.value));
  this.count=root.createDiv({cls:'writer-v931-pomodoro-count'});
  this.update();
 }
 update(){
  const cfg=this.plugin.settings.v931Pomodoro;
  if(!this.clock||!cfg.enabled)return;
  const remaining=writerV931PomodoroRemaining(cfg);
  const names={focus:writerUi('Foco','Focus'),short:writerUi('Pausa curta','Short break'),long:writerUi('Pausa longa','Long break')};
  this.clock.textContent=writerV931PomodoroClock(remaining);
  this.phase.textContent=names[cfg.mode];
  const total=writerV931PomodoroDuration(cfg,cfg.mode);
  this.progress.value=total?Math.max(0,Math.min(100,100*(1-remaining/total))):0;
  this.play.text.textContent=writerUi(cfg.running?'Pausar':'Iniciar',cfg.running?'Pause':'Start');
  require('obsidian').setIcon(this.play.glyph,cfg.running?'pause':'play');
  this.count.textContent=writerUi('Sessões de foco concluídas hoje: ','Focus sessions completed today: ')+
   (cfg.today===writerV931PomodoroToday()?cfg.todayCompleted:0);
 }
}
class WriterV931PomodoroController{
 constructor(plugin){this.plugin=plugin;this.views=new Set();this.status=null;this.processing=false;this.lastDraw=-1;}
 get cfg(){return this.plugin.settings.v931Pomodoro;}
 enabled(){return this.cfg.enabled;}
 today(){
  const day=writerV931PomodoroToday();
  if(this.cfg.today!==day){this.cfg.today=day;this.cfg.todayCompleted=0;}
 }
 remaining(){return writerV931PomodoroRemaining(this.cfg);}
 forgetView(view){this.views.delete(view);}
 async persist(){await this.plugin.saveSettings();}
 render(){
  const cfg=this.cfg,now=Date.now(),sec=this.remaining();
  if(this.status){
   this.status.style.display=cfg.enabled&&cfg.statusBar?'':'none';
   const symbol=cfg.mode==='focus'?'🍅':cfg.mode==='long'?'☕':'⏳';
   this.status.textContent=symbol+' '+writerV931PomodoroClock(sec);
   this.status.title=writerUi('Pomodoro: abrir painel','Pomodoro: open panel')+
    (cfg.running?writerUi(' · em andamento',' · running'):'');
   this.status.setAttribute('aria-label',this.status.title);
  }
  for(const view of [...this.views]){
   if(!view.contentEl?.isConnected){this.views.delete(view);continue;}
   view.update();
  }
  this.lastDraw=now;
 }
 async tick(){
  if(this.processing||!this.cfg.enabled)return;
  if(!this.cfg.running){this.render();return;}
  if(this.remaining()>0){this.render();return;}
  this.processing=true;
  try{await this.finish();}finally{this.processing=false;this.render();}
 }
 async finish(){
  const cfg=this.cfg,previous=cfg.mode,endedAt=cfg.endsAt;
  if(!cfg.running||!endedAt)return;
  this.today();
  if(previous==='focus'){
   cfg.completed++;cfg.todayCompleted++;
   if(cfg.logDaily)await this.logFocus(endedAt);
  }
  cfg.mode=previous==='focus'?(cfg.completed%cfg.longEvery===0?'long':'short'):'focus';
  cfg.remaining=writerV931PomodoroDuration(cfg,cfg.mode);
  cfg.running=cfg.autoAdvance;cfg.endsAt=cfg.running?Date.now()+cfg.remaining*1000:0;
  await this.persist();
  if(cfg.notify)new Notice(writerUi(previous==='focus'?'Foco concluído. Hora de uma pausa!':'Pausa concluída. Hora de focar!',
    previous==='focus'?'Focus session complete. Take a break!':'Break complete. Ready to focus!'));
  if(cfg.sound)this.beep();
  for(const view of [...this.views])view.render();
 }
 beep(){
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return;
   const ctx=new Audio(),osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type='sine';osc.frequency.value=660;gain.gain.value=.025;
   osc.connect(gain);gain.connect(ctx.destination);osc.start();
   osc.stop(ctx.currentTime+.15);osc.onended=()=>void ctx.close();
  }catch(_){/* audio may require interaction on mobile; visual Notice remains */}
 }
 async logFocus(end){
  // Opt-in: append only to an existing daily note, never create folders or overwrite contents.
  const cfg=this.cfg,filename=writerV931PomodoroToday(new Date(end))+'.md';
  const path=(cfg.dailyFolder?cfg.dailyFolder+'/':'')+filename;
  const file=this.plugin.app.vault.getAbstractFileByPath(path);
  if(!(file instanceof TFile))return;
  const stamp=new Date(end).toLocaleTimeString().slice(0,8);
  const line='\n- 🍅 '+writerUi('Foco','Focus')+' ('+cfg.focusMinutes+'m) · '+stamp+
   (cfg.task?' · '+cfg.task.replace(/[\r\n]/g,' ').slice(0,120):'');
  try{await this.plugin.app.vault.process(file,text=>text+line);}
  catch(error){console.warn('[Basic AI] Pomodoro daily log:',error);}
 }
 async toggle(){
  if(!this.enabled())return;
  const cfg=this.cfg;
  if(cfg.running){cfg.remaining=this.remaining();cfg.running=false;cfg.endsAt=0;}
  else{if(cfg.remaining<=0)cfg.remaining=writerV931PomodoroDuration(cfg,cfg.mode);
   cfg.running=true;cfg.endsAt=Date.now()+cfg.remaining*1000;}
  await this.persist();this.render();
 }
 async reset(){
  const cfg=this.cfg;cfg.running=false;cfg.endsAt=0;
  cfg.remaining=writerV931PomodoroDuration(cfg,cfg.mode);
  await this.persist();this.render();
 }
 async setMode(mode){
  if(!WRITER_V931_POMODORO_MODES.includes(mode))return;
  const cfg=this.cfg;cfg.mode=mode;cfg.running=false;cfg.endsAt=0;
  cfg.remaining=writerV931PomodoroDuration(cfg,mode);
  await this.persist();for(const view of this.views)view.render();this.render();
 }
 async skip(){
  if(!this.enabled())return;
  const cfg=this.cfg;
  const next=cfg.mode==='focus'?'short':'focus';
  await this.setMode(next);
 }
 async setTask(value){
  this.cfg.task=String(value||'').replace(/[\r\n]/g,' ').slice(0,180);
  await this.persist();
 }
 async open(){
  if(!this.cfg.enabled||!this.cfg.sidebar){
   new Notice(writerUi('Ative o Pomodoro e o painel lateral nas configurações.',
    'Enable Pomodoro and its sidebar in settings.'));return;
  }
  const ws=this.plugin.app.workspace;
  const previous=ws.getLeavesOfType?.(WRITER_V931_POMODORO_VIEW)?.[0];
  // Split a new leaf instead of taking over an already-open sidebar panel.
  const leaf=previous||ws.getRightLeaf?.(true);
  if(!leaf)return;
  if(!previous)await leaf.setViewState({type:WRITER_V931_POMODORO_VIEW,active:true});
  await ws.revealLeaf?.(leaf);
  if(leaf.view instanceof WriterV931PomodoroView){this.views.add(leaf.view);leaf.view.render();}
 }
}
function writerV931PomodoroRegister(plugin){
 const manager=new WriterV931PomodoroController(plugin);
 plugin.writerV931Pomodoro=manager;
 plugin.registerView(WRITER_V931_POMODORO_VIEW,leaf=>new WriterV931PomodoroView(leaf,plugin));
 const open=()=>void manager.open();
 plugin.addCommand({id:'pomodoro-open',name:writerUi('Pomodoro: abrir painel lateral','Pomodoro: open sidebar'),callback:open});
 plugin.addCommand({id:'pomodoro-start-pause',name:writerUi('Pomodoro: iniciar ou pausar','Pomodoro: start or pause'),callback:()=>void manager.toggle()});
 plugin.addCommand({id:'pomodoro-reset',name:writerUi('Pomodoro: reiniciar sessão','Pomodoro: reset session'),callback:()=>void manager.reset()});
 plugin.addCommand({id:'pomodoro-next',name:writerUi('Pomodoro: próxima etapa','Pomodoro: next phase'),callback:()=>void manager.skip()});
 const obs=require('obsidian');
 if(!plugin.app.isMobile&&!obs.Platform?.isMobile&&typeof plugin.addStatusBarItem==='function'){
  const bar=plugin.addStatusBarItem();
  bar.classList.add('writer-v931-pomodoro-status');
  bar.setAttribute('role','button');bar.tabIndex=0;
  bar.addEventListener('click',open);
  bar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  manager.status=bar;
 }
 if(typeof window!=='undefined'&&typeof plugin.registerInterval==='function')
  plugin.registerInterval(window.setInterval(()=>void manager.tick(),1000));
 plugin.app.workspace.onLayoutReady?.(()=>manager.render());
 plugin.register?.(()=>{manager.views.clear();manager.status=null;plugin.writerV931Pomodoro=null;});
 manager.render();
}
function writerV931PomodoroSettings(plugin,panel){
 const cfg=plugin.settings.v931Pomodoro;
 panel.createEl('h3',{text:writerUi('Pomodoro · Foco','Pomodoro · Focus')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Ciclos de foco e pausa inspirados no Pomodoro Timer. Painel lateral no PC e no celular; status bar somente no PC. Nenhum cronômetro começa automaticamente.',
  'Focus and break cycles inspired by Pomodoro Timer. Sidebar on desktop and mobile; status bar only on desktop. No timer starts automatically.'
 )});
 const toggle=(key,pt,en)=>{
  new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{
   cfg[key]=value;if(!cfg.enabled){cfg.running=false;cfg.endsAt=0;}
   await plugin.saveSettings();plugin.writerV931Pomodoro?.render();
   for(const view of plugin.writerV931Pomodoro?.views||[])view.render();
  }));
 };
 for(const [key,pt,en] of [
  ['enabled','Ativar Pomodoro','Enable Pomodoro'],
  ['sidebar','Permitir painel lateral','Enable sidebar'],
  ['statusBar','Exibir na status bar (PC)','Show in status bar (desktop)'],
  ['autoAdvance','Iniciar próxima etapa automaticamente','Auto-start next phase'],
  ['notify','Avisar quando terminar','Notify when finished'],
  ['sound','Som de conclusão (quando permitido)','Completion sound (when allowed)'],
  ['logDaily','Registrar foco em nota diária existente','Log focus to existing daily note']
 ])toggle(key,pt,en);
 for(const [key,pt,en,max] of [
  ['focusMinutes','Duração do foco (minutos)','Focus duration (minutes)',180],
  ['shortMinutes','Pausa curta (minutos)','Short break (minutes)',60],
  ['longMinutes','Pausa longa (minutos)','Long break (minutes)',60],
  ['longEvery','Pausa longa a cada N focos','Long break every N sessions',12]
 ]){
  new Setting(panel).setName(writerUi(pt,en)).addSlider(sl=>sl.setLimits(1,max,1)
   .setValue(cfg[key]).setDynamicTooltip().onChange(async value=>{
    cfg[key]=value;
    if(!cfg.running&&key!=='longEvery')cfg.remaining=writerV931PomodoroDuration(cfg,cfg.mode);
    await plugin.saveSettings();plugin.writerV931Pomodoro?.render();
   }));
 }
 new Setting(panel).setName(writerUi('Pasta de notas diárias (opcional)','Daily note folder (optional)'))
  .setDesc(writerUi('Registra somente em notas existentes no formato AAAA-MM-DD.md. Deixe vazio para usar a raiz. Não cria arquivos.',
   'Logs only to existing YYYY-MM-DD.md notes. Leave blank for vault root. Does not create files.'))
  .addText(t=>t.setPlaceholder('Diário').setValue(cfg.dailyFolder).onChange(async value=>{
   const tmp={v931Pomodoro:{...cfg,dailyFolder:value}};
   writerV931PomodoroMerge(tmp);cfg.dailyFolder=tmp.v931Pomodoro.dailyFolder;
   await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Abrir painel Pomodoro','Open Pomodoro sidebar'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerV931Pomodoro?.open()));
}
