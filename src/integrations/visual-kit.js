'use strict';
/* Obsidian owns the lifecycle and the vault. Visual Kit owns only its namespaced state. */
function writerVisualKitDesktop(plugin){
 if(plugin.app?.isMobile===true)return false;
 const platform=require('obsidian').Platform;
 return platform?.isDesktopApp===true&&platform?.isMobile!==true;
}
function writerVisualKitExternal(plugin){
 // enabledPlugins also catches the original if it loads after Basic during startup.
 const plugins=plugin.app?.plugins;
 return !!plugins?.plugins?.['visual-kit']||plugins?.enabledPlugins?.has?.('visual-kit')===true;
}
function writerVisualKitRegister(plugin){
 if(plugin._writerVisualKit||plugin.settings.visualKitEnabled===false||
  !writerVisualKitDesktop(plugin)||writerVisualKitExternal(plugin)||typeof writerVisualKitBuild!=='function')return;
 try{
  const VisualKit=writerVisualKitBuild();
  const component=new VisualKit(plugin,writerUi,()=>plugin.settings.visualKitState,async state=>{
   plugin.settings.visualKitState=state;
   await plugin.saveSettings();
  },()=>!writerVisualKitExternal(plugin));
  plugin._writerVisualKit=component;
  plugin.addChild(component);
  plugin.register(()=>{if(plugin._writerVisualKit===component)plugin._writerVisualKit=null;});
 }catch(error){
  if(plugin._writerVisualKit){plugin.removeChild(plugin._writerVisualKit);plugin._writerVisualKit=null;}
  console.warn('[Basic] Visual Kit could not start:',error);
 }
}
function writerVisualKitSettings(plugin,panel){
 if(!writerVisualKitDesktop(plugin))return;
 const section=panel.createDiv({cls:'writer-basic-visual-kit-settings'});
 section.createEl('h3',{text:'Visual Kit'});
 new Setting(section).setName(writerUi('Ferramentas visuais do Basic','Basic visual tools'))
  .setDesc(writerUi('Editor HTML, anotações, colagem de imagens e cópia rica. Recarregue o Basic depois de alterar esta opção.',
   'HTML editor, annotations, image paste and rich copy. Reload Basic after changing this setting.'))
  .addToggle(toggle=>toggle.setValue(plugin.settings.visualKitEnabled!==false).onChange(async enabled=>{
   plugin.settings.visualKitEnabled=enabled;await plugin.saveSettings();
  }));
 if(writerVisualKitExternal(plugin)){
  section.createEl('p',{cls:'setting-item-description',text:writerUi(
   'O Visual Kit original está ativo. Desative-o e recarregue o Basic para usar a versão integrada.',
   'The original Visual Kit is enabled. Disable it and reload Basic to use the bundled editor.')});
  return;
 }
 plugin._writerVisualKit?.renderBasicSettings(section);
}
