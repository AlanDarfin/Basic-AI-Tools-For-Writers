'use strict';
/* 9.2.0 Session Notes: ephemeral drafts held in memory, not saved in the vault.
 * Explicit Save to vault action; never automatically deletes user files. */
const WRITER_V92_SESSION_VIEW='writer-session-draft';
function writerV92SessionMerge(settings){
 const old=settings.v92Session&&typeof settings.v92Session==='object'?settings.v92Session:{};
 const cfg=settings.v92Session={enabled:true,saveFolder:'Session Notes',...old};
 cfg.enabled=cfg.enabled!==false;
 cfg.saveFolder=String(cfg.saveFolder||'Session Notes').replace(/^\/|\/$/g,'').slice(0,180);
 return cfg;
}
class WriterV92SessionView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;this.draft='';this.discardConfirmed=false;}
 getViewType(){return WRITER_V92_SESSION_VIEW;}
 getDisplayText(){return writerUi('Rascunho da sessão','Session draft');}
 getIcon(){return 'notebook-pen';}
 async onOpen(){
  const host=this.contentEl;host.empty();host.addClass('writer-v92-session');
  const title=host.createEl('h3',{text:writerUi('Rascunho temporário','Temporary draft')});
  host.createEl('p',{cls:'dictionary-muted',text:writerUi(
   'O texto fica somente na memória e desaparece ao encerrar o Obsidian. Salve no cofre para manter uma cópia.',
   'Text lives only in memory and is lost when Obsidian closes. Save to your vault to keep a copy.'
  )});
  const editor=host.createEl('textarea',{attr:{'aria-label':writerUi('Rascunho','Draft'),placeholder:writerUi('Escreva suas ideias…','Write your ideas…')}});
  editor.value=this.draft;
  editor.addEventListener('input',()=>{this.draft=editor.value;this.discardConfirmed=false;});
  const actions=host.createDiv({cls:'writer-v92-session-actions'});
  const save=actions.createEl('button',{text:writerUi('Salvar como nota','Save as note'),cls:'mod-cta'});
  save.addEventListener('click',async()=>{
   if(!this.draft.trim())return;
   const folder=this.plugin.settings.v92Session.saveFolder;
   try{
    if(folder&&!this.app.vault.getAbstractFileByPath(folder))await this.app.vault.createFolder(folder);
    const prefix=folder?folder+'/':'';
    const date=new Date().toISOString().replace(/[:.]/g,'-');
    let path=prefix+'Session-'+date+'.md',n=2;
    while(this.app.vault.getAbstractFileByPath(path))path=prefix+'Session-'+date+'-'+n+++'.md';
    const file=await this.app.vault.create(path,this.draft);
    new Notice(writerUi('Rascunho salvo: ','Draft saved: ')+file.path);
    await this.app.workspace.getLeaf('tab').openFile(file);
   }catch(error){new Notice(writerUi('Não foi possível salvar: ','Could not save: ')+String(error.message||error));}
  });
  const clear=actions.createEl('button',{text:writerUi('Descartar rascunho','Discard draft')});
  clear.addEventListener('click',()=>{
   if(!this.discardConfirmed){
    this.discardConfirmed=true;
    clear.setText(writerUi('Confirmar descarte','Confirm discard'));
    return;
   }
   this.draft='';editor.value='';this.discardConfirmed=false;
   clear.setText(writerUi('Descartar rascunho','Discard draft'));
  });
 }
}
function writerV92SessionRegister(plugin){
 plugin.registerView?.(WRITER_V92_SESSION_VIEW,leaf=>new WriterV92SessionView(leaf,plugin));
 plugin.addCommand?.({id:'v92-new-session-draft',name:writerUi('Sessão: criar rascunho temporário','Session: new temporary draft'),callback:async()=>{
  if(!plugin.settings.v92Session.enabled||!writerModuleOn(plugin,'sessionNotes'))return;
  const leaf=plugin.app.workspace.getLeaf('tab');
  await leaf.setViewState({type:WRITER_V92_SESSION_VIEW,active:true});
  await plugin.app.workspace.revealLeaf?.(leaf);
 }});
}
function writerV92SessionSettings(plugin,panel){
 const cfg=plugin.settings.v92Session;
 panel.createEl('h3',{text:writerUi('Rascunhos de sessão','Session drafts')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
  'Rascunhos temporários são mantidos apenas em memória. Não excluem arquivos existentes automaticamente.',
  'Temporary drafts stay in memory only. Existing vault files are never deleted automatically.'
 )});
 new Setting(panel).setName(writerUi('Ativar rascunhos temporários','Enable temporary drafts')).addToggle(t=>
  t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Pasta para salvar rascunhos','Folder for saved drafts')).addText(t=>
  t.setValue(cfg.saveFolder).onChange(async v=>{cfg.saveFolder=v.slice(0,180);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Criar rascunho','Create draft')).addButton(b=>
  b.setButtonText(writerUi('Nova sessão','New session')).onClick(async()=>{
   const leaf=plugin.app.workspace.getLeaf('tab');
   await leaf.setViewState({type:WRITER_V92_SESSION_VIEW,active:true});
   await plugin.app.workspace.revealLeaf?.(leaf);
  }));
}
