# Auditoria 10.5.0 — pedidos anteriores e integração atual

Data da revisão: 05/11/2026. Escopo: código-fonte modular da branch 10.5, documentação histórica (v7–v10), itens solicitados e testes automatizados. **Presença de funções no código não prova que todas funcionam visualmente em cada aparelho/tema.**

## Implementações adicionadas nesta etapa

| Pedido | Implementação | Limitações |
| --- | --- | --- |
| Related Notes (mrboxtobox) | Busca de similaridade **local** com tokens multilíngues, assinatura Bloom, cache em memória, ranking, painel lateral, widget e ação para inserir link interno | Consulta até 1.200 notas recentes por rodada (350 padrão); não replica integralmente a otimização do plugin original para cofres enormes |
| Trash Explorer (proog) | Painel lateral + widget; lista arquivos e pastas da `.trash`, restaura sem sobrescrever, exclui somente com confirmação, esvazia com confirmação | Não lê a lixeira do sistema; o caminho original pode não ter sido mantido pelo Obsidian |
| Homepage | Widgets de notas relacionadas, lixeira, leitura da nota e fontes Zotero; integração ao catálogo, presets, Spaces e tamanhos existentes | Layout e gestos de drag-and-drop precisam de teste real no Android |
| Citações | Biblioteca offline ampliada com trechos curtos de escritores e filósofos clássicos; listas personalizadas continuam substituindo a lista padrão | O texto importado do Zotero só aparece mediante notas e configurações locais |
| Zotero | Autores em listas, diferentes chaves de destaque, busca por referência importada, inserção de `[@citekey]`/link, widget de fontes | **Sem** autenticação, sincronização direta, importação de biblioteca ou formatação CSL nativa |
| Enhancement Suite: progresso de leitura | Barra em visualização de leitura e edição; espessura e cor preservadas; atualização no scroll/troca de nota | Não confundir com progresso **manual** de livros Longform |

## Pedidos anteriores confirmados como presentes no código

- **Longform / Bookshelf:** projetos e cenas, subcapítulos, BookNav, metadados e progresso manual de leitura de livros; o progresso automático de *rolagem* é separado.
- **Homepage:** pesquisa fuzzy, calendário, rádio, galeria, citações, favoritos, recentes, livros, metas, estudos, widgets removíveis e presets.
- **Linguagem:** LanguageTool integrado com funções de gramática, atalhos de correção, dicionário e opções de popup, além da integração opcional externa.
- **Escrita:** chat/diálogo, áudio representado textualmente, blocos de timeline, progressbar, ferramentas Markdown, alinhamentos e toolbar configurável.
- **Espaços, Explorer e aparência:** Spaces independentes, custom sorting parcial, previews, folder notes, ícones personalizados, ações contextuais, propriedades e busca de configurações.
- **Organização e foco:** pomodoro, calendário, estudos locais, Soundscapes/Click Clack no PC, snapshots, cursor/maquina de escrever.

## Lacunas ou integrações ainda parciais, identificadas na comparação

1. **Make.md / Flow / Custom Sorting:** a base atual reproduz operações essenciais, mas não todo o editor gráfico Make.md nem toda a gramática sorting-spec.
2. **Zotero:** recursos de *sincronização* da biblioteca desktop/web, estilos bibliográficos CSL, anotações PDF nativas e importação direta ainda dependem de ferramentas externas. A seleção desta versão atua sobre Markdown importado.
3. **Full Calendar:** importação/exportação ICS local funciona, mas OAuth e sincronização bidirecional com Google/Outlook não estão disponíveis.
4. **Gallery / PDF:** existe preview para mídia e documentos, mas miniaturas multipágina de PDFs ainda são uma limitação declarada.
5. **Estudos / TTS:** repetição espaçada local ainda não é compatibilidade completa FSRS/Anki; TTS de qualidade equivalente em todos os Android/Linux depende de vozes e serviços disponíveis.
6. **Enhancement Suite:** validação de YAML por comando existe, porém *realce em tempo real* de erros no frontmatter, visualizador JSON hierárquico e substituição entre arquivos não foram reproduzidos integralmente.
7. **Revisão no aparelho:** posicionamento de ícones, espaço em branco de configurações, rolagem LanguageTool/cursor e dimensões dos painéis em Android/720p ainda exigem observação real. Testes de código não permitem declarar todos esses problemas resolvidos.

## Validações antes de considerar uma integração concluída

- Abrir Obsidian desktop e Android, alternar entre edição/leitura, rolar a nota e testar a barra superior.
- Criar itens de exemplo na lixeira interna e validar restauração, colisão, exclusão e restauração de pastas sem usar dados importantes.
- Abrir e trocar notas com tags/idiomas distintos; confirmar que o painel de relacionadas atualiza e que o índice não interfere na digitação.
- Reabrir homepage com presets e Spaces antigos; testar novo widget após atualização sem perder a ordem existente.
- Testar Zotero com uma nota importada que tenha frontmatter `citekey`, `author` e anotações; confirmar links e entradas `[@chave]`.
- Rever LanguageTool e o comportamento da máquina de escrever ao aceitar sugestões em PC e celular.

**Resultado editorial:** a versão 10.5 atende aos pedidos novos em nível de código, mas nenhuma reprodução integral dos plugins de referência nem validação visual móvel deve ser afirmada sem testes específicos.
