# 7.1.0 — Local LanguageTool rechecks after accepted suggestions

The first grammar review still analyzes the same source range as before. Once a suggestion is applied, Basic issues **one local LanguageTool request** for the edited sentence, falling back to the paragraph when sentence boundaries are ambiguous.

- Preserves cached suggestions and editor marks outside the changed scope.
- Rebases offsets after insertions and deletions so subsequent findings still point to the correct characters.
- Replaces only the findings in the changed scope, respecting ignored rules and Markdown masking.
- Prevents a redundant automatic grammar check triggered by the replacement itself.
- Leaves manual full review available.
- Detects concurrent edits and rejects stale responses rather than overwriting new content.
- Does not change Remember Cursor Position, Pandoc or Longform.

This reduces text transmitted and request latency after small corrections, while respecting the configured LanguageTool endpoint and its usage limits.

[Português](V7_1_0_RELEASE.pt-BR.md).
