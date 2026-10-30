'use strict';
/* Live and collapsible Insta TOC built from Obsidian heading metadata. */
class WriterInstaToc{
 constructor(plugin){this.plugin=plugin;this.pending=new Map();this.processing=new Set();}
 get options(){return this.plugin.settings.instaToc;}
 headings(file){
  const opts=this.options,cache=this.plugin.app.metadataCache.getFileCache(file);
  const forbidden=String(opts.exclude||'').split(/\r?\n|,/).map(x=>x.trim().toLocaleLowerCase()).filter(Boolean);
  return (cache?.headings||[]).filter(h=>{
   const level=h.level||1;
   return level>=Math.max(1,Number(opts.minLevel)||1)&&level<=Math.min(6,Number(opts.maxLevel)||6)&&
    !/<!--\s*omit\s*-->/i.test(h.heading)&&!forbidden.includes(h.heading.trim().toLocaleLowerCase());
  }).map(h=>({...h,heading:h.heading.trim()}));
 }
 entries(file){
  return this.headings(file).map(h=>{
   const indent='  '.repeat(Math.max(0,Math.min(5,(h.level||1)-Math.max(1,Number(this.options.minLevel)||1))));
   const heading=h.heading.replace(/\|/g,'\\|').replace(/\]\]/g,'] ]');
   return indent+'- [[#'+heading+'|'+heading+']]';
  }).join('\n');
 }
 async insertBlock(){
  const view=this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if(!view?.file||!view.editor)return new Notice(w4text(this.plugin,'Abra uma nota Markdown.','Open a Markdown note.'));
  view.editor.replaceSelection('\x60\x60\x60insta-toc\n'+this.entries(view.file)+'\n\x60\x60\x60\n');
 }
 async refresh(file){
  if(!this.options.enabled||!(file instanceof TFile)||file.extension!=='md'||this.processing.has(file.path))return;
  const before=await this.plugin.app.vault.cachedRead(file);
  const fence=/^(\x60{3,})insta-toc[ \t]*\r?\n([\s\S]*?)^\1[ \t]*$/gm;
  if(!fence.test(before))return;
  this.processing.add(file.path);
  try{
   await this.plugin.app.vault.process(file,current=>current.replace(fence,(all,delimiter,body)=>{
    const retained=/^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(body)?.[0]||'';
    const entries=this.entries(file);
    return delimiter+'insta-toc\n'+retained+entries+(entries?'\n':'')+delimiter;
   }));
  }catch(e){console.warn('[Basic AI] TOC refresh:',e);}
  finally{this.processing.delete(file.path);}
 }
 schedule(file){
  if(!(file instanceof TFile)||file.extension!=='md')return;
  clearTimeout(this.pending.get(file.path));
  this.pending.set(file.path,setTimeout(()=>{
   this.pending.delete(file.path);this.refresh(file);
  },Math.max(500,Number(this.options.updateDelay)||1500)));
 }
 async render(source,el,ctx){
  const file=this.plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
  if(!(file instanceof TFile)||!this.options.enabled)return;
  const sourceSettings=/^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  let local={};try{if(sourceSettings)local=parseYaml(sourceSettings[1])||{};}catch(_){}
  const title=local?.title?.name||this.options.title;
  const min=Math.max(1,Number(local?.levels?.min)||Number(this.options.minLevel)||1);
  const max=Math.min(6,Number(local?.levels?.max)||Number(this.options.maxLevel)||6);
  const omissions=(Array.isArray(local?.omit)?local.omit:[]).map(x=>String(x).toLowerCase());
  const headings=this.headings(file).filter(h=>h.level>=min&&h.level<=max&&!omissions.includes(h.heading.toLowerCase()));
  const root=el.createDiv({cls:'writer-v4-insta-toc insta-toc-rendered'});
  root.style.setProperty('--writer-v4-toc-indent',Math.min(48,Math.max(5,Number(this.options.indent)||12))+'px');
  root.style.setProperty('--writer-v4-toc-list-style',String(this.options.listType||'circle'));
  const heading=root.createDiv({cls:'writer-v4-toc-heading'});
  heading.createEl('strong',{text:title||w4text(this.plugin,'Índice','Contents')});
  const fold=heading.createEl('button',{text:'▾',cls:'writer-v4-toc-collapse',attr:{'aria-label':w4text(this.plugin,'Recolher índice','Collapse index')}});
  const list=root.createEl('ul',{cls:'writer-v4-toc-list'});
  const stack=[{level:min-1,element:list}];
  for(const h of headings){
   while(stack.length>1&&stack.at(-1).level>=h.level)stack.pop();
   const parent=stack.at(-1).element;
   const li=parent.createEl('li',{cls:'writer-v4-toc-item'});
   const link=li.createEl('a',{text:h.heading,href:'#'+h.heading,attr:{'data-heading':h.heading}});
   link.addEventListener('click',e=>{e.preventDefault();this.plugin.app.workspace.openLinkText('#'+h.heading,file.path,false);});
   const children=li.createEl('ul');
   stack.push({level:h.level,element:children});
  }
  fold.addEventListener('click',()=>{
   const collapsed=!list.hidden;list.hidden=collapsed;fold.setText(collapsed?'▸':'▾');fold.setAttribute('aria-expanded',String(!collapsed));
  });
  if(local?.collapsed===true||this.options.collapsed){list.hidden=true;fold.setText('▸');}
  if(!headings.length)list.createEl('li',{text:w4text(this.plugin,'Nenhum título encontrado.','No headings found.')});
 }
 register(){
  const plugin=this.plugin;
  plugin.registerMarkdownCodeBlockProcessor('insta-toc',(source,el,ctx)=>this.render(source,el,ctx));
  plugin.registerEvent(plugin.app.metadataCache.on('changed',file=>this.schedule(file)));
  plugin.addCommand({id:'v4-insert-insta-toc',name:w4text(plugin,'Inserir índice automático','Insert automatic table of contents'),editorCallback:()=>this.insertBlock()});
  plugin.addCommand({id:'v4-refresh-insta-toc',name:w4text(plugin,'Atualizar índice da nota','Refresh note TOC'),callback:()=>{
   const f=plugin.app.workspace.getActiveFile();if(f)this.refresh(f);
  }});
 }
 destroy(){for(const handle of this.pending.values())clearTimeout(handle);this.pending.clear();}
}
