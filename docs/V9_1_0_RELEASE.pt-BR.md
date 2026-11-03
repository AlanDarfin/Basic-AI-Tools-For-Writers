# Basic AI Tool for Writers 9.1.0

## Integrações

- **Soundscapes no desktop:** catálogo de rádios inspirado no projeto original, playlists com links do YouTube, biblioteca de áudio do cofre, controles na barra de status, volume, anterior/próximo e widget de homepage com seleção e imagem de prévia. A homepage permanece modular e os controles compartilham o mesmo estado.
- **Click Clack:** efeitos sonoros de digitação apenas no computador, com cliques gerados localmente, ajuste de volume e leitura de pacotes WAV compatíveis com o manifesto do plugin original. Configurações na área de escrita.
- **Flexplorer:** ordenação independente por pasta, ordem personalizada via Alt + arrastar, itens fixados e ocultos, padrões glob e novos menus contextuais sem criar outro explorador.

## Interface e manutenção

- O chat do assistente usa o padrão visual dos blocos de diálogo do Basic: balões por lado, cabeçalho compacto, caixa de escrita e respostas em Markdown.
- Campos de provedores, modelos e prompts foram uniformizados com o tema atual, inclusive em janelas estreitas.
- README inglês e português apresentam recursos e exemplos, enquanto o histórico de alterações fica em documentos próprios.
- Versões e pacote de JavaScript/CSS atualizados; testes específicos de v9.1 adicionados.

## Compatibilidade e limites

Os efeitos sonoros e a reprodução de rádio são exclusivos do desktop. O plugin mantém suporte ao celular em suas demais funções. A rádio utiliza conteúdo do YouTube e requer conexão; disponibilidade depende do player externo. Não há mídia de terceiros embutida. O explorador original é preservado e a ocultação de itens não remove arquivos. Todas as integrações usam implementações próprias inspiradas nos projetos de referência.

Antes de atualizar, faça backup dos dados do cofre e das configurações do plugin. Verifique o comportamento do player e dos esquemas de áudio no computador.