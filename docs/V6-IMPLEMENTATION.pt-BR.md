# Basic AI v6 — Implementação em andamento (pt-BR)

**Branch:** \`feature/v6-full-integration\` · **PR:** #25 · **Versão estável permanece 5.2.0.**

A v6 integra **seis famílias de recursos** ao código próprio do Basic AI; não inclui os bundles compilados de terceiros. As opções de cada família começam **desativadas** para preservar a experiência de quem atualiza. Os seis módulos podem ainda ser ocultados em **Configurações → Geral → Módulos**.

## Como usar os recursos

### 1. Tempo de leitura
**Revisão e leitura → Datas e tempo de leitura.** Habilite a estimativa de leitura, configure 60–900 palavras por minuto e se deseja ignorar código/frontmatter. No desktop, o tempo estimado da nota ativa é mostrado na barra de status. No desktop ou celular, execute o comando **Tempo de leitura: seleção ou nota** para consultar um trecho selecionado ou a nota inteira.

### 2. Discord Timestamps
**Revisão e leitura → Datas e tempo de leitura.** Habilite os marcadores \`<t:1710000000:f>\` e use o comando **Data Discord: inserir marcador** para escolher data e hora locais, formato e inserir a sintaxe. A interface oferece histórico recente, idioma e fuso horário. Os códigos \`t\`, \`T\`, \`d\`, \`D\`, \`f\`, \`F\`, \`R\` são suportados. O Markdown original continua intacto; a leitura apresenta a data formatada e o Live Preview destaca a sintaxe com dica de contexto.

### 3. Ruby (anotações sobre texto)
**Markdown → Ruby, Discord e avaliações.** Use \`{漢字|かんじ}\` para anotar pronúncia. O modo Leitura renderiza \`<ruby>\` e \`<rt>\` como DOM seguro; a origem é apenas destacada no Live Preview para preservar a edição. A forma aninhada \`{one {漢字|かんじ}|annotation}\` permite dois níveis. Os comandos permitem envolver texto selecionado, remover marcações e converter a seleção para HTML escapado. Configurações de tamanho de anotação são independentes por nível. Este é um subconjunto intencional da referência Advanced Ruby, sem copiar sua implementação.

### 4. Discord Syntax
**Markdown → Ruby, Discord e avaliações.** A sintaxe \`||spoiler||\` já pertence à **Sintaxe Estendida** do Basic AI e continua sendo renderizada por ela, sem motor concorrente. A v6 acrescenta \`-# subtexto\` e spoilers em bloco entre linhas \`||\` separadas, estes últimos opt-in e exibidos em blocos expansíveis no modo Leitura. Delimitadores continuam visíveis e editáveis no editor. Não prometer equivalência a todos os detalhes de inline/spoiler de terceiros.

### 5. Avaliações interativas
**Markdown → Ruby, Discord e avaliações.** Insira \`[rating:3.5/5:star]\`. Outros tipos: \`heart\`, \`moon\`, \`circle\`, \`bar\` e \`custom\`. O modo Leitura mostra símbolos; o editor permite clicar/toque nos símbolos para editar o valor original. **Shift + clique** seleciona meio ponto. Configurações incluem símbolos próprios para cheio, vazio e meio, porcentagem/fração e opção de exibir somente símbolos. O marcador explícito evita transformar acidentalmente estrelas e emojis comuns do manuscrito.

### 6. Linter
**Escrita → Linter de escrita.** Regras opcionais: espaços no fim da linha, espaçamento de títulos, listas, notas de rodapé, blockquotes, YAML, linhas em branco consecutivas e linha final. O comando **Linter: revisar formatação da nota** mostra uma prévia das mudanças antes de aplicar. **Linter: revisar pasta da nota** apresenta um lote limitado a **50 arquivos**, excluindo a nota ativa, com confirmação explícita. Há exclusões por arquivo/pasta, detecção de mudanças concorrentes e **backup antes de cada gravação** (Snapshots, se habilitado; caso contrário, pasta local do próprio plugin).

**Importante:** as funções automáticas de alteração ao salvar/trocar nota, o extenso catálogo de regras e algumas opções avançadas da referência Linter **ainda não foram reproduzidos**. A v6 atual prioriza alterações seguras e revisáveis. Não descreva esta versão como um clone completo do plugin Linter.

## Integração, segurança e compatibilidade

- Código novo: \`src/v6/foundation.js\`, \`reading.js\`, \`markup.js\`, \`linter.js\` e testes \`tests/v6-integrations.test.js\`.
- O arquivo \`main.js\` é **gerado**; atualizações devem ocorrer nos fontes antes da sincronização.
- Não usar \`innerHTML\` arbitrário, eval, execução de scripts de terceiros nem copiar os bundles recebidos.
- Os filtros de Markdown preservam trechos protegidos de frontmatter, código, links e cercas; **não** equivalem ainda a uma árvore completa de sintaxe Markdown para qualquer combinação.
- O Basic AI mantém o manifesto **5.2.0** enquanto a v6 está em PR. Somente publicar \`6.0.0\` após revisão de compatibilidade com Obsidian, CSS, testes de integração e testes manuais no desktop e Android.
- Todos os novos títulos, opções, avisos e comandos são apresentados em português brasileiro e inglês.
- A referência Advanced Ruby 3.x usa licença PolyForm-Perimeter. **A integração foi escrita separadamente**, sem incorporar código compilado do plugin terceiro.

### Verificações ainda necessárias

- Renderização real de Ruby aninhado em texto com links, caracteres escapados e formatação mista.
- Spoilers em bloco/inline no Live Preview, com seleção, foco e leitor de tela.
- Avaliações com teclado, toque e teclado virtual; testes com outros plugins CodeMirror.
- Fusos horários diferentes, horário de verão e formatos relativos do Discord.
- Linter com arquivos grandes, CRLF, frontmatter complexo, links e notas abertas simultaneamente.
- Desempenho em projetos Longform e configurações compactas (720p), tanto em português quanto inglês.

Consulte a [arquitetura v6](V6-ARCHITECTURE.pt-BR.md) para o escopo de referência, decisões de segurança e critérios de lançamento.
