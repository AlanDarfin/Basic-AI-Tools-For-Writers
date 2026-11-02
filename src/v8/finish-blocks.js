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
const WRITER_V8_CHAT_COLORS=new Set(['red','orange','yellow','green','blue','purple','pink','cyan','gray','grey','accent']);
function writerV8ChatNameKey(name){
 return String(name||'').trim().toLocaleLowerCase();
}
function writerV8ChatDirectives(lines){
 const profiles=new Map(),defaults={left:'',right:''};
 let title='',start=0;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(!line){start=i+1;continue;}
  const heading=/^title:\s*(.+)$/i.exec(line);
  if(heading){title=heading[1].trim().slice(0,100);start=i+1;continue;}
  if(line.startsWith('[')&&line.endsWith(']')){
   const contents=line.slice(1,-1);
   const parts=[];let fragment='',brackets=0;
   for(let j=0;j<contents.length;j++){
    const c=contents[j];
    if(c==='[')brackets++;
    if(c===']')brackets=Math.max(0,brackets-1);
    if(c===','&&!brackets){parts.push(fragment);fragment='';}
    else fragment+=c;
   }
   parts.push(fragment);
   let valid=true;
   for(const raw of parts){
    const entry=/^([^=\n]{1,100})=(.{1,450})$/.exec(raw.trim());
    if(!entry||!entry[1].trim()||!entry[2].trim()){valid=false;break;}
   }
   if(!valid)break;
   for(const raw of parts){
    const pivot=raw.indexOf('='),name=raw.slice(0,pivot).trim(),value=raw.slice(pivot+1).trim();
    const key=writerV8ChatNameKey(name);
    if(key==='left'||key==='right'){defaults[key]=value.slice(0,90);continue;}
    const profile=profiles.get(key)||{color:'',avatar:''};
    const color=value.toLowerCase();
    if(WRITER_V8_CHAT_COLORS.has(color))profile.color=color==='grey'?'gray':color;
    else if(/^(?:!?\[\[.+\]\]|[^<>:"|?*\r\n]+\.(?:png|jpe?g|webp|gif|svg|avif|bmp))$/i.test(value))
      profile.avatar=value.slice(0,450);
    profiles.set(key,profile);
   }
   start=i+1;continue;
  }
  break;
 }
 return {title,defaults,profiles,start};
}
function writerV8ChatSplitFields(value){
 const parts=[];let current='',brackets=0,codeTicks=0;
 const input=String(value||'');
 for(let i=0;i<input.length;i++){
  const char=input[i];
  if(char==='\\'&&i+1<input.length){current+=char+input[++i];continue;}
  if(char==='\x60'){
   let run=1;while(input[i+run]==='\x60')run++;
   if(codeTicks===0)codeTicks=run;
   else if(codeTicks===run)codeTicks=0;
   current+='\x60'.repeat(run);i+=run-1;continue;
  }
  if(!codeTicks){
   if(char==='[')brackets++;
   else if(char===']')brackets=Math.max(0,brackets-1);
  }
  if(char==='|'&&brackets===0&&codeTicks===0){parts.push(current.trim());current='';}
  else current+=char;
 }
 parts.push(current.trim());
 return parts;
}
function writerV8ChatShortMessage(line,meta,lastSpeaker){
 const entry=/^\s{0,3}([<>])\s*(.*)$/.exec(line);
 if(!entry||!entry[2].includes('|'))return null;
 const side=entry[1]==='<'?'left':'right';
 const fields=writerV8ChatSplitFields(entry[2]);
 if(fields.length<2)return null;
 let avatar='',name='',body='',time='';
 if(fields.length>=4){
  [avatar,name]=fields;
  time=fields[fields.length-1];
  body=fields.slice(2,-1).join(' | ');
 }else if(fields.length===3&&fields[0]===''){
  name=meta.defaults[side]||lastSpeaker[side]||'';
  body=fields[1];time=fields[2];
 }else if(fields.length===3){
  [name,body,time]=fields;
 }else if(fields[0]===''){
  name=meta.defaults[side]||lastSpeaker[side]||'';
  body=fields[1];
 }else{
  [name,body]=fields;
 }
 name=(name||meta.defaults[side]||lastSpeaker[side]||'').slice(0,90);
 if(!body&&!avatar&&!name)return null;
 const profile=meta.profiles.get(writerV8ChatNameKey(name))||{};
 return {name,side,time:String(time||'').slice(0,80),avatar:avatar||profile.avatar||'',
  color:profile.color||'',body:String(body||'').slice(0,8000)};
}
function writerV8ChatParseLegacy(source,meta){
 const sections=source.split(/^===\s+(.{1,90})\s*$/m),messages=[];
 for(let i=1;i+1<sections.length&&messages.length<50;i+=2){
  const name=sections[i].trim(),content=sections[i+1].trim();
  const split=content.split(/^---\s*$/m),header=split[0],textPart=split.length>1?split.slice(1).join('---').trim():content;
  const fields={};
  if(split.length>1)for(const line of header.split('\n')){
   const m=/^(avatar|image|time|side|mine|name):\s*(.*)$/i.exec(line.trim());
   if(m)fields[m[1].toLowerCase()]=m[2].trim().slice(0,500);
  }
  const side=fields.mine==='true'?'right':fields.side==='right'?'right':fields.side==='center'?'center':'left';
  const actualName=fields.name||name;
  const profile=meta.profiles.get(writerV8ChatNameKey(actualName))||{};
  messages.push({name:actualName,side,time:fields.time||'',
    avatar:fields.avatar||fields.image||profile.avatar||'',color:profile.color||'',
    body:textPart.slice(0,8000)});
 }
 return {title:meta.title,messages};
}
function writerV8ChatParse(source){
 const raw=String(source||'');
 if(raw.length>32000)return null;
 const lines=raw.replace(/\r\n/g,'\n').split('\n');
 const meta=writerV8ChatDirectives(lines);
 const remaining=lines.slice(meta.start).join('\n');
 if(/^\s*===\s+\S/m.test(remaining))return writerV8ChatParseLegacy(remaining,meta);
 const messages=[],lastSpeaker={left:'',right:''};
 for(const line of lines.slice(meta.start)){
  const message=writerV8ChatShortMessage(line,meta,lastSpeaker);
  if(message){
   if(messages.length>=50)break;
   if(message.name)lastSpeaker[message.side]=message.name;
   messages.push(message);continue;
  }
  // Non-message lines belong to the previous bubble: lists, images, links and
  // extended Markdown must be passed verbatim to Obsidian's renderer.
  if(messages.length){
   const last=messages[messages.length-1];
   if(last.body.length+line.length<8000)last.body+='\n'+line;
  }
 }
 for(const message of messages)message.body=message.body.trim();
 return {title:meta.title,messages};
}
function writerV8ChatRender(plugin,source,element,ctx){
 const data=writerV8ChatParse(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-chat'});
 if(!data||!data.messages.length){root.createEl('p',{text:writerUi('Use < ou > e separe avatar, nome, mensagem e hora com |.','Use < or > with | to separate avatar, name, message and time.')});return;}
 if(data.title)root.createEl('h3',{text:data.title,cls:'writer-v8-chat-title'});
 const transcript=root.createDiv({cls:'writer-v8-chat-transcript',attr:{role:'list','aria-label':writerUi('Conversa fictícia','Fictional conversation')}});
 for(const msg of data.messages){
  const row=transcript.createDiv({cls:'writer-v8-chat-row is-'+msg.side+(WRITER_V8_CHAT_COLORS.has(msg.color)?' is-color-'+msg.color:''),attr:{role:'listitem'}});
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
