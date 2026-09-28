---
description: The full ship ritual — verify, branch, code PR, merge, docs pass, docs PR, prod check
---

Ship the current work: $ARGUMENTS (a short description of what this change
is; infer from the diff if empty).

Follow the CLAUDE.md workflow exactly:

1. Spawn `album-verifier`; proceed only on all-PASS. If the change is
   substantive (new endpoint, storage change, anything destructive), run
   /review first if it hasn't run.
2. Feature branch (`feat/`, `fix/`, `docs/`, or `tooling/` prefix), one
   commit with a plain, specific message explaining what and why. Push,
   open the PR, merge it. Target: `main` on the main line, or the
   experiment branch in the lab repo when working on the mayhem line —
   never mix the two.
3. Docs pass: spawn `docs-keeper` for the merged change, then ship its file
   edits as the separate docs PR and merge it (two PRs per major change —
   the convention; trivial fixes may fold docs in).
4. If the merge deploys production (main line only): poll the live site
   until the change is observable, verify the album is intact
   (`/api/memories` returns and counts match), and report evidence.
5. Report: PR links, what was verified, and anything honest that remains.
