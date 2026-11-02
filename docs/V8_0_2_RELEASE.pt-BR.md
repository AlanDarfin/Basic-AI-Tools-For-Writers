# Basic AI Tool for Writers 8.0.2 — Interface móvel e estabilidade ao atualizar

Uma manutenção focada nos problemas mostrados nas capturas de tela do Android.

## Interface e navegação
- As subabas de Estrutura (Tramas, Marcos narrativos, Ritmo, Conexões) não quebram mais palavras dentro de botões estreitos. A linha é rolável horizontalmente, aceita roda do mouse/trackpad e conserva a aba ativa.
- O campo opcional de contexto nas Definições começa com duas linhas, em vez de ocupar quase toda a barra lateral. Expande ao receber foco e admite redimensionamento.
- Sinônimos, Antônimos e ações secundárias de Ferramentas adotam botões transparentes com borda sutil, como no Longform. As ações principais continuam destacadas na cor do tema.
- Os estilos ficam restritos ao Basic AI: não alteram Marcadores, Explorador nem outros plugins do Obsidian.

## Atualizações sem perder os painéis
- Ao descarregar, o plugin salva temporariamente na sessão quais painéis do Basic AI, Longform e Ferramentas estavam abertos, suas abas escolhidas e quais laterais estavam expandidas.
- No próximo carregamento imediato, após o layout do Obsidian estar pronto, recria apenas painéis que ainda não tenham sido restaurados, recuperando a aba escolhida e reabrindo apenas laterais que estavam visíveis.
- A captura expira após dois minutos e é consumida uma única vez. Painéis fechados manualmente ou recolhidos anteriormente não são abertos à força. Nenhum texto do cofre é modificado.
- O Obsidian ainda destrói visualizações do plugin durante o descarregamento; esta implementação recupera os painéis após a atualização, sem manter o DOM anterior.

## Verificação
- Testes de rótulos, CSS, tamanho do contexto, captura e restauração de sessões, painéis fechados e snapshots expirados.
- GitHub Actions também valida a suíte completa, o bundle e as regras CSS da comunidade.

Atualize juntos `main.js`, `manifest.json` e `styles.css`. Confira o comportamento de toque em um Android real após instalar.

[English](V8_0_2_RELEASE.en.md).
