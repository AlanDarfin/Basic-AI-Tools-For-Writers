# 7.0.1 — Revisão da comunidade, segurança e publicação

Atualização de manutenção do Basic AI Tool for Writers 7.0.0. Nenhuma ferramenta, dado de projeto ou integração Pandoc foi removida.

- Manter o Pandoc **integrado**, opcional no desktop, com validação do executável, bloqueio no Android e explicação das permissões.
- Adicionar `package-lock.json` e instalação reproduzível com `npm ci` nos workflows.
- Publicar somente os três arquivos oficiais do plugin na release. ZIP e checksums passam a ser artefatos da Action.
- Criar atestações de procedência para os arquivos da release, quando houver suporte do GitHub.
- Adicionar documentação de segurança/privacidade, guia de contribuição e testes de regressão de Pandoc/Android.
- Preservar Longform, séries, compêndio, ferramentas de escrita, IA opcional, tradução, dicionários e configurações.

**Observação:** avisos de acesso a arquivos e execução de processos podem continuar por causa da integração Pandoc. A disponibilidade das análises de malware/rede depende do serviço externo.

Para instalar, use `main.js`, `manifest.json` e `styles.css` da [release 7.0.1](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/7.0.1). Faça backup do cofre e das configurações antes de atualizar.
