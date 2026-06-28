---
'@muse/backend': patch
---

Fix "Failed to parse Codex discovery output after one retry": the parser used a first-`[` heuristic,
so any bracket in the model's prose preamble (a markdown link like `[Unsplash](url)`, a citation, or a
stray example array) hijacked extraction and failed. Discovery and proposition parsing now scan EVERY
balanced JSON array in the message and use the first that yields valid items — recovering the real
array from prose preambles, ```json fences, wrapper objects (`{"results":[…]}`), and arrays of bare
URL strings. Only a genuine no-array response now triggers the retry/error.
