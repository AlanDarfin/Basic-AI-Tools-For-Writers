'use strict';
/* v10.2 built-in image search and insertion. Does not use third-party proxy.
 * Online queries are explicit; photo credits and licenses must be respected. */
const WRITER_V102_IMAGE_PROVIDERS=['commons','pexels','pixabay','unsplash'];
function writerV102ImagesMerge(settings){
 const raw=settings.v102Images&&typeof settings.v102Images==='object'?settings.v102Images:{};
 const cfg=settings.v102Images={enabled:true,provider:'commons',mode:'local',orientation:'any',
  folder:'Writing Images',width:420,property:'banner',credits:true,pexelsKey:'',pixabayKey:'',unsplashKey:'',...raw};
 cfg.provider=WRITER_V102_IMAGE_PROVIDERS.includes(cfg.provider)?cfg.provider:'commons';
 cfg.mode=['local','remote'].includes(cfg.mode)?cfg.mode:'local';
 cfg.orientation=['any','landscape','portrait','square'].includes(cfg.orientation)?cfg.orientation:'any';
 cfg.folder=String(cfg.folder||'Writing Images').split('/').filter(x=>x&&x!=='.'&&x!=='..')
  .map(x=>x.replace(/[\\:*?"<>|]/g,'').trim()).filter(Boolean).slice(0,6).join('/').slice(0,180)||'Writing Images';
 cfg.property=/^[A-Za-z_][\w-]{0,63}$/.test(String(cfg.property))?cfg.property:'banner';
 cfg.width=Math.max(0,Math.min(1600,Math.round(Number(cfg.width??420)||0)));
 for(const key of ['pexelsKey','pixabayKey','unsplashKey'])cfg[key]=String(cfg[key]||'').trim().slice(0,300);
 cfg.credits=cfg.credits!==false;
 return cfg;
}
function writerV102ImageSafeUrl(value){
 const raw=String(value||'');
 if(raw.length>2500||!/^https:\/\//i.test(raw))return '';
 try{
  const u=new URL(raw),host=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||u.port)return '';
  const hosts=['upload.wikimedia.org','images.pexels.com','images.unsplash.com','cdn.pixabay.com','pixabay.com','images.pixabay.com'];
  if(!hosts.includes(host))return '';
  return u.href;
 }catch(_){return '';}
}
function writerV102ImageClean(raw,max=180){
 return String(raw||'').replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max);
}
function writerV102ImageQuery(cfg,term,page){
 const query=encodeURIComponent(term.slice(0,180)),number=Math.max(1,Math.min(50,Number(page)||1)),orientation=cfg.orientation;
 if(cfg.provider==='pexels'){
  if(!cfg.pexelsKey)throw Error(writerUi('Informe a chave Pexels nas configurações.','Add your Pexels API key in settings.'));
  const url='https://api.pexels.com/v1/search?query='+query+'&page='+number+'&per_page=24'+
   (orientation==='any'?'':'&orientation='+orientation);
  return {url,headers:{Authorization:cfg.pexelsKey}};
 }
 if(cfg.provider==='pixabay'){
  if(!cfg.pixabayKey)throw Error(writerUi('Informe a chave Pixabay nas configurações.','Add your Pixabay API key in settings.'));
  const orientationMap={any:'all',landscape:'horizontal',portrait:'vertical',square:'all'};
  return {url:'https://pixabay.com/api/?key='+encodeURIComponent(cfg.pixabayKey)+'&q='+query+'&per_page=24&page='+number+
   '&safesearch=true&image_type=photo&orientation='+orientationMap[orientation],headers:{}};
 }
 if(cfg.provider==='unsplash'){
  if(!cfg.unsplashKey)throw Error(writerUi('Informe a chave Unsplash nas configurações.','Add your Unsplash API key in settings.'));
  return {url:'https://api.unsplash.com/search/photos?query='+query+'&page='+number+'&per_page=24'+
   (orientation==='any'?'':'&orientation='+(orientation==='square'?'squarish':orientation)),
   headers:{Authorization:'Client-ID '+cfg.unsplashKey,'Accept-Version':'v1'}};
 }
 return {url:'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch='+
  encodeURIComponent('filetype:bitmap '+term.slice(0,140))+'&gsrlimit=24&gsroffset='+(number-1)*24+
  '&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960&format=json',headers:{}};
}
function writerV102ImageNormalize(cfg,json){
 let raw=[];
 if(cfg.provider==='commons')raw=Object.values(json?.query?.pages||{}).map(page=>{
  const info=page?.imageinfo?.[0]||{},meta=info.extmetadata||{};
  const name=String(page.title||'').replace(/^File:/,'');
  if(!/\.(?:png|jpe?g|webp|gif)$/i.test(name))return null;
  return {url:info.thumburl||info.url,thumb:info.thumburl||info.url,title:name,
   author:writerV102ImageClean(meta.Artist?.value||''),license:writerV102ImageClean(meta.LicenseShortName?.value||''),
   page:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(String(page.title||'').replace(/ /g,'_'))};
 });
 if(cfg.provider==='pexels')raw=(json?.photos||[]).map(photo=>({url:photo?.src?.large||photo?.src?.original,
  thumb:photo?.src?.medium||photo?.src?.small,title:photo?.alt||'Photo',
  author:photo?.photographer||'',page:photo?.url||'',license:'Pexels'}));
 if(cfg.provider==='pixabay')raw=(json?.hits||[]).map(photo=>({url:photo?.largeImageURL||photo?.webformatURL,
  thumb:photo?.webformatURL||photo?.previewURL,title:photo?.tags||'Photo',
  author:photo?.user||'',page:photo?.pageURL||'',license:'Pixabay'}));
 if(cfg.provider==='unsplash')raw=(json?.results||[]).map(photo=>({url:photo?.urls?.regular,
  thumb:photo?.urls?.small,title:photo?.alt_description||photo?.description||'Photo',
  author:photo?.user?.name||'',page:photo?.links?.html||'',license:'Unsplash',
  downloadLocation:photo?.links?.download_location||''}));
 return raw.slice(0,24).filter(Boolean).map(row=>({
  url:writerV102ImageSafeUrl(row.url),thumb:writerV102ImageSafeUrl(row.thumb),
  title:writerV102ImageClean(row.title),author:writerV102ImageClean(row.author),
  license:writerV102ImageClean(row.license,70),page:String(row.page||'').slice(0,1200),
  downloadLocation:String(row.downloadLocation||'').slice(0,1200)
 })).filter(row=>row.url&&row.thumb);
}
async function writerV102ImageSearch(plugin,query,page=1){
 const cfg=plugin.settings.v102Images,request=require('obsidian').requestUrl;
 const options=writerV102ImageQuery(cfg,String(query||'').trim(),page);
 const response=await request({url:options.url,method:'GET',headers:options.headers,throw:false});
 if(response.status!==200)throw Error(writerUi('A busca falhou (HTTP ','Search failed (HTTP ')+response.status+').');
 const json=response.json||JSON.parse(response.text||'{}');
 return writerV102ImageNormalize(cfg,json);
}
function writerV102ImageExtension(bytes,mime=''){
 const arr=new Uint8Array(bytes);
 if(arr.length>=3&&arr[0]===0xff&&arr[1]===0xd8&&arr[2]===0xff)return '.jpg';
 if(arr.length>=8&&arr[0]===137&&arr[1]===80&&arr[2]===78&&arr[3]===71)return '.png';
 if(arr.length>=12&&String.fromCharCode(...arr.slice(0,4))==='RIFF'&&
  String.fromCharCode(...arr.slice(8,12))==='WEBP')return '.webp';
 if(arr.length>=6&&String.fromCharCode(...arr.slice(0,3))==='GIF')return '.gif';
 return '';
}
async function writerV102ImageDownload(plugin,image){
 const cfg=plugin.settings.v102Images,url=writerV102ImageSafeUrl(image.url);
 if(!url)throw Error('Unsafe image URL');
 const obs=require('obsidian');
 const response=await obs.requestUrl({url,method:'GET',throw:false});
 const bytes=response.arrayBuffer;
 if(response.status!==200||!bytes||bytes.byteLength>8*1024*1024||bytes.byteLength<20)throw Error(writerUi('A imagem é muito grande ou indisponível.','Image too large or unavailable.'));
 const ext=writerV102ImageExtension(bytes);
 if(!ext)throw Error(writerUi('A resposta não é uma imagem JPEG, PNG, GIF ou WebP.','Response is not a JPEG, PNG, GIF or WebP image.'));
 if(cfg.provider==='unsplash'&&/^https:\/\/api\.unsplash\.com\/photos\//.test(image.downloadLocation||'')){
  try{await obs.requestUrl({url:image.downloadLocation,headers:{Authorization:'Client-ID '+cfg.unsplashKey},throw:false});}catch(_){}
 }
 const folder=cfg.folder;
 let path='';
 for(const segment of folder.split('/')){
  path=path?path+'/'+segment:segment;
  if(!plugin.app.vault.getAbstractFileByPath(path))await plugin.app.vault.createFolder(path);
 }
 const clean=writerV102ImageClean(image.title||'image',60).replace(/[^\p{L}\p{N} _-]/gu,'').replace(/\s+/g,'-').slice(0,40)||'image';
 let filePath=folder+'/'+clean+ext,index=2;
 while(plugin.app.vault.getAbstractFileByPath(filePath))filePath=folder+'/'+clean+'-'+index+++ext;
 return plugin.app.vault.createBinary(filePath,bytes);
}
function writerV102ImageCredit(image){
 const author=writerV102ImageClean(image.author||'',80),platform=writerV102ImageClean(image.license||'',50);
 return author?(writerUi('Foto: ','Photo: ')+author+(platform?' · '+platform:'')):(platform||'');
}
async function writerV102ImageInsert(plugin,image,mode,file,editor){
 const cfg=plugin.settings.v102Images,local=cfg.mode==='local';
 const output=local?await writerV102ImageDownload(plugin,image):null;
 const value=local?output.path:writerV102ImageSafeUrl(image.url);
 if(!value)throw Error('Image URL unavailable');
 if(mode==='frontmatter'){
  if(!(file instanceof TFile)||file.extension!=='md')throw Error('No active Markdown file');
  await plugin.app.fileManager.processFrontMatter(file,fm=>{fm[cfg.property]=local?'[['+value+']]':value;});
 }else{
  if(!editor)throw Error('No active Markdown editor');
  const alt=writerV102ImageClean(image.title||'Image',90).replace(/[[\]()]/g,'');
  const size=cfg.width?'|'+cfg.width:'';
  const tag=local?'![['+value+size+']]':'!['+alt+size+']('+value+')';
  const credit=cfg.credits&&image.author?'\n\n*'+writerV102ImageCredit(image)+'*':'';
  editor.replaceSelection(tag+credit);
 }
 new Notice(writerUi('Imagem inserida.','Image inserted.'));
}
function writerV102ImageModal(plugin,mode='editor',file=null,editor=null){
 if(!plugin.settings.v102Images?.enabled)return;
 const modal=new Modal(plugin.app),cfg=plugin.settings.v102Images;
 modal.modalEl?.addClass('writer-v102-image-modal-host');
 let page=1,query='',result=[],loading=false;
 modal.setTitle(mode==='frontmatter'?writerUi('Escolher imagem do banner','Choose banner image'):writerUi('Inserir imagem','Insert image'));
 modal.onOpen=()=>{
  const root=modal.contentEl;root.empty();root.addClass('writer-v102-image-modal');
  const top=root.createDiv({cls:'writer-v102-image-tools'});
  const provider=top.createEl('select',{attr:{'aria-label':writerUi('Fonte das imagens','Image source')}});
  for(const [id,label] of [['commons','Wikimedia Commons'],['pexels','Pexels'],['pixabay','Pixabay'],['unsplash','Unsplash']]){
   const option=provider.createEl('option',{text:label});option.value=id;
  }
  provider.value=cfg.provider;provider.addEventListener('change',async()=>{cfg.provider=provider.value;page=1;await plugin.saveSettings();if(query)void search();});
  const orientation=top.createEl('select',{attr:{'aria-label':writerUi('Orientação','Orientation')}});
  for(const [id,pt,en] of [['any','Todas','Any'],['landscape','Horizontal','Landscape'],['portrait','Vertical','Portrait'],['square','Quadrada','Square']]){
   const option=orientation.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  orientation.value=cfg.orientation;orientation.addEventListener('change',async()=>{cfg.orientation=orientation.value;page=1;await plugin.saveSettings();if(query)void search();});
  const insert=top.createEl('select',{attr:{'aria-label':writerUi('Modo de inserção','Insertion mode')}});
  for(const [id,pt,en] of [['local','Salvar no cofre','Save to vault'],['remote','Usar URL','Use URL']]){
   const option=insert.createEl('option',{text:writerUi(pt,en)});option.value=id;
  }
  insert.value=cfg.mode;insert.addEventListener('change',async()=>{cfg.mode=insert.value;await plugin.saveSettings();});
  const searchBar=root.createDiv({cls:'writer-v102-image-search'});
  const input=searchBar.createEl('input',{attr:{type:'search',placeholder:writerUi('Buscar fotos…','Search photos…'),'aria-label':writerUi('Buscar imagens','Search images')}});
  const go=searchBar.createEl('button',{text:writerUi('Buscar','Search'),attr:{type:'button'}});
  const status=root.createEl('p',{cls:'writer-v102-image-status',text:writerUi('Wikimedia Commons funciona sem chave. Outros serviços precisam da sua própria API key.','Wikimedia Commons works without a key. Other sources need your own API key.')});
  const grid=root.createDiv({cls:'writer-v102-image-grid'});
  const pages=root.createDiv({cls:'writer-v102-image-pages'});
  const draw=()=>{
   grid.empty();pages.empty();
   for(const item of result){
    const button=grid.createEl('button',{cls:'writer-v102-image-result',attr:{type:'button',title:writerV102ImageCredit(item)||item.title}});
    button.createEl('img',{attr:{src:item.thumb,alt:item.title,loading:'lazy',decoding:'async'}});
    button.createEl('small',{text:writerV102ImageCredit(item)||item.title});
    button.addEventListener('click',async()=>{
     if(loading)return;
     loading=true;button.disabled=true;
     status.setText(writerUi('Inserindo imagem…','Inserting image…'));
     try{await writerV102ImageInsert(plugin,item,mode,file,editor);modal.close();}
     catch(error){status.setText(String(error.message||error));}
     finally{loading=false;button.disabled=false;}
    });
   }
   if(result.length){
    const previous=pages.createEl('button',{text:writerUi('Anterior','Previous'),attr:{type:'button'}});previous.disabled=page===1;
    previous.addEventListener('click',()=>{page=Math.max(1,page-1);void search();});
    pages.createSpan({text:writerUi('Página ','Page ')+page});
    const next=pages.createEl('button',{text:writerUi('Próxima','Next'),attr:{type:'button'}});
    next.disabled=result.length<20;
    next.addEventListener('click',()=>{page++;void search();});
   }
  };
  const search=async()=>{
   if(loading)return;
   query=input.value.trim().slice(0,180);
   if(!query){status.setText(writerUi('Digite algo para pesquisar.','Enter a search phrase.'));return;}
   loading=true;go.disabled=true;grid.empty();
   status.setText(writerUi('Pesquisando…','Searching…'));
   try{
    result=await writerV102ImageSearch(plugin,query,page);
    status.setText(result.length?result.length+' '+writerUi('resultados · toque para inserir','results · tap to insert'):
     writerUi('Nenhuma foto encontrada.','No photos found.'));
    draw();
   }catch(error){status.setText(String(error.message||error));result=[];draw();}
   finally{loading=false;go.disabled=false;}
  };
  go.addEventListener('click',()=>{page=1;void search();});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();page=1;void search();}});
  input.focus();
 };
 modal.open();
}
function writerV102ImagesRegister(plugin){
 plugin.addCommand({id:'v102-image-insert',name:writerUi('Imagens: pesquisar e inserir no editor','Images: search and insert into editor'),
  editorCallback:(editor,view)=>writerV102ImageModal(plugin,'editor',view.file,editor)});
 plugin.addCommand({id:'v102-image-frontmatter',name:writerUi('Imagens: pesquisar e definir banner/propriedade','Images: search and set banner/property'),
  callback:()=>{
   const file=plugin.app.workspace.getActiveFile?.();
   if(file instanceof TFile&&file.extension==='md')writerV102ImageModal(plugin,'frontmatter',file);
   else new Notice(writerUi('Abra uma nota Markdown primeiro.','Open a Markdown note first.'));
  }});
}
function writerV102ImagesSettings(plugin,panel){
 const cfg=plugin.settings.v102Images;
 panel.createEl('h3',{text:writerUi('Pesquisar e inserir imagens','Search and insert images')});
 panel.createEl('p',{cls:'setting-item-description',text:writerUi('Baseado nas ideias do Image Inserter, com buscas diretas aos serviços, sem proxy de terceiros. Buscas e miniaturas exigem rede e podem expor sua consulta e IP ao provedor. Verifique as licenças antes de reutilizar imagens.','Image Inserter-inspired, with direct provider requests and no third-party proxy. Searching and thumbnails use the internet and reveal queries/IP to providers. Check image licenses before reuse.')});
 new Setting(panel).setName(writerUi('Ativar busca de imagens','Enable image search'))
  .addToggle(t=>t.setValue(cfg.enabled).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Fonte padrão','Default provider')).addDropdown(d=>{
  for(const id of WRITER_V102_IMAGE_PROVIDERS)d.addOption(id,id==='commons'?'Wikimedia Commons':id[0].toUpperCase()+id.slice(1));
  d.setValue(cfg.provider).onChange(async v=>{cfg.provider=v;await plugin.saveSettings();});
 });
 new Setting(panel).setName(writerUi('Inserir como','Insert as')).addDropdown(d=>
  d.addOption('local',writerUi('Arquivo no cofre','Vault attachment')).addOption('remote','HTTPS URL')
   .setValue(cfg.mode).onChange(async v=>{cfg.mode=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Pasta dos downloads','Downloaded images folder'))
  .addText(t=>t.setValue(cfg.folder).onChange(async v=>{cfg.folder=v;writerV102ImagesMerge(plugin.settings);await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Propriedade para imagem (ex.: banner)','Image property (e.g. banner)'))
  .addText(t=>t.setValue(cfg.property).onChange(async v=>{cfg.property=/^[A-Za-z_][\w-]{0,63}$/.test(v)?v:'banner';await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Largura inserida (0 = original)','Inserted width (0 = original)'))
  .addSlider(sl=>sl.setLimits(0,1600,20).setDynamicTooltip().setValue(cfg.width)
   .onChange(async v=>{cfg.width=v;await plugin.saveSettings();}));
 new Setting(panel).setName(writerUi('Incluir crédito no Markdown','Include attribution in Markdown'))
  .addToggle(t=>t.setValue(cfg.credits).onChange(async v=>{cfg.credits=v;await plugin.saveSettings();}));
 for(const [key,name,link] of [['pexelsKey','Pexels','https://www.pexels.com/api/'],
  ['pixabayKey','Pixabay','https://pixabay.com/api/docs/'],['unsplashKey','Unsplash','https://unsplash.com/developers']]){
  new Setting(panel).setName(name+' API key')
   .setDesc(writerUi('Guardada nas configurações locais do plugin; não é criptografada.','Stored in local plugin settings; not encrypted.'))
   .addText(t=>{t.inputEl.type='password';t.setValue(cfg[key]).onChange(async v=>{cfg[key]=String(v).trim().slice(0,300);await plugin.saveSettings();});});
 }
 new Setting(panel).setName(writerUi('Abrir buscador de imagens','Open image search'))
  .addButton(btn=>btn.setButtonText(writerUi('Pesquisar','Search')).onClick(()=>{
   const view=plugin.app.workspace.getActiveViewOfType?.(require('obsidian').MarkdownView);
   if(view?.editor)writerV102ImageModal(plugin,'editor',view.file,view.editor);
   else new Notice(writerUi('Abra uma nota no editor.','Open a note in the editor.'));
  }));
}
