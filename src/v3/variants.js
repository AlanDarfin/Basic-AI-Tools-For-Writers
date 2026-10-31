'use strict';
/* Basic AI v3: inline writing alternatives inspired by VariantEditor. */
class WriterVariants{
 constructor(plugin){this.plugin=plugin;}
 get options(){return this.plugin.settings.variants||WRITER_V3_DEFAULTS.variants;}
 active(){
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view?.file||!view?.editor||view.file.extension!=='md')return null;
  return {file:view.file,editor:view.editor};
 }
 atCaret(){
  const active=this.active();if(!active)return null;
  const pos=active.editor.getCursor(),offset=active.editor.posToOffset(pos);
  const found=writerVariantAt(active.editor.getValue(),offset);
  return found?{...active,found}:null;
 }
 async createFromSelection(){
  if(!this.options.enabled)return new Notice(writerUi("Ative Variantes nas configurações.","Enable Variants in settings."));
  const active=this.active();if(!active)return new Notice(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
  const text=active.editor.getSelection();
  if(!text){if(this.atCaret())return this.open();return new Notice(writerUi("Selecione uma palavra ou trecho para criar variantes.","Select a word or passage to create variants."));}
  if(text.length>16000)return new Notice(writerUi('Selecione um trecho menor.','Select a shorter passage.'));
  const from=active.editor.posToOffset(active.editor.getCursor('from'));
  const to=active.editor.posToOffset(active.editor.getCursor('to'));
  const modal=new Modal(this.plugin.app);let alternative='';
  modal.onOpen=()=>{
   modal.setTitle(writerUi("Criar variantes de escrita","Create writing variants"));
   modal.contentEl.createEl('p',{text:'Original: '+text.slice(0,400)});
   new Setting(modal.contentEl).setName(writerUi('Primeira alternativa','First alternative')).addTextArea(t=>{t.inputEl.rows=4;t.setValue(alternative).onChange(v=>alternative=v);});
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi("Criar variantes","Create variants")).setCta().onClick(async()=>{
    if(!alternative.trim()||alternative===text)return new Notice(writerUi('Escreva uma alternativa diferente.','Enter a different alternative.'));
    try{await writerSafeReplace(this.plugin,active.file,from,to,text,writerEncodeVariant([text,alternative],0),writerUi('criar variantes','create variants'));modal.close();}
    catch(e){new Notice(e.message);}
   }));
  };modal.open();
 }
 async addFromReview(file,source,match,replacement){
  if(!this.options.enabled)return new Notice(writerUi("Ative Variantes nas configurações.","Enable Variants in settings."));
  const from=match.offset,to=from+match.length,original=source.slice(from,to);
  if(!original||typeof replacement!=='string'||!replacement.trim())return new Notice(writerUi("Sugestão inválida.","Invalid suggestion."));
  if(/^\s*$/.test(original)||/[{}|]/.test(replacement))return new Notice(writerUi("A sugestão contém caracteres de controle. Use o editor de variantes.","The suggestion contains control characters. Use the variant editor."));
  try{await writerSafeReplace(this.plugin,file,from,to,original,writerEncodeVariant([original,replacement],0),writerUi('criar variante da revisão','create review variant'));
   new Notice(writerUi('Variante adicionada sem descartar o original.','Variant added without discarding the original.'));
  }catch(e){new Notice(e.message);}
 }
 async replace(found,newOptions,active,commit=false,file){
  const selected=file||this.active()?.file;
  if(!selected||!found)return;
  const replacement=commit?newOptions[active]:writerEncodeVariant(newOptions,active);
  await writerSafeReplace(this.plugin,selected,found.from,found.to,found.raw,replacement,commit?'confirmar variante':'editar variantes');
 }
 async open(){
  if(!this.options.enabled)return new Notice(writerUi("Ative Variantes nas configurações.","Enable Variants in settings."));
  const current=this.atCaret();
  if(!current)return new Notice(writerUi("Posicione o cursor dentro de uma expressão de variantes.","Place the cursor inside a variant expression."));
  const {found,file}=current;
  if(this.plugin.closeReviewPopup)this.plugin.closeReviewPopup();
  const modal=new Modal(this.plugin.app);
  let items=[...found.variants],selected=found.active;
  const render=()=>{
   modal.contentEl.empty();modal.setTitle(writerUi('Editar variantes','Edit variants'));
   modal.contentEl.createEl('p',{text:writerUi("Escolha a alternativa que ficará visível ou edite as opções. Nenhuma alteração acontece até salvar.","Choose the visible alternative or edit the options. Nothing changes until you save.")});
   items.forEach((value,i)=>{
    const box=modal.contentEl.createDiv({cls:'writer-variant-option'});
    const header=box.createDiv({cls:'writer-variant-option-header'});
    header.createEl('button',{text:(selected===i?'● ':'○ ')+(i+1),attr:{'aria-label':writerUi('Selecionar alternativa ','Select alternative ')+(i+1)}}).addEventListener('click',()=>{selected=i;render();});
    for(const [label,delta] of [['↑',-1],['↓',1]]){
     header.createEl('button',{text:label,attr:{'aria-label':label==='↑'?writerUi('Mover para cima','Move up'):writerUi('Mover para baixo','Move down')}}).addEventListener('click',()=>{
      const n=i+delta;if(n<0||n>=items.length)return;
      const tmp=items[i];items[i]=items[n];items[n]=tmp;
      if(selected===i)selected=n;else if(selected===n)selected=i;render();
     });
    }
    header.createEl('button',{text:'×',attr:{'aria-label':writerUi('Excluir alternativa','Delete alternative')}}).addEventListener('click',()=>{
     if(items.length<=2)return new Notice(writerUi('Mantenha ao menos duas alternativas.','Keep at least two alternatives.'));
     items.splice(i,1);if(selected>=items.length)selected=items.length-1;render();
    });
    const textarea=box.createEl('textarea',{cls:'writer-variant-textarea'});
    textarea.value=value;textarea.addEventListener('input',()=>{items[i]=textarea.value;});
   });
   const actions=modal.contentEl.createDiv({cls:'writer-variant-actions'});
   actions.createEl('button',{text:writerUi('+ Alternativa','+ Alternative')}).addEventListener('click',()=>{items.push('');render();});
   actions.createEl('button',{text:writerUi("Salvar","Save"),cls:'mod-cta'}).addEventListener('click',async()=>{
    try{if(items.some(x=>!x.trim()))throw Error(writerUi('Preencha todas as alternativas.','Fill in every alternative.'));
     await this.replace(found,items,selected,false,file);modal.close();new Notice(writerUi('Variantes salvas.','Variants saved.'));
    }catch(e){new Notice(e.message);}
   });
   actions.createEl('button',{text:writerUi("Confirmar escolhida","Commit selected")}).addEventListener('click',async()=>{
    try{await this.replace(found,items,selected,true,file);modal.close();}
    catch(e){new Notice(e.message);}
   });
  };
  modal.onOpen=render;modal.open();
 }
 async step(delta){
  const current=this.atCaret();if(!current)return new Notice(writerUi('Posicione o cursor numa variante.','Place the cursor on a variant.'));
  const found=current.found,index=(found.active+delta+found.variants.length)%found.variants.length;
  try{await this.replace(found,found.variants,index,false,current.file);}
  catch(e){new Notice(e.message);}
 }
 async commit(){
  const current=this.atCaret();if(!current)return new Notice(writerUi('Nenhuma variante sob o cursor.','No variant under the cursor.'));
  try{await this.replace(current.found,current.found.variants,current.found.active,true,current.file);}
  catch(e){new Notice(e.message);}
 }
 async commitAll(){
  const active=this.active();if(!active)return new Notice(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
  const text=active.editor.getValue(),items=writerParseVariants(text);
  if(!items.length)return new Notice(writerUi("Esta nota não contém variantes.","This note has no variants."));
  const run=async()=>{
   let result=text;
   for(const item of [...items].reverse())result=result.slice(0,item.from)+item.variants[item.active]+result.slice(item.to);
   try{await writerSafeReplace(this.plugin,active.file,0,text.length,text,result,writerUi('confirmar todas as variantes','confirm all variants'));new Notice(items.length+writerUi(' variantes confirmadas.',' variants confirmed.'));}
   catch(e){new Notice(e.message);}
  };
  if(!this.options.confirmAll)return run();
  const modal=new Modal(this.plugin.app);modal.onOpen=()=>{
   modal.setTitle(writerUi('Confirmar todas as variantes','Confirm all variants'));
   modal.contentEl.createEl('p',{text:writerUi('Substituir ','Replace ')+items.length+writerUi(' expressão(ões) pelas alternativas escolhidas? Um snapshot será criado antes, se a opção estiver ativa.',' expression(s) with the selected alternatives? A snapshot will be created first if enabled.')});
   new Setting(modal.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>modal.close())).addButton(b=>b.setButtonText(writerUi('Confirmar','Confirm')).setWarning().onClick(async()=>{modal.close();await run();}));
  };modal.open();
 }
 async aiAlternatives(){
  if(!this.options.enabled)return new Notice(writerUi('Ative Variantes.','Enable Variants.'));
  const active=this.active();if(!active)return new Notice(writerUi("Abra uma nota Markdown.","Open a Markdown note."));
  const selected=active.editor.getSelection();if(!selected||selected.length>6000)return new Notice(writerUi("Selecione um trecho de até 6000 caracteres.","Select a passage of up to 6000 characters."));
  const from=active.editor.posToOffset(active.editor.getCursor('from')),to=active.editor.posToOffset(active.editor.getCursor('to'));
  try{
   new Notice(writerUi('Gerando alternativas com o provedor de IA configurado…','Generating alternatives with the configured AI provider…'));
   const prompt=this.options.aiPrompt||WRITER_V3_DEFAULTS.variants.aiPrompt;
   const response=await this.plugin.generateWriting(prompt,selected);
   const alternatives=response.split(/\n+/).map(x=>x.replace(/^\s*(?:[-*]|\d+[.)])\s*/,'').trim()).filter(x=>x&&x!==selected).slice(0,5);
   if(!alternatives.length)throw Error(writerUi('A IA não retornou alternativas válidas.','The AI did not return valid alternatives.'));
   await writerSafeReplace(this.plugin,active.file,from,to,selected,writerEncodeVariant([selected,...alternatives]),'inserir variantes da IA');
   new Notice(writerUi('Alternativas adicionadas como variantes.','Alternatives added as variants.'));
  }catch(e){new Notice(writerUi("Não foi possível gerar variantes: ","Could not generate variants: ")+e.message);}
 }
 editorExtension(){
  const plugin=this.plugin;
  return ViewPlugin.fromClass(class{
   constructor(view){this.view=view;this.decorations=this.build();this.onPointerUp=e=>{
    if(!plugin.settings.variants?.enabled)return;
    if(!e.target?.closest?.('.writer-variant-mark'))return;
    const p=this.view.posAtCoords({x:e.clientX,y:e.clientY});
    const md=plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if(p===null||md?.editor?.cm!==this.view)return;
    md.editor.setCursor(md.editor.offsetToPos(p));
    plugin.writerVariants.open();
   };view.dom.addEventListener('pointerup',this.onPointerUp);}
   update(update){if(update.docChanged||update.viewportChanged)this.decorations=this.build();}
   build(){
    if(!plugin.settings?.variants?.enabled||plugin.settings.variants.decorate===false)return Decoration.none;
    const text=this.view.state.doc.toString(),variants=writerParseVariants(text).slice(0,500);
    const ranges=variants.filter(v=>v.to<=text.length).map(v=>Decoration.mark({class:'writer-variant-mark',attributes:{title:writerUi('Alternativa ','Alternative ')+(v.active+1)+writerUi(' de ',' of ')+v.variants.length+writerUi(' · toque para editar',' · tap to edit')}}).range(v.from,v.to));
    return Decoration.set(ranges,true);
   }
   destroy(){this.view.dom.removeEventListener('pointerup',this.onPointerUp);}
  },{decorations:v=>v.decorations});
 }
}
