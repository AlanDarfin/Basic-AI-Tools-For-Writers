'use strict';
/* Coexistence controls belong beside the native interface they affect. */
function writerNativeFloatingSettings(plugin,panel){
 const cfg=writerCompanionConfig(plugin);
 new Setting(panel).setName(writerUi('Organizar controles flutuantes no mobile','Arrange floating controls on mobile'))
  .setDesc(writerUi('Mantém controles compatíveis fora de barras, menus e painéis abertos. Controles secundários sem espaço ficam temporariamente ocultos e retornam quando houver espaço.',
   'Keeps supported controls clear of bars, menus and open panels. Secondary controls without room are temporarily hidden and return when space is available.'))
  .addToggle(control=>control.setValue(cfg.mobileLayout!==false).onChange(async value=>{
   cfg.mobileLayout=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();
  }));
}
function writerNativeExplorerSupportSettings(plugin,panel){
 const cfg=writerCompanionConfig(plugin);
 new Setting(panel).setName(writerUi('Prioridade dos ícones duplicados','Duplicate icon priority'))
  .setDesc(writerUi('Quando Basic e Ultimate Toolkit decoram a mesma linha, escolha o ícone visível. As preferências dos dois plugins são preservadas.',
   'When Basic and Ultimate Toolkit decorate the same row, choose the visible icon. Both plugins keep their preferences.'))
  .addDropdown(control=>control.addOption('basic',writerUi('Ícone personalizado do Basic','Custom Basic icon'))
   .addOption('companion','Ultimate Toolkit').addOption('both',writerUi('Mostrar ambos','Show both'))
   .setValue(cfg.explorerIcons).onChange(async value=>{
    if(!['basic','companion','both'].includes(value))return;
    cfg.explorerIcons=value;await plugin.saveSettings();plugin._writerCompanionManager?.refresh();
   }));
}
