'use strict';
/* Basic AI v5: bounded regex rules and navigation snippets; no user-authored JS execution. */
const WRITER_EASY_ADV_DEFAULTS={regexRules:[],snippets:[
 {name:'Diálogo',body:'— ${1:fala}\n${0}'},
 {name:'Nota de pesquisa',body:'> [!note] ${1:título}\n> ${2:anotação}\n${0}'},
 {name:'Citação',body:'> ${1:trecho}\n\n— ${2:fonte}\n${0}'}
],regexEnabled:false};
function writerEasyAdvancedMerge(settings){
 const cfg=settings.easyTyping||writerEasyMerge(settings);
 cfg.regexEnabled=cfg.regexEnabled===true;
 cfg.regexRules=Array.isArray(cfg.regexRules)?cfg.regexRules.slice(0,30).filter(r=>r&&typeof r.pattern==='string'&&r.pattern.length>0&&r.pattern.length<=120&&typeof r.replace==='string'&&r.replace.length<=250&&/^[iu]*$/.test(r.flags||'')).map(r=>({pattern:r.pattern,replace:r.replace,flags:r.flags||'',enabled:r.enabled!==false})):[];
 cfg.snippets=Array.isArray(cfg.snippets)?cfg.snippets.slice(0,24).filter(s=>s&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=60&&typeof s.body==='string'&&s.body.length<=2500).map(s=>({name:s.name,body:s.body})):[...WRITER_EASY_ADV_DEFAULTS.snippets];
 return cfg;
}
function writerEasyRegexSafe(pattern){
 if(typeof pattern!=='string'||pattern.length<1||pattern.length>120)return false;
 // Reject nested repeating groups and numeric backreferences, which can cause heavy backtracking.
 if(/\\[1-9]|\(\?<[=!]|(?:\+|\*|\{\d+,?\d*\})\s*(?:\+|\*|\{)/.test(pattern))return false;
 if(/\([^)]*(?:\*|\+|\{\d+,?\d*\})[^)]*\)\s*(?:\+|\*|\{)/.test(pattern))return false;
 // Repeated groups with alternatives can be catastrophic even without nested quantifiers.
 if(/\([^)]*\|[^)]*\)\s*(?:\+|\*|\{)/.test(pattern))return false;
 return true;
}
function writerEasyRegexAtInput(before,cfg){
 if(!cfg?.regexEnabled||!cfg.enabled)return null;
 const slice=String(before).slice(-256);
 for(const rule of cfg.regexRules||[]){
  if(!rule.enabled||!writerEasyRegexSafe(rule.pattern))continue;
  try{
   const re=new RegExp('(?:'+rule.pattern+')$',(rule.flags||'').replace(/[^iu]/g,''));
   const match=re.exec(slice);
   if(!match||!match[0]||match[0].length>120)continue;
   return {consume:match[0].length,text:match[0].replace(re,rule.replace)};
  }catch(error){continue;}
 }
 return null;
}
function writerEasySnippetExpand(template){
 const source=String(template||'').slice(0,2500);
 const regex=/\$\{([0-9])(?::([^}\n]{0,120}))?\}/g;
 const stops=[];let output='',offset=0;
 for(const m of source.matchAll(regex)){
  output+=source.slice(offset,m.index);
  const from=output.length;output+=m[2]||'';
  stops.push({index:Number(m[1]),from,to:output.length});
  offset=m.index+m[0].length;
 }
 output+=source.slice(offset);
 stops.sort((a,b)=>(a.index===0?Infinity:a.index)-(b.index===0?Infinity:b.index));
 return {text:output,stops};
}
class WriterEasyAdvanced{
 constructor(plugin){this.plugin=plugin;this.sessions=new WeakMap();}
 get cfg(){return this.plugin.settings.easyTyping;}
 active(){return this.plugin.writerEasyTyping?.active()===true;}
 register(){
  const p=this.plugin;
  p.addCommand({id:'v5-easy-insert-snippet',name:writerUi('Easy Typing: inserir modelo com Tab','Easy Typing: insert navigation snippet'),editorCheckCallback:(checking)=>{
   if(!this.active()||!this.cfg.snippets.length)return false;
   if(!checking)this.openPicker();
   return true;
  }});
  const {EditorView,keymap}=require('@codemirror/view');
  if(EditorView?.updateListener?.of)
   p.registerEditorExtension(EditorView.updateListener.of(update=>{
    const s=this.sessions.get(update.view);
    if(!s)return;
    if(!this.active()||update.view.state.selection.ranges.length!==1){this.sessions.delete(update.view);return;}
    if(update.docChanged){
     for(const stop of s.stops){
      stop.from=update.changes.mapPos(stop.from,-1);
      stop.to=update.changes.mapPos(stop.to,1);
     }
    }
    // When the user navigates outside a snippet, give Tab back to Obsidian.
    const active=s.stops[s.index],selected=update.view.state.selection.main;
    if(!active||selected.from<active.from||selected.to>active.to)
     this.sessions.delete(update.view);
   }));
  if(keymap?.of)p.registerEditorExtension(keymap.of([{key:'Shift-Tab',run:view=>this.advance(view,-1)}]));
 }
 openPicker(){
  if(!this.active())return;
  const plugin=this.plugin,controller=this;
  class SnippetsPicker extends FuzzySuggestModal{
   getItems(){return controller.cfg.snippets;}
   getItemText(item){return item.name;}
   onChooseItem(item){controller.insert(item);}
  }
  new SnippetsPicker(plugin.app).open();
 }
 insert(item){
  if(!this.active())return false;
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  const cm=view?.editor?.cm;
  if(!cm)return false;
  const selection=cm.state.selection.main;
  const rendered=writerEasySnippetExpand(item.body);
  const stops=rendered.stops.map(s=>({...s,from:s.from+selection.from,to:s.to+selection.from}));
  const first=stops[0];
  cm.dispatch({
   changes:{from:selection.from,to:selection.to,insert:rendered.text},
   selection:first?{anchor:first.from,head:first.to}:{anchor:selection.from+rendered.text.length},
   scrollIntoView:true
  });
  if(stops.length)this.sessions.set(cm,{stops,index:0});
  cm.focus();return true;
 }
 advance(view,delta){
  if(!this.active())return false;
  const session=this.sessions.get(view);
  if(!session)return false;
  const index=session.index+delta;
  if(index<0)return false;
  if(index>=session.stops.length){this.sessions.delete(view);return false;}
  session.index=index;
  const stop=session.stops[index];
  view.dispatch({selection:{anchor:stop.from,head:stop.to},scrollIntoView:true});
  return true;
 }
 renderSettings(panel){
  panel.createEl('h4',{text:writerUi('Regras regex e modelos com Tab','Regex rules and Tab snippets')});
  panel.createEl('p',{text:writerUi('Regras regex são limitadas, não executam JavaScript e vêm desativadas por padrão. Modelos inseridos por comando incluem marcações ${1:texto} e ${0} para a posição final.','Regex rules are bounded, do not execute JavaScript, and default to off. Snippets use ${1:text} and ${0} cursor markers.'),cls:'dictionary-muted'});
  new Setting(panel).setName(writerUi('Ativar regras regex','Enable regex rules')).addToggle(t=>t.setValue(this.cfg.regexEnabled).onChange(async v=>{this.cfg.regexEnabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Substituições regex','Regex replacement rules'))
   .setDesc(writerUi('Uma por linha: padrão|substituição|flags (i ou u). Sem avaliação de código.','One per line: pattern|replacement|flags (i or u). No code evaluation.'))
   .addTextArea(t=>{
    t.inputEl.rows=5;
    t.setValue((this.cfg.regexRules||[]).map(x=>[x.pattern,x.replace,x.flags||''].join('|')).join('\n')).onChange(async value=>{
     this.cfg.regexRules=value.split(/\r?\n/).slice(0,30).map(line=>{
      const parts=line.split('|');
      if(parts.length<2)return null;
      const [pattern,replace,flags='']=parts;
      return writerEasyRegexSafe(pattern)&&replace.length<=250&&/^[iu]*$/.test(flags)?{pattern,replace,flags,enabled:true}:null;
     }).filter(Boolean);
     await this.plugin.saveSettings();
    });
   });
  new Setting(panel).setName(writerUi('Modelos de texto','Text snippets'))
   .setDesc(writerUi('Uma linha por modelo usando JSON com name e body. Para múltiplas linhas, use \\n no body.','One JSON object per line with name and body. Use \\n for multiline content.'))
   .addTextArea(t=>{
    t.inputEl.rows=7;
    t.setValue((this.cfg.snippets||[]).map(x=>JSON.stringify(x)).join('\n')).onChange(async value=>{
     const parsed=[];
     for(const line of value.split(/\r?\n/).slice(0,24)){
      try{const obj=JSON.parse(line);if(obj&&typeof obj.name==='string'&&obj.name&&obj.name.length<=60&&typeof obj.body==='string'&&obj.body.length<=2500)parsed.push({name:obj.name,body:obj.body});}catch(error){}
     }
     this.cfg.snippets=parsed;await this.plugin.saveSettings();
    });
   });
 }
}
