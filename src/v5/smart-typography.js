'use strict';
/* Basic AI v5: original Smart Typography implementation, scoped to prose input. */
const WRITER_TYPO_DEFAULTS={
 enabled:true,curlyQuotes:true,dashes:true,ellipsis:true,arrows:true,comparisons:true,
 fractions:false,guillemets:false,skipEnDash:true,smartApostrophes:true,
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
 for(const key of ['enabled','curlyQuotes','dashes','ellipsis','arrows','comparisons','fractions','guillemets','skipEnDash','smartApostrophes'])cfg[key]=cfg[key]===true;
 for(const key of ['openDouble','closeDouble','openSingle','closeSingle','openGuillemet','closeGuillemet','leftArrow','rightArrow'])
  if(typeof cfg[key]!=='string'||!cfg[key]||cfg[key].length>8)cfg[key]=WRITER_TYPO_DEFAULTS[key];
 return cfg;
}
function writerTypoAtInput(before,typed,cfg){
 if(!typed||typed.length!==1||!cfg?.enabled)return null;
 const put=(needle,output)=>({consume:needle.length,text:output});
 if(cfg.dashes&&typed==='-'){
  if(before.endsWith('—-'))return put('—-','---');
  if(before.endsWith('–-'))return put('–-','—');
  if(before.endsWith('--'))return put('--',cfg.skipEnDash?'—':'–');
 }
 if(cfg.ellipsis&&typed==='.'&&before.endsWith('...'))return put('...','…');
 if(cfg.guillemets&&typed==='< ' .trim()&&before.endsWith('<<'))return put('<<',cfg.openGuillemet);
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
  const previous=before.at(-2)||'',prior=before.slice(0,-1);
  if(isSingle&&cfg.smartApostrophes&&/[\p{L}\p{N}]/u.test(previous))return put(typed,closing);
  const opener=!previous||/[\s([{<—–«“‘]/u.test(previous);
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
 const lines=writerTypoProtectedText(text);
 return lines.map(({text:line,protected:blocked})=>{
  if(blocked)return line;
  let output='',inCode=false,codeRun=0,linkDepth=0;
  for(let i=0;i<line.length;i++){
   const c=line[i];
   if(c==='\x60'){
    const matched=/^\x60+/.exec(line.slice(i));const n=matched[0].length;
    if(!inCode){inCode=true;codeRun=n;}else if(n===codeRun){inCode=false;codeRun=0;}
    output+=matched[0];i+=n-1;continue;
   }
   if(c==='['||c===']'||c==='('&&line[i-1]===']')linkDepth=Math.max(0,linkDepth+(c==='['||c==='('?1:-1));
   if(inCode||linkDepth>0||c==='\\'){output+=c;if(c==='\\'&&i+1<line.length)output+=line[++i];continue;}
   const candidate=writerTypoAtInput(output+c,c,cfg);
   if(candidate){output=output.slice(0,output.length+1-candidate.consume)+candidate.text;}
   else output+=c;
  }
  return output;
 }).join('\n');
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
  const {EditorState}=require('@codemirror/state');
  if(!EditorState?.transactionFilter?.of)return;
  p.registerEditorExtension(EditorState.transactionFilter.of(tr=>{
   if(!tr.docChanged||!tr.isUserEvent?.('input.type')||tr.isUserEvent?.('input.type.compose')||!tr.changes?.iterChanges)return tr;
   if(!this.active()&&!p.writerEasyTyping?.active())return tr;
   const edits=[];
   tr.changes.iterChanges((fromA,toA,fromB,toB,inserted)=>{
    const character=inserted.toString();
    if(character.length!==1||fromA!==toA)return;
    const doc=tr.newDoc;
    const line=doc.lineAt(Math.min(toB,doc.length));
    const priorLine=doc.sliceString(line.from,toB);
    if(writerTypingUnsafeContext(tr.startState,fromA,priorLine))return;
    let proposal=null;
    if(this.active())proposal=writerTypoAtInput(priorLine,character,this.cfg);
    if(!proposal&&p.writerEasyTyping?.active())
     proposal=writerEasyTypingAtInput(priorLine,character,p.writerEasyTyping.cfg);
    if(proposal&&proposal.consume>0&&proposal.consume<=priorLine.length)
     edits.push({from:toB-proposal.consume,to:toB,insert:proposal.text});
   });
   if(!edits.length)return tr;
   edits.sort((a,b)=>a.from-b.from);
   if(edits.some((e,i)=>i>0&&e.from<edits[i-1].to))return tr;
   return [tr,{changes:edits,sequential:true}];
  }));
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Smart Typography · tipografia','Smart Typography')});
  panel.createEl('p',{text:writerUi('Substituições somente durante digitação em prosa. Código, fórmulas, URLs e outros contextos estruturados são ignorados sempre que detectados.','Replacements while typing prose; recognized code, math and structured contexts are skipped.'),cls:'dictionary-muted'});
  for(const [key,pt,en] of [
   ['enabled','Ativar Smart Typography','Enable Smart Typography'],['curlyQuotes','Aspas curvas e apóstrofos','Curly quotes and apostrophes'],
   ['dashes','Travessões e meia-risca','Dashes'],['ellipsis','Reticências (...)','Ellipsis (...)'],
   ['arrows','Setas (->, <-)','Arrows (->, <-)'],['comparisons','Comparações (>=, <=, /=)','Comparisons'],
   ['fractions','Frações (1/2, 3/4)','Fractions'],['guillemets','Aspas angulares (<<, >>)','Guillemets'],
   ['skipEnDash','Converter -- diretamente em travessão','Convert -- directly to em dash'],
   ['smartApostrophes','Reconhecer apóstrofos em palavras','Smart apostrophes']
  ])new Setting(panel).setName(writerUi(pt,en)).addToggle(t=>t.setValue(this.cfg[key]).onChange(async value=>{this.cfg[key]=value;await this.plugin.saveSettings();}));
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
 const ticks=(line.match(/(?<!\\)\x60/g)||[]).length;
 if(ticks%2!==0)return true;
 if(/(?:https?:\/\/|obsidian:\/\/|www\.|mailto:)\S*$/i.test(line))return true;
 if(/(?:!?\[[^\]]*\]\([^)]*|\[\[[^\]]*|\$\$?[^$]*)$/.test(line))return true;
 try{
  const {syntaxTree}=require('@codemirror/language');
  const tree=typeof syntaxTree==='function'&&state?syntaxTree(state):null;
  if(tree){
   for(let node=tree.resolveInner(Math.max(0,from-1),1);node;node=node.parent)
    if(/Code|Math|Frontmatter|YAML|Link|URL|HTML|Comment|Tag/i.test(node.name||''))return true;
  }
 }catch(_){}
 return false;
}
