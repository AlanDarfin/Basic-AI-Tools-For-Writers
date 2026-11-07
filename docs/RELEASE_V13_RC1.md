# Basic v13.0.0-rc.1 — Fundação visual pública (pré-lançamento)

Esta é uma release candidate pública para avaliação, não a v13 estável.
Todos os artefatos distribuem o mesmo plugin Basic e requerem Obsidian 1.11.4+.

## O que mudou

- Fundação visual com tokens Obsidian-native, navegação acessível e picker
  unificado de comandos na toolbar e no toolbox.
- 333 seletores reincidentes auditados; 106 declarações redundantes removidas
  do CSS distribuído sem remover media queries nem fallbacks.
- Ajustes responsivos para Longform, Spaces, Timeline, Dragger, Homepage
  e recipiente da barra nativa Surfing, mantendo o DOM original Surfing.
- Varredura de classes dinâmicas e remoção de quatro trechos comprovadamente
  sem uso ou efeito; testes de contratos DOM/CSS.

## Instalação para teste

1. Faça backup do cofre e das configurações do Basic.
2. Baixe o arquivo Basic-13.0.0-rc.1.zip nos Assets desta release.
3. Extraia main.js, manifest.json e styles.css na pasta do plugin Basic
   dentro da pasta .obsidian/plugins, substituindo os arquivos antigos.
4. Recarregue o Obsidian e habilite o Basic.

## QA ainda necessário

CI verde não valida a interface real em dispositivo. Execute o
[checklist visual](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/refactor/v13-ui-foundation/docs/V13_QA_VISUAL.pt-BR.md)
em Android/desktop, Light/Dark, Longform, Spaces, Timeline, Dragger e Surfing.
Reporte problemas no [PR #122](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/122).
A promoção para versão estável depende dessas evidências.