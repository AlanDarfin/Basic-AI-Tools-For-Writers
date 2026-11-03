# 9.2.4 — Homepage dashboard layout

## PT-BR
- Painel com duas colunas de widgets de altura independente, distribuídos por peso aproximado para aproveitar os espaços vazios.
- Arraste pela alça no cabeçalho para mudar a posição dos widgets.
- Menu discreto por widget, com opções de mover para cima/baixo e remover, mantendo alternativa ao arraste.
- Ordem salva em `v8Finish.homeOrder` e preservada após reiniciar.
- No celular e em telas estreitas, os widgets são exibidos em uma única coluna.
- CSS modular e arquivos gerados sincronizados; versão atualizada em `manifest.json`, `versions.json` e `package.json`.

## EN
- Balanced independent-height dashboard columns avoid gaps next to tall widgets.
- Drag the header grip to reorder cards.
- Accessible fallback menu includes move earlier/later and remove.
- Reordering persists in `v8Finish.homeOrder`.
- Single-column layout on mobile and narrow windows.

## Installation
Use the updated `main.js`, `styles.css` and `manifest.json` from the same commit.

## Verification
Both the shipped JS bundle and modular homepage source passed JavaScript syntax compilation. Obsidian runtime and complete npm test suite were not run here.
