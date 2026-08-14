# Trin and Basti Adventures — Our Photo Album

A photo album documenting Trin and Basti's adventures together, built as a
gift. It turns a camera roll into a story: photos are bulk-imported and grouped
into **memories** — a day or an outing with one written description and all of
that day's photos — using each photo's own EXIF date and GPS to fill in the
when and where. The album reads oldest-first, like the year it records, under a
live counter of how long we've been together.

There is no database and no third-party service beyond the hosting: images and
a single JSON manifest live in Vercel Blob, the browser does the heavy lifting
(EXIF, grouping, compression, geocoding), and one shared password lets the two
of us add memories from any device.

> **Status: live.** The album runs in production on Vercel + Blob storage,
> and the first real memory was imported through the site on 2026-08-13 with
> EXIF date and GPS location autofill working end-to-end. Next up: edit/delete
> for memories and the mobile layout pass. See
> [Project status](#project-status).

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [How It Works, End to End](#how-it-works-end-to-end)
3. [Repository Map](#repository-map)
4. [Design Principles](#design-principles)
5. [Project Status](#project-status)
6. [Quickstart](#quickstart)
7. [Documentation](#documentation)

---

## What It Does

- **Import** — press **+**, enter the shared password once, select as many
  photos as you like. They group themselves by the day they were taken; each
  day becomes one draft card with its date filled in and its location resolved
  from GPS. You write a title and one description per day — and photos from a
  day that already has a memory simply join it, nothing to write at all.
- **Choose the cover** — in any memory's gallery, "Make this the cover" picks
  which photo fronts the card.
- **Fix and prune** — edit any memory's title, place, date, or story; remove a
  photo (two-step confirm); or delete a whole memory (double-confirmed, photo
  count spelled out). All from the site, on an unlocked device.
- **Compress** — every photo is re-encoded in the browser before upload
  (longest edge 2400px, JPEG). A 16MB phone photo becomes roughly 750KB, which
  keeps everything inside free tiers.
- **Browse** — a chronological album of memory cards under a live
  together-timer. Category filters appear only for categories that have
  memories. Every location is a Google Maps link, using exact EXIF coordinates
  when the photo carried them.
- **Relive** — tapping a memory opens a gallery of all its photos: arrow keys
  on desktop, swipe on a phone.

## How It Works, End to End

```
   Camera roll (multi-select)
        │
   ┌────▼──────────────┐   exifr: date + GPS per photo
   │  read & group     │   → one draft card per calendar day
   └────┬──────────────┘   → location via OpenStreetMap (best-effort)
        │   you write one title + description per day
   ┌────▼──────────────┐   canvas re-encode, 2400px / JPEG q0.82
   │  compress         │   16.5MB → ~750KB, orientation fixed
   └────┬──────────────┘
        │   one photo per request (Vercel 4.5MB body cap)
   ┌────▼──────────────┐   POST /api/upload → stored URL
   │  upload           │   then POST /api/memories with the URLs
   └────┬──────────────┘
        │
   ┌────▼──────────────┐   Vercel Blob: memories.json + images
   │  the album        │   (local dev: .data/ + public/uploads/)
   └────┬──────────────┘
        │
   ┌────▼──────────────┐   chronological cards → lightbox gallery
   │  browse & relive  │   filters · map links · together-timer
   └───────────────────┘
```

The full architecture — every component, built and planned, with a data-flow
diagram — lives in [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md).

## Repository Map

| Dir | What |
|-----|------|
| `src/components/` | React client components — album page, import modal, lightbox, cards, timer |
| `src/lib/` | The logic — types + sorting, storage drivers, auth, EXIF/compression, day-grouping |
| `src/app/api/` | Route handlers — `auth` (password → cookie), `upload` (one image), `memories` (read/create) |
| `src/data/` | Seed memories — first-run only; the manifest is truth afterwards |
| `public/` | The original hardcoded photos (pre-upload era) |
| `docs/` | Design docs and the progress log (see [Documentation](#documentation)) |
| `.data/`, `public/uploads/` | Local dev storage — **git-ignored** |

## Design Principles

- **It's a gift first.** It has to just work when Trinity opens it — no broken
  states, no half-features. Anything shipped gets verified in the browser.
- **A memory is a day, not a photo.** One description per day is writing a
  person will actually finish; per-photo captions at hundreds of photos is how
  albums end up abandoned half-empty.
- **The browser does the work; the server stays thin.** EXIF, grouping,
  compression, and geocoding are client-side. The server authenticates, stores
  bytes, and appends to a JSON manifest.
- **No database.** A few hundred memories is a few hundred KB of JSON read
  once per load. Chosen over Supabase specifically because its free tier
  pauses after 7 idle days — fatal for a site visited occasionally.
- **Fail closed.** No `ALBUM_PASSWORD` in production means uploads are refused,
  never open. Reads are public; writes never are.
- **Keep the neutral design.** Settled decision: the writing is the loudest
  thing on the page. Functional and layout improvements welcome; no
  re-theming.

## Project Status

The authoritative log lives in [docs/05-progress.md](docs/05-progress.md).

| Stage | | |
|---|---|---|
| 0 · Static album | ✅ | Hardcoded photos, together-timer, map links (July 2025) |
| 1 · Persistent uploads | ✅ | Storage drivers, password auth, EXIF autofill — superseded by Stage 2 |
| 2 · Memories + bulk import | ✅ | Day-grouping, one-description-per-day, lightbox — verified locally |
| 3 · Ship | ✅ | Live at `anniversary-one-taupe.vercel.app`; real import verified in production |
| 4 · Manage | ✅ | Edit, remove-photo, delete — from the site, review-hardened |
| 5 · Mobile pass | ⬜ | **next** — Tailwind migration; inline styles can't hold media queries |
| 6 · Polish | ⬜ | Compress the 15MB seed PNGs, favicon, OG link preview |

## Quickstart

```bash
npm install
npm run dev        # local storage, no accounts needed; dev password: letmein
npx tsc --noEmit   # typecheck
npm run build      # production build
```

For production: create a Blob store in the Vercel dashboard (**Storage →
Create → Blob**, sets `BLOB_READ_WRITE_TOKEN` automatically) and add
`ALBUM_PASSWORD` under **Settings → Environment Variables**. Details:
[docs/04-deployment.md](docs/04-deployment.md).

## Documentation

Start with the system design; the rest are referenced as needed.

| Doc | What |
|---|---|
| [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) | Architecture, data-flow diagram, import trace, component inventory, decisions |
| [docs/01 — Implementation pipeline](docs/01-implementation-pipeline.md) | The staged build order, with exit criteria |
| [docs/02 — Data model](docs/02-data-model.md) | Memory/Photo types, the manifest, storage drivers |
| [docs/03 — Import spec](docs/03-import-spec.md) | EXIF, day-grouping, compression, geocoding, limits |
| [docs/04 — Deployment](docs/04-deployment.md) | Vercel + Blob setup, env vars, local dev storage |
| [docs/05 — Progress](docs/05-progress.md) | Living status log |

---

Built with ❤️ for my beautiful Princess!
