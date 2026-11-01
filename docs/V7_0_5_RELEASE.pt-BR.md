# 7.0.5 — Séries fixas no cabeçalho do Longform

Atualização de interface para o gerenciador de projetos.

- O botão de Séries não divide mais a mesma linha flexível do seletor de projetos, que antes fazia o botão saltar de posição ao mudar de aba ou diminuir a largura.
- Uma segunda linha permanente mostra **Série** e a série do livro selecionado, com um botão **Gerenciar** ao lado.
- Livros sem vínculo mostram **Sem série**. Livros pertencentes a mais de uma série exibem seus nomes juntos, com o texto completo disponível no título do campo.
- O botão abre o mesmo gerenciador já existente; adicionar, remover e renomear séries atualiza a informação do cabeçalho imediatamente, sem recriar o painel.
- O conteúdo dos livros, os índices Longform, o Pandoc e as demais funções permanecem inalterados.

Foram adicionados testes de regressão da posição da linha, atualização de vínculo e alternância de abas. Atualize `main.js`, `manifest.json` e `styles.css` juntos.

[English](V7_0_5_RELEASE.en.md).
