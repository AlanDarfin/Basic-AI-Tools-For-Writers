# 8.0.1 — Dicionário, indexação e Longform

Atualização de manutenção da v8, sem alterar arquivos de livro, Pandoc ou ferramentas de escrita existentes.

## LanguageTool
- Nos menus de correção, **Ir ao erro** foi removido. Erros de ortografia permitem **Adicionar ao dicionário**, no Android e no computador.
- O dicionário é **local do Basic AI**, salvo nas configurações do plugin, sem tentar enviar palavras ao serviço do LanguageTool. A comparação ignora maiúsculas e minúsculas e usa a forma Unicode normalizada.
- Palavras adicionadas deixam de gerar novos avisos de ortografia e somem das sugestões já visíveis. Sugestões gramaticais que não sejam palavras isoladas não recebem esse botão.
- Em **Configurações → Revisão**, uma lista editável permite revisar ou remover palavras (uma por linha). O texto dos livros não é alterado.

## Longform
- A aba **Continuidade** foi removida da navegação do projeto e seu controle foi retirado das configurações.
- Os dados existentes dos capítulos e suas propriedades são preservados. Os outros recursos de análise estrutural não foram apagados.
- O grupo Projeto permanece com Projeto, Tarefas e Comentários (quando habilitados).

## Autocomplete
- Corrige a causa da indexação que parava depois de atingir 12 mil termos, muitas vezes antes de percorrer as notas disponíveis.
- O limite de termos agora é distribuído entre **todas as notas Markdown elegíveis**, evitando privilegiar as primeiras. Pastas excluídas continuam respeitadas.
- Notas muito longas contribuem com um trecho inicial limitado, em vez de serem omitidas. A contagem distingue arquivos elegíveis, indexados, falhas de leitura e amostras parciais.
- **Reindexar cofre**, orçamento de termos e informações do índice agora ficam em **Configurações → Escrita → Complementos**. O atalho na barra de ferramentas foi retirado.
- Os resultados de autocomplete continuam limitados à quantidade configurada de sugestões.

## Testes
Regressões para indexação de 592 notas, persistência do dicionário, comportamento do menu móvel/desktop e ausência da aba Continuidade. Arquivos de distribuição: `main.js`, `manifest.json` e `styles.css`.

[English](V8_0_1_RELEASE.en.md).
