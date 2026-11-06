'use strict';
/* Basic v12 visual annotation: locally save a NEW PNG; originals untouched.
 * No remote image capture, no network, no image libraries. */
function writerV12AnnotationConfig(plugin){
 const value=plugin.settings.v12Annotations;
 return plugin.settings.v12Annotations={maxDimension:1400,desktopOnly:false,
  ...(value&&typeof value==='object'&&!Array.isArray(value)?value:{})};
}
function writerV12AnnotatePick(plugin){
 if(!writerV12On(plugin,'imageTools'))return;
 if(plugin.app.isMobile&&writerV12AnnotationConfig(plugin).desktopOnly){
  new Notice(writerUi('Anotações desativadas no celular.','Annotation disabled on mobile.'));return;
 }
 const images=plugin.app.vault.getFiles().filter(file=>/^(png|jpe?g|webp)$/i.test(file.extension)).slice(0,1200);
 if(!images.length){new Notice(writerUi('Não há imagens locais PNG, JPEG ou WebP.','No PNG, JPEG or WebP images found.'));return;}
 class Picker extends FuzzySuggestModal{
  getItems(){return images;}
  getItemText(file){return file.path;}
  onChooseItem(file){writerV12AnnotateImage(plugin,file);}
 }
 const picker=new Picker(plugin.app);
 picker.setPlaceholder(writerUi('Escolha uma imagem para anotar','Choose image to annotate'));
 picker.open();
}
function writerV12AnnotateImage(plugin,file){
 const modal=new Modal(plugin.app);
 modal.setTitle(writerUi('Anotar imagem · salvar cópia','Annotate image · save a copy'));
 const panel=modal.contentEl;
 panel.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Pinte sobre a imagem. O arquivo original não será alterado. A anotação será um novo PNG.',
  'Draw over the image. The original is untouched. Annotations are saved as a new PNG.')});
 const controls=panel.createDiv({cls:'modal-button-container'});
 const mode=controls.createEl('select',{attr:{'aria-label':writerUi('Ferramenta','Drawing tool')}});
 for(const [type,pt,en] of [
  ['pen','Caneta','Pen'],['arrow','Seta','Arrow'],['rect','Retângulo','Rectangle'],
  ['redact','Ocultar região','Cover region'],['text','Texto','Text']
 ])mode.createEl('option',{text:writerUi(pt,en),attr:{value:type}});
 const color=controls.createEl('input',{attr:{type:'color',value:'#ff4b4b','aria-label':writerUi('Cor','Color')}});
 const text=controls.createEl('input',{attr:{type:'text',maxlength:'120',placeholder:writerUi('Texto da anotação','Annotation text')}});
 text.style.maxWidth='155px';
 const undo=controls.createEl('button',{text:writerUi('Desfazer','Undo'),attr:{type:'button'}});
 const canvas=panel.createEl('canvas',{attr:{'aria-label':writerUi('Área de anotação','Image annotation area')}});
 canvas.style.cssText='max-width:100%;width:100%;height:auto;border:1px solid var(--background-modifier-border);touch-action:none;cursor:crosshair;';
 const status=panel.createEl('p',{cls:'setting-item-description'});
 const ctx=canvas.getContext('2d');
 if(!ctx){status.setText(writerUi('Canvas indisponível.','Canvas not available.'));modal.open();return;}
 const source=new (panel.ownerDocument.defaultView.Image)();
 const shapes=[];let drawing=false,draft=null,loaded=false;
 const point=event=>{
  const r=canvas.getBoundingClientRect();
  return {x:Math.max(0,Math.min(canvas.width,(event.clientX-r.left)*canvas.width/(r.width||1))),
   y:Math.max(0,Math.min(canvas.height,(event.clientY-r.top)*canvas.height/(r.height||1)))};
 };
 const paint=s=>{
  const {a,b,type,stroke,points,label}=s;
  ctx.lineWidth=Math.max(2,canvas.width/400);ctx.strokeStyle=stroke;ctx.fillStyle=stroke;
  ctx.lineJoin='round';ctx.lineCap='round';
  if(type==='pen'){
   ctx.beginPath();ctx.moveTo(a.x,a.y);
   for(const p of points||[])ctx.lineTo(p.x,p.y);
   ctx.stroke();
  }else if(type==='text'){
   ctx.font=Math.max(15,Math.floor(canvas.width/35))+'px sans-serif';
   ctx.fillText(label||'',a.x,a.y,canvas.width-a.x);
  }else if(type==='rect'||type==='redact'){
   const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
   if(type==='redact'){ctx.fillStyle='#151515';ctx.fillRect(x,y,w,h);}
   else ctx.strokeRect(x,y,w,h);
  }else if(type==='arrow'){
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   const theta=Math.atan2(b.y-a.y,b.x-a.x),size=Math.max(10,canvas.width/60);
   ctx.beginPath();ctx.moveTo(b.x,b.y);
   ctx.lineTo(b.x-size*Math.cos(theta-.5),b.y-size*Math.sin(theta-.5));
   ctx.moveTo(b.x,b.y);
   ctx.lineTo(b.x-size*Math.cos(theta+.5),b.y-size*Math.sin(theta+.5));ctx.stroke();
  }
 };
 const redraw=()=>{
  if(!loaded)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(source,0,0,canvas.width,canvas.height);
  for(const shape of shapes)paint(shape);
  if(draft)paint(draft);
 };
 source.onload=()=>{
  const max=Math.max(500,Math.min(1800,Number(writerV12AnnotationConfig(plugin).maxDimension)||1400));
  const scale=Math.min(1,max/Math.max(source.naturalWidth,source.naturalHeight));
  canvas.width=Math.max(1,Math.floor(source.naturalWidth*scale));
  canvas.height=Math.max(1,Math.floor(source.naturalHeight*scale));
  loaded=true;status.setText(source.naturalWidth+' × '+source.naturalHeight+
   (scale<1?writerUi(' · cópia reduzida',' · resized output'):''));
  redraw();
 };
 source.onerror=()=>status.setText(writerUi('Não foi possível abrir a imagem.','Could not load the image.'));
 source.src=plugin.app.vault.getResourcePath(file);
 canvas.addEventListener('pointerdown',e=>{
  if(!loaded||shapes.length>=100)return;
  e.preventDefault();
  const a=point(e),type=mode.value;
  if(type==='text'){
   if(!text.value.trim())return;
   shapes.push({type,a,b:a,label:text.value.trim().slice(0,120),stroke:color.value});
   redraw();return;
  }
  draft={type,a,b:a,points:[a],stroke:color.value};
  drawing=true;canvas.setPointerCapture?.(e.pointerId);redraw();
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drawing||!draft)return;
  e.preventDefault();draft.b=point(e);
  if(draft.type==='pen'&&draft.points.length<1500)draft.points.push(draft.b);
  redraw();
 });
 canvas.addEventListener('pointerup',e=>{
  if(!drawing||!draft)return;
  e.preventDefault();draft.b=point(e);
  if(draft.type==='pen'&&draft.points.length<1500)draft.points.push(draft.b);
  shapes.push(draft);draft=null;drawing=false;redraw();
 });
 canvas.addEventListener('pointercancel',()=>{draft=null;drawing=false;redraw();});
 undo.addEventListener('click',()=>{shapes.pop();redraw();});
 new Setting(panel).addButton(b=>b.setButtonText(writerUi('Salvar novo PNG','Save new PNG')).setCta().onClick(async()=>{
  if(!loaded||!shapes.length){new Notice(writerUi('Faça uma anotação antes.','Add an annotation first.'));return;}
  b.setDisabled(true);
  try{
   const vault=plugin.app.vault,folder='Basic Annotations';
   if(!vault.getAbstractFileByPath(folder))await vault.createFolder(folder);
   const name=writerV12SafeName(file.basename)+'-annotated';
   let path=folder+'/'+name+'.png',i=2;
   while(vault.getAbstractFileByPath(path))path=folder+'/'+name+'-'+i+++'.png';
   const data=canvas.toDataURL('image/png').split(',')[1];
   if(!data)throw Error('PNG encoding failed');
   const decoded=atob(data),bytes=new Uint8Array(decoded.length);
   for(let j=0;j<decoded.length;j++)bytes[j]=decoded.charCodeAt(j);
   const result=await vault.createBinary(path,bytes.buffer);
   modal.close();
   new Notice(writerUi('Imagem salva: ','Image saved: ')+result.path);
  }catch(err){status.setText(writerUi('Erro ao salvar: ','Save failed: ')+String(err.message||err));}
  finally{b.setDisabled(false);}
 }));
 modal.open();
}
function writerV12AnnotationRegister(plugin){
 plugin.addCommand({id:'v12-annotate-image',name:writerUi('Imagens: anotar nova cópia PNG','Images: annotate a new PNG copy'),
  callback:()=>writerV12AnnotatePick(plugin)});
}
function writerV12AnnotationSettings(plugin,panel){
 const cfg=writerV12AnnotationConfig(plugin);
 panel.createEl('h3',{text:writerUi('Anotações visuais · v12','Image annotations · v12')});
 new Setting(panel).setName(writerUi('Maior dimensão da imagem exportada','Maximum PNG output dimension'))
  .addSlider(s=>s.setLimits(600,1800,100).setValue(cfg.maxDimension).setDynamicTooltip().onChange(async v=>{
   cfg.maxDimension=v;await plugin.saveSettings();
  }));
 new Setting(panel).setName(writerUi('Desativar anotação no Android','Disable annotation on Android'))
  .addToggle(t=>t.setValue(cfg.desktopOnly===true).onChange(async v=>{cfg.desktopOnly=v;await plugin.saveSettings();}));
}
