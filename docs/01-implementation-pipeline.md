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

## Stage 4 — Manage ⬜ (next, alongside Stage 5)

Edit and delete for memories. At hundreds of photos a typo is guaranteed, and
today the only fix is hand-editing `memories.json`.

- Delete memory (and its Blob images); edit title/location/date/description;
  optionally re-cover.
- **Exit criteria:** fix a typo and remove a photo entirely from the phone,
  no manual JSON.

## Stage 5 — Mobile pass ⬜

The layout is desktop-only: inline `style={{}}` objects can't hold media
queries, so the 48px title and 500px hero render identically on a phone —
Trinity's primary device. Migrate to the already-installed Tailwind and make
type, spacing, and the grid responsive.

- **Exit criteria:** album, import, and lightbox all comfortable at 375px
  width; no horizontal scroll; hover-only affordances have touch equivalents.

## Stage 6 — Polish ⬜

- Compress the three 15MB seed PNGs (`MainPic`, `BrunchSnob`, `SFNight`) to
  ~250KB JPEGs.
- Favicon + OG image so a texted link renders a preview card instead of a
  blank grey box.
- Distinct `metadata` title/description.
- **Exit criteria:** first load under ~2s on cell data; link preview shows
  MainPic + title in iMessage.
