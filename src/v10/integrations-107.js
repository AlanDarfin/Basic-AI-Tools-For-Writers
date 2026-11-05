'use strict';
/* v10.7.1: Never allow an optional integration to block core plugin activation.
 * Also tolerate partial/mismatched installations while users replace release assets. */
function writerV107Register(plugin){
 if(plugin._writerV107Registered)return;
 plugin._writerV107Registered=true;
 const steps=[
  ['databases',typeof writerV107DbRegister==='function'?writerV107DbRegister:null],
  ['zotero',typeof writerV107ZoteroRegister==='function'?writerV107ZoteroRegister:null],
  ['study',typeof writerV107StudyRegister==='function'?writerV107StudyRegister:null],
  ['calendar',typeof writerV107CalendarRegister==='function'?writerV107CalendarRegister:null],
  ['story-graph',typeof writerV107GraphRegister==='function'?writerV107GraphRegister:null],
  ['editor',typeof writerV107EditorRegister==='function'?writerV107EditorRegister:null],
  ['speech',typeof writerV107SpeechRegister==='function'?writerV107SpeechRegister:null],
  ['media',typeof writerV107MediaRegister==='function'?writerV107MediaRegister:null]
 ];
 for(const [name,register] of steps){
  if(!register){console.warn('[Basic AI] Optional 10.7 module missing:',name);continue;}
  try{register(plugin);}
  catch(error){
   console.error('[Basic AI] Optional 10.7 module failed:',name,error);
   if(!plugin._writerV107Failures)plugin._writerV107Failures=[];
   plugin._writerV107Failures.push(name);
  }
 }
}
function writerV107RegisterAfterStartup(plugin){
 if(plugin._writerV107StartupQueued)return;
 plugin._writerV107StartupQueued=true;
 let cancelled=false;
 plugin.register?.(()=>{cancelled=true;});
 const run=()=>{
  if(cancelled)return;
  try{writerV107Register(plugin);}
  catch(error){console.error('[Basic AI] 10.7 startup was isolated:',error);}
 };
 // The long-established Basic v3-v10 modules must initialize first. A broken
 // optional extension cannot reject Plugin.onload and make the entire plugin
 // appear disabled. This also avoids registering a View during layout restore.
 try{
  const ready=plugin.app?.workspace?.onLayoutReady;
  if(typeof ready==='function')ready.call(plugin.app.workspace,()=>{
   if(typeof setTimeout==='function')setTimeout(run,0);else run();
  });
  else if(typeof setTimeout==='function')setTimeout(run,0);
  else run();
 }catch(error){
  console.warn('[Basic AI] Deferred registration unavailable:',error);
  if(typeof setTimeout==='function')setTimeout(run,0);
 }
}
function writerV107Settings(plugin,panel){
 for(const [name,render] of [
  ['databases',typeof writerV107DbSettings==='function'?writerV107DbSettings:null],
  ['zotero',typeof writerV107ZoteroSettings==='function'?writerV107ZoteroSettings:null],
  ['study',typeof writerV107StudySettings==='function'?writerV107StudySettings:null],
  ['calendar',typeof writerV107CalendarSettings==='function'?writerV107CalendarSettings:null],
  ['story-graph',typeof writerV107GraphSettings==='function'?writerV107GraphSettings:null],
  ['editor',typeof writerV107EditorSettings==='function'?writerV107EditorSettings:null],
  ['speech',typeof writerV107SpeechSettings==='function'?writerV107SpeechSettings:null],
  ['media',typeof writerV107MediaSettings==='function'?writerV107MediaSettings:null]
 ]){
  if(!render)continue;
  try{
   // Resolve defaults lazily for users upgrading with older data.json.
   render(plugin,panel);
  }catch(error){console.error('[Basic AI] 10.7 settings isolated:',name,error);}
 }
}
