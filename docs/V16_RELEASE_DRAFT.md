# Basic V16 — rascunho de notas / draft release notes

Pré-lançamento em revisão no PR #176. O rascunho usa a versão 15.2.0 como base de atualização e retorno. A versão mínima é Obsidian 1.11.4. [PR #176](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/176)

## Português

- **Interface.** As regras de tipografia e largura ficam restritas aos editores e modos correspondentes. O espaço de rolagem no celular acompanha as barras visíveis. Cartões e ações da página inicial, Longform, Spaces e revisão gramatical se ajustam melhor a painéis estreitos.
- **Ativação e recarregamento.** O Basic cancela tarefas agendadas da inicialização, da barra de leitura e da página inicial ao desativar. O explorador restaura a visibilidade e os atributos dos itens que o Basic ajustou. As integrações opcionais iniciam uma vez por ativação.
- **Página inicial.** Exportar um rascunho rápido mantém cópias quando você troca de aba, continua editando ou fecha a página durante a gravação. Pesquisas e favoritos ignoram cliques repetidos enquanto a navegação está em andamento. A página limpa o cabeçalho do Surfing que montou antes de recriá-lo.
- **Integrações e tarefas.** Zotero e iCalendar param de iniciar novas etapas quando a operação perde a sessão que a iniciou. O LanguageTool preserva alterações mais recentes se uma gravação de conexão falhar. O painel de tarefas interrompe a busca substituída ao terminar o lote em andamento.
- **Longform e Spaces.** Longform preserva a posição dos separadores ao alterar capítulos e grava as mudanças de cada variante juntas. A troca de Space atualiza a interface pelo mesmo fluxo no painel e no dock.

### Atualização e retorno à 15.2.0

1. Salve as notas abertas e feche o Obsidian. Faça uma cópia do cofre, incluindo a pasta oculta `.obsidian`, e guarde os arquivos de instalação da 15.2.0. Mantenha a cópia privada, pois os dados do Basic podem conter credenciais e rascunhos. [Release 15.2.0](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/15.2.0)
2. Teste primeiro numa cópia do cofre. Na pasta `.obsidian/plugins/basic-ai-tool-for-writers/`, substitua juntos `main.js`, `manifest.json` e `styles.css` pelos três arquivos da mesma compilação. Preserve `data.json`, `longform-recovery.json`, `longform-recovery.previous.json` e os demais dados que já estiverem na pasta. No Android, use um gerenciador que mostre `.obsidian`. [Guia de instalação](GETTING_STARTED.pt-BR.md)
3. Abra o Obsidian e confira se o Basic está ativo em **Configurações → Plugins da comunidade**. Confirme suas preferências, projetos e rascunhos em **Livros: recuperar rascunhos**. Reinicie o Obsidian para confirmar que as preferências e a recuperação persistem.
4. Para voltar à 15.2.0, desative o Basic e feche o Obsidian. Guarde outra cópia dos dados atuais e restaure juntos os três arquivos de instalação da 15.2.0. Reabra o Obsidian e reative o Basic. Se precisar recuperar as preferências anteriores, use o `data.json` da cópia prévia depois de guardar o atual. Preserve as notas e os arquivos de recuperação criados desde a atualização e recupere o texto necessário antes de substituir qualquer arquivo de dados.

## English

- **Interface.** Typography and width rules are scoped to the relevant editors and modes. On mobile, scroll clearance follows the visible bars. Homepage cards and controls, Longform, Spaces, and grammar review adapt to narrow panes.
- **Activation and reload.** Basic cancels scheduled startup, reading progress, and Homepage work when disabled. Explorer items recover their previous visibility and attributes after Basic releases them. Optional integrations start once per activation.
- **Homepage.** Quick Draft export preserves copies when you switch tabs, keep typing, or close the page during a write. Search and bookmark controls ignore repeated clicks while navigation is pending. Homepage releases its mounted Surfing header before rebuilding it.
- **Integrations and tasks.** Zotero and iCalendar stop dispatching follow-up work when their originating session ends. LanguageTool preserves newer changes if saving connection settings fails. The task dashboard stops a superseded search after the current batch finishes.
- **Longform and Spaces.** Longform preserves divider positions during chapter edits and saves each variant's changes together. Space switching updates the UI through the same flow from the sidebar or dock.

### Upgrading and rolling back to 15.2.0

1. Save open notes and close Obsidian. Back up the vault, including the hidden `.obsidian` folder, and save the 15.2.0 install files. Keep the backup private because Basic data can contain credentials and drafts. [15.2.0 release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/15.2.0)
2. Test in a vault copy first. Under `.obsidian/plugins/basic-ai-tool-for-writers/`, replace `main.js`, `manifest.json`, and `styles.css` together with files from the same build. Keep `data.json`, `longform-recovery.json`, `longform-recovery.previous.json`, and any other existing plugin data. On Android, use a file manager that can show `.obsidian`. [Installation guide](GETTING_STARTED.en.md)
3. Open Obsidian and check that Basic is enabled under **Settings → Community plugins**. Check preferences, projects, and drafts in **Books: recover drafts**. Restart Obsidian to confirm that preferences and recovered drafts persist.
4. To return to 15.2.0, disable Basic and close Obsidian. Save another copy of the current plugin data and restore the three 15.2.0 install files together. Reopen Obsidian and enable Basic. If you need the earlier preferences, retain the current `data.json` before restoring the pre-upgrade copy. Preserve notes and recovery files created since the update and recover any needed text before replacing data files.

## Verificação antes da publicação / Pre-release verification

- Record the final commit and clean validation run for the three-file package. Run the build, bundle and CSS synchronization, JavaScript audit, regressions, community CSS lint, metadata checks, and package smoke test. [CI workflow](../.github/workflows/ci.yml)
- Exercise the update and rollback above with existing V15 preferences, projects, notes, and Longform recovery copies. Run fresh activation, repeated disable and re-enable, and restart in an isolated vault.
- Check Obsidian desktop at 1280×720 and in narrow split panes, and Android in portrait and landscape with the keyboard and native panels open. Cover light and dark themes, the Homepage, explorer and Spaces, Longform, grammar review, exports, and enabled companion integrations. Recheck Timeline after reconciling its independent PR. [Modernization roadmap](V16_MODERNIZATION_ROADMAP.md) · [Timeline PR #175](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/175)
