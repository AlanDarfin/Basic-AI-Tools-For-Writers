'use strict';
/* Local Study workspace, inspired by Spaced Repetition. No source note edits. */
const WRITER_V83_STUDY_VIEW='writer-study-view';
function writerV83StudyConfig(settings){
 const old=settings.v83Study&&typeof settings.v83Study==='object'?settings.v83Study:{};
 const cfg=settings.v83Study={...{tag:'flashcards',dailyMax:30,newMax:15,learningMinutes:10,graduatingDays:1,secondIntervalDays:6,intervalModifier:1,easyBonus:1.3,maxIntervalDays:3650,lastDeck:'',history:{}},...old};
 cfg.tag=String(cfg.tag||'flashcards').replace(/^#/,'').slice(0,80);
 cfg.dailyMax=Math.max(5,Math.min(100,Math.floor(Number(cfg.dailyMax)||30)));
 cfg.newMax=Math.max(1,Math.min(40,Math.floor(Number(cfg.newMax)||15)));
 cfg.learningMinutes=Math.max(1,Math.min(120,Number(cfg.learningMinutes)||10));
 cfg.graduatingDays=Math.max(1,Math.min(30,Number(cfg.graduatingDays)||1));
 cfg.secondIntervalDays=Math.max(1,Math.min(90,Number(cfg.secondIntervalDays)||6));
 cfg.intervalModifier=Math.max(.5,Math.min(2,Number(cfg.intervalModifier)||1));
 cfg.easyBonus=Math.max(1,Math.min(2,Number(cfg.easyBonus)||1.3));
 cfg.maxIntervalDays=Math.max(7,Math.min(36500,Number(cfg.maxIntervalDays)||3650));
 cfg.lastDeck=String(cfg.lastDeck||'').slice(0,500);
 cfg.history=cfg.history&&typeof cfg.history==='object'&&!Array.isArray(cfg.history)?cfg.history:{};
 return cfg;
}
function writerV83StudyHash(value){
 let h=2166136261;
 for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h>>>0).toString(36);
}
function writerV83StudyTagged(content,tag){
 const escaped=String(tag||'flashcards').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('(^|[\\s,\\[])#'+escaped+'(?:\\/[^\\s,\\]#]+)?(?=$|[\\s,\\]])','im');
 const header=/^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
 return pattern.test(content)||Boolean(header&&new RegExp('(?:^|\\s)'+escaped+'(?:\\/[^\\s,\\]]+)?(?=$|[\\s,\\]])','im').test(header[1]));
}
function writerV83StudyCards(source,file,tag='flashcards'){
 const text=String(source||'');
 if(text.length>260000||!writerV83StudyTagged(text,tag))return [];
 const lines=text.replace(/\r\n/g,'\n').split('\n'),cards=[];
 let insideFence=false;
 for(let i=0;i<lines.length&&cards.length<100;i++){
  const line=lines[i],trim=line.trim();
  if(/^\s*(?:`{3,}|~{3,})/.test(line)){insideFence=!insideFence;continue;}
  if(insideFence||!trim||trim.startsWith('#')||trim.startsWith('>')||trim.startsWith('|'))continue;
  if(trim.includes(':::')){
   const split=trim.split(':::');
   if(split.length===2&&split[0].trim()&&split[1].trim()){
    const a=split[0].trim(),b=split[1].trim();
    cards.push({front:a,back:b,reverse:false});
    cards.push({front:b,back:a,reverse:true});
   }
  }else if(trim.includes('::')){
   const sep=trim.indexOf('::');
   const front=trim.slice(0,sep).trim(),back=trim.slice(sep+2).trim();
   if(front&&back)cards.push({front,back});
  }else if(/==[^=\n]+==/.test(trim)){
   // Highlight clozes, only inside explicitly tagged study notes. Skip
   // extended-syntax colored highlights (=={color}...) to avoid collisions.
   const re=/==([^=\n]+)==/g;let m;
   while((m=re.exec(trim))&&cards.length<100){
    if(m[1].startsWith('{'))continue;
    cards.push({front:trim.replace(m[0],'[…]'),back:trim.replace(m[0],m[1])});
   }
  }else if(/\{\{c\d+::[^{}]+\}\}/.test(trim)){
   const re=/\{\{c\d+::([^{}]+)\}\}/g;let m;
   while((m=re.exec(trim))&&cards.length<100){
    const front=trim.replace(m[0],'[…]'),back=trim.replace(m[0],m[1]);
    cards.push({front,back});
   }
  }
 }
 return cards.map(card=>({...card,path:file.path,deck:file.parent?.path||'',
  id:writerV83StudyHash(file.path+'|'+card.front+'|'+card.back)}));
}
function writerV83StudySchedule(previous,grade,now=Date.now(),config={}){
 const old=previous&&typeof previous==='object'?previous:{ease:2.5,interval:0,reps:0};
 let ease=Math.max(1.3,Math.min(3.2,Number(old.ease)||2.5));
 let reps=Math.max(0,Number(old.reps)||0),interval=Math.max(0,Number(old.interval)||0);
 const rating=Math.max(0,Math.min(5,Number(grade)||0));
 if(rating<=1){reps=0;interval=0;}
 else if(rating===2){interval=Math.max(1,Math.round(interval*1.2*(Number(config.intervalModifier)||1)));reps++;}
 else{
  if(reps===0)interval=Number(config.graduatingDays)||1;
  else if(reps===1)interval=Number(config.secondIntervalDays)||6;
  else interval=Math.max(1,Math.round(interval*(rating===5?ease*(Number(config.easyBonus)||1.3):ease)*(Number(config.intervalModifier)||1)));
  reps++;
 }
 ease=Math.max(1.3,Math.min(3.2,ease+(.1-(5-rating)*(.08+(5-rating)*.02))));
 interval=Math.max(0,Math.min(Number(config.maxIntervalDays)||3650,interval));
 const due=rating<=1?now+(Number(config.learningMinutes)||10)*60*1000:now+interval*86400000;
 return {ease:Number(ease.toFixed(3)),interval,reps,due,last:now};
}
async function writerV83StudyLoad(plugin){
 const cfg=plugin.settings.v83Study,files=plugin.app.vault.getMarkdownFiles?.()||[];
 const cards=[];
 // Only parse explicitly tagged study notes, no automatic rewriting.
 for(const file of files.slice(0,2500)){
  try{
   const cache=plugin.app.metadataCache?.getFileCache?.(file);
   const names=cache?.tags?.map(t=>t.tag.replace(/^#/,''))||[];
   const yaml=cache?.frontmatter?.tags;
   const frontTags=Array.isArray(yaml)?yaml.map(String):String(yaml||'').split(/[\s,]+/);
   if(![...names,...frontTags].some(t=>t.replace(/^#/,'').startsWith(cfg.tag))&&
     !String(cache?.frontmatter?.study||'').includes('true'))continue;
   const source=await plugin.app.vault.cachedRead(file);
   cards.push(...writerV83StudyCards(source,file,cfg.tag));
  }catch(error){console.warn('[Basic AI] Study source:',file.path,error);}
  if(cards.length>=4000)break;
 }
 return cards.slice(0,4000);
}
function writerV83StudyDue(cards,history,now=Date.now(),maxNew=15,deck=''){
 let newCount=0;
 return cards.filter(card=>{
  if(deck&&card.deck!==deck)return false;
  const record=history[card.id];
  if(!record){if(newCount>=maxNew)return false;newCount++;return true;}
  return !(Number(record.due)>now);
 }).sort((a,b)=>(history[a.id]?.due||0)-(history[b.id]?.due||0));
}
class WriterV83StudyView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.cards=[];this.deck=plugin.settings?.v83Study?.lastDeck||'';this.index=0;this.revealed=false;this.disposed=false;}
 getViewType(){return WRITER_V83_STUDY_VIEW;}
 getDisplayText(){return writerUi('Estudos · Revisão','Study · Review');}
 getIcon(){return 'graduation-cap';}
 async onOpen(){this.disposed=false;await this.load();}
 async onClose(){this.disposed=true;}
 async load(){
  const cards=await writerV83StudyLoad(this.plugin);
  if(this.disposed)return;
  this.cards=cards;this.index=0;this.revealed=false;this.render();
 }
 render(){
  const root=this.contentEl;root.empty();root.addClass('writer-v83-study');
  const cfg=this.plugin.settings.v83Study;
  const header=root.createDiv({cls:'writer-v83-study-head'});
  header.createEl('h2',{text:writerUi('Estudos','Study')});
  header.createEl('button',{text:writerUi('Atualizar cartões','Refresh cards')}).addEventListener('click',()=>void this.load());
  const decks=[...new Set(this.cards.map(card=>card.deck))].sort();
  const selector=root.createDiv({cls:'writer-v83-study-decks'});
  selector.createSpan({text:writerUi('Baralho','Deck')});
  const select=selector.createEl('select');
  for(const [value,label] of [['',writerUi('Todos','All')],...decks.map(x=>[x,x||'/'])]){
   const option=select.createEl('option',{text:label});option.value=value;
  }
  select.value=this.deck;
  select.addEventListener('change',()=>{this.deck=select.value;cfg.lastDeck=this.deck;void this.plugin.saveSettings();this.index=0;this.revealed=false;this.render();});
  const dailyLimit=cfg.dailyMax;
  const due=writerV83StudyDue(this.cards,cfg.history,Date.now(),cfg.newMax,this.deck).slice(0,dailyLimit);
  const today=new Date().toDateString();
  const reviewed=Object.values(cfg.history).filter(r=>r.last&&new Date(r.last).toDateString()===today).length;
  const status=root.createDiv({cls:'writer-v83-study-stats'});
  status.createSpan({text:writerUi('Pendentes: ','Due: ')+due.length});
  status.createSpan({text:writerUi('Revisados hoje: ','Reviewed today: ')+reviewed});
  status.createSpan({text:writerUi('Total: ','Total: ')+this.cards.length});
  const week=Array.from({length:7},(_,day)=>{
   const from=Date.now()+day*86400000,to=from+86400000;
   return Object.values(cfg.history).filter(record=>Number(record.due)>=from&&Number(record.due)<to).length;
  });
  const weekBox=root.createDiv({cls:'writer-v101-study-forecast'});
  weekBox.createSpan({text:writerUi('Próximos 7 dias: ','Next 7 days: ')+week.join(' · ')});
  if(!due.length){
   root.createEl('p',{text:this.cards.length?writerUi('Tudo revisado por enquanto.','All caught up for now.'):writerUi('Adicione #flashcards e cartões Pergunta::Resposta às suas notas para começar.','Add #flashcards and Question::Answer to notes to begin.'),cls:'writer-v83-study-empty'});
   return;
  }
  const card=due[Math.min(this.index,due.length-1)];
  const content=root.createDiv({cls:'writer-v83-study-card'});
  const source=content.createDiv({cls:'writer-v83-study-source'});
  source.createEl('button',{text:card.path}).addEventListener('click',()=>{
   const file=this.app.vault.getAbstractFileByPath(card.path);
   if(file instanceof TFile)void this.app.workspace.getLeaf('tab').openFile(file);
  });
  const front=content.createDiv({cls:'writer-v83-study-face markdown-rendered'});
  void MarkdownRenderer.render(this.app,card.front,front,card.path,this).catch(error=>front.setText(card.front));
  if(!this.revealed){
   content.createEl('button',{text:writerUi('Mostrar resposta','Show answer'),cls:'mod-cta'})
    .addEventListener('click',()=>{this.revealed=true;this.render();});
  }else{
   const answer=content.createDiv({cls:'writer-v83-study-answer markdown-rendered'});
   void MarkdownRenderer.render(this.app,card.back,answer,card.path,this).catch(error=>answer.setText(card.back));
   const choices=content.createDiv({cls:'writer-v83-study-choices'});
   for(const [value,pt,en] of [[0,'De novo · 10 min','Again · 10 min'],[2,'Difícil','Hard'],[4,'Bom','Good'],[5,'Fácil','Easy']]){
    const button=choices.createEl('button',{text:writerUi(pt,en)});
    button.addEventListener('click',async()=>{
     choices.querySelectorAll('button').forEach(b=>b.disabled=true);
     try{
      cfg.history[card.id]=writerV83StudySchedule(cfg.history[card.id],value,Date.now(),cfg);
      await this.plugin.saveSettings();
      this.index=0;this.revealed=false;this.render();
     }catch(error){new Notice(String(error));choices.querySelectorAll('button').forEach(b=>b.disabled=false);}
    });
   }
  }
 }
}
function writerV83RegisterStudy(plugin){
 writerV83StudyConfig(plugin.settings);
 plugin.registerView(WRITER_V83_STUDY_VIEW,leaf=>new WriterV83StudyView(leaf,plugin));
 const open=async()=>{
  if(!writerModuleOn(plugin,'study'))return;
  let leaf=plugin.app.workspace.getLeavesOfType(WRITER_V83_STUDY_VIEW)[0];
  if(!leaf){leaf=plugin.app.workspace.getLeaf('tab');await leaf.setViewState({type:WRITER_V83_STUDY_VIEW,active:true});}
  await plugin.app.workspace.revealLeaf?.(leaf);
 };
 plugin.writerStudyOpen=open;
 plugin.addCommand({id:'v83-study-open',name:writerUi('Estudos: revisar cartões','Study: review flashcards'),callback:()=>void open()});
}

function writerV83StudySettings(plugin,panel){
 const cfg=plugin.settings.v83Study;
 panel.createEl('h3',{text:writerUi('Estudos e revisão espaçada','Study and spaced repetition')});
 panel.createEl('p',{text:writerUi('Cartões Markdown de notas marcadas com #flashcards. Progresso local nas configurações; não modifica o conteúdo das notas.','Markdown cards in notes tagged #flashcards. Progress is stored locally, without rewriting notes.'),cls:'dictionary-muted'});
 new Setting(panel).setName(writerUi('Etiqueta de estudos','Study tag'))
  .setDesc(writerUi('Sem #. Ex.: flashcards ou estudos.','Without #, e.g. flashcards or study.'))
  .addText(input=>input.setValue(cfg.tag).onChange(async value=>{
   cfg.tag=String(value||'flashcards').replace(/^#/,'').replace(/[\s,;]+/g,'').slice(0,80)||'flashcards';
   await plugin.saveSettings();
  }));
 for(const [key,pt,en,min,max] of [['dailyMax','Cartões por sessão','Cards per session',5,100],['newMax','Cartões novos por sessão','New cards per session',1,40]]){
  new Setting(panel).setName(writerUi(pt,en)).addText(input=>
   input.setValue(String(cfg[key])).onChange(async value=>{
    cfg[key]=Math.max(min,Math.min(max,Number(value)||cfg[key]));await plugin.saveSettings();
   }));
 }
 panel.createEl('h4',{text:writerUi('Agendamento de revisão','Review scheduling')});
 for(const [key,pt,en,min,max,step] of [
  ['learningMinutes','Repetição após erro (minutos)','Retry after lapse (minutes)',1,120,1],
  ['graduatingDays','Primeiro intervalo (dias)','First interval (days)',1,30,1],
  ['secondIntervalDays','Segundo intervalo (dias)','Second interval (days)',1,90,1],
  ['intervalModifier','Multiplicador dos intervalos','Interval multiplier',.5,2,.05],
  ['easyBonus','Bônus de resposta fácil','Easy-answer bonus',1,2,.05],
  ['maxIntervalDays','Limite de intervalo (dias)','Maximum interval (days)',7,36500,7]
 ])new Setting(panel).setName(writerUi(pt,en)).addSlider(slider=>
  slider.setLimits(min,max,step).setDynamicTooltip().setValue(cfg[key]).onChange(async v=>{
   cfg[key]=v;await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Abrir área de Estudos','Open Study workspace'))
  .addButton(btn=>btn.setButtonText(writerUi('Abrir','Open')).onClick(()=>void plugin.writerStudyOpen?.()));
}
