'use strict';
/* First-run choices only change feature availability; existing vaults opt in. */
const WRITER_QUICK_START_PRESETS={
 essentials:['dictionary','translation','chat','review','snapshots','templates','cursorMemory','easyTyping','smartTypography','writingHome'],
 books:['dictionary','translation','chat','review','projects','writingHome','writingWidgets','bookNavigation','virtualContent','comments','snapshots','templates','cursorMemory','easyTyping','smartTypography','complements'],
 study:['dictionary','translation','review','study','calendar','writingHome','readingTime','tts','zoteroIntegration','styleMate','snapshots','templates','cursorMemory','easyTyping','extendedSyntax','pandocSyntax']
};
function writerQuickStartChoices(settings,preset='custom'){
 const enabled=WRITER_QUICK_START_PRESETS[preset];
 return Object.fromEntries(WRITER_MODULES.map(([id])=>[id,enabled?enabled.includes(id):settings.visibleModules?.[id]!==false]));
}
async function writerQuickStartApply(plugin,choices){
 const previous=plugin.settings.visibleModules,previousStart=plugin.settings.quickStart;
 const next={...previous};
 for(const [id] of WRITER_MODULES)if(typeof choices?.[id]==='boolean')next[id]=choices[id];
 plugin.settings.visibleModules=next;
 plugin.settings.quickStart={version:1,status:'complete'};
 try{await plugin.saveSettings();}
 catch(error){plugin.settings.visibleModules=previous;plugin.settings.quickStart=previousStart;throw error;}
 plugin.refreshModuleVisibility?.();
 plugin.writerV4Extras?.resetTypewriterHighlights?.();plugin.writerV4Extras?.updateTypewriterClass?.();
 plugin.writerV92Research?.refreshStyle?.();
 if(!writerModuleOn(plugin,'soundscapes'))plugin.writerV91Sound?.pause?.();
 plugin.writerV91Sound?.emit?.();
}
function writerQuickStartOpen(plugin,initial=false){
 if(plugin._writerQuickStartModal?.modalEl?.isConnected)return plugin._writerQuickStartModal;
 const modal=new Modal(plugin.app);plugin._writerQuickStartModal=modal;
 modal.modalEl.addClass('writer-v137-quick-start-modal');
 modal.setTitle(writerUi('Configuração inicial','Quick start'));
 let choices=writerQuickStartChoices(plugin.settings,initial?'essentials':'custom'),finished=false,busy=false;
 const close=modal.close.bind(modal);modal.close=()=>{if(!busy||finished)close();};
 modal.onOpen=()=>{
  const root=modal.contentEl;root.addClass('writer-v137-quick-start');
  root.createEl('p',{text:writerUi('Escolha os recursos que você quer usar. As opções desligadas ficam ocultas nos menus; suas configurações e dados continuam disponíveis.','Choose the features you want to use. Features you turn off are hidden from menus; their settings and data remain available.')});
  let preset=initial?'essentials':'custom';
  const controls=root.createDiv({cls:'writer-v137-quick-start-controls'});
  const select=controls.createEl('select',{attr:{'aria-label':writerUi('Ponto de partida','Starting point')}});
  for(const [id,pt,en] of [['essentials','Essencial','Essentials'],['books','Escrita de livros','Book writing'],['study','Estudo','Study'],['custom','Personalizado','Custom']]){
   const option=select.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  select.value=preset;
  const label=writerUi('Buscar recurso…','Find a feature…');
  const filter=controls.createEl('input',{attr:{type:'search','aria-label':label,placeholder:label}});
  const status=root.createEl('p',{cls:'writer-v137-quick-start-status',attr:{role:'status','aria-live':'polite'}});
  const list=root.createDiv({cls:'writer-v137-quick-start-list'}),rows=[];
  const update=()=>{
   const terms=writerV13SearchText(filter.value).split(/\s+/).filter(Boolean);let shown=0;
   for(const item of rows){item.row.hidden=!terms.every(term=>item.search.includes(term));if(!item.row.hidden)shown++;}
   const count=Object.values(choices).filter(Boolean).length;
   status.setText(count+' / '+WRITER_MODULES.length+' '+writerUi('recursos selecionados','features selected')+' · '+shown+' '+writerUi('na lista','in the list'));
  };
  const render=()=>{
   rows.length=0;list.empty();
   for(const [id,pt,en,descriptionPt,descriptionEn] of WRITER_MODULES){
    const setting=new Setting(list).setName(writerUi(pt,en)).setDesc(writerUi(descriptionPt,descriptionEn));
    const row=setting.settingEl;
    rows.push({row,search:writerV13SearchText([id,pt,en,descriptionPt,descriptionEn].join(' '))});
    setting.addToggle(toggle=>toggle.setValue(choices[id]).onChange(value=>{choices[id]=value;select.value='custom';update();}));
   }
   writerSettingsLabelControls(list);update();
  };
  select.addEventListener('change',()=>{
   preset=select.value;
   if(preset!=='custom')choices=writerQuickStartChoices(plugin.settings,preset);
   render();
  });
  filter.addEventListener('input',update);
  root.createEl('p',{cls:'writer-v137-quick-start-note',text:writerUi('Você pode mudar essas escolhas em Geral → Recursos. Conexões de IA são configuradas separadamente; esta tela não envia texto nem testa serviços.','You can change these choices in General → Features. AI connections are configured separately; this screen does not send text or test services.')});
  const footer=root.createDiv({cls:'writer-v137-quick-start-footer'});
  const later=footer.createEl('button',{text:writerUi('Configurar depois','Set up later'),attr:{type:'button'}});
  later.addEventListener('click',()=>{if(!busy)modal.close();});
  const apply=footer.createEl('button',{cls:'mod-cta',text:writerUi('Aplicar escolhas','Apply choices'),attr:{type:'button'}});
  apply.addEventListener('click',async()=>{
   if(busy)return;busy=true;apply.disabled=true;later.disabled=true;
   try{await writerQuickStartApply(plugin,choices);finished=true;modal.close();plugin.writerSettingsTab?.display?.();}
   catch(error){new Notice(String(error?.message||error));}
   finally{busy=false;apply.disabled=false;later.disabled=false;}
  });
  render();
 };
 modal.onClose=()=>{
  if(plugin._writerQuickStartModal===modal)plugin._writerQuickStartModal=null;
  if(initial&&!finished){
   plugin.settings.quickStart={version:1,status:'deferred'};
   void plugin.saveSettings().catch(error=>console.error('[Basic] Quick start preferences:',error));
  }
  modal.contentEl.empty();
 };
 modal.open();return modal;
}
function writerQuickStartRegister(plugin,firstInstall){
 plugin.addCommand({id:'v137-quick-start',name:writerUi('Configuração inicial: abrir','Quick start: open'),callback:()=>writerQuickStartOpen(plugin)});
 let stopped=false;
 plugin.register?.(()=>{stopped=true;plugin._writerQuickStartModal?.close();});
 if(!firstInstall)return;
 const open=()=>{if(!stopped&&!plugin.settings.quickStart)writerQuickStartOpen(plugin,true);};
 if(typeof plugin.app.workspace.onLayoutReady==='function')plugin.app.workspace.onLayoutReady(open);
 else open();
}
