# Basic 13.0.2 — Projetos legíveis e barra de status compacta

- Abas Escrita, Universo e Projeto mantêm palavras inteiras e rolam horizontalmente quando necessário.
- Em painéis estreitos, o título do capítulo ocupa uma linha própria; os controles ficam abaixo. Em painéis largos, o título usa reticências sem empurrar os controles.
- Barra de status com controles Basic reserva 64 px à esquerda para não alcançar os botões nativos; excesso de conteúdo rola dentro da barra.
- Sliders de volume e largura com a mesma trilha fina de 3 px e controle de 10 px. Ambos encolhem juntos e são ocultados em telas muito estreitas.
- O estilo de proteção da barra é removido ao descarregar o plugin.

Instale os arquivos main.js, manifest.json e styles.css dos Assets da release na pasta do Basic e recarregue o Obsidian.

Validação: build, auditoria CSS/DOM, suíte de regressão e lint. Não foi possível executar o navegador de teste neste ambiente (restrição de socket); a aparência no Obsidian real ainda requer confirmação.
