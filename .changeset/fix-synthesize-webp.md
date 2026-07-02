---
'@muse/backend': patch
---

Fix "Synthesis failed with status 500": palette extraction crashed on **WebP** images because
node-vibrant's decoder (Jimp) can't read WebP/AVIF — and a dead/blocked kept link threw an
uncaught fetch error. Now every image is normalized to PNG via sharp before node-vibrant (an
undecodable image is skipped), and the synthesizer skips kept images that fail to fetch, failing
with a clear 400 only when none load. Verified live: a WebP board synthesizes (palette + analysis)
and a dead link is skipped.
