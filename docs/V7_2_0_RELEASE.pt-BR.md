# 7.2.0 — Estabilidade antes da v8

Esta versão prepara o Basic para a futura refatoração de desempenho sem alterar projetos ou documentos.

## Máquina de escrever no Android

O modo de realce de linha agora reconhece `touchstart`, `beforeinput` e `compositionstart`, além de mouse e teclado físico. Um gesto de rolagem por toque suspende o destaque até a próxima interação. O Remember Cursor Position permanece independente e uma restauração automática não aciona o realce. **A função depende do cursor do editor (Live Preview/edição); não aparece na visualização de leitura.**

## Navegação das ferramentas

As abas Sugestões, Variantes, Diff e perfis, Versões e Extras permanecem montadas durante a troca. Só o painel de conteúdo é reconstruído, sem devolver o scroll horizontal ao início. Atualizações por mudança de arquivo preservam a posição depois de construir a nova barra.

## LanguageTool interno

Após a primeira análise, digitar ou modificar um trecho provoca a revisão automática somente do parágrafo afetado quando as sugestões existentes ainda correspondem ao texto revisado. Os resultados dos outros parágrafos são preservados e os deslocamentos atualizados. Se houver edições concorrentes, contextos muito grandes ou dados antigos, é usada a revisão segura já existente. Aceitar sugestões continua fazendo a revisão prioritariamente por sentença. Essa otimização é inspirada na ideia de revisão por parágrafo do [Language Tool Advanced](https://github.com/DuckTapeKiller/language-tool-advanced), sem reutilizar o código-fonte.

## LanguageTool externo opcional

Um novo seletor na aba Revisão permite escolher o plugin [LanguageTool de wrenger](https://github.com/wrenger/obsidian-languagetool) caso esteja instalado e ativado. No modo externo o Basic não envia chamadas próprias para revisar gramática. A lateral apresenta ações de verificar, limpar sugestões, ir para o próximo erro, alternar auto-check e acessar configurações. Os sublinhados, menus e sugestões continuam sendo renderizados pelo próprio plugin externo no editor; não há tentativa de copiá-los para uma lista própria por não existir API pública para isso.

O plugin externo pode exigir versão mais recente do Obsidian e sua integração usa o registro de plugins da aplicação, que não é uma API pública estável. Nenhum código ou credencial do plugin externo é incorporado ao Basic.

## Compatibilidade

Nenhuma migração de arquivos, novos serviços obrigatórios ou mudança no Pandoc. Verifique visualmente no seu Android e desktop além dos testes automáticos.

[English](V7_2_0_RELEASE.en.md).
