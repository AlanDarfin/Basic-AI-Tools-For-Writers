# Basic AI Tool for Writers — v4.0.0

**Lançamento estável da v4**, baseado na v4.0.0-rc.1 aprovada, sem adicionar novas funcionalidades depois da validação. Compatibilidade declarada: Obsidian 1.11.4 ou superior, desktop e mobile.

## O que há de novo na v4

### Interface modular
Em **Configurações → Basic AI Tool for Writers → Módulos**, escolha quais funções aparecem nos menus. É possível ocultar Tradução, Dicionário, Chat, Revisão/LanguageTool, Longform, Autocomplete, Variantes, Diff, snapshots, TTS, Unicode, modelos, menções, comentários, IA Wordwise e modo máquina de escrever.

Ocultar um recurso não apaga notas, prompts, preferências, comentários ou snapshots. Basta reativá-lo para voltar a utilizar.

### Longform e organização
- Arrastar capítulos e subcapítulos no desktop, mover por toque no Android e manter as setas de reorganização.
- Recuos visíveis para subcapítulos e preservação da rolagem durante a ordenação.
- Exibição compacta em painéis estreitos, abas e gerenciamento de projetos, notas, tarefas, comentários e compilação.
- Renderização apenas da aba ativa para evitar processamento de painéis ocultos.

### Assistência à escrita
- Revisão seletiva com Diff, perfis e proteção de sintaxe Markdown.
- Comandos individuais de formatação Markdown e ações de IA: disponíveis para configurar na barra móvel nativa do Obsidian.
- Menções a notas, comentários associados a trechos, variantes, autocomplete e modo máquina de escrever.
- LanguageTool com análise automática após pausa, limitação de requisições, descarte de respostas desatualizadas e análise por trecho em documentos grandes.

### TTS e diagnósticos
- Voz do sistema quando a API estiver disponível; opção neural online com consentimento explícito antes do envio do texto.
- Diagnóstico local da plataforma, versão, módulos, configuração do LanguageTool, disponibilidade de API de voz e status dos backups. Não exibe chaves de API nem envia solicitações externas.

## Instalação / atualização

1. Faça backup do cofre e das configurações.
2. Baixe o ZIP desta release e substitua **main.js**, **manifest.json** e **styles.css** em \`.obsidian/plugins/basic-ai-tool-for-writers/\`.
3. **Não substitua nem apague o data.json.**
4. Recarregue o Obsidian ou reinicie o plugin.
5. Personalize a interface na aba **Módulos**.

## Privacidade e limites

O LanguageTool automático só é executado enquanto a aba Revisão está aberta, conforme a configuração, enviando o texto analisado ao endpoint definido pelo usuário. A leitura neural online só é utilizada com autorização. O TTS nativo no Android depende da API exposta pelo WebView do Obsidian, mesmo que existam vozes instaladas no telefone.

## Estabilidade e histórico

- Base consolidada: **4.0.0-rc.1**, com suíte automatizada de testes, integração, compatibilidade de versões e integridade do bundle.
- Validação manual de Android e desktop: confirmada pelo mantenedor antes deste lançamento.
- Os arquivos ZIP e individuais desta release incluem checksums SHA-256.
- Versões anteriores e betas permanecem disponíveis em Releases. Para voltar atrás, restaure os três arquivos da versão desejada e o backup das configurações, se necessário.

**Próximas versões:** melhorias novas ficam para v4.1.0; a linha 4.0.x será reservada a correções.
