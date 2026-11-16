# Visual Kit no Basic

O módulo integra as funções do [Visual Kit 0.9.1 de pedrof](https://github.com/pedrohf-dev/visual-kit/tree/ff4274caa4669aa0f95b05c4246bb5ce26abf9e3). No desktop, abra **Aparência e painéis → Imagens e anotações → Visual Kit** para configurar as funções. Não é necessário instalar o plugin original.

| Função auditada | Como usar no Basic |
| --- | --- |
| Colagem em lote e colagem rica | Cole imagens ou conteúdo formatado com imagens em uma nota Markdown. A ordem é preservada. Escolha pasta, modelo de nomes, separação e largura. |
| Deduplicação | O hash detecta arquivos idênticos. Configure se deve reutilizar, perguntar ou salvar outra cópia, e se o índice é persistente. Use a paleta para reconstruí-lo. |
| Normalização e redimensionamento | Use o menu da imagem para alterar a largura, ou a paleta para normalizar a nota/seleção por largura padrão, tamanhos predefinidos, largura personalizada ou tamanho original. |
| Anotações | Use o menu da imagem ou o comando no cursor. Inclui setas, formas, texto, traço livre, números, realce e tarja, além de desfazer/refazer, mover e ampliar. Salve um novo PNG, uma cópia com nome ou substitua com confirmação. Os dados opcionais permitem reabrir as anotações. |
| Cópia rica em Markdown | Copie seleção ou nota com imagens, dimensões e formatação. Há opções de cópia inteligente/automática e compatibilidade com editores de destino. Use o botão **Copy image** para uma imagem ou o comando **Copy** no editor de anotações para copiar o PNG anotado. |
| Notas HTML e modelos | Use a paleta, o botão no explorador ou o menu de uma pasta. As notas são arquivos `.html` com edição visual, código-fonte e prévia isolada. O editor aceita formatação, tabelas e imagens, salva mudanças e oferece modelos e cópia rica da seleção ou da nota toda. Marcação incompatível fica no modo Código para preservar o original. |

Downloads de imagens externas, abertura automática de `.html` e interceptação do comando de cópia ficam desligados por padrão. A cópia dedicada continua disponível. Se o Visual Kit original estiver ativo no Obsidian, desative-o e recarregue o Basic para evitar dois manipuladores de imagem. As preferências do plugin original não são copiadas para os dados do Basic.

No Android continua disponível a anotação rápida de imagens do Basic. O editor avançado e a cópia rica do Visual Kit usam recursos do computador. Se cobrir dados sensíveis, compartilhe o PNG exportado, não a imagem original nem o arquivo de anotações editáveis.
