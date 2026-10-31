# Basic AI Tool for Writers — 6.0.0-beta.4

**Beta experimental.** A última versão estável continua sendo a **5.2.0**.

## Novidades

### Navegação Longform
- **Rodapé automático:** habilite "Adicionar automaticamente ao fim das notas" nas configurações Longform ou ative individualmente no projeto. Nenhuma nota é alterada para mostrar o rodapé.
- Funciona na leitura e no Live Preview. Se a nota já contiver um bloco `longform-nav`, o rodapé automático não será duplicado.
- **Ir para capítulo:** comando com busca aproximada na ordem real de capítulos e subcapítulos.
- **Modo manual:** o novo comando permite selecionar uma nota anterior e outra próxima pelo cofre do Obsidian, inclusive fora de qualquer Longform.
```text
~~~longform-nav
mode: manual
previous: "[[Notas/Primeira]]"
next: "[[Notas/Terceira]]"
~~~
```
  Os dois campos são opcionais. O bloco Longform anterior sem conteúdo continua funcionando dentro dos projetos.

### Inserção inteligente
- Comandos nativos do Obsidian e menu de contexto, **sem reviver a antiga Editing Toolbar**.
- Janela para Ruby acima/abaixo, avaliações, datas Discord, spoilers e subtexto.
- Os diálogos possuem textos em português e inglês; se a nota for alterada durante a configuração, a inserção é cancelada para evitar sobrescritas.

### Interface mais limpa
- Controles mais compactos no editor de projetos, configurações Markdown e janelas de inserção.
- Preservadas as abas roláveis e a adaptação para telas pequenas.

### Preferências por projeto
- Navegação automática independente: **herdar / ativar / desativar**.
- Opção de desativar no projeto Ruby, avaliações, sintaxe Discord, timestamps, tempo de leitura e linter. Se o módulo estiver oculto globalmente, continuará oculto.
- Orientações editoriais do livro são incorporadas à revisão por IA, sem apagar o perfil global.
- Perfil de escrita preferido guardado no projeto, com aplicação manual. Ao aplicar um perfil, as preferências globais mudam até serem desfeitas; nada é aplicado silenciosamente ao abrir um capítulo.
- Os dados ficam nas configurações do Basic AI, sem modificar o índice Longform.

## Instalação
Substitua `main.js`, `manifest.json` e `styles.css` na pasta `.obsidian/plugins/basic-ai-tool-for-writers/` ou extraia o ZIP. Recarregue o plugin e faça backup do cofre antes de testar.

## Para a RC
Verificar em Android e desktop: posição do rodapé no Live Preview, temas, notas fora do Longform, mudanças de ordem, subcapítulos, troca de projeto e restauração de perfis. Testes automáticos não substituem essas verificações práticas.
