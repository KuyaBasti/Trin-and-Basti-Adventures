# Implementation pipeline

The build order, with exit criteria. Stages 0–2 are recorded retrospectively;
3+ are the roadmap. Don't start a stage before the previous one's exit
criteria pass.

## Stage 0 — Static album ✅ (July 2025)

Hardcoded photo array, together-timer, featured memory, clickable map
locations, Vercel deploy.

- **Exit criteria:** site live, 11 memories visible, timer ticking. ✅

## Stage 1 — Persistent uploads ✅ (2026-08-10)

Make the + button real: storage driver interface (local disk dev / Vercel Blob
prod), shared-password auth with HMAC session cookie, single-photo upload with
EXIF date/GPS autofill and client-side compression, photos served from a JSON
manifest instead of the hardcoded array.

- **Exit criteria:** upload → refresh → photo still there; wrong password
  rejected; non-image rejected; production build clean. ✅ all verified locally
  via curl + browser.
- **Superseded:** the single-photo modal (`AddPhotoModal.tsx`) was replaced in
  Stage 2 before ever shipping. The drivers, auth, and compression carried
  forward unchanged.

## Stage 2 — Memories model + bulk import ✅ (2026-08-12)

Restructure for hundreds of photos: a memory holds a day's photos under one
description. Bulk import groups selected files by EXIF day, prefills date +
reverse-geocoded location, uploads one photo per request, then creates each
memory from the stored URLs. Lightbox gallery with keyboard + swipe.

- **Exit criteria:** a multi-day batch groups correctly (verified: 4 files →
  3 days, same-day pair merged); date + location autofill from real EXIF;
  memories persist across reload (14 memories / 15 photos); lightbox navigates
  (1 of 2 → 2 of 2, thumbnails, Esc); production build clean. ✅
- **Learned:** Vercel's 4.5MB body cap forced the two-phase API — a 12-photo
  memory in one request would have failed only in production. StrictMode
  double-invoke caught an impure setState updater.

## Stage 3 — Ship ✅ (2026-08-13)

Shipped as PRs #1 (feature + docs) and #3 (Next.js 15.3.5 → 15.5.23 — Vercel
refuses to deploy CVE-carrying Next versions, which had silently kept
production on a 385-day-old build). Blob store `adventures-photos` (SFO1,
Public) + `ALBUM_PASSWORD` configured; deploy promoted in ~20s.

- **Exit criteria, actual result:** the Blob driver seeded and then served the
  manifest in production, and Basti imported a real memory through the live
  site ("In N Out", EXIF date + GPS location autofilled, photo stored in
  Blob). Import device not recorded, so the mobile-Safari/HEIC case may
  remain unexercised — carried as a casual check, not a blocker.

## Stage 4 — Manage ✅ (2026-08-13)

Landed in two parts: merge-on-import + cover picker (PR #5), then edit /
remove-photo / delete-memory (PR #7), each hardened by an adversarial review
before merge (9 and 14 confirmed findings respectively — see
[05-progress.md](05-progress.md) for the notable ones).

- **Exit criteria, actual result:** a typo is fixable and a photo removable
  from the site on any unlocked device, no manual JSON — verified in the
  browser (text edit with date re-derivation, on-disk cleanup on
  remove/delete, last-photo guard, idempotent delete, safe back-out from
  every confirm).

## Stage 5 — Mobile pass ✅ (2026-08-13)

Landed as PR #9: real Tailwind v4 (the old pipeline silently generated
nothing), all eight components on responsive classes, desktop pixel-parity
held via a documented parity layer in `globals.css`.

- **Exit criteria, actual result:** at 375px the album, import modal, and
  lightbox all fit with zero horizontal scroll; 768px two-column; ≥1024px
  measured pixel-identical (48px/500px/1200px). Inputs ≥16px on mobile so
  iOS Safari never zooms. A 16-agent parity review confirmed 14 invisible
  divergences (heading weight, line-height, box-sizing) — all fixed.

## Stage 6 — Polish ✅ (2026-08-14) — roadmap complete

Landed as PR #11: seed PNGs → 2400px q85 JPEGs (47MB → 3.9MB; ~1.1–1.5MB
each, not the estimated 250KB — grainy fair-ground photos compress worse,
still a 12× cut), `.png`→`.jpg` rewrites protecting the live manifest's
URLs, `icon.svg` favicon, 1200×630 OG/twitter images, `metadataBase`,
real description.

- **Exit criteria, actual result:** hero loads visibly faster (the 15MB
  optimizer source is gone); OG tags verified in served HTML with correct
  dimensions. The iMessage unfurl itself is checked the first time Basti
  texts the link — nothing left to build for it.
