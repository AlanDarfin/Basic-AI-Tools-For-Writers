'use strict';
/* Basic v12: local encrypted note envelopes. Never replaces an existing file,
 * never persists keys or plaintext. AES-256-GCM + PBKDF2-SHA256 via WebCrypto.
 * Encryption is per new note; NOT a folder-wide vault or searchable lock. */
const WRITER_V12_SECURE_PREFIX='BASIC-SECURE/1\n';
function writerV12SecureSubtle(){
 const wc=globalThis.crypto;
 if(!wc?.subtle||typeof wc.getRandomValues!=='function')throw Error('Web Crypto API is unavailable.');
 return wc;
}
function writerV12SecureBytes(text){
 return new TextEncoder().encode(String(text||''));
}
function writerV12SecureB64(array){
 const bytes=new Uint8Array(array),step=16384;
 let result='';
 for(let i=0;i<bytes.length;i+=step)
  result+=String.fromCharCode(...bytes.subarray(i,i+step));
 return btoa(result);
}
function writerV12SecureUnb64(input){
 if(typeof input!=='string'||input.length>6500000||!/^[A-Za-z0-9+/]*={0,2}$/.test(input))
  throw Error('Invalid encrypted payload');
 const str=atob(input),bytes=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
 return bytes;
}
async function writerV12SecureKey(password,salt,usage){
 const wc=writerV12SecureSubtle(),secret=String(password||'');
 if(secret.length<12)throw Error('Use a passphrase with at least 12 characters');
 const base=await wc.subtle.importKey('raw',writerV12SecureBytes(secret),'PBKDF2',false,['deriveKey']);
 return wc.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,
  {name:'AES-GCM',length:256},false,usage);
}
async function writerV12SecureSeal(plaintext,password){
 const wc=writerV12SecureSubtle();
 if(typeof plaintext!=='string'||!plaintext||plaintext.length>750000)
  throw Error('Secure notes must contain 1–750000 characters');
 const salt=wc.getRandomValues(new Uint8Array(16));
 const iv=wc.getRandomValues(new Uint8Array(12));
 const key=await writerV12SecureKey(password,salt,['encrypt']);
 const ciphertext=await wc.subtle.encrypt({name:'AES-GCM',iv,additionalData:writerV12SecureBytes('Basic-12-Envelope-v1')},
  key,writerV12SecureBytes(plaintext));
 return WRITER_V12_SECURE_PREFIX+JSON.stringify({
  version:1,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations:310000,
  salt:writerV12SecureB64(salt),iv:writerV12SecureB64(iv),
  ciphertext:writerV12SecureB64(ciphertext)
 });
}
async function writerV12SecureOpen(envelope,password){
 const raw=String(envelope||'');
 if(!raw.startsWith(WRITER_V12_SECURE_PREFIX)||raw.length>7000000)
  throw Error('Not a Basic encrypted note');
 const entry=JSON.parse(raw.slice(WRITER_V12_SECURE_PREFIX.length));
 if(entry.version!==1||entry.algorithm!=='AES-256-GCM'||entry.kdf!=='PBKDF2-SHA256'||entry.iterations!==310000)
  throw Error('Unsupported encrypted note format');
 const salt=writerV12SecureUnb64(entry.salt),iv=writerV12SecureUnb64(entry.iv),data=writerV12SecureUnb64(entry.ciphertext);
 if(salt.length!==16||iv.length!==12||data.length>5500000||data.length<16)
  throw Error('Invalid encrypted note');
 const key=await writerV12SecureKey(password,salt,['decrypt']);
 const wc=writerV12SecureSubtle();
 const decoded=await wc.subtle.decrypt({name:'AES-GCM',iv,additionalData:writerV12SecureBytes('Basic-12-Envelope-v1')},key,data);
 return new TextDecoder('utf-8',{fatal:true}).decode(decoded);
}
function writerV12SecureMessage(plugin,pt,en){new Notice(writerUi(pt,en));}
function writerV12SecureCreate(plugin){
 if(!writerV12On(plugin,'secureNotes'))return;
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Nova nota protegida','New encrypted note'));
 modal.contentEl.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Cria um NOVO arquivo criptografado. Não modifica notas existentes. A senha não será salva: se perdida, o conteúdo não poderá ser recuperado.',
  'Creates a NEW encrypted file. Does not modify existing notes. No password is stored: if lost, the content cannot be recovered.')});
 const title=modal.contentEl.createEl('input',{attr:{type:'text',placeholder:writerUi('Nome do arquivo','File name'),style:'width:100%'}});
 const password=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'new-password',placeholder:writerUi('Senha (mínimo 12 caracteres)','Passphrase (12+ characters)'),style:'width:100%;margin-top:8px'}});
 const confirm=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'new-password',placeholder:writerUi('Repetir senha','Repeat passphrase'),style:'width:100%;margin-top:8px'}});
 const body=modal.contentEl.createEl('textarea',{attr:{rows:'10',placeholder:writerUi('Conteúdo protegido','Protected content'),style:'width:100%;margin-top:8px;'}});
 const error=modal.contentEl.createEl('p',{cls:'setting-item-description'});
 new Setting(modal.contentEl).addButton(button=>button.setButtonText(writerUi('Criptografar e salvar novo arquivo','Encrypt and save new file')).setCta().onClick(async()=>{
  if(password.value!==confirm.value){error.setText(writerUi('As senhas não coincidem.','Passwords do not match.'));return;}
  if(password.value.length<12||!body.value.trim()){error.setText(writerUi('Informe uma senha de pelo menos 12 caracteres e o conteúdo.','Provide a 12+ character passphrase and content.'));return;}
  button.setDisabled(true);
  try{
   const vault=plugin.app.vault,folder='Basic Secure',filename=writerV12SafeName(title.value||'Protected note');
   if(!vault.getAbstractFileByPath(folder))await vault.createFolder(folder);
   let target=folder+'/'+filename+'.md',suffix=2;
   while(vault.getAbstractFileByPath(target))target=folder+'/'+filename+' '+suffix+++'.md';
   const sealed=await writerV12SecureSeal(body.value,password.value);
   await vault.create(target,sealed);
   password.value='';confirm.value='';body.value='';
   modal.close();
   writerV12SecureMessage(plugin,'Nota criptografada criada.','Encrypted note created.');
  }catch(err){error.setText(String(err.message||err));}
  finally{button.setDisabled(false);}
 }));
 modal.open();
}
function writerV12SecureRead(plugin){
 if(!writerV12On(plugin,'secureNotes'))return;
 const files=plugin.app.vault.getMarkdownFiles().filter(f=>f.path.startsWith('Basic Secure/'));
 if(!files.length){writerV12SecureMessage(plugin,'Nenhuma nota protegida encontrada.','No encrypted notes found.');return;}
 class Picker extends FuzzySuggestModal{
  getItems(){return files;}
  getItemText(file){return file.path;}
  onChooseItem(file){void writerV12SecureUnlock(plugin,file);}
 }
 new Picker(plugin.app).open();
}
async function writerV12SecureUnlock(plugin,file){
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Abrir conteúdo protegido','Unlock encrypted content'));
 const password=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'off',placeholder:writerUi('Senha da nota','Note passphrase'),style:'width:100%'}});
 const feedback=modal.contentEl.createEl('p',{cls:'setting-item-description'});
 const result=modal.contentEl.createEl('textarea',{attr:{rows:'12',readonly:'',style:'width:100%;display:none;'}});
 const run=async()=>{
  try{
   const encrypted=await plugin.app.vault.cachedRead(file);
   const original=await writerV12SecureOpen(encrypted,password.value);
   password.value='';result.style.display='block';result.value=original;
   feedback.setText(writerUi('Conteúdo descriptografado somente nesta janela. Feche para descartá-lo.','Decrypted only in this window. Close to discard it.'));
  }catch(err){feedback.setText(writerUi('Não foi possível abrir: ','Could not decrypt: ')+String(err.message||err));}
 };
 new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Desbloquear','Unlock')).setCta().onClick(run));
 modal.onClose=()=>{password.value='';result.value='';};
 modal.open();
}
function writerV12SecureRegister(plugin){
 plugin.addCommand({id:'v12-secure-new',name:writerUi('Privacidade: criar nova nota criptografada','Privacy: create encrypted note'),callback:()=>writerV12SecureCreate(plugin)});
 plugin.addCommand({id:'v12-secure-open',name:writerUi('Privacidade: abrir nota criptografada','Privacy: open encrypted note'),callback:()=>writerV12SecureRead(plugin)});
}
function writerV12SecureSettings(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Notas criptografadas · AES-256-GCM','Encrypted notes · AES-256-GCM')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Protege apenas o conteúdo de NOVAS notas. Nomes de arquivos e existência dos documentos continuam visíveis. Não é a criptografia de pastas do Ultimate Toolkit; sem recuperação de senha.',
  'Encrypts only NEW note contents. File names and their existence remain visible. This is not Ultimate Toolkit folder encryption; no password recovery.')});
 new Setting(panel).setName(writerUi('Ativar notas criptografadas locais','Enable local encrypted notes')).addToggle(t=>t.setValue(cfg.secureNotes===true).onChange(async v=>{cfg.secureNotes=v;await plugin.saveSettings();}));
}
