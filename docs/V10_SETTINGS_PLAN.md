# Plano para a v10 — Configurações / v10 Settings Plan

Este documento organiza a próxima versão principal do **Basic AI Tool for Writers**. A 9.3.0 fecha a integração funcional de Spaces, Flow e ordenação; a v10 deve priorizar a clareza, consistência e segurança das preferências, sem reinventar o explorador nativo.

## Inventário prioritário / Priority inventory

| Área / Area | Configurações / Controls | Objetivo / Goal |
| --- | --- | --- |
| Explorador / Explorer | Ícones, cores, títulos, favoritas, miniaturas, descrições, duração do toque, expansões | Evitar controles duplicados e manter Folder Notes separadas das prévias de notas |
| Flexplorer | Ocultar, fixar, ordenação, raiz, pastas, YAML, compatibilidade sorting-spec, arrastar, setas mobile | Cada recurso com chave própria; configuração por pasta e por Space |
| Spaces | Ativar, barra inferior, ícone de gerenciar, sidebar, perfis, pastas ocultas, fixados, ordem e widgets | Preferências globais e substituições locais previsíveis |
| Flow / Slash | Ativar, menu /, incorporação, edição inline, layouts, prévias, arrastar, limites | Cada recurso pode ser desligado sem desativar os demais |
| Pretty Properties | Capas, banners, ícones, campos ocultos, pesquisa, cores, tags, datas e progresso | Layout unificado e opções avançadas descobertas por pesquisa |
| IA e linguagem / AI & language | Provedores, segurança, gramática, tradução, prompts | Credenciais protegidas; módulos opcionais |
| Longform / Escrita | Projetos, navegação, ferramentas, atalhos, revisão | Agrupar ações por objetivo em vez de por versão de origem |

## Entregáveis da v10 / v10 deliverables

1. **Árvore de preferências única / One settings hierarchy:** Geral, Personalização, Escrita, Longform, IA, Integrações, Avançado e Diagnóstico, com subabas roláveis e busca fuzzy.
2. **Chaves independentes / Independent switches:** controles por módulo e por subfuncionalidade. Se uma função for desligada, escondê-la também dos menus onde isso não cria ações órfãs.
3. **Configurações por Space / Space-specific overrides:** uma preferência global fornece o padrão; um Space pode substituí-la sem modificar os demais; opção de reverter para o valor global.
4. **Migração e backup / Migration and backup:** migrar configurações antigas sem apagar preferências; exportar/importar JSON redigido sem segredos de API; restaurar uma seção sem redefinir todo o plugin.
5. **PT-BR/EN completo / Complete bilingual UI:** traduções de cada rótulo, descrição, modal, tooltip, aviso e fallback; sem texto cortado ou botões inacessíveis em 720p e Android.
6. **Performance e testes / Performance & tests:** alterações visuais sem reconstruir views desnecessariamente; verificações de schema, migração, conflitos de atalhos, timers e observadores; check automatizado de bundle e CSS.
7. **Acessibilidade / Accessibility:** navegação por teclado, tamanho mínimo de toque, foco visível, ordem de tabulação e contraste adequado ao tema.

## Critérios de conclusão / Exit criteria

- Nenhuma opção apresentada sem função correspondente e nenhum recurso importante sem controle.
- Sem duplicar o explorador, reescrever Markdown por causa de decoração ou modificar arquivos ao esconder itens.
- Os arquivos `main.js`, `styles.css`, `manifest.json` e a documentação PT/EN passam na verificação de sincronização, testes e publicação.
- Testes manuais em Android e desktop, incluindo cofres grandes, fontes diferentes, tema claro/escuro e espaços alternativos.

## Notas de escopo / Scope boundaries

O suporte a `sorting-spec` na 9.3.0 é parcial e opcional: não pretende reproduzir toda a gramática do plugin Custom File Explorer Sorting. O Flow ainda não substitui a edição estrutural completa do Make.md. A v10 deverá tornar essas limitações explícitas na interface de configurações.
