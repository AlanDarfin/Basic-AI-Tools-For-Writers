# Basic AI 8.0.1 — Dicionário pessoal, indexação e limpeza do Longform

Atualização de manutenção baseada nos problemas encontrados no Android.

- **LanguageTool:** o menu de sugestões no PC e no Android remove a ação `Ir ao erro` e acrescenta `Adicionar ao dicionário` para palavras isoladas. O Basic AI mantém a lista localmente, sem exigir conta ou endpoint premium. Os avisos correspondentes desaparecem da revisão atual e de futuras revisões. A lista pode ser editada nas configurações de revisão. A alteração não modifica o texto de seus livros.
- **Longform:** a aba `Continuidade` e sua configuração foram retiradas da interface. Dados e arquivos existentes são preservados.
- **Autocomplete:** a indexação deixa de encerrar cedo quando encontra o limite global de termos. Todos os arquivos Markdown elegíveis são percorridos, recebendo um orçamento de vocabulário por arquivo. Notas extensas utilizam trechos do início e do fim, para limitar o consumo de memória; não significa que cada palavra de uma nota enorme será incluída.
- **Organização:** o controle de reindexação agora aparece somente nas configurações do autocomplete. Ali aparecem o número de arquivos elegíveis, indexados, falhas e amostras parciais. A barra lateral de ferramentas fica com menos botões.

A indexação considera arquivos Markdown: arquivos não-Markdown e pastas explicitamente excluídas não entram na contagem de arquivos elegíveis. A lista pessoal não altera o dicionário de terceiros nem o servidor do LanguageTool.

[English](V8_0_1_RELEASE.en.md). Instale `main.js`, `manifest.json` e `styles.css` juntos.
