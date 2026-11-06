'use strict';
/* Basic v12: compatibility-first toolkit integrations.
 * Original code; inspired by Ultimate Toolkit, Visual Kit, Snailkit, dropit,
 * Syncthing Integration/Manager, Obsidian Git and FIT. No upstream code vendored.
 * Native features operate without companion plugins; sensitive transports and
 * cryptographic functions are deliberately NOT emulated.
 */
const WRITER_V12_COMPANIONS=[
 {id:'ahmed-toolkit',name:'Ultimate Toolkit',role:'toolkit',mobile:true},
 {id:'visual-kit',name:'Visual Kit',role:'visual',mobile:false},
 {id:'snailkit',name:'Snailkit',role:'notes',mobile:true},
 {id:'dropit',name:'dropit',role:'transfer',mobile:true},
 {id:'syncthing-integration',name:'Syncthing Integration',role:'sync',mobile:true},
 {id:'syncthing-manager',name:'Syncthing Manager',role:'sync',mobile:true},
 {id:'obsidian-git',name:'Obsidian Git',role:'sync',mobile:true},
 {id:'fit',name:'FIT',role:'sync',mobile:true}
];
const WRITER_V12_SYNC=['none','syncthing-manager','syncthing-integration','obsidian-git','fit'];
function writerV12Config(plugin){
 const old=plugin.settings.v12Toolkit;
 const cfg=plugin.settings.v12Toolkit={
  enabled:true,palette:true,imageTools:true,taskNavigator:true,localInbox:true,
  folderFocus:true,integrations:true,syncProvider:'none',maxTaskFiles:250,
  ...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})
 };
 if(!WRITER_V12_SYNC.includes(cfg.syncProvider))cfg.syncProvider='none';
 cfg.maxTaskFiles=Math.max(25,Math.min(1000,Number(cfg.maxTaskFiles)||250));
 return cfg;
}
function writerV12On(plugin,key){
 const cfg=writerV12Config(plugin);
 return cfg.enabled!==false&&cfg[key]!==false;
}
function writerV12CompanionInstalled(plugin,id){
 return !!plugin.app.plugins?.plugins?.[id];
}
function writerV12Commands(plugin,id){
 const list=plugin.app.commands?.listCommands?.()||Object.values(plugin.app.commands?.commands||{});
 return list.filter(cmd=>typeof cmd.id==='string'&&
  (cmd.id.startsWith(id+':')||cmd.id.startsWith(id+'-')||cmd.id===id)).slice(0,70);
}
function writerV12Item(pt,en,kind,value){
 return {name:writerUi(pt,en),kind,value};
}
function writerV12PaletteItems(){
 const items=[
  writerV12Item('Negrito','Bold','wrap','**'),writerV12Item('Itálico','Italic','wrap','*'),
  writerV12Item('Riscado','Strikethrough','wrap','~~'),writerV12Item('Realce','Highlight','wrap','=='),
  writerV12Item('Código inline','Inline code','wrap','&#96;'),
  writerV12Item('Sobrescrito','Superscript','wrap','<sup>|</sup>'),
  writerV12Item('Subscrito','Subscript','wrap','<sub>|</sub>'),
  writerV12Item('Citação','Quote','line','> '),
  writerV12Item('Lista de marcadores','Bullet list','line','- '),
  writerV12Item('Lista numerada','Numbered list','line','1. '),
  writerV12Item('Lista de tarefas','Task list','line','- [ ] '),
  writerV12Item('Linha divisória','Horizontal rule','insert','\n---\n'),
  writerV12Item('Divisor pontilhado','Dotted divider','insert','\n· · ·\n'),
  writerV12Item('Divisor longo','Long divider','insert','\n━━━━━━━━━━━━\n'),
  writerV12Item('Bloco de código','Code fence','block','code'),
  writerV12Item('Bloco matemático','Math block','block','math'),
  writerV12Item('Tabela básica','Basic table','insert','\n| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor | Valor |\n'),
  writerV12Item('Data atual','Today','date','date'),
  writerV12Item('Hora atual','Current time','date','time'),
  writerV12Item('Texto da direita para a esquerda','Right-to-left paragraph','wrap','<div dir="rtl">|</div>')
 ];
 for(let i=1;i<=6;i++)items.push(writerV12Item('Título '+i,'Heading '+i,'line','#'.repeat(i)+' '));
 for(const [key,pt,en] of [
  ['note','Nota','Note'],['tip','Dica','Tip'],['info','Informação','Info'],
  ['warning','Aviso','Warning'],['danger','Perigo','Danger'],
  ['success','Sucesso','Success'],['question','Pergunta','Question'],
  ['quote','Citação','Quote'],['example','Exemplo','Example'],['summary','Resumo','Summary'],
  ['bug','Bug','Bug'],['todo','Tarefa','Todo'],['abstract','Resumo breve','Abstract'],
  ['failure','Falha','Failure'],['important','Importante','Important']
 ])items.push(writerV12Item('Callout: '+writerUi(pt,en),'Callout: '+en,'callout',key));
 items.push(
  writerV12Item('Link interno','Internal wiki link','wrap','[[|]]'),
  writerV12Item('Link externo','External Markdown link','wrap','[|](https://example.com)'),
  writerV12Item('Sublinhado','Underline','wrap','<u>|</u>'),
  writerV12Item('Texto pequeno','Small text','wrap','<small>|</small>'),
  writerV12Item('Tecla de atalho','Keyboard key','wrap','<kbd>|</kbd>'),
  writerV12Item('Abreviação','Abbreviation','wrap','<abbr>|</abbr>'),
  writerV12Item('Comentário oculto','Obsidian comment','wrap','%%|%%'),
  writerV12Item('Detalhes recolhíveis','Collapsible details','wrap','<details><summary>Resumo</summary>|</details>'),
  writerV12Item('Texto centralizado','Centered text','wrap','<div align="center">|</div>'),
  writerV12Item('Texto à direita','Right-aligned text','wrap','<div align="right">|</div>'),
  writerV12Item('Texto à esquerda','Left-aligned text','wrap','<div align="left">|</div>'),
  writerV12Item('Bloco SQL','SQL code fence','insert','\n~~~sql\n\n~~~\n'),
  writerV12Item('Bloco JSON','JSON code fence','insert','\n~~~json\n{}\n~~~\n'),
  writerV12Item('Bloco Python','Python code fence','insert','\n~~~python\n\n~~~\n'),
  writerV12Item('Bloco JavaScript','JavaScript code fence','insert','\n~~~javascript\n\n~~~\n'),
  writerV12Item('Bloco de aviso HTML','HTML notice','wrap','<aside>|</aside>'),
  writerV12Item('Marcador de nota','Footnote marker','insert','[^1]'),
  writerV12Item('Definição de nota de rodapé','Footnote definition','insert','\n[^1]: \n')
 );
 for(const [id,pt,en] of [
  ['goal','Meta','Goal'],['idea','Ideia','Idea'],['remember','Lembrete','Reminder'],
  ['blocker','Bloqueio','Blocker'],['command','Comando','Command'],['config','Configuração','Config']
 ])items.push(writerV12Item('Callout: '+writerUi(pt,en),'Callout: '+en,'callout',id));
 return items;
}
function writerV12Transform(editor,item){
 const selected=editor.getSelection()||'';
 if(item.kind==='wrap'){
  const parts=item.value.split('|');
  const left=parts.length===2?parts[0]:item.value.replace('&#96;','&#96;');
  const right=parts.length===2?parts[1]:left;
  const clean=text=>text.replaceAll('&#96;',String.fromCharCode(96));
  editor.replaceSelection(clean(left)+selected+clean(right));
 }else if(item.kind==='line'){
  editor.replaceSelection((selected||writerUi('Texto','Text')).split('\n').map(line=>item.value+line).join('\n'));
 }else if(item.kind==='insert')editor.replaceSelection(item.value.replaceAll('&#96;',String.fromCharCode(96)));
 else if(item.kind==='date'){
  const now=new Date();
  editor.replaceSelection(item.value==='time'?now.toLocaleTimeString():now.toLocaleDateString());
 }else if(item.kind==='block'){
  const fence=item.value==='math'?'$$':String.fromCharCode(96).repeat(3);
  editor.replaceSelection(fence+'\n'+selected+'\n'+fence);
 }else if(item.kind==='callout'){
  editor.replaceSelection('> [!'+item.value+']\n'+
   (selected||writerUi('Conteúdo','Content')).split('\n').map(x=>'> '+x).join('\n'));
 }
}
function writerV12OpenPalette(plugin,editor){
 if(!writerV12On(plugin,'palette'))return;
 if(!editor){new Notice(writerUi('Abra uma nota no editor.','Open a note in edit mode.'));return;}
 class Palette extends FuzzySuggestModal{
  getItems(){return writerV12PaletteItems();}
  getItemText(item){return item.name;}
  onChooseItem(item){writerV12Transform(editor,item);}
 }
 const modal=new Palette(plugin.app);
 modal.setPlaceholder(writerUi('Pesquisar formatação, callouts e inserções...','Search formatting, callouts and inserts...'));
 modal.open();
}
function writerV12NormalizeEmbeds(source,width){
 let count=0;
 const next=String(source||'').replace(/!\[\[([^\]\r\n]+)\]\]/g,(whole,inside)=>{
  const bits=inside.split('|'),path=bits.shift();
  if(!/\.(png|jpe?g|gif|webp|svg|bmp|avif)(?:#[^\]]*)?$/i.test(path.trim()))return whole;
  const aliases=bits.filter(s=>!/^\d{2,5}(?:x\d{2,5})?$/.test(s.trim()));
  count++;
  return '![['+[path,...aliases,String(width)].join('|')+']]';
 });
 return {next,count};
}
function writerV12NormalizeImageCommand(plugin,editor){
 if(!writerV12On(plugin,'imageTools')||!editor)return;
 const selected=editor.getSelection(),before=editor.getValue();
 if(!selected){new Notice(writerUi('Selecione um trecho contendo imagens incorporadas.','Select a passage containing embedded images.'));return;}
 const modal=new Modal(plugin.app);
 modal.titleEl.setText(writerUi('Padronizar largura das imagens','Normalize image widths'));
 modal.contentEl.createEl('p',{text:writerUi(
  'Somente imagens ![[arquivo.png]] da seleção. Visualize a quantidade e confirme antes de editar.',
  'Only ![[file.png]] images in the selection. Review the count before changing Markdown.')});
 const range=modal.contentEl.createEl('input',{attr:{type:'number',min:'80',max:'2400',value:'480','aria-label':'Width in pixels'}});
 const preview=modal.contentEl.createEl('p');
 const render=()=>{const width=Math.round(Number(range.value)||0),res=writerV12NormalizeEmbeds(selected,width);
  preview.setText((width>=80&&width<=2400?res.count:0)+' '+writerUi('imagens para alterar','images to change'));};
 range.addEventListener('input',render);render();
 new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Aplicar','Apply')).setCta().onClick(()=>{
  const width=Math.round(Number(range.value));
  if(width<80||width>2400){new Notice(writerUi('Use 80–2400 px.','Use 80–2400 px.'));return;}
  const res=writerV12NormalizeEmbeds(selected,width);
  if(!res.count)return;
  if(editor.getValue()!==before||editor.getSelection()!==selected){
   new Notice(writerUi('A seleção mudou; operação cancelada.','The selection changed; operation cancelled.'));return;
  }
  editor.replaceSelection(res.next);modal.close();
 }));
 modal.open();
}
function writerV12Lightbox(plugin,original){
 if(!writerV12On(plugin,'imageTools'))return;
 const modal=new Modal(plugin.app);
 modal.titleEl.setText(writerUi('Visualizador de imagem','Image viewer'));
 const wrapper=modal.contentEl.createDiv();
 wrapper.style.cssText='overflow:auto;max-height:70vh;text-align:center;';
 const img=wrapper.createEl('img',{attr:{src:original.currentSrc||original.src,alt:original.alt||''}});
 img.style.cssText='max-width:100%;height:auto;object-fit:contain;';
 let width=100,rotate=0;
 const apply=()=>{img.style.width=width+'%';img.style.transform='rotate('+rotate+'deg)';};
 const controls=modal.contentEl.createDiv({cls:'modal-button-container'});
 for(const [label,delta,action] of [['−',-15,'size'],['+',15,'size'],['↻',90,'rotate'],['↺',0,'reset']]){
  controls.createEl('button',{text:label,attr:{type:'button'}}).addEventListener('click',()=>{
   if(action==='size')width=Math.max(25,Math.min(200,width+delta));
   else if(action==='rotate')rotate=(rotate+delta)%360;
   else {width=100;rotate=0;}
   apply();
  });
 }
 modal.contentEl.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Ajustes apenas no visualizador. Para gravar uma largura no Markdown, use a opção de normalização.',
  'Viewer-only adjustments. Use the width normalization command to persist sizes in Markdown.')});
 modal.open();
}
function writerV12RegisterImageViewer(plugin){
 if(!writerV12On(plugin,'imageTools'))return;
 plugin.registerMarkdownPostProcessor((root)=>{
  if(!writerV12On(plugin,'imageTools')||writerV12CompanionInstalled(plugin,'ahmed-toolkit'))return;
  for(const img of root.querySelectorAll('img:not([data-basic-v12-image])')){
   img.dataset.basicV12Image='true';
   img.setAttribute('title',writerUi('Toque para ampliar','Tap to enlarge'));
   img.addEventListener('click',event=>{
    if(!writerV12On(plugin,'imageTools'))return;
    event.preventDefault();event.stopPropagation();
    writerV12Lightbox(plugin,img);
   });
  }
 });
}
function writerV12TaskLines(source){
 const out=[],rx=/^[ \t]*[-*][ \t]+\[([ xX])\][ \t]+(.+)$/gm;
 let match;
 while((match=rx.exec(String(source||'')))!==null&&out.length<150)
  out.push({done:match[1].toLowerCase()==='x',text:match[2].slice(0,350)});
 return out;
}
async function writerV12OpenTasks(plugin){
 if(!writerV12On(plugin,'taskNavigator'))return;
 const modal=new Modal(plugin.app);
 modal.titleEl.setText(writerUi('Tarefas do cofre','Vault tasks'));
 const status=modal.contentEl.createEl('p',{text:writerUi('Lendo tarefas locais...','Reading local tasks...')});
 const host=modal.contentEl.createDiv();modal.open();
 const files=plugin.app.vault.getMarkdownFiles().slice(0,writerV12Config(plugin).maxTaskFiles);
 const results=[];
 try{
  for(let i=0;i<files.length;i+=10){
   const group=files.slice(i,i+10);
   const rows=await Promise.all(group.map(async file=>({file,content:await plugin.app.vault.cachedRead(file).catch(()=>null)})));
   if(!modal.contentEl.isConnected)return;
   for(const row of rows)if(row.content!==null)
    for(const task of writerV12TaskLines(row.content))results.push({file:row.file,...task});
  }
  results.sort((a,b)=>Number(a.done)-Number(b.done));
  status.setText(results.length+' '+writerUi('tarefas em','tasks across')+' '+files.length+' '+writerUi('notas (somente leitura)','notes (read-only)'));
  if(!results.length)host.createEl('p',{text:writerUi('Nenhuma tarefa encontrada.','No tasks found.')});
  for(const task of results.slice(0,150)){
   const line=host.createEl('button',{cls:'clickable-icon',attr:{type:'button',style:'display:block;text-align:left;width:100%;height:auto;white-space:normal;padding:8px;'}});
   line.setText((task.done?'☑ ':'☐ ')+task.text+' — '+task.file.basename);
   line.addEventListener('click',()=>{modal.close();void plugin.app.workspace.getLeaf(false).openFile(task.file);});
  }
 }catch(error){status.setText(writerUi('Não foi possível ler as tarefas: ','Could not scan tasks: ')+String(error.message||error));}
}
function writerV12SafeName(name){
 return String(name||'').trim().replace(/[\\/:*?"<>|#\[\]\x00-\x1f]/g,' ').replace(/\s+/g,' ').trim().slice(0,70)||'Captured';
}
async function writerV12CreateNote(plugin,folder,title,body){
 const vault=plugin.app.vault;
 if(!vault.getAbstractFileByPath(folder))await vault.createFolder(folder);
 const now=new Date();
 const date=now.toISOString().slice(0,16).replace('T',' ').replace(':','-');
 const base=folder+'/'+date+' '+writerV12SafeName(title);
 let path=base+'.md',number=2;
 while(vault.getAbstractFileByPath(path))path=base+' '+number+++'.md';
 const file=await vault.create(path,String(body||'').slice(0,100000));
 await plugin.app.workspace.getLeaf(false).openFile(file);
 return file;
}
function writerV12Capture(plugin,brainstorm){
 if(!writerV12On(plugin,'localInbox'))return;
 const modal=new Modal(plugin.app);
 modal.titleEl.setText(brainstorm?writerUi('Nova chuva de ideias','New brainstorm'):writerUi('Captura rápida','Quick capture'));
 const title=modal.contentEl.createEl('input',{attr:{type:'text',placeholder:writerUi('Título','Title'),maxlength:'70',style:'width:100%;margin-bottom:8px;'}});
 const body=modal.contentEl.createEl('textarea',{attr:{rows:'9',placeholder:writerUi('Digite ou cole seu conteúdo...','Type or paste your content...'),style:'width:100%;'}});
 const save=async()=>{
  if(!body.value.trim()){new Notice(writerUi('Adicione algum conteúdo.','Enter some content.'));return;}
  try{
   const text=brainstorm?'# '+writerV12SafeName(title.value||'Brainstorm')+'\n\n## Ideias\n\n'+body.value.trim()+'\n\n## Próximas ações\n\n- [ ] \n':
    '# '+writerV12SafeName(title.value||'Captura')+'\n\n'+body.value.trim()+'\n';
   const file=await writerV12CreateNote(plugin,brainstorm?'Basic Brainstorms':'Inbox',title.value||'Captura',text);
   modal.close();new Notice(writerUi('Nota criada: ','Created note: ')+file.path);
  }catch(error){new Notice(String(error.message||error));}
 };
 new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Criar nota','Create note')).setCta().onClick(save));
 modal.open();
}
function writerV12ActiveFolder(plugin){
 const file=plugin.app.workspace.getActiveFile?.();
 const parent=file?.parent;
 return parent&&parent.path!=='/'?parent.path:'';
}
function writerV12FocusRefresh(plugin){
 const focus=writerV12On(plugin,'folderFocus')?(plugin._writerV12FolderFocus||''):'';
 for(const leaf of plugin.app.workspace.getLeavesOfType?.('file-explorer')||[]){
  const root=leaf.view?.containerEl;
  if(!root)continue;
  for(const el of root.querySelectorAll('.nav-file, .nav-folder')){
   const title=el.querySelector(':scope > .nav-file-title, :scope > .nav-folder-title');
   const path=el.getAttribute('data-path')||title?.getAttribute('data-path')||'';
   // A blank path must not be hidden; other plugins may supply custom rows.
   const keep=!focus||!path||path===focus||path.startsWith(focus+'/')||focus.startsWith(path+'/');
   if(!keep&&el.dataset.writerV12Hidden!=='1'){
    el.dataset.writerV12Hidden='1';el.dataset.writerV12Display=el.style.display||'';el.style.display='none';
   }else if(keep&&el.dataset.writerV12Hidden==='1'){
    el.style.display=el.dataset.writerV12Display||'';
    delete el.dataset.writerV12Hidden;delete el.dataset.writerV12Display;
   }
  }
 }
}
function writerV12FolderFocus(plugin,clear){
 if(!writerV12On(plugin,'folderFocus'))return;
 if(!clear&&!writerV12ActiveFolder(plugin)){
  new Notice(writerUi('Abra uma nota dentro de uma pasta.','Open a note inside a folder.'));return;
 }
 plugin._writerV12FolderFocus=clear?'':writerV12ActiveFolder(plugin);
 writerV12FocusRefresh(plugin);
 new Notice(clear?writerUi('Explorador completo restaurado.','Full explorer restored.'):
  writerUi('Foco temporário: ','Temporary folder focus: ')+plugin._writerV12FolderFocus);
}
function writerV12RegisterFocus(plugin){
 plugin._writerV12FolderFocus='';
 const run=()=>writerV12FocusRefresh(plugin);
 plugin.app.workspace.onLayoutReady?.(()=>{
  run();
  const root=plugin.app.workspace.containerEl;
  if(typeof MutationObserver!=='undefined'&&root){
   let scheduled=false;
   const observer=new MutationObserver(()=>{
    if(scheduled||!plugin._writerV12FolderFocus)return;
    scheduled=true;Promise.resolve().then(()=>{scheduled=false;run();});
   });
   observer.observe(root,{childList:true,subtree:true});
   plugin.register(()=>{observer.disconnect();plugin._writerV12FolderFocus='';run();});
  }
 });
 plugin.registerEvent(plugin.app.workspace.on('layout-change',run));
}
function writerV12ConflictViewer(plugin){
 const files=plugin.app.vault.getFiles().filter(file=>/\.sync-conflict-/i.test(file.name)).slice(0,100);
 const modal=new Modal(plugin.app);
 modal.titleEl.setText(writerUi('Conflitos Syncthing · somente leitura','Syncthing conflicts · read-only'));
 modal.contentEl.createEl('p',{text:files.length+' '+writerUi('arquivos de conflito encontrados. Nenhum será apagado ou mesclado.','conflict files found. None will be deleted or merged.')});
 for(const file of files){
  const button=modal.contentEl.createEl('button',{text:file.path,attr:{type:'button',style:'display:block;width:100%;text-align:left;margin:6px 0;'}});
  button.addEventListener('click',async()=>{
   if(file.extension!=='md'&&file.extension!=='txt'){new Notice(writerUi('Abra o arquivo manualmente para comparar.','Open the file manually to compare.'));return;}
   const child=new Modal(plugin.app);
   child.titleEl.setText(file.name);
   const originalPath=file.path.replace(/\.sync-conflict-[^.]+(?=\.[^.]+$)/i,'');
   const original=plugin.app.vault.getAbstractFileByPath(originalPath);
   const max=50000;
   for(const [name,source] of [[writerUi('Conflito','Conflict'),file],[writerUi('Original','Original'),original]]){
    child.contentEl.createEl('h4',{text:name});
    const data=source?.extension===file.extension?await plugin.app.vault.cachedRead(source).catch(()=>null):null;
    const pre=child.contentEl.createEl('pre',{text:data===null?writerUi('Não encontrado','Not found'):data.slice(0,max)});
    pre.style.cssText='white-space:pre-wrap;max-height:25vh;overflow:auto;';
   }
   child.contentEl.createEl('p',{text:writerUi('Compare e resolva manualmente; Basic não altera os arquivos de conflito.','Compare and resolve manually; Basic does not change conflict files.')});
   child.open();
  });
 }
 modal.open();
}

function writerV12BasicTools(plugin,modal){
 const all=plugin.app.commands?.listCommands?.()||Object.values(plugin.app.commands?.commands||{});
 const prefix=(plugin.manifest?.id||'basic-ai-tool-for-writers')+':';
 const actions=[
  ['v107-local-tts-selection','TTS: ler seleção','TTS: read selection'],
  ['v107-local-tts-panel','TTS: abrir controles','TTS: open controls'],
  ['v8-inline-ai-generate','IA: sugerir continuação','AI: suggest continuation'],
  ['v9-toggle-format-toolbar','Alternar barra de formatação','Toggle formatting toolbar']
 ];
 const available=actions.map(([id,pt,en])=>({
  command:all.find(c=>c.id===prefix+id),name:writerUi(pt,en)
 })).filter(a=>a.command);
 if(!available.length)return;
 modal.contentEl.createEl('h4',{text:writerUi('Recursos já presentes no Basic','Existing Basic tools')});
 const tools=modal.contentEl.createDiv();
 for(const action of available)
  tools.createEl('button',{text:action.name,attr:{type:'button',style:'margin:3px;'}})
   .addEventListener('click',()=>plugin.app.commands.executeCommandById(action.command.id));
}

function writerV12OpenIntegrationHub(plugin,role){
 if(!writerV12On(plugin,'integrations'))return;
 const cfg=writerV12Config(plugin),modal=new Modal(plugin.app);
 modal.titleEl.setText(role==='sync'?writerUi('Central de sincronização','Synchronization center'):
  writerUi('Central de integrações · v12','Integration center · v12'));
 const intro=role==='sync'?
  writerUi('Escolha apenas um mecanismo para executar comandos manuais. O Basic não inicia sincronização automática, nem desliga rotinas de outros plugins.',
   'Select one provider for manual commands. Basic does not auto-sync or disable other plugins’ background jobs.'):
  writerUi('Funções nativas do Basic continuam independentes. Plugins externos, quando instalados, aparecem como comandos adicionais sem copiar seus dados.',
   'Native Basic features remain independent. Installed companion plugins expose additional commands without duplicating their data.');
 modal.contentEl.createEl('p',{text:intro});
 if(role!=='sync')writerV12BasicTools(plugin,modal);
 if(role==='sync'){
  new Setting(modal.contentEl).setName(writerUi('Provedor selecionado','Selected provider'))
   .addDropdown(d=>{
    for(const id of WRITER_V12_SYNC){
     const name=id==='none'?writerUi('Nenhum','None'):WRITER_V12_COMPANIONS.find(p=>p.id===id)?.name||id;
     d.addOption(id,name);
    }
    d.setValue(cfg.syncProvider).onChange(async value=>{
     cfg.syncProvider=WRITER_V12_SYNC.includes(value)?value:'none';
     await plugin.saveSettings();modal.close();writerV12OpenIntegrationHub(plugin,'sync');
    });
   });
  new Setting(modal.contentEl).setName(writerUi('Conflitos locais','Local conflicts'))
   .addButton(b=>b.setButtonText(writerUi('Inspecionar','Inspect')).onClick(()=>writerV12ConflictViewer(plugin)));
 }
 for(const item of WRITER_V12_COMPANIONS.filter(i=>role!=='sync'||i.role==='sync')){
  const installed=writerV12CompanionInstalled(plugin,item.id);
  const section=modal.contentEl.createDiv({cls:'setting-item'});
  const info=section.createDiv({cls:'setting-item-info'});
  info.createEl('div',{cls:'setting-item-name',text:item.name});
  info.createEl('div',{cls:'setting-item-description',text:installed?writerUi('Ativo no Obsidian','Active in Obsidian'):
    writerUi('Não instalado ou desativado','Not installed or disabled')});
  if(installed&&(role!=='sync'||cfg.syncProvider===item.id)){
   const cmd=writerV12Commands(plugin,item.id)
    .filter(c=>!/(?:delete|remove|discard|reset|force-push|drop)/i.test(c.id)).slice(0,12);
   if(cmd.length){
    const actions=modal.contentEl.createDiv();
    for(const command of cmd){
     const button=actions.createEl('button',{text:command.name,attr:{type:'button',style:'margin:3px;'}});
     button.addEventListener('click',()=>{
      if(role==='sync'&&plugin._writerV12SyncRunning)return;
      // Dispatch is explicit; commands and configuration remain owned by the companion.
      try{
       if(role==='sync')plugin._writerV12SyncRunning=true;
       const maybe=plugin.app.commands.executeCommandById(command.id);
       if(maybe&&typeof maybe.finally==='function')
        maybe.finally(()=>{plugin._writerV12SyncRunning=false;});
       else plugin._writerV12SyncRunning=false;
      }catch(error){
       plugin._writerV12SyncRunning=false;new Notice(String(error.message||error));
      }
     });
    }
   }
  }
 }
 if(role==='sync')modal.contentEl.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Atenção: Git, FIT e Syncthing podem sobrescrever mudanças entre dispositivos. Faça backup e desative agendas concorrentes nos plugins instalados.',
  'Caution: Git, FIT and Syncthing can conflict across devices. Back up your vault and disable concurrent jobs in installed plugins.')});
 modal.open();
}
function writerV12Templates(plugin,editor){
 if(!editor)return;
 const templates=[
  {name:writerUi('Cena de romance','Fiction scene'),text:'# Cena: \n\n## Objetivo\n\n## Conflito\n\n## Desenvolvimento\n\n## Desfecho\n\n'},
  {name:writerUi('Personagem','Character'),text:'# Personagem: \n\n## Motivação\n\n## Personalidade\n\n## Relações\n\n## Arco\n\n'},
  {name:writerUi('Pesquisa','Research'),text:'# Pesquisa: \n\n## Pergunta\n\n## Fontes\n\n## Evidências\n\n## Conclusões\n\n'},
  {name:writerUi('Reunião','Meeting'),text:'# Reunião\n\n## Participantes\n\n## Pauta\n\n## Decisões\n\n## Ações\n\n- [ ] \n'},
  {name:writerUi('Planejamento semanal','Weekly plan'),text:'# Semana\n\n## Prioridades\n\n## Calendário\n\n## Tarefas\n\n- [ ] \n'},
  {name:writerUi('Resumo de estudo','Study summary'),text:'# Resumo\n\n## Conceitos\n\n## Questões\n\n## Próxima revisão\n\n'}
 ];
 class Picker extends FuzzySuggestModal{
  getItems(){return templates;}
  getItemText(item){return item.name;}
  onChooseItem(item){editor.replaceSelection(item.text);}
 }
 const picker=new Picker(plugin.app);
 picker.setPlaceholder(writerUi('Escolha um modelo local (não usa IA)','Choose a local template (no AI request)'));
 picker.open();
}
function writerV12Register(plugin){
 writerV12Config(plugin);
 const command=(id,pt,en,callback)=>plugin.addCommand({id,name:writerUi(pt,en),callback});
 command('v12-integrations','Toolkit: central de integrações','Toolkit: integration center',()=>writerV12OpenIntegrationHub(plugin));
 command('v12-sync-center','Sincronização: abrir central','Sync: open center',()=>writerV12OpenIntegrationHub(plugin,'sync'));
 command('v12-tasks','Tarefas: localizar em notas','Tasks: find in notes',()=>void writerV12OpenTasks(plugin));
 command('v12-capture','Captura: guardar na Inbox local','Capture: save to local inbox',()=>writerV12Capture(plugin,false));
 command('v12-brainstorm','Ideias: criar brainstorm local','Ideas: create local brainstorm',()=>writerV12Capture(plugin,true));
 command('v12-folder-focus','Explorador: focar pasta da nota','Explorer: focus current folder',()=>writerV12FolderFocus(plugin,false));
 command('v12-folder-focus-reset','Explorador: mostrar todas as pastas','Explorer: show all folders',()=>writerV12FolderFocus(plugin,true));
 plugin.addCommand({id:'v12-format-palette',name:writerUi('Formatar: paleta unificada','Format: unified palette'),
  editorCallback:editor=>writerV12OpenPalette(plugin,editor)});
 plugin.addCommand({id:'v12-normalize-images',name:writerUi('Imagens: padronizar largura na seleção','Images: normalize widths in selection'),
  editorCallback:editor=>writerV12NormalizeImageCommand(plugin,editor)});
 plugin.addCommand({id:'v12-template-picker',name:writerUi('Modelos: inserir estrutura pronta','Templates: insert local outline'),
  editorCallback:editor=>writerV12Templates(plugin,editor)});
 writerV12RegisterImageViewer(plugin);
 writerV12RegisterFocus(plugin);
}
function writerV12Settings(plugin,panel){
 const cfg=writerV12Config(plugin);
 panel.createEl('h3',{text:writerUi('Toolkit unificado · v12','Unified toolkit · v12')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Aproveita a formatação, o TTS, o explorador, os Spaces e a IA já presentes. Sincronização externa e criptografia não são duplicadas.',
  'Reuses existing formatting, TTS, explorer, Spaces and AI. External sync and encryption engines are not duplicated.')});
 for(const [key,pt,en] of [
  ['enabled','Ativar Toolkit v12','Enable v12 toolkit'],
  ['palette','Paleta de formatação','Formatting palette'],
  ['imageTools','Visualizador e tamanhos de imagens','Image viewer and sizing'],
  ['taskNavigator','Navegação de tarefas','Task navigation'],
  ['localInbox','Captura e brainstorm locais','Local capture and brainstorm'],
  ['folderFocus','Foco temporário por pasta','Temporary folder focus'],
  ['integrations','Central de integrações externas','External integration center']
 ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false)
  .onChange(async val=>{cfg[key]=val;await plugin.saveSettings();writerV12FocusRefresh(plugin);}));
 new Setting(panel).setName(writerUi('Limite de notas na busca por tarefas','Task scan note limit'))
  .addSlider(s=>s.setLimits(25,1000,25).setValue(cfg.maxTaskFiles).setDynamicTooltip()
   .onChange(async val=>{cfg.maxTaskFiles=val;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Central de integrações','Integration center'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV12OpenIntegrationHub(plugin)));
 new Setting(panel).setName(writerUi('Central de sincronização','Synchronization center'))
  .addButton(b=>b.setButtonText(writerUi('Abrir','Open')).onClick(()=>writerV12OpenIntegrationHub(plugin,'sync')));
}
