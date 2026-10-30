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
  settings[key]={...JSON.parse(JSON.stringify(val)),...(old&&typeof old==='object'?old:{})};
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

Object.assign(w4labels,{
 '+ Cena':'+ Scene','+ Nota':'+ Note','+ Pasta':'+ Folder','+ Variante':'+ Variant',
 'Novo rascunho Longform':'New Longform draft','Trocar para rascunho Longform...':'Switch Longform draft...',
 'Excluir variante':'Delete variant','Nenhuma cena cadastrada. Use + Cena.':'No scenes yet. Use + Scene.',
 'Cena não encontrada: ':'Scene not found: ','Entrada removida do índice. Arquivo e subcapítulos preservados.':'Removed from the index. File and child scenes preserved.',
 'Arquivo da cena não encontrado.':'Scene file not found.','Projeto de nota única.':'Single-note project.',
 'Abrir texto':'Open text','Abrir índice':'Open index','Índice: ':'Index: ','Cenas: ':'Scenes: ',
 'Título do projeto':'Project title','Pasta das cenas':'Scenes folder',
 'Relativa à pasta do índice; não move arquivos existentes.':'Relative to the index folder; existing files are not moved.',
 'Meta diária (palavras)':'Daily goal (words)','Meta de palavras':'Word goal',
 'Meta total do projeto':'Total project goal','Cenas no rascunho: ':'Scenes in draft: ',
 'Rascunhos locais e metas ficam nas configurações do Basic AI. Rascunhos Longform são índices próprios.':'Local drafts and goals are saved in Basic AI settings. Longform drafts have their own index notes.',
 'Diagnóstico · ':'Diagnostics · ','Ausentes: ':'Missing: ','Novos arquivos: ':'Unindexed files: ',
 'Adicionar arquivos soltos ao índice':'Add unindexed files','Importar workflows (JSON)':'Import workflows (JSON)',
 'Cole o objeto workflows ou o conteúdo de data.json do Longform. Apenas etapas reconhecidas poderão ser executadas.':'Paste workflows or the Longform data.json file. Only recognized steps can be executed.',
 'Compilação por etapas':'Step-by-step compilation','+ Workflow':'+ Workflow','Importar Longform':'Import Longform',
 'Importar JSON':'Import JSON','Edite etapas e clique em Salvar workflow. Scripts externos não são executados.':'Edit steps and select Save workflow. External scripts cannot run.',
 'Etapa de script/customizada preservada na importação, mas não pode ser executada.':'Custom/script step kept during import but cannot be executed.',
 '+ Etapa':'+ Step','Salvar workflow':'Save workflow','Prévia':'Preview','Workflow inválido: ':'Invalid workflow: ',
 'Manuscrito criado sem sobrescrever o original.':'Manuscript created without overwriting the original.',
 'Crie uma pasta ou nota para começar. As notas não entram no manuscrito.':'Create a folder or a note. Notes do not enter the manuscript.',
 'Renomear':'Rename','Lixeira':'Trash','Mover nota para pasta':'Move note to folder',
 'Destino':'Destination','Novo projeto de escrita':'New writing project',
 'Nome':'Name','Pasta no cofre':'Vault folder','Caminho relativo ao cofre':'Path relative to the vault',
 'Tipo':'Type','Meta diária de escrita atingida!':'Daily writing goal reached!',
 'Sessão de escrita':'Writing session','Iniciar sessão':'Start session','Encerrar sessão':'Stop session',
 'Contagem baseada nos arquivos salvos durante a sessão. Alterações fora do Obsidian podem não ser contabilizadas.':'Count based on files saved during the session. Changes outside Obsidian may not count.',
 'Total: ':'Total: ','Avisos':'Notices','Título':'Title','Novo':'New','Excluir':'Delete',
 'Voltar':'Back','Avançar':'Next','Iniciar':'Start','Terminar':'Finish',
 'Dicionário':'Dictionary','Definições':'Definitions','Tradução':'Translation',
 'Explicar e sugerir alternativas':'Explain and suggest alternatives',
 'Aceitar':'Accept','Ignorar':'Ignore','Ver contexto e justificativa':'View context and explanation',
 'Substituir por':'Replace with','Sem substituição automática':'No automatic replacement',
 'Tarefas rápidas':'Quick tasks','Tarefas do projeto':'Project tasks',
 'Leitor de voz':'Speech reader','Unicode':'Unicode',
 'Abra uma nota Markdown.':'Open a Markdown note.',
 'Novo rascunho':'New draft','Gerenciador de tarefas':'Task manager',
 'Ativar sugestões':'Enable suggestions','Reindexar cofre':'Reindex vault',
 'Mostrar sugestões':'Show suggestions','Abrir dicionário':'Open dictionary',
 'Abrir histórico':'Open history','Salvar versão agora':'Save version now',
 'Nomear uma versão':'Name a version','Pesquisa Unicode':'Unicode search',
 'Histórico e recuperação':'History and recovery',
 'Alternativas de escrita':'Writing alternatives',
 'Autocomplete contextual':'Contextual autocomplete',
 'Ativar variantes':'Enable variants','Ativar snapshots':'Enable snapshots',
 'Ativar ou desativar autocomplete':'Enable or disable autocomplete',
 'Palavras do arquivo atual':'Words from current file',
 'Palavras de outras notas do cofre':'Words from other vault notes',
 'Links internos':'Internal links','Dicionários personalizados':'Custom dictionaries',
 'Diferenciar maiúsculas de minúsculas':'Case sensitive',
 'Número máximo de sugestões':'Maximum suggestions',
 'Máximo de arquivos no índice':'Maximum indexed files',
 'Tamanho máximo por arquivo (bytes)':'Maximum file size (bytes)',
 'Pastas excluídas':'Excluded folders','Arquivos de dicionário':'Dictionary files',
 'Limpar aprendizado':'Clear learned rankings','Reindexar':'Reindex',
 'Ativar variantes':'Enable variants',
 'Destacar variantes no editor':'Highlight inline variants',
 'Oferecer variantes na revisão gramatical':'Offer variants during grammar review',
 'Salvar versão antes de confirmar':'Save a snapshot before committing',
 'Confirmar antes de aplicar todas':'Confirm before applying all',
 'Instruções da IA para variantes':'AI instructions for variants',
 'Ativar histórico local':'Enable local history',
 'Snapshots automáticos':'Automatic snapshots',
 'Incluir anexos nos novos snapshots':'Include attachments in new snapshots',
 'Criar snapshot antes de alterações':'Snapshot before changes',
 'Criar snapshot antes de restaurar':'Snapshot before restore',
 'Pasta do histórico':'History folder',
 'Intervalo entre snapshots automáticos (segundos)':'Automatic snapshot interval (seconds)',
 'Limite de versões por nota':'Maximum versions per note','Retenção em dias':'Retention in days',
 'Linhas de contexto no diff':'Diff context lines',
 'Abrir histórico da nota':'Open note history',
 'Nome do arquivo':'File name',
 'Configurações do Basic AI':'Basic AI settings'
});
function w4TranslateTree(root,plugin){
 if(w4locale(plugin)!=='en'||!root?.querySelectorAll)return;
 const allowed='button,label,summary,option,h1,h2,h3,h4,h5,small,p,strong,span,.setting-item-name,.setting-item-description';
 const nodes=[root,...root.querySelectorAll(allowed)];
 for(const el of nodes){
  if(el.closest?.('.markdown-rendered,.writer-project-scene-title,.writer-v4-task-description,.writer-lt-original,.writer-unicode-descriptor,pre,code,[contenteditable="true"]'))continue;
  for(const node of el.childNodes||[]){
   if(node.nodeType!==3)continue;
   const raw=node.nodeValue||'';
   const trimmed=raw.trim();
   if(!trimmed||!w4labels[trimmed])continue;
   node.nodeValue=raw.replace(trimmed,w4labels[trimmed]);
  }
  const placeholder=el.getAttribute?.('placeholder');
  if(placeholder&&w4labels[placeholder])el.setAttribute('placeholder',w4labels[placeholder]);
 }
}
