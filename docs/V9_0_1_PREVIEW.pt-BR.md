# Prévia da 9.0.1 · ajustes de interface, Spaces e personalização

> **Em desenvolvimento na branch `fix/v9-0-1-ui-spaces-iconic`**. Não é uma release 9.0.1. O `manifest.json` permanece 9.0.0 até a aprovação dos testes e da atualização final de versão.

## Ajustes

- **Chat fictício `writer-chat`:** mensagens consecutivas do mesmo personagem, do mesmo lado, não repetem o avatar e o nome; nomes só aparecem quando escritos explicitamente e o horário só aparece quando fornecido em cada mensagem. Sintaxe anterior preservada.
- **Homepage:** título e ícone usam `--interactive-accent` inicialmente; podem receber cores HEX distintas, com campo visual de cor, HEX e opção para restaurar o padrão. Barra de ações e abas dos rascunhos usam a largura disponível.
- **Configurações:** pesquisa compacta com ícone Lucide e sugestões somente durante a digitação; abas **Escrita** e **Markdown** reunidas sob **Escrita e Markdown**. Abas principais e subtópicos receberam ícones Lucide; as ferramentas e a navegação do Longform também.
- **Explorador:** seletor de ícones com pesquisa visual (até 160 ícones visíveis por consulta, sem perder a seleção), catálogo Lucide do Obsidian quando disponibilizado e cores HEX arbitrárias. As personalizações continuam no `data.json` do Basic e não alteram o Markdown.
- **Spaces:** três tipos de coleções (filtros, seleção manual de caminhos e pasta fixada); painel lateral opcional com busca e adição da nota atual a coleções manuais. Modal com visões cartões/lista/tabela/quadro permanece.
- **Proteção por senha:** bloqueio **visual opcional** de notas ou pastas com verificador derivado por PBKDF2-SHA256. Não há criptografia do conteúdo. Outro plugin, um backup ou o gerenciador de arquivos ainda pode acessar o Markdown. Isso não substitui proteção ou criptografia de dispositivo.

## Comparação com Make.md

| Recurso | Estado no Basic 9.0.1 (prévia) |
| --- | --- |
| Ícones e cores de notas e pastas | **Implementado**, com Lucide + HEX; não inclui todas as regras automáticas do Iconic |
| Visões de pasta e arquivos | **Implementado parcialmente**: cartões, lista, busca, criação de índices Markdown |
| Espaços por pasta, tag e propriedades | **Implementado**, via filtros virtuais de notas Markdown |
| Spaces manuais e pastas fixadas | **Implementado nesta prévia**, mediante seleção de caminhos |
| Spaces no painel lateral | **Implementado nesta prévia**, separado do explorador nativo |
| Visões de Spaces | **Parcial**: cartões, lista, tabela e quadro agrupado simples; não existe banco de dados relacional |
| Navegação hierárquica e coleções aninhadas | **Não implementado** no mesmo nível do Make.md |
| Campos relacionais, rollups, fórmulas | **Não implementado** |
| Flow Editor / edição visual em blocos | **Não implementado** |
| Recursos avançados de Contexts e bases | **Não implementado** |
| Regras dinâmicas e personalização global dos ícones do Iconic | **Não implementado** |
| Criptografia das notas ou proteção contra leitura externa | **Não implementado** |

A adaptação é independente e mantém os arquivos como notas Obsidian comuns. Não há importação do banco de dados interno do Make.md nem cópia de código de outros plugins.

## Verificação

A CI testa sincronização `projects.js` → `main.js`, módulos → `main.js`, CSS modular → `styles.css`, sintaxe, regressões e lint. Os testes automatizados não simulam integralmente a renderização real no Android ou todos os temas do Obsidian. Verifique manualmente o explorador, os painéis, o seletor Lucide, o bloqueio visual e o comportamento da homepage antes de mesclar ou publicar.
