/* Native companion controls keep their own DOM, handlers and preferences.
 * Selectors audited in Toolkit 2.9.17 and Snailkit 0.2.9; no settings are rewritten. */
function writerCompanionRect(rect){
 const left=Number(rect?.left),top=Number(rect?.top);
 const width=Number(rect?.width??(rect?.right-left)),height=Number(rect?.height??(rect?.bottom-top));
 return [left,top,width,height].every(Number.isFinite)&&width>0&&height>0?
  {left,top,width,height,right:left+width,bottom:top+height}:null;
}
function writerCompanionRectsOverlap(a,b,gap=0){
 return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
}
/** Find the nearest clear place, constrained to the owning pane and visible viewport.
 * Returns null when no complete fit exists: never move a control into another pane. */
function writerCompanionControlPlace(rect,bounds,obstacles=[],gap=8){
 const source=writerCompanionRect(rect),area=writerCompanionRect(bounds);
 if(!source||!area||source.width>area.width||source.height>area.height)return null;
 const blocked=obstacles.map(writerCompanionRect).filter(Boolean);
 const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
 const xs=[source.left,area.left,area.right-source.width];
 const ys=[source.top,area.top,area.bottom-source.height];
 for(const o of blocked){xs.push(o.left-source.width-gap,o.right+gap);ys.push(o.top-source.height-gap,o.bottom+gap);}
 const candidates=[];
 for(const x of xs)for(const y of ys){
  const left=clamp(x,area.left,area.right-source.width),top=clamp(y,area.top,area.bottom-source.height);
  const candidate={left,top,width:source.width,height:source.height,right:left+source.width,bottom:top+source.height};
  if(blocked.some(o=>writerCompanionRectsOverlap(candidate,o,gap)))continue;
  candidates.push({...candidate,distance:(left-source.left)**2+(top-source.top)**2});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 return candidates[0]||null;
}
function writerCompanionLayoutRegister(plugin){
 const doc=plugin?.app?.workspace?.containerEl?.ownerDocument||(typeof document==='object'?document:null);
 const win=doc?.defaultView;
 if(!doc||!win)return {refresh(){},stop(){}};
 const shifted=new Map(),marked=new Set(),cleanups=[];
 let frame=null,stopped=false,dragging=false;
 const enabled=id=>typeof writerCompanionEnabled==='function'?writerCompanionEnabled(plugin,id):
  Boolean(plugin?.settings?.v12Toolkit?.enabled!==false&&plugin?.settings?.v12Toolkit?.integrations!==false&&
   plugin?.settings?.companionCompatibility?.enabledById?.[id]!==false&&plugin?.app?.plugins?.plugins?.[id]);
 const config=()=>plugin?.settings?.companionCompatibility||{};
 const restore=(preserve=null)=>{
  for(const [el,snapshot] of shifted){
   if(preserve?.(el))continue;
   for(const [key,value] of snapshot.props){
    // A companion may update its own styling during a drag. Restore only our values.
    if(el.style.getPropertyValue(key)!==snapshot.applied.get(key))continue;
    if(value.value)el.style.setProperty(key,value.value,value.priority);else el.style.removeProperty(key);
   }
   if(!snapshot.hadClass)el.classList.remove('writer-companion-managed');
   shifted.delete(el);
  }
  for(const el of marked)el.classList.remove('writer-companion-icon-toolkit','writer-companion-icon-basic');
  marked.clear();
 };
 const visible=el=>{
  const r=writerCompanionRect(el.getBoundingClientRect());if(!r)return null;
  const style=win.getComputedStyle(el);
  return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0?r:null;
 };
 const manage=(el,properties)=>{
  let snapshot=shifted.get(el);
  if(!snapshot){snapshot={props:new Map(),applied:new Map(),hadClass:el.classList.contains('writer-companion-managed')};shifted.set(el,snapshot);}
  for(const [key,value] of Object.entries(properties)){
   if(!snapshot.props.has(key))snapshot.props.set(key,{value:el.style.getPropertyValue(key),priority:el.style.getPropertyPriority(key)});
   el.style.setProperty(key,value);snapshot.applied.set(key,value);
  }
  el.classList.add('writer-companion-managed');
 };
 const refresh=()=>{
  if(stopped||dragging)return;
  const mobile=plugin.app.isMobile===true||doc.body.classList.contains('is-mobile');
  // The task fan draws its connectors from the button's current screen rect. Do
  // not move that anchor while the fan is open; disable/unload still restores it.
  const pinned=el=>mobile&&config().mobileLayout!==false&&enabled('snailkit')&&el.matches('.sk-tasks-fab.is-fan');
  restore(pinned);
  if(enabled('ahmed-toolkit')&&config().explorerIcons!=='both'&&config().explorerIcons!==false){
   const preferBasic=config().explorerIcons==='basic';
   for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
    for(const row of leaf.view?.containerEl?.querySelectorAll?.('.nav-file-title,.nav-folder-title')||[]){
     if(!row.querySelector(':scope > .ft-icon')||!row.querySelector(':scope > .writer-v9-explorer-icon'))continue;
     row.classList.add(preferBasic?'writer-companion-icon-basic':'writer-companion-icon-toolkit');marked.add(row);
    }
   }
  }
  if(!mobile||config().mobileLayout===false)return;
  const vv=win.visualViewport;
  const viewport={left:vv?.offsetLeft||0,top:vv?.offsetTop||0,width:vv?.width||win.innerWidth,height:vv?.height||win.innerHeight};
  // The probe resolves the platform safe areas without interpreting CSS env() in JS.
  const probe=doc.createElement('div');probe.className='writer-companion-safe-area';doc.body.appendChild(probe);
  const safeStyle=win.getComputedStyle(probe),bodyStyle=win.getComputedStyle(doc.body);
  const safe=(padding,side)=>Math.max(parseFloat(padding)||0,parseFloat(bodyStyle.getPropertyValue?.('--safe-area-inset-'+side))||0);
  const safeTop=safe(safeStyle.paddingTop,'top'),safeBottom=safe(safeStyle.paddingBottom,'bottom');
  const safeLeft=safe(safeStyle.paddingLeft,'left'),safeRight=safe(safeStyle.paddingRight,'right');probe.remove();
  const area={left:viewport.left+safeLeft+8,top:viewport.top+safeTop+8,
   width:viewport.width-safeLeft-safeRight-16,height:viewport.height-safeTop-safeBottom-16};
  const areaRect=writerCompanionRect(area);if(!areaRect)return;
  const obstacles=[];
  // These are existing native/Basic controls, not guessed companion panels.
  const reserved='.mobile-navbar,.mobile-toolbar,.writer-v9-format-toolbar,.writer-review-floating,.writer-lt-mobile-modal,.writer-v1201-zen-exit,.status-bar';
  for(const el of doc.querySelectorAll(reserved)){const r=visible(el);if(r)obstacles.push(r);}
  const selectors=[];
  if(enabled('snailkit')){
   // Snailkit positions the rail and shell together. Moving just the rail would
   // detach its panel, so preserve native geometry and reserve it for other buttons.
   for(const node of doc.querySelectorAll('.sk-note-rail,.sk-note-rail-panel.is-open')){const r=visible(node);if(r)obstacles.push(r);}
   selectors.push('.sk-tasks-fab');
  }
  if(enabled('ahmed-toolkit')){
   for(const node of doc.querySelectorAll('.fk-selection-toolbar,.fk-live-image-toolbar')){const r=visible(node);if(r)obstacles.push(r);}
   selectors.push('.fs-float-btn','.fk-tts-player','.fs-hint');
  }
  if(!selectors.length)return;
  const priority=el=>el.matches('.fk-tts-player')?0:el.matches('.fs-hint')?1:el.matches('.sk-tasks-fab')?2:3;
  const controls=Array.from(doc.querySelectorAll(selectors.join(','))).sort((a,b)=>priority(a)-priority(b));
  // Reserve the wide audio player first, then Snailkit's task button. Move
  // Toolkit's small fullscreen button around them; native anchored popovers keep working.
  for(const el of controls){
   let r=visible(el);if(!r)continue;
   if(pinned(el)){obstacles.push(r);continue;}
   if(win.getComputedStyle(el).translate&&!['none','0px','0px 0px'].includes(win.getComputedStyle(el).translate))continue;
   manage(el,{});r=visible(el);if(!r)continue;
   let bounds=areaRect;
   const pane=el.closest('.workspace-leaf-content');
   const paneRect=pane&&writerCompanionRect(pane.getBoundingClientRect());
   if(paneRect){
    const left=Math.max(bounds.left,paneRect.left+4),top=Math.max(bounds.top,paneRect.top+4);
    bounds=writerCompanionRect({left,top,width:Math.min(bounds.right,paneRect.right-4)-left,height:Math.min(bounds.bottom,paneRect.bottom-4)-top});
    if(!bounds)continue;
   }
   // The native Toolkit player is 320px wide. Constrain it on narrow phones while
   // retaining its original size and position as soon as compatibility is disabled.
   const props={};
   if(el.matches('.fk-tts-player,.fs-hint')){
    if(r.width>bounds.width){props['max-width']=Math.floor(bounds.width)+'px';manage(el,props);r=visible(el);if(!r)continue;}
    if(r.height>bounds.height){props['max-height']=Math.floor(bounds.height)+'px';props['overflow-y']='auto';manage(el,props);r=visible(el);if(!r)continue;}
   }
   const ownObstacles=obstacles.filter(o=>o!==r);
   // If a very short keyboard viewport cannot fit every native control, keep
   // the control reachable inside its pane rather than below the keyboard.
   const place=writerCompanionControlPlace(r,bounds,ownObstacles)||writerCompanionControlPlace(r,bounds,[]);
   if(place){
    if(el.matches('.fk-tts-player')){
     // The native player drag records screen coordinates and writes left/top.
     // A separate translation would be added a second time during that drag.
     props.left=Math.round(place.left)+'px';props.top=Math.round(place.top)+'px';props.right='auto';props.bottom='auto';
    }else{
     props['--writer-companion-x']=Math.round(place.left-r.left)+'px';
     props['--writer-companion-y']=Math.round(place.top-r.top)+'px';
    }
    manage(el,props);
    obstacles.push(place);
   }else obstacles.push(r);
  }
 };
 const schedule=()=>{if(stopped||frame!==null)return;frame=win.requestAnimationFrame(()=>{frame=null;refresh();});};
 const listen=(target,type,handler,opts)=>{target?.addEventListener?.(type,handler,opts);cleanups.push(()=>target?.removeEventListener?.(type,handler,opts));};
 listen(win,'resize',schedule,{passive:true});listen(win,'orientationchange',schedule,{passive:true});listen(doc,'scroll',schedule,{passive:true,capture:true});
 listen(win.visualViewport,'resize',schedule,{passive:true});listen(win.visualViewport,'scroll',schedule,{passive:true});
 listen(doc,'pointerdown',event=>{
  if(!event.target?.closest?.('.fk-tts-header,.fs-float-btn,.sk-note-rail,.sk-tasks-fab'))return;
  dragging=true;
  const player=event.target.closest('.fk-tts-header')&&!event.target.closest('.fk-tts-close')?event.target.closest('.fk-tts-player'):null;
  const snapshot=player&&shifted.get(player);
  // A user dragging the native header takes ownership of its position. Keep the
  // native coordinates instead of restoring a position from before that gesture.
  if(snapshot)for(const key of ['left','top','right','bottom']){snapshot.props.delete(key);snapshot.applied.delete(key);}
 },{passive:true});
 listen(win,'pointerup',()=>{dragging=false;schedule();},{passive:true});listen(win,'pointercancel',()=>{dragging=false;schedule();},{passive:true});
 // Ignore our geometry writes (attributes) and coalesce native rendering bursts.
 const Observer=win.MutationObserver;
 if(Observer){const observer=new Observer(records=>{if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&!node.classList?.contains('writer-companion-safe-area'))))schedule();});observer.observe(doc.body,{childList:true,subtree:true});cleanups.push(()=>observer.disconnect());}
 const stop=()=>{if(stopped)return;stopped=true;if(frame!==null)win.cancelAnimationFrame(frame);frame=null;for(const cleanup of cleanups)cleanup();restore();};
 plugin.register?.(stop);schedule();return {refresh,schedule,stop};
}
