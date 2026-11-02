'use strict';
/* v8.2: reader-only captions and narrative chats. Original implementation, no dependency on upstream plugins. */
const WRITER_V8_FINISH_DEFAULTS={captions:true,captionMax:180,homeAtStartup:false,homeFavorites:[],homeRecent:[],homeQuick:['','',''],homeOrder:['continue','search','recent','favorites','quick','stats']};
function writerV8FinishMerge(settings){
 const old=settings.v8Finish&&typeof settings.v8Finish==='object'&&!Array.isArray(settings.v8Finish)?settings.v8Finish:{};
 const cfg=settings.v8Finish={...WRITER_V8_FINISH_DEFAULTS,...old};
 cfg.captions=cfg.captions!==false;cfg.homeAtStartup=cfg.homeAtStartup===true;
 cfg.captionMax=Math.max(32,Math.min(240,Math.floor(Number(cfg.captionMax)||180)));
 cfg.homeFavorites=Array.isArray(cfg.homeFavorites)?[...new Set(cfg.homeFavorites.filter(x=>typeof x==='string'&&x.length<=500))].slice(0,30):[];
 cfg.homeRecent=Array.isArray(cfg.homeRecent)?[...new Set(cfg.homeRecent.filter(x=>typeof x==='string'&&x.length<=500))].slice(0,16):[];
 cfg.homeQuick=Array.isArray(cfg.homeQuick)?Array.from({length:3},(_,i)=>String(cfg.homeQuick[i]||'').slice(0,12000)):['','',''];
 const allowed=WRITER_V8_FINISH_DEFAULTS.homeOrder;
 cfg.homeOrder=Array.isArray(cfg.homeOrder)?[...new Set(cfg.homeOrder.filter(x=>allowed.includes(x))),...allowed.filter(x=>!cfg.homeOrder.includes(x))]:[...allowed];
 return cfg;
}
function writerV8ParseCaption(raw,src){
 let text=String(raw||'').trim();
 if(!text||text===src)return '';
 const parts=text.split('|').map(s=>s.trim()).filter(Boolean);
 const filename=String(src||'').split(/[\\/]/).pop()||'';
 const ext=filename.match(/\.[^.]+$/)?.[0]||'';
 const clean=parts.filter(s=>!(/^(left|right|center|\d{1,4}(?:x\d{1,4})?)$/i.test(s)));
 let caption=clean.join(' | ').trim();
 if(!caption)return '';
 if(caption==='%')caption=filename.slice(0,filename.length-ext.length);
 else if(caption==='%.%')caption=filename;
 else if(caption==='\\%')caption='%';
 if(!['%','%.%','\\%'].includes(clean.join(' | ').trim())&&(caption===filename||caption===filename.slice(0,filename.length-ext.length)))return '';
 return caption;
}
function writerV8CaptionFromImage(img,max){
 const wrapper=img.closest?.('.image-embed, .internal-embed');
 const src=String(wrapper?.getAttribute?.('src')||img.getAttribute('src')||'').trim();
 let alt=String(wrapper?.getAttribute?.('alt')||img.getAttribute('alt')||'').trim();
 if(!alt||/^(?:https?:|app:)/i.test(alt))return '';
 const segments=src.split('/').pop()?.replace(/\?.*$/,'')||'';
 // Obsidian embeds can prefix the file path in the alt attribute.
 if(alt===src||alt===segments)return '';
 const normalized=alt.includes('|')&&alt.split('|')[0].match(/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i)
  ?alt.split('|').slice(1).join('|'):alt;
 return writerV8ParseCaption(normalized,src).slice(0,max);
}
function writerV8CaptionProcess(plugin,root){
 if(!writerModuleOn(plugin,'imageCaptions')||!plugin.settings.v8Finish?.captions)return;
 const plugins=plugin.app.plugins?.enabledPlugins;
 if(plugins?.has?.('image-captions')||plugins?.includes?.('image-captions'))return;
 if(!root?.querySelectorAll)return;
 for(const img of root.querySelectorAll('img')){
  if(img.closest('.writer-v8-block, .writer-v8-caption, figure.image-captions-figure, .writer-v8-home, .writer-v8-media-gallery'))continue;
  const parent=img.closest('.image-embed')||img.parentElement;
  if(!parent||parent.classList?.contains('is-resizing'))continue;
  if(img.dataset.writerV8Captioned==='1')continue;
  const caption=writerV8CaptionFromImage(img,plugin.settings.v8Finish.captionMax);
  if(!caption)continue;
  const desc=img.ownerDocument.createElement('span');
  desc.className='writer-v8-caption';desc.textContent=caption;
  desc.setAttribute('role','note');
  img.dataset.writerV8Captioned='1';
  // Never wrap/move the image: Obsidian's responsive image sizing must stay intact.
  if(parent.classList?.contains('image-embed'))parent.appendChild(desc);
  else img.insertAdjacentElement('afterend',desc);
 }
}
function writerV8ChatParse(source){
 const text=String(source||'');
 if(text.length>32000)return null;
 const sections=text.replace(/\r\n/g,'\n').split(/^===\s+(.{1,90})\s*$/m);
 const settings=sections[0].trim(),messages=[];
 let title='';
 for(const line of settings.split('\n')){
  const m=/^title:\s*(.*)$/i.exec(line);
  if(m)title=m[1].slice(0,100);
 }
 for(let i=1;i+1<sections.length&&messages.length<50;i+=2){
  const name=sections[i].trim(),body=sections[i+1].trim();
  const split=body.split(/^---\s*$/m),header=split[0],textPart=split.length>1?split.slice(1).join('---').trim():body;
  const fields={};
  if(split.length>1)for(const line of header.split('\n')){
   const m=/^(avatar|image|time|side|mine|name):\s*(.*)$/i.exec(line.trim());
   if(m)fields[m[1].toLowerCase()]=m[2].trim().slice(0,500);
  }
  const side=fields.mine==='true'?'right':fields.side==='right'?'right':fields.side==='center'?'center':'left';
  messages.push({name:fields.name||name,side,time:fields.time||'',avatar:fields.avatar||fields.image||'',body:textPart.slice(0,8000)});
 }
 return {title,messages};
}
function writerV8ChatRender(plugin,source,element,ctx){
 const data=writerV8ChatParse(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-chat'});
 if(!data||!data.messages.length){root.createEl('p',{text:writerUi('Adicione mensagens com === Nome, propriedades e ---.','Add messages using === Name, properties, and ---.')});return;}
 if(data.title)root.createEl('h3',{text:data.title,cls:'writer-v8-chat-title'});
 const transcript=root.createDiv({cls:'writer-v8-chat-transcript',attr:{role:'list','aria-label':writerUi('Conversa fictícia','Fictional conversation')}});
 for(const msg of data.messages){
  const row=transcript.createDiv({cls:'writer-v8-chat-row is-'+msg.side,attr:{role:'listitem'}});
  if(msg.avatar){
   const url=writerV8ImagePath(plugin.app,msg.avatar,ctx.sourcePath);
   if(url)row.createEl('img',{cls:'writer-v8-chat-avatar',attr:{src:url,alt:msg.name,loading:'lazy'}});
  }
  const group=row.createDiv({cls:'writer-v8-chat-group'});
  const headline=group.createDiv({cls:'writer-v8-chat-meta'});
  headline.createEl('strong',{text:msg.name.slice(0,90)});
  if(msg.time)headline.createEl('span',{text:msg.time});
  const bubble=group.createDiv({cls:'writer-v8-chat-bubble'});
  if(msg.body)void writerV8Markdown(plugin,ctx,bubble,msg.body).catch(error=>{
   console.warn('[Basic AI] chat Markdown:',error);
   bubble.empty();bubble.setText(msg.body);
  });
 }
}
function writerV8RegisterFinishBlocks(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor==='function')
  plugin.registerMarkdownCodeBlockProcessor('writer-chat',(source,element,ctx)=>{
   if(!writerModuleOn(plugin,'fictionalChats')){element.createEl('pre',{text:source});return;}
   writerV8ChatRender(plugin,source,element,ctx);
  });
 plugin.registerMarkdownPostProcessor?.((el)=>writerV8CaptionProcess(plugin,el));
}
