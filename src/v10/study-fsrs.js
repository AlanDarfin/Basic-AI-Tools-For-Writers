'use strict';
/* FSRS-4.5 scheduling with published defaults, optional; retains existing SM-2 histories. */
const WRITER_V107_FSRS_WEIGHTS=[.4872,1.4003,3.7145,13.8206,5.1618,1.2298,.8975,.031,1.6474,.1367,1.0461,2.1072,.0793,.3246,1.587,.2272,2.8755];
function writerV107StudyConfig(settings){
 const v=settings.v83Study||{},old=settings.v107Study&&typeof settings.v107Study==='object'?settings.v107Study:{};
 const cfg=settings.v107Study={scheduler:'sm2',desiredRetention:.90,tsvEnabled:true,...old};
 if(!['sm2','fsrs45'].includes(cfg.scheduler))cfg.scheduler='sm2';
 cfg.desiredRetention=Math.max(.70,Math.min(.97,Number(cfg.desiredRetention)||.90));
 return cfg;
}
function writerV107StudyRetrievability(elapsedDays,stability){
 return Math.pow(1+(19/81)*Math.max(0,elapsedDays)/Math.max(.01,stability),-.5);
}
function writerV107StudySchedule(previous,grade,now=Date.now(),settings={}){
 const cfg=writerV107StudyConfig(settings),w=WRITER_V107_FSRS_WEIGHTS;
 const g=Number(grade)<=1?1:Number(grade)===2?2:Number(grade)===5?4:3;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const old=previous&&typeof previous==='object'?previous:{},newCard=!old.reps&&!old.last;
 const last=Number(old.last)||now;
 let s=clamp(Number(old.stability)||Number(old.interval)||w[g-1],.01,36500);
 let d=clamp(Number(old.difficulty)||w[4],1,10);
 if(newCard){s=w[g-1];d=clamp(w[4]-(g-3)*w[5],1,10);}
 else{
  const elapsed=Math.max(0,(now-last)/86400000);
  const r=writerV107StudyRetrievability(elapsed,s);
  d=clamp(w[7]*w[4]+(1-w[7])*(d-w[6]*(g-3)),1,10);
  if(g===1)s=Math.min(s,w[11]*Math.pow(d,-w[12])*(Math.pow(s+1,w[13])-1)*Math.exp(w[14]*(1-r)));
  else s=s*(1+Math.exp(w[8])*(11-d)*Math.pow(s,-w[9])*(Math.exp(w[10]*(1-r))-1)*(g===2?w[15]:g===4?w[16]:1));
 }
 s=clamp(s,.01,36500);
 const interval=Math.max(1,Math.min(Number(settings?.v83Study?.maxIntervalDays)||3650,Math.round(s*(81/19)*(Math.pow(cfg.desiredRetention,-2)-1))));
 const lapses=(Number(old.lapses)||0)+(g===1?1:0);
 const due=g===1?now+(Number(settings?.v83Study?.learningMinutes)||10)*60000:now+interval*86400000;
 return {ease:Number(old.ease)||2.5,interval:g===1?0:interval,reps:g===1?0:(Number(old.reps)||0)+1,due,last:now,
  stability:Number(s.toFixed(5)),difficulty:Number(d.toFixed(5)),lapses,algorithm:'fsrs45',retention:cfg.desiredRetention};
}
function writerV107StudyExportRows(cards){
 const clean=v=>String(v||'').replace(/\t/g,' ').replace(/\r?\n/g,'<br>').replace(/^[=+\-@]/,"'$&");
 return ['#separator:tab','#html:true','#columns:Front\tBack\tTags',...cards.map(c=>[clean(c.front),clean(c.back),'flashcards'].join('\t'))].join('\n');
}
function writerV107StudyImportRows(text){
 const cards=[];
 for(const line of String(text||'').slice(0,500000).split(/\r?\n/)){
  if(!line.trim()||line.startsWith('#'))continue;
  const cols=line.split('\t');
  const a=String(cols[0]||'').trim().replace(/<br\s*\/?>/gi,' '),b=String(cols[1]||'').trim().replace(/<br\s*\/?>/gi,' ');
  if(a&&b&&a.length<=700&&b.length<=1800&&cards.length<500){
   cards.push({front:a,back:b});
  }
 }
 return cards;
}
function writerV107StudyRegister(plugin){
 writerV107StudyConfig(plugin.settings);
 const prior=writerV83StudySchedule;
 writerV83StudySchedule=function(previous,grade,now,config){
  return writerV107StudyConfig(plugin.settings).scheduler==='fsrs45'?
   writerV107StudySchedule(previous,grade,now,plugin.settings):prior(previous,grade,now,config);
 };
 plugin.register?.(()=>{writerV83StudySchedule=prior;});
 plugin.addCommand({id:'v107-study-export-tsv',name:writerUi('Estudos: exportar cartões (Anki TSV)','Study: export cards (Anki TSV)'),callback:async()=>{
  try{
   const cards=await writerV83StudyLoad(plugin);
   if(!cards.length){new Notice(writerUi('Nenhum cartão para exportar.','No cards to export.'));return;}
   const path='Study-Anki-'+Date.now()+'.txt';
   await plugin.app.vault.create(path,writerV107StudyExportRows(cards));
   new Notice(writerUi('Arquivo Anki criado: ','Anki-compatible text created: ')+path);
  }catch(e){new Notice(String(e.message||e));}
 }});
 plugin.addCommand({id:'v107-study-import-tsv',name:writerUi('Estudos: importar cartões TSV','Study: import TSV cards'),callback:()=>{
  const files=plugin.app.vault.getFiles().filter(f=>['txt','tsv'].includes(f.extension)&&f.stat.size<500000).slice(0,300);
  if(!files.length){new Notice(writerUi('Coloque um arquivo TSV no cofre.','Place a TSV file in the vault.'));return;}
  const Suggest=require('obsidian').FuzzySuggestModal;
  const modal=new (class extends Suggest{
   getItems(){return files;}getItemText(f){return f.path;}
   async onChooseItem(file){
    try{
     const cards=writerV107StudyImportRows(await plugin.app.vault.read(file));
     if(!cards.length)throw Error(writerUi('Nenhum cartão válido.','No valid cards.'));
     const name='Imported-Study-'+Date.now()+'.md',source='#flashcards\n\n'+cards.map(c=>c.front+'::'+c.back).join('\n\n');
     await plugin.app.vault.create(name,source);
     new Notice(cards.length+' '+writerUi('cartões importados em ','cards imported to ')+name);
    }catch(e){new Notice(String(e.message||e));}
   }
  })(plugin.app);modal.open();
 }});
}
function writerV107StudySettings(plugin,panel){
 const cfg=plugin.settings.v107Study;
 panel.createEl('h3',{text:writerUi('Estudos · FSRS e Anki','Study · FSRS and Anki')});
 new Setting(panel).setName(writerUi('Algoritmo de agendamento','Scheduling algorithm'))
  .setDesc(writerUi('SM-2 mantém o comportamento antigo; FSRS-4.5 usa estabilidade e dificuldade da memória.','SM-2 preserves previous behavior; FSRS-4.5 uses memory stability and difficulty.'))
  .addDropdown(d=>d.addOption('sm2','SM-2').addOption('fsrs45','FSRS-4.5').setValue(cfg.scheduler).onChange(async v=>{cfg.scheduler=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Retenção desejada (FSRS)','Desired retention (FSRS)'))
  .addSlider(s=>s.setLimits(.7,.97,.01).setValue(cfg.desiredRetention).setDynamicTooltip().onChange(async v=>{cfg.desiredRetention=v;await plugin.saveSettings();}));
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Exporta texto TSV compatível com importação Anki. Não lê arquivos .apkg nem inclui sincronização AnkiWeb.','Exports Anki-compatible TSV text. Does not read .apkg or sync with AnkiWeb.')});
}
