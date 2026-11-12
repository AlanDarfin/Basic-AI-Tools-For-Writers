'use strict';
/* Presentation routes use stable IDs so existing shortcuts and saved choices work. */
const WRITER_SETTINGS_GROUPS=[
 {id:'general',pt:'Geral',en:'General',icon:'settings-2'},
 {id:'customize',pt:'Aparência e painéis',en:'Appearance & panes',icon:'palette'},
 {id:'writing',pt:'Escrita e edição',en:'Writing & editing',icon:'pen-line'},
 {id:'markdown',pt:'Markdown e formatação',en:'Markdown & formatting',icon:'type'},
 {id:'workflow',pt:'Organização e foco',en:'Organization & focus',icon:'layers-3'},
 {id:'longform',pt:'Livros e projetos',en:'Books & projects',icon:'book-open'},
 {id:'review',pt:'Revisão e versões',en:'Review & versions',icon:'spell-check'},
 {id:'reading',pt:'Leitura e estudo',en:'Reading & study',icon:'graduation-cap'},
 {id:'ai',pt:'Inteligência artificial',en:'Artificial intelligence',icon:'brain-circuit'}
];
const WRITER_SETTINGS_CATALOG=[
 {id:'general',group:'general',pt:'Comece por aqui',en:'Get started',descriptionPt:'Configuração inicial, idioma e atalhos para os recursos.',descriptionEn:'Initial setup, language and feature shortcuts.'},
 {id:'modules',group:'general',pt:'Recursos',en:'Features',descriptionPt:'Escolha quais recursos aparecem nos painéis, menus e comandos.',descriptionEn:'Choose the features shown in panes, menus and commands.',keywords:'módulos modules visibility ocultar hide ativar enabled'},
 {id:'workspaceProfiles',group:'general',pt:'Perfis de escrita',en:'Writing profiles',descriptionPt:'Salve combinações de preferências e desfaça a última aplicação.',descriptionEn:'Save combinations of preferences and undo the last application.'},
 {id:'diagnostics',group:'general',pt:'Diagnóstico e atalhos',en:'Diagnostics & shortcuts',descriptionPt:'Confira o estado local e possíveis conflitos de atalhos.',descriptionEn:'Check local status and possible shortcut conflicts.'},
 {id:'integrationsV4',group:'general',pt:'Integrações e sincronização',en:'Integrations & sync',descriptionPt:'Menções, ações integradas e conexões com plugins externos.',descriptionEn:'Mentions, integrated actions and connections to external plugins.'},
 {id:'compatibility',group:'general',pt:'Compatibilidade',en:'Compatibility',descriptionPt:'Controle o carregamento dos recursos avançados após reiniciar.',descriptionEn:'Control advanced feature loading after restarting.'},
 {id:'homepage',group:'customize',pt:'Página inicial',en:'Homepage',descriptionPt:'Busca, atalhos, widgets e livros na página inicial.',descriptionEn:'Search, shortcuts, widgets and books on the homepage.',modules:['writingHome']},
 {id:'v9Explorer',group:'customize',pt:'Explorador de arquivos',en:'File explorer',descriptionPt:'Ícones, cores, prévias e apresentação das pastas.',descriptionEn:'Icons, colors, previews and folder presentation.',modules:['nativeExplorer']},
 {id:'v9Pretty',group:'customize',pt:'Propriedades das notas',en:'Note properties',descriptionPt:'Apresentação e edição das propriedades no editor.',descriptionEn:'Property presentation and editing in the editor.'},
 {id:'images',group:'customize',pt:'Imagens e anotações',en:'Images & annotations',descriptionPt:'Inserção, tamanhos, visualização e anotações em imagens locais.',descriptionEn:'Insert, resize, view and annotate local images.'},
 {id:'media',group:'customize',pt:'Mídia e arraste',en:'Media & dragging',descriptionPt:'Arraste e prévias de imagens, áudio e vídeo.',descriptionEn:'Dragging and previews for images, audio and video.'},
 {id:'writingWidgets',group:'customize',pt:'Blocos e widgets',en:'Blocks & widgets',descriptionPt:'Colunas, progresso, galerias e blocos interativos.',descriptionEn:'Columns, progress, galleries and interactive blocks.',modules:['writingWidgets']},
 {id:'keyshots',group:'writing',pt:'Atalhos do editor',en:'Editor shortcuts',descriptionPt:'Navegação pelo teclado, edição de linhas e múltiplos cursores.',descriptionEn:'Keyboard navigation, line editing and multiple cursors.',modules:['keyshots'],keywords:'keyshots keysho keyboard jetbrains vscode'},
 {id:'typing',group:'writing',pt:'Digitação e tipografia',en:'Typing & typography',descriptionPt:'Aspas, travessões, colagem, substituições e regras de texto.',descriptionEn:'Quotes, dashes, paste, replacements and text rules.',modules:['easyTyping','smartTypography'],keywords:'easy typing smart typography regex snippets'},
 {id:'typewriter',group:'writing',pt:'Máquina de escrever e foco',en:'Typewriter & focus',descriptionPt:'Posição da linha ativa e leitura confortável durante a escrita.',descriptionEn:'Active line position and comfortable focus while writing.',modules:['typewriter']},
 {id:'complements',group:'writing',pt:'Sugestões de palavras',en:'Word suggestions',descriptionPt:'Autocompletar com palavras e termos locais.',descriptionEn:'Autocomplete using local words and terms.',modules:['complements']},
 {id:'cursor',group:'writing',pt:'Posição do cursor',en:'Cursor position',descriptionPt:'Retome a posição, seleção e rolagem das notas.',descriptionEn:'Restore note cursor position, selection and scroll.',modules:['cursorMemory']},
 {id:'abbreviations',group:'writing',pt:'Abreviações',en:'Abbreviations',descriptionPt:'Expansões de texto e abreviações usadas na escrita.',descriptionEn:'Text expansions and abbreviations used while writing.'},
 {id:'anotherName',group:'writing',pt:'Títulos alternativos',en:'Alternate titles',descriptionPt:'Nomes de exibição e títulos alternativos das notas.',descriptionEn:'Display names and alternate note titles.',keywords:'another name outro nome aliases'},
 {id:'viewMode',group:'writing',pt:'Modos do editor',en:'Editor modes',descriptionPt:'Preferências de edição, leitura e visualização.',descriptionEn:'Editing, reading and view preferences.'},
 {id:'templates',group:'writing',pt:'Modelos de notas',en:'Note templates',descriptionPt:'Modelos reutilizáveis para criar e preencher notas.',descriptionEn:'Reusable templates to create and fill notes.',modules:['templates']},
 {id:'quickActions',group:'writing',pt:'Ações rápidas',en:'Quick actions',descriptionPt:'Paleta de ações, captura de ideias e foco em pastas.',descriptionEn:'Action palette, idea capture and folder focus.',keywords:'toolkit inbox brainstorm capture ribbon'},
 {id:'editorAdvanced',group:'writing',pt:'Edição avançada',en:'Advanced editing',descriptionPt:'Comandos adicionais e recursos do editor.',descriptionEn:'Additional editor commands and features.'},
 {id:'v9Toolbar',group:'markdown',pt:'Barra de formatação',en:'Formatting toolbar',descriptionPt:'Botões, grupos, atalhos e apresentação da barra.',descriptionEn:'Toolbar buttons, groups, shortcuts and appearance.',modules:['formatToolbar']},
 {id:'extendedSyntax',group:'markdown',pt:'Formatação de texto',en:'Text formatting',descriptionPt:'Sublinhado, realce, subscrito, sobrescrito e alinhamento.',descriptionEn:'Underline, highlight, subscript, superscript and alignment.',modules:['extendedSyntax'],keywords:'extended syntax sintaxe estendida'},
 {id:'pandocSyntax',group:'markdown',pt:'Listas e blocos avançados',en:'Advanced lists & blocks',descriptionPt:'Listas de definições, exemplos e exportação com Pandoc.',descriptionEn:'Definition lists, examples and export using Pandoc.',modules:['pandocSyntax'],keywords:'pandoc syntax'},
 {id:'v6Markdown',group:'markdown',pt:'Anotações e elementos de texto',en:'Annotations & text elements',descriptionPt:'Pronúncia, subtexto, spoilers e avaliações interativas.',descriptionEn:'Pronunciation, subtext, spoilers and interactive ratings.',modules:['ruby','discordSyntax','ratings'],keywords:'ruby discord ratings'},
 {id:'numbering',group:'markdown',pt:'Numeração e legendas',en:'Numbering & captions',descriptionPt:'Sequências, referências, capítulos, figuras e tabelas.',descriptionEn:'Sequences, references, chapters, figures and tables.',keywords:'number suite numbering'},
 {id:'smartInsert',group:'markdown',pt:'Inserção inteligente',en:'Smart insertion',descriptionPt:'Insira formatação e elementos conforme o contexto.',descriptionEn:'Insert formatting and elements based on context.'},
 {id:'unicode',group:'markdown',pt:'Símbolos e caracteres',en:'Symbols & characters',descriptionPt:'Escolha e insira caracteres Unicode.',descriptionEn:'Choose and insert Unicode characters.',modules:['unicode'],keywords:'unicode'},
 {id:'toc',group:'markdown',pt:'Sumário da nota',en:'Note table of contents',descriptionPt:'Gere e configure o sumário dos títulos da nota.',descriptionEn:'Generate and configure a table of note headings.',modules:['templates']},
 {id:'v6Linter',group:'markdown',pt:'Padronização de Markdown',en:'Markdown cleanup',descriptionPt:'Revise regras de formatação antes de aplicar mudanças.',descriptionEn:'Preview formatting rules before applying changes.',modules:['linter'],keywords:'linter'},
 {id:'v9Spaces',group:'workflow',pt:'Espaços de trabalho',en:'Workspaces',descriptionPt:'Coleções por pasta, etiqueta e propriedades, com layouts próprios.',descriptionEn:'Collections by folder, tag and properties, with independent layouts.',modules:['smartSpaces'],keywords:'spaces coleções collections'},
 {id:'v9Calendar',group:'workflow',pt:'Calendário e eventos',en:'Calendar & events',descriptionPt:'Agenda, importação e feeds de calendário.',descriptionEn:'Agenda, imports and calendar feeds.',modules:['calendar']},
 {id:'tasks',group:'workflow',pt:'Tarefas e captura',en:'Tasks & capture',descriptionPt:'Pesquise tarefas, organize pendências e capture ideias.',descriptionEn:'Find tasks, organize to-dos and capture ideas.'},
 {id:'databases',group:'workflow',pt:'Tabelas e bancos de dados',en:'Tables & databases',descriptionPt:'Visualizações, propriedades, consultas e criação de bases locais.',descriptionEn:'Views, properties, queries and local database creation.',keywords:'notion suite make.md database'},
 {id:'v9Flow',group:'workflow',pt:'Comandos e inserção com /',en:'Slash commands & insertion',descriptionPt:'Composição por blocos e menu de comandos na escrita.',descriptionEn:'Block composition and slash command menus.',keywords:'flow composer'},
 {id:'v9Pomodoro',group:'workflow',pt:'Temporizador de foco',en:'Focus timer',descriptionPt:'Sessões de foco, pausas e controles do temporizador.',descriptionEn:'Focus sessions, breaks and timer controls.',keywords:'pomodoro'},
 {id:'soundscapes',group:'workflow',pt:'Música e ambiente',en:'Music & ambience',descriptionPt:'Rádio, playlists e músicas locais para acompanhar a escrita.',descriptionEn:'Radio, playlists and local music while writing.',modules:['soundscapes'],keywords:'soundscapes radio'},
 {id:'clickClack',group:'workflow',pt:'Sons de digitação',en:'Typing sounds',descriptionPt:'Pacotes de sons e volume do teclado no computador.',descriptionEn:'Desktop keyboard sound packs and volume.',modules:['typewriter'],keywords:'click clack'},
 {id:'sessionDrafts',group:'workflow',pt:'Rascunhos temporários',en:'Temporary drafts',descriptionPt:'Rascunhos de sessão mantidos em memória.',descriptionEn:'Session drafts kept in memory.',modules:['sessionNotes']},
 {id:'v9Lock',group:'workflow',pt:'Privacidade da interface',en:'Interface privacy',descriptionPt:'Proteção visual e bloqueio da interface local.',descriptionEn:'Visual privacy and local interface locking.'},
 {id:'privacy',group:'workflow',pt:'Notas protegidas',en:'Protected notes',descriptionPt:'Crie e abra cópias de notas com conteúdo criptografado.',descriptionEn:'Create and open notes with encrypted content.'},
 {id:'v10Tools',group:'workflow',pt:'Arquivos e ferramentas',en:'Files & tools',descriptionPt:'Arquivos de texto, tabelas, propriedades em lote e painéis laterais.',descriptionEn:'Text files, tables, batch properties and side panes.'},
 {id:'projects',group:'longform',pt:'Escrita de livros',en:'Book writing',descriptionPt:'Projetos, capítulos, escrita contínua, recuperação e compilação.',descriptionEn:'Projects, chapters, continuous writing, recovery and compilation.',modules:['projects'],keywords:'longform studio'},
 {id:'v10Bookshelf',group:'longform',pt:'Biblioteca',en:'Library',descriptionPt:'Estantes, séries, capas e apresentação dos livros.',descriptionEn:'Shelves, series, covers and book presentation.'},
 {id:'projectTasks',group:'longform',pt:'Tarefas dos projetos',en:'Project tasks',descriptionPt:'Listas por projeto com grupos, prazos e links.',descriptionEn:'Project lists with groups, due dates and links.',modules:['projects']},
 {id:'bookNavigation',group:'longform',pt:'Navegação de capítulos',en:'Chapter navigation',descriptionPt:'Links e blocos de navegação pela ordem dos capítulos.',descriptionEn:'Links and navigation blocks following chapter order.',modules:['bookNavigation'],keywords:'booknav'},
 {id:'virtualContent',group:'longform',pt:'Conteúdo dinâmico',en:'Dynamic content',descriptionPt:'Monte trechos a partir de pastas, etiquetas e propriedades.',descriptionEn:'Compose passages from folders, tags and properties.',modules:['virtualContent'],keywords:'virtual content conteúdo virtual'},
 {id:'v7Worldbuilding',group:'longform',pt:'Personagens e universo',en:'Characters & worldbuilding',descriptionPt:'Compêndio, personagens e organização do universo da história.',descriptionEn:'Compendium, characters and story world organization.'},
 {id:'graph',group:'longform',pt:'Mapa de relações',en:'Relationship graph',descriptionPt:'Visualize relações entre personagens, locais e notas.',descriptionEn:'Visualize relationships between characters, places and notes.',keywords:'storyline story graph'},
 {id:'review',group:'review',pt:'Revisão gramatical',en:'Grammar checking',descriptionPt:'Idiomas, dicionário pessoal e verificação com LanguageTool.',descriptionEn:'Languages, personal dictionary and LanguageTool checking.',modules:['review']},
 {id:'reviewAI',group:'review',pt:'Revisão com IA',en:'AI review',descriptionPt:'Revisores de estilo, leitor beta e perfil editorial.',descriptionEn:'Style reviewers, beta reader and editorial profile.',modules:['review']},
 {id:'writingProfiles',group:'review',pt:'Comparação e revisão seletiva',en:'Comparison & selective review',descriptionPt:'Compare versões e aceite alterações selecionadas.',descriptionEn:'Compare versions and accept selected changes.',modules:['diff']},
 {id:'variants',group:'review',pt:'Reescrita e alternativas',en:'Rewriting & alternatives',descriptionPt:'Alternativas de frases e comparação de reescritas.',descriptionEn:'Sentence alternatives and rewrite comparisons.',modules:['variants']},
 {id:'snapshots',group:'review',pt:'Histórico de versões',en:'Version history',descriptionPt:'Cópias locais, prévias e restauração de versões.',descriptionEn:'Local copies, previews and version restoration.',modules:['snapshots'],keywords:'snapshots backup'},
 {id:'research',group:'reading',pt:'Citações e leitura',en:'Citations & reading',descriptionPt:'Fontes de pesquisa, destaques importados e estilo de leitura.',descriptionEn:'Research sources, imported highlights and reading style.',modules:['zoteroIntegration','styleMate'],keywords:'zotero stylemate'},
 {id:'v6Reading',group:'reading',pt:'Tempo de leitura e datas',en:'Reading time & dates',descriptionPt:'Estimativas de leitura e apresentação de marcadores de data.',descriptionEn:'Reading estimates and timestamp presentation.',modules:['timestamps','readingTime']},
 {id:'tts',group:'reading',pt:'Leitura em voz alta',en:'Read aloud',descriptionPt:'Vozes, idiomas e serviços para ler as notas.',descriptionEn:'Voices, languages and services for reading notes aloud.',modules:['tts'],keywords:'tts'},
 {id:'speech',group:'reading',pt:'Voz e acessibilidade',en:'Voice & accessibility',descriptionPt:'Leitura da seleção, controles locais e recursos de voz.',descriptionEn:'Selection reading, local controls and voice features.'},
 {id:'study',group:'reading',pt:'Estudos e revisão espaçada',en:'Study & spaced repetition',descriptionPt:'Rotina de estudos, cartões e agendamento das revisões.',descriptionEn:'Study routine, flashcards and review scheduling.',modules:['study'],keywords:'unique suite fsrs'},
 {id:'dictionary',group:'ai',pt:'Dicionário e definições',en:'Dictionary & definitions',descriptionPt:'Dicionário local, busca e conexão usada nas definições.',descriptionEn:'Local dictionary, lookup and definition connection.',modules:['dictionary']},
 {id:'translation',group:'ai',pt:'Tradução',en:'Translation',descriptionPt:'Conexão, idioma de origem e idioma de destino.',descriptionEn:'Connection, source language and target language.',modules:['translation']},
 {id:'assistant',group:'ai',pt:'Assistente de escrita',en:'Writing assistant',descriptionPt:'Chat, sugestões no editor, modelo e instruções do assistente.',descriptionEn:'Chat, editor suggestions, model and assistant instructions.',modules:['chat','inlineAI']},
 {id:'providers',group:'ai',pt:'Conexões de IA',en:'AI connections',descriptionPt:'Chaves, endpoints e testes sob demanda.',descriptionEn:'Keys, endpoints and on-demand checks.',keywords:'api apis provedores providers credenciais credentials'},
 {id:'models',group:'ai',pt:'Modelos de IA',en:'AI models',descriptionPt:'Catálogo de modelos e escolhas por função.',descriptionEn:'Model catalog and per-feature choices.'},
 {id:'prompts',group:'ai',pt:'Instruções da IA',en:'AI instructions',descriptionPt:'Prompts padrão para definições, tradução e escrita.',descriptionEn:'Default prompts for definitions, translation and writing.',keywords:'prompts system instructions'}
];
let writerSettingsInstance=0;
function writerSettingsSections(){return WRITER_SETTINGS_CATALOG.map(item=>[item.id,writerUi(item.pt,item.en)]);}
function writerSettingsGroups(){return WRITER_SETTINGS_GROUPS.map(item=>[item.id,writerUi(item.pt,item.en),WRITER_SETTINGS_CATALOG.filter(section=>section.group===item.id).map(section=>section.id)]);}
function writerSettingsNavigation(settings){
 const valid=new Set(WRITER_SETTINGS_CATALOG.map(item=>item.id));
 const value=settings.settingsNavigation;
 const cfg=settings.settingsNavigation=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 cfg.favorites=[...new Set(Array.isArray(cfg.favorites)?cfg.favorites:[])].filter(id=>valid.has(id)).slice(0,12);
 return cfg;
}
function writerSettingsToggleFavorite(settings,id){
 if(!WRITER_SETTINGS_CATALOG.some(item=>item.id===id))return false;
 const cfg=writerSettingsNavigation(settings),index=cfg.favorites.indexOf(id);
 if(index>=0)cfg.favorites.splice(index,1);
 else if(cfg.favorites.length<12)cfg.favorites.push(id);
 else return false;
 return true;
}
function writerSettingsRenderShortcuts(plugin,container,open){
 container.empty();
 const cfg=writerSettingsNavigation(plugin.settings),favorites=cfg.favorites;
 const recent=(plugin.writerRecentSettings||[]).filter(id=>id!==plugin.writerSettingsTab?.activeSettingsTab&&!favorites.includes(id)).slice(0,4);
 const add=(ids,pt,en,collapsible=false)=>{
  if(!ids.length)return;
  let host=container;
  if(collapsible){
   host=container.createEl('details',{cls:'writer-v137-settings-recent'});
   host.createEl('summary',{text:writerUi(pt,en)});
  }
  const group=host.createDiv({cls:'writer-v137-settings-shortcut-group'});
  if(!collapsible)
  group.createSpan({cls:'writer-v137-settings-shortcut-label',text:writerUi(pt,en)});
  for(const id of ids){
   const meta=WRITER_SETTINGS_CATALOG.find(item=>item.id===id);if(!meta)continue;
   const button=group.createEl('button',{text:writerUi(meta.pt,meta.en),attr:{type:'button'}});
   button.classList.toggle('is-active',id===plugin.writerSettingsTab?.activeSettingsTab);
   button.addEventListener('click',()=>open(id));
  }
 };
 add(favorites,'Favoritos','Favorites');add(recent,'Recentes nesta sessão','Recent this session',true);
 container.hidden=!container.childElementCount;
}
function writerSettingsFinishPanel(panel,id){
 const meta=WRITER_SETTINGS_CATALOG.find(item=>item.id===id);if(!meta)return;
 const title=writerV13SearchText(writerUi(meta.pt,meta.en));
 for(const child of Array.from(panel.children))
  if(child.tagName==='H3'&&writerV13SearchText(child.textContent)===title)child.remove();
 const description=panel.querySelector('.writer-v137-settings-description');
 const grammar=panel.querySelector('.writer-grammar-settings');
 if(grammar){grammar.querySelector('h3')?.remove();description?.remove();}
 // Specialized renderer introductions already explain the page in context.
 const firstSetting=Array.from(panel.children).findIndex(child=>child.classList.contains('setting-item'));
 const intro=Array.from(panel.children).some((child,index)=>child.tagName==='P'&&child!==description&&child.textContent.trim()&&(firstSetting<0||index<firstSetting));
 if(intro)description?.remove();
}
let writerSettingsLabelId=0;
function writerSettingsLabelControls(root){
 for(const row of root?.querySelectorAll?.('.setting-item')||[]){
  const name=row.querySelector('.setting-item-name'),description=row.querySelector('.setting-item-description');
  if(!name?.textContent?.trim())continue;
  if(!name.id)name.id='writer-setting-label-'+(++writerSettingsLabelId);
  if(description?.textContent?.trim()&&!description.id)description.id='writer-setting-description-'+(++writerSettingsLabelId);
  for(const control of row.querySelectorAll('input:not([type="hidden"]),textarea,select,[role="switch"],[role="checkbox"]')){
   if(!control.hasAttribute('aria-label')&&!control.hasAttribute('aria-labelledby'))control.setAttribute('aria-labelledby',name.id);
   if(description?.textContent?.trim()){
    const tokens=new Set((control.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));tokens.add(description.id);
    control.setAttribute('aria-describedby',[...tokens].join(' '));
   }
  }
 }
}
function writerSettingsRenderHeader(plugin,panel,id,open,refresh){
 const meta=WRITER_SETTINGS_CATALOG.find(item=>item.id===id);if(!meta)return;
 const header=panel.createDiv({cls:'writer-v137-settings-heading'});
 header.createEl('h3',{text:writerUi(meta.pt,meta.en)});
 const favorite=header.createEl('button',{cls:'writer-v137-settings-favorite',attr:{type:'button'}});
 const update=()=>{
  const active=writerSettingsNavigation(plugin.settings).favorites.includes(id);
  const label=active?writerUi('Remover dos favoritos','Remove from favorites'):writerUi('Adicionar aos favoritos','Add to favorites');
  favorite.setAttribute('aria-label',label);favorite.setAttribute('title',label);favorite.setAttribute('aria-pressed',String(active));
  require('obsidian').setIcon(favorite,active?'star':'star');favorite.classList.toggle('is-active',active);
 };
 update();
 favorite.addEventListener('click',async()=>{
  if(!writerSettingsToggleFavorite(plugin.settings,id)){
   new Notice(writerUi('Você pode guardar até 12 seções favoritas.','You can save up to 12 favorite sections.'));return;
  }
  update();refresh();
  try{await plugin.saveSettings();}catch(error){new Notice(String(error?.message||error));}
 });
 panel.createEl('p',{cls:'writer-v137-settings-description',text:writerUi(meta.descriptionPt,meta.descriptionEn)});
 const hidden=(meta.modules||[]).filter(key=>!writerModuleOn(plugin,key));
 if(hidden.length){
  const notice=panel.createDiv({cls:'writer-v137-settings-hidden',attr:{role:'note'}});
  notice.createSpan({text:writerUi('Há recursos desta seção desligados em Recursos. Você pode configurar as opções aqui e reativá-los quando quiser.','Some features in this section are off in Features. You can configure them here and enable them whenever you like.')});
  notice.createEl('button',{text:writerUi('Gerenciar recursos','Manage features'),attr:{type:'button'}}).addEventListener('click',()=>{
   plugin.writerModuleFilterQuery=hidden.length===1?hidden[0]:'';open('modules');
  });
 }
}
