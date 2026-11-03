# Basic AI Tool for Writers 9.0.5

**Homepage, novos widgets e blocos Markdown · Obsidian 1.11.4+**

## Listas de notas mais legíveis

Os widgets **Notas recentes**, **Favoritos** e **Editadas hoje** exibem cada arquivo como uma linha compacta com ícone Lucide, título, caminho do cofre e indicador da nota selecionada. O campo de filtro do próprio widget aparece quando há cinco ou mais resultados. Use **↑ / ↓** para navegar, **Enter** para abrir e **Esc** para limpar o filtro. A lista tem rolagem própria, evitando cartões gigantes no celular.

## Novos widgets opcionais

- **Galeria do cofre:** uma imagem aleatória do próprio cofre (PNG, JPG, WEBP, GIF ou AVIF), com caminho, botão de abrir e botão para sortear outra. Usa a URL local do Obsidian, sem serviços de imagem externos.
- **Citação aleatória:** uma frase original do Basic sorteada sempre que a homepage é aberta. Em Configurações → Homepage, você pode cadastrar uma frase por linha no formato `Texto da citação | Autor`. O widget oferece botão para sortear outra. Não usa serviços externos.
- **Editadas hoje:** notas Markdown cuja última modificação foi no dia atual, em lista compacta.

Os três widgets novos começam **ocultos**, inclusive em instalações com organização personalizada. Habilite-os pelo botão **Adicionar widgets**. A ordem e a visibilidade existentes são preservadas.

## Título e ícone

O título ganha tipografia maior e mais destacada no computador e no celular; o ícone também cresce e mantém sua cor configurável (accent color do tema por padrão).

## Blocos com nomes curtos

Os nomes principais dos blocos renderizáveis deixam de exigir o prefixo `writer-`:

| Novo bloco | Nome antigo (continua funcionando) |
| --- | --- |
| `tabs` | `writer-tabs` |
| `avatar` | `writer-avatar` |
| `wiki` | `writer-wiki` |
| `post` | `writer-post` |
| `chat` | `writer-chat` |
| `media-gallery` | `writer-media-gallery` |
| `folder-overview` | `writer-folder-overview` |

Blocos `longform-nav` e `insta-toc` já usavam nomes curtos, portanto continuam iguais. Os comandos que inserem gallery/overview agora geram os nomes novos. A edição inline preserva o identificador realmente usado no arquivo: **nenhuma nota antiga precisa ser convertida**.

Exemplo:

````markdown
```wiki
title: Bonfire
type: Livro
---
Uma história.
```
````

## Instalação

Faça backup do `data.json` do plugin e substitua os arquivos `main.js`, `styles.css` e `manifest.json` pela versão **9.0.5**. Recarregue o plugin. A validação automatizada cobre nomes novos e antigos, migração de widgets e sincronização dos bundles.
