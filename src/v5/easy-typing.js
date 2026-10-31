'use strict';
/* Basic AI v5 — independently implemented Easy Typing features. */
const WRITER_EASY_DEFAULTS={
 enabled:true,tabOut:true,smartPaste:true,smartBackspace:true,autoCapitalize:false,
 cjkSpacing:false,inlineSpacing:false,autoFormatPaste:false,excludedPaths:'',
 customReplacements:[],maxPasteChars:20000
};
const WRITER_EASY_PAIRS=[
 ['(',')'],['[',']'],['{','}'],['“','”'],['‘','’'],['«','»'],
 ['「','」'],['『','』'],['（','）'],['【','】'],['《','》'],
 ['\x60','\x60'],['**','**'],['__','__'],['~~','~~'],['==','=='],['[[',']]'],['$','$']
];
function writerEasyMerge(settings){
 const original=settings.easyTyping;
 const cfg=settings.easyTyping={...WRITER_EASY_DEFAULTS,...(original&&typeof original==='object'&&!Array.isArray(original)?original:{})};
 for(const key of ['enabled','tabOut','smartPaste','smartBackspace','autoCapitalize','cjkSpacing','inlineSpacing','autoFormatPaste'])cfg[key]=cfg[key]===true;
 cfg.excludedPaths=String(cfg.excludedPaths||'').slice(0,4096);
 cfg.maxPasteChars=Math.max(250,Math.min(100000,Number(cfg.maxPasteChars)||20000));
 cfg.customReplacements=Array.isArray(cfg.customReplacements)?cfg.customReplacements.slice(0,50).filter(x=>x&&typeof x.from==='string'&&x.from.length>0&&x.from.length<=80&&typeof x.to==='string'&&x.to.length<=300).map(x=>({from:x.from,to:x.to,enabled:x.enabled!==false})):[];
 return cfg;
}
function writerEasyExcluded(filePath,cfg){
 const path=String(filePath||'');
 return String(cfg?.excludedPaths||'').split(/[\r\n,]+/).map(x=>x.trim()).filter(Boolean).some(rule=>{
  const folder=rule.replace(/\/+$/,'');
  return path===folder||path.startsWith(folder+'/');
 });
}
function writerEasyTypingAtInput(before,character,cfg){
 if(!cfg?.enabled||!character||character.length!==1)return null;
 for(const rule of [...(cfg.customReplacements||[])].filter(r=>r.enabled!==false).sort((a,b)=>b.from.length-a.from.length)){
  if(before.endsWith(rule.from))return {consume:rule.from.length,text:rule.to};
 }
 if(cfg.autoCapitalize&&/\p{L}/u.test(character)){
  const pre=before.slice(0,-1);
  if(/^\s*(?:>\s*)?(?:[-*+]\s+|\d+[.)]\s+)?$/.test(pre)||/[.!?…][”’"')\]]*\s+$/.test(pre))
   return {consume:1,text:character.toLocaleUpperCase()};
 }
 if(cfg.cjkSpacing){
  const prev=before.at(-2)||'';
  const cjk=/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u;
  const alpha=/[A-Za-z0-9]/;
  if((cjk.test(prev)&&alpha.test(character))||(alpha.test(prev)&&cjk.test(character)))
   return {consume:1,text:' '+character};
 }
 return null;
}
function writerEasyPaste(source,prior,cfg){
 if(!cfg?.smartPaste||!source.includes('\n')||source.length>cfg.maxPasteChars)return source;
 const match=/^([ \t]*(?:>\s*)*)(?:([-*+]|\d+[.)])(\s+))?/.exec(prior||'');
 if(!match)return source;
 const quotePrefix=match[1]||'',listPrefix=match[2]||'',space=match[3]||' ';
 if(!quotePrefix&&!listPrefix)return source;
 const prefix=quotePrefix+(listPrefix?listPrefix+space:'');
 const lines=source.split(/\r?\n/);
 for(let i=1;i<lines.length;i++){
  if(!lines[i].trim()||/^\s*(?:>\s*|[-*+]\s+|\d+[.)]\s+|\x60{3,}|~{3,})/.test(lines[i]))continue;
  lines[i]=prefix+lines[i];
 }
 return lines.join('\n');
}
function writerEasyTabOut(line,column,pairs=WRITER_EASY_PAIRS){
 const right=String(line).slice(column),left=String(line).slice(0,column);
 if(!right||!left)return 0;
 for(const [opening,closing] of [...pairs].sort((a,b)=>b[1].length-a[1].length)){
  if(!right.startsWith(closing))continue;
  if(opening===closing){
   const escaped=opening.replace(/[|\\{}()[\]^$+*?.]/g,'\\$&');
   const count=(left.match(new RegExp(escaped,'g'))||[]).length;
   if(count%2===1)return closing.length;
  }else{
   const count=left.split(opening).length-left.split(closing).length;
   if(count>0)return closing.length;
  }
 }
 return 0;
}
function writerEasyBackspacePrefix(line,column){
 const prefix=line.slice(0,column);
 if(!/^\s*(?:>\s*)*(?:(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s*)?)?$/.test(prefix)||!prefix.trim()||column!==line.length)return null;
 return {from:0,to:column,insert:''};
}
function writerEasyProseFormat(text,cfg){
 const parts=writerTypoProtectedText(String(text));
 const result=[];let blankCount=0;
 for(const {text:line,protected:blocked} of parts){
  if(!blocked&&!line.trim())blankCount++;else blankCount=0;
  if(blankCount>2)continue;
  result.push((()=>{
  if(blocked||/^\s*(?:\x60|>|[-*+]\s+|\d+[.)]\s+|[#|])/.test(line))return line;
  let next=line;
  if(cfg.inlineSpacing)next=next.replace(/([\p{L}\p{N}])(\x60[^\x60\n]+\x60)/gu,'$1 $2').replace(/(\x60[^\x60\n]+\x60)([\p{L}\p{N}])/gu,'$1 $2');
  if(cfg.cjkSpacing)next=next.replace(/([\u3400-\u9fff])([A-Za-z0-9])/gu,'$1 $2').replace(/([A-Za-z0-9])([\u3400-\u9fff])/gu,'$1 $2');
  return next;
  })());
 }
 return result.join('\n');
}
class WriterEasyTyping{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.easyTyping;}
 active(){
  if(!writerModuleOn(this.plugin,'easyTyping')||!this.cfg.enabled)return false;
  return !writerEasyExcluded(this.plugin.app.workspace.getActiveFile?.()?.path||'',this.cfg);
 }
 register(){
  const p=this.plugin;
  const commands=[
   ['format-selection','Formatar seleção ou linha','Format selection or line',(ed)=>{
    const text=ed.getSelection(),cursor=ed.getCursor();
    const start=text?ed.getCursor('from'):{line:cursor.line,ch:0};
    const end=text?ed.getCursor('to'):{line:cursor.line,ch:ed.getLine(cursor.line).length};
    const source=ed.getRange(start,end),next=writerEasyProseFormat(source,this.cfg);
    if(source!==next)ed.replaceRange(next,start,end);
   }],
   ['delete-empty-lines','Remover linhas vazias extras','Remove extra blank lines',(ed)=>{
    const source=ed.getSelection();
    if(!source)return new Notice(writerUi('Selecione um trecho antes.','Select text first.'));
    const next=source.replace(/\n(?:[ \t]*\n){2,}/g,'\n\n');
    if(source!==next)ed.replaceSelection(next);
   }],
   ['wrap-code','Envolver seleção em bloco de código','Wrap selection in code fence',(ed)=>{
    const source=ed.getSelection();
    if(!source||/^\s*(?:\x60{3,}|~{3,})/.test(source))return;
    const fence='\x60'.repeat(Math.max(3,...(source.match(/\x60+/g)||[]).map(x=>x.length+1)));
    ed.replaceSelection(fence+'\n'+source.replace(/\n$/,'')+'\n'+fence);
   }],
   ['toggle-comment','Alternar comentário %%','Toggle %% comment',(ed)=>{
    const source=ed.getSelection();
    if(!source)return;
    const trimmed=source.trim();
    ed.replaceSelection(trimmed.startsWith('%%')&&trimmed.endsWith('%%')?trimmed.slice(2,-2):'%%'+source+'%%');
   }],
   ['select-paragraph','Selecionar parágrafo','Select paragraph',(ed)=>{
    let from=ed.getCursor().line,to=from;
    while(from>0&&ed.getLine(from-1).trim())from--;
    while(to+1<ed.lineCount()&&ed.getLine(to+1).trim())to++;
    ed.setSelection({line:from,ch:0},{line:to,ch:ed.getLine(to).length});
   }]
  ];
  for(const [id,pt,en,action] of commands)p.addCommand({id:'v5-easy-'+id,name:'Easy Typing: '+writerUi(pt,en),editorCheckCallback:(checking,editor)=>{
   if(!this.active())return false;
   if(!checking)action(editor);return true;
  }});
  p.addCommand({id:'v5-easy-toggle',name:writerUi('Easy Typing: alternar assistentes','Easy Typing: toggle helpers'),callback:async()=>{
   this.cfg.enabled=!this.cfg.enabled;await p.saveSettings();
   new Notice('Easy Typing: '+(this.cfg.enabled?writerUi('ativado','on'):writerUi('desativado','off')));
  }});
  const {keymap,EditorView}=require('@codemirror/view');
  const bindings=[
   {key:'Tab',run:view=>{
    if(!this.active()||!this.cfg.tabOut||view.state.selection.ranges.length!==1)return false;
    const selection=view.state.selection.main;
    if(!selection.empty)return false;
    const line=view.state.doc.lineAt(selection.head);
    const jump=writerEasyTabOut(line.text,selection.head-line.from);
    if(!jump)return false;
    view.dispatch({selection:{anchor:selection.head+jump},scrollIntoView:true});return true;
   }},
   {key:'Backspace',run:view=>{
    if(!this.active()||!this.cfg.smartBackspace||view.state.selection.ranges.length!==1)return false;
    const selection=view.state.selection.main;
    if(!selection.empty)return false;
    const line=view.state.doc.lineAt(selection.head),col=selection.head-line.from;
    if(writerTypingUnsafeContext(view.state,selection.head,line.text.slice(0,col)))return false;
    const change=writerEasyBackspacePrefix(line.text,col);
    if(!change)return false;
    view.dispatch({changes:{from:line.from,to:line.from+col,insert:''},selection:{anchor:line.from}});
    return true;
   }}
  ];
  if(keymap?.of)p.registerEditorExtension(keymap.of(bindings));
  if(EditorView?.clipboardInputFilter?.of)p.registerEditorExtension(EditorView.clipboardInputFilter.of((text,state)=>{
   if(!this.active()||!this.cfg.smartPaste||state.selection.ranges.length!==1)return text;
   const line=state.doc.lineAt(state.selection.main.head),col=state.selection.main.head-line.from;
   if(writerTypingUnsafeContext(state,state.selection.main.head,line.text.slice(0,col)))return text;
   let output=writerEasyPaste(text,line.text.slice(0,col),this.cfg);
   if(this.cfg.autoFormatPaste)output=writerEasyProseFormat(output,this.cfg);
   return output;
  }));
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Easy Typing · digitação eficiente','Easy Typing · editing assistance')});
  panel.createEl('p',{text:writerUi('Tab e Backspace inteligentes, colagem em listas, substituições literais e comandos manuais. Sem a antiga toolbar.','Tab and Backspace helpers, smart list pasting, literal rules and editor commands; no retired toolbar.'),cls:'dictionary-muted'});
  for(const [key,pt,en] of [
   ['enabled','Ativar Easy Typing','Enable Easy Typing'],['tabOut','Tab sai de símbolos pareados','Tab moves past paired symbols'],
   ['smartPaste','Colagem inteligente em listas e citações','Smart paste in lists and quotes'],
   ['smartBackspace','Backspace em itens vazios','Smart Backspace for empty list items'],
   ['autoCapitalize','Maiúsculas no início de frases','Auto capitalize sentences'],
   ['cjkSpacing','Espaçamento entre CJK e alfanuméricos','CJK/Latin spacing'],
   ['inlineSpacing','Espaçamento ao formatar código inline','Space inline code when formatting'],
   ['autoFormatPaste','Formatar texto colado','Format pasted text']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(this.cfg[key]).onChange(async v=>{this.cfg[key]=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Pastas/arquivos excluídos','Excluded folders/files'))
   .setDesc(writerUi('Um caminho por linha.','One path per line.'))
   .addTextArea(t=>{t.inputEl.rows=3;t.setValue(this.cfg.excludedPaths).onChange(async v=>{this.cfg.excludedPaths=v.slice(0,4096);await this.plugin.saveSettings();});});
  new Setting(panel).setName(writerUi('Substituições literais','Literal replacement rules'))
   .setDesc(writerUi('Uma por linha: origem|destino. Sem regex ou JavaScript.','One per line: source|replacement; no regex or JavaScript.'))
   .addTextArea(t=>{t.inputEl.rows=5;t.setValue(this.cfg.customReplacements.map(x=>x.from+'|'+x.to).join('\n')).onChange(async v=>{
    this.cfg.customReplacements=v.split(/\r?\n/).slice(0,50).map(line=>{
     const split=line.indexOf('|');
     return split>0?{from:line.slice(0,split).trim(),to:line.slice(split+1),enabled:true}:null;
    }).filter(Boolean).filter(x=>x.from&&x.from.length<=80&&x.to.length<=300);
    await this.plugin.saveSettings();
   });});
 }
}
