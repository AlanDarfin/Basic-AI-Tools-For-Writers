# Basic AI Tool for Writers — 7.0.0-beta.2

**Beta experimental.** A última versão estável continua sendo a **6.0.1**. Esta beta amplia as funções iniciadas na beta.1, usando as *ideias* do Storyteller Suite e dos exemplos Make-a-Wiki, Avatar e Tabbed. Nenhum código JavaScript ou CSS desses plugins é incorporado ao Basic AI. Os dados continuam sendo notas Markdown do Obsidian e preferências dos projetos já existentes.

## Novidades

### Um Compêndio, agora com fichas completas

- **O mesmo Compêndio** da beta.1 continua usando pastas, tags livres, Folder Notes e a organização do Longform. Não há outro banco de registros.
- Criação de notas para **personagens, locais, itens, grupos/facções, culturas, economias, sistemas mágicos, eventos, referências** e categorias personalizadas.
- **Fichas editáveis** com campos de propriedades YAML. A edição usa a API do Obsidian, preservando conteúdo e propriedades que não estão no formulário.
- **Modelos de ficha personalizados** em Configurações → Longform → Compêndio e universo. Defina nome, tag e campos; remover um modelo não apaga fichas existentes.
- **Relações** entre notas usando wikilinks normais na propriedade `relationships`, além de links do Obsidian. As conexões aparecem em um único bloco no Compêndio.
- **Avatar e imagens** reconhecidos pelas propriedades `avatar`, `cover`, `portrait` e `image`. Somente imagens locais do cofre são carregadas; a Galeria reaproveita essas imagens sem copiá-las.

Exemplo:
```yaml
---
tags: [personagem, mundo/reino]
worldType: character
summary: Guardião da biblioteca
avatar: "[[Imagens/personagem.png]]"
relationships:
  - "[[Castelo]]"
---
```

### Quadro visual e Longform

- Nova aba **Quadro** mostrando as **mesmas cenas Longform**, com estado, ponto de vista (POV), local, data e resumo.
- A ficha de cena edita as propriedades da nota, enquanto reordenar, recuar e compilar continuam nas abas originais.
- **Recolher e expandir capítulos** na árvore Longform, com botões para expandir ou recolher tudo. As linhas verticais suaves da 6.0.1 foram preservadas.
- Aba **Análise** com distribuição das cenas por estado, POV e local, sem duplicar os relatórios de progresso já existentes.

### Timeline aprimorada

- Uma **única Timeline**, agora com trilhas, ramificações, marcos, data final opcional, busca e filtros.
- Visualizações de **cronologia, trilhas, marcos ou Gantt simples**.
- Os eventos existentes continuam armazenados em `v7Timeline` ou nas propriedades `timeline` das notas. Os registros da beta.1 são compatíveis.

```yaml
timeline:
  date: 1012
  endDate: 1015
  title: Reconstrução
  track: Reino do Norte
  branch: main
  milestone: false
```

- O Gantt mostra barras onde há datas ordenáveis; eras textuais continuam como texto. **Não** é o calendário ficcional completo com dependências do Storyteller.

### Mapas, Galeria, Relações e Sessões

- **Mapas**: escolha uma imagem do cofre, selecione uma nota e toque onde deseja colocar o marcador. O marcador abre a nota. Os pontos são guardados nas preferências do projeto, sem modificar a imagem e sem carregar mapas externos.
- **Galeria**: mostra retratos e capas já anexados às fichas do Compêndio, sem importar ou duplicar arquivos.
- **Relações**: lista interativa das conexões entre registros, acessível também pelo Compêndio.
- **Sessões**: diário de sessões de campanha fictícia ou reuniões de planejamento, salvo em notas Markdown comuns dentro do projeto. Não há outro sistema de tarefas nem um motor de RPG completo.

### Exportação e IA

- A exportação já existente por **Pandoc no desktop** continua sendo o único caminho de conversão para EPUB, PDF ou DOCX. A aba Compilar recebeu **Compilar e exportar…**, que usa o diálogo do Pandoc já implementado.
- A memória narrativa para IA continua opcional e **desligada por padrão**, limitada a capítulos anteriores no momento da revisão. O Compêndio não é enviado automaticamente a serviços externos.

## Compatibilidade e limites

- Obsidian 1.11.4+, PC e Android; controles compactos e estilos derivados do tema.
- Os plugins de referência podem permanecer instalados: esta integração não depende deles.
- Ainda faltam um editor gráfico completo de relações, calendários ficcionais complexos, Gantt com dependências, regras avançadas de campanha, exportação editorial personalizada e detecção semântica profunda de contradições. São temas para próximas betas.
- Antes de testar uma beta, faça backup das notas e da pasta de configurações. Testes automatizados não substituem a validação no Android e em temas personalizados.

## Instalação

Extraia `Basic-AI-Tool-for-Writers-7.0.0-beta.2.zip` ou atualize `main.js`, `manifest.json` e `styles.css` na pasta `.obsidian/plugins/basic-ai-tool-for-writers/`. Reinicie o plugin. A tag não utiliza prefixo `v`.

English: [V7_BETA2.en.md](V7_BETA2.en.md).
