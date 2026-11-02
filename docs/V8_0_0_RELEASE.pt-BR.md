# Basic AI Tool for Writers 8.0.0 — Performance & Polish

Esta versão prioriza compatibilidade, correções gramaticais e integração da interface ao Obsidian no computador e no Android.

## LanguageTool / HTML
- O corretor ignora tags e atributos HTML (como `align` e `center`), entidades e conteúdo de blocos `script/style/svg/math/pre/code/textarea/iframe`, mantendo o tamanho do texto, as quebras de linha e os offsets originais.
- O texto legível entre tags continua sendo revisado; as correções não podem atingir a marcação ignorada.
- No Android, tocar em um destaque pode abrir uma janela nativa do Obsidian com opções maiores para substituir, explicar ou ignorar. O menu de hover e clique existente continua no PC.
- Se o evento de toque não atingir diretamente o destaque, o plugin usa a posição tocada no CodeMirror.
- Notas com muitas sugestões mostram 24 cartões de cada vez; a lista completa e os destaques no editor continuam disponíveis.

## Desempenho
- Cache de até 128 índices de notas Markdown sem alterações, verificados por data de modificação e tamanho.
- Cache por 10 segundos para a listagem de links internos, evitando percorrer o cofre a cada sugestão do autocomplete.
- Revisões longas geram menos elementos simultaneamente.

## Interface e manutenção do CSS
- Utilização das variáveis do tema do Obsidian em cartões e ações do revisor no celular.
- Rolagem horizontal das abas sem encaixe automático ou animações desnecessárias, limitada aos painéis do Basic AI.
- Estilos de navegação e revisão mobile em arquivos separados em `src/styles/`, reunidos no `styles.css` único por `scripts/build-css.js` e validados no CI.
- Permanecem as funções anteriores, Pandoc, Longform e idiomas português/inglês.

## Validação e limitações
- Testes de JavaScript, build, CSS e regressões estão integrados ao GitHub Actions.
- É uma manutenção focada nos problemas encontrados, não uma alegação de que todo o CSS legado foi eliminado ou de que o desempenho já foi medido em todos os celulares. Confira o pop-up no Android após atualizar.
- O LanguageTool continua enviando trechos ao serviço configurado segundo as opções de privacidade existentes.

Atualize os três arquivos oficiais juntos: `main.js`, `manifest.json`, `styles.css`.

[English](V8_0_0_RELEASE.en.md).
