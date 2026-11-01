# Basic AI Tool for Writers — 7.0.0-beta.1

**Beta experimental. A versão estável continua sendo a 6.0.1.** Esta versão não modifica a ordem das cenas nem migra automaticamente os seus arquivos. A integração foi implementada com código próprio, usando os plugins Timeline e Folder Notes enviados apenas como referências.

## Novidades da beta.1

### Compêndio do universo (antiga aba Notas)
- Pesquise por **nome, pasta ou qualquer tag do Obsidian**. Use `#personagem`, `#item`, `#local`, `#facção`, `#história/era` ou qualquer categoria criada pelo escritor.
- Funciona com tags do YAML e do corpo das notas. O filtro de tags é dinâmico e você pode adicionar tags pelo Compêndio sem reescrever a nota inteira.
- A organização por pastas continua disponível em **Gerenciar estrutura de pastas**, com criação, renomeação, movimentação e envio à lixeira já existentes.
- Criação rápida de personagens, locais e itens em notas Markdown etiquetadas. Mostra conexões entre notas encontradas nos links do Obsidian.
- **Tags de pasta:** quando uma pasta possui uma Folder Note com tags, as notas internas herdam essas tags **apenas na indexação e filtragem**. O conteúdo dos arquivos filhos não é alterado.
- **Folder Notes** em duas convenções: `Pasta/Pasta.md` e `Pasta.md`. Há um comando no menu de contexto das pastas para criar/abrir a nota; no explorador normal aparece um botão discreto de abertura. O botão extra não é usado caso o plugin Folder Notes original esteja habilitado.
- A funcionalidade não renomeia nem cria arquivos automaticamente quando pastas são alteradas. A navegação normal do explorador continua intacta.

### Timeline visual
- Nova aba com eventos em ordem cronológica, datas ou eras, categorias, descrições e vínculos para notas.
- Aceita anos fictícios positivos e negativos, datas ISO e eras escritas livremente. Eras textuais aparecem na ordem em que foram cadastradas, depois das datas ordenáveis.
- Notas existentes entram automaticamente se possuírem as propriedades:

```yaml
---
tags:
  - local
timeline:
  date: 2042-03-15
  title: Fundação da cidade
  category: História do mundo
  description: Primeiro povoamento
---
```

- Os eventos criados pela interface ficam salvos nas preferências do projeto, sem alterar os capítulos.

### Outras bases da futura v7
- **Continuidade:** nova aba que avisa sobre links não resolvidos e eventos de mesmo nome com datas diferentes. Não é um detector completo de contradições narrativas.
- **Modo foco:** comando nativo para reduzir distrações durante a escrita.
- **Memória narrativa da IA:** opcional, **desligada por padrão**. Na revisão por IA, envia ao provedor configurado apenas pequenos trechos de capítulos anteriores do Longform. Não envia capítulos posteriores.
- **Exportação:** o recurso já existente de Pandoc no desktop continua permitindo EPUB, PDF, DOCX e HTML. A exportação editorial do livro inteiro ainda será ampliada.
- Visual compacto da v6, textos de interface bilíngues e integração com os comandos nativos.

## Instalação e testes

Baixe `main.js`, `styles.css` e `manifest.json` da beta ou extraia o ZIP em `.obsidian/plugins/basic-ai-tool-for-writers/`. Recarregue o Obsidian. Faça backup dos seus arquivos e configurações antes de instalar. Obsidian 1.11.4+, no PC e Android.

Teste tags personalizadas, herança de Folder Notes, convivência com outros plugins, atualização de filtros após editar notas e cronologias fictícias.

## Próximas betas da v7

Árvore Longform recolhível e reordenação aprofundada, relações entre personagens mais completas, comparação semântica de continuidade, memória narrativa mais rica com controles de privacidade, exportação editorial por livro e layouts de escrita persistentes. **Esses itens ainda não estão completos na beta.1.**
