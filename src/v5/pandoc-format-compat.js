'use strict';
/* Export Basic paragraph attributes and text marks to Pandoc-native Markdown.
 * Original vault notes and fenced/inline code are never modified. */
const WRITER_PANDOC_EXPORT_CSS=".basic-export-paragraph.basic-export-left>p{text-align:left}\n.basic-export-paragraph.basic-export-center>p{text-align:center}\n.basic-export-paragraph.basic-export-right>p{text-align:right}\n.basic-export-paragraph.basic-export-justify>p{text-align:justify;hyphens:auto}\n.basic-export-paragraph.basic-export-dropcap>p{text-indent:0}\n.basic-export-paragraph.basic-export-dropcap>p::first-letter{float:left;font-size:3.15em;line-height:.84;font-weight:700;margin:.08em .12em .02em 0}\n.basic-export-underline{text-decoration:underline}\n.basic-export-spoiler{border-bottom:1px dotted currentColor}\n.basic-export-highlight{background:#ffe49c}\n.basic-export-color-red{background:#ffa5a5}\n.basic-export-color-orange{background:#ffd0a4}\n.basic-export-color-yellow{background:#ffe49c}\n.basic-export-color-green{background:#ace4b3}\n.basic-export-color-blue{background:#b1d9ff}\n.basic-export-color-purple{background:#d9bafa}\n.basic-export-color-pink{background:#f4bfdf}\n.basic-export-color-accent{background:#e9d4ff}";
function writerPandocExportInline(line){
 const text=String(line||'');
 if(typeof writerExtendedTokens!=='function')return text;
 const changes=[];
 for(const token of writerExtendedTokens(text)){
  let attr=null;
  if(token.kind==='underline')attr='.basic-export-underline';
  else if(token.kind==='spoiler')attr='.basic-export-spoiler';
  else if(token.kind==='highlight'){
   const name=String(token.tag||'').toLowerCase();
   attr=/^hex-[0-9a-f]{6}$/.test(name)?'style="background-color:#'+name.slice(4)+'"':
    ['red','orange','yellow','green','blue','purple','pink','accent'].includes(name)?
     '.basic-export-highlight .basic-export-color-'+name:'.basic-export-highlight';
  }else if(token.kind==='span'){
   const name=String(token.tag||'').trim();
   attr=/^color-[0-9a-f]{6}$/i.test(name)?'style="color:#'+name.slice(6)+'"':
    name.split(/\s+/).filter(x=>/^[a-zA-Z][\w-]{0,40}$/.test(x))
     .map(x=>'.writer-v5-class-'+x).join(' ')||null;
  }else continue;
  if(!attr)continue; // ^sup^ and ~sub~ are handled natively by Pandoc.
  const value=token.value.replace(/\\/g,'\\\\').replace(/\[/g,'\\[').replace(/\]/g,'\\]');
  changes.push({from:token.from,to:token.to,text:'['+value+']{'+attr+'}'});
 }
 let output=text;
 for(const change of changes.reverse())output=output.slice(0,change.from)+change.text+output.slice(change.to);
 return output;
}
function writerPandocExportSuffix(line){
 if(typeof writerV102ParagraphSuffix==='function')return writerV102ParagraphSuffix(line);
 const raw=String(line||'');
 const match=/(?:[ \t]+\{(?:dropcap|capitular|left|center|right|justify|l|c|r|j)\})+[ \t]*$/i.exec(raw);
 if(!match||!raw.slice(0,match.index).trim())return null;
 const tags=[...match[0].matchAll(/\{([^}]+)\}/g)].map(x=>x[1].toLowerCase());
 const sides=tags.filter(x=>['left','center','right','justify','l','c','r','j'].includes(x));
 if(sides.length>1)return null;
 const side=sides[0];
 return {base:raw.slice(0,match.index),from:match.index,
  side:side?({l:'left',c:'center',r:'right',j:'justify'}[side]||side):null,
  dropcap:tags.includes('dropcap')||tags.includes('capitular')};
}
function writerPandocExportPrepare(source){
 const raw=String(source||''),eol=raw.includes('\r\n')?'\r\n':'\n';
 const lines=raw.split(/\r?\n/),out=[],paragraph=[];
 let fence=null,frontmatter=lines[0]?.trim()==='---';
 const flush=()=>{
  if(!paragraph.length)return;
  const last=paragraph[paragraph.length-1],tag=writerPandocExportSuffix(last);
  if(!tag){out.push(...paragraph.map(writerPandocExportInline));paragraph.length=0;return;}
  const updated=paragraph.map((line,i)=>i===paragraph.length-1?line.slice(0,tag.from):line);
  const attrs=['.basic-export-paragraph'];
  if(tag.side)attrs.push('.basic-export-'+tag.side);
  if(tag.dropcap)attrs.push('.basic-export-dropcap');
  out.push('::: {'+attrs.join(' ')+'}',...updated.map(writerPandocExportInline),':::');
  paragraph.length=0;
 };
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim();
  if(frontmatter){out.push(line);if(i>0&&trim==='---')frontmatter=false;continue;}
  const match=/^\s{0,3}(\x60{3,}|~{3,})/.exec(line);
  if(match){
   flush();
   if(!fence)fence=match[1][0];else if(fence===match[1][0])fence=null;
   out.push(line);continue;
  }
  if(fence){out.push(line);continue;}
  if(!trim){flush();out.push(line);continue;}
  const header=/^(\s{0,3}#{1,6}\s+)(.*)$/.exec(line);
  if(header){
   flush();
   const tag=writerPandocExportSuffix(header[2]);
   if(tag?.side&&!tag.dropcap)
    out.push(header[1]+writerPandocExportInline(header[2].slice(0,tag.from))+
     ' {style="text-align:'+tag.side+'"}');
   else out.push(writerPandocExportInline(line));
   continue;
  }
  if(/^(?: {4}|\t)|^\s{0,3}(?:>\s|[-*+]\s|\d+[.)]\s|\||:::\s|(?:---|\*\*\*|___)\s*$)/.test(line)){
   flush();out.push(line);continue;
  }
  paragraph.push(line);
 }
 flush();
 return out.join(eol);
}
function writerPandocExportEmbedCSS(html){
 const raw=String(html||'');
 return /<\/head\s*>/i.test(raw)?raw.replace(/<\/head\s*>/i,
  '<style id="basic-export-typography">\n'+WRITER_PANDOC_EXPORT_CSS+'\n</style>\n</head>'):raw;
}
