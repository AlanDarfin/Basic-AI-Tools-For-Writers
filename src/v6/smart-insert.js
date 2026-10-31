'use strict';
/* v6 beta4: opt-in native command palette dialogs, never a replacement toolbar. */
function writerV6InsertSnapshot(editor){
 return {content:editor.getValue(),from:editor.getCursor('from'),to:editor.getCursor('to'),selection:editor.getSelection()};
}
function writerV6InsertIfUnchanged(editor,snapshot,source){
 if(editor.getValue()!==snapshot.content){
  new Notice(writerUi('A nota mudou durante a configuração. Tente novamente.','The note changed while configuring insertion. Please retry.'));
  return false;
 }
 editor.replaceRange(source,snapshot.from,snapshot.to);
 return true;
}
function writerV6InsertValidRubyText(text){
 return typeof text==='string'&&text.length>0&&text.length<=250&&!/[\r\n{}|]/.test(text);
}
class WriterV6SmartInsert{
 constructor(plugin){this.plugin=plugin;}
 register(){
  const p=this.plugin;
  const define=(id,pt,en,fn)=>p.addCommand({id,name:writerUi(pt,en),editorCallback:editor=>fn.call(this,editor)});
  define('v6-smart-ruby','Inserção inteligente: Ruby acima ou abaixo','Smart insert: Ruby above or below',this.ruby);
  define('v6-smart-rating','Inserção inteligente: avaliação','Smart insert: rating',this.rating);
  define('v6-smart-timestamp','Inserção inteligente: data e horário Discord','Smart insert: Discord timestamp',this.timestamp);
  define('v6-smart-spoiler','Inserção inteligente: spoiler','Smart insert: spoiler',this.spoiler);
  define('v6-smart-subtext','Inserção inteligente: subtexto Discord','Smart insert: Discord subtext',this.subtext);
  define('v6-smart-menu','Inserção inteligente: escolher sintaxe','Smart insert: choose syntax',this.menu);
  p.registerEvent(p.app.workspace.on('editor-menu',(menu,editor)=>{
   menu.addItem(item=>item.setTitle(writerUi('Inserção inteligente…','Smart insertion…')).setIcon('braces').onClick(()=>this.menu(editor)));
  }));
 }
 openDialog(title,fill,apply){
  const plugin=this.plugin,modal=new Modal(plugin.app);
  modal.onOpen=()=>{
   modal.setTitle(title);
   const panel=modal.contentEl.createDiv({cls:'writer-v6-smart-insert'});
   fill(panel);
   const actions=new Setting(panel);
   actions.addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close()));
   actions.addButton(b=>b.setButtonText(writerUi('Inserir','Insert')).setCta().onClick(()=>{
    try{if(apply()!==false)modal.close();}
    catch(e){new Notice(String(e.message||e));}
   }));
  };
  modal.open();
 }
 ruby(editor){
  const snap=writerV6InsertSnapshot(editor);
  let base=snap.selection||'',reading='',position='over';
  this.openDialog(writerUi('Inserir Ruby','Insert Ruby'),panel=>{
   new Setting(panel).setName(writerUi('Texto base','Base text')).addText(t=>t.setValue(base).onChange(v=>base=v));
   new Setting(panel).setName(writerUi('Anotação','Annotation')).addText(t=>t.setPlaceholder(writerUi('Pronúncia ou comentário','Reading or note')).onChange(v=>reading=v));
   new Setting(panel).setName(writerUi('Posição','Position')).addDropdown(d=>d.addOption('over',writerUi('Acima','Above')).addOption('under',writerUi('Abaixo','Below')).setValue(position).onChange(v=>position=v));
  },()=>{
   if(!writerV6InsertValidRubyText(base)||!writerV6InsertValidRubyText(reading)){
    new Notice(writerUi('Ruby aceita texto simples em uma linha, sem chaves ou barras verticais.','Ruby accepts single-line plain text without braces or pipes.'));return false;
   }
   return writerV6InsertIfUnchanged(editor,snap,'{'+base+'|'+reading+(position==='under'?'|under':'')+'}');
  });
 }
 rating(editor){
  const snap=writerV6InsertSnapshot(editor);
  let value=3,total=5,format='star';
  this.openDialog(writerUi('Inserir avaliação','Insert rating'),panel=>{
   new Setting(panel).setName(writerUi('Valor','Value')).addSlider(s=>s.setLimits(0,10,0.5).setDynamicTooltip().setValue(value).onChange(v=>value=v));
   new Setting(panel).setName(writerUi('Máximo','Maximum')).addDropdown(d=>{
    for(let i=2;i<=10;i++)d.addOption(String(i),String(i));
    d.setValue(String(total)).onChange(v=>total=Number(v));
   });
   new Setting(panel).setName(writerUi('Símbolo','Symbol')).addDropdown(d=>{
    for(const name of ['star','heart','moon','circle','bar','custom'])d.addOption(name,name);
    d.setValue(format).onChange(v=>format=v);
   });
  },()=>writerV6InsertIfUnchanged(editor,snap,'[rating:'+Math.min(value,total)+'/'+total+':'+format+']'));
 }
 timestamp(editor){
  const snap=writerV6InsertSnapshot(editor);
  let raw='',format='f';
  this.openDialog(writerUi('Inserir data Discord','Insert Discord timestamp'),panel=>{
   new Setting(panel).setName(writerUi('Data e hora local','Local date and time')).addText(t=>{
    t.inputEl.type='datetime-local';
    const now=new Date(),pad=n=>String(n).padStart(2,'0');
    const local=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
    raw=local;t.setValue(local).onChange(v=>raw=v);
   });
   new Setting(panel).setName(writerUi('Formato','Format')).addDropdown(d=>{
    for(const [id,label] of [['t','Hora curta / Short time'],['T','Hora completa / Long time'],['d','Data curta / Short date'],['D','Data longa / Long date'],['f','Data e hora / Date and time'],['F','Data completa / Full date'],['R','Relativo / Relative']])d.addOption(id,label);
    d.setValue(format).onChange(v=>format=v);
   });
  },()=>{
   const epoch=Math.floor(new Date(raw).getTime()/1000);
   if(!Number.isFinite(epoch)||epoch<0||epoch>253402300799){
    new Notice(writerUi('Data inválida.','Invalid date.'));return false;
   }
   return writerV6InsertIfUnchanged(editor,snap,'<t:'+epoch+':'+format+'>');
  });
 }
 spoiler(editor){
  const snap=writerV6InsertSnapshot(editor);
  let text=snap.selection||'';
  this.openDialog(writerUi('Inserir spoiler','Insert spoiler'),panel=>{
   new Setting(panel).setName(writerUi('Texto oculto','Hidden text')).addTextArea(t=>t.setValue(text).onChange(v=>text=v));
  },()=>text?writerV6InsertIfUnchanged(editor,snap,'||'+text+'||'):false);
 }
 subtext(editor){
  const snap=writerV6InsertSnapshot(editor);
  let text=snap.selection||'';
  this.openDialog(writerUi('Inserir subtexto','Insert subtext'),panel=>{
   new Setting(panel).setName(writerUi('Texto','Text')).addText(t=>t.setValue(text).onChange(v=>text=v));
  },()=>{
   if(!text||/[\r\n]/.test(text))return false;
   return writerV6InsertIfUnchanged(editor,snap,'-# '+text);
  });
 }
 menu(editor){
  const menu=new Menu(this.plugin.app);
  for(const [id,pt,en] of [
   ['ruby','Ruby','Ruby'],['rating','Avaliação','Rating'],['timestamp','Data Discord','Discord timestamp'],
   ['spoiler','Spoiler','Spoiler'],['subtext','Subtexto','Subtext'],
   ['manual','Navegação manual','Manual navigation']
  ]){
   menu.addItem(item=>item.setTitle(writerUi(pt,en)).setIcon(id==='manual'?'book-open':'braces').onClick(()=>{
    if(id==='manual')this.plugin.writerBookNavigation?.insertManual(editor);
    else this[id](editor);
   }));
  }
  menu.showAtMouseEvent?.(this.plugin.app.workspace.getActiveViewOfType?.(MarkdownView)?.containerEl?.ownerDocument?.defaultView?.event);
  if(!menu.showAtMouseEvent||!this.plugin.app.workspace.getActiveViewOfType?.(MarkdownView)?.containerEl?.ownerDocument?.defaultView?.event)menu.showAtPosition({x:90,y:130});
 }
 renderSettings(panel){
  const root=panel.createDiv({cls:'writer-v6-settings-clean'});
  const section=root.createDiv({cls:'writer-v6-settings-section'});
  section.createEl('h3',{text:writerUi('Inserção inteligente','Smart insertion')});
  section.createEl('p',{cls:'dictionary-muted',text:writerUi('Use os comandos nativos do Obsidian, a paleta de comandos ou o menu do editor. Não adiciona uma barra própria.','Use native Obsidian commands, the command palette or the editor context menu. No custom toolbar is added.')});
  new Setting(section).setName(writerUi('Inserir Ruby, avaliações ou datas','Insert Ruby, ratings or dates')).addButton(b=>b.setButtonText(writerUi('Ver comandos','See commands')).onClick(()=>new Notice(writerUi('Abra a paleta de comandos e procure por “Inserção inteligente”.','Open the command palette and search for “Smart insert”.'))));
 }
}
