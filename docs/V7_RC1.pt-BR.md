# Basic AI Tool for Writers — 7.0.0-rc.1

**Release Candidate, ainda não estável.** A versão estável permanece sendo a **6.0.1**. Esta candidata consolida o Compêndio, Folder Notes, Timeline, fichas editáveis, Quadro, Relações, Mapas, Galeria, Sessões, Continuidade e as ferramentas de escrita e exportação já existentes.

## O que aproveitei do StoryLine no Longform

O StoryLine 1.11.8 fornecido foi utilizado somente como **referência de funcionalidades**: quadro/corkboard, Kanban, tramas, matriz de tramas, estruturas narrativas, inspetor de cenas e análise de emoção/intensidade. **Não copiamos nem distribuímos** o código JavaScript ou CSS do plugin original, e não é necessário instalá-lo.

A integração foi feita na **ordem real de capítulos e cenas do Longform**:

- **Quadro:** agora oferece **Cartões**, **Kanban** (agrupado por estado da cena) e **Lista**. Busca e filtros por estado, POV, ato e trama. A organização do manuscrito continua sendo alterada na aba **Cenas**; o Kanban não cria uma ordem paralela.
- **Inspetor de cenas:** acessível por **… → Inspecionar cena** ou **Editar ficha** no Quadro. Além de resumo, estado, POV, data e local, permite editar ato, sequência, personagens, tramas, marcos narrativos, emoção, intensidade, conflito, preparações/consequências de cenas e meta de palavras. Tudo vai para as propriedades YAML da própria nota, sem alterar o corpo do manuscrito.
- **Estrutura:** uma única aba compacta com **Tramas**, **Marcos narrativos** e **Ritmo**, sem encher o menu de dezenas de novas abas.
  - **Tramas:** agrupamento de cenas pela propriedade `plotlines`, incluindo uma **matriz de tramas por atos**. Também dá para associar tramas a cenas existentes.
  - **Marcos narrativos:** modelos de **três atos**, **cinco atos** e **Jornada do Herói**, apenas como planejamento. A propriedade `storyBeat` vincula uma cena ao marco. O plugin aponta o que foi associado e o que continua sem cena, sem gerar capítulos automaticamente.
  - **Ritmo:** curva de intensidade de 0 a 10 na ordem Longform, com filtro por ato. Valores não informados aparecem como ausentes e não são adivinhados.
- **Continuidade:** o verificador existente passou a sinalizar referências inválidas em `setup_scenes` e `payoff_scenes`. É uma checagem estrutural, não uma IA garantindo que a trama está correta.
- **Recursos preservados:** recuos em linhas verticais, capítulos recolhíveis, reordenação no celular, rascunhos, compilação, navegação automática e manual.

### Exemplo de propriedades em uma cena

```yaml
---
status: draft
act: "2"
pov: Akira
plotlines:
  - principal
  - amizade
storyBeat:
  - midpoint
intensity: 7
emotion: hopeful
characters: [Akira, Lucas]
location: Bonfire
conflict: "Uma decisão difícil"
setup_scenes: ["[[Capítulo 8]]"]
payoff_scenes: ["[[Capítulo 14]]"]
target_wordcount: 1200
summary: "O grupo começa a questionar suas escolhas."
---
```

Os campos são opcionais. Capítulos antigos funcionam sem eles, e você pode personalizar os nomes de tramas, personagens, emoções e estados. Os códigos de marcos narrativos são oferecidos como modelos, mas não exigem modificar a organização do livro.

## O que continua da beta 2

Compêndio por tags livres, Folder Notes, fichas e modelos próprios de universo, relações entre notas, Galeria, Mapas com imagens do cofre, Timeline por trilhas/ramificações/Gantt simples, Sessões, estatísticas e modo foco. O Pandoc existente no desktop continua sendo o único sistema de exportação para EPUB, PDF e DOCX. A memória narrativa por IA permanece opcional e **desligada por padrão**, consultando somente capítulos anteriores quando você solicita uma revisão.

## Limites e compatibilidade

- Obsidian **1.11.4+** em PC e Android, menus compactos e estilos derivados das cores do tema.
- A RC **não é ainda a versão final**. Faça backup das notas e configurações antes de testar, principalmente se você usa muitas propriedades YAML personalizadas.
- Não foram incorporados gerenciador avançado de séries de livros, arrastar livremente uma matriz de tramas, calendários fictícios completos, setas de dependências, análise semântica profunda de contradições ou um canvas complexo de relações. Essas funcionalidades precisam de mais projeto e validação.
- Não há migração automática de arquivos ou duplicação de projetos: os metadados são editados nas notas e as visualizações consultam os capítulos atuais.
- Os testes automatizados verificam regressões, sintaxe, integração, CSS e traduções. **Ainda é necessário testar visualmente o fluxo real no Android e no desktop antes da v7 estável.**

## Como instalar

Extraia o `Basic-AI-Tool-for-Writers-7.0.0-rc.1.zip` ou substitua `main.js`, `manifest.json` e `styles.css` em `.obsidian/plugins/basic-ai-tool-for-writers/`. Recarregue o plugin. A tag é **7.0.0-rc.1**, sem o prefixo `v`.

[English](V7_RC1.en.md) · [Beta 2](V7_BETA2.pt-BR.md).
