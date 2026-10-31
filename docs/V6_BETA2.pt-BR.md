# Basic AI Tool for Writers 6.0.0-beta.2

**Pré-release experimental · Desktop/Android · Não é a versão estável 6.0.0.**

Esta atualização corrige a restauração da rolagem do **Remember Cursor Position**, especialmente no celular, e adiciona navegação entre capítulos e subcapítulos dos projetos Longform. Mantém os recursos introduzidos na beta.1. A versão estável do projeto permanece **5.2.0**.

## Remember Cursor Position — Android

- Ao abrir uma nota, o plugin aguarda o editor carregar, restaura seleção e posição e pede ao CodeMirror que **centralize a linha do cursor**. Rolagem por coordenadas é aplicada somente como etapa inicial; centralização é repetida após o layout móvel estabilizar.
- Uma tentativa adicional é agendada quando o painel da nota é ativado, pois a abertura pode preceder a montagem do editor no Android.
- Quando o usuário move o cursor antes da restauração, o plugin respeita sua ação. Âncoras explícitas de cabeçalhos e buscas não são sobrescritas.
- Seleções e posições continuam sendo guardadas localmente por nota, com limpeza e limites já existentes.

**Teste solicitado:** em um capítulo longo, posicione o cursor no final, abra outra nota, retorne à primeira e confira se a linha fica visível. Repita depois de minimizar o Obsidian ou alternar de aba. Não é possível confirmar o comportamento físico do seu telefone somente com testes Node/CI.

## Navegação Longform — BookNav + Note Chain

Criamos uma implementação própria, inspirada na navegação visual do BookNav e nas relações hierárquicas do Note Chain, mas **sem importar bundles ou CSS dos plugins de terceiros**. A ordem é sempre a do **índice Longform**, não a alfabética do cofre.

O bloco suporta **quatro destinos independentes** conforme existirem: capítulo anterior, próximo capítulo, subcapítulo anterior e próximo subcapítulo. Em um subcapítulo, o botão de capítulo anterior leva ao capítulo pai; os botões de subcapítulos usam os irmãos do mesmo nível. Um capítulo principal também pode oferecer o último subcapítulo do capítulo anterior ou o primeiro do atual. Notas ausentes são ignoradas, nunca criadas automaticamente.

**Como inserir o bloco:** abra uma nota que faça parte de um projeto Longform e execute o comando **Longform: inserir navegação entre capítulos**. Alternativamente, escreva:

````markdown
~~~longform-nav
~~~
````

O bloco é renderizado pelo mecanismo de blocos Markdown do Obsidian no modo Leitura/Live Preview. Pode ser adicionado ao template de cenas do seu projeto para aparecer em novos capítulos. Em **Configurações → Longform → Navegação Longform**, é possível ligar/desligar o recurso e mostrar apenas capítulos principais ou subcapítulos.

## English translation

Every new setting, command, button and message in this beta includes Portuguese (Brazil) and English UI text. See [V6 beta 2 English notes](V6_BETA2.en.md).

## Segurança, qualidade e limitações

- Os botões abrem apenas arquivos Markdown válidos no cofre; usam a ordem já existente no índice Longform, sem alterar o índice, criar arquivos ou executar código.
- A navegação é explícita por bloco e comando: **não injeta automaticamente cartões em todas as notas antigas**.
- Os testes verificam capítulos, subcapítulos, níveis aninhados, notas ausentes, filtros de botões e a solicitação de rolagem CM6 no Android.
- Ainda recomendamos testar no Obsidian real, em especial Android e temas de terceiros. Não há promessa de compatibilidade com a ordem personalizada independente do Note Chain quando ela divergir da ordem Longform.
- Não se trata de um port literal do BookNav ou Note Chain; os arquivos enviados serviram como referência de comportamento.

### Instalação

Baixe o ZIP da **6.0.0-beta.2**, faça backup do cofre e substitua apenas \`main.js\`, \`manifest.json\` e \`styles.css\` na pasta do plugin. **Mantenha seu data.json**. A tag da release é \`6.0.0-beta.2\` sem prefixo \`v\`, marcada como **prerelease**. A 6.0.0 estável **não** foi lançada.
