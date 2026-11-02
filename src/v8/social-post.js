'use strict';
/* Local fictional/social post cards. Counts are authored in Markdown, never live platform data. */
function writerV8SplitPost(source){
 const text=String(source||'');
 if(text.length>WRITER_V8_BLOCK_MAX)return null;
 const chunks=text.replace(/\r\n/g,'\n').split(/^===\s+reply\s*$/gmi);
 if(chunks.length>41)return null;
 const main=writerV8ReadCard(chunks[0]);
 if(!main)return null;
 const replies=chunks.slice(1).map(chunk=>{
  const data=writerV8ReadCard(chunk.replace(/^\n+/,''));
  if(!data)return null;
  const value=Number(data.fields.depth??data.fields.level??1);
  return {...data,depth:Number.isFinite(value)?Math.max(1,Math.min(5,Math.floor(value))):1};
 }).filter(Boolean);
 return {main,replies};
}
function writerV8PostCount(value){
 const number=Number(value);
 return Number.isFinite(number)&&number>=0?Math.min(Math.floor(number),999999999):0;
}
function writerV8PostIcon(host,name,fallback){
 const span=host.createSpan({cls:'writer-v8-social-icon'});
 try{const setIcon=require('obsidian').setIcon;if(typeof setIcon==='function'){setIcon(span,name);return;}}catch(_){}
 span.setText(fallback);
}
function writerV8RenderPost(plugin,source,element,ctx){
 const data=writerV8SplitPost(source);
 const root=element.createDiv({cls:'writer-v8-block writer-v8-social'});
 if(!data){root.createEl('p',{text:writerUi('Post muito longo ou inválido.','Post is too long or invalid.')});return;}
 const draw=(item,replyIndex,depth,parent=root)=>{
  const fields=item.fields||{};
  const post=parent.createDiv({cls:'writer-v8-social-post'+(replyIndex>=0?' is-reply is-depth-'+depth:'')});
  const heading=post.createDiv({cls:'writer-v8-social-heading'});
  const author=String(fields.author||fields.name||fields.nome||writerUi('Personagem','Character')).slice(0,100);
  const url=writerV8ImagePath(plugin.app,fields.avatar||fields.image,ctx.sourcePath);
  if(url)heading.createEl('img',{cls:'writer-v8-social-avatar',attr:{src:url,alt:author,loading:'lazy'}});
  else heading.createSpan({cls:'writer-v8-social-placeholder',text:author.slice(0,1).toUpperCase()});
  const labels=heading.createDiv({cls:'writer-v8-social-labels'});
  labels.createEl('strong',{text:author});
  const handle=String(fields.handle||fields.username||'').slice(0,80);
  const date=String(fields.date||fields.time||'').slice(0,80);
  if(handle||date)labels.createEl('span',{text:[handle,date].filter(Boolean).join(' · '),cls:'writer-v8-social-subtitle'});
  const content=post.createDiv({cls:'writer-v8-social-body'});
  if(item.body)void writerV8Markdown(plugin,ctx,content,item.body).catch(error=>console.warn('[Basic AI] social card:',error));
  const metrics=post.createDiv({cls:'writer-v8-social-metrics'});
  const counts=[['message-circle',replyIndex<0?(fields.comments===undefined?data.replies.length:writerV8PostCount(fields.comments)):writerV8PostCount(fields.comments),'💬'],
    ['flame',writerV8PostCount(fields.likes||fields.flames),'🔥'],
    ['eye',writerV8PostCount(fields.views),'◉']];
  for(const [icon,value,fallback] of counts){
   const stat=metrics.createSpan({cls:'writer-v8-social-stat',attr:{title:icon==='flame'?writerUi('Curtidas fictícias','Fictional reactions'):icon==='eye'?writerUi('Visualizações fictícias','Fictional views'):writerUi('Comentários fictícios','Fictional replies')}});
   writerV8PostIcon(stat,icon,fallback);stat.createSpan({text:String(value)});
  }
 };
 draw(data.main,-1,0);
 if(data.replies.length){
  const replies=root.createDiv({cls:'writer-v8-social-replies'});
  data.replies.forEach((reply,i)=>{
   draw(reply,i,reply.depth,replies);
  });
 }
}
function writerV8RegisterSocial(plugin){
 if(typeof plugin.registerMarkdownCodeBlockProcessor!=='function')return;
 plugin.registerMarkdownCodeBlockProcessor('writer-post',(source,element,ctx)=>{
  if(!writerModuleOn(plugin,'socialBlocks')){element.createEl('pre',{text:source});return;}
  writerV8RenderPost(plugin,source,element,ctx);
 });
}
