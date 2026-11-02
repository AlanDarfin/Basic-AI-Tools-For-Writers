'use strict';
/* Optional UX-only password gate, inspired by qing3962/password-protection.
 * NEVER encrypts the vault. Another plugin, device user or filesystem process can read files. */
const WRITER_V9_LOCK_DEFAULTS={enabled:false,salt:'',verifier:'',paths:[],autoLockMinutes:0};
function writerV9LockMerge(settings){
 const raw=settings.v9Lock&&typeof settings.v9Lock==='object'?settings.v9Lock:{};
 const cfg=settings.v9Lock={...WRITER_V9_LOCK_DEFAULTS,...raw};
 cfg.salt=/^[0-9a-f]{32}$/i.test(cfg.salt||'')?cfg.salt:'';
 cfg.verifier=/^[0-9a-f]{64}$/i.test(cfg.verifier||'')?cfg.verifier:'';
 cfg.paths=Array.isArray(cfg.paths)?[...new Set(cfg.paths.map(x=>String(x||'').trim().replace(/^\/+/,'').replace(/\/$/,'')).filter(Boolean))].slice(0,12):[];
 if((raw.paths||[]).includes('/'))cfg.paths.unshift('/');
 cfg.autoLockMinutes=Math.max(0,Math.min(120,Math.floor(Number(cfg.autoLockMinutes)||0)));
 cfg.enabled=cfg.enabled===true&&Boolean(cfg.salt&&cfg.verifier);
 return cfg;
}
function writerV9LockHex(bytes){return [...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function writerV9LockHash(password,salt){
 const cryptoAPI=globalThis.crypto;
 if(!cryptoAPI?.subtle||!cryptoAPI.getRandomValues)throw Error(writerUi('Criptografia do dispositivo indisponível.','Device cryptographic API unavailable.'));
 const encoder=new TextEncoder();
 const key=await cryptoAPI.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const saltBytes=new Uint8Array(salt.match(/.{2}/g).map(n=>parseInt(n,16)));
 const bits=await cryptoAPI.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations:120000,hash:'SHA-256'},key,256);
 return writerV9LockHex(new Uint8Array(bits));
}
function writerV9LockMatches(cfg,path){
 return cfg.paths.some(prefix=>prefix==='/'||path===prefix||path.startsWith(prefix+'/'));
}
function writerV9LockRegister(plugin){
 plugin.writerV9LockUnlockedUntil=0;
 plugin.writerV9LockPromptOpen=false;
 const cfg=()=>plugin.settings.v9Lock;
 const unlocked=()=>plugin.writerV9LockUnlockedUntil===Infinity||Date.now()<plugin.writerV9LockUnlockedUntil;
 const activate=()=>{plugin.writerV9LockUnlockedUntil=cfg().autoLockMinutes>0?Date.now()+cfg().autoLockMinutes*60000:Infinity;};
 const verify=async password=>{
  const hash=await writerV9LockHash(password,cfg().salt);
  return hash===cfg().verifier;
 };
 const setup=()=>{
  const modal=new Modal(plugin.app);modal.setTitle(writerUi('Criar senha do Basic','Create Basic lock password'));
  const root=modal.contentEl;
  root.createEl('p',{text:writerUi('Bloqueio visual apenas: NÃO criptografa os arquivos.','Visual lock only: does NOT encrypt files.')});
  const one=root.createEl('input',{attr:{type:'password',autocomplete:'new-password',placeholder:writerUi('Senha nova','New password')}});
  const two=root.createEl('input',{attr:{type:'password',autocomplete:'new-password',placeholder:writerUi('Repetir senha','Repeat password')}});
  const note=root.createEl('small');
  const submit=async()=>{
   if(one.value.length<8||one.value!==two.value){note.setText(writerUi('Use no mínimo 8 caracteres e confirme a senha.','Use at least 8 characters and repeat the password.'));return;}
   try{
    const cryptoAPI=globalThis.crypto;
    if(!cryptoAPI?.getRandomValues)throw Error('WebCrypto unavailable');
    const salt=writerV9LockHex(cryptoAPI.getRandomValues(new Uint8Array(16)));
    const verifier=await writerV9LockHash(one.value,salt);
    cfg().salt=salt;cfg().verifier=verifier;cfg().enabled=true;
    activate();await plugin.saveSettings();modal.close();
    plugin.writerSettingsTab?.display?.();
   }catch(e){note.setText(String(e.message||e));}
  };
  new Setting(root).addButton(b=>b.setButtonText(writerUi('Definir senha','Set password')).setCta().onClick(()=>void submit()));
  one.addEventListener('keydown',e=>{if(e.key==='Enter')two.focus();});
  two.addEventListener('keydown',e=>{if(e.key==='Enter')void submit();});
  modal.open();
 };
 const lockFile=file=>{
  if(!cfg().enabled||!file||!writerV9LockMatches(cfg(),file.path)||unlocked()||plugin.writerV9LockPromptOpen)return;
  plugin.writerV9LockPromptOpen=true;
  const leaf=plugin.app.workspace.activeLeaf;
  const host=leaf?.view?.containerEl;
  let curtain=null;
  if(host?.createDiv){
   curtain=host.createDiv({cls:'writer-v901-lock-curtain',attr:{role:'presentation','aria-hidden':'true'}});
   host.addClass?.('writer-v901-lock-host');
   const label=curtain.createDiv({cls:'writer-v901-lock-caption'});
   const glyph=label.createSpan();require('obsidian').setIcon?.(glyph,'lock-keyhole');
   label.createSpan({text:writerUi('Visualização bloqueada','View locked')});
  }
  const modal=new Modal(plugin.app);
  let authorized=false;
  modal.setTitle(writerUi('Nota protegida no Basic','Basic protected note'));
  modal.contentEl.createEl('p',{text:writerUi('Insira a senha para continuar. Este bloqueio não protege arquivos fora do Obsidian.','Enter the password to continue. This lock does not protect files outside Obsidian.')});
  const input=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'current-password','aria-label':writerUi('Senha','Password')}});
  const message=modal.contentEl.createEl('small');
  const submit=async()=>{
   try{
    if(await verify(input.value)){authorized=true;activate();modal.close();return;}
    message.setText(writerUi('Senha incorreta.','Incorrect password.'));input.value='';
   }catch(e){message.setText(String(e.message||e));}
  };
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Desbloquear','Unlock')).setCta().onClick(()=>void submit()));
  input.addEventListener('keydown',e=>{if(e.key==='Enter')void submit();});
  modal.onClose=()=>{
   plugin.writerV9LockPromptOpen=false;input.value='';
   curtain?.remove();host?.removeClass?.('writer-v901-lock-host');
   if(!authorized){
    const leaf=plugin.app.workspace.activeLeaf;
    if(leaf?.view?.file?.path===file.path)void leaf.setViewState({type:'empty'});
   }
  };
  modal.open();setTimeout(()=>input.focus(),0);
 };
 plugin.writerV9LockSetup=setup;
 plugin.writerV9LockReset=()=>{
  if(!cfg().verifier){setup();return;}
  // Only allow replacing a password after a successful verification.
  const modal=new Modal(plugin.app);modal.setTitle(writerUi('Confirmar senha atual','Verify current password'));
  const input=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'current-password'}});
  const note=modal.contentEl.createEl('small');
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Continuar','Continue')).onClick(async()=>{
   try{if(await verify(input.value)){modal.close();setup();}
    else note.setText(writerUi('Senha incorreta.','Incorrect password.'));
   }catch(e){note.setText(String(e.message||e));}
  }));
  modal.open();
 };
 plugin.registerEvent(plugin.app.workspace.on('file-open',file=>lockFile(file)));
 if(typeof plugin.registerInterval==='function')
  plugin.registerInterval(setInterval(()=>{
   if(cfg().enabled&&!unlocked())lockFile(plugin.app.workspace.getActiveFile?.());
  },15000));
 plugin.addCommand({id:'v9-lock-protected-files',name:writerUi('Proteção: bloquear notas agora','Protection: lock notes now'),callback:()=>{
  plugin.writerV9LockUnlockedUntil=0;
  lockFile(plugin.app.workspace.getActiveFile?.());
 }});
 if(typeof plugin.app.workspace.onLayoutReady==='function')
  plugin.app.workspace.onLayoutReady(()=>{lockFile(plugin.app.workspace.getActiveFile?.());});
}
function writerV9LockSettings(plugin,panel){
 const cfg=plugin.settings.v9Lock;
 panel.createEl('h3',{text:writerUi('Proteção por senha (visual)','Password protection (visual)')});
 panel.createEl('p',{cls:'dictionary-muted',text:writerUi('Não criptografa notas e não impede acesso por outros plugins, backups ou gerenciador de arquivos. Não substitui criptografia do dispositivo.','Does not encrypt notes or prevent access through other plugins, backups or the filesystem. It is not a replacement for device encryption.')});
 new Setting(panel).setName(writerUi('Criar ou alterar senha','Create or change password'))
  .addButton(b=>b.setButtonText(writerUi('Configurar','Configure')).onClick(()=>plugin.writerV9LockReset?.()));
 new Setting(panel).setName(writerUi('Ativar bloqueio visual','Enable visual lock'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async value=>{
   if(value&&!cfg.verifier){t.setValue(false);plugin.writerV9LockSetup?.();return;}
   cfg.enabled=value;plugin.writerV9LockUnlockedUntil=0;await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Caminhos protegidos','Protected paths'))
  .setDesc(writerUi('Uma pasta ou nota por linha. Use / para o cofre inteiro.','One note or folder path per line. Use / for the entire vault.'))
  .addTextArea(t=>t.setValue(cfg.paths.join('\n')).onChange(async value=>{
   cfg.paths=[...new Set(value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>x==='/'?'/':x.replace(/^\/+|\/+$/g,'')))].slice(0,12);
   await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Bloquear novamente após (minutos)','Lock again after (minutes)'))
  .setDesc(writerUi('0 = uma vez por sessão.','0 = once per session.'))
  .addSlider(s=>s.setLimits(0,120,5).setValue(cfg.autoLockMinutes).setDynamicTooltip().onChange(async value=>{
   cfg.autoLockMinutes=value;await plugin.saveSettings();
  }));
}
