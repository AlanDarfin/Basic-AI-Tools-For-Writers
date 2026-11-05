# Recuperação de ativação — Basic 10.7.1

**Problema reportado:** após instalar a 10.7.0, o Obsidian pode apresentar erro e não ativar o Basic. Não foi enviado um stack trace da janela do Obsidian, de modo que a causa exata no dispositivo ainda não foi confirmada.

## Investigação

- A comparação de commits entre os tags `10.6.1` e `10.7.0` não revelou arquivos antigos removidos. Os módulos de dicionário, ferramentas de escrita, Longform, homepage, LanguageTool, calendário, estudos, toolbar e outros continuam listados no `scripts/build-v3.js`.
- A 10.7.0 adicionou registro imediato de oito subsistemas opcionais dentro de `writerV101RegisterEnhancements`. No Obsidian real, esse registro acontece durante o carregamento principal do plugin.
- Os testes antigos de inicialização usavam mocks do Obsidian e não simulavam todos os eventos do workspace nem uma atualização com arquivos incompletos. Ausência de erro de sintaxe não comprova que um plugin ativará em todo dispositivo.
- Algumas integrações só precisam ser registradas quando o layout estiver pronto. Falhas isoladas em módulos experimentais não devem interromper a ativação do núcleo.

## Correção 10.7.1

1. O núcleo legado continua inicializando primeiro. Recursos 10.7 são registrados somente após `workspace.onLayoutReady`, em tarefa posterior. Evita lançar exceções de integração dentro do `onload` principal.
2. Cada subsistema é verificado individualmente antes de ser utilizado. Arquivos parcialmente atualizados ou componentes ausentes não causam `ReferenceError` ao construir as listas de funções.
3. Falhas de um subsistema são isoladas e registradas no console; os demais continuam carregando. O estado de inicialização também evita registro duplicado.
4. Ao desabilitar/recarregar o plugin antes do layout, o agendamento pendente é cancelado.
5. Opção **Ativar integrações experimentais 10.7** nas configurações: desligar deixa o Basic com as funcionalidades legadas, preservando dados, módulos e preferências anteriores. A alteração entra em vigor ao reiniciar o Obsidian.
6. Testes automatizados simulam: módulos ausentes, erro durante registro, falha das configurações, inicialização atrasada, cancelamento no unload, modo de compatibilidade e integridade da lista de módulos históricos.

## Procedimento de instalação

1. Faça um backup da pasta do plugin e do `data.json`.
2. Baixe a release 10.7.1 e copie **todos os três arquivos** `main.js`, `manifest.json` e `styles.css` para o diretório do plugin. Não misture versões.
3. Reinicie completamente o Obsidian e tente ativar o Basic.
4. Se a ativação continuar falhando, é possível restaurar os três arquivos da release **10.6.1**, mantendo uma cópia do `data.json`. Não apague o cofre.
5. Para diagnóstico definitivo da falha, forneça a mensagem exata do console do Obsidian (F12 → Console no PC), sem copiar tokens, API keys ou trechos privados de notas.

## Limitações da verificação

A CI executa o bundle, valida sintaxe, CSS e testes em ambiente simulado. Ela não inicia um Obsidian gráfico real e não reproduz todas as WebViews Android, temas ou plug-ins instalados juntos. Portanto, a 10.7.1 reduz o risco de travamento de ativação, mas ainda precisa da confirmação no aplicativo.
