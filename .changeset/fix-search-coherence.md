---
'@muse/backend': patch
---

Fix the coherence gap where the discovery search drifted away from the brief (e.g. "Death Note-like
terminal" → unrelated results). The discovery prompt over-weighted refinements ("must strongly
influence results") and only quoted the brief once. Now the brief is anchored as the fixed SUBJECT,
read as a visual aesthetic (handling ambiguous words), with refinements explicitly sharpening it and
never replacing it — every result must still read as the brief. The proposition prompt is tethered
the same way, and its preview image must genuinely exemplify the sub-style's descriptor (so a pick by
sight matches what gets searched). Verified live: a Death-Note-terminal brief now returns consistently
on-theme references.
