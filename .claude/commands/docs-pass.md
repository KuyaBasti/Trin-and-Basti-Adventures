---
description: Run the docs pass (docs/README.md checklist) and ship it as a docs PR
---

Spawn the `docs-keeper` agent to sweep the documentation for: $ARGUMENTS
(if empty, everything merged since the last dated entry in
`docs/05-progress.md` — check `git log` against the log's newest date).

When it returns its changed-file list, review the edits for honesty (no
invented completion, gaps stated), then ship them as a `docs/` branch → PR →
merge, per the two-PR convention. Report the PR link and the entry added.
