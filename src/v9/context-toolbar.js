'use strict';
/* v9 editing toolbar. Original implementation inspired by cMenu (MPL-2.0).
 * No cMenu source is copied. Does not replace Obsidian's mobile toolbar. */
const WRITER_V9_FORMAT_ACTIONS=[
 ['bold','bold','Negrito','Bold'],['italic','italic','Itálico','Italic'],
 ['underline','underline','Sublinhado','Underline'],['superscript','superscript','Sobrescrito','Superscript'],
 ['subscript','subscript','Subscrito','Subscript'],
 ['strike','strikethrough','Riscado','Strikethrough'],['highlight','highlighter','Realce','Highlight'],
 ['code','code','Código inline','Inline code'],['codeblock','file-code','Bloco de código','Code block'],
 ['h1','heading-1','Título 1','Heading 1'],['h2','heading-2','Título 2','Heading 2'],
 ['h3','heading-3','Título 3','Heading 3'],['h4','heading-4','Título 4','Heading 4'],
 ['h5','heading-5','Título 5','Heading 5'],['h6','heading-6','Título 6','Heading 6'],
 ['quote','quote','Citação','Quote'],
 ['bullet','list','Lista','Bullet list'],['numbered','list-ordered','Lista numerada','Numbered list'],
 ['task','list-check','Tarefa','Task'],['link','link','Link','Link'],
 ['wikilink','file-symlink','Link interno','Internal link'],['callout','message-square','Callout','Callout'],
 ['table','table','Tabela','Table'],['rule','minus','Separador','Horizontal rule'],
 ['footnote','asterisk','Nota de rodapé','Footnote'],['undo','undo-2','Desfazer','Undo'],
 ['redo','redo-2','Refazer','Redo']
];
const WRITER_V9_FORMAT_IDS=WRITER_V9_FORMAT_ACTIONS.map(x=>x[0]);
const WRITER_V9_TOOLBAR_DEFAULTS={
 enabledDesktop:true,enabledMobile:false,compact:true,placement:'bottom',
 actions:['bold','italic','underline','strike','highlight','code','h1','h2','h3','quote','bullet','numbered','task','link','wikilink','callout','table','rule','undo','redo']
};
function writerV9ToolbarMerge(settings){
 const raw=settings.v9Toolbar&&typeof settings.v9Toolbar==='object'&&!Array.isArray(settings.v9Toolbar)?settings.v9Toolbar:{};
 const cfg=settings.v9Toolbar={...WRITER_V9_TOOLBAR_DEFAULTS,...raw};
 cfg.enabledDesktop=cfg.enabledDesktop!==false;cfg.enabledMobile=cfg.enabledMobile===true;cfg.compact=cfg.compact!==false;
 cfg.placement=['top','bottom'].includes(cfg.placement)?cfg.placement:'bottom';
 cfg.actions=Array.isArray(cfg.actions)?[...new Set(cfg.actions.filter(x=>WRITER_V9_FORMAT_IDS.includes(x)))]:[...WRITER_V9_TOOLBAR_DEFAULTS.actions];
 return cfg;
}
function writerV9ToolbarAllowed(plugin){
 const cfg=plugin.settings.v9Toolbar;
 return writerModuleOn(plugin,'formatToolbar')&&(writerV8HomeIsMobile(plugin)?cfg.enabledMobile:cfg.enabledDesktop);
}
function writerV9Format(editor,action){
 if(!editor)return false;
 if(action==='undo'||action==='redo'){editor[action]?.();return true;}
 const selected=editor.getSelection(),label=selected||writerUi('texto','text');
 const replacement=(before,after,placeholder=label)=>{
  editor.replaceSelection(before+placeholder+after);
  if(!selected&&typeof editor.setSelection==='function'){
   const end=editor.getCursor(),start={line:end.line,ch:Math.max(0,end.ch-after.length-placeholder.length)};
   editor.setSelection(start,{line:end.line,ch:end.ch-after.length});
  }
 };
 const perLine=(prefix)=>{
  const text=selected||writerUi('Texto','Text');
  const value=text.split('\n').map((line,i)=>typeof prefix==='function'?prefix(line,i):prefix+line).join('\n');
  editor.replaceSelection(value);
 };
 switch(action){
 case 'bold':replacement('**','**');break;
 case 'italic':replacement('*','*');break;
 case 'underline':replacement('<u>','</u>');break;
 case 'superscript':replacement('<sup>','</sup>');break;
 case 'subscript':replacement('<sub>','</sub>');break;
 case 'strike':replacement('~~','~~');break;
 case 'highlight':replacement('==','==');break;
 case 'code':replacement(String.fromCharCode(96),String.fromCharCode(96));break;
 case 'codeblock':editor.replaceSelection('\n'+String.fromCharCode(96).repeat(3)+'\n'+(selected||'')+'\n'+String.fromCharCode(96).repeat(3)+'\n');break;
 case 'h1':perLine('# ');break;
 case 'h2':perLine('## ');break;
 case 'h3':perLine('### ');break;
 case 'h4':perLine('#### ');break;
 case 'h5':perLine('##### ');break;
 case 'h6':perLine('###### ');break;
 case 'quote':perLine('> ');break;
 case 'bullet':perLine('- ');break;
 case 'numbered':perLine((line,i)=>(i+1)+'. '+line);break;
 case 'task':perLine('- [ ] ');break;
 case 'link':editor.replaceSelection('['+label+'](https://)');break;
 case 'wikilink':editor.replaceSelection('[['+label+']]');break;
 case 'callout':editor.replaceSelection('> [!note]\n> '+(selected||writerUi('Escreva aqui','Write here')).replace(/\n/g,'\n> '));break;
 case 'table':editor.replaceSelection('| '+writerUi('Coluna 1','Column 1')+' | '+writerUi('Coluna 2','Column 2')+' |\n| --- | --- |\n| '+(selected||'')+' | |\n');break;
 case 'rule':editor.replaceSelection('\n---\n');break;
 case 'footnote':editor.replaceSelection('[^1]');break;
 default:return false;
 }
 editor.focus?.();
 return true;
}
/* Unified editor context menu. Keep Obsidian's own format menu and callbacks.
 * MenuItem.setSubmenu is not public API; fail open (leave native items intact)
 * if a future Obsidian version does not expose it. */
const WRITER_V1044_AI_MENU=[
 {key:'meaning',names:['Significado','Meaning','Definition','Definição']},
 {key:'synonyms',names:['Sinônimos','Synonyms']},
 {key:'antonyms',names:['Antônimos','Antonyms']},
 {key:'translate',names:['Tradução','Translate','Traduzir']},
 {key:'rewrite',names:['Reescrever','Rewrite','Rewrite selection']},
 {key:'smart',names:['Inserção inteligente…','Inserção inteligente...','Smart insertion…','Smart insertion...']}
];
function writerV1044MenuTitle(item){
 const value=item?.title||item?.dom?.querySelector?.('.menu-item-title')?.textContent||'';
 return typeof value==='string'?value.trim():'';
}
function writerV1044AiKey(title){
 const norm=String(title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\u2026/g,'...');
 for(const entry of WRITER_V1044_AI_MENU){
  if(entry.names.some(name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\u2026/g,'...')===norm))
   return entry.key;
 }
 return '';
}
function writerV1044MenuAdd(parent,title,icon,callback,section){
 parent.addItem(item=>{
  item.setTitle(title).setIcon(icon);
  if(section)item.setSection?.(section);
  item.onClick(callback);
 });
}
function writerV1044ContextMenus(plugin){
 plugin.registerEvent?.(plugin.app.workspace.on('editor-menu',(menu,editor)=>{
  if(!editor||!menu?.addItem||!plugin.settings.v9Toolbar)return;
  const cfg=plugin.settings.v9Toolbar;
  const items=Array.isArray(menu.items)?menu.items:[];
  const format=items.find(item=>/^(formatar|format)$/i.test(writerV1044MenuTitle(item)));
  let formatMenu=null;
  if(format&&typeof format.setSubmenu==='function'){
   // Returns the current submenu if present; does not replace built-ins.
   try{formatMenu=format.submenu||format.setSubmenu();}catch(_){}
  }
  const addFormat=parent=>{
   for(const [id,icon,pt,en] of WRITER_V9_FORMAT_ACTIONS){
    if(!['underline','superscript','subscript','highlight','codeblock',
     'h4','h5','h6','footnote','callout','table','rule'].includes(id))continue;
    writerV1044MenuAdd(parent,writerUi(pt,en),icon,()=>{
     if(writerModuleOn(plugin,'formatToolbar'))writerV9Format(editor,id);
    },'basic-format');
   }
   if(typeof writerV102AlignApply==='function'&&plugin.settings.v102Align?.enabled!==false){
    for(const [side,icon,pt,en] of [
     ['l','align-left','Alinhar à esquerda','Align left'],
     ['c','align-center','Centralizar linha/título','Center line/heading'],
     ['r','align-right','Alinhar à direita','Align right']]){
     writerV1044MenuAdd(parent,writerUi(pt,en),icon,()=>writerV102AlignApply(editor,side),'basic-align');
    }
   }
  };
  if(formatMenu)addFormat(formatMenu);
  else{
   // Compatibility fallback when Obsidian's private submenu cannot be extended.
   menu.addItem(item=>{
    item.setTitle(writerUi('Formatação do Basic','Basic formatting')).setIcon('type');
    if(typeof item.setSubmenu==='function')addFormat(item.setSubmenu());
    else item.onClick(event=>{
     const submenu=new Menu(plugin.app);addFormat(submenu);
     submenu.showAtMouseEvent?.(event);
    });
   });
  }
  // Move only Basic's own legacy AI entries, preserving original callbacks.
  // Unknown third-party items, native actions and unsupported menu internals stay intact.
  const groups={lookup:[],writing:[]};
  for(const old of [...items]){
   const key=writerV1044AiKey(writerV1044MenuTitle(old));
   if(!key||typeof old.callback!=='function')continue;
   const index=items.indexOf(old);
   if(index<0)continue;
   items.splice(index,1);
   (['meaning','synonyms','antonyms','translate'].includes(key)?groups.lookup:groups.writing)
    .push({old,key,title:writerV1044MenuTitle(old)});
  }
  if(!groups.lookup.length&&!groups.writing.length)return;
  menu.addItem(item=>{
   item.setTitle(writerUi('IA · Ferramentas','AI · Tools')).setIcon('sparkles').setSection?.('basic-ai');
   if(typeof item.setSubmenu!=='function'){
    item.onClick(event=>{
     const fallback=new Menu(plugin.app);
     for(const entry of [...groups.lookup,...groups.writing])
      writerV1044MenuAdd(fallback,entry.title,'sparkles',()=>entry.old.callback.call(entry.old,event));
     fallback.showAtMouseEvent?.(event);
    });
    return;
   }
   const ai=item.setSubmenu();
   for(const [group,title,icon] of [
    [groups.lookup,writerUi('Pesquisar e traduzir','Lookup & translate'),'search'],
    [groups.writing,writerUi('Escrever e revisar','Writing & revision'),'pencil']]){
    if(!group.length)continue;
    ai.addItem(sub=>{
     sub.setTitle(title).setIcon(icon);
     if(typeof sub.setSubmenu==='function'){
      const nested=sub.setSubmenu();
      for(const entry of group)writerV1044MenuAdd(nested,entry.title,'sparkles',
       event=>entry.old.callback.call(entry.old,event));
     }else{
      for(const entry of group)writerV1044MenuAdd(ai,entry.title,'sparkles',
       event=>entry.old.callback.call(entry.old,event));
     }
    });
   }
  });
 }));
}

function writerV9RegisterToolbar(plugin){
 const cfg=plugin.settings.v9Toolbar;
 writerV1044ContextMenus(plugin);
 let owner=null,root=null,queued=null;
 const remove=()=>{
  if(root){root.remove();root=null;}
  if(owner){owner.classList.remove('writer-v9-toolbar-host');owner=null;}
 };
 const paint=()=>{
  queued=null;
  const view=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
  const host=view?.contentEl;
  if(!host||!view?.editor||!writerV9ToolbarAllowed(plugin)){remove();return;}
  if(owner!==host){remove();owner=host;owner.classList.add('writer-v9-toolbar-host');}
  if(root)root.remove();
  root=owner.createDiv({cls:'writer-v9-format-toolbar'+(cfg.compact?' is-compact':'')+(cfg.placement==='top'?' is-top':''),attr:{role:'toolbar','aria-label':writerUi('Formatação de texto','Text formatting')}});
  for(const id of cfg.actions){
   const item=WRITER_V9_FORMAT_ACTIONS.find(x=>x[0]===id);
   if(!item)continue;
   const button=root.createEl('button',{cls:'writer-v9-format-action',attr:{type:'button',title:writerUi(item[2],item[3]),'aria-label':writerUi(item[2],item[3])}});
   require('obsidian').setIcon(button,item[1]);
   // Prevent the editor from losing the selection on desktop, without blocking touch.
   button.addEventListener('mousedown',event=>event.preventDefault());
   button.addEventListener('click',()=>{const current=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);writerV9Format(current?.editor,id);});
  }
 };
 const refresh=()=>{if(queued)return;queued=setTimeout(paint,90);};
 plugin.writerV9ToolbarRefresh=refresh;
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',refresh));
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 if(typeof plugin.register==='function')plugin.register(()=>{clearTimeout(queued);remove();plugin.writerV9ToolbarRefresh=null;});
 plugin.app.workspace.onLayoutReady?.(refresh);
 for(const [id,,pt,en] of WRITER_V9_FORMAT_ACTIONS){
  plugin.addCommand({id:'v9-format-'+id,name:writerUi('Formatar: '+pt,'Format: '+en),
   editorCallback:editor=>{if(writerModuleOn(plugin,'formatToolbar'))writerV9Format(editor,id);}});
 }
 plugin.addCommand({id:'v9-toggle-format-toolbar',name:writerUi('Barra de formatação: alternar','Formatting toolbar: toggle'),
  callback:async()=>{
   if(writerV8HomeIsMobile(plugin))cfg.enabledMobile=!cfg.enabledMobile;
   else cfg.enabledDesktop=!cfg.enabledDesktop;
   await plugin.saveSettings();refresh();
  }});
}
function writerV9ToolbarSettings(plugin,panel){
 const cfg=plugin.settings.v9Toolbar;
 panel.createEl('h3',{text:writerUi('Barra de formatação · v9','Formatting toolbar · v9')});
 panel.createEl('p',{text:writerUi('Uma barra compacta dentro do editor, sem substituir a barra nativa do celular. Os botões podem ser reorganizados e ocultados.','A compact toolbar inside the editor. It does not replace the native mobile toolbar. Reorder or hide individual buttons.'),cls:'dictionary-muted'});
 const addToggle=(pt,en,key)=>new Setting(panel).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(cfg[key]).onChange(async value=>{cfg[key]=value;await plugin.saveSettings();plugin.writerV9ToolbarRefresh?.();}));
 addToggle('Ativar no computador','Enable on desktop','enabledDesktop');
 addToggle('Ativar no Android/iOS (desativado inicialmente)','Enable on mobile (off by default)','enabledMobile');
 addToggle('Botões compactos','Compact buttons','compact');
 new Setting(panel).setName(writerUi('Posição da barra','Toolbar position'))
  .addDropdown(d=>d.addOption('bottom',writerUi('Embaixo','Bottom'))
   .addOption('top',writerUi('Em cima','Top'))
   .setValue(cfg.placement).onChange(async value=>{
    cfg.placement=value;await plugin.saveSettings();plugin.writerV9ToolbarRefresh?.();
   }));
 const list=panel.createEl('details',{cls:'writer-v9-toolbar-list'});
 const draw=()=>{
  const open=list.open;list.empty();
  list.createEl('summary',{text:writerUi('Escolher e ordenar botões','Choose and reorder buttons')});
  list.open=open;
  const all=[...cfg.actions,...WRITER_V9_FORMAT_IDS.filter(id=>!cfg.actions.includes(id))];
  for(const id of all){
   const item=WRITER_V9_FORMAT_ACTIONS.find(entry=>entry[0]===id);
   if(!item)continue;
   const index=cfg.actions.indexOf(id),enabled=index>=0;
   const row=new Setting(list).setName(writerUi(item[2],item[3])).setDesc(id);
   row.addToggle(toggle=>toggle.setValue(enabled).onChange(async value=>{
    cfg.actions=value?[...cfg.actions,id]:cfg.actions.filter(x=>x!==id);
    await plugin.saveSettings();plugin.writerV9ToolbarRefresh?.();draw();
   }));
   for(const [direction,sign] of [[-1,'↑'],[1,'↓']]){
    row.addButton(button=>{
     button.setButtonText(sign).setTooltip(writerUi(direction<0?'Mover para cima':'Mover para baixo',
      direction<0?'Move up':'Move down'));
     if(!enabled||index+direction<0||index+direction>=cfg.actions.length)button.setDisabled(true);
     button.onClick(async()=>{
      const next=index+direction;
      [cfg.actions[index],cfg.actions[next]]=[cfg.actions[next],cfg.actions[index]];
      await plugin.saveSettings();plugin.writerV9ToolbarRefresh?.();draw();
     });
    });
   }
  }
 };
 draw();
}
