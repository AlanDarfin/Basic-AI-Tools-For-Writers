# Basic 12.0.5 — Surfing nativo, widgets redimensionáveis, timeline e Dragger

**Requer Obsidian 1.11.4+; PC e Android.** Mantém o ID, os Spaces, os favoritos e os arquivos existentes.

## Homepage e favoritos
- A barra de pesquisa no topo da homepage passa a usar o **componente original HeaderBar do Surfing habilitado** no PC, incluindo suas sugestões e comportamento. Não é mais uma cópia visual criada pelo Basic. O Basic não empacota código do Surfing; sua implementação usa uma interface interna que poderá exigir ajustes caso o Surfing mude.
- O Surfing precisa estar instalado e ativado. Caso esteja desativado ou a interface nativa deixe de ser compatível, a homepage preserva a busca de notas sem criar outra barra falsa.
- Widget **Favoritos da Web** com cartões mais legíveis, agrupamento, ícones Lucide, menu contextual em cada cartão e boa adaptação a telas estreitas.
- Widgets podem ser redimensionados no PC pela borda direita, inferior ou canto. Opções **Encaixar na grade**, **Tamanho livre** e **Restaurar dimensões** no menu, com suporte ao teclado. Tamanhos e modos são salvos nas preferências globais ou no Space ativo.
- Presets da homepage passam a incluir as dimensões livres e o modo de alinhamento. No Android, a grade continua em uma coluna e as alças de redimensionamento ficam ocultas.

## Timeline
- Corrige o corte vertical do conteúdo nas timelines horizontais e ajusta rolagem, larguras, imagens e quebra de títulos em painéis estreitos.
- Centraliza a conexão entre marcadores e linha nos estilos 2–5, respeitando suas dimensões.
- Diferencia os oito temas (Clássico, Cartões, Minimalista, Compacto, Editorial, Pôster, Vidro e Terminal) com estilos próprios e alinha cabeçalhos, datas e conteúdo.

## Dragger
- Corrige a alça que aparecia no PC, mas não iniciava o arraste: o evento de início agora é registrado no elemento real, anexado ao documento.
- Oculta a alça em linhas vazias e mantém o bloco ativo enquanto o cursor atravessa o espaço entre o editor e a alça.
- O Dragger continua **desativado no celular** e evita disputar o controle caso outro plugin Dragger esteja ativo.

## Auditoria
- PRs e issues abertos revisados antes das mudanças.
- Relatório de paridade: [Funções ainda não integradas](V12_0_5_INTEGRATION_GAPS.pt-BR.md), especialmente Unique, Notion e Number Suite.
- Testes de regressão adicionados e build/arquivos do plugin validados no CI.

## Instalar
Baixe `basic-12.0.5.zip` na release, extraia `main.js`, `manifest.json` e `styles.css` para `.obsidian/plugins/basic-ai-tool-for-writers/` e recarregue o Obsidian. **Não apague `data.json`.**
