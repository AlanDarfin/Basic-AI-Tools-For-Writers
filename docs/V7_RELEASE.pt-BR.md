# Basic AI Tool for Writers — Lançamento estável 7.0.0

**Versão:** 7.0.0, sem prefixo v. **Versão mínima do aplicativo:** 1.11.4. PC e Android. Substitui a 6.0.1 como última release estável no GitHub.

## Escrita, Longform e planejamento de cenas

O gerenciador continua utilizando índices Longform e notas Markdown. Projetos, rascunhos, capítulos aninhados, movimentação, sessões de escrita, metas, tarefas, comentários e compilação não foram substituídos.

- **Escrita / Universo / Projeto:** três grupos compactos na barra lateral, mantendo o acesso às mesmas ferramentas e aos comandos nativos.
- **Cenas:** capítulos recolhíveis, linhas de hierarquia, reordenação por arrastar ou toque e inspetor de cenas.
- **Quadro:** Cartões, Lista ou Kanban por estado da cena, com filtros por POV, ato, arco, estado e texto.
- **Estrutura:** Tramas, matriz de atos por trama, modelos de três/cinco atos e Jornada do Herói, análise de ritmo/intensidade e nova aba **Conexões**.
- **Conexões:** lê os campos setup_scenes e payoff_scenes para desenhar setas entre as notas originais. Referências ausentes, circulares e com ordem inesperada geram avisos. Não reescreve capítulos nem inventa relações.

### Propriedades das cenas

O inspetor edita propriedades YAML opcionais: status, act, sequence, pov, characters, location, sceneDate, plotlines, storyBeat, emotion, intensity (0 a 10), conflict, setup_scenes, payoff_scenes, target_wordcount e summary. Usa a API nativa de frontmatter. Esvaziar um campo existente agora permite excluir somente aquela propriedade, mantendo o manuscrito intacto.

Um exemplo de campos:

- status: draft
- act: 2
- plotlines: [principal, amizade]
- storyBeat: [midpoint]
- intensity: 7
- setup_scenes: ["[[Capítulo 3]]"]
- payoff_scenes: ["[[Capítulo 8]]"]

Todos os campos são opcionais. As notas antigas continuam válidas sem essas propriedades.

## Compêndio, universo e Timeline

O Compêndio continua pesquisando notas Markdown, pastas, tags nativas e tags herdadas de Folder Notes. Você pode criar categorias para personagens, locais, itens, facções, culturas, economias, sistemas mágicos, eventos e fichas próprias. As relações usam wikilinks, e imagens locais podem aparecer em avatares, Galeria e mapas com marcadores que abrem notas sem modificar os arquivos das imagens.

A Timeline continua reunindo eventos das preferências do projeto e das propriedades das notas, com trilhas, ramificações, marcos e Gantt simplificado.

**Novo: calendários fictícios.** Escolha ordenação gregoriana ou um ano fictício de 1 a 24 meses nomeados, cada um com 1 a 99 dias. Os eventos podem usar anos numéricos ou datas numéricas no formato ano-mês-dia. Eras descritas em texto continuam sem ordenação automática. Alterar o calendário afeta a ordem exibida, mas jamais reescreve as datas salvas. O calendário gregoriano agora valida anos bissextos e impede erros de ordenação entre anos.

**Novo: séries de livros.** O botão Séries no alto dos Projetos permite agrupar índices Longform existentes, alterar sua ordem na série e abrir um livro. As séries são salvas nas configurações do plugin e não movem nem excluem os arquivos originais.

## Ferramentas, exportação e privacidade

Permanecem dicionários, tradução, LanguageTool, IA para escrita e revisão, Diff, autocomplete, histórico, máquina de escrever, memória do cursor, tipografia, sintaxes Markdown, TTS e perfis.

A integração opcional com Pandoc no desktop continua sendo o único sistema de conversão para EPUB, PDF e DOCX. O plugin não instala Pandoc automaticamente. A memória narrativa por IA permanece **desligada por padrão** e só envia trechos limitados de capítulos anteriores quando o escritor solicita uma revisão ao provedor configurado. Serviços online podem transmitir o texto escolhido, conforme as configurações. As chaves no data.json não possuem criptografia adicional.

## Instalação e atualização

1. Baixe o [ZIP oficial da 7.0.0](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/7.0.0/Basic-AI-Tool-for-Writers-7.0.0.zip).
2. Faça backup do cofre, da pasta do plugin e do data.json.
3. Atualize main.js, manifest.json e styles.css na pasta do plugin (normalmente .obsidian/plugins/basic-ai-tool-for-writers/). Não sobrescreva o data.json.
4. Recarregue o plugin. Os manuscritos, índices Longform e projetos existentes devem ser preservados.

## Validação e limites

O workflow da release estável verifica sintaxe, sincronização dos módulos, testes de regressão antigos, novos testes de calendários/séries/conexões, CSS, as duas traduções do README, regras de nome do manifest e integridade do ZIP. Testes automáticos **não garantem** funcionamento visual perfeito em todos os WebViews Android, temas personalizados ou leitores de tela.

O nome no manifest é Basic AI Tool for Writers, sem “Obsidian” ou “Plugin”. A descrição termina com ponto final, o ID não muda, e tanto a versão quanto a tag usam 7.0.0.

**Fora do escopo:** canvas completo de relações com nós arrastáveis, anos bissextos ficcionais complexos, conversão entre calendários, organização narrativa avançada entre séries de livros ou análise semântica completa da trama por IA. Esses recursos exigem mais projeto e validação. Os plugins de referência inspiraram ideias; não incorporamos seus códigos ou CSS.

Uma release no GitHub não significa aprovação automática no diretório de Plugins da Comunidade: a submissão e a revisão são separadas.

[English](V7_RELEASE.en.md) · [Histórico da RC](V7_RC1.pt-BR.md) · [Créditos](../THIRD_PARTY_NOTICES.md).
