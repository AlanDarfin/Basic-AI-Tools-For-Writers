'use strict';
/* 9.1.2: independent Virtual Content integration inspired by Signynt/virtual-content (MIT).
 * Applies bounded Markdown templates to views, never writes into the note itself.
 * The existing BookNav is reused instead of having a second navigation engine. */
const WRITER_V912_VIRTUAL_VIEW='writer-virtual-content';
const WRITER_V912_VIRTUAL_LOCATIONS=['header','footer','sidebar','section-start','section-end'];
const WRITER_V912_VIRTUAL_SOURCES=['text','file','booknav'];
const WRITER_V912_VIRTUAL_MAX_RULES=40;
function writerV912VirtualCondition(raw){
 const value=raw&&typeof raw==='object'?raw:{};
 return {
  type:['all','folder','tag','property'].includes(value.type)?value.type:'folder',
  value:String(value.value||'').trim().slice(0,300),
  property:String(value.property||'').trim().slice(0,120),
  operator:['equals','contains','exists'].includes(value.operator)?value.operator:'equals',
  recursive:value.recursive!==false,
  negate:value.negate===true
 };
}
function writerV912VirtualRule(raw,index){
 const x=raw&&typeof raw==='object'?raw:{};
 const id=/^[a-zA-Z0-9_-]{1,60}$/.test(String(x.id||''))?x.id:'rule-'+index;
 return {
  id,name:String(x.name||writerUi('Regra sem nome','Unnamed rule')).trim().slice(0,90),
  enabled:x.enabled!==false,
  conditions:(Array.isArray(x.conditions)?x.conditions:[{type:'folder',value:''}]).slice(0,6).map(writerV912VirtualCondition),
  match:x.match==='any'?'any':'all',
  source:WRITER_V912_VIRTUAL_SOURCES.includes(x.source)?x.source:'text',
  text:String(x.text||'').slice(0,16000),
  file:String(x.file||'').trim().slice(0,500),
  location:WRITER_V912_VIRTUAL_LOCATIONS.includes(x.location)?x.location:'footer',
  section:String(x.section||'').trim().slice(0,120),
  sectionLevel:Math.max(0,Math.min(6,Math.floor(Number(x.sectionLevel)||0))),
  separateTab:x.separateTab===true
 };
}
function writerV912VirtualMerge(settings){
 const old=settings.v912Virtual&&typeof settings.v912Virtual==='object'&&!Array.isArray(settings.v912Virtual)?settings.v912Virtual:{};
 const cfg=settings.v912Virtual={enabled:true,autoBookNav:true,showLivePreview:true,rules:[],...old};
 cfg.enabled=cfg.enabled!==false;cfg.autoBookNav=cfg.autoBookNav!==false;cfg.showLivePreview=cfg.showLivePreview!==false;
 const seen=new Set();
 cfg.rules=(Array.isArray(cfg.rules)?cfg.rules:[]).slice(0,WRITER_V912_VIRTUAL_MAX_RULES)
  .map((r,i)=>writerV912VirtualRule(r,i)).filter(r=>{
   if(seen.has(r.id))return false;seen.add(r.id);return true;
  });
 return cfg;
}
function writerV912VirtualTags(cache){
 const values=[];
 const meta=cache?.frontmatter||{};
 const add=item=>{
  if(Array.isArray(item)){for(const x of item)add(x);return;}
  if(typeof item==='string'){
   for(const x of item.split(/[\s,]+/))if(x.trim())values.push(x.replace(/^#/,'').trim().toLocaleLowerCase());
  }
 };
 add(meta.tags);add(meta.tag);
 for(const tag of cache?.tags||[])add(tag?.tag);
 return [...new Set(values)];
}
function writerV912VirtualProperty(meta,key){
 if(!key)return undefined;
 let value=meta;
 for(const part of key.split('.')){
  if(!value||typeof value!=='object'||Array.isArray(value)||!Object.prototype.hasOwnProperty.call(value,part))return undefined;
  value=value[part];
 }
 return value;
}
function writerV912VirtualConditionMatch(condition,file,cache){
 const c=writerV912VirtualCondition(condition),value=c.value.toLocaleLowerCase();
 let ok=false;
 if(c.type==='all')ok=true;
 if(c.type==='folder'){
  const dir=String(file?.parent?.path||file?.path?.split('/').slice(0,-1).join('/')||'').replace(/^\/|\/$/g,'').toLocaleLowerCase();
  const target=value.replace(/^\/|\/$/g,'');
  ok=!target||dir===target||(c.recursive&&dir.startsWith(target+'/'));
 }
 if(c.type==='tag'){
  const target=value.replace(/^#/,'');
  ok=!!target&&writerV912VirtualTags(cache).some(tag=>tag===target||(c.recursive&&tag.startsWith(target+'/')));
 }
 if(c.type==='property'){
  const raw=writerV912VirtualProperty(cache?.frontmatter||{},c.property);
  if(c.operator==='exists')ok=raw!==undefined&&raw!==null;
  else if(raw!==undefined&&raw!==null&&value){
   const values=Array.isArray(raw)?raw:[raw];
   ok=values.some(item=>{
    const text=String(item).toLocaleLowerCase();
    return c.operator==='contains'?text.includes(value):text===value;
   });
  }
 }
 return c.negate?!ok:ok;
}
function writerV912VirtualMatch(rule,file,cache){
 if(!rule||rule.enabled===false||!file||file.extension!=='md')return false;
 const conditions=Array.isArray(rule.conditions)?rule.conditions:[];
 if(!conditions.length)return false;
 const results=conditions.map(c=>writerV912VirtualConditionMatch(c,file,cache));
 return rule.match==='any'?results.some(Boolean):results.every(Boolean);
}
function writerV912HasBookNavRule(plugin,filePath){
 const cfg=plugin?.settings?.v912Virtual;
 if(!cfg?.enabled||!writerModuleOn(plugin,'virtualContent')||!filePath)return false;
 const file=plugin.app.vault.getAbstractFileByPath(filePath);
 if(!(file instanceof TFile))return false;
 const cache=plugin.app.metadataCache?.getFileCache?.(file);
 return cfg.rules.some(rule=>rule.source==='booknav'&&writerV912VirtualMatch(rule,file,cache));
}
function writerV912VirtualSubstitute(text,file){
 return String(text||'').replace(/\{\{file\.(name|path|folder)\}\}/gi,(_all,key)=>{
  const map={name:file?.basename||'',path:file?.path||'',folder:file?.parent?.path||''};
  return map[key.toLowerCase()]||'';
 });
}
async function writerV912VirtualResolve(plugin,rule,file){
 if(rule.source==='booknav')return {kind:'booknav',sourcePath:file.path,content:''};
 if(rule.source==='text')return {kind:'markdown',sourcePath:file.path,content:writerV912VirtualSubstitute(rule.text,file)};
 const raw=rule.file.replace(/^\[\[/,'').replace(/\]\]$/,'').split('|')[0].split('#')[0].trim();
 if(!raw)return null;
 const source=plugin.app.metadataCache?.getFirstLinkpathDest?.(raw,file.path)||
  plugin.app.vault.getAbstractFileByPath(raw)||
  plugin.app.vault.getAbstractFileByPath(raw.endsWith('.md')?raw:raw+'.md');
 if(!(source instanceof TFile)||source.extension!=='md'||source.path===file.path)return null;
 try{
  const text=await plugin.app.vault.cachedRead(source);
  if(typeof text!=='string'||text.length>16000)return null;
  return {kind:'markdown',sourcePath:source.path,content:writerV912VirtualSubstitute(text,file)};
 }catch(error){console.warn('[Basic AI] Virtual Content source:',error);return null;}
}
async function writerV912VirtualRender(plugin,data,host,component,file){
 if(data.kind==='booknav'){
  if(!writerModuleOn(plugin,'bookNavigation')||plugin.settings.bookNavigation?.enabled===false)return false;
  const match=await writerBookNavFindProjectAsync(plugin.app,file.path,plugin.settings.lastLongformProject);
  if(!match)return false;
  const targets=writerBookNavTargets(match.items,file.path);
  const buttons=targets?writerBookNavButtons(targets,plugin.settings.bookNavigation||{}):[];
  return writerBookNavRenderButtons(host,plugin.app,buttons,{automatic:true});
 }
 if(!data.content.trim())return false;
 await MarkdownRenderer.render(plugin.app,data.content,host,data.sourcePath,component);
 return true;
}
function writerV912VirtualSectionTarget(root,rule){
 const heading=rule.section.trim().toLocaleLowerCase();
 if(!heading)return null;
 const selector=rule.sectionLevel?'h'+rule.sectionLevel:'h1,h2,h3,h4,h5,h6';
 const found=[...root.querySelectorAll(selector)].find(node=>
  !node.closest('.writer-v912-virtual-block')&&String(node.textContent||'').trim().toLocaleLowerCase()===heading);
 if(!found)return null;
 if(rule.location==='section-start')return {position:'after',node:found};
 // Bottom of the section, before the next heading of equal/higher importance.
 const level=Number(found.tagName.slice(1));
 let current=found;
 while(current.nextElementSibling){
  const next=current.nextElementSibling;
  const h=/^H[1-6]$/.test(next.tagName)?next:next.querySelector?.('h1,h2,h3,h4,h5,h6');
  if(h&&Number(h.tagName.slice(1))<=level)break;
  current=next;
 }
 return {position:'after',node:current};
}
function writerV912VirtualPlace(root,node,rule,reading){
 if(rule.location==='header'){
  const props=reading?root.querySelector('.metadata-container'):null;
  if(props&&props.parentElement===root)props.after(node);
  else root.prepend(node);
  return true;
 }
 if(rule.location==='footer'){root.appendChild(node);return true;}
 if(!reading)return false;
 const location=writerV912VirtualSectionTarget(root,rule);
 if(!location)return false;
 location.node.after(node);return true;
}
class WriterV912VirtualSideView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.run=0;this.current='';}
 getViewType(){return WRITER_V912_VIRTUAL_VIEW;}
 getDisplayText(){return writerUi('Conteúdo virtual','Virtual Content');}
 getIcon(){return 'panels-top-left';}
 async onOpen(){await this.render();}
 async render(){
  const ticket=++this.run,plugin=this.plugin,root=this.contentEl;
  root.empty();root.addClass('writer-v912-sidebar');
  const head=root.createDiv({cls:'writer-v912-sidebar-heading'});
  head.createEl('strong',{text:writerUi('Conteúdo virtual','Virtual Content')});
  const file=plugin.app.workspace.getActiveFile?.();
  if(!(file instanceof TFile)||file.extension!=='md'){
   root.createEl('p',{cls:'dictionary-muted',text:writerUi('Abra uma nota Markdown para ver seu conteúdo dinâmico.','Open a Markdown note to see matching virtual content.')});return;
  }
  if(!plugin.settings.v912Virtual?.enabled||!writerModuleOn(plugin,'virtualContent'))return;
  const cache=plugin.app.metadataCache?.getFileCache?.(file);
  const rules=plugin.settings.v912Virtual.rules.filter(rule=>rule.location==='sidebar'&&writerV912VirtualMatch(rule,file,cache));
  if(!rules.length){
   root.createEl('p',{cls:'dictionary-muted',text:writerUi('Nenhuma regra lateral se aplica a esta nota.','No sidebar rules match this note.')});return;
  }
  const grouped=rules.filter(rule=>!rule.separateTab),separate=rules.filter(rule=>rule.separateTab);
  const options=[...(grouped.length?[{id:'combined',name:writerUi('Geral','General'),rules:grouped}]:[]),
   ...separate.map(rule=>({id:rule.id,name:rule.name,rules:[rule]}))];
  if(!options.some(x=>x.id===this.current))this.current=options[0].id;
  const tabs=root.createDiv({cls:'writer-v912-sidebar-tabs',attr:{role:'tablist'}});
  if(options.length>1)for(const option of options){
   const button=tabs.createEl('button',{text:option.name,attr:{type:'button',role:'tab','aria-selected':String(option.id===this.current)}});
   button.classList.toggle('is-active',option.id===this.current);
   button.addEventListener('click',()=>{this.current=option.id;void this.render();});
  }
  const chosen=options.find(x=>x.id===this.current)||options[0];
  for(const rule of chosen.rules){
   const data=await writerV912VirtualResolve(plugin,rule,file);
   if(ticket!==this.run||!root.isConnected||plugin.app.workspace.getActiveFile?.()?.path!==file.path)return;
   if(!data)continue;
   const card=root.createDiv({cls:'writer-v912-sidebar-card'});
   if(chosen.rules.length>1)card.createEl('h4',{text:rule.name});
   const holder=card.createDiv({cls:'markdown-rendered writer-v912-sidebar-content'});
   const component=new (require('obsidian').Component)();component.load();
   this.addChild(component);
   await writerV912VirtualRender(plugin,data,holder,component,file);
   if(ticket!==this.run)return;
  }
 }
 async onClose(){this.run++;}
}
class WriterV912VirtualContent{
 constructor(plugin){this.plugin=plugin;this.timer=null;this.generation=0;this.mounted=new Map();}
 get cfg(){return this.plugin.settings.v912Virtual;}
 active(){return this.cfg?.enabled&&writerModuleOn(this.plugin,'virtualContent');}
 clear(leaf){
  const state=this.mounted.get(leaf);
  if(!state)return;
  for(const component of state.components)try{component.unload();}catch(_){}
  for(const node of state.nodes)node.remove?.();
  this.mounted.delete(leaf);
 }
 clearAll(){for(const leaf of this.mounted.keys())this.clear(leaf);}
 async refresh(){
  const ticket=++this.generation;
  if(!this.active()){this.clearAll();this.renderSidebar();return;}
  const leaves=this.plugin.app.workspace.getLeavesOfType?.('markdown')||[];
  for(const leaf of this.mounted.keys())if(!leaves.includes(leaf))this.clear(leaf);
  await Promise.all(leaves.map(leaf=>this.renderLeaf(leaf,ticket)));
  if(ticket===this.generation)this.renderSidebar();
 }
 schedule(){
  clearTimeout(this.timer);
  this.timer=setTimeout(()=>{this.timer=null;void this.refresh().catch(error=>console.warn('[Basic AI] Virtual Content:',error));},180);
 }
 renderSidebar(){for(const leaf of this.plugin.app.workspace.getLeavesOfType?.(WRITER_V912_VIRTUAL_VIEW)||[])void leaf.view?.render?.();}
 async renderLeaf(leaf,ticket){
  const view=leaf.view,file=view?.file;
  if(!(file instanceof TFile)||file.extension!=='md'){this.clear(leaf);return;}
  const reading=view.getMode?.()==='preview',source=view.getMode?.()==='source';
  if(!reading&&!source){this.clear(leaf);return;}
  if(source&&!this.cfg.showLivePreview){this.clear(leaf);return;}
  const root=reading?view.previewMode?.containerEl?.querySelector?.('.markdown-preview-sizer'):
   view.containerEl?.querySelector?.('.markdown-source-view .cm-sizer');
  if(!root){this.clear(leaf);return;}
  const cache=this.plugin.app.metadataCache?.getFileCache?.(file);
  const applicable=this.cfg.rules.filter(r=>r.location!=='sidebar'&&writerV912VirtualMatch(r,file,cache)&&
   (reading||!r.location.startsWith('section-')));
  const ready=[];
  for(const rule of applicable){
   const data=await writerV912VirtualResolve(this.plugin,rule,file);
   if(data&&(data.kind==='booknav'||data.content.trim()))ready.push({rule,data});
   if(ticket!==this.generation||leaf.view?.file?.path!==file.path)return;
  }
  if(ticket!==this.generation)return;
  this.clear(leaf);
  const state={nodes:[],components:[]};this.mounted.set(leaf,state);
  for(const item of ready){
   if(ticket!==this.generation||!root.isConnected||leaf.view?.file?.path!==file.path)break;
   const host=root.ownerDocument.createElement('div');
   host.className='writer-v912-virtual-block markdown-rendered writer-v912-virtual-'+item.rule.location;
   host.dataset.ruleId=item.rule.id;
   host.setAttribute('aria-label',item.rule.name);
   if(!writerV912VirtualPlace(root,host,item.rule,reading))continue;
   state.nodes.push(host);
   const component=new (require('obsidian').Component)();
   component.load();state.components.push(component);
   try{
    const visible=await writerV912VirtualRender(this.plugin,item.data,host,component,file);
    if(!visible)host.remove();
   }catch(error){host.remove();console.warn('[Basic AI] Virtual Content render:',error);}
  }
 }
 async openSidebar(){
  const workspace=this.plugin.app.workspace;
  let leaf=(workspace.getLeavesOfType?.(WRITER_V912_VIRTUAL_VIEW)||[])[0];
  if(!leaf){
   leaf=workspace.getRightLeaf?.(false)||workspace.getLeaf?.('tab');
   if(!leaf)return;
   await leaf.setViewState({type:WRITER_V912_VIRTUAL_VIEW,active:true});
  }
  await workspace.revealLeaf?.(leaf);
  await leaf.view?.render?.();
 }
 register(){
  const plugin=this.plugin;
  plugin.registerView?.(WRITER_V912_VIRTUAL_VIEW,leaf=>new WriterV912VirtualSideView(leaf,plugin));
  plugin.addCommand?.({id:'v912-open-virtual-content',name:writerUi('Conteúdo virtual: abrir na lateral','Virtual Content: open sidebar'),
   callback:()=>void this.openSidebar()});
  plugin.addCommand?.({id:'v912-refresh-virtual-content',name:writerUi('Conteúdo virtual: atualizar regras','Virtual Content: refresh rules'),
   callback:()=>void this.refresh()});
  for(const name of ['file-open','layout-change','active-leaf-change'])
   if(typeof plugin.app.workspace.on==='function')plugin.registerEvent(plugin.app.workspace.on(name,()=>this.schedule()));
  if(typeof plugin.app.metadataCache?.on==='function')
   plugin.registerEvent(plugin.app.metadataCache.on('changed',()=>this.schedule()));
  for(const name of ['modify','rename','delete','create'])
   if(typeof plugin.app.vault.on==='function')plugin.registerEvent(plugin.app.vault.on(name,()=>this.schedule()));
  plugin.app.workspace.onLayoutReady?.(()=>this.schedule());
  plugin.register?.(()=>{clearTimeout(this.timer);this.generation++;this.clearAll();});
 }
}
function writerV912VirtualRuleEditor(plugin,existing,done){
 const modal=new Modal(plugin.app);
 const data=writerV912VirtualRule(existing||{name:writerUi('Nova regra','New rule'),conditions:[{type:'folder',value:''}],source:'text',location:'footer'},Date.now());
 if(!existing)data.id='rule-'+Date.now().toString(36);
 modal.onOpen=()=>{
  modal.setTitle(existing?writerUi('Editar regra virtual','Edit virtual rule'):writerUi('Criar regra virtual','Create virtual rule'));
  const content=modal.contentEl;content.addClass('writer-v912-rule-editor');
  new Setting(content).setName(writerUi('Nome da regra','Rule name')).addText(t=>t.setValue(data.name)
   .onChange(v=>{data.name=v.slice(0,90);}));
  new Setting(content).setName(writerUi('Combinação das condições','Condition matching')).addDropdown(d=>
   d.addOption('all',writerUi('Todas (E)','All (AND)')).addOption('any',writerUi('Qualquer (OU)','Any (OR)'))
    .setValue(data.match).onChange(v=>{data.match=v;}));
  const condArea=content.createDiv({cls:'writer-v912-condition-list'});
  const showConditions=()=>{
   condArea.empty();
   for(const [i,c] of data.conditions.entries()){
    const card=condArea.createDiv({cls:'writer-v912-condition-card'});
    const row=card.createDiv({cls:'writer-v912-condition-row'});
    const kind=row.createEl('select',{attr:{'aria-label':writerUi('Tipo de condição','Condition type')}});
    for(const [id,pt,en] of [['all','Todas as notas','All notes'],['folder','Pasta','Folder'],['tag','Tag','Tag'],['property','Propriedade','Property']]){
     const opt=kind.createEl('option',{text:writerUi(pt,en)});opt.value=id;
    }
    kind.value=c.type;kind.addEventListener('change',()=>{c.type=kind.value;showConditions();});
    const remove=row.createEl('button',{text:'×',attr:{type:'button',title:writerUi('Remover condição','Remove condition')}});
    remove.disabled=data.conditions.length===1;
    remove.addEventListener('click',()=>{data.conditions.splice(i,1);showConditions();});
    if(c.type==='property'){
     new Setting(card).setName(writerUi('Nome da propriedade','Property name')).addText(t=>t.setPlaceholder('status')
      .setValue(c.property).onChange(v=>{c.property=v.slice(0,120);}));
     new Setting(card).setName(writerUi('Comparação','Comparison')).addDropdown(d=>
      d.addOption('equals',writerUi('Igual','Equals')).addOption('contains',writerUi('Contém','Contains'))
       .addOption('exists',writerUi('Existe','Exists')).setValue(c.operator).onChange(v=>{c.operator=v;}));
    }
    if(c.type!=='all'&&!(c.type==='property'&&c.operator==='exists')){
     new Setting(card).setName(c.type==='folder'?writerUi('Pasta (vazio = cofre inteiro)','Folder (blank = entire vault)'):
      c.type==='tag'?'Tag':writerUi('Valor','Value')).addText(t=>t.setValue(c.value)
       .setPlaceholder(c.type==='folder'?'Books/Chapters':c.type==='tag'?'writing/chapters':'draft')
       .onChange(v=>{c.value=v.slice(0,300);}));
    }
    new Setting(card).setName(writerUi('Incluir subpastas / subtags','Include nested folders / tags'))
     .addToggle(t=>t.setValue(c.recursive).onChange(v=>{c.recursive=v;}));
    new Setting(card).setName(writerUi('Inverter esta condição','Negate this condition'))
     .addToggle(t=>t.setValue(c.negate).onChange(v=>{c.negate=v;}));
   }
  };
  showConditions();
  new Setting(content).addButton(b=>b.setButtonText(writerUi('Adicionar condição','Add condition')).onClick(()=>{
   if(data.conditions.length>=6)return;
   data.conditions.push(writerV912VirtualCondition({type:'tag',value:''}));showConditions();
  }));
  new Setting(content).setName(writerUi('Posição do conteúdo','Content position')).addDropdown(d=>{
   for(const [id,pt,en] of [
    ['header','Cabeçalho','Header'],['footer','Rodapé','Footer'],['sidebar','Painel lateral','Sidebar'],
    ['section-start','Início da seção (leitura)','Section start (reading)'],
    ['section-end','Fim da seção (leitura)','Section end (reading)']
   ])d.addOption(id,writerUi(pt,en));
   d.setValue(data.location).onChange(v=>{data.location=v;extraLocation();});
  });
  const sectionRow=new Setting(content).setName(writerUi('Título da seção','Section heading'))
   .addText(t=>t.setPlaceholder('## Chapter').setValue(data.section).onChange(v=>{data.section=v.slice(0,120);}));
  const levelRow=new Setting(content).setName(writerUi('Nível do título','Heading level'))
   .addDropdown(d=>{for(let i=0;i<=6;i++)d.addOption(String(i),i?('H'+i):writerUi('Qualquer','Any'));
    d.setValue(String(data.sectionLevel)).onChange(v=>{data.sectionLevel=Number(v);});});
  const separateRow=new Setting(content).setName(writerUi('Aba própria no painel lateral','Own sidebar tab'))
   .addToggle(t=>t.setValue(data.separateTab).onChange(v=>{data.separateTab=v;}));
  const extraLocation=()=>{
   const sectional=data.location.startsWith('section-');
   sectionRow.settingEl.style.display=sectional?'':'none';
   levelRow.settingEl.style.display=sectional?'':'none';
   separateRow.settingEl.style.display=data.location==='sidebar'?'':'none';
  };
  extraLocation();
  new Setting(content).setName(writerUi('Fonte do conteúdo','Content source')).addDropdown(d=>{
   for(const [id,pt,en] of [['text','Markdown digitado','Typed Markdown'],['file','Nota modelo do cofre','Vault template note'],
    ['booknav','BookNav automático (Longform)','Automatic BookNav (Longform)']])d.addOption(id,writerUi(pt,en));
   d.setValue(data.source).onChange(v=>{data.source=v;sourceUI();});
  });
  const textSetting=new Setting(content).setName('Markdown').addTextArea(t=>{t.inputEl.rows=7;t.setValue(data.text)
   .onChange(v=>{data.text=v.slice(0,16000);});});
  const fileSetting=new Setting(content).setName(writerUi('Nota modelo','Template note')).addText(t=>t.setValue(data.file)
   .setPlaceholder('Templates/Book footer.md').onChange(v=>{data.file=v.slice(0,500);}));
  const sourceUI=()=>{
   textSetting.settingEl.style.display=data.source==='text'?'':'none';
   fileSetting.settingEl.style.display=data.source==='file'?'':'none';
  };
  sourceUI();
  content.createEl('p',{cls:'dictionary-muted',text:writerUi(
   'Use {{file.name}}, {{file.path}} ou {{file.folder}} como variáveis. O BookNav usa a ordem real do projeto; notas não são alteradas. Seções são renderizadas somente no modo Leitura.',
   'Use {{file.name}}, {{file.path}} or {{file.folder}}. BookNav follows the actual project index; notes are never changed. Sections render only in Reading mode.'
  )});
  const error=content.createEl('p',{cls:'writer-v912-error'});
  new Setting(content).addButton(b=>b.setButtonText(writerUi('Salvar regra','Save rule')).setCta().onClick(async()=>{
   const rule=writerV912VirtualRule(data,0);
   if(!rule.name||!rule.conditions.length||(rule.source==='text'&&!rule.text.trim())||(rule.source==='file'&&!rule.file.trim())||
    (rule.location.startsWith('section-')&&!rule.section.trim())){
    error.setText(writerUi('Preencha nome, fonte e condições da regra.','Complete the rule name, source and conditions.'));return;
   }
   await done(rule);modal.close();
  })).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
 };
 modal.open();
}
function writerV912VirtualSettings(plugin,panel){
 const cfg=plugin.settings.v912Virtual;
 panel.createEl('h3',{text:writerUi('Conteúdo virtual','Virtual Content')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Acrescente Markdown virtualmente em notas por pasta, tag ou propriedade. Modelos podem aparecer no cabeçalho, rodapé, seção ou lateral. Nenhum arquivo é modificado.',
  'Display virtual Markdown in notes by folder, tag or property. Templates can appear in headers, footers, sections or a sidebar. Note files remain unchanged.'
 )});
 const refresh=()=>{plugin.writerV912Virtual?.schedule();plugin.writerBookNavigation?.refreshAutomatic?.();};
 for(const [key,pt,en,descPt,descEn] of [
  ['enabled','Ativar conteúdo virtual','Enable virtual content','Desliga apenas a renderização, mantendo as regras.','Disables rendering but retains rules.'],
  ['autoBookNav','BookNav automático em projetos Longform','Automatic BookNav in Longform projects',
   'Exibe a navegação de capítulos sem inserir blocos na nota; respeita a opção por projeto e blocos manuais.',
   'Displays chapter navigation without editing notes; respects project overrides and manual blocks.'],
  ['showLivePreview','Exibir no Live Preview','Show in Live Preview',
   'Seções específicas ainda são exclusivas do modo Leitura.','Targeted sections are Reading-only.']
 ]){
  new Setting(panel).setName(writerUi(pt,en)).setDesc(writerUi(descPt,descEn)).addToggle(t=>
   t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await plugin.saveSettings();refresh();}));
 }
 const heading=panel.createDiv({cls:'writer-v912-rule-heading'});
 heading.createEl('h4',{text:writerUi('Regras de conteúdo','Content rules')});
 const add=heading.createEl('button',{text:writerUi('Nova regra','New rule'),attr:{type:'button'}});
 add.disabled=cfg.rules.length>=WRITER_V912_VIRTUAL_MAX_RULES;
 add.addEventListener('click',()=>writerV912VirtualRuleEditor(plugin,null,async rule=>{
  cfg.rules.push(rule);await plugin.saveSettings();refresh();plugin.writerSettingsTab?.display();
 }));
 if(!cfg.rules.length)panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Nenhuma regra personalizada. O BookNav automático já pode funcionar sem criar regras.',
  'No custom rules. Automatic BookNav can work without setting up rules.'
 )});
 for(const [index,rule] of cfg.rules.entries()){
  const card=panel.createDiv({cls:'writer-v912-rule-card'});
  const summary=card.createDiv({cls:'writer-v912-rule-summary'});
  summary.createEl('strong',{text:rule.name});
  summary.createEl('small',{text:writerUi(
   {header:'Cabeçalho',footer:'Rodapé',sidebar:'Lateral','section-start':'Início de seção','section-end':'Fim de seção'}[rule.location]||rule.location,
   {header:'Header',footer:'Footer',sidebar:'Sidebar','section-start':'Section start','section-end':'Section end'}[rule.location]||rule.location
  )+' · '+(rule.source==='booknav'?'BookNav':rule.source==='file'?writerUi('Nota modelo','Template file'):'Markdown')});
  new Setting(card).setName(writerUi('Ativa','Enabled')).addToggle(t=>t.setValue(rule.enabled)
   .onChange(async v=>{rule.enabled=v;await plugin.saveSettings();refresh();}));
  const actions=card.createDiv({cls:'writer-v912-rule-actions'});
  const btn=(icon,title,fn)=>{
   const b=actions.createEl('button',{attr:{type:'button',title}});
   require('obsidian').setIcon(b,icon);b.addEventListener('click',fn);return b;
  };
  btn('pencil',writerUi('Editar','Edit'),()=>writerV912VirtualRuleEditor(plugin,rule,async updated=>{
   cfg.rules[index]=updated;await plugin.saveSettings();refresh();plugin.writerSettingsTab?.display();
  }));
  const up=btn('arrow-up',writerUi('Subir','Move up'),async()=>{
   if(index===0)return;
   [cfg.rules[index-1],cfg.rules[index]]=[cfg.rules[index],cfg.rules[index-1]];
   await plugin.saveSettings();refresh();plugin.writerSettingsTab?.display();
  });up.disabled=index===0;
  const down=btn('arrow-down',writerUi('Descer','Move down'),async()=>{
   if(index===cfg.rules.length-1)return;
   [cfg.rules[index],cfg.rules[index+1]]=[cfg.rules[index+1],cfg.rules[index]];
   await plugin.saveSettings();refresh();plugin.writerSettingsTab?.display();
  });down.disabled=index===cfg.rules.length-1;
  btn('trash-2',writerUi('Excluir regra','Delete rule'),async()=>{
   cfg.rules.splice(index,1);await plugin.saveSettings();refresh();plugin.writerSettingsTab?.display();
  });
 }
 new Setting(panel).setName(writerUi('Abrir conteúdo virtual na lateral','Open Virtual Content sidebar'))
  .addButton(b=>b.setButtonText(writerUi('Abrir painel','Open sidebar')).onClick(()=>void plugin.writerV912Virtual?.openSidebar()));
}
function writerV912VirtualRegister(plugin){
 plugin.writerV912Virtual=new WriterV912VirtualContent(plugin);
 plugin.writerV912Virtual.register();
}
