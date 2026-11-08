'use strict';
/* Safe bounded editing of ONLY the active fenced block. Does not touch unrelated notes. */
function writerV8FenceCandidate(text,type,info,expected){
 const lines=String(text).split(/\r?\n/);
 if(!info||!Number.isInteger(info.lineStart)||!Number.isInteger(info.lineEnd)
  ||info.lineStart<0||info.lineEnd<=info.lineStart||info.lineEnd>=lines.length)return null;
 const norm=s=>String(s).replace(/\r\n/g,'\n').replace(/\n+$/,'');
 // Section coordinates identify the block. Never search a neighbour with identical text.
 const start=info.lineStart,end=info.lineEnd;
 const open=/^( {0,3})(`{3,}|~{3,})([\w-]+)([ \t].*)?$/.exec(lines[start]);
 if(!open||open[3]!==type)return null;
 const close=new RegExp('^ {0,3}'+open[2][0]+'{'+open[2].length+',}[ \\t]*$');
 for(let j=start+1;j<=end;j++){
  if(!close.test(lines[j]))continue;
  if(j!==end)return null;
  const body=lines.slice(start+1,end).map(line=>line.slice(Math.min(open[1].length,/^ */.exec(line)[0].length))).join('\n');
  if(norm(body)!==norm(expected))return null;
  return {lines,start,end,body,open,eol:String(text).includes('\r\n')?'\r\n':'\n'};
 }
 return null;
}
function writerV8FenceReplace(original,type,ctx,el,expected,updated){
 if(String(updated).length>WRITER_V8_BLOCK_MAX)throw Error(writerUi('Bloco excede o limite de 32 mil caracteres.','Block exceeds the 32K character limit.'));
 const info=typeof ctx.getSectionInfo==='function'?ctx.getSectionInfo(el):null;
 const block=writerV8FenceCandidate(original,type,info,expected);
 if(!block)throw Error(writerUi('O bloco mudou ou não pode ser localizado. Abra a nota no editor.','Block changed or was not found. Open the note in the editor.'));
 const content=String(updated).replace(/\r\n/g,'\n').replace(/\n+$/,''),marker=block.open[2][0];
 let width=block.open[2].length;
 // A closing fence in edited Markdown must remain inside the outer block.
 for(const line of content.split('\n')){
  const match=/^ {0,3}(`+|~+)[ \t]*$/.exec(line);
  if(match&&match[1][0]===marker)width=Math.max(width,match[1].length+1);
 }
 const fence=marker.repeat(width),opening=block.open[1]+fence+block.open[3]+(block.open[4]||'');
 const closing=block.lines[block.end].replace(/`{3,}|~{3,}/,fence);
 const out=[...block.lines.slice(0,block.start),opening,...content.split('\n').map(line=>block.open[1]+line),closing,...block.lines.slice(block.end+1)];
 return out.join(block.eol);
}
function writerV8CaptureFenced(plugin,ctx){
 // Read at editor-open time, before a neighbouring identical block can replace this one.
 try{
  const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath||'');
  if(!(file instanceof TFile)||file.extension!=='md')throw Error(writerUi('Nota não editável.','Note is not editable.'));
  const path=file.path,mtime=file.stat?.mtime,size=file.stat?.size;
  return Promise.resolve(plugin.app.vault.read(file)).then(text=>{
   if(file.path!==path||file.stat?.mtime!==mtime||file.stat?.size!==size)
    throw Error(writerUi('A nota mudou. Reabra o editor do bloco.','Note changed. Reopen the block editor.'));
   return {file,path,text};
  }).catch(error=>({error}));
 }catch(error){return Promise.resolve({error});}
}
async function writerV8CommitFenced(plugin,ctx,el,type,oldSource,newSource,baseline){
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath||'');
 if(!(file instanceof TFile)||file.extension!=='md'||typeof plugin.app.vault.process!=='function')
  throw Error(writerUi('Nota não editável.','Note is not editable.'));
 const section=typeof ctx.getSectionInfo==='function'?ctx.getSectionInfo(el):null;
 if(!section)throw Error(writerUi('Abra esta nota no modo de edição para alterar o bloco.','Open this note in edit mode to change the block.'));
 const snapshot=await(baseline||writerV8CaptureFenced(plugin,ctx));
 if(snapshot.error)throw snapshot.error;
 if(snapshot.file!==file||snapshot.path!==file.path)
  throw Error(writerUi('A nota mudou. Reabra o editor do bloco.','Note changed. Reopen the block editor.'));
 // Re-read within vault.process to reject stale edits, without overriding concurrent edits.
 let newContent;
 await plugin.app.vault.process(file,text=>{
  if(text!==snapshot.text)throw Error(writerUi('A nota mudou. Reabra o editor do bloco.','Note changed. Reopen the block editor.'));
  newContent=writerV8FenceReplace(text,type,{getSectionInfo:()=>section},el,oldSource,newSource);
  return newContent;
 });
 return newSource;
}
function writerV8InlineEditor(plugin,ctx,host,element,type,source,initial,done,rerender){
 if(host.querySelector('.writer-v8-inline-editor'))return;
 const baseline=writerV8CaptureFenced(plugin,ctx);
 const pre=host.createDiv({cls:'writer-v8-inline-editor'});
 host.classList.add('is-editing');
 const input=pre.createEl('textarea',{cls:'writer-v8-inline-textarea',attr:{'aria-label':writerUi('Editar conteúdo Markdown','Edit Markdown content')}});
 input.value=initial;input.rows=Math.max(4,Math.min(16,initial.split('\n').length+2));
 const bar=pre.createDiv({cls:'writer-v8-inline-actions'});
 const cancel=bar.createEl('button',{text:writerUi('Cancelar','Cancel'),attr:{type:'button'}});
 const save=bar.createEl('button',{text:writerUi('Salvar','Save'),attr:{type:'button'},cls:'mod-cta'});
 const close=()=>{pre.remove();host.classList.remove('is-editing');};
 cancel.addEventListener('click',close);
 const commit=async()=>{
  if(save.disabled)return;
  save.disabled=true;
  try{
   const next=done(input.value);
   if(typeof next!=='string'||next.length>WRITER_V8_BLOCK_MAX)throw Error(writerUi('Texto muito longo.','Text too long.'));
   if(next!==source)await writerV8CommitFenced(plugin,ctx,element,type,source,next,baseline);
   close();if(element.isConnected){element.empty();rerender(next);}
  }catch(error){
   save.disabled=false;
   new Notice(writerUi('Não foi possível salvar: ','Unable to save: ')+String(error.message||error).slice(0,180));
  }
 };
 save.addEventListener('click',()=>{void commit();});
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void commit();}
 });
 input.focus();
}
function writerV8TabLayout(source){
 const before=String(source||'').split(/^===\s+/m)[0];
 const match=/^(?:layout|position):\s*(top|side|left|right)\s*$/mi.exec(before);
 return match?match[1].toLowerCase():'top';
}
function writerV8ReplaceTab(source,index,newText){
 const lines=String(source).replace(/\r\n/g,'\n').split('\n');
 const headers=[];
 lines.forEach((line,i)=>{if(/^===\s+.{1,80}\s*$/.test(line))headers.push(i);});
 if(index<0||index>=headers.length)return null;
 const from=headers[index]+1,to=index+1<headers.length?headers[index+1]:lines.length;
 const trimmed=String(newText).replace(/\r\n/g,'\n').replace(/\n+$/,'');
 return [...lines.slice(0,from),...trimmed.split('\n'),...lines.slice(to)].join('\n').replace(/\n+$/,'');
}
