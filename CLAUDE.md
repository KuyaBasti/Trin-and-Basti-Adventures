# Trin and Basti Adventures

A photo album of Basti and Trinity's relationship, built as a gift. Memories —
a day or an outing with one description and many photos — are bulk-imported
with EXIF date/GPS autofill, stored in Vercel Blob (JSON manifest, no
database), and browsed as a chronological album with a lightbox gallery.

## Start Here

`docs/README.md` routes to the design and behavior documentation. Read the
relevant document before changing that surface; code remains the final source
of truth.

| Area | Location |
| --- | --- |
| Page composition, album state | `src/components/AdventuresPage.tsx` |
| Bulk import UI (password, grouping, review, progress) | `src/components/ImportModal.tsx` |
| Lightbox gallery | `src/components/Lightbox.tsx` |
| Cards, grid, filters, featured memory | `src/components/PhotoCard.tsx`, `PhotoGrid.tsx`, `FeaturedMemory.tsx` |
| Relationship timer | `src/components/Header.tsx` |
| Memory/Photo types, sorting, date + maps helpers | `src/lib/photos.ts` |
| Storage drivers (local disk dev / Vercel Blob prod) | `src/lib/storage.ts` |
| Password auth (HMAC session cookie) | `src/lib/auth.ts` |
| Client-side EXIF read, compression, reverse geocode | `src/lib/client-image.ts` |
| EXIF day-grouping for bulk import | `src/lib/grouping.ts` |
| API routes (auth, upload, memories) | `src/app/api/` |
| Seed memories (first-run only) | `src/data/seed-memories.ts` |
| Design docs, specs, progress log | `docs/` |
| Architecture and data flow | `SYSTEM-DESIGN.md` |

## Guardrails

- **This is a gift.** It must simply work when Trinity opens it. No feature is
  worth a broken album; verify changes in the browser before calling them done.
- **Keep the neutral design.** The grey/white look is a settled decision
  (2026-08-10) — the writing is the loudest thing on the page. Don't restyle,
  re-palette, or "romanticize" without an explicit ask. Layout and functional
  fixes are welcome.
- The manifest (`memories.json` in the storage driver) is the source of truth
  after first run. `src/data/seed-memories.ts` seeds it once; editing the seed
  later does nothing.
- Uploads are one photo per request (Vercel's 4.5MB body cap); a memory is
  created afterwards from the returned URLs. Never batch photos into one
  request.
- Photos are compressed client-side (longest edge 2400px, JPEG q0.82) before
  upload. HEIC never reaches the server — the client re-encodes to JPEG.
- If `ALBUM_PASSWORD` is unset in production, uploads are refused for everyone
  — never open. Dev fallback password is `letmein`.
- Reverse geocoding (Nominatim) is best-effort and rate-limited to 1 req/s.
  Never let it block an import; blank location is fine.
- Date strings are formatted in UTC (`formatDate`) so users west of Greenwich
  don't see the previous day. Camera EXIF dates are read as local time.
- No accounts, no multi-tenancy, no cloud beyond Vercel + Blob. Two users, one
  shared password.

## Workflow

- Feature branch → PR → merge, same as the other projects.
- **Docs ship in their own PR, separate from code, merged after it.** Every
  major merge is therefore two PRs: the code PR, then a docs PR carrying the
  docs pass for it. Trivial fixes may fold docs in, but the default is two.
- **Every merge that changes behavior gets a dated entry in
  `docs/05-progress.md`** — what shipped, what was decided, what was learned.
- When structure changes (new component, route, storage shape, dependency),
  update `SYSTEM-DESIGN.md` (inventory, flowchart, decisions) and `README.md`
  (status, repo map) in the same docs PR.
- End of every session: run the docs pass in `docs/README.md` so the docs match
  reality, and be explicit about gaps.

## Verification

- `npx tsc --noEmit` — typecheck (no test suite yet)
- `npm run build` — production build must stay clean. **Stop any running dev
  server first** — build and dev share `.next/`, and building underneath a
  live server corrupts it (`Cannot find module './NNN.js'`, 500s; fix is
  stop → `rm -rf .next` → restart).
- Browser-verify upload/import changes end-to-end via the dev server
  (`.claude/launch.json`, auto-port). Local storage writes to `.data/` and
  `public/uploads/` (both git-ignored).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Vercel hosting + Vercel Blob
storage · exifr (EXIF) · Tailwind v4 for layout (responsive classes; dynamic
values stay inline) — `globals.css` carries a **parity layer** pinning the UA
defaults the design depends on (heading weight, line-height, button font);
read its comment before touching preflight-adjacent styling.
