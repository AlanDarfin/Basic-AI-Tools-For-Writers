# GitHub Actions — manutenção 7.0.1

Workflows ativos:

- `.github/workflows/ci.yml`: `npm ci` com lockfile, sintaxe e sincronização do bundle, testes (inclusive Pandoc/Android), CSS, versões, docs bilíngues e smoke test do ZIP.
- `.github/workflows/publish-release.yml`: valida tags estáveis `X.Y.Z` (sem `v`), testa, gera ZIP/checksums, atesta os arquivos e publica **somente** `main.js`, `manifest.json` e `styles.css` como anexos oficiais da release.

ZIP e checksums ficam como artefatos da execução do GitHub Actions e têm o prazo de retenção definido pelo GitHub. Releases anteriores, incluindo a 7.0.0, não são modificadas.

Passos para publicar: atualizar manifesto, package, lockfile, versions, READMEs, notas e testes; revisar PR e CI; mesclar; criar a tag no commit validado. O push da tag dispara automaticamente a release. Se já existir uma release com a mesma tag, o workflow preserva seus anexos.

**Segurança:** o Pandoc continua integrado; os alertas de sistema de arquivos e execução de processos podem persistir. Consulte [COMMUNITY_REVIEW.md](COMMUNITY_REVIEW.md).

**Proteção:** recomenda-se configurar ruleset da branch `main` exigindo o job `Full validation` e revisão. Esta configuração é administrativa e não é aplicada por estes arquivos.

**Histórico:** 32 workflows antigos/duplicados foram removidos na limpeza anterior à 7.0.0; permanecem disponíveis no histórico Git.
