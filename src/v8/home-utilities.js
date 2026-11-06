'use strict';
/* Homepage utilities: calendar, native Web Viewer and conservative empty-tab detection. */
const WRITER_V8_HOME_ICONS=['house','book-open','feather','pen-line','notebook-pen','library','sparkles','sun','moon-star','flower-2','rocket','pencil','book','books','bookmark','star','heart','lightbulb','brain','graduation-cap','file-text','folder','archive','palette','brush','wand-sparkles','calendar-days','clock','pencil-line','notebook','pen','library-big','layout-dashboard','globe','leaf','coffee','music','headphones','flag','compass','map','gem','trophy','shield','user','users','image','images','flame','cloud','settings'];
function writerV8HomeIconName(value){
 const name=String(value||'').trim();
 if(WRITER_V8_HOME_ICONS.includes(name))return name;
 if(/^[a-z][a-z0-9-]{0,59}$/.test(name)&&
    typeof writerV9AvailableIcons==='function'&&writerV9AvailableIcons().includes(name))return name;
 return 'book-open';
}
function writerV8HomeImageURL(plugin,input){
 const raw=String(input||'').trim();
 if(!raw||raw.length>600)return '';
 if(/^https:\/\//i.test(raw)){
  try{const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch(_){return '';}
 }
 if(/^[a-z]+:/i.test(raw)||raw.includes('..')||/[\r\n]/.test(raw))return '';
 const path=raw.replace(/^\[\[/,'').replace(/\]\]$/,'').split('|')[0].trim();
 const file=plugin.app.metadataCache?.getFirstLinkpathDest?.(path,'')||plugin.app.vault.getAbstractFileByPath?.(path);
 if(!(file instanceof TFile)||!/^(png|jpe?g|webp|gif|avif|svg)$/i.test(file.extension))return '';
 return plugin.app.vault.getResourcePath?.(file)||'';
}
function writerV8HomeValidURL(input){
 const raw=String(input||'').trim();
 if(!raw||raw.length>2048||/[\s\u0000-\u001f]/.test(raw))return '';
 let candidate=raw;
 if(/^www\./i.test(candidate))candidate='https://'+candidate;
 else if(!/^[a-z][a-z0-9+.-]*:/i.test(candidate)&&/^[\p{L}\d-]+(?:\.[\p{L}\d-]+)+(?:[/:?#].*)?$/u.test(candidate))
  candidate='https://'+candidate;
 try{
  const parsed=new URL(candidate);
  if(!['http:','https:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password)return '';
  return parsed.href;
 }catch(_){return '';}
}
function writerV8HomeIsMobile(plugin){
 return Boolean(plugin.app?.isMobile||require('obsidian').Platform?.isMobile);
}
function writerV8HomeWebViewerEnabled(plugin){
 const internal=plugin.app?.internalPlugins;
 const instance=internal?.getPluginById?.('webviewer')||internal?.plugins?.webviewer;
 return Boolean(instance?.enabled===true);
}
const WRITER_V8_WEB_ENGINES=[
 ['surfing','Surfing'],
 ['google','Google'],['duckduckgo','DuckDuckGo'],['bing','Bing'],
 ['yahoo','Yahoo'],['wikipedia','Wikipedia']
];
const WRITER_V8_WEB_ENGINE_URLS={
 google:'https://www.google.com/search?q=',duckduckgo:'https://duckduckgo.com/?q=',
 bing:'https://www.bing.com/search?q=',yahoo:'https://search.yahoo.com/search?p=',
 wikipedia:'https://en.wikipedia.org/w/index.php?search='
};
function writerV8HomeSurfing(plugin){
 const manager=plugin.app?.plugins;
 const surfing=manager?.plugins?.surfing;
 if(!surfing)return null;
 // A loaded plugin object alone does not mean Surfing is enabled. Check the
 // live Obsidian plugin registry so disabling Surfing hides the home omnibox.
 const enabled=manager?.enabledPlugins;
 if(typeof enabled?.has==='function')return enabled.has('surfing')?surfing:null;
 if(Array.isArray(enabled))return enabled.includes('surfing')?surfing:null;
 if(typeof manager?.isEnabled==='function')return manager.isEnabled('surfing')?surfing:null;
 return null;
}
function writerV8HomeSearchURL(plugin,input){
 const query=String(input||'').trim();
 if(!query||query.length>500||/[\u0000-\u001f]/.test(query))
  throw Error(writerUi('Digite uma pesquisa válida.','Enter a valid web search.'));
 const direct=writerV8HomeValidURL(query);
 if(direct)return direct;
 const cfg=plugin.settings?.v8Finish||{};
 const surfing=writerV8HomeSurfing(plugin);
 let selected=String(cfg.homeWebSearchEngine||'surfing').toLowerCase();
 if(selected==='surfing')
  selected=String(surfing?.settings?.defaultSearchEngine||'google').toLowerCase();
 let base=WRITER_V8_WEB_ENGINE_URLS[selected];
 if(!base&&surfing){
  const custom=surfing.settings?.customSearchEngine;
  const engine=Array.isArray(custom)?custom.find(x=>String(x.name||'').toLowerCase()===selected):null;
  if(engine?.url)base=engine.url;
 }
 base=String(base||WRITER_V8_WEB_ENGINE_URLS.google);
 // Custom Surfing search engines are URL prefixes, never script protocols.
 let candidate;
 try{
  const url=new URL(base);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Unsafe engine');
  candidate=base.includes('%s')?base.replaceAll('%s',encodeURIComponent(query)):
   base.includes('{query}')?base.replaceAll('{query}',encodeURIComponent(query)):
   base+encodeURIComponent(query);
 }catch(_){candidate=WRITER_V8_WEB_ENGINE_URLS.google+encodeURIComponent(query);}
 const result=writerV8HomeValidURL(candidate);
 if(!result)throw Error(writerUi('Busca web inválida.','Invalid web search URL.'));
 return result;
}
async function writerV8HomeOpenURL(plugin,input){
 const url=writerV8HomeValidURL(input);
 if(!url)throw Error(writerUi('Use um endereço HTTP ou HTTPS válido.','Enter a valid HTTP or HTTPS address.'));
 const mobile=writerV8HomeIsMobile(plugin);
 const preference=plugin.settings?.v8Finish?.homeWebSearchTarget||'auto';
 if(!mobile&&preference!=='external'){
  const surfing=writerV8HomeSurfing(plugin);
  if(surfing&&(preference==='surfing'||preference==='auto')){
   const leaf=plugin.app.workspace.getLeaf?.('tab');
   if(leaf){
    try{
     await leaf.setViewState({type:'surfing-view',state:{url},active:true});
     if(leaf.getViewState?.()?.type==='surfing-view')return 'surfing';
    }catch(error){console.warn('[Basic AI] Surfing browser unavailable:',error);}
   }
  }
  if(writerV8HomeWebViewerEnabled(plugin)){
   const leaf=plugin.app.workspace.getLeaf?.('tab');
   if(leaf){
    try{
     await leaf.setViewState({type:'webviewer',state:{url,navigate:true},active:true});
     if(leaf.getViewState?.()?.type==='webviewer')return 'webviewer';
    }catch(error){console.warn('[Basic AI] Native Web Viewer unavailable:',error);}
   }
  }
 }
 // Surfing is desktop-only; mobile always delegates to the external browser.
 const scope=plugin.app.workspace.containerEl?.ownerDocument?.defaultView || (typeof window!=='undefined'?window:null);
 if(typeof scope?.open==='function'){scope.open(url,mobile?'_system':'_blank');return 'external';}
 throw Error(writerUi('Navegador externo indisponível.','External browser unavailable.'));
}
function writerV8HomeCalendarCells(year,month){
 if(!Number.isInteger(year)||!Number.isInteger(month)||month<0||month>11)return [];
 const first=new Date(year,month,1);
 const monday=(first.getDay()+6)%7;
 const count=new Date(year,month+1,0).getDate();
 return Array.from({length:Math.ceil((monday+count)/7)*7},(_,i)=>{
  const day=i-monday+1;
  return day>0&&day<=count?day:null;
 });
}
function writerV8HomeRenderCalendar(view,parent){
 const doc=parent.ownerDocument;
 const clock=parent.createDiv({cls:'writer-v8-home-clock',attr:{'aria-label':writerUi('Hora local','Local time')}});
 const digits=clock.createEl('strong',{cls:'writer-v8-home-clock-digits'});
 const date=clock.createSpan({cls:'writer-v8-home-clock-date'});
 const calendar=parent.createDiv({cls:'writer-v8-home-calendar'});
 const locale=writerUi('pt-BR','en-US');
 let now=new Date(),year=now.getFullYear(),month=now.getMonth(),lastDay='';
 const bar=calendar.createDiv({cls:'writer-v8-home-calendar-bar'});
 const prev=bar.createEl('button',{text:'‹',attr:{type:'button','aria-label':writerUi('Mês anterior','Previous month')}});
 const monthTitle=bar.createEl('strong');
 const next=bar.createEl('button',{text:'›',attr:{type:'button','aria-label':writerUi('Próximo mês','Next month')}});
 const todayBtn=bar.createEl('button',{text:writerUi('Hoje','Today'),cls:'writer-v8-home-calendar-today',attr:{type:'button'}});
 const days=calendar.createDiv({cls:'writer-v8-home-calendar-days',attr:{role:'grid','aria-label':writerUi('Calendário mensal','Monthly calendar')}});
 const week=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2024,0,1+i)));
 const draw=()=>{
  days.empty();
  const heading=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(year,month,1));
  monthTitle.setText(heading.charAt(0).toLocaleUpperCase(locale)+heading.slice(1));
  for(const label of week)days.createSpan({cls:'writer-v8-home-calendar-weekday',text:label.slice(0,3)});
  for(const day of writerV8HomeCalendarCells(year,month)){
   const cell=days.createSpan({cls:'writer-v8-home-calendar-day'+(day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear()?' is-today':'')});
   if(day===null)cell.setAttribute('aria-hidden','true');
   else{
    const button=cell.createEl('button',{text:String(day),attr:{type:'button','aria-label':String(day)}});
    button.addEventListener('click',()=>void view.plugin.writerCalendarOpen?.(writerV83DateOf(new Date(year,month,day))));
    if(day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear())cell.setAttribute('aria-current','date');
   }
  }
 };
 const refresh=()=>{
  now=new Date();
  digits.setText(new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false}).format(now));
  const stamp=now.toDateString();
  date.setText(new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long'}).format(now));
  if(stamp!==lastDay){lastDay=stamp;draw();}
 };
 const move=diff=>{
  const target=new Date(year,month+diff,1);year=target.getFullYear();month=target.getMonth();draw();
 };
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 todayBtn.addEventListener('click',()=>{now=new Date();year=now.getFullYear();month=now.getMonth();draw();});
 refresh();
 // The view calls this only while mounted; never redraws the entire homepage.
 view.writerV8ClockRefresh=refresh;
}
function writerV8HomeIsRootEmpty(leaf){
 if(!leaf||typeof leaf.getViewState!=='function')return false;
 try{return leaf.getViewState()?.type==='empty'&&leaf.view?.getViewType?.()==='empty';}
 catch(_){return false;}
}
function writerV8HomeAttachedEmpty(workspace){
 const empty=[];
 if(typeof workspace.iterateRootLeaves!=='function')return empty;
 workspace.iterateRootLeaves(leaf=>{if(writerV8HomeIsRootEmpty(leaf))empty.push(leaf);});
 return empty;
}
