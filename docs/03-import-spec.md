# Import spec

How a camera-roll multi-select becomes memories. The client does everything
except store bytes and append to the manifest.

## Phases (`ImportModal.tsx`)

`password → pick → reading → review → uploading`

1. **password** — shown only if `GET /api/auth` says this device has no valid
   session cookie. One shared password; cookie lasts a year.
2. **pick** — `<input type="file" accept="image/*" multiple>`.
3. **reading** — `buildDrafts()` (`src/lib/grouping.ts`) reads every file's
   EXIF with progress. Pure logic lives in `grouping.ts`, phase state in the
   modal.
4. **review** — one draft card per day: date (editable), title, location,
   description, category, include-toggle, preview strip (first 12 thumbs).
5. **uploading** — per-photo progress bar; on completion the modal closes and
   the album updates in place.

## EXIF extraction (`src/lib/client-image.ts`)

- `exifr.parse(file, { tiff, exif, gps })`.
- Date: `DateTimeOriginal` → `CreateDate` → `ModifyDate`, read as **local
  time** (camera timestamps are local to where the photo was taken; no UTC
  shift).
- GPS: `latitude`/`longitude` when present.
- Screenshots and edited exports often have no EXIF — that's not an error;
  they land in the **undated** group, which requires a hand-set date before
  import.

## Day-grouping (`src/lib/grouping.ts`)

Bucket key = the EXIF calendar day (`YYYY-MM-DD`), or `undated`. Days sort
ascending, undated last. Each bucket becomes one `Draft`; the memory's map pin
comes from the first photo in the day that carried GPS (`coordsOf`).

Verified 2026-08-12: 4 files (two sharing a day) → 3 drafts, same-day pair
merged, chronological order.

## Reverse geocoding

Nominatim (`nominatim.openstreetmap.org/reverse`, zoom 16), assembled as
`spot, city, state` from the address parts. Constraints, per their usage
policy and our own UX:

- **1 request per second** — drafts are geocoded sequentially with a 1.1s gap,
  *after* the review screen is already interactive.
- **3s timeout, best-effort** — failure leaves the field blank; it never
  blocks or errors an import.
- Only fills a location field the user hasn't already typed in.

## Compression (`compressImage`)

Canvas re-encode before upload: longest edge **2400px**, **JPEG q0.82**,
`createImageBitmap(file, { imageOrientation: 'from-image' })` so the EXIF
orientation flag is baked in (portraits would otherwise arrive sideways once
metadata is stripped). Measured: 16.5MB PNG → 759KB.

HEIC: `createImageBitmap` can't decode it on most desktop browsers — the
compress call rejects with a clear "use JPEG or PNG" message. iOS Safari
converts HEIC→JPEG at file-pick, so phones are unaffected.

## Upload protocol

**One photo per request.** Vercel serverless caps request bodies at **4.5MB**;
this fails only in production, never in dev — do not batch.

1. N × `POST /api/upload` (multipart, one file) → `{ id, src }`.
   Server validates: session cookie, content type ∈ {jpeg, png, webp} (HEIC
   deliberately absent), size ≤ 4MB. Returns the stored URL.
2. Per day: `POST /api/memories` (JSON: title, location, takenAt,
   description, category, `photos: [{src, takenAt, lat, lng}]`) → the created
   `Memory`. Server assigns UUIDs, derives the pin, appends to the manifest.

## Failure modes

- **401 mid-run** (cookie expired): modal returns to the password phase;
  error says to re-enter. Already-uploaded images for the in-flight day are
  orphaned in storage (harmless; not referenced by any memory).
- **Interrupted batch:** memories already created stay; remaining days don't.
  Resume is manual — re-select the unimported days. Known gap; acceptable
  until a real multi-hundred import shows otherwise.
- **Impure-updater regression** (fixed 2026-08-10): autofill state must be
  computed *before* `setState` — StrictMode double-invokes updaters and a push
  inside one duplicated the notice text.
