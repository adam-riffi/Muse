---
'@muse/backend': patch
'@muse/frontend': patch
---

Fix "export failed with status 413": the `/export` body carries the rasterized board PNG (base64),
which exceeds Fastify's 1 MB default body limit. Raise the server body limit to 50 MB, and on the
client omit the board PNG if it is extremely large (>~45 MB base64) so the rest of the bundle still
exports instead of failing.
