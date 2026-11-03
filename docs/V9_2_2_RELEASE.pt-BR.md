# Basic AI Tool for Writers 9.2.2

## Balões do chat
- Corrige o alinhamento das mensagens enviadas pelo usuário no chat integrado: balões à direita, enquanto o assistente permanece à esquerda.
- Evita que a regra de mensagens fictícias `row-reverse` provoque regressões no chat da IA.
- Nenhuma alteração em credenciais, configuração de provedores ou geração da IA.

## Prévias de notas e pastas
- Descrições do explorador agora são blocos irmãos da linha nativa do título, posicionados **abaixo** do nome.
- Evita títulos concatenados com a prévia, como `TrabalhoTeste`, inclusive no Android.
- Preserva ações de Folder Notes, ícones de favorito, recuo de pastas e miniaturas de imagens locais.
- Mantém o botão de mostrar/ocultar prévias e as opções de modos da versão 9.2.1.

## Personalização de ícones no estilo Iconic
- Seleção unificada de ícones na homepage, favoritos e itens do explorador.
- Galeria visual com busca por todos os nomes Lucide disponíveis no Obsidian, prévia ampliada e ícone atual destacado.
- Guias Todos, Favoritos e Recentes; possibilidade de fixar ícones para uso futuro.
- Cor HEX com botão de restauração ao destaque padrão do tema.
- Escolhas por nota/pasta e ícones personalizados anteriores são preservados.

## Verificação
Testes de regressão e compilação do `main.js` e `styles.css`. Teste visual em Obsidian real ainda recomendado no mobile.
