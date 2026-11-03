'use strict';
/* 9.2.0 — independent local StyleMate-style controls and non-destructive Session Notes.
 * Styling is reversible via a single scoped sheet. Session notes exist outside vault
 * until the writer explicitly exports a note. */
const WRITER_V92_SESSION_VIEW='writer-session-notes';
const WRITER_V92_STYLE_DEFAULTS={enabled:false,pdfMode:false,
  textSize:16,lineHeight:1.6,paragraphSpacing:12,
  bodyColor:'',linkColor:'',quoteColor:'',quoteBorder:'',bulletColor:'',
  headingSizes:[2,1.7,1.42,1.25,1.12,1],headingColors:['','','','','',''],
  maxWidth:900,listIndent:28,quoteRadius:7};
function writerV92StyleMerge(settings){
 const old=settings.v92Style&&typeof settings.v92Style==='object'?settings.v92Style:{};
 const cfg=settings.v92Style={...WRITER_V92_STYLE_DEFAULTS,...old};
 cfg.enabled=cfg.enabled===true;cfg.pdfMode=cfg.pdfMode===true;
 for(const [key,min,max] of [['textSize',12,28],['lineHeight',1.1,2.4],['paragraphSpacing',0,36],
   ['maxWidth',480,1600],['listIndent',10,72],['quoteRadius',0,28]])
  cfg[key]=writerV92BoundNumber(cfg[key],WRITER_V92_STYLE_DEFAULTS[key],min,max);
 for(const key of ['bodyColor','linkColor','quoteColor','quoteBorder','bulletColor'])
  cfg[key]=writerV9SafeHex(cfg[key]);
 cfg.headingSizes=Array.from({length:6},(_,i)=>writerV92BoundNumber(cfg.headingSizes?.[i],WRITER_V92_STYLE_DEFAULTS.headingSizes[i],.75,3));
 cfg.headingColors=Array.from({length:6},(_,i)=>writerV9SafeHex(cfg.headingColors?.[i]));
 cfg.presets=cfg.presets&&typeof cfg.presets==='object'&&!Array.isArray(cfg.presets)?cfg.presets:{};
 return cfg;
}
function writerV92StyleRules(cfg){
 if(!cfg?.enabled)return '';
 const scope=':is(.markdown-preview-view,.markdown-source-view) ';
 const outer=':is(.markdown-preview-view,.markdown-source-view)';
 const props=[];
 const decl=(key,val)=>{if(val)props.push(key+':'+val+';');};
 decl('--writer-v92-text-size',cfg.textSize+'px');
 decl('--writer-v92-line-height',cfg.lineHeight);
 decl('--writer-v92-para-spacing',cfg.paragraphSpacing+'px');
 decl('--writer-v92-max-width',cfg.maxWidth+'px');
 decl('--writer-v92-list-indent',cfg.listIndent+'px');
 decl('--writer-v92-quote-radius',cfg.quoteRadius+'px');
 for(const [key,css] of [['bodyColor','--writer-v92-body-color'],['linkColor','--writer-v92-link-color'],
  ['quoteColor','--writer-v92-quote-color'],['quoteBorder','--writer-v92-quote-border'],['bulletColor','--writer-v92-bullet-color']])
  if(cfg[key])decl(css,cfg[key]);
 for(let i=0;i<6;i++){
  decl('--writer-v92-h'+(i+1)+'-size',cfg.headingSizes[i]+'em');
  if(cfg.headingColors[i])decl('--writer-v92-h'+(i+1)+'-color',cfg.headingColors[i]);
 }
 let sheet=outer+'{'+props.join('')+'}\n';
 sheet+=scope+':is(.markdown-preview-sizer,.cm-content){font-size:var(--writer-v92-text-size);line-height:var(--writer-v92-line-height);color:var(--writer-v92-body-color,var(--text-normal));max-width:var(--writer-v92-max-width);}\n';
 sheet+=scope+'.markdown-preview-sizer p{margin-bottom:var(--writer-v92-para-spacing);}\n';
 sheet+=scope+':is(a.internal-link,a.external-link,.cm-hmd-internal-link){color:var(--writer-v92-link-color,var(--link-color));}\n';
 sheet+=scope+':is(blockquote,.callout){color:var(--writer-v92-quote-color,var(--text-normal));border-left-color:var(--writer-v92-quote-border,var(--interactive-accent));border-radius:var(--writer-v92-quote-radius);}\n';
 sheet+=scope+':is(ul,ol){padding-inline-start:var(--writer-v92-list-indent);}\n';
 sheet+=scope+'li::marker{color:var(--writer-v92-bullet-color,var(--text-muted));}\n';
 for(let i=1;i<=6;i++){
  sheet+=scope+':is(h'+i+',.cm-header-'+i+'){font-size:var(--writer-v92-h'+i+'-size);';
  sheet+='color:var(--writer-v92-h'+i+'-color,var(--text-normal));}\n';
 }
 if(cfg.pdfMode)sheet+='@media print{:is(.markdown-preview-view,.markdown-source-view){filter:grayscale(1);color:#000;background:#fff;}}\n';
 return sheet;
}
function writerV92StyleRefresh(plugin){
 const id='writer-v92-stylemate',root=typeof document!=='undefined'?document:null;
 if(!root?.head)return;
 let style=root.getElementById(id);
 if(!plugin.settings.v92Style.enabled){
  style?.remove();return;
 }
 if(!style){style=root.createElement('style');style.id=id;root.head.appendChild(style);}
 style.textContent=writerV92StyleRules(plugin.settings.v92Style);
}
function writerV92StyleSettings(plugin,panel){
 const cfg=plugin.settings.v92Style;
 const save=async()=>{await plugin.saveSettings();writerV92StyleRefresh(plugin);};
 panel.createEl('h3',{text:writerUi('StyleMate · aparência das notas','StyleMate · note appearance')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Personalize a leitura e o Live Preview com tamanhos, cores, espaçamento e títulos H1–H6. As alterações são reversíveis e não editam o Markdown.',
  'Customize Reading and Live Preview with font sizes, colors, spacing, and H1–H6 headings. Changes are reversible and do not edit Markdown.'
 )});
 new Setting(panel).setName(writerUi('Ativar estilos das notas','Enable note styles'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await save();}));
 new Setting(panel).setName(writerUi('Modo PDF em preto e branco','Black & white PDF mode'))
  .addToggle(t=>t.setValue(cfg.pdfMode).onChange(async v=>{cfg.pdfMode=v;await save();}));
 for(const [key,pt,en,min,max,step] of [
  ['textSize','Tamanho do texto','Text size',12,28,1],
  ['lineHeight','Altura da linha','Line height',1.1,2.4,.1],
  ['paragraphSpacing','Espaçamento entre parágrafos','Paragraph spacing',0,36,2],
  ['listIndent','Recuo das listas','List indent',10,72,2],
  ['quoteRadius','Arredondamento de citações','Quote radius',0,28,1],
  ['maxWidth','Largura da leitura','Reading width',480,1600,20]
 ])new Setting(panel).setName(writerUi(pt,en)).addSlider(s=>s.setLimits(min,max,step).setDynamicTooltip().setValue(cfg[key])
   .onChange(async v=>{cfg[key]=v;await save();}));
 for(const [key,pt,en] of [['bodyColor','Cor do texto','Text color'],['linkColor','Cor dos links','Link color'],
  ['quoteColor','Cor das citações','Quote text color'],['quoteBorder','Barra de citação','Quote border'],
  ['bulletColor','Cor dos marcadores de lista','List marker color']])
  writerV9ColorSetting(panel,pt,en,cfg[key],async v=>{cfg[key]=v;await save();});
 const header=panel.createEl('h4',{text:writerUi('Títulos H1–H6','Headings H1–H6')});
 for(let i=0;i<6;i++){
  const n=i;
  new Setting(panel).setName('H'+(i+1)+' · '+writerUi('Tamanho relativo','Relative size'))
   .addSlider(s=>s.setLimits(.75,3,.05).setDynamicTooltip().setValue(cfg.headingSizes[n])
    .onChange(async v=>{cfg.headingSizes[n]=v;await save();}));
  writerV9ColorSetting(panel,'H'+(i+1)+' · '+writerUi('Cor','Color'),'H'+(i+1)+' color',
   cfg.headingColors[n],async v=>{cfg.headingColors[n]=v;await save();});
 }
 const row=panel.createDiv({cls:'writer-v92-style-presets'});
 row.createEl('h4',{text:writerUi('Perfis de estilo','Style presets')});
 const current=row.createEl('input',{attr:{type:'text',placeholder:writerUi('Nome do perfil','Preset name'),maxlength:45}});
 const select=row.createEl('select',{attr:{'aria-label':writerUi('Perfis salvos','Saved styles')}});
 const draw=()=>{
  select.empty();select.createEl('option',{text:writerUi('Escolher perfil…','Choose a preset…'),value:''});
  for(const key of Object.keys(cfg.presets).slice(0,25))select.createEl('option',{text:key,value:key});
 };
 draw();
 const actions=row.createDiv({cls:'writer-v92-style-actions'});
 const button=(title,handler)=>actions.createEl('button',{text:title,attr:{type:'button'}}).addEventListener('click',handler);
 button(writerUi('Salvar perfil','Save preset'),async()=>{
  const name=current.value.trim().slice(0,45);
  if(!name)return;
  cfg.presets[name]=JSON.parse(JSON.stringify({...cfg,presets:undefined}));
  await save();draw();select.value=name;
 });
 button(writerUi('Aplicar perfil','Apply preset'),async()=>{
  const item=cfg.presets[select.value];
  if(!item)return;
  const presets=cfg.presets;
  Object.assign(cfg,item,{presets});writerV92StyleMerge(plugin.settings);
  await save();plugin.writerSettingsTab?.display?.();
 });
 button(writerUi('Padrões originais','Restore defaults'),async()=>{
  const presets=cfg.presets;Object.assign(cfg,JSON.parse(JSON.stringify(WRITER_V92_STYLE_DEFAULTS)),{presets,enabled:true});
  await save();plugin.writerSettingsTab?.display?.();
 });
 button(writerUi('Copiar CSS','Copy CSS'),async()=>{
  try{await navigator.clipboard.writeText(writerV92StyleRules(cfg));new Notice(writerUi('CSS copiado.','CSS copied.'));}
  catch(_){new Notice(writerUi('Área de transferência indisponível.','Clipboard unavailable.'));}
 });
}
function writerV92SessionMerge(settings){
 const old=settings.v92Session&&typeof settings.v92Session==='object'?settings.v92Session:{};
 const cfg=settings.v92Session={enabled:true,autoClearTemp:false,...old};
 cfg.enabled=cfg.enabled!==false;cfg.autoClearTemp=cfg.autoClearTemp===true;
 return cfg;
}
function writerV92SessionStorageKey(plugin){
 return 'writer-v92-session:'+String(plugin.manifest?.id||'basic-ai')+':'+String(plugin.app.vault.getName?.()||'vault');
}
function writerV92SessionClean(raw){
 const data=raw&&typeof raw==='object'?raw:{},list=Array.isArray(data.notes)?data.notes:[];
 return {selected:String(data.selected||''),notes:list.slice(0,30).filter(x=>x&&typeof x==='object')
  .map((x,i)=>({id:String(x.id||i).slice(0,70),title:String(x.title||'').slice(0,120),
   body:String(x.body||'').slice(0,120000),kind:x.kind==='temporary'?'temporary':'session'}))};
}
class WriterV92SessionNotes{
 constructor(plugin){this.plugin=plugin;this.state={selected:'',notes:[]};}
 load(){
  try{const raw=sessionStorage.getItem(writerV92SessionStorageKey(this.plugin));if(raw)this.state=writerV92SessionClean(JSON.parse(raw));}
  catch(_){}
 }
 persist(){
  try{sessionStorage.setItem(writerV92SessionStorageKey(this.plugin),JSON.stringify(this.state));}catch(_){}
 }
 create(kind='session'){
  const note={id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
   title:kind==='temporary'?writerUi('Rascunho rápido','Quick scratch'):writerUi('Nota da sessão','Session note'),body:'',kind};
  this.state.notes.unshift(note);this.state.notes=this.state.notes.slice(0,30);
  this.state.selected=note.id;this.persist();return note;
 }
 selected(){return this.state.notes.find(x=>x.id===this.state.selected)||this.state.notes[0]||null;}
 async export(note){
  const raw=String(note?.title||writerUi('Nota de sessão','Session note')).replace(/[\\/:*?"<>|]/g,'-').slice(0,75);
  const folder='';let path=raw+'.md',n=2;
  while(this.plugin.app.vault.getAbstractFileByPath(path))path=raw+' ('+n+++').md';
  try{
   const file=await this.plugin.app.vault.create(path,'# '+raw+'\n\n'+note.body);
   await this.plugin.app.workspace.getLeaf('tab').openFile(file);
   new Notice(writerUi('Nota exportada para: ','Note exported to: ')+path);
  }catch(error){new Notice(String(error?.message||error));}
 }
 async open(){
  const workspace=this.plugin.app.workspace;
  let leaf=(workspace.getLeavesOfType?.(WRITER_V92_SESSION_VIEW)||[])[0];
  if(!leaf){leaf=workspace.getRightLeaf?.(false)||workspace.getLeaf?.('tab');if(!leaf)return;
   await leaf.setViewState({type:WRITER_V92_SESSION_VIEW,active:true});}
  await workspace.revealLeaf?.(leaf);
 }
 register(){
  const plugin=this.plugin;this.load();
  plugin.registerView?.(WRITER_V92_SESSION_VIEW,leaf=>new WriterV92SessionView(leaf,this));
  plugin.addCommand({id:'v92-session-open',name:writerUi('Notas de sessão: abrir painel','Session Notes: open panel'),callback:()=>void this.open()});
  for(const [kind,pt,en] of [['temporary','Criar rascunho temporário','Create temporary scratch note'],
   ['session','Criar nota da sessão','Create session note']]){
   plugin.addCommand({id:'v92-session-new-'+kind,name:writerUi(pt,en),callback:async()=>{
    this.create(kind);await this.open();
    for(const leaf of plugin.app.workspace.getLeavesOfType?.(WRITER_V92_SESSION_VIEW)||[])leaf.view?.render?.();
   }});
  }
  plugin.register?.(()=>this.persist());
 }
}
class WriterV92SessionView extends ItemView{
 constructor(leaf,manager){super(leaf);this.manager=manager;}
 getViewType(){return WRITER_V92_SESSION_VIEW;}
 getDisplayText(){return writerUi('Notas de sessão','Session Notes');}
 getIcon(){return 'notebook-tabs';}
 async onOpen(){this.render();}
 render(){
  const manager=this.manager,root=this.contentEl,setting=manager.plugin.settings.v92Session;
  root.empty();root.addClass('writer-v92-sessions');
  const head=root.createDiv({cls:'writer-v92-session-head'});
  head.createEl('strong',{text:writerUi('Notas de sessão','Session Notes')});
  const controls=head.createDiv({cls:'writer-v92-session-actions'});
  const btn=(label,handler)=>controls.createEl('button',{text:label,attr:{type:'button'}}).addEventListener('click',handler);
  btn('+ '+writerUi('Temporária','Temporary'),()=>{manager.create('temporary');this.render();});
  btn('+ '+writerUi('Sessão','Session'),()=>{manager.create('session');this.render();});
  if(!setting.enabled){
   root.createEl('p',{text:writerUi('Ative o módulo nas configurações.','Enable this module in settings.')});return;
  }
  const wrap=root.createDiv({cls:'writer-v92-session-body'});
  const nav=wrap.createDiv({cls:'writer-v92-session-list'});
  const active=manager.selected();
  for(const note of manager.state.notes){
   const tab=nav.createEl('button',{cls:'writer-v92-session-tab'+(note.id===active?.id?' is-active':''),
    text:(note.kind==='temporary'?'◌ ':'◷ ')+(note.title||writerUi('Sem título','Untitled')),
    attr:{type:'button'}});
   tab.addEventListener('click',()=>{
    if(setting.autoClearTemp&&active?.kind==='temporary'&&active?.id!==note.id){
     manager.state.notes=manager.state.notes.filter(x=>x.id!==active.id);
    }
    manager.state.selected=note.id;manager.persist();this.render();
   });
  }
  if(!active){
   wrap.createEl('p',{cls:'dictionary-muted',text:writerUi('Crie uma nota temporária ou de sessão.','Create a temporary or session note.')});return;
  }
  const editor=wrap.createDiv({cls:'writer-v92-session-editor'});
  const title=editor.createEl('input',{cls:'writer-v92-session-title',attr:{type:'text',maxlength:120,'aria-label':writerUi('Título','Title')}});
  title.value=active.title;
  title.addEventListener('input',()=>{active.title=title.value.slice(0,120);manager.persist();});
  const body=editor.createEl('textarea',{cls:'writer-v92-session-text',attr:{rows:14,placeholder:writerUi('Escreva livremente nesta sessão…','Write freely in this session…')}});
  body.value=active.body;
  body.addEventListener('input',()=>{active.body=body.value.slice(0,120000);manager.persist();});
  const buttons=editor.createDiv({cls:'writer-v92-session-editor-actions'});
  const make=(label,handler)=>buttons.createEl('button',{text:label,attr:{type:'button'}}).addEventListener('click',handler);
  make(writerUi('Exportar Markdown','Export Markdown'),()=>void manager.export(active));
  make(writerUi('Excluir rascunho','Delete scratch'),()=>{
   const modal=new Modal(manager.plugin.app);
   modal.onOpen=()=>{
    modal.setTitle(writerUi('Excluir esta nota da sessão?','Delete this session note?'));
    modal.contentEl.createEl('p',{text:writerUi('Este rascunho não existe no cofre; a exclusão não pode ser desfeita.','This scratch note is not in your vault; deletion cannot be undone.')});
    new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Excluir','Delete')).setWarning().onClick(()=>{
     manager.state.notes=manager.state.notes.filter(n=>n.id!==active.id);
     manager.state.selected=manager.state.notes[0]?.id||'';manager.persist();modal.close();this.render();
    })).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
   };modal.open();
  });
 }
}
function writerV92StyleSessionRegister(plugin){
 writerV92StyleRefresh(plugin);
 plugin.register?.(()=>{
  if(typeof document!=='undefined')document.getElementById('writer-v92-stylemate')?.remove();
 });
 plugin.writerV92Sessions=new WriterV92SessionNotes(plugin);
 plugin.writerV92Sessions.register();
}
function writerV92SessionSettings(plugin,panel){
 const cfg=plugin.settings.v92Session;
 panel.createEl('h3',{text:writerUi('Rascunhos temporários e notas de sessão','Temporary scratch and Session Notes')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Notas privadas na sessão do aplicativo, fora do cofre até exportar. Não exclui arquivos do cofre automaticamente. Uma nota temporária pode ser apagada ao trocar de rascunho se você ativar essa opção.',
  'Session-local scratch notes outside the vault until exported. Never automatically deletes vault files. Temporary scratch notes may be cleared on selection change if you opt in.'
 )});
 new Setting(panel).setName(writerUi('Ativar notas de sessão','Enable session notes'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Descartar rascunhos temporários ao trocar de nota','Discard temporary notes when switching'))
  .setDesc(writerUi('Desativado por segurança. Exporte qualquer texto importante antes de descartar.','Off by default for safety. Export important content before discarding.'))
  .addToggle(t=>t.setValue(cfg.autoClearTemp).onChange(async v=>{cfg.autoClearTemp=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Abrir notas de sessão','Open Session Notes'))
  .addButton(b=>b.setButtonText(writerUi('Abrir painel','Open panel')).onClick(()=>void plugin.writerV92Sessions?.open()));
}
