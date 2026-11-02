# Basic AI Tool for Writers 9.0.0

**Lançamento principal da v9 · Obsidian 1.11.4+ · Computador e Android**

A v9 reúne escrita, Longform, organização local, revisão gramatical, assistência por IA e ferramentas Markdown. O cofre continua sendo a fonte dos dados. Esta é a última grande atualização de funções planejada; depois dela, o foco será manutenção e adições menores.

## Novidades
- Calendário: mês compacto, dia, três dias, semana e agenda de 30 dias; painel interno, mini-calendário, categorias e próximos eventos; notas de eventos com recorrência, intervalos, data final e exceções individuais. **Sem sincronização com Google/CalDAV**.
- 27 ações de formatação inspiradas no cMenu, com botões configuráveis, ordem visual e posição acima/abaixo; ativa no PC e desligada no celular por padrão.
- Recursos inspirados no Make.md no explorador nativo: ícones Lucide, cores, visão de pastas e índices Markdown. Smart Spaces locais opcionais em lista, cartões, tabela ou quadro. **Não é um banco de dados/Flow completo do Make.md**.
- Homepage: título personalizável, imagem do cofre/HTTPS ou Lucide, relógio acima do calendário, pesquisa fuzzy e ações rápidas.
- Visual baseado nas variáveis do Obsidian e novo grupo **Personalização** nas configurações, com páginas separadas para Homepage, Barra, Explorador, Spaces e Calendário.
- Observador do explorador restrito ao painel de arquivos para reduzir processamento; interface em português brasileiro e inglês.

## Histórico desde a v1
O formato original do Alan's Offline Dictionary (`# palavra`, separador `---`) continua compatível com o leitor de dicionários Markdown. O identificador da v1 era `alans-offline-dictionary`; o atual é `basic-ai-tool-for-writers`. Como são IDs diferentes, **as configurações e os dados internos da v1 não são importados automaticamente**. Preserve as notas e faça backup das configurações antes de desinstalar o plugin antigo. Detalhes em `docs/V9_FINAL_AUDIT.md`.

## Compatibilidade e limites
As integrações são implementações próprias inspiradas em plugins da comunidade, não forks integrais. Créditos em `THIRD_PARTY_NOTICES.md`.
O CI verifica sintaxe, empacotamento, testes, CSS e metadados. Ainda é recomendável conferir no Obsidian real, especialmente Android, temas e coexistência com os plugins de origem. Se houver conflito, desative o módulo opcional em Configurações → Módulos.

## Instalação
Coloque os arquivos `main.js`, `manifest.json` e `styles.css` em `.obsidian/plugins/basic-ai-tool-for-writers/` e ative ou atualize o plugin. Faça backup do cofre e do `data.json` antes. Os projetos e notas permanecem em Markdown.

A v9 não apaga projetos anteriores nem exige remover plugins da comunidade. Credenciais e serviços externos de IA, LanguageTool e TTS continuam sujeitos às configurações e permissões individuais.
