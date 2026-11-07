# v13 — Auditoria de contratos CSS/DOM e classes dinâmicas

**Escopo:** código JavaScript compilado de 102 módulos, CSS distribuído e adaptadores v13.
**Método:** inventário estático de APIs de DOM e padrões de construção de classes;
seletores de terceiros verificados quanto ao isolamento por recipiente.
**Status:** checagens estáticas automatizadas; renderização/touch no Obsidian não executados.

## Inventário quantitativo

| Indicador | Ocorrências |
| --- | ---: |
| `cssClasses` | 1173 |
| `cssClassLiteralsMissingInJs` | 80 |
| `classListAdd` | 63 |
| `classListToggle` | 67 |
| `classListRemove` | 39 |
| `createDivWithClass` | 617 |
| `createElWithClass` | 413 |
| `classNameAssignments` | 64 |
| `stringConcatenations` | 895 |
| `templateInterpolations` | 13 |
| `inlineStyleAssignments` | 113 |
| `dynamicSetProperty` | 35 |

## Contratos de propriedade e limites

- **Surfing:** somente `input.wb-search-bar` e `.wb-refresh-button` são referenciados por CSS de integração, ambos sob `.writer-v8-home .writer-v1205-native-surfing-host`. Não há regra global no v13 para `.wb-*` nem para HeaderBar nativa.
- **Longform:** `.writer-v11-studio` e `.writer-v11-studio-modal` limitam a largura de seus conteúdos; nenhum seletor externo global foi alterado.
- **Spaces:** `.writer-v102-spaces-manager` e modais locais usam tokens do Basic sem atingir o explorador nativo fora do host.
- **Timeline:** `.writer-v95-timeline` e suas variações de layout/tema continuam sob raiz própria, preservando scroll condicional.
- **Dragger:** `.writer-v106-drag-handle` tem prefixo exclusivo do Basic, não altera `.cm-editor`/outros plugins; alça desktop é escondida no Android.
- **Obsidian Light/Dark:** valores dependem de `var(--background-*)`, `var(--text-*)` e `var(--interactive-accent)`; regras separadas para contraste elevado e movimento reduzido.

## Classes sem texto literal correspondente no JS

Foram localizadas **80** classes CSS sem ocorrência literal em `main.js` (de 1173 classes com prefixo conhecido). **Isto não implica código morto.**
O usuário pode fornecer classes em Markdown/HTML; plugins podem inserir DOM dinâmico e alguns estados são calculados por concatenação/template literal.
Por isso não foi feita remoção automática dessas classes.

Amostra de classes preservadas:

- `.dictionary-entry`
- `.dictionary-modal-actions`
- `.dictionary-writer-modal`
- `.dictionary-section-divider`
- `.dictionary-modal-primary-actions`
- `.dictionary-modal-result`
- `.writer-chat-user`
- `.writer-chat-assistant`
- `.writer-review-actions`
- `.writer-review-select-label`
- `.writer-review-popup-close`
- `.writer-diff-add`
- `.writer-diff-remove`
- `.writer-diff-same`
- `.writer-review-mobile`
- `.writer-review-action-goto`
- `.writer-review-action-ignore`
- `.writer-review-action-explain`
- `.writer-review-actions-has-variants`
- `.writer-review-action-accept`
- `.writer-lt-major`
- `.writer-lt-minor`
- `.writer-lt-style`
- `.writer-v5-underline`
- `.writer-v5-superscript`
- `.writer-v5-subscript`
- `.writer-v5-spoiler`
- `.writer-v51-search`
- `.writer-v51-search-results`
- `.writer-v6-booknav-next`
- `.writer-v6-booknav-sub`
- `.writer-v6-ruby-under`

## Remoções comprovadas nesta etapa

- `WRITER_V9_EXPLORER_COLORS` — constante sem referências fora da própria declaração.
- `WRITER_V92_FAVORITE_ICONS` — constante sem referências fora da própria declaração.
- `allDay` — identificador não lido; chamada `board.createDiv(...)` mantida para preservar o DOM.
- Callback `.onChange(()=>{})` sem efeitos no campo de ID customizado — removido, preservada a criação/placeholder do campo.
- Nenhuma classe apenas ausente de uma busca textual foi removida; nenhuma função chamada por nome dinâmico foi eliminada.

## Critérios do gate

Execute `node scripts/audit-v13-dom-contracts.js --check`, `npm run build`, `npm run check` e `node --test tests/css-community-lint.test.cjs`.
Evidências de layout/touch devem ser registradas no [roteiro visual](V13_QA_VISUAL.pt-BR.md).
Uma execução com CI verde não significa que P1–P8 e A1–G4 foram realizados em Obsidian.
