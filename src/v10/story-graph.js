'use strict';
/* StoryLine: interactive, local-first relationship canvas using vault metadata. */
const WRITER_V107_GRAPH_VIEW='writer-story-graph';
function writerV107GraphConfig(settings){
 const old=settings.v107Graph&&typeof settings.v107Graph==='object'&&!Array.isArray(settings.v107Graph)?settings.v107Graph:{};
 return settings.v107Graph=Object.assign(old,{enabled:true,maxNodes:90,layout:'radial',positions:{},...old,maxNodes:Math.max(20,Math.min(180,Number(old.maxNodes)||90))});
}
function writerV107GraphLinks(value){
 const values=Array.isArray(value)?value:String(value||'').split(/[,;\n]/);
 return values.map(x=>String(x||'').trim().replace(/^\[\[|\]\]$/g,'').split('|')[0]).filter(Boolean).slice(0,100);
}
function writerV107GraphBuild(plugin){
 const cfg=writerV107GraphConfig(plugin.settings),files=plugin.app.vault.getMarkdownFiles();
 const tags=['personagem','character','local','place','item','group','grupo','scene','cena','evento','event'];
 const nodes=[];
 for(const file of files){
  const cache=plugin.app.metadataCache.getFileCache(file)||{},fm=cache.frontmatter||{};
  const noteTags=(cache.tags||[]).map(t=>t.tag.slice(1).toLowerCase());
  const fTags=Array.isArray(fm.tags)?fm.tags:[fm.tags||''];
  const all=[...noteTags,...fTags.map(t=>String(t).replace(/^#/,'').toLowerCase())];
  const kind=tags.find(t=>all.some(v=>v===t||v.startsWith(t+'/')))||
   (fm.characters||fm.relationships||fm.setup_scenes?'scene':'');
  if(!kind)continue;
  nodes.push({file,kind,title:file.basename,source:file.path,meta:fm});
  if(nodes.length>=cfg.maxNodes)break;
 }
 const byPath=new Map(nodes.map((n,i)=>[n.file.path,i])),edges=[],seen=new Set();
 for(let i=0;i<nodes.length;i++){
  const node=nodes[i],fields=['relationships','characters','plotlines','setup_scenes','payoff_scenes','members','leader','location'];
  for(const field of fields){
   for(const value of writerV107GraphLinks(node.meta[field])){
    const file=plugin.app.metadataCache.getFirstLinkpathDest(value,node.file.path);
    const dest=file?byPath.get(file.path):undefined;
    if(dest===undefined||dest===i)continue;
    const key=[i,dest,field].join('|');
    if(seen.has(key))continue;seen.add(key);edges.push({from:i,to:dest,kind:field});
    if(edges.length>=500)break;
   }
  }
 }
 return {nodes,edges};
}
function writerV107GraphPositions(model,cfg){
 const count=model.nodes.length,w=1100,h=760,positions=[];
 for(let i=0;i<count;i++){
  const saved=cfg.positions[model.nodes[i].source];
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){
   positions.push({x:Math.max(35,Math.min(w-35,saved.x)),y:Math.max(35,Math.min(h-35,saved.y))});continue;
  }
  if(cfg.layout==='grid'){
   const columns=Math.ceil(Math.sqrt(count*1.4));
   positions.push({x:80+(i%columns)*Math.min(150,970/columns),y:70+Math.floor(i/columns)*125});
  }else{
   const angle=2*Math.PI*i/Math.max(1,count);
   const radius=170+Math.floor(i/20)*85;
   positions.push({x:w/2+Math.cos(angle)*radius,y:h/2+Math.sin(angle)*radius});
  }
 }
 return positions;
}
function writerV107GraphRender(plugin,container){
 const cfg=plugin.settings.v107Graph,model=writerV107GraphBuild(plugin);
 container.empty();container.addClass('writer-v107-graph');
 const top=container.createDiv({cls:'writer-v107-graph-toolbar'});
 top.createEl('strong',{text:writerUi('Mapa de relações','Relationship map')});
 const status=top.createEl('small',{text:model.nodes.length+' '+writerUi('notas · ','notes · ')+model.edges.length+' '+writerUi('relações','links')});
 const search=top.createEl('input',{attr:{type:'search',placeholder:writerUi('Localizar nota…','Find note…')}});
 const zoom=top.createEl('select');
 for(const n of [50,75,100,125,150]){const option=zoom.createEl('option',{text:n+'%'});option.value=String(n);}
 zoom.value='100';
 const reset=top.createEl('button',{text:writerUi('Reorganizar','Reset layout')});
 reset.addEventListener('click',async()=>{cfg.positions={};await plugin.saveSettings();writerV107GraphRender(plugin,container);});
 const relate=top.createEl('button',{text:writerUi('Criar relação','Add relation')});
 relate.addEventListener('click',()=>writerV107GraphRelationModal(plugin,()=>writerV107GraphRender(plugin,container)));
 const scroll=container.createDiv({cls:'writer-v107-graph-scroll'});
 const svg=scroll.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 1100 760');svg.setAttribute('width','1100');svg.setAttribute('height','760');
 svg.setAttribute('role','img');svg.setAttribute('aria-label',writerUi('Mapa de notas relacionadas','Related-note graph'));
 scroll.appendChild(svg);
 if(!model.nodes.length){container.createEl('p',{text:writerUi('Marque notas com tags #personagem, #local, #cena ou adicione relações para criar um mapa.','Tag notes #character, #place or #scene to populate the map.')});return;}
 const ns='http://www.w3.org/2000/svg',node=(tag,attrs,parent=svg)=>{
  const el=svg.ownerDocument.createElementNS(ns,tag);
  for(const [k,v] of Object.entries(attrs||{}))el.setAttribute(k,String(v));parent.appendChild(el);return el;
 };
 const positions=writerV107GraphPositions(model,cfg),lines=[];
 for(const edge of model.edges){
  const path=node('line',{class:'writer-v107-graph-edge','stroke-width':1.5});
  lines.push({edge,path});
 }
 const dots=[];
 for(let i=0;i<model.nodes.length;i++){
  const item=model.nodes[i],g=node('g',{class:'writer-v107-graph-node',tabindex:0,role:'button','aria-label':item.title});
  node('circle',{r:24,class:'writer-v107-graph-circle'},g);
  const label=node('text',{'text-anchor':'middle',dy:40,class:'writer-v107-graph-label'},g);
  label.textContent=item.title.length>25?item.title.slice(0,22)+'…':item.title;
  const title=node('title',{},g);title.textContent=item.title+' · '+item.kind;
  const move=()=>g.setAttribute('transform','translate('+positions[i].x+' '+positions[i].y+')');move();
  let start=null,moved=false;
  g.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;start={x:event.clientX,y:event.clientY,initial:{...positions[i]}};
   moved=false;g.setPointerCapture?.(event.pointerId);event.preventDefault();
  });
  g.addEventListener('pointermove',event=>{
   if(!start)return;
   const scale=Number(zoom.value)/100;
   const dx=(event.clientX-start.x)/scale,dy=(event.clientY-start.y)/scale;
   if(Math.hypot(dx,dy)>3)moved=true;
   positions[i].x=Math.max(28,Math.min(1072,start.initial.x+dx));
   positions[i].y=Math.max(28,Math.min(732,start.initial.y+dy));
   move();redrawEdges();
  });
  g.addEventListener('pointerup',event=>{
   if(!start)return;start=null;
   if(moved){cfg.positions[item.source]={...positions[i]};void plugin.saveSettings();}
   else void plugin.app.workspace.getLeaf('tab').openFile(item.file);
  });
  g.addEventListener('keydown',event=>{if(event.key==='Enter')void plugin.app.workspace.getLeaf('tab').openFile(item.file);});
  dots.push(g);
 }
 function redrawEdges(){
  for(const {edge,path} of lines)for(const [k,v] of Object.entries({
   x1:positions[edge.from].x,y1:positions[edge.from].y,x2:positions[edge.to].x,y2:positions[edge.to].y
  }))path.setAttribute(k,String(v));
 }
 redrawEdges();
 const fit=()=>{svg.style.width=(1100*Number(zoom.value)/100)+'px';svg.style.height=(760*Number(zoom.value)/100)+'px';};
 zoom.addEventListener('change',fit);fit();
 search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase();
  dots.forEach((d,i)=>d.classList.toggle('is-dim',!!q&&!model.nodes[i].title.toLocaleLowerCase().includes(q)));
 });
}
function writerV107GraphRelationModal(plugin,refresh){
 const files=writerV107GraphBuild(plugin).nodes.map(n=>n.file);
 if(files.length<2){new Notice(writerUi('Precisa de pelo menos duas notas do compêndio.','At least two compendium notes required.'));return;}
 const modal=new Modal(plugin.app);modal.setTitle(writerUi('Criar relação','Create relationship'));
 modal.onOpen=()=>{
  const root=modal.contentEl;let a=files[0],b=files[1];
  const pick=(label,index,onChange)=>{
   new Setting(root).setName(label).addDropdown(drop=>{
    files.forEach((f,i)=>drop.addOption(String(i),f.basename));
    drop.setValue(String(index)).onChange(v=>onChange(files[Number(v)]));
   });
  };
  pick(writerUi('Origem','Source'),0,v=>{a=v;});
  pick(writerUi('Destino','Target'),1,v=>{b=v;});
  new Setting(root).addButton(btn=>btn.setButtonText(writerUi('Salvar relação','Save relation')).setCta().onClick(async()=>{
   if(a.path===b.path)return new Notice(writerUi('Escolha notas diferentes.','Choose different notes.'));
   btn.setDisabled(true);
   try{
    await plugin.writerSnapshots?.create?.(a,'Before relationship edit');
    await plugin.app.fileManager.processFrontMatter(a,fm=>{
     const links=writerV107GraphLinks(fm.relationships);
     const target='[['+b.basename+']]';
     if(!links.includes(b.basename))links.push(target);
     fm.relationships=links;
    });
    modal.close();refresh();
   }catch(e){new Notice(String(e.message||e));btn.setDisabled(false);}
  }));
 };
 modal.open();
}
class WriterV107GraphView extends ItemView{
 constructor(leaf,plugin){super(leaf);this.plugin=plugin;}
 getViewType(){return WRITER_V107_GRAPH_VIEW;}
 getDisplayText(){return writerUi('Mapa de relações','Relationship map');}
 getIcon(){return 'network';}
 async onOpen(){writerV107GraphRender(this.plugin,this.contentEl);}
}
function writerV107GraphRegister(plugin){
 writerV107GraphConfig(plugin.settings);
 plugin.registerView(WRITER_V107_GRAPH_VIEW,leaf=>new WriterV107GraphView(leaf,plugin));
 plugin.addCommand({id:'v107-story-graph',name:writerUi('Relações: abrir mapa','Relationships: open map'),callback:async()=>{
  const leaf=plugin.app.workspace.getLeavesOfType(WRITER_V107_GRAPH_VIEW)[0]||plugin.app.workspace.getLeaf('tab');
  await leaf.setViewState({type:WRITER_V107_GRAPH_VIEW,active:true});await plugin.app.workspace.revealLeaf(leaf);
 }});
}
function writerV107GraphSettings(plugin,panel){
 const cfg=plugin.settings.v107Graph;
 panel.createEl('h3',{text:writerUi('Mapa de relações','Relationship map')});
 new Setting(panel).setName(writerUi('Notas máximas no mapa','Maximum graph nodes')).addSlider(s=>s.setLimits(20,180,10).setValue(cfg.maxNodes).setDynamicTooltip().onChange(async v=>{cfg.maxNodes=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Layout inicial','Initial layout')).addDropdown(d=>d.addOption('radial',writerUi('Radial','Radial')).addOption('grid',writerUi('Grade','Grid')).setValue(cfg.layout).onChange(async v=>{cfg.layout=v;await plugin.saveSettings();}));
}
