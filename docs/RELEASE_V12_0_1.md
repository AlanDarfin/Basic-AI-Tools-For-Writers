# Basic 12.0.1 · Android Ribbon, Menus & Settings

**Requer Obsidian 1.11.4+ — Desktop e Android.** Atualização de manutenção da 12.0.0; mantém o ID e os dados do Basic.

## Correções

- **Ações do ribbon:** novo botão **Basic: ações rápidas**, com ações funcionais de leitura, formatação, foco de tela, foco de pasta e integrações. Também inclui comandos individuais na paleta do Obsidian. O ribbon do Ultimate Toolkit original continua gerenciado por seu próprio plugin.
- **Mais opções no Android:** ações de painéis são encaminhadas após o primeiro menu fechar, para evitar a abertura e fechamento instantâneo de submenus nativos.
- **Marcador/Bookmark:** usa um comando disponível de Bookmarks quando registrado ou encaminha a ação nativa; fornece aviso em caso de painel alterado.
- **Modo de foco:** tela limpa com um botão sempre visível para sair, inclusive no celular.
- **Configurações reorganizadas:** páginas de Toolkit v12 e Suítes com opções de Escrita, Imagens, Tarefas, Privacidade, TTS, Sync, Unique Suite, Notion Suite, Number Suite e Longform Studio. Os novos controles foram removidos da antiga seção Arquivos e atalhos.
- **Pesquisa e navegação:** novos nomes de abas pesquisáveis, ícones consistentes, área de configuração mais compacta no Android e dados de usuário preservados.

## Recursos integrados — resumo

- Unique Suite: central de estudos, aulas, diário, lembretes e horários.
- Notion Suite: bancos Markdown com tabela, quadro, galeria, lista, calendário, timeline e gráfico, filtros e construtor visual.
- Number Suite: sumários, numeração hierárquica, contador visual de títulos e legendas.
- Longform Studio: edição contínua, revisão, busca, compilação e diagnóstico.
- Ultimate Toolkit: paleta de 65 ações, funções de leitura, foco, modelos, notas criptografadas individualmente.
- Visual Kit: lightbox, tamanho de imagens e anotações locais exportadas como novo PNG.
- Snailkit: Workbench de tarefas, captura, brainstorm e notas vinculadas.
- dropit, Syncthing Integration, Syncthing Manager, Obsidian Git e FIT: conexão com comandos de plugins instalados e execução manual; **não** há transporte ou sync embutido no Basic.

## Instalação

Atualize os arquivos **main.js**, **manifest.json** e **styles.css** no diretório do Basic em seu cofre e recarregue o Obsidian. Faça backup antes de substituir os arquivos, principalmente ao testar funções de sincronização de outros plugins.

**Guias:** [Português](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/SUITES_AND_INTEGRATIONS.pt-BR.md) · [English](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/SUITES_AND_INTEGRATIONS.en.md)

## Limites

As funções completas dos oito projetos originais **não foram incorporadas integralmente**. Criptografia de pastas, busca protegida, TTS bilíngue completo de PDF, HTML avançado e servidores próprios de Git/Syncthing/dropit continuam externos. O botão *Marcador* depende do Bookmarks do Obsidian ou da ação nativa daquele painel, e a interface deve ser verificada em aparelhos Android com diferentes versões do Obsidian.

---

**English:** Basic 12.0.1 adds a Basic-owned mobile quick-actions ribbon, delayed native sidebar actions to stabilize nested sheets, a bookmark command fallback, clean focus screen with visible exit control, and reorganized Toolkit/Suites settings. It documents all integrated community suite functions and their limits. Original Ultimate Toolkit ribbon handlers and remote sync transports remain owned by their corresponding plugins.
