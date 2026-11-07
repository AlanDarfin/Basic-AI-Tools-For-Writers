# Basic v13 — Checklist de QA visual e funcional (Obsidian)

**Versão em teste:** v13 | **Base mínima Obsidian:** 1.11.4 | **Data:** 07/11/2026

> Este é um roteiro executável para revisão humana/desenvolvimento. A inspeção não foi feita
> no aplicativo por automação; todos os campos começam **NÃO EXECUTADO**. CI verde
> é pré-requisito, não substitui screenshots e testes reais.

## Preparação e evidências

1. Faça backup do cofre e das configurações do Basic. Crie um cofre de teste contendo
   pasta pai e subpastas, notas Markdown grandes, texto com acentos, imagens, banners,
   tarefas, blocos Timeline e um projeto Longform com capítulos/subcapítulos.
2. Registre a versão do Obsidian, versão do Basic, sistema operacional, dispositivo,
   escala de interface, tema (nome e versão), plugins externos habilitados e SHA do PR.
3. Faça teste com o **tema padrão claro e escuro**, e repita os fluxos críticos com ao
   menos um tema de terceiros em ambos os modos. Não use apenas preferência do OS;
   mude o tema nas configurações do Obsidian.
4. Desktop: testar **1280×720** e **1440×810** (com escala normal e, se aplicável,
   escala ampliada). Android: retrato e paisagem, teclado aberto/fechado e rolagem
   com um dedo. Registrar imagens antes/depois de alterações.
5. Para cada caso, marque PASSOU/FALHOU/BLOQUEADO e anexe captura ou vídeo,
   navegador/tema, passos, resultado esperado, observado e logs da console
   do Obsidian (quando disponíveis), sem chaves API ou notas privadas.
6. Repetir a checagem de estado: mudar de aba, fechar/reabrir o aplicativo,
   desativar/reativar o módulo e trocar de Space.

## Matriz obrigatória de execução

| ID | Ambiente e tema | Telas/fluxos de maior risco | Estado inicial |
| --- | --- | --- | --- |
| P1 | Desktop 1280×720 / Light | Configurações, Homepage, Timeline | NÃO EXECUTADO |
| P2 | Desktop 1280×720 / Dark | Configurações, Longform, Spaces | NÃO EXECUTADO |
| P3 | Desktop 1440×810 / Light | Homepage, Surfing, redimensionamento | NÃO EXECUTADO |
| P4 | Desktop 1440×810 / Dark | Dragger, Timeline, comandos e modais | NÃO EXECUTADO |
| P5 | Android retrato / Light | Configurações, Homepage, Longform, scroll | NÃO EXECUTADO |
| P6 | Android retrato / Dark | Spaces, Timeline, Surfing, teclado | NÃO EXECUTADO |
| P7 | Android paisagem / Light e Dark | Modais, conteúdo largo, inputs, resize oculto | NÃO EXECUTADO |
| P8 | Tema de terceiros / Light e Dark | Foco, bordas, contraste, hover, popups | NÃO EXECUTADO |

## Roteiro passo a passo — telas e componentes

### A. Estrutura e tema (A1–A6)
- [ ] **A1** Abrir Basic → Configurações → cada uma das oito categorias;
  nenhuma das 54 páginas deve sumir. Navegar com Tab, setas, Home, End e toque.
- [ ] **A2** Rolar abas horizontais, expandir seções e pesquisar por termo específico
  (por exemplo: “subescrito”); ver ícones sem cortes, campos alinhados e sem espaço
  vazio inesperado. Repetir em 1280×720 e Android.
- [ ] **A3** Alternar Light↔Dark com telas abertas: fundo, superfícies, bordas,
  textos, acentos, botões disabled, foco e estados ativos usam tokens do tema;
  nenhum texto deve ficar ilegível.
- [ ] **A4** Ativar tema com contraste alto ou preferência de maior contraste;
  foco visível em teclado, bordas legíveis e sem vazamento de CSS para o editor.
- [ ] **A5** Ativar redução de movimento do sistema; hover/transições não devem
  gerar animação excessiva. Testar teclado virtual Android sem esconder ações.
- [ ] **A6** Abrir outra visualização nativa do Obsidian e um plugin externo;
  garantir que títulos e botões externos não mudaram por conta do CSS do Basic.

### B. Homepage e navegação (B1–B5)
- [ ] **B1** Abrir homepage ao iniciar sessão, nova aba e retorno de outras abas;
  testar configuração para ativar/desativar abertura automática sem reabrir abas antigas.
- [ ] **B2** Pesquisa, recentes, favoritos, relógio, calendário, galeria e
  bookmarks: ícones centralizados, nenhuma palavra cortada, scroll preservado.
- [ ] **B3** Mover widgets no desktop e redimensionar pelas bordas/cantos;
  testar encaixe na grade e arranjo desalinhado; a região vazia não deve capturar
  clique ou drag. No Android, as alças de resize não devem aparecer.
- [ ] **B4** Abrir o seletor de comandos do Basic (toolbar e atalhos), pesquisar
  com/sem acento e múltiplos termos, usar ↑/↓, Home, End, Enter e Esc; foco,
  lista e escolha precisam funcionar sem duplicidade.
- [ ] **B5** Retornar à homepage após alternar Light/Dark, Space e tamanho de janela;
  verificar cards, scroll, transparência e responsividade sem reinício.

### C. Longform (C1–C4)
- [ ] **C1** Abrir projeto Longform, navegar capítulos e subcapítulos com conteúdo
  longo; títulos, barras de ações, listas e editor não ultrapassam a janela.
- [ ] **C2** Testar painel/modal Longform Studio, ações e campos ao abrir teclado
  no Android; modal permite rolagem vertical, sem cortar botões de confirmação.
- [ ] **C3** Navegação manual próximo/anterior, recompilação/preview, mudança
  de aba e retorno: estado e scroll persistentes, sem painel saltar para rodapé.
- [ ] **C4** Light, Dark e tema externo: contraste nos cartões, SVGs, bordas,
  foco, destaque de capítulo ativo e uso correto das cores do tema.

### D. Spaces (D1–D4)
- [ ] **D1** Criar dois Spaces e associar um deles à pasta com subpastas; o
  explorador deve mostrar o conteúdo da raiz do Space, sem exibir ancestrais.
- [ ] **D2** Ocultar pasta em Space A e confirmar que segue visível em B;
  alternar a aba e voltar, conferir seletor persistente/colapsável e rodapé.
- [ ] **D3** Abrir gerenciador de Spaces e testar criar/renomear/ícone/remover,
  ordenação, botões, campo de pesquisa, foco, altura de modal e rolagem Android.
- [ ] **D4** Trocar tema e largura, abrir/fechar sidebar; não aparecer sobreposição
  ou corte, nem alteração de elementos externos ao Basic.

### E. Timeline (E1–E5)
- [ ] **E1** Renderizar bloco timeline com eventos curtos e longos, imagens,
  marcadores e datas; nenhum conteúdo ultrapassa os limites ou sobrepõe outro.
- [ ] **E2** Alternar horizontal↔vertical; rolagem horizontal dentro da timeline
  sem rolagem horizontal indesejada no corpo da nota.
- [ ] **E3** Testar todos os temas da timeline (minimal, compact, editorial,
  cards, poster, terminal) com eventos de exemplo; verificar diferenças visíveis
  e alinhamento de título, linha, marcador e imagem.
- [ ] **E4** Em Android, rolar um evento de texto grande e usar controles;
  ausência de clipping, sobreposição, menus fora da tela e captura de toque errada.
- [ ] **E5** Repetir com modo Light/Dark e um tema de terceiros, além de
  fonte maior, verificando tokens/contraste e estados vazios.

### F. Dragger (F1–F4)
- [ ] **F1** Desktop: mover ponteiro para alça de um bloco, atravessar região
  entre bloco e alça; alça não deve desaparecer antes do clique.
- [ ] **F2** Arrastar bloco individual e múltiplos blocos/ninhos; indicador de
  destino e cursor corretos; a nota final deve manter sua formatação.
- [ ] **F3** Clicar espaço vazio, links e controles do editor: dragger não deve
  capturar essas áreas. Testar caso o plugin Dragger externo esteja ativado.
- [ ] **F4** Android: não criar nem mostrar alça desktop e não interferir em
  seleção de texto/rolagem natural.

### G. Surfing (G1–G4)
- [ ] **G1** Habilitar Surfing; abrir homepage: a busca nativa do Surfing deve
  aparecer dentro do host Basic apenas quando integração estiver ligada.
- [ ] **G2** Digitar endereço, usar ações da barra nativa; comparar com Surfing
  isolado. O Basic não pode substituir cabeçalho nem quebrar navegação externa.
- [ ] **G3** Desativar Surfing; a barra hospedada não deve ocupar espaço ou
  deixar campo falso. Abrir Surfing isolado e verificar HeaderBar intacta.
- [ ] **G4** Em Android, confirmar comportamento de fallback nativo/navegador
  externo e ausência de controles desktop vazios; testar Light/Dark.

## Critérios de aceitação e entrega

- **BLOQUEADOR (P0/P1):** dados perdidos, plugin sem iniciar, tela essencial
  inacessível, input sem foco, scroll quebrado, drag indevido, conteúdo cortado
  sem acesso por rolagem, estilo do Surfing nativo alterado.
- **IMPORTANTE (P2):** desalinhamento recorrente, foco invisível, contraste
  insuficiente, widget reordenando ou tamanho não persistindo.
- **COSMÉTICO (P3):** diferença pontual de padding/borda sem perda de uso.
- Para liberar versão **estável**, todos os cenários P1–P8 e A1–G4 devem estar
  registrados; nenhum P0/P1 aberto, P2 documentados com decisão e evidência.
- PR Ready for Review pode ser aberto com QA humano ainda pendente, mas
  **Ready for Review não é aprovação de QA nem autorização automática de release estável**.

## Modelo de registro por falha

```text
ID: E3
Dispositivo / resolução / escala:
Obsidian / Basic / plugins e versões:
Tema / Light ou Dark:
Passos:
Esperado:
Observado:
Severidade: P0 / P1 / P2 / P3
Captura ou vídeo:
Console / logs (sem informações sensíveis):
Resultado após correção:
```
