# Progress log

Living record of what's shipped. Newest first — one dated entry per commit or
coherent chunk of work. Keep it honest: unverified is unverified.

## 2026-08-14 — Stage 6 complete: polish (PR #11) — roadmap done

The three pre-pipeline seed PNGs (15–17MB each — the only files that never
went through the compressor) became 2400px q85 JPEGs: 47MB → 3.9MB. The
live manifest references the old `.png` paths, so `next.config` rewrites
map them to the new files — no data migration; verified through direct
requests and `/_next/image`. Added `icon.svg` (dark tile, serif T·B),
1200×630 `opengraph-image`/`twitter-image` from MainPic, `metadataBase`,
and a real description — a texted link now unfurls a photo card.
Housekeeping: Vercel's bot PR #2 (CVE patch) closed itself after the Next
upgrade merged.

## 2026-08-13 — Stage 5 complete: mobile pass on real Tailwind v4 (PR #9)

The album now fits Trinity's phone: 375px gets a 30px title, one-column
grid, and zero horizontal scroll across page/modal/lightbox; 768px is
two-column; desktop ≥1024px is pixel-identical to production (48px title,
500px hero, 1200px content column). All eight components migrated from
inline styles to responsive classes.

**Discovery:** Tailwind never worked in this repo. The v4 postcss plugin
silently drops v3's `@tailwind` directives, so since July the site rendered
under browser UA defaults — no preflight, no utilities. Enabling real
Tailwind therefore changed global defaults invisibly: headings lost their
UA bold, line-height grew from `normal` to 1.5, box-sizing flipped to
border-box. A 16-agent style-parity review confirmed **14 divergences**
(0 refuted), all fixed: a documented parity layer in `globals.css`
restores heading weight / UA line-height / button + placeholder defaults;
containers use `box-content` + 15px gutters for the exact 1200px content
width; an accidental subtitle cap, hover lift, and 92vh modal height were
reverted; lightbox edit inputs are 16px below `lg` so iOS Safari doesn't
zoom on focus. One deliberate divergence, documented in the CSS: the old
8px UA body margin (an accidental white frame) stays removed.

Dead weight dropped: tailwindcss v3, autoprefixer, framer-motion.
Lesson: verifying *sizes* isn't verifying *parity* — weight, line boxes,
and box-sizing all drifted invisibly until reviewers diffed the removed
inline styles property by property.

## 2026-08-13 — Stage 4 complete: edit, remove photo, delete memory (PR #7)

The last management gap: typos and mistakes are now fixable on the site
itself, never by hand-editing JSON. `PATCH /api/memories/[id]` gained text
fields and `removePhotoIds`; a new `DELETE` removes a memory. The lightbox
grew an Edit panel (prefilled, sends only changed fields), a two-step
remove-photo confirm, and a double-confirmed delete that spells out the
photo count. Stored images are cleaned up best-effort after the manifest
write is durable; seed assets in `public/` are structurally untouchable.

A 19-agent adversarial review confirmed 14 findings, all fixed pre-merge.
The one worth remembering: **`isOwnSrc` checked hostname only, and the
manifest lives on the same host** — a crafted photo src naming
`memories.json` would, on deletion, have destroyed the whole album and
reset it to seeds. It now requires the `/memories/` path prefix. Also:
files are deleted only when the freshly written manifest no longer
references them (remove+re-add, shared srcs); strict `YYYY-MM-DD`
round-trip dates (loose ones corrupt the localeCompare chronology);
retried DELETE is a no-op success; while editing, every close/navigation
path is inert so unsaved edits can't be lost.

Accepted-tradeoff note: the documented cross-instance last-write-wins race
now includes best-effort image deletion — a delete racing a concurrent edit
on another device can resurrect a memory whose files are gone. Accepted at
two users; recorded in SYSTEM-DESIGN's decisions table.

## 2026-08-13 — workflow decision: docs ship as their own PR

Adopted the FinancialTracker convention verbatim: every major change is two
PRs — the code PR, then a docs PR carrying the docs pass for it. Recorded in
`CLAUDE.md` (Workflow), `docs/README.md` (docs pass), and the post-commit
reminder hook in `.claude/settings.json`. Trivial fixes may fold docs in;
two is the default.

## 2026-08-13 — merge-on-import + cover picker (Stage 4 begins)

Basti's ask: clicking a memory should reveal the *other* photos from that
day, with a chosen main image. The gallery already existed; what was missing
was getting photos INTO an existing memory and choosing its cover. Built:

- **Merge-on-import**: a day that matches exactly one existing memory
  defaults to joining it (dropdown to opt out or to pick among multiple
  same-day memories — ambiguous days default to a separate memory). Merged
  drafts need no writing; they inherit the day's story.
- **`PATCH /api/memories/[id]`** — `addPhotos` and/or `coverId`.
- **Cover picker** in the lightbox ("Make this the cover", ★ on the cover
  thumbnail), shown only on unlocked devices.

A 14-agent adversarial review of the diff confirmed 9 findings, all fixed
before merge; the notable ones:

- **Retry-after-partial-failure duplicated data** (high): committed drafts
  now leave the retry set, partial successes flush to the page, and the
  server skips photos whose stored URL the memory already has — a retried
  import is now idempotent (verified by identical double-PATCH).
- **Manifest write races**: all writers now go through a serialized
  `updateManifest`; closing the modal mid-upload is blocked; cross-instance
  last-write-wins remains as documented.
- **Merging re-sorted existing photos**, silently flipping the implicit
  cover: PATCH now pins the current cover and appends instead of re-sorting.
- **Any URL could be persisted as a photo src** (and next/image's
  `*.public.blob.vercel-storage.com` allowlist matches every Vercel
  customer's store): both write routes now accept only this app's own
  storage URLs (`isOwnSrc`).
- Import is disabled until the album has loaded (unknown state used to skip
  merge detection → duplicate days); a stale-closure bug that hid the
  password screen on mid-import 401 is fixed; malformed JSON bodies now 400
  instead of 500.

## 2026-08-13 — Stage 3 complete: live in production, first real memory

After the Next upgrade merged, the deploy promoted in ~20s. Verified from the
API: 11 seed memories served, `configured: true` from the auth endpoint, and
the Blob driver's first production run seeded `memories.json` into the store.
Basti then imported the first real memory through the site — "In N Out",
July 1 2025, one photo, location "Phoenix, Arizona" resolved from GPS —
proving upload → compress → Blob → manifest end-to-end in production.
Setup that got us here: Blob store `adventures-photos` (SFO1, **Public** —
required, the app serves images by public URL; the read-write-token checkbox
must be ticked on connect) plus `ALBUM_PASSWORD`, then a redeploy.
Honest gap: not recorded which device the import came from, so iPhone
HEIC-on-mobile-Safari may still be unexercised. Not a blocker — iOS converts
HEIC to JPEG at file-pick — but worth a casual check next time a phone is
handy.

## 2026-08-13 — deploy blocked by Vercel, Next upgraded 15.3.5 → 15.5.23

Every production deploy since the merge errored *after* a successful build:
Vercel hard-blocks deploying Next.js versions with known CVEs, and 15.3.5 is a
year old ("Vulnerable version of Next.js detected"). Production kept serving
the 385-day-old static build, which is why the API 404'd. Upgrade to 15.5.23;
typecheck, build, and a dev-server smoke test (11 memories, 200s) all clean.
Lesson recorded: a Vercel deploy can fail *after* "Build Completed" — check
`vercel inspect --logs` for the post-build verdict, not just the build output.

## Where things stand

- **The roadmap is complete.** All six stages shipped between 2026-08-10 and
  2026-08-14: persistent storage, bulk import with EXIF day-grouping and
  same-day merging, cover selection, edit/remove/delete, the mobile pass,
  and polish (compressed seeds, favicon, link previews). The album is live
  at `anniversary-one-taupe.vercel.app`.
- **Design settled:** keeping the original neutral look; no redesigns.
- **What remains is content, not code:** Basti's photo backlog and the
  descriptions. Plus two optional odds and ends: a nicer domain name before
  sharing, and a casual iPhone import to tick off the HEIC check.

## Stage status

| Stage | Status |
|---|---|
| 0 Static album | ✅ done (July 2025) |
| 1 Persistent uploads | ✅ done 2026-08-10 (superseded by Stage 2) |
| 2 Memories + bulk import | ✅ done 2026-08-12, verified locally |
| 3 Ship | ✅ done 2026-08-13 — live, real upload verified in production |
| 4 Manage (edit/delete) | ✅ done 2026-08-13 |
| 5 Mobile pass | ✅ done 2026-08-13 |
| 6 Polish | ✅ done 2026-08-14 — roadmap complete |

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
