'use strict';
/* v8.2: reader-only captions and narrative chats. Original implementation, no dependency on upstream plugins. */
/* Use one Unicode-safe sanitizer for initial settings and the live settings input.
 * Never double-escape regex character classes: /[\\r\\n]/ strips lowercase r and n. */
function writerV8HomeTitleClean(value){
 return String(value??'')
  .replace(/[\r\n\u2028\u2029]+/g,' ')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'')
  .slice(0,80);
}
const WRITER_V8_FINISH_DEFAULTS={captions:true,captionMax:180,homeAtStartup:false,homeOnNewTab:true,homeCleanStart:true,homeTitle:'',homeIcon:'book-open',homeIconImage:'',homeTitleColor:'',homeIconColor:'',homeFavorites:[],homeRecent:[],homeQuick:['','',''],homeWidgetSizes:{},homeOrder:['continue','calendar','books','soundscape','recent','favorites','quick','stats','activity','random','tags','goal','gallery','quotes','today','trash','reading','zotero','webBookmarks'],homeHidden:['activity','random','tags','goal','gallery','quotes','today','trash','reading','zotero','webBookmarks'],homeWordGoal:500,homeQuotes:'',homePresets:[],homeWebSearchEnabled:true,homeWebSearchEngine:'surfing',homeWebSearchTarget:'auto',homeWebBookmarks:[]};
function writerV8FinishMerge(settings){
 const old=settings.v8Finish&&typeof settings.v8Finish==='object'&&!Array.isArray(settings.v8Finish)?settings.v8Finish:{};
 const cfg=settings.v8Finish={...WRITER_V8_FINISH_DEFAULTS,...old};
 cfg.captions=cfg.captions!==false;cfg.homeAtStartup=cfg.homeAtStartup===true;
 cfg.homeOnNewTab=cfg.homeOnNewTab!==false;cfg.homeCleanStart=cfg.homeCleanStart!==false;
 cfg.homeTitle=writerV8HomeTitleClean(cfg.homeTitle);
 cfg.homeIconImage=String(cfg.homeIconImage||'').trim().slice(0,600);
 cfg.homeTitleColor=/^#[0-9a-f]{6}$/i.test(String(cfg.homeTitleColor||''))?String(cfg.homeTitleColor).toLowerCase():'';
 cfg.homeIconColor=/^#[0-9a-f]{6}$/i.test(String(cfg.homeIconColor||''))?String(cfg.homeIconColor).toLowerCase():'';
 cfg.homeIcon=typeof writerV8HomeIconName==='function'?writerV8HomeIconName(cfg.homeIcon):'book-open';
 cfg.captionMax=Math.max(32,Math.min(240,Math.floor(Number(cfg.captionMax)||180)));
 cfg.homeFavorites=Array.isArray(cfg.homeFavorites)?[...new Set(cfg.homeFavorites.filter(x=>typeof x==='string'&&x.length<=500))].slice(0,30):[];
 cfg.homeRecent=Array.isArray(cfg.homeRecent)?[...new Set(cfg.homeRecent.filter(x=>typeof x==='string'&&x.length<=500))].slice(0,16):[];
 cfg.homeQuick=Array.isArray(cfg.homeQuick)?Array.from({length:3},(_,i)=>String(cfg.homeQuick[i]||'').slice(0,12000)):['','',''];
 cfg.homeWidgetSizes=Object.fromEntries(Object.entries(cfg.homeWidgetSizes&&typeof cfg.homeWidgetSizes==='object'&&!Array.isArray(cfg.homeWidgetSizes)?cfg.homeWidgetSizes:{}).filter(([key,size])=>WRITER_V8_FINISH_DEFAULTS.homeOrder.includes(key)&&['compact','normal','wide'].includes(size)));
 const allowed=WRITER_V8_FINISH_DEFAULTS.homeOrder;
 const prevOrder=Array.isArray(old.homeOrder)?old.homeOrder.filter(key=>allowed.includes(key)):[];
 const requested=prevOrder.length?prevOrder:[...allowed];
 const index=requested.includes('calendar')?-1:requested.indexOf('continue');
 if(index>=0)requested.splice(index+1,0,'calendar');
 else if(!requested.includes('calendar'))requested.push('calendar');
 cfg.homeOrder=[...new Set([...requested,...allowed])];
 // New widgets are off by default for existing installs; user choices persist.
 const newWidgets=['gallery','quotes','today','trash','reading','zotero','webBookmarks'];
 cfg.homeHidden=Array.isArray(old.homeHidden)?
  [...new Set([...old.homeHidden.filter(key=>allowed.includes(key)),...newWidgets.filter(key=>!prevOrder.includes(key))])]:
  [...WRITER_V8_FINISH_DEFAULTS.homeHidden];
 // The Books widget was listed in settings but never rendered. Make it visible
 // once on upgrade, without resetting order or size preferences.
 if(old.homeWidgets108Migrated!==true){
  cfg.homeHidden=cfg.homeHidden.filter(key=>key!=='books');
  cfg.homeWidgets108Migrated=true;
 }
 cfg.homeWordGoal=Math.max(50,Math.min(20000,Math.round(Number(cfg.homeWordGoal)||500)));
 cfg.homeQuotes=String(cfg.homeQuotes||'').slice(0,12000);
 cfg.homeWebSearchEnabled=cfg.homeWebSearchEnabled!==false;
 cfg.homeWebSearchEngine=String(cfg.homeWebSearchEngine||'surfing').toLowerCase().slice(0,50);
 cfg.homeWebSearchTarget=['auto','surfing','webviewer','external'].includes(cfg.homeWebSearchTarget)?cfg.homeWebSearchTarget:'auto';
 const bookmarks=[],seenUrls=new Set(),seenIds=new Set();
 for(const rawBookmark of Array.isArray(cfg.homeWebBookmarks)?cfg.homeWebBookmarks.slice(0,100):[]){
  if(!rawBookmark||typeof rawBookmark!=='object')continue;
  const url=typeof writerV8HomeValidURL==='function'?writerV8HomeValidURL(rawBookmark.url):'';
  if(!url||seenUrls.has(url))continue;
  seenUrls.add(url);
  const title=String(rawBookmark.title||new URL(url).hostname).replace(/[\r\n\u0000-\u001f]/g,' ').trim().slice(0,70)||new URL(url).hostname;
  const icon=/^[a-z][a-z0-9-]{1,45}$/.test(rawBookmark.icon||'')?rawBookmark.icon:'globe';
  const group=String(rawBookmark.group||'').replace(/[\r\n\u0000-\u001f]/g,' ').trim().slice(0,40);
  let id=String(rawBookmark.id||'').replace(/[^a-z0-9_-]/gi,'').slice(0,65);
  if(!id||seenIds.has(id))id='web-'+(bookmarks.length+1)+'-'+url.length;
  seenIds.add(id);bookmarks.push({id,title,url,icon,group});
 }
 cfg.homeWebBookmarks=bookmarks;
 cfg.homePresets=(Array.isArray(cfg.homePresets)?cfg.homePresets:[]).slice(0,12).map(raw=>({
  name:String(raw?.name||'').trim().slice(0,60),
  order:Array.isArray(raw?.order)?[...new Set(raw.order.filter(key=>allowed.includes(key)))]:[],
  hidden:Array.isArray(raw?.hidden)?[...new Set(raw.hidden.filter(key=>allowed.includes(key)))]:[],
  sizes:Object.fromEntries(Object.entries(raw?.sizes&&typeof raw.sizes==='object'?raw.sizes:{})
   .filter(([key,size])=>allowed.includes(key)&&['compact','normal','wide'].includes(size)))
 })).filter(p=>p.name);
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
 let title='',groupImage='',start=0,options={density:'normal',bubbles:'soft',avatars:true,width:'normal',background:'default',bubbleColor:''};
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(!line){start=i+1;continue;}
  const heading=/^title:\s*(.+)$/i.exec(line);
  if(heading){title=heading[1].trim().slice(0,100);start=i+1;continue;}
  // Conversation image is independent from individual participants' avatars.
  const groupPhoto=/^(?:group[-_ ]?(?:image|photo|avatar)|title[-_ ]?image|chat[-_ ]?image):[ \t]*(.+)$/i.exec(line);
  if(groupPhoto){groupImage=groupPhoto[1].trim().slice(0,450);start=i+1;continue;}
  const opt=/^(density|bubbles|avatars|width|background|bubble-color|cor-balao):\s*(\S+)\s*$/i.exec(line);
  if(opt){
   const k=opt[1].toLowerCase(),value=opt[2].toLowerCase();
   if(k==='density'&&['compact','normal','relaxed'].includes(value))options.density=value;
   if(k==='bubbles'&&['soft','round','square'].includes(value))options.bubbles=value;
   if(k==='avatars'&&['on','off'].includes(value))options.avatars=value==='on';
   if(k==='width'&&['normal','wide'].includes(value))options.width=value;
    if(k==='background'&&['transparent','default','none'].includes(value))options.background=value==='none'?'transparent':value;
    if(['bubble-color','cor-balao'].includes(k)&&WRITER_V8_CHAT_COLORS.has(value))options.bubbleColor=value==='grey'?'gray':value;
   start=i+1;continue;
  }
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
    const profile=profiles.get(key)||{color:'',avatar:'',bubbleColor:''};
    const color=value.toLowerCase(),bubbleMatch=/^(?:bubble|balloon|bal[aã]o):\s*([a-z]+)$/i.exec(value);
    if(WRITER_V8_CHAT_COLORS.has(color))profile.color=color==='grey'?'gray':color;
    else if(/^(?:bubble|balloon|bal[aã]o):s*([a-z]+)$/i.test(value)){
     const named=bubbleMatch[1].toLowerCase();
     if(WRITER_V8_CHAT_COLORS.has(named))profile.bubbleColor=named==='grey'?'gray':named;
    }
    else if(/^(?:!?\[\[.+\]\]|[^<>:"|?*\r\n]+\.(?:png|jpe?g|webp|gif|svg|avif|bmp))$/i.test(value))
      profile.avatar=value.slice(0,450);
    profiles.set(key,profile);
   }
   start=i+1;continue;
  }
  break;
 }
 return {title,groupImage,defaults,profiles,start,options};
}
function writerV8ChatSplitFields(value){
 const parts=[];let current='',brackets=0,parentheses=0,codeTicks=0;
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
   else if(char==='(')parentheses++;
   else if(char===')')parentheses=Math.max(0,parentheses-1);
  }
  if(char==='|'&&brackets===0&&parentheses===0&&codeTicks===0){parts.push(current.trim());current='';}
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
 let avatar='',name='',body='',time='',explicitName=false;
 if(fields.length>=4){
  [avatar,name]=fields;explicitName=Boolean(name);
  time=fields[fields.length-1];
  body=fields.slice(2,-1).join(' | ');
 }else if(fields.length===3&&fields[0]===''){
  if(/^\d{1,2}:\d{2}(?::\d{2})?$/.test(fields[2])){
   name=meta.defaults[side]||lastSpeaker[side]||'';
   body=fields[1];time=fields[2];
  }else{
   name=fields[1];body=fields[2];explicitName=Boolean(name);
  }
 }else if(fields.length===3){
  [name,body,time]=fields;explicitName=Boolean(name);
 }else if(fields[0]===''){
  name=meta.defaults[side]||lastSpeaker[side]||'';
  body=fields[1];
 }else{
  [name,body]=fields;explicitName=Boolean(name);
 }
 name=(name||meta.defaults[side]||lastSpeaker[side]||'').slice(0,90);
 if(!body&&!avatar&&!name)return null;
 const profile=meta.profiles.get(writerV8ChatNameKey(name))||{};
 return {name,side,explicitName,time:String(time||'').slice(0,80),avatar:avatar||profile.avatar||'',
  color:profile.color||'',bubbleColor:profile.bubbleColor||'',body:String(body||'').slice(0,8000)};
}

/* Fake voice notes are illustrative animations: never open audio files or the microphone. */
function writerV8ChatFakeAudio(value){
 const raw=String(value||'').trim();
 // This is deliberately a fictional note, not audio recognition or playback.
 // Keep transcript content small and display it as plain text.
 if(raw.length>2400)return null;
 const match=/^\[(?:audio|voice|áudio):\s*(\d{1,2}:\d{2}(?::\d{2})?)(?::([\s\S]*))?\]$/i.exec(raw);
 if(!match)return null;
 const p=match[1].split(':').map(Number);
 if(p.at(-1)>59||(p.length===3&&(p[0]>2||p[1]>59)))return null;
 const seconds=p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1];
 if(seconds<=0||seconds>7200)return null;
 const transcript=match[2]===undefined?'':writerV8ChatExpandBreaks(match[2].trim());
 if(transcript.length>2000)return null;
 return {duration:match[1],seconds,transcript};
}
function writerV8ChatExpandBreaks(value){
 return String(value||'').replace(/(\\+)n/g,(_match,slashes)=>
  '\\'.repeat(Math.floor(slashes.length/2))+(slashes.length%2?'\n':'n'));
}
function writerV8ChatRenderFakeAudio(bubble,voice){
 const label=writerUi('Áudio falso: animação sem som ou gravação real','Fake voice note: animation without sound or recording');
 const player=bubble.createDiv({cls:'writer-v8-chat-fake-audio',attr:{role:'group','aria-label':label}});
 const button=player.createEl('button',{cls:'writer-v8-chat-voice-toggle',attr:{type:'button',title:label,'aria-pressed':'false'}});
 const wave=player.createDiv({cls:'writer-v8-chat-wave',attr:{'aria-hidden':'true'}});
 // Vary the fictional waveform per rendered message instead of repeating
 // the same nth-child pattern. This does not read or play audio.
 const heights=Array.from({length:24},()=>18+Math.floor(Math.random()*78));
 for(let i=0;i<heights.length;i++){
  const bar=wave.createSpan({cls:'writer-v8-chat-wave-bar'});
  if(bar?.style){
   bar.style.height=heights[i]+'%';
   bar.style.animationDelay=Math.floor(Math.random()*650)+'ms';
   bar.style.animationDuration=(600+Math.floor(Math.random()*500))+'ms';
  }
 }
 player.createSpan({cls:'writer-v8-chat-duration',text:voice.duration});
 const update=on=>{
  player.classList.toggle('is-animating',on);
  button.setAttribute('aria-pressed',String(on));
  button.setAttribute('aria-label',on?writerUi('Pausar animação fictícia','Pause fictional animation'):
   writerUi('Animar áudio fictício','Animate fictional voice note'));
  if(typeof setIcon==='function')setIcon(button,on?'pause':'play');
  else button.setText(on?'Ⅱ':'▶');
 };
 update(false);
 button.addEventListener('click',()=>update(!player.classList.contains('is-animating')));
 // No transcript is inferred or fetched: the author provides the text after
 // the duration. Plain text avoids executing arbitrary HTML from the vault.
 if(!voice.transcript)return;
 // The author-supplied fictional transcript is visible immediately.
 const body=player.createDiv({cls:'writer-v8-chat-transcript-text',
  attr:{role:'note','aria-label':writerUi('Transcrição escrita','Written transcript')}});
 body.setText(voice.transcript);
}
/* Standalone --- separates messages; --- label --- places text between rules. */
function writerV8ChatDivider(line){
 const match=/^[ \t]{0,3}---(?:[ \t]+([^\r\n]{1,120}?)[ \t]+---)?[ \t]*$/.exec(String(line||''));
 return match?{type:'divider',text:String(match[1]||'').trim().slice(0,120)}:null;
}
function writerV8ChatParseLegacy(source,meta){
 const sections=source.split(/^===\s+(.{1,90})\s*$/m),messages=[];
 for(let i=1;i+1<sections.length&&messages.length<100;i+=2){
  const name=sections[i].trim(),content=sections[i+1].trim();
  // The first bare --- is the legacy message header/body boundary; later
  // standalone dividers belong to the transcript, not the message text.
  const headerEnd=/^---[ \t]*$/m.exec(content);
  const header=headerEnd?content.slice(0,headerEnd.index):content;
  const textPart=headerEnd?content.slice(headerEnd.index+headerEnd[0].length).trim():content;
  const fields={};
  if(headerEnd)for(const line of header.split('\n')){
   const m=/^(avatar|image|time|side|mine|name|bubble):\s*(.*)$/i.exec(line.trim());
   if(m)fields[m[1].toLowerCase()]=m[2].trim().slice(0,500);
  }
  const side=fields.mine==='true'?'right':fields.side==='right'?'right':fields.side==='center'?'center':'left';
  const actualName=fields.name||name;
  const profile=meta.profiles.get(writerV8ChatNameKey(actualName))||{};
  const base={name:actualName,side,explicitName:true,time:fields.time||'',
   avatar:fields.avatar||fields.image||profile.avatar||'',color:profile.color||'',bubbleColor:WRITER_V8_CHAT_COLORS.has(String(fields.bubble||'').toLowerCase())?String(fields.bubble).toLowerCase():profile.bubbleColor||''};
  let body=[];const parts=[];
  for(const line of textPart.split('\n')){
   const divider=writerV8ChatDivider(line);
   if(divider){
    if(body.length){parts.push({...base,body:body.join('\n').trim().slice(0,8000)});body=[];}
    parts.push(divider);
   }else body.push(line);
  }
  if(body.length||!parts.length)parts.push({...base,body:body.join('\n').trim().slice(0,8000)});
  messages.push(...parts.slice(0,100-messages.length));
 }
 return {title:meta.title,groupImage:meta.groupImage,messages,options:meta.options};
}
function writerV8ChatParse(source){
 const raw=String(source||'');
 if(raw.length>32000)return null;
 const lines=raw.replace(/\r\n/g,'\n').split('\n');
 const meta=writerV8ChatDirectives(lines);
 const remaining=lines.slice(meta.start).join('\n');
 if(/^===\s+\S/.test(remaining.trimStart()))return writerV8ChatParseLegacy(remaining,meta);
 const messages=[],lastSpeaker={left:'',right:''};let messageCount=0;
 for(const line of lines.slice(meta.start)){
  const divider=writerV8ChatDivider(line);
  if(divider){
   if(messages.length&&messages.length<100)messages.push(divider);
   continue;
  }
  const message=writerV8ChatShortMessage(line,meta,lastSpeaker);
  if(message){
   if(messageCount>=50)break;
   messageCount++;
   if(message.name)lastSpeaker[message.side]=message.name;
   messages.push(message);continue;
  }
  // Multiline markdown stays inside the preceding bubble. A divider does not
  // become a bubble and must never absorb later unprefixed paragraphs.
  if(messages.length){
   const last=messages[messages.length-1];
   if(last.type!=='divider'&&last.body.length+line.length<8000)last.body+='\n'+line;
  }
 }
 for(const message of messages)if(message.type!=='divider')
  message.body=writerV8ChatExpandBreaks(message.body.trim());
 return {title:meta.title,groupImage:meta.groupImage,messages,options:meta.options};
}
function writerV8ChatRender(plugin,source,element,ctx){
 const data=writerV8ChatParse(source);
 const opts=data?.options||{density:'normal',bubbles:'soft',avatars:true,width:'normal',background:'default',bubbleColor:''};
 const root=element.createDiv({cls:'writer-v8-block writer-v8-chat is-density-'+opts.density+' is-bubbles-'+opts.bubbles+
  ' is-width-'+opts.width+' is-background-'+(opts.background==='transparent'?'transparent':'default')+
  (WRITER_V8_CHAT_COLORS.has(opts.bubbleColor)?' is-chat-bubble-'+opts.bubbleColor:'')});
 if(!data||!data.messages.length){root.createEl('p',{text:writerUi('Use < ou > e separe avatar, nome, mensagem e hora com |.','Use < or > with | to separate avatar, name, message and time.')});return;}
 if(data.title||data.groupImage){
  const heading=root.createDiv({cls:'writer-v8-chat-heading'});
  const url=writerV8ImagePath(plugin.app,data.groupImage,ctx.sourcePath);
  if(url)heading.createEl('img',{cls:'writer-v8-chat-group-photo',
   attr:{src:url,alt:data.title||writerUi('Imagem do grupo','Group photo'),loading:'lazy',decoding:'async'}});
  if(data.title)heading.createEl('h3',{text:data.title,cls:'writer-v8-chat-title'});
  if(!heading.childElementCount)heading.remove();
 }
 const transcript=root.createDiv({cls:'writer-v8-chat-transcript',attr:{role:'list','aria-label':writerUi('Conversa fictícia','Fictional conversation')}});
 let previous=null;
 for(const msg of data.messages){
  if(msg.type==='divider'){
   const divider=transcript.createDiv({cls:'writer-v8-chat-divider'+(msg.text?' is-labeled':''),
    attr:{role:'separator'}});
   if(msg.text)divider.createSpan({cls:'writer-v8-chat-divider-label',text:msg.text});
   // A divider breaks speaker grouping, even when the next message is from
   // the same person. Their avatar and explicit name can appear again.
   previous=null;
   continue;
  }
  const continuation=Boolean(previous&&msg.side===previous.side&&msg.name&&writerV8ChatNameKey(msg.name)===writerV8ChatNameKey(previous.name));
  const row=transcript.createDiv({cls:'writer-v8-chat-row'+(continuation?' is-continuation':'')+' is-'+msg.side+(WRITER_V8_CHAT_COLORS.has(msg.color)?' is-color-'+msg.color:'')+(WRITER_V8_CHAT_COLORS.has(msg.bubbleColor)?' is-bubble-color-'+msg.bubbleColor:''),attr:{role:'listitem'}});
  if(opts.avatars&&msg.avatar&&!continuation){
   const url=writerV8ImagePath(plugin.app,msg.avatar,ctx.sourcePath);
   if(url)row.createEl('img',{cls:'writer-v8-chat-avatar',attr:{src:url,alt:msg.name,loading:'lazy'}});
  }
  const group=row.createDiv({cls:'writer-v8-chat-group'});
  if((msg.explicitName&&!continuation&&msg.name)||msg.time){
   const headline=group.createDiv({cls:'writer-v8-chat-meta'});
   if(msg.explicitName&&!continuation&&msg.name)headline.createEl('strong',{text:msg.name.slice(0,90)});
   if(msg.time)headline.createEl('span',{text:msg.time});
  }
  const bubble=group.createDiv({cls:'writer-v8-chat-bubble'});
  const fakeAudio=writerV8ChatFakeAudio(msg.body);
  if(fakeAudio){bubble.classList.add('is-fake-audio');writerV8ChatRenderFakeAudio(bubble,fakeAudio);}
  else if(msg.body)void writerV8Markdown(plugin,ctx,bubble,msg.body).catch(error=>{
   console.warn('[Basic AI] chat Markdown:',error);
   bubble.empty();bubble.setText(msg.body);
  });
  previous=msg;
 }
}
function writerV8RegisterFinishBlocks(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor==='function')
  for(const type of ['chat','writer-chat'])plugin.registerMarkdownCodeBlockProcessor(type,(source,element,ctx)=>{
   if(!writerModuleOn(plugin,'fictionalChats')){element.createEl('pre',{text:source});return;}
   writerV8ChatRender(plugin,source,element,ctx);
  });
 writerV95RegisterTimelineBlocks(plugin);
 plugin.registerMarkdownPostProcessor?.((el)=>writerV8CaptionProcess(plugin,el));
}
