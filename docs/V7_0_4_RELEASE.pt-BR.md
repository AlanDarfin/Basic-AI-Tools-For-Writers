# 7.0.4 — Abas estáveis do Longform e configurações roláveis

Manutenção pequena para corrigir definitivamente a navegação horizontal.

- **Longform:** clicar em Relações, Mapas, Galeria, Sessões ou outras abas troca somente o conteúdo selecionado. A mesma barra de abas permanece na tela, sem reconstrução do painel completo.
- **Grupos do Longform:** Escrita, Universo e Projeto trocam os botões na mesma barra e lembram individualmente suas posições.
- **Configurações:** a primeira e a segunda fileira de abas permitem rolagem horizontal com mouse/trackpad. A troca entre opções do mesmo grupo não recria a segunda fileira, mantendo o ponto do scroll.
- **Rolagem:** desativado o encaixe automático e o efeito de animação somente nas barras de navegação do Basic AI.
- **Preservados:** dimensões de toque do Android, arquivos do cofre, Pandoc, permissões e funções de escrita.

Foram adicionados testes de regressão da navegação. Atualize juntos os três arquivos oficiais: `main.js`, `manifest.json` e `styles.css`.

[English](V7_0_4_RELEASE.en.md).
