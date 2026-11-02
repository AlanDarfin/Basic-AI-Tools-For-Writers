# Basic AI Tool for Writers 9.0.1

**Atualização estável · Obsidian 1.11.4+ · Computador e Android**

Esta versão aprimora a experiência de escrita e organização sem substituir suas notas Markdown nem alterar o identificador do plugin.

## Melhorias de interface

- **Pesquisa da homepage:** campo de largura total no início da página, acima do título, dos atalhos e do calendário. Resultados com nome e caminho completo da nota para diferenciar nomes repetidos, ícone Lucide, favorito e indicador visual da nota selecionada. Use **↑/↓** para navegar, **Enter** para abrir e **Esc** para limpar a busca. Os resultados possuem rolagem própria.
- **Chat fictício:** mensagens consecutivas do mesmo personagem dispensam nome/avatar repetidos. Nome e horário só são exibidos quando explicitados no bloco; sintaxes antigas permanecem compatíveis.
- **Homepage:** título e ícone respeitam a accent color do tema por padrão, com opções HEX independentes; atalhos e abas de rascunho aproveitam a largura disponível.
- **Configurações:** pesquisa compacta, categorias Escrita e Markdown reunidas; ícones Lucide nas configurações, ferramentas e navegação do Longform.
- **Explorador:** pesquisa visual de ícones Lucide e seletor de cores HEX personalizado; as escolhas ficam nas configurações, não no Markdown.

## Organização e Spaces

- Coleções dinâmicas por pasta, tags e propriedades, coleções manuais e pastas fixadas.
- Painel lateral opcional, sem substituir o explorador padrão.
- Visualizações simples em lista, cartões, tabela e quadro. Não inclui fórmulas, rollups, bases relacionais nem Flow Editor do Make.md.

## Bloqueio visual opcional

Uma senha pode limitar a visualização de determinadas notas/pastas na interface do Basic. **Isso não criptografa os arquivos e não impede que outros plugins, o sistema operacional ou backups leiam o conteúdo.** Não utilize como substituto de criptografia do dispositivo.

## Instalação

Baixe **`main.js`**, **`manifest.json`** e **`styles.css`** do release 9.0.1 e copie-os para `.obsidian/plugins/basic-ai-tool-for-writers/`. Faça backup do cofre e do `data.json` antes de atualizar.

Os testes de sintaxe, regressão, sincronização dos bundles, CSS lint e empacotamento são executados no CI. A experiência visual em temas de terceiros e no Android pode variar.
