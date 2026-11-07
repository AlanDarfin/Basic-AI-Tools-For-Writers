# Basic 13.1.0 — Escrita e planejamento

Esta versão adiciona recursos locais para planejar e revisar histórias e corrige a leitura dos capítulos em painéis estreitos. Requer Obsidian 1.11.4 ou superior.

## Novidades para escrita

- **Escrita: analisar repetições** examina a seleção ou a nota atual e mostra palavras repetidas e ocorrências próximas. A análise ocorre localmente, sem editar a nota. Nomes e repetições intencionais também podem aparecer.
- Quatro blocos Markdown, com comandos de inserção e edição do bloco renderizado: **scene-card** (ficha de cena), **character-voice** (fala ou pensamento), **beat-sheet** (batidas narrativas) e **editor-note** (nota de revisão). Uma seleção existente é preservada.
- Os [exemplos completos dos blocos](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/BLOCKS.pt-BR.md) explicam a sintaxe, os campos e os limites.

## Correções visuais

- O painel de Projetos agora considera o contêiner real do título: nomes longos aparecem em uma linha com reticências e o nome completo em dica e acessibilidade.
- Escrita, Universo e Projeto usam reticências; em largura muito estreita, permanecem somente os ícones com nomes acessíveis. As ações de mover também ficam no menu de cada capítulo.
- A barra de status que contém controles do Basic usa um posicionamento flutuante compacto inspirado no Prism, com cores do tema atual e espaço junto aos botões nativos. Nenhum outro estilo do Prism é importado.

A release inclui `main.js`, `manifest.json` e `styles.css`. Faça backup das configurações antes de atualizar. O CI cobre renderização simulada, comandos, compatibilidade de Markdown e contratos CSS; é recomendável verificar a interface no Obsidian e em temas de terceiros após instalar.
