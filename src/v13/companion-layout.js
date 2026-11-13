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
/** Passive screen coordination must survive disabling quick actions or command bridges. */
function writerCompanionLayoutAllowed(plugin,id){
 return !!plugin?.app?.plugins?.plugins?.[id]&&plugin?.settings?.companionCompatibility?.enabledById?.[id]!==false;
}
function writerCompanionRectsUnion(rects){
 const all=rects.map(writerCompanionRect).filter(Boolean);if(!all.length)return null;
 const left=Math.min(...all.map(r=>r.left)),top=Math.min(...all.map(r=>r.top));
 return writerCompanionRect({left,top,width:Math.max(...all.map(r=>r.right))-left,height:Math.max(...all.map(r=>r.bottom))-top});
}
/** Shrink scrollable surfaces only to actual free vertical space; never drop obstacles. */
function writerCompanionCompactPlace(rect,bounds,obstacles,minHeight=80){
 const direct=writerCompanionControlPlace(rect,bounds,obstacles);if(direct)return direct;
 const r=writerCompanionRect(rect),area=writerCompanionRect(bounds);if(!r||!area)return null;
 const edges=[area.top,area.bottom,...obstacles.flatMap(o=>[o.top-8,o.bottom+8])];
 const heights=[...new Set(edges.flatMap(a=>edges.map(b=>Math.min(r.height,Math.floor(b-a)))))].filter(h=>h>=minHeight&&h<r.height).sort((a,b)=>b-a);
 for(const height of heights){const candidate=writerCompanionControlPlace({...r,height},area,obstacles);if(candidate)return candidate;}
 return null;
}
function writerCompanionLayoutRegister(plugin){
 const doc=plugin?.app?.workspace?.containerEl?.ownerDocument||(typeof document==='object'?document:null),win=doc?.defaultView;
 if(!doc||!win)return {refresh(){},stop(){}};
 const shifted=new Map(),marked=new Set(),cleanups=[],ownedAttributes=new WeakMap(),fanAnchors=new WeakMap();
 let frame=null,stopped=false,dragging=false;
 const enabled=id=>writerCompanionLayoutAllowed(plugin,id),config=()=>plugin?.settings?.companionCompatibility||{};
 const query=selector=>Array.from(doc.querySelectorAll(selector));
 const attribute=(el,key)=>el.getAttribute?.(key)??null;
 const stamp=(el,key)=>{let values=ownedAttributes.get(el);if(!values){values=new Map();ownedAttributes.set(el,values);}values.set(key,attribute(el,key));};
 const remember=el=>{
  let saved=shifted.get(el);
  if(!saved){saved={props:new Map(),applied:new Map(),attrs:new Map(),attrApplied:new Map(),hadClass:el.classList.contains('writer-companion-managed'),hadSuspended:el.classList.contains('writer-companion-suspended')};shifted.set(el,saved);}
  return saved;
 };
 const manage=(el,properties)=>{
  const saved=remember(el);
  for(const [key,value] of Object.entries(properties)){
   if(!saved.props.has(key))saved.props.set(key,{value:el.style.getPropertyValue(key),priority:el.style.getPropertyPriority(key)});
   if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);
   saved.applied.set(key,value);
  }
  stamp(el,'style');el.classList.add('writer-companion-managed');stamp(el,'class');
 };
 const setAttribute=(el,key,value)=>{
  if(typeof el.setAttribute!=='function')return;
  const saved=remember(el);if(!saved.attrs.has(key))saved.attrs.set(key,attribute(el,key));
  el.setAttribute(key,value);saved.attrApplied.set(key,value);stamp(el,key);
 };
 const suspend=(el,reason)=>{
  manage(el,{visibility:'hidden','pointer-events':'none'});
  el.classList.add('writer-companion-suspended');stamp(el,'class');
  setAttribute(el,'aria-hidden','true');setAttribute(el,'data-basic-companion-hidden',reason);
 };
 const restore=()=>{
  for(const [el,saved] of shifted){
   for(const [key,value] of saved.props){
    if(el.style.getPropertyValue(key)!==saved.applied.get(key))continue;
    if(value.value)el.style.setProperty(key,value.value,value.priority);else el.style.removeProperty(key);
   }
   stamp(el,'style');
   for(const [key,value] of saved.attrs){
    if(attribute(el,key)!==saved.attrApplied.get(key))continue;
    if(value===null)el.removeAttribute?.(key);else el.setAttribute?.(key,value);stamp(el,key);
   }
   if(!saved.hadClass)el.classList.remove('writer-companion-managed');
   if(!saved.hadSuspended)el.classList.remove('writer-companion-suspended');stamp(el,'class');
  }
  shifted.clear();
  for(const el of marked){el.classList.remove('writer-companion-icon-toolkit','writer-companion-icon-basic');stamp(el,'class');}marked.clear();
 };
 const visible=el=>{
  const r=writerCompanionRect(el.getBoundingClientRect());if(!r||el.hidden)return null;
  const style=win.getComputedStyle(el);
  // Opening transitions start at opacity zero; their open classes already express intent.
  const opening=el.matches('.is-open,.is-active,.is-visible,[popover]');
  return style.display!=='none'&&style.visibility!=='hidden'&&!(Number(style.opacity)===0&&style.pointerEvents==='none'&&!opening)?r:null;
 };
 const toolkit='.fs-float-btn,.fs-hint,.fk-tts-player,.fk-selection-toolbar,.fk-live-image-toolbar,.ic-lightbox-overlay';
 const snail='.sk-note-rail,.sk-note-rail-panel,.sk-note-rail-tooltip,.sk-tasks-fab,.sk-tasks-fan,.sk-pins-popup,.sk-tag-picker-pop,.sk-tag-picker-backdrop,.sk-tag-card,.sk-tasks-donepop,.sk-slash-menu-menu,.sk-tables-ui.sk-tables-toolbar,.sk-tables-popover,.sk-search-backdrop,.sk-search-dialog,.sk-sessions-panel.is-sheet,.sk-sessions-sheet-back,.sk-sessions-sheet,.sk-sessions-tri';
 const nativePriority='.modal-container,.menu,.popover,.suggestion-container,.bases-toolbar-menu,.writer-lt-mobile-modal,.cm-tooltip,.lt-tooltip';
 const snailModal='.sk-tag-picker-pop,.sk-tag-picker-backdrop,.sk-search-backdrop,.sk-search-dialog,.sk-sessions-panel.is-sheet,.sk-sessions-sheet-back,.sk-sessions-sheet,.sk-sessions-tri';
 const snailPopups='.sk-pins-popup,.sk-tag-picker-pop,.sk-tag-card,.sk-tasks-donepop,.sk-slash-menu-menu,.sk-tables-popover';
 const reserved='.mobile-navbar,.mobile-toolbar,.writer-v9-format-toolbar,.writer-review-floating,.writer-review-panel,.writer-v1201-zen-exit,.status-bar,.view-header,.workspace-tab-header-container,.writer-native-mobile-controls';
 const contains=(parent,child)=>parent===child||parent.contains?.(child)===true;
 const related=(el,roots)=>roots.some(root=>contains(root,el)||contains(el,root));
 const refresh=()=>{
  if(stopped||dragging)return;
  restore();
  if(enabled('ahmed-toolkit')&&config().explorerIcons!=='both'&&config().explorerIcons!==false){
   for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
    for(const row of leaf.view?.containerEl?.querySelectorAll?.('.nav-file-title,.nav-folder-title')||[]){
     if(!row.querySelector(':scope > .ft-icon')||!row.querySelector(':scope > .writer-v9-explorer-icon'))continue;
     row.classList.add(config().explorerIcons==='basic'?'writer-companion-icon-basic':'writer-companion-icon-toolkit');stamp(row,'class');marked.add(row);
    }
   }
  }
  const mobile=plugin.app.isMobile===true||doc.body.classList.contains('is-mobile')||(typeof Platform!=='undefined'&&Platform.isMobile===true);
  if(!mobile||config().mobileLayout===false)return;
  const floats=[...new Set([...(enabled('snailkit')?query(snail):[]),...(enabled('ahmed-toolkit')?query(toolkit):[])])].filter(el=>visible(el));
  if(!floats.length)return;
  const primary=query(nativePriority).filter(el=>visible(el));
  if(primary.length){for(const el of floats)if(!related(el,primary))suspend(el,'dialog');return;}
  const vv=win.visualViewport,viewport={left:vv?.offsetLeft||0,top:vv?.offsetTop||0,width:vv?.width||win.innerWidth,height:vv?.height||win.innerHeight};
  const probe=doc.createElement('div');probe.className='writer-companion-safe-area';doc.body.appendChild(probe);
  const probeStyle=win.getComputedStyle(probe),bodyStyle=win.getComputedStyle(doc.body);
  const safe=(padding,side)=>Math.max(parseFloat(padding)||0,parseFloat(bodyStyle.getPropertyValue?.('--safe-area-inset-'+side))||0);
  const top=safe(probeStyle.paddingTop,'top'),bottom=safe(probeStyle.paddingBottom,'bottom'),left=safe(probeStyle.paddingLeft,'left'),right=safe(probeStyle.paddingRight,'right');probe.remove();
  const area=writerCompanionRect({left:viewport.left+left+8,top:viewport.top+top+8,width:viewport.width-left-right-16,height:viewport.height-top-bottom-16});if(!area)return;
  const obstacles=query(reserved).map(el=>visible(el)).filter(Boolean);
  const boundsFor=el=>{
   const pane=el.closest?.('.workspace-leaf-content'),r=pane&&writerCompanionRect(pane.getBoundingClientRect());
   if(!r)return area;
   const x=Math.max(area.left,r.left+4),y=Math.max(area.top,r.top+4);
   return writerCompanionRect({left:x,top:y,width:Math.min(area.right,r.right-4)-x,height:Math.min(area.bottom,r.bottom-4)-y});
  };
  const restrict=(el,bounds)=>{
   let r=visible(el);if(!r)return null;
   const props={};
   if(r.width>bounds.width)props['max-width']=Math.floor(bounds.width)+'px';
   if(r.height>bounds.height){props['max-height']=Math.floor(bounds.height)+'px';props['overflow-y']='auto';}
   if(Object.keys(props).length){manage(el,props);r=visible(el);}return r;
  };
  const applyMove=(el,from,to)=>{
   const props={};
   if(el.matches('.fk-tts-player')){props.left=Math.round(to.left)+'px';props.top=Math.round(to.top)+'px';props.right='auto';props.bottom='auto';}
   else {props['--writer-companion-x']=Math.round(to.left-from.left)+'px';props['--writer-companion-y']=Math.round(to.top-from.top)+'px';}
   manage(el,props);
  };
  const fit=(el,scrollable=false)=>{
   const bounds=boundsFor(el);if(!bounds){suspend(el,'space');return null;}
   let r=restrict(el,bounds);if(!r)return null;
   const translated=win.getComputedStyle(el).translate;
   if(translated&&!['none','0px','0px 0px'].includes(translated)){
    if(obstacles.some(o=>writerCompanionRectsOverlap(r,o,8))||r.left<bounds.left||r.top<bounds.top||r.right>bounds.right||r.bottom>bounds.bottom){suspend(el,'space');return null;}
    obstacles.push(r);return r;
   }
   const place=scrollable?writerCompanionCompactPlace(r,bounds,obstacles):writerCompanionControlPlace(r,bounds,obstacles);
   if(!place){suspend(el,'space');return null;}
   if(place.height<r.height){manage(el,{'max-height':Math.floor(place.height)+'px','overflow-y':'auto'});r=visible(el)||r;}
   applyMove(el,r,place);obstacles.push(place);return place;
  };
  const exclusive=floats.filter(el=>el.matches(snailModal)||el.matches('.ic-lightbox-overlay'));
  if(exclusive.length){for(const el of floats)if(!related(el,exclusive))suspend(el,'popup');return;}
  const popups=floats.filter(el=>el.matches(snailPopups));
  if(popups.length){for(const el of floats)if(!related(el,popups))suspend(el,'popup');for(const popup of popups)fit(popup,true);return;}
  const fans=floats.filter(el=>el.matches('.sk-tasks-fan'));
  if(fans.length){
   const fabs=floats.filter(el=>el.matches('.sk-tasks-fab.is-fan'));
   for(const el of floats)if(!related(el,[...fans,...fabs]))suspend(el,'popup');
   let moved=false;
   for(const fab of fabs){const place=fit(fab),before=fanAnchors.get(fab);if(!place){for(const fan of fans)suspend(fan,'space');continue;}
    const key=[place.left,place.top,place.width,place.height].join(',');if(before!==key){fanAnchors.set(fab,key);moved=true;}}
   for(const fan of fans){const r=visible(fan),bounds=boundsFor(fan);if(!r||!bounds)continue;
    // Clip the native veil without translating SVG paths away from the FAB.
    manage(fan,{'clip-path':'inset('+Math.max(0,bounds.top-r.top)+'px '+Math.max(0,r.right-bounds.right)+'px '+Math.max(0,r.bottom-bounds.bottom)+'px '+Math.max(0,bounds.left-r.left)+'px)'});}
   if(moved&&typeof win.dispatchEvent==='function'&&typeof win.Event==='function')win.dispatchEvent(new win.Event('resize'));
   return;
  }
  const panels=floats.filter(el=>el.matches('.sk-note-rail-panel'));
  if(panels.length){
   const roots=[];
   for(const panel of panels){const host=panel.parentElement||panel.closest?.('.sk-note-rail-host'),rail=host?.querySelector?.('.sk-note-rail');roots.push(panel,...(rail?[rail]:[]));}
   for(const el of floats)if(!related(el,roots))suspend(el,'popup');
   for(const panel of panels){
    const host=panel.parentElement||panel.closest?.('.sk-note-rail-host'),rail=host?.querySelector?.('.sk-note-rail'),bounds=boundsFor(panel);
    if(!bounds){suspend(panel,'space');if(rail)suspend(rail,'space');continue;}
    if(rail)restrict(rail,bounds);
    const rr=rail&&visible(rail),width=Math.max(100,bounds.width-(rr?.width||0)-8);
    manage(panel,{'max-width':Math.floor(width)+'px','max-height':Math.floor(bounds.height)+'px','overflow-y':'auto'});
    let union=writerCompanionRectsUnion([visible(panel),rr].filter(Boolean)),place=union&&writerCompanionCompactPlace(union,bounds,obstacles);
    if(place&&place.height<union.height){
     for(const el of [panel,rail].filter(Boolean))manage(el,{'max-height':Math.floor(place.height)+'px','overflow-y':'auto'});
     union=writerCompanionRectsUnion([visible(panel),rail&&visible(rail)].filter(Boolean));place=union&&writerCompanionControlPlace(union,bounds,obstacles);
    }
    if(!place){suspend(panel,'space');if(rail)suspend(rail,'space');continue;}
    for(const el of [panel,rail].filter(Boolean))applyMove(el,union,place);obstacles.push(place);
   }
   return;
  }
  const bars=floats.filter(el=>el.matches('.fk-selection-toolbar,.fk-live-image-toolbar'));
  const pickerBars=bars.filter(bar=>Array.from(bar.querySelectorAll?.('.fk-st-callout-picker,.fk-st-ai-picker')||[]).some(el=>visible(el)));
  if(pickerBars.length){
   for(const el of floats)if(!related(el,pickerBars))suspend(el,'popup');
   for(const bar of pickerBars){const bounds=boundsFor(bar);if(!bounds){suspend(bar,'space');continue;}
    manage(bar,{'max-width':Math.floor(bounds.width)+'px','flex-wrap':'wrap'});
    const pickers=Array.from(bar.querySelectorAll?.('.fk-st-callout-picker,.fk-st-ai-picker')||[]).filter(el=>visible(el));
    for(const picker of pickers)manage(picker,{'max-width':Math.floor(bounds.width)+'px','max-height':Math.max(60,Math.floor(bounds.height-(visible(bar)?.height||44)-8))+'px','overflow-y':'auto',left:'0px',right:'auto'});
    const union=writerCompanionRectsUnion([visible(bar),...pickers.map(el=>visible(el))].filter(Boolean)),place=union&&writerCompanionControlPlace(union,bounds,obstacles);
    if(!place)suspend(bar,'space');else {applyMove(bar,union,place);obstacles.push(place);}
   }
   return;
  }
  const priority=el=>el.matches('.fk-selection-toolbar,.fk-live-image-toolbar')?0:el.matches('.fk-tts-player')?1:el.matches('.sk-note-rail')?2:el.matches('.sk-tasks-fab')?3:4;
  for(const el of floats.sort((a,b)=>priority(a)-priority(b))){
   if(el.matches('.sk-note-rail-tooltip')){suspend(el,'space');continue;}
   if(el.matches('.fk-selection-toolbar,.fk-live-image-toolbar'))manage(el,{'max-width':Math.floor(boundsFor(el)?.width||area.width)+'px','flex-wrap':'wrap'});
   fit(el,el.matches('.fk-tts-player,.fs-hint'));
  }
 };
 const schedule=()=>{if(stopped||frame!==null)return;frame=win.requestAnimationFrame(()=>{frame=null;refresh();});};
 const listen=(target,type,handler,opts)=>{target?.addEventListener?.(type,handler,opts);cleanups.push(()=>target?.removeEventListener?.(type,handler,opts));};
 listen(win,'resize',schedule,{passive:true});listen(win,'orientationchange',schedule,{passive:true});listen(doc,'scroll',schedule,{passive:true,capture:true});
 listen(win.visualViewport,'resize',schedule,{passive:true});listen(win.visualViewport,'scroll',schedule,{passive:true});
 listen(doc,'pointerdown',event=>{
  if(!event.target?.closest?.('.fk-tts-header,.fs-float-btn,.sk-note-rail,.sk-tasks-fab'))return;
  dragging=true;
  const player=event.target.closest('.fk-tts-header')&&!event.target.closest('.fk-tts-close')?event.target.closest('.fk-tts-player'):null,saved=player&&shifted.get(player);
  if(saved)for(const key of ['left','top','right','bottom']){saved.props.delete(key);saved.applied.delete(key);}
 },{passive:true});
 listen(win,'pointerup',()=>{dragging=false;schedule();},{passive:true});listen(win,'pointercancel',()=>{dragging=false;schedule();},{passive:true});
 const observed=[toolkit,snail,nativePriority,reserved].join(',');
 // Popover API state and CSS animation completion need not mutate any attribute.
 const surfaceState=event=>{if(event.target?.matches?.(observed)||event.target?.closest?.(observed))schedule();};
 for(const type of ['beforetoggle','toggle','transitionend','animationend'])listen(doc,type,surfaceState,{capture:true,passive:true});
 const Observer=win.MutationObserver;
 if(Observer){const observer=new Observer(records=>{
  if(records.some(record=>{
   if(record.type==='attributes'){
    const target=record.target,key=record.attributeName,own=ownedAttributes.get(target);
    if(own?.has(key)&&own.get(key)===attribute(target,key))return false;
    return target?.matches?.(observed)||target===doc.body;
   }
   return [...(record.addedNodes||[]),...(record.removedNodes||[])].some(node=>node.nodeType===1&&!node.classList?.contains('writer-companion-safe-area'));
  }))schedule();
 });observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','aria-expanded','popover']});cleanups.push(()=>observer.disconnect());}
 const stop=()=>{if(stopped)return;stopped=true;if(frame!==null)win.cancelAnimationFrame(frame);frame=null;for(const cleanup of cleanups)cleanup();restore();};
 plugin.register?.(stop);schedule();return {refresh,schedule,stop};
}
