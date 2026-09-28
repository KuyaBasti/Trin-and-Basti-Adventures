---
description: Adversarial multi-agent review of the working diff (or a named target) before it ships
---

Run this repo's adversarial review over: $ARGUMENTS (if empty, the current
uncommitted working diff plus the full current versions of every changed
file).

1. Pick the 2–4 lenses that fit what changed — from: data-integrity,
   state-ux, security-api, destruction-safety, style-parity. Storage or
   API changes always get data-integrity; anything that deletes gets
   destruction-safety; styling gets style-parity.
2. Spawn one `album-reviewer` agent per lens, in parallel, each told its
   lens and the target.
3. For every finding returned, spawn a fresh `album-reviewer` whose job is
   to REFUTE that one claim by tracing the actual code. Only findings the
   refuter confirms (isReal) count.
4. Fix every confirmed finding, re-verify the fixes, and summarize: confirmed
   vs refuted counts, each confirmed finding in one line, and what was fixed.
   If a confirmed finding is deliberately not fixed, say why and record it as
   an accepted tradeoff in the docs pass.

Do not ship the change until this completes. An all-refuted review is a
pass, not a failure.
