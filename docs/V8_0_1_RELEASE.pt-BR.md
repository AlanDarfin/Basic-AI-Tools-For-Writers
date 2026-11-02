# Basic AI Tool for Writers 8.0.1 — Dicionário do revisor e cobertura do cofre

Esta correção complementa a v8.0.0, com foco na revisão no Android, navegação Longform e redução dos botões da barra lateral.

- **Pop-up do LanguageTool (PC e Android):** remove a ação **Ir ao erro**, desnecessária ao tocar ou clicar diretamente no destaque. Para uma palavra individual, adiciona **Adicionar ao dicionário**. A palavra normalizada fica numa **lista pessoal local do corretor**, desaparece das sugestões atuais e é ignorada nas análises posteriores. Não modifica o arquivo Markdown, o dicionário de definições `Dicionario.md` ou o dicionário do servidor LanguageTool.
- **Gerenciamento de palavras:** lista editável em **Configurações → Revisão → Dicionário pessoal do corretor** (uma palavra por linha), permitindo remover exceções.
- **Longform:** remove a aba **Continuidade**, que não estava funcionando como esperado, e seu interruptor. Preserva estruturas narrativas, ferramentas de capítulos e verificações de dependência independentes.
- **Indexação:** corrigida a interrupção antecipada causada pelo limite global de 12 mil termos e a exclusão de notas grandes. Todas as notas Markdown não excluídas passam a receber uma parte limitada dos termos; notas grandes contribuem com um trecho inicial. O antigo limite padrão é migrado para um orçamento de 120 mil termos.
- **Menos botões:** reindexação, orçamento de termos, limite por nota e estatísticas de cobertura ficam em **Configurações → Escrita → Complementos**. O comando de reindexar continua na paleta.
- **Desempenho:** os termos mantidos em cache têm limites de memória.

Limitações: pastas excluídas continuam fora do índice, e a leitura parcial não garante que todas as palavras de um manuscrito longo sejam encontradas. Confira os controles visuais em um Android real.

Atualize juntos os três arquivos da release: `main.js`, `manifest.json` e `styles.css`.

[English](V8_0_1_RELEASE.en.md).
