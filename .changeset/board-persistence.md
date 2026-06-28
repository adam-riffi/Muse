---
'@muse/backend': minor
'@muse/frontend': minor
---

Add whiteboard persistence: `GET /board` and `POST /board` endpoints backed by the
session store, plus client `loadBoard`/`saveBoard`, a board-store `save()` action, and
debounced autosave wired into the Tldraw canvas (server-side portable save complements
tldraw's local IndexedDB restore). Completes Epic 4 — refine → discover → curate on the
whiteboard, end to end.
