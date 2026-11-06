# Basic 10.11.0 — escopo real das três integrações

O Basic integra **recursos selecionados**, implementados de forma independente com Markdown e APIs disponíveis no Obsidian 1.11.4+. **Não é uma cópia integral** dos plugins originais, que podem depender de versões mais recentes do aplicativo.

## 1. Unique Suite — rotina acadêmica

**Implementado:**
- Central acadêmica com acesso único na paleta de comandos, sem novos ícones no ribbon.
- Captura de aula como nota Markdown, com título, data e semestre.
- Diário por dia e por mês; notas já existentes são reabertas, nunca sobrescritas.
- Lembretes Markdown com data, criação explícita e lista dos próximos lembretes.
- Modelo de nota de horário e visualização em bloco `basic-timetable`, com destaque do dia.
- Pastas configuráveis e validação de nomes; tudo permanece no cofre local.
- Integração conceitual com o calendário, ICS e estudos já existentes no Basic, sem criar outro subsistema de sincronização.

**Ainda não há paridade:** assistente completo de configuração universitária, agenda com camadas por feed, sincronização bidirecional de ICS, importação automática de horários e biblioteca de atalhos idêntica à original. O calendário/ICS já existente continua sendo o caminho principal.

## 2. Notion Suite — bancos de dados

**Implementado:**
- Novo bloco `basic-suite-db` com visualizações de tabela, quadro, galeria, lista, calendário, linha do tempo e gráfico de barras.
- Pesquisa local por nome/propriedade, ordenação e filtragem herdadas do banco Markdown do Basic.
- Fórmulas aritméticas simples e rollups de relações já disponíveis na engine `writer-database`.
- Galeria com imagem de `banner` ou `cover`; lista com recuo visual para a propriedade `parent`.
- Criação explícita de notas em pastas do banco e edição de células com snapshots quando disponíveis.
- Bloco `basic-suite-chart` e atalho `/dbview` do menu Flow já existente.
- Mantém cada item como arquivo Markdown; não cria uma base proprietária.

**Ainda não há paridade:** construtor visual integral de filtros, editor de propriedades tipadas, drag-and-drop de cartões com alteração de estado, subitens hierárquicos interativos, automações/recorrência, widgets Notion e relações bidirecionais. A troca de visualização na barra do bloco não altera o código-fonte da nota. A sintaxe própria evita competir pelo processador `notion-db` quando o Notion Suite original estiver instalado.

**Exemplo:**

~~~basic-suite-db
folder: Databases/Tarefas
view: gallery
columns: file, status, due
cover: banner
group: status
sort: modified
order: desc
~~~

Mude `view` para `table`, `board`, `list`, `calendar`, `timeline` ou `chart`.

## 3. Number Suite — numeração de documentos

**Implementado:**
- Números virtuais opcionais para títulos H1–H6 **em Modo de Leitura** (sem alterar a nota).
- Sumário navegável para a nota atual.
- Comandos separados para numerar e remover prefixos numéricos reconhecidos.
- Prévia linha a linha, confirmação explícita, snapshot quando disponível e verificação exata de conteúdo antes de gravar.
- Estilo de numeração hierárquico ou plano.
- Destaque de parágrafos com início `Figure:`, `Table:`, `Equation:` ou `Code:`.
- Desativação por nota com `basic-numbering: false` nas propriedades.
- Sem pedidos de rede, alterações silenciosas ou processamento em lote.

**Ainda não há paridade:** decoração de numeração no Live Preview, títulos H7–H9, esquemas jurídicos/chineses customizáveis, editor completo de títulos e legendas, números independentes nas legendas, referências semânticas, remapeamento de notas de rodapé/finais, mapas mentais e prévias de mudanças em pasta/cofre. **Ao gravar numeração, links que usam nomes de cabeçalhos podem deixar de funcionar**; nenhum link é reescrito automaticamente.

## Segurança, versão e reconhecimento

- Cada módulo tem configuração de ativação independente e inicialização protegida, sem adicionar botões ao ribbon.
- Arquivos só são criados ou alterados por ação explícita; visualizações não editam arquivos sozinhas.
- Não são necessárias novas solicitações externas de rede, API keys ou contas.
- Versões das fontes verificadas: Unique Suite 0.2.13, Number Suite 0.6.4, Notion Suite conforme repositório oficial. As dependências recentes dos projetos originais não são incorporadas diretamente.
- Projetos consultados: [Unique Suite](https://github.com/Benhaman9/unique-suite), [Notion Suite](https://github.com/navysum/notion-suite) e [Number Suite](https://github.com/ZHYX91/obsidian-number-suite). Todos declaram licença MIT; o código desta integração foi escrito especificamente para o Basic.
- **Recomendação de teste:** primeiro em um cofre de exemplo, especialmente gravação de numeração, compatibilidade mobile, propriedades e sincronização externa previamente configurada.

Os READMEs são reservados para funções e exemplos. O histórico desta integração permanece em `CHANGELOG.md`.
