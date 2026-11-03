# Basic AI Tool for Writers — 9.1.2

## Conteúdo virtual

- Integração independente baseada no conceito do Virtual Content: regras de Markdown exibidas sem modificar as notas.
- Regras por pasta, tag e propriedade do frontmatter, com condições E/OU, inclusão de subpastas/subtags e exclusões por condição.
- Fonte em texto Markdown, nota-modelo do cofre ou BookNav do Longform.
- Posições: cabeçalho, rodapé, painel lateral e início/fim de seção (somente Leitura). Cabeçalho/rodapé gerais funcionam também no Live Preview.
- Painel lateral com opção de abas independentes por regra e comando na paleta.
- Variáveis simples: `{{file.name}}`, `{{file.path}}`, `{{file.folder}}`.
- Regras reordenáveis, ativáveis, editáveis e removíveis; limite de 40 regras e conteúdo Markdown limitado.

## BookNav automático

- Pode aparecer no fim dos capítulos e subcapítulos Longform automaticamente, sem inserir `longform-nav` no Markdown.
- Reutiliza o mecanismo existente de ordem real de cenas, subcapítulos e índices YAML.
- Preserva os blocos manuais, as configurações por projeto e as opções de exibir capítulos principais/subcapítulos.
- Uma regra de fonte BookNav pode escolher outra posição e substitui o BookNav global naquela nota, evitando duplicação.
- Reavalia navegação após mudanças na ordem do índice e nos parâmetros.

## Compatibilidade e limites

Mantém o aplicativo mobile habilitado. Templates podem conter Markdown usado por Dataview/Bases, mas seu funcionamento depende dos plugins externos e do modo de visualização; o Basic não executa queries ou JavaScript de terceiros como parte das regras. Conteúdo de seção apenas no modo Leitura. A renderização não altera, substitui ou salva o arquivo fonte.

Manifest, package, lockfile, versão e documentação PT/EN sincronizados; testes dedicados disponíveis no projeto.
