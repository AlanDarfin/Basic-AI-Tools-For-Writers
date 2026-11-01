'use strict';
/* Basic AI v7 beta.2 — Story Studio.
 * Original implementation, based on ideas (not code) from reference plugins.
 * Uses existing Compendium, Longform, Timeline, and compile systems.
 */
const WRITER_V7_STUDIO_TEMPLATES=[
 {id:'character',pt:'Personagem',en:'Character',tag:'personagem',fields:['summary','avatar','role','faction','relationships']},
 {id:'place',pt:'Local',en:'Place',tag:'local',fields:['summary','cover','region','climate','relationships']},
 {id:'item',pt:'Item',en:'Item',tag:'item',fields:['summary','cover','origin','relationships']},
 {id:'group',pt:'Grupo ou facção',en:'Group or faction',tag:'grupo',fields:['summary','cover','leader','members','relationships']},
 {id:'culture',pt:'Cultura',en:'Culture',tag:'cultura',fields:['summary','cover','language','traditions','relationships']},
 {id:'economy',pt:'Economia',en:'Economy',tag:'economia',fields:['summary','cover','currency','trade','relationships']},
 {id:'magic',pt:'Sistema mágico',en:'Magic system',tag:'magia',fields:['summary','cover','source','rules','relationships']},
 {id:'event',pt:'Evento',en:'Event',tag:'evento',fields:['summary','timelineDate','location','relationships']},
 {id:'reference',pt:'Referência',en:'Reference',tag:'referencia',fields:['summary','source','relationships']}
];
const WRITER_V7_FIELD_LABELS={
 summary:['Resumo','Summary'],avatar:['Avatar','Avatar'],cover:['Imagem de capa','Cover image'],
 role:['Papel','Role'],faction:['Facção','Faction'],region:['Região','Region'],
 climate:['Clima','Climate'],origin:['Origem','Origin'],leader:['Líder','Leader'],
 members:['Membros','Members'],language:['Idioma','Language'],traditions:['Tradições','Traditions'],
 currency:['Moeda','Currency'],trade:['Comércio','Trade'],source:['Fonte','Source'],
 rules:['Regras','Rules'],timelineDate:['Data do evento','Event date'],
 location:['Local','Location'],relationships:['Relações (links do Obsidian)','Relationships (Obsidian links)'],
 status:['Estado','Status'],pov:['Ponto de vista','Point of view'],sceneDate:['Data da cena','Scene date']
};
function writerV7StudioTemplates(plugin){
 const custom=Array.isArray(plugin.settings.v7StudioTemplates)?plugin.settings.v7StudioTemplates:[];
 const safe=custom.filter(t=>t&&typeof t.id==='string'&&/^[a-z][a-z0-9-]{0,40}$/.test(t.id)&&
  typeof t.tag==='string'&&writerV7Tag(t.tag)&&Array.isArray(t.fields))
  .slice(0,40).map(t=>({...t,fields:t.fields.filter(f=>/^[a-zA-Z][\w-]{0,50}$/.test(f)).slice(0,15)}));
 return [...WRITER_V7_STUDIO_TEMPLATES,...safe.filter(t=>!WRITER_V7_STUDIO_TEMPLATES.some(b=>b.id===t.id))];
}
function writerV7StudioKind(entry,templates){
 const tags=(entry.tags||[]).map(t=>t.toLocaleLowerCase());
 const fm=entry.cache?.frontmatter||{};
 const explicit=String(fm.worldType||fm.type||'').trim().toLowerCase();
 return templates.find(t=>t.id===explicit||tags.some(tag=>tag==='#'+t.tag||tag.startsWith('#'+t.tag+'/')))||null;
}
function writerV7StudioFields(entry,template){
 const fm=entry.cache?.frontmatter||{};
 const keys=[...new Set([...(template?.fields||[]),'status','pov'])];
 return keys.filter(key=>fm[key]!==undefined&&fm[key]!==null&&fm[key]!=='').map(key=>({
  key,label:writerUi(...(WRITER_V7_FIELD_LABELS[key]||[key,key])),
  text:Array.isArray(fm[key])?fm[key].map(String).join(', '):typeof fm[key]==='object'?JSON.stringify(fm[key]):String(fm[key])
 }));
}
function writerV7StudioImage(app,entry){
 const fm=entry.cache?.frontmatter||{};
 let raw=fm.avatar||fm.cover||fm.portrait||fm.image;
 if(Array.isArray(raw))raw=raw[0];
 if(typeof raw!=='string')return '';
 const link=raw.trim().replace(/^!\[\[/,'').replace(/^\[\[/,'').replace(/\]\]$/,'').split('|')[0].trim();
 if(!link||/^(https?:|data:|javascript:|file:)/i.test(link))return '';
 const file=app.metadataCache?.getFirstLinkpathDest?.(link,entry.path)||app.vault.getAbstractFileByPath(link);
 if(!(file instanceof TFile)||!/^(png|jpe?g|webp|gif|avif|svg)$/i.test(file.extension))return '';
 return app.vault.getResourcePath(file)||'';
}
function writerV7StudioLinkValue(text){
 const s=String(text||'').trim();if(!s)return '';
 return s.startsWith('[[')&&s.endsWith(']]')?s:'[['+s.replace(/[\[\]]/g,'')+']]';
}
function writerV7StudioLinkedTargets(app,entry){
 const fm=entry.cache?.frontmatter||{};
 const raw=fm.relationships||fm.relations||fm.links||[];
 const list=Array.isArray(raw)?raw:[raw];
 const found=new Set();
 for(const value of list){
  const name=String(value||'').trim().replace(/^!?\[\[/,'').replace(/\]\]$/,'').split('|')[0].trim();
  if(!name)continue;
  const file=app.metadataCache?.getFirstLinkpathDest?.(name,entry.path);
  if(file instanceof TFile&&file.path!==entry.path)found.add(file.path);
 }
 return [...found];
}
async function writerV7StudioCreate(view,project,template){
 new TextPrompt(view.app,writerUi('Novo registro: ','New record: ')+writerUi(template.pt||template.name,template.en||template.name),
 async raw=>{
  const name=clean(raw);
  if(!name)return;
  try{
   const dir=view.notesRoot(project);
   await view.ensureFolder(dir);
   const target=dir+'/'+name+'.md';
   if(view.app.vault.getAbstractFileByPath(target))throw Error(writerUi('Esta nota já existe.','That note already exists.'));
   const yaml={tags:[template.tag],worldType:template.id,summary:''};
   const content='---\n'+stringifyYaml(yaml)+'---\n\n# '+name+'\n';
   const file=await view.app.vault.create(target,content);
   view.openFile(file);await view.render();
  }catch(e){new Notice(String(e.message||e));}
 }).open();
}
function writerV7StudioOpenSheet(view,entry,template){
 const modal=new Modal(view.app),fm=entry.cache?.frontmatter||{};
 const keys=[...new Set(['summary',...(template?.fields||[]),'status','pov'])].filter(k=>/^[\w-]{1,60}$/.test(k));
 const values=Object.fromEntries(keys.map(k=>[k,Array.isArray(fm[k])?fm[k].join(', '):String(fm[k]??'')]));
 modal.onOpen=()=>{
  modal.contentEl.addClass('writer-v7-studio-sheet');
  modal.setTitle(writerUi('Ficha: ','Sheet: ')+entry.title);
  modal.contentEl.createEl('p',{text:writerUi('Edita apenas os campos exibidos; preserva as demais propriedades e o texto.','Edits only listed properties and preserves all others and the note body.')});
  for(const key of keys){
   const label=writerUi(...(WRITER_V7_FIELD_LABELS[key]||[key,key]));
   const set=new Setting(modal.contentEl).setName(label);
   if(key==='summary'||key==='rules'||key==='traditions')set.addTextArea(t=>{
    t.inputEl.rows=3;t.setValue(values[key]).onChange(v=>values[key]=v.slice(0,3000));
   });
   else set.addText(t=>t.setValue(values[key]).onChange(v=>values[key]=v.slice(0,1000)));
  }
  const records=writerV7ProjectNotes(view,view.currentProject).filter(r=>r.path!==entry.path);
  const candidates=records.slice(0,300);
  let related='';
  new Setting(modal.contentEl).setName(writerUi('Vincular outra nota','Link another note')).addDropdown(d=>{
   d.addOption('',writerUi('Selecionar nota…','Select note…'));
   for(const record of candidates)d.addOption(record.path,record.title);
   d.setValue('').onChange(v=>related=v);
  });
  new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()))
   .addButton(b=>b.setCta().setButtonText(writerUi('Salvar ficha','Save sheet')).onClick(async()=>{
    try{
     await view.app.fileManager.processFrontMatter(entry.file,data=>{
      for(const key of keys){
       const value=values[key]?.trim();
       if(!value)continue; // Blank fields never delete existing data.
       if(key==='relationships'||key==='members')data[key]=value.split(/,\s*/).map(writerV7StudioLinkValue).filter(Boolean);
       else data[key]=value;
      }
      if(related){
       const file=view.app.vault.getAbstractFileByPath(related);
       if(file instanceof TFile){
        const current=Array.isArray(data.relationships)?data.relationships:typeof data.relationships==='string'?[data.relationships]:[];
        const link='[['+file.basename+']]';
        if(!current.includes(link))data.relationships=[...current,link];
       }
      }
     });
     modal.close();await view.render();
    }catch(e){new Notice(writerUi('Falha ao salvar: ','Save failed: ')+String(e.message||e));}
   }));
 };modal.open();
}
function writerV7StudioAugmentEntry(view,card,record,templates,allRecords){
 const template=writerV7StudioKind(record,templates);
 const fm=record.cache?.frontmatter||{};
 const src=writerV7StudioImage(view.app,record);
 if(src){
  const img=card.createEl('img',{cls:'writer-v7-studio-thumb',attr:{src,alt:writerUi('Imagem de ','Image for ')+record.title,loading:'lazy'}});
  img.addEventListener('error',()=>img.remove());
 }
 const summary=String(fm.summary||fm.description||'').trim();
 if(summary)card.createEl('p',{cls:'writer-v7-studio-summary',text:summary.slice(0,380)});
 const bar=card.createDiv({cls:'writer-v7-studio-card-actions'});
 bar.createEl('button',{text:writerUi('Ficha','Sheet')}).addEventListener('click',()=>writerV7StudioOpenSheet(view,record,template));
 const linked=writerV7StudioLinkedTargets(view.app,record);
 if(linked.length){
  const details=card.createEl('details',{cls:'writer-v7-studio-links'});
  details.createEl('summary',{text:linked.length+' '+writerUi('relações','relationships')});
  for(const path of linked.slice(0,18)){
   const target=allRecords.find(r=>r.path===path);
   if(target)details.createEl('button',{text:target.title}).addEventListener('click',()=>view.openFile(target.file));
  }
 }
}
function writerV7StudioRenderGraph(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-graph'});
 root.createEl('h3',{text:writerUi('Relações do universo','World relationships')});
 const all=writerV7ProjectNotes(view,project),templates=writerV7StudioTemplates(view.plugin);
 root.createEl('p',{text:writerUi('As conexões usam links Markdown e a propriedade relationships das notas; não criam registros duplicados.','Connections reuse Markdown links and notes’ relationships property; no duplicate records are created.'),cls:'writer-v7-muted'});
 const finder=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Filtrar relações…','Filter relationships…'),'aria-label':writerUi('Filtrar relações','Filter relationships')}});
 const list=root.createDiv({cls:'writer-v7-studio-graph-list'});
 const render=()=>{
  list.empty();
  const needle=finder.value.trim().toLocaleLowerCase(),links=view.app.metadataCache?.resolvedLinks||{};
  const shown=all.filter(r=>!needle||(r.title+' '+r.tags.join(' ')).toLocaleLowerCase().includes(needle)).slice(0,100);
  if(!shown.length)list.createEl('p',{text:writerUi('Sem registros relacionados.','No matching records.')});
  for(const entry of shown){
   const from=entry.path,targets=new Set(writerV7StudioLinkedTargets(view.app,entry));
   for(const other of all){
    if(other.path===from)continue;
    if(Number(links[from]?.[other.path]||0)||Number(links[other.path]?.[from]||0))targets.add(other.path);
   }
   if(!targets.size)continue;
   const row=list.createDiv({cls:'writer-v7-studio-graph-row'});
   row.createEl('button',{cls:'writer-v7-studio-graph-source',text:entry.title}).addEventListener('click',()=>view.openFile(entry.file));
   row.createSpan({text:'↔',cls:'writer-v7-studio-graph-edge'});
   const related=row.createDiv({cls:'writer-v7-studio-graph-targets'});
   for(const path of [...targets].slice(0,15)){
    const item=all.find(r=>r.path===path);
    if(item)related.createEl('button',{text:item.title,cls:'writer-v7-tag'}).addEventListener('click',()=>view.openFile(item.file));
   }
   row.createEl('button',{text:writerUi('Editar','Edit')}).addEventListener('click',()=>writerV7StudioOpenSheet(view,entry,writerV7StudioKind(entry,templates)));
  }
 };
 finder.addEventListener('input',render);render();
}
function writerV7StudioScenes(view,project){
 const flat=view.activeScenes(project);
 return flat.map((scene,i)=>{
  const file=view.resolveScene(project,scene.title),fm=file?view.app.metadataCache?.getFileCache?.(file)?.frontmatter||{}:{};
  return {file,title:scene.title,indent:Math.max(0,Number(scene.indent)||0),position:i+1,
   status:String(fm.status||fm.sceneStatus||'outline'),pov:String(fm.pov||''),location:String(fm.location||''),
   summary:String(fm.summary||fm.synopsis||''),date:String(fm.sceneDate||'')};
 });
}
function writerV7StudioRenderBoard(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-board'});
 root.createEl('h3',{text:writerUi('Quadro da história','Story board')});
 root.createEl('p',{text:writerUi('Visão de planejamento das mesmas cenas Longform. A ordem, o recuo e a compilação continuam na aba Cenas.','Planning view for the existing Longform scenes. Reordering and compilation remain in Scenes.'),cls:'writer-v7-muted'});
 const cards=writerV7StudioScenes(view,project),actions=root.createDiv({cls:'writer-v7-toolbar'});
 const states=['','outline','draft','wip','revised','final'];let selected='';
 const picker=actions.createEl('select',{attr:{'aria-label':writerUi('Filtrar estado','Filter status')}});
 for(const st of states){const op=picker.createEl('option',{text:st||writerUi('Todos os estados','All statuses')});op.value=st;}
 const list=root.createDiv({cls:'writer-v7-studio-board-list'});
 const draw=()=>{
  list.empty();
  const shown=cards.filter(x=>!selected||x.status===selected);
  const totals=root.querySelector('.writer-v7-studio-board-stats');
  if(totals)totals.setText(shown.length+'/'+cards.length+' '+writerUi('cenas','scenes')+' · '+new Set(cards.map(x=>x.pov).filter(Boolean)).size+' POV');
  for(const scene of shown){
   const card=list.createDiv({cls:'writer-v7-studio-scene'});
   card.createSpan({cls:'writer-v7-studio-scene-num',text:'#'+scene.position});
   const content=card.createDiv({cls:'writer-v7-studio-scene-content'});
   content.createEl('button',{cls:'writer-v7-studio-scene-title',text:scene.title})
    .addEventListener('click',()=>scene.file?view.openFile(scene.file):new Notice(writerUi('Arquivo ausente','File missing')));
   const badges=content.createDiv({cls:'writer-v7-studio-scene-badges'});
   for(const text of [scene.status,scene.pov&&'POV: '+scene.pov,scene.location,scene.date].filter(Boolean))
    badges.createSpan({cls:'writer-v7-tag',text:text.slice(0,70)});
   if(scene.summary)content.createEl('p',{text:scene.summary.slice(0,300)});
   if(scene.file)content.createEl('button',{text:writerUi('Editar ficha','Edit sheet')})
    .addEventListener('click',()=>writerV7StudioOpenSheet(view,{
     file:scene.file,path:scene.file.path,title:scene.title,
     cache:view.app.metadataCache?.getFileCache?.(scene.file),tags:[]
    },{fields:['status','pov','location','sceneDate','summary']}));
  }
 };
 root.createEl('p',{cls:'writer-v7-studio-board-stats'});
 picker.addEventListener('change',()=>{selected=picker.value;draw();});draw();
}
function writerV7StudioSafeMap(m){
 if(!m||typeof m!=='object'||typeof m.image!=='string')return null;
 return {id:String(m.id||''),title:String(m.title||'').slice(0,100),
 image:m.image.slice(0,400),markers:Array.isArray(m.markers)?m.markers.slice(0,400)
  .filter(x=>x&&typeof x.note==='string').map(x=>({
   note:x.note.slice(0,400),x:Math.max(0,Math.min(100,Number(x.x)||0)),
   y:Math.max(0,Math.min(100,Number(x.y)||0))
  })):[]};
}
function writerV7StudioImageFile(app,path){
 const file=app.vault.getAbstractFileByPath(path);
 return file instanceof TFile&&/^(png|jpe?g|webp|gif|avif)$/i.test(file.extension)?file:null;
}
function writerV7StudioRenderMaps(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-maps'});
 root.createEl('h3',{text:writerUi('Mapas do universo','World maps')});
 root.createEl('p',{text:writerUi('Use imagens do próprio cofre; marcadores abrem notas do Compêndio. Não são usados mapas online nem bibliotecas externas.','Use local vault images; markers open Compendium notes. No online map tiles or external libraries are loaded.'),cls:'writer-v7-muted'});
 const prefs=view.prefs(project);if(!Array.isArray(prefs.v7StudioMaps))prefs.v7StudioMaps=[];
 const maps=prefs.v7StudioMaps,files=view.app.vault.getFiles?.()||[],
  images=files.filter(f=>/^(png|jpe?g|webp|gif|avif)$/i.test(f.extension)).slice(0,300);
 const toolbar=root.createDiv({cls:'writer-v7-toolbar'}),picker=toolbar.createEl('select');
 const select=()=>maps.find(x=>x.id===picker.value)||maps[0];
 const updateOptions=()=>{
  picker.empty();
  for(const map of maps){const opt=picker.createEl('option',{text:map.title||map.image});opt.value=map.id;}
 };
 updateOptions();
 toolbar.createEl('button',{text:writerUi('+ Mapa','+ Map')}).addEventListener('click',()=>{
  if(maps.length>=30)return void new Notice(writerUi('Limite de 30 mapas.','Maximum 30 maps.'));
  const modal=new Modal(view.app);let name='',img=images[0]?.path||'';
  modal.onOpen=()=>{
   modal.setTitle(writerUi('Novo mapa de imagem','New image map'));
   new Setting(modal.contentEl).setName(writerUi('Nome','Name')).addText(t=>t.onChange(x=>name=x));
   new Setting(modal.contentEl).setName(writerUi('Imagem do cofre','Vault image')).addDropdown(d=>{
    for(const file of images)d.addOption(file.path,file.path);
    d.setValue(img).onChange(v=>img=v);
   });
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Criar','Create')).setCta().onClick(async()=>{
    if(!img||!writerV7StudioImageFile(view.app,img))return void new Notice(writerUi('Selecione uma imagem válida.','Choose a valid image.'));
    maps.push({id:'map-'+Date.now().toString(36),title:name.trim().slice(0,100)||img,image:img,markers:[]});
    await view.plugin.saveSettings();modal.close();await view.render();
   }));
  };modal.open();
 });
 const content=root.createDiv({cls:'writer-v7-studio-map-content'});
 const show=()=>{
  content.empty();
  const map=select();
  if(!map){content.createEl('p',{text:writerUi('Crie um mapa com uma imagem do cofre.','Create a map using a vault image.')});return;}
  const imgFile=writerV7StudioImageFile(view.app,map.image);
  if(!imgFile){content.createEl('p',{text:writerUi('Imagem ausente: ','Missing image: ')+map.image});return;}
  const bar=content.createDiv({cls:'writer-v7-toolbar'});
  const records=writerV7ProjectNotes(view,project);
  const target=bar.createEl('select',{attr:{'aria-label':writerUi('Nota para marcar','Note to mark')}});
  target.createEl('option',{text:writerUi('Selecionar nota para marcador…','Choose a note to mark…'),value:''});
  for(const record of records.slice(0,300)){
   const opt=target.createEl('option',{text:record.title});opt.value=record.path;
  }
  bar.createEl('button',{text:writerUi('Excluir mapa','Delete map')}).addEventListener('click',()=>{
   new ConfirmProjectAction(view.app,writerUi('Excluir somente o mapa?','Delete map only?'),
    writerUi('A imagem e as notas originais serão preservadas.','Original image and notes will be preserved.'),
    async()=>{prefs.v7StudioMaps=maps.filter(x=>x.id!==map.id);await view.plugin.saveSettings();await view.render();}).open();
  });
  const stage=content.createDiv({cls:'writer-v7-studio-map-stage'});
  stage.createEl('img',{attr:{src:view.app.vault.getResourcePath(imgFile),alt:map.title,loading:'lazy'}});
  stage.addEventListener('click',async event=>{
   if(event.target.closest?.('.writer-v7-studio-map-pin')||!target.value)return;
   const bounds=stage.getBoundingClientRect();
   if(!bounds.width||!bounds.height)return;
   const x=Math.max(0,Math.min(100,Math.round((event.clientX-bounds.left)/bounds.width*10000)/100));
   const y=Math.max(0,Math.min(100,Math.round((event.clientY-bounds.top)/bounds.height*10000)/100));
   if(!Array.isArray(map.markers))map.markers=[];
   if(map.markers.length>=400)return void new Notice(writerUi('Limite de marcadores.','Marker limit reached.'));
   map.markers.push({note:target.value,x,y});await view.plugin.saveSettings();show();
  });
  for(const [index,marker] of (map.markers||[]).entries()){
   const file=view.app.vault.getAbstractFileByPath(marker.note);
   const point=stage.createEl('button',{cls:'writer-v7-studio-map-pin',text:String(index+1),
    attr:{type:'button','aria-label':file?.basename||marker.note,title:file?.basename||marker.note}});
   point.style.left=marker.x+'%';point.style.top=marker.y+'%';
   point.addEventListener('click',event=>{
    event.stopPropagation();
    if(file instanceof TFile)view.openFile(file);
   });
  }
  const markers=content.createDiv({cls:'writer-v7-studio-map-markers'});
  for(const [index,marker] of (map.markers||[]).entries()){
   const file=view.app.vault.getAbstractFileByPath(marker.note);
   const row=markers.createDiv({cls:'writer-v7-studio-map-marker-row'});
   row.createEl('button',{text:(index+1)+'. '+(file?.basename||marker.note)}).addEventListener('click',()=>{if(file instanceof TFile)view.openFile(file);});
   row.createEl('button',{text:'×',attr:{'aria-label':writerUi('Remover marcador','Remove marker')}})
    .addEventListener('click',async()=>{map.markers.splice(index,1);await view.plugin.saveSettings();show();});
  }
 };
 picker.addEventListener('change',show);show();
}
function writerV7StudioRenderAnalytics(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-analytics'});
 root.createEl('h3',{text:writerUi('Estatísticas narrativas','Narrative analytics')});
 const scenes=writerV7StudioScenes(view,project);
 const group=(field)=>[...scenes.reduce((m,s)=>m.set(s[field]||writerUi('(não definido)','(unset)'),1+(m.get(s[field]||writerUi('(não definido)','(unset)'))||0)),new Map()).entries()]
  .sort((a,b)=>b[1]-a[1]);
 root.createEl('p',{text:scenes.length+' '+writerUi('cenas','scenes')});
 for(const [field,pt,en] of [['status','Por estado','By status'],['pov','Por ponto de vista','By viewpoint'],['location','Por local','By location']]){
  const panelGroup=root.createEl('details',{cls:'writer-v7-studio-analytics-group'});panelGroup.open=field==='status';
  panelGroup.createEl('summary',{text:writerUi(pt,en)});
  for(const [label,count] of group(field).slice(0,40)){
   const row=panelGroup.createDiv({cls:'writer-v7-studio-analytics-row'});
   row.createSpan({text:label});row.createSpan({text:String(count),cls:'writer-v7-studio-count'});
  }
 }
}
function writerV7StudioRenderGallery(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-gallery'});
 root.createEl('h3',{text:writerUi('Galeria de referências','Reference gallery')});
 root.createEl('p',{text:writerUi('Mostra imagens já vinculadas às notas do Compêndio. Sem cópias e sem pasta de uploads adicional.','Displays images already linked to Compendium notes. No duplicates or additional upload folder.'),cls:'writer-v7-muted'});
 const records=writerV7ProjectNotes(view,project);
 const images=records.map(r=>({entry:r,url:writerV7StudioImage(view.app,r)})).filter(r=>!!r.url).slice(0,250);
 const filter=root.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar imagens…','Search images…'),'aria-label':writerUi('Pesquisar imagens','Search images')}});
 const gallery=root.createDiv({cls:'writer-v7-studio-gallery-grid'});
 const render=()=>{
  gallery.empty();
  const query=filter.value.trim().toLocaleLowerCase();
  const matched=images.filter(i=>(i.entry.title+' '+i.entry.tags.join(' ')).toLocaleLowerCase().includes(query));
  if(!matched.length)gallery.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma imagem vinculada a uma ficha. Use avatar ou cover nas propriedades.','No linked images. Add an avatar or cover property to a sheet.')});
  for(const item of matched){
   const button=gallery.createEl('button',{cls:'writer-v7-studio-gallery-item'});
   button.createEl('img',{attr:{src:item.url,alt:item.entry.title,loading:'lazy'}});
   button.createSpan({text:item.entry.title});
   button.addEventListener('click',()=>view.openFile(item.entry.file));
  }
 };
 filter.addEventListener('input',render);render();
}
function writerV7StudioRenderSessions(view,panel,project){
 const root=panel.createDiv({cls:'writer-v7-studio-sessions'});
 root.createEl('h3',{text:writerUi('Diário de sessões','Session journal')});
 root.createEl('p',{text:writerUi('Registre sessões de campanha ou reuniões de planejamento em notas Markdown comuns. Não existe um segundo sistema de tarefas ou cenas.','Keep campaign sessions or planning meetings in ordinary Markdown notes. There is no duplicate task or scene system.'),cls:'writer-v7-muted'});
 const folder=view.notesRoot(project)+'/Sessões';
 root.createEl('button',{text:writerUi('+ Sessão','+ Session')}).addEventListener('click',()=>{
  new TextPrompt(view.app,writerUi('Nome da sessão','Session name'),async raw=>{
   const name=clean(raw);if(!name)return;
   try{
    await view.ensureFolder(folder);
    const target=folder+'/'+name+'.md';
    if(view.app.vault.getAbstractFileByPath(target))throw Error(writerUi('A sessão já existe.','Session already exists.'));
    const data={tags:['sessao'],sessionStatus:'planned'};
    const file=await view.app.vault.create(target,'---\n'+stringifyYaml(data)+'---\n\n# '+name+'\n\n## '+writerUi('Resumo','Summary')+'\n\n');
    view.openFile(file);await view.render();
   }catch(e){new Notice(String(e.message||e));}
  }).open();
 });
 const entries=writerV7ProjectNotes(view,project).filter(x=>x.path.startsWith(folder+'/'));
 if(!entries.length)root.createEl('p',{cls:'writer-v7-empty',text:writerUi('Nenhuma sessão cadastrada.','No sessions yet.')});
 for(const r of entries){
  const card=root.createDiv({cls:'writer-v7-studio-session'});
  card.createEl('button',{text:r.title}).addEventListener('click',()=>view.openFile(r.file));
  const status=String(r.cache?.frontmatter?.sessionStatus||'planned');
  card.createSpan({text:status,cls:'writer-v7-tag'});
  if(r.cache?.frontmatter?.sessionDate)card.createSpan({text:String(r.cache.frontmatter.sessionDate),cls:'writer-v7-muted'});
 }
}
class WriterV7StoryStudio{
 constructor(plugin){this.plugin=plugin;}
 register(){
  const p=this.plugin;
  p.addCommand({id:'v7-open-story-board',name:writerUi('História: abrir quadro de cenas','Story: open scene board'),callback:()=>p.openProjects('board')});
  p.addCommand({id:'v7-open-world-graph',name:writerUi('Universo: abrir relações','World: open relationships'),callback:()=>p.openProjects('relations')});
  p.addCommand({id:'v7-open-world-maps',name:writerUi('Universo: abrir mapas','World: open maps'),callback:()=>p.openProjects('maps')});
  p.addCommand({id:'v7-open-reference-gallery',name:writerUi('Universo: abrir galeria','World: open gallery'),callback:()=>p.openProjects('gallery')});
  p.addCommand({id:'v7-open-session-journal',name:writerUi('História: abrir diário de sessões','Story: open session journal'),callback:()=>p.openProjects('sessions')});
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Estúdio de histórias (beta)','Story studio (beta)')});
  panel.createEl('p',{text:writerUi('Recursos integrados às notas, Compêndio, Timeline e projetos atuais. Sem bancos de dados ou compiladores duplicados.','Tools built on current notes, Compendium, Timeline and projects. No duplicate databases or exporters.')});
  const cfg=this.plugin.settings.v7||(this.plugin.settings.v7={});
  for(const [key,pt,en] of [
   ['studioBoard','Quadro de cenas','Scene board'],['studioRelations','Relações entre registros','Entity relationships'],
   ['studioMaps','Mapas de imagens locais','Local image maps'],['studioAnalytics','Estatísticas narrativas','Narrative analytics'],
   ['studioGallery','Galeria de referências','Reference gallery'],['studioSessions','Diário de sessões','Session journal']
  ]){
   if(cfg[key]===undefined)cfg[key]=true;
   new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(cfg[key]!==false).onChange(async v=>{cfg[key]=v;await this.plugin.saveSettings();}));
  }
  panel.createEl('h4',{text:writerUi('Modelos próprios de fichas','Custom sheet templates')});
  panel.createEl('p',{text:writerUi('Modelos personalizados acrescentam categorias e campos ao mesmo Compêndio. Não alteram fichas existentes.','Custom templates add categories and fields to the same Compendium without modifying existing sheets.')});
  const templates=writerV7StudioTemplates(this.plugin);
  for(const tpl of templates.filter(t=>!WRITER_V7_STUDIO_TEMPLATES.some(x=>x.id===t.id))){
   const row=new Setting(panel).setName(tpl.name||tpl.id).setDesc('#'+tpl.tag+' · '+tpl.fields.join(', '));
   row.addButton(b=>b.setButtonText(writerUi('Remover','Remove')).onClick(async()=>{
    this.plugin.settings.v7StudioTemplates=this.plugin.settings.v7StudioTemplates.filter(x=>x.id!==tpl.id);
    await this.plugin.saveSettings();
    new Notice(writerUi('Modelo removido; fichas existentes foram preservadas.','Template removed; existing sheets were preserved.'));
   }));
  }
  new Setting(panel).setName(writerUi('Novo modelo','New template')).addButton(b=>b.setButtonText(writerUi('Criar modelo','Create template')).onClick(()=>{
   const modal=new Modal(this.plugin.app),draft={name:'',tag:'',fields:'summary, cover'};
   modal.onOpen=()=>{
    modal.setTitle(writerUi('Modelo de ficha','Sheet template'));
    for(const [key,pt,en] of [['name','Nome','Name'],['tag','Tag principal','Main tag'],['fields','Campos separados por vírgulas','Comma-separated fields']])
     new Setting(modal.contentEl).setName(writerUi(pt,en)).addText(t=>t.setValue(draft[key]).onChange(x=>draft[key]=x));
    new Setting(modal.contentEl).addButton(x=>x.setButtonText(writerUi('Salvar','Save')).setCta().onClick(async()=>{
     const name=draft.name.trim().slice(0,80),id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
     const tag=writerV7Tag(draft.tag);
     const fields=draft.fields.split(',').map(x=>x.trim()).filter(x=>/^[a-zA-Z][\w-]{0,50}$/.test(x)).slice(0,15);
     if(!name||!id||!tag||writerV7StudioTemplates(this.plugin).some(x=>x.id===id))
      return void new Notice(writerUi('Nome ou tag inválida, ou modelo já existente.','Invalid name/tag or template already exists.'));
     if(!Array.isArray(this.plugin.settings.v7StudioTemplates))this.plugin.settings.v7StudioTemplates=[];
     this.plugin.settings.v7StudioTemplates.push({id,name,tag:tag.slice(1),fields});
     await this.plugin.saveSettings();modal.close();
     new Notice(writerUi('Modelo criado.','Template created.'));
    }));
   };modal.open();
  }));
 }
}
