# 7.1.0 — LanguageTool com reverificação localizada

A primeira análise da nota permanece igual. Depois de aceitar uma sugestão de correção, o Basic faz apenas **uma nova chamada** ao LanguageTool para a sentença modificada, ou para o parágrafo quando o limite da sentença é ambíguo.

- Preserva as outras sugestões e marcações do documento sem solicitar novamente seu texto à API.
- Recalcula os deslocamentos dos erros seguintes quando a substituição aumenta ou reduz o número de caracteres.
- Remove as sugestões antigas do trecho corrigido e inclui somente os resultados devolvidos para o novo trecho.
- Bloqueia a chamada automática duplicada provocada pelo próprio comando de substituição.
- Mantém a revisão manual completa, os filtros de regras/whitespace e as proteções de Markdown.
- Se a nota for editada novamente durante a requisição localizada, descarta a resposta desatualizada e agenda revisão segura.
- Não altera o comportamento de Remember Cursor Position, Pandoc ou das ferramentas do Longform.

Isso reduz o volume transmitido e o tempo de resposta após aceitar uma correção simples. Os limites e as políticas do servidor LanguageTool continuam se aplicando.

[English](V7_1_0_RELEASE.en.md).
