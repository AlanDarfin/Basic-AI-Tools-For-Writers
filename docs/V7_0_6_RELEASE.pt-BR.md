# 7.0.6 — Realce da linha somente durante a interação

Correção para o modo máquina de escrever e sua convivência com o Remember Cursor Position.

- Ao abrir ou trocar de nota, a linha não é destacada imediatamente.
- O realce só aparece após um clique/toque no editor ou uma interação pelo teclado.
- Usar a roda do mouse sobre o editor desliga o realce e suspende a centralização da linha até uma nova interação no editor.
- Cada painel de edição gerencia seu realce independentemente; interagir em uma janela não ativa a outra.
- Seleções programáticas, restauração de cursor e ajustes automáticos de viewport não contam como interação.
- Se um gesto real ocorrer enquanto a restauração automática ainda está pendente, essa restauração é cancelada. As posições salvas continuam intactas e serão usadas novamente quando a nota for reaberta.
- O destaque e o escurecimento de outras linhas são condicionados à interação, evitando que o modo foco atenue todo o texto após uma rolagem.

Sem mudanças no conteúdo das notas, no Longform, nas integrações com IA ou no Pandoc. Foram adicionados testes de gestos, restauração e múltiplos painéis.

Atualize os arquivos oficiais `main.js`, `manifest.json` e `styles.css` juntos.

[English](V7_0_6_RELEASE.en.md).
