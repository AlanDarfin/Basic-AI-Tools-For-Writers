# 7.0.3 — Rolagem horizontal das abas do Longform

Esta correção resolve o retorno indesejado da barra de abas para o início na lateral de Longform/projetos.

- Alternar de Relações para Sessões, Mapas, Galeria e outras abas não deve mais fazer a barra horizontal voltar à esquerda.
- Cada grupo — Escrita, Universo e Projeto — guarda sua própria posição enquanto a visualização permanece aberta.
- Antes, o código restaurava a posição quando os botões das abas ainda não existiam; o navegador limitava a rolagem a zero. Agora, a restauração acontece **depois** de criar os botões.
- Clicar novamente na aba ativa não recria o painel sem necessidade.
- Nenhuma alteração nos arquivos dos livros, Pandoc, permissões, layout responsivo ou tamanho dos botões no Android.

Foram adicionados testes que simulam a troca de abas e de grupos. Atualize `main.js`, `manifest.json` e `styles.css` juntos usando a release oficial.

[English](V7_0_3_RELEASE.en.md).
