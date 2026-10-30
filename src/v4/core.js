'use strict';
/* Independent v4 integrations. Original community plugins are not bundled. */
const W4_DEFAULTS={
 abbreviations:{enabled:true,entries:{
  'eg.':{value:'for example',isEnabled:true,position:0},atm:{value:'at the moment',isEnabled:true,position:1},
  imo:{value:'in my opinion',isEnabled:true,position:2},'w/':{value:'with',isEnabled:true,position:3},
  'w/o':{value:'without',isEnabled:true,position:4},ily:{value:'I love you',isEnabled:true,position:5},
  btw:{value:'by the way',isEnabled:true,position:6},afaik:{value:'as far as I know',isEnabled:true,position:7},rn:{value:'right now',isEnabled:true,position:8}
 }},
 anotherName:{enabled:true,property:'another-name'},
 viewMode:{enabled:true,property:'prefer-view',defaultMode:'',respectOpenFiles:true},
 homework:{enabled:true,autoSort:true,showTooltips:true,hideCompleted:false},
 instaToc:{enabled:true,title:'Table of Contents',listType:'circle',minLevel:1,maxLevel:6,indent:12,exclude:'',collapsed:false},
 unicode:{enabled:true,maxResults:80,favorites:[],recent:[],searchDescriptions:true},
 noteTemplates:{enabled:true,folder:'Templates',caseSensitive:false,onlyEmpty:true,includeSubfolders:true},
 tts:{enabled:true,language:'auto',voice:'',rate:1,pitch:1,volume:1,preferGoogle:true,stripMarkdown:true,maxChars:120000},
 interfaceLanguage:'auto'
};
function w4merge(settings){
 for(const [key,val] of Object.entries(W4_DEFAULTS)){
  if(key==='interfaceLanguage'){if(typeof settings[key]!=='string')settings[key]=val;continue;}
  const old=settings[key];
  settings[key]={...structuredClone(val),...(old&&typeof old==='object'?old:{})};
  if(key==='abbreviations'&&old?.entries)settings[key].entries={...old.entries};
 }
 settings.schemaVersion=4;
 return settings;
}
function w4locale(plugin){
 const custom=plugin?.settings?.interfaceLanguage||'auto';
 if(custom==='pt'||custom==='en')return custom;
 try{return String(require('obsidian').getLanguage?.()||'en').toLowerCase().startsWith('pt')?'pt':'en';}
 catch{return typeof getLocale==='function'?getLocale():'en';}
}
function w4text(plugin,pt,en){return w4locale(plugin)==='pt'?pt:en;}
const w4labels={
 'Cenas':'Scenes','Projeto':'Project','Compilar':'Compile','Notas':'Notes','Tarefas':'Tasks',
 '+ Projeto':'+ Project','Nenhum projeto encontrado. Crie um projeto ou selecione um índice Longform existente. Projetos Longform válidos são detectados automaticamente.':'No project found. Create a project or select an existing Longform index.',
 'Principal':'Main','Padrão':'Default','Adicionar':'Add','Remover':'Remove','Cancelar':'Cancel',
 'Salvar':'Save','Fechar':'Close','Pesquisa Unicode':'Unicode search',
 'Sugestões':'Suggestions','Variantes':'Variants','Versões':'Versions','Ferramentas de escrita':'Writing tools',
 'Revisão':'Review','Projetos':'Projects','Configurações':'Settings',
 'Abra uma nota Markdown para usar as ferramentas.':'Open a Markdown note to use the writing tools.',
 'Autocomplete contextual':'Contextual autocomplete','Ativar sugestões':'Enable suggestions',
 'Aparecer enquanto escreve':'Suggest while typing','Mostrar sugestões':'Show suggestions',
 'Reindexar cofre':'Reindex vault','Abrir dicionário':'Open dictionary',
 'Alternativas de escrita':'Writing alternatives','Ativar variantes':'Enable variants',
 'Criar da seleção':'Create from selection','Editar no cursor':'Edit at cursor',
 'Anterior':'Previous','Próxima':'Next','Confirmar escolhida':'Commit selected',
 'Confirmar todas':'Commit all','Gerar com IA':'Generate with AI',
 'Histórico e recuperação':'History and recovery','Ativar snapshots':'Enable snapshots',
 'Salvar versão agora':'Save version now','Nomear uma versão':'Name a version',
 'Abrir histórico':'Open history','Abrir versões':'Open versions',
 'Ir ao erro':'Go to error','Criar variante':'Create variant','Explicar com IA':'Explain with AI',
 'Idioma':'Language','Pasta':'Folder','Pesquisar':'Search'
};
function w4label(plugin,value){return w4locale(plugin)==='pt'?value:(w4labels[value]||value);}
function w4setting(panel,name,desc,setting,plugin){
 return new Setting(panel).setName(w4text(plugin,name,desc||name));
}
