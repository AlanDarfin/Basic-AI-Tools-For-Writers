'use strict';
/* Safe bounded editing of ONLY the active fenced block. Does not touch unrelated notes. */
function writerV8FenceCandidate(text,type,info,expected){
 const lines=String(text).split(/\r?\n/),start=Math.max(0,Number(info?.lineStart??-1)-3);
 const end=Math.min(lines.length,Number(info?.lineEnd??-1)+4);
 if(!info||!Number.isInteger(info.lineStart)||!Number.isInteger(info.lineEnd))return null;
 const norm=s=>String(s).replace(/\r\n/g,'\n').replace(/\n+$/,'');
 for(let i=start;i<end;i++){
  const open=/^ {0,3}(`{3,}|~{3,})([\w-]+)(?:\s+.*)?$/.exec(lines[i]||'');
  if(!open||open[2]!==type)continue;
  const close=new RegExp('^ {0,3}'+(open[1][0]==='`'?'\\`':'~')+'{'+open[1].length+',}\\s*$');
  for(let j=i+1;j<Math.min(lines.length,Math.max(end+5,i+1200));j++){
   if(!close.test(lines[j]))continue;
   const body=lines.slice(i+1,j).join('\n');
   if(norm(body)!==norm(expected))break;
   return {lines,start:i,end:j,body,eol:String(text).includes('\r\n')?'\r\n':'\n'};
  }
 }
 return null;
}
function writerV8FenceReplace(original,type,ctx,el,expected,updated){
 if(String(updated).length>WRITER_V8_BLOCK_MAX)throw Error(writerUi('Bloco excede o limite de 32 mil caracteres.','Block exceeds the 32K character limit.'));
 const info=typeof ctx.getSectionInfo==='function'?ctx.getSectionInfo(el):null;
 const block=writerV8FenceCandidate(original,type,info,expected);
 if(!block)throw Error(writerUi('O bloco mudou ou não pode ser localizado. Abra a nota no editor.','Block changed or was not found. Open the note in the editor.'));
 const out=[...block.lines.slice(0,block.start+1),...String(updated).replace(/\r\n/g,'\n').replace(/\n+$/,'').split('\n'),...block.lines.slice(block.end)];
 return out.join(block.eol);
}
async function writerV8CommitFenced(plugin,ctx,el,type,oldSource,newSource){
 const file=plugin.app.vault.getAbstractFileByPath(ctx.sourcePath||'');
 if(!(file instanceof TFile)||file.extension!=='md'||typeof plugin.app.vault.process!=='function')
  throw Error(writerUi('Nota não editável.','Note is not editable.'));
 const section=typeof ctx.getSectionInfo==='function'?ctx.getSectionInfo(el):null;
 if(!section)throw Error(writerUi('Abra esta nota no modo de edição para alterar o bloco.','Open this note in edit mode to change the block.'));
 // Re-read within vault.process to reject stale edits, without overriding concurrent edits.
 let newContent;
 await plugin.app.vault.process(file,text=>{
  newContent=writerV8FenceReplace(text,type,{getSectionInfo:()=>section},el,oldSource,newSource);
  return newContent;
 });
 return newSource;
}
function writerV8InlineEditor(plugin,ctx,host,element,type,source,initial,done,rerender){
 if(host.querySelector('.writer-v8-inline-editor'))return;
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
   if(next!==source)await writerV8CommitFenced(plugin,ctx,element,type,source,next);
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
