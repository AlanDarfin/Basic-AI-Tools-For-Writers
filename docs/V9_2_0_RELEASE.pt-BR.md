# Basic AI Tool for Writers — versão 9.2.0

## Explorador e notas de pasta
- Favoritos integrados aos favoritos existentes da homepage, com ícone Lucide personalizável e **preenchimento total** nos arquivos favoritos.
- Prévia no explorador: desativado / somente Folder Notes / todas as notas e Folder Notes.
- A propriedade `description` da Folder Note aparece abaixo da pasta; edição por YAML ou pelo menu de contexto. Novas notas de pasta recebem essa propriedade.
- Resumos de notas comuns usam `description`, `summary` ou trecho inicial.

## Markdown interativo
- Blocos `columns`/`multi-column` com Markdown e layout responsivo.
- Bloco `progressbar`: progresso manual, dia/semana/mês/ano e intervalo personalizado; botões manuais com armazenamento local.
- Bloco `widgets`: relógio, citação, contador e countdown.
- Campos `meta-bind`, botões `meta-bind-button` e `INPUT`/`VIEW` no modo Leitura, vinculados a propriedades YAML sem JavaScript arbitrário.

## Zotero e citações
- Indexação local de notas de bibliografia do Zotero e arquivos `.bib` opcionais.
- Seleção de referências por busca na paleta e blocos `zotero`/`bibliography`.
- O widget de citações da homepage pode misturar citações manuais com destaques importados ou preferir Zotero; botão **Abrir referência**.
- Limite: não acessa diretamente dados privados do Zotero, Better BibTeX ou suas APIs. É necessário importar ou sincronizar notas/exportações para o cofre.

## Estilos e sessões
- Controles reversíveis de aparência das notas, títulos H1–H6, cores, parágrafos, citações, listas, perfis e CSS.
- Notas temporárias e da sessão em painel independente, fora do cofre até exportar para Markdown, sem exclusão automática de arquivos existentes.

## Manutenção
- Todos os módulos têm visibilidade própria e controles integrados ao menu de configurações.
- Manifest, package, lockfile, versões, bundle JS/CSS e README em ambos os idiomas atualizados.
- Testes de regressão e verificações de build adicionados.
- As integrações são implementações independentes inspiradas nos nove repositórios creditados; não são forks nem cópias 1:1.
