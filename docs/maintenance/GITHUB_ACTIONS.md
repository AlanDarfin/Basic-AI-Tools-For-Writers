# GitHub Actions — organização após a 7.0.0

A partir de 2026-11-01, o repositório mantém apenas dois workflows ativos:

- `.github/workflows/ci.yml`: sintaxe, fontes sincronizadas, suíte completa, CSS, versões, README bilíngue e ZIP de verificação para push na `main` e PRs para `main`.
- `.github/workflows/publish-release.yml`: valida uma nova tag estável sem `v`, equivalente ao manifest, e publica o ZIP com checksums sem substituir assets existentes.

## Histórico

Foram retirados 32 pipelines históricos/duplicados, inclusive o arquivo incorreto `release-beta.yml` que tentava publicar Alan's Offline Dictionary neste repositório.
Eles permanecem disponíveis no histórico Git anterior à limpeza, commit `6a557eb0f71fe7246bfa3f796c6027cdaa3a9aba`. Tags e releases antigas foram preservadas.

**Importante:** a versão 7.0.0 já está publicada e esta manutenção não altera o código ou assets dessa release.

## Proteção recomendada

A branch `main` atualmente não é protegida. Configure Settings → Branches / Rulesets para exigir o status `Full validation` e revisão antes de mesclar PRs. Isso exige permissões administrativas.

Uma próxima versão precisa atualizar `manifest.json`, `package.json`, `versions.json`, READMEs e testes antes de criar a respectiva tag.
