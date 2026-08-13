# Progress log

Living record of what's shipped. Newest first — one dated entry per commit or
coherent chunk of work. Keep it honest: unverified is unverified.

## Where things stand

- **Stage 2 complete, locally verified.** Bulk import with EXIF day-grouping,
  memories-with-many-photos model, lightbox gallery, password-gated two-phase
  upload, client compression. Typecheck + production build clean.
- **Nothing deployed.** Stages 1–2 and this doc set are uncommitted; the
  Vercel Blob driver has never run in production; `ALBUM_PASSWORD` and the
  Blob store don't exist in the dashboard yet. **Stage 3 (ship) is next.**
- **Design settled:** keeping the original neutral look; no redesigns.

## Stage status

| Stage | Status |
|---|---|
| 0 Static album | ✅ done (July 2025) |
| 1 Persistent uploads | ✅ done 2026-08-10 (superseded by Stage 2) |
| 2 Memories + bulk import | ✅ done 2026-08-12, verified locally |
| 3 Ship | ⬜ **next** — commit, Blob store + env vars, phone-verified import |
| 4 Manage (edit/delete) | ⬜ |
| 5 Mobile pass | ⬜ |
| 6 Polish | ⬜ |

---

## 2026-08-13 — Stage 3 begins: first PR opened

Everything from 2026-08-10 onward — Stages 1–2 plus the doc set — goes up as
one PR to `main`. Pre-merge hardening: a production deploy *before* the Blob
store exists lands on the local-disk driver over a read-only filesystem, which
would have 500'd the album; the seed write now fails soft and serves the 11
seed memories read-only (verified locally against a chmod-555 `.data/`). Adopted the feature-branch → PR workflow from the other
projects (CLAUDE.md updated). Fixed the remote: origin now points at the
renamed `KuyaBasti/Trin-and-Basti-Adventures`. Remaining for Stage 3 after
merge: Blob store + `ALBUM_PASSWORD` in the Vercel dashboard, then a
phone-verified import on production.

## 2026-08-13 — Documentation set established

Created the full doc set mirroring FinancialTracker / DotaAnalysis:
`CLAUDE.md` (routing + guardrails + workflow), `SYSTEM-DESIGN.md` (flowchart,
import trace, inventory, decisions, stages), `docs/` 01–05, and this log.
Convention adopted going forward: **every behavior-changing commit gets a
dated entry here; structural changes also update SYSTEM-DESIGN and README in
the same sitting** (see the docs pass in `docs/README.md`).

## 2026-08-12 — Stage 2: memories model + bulk import + lightbox

Decided (over per-photo cards) after establishing the real volume is
*hundreds* of photos: a **memory = a day** — one title/location/description,
many photos. Rebuilt accordingly:

- `Memory`/`Photo` types, `memories.json` manifest, seeds rewritten as
  one-photo memories (`seed-memories.ts`).
- **Two-phase API**: N × `POST /api/upload` (one image each) then
  `POST /api/memories` (metadata + URLs). Forced by Vercel's 4.5MB body cap —
  a 12-photo day in one request would fail *only in production*.
- `ImportModal` (5 phases), `grouping.ts` (EXIF day-bucketing, undated last),
  sequential Nominatim geocoding at 1 req/s, non-blocking.
- `Lightbox` — arrows/Esc/swipe, thumbnail strip, scroll lock. Cards show
  cover + "+N more".
- **Verified end-to-end in the browser:** 4 files → 3 day-groups (same-day
  pair merged); autofilled "San Francisco, California" / "Napa County,
  California" from GPS; 14 memories / 15 photos after reload; lightbox
  1 of 2 → 2 of 2. A dark screenshot turned out to be a capture artifact —
  confirmed by sampling rendered pixels (~114/channel), not a real bug.
- Fixed: "1 photos" pluralization. Port 3000 conflict (DotaAnalysis API) →
  dev server auto-port.

## 2026-08-10 — design decision: keep the neutral look

Considered warm/literary, soft-romantic, and full-cheese directions; decided
to **keep the original grey/white design**. Rationale: the photos vary wildly
in color and the descriptions are the emotional core — neutral styling keeps
the writing loudest. Recorded as a guardrail in `CLAUDE.md`; functional/layout
work explicitly still welcome.

## 2026-08-10 — Stage 1: persistent uploads (superseded)

Made the + button real for single photos: `StorageDriver` interface (local
disk dev / Vercel Blob prod), `ALBUM_PASSWORD` auth (SHA-256 +
`timingSafeEqual`, HMAC session cookie, **fail closed in prod**), EXIF
date/GPS autofill, canvas compression (**measured 16.5MB → 759KB**), category
filter chips (previously dead code), map links to exact EXIF coords.

- Verified via curl + browser: bad password 401, no-session upload 401,
  non-image 415, persistence across reloads, EXIF date matched the hand-typed
  original exactly.
- Fixed: impure setState updater (StrictMode double-invoke duplicated the
  autofill notice) — compute before set.
- Storage decision: **Vercel Blob over Supabase** — Supabase free tier pauses
  after 7 idle days, fatal for an occasionally-visited gift; Blob is 1GB
  (~1,300 photos) and doesn't pause. Driver interface keeps the exit ramp.
- The single-photo `AddPhotoModal` this stage built was replaced two days
  later by the bulk `ImportModal`; everything beneath it survived.

## 2025-07-24 — adventures rename

Refactored the site identity from "Anniversary" to "Trin and Basti
Adventures" (`324367e`). GitHub remote still says `Anniversary.git` — known
gap.

## 2025-07-15 — content + timer era

Structure pass (`b2a3dba`); clickable map location on every photo
(`ec97b8e`); Trinity's Birthday (`d712995`); New Years with the Goods
(`d03e763`); Papago Park (`3bdd003`, `61d3f9b`); together-timer added and
iterated (`d52f1fe` → `9f7474e` → `0d75676`).

## 2025-07-12..14 — first build

Next.js scaffold, layout, photo array, Brunch Snob content, README. The
original static album that everything since builds on.
