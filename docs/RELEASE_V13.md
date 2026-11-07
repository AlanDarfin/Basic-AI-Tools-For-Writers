# Basic 13.0.0 — Fundação visual unificada

A v13.0.0 estável consolida o novo sistema de interface do Basic, mantendo a estrutura existente das notas e exigindo **Obsidian 1.11.4 ou superior**.

## Melhorias

- **CSS otimizado:** análise de 333 seletores reincidentes e remoção de 106 declarações comprovadamente redundantes em 52 seletores, sem alterar os estilos responsivos intencionais.
- **Interface unificada:** tokens de cor, foco, espaçamento e bordas integrados às Configurações, Homepage, Longform, Spaces, Timeline e widgets.
- **Comandos:** seletor acessível unificado entre toolbox e toolbar, com pesquisa e navegação por teclado.
- **Responsividade:** ajustes para Android, telas compactas, barra nativa Surfing, Dragger e rolagem horizontal de Timeline.
- **Correção da Timeline:** os textos de data e título agora normalizam `<br>`, `<br/>` e `</br>`, impedindo que essas marcas sejam exibidas literalmente. Eventos contendo apenas data/título deixam de reservar um rodapé vazio; Markdown mantém quebras válidas.
- **Higienização:** constantes e callbacks comprovadamente não utilizados removidos; referências dinâmicas preservadas por segurança.
- **Qualidade:** 112 conjuntos de testes de regressão, auditoria CSS/DOM e verificação do pacote de distribuição.

## Instalação ou atualização manual

1. Faça backup das configurações e da pasta do plugin.
2. Baixe os três arquivos **main.js**, **manifest.json** e **styles.css** nos Assets desta release.
3. Coloque-os em `.obsidian/plugins/basic-ai-tool-for-writers`, substituindo os arquivos anteriores.
4. Recarregue o Obsidian e reative o Basic.

O ZIP offline e os checksums SHA-256 são produzidos como artefatos pelo workflow de publicação, enquanto a release do GitHub preserva os três arquivos suportados pelo Obsidian. O código do plugin mantém o formato de notas/arquivos e as configurações dos módulos.

## Documentação e feedback

- [Auditoria técnica v13](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/V13_UI_AUDIT.pt-BR.md)
- [Checklist visual](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/V13_QA_VISUAL.pt-BR.md)
- [PR #122](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/122)

A validação automatizada não equivale a todas as combinações possíveis de dispositivos e temas externos. Problemas residuais devem ser registrados no GitHub Issues com captura, tema e versão do Obsidian.
