'use strict';
/* Basic 11.1.2 — mobile sidebar panel management.
 * Native leaves are never recreated. Pinned types stay first in the bar,
 * survive restarts and are spared from "close others". A normal tap is intact. */
function writerV112PanelPrefs(plugin){
 const sidebar=writerV1010Merge(plugin.settings).sidebar;
 if(!sidebar.pinnedViews||typeof sidebar.pinnedViews!=='object')
  sidebar.pinnedViews={left:[],right:[]};
 for(const side of ['left','right']){
  const entries=sidebar.pinnedViews[side];
  sidebar.pinnedViews[side]=Array.isArray(entries)?
   [...new Set(entries.filter(x=>typeof x==='string'&&x.length<100))].slice(0,40):[];
 }
 if(sidebar.longPressMenu===undefined)sidebar.longPressMenu=true;
 return sidebar;
}
function writerV112SortPinned(plugin,side,entries){
 const pins=writerV112PanelPrefs(plugin).pinnedViews[side];
 return entries.slice().sort((a,b)=>Number(pins.includes(b.type))-Number(pins.includes(a.type)));
}
function writerV112ContextMenu(plugin,side,entry,x,y){
 const workspace=plugin.app.workspace,leaf=entry?.leaf;
 if(!leaf||writerV1010SideForLeaf(workspace,leaf)!==side)return false;
 const config=writerV112PanelPrefs(plugin),pins=config.pinnedViews[side];
 const pinned=pins.includes(entry.type),menu=new Menu(plugin.app);
 menu.addItem(item=>item.setTitle(pinned?writerUi('Desafixar painel','Unpin panel'):writerUi('Fixar painel','Pin panel'))
  .setIcon(pinned?'pin-off':'pin').onClick(async()=>{
   config.pinnedViews[side]=pinned?pins.filter(type=>type!==entry.type):[...pins,entry.type];
   await plugin.saveSettings();plugin.writerV1010Refresh?.();
  }));
 menu.addItem(item=>item.setTitle(writerUi('Fechar painel','Close panel')).setIcon('x')
  .onClick(async()=>{
   try{
    if(writerV1010SideForLeaf(workspace,leaf)===side)await leaf.detach?.();
    plugin.writerV1010Refresh?.();
   }catch(error){new Notice(writerUi('Não foi possível fechar o painel: ','Could not close panel: ')+String(error.message||error));}
  }));
 const others=writerV1010CollectLeaves(workspace,side).filter(x=>
  x.leaf!==leaf&&!pins.includes(x.type));
 if(others.length){
  menu.addSeparator();
  menu.addItem(item=>item.setTitle(writerUi('Fechar outros não fixados','Close other unpinned panels'))
   .setIcon('panel-top-close').onClick(async()=>{
    for(const other of others){
     if(config.pinnedViews[side].includes(other.type))continue;
     try{if(writerV1010SideForLeaf(workspace,other.leaf)===side)await other.leaf.detach?.();}
     catch(error){console.warn('[Basic] Sidebar close others:',error);}
    }
    plugin.writerV1010Refresh?.();
   }));
 }
 menu.showAtPosition?.({x:Number.isFinite(x)?x:96,y:Number.isFinite(y)?y:180});
 return true;
}
function writerV112HoldControl(plugin,button,side,entry){
 if(button.dataset.writerV112Hold==='1')return;
 button.dataset.writerV112Hold='1';
 const pin=writerV112PanelPrefs(plugin).pinnedViews[side].includes(entry.type);
 button.classList.toggle('writer-v112-pinned-tab',pin);
 if(pin)button.setAttribute('aria-label',(button.getAttribute('aria-label')||entry.type)+writerUi(' · fixado',' · pinned'));
 if(writerV112PanelPrefs(plugin).longPressMenu===false)return;
 let timer=null,startX=0,startY=0,suppressUntil=0;
 const cancel=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
 const open=(x,y)=>{cancel();suppressUntil=Date.now()+850;writerV112ContextMenu(plugin,side,entry,x,y);};
 button.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||event.button!==0)return;
  cancel();startX=event.clientX;startY=event.clientY;
  timer=setTimeout(()=>open(startX,startY),550);
 });
 button.addEventListener('pointermove',event=>{
  if(Math.hypot(event.clientX-startX,event.clientY-startY)>12)cancel();
 });
 for(const type of ['pointerup','pointercancel','pointerleave'])button.addEventListener(type,cancel);
 button.addEventListener('contextmenu',event=>{
  event.preventDefault();event.stopPropagation();
  if(Date.now()>suppressUntil)open(event.clientX,event.clientY);
 });
 button.addEventListener('keydown',event=>{
  if(event.key==='ContextMenu'||(event.key==='F10'&&event.shiftKey)){
   event.preventDefault();
   const r=button.getBoundingClientRect();
   open(r.left+r.width/2,r.top+r.height/2);
  }
 });
 button.addEventListener('click',event=>{
  if(Date.now()>suppressUntil)return;
  event.preventDefault();event.stopImmediatePropagation?.();suppressUntil=0;
 },true);
}
function writerV112SidebarWire(plugin,side,entries,bar){
 const buttons=[...(bar?.querySelectorAll?.('.writer-v1010-sidebar-button[data-view-type]')||[])];
 for(const entry of entries){
  const button=buttons.find(node=>node.getAttribute('data-view-type')===entry.type);
  if(button)writerV112HoldControl(plugin,button,side,entry);
 }
}
