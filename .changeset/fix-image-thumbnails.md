---
'@muse/backend': patch
'@muse/frontend': patch
---

Fix "some pictures aren't showing". The candidate grid loaded raw remote URLs directly, so the
browser hit image hosts with a localhost referer and got blocked, and any dead/stale link (the model
sometimes returns 404s) showed a broken icon. Now the grid (like the tray) loads through the backend
thumbnail proxy, which fetches server-side with a browser User-Agent + Accept and tolerates generic
`application/octet-stream` content-types (letting sharp validate the bytes). A shared `CandidateImage`
component shows a tidy "image unavailable" placeholder (with the source host) when an image genuinely
can't be loaded, instead of a broken-image icon.
