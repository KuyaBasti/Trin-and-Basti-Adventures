# Deployment

Vercel hosting + Vercel Blob storage. The repo deploys on push to `main`
(`vercel.json`, `@vercel/next`).

## One-time setup (Vercel dashboard)

Uploads do not work in production until both exist:

1. **Storage → Create → Blob** — creates the store and sets
   `BLOB_READ_WRITE_TOKEN` on the project automatically.
2. **Settings → Environment Variables** — add `ALBUM_PASSWORD` (the shared
   secret Basti and Trinity type once per device).
3. Redeploy.

Fail-closed behavior: with no `ALBUM_PASSWORD` in production, `/api/auth`
returns 503 and uploads are refused for everyone. With no
`BLOB_READ_WRITE_TOKEN`, `getStorage()` falls back to the local-disk driver,
which on Vercel's read-only filesystem fails on write — the token isn't
optional in production.

## First-deploy verification (Stage 3 exit criteria)

The Blob driver has never run in production; the local driver exercised the
same interface but not the same code. After the first deploy:

- Import 5–10 photos **from a phone** on the production URL. This exercises
  the Blob driver, iOS HEIC→JPEG conversion, and the password cookie on
  mobile Safari in one pass.
- Hard-refresh: memories persist.
- Redeploy: memories persist (proves they're in Blob, not build output).

## Free-tier budget (Hobby plan, checked 2026-08-13)

| Resource | Limit | Our usage |
|---|---|---|
| Blob storage | 1GB | ~750KB/photo ⇒ ~1,300 photos; a few hundred planned |
| Data transfer | 10GB/mo | two regular viewers — far under |
| Request body | **4.5MB hard cap** | why upload is one photo per request |

Supabase was rejected for this project because its free tier **pauses after 7
idle days** — an occasionally-visited gift site would routinely be found dead.
If requirements ever outgrow Blob, the swap is one new driver in
`src/lib/storage.ts`.

## Local development

No accounts, no tokens, no network:

```bash
npm run dev    # password: letmein
```

- Manifest → `.data/memories.json`; images → `public/uploads/`. Both
  git-ignored; delete both to reset to the seed album.
- The dev server for browser verification is configured in
  `.claude/launch.json` (auto-port — port 3000 is often held by DotaAnalysis).

## Env vars (`.env.example`)

| Var | Dev | Prod |
|---|---|---|
| `ALBUM_PASSWORD` | optional (falls back to `letmein`) | **required** or uploads are disabled |
| `BLOB_READ_WRITE_TOKEN` | leave unset (local disk) | set by creating the Blob store |

## Known ops gaps

- No backup story for Blob beyond the store itself; `memories.json` is small —
  an occasional manual download is cheap insurance.

(Resolved 2026-08-13: the GitHub repo is renamed to
`KuyaBasti/Trin-and-Basti-Adventures` and the local remote now points at it.)
