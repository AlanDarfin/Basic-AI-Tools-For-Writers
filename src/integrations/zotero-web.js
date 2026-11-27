'use strict';
/* Zotero Web API v3 read-only: session-only key; never writes to the remote library. */
function writerV107ZoteroConfig(settings){
 const old=settings.v107Zotero&&typeof settings.v107Zotero==='object'&&!Array.isArray(settings.v107Zotero)?settings.v107Zotero:{};
 return settings.v107Zotero=Object.assign(old,{
  enabled:false,libraryType:'users',libraryId:'',folder:'Zotero',maxItems:200,importNotes:true,...old,
  libraryType:old.libraryType==='groups'?'groups':'users',
  libraryId:/^\d{1,15}$/.test(String(old.libraryId||''))?String(old.libraryId):'',
  folder:/^[\p{L}\p{N} _\/-]{1,120}$/u.test(old.folder||'')?old.folder:'Zotero',
  maxItems:Math.max(20,Math.min(300,Number(old.maxItems)||200))
 });
}
function writerV107ZoteroUrl(cfg,start=0,format='json'){
 if(!/^\d{1,15}$/.test(String(cfg.libraryId||'')))throw Error('Invalid Zotero library ID');
 if(!['users','groups'].includes(cfg.libraryType))throw Error('Invalid Zotero library type');
 if(!['json','csljson','bibtex','biblatex'].includes(format))throw Error('Invalid export format');
 const base='https://api.zotero.org/'+cfg.libraryType+'/'+cfg.libraryId+'/items/top';
 return base+'?format='+format+'&limit=100&start='+Math.max(0,Math.min(10000,Number(start)||0));
}
function writerV107ZoteroNormalize(item){
 const d=item?.data||item||{},key=String(item?.key||d.key||'').replace(/[^A-Za-z0-9]/g,'').slice(0,25);
 if(!key||!d.title)return null;
 const author=(Array.isArray(d.creators)?d.creators:[]).map(c=>[c.firstName,c.lastName].filter(Boolean).join(' ')||c.name||'').filter(Boolean).join('; ');
 const extra=String(d.extra||''),citation=/^\s*(?:Citation Key|Citekey):\s*([A-Za-z0-9:._-]+)/im.exec(extra);
 return {key,title:String(d.title||'').slice(0,400),author:author.slice(0,300),year:(String(d.date||'').match(/\b\d{4}\b/)||[])[0]||'',
  citekey:citation?.[1]||'',type:String(d.itemType||''),doi:String(d.DOI||'').slice(0,160),url:String(d.url||'').slice(0,1000),
  abstract:String(d.abstractNote||'').slice(0,10000),date:String(d.date||'').slice(0,100),
  tags:(d.tags||[]).map(x=>String(x.tag||'').slice(0,80)).filter(Boolean).slice(0,50),raw:d};
}
function writerV107ZoteroMarkdown(entry){
 const yaml=v=>JSON.stringify(String(v??'').replace(/\u0000/g,''));
 const lines=['---','title: '+yaml(entry.title),'author: '+yaml(entry.author),'year: '+yaml(entry.year),
  'zoteroKey: '+yaml(entry.key),'zoteroItemType: '+yaml(entry.type),'citekey: '+yaml(entry.citekey),
  'doi: '+yaml(entry.doi),'url: '+yaml(entry.url),'zoteroSource: true','tags: ["zotero"]','---','',
  '# '+entry.title.replace(/[\r\n#]/g,' ').slice(0,250),'',
  entry.author?entry.author+' · '+entry.year:'',entry.doi?'DOI: '+entry.doi:'',entry.url?entry.url:'',
  '', '## '+writerUi('Resumo','Abstract'),'',
  entry.abstract.replace(/^---/gm,'\\---'),'',
  '> [!info] Zotero','> '+entry.key,''];
 return lines.join('\n');
}
async function writerV107ZoteroRequest(key,url){
 if(!/^https:\/\/api\.zotero\.org\/(?:users|groups)\/\d+\/items\/top\?/.test(url))throw Error('Untrusted Zotero URL');
 const req=require('obsidian').requestUrl;
 const headers={'Zotero-API-Version':'3','Accept':'application/json'};
 if(key)headers['Zotero-API-Key']=key;
 const res=await req({url,method:'GET',headers,throw:false});
 if(res.status===429)throw Error(writerUi('Limite da API Zotero. Tente novamente mais tarde.','Zotero API rate limit reached.'));
 if(res.status===401||res.status===403)throw Error(writerUi('Chave ou permissões Zotero inválidas.','Invalid Zotero key or permissions.'));
 if(res.status!==200)throw Error('Zotero API returned HTTP '+res.status);
 if(String(res.text||'').length>3000000)throw Error('Zotero response too large');
 return res;
}
async function writerV107ZoteroRead(key,format,cfg,isCurrent){
 if(!cfg.enabled)throw Error(writerUi('Ative a integração Zotero nas configurações.','Enable Zotero integration in settings.'));
 if(!cfg.libraryId)throw Error(writerUi('Informe o ID numérico da biblioteca.','Enter the numeric library ID.'));
 let data=[];
 for(let start=0;start<cfg.maxItems;start+=100){
  if(!isCurrent())return null;
  const response=await writerV107ZoteroRequest(key,writerV107ZoteroUrl(cfg,start,format));
  if(!isCurrent())return null;
  const batch=Array.isArray(response.json)?response.json:[];
  data.push(...batch.slice(0,cfg.maxItems-data.length));
  if(batch.length<100)break;
 }
 return data.slice(0,cfg.maxItems);
}
function writerV107ZoteroCsl(item){
 const d=item.data||item,entry=writerV107ZoteroNormalize(item);
 if(!entry)return null;
 const authors=(d.creators||[]).filter(c=>c.creatorType==='author'||!c.creatorType).map(c=>c.name?{literal:c.name}:{family:c.lastName||'',given:c.firstName||''});
 return {id:entry.citekey||entry.key,type:d.itemType==='book'?'book':d.itemType==='journalArticle'?'article-journal':'article',
  title:entry.title,author:authors,issued:entry.year?{'date-parts':[[Number(entry.year)]]}:undefined,DOI:entry.doi||undefined,
  URL:entry.url||undefined,'container-title':d.publicationTitle||undefined,volume:d.volume||undefined,issue:d.issue||undefined,
  page:d.pages||undefined,publisher:d.publisher||undefined};
}
const writerV16ZoteroSessions=new WeakMap();
function writerV16ZoteroSession(plugin,renew=false){
 const previous=writerV16ZoteroSessions.get(plugin);
 if(previous&&(!previous.stopped||!renew))return previous;
 const session={modals:new Set(),revision:0,stopped:false};
 writerV16ZoteroSessions.set(plugin,session);
 plugin.register(()=>{
  session.stopped=true;
  for(const modal of session.modals)modal.close();
  session.modals.clear();
 });
 return session;
}
function writerV16ZoteroModal(plugin,title){
 const session=writerV16ZoteroSession(plugin);
 if(session.stopped)return null;
 const modal=new Modal(plugin.app);
 modal.setTitle(title);
 session.modals.add(modal);
 modal.onClose=()=>{session.modals.delete(modal);};
 return {modal,session,isOpen:()=>!session.stopped&&session.modals.has(modal)};
}
async function writerV107ZoteroEnsureFolder(plugin,path,isCurrent){
 const parts=path.split('/').filter(Boolean);let current='';
 for(const part of parts){
  if(!isCurrent())return;
  current=current?current+'/'+part:part;
  if(!plugin.app.vault.getAbstractFileByPath(current))await plugin.app.vault.createFolder(current);
 }
}
function writerV107ZoteroImport(plugin,raw,cfg,isLibraryCurrent){
 const all=raw.map(writerV107ZoteroNormalize).filter(x=>x&&x.type!=='attachment'&&x.type!=='note');
 const view=writerV16ZoteroModal(plugin,writerUi('Importar referências do Zotero','Import Zotero references'));
 if(!view)return;
 const {modal,isOpen}=view;
 const isCurrent=()=>isOpen()&&isLibraryCurrent();
 let busy=false;
 modal.onOpen=()=>{
  modal.contentEl.createEl('p',{text:all.length+' '+writerUi('referências encontradas. Notas existentes não serão sobrescritas.','references found. Existing notes will not be overwritten.')});
  modal.contentEl.createEl('small',{text:all.slice(0,6).map(x=>x.title).join('\n'),cls:'writer-v101-ics-preview'});
  new Setting(modal.contentEl).addButton(btn=>btn.setButtonText(writerUi('Criar notas','Create notes')).setCta().onClick(async()=>{
   if(busy||!isCurrent())return;
   busy=true;
   btn.setDisabled(true);let count=0;
   try{
    await writerV107ZoteroEnsureFolder(plugin,cfg.folder,isCurrent);
    for(const entry of all){
     if(!isCurrent())return;
     const path=cfg.folder+'/'+entry.key+'.md';
     if(plugin.app.vault.getAbstractFileByPath(path))continue;
     await plugin.app.vault.create(path,writerV107ZoteroMarkdown(entry));count++;
    }
    if(!isCurrent())return;
    modal.close();new Notice(count+' '+writerUi('referências importadas.','references imported.'));
   }catch(error){
    if(isCurrent())new Notice(String(error.message||error).slice(0,200));
   }finally{
    busy=false;
    if(isOpen())btn.setDisabled(false);
   }
  }));
 };
 modal.open();
}
function writerV107ZoteroPrompt(plugin,format='json'){
 const view=writerV16ZoteroModal(plugin,'Zotero Web API');
 if(!view)return;
 const {modal,session,isOpen}=view;
 let input,busy=false;
 const untrack=modal.onClose;
 modal.onClose=()=>{untrack();if(input)input.value='';};
 modal.onOpen=()=>{
  modal.contentEl.createEl('p',{text:writerUi('Informe uma chave de API somente para esta solicitação (opcional para biblioteca pública). A chave não será salva. A consulta envia solicitações apenas ao api.zotero.org.','Enter a temporary API key (optional for public libraries). It is not saved. Requests go only to api.zotero.org.')});
  input=modal.contentEl.createEl('input',{attr:{type:'password',autocomplete:'off',placeholder:'Zotero API key'}});
  new Setting(modal.contentEl).addButton(btn=>btn.setButtonText(writerUi('Consultar biblioteca','Fetch library')).setCta().onClick(async()=>{
   if(busy||!isOpen())return;
   busy=true;
   btn.setDisabled(true);
   const key=input.value.slice(0,300);
   input.value='';
   const cfg={...writerV107ZoteroConfig(plugin.settings)},revision=session.revision;
   const isLibraryCurrent=()=>{
    const current=plugin.settings.v107Zotero;
    return session.revision===revision&&current&&current.enabled===cfg.enabled&&current.libraryType===cfg.libraryType&&
     current.libraryId===cfg.libraryId&&current.folder===cfg.folder&&current.maxItems===cfg.maxItems;
   };
   const isCurrent=()=>isOpen()&&isLibraryCurrent();
   try{
    const items=await writerV107ZoteroRead(key,format,cfg,isCurrent);
    if(!items||!isCurrent())return;
    if(format==='json'){
     modal.close();
     writerV107ZoteroImport(plugin,items,cfg,isLibraryCurrent);
    }else{
     const entries=items.filter(item=>item&&typeof item==='object')
      .map(item=>item.id||item.type?item:writerV107ZoteroCsl(item)).filter(Boolean);
     const path='Zotero-csl-'+Date.now()+'.json';
     await plugin.app.vault.create(path,JSON.stringify(entries,null,2));
     if(!isCurrent())return;
     modal.close();
     new Notice(writerUi('Exportação CSL criada: ','CSL export created: ')+path);
    }
   }catch(error){
    if(isCurrent())new Notice(String(error.message||error).slice(0,240));
   }finally{
    busy=false;
    if(isOpen())btn.setDisabled(false);
   }
  }));
 };
 modal.open();
}
function writerV107ZoteroRegister(plugin){
 const session=writerV16ZoteroSession(plugin,true);
 writerV107ZoteroConfig(plugin.settings);
 const open=format=>{if(!session.stopped)writerV107ZoteroPrompt(plugin,format);};
 plugin.addCommand({id:'v107-zotero-web-import',name:writerUi('Zotero: importar biblioteca via API','Zotero: import library via API'),callback:()=>open('json')});
 plugin.addCommand({id:'v107-zotero-web-csl',name:writerUi('Zotero: exportar biblioteca CSL JSON','Zotero: export library to CSL JSON'),callback:()=>open('csljson')});
}
function writerV107ZoteroSettings(plugin,panel){
 const cfg=plugin.settings.v107Zotero;
 const update=async (field,value)=>{
  const session=writerV16ZoteroSessions.get(plugin);
  if(session?.stopped||plugin.settings.v107Zotero!==cfg)return;
  if(session&&value!==cfg[field])session.revision++;
  cfg[field]=value;
  await plugin.saveSettings();
 };
 panel.createEl('h3',{text:writerUi('Zotero Web API (somente leitura)','Zotero Web API (read only)')});
 new Setting(panel).setName(writerUi('Ativar acesso à API','Enable API access')).addToggle(t=>t.setValue(cfg.enabled).onChange(v=>update('enabled',v)));
 new Setting(panel).setName(writerUi('Tipo de biblioteca','Library type')).addDropdown(d=>d.addOption('users',writerUi('Pessoal','User')).addOption('groups',writerUi('Grupo','Group')).setValue(cfg.libraryType).onChange(v=>update('libraryType',v)));
 new Setting(panel).setName(writerUi('ID numérico da biblioteca','Numeric library ID')).addText(t=>t.setValue(cfg.libraryId).setPlaceholder('1234567').onChange(v=>update('libraryId',/^\d{0,15}$/.test(v)?v:cfg.libraryId)));
 new Setting(panel).setName(writerUi('Pasta de importação','Imported notes folder')).addText(t=>t.setValue(cfg.folder).onChange(async v=>{if(/^[\p{L}\p{N} _\/-]{1,120}$/u.test(v))await update('folder',v);}));
 new Setting(panel).setName(writerUi('Itens por consulta','Max items per request')).addSlider(s=>s.setLimits(20,300,20).setDynamicTooltip().setValue(cfg.maxItems).onChange(v=>update('maxItems',v)));
 new Setting(panel).setName(writerUi('Buscar referências','Fetch references')).addButton(b=>b.setButtonText(writerUi('Conectar','Connect')).onClick(()=>writerV107ZoteroPrompt(plugin)));
}
