'use strict';
/* 7.0.0 stable: opt-in, non-destructive book-series organization,
 * story-world calendar ordering and scene setup/payoff dependencies.
 * All content stays in the user's own vault and existing Longform index.
 */
const WRITER_V7_GREGORIAN_MONTHS=[
 ['January',31],['February',28],['March',31],['April',30],
 ['May',31],['June',30],['July',31],['August',31],
 ['September',30],['October',31],['November',30],['December',31]
];
function writerV7CalendarNormalize(raw){
 const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 if(value.mode!=='custom')return {mode:'gregorian',months:WRITER_V7_GREGORIAN_MONTHS.map(([name,days])=>({name,days}))};
 const months=Array.isArray(value.months)?value.months:[];
 if(!months.length||months.length>24)return writerV7CalendarNormalize(null);
 const clean=[];
 for(const month of months){
  const name=String(month?.name||'').trim().slice(0,45);
  const days=Number(month?.days);
  if(!name||!Number.isInteger(days)||days<1||days>99)return writerV7CalendarNormalize(null);
  clean.push({name,days});
 }
 return {mode:'custom',months:clean};
}
function writerV7CalendarYearLength(config,year){
 const c=writerV7CalendarNormalize(config);
 if(c.mode==='custom')return c.months.reduce((sum,m)=>sum+m.days,0);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 return leap?366:365;
}
function writerV7CalendarSortDate(value,rawConfig){
 const raw=String(value??'').trim();
 if(!raw)return null;
 const config=writerV7CalendarNormalize(rawConfig);
 const match=/^(-?\d{1,6})(?:-(\d\d)(?:-(\d\d))?)?$/.exec(raw);
 if(!match)return null;
 const year=Number(match[1]);
 const maxYearDays=config.mode==='custom'?config.months.reduce((sum,m)=>sum+m.days,0):400;
 if(!match[2])return year*maxYearDays;
 const month=Number(match[2]),day=Number(match[3]||'1');
 if(month<1||month>config.months.length)return null;
 const monthDays=config.months[month-1].days;
 const extra=config.mode==='gregorian'&&month===2&&writerV7CalendarYearLength(config,year)===366?1:0;
 if(day<1||day>monthDays+extra)return null;
 const elapsed=config.months.slice(0,month-1).reduce((sum,m)=>sum+m.days,0);
 const leapDay=config.mode==='gregorian'&&month>2&&writerV7CalendarYearLength(config,year)===366?1:0;
 return year*maxYearDays+elapsed+leapDay+day-1;
}
function writerV7CalendarParseMonths(raw){
 const items=String(raw||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(items.length<1||items.length>24)throw Error(writerUi('Defina entre 1 e 24 meses.','Define between 1 and 24 months.'));
 const months=items.map(line=>{
  const match=/^(.{1,45})\s*:\s*(\d{1,2})$/.exec(line);
  if(!match)throw Error(writerUi('Use Nome:30, uma linha por mês.','Use Name:30, one line per month.'));
  return {name:match[1].trim(),days:Number(match[2])};
 });
 if(months.some(m=>!m.name||m.days<1||m.days>99))throw Error(writerUi('Quantidade de dias inválida.','Invalid day count.'));
 return months;
}
function writerV7CalendarOpen(view,project){
 const modal=new Modal(view.app),prefs=view.prefs(project);
 let config=writerV7CalendarNormalize(prefs.v7Calendar),mode=config.mode;
 let lines=config.months.map(m=>m.name+':'+m.days).join('\n');
 modal.onOpen=()=>{
  modal.setTitle(writerUi('Calendário da história','Story calendar'));
  modal.contentEl.createEl('p',{text:writerUi('Afeta somente a ordenação da Timeline deste projeto, sem mudar nenhuma data nas notas. Eras escritas livremente continuam sem ordem automática.','Only changes event sorting for this project; no note dates are changed. Free-text eras remain unsorted.')});
  new Setting(modal.contentEl).setName(writerUi('Tipo de calendário','Calendar type')).addDropdown(d=>
   d.addOption('gregorian',writerUi('Gregoriano','Gregorian'))
    .addOption('custom',writerUi('Fictício (meses personalizados)','Fictional (custom months)'))
    .setValue(mode).onChange(v=>mode=v));
  new Setting(modal.contentEl).setName(writerUi('Meses e duração (Nome:30)','Months and lengths (Name:30)'))
   .setDesc(writerUi('Usado somente em calendários fictícios. Máximo de 24 meses, com 1–99 dias.','Only for fictional calendars. Up to 24 months, each containing 1–99 days.'))
   .addTextArea(t=>{t.inputEl.rows=8;t.setValue(lines).onChange(v=>lines=v);});
  new Setting(modal.contentEl)
   .addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setCta().setButtonText(writerUi('Aplicar','Apply')).onClick(async()=>{
    try{
     const next=mode==='custom'?{mode,months:writerV7CalendarParseMonths(lines)}:{mode:'gregorian'};
     prefs.v7Calendar=next;await view.plugin.saveSettings();modal.close();await view.render();
    }catch(e){new Notice(String(e.message||e));}
   }));
 };modal.open();
}
function writerV7SeriesSafe(settings){
 const stored=Array.isArray(settings.v7Series)?settings.v7Series:[];
 const ids=new Set(),output=[];
 for(const item of stored.slice(0,100)){
  if(!item||typeof item!=='object')continue;
  const id=String(item.id||'').trim().slice(0,80),name=String(item.name||'').trim().slice(0,90);
  if(!id||!name||ids.has(id))continue;
  ids.add(id);
  const books=Array.isArray(item.books)?item.books:[];
  output.push({id,name,books:[...new Set(books.filter(x=>typeof x==='string'&&x.endsWith('.md')).map(x=>x.slice(0,500)))].slice(0,150)});
 }
 return output;
}
function writerV7SeriesForProject(settings,path){
 return writerV7SeriesSafe(settings).filter(item=>item.books.includes(path));
}
function writerV7SeriesOpen(view){
 const modal=new Modal(view.app),settings=view.plugin.settings;
 const get=()=>writerV7SeriesSafe(settings);
 const save=async(value)=>{settings.v7Series=value;await view.plugin.saveSettings();render();};
 const projectOptions=()=>view.indexes();
 const render=()=>{
  if(!modal.contentEl)return;
  modal.contentEl.empty();
  modal.contentEl.addClass('writer-v7-stable-series');
  modal.setTitle(writerUi('Séries de livros','Book series'));
  modal.contentEl.createEl('p',{cls:'writer-v7-muted',text:writerUi('Agrupa índices Longform existentes. Não move, renomeia nem cria capítulos. A ordem é exclusiva da série, independente de cada livro.','Organizes existing Longform indexes. Never moves, renames or creates chapters. Series order is separate from each book.')});
  const list=get();
  const action=modal.contentEl.createDiv({cls:'writer-v7-toolbar'});
  action.createEl('button',{text:writerUi('+ Série','+ Series')}).addEventListener('click',()=>{
   new TextPrompt(view.app,writerUi('Nome da série','Series name'),async raw=>{
    const name=String(raw||'').trim().slice(0,90);
    if(!name)return;
    const current=get();
    if(current.some(s=>s.name.toLocaleLowerCase()===name.toLocaleLowerCase()))
     return void new Notice(writerUi('Série com esse nome já existente.','Series name already exists.'));
    current.push({id:'v7-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),name,books:view.currentProject?[view.currentProject.file.path]:[]});
    await save(current);
   }).open();
  });
  if(!list.length)modal.contentEl.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma série criada.','No series yet.')});
  const indexed=projectOptions(),available=new Map(indexed.map(p=>[p.file.path,p]));
  for(const series of list){
   const card=modal.contentEl.createDiv({cls:'writer-v7-stable-series-card'});
   const head=card.createDiv({cls:'writer-v7-stable-series-head'});
   head.createEl('strong',{text:series.name});
   head.createEl('button',{text:writerUi('Renomear','Rename')}).addEventListener('click',()=>{
    new TextPrompt(view.app,writerUi('Renomear série','Rename series'),async value=>{
     const name=String(value||'').trim().slice(0,90);
     if(!name)return;
     const state=get();const entry=state.find(x=>x.id===series.id);
     if(entry){entry.name=name;await save(state);}
    }).open();
   });
   head.createEl('button',{text:writerUi('Excluir série','Delete series')}).addEventListener('click',()=>{
    new ConfirmProjectAction(view.app,writerUi('Excluir somente a série?','Delete series only?'),
     writerUi('Todos os livros e arquivos continuarão intactos.','All books and files will remain untouched.'),async()=>{
      await save(get().filter(x=>x.id!==series.id));
     }).open();
   });
   const rows=card.createDiv({cls:'writer-v7-stable-series-books'});
   for(const [i,path] of series.books.entries()){
    const row=rows.createDiv({cls:'writer-v7-stable-series-book'});
    const project=available.get(path);
    row.createEl('button',{cls:'writer-v7-stable-series-book-name',text:project?.title||path})
     .addEventListener('click',()=>{if(project){view.selected=project.file.path;writerProjectRemember(view,view.selected);modal.close();void view.render();}});
    for(const [label,delta] of [['↑',-1],['↓',1]]){
     row.createEl('button',{text:label,attr:{'aria-label':(delta<0?writerUi('Subir ','Move up '):writerUi('Descer ','Move down '))+(project?.title||path)}})
      .addEventListener('click',async()=>{
       const state=get(),entry=state.find(x=>x.id===series.id);
       if(!entry)return;const j=i+delta;
       if(j<0||j>=entry.books.length)return;
       [entry.books[i],entry.books[j]]=[entry.books[j],entry.books[i]];
       await save(state);
      });
    }
    row.createEl('button',{text:'×',attr:{'aria-label':writerUi('Retirar livro da série','Remove book from series')}}).addEventListener('click',async()=>{
     const state=get(),entry=state.find(x=>x.id===series.id);
     if(entry){entry.books=entry.books.filter(x=>x!==path);await save(state);}
    });
   }
   const add=card.createDiv({cls:'writer-v7-toolbar'});
   const picker=add.createEl('select',{attr:{'aria-label':writerUi('Adicionar livro à série','Add a book to series')}});
   const availableBooks=indexed.filter(p=>!series.books.includes(p.file.path));
   for(const p of availableBooks){const option=picker.createEl('option',{text:p.title});option.value=p.file.path;}
   const addButton=add.createEl('button',{text:writerUi('+ Livro','+ Book')});
   addButton.disabled=!availableBooks.length;
   addButton.addEventListener('click',async()=>{
    if(!availableBooks.length)return;
    const state=get(),entry=state.find(x=>x.id===series.id);
    if(entry&&!entry.books.includes(picker.value)){entry.books.push(picker.value);await save(state);}
   });
  }
 };
 modal.onOpen=render;
 modal.open();
}
function writerV7StableSceneKey(value){
 return String(value||'').trim().replace(/^!?\[\[/,'').replace(/\]\]$/,'')
  .split('|')[0].split('#')[0].replace(/\.md$/i,'').toLocaleLowerCase();
}
function writerV7StableDependencies(scenes){
 const nodes=scenes.filter(s=>s.file instanceof TFile),byNames=new Map(),edges=new Map(),warnings=[];
 for(const s of nodes){
  for(const key of [s.title,s.file.basename,s.file.path]){
   const k=writerV7StableSceneKey(key);if(!k)continue;
   if(!byNames.has(k))byNames.set(k,[]);
   const found=byNames.get(k);if(!found.includes(s))found.push(s);
  }
 }
 const add=(scene,raw,relation)=>{
  const key=writerV7StableSceneKey(raw),matches=byNames.get(key)||[];
  if(matches.length!==1){
   warnings.push({scene:scene.title,reference:raw,reason:matches.length?writerUi('Referência ambígua','Ambiguous reference'):writerUi('Cena inexistente','Missing scene')});
   return;
  }
  const target=matches[0];
  const from=relation==='setup'?target:scene,to=relation==='setup'?scene:target;
  if(from.file.path===to.file.path){warnings.push({scene:scene.title,reference:raw,reason:writerUi('Dependência circular da própria cena','Self-dependency')});return;}
  const id=from.file.path+'|'+to.file.path;
  if(!edges.has(id))edges.set(id,{from,to,types:[]});
  const edge=edges.get(id);
  if(!edge.types.includes(relation))edge.types.push(relation);
  if(from.position>=to.position&&!warnings.some(x=>x.scene===scene.title&&x.reference===raw&&x.reason.includes('ordem')))
   warnings.push({scene:scene.title,reference:raw,reason:writerUi('Verifique a ordem desta dependência','Check dependency ordering')});
 };
 for(const scene of scenes){
  for(const ref of scene.setup||[])add(scene,ref,'setup');
  for(const ref of scene.payoff||[])add(scene,ref,'payoff');
 }
 return {edges:[...edges.values()].slice(0,400),warnings:warnings.slice(0,100)};
}
function writerV7StableRenderDependencies(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-stable-dependencies'});
 root.createEl('h3',{text:writerUi('Preparações e consequências','Setups and payoffs')});
 root.createEl('p',{cls:'writer-v7-muted',text:writerUi('Visualização das relações entre cenas existentes. Use setup_scenes para a preparação de uma cena e payoff_scenes para as consequências. A ordem Longform continua sendo a fonte da sequência.','Visualizes links between existing scenes. setup_scenes identifies what prepares a scene; payoff_scenes identifies later outcomes. Longform order remains authoritative.')});
 const data=writerV7StableDependencies(writerV7RCSceneView(view,project));
 const stats=root.createEl('p',{cls:'writer-v7-muted',text:data.edges.length+' '+writerUi('conexões','connections')+' · '+data.warnings.length+' '+writerUi('avisos','warnings')});
 if(!data.edges.length)root.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma dependência cadastrada nas propriedades das cenas.','No scene dependencies in note properties yet.')});
 const list=root.createDiv({cls:'writer-v7-stable-dependency-list'});
 for(const e of data.edges){
  const row=list.createDiv({cls:'writer-v7-stable-dependency-row'});
  row.createEl('button',{text:e.from.title,cls:'writer-v7-stable-dependency-source'}).addEventListener('click',()=>view.openFile(e.from.file));
  row.createSpan({cls:'writer-v7-stable-dependency-arrow',text:'→',attr:{'aria-hidden':'true'}});
  row.createEl('button',{text:e.to.title,cls:'writer-v7-stable-dependency-destination'}).addEventListener('click',()=>view.openFile(e.to.file));
  if(e.types.length>1)row.createSpan({cls:'writer-v7-rc-chip',text:writerUi('Preparação + consequência','Setup + payoff')});
 }
 if(data.warnings.length){
  const details=root.createEl('details',{cls:'writer-v7-stable-dependency-warnings'});
  details.createEl('summary',{text:data.warnings.length+' '+writerUi('referências para revisar','references to review')});
  for(const warning of data.warnings){
   const item=details.createDiv({cls:'writer-v7-rc-continuity-row'});
   item.createEl('strong',{text:warning.reason});
   item.createEl('p',{text:warning.scene+' → '+warning.reference});
  }
 }
}
class WriterV7StableFeatures{
 constructor(plugin){this.plugin=plugin;}
 register(){
  const p=this.plugin;
  p.addCommand({id:'v7-open-book-series',name:writerUi('Longform: organizar séries de livros','Longform: organize book series'),callback:async()=>{
   await p.openProjects('project');
   const view=p.app.workspace.getLeavesOfType(PROJECT_VIEW)?.[0]?.view;
   if(view?.root)writerV7SeriesOpen(view);
  }});
  p.addCommand({id:'v7-open-story-dependencies',name:writerUi('Longform: preparar e conectar cenas','Longform: scene setups and payoffs'),callback:async()=>{
   await p.openProjects('structure');
   const view=p.app.workspace.getLeavesOfType(PROJECT_VIEW)?.[0]?.view;
   if(view?.root){view.writerV7RCSubtab='dependencies';await view.render();}
  }});
 }
}
