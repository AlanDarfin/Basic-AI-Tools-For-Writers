# Basic 12.0.2 — Spaces, explorador e toolbar

**Requer Obsidian 1.11.4+ · Desktop e Android.** Mantém o ID, os perfis, os arquivos e os layouts existentes.

## Melhorias

- **Raiz de cada Space:** selecionar `Trabalho/Escrita/Fireverse` renderiza Fireverse como pasta-raiz visual do explorador, com seus conteúdos e subpastas. As pastas superiores ficam ocultas visualmente, sem mover ou renomear arquivos.
- **Ocultar neste Space:** menu contextual de pastas e notas para ocultar ou reexibir apenas na Space ativa. Ocultar uma pasta também filtra os seus descendentes; outras Spaces mantêm suas regras.
- **Coleções consistentes:** cartões, listas, tabelas e quadros respeitam itens ocultos na Space. Renomeações de pasta atualizam a raiz e as regras salvas.
- **Dragger acessível no PC:** a alça permanece visível quando o ponteiro atravessa o espaço entre a linha Markdown e a alça; continua desativado no celular.
- **Toolbar flutuante:** aparece somente quando existe texto selecionado em modo de edição e desaparece quando a seleção acaba.
- **Perfis separados:** desktop e celular mantêm botões, menus, tamanhos, estilos e cores independentes. Os valores existentes são usados para inicializar ambos.
- **Configurações sem abas extras:** os recursos de v12 e das suítes foram integrados às seções anteriores, sem os grupos Toolkit e Suítes.

## Garantia de compatibilidade

- PRs e issues revisados antes de alterar o plugin; a issue #71 permanece aberta para as partes não concluídas de seu roadmap.
- Testes de ocultação por Space, seleção, perfis, CSS, build e compatibilidade.
- Instaladores incluem `main.js`, `manifest.json`, `styles.css`. O workflow de release exige validação automatizada.
