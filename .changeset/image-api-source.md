---
'@muse/backend': minor
'@muse/frontend': minor
---

Add an optional permissive image source as an alternative to the Codex websearch seam: a
provider interface with a keyless **Openverse** adapter (default) and an **Unsplash** adapter
behind `UNSPLASH_ACCESS_KEY`, selected via `IMAGE_SOURCE`. New `GET /images/search?q=&n=`
returns `ImageCandidate[]` and registers them in the session store (thumbnails work). Frontend
gains a `searchImages` client. All HTTP is mocked in tests — no network or secrets in CI.
