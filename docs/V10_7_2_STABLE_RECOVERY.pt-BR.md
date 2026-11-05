# Basic 10.7.2 — recuperação estável do plugin

**Motivo:** foi reportado que a versão 10.7.0 e, depois, a tentativa de reparo 10.7.1 não podiam ser ativadas no Obsidian. Não há um stack trace do aparelho disponível, então a causa exata da exceção ainda não foi comprovada.

## Estratégia deste reparo

A 10.7.1 adiou o registro de algumas integrações, mas isso não ajudou. A 10.7.2 reduz o bundle **antes da execução**, voltando ao conjunto de módulos distribuído antes da 10.7, porque um erro de carregamento/avaliação do `main.js` não pode ser solucionado apenas com `try/catch` durante o registro.

- **Mantidos na release:** núcleo AI, sinônimos/dicionário, tradutores, LanguageTool, popover, cursor, máquina de escrever, Longform/StoryLine anteriores, blocos Markdown, homepage, calendário anterior, widgets, Zotero com notas importadas, related notes, lixeira interna, progresso de leitura, Dragger anterior, ícones personalizados e toolbar corrigida na 10.6.1.
- **Preservados apenas no código-fonte por enquanto:** `src/v10/data-tables.js`, `zotero-web.js`, `study-fsrs.js`, `calendar-feeds.js`, `story-graph.js`, `editor-pro.js`, `speech-accessibility.js`, `media-drag-extension.js` e `integrations-107.js`. Eles não são apagados do repositório nem incluídos no `main.js` de produção desta versão.
- **Sem exclusões de dados:** o `data.json` e as notas do usuário permanecem intactos. O ID do plugin é o mesmo. O código antigo, inclusive v1–v10.6.1, não foi revertido ou apagado.
- **Privacidade:** nenhuma solicitação da API nova do Zotero ou das assinaturas ICS experimentais é feita por esta release, pois os módulos correspondentes não entram no runtime.

## Instalação segura no Android e no PC

1. Faça cópia de `.obsidian/plugins/basic-ai-tool-for-writers/data.json` e, se possível, de toda a pasta do plugin.
2. Substitua **juntos** os três arquivos de instalação da release `10.7.2`: `main.js`, `styles.css`, `manifest.json`.
3. Reinicie completamente o Obsidian e tente ativar o Basic.
4. Não apague o `data.json` nem o cofre. Em caso de erro, a release `10.6.1` continua como alternativa de retorno, com os mesmos três arquivos.
5. Se persistir, obtenha a primeira linha de erro na interface/console de desenvolvedor. No PC: `Ctrl+Shift+I` ou `F12` e aba Console; no Android, se não houver console acessível, informe a mensagem mostrada e versão do Obsidian. Oculte tokens e informações das notas.

## Testes

- Compilação, sintaxe, CSS, suíte de regressão histórica.
- Teste específico de integridade dos módulos antigos e ausência dos nove módulos 10.7 no `main.js`.
- Teste de inventário de rede para os sete pontos de chamada da versão estável.
- Limitação: a CI não executa o aplicativo Obsidian real e não verifica problemas específicos de WebView, versões Android ou temas de terceiros.

**Estado:** recuperação por redução do bundle. A 10.7.2 não reivindica as integrações experimentais de 10.7, mas preserva o código delas para reintrodução após diagnóstico e testes de ativação real.
