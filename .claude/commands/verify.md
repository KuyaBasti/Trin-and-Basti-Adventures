---
description: Prove the current state — typecheck, clean build, API guards, suite if present
---

Spawn the `album-verifier` agent on the current working state, scoped to:
$ARGUMENTS (if empty, everything the working diff touches; if the diff is
clean, run the full sequence as a health check).

Relay its evidence table verbatim. If anything failed, diagnose from the
source, fix it, and run /verify again — do not report a failure as done.
