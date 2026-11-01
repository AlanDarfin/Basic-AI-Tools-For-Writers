# Basic AI Tool for Writers 6.0.0 — lançamento estável

## Interface unificada

A versão 6 apresenta um visual **compacto, limpo e consistente em todas as interfaces**: configurações, dicionário, tradução, chat, Ferramentas de escrita, Projetos/Longform, revisão, Markdown, janelas e controles no celular. As abas roláveis e os componentes nativos seguem o tema do Obsidian sem alterar o restante do aplicativo.

### Longform Nav redesenhado

O bloco de navegação não força mais cartões de duas colunas em telas estreitas. Cada direção fica em uma linha de largura total, com categoria e **título completo do capítulo ou subcapítulo**, podendo quebrar a linha quando necessário. Duas colunas aparecem somente em contêineres largos.

- Comando **Ir para capítulo**, com busca pela ordem real do Longform.
- Rodapé automático opcional nos capítulos, na leitura e no Live Preview, sem modificar as notas.
- Blocos `longform-nav` já inseridos impedem que o rodapé automático seja duplicado.
- **Modo manual** para quaisquer notas, mesmo fora de projetos Longform:
```longform-nav
mode: manual
previous: "[[Notas/Anterior]]"
next: "[[Notas/Próxima]]"
```
Cada direção é opcional. Links ausentes não são abertos.

### Ferramentas de escrita

- Ruby acima: `{base|leitura}`; abaixo: `{base|leitura|under}`. Renderização na leitura e no Live Preview, com Markdown editável.
- Avaliações interativas, datas Discord, spoilers e subtexto, estimativa de leitura e Linter com prévia.
- Inserção inteligente por comandos nativos e menu de contexto, **sem ressuscitar a antiga Editing Toolbar**.
- Preferências por projeto: navegação, recursos ativados/desativados, orientações editoriais e perfil de escrita sugerido.

### Testes e compatibilidade

O plugin mantém a estrutura e as configurações anteriores. Os estilos são limitados às interfaces do Basic AI e usam variáveis do tema. O lançamento exige aprovação da suíte automatizada, teste de sincronização do bundle, verificação de CSS e regressão específica do Longform Nav.

**Limitação:** testes automatizados não garantem o resultado em todos os temas e WebViews do Android; continue relatando problemas encontrados nos aparelhos reais.

## Instalação

Baixe `main.js`, `manifest.json` e `styles.css` ou o ZIP com os três arquivos. Copie para `.obsidian/plugins/basic-ai-tool-for-writers/` e recarregue o Obsidian. Faça backup do cofre antes de substituir uma beta antiga.

**Tag:** `6.0.0` (sem prefixo `v`). **Obsidian mínimo:** 1.11.4. **Desktop e celular.**

English: [Release notes in English](V6_RELEASE.en.md).
