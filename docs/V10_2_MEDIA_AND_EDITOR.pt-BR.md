# Recursos da versão 10.2.0

## 1. Gerenciador de Spaces

No Android, a janela agora usa cartões com ícone, nome e caminho de pasta separados, sem cortar nomes longos. Há pesquisa, seletor de Space, botões para Cartões, Lista, Tabela e Quadro, e páginas de 24 notas. Novo, Editar e ⋯ permanecem no cabeçalho; o menu permite ativar, trocar ícone/cor e excluir a Space sem apagar as notas.

## 2. Ocultar propriedades e escolher ícones

Ao lado de cada chave de propriedade no editor nativo, toque em ⋯ para escolher Ocultar nesta nota, Ocultar em todas as notas, Escolher ícone da propriedade ou Revelar campos ocultos. O botão com olho revela/esconde todos os campos ocultos. A operação altera apenas a aparência, nunca exclui o campo YAML do documento.

## 3. Cores e transcrição dos chats

~~~~markdown
~~~chat
title: Teste de conversa
background: transparent
bubble-color: blue
density: compact
[Eu=green, Eu=bubble:cyan]
[Maria=purple, Maria=bubble:orange]

> | Eu | Oi! | 14:30
< | Maria | Olá! | 14:31
> | Eu | [áudio:0:02:teste teste teste] | 14:34
~~~
~~~~

- background: transparent oculta o painel de fundo; somente as mensagens continuam.
- bubble-color: blue define a cor padrão do balão.
- [Eu=green] define a cor do nome e [Eu=bubble:cyan] define a cor dos balões da pessoa.
- Os balões continuam aceitando a configuração bubbles: soft, round ou square.
- A transcrição é texto fornecido pelo autor e aparece abaixo da onda, compacta e sem barra colorida lateral. Não existe captura ou reconhecimento automático de áudio.

## 4. File Preview e imagem do banner

A primeira imagem da prévia é procurada em: banner, cover, image, thumbnail, embeds e links de imagem na nota. Links HTTPS com extensões PNG, JPG, JPEG, WebP e outras extensões conhecidas são aceitos; endereços começando com www. são normalizados para HTTPS. URLs remotas podem enviar seu IP ao servidor quando carregadas; desative Miniaturas HTTPS externas em Explorer para usar somente imagens locais.

## 5. Buscar e inserir imagens sem sair do Obsidian

Na paleta de comandos, use Imagens: pesquisar e inserir no editor ou Imagens: pesquisar e definir banner/propriedade. Busque na Wikimedia Commons sem chave; Pexels, Pixabay e Unsplash requerem chaves API pessoais. O Basic consulta cada serviço diretamente, sem o proxy do Image Inserter original. Escolha orientação, baixar para o cofre ou inserir URL. Imagens baixadas são limitadas a arquivos JPEG/PNG/GIF/WebP e 8 MiB. Ao inserir no YAML, a propriedade padrão é banner, alterável nas configurações.

Respeite a licença e atribuição de cada foto. Consultas e miniaturas usam a rede, e as chaves API são armazenadas localmente nos dados do plugin, sem criptografia. O recurso não é gerador de imagens por IA.

## 6. Alinhamento sem codeblock

Cada marcador precisa ocupar uma linha própria. Você pode usar os nomes completos left/center/right ou as letras l/c/r:

~~~~markdown
::l[Texto à esquerda]
::c[Texto **no centro**]
::r[Texto *à direita*]
~~~~

O Live Preview alinha e oculta marcadores fora da linha em edição; a leitura mostra somente o texto alinhado. Esta sintaxe evita conflitos com tabelas (|), caminhos (/), e o escape Markdown (\).

## Compatibilidade

Notas e propriedades não são apagadas pela personalização. Nenhuma dessas mudanças depende da instalação do plugin Image Inserter original. É necessário testar os resultados com temas personalizados, painéis antigos e WebViews Android.
