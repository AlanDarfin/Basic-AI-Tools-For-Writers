'use strict';
/* Register the 10.7 integrations after all feature modules have been loaded. */
function writerV107Register(plugin){
 const steps=[
  writerV107DbRegister,writerV107ZoteroRegister,writerV107StudyRegister,
  writerV107CalendarRegister,writerV107GraphRegister,writerV107EditorRegister,
  writerV107SpeechRegister,writerV107MediaRegister
 ];
 for(const step of steps){
  try{step(plugin);}
  catch(error){console.error('[Basic AI] 10.7 integration registration:',step.name,error);}
 }
}
function writerV107Settings(plugin,panel){
 for(const step of [
  writerV107DbSettings,writerV107ZoteroSettings,writerV107StudySettings,
  writerV107CalendarSettings,writerV107GraphSettings,writerV107EditorSettings,
  writerV107SpeechSettings,writerV107MediaSettings
 ])try{step(plugin,panel);}catch(error){console.error('[Basic AI] 10.7 settings:',step.name,error);}
}
