# 7.1.1 — Menu do LanguageTool ao passar o mouse ou posicionar o cursor

Melhoria na forma de abrir o menu flutuante das sugestões gramaticais.

- **Hover no computador:** ao manter o mouse brevemente sobre uma palavra ou sentença destacada pelo LanguageTool, o menu aparece mesmo quando o cursor de texto está em outra posição.
- **Cursor de texto:** clicar no erro ou navegar com as setas, Home ou End até uma palavra destacada abre o menu.
- **Android:** continua possível abrir o menu tocando no trecho destacado, sem depender de hover.
- **Estabilidade:** um pequeno atraso evita popups enquanto o mouse passa rapidamente sobre erros; timers e eventos são removidos ao fechar o editor. Um menu já aberto para o mesmo erro não é recriado repetidamente.
- **Privacidade e chamadas:** o acionamento apenas apresenta sugestões já recebidas. Ele não solicita análises extras ao servidor do LanguageTool.
- **Configuração:** o recurso continua vinculado à opção do painel de Revisão para ativar/desativar sugestões flutuantes.

Mantidos os recursos de rechecagem localizada da 7.1.0, as regras ignoradas, o Remember Cursor Position, Longform e Pandoc.

Atualize os três arquivos oficiais `main.js`, `manifest.json` e `styles.css` juntos.

[English](V7_1_1_RELEASE.en.md).
