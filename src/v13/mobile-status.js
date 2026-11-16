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
  nav?.classList.remove('writer-mobile-status-navbar','writer-mobile-status-navbar-fit','writer-mobile-status-navbar-wrap');
  nav?.style.removeProperty('--writer-mobile-status-navbar-min');
  app.classList.remove('writer-mobile-status-overlay');
  nav=row=word=read=mode=timer=null;
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
 const setVisible=()=>{
  if(!row)return;
  keyboard=keyboardOpen();
  row.hidden=keyboard;
  const style=win.getComputedStyle(nav);
  nav.classList.toggle('writer-mobile-status-navbar-wrap',style.display.includes('flex')&&style.flexDirection?.startsWith('row'));
  nav.classList.remove('writer-mobile-status-navbar-fit');
  nav.style.removeProperty('--writer-mobile-status-navbar-min');
  if(!keyboard){
   const rowBounds=row.getBoundingClientRect(),navBounds=nav.getBoundingClientRect();
   const endGap=(parseFloat(style.paddingBottom)||0)+(parseFloat(style.borderBottomWidth)||0);
   const overflow=rowBounds.bottom+endGap-navBounds.bottom;
   if(overflow>1&&navBounds.height>0){
    nav.style.setProperty('--writer-mobile-status-navbar-min',Math.ceil(navBounds.height+overflow)+'px');
    nav.classList.add('writer-mobile-status-navbar-fit');
   }
  }
  app.classList.toggle('writer-mobile-status-overlay',!keyboard&&(style.position==='fixed'||style.position==='absolute'));
 };
 const renderTimer=()=>{
  if(!timer)return;
  const pomodoro=plugin.writerV931Pomodoro,cfg=plugin.settings.v931Pomodoro;
  const value=pomodoro&&cfg?.enabled&&cfg.statusBar?writerV931PomodoroClock(pomodoro.remaining()):'';
  show(timer,value,value?msg('Pomodoro: abrir painel','Pomodoro: open panel')+' · '+value:'');
 };
 const syncLayout=()=>{
  if(stopped)return false;
  const target=plugin.settings.mobileStatusBar!==false?app.querySelector(WRITER_MOBILE_STATUS_NAV):null;
  if(!target){unmount();return false;}
  if(nav!==target||row?.parentNode!==target){
   unmount();
   nav=target;
   nav.classList.add('writer-mobile-status-navbar');
   row=make(nav,'div',WRITER_MOBILE_STATUS_ROW);
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
  setVisible();
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
 const onViewport=()=>{
  if(stopped)return;
  if(!row)return;
  const wasKeyboard=keyboard;
  setVisible();
  if(wasKeyboard&&!keyboard)queue();
 };
 let lastPath=null;
 const onFile=()=>{
  if(!row)return;
  const path=ws.getActiveFile?.()?.path;
  if(path!==lastPath){show(word);show(read);show(mode);lastPath=path;}
  queue();
 };
 const observe=typeof win.MutationObserver==='function'?new win.MutationObserver(records=>{
  if(stopped||plugin.settings.mobileStatusBar===false)return;
  if(native&&records.some(record=>native.contains(record.target)))queue();
  if(nav&&(!app.contains(nav)||row?.parentNode!==nav)||native&&native.parentNode!==row||
   records.some(record=>Array.from(record.addedNodes).some(el=>
    el.matches?.(WRITER_MOBILE_STATUS_NAV+',.status-bar')||el.querySelector?.(WRITER_MOBILE_STATUS_NAV)))){
   refresh();
  }
 }):null;
 plugin.writerMobileStatus={refresh,renderTimer};
 for(const event of ['active-leaf-change','file-open'])plugin.registerEvent(ws.on(event,onFile));
 for(const event of ['editor-change','layout-change'])plugin.registerEvent(ws.on(event,event==='layout-change'?refresh:queue));
 plugin.registerEvent(plugin.app.vault.on('modify',file=>{if(file?.path===ws.getActiveFile?.()?.path)queue();}));
 win.addEventListener('resize',onViewport);
 win.visualViewport?.addEventListener('resize',onViewport);
 plugin.register(()=>{
  stopped=true;
  observe?.disconnect();
  win.removeEventListener('resize',onViewport);
  win.visualViewport?.removeEventListener('resize',onViewport);
  unmount();
  delete plugin.writerMobileStatus;
 });
 observe?.observe(app,{childList:true,subtree:true});
 ws.onLayoutReady?.(refresh);
 refresh();
}
