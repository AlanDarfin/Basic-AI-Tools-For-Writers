# v9.0.1 — Calendar UI and sidebar maintenance (development)

## Português (Brasil)

Esta atualização corrige a poluição visual vista no Android, **sem alterar a estrutura das notas de evento**:

- **Datas sem cilindros:** números simples, sem fundos ovais; dia atual com texto de destaque, dia selecionado com borda no cartão e dias fora do mês discretos.
- **Mês:** tocar no número abre a visualização do dia; tocar na área vazia do dia abre a criação de evento. Os eventos existentes continuam abrindo para edição.
- **Dia, 3 dias e semana:** as dezenas de botões grandes `+` foram substituídas por áreas de toque discretas com rótulos de acessibilidade. No computador, a indicação `+` aparece só ao passar o cursor ou dar foco; no celular, o espaço permanece clicável sem preencher a tela com controles.
- **Barra superior:** controle responsivo em telas estreitas e atalho para abrir na barra lateral direita.
- **Local de abertura:** novo seletor nas configurações **Personalização → Calendário** para **aba**, **barra lateral esquerda** ou **barra lateral direita**. Três comandos adicionais na paleta permitem abrir diretamente nesses locais.
- Nas barras laterais, novas visualizações abrem na **Agenda** e escondem o mini-calendário interno para aproveitar melhor o espaço. A visualização normal em aba mantém a preferência atual.

A versão 9.0.0 permanece publicada e inalterada enquanto a PR desta manutenção é validada. As ações criam eventos locais em Markdown e não adicionam sincronização remota.

**Teste manual necessário:** conferir os números e os horários no Android, gestos/toques, teclado, temas do Obsidian e abertura simultânea de calendários em locais diferentes. A validação automatizada não substitui o teste no aplicativo real.

## English

This maintenance revision removes pill-shaped day-number backgrounds, replaces repeated large `+` controls with accessible blank-slot tap areas, improves responsive toolbar layout, and adds a saved calendar opening location (main tab, left sidebar or right sidebar). The existing Markdown event store is unchanged. A newly opened docked calendar defaults to the compact Agenda view, without its internal mini-calendar.

Commands: **Calendar: open in main tab**, **Calendar: open in left sidebar**, **Calendar: open in right sidebar**. The main calendar command respects the saved default placement.

The changes are under review until desktop/Android testing and CI complete; the 9.0.0 stable release remains unchanged.

## Outros ajustes da mesma manutenção (2 de novembro de 2026)

- **Conversas fictícias:** nome visível apenas quando presente na própria mensagem, e não apenas herdado das definições de lado. Mensagens consecutivas do mesmo personagem ocultam o nome e o avatar repetidos. Horário visível somente quando informado.
- **Abas das configurações:** grupos e subabas dividem o espaço horizontal livre, sem deixar grandes áreas vazias; mantêm scroll ao faltar largura.
- **Pesquisa:** campo único compacto, ícone de busca, limpar, contagem e até seis resultados por vez, sem cartão excessivamente alto.
- **Organização:** categoria **Escrita e Markdown** / **Writing & Markdown** reúne ferramentas de digitação, Markdown estendido, Pandoc, templates, Unicode e formatação; linter passa a Revisão e leitura.
- **Make.md:** continuam integrados ícones/cores no explorador, visões de pastas e Smart Spaces simples. Bancos relacionais, fórmulas/rollups, Flow Editor completo e Spaces originais continuam ausentes.

## Additional changes (English)

- Fictional chat displays speaker name only when directly authored, hides repeated name/avatar on adjacent messages by the same speaker, and only shows explicitly authored times.
- Settings navigation grows to use available horizontal width with overflow scrolling. Settings search is a compact, clearable field showing a limited set of results.
- Writing and Markdown are in a single **Writing & Markdown** group; writing linter moves to Review & reading.
- Make.md parity remains partial: native Explorer colors/icons, folder views and simple Smart Spaces are present; advanced databases, formulas, rollups, Flow and the original Spaces engine are not.

