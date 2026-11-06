# Basic 12.0.4 — Barra do Surfing na homepage

**Requer Obsidian 1.11.4+ · PC e Android.** Atualização corretiva sobre a versão 12.0.3.

## Correções

- **Visual no estilo Surfing:** remove os botões Cofre / Web · Surfing. No computador, aparece uma barra única de endereço e pesquisa fixa no topo da homepage, com ícone, campo de endereço, atalho Enter e botão para abrir.
- **Somente quando Surfing estiver habilitado:** a barra não aparece apenas por estar instalado e é atualizada automaticamente quando o Surfing é ativado ou desativado.
- **Pesquisa do cofre mantida:** a busca por notas continua abaixo do título, com seus resultados fuzzy, caminhos, teclado e favoritos originais, sem compartilhar modo com a barra web.
- **Configurações organizadas:** o Basic não cria novas abas; exibe as opções do Surfing na página inicial quando ele estiver ativo.
- **Compatibilidade:** todos os favoritos da web, Spaces, perfis da toolbar e configurações anteriores são preservados. O widget de Favoritos da Web continua disponível mesmo sem Surfing.

## Instalação

Baixe o ZIP com os arquivos `main.js`, `manifest.json` e `styles.css` desta release. Copie para `.obsidian/plugins/basic-ai-tool-for-writers/` e recarregue o Obsidian.

A integração com Surfing exige o plugin original instalado e **ativado no computador**. No celular não aparece uma barra de navegador incompatível; a pesquisa local continua funcionando.

Esta atualização também inclui testes completos de regressão, build e CSS.
