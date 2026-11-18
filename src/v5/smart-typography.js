'use strict';
/* Basic AI v5: original Smart Typography implementation, scoped to prose input. */
const WRITER_TYPO_DEFAULTS={
 enabled:true,curlyQuotes:true,dashes:true,ellipsis:true,arrows:true,comparisons:true,
 fractions:false,guillemets:false,skipEnDash:false,smartApostrophes:true,dialogueDashes:true,restoreOnBackspace:true,
 openDouble:'“',closeDouble:'”',openSingle:'‘',closeSingle:'’',
 openGuillemet:'«',closeGuillemet:'»',leftArrow:'←',rightArrow:'→'
};
const WRITER_TYPO_FRACTIONS={
 '1/2':'½','1/3':'⅓','2/3':'⅔','1/4':'¼','3/4':'¾',
 '1/5':'⅕','2/5':'⅖','3/5':'⅗','4/5':'⅘','1/6':'⅙','5/6':'⅚',
 '1/7':'⅐','1/8':'⅛','3/8':'⅜','5/8':'⅝','7/8':'⅞','1/9':'⅑','1/10':'⅒'
};
function writerTypoMerge(settings){
 const old=settings.smartTypography;
 const cfg=settings.smartTypography={...WRITER_TYPO_DEFAULTS,...(old&&typeof old==='object'&&!Array.isArray(old)?old:{})};
 for(const key of ['enabled','curlyQuotes','dashes','ellipsis','arrows','comparisons','fractions','guillemets','skipEnDash','smartApostrophes','dialogueDashes','restoreOnBackspace'])cfg[key]=cfg[key]===true;
 for(const key of ['openDouble','closeDouble','openSingle','closeSingle','openGuillemet','closeGuillemet','leftArrow','rightArrow'])
  if(typeof cfg[key]!=='string'||!cfg[key]||cfg[key].length>8)cfg[key]=WRITER_TYPO_DEFAULTS[key];
 return cfg;
}
function writerTypoAtInput(before,typed,cfg,{batch=false,leadingEnDash=false}={}){
 if(!typed||typed.length!==1||!cfg?.enabled)return null;
 const put=(needle,output)=>({consume:needle.length,text:output});
 // Dialogue shorthand can still promote a newly typed leading en dash.
 if(cfg.dashes&&(typed===' '||(cfg.dialogueDashes&&/[\p{L}]/u.test(typed)))){
  const dialogueStart=leadingEnDash?'–':'--';
  if(before.slice(0,-1).trimStart()===dialogueStart)return put(dialogueStart+typed,'—'+typed);
 }
 if(cfg.dashes&&typed==='-'){
  // In the batch formatter a literal leading run may already be Markdown.
  // While typing, show the en dash on the second key, even at line start.
  if((batch&&/^\s*--$/.test(before))||/^\s*-{3,}$/.test(before))return null;
  // -- becomes –; adding a third hyphen makes —.
  if(before.endsWith('–-'))return put('–-','—');
  // The optional direct-to-em-dash mode must not undo its own conversion.
  if(cfg.skipEnDash&&before.endsWith('—-'))return put('—-','—');
  if(before.endsWith('---'))return put('---','—');
  if(before.endsWith('--'))return put('--',cfg.skipEnDash?'—':'–');
 }
 if(cfg.ellipsis&&typed==='.'&&before.endsWith('...'))return put('...','…');
 if(cfg.guillemets&&typed==='<'&&before.endsWith('<<'))return put('<<',cfg.openGuillemet);
 if(cfg.guillemets&&typed==='>'&&before.endsWith('>>'))return put('>>',cfg.closeGuillemet);
 if(cfg.arrows&&typed==='>'&&before.endsWith('->'))return put('->',cfg.rightArrow);
 if(cfg.arrows&&typed==='-'&&before.endsWith('<-'))return put('<-',cfg.leftArrow);
 if(cfg.comparisons&&typed==='='){
  for(const [s,d] of [['>=','≥'],['<=','≤'],['/=','≠']])if(before.endsWith(s))return put(s,d);
 }
 if(cfg.fractions&&/\d/.test(typed)){
  for(const [s,d] of Object.entries(WRITER_TYPO_FRACTIONS).sort((a,b)=>b[0].length-a[0].length)){
   if(before.endsWith(s)){
    const left=before.slice(0,-s.length);
    if(!left||/[\s([{“‘]/.test(left.at(-1)))return put(s,d);
   }
  }
 }
 if(cfg.curlyQuotes&&(typed==='"'||typed==="'")){
  const isSingle=typed==="'",opening=isSingle?cfg.openSingle:cfg.openDouble,closing=isSingle?cfg.closeSingle:cfg.closeDouble;
  const previous=before.at(-2)||'';
  if(isSingle&&cfg.smartApostrophes&&/[\p{L}\p{N}]/u.test(previous))return put(typed,closing);
  const opener=previous===opening?false:(!previous||/[\s([{<—–«“‘]/u.test(previous));
  return put(typed,opener?opening:closing);
 }
 return null;
}
function writerTypoProtectedText(text){
 const lines=String(text||'').split('\n'),out=[];let fence='',frontmatter=false;
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim();
  if(i===0&&trim==='---'){frontmatter=true;out.push({text:line,protected:true});continue;}
  if(frontmatter){out.push({text:line,protected:true});if(trim==='---')frontmatter=false;continue;}
  if(/^(-{3,}|\*{3,}|_{3,})$/.test(trim)){out.push({text:line,protected:true});continue;}
  const found=/^\s{0,3}(\x60{3,}|~{3,})/.exec(line);
  if(found){
   const symbol=found[1][0];
   if(!fence)fence=symbol;else if(fence===symbol)fence='';
   out.push({text:line,protected:true});continue;
  }
  const protectedLine=Boolean(fence)||/^(?: {4}|\t)/.test(line);
  out.push({text:line,protected:protectedLine});
 }
 return out;
}
function writerTypoConvertProse(text,cfg){
 if(!cfg?.enabled)return text;
 // Only transform ordinary prose fragments. Keep Markdown links, code, URLs and escapes intact.
 const excluded=/\x60+[^\x60\n]*\x60+|!?\[\[[^\]\n]*\]\]|!?\[[^\]\n]*\]\([^)\n]*\)|https?:\/\/[^\s<>)]+|\\./g;
 return writerTypoProtectedText(String(text)).map(({text:line,protected:blocked})=>{
  if(blocked)return line;
  let transformed='',last=0;
  const convert=part=>{
   let result='';
   for(const character of part){
    const candidate=writerTypoAtInput(result+character,character,cfg,{batch:true});
    if(candidate)result=result.slice(0,result.length+1-candidate.consume)+candidate.text;
    else result+=character;
   }
   return result;
  };
  for(const match of line.matchAll(excluded)){
   transformed+=convert(line.slice(last,match.index));
   transformed+=match[0];last=match.index+match[0].length;
  }
  transformed+=convert(line.slice(last));
  return transformed;
 }).join('\n');
}
/* One CodeMirror transaction filter for both modules. The desktop auto-pair
 * extension often inserts two quotes together, not one typed character.
 * Keep those insertions in a single undoable transaction and restore the
 * caret between the typographic pair. Avoid paste, completion and IME edits. */
function writerTypingFilterTransaction(tr,p){
 if(!tr.docChanged||!tr.changes?.iterChanges)return tr;
 const prior=p._writerTypingRestoreField&&tr.startState.field?.(p._writerTypingRestoreField,false);
 // On Android, the virtual keyboard may delete without using the Backspace keymap.
 if(prior&&p.writerSmartTypography?.cfg?.restoreOnBackspace!==false&&
    (tr.isUserEvent?.('delete.backward')||tr.isUserEvent?.('input.delete'))){
  const head=prior.head??prior.to;
  let removed=0,count=0;
  tr.changes.iterChanges((fromA,toA,fromB,toB,inserted)=>{
   count++;
   const previousChar=Array.from(prior.text.slice(0,head-prior.from)).pop();
   const deletesChar=fromA===head-(previousChar?.length||1)&&toA===head;
   const deletesPair=prior.head!=null&&fromA===prior.from&&toA===prior.to;
   if((deletesChar||deletesPair)&&fromB===fromA&&toB===fromB&&inserted.toString()==='')
    removed=toA-fromA;
  });
  if(count===1&&removed&&writerTypingCanRestore(tr.startState,p,prior))
   return [tr,{changes:{from:prior.from,to:prior.to-removed,insert:prior.original},
    sequential:true,selection:{anchor:prior.from+prior.original.length}}];
 }
 if(!tr.isUserEvent?.('input'))return tr;
 if(['input.type.compose','input.paste','input.drop','input.complete'].some(e=>tr.isUserEvent(e)))return tr;
 const typography=p.writerSmartTypography,typoOn=typography?.active()===true;
 const easy=p.writerEasyTyping,easyOn=easy?.active()===true;
 if(!typoOn&&!easyOn)return tr;
 const edits=[];let caret=null,restore=null;
 tr.changes.iterChanges((fromA,toA,fromB,toB,inserted)=>{
  if(fromA!==toA)return;
  const insertion=inserted.toString();
  const doc=tr.newDoc;
  const line=doc.lineAt(Math.min(toB,doc.length));
  const prefix=doc.sliceString(line.from,toB);
  if(writerTypingUnsafeContext(tr.startState,fromA,prefix))return;
  const paired=insertion.length===2&&insertion[0]===insertion[1]&&
   (insertion[0]==='"'||insertion[0]==="'")&&
   tr.startState.selection?.ranges?.length===1&&tr.startState.selection.main.empty&&
   tr.newSelection?.ranges?.length===1&&tr.newSelection.main.empty&&
   tr.newSelection.main.head===fromB+1;
  // The native editor cannot skip its ASCII closer after we convert the pair.
  // Typing a matching quote should step over the existing typographic closer.
  if(typoOn&&typography.cfg.curlyQuotes&&(insertion.length===1||paired)&&
   (insertion[0]==='"'||insertion[0]==="'")&&tr.newSelection?.ranges?.length===1){
   const closer=insertion[0]==="'"?typography.cfg.closeSingle:typography.cfg.closeDouble;
   const suggestion=writerTypoAtInput(doc.sliceString(line.from,fromB+1),insertion[0],typography.cfg);
   if(suggestion?.text===closer&&doc.sliceString(toB,Math.min(doc.length,toB+closer.length))===closer){
    edits.push({from:fromB,to:toB,insert:''});caret={anchor:fromB+closer.length};
    if(closer!==insertion[0])restore={from:fromB,to:caret.anchor,text:closer,original:insertion[0],source:'typography'};
    return;
   }
  }
  if(paired&&typoOn&&typography.cfg.curlyQuotes){
   const single=insertion[0]==="'";
   const opener=single?typography.cfg.openSingle:typography.cfg.openDouble;
   const closer=single?typography.cfg.closeSingle:typography.cfg.closeDouble;
   const firstPrefix=doc.sliceString(line.from,fromB+1);
   const suggestion=writerTypoAtInput(firstPrefix,insertion[0],typography.cfg);
   if(suggestion?.text!==opener)return; // Only change auto-paired opening quotes.
   edits.push({from:fromB,to:toB,insert:opener+closer});
   caret={anchor:fromB+opener.length};
   if(opener+closer!==insertion)
    restore={from:fromB,to:fromB+opener.length+closer.length,head:caret.anchor,
     text:opener+closer,original:insertion[0],source:'typography'};
   return;
  }
  if(insertion.length!==1)return;
  const leadingEnDash=prior?.source==='typography'&&prior.text==='–'&&prior.original==='--'&&prior.to===fromA;
  let proposal=typoOn?writerTypoAtInput(prefix,insertion,typography.cfg,{leadingEnDash}):null;
  let source=proposal?'typography':null;
  if(!proposal&&easyOn){proposal=writerEasyTypingAtInput(prefix,insertion,easy.cfg);source='easy';}
  if(proposal&&proposal.consume>0&&proposal.consume<=prefix.length){
   const start=toB-proposal.consume,typedText=doc.sliceString(start,toB);
   // Remember original keystrokes across -- → – → —.
   const original=prior&&source===prior.source&&prior.from===start&&
    prior.to===fromA&&typedText===prior.text+insertion?
     prior.original+insertion:typedText;
   edits.push({from:start,to:toB,insert:proposal.text});
   if(tr.newSelection?.ranges?.length===1&&tr.newSelection.main.empty&&
      tr.newSelection.main.head===toB)
    restore={from:start,to:start+proposal.text.length,text:proposal.text,original,source};
  }
 });
 if(!edits.length)return tr;
 edits.sort((a,b)=>a.from-b.from);
 if(edits.some((e,i)=>i>0&&e.from<edits[i-1].to))return tr;
 const next={changes:edits,sequential:true};
 if(caret&&edits.length===1)next.selection=caret;
 if(restore&&edits.length===1&&p._writerTypingRestoreAnnotation)
  next.annotations=p._writerTypingRestoreAnnotation.of(restore);
 return [tr,next];
}
function writerTypingCanRestore(state,p,meta){
 const sel=state.selection;
 if(sel?.ranges?.length!==1||!sel.main.empty||sel.main.head!==(meta.head??meta.to))return false;
 const active=meta.source==='easy'?p.writerEasyTyping?.active()===true:
  p.writerSmartTypography?.active()===true;
 return active&&state.doc.sliceString(meta.from,meta.to)===meta.text;
}
function writerTypingRestoreBackspace(view,p){
 const meta=p._writerTypingRestoreField&&view.state.field?.(p._writerTypingRestoreField,false);
 if(!meta||view.composing||p.writerSmartTypography?.cfg?.restoreOnBackspace===false)return false;
 if(!writerTypingCanRestore(view.state,p,meta))return false;
 view.dispatch({changes:{from:meta.from,to:meta.to,insert:meta.original},
  selection:{anchor:meta.from+meta.original.length},userEvent:'delete.backward'});
 return true;
}
class WriterSmartTypography{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.smartTypography;}
 active(){return writerModuleOn(this.plugin,'smartTypography')&&this.cfg.enabled;}
 register(){
  const p=this.plugin;
  p.addCommand({id:'v5-typography-toggle',name:writerUi('Tipografia: ativar/desativar substituições','Typography: toggle smart replacements'),callback:async()=>{
   this.cfg.enabled=!this.cfg.enabled;await p.saveSettings();
   new Notice(writerUi('Tipografia inteligente: ','Smart typography: ')+(this.cfg.enabled?writerUi('ativada','on'):writerUi('desativada','off')));
  }});
  p.addCommand({id:'v5-typography-convert-selection',name:writerUi('Tipografia: converter seleção','Typography: convert selection'),editorCallback:editor=>{
   if(!this.active()||!editor.getSelection())return;
   const text=editor.getSelection(),converted=writerTypoConvertProse(text,this.cfg);
   if(text!==converted)editor.replaceSelection(converted);
  }});
  const {EditorState,StateField,Annotation,Prec}=require('@codemirror/state');
  const {keymap}=require('@codemirror/view');
  if(!EditorState?.transactionFilter?.of)return;
  if(StateField?.define&&Annotation?.define){
   const marker=Annotation.define();
   const field=StateField.define({
    create:()=>null,
    update:(previous,tr)=>{
     const replacement=tr.annotation(marker);
     if(replacement)return replacement;
     if(tr.docChanged||!tr.startState.selection.eq(tr.newSelection))return null;
     return previous;
    }
   });
   p._writerTypingRestoreField=field;
   p._writerTypingRestoreAnnotation=marker;
   p.registerEditorExtension(field);
   if(keymap?.of){
    const binding=keymap.of([{key:'Backspace',run:view=>writerTypingRestoreBackspace(view,p)}]);
    p.registerEditorExtension(Prec?.highest?Prec.highest(binding):binding);
   }
  }
  p.registerEditorExtension(EditorState.transactionFilter.of(tr=>writerTypingFilterTransaction(tr,p)));
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Tipografia automática','Automatic typography')});
  panel.createEl('p',{text:writerUi('Substituições somente durante digitação em prosa. Código, fórmulas, URLs e outros contextos estruturados são ignorados sempre que detectados.','Replacements while typing prose; recognized code, math and structured contexts are skipped.'),cls:'dictionary-muted'});
  for(const [key,pt,en] of [
   ['enabled','Ativar tipografia automática','Enable automatic typography'],['curlyQuotes','Aspas curvas e apóstrofos','Curly quotes and apostrophes'],
   ['dashes','Travessões e meia-risca','Dashes'],['ellipsis','Reticências (...)','Ellipsis (...)'],
   ['arrows','Setas (->, <-)','Arrows (->, <-)'],['comparisons','Comparações (>=, <=, /=)','Comparisons'],
   ['fractions','Frações (1/2, 3/4)','Fractions'],['guillemets','Aspas angulares (<<, >>)','Guillemets'],
   ['skipEnDash','Pular meia-risca (-- → — direto)','Skip en dash (-- → — directly)'],
   ['restoreOnBackspace','Backspace desfaz a última substituição','Backspace restores the last replacement'],
   ['dialogueDashes','Travessão de diálogo (--Olá)','Dialogue dash (--Hello)'],
   ['smartApostrophes','Reconhecer apóstrofos em palavras','Smart apostrophes']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(this.cfg[key]).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();}));
  panel.createEl('p',{cls:'dictionary-muted',text:writerUi(
   'Padrão: -- vira meia-risca (–) e --- vira travessão (—), inclusive no começo do parágrafo. Use Backspace logo após a troca para recuperar os hífens (por exemplo, para um separador Markdown) ou a aspa reta.',
   'Default: -- becomes an en dash (–), and --- an em dash (—), even at the start of a paragraph. Press Backspace right after conversion to restore the hyphens (for example, for a Markdown separator) or the straight quote.'
  )});
  for(const [key,pt,en] of [
   ['openDouble','Aspas duplas de abertura','Opening double quote'],['closeDouble','Aspas duplas de fechamento','Closing double quote'],
   ['openSingle','Aspas simples de abertura','Opening single quote'],['closeSingle','Aspas simples de fechamento','Closing single quote'],
   ['openGuillemet','Guillemet de abertura','Opening guillemet'],['closeGuillemet','Guillemet de fechamento','Closing guillemet'],
   ['leftArrow','Seta esquerda','Left arrow'],['rightArrow','Seta direita','Right arrow']
  ])new Setting(panel).setName(writerUi(pt,en)).addText(t=>t.setValue(this.cfg[key]).onChange(async value=>{
   if(value.length>0&&value.length<=8){this.cfg[key]=value;await this.plugin.saveSettings();}
  }));
 }
}
function writerTypingUnsafeContext(state,from,prefix){
 const line=prefix||'';
 if(/^\s*(?:\x60{3,}|~{3,}|---|<!--)/.test(line)||/^(?: {4}|\t)/.test(line))return true;
 if(state?.doc?.lineAt&&state.doc.line?.(1)?.text?.trim()==='---'){
  const cursorLine=state.doc.lineAt(Math.min(from,state.doc.length)).number;
  if(cursorLine<=256){
   let ended=false;
   for(let n=2;n<=cursorLine;n++)if(state.doc.line(n).text.trim()==='---'){ended=true;break;}
   if(!ended)return true;
  }
 }
 const ticks=(line.match(/(?<!\\)\x60/g)||[]).length;
 if(ticks%2!==0)return true;
 if(/(?:https?:\/\/|obsidian:\/\/|www\.|mailto:)\S*$/i.test(line))return true;
 if(/(?:!?\[[^\]]*\]\([^)]*|\[\[[^\]]*|\$\$?[^$]*)$/.test(line))return true;
 let parsed=false;
 try{
  const {syntaxTree,syntaxTreeAvailable}=require('@codemirror/language');
  const tree=typeof syntaxTree==='function'&&state?syntaxTree(state):null;
  parsed=Boolean(tree)&&(typeof syntaxTreeAvailable!=='function'||syntaxTreeAvailable(state,from));
  if(tree){
   for(let node=tree.resolveInner(Math.max(0,from-1),1);node;node=node.parent)
    if(/Code|Math|Frontmatter|YAML|Link|URL|HTML|Comment|Tag/i.test(node.name||''))return true;
  }
 }catch(_){}
 // Obsidian's line-oriented parser has no node on an empty fenced-code line.
 // Check fence state for the first input on a blank line (or an unparsed range),
 // rather than scanning a long manuscript for every ordinary prose keystroke.
 if(state?.doc?.lineAt&&state.doc.line){
  const cursor=state.doc.lineAt(Math.min(from,state.doc.length));
  const head=cursor.text.slice(0,Math.max(0,from-cursor.from));
  if(!parsed||!head.replace(/^(?:\s*> ?)+/,'').trim()){
   let fence=null;
   const consume=text=>{
    const clean=text.replace(/^(?: {0,3}> ?)+/,'');
    const match=/^ {0,3}(\x60{3,}|~{3,})(.*)$/.exec(clean);
    if(!match)return;
    const marker=match[1],tail=match[2];
    if(!fence){
     if(marker[0]==='\x60'&&tail.includes('\x60'))return;
     fence={symbol:marker[0],length:marker.length};
    }else if(marker[0]===fence.symbol&&marker.length>=fence.length&&!tail.trim())fence=null;
   };
   if(typeof state.doc.iterLines==='function'){
    const lines=state.doc.iterLines(1,cursor.number);
    while(!lines.next().done)consume(lines.value);
   }else for(let number=1;number<cursor.number;number++)consume(state.doc.line(number).text);
   if(fence)return true;
  }
 }
 return false;
}
