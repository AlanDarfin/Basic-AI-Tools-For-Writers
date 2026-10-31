'use strict';
/* Basic AI v5 — original, desktop-first editor navigation inspired by IDE workflows. */
const WRITER_KEYSHOTS_DEFAULTS={enabled:true,shortcuts:true,preset:'vscode'};
const WRITER_KEYSHOTS_ACTIONS=[
 ['move-up','Mover linha(s) para cima','Move line(s) up'],
 ['move-down','Mover linha(s) para baixo','Move line(s) down'],
 ['duplicate-up','Duplicar linha(s) acima','Duplicate line(s) above'],
 ['duplicate-down','Duplicar linha(s) abaixo','Duplicate line(s) below'],
 ['insert-above','Inserir linha acima','Insert line above'],
 ['insert-below','Inserir linha abaixo','Insert line below'],
 ['delete-line','Excluir linha(s)','Delete line(s)'],
 ['join-lines','Unir linhas selecionadas','Join selected lines'],
 ['sort-lines','Ordenar linhas selecionadas','Sort selected lines'],
 ['uppercase','Converter seleção em maiúsculas','Uppercase selection'],
 ['lowercase','Converter seleção em minúsculas','Lowercase selection'],
 ['titlecase','Converter seleção em título','Title-case selection'],
 ['add-cursor-up','Adicionar cursor acima','Add cursor above'],
 ['add-cursor-down','Adicionar cursor abaixo','Add cursor below']
];
function writerKeyshotsMerge(settings){
 const old=settings.keyshots&&typeof settings.keyshots==='object'&&!Array.isArray(settings.keyshots)?settings.keyshots:{};
 settings.keyshots={...WRITER_KEYSHOTS_DEFAULTS,...old};
 settings.keyshots.enabled=settings.keyshots.enabled!==false;
 settings.keyshots.shortcuts=settings.keyshots.shortcuts!==false;
 if(!['vscode','jetbrains','none'].includes(settings.keyshots.preset))settings.keyshots.preset='vscode';
 return settings.keyshots;
}
function writerKeyshotsSelectionLines(editor){
 const from=editor.getCursor('from'),to=editor.getCursor('to');
 const end=Math.max(from.line,to.line-(to.ch===0&&to.line>from.line?1:0));
 return {start:from.line,end,from,to};
}
function writerKeyshotsLineAction(editor,action){
 if(!editor||typeof editor.getLine!=='function')return false;
 const {start,end,from,to}=writerKeyshotsSelectionLines(editor);
 const last=editor.lineCount()-1;
 const lines=[];for(let i=start;i<=end;i++)lines.push(editor.getLine(i));
 const block=lines.join('\n');
 const set=(first,lastLine)=>{
  const a={line:Math.min(first,lastLine),ch:from.ch};
  const b={line:Math.max(first,lastLine),ch:to.ch};
  if(from.line===to.line&&from.ch===to.ch)editor.setCursor({line:first,ch:Math.min(from.ch,(editor.getLine(first)||'').length)});
  else editor.setSelection(a,b);
 };
 if(action==='move-up'&&start>0){
  const prev=editor.getLine(start-1);
  editor.replaceRange(block+'\n'+prev,{line:start-1,ch:0},{line:end,ch:editor.getLine(end).length});
  set(start-1,end-1);return true;
 }
 if(action==='move-down'&&end<last){
  const next=editor.getLine(end+1);
  editor.replaceRange(next+'\n'+block,{line:start,ch:0},{line:end+1,ch:next.length});
  set(start+1,end+1);return true;
 }
 if(action==='duplicate-up'){
  editor.replaceRange(block+'\n',{line:start,ch:0});
  set(start,end);return true;
 }
 if(action==='duplicate-down'){
  editor.replaceRange('\n'+block,{line:end,ch:editor.getLine(end).length});
  set(start+end-start+1,end+end-start+1);return true;
 }
 if(action==='insert-above'){
  editor.replaceRange('\n',{line:from.line,ch:0});
  editor.setCursor({line:from.line,ch:0});return true;
 }
 if(action==='insert-below'){
  const line=to.line;
  editor.replaceRange('\n',{line,ch:editor.getLine(line).length});
  editor.setCursor({line:line+1,ch:0});return true;
 }
 if(action==='delete-line'){
  if(end<last)editor.replaceRange('',{line:start,ch:0},{line:end+1,ch:0});
  else if(start>0)editor.replaceRange('',{line:start-1,ch:editor.getLine(start-1).length},{line:end,ch:editor.getLine(end).length});
  else editor.replaceRange('',{line:0,ch:0},{line:0,ch:editor.getLine(0).length});
  editor.setCursor({line:Math.min(start,Math.max(0,editor.lineCount()-1)),ch:0});return true;
 }
 if(action==='join-lines'){
  const final=Math.max(end,Math.min(last,start+1));
  if(final===start)return false;
  const text=Array.from({length:final-start+1},(_,i)=>editor.getLine(start+i).trim()).join(' ');
  editor.replaceRange(text,{line:start,ch:0},{line:final,ch:editor.getLine(final).length});
  editor.setCursor({line:start,ch:text.length});return true;
 }
 if(action==='sort-lines'){
  if(end<=start)return false;
  const sorted=[...lines].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  editor.replaceRange(sorted.join('\n'),{line:start,ch:0},{line:end,ch:editor.getLine(end).length});
  editor.setSelection({line:start,ch:0},{line:end,ch:sorted.at(-1).length});return true;
 }
 return false;
}
function writerKeyshotsCaseAction(editor,action){
 const selection=editor?.getSelection?.();
 if(!selection)return false;
 let next=selection;
 if(action==='uppercase')next=selection.toLocaleUpperCase();
 else if(action==='lowercase')next=selection.toLocaleLowerCase();
 else if(action==='titlecase')next=selection.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase());
 else return false;
 editor.replaceSelection(next,'around');return true;
}
function writerKeyshotsAddCursor(cm,direction){
 if(!cm?.state?.selection||!cm?.state?.doc)return false;
 const {EditorSelection}=require('@codemirror/state');
 const ranges=cm.state.selection.ranges,extra=[];
 const doc=cm.state.doc;
 for(const range of ranges){
  const line=doc.lineAt(range.head),n=line.number+direction;
  if(n<1||n>doc.lines)continue;
  const target=doc.line(n),column=range.head-line.from;
  extra.push(EditorSelection.cursor(target.from+Math.min(column,target.length)));
 }
 if(!extra.length)return false;
 cm.dispatch({selection:EditorSelection.create([...ranges,...extra],Math.min(ranges.length+extra.length-1,ranges.length))});
 cm.focus();return true;
}
function writerKeyshotsBindings(preset){
 const vscode=[
  ['Alt-ArrowUp','move-up'],['Alt-ArrowDown','move-down'],
  ['Shift-Alt-ArrowUp','duplicate-up'],['Shift-Alt-ArrowDown','duplicate-down'],
  ['Mod-Shift-Enter','insert-above'],['Mod-Enter','insert-below'],
  ['Mod-Shift-k','delete-line'],['Mod-j','join-lines'],
  ['Mod-Alt-ArrowUp','add-cursor-up'],['Mod-Alt-ArrowDown','add-cursor-down']
 ];
 const jetbrains=[
  ['Shift-Alt-ArrowUp','move-up'],['Shift-Alt-ArrowDown','move-down'],
  ['Mod-Alt-Enter','insert-above'],['Shift-Enter','insert-below'],
  ['Mod-Shift-j','join-lines'],['Mod-Alt-ArrowUp','add-cursor-up'],
  ['Mod-Alt-ArrowDown','add-cursor-down']
 ];
 return preset==='jetbrains'?jetbrains:preset==='vscode'?vscode:[];
}
class WriterKeyshots{
 constructor(plugin){this.plugin=plugin;}
 get cfg(){return this.plugin.settings.keyshots;}
 available(){return !this.plugin.app.isMobile&&writerModuleOn(this.plugin,'keyshots')&&this.cfg.enabled;}
 perform(action,editor,view){
  if(!this.available())return false;
  if(action.startsWith('add-cursor-'))return writerKeyshotsAddCursor(view?.editor?.cm||editor?.cm,action.endsWith('up')?-1:1);
  return writerKeyshotsLineAction(editor,action)||writerKeyshotsCaseAction(editor,action);
 }
 register(){
  const p=this.plugin;
  for(const [id,pt,en] of WRITER_KEYSHOTS_ACTIONS){
   p.addCommand({id:'v5-keyshots-'+id,name:'Keyshots: '+writerUi(pt,en),
    editorCheckCallback:(checking,editor,view)=>{
     if(!this.available()||!editor)return false;
     if(!checking)this.perform(id,editor,view);
     return true;
    }});
  }
  const {keymap}=require('@codemirror/view');
  const map=[...writerKeyshotsBindings('vscode'),...writerKeyshotsBindings('jetbrains')]
   .filter(([key],i,all)=>all.findIndex(([other])=>key===other)===i)
   .map(([key])=>({key,run:cm=>{
    if(!this.available()||!this.cfg.shortcuts)return false;
    const action=new Map(writerKeyshotsBindings(this.cfg.preset)).get(key);
    if(!action)return false;
    const markdown=p.app.workspace.getActiveViewOfType(MarkdownView);
    if(markdown?.editor?.cm!==cm)return false;
    return this.perform(action,markdown.editor,markdown);
   }}));
  const {EditorState}=require('@codemirror/state');
  if(EditorState?.allowMultipleSelections?.of)p.registerEditorExtension(EditorState.allowMultipleSelections.of(true));
  if(keymap?.of)p.registerEditorExtension(keymap.of(map));
 }
 renderSettings(panel){
  panel.createEl('h3',{text:writerUi('Keyshots · navegação por teclado','Keyshots · keyboard navigation')});
  panel.createEl('p',{text:writerUi('Comandos para mover, duplicar, inserir e organizar linhas. Funciona somente no editor desktop. Os atalhos podem ser alterados nas configurações de teclas do Obsidian.','Desktop-only commands to move, duplicate, insert and organize lines. Assign custom shortcuts in Obsidian Hotkeys.'),cls:'dictionary-muted'});
  new Setting(panel).setName(writerUi('Ativar comandos de teclado','Enable keyboard commands'))
   .addToggle(t=>t.setValue(this.cfg.enabled).onChange(async v=>{this.cfg.enabled=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Usar atalhos de editor','Use editor shortcuts'))
   .addToggle(t=>t.setValue(this.cfg.shortcuts).onChange(async v=>{this.cfg.shortcuts=v;await this.plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Perfil de atalhos','Shortcut profile'))
   .setDesc(writerUi('Nenhum = apenas comandos do Obsidian. Se outra extensão usar o mesmo atalho, escolha Nenhum.','None = Obsidian commands only. Choose None if another plugin owns the same shortcuts.'))
   .addDropdown(d=>d.addOption('vscode','VS Code').addOption('jetbrains','JetBrains').addOption('none',writerUi('Nenhum','None'))
    .setValue(this.cfg.preset).onChange(async v=>{this.cfg.preset=v;await this.plugin.saveSettings();}));
 }
}
