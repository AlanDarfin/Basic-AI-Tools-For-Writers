'use strict';
/**
 * Basic v13 UI foundation. Shared, deterministic helpers only.
 * Never registers/replaces Obsidian commands, removes old settings, or writes data.
 *
 * Example: writerV13RankCommands(writerV13CommandCatalog(plugin), 'format bold');
 * Example: writerV13BindSettingsTabs(nav, subnav);
 */
function writerV13SearchText(value){
 return String(value==null?'':value).normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
}
function writerV13CommandCatalog(plugin){
 const registry=plugin?.app?.commands;
 const items=[];
 const used=new Set();
 const add=(item,id)=>{
  const key=String(item?.id||id||'').trim();
  const name=String(item?.name||'').trim();
  if(!key||!name||used.has(key))return;
  used.add(key);items.push({id:key,name});
 };
 const list=registry?.listCommands?.();
 if(Array.isArray(list))for(const item of list)add(item);
 for(const [id,item] of Object.entries(registry?.commands||{}))add(item,id);
 return items;
}
function writerV13CommandScore(command,query){
 const name=writerV13SearchText(command?.name);
 const id=writerV13SearchText(command?.id);
 const search=writerV13SearchText(query);
 if(!search)return id.startsWith('basic-ai-tool-for-writers:')?10:0;
 const pieces=search.split(/\s+/).filter(Boolean);
 let score=0;
 for(const term of pieces){
  const nameIndex=name.indexOf(term);
  const idIndex=id.indexOf(term);
  if(nameIndex<0&&idIndex<0)return -1;
  if(name===term||id===term)score+=1000;
  else if(name.startsWith(term))score+=450;
  else if(nameIndex>=0&&(nameIndex===0||/[\s:./-]/.test(name[nameIndex-1])))score+=240;
  else if(nameIndex>=0)score+=120;
  else if(id.startsWith(term))score+=80;
  else score+=30;
 }
 if(name===search)score+=500;
 if(id.startsWith('basic-ai-tool-for-writers:'))score+=8;
 return score;
}
function writerV13RankCommands(commands,query,limit=70){
 const max=Math.max(1,Math.min(500,Math.trunc(Number(limit)||70)));
 const text=writerV13SearchText(query);
 return (Array.isArray(commands)?commands:[])
  .map(command=>({command,score:writerV13CommandScore(command,text)}))
  .filter(item=>item.score>=0)
  .sort((a,b)=>b.score-a.score||
   String(a.command.name).localeCompare(String(b.command.name),undefined,{sensitivity:'base'})||
   String(a.command.id).localeCompare(String(b.command.id)))
  .slice(0,max).map(item=>item.command);
}
function writerV137SyncSettingsTabs(strip){
 const tabs=Array.from(strip?.querySelectorAll?.('button[role="tab"]:not(:disabled)')||[]);
 const selected=tabs.find(tab=>tab.getAttribute('aria-selected')==='true')||tabs[0];
 for(const tab of tabs)tab.tabIndex=tab===selected?0:-1;
}
function writerV13BindSettingsTabs(nav,subnav){
 const bind=(strip,label)=>{
  if(!strip||strip.dataset.basicV13Keyboard==='1')return;
  strip.dataset.basicV13Keyboard='1';
  strip.setAttribute('role','tablist');
  strip.setAttribute('aria-label',label);
  writerV137SyncSettingsTabs(strip);
  strip.addEventListener('click',()=>writerV137SyncSettingsTabs(strip));
  strip.addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing||event.keyCode===229)return;
   const tabs=Array.from(strip.querySelectorAll('button[role="tab"]:not(:disabled)'));
   if(!tabs.length)return;
   let current=tabs.indexOf(event.target.closest?.('button[role="tab"]'));
   if(current<0)current=tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true');
   if(current<0)current=0;
   const direction=strip.ownerDocument?.defaultView?.getComputedStyle?.(strip)?.direction==='rtl'?-1:1;
   const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
    (current+(event.key==='ArrowRight'?direction:-direction)+tabs.length)%tabs.length;
   event.preventDefault();
   tabs[next].focus();
   tabs[next].click();
   writerV137SyncSettingsTabs(strip);
   tabs[next].scrollIntoView?.({block:'nearest',inline:'nearest'});
  });
 };
 const label=(pt,en)=>typeof writerUi==='function'?writerUi(pt,en):en;
 bind(nav,label('Categorias de configurações','Settings categories'));
 bind(subnav,label('Seções de configurações','Settings sections'));
}

/** Protect card legibility when a 720p view is split with Obsidian sidebars. */
function writerV131MinWidgetColumns(width,gap=12){
 const w=Math.max(1,Number(width)||1),g=Math.max(0,Number(gap)||0);
 if(w<560)return 12;
 const step=Math.max(1,(w-11*g)/12+g);
 return Math.max(3,Math.min(12,Math.ceil((205+g)/step)));
}
/** In a masonry grid, use x for peers in the same row and y otherwise. */
function writerV131WidgetDropAfter(bounds,x,y){
 if(!bounds)return false;
 const cy=bounds.top+bounds.height/2;
 return Math.abs(y-cy)<=Math.min(bounds.height/3,35)?
  x>bounds.left+bounds.width/2:y>cy;
}
/** Small, bounded edit distance for search typos, with no network calls. */
function writerV131TokenScore(hay,term){
 if(!term)return 0;
 if(hay===term)return 160;
 if(hay.startsWith(term))return 115;
 if(hay.includes(term))return 75;
 if(term.length<4)return -1;
 for(const word of hay.split(/[^a-z0-9]+/).filter(Boolean)){
  if(word.startsWith(term.slice(0,Math.min(4,term.length))))return 45;
  if(Math.abs(word.length-term.length)>2)continue;
  let prev=Array.from({length:term.length+1},(_,i)=>i);
  for(let i=1;i<=word.length;i++){
   const next=[i];
   for(let j=1;j<=term.length;j++)
    next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(word[i-1]===term[j-1]?0:1));
   prev=next;
  }
  if(prev[term.length]<=(term.length>=7?2:1))return 35-prev[term.length]*5;
 }
 return -1;
}
/** Score titles first, then category/description/aliases, then synonyms. */
function writerV131RankSettings(entries,query,limit=18){
 const q=writerV13SearchText(query)
  .replace(/\bsubescrito\b/g,'subscrito').replace(/\bsuperescrito\b/g,'sobrescrito');
 const words=q.split(/\s+/).filter(Boolean);
 if(!words.length)return [];
 const synonyms={
  grade:['grid','colunas','widgets'],arrastar:['drag','dragger','grip','mover'],
  redimensionar:['resize','largura','altura','tamanho'],
  pesquisar:['search','busca','pesquisa'],imagem:['image','foto','banner'],
  atalho:['hotkey','teclado','comando'],alinhamento:['align','justificar','centralizar'],
  compactar:['compacto','tamanho','densidade'],texto:['escrita','markdown','fonte']
 };
 return (Array.isArray(entries)?entries:[]).map(entry=>{
  const title=writerV13SearchText(entry?.title),context=writerV13SearchText(
   [entry?.section,entry?.description,entry?.keywords,entry?.id].join(' '));
  let score=0;
  for(const term of words){
   const first=writerV131TokenScore(title,term);
   const second=writerV131TokenScore(context,term);
   let best=Math.max(first>=0?first*3:-1,second);
   for(const synonym of synonyms[term]||[]){
    const synonymScore=Math.max(writerV131TokenScore(title,synonym),
     writerV131TokenScore(context,synonym));
    if(synonymScore>=0)best=Math.max(best,synonymScore/2);
   }
   if(best<0)return null;
   score+=best;
  }
  if(title===q)score+=500;
  const aliases=writerV13SearchText(entry?.aliases).split(/\s+/).filter(Boolean);
  if(aliases.length&&words.every(word=>aliases.includes(word)))score+=500;
  if(entry?.source==='category')score-=50;
  return {...entry,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||
  String(a.title).localeCompare(String(b.title),undefined,{sensitivity:'base'}))
 .slice(0,Math.max(1,Math.min(40,Math.trunc(Number(limit)||18))));
}

// Scope status-bar sizing to hosts with Basic controls; restore on plugin unload.
function writerV132ProtectStatusBar(plugin,item){
 const bar=item?.parentElement;
 if(!bar?.classList?.contains('status-bar'))return;
 const already=bar.classList.contains('writer-v132-status-host');
 bar.classList.add('writer-v132-status-host');
 if(!already)plugin.register?.(()=>bar.classList.remove('writer-v132-status-host'));
}

/** Keep horizontal project tabs usable without a pointer or a visible scrollbar. */
function writerV136BindProjectTabs(strip){
 if(!strip||strip.dataset.basicV136Keyboard==='1')return;
 strip.dataset.basicV136Keyboard='1';
 strip.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
  const tabs=Array.from(strip.querySelectorAll('button[role="tab"]:not(:disabled)'));
  if(!tabs.length)return;
  const target=event.target.closest?.('button[role="tab"]');
  let index=tabs.indexOf(target);
  if(index<0)return;
  const direction=strip.ownerDocument?.defaultView?.getComputedStyle?.(strip)?.direction==='rtl'?-1:1;
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
   (index+(event.key==='ArrowRight'?direction:-direction)+tabs.length)%tabs.length;
  event.preventDefault();
  tabs[next].focus();tabs[next].click();
  tabs[next].scrollIntoView?.({block:'nearest',inline:'nearest'});
 });
}

/** Named tool panes let compact layouts follow the pane width, not the window. */
function writerV136DecorateToolPanels(view){
 view.panels?.definition?.addClass('writer-definition-panel');
 view.panels?.translation?.addClass('writer-translation-panel');
 view.reviewStatus?.setAttribute('role','status');
 view.reviewStatus?.setAttribute('aria-live','polite');
}

/** Native settings navigation is compact only while Basic owns the page. */
function writerV136MarkSettingsHost(tab,active){
 tab.writerV136SettingsHost?.classList.remove('writer-v136-settings-host');
 tab.writerV136SettingsHost=null;
 if(!active)return;
 const host=tab.containerEl?.closest?.('.mod-settings');
 if(host){host.classList.add('writer-v136-settings-host');tab.writerV136SettingsHost=host;}
}
