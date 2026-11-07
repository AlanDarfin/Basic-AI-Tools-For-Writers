# Basic v13 — Auditoria e sistema visual

**Status:** refatoração proposta sobre a v12.0.5. Requer CI e testes visuais no Obsidian antes de uma versão estável.

## Escopo e preservação

A árvore do repositório, referência dc52d5feacb706d4076e9e33b74fcabca0c421fd, contém **398 arquivos versionados** (cerca de 5,2 MiB), incluindo módulos src/v3–src/v12, testes, documentação, CSS e artefatos compilados. O novo comando **node scripts/audit-v13.js --check** percorre cada arquivo da cópia local: inventaria extensões/tamanho, encontra marcadores de conflito, confere fontes declaradas nos builds, verificações da nova fundação e testes registrados. Seletores CSS repetidos e fontes fora do bundle são relatados, nunca removidos automaticamente.

**Nenhuma função foi removida:** foram preservados os 54 identificadores de páginas de configuração no roteador, os comandos e os formatos de dados. Não há migração destrutiva. Código aparentemente legado não foi apagado sem comprovação de paridade.

## [Bugs corrigidos no código]

- Seletor Basic de comandos: ↑/↓/Home/End/Enter, foco visual do item atual, contagem acessível, estado vazio e suporte preservado aos IDs personalizados.
- Busca sem acentos, tolerante a maiúsculas/minúsculas e termos múltiplos; ranking determinístico por relevância e desempate alfabético.
- Navegação por teclado nas duas faixas de abas de configurações, sem substituir os eventos de clique existentes.
- Estilos v13 de prevenção de overflow horizontal, quebras de texto, SVG alinhado ao texto e estados de foco/hover/disabled, inclusive em viewport estreita.

**Pendente de validação real:** aparência em todos os temas de terceiros, Surfing interno, dragger, timeline, longform e touch Android. Código CSS não comprova sozinho a correção visual.

## [UI/UX unificados] — tokens v13

Fonte: src/styles/v13-foundation.css (carregada por último). CSS respeita o tema ativo e está restrito às raízes do Basic.

| Token | Uso | Origem |
| --- | --- | --- |
| --basic-ui-accent | foco/acento | --interactive-accent |
| --basic-ui-bg | fundo base | --background-primary |
| --basic-ui-surface | superfícies | --background-secondary |
| --basic-ui-hover | hover | --background-modifier-hover |
| --basic-ui-border | contornos | --background-modifier-border |
| --basic-ui-text | texto | --text-normal |
| --basic-ui-muted | texto secundário | --text-muted |
| --basic-ui-radius | cartões | --radius-m |
| --basic-ui-radius-small | botões | --radius-s |
| --basic-ui-space-1/2/3/4 | ritmos | 4/8/12/16 px |
| --basic-ui-focus | focus-visible | 2px no acento |

**Arquitetura das configurações:** Geral, Interface e personalização, Organização e produtividade, Escrita e edição, Markdown e extensões, Longform e livros, Revisão e leitura, IA e dicionário. O agrupamento foi alterado sem excluir nenhuma das 54 páginas.

**Limite de API:** a paleta global nativa do Obsidian não expõe ordenação pública customizável; o ranking se aplica ao seletor de comandos **do Basic**, não a um monkey patch global.

## [Refatorações]

- src/v13/ui-foundation.js: utilitários puros de normalização, catálogo, pontuação, ordenação e abas acessíveis.
- src/v10/toolbox.js: seletor personalizado agora usa a fundação, mantendo fallback para ambientes sem os auxiliares.
- src/styles/v13-foundation.css: identidade visual única, tokens sem cores fixas e proteção de responsividade.
- scripts/build-v3.js e scripts/build-css.js: fontes v13 registradas. main.js e styles.css foram atualizados para corresponder.
- scripts/audit-v13.js: varredura reproduzível de todo o projeto, sem exclusão automatizada de funções.
- tests/v13-foundation.test.cjs e package.json: testes e verificações v13 integrados ao fluxo existente.

**Débitos ainda existentes:** main.js e styles.css continuam grandes; CSS histórico contém camadas e possíveis duplicidades. Remover regras exige testes visuais diferenciais e análise de referências dinâmicas. As integrações externas da v12.0.5 continuam parciais, conforme docs/V12_0_5_INTEGRATION_GAPS.pt-BR.md.

## [Recursos expandidos]

Busca por nome/ID com vários termos, navegação acessível nos seletores, feedback consistente, checklist e inventário automatizado.

## Few-shot examples — padrões para prompts futuros

### Exemplo 1 — configuração na aba existente

Pedido: “Adicione ícones compactos ao explorador sem criar outra aba”.

~~~js
function writerV13ExampleExplorerSettings(plugin,panel){
 const cfg=plugin.settings.explorerOptions;
 new Setting(panel).setName(writerUi('Ícones compactos','Compact icons'))
  .addToggle(toggle=>toggle.setValue(cfg.compactIcons===true)
   .onChange(async value=>{cfg.compactIcons=value;await plugin.saveSettings();}));
}
~~~

Use a chave preexistente, não crie duplicações nem feche a aba após salvar.

### Exemplo 2 — componente que respeita o tema

Pedido: “Crie um cartão na homepage com o mesmo design dos outros”.

~~~css
.writer-v13-shortcut-card{
 display:flex;gap:var(--basic-ui-space-2);align-items:center;min-width:0;
 padding:var(--basic-ui-space-3);border:1px solid var(--basic-ui-border);
 border-radius:var(--basic-ui-radius);background:var(--basic-ui-surface);
 color:var(--basic-ui-text);
}
.writer-v13-shortcut-card:focus-visible{outline:var(--basic-ui-focus);}
~~~

Nunca use seletores globais na área de leitura do Obsidian nem CSS que altere webviews externos.

### Exemplo 3 — catálogo consistente de comandos

~~~js
const commands=writerV13CommandCatalog(plugin);
const results=writerV13RankCommands(commands,'formatar título',70);
// Exibir resultados; somente executar após uma escolha explícita.
~~~

### Exemplo 4 — critérios para todo PR de UI

- [ ] build e checagem automatizada concluídos: npm run build, npm run check.
- [ ] Inventário completo: node scripts/audit-v13.js --check.
- [ ] Funcionalidades anteriores, IDs, dados, renderizadores e comandos preservados.
- [ ] Temas claro/escuro e tema customizado; resolução 1280×720 e 1440×810.
- [ ] Desktop e Android: mouse, toque, teclado, menu, pesquisa, scroll, popups e painéis.
- [ ] Homepage, Longform, Spaces, toolbar, timeline, dragger e Surfing verificados manualmente.
- [ ] Erros restantes documentados sem apresentar correções não testadas como concluídas.

**Publicação:** somente após CI aprovado e checklist manual de compatibilidade. Este relatório distingue mudanças no código de comportamentos ainda não confirmados na interface real.

## Resultado da auditoria automatizada no CI (07/11/2026)

- **403 arquivos** no branch v13; **102 módulos JS** registrados no build, **32 módulos CSS**, **109 arquivos de teste**.
- **0 erros** e **0 avisos** de integridade do inventário/build.
- **333 chaves de seletores CSS com múltiplas ocorrências** em styles.css. Isso indica sobreposição histórica da cascata, mas não prova que as declarações sejam idênticas ou removíveis com segurança. Mantidas até haver análise diferencial de regras e testes visuais.
- A barra de formatação e o seletor de atalhos agora compartilham o mesmo picker de comandos; o caminho antigo de FuzzySuggestModal permanece como fallback.
- CI confirma sintaxe, geração, lint comunitário, metadados e regressões simuladas. **Não** confirma pixels, comportamento por toque nem compatibilidade com todas as versões de terceiros.

A versão estável ainda depende de validação visual e funcional no Obsidian; publicar apenas com esse resultado automatizado seria prematuro.

## Ciclo de higienização e liberação de CSS (07/11/2026)

**Métrica de origem:** 333 seletores reincidentes, 252 com contextos condicionais distintos, 115 com repetições dentro do mesmo contexto, 106 declarações idênticas candidatas e 124 valores diferentes que exigem preservação/inspeção. A contagem de seletores reincidentes NÃO representa 333 erros.

**Mudança aplicada:** `scripts/css-v13-dedupe.js` removeu **106 declarações redundantes** correspondentes a **52 seletores** do CSS distribuído (504.393 → 501.881 caracteres) e passou a executar em `scripts/build-css.js`. O algoritmo respeita igualdade exata de seletor, contexto de at-rules, propriedade e valor; preserva fallbacks no mesmo bloco, comentários, keyframes, valores divergentes e regras responsivas. Passes adicionais são idempotentes. `styles.css` é mantido sincronizado com essa etapa na compilação. Os módulos `src/styles` conservam as versões originais como fontes históricas para manutenção; a deduplicação acontece no bundle final.

**Migração segura:** continuam no bundle os adaptadores visuais e tokens v13 para configurações, editor, Longform, Spaces, Timeline, Dragger e bookmarks/Surfing. Não se removeu código JavaScript pelo simples fato de não ser encontrado por uma pesquisa textual: há classes criadas dinamicamente e fallbacks necessários em ambientes isolados. Limpeza semântica de JS legado ainda requer comprovação de paridade de cada função.

**Testes novos:** `tests/v13-css-dedupe.test.cjs` cobre duplicatas equivalentes, contextos responsivos, `@supports`, keyframes, temas, fallbacks, comentários, idempotência e presença de módulos no bundle. `npm run check` incorpora a validação do bundle otimizado e a regressão.

**Limites de validação:** o CI verifica sintaxe e testes automatizados. Visual real de Android, múltiplos temas externos e plugins nativos dentro do Obsidian ainda exige execução manual com capturas e teste por toque/arraste. Sem essa evidência, não declarar autorização incondicional de merge da release estável.

**Ajustes adicionais de compatibilidade (código):** v13 agora limita os controles de Longform, Spaces e Timeline às larguras disponíveis, alinha SVGs sem alterar os tamanhos próprios de cada plugin, destaca cartões focados, mantém a timeline horizontal dentro de seu scroll e adapta a área de diálogo à viewport dinâmica do Android. O recipiente da barra Surfing respeita a largura da homepage, sem alterar a `HeaderBar` nativa. O teste de contratos visuais é estático, não equivale a teste de renderização em dispositivo.

**Migração de componentes legados comprovada:** os dois caminhos de seleção de comandos (atalhos do toolbox e toolbar de formatação) foram convergidos no mesmo picker v13. Foram retirados a busca não acentuada/sem ranking como fallback redundante no toolbox, e o seletor legado baseado em `FuzzySuggestModal` da toolbar. As callbacks de ID/nome e o suporte a IDs personalizados foram preservados. Como a fundação v13 e o toolbox fazem parte do bundle oficial, os casos de carga isolada sem os módulos foram substituídos por dependência explícita. `main.js` foi atualizado junto com os módulos, e um teste de regressão verifica a ausência dos caminhos obsoletos.
