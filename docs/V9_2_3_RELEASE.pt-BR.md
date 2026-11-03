# Basic AI Tool for Writers — 9.2.3

## Corrigido

- **Título da homepage:** expressão regular das configurações removia acidentalmente as letras minúsculas `r` e `n` durante a digitação. A limpeza agora é centralizada e preserva letras, acentos, símbolos e emojis, removendo apenas quebras de linha reais e caracteres de controle. Os títulos já salvos sem essas letras precisam ser digitados novamente uma vez.
- **Explorador de arquivos:** o ícone de favorito é centralizado verticalmente de acordo com a altura real da linha, evitando desalinhamentos em temas compactos. A área de toque no Android mantém o tamanho adequado.
- **Homepage no PC:** ícone Lucide e imagem personalizados maiores e melhor proporcionados em relação ao título. Ajustes de espaçamento, altura de linha e visibilidade de caracteres; o layout vertical do celular foi preservado.

## Verificação

Adicionados testes de regressão para o alfabeto completo (maiúsculas e minúsculas), letras acentuadas, Unicode, números, símbolos, múltiplos sistemas de escrita e quebras de linha; além de verificações de CSS e de sincronização do bundle.

A inspeção do código gerado encontrou somente uma expressão de título incorretamente escapada. Outras expressões com barras invertidas estavam ligadas a manipulação de caminhos ou sintaxe de Markdown e foram preservadas.
