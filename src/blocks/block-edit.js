'use strict';
/* Safe bounded editing of ONLY the active fenced block. Does not touch unrelated notes. */
function writerV8FenceCandidate(text,type,info,expected){
 const parts=String(text).split(/(\r\n|\n|\r)/);
 if(!info||!Number.isInteger(info.lineStart)||!Number.isInteger(info.lineEnd)
  ||info.lineStart<0||info.lineEnd<=info.lineStart||info.lineEnd*2>=parts.length)return null;
 const norm=s=>String(s).replace(/\r\n?/g,'\n').replace(/\n+$/,'');
 // Section coordinates identify the block. Never search a neighbour with identical text.
 const start=info.lineStart*2,end=info.lineEnd*2;
 const open=/^( {0,3})(`{3,}|~{3,})([ \t]*)([\w-]+)([ \t].*)?$/.exec(parts[start]);
 if(!open||open[4]!==type||(open[2][0]==='`'&&open[5]?.includes('`')))return null;
 const close=new RegExp('^ {0,3}'+open[2][0]+'{'+open[2].length+',}[ \\t]*$');
 const lines=[];
 for(let j=start+2;j<end;j+=2){
  const line=parts[j];
  if(close.test(line))return null;
  lines.push(line.slice(Math.min(open[1].length,/^ */.exec(line)[0].length)));
 }
 const body=lines.join('\n');
 return close.test(parts[end])&&norm(body)===norm(expected)?{parts,start,end,open}:null;
}
function writerV8FenceReplace(original,type,ctx,el,expected,updated){
 if(String(updated).length>WRITER_V8_BLOCK_MAX)throw Error(writerUi('Bloco excede o limite de 32 mil caracteres.','Block exceeds the 32K character limit.'));
 const info=typeof ctx.getSectionInfo==='function'?ctx.getSectionInfo(el):null;
 const block=writerV8FenceCandidate(original,type,info,expected);
 if(!block)throw Error(writerUi('O bloco mudou ou não pode ser localizado. Abra a nota no editor.','Block changed or was not found. Open the note in the editor.'));
 const content=String(updated).replace(/\r\n?/g,'\n').replace(/\n+$/,'').split('\n'),marker=block.open[2][0];
 const {parts,start,end,open}=block;
 let width=open[2].length;
 // A closing fence in edited Markdown must remain inside the outer block.
 for(const line of content){
  const match=/^ {0,3}(`+|~+)[ \t]*$/.exec(line);
  if(match&&match[1][0]===marker)width=Math.max(width,match[1].length+1);
 }
 parts[start]=open[1]+marker.repeat(width)+open[3]+open[4]+(open[5]||'');
 parts[end]=parts[end].replace(/`{3,}|~{3,}/,fence=>width>fence.length?marker.repeat(width):fence);
 const eol=parts[start+1];
 const body=content.map((line,index)=>{
  const lineEndingIndex=start+3+index*2;
  return open[1]+line+(lineEndingIndex<end?parts[lineEndingIndex]:eol);
 }).join('');
 return parts.slice(0,start+2).join('')+body+parts.slice(end).join('');
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
 const initialValue=input.value;
 const bar=pre.createDiv({cls:'writer-v8-inline-actions'});
 const cancel=bar.createEl('button',{text:writerUi('Cancelar','Cancel'),attr:{type:'button'}});
 const save=bar.createEl('button',{text:writerUi('Salvar','Save'),attr:{type:'button'},cls:'mod-cta'});
 const close=()=>{pre.remove();host.classList.remove('is-editing');};
 cancel.addEventListener('click',close);
 const commit=async()=>{
  if(save.disabled)return;
  if(input.value===initialValue){close();return;}
  save.disabled=cancel.disabled=true;
  input.readOnly=true;
  let next;
  try{
   next=done(input.value);
   if(typeof next!=='string'||next.length>WRITER_V8_BLOCK_MAX)throw Error(writerUi('Texto muito longo.','Text too long.'));
   if(next!==source)await writerV8CommitFenced(plugin,ctx,element,type,source,next,baseline);
  }catch(error){
   save.disabled=cancel.disabled=false;
   input.readOnly=false;
   new Notice(writerUi('Não foi possível salvar: ','Unable to save: ')+String(error.message||error).slice(0,180));
   return;
  }
  close();if(element.isConnected){element.empty();rerender(next);}
 };
 save.addEventListener('click',()=>{void commit();});
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();if(!save.disabled)close();}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void commit();}
 });
 input.focus();
}
