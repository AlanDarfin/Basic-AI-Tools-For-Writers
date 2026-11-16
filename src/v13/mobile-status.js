'use strict';
const WRITER_MOBILE_STATUS_NAV='.mobile-navbar';
const WRITER_MOBILE_STATUS_ROW='writer-mobile-status';
function writerMobileStatusPlatform(plugin){
 return plugin?.app?.isMobile===true||require('obsidian').Platform?.isMobile===true;
}
function writerMobileStatusSettings(plugin,panel){
 if(!writerMobileStatusPlatform(plugin))return;
 new Setting(panel).setName(writerUi('Barra de status no celular','Mobile status bar'))
  .setDesc(writerUi('Exibe os indicadores abaixo dos botões de navegação do Obsidian.','Shows status indicators below Obsidian’s navigation buttons.'))
  .addToggle(toggle=>toggle.setValue(plugin.settings.mobileStatusBar!==false).onChange(async enabled=>{
   plugin.settings.mobileStatusBar=enabled;
   plugin.writerMobileStatus?.refresh();
   await plugin.saveSettings();
  }));
}
function writerMobileStatusRegister(plugin){
 if(!writerMobileStatusPlatform(plugin))return;
 const ws=plugin.app.workspace;
 const app=ws.containerEl?.closest?.('.app-container');
 const doc=app?.ownerDocument,win=doc?.defaultView;
 if(!app||!win)return;
 const {MarkdownView}=require('obsidian');
 const msg=writerUi;
 let nav=null,row=null,word=null,read=null,mode=null,timer=null,native=null,anchor=null;
 let stopped=false,queued=null,statsToken=0,keyboard=false,viewportWidth=0,viewportMax=0;
 const make=(parent,tag,cls)=>{
  const el=doc.createElement(tag);el.className=cls;parent.appendChild(el);return el;
 };
 const insets=make(app,'div','writer-mobile-safe-insets');
 insets.setAttribute('aria-hidden','true');
 const indicator=(cls,icon,tag='span')=>{
  const el=make(row,tag,'writer-mobile-status-item '+cls);
  const glyph=make(el,'span','writer-mobile-status-glyph');
  glyph.setAttribute('aria-hidden','true');
  require('obsidian').setIcon?.(glyph,icon);
  return {el,text:make(el,'span','writer-mobile-status-text')};
 };
 const show=(item,text='',label=text)=>{
  if(item.text.textContent!==text)item.text.textContent=text;
  if(item.el.title!==label){item.el.title=label;item.el.setAttribute('aria-label',label);}
  item.el.hidden=!text;
 };
 const restoreNative=()=>{
  if(native?.parentNode===row){
   if(anchor?.parentNode)anchor.replaceWith(native);
   else app.appendChild(native);
  }
  native?.classList.remove('writer-mobile-status-native');
  anchor?.remove();anchor=null;native=null;
 };
 const unmount=()=>{
  if(queued!==null){win.clearTimeout(queued);queued=null;}
  statsToken++;
  restoreNative();
  row?.remove();
  clearOffset();
  row=word=read=mode=timer=null;
 };
 const keyboardOpen=()=>{
  const style=win.getComputedStyle?.(doc.body);
  const inset=parseFloat(style?.getPropertyValue('--keyboard-height'));
  const viewport=win.visualViewport;
  if(!viewport)return inset>0;
  const width=win.innerWidth||viewport.width;
  const height=viewport.height*(viewport.scale||1);
  if(Math.abs(width-viewportWidth)>2){viewportWidth=width;viewportMax=height;}
  viewportMax=Math.max(viewportMax,height);
  return inset>0||Math.max(win.innerHeight||0,viewportMax)-height>110;
 };
 const homeProps=new Set(),topProps=new Set(),observed=new Set();
 const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>scheduleLayout()):null;
 const flowBar=style=>style.position!=='fixed'&&style.position!=='absolute';
 const clearOffset=()=>{
  nav?.classList.remove('writer-mobile-nav-lifted','writer-mobile-nav-lifted-by-translation');
  nav?.style.removeProperty('--writer-mobile-nav-bottom');
  nav?.style.removeProperty('--writer-mobile-nav-lift');
  lift=0;
 };
 let lift=0,baseBottom=null,layoutFrame=null;
 const visible=el=>{
  if(!el||el.hidden)return null;
  const rect=el.getBoundingClientRect?.(),style=win.getComputedStyle(el);
  return rect?.width>0&&rect.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&Number.parseFloat(style.opacity)!==0?rect:null;
 };
 const apply=(tracked,property,next)=>{
  for(const node of tracked)if(!next.has(node)){node.style.removeProperty(property);tracked.delete(node);}
  for(const [node,value] of next){
   const css=Math.ceil(value)+'px';
   if(node.style.getPropertyValue(property)!==css)node.style.setProperty(property,css);
   tracked.add(node);
  }
 };
 const place=()=>{
  if(stopped)return;
  const wasKeyboard=keyboard;
  keyboard=keyboardOpen();
  const vv=win.visualViewport,area={
   left:vv?.offsetLeft||0,top:vv?.offsetTop||0,width:vv?.width||win.innerWidth,height:vv?.height||win.innerHeight
  };
  const css=win.getComputedStyle(doc.body),insetStyle=win.getComputedStyle(insets);
  const safe=side=>Math.max(0,parseFloat(css.getPropertyValue('--safe-area-inset-'+side))||0,
   parseFloat(insetStyle.getPropertyValue('padding-'+side))||0);
  const floor=area.top+area.height-Math.max(safe('bottom'),4);
  const ceiling=area.top+safe('top');
  const mobileToolbar=app.querySelector('.mobile-toolbar');
  const nativeToolbarBounds=!keyboard&&visible(mobileToolbar);
  const navBounds=visible(nav);
  const style=nav?win.getComputedStyle(nav):null;
  const shown=navBounds&&navBounds.bottom>ceiling&&navBounds.top<floor&&!doc.body.classList.contains('is-hidden-nav');
  const floating=style&&!flowBar(style);
  const watch=new Set([nav,mobileToolbar].filter(Boolean));
  if(row){
   const hidden=!shown||keyboard;
   if(row.hidden!==hidden)row.hidden=hidden;
   row.classList.toggle('writer-mobile-status-floating',floating);
   if(floating&&row.parentNode!==app)app.appendChild(row);
   else if(!floating&&nav.nextSibling!==row)nav.after(row);
  }
  let navTop=shown?navBounds.top+lift:null,rowTop=null;
  if(row&&!row.hidden&&floating){
   if(!lift)baseBottom=parseFloat(style.bottom);
   const height=row.getBoundingClientRect().height||30;
   const naturalBottom=navBounds.bottom+lift,gap=4;
   const target=Math.min(naturalBottom+gap,floor-height);
   const required=Math.max(0,Math.ceil(naturalBottom+gap-target));
   if(navTop-required<=ceiling+8){
    row.hidden=true;clearOffset();
   }else{
    if(required){
     const useBottom=Number.isFinite(baseBottom);
     const key=useBottom?'--writer-mobile-nav-bottom':'--writer-mobile-nav-lift';
     const amount=useBottom?baseBottom+required:-required;
     const value=amount+'px';
     if(nav.style.getPropertyValue(key)!==value)nav.style.setProperty(key,value);
     const marker=useBottom?'writer-mobile-nav-lifted':'writer-mobile-nav-lifted-by-translation';
     if(!nav.classList.contains(marker))nav.classList.add(marker);
     lift=required;
    }else if(lift)clearOffset();
    navTop-=required;rowTop=target;
    const left=Math.max(area.left+safe('left')+4,navBounds.left);
    const right=Math.min(area.left+area.width-safe('right')-4,navBounds.right);
    const styles={top:target,left,width:Math.max(0,right-left)};
    for(const [key,value] of Object.entries(styles)){
     const property='--writer-mobile-status-'+key,css=Math.round(value)+'px';
     if(row.style.getPropertyValue(property)!==css)row.style.setProperty(property,css);
    }
   }
  }else if(lift)clearOffset();
  const homes=new Map(),editors=new Map();
  for(const home of app.querySelectorAll('.writer-v8-home')){
   const bounds=visible(home);if(!bounds)continue;
   watch.add(home);
   const upper=[floating?navTop:null,rowTop,
    nativeToolbarBounds&&nativeToolbarBounds.bottom>bounds.top?nativeToolbarBounds.top:null]
    .filter(n=>n!==null&&n>=bounds.top&&n<bounds.bottom);
   if(!keyboard&&upper.length)homes.set(home,Math.max(0,bounds.bottom-Math.min(...upper)+8));
  }
  for(const toolbar of app.querySelectorAll('.writer-v9-toolbar-docked > .writer-v9-format-toolbar.is-top')){
   const host=toolbar.parentElement,bounds=visible(host);if(!bounds)continue;
   const header=host.closest?.('.workspace-leaf-content')?.querySelector?.('.view-header');
   if(header)watch.add(header);
   watch.add(host);
   const headerBox=visible(header);
   const headerEnd=headerBox&&headerBox.top<bounds.top+120?headerBox.bottom:ceiling;
   const inset=Math.max(0,Math.max(ceiling,headerEnd)-bounds.top);
   if(inset)editors.set(host,inset);
  }
  apply(homeProps,'--writer-mobile-home-clearance',homes);
  apply(topProps,'--writer-mobile-editor-top-clearance',editors);
  if(resize){
   for(const node of observed)if(!watch.has(node)){resize.unobserve(node);observed.delete(node);}
   for(const node of watch)if(!observed.has(node)){resize.observe(node);observed.add(node);}
  }
  if(wasKeyboard&&!keyboard)queue();
 };
 const scheduleLayout=()=>{
  if(stopped||layoutFrame!==null)return;
  if(!win.requestAnimationFrame){place();return;}
  layoutFrame=win.requestAnimationFrame(()=>{layoutFrame=null;place();});
 };
 const renderTimer=()=>{
  if(!timer)return;
  const pomodoro=plugin.writerV931Pomodoro,cfg=plugin.settings.v931Pomodoro;
  const value=pomodoro&&cfg?.enabled&&cfg.statusBar?writerV931PomodoroClock(pomodoro.remaining()):'';
  show(timer,value,value?msg('Pomodoro: abrir painel','Pomodoro: open panel')+' · '+value:'');
 };
 const syncLayout=()=>{
  if(stopped)return false;
  const target=app.querySelector(WRITER_MOBILE_STATUS_NAV);
  if(nav!==target){unmount();nav=target;}
  if(!nav||plugin.settings.mobileStatusBar===false){if(row)unmount();scheduleLayout();return false;}
  if(!row||!app.contains(row)){
   if(row)unmount();
   row=make(app,'div',WRITER_MOBILE_STATUS_ROW);
   row.setAttribute('role','group');
   row.setAttribute('aria-label',msg('Barra de status','Status bar'));
   word=indicator('writer-mobile-status-words','text-cursor-input');
   read=indicator('writer-mobile-status-reading','book-open');
   mode=indicator('writer-mobile-status-mode','file-pen-line');
   timer=indicator('writer-mobile-status-timer','timer','button');
   timer.el.type='button';
   timer.el.addEventListener('click',()=>{void plugin.writerV931Pomodoro?.open();});
   for(const item of [word,read,mode,timer])item.el.hidden=true;
  }
  // Keep the original nodes and their event listeners, and put them back on unload.
  const available=Array.from(app.children).find(el=>el.classList.contains('status-bar'));
  if(available&&available!==native){
   restoreNative();
   anchor=doc.createComment('Basic mobile status original position');
   available.before(anchor);
   native=available;
   native.classList.add('writer-mobile-status-native');
   row.insertBefore(native,word.el);
  }
  scheduleLayout();
  renderTimer();
  return true;
 };
 const details=async()=>{
  const token=++statsToken;
  if(!row||keyboard)return;
  const file=ws.getActiveFile?.();
  const view=ws.getActiveViewOfType?.(MarkdownView);
  const editor=view?.file?.path===file?.path?view?.editor:null;
  if(file?.extension!=='md'){show(word);show(read);show(mode);return;}
  const viewMode=view?.file?.path===file.path&&!native?.querySelector('.plugin-editor-status')?view?.getMode?.():null;
  const modeName=viewMode==='preview'?msg('Leitura','Reading'):viewMode==='source'?msg('Edição','Editing'):'';
  show(mode,modeName);
  const nativeVisible=selector=>{
   const item=native?.querySelector(selector);
   return item&&!item.hidden&&win.getComputedStyle(item).display!=='none'?item:null;
  };
  const hasCount=Boolean(nativeVisible('.plugin-word-count')?.textContent?.trim());
  const config=plugin.settings.v6?.readingTime;
  const reading=Boolean(config?.status&&writerV6Allowed(plugin,'readingTime')&&
   writerV6ProjectToolAllowed(plugin,'readingTime',file.path)&&!nativeVisible('.writer-v6-reading-status')?.textContent?.trim());
  if(hasCount)show(word);
  if(!reading)show(read);
  if(hasCount&&!reading)return;
  let source;
  try{source=typeof editor?.getValue==='function'&&view?.getMode?.()!=='preview'?editor.getValue():await plugin.app.vault.cachedRead(file);}
  catch(_){if(token===statsToken&&row){show(word);show(read);}return;}
  if(stopped||!row||keyboard||token!==statsToken||ws.getActiveFile?.()?.path!==file.path)return;
  const result=writerV6ReadingEstimate(source,config||{});
  if(!hasCount)show(word,result.words.toLocaleString()+' '+msg('palavras','words'));
  if(reading)show(read,result.minutes+' '+msg('min leitura','min read'));
 };
 const queue=()=>{
  if(stopped||!row)return;
  statsToken++;
  if(queued!==null)win.clearTimeout(queued);
  queued=win.setTimeout(()=>{queued=null;void details();},150);
 };
 const refresh=()=>{if(syncLayout())queue();};
 const onViewport=scheduleLayout;
 const onResize=()=>{if(lift)clearOffset();scheduleLayout();};
 const geometry='.mobile-navbar,.mobile-toolbar,.view-header,.writer-v8-home,.writer-v9-toolbar-docked,.writer-v9-format-toolbar';
 const onTransition=event=>{if(event.target?.matches?.(geometry))scheduleLayout();};
 let lastPath=null;
 const onFile=()=>{
  if(!row)return;
  const path=ws.getActiveFile?.()?.path;
  if(path!==lastPath){show(word);show(read);show(mode);lastPath=path;}
  queue();
 };
 const observe=typeof win.MutationObserver==='function'?new win.MutationObserver(records=>{
  if(stopped)return;
  if(native&&records.some(record=>record.target&&native.contains(record.target)))queue();
  const added=(record,selector)=>Array.from(record.addedNodes||[]).some(el=>el!==row&&el!==native&&
   (el.matches?.(selector)||el.querySelector?.(selector)));
  if(nav&&!app.contains(nav)||row&&!app.contains(row)||native&&native.parentNode!==row||
   records.some(record=>added(record,WRITER_MOBILE_STATUS_NAV+',.status-bar'))){refresh();return;}
  if(records.some(record=>record.type==='attributes'&&(record.target===doc.body||record.target===app||
   record.target?.matches?.(geometry))||added(record,geometry)||
   Array.from(record.removedNodes||[]).some(el=>el.matches?.(geometry)||el.querySelector?.(geometry))))scheduleLayout();
 }):null;
 plugin.writerMobileStatus={refresh,renderTimer};
 for(const event of ['active-leaf-change','file-open'])plugin.registerEvent(ws.on(event,onFile));
 for(const event of ['editor-change','layout-change'])plugin.registerEvent(ws.on(event,event==='layout-change'?refresh:queue));
 plugin.registerEvent(plugin.app.vault.on('modify',file=>{if(file?.path===ws.getActiveFile?.()?.path)queue();}));
 win.addEventListener('resize',onResize);
 win.visualViewport?.addEventListener('resize',onViewport);
 win.visualViewport?.addEventListener('scroll',onViewport);
 app.addEventListener('transitionend',onTransition);
 plugin.register(()=>{
  stopped=true;
  observe?.disconnect();
  win.removeEventListener('resize',onResize);
  win.visualViewport?.removeEventListener('resize',onViewport);
  win.visualViewport?.removeEventListener('scroll',onViewport);
  app.removeEventListener('transitionend',onTransition);
  if(layoutFrame!==null)win.cancelAnimationFrame?.(layoutFrame);
  resize?.disconnect();
  insets.remove();
  apply(homeProps,'--writer-mobile-home-clearance',new Map());
  apply(topProps,'--writer-mobile-editor-top-clearance',new Map());
  unmount();
  delete plugin.writerMobileStatus;
 });
 observe?.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
 observe?.observe(doc.body,{attributes:true,attributeFilter:['class','style']});
 ws.onLayoutReady?.(refresh);
 refresh();
}
