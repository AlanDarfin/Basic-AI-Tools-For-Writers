# Auditoria técnica pré-v10 — versão 9.4.0

Auditoria de presença de código e compatibilidade, não declaração de paridade integral dos projetos de referência.

| Pedido / área | Evidência de implementação | Limites de validação |
| --- | --- | --- |
| Chat fictício, áudio falso, quebras e personalizações | src/v8/finish-blocks.js, CSS e teste v9-4-0 | Animação sem som; teste visual mobile ainda necessário |
| Longform, navegação, StoryLine e projetos | src/v6, src/v7 | Fluxo real e drag-and-drop requerem Obsidian |
| LanguageTool, cursor, IA, tradução, TTS | src/v3, src/v4 | Engines remotos, Android e tradução completa de UI precisam de testes manuais |
| Homepage, calendário, estudos | src/v8, src/v9/calendar-studio.js | Posição/restauração de painéis depende do Obsidian |
| Soundscapes e Click Clack | src/v9/soundscapes.js, click-clack.js | Reprodução remota e Webview dependem de serviços externos |
| Explorer, sorting, ícones, previews | src/v9/native-explorer.js, explorer-flex.js, explorer-favorites-preview.js | Conferir alinhamento em 720p/Android |
| Pretty Properties, Flow, slash, Spaces | src/v9/pretty-properties.js, flow-composer.js, flow-slash.js, smart-spaces.js | Implementações próprias, não equivalência total com upstream |
| Pomodoro | src/v9/pomodoro.js | Conferir painel e status bar no app |
| PT/EN | README, docs/BLOCKS | Arquivos bilingues presentes; revisão de todas as telas não automatizada |

## Critérios para encerrar a série 9.x

- Executar check completo, teste CSS e sincronização bundle/CSS na Actions.
- Testar o bloco chat com áudio simulado, quebras de linha, cores, nomes, avatares e teclados móveis.
- Conferir hover/long press das descrições, previews de Folder Notes, alinhamento de ícones e reticências.
- Validar Spaces separados, restauração dos painéis e a barra de status no Desktop.
- Testar reprodução externa de Soundscapes, TTS/LanguageTool no Android e traduções da UI.
- O workflow de release só publica após a validação, anexando main.js, manifest.json e styles.css.

A existência de módulos e testes não prova que todos os pedidos antigos foram atendidos sem exceção.
