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
function writerV13BindSettingsTabs(nav,subnav){
 const bind=(strip,label)=>{
  if(!strip||strip.dataset.basicV13Keyboard==='1')return;
  strip.dataset.basicV13Keyboard='1';
  strip.setAttribute('role','tablist');
  strip.setAttribute('aria-label',label);
  strip.addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   if(event.altKey||event.ctrlKey||event.metaKey)return;
   const tabs=Array.from(strip.querySelectorAll('button[role="tab"]:not(:disabled)'));
   if(!tabs.length)return;
   let current=tabs.indexOf(event.target.closest?.('button[role="tab"]'));
   if(current<0)current=tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true');
   if(current<0)current=0;
   const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
    (current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   event.preventDefault();
   tabs[next].focus();
   tabs[next].click();
  });
 };
 const label=(pt,en)=>typeof writerUi==='function'?writerUi(pt,en):en;
 bind(nav,label('Categorias de configurações','Settings categories'));
 bind(subnav,label('Seções de configurações','Settings sections'));
}
