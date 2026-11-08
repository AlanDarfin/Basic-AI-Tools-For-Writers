# Visão geral do Basic e revisão dos fluxos principais

A revisão partiu do código da v13.1.0, do roteador de configurações e do inventário de fontes, estilos e testes. A prioridade foi a experiência ao abrir o Basic e usar as funções que deram origem ao plugin.

| Área | Fluxo revisado | Resultado |
| --- | --- | --- |
| Geral, Módulos e APIs | Rotas de configurações, pesquisa, status do provedor e escolha de modelo | A Geral guia a configuração de cada ferramenta. Módulos têm filtro em português e inglês. O estado da conexão considera chave, modelo e endpoint. |
| Dicionário | Digitação, resultados locais, consulta ao provedor e escrita no cofre | Busca local prioriza a entrada exata. A consulta à IA e o salvamento têm ações próprias. O salvamento verifica duplicatas ao gravar e preserva o Markdown da definição. |
| Tradução e assistente | Ações na seleção, roteamento de IA, anexos e operações em andamento | A seleção vai para a ferramenta correspondente. A tradução de notas preserva as separações entre trechos e valida os elementos protegidos antes de criar a cópia. O assistente recupera a mensagem em caso de falha e descarta respostas de conversas limpas. |
| Escrita e revisão | Seleção do editor, offsets da gramática, variantes, versões e snapshots | As operações encontram o editor da nota, inclusive em painéis divididos. Uma troca de nota durante o snapshot interrompe a aplicação da sugestão. |
| Longform, Homepage e organização | Projetos, cenas e escrita contínua, widgets, Spaces, explorador, calendário e tarefas | O inventário conferiu fontes e pontos de entrada. A suíte existente verifica persistência, navegação, isolamento de Spaces e operações sobre Markdown. |
| Blocos, formatação e integrações | Renderizadores, toolbar, foco, voz, mídia e integrações com plugins externos | A suíte cobre os contratos de inicialização e renderização registrados no projeto. |

A busca local lê o caminho configurado em **IA e dicionário → Dicionário**, com uma entrada por título de nível 1. Quando há mais de um arquivo com o mesmo nome, informe o caminho completo. **Salvar definição** cria o arquivo quando ele ainda não existe e sua pasta está disponível.

A cópia traduzida usa o padrão `Capítulo (en).md`, com um número quando o nome já está em uso. Se a nota estiver aberta em edição, o Basic usa o texto do editor. Com a proteção de Markdown ativada, o Basic guarda YAML, links (inclusive com parênteses na URL) e os trechos de código reconhecidos e os restaura na cópia. Se um marcador for alterado ou o provedor indicar que atingiu o limite de saída, a operação mostra o erro antes de gravar. Cancelar descarta a resposta da solicitação que já estava em andamento.

A validação automatizada usa um cofre e provedores simulados. O comportamento visual em temas de terceiros, a interação por toque e as respostas dos provedores reais dependem de teste no Obsidian.

As verificações históricas v10.4, fora da suíte registrada, tiveram as mesmas cinco falhas na v13.1.0 e nesta revisão. Os casos isolados ainda esperam o código de pesquisa anterior à v13, o caminho antigo do foco na Homepage ou dependências ausentes da simulação do LanguageTool.
