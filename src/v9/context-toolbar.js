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
 ['redo','redo-2','Refazer','Redo'],
 ['indent','indent-increase','Aumentar recuo','Increase indent'],
 ['outdent','indent-decrease','Diminuir recuo','Decrease indent'],
 ['align-left','align-left','Alinhar à esquerda','Align left'],
 ['align-center','align-center','Centralizar','Center'],
 ['align-right','align-right','Alinhar à direita','Align right'],
 ['justify','align-justify','Justificar','Justify'],
 ['text-color','palette','Cor do texto','Text color'],
 ['background-color','paint-bucket','Cor de destaque','Background color']
];
const WRITER_V9_FORMAT_IDS=WRITER_V9_FORMAT_ACTIONS.map(x=>x[0]);
const WRITER_V9_TOOLBAR_DEFAULTS={
 enabledDesktop:true,enabledMobile:false,compact:true,placement:'bottom',
 style:'compact',buttonSize:32,showLabels:false,textColor:'#cf517f',backgroundColor:'#ffd66a',
 customButtons:[],groups:[],customizations:{},
 actions:['bold','italic','underline','strike','highlight','code','h1','h2','h3','quote','bullet','numbered','task','link','wikilink','callout','table','rule','undo','redo']
};
function writerV1048ToolbarSafeIcon(icon){
 const candidate=String(icon||'').trim().toLowerCase().slice(0,45);
 return /^[a-z][a-z0-9-]{1,44}$/.test(candidate)?candidate:'command';
}
function writerV1048ToolbarHex(value,fallback){
 const s=String(value||'').trim();
 return /^#[\da-f]{6}$/i.test(s)?s:fallback;
}
function writerV1048ToolbarCustomId(id){
 return /^custom-[a-z0-9-]{1,45}$/.test(String(id||''));
}
function writerV1048ToolbarItems(cfg){
 return [...WRITER_V9_FORMAT_ACTIONS.map(([id,icon,pt,en])=>({id,icon,pt,en,type:'format'})),
  ...(cfg.customButtons||[]).map(b=>({id:b.id,icon:b.icon,pt:b.label,en:b.label,type:'command',command:b.command}))];
}
function writerV9ToolbarMerge(settings){
 const raw=settings.v9Toolbar&&typeof settings.v9Toolbar==='object'&&!Array.isArray(settings.v9Toolbar)?settings.v9Toolbar:{};
 const cfg=settings.v9Toolbar={...WRITER_V9_TOOLBAR_DEFAULTS,...raw};
 cfg.enabledDesktop=cfg.enabledDesktop!==false;
 cfg.enabledMobile=cfg.enabledMobile===true;
 cfg.compact=cfg.compact!==false;
 cfg.placement=['top','bottom','floating'].includes(cfg.placement)?cfg.placement:'bottom';
 cfg.style=['tiny','compact','regular'].includes(cfg.style)?cfg.style:(cfg.compact?'compact':'regular');
 cfg.buttonSize=Math.max(26,Math.min(46,Math.round(Number(cfg.buttonSize)||32)));
 cfg.showLabels=cfg.showLabels===true;
 cfg.textColor=writerV1048ToolbarHex(cfg.textColor,'#cf517f');
 cfg.backgroundColor=writerV1048ToolbarHex(cfg.backgroundColor,'#ffd66a');
 const custom=[];
 for(const rawItem of Array.isArray(cfg.customButtons)?cfg.customButtons.slice(0,60):[]){
  if(!rawItem||!writerV1048ToolbarCustomId(rawItem.id))continue;
  const command=String(rawItem.command||'').trim().slice(0,180);
  if(!/^[\w.:-]{2,180}$/.test(command)||custom.some(i=>i.id===rawItem.id))continue;
  custom.push({id:rawItem.id,command,label:String(rawItem.label||command).trim().slice(0,55)||command,
   icon:writerV1048ToolbarSafeIcon(rawItem.icon||'command')});
 }
 cfg.customButtons=custom;
 const allowed=new Set([...WRITER_V9_FORMAT_IDS,...custom.map(i=>i.id)]);
 cfg.actions=Array.isArray(cfg.actions)?[...new Set(cfg.actions.filter(id=>allowed.has(id)))]:[...WRITER_V9_TOOLBAR_DEFAULTS.actions];
 const customizations={};
 for(const [id,option] of Object.entries(cfg.customizations||{})){
  if(!allowed.has(id)||!option||typeof option!=='object')continue;
  customizations[id]={label:String(option.label||'').trim().slice(0,55),
   icon:option.icon?writerV1048ToolbarSafeIcon(option.icon):''};
 }
 cfg.customizations=customizations;
 const assigned=new Set(),groups=[];
 for(const group of Array.isArray(cfg.groups)?cfg.groups.slice(0,16):[]){
  if(!group||typeof group!=='object')continue;
  const ids=[...new Set((Array.isArray(group.ids)?group.ids:[])
   .filter(id=>cfg.actions.includes(id)&&!assigned.has(id)))].slice(0,25);
  if(!ids.length)continue;
  ids.forEach(id=>assigned.add(id));
  groups.push({id:String(group.id||'group-'+groups.length).replace(/[^a-z0-9-]/gi,'').slice(0,45),
   name:String(group.name||'Menu').trim().slice(0,45)||'Menu',
   icon:writerV1048ToolbarSafeIcon(group.icon||'folder-open'),ids});
 }
 cfg.groups=groups;
 // Migrate old shared toolbar settings once into distinct editable device profiles.
 // Keep the old top-level fields for existing commands and safe data migration.
 const normalizeProfile=(rawProfile,mobile)=>{
  const prior=rawProfile&&typeof rawProfile==='object'&&!Array.isArray(rawProfile)?rawProfile:{};
  const profile={
   placement:cfg.placement,style:cfg.style,compact:cfg.compact,buttonSize:cfg.buttonSize,
   showLabels:cfg.showLabels,textColor:cfg.textColor,backgroundColor:cfg.backgroundColor,
   customButtons:cfg.customButtons.map(item=>({...item})),
   customizations:Object.fromEntries(Object.entries(cfg.customizations).map(([id,value])=>[id,{...value}])),
   actions:[...cfg.actions],groups:cfg.groups.map(group=>({...group,ids:[...group.ids]})),
   ...prior
  };
  profile.placement=['top','bottom','floating'].includes(profile.placement)?profile.placement:'bottom';
  if(mobile&&profile.placement==='floating')profile.placement='bottom';
  profile.style=['tiny','compact','regular'].includes(profile.style)?profile.style:'compact';
  profile.buttonSize=Math.max(26,Math.min(46,Math.round(Number(profile.buttonSize)||32)));
  profile.showLabels=profile.showLabels===true;
  profile.textColor=writerV1048ToolbarHex(profile.textColor,cfg.textColor);
  profile.backgroundColor=writerV1048ToolbarHex(profile.backgroundColor,cfg.backgroundColor);
  profile.customButtons=Array.isArray(profile.customButtons)?profile.customButtons.filter(item=>
   item&&writerV1048ToolbarCustomId(item.id)&&/^[\w.:-]{2,180}$/.test(String(item.command||'')))
   .slice(0,60).map(item=>({id:item.id,command:String(item.command).slice(0,180),
    label:String(item.label||item.command).slice(0,55),icon:writerV1048ToolbarSafeIcon(item.icon)})):[];
  const allowed=new Set([...WRITER_V9_FORMAT_IDS,...profile.customButtons.map(item=>item.id)]);
  profile.actions=Array.isArray(profile.actions)?[...new Set(profile.actions.filter(id=>allowed.has(id)))]:[...cfg.actions];
  profile.customizations=Object.fromEntries(Object.entries(profile.customizations||{}).filter(([id,value])=>
   allowed.has(id)&&value&&typeof value==='object').map(([id,value])=>[id,{
    label:String(value.label||'').slice(0,55),icon:value.icon?writerV1048ToolbarSafeIcon(value.icon):''
   }]));
  const assigned=new Set();
  profile.groups=(Array.isArray(profile.groups)?profile.groups:[]).slice(0,16).map(group=>{
   const ids=[...new Set((Array.isArray(group?.ids)?group.ids:[]).filter(id=>
    profile.actions.includes(id)&&!assigned.has(id)))];
   ids.forEach(id=>assigned.add(id));
   return {id:String(group?.id||'group').replace(/[^a-z0-9-]/gi,'').slice(0,45),
    name:String(group?.name||'Menu').slice(0,45),icon:writerV1048ToolbarSafeIcon(group?.icon),ids};
  }).filter(group=>group.ids.length);
  return profile;
 };
 const stored=raw.profiles&&typeof raw.profiles==='object'&&!Array.isArray(raw.profiles)?raw.profiles:{};
 cfg.profiles={desktop:normalizeProfile(stored.desktop,false),mobile:normalizeProfile(stored.mobile,true)};
 return cfg;
}
function writerV1048ToolbarProfile(plugin,device){
 const cfg=plugin.settings.v9Toolbar||writerV9ToolbarMerge(plugin.settings);
 const key=device|| (writerV8HomeIsMobile(plugin)?'mobile':'desktop');
 return cfg.profiles?.[key]||cfg;
}
function writerV1048ToolbarHasSelection(view){
 if(!view?.editor||!writerV1061ToolbarEditingMode(view))return false;
 // A caret alone is not a selected passage; dismiss the floating toolbar
 // promptly when the actual selection is cleared.
 try{
  const selected=view.editor.getSelection?.();
  if(typeof selected==='string')return selected.trim().length>0;
 }catch(_){}
 const ranges=view.editor.cm?.state?.selection?.ranges;
 return Array.isArray(ranges)&&ranges.some(range=>range.to>range.from);
}
function writerV9ToolbarAllowed(plugin){
 const cfg=plugin.settings.v9Toolbar;
 return writerModuleOn(plugin,'formatToolbar')&&(writerV8HomeIsMobile(plugin)?cfg.enabledMobile:cfg.enabledDesktop);
}
function writerV9Format(editor,action,options={}){
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
 case 'indent':perLine(line=>'    '+line);break;
 case 'outdent':perLine(line=>line.replace(/^(?: {1,4}|\t)/,''));break;
 case 'align-left':case 'align-center':case 'align-right':{
  if(typeof writerV102AlignApply==='function'){
   writerV102AlignApply(editor,action==='align-left'?'l':action==='align-center'?'c':'r');
  }else return false;
  break;
 }
 case 'justify':{
  if(typeof writerV102AlignApply!=='function')return false;
  writerV102AlignApply(editor,'j');break;
 }
 case 'text-color':{
  const color=writerV1048ToolbarHex(options.textColor,'#cf517f');
  replacement('<span style="color:'+color+'">','</span>');break;
 }
 case 'background-color':{
  const color=writerV1048ToolbarHex(options.backgroundColor,'#ffd66a');
  replacement('<mark style="background-color:'+color+'">','</mark>');break;
 }
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
const WRITER_V1045_AI_ICONS={
 translate:'languages',meaning:'book-open',synonyms:'list-tree',
 antonyms:'arrow-left-right',rewrite:'pencil-line',smart:'wand-sparkles'
};
function writerV1045OrganizeEditorMenu(plugin,menu,editor){
 if(!menu||menu.__writerV1045Organized||!editor||typeof menu.addItem!=='function')return;
 menu.__writerV1045Organized=true;
 const items=Array.isArray(menu.items)?menu.items:null;
 if(!items)return; // Obsidian changed internals: do not risk breaking native actions.
 const format=items.find(item=>/^(formatar|format)$/i.test(writerV1044MenuTitle(item)));
 let formatMenu=format?.submenu||null;
 if(!formatMenu&&typeof format?.setSubmenu==='function'){
  try{formatMenu=format.setSubmenu();}catch(_){}
 }
 const addFormat=parent=>{
  const existing=new Set((parent.items||[]).map(item=>writerV1044MenuTitle(item)));
  for(const [id,icon,pt,en] of WRITER_V9_FORMAT_ACTIONS){
   if(!['underline','superscript','subscript','highlight','codeblock',
    'h4','h5','h6','footnote','callout','table','rule'].includes(id))continue;
   const title=writerUi(pt,en);
   if(existing.has(title))continue;
   writerV1044MenuAdd(parent,title,icon,()=>{
    if(writerModuleOn(plugin,'formatToolbar'))writerV9Format(editor,id);
   },'basic-format');
  }
  if(typeof writerV102AlignApply==='function'&&plugin.settings.v102Align?.enabled!==false){
   for(const [side,icon,pt,en] of [
    ['l','align-left','Alinhar à esquerda','Align left'],
    ['c','align-center','Centralizar linha/título','Center line/heading'],
    ['r','align-right','Alinhar à direita','Align right'],
    ['j','align-justify','Justificar','Justify']]){
    const title=writerUi(pt,en);
    if(existing.has(title))continue;
    writerV1044MenuAdd(parent,title,icon,()=>writerV102AlignApply(editor,side),'basic-align');
   }
  }
 };
 if(formatMenu)addFormat(formatMenu);
 else menu.addItem(item=>{
  item.setTitle(writerUi('Formatação do Basic','Basic formatting')).setIcon('type');
  if(typeof item.setSubmenu==='function')addFormat(item.setSubmenu());
  else item.onClick?.(event=>{
   const sub=new Menu(plugin.app);addFormat(sub);sub.showAtMouseEvent?.(event);
  });
 });
 // Group after all editor-menu listeners have run. Older Basic handlers are
 // often added after this module and their MenuItems have no .callback field.
 const grouped={lookup:[],writing:[]};
 for(const old of [...items]){
  const title=writerV1044MenuTitle(old),key=writerV1044AiKey(title);
  if(!key)continue;
  const clickable=typeof old.callback==='function'||typeof old.dom?.click==='function';
  if(!clickable)continue;
  const section=['meaning','synonyms','antonyms','translate'].includes(key)?'lookup':'writing';
  grouped[section].push({old,title,key});
 }
 if(!grouped.lookup.length&&!grouped.writing.length)return;
 const groups=Object.entries(grouped).filter(([,list])=>list.length);
 let moved=0;
 menu.addItem(top=>{
  top.setTitle(writerUi('IA · Ferramentas','AI · Tools')).setIcon('brain-circuit');
  top.setSection?.('basic-ai');
  if(typeof top.setSubmenu!=='function')return; // Keep legacy root actions untouched.
  const ai=top.setSubmenu();
  for(const [group,entries] of groups){
   const label=group==='lookup'?writerUi('Pesquisar e traduzir','Lookup & translate'):
    writerUi('Escrever e revisar','Writing & revision');
   const groupIcon=group==='lookup'?'book-open-check':'pencil-ruler';
   ai.addItem(groupItem=>{
    groupItem.setTitle(label).setIcon(groupIcon);
    const target=typeof groupItem.setSubmenu==='function'?groupItem.setSubmenu():ai;
    for(const entry of entries){
     writerV1044MenuAdd(target,entry.title,WRITER_V1045_AI_ICONS[entry.key]||'sparkles',event=>{
      if(typeof entry.old.callback==='function')entry.old.callback.call(entry.old,event);
      else entry.old.dom?.click?.();
     },'basic-ai-'+group);
     const index=items.indexOf(entry.old);
     if(index>=0)items.splice(index,1);
     entry.old.dom?.remove?.();
     moved++;
    }
   });
  }
 });
 if(!moved)return;
}
function writerV1044ContextMenus(plugin){
 // Register early to identify which menus belong to our editor, but finalize
 // at display time, *after* every other editor-menu subscriber has added items.
 plugin.registerEvent?.(plugin.app.workspace.on('editor-menu',(menu,editor)=>{
  if(!plugin.settings.v9Toolbar||!editor)return;
  menu.__writerV1045Editor=editor;
 }));
 if(typeof Menu==='undefined'||!Menu?.prototype)return;
 const prototype=Menu.prototype,patches=[];
 for(const key of ['showAtMouseEvent','showAtPosition','showAtCoordinates']){
  const original=prototype[key];
  if(typeof original!=='function')continue;
  const replacement=function(){
   if(this.__writerV1045Editor&&!this.__writerV1045Organized)
    writerV1045OrganizeEditorMenu(plugin,this,this.__writerV1045Editor);
   return original.apply(this,arguments);
  };
  try{prototype[key]=replacement;
   if(prototype[key]===replacement)patches.push([key,original,replacement]);
  }catch(_){}
 }
 plugin.register?.(()=>{
  for(const [key,original,replacement] of patches){
   if(prototype[key]===replacement)prototype[key]=original;
  }
 });
}

function writerV1048ToolbarLabel(cfg,item){
 return cfg.customizations?.[item.id]?.label||item.pt&&writerUi(item.pt,item.en)||item.id;
}
function writerV1048ToolbarIcon(cfg,item){
 return cfg.customizations?.[item.id]?.icon||item.icon||'command';
}
function writerV1048ToolbarRun(plugin,editor,id){
 const cfg=writerV1048ToolbarProfile(plugin);
 const item=writerV1048ToolbarItems(cfg).find(entry=>entry.id===id);
 if(!item)return false;
 if(item.type==='command'){
  const available=plugin.app.commands?.commands?.[item.command]||
   plugin.app.commands?.listCommands?.().find(c=>c.id===item.command);
  if(!available){
   new Notice(writerUi('Comando indisponível: ','Command unavailable: ')+item.command);
   return false;
  }
  return plugin.app.commands.executeCommandById?.(item.command)!==false;
 }
 return writerV9Format(editor,id,cfg);
}
function writerV1048ToolbarGroups(cfg){
 const groupMap=new Map();
 for(const group of cfg.groups||[])for(const id of group.ids||[])groupMap.set(id,group);
 return groupMap;
}
function writerV1048ToolbarMenu(plugin,group,event){
 const cfg=writerV1048ToolbarProfile(plugin);
 const menu=new Menu(plugin.app),items=writerV1048ToolbarItems(cfg);
 for(const id of group.ids){
  const item=items.find(a=>a.id===id);if(!item)continue;
  menu.addItem(entry=>entry.setTitle(writerV1048ToolbarLabel(cfg,item))
   .setIcon(writerV1048ToolbarIcon(cfg,item))
   .onClick(()=>{
    const current=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
    writerV1048ToolbarRun(plugin,current?.editor,id);
   }));
 }
 if(typeof menu.showAtMouseEvent==='function'&&event?.clientX!==undefined)menu.showAtMouseEvent(event);
 else menu.showAtPosition?.({x:90,y:90});
}
function writerV1048ToolbarPosition(root,host,view,cfg){
 if(cfg.placement!=='floating'||writerV8HomeIsMobile({app:view?.app||{isMobile:false}}))return;
 const cm=view?.editor?.cm,rect=host?.getBoundingClientRect?.();
 if(!rect||!cm?.coordsAtPos)return;
 const pos=cm.state?.selection?.main?.head;
 if(!Number.isInteger(pos))return;
 const caret=cm.coordsAtPos(pos);
 if(!caret)return;
 const width=Math.max(140,root.offsetWidth||240);
 const left=Math.max(6,Math.min(rect.width-width-6,caret.left-rect.left-width/2));
 const top=Math.max(6,Math.min(rect.height-40,caret.top-rect.top-50));
 root.style.left=Math.round(left)+'px';
 root.style.top=Math.round(top)+'px';
}
/* MarkdownView.editor remains available in reading mode.
 * Check the actual Markdown mode before mounting formatting controls. */
function writerV1061ToolbarEditingMode(view){
 if(!view)return false;
 let mode='';
 try{mode=view.getMode?.()||view.getState?.()?.mode||'';}catch(_){}
 if(mode==='preview'||mode==='reading')return false;
 if(mode==='source'||mode==='edit')return true;
 const content=view.contentEl;
 if(content?.querySelector?.('.markdown-preview-view')&&!content.querySelector?.('.markdown-source-view'))return false;
 return !!view.editor;
}
function writerV9RegisterToolbar(plugin){
 const settings=plugin.settings.v9Toolbar;
 writerV1044ContextMenus(plugin);
 let owner=null,root=null,queued=null,currentView=null,modeObserver=null,observedHost=null,observedView=null,lastEditable=null;
 const remove=()=>{
  if(root){root.remove();root=null;}
  if(owner){owner.classList.remove('writer-v9-toolbar-host');owner.classList.remove('writer-v9-toolbar-docked');owner=null;}
  currentView=null;
 };
 const paint=()=>{
  queued=null;
  const view=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
  observeMode(view);
  const host=view?.contentEl;
  const cfg=writerV1048ToolbarProfile(plugin);
  if(!host||!view?.editor||!writerV1061ToolbarEditingMode(view)||!writerV9ToolbarAllowed(plugin)||
   (cfg.placement==='floating'&&!writerV1048ToolbarHasSelection(view))){remove();return;}
  if(owner!==host){remove();owner=host;owner.classList.add('writer-v9-toolbar-host');}
  currentView=view;
  if(root)root.remove();
  const mobile=writerV8HomeIsMobile(plugin);
  owner.classList.toggle('writer-v9-toolbar-docked',cfg.placement!=='floating'||mobile);
  const classes=['writer-v9-format-toolbar','writer-v1048-format-toolbar',
   'is-style-'+cfg.style,cfg.showLabels?'is-labeled':'',
   cfg.placement==='top'?'is-top':cfg.placement==='floating'&&!mobile?'is-floating':''];
  root=owner.createDiv({cls:classes.filter(Boolean).join(' '),
   attr:{role:'toolbar','aria-label':writerUi('Barra de formatação personalizada','Custom formatting toolbar')}});
  // Docked bars flow with the editor and never cover the host's top/bottom controls.
  if(cfg.placement==='top')owner.insertBefore(root,owner.firstChild);
  root.style.setProperty('--writer-v1048-button-size',cfg.buttonSize+'px');
  const available=writerV1048ToolbarItems(cfg);
  const groups=writerV1048ToolbarGroups(cfg),shown=new Set();
  for(const id of cfg.actions){
   const item=available.find(entry=>entry.id===id);
   if(!item)continue;
   const group=groups.get(id);
   if(group){
    if(shown.has(group.id))continue;
    shown.add(group.id);
    const button=root.createEl('button',{cls:'writer-v9-format-action writer-v1048-group-action',
     attr:{type:'button',title:group.name,'aria-label':group.name,'aria-haspopup':'menu'}});
    require('obsidian').setIcon(button,group.icon);
    const arrow=button.createSpan({cls:'writer-v1048-group-caret',attr:{'aria-hidden':'true'}});
    require('obsidian').setIcon(arrow,'chevron-down');
    if(cfg.showLabels)button.createSpan({cls:'writer-v1048-action-label',text:group.name});
    button.addEventListener('mousedown',event=>event.preventDefault());
    button.addEventListener('click',event=>writerV1048ToolbarMenu(plugin,group,event));
    continue;
   }
   const label=writerV1048ToolbarLabel(cfg,item),icon=writerV1048ToolbarIcon(cfg,item);
   const button=root.createEl('button',{cls:'writer-v9-format-action',attr:{
    type:'button',title:label,'aria-label':label,'data-writer-action':id}});
   try{require('obsidian').setIcon(button,icon);}catch(_){require('obsidian').setIcon(button,'command');}
   if(cfg.showLabels)button.createSpan({cls:'writer-v1048-action-label',text:label});
   button.addEventListener('mousedown',event=>event.preventDefault());
   button.addEventListener('click',()=>{
    const current=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
    writerV1048ToolbarRun(plugin,current?.editor,id);
   });
  }
  writerV1048ToolbarPosition(root,owner,view,cfg);
 };
 const refresh=()=>{if(queued)return;queued=setTimeout(paint,90);};
 const observeMode=view=>{
  const host=view?.containerEl||view?.contentEl||null;
  if(host===observedHost&&view===observedView)return;
  modeObserver?.disconnect();modeObserver=null;
  observedHost=host;observedView=view||null;
  lastEditable=writerV1061ToolbarEditingMode(view);
  const Observer=host?.ownerDocument?.defaultView?.MutationObserver;
  if(!host||typeof Observer!=='function')return;
  modeObserver=new Observer(()=>{
   const editable=writerV1061ToolbarEditingMode(observedView);
   if(editable===lastEditable)return;
   lastEditable=editable;
   // Hide immediately when switching to Reading; rebuild only on returning to Edit.
   if(!editable)remove();
   refresh();
  });
  modeObserver.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 };
 const reposition=()=>{
  if(root&&currentView&&!writerV1061ToolbarEditingMode(currentView)){remove();refresh();return;}
  const cfg=writerV1048ToolbarProfile(plugin);
  if(cfg.placement==='floating'){
   const view=plugin.app.workspace.getActiveViewOfType?.(MarkdownView);
   if(!writerV1048ToolbarHasSelection(view)){if(root)remove();return;}
   if(!root||view!==currentView){refresh();return;}
   writerV1048ToolbarPosition(root,owner,currentView,cfg);
  }
 };
 plugin.writerV9ToolbarRefresh=refresh;
 plugin.registerEvent(plugin.app.workspace.on('active-leaf-change',refresh));
 plugin.registerEvent(plugin.app.workspace.on('layout-change',refresh));
 plugin.registerEvent(plugin.app.workspace.on('file-open',refresh));
 if(typeof document!=='undefined'&&plugin.registerDomEvent){
  for(const key of ['keyup','pointerup','selectionchange','scroll'])
   plugin.registerDomEvent(document,key,reposition,true);
 }
 if(typeof plugin.register==='function')plugin.register(()=>{
  clearTimeout(queued);modeObserver?.disconnect();modeObserver=null;observedHost=null;observedView=null;remove();plugin.writerV9ToolbarRefresh=null;
 });
 plugin.app.workspace.onLayoutReady?.(refresh);
 for(const [id,,pt,en] of WRITER_V9_FORMAT_ACTIONS){
  plugin.addCommand({id:'v9-format-'+id,name:writerUi('Formatar: '+pt,'Format: '+en),
   editorCallback:editor=>{
    if(writerModuleOn(plugin,'formatToolbar'))writerV9Format(editor,id,writerV1048ToolbarProfile(plugin));
   }});
 }
 plugin.addCommand({id:'v9-toggle-format-toolbar',name:writerUi('Barra de formatação: alternar','Formatting toolbar: toggle'),
  callback:async()=>{
   if(writerV8HomeIsMobile(plugin))settings.enabledMobile=!settings.enabledMobile;
   else settings.enabledDesktop=!settings.enabledDesktop;
   await plugin.saveSettings();refresh();
  }});
}
function writerV1048ToolbarCommandPicker(plugin,onChoose){
 // v13: the formatter and shortcut editor use the same accessible, ranked picker.
 // The command ID callback contract stays unchanged.
 return writerV1044CommandPicker(plugin,(id,name)=>onChoose({id,name}));
}
function writerV9ToolbarSettings(plugin,panel){
 const settings=plugin.settings.v9Toolbar;
 const container=panel.createDiv({cls:'writer-v1048-toolbar-settings'});
 const deviceSetting=new Setting(container).setName(writerUi('Personalizar para','Customize for'))
  .setDesc(writerUi('PC e celular possuem botões, estilos, menus e cores independentes.','Desktop and mobile have independent buttons, style, menus and colors.'));
 const content=container.createDiv({cls:'writer-v1202-toolbar-profile'});
 const render=device=>{
  content.empty();
  const cfg=writerV1048ToolbarProfile(plugin,device);
  const root=content;
 root.createEl('h3',{text:writerUi('Barra de formatação','Formatting toolbar')});
 root.createEl('p',{cls:'setting-item-description',text:writerUi(
  'Personalize os botões, crie menus e use comandos de outros plugins. No celular a barra continua opcional, sem substituir a barra nativa.',
  'Customize buttons, build menus and use commands from other plugins. On mobile this bar remains optional and does not replace Obsidian’s native toolbar.')});
 const save=async()=>{await plugin.saveSettings();plugin.writerV9ToolbarRefresh?.();};
 const toggle=(pt,en,key)=>new Setting(root).setName(writerUi(pt,en))
  .addToggle(t=>t.setValue(settings[key]===true).onChange(async value=>{settings[key]=value;await save();}));
 // Availability and presentation preferences belong to the selected device.
 toggle(device==='mobile'?'Ativar no celular':'Ativar no computador',
  device==='mobile'?'Enable on mobile':'Enable on desktop',
  device==='mobile'?'enabledMobile':'enabledDesktop');
 new Setting(root).setName(writerUi('Mostrar nomes junto aos ícones','Show labels next to icons'))
  .addToggle(t=>t.setValue(cfg.showLabels===true).onChange(async value=>{
   cfg.showLabels=value;await save();
  }));
 // Obsidian's generic Setting flex rows can inherit enormous vertical space
 // from third-party mobile snippets. These native controls have stable height.
 const compactField=(name,description,controlId)=>{
  const row=root.createDiv({cls:'writer-v1049-compact-field'});
  const information=row.createDiv({cls:'writer-v1049-field-info'});
  information.createEl('label',{cls:'writer-v1049-field-label',text:name,attr:{for:controlId}});
  if(description)information.createDiv({cls:'writer-v1049-field-description',text:description});
  const controls=row.createDiv({cls:'writer-v1049-field-control'});
  return {row,controls};
 };
 const styledSelect=(id,name,options,value,onChange)=>{
  const field=compactField(name,'',id);
  const control=field.controls.createEl('select',{cls:'writer-v1049-control-select',
   attr:{id,'aria-label':name}});
  for(const [key,title] of options){
   const option=control.createEl('option',{text:title,attr:{value:key}});
   option.value=key;
  }
  control.value=value;
  control.addEventListener('change',()=>void onChange(control.value));
  return control;
 };
 styledSelect('writer-v1049-toolbar-style',writerUi('Estilo da barra','Toolbar style'),[
  ['tiny',writerUi('Mínima','Tiny')],
  ['compact',writerUi('Compacta','Compact')],
  ['regular',writerUi('Confortável','Comfortable')]
 ],cfg.style,async value=>{cfg.style=value;cfg.compact=value!=='regular';await save();});
 const sizeField=compactField(writerUi('Tamanho dos botões','Button size'),'','writer-v1049-toolbar-size');
 const sizeValue=sizeField.controls.createSpan({cls:'writer-v1049-slider-value',text:String(cfg.buttonSize)});
 const sizeInput=sizeField.controls.createEl('input',{cls:'writer-v1049-control-range',
  attr:{id:'writer-v1049-toolbar-size',type:'range',min:'26',max:'46',step:'2',
   value:String(cfg.buttonSize),'aria-label':writerUi('Tamanho dos botões','Button size')}});
 sizeInput.value=String(cfg.buttonSize);
 sizeInput.addEventListener('input',()=>{
  cfg.buttonSize=Math.max(26,Math.min(46,Number(sizeInput.value)||32));
  sizeValue.setText(String(cfg.buttonSize));void save();
 });
 styledSelect('writer-v1049-toolbar-position',writerUi('Posição da barra','Toolbar position'),[
  ['bottom',writerUi('Embaixo','Bottom')],
  ['top',writerUi('Em cima','Top')],
  ...(device==='desktop'?[['floating',writerUi('Mostrar ao selecionar texto','Show on text selection')]]:[])
 ],cfg.placement,async value=>{cfg.placement=value;await save();});
 const colorField=(name,desc,key,id)=>{
  const field=compactField(name,desc,id);
  const picker=field.controls.createEl('input',{cls:'writer-v1049-color-picker',attr:{
   id,type:'color',value:cfg[key],'aria-label':name}});
  picker.value=cfg[key];
  const display=field.controls.createSpan({cls:'writer-v1049-color-value',text:cfg[key]});
  picker.addEventListener('input',()=>{
   cfg[key]=writerV1048ToolbarHex(picker.value,cfg[key]);
   display.setText(cfg[key]);void save();
  });
 };
 colorField(writerUi('Cor aplicada ao texto','Text formatting color'),
  writerUi('Usada pelo comando Cor do texto.','Used by the Text color action.'),
  'textColor','writer-v1049-text-color');
 colorField(writerUi('Cor de destaque','Highlight background color'),
  writerUi('Usada pelo comando Cor de destaque.','Used by the Background color action.'),
  'backgroundColor','writer-v1049-background-color');
 const inventory=root.createEl('details',{cls:'writer-v9-toolbar-list writer-v1048-toolbar-inventory'});
 inventory.createEl('summary',{text:writerUi('Escolher e ordenar botões','Choose and reorder buttons')});
 inventory.open=false;
 const filter=inventory.createEl('input',{cls:'writer-v1048-toolbar-filter',attr:{type:'search',
  placeholder:writerUi('Buscar botão, como subscrito…','Find a button, e.g. subscript…'),
  'aria-label':writerUi('Filtrar botões','Filter buttons')}});
 const rows=inventory.createDiv({cls:'writer-v1048-toolbar-rows'});
 const updateOrder=async(current,next)=>{
  if(next<0||next>=cfg.actions.length)return;
  [cfg.actions[current],cfg.actions[next]]=[cfg.actions[next],cfg.actions[current]];
  await save();draw();
 };
 const draw=()=>{
  rows.empty();
  const needle=String(filter.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const all=writerV1048ToolbarItems(cfg);
  const sorted=[...cfg.actions,...all.map(item=>item.id).filter(id=>!cfg.actions.includes(id))];
  for(const id of sorted){
   const item=all.find(x=>x.id===id);if(!item)continue;
   const title=writerV1048ToolbarLabel(cfg,item);
   const hay=(title+' '+item.pt+' '+item.en+' '+id+' '+(item.command||''))
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(needle&&!hay.includes(needle))continue;
   const index=cfg.actions.indexOf(id),enabled=index>=0;
   const row=new Setting(rows).setName(title)
    .setDesc(item.command||writerUi('Formatação Markdown','Markdown formatting'));
   row.settingEl?.classList?.add('writer-v1048-toolbar-item');
   row.settingEl?.setAttribute?.('data-toolbar-action',id);
   row.addToggle(t=>t.setValue(enabled).onChange(async checked=>{
    cfg.actions=checked?[...cfg.actions,id]:cfg.actions.filter(x=>x!==id);
    if(!checked)for(const g of cfg.groups)g.ids=g.ids.filter(value=>value!==id);
    cfg.groups=cfg.groups.filter(g=>g.ids.length);
    await save();draw();
   }));
   for(const [direction,sign] of [[-1,'arrow-up'],[1,'arrow-down']]){
    row.addExtraButton(button=>button.setIcon(sign)
     .setTooltip(writerUi(direction<0?'Mover para cima':'Mover para baixo',
      direction<0?'Move up':'Move down'))
     .onClick(()=>void updateOrder(index,index+direction)));
   }
   if(row.settingEl){
    row.settingEl.draggable=enabled;
    row.settingEl.addEventListener('dragstart',event=>{
     if(!enabled)return;
     event.dataTransfer?.setData('text/plain',id);
     if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
    });
    row.settingEl.addEventListener('dragover',event=>event.preventDefault());
    row.settingEl.addEventListener('drop',event=>{
     event.preventDefault();
     const source=event.dataTransfer?.getData('text/plain');
     const i=cfg.actions.indexOf(source),j=cfg.actions.indexOf(id);
     if(i<0||j<0||i===j)return;
     cfg.actions.splice(i,1);cfg.actions.splice(j,0,source);
     void save().then(draw);
    });
   }
   const edit=rows.createEl('details',{cls:'writer-v1048-toolbar-customizer'});
   edit.createEl('summary',{text:writerUi('Personalizar nome e ícone: ','Customize name and icon: ')+title});
   const custom=cfg.customizations[id]||(cfg.customizations[id]={label:'',icon:''});
   new Setting(edit).setName(writerUi('Nome mostrado','Displayed name'))
    .addText(t=>t.setPlaceholder(title).setValue(custom.label||'')
     .onChange(async value=>{custom.label=value.slice(0,55);await save();}));
   new Setting(edit).setName(writerUi('Ícone Lucide','Lucide icon'))
    .addText(t=>t.setPlaceholder(item.icon).setValue(custom.icon||'')
     .onChange(async value=>{
      custom.icon=value.trim()?writerV1048ToolbarSafeIcon(value):'';
      await save();
     }));
   if(item.type==='command'){
    new Setting(edit).setName(writerUi('Comando associado','Assigned command'))
     .setDesc(item.command)
     .addButton(button=>button.setButtonText(writerUi('Alterar','Change'))
      .onClick(()=>writerV1048ToolbarCommandPicker(plugin,async next=>{
       const target=cfg.customButtons.find(x=>x.id===id);
       if(target){target.command=next.id;await save();draw();}
      })));
    new Setting(edit).setName(writerUi('Excluir botão personalizado','Delete custom button'))
     .addButton(button=>button.setButtonText(writerUi('Remover','Remove')).setWarning()
      .onClick(async()=>{
       cfg.customButtons=cfg.customButtons.filter(x=>x.id!==id);
       cfg.actions=cfg.actions.filter(x=>x!==id);
       cfg.groups.forEach(g=>g.ids=g.ids.filter(x=>x!==id));
       cfg.groups=cfg.groups.filter(g=>g.ids.length);
       delete cfg.customizations[id];await save();draw();
      }));
   }
  }
 };
 filter.addEventListener('input',draw);
 draw();
 new Setting(root).setName(writerUi('Adicionar comando de outro plugin','Add a command from another plugin'))
  .setDesc(writerUi('Escolha um comando registrado na paleta do Obsidian.',
   'Pick a command registered in Obsidian’s command palette.'))
  .addButton(button=>button.setButtonText(writerUi('Escolher comando','Choose command')).setCta()
   .onClick(()=>writerV1048ToolbarCommandPicker(plugin,async command=>{
    let id='custom-'+Date.now().toString(36);
    while(cfg.customButtons.some(item=>item.id===id))id+='x';
    cfg.customButtons.push({id,command:command.id,label:String(command.name||command.id).slice(0,55),
     icon:'command'});
    cfg.actions.push(id);inventory.open=true;await save();draw();
   })));
 const groupPanel=root.createEl('details',{cls:'writer-v1048-toolbar-groups'});
 groupPanel.createEl('summary',{text:writerUi('Menus e grupos de botões','Button menus and groups')});
 const groupRows=groupPanel.createDiv({cls:'writer-v1048-toolbar-group-list'});
 const drawGroups=()=>{
  groupRows.empty();
  for(const group of cfg.groups){
   const box=groupRows.createEl('details',{cls:'writer-v1048-toolbar-group-card'});
   box.createEl('summary',{text:group.name+' · '+group.ids.length});
   new Setting(box).setName(writerUi('Nome do menu','Menu name')).addText(t=>t.setValue(group.name)
    .onChange(async value=>{group.name=value.trim().slice(0,45)||'Menu';await save();}));
   new Setting(box).setName(writerUi('Ícone do menu','Menu icon')).addText(t=>t.setValue(group.icon)
    .onChange(async value=>{group.icon=writerV1048ToolbarSafeIcon(value);await save();}));
   for(const id of cfg.actions){
    const item=writerV1048ToolbarItems(cfg).find(entry=>entry.id===id);
    if(!item)continue;
    const belongs=group.ids.includes(id);
    new Setting(box).setName(writerV1048ToolbarLabel(cfg,item))
     .addToggle(t=>t.setValue(belongs).onChange(async checked=>{
      if(checked){
       for(const other of cfg.groups)other.ids=other.ids.filter(x=>x!==id);
       group.ids.push(id);
      }else group.ids=group.ids.filter(x=>x!==id);
      cfg.groups=cfg.groups.filter(g=>g.ids.length);
      await save();drawGroups();
     }));
   }
   new Setting(box).setName(writerUi('Remover menu','Remove menu'))
    .addButton(button=>button.setButtonText(writerUi('Desagrupar','Ungroup'))
     .onClick(async()=>{cfg.groups=cfg.groups.filter(g=>g!==group);await save();drawGroups();}));
  }
 };
 drawGroups();
 new Setting(groupPanel).setName(writerUi('Criar menu de botões','Create button menu'))
  .addButton(button=>button.setButtonText(writerUi('Novo grupo','New group'))
   .onClick(async()=>{
    const first=cfg.actions.find(id=>!cfg.groups.some(g=>g.ids.includes(id)));
    if(!first){new Notice(writerUi('Ative um botão sem grupo primeiro.','Enable an ungrouped button first.'));return;}
    cfg.groups.push({id:'group-'+Date.now().toString(36),
     name:writerUi('Meu menu','My menu'),icon:'folder-open',ids:[first]});
    await save();groupPanel.open=true;drawGroups();
   }));
 };
 deviceSetting.addDropdown(drop=>drop
  .addOption('desktop',writerUi('Computador','Desktop'))
  .addOption('mobile',writerUi('Celular','Mobile'))
  .setValue(writerV8HomeIsMobile(plugin)?'mobile':'desktop')
  .onChange(device=>render(device)));
 render(writerV8HomeIsMobile(plugin)?'mobile':'desktop');
}
