# Basic 13.0.1 — Usabilidade em 720p, arraste e IA

Correções de interface para **1280×720**, janelas divididas e Android. Esta versão mantém os projetos, notas, Spaces e as chaves de API existentes.

## Mudanças

- Arraste dos blocos em desktop e toque prolongado no Android, sem alças invisíveis cobrindo botões.
- Grade da homepage responsiva à largura real do painel, redimensionamento de widgets e texto que não quebra letra por letra.
- Toolbar e painéis mais compactos, sem barras de rolagem horizontais desnecessárias.
- Navegação das configurações por categoria e seção, busca fuzzy com suporte a sinônimos, erros de digitação e acentos.
- Área de IA reorganizada: seleção de provedores, chaves ocultas, endpoints, conexão sob demanda, catálogo de modelos com pesquisa, seleção do modelo ativo e atalhos de uso para definições, tradução e assistente.

## Instalação

Baixe os arquivos `main.js`, `manifest.json` e `styles.css` da release e substitua-os na pasta do plugin no Obsidian. Reinicie ou recarregue o plugin. Faça um backup de `data.json` antes de atualizar.

## Validação e limites

O build, os testes automatizados e o pacote de distribuição são verificados no GitHub Actions. Os ajustes de gestos, temas e layout devem ser conferidos também no Obsidian real (PC 720p e Android); os testes automatizados não substituem essa inspeção.
