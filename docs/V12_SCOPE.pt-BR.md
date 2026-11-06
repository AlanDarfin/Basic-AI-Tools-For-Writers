# Basic v12 — Cobertura, compatibilidade e limitações

**Estado:** implementação inicial em branch de revisão. A v12 não incorpora integralmente o código ou todas as funções dos oito projetos. Nenhum código de terceiros foi copiado para o Basic.

## Arquitetura

- Uma função, um responsável: reutilizar IA, TTS, Longform, Spaces, explorador, formatação, imagens e recursos de escrita já presentes no Basic.
- Configurações isoladas em v12Toolkit, e comandos novos com prefixo v12. Nenhuma alteração involuntária de notas, nem sync automático por padrão.
- Os comandos externos aparecem apenas para projetos instalados e ativos. Selecionar um provedor de sincronização controla apenas o despacho **manual do Basic**, sem desligar agendamentos dos próprios plugins.
- Ocultar itens do explorador não representa criptografia nem controle de acesso.

## Matriz por plugin

| Projeto | Entregue pelo Basic v12 | Ainda não integrado |
| --- | --- | --- |
| [Ultimate Toolkit](https://github.com/ahmdmusa/obsidian-toolkit) | Paleta pesquisável de formatação, callouts, listas e divisores; lightbox; controle de largura de imagens; foco temporário por pasta; reaproveitamento da IA e TTS existentes | Cofres de pasta AES/PBKDF2, proteção do índice, TTS bilíngue de PDF/HTML, streaming SSE completo, HUD completo do Live Preview, bloqueio de emergência |
| [Visual Kit](https://github.com/pedrohf-dev/visual-kit) | Normalização de largura dos embeds selecionados; descoberta de comandos externos quando instalado | Anotador de imagens, editor HTML, colagem rica, deduplicação de arquivos binários; a versão original é desktop-only |
| [Snailkit](https://github.com/arnaudgastelblum/snailkit) | Navegação por tarefas Markdown; criação de brainstorm; reaproveita Home, calendário, slash e busca existentes | Workbench integral, coluna/outline especial e exportadores próprios |
| [dropit](https://github.com/smart-kits/dropit-obsidian) | Captura local na pasta Inbox e descoberta de comandos do plugin | Pareamento, transporte entre aparelhos, inbox remoto, recepção automática e processamento por CLI |
| [Syncthing Integration](https://github.com/LBF38/obsidian-syncthing-integration) | Ponte para os comandos instalados; inspeção local de nomes de conflito | Servidor/cliente de sync próprio, operações remotas de dispositivos |
| [Syncthing Manager](https://github.com/gustjose/obsidian-syncthing-manager) | Ponte manual e visor de arquivos de conflito sem modificá-los | Controle completo de Syncthing, versionamento, comparação/mescla avançada e edição de ignorados |
| [Obsidian Git](https://github.com/Vinzent03/obsidian-git) | Comandos de plugin externo disponíveis na central, mediante clique | Implementação própria de Git, push/pull automático, histórico e diffs completos |
| [FIT](https://github.com/joshuakto/fit) | Comandos externos na central, seleção explícita do provedor | Transporte de GitHub integrado, autenticação e resolução de conflitos |

## Comandos

- Toolkit: central de integrações.
- Sincronização: abrir central (seleção de um entre quatro provedores e execução manual).
- Formatar: paleta unificada.
- Imagens: padronizar largura na seleção (prévia e confirmação).
- Tarefas: localizar em notas (leitura de 25–1000 notas, limite configurável).
- Captura: guardar na Inbox local.
- Ideias: criar brainstorm local.
- Explorador: focar pasta da nota; Explorador: mostrar todas as pastas.
- Modelos: inserir estrutura pronta (modelos locais, não geração por IA).

## Segurança

A v12 não faz novas chamadas de rede, não armazena segredos de sincronização e não inclui um motor de criptografia. Captura e brainstorm gravam novos arquivos Markdown somente após a ação do usuário. Conflitos Syncthing podem ser abertos para inspeção textual, mas não são apagados ou mesclados. O foco em pastas é um filtro puramente visual. Backups independentes são recomendados antes de testar sincronizadores.

**Não ative agendamentos concorrentes de Git, FIT ou Syncthing no mesmo cofre.** A seleção do Basic não controla os agendamentos dos plugins originais.

## Verificação

- [x] Fontes adicionadas ao build e módulos registrados.
- [x] Testes de unidade novos para formatação de links, tarefas, configuração e registro de comandos escritos.
- [ ] CI GitHub: compilação, checagem do bundle e regressões.
- [ ] Testes reais do Obsidian desktop e Android.
- [ ] Testar ícones, acessibilidade, temas e convivência com Spaces, Flexplorer e plugins externos.

A paridade total com os oito projetos não está concluída. Esta tabela descreve intencionalmente o que realmente foi implementado e o que ainda depende dos plugins originais.
