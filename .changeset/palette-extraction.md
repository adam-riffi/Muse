---
'@muse/backend': minor
---

Add deterministic palette extraction (`services/palette.ts`): aggregate node-vibrant
swatches across the kept images and assign role-tagged hexes (dominant / accent / neutral /
background). This is the determinism boundary — colors come from pixels only, never from the
VLM — so the same kept set always yields the same palette. Golden-fixture tests.
