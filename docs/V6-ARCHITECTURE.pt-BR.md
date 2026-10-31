# Basic AI v6 — Auditoria das referências e arquitetura de integração

> **Status: planejamento técnico (sem implementação da v6 nem release).** Base auditada: Basic AI Tool for Writers **5.2.0**, \`main\`, manifesto com Obsidian **1.11.4+**, desktop e Android/iOS. Esta branch mantém a versão estável intacta.

## 1. Materiais analisados

Foram examinados os **seis bundles JavaScript** enviados, os seis \`manifest.json\` e os cinco CSS de referência. Todos os seis bundles passam na verificação de *sintaxe* \`node --check\`; isso **não** demonstra compatibilidade com Obsidian real. Os arquivos são distribuições compiladas de terceiros, não seus fontes originais.

| Referência fornecida | Versão | minAppVersion na referência | JS aproximado | Funções observadas no código |
| --- | --- | --- | ---: | --- |
| Advanced Ruby | 3.0.1 | 1.14.4 | 14 kB | Ruby \`{base|anotação}\` com dois níveis, Reading/Live Preview, navegação pelas setas, conversão para HTML e Markdown, cópia/remoção, estilo por nível |
| Discord Timestamps | 1.0.20 | 1.7.7 | 807 kB | Renderização de \`<t:epoch:formato>\`, múltiplos formatos, fuso horário, seletor para inserção, histórico e opções de código |
| Interactive Ratings | 1.0.8 | 0.15.0 | 34 kB | Avaliações interativas no editor, múltiplos símbolos/emoji, meio ponto, fração, porcentagem e padrões personalizados |
| Discord Syntax | 1.0.28 | 0.15.0 | 77 kB | \`||spoiler||\` e \`-# subtexto\`, Reading e Live Preview, revelar/ocultar spoiler e estilos |
| Linter | 1.34.2 | 1.13.0 | 998 kB | Motor amplo de regras: YAML, títulos, listas, espaçamento, rodapés, Markdown, paste, exclusões, regex, prévia diff e execução seletiva |
| Reading Time | 1.1.2 | 0.12.17 | 16 kB | Tempo de leitura na barra de status, seleção atual, palavras/minuto, formatos, contagem ajustada para Unicode |

**Nota de leitura:** a variante Advanced Ruby usa \`RegExp.escape()\` no código compilado, API não universal em runtimes antigos. Discord Timestamps incorpora uma biblioteca grande de data/fuso; copiar diretamente o bundle duplicaria dependências. Linter é um conjunto de motores e regras, não apenas um formatador de parágrafos.

## 2. Revisão do Basic AI 5.2.0

- O núcleo atual possui fontes em \`src/v3/\`, \`src/v4/\` e \`src/v5/\`, mais \`projects.js\`, \`main.js\` e \`styles.css\`. \`main.js\` (~434 kB) é a distribuição montada pelos scripts \`scripts/sync-projects.js\` e \`scripts/build-v3.js\`. **Todo código novo deve entrar na fonte canônica**, e somente depois ser sincronizado com o bundle. Editar apenas \`main.js\` causa falha de CI.
- Já existem Markdown estendido, Pandoc, Easy Typing, Smart Typography, Keyshots, LanguageTool, revisão Diff, Longform, tradução, TTS, snapshots e perfis. A v6 deve ser uma **integração** desses subsistemas, não seis plugins completos executados em paralelo.
- **Colisão confirmada:** \`src/v5/extended-syntax.js\` já aceita \`||spoiler||\` e processa Reading e Live Preview. Discord Syntax precisa **substituir/aperfeiçoar o mesmo recurso**, não adicionar um segundo pós-processador independente para os mesmos intervalos.
- **Colisão provável:** o motor Linter escreverá em áreas tratadas por Easy Typing, Smart Typography, os comandos de edição e LanguageTool. Definir prioridades e excluir regiões protegidas (YAML fora das regras YAML, código, math, links/URLs, comentários, tabelas e blocos próprios) é pré-requisito.
- **Renderização:** \`src/v5/extended-syntax.js\` e \`src/v5/pandoc-syntax.js\` usam pós-processamento na leitura e decorações CodeMirror na edição; a v6 deve compartilhar uma camada de detecção de intervalos e evitar executar todos os parsers repetidamente por linha e por evento.
- **Performance:** Linter (quase 1 MB) e Discord Timestamps (~807 kB) não devem ser incorporados como bundles completos. Implementações próprias menores, avaliação sob demanda e debounce são necessários para escrita em projetos Longform grandes.
- **Configurações:** o 5.2.0 tem **seis grupos** de configuração. Novas ferramentas entram nesses grupos: Markdown → Ruby e Discord Syntax; Escrita → Ratings / Linter; Revisão e leitura → tempo de leitura e datas, com opções detalhadas nos subgrupos. Não ressuscitar dezenas de abas.
- **Compatibilidade:** Basic AI declara **Obsidian 1.11.4+**. Advanced Ruby de referência declara **1.14.4+**; Linter, **1.13.0+**. A v6 só deve manter o mínimo atual se **nossas implementações** forem testadas com essa API antiga. Caso contrário, atualizar \`minAppVersion\` e \`versions.json\` antes da release. Não elevar o mínimo automaticamente nesta fase.
- **Idiomas:** interface, avisos e documentação em **pt-BR e inglês**, incluindo nomes de comandos, acessibilidade e exemplos.

### Pontos encontrados para corrigir antes de v6 estável

1. O conjunto de extensões CM6 e pós-processadores está distribuído por diversos módulos; introduzir uma **camada coordenadora para sintaxe/renderização** ou pelo menos detecção compartilhada de áreas protegidas, com controle de precedência.
2. O CSS já é grande (~82 kB). Criar estilos de v6 com prefixo \`writer-v6-\`, variáveis do Obsidian, sem regras globais sobre \`ruby\`, \`span\`, \`code\` ou \`.setting-item\`.
3. Centralizar políticas de comandos de formatação e proteção de intervalos para evitar reescritas automáticas da prosa e conflitos com LanguageTool/Smart Typography.
4. Criar um harness de testes de integração editor/Reading/Live Preview, mais fixtures com Longform, links, callouts, blocos Pandoc, caracteres Unicode e IME; os testes Node atuais não substituem execução no Obsidian.
5. Focalizar acessibilidade em widgets interativos: foco e setas, Enter/Espaço, rótulos ARIA, toque, redução de movimento e modo de leitura sem JavaScript.
6. Manter regras Linter de **alteração em massa, ao salvar e ao trocar notas desligadas por padrão**, exigindo prévia Diff, exclusões por pasta e backup/undo antes de alterações irreversíveis.

## 3. Decisões de integração por referência

### A. Advanced Ruby

**Escopo:** sintaxe ruby em dois níveis, modo Leitura e Live Preview, conversões MD/HTML, comandos para incluir/remover/cópia sem anotação, teclado inteligente e estilos de ambas as camadas. O texto original fica em Markdown. **Cuidados:** anotações aninhadas, escapes, links, entidades, código e seleção; não manipular \`innerHTML\` do usuário nem transformar o documento inteiro com \`setValue\` desnecessariamente. Implementar DOM seguro e decorações CM6.

**Licença:** Advanced Ruby 3.x usa **PolyForm-Perimeter 1.0.1**, diferente da licença MIT do Basic AI. **Não copiar o código compilado, estilos ou algoritmo original para o projeto MIT sem avaliação de licença/autorização.** Usar a referência para especificar funcionalidades e construir implementação independente. Ver também \`THIRD_PARTY_NOTICES.md\` caso alguma dependência externa seja efetivamente incorporada.

### B. Discord Timestamps

**Escopo:** reconhecer e preservar os códigos de tempo de Discord, sete formatos \`t/T/d/D/f/F/R\`, exibição localizada em Reading, comando para inserir, seletor de data/hora/fuso, histórico curto e comportamento opt-in para trechos \`code\`. **Implementação:** \`Intl.DateTimeFormat\`, validação de epoch/faixa, timezone IANA com fallback, atualização dos formatos relativos sem temporizadores por fragmento. Manter texto fonte inalterado.

### C. Interactive Ratings

**Escopo:** estrelas, corações, fases da Lua, quadrados, barras e emoji personalizados; valor parcial quando suportado; número, fração e porcentagem opcionais; clique/toque para alterar no editor. **Implementação:** tratamento por *grapheme clusters* (\`Intl.Segmenter\` com fallback), edição de intervalo exato no CodeMirror, não interceptar listas Markdown ou símbolos soltos comuns. Editor interativo primeiro; Reading pode exibir versão não interativa sem alterar a nota. **Acessibilidade:** comando de teclado para ajuste do valor, rótulo de estado e foco.

### D. Discord Syntax

**Escopo:** aprimorar o spoiler \`||texto||\` existente (suporte a blocos, conteúdo com formatação interna, toque, teclado e alternância de visibilidade) e adicionar \`-# subtexto\`. Expor as opções em **Markdown → Sintaxe estendida** ou subseção equivalente. **Não registrar um segundo processador de spoiler** quando Extended Syntax já estiver ativo. Proteger blocos de código, Markdown escapado, listas e combinações com Ruby.

### E. Linter

**Escopo funcional por categorias:** YAML/propriedades, títulos, listas, espaços/linhas, notas de rodapé, conteúdo Markdown, normalização de colagem, substituições personalizadas, regras por pasta, processamento de nota/pasta/cofre, prévia Diff e execução manual, ao salvar ou trocar arquivo. **Prioridade de segurança:** motor **puro** \`input → diagnóstico + alterações propostas\`, com alteração real separada, preview de Diff, confirmação para lotes, exclusões, snapshots, modo simulação e prevenção de concorrência com editor/autocomplete.

**Não fazer:** copiar a aplicação de terceiros inteira nem executar todas as regras na digitação. Não reproduzir os ~1 MB do bundle ou presumir paridade total logo na primeira implementação. Registrar cobertura de cada regra e comportamento na matriz de aceitação; lacunas precisam ser documentadas. Opções de automação OFF por padrão.

### F. Reading Time

**Escopo:** minutos de leitura da nota/seleção, velocidade configurável, formatos curto/detalhado/digital, status bar desktop e indicador alternativo no mobile, integração opcional com informações do projeto Longform. Contagem Unicode, exclusão de YAML e código configurável, cálculo leve após debounce e ao mudar nota. Não duplicar contadores já disponíveis nem disparar leitura de cada arquivo a cada tecla.

## 4. Arquitetura proposta

\`\`\`
src/v6/
  shared/
    protected-ranges.js      # intervalos protegidos de Markdown, links, YAML e código
    render-coordinator.js    # pós-processamento e decorações sem dupla execução
    rules-runner.js          # funções puras e escopo de aplicação
  markdown/
    ruby.js
    discord-syntax.js       # extensão do spoiler já presente
    discord-timestamps.js
  editor/
    interactive-ratings.js
  linter/
    rule-registry.js
    engine.js
    preview.js
  reading/
    reading-time.js
  settings/
    v6-settings.js          # opções de v6 com defaults desligados onde pertinente
tests/v6/
  fixtures/
  ruby.test.js
  discord-syntax.test.js
  timestamps.test.js
  ratings.test.js
  linter.test.js
  reading-time.test.js
  compatibility.test.js
\`\`\`

O registro de módulos deve reutilizar \`writerModuleOn()\`, persistir separadamente por recurso e oferecer migração sem apagar \`data.json\`. \`scripts/build-v3.js\` continua compondo a saída até a troca deliberada por um build moderno, com testes de sincronização obrigatórios.

## 5. Etapas de entrega

- **Fase 0 — concluída:** identificar os seis plugins fornecidos; revisar estrutura, conflitos, dependências, compatibilidade e licenças; criar branch/documentação v6, sem release.
- **Fase 1 — motor compartilhado e funções menores:** intervalos protegidos; Reading Time; Discord Timestamps; testes de leitura/edição e internacionalização.
- **Fase 2 — sintaxe:** unir Discord Syntax ao spoiler existente, subtexto \`-#\` e Ruby de dois níveis, com testes de Markdown e Live Preview.
- **Fase 3 — widgets:** Interactive Ratings, formatos configuráveis, toque/teclado e edição por intervalo.
- **Fase 4 — Linter:** engine por regras com preview, exclusões e execução individual; depois regras YAML/rodapés/Markdown, aplicação por pasta/cofre e gatilhos opcionais; auditoria de concorrência e reversibilidade.
- **Fase 5 — release candidate:** teste manual no Obsidian desktop/Android, compatibilidade minAppVersion, perfis, CSS/community lint, regressão v3–v5, README bilíngue, changelog, assets ZIP/checksum e **tag \`6.0.0\` sem prefixo v**.

## 6. Critérios para chamar a v6 de estável

1. Nenhuma funcionalidade existente, inclusive Longform, LanguageTool, TTS, Easy Typing e Smart Typography, deve regredir.
2. Ruby, spoiler, subtexto, timestamps e avaliações funcionam em Reading/Live Preview/editor conforme os casos definidos, sem modificar texto quando se trata de renderização.
3. Linter apresenta **diff antes de alterações em massa**, permite ignorar arquivos e pastas e respeita áreas protegidas; há reversão/backup verificável.
4. Todos os módulos têm toggles independentes e configurações pt-BR/en, com UI compacta em 720p e Android.
5. Sem inserção de código licenciado de forma incompatível; avisos de terceiros quando necessários.
6. CI verde para sintaxe, CSS, bundles, migração, segurança e fixtures; smoke test manual em aplicativos reais antes de publicar.

**Situação após esta auditoria:** não foi feita a integração dos seis plugins, nenhum bundle terceiro foi copiado e nenhum lançamento v6 foi publicado. A versão estável continua 5.2.0.
