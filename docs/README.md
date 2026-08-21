# Docs hub

The knowledge layer between [`CLAUDE.md`](../CLAUDE.md) (always loaded, routes
you to a surface) and the code itself.

Use it when:

- `CLAUDE.md` told you *where* to go, but you need the behavior context first.
- You want invariants, data flow, or settled decisions before editing.

## Read order

1. [`../SYSTEM-DESIGN.md`](../SYSTEM-DESIGN.md) — the map: every component,
   how data flows, design decisions, stage status.
2. [`05-progress.md`](05-progress.md) — where things actually stand right now,
   and what's next.
3. [`01-implementation-pipeline.md`](01-implementation-pipeline.md) — the
   stages with concrete exit criteria.

## Topical companions

Read when working on that surface:

| Doc | Read before touching |
| --- | --- |
| [`02-data-model.md`](02-data-model.md) | Memory/Photo types, the manifest, storage drivers, seeds |
| [`03-import-spec.md`](03-import-spec.md) | import modal, EXIF, grouping, compression, geocoding |
| [`04-deployment.md`](04-deployment.md) | Vercel config, env vars, Blob store, anything ops |
| [`06-dream-roadmap.md`](06-dream-roadmap.md) | any future feature work — Stages 7–19 are specced there with exit criteria; check it before inventing a new direction |

## The ones that bite

Read these before touching upload or storage code — each one failed once
already, or fails invisibly until production:

- **`03` — one photo per request.** Vercel caps serverless bodies at 4.5MB. A
  memory's photos batched into one request works locally and fails only when
  deployed.
- **`03` — HEIC never reaches the server.** The stored file must be
  browser-renderable; the client re-encodes to JPEG. iOS Safari converts on
  file-pick, so this mostly matters for desktop drag-ins.
- **`02` — the seed file only seeds.** After first read, `memories.json` is
  the truth. Editing `seed-memories.ts` on a live album does nothing — a
  confusing no-op if you forget.
- **`03` — setState updaters must stay pure.** StrictMode double-invokes them;
  an array push inside one produced "the date and location and date and
  location" in the autofill notice.
- **`02` — dates format in UTC.** Parsing a bare `YYYY-MM-DD` gives UTC
  midnight; formatting it locally shows the previous day anywhere west of
  Greenwich.

## End-of-session docs pass

Docs drift the moment code lands. At the end of each working session — and
after any commit that changes behavior — sweep and make them match reality:

1. **`05-progress.md`** — a dated log entry: what shipped, what was decided,
   what was learned (especially anything verified or disproven in the
   browser).
2. **`01-implementation-pipeline.md`** — mark stages ✅/⬜, move the "(next)"
   marker, record actuals against the exit criteria.
3. **`../SYSTEM-DESIGN.md`** — component inventory statuses, build-stages
   table, flowchart nodes, any design decision the work changed.
4. **`../README.md`** — status blockquote, project-status table, quickstart.
5. **Topic docs (02–04)** — if the implementation diverged from the spec, fix
   the spec or record why.
6. **`../CLAUDE.md`** — new conventions or guardrails discovered along the
   way.

**Be honest about gaps.** If something wasn't built or wasn't verified, say so
with the reason — never leave a doc implying it exists. A stale doc is worse
than no doc.

**Docs ship in their own PR, separate from code, merged after it.** A major
change is two PRs by convention: the code PR, then the docs PR that records
it.

## Principle

Keep `CLAUDE.md` concise routing.
Keep `docs/` explanatory and query-friendly.
Keep code as the final source of truth.
