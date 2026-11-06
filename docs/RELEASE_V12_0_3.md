# Basic 12.0.3 — Pesquisa web e Favoritos da Web

**Requer Obsidian 1.11.4+ · PC e Android.** Atualização compatível com os dados, notas, perfis e Spaces existentes.

## Novidades

- **Pesquisa no estilo Surfing:** a barra de busca existente da homepage agora alterna entre **Cofre** (fuzzy search das notas) e **Web** (busca online ou URL), sem criar uma barra extra.
- **Integração com Surfing (opcional):** quando o Surfing está instalado e ativo no PC, os resultados abrem em suas abas. Sem Surfing, o Basic usa o Web Viewer nativo (quando disponível) ou o navegador externo. No Android, usa o navegador do sistema.
- **Buscadores configuráveis:** padrão do Surfing, Google, DuckDuckGo, Bing, Yahoo e Wikipedia, com suporte ao buscador personalizado selecionado no Surfing.
- **Favoritos da Web:** novo widget opcional com cartões para links HTTP(S), nomes personalizados, grupos, ícones Lucide, editar, excluir com confirmação, reordenar e expandir a lista.
- **Salvar página atual:** comando para adicionar a página ativa do Surfing ou Web Viewer aos favoritos do Basic, sem modificar dados do navegador.
- **Opções na Página inicial:** configure buscador, modo Web e destino sem adicionar abas. Exibição e tamanho do widget seguem as preferências de cada Space.
- **Toolbar:** inclui a correção adicional para mostrar a toolbar flutuante apenas com texto efetivamente selecionado, preservando perfis de PC e celular.

## Segurança, compatibilidade e limitações

- Favoritos são salvos localmente nas configurações do Basic; não importam ou sincronizam automaticamente bookmarks do Surfing, Chrome ou Firefox.
- URLs são validadas para HTTP(S), com bloqueio de esquemas perigosos. Não são feitas visitas automáticas aos sites dos favoritos.
- O Surfing não é uma dependência obrigatória; no celular permanece o navegador externo.
- Novos testes de regressão cobrem a busca, fallback, validação e persistência de favoritos, e a CI inclui build do `main.js` e `styles.css`.

## Instalação

Baixe **basic-12.0.3.zip** ou os três arquivos **main.js**, **manifest.json** e **styles.css** do lançamento oficial. Extraia/copiei os arquivos para a pasta do plugin `basic-ai-tool-for-writers` no cofre, mantendo o identificador e suas configurações. Recarregue o Obsidian e habilite o plugin se necessário.

**Importante:** o widget começa oculto. Abra a homepage, clique em **Adicionar widgets** e ative **Favoritos da web**. Para ajustar a busca, acesse **Configurações → Página inicial**.
